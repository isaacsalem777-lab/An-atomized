import { Component, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { Eye, EyeOff, Layers3, Maximize2, Rotate3D, RotateCcw } from 'lucide-react'
import { structures, type AnatomyStructure } from '../data/anatomy'

type Props = {
  system: string
  region: string
  challenge: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
}

type ObjAssetState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; model: THREE.Group }
  | { status: 'missing' | 'invalid' | 'network-error'; message: string }

type WebGLState =
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'unavailable'; message: string }

type BoneProps = {
  structure: AnatomyStructure
  source: THREE.Group
  selectedId: string | null
  onSelect: (id: string) => void
  wire: boolean
}

type AssetLoaderProps = {
  structure: AnatomyStructure
  retryVersion: number
  onStateChange: (id: string, state: ObjAssetState) => void
}

const sourceOffset: [number, number, number] = [0.66675, 136.94135, -1525.785]
const attribution = 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.'

function createInitialAssetStates(): Record<string, ObjAssetState> {
  const states: Record<string, ObjAssetState> = {}
  structures.forEach(({ id }) => { states[id] = { status: 'idle' } })
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

async function loadObjAsset(url: string, signal: AbortSignal): Promise<ObjAssetState> {
  let response: Response
  try {
    response = await fetch(url, { signal, cache: 'no-store' })
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

function AssetLoader({ structure, retryVersion, onStateChange }: AssetLoaderProps) {
  useEffect(() => {
    const controller = new AbortController()
    const url = `/assets/anatomy/bodyparts3d/${structure.meshId}.obj`
    onStateChange(structure.id, { status: 'loading' })

    void loadObjAsset(url, controller.signal).then((state) => {
      if (!controller.signal.aborted) onStateChange(structure.id, state)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      const detail = error instanceof Error ? error.message : 'The asset could not be loaded.'
      onStateChange(structure.id, { status: 'network-error', message: detail })
    })

    return () => controller.abort()
  }, [onStateChange, retryVersion, structure])
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

function Bone({ structure, source, selectedId, onSelect, wire }: BoneProps) {
  const [hovered, setHovered] = useState(false)
  const active = selectedId === structure.id
  const { object, materials } = useMemo(() => {
    const object = source.clone(true)
    const materials: THREE.MeshStandardMaterial[] = []

    object.name = structure.meshId
    object.userData = { fmaId: structure.fmaId, meshId: structure.meshId }
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return

      const material = new THREE.MeshStandardMaterial({
        color: '#c5c9bd',
        roughness: 0.82,
        side: THREE.DoubleSide,
      })
      child.name = structure.meshId
      child.userData = { ...child.userData, fmaId: structure.fmaId, meshId: structure.meshId }
      child.material = material
      child.castShadow = false
      child.receiveShadow = false
      materials.push(material)
    })

    return { object, materials }
  }, [source, structure])

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials])
  useEffect(() => {
    materials.forEach((material) => {
      material.color.set(active ? '#9dd8d3' : hovered ? '#d9e5dd' : '#c5c9bd')
      material.emissive.set(active ? '#245e5b' : '#000000')
      material.emissiveIntensity = active ? 0.55 : 0
      if (material.wireframe !== wire) {
        material.wireframe = wire
        material.needsUpdate = true
      }
    })
  }, [active, hovered, materials, wire])

  return <group
    name={structure.meshId}
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
  models: { structure: AnatomyStructure; model: THREE.Group }[]
  selectedId: string | null
  onSelect: (id: string) => void
  wire: boolean
}) {
  // Convert the source's Z-up millimeter coordinates to the scene's Y-up centimeter scale.
  return <group scale={0.01} rotation={[-Math.PI / 2, 0, 0]}>
    <group position={sourceOffset}>
      {models.map(({ structure, model }) => <Bone
        key={structure.id}
        structure={structure}
        source={model}
        selectedId={selectedId}
        onSelect={onSelect}
        wire={wire}
      />)}
    </group>
  </group>
}

function isFailure(state: ObjAssetState) {
  return state.status === 'missing' || state.status === 'invalid' || state.status === 'network-error'
}

function failureLabel(state: ObjAssetState) {
  if (state.status === 'missing') return 'Missing asset'
  if (state.status === 'invalid') return 'Invalid model data'
  return 'Network error'
}

export default function Viewport({ system, region, challenge, selectedId, onSelect }: Props) {
  const [wire, setWire] = useState(false)
  const [labels, setLabels] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [zoom, setZoom] = useState(4.7)
  const [webgl, setWebgl] = useState<WebGLState>({ status: 'checking' })
  const [assetStates, setAssetStates] = useState(createInitialAssetStates)
  const [retryVersions, setRetryVersions] = useState<Record<string, number>>({})
  const selected = structures.find((structure) => structure.id === selectedId)
  const updateAssetState = useCallback((id: string, state: ObjAssetState) => {
    setAssetStates((current) => ({ ...current, [id]: state }))
  }, [])
  const handleRendererError = useCallback((error: Error) => {
    setWebgl({
      status: 'unavailable',
      message: `The browser found WebGL 2 support, but the 3D renderer could not initialize (${error.message}).`,
    })
  }, [])

  useEffect(() => setWebgl(detectWebGL2()), [])

  const readyModels = structures.flatMap((structure) => {
    const state = assetStates[structure.id]
    return state.status === 'ready' ? [{ structure, model: state.model }] : []
  })
  const failures = structures.filter((structure) => isFailure(assetStates[structure.id]))
  const pendingCount = structures.filter((structure) => {
    const status = assetStates[structure.id].status
    return status === 'idle' || status === 'loading'
  }).length
  const readyCount = readyModels.length
  const topStatus = webgl.status === 'checking'
    ? 'CHECKING WEBGL 2'
    : webgl.status === 'unavailable'
      ? '3D RENDERING UNAVAILABLE'
      : failures.length > 0
        ? `${readyCount}/6 MESHES · ${failures.length} FAILED`
        : pendingCount > 0
          ? `LOADING MODELS ${readyCount}/6`
          : 'BODY PARTS3D · 6 SEGMENTS'
  const retryFailedAssets = () => {
    setRetryVersions((current) => {
      const next = { ...current }
      failures.forEach(({ id }) => { next[id] = (next[id] ?? 0) + 1 })
      return next
    })
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
      <div className="viewport-breadcrumb"><span className="live-dot" /> 3D WORKSPACE <span className="slash">/</span> {system.toUpperCase()} <span className="slash">/</span> {region.toUpperCase()}</div>
      <div className="viewport-top-actions"><span className={`asset-status ${webgl.status === 'unavailable' || failures.length > 0 ? 'asset-unavailable' : 'asset-live'}`}><i /> {topStatus}</span><button className="icon-button" aria-label="Reset camera" onClick={() => {setResetKey(value => value + 1); setZoom(4.7)}} disabled={webgl.status !== 'available'}><Maximize2 size={16}/></button></div>
    </div>
    <div
      className="model-stage three-stage"
      data-webgl-state={webgl.status}
      data-ready-count={readyCount}
      data-model-ready={webgl.status === 'available' && readyCount === structures.length}
    >
      <div className="stage-grid" />
      {webgl.status === 'available' ? <>
        {structures.map((structure) => <AssetLoader
          key={structure.id}
          structure={structure}
          retryVersion={retryVersions[structure.id] ?? 0}
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
            <color attach="background" args={['#0c141a']} />
            <ambientLight intensity={1.25}/>
            <directionalLight position={[4,5,6]} intensity={2.3} color="#e2f0e8"/>
            <directionalLight position={[-4,1,3]} intensity={1.1} color="#78b6bd"/>
            <pointLight position={[0,-2,4]} intensity={0.65} color="#d3c6a8"/>
            <CameraDistance key={`camera-${resetKey}`} distance={zoom}/>
            <SkullModel models={readyModels} selectedId={selectedId} onSelect={onSelect} wire={wire}/>
            <OrbitControls key={`controls-${resetKey}`} makeDefault enableDamping dampingFactor={0.08} minDistance={3.1} maxDistance={8.5} target={[0,0,0]} />
          </Canvas>
        </RendererErrorBoundary>
        {labels && <div className="model-label bodyparts-label"><span/> SEGMENTED BONES</div>}
        <div className="viewport-caption">
          <span title={attribution}>BodyParts3D · CC BY 4.0</span>
          <span>SELECTED CRANIAL BONES · NOT FOR CLINICAL USE</span>
        </div>
        <div className="view-controls">
          <button onClick={() => {setResetKey(value => value + 1); setZoom(4.7)}} title="Reset camera"><RotateCcw size={15}/></button>
          <span className="control-divider"/>
          <button onClick={() => setZoom(value => Math.max(3.1, value - 0.35))} title="Zoom in">＋</button><button onClick={() => setZoom(value => Math.min(8.5, value + 0.35))} title="Zoom out">−</button>
          <span className="control-divider"/>
          <button className={wire ? 'active' : ''} onClick={() => setWire(value => !value)} title="Toggle wireframe"><Layers3 size={15}/></button>
          <button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)} title="Toggle labels">{labels ? <Eye size={15}/> : <EyeOff size={15}/>}</button>
          <span className="control-divider"/><span className="orbit-indicator"><Rotate3D size={14}/></span>
        </div>
      </> : webglFallback}
    </div>
    <div className={`viewport-footer ${showLoadStatus || webgl.status !== 'available' ? 'viewport-footer-status' : ''}`}>
      {webgl.status === 'checking' && <span className="model-status" role="status">Checking WebGL 2 support…</span>}
      {webgl.status === 'unavailable' && <span className="model-status" role="status">The 3D viewport is unavailable.</span>}
      {showLoadStatus && failures.length === 0 && <span className="model-status" role="status">Loading anatomical meshes: {readyCount} of {structures.length} ready.</span>}
      {showLoadStatus && failures.length > 0 && <div className="model-status model-status-error" role="alert">
        <span>
          {readyCount} of {structures.length} meshes loaded; {failures.length} unavailable.
          {readyCount > 0 ? ' Loaded bones remain interactive.' : ' No bone meshes are available.'}
          {pendingCount > 0 ? ` ${pendingCount} still loading.` : ''}
        </span>
        <ul className="model-error-list">
          {failures.map((structure) => {
            const state = assetStates[structure.id]
            return <li key={structure.id}><strong>{structure.name} ({structure.meshId})</strong>: {failureLabel(state)} — {state.status === 'missing' || state.status === 'invalid' || state.status === 'network-error' ? state.message : ''}</li>
          })}
        </ul>
        <button className="tool-button" onClick={retryFailedAssets}>Retry failed meshes</button>
      </div>}
      {webgl.status === 'available' && !showLoadStatus && <>
        <span><kbd>DRAG</kbd> ORBIT</span><span><kbd>SCROLL</kbd> ZOOM</span><span><kbd>RIGHT DRAG</kbd> PAN</span><span className="footer-right">CAMERA · ORBIT CONTROLS</span>
      </>}
    </div>
    {challenge && <div className="challenge-overlay"><span className="challenge-kicker">ACTIVE IDENTIFICATION</span><strong>Click a bone on the 3D model.</strong><span>Selected: {selected?.name ?? 'None'}</span></div>}
  </section>
}
