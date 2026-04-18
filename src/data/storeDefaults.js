export const STORE_DEFAULTS = {
  vices: {
    binge_tv: [
      { name: "Unlock 1 guilt-free episode of a current show", cost: 300, emoji: "", category: "entertainment" },
      { name: "Movie night pass (Popcorn and zero interruptions)", cost: 800, emoji: "", category: "entertainment" },
      { name: "The Couch Potato Pass: 4 solid hours of unrestricted bingeing", cost: 1500, emoji: "", category: "entertainment" }
    ],
    social_media: [
      { name: "15 minutes of mindless Doomscrolling", cost: 150, emoji: "", category: "social" },
      { name: "30-minute deep dive into YouTube/Reddit rabbit holes", cost: 400, emoji: "", category: "social" },
      { name: "1 hour of completely unrestricted TikTok/Reels scrolling", cost: 900, emoji: "", category: "social" }
    ],
    online_shopping: [
      { name: "Window Shopping Pass: 30 mins to browse and build wishlists", cost: 200, emoji: "", category: "shopping" },
      { name: "Micro-Treat: Buy one small wishlist item (Under $15)", cost: 1000, emoji: "", category: "shopping" },
      { name: "Treat Yo' Self: Buy that one big expensive item you've wanted", cost: 3000, emoji: "", category: "shopping" }
    ],
    napping: [
      { name: "The Snooze Pass: Hit snooze once with zero guilt", cost: 150, emoji: "", category: "self_care" },
      { name: "Sleep In Weekend: Set your alarm 2 hours later than usual", cost: 600, emoji: "", category: "self_care" },
      { name: "The Bear Hibernation: Turn off all alarms and wake up naturally", cost: 1200, emoji: "", category: "self_care" }
    ],
    junk_food: [
      { name: "One small sweet treat or candy bar", cost: 250, emoji: "", category: "food" },
      { name: "Order out: Guilt-free fast food or takeout for dinner", cost: 800, emoji: "", category: "food" },
      { name: "The Ultimate Cheat Meal: Pizza, dessert, and a sugary drink", cost: 1500, emoji: "", category: "food" }
    ],
    gaming: [
      { name: "30 minutes of cozy/casual gaming", cost: 200, emoji: "", category: "gaming" },
      { name: "Play with the squad: 2 hours of multiplayer with friends", cost: 700, emoji: "", category: "gaming" },
      { name: "All-Nighter Pass: Unrestricted gaming session with zero chores", cost: 1800, emoji: "", category: "gaming" }
    ],
    coffee: [
      { name: "The Afternoon Boost: Allow yourself a second cup of coffee today", cost: 150, emoji: "", category: "food" },
      { name: "Cafe Upgrade: Buy a fancy, expensive drink from a local cafe", cost: 400, emoji: "", category: "food" },
      { name: "Premium Beans: Order a bag of high-end specialty coffee beans", cost: 1000, emoji: "", category: "food" }
    ],
    procrastination: [
      { name: "15-Minute 'Do Absolutely Nothing' Break", cost: 150, emoji: "", category: "self_care" },
      { name: "Skip a Daily: Get a free pass to skip one minor habit today", cost: 500, emoji: "", category: "self_care" },
      { name: "The Blank Canvas: A full afternoon with zero productivity allowed", cost: 1500, emoji: "", category: "self_care" }
    ]
  },
  sideQuests: {
    Gym_Fitness: [
      { name: "New Workout Gear", cost: 1200, emoji: "", category: "fitness" },
      { name: "Premium Protein Tub", cost: 800, emoji: "", category: "fitness" },
      { name: "Post-Workout Massage", cost: 1000, emoji: "", category: "fitness" }
    ],
    Coding: [
      { name: "Mechanical Keyboard Mod", cost: 1500, emoji: "", category: "learning" },
      { name: "Coding Course/Book", cost: 900, emoji: "", category: "learning" },
      { name: "Project Domain Name", cost: 500, emoji: "", category: "learning" }
    ],
    Guitar: [
      { name: "Fresh Pack of Strings", cost: 300, emoji: "", category: "hobby" },
      { name: "New Guitar Pedal", cost: 2000, emoji: "", category: "hobby" },
      { name: "Masterclass Access", cost: 1200, emoji: "", category: "hobby" }
    ],
    Education: [
      { name: "Premium Stationery", cost: 400, emoji: "", category: "learning" },
      { name: "Study Cafe Session", cost: 350, emoji: "", category: "learning" },
      { name: "iPad Pro Accessory", cost: 2000, emoji: "", category: "learning" }
    ],
    Singing: [
      { name: "Private Voice Lesson", cost: 1500, emoji: "", category: "hobby" },
      { name: "Studio Recording Hour", cost: 2000, emoji: "", category: "hobby" },
      { name: "High-Quality Water Flask", cost: 400, emoji: "", category: "health" }
    ],
    Sport: [
      { name: "Club Membership Month", cost: 1800, emoji: "", category: "fitness" },
      { name: "Pro Match Tickets", cost: 3000, emoji: "", category: "social" },
      { name: "New Sport Equipment", cost: 1500, emoji: "", category: "fitness" }
    ],
    Reading: [
      { name: "Signed Hardcover Book", cost: 1200, emoji: "", category: "hobby" },
      { name: "Cozy Reading Nook Item", cost: 600, emoji: "", category: "entertainment" },
      { name: "Kindle/E-Reader Skin", cost: 300, emoji: "", category: "hobby" }
    ],
    Gaming: [
      { name: "In-game Skin/Cosmetic", cost: 500, emoji: "", category: "gaming" },
      { name: "Collector's Edition Item", cost: 4000, emoji: "", category: "gaming" },
      { name: "Pro-Gamer Chair Upgrade", cost: 5000, emoji: "", category: "gaming" }
    ]
  }
};

export const GENERIC_DEFAULTS = [
  { name: "Small Treat", cost: 100, emoji: "", category: "other" },
  { name: "Lazy Hour", cost: 400, emoji: "", category: "self_care" },
  { name: "Coffee Date", cost: 350, emoji: "", category: "social" }
];
