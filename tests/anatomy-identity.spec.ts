import { expect, test } from '@playwright/test'
import { anatomyCatalog, anatomyIds, createAnatomyCatalog, createAnatomyId, structures, type MeshAssociation } from '../src/data/anatomy'

test('uses distinct application IDs and preserves external FMA identifiers', () => {
  expect(structures).toHaveLength(6)
  expect(new Set(structures.map((structure) => structure.id)).size).toBe(6)
  expect(anatomyIds.leftZygomaticBone).not.toBe(anatomyIds.rightZygomaticBone)
  expect(anatomyIds.leftMaxilla).not.toBe(anatomyIds.rightMaxilla)

  const leftZygomatic = anatomyCatalog.structuresById.get(anatomyIds.leftZygomaticBone)
  const rightZygomatic = anatomyCatalog.structuresById.get(anatomyIds.rightZygomaticBone)
  expect(leftZygomatic?.laterality).toBe('left')
  expect(rightZygomatic?.laterality).toBe('right')
  expect(leftZygomatic?.externalIds).toContainEqual({ system: 'FMA', identifier: 'FMA52893' })
  expect(rightZygomatic?.externalIds).toContainEqual({ system: 'FMA', identifier: 'FMA52892' })
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

  expect(catalog.meshAssociationsById.size).toBe(7)
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
  const association = frontalBone.meshAssociations[0]
  if (!association) throw new Error('Frontal bone mesh association is missing')

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
