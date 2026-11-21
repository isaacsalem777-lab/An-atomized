import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { anatomyCatalog, anatomyIds, createAnatomyCatalog, createAnatomyId, structures, type MeshAssociation } from '../src/data/anatomy'

const modelDirectory = '../public/assets/anatomy/bodyparts3d/skeleton-3.0/'
const manifest = JSON.parse(readFileSync(new URL(`${modelDirectory}manifest.json`, import.meta.url), 'utf8')) as {
  runtime: { bytes: number; sha256: string }
  structures: { id: string; fma: string; sourceName: string }[]
}

test('preserves application IDs and maps every structure to the imported source manifest', () => {
  expect(structures).toHaveLength(242)
  expect(manifest.structures).toHaveLength(242)
  expect(structures).toHaveLength(manifest.structures.length)
  expect(new Set(structures.map((structure) => structure.id)).size).toBe(manifest.structures.length)
  expect(new Set(structures.flatMap((structure) => structure.meshAssociations.map(({ sourceMeshId }) => sourceMeshId))).size)
    .toBe(manifest.structures.length)

  manifest.structures.forEach((source) => {
    const structure = structures.find(({ meshAssociations }) => meshAssociations[0]?.sourceMeshId === source.id)
    expect(structure).toBeDefined()
    expect(structure?.sourceName).toBe(source.sourceName)
    expect(structure?.externalIds).toContainEqual({
      system: source.fma.startsWith('FMA') ? 'FMA' : 'BodyParts3D',
      identifier: source.fma,
    })
  })

  expect(anatomyIds.leftZygomaticBone).not.toBe(anatomyIds.rightZygomaticBone)
  expect(anatomyIds.leftMaxilla).not.toBe(anatomyIds.rightMaxilla)

  const leftZygomatic = anatomyCatalog.structuresById.get(anatomyIds.leftZygomaticBone)
  const rightZygomatic = anatomyCatalog.structuresById.get(anatomyIds.rightZygomaticBone)
  expect(leftZygomatic?.laterality).toBe('left')
  expect(rightZygomatic?.laterality).toBe('right')
  expect(leftZygomatic?.externalIds).toContainEqual({ system: 'FMA', identifier: 'FMA52893' })
  expect(rightZygomatic?.externalIds).toContainEqual({ system: 'FMA', identifier: 'FMA52892' })
  expect(leftZygomatic?.id).toBe('anatomy:bone:zygomatic:left')
  expect(rightZygomatic?.id).toBe('anatomy:bone:zygomatic:right')

  const nonFmaRecords = structures.filter((structure) => structure.externalIds?.some(({ identifier }) => identifier.startsWith('BP')))
  expect(nonFmaRecords).toHaveLength(2)
  expect(nonFmaRecords.every((structure) => structure.externalIds?.some(({ system }) => system === 'BodyParts3D'))).toBe(true)
})

test('matches the bundled GLB size and checksum recorded in its manifest', () => {
  const model = readFileSync(new URL(`${modelDirectory}skeleton.glb`, import.meta.url))
  expect(model.byteLength).toBe(manifest.runtime.bytes)
  expect(createHash('sha256').update(model).digest('hex')).toBe(manifest.runtime.sha256)
})

test('resolves multiple mesh associations to the same stable anatomy ID independent of record order', () => {
  const structure = anatomyCatalog.structuresById.get(anatomyIds.leftZygomaticBone)
  if (!structure) throw new Error('Left zygomatic record is missing')
  const originalAssociation = structure.meshAssociations[0]
  if (!originalAssociation) throw new Error('Left zygomatic mesh association is missing')

  const replacementAssociation: MeshAssociation = {
    id: 'replacement-model:left-zygoma-v2',
    source: 'ReplacementModel',
    sourceMeshId: 'zygoma-surface-v2',
    format: 'glb',
    url: '/assets/replacement/zygoma-v2.glb',
  }
  const extendedStructure = {
    ...structure,
    meshAssociations: [replacementAssociation, originalAssociation],
  }
  const records = structures
    .filter((record) => record.id !== structure.id)
    .concat(extendedStructure)
    .reverse()
  const catalog = createAnatomyCatalog(records)

  expect(catalog.meshAssociationsById.size).toBe(structures.length + 1)
  expect(catalog.meshAssociationsById.get(originalAssociation.id)?.structure.id).toBe(structure.id)
  expect(catalog.meshAssociationsById.get(replacementAssociation.id)?.structure.id).toBe(structure.id)
  expect(catalog.structuresById.get(structure.id)?.id).toBe('anatomy:bone:zygomatic:left')
  expect(catalog.meshAssociationsById.get(replacementAssociation.id)?.association.sourceMeshId).toBe('zygoma-surface-v2')
})

test('validates anatomy ID namespaces, mesh association uniqueness, and relationship targets', () => {
  expect(createAnatomyId('anatomy:bone:frontal')).toBe(anatomyIds.frontalBone)
  expect(() => createAnatomyId('FMA:FMA52734')).toThrow('IDs must use the anatomy: namespace')

  const frontalBone = anatomyCatalog.structuresById.get(anatomyIds.frontalBone)
  if (!frontalBone) throw new Error('Frontal bone record is missing')
  const mandible = anatomyCatalog.structuresById.get(anatomyIds.mandible)
  if (!mandible) throw new Error('Mandible record is missing')
  const association = frontalBone.meshAssociations[0]
  if (!association) throw new Error('Frontal bone mesh association is missing')

  const duplicateExternalIdentifier = {
    ...mandible,
    externalIds: frontalBone.externalIds,
  }
  expect(() => createAnatomyCatalog([frontalBone, duplicateExternalIdentifier])).toThrow(
    'Duplicate external identifier "FMA:FMA52734"',
  )

  const duplicateAssociation = {
    ...frontalBone,
    meshAssociations: [association, association],
  }
  expect(() => createAnatomyCatalog([duplicateAssociation])).toThrow('Duplicate mesh association ID')

  const danglingRelationship = {
    ...frontalBone,
    relationships: [{ type: 'test-only', targetId: anatomyIds.mandible }],
  }
  expect(() => createAnatomyCatalog([danglingRelationship])).toThrow('references unknown relationship target')
})
