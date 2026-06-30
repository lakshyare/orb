/* ===== MULTIPLAYER.JS (Supabase) ===== */

var mpState = {
    active:false, role:null, roomCode:null,
    channel:null, settings:{}, timerInterval:null
};

/* ─── Identity ─── */
function mpGetId(){
    var id=localStorage.getItem('cards_mp_uid');
    if(!id){id='u_'+Date.now()+'_'+Math.random().toString(36).substr(2,8);localStorage.setItem('cards_mp_uid',id);}
    return id;
}
function mpGetName(){return(playerProfile&&playerProfile.name&&playerProfile.name.length)?playerProfile.name:'PLAYER';}

/* ─── Room code ─── */
function mpGenCode(){
    var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',s='';
    for(var i=0;i<6;i++)s+=c[Math.floor(Math.random()*c.length)];
    return s;
}

/* ─── Supabase helpers ─── */
function mpSB(){ return initSupabase(); }

async function mpGetRoom(code){
    var sb=mpSB(); if(!sb) return null;
    var {data,error}=await sb.from('pvp_rooms').select('*').eq('code',code).single();
    return error?null:data;
}

async function mpSetRoom(code,data){
    var sb=mpSB(); if(!sb) return false;
    var {error}=await sb.from('pvp_rooms').upsert({code:code,...data});
    return !error;
}

async function mpUpdateRoom(code,updates){
    var sb=mpSB(); if(!sb) return false;
    /* Read → merge → write (Supabase doesn't support deep partial updates) */
    var existing=await mpGetRoom(code);
    if(!existing) return false;
    var merged=Object.assign({},existing);
    Object.keys(updates).forEach(function(k){
        if(typeof updates[k]==='object'&&updates[k]!==null&&!Array.isArray(updates[k])){
            merged[k]=Object.assign({},existing[k]||{},updates[k]);
        }else{
            merged[k]=updates[k];
        }
    });
    var {error}=await mpSB().from('pvp_rooms').update(merged).eq('code',code);
    return !error;
}

async function mpUpdateState(code,stateUpdates){
    var existing=await mpGetRoom(code);
    if(!existing) return false;
    var newState=Object.assign({},existing.state||{},stateUpdates);
    var {error}=await mpSB().from('pvp_rooms').update({state:newState}).eq('code',code);
    return !error;
}

/* ─── Deck builder ─── */
function mpBuildDeck(mode,hostDeck){
    if(mode==='own')         return myDeck.slice();
    if(mode==='mirror')      return(hostDeck||myDeck).slice();
    if(mode==='legendaries') return mpPoolDeck('legendary');
    if(mode==='epics')       return mpPoolDeck('epic');
    if(mode==='commons')     return mpPoolDeck('common');
    return myDeck.slice();
}
function mpPoolDeck(rarity){
    var pool=allCards.filter(function(c){return c.rarity===rarity;});
    if(!pool.length)pool=allCards.slice();
    return shuffleArray(pool).slice(0,Math.min(9,pool.length)).map(function(c){return c.id;});
}

/* ════════════════════════════════════════
   OPEN / CLOSE
════════════════════════════════════════ */
function openMultiplayerMenu(){
    closeFightModal();
    document.getElementById('mp-overlay').style.display='flex';
    mpScreen('main');
}
function closeMPOverlay(){
    document.getElementById('mp-overlay').style.display='none';
    mpCleanup();
}

/* ─── Screens ─── */
function mpScreen(name,payload){
    var body=document.getElementById('mp-body');
    if(!body)return;
    body.innerHTML='';
    if(name==='main')      _mpScreenMain(body);
    else if(name==='join') _mpScreenJoin(body);
    else if(name==='loading') body.innerHTML='<div class="mp-loading"><div class="mp-spinner"></div><div class="mp-loading-txt">'+(payload||'Please wait...')+'</div></div>';
    else if(name==='lobby') _mpScreenLobby(body,payload);
}

function _mpScreenMain(body){
    body.innerHTML=
        '<div class="mp-hero">'+
            '<div class="mp-hero-icon">⚔️</div>'+
            '<h2 class="mp-hero-title">PLAY WITH A FRIEND</h2>'+
            '<p class="mp-hero-sub">Create a private room, share the code,<br>and battle in real time.</p>'+
        '</div>'+
        '<div class="mp-main-btns">'+
            '<button class="mp-big-btn" onclick="mpCreateRoom()">'+
                '<span style="font-size:2rem;">🏠</span>'+
                '<span class="mp-btn-label">CREATE ROOM</span>'+
                '<span class="mp-btn-sub">Get a shareable code</span>'+
            '</button>'+
            '<button class="mp-big-btn" onclick="mpScreen(\'join\')">'+
                '<span style="font-size:2rem;">🚪</span>'+
                '<span class="mp-btn-label">JOIN ROOM</span>'+
                '<span class="mp-btn-sub">Enter a friend\'s code</span>'+
            '</button>'+
        '</div>';
}

function _mpScreenJoin(body){
    body.innerHTML=
        '<button class="mp-back" onclick="mpScreen(\'main\')">← Back</button>'+
        '<div class="mp-join-wrap">'+
            '<h3 class="mp-section-title">ENTER ROOM CODE</h3>'+
            '<input id="mp-join-input" class="mp-code-input" maxlength="6" placeholder="ABC123"'+
            ' oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,\'\')"'+
            ' onkeydown="if(event.key===\'Enter\')mpDoJoin()" autocomplete="off">'+
            '<button class="mp-action-btn" onclick="mpDoJoin()">JOIN →</button>'+
            '<div id="mp-join-err" class="mp-err-msg"></div>'+
        '</div>';
    setTimeout(function(){var el=document.getElementById('mp-join-input');if(el)el.focus();},80);
}

function _mpScreenLobby(body,data){
    var code=mpState.roomCode, isHost=mpState.role==='host';
    var settings=data.settings||{deckMode:'own',timer:10};
    var host=data.host||{}, guest=data.guest||null;
    var modeOpts=[
        {v:'own',l:'Your Own Deck'},
        {v:'mirror',l:'Mirror (host\'s deck)'},
        {v:'legendaries',l:'Legendaries Only'},
        {v:'epics',l:'Epics Only'},
        {v:'commons',l:'Commons Only'}
    ];
    body.innerHTML=
        '<div class="mp-room-head">'+
            '<div class="mp-code-block">'+
                '<div class="mp-code-lbl">ROOM CODE</div>'+
                '<div class="mp-code-big">'+code+'</div>'+
                '<button class="mp-copy-btn" onclick="navigator.clipboard.writeText(\''+code+'\').then(function(){showToast(\'Code copied!\',\'success\');})">📋 Copy</button>'+
            '</div>'+
        '</div>'+
        '<div class="mp-players">'+
            '<div class="mp-player-card">'+
                '<div class="mp-player-role">HOST</div>'+
                '<div class="mp-player-name">'+host.name+'</div>'+
                '<div class="mp-ready-dot '+(host.ready?'ready':'')+'" id="mp-host-dot"></div>'+
                '<div class="mp-ready-label" id="mp-host-lbl">'+(host.ready?'✓ READY':'Setting up...')+'</div>'+
            '</div>'+
            '<div class="mp-vs-orb">VS</div>'+
            '<div class="mp-player-card">'+
                '<div class="mp-player-role">CHALLENGER</div>'+
                '<div class="mp-player-name" id="mp-guest-name">'+(guest?guest.name:'Waiting...')+'</div>'+
                '<div class="mp-ready-dot '+(guest&&guest.ready?'ready':'')+'" id="mp-guest-dot"></div>'+
                '<div class="mp-ready-label" id="mp-guest-lbl">'+(guest?(guest.ready?'✓ READY':'Setting up...'):'Not joined')+'</div>'+
            '</div>'+
        '</div>'+
        (isHost?
            '<div class="mp-settings">'+
                '<div class="mp-setting-row"><span class="mp-setting-lbl">Deck Mode</span>'+
                '<select class="mp-setting-sel" onchange="mpSetSetting(\'deckMode\',this.value)">'+
                modeOpts.map(function(o){return '<option value="'+o.v+'"'+(settings.deckMode===o.v?' selected':'')+'>'+o.l+'</option>';}).join('')+
                '</select></div>'+
                '<div class="mp-setting-row"><span class="mp-setting-lbl">Turn Timer</span>'+
                '<select class="mp-setting-sel" onchange="mpSetSetting(\'timer\',+this.value)">'+
                '<option value="10">10s</option><option value="15"'+(settings.timer===15?' selected':'')+'>15s</option>'+
                '<option value="20"'+(settings.timer===20?' selected':'')+'>20s</option>'+
                '<option value="0"'+(settings.timer===0?' selected':'')+'>No limit</option>'+
                '</select></div>'+
            '</div>'
        :
            '<div class="mp-settings">'+
                '<div class="mp-setting-info">Mode: <strong>'+(modeOpts.find(function(o){return o.v===settings.deckMode;})||{l:'—'}).l+'</strong></div>'+
                '<div class="mp-setting-info">Timer: <strong>'+(settings.timer||'None')+'s</strong></div>'+
            '</div>'
        )+
        '<div class="mp-lobby-actions">'+
            '<button class="mp-action-btn mp-ready-btn" id="mp-ready-btn" onclick="mpToggleReady()">READY UP</button>'+
            '<button class="mp-leave-btn" onclick="mpLeave()">Leave</button>'+
        '</div>'+
        '<div class="mp-lobby-status" id="mp-lobby-status">'+(guest?'':'Waiting for someone to join...')+'</div>';
}

/* ════════════════════════════════════════
   CREATE / JOIN
════════════════════════════════════════ */
async function mpCreateRoom(){
    if(!mpSB()){showToast('Supabase not configured — check supabase-client.js','error');return;}
    mpScreen('loading','Creating room...');
    var code=mpGenCode();
    var roomData={
        code:code,
        settings:{deckMode:'own',timer:10},
        host:{id:mpGetId(),name:mpGetName(),deck:myDeck.slice(),ready:false},
        guest:null,
        state:{phase:'lobby'}
    };
    var ok=await mpSetRoom(code,roomData);
    if(!ok){showToast('Failed to create room','error');mpScreen('main');return;}
    mpState.active=true; mpState.role='host'; mpState.roomCode=code;
    mpState.settings=roomData.settings;
    mpListen(code);
}

async function mpDoJoin(){
    var input=document.getElementById('mp-join-input');
    var code=input?input.value.trim().toUpperCase():'';
    var errEl=document.getElementById('mp-join-err');
    if(code.length!==6){if(errEl)errEl.innerText='Enter a 6-character code.';return;}
    if(!mpSB()){showToast('Supabase not configured','error');return;}
    mpScreen('loading','Joining room...');
    var data=await mpGetRoom(code);
    if(!data){mpScreen('join');document.getElementById('mp-join-err').innerText='Room not found.';return;}
    if(data.guest){mpScreen('join');document.getElementById('mp-join-err').innerText='Room is full.';return;}
    if(data.state&&data.state.phase!=='lobby'){mpScreen('join');document.getElementById('mp-join-err').innerText='Game already started.';return;}
    var guestDeck=mpBuildDeck(data.settings?data.settings.deckMode:'own',data.host?data.host.deck:null);
    var ok=await mpUpdateRoom(code,{guest:{id:mpGetId(),name:mpGetName(),deck:guestDeck,ready:false}});
    if(!ok){mpScreen('main');showToast('Failed to join','error');return;}
    mpState.active=true; mpState.role='guest'; mpState.roomCode=code;
    mpState.settings=data.settings||{};
    mpListen(code);
}

/* ════════════════════════════════════════
   LOBBY ACTIONS
════════════════════════════════════════ */
async function mpSetSetting(key,val){
    if(mpState.role!=='host') return;
    var settings=Object.assign({},mpState.settings);
    settings[key]=val; mpState.settings=settings;
    await mpUpdateRoom(mpState.roomCode,{settings:settings});
}

async function mpToggleReady(){
    var code=mpState.roomCode; if(!code) return;
    var data=await mpGetRoom(code); if(!data) return;
    var roleData=Object.assign({},data[mpState.role]||{});
    roleData.ready=!roleData.ready;
    var upd={}; upd[mpState.role]=roleData;
    await mpUpdateRoom(code,upd);
    var btn=document.getElementById('mp-ready-btn');
    if(btn){btn.innerText=roleData.ready?'CANCEL READY':'READY UP';btn.style.background=roleData.ready?'#27ae60':'';}
}

async function mpLeave(){
    var code=mpState.roomCode; if(!code) return;
    if(mpState.role==='host'){await mpSB().from('pvp_rooms').delete().eq('code',code);}
    else{await mpUpdateRoom(code,{guest:null});}
    mpCleanup(); mpScreen('main');
}

/* ════════════════════════════════════════
   REALTIME LISTENER
════════════════════════════════════════ */
function mpListen(code){
    var sb=mpSB(); if(!sb) return;
    if(mpState.channel) mpState.channel.unsubscribe();

    mpState.channel=sb.channel('room-'+code)
        .on('postgres_changes',{event:'*',schema:'public',table:'pvp_rooms',filter:'code=eq.'+code},
            function(payload){
                if(!payload.new){mpCleanup();showToast('Room closed.','info');mpScreen('main');return;}
                mpHandleUpdate(payload.new);
            })
        .subscribe();

    /* Initial render */
    mpGetRoom(code).then(function(data){if(data)mpHandleUpdate(data);});
}

function mpHandleUpdate(data){
    var phase=data.state?data.state.phase:'lobby';
    mpState.settings=data.settings||mpState.settings;

    if(phase==='lobby'){
        if(document.getElementById('mp-overlay').style.display==='flex'){
            _mpScreenLobby(document.getElementById('mp-body'),data);
        }
        _mpCheckBothReady(data);
    } else if(phase==='playing'){
        _mpRenderGame(data);
    } else if(phase==='ended'){
        _mpShowGameOver(data);
    }
}

function _mpCheckBothReady(data){
    if(!data.host||!data.guest||!data.host.ready||!data.guest.ready) return;
    if(mpState.role!=='host') return;
    var st=document.getElementById('mp-lobby-status');
    if(st)st.innerText='Both ready! Starting...';
    setTimeout(function(){_mpStartGame(data);},1000);
}

/* ════════════════════════════════════════
   GAME START
════════════════════════════════════════ */
async function _mpStartGame(data){
    var settings=data.settings||{deckMode:'own',timer:10};
    var hostDeck=data.host.deck||myDeck.slice();
    var guestDeck=data.guest.deck||mpBuildDeck(settings.deckMode,hostDeck);
    if(settings.deckMode==='mirror') guestDeck=hostDeck.slice();
    var hPile=shuffleArray(hostDeck.slice()), gPile=shuffleArray(guestDeck.slice());
    var max=Math.min(hPile.length,gPile.length);
    var hHand=[hPile.shift()], gHand=[gPile.shift()];
    await mpUpdateRoom(mpState.roomCode,{state:{
        phase:'playing', round:1, maxRounds:max,
        scores:{host:0,guest:0}, statTurn:'host',
        hostPile:hPile, guestPile:gPile,
        hostHand:hHand, guestHand:gHand,
        hostPlayed:null, guestPlayed:null,
        stat:null, roundPhase:'play', lastResult:null,
        deadline:Date.now()+(settings.timer>0?settings.timer*1000:999999)
    }});
}

/* ════════════════════════════════════════
   RENDER GAME
════════════════════════════════════════ */
function _mpRenderGame(data){
    var gs=data.state, amHost=mpState.role==='host', opp=amHost?data.guest:data.host;
    var arena=document.getElementById('battle-arena');
    if(arena.style.display!=='flex'){
        document.getElementById('mp-overlay').style.display='none';
        arena.style.display='flex';
        document.getElementById('gauntlet-hud').style.display='none';
        document.getElementById('battle-player-name').innerText=mpGetName();
        var botTag=document.querySelector('.bot-tag');
        if(botTag)botTag.innerText=opp?opp.name:'OPPONENT';
        if(!document.getElementById('mp-countdown')){
            var td=document.createElement('div');td.id='mp-countdown';td.className='mp-countdown';
            document.querySelector('.battle-topbar').appendChild(td);
        }
    }
    var myScore=amHost?gs.scores.host:gs.scores.guest;
    var thScore=amHost?gs.scores.guest:gs.scores.host;
    document.getElementById('battle-score').innerText=myScore+' - '+thScore;
    document.getElementById('round-counter').innerText='ROUND '+gs.round;
    var myHand=(amHost?gs.hostHand:gs.guestHand)||[];
    var myPile=(amHost?gs.hostPile:gs.guestPile)||[];
    var thHand=(amHost?gs.guestHand:gs.hostHand)||[];
    var myPlayed=amHost?gs.hostPlayed:gs.guestPlayed;
    var thPlayed=amHost?gs.guestPlayed:gs.hostPlayed;
    var rp=gs.roundPhase;
    if(gs.deadline&&mpState.settings.timer>0) _mpRunTimer(gs.deadline);
    /* Opponent hand */
    var bh=document.getElementById('bot-hand-display'); bh.innerHTML='';
    for(var i=0;i<thHand.length;i++){var m=document.createElement('div');m.className='bot-mini-card';bh.appendChild(m);}
    /* Draw pile */
    var dp=document.getElementById('draw-pile'); dp.innerHTML=''; dp.onclick=null; dp.classList.remove('must-draw');
    for(var j=0;j<Math.min(myPile.length,5);j++){var pc=document.createElement('div');pc.className='pile-card';pc.style.top=-(j*3)+'px';pc.style.left=j+'px';dp.appendChild(pc);}
    document.getElementById('pile-count').innerText=myPile.length;
    /* Slots */
    var ps=document.getElementById('player-battle-slot'), bs=document.getElementById('bot-battle-slot');
    ps.innerHTML='<span class="slot-label">YOU</span>'; bs.innerHTML='<span class="slot-label">'+(opp?opp.name:'OPP')+'</span>';
    ps.classList.remove('has-card'); bs.classList.remove('has-card');
    if(myPlayed){var mc=allCards.find(function(c){return c.id===myPlayed;});if(mc){ps.appendChild(createBattleCard(mc,false));ps.classList.add('has-card');}}
    if(thPlayed){var tc=allCards.find(function(c){return c.id===thPlayed;});if(tc){bs.appendChild(createBattleCard(tc,rp!=='result'));bs.classList.add('has-card');}}
    /* Phase indicator */
    var phEl=document.getElementById('phase-indicator');
    if(!phEl){phEl=document.createElement('div');phEl.id='phase-indicator';phEl.className='phase-indicator';document.querySelector('.battle-field').appendChild(phEl);}
    var atkBtn=document.getElementById('atk-btn'), defBtn=document.getElementById('def-btn');
    atkBtn.style.display='none'; defBtn.style.display='none';
    atkBtn.onclick=function(){_mpPickStat('dmg');}; defBtn.onclick=function(){_mpPickStat('hp');};
    if(rp==='play'){
        phEl.className='phase-indicator play-phase';
        phEl.innerText=myPlayed?'Waiting for opponent...':'PICK A CARD';
        _mpRenderHand(myHand,!myPlayed);
    } else if(rp==='stat'){
        var myTurn=gs.statTurn===(amHost?'host':'guest');
        phEl.className='phase-indicator stat-phase';
        phEl.innerText=myTurn?'CHOOSE ATK or DEF':'Opponent choosing...';
        if(myTurn){atkBtn.style.display='inline-block';defBtn.style.display='inline-block';}
        _mpRenderHand(myHand,false);
    } else if(rp==='result'){
        phEl.className='phase-indicator'; phEl.innerText='';
        _mpRenderHand(myHand,false);
        _mpShowRoundResult(gs,amHost,data);
    }
}

function _mpRenderHand(hand,interactive){
    var handEl=document.getElementById('player-hand'); handEl.innerHTML='';
    var t=hand.length; if(!t)return;
    var fanAngle=30,step=t>1?fanAngle/(t-1):0,start=t>1?-fanAngle/2:0;
    hand.forEach(function(id,idx){(function(i){
        var card=allCards.find(function(c){return c.id===id;}); if(!card)return;
        var angle=start+step*i,yOff=Math.abs(angle)*0.8;
        var wr=document.createElement('div');
        wr.className='hand-card-wrapper'+(interactive?'':' disabled');
        wr.style.transform='rotate('+angle+'deg) translateY('+yOff+'px)';
        wr.style.zIndex=i+1;
        wr.style.left='calc(50% + '+((i-(t-1)/2)*80)+'px - 60px)';
        var ce=document.createElement('div');
        ce.className='hand-card '+card.rarity;
        ce.style.backgroundImage="url('"+card.img+"')";
        var sa=angle,sy=yOff,sz=i+1;
        wr.onmouseenter=function(){
            wr.style.transform='rotate(0deg) translateY(-40px)';wr.style.zIndex=100;
            var tip=document.createElement('div');tip.className='hand-stat-tip';
            tip.innerHTML='<span class="hst-hp">♥ '+card.hp+'</span><span class="hst-dmg">⚔ '+card.dmg+'</span>';
            wr.appendChild(tip);
        };
        wr.onmouseleave=function(){
            wr.style.transform='rotate('+sa+'deg) translateY('+sy+'px)';wr.style.zIndex=sz;
            var tip=wr.querySelector('.hand-stat-tip');if(tip)tip.remove();
        };
        if(interactive)wr.onclick=function(){_mpPlayCard(id);};
        wr.appendChild(ce); handEl.appendChild(wr);
    })(idx);});
}

function _mpShowRoundResult(gs,amHost,data){
    if(!gs.lastResult||document.getElementById('mp-round-result'))return;
    var res=gs.lastResult,myKey=amHost?'host':'guest';
    var won=res.winner===myKey,draw=res.winner==='draw';
    var banner=document.createElement('div');banner.className='result-banner';banner.id='mp-round-result';
    banner.innerHTML='<div class="result-text '+(draw?'draw':won?'win':'lose')+'">'+(draw?'DRAW':won?'YOU WIN!':'YOU LOSE')+'</div>'+
        '<div class="result-sub">'+res.stat.toUpperCase()+' | '+(amHost?res.hostVal:res.guestVal)+' vs '+(amHost?res.guestVal:res.hostVal)+'</div>';
    document.getElementById('battle-arena').appendChild(banner);
    if(mpState.role==='host'){
        setTimeout(function(){var b=document.getElementById('mp-round-result');if(b)b.remove();_mpAdvanceRound(gs,data);},2000);
    }else{setTimeout(function(){var b=document.getElementById('mp-round-result');if(b)b.remove();},2000);}
}

/* ════════════════════════════════════════
   PLAYER ACTIONS
════════════════════════════════════════ */
async function _mpPlayCard(cardId){
    var code=mpState.roomCode; if(!code)return;
    var data=await mpGetRoom(code); if(!data)return;
    var gs=data.state; if(!gs||gs.roundPhase!=='play')return;
    var amHost=mpState.role==='host';
    var playedKey=amHost?'hostPlayed':'guestPlayed';
    var otherKey=amHost?'guestPlayed':'hostPlayed';
    if(gs[playedKey])return;
    var newState=Object.assign({},gs);
    newState[playedKey]=cardId;
    if(gs[otherKey]){newState.roundPhase='stat';newState.deadline=Date.now()+_mpTimerMs();}
    await mpSB().from('pvp_rooms').update({state:newState}).eq('code',code);
}

async function _mpPickStat(stat){
    var code=mpState.roomCode; if(!code)return;
    document.getElementById('atk-btn').style.display='none';
    document.getElementById('def-btn').style.display='none';
    var data=await mpGetRoom(code); if(!data)return;
    var gs=data.state; if(!gs||gs.roundPhase!=='stat')return;
    var amHost=mpState.role==='host';
    if(gs.statTurn!==(amHost?'host':'guest'))return;
    var hCard=allCards.find(function(c){return c.id===gs.hostPlayed;});
    var gCard=allCards.find(function(c){return c.id===gs.guestPlayed;});
    if(!hCard||!gCard)return;
    var hVal=stat==='dmg'?hCard.dmg:hCard.hp;
    var gVal=stat==='dmg'?gCard.dmg:gCard.hp;
    var winner=hVal>gVal?'host':gVal>hVal?'guest':'draw';
    var newState=Object.assign({},gs,{
        stat:stat, roundPhase:'result',
        scores:{host:gs.scores.host+(winner==='host'?1:0),guest:gs.scores.guest+(winner==='guest'?1:0)},
        lastResult:{stat,winner,hostCard:gs.hostPlayed,guestCard:gs.guestPlayed,hostVal:hVal,guestVal:gVal}
    });
    await mpSB().from('pvp_rooms').update({state:newState}).eq('code',code);
}

async function _mpAdvanceRound(gs,data){
    var next=gs.round+1;
    if(next>gs.maxRounds){
        await mpSB().from('pvp_rooms').update({state:Object.assign({},gs,{phase:'ended'})}).eq('code',mpState.roomCode);
        return;
    }
    var hHand=(gs.hostHand||[]).filter(function(id){return id!==gs.hostPlayed;});
    var gHand=(gs.guestHand||[]).filter(function(id){return id!==gs.guestPlayed;});
    var hPile=(gs.hostPile||[]).slice(), gPile=(gs.guestPile||[]).slice();
    if(hPile.length)hHand.push(hPile.shift());
    if(gPile.length)gHand.push(gPile.shift());
    var newState=Object.assign({},gs,{
        round:next, statTurn:gs.statTurn==='host'?'guest':'host',
        hostPile:hPile, guestPile:gPile,
        hostHand:hHand, guestHand:gHand,
        hostPlayed:null, guestPlayed:null,
        stat:null, lastResult:null,
        roundPhase:'play', deadline:Date.now()+_mpTimerMs()
    });
    await mpSB().from('pvp_rooms').update({state:newState}).eq('code',mpState.roomCode);
}

/* ════════════════════════════════════════
   GAME OVER
════════════════════════════════════════ */
function _mpShowGameOver(data){
    var gs=data.state, amHost=mpState.role==='host';
    var myScore=amHost?gs.scores.host:gs.scores.guest;
    var thScore=amHost?gs.scores.guest:gs.scores.host;
    var won=myScore>thScore, draw=myScore===thScore;
    document.getElementById('battle-arena').style.display='none';
    var goBox=document.getElementById('game-over-box');
    goBox.innerHTML=
        '<div class="game-over-title '+(draw?'':'') +'">'+(draw?'DRAW 🤝':won?'VICTORY 🏆':'DEFEAT 💀')+'</div>'+
        '<div class="game-over-stats">'+
            '<div class="go-stat"><div class="go-stat-val">'+myScore+'</div><div class="go-stat-label">Your Score</div></div>'+
            '<div class="go-stat"><div class="go-stat-val">'+thScore+'</div><div class="go-stat-label">Their Score</div></div>'+
        '</div>'+
        '<div class="go-action-row">'+
            '<button class="modal-btn" onclick="mpReturnMenu()">MENU</button>'+
            '<button class="modal-btn" style="background:linear-gradient(135deg,#27ae60,#229954);" onclick="mpCleanup();openMultiplayerMenu()">REMATCH</button>'+
        '</div>';
    document.getElementById('game-over-screen').style.display='flex';
    if(won)createExplosion(window.innerWidth/2,window.innerHeight/2,'rainbow');
    playerProfile.totalMatches++; if(won){playerProfile.totalWins++;playerProfile.winStreak++;}else playerProfile.winStreak=0;
    saveFullState(); mpCleanup();
}
function mpReturnMenu(){document.getElementById('game-over-screen').style.display='none';document.getElementById('mp-overlay').style.display='flex';mpScreen('main');}

/* ════════════════════════════════════════
   TIMER
════════════════════════════════════════ */
function _mpTimerMs(){var t=mpState.settings?mpState.settings.timer:10;return(t>0?t:30)*1000;}
function _mpRunTimer(deadline){
    if(mpState.timerInterval)clearInterval(mpState.timerInterval);
    var el=document.getElementById('mp-countdown');
    mpState.timerInterval=setInterval(function(){
        var rem=Math.max(0,Math.ceil((deadline-Date.now())/1000));
        if(el){el.innerText=rem+'s';el.className='mp-countdown'+(rem<=3?' urgent':'');}
        if(rem<=0){clearInterval(mpState.timerInterval);_mpAutoAction();}
    },250);
}
async function _mpAutoAction(){
    var data=await mpGetRoom(mpState.roomCode); if(!data)return;
    var gs=data.state; if(!gs)return;
    var amHost=mpState.role==='host';
    if(gs.roundPhase==='play'){
        var played=amHost?gs.hostPlayed:gs.guestPlayed;
        if(!played){var hand=amHost?(gs.hostHand||[]):(gs.guestHand||[]);if(hand.length)_mpPlayCard(hand[0]);}
    } else if(gs.roundPhase==='stat'){
        if(gs.statTurn===(amHost?'host':'guest')) _mpPickStat(Math.random()<0.5?'dmg':'hp');
    }
}

/* ════════════════════════════════════════
   CLEANUP
════════════════════════════════════════ */
function mpCleanup(){
    if(mpState.timerInterval)clearInterval(mpState.timerInterval);
    if(mpState.channel){try{mpState.channel.unsubscribe();}catch(e){}}
    mpState={active:false,role:null,roomCode:null,channel:null,settings:{},timerInterval:null};
    var cd=document.getElementById('mp-countdown'); if(cd)cd.remove();
}