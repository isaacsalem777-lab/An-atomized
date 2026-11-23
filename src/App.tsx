import { lazy, Suspense, useMemo, useState } from 'react'
import {
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  Eye,
  EyeOff,
  Layers,
  ArrowRight,
  Search,
  Target,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { anatomyCatalog, structures, type AnatomyId } from './data/anatomy'
import ChapterGrid from './components/ChapterGrid'
import ChapterView from './components/ChapterView'

type Tab = 'Atlas' | 'Challenge' | 'Progress'

const Viewport = lazy(() => import('./components/Viewport'))
const SkullChallenge = lazy(() => import('./components/SkullChallenge'))

const nav: { name: Tab; icon: LucideIcon }[] = [
  { name: 'Atlas', icon: Compass },
  { name: 'Challenge', icon: Target },
  { name: 'Progress', icon: ChartNoAxesColumnIncreasing },
]

const systems = ['All systems', ...new Set(structures.map(structure => structure.system))]
const regions = ['All regions', 'Skull', 'Neck', 'Spine', 'Thorax', 'Pelvis', 'Upper limbs', 'Lower limbs']

function matchesFilters(structure: typeof structures[number], system: string, region: string) {
  return (system === 'All systems' || structure.system === system)
    && (region === 'All regions' || structure.region === region)
}

export default function App() {
  const [hasStarted, setHasStarted] = useState(false)
  const [chapterId, setChapterId] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('Atlas')
  const [system, setSystem] = useState('All systems')
  const [region, setRegion] = useState('All regions')
  const fitStructureIds = useMemo(
    () => new Set(structures.filter(structure => matchesFilters(structure, system, region)).map(structure => structure.id)),
    [region, system],
  )
  const [selectedId, setSelectedId] = useState<AnatomyId | null>(null)
  const selected = selectedId ? anatomyCatalog.structuresById.get(selectedId) : undefined
  const selectStructure = (id: AnatomyId | null) => setSelectedId(current => current === id ? null : id)
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<AnatomyId>>(() => new Set())
  const [isolationId, setIsolationId] = useState<AnatomyId | null>(null)
  const [opacityById, setOpacityById] = useState<Partial<Record<AnatomyId, number>>>({})
  const [showInfo, setShowInfo] = useState(true)
  const [helpOpen, setHelpOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedDisplayed = selected
    ? isolationId ? isolationId === selected.id : !hiddenIds.has(selected.id)
    : false
  const selectedTemporarilyHidden = Boolean(isolationId && selected && isolationId !== selected.id)
  const filteredStructures = structures.filter(structure => matchesFilters(structure, system, region))
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const referenceStructures = filteredStructures.filter(structure => {
    if (!normalizedSearch) return true
    const identifiers = [
      structure.id,
      structure.system,
      structure.region,
      structure.subgroup ?? '',
      structure.sourceName ?? '',
      ...(structure.externalIds ?? []).map(identifier => identifier.identifier),
      ...structure.meshAssociations.map(association => association.sourceMeshId),
    ]
    return [structure.name, ...identifiers].some(value => value.toLowerCase().includes(normalizedSearch))
  })
  const referenceGroups = regions.slice(1).map(group => {
    const groupStructures = referenceStructures.filter(structure => structure.region === group)
    const subgroups = new Map<string, typeof structures[number][]>()
    groupStructures.forEach(structure => {
      const subgroup = structure.subgroup ?? 'Subgroup not provided'
      const subgroupStructures = subgroups.get(subgroup)
      if (subgroupStructures) subgroupStructures.push(structure)
      else subgroups.set(subgroup, [structure])
    })
    return {
      group,
      count: groupStructures.length,
      subgroups: Array.from(subgroups, ([subgroup, subgroupStructures]) => ({
        subgroup,
        structures: subgroupStructures,
      })),
    }
  }).filter(group => group.count > 0)
  const visibleStructureIds = new Set(filteredStructures
    .filter(structure => isolationId ? structure.id === isolationId : !hiddenIds.has(structure.id))
    .map(structure => structure.id))
  const hiddenCount = filteredStructures.filter(structure => hiddenIds.has(structure.id)).length

  const updateFilters = (nextSystem: string, nextRegion: string) => {
    setSystem(nextSystem)
    setRegion(nextRegion)
    if (selected && !matchesFilters(selected, nextSystem, nextRegion)) setSelectedId(null)
    if (isolationId) {
      const isolated = anatomyCatalog.structuresById.get(isolationId)
      if (!isolated || !matchesFilters(isolated, nextSystem, nextRegion)) setIsolationId(null)
    }
  }
  const setStructureVisibility = (id: AnatomyId, visible: boolean) => {
    setHiddenIds(current => {
      const next = new Set(current)
      if (visible) next.delete(id)
      else next.add(id)
      return next
    })
    if (!visible && isolationId === id) setIsolationId(null)
  }
  const showAllStructures = () => {
    setHiddenIds(new Set())
    setIsolationId(null)
  }
  const toggleStructureSearch = () => {
    if (searchOpen) setSearchTerm('')
    setSearchOpen(!searchOpen)
  }

  if (!hasStarted) return <main className="title-screen" aria-labelledby="title-screen-heading">
    <div className="title-grid" aria-hidden="true"/>
    <header className="title-screen-header">
      <div className="title-brand">
        <div className="brand-mark" aria-hidden="true"><span/><span/><span/></div>
        <span>AN-ATOMIZED</span>
      </div>
      <span className="title-header-label"><span/> ANATOMY / INTERACTIVE</span>
    </header>

    <section className="title-hero">
      <div className="title-copy">
        <p className="title-eyebrow"><span>01</span> &nbsp; ANATOMY, DECONSTRUCTED</p>
        <h1 id="title-screen-heading" aria-label="AN-ATOMIZED">
          <span className="title-line">AN<span className="title-hyphen">-</span></span>
          <span className="title-word">ATOMIZED</span>
        </h1>
        <p className="title-description">Explore the human form.<br/>One structure at a time.</p>
        <button className="title-start-button" onClick={() => setHasStarted(true)}>
          <span>START</span><ArrowRight size={20} strokeWidth={1.8}/>
        </button>
        <p className="title-footnote"><span/> 3D ANATOMY ATLAS <span className="title-footnote-divider">/</span> EDUCATIONAL PREVIEW</p>
      </div>

      <div className="title-visual" aria-hidden="true">
        <div className="title-visual-glow"/>
        <div className="title-orbit title-orbit-outer"/>
        <div className="title-orbit title-orbit-middle"/>
        <div className="title-orbit title-orbit-inner"/>
        <div className="title-axis title-axis-horizontal"/>
        <div className="title-axis title-axis-vertical"/>
        <div className="title-core"><span/><i/><b/></div>
        <div className="title-orbit-dot title-orbit-dot-red"/>
        <div className="title-orbit-dot title-orbit-dot-blue"/>
        <span className="title-visual-code title-visual-code-top">FIG. 001 <span>/</span> HUMAN FORM</span>
        <span className="title-visual-code title-visual-code-bottom">STRUCTURE <span>+ </span> SYSTEM</span>
      </div>
    </section>

    <footer className="title-screen-footer">
      <span>AN-ATOMIZED <span className="title-footer-muted">© 2026</span></span>
      <span className="title-footer-center">A STUDY IN STRUCTURE</span>
      <span className="title-footer-status"><span/> SYSTEM READY</span>
    </footer>
  </main>

  if (hasStarted && chapterId === null) {
    return <ChapterGrid onChapterSelect={setChapterId}/>
  }

  const showSkeletonApp = chapterId === 1

  return (
    <div className="app-shell">
      {showSkeletonApp ? (
        <>
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true"><span/><span/><span/></div>
        <span className="brand-name">An-Atomized</span>
      </div>
      <nav className="main-nav" aria-label="Primary navigation">
        {nav.map(({ name, icon: Icon }) => <button
          key={name}
          className={`nav-item ${tab === name ? 'selected' : ''}`}
          aria-current={tab === name ? 'page' : undefined}
          onClick={() => setTab(name)}
        >
          <Icon size={18}/><span>{name}</span>
        </button>)}
      </nav>
      <div className="sidebar-note">
        <span className="sidebar-note-label">MODEL</span>
        <strong>{structures.length} structures</strong>
        <span>Skeleton model</span>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left">
          <div className="breadcrumb"><span>An-Atomized</span><ChevronRight size={14}/><strong>{tab}</strong></div>
        </div>
        <button className="top-icon" aria-label="Help" title="Help" onClick={() => setHelpOpen(true)}><CircleHelp size={19}/></button>
      </header>

      <div className={`page-content ${tab === 'Atlas' ? 'atlas-page' : tab === 'Challenge' ? 'challenge-page' : 'future-page'}`}>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{tab === 'Atlas' ? 'Interactive anatomy' : tab === 'Challenge' ? 'Interactive identification' : 'Coming later'}</p>
            <h1>{tab === 'Atlas' ? 'Anatomy Atlas' : tab}</h1>
            <p className="page-description">
              {tab === 'Atlas'
                ? `Browse ${structures.length} selectable structures across the skull, neck, spine, thorax, pelvis, and limbs. This is a simplified adult-male reference model with documented omissions and combined meshes.`
                : tab === 'Challenge'
                  ? 'Identify the cranial and facial bones using the actual segmented skull geometry.'
                  : 'Progress tracking is not available yet.'}
            </p>
          </div>
        </div>

        {tab === 'Atlas' ? <div className="workspace-grid">
          <div className="center-column">
            <div className="toolbar">
              <div className="toolbar-selects">
                <label>
                  <span>System</span>
                  <div className="select-wrap">
                    <select aria-label="System filter" value={system} onChange={event => updateFilters(event.target.value, region)}>
                      {systems.map(value => <option key={value}>{value}</option>)}
                    </select>
                    <ChevronDown size={16}/>
                  </div>
                </label>
                <label>
                  <span>Region</span>
                  <div className="select-wrap">
                    <select aria-label="Region filter" value={region} onChange={event => updateFilters(system, event.target.value)}>
                      {regions.map(value => <option key={value}>{value}</option>)}
                    </select>
                    <ChevronDown size={16}/>
                  </div>
                </label>
              </div>
              <button
                className="tool-button details-toggle"
                aria-expanded={showInfo}
                onClick={() => setShowInfo(value => !value)}
              >
                <Layers size={17}/><span>{showInfo ? 'Hide panel' : 'Show panel'}</span>
              </button>
            </div>
            <Suspense fallback={<div className="viewport-loading" role="status" aria-busy="true">
              <div className="viewport-loading-header"><span className="live-dot"/> Preparing the anatomy viewer</div>
              <div className="viewport-loading-stage">Loading the interactive model…</div>
            </div>}>
              <Viewport
                selectedId={selectedId}
                onSelect={selectStructure}
                fitStructureIds={fitStructureIds}
                visibleStructureIds={visibleStructureIds}
                matchedStructureCount={filteredStructures.length}
                hiddenCount={hiddenCount}
                isolationId={isolationId}
                opacityById={opacityById}
              />
            </Suspense>
          </div>

          {showInfo && <aside className="right-panel" aria-label="Anatomy reference">
            <div className="panel-header">
              <div>
                <p className="panel-overline">Anatomy reference</p>
                <h2>{selected?.name ?? 'Select a structure'}</h2>
              </div>
              <button
                className="panel-icon-button"
                aria-label={searchOpen ? 'Close structure search' : 'Search structures'}
                aria-expanded={searchOpen}
                onClick={toggleStructureSearch}
              ><Search size={19}/></button>
            </div>

            {selected ? <>
              <div className="structure-tags">
                <span>{selected.system}</span><span>{selected.region}</span>
                {selected.subgroup && <span>{selected.subgroup}</span>}
                <span>{selected.laterality}</span>
              </div>
              <div className="panel-section structure-information">
                <div className="panel-section-heading">Identifiers</div>
                <p className="info-copy">Anatomy ID: {selected.id}<br/>
                  {selected.externalIds?.map(identifier => <span key={`${identifier.system}:${identifier.identifier}`}>{identifier.system}: {identifier.identifier}<br/></span>)}
                  {selected.meshAssociations.map(association => <span key={association.id}>{association.source} mesh: {association.sourceMeshId}<br/></span>)}
                </p>
                {selected.description && <>
                  <div className="panel-section-heading">Overview</div>
                  <p className="info-copy">{selected.description}</p>
                </>}
                {selected.location && <>
                  <div className="panel-section-heading">Location</div>
                  <p className="info-copy">{selected.location}</p>
                </>}
                {selected.function && <>
                  <div className="panel-section-heading">Function</div>
                  <p className="info-copy">{selected.function}</p>
                </>}
                {selected.sourceNote && <>
                  <div className="panel-section-heading">Model note</div>
                  <p className="info-copy">{selected.sourceNote}</p>
                </>}
              </div>
            </> : <div className="panel-section selection-prompt">
              <p>Select a skeletal structure in the model or choose one from the structure index.</p>
            </div>}

            <div className="panel-section structure-control-section">
              <div className="panel-section-heading">Structure controls</div>
              {selected && <>
                <div className="structure-actions">
                  <button
                    className="tool-button"
                    aria-label={selectedTemporarilyHidden ? `${selected.name} hidden by isolation` : `${selectedDisplayed ? 'Hide' : 'Show'} ${selected.name}`}
                    disabled={selectedTemporarilyHidden}
                    onClick={() => setStructureVisibility(selected.id, !selectedDisplayed)}
                  >
                    {selectedDisplayed ? <EyeOff size={17}/> : <Eye size={17}/>}
                    <span>{selectedDisplayed ? 'Hide' : 'Show'}</span>
                  </button>
                  <button
                    className={`tool-button ${isolationId === selected.id ? 'control-active' : ''}`}
                    aria-label={isolationId === selected.id ? 'Exit isolation' : `Isolate ${selected.name}`}
                    onClick={() => setIsolationId(current => current === selected.id ? null : selected.id)}
                  >
                    <Target size={17}/><span>{isolationId === selected.id ? 'Exit isolation' : 'Isolate'}</span>
                  </button>
                </div>
                <label className="opacity-control">
                  <span>Opacity <strong>{opacityById[selected.id] ?? 100}%</strong></span>
                  <input
                    aria-label={`Opacity for ${selected.name}`}
                    type="range"
                    min="15"
                    max="100"
                    step="5"
                    value={opacityById[selected.id] ?? 100}
                    onChange={event => {
                      const value = Number(event.target.value)
                      setOpacityById(current => ({ ...current, [selected.id]: value }))
                    }}
                  />
                </label>
                <p className="interaction-status" role="status">
                  {isolationId === selected.id ? 'This structure is isolated.' : selectedTemporarilyHidden ? 'This structure is hidden by isolation.' : hiddenIds.has(selected.id) ? 'This structure is hidden from the viewport.' : 'This structure is visible in the viewport.'}
                </p>
              </>}
              <button className="show-all-button" onClick={showAllStructures} disabled={hiddenIds.size === 0 && isolationId === null}>Show all structures</button>
            </div>

            <div className="panel-section structure-index-section">
              <div className="structure-index-heading">
                <div className="panel-section-heading">Structure index <span>{referenceStructures.length}</span></div>
              </div>
              {searchOpen && <label className="structure-search">
                <span>Search anatomy</span>
                <input aria-label="Search structures" autoFocus value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Name, ID, or mesh"/>
              </label>}
              {referenceStructures.length > 0 ? referenceGroups.map(({ group, count, subgroups }) => <div key={group} className="structure-index-group">
                <h3 className="structure-index-group-heading" aria-label={`${group}, ${count} ${count === 1 ? 'structure' : 'structures'}`}>
                  {group}<span aria-hidden="true">{count}</span>
                </h3>
                {subgroups.map(({ subgroup, structures: subgroupStructures }) => <div key={subgroup} className="structure-index-subgroup">
                  <h4 className="structure-index-subgroup-heading" aria-label={`${subgroup}, ${subgroupStructures.length} ${subgroupStructures.length === 1 ? 'structure' : 'structures'}`}>
                    {subgroup}<span aria-hidden="true">{subgroupStructures.length}</span>
                  </h4>
                  {subgroupStructures.map(structure => {
                    const isolated = isolationId === structure.id
                    const hiddenByIsolation = isolationId !== null && !isolated
                    const hidden = hiddenIds.has(structure.id)
                    const displayed = isolated || (!hiddenByIsolation && !hidden)
                    const visibilityLabel = hiddenByIsolation ? 'Hidden by isolation' : isolated ? 'Isolated' : hidden ? 'Hidden' : 'Visible'
                    return <div key={structure.id} className={`structure-row ${selected?.id === structure.id ? 'current' : ''} ${displayed ? '' : 'structure-row-hidden'}`}>
                      <button className="structure-select" aria-label={`Select ${structure.name}`} aria-pressed={selected?.id === structure.id} onClick={() => setSelectedId(structure.id)}>
                        <span>{structure.name}</span><span className="structure-visibility-label">{visibilityLabel}</span>
                      </button>
                      <button
                        className="structure-visibility-button"
                        aria-label={hiddenByIsolation ? `${structure.name} hidden by isolation` : `${hidden ? 'Show' : 'Hide'} ${structure.name}`}
                        title={visibilityLabel}
                        disabled={hiddenByIsolation}
                        onClick={() => setStructureVisibility(structure.id, !displayed)}
                      >
                        {displayed ? <Eye size={17}/> : <EyeOff size={17}/>}
                      </button>
                    </div>
                  })}
                </div>)}
              </div>) : <p className="filter-empty-message" role="status">{normalizedSearch ? 'No structures match your search.' : 'No structures match the selected filters.'}</p>}
            </div>
          </aside>}
        </div> : tab === 'Challenge' ? <Suspense fallback={<div className="challenge-loading" role="status">Preparing the skull challenge…</div>}>
          <SkullChallenge onReturn={() => setTab('Atlas')}/>
        </Suspense> : <section className="future-state" aria-labelledby="future-state-title">
          <div className="future-state-icon"><ChartNoAxesColumnIncreasing size={24}/></div>
          <p className="future-state-label">Not available yet</p>
          <h2 id="future-state-title">Progress tracking is not available yet</h2>
          <p>
            Your learning history will appear here after challenge results can be recorded. No progress has been tracked.
          </p>
          <button className="primary-button" onClick={() => setTab('Atlas')}>Open Atlas<ChevronRight size={18}/></button>
        </section>}

        <footer className="page-footer">Educational preview · Not for clinical use</footer>
      </div>
    </main>

    {helpOpen && <div className="help-dialog-backdrop" onClick={() => setHelpOpen(false)}>
      <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={event => event.stopPropagation()} onKeyDown={event => {if(event.key === 'Escape') setHelpOpen(false)}}>
        <div className="help-dialog-header">
          <div><p className="panel-overline">Anatomy Atlas</p><h2 id="help-title">Using the anatomy viewer</h2></div>
          <button className="panel-icon-button" aria-label="Close help" autoFocus onClick={() => setHelpOpen(false)}><X size={18}/></button>
        </div>
        <p>Select a structure in the model or Atlas index to view its reference information. Search by name, anatomy ID, source identifier, or source mesh ID.</p>
        <p>Drag to orbit, scroll to zoom, and right-drag to pan. Selected structures can be hidden, isolated, or made transparent.</p>
        <p>The model contains {structures.length} selectable structures: bones, costal cartilages, and intervertebral discs. It omits the coccyx, teeth, and ear ossicles; some structures are combined meshes. See the bundled attribution for source and license details.</p>
        <button className="tool-button help-close-button" onClick={() => setHelpOpen(false)}>Close help</button>
      </section>
    </div>}
      </>
    ) : chapterId !== null ? (
      <ChapterView chapterId={chapterId} onBack={() => setChapterId(null)}/>
    ) : null}
  </div>
  )
}
