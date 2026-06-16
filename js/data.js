var allCards=[];
var TOTAL_CARDS=0;

function loadCards(){
    return fetch('cards.json')
        .then(function(res){ return res.json(); })
        .then(function(data){
            allCards=data;
            TOTAL_CARDS=allCards.length;
        })
.catch(function(err){
    console.error('cards.json failed to load',err);

    allCards=[];
    TOTAL_CARDS=0;
})
}


var achievementDefs=[
    {id:'money_money_money',cat:'Collection',icon:'💰',name:'Money! Money! Money!',desc:'Hold 5,000+ gold',reward:{gold:300,xp:70},check:function(){return coins>=5000;},progress:function(){return{current:Math.min(coins,5000),max:5000};}},
    {id:'on_fire',cat:'Battle',icon:'🔥',name:'On Fire!',desc:'Win 3 in a row',reward:{gold:220,xp:80},check:function(){return playerProfile.winStreak>=3;},progress:function(){return{current:Math.min(playerProfile.winStreak,3),max:3};}},
    {id:'underdog',cat:'Battle',icon:'🐺',name:'Underdog',desc:'Win with 1 card deck',reward:{gold:350,xp:120},check:function(){return false;},progress:function(){return{current:0,max:1};}},
    {id:'first_legendary',cat:'Collection',icon:'👑',name:'First Legendary',desc:'Pull a legendary',reward:{gold:250,xp:90},check:function(){return false;},progress:function(){return{current:playerProfile.firstLegendaryDate?1:0,max:1};}},
    {id:'the_goat',cat:'Collection',icon:'🐐',name:'The G.O.A.T',desc:'Collect every card',reward:{gold:1000,xp:300},check:function(){return[...new Set(myInventory)].length>=TOTAL_CARDS;},progress:function(){return{current:[...new Set(myInventory)].length,max:TOTAL_CARDS};}},
    {id:'first_bot_win',cat:'Battle',icon:'🏆',name:'1 Bot Down',desc:'Win first bot match',reward:{gold:180,xp:60},check:function(){return playerProfile.totalWins>=1;},progress:function(){return{current:Math.min(playerProfile.totalWins,1),max:1};}},
    {id:'dedicated',cat:'Loyalty',icon:'📅',name:'Dedicated',desc:'Visit 7 days in a row',reward:{gold:500,xp:140},check:function(){return getLoginStreak()>=7;},progress:function(){return{current:Math.min(getLoginStreak(),7),max:7};}},
    {id:'gauntlet_5',cat:'Battle',icon:'⚔️',name:'Gauntlet Runner',desc:'Reach stage 5',reward:{gold:400,xp:150},check:function(){return(playerProfile.gauntletBest||0)>=5;},progress:function(){return{current:Math.min(playerProfile.gauntletBest||0,5),max:5};}}
];

var dailyObjectiveTemplates=[
    {id:'open_pack_1',label:'Open 1 pack',type:'open_pack',target:1,reward:{gold:60,xp:18}},
    {id:'inspect_2',label:'Inspect 2 cards',type:'inspect_card',target:2,reward:{gold:45,xp:16}},
    {id:'visit_gallery',label:'Visit Gallery',type:'visit_gallery',target:1,reward:{gold:30,xp:14}},
    {id:'win_1',label:'Win 1 bot fight',type:'win_battle',target:1,reward:{gold:90,xp:24}},
    {id:'add_deck_1',label:'Add 1 card to deck',type:'add_deck',target:1,reward:{gold:40,xp:12}},
    {id:'claim_daily_reward',label:'Claim daily reward',type:'claim_daily_reward',target:1,reward:{gold:55,xp:15}},
    {id:'flip_3',label:'Flip 3 cards',type:'flip_card',target:3,reward:{gold:50,xp:15}},
    {id:'open_profile',label:'Open profile once',type:'open_profile',target:1,reward:{gold:25,xp:10}}
];
var weeklyObjectiveTemplates=[
    {id:'weekly_win_20',label:'Win 20 bot fights',type:'win_battle',target:20,reward:{gold:420,xp:150}},
    {id:'weekly_open_30',label:'Open 30 packs',type:'open_pack',target:30,reward:{gold:390,xp:140}},
    {id:'weekly_collect_12',label:'Collect 12 new cards',type:'collect_new',target:12,reward:{gold:480,xp:165}},
    {id:'weekly_inspect_90',label:'Inspect 90 cards',type:'inspect_card',target:90,reward:{gold:360,xp:130}}
];
var dailyRewards=[
    {day:1,gold:50,label:'50g'},{day:2,gold:100,label:'100g'},{day:3,gold:150,label:'150g'},
    {day:4,gold:200,label:'200g'},{day:5,gold:300,label:'300g'},{day:6,gold:400,label:'400g'},
    {day:7,gold:0,label:'EPIC PACK',special:'epic_pack'}
];

var realReviews=[
    {user:"g__ransh",stars:"★★★★★",text:"I really loveeee the bot battle feature heree 😤🔥"},
    {user:"aryannn",stars:"★★★★★",text:"Great website with beautiful card designs and smooth ordering 🎴"},
    {user:"VandanPaniPuri",stars:"★★★★★",text:"Finally pulled the Kirin! Pack opening animation is chef's kiss 👨‍🍳"},
    {user:"mtrr.ravya",stars:"★★★★★",text:"Best card game ever!! I beat my frnds every time 😂🔥"},
    {user:"AnAnonymousPotato",stars:"★★★★½",text:"This is clearly one of the best TCG sites I have visited in a while, and you should ask me what sites I have Not visited in my entire career as a TCG expert."},
    {user:"DamnnAgrii",stars:"★★★★★",text:"It was a magical experience exploring this site. it felt like getting into some mythological world."},
    {user:"jobo",stars:"★★★★★",text:"The bot fights feel very well designed."},
    {user:"notbarcelonawalilona",stars:"★★★★★",text:"I really like the card designs and it will be so fascinating to see them in real life:)"},
    {user:"Dare_devil24",stars:"★★★★★",text:"It is the nice website I like it 🤠😀😃"},
    {user:"SonamK",stars:"★★★★★",text:"It is impressive"},
    {user:"Msgorgeous",stars:"★★★★★",text:"Great to explore! and very nice cards creation ❤️"},
    {user:"jojo",stars:"★★★★★",text:"Nice cards love it"},
    {user:"anssshhh__",stars:"★★★★★",text:"I really love this game... even after losing all the matches I have played😂"},
    {user:"HogRider",stars:"★★★★★",text:"This is Epic"},
    {user:"Darshil Kumar",stars:"★★★★★",text:"Great game and well developed"},
    {user:"Archit",stars:"★★★★★",text:"10/10 game. Very awesome. I urge everyone to play it."},
    {user:"ranya",stars:"★★★★★",text:"Really well designed cards, with a lot of lore behind them 🤘🤌"},
    {user:"smallfyrfyter",stars:"★★★★★",text:"I really like the peacock card and gorilla and kirinand skeleton the cards here are amazing i absolutely luvv it!"},
    {user:"fyrfyter",stars:"★★★★★",text:"I think that game and my companion batz is very good but I got defeated by gorilla"},
    {user:"Madame Meowsieur",stars:"★★★★★",text:"Super cool dude with a super cool website and vision !!! All I can do is take a bow 🙇‍♀️ 🙌"},
    {user:"MSP",stars:"★★★★★",text:"Fab game! Cant wait for new updates!"},
    {user:"Chandan_Kumar",stars:"★★★★★",text:"The website is very good and I love the card designs alot! ❤️ It was very fun to play, I was enjoying to play the bot battles."},
    {user:"Am!t",stars:"★★★★★",text:"orb delivers a stunning visual experience with smooth gameplay beautifully designed cards. The UI, progression system, and overall theme feel premium and incredibly engaging :)"},
    {user:"shadwal",stars:"★★★★★",text:"Increadible looking UI, I can imagine today age children making platform as their childhood"},
    {user:"Strom",stars:"★★★★★",text:"The app / game looks great 😊 I tried a few features, and the look and feel are excellent. I'm looking forward to playing it more. I only found a few minor issues with some features."},
    {user:"SS_Master67",stars:"★★★★☆",text:"The website has a great background and a well-designed theme. The controls and color scheme work really well together, giving it a clean and visually appealing look."},
    {user:"Keshu24",stars:"★★★★☆",text:"Add more cards"},
    {user:"Akshita",stars:"★★★★☆",text:"The concept is really fun and creative, and the card designs feel fresh. I dont have any knowledge about these things so it's good but it definitely has potential to be addictive with more polish."},
    {user:"Sainyukta",stars:"★★★★★",text:"It's a great website and the card designs are very creative and beautiful."},
    {user:"madmax",stars:"★★★★★",text:"I have given the rating of 5/5 as it is very good and I wish you keep going and rocking as you always do."},
    {user:"somebody_2_goat",stars:"★★★★½",text:"A really good theme but the EUI could be better but other than that the fight bot feature is really cool."},
    {user:"Nayansh",stars:"★★★★½",text:"Gannuuu, u really cooked it. The website experience was so good that I was completely astonished. Keep doing great things, and yeah, don't forget to  keep this website interesting asf."}
];

var battleDifficultySettings={
    easy:{botBias:0.82,rewardMult:0.9,label:'EASY'},
    normal:{botBias:1.0,rewardMult:1.0,label:'NORMAL'},
    hard:{botBias:1.15,rewardMult:1.2,label:'HARD'},
    nightmare:{botBias:5.0,rewardMult:1.6,label:'NIGHTMARE'}
};