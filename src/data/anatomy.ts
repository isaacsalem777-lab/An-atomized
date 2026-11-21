export type AnatomyStructure = {
  id: string
  meshId: string
  fmaId: string
  name: string
  system: string
  region: string
  detail: string
  location: string
  function: string
}

const zygomaticDetail = 'The paired cheek bones form the prominence of the cheeks and contribute to the lateral orbital walls.'
const maxillaDetail = 'The paired upper jaw bones support the upper teeth and contribute to the floor of each orbit and the walls of the nasal cavity.'

export const structures: AnatomyStructure[] = [
  {
    id: 'FJ3200',
    meshId: 'FJ3200',
    fmaId: 'FMA52734',
    name: 'Frontal bone',
    system: 'Skeletal',
    region: 'Cranium',
    detail: 'The frontal bone forms the forehead, the roofs of the orbits, and the anterior cranial floor.',
    location: 'Anterior skull, superior to the orbits and articulating with the parietal bones.',
    function: 'Protects the frontal lobes and contributes to the orbital and cranial cavities.',
  },
  {
    id: 'FJ3287',
    meshId: 'FJ3287',
    fmaId: 'FMA52893',
    name: 'Left zygomatic bone',
    system: 'Skeletal',
    region: 'Cranium',
    detail: zygomaticDetail,
    location: 'Left lateral face, between the maxilla, temporal bone, sphenoid, and frontal bone.',
    function: 'Forms the left cheek prominence and part of the lateral wall and floor of the orbit.',
  },
  {
    id: 'FJ3392',
    meshId: 'FJ3392',
    fmaId: 'FMA52892',
    name: 'Right zygomatic bone',
    system: 'Skeletal',
    region: 'Cranium',
    detail: zygomaticDetail,
    location: 'Right lateral face, between the maxilla, temporal bone, sphenoid, and frontal bone.',
    function: 'Forms the right cheek prominence and part of the lateral wall and floor of the orbit.',
  },
  {
    id: 'FJ3269',
    meshId: 'FJ3269',
    fmaId: 'FMA53650',
    name: 'Left maxilla',
    system: 'Skeletal',
    region: 'Cranium',
    detail: maxillaDetail,
    location: 'Left upper jaw, inferior to the orbit and lateral to the nasal opening.',
    function: 'Supports the left upper teeth and forms parts of the hard palate, orbit, and nasal cavity.',
  },
  {
    id: 'FJ3375',
    meshId: 'FJ3375',
    fmaId: 'FMA53649',
    name: 'Right maxilla',
    system: 'Skeletal',
    region: 'Cranium',
    detail: maxillaDetail,
    location: 'Right upper jaw, inferior to the orbit and lateral to the nasal opening.',
    function: 'Supports the right upper teeth and forms parts of the hard palate, orbit, and nasal cavity.',
  },
  {
    id: 'FJ3289',
    meshId: 'FJ3289',
    fmaId: 'FMA52748',
    name: 'Mandible',
    system: 'Skeletal',
    region: 'Cranium',
    detail: 'The mandible is the mobile lower jaw and the only movable bone of the skull.',
    location: 'Inferior face, articulating with the temporal bones at the temporomandibular joints.',
    function: 'Supports the lower teeth and enables mastication and speech-related movements.',
  },
]

export const systems = ['Skeletal', 'Muscular', 'Nervous', 'Cardiovascular', 'Organs']
export const regions = ['Whole body', 'Cranium', 'Thorax', 'Vertebral column', 'Pelvis', 'Upper extremity']
