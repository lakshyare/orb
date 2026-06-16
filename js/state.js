/* ===== GLOBAL STATE ===== */
var coins=1000,myInventory=[],myDeck=[],currentRating=0,selectedStackId=null;
var packBuffer=[],packPendingCards=[],newCardIds={},cardAcquiredTime={};
var coinAnimTarget=1000,coinAnimCurrent=1000,coinAnimating=false;
var seenTips={},galleryOwnedFilter='all',lastOpenedCardId=null;
var currentBattleDifficulty='easy',currentFightMode='normal';
var filterState={types:[],rarities:[],sort:'default'};
var soundEnabled=true;

var tutorialState={profileTaught:false,inspectTaught:false,introSeen:false,contextEnabled:true,loginDone:false};
var tutorialFlow={running:false,skipped:false,selectedAvatar:null};
var loginVisitData={streak:1,lastVisit:'',welcomeBackShown:''};

var playerProfile={name:'',avatarCardId:null,xp:0,level:1,totalWins:0,totalMatches:0,winStreak:0,
    saved:false,memberSince:'',favoriteCardId:null,firstLegendaryDate:'',
    battleRankPoints:0,cardUseCounts:{},cardsInspected:0,gauntletBest:0};
var battleHistory=[],unlockedAchievements={},claimedAchievementRewards={};
var cardNumber='#### #### #### '+String(Math.floor(Math.random()*9999)).padStart(4,'0');

var objectiveSystem={dailyDate:'',weeklyKey:'',dailyList:[],weekly:null,claimedDaily:[],claimedWeekly:false};

/* Battle state */
var battleState={active:false,userPile:[],botPile:[],userHand:[],botHand:[],
    userPlayed:null,botPlayed:null,round:1,playerScore:0,botScore:0,
    loot:[],lost:[],maxRounds:0,resolving:false,deckSizeAtStart:0,
    phase:'draw',drawsAllowed:2,drawsTaken:0,playerChoosesStat:true,
    cooldowns:{},isDraft:false,isGauntlet:false};

/* Gauntlet state */
var gauntletState={active:false,stage:0,totalGold:0,totalXP:0,
    originalDeck:[],currentDeck:[],lootTotal:[],lostTotal:[]};

/* Draft state */
var draftState={active:false,pool:[],playerPicks:[],botPicks:[],
    targetSize:5,playerTurn:true};

/* Shop state */
var shopState={
    ownedSleeves:{},
    ownedTopLoaders:{},
    ownedArenas:['classic'],
    ownedPackStyles:['classic'],
    ownedBorders:['gold'],
    equippedArena:'classic',
    equippedPackStyle:'classic',
    equippedBorder:'gold',
    appliedSleeves:{},
    appliedTopLoaders:{}
};

/* Idle particle state */
var idleParticles=[];

/* ===== SAVE/LOAD ===== */
function saveFullState(){
    try{
        var state={
            c:coins,inv:myInventory,dk:myDeck,p:playerProfile,bh:battleHistory,
            ua:unlockedAchievements,car:claimedAchievementRewards,cat:cardAcquiredTime,
            nc:newCardIds,tt:tutorialState,lv:loginVisitData,obj:objectiveSystem,
            last:lastOpenedCardId,cn:cardNumber,ss:shopState
        };
        localStorage.setItem('cards_full_state',JSON.stringify(state));
    }catch(e){}
}

function loadState(){
    try{
        var raw=localStorage.getItem('cards_full_state');
        if(raw){
            var s=JSON.parse(raw);
            coins=s.c||1000;
            myInventory=s.inv||[];
            myDeck=s.dk||[];
            playerProfile=Object.assign(playerProfile,s.p||{});
            battleHistory=s.bh||[];
            unlockedAchievements=s.ua||{};
            claimedAchievementRewards=s.car||{};
            cardAcquiredTime=s.cat||{};
            newCardIds=s.nc||{};
            tutorialState=Object.assign(tutorialState,s.tt||{});
            loginVisitData=Object.assign(loginVisitData,s.lv||{});
            objectiveSystem=Object.assign(objectiveSystem,s.obj||{});
            lastOpenedCardId=s.last||null;
            if(s.cn)cardNumber=s.cn;
            if(s.ss)shopState=Object.assign(shopState,s.ss);
            coinAnimCurrent=coins;
            coinAnimTarget=coins;
            return;
        }
    }catch(e){}
    /* Legacy fallback for older saves */
    try{seenTips=JSON.parse(localStorage.getItem('cards_tips')||'{}');}catch(e){}
    try{tutorialState=Object.assign(tutorialState,JSON.parse(localStorage.getItem('cards_tutorial_state')||'{}'));}catch(e){}
    try{loginVisitData=Object.assign(loginVisitData,JSON.parse(localStorage.getItem('cards_login_visit')||'{}'));}catch(e){}
    try{objectiveSystem=Object.assign(objectiveSystem,JSON.parse(localStorage.getItem('cards_objectives')||'{}'));}catch(e){}
    try{lastOpenedCardId=parseInt(localStorage.getItem('cards_last_opened')||'')||null;}catch(e){}
    try{var t=localStorage.getItem('cards_theme');if(t)setTheme(t);}catch(e){}
    try{var s=localStorage.getItem('cards_sound');if(s==='false')soundEnabled=false;}catch(e){}
}

function saveTutorialState(){saveFullState();}
function saveTips(){saveFullState();}
function saveObjectives(){saveFullState();}
function saveLastOpened(){saveFullState();}
function saveLoginVisit(){saveFullState();}
function getDailyData(){try{return JSON.parse(localStorage.getItem('cards_daily'));}catch(e){return null;}}
function saveDailyData(d){try{localStorage.setItem('cards_daily',JSON.stringify(d));}catch(e){}}

function deleteAllProgress(){
    localStorage.removeItem('cards_full_state');
    localStorage.removeItem('cards_tips');
    localStorage.removeItem('cards_tutorial_state');
    localStorage.removeItem('cards_login_visit');
    localStorage.removeItem('cards_objectives');
    localStorage.removeItem('cards_last_opened');
    localStorage.removeItem('cards_daily');
    localStorage.removeItem('cards_theme');
    localStorage.removeItem('cards_sound');
    location.reload();
}

function confirmDeleteProgress(){
    if(confirm('Are you sure? This will delete all your current progress.')){
        deleteAllProgress();
    }
}

function exportSave(){
    var state={c:coins,inv:myInventory,dk:myDeck,p:playerProfile,bh:battleHistory,
        ua:unlockedAchievements,car:claimedAchievementRewards,cat:cardAcquiredTime,
        nc:newCardIds,tt:tutorialState,lv:loginVisitData,obj:objectiveSystem,last:lastOpenedCardId,cn:cardNumber,ss:shopState};
    var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    document.getElementById('cloud-code-area').value=encoded;
    document.getElementById('cloud-code-area').removeAttribute('readonly');
    document.getElementById('cloud-status').innerHTML='<span style="color:#2ecc71;">Code generated! Copy it.</span>';
}
function promptImport(){
    var area=document.getElementById('cloud-code-area');
    area.removeAttribute('readonly');area.value='';area.placeholder='Paste code here, press Enter...';area.focus();
    area.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();importSave(area.value);area.onkeydown=null;}};
    document.getElementById('cloud-status').innerHTML='<span style="color:var(--brand-gold);">Paste code and press Enter</span>';
}
function importSave(code){
    try{
        var s=JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
        coins=s.c||1000;myInventory=s.inv||[];myDeck=s.dk||[];
        playerProfile=Object.assign(playerProfile,s.p||{});battleHistory=s.bh||[];
        unlockedAchievements=s.ua||{};claimedAchievementRewards=s.car||{};
        cardAcquiredTime=s.cat||{};newCardIds=s.nc||{};
        tutorialState=Object.assign(tutorialState,s.tt||{});
        loginVisitData=Object.assign(loginVisitData,s.lv||{});
        objectiveSystem=Object.assign(objectiveSystem,s.obj||{});
        lastOpenedCardId=s.last||null;
        if(s.cn)cardNumber=s.cn;
        if(s.ss)shopState=Object.assign(shopState,s.ss);
        coinAnimCurrent=coins;coinAnimTarget=coins;
        document.getElementById('coin-display').innerText=coins;
        saveFullState();
        renderRacks();updateHeaderProfile();renderGallery();renderHomeProgress();
        document.getElementById('cloud-status').innerHTML='<span style="color:#2ecc71;">Save loaded!</span>';
        createExplosion(window.innerWidth/2,window.innerHeight/2,'accent');
        checkAchievements();
    }catch(e){
        document.getElementById('cloud-status').innerHTML='<span style="color:#e74c3c;">Invalid code!</span>';
    }
}
/* ===== H7. DECK PRESETS ===== */
function initDeckPresets(){
    if(!localStorage.getItem('cards_deck_presets')){
        localStorage.setItem('cards_deck_presets',JSON.stringify({
            active:'A',
            presets:{A:{name:'Preset A',deck:[]},B:{name:'Preset B',deck:[]},C:{name:'Preset C',deck:[]}}
        }));
    }
}
function getDeckPresets(){
    try{return JSON.parse(localStorage.getItem('cards_deck_presets'));}
    catch(e){return {active:'A',presets:{A:{name:'Preset A',deck:[]},B:{name:'Preset B',deck:[]},C:{name:'Preset C',deck:[]}}};}
}
function saveDeckPresets(data){
    try{localStorage.setItem('cards_deck_presets',JSON.stringify(data));}catch(e){}
}
function switchDeckPreset(slot){
    var data=getDeckPresets();
    /* Save current deck to current slot */
    data.presets[data.active].deck=myDeck.slice();
    /* Switch active */
    data.active=slot;
    /* Load new deck */
    myDeck=data.presets[slot].deck.slice();
    saveDeckPresets(data);
    saveFullState();
    renderRacks();
    updateDeckCounter();
    renderDeckPresetButtons();
    showShopToast('Switched to '+data.presets[slot].name,'success');
}
function renameDeckPreset(slot,name){
    var data=getDeckPresets();
    data.presets[slot].name=name;
    saveDeckPresets(data);
}
function updateDeckCounter(){
    var el=document.getElementById('deck-counter');
    if(el) el.innerText=myDeck.length+' / 9';
}

function renderDeckPresetButtons(){
    var data=getDeckPresets();
    var bar=document.getElementById('deck-preset-bar');
    if(!bar)return;
    var btns=bar.querySelectorAll('.deck-preset-btn');
    btns.forEach(function(b){
        var txt=(b.textContent||'').toUpperCase();
        var slot=txt.indexOf('A')===0?'A':txt.indexOf('B')===0?'B':'C';
        b.classList.toggle('active',slot===data.active);
    });
}

function toggleDeckPresetBar(){
    var bar=document.getElementById('deck-preset-bar');
    if(!bar)return;
    bar.classList.toggle('collapsed');
}

function initDeckPresetToggle(){
    renderDeckPresetButtons();
    var bar=document.getElementById('deck-preset-bar');
    if(bar&&!bar.classList.contains('collapsed'))bar.classList.add('collapsed');
}
/* Keyboard shortcuts X/Y/Z for deck presets */
document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
    if(e.key.toLowerCase()==='x'){switchDeckPreset('A');}
    else if(e.key.toLowerCase()==='y'){switchDeckPreset('B');}
    else if(e.key.toLowerCase()==='z'){switchDeckPreset('C');}
});

/* ===== H8. PERFORMANCE MODE ===== */
var performanceMode='normal';
function setPerformanceMode(mode){
    performanceMode=mode;
    localStorage.setItem('cards_perf_mode',mode);
    document.body.setAttribute('data-perf',mode);
    showShopToast('Performance: '+mode.toUpperCase(),'success');
}
function loadPerformanceMode(){
    var m=localStorage.getItem('cards_perf_mode');
    if(m){performanceMode=m;document.body.setAttribute('data-perf',m);}
}

/* ===== H15. DECK SHARE CODES ===== */
function exportDeckCode(){
    if(myDeck.length===0){showShopToast('Deck is empty!','error');return;}
    var code=btoa(JSON.stringify(myDeck));
    navigator.clipboard.writeText(code).then(function(){
        showShopToast('Deck code copied!','success');
    }).catch(function(){
        prompt('Copy this deck code:',code);
    });
}
function importDeckCode(){
    var code=prompt('Paste a deck code:');
    if(!code)return;
    try{
        var deck=JSON.parse(atob(code));
        if(!Array.isArray(deck)){showShopToast('Invalid code!','error');return;}
        /* Validate all cards exist and are owned */
        var valid=deck.every(function(id){return myInventory.includes(id);});
        if(!valid){showShopToast('You don\'t own all cards in this deck!','error');return;}
        if(deck.length>9){showShopToast('Deck too large! Max 9.','error');return;}
        myDeck=deck;
        saveFullState();
        renderRacks();
        updateDeckCounter();
        showShopToast('Deck imported!','success');
    }catch(e){showShopToast('Invalid code!','error');}
}

/* ===== H16. HIGH-CONTRAST TOGGLE ===== */
function toggleHighContrast(){
    var isOn=document.body.getAttribute('data-hc')==='on';
    document.body.setAttribute('data-hc',isOn?'off':'on');
    localStorage.setItem('cards_hc',isOn?'off':'on');
    showShopToast('High Contrast '+(isOn?'OFF':'ON'),'success');
}
function loadHighContrast(){
    var hc=localStorage.getItem('cards_hc');
    if(hc==='on')document.body.setAttribute('data-hc','on');
}
/* ===== TUTORIAL + DAILY + WELCOME BACK ===== */

/* ── H1: Interactive Onboarding Questline ── */
var questSteps=[
    {id:'open_pack', label:'Open Your First Pack', desc:'Buy a Standard Pack to start your collection.', section:'game'},
    {id:'inspect_card', label:'Inspect a Card', desc:'Click any card in your collection to inspect it.', section:'gallery'},
    {id:'add_deck', label:'Add a Card to Your Deck', desc:'Press "+ ADD TO DECK" in the inspect view.', section:'gallery'},
    {id:'first_battle', label:'Play Your First Battle', desc:'Click ⚔ BATTLE and win against the bot!', section:'game'},
    {id:'claim_reward', label:'Claim Your Daily Reward', desc:'Click the DAILY button and claim your reward.', section:'game'}
];
var questProgress={step:0,completed:false};

function initQuestline(){
    var saved=localStorage.getItem('cards_questline');
    if(saved){try{questProgress=JSON.parse(saved);}catch(e){}}
    if(!questProgress.completed && !tutorialState.introSeen){
        showQuestOverlay();
    }
    updateQuestBar();
}
function saveQuestProgress(){
    try{localStorage.setItem('cards_questline',JSON.stringify(questProgress));}catch(e){}
}
function advanceQuest(stepId){
    if(questProgress.completed)return;
    var cur=questSteps[questProgress.step];
    if(!cur||cur.id!==stepId)return;
    questProgress.step++;
    if(questProgress.step>=questSteps.length){
        questProgress.completed=true;
        /* Grant guaranteed epic on completion */
        var epicPool=allCards.filter(function(c){return c.rarity==='epic';});
        if(epicPool.length>0){
            var reward=epicPool[Math.floor(Math.random()*epicPool.length)];
            myInventory.push(reward.id);
            newCardIds[reward.id]=true;
            cardAcquiredTime[reward.id]=cardAcquiredTime[reward.id]||Date.now();
            saveFullState();
        }
        createExplosion(window.innerWidth/2,window.innerHeight/2,'rainbow');
        showShopToast('🎉 Questline Complete! Epic card earned!','success');
    }
    saveQuestProgress();
    updateQuestBar();
}
function showQuestOverlay(){
    var ov=document.getElementById('tutorial-overlay');
    if(!ov)return;
    ov.style.display='flex';
    var m=document.getElementById('tutorial-modal');
    m.innerHTML=
        '<div style="text-align:center;">'+
        '<div style="font-size:3rem;margin-bottom:10px;">🎴</div>'+
        '<h2 style="color:var(--brand-gold);font-size:2rem;letter-spacing:3px;margin:0 0 10px;">WELCOME TO orb</h2>'+
        '<p style="color:#aaa;font-size:1rem;margin:0 0 25px;">Complete 5 quick steps to learn the game and earn a <strong style="color:var(--brand-gold);">guaranteed Epic card!</strong></p>'+
        '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:25px;text-align:left;">'+
        questSteps.map(function(s,i){
            return '<div style="display:flex;gap:10px;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.05);">'+
                '<div style="min-width:24px;height:24px;border-radius:50%;background:'+(i<questProgress.step?'var(--brand-gold)':'rgba(255,255,255,0.1)')+';display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#000;font-weight:900;">'+(i<questProgress.step?'✓':(i+1))+'</div>'+
                '<div><div style="font-weight:700;color:'+(i<questProgress.step?'#888':'#fff')+';font-size:0.9rem;'+(i<questProgress.step?'text-decoration:line-through;':'')+'">'+s.label+'</div></div></div>';
        }).join('')+
        '</div>'+
        '<button class="daily-claim-btn" onclick="closeTutorialModal();navTo(questSteps[questProgress.step].section)" style="width:100%;font-size:1.1rem;">LET\'S GO!</button>'+
        '<button style="background:transparent;border:none;color:#555;margin-top:12px;cursor:pointer;font-size:0.85rem;" onclick="skipTutorial()">SKIP TUTORIAL</button>'+
        '</div>';
}
function updateQuestBar(){
    var bar=document.getElementById('quest-bar');
    if(!bar){
        bar=document.createElement('div');
        bar.id='quest-bar';
        bar.style.cssText='position:fixed;top:0;left:0;right:0;height:40px;background:rgba(0,0,0,0.9);z-index:8000;display:flex;align-items:center;padding:0 20px;gap:15px;border-bottom:1px solid var(--border-secondary);backdrop-filter:blur(5px);';
        document.body.appendChild(bar);
    }
    if(questProgress.completed){bar.style.display='none';return;}
    var cur=questSteps[questProgress.step];
    if(!cur){bar.style.display='none';return;}
    var pct=Math.round((questProgress.step/questSteps.length)*100);
    bar.innerHTML=
        '<div style="color:var(--brand-gold);font-weight:900;font-size:0.7rem;letter-spacing:2px;white-space:nowrap;">QUEST '+(questProgress.step+1)+'/'+questSteps.length+'</div>'+
        '<div style="flex:1;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;"><div style="height:100%;width:'+pct+'%;background:var(--brand-gold);border-radius:2px;transition:width 0.5s;"></div></div>'+
        '<div style="color:#ccc;font-size:0.75rem;white-space:nowrap;">'+cur.label+'</div>'+
        '<button onclick="skipTutorial()" style="background:none;border:none;color:#555;font-size:0.7rem;cursor:pointer;">SKIP</button>';
}

/* ── LEGACY TUTORIAL COMPAT ── */
function clearTutorialHighlight(){document.querySelectorAll('.tutorial-highlight').forEach(function(el){el.classList.remove('tutorial-highlight');});}
function dismissContextTip(){var old=document.querySelector('.context-tip');if(old)old.remove();clearTutorialHighlight();}
function showContextTip(key,title,text,el,pos,onClose){if(!tutorialState.contextEnabled)return;if(seenTips[key])return;seenTips[key]=true;saveTips();dismissContextTip();
var tip=document.createElement('div');tip.className='context-tip';tip.innerHTML='<h4>'+title+'</h4><p>'+text+'</p><div class="tip-btn-row"><button class="tip-next-btn">GOT IT</button><button class="tip-skip-btn">SKIP ALL</button></div>';document.body.appendChild(tip);
if(el){el.classList.add('tutorial-highlight');var r=el.getBoundingClientRect();tip.style.left=Math.min(Math.max(12,r.left),window.innerWidth-370)+'px';tip.style.top=(pos==='top'?Math.min(window.innerHeight-tip.offsetHeight-12,r.bottom+12):Math.max(12,r.top-tip.offsetHeight-12))+'px';}else{tip.style.bottom='100px';tip.style.left='50%';tip.style.transform='translateX(-50%)';}
tip.querySelector('.tip-next-btn').onclick=function(){dismissContextTip();if(onClose)onClose();};tip.querySelector('.tip-skip-btn').onclick=function(){tutorialState.contextEnabled=false;saveTutorialState();dismissContextTip();};setTimeout(function(){if(tip.parentNode){dismissContextTip();}},12000);}

function startIntroTutorial(force){if(!force&&tutorialState.introSeen)return;initQuestline();}
function closeTutorialModal(){document.getElementById('tutorial-overlay').style.display='none';document.getElementById('tutorial-modal').innerHTML='';}
function finishTutorialIntro(){tutorialState.introSeen=true;saveTutorialState();closeTutorialModal();}
function skipTutorial(){questProgress.completed=true;saveQuestProgress();tutorialState.introSeen=true;tutorialState.contextEnabled=false;saveTutorialState();dismissContextTip();closeTutorialModal();updateQuestBar();}
function replayTutorial(){questProgress={step:0,completed:false};saveQuestProgress();tutorialState={profileTaught:false,inspectTaught:false,introSeen:false,contextEnabled:true,loginDone:playerProfile.saved};seenTips={};saveTutorialState();saveTips();closeSettings();initQuestline();}
function handleSectionTutorial(pid){}

function renderTutorialStep(step){var m=document.getElementById('tutorial-modal');if(step===0){m.innerHTML='<div class="tutorial-kicker">✨ First Time Here?</div><h2 class="tutorial-title">Welcome to orb</h2><div class="tutorial-text">Collect cards, build a deck, and battle the bot.<br>We\'ll walk you through everything.</div><div class="tutorial-actions"><button class="tutorial-btn tutorial-primary" onclick="renderTutorialStep(1)">LET\'S GO</button><button class="tutorial-btn tutorial-secondary" onclick="skipTutorial()">SKIP</button></div>';}
else if(step===1){var avatarHTML=allCards.slice(0,5).map(function(c,i){return'<div class="tutorial-avatar-opt'+(i===0?' selected':'')+'" data-aid="'+c.id+'" style="background-image:url(\''+c.img+'\')" onclick="selectTutorialAvatar('+c.id+',this)"></div>';}).join('');tutorialFlow.selectedAvatar=tutorialFlow.selectedAvatar||allCards[0].id;m.innerHTML='<div class="tutorial-kicker">🎴 Create Identity</div><h2 class="tutorial-title">Who are you?</h2><div class="tutorial-login-box"><input class="tutorial-login-input" id="tutorial-name-input" maxlength="16" placeholder="Enter name..." value="'+(playerProfile.name||'')+'"><div class="tutorial-avatar-pick">'+avatarHTML+'</div><div style="font-size:0.76rem;color:#888;margin-top:8px;">Edit later from profile.</div></div><div class="tutorial-actions"><button class="tutorial-btn tutorial-primary" onclick="completeTutorialLogin()">CONTINUE</button><button class="tutorial-btn tutorial-secondary" onclick="skipTutorial()">SKIP</button></div>';}
else if(step===2){m.innerHTML='<div class="tutorial-kicker">🎓 Ready!</div><h2 class="tutorial-title">Let\'s explore together</h2><div class="tutorial-text">We\'ll guide you through each section with spotlights. Just follow the golden highlights!</div><div class="tutorial-actions"><button class="tutorial-btn tutorial-primary" onclick="finishTutorialIntro()">START TOUR</button></div>';}}
function selectTutorialAvatar(id,el){tutorialFlow.selectedAvatar=id;document.querySelectorAll('.tutorial-avatar-opt').forEach(function(x){x.classList.remove('selected');});el.classList.add('selected');}
function completeTutorialLogin(){var inp=document.getElementById('tutorial-name-input');if(!inp||!inp.value.trim().length){if(inp)inp.focus();return;}playerProfile.name=inp.value.trim().toUpperCase();playerProfile.saved=true;playerProfile.avatarCardId=tutorialFlow.selectedAvatar||allCards[0].id;if(!playerProfile.memberSince){var now=new Date();playerProfile.memberSince=String(now.getMonth()+1).padStart(2,'0')+'/'+String(now.getFullYear()).slice(-2);}tutorialState.loginDone=true;saveTutorialState();updateHeaderProfile();renderTutorialStep(2);}

/* Guided walkthrough — auto navigates */
function startGuidedWalkthrough(){var steps=[
    {section:'home',el:'.hero-banner',title:'Home',text:'This is your hub. Featured cards, news, and your progress live here.',pos:'top'},
    {section:'home',el:'.progress-widget',title:'Progress',text:'Track your level, daily objectives, and collection here.',pos:'top'},
    {section:'gallery',el:'.gallery-toolbar',title:'Gallery',text:'Browse all cards. Use filters to find specific types or rarities.',pos:'top'},
    {section:'game',el:'.game-shop-buttons',title:'Arena',text:'Buy packs with gold, build your deck, and fight the bot!',pos:'top'},
    {section:'game',el:'.coin-pouch',title:'Gold',text:'This is your currency. Earn it from battles and objectives.',pos:'top'}
];var idx=0;
function runStep(){if(idx>=steps.length){dismissContextTip();return;}var s=steps[idx];navTo(s.section,document.querySelector('.nav-btn[onclick*="'+s.section+'"]'));setTimeout(function(){var target=document.querySelector(s.el);showContextTip('guided_'+idx,s.title,s.text,target,s.pos,function(){idx++;runStep();});},400);}
runStep();}
function handleSectionTutorial(pid){if(!tutorialState.contextEnabled)return;}
function replayTutorial(){tutorialState={profileTaught:false,inspectTaught:false,introSeen:false,contextEnabled:true,loginDone:playerProfile.saved};seenTips={};saveTutorialState();saveTips();closeSettings();startIntroTutorial(true);}

/* Welcome Back */
function checkWelcomeBack(){var today=getTodayStr();if(loginVisitData.welcomeBackShown===today)return;if(!loginVisitData.lastVisit)return;var last=new Date(loginVisitData.lastVisit),now=new Date();var diffDays=Math.floor((now-last)/(1000*60*60*24));if(diffDays>=3){loginVisitData.welcomeBackShown=today;saveLoginVisit();showWelcomeBack(diffDays);}}
function showWelcomeBack(days){var bonus=Math.min(days*100,500);var m=document.getElementById('wb-modal');m.innerHTML='<div class="wb-emoji">👋</div><div class="wb-title">WELCOME BACK!</div><div class="wb-sub">It\'s been <strong>'+days+' days</strong> since your last visit.<br>We missed you in the arena!</div><div class="wb-bonus">🎁 Comeback Bonus: +'+bonus+' GOLD</div><button class="wb-btn" onclick="claimWelcomeBack('+bonus+')">CLAIM & PLAY</button>';document.getElementById('welcome-back-overlay').style.display='flex';}
function claimWelcomeBack(bonus){document.getElementById('welcome-back-overlay').style.display='none';addCoins(bonus);createExplosion(window.innerWidth/2,window.innerHeight/2,'rainbow');}

/* Daily Reward */
function updateDailyBtn(){var d=getDailyData(),btn=document.getElementById('daily-float-btn');if(!d||d.lastClaim!==getTodayStr())btn.classList.add('has-reward');else btn.classList.remove('has-reward');}
function openDailyReward(){var data=getDailyData(),today=getTodayStr();if(data&&data.lastClaim===today){showDailyUI(data.streak%7,true);return;}var y=new Date();y.setDate(y.getDate()-1);var yStr=formatTodayStr(y);var streak=data&&data.lastClaim===yStr?(data.streak||0):0;showDailyUI(streak%7,false);}
function showDailyUI(dayIdx,claimed){document.getElementById('daily-reward-overlay').style.display='flex';var row=document.getElementById('daily-days-row');row.innerHTML='';dailyRewards.forEach(function(r,i){var d=document.createElement('div');d.className='daily-day';if(i<dayIdx)d.classList.add('claimed');else if(i===dayIdx)d.classList.add(claimed?'claimed':'today');else d.classList.add('future');d.innerHTML='<div class="day-num">Day '+(i+1)+'</div><div class="day-reward">'+(i<dayIdx||(i===dayIdx&&claimed)?'✅':r.label)+'</div>';row.appendChild(d);});
var reward=dailyRewards[dayIdx],disp=document.getElementById('daily-reward-display');if(claimed)disp.innerHTML='<div style="color:#27ae60;font-weight:900;">Already claimed today!</div>';else if(reward.special)disp.innerHTML='<div style="font-size:2rem;">🎁</div><div style="color:var(--brand-gold);font-weight:900;font-size:1.3rem;">FREE EPIC PACK!</div>';else disp.innerHTML='<div style="font-size:2rem;">💰</div><div style="color:var(--brand-gold);font-weight:900;font-size:1.3rem;">+'+reward.gold+' GOLD</div>';
var btn=document.getElementById('daily-claim-btn');if(claimed){btn.className='daily-claim-btn already-claimed';btn.innerText='CLAIMED';btn.onclick=null;}else{btn.className='daily-claim-btn';btn.innerText='CLAIM REWARD';btn.onclick=function(){claimDaily(dayIdx);};}}
function claimDaily(dayIdx){var r=dailyRewards[dayIdx],data=getDailyData(),streak=(data?data.streak||0:0)+1;if(r.special){for(var i=0;i<3;i++){var pool=allCards.filter(function(c){return c.rarity==='epic'||c.rarity==='legendary';});var rc=pool[Math.floor(Math.random()*pool.length)];myInventory.push(rc.id);newCardIds[rc.id]=true;cardAcquiredTime[rc.id]=cardAcquiredTime[rc.id]||Date.now();}}else addCoins(r.gold);saveDailyData({streak:streak,lastClaim:getTodayStr()});updateObjectiveProgress('claim_daily_reward',1);if(typeof advanceQuest==='function')advanceQuest('claim_reward');createExplosion(window.innerWidth/2,window.innerHeight/2,'accent');showDailyUI(dayIdx,true);updateDailyBtn();checkAchievements();renderRacks();renderGallery();renderHomeProgress();}
function closeDailyReward(){document.getElementById('daily-reward-overlay').style.display='none';}
/* ===== LUCKY WHEEL ===== */
function openLuckyWheel(){
    document.getElementById('lucky-wheel-overlay').style.display='flex';
    var btn=document.getElementById('wheel-spin-btn');
    var data=getDailyData();
    var today=getTodayStr();
    if(data && data.lastSpin===today){
        btn.innerText='ALREADY SPUN';
        btn.disabled=true;
    }else{
        btn.innerText='SPIN (Free)';
        btn.disabled=false;
    }
}
function closeLuckyWheel(){
    document.getElementById('lucky-wheel-overlay').style.display='none';
}
function spinLuckyWheel(){
    var data=getDailyData()||{};
    var today=getTodayStr();
    if(data.lastSpin===today){showShopToast('Already spun today!','error');return;}
    var btn=document.getElementById('wheel-spin-btn');
    btn.disabled=true;
    btn.innerText='SPINNING...';
    
    var wheel=document.getElementById('lucky-wheel');
    var segments=8;
    var segAngle=360/segments;
    /* rewards index: 0=50G, 1=1Pack, 2=200G, 3=Epic, 4=100G, 5=2Packs, 6=10G, 7=Legend */
    var weights=[25,20,15,10,18,8,30,2]; /* weighted random */
    var total=weights.reduce(function(a,b){return a+b;},0);
    var r=Math.random()*total,cumul=0,winner=0;
    for(var i=0;i<weights.length;i++){cumul+=weights[i];if(r<=cumul){winner=i;break;}}
    
    var targetAngle=360*5 + (360-winner*segAngle - segAngle/2);
    wheel.style.transition='transform 4s cubic-bezier(0.17,0.67,0.12,0.99)';
    wheel.style.transform='rotate('+targetAngle+'deg)';
    
    setTimeout(function(){
        applyWheelReward(winner);
        btn.innerText='CLAIMED!';
        data.lastSpin=today;
        saveDailyData(data);
    },4200);
}
function applyWheelReward(idx){
    var rewards=[
        {type:'gold',amount:50,label:'+50 Gold'},
        {type:'pack',amount:1,label:'1 Free Pack!'},
        {type:'gold',amount:200,label:'+200 Gold!'},
        {type:'epic',amount:1,label:'Epic Card!'},
        {type:'gold',amount:100,label:'+100 Gold'},
        {type:'pack',amount:2,label:'2 Free Packs!'},
        {type:'gold',amount:10,label:'+10 Gold'},
        {type:'legendary',amount:1,label:'LEGENDARY Card!!!'}
    ];
    var r=rewards[idx];
    if(r.type==='gold'){addCoins(r.amount);}
    else if(r.type==='pack'){for(var i=0;i<r.amount;i++){buyPack('normal',true);}}
    else if(r.type==='epic'){var pool=allCards.filter(function(c){return c.rarity==='epic';});var rc=pool[Math.floor(Math.random()*pool.length)];myInventory.push(rc.id);newCardIds[rc.id]=true;cardAcquiredTime[rc.id]=cardAcquiredTime[rc.id]||Date.now();}
    else if(r.type==='legendary'){var pool=allCards.filter(function(c){return c.rarity==='legendary';});var rc=pool[Math.floor(Math.random()*pool.length)];myInventory.push(rc.id);newCardIds[rc.id]=true;cardAcquiredTime[rc.id]=cardAcquiredTime[rc.id]||Date.now();}
    createExplosion(window.innerWidth/2,window.innerHeight/2,'rainbow');
    showShopToast(r.label,'success');
    saveFullState();
}
