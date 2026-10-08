export const SUBJECTS = [
  { id: 'english', name: 'English', short: 'ENG', color: 'rose', description: 'Portfolio, reflections & oral presentation' },
  { id: 'social-studies', name: 'Social Studies', short: 'SOC', color: 'blue', description: 'Investigation, findings & recommendations' },
  { id: 'pob', name: 'Principles of Business', short: 'POB', color: 'gold', description: 'Business research & analysis' },
  { id: 'poa', name: 'Principles of Accounts', short: 'POA', color: 'violet', description: 'Accounting records & financial statements' },
  { id: 'hsb', name: 'Human & Social Biology', short: 'HSB', color: 'green', description: 'Scientific investigation & discussion' },
  { id: 'it', name: 'Information Technology', short: 'IT', color: 'cyan', description: 'Design, development & evaluation' },
  { id: 'technical-drawing', name: 'Technical Drawing', short: 'TD', color: 'orange', description: 'Design brief, drawings & evaluation' },
  { id: 'other', name: 'Other CXC subject', short: 'CXC', color: 'slate', description: 'Build a checklist around your teacher’s brief' },
];

const section = (id, title, group, description, prompts, range = null, extra = {}) => ({
  id,
  title,
  group,
  description,
  prompts,
  range,
  completed: false,
  content: '',
  ...extra,
});

const EnglishSections = [
  section('topic', 'Topic & focus', 'Getting started', 'Choose a focused theme that connects your three artefacts. Keep the topic specific enough to research and discuss.', ['What theme are you interested in?', 'Which people, place or issue will you focus on?', 'Why is this topic worth exploring?'], { min: 20, max: 60 }),
  section('plan', 'Plan of Investigation', 'Getting started', 'Explain what you plan to investigate, why you chose it, and how you will gather and use evidence. Check your teacher’s brief for the exact format.', ['Why did you choose this topic?', 'What will you find out?', 'How will you collect and compare information?'], { min: 100, max: 150 }),
  section('questions', 'Research questions', 'Research', 'Write clear, open-ended questions that will guide your reading, interview or survey. Questions should connect directly to your topic.', ['What do you already want to know?', 'Can each question be answered with evidence?', 'Do your questions cover more than one angle?'], { min: 30, max: 100 }),
  section('research-plan', 'Research plan', 'Research', 'Map out the people, materials and methods you will use. Keep track of which question each source or activity will help answer.', ['Which sources will you consult?', 'Who could you speak with?', 'What will you do first, and when?'], { min: 80, max: 150 }),
  section('sources', 'Sources & research notes', 'Research', 'Save reliable sources in Research Library and add short notes in your own words. Record where each fact came from before using it.', ['What is the main idea from this source?', 'Which research question does it help answer?', 'What makes the source useful or trustworthy?'], null),
  section('interviews', 'Interview questions', 'Research', 'Prepare neutral, respectful questions for someone with relevant experience. Ask permission before recording or quoting anyone.', ['Who can provide a useful perspective?', 'Are questions open-ended and unbiased?', 'How will you ask for consent?'], { min: 6, max: 12 }, { countUnit: 'questions' }),
  section('survey', 'Survey / questionnaire', 'Research', 'Create a short questionnaire for your target group. Use clear language, avoid leading questions and plan how responses will be summarized.', ['Who is your target group?', 'Do the questions avoid suggesting an answer?', 'How will you protect respondents’ privacy?'], { min: 6, max: 12 }, { countUnit: 'questions' }),
  section('artifact-1', 'Artefact 1', 'Portfolio', 'Add your first artefact connected to the topic. Note its source, audience, purpose and the language features that make it relevant.', ['What is this artefact and where did it come from?', 'Who was it made for?', 'What makes it useful for your topic?'], { min: 80, max: 180 }),
  section('artifact-2', 'Artefact 2', 'Portfolio', 'Add a second artefact that gives a different angle or perspective. A varied portfolio gives you more to compare and discuss.', ['How does this artefact add a new perspective?', 'What language or details stand out?', 'How does it connect with artefact 1?'], { min: 80, max: 180 }),
  section('artifact-3', 'Artefact 3', 'Portfolio', 'Add a third artefact that rounds out your exploration. Make sure each item is relevant, suitable and properly acknowledged.', ['What did you learn from this item?', 'Does it challenge or support another artefact?', 'Have you recorded its source?'], { min: 80, max: 180 }),
  section('report', 'Written report', 'Writing', 'Bring your research together in a clear report. Explain what you found, compare perspectives and support your points with evidence you collected.', ['What are your main findings?', 'Which evidence best supports each point?', 'What is your own conclusion?'], { min: 250, max: 350 }),
  section('reflection-1', 'Reflection 1', 'Reflection', 'Reflect on your first artefact and the way it uses language. Include a specific feature and explain its effect on you or its audience.', ['Which feature did you notice?', 'What effect does it create?', 'How did it shape your response?'], { min: 100, max: 150 }),
  section('reflection-2', 'Reflection 2', 'Reflection', 'Reflect on another artefact or stage of your investigation. Move beyond describing what it says: explain what you noticed and learned.', ['What surprised or challenged you?', 'What did you learn about language or the issue?', 'Did your view change? Why?'], { min: 100, max: 150 }),
  section('reflection-3', 'Reflection 3', 'Reflection', 'Complete your reflection by connecting your final artefact to the others and to your learning across the investigation.', ['How does this artefact connect to the others?', 'What skill did you practise?', 'What would you investigate next?'], { min: 100, max: 150 }),
  section('oral-plan', 'Oral presentation plan', 'Presentation', 'Plan a short, well-paced presentation of your investigation. Choose the most important evidence and explain your personal response.', ['What is the one idea your audience should remember?', 'Which two findings will you share?', 'How will you open and close confidently?'], { min: 100, max: 180 }),
  section('bibliography', 'Bibliography & references', 'Finish up', 'List every source you used, including artefacts and interview or survey material where required. Use Research Library to generate consistent entries.', ['Have you cited every fact, quotation and artefact?', 'Are the details complete?', 'Does your teacher require a particular style?'], null),
  section('final-review', 'Final review', 'Finish up', 'Check your teacher’s instructions, your portfolio and every required component before submitting. Export only after checking the review list.', ['Does every section reflect your own work?', 'Have you checked all names, dates and sources?', 'Is the final file easy for your teacher to follow?'], null),
];

const templates = {
  english: { sections: EnglishSections },
  'social-studies': { sections: [
    section('topic', 'Topic & rationale', 'Getting started', 'State the issue you will investigate, who or what it affects, and why it is important to your community.', ['Which local or regional issue interests you?', 'Who is affected?', 'Why is it worth investigating?'], { min: 80, max: 150 }),
    section('objectives', 'Objectives & research questions', 'Getting started', 'Set clear objectives and focused questions. Each objective should describe something your investigation will find out or explain.', ['What do you want to find out?', 'Can you investigate it with the time and access you have?', 'How will you know each objective is met?'], { min: 80, max: 150 }),
    section('plan', 'Plan of Investigation', 'Getting started', 'Describe the issue, the information you need and the approach you will use to investigate it.', ['What is the focus?', 'What methods will you use?', 'What is your sequence of steps?'], { min: 100, max: 180 }),
    section('methodology', 'Methodology', 'Research', 'Explain how you gathered information, who took part and how you treated responses fairly and responsibly.', ['Which primary and secondary methods did you use?', 'Who was included and why?', 'What are the limits of your methods?'], { min: 120, max: 200 }),
    section('sources', 'Sources & research notes', 'Research', 'Collect credible local, regional or international sources. Save the details and write notes in your own words.', ['Which source supports each question?', 'What point of view might this source have?', 'What information needs to be checked?'], null),
    section('findings', 'Presentation of findings', 'Analysis', 'Organize what your research found. Use labelled tables, charts or short summaries when they make patterns easier to see.', ['What are the clearest patterns?', 'Can a table or chart help?', 'Have you separated findings from your opinions?'], { min: 150, max: 250 }),
    section('discussion', 'Discussion & analysis', 'Analysis', 'Interpret the findings, compare them with your sources and explain what they suggest about the issue.', ['What do the results mean?', 'Do different sources agree?', 'What evidence supports your interpretation?'], { min: 200, max: 350 }),
    section('conclusion', 'Conclusion & recommendations', 'Writing', 'Answer your investigation questions and offer practical recommendations that follow from your evidence.', ['What is your main conclusion?', 'Which recommendation is realistic?', 'What evidence supports it?'], { min: 150, max: 250 }),
    section('bibliography', 'Bibliography & references', 'Finish up', 'List the sources used and check them against the citation style your teacher expects.', ['Have you credited all sources?', 'Are URLs and access dates recorded?', 'Are entries consistent?'], null),
    section('final-review', 'Final review', 'Finish up', 'Use the review list to check completeness, evidence, writing and presentation against your teacher’s rubric.', ['Are all objectives addressed?', 'Can a reader follow the investigation?', 'Have you checked the final format?'], null),
  ] },
  pob: { sections: [
    section('topic', 'Business & problem', 'Getting started', 'Introduce the business or business-related issue you are investigating and explain its relevance.', ['Which business or issue are you focusing on?', 'What problem or opportunity is visible?', 'Why is this a useful case to study?'], { min: 80, max: 150 }),
    section('objectives', 'Objectives', 'Getting started', 'Write measurable objectives that keep your project focused on business concepts and outcomes.', ['What will you examine?', 'What evidence will show you have examined it?', 'Are the objectives realistic?'], { min: 60, max: 120 }),
    section('plan', 'Plan of Investigation', 'Getting started', 'Describe the business issue, your information sources and the steps you will follow.', ['What do you need to learn?', 'How will you gather information?', 'How will you use business concepts?'], { min: 100, max: 180 }),
    section('methodology', 'Methodology & sources', 'Research', 'Record how you collected information and why the methods and sources are appropriate for this business investigation.', ['Will you use an interview, survey or document review?', 'How will you protect confidential details?', 'What are the limitations?'], { min: 120, max: 200 }),
    section('findings', 'Presentation of findings', 'Analysis', 'Present relevant evidence using clear headings, tables or charts. Label business data and explain where it came from.', ['Which findings answer your objectives?', 'Can you show data visually?', 'Are the units and labels clear?'], { min: 150, max: 250 }),
    section('analysis', 'Analysis & discussion', 'Analysis', 'Interpret the evidence with appropriate business ideas. Explain the implications rather than simply repeating the data.', ['What do the findings mean for the business?', 'Which concepts help explain them?', 'What alternative explanation is possible?'], { min: 200, max: 350 }),
    section('recommendations', 'Recommendations', 'Writing', 'Suggest achievable actions that respond directly to the findings. Explain expected benefits and any limitations.', ['What should the business do next?', 'Why is this recommendation realistic?', 'How would success be measured?'], { min: 120, max: 220 }),
    section('conclusion', 'Conclusion', 'Writing', 'Summarize what your investigation established and how the evidence answered your objectives.', ['What is the strongest answer?', 'Which evidence supports it?', 'What remains uncertain?'], { min: 100, max: 180 }),
    section('bibliography', 'Bibliography & appendices', 'Finish up', 'Credit all sources and place supporting questionnaires, interview material or documents in the appendices if required.', ['Are sources complete?', 'Are appendices labelled?', 'Have you removed private information?'], null),
    section('final-review', 'Final review', 'Finish up', 'Check every item in your teacher’s rubric, then review the project for clear business reasoning and presentation.', ['Do the findings match the objectives?', 'Can each recommendation be traced to evidence?', 'Is the file easy to navigate?'], null),
  ] },
  poa: { sections: [
    section('business-profile', 'Business profile & topic', 'Getting started', 'Introduce the business or accounting context and identify the accounting question or task in your teacher’s brief.', ['What business context are you using?', 'What accounting problem or task is central?', 'What period does your work cover?'], { min: 80, max: 150 }),
    section('objectives', 'Objectives & plan', 'Getting started', 'Set clear objectives and outline how you will gather, record and check the accounting information.', ['What records or statements will you prepare?', 'What information do you need?', 'How will you verify accuracy?'], { min: 100, max: 180 }),
    section('source-documents', 'Source documents', 'Accounting records', 'Collect or create the source documents required for the task. Label each document and keep dates and amounts consistent.', ['Which source documents are needed?', 'Are dates, names and amounts consistent?', 'Are confidential details protected?'], null),
    section('journals', 'Books of original entry', 'Accounting records', 'Prepare the appropriate books of original entry. Check the treatment of each transaction against class notes and instructions.', ['Which journal is appropriate?', 'Do debits and credits balance?', 'Can each entry be traced to a source document?'], null),
    section('ledger', 'Ledger accounts & trial balance', 'Accounting records', 'Post entries accurately and prepare the trial balance or other required accounting records.', ['Are postings complete?', 'Do balances agree with the journals?', 'Have you checked the arithmetic?'], null),
    section('statements', 'Financial statements', 'Accounting records', 'Prepare the statements required by your brief. Use consistent headings, dates, currency and accounting treatment.', ['Which statements are required?', 'Do totals reconcile?', 'Are adjustments documented?'], null),
    section('analysis', 'Analysis & interpretation', 'Writing', 'Explain what the records or statements show using appropriate accounting terms and evidence from your calculations.', ['What changed or stands out?', 'What does a ratio or total suggest?', 'What limitation should a reader know?'], { min: 180, max: 300 }),
    section('conclusion', 'Conclusion & recommendations', 'Writing', 'Summarize your main accounting findings and make recommendations that follow from the figures.', ['What is the main conclusion?', 'Which figure supports it?', 'What action would you recommend?'], { min: 120, max: 220 }),
    section('sources', 'Sources & notes', 'Research', 'Record any textbooks, class materials or external sources used to complete the project.', ['Which methods or formulas came from a source?', 'Have you noted the source details?', 'Are calculations your own?'], null),
    section('bibliography', 'References', 'Finish up', 'Credit materials and sources using the format your teacher requests.', ['Are all external sources included?', 'Are entries consistent?', 'Are appendices clearly labelled?'], null),
    section('final-review', 'Final review', 'Finish up', 'Check calculations, presentation and every item in the teacher’s brief before exporting.', ['Do all figures reconcile?', 'Are statements labelled and legible?', 'Have you matched the rubric?'], null),
  ] },
  hsb: { sections: [
    section('topic', 'Topic & rationale', 'Getting started', 'Choose a manageable human or social biology topic and explain why the question matters.', ['What health or biology issue interests you?', 'Who is affected?', 'Why is the question relevant?'], { min: 80, max: 150 }),
    section('questions', 'Aim & research questions', 'Getting started', 'State the aim and write questions that can be investigated safely and ethically.', ['What relationship or pattern will you explore?', 'Can your questions be answered with available evidence?', 'Are they respectful and unbiased?'], { min: 80, max: 150 }),
    section('plan', 'Plan of Investigation', 'Getting started', 'Outline your investigation, information sources, methods and expected sequence of work.', ['What evidence do you need?', 'Which method is suitable?', 'How will you handle sensitive information?'], { min: 100, max: 180 }),
    section('methodology', 'Methodology & ethics', 'Research', 'Describe participants or materials, your procedure and how you considered consent, privacy and safety.', ['Who or what was studied?', 'How was information collected?', 'What ethical safeguards were used?'], { min: 150, max: 250 }),
    section('sources', 'Research sources & notes', 'Research', 'Use trustworthy science and public-health sources. Record publication details and separate established facts from your own findings.', ['Is the source credible and current?', 'Which question does it answer?', 'Can another source confirm it?'], null),
    section('findings', 'Presentation of findings', 'Analysis', 'Summarize observations or research results clearly. Use a labelled table or graph only when it helps explain the data.', ['What did you observe?', 'Are units and labels clear?', 'Have you avoided unsupported conclusions?'], { min: 150, max: 250 }),
    section('discussion', 'Discussion', 'Analysis', 'Explain findings using biological concepts and compare them with reliable sources. Note limitations and unexpected results.', ['How can biology explain the pattern?', 'How do findings compare with published information?', 'What limited your investigation?'], { min: 200, max: 350 }),
    section('conclusion', 'Conclusion & recommendations', 'Writing', 'Answer your aim using the evidence. Make practical, evidence-based recommendations where appropriate.', ['What does the evidence support?', 'What should readers do or consider?', 'What further question could be studied?'], { min: 120, max: 220 }),
    section('bibliography', 'Bibliography & appendices', 'Finish up', 'List sources and attach relevant materials such as an approved questionnaire or results table.', ['Are all sources acknowledged?', 'Is sensitive information anonymized?', 'Are appendices labelled?'], null),
    section('final-review', 'Final review', 'Finish up', 'Review accuracy, ethics, evidence and the exact CXC or teacher requirements before submission.', ['Are claims supported?', 'Have you checked terminology?', 'Does the final project follow the brief?'], null),
  ] },
  it: { sections: [
    section('problem', 'Problem definition', 'Getting started', 'Describe the user or organization, the problem to solve and why an IT solution is appropriate.', ['Who is the intended user?', 'What problem do they face?', 'What would a successful solution do?'], { min: 100, max: 180 }),
    section('objectives', 'Objectives & requirements', 'Getting started', 'Turn the problem into clear requirements. Separate essential functions from nice-to-have features.', ['What must the solution do?', 'How will you test each requirement?', 'What are the constraints?'], { min: 100, max: 180 }),
    section('research', 'Research & investigation', 'Research', 'Compare tools, existing approaches or user needs. Keep source notes and explain how research influenced your design.', ['What alternatives did you consider?', 'Which users or sources informed you?', 'What did you learn from the comparison?'], { min: 150, max: 250 }),
    section('design', 'Design & planning', 'Design', 'Plan the solution with suitable diagrams, algorithms, data structures or interface sketches before implementation.', ['What are the main components?', 'How will information move through the system?', 'What design decision needs explaining?'], { min: 150, max: 250 }),
    section('development', 'Development & evidence', 'Build', 'Document important implementation steps and include your own screenshots, code extracts or system evidence where your brief asks.', ['Which part did you build?', 'What challenge did you solve?', 'Can your evidence show the result?'], { min: 200, max: 350 }),
    section('testing', 'Testing', 'Build', 'Test each requirement, record expected and actual results, and note what changed after testing.', ['What test cases cover the requirements?', 'What failed and why?', 'What did you change?'], { min: 150, max: 250 }),
    section('user-guide', 'User guide', 'Build', 'Explain how an intended user can operate the solution. Use clear steps and your own labelled screenshots if useful.', ['What does the user need before starting?', 'What are the steps?', 'How can common errors be handled?'], { min: 150, max: 250 }),
    section('evaluation', 'Evaluation & conclusion', 'Writing', 'Evaluate the solution against its original requirements and identify practical improvements or future work.', ['Which requirements were met?', 'What evidence supports that judgement?', 'What would you improve next?'], { min: 180, max: 300 }),
    section('bibliography', 'References & appendices', 'Finish up', 'Credit any tutorials, assets, code or research you used, following your teacher’s citation rules.', ['Have you credited reused material?', 'Are screenshots yours or labelled?', 'Are appendices easy to find?'], null),
    section('final-review', 'Final review', 'Finish up', 'Check that evidence, testing and the submitted files match your teacher’s exact IT project brief.', ['Can another person use the solution?', 'Are files named clearly?', 'Does the final review match the rubric?'], null),
  ] },
  'technical-drawing': { sections: [
    section('brief', 'Design brief & requirements', 'Getting started', 'Describe the design challenge, intended user and constraints. List the dimensions or standards from your teacher’s brief.', ['Who is the design for?', 'What must it do?', 'What constraints must be respected?'], { min: 80, max: 150 }),
    section('research', 'Research & precedents', 'Research', 'Look at relevant objects, materials or designs. Record sources and explain which ideas influenced your decisions.', ['What examples did you study?', 'What works well in them?', 'Which features will you adapt, not copy?'], { min: 100, max: 180 }),
    section('concepts', 'Ideas & sketches', 'Design development', 'Show alternative concepts and annotate your own sketches so a reader can follow the design decisions.', ['What alternatives did you consider?', 'Why did you choose this idea?', 'Are sketches labelled clearly?'], null),
    section('development', 'Design development', 'Design development', 'Show how the selected concept was refined, including dimensions, construction choices and relevant technical details.', ['What changed during development?', 'Are dimensions suitable?', 'Which conventions did you apply?'], null),
    section('drawings', 'Final working drawings', 'Design development', 'Prepare the required views, sections or details with clear line work, scale, dimensions and title information.', ['Are all views needed?', 'Are dimensions complete?', 'Can the drawing be read at print size?'], null),
    section('model', 'Final model / solution', 'Presentation', 'Present the final outcome with clear evidence. Explain materials, finish and how the design responds to the brief.', ['Does the outcome meet the design need?', 'What evidence shows the details?', 'Are materials identified?'], { min: 100, max: 180 }),
    section('evaluation', 'Evaluation & reflection', 'Presentation', 'Evaluate your final outcome against the original requirements and reflect on what you would improve.', ['Which requirements were met?', 'What would you refine?', 'What did you learn from the process?'], { min: 150, max: 250 }),
    section('bibliography', 'References & appendices', 'Finish up', 'Credit inspiration images, research and any external technical guidance. Attach supporting work if required.', ['Have you credited every image?', 'Are the drawings labelled?', 'Are appendices in order?'], null),
    section('final-review', 'Final review', 'Finish up', 'Check presentation, drawing standards and the teacher’s assessment requirements before printing or exporting.', ['Are sheets legible and consistently formatted?', 'Are all views included?', 'Does your submission match the brief?'], null),
  ] },
  other: { sections: [
    section('topic', 'Topic & focus', 'Getting started', 'Write the topic and scope from your teacher’s brief. Keep this project’s focus specific and manageable.', ['What topic did your teacher approve?', 'What is inside or outside the scope?', 'Why does it interest you?'], { min: 80, max: 150 }),
    section('objectives', 'Objectives & questions', 'Getting started', 'Turn the brief into clear objectives and questions that your evidence can answer.', ['What do you need to find out or create?', 'How will you know when it is complete?', 'What evidence will you use?'], { min: 80, max: 150 }),
    section('plan', 'Plan of Investigation', 'Getting started', 'Describe the steps, resources and timing you will use to meet your objectives.', ['What will you do first?', 'Which sources or materials do you need?', 'What is your timeline?'], { min: 100, max: 180 }),
    section('research', 'Research & evidence', 'Research', 'Save reliable sources, class materials or original evidence. Add notes in your own words and connect each item to a question.', ['Which evidence is most relevant?', 'Where did it come from?', 'How can you verify it?'], { min: 150, max: 250 }),
    section('analysis', 'Analysis / development', 'Build', 'Work through the main subject-specific task. Explain your decisions and show evidence of your own process.', ['What did you do or discover?', 'Which decision needs explaining?', 'What evidence should be included?'], { min: 200, max: 350 }),
    section('findings', 'Findings / final work', 'Build', 'Present your results or completed work in the format requested by your teacher. Label supporting items clearly.', ['What is the main result?', 'Can a reader follow your work?', 'What should be labelled?'], { min: 150, max: 250 }),
    section('reflection', 'Reflection & conclusion', 'Writing', 'Reflect on what you learned, what your evidence shows and what you would improve next time.', ['What did you learn?', 'What challenge did you overcome?', 'What would you do differently?'], { min: 120, max: 220 }),
    section('bibliography', 'Bibliography & references', 'Finish up', 'Credit every source, image, interview or material used, following your teacher’s instructions.', ['Have you recorded source details?', 'Are all borrowed ideas acknowledged?', 'Is the format consistent?'], null),
    section('final-review', 'Final review', 'Finish up', 'Compare your work with the subject brief and teacher’s rubric before exporting.', ['Are all required parts present?', 'Is evidence easy to check?', 'Have you reviewed formatting?'], null),
  ] },
};

export function getTemplate(subjectId) {
  return templates[subjectId] || templates.other;
}

export function getSubject(subjectId) {
  return SUBJECTS.find((subject) => subject.id === subjectId) || SUBJECTS[SUBJECTS.length - 1];
}

export function createDemoProject() {
  const sections = EnglishSections.map((item) => ({ ...item, prompts: [...item.prompts] }));
  const demoText = {
    topic: 'How social media shapes the way teenagers communicate with friends and family.',
    plan: 'I chose this topic because social media is part of daily life for many teenagers in my community. I want to explore how it affects face-to-face conversations and the way young people keep in touch. I will compare information from articles with responses from a short survey and one interview. I will focus on communication habits rather than assuming social media is all good or all bad.',
    questions: '1. How do teenagers in my class use social media to stay connected?\n2. What do they see as the main benefits and challenges?\n3. Has online communication changed how often they talk face to face?',
    'research-plan': 'I will start by reading two reliable articles about youth communication. I will then ask classmates to complete a short anonymous survey and interview one adult about changes they have noticed. I will compare the responses with the articles and record where each idea came from.',
  };
  sections.forEach((item) => {
    if (demoText[item.id]) {
      item.content = demoText[item.id];
      item.completed = ['topic', 'plan'].includes(item.id);
    }
  });
  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 12);
  return {
    id: 'demo-english-sba',
    subjectId: 'english',
    topic: 'How social media shapes teen communication',
    level: 'Form 4',
    deadline: due.toISOString().slice(0, 10),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    sections,
    voice: { level: 'normal', opinion: 'I think social media makes it easier to stay in touch, but it can also distract us from conversations happening right in front of us.', experience: '', findings: '' },
    sources: [
      { id: 'demo-source-1', author: 'UNICEF', title: 'Children in a Digital World', site: 'UNICEF Office of Research', url: 'https://www.unicef-irc.org/', published: '2024', accessed: now.toISOString().slice(0, 10), sectionId: 'research-plan', notes: 'Starting point for thinking about how young people use digital spaces. Verify the specific pages and facts you plan to use.' },
    ],
    researchNotes: [
      { id: 'demo-note-1', text: 'My class group chat is useful for sharing reminders, but sometimes messages are easy to miss when lots arrive at once.', sectionId: 'report', createdAt: now.toISOString() },
    ],
    attachments: [],
    chat: [],
    demo: true,
  };
}

export function createProject({ subjectId, topic, level, deadline, selectedSections }) {
  const selected = new Set(selectedSections);
  let sections = getTemplate(subjectId).sections
    .filter((item) => selected.has(item.id) || item.id === 'final-review')
    .map((item) => ({ ...item, prompts: [...item.prompts], completed: false, content: '' }));
  const topicSection = sections.find((item) => item.id === 'topic' || item.id === 'brief' || item.id === 'problem' || item.id === 'business-profile');
  if (topicSection && topic.trim()) {
    topicSection.content = topic.trim();
    topicSection.completed = true;
  }
  const now = new Date().toISOString();
  return {
    id: globalThis.crypto?.randomUUID?.() || `sba-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subjectId,
    topic: topic.trim(),
    level: level.trim() || 'Not set',
    deadline: deadline || '',
    createdAt: now,
    updatedAt: now,
    sections,
    voice: { level: 'normal', opinion: '', experience: '', findings: '' },
    sources: [],
    researchNotes: [],
    attachments: [],
    chat: [],
    demo: false,
  };
}
