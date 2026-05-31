import type {
  EnergyLevel,
  Gender,
  PersonalityTraits,
  ProfileDTO,
  TasteProfile,
} from "@hearth/shared";

/** A demo person — enough to derive a ProfileDTO and a TasteProfile. */
export interface DemoPerson {
  userId: string;
  displayName: string;
  age: number;
  gender: Gender;
  seekingGenders: Gender[];
  city: string;
  bio: string;
  interests: string[];
  values: string[];
  traits: PersonalityTraits;
  energyLevel: EnergyLevel;
  dealbreakers: string[];
  summary: string;
  /** In the demo, these people "like back" so a Like becomes a mutual match. */
  likesBack: boolean;
}

function traits(
  introversion: number,
  adventurousness: number,
  warmth: number,
  ambition: number,
  playfulness: number,
): PersonalityTraits {
  return { introversion, adventurousness, warmth, ambition, playfulness };
}

export function photosFor(seed: string): string[] {
  return [
    `https://i.pravatar.cc/600?u=${encodeURIComponent(seed)}`,
    `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/800`,
  ];
}

export function tasteOf(p: DemoPerson): TasteProfile {
  return {
    interests: p.interests,
    values: p.values,
    personalityTraits: p.traits,
    dealbreakers: p.dealbreakers,
    idealDateVibe: "relaxed and genuine",
    energyLevel: p.energyLevel,
  };
}

export function profileOf(p: DemoPerson, onboardingComplete = true): ProfileDTO {
  return {
    id: `profile-${p.userId}`,
    userId: p.userId,
    displayName: p.displayName,
    age: p.age,
    gender: p.gender,
    seekingGenders: p.seekingGenders,
    bio: p.bio,
    city: p.city,
    photoUrls: photosFor(p.userId),
    interests: p.interests,
    tasteProfileSummary: p.summary,
    onboardingComplete,
  };
}

export const DEMO_USER: DemoPerson = {
  userId: "demo",
  displayName: "Demo",
  age: 29,
  gender: "woman",
  seekingGenders: ["man", "nonbinary"],
  city: "Portland",
  bio: "Trail coffee enthusiast, weekend potter, always chasing good light.",
  interests: ["hiking", "coffee", "pottery", "live music", "photography"],
  values: ["authenticity", "curiosity", "kindness"],
  traits: traits(0.45, 0.7, 0.8, 0.6, 0.7),
  energyLevel: "high",
  dealbreakers: ["smoking"],
  summary:
    "A warm, adventurous creative who lives for trailheads, pour-overs, and golden-hour photo walks. Looking for someone curious and kind to explore the city with.",
  likesBack: false,
};

export const DEMO_CANDIDATES: DemoPerson[] = [
  {
    userId: "marco",
    displayName: "Marco",
    age: 31,
    gender: "man",
    seekingGenders: ["woman"],
    city: "Portland",
    bio: "Backcountry hiker and amateur barista. I will absolutely judge your espresso.",
    interests: ["hiking", "coffee", "photography", "camping", "cycling"],
    values: ["authenticity", "curiosity", "adventure"],
    traits: traits(0.4, 0.85, 0.75, 0.65, 0.6),
    energyLevel: "high",
    dealbreakers: ["smoking"],
    summary:
      "An easygoing adventurer who plans trips around trailheads and good coffee. Genuine, curious, and happiest outdoors.",
    likesBack: true,
  },
  {
    userId: "theo",
    displayName: "Theo",
    age: 28,
    gender: "man",
    seekingGenders: ["woman", "nonbinary"],
    city: "Portland",
    bio: "Ceramics studio regular, vinyl hoarder, slow-morning person.",
    interests: ["pottery", "live music", "coffee", "reading", "vinyl"],
    values: ["creativity", "authenticity", "kindness"],
    traits: traits(0.6, 0.55, 0.85, 0.5, 0.7),
    energyLevel: "medium",
    dealbreakers: [],
    summary:
      "A gentle creative who throws pots, collects records, and takes mornings slow. Warm, thoughtful, and a great listener.",
    likesBack: true,
  },
  {
    userId: "noah",
    displayName: "Noah",
    age: 27,
    gender: "man",
    seekingGenders: ["woman", "nonbinary"],
    city: "Portland",
    bio: "Jazz drummer by night, coffee roaster by day. Foodie forever.",
    interests: ["live music", "coffee", "food", "drums", "vinyl"],
    values: ["creativity", "authenticity", "joy"],
    traits: traits(0.45, 0.65, 0.85, 0.55, 0.85),
    energyLevel: "high",
    dealbreakers: [],
    summary:
      "A playful musician and coffee nerd who treats the city like a tasting menu. Warm, expressive, and always up for live music.",
    likesBack: false,
  },
  {
    userId: "june",
    displayName: "June",
    age: 30,
    gender: "nonbinary",
    seekingGenders: ["woman", "nonbinary"],
    city: "Portland",
    bio: "Gallery wanderer, film photographer, plant overcollector.",
    interests: ["photography", "art", "coffee", "plants", "live music"],
    values: ["creativity", "curiosity", "growth"],
    traits: traits(0.55, 0.6, 0.7, 0.6, 0.65),
    energyLevel: "medium",
    dealbreakers: [],
    summary:
      "A visual thinker who fills weekends with galleries, film rolls, and houseplants. Curious and creative with a calm energy.",
    likesBack: true,
  },
  {
    userId: "felix",
    displayName: "Felix",
    age: 35,
    gender: "man",
    seekingGenders: ["woman"],
    city: "Portland",
    bio: "Trail runner, astrophotographer, into long drives and longer playlists.",
    interests: ["running", "photography", "music", "hiking", "camping"],
    values: ["adventure", "curiosity", "calm"],
    traits: traits(0.5, 0.8, 0.7, 0.6, 0.6),
    energyLevel: "high",
    dealbreakers: [],
    summary:
      "An outdoorsy romantic who runs trails and chases the stars with a camera. Adventurous, easygoing, and big on a good playlist.",
    likesBack: false,
  },
  {
    userId: "owen",
    displayName: "Owen",
    age: 32,
    gender: "man",
    seekingGenders: ["woman"],
    city: "Portland",
    bio: "Librarian energy. Tea, trails, and a very opinionated bookshelf.",
    interests: ["reading", "hiking", "tea", "writing", "history"],
    values: ["depth", "curiosity", "kindness"],
    traits: traits(0.75, 0.5, 0.8, 0.55, 0.5),
    energyLevel: "medium",
    dealbreakers: [],
    summary:
      "A thoughtful introvert who loves long reads, quiet trails, and a good pot of tea. Deep, warm, and genuinely curious.",
    likesBack: false,
  },
];
