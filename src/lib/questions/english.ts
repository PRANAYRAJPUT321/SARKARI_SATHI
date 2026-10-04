import { pick, sample, shuffle, withOptions, type Rng } from "./rng";
import type { Gen, QBody } from "./types";

// [word, synonym, antonym]
const VOCAB: [string, string, string][] = [
  ["Abundant", "Plentiful", "Scarce"], ["Benevolent", "Kind", "Malevolent"], ["Candid", "Frank", "Evasive"], ["Diligent", "Hardworking", "Lazy"],
  ["Eminent", "Distinguished", "Obscure"], ["Frugal", "Thrifty", "Extravagant"], ["Gregarious", "Sociable", "Introverted"], ["Hostile", "Unfriendly", "Amicable"],
  ["Immense", "Huge", "Tiny"], ["Jubilant", "Joyful", "Sorrowful"], ["Kindle", "Ignite", "Extinguish"], ["Lucid", "Clear", "Obscure"],
  ["Meticulous", "Careful", "Careless"], ["Notorious", "Infamous", "Reputable"], ["Obstinate", "Stubborn", "Flexible"], ["Prudent", "Wise", "Reckless"],
  ["Quell", "Suppress", "Provoke"], ["Robust", "Strong", "Frail"], ["Scrutinize", "Examine", "Overlook"], ["Tranquil", "Calm", "Turbulent"],
  ["Ubiquitous", "Omnipresent", "Rare"], ["Vivid", "Bright", "Dull"], ["Wary", "Cautious", "Careless"], ["Zealous", "Enthusiastic", "Apathetic"],
  ["Adversity", "Hardship", "Prosperity"], ["Brevity", "Conciseness", "Verbosity"], ["Cordial", "Friendly", "Hostile"], ["Deter", "Discourage", "Encourage"],
  ["Elated", "Overjoyed", "Depressed"], ["Feeble", "Weak", "Strong"], ["Genuine", "Authentic", "Fake"], ["Humble", "Modest", "Arrogant"],
  ["Imminent", "Impending", "Distant"], ["Lenient", "Tolerant", "Strict"], ["Mitigate", "Alleviate", "Aggravate"], ["Novice", "Beginner", "Expert"],
  ["Opulent", "Luxurious", "Poor"], ["Pristine", "Pure", "Contaminated"], ["Reluctant", "Unwilling", "Eager"], ["Serene", "Peaceful", "Agitated"],
  ["Tenacious", "Persistent", "Irresolute"], ["Valiant", "Brave", "Cowardly"], ["Wane", "Decline", "Wax"], ["Affluent", "Wealthy", "Impoverished"],
  ["Barren", "Infertile", "Fertile"], ["Concur", "Agree", "Differ"], ["Dwindle", "Shrink", "Grow"], ["Enigma", "Mystery", "Clarity"],
  ["Fallacy", "Misconception", "Truth"], ["Gratify", "Satisfy", "Displease"], ["Hasty", "Hurried", "Deliberate"], ["Inept", "Incompetent", "Skilful"],
  ["Jeopardy", "Danger", "Safety"], ["Lethargic", "Sluggish", "Energetic"], ["Morose", "Gloomy", "Cheerful"], ["Nimble", "Agile", "Clumsy"],
  ["Ominous", "Threatening", "Auspicious"], ["Placid", "Calm", "Excitable"], ["Rejuvenate", "Revive", "Exhaust"], ["Spurious", "Fake", "Genuine"],
  ["Trivial", "Insignificant", "Important"], ["Vigilant", "Watchful", "Negligent"], ["Wrath", "Anger", "Delight"], ["Accord", "Agreement", "Discord"],
  ["Augment", "Increase", "Diminish"], ["Callous", "Insensitive", "Compassionate"], ["Despondent", "Hopeless", "Optimistic"], ["Exonerate", "Acquit", "Convict"],
  ["Fortify", "Strengthen", "Weaken"], ["Impede", "Hinder", "Facilitate"], ["Lavish", "Generous", "Meagre"], ["Mundane", "Ordinary", "Extraordinary"],
  ["Obsolete", "Outdated", "Modern"], ["Perpetual", "Everlasting", "Temporary"], ["Rigid", "Inflexible", "Pliable"], ["Sagacious", "Wise", "Foolish"],
  ["Taciturn", "Reserved", "Talkative"], ["Venerate", "Revere", "Despise"], ["Ambiguous", "Unclear", "Explicit"], ["Arduous", "Difficult", "Easy"],
  ["Concise", "Brief", "Lengthy"], ["Copious", "Profuse", "Sparse"], ["Dexterous", "Skilful", "Awkward"], ["Ephemeral", "Transient", "Permanent"],
];

const IDIOMS: [string, string][] = [
  ["A blessing in disguise", "Something good that seemed bad at first"], ["Burn the midnight oil", "Work or study late into the night"],
  ["Hit the nail on the head", "Describe exactly what is causing a problem"], ["Once in a blue moon", "Very rarely"],
  ["Cry over spilt milk", "Regret something that cannot be undone"], ["Bite the bullet", "Face a difficult situation bravely"],
  ["Spill the beans", "Reveal a secret"], ["Break the ice", "Start a conversation in an awkward situation"],
  ["Beat around the bush", "Avoid coming to the main point"], ["Cost an arm and a leg", "Be very expensive"],
  ["Under the weather", "Feeling slightly ill"], ["Let the cat out of the bag", "Accidentally reveal a secret"],
  ["Add fuel to the fire", "Make a bad situation worse"], ["At the eleventh hour", "At the last possible moment"],
  ["A piece of cake", "Something very easy"], ["Call it a day", "Stop working for the day"],
  ["Get cold feet", "Become nervous before an important event"], ["In hot water", "In trouble"],
  ["Keep one's fingers crossed", "Hope for a good outcome"], ["Leave no stone unturned", "Try every possible way"],
  ["Miss the boat", "Lose an opportunity"], ["Pull someone's leg", "Tease or joke with someone"],
  ["See eye to eye", "Agree fully with someone"], ["The ball is in your court", "It is your decision now"],
  ["Turn a deaf ear", "Ignore a request"], ["Up in arms", "Very angry and protesting"],
  ["Take with a pinch of salt", "Not believe something completely"], ["Hand in glove", "In close partnership, usually for something wrong"],
  ["Bury the hatchet", "Make peace"], ["A white elephant", "A costly possession that is useless"],
  ["Apple of one's eye", "Someone very dear"], ["Bolt from the blue", "A complete surprise"],
  ["Cut corners", "Do something cheaply or carelessly"], ["Feather in one's cap", "An achievement to be proud of"],
  ["Go the extra mile", "Make more effort than expected"], ["Head over heels", "Completely in love or excited"],
  ["In the same boat", "In the same difficult situation"], ["Kill two birds with one stone", "Achieve two things with one action"],
  ["Make ends meet", "Earn just enough to live on"], ["Nip in the bud", "Stop something at an early stage"],
];

const OWS: [string, string][] = [
  ["One who cannot be corrected", "Incorrigible"], ["A person who loves mankind", "Philanthropist"], ["Fear of heights", "Acrophobia"],
  ["One who knows everything", "Omniscient"], ["A place where birds are kept", "Aviary"], ["Killing of one's own brother", "Fratricide"],
  ["A speech made without preparation", "Extempore"], ["One who does not believe in God", "Atheist"], ["Words written on a tomb", "Epitaph"],
  ["Government by the people", "Democracy"], ["A person who eats too much", "Glutton"], ["One who walks in sleep", "Somnambulist"],
  ["That which cannot be read", "Illegible"], ["Study of birds", "Ornithology"], ["A life history written by oneself", "Autobiography"],
  ["One who is present everywhere", "Omnipresent"], ["A cure for all diseases", "Panacea"], ["One who speaks many languages", "Polyglot"],
  ["Fear of water", "Hydrophobia"], ["A person who hates women", "Misogynist"], ["That which cannot be avoided", "Inevitable"],
  ["One who retires from society to live alone", "Recluse"], ["Murder of a king", "Regicide"], ["A handwriting that cannot be read", "Illegible"],
  ["A person who is new to a profession", "Novice"], ["Rule by a few", "Oligarchy"], ["One who looks on the bright side", "Optimist"],
  ["A medicine that induces sleep", "Soporific"], ["Animals that eat flesh", "Carnivores"], ["A place where coins are made", "Mint"],
  ["One who is unable to pay debts", "Insolvent"], ["A list of books", "Catalogue"], ["Something no longer in use", "Obsolete"],
  ["A person who works for no pay", "Volunteer"], ["Study of the human mind", "Psychology"], ["One who travels on foot", "Pedestrian"],
];

const SPELLINGS = ["Accommodate", "Committee", "Embarrass", "Occurrence", "Necessary", "Separate", "Recommend", "Conscientious", "Millennium", "Questionnaire", "Entrepreneur", "Maintenance", "Bureaucracy", "Guarantee", "Privilege", "Rhythm", "Surveillance", "Achievement", "Receive", "Perseverance", "Acquaintance", "Definitely", "Exaggerate", "Harass", "Liaison", "Mischievous", "Occasion", "Pronunciation", "Restaurant", "Tomorrow"];

function misspell(r: Rng, w: string): string {
  const ops = [
    (s: string) => s.replace(/([a-z])\1/, "$1"), // drop double letter
    (s: string) => s.replace(/([bcdfglmnprst])(?!\1)([aeiou])/, "$1$1$2"), // add double letter
    (s: string) => s.replace(/ie/, "ei"),
    (s: string) => s.replace(/ei/, "ie"),
    (s: string) => s.replace(/a([^a])/, "e$1"),
    (s: string) => s.replace(/ence$/, "ance").replace(/ance$/, "ence"),
    (s: string) => s.replace(/e([^e]*)$/, "a$1"),
  ];
  for (let i = 0; i < 10; i++) {
    const m = pick(r, ops)(w);
    if (m !== w) return m;
  }
  return w.slice(0, -1) + w.slice(-1).repeat(2);
}

// sentence split into four parts, error index (0-3) or 4 = no error
const ERRORS: { p: [string, string, string, string]; e: number; fix: string }[] = [
  { p: ["Each of the students", "have submitted", "their assignment", "on time."], e: 1, fix: "'Each' takes a singular verb → 'has submitted'." },
  { p: ["One of my friends", "are working", "in a multinational", "company in Pune."], e: 1, fix: "'One of + plural noun' takes a singular verb → 'is working'." },
  { p: ["Neither the manager", "nor the clerks", "was present", "at the meeting."], e: 2, fix: "With 'neither…nor', the verb agrees with the nearer subject 'clerks' → 'were present'." },
  { p: ["He is", "more stronger", "than his", "elder brother."], e: 1, fix: "Double comparative is wrong → 'stronger'." },
  { p: ["I have been", "living in Delhi", "since five years", "now."], e: 2, fix: "Use 'for' with a period of time → 'for five years'." },
  { p: ["The news", "are very good", "for all of us", "today."], e: 1, fix: "'News' is singular → 'is very good'." },
  { p: ["She is", "senior than me", "in the office", "by two years."], e: 1, fix: "'Senior' takes 'to' → 'senior to me'." },
  { p: ["If I was", "the Prime Minister,", "I would improve", "rural healthcare."], e: 0, fix: "Subjunctive mood → 'If I were'." },
  { p: ["He did not", "knew the answer", "to the", "question."], e: 1, fix: "After 'did not', use base form → 'know'." },
  { p: ["The furnitures", "in this room", "are made", "of teak wood."], e: 0, fix: "'Furniture' is uncountable → 'The furniture … is made'." },
  { p: ["We discussed", "about the problem", "for two hours", "yesterday."], e: 1, fix: "'Discuss' does not take 'about' → 'discussed the problem'." },
  { p: ["Hardly had I", "reached the station", "than the train", "left."], e: 2, fix: "'Hardly' is followed by 'when' → 'when the train left'." },
  { p: ["The committee", "has submitted", "its report", "to the minister."], e: 4, fix: "The sentence is correct." },
  { p: ["He is one of", "the best player", "in the national", "team."], e: 1, fix: "'One of the + superlative + plural noun' → 'the best players'." },
  { p: ["My father", "as well as my uncles", "are coming", "to the wedding."], e: 2, fix: "With 'as well as', the verb agrees with the first subject 'father' → 'is coming'." },
  { p: ["Unless you do not", "work hard,", "you will not", "pass the exam."], e: 0, fix: "'Unless' is already negative → 'Unless you work hard'." },
  { p: ["The police", "has arrested", "the thief", "this morning."], e: 1, fix: "'Police' is plural → 'have arrested'." },
  { p: ["I prefer", "tea than", "coffee in", "the morning."], e: 1, fix: "'Prefer' takes 'to' → 'tea to coffee'." },
  { p: ["She has", "returned back", "from Mumbai", "last night."], e: 1, fix: "'Return back' is redundant → 'returned'." },
  { p: ["The cattle", "is grazing", "in the", "field."], e: 1, fix: "'Cattle' is plural → 'are grazing'." },
  { p: ["Ten kilometres", "are a long distance", "to walk", "every day."], e: 1, fix: "A distance taken as one unit is singular → 'is a long distance'." },
  { p: ["He insisted", "to go", "to the market", "alone."], e: 1, fix: "'Insist' takes 'on' + gerund → 'on going'." },
  { p: ["The book", "which you gave me", "is very", "interesting."], e: 4, fix: "The sentence is correct." },
  { p: ["Scarcely had", "the teacher entered", "the class", "than the students stood up."], e: 3, fix: "'Scarcely' takes 'when' → 'when the students stood up'." },
  { p: ["He", "has been suffering", "from fever", "since three days."], e: 3, fix: "Use 'for three days'." },
  { p: ["Mathematics", "are my", "favourite", "subject."], e: 1, fix: "'Mathematics' (subject name) is singular → 'is my'." },
];

const FILLERS: { s: string; a: string; d: string[]; why: string }[] = [
  { s: "The meeting was called ______ due to heavy rain.", a: "off", d: ["of", "on", "out", "up"], why: "'Call off' = cancel." },
  { s: "She has been working here ______ 2019.", a: "since", d: ["for", "from", "by", "till"], why: "'Since' is used with a point of time." },
  { s: "All employees must ______ by the rules of the company.", a: "abide", d: ["agree", "follow", "comply", "obey"], why: "'Abide by' is the correct collocation." },
  { s: "He is ______ honest man.", a: "an", d: ["a", "the", "no article", "one"], why: "'Honest' begins with a vowel sound." },
  { s: "The new policy will ______ the growth of small businesses.", a: "boost", d: ["hamper", "boast", "booster", "boosting"], why: "Context is positive; 'boost' (verb) fits." },
  { s: "I would rather ______ at home than go out in this weather.", a: "stay", d: ["staying", "to stay", "stayed", "stays"], why: "'Would rather' takes the base form." },
  { s: "The RBI has decided to keep the repo rate ______.", a: "unchanged", d: ["unchanging", "change", "changeable", "changed"], why: "'Keep … unchanged' = no change." },
  { s: "Despite his best efforts, he ______ to clear the exam.", a: "failed", d: ["succeeded", "managed", "passed", "tried"], why: "'Despite' indicates contrast → 'failed'." },
  { s: "She is good ______ mathematics.", a: "at", d: ["in", "on", "with", "for"], why: "'Good at' is the correct preposition." },
  { s: "The train ______ before we reached the station.", a: "had left", d: ["left", "has left", "leaves", "was leaving"], why: "Earlier of two past actions → past perfect." },
  { s: "He was accused ______ theft.", a: "of", d: ["for", "with", "about", "in"], why: "'Accused of' is the correct collocation." },
  { s: "The government is trying to ______ poverty.", a: "eradicate", d: ["eradicating", "erode", "erect", "evade"], why: "'Eradicate' = remove completely." },
  { s: "Neither of the two answers ______ correct.", a: "is", d: ["are", "were", "have been", "be"], why: "'Neither of' takes a singular verb." },
  { s: "The bank offers loans ______ low interest rates.", a: "at", d: ["on", "in", "with", "for"], why: "'At … rate' is standard." },
  { s: "If it rains tomorrow, we ______ the picnic.", a: "will cancel", d: ["would cancel", "cancelled", "had cancelled", "cancel"], why: "First conditional: if + present, will + verb." },
  { s: "The doctor advised him to give ______ smoking.", a: "up", d: ["off", "in", "away", "out"], why: "'Give up' = quit." },
  { s: "His speech was so ______ that everyone fell asleep.", a: "monotonous", d: ["exciting", "lively", "inspiring", "vibrant"], why: "Falling asleep implies boring → 'monotonous'." },
  { s: "She has a great ______ for music.", a: "aptitude", d: ["attitude", "altitude", "aptness", "apt"], why: "'Aptitude' = natural ability." },
  { s: "The thief managed to ______ the police.", a: "elude", d: ["allude", "delude", "illude", "include"], why: "'Elude' = escape from." },
  { s: "We should be ______ of our duties.", a: "mindful", d: ["mindless", "minded", "mind", "minding"], why: "'Mindful of' = aware of." },
];

const IMPROVE: { s: string; u: string; a: string; d: string[]; why: string }[] = [
  { s: "He has went to the market.", u: "has went", a: "has gone", d: ["have gone", "had went", "goes", "No improvement"], why: "Present perfect uses V3 'gone'." },
  { s: "I am looking forward to meet you.", u: "to meet", a: "to meeting", d: ["for meeting", "meet", "to have met", "No improvement"], why: "'Look forward to' + gerund." },
  { s: "She is the more intelligent of all the girls.", u: "the more intelligent", a: "the most intelligent", d: ["more intelligent", "most intelligent", "the intelligentest", "No improvement"], why: "Comparison among more than two → superlative." },
  { s: "No sooner did he arrive when it started raining.", u: "when", a: "than", d: ["then", "that", "as", "No improvement"], why: "'No sooner' pairs with 'than'." },
  { s: "He is too weak that he cannot walk.", u: "too weak that", a: "so weak that", d: ["very weak that", "weak so that", "too much weak that", "No improvement"], why: "'So … that' construction." },
  { s: "The teacher made him to stand outside.", u: "made him to stand", a: "made him stand", d: ["made him standing", "make him stand", "made to him stand", "No improvement"], why: "'Make' takes a bare infinitive." },
  { s: "I have seen him yesterday.", u: "have seen", a: "saw", d: ["had seen", "have saw", "see", "No improvement"], why: "Definite past time 'yesterday' → simple past." },
  { s: "Let him and I go together.", u: "him and I", a: "him and me", d: ["he and I", "he and me", "I and him", "No improvement"], why: "Object pronoun after 'let'." },
  { s: "He is junior than me by two years.", u: "junior than me", a: "junior to me", d: ["junior from me", "more junior than me", "junior of me", "No improvement"], why: "'Junior/senior' take 'to'." },
  { s: "The report has been submitted yesterday.", u: "has been submitted", a: "was submitted", d: ["had been submitted", "is submitted", "will be submitted", "No improvement"], why: "Past time marker → simple past passive." },
  { s: "Please send me the details at the earliest.", u: "at the earliest", a: "at the earliest", d: ["at earliest", "by the earliest", "on the earliest", "in the earliest"], why: "The sentence is correct as it is (No improvement)." },
  { s: "Each boy and each girl were given a prize.", u: "were given", a: "was given", d: ["are given", "have been given", "had given", "No improvement"], why: "'Each … and each' takes a singular verb." },
];

const VOICE: { s: string; a: string; d: string[]; why: string; kind: string }[] = [
  { kind: "passive", s: "The chef is cooking the food.", a: "The food is being cooked by the chef.", d: ["The food was cooked by the chef.", "The food has been cooked by the chef.", "The food is cooked by the chef.", "The food was being cooked by the chef."], why: "Present continuous → is/am/are + being + V3." },
  { kind: "passive", s: "They will announce the results tomorrow.", a: "The results will be announced tomorrow.", d: ["The results would be announced tomorrow.", "The results will announce tomorrow.", "The results are announced tomorrow.", "The results will have announced tomorrow."], why: "Future simple → will be + V3." },
  { kind: "passive", s: "Someone has stolen my bicycle.", a: "My bicycle has been stolen.", d: ["My bicycle was stolen by someone.", "My bicycle had been stolen.", "My bicycle is stolen.", "My bicycle has stolen."], why: "Present perfect → has/have been + V3 (agent 'someone' dropped)." },
  { kind: "passive", s: "Who wrote this letter?", a: "By whom was this letter written?", d: ["Who was this letter written?", "By whom this letter was written?", "By whom is this letter written?", "Whom wrote this letter?"], why: "Question with 'who' → 'By whom' + was + subject + V3." },
  { kind: "passive", s: "Open the door.", a: "Let the door be opened.", d: ["The door is opened.", "The door should open.", "Let the door open.", "The door be opened."], why: "Imperative → Let + object + be + V3." },
  { kind: "narration", s: "He said, \"I am tired.\"", a: "He said that he was tired.", d: ["He said that I was tired.", "He said that he is tired.", "He told that he was tired.", "He said that he had been tired."], why: "Present → past; pronoun changes to 'he'." },
  { kind: "narration", s: "She said to me, \"Where are you going?\"", a: "She asked me where I was going.", d: ["She asked me where was I going.", "She said to me where I am going.", "She asked me where I am going.", "She told me where I was going."], why: "Questions: 'asked', statement word order, tense backshift." },
  { kind: "narration", s: "The teacher said, \"The earth revolves around the sun.\"", a: "The teacher said that the earth revolves around the sun.", d: ["The teacher said that the earth revolved around the sun.", "The teacher said that the earth had revolved around the sun.", "The teacher told that the earth revolves around the sun.", "The teacher says the earth revolved around the sun."], why: "Universal truths keep the present tense." },
  { kind: "narration", s: "He said, \"Please help me.\"", a: "He requested me to help him.", d: ["He said to help him.", "He requested to me to help him.", "He told me please help him.", "He ordered me to help him."], why: "Requests → 'requested' + to-infinitive." },
];

// Reading comprehension passages (original texts written for practice)
const RC: { passage: string; qs: { q: string; a: string; d: string[]; why: string }[] }[] = [
  {
    passage:
      "Digital payments have transformed the way Indians handle money. A decade ago, most small shops accepted only cash; today even roadside vendors display QR codes. The Unified Payments Interface (UPI), developed by the National Payments Corporation of India, allowed instant transfers between bank accounts using a mobile phone, without needing to share account details. Its success rests on three pillars: interoperability, zero cost for most users and a simple interface. However, experts caution that rapid digitisation brings new risks. Frauds that exploit unaware users, such as fake payment requests, have grown alongside adoption. Financial literacy, therefore, must keep pace with technology; otherwise the benefits of convenience may be undone by losses of trust.",
    qs: [
      { q: "According to the passage, who developed UPI?", a: "National Payments Corporation of India", d: ["Reserve Bank of India", "State Bank of India", "Ministry of Finance", "SEBI"], why: "Stated directly in the third sentence." },
      { q: "Which of the following is NOT mentioned as a pillar of UPI's success?", a: "High interest on balances", d: ["Interoperability", "Zero cost for most users", "Simple interface", "None of these"], why: "Only interoperability, zero cost and simplicity are mentioned." },
      { q: "What is the author's main concern about rapid digitisation?", a: "Frauds may grow if financial literacy does not keep pace", d: ["Shops will stop accepting cash", "UPI will become expensive", "Banks will close branches", "Phones are too costly"], why: "The last two sentences express this concern." },
      { q: "The word 'caution' as used in the passage most nearly means:", a: "Warn", d: ["Celebrate", "Ignore", "Encourage", "Predict"], why: "Experts 'caution' = warn about risks." },
    ],
  },
  {
    passage:
      "Indian Railways is often called the lifeline of the nation. It carries more than two crore passengers every day and moves a significant share of the country's freight, from coal to food grains. Beyond economics, the railways shape social life: festivals see millions travelling home, and long-distance trains bring together people of different languages and cultures in a single compartment. In recent years, the focus has shifted towards modernisation—semi-high-speed trains, dedicated freight corridors and redeveloped stations. Critics argue that the safety of existing tracks deserves equal attention, since ageing infrastructure can undermine even the most ambitious projects. The real challenge lies in balancing ambition with maintenance.",
    qs: [
      { q: "Why is Indian Railways called the 'lifeline of the nation'?", a: "It carries huge numbers of passengers and freight", d: ["It is the oldest railway in the world", "It only carries coal", "It is fully privatised", "It has the fastest trains"], why: "The passage links the title to passenger and freight volume." },
      { q: "What do critics emphasise according to the passage?", a: "Safety of existing tracks", d: ["Building more stations", "Raising fares", "Stopping freight services", "Introducing airlines"], why: "Critics argue safety of tracks deserves attention." },
      { q: "Which word is most OPPOSITE in meaning to 'ambitious' as used in the passage?", a: "Modest", d: ["Aspiring", "Bold", "Grand", "Large"], why: "Ambitious = grand; opposite = modest." },
      { q: "What is the central idea of the passage?", a: "Railways must balance modernisation with maintenance", d: ["Railways should stop modernising", "Railways are only a social institution", "Freight is more important than passengers", "Stations are overcrowded"], why: "The concluding line states the central idea." },
    ],
  },
  {
    passage:
      "Habits are formed through a loop of cue, routine and reward. A student who checks the phone every time a notification sounds is responding to a cue with a routine that offers a small reward—novelty. To change a habit, psychologists suggest keeping the cue and reward but replacing the routine. For instance, when the urge to scroll appears, the student could solve one quick aptitude question and reward themselves with a tick on a progress chart. Over weeks, the new routine becomes automatic. The key is consistency rather than intensity: twenty focused minutes every day achieve more than an exhausting five-hour session once a week.",
    qs: [
      { q: "According to the passage, a habit loop consists of:", a: "Cue, routine and reward", d: ["Goal, plan and action", "Cue, reward and punishment", "Routine, rest and repeat", "Motivation and discipline"], why: "Stated in the first sentence." },
      { q: "What do psychologists suggest to change a habit?", a: "Replace the routine while keeping cue and reward", d: ["Remove all cues", "Increase the reward", "Study for five hours at once", "Avoid using the phone forever"], why: "Third sentence." },
      { q: "The author believes that success depends more on:", a: "Consistency", d: ["Intensity", "Luck", "Talent", "Expensive coaching"], why: "'The key is consistency rather than intensity'." },
      { q: "The word 'automatic' in the passage means:", a: "Done without conscious effort", d: ["Done by a machine", "Done quickly", "Done reluctantly", "Done occasionally"], why: "A habit becomes automatic = effortless." },
    ],
  },
  {
    passage:
      "Microfinance emerged as a tool to provide small loans to people excluded from formal banking, especially women in rural areas. Self-help groups pool savings and lend within the group, building a credit history that banks can later rely upon. Studies show that access to credit can help families smooth consumption, invest in livestock or start small enterprises. Yet microfinance is not a magic wand. Over-indebtedness occurs when borrowers take loans from several lenders, and high interest rates can trap the poor in cycles of repayment. Regulators have therefore introduced caps on the number of lenders per borrower and stressed transparent pricing.",
    qs: [
      { q: "Microfinance primarily aims to serve:", a: "People excluded from formal banking", d: ["Large corporations", "Foreign investors", "Urban salaried employees", "Government departments"], why: "First sentence." },
      { q: "What problem arises when borrowers take loans from several lenders?", a: "Over-indebtedness", d: ["Lower interest rates", "Better credit history", "More savings", "Higher literacy"], why: "Stated in the passage." },
      { q: "Which phrase shows that microfinance has limitations?", a: "\"not a magic wand\"", d: ["\"smooth consumption\"", "\"self-help groups\"", "\"credit history\"", "\"start small enterprises\""], why: "'Not a magic wand' signals limits." },
      { q: "What step have regulators taken?", a: "Capped the number of lenders per borrower", d: ["Banned self-help groups", "Raised interest rates", "Stopped lending to women", "Removed all pricing rules"], why: "Last sentence." },
    ],
  },
];

const CLOZE: { text: string; blanks: { a: string; d: string[] }[] }[] = [
  {
    text: "Preparing for a competitive exam requires a (1) ______ strategy. Many aspirants (2) ______ the importance of revision and keep starting new topics. Regular mock tests help in (3) ______ weak areas, while analysis of mistakes ensures they are not (4) ______. Above all, a calm mind and adequate sleep are (5) ______ for peak performance.",
    blanks: [
      { a: "well-planned", d: ["haphazard", "careless", "random"] },
      { a: "underestimate", d: ["overrate", "emphasise", "prioritise"] },
      { a: "identifying", d: ["hiding", "ignoring", "creating"] },
      { a: "repeated", d: ["rewarded", "removed", "remembered"] },
      { a: "essential", d: ["optional", "harmful", "irrelevant"] },
    ],
  },
  {
    text: "The Reserve Bank of India plays a (1) ______ role in maintaining price stability. When inflation rises, it may (2) ______ the repo rate, making borrowing costlier. This reduces (3) ______ in the economy and cools demand. Conversely, during a slowdown, rates are (4) ______ to encourage investment. These decisions are taken by the Monetary Policy Committee after (5) ______ deliberation.",
    blanks: [
      { a: "pivotal", d: ["trivial", "minor", "negligible"] },
      { a: "increase", d: ["abolish", "ignore", "decrease"] },
      { a: "liquidity", d: ["population", "rainfall", "literacy"] },
      { a: "cut", d: ["doubled", "frozen", "hidden"] },
      { a: "careful", d: ["careless", "hasty", "casual"] },
    ],
  },
];

const JUMBLES: string[][] = [
  ["India has one of the largest railway networks in the world.", "It connects remote villages with major cities.", "As a result, millions depend on it for daily travel.", "Therefore, its modernisation is a national priority."],
  ["Time management is crucial in competitive exams.", "Most questions are not difficult, but the time limit is strict.", "Hence, candidates who practise with timers perform better.", "Mock tests help build this speed."],
  ["The monsoon is vital for Indian agriculture.", "Nearly half of the farmland depends on rainfall.", "A weak monsoon can therefore reduce crop output.", "This, in turn, may push up food prices."],
  ["Banks accept deposits from the public.", "They lend a part of these deposits to borrowers.", "The difference between interest earned and paid is their profit.", "This is called the net interest margin."],
  ["Reading newspapers daily improves general awareness.", "It also enhances vocabulary and comprehension skills.", "These are tested in almost every government exam.", "So, aspirants should make it a daily habit."],
  ["The Constitution of India came into force on 26 January 1950.", "It was drafted by a Constituent Assembly.", "Dr. B. R. Ambedkar chaired its Drafting Committee.", "That is why he is called the chief architect of the Constitution."],
  ["Solar energy is a clean source of power.", "India receives abundant sunlight throughout the year.", "Consequently, the government is promoting rooftop solar panels.", "This can reduce dependence on fossil fuels."],
];

const synonyms: Gen = (r) => {
  const [w, syn] = pick(r, VOCAB);
  const d = sample(r, VOCAB.filter((v) => v[0] !== w), 6).map((v) => v[1]);
  return { text: `Choose the word most similar in meaning to: ${w.toUpperCase()}`, ...withOptions(r, syn, d), explanation: `${w} means '${syn.toLowerCase()}'.`, difficulty: 1 };
};
const antonyms: Gen = (r) => {
  const [w, syn, ant] = pick(r, VOCAB);
  const d = [syn, ...sample(r, VOCAB.filter((v) => v[0] !== w), 5).map((v) => v[2])];
  return { text: `Choose the word most OPPOSITE in meaning to: ${w.toUpperCase()}`, ...withOptions(r, ant, d), explanation: `${w} (= ${syn.toLowerCase()}) is the opposite of '${ant.toLowerCase()}'. '${syn}' is a synonym trap.`, difficulty: 1 };
};
const idioms: Gen = (r) => {
  const [i, m] = pick(r, IDIOMS);
  const d = sample(r, IDIOMS.filter((x) => x[0] !== i), 5).map((x) => x[1]);
  return { text: `Choose the correct meaning of the idiom: "${i}"`, ...withOptions(r, m, d), explanation: `"${i}" means: ${m.toLowerCase()}.`, difficulty: 1 };
};
const ows: Gen = (r) => {
  const [p, w] = pick(r, OWS);
  const d = sample(r, OWS.filter((x) => x[1] !== w), 5).map((x) => x[1]);
  return { text: `Choose the one word for: "${p}"`, ...withOptions(r, w, d), explanation: `"${p}" = ${w}.`, difficulty: 1 };
};
const spelling: Gen = (r) => {
  const w = pick(r, SPELLINGS);
  const wrongs = new Set<string>();
  for (let i = 0; i < 12 && wrongs.size < 4; i++) {
    const m = misspell(r, w);
    if (m !== w) wrongs.add(m);
  }
  // fall back to simple letter swaps so we always have three distractors
  for (let i = 1; wrongs.size < 3 && i < w.length - 1; i++) {
    const swapped = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
    if (swapped !== w) wrongs.add(swapped);
  }
  return { text: "Choose the correctly spelt word.", ...withOptions(r, w, [...wrongs]), explanation: `The correct spelling is '${w}'.`, difficulty: 1 };
};
const errorSpot: Gen = (r) => {
  const e = pick(r, ERRORS);
  const labels = ["(A)", "(B)", "(C)", "(D)"];
  const options = ["A", "B", "C", "D", "No error"];
  return {
    text: `Find the part of the sentence that contains an error:\n${e.p.map((x, i) => `${labels[i]} ${x}`).join(" ")}`,
    options,
    answer: e.e,
    explanation: e.fix,
    difficulty: 2,
  };
};
const fillers: Gen = (r) => {
  const f = pick(r, FILLERS);
  return { text: `Fill in the blank: ${f.s}`, ...withOptions(r, f.a, f.d), explanation: f.why, difficulty: 1 };
};
const improvement: Gen = (r) => {
  const f = pick(r, IMPROVE);
  const correct = f.a === f.u ? "No improvement" : f.a;
  return {
    text: `Improve the underlined part of the sentence (shown in quotes):\n${f.s.replace(f.u, `"${f.u}"`)}`,
    ...withOptions(r, correct, f.d.filter((x) => x !== correct).concat(f.a === f.u ? [] : [])),
    explanation: f.why,
    difficulty: 2,
  };
};
const voice: Gen = (r) => {
  const f = pick(r, VOICE);
  return {
    text: `Choose the correct ${f.kind === "passive" ? "passive voice" : "indirect speech"} of: ${f.s}`,
    ...withOptions(r, f.a, f.d),
    explanation: f.why,
    difficulty: 2,
  };
};
const rc: Gen = (r) => {
  const p = pick(r, RC);
  return sample(r, p.qs, 3).map((q): QBody => ({
    passage: p.passage,
    text: q.q,
    ...withOptions(r, q.a, q.d),
    explanation: q.why,
    difficulty: 2,
  }));
};
const cloze: Gen = (r) => {
  const c = pick(r, CLOZE);
  return c.blanks.map((b, i): QBody => ({
    passage: c.text,
    text: `Choose the most appropriate word for blank (${i + 1}).`,
    ...withOptions(r, b.a, b.d),
    explanation: `'${b.a}' fits both grammar and context of blank (${i + 1}).`,
    difficulty: 2,
  }));
};
const parajumble: Gen = (r) => {
  const j = pick(r, JUMBLES);
  const labels = ["P", "Q", "R", "S"];
  const order = shuffle(r, [0, 1, 2, 3]); // order[k] = sentence index shown with label k
  const correct = [0, 1, 2, 3].map((si) => labels[order.indexOf(si)]).join("");
  const perms = new Set<string>();
  while (perms.size < 6) perms.add(shuffle(r, labels).join(""));
  return {
    text: `Rearrange the sentences P, Q, R, S into a meaningful paragraph:\n${order.map((si, k) => `${labels[k]}. ${j[si]}`).join("\n")}`,
    ...withOptions(r, correct, [...perms]),
    explanation: `Correct order: ${correct}. Start with the sentence that introduces the subject; connectors such as 'therefore', 'hence', 'this' come later.`,
    difficulty: 2,
  };
};

export const ENGLISH_GENERATORS: Record<string, Gen> = {
  "e-rc": rc,
  "e-error": errorSpot,
  "e-fillers": fillers,
  "e-cloze": cloze,
  "e-parajumble": parajumble,
  "e-synonyms": synonyms,
  "e-antonyms": antonyms,
  "e-idioms": idioms,
  "e-ows": ows,
  "e-spelling": spelling,
  "e-improvement": improvement,
  "e-voice": voice,
};

export const VOCAB_LIST = VOCAB;
export const IDIOM_LIST = IDIOMS;
export const OWS_LIST = OWS;
