import { structures, type AnatomyId } from './anatomy'

export const skullChallengeStages = [
  { id: 'cranial', label: 'Cranial bones' },
  { id: 'major-facial', label: 'Major facial bones' },
  { id: 'smaller-facial', label: 'Smaller facial bones' },
] as const

export type SkullChallengeStageId = typeof skullChallengeStages[number]['id']

type ChallengeTargetSource = {
  answer: string
  stage: SkullChallengeStageId
  sourceMeshIds: readonly string[]
}

const targetSources: readonly ChallengeTargetSource[] = [
  { answer: 'Frontal', stage: 'cranial', sourceMeshIds: ['frontal-bone'] },
  { answer: 'Parietal', stage: 'cranial', sourceMeshIds: ['right-parietal-bone', 'left-parietal-bone'] },
  { answer: 'Temporal', stage: 'cranial', sourceMeshIds: ['right-temporal-bone', 'left-temporal-bone'] },
  { answer: 'Occipital', stage: 'cranial', sourceMeshIds: ['occipital-bone'] },
  { answer: 'Ethmoid', stage: 'cranial', sourceMeshIds: ['ethmoid-bone'] },
  { answer: 'Sphenoid', stage: 'cranial', sourceMeshIds: ['sphenoid-bone'] },
  { answer: 'Zygomatic', stage: 'major-facial', sourceMeshIds: ['right-zygomatic-bone', 'left-zygomatic-bone'] },
  { answer: 'Maxilla', stage: 'major-facial', sourceMeshIds: ['right-maxilla', 'left-maxilla'] },
  { answer: 'Mandible', stage: 'major-facial', sourceMeshIds: ['mandible'] },
  { answer: 'Nasal', stage: 'smaller-facial', sourceMeshIds: ['right-nasal-bone', 'left-nasal-bone'] },
  { answer: 'Lacrimal', stage: 'smaller-facial', sourceMeshIds: ['right-lacrimal-bone', 'left-lacrimal-bone'] },
  { answer: 'Palatine', stage: 'smaller-facial', sourceMeshIds: ['right-palatine-bone', 'left-palatine-bone'] },
  { answer: 'Vomer', stage: 'smaller-facial', sourceMeshIds: ['vomer'] },
  { answer: 'Inferior nasal concha', stage: 'smaller-facial', sourceMeshIds: ['right-inferior-nasal-concha', 'left-inferior-nasal-concha'] },
]

const structuresBySourceMeshId = new Map(
  structures.flatMap(structure => structure.meshAssociations.map(association => [association.sourceMeshId, structure] as const)),
)

export type SkullChallengeTarget = {
  answer: string
  stage: SkullChallengeStageId
  structureIds: readonly AnatomyId[]
  sourceMeshIds: readonly string[]
  acceptedAnswers: ReadonlySet<string>
}

export function normalizeChallengeAnswer(answer: string) {
  return answer
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function createTarget(source: ChallengeTargetSource): SkullChallengeTarget {
  const mappedStructures = source.sourceMeshIds.map(sourceMeshId => {
    const structure = structuresBySourceMeshId.get(sourceMeshId)
    if (!structure) throw new Error(`Skull challenge source mesh "${sourceMeshId}" is missing from the anatomy catalog.`)
    if (structure.region !== 'Skull') {
      throw new Error(`Skull challenge source mesh "${sourceMeshId}" maps to non-skull structure "${structure.id}".`)
    }
    return structure
  })

  if (new Set(mappedStructures.map(structure => structure.id)).size !== mappedStructures.length) {
    throw new Error(`Skull challenge target "${source.answer}" maps a structure more than once.`)
  }

  const expectedSubgroup = source.stage === 'cranial' ? 'Cranial bones' : 'Facial bones'
  if (mappedStructures.some(structure => structure.subgroup !== expectedSubgroup)) {
    throw new Error(`Skull challenge target "${source.answer}" does not match the "${expectedSubgroup}" catalog group.`)
  }

  const answer = normalizeChallengeAnswer(source.answer)
  return {
    answer: source.answer,
    stage: source.stage,
    structureIds: mappedStructures.map(structure => structure.id),
    sourceMeshIds: [...source.sourceMeshIds],
    acceptedAnswers: new Set([answer, `${answer} bone`]),
  }
}

export const skullChallengeTargets = targetSources.map(createTarget)

const mappedStructureIds = new Set(skullChallengeTargets.flatMap(target => target.structureIds))
const expectedStructureIds = structures
  .filter(structure => structure.region === 'Skull' && (structure.subgroup === 'Cranial bones' || structure.subgroup === 'Facial bones'))
  .map(structure => structure.id)

if (skullChallengeTargets.length !== 14
  || mappedStructureIds.size !== 22
  || expectedStructureIds.length !== mappedStructureIds.size
  || expectedStructureIds.some(id => !mappedStructureIds.has(id))) {
  throw new Error('Skull challenge mapping must cover all 22 cataloged cranial and facial structures exactly once.')
}
