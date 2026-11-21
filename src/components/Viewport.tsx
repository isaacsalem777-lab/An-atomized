import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
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

type BoneProps = {
  structure: AnatomyStructure
  source: THREE.Group
  selectedId: string | null
  onSelect: (id: string) => void
  wire: boolean
}

const meshUrls = structures.map(({ meshId }) => `/assets/anatomy/bodyparts3d/${meshId}.obj`)
// Offset to the bounding-box center of the six source meshes, in millimeters.
const sourceOffset: [number, number, number] = [0.66675, 136.94135, -1525.785]

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

function SkullModel({ selectedId, onSelect, wire, onReady }: { selectedId: string | null; onSelect: (id: string) => void; wire: boolean; onReady: () => void }) {
  const models = useLoader(OBJLoader, meshUrls)
  useEffect(() => {
    onReady()
  }, [onReady])
  // Convert the source's Z-up millimeter coordinates to the scene's Y-up centimeter scale.
  return <group scale={0.01} rotation={[-Math.PI / 2, 0, 0]}>
    <group position={sourceOffset}>
      {structures.map((structure, index) => <Bone
        key={structure.id}
        structure={structure}
        source={models[index]}
        selectedId={selectedId}
        onSelect={onSelect}
        wire={wire}
      />)}
    </group>
  </group>
}

export default function Viewport({ system, region, challenge, selectedId, onSelect }: Props) {
  const [wire, setWire] = useState(false)
  const [labels, setLabels] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [zoom, setZoom] = useState(4.7)
  const [modelReady, setModelReady] = useState(false)
  const markModelReady = useCallback(() => setModelReady(true), [])
  const selected = structures.find((structure) => structure.id === selectedId)
  const attribution = 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.'

  return <section className="viewport">
    <div className="viewport-top">
      <div className="viewport-breadcrumb"><span className="live-dot" /> 3D WORKSPACE <span className="slash">/</span> {system.toUpperCase()} <span className="slash">/</span> {region.toUpperCase()}</div>
      <div className="viewport-top-actions"><span className="asset-status asset-live"><i /> BODY PARTS3D · 6 SEGMENTS</span><button className="icon-button" aria-label="Reset camera" onClick={() => {setResetKey(value => value + 1); setZoom(4.7)}}><Maximize2 size={16}/></button></div>
    </div>
    <div className="model-stage three-stage" data-model-ready={modelReady}>
      <div className="stage-grid" />
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
        <Suspense fallback={<Html center><span className="loading-model">Preparing 3D model…</span></Html>}>
          <SkullModel selectedId={selectedId} onSelect={onSelect} wire={wire} onReady={markModelReady}/>
        </Suspense>
        <OrbitControls key={`controls-${resetKey}`} makeDefault enableDamping dampingFactor={0.08} minDistance={3.1} maxDistance={8.5} target={[0,0,0]} />
      </Canvas>
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
    </div>
    <div className="viewport-footer"><span><kbd>DRAG</kbd> ORBIT</span><span><kbd>SCROLL</kbd> ZOOM</span><span><kbd>RIGHT DRAG</kbd> PAN</span><span className="footer-right">CAMERA · ORBIT CONTROLS</span></div>
    {challenge && <div className="challenge-overlay"><span className="challenge-kicker">ACTIVE IDENTIFICATION</span><strong>Click a bone on the 3D model.</strong><span>Selected: {selected?.name ?? 'None'}</span></div>}
  </section>
}
