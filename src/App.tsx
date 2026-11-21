import { useState } from 'react'
import { Activity, Atom, BookOpen, ChartNoAxesColumnIncreasing, ChevronDown, ChevronRight, CircleHelp, Clock3, Command, Compass, Crosshair, Eye, EyeOff, Gauge, Layers, Menu, Search, Settings2, ShieldCheck, Sparkles, Target, Trophy, X } from 'lucide-react'
import Viewport from './components/Viewport'
import { anatomyCatalog, regions, structures, systems, type AnatomyId } from './data/anatomy'

type Tab = 'Dashboard' | 'Explore' | 'Challenge' | 'Progress'
const nav: { name: Tab; icon: typeof Activity }[] = [
  { name: 'Dashboard', icon: Gauge }, { name: 'Explore', icon: Compass }, { name: 'Challenge', icon: Target }, { name: 'Progress', icon: ChartNoAxesColumnIncreasing },
]

function matchesFilters(structure: typeof structures[number], system: string, region: string) {
  return (system === 'All systems' || structure.system === system)
    && (region === 'Whole body' || structure.region === region)
}

export default function App() {
  const [tab, setTab] = useState<Tab>('Challenge')
  const [system, setSystem] = useState('All systems')
  const [region, setRegion] = useState('Whole body')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [selectedId, setSelectedId] = useState<AnatomyId | null>(null)
  const selected = selectedId ? anatomyCatalog.structuresById.get(selectedId) : undefined
  const selectStructure = (id: AnatomyId | null) => setSelectedId(current => current === id ? null : id)
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<AnatomyId>>(() => new Set())
  const [isolationId, setIsolationId] = useState<AnatomyId | null>(null)
  const [transparencyById, setTransparencyById] = useState<Partial<Record<AnatomyId, number>>>({})
  const selectedDisplayed = selected
    ? isolationId ? isolationId === selected.id : !hiddenIds.has(selected.id)
    : false
  const selectedTemporarilyHidden = Boolean(isolationId && selected && isolationId !== selected.id)
  const [showInfo, setShowInfo] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [answered, setAnswered] = useState(false)
  const filteredStructures = structures.filter(structure => matchesFilters(structure, system, region))
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

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={20}/></div><div><div className="brand-name">ANATOMY<span>®</span></div><div className="brand-sub">ANATOMICAL TRAINING SYSTEM</div></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-tag">WORKSPACE <span>01</span></div>
      <nav className="main-nav">{nav.map(({name, icon: Icon}) => <button key={name} className={`nav-item ${tab === name ? 'selected' : ''}`} onClick={() => {setTab(name); setMobileNav(false)}}><Icon size={17}/><span>{name}</span>{name === 'Challenge' && <i className="nav-live"/>}</button>)}</nav>
      <div className="sidebar-rule"/>
      <div className="workspace-tag">LIBRARY</div>
      <button className="nav-item" onClick={() => setTab('Explore')}><BookOpen size={17}/><span>Atlas reference</span></button>
      <button className="nav-item" onClick={() => setTab('Explore')}><Layers size={17}/><span>Systems & regions</span></button>
      <div className="sidebar-bottom"><div className="profile-card"><div className="avatar">A</div><div className="profile-copy"><strong>ANATOMY STUDENT</strong><span>Personal workspace</span></div><Settings2 size={16}/></div><div className="version">BUILD 0.1.0 <span>PREVIEW</span></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={19}/></button><div className="breadcrumb">WORKSPACE <ChevronRight size={13}/> <strong>{tab.toUpperCase()}</strong></div></div><div className="topbar-right"><div className="system-status"><span/> SYSTEM OPERATIONAL</div><button className="top-icon" title="Help"><CircleHelp size={17}/></button><div className="top-avatar">A</div></div></header>

      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> PERFORMANCE LABORATORY</div><h1>{tab === 'Challenge' ? 'Identification challenge' : tab === 'Explore' ? 'Anatomical atlas' : tab === 'Progress' ? 'Performance overview' : 'Your workspace'}</h1><p>{tab === 'Challenge' ? 'Precision, recognition, speed. Train your anatomical knowledge.' : 'A focused environment for learning and measuring anatomical knowledge.'}</p></div><div className="session-chip"><span className="session-dot"/> SESSION READY <span className="chip-divider"/> <Command size={13}/> 01</div></div>

        <div className="workspace-grid">
          <div className="center-column">
            <div className="toolbar"><div className="toolbar-selects"><label><span>SYSTEM</span><div className="select-wrap"><Atom size={14}/><select aria-label="System filter" value={system} onChange={e => updateFilters(e.target.value, region)}>{systems.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={13}/></div></label><label><span>REGION</span><div className="select-wrap"><select aria-label="Region filter" value={region} onChange={e => updateFilters(system, e.target.value)}>{regions.map(r => <option key={r}>{r}</option>)}</select><ChevronDown size={13}/></div></label></div><button className="tool-button" onClick={() => setShowInfo(v => !v)}><Layers size={15}/><span>{showInfo ? 'HIDE' : 'SHOW'} DETAILS</span></button></div>
            <Viewport
              system={system}
              region={region}
              challenge={tab === 'Challenge'}
              selectedId={selectedId}
              onSelect={selectStructure}
              visibleStructureIds={visibleStructureIds}
              matchedStructureCount={filteredStructures.length}
              hiddenCount={hiddenCount}
              isolationId={isolationId}
              transparencyById={transparencyById}
            />
            <div className="below-viewport"><div className="stat-tile"><div className="stat-icon"><Target size={16}/></div><div><span>SESSION ACCURACY</span><strong>94.0<small>%</small></strong></div><div className="stat-trend">+2.4%</div></div><div className="stat-tile"><div className="stat-icon"><Trophy size={16}/></div><div><span>BEST STREAK</span><strong>37</strong></div><div className="stat-muted">PERSONAL</div></div><div className="stat-tile"><div className="stat-icon"><Clock3 size={16}/></div><div><span>AVERAGE TIME</span><strong>3.86<small>s</small></strong></div><div className="stat-muted">ALL-TIME</div></div></div>
          </div>

          {showInfo && <aside className="right-panel">
            {tab === 'Challenge' ? <>
              <div className="panel-header"><div><div className="panel-overline">CHALLENGE CONFIGURATION</div><h2>Training protocol</h2></div><button className="panel-more"><Settings2 size={16}/></button></div>
              <div className="panel-section"><div className="field-label">DIFFICULTY</div><div className="difficulty-options">{['Beginner','Intermediate','Advanced','Expert'].map(d => <button key={d} onClick={() => setDifficulty(d)} className={difficulty === d ? 'chosen' : ''}>{d}</button>)}</div></div>
              <div className="panel-section"><div className="field-label">CHALLENGE MODE</div><div className="mode-card active-mode"><div className="mode-icon"><Crosshair size={17}/></div><div><strong>Structure identification</strong><span>Locate the named structure</span></div><div className="radio-dot"/></div><div className="mode-card"><div className="mode-icon muted"><Sparkles size={17}/></div><div><strong>Reverse identification</strong><span>Name the highlighted structure</span></div></div></div>
              <div className="panel-section"><div className="field-label">SESSION PARAMETERS</div><div className="parameter-row"><span>Questions</span><strong>20 structures</strong></div><div className="parameter-row"><span>Time limit</span><strong>Untimed practice</strong></div><div className="parameter-row"><span>Feedback</span><strong>Immediate</strong></div></div>
              <div className="challenge-start"><button onClick={() => setAnswered(false)} className="start-button"><span>START CHALLENGE</span><ChevronRight size={17}/></button><div className="start-note"><ShieldCheck size={13}/> RESULTS SAVED TO PERSONAL RECORDS</div></div>
            </> : <>
              <div className="panel-header"><div><div className="panel-overline">STRUCTURE REFERENCE</div><h2>{selected?.name ?? 'Select a bone'}</h2></div><button className="panel-more"><Search size={16}/></button></div>
              {selected ? <>
                <div className="structure-tags"><span>{selected.system}</span><span>{selected.region}</span><span>{selected.laterality}</span></div>
                <div className="panel-section"><div className="field-label">ANATOMY IDENTIFIERS</div><p className="info-copy">Anatomy ID: {selected.id}<br/>{selected.externalIds?.map(identifier => <span key={`${identifier.system}:${identifier.identifier}`}>{identifier.system}: {identifier.identifier}<br/></span>)}{selected.meshAssociations.map(association => <span key={association.id}>{association.source} mesh: {association.sourceMeshId}<br/></span>)}</p></div>
                <div className="panel-section"><div className="field-label">OVERVIEW</div><p className="info-copy">{selected.description}</p></div>
                <div className="panel-section"><div className="field-label">LOCATION</div><p className="info-copy">{selected.location}</p></div>
                <div className="panel-section"><div className="field-label">FUNCTION</div><p className="info-copy">{selected.function}</p></div>
              </> : <div className="panel-section"><div className="field-label">NO STRUCTURE SELECTED</div><p className="info-copy">Select a bone in the 3D model or choose one from the index below.</p></div>}
              <div className="panel-section structure-control-section">
                <div className="field-label">STRUCTURE CONTROLS</div>
                {selected && <>
                <div className="structure-actions">
                  <button
                    className="tool-button"
                    aria-label={selectedTemporarilyHidden ? `${selected.name} hidden by isolation` : `${selectedDisplayed ? 'Hide' : 'Show'} ${selected.name}`}
                    disabled={selectedTemporarilyHidden}
                    onClick={() => setStructureVisibility(selected.id, !selectedDisplayed)}
                  >
                    {selectedDisplayed ? <EyeOff size={14}/> : <Eye size={14}/>}
                    {selectedDisplayed ? 'HIDE STRUCTURE' : 'SHOW STRUCTURE'}
                  </button>
                  <button className={`tool-button ${isolationId === selected.id ? 'control-active' : ''}`} aria-label={isolationId === selected.id ? 'Exit isolation' : `Isolate ${selected.name}`} onClick={() => setIsolationId(current => current === selected.id ? null : selected.id)}>
                    <Target size={14}/>{isolationId === selected.id ? 'EXIT ISOLATION' : 'ISOLATE'}
                  </button>
                </div>
                  <label className="transparency-control">
                    <span>TRANSPARENCY <strong>{transparencyById[selected.id] ?? 100}%</strong></span>
                    <input
                      aria-label={`Transparency for ${selected.name}`}
                      type="range"
                      min="15"
                      max="100"
                      step="5"
                      value={transparencyById[selected.id] ?? 100}
                      onChange={event => {
                        const value = Number(event.target.value)
                        setTransparencyById(current => ({ ...current, [selected.id]: value }))
                      }}
                    />
                  </label>
                  <p className="interaction-status" role="status">
                    {isolationId === selected.id ? 'This structure is isolated.' : selectedTemporarilyHidden ? 'This structure is hidden by isolation.' : hiddenIds.has(selected.id) ? 'This structure is hidden from the viewport.' : 'This structure is visible in the viewport.'}
                  </p>
                </>}
                <button className="show-all-button" onClick={showAllStructures} disabled={hiddenIds.size === 0 && isolationId === null}>SHOW ALL STRUCTURES</button>
              </div>
              <div className="panel-section structure-index-section">
                <div className="structure-index-heading"><div className="field-label">QUICK STRUCTURE INDEX <span>{filteredStructures.length}</span></div></div>
                {filteredStructures.length > 0 ? filteredStructures.map(structure => {
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
                      {displayed ? <Eye size={14}/> : <EyeOff size={14}/>}
                    </button>
                  </div>
                }) : <p className="filter-empty-message" role="status">No structures match the selected filters.</p>}
              </div>
            </>}
          </aside>}
        </div>
        <footer className="page-footer"><span>ANATOMY TRAINING SYSTEM <b>·</b> VISUAL PROTOTYPE</span><span>DESIGNED FOR PRECISION LEARNING <b>·</b> V0.1.0</span></footer>
      </div>
    </main>
  </div>
}