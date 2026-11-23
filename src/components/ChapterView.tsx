import { ArrowLeft } from 'lucide-react'

type Props = { chapterId: number; onBack: () => void }

type Chapter = {
  title: string
  subtitle: string
  body: string
}

const chapters: Record<number, Chapter> = {
  2: {
    title: 'Muscular System',
    subtitle: 'Chapter 2 &middot; Builds on the skeleton',
    body:
      'Skeletal muscles attach to bones via tendons, using the skeleton as a system of levers. Every movement &mdash; from walking to facial expression &mdash; relies on muscle contraction pulling against bone.',
  },
  3: {
    title: 'Nervous System',
    subtitle: 'Chapter 3 &middot; Protected by bone',
    body:
      'The skull encases and protects the brain, while the vertebral column surrounds the spinal cord. Nerves exit through openings in the skeleton to reach the rest of the body.',
  },
  4: {
    title: 'Circulatory System',
    subtitle: 'Chapter 4 &middot; Housed within the skeleton',
    body:
      'The heart sits in the thoracic cavity, shielded by the ribcage and sternum. Major arteries and veins run alongside skeletal structures throughout the body.',
  },
  5: {
    title: 'Respiratory System',
    subtitle: 'Chapter 5 &middot; The thoracic cavity',
    body:
      'The ribcage, spine, and sternum form the bony thorax that expands and contracts with breathing. The nasal cavity and upper airways begin within the skull.',
  },
  6: {
    title: 'Digestive System',
    subtitle: 'Chapter 6 &middot; Supported by the skeleton',
    body:
      'Digestion begins in the oral cavity, framed by the jaws and teeth. The spine supports the abdominal organs, and the pelvis forms the base of the lower digestive tract.',
  },
  7: {
    title: 'Endocrine System',
    subtitle: 'Chapter 7 &middot; Glands near bone',
    body:
      'The pituitary gland sits in the sella turcica of the sphenoid bone. The thyroid wraps around the trachea in the neck, close to cervical vertebrae.',
  },
  8: {
    title: 'Lymphatic System',
    subtitle: 'Chapter 8 &middot; Along skeletal pathways',
    body:
      'Lymph nodes cluster in regions adjacent to skeletal joints &mdash; the neck, axilla, and groin &mdash; filtering fluid as it moves through the body.',
  },
  9: {
    title: 'Urinary System',
    subtitle: 'Chapter 9 &middot; Resting on the skeleton',
    body:
      'The kidneys sit against the posterior abdominal wall near the spine, and the pelvis forms the basin that supports the bladder.',
  },
  10: {
    title: 'Reproductive System',
    subtitle: 'Chapter 10 &middot; Protected by the pelvis',
    body:
      'The pelvis forms a bony basin that supports and protects the reproductive organs, providing structural support throughout development and life.',
  },
}

export default function ChapterView({ chapterId, onBack }: Props) {
  const chapter = chapters[chapterId]
  if (!chapter) return null

  return (
    <div className="chapter-view">
      <button className="chapter-back" onClick={onBack} aria-label="Back to chapters">
        <ArrowLeft size={16}/> Back to chapters
      </button>
      <div className="chapter-content">
        <h1>{chapter.title}</h1>
        <p className="chapter-subtitle">{chapter.subtitle}</p>
        <p className="chapter-body">{chapter.body}</p>
      </div>
    </div>
  )
}