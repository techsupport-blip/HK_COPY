import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import {
  scoreCompatibility,
  type EnergyLevel,
  type Gender,
  type PersonalityTraits,
  type TasteProfile,
} from "@hearth/shared";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

interface SeedUser {
  email: string;
  displayName: string;
  age: number;
  gender: Gender;
  seekingGenders: Gender[];
  city: string;
  lat: number;
  lng: number;
  bio: string;
  interests: string[];
  values: string[];
  traits: PersonalityTraits;
  energyLevel: EnergyLevel;
  dealbreakers: string[];
  summary: string;
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

const CITY = { name: "Portland", lat: 45.515, lng: -122.678 };

/** The pre-onboarded account you can log into immediately. */
const DEMO: SeedUser = {
  email: "demo@hearth.app",
  displayName: "Demo",
  age: 29,
  gender: "woman",
  seekingGenders: ["man", "nonbinary"],
  city: CITY.name,
  lat: CITY.lat,
  lng: CITY.lng,
  bio: "Trail coffee enthusiast, weekend potter, always chasing good light.",
  interests: ["hiking", "coffee", "pottery", "live music", "photography"],
  values: ["authenticity", "curiosity", "kindness"],
  traits: traits(0.45, 0.7, 0.8, 0.6, 0.7),
  energyLevel: "high",
  dealbreakers: ["smoking"],
  summary:
    "A warm, adventurous creative who lives for trailheads, pour-overs, and golden-hour photo walks. Looking for someone curious and kind to explore the city with.",
};

const CANDIDATES: SeedUser[] = [
  {
    email: "marco@hearth.app",
    displayName: "Marco",
    age: 31,
    gender: "man",
    seekingGenders: ["woman"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Backcountry hiker and amateur barista. I will absolutely judge your espresso.",
    interests: ["hiking", "coffee", "photography", "camping", "cycling"],
    values: ["authenticity", "curiosity", "adventure"],
    traits: traits(0.4, 0.85, 0.75, 0.65, 0.6),
    energyLevel: "high",
    dealbreakers: ["smoking"],
    summary:
      "An easygoing adventurer who plans trips around trailheads and good coffee. Genuine, curious, and happiest outdoors.",
  },
  {
    email: "theo@hearth.app",
    displayName: "Theo",
    age: 28,
    gender: "man",
    seekingGenders: ["woman", "nonbinary"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Ceramics studio regular, vinyl hoarder, slow-morning person.",
    interests: ["pottery", "live music", "coffee", "reading", "vinyl"],
    values: ["creativity", "authenticity", "kindness"],
    traits: traits(0.6, 0.55, 0.85, 0.5, 0.7),
    energyLevel: "medium",
    dealbreakers: [],
    summary:
      "A gentle creative who throws pots, collects records, and takes mornings slow. Warm, thoughtful, and a great listener.",
  },
  {
    email: "june@hearth.app",
    displayName: "June",
    age: 30,
    gender: "nonbinary",
    seekingGenders: ["woman", "nonbinary"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Gallery wanderer, film photographer, plant overcollector.",
    interests: ["photography", "art", "coffee", "plants", "live music"],
    values: ["creativity", "curiosity", "growth"],
    traits: traits(0.55, 0.6, 0.7, 0.6, 0.65),
    energyLevel: "medium",
    dealbreakers: [],
    summary:
      "A visual thinker who fills weekends with galleries, film rolls, and houseplants. Curious and creative with a calm energy.",
  },
  {
    email: "sam@hearth.app",
    displayName: "Sam",
    age: 33,
    gender: "man",
    seekingGenders: ["woman"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Marathoner, meal-prepper, startup PM. Mountains on weekends.",
    interests: ["running", "hiking", "cooking", "startups", "cycling"],
    values: ["ambition", "growth", "discipline"],
    traits: traits(0.35, 0.7, 0.6, 0.9, 0.5),
    energyLevel: "high",
    dealbreakers: [],
    summary:
      "A driven, active type who runs long, cooks big, and builds product. Ambitious but down to earth, and loves a mountain weekend.",
  },
  {
    email: "noah@hearth.app",
    displayName: "Noah",
    age: 27,
    gender: "man",
    seekingGenders: ["woman", "nonbinary"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Jazz drummer by night, coffee roaster by day. Foodie forever.",
    interests: ["live music", "coffee", "food", "drums", "vinyl"],
    values: ["creativity", "authenticity", "joy"],
    traits: traits(0.45, 0.65, 0.85, 0.55, 0.85),
    energyLevel: "high",
    dealbreakers: [],
    summary:
      "A playful musician and coffee nerd who treats the city like a tasting menu. Warm, expressive, and always up for live music.",
  },
  {
    email: "liam@hearth.app",
    displayName: "Liam",
    age: 34,
    gender: "man",
    seekingGenders: ["woman"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Climber, chess club, terrible puns. Big on board game nights.",
    interests: ["climbing", "chess", "board games", "hiking", "reading"],
    values: ["curiosity", "loyalty", "humor"],
    traits: traits(0.5, 0.75, 0.7, 0.6, 0.8),
    energyLevel: "medium",
    dealbreakers: [],
    summary:
      "A witty problem-solver who climbs, plots chess openings, and hosts game nights. Loyal, curious, and quick to laugh.",
  },
  {
    email: "ethan@hearth.app",
    displayName: "Ethan",
    age: 29,
    gender: "man",
    seekingGenders: ["woman", "nonbinary"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Wine bar regular, weekend painter, smoker of fine cigars.",
    interests: ["wine", "painting", "smoking", "travel", "food"],
    values: ["leisure", "taste", "spontaneity"],
    traits: traits(0.5, 0.6, 0.6, 0.5, 0.6),
    energyLevel: "low",
    dealbreakers: [],
    summary:
      "A relaxed aesthete who paints, travels, and lingers over wine. Enjoys the finer, slower things. (Note: a cigar smoker.)",
  },
  {
    email: "kai@hearth.app",
    displayName: "Kai",
    age: 26,
    gender: "man",
    seekingGenders: ["woman", "nonbinary"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Surfer turned river kayaker, documentary binger, taco scholar.",
    interests: ["kayaking", "surfing", "food", "photography", "camping"],
    values: ["adventure", "freedom", "authenticity"],
    traits: traits(0.4, 0.9, 0.7, 0.45, 0.75),
    energyLevel: "high",
    dealbreakers: [],
    summary:
      "An adventure-first spirit who chases water, tacos, and good documentaries. Free-spirited, warm, and game for anything outdoors.",
  },
  {
    email: "owen@hearth.app",
    displayName: "Owen",
    age: 32,
    gender: "man",
    seekingGenders: ["woman"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Librarian energy. Tea, trails, and a very opinionated bookshelf.",
    interests: ["reading", "hiking", "tea", "writing", "history"],
    values: ["depth", "curiosity", "kindness"],
    traits: traits(0.75, 0.5, 0.8, 0.55, 0.5),
    energyLevel: "medium",
    dealbreakers: [],
    summary:
      "A thoughtful introvert who loves long reads, quiet trails, and a good pot of tea. Deep, warm, and genuinely curious.",
  },
  {
    email: "ravi@hearth.app",
    displayName: "Ravi",
    age: 30,
    gender: "man",
    seekingGenders: ["woman", "nonbinary"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Home cook chasing the perfect dal. Cyclist. Sketchbook addict.",
    interests: ["cooking", "cycling", "art", "coffee", "photography"],
    values: ["creativity", "warmth", "growth"],
    traits: traits(0.5, 0.65, 0.85, 0.65, 0.7),
    energyLevel: "medium",
    dealbreakers: [],
    summary:
      "A creative home cook and cyclist who sketches on the side. Warm and generous, happiest feeding people and exploring on two wheels.",
  },
  {
    email: "felix@hearth.app",
    displayName: "Felix",
    age: 35,
    gender: "man",
    seekingGenders: ["woman"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Trail runner, astrophotographer, into long drives and longer playlists.",
    interests: ["running", "photography", "music", "hiking", "camping"],
    values: ["adventure", "curiosity", "calm"],
    traits: traits(0.5, 0.8, 0.7, 0.6, 0.6),
    energyLevel: "high",
    dealbreakers: [],
    summary:
      "An outdoorsy romantic who runs trails and chases the stars with a camera. Adventurous, easygoing, and big on a good playlist.",
  },
  {
    email: "diego@hearth.app",
    displayName: "Diego",
    age: 28,
    gender: "man",
    seekingGenders: ["woman", "nonbinary"],
    city: CITY.name,
    lat: CITY.lat,
    lng: CITY.lng,
    bio: "Salsa nights, street food crawls, and a camera that never sleeps.",
    interests: ["dancing", "food", "photography", "live music", "travel"],
    values: ["joy", "connection", "spontaneity"],
    traits: traits(0.3, 0.75, 0.9, 0.55, 0.9),
    energyLevel: "high",
    dealbreakers: [],
    summary:
      "A high-energy extrovert who dances, eats his way across the city, and documents it all. Joyful, social, and impossible not to like.",
  },
];

function buildTaste(u: SeedUser): TasteProfile {
  return {
    interests: u.interests,
    values: u.values,
    personalityTraits: u.traits,
    dealbreakers: u.dealbreakers,
    idealDateVibe: "relaxed and genuine",
    energyLevel: u.energyLevel,
  };
}

async function upsertUser(u: SeedUser, passwordHash: string) {
  const taste = buildTaste(u);
  const photoUrls = [
    `https://i.pravatar.cc/600?u=${encodeURIComponent(u.email)}`,
    `https://picsum.photos/seed/${encodeURIComponent(u.displayName)}/600/800`,
  ];
  const user = await prisma.user.upsert({
    where: { email: u.email },
    update: {},
    create: {
      email: u.email,
      passwordHash,
      interviewSession: { create: { status: "complete" } },
      profile: {
        create: {
          displayName: u.displayName,
          age: u.age,
          gender: u.gender,
          seekingGenders: JSON.stringify(u.seekingGenders),
          bio: u.bio,
          city: u.city,
          lat: u.lat,
          lng: u.lng,
          photoUrls: JSON.stringify(photoUrls),
          tasteProfile: JSON.stringify(taste),
          tasteProfileSummary: u.summary,
          onboardingComplete: true,
        },
      },
    },
    include: { profile: true },
  });
  return user;
}

async function main() {
  console.log("Seeding Hearth…");
  const passwordHash = await argon2.hash(DEMO_PASSWORD);

  const demo = await upsertUser(DEMO, passwordHash);
  const candidates = [];
  for (const c of CANDIDATES) {
    candidates.push(await upsertUser(c, passwordHash));
  }

  // Seed one ready-made mutual match + conversation so chat is instantly demoable.
  const partner = candidates[0]!; // Marco — highly compatible with Demo
  const demoTaste = buildTaste(DEMO);
  const partnerTaste = buildTaste(CANDIDATES[0]!);
  const breakdown = scoreCompatibility(demoTaste, partnerTaste);

  const a = demo.id < partner.id ? demo.id : partner.id;
  const b = demo.id < partner.id ? partner.id : demo.id;

  const match = await prisma.match.upsert({
    where: { userAId_userBId: { userAId: a, userBId: b } },
    update: {},
    create: {
      userAId: a,
      userBId: b,
      compatibilityScore: breakdown.total,
      scoreBreakdown: JSON.stringify(breakdown),
      rationale:
        "You both orbit the same world — trailheads, pour-over coffee, and a camera always within reach. Marco's easygoing adventurousness is a natural match for your curious, golden-hour energy.",
      userAState: "liked",
      userBState: "liked",
      mutual: true,
      surfacedDate: new Date().toISOString().slice(0, 10),
    },
  });

  const convo = await prisma.conversation.upsert({
    where: { matchId: match.id },
    update: {},
    create: { matchId: match.id, lastMessageAt: new Date() },
  });

  const existingMessages = await prisma.message.count({
    where: { conversationId: convo.id },
  });
  if (existingMessages === 0) {
    await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: partner.id,
        kind: "user",
        content:
          "Okay I have to ask — best trail-coffee setup you've used? I'm very serious about this.",
      },
    });
  }

  console.log(
    `Seeded ${candidates.length + 1} users (incl. demo@hearth.app / ${DEMO_PASSWORD}).`,
  );
  console.log(
    "Demo already has a mutual match + chat with Marco; generate matches to see the rest.",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
