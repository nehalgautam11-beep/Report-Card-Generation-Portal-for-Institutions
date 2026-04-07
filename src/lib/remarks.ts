const TITLE_PREFIXES = new Set([
  "ku",
  "ku.",
  "mast",
  "mast.",
  "master",
  "mr",
  "mr.",
  "ms",
  "ms.",
  "mrs",
  "mrs.",
  "miss",
  "kumari",
]);

const normalizeToken = (value: string): string =>
  value.toLowerCase().replace(/[^a-z]/g, "");

const toTitleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getPreferredFirstName = (studentName: string): string => {
  const parts = (studentName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Student";

  const first = normalizeToken(parts[0]);
  if (TITLE_PREFIXES.has(first) && parts[1]) {
    return toTitleCase(parts[1]);
  }

  return toTitleCase(parts[0]);
};

const parseQualities = (qualities: string): string[] =>
  (qualities || "")
    .split(",")
    .map((quality) => quality.trim())
    .filter(Boolean);

const createSeed = (studentName: string, qualities: string): number => {
  const input = `${studentName}|${qualities}`;
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }

  return hash;
};

const pick = (items: string[], seed: number, offset: number): string =>
  items[(seed + offset) % items.length];

const traitTemplates: Record<string, string[]> = {
  disciplined: [
    "Your disciplined approach helps you complete your work with consistency and care.",
    "The self-control and steady effort you show every day are truly commendable.",
    "You follow instructions responsibly and maintain a thoughtful approach to learning.",
  ],
  creative: [
    "Your creative ideas add freshness and originality to classroom activities.",
    "You bring imagination and confidence to the way you solve problems.",
    "The creative spark you show in your work makes your learning journey special.",
  ],
  kind: [
    "Your kindness makes the classroom more warm, respectful, and inclusive.",
    "You treat others with gentleness and care, which is a beautiful quality.",
    "The kindness you show to friends and teachers reflects strong values.",
  ],
  focused: [
    "Your ability to stay focused helps you make steady academic progress.",
    "You concentrate well in class and approach your tasks with seriousness.",
    "The attention you give to your work supports strong understanding and growth.",
  ],
  helpful: [
    "Your helpful nature brings comfort and support to your classmates.",
    "You are always willing to assist others, and that generosity stands out.",
    "The helpful attitude you carry each day adds positivity to the class.",
  ],
  leadership: [
    "You often set a positive example through your responsible and confident behavior.",
    "Your natural leadership qualities encourage others to participate and improve.",
    "The initiative you take in class reflects quiet confidence and maturity.",
  ],
  confident: [
    "Your confidence helps you participate actively and express your ideas clearly.",
    "You carry yourself with growing confidence, which strengthens your classroom presence.",
    "The confidence you show in your work is helping you develop well.",
  ],
  sincere: [
    "Your sincere effort and honest attitude are appreciated in every task.",
    "You approach learning with sincerity, and that quality supports long-term success.",
    "The seriousness and sincerity you show are strong foundations for progress.",
  ],
  responsible: [
    "You handle your responsibilities with maturity and dependability.",
    "Your responsible behavior shows that you can be trusted with important tasks.",
    "The sense of responsibility you display is a real strength.",
  ],
  curious: [
    "Your curiosity encourages deeper thinking and more meaningful learning.",
    "You ask thoughtful questions and show a genuine interest in understanding new ideas.",
    "The curious mindset you bring to lessons keeps your learning active and lively.",
  ],
  cheerful: [
    "Your cheerful presence brightens the classroom environment.",
    "You bring a joyful and positive spirit that makes learning more pleasant for everyone.",
    "The cheerful way you engage with school life is lovely to see.",
  ],
  polite: [
    "Your polite and respectful manner is appreciated by both teachers and classmates.",
    "You conduct yourself with courtesy, which reflects excellent upbringing.",
    "The politeness you show each day strengthens the classroom atmosphere.",
  ],
  hardworking: [
    "Your hard work is visible in the care and effort you put into your studies.",
    "You work diligently and show determination in completing your tasks well.",
    "The hardworking attitude you display is helping you move steadily forward.",
  ],
  diligent: [
    "You are diligent in your studies and careful in the way you complete your work.",
    "Your diligence is reflected in the neatness and consistency of your performance.",
    "The dedicated attention you give to your tasks is highly praiseworthy.",
  ],
  obedient: [
    "Your obedient and respectful conduct makes you a dependable member of the class.",
    "You listen carefully and respond well to guidance, which supports your progress.",
    "The obedient attitude you show helps maintain a disciplined learning environment.",
  ],
  punctual: [
    "Your punctual habits reflect a disciplined and organized mindset.",
    "You value time and routine, and that punctuality supports your progress.",
    "The punctuality you show each day is a strong and admirable habit.",
  ],
  cooperative: [
    "Your cooperative spirit helps group work become smooth and enjoyable.",
    "You work well with others and contribute positively to shared activities.",
    "The cooperative attitude you show strengthens teamwork in the classroom.",
  ],
  thoughtful: [
    "Your thoughtful nature is reflected in both your work and your interactions with others.",
    "You think carefully before acting, and that maturity is pleasing to see.",
    "The thoughtful way you approach learning adds depth to your progress.",
  ],
  enthusiastic: [
    "Your enthusiasm creates an energetic and encouraging classroom presence.",
    "You approach learning activities with excitement and a positive mindset.",
    "The enthusiasm you show makes your participation more meaningful and memorable.",
  ],
  smart: [
    "You show good understanding and the ability to grasp new concepts quickly.",
    "Your sharp thinking supports strong classroom performance.",
    "The intelligence you show in lessons is matched by your willingness to learn.",
  ],
};

const genericStrengths = [
  "You have shown encouraging growth in both academics and classroom behavior.",
  "Your overall conduct and effort reflect steady development this term.",
  "You continue to build a strong foundation through sincere participation and regular effort.",
  "It is pleasing to see the balanced progress you are making in school activities.",
  "Your attitude toward learning remains positive and dependable.",
  "You are developing into a sincere learner with many admirable qualities.",
  "The progress visible in your work reflects commitment and a good learning attitude.",
  "You have maintained a steady and positive presence throughout the term.",
];

const openers = [
  "{name}, you have made very pleasing progress this term.",
  "It has been a pleasure to watch your development this term, {name}.",
  "{name}, your efforts this term deserve warm appreciation.",
  "{name}, you have shown a commendable attitude toward learning and school life.",
  "I am happy with the progress you have made this term, {name}.",
  "{name}, you continue to grow into a confident and capable learner.",
  "{name}, your classroom journey this term has been encouraging to observe.",
  "{name}, you have displayed many positive qualities in your daily work.",
  "Your progress this term has been heartening to see, {name}.",
  "{name}, you have shown maturity and promise in many areas of school life.",
];

const supportSentences = [
  "You participate with interest and respond well to guidance in class.",
  "You are learning to apply your abilities in a thoughtful and consistent way.",
  "Your classroom behavior reflects respect, attention, and sincerity.",
  "You are becoming more confident in expressing your ideas and completing your tasks.",
  "Your steady effort is helping you gain better understanding day by day.",
  "You approach school work with a pleasing sense of responsibility.",
  "Your positive attitude contributes to a calm and encouraging classroom environment.",
  "You show the ability to learn well when you remain regular and attentive in your work.",
  "The effort you put into daily tasks is helping you strengthen your basics.",
  "Your conduct and participation indicate good potential for future growth.",
];

const closers = [
  "Keep up the good work.",
  "I wish you continued success in the coming term.",
  "Best wishes for even greater success ahead.",
  "Keep progressing with the same enthusiasm and sincerity.",
  "May you continue to learn, grow, and do well.",
  "I look forward to seeing your progress continue.",
  "Wishing you many more achievements in the next term.",
  "Continue with the same positive spirit and determination.",
  "Stay focused and keep making us proud.",
  "I am confident you will continue to do well.",
];

const buildTraitSentence = (qualities: string[], seed: number): string => {
  const normalizedTraits = qualities.map((quality) => normalizeToken(quality));
  const matchingTemplates = normalizedTraits
    .map((trait) => traitTemplates[trait])
    .filter((value): value is string[] => Boolean(value));

  if (matchingTemplates.length === 0) {
    return pick(genericStrengths, seed, 7);
  }

  const selectedGroup = matchingTemplates[seed % matchingTemplates.length];
  return pick(selectedGroup, seed, 11);
};

export const generateRemarks = async (qualities: string, studentName: string): Promise<string> => {
  const preferredName = getPreferredFirstName(studentName);
  const cleanQualities = parseQualities(qualities);
  const seed = createSeed(studentName, qualities);

  const opener = pick(openers, seed, 3).replace("{name}", preferredName);
  const middleSentence =
    seed % 2 === 0
      ? buildTraitSentence(cleanQualities, seed)
      : pick(supportSentences, seed, 13);
  const closer = pick(closers, seed, 19);

  return `${opener} ${middleSentence} ${closer}`;
};
