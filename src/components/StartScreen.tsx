import { Play } from 'lucide-react'

type Props = { onStart: () => void }

export default function StartScreen({ onStart }: Props) {
  return (
    <div className="start-screen">
      <div className="start-card">
        <div className="start-mark" aria-hidden="true"><span/><span/><span/></div>
        <h1>An-Atomized</h1>
        <p>
          An interactive anatomy atlas. Begin with the skeleton, then build upward through the body&rsquo;s systems.
        </p>
        <button className="primary-button" onClick={onStart}>
          <Play size={18}/> Start
        </button>
      </div>
    </div>
  )
}