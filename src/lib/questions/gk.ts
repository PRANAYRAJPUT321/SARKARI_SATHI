import { pick, sample, withOptions, type Rng } from "./rng";
import type { Gen, QBody } from "./types";

type Pair = [string, string];

/** A fact table generates "What is the X of Y?" questions with distractors from the same table. */
function fromTable(table: Pair[], q: (k: string) => string, why?: (k: string, v: string) => string, reverse?: (v: string) => string): Gen {
  return (r: Rng): QBody => {
    const [k, v] = pick(r, table);
    if (reverse && r() < 0.35) {
      const d = sample(r, table.filter((x) => x[1] !== v), 6).map((x) => x[0]);
      return { text: reverse(v), ...withOptions(r, k, d), explanation: why ? why(k, v) : `${k} → ${v}.`, difficulty: 1 };
    }
    const d = Array.from(new Set(table.filter((x) => x[1] !== v).map((x) => x[1])));
    return { text: q(k), ...withOptions(r, v, sample(r, d, 6)), explanation: why ? why(k, v) : `${k} → ${v}.`, difficulty: 1 };
  };
}

// ───────────── Banking & finance ─────────────
const FULLFORMS: Pair[] = [
  ["CRR", "Cash Reserve Ratio"], ["SLR", "Statutory Liquidity Ratio"], ["MSF", "Marginal Standing Facility"], ["SDF", "Standing Deposit Facility"],
  ["NEFT", "National Electronic Funds Transfer"], ["RTGS", "Real Time Gross Settlement"], ["IMPS", "Immediate Payment Service"], ["UPI", "Unified Payments Interface"],
  ["NPA", "Non-Performing Asset"], ["KYC", "Know Your Customer"], ["CASA", "Current Account Savings Account"], ["MCLR", "Marginal Cost of Funds based Lending Rate"],
  ["NBFC", "Non-Banking Financial Company"], ["NACH", "National Automated Clearing House"], ["IFSC", "Indian Financial System Code"], ["MICR", "Magnetic Ink Character Recognition"],
  ["DICGC", "Deposit Insurance and Credit Guarantee Corporation"], ["NPCI", "National Payments Corporation of India"], ["CIBIL", "Credit Information Bureau (India) Limited"],
  ["LAF", "Liquidity Adjustment Facility"], ["OMO", "Open Market Operations"], ["CBS", "Core Banking Solution"], ["ECS", "Electronic Clearing Service"],
  ["FDI", "Foreign Direct Investment"], ["GDP", "Gross Domestic Product"], ["CPI", "Consumer Price Index"], ["WPI", "Wholesale Price Index"], ["GST", "Goods and Services Tax"],
];

const HQ: Pair[] = [
  ["Reserve Bank of India", "Mumbai"], ["SEBI", "Mumbai"], ["NABARD", "Mumbai"], ["SIDBI", "Lucknow"], ["EXIM Bank", "Mumbai"], ["IRDAI", "Hyderabad"],
  ["PFRDA", "New Delhi"], ["International Monetary Fund", "Washington, D.C."], ["World Bank", "Washington, D.C."], ["World Trade Organization", "Geneva"],
  ["Asian Development Bank", "Manila"], ["Asian Infrastructure Investment Bank", "Beijing"], ["New Development Bank (BRICS)", "Shanghai"], ["UNESCO", "Paris"],
  ["World Health Organization", "Geneva"], ["International Labour Organization", "Geneva"], ["UNICEF", "New York"], ["Bank for International Settlements", "Basel"],
  ["International Court of Justice", "The Hague"], ["Food and Agriculture Organization", "Rome"], ["SAARC Secretariat", "Kathmandu"], ["ASEAN Secretariat", "Jakarta"],
  ["OPEC", "Vienna"], ["International Atomic Energy Agency", "Vienna"],
];

const BANKING_FACTS: { q: string; a: string; d: string[]; why?: string }[] = [
  { q: "In which year was the Reserve Bank of India established?", a: "1935", d: ["1947", "1949", "1969", "1921"], why: "RBI was established on 1 April 1935 under the RBI Act, 1934." },
  { q: "In which year was the RBI nationalised?", a: "1949", d: ["1935", "1947", "1950", "1969"] },
  { q: "Who was the first Indian Governor of the RBI?", a: "C. D. Deshmukh", d: ["Osborne Smith", "Manmohan Singh", "Y. V. Reddy", "J. B. Taylor"] },
  { q: "Who was the first Governor of the RBI?", a: "Sir Osborne Smith", d: ["C. D. Deshmukh", "Sir James Taylor", "B. Rama Rau", "H. V. R. Iengar"] },
  { q: "How many banks were nationalised in India in July 1969?", a: "14", d: ["6", "10", "20", "12"] },
  { q: "How many banks were nationalised in 1980?", a: "6", d: ["14", "8", "4", "10"] },
  { q: "Under the deposit insurance scheme of DICGC, bank deposits are insured up to:", a: "₹5 lakh per depositor per bank", d: ["₹1 lakh", "₹2 lakh", "₹10 lakh", "₹50,000"], why: "Limit raised from ₹1 lakh to ₹5 lakh in February 2020." },
  { q: "Which body sets the repo rate in India?", a: "Monetary Policy Committee of RBI", d: ["Ministry of Finance", "NITI Aayog", "SEBI", "Parliament"] },
  { q: "How many members are there in the Monetary Policy Committee?", a: "6", d: ["5", "7", "8", "4"] },
  { q: "What is the inflation target set for the RBI under flexible inflation targeting?", a: "4% CPI inflation with a band of ±2%", d: ["2% WPI inflation", "6% CPI ± 1%", "5% WPI ± 2%", "3% CPI ± 1%"] },
  { q: "The minimum amount that can be transferred through RTGS is:", a: "₹2 lakh", d: ["₹1 lakh", "₹50,000", "No minimum", "₹5 lakh"] },
  { q: "UPI was launched in the year:", a: "2016", d: ["2014", "2015", "2018", "2012"] },
  { q: "SLR is maintained by banks in the form of:", a: "Liquid assets such as cash, gold and approved securities with the bank itself", d: ["Cash with RBI", "Loans to priority sector", "Foreign currency", "Fixed deposits with SBI"] },
  { q: "CRR is the portion of deposits that banks must keep with:", a: "The Reserve Bank of India", d: ["Themselves as gold", "SEBI", "Government of India", "NABARD"] },
  { q: "Which institution is known as the 'lender of last resort' in India?", a: "Reserve Bank of India", d: ["SBI", "NABARD", "Ministry of Finance", "SIDBI"] },
  { q: "NABARD was established in the year:", a: "1982", d: ["1969", "1975", "1990", "1988"] },
  { q: "SEBI was given statutory powers in the year:", a: "1992", d: ["1988", "1995", "2000", "1985"] },
  { q: "Goods and Services Tax (GST) was implemented in India from:", a: "1 July 2017", d: ["1 April 2017", "1 January 2018", "1 July 2016", "1 April 2018"] },
  { q: "Pradhan Mantri Jan Dhan Yojana was launched in:", a: "2014", d: ["2015", "2016", "2012", "2019"] },
  { q: "The financial year in India runs from:", a: "1 April to 31 March", d: ["1 January to 31 December", "1 July to 30 June", "1 October to 30 September", "1 March to 28 February"] },
  { q: "NITI Aayog replaced the Planning Commission on:", a: "1 January 2015", d: ["15 August 2014", "26 January 2015", "1 April 2015", "2 October 2014"] },
  { q: "A 'bear market' refers to a market in which prices are:", a: "Falling", d: ["Rising", "Stable", "Regulated", "Fixed"] },
  { q: "The Banking Regulation Act was enacted in:", a: "1949", d: ["1934", "1956", "1969", "1991"] },
  { q: "Which committee is associated with banking sector reforms in 1991?", a: "Narasimham Committee", d: ["Rangarajan Committee", "Malhotra Committee", "Kelkar Committee", "Nachiket Mor Committee"] },
  { q: "Which committee recommended reforms in the insurance sector (1993)?", a: "Malhotra Committee", d: ["Narasimham Committee", "Raghuram Rajan Committee", "Abid Hussain Committee", "Chakravarty Committee"] },
];

// ───────────── Polity ─────────────
const ARTICLES: Pair[] = [
  ["Article 14", "Equality before law"], ["Article 17", "Abolition of untouchability"], ["Article 19", "Protection of certain rights regarding freedom of speech, etc."],
  ["Article 21", "Protection of life and personal liberty"], ["Article 21A", "Right to education"], ["Article 32", "Right to constitutional remedies"],
  ["Article 44", "Uniform Civil Code"], ["Article 51A", "Fundamental Duties"], ["Article 72", "Pardoning power of the President"],
  ["Article 110", "Definition of Money Bills"], ["Article 112", "Annual Financial Statement (Budget)"], ["Article 280", "Finance Commission"],
  ["Article 312", "All India Services"], ["Article 324", "Election Commission"], ["Article 352", "National Emergency"], ["Article 356", "President's Rule in States"],
  ["Article 360", "Financial Emergency"], ["Article 368", "Amendment of the Constitution"], ["Article 343", "Official language of the Union"], ["Article 148", "Comptroller and Auditor General of India"],
];
const POLITY_FACTS: { q: string; a: string; d: string[] }[] = [
  { q: "Who was the Chairman of the Drafting Committee of the Indian Constitution?", a: "Dr. B. R. Ambedkar", d: ["Dr. Rajendra Prasad", "Jawaharlal Nehru", "Sardar Patel", "K. M. Munshi"] },
  { q: "The Constitution of India came into force on:", a: "26 January 1950", d: ["15 August 1947", "26 November 1949", "26 January 1949", "2 October 1950"] },
  { q: "Fundamental Rights are contained in which part of the Constitution?", a: "Part III", d: ["Part II", "Part IV", "Part IVA", "Part V"] },
  { q: "Directive Principles of State Policy are borrowed from the constitution of:", a: "Ireland", d: ["USA", "UK", "Canada", "Australia"] },
  { q: "The concept of Fundamental Duties was borrowed from:", a: "USSR", d: ["USA", "Japan", "France", "Germany"] },
  { q: "Fundamental Duties were added by which Constitutional Amendment?", a: "42nd Amendment, 1976", d: ["44th Amendment, 1978", "73rd Amendment, 1992", "86th Amendment, 2002", "52nd Amendment, 1985"] },
  { q: "How many Schedules are there in the Indian Constitution at present?", a: "12", d: ["8", "10", "11", "14"] },
  { q: "The Panchayati Raj system was given constitutional status by the:", a: "73rd Amendment", d: ["74th Amendment", "42nd Amendment", "61st Amendment", "86th Amendment"] },
  { q: "The minimum age to become a member of the Lok Sabha is:", a: "25 years", d: ["21 years", "30 years", "35 years", "18 years"] },
  { q: "The minimum age to become the President of India is:", a: "35 years", d: ["30 years", "25 years", "40 years", "45 years"] },
  { q: "Who presides over a joint sitting of the two Houses of Parliament?", a: "Speaker of the Lok Sabha", d: ["President", "Vice-President", "Prime Minister", "Chief Justice of India"] },
  { q: "The voting age was reduced from 21 to 18 years by the:", a: "61st Amendment", d: ["42nd Amendment", "44th Amendment", "52nd Amendment", "73rd Amendment"] },
  { q: "Who is the ex-officio Chairman of the Rajya Sabha?", a: "Vice-President of India", d: ["President of India", "Speaker", "Prime Minister", "Chief Justice"] },
  { q: "The Right to Property was removed from Fundamental Rights by the:", a: "44th Amendment, 1978", d: ["42nd Amendment, 1976", "24th Amendment", "1st Amendment", "86th Amendment"] },
];

// ───────────── History ─────────────
const BATTLES: Pair[] = [
  ["First Battle of Panipat", "1526"], ["Second Battle of Panipat", "1556"], ["Third Battle of Panipat", "1761"], ["Battle of Plassey", "1757"],
  ["Battle of Buxar", "1764"], ["Battle of Haldighati", "1576"], ["Battle of Talikota", "1565"], ["First Battle of Tarain", "1191"], ["Second Battle of Tarain", "1192"],
  ["Battle of Khanwa", "1527"], ["Battle of Wandiwash", "1760"],
];
const FOUNDERS: Pair[] = [
  ["Brahmo Samaj", "Raja Ram Mohan Roy"], ["Arya Samaj", "Swami Dayanand Saraswati"], ["Ramakrishna Mission", "Swami Vivekananda"], ["Satyashodhak Samaj", "Jyotiba Phule"],
  ["Indian National Congress", "A. O. Hume"], ["Servants of India Society", "Gopal Krishna Gokhale"], ["Ghadar Party", "Lala Har Dayal"], ["Forward Bloc", "Subhas Chandra Bose"],
  ["Prarthana Samaj", "Atmaram Pandurang"], ["Theosophical Society (India HQ, Adyar)", "Madame Blavatsky & Col. Olcott"], ["Swaraj Party", "C. R. Das and Motilal Nehru"], ["Aligarh Movement", "Sir Syed Ahmad Khan"],
];
const HISTORY_FACTS: { q: string; a: string; d: string[] }[] = [
  { q: "The Jallianwala Bagh massacre took place in:", a: "1919", d: ["1920", "1917", "1922", "1930"] },
  { q: "The Dandi March (Salt Satyagraha) started in:", a: "1930", d: ["1920", "1942", "1928", "1932"] },
  { q: "The Quit India Movement was launched in:", a: "1942", d: ["1940", "1930", "1945", "1920"] },
  { q: "The Non-Cooperation Movement was launched in:", a: "1920", d: ["1919", "1930", "1922", "1942"] },
  { q: "Who was the first Governor-General of independent India?", a: "Lord Mountbatten", d: ["C. Rajagopalachari", "Lord Wavell", "Lord Linlithgow", "Lord Irwin"] },
  { q: "Who was the first Indian Governor-General of India?", a: "C. Rajagopalachari", d: ["Lord Mountbatten", "Dr. Rajendra Prasad", "Jawaharlal Nehru", "Sardar Patel"] },
  { q: "The Partition of Bengal was announced by Lord Curzon in:", a: "1905", d: ["1911", "1909", "1919", "1947"] },
  { q: "Who gave the slogan 'Do or Die'?", a: "Mahatma Gandhi", d: ["Subhas Chandra Bose", "Bhagat Singh", "Bal Gangadhar Tilak", "Jawaharlal Nehru"] },
  { q: "Who gave the slogan 'Swaraj is my birthright and I shall have it'?", a: "Bal Gangadhar Tilak", d: ["Lala Lajpat Rai", "Mahatma Gandhi", "Gopal Krishna Gokhale", "Bipin Chandra Pal"] },
  { q: "The first session of the Indian National Congress was held at:", a: "Bombay (1885)", d: ["Calcutta (1886)", "Madras (1887)", "Lahore (1885)", "Allahabad (1888)"] },
  { q: "Who founded the Mughal Empire in India?", a: "Babur", d: ["Akbar", "Humayun", "Sher Shah Suri", "Aurangzeb"] },
  { q: "The Revolt of 1857 began at:", a: "Meerut", d: ["Delhi", "Lucknow", "Kanpur", "Jhansi"] },
];

// ───────────── Geography ─────────────
const CAPITALS: Pair[] = [
  ["Andhra Pradesh", "Amaravati"], ["Arunachal Pradesh", "Itanagar"], ["Assam", "Dispur"], ["Bihar", "Patna"], ["Chhattisgarh", "Raipur"], ["Goa", "Panaji"],
  ["Gujarat", "Gandhinagar"], ["Haryana", "Chandigarh"], ["Himachal Pradesh", "Shimla"], ["Jharkhand", "Ranchi"], ["Karnataka", "Bengaluru"], ["Kerala", "Thiruvananthapuram"],
  ["Madhya Pradesh", "Bhopal"], ["Maharashtra", "Mumbai"], ["Manipur", "Imphal"], ["Meghalaya", "Shillong"], ["Mizoram", "Aizawl"], ["Nagaland", "Kohima"],
  ["Odisha", "Bhubaneswar"], ["Rajasthan", "Jaipur"], ["Sikkim", "Gangtok"], ["Tamil Nadu", "Chennai"], ["Telangana", "Hyderabad"], ["Tripura", "Agartala"],
  ["Uttar Pradesh", "Lucknow"], ["Uttarakhand", "Dehradun"], ["West Bengal", "Kolkata"],
];
const DANCES: Pair[] = [
  ["Bharatanatyam", "Tamil Nadu"], ["Kathakali", "Kerala"], ["Kuchipudi", "Andhra Pradesh"], ["Odissi", "Odisha"], ["Manipuri", "Manipur"], ["Sattriya", "Assam"],
  ["Mohiniyattam", "Kerala"], ["Kathak", "Uttar Pradesh"], ["Garba", "Gujarat"], ["Bihu", "Assam"], ["Lavani", "Maharashtra"], ["Ghoomar", "Rajasthan"],
  ["Bhangra", "Punjab"], ["Yakshagana", "Karnataka"], ["Chhau", "Jharkhand / Odisha / West Bengal"], ["Raut Nacha", "Chhattisgarh"],
];
const PARKS: Pair[] = [
  ["Jim Corbett National Park", "Uttarakhand"], ["Kaziranga National Park", "Assam"], ["Gir National Park", "Gujarat"], ["Ranthambore National Park", "Rajasthan"],
  ["Sundarbans National Park", "West Bengal"], ["Bandipur National Park", "Karnataka"], ["Periyar National Park", "Kerala"], ["Kanha National Park", "Madhya Pradesh"],
  ["Tadoba Andhari Tiger Reserve", "Maharashtra"], ["Keoladeo National Park", "Rajasthan"], ["Silent Valley National Park", "Kerala"], ["Dudhwa National Park", "Uttar Pradesh"],
  ["Hemis National Park", "Ladakh"], ["Simlipal National Park", "Odisha"], ["Bandhavgarh National Park", "Madhya Pradesh"], ["Namdapha National Park", "Arunachal Pradesh"],
];
const DAMS: Pair[] = [
  ["Bhakra Nangal Dam", "Sutlej"], ["Hirakud Dam", "Mahanadi"], ["Tehri Dam", "Bhagirathi"], ["Sardar Sarovar Dam", "Narmada"], ["Nagarjuna Sagar Dam", "Krishna"],
  ["Mettur Dam", "Kaveri"], ["Tungabhadra Dam", "Tungabhadra"], ["Indira Sagar Dam", "Narmada"], ["Koyna Dam", "Koyna"], ["Idukki Dam", "Periyar"],
];
const GEO_FACTS: { q: string; a: string; d: string[] }[] = [
  { q: "Which is the largest state of India by area?", a: "Rajasthan", d: ["Madhya Pradesh", "Maharashtra", "Uttar Pradesh", "Gujarat"] },
  { q: "Which is the smallest state of India by area?", a: "Goa", d: ["Sikkim", "Tripura", "Mizoram", "Manipur"] },
  { q: "The Tropic of Cancer passes through how many Indian states?", a: "8", d: ["6", "7", "9", "10"] },
  { q: "Which is the longest river of India?", a: "Ganga", d: ["Godavari", "Yamuna", "Brahmaputra", "Narmada"] },
  { q: "Which river is known as the 'Dakshin Ganga'?", a: "Godavari", d: ["Krishna", "Kaveri", "Mahanadi", "Tungabhadra"] },
  { q: "Which river is called the 'Sorrow of Bihar'?", a: "Kosi", d: ["Gandak", "Son", "Ganga", "Damodar"] },
  { q: "Which river is called the 'Sorrow of Bengal'?", a: "Damodar", d: ["Hooghly", "Teesta", "Kosi", "Mahanadi"] },
  { q: "Which is the highest mountain peak in the world?", a: "Mount Everest", d: ["K2", "Kangchenjunga", "Lhotse", "Makalu"] },
  { q: "The Palk Strait separates India from:", a: "Sri Lanka", d: ["Maldives", "Myanmar", "Bangladesh", "Indonesia"] },
  { q: "Which Indian state has the longest coastline?", a: "Gujarat", d: ["Andhra Pradesh", "Tamil Nadu", "Maharashtra", "Kerala"] },
  { q: "Black soil is most suitable for the cultivation of:", a: "Cotton", d: ["Rice", "Tea", "Wheat", "Jute"] },
  { q: "The Western Ghats are also known as:", a: "Sahyadri", d: ["Nilgiri", "Aravalli", "Vindhya", "Satpura"] },
];

// ───────────── Science ─────────────
const VITAMINS: Pair[] = [
  ["Vitamin A", "Night blindness"], ["Vitamin B1 (Thiamine)", "Beriberi"], ["Vitamin B3 (Niacin)", "Pellagra"], ["Vitamin B12", "Pernicious anaemia"],
  ["Vitamin C", "Scurvy"], ["Vitamin D", "Rickets"], ["Vitamin K", "Delayed blood clotting"],
];
const UNITS: Pair[] = [
  ["Force", "Newton"], ["Energy", "Joule"], ["Power", "Watt"], ["Pressure", "Pascal"], ["Electric current", "Ampere"], ["Electric resistance", "Ohm"],
  ["Frequency", "Hertz"], ["Temperature (SI)", "Kelvin"], ["Luminous intensity", "Candela"], ["Amount of substance", "Mole"], ["Electric charge", "Coulomb"], ["Magnetic flux", "Weber"],
];
const CHEM: Pair[] = [
  ["Common salt", "NaCl"], ["Baking soda", "NaHCO₃"], ["Washing soda", "Na₂CO₃·10H₂O"], ["Quicklime", "CaO"], ["Slaked lime", "Ca(OH)₂"],
  ["Plaster of Paris", "CaSO₄·½H₂O"], ["Laughing gas", "N₂O"], ["Dry ice", "Solid CO₂"], ["Marsh gas", "Methane (CH₄)"], ["Bleaching powder", "CaOCl₂"],
  ["Blue vitriol", "CuSO₄·5H₂O"], ["Heavy water", "D₂O"],
];
const INVENTIONS: Pair[] = [
  ["Telephone", "Alexander Graham Bell"], ["Electric bulb", "Thomas Edison"], ["Radio", "Guglielmo Marconi"], ["Penicillin", "Alexander Fleming"],
  ["World Wide Web", "Tim Berners-Lee"], ["Dynamite", "Alfred Nobel"], ["Steam engine (improved)", "James Watt"], ["Aeroplane", "Wright Brothers"],
  ["Television", "John Logie Baird"], ["Theory of Relativity", "Albert Einstein"], ["Laws of Motion", "Isaac Newton"], ["Vaccination (smallpox)", "Edward Jenner"],
];
const SCI_FACTS: { q: string; a: string; d: string[] }[] = [
  { q: "Which is the largest organ of the human body?", a: "Skin", d: ["Liver", "Heart", "Brain", "Lungs"] },
  { q: "Which is the largest gland in the human body?", a: "Liver", d: ["Pancreas", "Thyroid", "Pituitary", "Adrenal"] },
  { q: "The normal human body temperature is about:", a: "37 °C", d: ["35 °C", "39 °C", "40 °C", "32 °C"] },
  { q: "Which blood group is known as the universal donor?", a: "O negative", d: ["AB positive", "A positive", "B negative", "AB negative"] },
  { q: "The powerhouse of the cell is:", a: "Mitochondria", d: ["Nucleus", "Ribosome", "Golgi body", "Lysosome"] },
  { q: "Speed of light in vacuum is approximately:", a: "3 × 10⁸ m/s", d: ["3 × 10⁶ m/s", "3 × 10⁵ km/s", "1.5 × 10⁸ m/s", "340 m/s"] },
  { q: "Sound cannot travel through:", a: "Vacuum", d: ["Water", "Steel", "Air", "Wood"] },
  { q: "The pH value of pure water is:", a: "7", d: ["0", "5", "9", "14"] },
  { q: "Which gas is most abundant in the Earth's atmosphere?", a: "Nitrogen", d: ["Oxygen", "Carbon dioxide", "Argon", "Hydrogen"] },
  { q: "Which metal is liquid at room temperature?", a: "Mercury", d: ["Sodium", "Gallium", "Lead", "Aluminium"] },
  { q: "Photosynthesis takes place in:", a: "Chloroplasts", d: ["Mitochondria", "Nucleus", "Vacuole", "Cell wall"] },
  { q: "Lens used to correct myopia (short-sightedness) is:", a: "Concave lens", d: ["Convex lens", "Bifocal lens", "Cylindrical lens", "Plano-convex lens"] },
  { q: "Which part of the plant conducts water from roots to leaves?", a: "Xylem", d: ["Phloem", "Stomata", "Cambium", "Cortex"] },
  { q: "The SI unit of work is the same as that of:", a: "Energy", d: ["Power", "Force", "Momentum", "Pressure"] },
];

// ───────────── Static GK ─────────────
const DAYS: Pair[] = [
  ["World Environment Day", "5 June"], ["International Yoga Day", "21 June"], ["World Health Day", "7 April"], ["National Youth Day (India)", "12 January"],
  ["National Science Day (India)", "28 February"], ["International Women's Day", "8 March"], ["World Water Day", "22 March"], ["Earth Day", "22 April"],
  ["National Sports Day (India)", "29 August"], ["Teachers' Day (India)", "5 September"], ["Hindi Diwas", "14 September"], ["World Literacy Day", "8 September"],
  ["Constitution Day (India)", "26 November"], ["Human Rights Day", "10 December"], ["National Statistics Day (India)", "29 June"], ["National Space Day (India)", "23 August"],
];
const TROPHIES: Pair[] = [
  ["Ranji Trophy", "Cricket"], ["Durand Cup", "Football"], ["Santosh Trophy", "Football"], ["Davis Cup", "Tennis"], ["Thomas Cup", "Badminton"],
  ["Uber Cup", "Badminton"], ["Beighton Cup", "Hockey"], ["Ryder Cup", "Golf"], ["Stanley Cup", "Ice hockey"], ["Duleep Trophy", "Cricket"], ["Agha Khan Cup", "Hockey"],
];
const CURRENT_FACTS: { q: string; a: string; d: string[] }[] = [
  { q: "India held the G20 Presidency and hosted the G20 Leaders' Summit in New Delhi in:", a: "2023", d: ["2022", "2024", "2021", "2025"] },
  { q: "Chandrayaan-3's lander touched down near the lunar south pole on:", a: "23 August 2023", d: ["14 July 2023", "15 August 2023", "2 September 2023", "22 July 2019"] },
  { q: "The 2024 Summer Olympic Games were held in:", a: "Paris", d: ["Los Angeles", "Tokyo", "Brisbane", "London"] },
  { q: "Which country won the ICC Men's T20 World Cup 2024?", a: "India", d: ["South Africa", "Australia", "England", "Pakistan"] },
  { q: "Which country won the ICC Champions Trophy 2025?", a: "India", d: ["New Zealand", "Australia", "Pakistan", "England"] },
  { q: "The Bharatiya Nyaya Sanhita, which replaced the IPC, came into force on:", a: "1 July 2024", d: ["1 January 2024", "26 January 2024", "15 August 2023", "1 April 2024"] },
  { q: "Who became the 26th Governor of the Reserve Bank of India in December 2024?", a: "Sanjay Malhotra", d: ["Shaktikanta Das", "Urjit Patel", "Michael Patra", "T. Rabi Sankar"] },
  { q: "The constitutional amendment providing one-third reservation for women in Lok Sabha and State Assemblies (2023) is known as:", a: "Nari Shakti Vandan Adhiniyam", d: ["Beti Bachao Act", "Mahila Samman Act", "Stree Shakti Adhiniyam", "Ujjwala Adhiniyam"] },
  { q: "The Digital Personal Data Protection Act was passed by Parliament in:", a: "2023", d: ["2019", "2021", "2024", "2022"] },
  { q: "National Space Day in India is observed on 23 August to mark the landing of:", a: "Chandrayaan-3", d: ["Mangalyaan", "Aditya-L1", "Chandrayaan-2", "Gaganyaan"] },
];
const RAILWAY_ZONES: Pair[] = [
  ["Northern Railway", "New Delhi"], ["Western Railway", "Mumbai (Churchgate)"], ["Central Railway", "Mumbai (CSMT)"], ["Eastern Railway", "Kolkata"],
  ["Southern Railway", "Chennai"], ["South Central Railway", "Secunderabad"], ["South Eastern Railway", "Kolkata (Garden Reach)"], ["North Eastern Railway", "Gorakhpur"],
  ["Northeast Frontier Railway", "Maligaon (Guwahati)"], ["East Central Railway", "Hajipur"], ["North Western Railway", "Jaipur"], ["East Coast Railway", "Bhubaneswar"],
  ["North Central Railway", "Prayagraj"], ["South East Central Railway", "Bilaspur"], ["South Western Railway", "Hubballi"], ["West Central Railway", "Jabalpur"],
  ["Metro Railway", "Kolkata"], ["South Coast Railway", "Visakhapatnam"],
];
const RAIL_FACTS: { q: string; a: string; d: string[] }[] = [
  { q: "India's first passenger train ran between Bori Bunder (Bombay) and Thane on:", a: "16 April 1853", d: ["15 August 1854", "1 January 1850", "26 January 1860", "16 April 1863"] },
  { q: "The Rail Coach Factory is located at:", a: "Kapurthala", d: ["Chennai", "Varanasi", "Chittaranjan", "Bengaluru"] },
  { q: "The Integral Coach Factory (ICF) is located in:", a: "Chennai (Perambur)", d: ["Kapurthala", "Rae Bareli", "Varanasi", "Kolkata"] },
  { q: "The Chittaranjan Locomotive Works is in which state?", a: "West Bengal", d: ["Jharkhand", "Bihar", "Odisha", "Uttar Pradesh"] },
  { q: "Vande Bharat Express was first flagged off in 2019 between:", a: "New Delhi and Varanasi", d: ["Mumbai and Ahmedabad", "Chennai and Mysuru", "New Delhi and Katra", "Howrah and Puri"] },
];
const COMPUTER: Pair[] = [
  ["CPU", "Central Processing Unit"], ["RAM", "Random Access Memory"], ["ROM", "Read Only Memory"], ["URL", "Uniform Resource Locator"], ["HTTP", "HyperText Transfer Protocol"],
  ["LAN", "Local Area Network"], ["WAN", "Wide Area Network"], ["USB", "Universal Serial Bus"], ["BIOS", "Basic Input Output System"], ["ASCII", "American Standard Code for Information Interchange"],
  ["PDF", "Portable Document Format"], ["GUI", "Graphical User Interface"], ["DNS", "Domain Name System"], ["IP", "Internet Protocol"], ["SMTP", "Simple Mail Transfer Protocol"],
];
const COMP_FACTS: { q: string; a: string; d: string[] }[] = [
  { q: "Who is known as the father of the computer?", a: "Charles Babbage", d: ["Alan Turing", "John von Neumann", "Bill Gates", "Tim Berners-Lee"] },
  { q: "1 Kilobyte (KB) is equal to:", a: "1024 bytes", d: ["1000 bytes", "1024 bits", "512 bytes", "2048 bytes"] },
  { q: "The keyboard shortcut to undo an action is:", a: "Ctrl + Z", d: ["Ctrl + Y", "Ctrl + U", "Ctrl + X", "Ctrl + D"] },
  { q: "Which of the following is an input device?", a: "Scanner", d: ["Monitor", "Printer", "Speaker", "Plotter"] },
  { q: "Which of the following is NOT an operating system?", a: "Oracle", d: ["Linux", "Windows", "macOS", "Android"] },
];

const factList = (facts: { q: string; a: string; d: string[]; why?: string }[]): Gen => (r) => {
  const f = pick(r, facts);
  return { text: f.q, ...withOptions(r, f.a, f.d), explanation: f.why ?? `Answer: ${f.a}.`, difficulty: 1 };
};
const mix = (...gens: Gen[]): Gen => (r) => pick(r, gens)(r);

export const GK_GENERATORS: Record<string, Gen> = {
  "g-banking": mix(
    factList(BANKING_FACTS),
    factList(BANKING_FACTS),
    fromTable(FULLFORMS, (k) => `What is the full form of ${k}?`, (k, v) => `${k} stands for ${v}.`),
    fromTable(HQ, (k) => `Where is the headquarters of ${k}?`, (k, v) => `${k} is headquartered in ${v}.`),
  ),
  "g-economy": mix(factList(BANKING_FACTS.slice(16)), fromTable(FULLFORMS.slice(24), (k) => `What does ${k} stand for?`)),
  "g-polity": mix(factList(POLITY_FACTS), fromTable(ARTICLES, (k) => `${k} of the Indian Constitution deals with:`, (k, v) => `${k}: ${v}.`, (v) => `Which Article of the Constitution deals with "${v}"?`)),
  "g-history": mix(
    factList(HISTORY_FACTS),
    fromTable(BATTLES, (k) => `In which year was the ${k} fought?`),
    fromTable(FOUNDERS, (k) => `Who founded the ${k}?`, (k, v) => `${k} was founded by ${v}.`),
  ),
  "g-geography": mix(
    factList(GEO_FACTS),
    fromTable(CAPITALS, (k) => `What is the capital of ${k}?`, (k, v) => `The capital of ${k} is ${v}.`, (v) => `${v} is the capital of which state?`),
    fromTable(DANCES, (k) => `${k} is a dance form associated with which state?`),
    fromTable(PARKS, (k) => `${k} is located in which state/UT?`),
    fromTable(DAMS, (k) => `${k} is built on which river?`),
  ),
  "g-science": mix(
    factList(SCI_FACTS),
    factList(SCI_FACTS),
    fromTable(VITAMINS, (k) => `Deficiency of ${k} causes:`, undefined, (v) => `${v} is caused by the deficiency of:`),
    fromTable(UNITS, (k) => `What is the SI unit of ${k.toLowerCase()}?`, undefined, (v) => `${v} is the SI unit of:`),
    fromTable(CHEM, (k) => `What is the chemical formula/name of ${k.toLowerCase()}?`),
    fromTable(INVENTIONS, (k) => `Who is credited with the ${k}?`),
  ),
  "g-static": mix(
    fromTable(DAYS, (k) => `${k} is observed on:`, undefined, (v) => `Which day is observed on ${v}?`),
    fromTable(TROPHIES, (k) => `The ${k} is associated with which sport?`),
    fromTable(HQ, (k) => `Where is the headquarters of ${k}?`),
  ),
  "g-railways": mix(factList(RAIL_FACTS), fromTable(RAILWAY_ZONES, (k) => `What is the headquarters of ${k}?`, (k, v) => `${k} is headquartered at ${v}.`)),
  "g-current": factList(CURRENT_FACTS),
  "g-computer": mix(factList(COMP_FACTS), fromTable(COMPUTER, (k) => `In computers, what is the full form of ${k}?`)),
};

/** Flashcards for the revision page */
export const FLASHCARDS: { deck: string; items: Pair[] }[] = [
  { deck: "Banking Abbreviations", items: FULLFORMS },
  { deck: "Headquarters", items: HQ },
  { deck: "Constitution Articles", items: ARTICLES },
  { deck: "Battles & Years", items: BATTLES },
  { deck: "State Capitals", items: CAPITALS },
  { deck: "Classical & Folk Dances", items: DANCES },
  { deck: "National Parks", items: PARKS },
  { deck: "Dams & Rivers", items: DAMS },
  { deck: "Vitamins & Deficiency", items: VITAMINS },
  { deck: "SI Units", items: UNITS },
  { deck: "Chemical Names", items: CHEM },
  { deck: "Important Days", items: DAYS },
  { deck: "Sports Trophies", items: TROPHIES },
  { deck: "Railway Zones", items: RAILWAY_ZONES },
  { deck: "Computer Abbreviations", items: COMPUTER },
];
