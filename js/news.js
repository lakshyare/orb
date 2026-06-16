/* ===== NEWS.JS ===== */
/* Add or edit articles here. Each key = the ID used in openNews('key') */
/* body: array of paragraphs — each string is one <p> block              */

var newsDB = {

    bat: {
        title: 'Phantom Type Bat Revealed',
        date:  'March 27, 2026',
        img:   'cards/Bat.jpg',
        badge: 'NEW CARD',
        summary: 'Silent, fast, and vicious. The Bat strikes from the shadows.',
        body: [
            'Silent, fast, and vicious. The Bat card arrives as orb\'s first Phantom type, bringing a whole new strategic dimension to deck building.',
            'With 265 HP and 305 DMG, the Bat punishes opponents who overcommit to attack. Its shadowy nature means it thrives in decks that cycle quickly.',
            'The Phantom type is designed to counter Magic cards and be weak against Air. Build your deck around this new dynamic.',
            'Look for the Bat in Epic Packs — it\'s a guaranteed epic drop. Stack your packs and hunt for it.'
        ]
    },

    arena2: {
        title: 'New Arena Themes',
        date:  'March 27, 2026',
        img:   'assets/Hero1.png',
        badge: 'UPDATE',
        summary: 'Customize your combat layout with visually stunning backgrounds.',
        body: [
            'Customize your combat layout with visually stunning dynamic backgrounds, now available in the Shop.',
            'The Obsidian Forge Arena transforms your board into a volcanic battlefield — dark stone, ember glow, and a brooding atmosphere that puts your opponents on edge.',
            'The Ice Tundra Arena brings a frozen, crystalline battlefield covered in geometric frost patterns. Perfect for Water and Air deck players.',
            'More themes are in development. The Classic Oak Arena remains free and default for all players. Unlock the others with gold earned from battles and daily rewards.'
        ]
    },

    update: {
        title: 'The Mega Update Details',
        date:  'March 27, 2026',
        img:   'assets/Hero2.png',
        badge: 'PATCH NOTES',
        summary: 'Lucky wheel, pity drops, avatar editor, and daily objectives.',
        body: [
            'The biggest orb update yet has landed. Here\'s everything that changed.',
            'The Lucky Wheel has been completely redesigned with a Stumble Guys-inspired layout — neon lights, corner glows, and a satisfying spin animation.',
            'A pity drop system now guarantees an Epic card every 10 common packs and a Legendary every 5 Epics. No more bad luck streaks.',
            'The Profile Card now supports a full canvas avatar editor with Skribbl.io-style characters, eye styles, and mouth styles.',
            'Daily and weekly objectives now reset properly and give meaningful rewards. The progress section on the home page has been polished significantly.'
        ]
    }

    /* ── ADD NEW ARTICLES BELOW ──────────────────────────────────────────
    ,myarticle: {
        title:   'Article Title Here',
        date:    'June 11, 2026',
        img:     'your-image.jpg',
        badge:   'NEWS',          // shown as a pill: NEW CARD / UPDATE / etc
        summary: 'One line shown in the news grid preview.',
        body: [
            'First paragraph.',
            'Second paragraph.',
            'Third paragraph.'
        ]
    }
    ─────────────────────────────────────────────────────────────────── */
};