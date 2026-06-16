/* ===== GAME — Arena, Packs, Racks ===== */

/* ── DnD globals ── */
var _dndSrc = 'col';

function initRackDnD(){
    var dc = document.getElementById('deck-rack-content');
    var cc = document.getElementById('col-rack-content');
    var pl = document.getElementById('plank-left');
    var pr = document.getElementById('plank-right');
    if(!dc || !cc) return;

    function bindDrop(el, fn){
        if(el._dndOK) return;
        el._dndOK = true;
        el.addEventListener('dragover', function(e){
            e.preventDefault();
            el.classList.add('rack-drop-hover');
            var hint = el.querySelector('.deck-drop-hint');
            if(hint) hint.style.borderColor = 'rgba(241,196,15,0.9)';
        });
        el.addEventListener('dragleave', function(e){
            if(!el.contains(e.relatedTarget)){
                el.classList.remove('rack-drop-hover');
                var hint = el.querySelector('.deck-drop-hint');
                if(hint) hint.style.borderColor = 'rgba(241,196,15,0.3)';
            }
        });
        el.addEventListener('drop', function(e){
            e.preventDefault();
            el.classList.remove('rack-drop-hover');
            var hint = el.querySelector('.deck-drop-hint');
            if(hint) hint.style.borderColor = 'rgba(241,196,15,0.3)';
            var raw = e.dataTransfer.getData('text/plain');
            var cid = parseInt(raw);
            if(!cid || isNaN(cid)) return;
            fn(cid, _dndSrc);
        });
    }

    bindDrop(dc, function(cid, src){
        if(src === 'col') addToDeckDnD(cid);
        /* dragging within deck = no-op */
    });
    bindDrop(cc, function(cid, src){
        if(src === 'deck') removeFromDeckDnD(cid);
    });
    if(pl) bindDrop(pl, function(cid, src){
        if(src === 'col') addToDeckDnD(cid);
    });
    if(pr) bindDrop(pr, function(cid, src){
        if(src === 'deck') removeFromDeckDnD(cid);
    });
}

function addToDeckDnD(id){
    id = Number(id);
    if(myDeck.length >= 9){ showShopToast('Deck full! Max 9','error'); return; }
    if(myDeck.includes(id)){ showShopToast('Already in deck','error'); return; }
    if(!myInventory.includes(id)){ showShopToast('Card not owned','error'); return; }
    myDeck.push(id);
    updateObjectiveProgress('add_deck', 1);
    if(typeof advanceQuest === 'function') advanceQuest('add_deck');
    renderRacks();
    updateHeroFightBtn();
    saveFullState();
    var c = allCards.find(function(x){ return x.id === id; });
    showShopToast((c ? c.name : 'Card') + ' → Deck ✓', 'success');
}

function removeFromDeckDnD(id){
    id = Number(id);
    myDeck = myDeck.filter(function(x){ return x !== id; });
    renderRacks();
    updateHeroFightBtn();
    saveFullState();
    var c = allCards.find(function(x){ return x.id === id; });
    showShopToast((c ? c.name : 'Card') + ' removed from deck', 'info');
}

function renderRacks(){
    var seen = {};
    myDeck = myDeck.filter(function(id){
        if(!myInventory.includes(id)) return false;
        if(seen[id]) return false;
        seen[id] = true;
        return true;
    });

    var dc = document.getElementById('deck-rack-content');
    var cc = document.getElementById('col-rack-content');
    if(!dc || !cc) return;

    /* Reset DnD flags so listeners rebind after innerHTML clear */
    dc._dndOK = false;
    cc._dndOK = false;
    var pl = document.getElementById('plank-left');
    var pr = document.getElementById('plank-right');
    if(pl) pl._dndOK = false;
    if(pr) pr._dndOK = false;

    dc.innerHTML = '';
    cc.innerHTML = '';
    var counter = document.getElementById('deck-counter');
    if(counter) counter.innerText = myDeck.length + ' / 9';

    /* Drop hint */
    if(myDeck.length < 9){
        var hint = document.createElement('div');
        hint.className = 'deck-drop-hint';
        hint.innerText = '↓ DROP HERE';
        dc.appendChild(hint);
    }

    myDeck.forEach(function(id, i){
        var c = allCards.find(function(x){ return x.id === id; });
        if(!c) return;
        var el = createCardHTML(c, true, false);
        el.id = 'deck-card-' + i;
        el.draggable = true;
        el.title = 'Drag right to remove';
        el.onclick = function(e){ e.stopPropagation(); inspectCard(c, 'deck-card-' + i, e); };
        el.addEventListener('dragstart', function(e){
            _dndSrc = 'deck';
            e.dataTransfer.setData('text/plain', String(c.id));
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(function(){ el.style.opacity = '0.35'; }, 0);
        });
        el.addEventListener('dragend', function(){ el.style.opacity = '1'; });
        dc.appendChild(el);
    });

    var inventoryUnique = [...new Set(myInventory)];
    inventoryUnique.forEach(function(id){
        if(myDeck.includes(Number(id))) return;
        var tc = myInventory.filter(function(x){ return x === id; }).length;
        var hc = packBuffer.filter(function(x){ return x === id; }).length;
        if(tc <= hc) return;
        var c = allCards.find(function(x){ return x.id === id; });
        if(!c) return;
        var el = createCardHTML(c, true, false);
        el.id = 'col-card-' + id;
        el.draggable = true;
        el.title = 'Drag left to add to deck';
        el.onclick = function(e){ e.stopPropagation(); inspectCard(c, 'col-card-' + id, e); };
        el.addEventListener('dragstart', function(e){
            _dndSrc = 'col';
            e.dataTransfer.setData('text/plain', String(c.id));
            e.dataTransfer.effectAllowed = 'copy';
            setTimeout(function(){ el.style.opacity = '0.35'; }, 0);
        });
        el.addEventListener('dragend', function(){ el.style.opacity = '1'; });
        cc.appendChild(el);
    });

    dc.innerHTML += '<div style="height:100px;"></div>';
    cc.innerHTML += '<div style="height:100px;"></div>';

    initRackDnD();
    setTimeout(initHoloFoil, 50);
    updateSellExtrasVisibility();
}

/* ── Pack ── */
var tearMoveHandler=null,tearUpHandler=null,tearTouchMoveHandler=null,tearTouchEndHandler=null;

function buyPack(type){
    if(packBuffer.length>0){alert('Flip your current cards first!');return;}
    var cost=type==='legendary'?500:100;
    if(coins<cost){alert('Not enough Gold!');return;}

    spendCoins(cost);
    closeInspection();

    if(tearMoveHandler){document.removeEventListener('mousemove',tearMoveHandler);tearMoveHandler=null;}
    if(tearUpHandler){document.removeEventListener('mouseup',tearUpHandler);tearUpHandler=null;}
    if(tearTouchMoveHandler){document.removeEventListener('touchmove',tearTouchMoveHandler);tearTouchMoveHandler=null;}
    if(tearTouchEndHandler){document.removeEventListener('touchend',tearTouchEndHandler);tearTouchEndHandler=null;document.removeEventListener('touchcancel',tearTouchEndHandler);}

    var pa=document.getElementById('pack-area');
    pa.innerHTML='';
    document.getElementById('instruction').innerText='';

    var ptc=type==='legendary'?'epic-type':'normal-type',
        ptl=type==='legendary'?'EPIC PACK':'STANDARD PACK';
    var packStyleClass=shopState.equippedPackStyle!=='classic'?(' pack-style-'+shopState.equippedPackStyle):'';

    pa.innerHTML=
        '<div class="pack-3d-scene">'+
            '<div class="pack-3d" id="pack-3d">'+
                '<div class="pack-face-front '+ptc+packStyleClass+'">'+
                    '<div class="pack-foil-lines"></div>'+
                    '<div class="pack-logo-area"><div class="pack-logo-text">CARDs</div><div class="pack-type-text">'+ptl+'</div></div>'+
                '</div>'+
                '<div class="pack-tear-zone" id="pack-tear-zone">'+
                    '<div class="pack-tear-progress" id="pack-tear-progress"></div>'+
                    '<div class="pack-tear-text">DRAG / SWIPE TO OPEN</div>'+
                '</div>'+
                '<div class="pack-glow-ring"></div>'+
                '<div class="pack-bottom-glow"></div>'+
            '</div>'+
        '</div>';

    var isTearing=false,tearStartX=0,tearProgress=0,tz=document.getElementById('pack-tear-zone');

    function updateTear(clientX){
        if(!isTearing)return;
        tearProgress=Math.min(Math.max((clientX-tearStartX)/180,0),1);
        var b=document.getElementById('pack-tear-progress');
        if(b)b.style.width=(tearProgress*100)+'%';
        if(tearProgress>0.05&&Math.random()<0.15){
            var r=tz.getBoundingClientRect();
            createSpark(r.left+r.width*tearProgress,r.top+r.height/2);
        }
    }
    function endTear(){
        if(!isTearing)return;
        isTearing=false;
        if(tearProgress>=0.75)executePackOpen(type);
        else{
            tearProgress=0;
            var b=document.getElementById('pack-tear-progress');
            if(b)b.style.width='0%';
        }
    }

    tz.addEventListener('mousedown',function(e){isTearing=true;tearStartX=e.clientX;tearProgress=0;});
    tz.addEventListener('touchstart',function(e){
        if(!e.touches||!e.touches.length)return;
        isTearing=true;tearStartX=e.touches[0].clientX;tearProgress=0;
        e.preventDefault();
    },{passive:false});

    tearMoveHandler=function(e){updateTear(e.clientX);};
    tearUpHandler=function(){endTear();};
    tearTouchMoveHandler=function(e){
        if(!e.touches||!e.touches.length)return;
        updateTear(e.touches[0].clientX);
        e.preventDefault();
    };
    tearTouchEndHandler=function(){endTear();};

    document.addEventListener('mousemove',tearMoveHandler);
    document.addEventListener('mouseup',tearUpHandler);
    document.addEventListener('touchmove',tearTouchMoveHandler,{passive:false});
    document.addEventListener('touchend',tearTouchEndHandler);
    document.addEventListener('touchcancel',tearTouchEndHandler);
}

function executePackOpen(type){
    if(tearMoveHandler){document.removeEventListener('mousemove',tearMoveHandler);tearMoveHandler=null;}
    if(tearUpHandler){document.removeEventListener('mouseup',tearUpHandler);tearUpHandler=null;}
    if(tearTouchMoveHandler){document.removeEventListener('touchmove',tearTouchMoveHandler);tearTouchMoveHandler=null;}
    if(tearTouchEndHandler){document.removeEventListener('touchend',tearTouchEndHandler);document.removeEventListener('touchcancel',tearTouchEndHandler);tearTouchEndHandler=null;}

    updateObjectiveProgress('open_pack',1);
    if(typeof advanceQuest==='function') advanceQuest('open_pack');
    document.getElementById('pack-flash').classList.add('active');
    setTimeout(function(){document.getElementById('pack-flash').classList.remove('active');},500);

    var pe=document.getElementById('pack-3d');
    if(pe&&type==='legendary')pe.classList.add('pack-legendary-glow');
    if(pe){
        var pr=pe.getBoundingClientRect();
        createExplosion(pr.left+pr.width/2,pr.top+pr.height/2,type==='legendary'?'gold':'accent');
    }

    var pulledLeg=false;packPendingCards=[];
    if(!shopState.commonPity)shopState.commonPity=0;
    if(!shopState.epicPity)shopState.epicPity=0;

    for(var i=0;i<3;i++){
        var rCard;
        if(type==='legendary'){
            if(i===0){
                var p1=allCards.filter(function(c){return c.rarity==='common';});
                rCard=p1[Math.floor(Math.random()*p1.length)];
            }else{
                var isL=i===2&&Math.random()<0.2;
                var p2=allCards.filter(function(c){return c.rarity===(isL?'legendary':'epic');});
                rCard=p2[Math.floor(Math.random()*p2.length)];
            }
        }else{
            if(i<2){
                var p3=allCards.filter(function(c){return c.rarity==='common';});
                rCard=p3[Math.floor(Math.random()*p3.length)];
            }else{
                var rn=Math.random(),rar=rn<0.04?'legendary':rn<0.18?'epic':'common';
                shopState.commonPity++;
                if(shopState.commonPity>=10){rar='epic';shopState.commonPity=0;shopState.epicPity++;}
                if(shopState.epicPity>=5){rar='legendary';shopState.epicPity=0;}
                var p4=allCards.filter(function(c){return c.rarity===rar;});
                rCard=p4[Math.floor(Math.random()*p4.length)];
            }
        }
        if(rCard.rarity==='legendary'){
            pulledLeg=true;
            if(!playerProfile.firstLegendaryDate)playerProfile.firstLegendaryDate=getTodayStr();
        }
        myInventory.push(rCard.id);packBuffer.push(rCard.id);packPendingCards.push(rCard);
        newCardIds[rCard.id]=true;cardAcquiredTime[rCard.id]=cardAcquiredTime[rCard.id]||Date.now();setLastOpened(rCard.id);
        if(myInventory.filter(function(id){return id===rCard.id;}).length===1)updateObjectiveProgress('collect_new',1);
    }

    if(pulledLeg){
        setTimeout(function(){
            for(var k=0;k<5;k++){
                setTimeout(function(){
                    createExplosion(window.innerWidth/2+(Math.random()*200-100),window.innerHeight/2+(Math.random()*200-100),'gold');
                },k*300);
            }
        },1500);
    }
    saveFullState();
    if(pulledLeg)unlockAchievement('first_legendary');

    setTimeout(function(){
        var pa=document.getElementById('pack-area');pa.innerHTML='';document.getElementById('instruction').innerText='CLICK CARDS TO REVEAL';
        packPendingCards.forEach(function(card,idx){
            var w=document.createElement('div');w.className='spawn-wrapper';
            var el=createCardHTML(card,false,true);el.id='pack-card-'+idx;
            (function(c,e){e.onclick=function(ev){ev.stopPropagation();handlePackFlip(c,e,ev);};})(card,el);
            w.appendChild(el);pa.appendChild(w);
            setTimeout(function(){w.classList.add('fly-out');},80+idx*120);
        });
        checkAchievements();setTimeout(initHoloFoil,300);renderRacks();renderGallery();updateHeroFightBtn();
    },type==='legendary'?700:450);
}

function handlePackFlip(card,el,ev){
    if(el.classList.contains('flipped')){
        updateObjectiveProgress('flip_card',1);
        var w=document.createElement('div');w.className='flip-woosh active';el.parentElement.appendChild(w);
        setTimeout(function(){if(w.parentNode)w.remove();},600);
        el.classList.remove('flipped');
        if(card.rarity==='legendary'||card.rarity==='epic'){
            var r=el.getBoundingClientRect();
            createExplosion(r.left+r.width/2,r.top+r.height/2,'accent');
        }
        var bi=packBuffer.indexOf(card.id);if(bi>-1)packBuffer.splice(bi,1);
        renderRacks();renderGallery();checkAchievements();setTimeout(initHoloFoil,100);
        el.onclick=function(evv){evv.stopPropagation();inspectCard(card,el.id,evv);};
    }else inspectCard(card,el.id,ev);
}

function initExtendedKeyboard(){
    document.addEventListener('keydown',function(e){
        if(!document.getElementById('battle-arena')||document.getElementById('battle-arena').style.display==='none')return;
        var hand=document.querySelectorAll('#player-hand .battle-card-mini');
        if(!hand.length)return;
        var keyMap={'1':0,'2':1,'3':2,'4':3,'5':4,'6':5,'7':6,'8':7,'9':8,'0':9};
        var topRowMap={'q':10,'w':11,'e':12,'r':13,'t':14,'y':15};
        var idx=keyMap[e.key];
        if(idx===undefined)idx=topRowMap[e.key.toLowerCase()];
        if(idx!==undefined&&idx<hand.length)hand[idx].click();
    });
}