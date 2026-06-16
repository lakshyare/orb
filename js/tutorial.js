/* ===== TUTORIAL.JS ===== */

var questSteps=[
    {id:'open_pack',   label:'Open a Pack',       desc:'Buy a Standard Pack from the arena.',       section:'game',   icon:'📦'},
    {id:'add_deck',    label:'Build Your Deck',    desc:'Drag or inspect a card and add it to deck.',section:'game',   icon:'🃏'},
    {id:'first_battle',label:'Win a Battle',       desc:'Hit ⚔ BATTLE and defeat the bot.',          section:'game',   icon:'⚔️'},
    {id:'claim_reward',label:'Claim Daily Reward', desc:'Press DAILY and grab your daily gold.',     section:'game',   icon:'🎁'}
];

var questProgress={step:0,completed:false};

function saveQuestProgress(){try{localStorage.setItem('cards_questline',JSON.stringify(questProgress));}catch(e){}}
function loadQuestProgress(){
    var raw=localStorage.getItem('cards_questline');
    if(!raw)return;
    try{questProgress=Object.assign(questProgress,JSON.parse(raw));}catch(e){}
}

function initQuestline(){loadQuestProgress();updateQuestBar();}

function getTutorialCurrentStep(){
    if(questProgress.completed)return null;
    return questSteps[Math.min(questProgress.step,questSteps.length-1)];
}

function advanceQuest(stepId){
    if(questProgress.completed)return;
    var cur=getTutorialCurrentStep();
    if(!cur||cur.id!==stepId)return;
    questProgress.step++;
    if(questProgress.step>=questSteps.length){
        questProgress.completed=true;
        tutorialState.introSeen=true;
        saveTutorialState();
        updateQuestBar();
        createExplosion(window.innerWidth/2,window.innerHeight/2,'rainbow');
        showToast('🎉 Tutorial complete! You are ready.','gold','★');
    }else{
        updateQuestBar();
        var next=getTutorialCurrentStep();
        if(next) showToast(next.icon+' Next: '+next.label,'info');
    }
    saveQuestProgress();
}

function updateQuestBar(){
    var bar=document.getElementById('quest-bar');
    if(questProgress.completed){if(bar)bar.style.display='none';return;}

    if(!bar){
        bar=document.createElement('div');
        bar.id='quest-bar';
        document.body.appendChild(bar);
    }

    var cur=getTutorialCurrentStep();
    if(!cur){bar.style.display='none';return;}

    var pct=Math.round((questProgress.step/questSteps.length)*100);

    bar.style.cssText=
        'position:fixed;bottom:0;left:0;right:0;height:44px;'+
        'background:rgba(10,10,16,0.96);'+
        'border-top:1px solid rgba(241,196,15,0.2);'+
        'z-index:8000;display:flex;align-items:center;'+
        'padding:0 18px;gap:14px;backdrop-filter:blur(8px);';

    bar.innerHTML=
        '<span style="font-size:1.1rem;flex-shrink:0;">'+cur.icon+'</span>'+
        '<div style="flex:1;min-width:0;">'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:3px;">'+
                '<span style="font-size:0.7rem;font-weight:900;color:var(--brand-gold);letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+cur.label+'</span>'+
                '<span style="font-size:0.65rem;color:#666;flex-shrink:0;margin-left:8px;">'+(questProgress.step+1)+'/'+questSteps.length+'</span>'+
            '</div>'+
            '<div style="height:3px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;">'+
                '<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#f1c40f,#f39c12);border-radius:2px;transition:width 0.5s;"></div>'+
            '</div>'+
        '</div>'+
        '<button onclick="renderTutorialModal()" style="background:rgba(241,196,15,0.1);border:1px solid rgba(241,196,15,0.3);color:var(--brand-gold);padding:4px 10px;border-radius:6px;font-size:0.65rem;font-weight:900;cursor:pointer;flex-shrink:0;">GUIDE</button>'+
        '<button onclick="skipTutorial()" style="background:none;border:none;color:#444;font-size:0.65rem;cursor:pointer;flex-shrink:0;padding:4px 6px;">SKIP</button>';
}

function renderTutorialModal(){
    var ov=document.getElementById('tutorial-overlay');
    var modal=document.getElementById('tutorial-modal');
    if(!ov||!modal)return;

    var rows=questSteps.map(function(s,i){
        var done=i<questProgress.step;
        var current=i===questProgress.step&&!questProgress.completed;
        return '<div style="display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:10px;background:'+(current?'rgba(241,196,15,0.07)':'rgba(255,255,255,0.02)')+';border:1px solid '+(current?'rgba(241,196,15,0.25)':'rgba(255,255,255,0.05)')+';margin-bottom:8px;">'+
            '<div style="width:28px;height:28px;border-radius:50%;background:'+(done?'var(--brand-gold)':'rgba(255,255,255,0.08)')+';display:flex;align-items:center;justify-content:center;font-size:'+(done?'0.8rem':'1rem')+';flex-shrink:0;color:'+(done?'#111':'#fff')+';">'+(done?'✓':s.icon)+'</div>'+
            '<div style="flex:1;">'+
                '<div style="font-weight:900;font-size:0.88rem;color:'+(done?'#555':current?'#fff':'#bbb')+';'+(done?'text-decoration:line-through;':'')+'">'+s.label+'</div>'+
                '<div style="font-size:0.75rem;color:#666;margin-top:2px;">'+s.desc+'</div>'+
            '</div>'+
        '</div>';
    }).join('');

    var cur=getTutorialCurrentStep();

    modal.innerHTML=
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">'+
            '<div>'+
                '<div style="font-size:0.65rem;letter-spacing:2px;color:var(--brand-gold);font-weight:900;">TUTORIAL</div>'+
                '<h2 style="margin:4px 0 0;font-size:1.6rem;font-weight:900;">Quest Guide</h2>'+
            '</div>'+
            '<button onclick="closeTutorialModal()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#888;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem;">✕</button>'+
        '</div>'+
        rows+
        (cur?'<div style="margin-top:16px;padding:12px;border-radius:10px;background:rgba(241,196,15,0.06);border:1px solid rgba(241,196,15,0.2);">'+
            '<div style="font-size:0.65rem;color:var(--brand-gold);font-weight:900;letter-spacing:1px;margin-bottom:4px;">NOW DO THIS</div>'+
            '<div style="color:#ddd;font-size:0.9rem;">'+cur.desc+'</div>'+
            '<button onclick="closeTutorialModal();navTo(\''+cur.section+'\',null);" style="margin-top:10px;background:var(--brand-main-gradient);border:none;border-radius:8px;padding:8px 18px;font-weight:900;font-size:0.82rem;cursor:pointer;color:#111;">GO TO '+cur.section.toUpperCase()+'</button>'+
        '</div>':'<div style="text-align:center;padding:16px;color:#2ecc71;font-weight:900;font-size:1.1rem;">✓ All steps complete!</div>')+
        '<button onclick="skipTutorial()" style="width:100%;background:transparent;border:none;color:#444;margin-top:14px;cursor:pointer;font-size:0.78rem;padding:6px;">Skip Tutorial</button>';

    ov.style.display='flex';
}

function closeTutorialModal(){
    var ov=document.getElementById('tutorial-overlay');
    if(ov)ov.style.display='none';
}

function startTutorialJourney(){
    closeTutorialModal();
    var cur=getTutorialCurrentStep();
    if(cur) navTo(cur.section,null);
}

function skipTutorial(){
    questProgress={step:questSteps.length,completed:true};
    tutorialState.introSeen=true;
    tutorialState.contextEnabled=false;
    saveQuestProgress();
    saveTutorialState();
    closeTutorialModal();
    updateQuestBar();
}

function replayTutorial(){
    questProgress={step:0,completed:false};
    tutorialState.introSeen=false;
    tutorialState.contextEnabled=true;
    saveQuestProgress();
    saveTutorialState();
    closeSettings();
    initQuestline();
    renderTutorialModal();
}

function startIntroTutorial(force){
    initQuestline();
    if(force||!tutorialState.introSeen) renderTutorialModal();
}

function finishTutorialIntro(){tutorialState.introSeen=true;saveTutorialState();closeTutorialModal();}

/* Legacy compat stubs */
function clearTutorialHighlight(){}
function dismissContextTip(){}
function showContextTip(){}
function handleSectionTutorial(){}