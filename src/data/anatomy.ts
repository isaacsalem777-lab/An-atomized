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
  readonly system: string
  readonly region: string
  readonly laterality: Laterality
  readonly externalIds?: readonly ExternalIdentifier[]
  readonly meshAssociations: readonly MeshAssociation[]
  readonly description?: string
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

const zygomaticDescription = 'The paired cheek bones form the prominence of the cheeks and contribute to the lateral orbital walls.'
const maxillaDescription = 'The paired upper jaw bones support the upper teeth and contribute to the floor of each orbit and the walls of the nasal cavity.'

export const structures: readonly AnatomyStructure[] = [
  {
    id: anatomyIds.frontalBone,
    name: 'Frontal bone',
    system: 'Skeletal',
    region: 'Cranium',
    laterality: 'unpaired',
    externalIds: [{ system: 'FMA', identifier: 'FMA52734' }],
    meshAssociations: [{
      id: 'bodyparts3d:FJ3200',
      source: 'BodyParts3D',
      sourceMeshId: 'FJ3200',
      format: 'obj',
      url: '/assets/anatomy/bodyparts3d/FJ3200.obj',
    }],
    description: 'The frontal bone forms the forehead, the roofs of the orbits, and the anterior cranial floor.',
    location: 'Anterior skull, superior to the orbits and articulating with the parietal bones.',
    function: 'Protects the frontal lobes and contributes to the orbital and cranial cavities.',
  },
  {
    id: anatomyIds.leftZygomaticBone,
    name: 'Left zygomatic bone',
    system: 'Skeletal',
    region: 'Cranium',
    laterality: 'left',
    externalIds: [{ system: 'FMA', identifier: 'FMA52893' }],
    meshAssociations: [{
      id: 'bodyparts3d:FJ3287',
      source: 'BodyParts3D',
      sourceMeshId: 'FJ3287',
      format: 'obj',
      url: '/assets/anatomy/bodyparts3d/FJ3287.obj',
    }],
    description: zygomaticDescription,
    location: 'Left lateral face, between the maxilla, temporal bone, sphenoid, and frontal bone.',
    function: 'Forms the left cheek prominence and part of the lateral wall and floor of the orbit.',
  },
  {
    id: anatomyIds.rightZygomaticBone,
    name: 'Right zygomatic bone',
    system: 'Skeletal',
    region: 'Cranium',
    laterality: 'right',
    externalIds: [{ system: 'FMA', identifier: 'FMA52892' }],
    meshAssociations: [{
      id: 'bodyparts3d:FJ3392',
      source: 'BodyParts3D',
      sourceMeshId: 'FJ3392',
      format: 'obj',
      url: '/assets/anatomy/bodyparts3d/FJ3392.obj',
    }],
    description: zygomaticDescription,
    location: 'Right lateral face, between the maxilla, temporal bone, sphenoid, and frontal bone.',
    function: 'Forms the right cheek prominence and part of the lateral wall and floor of the orbit.',
  },
  {
    id: anatomyIds.leftMaxilla,
    name: 'Left maxilla',
    system: 'Skeletal',
    region: 'Cranium',
    laterality: 'left',
    externalIds: [{ system: 'FMA', identifier: 'FMA53650' }],
    meshAssociations: [{
      id: 'bodyparts3d:FJ3269',
      source: 'BodyParts3D',
      sourceMeshId: 'FJ3269',
      format: 'obj',
      url: '/assets/anatomy/bodyparts3d/FJ3269.obj',
    }],
    description: maxillaDescription,
    location: 'Left upper jaw, inferior to the orbit and lateral to the nasal opening.',
    function: 'Supports the left upper teeth and forms parts of the hard palate, orbit, and nasal cavity.',
  },
  {
    id: anatomyIds.rightMaxilla,
    name: 'Right maxilla',
    system: 'Skeletal',
    region: 'Cranium',
    laterality: 'right',
    externalIds: [{ system: 'FMA', identifier: 'FMA53649' }],
    meshAssociations: [{
      id: 'bodyparts3d:FJ3375',
      source: 'BodyParts3D',
      sourceMeshId: 'FJ3375',
      format: 'obj',
      url: '/assets/anatomy/bodyparts3d/FJ3375.obj',
    }],
    description: maxillaDescription,
    location: 'Right upper jaw, inferior to the orbit and lateral to the nasal opening.',
    function: 'Supports the right upper teeth and forms parts of the hard palate, orbit, and nasal cavity.',
  },
  {
    id: anatomyIds.mandible,
    name: 'Mandible',
    system: 'Skeletal',
    region: 'Cranium',
    laterality: 'unpaired',
    externalIds: [{ system: 'FMA', identifier: 'FMA52748' }],
    meshAssociations: [{
      id: 'bodyparts3d:FJ3289',
      source: 'BodyParts3D',
      sourceMeshId: 'FJ3289',
      format: 'obj',
      url: '/assets/anatomy/bodyparts3d/FJ3289.obj',
    }],
    description: 'The mandible is the mobile lower jaw and the only movable bone of the skull.',
    location: 'Inferior face, articulating with the temporal bones at the temporomandibular joints.',
    function: 'Supports the lower teeth and enables mastication and speech-related movements.',
  },
]

export function createAnatomyCatalog(records: readonly AnatomyStructure[]): AnatomyCatalog {
  const structuresById = new Map<AnatomyId, AnatomyStructure>()
  const meshAssociationsById = new Map<string, MeshAssociationRecord>()
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

    const externalIdentifiers = new Set<string>()
    structure.externalIds?.forEach(({ system, identifier }) => {
      requireText(system, `Anatomy structure "${structure.id}" external identifier system`)
      requireText(identifier, `Anatomy structure "${structure.id}" external identifier`)
      const key = `${system}\u0000${identifier}`
      if (externalIdentifiers.has(key)) {
        throw new Error(`Duplicate external identifier "${system}:${identifier}" on anatomy structure "${structure.id}".`)
      }
      externalIdentifiers.add(key)
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
