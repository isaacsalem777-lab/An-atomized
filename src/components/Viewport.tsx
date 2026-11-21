import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Eye, EyeOff, Layers3, Rotate3D, RotateCcw } from 'lucide-react'
import { anatomyCatalog, structures, type AnatomyId, type AnatomyStructure, type MeshAssociation } from '../data/anatomy'
import { disposeModelResources } from '../utils/disposeModelResources'

type Props = {
  selectedId: AnatomyId | null
  onSelect: (id: AnatomyId | null) => void
  fitStructureIds: ReadonlySet<AnatomyId>
  visibleStructureIds: ReadonlySet<AnatomyId>
  matchedStructureCount: number
  hiddenCount: number
  isolationId: AnatomyId | null
  opacityById: Partial<Record<AnatomyId, number>>
}

export type SkeletonAssetState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; model: THREE.Group; meshesBySourceId: ReadonlyMap<string, THREE.Mesh> }
  | { status: 'missing' | 'invalid' | 'network-error'; message: string }

type WebGLState =
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'unavailable'; message: string }

export type SkeletonMesh = {
  structure: AnatomyStructure
  association: MeshAssociation
  source: THREE.Mesh
}

type BoneProps = SkeletonMesh & {
  selectedId: AnatomyId | null
  onSelect: (id: AnatomyId) => void
  wire: boolean
  opacity: number
  highlightIds: ReadonlySet<AnatomyId>
  highlightColor: string
  highlightOpacity: number
  interactive: boolean
}

export type AssetLoaderProps = {
  retryVersion: number
  onStateChange: (state: SkeletonAssetState) => void
}

export type RendererBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
  onError: (error: Error) => void
}

const skeletonAssetUrl = '/assets/anatomy/bodyparts3d/skeleton-3.0/skeleton.glb'
const skeletonRecordsBySourceId = new Map(
  Array.from(anatomyCatalog.meshAssociationsById.values(), (record) => [record.association.sourceMeshId, record] as const),
)

function validateSkeletonModel(model: THREE.Group): { message: string } | { meshesBySourceId: ReadonlyMap<string, THREE.Mesh> } {
  const meshesBySourceId = new Map<string, THREE.Mesh>()
  let meshCount = 0
  let validationMessage: string | null = null

  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    meshCount += 1

    const sourceId = object.userData.structureId
    if (typeof sourceId !== 'string') {
      validationMessage ??= `The GLB contains a mesh without a structure ID (${object.name || 'unnamed mesh'}).`
      return
    }

    const record = skeletonRecordsBySourceId.get(sourceId)
    if (!record) {
      validationMessage ??= `The GLB contains unknown structure "${sourceId}".`
      return
    }

    const expectedExternalId = record.structure.externalIds?.[0]?.identifier
    if (object.userData.fma !== expectedExternalId) {
      validationMessage ??= `The GLB identifier for "${sourceId}" does not match the anatomy catalog.`
      return
    }
    if (meshesBySourceId.has(sourceId)) {
      validationMessage ??= `The GLB contains duplicate structure "${sourceId}".`
      return
    }

    const positions = object.geometry.getAttribute('position')
    if (!positions || positions.count < 3) {
      validationMessage ??= `The GLB structure "${sourceId}" has no usable vertex geometry.`
      return
    }

    const indices = object.geometry.index
    const elementCount = indices?.count ?? positions.count
    if (elementCount < 3 || elementCount % 3 !== 0) {
      validationMessage ??= `The GLB structure "${sourceId}" has incomplete triangle geometry.`
      return
    }
    for (let index = 0; index < positions.count; index += 1) {
      if (![positions.getX(index), positions.getY(index), positions.getZ(index)].every(Number.isFinite)) {
        validationMessage ??= `The GLB structure "${sourceId}" contains non-finite vertex data.`
        return
      }
    }
    if (indices) {
      for (let index = 0; index < indices.count; index += 1) {
        if (indices.getX(index) >= positions.count) {
          validationMessage ??= `The GLB structure "${sourceId}" contains an out-of-range vertex index.`
          return
        }
      }
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material]
    if (materials.some((material) => !(material instanceof THREE.MeshStandardMaterial))) {
      validationMessage ??= `The GLB structure "${sourceId}" uses an unsupported material.`
      return
    }

    meshesBySourceId.set(sourceId, object)
  })

  if (validationMessage) return { message: validationMessage }
  const expectedMeshCount = anatomyCatalog.meshAssociationsById.size
  if (meshCount !== expectedMeshCount || meshesBySourceId.size !== expectedMeshCount) {
    return { message: `Expected ${expectedMeshCount} selectable source meshes, but found ${meshCount}.` }
  }
  return { meshesBySourceId }
}

export async function loadSkeletonAsset(signal: AbortSignal): Promise<SkeletonAssetState> {
  let response: Response
  try {
    response = await fetch(skeletonAssetUrl, { signal, cache: 'no-store' })
  } catch (error) {
    if (signal.aborted) throw error
    return {
      status: 'network-error',
      message: error instanceof Error ? error.message : 'The model request failed.',
    }
  }

  if (response.status === 404) {
    return { status: 'missing', message: 'The model request returned HTTP 404.' }
  }
  if (!response.ok) {
    return { status: 'network-error', message: `The model request returned HTTP ${response.status}.` }
  }
  if (response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
    return { status: 'missing', message: 'The model path returned an HTML page instead of a GLB file.' }
  }

  let content: ArrayBuffer
  try {
    content = await response.arrayBuffer()
  } catch (error) {
    if (signal.aborted) throw error
    return {
      status: 'network-error',
      message: error instanceof Error ? error.message : 'The model response could not be read.',
    }
  }
  if (content.byteLength < 12 || new DataView(content).getUint32(0, true) !== 0x46546c67) {
    return { status: 'invalid', message: 'The model response is not a valid binary glTF file.' }
  }

  let model: THREE.Group
  try {
    model = (await new GLTFLoader().parseAsync(content, '')).scene
  } catch (error) {
    return {
      status: 'invalid',
      message: error instanceof Error ? error.message : 'The GLB parser rejected the model data.',
    }
  }

  const validation = validateSkeletonModel(model)
  if ('message' in validation) {
    disposeModelResources(model)
    return { status: 'invalid', message: validation.message }
  }
  return { status: 'ready', model, meshesBySourceId: validation.meshesBySourceId }
}

export function AssetLoader({ retryVersion, onStateChange }: AssetLoaderProps) {
  useEffect(() => {
    const controller = new AbortController()
    onStateChange({ status: 'loading' })

    void loadSkeletonAsset(controller.signal).then((state) => {
      if (controller.signal.aborted) {
        if (state.status === 'ready') disposeModelResources(state.model)
        return
      }
      onStateChange(state)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      onStateChange({
        status: 'network-error',
        message: error instanceof Error ? error.message : 'The model could not be loaded.',
      })
    })

    return () => controller.abort()
  }, [onStateChange, retryVersion])
  return null
}

export class RendererErrorBoundary extends Component<RendererBoundaryProps, { error: Error | null }> {
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

function CameraDistance({ distance, target, smooth = false }: { distance: number; target: THREE.Vector3; smooth?: boolean }) {
  const { camera } = useThree()
  const destination = useMemo(() => new THREE.Vector3(target.x, target.y, target.z + distance), [distance, target])
  const animating = useRef(false)

  useEffect(() => {
    if (!smooth) {
      camera.position.copy(destination)
      camera.lookAt(target)
      camera.updateProjectionMatrix()
      animating.current = false
      return
    }
    animating.current = true
  }, [camera, destination, smooth, target])

  useFrame((_, delta) => {
    if (!animating.current) return
    camera.position.lerp(destination, 1 - Math.exp(-7 * delta))
    camera.lookAt(target)
    if (camera.position.distanceTo(destination) < 0.002) {
      camera.position.copy(destination)
      animating.current = false
    }
  })
  return null
}

function CameraProjectionZoom({ zoom }: { zoom: number }) {
  const { camera } = useThree()
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return
    camera.zoom = 1 / zoom
    camera.updateProjectionMatrix()
  }, [camera, zoom])
  return null
}

const noAnatomyIds: ReadonlySet<AnatomyId> = new Set()

function Bone({
  structure,
  association,
  source,
  selectedId,
  onSelect,
  wire,
  opacity,
  highlightIds,
  highlightColor,
  highlightOpacity,
  interactive,
}: BoneProps) {
  const [hovered, setHovered] = useState(false)
  const selected = selectedId === structure.id
  const highlighted = selected || highlightIds.has(structure.id)
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

      const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material]
      const clonedMaterials = sourceMaterials.map((sourceMaterial) => {
        if (sourceMaterial instanceof THREE.MeshStandardMaterial) {
          return sourceMaterial.clone()
        }
        return new THREE.MeshStandardMaterial().copy(sourceMaterial)
      })
      child.name = association.id
      child.userData = { ...child.userData, ...anatomyUserData }
      child.material = Array.isArray(child.material)
        ? clonedMaterials
        : clonedMaterials[0] ?? new THREE.MeshStandardMaterial()
      child.castShadow = false
      child.receiveShadow = false
      materials.push(...clonedMaterials)
    })

    return { object, materials }
  }, [association, source, structure])

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials])
  useEffect(() => {
    materials.forEach((material) => {
      const currentOpacity = highlighted && !selected ? highlightOpacity : opacity / 100
      material.color.set(selected ? '#a9eff1' : highlighted ? highlightColor : hovered ? '#f0f4fa' : '#d8dcd5')
      material.emissive.set(selected ? '#154a52' : highlighted ? highlightColor : '#000000')
      material.emissiveIntensity = selected ? opacity <= 40 ? 0.7 : 0.42 : highlighted ? 0.3 : 0
      material.opacity = currentOpacity
      material.depthWrite = currentOpacity === 1
      if (material.transparent !== (currentOpacity < 1)) {
        material.transparent = currentOpacity < 1
        material.needsUpdate = true
      }
      if (material.wireframe !== wire) {
        material.wireframe = wire
        material.needsUpdate = true
      }
    })
  }, [highlightColor, highlightIds, highlightOpacity, highlighted, hovered, materials, opacity, selected, wire])

  return <group
    name={association.id}
    onClick={interactive ? (event) => {
      event.stopPropagation()
      onSelect(structure.id)
    } : undefined}
    onPointerOver={interactive ? (event) => {
      event.stopPropagation()
      setHovered(true)
      document.body.style.cursor = 'pointer'
    } : undefined}
    onPointerOut={interactive ? () => {
      setHovered(false)
      document.body.style.cursor = 'auto'
    } : undefined}
  >
    <primitive object={object} dispose={null}/>
  </group>
}

export type SkeletonModelProps = {
  model: THREE.Group
  meshes: readonly SkeletonMesh[]
  fitMeshes: readonly THREE.Mesh[]
  selectedId: AnatomyId | null
  onSelect: (id: AnatomyId) => void
  wire: boolean
  opacityById: Partial<Record<AnatomyId, number>>
  resetKey: number
  highlightIds?: ReadonlySet<AnatomyId>
  highlightColor?: string
  highlightOpacity?: number
  interactive?: boolean
  controlsEnabled?: boolean
  fitScale?: number
  smoothFit?: boolean
}

export function SkeletonModel({
  model,
  meshes,
  fitMeshes,
  selectedId,
  onSelect,
  wire,
  opacityById,
  resetKey,
  highlightIds = noAnatomyIds,
  highlightColor = '#456eff',
  highlightOpacity = 1,
  interactive = true,
  controlsEnabled = true,
  fitScale = 1,
  smoothFit = false,
}: SkeletonModelProps) {
  const { size } = useThree()
  const target = useMemo(() => {
    const bounds = new THREE.Box3()
    if (fitMeshes.length > 0) fitMeshes.forEach(mesh => bounds.expandByObject(mesh))
    else bounds.setFromObject(model)
    const aspect = size.width / Math.max(size.height, 1)
    const verticalHalfAngle = THREE.MathUtils.degToRad(37 / 2)
    const horizontalHalfAngle = Math.atan(Math.tan(verticalHalfAngle) * aspect)
    const modelSize = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const topInset = size.width < 600 ? 44 : 48
    const bottomInset = 56
    const availableHeight = Math.max(size.height - topInset - bottomInset, size.height * 0.5)
    const horizontalFit = modelSize.x / 2 / Math.tan(horizontalHalfAngle)
    const verticalFit = modelSize.y / 2 / Math.tan(verticalHalfAngle) * size.height / availableHeight
    const fitDistance = (Math.max(horizontalFit, verticalFit) + modelSize.z / 2) * 1.08 * fitScale
    const visibleHeight = 2 * fitDistance * Math.tan(verticalHalfAngle)
    center.y += ((topInset - bottomInset) / 2 / Math.max(size.height, 1)) * visibleHeight
    return { center, fitDistance }
  }, [fitMeshes, fitScale, model, size.height, size.width])
  const { center, fitDistance } = target

  return <>
    <CameraDistance key={`camera-${resetKey}`} distance={fitDistance} target={center} smooth={smoothFit}/>
    <SkeletonNodes
      meshes={meshes}
      selectedId={selectedId}
      onSelect={onSelect}
      wire={wire}
      opacityById={opacityById}
      highlightIds={highlightIds}
      highlightColor={highlightColor}
      highlightOpacity={highlightOpacity}
      interactive={interactive}
    />
    {controlsEnabled && <OrbitControls key={`controls-${resetKey}-${fitDistance}`} makeDefault enableDamping dampingFactor={0.08} minDistance={fitDistance * 0.3} maxDistance={fitDistance * 3} target={center}/>}
  </>
}

function SkeletonNodes({
  meshes,
  selectedId,
  onSelect,
  wire,
  opacityById,
  highlightIds,
  highlightColor,
  highlightOpacity,
  interactive,
}: {
  meshes: readonly SkeletonMesh[]
  selectedId: AnatomyId | null
  onSelect: (id: AnatomyId) => void
  wire: boolean
  opacityById: Partial<Record<AnatomyId, number>>
  highlightIds: ReadonlySet<AnatomyId>
  highlightColor: string
  highlightOpacity: number
  interactive: boolean
}) {
  return <group>
    {meshes.map(({ structure, association, source }) => <Bone
      key={association.id}
      structure={structure}
      association={association}
      source={source}
      selectedId={selectedId}
      onSelect={onSelect}
      wire={wire}
      opacity={opacityById[structure.id] ?? 100}
      highlightIds={highlightIds}
      highlightColor={highlightColor}
      highlightOpacity={highlightOpacity}
      interactive={interactive}
    />)}
  </group>
}

function isFailure(state: SkeletonAssetState) {
  return state.status === 'missing' || state.status === 'invalid' || state.status === 'network-error'
}

function failureLabel(state: SkeletonAssetState) {
  if (state.status === 'missing') return 'Missing model asset'
  if (state.status === 'invalid') return 'Invalid model data'
  return 'Network error'
}

export default function Viewport({
  selectedId,
  onSelect,
  fitStructureIds,
  visibleStructureIds,
  matchedStructureCount,
  hiddenCount,
  isolationId,
  opacityById,
}: Props) {
  const [wire, setWire] = useState(false)
  const [labels, setLabels] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [webgl, setWebgl] = useState<WebGLState>({ status: 'checking' })
  const [assetState, setAssetState] = useState<SkeletonAssetState>({ status: 'idle' })
  const assetStateRef = useRef(assetState)
  assetStateRef.current = assetState
  const [retryVersion, setRetryVersion] = useState(0)
  const updateAssetState = useCallback((state: SkeletonAssetState) => setAssetState(state), [])
  const handleRendererError = useCallback((error: Error) => {
    const message = /webgl|context/i.test(error.message)
      ? 'This browser or device did not provide a WebGL 2 context.'
      : `The browser found WebGL 2 support, but the 3D renderer could not initialize (${error.message}).`
    setWebgl({ status: 'unavailable', message })
  }, [])

  useEffect(() => () => {
    const state = assetStateRef.current
    if (state.status === 'ready') disposeModelResources(state.model)
  }, [])

  const structureCount = structures.length
  const meshCount = anatomyCatalog.meshAssociationsById.size
  const readyCount = assetState.status === 'ready' ? assetState.meshesBySourceId.size : 0
  const pendingCount = assetState.status === 'idle' || assetState.status === 'loading' ? 1 : 0
  const failures = isFailure(assetState) ? [assetState] : []
  const meshes = assetState.status === 'ready'
    ? Array.from(anatomyCatalog.meshAssociationsById.values()).flatMap(({ structure, association }) => {
      const source = assetState.meshesBySourceId.get(association.sourceMeshId)
      return source && visibleStructureIds.has(structure.id) ? [{ structure, association, source }] : []
    })
    : []
  const fitMeshes = useMemo(() => assetState.status === 'ready'
    ? Array.from(anatomyCatalog.meshAssociationsById.values()).flatMap(({ structure, association }) => {
      if (!fitStructureIds.has(structure.id)) return []
      const source = assetState.meshesBySourceId.get(association.sourceMeshId)
      return source ? [source] : []
    })
    : [], [assetState, fitStructureIds])
  const topStatus = webgl.status === 'checking'
    ? 'Checking WebGL 2'
    : webgl.status === 'unavailable'
      ? '3D rendering unavailable'
      : failures.length > 0
        ? failureLabel(assetState)
        : pendingCount > 0
          ? 'Loading skeleton model'
          : `BodyParts3D · ${structureCount} structures`
  const retryFailedAsset = () => setRetryVersion(version => version + 1)
  const adjustZoom = (amount: number) => {
    setZoom(value => Math.min(1.7, Math.max(0.55, Number((value + amount).toFixed(2)))))
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
      data-structure-count={structureCount}
      data-visible-count={visibleStructureIds.size}
      data-selected-id={selectedId ?? ''}
      data-isolation-id={isolationId ?? ''}
      data-camera-zoom={zoom}
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
      {webgl.status !== 'unavailable' ? <>
        {webgl.status === 'available' && <AssetLoader
          retryVersion={retryVersion}
          onStateChange={updateAssetState}
        />}
        <RendererErrorBoundary
          onError={handleRendererError}
          fallback={<div className="model-render-fallback" role="alert">
            <strong>3D rendering could not start</strong>
            <p>Reload the page or enable browser hardware acceleration.</p>
            <button className="tool-button" onClick={() => window.location.reload()}>Reload page</button>
          </div>}
        >
          <Canvas
            camera={{ position: [0, 0, 8], fov: 37 }}
            dpr={[1, 1.8]}
            gl={{ antialias: true, alpha: true }}
            onCreated={() => setWebgl({ status: 'available' })}
            onPointerMissed={() => onSelect(null)}
          >
            <hemisphereLight color="#f0f4fa" groundColor="#172238" intensity={1.05}/>
            <ambientLight intensity={0.5}/>
            <directionalLight position={[4,5,6]} intensity={2.15} color="#f0f4fa"/>
            <directionalLight position={[-4,1,3]} intensity={0.7} color="#7899ff"/>
            <pointLight position={[0,-2,4]} intensity={0.42} color="#4ed7e5"/>
            <CameraProjectionZoom zoom={zoom}/>
            {assetState.status === 'ready' && <SkeletonModel
              model={assetState.model}
              meshes={meshes}
              fitMeshes={fitMeshes}
              selectedId={selectedId}
              onSelect={onSelect}
              wire={wire}
              opacityById={opacityById}
              resetKey={resetKey}
            />}
          </Canvas>
        </RendererErrorBoundary>
        {webgl.status === 'checking' && webglFallback}
        {webgl.status === 'available' && <>
          {labels && <div className="model-label bodyparts-label"><span/> Skeleton model · {structureCount} structures</div>}
          <div className="view-controls">
            <button aria-label="Reset camera" onClick={() => {setResetKey(value => value + 1); setZoom(1)}} title="Reset camera"><RotateCcw size={15}/></button>
            <span className="control-divider"/>
            <button aria-label="Zoom in" onClick={() => adjustZoom(-0.08)} title="Zoom in">＋</button><button aria-label="Zoom out" onClick={() => adjustZoom(0.08)} title="Zoom out">−</button>
            <span className="control-divider"/>
            <button className={wire ? 'active' : ''} aria-label="Toggle wireframe" aria-pressed={wire} onClick={() => setWire(value => !value)} title="Toggle wireframe"><Layers3 size={15}/></button>
            <button className={labels ? 'active' : ''} aria-label="Toggle labels" aria-pressed={labels} onClick={() => setLabels(value => !value)} title="Toggle labels">{labels ? <Eye size={15}/> : <EyeOff size={15}/>}</button>
            <span className="control-divider"/><span className="orbit-indicator"><Rotate3D size={14}/></span>
          </div>
        </>}
      </> : webglFallback}
    </div>
    <div className={`viewport-footer ${showLoadStatus || webgl.status !== 'available' ? 'viewport-footer-status' : ''}`}>
      {webgl.status === 'checking' && <span className="model-status" role="status">Checking WebGL 2 support…</span>}
      {webgl.status === 'unavailable' && <span className="model-status" role="status">The 3D viewport is unavailable.</span>}
      {webgl.status === 'available' && <div className="viewport-caption">
        <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" target="_blank" rel="noreferrer" title="BodyParts3D, © The Database Center for Life Science, licensed under CC BY-SA 2.1 Japan.">BodyParts3D · © DBCLS · CC BY-SA 2.1 JP</a>
        <span>OrganUI adaptation · simplified adult-male reference · omissions and combined meshes documented in attribution</span>
      </div>}
      {showLoadStatus && failures.length === 0 && <span className="model-status" role="status">Loading the skeleton model and validating all {structureCount} structures.</span>}
      {showLoadStatus && failures.length > 0 && <div className="model-status model-status-error" role="alert">
        <span>
          The skeleton model could not be loaded. {failureLabel(assetState)}: {assetState.status === 'missing' || assetState.status === 'invalid' || assetState.status === 'network-error' ? assetState.message : ''}
        </span>
        <button className="tool-button" onClick={retryFailedAsset}>Retry loading model</button>
      </div>}
      {webgl.status === 'available' && !showLoadStatus && <>
        <span className="viewport-hint"><kbd>DRAG</kbd> ORBIT</span><span className="viewport-hint"><kbd>SCROLL</kbd> ZOOM</span><span className="viewport-hint"><kbd>RIGHT DRAG</kbd> PAN</span><span className="footer-right">CAMERA · ORBIT CONTROLS</span>
      </>}
    </div>
  </section>
}
