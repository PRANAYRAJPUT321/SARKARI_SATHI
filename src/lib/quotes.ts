export const QUOTES = [
  { q: "Arise, awake, and stop not till the goal is reached.", a: "Swami Vivekananda" },
  { q: "You have to dream before your dreams can come true.", a: "Dr. A. P. J. Abdul Kalam" },
  { q: "Success is the sum of small efforts, repeated day in and day out.", a: "Robert Collier" },
  { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
  { q: "Don't watch the clock; do what it does. Keep going.", a: "Sam Levenson" },
  { q: "Discipline is choosing between what you want now and what you want most.", a: "Abraham Lincoln" },
  { q: "If you want to shine like a sun, first burn like a sun.", a: "Dr. A. P. J. Abdul Kalam" },
  { q: "Strength does not come from winning. Your struggles develop your strengths.", a: "Arnold Schwarzenegger" },
  { q: "Take up one idea. Make that one idea your life.", a: "Swami Vivekananda" },
  { q: "It always seems impossible until it's done.", a: "Nelson Mandela" },
  { q: "One mock a day keeps the rejection away.", a: "Sarkari Sathi" },
  { q: "Accuracy first, speed next – negative marking forgives no one.", a: "Sarkari Sathi" },
  { q: "The expert in anything was once a beginner.", a: "Helen Hayes" },
  { q: "Excellence is a continuous process and not an accident.", a: "Dr. A. P. J. Abdul Kalam" },
];
export const quoteOfDay = (key: string) => QUOTES[key.split("-").reduce((a, b) => a + Number(b), 0) % QUOTES.length];
