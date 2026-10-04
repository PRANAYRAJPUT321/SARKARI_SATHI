import type { Subject, SubjectId, Topic } from "./types";

export const SUBJECTS: Subject[] = [
  {
    id: "quant",
    name: "Quantitative Aptitude",
    short: "Quants",
    color: "#2a78d6",
    icon: "Calculator",
    description: "Arithmetic, number system, DI, algebra, geometry & mensuration.",
  },
  {
    id: "reasoning",
    name: "Logical Reasoning",
    short: "Reasoning",
    color: "#eb6834",
    icon: "Brain",
    description: "Puzzles, seating, syllogism, coding-decoding, series & more.",
  },
  {
    id: "english",
    name: "English Language",
    short: "English",
    color: "#1baf7a",
    icon: "BookOpen",
    description: "Grammar, vocabulary, comprehension, cloze & para-jumbles.",
  },
  {
    id: "gk",
    name: "General Awareness",
    short: "GK / GA",
    color: "#eda100",
    icon: "Globe",
    description: "Static GK, banking awareness, polity, history, geography & science.",
  },
];

export const subjectById = (id: SubjectId) => SUBJECTS.find((s) => s.id === id)!;

export const TOPICS: Topic[] = [
  // ───────────────────────────── QUANTS ─────────────────────────────
  {
    id: "q-simplification", subject: "quant", name: "Simplification & BODMAS", weight: 5, families: "all", asked: "5-10 Qs (banking prelims)",
    concept: "Evaluate expressions using BODMAS: Brackets → Orders (powers/roots) → Division/Multiplication (left to right) → Addition/Subtraction (left to right).",
    formulas: ["(a+b)² = a² + 2ab + b²", "(a−b)² = a² − 2ab + b²", "a² − b² = (a+b)(a−b)", "Squares 1–30 and cubes 1–20 by heart"],
    tricks: ["Learn squares up to 30, cubes up to 20, and fractions ↔ percentages (1/8 = 12.5%).", "Use unit-digit check to eliminate options before full calculation.", "Multiply by 5 = multiply by 10 then halve; ×25 = ×100 ÷ 4."],
  },
  {
    id: "q-approximation", subject: "quant", name: "Approximation", weight: 3, families: ["bank", "insurance", "regulator"], asked: "3-5 Qs",
    concept: "Round each number to the nearest convenient value, then calculate. Options are usually far apart, so a close estimate is enough.",
    tricks: ["Round 24.98% → 25% (=1/4), 49.9 → 50, 1199.8 → 1200.", "Round one number up and another down to cancel the error in products.", "Square roots: √(1023) ≈ 32 (since 32² = 1024)."],
  },
  {
    id: "q-number-series", subject: "quant", name: "Number Series (Missing / Wrong)", weight: 4, families: "all", asked: "5 Qs (banking)",
    concept: "Find the pattern: differences, ratios, squares/cubes, alternate series or mixed operations (×2+1 etc.).",
    tricks: ["Check first differences, then second differences.", "If numbers grow fast → multiplication/powers; slowly → addition.", "For alternating patterns, split odd and even positions."],
  },
  {
    id: "q-quadratic", subject: "quant", name: "Quadratic Equations (x vs y)", weight: 3, families: ["bank", "insurance", "regulator"], asked: "5 Qs",
    concept: "Solve both equations and compare roots of x and y to decide x > y, x < y, x ≥ y, x ≤ y or no relation.",
    formulas: ["ax² + bx + c = 0 → roots = (−b ± √(b²−4ac)) / 2a", "Sum of roots = −b/a, product = c/a"],
    tricks: ["Sign rule: if equation is x² + bx + c (b,c > 0) both roots are negative; x² − bx + c → both positive.", "Factorise by splitting the middle term instead of the formula.", "Compare every root of x with every root of y; mixed results → no relation."],
  },
  {
    id: "q-number-system", subject: "quant", name: "Number System, HCF & LCM", weight: 4, families: "all", asked: "2-4 Qs",
    concept: "Divisibility rules, remainders, factors, HCF (largest common divisor) and LCM (smallest common multiple).",
    formulas: ["HCF × LCM = product of two numbers", "HCF of fractions = HCF(numerators)/LCM(denominators)", "Number of factors of pᵃqᵇ = (a+1)(b+1)"],
    tricks: ["Divisibility by 11: difference of alternate digit sums divisible by 11.", "Bells ringing together / least number of tiles → LCM; largest measuring tape → HCF.", "Unit digit of powers repeats in cycles of 4."],
  },
  {
    id: "q-percentage", subject: "quant", name: "Percentage", weight: 5, families: "all", asked: "2-4 Qs (base of all arithmetic)",
    concept: "Percent means per hundred. Most arithmetic topics (profit, interest, DI) are percentage applications.",
    formulas: ["Successive change a% and b% = a + b + ab/100", "If A is r% more than B, B is r/(100+r) × 100% less than A", "Population after n years = P(1 + r/100)ⁿ"],
    tricks: ["Memorise fraction table: 1/6 = 16.67%, 1/7 = 14.28%, 1/9 = 11.11%, 1/11 = 9.09%.", "Price ↑ r% → consumption must ↓ r/(100+r)×100% to keep spend constant.", "Use 10% and 1% blocks for fast mental calculation."],
  },
  {
    id: "q-profit-loss", subject: "quant", name: "Profit, Loss & Discount", weight: 4, families: "all", asked: "1-3 Qs",
    concept: "Profit/Loss is always on Cost Price; Discount is always on Marked Price.",
    formulas: ["Profit% = (SP − CP)/CP × 100", "SP = MP × (1 − d/100)", "Successive discounts a%, b% = a + b − ab/100", "MP/CP = (100 + profit%)/(100 − discount%)"],
    tricks: ["Dishonest dealer using false weight: profit% = (true − false)/false × 100.", "Same SP, one at x% profit and another at x% loss → always a loss of x²/100 %."],
  },
  {
    id: "q-si-ci", subject: "quant", name: "Simple & Compound Interest", weight: 4, families: "all", asked: "1-2 Qs",
    concept: "SI grows linearly; CI grows on accumulated amount.",
    formulas: ["SI = P × R × T / 100", "A = P(1 + R/100)ᵀ", "CI − SI (2 yrs) = P(R/100)²", "CI − SI (3 yrs) = P(R/100)²(3 + R/100)"],
    tricks: ["CI for 2 years at R% = 2R + R²/100 % of P.", "Half-yearly compounding: rate R/2, time 2T.", "Money doubles in T years at SI → R = 100/T."],
  },
  {
    id: "q-ratio", subject: "quant", name: "Ratio, Proportion & Partnership", weight: 4, families: "all", asked: "1-3 Qs",
    concept: "Compare quantities; partnership profit is shared in ratio of (capital × time).",
    formulas: ["a:b and b:c → a:b:c by equalising b", "Mean proportional of a and b = √(ab)", "Profit share ∝ Capital × Time"],
    tricks: ["Convert everything to a single ratio using LCM of the common term.", "Use multiplying factor k: A = 3k, B = 5k."],
  },
  {
    id: "q-average", subject: "quant", name: "Averages", weight: 3, families: "all", asked: "1-2 Qs",
    concept: "Average = Sum / Count. Use deviation method for quick answers.",
    formulas: ["New average after adding x = (n·avg + x)/(n+1)", "Average of first n natural numbers = (n+1)/2"],
    tricks: ["Deviation method: assume a base value and average the deviations.", "If a member is replaced and average changes by d, difference in their values = n × d."],
  },
  {
    id: "q-ages", subject: "quant", name: "Problems on Ages", weight: 2, families: "all", asked: "0-2 Qs",
    concept: "Set present ages as variables; difference of ages stays constant forever.",
    tricks: ["Use options — plug back to check ratio conditions quickly.", "Ratio after t years: (a+t)/(b+t)."],
  },
  {
    id: "q-time-work", subject: "quant", name: "Time & Work, Pipes & Cisterns", weight: 4, families: "all", asked: "1-2 Qs",
    concept: "Use the LCM (total work) method: total work = LCM of days, efficiency = work/day.",
    formulas: ["A and B together = ab/(a+b) days", "Pipe filling in a hrs, emptying in b hrs → net = ab/(b−a) hrs", "M₁D₁H₁/W₁ = M₂D₂H₂/W₂"],
    tricks: ["Take total work = LCM; efficiency of each = LCM/days — no fractions needed.", "Leaks are just negative efficiency."],
  },
  {
    id: "q-speed", subject: "quant", name: "Time, Speed & Distance (Trains, Boats)", weight: 4, families: "all", asked: "1-3 Qs",
    concept: "Distance = Speed × Time. Trains add their lengths when crossing; boats add/subtract stream speed.",
    formulas: ["km/h → m/s: × 5/18", "Average speed (equal distances) = 2xy/(x+y)", "Downstream = b + s, Upstream = b − s", "Relative speed: opposite = sum, same direction = difference"],
    tricks: ["Train crossing a pole: distance = train length; platform: train + platform.", "Boat speed = (down + up)/2; stream = (down − up)/2."],
  },
  {
    id: "q-mixture", subject: "quant", name: "Mixtures & Alligation", weight: 3, families: "all", asked: "1-2 Qs",
    concept: "Alligation finds the ratio in which two ingredients at given prices/concentrations must be mixed.",
    formulas: ["(Cheaper : Dearer) = (d − m) : (m − c)", "Repeated replacement: final = initial × (1 − x/V)ⁿ"],
    tricks: ["Draw the alligation cross — it takes 10 seconds and avoids equations."],
  },
  {
    id: "q-probability", subject: "quant", name: "Probability, P&C", weight: 2, families: ["bank", "insurance", "regulator", "ib"], asked: "1-2 Qs",
    concept: "P(E) = favourable / total outcomes. Permutation = arrangement, Combination = selection.",
    formulas: ["ⁿPᵣ = n!/(n−r)!", "ⁿCᵣ = n!/(r!(n−r)!)", "P(not E) = 1 − P(E)"],
    tricks: ["'At least one' → 1 − P(none).", "Word arrangements with repeated letters: n!/(p!q!)."],
  },
  {
    id: "q-mensuration", subject: "quant", name: "Mensuration (2D & 3D)", weight: 3, families: "all", asked: "1-3 Qs",
    concept: "Areas, perimeters, surface areas and volumes of standard shapes.",
    formulas: ["Circle: A = πr², C = 2πr", "Cylinder: V = πr²h, CSA = 2πrh", "Cone: V = ⅓πr²h", "Sphere: V = 4/3 πr³, SA = 4πr²", "Triangle (Heron): √(s(s−a)(s−b)(s−c))"],
    tricks: ["Use π = 22/7 when radius is a multiple of 7.", "If each dimension ↑ x%, area ↑ (2x + x²/100)%."],
  },
  {
    id: "q-di", subject: "quant", name: "Data Interpretation", weight: 5, families: "all", asked: "5-15 Qs (banking)",
    concept: "Read tables/bar/line/pie charts and compute ratios, averages and percentage changes.",
    tricks: ["Read the question first, then pick only the needed data.", "Approximate aggressively — options are usually wide apart.", "% change = (new − old)/old × 100; keep a fraction table handy."],
  },
  {
    id: "q-algebra", subject: "quant", name: "Algebra & Identities", weight: 3, families: ["ssc", "rrb", "ib"], asked: "2-4 Qs (SSC)",
    concept: "Identities, linear equations and expressions like x + 1/x.",
    formulas: ["x + 1/x = k → x² + 1/x² = k² − 2", "x³ + 1/x³ = k³ − 3k", "a³ + b³ + c³ − 3abc = (a+b+c)(a²+b²+c²−ab−bc−ca)"],
    tricks: ["Put simple values (x = 1, 0) to verify options.", "If a + b + c = 0 then a³ + b³ + c³ = 3abc."],
  },
  {
    id: "q-geometry", subject: "quant", name: "Geometry", weight: 3, families: ["ssc", "rrb", "ib"], asked: "2-4 Qs (SSC)",
    concept: "Triangles, circles, polygons, similarity & congruence.",
    formulas: ["Sum of interior angles of n-gon = (n−2)×180°", "Each exterior angle of regular n-gon = 360°/n", "Angle in semicircle = 90°"],
    tricks: ["Draw a neat figure — most SSC geometry is visual.", "Use standard triplets: 3-4-5, 5-12-13, 8-15-17, 7-24-25."],
  },
  {
    id: "q-trigonometry", subject: "quant", name: "Trigonometry, Heights & Distances", weight: 2, families: ["ssc"], asked: "2-3 Qs (SSC CGL)",
    concept: "Trigonometric ratios, identities and heights & distances.",
    formulas: ["sin²θ + cos²θ = 1", "1 + tan²θ = sec²θ", "sin 30° = 1/2, sin 45° = 1/√2, sin 60° = √3/2"],
    tricks: ["Put θ = 45° or 0° to check identity questions instantly.", "Height & distance: angle 45° → height = distance."],
  },

  // ─────────────────────────── REASONING ───────────────────────────
  {
    id: "r-seating", subject: "reasoning", name: "Seating Arrangement (Linear & Circular)", weight: 5, families: "all", asked: "5-10 Qs (banking)",
    concept: "Arrange people using clues. Start with definite clues, then build cases.",
    tricks: ["Begin with the clue giving a fixed position or the most connections.", "In circular facing centre: right is anticlockwise, left is clockwise.", "Make 2-3 cases quickly; eliminate using negative clues."],
  },
  {
    id: "r-puzzles", subject: "reasoning", name: "Puzzles (Floor, Box, Scheduling)", weight: 5, families: ["bank", "insurance", "regulator"], asked: "10-15 Qs",
    concept: "Floor, box, month/day scheduling and comparison puzzles.",
    tricks: ["Draw a table with rows = positions/floors; fill fixed clues first.", "Skip a puzzle if no definite clue appears in 60 seconds — come back later."],
  },
  {
    id: "r-syllogism", subject: "reasoning", name: "Syllogism", weight: 4, families: "all", asked: "3-5 Qs",
    concept: "Draw conclusions from statements using Venn diagrams (All, Some, No, Only a few).",
    tricks: ["All + All = All; All + No = No; Some + All = Some; Some + No = Some-not.", "Two 'Some' statements give no definite conclusion.", "Possibility questions: true if any valid Venn arrangement allows it."],
  },
  {
    id: "r-inequality", subject: "reasoning", name: "Inequality (Coded & Direct)", weight: 4, families: ["bank", "insurance", "regulator"], asked: "3-5 Qs",
    concept: "Compare elements through a chain of relations such as A ≥ B > C = D.",
    tricks: ["A relation is definite only if all signs in the path point the same way.", "Any > or < in the chain makes the result strict.", "Opposite signs between two elements → no relation (check 'either-or')."],
  },
  {
    id: "r-blood", subject: "reasoning", name: "Blood Relations", weight: 3, families: "all", asked: "2-3 Qs",
    concept: "Build a family tree using symbols: + male, − female, = couple, vertical lines for generations.",
    tricks: ["Start from the last person mentioned ('…of X') and work backwards.", "Never assume gender unless given."],
  },
  {
    id: "r-direction", subject: "reasoning", name: "Direction Sense", weight: 3, families: "all", asked: "1-3 Qs",
    concept: "Track movement on a grid; use Pythagoras for shortest distance.",
    tricks: ["Right turn = clockwise 90°, left turn = anticlockwise 90°.", "Shadow: morning sun in east → shadow west; evening → shadow east."],
  },
  {
    id: "r-coding", subject: "reasoning", name: "Coding-Decoding", weight: 4, families: "all", asked: "2-5 Qs",
    concept: "Letters/numbers are shifted, reversed, or mapped to words.",
    tricks: ["Learn EJOTY (5,10,15,20,25) for letter positions.", "Opposite letter pairs sum to 27 (A-Z, B-Y...).", "For word-coding, find common words across sentences."],
  },
  {
    id: "r-series", subject: "reasoning", name: "Alphabet & Number Series", weight: 3, families: "all", asked: "2-4 Qs",
    concept: "Find the next term in letter/number patterns.",
    tricks: ["Convert letters to numbers, find the pattern, convert back.", "Watch for skipping patterns: +1, +2, +3..."],
  },
  {
    id: "r-ranking", subject: "reasoning", name: "Order & Ranking", weight: 3, families: "all", asked: "1-3 Qs",
    concept: "Positions from left/right or top/bottom in a row.",
    formulas: ["Total = left position + right position − 1"],
    tricks: ["When two people interchange, the change in one person's rank gives the other's new rank."],
  },
  {
    id: "r-analogy", subject: "reasoning", name: "Analogy & Classification (Odd one out)", weight: 3, families: ["ssc", "rrb", "ib"], asked: "4-8 Qs (SSC/RRB)",
    concept: "Find the relationship between a pair and apply it; or find the item that does not belong.",
    tricks: ["Check squares, cubes, primes, sums of digits for number analogies.", "For words: function, category, part-whole, worker-tool relationships."],
  },
  {
    id: "r-calendar-clock", subject: "reasoning", name: "Calendar & Clock", weight: 2, families: ["ssc", "rrb", "ib"], asked: "1-2 Qs",
    concept: "Odd days for calendars; relative speed of hands for clocks.",
    formulas: ["Angle between hands = |30H − 5.5M|", "Ordinary year = 1 odd day, leap year = 2 odd days", "Hands coincide every 65 5/11 minutes"],
    tricks: ["Century odd days: 100 yrs = 5, 200 = 3, 300 = 1, 400 = 0.", "Same calendar repeats after 28 years in most cases."],
  },
  {
    id: "r-math-ops", subject: "reasoning", name: "Mathematical Operations", weight: 2, families: ["ssc", "rrb", "ib"], asked: "1-2 Qs",
    concept: "Replace symbols as instructed, then apply BODMAS.",
    tricks: ["Rewrite the whole expression with real symbols before solving — avoids silly errors."],
  },
  {
    id: "r-statements", subject: "reasoning", name: "Statement – Conclusion / Assumption", weight: 2, families: "all", asked: "1-3 Qs",
    concept: "Critical reasoning: evaluate what logically follows from the given statement.",
    tricks: ["A conclusion must follow directly; don't use outside knowledge.", "Words like 'only', 'all', 'always' in conclusions are usually traps."],
  },
  {
    id: "r-nonverbal", subject: "reasoning", name: "Non-verbal (Mirror, Paper folding, Figures)", weight: 2, families: ["ssc", "rrb"], asked: "3-6 Qs",
    concept: "Mirror/water images, embedded figures, paper cutting & counting figures.",
    tricks: ["Mirror image: left-right flips; water image: top-bottom flips.", "Count triangles systematically: single, then combinations."],
  },

  // ──────────────────────────── ENGLISH ────────────────────────────
  {
    id: "e-rc", subject: "english", name: "Reading Comprehension", weight: 5, families: ["bank", "insurance", "regulator", "ssc", "ib"], asked: "5-10 Qs",
    concept: "Read a passage and answer factual, inference, tone and vocabulary questions.",
    tricks: ["Read questions first, then the passage.", "Inference answers are supported by the text but not stated directly.", "Eliminate extreme options ('always', 'never')."],
  },
  {
    id: "e-error", subject: "english", name: "Error Spotting", weight: 4, families: "all", asked: "3-5 Qs",
    concept: "Identify the part of the sentence with a grammatical error.",
    tricks: ["Check subject-verb agreement first, then tense, then prepositions/articles.", "'Each/every/either/neither' take singular verbs.", "'One of the + plural noun' takes singular verb."],
  },
  {
    id: "e-fillers", subject: "english", name: "Fill in the Blanks", weight: 4, families: "all", asked: "3-5 Qs",
    concept: "Choose the word that fits grammatically and contextually.",
    tricks: ["Look for collocations: 'abide by', 'comply with', 'deal in'.", "Use the tone of the sentence (positive/negative) to eliminate."],
  },
  {
    id: "e-cloze", subject: "english", name: "Cloze Test", weight: 3, families: ["bank", "insurance", "regulator", "ssc"], asked: "5 Qs",
    concept: "A passage with blanks; choose words that fit the context.",
    tricks: ["Read the full passage once to get the theme.", "Check grammar around the blank (article, preposition, tense)."],
  },
  {
    id: "e-parajumble", subject: "english", name: "Para Jumbles", weight: 3, families: ["bank", "insurance", "regulator", "ssc"], asked: "3-5 Qs",
    concept: "Arrange sentences into a coherent paragraph.",
    tricks: ["Find the opening sentence (introduces a subject, no pronoun reference).", "Look for mandatory pairs: pronoun → noun it refers to, 'however' → contrast."],
  },
  {
    id: "e-synonyms", subject: "english", name: "Synonyms", weight: 4, families: "all", asked: "1-3 Qs",
    concept: "Words with similar meaning.",
    tricks: ["Learn words in clusters (benevolent, magnanimous, philanthropic).", "Use root words: 'bene' = good, 'mal' = bad."],
  },
  {
    id: "e-antonyms", subject: "english", name: "Antonyms", weight: 4, families: "all", asked: "1-3 Qs",
    concept: "Words with opposite meaning.",
    tricks: ["Find a synonym first, then look for its opposite among options.", "Beware of options that are synonyms — they are traps."],
  },
  {
    id: "e-idioms", subject: "english", name: "Idioms & Phrases", weight: 3, families: ["ssc", "rrb", "ib", "bank"], asked: "1-3 Qs",
    concept: "Expressions whose meaning differs from the literal meaning.",
    tricks: ["Revise 10 idioms daily with a sentence each.", "Imagine the literal picture — it often hints at the meaning."],
  },
  {
    id: "e-ows", subject: "english", name: "One Word Substitution", weight: 3, families: ["ssc", "rrb", "ib"], asked: "1-2 Qs",
    concept: "Replace a group of words with a single word.",
    tricks: ["Learn by categories: phobias, '-cide' words, people & professions."],
  },
  {
    id: "e-spelling", subject: "english", name: "Spelling Correction", weight: 2, families: ["ssc", "rrb", "ib"], asked: "1-2 Qs",
    concept: "Identify the correctly/incorrectly spelt word.",
    tricks: ["Common traps: double letters (accommodate, committee), ie/ei (receive, seize)."],
  },
  {
    id: "e-improvement", subject: "english", name: "Sentence Improvement", weight: 3, families: "all", asked: "1-3 Qs",
    concept: "Replace the underlined part with the grammatically correct alternative.",
    tricks: ["'No improvement' is correct only when you can't find any error after checking agreement, tense and idiom."],
  },
  {
    id: "e-voice", subject: "english", name: "Active-Passive & Narration", weight: 2, families: ["ssc", "rrb", "ib"], asked: "1-2 Qs",
    concept: "Convert sentences between active/passive voice and direct/indirect speech.",
    tricks: ["Passive: object + be-form + V3 + by + subject; tense stays the same.", "Indirect speech: present → past, 'will' → 'would', 'now' → 'then'."],
  },

  // ─────────────────────────── GENERAL AWARENESS ───────────────────────────
  {
    id: "g-banking", subject: "gk", name: "Banking & Financial Awareness", weight: 5, families: ["bank", "insurance", "regulator"], asked: "20-40 Qs (mains)",
    concept: "RBI functions, monetary policy tools, payment systems, banking terms, financial institutions.",
    tricks: ["Make a one-page sheet of policy rates (Repo, Reverse Repo, SDF, MSF, CRR, SLR) and update it after every MPC meeting.", "Learn headquarters & heads of regulators (RBI, SEBI, IRDAI, PFRDA, NABARD, SIDBI)."],
  },
  {
    id: "g-economy", subject: "gk", name: "Indian Economy & Budget", weight: 4, families: "all", asked: "3-8 Qs",
    concept: "GDP, inflation, fiscal policy, budget terms, government schemes.",
    tricks: ["Link every scheme to its ministry and launch year.", "Fiscal deficit = total expenditure − (revenue receipts + non-debt capital receipts)."],
  },
  {
    id: "g-polity", subject: "gk", name: "Indian Polity & Constitution", weight: 4, families: "all", asked: "3-6 Qs",
    concept: "Constitution, fundamental rights, DPSP, Parliament, President, judiciary, amendments.",
    tricks: ["Remember article ranges: FR 12–35, DPSP 36–51, FD 51A, President 52–62.", "Learn 12 schedules with a mnemonic: 'TEARS OF OLD PM'."],
  },
  {
    id: "g-history", subject: "gk", name: "Indian History & Freedom Struggle", weight: 4, families: "all", asked: "2-5 Qs",
    concept: "Ancient, medieval and modern India including national movement.",
    tricks: ["Make a timeline chart of battles and Governors-General.", "Associate reform movements with founders and years."],
  },
  {
    id: "g-geography", subject: "gk", name: "Geography (India & World)", weight: 4, families: "all", asked: "2-5 Qs",
    concept: "Physical & economic geography, rivers, national parks, states & capitals.",
    tricks: ["Use a blank map to locate national parks and rivers.", "Revise state-wise: capital, dance, national park, festival."],
  },
  {
    id: "g-science", subject: "gk", name: "General Science (Physics, Chemistry, Biology)", weight: 4, families: ["ssc", "rrb", "ib"], asked: "5-25 Qs (RRB)",
    concept: "NCERT-level science: units, laws, chemical names, human body, diseases, vitamins.",
    tricks: ["RRB asks Class 10 NCERT science heavily — read NCERT summaries.", "Tabulate vitamins → deficiency diseases and SI units → quantities."],
  },
  {
    id: "g-static", subject: "gk", name: "Static GK (Days, HQs, Sports, Books)", weight: 3, families: "all", asked: "2-6 Qs",
    concept: "Important days, organisations & headquarters, sports trophies, firsts in India.",
    tricks: ["Create flashcards and revise them with spaced repetition (1-3-7-15 days)."],
  },
  {
    id: "g-railways", subject: "gk", name: "Indian Railways GK", weight: 2, families: ["rrb"], asked: "1-3 Qs",
    concept: "Railway zones, headquarters, history and important trains.",
    tricks: ["First passenger train: Bombay (Bori Bunder) – Thane, 16 April 1853."],
  },
  {
    id: "g-current", subject: "gk", name: "Current Affairs (last 6 months)", weight: 4, families: "all", asked: "10-40% of GA",
    concept: "National & international news, appointments, awards, summits, schemes, sports events.",
    tricks: ["Read one newspaper + a monthly PDF; revise the last 6 months before the exam.", "Focus on banking, economy, appointments, MoUs and indices for bank exams."],
  },
  {
    id: "g-computer", subject: "gk", name: "Computer Awareness", weight: 2, families: ["bank", "insurance", "ssc", "rrb"], asked: "0-20 Qs (clerk mains/SSC)",
    concept: "Basics of hardware, software, networking, MS Office, internet and security.",
    tricks: ["Memorise shortcuts (Ctrl+Z undo, Ctrl+Y redo) and abbreviations (URL, HTTP, LAN)."],
  },
];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
export const topicsBySubject = (s: SubjectId) => TOPICS.filter((t) => t.subject === s);
