import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { ArrowLeft, Check, ChevronRight, RotateCcw, Target } from 'lucide-react'
import { anatomyCatalog, type AnatomyId } from '../data/anatomy'
import {
  normalizeChallengeAnswer,
  skullChallengeStages,
  skullChallengeTargets,
} from '../data/skullChallenge'
import { disposeModelResources } from '../utils/disposeModelResources'
import {
  AssetLoader,
  RendererErrorBoundary,
  SkeletonModel,
  type SkeletonAssetState,
  type SkeletonMesh,
} from './Viewport'
import OnScreenKeyboard from './OnScreenKeyboard'

type Props = {
  onReturn: () => void
}

type SessionPhase = 'playing' | 'completion-animation' | 'complete'
type Feedback = 'correct' | 'incorrect' | 'empty' | null

const skullStructureIds = new Set(skullChallengeTargets.flatMap(target => target.structureIds))
const emptyStructureIds: ReadonlySet<AnatomyId> = new Set()
const noOpacityOverrides: Partial<Record<AnatomyId, number>> = {}
const noSelection = (_id: AnatomyId) => {}

function getChallengeMeshes(state: SkeletonAssetState, structureIds: ReadonlySet<AnatomyId>): SkeletonMesh[] {
  if (state.status !== 'ready') return []
  return Array.from(anatomyCatalog.meshAssociationsById.values())
    .filter(({ structure }) => structureIds.has(structure.id))
    .map(({ structure, association }) => {
      const source = state.meshesBySourceId.get(association.sourceMeshId)
      if (!source) throw new Error(`The loaded skeleton is missing challenge mesh "${association.sourceMeshId}".`)
      return { structure, association, source }
    })
}

function ChallengeSession({ onReturn, onRepeat }: Props & { onRepeat: () => void }) {
  const [phase, setPhase] = useState<SessionPhase>('playing')
  const [targetIndex, setTargetIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [assetState, setAssetState] = useState<SkeletonAssetState>({ status: 'idle' })
  const assetStateRef = useRef(assetState)
  assetStateRef.current = assetState
  const [retryVersion, setRetryVersion] = useState(0)
  const [rendererKey, setRendererKey] = useState(0)
  const [webglReady, setWebglReady] = useState(false)
  const [rendererError, setRendererError] = useState<Error | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateAssetState = useCallback((state: SkeletonAssetState) => setAssetState(state), [])
  const handleRendererError = useCallback((error: Error) => setRendererError(error), [])
  const currentTarget = skullChallengeTargets[targetIndex]
  const currentStage = skullChallengeStages.find(stage => stage.id === currentTarget.stage)
  const stageTargets = skullChallengeTargets.filter(target => target.stage === currentTarget.stage)
  const stageTargetIndex = stageTargets.indexOf(currentTarget)
  const nextTarget = skullChallengeTargets[targetIndex + 1]

  const currentTargetIds = useMemo(() => new Set(currentTarget.structureIds), [currentTarget])
  const nextTargetIds = useMemo(() => new Set(nextTarget?.structureIds ?? []), [nextTarget])
  const currentMeshes = useMemo(() => getChallengeMeshes(assetState, skullStructureIds), [assetState])
  const targetMeshes = useMemo(() => getChallengeMeshes(assetState, currentTargetIds), [assetState, currentTargetIds])
  const previewMeshes = useMemo(
    () => nextTarget ? getChallengeMeshes(assetState, nextTargetIds) : currentMeshes,
    [assetState, currentMeshes, nextTarget, nextTargetIds],
  )

  useEffect(() => () => {
    if (advanceTimer.current !== null) clearTimeout(advanceTimer.current)
    const state = assetStateRef.current
    if (state.status === 'ready') disposeModelResources(state.model)
  }, [])

  useEffect(() => {
    if (phase === 'playing' && assetState.status === 'ready') inputRef.current?.focus()
  }, [assetState.status, phase, targetIndex])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    if (phase !== 'completion-animation') return
    const timer = setTimeout(() => setPhase('complete'), 1400)
    return () => clearTimeout(timer)
  }, [phase])

  const submitAnswer = () => {
    if (phase !== 'playing' || assetState.status !== 'ready' || feedback === 'correct') return
    if (!answer.trim()) {
      setFeedback('empty')
      return
    }

    const normalized = normalizeChallengeAnswer(answer)
    if (!currentTarget.acceptedAnswers.has(normalized)) {
      setFeedback('incorrect')
      return
    }

    setFeedback('correct')
    setCompletedCount(count => count + 1)
    advanceTimer.current = setTimeout(() => {
      setAnswer('')
      setFeedback(null)
      if (targetIndex === skullChallengeTargets.length - 1) {
        setPhase('completion-animation')
      } else {
        setTargetIndex(index => index + 1)
      }
    }, 650)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitAnswer()
  }

  const retryModel = () => {
    if (rendererError) {
      const state = assetStateRef.current
      if (state.status === 'ready') disposeModelResources(state.model)
      setRendererError(null)
      setWebglReady(false)
      setAssetState({ status: 'idle' })
      setRendererKey(key => key + 1)
    }
    setRetryVersion(version => version + 1)
  }

  const targetLetterCount = currentTarget.answer.replace(/[^a-z]/gi, '').length
  const targetHighlightIds = phase === 'completion-animation' ? skullStructureIds : phase === 'complete' ? emptyStructureIds : currentTargetIds
  const targetHighlightColor = feedback === 'correct' ? '#f2d879' : '#4d79ff'
  const modelFitScale = phase === 'playing' ? 1 : 1.28
  const assetFailure = assetState.status === 'missing' || assetState.status === 'invalid' || assetState.status === 'network-error'
  const modelStatus = rendererError
    ? '3D rendering could not start.'
    : assetFailure
      ? 'The skull model could not be loaded.'
      : assetState.status === 'ready'
        ? ''
        : 'Loading and validating the skeleton model…'

  return <section className="skull-challenge" aria-label="Skull identification challenge">
    <div className="challenge-main-column">
      <div className="challenge-progress-header">
        <div>
          <p className="challenge-kicker">IDENTIFICATION SESSION</p>
          <h2>{currentStage?.label ?? 'Skull challenge'}</h2>
        </div>
        <span className="challenge-stage-count">STAGE {skullChallengeStages.findIndex(stage => stage.id === currentTarget.stage) + 1} / {skullChallengeStages.length}</span>
      </div>

      <div
        className="challenge-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={skullChallengeTargets.length}
        aria-valuenow={completedCount}
        aria-valuetext={`${completedCount} of ${skullChallengeTargets.length} targets identified`}
      >
        {skullChallengeTargets.map((target, index) => <span
          key={target.answer}
          className={`challenge-progress-segment ${index < completedCount ? 'is-complete' : ''} ${index === targetIndex && phase === 'playing' ? 'is-current' : ''}`}
          aria-hidden="true"
        />)}
      </div>

      <div className="challenge-scene-grid">
        <section className="challenge-view-card challenge-current-view" aria-label="Current skull target">
          <div className="challenge-view-heading">
            <span className="challenge-view-index">01</span>
            <span>IDENTIFY THE HIGHLIGHTED BONE</span>
          </div>
          <div className="challenge-canvas challenge-main-canvas three-stage" data-testid="challenge-main-canvas">
            <div className="challenge-scene-glow" aria-hidden="true"/>
            {webglReady && <AssetLoader retryVersion={retryVersion} onStateChange={updateAssetState}/>}
            <RendererErrorBoundary
              key={rendererKey}
              onError={handleRendererError}
              fallback={<div className="challenge-render-error" role="alert">
                <strong>3D rendering is unavailable</strong>
                <p>{rendererError?.message ?? 'The browser could not initialize its 3D renderer.'}</p>
              </div>}
            >
              <Canvas
                camera={{ position: [0, 0, 8], fov: 37 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
                onCreated={() => setWebglReady(true)}
              >
                <hemisphereLight color="#f0f4fa" groundColor="#172238" intensity={1.05}/>
                <ambientLight intensity={0.5}/>
                <directionalLight position={[4, 5, 6]} intensity={2.15} color="#f0f4fa"/>
                <directionalLight position={[-4, 1, 3]} intensity={0.7} color="#7899ff"/>
                <pointLight position={[0, -2, 4]} intensity={0.42} color="#4ed7e5"/>
                {assetState.status === 'ready' && <SkeletonModel
                  model={assetState.model}
                  meshes={currentMeshes}
                  fitMeshes={currentMeshes.map(mesh => mesh.source)}
                  selectedId={null}
                  onSelect={noSelection}
                  wire={false}
                  opacityById={noOpacityOverrides}
                  resetKey={0}
                  highlightIds={targetHighlightIds}
                  highlightColor={targetHighlightColor}
                  highlightOpacity={feedback === 'correct' ? 0.88 : 0.68}
                  controlsEnabled
                  fitScale={modelFitScale}
                  smoothFit={!reducedMotion}
                />}
              </Canvas>
            </RendererErrorBoundary>
            {phase === 'completion-animation' && <div className="challenge-reveal" role="status" aria-live="polite">
              <span>SKULL COMPLETE</span>
              <strong>All 22 cranial and facial structures revealed</strong>
            </div>}
            {phase === 'complete' && <div className="challenge-finish-overlay" aria-hidden="true"/>}
            {modelStatus && <div className={`challenge-model-status ${assetFailure || rendererError ? 'is-error' : ''}`} role={assetFailure || rendererError ? 'alert' : 'status'}>
              <span>{modelStatus}</span>
              {(assetFailure || rendererError) && <button className="tool-button" type="button" onClick={retryModel}>Retry loading model</button>}
              {assetFailure && <span className="challenge-model-detail">{assetState.message}</span>}
            </div>}
            {assetState.status === 'ready' && <div className="challenge-model-count" data-structure-count={targetMeshes.length}>
              {targetMeshes.length} of 22 skull structures · real source geometry
            </div>}
          </div>
          <p className="challenge-view-caption">
            <span><i className="challenge-target-swatch"/>Highlighted target</span>
            <span>Drag to rotate · scroll to zoom · right-drag to pan</span>
          </p>
        </section>

        <section className="challenge-view-card challenge-preview-view" aria-label={nextTarget ? 'Next target preview' : 'Complete skull preview'}>
          <div className="challenge-view-heading">
            <span className="challenge-view-index">02</span>
            <span>{nextTarget ? 'NEXT · NAME HIDDEN' : 'COMPLETE SKULL'}</span>
          </div>
          <div className="challenge-canvas challenge-preview-canvas three-stage" data-testid="challenge-preview-canvas">
            <div className="challenge-scene-glow" aria-hidden="true"/>
            {assetState.status === 'ready' && <Canvas
              camera={{ position: [0, 0, 8], fov: 37 }}
              dpr={[1, 1.25]}
              gl={{ antialias: true, alpha: true }}
            >
              <hemisphereLight color="#f0f4fa" groundColor="#172238" intensity={1.05}/>
              <ambientLight intensity={0.5}/>
              <directionalLight position={[4, 5, 6]} intensity={2.15} color="#f0f4fa"/>
              <directionalLight position={[-4, 1, 3]} intensity={0.7} color="#7899ff"/>
              <SkeletonModel
                model={assetState.model}
                meshes={previewMeshes}
                fitMeshes={previewMeshes.map(mesh => mesh.source)}
                selectedId={null}
                onSelect={noSelection}
                wire={false}
                opacityById={noOpacityOverrides}
                resetKey={0}
                highlightIds={nextTarget ? nextTargetIds : emptyStructureIds}
                highlightColor="#4d79ff"
                highlightOpacity={0.74}
                interactive={false}
                controlsEnabled={false}
                fitScale={1.12}
              />
            </Canvas>}
            {assetState.status === 'ready' && <span className="challenge-preview-count">{previewMeshes.length === currentMeshes.length && !nextTarget ? '22 STRUCTURES' : `${previewMeshes.length} SOURCE MESH${previewMeshes.length === 1 ? '' : 'ES'}`}</span>}
          </div>
          <p className="challenge-view-caption">
            {nextTarget
              ? <><span><i className="challenge-preview-swatch"/>Next structure preview</span><span>Target name stays hidden</span></>
              : <><span><i className="challenge-target-swatch"/>Complete skull</span><span>Source meshes remain distinct</span></>}
          </p>
        </section>
      </div>
      <p className="challenge-attribution">
        <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" target="_blank" rel="noreferrer">BodyParts3D · © DBCLS · CC BY-SA 2.1 JP</a>
        <span>OrganUI adaptation · adult-male reference model</span>
      </p>
    </div>

    <aside className="challenge-side-column">
      {phase === 'complete' ? <section className="challenge-complete-card" aria-labelledby="challenge-complete-title">
        <div className="challenge-complete-icon"><Check size={23}/></div>
        <p className="challenge-kicker">SESSION COMPLETE</p>
        <h2 id="challenge-complete-title">Skull Challenge Complete</h2>
        <p>You identified all {completedCount} target names across the cranial and facial bone stages.</p>
        <div className="challenge-complete-summary">
          <span>Names identified</span><strong>{completedCount} / {skullChallengeTargets.length}</strong>
          <span>Source structures highlighted</span><strong>22</strong>
        </div>
        <button className="primary-button challenge-action-button" type="button" onClick={onRepeat}><RotateCcw size={17}/> Play again</button>
        <button className="challenge-return-button" type="button" onClick={onReturn}><ArrowLeft size={16}/> Return to Atlas</button>
      </section> : <>
        <section className="challenge-answer-card" aria-labelledby="challenge-answer-title">
          <div className="challenge-question-mark"><Target size={18}/></div>
          <p className="challenge-kicker">TARGET {String(targetIndex + 1).padStart(2, '0')} / {String(skullChallengeTargets.length).padStart(2, '0')}</p>
          <h2 id="challenge-answer-title">Name this bone</h2>
          <p className="challenge-answer-instruction">
            {currentTarget.structureIds.length > 1
              ? 'Both left and right bones are highlighted. Enter their shared bone name.'
              : 'Enter the name of the highlighted bone.'}
          </p>

          <form onSubmit={handleSubmit} className={`challenge-answer-form ${feedback === 'incorrect' ? 'has-incorrect-answer' : ''} ${feedback === 'correct' ? 'has-correct-answer' : ''}`}>
            <label className="challenge-answer-label" htmlFor="challenge-answer">Your answer</label>
            <div className="challenge-input-wrap">
              <input
                ref={inputRef}
                id="challenge-answer"
                data-testid="challenge-answer"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={answer}
                onChange={event => {
                  setAnswer(event.target.value)
                  if (feedback !== 'correct') setFeedback(null)
                }}
                placeholder="Type bone name…"
                disabled={phase !== 'playing' || assetState.status !== 'ready'}
                aria-describedby="challenge-hint challenge-feedback"
              />
              <button className="challenge-submit-button" type="submit" disabled={phase !== 'playing' || assetState.status !== 'ready' || feedback === 'correct'} aria-label="Submit answer">
                <ChevronRight size={19}/>
              </button>
            </div>
            <div className="challenge-hint-row" id="challenge-hint">
              <span>{targetLetterCount} letters</span>
              <span>First letter: <strong>{currentTarget.answer[0]}</strong></span>
            </div>
            <p className={`challenge-feedback ${feedback ? `feedback-${feedback}` : ''}`} id="challenge-feedback" role="status" aria-live="polite">
              {feedback === 'correct'
                ? 'Correct. Moving to the next structure…'
                : feedback === 'incorrect'
                  ? 'Not quite. Try again.'
                  : feedback === 'empty'
                    ? 'Enter a bone name to continue.'
                    : ' '}
            </p>
          </form>

          <OnScreenKeyboard
            answer={answer}
            inputRef={inputRef}
            onChange={value => {
              setAnswer(value)
              if (feedback !== 'correct') setFeedback(null)
            }}
            onSubmit={submitAnswer}
          />
          <p className="challenge-keyboard-note">Use your keyboard or tap the keys above.</p>
        </section>

        <section className="challenge-stage-card" aria-label="Challenge stage progress">
          <div className="challenge-stage-card-header">
            <span>STAGE PROGRESS</span>
            <span>{stageTargetIndex + 1} / {stageTargets.length}</span>
          </div>
          <div className="challenge-stage-list">
            {skullChallengeStages.map((stage, index) => {
              const stageCount = skullChallengeTargets.filter(target => target.stage === stage.id).length
              const stageComplete = skullChallengeTargets.filter(target => target.stage === stage.id)
                .every(target => skullChallengeTargets.indexOf(target) < completedCount)
              return <div key={stage.id} className={`challenge-stage-row ${stage.id === currentTarget.stage ? 'is-active' : ''} ${stageComplete ? 'is-done' : ''}`}>
                <span className="challenge-stage-marker">{stageComplete ? <Check size={12}/> : String(index + 1).padStart(2, '0')}</span>
                <span>{stage.label}</span>
                <span className="challenge-stage-total">{stageCount}</span>
              </div>
            })}
          </div>
        </section>

        <button className="challenge-back-button" type="button" onClick={onReturn}><ArrowLeft size={15}/> Exit challenge</button>
      </>}
    </aside>
  </section>
}

export default function SkullChallenge({ onReturn }: Props) {
  const [sessionKey, setSessionKey] = useState(0)
  const startSession = () => setSessionKey(key => key + 1)

  return sessionKey === 0
    ? <section className="challenge-intro" aria-labelledby="challenge-intro-title">
      <div className="challenge-intro-content">
        <div className="challenge-intro-icon"><Target size={23}/></div>
        <p className="challenge-kicker">REAL ANATOMY · 3 STAGES</p>
        <h2 id="challenge-intro-title">Learn the bones of the skull</h2>
        <p>Identify 14 cranial and facial bone names using highlighted geometry from the full BodyParts3D skeleton. Paired left and right bones are highlighted independently and share one answer.</p>
        <div className="challenge-intro-facts">
          <span><strong>8</strong> cranial structures</span>
          <span><strong>14</strong> facial structures</span>
          <span><strong>22</strong> source meshes</span>
        </div>
        <button className="primary-button challenge-start-button" type="button" onClick={startSession}><Target size={17}/> Start skull challenge</button>
        <button className="challenge-return-button" type="button" onClick={onReturn}><ArrowLeft size={16}/> Return to Atlas</button>
      </div>
      <div className="challenge-intro-geometry" aria-hidden="true">
        <div className="challenge-geometry-ring challenge-geometry-ring-outer"/>
        <div className="challenge-geometry-ring challenge-geometry-ring-inner"/>
        <span>FMA · BODY PARTS 3D</span>
      </div>
    </section>
    : <ChallengeSession key={sessionKey} onReturn={onReturn} onRepeat={startSession}/>
}
