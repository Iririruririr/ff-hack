export const countWords = (text = '') => {
  const matches = String(text).trim().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu);
  return matches ? matches.length : 0;
};

export const countSectionUnits = (section, text = '') => {
  if (section?.countUnit === 'questions') {
    const value = String(text).trim();
    if (!value) return 0;
    const lines = value.split('\n').map((line) => line.trim()).filter(Boolean);
    return lines.length > 1 ? lines.length : Math.max(1, (value.match(/\?/g) || []).length);
  }
  return countWords(text);
};

export const getProgress = (project) => {
  const sections = project?.sections || [];
  if (!sections.length) return { complete: 0, total: 0, percent: 0, remaining: 0 };
  const complete = sections.filter((item) => item.completed).length;
  return { complete, total: sections.length, percent: Math.round((complete / sections.length) * 100), remaining: sections.length - complete };
};

export const formatShortDate = (value) => {
  if (!value) return 'No deadline set';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'No deadline set';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
};

export const formatLongDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
};

export const getDeadlineMeta = (value) => {
  if (!value) return { label: 'Add a deadline', tone: 'muted', days: null };
  const due = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`, tone: 'danger', days };
  if (days === 0) return { label: 'Due today', tone: 'danger', days };
  if (days === 1) return { label: 'Due tomorrow', tone: 'warning', days };
  if (days <= 7) return { label: `Due in ${days} days`, tone: 'warning', days };
  return { label: `Due ${formatShortDate(value)}`, tone: 'calm', days };
};

export const formatCitation = (source) => {
  const author = source.author?.trim() ? `${source.author.trim()}. ` : '';
  const title = source.title?.trim() ? `“${source.title.trim()}.” ` : '';
  const site = source.site?.trim() ? `${source.site.trim()}, ` : '';
  const published = source.published?.trim() ? `${source.published.trim()}, ` : '';
  const url = source.url?.trim() ? `${source.url.trim().replace(/^https?:\/\//, '')}. ` : '';
  const accessed = source.accessed ? `Accessed ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${source.accessed}T12:00:00`))}.` : '';
  return `${author}${title}${site}${published}${url}${accessed}`.trim() || 'Source details not added yet.';
};

export const analyzeText = (text = '') => {
  const value = String(text);
  const suggestions = [];
  const add = (id, original, replacement, note) => {
    if (original && value.includes(original) && !suggestions.some((item) => item.id === id)) {
      suggestions.push({ id, original, replacement, note, kind: 'edit' });
    }
  };
  add('teh', 'teh', 'the', 'Common spelling correction');
  add('alot', 'alot', 'a lot', 'Common spelling correction');
  add('recieve', 'recieve', 'receive', 'Common spelling correction');
  add('dont', 'dont', "don't", 'Check the contraction');
  add('doesnt', 'doesnt', "doesn't", 'Check the contraction');
  add('cant', 'cant', "can't", 'Check the contraction');
  add('wont', 'wont', "won't", 'Check the contraction');
  add('repeated-spaces', '  ', ' ', 'Remove an extra space');
  add('space-before-punctuation', ' .', '.', 'Remove the space before punctuation');
  add('lowercase-i', ' i ', ' I ', 'Capitalize the pronoun “I”');
  if (/\bi\b/.test(value) && !suggestions.some((item) => item.id === 'lowercase-i')) {
    const match = value.match(/\bi\b/);
    if (match) suggestions.push({ id: 'lowercase-i-edge', original: match[0], replacement: 'I', note: 'Capitalize the pronoun “I”', kind: 'edit' });
  }

  const broadPhrases = [
    ['In today’s society', 'Could you name a local example, time period or group?'],
    ["In today's society", 'Could you name a local example, time period or group?'],
    ['many people believe', 'Whose view did your research actually capture?'],
    ['many people think', 'Can you identify whose opinion this is and support it with evidence?'],
    ['it is important to note', 'Try stating the specific point directly, then add your evidence.'],
    ['this shows that', 'Explain what your own evidence shows and why you interpret it that way.'],
    ['nowadays', 'Can you make the time or place more specific?'],
  ];
  broadPhrases.forEach(([phrase, nudge], index) => {
    const phraseIndex = value.toLowerCase().indexOf(phrase.toLowerCase());
    if (phraseIndex >= 0) {
      const original = value.slice(phraseIndex, phraseIndex + phrase.length);
      suggestions.push({ id: `generic-${index}`, original, replacement: '', note: nudge, kind: 'personalize' });
    }
  });
  return suggestions;
};

export const buildReview = (project) => {
  if (!project) return [];
  const checks = [];
  const sections = project.sections || [];
  sections.forEach((item) => {
    if (!item.completed) {
      checks.push({
        id: `missing-${item.id}`,
        type: 'section',
        sectionId: item.id,
        severity: 'attention',
        title: `${item.title} still needs attention`,
        detail: item.content?.trim() ? 'You have a start here. Mark it complete when you have checked it against the brief.' : 'Add your own notes or evidence, then mark this section complete.',
      });
    }
    if (item.range && item.id !== 'final-review') {
      const count = countSectionUnits(item, item.content);
      if (count < item.range.min) {
        checks.push({
          id: `words-low-${item.id}`,
          type: 'section',
          sectionId: item.id,
          severity: 'warning',
          title: `${item.title}: ${count} ${item.countUnit || 'words'}`,
          detail: `Your teacher’s guide may expect about ${item.range.min}–${item.range.max} ${item.countUnit || 'words'}. Add more of your own evidence or confirm the exact range with your teacher.`,
        });
      } else if (count > item.range.max) {
        checks.push({
          id: `words-high-${item.id}`,
          type: 'section',
          sectionId: item.id,
          severity: 'warning',
          title: `${item.title}: ${count} ${item.countUnit || 'words'}`,
          detail: `This is above the suggested ${item.range.min}–${item.range.max} ${item.countUnit || 'words'} guide. Check your teacher’s limit and trim only what is not needed.`,
        });
      }
    }
    if (item.content?.trim()) {
      const edits = analyzeText(item.content).filter((suggestion) => suggestion.kind === 'edit');
      if (edits.length) {
        checks.push({
          id: `proof-${item.id}`,
          type: 'authentic',
          sectionId: item.id,
          severity: 'suggestion',
          title: `Proofread ${item.title.toLowerCase()}`,
          detail: `${edits.length} possible spelling or spacing suggestion${edits.length === 1 ? '' : 's'} to review. The coach will not change anything unless you accept it.`,
        });
      }
      const generic = analyzeText(item.content).filter((suggestion) => suggestion.kind === 'personalize');
      if (generic.length) {
        checks.push({
          id: `voice-${item.id}`,
          type: 'authentic',
          sectionId: item.id,
          severity: 'suggestion',
          title: `Add your perspective to ${item.title.toLowerCase()}`,
          detail: 'A broad phrase may sound generic. Consider adding a detail from your own research, class or community.',
        });
      }
    }
  });

  const researchSections = sections.filter((item) => ['sources', 'research', 'methodology'].includes(item.id));
  if (!project.sources?.length && !project.attachments?.length) {
    checks.push({
      id: 'research-sources',
      type: 'research',
      severity: 'attention',
      title: 'Save at least one research source',
      detail: 'Keep a record of where your facts and ideas came from. Add a source in your Research Library.',
    });
  }
  const bibliography = sections.find((item) => item.id === 'bibliography');
  if (bibliography && project.sources?.length && !bibliography.content?.trim()) {
    checks.push({
      id: 'bibliography-empty',
      type: 'section',
      sectionId: bibliography.id,
      severity: 'warning',
      title: 'Add your saved sources to the bibliography',
      detail: 'Research Library has source entries ready. Insert the citations and check your teacher’s required style.',
    });
  }
  if (researchSections.length && !project.researchNotes?.length) {
    checks.push({
      id: 'research-notes',
      type: 'research',
      severity: 'suggestion',
      title: 'Keep a few research notes',
      detail: 'A short note in your own words will make it easier to connect evidence to your report later.',
    });
  }
  const voice = project.voice || {};
  const personalAnswers = ['opinion', 'experience', 'findings'].filter((key) => voice[key]?.trim()).length;
  if (personalAnswers < 2) {
    checks.push({
      id: 'personal-input',
      type: 'authentic',
      severity: 'suggestion',
      title: 'Add more of your own perspective',
      detail: 'Your personal observations and interpretation help the final SBA sound like you. Visit Authentic Writing Mode to capture them.',
    });
  }
  if (!project.topic?.trim()) {
    checks.push({ id: 'topic-missing', type: 'section', sectionId: sections[0]?.id, severity: 'attention', title: 'Add an SBA topic', detail: 'A focused topic helps keep your research and writing organized.' });
  }
  checks.push({
    id: 'organization-order',
    type: 'good',
    severity: 'good',
    title: 'Organization: subject checklist order is set',
    detail: 'Your sections follow the selected subject template. Use headings and connect each finding back to your research questions.',
  });
  const longParagraph = sections.find((item) => (item.content || '').split('\\n').some((line) => line.length > 260));
  if (longParagraph) {
    checks.push({
      id: 'formatting-long-paragraph',
      type: 'section',
      sectionId: longParagraph.id,
      severity: 'suggestion',
      title: `Check paragraph breaks in ${longParagraph.title.toLowerCase()}`,
      detail: 'One line is quite long. Consider adding paragraph breaks or bullets so your teacher can follow each idea.',
    });
  } else {
    checks.push({
      id: 'formatting-check',
      type: 'good',
      severity: 'good',
      title: 'Basic formatting check',
      detail: 'No unusually long lines were found. Before submitting, check headings, spacing and any format requested in your teacher’s brief.',
    });
  }
  const incompleteSources = (project.sources || []).filter((source) => !source.title?.trim() || (!source.author?.trim() && !source.site?.trim()) || (!source.site?.trim() && !source.url?.trim()));
  if (incompleteSources.length) {
    checks.push({
      id: 'reference-details',
      type: 'research',
      severity: 'warning',
      title: `${incompleteSources.length} source${incompleteSources.length === 1 ? '' : 's'} need citation details`,
      detail: 'Add a title, author or organization, and publisher or URL so the source can be identified and checked.',
    });
  }
  const hasProofingFlags = checks.some((item) => item.id.startsWith('proof-'));
  if (!hasProofingFlags) {
    checks.push({
      id: 'proofing-check',
      type: 'good',
      severity: 'good',
      title: 'Spelling & grammar quick check',
      detail: 'No common spelling patterns were flagged by this local check. Read your work carefully and use your browser’s spelling suggestions too.',
    });
  }
  if (!checks.some((item) => item.severity !== 'good')) {
    checks.push({ id: 'all-clear', type: 'good', severity: 'good', title: 'Everything in this quick review looks ready', detail: 'Do one final comparison with your teacher’s instructions before submitting.' });
  }
  return checks;
};

export const plural = (n, singular, pluralForm = `${singular}s`) => `${n} ${n === 1 ? singular : pluralForm}`;
