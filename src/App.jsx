import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, AlertTriangle, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Bell,
  BookMarked, BookOpen, BriefcaseBusiness, CalendarClock, CalendarDays, Calculator, Check,
  CheckCircle2, ChevronDown, ChevronRight, Circle, CircleDashed, ClipboardCheck,
  Clock3, Copy, Download, ExternalLink, Feather, FileCheck2, FileDown, FilePlus2,
  FileSearch, FileText, FileUp, Filter, GraduationCap, Heart, HeartPulse, Info,
  Landmark, Laptop, Lightbulb, ListChecks, Menu, MessageCircle, Moon, MoreHorizontal,
  NotebookPen, PenLine, Plus, Quote, RefreshCw, Ruler, Search, Send, Settings2,
  ShieldCheck, Sparkles, Sun, Target, Trash2, UserRound, WandSparkles, X,
} from 'lucide-react';
import { SUBJECTS, createDemoProject, createProject, getSubject, getTemplate } from './data.js';
import { analyzeText, buildReview, countSectionUnits, countWords, formatCitation, formatLongDate, formatShortDate, getDeadlineMeta, getProgress } from './utils.js';

const STORAGE_KEY = 'sba-helper-ai-projects-v1';
const THEME_KEY = 'sba-helper-ai-theme-v1';

const subjectIcons = {
  english: Feather,
  'social-studies': Landmark,
  pob: BriefcaseBusiness,
  poa: Calculator,
  hsb: HeartPulse,
  it: Laptop,
  'technical-drawing': Ruler,
  other: BookOpen,
};

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboardIcon },
  { id: 'projects', label: 'My SBAs', icon: NotebookPen },
  { id: 'research', label: 'Research library', icon: BookMarked },
  { id: 'guide', label: 'Subject guide', icon: BookOpen },
];

function LayoutDashboardIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>
  </svg>;
}

function readInitialProjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn('Could not read the local SBA workspace.', error);
  }
  return [createDemoProject()];
}

function localDateInput(daysFromNow = 14) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function idFor(prefix = 'item') {
  return globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pageTitle(view, project) {
  if (view === 'workspace') return project ? 'SBA workspace' : 'My SBAs';
  return ({
    dashboard: 'Overview',
    projects: 'My SBAs',
    research: 'Research library',
    assistant: 'SBA coach',
    review: 'Final review',
    guide: 'Subject guide',
  })[view] || 'Overview';
}

function timeAgo(value) {
  if (!value) return 'Just now';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 2) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function buildCoachReply(message, project, activeSection) {
  const prompt = message.toLowerCase();
  const topic = project.topic || 'your SBA topic';
  const section = activeSection;
  const sectionTitle = section?.title || 'your next section';
  const ownInput = [project.voice?.opinion, project.voice?.experience, project.voice?.findings].filter(Boolean).join(' ');
  const savedPerspective = ownInput.trim().slice(0, 260);
  const relatedResearchNote = project.researchNotes?.find((note) => note.sectionId === section?.id)?.text?.trim().slice(0, 220);

  if (/interview/.test(prompt)) {
    return `Here are neutral interview starters for “${topic}”. Adapt them to the person you are speaking with, ask permission before quoting them, and keep the answers in your own notes:\n\n1. What have you noticed about this topic in your experience?\n2. What changes have you seen over time?\n3. What do you think contributes to this issue?\n4. Can you share an example that helps explain your view?\n5. Is there anything people often misunderstand about it?\n\nWhich person could answer these from direct experience?`;
  }
  if (/survey|questionnaire/.test(prompt)) {
    return `Let’s make a short, fair questionnaire about “${topic}”. You could adapt questions like these:\n\n• How often do you encounter this? (Choose a suitable time range.)\n• Which option best describes your experience?\n• What do you see as the main benefit?\n• What is one challenge you have noticed?\n• Is there anything else you would like to add?\n\nKeep responses anonymous if possible, avoid leading wording, and only ask questions your project needs.`;
  }
  if (/outline|structure|paragraph/.test(prompt)) {
    const savedContext = [
      savedPerspective ? `Your perspective notes: “${savedPerspective}”` : '',
      relatedResearchNote ? `A research note linked to this section: “${relatedResearchNote}”` : '',
    ].filter(Boolean).join('\n');
    return `Try this scaffold for ${sectionTitle.toLowerCase()} — fill each part with your own research and wording:

1. Point: What is the specific idea you want to explain?
2. Evidence: Which finding, source or example supports it?
3. Meaning: What does that evidence suggest about “${topic}”?
4. Your perspective: What do you think, and why?
5. Link: How does this answer your research question?

Start with bullet notes if a full paragraph feels like too much.${savedContext ? `\n\n${savedContext}\nChoose the detail that belongs here and explain it in your own words.` : ''}`;
  }
  if (/brainstorm|idea|topic/.test(prompt)) {
    return `Let’s brainstorm without deciding for you. For “${topic}”, explore a few angles: people’s everyday experiences, possible benefits, possible challenges, or how views differ by age or community.\n\nTo find your angle, tell me: What have you personally noticed? Which part makes you curious? What could you realistically research with the time and sources you have?`;
  }
  if (/word count|word limit|how many words/.test(prompt)) {
    const words = countSectionUnits(section, section?.content || '');
    const range = section?.range;
    return range
      ? `Your ${sectionTitle.toLowerCase()} currently has about ${words} ${section.countUnit || 'words'}. The starter guide for this section is ${range.min}–${range.max} ${section.countUnit || 'words'}. Your teacher’s instructions take priority. If you are short, add a finding or explain what it means rather than repeating the same point.`
      : `Your ${sectionTitle.toLowerCase()} currently has about ${words} ${section.countUnit || 'words'}. There is no fixed range in this template, so check your teacher’s brief. I can help you make a concise outline if you tell me what must be included.`;
  }
  if (/explain|what does|what is|how do i|how can i/.test(prompt)) {
    return `${sectionTitle} is the part where you ${section?.description?.toLowerCase() || 'show your thinking and evidence'}. In simple terms: make one clear point, connect it to your own research, then explain why it matters for “${topic}”.\n\nA useful first question is: “What did I actually find out?” What do you already know from your notes?`;
  }
  if (/reference|bibliograph|citation|source/.test(prompt)) {
    return `Good source notes include the author or organization, page or article title, website or publisher, publication date, URL and the date you accessed it. Save each source in Research Library and connect it to the SBA section it supports.\n\nI can format the details you provide, but please verify the citation style your teacher requires and check every entry against the original source.`;
  }
  if (/check|review|feedback|grammar|spelling/.test(prompt)) {
    const content = section?.content || '';
    const edits = analyzeText(content).filter((item) => item.kind === 'edit');
    const voice = analyzeText(content).filter((item) => item.kind === 'personalize');
    if (!content.trim()) return `I don’t see notes in ${sectionTitle.toLowerCase()} yet. Add your own ideas or research first, even as rough bullets, and I can help you check the structure. What is one finding you want to include?`;
    const rangeText = section?.range ? ` It has ${countWords(content)} ${section.countUnit || 'words'}; the suggested range is ${section.range.min}–${section.range.max}.` : '';
    return `I checked the current ${sectionTitle.toLowerCase()} notes.${rangeText}\n\n${edits.length ? `I spotted ${edits.length} possible spelling or spacing item${edits.length === 1 ? '' : 's'} in the quick check. Open Authentic Writing Mode to review each one; nothing changes unless you accept it.` : 'The quick spelling check did not find a common typo. Please still read it aloud and check names, facts and punctuation.'}\n\n${voice.length ? 'A broad phrase may need a detail from your own research. Add a specific example or finding so your point is clearly yours.' : ownInput ? 'You have personal notes saved — connect one to a source or finding where it fits.' : 'Try adding what you observed, what your research found and what you think it means.'}`;
  }
  if (/presentation|oral|speak/.test(prompt)) {
    return `For a clear oral presentation about “${topic}”, try a simple sequence: introduce why you chose it, share two findings with evidence, explain your own response, then close with what you learned. Practise with a timer and use brief cue cards rather than reading a full essay.\n\nWhat is the one finding you most want your audience to remember?`;
  }
  return `I’m here to help you think through ${sectionTitle.toLowerCase()} for “${topic}”. Let’s keep your own evidence and ideas at the centre.\n\nWhat have you found so far? You can share a rough note, one source, or an opinion. I’ll help you organize it, ask a follow-up question, and suggest a next step — not write a complete SBA for you.`;
}

function Modal({ children, onClose, className = '' }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
    <div className={`modal-card ${className}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>{children}</div>
  </div>;
}

function Toast({ message, kind, onClose }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3600);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);
  return <div className={`toast toast-${kind || 'success'}`} role="status">
    {kind === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
    <span>{message}</span>
    <button className="toast-close" onClick={onClose} aria-label="Dismiss"><X size={15} /></button>
  </div>;
}

function SubjectMark({ subjectId, size = 'normal' }) {
  const subject = getSubject(subjectId);
  const Icon = subjectIcons[subjectId] || BookOpen;
  return <span className={`subject-mark subject-${subject.color} subject-mark-${size}`}><Icon size={size === 'small' ? 15 : 18} strokeWidth={1.8} /></span>;
}

function SubjectPill({ subjectId }) {
  const subject = getSubject(subjectId);
  return <span className={`subject-pill subject-pill-${subject.color}`}><span className="subject-pill-dot" />{subject.name}</span>;
}

function Sidebar({ view, project, projectsCount, onNavigate, onContinue, open, onClose, saveState }) {
  const selected = view === 'workspace' ? 'projects' : view;
  return <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
    <div className="brand-row">
      <div className="brand-symbol"><BookOpen size={20} strokeWidth={2} /></div>
      <div className="brand-wordmark"><strong>SBA Helper</strong><span>CXC study workspace</span></div>
      <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
    </div>
    <div className="workspace-label"><span className="workspace-dot" /> STUDENT WORKSPACE</div>
    <nav className="sidebar-nav" aria-label="Main navigation">
      {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${selected === id ? 'nav-link-active' : ''}`} onClick={() => { onNavigate(id); onClose(); }}>
        <Icon size={18} strokeWidth={1.85} /><span>{label}</span>{id === 'projects' && projectsCount > 0 && <span className="nav-count">{projectsCount}</span>}
      </button>)}
    </nav>
    <div className="sidebar-divider" />
    <div className="sidebar-section-label">YOUR STUDY TOOLS</div>
    <nav className="sidebar-nav">
      <button className={`nav-link ${view === 'assistant' ? 'nav-link-active' : ''}`} onClick={() => { onNavigate('assistant'); onClose(); }}><MessageCircle size={18} strokeWidth={1.85} /><span>SBA Coach</span></button>
      <button className={`nav-link ${view === 'review' ? 'nav-link-active' : ''}`} onClick={() => { onNavigate('review'); onClose(); }}><ClipboardCheck size={18} strokeWidth={1.85} /><span>Final review</span></button>
    </nav>
    <div className="sidebar-spacer" />
    {project && <div className="sidebar-project-card">
      <div className="sidebar-project-overline">PICK UP WHERE YOU LEFT OFF</div>
      <div className="sidebar-project-title">{project.topic || 'Untitled SBA'}</div>
      <div className="sidebar-mini-progress"><span style={{ width: `${getProgress(project).percent}%` }} /></div>
      <div className="sidebar-project-foot"><span>{getProgress(project).percent}% complete</span><button onClick={() => { onContinue(project); onClose(); }} aria-label="Continue current SBA"><ArrowUpRight size={15} /></button></div>
    </div>}
    <div className="sidebar-user">
      <div className="avatar avatar-sidebar"><ShieldCheck size={17} /></div>
      <div className="sidebar-user-copy"><strong>Local workspace</strong><span>Saved on this device</span></div>
      <span className={`save-dot ${saveState === 'saving' ? 'save-dot-saving' : ''}`} title={saveState === 'saving' ? 'Saving…' : 'Saved on this device'} />
    </div>
  </aside>;
}

function Topbar({ view, project, theme, onTheme, onMenu, projects, onOpenProject, saveState }) {
  const [searchText, setSearchText] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(false);
  const searchRef = useRef(null);
  const resultList = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return [];
    return projects.filter((item) => `${item.topic} ${getSubject(item.subjectId).name} ${item.level}`.toLowerCase().includes(q)).slice(0, 5);
  }, [projects, searchText]);
  const notices = useMemo(() => projects.map((item) => {
    const progress = getProgress(item);
    const next = item.sections.find((section) => !section.completed);
    const deadline = getDeadlineMeta(item.deadline);
    return { project: item, next, deadline, progress };
  }).sort((a, b) => (a.deadline.days ?? 999) - (b.deadline.days ?? 999)).slice(0, 4), [projects]);

  return <header className="topbar">
    <button className="icon-button menu-trigger" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
    <div className="topbar-page"><span className="topbar-eyebrow">SBA HELPER <span>/</span></span><strong>{pageTitle(view, project)}</strong></div>
    <div className="topbar-right">
      <div className="search-wrap">
        <Search size={17} className="search-icon" />
        <input ref={searchRef} className="global-search" value={searchText} onChange={(event) => setSearchText(event.target.value)} onFocus={() => {}} placeholder="Search SBAs…" aria-label="Search SBAs" />
        {searchText && <button className="search-clear" onClick={() => { setSearchText(''); searchRef.current?.focus(); }} aria-label="Clear search"><X size={14} /></button>}
        {searchText.trim() && <div className="search-dropdown">
          <div className="dropdown-overline">YOUR PROJECTS</div>
          {resultList.length ? resultList.map((item) => <button className="search-result" key={item.id} onClick={() => { onOpenProject(item); setSearchText(''); }}>
            <SubjectMark subjectId={item.subjectId} size="small" /><span><strong>{item.topic || 'Untitled SBA'}</strong><small>{getSubject(item.subjectId).name} · {getProgress(item).percent}% complete</small></span><ArrowRight size={15} />
          </button>) : <div className="search-empty">No SBAs match “{searchText}”</div>}
          <div className="search-hint"><Search size={12} /> Search by topic, subject or class</div>
        </div>}
      </div>
      <span className={`topbar-save ${saveState === 'saving' ? 'is-saving' : ''} ${saveState === 'error' ? 'is-error' : ''}`} title={saveState === 'error' ? 'Browser storage is unavailable or full' : 'Autosaved to this device'}><span />{saveState === 'saving' ? 'Saving' : saveState === 'error' ? 'Save issue' : 'Saved'}</span>
      <div className="popover-anchor">
        <button className={`icon-button topbar-icon ${noticeOpen ? 'icon-button-selected' : ''}`} onClick={() => setNoticeOpen(!noticeOpen)} aria-label="Notifications"><Bell size={18} /><i className="notification-dot" /></button>
        {noticeOpen && <>
          <button className="popover-dismiss" aria-label="Close notifications" onClick={() => setNoticeOpen(false)} />
          <div className="notification-popover">
            <div className="popover-head"><div><strong>Your reminders</strong><span>A little progress goes a long way.</span></div><button onClick={() => setNoticeOpen(false)} aria-label="Close"><X size={16} /></button></div>
            {notices.length ? notices.map(({ project: item, next, deadline }) => <button className="notification-item" key={item.id} onClick={() => { onOpenProject(item); setNoticeOpen(false); }}>
              <span className={`notification-item-icon tone-${deadline.tone}`}><CalendarClock size={16} /></span>
              <span><strong>{deadline.label}</strong><small>{next ? `Next: ${next.title}` : 'All sections checked — do a final review'}</small></span><ChevronRight size={15} />
            </button>) : <p className="empty-note">Create an SBA to see your reminders.</p>}
            <div className="popover-foot"><Clock3 size={13} /> Deadlines are based on your saved project dates.</div>
          </div>
        </>}
      </div>
      <button className="icon-button topbar-icon theme-switch" onClick={onTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>

    </div>
  </header>;
}

function MobileNav({ view, onNavigate }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboardIcon },
    { id: 'projects', label: 'My SBAs', icon: NotebookPen },
    { id: 'research', label: 'Research', icon: BookMarked },
    { id: 'assistant', label: 'Coach', icon: MessageCircle }
  ];
  const selected = view === 'workspace' ? 'projects' : view;
  return <nav className="mobile-nav" aria-label="Mobile navigation">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={selected === id ? 'mobile-nav-active' : ''} onClick={() => onNavigate(id)}><Icon size={19} /><span>{label}</span></button>)}</nav>;
}

function ProjectProgress({ project, compact = false }) {
  const progress = getProgress(project);
  return <div className={`project-progress ${compact ? 'project-progress-compact' : ''}`}>
    <div className="project-progress-label"><span>{progress.complete} of {progress.total} sections done</span><strong>{progress.percent}%</strong></div>
    <div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div>
  </div>;
}

function Dashboard({ projects, onNew, onContinue, onNavigate, onAsk }) {
  const active = [...projects].sort((a, b) => new Date(a.deadline || '9999-01-01') - new Date(b.deadline || '9999-01-01'));
  const totalDone = projects.reduce((total, project) => total + getProgress(project).complete, 0);
  const totalSections = projects.reduce((total, project) => total + project.sections.length, 0);
  const overallProgress = totalSections ? Math.round((totalDone / totalSections) * 100) : 0;
  const dueSoon = active.filter((project) => { const meta = getDeadlineMeta(project.deadline); return meta.days !== null && meta.days >= 0 && meta.days <= 14; }).length;
  const topTasks = active.map((project) => ({ project, section: project.sections.find((item) => !item.completed) })).filter((item) => item.section).slice(0, 3);
  const nextTask = topTasks[0];
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return <div className="dashboard-page page-enter">
    <div className="page-intro dashboard-intro">
      <div><div className="eyebrow dashboard-date"><CalendarDays size={14} /> {dateLabel}</div><h1>{greeting}.</h1><p>Your CXC SBA work, deadlines and next steps — all in one place.</p></div>
      <button className="button button-primary button-new" onClick={() => onNew()}><Plus size={17} /> New SBA</button>
    </div>

    <section className="welcome-banner">
      <div className="welcome-copy">
        <div className="banner-eyebrow"><span className="banner-eyebrow-icon">{nextTask ? <ArrowUpRight size={15} /> : active.length ? <CheckCircle2 size={15} /> : <Plus size={15} />}</span>{nextTask ? 'YOUR NEXT STEP' : active.length ? 'UP TO DATE' : 'START HERE'}</div>
        <h2>{nextTask ? nextTask.section.title : active.length ? 'Your checklists are complete.' : 'Start with one CXC SBA.'}</h2>
        <p>{nextTask ? <><strong>{nextTask.project.topic || 'Untitled SBA'}</strong><span className="hero-separator"> · </span>{getSubject(nextTask.project.subjectId).name}. Pick up where you left off.</> : active.length ? 'Give your work a final review before exporting it.' : 'Choose a subject and topic to build a clear, section-by-section checklist.'}</p>
        <button className="banner-button" onClick={() => nextTask ? onContinue(nextTask.project, nextTask.section.id) : active.length ? onContinue(active[0]) : onNew()}>
          {nextTask ? 'Continue this section' : active.length ? 'Review a project' : 'Create your first SBA'} <ArrowRight size={16} />
        </button>
      </div>
      <div className="welcome-overview">
        <span className="overview-label">OVERALL CHECKLIST PROGRESS</span>
        <div className="overview-total"><strong>{totalDone}</strong><span> / {totalSections} sections</span></div>
        <div className="overview-meter"><span style={{ width: `${overallProgress}%` }} /></div>
        <div className="overview-foot"><span>{projects.length} active project{projects.length === 1 ? '' : 's'}</span><strong>{overallProgress}%</strong></div>
      </div>
    </section>

    <div className="stats-grid">
      <div className="stat-card"><div className="stat-icon stat-icon-sage"><NotebookPen size={19} /></div><div className="stat-copy"><span>Active SBAs</span><strong>{projects.length}<small> project{projects.length === 1 ? '' : 's'}</small></strong></div><span className="stat-trend">Your current work</span></div>
      <div className="stat-card"><div className="stat-icon stat-icon-lilac"><CheckCircle2 size={19} /></div><div className="stat-copy"><span>Sections completed</span><strong>{totalDone}<small> / {totalSections || 0}</small></strong></div><span className="stat-trend">Across your SBAs</span></div>
      <div className="stat-card"><div className="stat-icon stat-icon-peach"><CalendarDays size={19} /></div><div className="stat-copy"><span>Deadlines coming up</span><strong>{dueSoon}<small> in 14 days</small></strong></div><span className="stat-trend">Plan your next step</span></div>
    </div>

    <div className="dashboard-grid">
      <section className="panel active-panel">
        <div className="panel-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h2>Active SBAs <span className="heading-count">{projects.length}</span></h2></div><button className="text-button" onClick={() => onNavigate('projects')}>All projects <ArrowRight size={15} /></button></div>
        {active.length ? <div className="active-project-list">{active.slice(0, 3).map((project) => {
          const subject = getSubject(project.subjectId);
          const progress = getProgress(project);
          const next = project.sections.find((item) => !item.completed);
          const deadline = getDeadlineMeta(project.deadline);
          return <article className="active-project-card" key={project.id}>
            <div className={`project-accent accent-${subject.color}`} />
            <div className="active-project-main">
              <div className="active-project-top"><span className="active-project-tags"><SubjectPill subjectId={project.subjectId} />{project.demo && <span className="sample-tag">SAMPLE</span>}</span><span className={`deadline-tag deadline-${deadline.tone}`}><CalendarDays size={13} />{deadline.label}</span></div>
              <h3>{project.topic || 'Untitled SBA'}</h3>
              <div className="active-project-level"><GraduationCap size={14} /> {project.level || 'Class not set'} <span>·</span> {progress.complete} done <span>·</span> {progress.remaining} to go</div>
              <ProjectProgress project={project} compact />
              <div className="project-next-step"><span className="next-step-dot" />{next ? <>Next up: <strong>{next.title}</strong></> : <><strong>Ready for final review</strong></>}</div>
            </div>
            <button className="button button-soft active-continue" onClick={() => onContinue(project)}>{next ? 'Continue' : 'Review'} <ArrowRight size={15} /></button>
          </article>;
        })}</div> : <div className="empty-state empty-state-compact"><div className="empty-state-icon"><NotebookPen size={22} /></div><h3>Your first SBA starts here</h3><p>Choose a subject and we’ll build a checklist around it.</p><button className="button button-primary" onClick={() => onNew()}><Plus size={16} /> Create an SBA</button></div>}
      </section>

      <aside className="dashboard-side-column">
        <section className="coach-card">
          <div className="coach-card-orb"><MessageCircle size={19} /></div>
          <div className="coach-card-eyebrow">SBA COACH</div>
          <h2>Need a hand?</h2><p>Get a plain-language explanation or a question to help shape your own research.</p>
          <div className="coach-quick-prompts"><button onClick={() => onAsk('Explain the next section in simple words.')}>Explain a section <ArrowUpRight size={13} /></button><button onClick={() => onAsk('Help me brainstorm a research question.')}>Shape a question <ArrowUpRight size={13} /></button></div>
          <button className="coach-main-link" onClick={() => onAsk('Help me decide what to work on next.')}>Open SBA Coach <ArrowRight size={15} /></button>
        </section>
        <section className="panel next-up-panel">
          <div className="panel-heading panel-heading-small"><div><div className="eyebrow">IN THE QUEUE</div><h2>Next sections</h2></div><span className="up-next-icon"><ListChecks size={16} /></span></div>
          {topTasks.length ? <div className="up-next-list">{topTasks.map(({ project, section }) => <button className="up-next-item" key={`${project.id}-${section.id}`} onClick={() => onContinue(project, section.id)}><span className="up-next-check"><Circle size={15} /></span><span><strong>{section.title}</strong><small>{getSubject(project.subjectId).name}</small></span><ChevronRight size={15} /></button>)}</div> : <div className="all-done-note"><CheckCircle2 size={17} /> All checklists are complete. Give them a final review.</div>}
        </section>
      </aside>
    </div>

    <section className="recent-panel panel">
      <div className="panel-heading"><div><div className="eyebrow">RECENTLY UPDATED</div><h2>Pick up where you left off</h2></div><button className="text-button" onClick={() => onNavigate('projects')}>All projects <ArrowRight size={15} /></button></div>
      {projects.length ? <div className="recent-list">{[...projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3).map((project) => <button className="recent-item" key={project.id} onClick={() => onContinue(project)}><SubjectMark subjectId={project.subjectId} /><span className="recent-title"><strong>{project.topic || 'Untitled SBA'}</strong><small>{getSubject(project.subjectId).name} · {timeAgo(project.updatedAt)}</small></span><span className="recent-progress">{getProgress(project).percent}%</span><ArrowRight size={15} /></button>)}</div> : <p className="empty-inline">Your recent SBAs will show up here.</p>}
    </section>
    <p className="dashboard-footnote"><ShieldCheck size={14} /> Drafts are saved on this device. Confirm your school’s exact instructions before submitting.</p>
  </div>;
}

function ProjectCard({ project, onContinue, onDelete }) {
  const subject = getSubject(project.subjectId);
  const progress = getProgress(project);
  const next = project.sections.find((item) => !item.completed);
  const deadline = getDeadlineMeta(project.deadline);
  return <article className="project-card">
    <div className={`project-card-banner banner-${subject.color}`}><SubjectMark subjectId={project.subjectId} /><span className="project-card-subject">{subject.name}</span>{project.demo && <span className="sample-tag">SAMPLE</span>}<span className={`deadline-tag deadline-${deadline.tone}`}><CalendarDays size={13} />{deadline.label}</span></div>
    <div className="project-card-body"><div className="project-card-topline"><span>{project.level || 'Class not set'}</span><button className="icon-button mini-icon-button" onClick={() => onDelete(project)} aria-label={`Delete ${project.topic}`} title="Delete SBA"><Trash2 size={15} /></button></div>
      <h3>{project.topic || 'Untitled SBA'}</h3><p className="project-card-summary">{subject.description}</p>
      <ProjectProgress project={project} />
      <div className="project-card-meta"><span><CheckCircle2 size={14} /> {progress.complete} completed</span><span><ListChecks size={14} /> {progress.remaining} remaining</span></div>
      <div className="project-card-footer"><span className="next-label">{next ? <>Next: <strong>{next.title}</strong></> : <strong>Checklist complete</strong>}</span><button className="button button-soft" onClick={() => onContinue(project, next?.id)}>{next ? 'Continue' : 'Review'} <ArrowRight size={14} /></button></div>
    </div>
  </article>;
}

function ProjectsView({ projects, onNew, onContinue, onDelete }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? projects : projects.filter((project) => project.subjectId === filter);
  const counts = projects.reduce((acc, project) => ({ ...acc, [project.subjectId]: (acc[project.subjectId] || 0) + 1 }), {});
  return <div className="page-enter content-page projects-page">
    <div className="page-intro"><div><div className="eyebrow">YOUR PERSONAL SBA SPACE</div><h1>My SBAs</h1><p>Every project, one clear next step at a time.</p></div><button className="button button-primary" onClick={() => onNew()}><Plus size={17} /> New SBA</button></div>
    <div className="filter-bar"><div className="filter-intro"><Filter size={15} /> Filter by subject</div><div className="filter-chips"><button className={`filter-chip ${filter === 'all' ? 'filter-chip-active' : ''}`} onClick={() => setFilter('all')}>All <span>{projects.length}</span></button>{SUBJECTS.filter((subject) => counts[subject.id]).map((subject) => <button className={`filter-chip ${filter === subject.id ? 'filter-chip-active' : ''}`} key={subject.id} onClick={() => setFilter(subject.id)}>{subject.name} <span>{counts[subject.id]}</span></button>)}</div></div>
    {filtered.length ? <div className="projects-grid">{filtered.map((project) => <ProjectCard key={project.id} project={project} onContinue={onContinue} onDelete={onDelete} />)}</div> : <div className="empty-state projects-empty"><div className="empty-state-icon"><FilePlus2 size={23} /></div><h3>No SBAs here yet</h3><p>Start with your subject and topic. Your checklist will be ready in seconds.</p><button className="button button-primary" onClick={() => onNew(filter !== 'all' ? ter : undefined)}><Plus size={16} /> Create your first SBA</button></div>}
  </div>;
}

function CreateProjectModal({ initialSubject, onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [subjectId, setSubjectId] = useState(initialSubject || 'english');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('');
  const [deadline, setDeadline] = useState(localDateInput(21));
  const [selectedSections, setSelectedSections] = useState(() => getTemplate(initialSubject || 'english').sections.map((item) => item.id));
  const [error, setError] = useState('');
  const templateSections = getTemplate(subjectId).sections;
  const selectedCount = selectedSections.filter((id) => id !== 'final-review').length;
  const changeSubject = (id) => {
    setSubjectId(id);
    setSelectedSections(getTemplate(id).sections.map((item) => item.id));
  };
  const toggleSection = (id) => {
    if (id === 'final-review') return;
    setSelectedSections((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const goNext = () => {
    if (!topic.trim()) { setError('Add a topic so your checklist has a clear focus.'); return; }
    if (!level.trim()) { setError('Add your school or class level.'); return; }
    setError(''); setStep(2);
  };
  const submit = () => {
    if (!deadline) { setError('Choose a deadline, even if it is an estimate.'); return; }
    if (!selectedCount) { setError('Keep at least one SBA section in your checklist.'); return; }
    onCreate(createProject({ subjectId, topic, level, deadline, selectedSections }));
  };
  const selectedSubject = getSubject(subjectId);

  return <Modal onClose={onClose} className="create-modal">
    <div className="modal-heading-row"><div className="modal-heading-icon"><NotebookPen size={20} /></div><div><div className="eyebrow">LET’S GET ORGANISED</div><h2>{step === 1 ? 'Create your SBA' : 'Build your checklist'}</h2></div><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
    <div className="stepper"><span className={step === 1 ? 'step-active' : 'step-done'}><i>{step > 1 ? <Check size={12} /> : '1'}</i> Project details</span><span className="step-line" /><span className={step === 2 ? 'step-active' : ''}><i>2</i> Requirements</span></div>
    {step === 1 ? <div className="create-step-content">
      <div className="field-label-row"><label>Which subject is this SBA for?</label><span className="field-hint">You can add more subjects later</span></div>
      <div className="subject-choice-grid">{SUBJECTS.map((subject) => {
        const Icon = subjectIcons[subject.id] || BookOpen;
        return <button key={subject.id} className={`subject-choice ${subjectId === subject.id ? 'subject-choice-active' : ''}`} onClick={() => changeSubject(subject.id)} type="button"><span className={`subject-choice-icon subject-${subject.color}`}><Icon size={17} /></span><span><strong>{subject.name}</strong><small>{subject.description}</small></span>{subjectId === subject.id && <CheckCircle2 size={17} className="subject-selected-check" />}</button>;
      })}</div>
      <div className="form-grid-two"><div className="form-field form-field-wide"><label htmlFor="sba-topic">What’s your SBA topic?</label><input id="sba-topic" autoFocus value={topic} onChange={(event) => { setTopic(event.target.value); setError(''); }} placeholder="e.g. How social media affects teen communication" maxLength={140} /><small>Use your own words. You can refine the focus later.</small></div>
        <div className="form-field"><label htmlFor="sba-level">School / class level</label><input id="sba-level" value={level} onChange={(event) => { setLevel(event.target.value); setError(''); }} placeholder="e.g. Form 4" /></div>
        <div className="form-field"><label htmlFor="sba-deadline">Target deadline</label><div className="input-with-icon"><CalendarDays size={16} /><input id="sba-deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></div></div>
      </div>
      {error && <div className="form-error"><AlertCircle size={15} />{error}</div>}
      <div className="modal-footer"><span className="modal-security"><ShieldCheck size={14} /> Saved privately on this device</span><button className="button button-primary" onClick={goNext}>Choose requirements <ArrowRight size={15} /></button></div>
    </div> : <div className="create-step-content step-two-content">
      <div className="checklist-intro"><span className={`checklist-subject-icon subject-${selectedSubject.color}`}><BookOpen size={18} /></span><div><strong>{selectedSubject.name} checklist</strong><p>We’ve added a starting template. Adjust it to match your teacher’s instructions.</p></div></div>
      <div className="requirements-list-heading"><span>INCLUDED SECTIONS</span><span>{selectedCount} selected</span></div>
      <div className="requirements-list">{templateSections.map((item, index) => {
        const checked = selectedSections.includes(item.id) || item.id === 'final-review';
        return <button type="button" key={item.id} className={`requirement-row ${checked ? 'requirement-row-checked' : ''} ${item.id === 'final-review' ? 'requirement-pinned' : ''}`} onClick={() => toggleSection(item.id)}>
          <span className={`requirement-checkbox ${checked ? 'requirement-checkbox-on' : ''}`}>{checked && <Check size={13} />}</span>
          <span className="requirement-index">{String(index + 1).padStart(2, '0')}</span>
          <span className="requirement-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
          {item.id === 'final-review' && <span className="required-tag">Always included</span>}
        </button>;
      })}</div>
      <div className="form-field deadline-field"><label htmlFor="sba-deadline-step2">SBA deadline</label><div className="input-with-icon"><CalendarDays size={16} /><input id="sba-deadline-step2" type="date" value={deadline} onChange={(event) => { setDeadline(event.target.value); setError(''); }} /></div><small>It’s okay to set an estimate and change it later.</small></div>
      {error && <div className="form-error"><AlertCircle size={15} />{error}</div>}
      <div className="modal-footer"><button className="button button-ghost" onClick={() => { setStep(1); setError(''); }}><ArrowLeft size={15} /> Back</button><span className="modal-security"><ShieldCheck size={14} /> Your checklist is editable</span><button className="button button-primary" onClick={submit}>Create my checklist <Sparkles size={15} /></button></div>
    </div>}
  </Modal>;
}

function SectionWordCounter({ section, value }) {
  const count = countSectionUnits(section, value);
  const unit = section.countUnit || 'words';
  const range = section.range;
  const status = !range ? 'teacher' : count < range.min ? 'below' : count > range.max ? 'above' : 'within';
  const fill = range ? Math.min(100, Math.round((count / Math.max(range.max, 1)) * 100)) : Math.min(100, Math.round((count / 300) * 100));
  const marker = range ? Math.min(100, Math.round((range.min / Math.max(range.max, 1)) * 100)) : 0;
  const label = !range ? 'Teacher-defined' : status === 'below' ? 'Below suggested range' : status === 'above' ? 'Above suggested range' : 'Within suggested range';
  return <div className={`word-counter word-${status}`}>
    <div className="word-counter-top"><span><FileText size={14} /> {count} {unit}</span><strong>{range ? `${range.min}–${range.max} ${unit}` : label}</strong></div>
    <div className="word-meter"><span className="word-meter-fill" style={{ width: `${fill}%` }} /><i style={{ left: `${marker}%` }} /></div>
    <div className="word-counter-bottom"><span className="word-status"><span />{label}</span><span>{range ? 'Suggested guide · your teacher’s brief takes priority' : 'Confirm any required length with your teacher'}</span></div>
  </div>;
}

function SectionEditor({ project, section, index, onUpdateSection, onOpenAuth, onOpenCoach, onOpenResearch, saveState, onComplete }) {
  const [content, setContent] = useState(section?.content || '');
  const textareaRef = useRef(null);
  useEffect(() => setContent(section?.content || ''), [section?.id, section?.content]);
  if (!section) return <div className="editor-empty"><div className="empty-state-icon"><ListChecks size={22} /></div><h3>Choose a section</h3><p>Pick an item from your checklist to begin.</p></div>;
  const saveContent = (value) => {
    setContent(value);
    onUpdateSection(section.id, { content: value });
  };
  const appendBullet = () => {
    const next = `${content}${content && !content.endsWith('\n') ? '\n' : ''}• `;
    saveContent(next);
    window.setTimeout(() => { if (textareaRef.current) { textareaRef.current.focus(); textareaRef.current.setSelectionRange(next.length, next.length); } }, 0);
  };
  return <div className="section-editor-card">
    <div className="section-title-block"><div className="section-kicker-row"><span className="section-index-bubble">{String(index + 1).padStart(2, '0')}</span><span className="section-group-label">{section.group}</span>{section.completed && <span className="complete-badge"><CheckCircle2 size={13} /> Checked off</span>}</div><h2>{section.title}</h2><p>{section.description}</p></div>
    <div className="section-explainer"><div className="explainer-icon"><Lightbulb size={17} /></div><div><strong>Before you write</strong><p>Start with your own notes, evidence or questions. A rough first draft is a good start — you can organize it later.</p></div></div>
    <div className="prompt-block"><div className="prompt-block-heading"><span>THINK ABOUT</span><span className="prompt-helper">Use these as prompts, not answers</span></div><div className="prompt-grid">{(section.prompts || []).map((prompt, idx) => <div className="prompt-item" key={prompt}><span>{String(idx + 1).padStart(2, '0')}</span><p>{prompt}</p></div>)}</div></div>
    <div className="writing-area-label"><label htmlFor={`section-draft-${section.id}`}>Your working notes</label><span><span className={`autosave-dot ${saveState === 'saving' ? 'autosave-dot-active' : ''}`} />{saveState === 'saving' ? 'Saving…' : 'Autosaved'}</span></div>
    <div className="editor-toolbar"><span className="editor-toolbar-note"><PenLine size={14} /> Write in your own words</span><button className="editor-toolbar-action" onClick={appendBullet}><Plus size={14} /> Add a bullet</button></div>
    <textarea ref={textareaRef} id={`section-draft-${section.id}`} className="draft-textarea" value={content} onChange={(event) => saveContent(event.target.value)} placeholder={`Start with your own notes for ${section.title.toLowerCase()}…\n\nIt’s okay to use bullet points or rough ideas first.`} />
    <SectionWordCounter section={section} value={content} />
    <div className="editor-footer"><div className="editor-integrity-note"><Heart size={14} /> Your ideas. Your research. Your words.</div><div className="editor-actions"><button className="button button-outline" onClick={onOpenAuth}><WandSparkles size={16} /> Authentic mode</button><button className={`button ${section.completed ? 'button-completed' : 'button-primary'}`} onClick={() => onComplete(section)}>{section.completed ? <><Check size={16} /> Completed</> : <>Mark complete <ArrowRight size={15} /></>}</button></div></div>
  </div>;
}

function WorkspaceView({ project, sectionId, onSelectSection, onUpdateSection, onOpenAuth, onOpenCoach, onOpenResearch, onReview, saveState, onComplete }) {
  const progress = getProgress(project);
  const selectedId = project.sections.some((item) => item.id === sectionId) ? sectionId : project.sections.find((item) => !item.completed)?.id || project.sections[0]?.id;
  const section = project.sections.find((item) => item.id === selectedId);
  const index = project.sections.findIndex((item) => item.id === selectedId);
  const groups = [...new Set(project.sections.map((item) => item.group || 'SBA sections'))];
  return <div className="workspace-page page-enter">
    <div className="workspace-topline"><button className="back-link" onClick={() => onSelectSection(null, 'projects')}><ArrowLeft size={15} /> My SBAs</button><div className="workspace-top-actions"><span className="workspace-autosave"><span className={`autosave-dot ${saveState === 'saving' ? 'autosave-dot-active' : ''}`} />{saveState === 'saving' ? 'Saving changes' : 'All changes saved'}</span><button className="button button-soft button-sm" onClick={onReview}><ClipboardCheck size={15} /> Final review</button></div></div>
    <div className="workspace-heading"><div><div className="workspace-subject-line"><SubjectMark subjectId={project.subjectId} size="small" /><span>{getSubject(project.subjectId).name}</span><span className="dot-separator">·</span><span>{project.level}</span><span className="dot-separator">·</span><span className={`workspace-deadline workspace-deadline-${getDeadlineMeta(project.deadline).tone}`}><CalendarDays size={13} />{getDeadlineMeta(project.deadline).label}</span></div><h1>{project.topic || 'Untitled SBA'}</h1><p>One section at a time. Your checklist keeps the big picture in view.</p></div><button className="button button-outline workspace-research-button" onClick={onOpenResearch}><BookMarked size={16} /> Research library <span className="research-count">{project.sources?.length || 0}</span></button></div>
    <div className="workspace-progress-bar"><div className="workspace-progress-label"><span><strong>{progress.percent}%</strong> complete</span><span>{progress.complete} of {progress.total} sections checked off</span></div><div className="progress-track progress-track-large"><span style={{ width: `${progress.percent}%` }} /></div></div>
    <div className="workspace-layout">
      <aside className="checklist-panel panel">
        <div className="checklist-panel-heading"><div><div className="eyebrow">PROJECT CHECKLIST</div><h2>Your sections</h2></div><span className="checklist-count">{progress.complete}/{progress.total}</span></div>
        <div className="checklist-section-list">{groups.map((group) => <div className="checklist-group" key={group}><div className="checklist-group-name">{group}</div>{project.sections.filter((item) => item.group === group).map((item) => {
          const isCurrent = item.id === selectedId;
          return <button key={item.id} className={`checklist-section-link ${isCurrent ? 'checklist-section-active' : ''} ${item.completed ? 'checklist-section-done' : ''}`} onClick={() => onSelectSection(item.id)}><span className="checklist-status-icon">{item.completed ? <CheckCircle2 size={17} /> : item.content?.trim() ? <CircleDashed size={17} /> : <Circle size={17} />}</span><span className="checklist-section-name">{item.title}</span>{isCurrent && <ChevronRight size={14} className="checklist-current-chevron" />}</button>;
        })}</div>)}</div>
        <div className="checklist-panel-foot"><Info size={14} /><span>Templates are a starting point. Your teacher’s brief comes first.</span></div>
      </aside>
      <main className="workspace-main-column"><SectionEditor key={`${project.id}-${section?.id || 'none'}`} project={project} section={section} index={index} onUpdateSection={onUpdateSection} onOpenAuth={onOpenAuth} onOpenCoach={() => onOpenCoach(`Explain ${section?.title || 'my next section'} in simple words.`)} onOpenResearch={onOpenResearch} saveState={saveState} onComplete={onComplete} />
        {section && <div className="section-navigation"><button className="button button-ghost" disabled={index <= 0} onClick={() => onSelectSection(project.sections[index - 1]?.id)}><ArrowLeft size={15} /> Previous section</button><span>Section {index + 1} of {project.sections.length}</span><button className="button button-ghost" disabled={index >= project.sections.length - 1} onClick={() => onSelectSection(project.sections[index + 1]?.id)}>Next section <ArrowRight size={15} /></button></div>}
      </main>
      <aside className="workspace-helper-column">
        <section className="helper-card helper-coach-card"><div className="helper-card-top"><span className="helper-icon helper-icon-lilac"><Sparkles size={17} /></span><span className="helper-label">YOUR SBA COACH</span></div><h3>Need a little guidance?</h3><p>Get an explanation, an outline or a question that helps you move forward.</p><button className="button button-coach" onClick={() => onOpenCoach(`Help me with ${section?.title || 'my SBA'}.`)}>Ask about this section <ArrowRight size={15} /></button><div className="helper-trust"><ShieldCheck size={13} /> The coach guides — you decide.</div></section>
        <section className="helper-card helper-sources-card"><div className="helper-card-top"><span className="helper-icon helper-icon-sage"><BookMarked size={17} /></span><span className="helper-label">YOUR RESEARCH</span></div><h3>{project.sources?.length || 0} saved sources</h3><p>Keep notes and citations connected to the section they support.</p><button className="helper-text-link" onClick={onOpenResearch}>Open Research Library <ArrowUpRight size={14} /></button></section>
        <section className="helper-reminder"><div className="reminder-spark"><Sparkles size={15} /></div><strong>A reminder from us</strong><p>Your strongest writing starts with what you actually noticed, researched and think.</p><button onClick={onOpenAuth}>Add your perspective <ArrowRight size={13} /></button></section>
      </aside>
    </div>
  </div>;
}

function AuthenticModal({ project, section, onClose, onUpdateVoice, onUpdateSection, notify }) {
  const [suggestions, setSuggestions] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [reviewedAt, setReviewedAt] = useState('');
  const voice = project.voice || { level: 'normal', opinion: '', experience: '', findings: '' };
  const handleReview = () => {
    const found = analyzeText(section?.content || '').map((item) => ({ ...item, status: 'pending', editValue: item.replacement }));
    setSuggestions(found);
    setReviewedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
  };
  const handleAccept = (item) => {
    if (item.kind === 'edit' && section) {
      const current = section.content || '';
      const next = item.id.startsWith('lowercase-i') ? current.replace(/\bi\b/g, item.editValue) : current.replaceAll(item.original, item.editValue);
      onUpdateSection(section.id, { content: next });
      notify('Suggestion accepted. Your draft has been updated.', 'success');
    }
    setSuggestions((current) => current.map((suggestion) => suggestion.id === item.id ? { ...suggestion, status: 'accepted' } : suggestion));
  };
  const handleReject = (item) => setSuggestions((current) => current.map((suggestion) => suggestion.id === item.id ? { ...suggestion, status: 'rejected' } : suggestion));
  const saveEdit = (item) => { setEditingId(null); setSuggestions((current) => current.map((suggestion) => suggestion.id === item.id ? { ...suggestion, status: 'pending' } : suggestion)); };
  const updateEdit = (id, editValue) => setSuggestions((current) => current.map((item) => item.id === id ? { ...item, editValue } : item));
  return <Modal onClose={onClose} className="authentic-modal">
    <div className="modal-heading-row"><div className="modal-heading-icon modal-heading-warm"><WandSparkles size={20} /></div><div><div className="eyebrow">YOUR VOICE, YOUR CHOICES</div><h2>Authentic Writing Mode</h2></div><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
    <div className="authentic-intro"><span className="authentic-quote"><Quote size={17} /></span><p>We’ll help you make <strong>your own ideas clearer</strong> — not replace them. Every edit below is optional, and nothing changes until you accept it.</p></div>
    <div className="authentic-level-row"><div><strong>Writing level</strong><small>Guides the kind of feedback you see. It never rewrites your work.</small></div><div className="writing-level-options">{[['simple', 'Simple'], ['normal', 'Normal'], ['formal', 'More formal']].map(([value, label]) => <button key={value} className={voice.level === value ? 'level-option-active' : ''} onClick={() => onUpdateVoice('level', value)}>{label}</button>)}</div></div>
    <div className="voice-question-heading"><div><h3>What should your writing sound like?</h3><p>Answer in notes or bullet points. You can use these details in your own draft.</p></div><span className="voice-private"><ShieldCheck size={13} /> Private to this SBA</span></div>
    <div className="voice-questions-grid">
      <label className="voice-question"><span className="voice-question-label"><span>01</span> Your view</span><small>What do you personally think about this topic?</small><textarea value={voice.opinion || ''} onChange={(event) => onUpdateVoice('opinion', event.target.value)} placeholder="I think… because…" /></label>
      <label className="voice-question"><span className="voice-question-label"><span>02</span> Your experience</span><small>What have you noticed in your school, family or community?</small><textarea value={voice.experience || ''} onChange={(event) => onUpdateVoice('experience', event.target.value)} placeholder="One thing I have noticed…" /></label>
      <label className="voice-question voice-question-wide"><span className="voice-question-label"><span>03</span> Your findings</span><small>What did your research, interview or survey actually show?</small><textarea value={voice.findings || ''} onChange={(event) => onUpdateVoice('findings', event.target.value)} placeholder="My research found…" /></label>
    </div>
    <div className="authentic-review-heading"><div><h3>Gentle writing checks</h3><p>Small spelling and clarity suggestions — review each one yourself.</p></div><button className="button button-outline button-sm" onClick={handleReview}><RefreshCw size={14} /> Check my draft</button></div>
    {suggestions === null ? <div className="authentic-check-placeholder"><div className="check-placeholder-icon"><FileSearch size={20} /></div><div><strong>Nothing is changed automatically</strong><p>Choose “Check my draft” to see optional, editable suggestions for {section?.title?.toLowerCase() || 'this section'}.</p></div></div> : <div className="suggestions-list">
      <div className="suggestions-time"><span>{suggestions.length ? `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'} to review` : 'No quick-check suggestions found'}</span><span>Checked at {reviewedAt}</span></div>
      {suggestions.length ? suggestions.map((item) => <article className={`suggestion-card suggestion-${item.kind} ${item.status !== 'pending' ? `suggestion-${item.status}` : ''}`} key={item.id}>
        <div className="suggestion-card-icon">{item.kind === 'edit' ? <PenLine size={15} /> : <Lightbulb size={15} />}</div><div className="suggestion-card-main"><div className="suggestion-card-label">{item.kind === 'edit' ? 'OPTIONAL EDIT' : 'ADD YOUR OWN DETAIL'}</div>
          {item.kind === 'edit' ? <div className="suggestion-change"><span className="suggestion-before">{item.original}</span><ArrowRight size={14} /><span className="suggestion-after">{item.editValue || '…'}</span></div> : <div className="suggestion-generic"><strong>“{item.original}”</strong><span>{item.note}</span></div>}
          {editingId === item.id && <div className="suggestion-edit-row"><input value={item.editValue} onChange={(event) => updateEdit(item.id, event.target.value)} aria-label="Edit suggested wording" /><button className="button button-primary button-xs" onClick={() => saveEdit(item)}>Save edit</button></div>}
          {item.status === 'pending' ? <div className="suggestion-actions">{item.kind === 'edit' && <button onClick={() => setEditingId(editingId === item.id ? null : item.id)}>{editingId === item.id ? 'Cancel edit' : 'Edit suggestion'}</button>}<button onClick={() => handleReject(item)}>Reject</button>{item.kind === 'edit' ? <button className="suggestion-accept" onClick={() => handleAccept(item)}><Check size={13} /> Accept change</button> : <button className="suggestion-accept" onClick={() => handleAccept(item)}><Check size={13} /> I’ll add my detail</button>}</div> : <div className={`suggestion-status-text ${item.status}`}>{item.status === 'accepted' ? <><CheckCircle2 size={14} /> Accepted / noted</> : <><X size={14} /> Rejected — left as is</>}</div>}
        </div>
      </article>) : <div className="no-suggestions"><CheckCircle2 size={17} /> No common spelling or broad-phrase patterns found. A careful read-through is still a good idea.</div>}
    </div>}
    <div className="authentic-footer"><span><Info size={14} /> These quick checks are a starting point, not a substitute for proofreading.</span><button className="button button-primary" onClick={onClose}>Back to my draft <ArrowRight size={14} /></button></div>
  </Modal>;
}

function AssistantView({ project, projects, onProjectChange, activeSection, onUpdateProject, onNavigate, onOpenAuth, prefill, clearPrefill }) {
  const [draft, setDraft] = useState('');
  const chatEnd = useRef(null);
  useEffect(() => {
    if (prefill) { setDraft(prefill); clearPrefill(); }
  }, [prefill, clearPrefill]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [project.chat?.length]);
  const firstMessage = { id: 'welcome', role: 'coach', text: `Hi! I’m here to help with “${project.topic || 'your SBA'}”. I can explain requirements, ask thoughtful questions and help organize your own findings.\n\nI won’t write a complete submission for you — your research, opinions and decisions stay at the centre. What would you like to work on?` };
  const messages = project.chat?.length ? project.chat : [firstMessage];
  const send = (textValue = draft) => {
    const text = textValue.trim();
    if (!text) return;
    const userMessage = { id: idFor('chat'), role: 'user', text, createdAt: new Date().toISOString() };
    const reply = buildCoachReply(text, project, activeSection);
    const coachMessage = { id: idFor('chat'), role: 'coach', text: reply, createdAt: new Date().toISOString() };
    onUpdateProject((current) => ({ ...current, chat: [...(current.chat || []), userMessage, coachMessage].slice(-60) }));
    setDraft('');
  };
  const handleKeyDown = (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } };
  return <div className="assistant-page page-enter content-page">
    <div className="page-intro assistant-page-intro"><div><div className="eyebrow">YOUR OWN IDEAS, WITH A LITTLE GUIDANCE</div><h1>Meet your SBA coach <span className="hello-sparkle">✦</span></h1><p>Ask questions, get unstuck and turn your research notes into a clear next step.</p></div><button className="button button-outline" onClick={onOpenAuth}><WandSparkles size={16} /> Authentic mode</button></div>
    <div className="assistant-layout">
      <section className="chat-panel panel">
        <div className="chat-header"><div className="coach-avatar"><Sparkles size={18} /></div><div className="chat-header-copy"><strong>SBA Coach</strong><span><i /> Here to help you think it through</span></div><div className="chat-context-select"><label htmlFor="chat-project-select">PROJECT</label><select id="chat-project-select" value={project.id} onChange={(event) => onProjectChange(event.target.value)}>{projects.map((item) => <option key={item.id} value={item.id}>{getSubject(item.subjectId).name} — {item.topic}</option>)}</select><ChevronDown size={14} /></div></div>
        <div className="chat-context-bar"><span><BookOpen size={14} /> Helping with <strong>{activeSection?.title || 'your SBA'}</strong></span><button onClick={() => onNavigate('workspace')}>Open section <ArrowUpRight size={13} /></button></div>
        <div className="chat-messages">{messages.map((message) => <div key={message.id} className={`chat-message chat-message-${message.role}`}>
          {message.role === 'coach' && <div className="chat-message-avatar"><Sparkles size={13} /></div>}
          <div className="chat-message-body"><div className="chat-bubble">{message.text}</div><span className="chat-time">{message.role === 'coach' ? 'SBA Coach' : 'You'}{message.createdAt ? ` · ${timeAgo(message.createdAt)}` : ''}</span></div>
          {message.role === 'user' && <div className="avatar chat-user-avatar"><UserRound size={14} /></div>}
        </div>)}<div ref={chatEnd} /></div>
        {!project.chat?.length && <div className="chat-starters"><span>TRY ASKING</span><button onClick={() => send('Explain my next section in simple language.')}>Explain this section <ArrowRight size={13} /></button><button onClick={() => send('Help me make interview questions.')}>Help with interview questions <ArrowRight size={13} /></button><button onClick={() => send('Can you help me outline a paragraph?')}>Help structure a paragraph <ArrowRight size={13} /></button></div>}
        <div className="chat-compose-wrap"><div className="chat-compose"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} placeholder="Tell me what you’re working on…" rows={1} aria-label="Message your SBA coach" /><button className="send-button" onClick={() => send()} disabled={!draft.trim()} aria-label="Send message"><Send size={17} /></button></div><div className="chat-compose-foot"><span><ShieldCheck size={13} /> Your work stays yours. Don’t share private information.</span><span>Enter to send · Shift + Enter for a new line</span></div></div>
      </section>
      <aside className="assistant-aside">
        <section className="assistant-context-card"><div className="aside-card-overline"><span>PROJECT CONTEXT</span><SubjectMark subjectId={project.subjectId} size="small" /></div><h3>{project.topic}</h3><div className="assistant-context-row"><GraduationCap size={14} /> {project.level} <span>·</span> Due {formatShortDate(project.deadline)}</div><ProjectProgress project={project} compact /><div className="assistant-context-next"><span>NEXT UP</span><strong>{project.sections.find((item) => !item.completed)?.title || 'Final review'}</strong></div></section>
        <section className="assistant-tool-card"><div className="aside-card-overline"><span>QUICK TOOLS</span><Lightbulb size={16} /></div><button onClick={() => send('Help me brainstorm useful research questions.')}>Brainstorm research questions <ArrowRight size={14} /></button><button onClick={() => send('Can you help me organize research notes?')}>Organize my research notes <ArrowRight size={14} /></button><button onClick={() => send('How can I prepare my oral presentation?')}>Plan my oral presentation <ArrowRight size={14} /></button><button onClick={() => send('Check my draft and give me feedback.')}>Get draft feedback <ArrowRight size={14} /></button></section>
        <div className="assistant-integrity"><Heart size={15} /><p><strong>Guidance, not a shortcut.</strong><br />This starter coach uses guided prompts from your saved project context. Your own research, examples and point of view stay at the centre.</p></div>
      </aside>
    </div>
  </div>;
}

function SourceForm({ draft, setDraft, onCancel, onSave, project }) {
  const sections = project.sections;
  return <div className="source-form-card">
    <div className="source-form-heading"><div><span className="eyebrow">ADD TO YOUR LIBRARY</span><h3>New source</h3></div><button className="icon-button mini-icon-button" onClick={onCancel} aria-label="Close source form"><X size={16} /></button></div>
    <div className="source-form-grid"><div className="form-field"><label htmlFor="source-author">Author / organization</label><input id="source-author" value={draft.author} onChange={(event) => setDraft({ ...draft, author: event.target.value })} placeholder="e.g. UNICEF" /></div><div className="form-field"><label htmlFor="source-title">Page or article title</label><input id="source-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title of the page" /></div><div className="form-field"><label htmlFor="source-site">Website / publisher</label><input id="source-site" value={draft.site} onChange={(event) => setDraft({ ...draft, site: event.target.value })} placeholder="e.g. UNICEF Office of Research" /></div><div className="form-field"><label htmlFor="source-published">Published date / year</label><input id="source-published" value={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.value })} placeholder="e.g. 2024" /></div><div className="form-field form-field-wide"><label htmlFor="source-url">URL</label><input id="source-url" type="url" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="https://…" /></div><div className="form-field"><label htmlFor="source-accessed">Date accessed</label><input id="source-accessed" type="date" value={draft.accessed} onChange={(event) => setDraft({ ...draft, accessed: event.target.value })} /></div><div className="form-field"><label htmlFor="source-section">Use for section</label><select id="source-section" value={draft.sectionId} onChange={(event) => setDraft({ ...draft, sectionId: event.target.value })}>{sections.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div><div className="form-field form-field-wide"><label htmlFor="source-notes">Notes in your own words</label><textarea id="source-notes" rows={3} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="What is useful here? Which question does it help answer?" /></div></div>
    <div className="source-form-footer"><span><ShieldCheck size={14} /> Save where you found every idea.</span><button className="button button-primary" onClick={onSave}><Plus size={15} /> Save source</button></div>
  </div>;
}

function ResearchView({ project, onUpdateProject, onOpenWorkspace, notify }) {
  const [tab, setTab] = useState('sources');
  const [showForm, setShowForm] = useState(false);
  const [sourceDraft, setSourceDraft] = useState({ author: '', title: '', site: '', published: '', url: '', accessed: localDateInput(0), sectionId: project.sections.find((item) => ['research', 'sources', 'research-plan'].includes(item.id))?.id || project.sections[0]?.id || '', notes: '' });
  const [noteText, setNoteText] = useState('');
  const [noteSection, setNoteSection] = useState(project.sections.find((item) => ['report', 'findings', 'research'].includes(item.id))?.id || project.sections[0]?.id || '');
  const fileInputRef = useRef(null);
  const sourceCount = project.sources?.length || 0;
  const noteCount = project.researchNotes?.length || 0;
  const attachmentCount = project.attachments?.length || 0;
  const sectionName = (id) => project.sections.find((item) => item.id === id)?.title || 'SBA research';
  const saveSource = () => {
    if (!sourceDraft.title.trim() && !sourceDraft.url.trim()) { notify('Add a title or URL so you can recognize this source.', 'error'); return; }
    const next = { ...sourceDraft, id: idFor('source'), savedAt: new Date().toISOString() };
    onUpdateProject((current) => ({ ...current, sources: [...(current.sources || []), next] }));
    setSourceDraft({ author: '', title: '', site: '', published: '', url: '', accessed: localDateInput(0), sectionId: project.sections.find((item) => ['research', 'sources', 'research-plan'].includes(item.id))?.id || project.sections[0]?.id || '', notes: '' });
    setShowForm(false);
    notify('Source saved to your Research Library.', 'success');
  };
  const addNote = () => {
    if (!noteText.trim()) { notify('Write a short research note first.', 'error'); return; }
    const note = { id: idFor('note'), text: noteText.trim(), sectionId: noteSection, createdAt: new Date().toISOString() };
    onUpdateProject((current) => ({ ...current, researchNotes: [...(current.researchNotes || []), note] }));
    setNoteText('');
    notify('Research note saved.', 'success');
  };
  const uploadFile = (file) => {
    if (!file) return;
    if (file.size > 1.4 * 1024 * 1024) { notify('That file is over 1.4 MB. Add a smaller copy so it can be saved on this device.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const attachment = { id: idFor('file'), name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: reader.result, addedAt: new Date().toISOString(), sectionId: project.sections.find((item) => ['research', 'sources', 'research-plan'].includes(item.id))?.id || project.sections[0]?.id || '' };
      onUpdateProject((current) => ({ ...current, attachments: [...(current.attachments || []), attachment] }));
      notify(`${file.name} added to this SBA.`, 'success');
    };
    reader.onerror = () => notify('Could not read that file. Please try again.', 'error');
    reader.readAsDataURL(file);
  };
  const removeSource = (id) => onUpdateProject((current) => ({ ...current, sources: (current.sources || []).filter((item) => item.id !== id) }));
  const removeNote = (id) => onUpdateProject((current) => ({ ...current, researchNotes: (current.researchNotes || []).filter((item) => item.id !== id) }));
  const removeAttachment = (id) => onUpdateProject((current) => ({ ...current, attachments: (current.attachments || []).filter((item) => item.id !== id) }));
  const copyCitation = async (source) => {
    try { await navigator.clipboard.writeText(formatCitation(source)); notify('Citation copied.', 'success'); }
    catch { notify('Clipboard access is unavailable in this browser.', 'error'); }
  };
  const insertCitation = (source) => {
    const bibliography = project.sections.find((item) => item.id === 'bibliography');
    if (!bibliography) { notify('This template does not include a bibliography section.', 'error'); return; }
    const citation = formatCitation(source);
    const next = [bibliography.content?.trim(), citation].filter(Boolean).join('\n');
    onUpdateProject((current) => ({ ...current, sections: current.sections.map((item) => item.id === bibliography.id ? { ...item, content: next } : item) }));
    onOpenWorkspace(bibliography.id);
    notify('Citation added to your bibliography draft. Review the formatting.', 'success');
  };
  const tabItems = [['sources', 'Sources', sourceCount, BookMarked], ['notes', 'Research notes', noteCount, NotebookPen], ['documents', 'Documents', attachmentCount, FileText]];

  return <div className="page-enter content-page research-page">
    <div className="page-intro"><div><div className="eyebrow">KEEP EVERY IDEA TRACEABLE</div><h1>Research library</h1><p>Save where information came from and connect it to the SBA section it supports.</p></div><button className="button button-soft research-project-button" onClick={() => onOpenWorkspace()}><span className="research-project-mark"><BookOpen size={14} /></span><span>{getSubject(project.subjectId).name}</span><ChevronDown size={14} /></button></div>
    <div className="research-context-strip"><span className="research-context-icon"><Target size={15} /></span><span><strong>Working on:</strong> {project.topic}</span><button onClick={() => onOpenWorkspace()}>Open SBA <ArrowUpRight size={13} /></button></div>
    <div className="research-tabs">{tabItems.map(([id, label, count, Icon]) => <button key={id} className={tab === id ? 'research-tab-active' : ''} onClick={() => setTab(id)}><Icon size={16} />{label}<span>{count}</span></button>)}</div>
    {tab === 'sources' && <div className="research-content">
      <div className="research-section-heading"><div><h2>Sources & citations</h2><p>Keep author, title, access date and your own notes in one place.</p></div><button className="button button-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add a source</button></div>
      {showForm && <SourceForm draft={sourceDraft} setDraft={setSourceDraft} onCancel={() => setShowForm(false)} onSave={saveSource} project={project} />}
      {project.sources?.length ? <div className="source-list">{project.sources.map((source) => <article className="source-card" key={source.id}><div className="source-card-icon"><BookMarked size={18} /></div><div className="source-card-body"><div className="source-card-meta"><span className="source-tag">{sectionName(source.sectionId)}</span><span>Added {timeAgo(source.savedAt)}</span></div><h3>{source.title || source.url || 'Untitled source'}</h3><div className="source-author-line">{source.author || 'Author not listed'}{source.site && <> <span>·</span> {source.site}</>}{source.published && <> <span>·</span> {source.published}</>}</div>{source.notes && <p className="source-notes-preview">“{source.notes}”</p>}<div className="citation-preview"><span>REFERENCE</span><p>{formatCitation(source)}</p></div><div className="source-card-actions"><button onClick={() => copyCitation(source)}><Copy size={14} /> Copy citation</button>{source.url && <a href={source.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open source</a>}<button onClick={() => insertCitation(source)}><Plus size={14} /> Add to bibliography</button><button className="source-delete-action" onClick={() => removeSource(source.id)}><Trash2 size={14} /> Remove</button></div></div></article>)}</div> : !showForm && <div className="empty-state research-empty"><div className="empty-state-icon"><BookMarked size={22} /></div><h3>Your source shelf is empty</h3><p>Save articles, websites and books as you research. Adding them now makes your bibliography easier later.</p><button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Save your first source</button></div>}
      <div className="research-tip"><Lightbulb size={17} /><p><strong>Quick research habit:</strong> Save the source before you write a note. Then you’ll know exactly where every detail came from.</p></div>
    </div>}
    {tab === 'notes' && <div className="research-content">
      <div className="research-section-heading"><div><h2>Research notes</h2><p>Summarize ideas in your own words and link them to a section.</p></div></div>
      <div className="note-compose-card"><label htmlFor="research-note-text">New note</label><textarea id="research-note-text" rows={4} value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="What did you learn? Add a short idea, finding or question — and remember its source." /><div className="note-compose-footer"><label className="note-section-select">For section <select value={noteSection} onChange={(event) => setNoteSection(event.target.value)}>{project.sections.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><button className="button button-primary" onClick={addNote}><Plus size={15} /> Save note</button></div></div>
      {project.researchNotes?.length ? <div className="research-notes-list">{[...project.researchNotes].reverse().map((note) => <article className="research-note-card" key={note.id}><div className="note-card-icon"><PenLine size={16} /></div><div className="research-note-body"><div className="note-card-meta"><span>{sectionName(note.sectionId)}</span><small>{timeAgo(note.createdAt)}</small></div><p>{note.text}</p></div><button className="icon-button mini-icon-button" aria-label="Remove note" onClick={() => removeNote(note.id)}><Trash2 size={15} /></button></article>)}</div> : <div className="empty-state research-empty"><div className="empty-state-icon"><NotebookPen size={22} /></div><h3>Keep your findings in your own words</h3><p>Short, source-linked notes make drafting much easier.</p></div>}
    </div>}
    {tab === 'documents' && <div className="research-content">
      <div className="research-section-heading"><div><h2>Documents & files</h2><p>Keep research documents together with this SBA. Files are stored in your browser on this device.</p></div><button className="button button-primary" onClick={() => fileInputRef.current?.click()}><FileUp size={16} /> Upload a document</button><input ref={fileInputRef} type="file" className="visually-hidden" accept=".pdf,.doc,.docx,.txt,.rtf,.csv,.png,.jpg,.jpeg" onChange={(event) => { uploadFile(event.target.files?.[0]); event.target.value = ''; }} /></div>
      <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); uploadFile(event.dataTransfer.files?.[0]); }} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && fileInputRef.current?.click()}><span className="upload-drop-icon"><FileUp size={21} /></span><strong>Drop a research file here or browse</strong><small>PDF, DOCX, TXT, CSV or image · up to 1.4 MB per file</small><span className="upload-local-note"><ShieldCheck size={13} /> Saved locally in this browser</span></div>
      {project.attachments?.length ? <div className="attachment-list">{project.attachments.map((file) => <article className="attachment-card" key={file.id}><div className="attachment-icon"><FileText size={19} /></div><div className="attachment-copy"><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(file.size > 100000 ? 0 : 1)} KB <i>·</i> {sectionName(file.sectionId)}</span></div><a className="icon-button mini-icon-button attachment-download" href={file.dataUrl} download={file.name} aria-label={`Download ${file.name}`}><Download size={15} /></a><button className="icon-button mini-icon-button" onClick={() => removeAttachment(file.id)} aria-label={`Remove ${file.name}`}><Trash2 size={15} /></button></article>)}</div> : <div className="empty-file-note"><FileSearch size={19} /><span>No documents saved yet. Upload your own research notes or articles.</span></div>}
      <div className="research-tip"><Info size={17} /><p><strong>Privacy note:</strong> Files stay in this browser’s local storage. The app does not upload them to a server. Keep backups of important work.</p></div>
    </div>}
  </div>;
}

function GuideView({ onCreate }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState('english');
  const filteredSubjects = SUBJECTS.filter((subject) => `${subject.name} ${subject.description}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-enter content-page guide-page">
    <div className="page-intro"><div><div className="eyebrow">CXC SBA STARTING POINTS</div><h1>Subject guide</h1><p>See what a subject checklist can include, then tailor it to your teacher’s brief.</p></div></div>
    <div className="guide-banner"><div className="guide-banner-icon"><BookOpen size={21} /></div><div><strong>A helpful framework, not a replacement for your rubric.</strong><p>Requirements can differ by year, school and teacher. Always compare your SBA with the instructions you were given.</p></div><span className="guide-banner-stamp"><ShieldCheck size={14} /> STUDENT FIRST</span></div>
    <div className="guide-search-row"><div className="guide-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a subject…" /></div><span>{filteredSubjects.length} subject templates</span></div>
    <div className="guide-subject-list">{filteredSubjects.map((subject) => {
      const Icon = subjectIcons[subject.id] || BookOpen;
      const sections = getTemplate(subject.id).sections;
      const isOpen = expanded === subject.id;
      return <section className={`guide-subject-card ${isOpen ? 'guide-subject-open' : ''}`} key={subject.id}>
        <button className="guide-subject-head" onClick={() => setExpanded(isOpen ? '' : subject.id)}><span className={`guide-subject-icon subject-${subject.color}`}><Icon size={19} /></span><span className="guide-subject-copy"><strong>{subject.name}</strong><small>{subject.description}</small></span><span className="guide-subject-total">{sections.length} checklist items</span><ChevronDown size={17} className="guide-chevron" /></button>
        {isOpen && <div className="guide-subject-body"><div className="guide-sections-list">{sections.map((section, index) => <div className="guide-section-row" key={section.id}><span className="guide-section-index">{String(index + 1).padStart(2, '0')}</span><span className="guide-section-content"><strong>{section.title}</strong><small>{section.description}</small></span>{section.range && <span className="guide-word-range">{section.range.min}–{section.range.max} {section.countUnit || 'words'}<small>starting guide</small></span>}</div>)}</div><div className="guide-subject-actions"><span><Info size={14} /> Suggested word counts can be changed to match your brief.</span><button className="button button-soft" onClick={() => onCreate(subject.id)}>Start a {subject.name} SBA <ArrowRight size={15} /></button></div></div>}
      </section>;
    })}</div>
    <div className="guide-footer-note"><Lightbulb size={17} /><p><strong>Don’t see your subject?</strong> Choose “Other CXC subject” when creating a project and edit the checklist to match your teacher’s requirements.</p><button className="text-button" onClick={() => onCreate('other')}>Create a custom SBA <ArrowRight size={14} /></button></div>
  </div>;
}

function ReviewItem({ item, onFix }) {
  const icon = item.severity === 'good' ? <CheckCircle2 size={17} /> : item.severity === 'attention' ? <AlertCircle size={17} /> : item.severity === 'warning' ? <AlertTriangle size={17} /> : <Lightbulb size={17} />;
  return <article className={`review-item review-${item.severity}`}><div className="review-item-icon">{icon}</div><div className="review-item-copy"><strong>{item.title}</strong><p>{item.detail}</p></div>{item.severity !== 'good' && <button className="review-fix-button" onClick={() => onFix(item)}>Check <ArrowRight size={14} /></button>}</article>;
}

function ReviewView({ project, onUpdateSection, onGoToSection, onGoResearch, onExportDocx, onExportPdf, notify }) {
  const [reviewedAt, setReviewedAt] = useState('');
  const currentKey = project.updatedAt;
  const isFresh = Boolean(reviewedAt && reviewedAt === currentKey);
  const results = useMemo(() => buildReview(project), [project]);
  const attentionCount = results.filter((item) => item.severity === 'attention').length;
  const warningCount = results.filter((item) => item.severity === 'warning').length;
  const suggestionCount = results.filter((item) => item.severity === 'suggestion').length;
  const readyToExport = isFresh && attentionCount === 0 && warningCount === 0;
  const runReview = () => {
    setReviewedAt(project.updatedAt);
    const freshResults = buildReview(project);
    notify(freshResults.filter((item) => item.severity === 'attention' || item.severity === 'warning').length ? 'Review complete. Check the items below before exporting.' : 'Review complete. Your project is ready for a final teacher-instruction check.', 'success');
  };
  const fix = (item) => {
    if (item.type === 'section' && item.sectionId) onGoToSection(item.sectionId);
    else if (item.type === 'research') onGoResearch();
    else if (item.type === 'authentic' && item.sectionId) onGoToSection(item.sectionId, true);
    else if (item.type === 'authentic') onGoToSection(project.sections[0]?.id, true);
  };
  return <div className="page-enter content-page review-page">
    <div className="page-intro"><div><div className="eyebrow">A CAREFUL LOOK BEFORE YOU EXPORT</div><h1>Final SBA review</h1><p>See what’s ready, what needs a little work and where your own perspective can shine.</p></div><span className="review-project-chip"><SubjectMark subjectId={project.subjectId} size="small" /><span>{getSubject(project.subjectId).name}</span></span></div>
    <section className="review-project-header panel"><div className="review-project-art"><ClipboardCheck size={24} /></div><div className="review-project-summary"><span className="eyebrow">REVIEWING THIS SBA</span><h2>{project.topic}</h2><div><span>{project.level}</span><i>·</i><span>Due {formatLongDate(project.deadline)}</span><i>·</i><span>{getProgress(project).complete}/{getProgress(project).total} sections complete</span></div></div><button className={`button ${isFresh ? 'button-outline' : 'button-primary'}`} onClick={runReview}><RefreshCw size={15} />{isFresh ? 'Run review again' : 'Run full review'}</button></section>
    <div className="review-score-row"><div className="review-score-card"><span className="review-score-icon review-score-green"><CheckCircle2 size={17} /></span><div><strong>{getProgress(project).complete}</strong><small>sections complete</small></div></div><div className="review-score-card"><span className="review-score-icon review-score-orange"><AlertTriangle size={17} /></span><div><strong>{attentionCount + warningCount}</strong><small>items to check</small></div></div><div className="review-score-card"><span className="review-score-icon review-score-blue"><Lightbulb size={17} /></span><div><strong>{suggestionCount}</strong><small>helpful suggestions</small></div></div><div className="review-score-card"><span className="review-score-icon review-score-lilac"><BookMarked size={17} /></span><div><strong>{project.sources?.length || 0}</strong><small>sources saved</small></div></div></div>
    {!isFresh ? <div className="review-before-card"><div className="review-before-icon"><ShieldCheck size={19} /></div><div><strong>Run your complete SBA review before exporting</strong><p>We’ll check the checklist, starter word ranges, saved references, common writing issues and whether you’ve added your own perspective.</p></div><button className="button button-primary" onClick={runReview}>Run review <ArrowRight size={15} /></button></div> : <>
      <div className={`review-result-banner ${readyToExport ? 'review-ready' : 'review-needs-work'}`}><div className="review-result-icon">{readyToExport ? <CheckCircle2 size={21} /> : <AlertTriangle size={21} />}</div><div><strong>{readyToExport ? 'You’re in a good place to export.' : 'A few things still need your attention.'}</strong><p>{readyToExport ? 'There are no missing sections or out-of-range drafts in this quick review. Do one final check against your teacher’s rubric.' : `${attentionCount} missing section${attentionCount === 1 ? '' : 's'}, ${warningCount} word-count or reference warning${warningCount === 1 ? '' : 's'}${suggestionCount ? ` and ${suggestionCount} optional suggestion${suggestionCount === 1 ? '' : 's'}` : ''}. Work through the list below.`}</p></div></div>
      <section className="review-list-section"><div className="review-list-heading"><div><h2>Review checklist</h2><p>Quick local checks. Always follow your official CXC and teacher requirements.</p></div><span className="review-run-time"><CheckCircle2 size={13} /> Reviewed just now</span></div>
        {results.map((item) => <ReviewItem item={item} key={item.id} onFix={fix} />)}
      </section>
      <section className="export-panel"><div className="export-panel-copy"><div className="export-panel-icon"><FileDown size={20} /></div><div><h2>Take your work with you</h2><p>Choose a clean, teacher-friendly format. You can still edit your project afterwards.</p></div></div><div className="export-actions"><button className="button button-outline" disabled={!isFresh} onClick={() => { onExportDocx(); }}><FileText size={16} /> Download DOCX</button><button className="button button-primary" disabled={!isFresh} onClick={() => { onExportPdf(); }}><Download size={16} /> Save as PDF</button></div><div className="export-disabled-hint">{!isFresh ? 'Run the review before exporting. Review warnings remain visible so you can decide what to fix.' : readyToExport ? 'DOCX downloads directly. PDF opens your browser’s print dialog — choose “Save as PDF”.' : 'Review complete. You can export this draft, but address the items above before submitting.'}</div></section>
    </>}
    <div className="review-disclaimer"><Info size={15} /><span>This review is a helpful checklist, not an official CXC mark or a guarantee of a grade. Verify facts, citations and requirements with your teacher.</span></div>
  </div>;
}

function safeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function printProject(project) {
  const subject = getSubject(project.subjectId);
  const sections = project.sections.map((item) => `<section class="section"><h2>${safeHtml(item.title)}</h2><p class="section-meta">${safeHtml(item.group)}${item.range ? ` · Suggested ${item.range.min}–${item.range.max} ${safeHtml(item.countUnit || 'words')}` : ''}</p><div class="section-text">${safeHtml(item.content || 'No notes added yet.').replace(/\n/g, '<br>')}</div></section>`).join('');
  const sources = project.sources?.length ? `<section class="section"><h2>Bibliography & source notes</h2>${project.sources.map((source) => `<p class="citation">${safeHtml(formatCitation(source))}${source.notes ? `<br><span>${safeHtml(source.notes)}</span>` : ''}</p>`).join('')}</section>` : '';
  const notes = project.researchNotes?.length ? `<section class="section"><h2>Research notes</h2>${project.researchNotes.map((note) => `<p class="citation"><strong>${safeHtml(project.sections.find((item) => item.id === note.sectionId)?.title || 'SBA note')}:</strong> ${safeHtml(note.text)}</p>`).join('')}</section>` : '';
  const markup = `<!doctype html><html><head><meta charset="utf-8"><title>${safeHtml(project.topic)} — SBA</title><style>
    @page{size:letter;margin:0.75in}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#25332a;line-height:1.6;font-size:11pt}.cover{padding:20px 0 24px;border-bottom:2px solid #dfe8df;margin-bottom:28px}.eyebrow{text-transform:uppercase;letter-spacing:1.4px;color:#607c68;font-size:9pt;font-weight:700}.subject{display:inline-block;padding:5px 10px;background:#eff5ed;border-radius:20px;color:#526f59;font-size:9pt;font-weight:700;margin-bottom:16px}h1{font-family:Georgia,serif;font-size:25pt;line-height:1.2;margin:8px 0 12px;color:#203329}h2{font-family:Georgia,serif;font-size:16pt;color:#304939;margin:0 0 4px}p{margin:6px 0}.meta{display:flex;gap:16px;color:#69766e;font-size:10pt}.section{margin:0 0 28px;break-inside:avoid}.section-meta{font-size:9pt;color:#859187;margin-bottom:10px}.section-text{white-space:normal}.citation{padding:8px 0;border-bottom:1px solid #e8ece8}.citation span{color:#68756e}.footer{margin-top:40px;border-top:1px solid #dfe8df;padding-top:12px;font-size:9pt;color:#7b877e}@media print{.section{break-inside:auto}}
  </style></head><body><header class="cover"><div class="subject">${safeHtml(subject.name)} · SBA PROJECT</div><h1>${safeHtml(project.topic)}</h1><div class="meta"><span>${safeHtml(project.level)}</span><span>Target deadline: ${safeHtml(formatLongDate(project.deadline))}</span><span>Prepared ${safeHtml(new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()))}</span></div></header>${sections}${sources}${notes}<footer class="footer">Prepared with SBA Helper AI · Check every section against your teacher’s instructions before submission.</footer><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350))</script></body></html>`;
  const printWindow = window.open('', '_blank');
  if (!printWindow) { window.alert('Please allow pop-ups for this page so the print view can open.'); return; }
  printWindow.document.open();
  printWindow.document.write(markup);
  printWindow.document.close();
}

async function downloadDocx(project) {
  const subject = getSubject(project.subjectId);
  const children = [
    new Paragraph({ text: subject.name.toUpperCase() + ' · SBA PROJECT', style: 'Subtitle', spacing: { after: 120 } }),
    new Paragraph({ text: project.topic || 'Untitled SBA', heading: HeadingLevel.TITLE, spacing: { after: 180 } }),
    new Paragraph({ children: [new TextRun({ text: `${project.level || 'Class not set'}  ·  Target deadline: ${formatLongDate(project.deadline)}`, color: '64716A', size: 21 })], spacing: { after: 420 } }),
  ];
  project.sections.forEach((section) => {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1, spacing: { before: 260, after: 100 }, keepNext: true }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${section.group}${section.range ? ` · Suggested ${section.range.min}–${section.range.max} ${section.countUnit || 'words'}` : ''}`, color: '7C8980', italics: true, size: 19 })], spacing: { after: 120 } }));
    const lines = (section.content || 'No notes added yet.').split('\n');
    lines.forEach((line) => children.push(new Paragraph({ text: line || ' ', spacing: { after: 80, line: 300 } })));
  });
  if (project.sources?.length) {
    children.push(new Paragraph({ text: 'Bibliography & source notes', heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 120 } }));
    project.sources.forEach((source) => {
      children.push(new Paragraph({ text: formatCitation(source), spacing: { after: 80 } }));
      if (source.notes) children.push(new Paragraph({ children: [new TextRun({ text: `Research note: ${source.notes}`, color: '5B695F', italics: true })], spacing: { after: 180 } }));
    });
  }
  if (project.researchNotes?.length) {
    children.push(new Paragraph({ text: 'Research notes', heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 120 } }));
    project.researchNotes.forEach((note) => children.push(new Paragraph({ children: [new TextRun({ text: `${project.sections.find((section) => section.id === note.sectionId)?.title || 'SBA note'}: `, bold: true }), new TextRun(note.text)], spacing: { after: 130 } })));
  }
  children.push(new Paragraph({ children: [new TextRun({ text: 'Prepared with SBA Helper AI · Check every section against your teacher’s instructions before submission.', color: '738078', italics: true, size: 18 })], spacing: { before: 420 } }));
  const document = new Document({
    creator: 'SBA Helper AI',
    title: project.topic || 'SBA Project',
    subject: subject.name,
    description: 'Student SBA working document',
    styles: {
      default: {
        document: { run: { font: 'Aptos', size: 22, color: '26372D' }, paragraph: { spacing: { line: 300 } } },
        title: { run: { font: 'Georgia', size: 40, bold: true, color: '26372D' }, paragraph: { spacing: { after: 200 } } },
        heading1: { run: { font: 'Georgia', size: 30, bold: true, color: '46634E' }, paragraph: { spacing: { before: 300, after: 100 } } },
      },
    },
    sections: [{ properties: { page: { margin: { top: 950, right: 1050, bottom: 950, left: 1050 } } }, children }],
  });
  const blob = await Packer.toBlob(document);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${(project.topic || 'SBA-project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 58) || 'SBA-project'}.docx`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function App() {
  const [projects, setProjects] = useState(readInitialProjects);
  const [activeProjectId, setActiveProjectId] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(saved) && saved[0]?.id ? saved[0].id : 'demo-english-sba'; }
    catch { return 'demo-english-sba'; }
  });
  const [view, setView] = useState('dashboard');
  const [selectedSectionId, setSelectedSectionId] = useState('plan');
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem(THEME_KEY) || 'light'; } catch { return 'light'; } });
  const [saveState, setSaveState] = useState('saved');
  const [modalOpen, setModalOpen] = useState(false);
  const [createSubject, setCreateSubject] = useState('english');
  const [authenticOpen, setAuthenticOpen] = useState(false);
  const [authenticSectionId, setAuthenticSectionId] = useState('');
  const [assistantPrefill, setAssistantPrefill] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const activeProject = projects.find((project) => project.id === activeProjectId) || projects[0] || null;
  const activeSection = activeProject?.sections.find((section) => section.id === selectedSectionId) || activeProject?.sections.find((section) => !section.completed) || activeProject?.sections[0] || null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* Storage can be unavailable in private mode. */ }
  }, [theme]);
  useEffect(() => {
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); setSaveState('saved'); }
      catch (error) { console.warn('Could not save the SBA workspace locally.', error); setSaveState('error'); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [projects]);
  useEffect(() => {
    if (activeProject && !activeProject.sections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(activeProject.sections.find((section) => !section.completed)?.id || activeProject.sections[0]?.id || '');
    }
  }, [activeProject?.id, activeProject?.sections, selectedSectionId]);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const notify = (message, kind = 'success') => {
    window.clearTimeout(toastTimer.current);
    setToast({ message, kind });
  };
  const closeToast = () => { window.clearTimeout(toastTimer.current); setToast(null); };
  const navigate = (nextView) => { setView(nextView); setSidebarOpen(false); };
  const updateProject = (projectId, update) => {
    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) return project;
      const changed = typeof update === 'function' ? update(project) : { ...project, ...update };
      return { ...changed, updatedAt: new Date().toISOString(), demo: false };
    }));
  };
  const updateActiveProject = (update) => { if (activeProject) updateProject(activeProject.id, update); };
  const updateSection = (sectionId, patch) => {
    if (!activeProject) return;
    updateProject(activeProject.id, (project) => ({ ...project, sections: project.sections.map((section) => section.id === sectionId ? { ...section, ...patch } : section) }));
  };
  const updateVoice = (field, value) => {
    if (!activeProject) return;
    updateActiveProject((project) => ({ ...project, voice: { ...(project.voice || {}), [field]: value } }));
  };
  const continueProject = (project, sectionId) => {
    setActiveProjectId(project.id);
    setSelectedSectionId(sectionId || project.sections.find((section) => !section.completed)?.id || project.sections[0]?.id || '');
    setView('workspace');
    setSidebarOpen(false);
  };
  const openCoach = (prefill = '') => { setAssistantPrefill(prefill); setView('assistant'); setSidebarOpen(false); };
  const openCreate = (subjectId) => { setCreateSubject(subjectId || 'english'); setModalOpen(true); };
  const createNewProject = (project) => {
    setProjects((current) => [project, ...current]);
    setActiveProjectId(project.id);
    setSelectedSectionId(project.sections.find((section) => !section.completed)?.id || project.sections[0]?.id || '');
    setModalOpen(false);
    setView('workspace');
    notify('Your SBA checklist is ready. Start with the section that feels easiest.', 'success');
  };
  const deleteProject = (project) => {
    if (!window.confirm(`Delete “${project.topic || 'Untitled SBA'}” from this device? This cannot be undone.`)) return;
    const remaining = projects.filter((item) => item.id !== project.id);
    setProjects(remaining);
    if (activeProjectId === project.id) {
      const next = remaining[0] || null;
      setActiveProjectId(next?.id || '');
      setSelectedSectionId(next?.sections.find((section) => !section.completed)?.id || next?.sections[0]?.id || '');
      setView(next ? 'dashboard' : 'projects');
    }
    notify('SBA deleted from this device.', 'success');
  };
  const openAuthFor = (sectionId = selectedSectionId) => {
    setAuthenticSectionId(sectionId || activeProject?.sections[0]?.id || '');
    setAuthenticOpen(true);
  };
  const goToReviewSection = (sectionId, auth = false) => {
    if (sectionId) setSelectedSectionId(sectionId);
    setView('workspace');
    if (auth) { setAuthenticSectionId(sectionId || activeSection?.id || ''); setAuthenticOpen(true); }
  };
  const openProjectFromSearch = (project) => continueProject(project);
  const clearAssistantPrefill = () => setAssistantPrefill('');
  const onResearchGoWorkspace = (sectionId) => {
    if (sectionId) setSelectedSectionId(sectionId);
    setView('workspace');
  };
  const exportDocx = async () => {
    if (!activeProject) return;
    try { await downloadDocx(activeProject); notify('Your DOCX is ready to download.', 'success'); }
    catch (error) { console.error(error); notify('Could not create the DOCX in this browser. Try the PDF print option.', 'error'); }
  };
  const exportPdf = () => { if (activeProject) printProject(activeProject); };

  const onMarkComplete = (section) => {
    const complete = !section.completed;
    updateSection(section.id, { completed: complete });
    if (complete) {
      const next = activeProject.sections.find((item) => item.id !== section.id && !item.completed);
      notify(next ? `${section.title} checked off. Ready for ${next.title}?` : 'Checklist complete. Run your final review before you export.', 'success');
    } else notify(`${section.title} moved back to in progress.`, 'success');
  };

  return <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
    <div className={`sidebar-wrap ${sidebarOpen ? 'sidebar-wrap-open' : ''}`}><Sidebar view={view} project={activeProject} projectsCount={projects.length} onNavigate={navigate} onContinue={continueProject} open={sidebarOpen} onClose={() => setSidebarOpen(false)} saveState={saveState} /></div>
    {sidebarOpen && <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
    <div className="app-main">
      <Topbar view={view} project={activeProject} theme={theme} onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onMenu={() => setSidebarOpen(true)} projects={projects} onOpenProject={openProjectFromSearch} saveState={saveState} />
      <main className="page-main" key={view}>
        {view === 'dashboard' && <Dashboard projects={projects} onNew={openCreate} onContinue={continueProject} onNavigate={navigate} onAsk={openCoach} />}
        {view === 'projects' && <ProjectsView projects={projects} onNew={openCreate} onContinue={continueProject} onDelete={deleteProject} />}
        {view === 'workspace' && activeProject && <WorkspaceView project={activeProject} sectionId={selectedSectionId} onSelectSection={(id, route) => { if (route) navigate(route); else if (id) setSelectedSectionId(id); }} onUpdateSection={updateSection} onOpenAuth={() => openAuthFor(activeSection?.id)} onOpenCoach={openCoach} onOpenResearch={() => navigate('research')} onReview={() => navigate('review')} saveState={saveState} onComplete={onMarkComplete} />}
        {view === 'research' && activeProject && <ResearchView key={activeProject.id} project={activeProject} onUpdateProject={(update) => updateProject(activeProject.id, update)} onOpenWorkspace={onResearchGoWorkspace} notify={notify} />}
        {view === 'assistant' && activeProject && <AssistantView key={activeProject.id} project={activeProject} projects={projects} onProjectChange={(id) => { setActiveProjectId(id); setSelectedSectionId(projects.find((item) => item.id === id)?.sections.find((section) => !section.completed)?.id || ''); }} activeSection={activeSection} onUpdateProject={(update) => updateProject(activeProject.id, update)} onNavigate={(route) => navigate(route)} onOpenAuth={() => openAuthFor(activeSection?.id)} prefill={assistantPrefill} clearPrefill={clearAssistantPrefill} />}
        {view === 'review' && activeProject && <ReviewView key={activeProject.id} project={activeProject} onGoToSection={goToReviewSection} onGoResearch={() => navigate('research')} onExportDocx={exportDocx} onExportPdf={exportPdf} notify={notify} />}
        {view === 'guide' && <GuideView onCreate={openCreate} />}
        {!activeProject && view !== 'guide' && <div className="empty-state app-empty"><div className="empty-state-icon"><BookOpen size={23} /></div><h2>Your workspace is ready</h2><p>Create an SBA and we’ll build a section-by-section checklist around your subject.</p><button className="button button-primary" onClick={() => openCreate()}><Plus size={16} /> Create an SBA</button></div>}
      </main>
    </div>
    <MobileNav view={view} onNavigate={navigate} />
    {modalOpen && <CreateProjectModal initialSubject={createSubject} onClose={() => setModalOpen(false)} onCreate={createNewProject} />}
    {authenticOpen && activeProject && <AuthenticModal key={`${activeProject.id}-${authenticSectionId}`} project={activeProject} section={activeProject.sections.find((item) => item.id === authenticSectionId) || activeSection} onClose={() => setAuthenticOpen(false)} onUpdateVoice={updateVoice} onUpdateSection={updateSection} notify={notify} />}
    {toast && <Toast message={toast.message} kind={toast.kind} onClose={closeToast} />}
  </div>;
}

export default App;
