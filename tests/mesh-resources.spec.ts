import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { disposeModelResources } from '../src/utils/disposeModelResources'

test('disposes each shared mesh geometry and material once', () => {
  const geometry = new THREE.BufferGeometry()
  const material = new THREE.MeshBasicMaterial()
  const model = new THREE.Group()
  model.add(new THREE.Mesh(geometry, material))
  model.add(new THREE.Mesh(geometry, [material, material]))

  let geometryDisposals = 0
  let materialDisposals = 0
  geometry.addEventListener('dispose', () => { geometryDisposals += 1 })
  material.addEventListener('dispose', () => { materialDisposals += 1 })

  disposeModelResources(model)

  expect(geometryDisposals).toBe(1)
  expect(materialDisposals).toBe(1)
})
