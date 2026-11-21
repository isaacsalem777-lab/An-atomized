import { useState } from 'react'
import { Activity, Atom, BookOpen, ChartNoAxesColumnIncreasing, ChevronDown, ChevronRight, CircleHelp, Clock3, Command, Compass, Crosshair, Gauge, Layers, Menu, Search, Settings2, ShieldCheck, Sparkles, Target, Trophy, X } from 'lucide-react'
import Viewport from './components/Viewport'
import { regions, structures, systems } from './data/anatomy'

type Tab = 'Dashboard' | 'Explore' | 'Challenge' | 'Progress'
const nav: { name: Tab; icon: typeof Activity }[] = [
  { name: 'Dashboard', icon: Gauge }, { name: 'Explore', icon: Compass }, { name: 'Challenge', icon: Target }, { name: 'Progress', icon: ChartNoAxesColumnIncreasing },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('Challenge')
  const [system, setSystem] = useState('Skeletal')
  const [region, setRegion] = useState('Cranium')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = structures.find(structure => structure.id === selectedId)
  const selectStructure = (id: string | null) => setSelectedId(current => current === id ? null : id)
  const [showInfo, setShowInfo] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [answered, setAnswered] = useState(false)

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
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={19}/></button><div className="breadcrumb">WORKSPACE <ChevronRight size={13}/> <strong>{tab.toUpperCase()}</strong></div></div><div className="topbar-right"><div className="system-status"><span/> SYSTEM OPERATIONAL</div><button className="top-icon" title="Help"><CircleHelp size={17}/></button><div className="top-avatar">A</div></div></header>

      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> PERFORMANCE LABORATORY</div><h1>{tab === 'Challenge' ? 'Identification challenge' : tab === 'Explore' ? 'Anatomical atlas' : tab === 'Progress' ? 'Performance overview' : 'Your workspace'}</h1><p>{tab === 'Challenge' ? 'Precision, recognition, speed. Train your anatomical knowledge.' : 'A focused environment for learning and measuring anatomical knowledge.'}</p></div><div className="session-chip"><span className="session-dot"/> SESSION READY <span className="chip-divider"/> <Command size={13}/> 01</div></div>

        <div className="workspace-grid">
          <div className="center-column">
            <div className="toolbar"><div className="toolbar-selects"><label><span>SYSTEM</span><div className="select-wrap"><Atom size={14}/><select value={system} onChange={e => setSystem(e.target.value)}>{systems.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={13}/></div></label><label><span>REGION</span><div className="select-wrap"><select value={region} onChange={e => setRegion(e.target.value)}>{regions.map(r => <option key={r}>{r}</option>)}</select><ChevronDown size={13}/></div></label></div><button className="tool-button" onClick={() => setShowInfo(v => !v)}><Layers size={15}/><span>{showInfo ? 'HIDE' : 'SHOW'} DETAILS</span></button></div>
            <Viewport system={system} region={region} challenge={tab === 'Challenge'} selectedId={selectedId} onSelect={selectStructure}/>
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
                <div className="structure-tags"><span>{selected.system}</span><span>{selected.region}</span></div>
                <div className="panel-section"><div className="field-label">ANATOMY IDENTIFIERS</div><p className="info-copy">FMA: {selected.fmaId}<br/>BodyParts3D mesh: {selected.meshId}</p></div>
                <div className="panel-section"><div className="field-label">OVERVIEW</div><p className="info-copy">{selected.detail}</p></div>
                <div className="panel-section"><div className="field-label">LOCATION</div><p className="info-copy">{selected.location}</p></div>
                <div className="panel-section"><div className="field-label">FUNCTION</div><p className="info-copy">{selected.function}</p></div>
              </> : <div className="panel-section"><div className="field-label">NO STRUCTURE SELECTED</div><p className="info-copy">Select a bone in the 3D model or choose one from the index below.</p></div>}
              <div className="panel-section"><div className="field-label">QUICK STRUCTURE INDEX</div>{structures.map(s => <button key={s.id} className={`structure-row ${selected?.id === s.id ? 'current' : ''}`} onClick={() => selectStructure(s.id)}><span>{s.name}</span><ChevronRight size={14}/></button>)}</div>
            </>}
          </aside>}
        </div>
        <footer className="page-footer"><span>ANATOMY TRAINING SYSTEM <b>·</b> VISUAL PROTOTYPE</span><span>DESIGNED FOR PRECISION LEARNING <b>·</b> V0.1.0</span></footer>
      </div>
    </main>
  </div>
}