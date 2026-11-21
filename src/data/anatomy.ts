import skeletonStructures from './skeleton-structures.json' with { type: 'json' }

declare const anatomyIdBrand: unique symbol
export type AnatomyId = string & { readonly [anatomyIdBrand]: true }
export type Laterality = 'left' | 'right' | 'midline' | 'unpaired'
export type MeshFormat = 'obj' | 'glb' | 'gltf' | 'fbx'

export function createAnatomyId(value: string): AnatomyId {
  if (!/^anatomy:[^:\s]+(?::[^:\s]+)*$/.test(value)) {
    throw new Error(`Invalid anatomy ID "${value}": IDs must use the anatomy: namespace and non-empty segments.`)
  }
  return value as AnatomyId
}

export const anatomyIds = {
  frontalBone: createAnatomyId('anatomy:bone:frontal'),
  leftZygomaticBone: createAnatomyId('anatomy:bone:zygomatic:left'),
  rightZygomaticBone: createAnatomyId('anatomy:bone:zygomatic:right'),
  leftMaxilla: createAnatomyId('anatomy:bone:maxilla:left'),
  rightMaxilla: createAnatomyId('anatomy:bone:maxilla:right'),
  mandible: createAnatomyId('anatomy:bone:mandible'),
} as const

export type ExternalIdentifier = {
  readonly system: string
  readonly identifier: string
}

export type MeshAssociation = {
  readonly id: string
  readonly source: string
  readonly sourceMeshId: string
  readonly format: MeshFormat
  readonly url: string
}

export type AnatomyRelationship = {
  readonly type: string
  readonly targetId: AnatomyId
}

export type EducationalMetadata = {
  readonly difficulty?: string
  readonly learningObjectives?: readonly string[]
  readonly tags?: readonly string[]
}

export type AnatomyStructure = {
  readonly id: AnatomyId
  readonly name: string
  readonly sourceName?: string
  readonly system: string
  readonly region: string
  readonly subgroup?: string
  readonly laterality: Laterality
  readonly externalIds?: readonly ExternalIdentifier[]
  readonly meshAssociations: readonly MeshAssociation[]
  readonly description?: string
  readonly sourceNote?: string
  readonly location?: string
  readonly function?: string
  readonly relationships?: readonly AnatomyRelationship[]
  readonly educational?: EducationalMetadata
}

export type MeshAssociationRecord = {
  readonly structure: AnatomyStructure
  readonly association: MeshAssociation
}

export type AnatomyCatalog = {
  structuresById: ReadonlyMap<AnatomyId, AnatomyStructure>
  meshAssociationsById: ReadonlyMap<string, MeshAssociationRecord>
}

type SkeletonSourceStructure = {
  id: string
  fma: string
  name: string
  sourceName: string
  group: string
  subgroup?: string
  description: string
  note: string
}

const legacyAnatomyIds: Readonly<Record<string, AnatomyId>> = {
  FMA52734: anatomyIds.frontalBone,
  FMA52893: anatomyIds.leftZygomaticBone,
  FMA52892: anatomyIds.rightZygomaticBone,
  FMA53650: anatomyIds.leftMaxilla,
  FMA53649: anatomyIds.rightMaxilla,
  FMA52748: anatomyIds.mandible,
}

const legacyReference: Readonly<Record<string, Pick<AnatomyStructure, 'location' | 'function'>>> = {
  FMA52734: {
    location: 'Anterior skull, superior to the orbits and articulating with the parietal bones.',
    function: 'Protects the frontal lobes and contributes to the orbital and cranial cavities.',
  },
  FMA52893: {
    location: 'Left lateral face, between the maxilla, temporal bone, sphenoid, and frontal bone.',
    function: 'Forms the left cheek prominence and part of the lateral wall and floor of the orbit.',
  },
  FMA52892: {
    location: 'Right lateral face, between the maxilla, temporal bone, sphenoid, and frontal bone.',
    function: 'Forms the right cheek prominence and part of the lateral wall and floor of the orbit.',
  },
  FMA53650: {
    location: 'Left upper jaw, inferior to the orbit and lateral to the nasal opening.',
    function: 'Supports the left upper teeth and forms parts of the hard palate, orbit, and nasal cavity.',
  },
  FMA53649: {
    location: 'Right upper jaw, inferior to the orbit and lateral to the nasal opening.',
    function: 'Supports the right upper teeth and forms parts of the hard palate, orbit, and nasal cavity.',
  },
  FMA52748: {
    location: 'Inferior face, articulating with the temporal bones at the temporomandibular joints.',
    function: 'Supports the lower teeth and enables mastication and speech-related movements.',
  },
}

const regionsByGroup: Readonly<Record<string, string>> = {
  Skull: 'Skull',
  'Vertebral column': 'Spine',
  Thorax: 'Thorax',
  Pelvis: 'Pelvis',
  'Right upper limb': 'Upper limbs',
  'Left upper limb': 'Upper limbs',
  'Right lower limb': 'Lower limbs',
  'Left lower limb': 'Lower limbs',
}

const regionOverridesBySourceId: Readonly<Record<string, string>> = {
  'hyoid-bone': 'Neck',
}

function getOwnedAnatomyId(source: SkeletonSourceStructure): AnatomyId {
  const legacyId = legacyAnatomyIds[source.fma]
  if (legacyId) return legacyId
  const sourceIdentifier = source.fma.startsWith('FMA') ? source.fma.toLowerCase() : `bodyparts3d-${source.fma.toLowerCase()}`
  return createAnatomyId(`anatomy:skeleton:${sourceIdentifier}`)
}

function getLaterality(source: SkeletonSourceStructure): Laterality {
  const label = `${source.name} ${source.group}`.toLowerCase()
  if (/\bleft\b/.test(label)) return 'left'
  if (/\bright\b/.test(label)) return 'right'
  return 'unpaired'
}

export const structures: readonly AnatomyStructure[] = (skeletonStructures as SkeletonSourceStructure[]).map((source) => {
  const region = regionOverridesBySourceId[source.id] ?? regionsByGroup[source.group]
  if (!region) throw new Error(`Unknown BodyParts3D skeleton group "${source.group}" for "${source.id}".`)
  const externalIdSystem = /^FMA\d+$/.test(source.fma) ? 'FMA' : 'BodyParts3D'
  const legacy = legacyReference[source.fma]

  return {
    id: getOwnedAnatomyId(source),
    name: source.name,
    sourceName: source.sourceName,
    system: 'Bone and joints',
    region,
    subgroup: source.subgroup,
    laterality: getLaterality(source),
    externalIds: [{ system: externalIdSystem, identifier: source.fma }],
    meshAssociations: [{
      id: `bodyparts3d-3.0:${source.id}`,
      source: 'BodyParts3D 3.0',
      sourceMeshId: source.id,
      format: 'glb',
      url: '/assets/anatomy/bodyparts3d/skeleton-3.0/skeleton.glb',
    }],
    description: source.description,
    sourceNote: source.note,
    ...legacy,
  }
})

export function createAnatomyCatalog(records: readonly AnatomyStructure[]): AnatomyCatalog {
  const structuresById = new Map<AnatomyId, AnatomyStructure>()
  const meshAssociationsById = new Map<string, MeshAssociationRecord>()
  const externalIdentifiers = new Map<string, AnatomyId>()
  const validLateralities = new Set<string>(['left', 'right', 'midline', 'unpaired'])
  const validMeshFormats = new Set<string>(['obj', 'glb', 'gltf', 'fbx'])
  const requireText = (value: string, field: string) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${field} must be a non-empty string.`)
    }
  }

  records.forEach((structure) => {
    createAnatomyId(structure.id)
    requireText(structure.name, `Anatomy structure "${structure.id}" name`)
    requireText(structure.system, `Anatomy structure "${structure.id}" system`)
    requireText(structure.region, `Anatomy structure "${structure.id}" region`)
    if (!validLateralities.has(structure.laterality)) {
      throw new Error(`Anatomy structure "${structure.id}" has invalid laterality "${structure.laterality}".`)
    }
    if (structuresById.has(structure.id)) {
      throw new Error(`Duplicate anatomy ID: ${structure.id}`)
    }
    structuresById.set(structure.id, structure)

    structure.externalIds?.forEach(({ system, identifier }) => {
      requireText(system, `Anatomy structure "${structure.id}" external identifier system`)
      requireText(identifier, `Anatomy structure "${structure.id}" external identifier`)
      const key = `${system}\u0000${identifier}`
      const existingStructureId = externalIdentifiers.get(key)
      if (existingStructureId) {
        throw new Error(
          `Duplicate external identifier "${system}:${identifier}" on anatomy structures "${existingStructureId}" and "${structure.id}".`,
        )
      }
      externalIdentifiers.set(key, structure.id)
    })

    structure.meshAssociations.forEach((association) => {
      requireText(association.id, `Anatomy structure "${structure.id}" mesh association ID`)
      requireText(association.source, `Mesh association "${association.id}" source`)
      requireText(association.sourceMeshId, `Mesh association "${association.id}" source mesh ID`)
      requireText(association.url, `Mesh association "${association.id}" URL`)
      if (!validMeshFormats.has(association.format)) {
        throw new Error(`Mesh association "${association.id}" has unsupported format "${association.format}".`)
      }
      if (meshAssociationsById.has(association.id)) {
        throw new Error(`Duplicate mesh association ID: ${association.id}`)
      }
      meshAssociationsById.set(association.id, { structure, association })
    })

    for (const [field, value] of [
      ['description', structure.description],
      ['location', structure.location],
      ['function', structure.function],
    ] as const) {
      if (value !== undefined) requireText(value, `Anatomy structure "${structure.id}" ${field}`)
    }
  })

  records.forEach((structure) => {
    structure.relationships?.forEach(({ type, targetId }) => {
      requireText(type, `Anatomy structure "${structure.id}" relationship type`)
      if (!structuresById.has(targetId)) {
        throw new Error(`Anatomy structure "${structure.id}" references unknown relationship target "${targetId}".`)
      }
    })
  })

  return { structuresById, meshAssociationsById }
}

export const anatomyCatalog = createAnatomyCatalog(structures)
