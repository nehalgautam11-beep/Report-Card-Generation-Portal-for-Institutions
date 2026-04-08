export const generateRemarks = async (qualities: string, studentName: string): Promise<string> => {
  // Parsing qualities into a clean list
  const cleanQualities = qualities
    .split(",")
    .map((q) => q.trim())
    .filter((q) => q.length > 0);

  // Fallback if no qualities provided
  if (cleanQualities.length === 0) {
    return `${studentName}, you have displayed excellent performance and behavior. Keep up the good work in the upcoming academic term!`;
  }

  // Constructing a dynamic sentence based on traits
  let traitsString = "";
  if (cleanQualities.length === 1) {
    traitsString = cleanQualities[0];
  } else if (cleanQualities.length === 2) {
    traitsString = `${cleanQualities[0]} and ${cleanQualities[1]}`;
  } else {
    const last = cleanQualities.pop();
    traitsString = `${cleanQualities.join(", ")}, and ${last}`;
  }

  // Creating a 1000% reliable programmatic string that meets the requirement
  // Using direct second person to completely avoid gendered pronouns
  const remarks = [
    `${studentName}, you have shown commendable effort this term, particularly being recognized as ${traitsString}. It is important to maintain this positive momentum moving forward.`,
    `It has been a pleasure having you in class, ${studentName}. You have proven to be ${traitsString}, which reflects greatly on your academics. Keep it up!`,
    `${studentName}, you are a valuable student who consistently displays traits like being ${traitsString}. Wishing you the absolute best for your next term.`
  ];

  // Pick a pseudo-random remark based on name length to give a sense of variety
  const randomIndex = studentName.length % remarks.length;
  
  return remarks[randomIndex];
};
