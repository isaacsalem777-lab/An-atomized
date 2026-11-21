export const anatomyIds = {
  frontalBone: 'anatomy:bone:frontal',
  leftZygomaticBone: 'anatomy:bone:zygomatic:left',
  rightZygomaticBone: 'anatomy:bone:zygomatic:right',
  leftMaxilla: 'anatomy:bone:maxilla:left',
  rightMaxilla: 'anatomy:bone:maxilla:right',
  mandible: 'anatomy:bone:mandible',
} as const

export type AnatomyId = (typeof anatomyIds)[keyof typeof anatomyIds]
export type Laterality = 'left' | 'right' | 'midline' | 'unpaired'
export type MeshFormat = 'obj' | 'glb' | 'gltf' | 'fbx'

export type ExternalIdentifier = {
  system: string
  identifier: string
}

export type MeshAssociation = {
  id: string
  source: string
  sourceMeshId: string
  format: MeshFormat
  url: string
}

export type AnatomyRelationship = {
  type: string
  targetId: AnatomyId
}

export type EducationalMetadata = {
  difficulty?: string
  learningObjectives?: readonly string[]
  tags?: readonly string[]
}

export type AnatomyStructure = {
  id: AnatomyId
  name: string
  system: string
  region: string
  laterality: Laterality
  externalIds?: readonly ExternalIdentifier[]
  meshAssociations: readonly MeshAssociation[]
  description: string
  location: string
  function: string
  relationships?: readonly AnatomyRelationship[]
  educational?: EducationalMetadata
}

export type MeshAssociationRecord = {
  structure: AnatomyStructure
  association: MeshAssociation
}

export type AnatomyCatalog = {
  structuresById: ReadonlyMap<AnatomyId, AnatomyStructure>
  meshAssociationsById: ReadonlyMap<string, MeshAssociationRecord>
}

const zygomaticDescription = 'The paired cheek bones form the prominence of the cheeks and contribute to the lateral orbital walls.'
const maxillaDescription = 'The paired upper jaw bones support the upper teeth and contribute to the floor of each orbit and the walls of the nasal cavity.'

export const structures: AnatomyStructure[] = [
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

  records.forEach((structure) => {
    if (structuresById.has(structure.id)) {
      throw new Error(`Duplicate anatomy ID: ${structure.id}`)
    }
    structuresById.set(structure.id, structure)

    structure.meshAssociations.forEach((association) => {
      if (meshAssociationsById.has(association.id)) {
        throw new Error(`Duplicate mesh association ID: ${association.id}`)
      }
      meshAssociationsById.set(association.id, { structure, association })
    })
  })

  return { structuresById, meshAssociationsById }
}

export const anatomyCatalog = createAnatomyCatalog(structures)

export const systems = ['All systems', 'Skeletal', 'Muscular', 'Nervous', 'Cardiovascular', 'Organs']
export const regions = ['Whole body', 'Cranium', 'Thorax', 'Vertebral column', 'Pelvis', 'Upper extremity']
