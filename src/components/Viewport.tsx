import { Component, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { Eye, EyeOff, Layers3, Rotate3D, RotateCcw } from 'lucide-react'
import { anatomyCatalog, type AnatomyId, type AnatomyStructure, type MeshAssociation } from '../data/anatomy'

type Props = {
  selectedId: AnatomyId | null
  onSelect: (id: AnatomyId | null) => void
  visibleStructureIds: ReadonlySet<AnatomyId>
  matchedStructureCount: number
  hiddenCount: number
  isolationId: AnatomyId | null
  transparencyById: Partial<Record<AnatomyId, number>>
}

type MeshAssetState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; model: THREE.Group }
  | { status: 'missing' | 'invalid' | 'network-error' | 'unsupported'; message: string }

type WebGLState =
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'unavailable'; message: string }

type BoneProps = {
  structure: AnatomyStructure
  association: MeshAssociation
  source: THREE.Group
  selectedId: AnatomyId | null
  onSelect: (id: AnatomyId) => void
  wire: boolean
  transparency: number
}

type AssetLoaderProps = {
  association: MeshAssociation
  retryVersion: number
  onStateChange: (id: string, state: MeshAssetState) => void
}

const sourceOffset: [number, number, number] = [0.66675, 136.94135, -1525.785]
const attribution = 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.'

function createInitialAssetStates(): Record<string, MeshAssetState> {
  const states: Record<string, MeshAssetState> = {}
  anatomyCatalog.meshAssociationsById.forEach((_record, id) => { states[id] = { status: 'idle' } })
  return states
}

function detectWebGL2(): WebGLState {
  try {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) {
      return { status: 'unavailable', message: 'This browser or device did not provide a WebGL 2 context.' }
    }

    context.getExtension('WEBGL_lose_context')?.loseContext()
    return { status: 'available' }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'The WebGL 2 check failed.'
    return { status: 'unavailable', message: detail }
  }
}

function validateObjModel(model: THREE.Group): string | null {
  let meshCount = 0
  let invalidGeometry = false

  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    meshCount += 1

    const positions = object.geometry.getAttribute('position')
    if (!positions || positions.count < 3) {
      invalidGeometry = true
      return
    }

    const elementCount = object.geometry.index?.count ?? positions.count
    if (elementCount < 3 || elementCount % 3 !== 0) {
      invalidGeometry = true
      return
    }

    for (let index = 0; index < positions.count; index += 1) {
      if (![positions.getX(index), positions.getY(index), positions.getZ(index)].every(Number.isFinite)) {
        invalidGeometry = true
        return
      }
    }
  })

  if (meshCount === 0) return 'No triangle meshes were found in the OBJ data.'
  if (invalidGeometry) return 'The OBJ contains empty, incomplete, or non-finite mesh geometry.'
  return null
}

async function loadMeshAsset(association: MeshAssociation, signal: AbortSignal): Promise<MeshAssetState> {
  if (association.format !== 'obj') {
    return { status: 'unsupported', message: `The ${association.format.toUpperCase()} loader is not available yet.` }
  }

  let response: Response
  try {
    response = await fetch(association.url, { signal, cache: 'no-store' })
  } catch (error) {
    if (signal.aborted) throw error
    const detail = error instanceof Error ? error.message : 'The network request failed.'
    return { status: 'network-error', message: detail }
  }

  if (response.status === 404) {
    return { status: 'missing', message: 'The asset request returned HTTP 404.' }
  }
  if (!response.ok) {
    return { status: 'network-error', message: `The asset request returned HTTP ${response.status}.` }
  }

  let content: string
  try {
    content = await response.text()
  } catch (error) {
    if (signal.aborted) throw error
    const detail = error instanceof Error ? error.message : 'The response could not be read.'
    return { status: 'network-error', message: detail }
  }

  const trimmedContent = content.trimStart()
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (contentType.includes('text/html') || /^<!doctype html|^<html\b/i.test(trimmedContent)) {
    return { status: 'missing', message: 'The asset path returned an HTML page instead of an OBJ file.' }
  }
  if (!trimmedContent) {
    return { status: 'invalid', message: 'The OBJ file is empty.' }
  }

  try {
    const model = new OBJLoader().parse(content)
    const validationError = validateObjModel(model)
    if (validationError) return { status: 'invalid', message: validationError }
    return { status: 'ready', model }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'The OBJ parser rejected the data.'
    return { status: 'invalid', message: detail }
  }
}

function AssetLoader({ association, retryVersion, onStateChange }: AssetLoaderProps) {
  useEffect(() => {
    const controller = new AbortController()
    onStateChange(association.id, { status: 'loading' })

    void loadMeshAsset(association, controller.signal).then((state) => {
      if (!controller.signal.aborted) onStateChange(association.id, state)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      const detail = error instanceof Error ? error.message : 'The asset could not be loaded.'
      onStateChange(association.id, { status: 'network-error', message: detail })
    })

    return () => controller.abort()
  }, [association, onStateChange, retryVersion])
  return null
}

type RendererBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
  onError: (error: Error) => void
}

class RendererErrorBoundary extends Component<RendererBoundaryProps, { error: Error | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    return this.state.error ? this.props.fallback : this.props.children
  }
}

function CameraDistance({ distance }: { distance: number }) {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 0.05, distance)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, distance])
  return null
}

function Bone({ structure, association, source, selectedId, onSelect, wire, transparency }: BoneProps) {
  const [hovered, setHovered] = useState(false)
  const active = selectedId === structure.id
  const { object, materials } = useMemo(() => {
    const object = source.clone(true)
    const materials: THREE.MeshStandardMaterial[] = []
    const externalIds = structure.externalIds ?? []
    const fmaId = externalIds.find(({ system }) => system === 'FMA')?.identifier
    const anatomyUserData = {
      anatomyId: structure.id,
      meshAssociationId: association.id,
      assetSource: association.source,
      sourceMeshId: association.sourceMeshId,
      meshId: association.sourceMeshId,
      externalIds,
      ...(fmaId ? { fmaId } : {}),
    }

    object.name = association.id
    object.userData = { ...object.userData, ...anatomyUserData }
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return

      const material = new THREE.MeshStandardMaterial({
        color: '#d8dcd5',
        roughness: 0.76,
        side: THREE.DoubleSide,
      })
      child.name = association.id
      child.userData = { ...child.userData, ...anatomyUserData }
      child.material = material
      child.castShadow = false
      child.receiveShadow = false
      materials.push(material)
    })

    return { object, materials }
  }, [association, source, structure])

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials])
  useEffect(() => {
    materials.forEach((material) => {
      material.color.set(active ? '#a9eff1' : hovered ? '#f0f4fa' : '#d8dcd5')
      material.emissive.set(active ? '#154a52' : '#000000')
      material.emissiveIntensity = active ? transparency <= 40 ? 0.7 : 0.42 : 0
      material.opacity = transparency / 100
      material.depthWrite = transparency === 100
      if (material.transparent !== (transparency < 100)) {
        material.transparent = transparency < 100
        material.needsUpdate = true
      }
      if (material.wireframe !== wire) {
        material.wireframe = wire
        material.needsUpdate = true
      }
    })
  }, [active, hovered, materials, transparency, wire])

  return <group
    name={association.id}
    onClick={(event) => {
      event.stopPropagation()
      onSelect(structure.id)
    }}
    onPointerOver={(event) => {
      event.stopPropagation()
      setHovered(true)
      document.body.style.cursor = 'pointer'
    }}
    onPointerOut={() => {
      setHovered(false)
      document.body.style.cursor = 'auto'
    }}
  >
    <primitive object={object} dispose={null}/>
  </group>
}

function SkullModel({ models, selectedId, onSelect, wire }: {
  models: { structure: AnatomyStructure; association: MeshAssociation; model: THREE.Group; transparency: number }[]
  selectedId: AnatomyId | null
  onSelect: (id: AnatomyId) => void
  wire: boolean
}) {
  // Convert the source's Z-up millimeter coordinates to the scene's Y-up centimeter scale.
  return <group scale={0.01} rotation={[-Math.PI / 2, 0, 0]}>
    <group position={sourceOffset}>
      {models.map(({ structure, association, model, transparency }) => <Bone
        key={association.id}
        structure={structure}
        association={association}
        source={model}
        selectedId={selectedId}
        onSelect={onSelect}
        wire={wire}
        transparency={transparency}
      />)}
    </group>
  </group>
}

function isFailure(state: MeshAssetState) {
  return state.status === 'missing' || state.status === 'invalid' || state.status === 'network-error' || state.status === 'unsupported'
}

function failureLabel(state: MeshAssetState) {
  if (state.status === 'missing') return 'Missing asset'
  if (state.status === 'invalid') return 'Invalid model data'
  if (state.status === 'unsupported') return 'Unsupported asset format'
  return 'Network error'
}

export default function Viewport({
  selectedId,
  onSelect,
  visibleStructureIds,
  matchedStructureCount,
  hiddenCount,
  isolationId,
  transparencyById,
}: Props) {
  const [wire, setWire] = useState(false)
  const [labels, setLabels] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [zoom, setZoom] = useState(4.7)
  const [webgl, setWebgl] = useState<WebGLState>({ status: 'checking' })
  const [assetStates, setAssetStates] = useState(createInitialAssetStates)
  const [retryVersions, setRetryVersions] = useState<Record<string, number>>({})
  const updateAssetState = useCallback((id: string, state: MeshAssetState) => {
    setAssetStates((current) => ({ ...current, [id]: state }))
  }, [])
  const handleRendererError = useCallback((error: Error) => {
    setWebgl({
      status: 'unavailable',
      message: `The browser found WebGL 2 support, but the 3D renderer could not initialize (${error.message}).`,
    })
  }, [])

  useEffect(() => setWebgl(detectWebGL2()), [])

  const loadedModels = Object.entries(assetStates).flatMap(([associationId, state]) => {
    const record = anatomyCatalog.meshAssociationsById.get(associationId)
    return state.status === 'ready' && record
      ? [{ ...record, model: state.model }]
      : []
  })
  const readyModels = loadedModels
    .filter(({ structure }) => visibleStructureIds.has(structure.id))
    .map(record => ({ ...record, transparency: transparencyById[record.structure.id] ?? 100 }))
  const failures = Array.from(anatomyCatalog.meshAssociationsById.values()).flatMap((record) => {
    const state = assetStates[record.association.id]
    return isFailure(state) ? [{ ...record, state }] : []
  })
  const pendingCount = Object.values(assetStates).filter((state) => state.status === 'idle' || state.status === 'loading').length
  const readyCount = loadedModels.length
  const meshCount = anatomyCatalog.meshAssociationsById.size
  const topStatus = webgl.status === 'checking'
    ? 'Checking WebGL 2'
    : webgl.status === 'unavailable'
      ? '3D rendering unavailable'
      : failures.length > 0
        ? `${readyCount} of ${meshCount} meshes · ${failures.length} failed`
        : pendingCount > 0
          ? `Loading models ${readyCount}/${meshCount}`
          : `BodyParts3D · ${meshCount} segments`
  const retryFailedAssets = () => {
    setRetryVersions((current) => {
      const next = { ...current }
      failures.forEach(({ association }) => {
        next[association.id] = (next[association.id] ?? 0) + 1
      })
      return next
    })
  }
  const adjustZoom = (amount: number) => {
    setZoom(distance => Math.min(8.5, Math.max(3.1, Number((distance + amount).toFixed(2)))))
  }
  const showLoadStatus = webgl.status === 'available' && (pendingCount > 0 || failures.length > 0)
  const webglFallback = webgl.status === 'unavailable'
    ? <div className="model-render-fallback" role="alert">
      <strong>3D rendering is unavailable</strong>
      <p>{webgl.message}</p>
      <p>Enable browser hardware acceleration or use a browser with WebGL 2 support.</p>
      <button className="tool-button" onClick={() => window.location.reload()}>Reload page</button>
    </div>
    : <div className="model-render-fallback" role="status">Checking WebGL 2 support…</div>

  return <section className="viewport">
    <div className="viewport-top">
      <div className="viewport-breadcrumb"><span className="live-dot" /> 3D viewport</div>
      <div className="viewport-top-actions"><span className={`asset-status ${webgl.status === 'unavailable' || failures.length > 0 ? 'asset-unavailable' : 'asset-live'}`}><i /> {topStatus}</span></div>
    </div>
    <div
      className="model-stage three-stage"
      data-webgl-state={webgl.status}
      data-ready-count={readyCount}
      data-visible-count={visibleStructureIds.size}
      data-selected-id={selectedId ?? ''}
      data-isolation-id={isolationId ?? ''}
      data-camera-distance={zoom}
      data-model-ready={webgl.status === 'available' && readyCount === meshCount}
    >
      <div className="atrium-environment" aria-hidden="true">
        <div className="atrium-ceiling"/>
        <div className="atrium-wall-left"/>
        <div className="atrium-wall-right"/>
        <div className="atrium-floor"><div className="atrium-floor-lines"/></div>
        <div className="atrium-seam atrium-seam-left"/>
        <div className="atrium-seam atrium-seam-right"/>
      </div>
      {isolationId && <div className="scene-mode-indicator" role="status">Isolated: {anatomyCatalog.structuresById.get(isolationId)?.name}</div>}
      {!isolationId && hiddenCount > 0 && <div className="scene-mode-indicator scene-hidden-indicator" role="status">{hiddenCount} structure{hiddenCount === 1 ? '' : 's'} hidden</div>}
      {webgl.status === 'available' && visibleStructureIds.size === 0 && <div className="model-filter-empty" role="status">
        {matchedStructureCount === 0 ? 'No structures match the selected filters.' : 'All matching structures are hidden.'}
      </div>}
      {webgl.status === 'available' ? <>
        {Array.from(anatomyCatalog.meshAssociationsById.values(), ({ association }) => <AssetLoader
          key={association.id}
          association={association}
          retryVersion={retryVersions[association.id] ?? 0}
          onStateChange={updateAssetState}
        />)}
        <RendererErrorBoundary
          onError={handleRendererError}
          fallback={<div className="model-render-fallback" role="alert">
            <strong>3D rendering could not start</strong>
            <p>Reload the page or enable browser hardware acceleration.</p>
            <button className="tool-button" onClick={() => window.location.reload()}>Reload page</button>
          </div>}
        >
          <Canvas
            camera={{ position: [0, 0.05, 4.7], fov: 37 }}
            dpr={[1, 1.8]}
            gl={{ antialias: true, alpha: true }}
            onPointerMissed={() => onSelect(null)}
          >
            <hemisphereLight color="#f0f4fa" groundColor="#172238" intensity={1.05}/>
            <ambientLight intensity={0.5}/>
            <directionalLight position={[4,5,6]} intensity={2.15} color="#f0f4fa"/>
            <directionalLight position={[-4,1,3]} intensity={0.7} color="#7899ff"/>
            <pointLight position={[0,-2,4]} intensity={0.42} color="#4ed7e5"/>
            <CameraDistance key={`camera-${resetKey}`} distance={zoom}/>
            <SkullModel models={readyModels} selectedId={selectedId} onSelect={onSelect} wire={wire}/>
            <OrbitControls key={`controls-${resetKey}`} makeDefault enableDamping dampingFactor={0.08} minDistance={3.1} maxDistance={8.5} target={[0,0,0]} />
          </Canvas>
        </RendererErrorBoundary>
        {labels && <div className="model-label bodyparts-label"><span/> Six skull bones</div>}
        <div className="view-controls">
          <button aria-label="Reset camera" onClick={() => {setResetKey(value => value + 1); setZoom(4.7)}} title="Reset camera"><RotateCcw size={15}/></button>
          <span className="control-divider"/>
          <button aria-label="Zoom in" onClick={() => adjustZoom(-0.35)} title="Zoom in">＋</button><button aria-label="Zoom out" onClick={() => adjustZoom(0.35)} title="Zoom out">−</button>
          <span className="control-divider"/>
          <button className={wire ? 'active' : ''} aria-label="Toggle wireframe" aria-pressed={wire} onClick={() => setWire(value => !value)} title="Toggle wireframe"><Layers3 size={15}/></button>
          <button className={labels ? 'active' : ''} aria-label="Toggle labels" aria-pressed={labels} onClick={() => setLabels(value => !value)} title="Toggle labels">{labels ? <Eye size={15}/> : <EyeOff size={15}/>}</button>
          <span className="control-divider"/><span className="orbit-indicator"><Rotate3D size={14}/></span>
        </div>
      </> : webglFallback}
    </div>
    <div className={`viewport-footer ${showLoadStatus || webgl.status !== 'available' ? 'viewport-footer-status' : ''}`}>
      {webgl.status === 'checking' && <span className="model-status" role="status">Checking WebGL 2 support…</span>}
      {webgl.status === 'unavailable' && <span className="model-status" role="status">The 3D viewport is unavailable.</span>}
      {webgl.status === 'available' && <div className="viewport-caption">
        <span title={attribution}>BodyParts3D · CC BY 4.0</span>
        <span>Six-bone skull subset · not a complete skull or full-body model</span>
      </div>}
      {showLoadStatus && failures.length === 0 && <span className="model-status" role="status">Loading anatomical meshes: {readyCount} of {meshCount} ready.</span>}
      {showLoadStatus && failures.length > 0 && <div className="model-status model-status-error" role="alert">
        <span>
          {readyCount} of {meshCount} meshes loaded; {failures.length} unavailable.
          {readyCount > 0 ? ' Loaded bones remain interactive.' : ' No bone meshes are available.'}
          {pendingCount > 0 ? ` ${pendingCount} still loading.` : ''}
        </span>
        <ul className="model-error-list">
          {failures.map(({ structure, association, state }) => {
            return <li key={association.id}><strong>{structure.name} ({association.sourceMeshId})</strong>: {failureLabel(state)} — {state.status === 'missing' || state.status === 'invalid' || state.status === 'network-error' || state.status === 'unsupported' ? state.message : ''}</li>
          })}
        </ul>
        <button className="tool-button" onClick={retryFailedAssets}>Retry failed meshes</button>
      </div>}
      {webgl.status === 'available' && !showLoadStatus && <>
        <span className="viewport-hint"><kbd>DRAG</kbd> ORBIT</span><span className="viewport-hint"><kbd>SCROLL</kbd> ZOOM</span><span className="viewport-hint"><kbd>RIGHT DRAG</kbd> PAN</span><span className="footer-right">CAMERA · ORBIT CONTROLS</span>
      </>}
    </div>
  </section>
}
