/**
 * Interface for individual preset questions
 */
export interface PresetQuestion {
  text: string;
  description: string;
}

/**
 * Interface for preset question categories
 */
export interface QuestionCategory {
  title: string;
  icon: string;
  questions: PresetQuestion[];
}

/**
 * Preset questions data organized by categories
 */
export const PRESET_QUESTIONS: QuestionCategory[] = [
  {
    title: "General Questions",
    icon: "✨",
    questions: [
      {
        text: "What is Zi Wei Dou Shu?",
        description: "Learn the basics and history of Zi Wei Dou Shu (Purple Star Astrology)."
      },
      {
        text: "What does my chart say about my wealth potential?",
        description: "Explore your wealth palace and financial prospects using Zi Wei Dou Shu."
      },
      {
        text: "When is the best timing for important decisions?",
        description: "Use Zi Wei Dou Shu to identify auspicious periods for major life choices."
      },
      {
        text: "Can you interpret my Zi Wei Dou Shu chart?",
        description: "Get a personalized reading and understand your destiny map."
      }
    ]
  },
  {
    title: "Decision-Making Guidance",
    icon: "🧭",
    questions: [
      {
        text: "My Wealth Palace is active this month. Should I focus more on investing or saving?",
        description: "Helps you align short-term money moves with the palace that's influencing your wealth energy right now."
      },
      {
        text: "My Ming Gong is driven by [star]. What kind of business role suits that energy?",
        description: "Explore how your core destiny star reveals your ideal leadership style or business contribution."
      },
      {
        text: "If I have a timing window coming up, what kind of decisions should I not rush?",
        description: "Highlights moments where restraint can be wiser than action, based on your chart dynamics."
      },
      {
        text: "How do I align my actions with my 官禄宫 (Career Palace) energy this year?",
        description: "Guides your strategy by understanding what your Career Palace is asking you to focus on now."
      },
      {
        text: "What should I avoid doing if my 财帛宫 is currently weak?",
        description: "Warns you against money traps or distractions during times when your wealth palace needs support."
      }
    ]
  },
  {
    title: "Career & Money Alignment",
    icon: "💼",
    questions: [
      {
        text: "Based on my consultation, what are 3 questions I should ask myself before changing jobs?",
        description: "Frames deeper reflection on your job path, using the insights already uncovered in your reading."
      },
      {
        text: "My mentor has a strong 天相 — what does that mean for how I should work with them?",
        description: "Shows how to collaborate better based on your mentor's star energy and their role in your chart."
      },
      {
        text: "What does it mean if my chart showed strong side income timing, but I'm stuck?",
        description: "Helps troubleshoot misalignment when opportunities don't match the chart's potential — yet."
      }
    ]
  },
  {
    title: "Clarity & Self-Awareness",
    icon: "🧠",
    questions: [
      {
        text: "Remind me — how does a person with 紫微命宫 usually deal with pressure?",
        description: "Reveals how your core star processes challenge, power, and leadership under stress."
      },
      {
        text: "What's the difference between moving from 官禄宫 energy vs. 财帛宫 energy?",
        description: "Clarifies the subtle but powerful shift between career-driven and wealth-driven decisions."
      },
      {
        text: "How can I use my 命宫 insight to make better hiring decisions?",
        description: "Links your leadership style with hiring choices, based on who aligns with your core palace."
      },
      {
        text: "What does it mean to lead as a 天府 vs. lead as a 太阳?",
        description: "Compares different leadership archetypes so you can lead in a way that feels natural and powerful."
      }
    ]
  },
  {
    title: "Cycle & Inner Readiness",
    icon: "🔄",
    questions: [
      {
        text: "What part of me is a sleeping dragon — and how do I wake it up in this phase?",
        description: "Encourages self-activation by recognizing what strengths are dormant but charted to emerge."
      },
      {
        text: "If my chart is entering a new 10-year cycle, what should I stop clinging to?",
        description: "Supports letting go of outdated habits as you transition into a more aligned season."
      },
      {
        text: "How do I know if I'm meant to build, pivot, or pause right now?",
        description: "Helps decode your energetic position in the current cycle so you don't force the wrong move."
      },
      {
        text: "What emotional or mindset patterns are overdue for an upgrade?",
        description: "Targets internal patterns that may block your growth — even if external timing looks great."
      },
      {
        text: "How do I align with the 'next version of me' that this cycle is calling forward?",
        description: "Bridges your future potential with the present version of you ready to be activated."
      }
    ]
  }
];

/**
 * Utility function to get a random selection of questions
 */
export const getRandomQuestions = (count: number = 4): PresetQuestion[] => {
  const allQuestions: PresetQuestion[] = [];
  
  // Flatten all questions from all categories
  PRESET_QUESTIONS.forEach(category => {
    allQuestions.push(...category.questions);
  });
  
  // Shuffle array using Fisher-Yates algorithm
  const shuffled = [...allQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Return the requested number of questions
  return shuffled.slice(0, count);
}; 