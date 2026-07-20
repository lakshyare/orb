/* ===== NEWS.JS ===== */
var newsDB = {

    multiplayer: {
        title: 'Multiplayer PvP Arena is LIVE',
        date:  'July 1, 2026',
        img:   'assets/Hero1.png',
        badge: 'NEW FEATURE',
        summary: 'Battle real players in real time. Create a room, share the code, fight.',
        body: [
            'The most requested feature is finally here. orb now has real-time PvP multiplayer — create a private room, share a 6-character code with a friend, and battle head to head.',
            'Room settings let the host choose between deck modes: your own deck, mirror (both use the same deck), legendaries only, epics only, or commons only.',
            'A turn timer keeps matches moving. If you take too long, a card is auto-played. No more waiting forever.',
            'Profile avatars now show in the lobby so you can see who you\'re up against before the battle starts.',
            'Multiplayer uses Supabase for real-time sync. Rooms auto-delete after 2 hours. Find the PVP tab in the battle menu to get started.'
        ]
    },

    winners: {
        title: 'Create-a-Card Winners Revealed',
        date:  'June 28, 2026',
        img:   'cards/Quetzalcoatlus.jpg',
        badge: 'EVENT',
        summary: 'Quetzalcoatlus takes 1st. Centaur takes 2nd. Nxflower takes 3rd.',
        body: [
            'The community has spoken. After hundreds of submissions and thousands of votes, the Create-a-Card event winners are official.',
            '1st place goes to Quetzalcoatlus — a massive Air-type Epic with 335 HP and 240 DMG. The community loved its design and lore.',
            '2nd place goes to Centaur — a Phantom-type Epic at 310 HP and 280 DMG. A balanced powerhouse.',
            '3rd place goes to Nxflower — artwork is still being finalized. The card will be added to the game once the art is ready.',
            'All winning cards are now obtainable from packs. Thank you to everyone who submitted and voted. The next event is being planned.'
        ]
    },

    update: {
        title: 'Lucky Wheel, Avatars & Big Update',
        date:  'June 15, 2026',
        img:   'assets/Hero2.png',
        badge: 'PATCH NOTES',
        summary: 'Stumble Guys-style lucky wheel, Skribbl.io avatars, draw phase in battles.',
        body: [
            'A big update has landed across the entire game. Here is what changed.',
            'The Lucky Wheel is fully redesigned — Stumble Guys-style with neon corner lights, a spinning wheel visible on the left, and prizes shown on the right panel. Spin once daily.',
            'Profile avatars now use a Skribbl.io-style blob character. Choose your body color, eyes, and mouth from the profile editor. Your avatar shows in the multiplayer lobby.',
            'The battle draw phase now works properly in both single-player and multiplayer. Draw from the pile, pick a card, choose ATK or DEF.',
            'Bot cooldowns are now active — bots cannot use the same card twice in a row, just like players. Drag and drop from collection to deck now works reliably in the arena.'
        ]
    }
}