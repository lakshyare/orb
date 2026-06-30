/* ===== BATTLE + DRAFT + GAUNTLET ===== */

var battleTouchBound = false;
var _battleLastTouchTap = 0;

function bindBattleTouchControls(){
    if(battleTouchBound) return;
    battleTouchBound = true;

    var drawPile = document.getElementById('draw-pile');
    var atkBtn = document.getElementById('atk-btn');
    var defBtn = document.getElementById('def-btn');

    if(drawPile && !drawPile._touchBound){
        drawPile._touchBound = true;
        drawPile.addEventListener('touchstart', function(e){
            e.preventDefault();
            var now = Date.now();
            if(now - _battleLastTouchTap < 180) return;
            _battleLastTouchTap = now;
            drawCard();
        }, {passive:false});
    }

    if(atkBtn && !atkBtn._touchBound){
        atkBtn._touchBound = true;
        atkBtn.addEventListener('touchstart', function(e){
            e.preventDefault();
            if(battleState.active && battleState.phase==='stat' && battleState.playerChoosesStat) resolveRound('dmg');
        }, {passive:false});
    }

    if(defBtn && !defBtn._touchBound){
        defBtn._touchBound = true;
        defBtn.addEventListener('touchstart', function(e){
            e.preventDefault();
            if(battleState.active && battleState.phase==='stat' && battleState.playerChoosesStat) resolveRound('hp');
        }, {passive:false});
    }
}
function unbindBattleTouchControls(){
    // listeners are lightweight and element-scoped; keeping them is safe,
    // but we mark state off so we can rebinding-skip cleanly next launch.
    battleTouchBound = false;
}

/* ===== MODE / MODAL ===== */
function setBattleDifficulty(d,el){
    currentBattleDifficulty=d;
    document.querySelectorAll('.fight-diff-pill').forEach(function(x){x.classList.remove('active');});
    if(el)el.classList.add('active');
}
function setFightMode(mode,el){
    currentFightMode=mode;
    document.querySelectorAll('.fmt').forEach(function(x){x.classList.remove('active');});
    if(el)el.classList.add('active');

    document.getElementById('fight-normal-content').style.display=mode==='normal'?'block':'none';
    document.getElementById('fight-draft-content').style.display=mode==='draft'?'block':'none';
    document.getElementById('fight-gauntlet-content').style.display=mode==='gauntlet'?'block':'none';
    document.getElementById('fight-difficulty-row').style.display=mode==='draft'?'none':'flex';

    if(mode==='gauntlet'){
        document.getElementById('gauntlet-deck-display').innerText=myDeck.length;
        document.getElementById('gauntlet-best-display').innerText='Personal Best: Stage '+(playerProfile.gauntletBest||0);
    }
}
function openFightModal(){
    if(packBuffer.length>0){alert('Flip pack cards first!');return;}
    document.getElementById('slider-val-display').innerText=myDeck.length;
    document.getElementById('gauntlet-deck-display').innerText=myDeck.length;
    document.getElementById('gauntlet-best-display').innerText='Best: Stage '+(playerProfile.gauntletBest||0);
    var w=document.getElementById('deck-warning');
    if(w)w.innerText=myDeck.length+' cards ready';
    document.getElementById('fight-modal-overlay').style.display='flex';
}
function closeFightModal(){document.getElementById('fight-modal-overlay').style.display='none';}
function handleFightStart(){
    if(currentFightMode==='draft')startDraft();
    else if(currentFightMode==='gauntlet')startGauntlet();
    else startNormalBattle();
}

/* ===== BATTLE CORE ===== */
function startNormalBattle(){
    if(myDeck.length<1){alert('Need at least 1 card!');return;}
    closeFightModal();
    showCoinFlip(function(playerGoesFirst){
        var state=launchBattle(myDeck.slice(),false,false,playerGoesFirst);
    });
}
function generateBotDeck(count){
    return shuffleArray(allCards.map(function(c){return c.id;})).slice(0,count);
}

function launchBattle(deckIds,isDraft,isGauntlet,playerFirst){
    var count=deckIds.length;
    battleState={
        active:true,
        userPile:shuffleArray(deckIds.slice()),
        botPile:shuffleArray(generateBotDeck(count)),
        userHand:[],botHand:[],userPlayed:null,botPlayed:null,
        round:1,playerScore:0,botScore:0,loot:[],lost:[],
        maxRounds:count,resolving:false,deckSizeAtStart:count,
        phase:'draw',drawsAllowed:2,drawsTaken:0,
        playerChoosesStat:playerFirst!==false,
        cooldowns:{}, botCooldowns:{},
        botLastPlayed:null,isDraft:isDraft,isGauntlet:isGauntlet,history:[]
    };
    document.getElementById('battle-arena').style.display='flex';
    document.getElementById('battle-player-name').innerText=playerProfile.name||'YOU';
    if(isGauntlet)document.getElementById('gauntlet-hud').style.display='block';
    updateBattleUI();
    bindBattleTouchControls();
}

function showCoinFlip(callback){
    var ov=document.createElement('div');
    ov.id='coin-flip-overlay';
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:20000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;';

    var title=document.createElement('div');
    title.style.cssText='font-family:Cinzel,serif;font-size:1.6rem;font-weight:900;color:var(--brand-gold);letter-spacing:4px;';
    title.innerText='CALL IT!';

    var sub=document.createElement('div');
    sub.style.cssText='color:#888;font-size:0.9rem;letter-spacing:1px;';
    sub.innerText='Who goes first?';

    /* 3D coin */
    var coinWrap=document.createElement('div');
    coinWrap.style.cssText='perspective:600px;width:120px;height:120px;margin:10px 0;';

    var coin=document.createElement('div');
    coin.id='flip-coin';
    coin.style.cssText='width:120px;height:120px;position:relative;transform-style:preserve-3d;transform:rotateY(0deg);transition:transform 2.2s cubic-bezier(0.4,0,0.2,1);cursor:default;';

    var front=document.createElement('div');
    front.style.cssText='position:absolute;inset:0;border-radius:50%;backface-visibility:hidden;overflow:hidden;';
    front.style.background='#1a1208';
    front.style.boxShadow='inset 0 2px 6px rgba(255,255,255,0.15), 0 8px 28px rgba(0,0,0,0.7)';
    var fImg=document.createElement('img');
    fImg.src='assets/coin-head.png';
    fImg.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;';
    fImg.onerror=function(){
        front.innerHTML='<span style="font-size:2.8rem;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">💀</span>';
    };
    front.appendChild(fImg);

    var back=document.createElement('div');
    back.style.cssText='position:absolute;inset:0;border-radius:50%;backface-visibility:hidden;transform:rotateY(180deg);overflow:hidden;';
    back.style.background='#1a1208';
    back.style.boxShadow='inset 0 2px 6px rgba(255,255,255,0.15), 0 8px 28px rgba(0,0,0,0.7)';
    var bImg=document.createElement('img');
    bImg.src='assets/coin-tail.png';
    bImg.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;';
    bImg.onerror=function(){
        back.innerHTML='<span style="font-size:1.1rem;font-weight:900;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#c8a415;letter-spacing:2px;">ORB</span>';
    };
    back.appendChild(bImg);
    coin.appendChild(front);
    coin.appendChild(back);
    coinWrap.appendChild(coin);

    var btnRow=document.createElement('div');
    btnRow.style.cssText='display:flex;gap:16px;';

    var result=document.createElement('div');
    result.style.cssText='font-size:1.1rem;font-weight:900;min-height:28px;letter-spacing:2px;';

    var chosen=null;

    function makeBtn(label,isHeads){
        var b=document.createElement('button');
        b.style.cssText='background:rgba(255,255,255,0.06);border:2px solid rgba(255,255,255,0.2);color:#fff;padding:12px 28px;border-radius:10px;font-weight:900;font-size:1rem;cursor:pointer;letter-spacing:1px;transition:all 0.2s;';
        b.innerText=label;
        b.onmouseover=function(){b.style.borderColor='var(--brand-gold)';b.style.color='var(--brand-gold)';};
        b.onmouseout=function(){b.style.borderColor='rgba(255,255,255,0.2)';b.style.color='#fff';};
        b.onclick=function(){
            if(chosen!==null)return;
            chosen=isHeads;
            btnRow.style.opacity='0.4';
            btnRow.style.pointerEvents='none';

            var spins=Math.floor(Math.random()*4+6);
            var landHeads=Math.random()<0.5;
            var finalDeg=spins*360+(landHeads?0:180);
            coin.style.transform='rotateY('+finalDeg+'deg)';

            setTimeout(function(){
                var playerFirst=(chosen===landHeads);
                result.style.color=playerFirst?'#2ecc71':'#e74c3c';
                result.innerText=playerFirst?'🎉 YOU GO FIRST!':'💀 BOT GOES FIRST!';
                result.style.animation='none';

                setTimeout(function(){
                    document.body.removeChild(ov);
                    callback(playerFirst);
                },1400);
            },2400);
        };
        return b;
    }

    btnRow.appendChild(makeBtn('⚔ HEADS',true));
    btnRow.appendChild(makeBtn('💀 TAILS',false));

    ov.appendChild(title);
    ov.appendChild(sub);
    ov.appendChild(coinWrap);
    ov.appendChild(btnRow);
    ov.appendChild(result);
    document.body.appendChild(ov);
}

/* Card cooldown */
function setCooldown(cardId){battleState.cooldowns[cardId]=2;}
function tickCooldowns(){
    Object.keys(battleState.cooldowns).forEach(function(id){
        battleState.cooldowns[id]--;
        if(battleState.cooldowns[id]<=0)delete battleState.cooldowns[id];
    });
    Object.keys(battleState.botCooldowns).forEach(function(id){
        battleState.botCooldowns[id]--;
        if(battleState.botCooldowns[id]<=0)delete battleState.botCooldowns[id];
    });
}
function isOnCooldown(cardId){return !!battleState.cooldowns[cardId];}

function drawCard(){
    if(!battleState.active||battleState.resolving||battleState.phase!=='draw')return;

    if(battleState.drawsTaken>=battleState.drawsAllowed){
        if(battleState.userHand.length>0){
            battleState.phase='play';
            updateBattleUI();
        }
        return;
    }

    if(battleState.userPile.length===0){
        if(battleState.userHand.length>0){
            battleState.phase='play';
            updateBattleUI();
        }else endBattle();
        return;
    }

    battleState.userHand.push(battleState.userPile.shift());
    battleState.drawsTaken++;

    if(battleState.botPile.length>0)battleState.botHand.push(battleState.botPile.shift());

    if(battleState.drawsTaken>=battleState.drawsAllowed||battleState.userPile.length===0)battleState.phase='play';
    updateBattleUI();
}

function playHandCard(index){
    if(!battleState.active||battleState.resolving||battleState.phase!=='play')return;
    var id=battleState.userHand[index];
    if(isOnCooldown(id))return;

    battleState.userPlayed=id;
    trackMostUsedCard(id);
    battleState.userHand.splice(index,1);
    setCooldown(id);

    if(battleState.botHand.length>0){
        var bi=botPickCard();
        battleState.botPlayed=battleState.botHand[bi];
        battleState.botHand.splice(bi,1);
        battleState.botCooldowns[battleState.botPlayed]=2;
        var pC = allCards.find(function(c){
        return c.id === battleState.userPlayed;
    });
        var bC = allCards.find(function(c){
    return c.id === battleState.botPlayed;
})

if(!pC || !bC){
    battleState.resolving = false;
    return;
}
    }

    battleState.phase='stat';
    updateBattleUI();

    if(battleState.playerChoosesStat){
        document.getElementById('def-btn').style.display='inline-block';
        document.getElementById('atk-btn').style.display='inline-block';
    }else{
        document.getElementById('def-btn').style.display='none';
        document.getElementById('atk-btn').style.display='none';
        setTimeout(botChoosesStat,1200);
    }
}

function botPickCard(){
    /* Filter out cooldown cards and the card played last round */
    var available=battleState.botHand.filter(function(id){
        return !battleState.botCooldowns[id];
    });
    if(available.length===0) available=battleState.botHand; /* fallback: all cards */

    if(available.length===1){
        return battleState.botHand.indexOf(available[0]);
    }

    var best=-1,bestS=-1;
    for(var i=0;i<available.length;i++){
        var c=allCards.find(function(x){return x.id===available[i];});
        if(!c)continue;
        var s=(Math.max(c.dmg,c.hp)+Math.random()*30)*battleDifficultySettings[currentBattleDifficulty].botBias;
        if(s>bestS){bestS=s;best=i;}
    }

    var pickedId=available[Math.max(best,0)];
    return battleState.botHand.indexOf(pickedId);
}

function botChoosesStat(){
    if(!battleState.active)return;
    var bsc=document.querySelector('#bot-battle-slot .battle-card');
    if(bsc)bsc.classList.remove('face-down');

    setTimeout(function(){
        var bc=allCards.find(function(c){return c.id===battleState.botPlayed;});
        var stat=Math.random()<0.8?(bc.dmg>bc.hp?'dmg':'hp'):(Math.random()<0.5?'dmg':'hp');
        setTimeout(function(){resolveRound(stat);},800);
    },800);
}

function resolveRound(stat){
    if(battleState.resolving)return;
    battleState.resolving=true;

    document.getElementById('atk-btn').style.display='none';
    document.getElementById('def-btn').style.display='none';

    var pC=allCards.find(function(c){return c.id===battleState.userPlayed;}),
        bC=allCards.find(function(c){return c.id===battleState.botPlayed;});
    if(!pC||!bC){battleState.resolving=false;return;}

    if(battleState.playerChoosesStat){
        var bsc=document.querySelector('#bot-battle-slot .battle-card');
        if(bsc)bsc.classList.remove('face-down');
    }

    var pS=stat==='dmg'?pC.dmg:pC.hp,
        bS=stat==='dmg'?bC.dmg:bC.hp;

    setTimeout(function(){
        battleState.history.push({
            pC: pC, bC: bC, stat: stat, 
            pS: pS, bS: bS, 
            winner: (pS>bS ? 'player' : (pS<bS ? 'bot' : 'draw'))
        });

        var ps=document.getElementById('player-battle-slot').getBoundingClientRect(),
            bs=document.getElementById('bot-battle-slot').getBoundingClientRect();

        if(pS>bS){
            battleState.playerScore++;
            battleState.userHand.push(pC.id);
            battleState.userHand.push(bC.id);

            if(!battleState.isDraft){
                myInventory.push(bC.id);newCardIds[bC.id]=true;
                cardAcquiredTime[bC.id]=cardAcquiredTime[bC.id]||Date.now();
            }
            battleState.loot.push(bC.id);

            spawnDamagePop(bs.left+bs.width/2,bs.top,'-'+pS,'red');
            createExplosion(window.innerWidth/2,window.innerHeight/2,'accent');
            if(pS>=280)triggerScreenShake();
            showRoundResult('win',pC,bC,stat);


        }else if(pS<bS){
            battleState.botScore++;
            battleState.botHand.push(bC.id);
            battleState.botHand.push(pC.id);


            if(!battleState.isDraft){
                var li=myInventory.indexOf(pC.id);if(li>-1)myInventory.splice(li,1);
                myDeck=myDeck.filter(function(x){return x!==pC.id;});
            }
            battleState.lost.push(pC.id);

            spawnDamagePop(ps.left+ps.width/2,ps.top,'-'+bS,'red');
            if(bS>=280)triggerScreenShake();
            showRoundResult('lose',pC,bC,stat);

        }else{
            battleState.userHand.push(bC.id);
            if(!battleState.isDraft){myInventory.push(bC.id);newCardIds[bC.id]=true;}
            battleState.loot.push(bC.id);

            battleState.botHand.push(pC.id);
            if(!battleState.isDraft){
                var li2=myInventory.indexOf(pC.id);if(li2>-1)myInventory.splice(li2,1);
                myDeck=myDeck.filter(function(x){return x!==pC.id;});
            }
            battleState.lost.push(pC.id);

            spawnDamagePop(ps.left+ps.width/2,ps.top,'SWAP','gold');
            showRoundResult('draw',pC,bC,stat);
        }

        setTimeout(function(){
            clearRoundResult();
            tickCooldowns();

            var tl=battleState.userPile.length+battleState.userHand.length;
            if(battleState.round>=battleState.maxRounds||tl===0){endBattle();return;}

            battleState.round++;
            battleState.userPlayed=null;
            battleState.botPlayed=null;
            battleState.resolving=false;
            battleState.playerChoosesStat=!battleState.playerChoosesStat;
            battleState.drawsAllowed=1;
            battleState.drawsTaken=0;
            battleState.phase=battleState.userPile.length>0?'draw':'play';
            updateBattleUI();
        },2200);
    },1000);
}

function showRoundResult(type,pC,bC,stat){
    var b=document.createElement('div');
    b.className='result-banner';
    b.id='round-result-banner';
    var pV=stat==='dmg'?pC.dmg:pC.hp,bV=stat==='dmg'?bC.dmg:bC.hp;
    b.innerHTML=
        '<div class="result-text '+(type==='draw'?'draw':type)+'">'+(type==='win'?'YOU WIN!':type==='lose'?'YOU LOSE':'DRAW!')+'</div>'+
        '<div class="result-sub">'+(type==='draw'?'Cards exchanged!':pC.name+' ('+pV+') vs '+bC.name+' ('+bV+')')+'</div>';
    document.getElementById('battle-arena').appendChild(b);
}
function clearRoundResult(){
    var b=document.getElementById('round-result-banner');
    if(b)b.remove();
}

function updateBattleUI(){
    document.getElementById('round-counter').innerText='ROUND '+battleState.round;
    document.getElementById('battle-score').innerText=battleState.playerScore+' - '+battleState.botScore;

    renderDrawPile();
    renderBotHand();
    renderBattleSlots();
    renderPlayerHand();

    var ep=document.getElementById('phase-indicator');
    if(ep)ep.remove();

    var ph=document.createElement('div');
    ph.id='phase-indicator';
    ph.className='phase-indicator';
    if(battleState.phase==='draw'){
        ph.classList.add('draw-phase');
        ph.innerText='DRAW — '+(battleState.drawsAllowed-battleState.drawsTaken)+' left [SPACE]';
    }else if(battleState.phase==='play'){
        ph.classList.add('play-phase');
        ph.innerText='PLAY A CARD [1-5]';
    }else{
        ph.classList.add('stat-phase');
        ph.innerText=battleState.playerChoosesStat?'CHOOSE [A]tk / [D]ef':'BOT CHOOSING...';
    }
    document.querySelector('.battle-field').appendChild(ph);

    var dp=document.getElementById('draw-pile');
    dp.classList.toggle('must-draw',battleState.phase==='draw'&&battleState.drawsTaken<battleState.drawsAllowed&&battleState.userPile.length>0);
    document.getElementById('draws-left-text').innerText='DRAW: '+(battleState.drawsAllowed-battleState.drawsTaken);

    if(gauntletState.active){
        document.getElementById('gauntlet-stage-display').innerText='STAGE '+gauntletState.stage;
        document.getElementById('gauntlet-diff-display').innerText=battleDifficultySettings[currentBattleDifficulty].label;
        document.getElementById('gauntlet-reward-display').innerText='+'+gauntletState.totalGold+'g earned';
    }
}

function renderDrawPile(){
    var p=document.getElementById('draw-pile');
    p.innerHTML='';
    for(var i=0;i<Math.min(battleState.userPile.length,5);i++){
        var pc=document.createElement('div');
        pc.className='pile-card';
        pc.style.top=-(i*3)+'px';
        pc.style.left=i+'px';
        p.appendChild(pc);
    }
    document.getElementById('pile-count').innerText=battleState.userPile.length;
    p.style.opacity=battleState.userPile.length===0?'0.3':'1';
}
function renderBotHand(){
    var c=document.getElementById('bot-hand-display');
    c.innerHTML='';
    for(var i=0;i<battleState.botHand.length;i++){
        var m=document.createElement('div');
        m.className='bot-mini-card';
        c.appendChild(m);
    }
}
function renderBattleSlots(){
    var ps=document.getElementById('player-battle-slot'),
        bs=document.getElementById('bot-battle-slot');
    ps.innerHTML='<span class="slot-label">YOU</span>';
    bs.innerHTML='<span class="slot-label">BOT</span>';

    if(battleState.userPlayed){
        var pc=allCards.find(function(c){return c.id===battleState.userPlayed;});
        if(pc)ps.appendChild(createBattleCard(pc,false));
        ps.classList.add('has-card');
    }else ps.classList.remove('has-card');

    if(battleState.botPlayed){
        var bc=allCards.find(function(c){return c.id===battleState.botPlayed;});
        if(bc)bs.appendChild(createBattleCard(bc,true));
        bs.classList.add('has-card');
    }else bs.classList.remove('has-card');
}
function createBattleCard(card,faceDown){
    var el=document.createElement('div');
    el.className='battle-card'+(faceDown?' face-down':'');
    if(!faceDown&&card.rarity==='legendary')el.classList.add('legendary-battle');
    if(!faceDown&&card.rarity==='epic')el.classList.add('epic-battle');
    el.innerHTML='<div class="bc-front" style="background-image:url(\''+card.img+'\');"></div><div class="bc-back"></div>';
    return el;
}
function renderPlayerHand(){
    var hand=document.getElementById('player-hand');
    hand.innerHTML='';
    var t=battleState.userHand.length;
    if(!t)return;

    var fanAngle=30,step=t>1?fanAngle/(t-1):0,start=t>1?-fanAngle/2:0,
        playable=battleState.phase==='play'&&!battleState.resolving,
        isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;

    for(var i=0;i<t;i++){
        (function(idx){
            var id=battleState.userHand[idx],
                card=allCards.find(function(c){return c.id===id;});
            if(!card)return;

            var angle=start+step*idx,yOff=Math.abs(angle)*0.8,cool=isOnCooldown(id);
            var wr=document.createElement('div');
            wr.className='hand-card-wrapper'+(playable&&!cool?'':' disabled')+(cool?' on-cooldown':'');
            wr.style.transform='rotate('+angle+'deg) translateY('+yOff+'px)';
            wr.style.zIndex=idx+1;
            wr.style.left='calc(50% + '+((idx-(t-1)/2)*80)+'px - 60px)';

            var ce=document.createElement('div');
            ce.className='hand-card '+card.rarity;
            ce.style.backgroundImage="url('"+card.img+"')";

            if(cool){
                var cb=document.createElement('div');
                cb.className='cooldown-badge';
                cb.innerText=battleState.cooldowns[id];
                wr.appendChild(cb);
            }

            if(playable&&!cool&&idx<5){
                var kb=document.createElement('div');
                kb.className='hand-keybind';
                kb.innerText='['+(idx+1)+']';
                wr.appendChild(kb);
            }

            var sa=angle,sy=yOff,sz=idx+1;

            if(!isTouch){
                wr.onmouseenter=function(){
                    wr.style.transform='rotate(0deg) translateY(-40px)';
                    wr.style.zIndex=100;
                    /* Stat tooltip */
                    var tip=document.createElement('div');
                    tip.className='hand-stat-tip';
                    tip.innerHTML='<span class="hst-hp">♥ '+card.hp+'</span><span class="hst-dmg">⚔ '+card.dmg+'</span>';
                    wr.appendChild(tip);
                };
                wr.onmouseleave=function(){
                    wr.style.transform='rotate('+sa+'deg) translateY('+sy+'px)';
                    wr.style.zIndex=sz;
                    var tip=wr.querySelector('.hand-stat-tip');
                    if(tip)tip.remove();
                };
            }

            if(playable&&!cool){
                wr.onclick=function(){playHandCard(idx);};
                if(isTouch){
                    wr.addEventListener('touchstart',function(ev){
                        ev.preventDefault();
                        playHandCard(idx);
                    },{passive:false});
                }
            }

            wr.appendChild(ce);
            hand.appendChild(wr);
        })(i);
    }
}

/* ===== BATTLE END ===== */
function endBattle(){
    battleState.active=false;
    document.getElementById('battle-arena').style.display='none';
    unbindBattleTouchControls();

    if(gauntletState.active){endGauntletStage();return;}

    playerProfile.totalMatches++;
    var won=battleState.playerScore>battleState.botScore;
    if(won){
        playerProfile.totalWins++;
        playerProfile.winStreak++;
        updateObjectiveProgress('win_battle',1);
        if(typeof advanceQuest==='function') advanceQuest('first_battle');
        if(playerProfile.totalWins>=1)unlockAchievement('first_bot_win');
    }else playerProfile.winStreak=0;

    if(!battleState.isDraft){
        battleState.lost.forEach(function(lid){
            var idx=myInventory.indexOf(lid);
            if(idx>-1)myInventory.splice(idx,1);
            myDeck=myDeck.filter(function(x){return x!==lid;});
        });
    }

    var mult=getStreakMultiplier()*battleDifficultySettings[currentBattleDifficulty].rewardMult;
    var xp=Math.round(((battleState.playerScore*25)+(won?50:10))*mult),
        gold=Math.round(((battleState.playerScore*50)+(won?100:0))*mult);

    addXP(xp);addCoins(gold);
    addBattleHistory(won?'win':'loss',battleState.playerScore,battleState.botScore,gold,xp);
    /* QoL: auto-add won cards to deck if space */
    if(won && !battleState.isDraft && battleState.loot.length){
        var added=[];
        battleState.loot.forEach(function(id){
            if(!myDeck.includes(id) && myDeck.length<9){
                myDeck.push(id);
                added.push(id);
            }
        });
        if(added.length){
            var names=added.map(function(id){
                var c=allCards.find(function(x){return x.id===id;});
                return c?c.name:id;
            });
            showShopToast('Added to deck: '+names.join(', '),'success');
        }
    }
    if(won&&battleState.deckSizeAtStart===1)unlockAchievement('underdog');
    checkAchievements();
    showGameOver(won,gold,xp);
    renderHomeProgress();
}

function showGameOver(won,gold,xp){
    var goBox=document.getElementById('game-over-box');
    var lootH='',lostH='';

    if(battleState.loot.length){
        lootH='<div class="loot-section"><h3>CARDS WON</h3><div class="loot-cards">';
        battleState.loot.forEach(function(id){
            var c=allCards.find(function(x){return x.id===id;});
            if(c)lootH+='<div class="loot-card-item '+c.rarity+'" style="background-image:url(\''+c.img+'\');"></div>';
        });
        lootH+='</div></div>';
    }
    if(battleState.lost.length){
        lostH='<div class="loot-section"><h3 style="color:#e74c3c;">CARDS LOST</h3><div class="loot-cards">';
        battleState.lost.forEach(function(id){
            var c=allCards.find(function(x){return x.id===id;});
            if(c)lostH+='<div class="loot-card-item" style="background-image:url(\''+c.img+'\');border-color:#e74c3c;opacity:0.7;"></div>';
        });
        lostH+='</div></div>';
    }

    goBox.innerHTML=
        '<div class="game-over-title '+(won?'victory':'defeat')+'">'+(won?'VICTORY':'DEFEAT')+'</div>'+
        '<div class="game-over-stats">'+
            '<div class="go-stat"><div class="go-stat-val">'+battleState.playerScore+'</div><div class="go-stat-label">Your Wins</div></div>'+
            '<div class="go-stat"><div class="go-stat-val">'+battleState.botScore+'</div><div class="go-stat-label">Bot Wins</div></div>'+
            '<div class="go-stat"><div class="go-stat-val" style="color:#2ecc71;">+'+gold+'g</div><div class="go-stat-label">Gold</div></div>'+
        '</div>'+
        '<div style="text-align:center;margin:15px 0;"><span style="background:#1a2a1a;border:1px solid #2ecc71;color:#2ecc71;padding:6px 18px;border-radius:20px;font-weight:bold;">+'+xp+' XP | LVL '+playerProfile.level+'</span></div>'+
        lootH+lostH+
        '<div class="go-action-row" style="flex-wrap:wrap; gap:10px; justify-content:center;">'+
            '<button class="modal-btn" onclick="closeGameOver()">RETURN</button>'+
            (battleState.history && battleState.history.length > 0 ? '<button class="modal-btn" style="background:#8e44ad;box-shadow:0 0 15px rgba(142,68,173,0.5);" onclick="replayBattle()">REPLAY BATTLE</button>' : '') +
            '<button class="modal-btn" style="background:linear-gradient(to bottom,#27ae60,#229954);" onclick="closeGameOver();openFightModal();">PLAY AGAIN</button>'+
        '</div>';

    document.getElementById('game-over-screen').style.display='flex';
    createExplosion(window.innerWidth/2,window.innerHeight/2,won?'accent':'red');
}
function closeGameOver(){
    document.getElementById('game-over-screen').style.display='none';
    document.getElementById('gauntlet-hud').style.display='none';
    renderRacks();renderGallery();updateHeaderProfile();
}
function forfeitBattle(){
    if(!confirm('Forfeit?'))return;

    if(!battleState.isDraft){
        battleState.loot.forEach(function(id){
            var i=myInventory.lastIndexOf(id);
            if(i>-1)myInventory.splice(i,1);
        });
        battleState.lost.forEach(function(id){myInventory.push(id);});
    }

    battleState.active=false;
    playerProfile.totalMatches++;
    playerProfile.winStreak=0;
    addBattleHistory('loss',battleState.playerScore,battleState.botScore,0,5);

    document.getElementById('battle-arena').style.display='none';
    document.getElementById('gauntlet-hud').style.display='none';
    gauntletState.active=false;

    unbindBattleTouchControls();
    renderRacks();renderGallery();checkAchievements();
}

/* ===== DRAFT MODE ===== */
function startDraft(){
    closeFightModal();
    var size=parseInt(document.getElementById('draft-size-slider').value)||5;
    var pool=[];
    for(var i=0;i<4;i++)allCards.forEach(function(c){pool.push(cloneObj(c));});
    pool=shuffleArray(pool).slice(0,24);

    draftState={active:true,pool:pool,playerPicks:[],botPicks:[],targetSize:size,playerTurn:true};
    document.getElementById('draft-overlay').style.display='flex';
    renderDraftGrid();
}

function renderDraftGrid(){
    var g=document.getElementById('draft-grid');
    g.innerHTML='';
    draftState.pool.forEach(function(card,i){
        var d=document.createElement('div');
        d.className='draft-card';
        d.style.backgroundImage="url('"+card.img+"')";
        if(card.pickedBy==='player')d.classList.add('picked-player');
        else if(card.pickedBy==='bot')d.classList.add('picked-bot');

        if(!card.pickedBy&&draftState.playerTurn)d.onclick=function(){draftPick(i);};
        g.appendChild(d);
    });

    document.getElementById('draft-status').innerText=draftState.playerTurn?'Your turn — pick a card':'Bot is picking...';
    document.getElementById('draft-counts').innerText='You: '+draftState.playerPicks.length+'/'+draftState.targetSize+' | Bot: '+draftState.botPicks.length+'/'+draftState.targetSize;

    var yp=document.getElementById('draft-your-picks'),
        bp=document.getElementById('draft-bot-picks');
    yp.innerHTML='';bp.innerHTML='';
    draftState.playerPicks.forEach(function(c){yp.innerHTML+='<div class="draft-mini" style="background-image:url(\''+c.img+'\');"></div>';});
    draftState.botPicks.forEach(function(){bp.innerHTML+='<div class="draft-mini" style="background-image:url(\'assets/card_back.png\');"></div>';});
}

function draftPick(i){
    if(!draftState.playerTurn||draftState.pool[i].pickedBy)return;
    draftState.pool[i].pickedBy='player';
    draftState.playerPicks.push(draftState.pool[i]);
    draftState.playerTurn=false;
    renderDraftGrid();

    if(draftState.playerPicks.length>=draftState.targetSize&&draftState.botPicks.length>=draftState.targetSize){setTimeout(finishDraft,600);return;}

    setTimeout(function(){
        botDraftPick();
        if(draftState.botPicks.length>=draftState.targetSize&&draftState.playerPicks.length>=draftState.targetSize){setTimeout(finishDraft,600);return;}
        draftState.playerTurn=true;
        renderDraftGrid();
    },800);
}
function botDraftPick(){
    var avail=[];
    draftState.pool.forEach(function(c,i){if(!c.pickedBy)avail.push(i);});
    if(!avail.length)return;
    avail.sort(function(a,b){
        var ca=draftState.pool[a],cb=draftState.pool[b];
        return (cb.dmg+cb.hp)-(ca.dmg+ca.hp);
    });
    var pick=Math.random()<0.6?avail[0]:avail[Math.floor(Math.random()*Math.min(avail.length,5))];
    draftState.pool[pick].pickedBy='bot';
    draftState.botPicks.push(draftState.pool[pick]);
    renderDraftGrid();
}
function finishDraft(){
    document.getElementById('draft-overlay').style.display='none';
    var deckIds=draftState.playerPicks.map(function(c){return c.id;});
    draftState.active=false;
    launchBattle(deckIds,true,false);
}

/* ===== GAUNTLET MODE ===== */
function startGauntlet(){
    if(myDeck.length<1){alert('Need at least 1 card!');return;}
    closeFightModal();
    gauntletState={
        active:true,stage:0,totalGold:0,totalXP:0,
        originalDeck:myDeck.slice(),currentDeck:myDeck.slice(),
        lootTotal:[],lostTotal:[]
    };
    nextGauntletStage();
}
function getGauntletDifficulty(stage){
    var diffs=['easy','normal','hard','nightmare'];
    var idx=Math.min(stage-1,3);
    if(stage>4){
        var cycle=(stage-5)%6;
        if(cycle>=4)idx=Math.floor(Math.random()*3);
        else idx=Math.min(cycle,3);
    }
    return diffs[idx];
}
function isRecoveryRound(stage){return stage>4&&(stage-5)%6>=4;}

function nextGauntletStage(){
    gauntletState.stage++;
    var diff=getGauntletDifficulty(gauntletState.stage);
    currentBattleDifficulty=diff;
    var isRec=isRecoveryRound(gauntletState.stage);
    if(isRec){
        var recDiffs=['easy','normal','hard'];
        currentBattleDifficulty=recDiffs[Math.floor(Math.random()*recDiffs.length)];
    }
    document.getElementById('gauntlet-hud').style.display='block';
    launchBattle(gauntletState.currentDeck.slice(),false,true);
}

function endGauntletStage(){
    var won=battleState.playerScore>battleState.botScore;
    var stageGold=Math.round((50+gauntletState.stage*30)*battleDifficultySettings[currentBattleDifficulty].rewardMult);
    var stageXP=Math.round((20+gauntletState.stage*15)*battleDifficultySettings[currentBattleDifficulty].rewardMult);

    battleState.loot.forEach(function(id){gauntletState.lootTotal.push(id);});
    battleState.lost.forEach(function(id){
        gauntletState.lostTotal.push(id);
        gauntletState.currentDeck=gauntletState.currentDeck.filter(function(x){return x!==id;});
    });
    battleState.loot.forEach(function(id){
        if(!gauntletState.currentDeck.includes(id))gauntletState.currentDeck.push(id);
    });

    if(won){
        gauntletState.totalGold+=stageGold;
        gauntletState.totalXP+=stageXP;
        playerProfile.totalMatches++;
        playerProfile.totalWins++;
        playerProfile.winStreak++;
        updateObjectiveProgress('win_battle',1);

        if(gauntletState.stage>playerProfile.gauntletBest){
            playerProfile.gauntletBest=gauntletState.stage;
            checkAchievements();
        }

        if(gauntletState.currentDeck.length===0){gauntletFinish(true);return;}

        var goBox=document.getElementById('game-over-box');
        goBox.innerHTML=
            '<div class="game-over-title victory">STAGE '+gauntletState.stage+' CLEAR!</div>'+
            '<div style="color:#2ecc71;font-size:1.2rem;margin:15px 0;font-weight:900;">+'+stageGold+'g | +'+stageXP+' XP</div>'+
            '<div style="color:#888;margin-bottom:20px;">Total earned: '+gauntletState.totalGold+'g</div>'+
            '<div class="go-action-row">'+
                '<button class="modal-btn" style="background:linear-gradient(to bottom,#27ae60,#229954);" onclick="closeGameOver();nextGauntletStage();">NEXT STAGE →</button>'+
                '<button class="modal-btn modal-cancel" onclick="gauntletQuit()">QUIT & KEEP</button>'+
            '</div>';
        document.getElementById('game-over-screen').style.display='flex';
    }else{
        playerProfile.totalMatches++;
        playerProfile.winStreak=0;
        gauntletFinish(false);
    }
}

function gauntletQuit(){
    document.getElementById('game-over-screen').style.display='none';
    document.getElementById('gauntlet-hud').style.display='none';
    addCoins(gauntletState.totalGold);
    addXP(gauntletState.totalXP);
    addBattleHistory('win',gauntletState.stage,0,gauntletState.totalGold,gauntletState.totalXP);
    gauntletState.active=false;
    createExplosion(window.innerWidth/2,window.innerHeight/2,'accent');
    renderRacks();renderGallery();renderHomeProgress();
}
function gauntletFinish(won){
    document.getElementById('gauntlet-hud').style.display='none';

    if(won){
        addCoins(gauntletState.totalGold);
        addXP(gauntletState.totalXP);
    }else{
        gauntletState.lootTotal.forEach(function(id){
            var i=myInventory.lastIndexOf(id);
            if(i>-1)myInventory.splice(i,1);
        });
        gauntletState.lostTotal.forEach(function(id){myInventory.push(id);});
        myDeck=gauntletState.originalDeck.filter(function(id){return myInventory.includes(id);});
    }

    addBattleHistory(won?'win':'loss',gauntletState.stage,0,won?gauntletState.totalGold:0,won?gauntletState.totalXP:0);

    var goBox=document.getElementById('game-over-box');
    goBox.innerHTML=
        '<div class="game-over-title '+(won?'victory':'defeat')+'">'+(won?'GAUNTLET COMPLETE!':'GAUNTLET OVER')+'</div>'+
        '<div style="font-size:1.5rem;color:var(--brand-gold);margin:15px 0;font-weight:900;">Reached Stage '+gauntletState.stage+'</div>'+
        '<div style="color:#888;">Gold: '+(won?'+'+gauntletState.totalGold:'0')+' | Best: Stage '+playerProfile.gauntletBest+'</div>'+
        '<div class="go-action-row"><button class="modal-btn" onclick="closeGameOver()">RETURN</button></div>';
    document.getElementById('game-over-screen').style.display='flex';

    gauntletState.active=false;
    createExplosion(window.innerWidth/2,window.innerHeight/2,won?'rainbow':'red');
    renderRacks();renderGallery();checkAchievements();
}
/* ===== H2. SMARTER BOT AI PROFILES ===== */
var botProfiles=['aggro','control','balanced'];
function getBotProfile(difficulty){
    /* Harder difficulties get smarter profiles */
    if(difficulty==='easy') return 'balanced';
    return botProfiles[Math.floor(Math.random()*botProfiles.length)];
}
function botPickCardAdvanced(profile, botHand, stat){
    if(!botHand||botHand.length===0) return null;
    var cards=botHand.map(function(id){return allCards.find(function(c){return c.id===id;});}).filter(Boolean);
    if(cards.length===0) return null;
    
    if(profile==='aggro'){
        /* Always pick highest ATK card */
        cards.sort(function(a,b){return b.dmg-a.dmg;});
        return cards[0];
    }else if(profile==='control'){
        /* Pick highest HP card to outlast */
        cards.sort(function(a,b){return b.hp-a.hp;});
        return cards[0];
    }else{
        /* Balanced: pick best card for the current stat being compared */
        if(stat==='hp') cards.sort(function(a,b){return b.hp-a.hp;});
        else cards.sort(function(a,b){return b.dmg-a.dmg;});
        /* 60% chance to pick optimal, 40% random for variety */
        return Math.random()<0.6 ? cards[0] : cards[Math.floor(Math.random()*cards.length)];
    }
}

/* ===== H3. POST-MATCH BREAKDOWN ===== */
function showPostMatchBreakdown(history, playerWon, difficulty){
    var turnsWon=0, turnsLost=0, turnsTotal=history.length;
    var misplays=[];
    
    history.forEach(function(turn,i){
        if(turn.result==='win') turnsWon++;
        else if(turn.result==='loss') turnsLost++;
        /* Detect misplays: player picked ATK but DEF would've won, or vice versa */
        if(turn.playerCard && turn.botCard){
            var pC=allCards.find(function(c){return c.id===turn.playerCard;});
            var bC=allCards.find(function(c){return c.id===turn.botCard;});
            if(pC && bC){
                if(turn.stat==='dmg' && pC.hp>bC.hp && pC.dmg<bC.dmg){
                    misplays.push('Round '+(i+1)+': DEF would have won');
                }else if(turn.stat==='hp' && pC.dmg>bC.dmg && pC.hp<bC.hp){
                    misplays.push('Round '+(i+1)+': ATK would have won');
                }
            }
        }
    });
    
    var tip='Keep it up!';
    if(misplays.length>2) tip='Try watching the bot\'s card stats before picking ATK or DEF.';
    else if(turnsLost>turnsWon) tip='Consider adding higher-stat cards to your deck.';
    else if(turnsWon>turnsLost+3) tip='You dominated! Try a harder difficulty.';
    
    var html='<div class="breakdown-modal glass-panel" onclick="event.stopPropagation()">'+
        '<h2 style="color:var(--brand-gold);letter-spacing:3px;margin:0 0 15px;">'+(playerWon?'🏆 VICTORY':'💀 DEFEAT')+'</h2>'+
        '<div style="display:flex;gap:30px;justify-content:center;margin-bottom:20px;">'+
            '<div style="text-align:center;"><div style="font-size:2rem;font-weight:900;color:#27ae60;">'+turnsWon+'</div><div style="color:#888;font-size:0.8rem;">WON</div></div>'+
            '<div style="text-align:center;"><div style="font-size:2rem;font-weight:900;color:#e74c3c;">'+turnsLost+'</div><div style="color:#888;font-size:0.8rem;">LOST</div></div>'+
            '<div style="text-align:center;"><div style="font-size:2rem;font-weight:900;color:#3498db;">'+turnsTotal+'</div><div style="color:#888;font-size:0.8rem;">ROUNDS</div></div>'+
        '</div>';
    
    if(misplays.length>0){
        html+='<div style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:10px;padding:12px;margin-bottom:15px;">'+
            '<div style="color:#e74c3c;font-weight:900;font-size:0.85rem;margin-bottom:6px;">MISPLAYS</div>';
        misplays.slice(0,3).forEach(function(m){html+='<div style="color:#ff8888;font-size:0.85rem;">• '+m+'</div>';});
        html+='</div>';
    }
    
    html+='<div style="background:rgba(52,152,219,0.1);border:1px solid rgba(52,152,219,0.3);border-radius:10px;padding:12px;margin-bottom:20px;">'+
        '<div style="color:#3498db;font-weight:900;font-size:0.85rem;margin-bottom:4px;">💡 TIP</div>'+
        '<div style="color:#aaa;font-size:0.9rem;">'+tip+'</div></div>'+
        '<button class="daily-claim-btn" onclick="closeBreakdown()" style="width:100%;">CONTINUE</button>'+
    '</div>';
    
    var ov=document.getElementById('trade-overlay');
    if(!ov){ov=document.createElement('div');ov.id='trade-overlay';ov.className='trade-overlay';document.body.appendChild(ov);}
    ov.innerHTML=html;ov.style.display='flex';ov.onclick=function(){closeBreakdown();};
}
function closeBreakdown(){var ov=document.getElementById('trade-overlay');if(ov)ov.style.display='none';}

