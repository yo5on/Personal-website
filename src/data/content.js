export const github = 'https://github.com/yo5on'
export const email = 'yo5on2025@gmail.com'
export const linkedin = 'https://www.linkedin.com/in/yo5on'

// Project copy comes from the existing portfolio and each repository's README;
// images are the ones published in those READMEs. Nothing here is embellished.
const rawProjects = [
  {
    id: 'line', verb: 'fabricate', title: 'Line Follower', type: 'Robotics & Control Systems',
    intro: 'An ESP32 robot that follows a line using eight infrared sensors and PID steering, built for fast, smooth tracking through curves and sharp turns.',
    detail: 'High-speed PID Line Follower Robot using ESP32, TB6612FNG, and an 8-array IR sensor.',
    stack: ['ESP32', 'PID control', 'TB6612FNG', '8-array IR sensor'], plate: 'track', caption: 'On the line',
    note: 'eight IR sensors',
    image: { src: 'images/work/line-follower.webp', alt: 'The line follower robot on a black track line, its IR sensor array at the front', w: 1200, h: 839 },
    repo: 'https://github.com/yo5on/line-follower',
  },
  {
    id: 'fakeguard', verb: 'think', title: 'FakeGuard', type: 'Full-stack Development',
    intro: 'A social-media account risk analyzer: explainable 0\u2060–\u2060100 risk scores that help human reviewers prioritise their work.',
    detail: 'A full-stack prototype that analyzes synthetic social-media account data, scores risk from 0 to 100 across four categories, and explains each score feature by feature with reason codes. It is a decision-support tool built on synthetic data — it does not access real platforms or replace human review.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript'], caption: 'Analyzer — a HIGH result',
    note: 'a synthetic account',
    image: { src: 'images/work/fakeguard.webp', alt: 'FakeGuard analyzer scoring a synthetic account at 71 out of 100, HIGH risk, with manual review recommended and the start of its per-feature breakdown', w: 950, h: 664 },
    repo: 'https://github.com/yo5on/fakeguard',
  },
  {
    id: 'daymark', verb: 'innovate', title: 'Daymark', type: 'Product Design & Development',
    intro: 'A personalised study planner that adapts each day around time, priorities, exam proximity and how sessions actually went.',
    detail: 'Daymark is designed to feel less like a static timetable and more like a study companion that responds to what actually happens during the day: quick changes reshape a plan, completed sessions feed confidence and outcomes back into planning, and Insights surfaces patterns from real study records.',
    stack: ['React', 'TypeScript', 'Vite', 'Product design'], plate: 'dial', caption: 'Dashboard — Make today count',
    image: { src: 'images/work/daymark.webp', alt: 'Daymark home screen: the “Make today count.” header above the next study session, Eigenvalues & eigenvectors', w: 900, h: 629 },
    repo: 'https://github.com/yo5on/Personalised-study-planner',
  },
  {
    id: 'arm', verb: 'fabricate', title: 'Robotic Arm', type: 'Embedded Robotics',
    intro: 'An ESP32-based 4-DOF robotic arm controlled wirelessly with an RC transmitter and servo motors.',
    detail: 'An ESP32-based 4-DOF robotic arm controlled wirelessly using an RC transmitter and receiver. The project demonstrates embedded control, servo motor manipulation, wireless communication, and coordinated robotic movement for pick-and-place applications.',
    stack: ['ESP32', 'Servo control', 'RC transmitter', '4-DOF'], plate: 'arm', caption: 'Pick and place',
    image: { src: 'images/work/robotic-arm.webp', alt: 'The yellow 4-DOF robotic arm lit from above against a dark background', w: 1280, h: 960 },
    repo: 'https://github.com/yo5on/Robotic-arm',
  },
  {
    id: 'maze', verb: 'innovate', title: 'Maze Runner', type: 'Game Development',
    intro: 'A 2D side-scrolling platformer built with Unity — three levels, combat, enemies, checkpoints and level goals.',
    detail: 'Maze Runner is a 2D side-scrolling platform game built with Unity: three gameplay levels, menu and customization scenes, player movement and combat systems, enemies, checkpoints, level goals, and supporting UI and audio. It is an active college project prototype.',
    stack: ['Unity', 'C#', '2D platformer', 'Game development'], caption: 'Level 1, mid-jump',
    // A frame of the Level 1 recording (86 s), cropped to the game view; pixels unchanged.
    image: { src: 'images/work/maze-runner.webp', alt: 'Maze Runner Level 1: the hooded player character mid-jump above a large green goblin standing on a platform', w: 1015, h: 710 },
    repo: 'https://github.com/yo5on/maze-runner',
    // Preview page with Play Now; the game itself runs at https://yo5on.github.io/maze-runner/.
    play: 'https://yo5on.github.io/maze-runner/preview/',
  },
  {
    id: 'sparky', verb: 'fabricate', title: 'Sparky', type: 'Embedded Interaction',
    intro: 'A tiny animated companion on a 128×64 OLED, with moods, button reactions and smooth morphs between expressions.',
    detail: 'Sparky lives on a 128×64 OLED. It has moods, reacts to two buttons, drifts between expressions with smooth morphs, falls asleep when left alone, and wakes up on its own.',
    stack: ['ESP32', 'SSD1306', 'Arduino', 'Embedded animation'], caption: 'Sparky, smiling',
    image: { src: 'images/work/mochi.webp', still: 'images/work/mochi-still.webp', alt: 'Sparky’s pixel face on the OLED, smiling and changing expression', w: 256, h: 128, oled: true },
    note: 'pixels from the firmware',
    repo: 'https://github.com/yo5on/oled-project',
  },
  // From the Aboutme site and each repository's README.
  {
    id: 'pest', verb: 'think', title: 'Pest Monitoring', type: 'Agentic AI · Team project',
    intro: 'An agentic AI framework for agriculture: field data flows through AI / ML analysis to recommendations and a monitoring dashboard.',
    detail: 'Agentic AI-Based Pest Monitoring Framework for Sustainable Agricultural Productivity and Resource Optimization: an academic team project that aims to spot pest problems before visible damage spreads and to spend inputs only where they are needed. Field data moves through data collection, AI / ML analysis and an agentic decision-and-recommendation step to a web dashboard. Real-time IoT sensors, image-based pest detection and weather data are listed as future work.',
    stack: ['Python', 'AI / ML', 'Agentic workflow', 'Web dashboard'], plate: 'flow', caption: 'Field data → decision',
    repo: 'https://github.com/yo5on/Agentic-AI-Pest-Monitoring',
  },
  {
    id: 'tutor', verb: 'think', title: 'AI Personal Tutor', type: 'LLM Application',
    intro: 'A study workspace that teaches concepts step by step from your own material, generates quizzes and tracks weak topics.',
    detail: 'The tutor explains from the basics with examples and analogies, checks understanding and gives hints before answers. Uploaded PDF or TXT notes become the source for tutoring and multiple-choice quizzes, which are checked on the server; progress tracks accuracy, weak topics and missed questions. The Gemini key is read only in server code: the browser talks to the app’s own API routes.',
    stack: ['Next.js', 'TypeScript', 'Gemini API', 'SQLite'], caption: 'Dashboard',
    image: { src: 'images/work/ai-tutor.webp', alt: 'AI Personal Tutor dashboard: the Personal Tutor sidebar, a Continue learning panel with Start a study session, Quick start links and progress counters', w: 1200, h: 605 },
    repo: 'https://github.com/yo5on/ai-personal-tutor',
    live: 'https://ai-personal-tutor-cjjn.onrender.com',
  },
  {
    id: 'gesture', verb: 'fabricate', title: 'Gesture RC Car', type: 'Wireless Embedded Control',
    intro: 'Drive a car by tilting your hand: an MPU6050 on one ESP32 sends commands over ESP-NOW to a second ESP32 driving the motors.',
    detail: 'Two ESP32 boards: the transmitter reads an MPU6050 accelerometer and maps tilt to forward, backward, left, right or stop, then sends the command over ESP-NOW to the receiver, which drives two DC motors. A configurable dead zone means a resting hand stops the car; it also has pivot turns, adjustable motor speed and serial output for tuning.',
    stack: ['ESP32 × 2', 'MPU6050', 'ESP-NOW', 'Motor driver'], caption: 'Tilt to drive',
    image: { src: 'images/work/gesture-car.webp', alt: 'The gesture-controlled RC car on a tiled floor: a black chassis with a battery holder, a red motor-driver board and white-hubbed wheels', w: 1200, h: 675 },
    repo: 'https://github.com/yo5on/Gesture-control-rc-car',
  },
]

// The three verbs that organise the work and the Maker chapter.
export const verbs = [
  { id: 'think', label: 'Think', line: 'AI / ML, data-driven software and intelligent applications.' },
  { id: 'innovate', label: 'Innovate', line: 'Web applications, interactive experiences and games.' },
  { id: 'fabricate', label: 'Fabricate', line: 'Robotics, embedded systems, microcontrollers and sensors.' },
]
// Grouped by verb (stable within a verb) and numbered in that order.
const verbOrder = verbs.map(v => v.id)
export const projects = rawProjects
  .sort((a, b) => verbOrder.indexOf(a.verb) - verbOrder.indexOf(b.verb))
  .map((p, i) => ({ ...p, n: String(i + 1).padStart(2, '0') }))

// Full case studies (Brief → What I built → How it works → Stack → Status → Gallery → Links), keyed by
// project id. Checked against each repository's code: neither FakeGuard nor Daymark uses a trained model
// or an LLM, so no AI/ML claims are made for them. Projects without an entry keep the short project view.
const gallery = 'images/work/gallery'
export const studies = {
  line: {
    brief: 'An ESP32 robot that follows a line using eight infrared sensors and PID steering, built for fast, smooth tracking through curves and sharp turns.',
    built: 'I designed the chassis layout, assembled and wired the robot, and wrote and tuned the firmware.',
    how: [
      'Before a run, a calibration button starts a five-second sweep that records each sensor’s range; the status LED blinks while it runs.',
      'While running, the ESP32 reads the eight sensors on a Smart Elex RLS08 board through an 8-channel analog multiplexer and turns their readings into a single line position, so the robot knows how far off centre it is. A PID controller turns that error into a steering correction, speeding up one motor and slowing the other through a TB6612FNG driver.',
      'The firmware detects black or white lines automatically, and if the line disappears, the robot turns towards the side where it last saw it.',
    ],
    stack: ['ESP32 NodeMCU', 'C++ (Arduino)', 'PID_v1 library', 'Smart Elex RLS08 8-sensor IR board', '8-channel analog multiplexer', 'TB6612FNG motor driver', 'N20 gear motors', '2 × 3.7 V Li-ion cells', 'MP1584 and HW133A buck converters'],
    status: ['Built and tested on track.'],
    gallery: [
      { src: `${gallery}/line-follower-1.webp`, w: 720, h: 1280, alt: 'The line-follower robot on a black-line test track.', caption: 'On the track' },
      { src: `${gallery}/line-follower-2.webp`, w: 720, h: 1280, alt: 'Top view of the line-follower robot held in hand, showing the ESP32, motor driver and sensor board.', caption: 'Top view' },
      { src: `${gallery}/line-follower-3.webp`, w: 720, h: 1280, alt: 'Hand-drawn chassis layout on graph paper, with dimensions and the motor and battery positions marked.', caption: 'Chassis layout' },
      { src: `${gallery}/line-follower-4.webp`, w: 1015, h: 1600, alt: 'Wiring diagram linking the sensor board, multiplexer, ESP32, motor driver, motors and power converters.', caption: 'Wiring diagram. Its pin numbers differ from the current firmware; code.ino is the reference.' },
    ],
    links: [{ label: 'Repository', href: 'https://github.com/yo5on/line-follower' }],
  },
  fakeguard: {
    brief: 'A team hackathon project for Tech Utsav: a decision-support prototype that gives synthetic social-media accounts an explainable 0⁠–⁠100 risk score, so human reviewers know where to look first. It never touches real platforms and never makes the final call.',
    built: 'I was the team’s full-stack developer, working across the FastAPI scoring API and the React and TypeScript interface that presents it: the analyzer, dashboard, account views and methodology page.',
    how: [
      'Each account is measured on five signals: account age, follower-to-following ratio, posting frequency, profile completeness and engagement. Fixed thresholds map each signal to a risk value, and the values are weighted 20/25/20/15/20 into a single score. If a signal can’t be calculated, such as engagement for an account with no followers, it is marked unavailable and the remaining weights are rescaled, so missing data doesn’t inflate the score.',
      'The score falls into LOW, MEDIUM, HIGH or CRITICAL, each with a recommended action, and reason codes R01–R05 explain what drove the result. The repository includes a generated dataset of 1,006 synthetic accounts across eight archetypes, from typical users to bot-like patterns and edge cases.',
      'The scoring is a transparent rule-based method, not a trained model. Machine-learning approaches, such as Isolation Forest anomaly detection and behavioural clustering, are listed as future work and are not implemented.',
    ],
    stack: ['Python', 'FastAPI', 'SQLAlchemy', 'SQLite', 'Pandas', 'React', 'TypeScript', 'Vite', 'Recharts', 'Vercel (frontend)', 'Render (API)'],
    status: ['Hackathon prototype, using synthetic data only. The live demo’s analyzer works end to end.'],
    gallery: [
      { src: `${gallery}/fakeguard-1.webp`, w: 1400, h: 2159, alt: 'FakeGuard analyzer scoring a synthetic 12-day-old account at 71, HIGH, with a per-feature risk breakdown and reason codes.', caption: 'Analyzer: a HIGH result' },
      { src: `${gallery}/fakeguard-2.webp`, w: 1400, h: 1533, alt: 'A synthetic established account scored 1, LOW, with no immediate action recommended.', caption: 'Analyzer: a LOW result' },
      { src: `${gallery}/fakeguard-3.webp`, w: 1400, h: 2379, alt: 'Methodology page listing feature weights, thresholds, risk categories and reason codes.', caption: 'Scoring methodology' },
    ],
    links: [
      { label: 'Live demo', href: 'https://fakeguard-alpha.vercel.app', note: 'The first request may take about a minute while the backend wakes up.' },
      { label: 'Repository', href: 'https://github.com/yo5on/fakeguard' },
    ],
  },
  daymark: {
    brief: 'A study planner that adjusts the day around what actually happens: less time than expected, an exam tomorrow, low energy, a missed session.',
    built: 'I designed and built Daymark: the product design, the interface and the planning logic.',
    how: [
      'You type a change in plain words, such as “I only have 90 minutes” or “my maths exam is tomorrow”. Quick Change uses keyword and pattern matching to recognise time limits, exams, focus requests, finished topics, tiredness and missed sessions, then proposes a revised plan with a reason for each change, which you can accept or decline.',
      'After each session you rate your confidence from 1 to 5; a low rating moves that topic up and shortens its next session. Exam readiness is classed as Needs attention, Review recommended or On track from mastery, confidence and days left, and Insights are generated from your stored session records.',
      'All of the planning logic is deterministic and runs in the browser, with data kept in browser-local storage. There is no AI model or external service.',
    ],
    stack: ['React 18', 'TypeScript', 'Vite', 'Recharts', 'Lucide React', 'Browser localStorage', 'Vercel'],
    status: [
      'Working prototype under active development; the live demo needs no backend.',
      'Limitations: Quick Change only understands phrasings it has rules for; some subject shortcuts (“AI”, “math”, “SQL”) are hard-coded for the sample subjects; and data stays in one browser, with no accounts or syncing between devices.',
    ],
    gallery: [
      { src: `${gallery}/daymark-1.webp`, w: 1897, h: 956, alt: 'Daymark home screen showing the next study session, today’s agenda and planned study time.', caption: 'Home' },
      { src: `${gallery}/daymark-2.webp`, w: 1897, h: 956, alt: 'Weekly plan view with timed sessions and upcoming exams with readiness labels.', caption: 'Weekly plan' },
      { src: `${gallery}/daymark-3.webp`, w: 1897, h: 946, alt: 'Subjects page showing mastery per subject and upcoming exams.', caption: 'Subjects' },
      { src: `${gallery}/daymark-4.webp`, w: 1897, h: 956, alt: 'Progress page charting study time, consistency and subject performance.', caption: 'Progress' },
      { src: `${gallery}/daymark-5.webp`, w: 1897, h: 956, alt: 'Revision page listing spaced-review topics by confidence.', caption: 'Revision' },
    ],
    links: [
      { label: 'Live demo', href: 'https://personalised-study-planner.vercel.app' },
      { label: 'Repository', href: 'https://github.com/yo5on/Personalised-study-planner' },
    ],
  },
}

// Fig. 02 — The Maker: About + Practice + résumé, one node per camera stop (src/maker/focusPoints.ts).
// Merged from the Portfolio's About/Practice and the Aboutme résumé; facts from the project READMEs.
export const maker = {
  intro: 'I’m Yoson, a Computer Science student at Christ University, Bengaluru, specialising in AI & machine learning. I build where software meets hardware: explainable data tools and agentic AI, web apps and a browser game, and ESP32 robots that track lines and pick things up.',
  nodes: [
    { kicker: 'Education', title: 'Christ University', sub: 'B.Tech, Computer Science and Engineering (AI & ML) — Bengaluru',
      points: ['Languages and boards: C · C++ · Java · Python · HTML / CSS · ESP32 · Arduino'] },
    { kicker: 'Think', verb: 'think', title: 'Data-driven, explainable tools',
      points: [
        'FakeGuard — full-stack developer on a Tech Utsav hackathon team: a rule-based, explainable 0–100 risk score with reason codes, on synthetic data',
        'Agentic AI pest monitoring — academic team project: field data → AI / ML analysis → recommendations',
        'AI Personal Tutor — Next.js and Gemini: tutoring and quizzes from your own notes',
      ], work: ['fakeguard', 'pest', 'tutor'] },
    { kicker: 'Innovate', verb: 'innovate', title: 'Software people actually use',
      points: [
        'Daymark — a study planner that re-plans the day around time, exams and how sessions went; deterministic, runs in the browser',
        'Maze Runner — a Unity 2D platformer with three levels, enemies and checkpoints, playable in the browser',
      ], work: ['daymark', 'maze'] },
    { kicker: 'Fabricate', verb: 'fabricate', title: 'ESP32 builds',
      points: [
        'High-speed PID line follower — 8-array IR sensor, TB6612FNG driver',
        '4-DOF robotic arm driven wirelessly from an RC transmitter',
        'Gesture-controlled RC car — MPU6050 tilt sent over ESP-NOW',
        'Sparky — an OLED companion with moods and a sleep cycle',
      ], work: ['line', 'arm', 'gesture', 'sparky'] },
    { kicker: 'Say hi', title: 'Let’s build something.', sub: 'GitHub · LinkedIn · email', contact: true },
  ],
}

// Certificates, as printed on each certificate (title, issuer, date). Files are copies of the owner's
// Certificates repository (github.com/yo5on/Certificates) with document metadata removed; the IIT Madras copy keeps
// only the certificate image from the original browser printout (not its print header and footer). Udemy links to its
// own verification page (printed on the certificate) because the PDF also shows a student number; its preview is
// the real certificate with only that number covered. Previews: public/certificates/previews.
const cert = 'certificates'
export const certificates = [
  { group: 'Courses & certifications', items: [
    { title: 'Azure AI Fundamentals', issuer: 'Microsoft · via Certiport', date: '2026-09-29', when: 'Sep 2026', file: `${cert}/microsoft-azure-ai-fundamentals.pdf` },
    { title: 'Computer Fundamentals 101', issuer: 'Infosys', date: '2026-09-09', when: 'Sep 2026', file: `${cert}/infosys-computer-fundamentals-101.pdf` },
    { title: 'Introduction to Modern AI', issuer: 'Cisco Networking Academy · CHRIST University', date: '2026-09-08', when: 'Sep 2026', file: `${cert}/cisco-introduction-to-modern-ai.pdf` },
    { title: 'Introduction to Artificial Intelligence', issuer: 'Infosys', date: '2026-07-05', when: 'Jul 2026', file: `${cert}/infosys-introduction-to-artificial-intelligence.pdf` },
    { title: 'Design Thinking', issuer: 'Infosys', date: '2026-06-24', when: 'Jun 2026', file: `${cert}/infosys-design-thinking.pdf` },
    { title: 'Fundamentals of Responsible AI', issuer: 'Infosys', date: '2026-06-24', when: 'Jun 2026', file: `${cert}/infosys-fundamentals-of-responsible-ai.pdf` },
    { title: 'Software Engineering and Agile Software Development', issuer: 'Infosys', date: '2026-06-24', when: 'Jun 2026', file: `${cert}/infosys-software-engineering-and-agile.pdf` },
    { title: 'Programming Fundamentals using Python — Part 1', issuer: 'Infosys', date: '2026-05-17', when: 'May 2026', file: `${cert}/infosys-programming-fundamentals-python-part-1.pdf` },
    { title: 'Programming Fundamentals using Python — Part 2', issuer: 'Infosys', date: '2026-05-17', when: 'May 2026', file: `${cert}/infosys-programming-fundamentals-python-part-2.pdf` },
    { title: 'Introduction to Data Science and AI', issuer: 'IIT Madras · Centre for Outreach and Digital Education', date: '2025-04', when: 'Apr 2025 batch', file: `${cert}/iit-madras-introduction-to-data-science-and-ai.pdf` },
    { title: 'Extended Realities: AR and VR', issuer: 'Udemy', verify: 'https://ude.my/UC-514fa73f-ac13-4b5b-abcc-5d78c5656bb0', verifyHost: 'udemy.com', preview: 'udemy-extended-realities-ar-and-vr' },
  ] },
  { group: 'Hackathons', items: [
    { title: 'InHack Hackathon, Media Meet 2026', issuer: 'Department of Media Studies, CHRIST University', note: 'Participation', date: '2026-08-18', when: 'Aug 2026', file: `${cert}/inhack-hackathon-media-meet-2026.pdf` },
    { title: 'Adobe University Hackathon', issuer: 'Adobe · via Unstop', note: 'Participation', date: '2026-08-09', when: 'Aug 2026', file: `${cert}/adobe-university-hackathon.pdf` },
  ] },
]

// Hackathon ledger beside the certificates. Tech Utsav has no certificate file; it links to the FakeGuard study.
export const hackathons = [
  { title: 'Tech Utsav', what: 'FakeGuard — team project, full-stack developer', work: 'fakeguard' },
  ...certificates.find(g => g.group === 'Hackathons').items.map(c => ({ title: c.title, what: c.note, when: c.when, file: c.file })),
]
