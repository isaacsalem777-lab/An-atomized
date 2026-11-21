import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { disposeModelResources } from '../src/utils/disposeModelResources'

test('disposes each shared mesh geometry, material, and texture once', () => {
  const geometry = new THREE.BufferGeometry()
  const texture = new THREE.Texture()
  const material = new THREE.MeshBasicMaterial({ map: texture })
  const model = new THREE.Group()
  model.add(new THREE.Mesh(geometry, material))
  model.add(new THREE.Mesh(geometry, [material, material]))

  let geometryDisposals = 0
  let materialDisposals = 0
  let textureDisposals = 0
  geometry.addEventListener('dispose', () => { geometryDisposals += 1 })
  material.addEventListener('dispose', () => { materialDisposals += 1 })
  texture.addEventListener('dispose', () => { textureDisposals += 1 })

  disposeModelResources(model)

  expect(geometryDisposals).toBe(1)
  expect(materialDisposals).toBe(1)
  expect(textureDisposals).toBe(1)
})
