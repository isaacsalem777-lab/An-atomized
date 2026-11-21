import { Suspense, useEffect, useState, Children, cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Maximize2, RotateCcw, Layers3, Eye, EyeOff, Rotate3D } from 'lucide-react'

type Props = { system: string; region: string; challenge: boolean; selectedName: string; onSelect: (name: string) => void }

type BoneProps = { name: string; selectedName: string; onSelect: (name: string) => void; children: ReactNode; wire: boolean }

function CameraDistance({ distance }: { distance: number }) {
  const { camera } = useThree()
  useEffect(() => { camera.position.set(0, 0.05, distance); camera.lookAt(0, -0.08, 0); camera.updateProjectionMatrix() }, [camera, distance])
  return null
}

function Bone({ name, selectedName, onSelect, children, wire }: BoneProps) {
  const [hovered, setHovered] = useState(false)
  const active = selectedName === name
  const tintedChildren = Children.map(children, child => {
    if (!isValidElement(child)) return child
    const inner = Children.map((child.props as { children?: ReactNode }).children, material => {
      if (!isValidElement(material)) return material
      return cloneElement(material as ReactElement<Record<string, unknown>>, {
        color: active ? '#9dd8d3' : hovered ? '#d9e5dd' : '#c5c9bd',
        emissive: active ? '#245e5b' : '#000000',
        emissiveIntensity: active ? 0.55 : 0,
        wireframe: wire,
      })
    })
    return cloneElement(child as ReactElement<{ children?: ReactNode }>, { children: inner })
  })
  return <group scale={active ? 1.025 : 1} onClick={(e) => { e.stopPropagation(); onSelect(name) }} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }} onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}>
    {tintedChildren}
  </group>
}

function SkullModel({ selectedName, onSelect, wire }: { selectedName: string; onSelect: (name: string) => void; wire: boolean }) {
  const ivory = '#c5c9bd'
  const dark = '#111b20'
  const curve = (points: [number, number, number][], radius: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 40, radius, 10, false)
  return <group position={[0, -0.08, 0]} scale={1.05}>
    <Bone name="Frontal bone" selectedName={selectedName} onSelect={onSelect} wire={wire}>
      <mesh position={[0, 0.62, 0.02]} scale={[0.91, 0.83, 0.72]}><sphereGeometry args={[1, 48, 32]}/><meshStandardMaterial color={ivory}/></mesh>
    </Bone>
    <Bone name="Zygomatic bone" selectedName={selectedName} onSelect={onSelect} wire={wire}>
      <mesh position={[-0.78, -0.34, 0.57]} rotation={[0, 0, -0.25]} scale={[0.28, 0.19, 0.22]}><sphereGeometry args={[1, 32, 20]}/><meshStandardMaterial color={ivory}/></mesh>
      <mesh position={[0.78, -0.34, 0.57]} rotation={[0, 0, 0.25]} scale={[0.28, 0.19, 0.22]}><sphereGeometry args={[1, 32, 20]}/><meshStandardMaterial color={ivory}/></mesh>
      <mesh geometry={curve([[-0.83,-0.34,0.45],[-1.02,-0.2,0.15],[-0.95,0.04,-0.15]], 0.075)}><meshStandardMaterial color={ivory}/></mesh>
      <mesh geometry={curve([[0.83,-0.34,0.45],[1.02,-0.2,0.15],[0.95,0.04,-0.15]], 0.075)}><meshStandardMaterial color={ivory}/></mesh>
    </Bone>
    <Bone name="Maxilla" selectedName={selectedName} onSelect={onSelect} wire={wire}>
      <mesh position={[0, -0.55, 0.53]} scale={[0.57, 0.37, 0.28]}><sphereGeometry args={[1, 36, 24]}/><meshStandardMaterial color={ivory}/></mesh>
      <mesh position={[-0.34,-0.69,0.68]} scale={[0.18,0.16,0.12]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={ivory}/></mesh>
      <mesh position={[0.34,-0.69,0.68]} scale={[0.18,0.16,0.12]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={ivory}/></mesh>
    </Bone>
    <Bone name="Mandible" selectedName={selectedName} onSelect={onSelect} wire={wire}>
      <mesh position={[0, -1.04, 0.43]} scale={[0.64,0.15,0.22]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color={ivory}/></mesh>
      <mesh geometry={curve([[-0.57,-1.02,0.42],[-0.66,-0.7,0.35],[-0.73,-0.45,0.2]],0.085)}><meshStandardMaterial color={ivory}/></mesh>
      <mesh geometry={curve([[0.57,-1.02,0.42],[0.66,-0.7,0.35],[0.73,-0.45,0.2]],0.085)}><meshStandardMaterial color={ivory}/></mesh>
    </Bone>
    {/* Dark inset orbital and nasal cavities provide depth cues; they are not cut-through anatomy. */}
    <mesh position={[-0.39, -0.02, 0.65]} scale={[0.28,0.36,0.08]}><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color={dark} roughness={1}/></mesh>
    <mesh position={[0.39, -0.02, 0.65]} scale={[0.28,0.36,0.08]}><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color={dark} roughness={1}/></mesh>
    <mesh position={[0,-0.39,0.69]} scale={[0.12,0.23,0.08]}><sphereGeometry args={[1,24,18]}/><meshStandardMaterial color={dark}/></mesh>
    <mesh position={[0,0.1,-0.72]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.78,0.012,8,64]}/><meshBasicMaterial color="#81bfc0" transparent opacity={0.16}/></mesh>
  </group>
}

export default function Viewport({ system, region, challenge, selectedName, onSelect }: Props) {
  const [wire, setWire] = useState(false)
  const [labels, setLabels] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [zoom, setZoom] = useState(4.7)
  return <section className="viewport">
    <div className="viewport-top">
      <div className="viewport-breadcrumb"><span className="live-dot" /> 3D WORKSPACE <span className="slash">/</span> {system.toUpperCase()} <span className="slash">/</span> {region.toUpperCase()}</div>
      <div className="viewport-top-actions"><span className="asset-status asset-live"><i /> INTERACTIVE 3D BLOCKOUT</span><button className="icon-button" aria-label="Reset camera" onClick={() => {setResetKey(v => v + 1); setZoom(4.7)}}><Maximize2 size={16}/></button></div>
    </div>
    <div className="model-stage three-stage">
      <div className="stage-grid" />
      <Canvas camera={{ position: [0, 0.05, 4.7], fov: 37 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#0c141a']} />
        <ambientLight intensity={1.25}/>
        <directionalLight position={[4,5,6]} intensity={2.3} color="#e2f0e8"/>
        <directionalLight position={[-4,1,3]} intensity={1.1} color="#78b6bd"/>
        <pointLight position={[0,-2,4]} intensity={0.65} color="#d3c6a8"/>
        <CameraDistance key={resetKey} distance={zoom}/><Suspense fallback={<Html center><span className="loading-model">Preparing 3D model…</span></Html>}>
          <SkullModel selectedName={selectedName} onSelect={onSelect} wire={wire}/>
        </Suspense>
        <OrbitControls key={resetKey} makeDefault enableDamping dampingFactor={0.08} minDistance={3.1} maxDistance={8.5} target={[0,-0.08,0]} />
      </Canvas>
      {labels && <div className="model-label label-left"><span/> ORBITAL REGION</div>}
      <div className="viewport-caption"><span>3D STUDY BLOCKOUT</span><span>PROPORTIONS ARE APPROXIMATE · NOT FOR CLINICAL USE</span></div>
      <div className="view-controls">
        <button onClick={() => {setResetKey(v => v + 1); setZoom(4.7)}} title="Reset camera"><RotateCcw size={15}/></button>
        <span className="control-divider"/>
        <button onClick={() => setZoom(z => Math.max(3.1, z - 0.35))} title="Zoom in">＋</button><button onClick={() => setZoom(z => Math.min(8.5, z + 0.35))} title="Zoom out">−</button>
        <span className="control-divider"/>
        <button className={wire ? 'active' : ''} onClick={() => setWire(v => !v)} title="Toggle wireframe"><Layers3 size={15}/></button>
        <button className={labels ? 'active' : ''} onClick={() => setLabels(v => !v)} title="Toggle labels">{labels ? <Eye size={15}/> : <EyeOff size={15}/>}</button>
        <span className="control-divider"/><span className="orbit-indicator"><Rotate3D size={14}/></span>
      </div>
    </div>
    <div className="viewport-footer"><span><kbd>DRAG</kbd> ORBIT</span><span><kbd>SCROLL</kbd> ZOOM</span><span><kbd>RIGHT DRAG</kbd> PAN</span><span className="footer-right">CAMERA · ORBIT CONTROLS</span></div>
    {challenge && <div className="challenge-overlay"><span className="challenge-kicker">ACTIVE IDENTIFICATION</span><strong>Click a bone on the 3D model.</strong><span>Selected: {selectedName}</span></div>}
  </section>
}
