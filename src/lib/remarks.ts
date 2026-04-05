export const generateRemarks = async (qualities: string, studentName: string): Promise<string> => {
  const cleanQualities = qualities
    .split(",")
    .map((q) => q.trim())
    .filter((q) => q.length > 0);

  // Positive sentence openers
  const openers = [
    `${studentName}, you have exhibited an excellent attitude towards learning this term.`,
    `It is truly a pleasure to witness your growth in the classroom, ${studentName}.`,
    `You are a standout student with a bright future ahead of you, ${studentName}.`,
    `${studentName}, your enthusiasm and commitment to your studies are highly commendable.`,
    `You consistently contribute a positive energy to our school community, ${studentName}.`,
    `${studentName}, I am very proud of the maturity and dedication you've shown recently.`,
    `Your active participation and curious mind make you a joy to teach, ${studentName}.`,
    `${studentName}, you have established a strong foundation for yourself through your hard work.`
  ];

  // Specific trait-based sentences (Second Person)
  const traitTemplates: Record<string, string[]> = {
    disciplined: [
      "Your self-discipline and focus are exemplary.",
      "You manage your time and responsibilities with great care."
    ],
    creative: [
      "Your creative thinking brings a unique perspective to our projects.",
      "The imaginative way you approach problems is truly impressive."
    ],
    kind: [
      "Your kindness toward your peers creates a welcoming environment.",
      "The empathy you show others is a wonderful quality to possess."
    ],
    focused: [
      "Your ability to remain attentive and focused is a major strength.",
      "You show great determination by staying on task during complex lessons."
    ],
    helpful: [
      "Your willingness to assist others makes a huge difference in our class.",
      "It is wonderful to see how you are always ready to lend a helping hand."
    ],
    leadership: [
      "You demonstrate natural leadership qualities that inspire your classmates.",
      "Taking initiative is one of your strongest suits, and it shows in your results."
    ],
    default: [
      `You are recognized as being ${qualities || "a dedicated learner"}, which reflects your character.`,
      `The way you balance your academic and social traits is very impressive.`
    ]
  };

  const closingSentences = [
    "Keep up this fantastic momentum as we move into the next academic phase!",
    "Continue to challenge yourself, and you will achieve great heights.",
    "Wishing you continued success and happiness in all your future endeavors.",
    "Your progress is a testament to your hard work; keep striving for excellence!",
    "I look forward to seeing you reach even more milestones in the coming months."
  ];

  // Logic to build a unique remark
  const opener = openers[Math.abs(studentName.length + (cleanQualities[0]?.length || 0)) % openers.length];
  
  // Try to find a trait-specific sentence
  let traitSentence = "";
  const foundTrait = cleanQualities.find(q => traitTemplates[q.toLowerCase()]);
  if (foundTrait) {
    const options = traitTemplates[foundTrait.toLowerCase()];
    traitSentence = options[studentName.length % options.length];
  } else {
    const options = traitTemplates.default;
    traitSentence = options[studentName.length % options.length];
  }

  const closer = closingSentences[Math.abs(studentName.length - cleanQualities.length) % closingSentences.length];

  return `${opener} ${traitSentence} ${closer}`;
};
