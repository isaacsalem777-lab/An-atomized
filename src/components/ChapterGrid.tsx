import { ChevronRight } from 'lucide-react'

const chapters = [
  { id: 1, title: 'Skeleton', subtitle: 'The bony foundation of the body' },
  { id: 2, title: 'Muscular System', subtitle: 'Muscles that move the skeleton' },
  { id: 3, title: 'Nervous System', subtitle: 'Brain, nerves, and signaling' },
  { id: 4, title: 'Circulatory System', subtitle: 'Heart, blood, and vessels' },
  { id: 5, title: 'Respiratory System', subtitle: 'Lungs and airways' },
  { id: 6, title: 'Digestive System', subtitle: 'From mouth to intestines' },
  { id: 7, title: 'Endocrine System', subtitle: 'Hormones and glands' },
  { id: 8, title: 'Lymphatic System', subtitle: 'Immunity and fluid balance' },
  { id: 9, title: 'Urinary System', subtitle: 'Kidneys and waste removal' },
  { id: 10, title: 'Reproductive System', subtitle: 'Human reproduction' },
] as const

type Props = { onChapterSelect: (id: number) => void }

export default function ChapterGrid({ onChapterSelect }: Props) {
  return (
    <div className="chapter-grid">
      <div className="chapter-header">
        <h1>Choose a chapter</h1>
        <p>
          Chapter 1 &mdash; Skeleton &mdash; is the foundation. Later chapters build on it.
        </p>
      </div>
      <div className="chapter-buttons">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            className={`chapter-button ${chapter.id === 1 ? 'chapter-active' : ''}`}
            onClick={() => onChapterSelect(chapter.id)}
          >
            <span className="chapter-number">0{chapter.id}</span>
            <div className="chapter-info">
              <span className="chapter-title">{chapter.title}</span>
              <span className="chapter-subtitle">{chapter.subtitle}</span>
            </div>
            <ChevronRight size={14}/>
          </button>
        ))}
      </div>
    </div>
  )
}