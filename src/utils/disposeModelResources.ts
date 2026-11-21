import * as THREE from 'three'

export function disposeModelResources(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return

    geometries.add(object.geometry)
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => materials.add(material))
    } else {
      materials.add(object.material)
    }
  })

  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
}
