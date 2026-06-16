/* ===== UI.JS ===== */
function setTheme(m){
    document.body.classList.add('theme-transition');
    
    if(m==='light'){
        document.body.classList.add('light-mode');
        document.getElementById('theme-light').classList.add('active');
        document.getElementById('theme-dark').classList.remove('active');
    }else{
        document.body.classList.remove('light-mode');
        document.getElementById('theme-dark').classList.add('active');
        document.getElementById('theme-light').classList.remove('active');
        m='dark';
    }
    
    setTimeout(function(){
        document.body.classList.remove('theme-transition');
    }, 400);

    try{localStorage.setItem('cards_theme',m);}catch(e){}
}
function setSound(on){
    soundEnabled=on;
    document.getElementById('sound-on').classList.toggle('active',on);
    document.getElementById('sound-off').classList.toggle('active',!on);
    try{localStorage.setItem('cards_sound',String(on));}catch(e){}
}
function setHeaderFrost(on){
    var h=document.querySelector('header');
    if(on){h.classList.remove('no-frost');}else{h.classList.add('no-frost');}
    document.getElementById('frost-on').classList.toggle('active',on);
    document.getElementById('frost-off').classList.toggle('active',!on);
    try{localStorage.setItem('cards_header_frost',String(on));}catch(e){}
}
function loadHeaderFrost(){
    var v=localStorage.getItem('cards_header_frost');
    /* default = frosted */
    if(v==='false')setHeaderFrost(false);
}

function openSettings(){document.getElementById('settings-overlay').style.display='flex';}
function closeSettings(){document.getElementById('settings-overlay').style.display='none';}

/* ===== HIW (FULLSCREEN CONNECTED MODAL) ===== */
function toggleHIWPanel(id){
    openHIWOverlay(id||'overview');
}
function openHIWOverlay(tab){
    var ov=document.getElementById('hiw-overlay');
    if(!ov)return;
    ov.style.display='flex';

    setTimeout(function(){
        if(typeof initHIWSlider==='function')initHIWSlider();
        if(typeof hiwScrollTo==='function')hiwScrollTo(tab||'overview');
    },60);
}
function closeHIWOverlay(){
    var ov=document.getElementById('hiw-overlay');
    if(ov)ov.style.display='none';
}
function switchHIWTab(tab,btn){
    if(typeof hiwScrollTo==='function')hiwScrollTo(tab||'overview');
}
function scrollToHIW(){
    var section=document.getElementById('home');
    var target=document.getElementById('hiw-section');
    if(section&&target)section.scrollTo({top:target.offsetTop-20,behavior:'smooth'});
}

/* ===== REVIEWS PAGINATION + FADE/SLIDE ===== */
var reviewsShuffled=[];
var reviewsShown=0;

function parseStarsToValue(stars){
    if(!stars)return 0;
    var full=(stars.match(/★/g)||[]).length;
    var half=stars.indexOf('½')>-1?0.5:0;
    return full+half;
}
function updateRatingBadge(count){
    var badge=document.getElementById('rating-badge');
    if(!badge)return;
    var approved=[];
    try{approved=JSON.parse(localStorage.getItem('cards_approved_reviews')||'[]');}catch(e){}
    var total=(count!==undefined?count:(realReviews.length+approved.length));
    badge.innerText='AVG Stars 4.9 ('+total+' reviews)';
}

function createReviewCardEl(r){
    var isLong=r.text.length>120;
    var el=document.createElement('div');
    el.className='review-card-item glass-panel review-enter';
    el.innerHTML=
        '<div class="review-header">'+
            '<div class="review-avatar">'+r.user.charAt(0).toUpperCase()+'</div>'+
            '<div><div class="review-name">'+r.user+'</div><div class="stars">'+r.stars+'</div></div>'+
        '</div>'+
        '<div class="review-text'+(isLong?' review-long':'')+'">"'+r.text+'"</div>';
    return el;
}

function renderReviews(){
    /* Merge hardcoded + approved from localStorage */
    var approved=[];
    try{approved=JSON.parse(localStorage.getItem('cards_approved_reviews')||'[]');}catch(e){}
    var allReviews=realReviews.concat(approved);

    reviewsShuffled=allReviews.slice();
    for(var i=reviewsShuffled.length-1;i>0;i--){
        var j=Math.floor(Math.random()*(i+1));
        var t=reviewsShuffled[i];reviewsShuffled[i]=reviewsShuffled[j];reviewsShuffled[j]=t;
    }
    reviewsShown=0;
    document.getElementById('reviews-container').innerHTML='';
    updateRatingBadge(allReviews.length);
    showMoreReviews();
}

function showMoreReviews(){
    var c=document.getElementById('reviews-container');
    var batch=reviewsShuffled.slice(reviewsShown,reviewsShown+6);

    batch.forEach(function(r,idx){
        var el=createReviewCardEl(r);
        c.appendChild(el);
        setTimeout(function(){el.classList.add('review-show');},40+idx*60);
    });

    reviewsShown+=batch.length;
    var btn=document.getElementById('see-more-reviews-btn');
    if(reviewsShown>=reviewsShuffled.length) btn.style.display='none';
    else btn.style.display='inline-flex';
}

/* ===== NEWS ===== */
function openNews(id){
    var d=newsDB[id];
    if(!d)return;

    var paras=(d.body||[d.text||'']).map(function(p){
        return '<p style="font-size:1rem;line-height:1.85;color:var(--text-secondary);margin:0 0 18px;">'+p+'</p>';
    }).join('');

    document.getElementById('news-content-box').innerHTML=
        '<div style="position:relative;width:100%;height:280px;border-radius:14px;overflow:hidden;margin-bottom:28px;">'+
            '<div style="position:absolute;inset:0;background:url(\''+d.img+'\') center/cover no-repeat;filter:blur(0px);transform:scale(1.03);"></div>'+
            '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.7) 100%);"></div>'+
            '<div style="position:absolute;bottom:22px;left:24px;right:24px;">'+
                '<div style="display:inline-block;background:var(--brand-main-gradient);color:#111;padding:4px 12px;border-radius:4px;font-size:0.68rem;font-weight:900;letter-spacing:2px;margin-bottom:8px;">'+(d.badge||'NEWS')+'</div>'+
                '<h1 style="margin:0 0 6px;font-family:Cinzel,serif;font-size:clamp(1.4rem,3vw,2rem);color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.6);">'+d.title+'</h1>'+
                '<span style="color:rgba(255,255,255,0.55);font-size:0.82rem;">'+d.date+'</span>'+
            '</div>'+
        '</div>'+
        '<div style="padding:0 4px;">'+paras+'</div>';

    document.getElementById('news-overlay').style.display='flex';
}
function closeNews(){document.getElementById('news-overlay').style.display='none';}

function renderNewsHub(){
    var grid=document.getElementById('news-hub-grid');
    var article=document.getElementById('news-hub-article');
    if(!grid||!article||!newsDB)return;

    var list=Object.keys(newsDB).map(function(k){
        var n=newsDB[k];
        return {id:k,title:n.title,date:n.date,img:n.img,text:n.text};
    });

    list.sort(function(a,b){
        return new Date(b.date).getTime()-new Date(a.date).getTime();
    });

    grid.innerHTML='';
    list.forEach(function(n,idx){
        var card=document.createElement('button');
        card.className='news-hub-card glass-panel'+(idx===0?' active':'');
       card.innerHTML=
    '<div class="nhc-thumb" style="background-image:url(\''+n.img+'\')"></div>'+
    '<div class="nhc-body">'+
        '<div class="nhc-date">LATEST REPORT • '+n.date+'</div>'+
        '<h3>'+n.title+'</h3>'+
        '<p>'+(n.text||'').slice(0,95)+'...</p>'+
    '</div>';
        card.onclick=function(){
            grid.querySelectorAll('.news-hub-card').forEach(function(x){x.classList.remove('active');});
            card.classList.add('active');
            article.innerHTML=
'<div class="news-hub-article-head">'+
    '<div class="news-hub-article-date">LATEST REPORT • '+n.date+'</div>'+
    '<h2>'+n.title+'</h2>'+
    '<div class="news-hub-featured">FEATURED STORY</div>'+
'</div>'+
                '<div class="news-hub-hero" style="background-image:url(\''+n.img+'\')"></div>'+
                '<div class="news-hub-copy">'+String(n.text||'').split('\n\n').map(function(p){return '<p>'+p+'</p>';}).join('')+'</div>';
        };
        grid.appendChild(card);
    });

    var first=grid.querySelector('.news-hub-card');
    if(first)first.click();
}

function checkWhatsNew(){
    var ov=document.getElementById('whatsnew-overlay');
    if(!ov)return;
    try{
        var key='cards_whatsnew_seen_v3';
        if(localStorage.getItem(key)==='1')return;
        ov.style.display='flex';
    }catch(e){
        ov.style.display='flex';
    }
}
function closeWhatsNew(){
    var ov=document.getElementById('whatsnew-overlay');
    if(ov)ov.style.display='none';
    try{localStorage.setItem('cards_whatsnew_seen_v3','1');}catch(e){}
}

/* ===== FEEDBACK / MAILTO ===== */
function rateHalf(event, starNum) {
    var rect = event.target.getBoundingClientRect();
    var clickX = event.clientX - rect.left;
    var isHalf = clickX < rect.width / 2;
    currentRating = isHalf ? (starNum - 0.5) : starNum;
    
    document.querySelectorAll('.star-btn').forEach(function(s,i){
        var sn = parseInt(s.getAttribute('data-star'));
        if(sn <= Math.floor(currentRating)) { s.classList.add('selected'); s.classList.remove('half-selected'); }
        else if(sn === Math.ceil(currentRating) && currentRating % 1 !== 0) { s.classList.add('half-selected'); s.classList.remove('selected'); }
        else { s.classList.remove('selected'); s.classList.remove('half-selected'); }
    });

    var ta=document.getElementById('suggestion-text')||document.querySelector('.suggestion-input');
    var un=document.getElementById('suggestion-username');
    var hint=document.getElementById('review-hint');
    if(un) un.disabled=false;
    if(ta){
        ta.disabled=false;
        if(!ta.value||ta.placeholder.indexOf('Select a star')>-1){
            ta.placeholder='Type your feedback here...';
        }
    }
    if(hint)hint.innerText=currentRating + '/5 — now type your feedback and send it by mail.';
}
/* backward compat */
function rate(n){ currentRating=n; }
function sendSuggestionEmail(){
    var ta=document.getElementById('suggestion-text');
    var un=document.getElementById('suggestion-username');
    var hint=document.getElementById('review-hint');

    if(!currentRating||currentRating<1){
        if(hint)hint.innerText='Pick a star rating first.';
        return false;
    }
    var msg=(ta&&ta.value?ta.value.trim():'');
    if(!msg.length){
        if(hint)hint.innerText='Write something first.';
        if(ta)ta.focus();
        return false;
    }
    var name=(un&&un.value.trim())?un.value.trim():(playerProfile&&playerProfile.name?playerProfile.name:'Anonymous');

    /* Build star string */
    var full=Math.floor(currentRating);
    var half=currentRating%1!==0;
    var starStr='';
    for(var i=0;i<full;i++)starStr+='★';
    if(half)starStr+='½';

    var review={user:name,stars:starStr,text:msg,ts:Date.now()};

    try{
        var pending=JSON.parse(localStorage.getItem('cards_pending_reviews')||'[]');
        pending.push(review);
        localStorage.setItem('cards_pending_reviews',JSON.stringify(pending));
    }catch(e){}

    if(hint)hint.innerText='✓ Review submitted! Thank you — it will appear after approval.';
    if(ta){ta.value='';ta.disabled=true;}
    if(un){un.value='';un.disabled=true;}
    document.querySelectorAll('.star-btn').forEach(function(s){
        s.classList.remove('selected','half-selected');
    });
    currentRating=0;
    return false;
}
/* compatibility */
function sendSuggestion(){ return sendSuggestionEmail(); }

/* ===== HOME PROGRESS ===== */
function getCloseNudge(){
    var u=[...new Set(myInventory)].length;
    if(playerProfile.winStreak===2)return'1 more win — On Fire streak!';
    if(u>=8&&u<TOTAL_CARDS)return(TOTAL_CARDS-u)+' cards left for full collection';
    var d=getCompletedDailyCount();
    if(d<3)return(3-d)+' daily objectives remaining';
    return'Good momentum — keep going!';
}
function renderHomeProgress(){
var owned=[...new Set(myInventory)].length;
    var pct=TOTAL_CARDS>0?Math.round((owned/TOTAL_CARDS)*100):0;
    var pwBig=document.getElementById('pw-cards-big');
    var pwSub=document.getElementById('pw-cards-sub');
    var pwFill=document.getElementById('pw-cards-fill');
    var pwLvl=document.getElementById('pw-level');
    var pwXp=document.getElementById('pw-xp-text');
    if(pwBig)pwBig.innerText=owned;
    if(pwSub)pwSub.innerText='of '+TOTAL_CARDS+' total ('+pct+'%)';
    if(pwFill)pwFill.style.width=pct+'%';
    if(pwLvl)pwLvl.innerText='LVL '+playerProfile.level;
    if(pwXp)pwXp.innerText=playerProfile.xp+' / '+xpForLevel(playerProfile.level)+' XP';
    var nudgeMsg = owned+'/'+TOTAL_CARDS+' Cards · '+pct+'% Complete';
if(pct>=100){
    var today=getTodayStr();
    var firstFull=localStorage.getItem('cards_first_full_date');
    if(!firstFull){
        localStorage.setItem('cards_first_full_date',today);
        firstFull=today;
    }
    var daysSince=Math.floor((new Date()-new Date(firstFull))/(1000*60*60*24));
    if(daysSince===0) nudgeMsg='🎉 You completed the collection today! Legendary.';
    else if(daysSince===1) nudgeMsg='✨ 100% complete. You are the collector.';
    else nudgeMsg='👑 Full collection holder · '+daysSince+' days strong';
}
document.getElementById('progress-nudge-pill').innerText=nudgeMsg;

    var dw=document.getElementById('pw-daily-lines');dw.innerHTML='';
    objectiveSystem.dailyList.forEach(function(o,i){
        var cl=objectiveSystem.claimedDaily.includes(i);
        var ln=document.createElement('div');ln.className='pw-objective-line';
        ln.innerHTML=
            '<div style="display:flex;align-items:center;gap:8px;min-width:0;">'+
                '<span class="pw-objective-dot" style="background:'+(cl?'#27ae60':o.completed?'#f1c40f':'#666')+'"></span>'+
                '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+o.label+'</span>'+
            '</div>'+
            '<button '+((!o.completed||cl)?'disabled':'')+' onclick="claimDailyObjective('+i+')" style="border:none;border-radius:999px;padding:5px 10px;font-size:0.68rem;font-weight:900;cursor:'+((!o.completed||cl)?'not-allowed':'pointer')+';background:'+(cl?'#555':o.completed?'var(--brand-main-gradient)':'#2c2c36')+';color:'+(cl?'#999':'#fff')+';">'+(cl?'DONE':o.completed?'CLAIM':(o.progress||0)+'/'+o.target)+'</button>';
        dw.appendChild(ln);
    });

    var weeklyText=document.getElementById('pw-weekly-text');
    if(weeklyText){
        if(objectiveSystem.weekly){
            var w=objectiveSystem.weekly;
            var isDone=!!objectiveSystem.claimedWeekly;
            var canClaim=w.completed&&!isDone;
            var rewardGold=w.reward&&w.reward.gold?w.reward.gold:0;
            var rewardXP=w.reward&&w.reward.xp?w.reward.xp:0;
            weeklyText.innerHTML=
                '<span>'+w.label+' ('+(w.progress||0)+'/'+w.target+')</span> '+
                '<span style="color:var(--brand-gold);font-weight:900;">• '+rewardGold+'g / '+rewardXP+'xp</span> '+
                (canClaim?'<button class="daily-claim-btn weekly-inline-claim" onclick="claimWeeklyObjective()">CLAIM</button>':
                isDone?'<span style="margin-left:8px;color:#6dd46d;font-weight:900;">CLAIMED</span>':'');
        }else{
            weeklyText.innerText='None';
        }
    }

    var low=document.getElementById('pw-last-opened-wrap');
    if(lastOpenedCardId){
        var lc=allCards.find(function(c){return c.id===lastOpenedCardId;});
        if(lc)low.innerHTML='<div style="font-size:0.7rem;color:var(--brand-gold);font-weight:900;letter-spacing:1px;">LAST OPENED</div><div class="pw-last-card"><div class="pw-last-thumb" style="background-image:url(\''+lc.img+'\')"></div><div><div style="font-weight:900;">'+lc.name+'</div><div class="pw-small" style="margin-top:3px;">'+lc.type+' • '+lc.rarity.toUpperCase()+'</div></div></div>';
        else low.innerHTML='<div class="pw-empty">No card yet.</div>';
    }

    var fav=document.getElementById('pw-favorite-wrap');
    if(playerProfile.favoriteCardId){
        var fc=allCards.find(function(c){return c.id===playerProfile.favoriteCardId;});
        if(fc)fav.innerHTML='<div style="font-size:0.7rem;color:var(--brand-gold);font-weight:900;letter-spacing:1px;">FAVORITE</div><div class="pw-fav-mini"><div class="pw-last-thumb" style="background-image:url(\''+fc.img+'\')"></div><div style="font-weight:900;">'+fc.name+'</div></div>';
        else fav.innerHTML='<div class="pw-empty">No favorite.</div>';
    } else fav.innerHTML='<div class="pw-empty">No favorite.</div>';

    saveFullState();
    updateWeeklyRewardBtn();
}

function updateWeeklyRewardBtn(){
    var btn=document.getElementById('weekly-float-btn');
    if(!btn)return;
    ensureObjectiveReset();
    var w=objectiveSystem.weekly;
    btn.classList.toggle('has-reward',!!(w&&w.completed&&!objectiveSystem.claimedWeekly));
}

function openWeeklyReward(){
    ensureObjectiveReset();
    var ov=document.getElementById('weekly-reward-overlay');
    var body=document.getElementById('weekly-reward-body');
    var claim=document.getElementById('weekly-claim-btn');
    if(!ov||!body||!claim)return;

    var w=objectiveSystem.weekly;
    if(!w){
        body.innerHTML='<p style="color:#9ea5bb;">No weekly mission available.</p>';
        claim.style.display='none';
        ov.style.display='flex';
        return;
    }

    var rewardGold=w.reward&&w.reward.gold?w.reward.gold:0;
    var rewardXP=w.reward&&w.reward.xp?w.reward.xp:0;
    body.innerHTML=
        '<div class="weekly-mission-title">'+w.label+'</div>'+
        '<div class="weekly-mission-progress">'+(w.progress||0)+' / '+w.target+'</div>'+
        '<div class="weekly-mission-reward">Reward: <strong>'+rewardGold+'g</strong> • <strong>'+rewardXP+'xp</strong></div>';

    if(objectiveSystem.claimedWeekly){
        claim.style.display='inline-flex';
        claim.classList.add('already-claimed');
        claim.innerText='CLAIMED';
        claim.disabled=true;
        claim.onclick=null;
    }else if(w.completed){
        claim.style.display='inline-flex';
        claim.classList.remove('already-claimed');
        claim.innerText='CLAIM WEEKLY REWARD';
        claim.disabled=false;
        claim.onclick=function(){
            claimWeeklyObjective();
            openWeeklyReward();
        };
    }else{
        claim.style.display='inline-flex';
        claim.classList.add('already-claimed');
        claim.innerText='NOT READY';
        claim.disabled=true;
        claim.onclick=null;
    }

    ov.style.display='flex';
}

function closeWeeklyReward(){
    var ov=document.getElementById('weekly-reward-overlay');
    if(ov)ov.style.display='none';
}

/* ===== FILTERS ===== */
function openFilterOverlay(){document.getElementById('filter-overlay').style.display='flex';buildFilterOverlayPills();}
function closeFilterOverlay(){document.getElementById('filter-overlay').style.display='none';}
function buildFilterOverlayPills(){
    var types=['Grass','Fire','Water','Air','Phantom','Magic','Plasma'];
    var rars=['common','epic','legendary'];
    var sorts=[{v:'default',l:'DEFAULT'},{v:'alpha',l:'A-Z'},{v:'attack',l:'ATTACK'},{v:'hp',l:'HP'},{v:'rarityAsc',l:'RARITY ↑'},{v:'rarityDesc',l:'RARITY ↓'}];

    /* TYPES — multiselect */
    var te=document.getElementById('fo-types');
    te.innerHTML='<div class="fo-clear-btn" onclick="filterState.types=[];buildFilterOverlayPills();">CLEAR</div>';
    types.forEach(function(val){
        var p=document.createElement('div');
        var active=filterState.types.indexOf(val)>-1;
        p.className='fo-pill'+(active?' active':'');
        p.innerText=val.toUpperCase();
        p.onclick=function(){
            var idx=filterState.types.indexOf(val);
            if(idx>-1)filterState.types.splice(idx,1);
            else filterState.types.push(val);
            buildFilterOverlayPills();
        };
        te.appendChild(p);
    });

    /* RARITY — multiselect */
    var re=document.getElementById('fo-rarity');
    re.innerHTML='<div class="fo-clear-btn" onclick="filterState.rarities=[];buildFilterOverlayPills();">CLEAR</div>';
    rars.forEach(function(val){
        var p=document.createElement('div');
        var active=filterState.rarities.indexOf(val)>-1;
        p.className='fo-pill'+(active?' active':'');
        p.innerText=val.toUpperCase();
        p.onclick=function(){
            var idx=filterState.rarities.indexOf(val);
            if(idx>-1)filterState.rarities.splice(idx,1);
            else filterState.rarities.push(val);
            buildFilterOverlayPills();
        };
        re.appendChild(p);
    });

    /* SORT — single select */
    var se=document.getElementById('fo-sort');
    se.innerHTML='';
    sorts.forEach(function(item){
        var p=document.createElement('div');
        p.className='fo-pill'+(filterState.sort===item.v?' active':'');
        p.innerText=item.l;
        p.onclick=function(){filterState.sort=item.v;buildFilterOverlayPills();};
        se.appendChild(p);
    });
}
function applyFilters(){closeFilterOverlay();renderGallery();}
function setOwnedFilter(m,el){
    galleryOwnedFilter=m;
    document.querySelectorAll('.filter-pill-group .filter-pill').forEach(function(x){x.classList.remove('active');});
    el.classList.add('active');
    renderGallery();
}

/* ===== GALLERY ===== */
function renderGallery(){
    var c=document.getElementById('gallery-grid-container');c.innerHTML='';
    updateSellExtrasVisibility();
    if(museumActive)return;

    var sv=(document.getElementById('gallery-search')?document.getElementById('gallery-search').value:'').toLowerCase().trim();
    var uo=[...new Set(myInventory)].length;

    document.getElementById('gp-owned').innerText=uo;
    document.getElementById('gp-total').innerText=TOTAL_CARDS;
    document.getElementById('gp-bar-fill').style.width=Math.round(uo/TOTAL_CARDS*100)+'%';

    var mh=document.getElementById('museum-hint');
    if(mh)mh.style.display=uo>0?'block':'none';

    var list=allCards.slice();
    if(sv)list=list.filter(function(x){return x.name.toLowerCase().includes(sv)||x.type.toLowerCase().includes(sv)||x.rarity.includes(sv);});
    if(galleryOwnedFilter==='owned')list=list.filter(function(x){return myInventory.includes(x.id);});
    if(galleryOwnedFilter==='unowned')list=list.filter(function(x){return !myInventory.includes(x.id);});
    if(filterState.types&&filterState.types.length>0){
        list=list.filter(function(x){return filterState.types.indexOf(x.type)>-1;});
    }
    if(filterState.rarities&&filterState.rarities.length>0){
        list=list.filter(function(x){return filterState.rarities.indexOf(x.rarity)>-1;});
    }

    if(filterState.sort==='alpha')list.sort(function(a,b){return a.name.localeCompare(b.name);});
    else if(filterState.sort==='attack')list.sort(function(a,b){return b.dmg-a.dmg;});
    else if(filterState.sort==='hp')list.sort(function(a,b){return b.hp-a.hp;});
    else if(filterState.sort==='rarityAsc')list.sort(function(a,b){return rarityValue(a.rarity)-rarityValue(b.rarity);});
    else if(filterState.sort==='rarityDesc')list.sort(function(a,b){return rarityValue(b.rarity)-rarityValue(a.rarity);});

    if(!list.length){c.innerHTML='<div class="gallery-no-results">No cards found</div>';return;}

    list.forEach(function(card){
        var cnt=myInventory.filter(function(id){return id===card.id;}).length,owned=cnt>0;
        var item=document.createElement('div');
        item.draggable = true;
item.dataset.cardId = card.id;

item.addEventListener('dragstart', function(e){
    e.dataTransfer.setData('text/plain', String(card.id));
    item.addEventListener('dragend', function () {
    item.classList.remove('dragging');
});
});
        item.className='gallery-item '+(owned?'unlocked':'locked');
        var bg=owned?"url('"+card.img+"')":"url('assets/card_back.png')";
        var rb='';
        if(owned&&card.rarity==='legendary')rb='border-color:#ffd700;box-shadow:0 0 15px #ffd700;';
        else if(owned&&card.rarity==='epic')rb='border-color:#b338ff;box-shadow:0 0 10px #b338ff;';
        var cntB=owned&&cnt>1?'<div class="card-count-badge">x'+cnt+'</div>':'';
        var ownB=owned?'<div class="owned-badge">OWNED</div>':'';

        item.innerHTML=
            '<div style="position:relative;width:100%;">'+
                '<div class="gallery-card-inner" id="gi-'+card.id+'" style="width:100%;aspect-ratio:160/240;background-image:'+bg+';border-radius:12px;border:2px solid #333;box-shadow:0 5px 15px rgba(0,0,0,0.5);position:relative;overflow:hidden;'+rb+'">'+cntB+'</div>'+
                ownB+
            '</div>'+
            '<div class="gallery-name">'+(owned?card.name:'???')+'</div>';

        if(owned){
            item.addEventListener('mousemove',function(e){
                var inner=item.querySelector('.gallery-card-inner');
                if(!inner)return;
                var r=inner.getBoundingClientRect();
                var px=(e.clientX-r.left)/r.width;
                var py=(e.clientY-r.top)/r.height;
                var rx=(0.5-py)*18;
                var ry=(px-0.5)*18;
                inner.style.transform='perspective(800px) rotateX('+rx+'deg) rotateY('+ry+'deg) scale(1.06)';
            });
            item.addEventListener('mouseleave',function(){
                var inner=item.querySelector('.gallery-card-inner');
                if(inner)inner.style.transform='';
            });
            item.addEventListener('click',function(e){inspectCard(card,'gi-'+card.id,e);});
        }
        c.appendChild(item);
    });

    initHoloFoil();
}

/* ===== MUSEUM CAROUSEL ===== */
var museumIndex=0;
var museumCards=[];
function renderMuseum(){
    museumCards=allCards.filter(function(c){return myInventory.includes(c.id);});
    if(!museumCards.length){
        document.getElementById('museum-carousel').innerHTML='<div style="color:#555;text-align:center;padding:80px;font-size:1.2rem;">No cards collected yet.</div>';
        return;
    }
    museumIndex=0;
    renderMuseumCarousel();
}
function renderMuseumCarousel(){
    var w=document.getElementById('museum-carousel');w.innerHTML='';
    if(!museumCards.length)return;
    var total=museumCards.length;
    var indices=[];
    if(total===1){indices=[0];}
    else if(total===2){indices=[(museumIndex-1+total)%total,museumIndex];}
    else{indices=[(museumIndex-1+total)%total,museumIndex,(museumIndex+1)%total];}

    indices.forEach(function(idx,pos){
        var card=museumCards[idx];
        var isCenter=(total<=1)?true:(total===2?(pos===1):(pos===1));
        var frame=document.createElement('div');
        frame.className='museum-frame '+(isCenter?'center':'side');
        frame.innerHTML=
            '<div class="museum-spotlight"></div>'+
            '<div class="museum-border"><div class="museum-card-img" id="mus-'+card.id+'" style="background-image:url(\''+card.img+'\');"></div></div>'+
            '<div class="museum-plaque">'+
                '<div class="museum-plaque-name">'+card.name+'</div>'+
                '<div class="museum-plaque-sub">'+card.type+' • '+card.rarity.toUpperCase()+'</div>'+
                '<div class="museum-plaque-stats"><span style="color:#2ecc71;">HP '+card.hp+'</span><span style="color:#e74c3c;">DMG '+card.dmg+'</span></div>'+
            '</div>';

        if(isCenter){
            frame.onclick=function(e){inspectCard(card,'mus-'+card.id,e);};
        }else{
            frame.onclick=function(){museumIndex=idx;renderMuseumCarousel();};
        }
        w.appendChild(frame);
    });
}
function museumNav(dir){
    if(!museumCards.length)return;
    museumIndex=(museumIndex+dir+museumCards.length)%museumCards.length;
    renderMuseumCarousel();
}
document.addEventListener('wheel',function(e){
    var wall=document.getElementById('museum-wall');
    if(!wall||wall.style.display==='none'||!museumActive)return;
    if(!wall.contains(e.target)&&e.target!==wall)return;
    e.preventDefault();
    museumNav(e.deltaY>0?1:-1);
},{passive:false});

/* ===== SELL DUPLICATES ===== */
function sellDuplicates(){
    var counts=getInventoryCounts(),ni=[],sold=[],tv=0;
    Object.keys(counts).forEach(function(idS){
        var id=parseInt(idS),cnt=counts[id],ext=Math.max(0,cnt-1),card=allCards.find(function(x){return x.id===id;});
        if(!card)return;
        ni.push(id);
        if(ext>0){
            var v=getDuplicateValue(card.rarity)*ext;
            tv+=v;
            sold.push({name:card.name,count:ext,val:v});
        }
    });
    if(!tv){alert('No extras!');return;}
    myInventory=ni;
    myDeck=myDeck.filter(function(id){return myInventory.includes(id);});
    addCoins(tv);
    createExplosion(window.innerWidth/2,window.innerHeight/2,'accent');

    var l=document.getElementById('receipt-list');l.innerHTML='';
    sold.forEach(function(i){l.innerHTML+='<div class="receipt-row"><span>'+i.name+' x'+i.count+'</span><span>'+i.val+'g</span></div>';});

    document.getElementById('receipt-total-gold').innerText=tv+'g';
    document.getElementById('receipt-overlay').style.display='flex';
    renderRacks();renderGallery();checkAchievements();saveFullState();
}

/* ===== CARD HTML ===== */
function createCardHTML(card,isRack,isFaceDown){
    var c=document.createElement('div');
    c.className=isRack?'card-container rack-card-container':'card-container';
    c.setAttribute('data-card-id',card.id);
    if(isFaceDown)c.classList.add('flipped');
    c.setAttribute('data-card-rarity',card.rarity);

    var f=document.createElement('div');
    f.className='card-face card-front '+card.rarity;
    f.style.cssText="background-image:url('"+card.img+"');";

    if(card.rarity==='legendary'||card.rarity==='epic'){
        var fc=card.rarity==='legendary'?'holo-foil-legendary':'holo-foil-epic';
        var hf=document.createElement('div');hf.className='holo-foil-overlay '+fc;f.appendChild(hf);
        var sp=document.createElement('div');sp.className='holo-sparkle-layer';f.appendChild(sp);
        c.setAttribute('data-holo','true');
    }
    
    // Card Mastery System
    if(typeof playerProfile !== 'undefined' && playerProfile.cardUseCounts && playerProfile.cardUseCounts[card.id]) {
        var uses = playerProfile.cardUseCounts[card.id];
        if(uses >= 10) {
            var badge = document.createElement('div');
            badge.className = 'mastery-badge';
            badge.innerHTML = uses >= 25 ? '★★' : '★';
            f.appendChild(badge);
        }
    }
    
    var hs=document.createElement('div');hs.className='inspect-hotspot';f.appendChild(hs);
    var b=document.createElement('div');b.className='card-face card-back';
    if(shopState&&shopState.appliedSleeves&&shopState.appliedSleeves[card.id]){
        var sid=shopState.appliedSleeves[card.id];
        var slv=typeof shopSleeves!=='undefined'&&shopSleeves?shopSleeves.find(function(s){return s.id===sid;}):null;
        if(slv&&slv.cssClass)b.classList.add(slv.cssClass);
    }

    c.appendChild(f);c.appendChild(b);
    return c;
}

/* ===== INSPECT ===== */
/* ===== INSPECT ===== */
var inspectIsFlipped=false,inspectClickLock=false;
function inspectCard(card,elId,event){
    if(event)event.stopPropagation();
    incPlayerStat('cardsInspected',1);
    updateObjectiveProgress('inspect_card',1);
    if(typeof advanceQuest==='function') advanceQuest('inspect_card');

    if(selectedStackId){
        var old=document.getElementById(selectedStackId);
        if(old)old.style.opacity='1';
    }
    selectedStackId=elId;

    var src=document.getElementById(elId);
    var rect = src ? src.getBoundingClientRect() : {top:window.innerHeight/2, left:window.innerWidth/2, width:0, height:0};
    if(src) src.style.opacity='0';

    var ov=document.getElementById('inspect-overlay');
    ov.innerHTML='';
    ov.style.display='flex';
    inspectIsFlipped=false;
    inspectClickLock=false;

    /* Card Element */
    var fly=createCardHTML(card,false,false);
    fly.classList.add('inspect-card-active');
    fly.style.cssText='position:absolute;top:'+rect.top+'px;left:'+rect.left+'px;width:160px;height:240px;transform:none;transition:top 0.5s cubic-bezier(0.175,0.885,0.32,1.275),left 0.5s cubic-bezier(0.175,0.885,0.32,1.275),width 0.5s cubic-bezier(0.175,0.885,0.32,1.275),height 0.5s cubic-bezier(0.175,0.885,0.32,1.275);';

    var hpBadge=document.createElement('div');
    hpBadge.className='inspect-stat-badge inspect-hp-badge';
    hpBadge.innerHTML='<span class="isb-icon">♥</span><span class="isb-val">'+card.hp+'</span>';

    var dmgBadge=document.createElement('div');
    dmgBadge.className='inspect-stat-badge inspect-dmg-badge';
    dmgBadge.innerHTML='<span class="isb-icon">⚔</span><span class="isb-val">'+card.dmg+'</span>';

    fly.querySelector('.card-front').appendChild(hpBadge);
    fly.querySelector('.card-front').appendChild(dmgBadge);

    var hBox=document.createElement('div');
    hBox.className='card-fav-heart-box'+(playerProfile.favoriteCardId===card.id?' active':'');
    hBox.innerHTML='<span class="heart-icon">'+(playerProfile.favoriteCardId===card.id?'♥':'♡')+'</span>';
    hBox.addEventListener('click',function(e2){
        e2.stopPropagation();
        if(playerProfile.favoriteCardId===card.id){
            playerProfile.favoriteCardId=null;
            hBox.classList.remove('active');
            hBox.querySelector('.heart-icon').innerText='♡';
        }else{
            playerProfile.favoriteCardId=card.id;
            hBox.classList.add('active');
            hBox.querySelector('.heart-icon').innerText='♥';
        }
        renderHomeProgress();
        renderFavoriteProfileSlot();
        saveFullState();
    });

    fly.querySelector('.card-back').appendChild(hBox);
    ov.appendChild(fly);

    fly.addEventListener('click', function(e){
        e.stopPropagation();
        if(inspectClickLock) return;
        inspectClickLock = true;
        fly.classList.toggle('flipped');
        setTimeout(function(){ inspectClickLock = false; }, 300);
    });

    requestAnimationFrame(function(){
        fly.style.top=((window.innerHeight-390)/2-30)+'px';
        var isMobile = window.innerWidth < 768;
        fly.style.left=isMobile ? ((window.innerWidth-260)/2)+'px' : ((window.innerWidth/2)-400)+'px';
        fly.style.width='260px';
        fly.style.height='390px';
        fly.style.transition = 'top 0.5s cubic-bezier(0.175,0.885,0.32,1.275), left 0.5s cubic-bezier(0.175,0.885,0.32,1.275), width 0.5s cubic-bezier(0.175,0.885,0.32,1.275), height 0.5s cubic-bezier(0.175,0.885,0.32,1.275), transform 0.3s ease';
    });

    var inDeck=myDeck.includes(card.id), owned=myInventory.includes(card.id), full=myDeck.length>=9;
    var dbtn='';
    if(owned){
        if(inDeck) dbtn='<button class="deck-action-btn deck-remove-btn" onclick="removeFromDeck('+card.id+');event.stopPropagation();">REMOVE FROM DECK</button>';
        else if(full) dbtn='<button class="deck-action-btn deck-full-btn" disabled>DECK FULL</button>';
        else dbtn='<button class="deck-action-btn deck-add-btn" onclick="addToDeck('+card.id+');event.stopPropagation();">+ ADD TO DECK</button>';
    }

    /* Sleeve selector */
    var sleeveSelectorHtml = '';
    if(owned){
        var currentSleeve = shopState.appliedSleeves && shopState.appliedSleeves[card.id] ? shopState.appliedSleeves[card.id] : null;
        var sleeveOpts = '<option value="">Default Back</option>';
        if(shopState.ownedSleeves){
            for(var sid in shopState.ownedSleeves){
                if(shopState.ownedSleeves[sid] > 0){
                    var slv = shopSleeves.find(s=>s.id===sid);
                    if(slv) sleeveOpts += '<option value="'+sid+'">'+slv.name+' (Owned: '+shopState.ownedSleeves[sid]+')</option>';
                }
            }
        }
        if(currentSleeve){
            var cslv = shopSleeves.find(s=>s.id===currentSleeve);
            if(cslv) sleeveOpts += '<option value="'+currentSleeve+'" selected>'+cslv.name+' (Equipped)</option>';
        }

        sleeveSelectorHtml = 
        '<div class="sleeve-customizer">'+
            '<h4>Card Sleeve</h4>'+
            (Object.keys(shopState.ownedSleeves || {}).length>0 || currentSleeve ?
            '<div class="sleeve-select-wrap"><select id="sleeve-select-'+card.id+'" onchange="handleSleeveChange('+card.id+', this.value)">'+sleeveOpts+'</select></div>' :
            '<p style="color:#888;font-size:0.9rem;margin:0;">Go to the shop to buy sleeves!</p>' )+
        '</div>';
    }

    var loreText = card.name + " is a legendary entity known across the battlegrounds. With a base attack of " + card.dmg + " and fortified with " + card.hp + " hit points, this card embodies the raw element of " + card.type.toUpperCase() + ". Legends say it was forged in the great magical rift.";

    var info=document.createElement('div');
    info.className='inspect-lore-panel';
    info.style.display='none'; /* F5: start hidden */
    info.innerHTML=
        '<div class="lore-header">'+
            '<h1 class="lore-title">'+card.name+'</h1>'+
            '<h3 class="lore-subtitle"><span class="lore-type '+card.type+'">'+card.type+'</span> | <span class="lore-rarity '+card.rarity.toLowerCase()+'">'+card.rarity+'</span></h3>'+
        '</div>'+
        '<div class="lore-stats-box">'+
            '<div class="lore-stat hp-stat"><div class="stat-icon">♥</div><div class="stat-info"><div class="stat-lbl">HEALTH</div><div class="stat-val">'+card.hp+'</div></div></div>'+
            '<div class="lore-stat dmg-stat"><div class="stat-icon">⚔</div><div class="stat-info"><div class="stat-lbl">DAMAGE</div><div class="stat-val">'+card.dmg+'</div></div></div>'+
        '</div>'+
        '<div class="lore-body">'+
            '<h4>Lore & History</h4>'+
            '<p>'+loreText+'</p>'+
        '</div>'+
        sleeveSelectorHtml +
        '<div class="lore-actions">'+
            dbtn +
            '<button class="deck-action-btn share-btn" onclick="shareCardPNG('+card.id+');event.stopPropagation();" style="background:#f39c12; color:#111; margin-top:10px; font-weight:900;">📤 SAVE / SHARE CARD</button>'+
        '</div>';

    /* F5: Info toggle button */
    var infoBtn=document.createElement('button');
    infoBtn.className='inspect-info-toggle';
    infoBtn.innerHTML='ℹ';
    infoBtn.style.cssText='position:absolute; top:10px; right:10px; z-index:50; background:rgba(0,0,0,0.6); color:var(--brand-gold); border:1px solid var(--brand-gold); border-radius:50%; width:36px; height:36px; font-size:1.2rem; cursor:pointer; backdrop-filter:blur(5px);';
    infoBtn.addEventListener('click',function(e2){
        e2.stopPropagation();
        var showing = info.style.display !== 'none';
        info.style.display = showing ? 'none' : '';
        if(!showing) { info.classList.remove('visible'); setTimeout(function(){ info.classList.add('visible'); }, 20); }
    });
    ov.appendChild(infoBtn);

    ov.appendChild(info);

    fly.addEventListener('click',function(e){
        e.stopPropagation();
        if(inspectClickLock)return;
        inspectClickLock=true;
        setTimeout(function(){inspectClickLock=false;},700);
        inspectIsFlipped=!inspectIsFlipped;
        fly.style.transition='transform 0.6s cubic-bezier(0.175,0.885,0.32,1.275)';
        fly.style.transform=inspectIsFlipped?'rotateY(180deg)':'';
    });

    fly.addEventListener('mousemove',function(e){
        var r=fly.getBoundingClientRect(),
            px=(e.clientX-r.left)/r.width,
            py=(e.clientY-r.top)/r.height;
        var rx=(0.5-py)*16,ry=(px-0.5)*16;

        fly.style.transition='transform 0.1s ease-out';
        if(inspectIsFlipped) fly.style.transform='perspective(1000px) rotateX('+rx+'deg) rotateY('+(180+ry)+'deg) scale(1.05)';
        else fly.style.transform='perspective(1000px) rotateX('+rx+'deg) rotateY('+ry+'deg) scale(1.05)';

        var hspot=fly.querySelector('.inspect-hotspot');
        if(hspot&&!inspectIsFlipped){
            hspot.style.setProperty('--mx',px*100+'%');
            hspot.style.setProperty('--my',py*100+'%');
            hspot.style.opacity='1';
        }

        var hp=fly.querySelector('.inspect-hp-badge'), dm=fly.querySelector('.inspect-dmg-badge');
        if(hp&&dm&&!inspectIsFlipped){
            var hpGlow=Math.max(0,py-0.5)*2, dmGlow=Math.max(0,0.5-py)*2;
            hp.style.boxShadow='0 0 '+(8+hpGlow*20)+'px rgba(46,204,113,'+(0.2+hpGlow*0.6)+')';
            hp.style.transform='scale('+(1+hpGlow*0.15)+')';
            dm.style.boxShadow='0 0 '+(8+dmGlow*20)+'px rgba(231,76,60,'+(0.2+dmGlow*0.6)+')';
            dm.style.transform='scale('+(1+dmGlow*0.15)+')';
        }
    });

    fly.addEventListener('mouseleave',function(){
        fly.style.transition='transform 0.6s cubic-bezier(0.175,0.885,0.32,1.275)';
        fly.style.transform=inspectIsFlipped?'rotateY(180deg)':'';
        var h=fly.querySelector('.inspect-hotspot'); if(h)h.style.opacity='0';
        var hp=fly.querySelector('.inspect-hp-badge'),dm=fly.querySelector('.inspect-dmg-badge');
        if(hp){hp.style.boxShadow='';hp.style.transform='';}
        if(dm){dm.style.boxShadow='';dm.style.transform='';}
    });

    setTimeout(initHoloFoil,100);
    checkAchievements();
}

function handleSleeveChange(cardId, newSleeveId) {
    if(!shopState.appliedSleeves) shopState.appliedSleeves = {};
    
    // Check if removing existing
    var oldSleeve = shopState.appliedSleeves[cardId];
    if(oldSleeve){
        shopState.ownedSleeves[oldSleeve] = (shopState.ownedSleeves[oldSleeve] || 0) + 1;
        delete shopState.appliedSleeves[cardId];
    }
    
    // Check if applying new
    if(newSleeveId && newSleeveId !== ""){
        if(shopState.ownedSleeves[newSleeveId] > 0){
            shopState.ownedSleeves[newSleeveId]--;
            shopState.appliedSleeves[cardId] = newSleeveId;
        }
    }
    saveFullState();
    showShopToast('Sleeve updated!','success');
    if(document.getElementById('shop')&&document.getElementById('shop').classList.contains('active-section'))renderShop();
    /* F6: do NOT re-trigger inspectCard — just update the card back in-place */
    var cardEl = document.querySelector('.inspect-card-active');
    if(cardEl) {
        var backFace = cardEl.querySelector('.card-back');
        if(backFace) {
            // Strip old sleeve classes
            backFace.className = 'card-face card-back';
            if(newSleeveId && newSleeveId !== '') {
                var slv = shopSleeves.find(function(s){ return s.id === newSleeveId; });
                if(slv) backFace.classList.add(slv.cssClass);
            }
        }
    }
}

function addToDeck(id){
    if(myDeck.length>=9||myDeck.includes(id))return;
    myDeck.push(id);
    updateObjectiveProgress('add_deck',1);
    if(typeof advanceQuest==='function') advanceQuest('add_deck');
    closeInspection();
    renderRacks();
    updateHeroFightBtn();
    saveFullState();
}
function removeFromDeck(id){
    myDeck=myDeck.filter(function(x){return x!==id;});
    closeInspection();
    renderRacks();
    updateHeroFightBtn();
    saveFullState();
}
function closeInspection(){
    var o=document.getElementById('inspect-overlay');
    if(o.style.display==='none')return;
    if(selectedStackId){
        var el=document.getElementById(selectedStackId);
        if(el)el.style.opacity='1';
    }
    selectedStackId=null;
    o.style.display='none';
    o.innerHTML='';
}

/* ===== TILT + HOLO ===== */
function initTilt(){
    document.querySelectorAll('.tilt-card').forEach(function(c){
        if(c._tilt)return;c._tilt=true;
        c.addEventListener('mousemove',function(e){
            var r=this.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
            this.style.transform='perspective(1000px) rotateX('+((0.5-py)*22)+'deg) rotateY('+((px-0.5)*22)+'deg) scale(1.075)';
        });
        c.addEventListener('mouseleave',function(){this.style.transform='';});
    });
}

/* Mobile touch hover parity */
function initHomeTouchHover(){
    if(!('ontouchstart' in window))return;
    var cards=document.querySelectorAll('.arena-card-box');
    cards.forEach(function(card){
        if(card._touchHoverBound)return;
        card._touchHoverBound=true;
        card.addEventListener('touchstart',function(){
            cards.forEach(function(c){if(c!==card)c.classList.remove('active-touch');});
            card.classList.add('active-touch');
        },{passive:true});
        card.addEventListener('touchend',function(){
            setTimeout(function(){card.classList.remove('active-touch');},220);
        },{passive:true});
        card.addEventListener('touchcancel',function(){card.classList.remove('active-touch');},{passive:true});
    });
}

function initHoloFoil(){
    document.querySelectorAll('[data-holo="true"]').forEach(function(c){
        if(c._holo)return;c._holo=true;
        c.addEventListener('mousemove',function(e){
            var r=this.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*100,py=(e.clientY-r.top)/r.height*100;
            this.classList.add('holo-active');
            var f=this.querySelector('.holo-foil-overlay'),s=this.querySelector('.holo-sparkle-layer');
            if(f)f.style.backgroundPosition=px*2+'% '+py*2+'%';
            if(s)s.style.background='radial-gradient(ellipse at '+px+'% '+py+'%,rgba(255,255,255,0.4) 0%,transparent 65%)';
        });
        c.addEventListener('mouseleave',function(){this.classList.remove('holo-active');});
    });
}

/* ===== PROFILE ===== */
var ccIsFlipped=false;
function initCCTilt(){
    var card=document.getElementById('cc-card');
    if(!card)return;
    /* reset flag so it always rebinds */
    card._cc=false;
    if(card._cc)return;
    card._cc=true;

    card.addEventListener('click',function(e){
        if(e.target.closest('.cc-achiev-btn')||e.target.closest('.cc-settings-btn'))return;
        ccIsFlipped=!ccIsFlipped;
        card.style.transition='transform 0.6s cubic-bezier(0.175,0.885,0.32,1.275)';
        card.style.transform=ccIsFlipped?'rotateY(180deg)':'rotateY(0deg)';
    });
    card.addEventListener('mousemove',function(e){
        var r=card.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
        var rx=(0.5-py)*10,ry=(px-0.5)*10;
        var base=ccIsFlipped?180:0;
        card.style.transition='transform 0.06s';
        card.style.transform='perspective(1200px) rotateX('+rx+'deg) rotateY('+(base+ry)+'deg)';
    });
    card.addEventListener('mouseleave',function(){
        var base=ccIsFlipped?180:0;
        card.style.transition='transform 0.32s cubic-bezier(0.175,0.885,0.32,1.275)';
        card.style.transform='rotateY('+base+'deg)';
    });
}
function openProfile(){
    document.getElementById('profile-overlay').style.display='flex';
    ccIsFlipped=false;
    var ccEl=document.getElementById('cc-card');
    if(ccEl){ccEl.style.transition='none';ccEl.style.transform='rotateY(0deg)';ccEl._cc=false;}
    document.getElementById('cc-edit-section').style.display='none';
    document.getElementById('cc-edit-toggle').innerText='EDIT PROFILE';
    document.getElementById('cc-name-input').value=playerProfile.name;
    document.getElementById('cc-holder-name').innerText=playerProfile.name||'PLAYER NAME';
    document.getElementById('cc-card-number').innerText=cardNumber;
    document.getElementById('cc-level-badge').innerText='LVL '+playerProfile.level;
    document.getElementById('cc-valid-date').innerText=playerProfile.memberSince||'02/26';
    updateCCAvatar();
    document.getElementById('cc-xp-fill').style.width=getXPPercent()+'%';
    var l=playerProfile.totalMatches-playerProfile.totalWins;
    document.getElementById('cc-sig-text').innerText='WINS: '+playerProfile.totalWins+' | LOSSES: '+l;
    document.getElementById('cc-cvv-text').innerText=(playerProfile.totalMatches>0?Math.round(playerProfile.totalWins/playerProfile.totalMatches*100):0)+'%';
    document.getElementById('cc-stat-matches').innerText=playerProfile.totalMatches;
    document.getElementById('cc-stat-cards').innerText=[...new Set(myInventory)].length;
    document.getElementById('cc-stat-level').innerText=playerProfile.level;
    document.getElementById('cc-gauntlet-val').innerText='Stage '+(playerProfile.gauntletBest||0);
    renderCCStamps();
    renderMatchTrend();
    buildCCAvatarPicker();
    initAvatarCanvas();
    renderFavoriteProfileSlot();
    updateObjectiveProgress('open_profile',1);
    initAvatarCanvas();
}
function renderMatchTrend(){
    var a=document.getElementById('cc-match-trend');
    a.innerHTML='<span class="cc-trend-label">FORM</span>';
    var l5=battleHistory.slice(0,5);
    for(var i=0;i<5;i++){
        if(i<l5.length){
            var r=l5[i].result;
            a.innerHTML+='<div class="trend-dot t-'+(r==='win'?'win':r==='loss'?'loss':'draw')+'">'+(r==='win'?'W':r==='loss'?'L':'D')+'</div>';
        }else a.innerHTML+='<div class="trend-empty"></div>';
    }
}
function closeProfile(){
    document.getElementById('profile-overlay').style.display='none';
    document.getElementById('achieve-panel').classList.remove('open');
}
function updateCCAvatar(){
    var f=document.getElementById('cc-avatar-frame');
    if(!f)return;
    /* Canvas avatar takes priority */
    if(playerProfile._avatarDataUrl){
        f.style.backgroundImage="url('"+playerProfile._avatarDataUrl+"')";
        f.innerHTML='';
        return;
    }
    /* Fall back to card avatar */
    if(playerProfile.avatarCardId){
        var c=allCards.find(function(x){return x.id===playerProfile.avatarCardId;});
        if(c){f.style.backgroundImage="url('"+c.img+"')";f.innerHTML='';return;}
    }
    f.style.backgroundImage='';
    f.innerHTML='?';
}
function renderFavoriteProfileSlot(){
    var t=document.getElementById('cc-fav-thumb'),n=document.getElementById('cc-fav-name');
    if(playerProfile.favoriteCardId){
        var c=allCards.find(function(x){return x.id===playerProfile.favoriteCardId;});
        if(c){t.style.backgroundImage="url('"+c.img+"')";n.innerText=c.name;return;}
    }
    t.style.backgroundImage='';
    n.innerText='None';
}
function buildCCAvatarPicker(){
    var r=document.getElementById('cc-avatar-row');r.innerHTML='';
    var own=[...new Set(myInventory)];
    allCards.forEach(function(c){
        var o=own.includes(c.id);
        var d=document.createElement('div');
        d.className='cc-avatar-opt';
        if(o){
            d.style.backgroundImage="url('"+c.img+"')";
            if(playerProfile.avatarCardId===c.id)d.classList.add('selected');
            d.onclick=function(){
                playerProfile.avatarCardId=c.id;
                updateCCAvatar();
                buildCCAvatarPicker();
                saveFullState();
            };
        }else{
            d.classList.add('locked');
            d.style.backgroundImage="url('assets/card_back.png')";
        }
        r.appendChild(d);
    });
}
function toggleEditSection(){
    var s=document.getElementById('cc-edit-section'),b=document.getElementById('cc-edit-toggle');
    s.style.display=s.style.display==='none'?'block':'none';
    b.innerText=s.style.display==='none'?'EDIT PROFILE':'CLOSE EDITOR';
}
function saveProfile(){
    var v=document.getElementById('cc-name-input').value.trim();
    if(!v.length)return;
    playerProfile.name=v.toUpperCase();
    playerProfile.saved=true;
    playerProfile._avatarConfig=Object.assign({},avatarConfig);
    if(!playerProfile.memberSince){
        var now=new Date();
        playerProfile.memberSince=String(now.getMonth()+1).padStart(2,'0')+'/'+String(now.getFullYear()).slice(-2);
    }
    document.getElementById('cc-holder-name').innerText=playerProfile.name;
    document.getElementById('cc-edit-section').style.display='none';
    document.getElementById('cc-edit-toggle').innerText='EDIT PROFILE';
    updateHeaderProfile();
    _updateAvatarFrames();
    updateCCAvatarFromCanvas();
    createExplosion(window.innerWidth/2,window.innerHeight/2,'accent');
    showToast('Profile saved!','success','✓');
    renderHomeProgress();
    saveFullState();
}

function updateHeaderProfile(){
    var n=document.getElementById('header-profile-name'),m=document.getElementById('header-mini-avatar');
    if(playerProfile.saved&&playerProfile.name){
        n.innerText=playerProfile.name;
        if(playerProfile.avatarCardId){
            var c=allCards.find(function(x){return x.id===playerProfile.avatarCardId;});
            if(c){m.style.backgroundImage="url('"+c.img+"')";m.style.display='block';}
        }else m.style.display='none';
    }else{
        n.innerText='LOGIN';
        m.style.display='none';
    }
    /* Apply equipped profile border */
    var ccFront=document.querySelector('.cc-face.cc-front');
    if(ccFront){
        ccFront.classList.remove('cc-border-diamond','cc-border-crimson');
        if(shopState.equippedBorder!=='gold')ccFront.classList.add('cc-border-'+shopState.equippedBorder);
    }
}

/* ===== HERO BUTTONS ===== */
function scrollHeroDown(){
    var section=document.getElementById('home');
    var target=document.getElementById('home-content-start');
    if(section&&target)section.scrollTo({top:target.offsetTop,behavior:'smooth'});
}
function heroBuyPacks(){
    navTo('game',document.querySelector('.play-btn'));
    setTimeout(function(){
        var btns=document.querySelectorAll('.shop-btn-gold:not(.fight-bot-btn)');
        btns.forEach(function(b){
            b.style.transition='box-shadow 0.15s,transform 0.15s';
            b.style.boxShadow='0 0 50px rgba(241,196,15,1),0 6px 0 #b33939';
            b.style.transform='scale(1.07) translateY(-4px)';
            setTimeout(function(){b.style.boxShadow='';b.style.transform='';},900);
        });
    },380);
}
function heroFightBot(){
    var msg=document.getElementById('hc-fight-msg');
    var clearMsg=function(){setTimeout(function(){if(msg)msg.classList.remove('show');},3500);};

    if(myInventory.length===0){
        if(msg){msg.innerText='Open a pack first to unlock bot battles!';msg.classList.add('show');clearMsg();}
        return;
    }
    if(myDeck.length===0){
        if(msg){msg.innerText='Add a card to your deck first!';msg.classList.add('show');clearMsg();}
        return;
    }
    openFightModal();
}
function updateHeroFightBtn(){
    var btn=document.getElementById('hc-fight-btn');
    var lock=document.getElementById('hc-fight-lock');
    if(!btn)return;
    var has=myInventory.length>0;
    btn.classList.toggle('locked',!has);
    btn.classList.toggle('unlocked',has);
    if(lock)lock.innerText=has?'':'🔒';
}
/* ===== H12. ERROR + FEEDBACK REPORTER ===== */
function openBugReport(){
    var info='Page: '+window.location.href+'\nScreen: '+window.innerWidth+'x'+window.innerHeight+'\nUA: '+navigator.userAgent+'\nTime: '+new Date().toISOString();
    var html='<div class="breakdown-modal glass-panel" onclick="event.stopPropagation()">'+
        '<h2 style="color:var(--brand-gold);letter-spacing:3px;margin:0 0 15px;">🐛 BUG REPORT</h2>'+
        '<textarea id="bug-report-text" style="width:100%;min-height:100px;background:rgba(0,0,0,0.3);color:#fff;border:1px solid var(--border-secondary);border-radius:8px;padding:12px;font-size:0.9rem;resize:vertical;" placeholder="Describe the bug..."></textarea>'+
        '<div style="font-size:0.7rem;color:#555;margin:8px 0;">Session info will be auto-attached.</div>'+
        '<button class="daily-claim-btn" onclick="sendBugReport()" style="width:100%;margin-top:10px;">SEND TO DEV</button>'+
        '<button style="background:transparent;border:none;color:#888;margin-top:10px;cursor:pointer;width:100%;" onclick="closeBugReport()">Cancel</button>'+
    '</div>';
    var ov=document.getElementById('trade-overlay');
    if(!ov){ov=document.createElement('div');ov.id='trade-overlay';ov.className='trade-overlay';document.body.appendChild(ov);}
    ov.innerHTML=html;ov.style.display='flex';
    ov._bugInfo=info;
}
function sendBugReport(){
    var txt=document.getElementById('bug-report-text');
    if(!txt||!txt.value.trim()){showShopToast('Please describe the bug!','error');return;}
    var ov=document.getElementById('trade-overlay');
    var info=ov?ov._bugInfo:'';
    var subject='orb Bug Report';
    var body='Bug Description:\n'+txt.value.trim()+'\n\n--- Session Info ---\n'+info;
    window.location.href='mailto:cards2.0.tcg@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    closeBugReport();
    showShopToast('Opening mail app...','success');
}
function closeBugReport(){var ov=document.getElementById('trade-overlay');if(ov)ov.style.display='none';}

/* ===== H13. DECK RECOMMENDATION ===== */
function getDeckRecommendation(){
    var owned=myInventory.map(function(id){return allCards.find(function(c){return c.id===id;});}).filter(Boolean);
    if(owned.length<3){showShopToast('Collect more cards first!','error');return [];}
    
    /* Sort by combined stat power */
    var scored=owned.map(function(c){return {card:c, score:c.hp+c.dmg};});
    scored.sort(function(a,b){return b.score-a.score;});
    
    /* Pick top 9 with type diversity */
    var recommended=[];
    var typeCounts={};
    scored.forEach(function(s){
        if(recommended.length>=9)return;
        var t=s.card.type;
        typeCounts[t]=(typeCounts[t]||0);
        if(typeCounts[t]<3){ /* max 3 per type */
            recommended.push(s.card);
            typeCounts[t]++;
        }
    });
    /* Fill remaining spots */
    if(recommended.length<9){
        scored.forEach(function(s){
            if(recommended.length>=9)return;
            if(!recommended.includes(s.card))recommended.push(s.card);
        });
    }
    return recommended;
}
function applyRecommendedDeck(){
    var rec=getDeckRecommendation();
    if(!rec||rec.length===0)return;
    myDeck=rec.map(function(c){return c.id;}).slice(0,9);
    saveFullState();
    renderRacks();
    updateDeckCounter();
    showShopToast('Recommended deck applied!','success');
}

/* ===== UX POLISH OVERRIDES ===== */

function setOwnedFilter(m,el){
    galleryOwnedFilter=m;
    document.querySelectorAll('.filter-pill-group .filter-pill').forEach(function(x){x.classList.remove('active');});
    if(el)el.classList.add('active');
    renderGallery();
}

function renderGalleryDeckBuilder(){
    var wrap=document.getElementById('gallery-deck-builder');
    var slots=document.getElementById('gallery-deck-slots');
    if(!wrap||!slots)return;

    var showBuilder=(galleryOwnedFilter==='deck'||galleryOwnedFilter==='owned'||galleryOwnedFilter==='all');
    wrap.style.display=showBuilder?'block':'none';
    if(!showBuilder)return;

    slots.innerHTML='';

    for(var i=0;i<9;i++){
        var id=myDeck[i];
        var slot=document.createElement('div');
        slot.className='gdb-slot'+(id?' filled':'');
        slot.setAttribute('data-slot-index',String(i));

        slot.addEventListener('dragover',function(e){e.preventDefault();this.classList.add('drop');});
        slot.addEventListener('dragleave',function(){this.classList.remove('drop');});
        slot.addEventListener('drop',function(e){
            e.preventDefault();
            this.classList.remove('drop');
            var cid=parseInt(e.dataTransfer.getData('text/card-id'));
            if(!cid)return;
            addToDeck(cid);
        });

        if(id){
            var card=allCards.find(function(c){return c.id===id;});
            if(card){
                slot.style.backgroundImage="url('"+card.img+"')";
                slot.title=card.name+' (click to remove)';
                (function(cardId){slot.onclick=function(){removeFromDeck(cardId);};})(id);
            }
        }else{
            slot.innerHTML='<span>+ DROP</span>';
        }

        slots.appendChild(slot);
    }
}

function renderGallery(){
    var c=document.getElementById('gallery-grid-container');
    if(!c)return;
    c.innerHTML='';
    updateSellExtrasVisibility();
    renderGalleryDeckBuilder();
    if(museumActive)return;

    var sv=(document.getElementById('gallery-search')?document.getElementById('gallery-search').value:'').toLowerCase().trim();
    var uo=[...new Set(myInventory)].length;

    document.getElementById('gp-owned').innerText=uo;
    document.getElementById('gp-total').innerText=TOTAL_CARDS;
    document.getElementById('gp-bar-fill').style.width=Math.round(uo/TOTAL_CARDS*100)+'%';

    var mh=document.getElementById('museum-hint');
    if(mh)mh.style.display=uo>0?'block':'none';

    var list=allCards.slice();

    if(galleryOwnedFilter==='deck')list=list.filter(function(x){return myDeck.includes(x.id);});
    else if(galleryOwnedFilter==='owned')list=list.filter(function(x){return myInventory.includes(x.id);});
    else if(galleryOwnedFilter==='unowned')list=list.filter(function(x){return !myInventory.includes(x.id);});

    if(sv)list=list.filter(function(x){return x.name.toLowerCase().includes(sv)||x.type.toLowerCase().includes(sv)||x.rarity.includes(sv);});
    if(filterState.types&&filterState.types.length>0){
        list=list.filter(function(x){return filterState.types.indexOf(x.type)>-1;});
    }
    if(filterState.rarities&&filterState.rarities.length>0){
        list=list.filter(function(x){return filterState.rarities.indexOf(x.rarity)>-1;});
    }

    if(filterState.sort==='alpha')list.sort(function(a,b){return a.name.localeCompare(b.name);});
    else if(filterState.sort==='attack')list.sort(function(a,b){return b.dmg-a.dmg;});
    else if(filterState.sort==='hp')list.sort(function(a,b){return b.hp-a.hp;});
    else if(filterState.sort==='rarityAsc')list.sort(function(a,b){return rarityValue(a.rarity)-rarityValue(b.rarity);});
    else if(filterState.sort==='rarityDesc')list.sort(function(a,b){return rarityValue(b.rarity)-rarityValue(a.rarity);});

    if(!list.length){c.innerHTML='<div class="gallery-no-results">No cards found</div>';return;}

    list.forEach(function(card){
        var cnt=myInventory.filter(function(id){return id===card.id;}).length;
        var owned=cnt>0;
        var item=document.createElement('div');
        item.className='gallery-item '+(owned?'unlocked':'locked');
        item.draggable=owned;

        var bg=owned?"url('"+card.img+"')":"url('assets/card_back.png')";
        var rb='';
        if(owned&&card.rarity==='legendary')rb='border-color:#ffd700;box-shadow:0 0 15px #ffd700;';
        else if(owned&&card.rarity==='epic')rb='border-color:#b338ff;box-shadow:0 0 10px #b338ff;';
        var cntB=owned&&cnt>1?'<div class="card-count-badge">x'+cnt+'</div>':'';
        var ownB=owned?'<div class="owned-badge">OWNED</div>':'';

        item.innerHTML=
            '<div style="position:relative;width:100%;">'+
                '<div class="gallery-card-inner" id="gi-'+card.id+'" style="width:100%;aspect-ratio:160/240;background-image:'+bg+';border-radius:12px;border:2px solid #333;box-shadow:0 5px 15px rgba(0,0,0,0.5);position:relative;overflow:hidden;'+rb+'">'+cntB+'</div>'+
                ownB+
            '</div>'+
            '<div class="gallery-name">'+(owned?card.name:'???')+'</div>';

        if(owned){
            item.addEventListener('mousemove',function(e){
                var inner=item.querySelector('.gallery-card-inner');
                if(!inner)return;
                var r=inner.getBoundingClientRect();
                var px=(e.clientX-r.left)/r.width;
                var py=(e.clientY-r.top)/r.height;
                inner.style.transform='perspective(800px) rotateX('+((0.5-py)*18)+'deg) rotateY('+((px-0.5)*18)+'deg) scale(1.06)';
            });
            item.addEventListener('mouseleave',function(){
                var inner=item.querySelector('.gallery-card-inner');
                if(inner)inner.style.transform='';
            });
            item.addEventListener('click',function(e){inspectCard(card,'gi-'+card.id,e);});
            item.addEventListener('dragstart',function(e){
                e.dataTransfer.setData('text/card-id',String(card.id));
                e.dataTransfer.effectAllowed='copy';
            });
        }

        c.appendChild(item);
    });

    initHoloFoil();
}

function getCardUseTip(card){
    var type=(card.type||'').toLowerCase();
    if(type==='fire')return 'Use against low-HP targets to finish rounds quickly.';
    if(type==='water')return 'Best when you need stable defense and sustain.';
    if(type==='air')return 'Great for flexible stat picks and tempo plays.';
    if(type==='phantom')return 'Strong surprise finisher when enemy commits attack.';
    if(type==='magic')return 'Works best in balanced decks with mixed rarities.';
    if(type==='plasma')return 'Use to pressure high-value enemy cards early.';
    return 'Play this when its stronger stat matches your round plan.';
}

var inspectIsFlipped=false,inspectClickLock=false;
function inspectCard(card,elId,event){
    if(event)event.stopPropagation();
    incPlayerStat('cardsInspected',1);
    updateObjectiveProgress('inspect_card',1);
    if(typeof advanceQuest==='function')advanceQuest('inspect_card');

    if(selectedStackId){
        var old=document.getElementById(selectedStackId);
        if(old)old.style.opacity='1';
    }
    selectedStackId=elId;

    var src=document.getElementById(elId);
    var rect=src?src.getBoundingClientRect():{top:window.innerHeight/2,left:window.innerWidth/2,width:0,height:0};
    if(src)src.style.opacity='0';

    var ov=document.getElementById('inspect-overlay');
    ov.innerHTML='';
    ov.style.display='flex';
    ov.classList.remove('expanded');
    inspectIsFlipped=false;
    inspectClickLock=false;

    var fly=createCardHTML(card,false,false);
    fly.classList.add('inspect-card-active');
    fly.style.cssText='position:absolute;top:'+rect.top+'px;left:'+rect.left+'px;width:160px;height:240px;transform:none;transition:top .42s,left .42s,width .42s,height .42s,transform .16s;';
    ov.appendChild(fly);

    requestAnimationFrame(function(){
        fly.style.top=((window.innerHeight-360)/2-26)+'px';
        fly.style.left=((window.innerWidth-240)/2)+'px';
        fly.style.width='240px';
        fly.style.height='360px';
    });

    var inDeck=myDeck.includes(card.id),owned=myInventory.includes(card.id),full=myDeck.length>=9;
    var deckBtn='';
    if(owned){
        if(inDeck)deckBtn='<button class="deck-action-btn deck-remove-btn" onclick="removeFromDeck('+card.id+');event.stopPropagation();">REMOVE FROM DECK</button>';
        else if(full)deckBtn='<button class="deck-action-btn deck-full-btn" disabled>DECK FULL</button>';
        else deckBtn='<button class="deck-action-btn deck-add-btn" onclick="addToDeck('+card.id+');event.stopPropagation();">+ ADD TO DECK</button>';
    }

    var infoStrip=document.createElement('div');
    infoStrip.className='inspect-mini-info';
    infoStrip.onclick=function(e){e.stopPropagation();};
    infoStrip.innerHTML=
        '<div class="imi-main">'+
            '<div class="imi-name"><strong>'+card.name+'</strong></div>'+
            '<div class="imi-meta">'+card.type+' | '+card.rarity.toLowerCase()+'</div>'+
            '<div class="imi-stats"><span class="imi-hp">HP: '+card.hp+'</span> <span class="imi-dmg">DMG: '+card.dmg+'</span></div>'+
            '<div class="imi-actions">'+deckBtn+'</div>'+
        '</div>'
    ov.appendChild(infoStrip);

    var sleeveSelectorHtml='';
    if(owned){
        var currentSleeve=shopState.appliedSleeves&&shopState.appliedSleeves[card.id]?shopState.appliedSleeves[card.id]:'';
        var sleeveOpts='<option value="">Default Back</option>';
        if(shopState.ownedSleeves){
            for(var sid in shopState.ownedSleeves){
                if(shopState.ownedSleeves[sid]>0){
                    var slv=shopSleeves.find(function(s){return s.id===sid;});
                    if(slv)sleeveOpts+='<option value="'+sid+'" '+(sid===currentSleeve?'selected':'')+'>'+slv.name+' (Owned: '+shopState.ownedSleeves[sid]+')</option>';
                }
            }
        }
        sleeveSelectorHtml=
            '<div class="sleeve-customizer">'+
                '<h4>Card Sleeve</h4>'+
                '<div class="sleeve-select-wrap">'+
                    '<select id="sleeve-select-'+card.id+'">'+sleeveOpts+'</select>'+
                '</div>'+
                '<button class="deck-action-btn deck-add-btn" style="margin-top:10px;" onclick="applySelectedSleeve('+card.id+');event.stopPropagation();">APPLY SLEEVE</button>'+
            '</div>';
    }

    fly.addEventListener('click',function(e){
        e.stopPropagation();
        if(inspectClickLock)return;
        inspectClickLock=true;
        setTimeout(function(){inspectClickLock=false;},650);
        inspectIsFlipped=!inspectIsFlipped;
        fly.style.transform=inspectIsFlipped?'rotateY(180deg)':'';
    });

    fly.addEventListener('mousemove',function(e){
        var r=fly.getBoundingClientRect();
        var px=(e.clientX-r.left)/r.width;
        var py=(e.clientY-r.top)/r.height;
        var rx=(0.5-py)*13;
        var ry=(px-0.5)*13;
        fly.style.transition='transform 0.1s ease-out';
        if(inspectIsFlipped){
            fly.style.transform='perspective(1000px) rotateX('+rx+'deg) rotateY('+(180+ry)+'deg) scale(1.03)';
        } else {
            fly.style.transform='perspective(1000px) rotateX('+rx+'deg) rotateY('+ry+'deg) scale(1.03)';
        }
    });
    fly.addEventListener('mouseleave',function(){
        fly.style.transition='transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)';
        fly.style.transform=inspectIsFlipped?'rotateY(180deg)':'';
    });

    setTimeout(initHoloFoil,100);
    checkAchievements();
}

function applySelectedSleeve(cardId){
    var sel=document.getElementById('sleeve-select-'+cardId);
    if(!sel)return;
    handleSleeveChange(cardId,sel.value||'');
}

function addToDeck(id){
    if(myDeck.length>=9||myDeck.includes(id)||!myInventory.includes(id))return;
    myDeck.push(id);
    updateObjectiveProgress('add_deck',1);
    if(typeof advanceQuest==='function')advanceQuest('add_deck');
    renderRacks();
    renderGallery();
    renderDeckPresetButtons();
    updateHeroFightBtn();
    saveFullState();
    closeInspection();
}

function removeFromDeck(id){
    myDeck=myDeck.filter(function(x){return x!==id;});
    renderRacks();
    renderGallery();
    renderDeckPresetButtons();
    updateHeroFightBtn();
    saveFullState();
    closeInspection();
}

function closeInspection(){
    var o=document.getElementById('inspect-overlay');
    if(o.style.display==='none')return;
    if(selectedStackId){
        var el=document.getElementById(selectedStackId);
        if(el)el.style.opacity='1';
    }
    selectedStackId=null;
    o.classList.remove('expanded');
    o.style.display='none';
    o.innerHTML='';
}

/* ===== SKRIBBL-STYLE AVATAR ===== */
var avatarConfig={body:0,eyes:0,mouth:0};

var avatarBodies=[
    {name:'Red',    base:'#f44336'},
    {name:'Blue',   base:'#2196f3'},
    {name:'Green',  base:'#4caf50'},
    {name:'Yellow', base:'#ffeb3b'},
    {name:'Purple', base:'#9c27b0'},
    {name:'Cyan',   base:'#00bcd4'},
    {name:'Orange', base:'#ff9800'},
    {name:'Pink',   base:'#e91e63'},
    {name:'Lime',   base:'#cddc39'},
    {name:'Teal',   base:'#009688'},
    {name:'Indigo', base:'#3f51b5'},
    {name:'Coral',  base:'#ff5722'},
    {name:'Sky',    base:'#03a9f4'},
    {name:'Mint',   base:'#26a69a'}
];

var avatarEyes=[
    {name:'Normal', draw:function(ctx,ex,ey){
        [ex-18,ex+18].forEach(function(x){
            ctx.beginPath();ctx.arc(x,ey,9,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
            ctx.beginPath();ctx.arc(x+2,ey+2,5,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
            ctx.beginPath();ctx.arc(x+1,ey+1,2,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
        });
    }},
    {name:'Happy', draw:function(ctx,ex,ey){
        ctx.strokeStyle='#111';ctx.lineWidth=3.5;ctx.lineCap='round';
        [ex-18,ex+18].forEach(function(x){ctx.beginPath();ctx.arc(x,ey+2,8,Math.PI,0);ctx.stroke();});
    }},
    {name:'Sad', draw:function(ctx,ex,ey){
        ctx.strokeStyle='#111';ctx.lineWidth=3.5;ctx.lineCap='round';
        [ex-18,ex+18].forEach(function(x){ctx.beginPath();ctx.arc(x,ey-2,8,0,Math.PI);ctx.stroke();});
    }},
    {name:'Angry', draw:function(ctx,ex,ey){
        [ex-18,ex+18].forEach(function(x){
            ctx.beginPath();ctx.arc(x,ey,9,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
            ctx.beginPath();ctx.arc(x+2,ey+2,5,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
        });
        ctx.strokeStyle='#111';ctx.lineWidth=3.5;
        ctx.beginPath();ctx.moveTo(ex-28,ey-11);ctx.lineTo(ex-8,ey-4);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ex+8,ey-4);ctx.lineTo(ex+28,ey-11);ctx.stroke();
    }},
    {name:'Sleepy', draw:function(ctx,ex,ey){
        ctx.strokeStyle='#111';ctx.lineWidth=3.5;ctx.lineCap='round';
        [ex-18,ex+18].forEach(function(x){ctx.beginPath();ctx.moveTo(x-10,ey);ctx.lineTo(x+10,ey);ctx.stroke();});
        ctx.fillStyle='rgba(0,0,0,0.3)';
        [ex-18,ex+18].forEach(function(x){
            ctx.beginPath();ctx.arc(x,ey+2,8,Math.PI,0);ctx.fill();
        });
    }},
    {name:'Stars', draw:function(ctx,ex,ey){
        ctx.fillStyle='#f1c40f';ctx.font='bold 20px serif';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText('★',ex-18,ey+1);ctx.fillText('★',ex+18,ey+1);
    }},
    {name:'Wink', draw:function(ctx,ex,ey){
        ctx.beginPath();ctx.arc(ex-18,ey,9,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
        ctx.beginPath();ctx.arc(ex-16,ey+2,5,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
        ctx.beginPath();ctx.arc(ex-17,ey+1,2,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
        ctx.strokeStyle='#111';ctx.lineWidth=3.5;ctx.lineCap='round';
        ctx.beginPath();ctx.arc(ex+18,ey+2,8,Math.PI,0);ctx.stroke();
    }},
    {name:'Dead', draw:function(ctx,ex,ey){
        ctx.strokeStyle='#111';ctx.lineWidth=3;ctx.lineCap='round';
        [ex-18,ex+18].forEach(function(x){
            ctx.beginPath();ctx.moveTo(x-7,ey-7);ctx.lineTo(x+7,ey+7);ctx.stroke();
            ctx.beginPath();ctx.moveTo(x+7,ey-7);ctx.lineTo(x-7,ey+7);ctx.stroke();
        });
    }},
    {name:'Wide', draw:function(ctx,ex,ey){
        [ex-18,ex+18].forEach(function(x){
            ctx.beginPath();ctx.arc(x,ey,11,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
            ctx.beginPath();ctx.arc(x,ey,7,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
            ctx.beginPath();ctx.arc(x-2,ey-3,2.5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
        });
    }},
    {name:'Dizzy', draw:function(ctx,ex,ey){
        ctx.strokeStyle='#111';ctx.lineWidth=2.5;ctx.lineCap='round';
        [[ex-18,ey],[ex+18,ey]].forEach(function(p){
            var x=p[0],y=p[1];
            ctx.beginPath();ctx.moveTo(x-6,y-4);ctx.lineTo(x+6,y+4);ctx.stroke();
            ctx.beginPath();ctx.moveTo(x+6,y-4);ctx.lineTo(x-6,y+4);ctx.stroke();
            ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);
            ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=2;ctx.stroke();
            ctx.strokeStyle='#111';ctx.lineWidth=2.5;
        });
    }},
    {name:'Cool', draw:function(ctx,ex,ey){
        /* sunglasses */
        ctx.fillStyle='#111';
        ctx.beginPath();ctx.roundRect(ex-30,ey-7,22,14,4);ctx.fill();
        ctx.beginPath();ctx.roundRect(ex+8,ey-7,22,14,4);ctx.fill();
        ctx.strokeStyle='#111';ctx.lineWidth=2.5;
        ctx.beginPath();ctx.moveTo(ex-8,ey-2);ctx.lineTo(ex+8,ey-2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ex-30,ey-2);ctx.lineTo(ex-36,ey-6);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ex+30,ey-2);ctx.lineTo(ex+36,ey-6);ctx.stroke();
    }},
    {name:'Heart', draw:function(ctx,ex,ey){
        ctx.fillStyle='#e91e63';ctx.font='bold 18px serif';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText('♥',ex-18,ey+1);ctx.fillText('♥',ex+18,ey+1);
    }}
];

var avatarMouths=[
    {name:'Smile', draw:function(ctx,mx,my){
        ctx.strokeStyle='#111';ctx.lineWidth=3.5;ctx.lineCap='round';
        ctx.beginPath();ctx.arc(mx,my-4,16,0.15*Math.PI,0.85*Math.PI);ctx.stroke();
    }},
    {name:'Grin', draw:function(ctx,mx,my){
        ctx.fillStyle='#111';
        ctx.beginPath();ctx.arc(mx,my-4,16,0.05*Math.PI,0.95*Math.PI);ctx.fill();
        ctx.fillStyle='#fff';ctx.fillRect(mx-13,my-8,26,8);
    }},
    {name:'Laugh', draw:function(ctx,mx,my){
        ctx.fillStyle='#111';
        ctx.beginPath();ctx.ellipse(mx,my,18,14,0,0,Math.PI);ctx.fill();
        ctx.fillStyle='#fff';
        ctx.beginPath();ctx.ellipse(mx,my,10,7,0,0,Math.PI);ctx.fill();
    }},
    {name:'Sad', draw:function(ctx,mx,my){
        ctx.strokeStyle='#111';ctx.lineWidth=3.5;ctx.lineCap='round';
        ctx.beginPath();ctx.arc(mx,my+14,16,1.15*Math.PI,1.85*Math.PI);ctx.stroke();
    }},
    {name:'Flat', draw:function(ctx,mx,my){
        ctx.strokeStyle='#111';ctx.lineWidth=3.5;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(mx-14,my);ctx.lineTo(mx+14,my);ctx.stroke();
    }},
    {name:'Ooh', draw:function(ctx,mx,my){
        ctx.fillStyle='#111';
        ctx.beginPath();ctx.ellipse(mx,my,9,12,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#555';
        ctx.beginPath();ctx.ellipse(mx,my,5,7,0,0,Math.PI*2);ctx.fill();
    }},
    {name:'Tongue', draw:function(ctx,mx,my){
        ctx.fillStyle='#111';ctx.beginPath();ctx.arc(mx,my-4,16,0.05*Math.PI,0.95*Math.PI);ctx.fill();
        ctx.fillStyle='#e91e63';ctx.beginPath();ctx.ellipse(mx,my+8,9,10,0,0,Math.PI);ctx.fill();
    }},
    {name:'Smirk', draw:function(ctx,mx,my){
        ctx.strokeStyle='#111';ctx.lineWidth=3.5;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(mx-10,my+2);ctx.quadraticCurveTo(mx+4,my-2,mx+14,my-6);ctx.stroke();
    }},
    {name:'Teeth', draw:function(ctx,mx,my){
        ctx.fillStyle='#111';
        ctx.beginPath();ctx.arc(mx,my-4,16,0.08*Math.PI,0.92*Math.PI);ctx.fill();
        ctx.fillStyle='#fff';
        for(var t=0;t<4;t++){ctx.fillRect(mx-13+t*7,my-8,6,7);}
    }},
    {name:'Waa', draw:function(ctx,mx,my){
        ctx.fillStyle='#111';
        ctx.beginPath();ctx.arc(mx,my,20,0.1*Math.PI,0.9*Math.PI);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.7)';
        ctx.beginPath();ctx.arc(mx,my+8,8,Math.PI,0);ctx.fill();
    }},
    {name:'Cat', draw:function(ctx,mx,my){
        ctx.strokeStyle='#111';ctx.lineWidth=3;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(mx-10,my);ctx.lineTo(mx,my-6);ctx.lineTo(mx+10,my);ctx.stroke();
        /* whiskers */
        ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=1.5;
        [[-18,-3],[-18,3],[18,-3],[18,3]].forEach(function(p){
            ctx.beginPath();ctx.moveTo(mx+p[0]*0.2,my+p[1]);ctx.lineTo(mx+p[0],my+p[1]);ctx.stroke();
        });
    }},
    {name:'Zip', draw:function(ctx,mx,my){
        ctx.strokeStyle='#111';ctx.lineWidth=3;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(mx-14,my);ctx.lineTo(mx+14,my);ctx.stroke();
        for(var z=0;z<4;z++){
            ctx.beginPath();ctx.moveTo(mx-14+z*9,my);ctx.lineTo(mx-10+z*9,my-5);ctx.stroke();
            ctx.beginPath();ctx.moveTo(mx-10+z*9,my-5);ctx.lineTo(mx-6+z*9,my);ctx.stroke();
        }
    }}
];

/* Draw full Skribbl.io character: big circle head + semicircle body */
function _drawSkribblStripes(ctx,cx,cy,r){
    ctx.save();
    ctx.clip();
    ctx.strokeStyle='rgba(255,255,255,0.22)';
    ctx.lineWidth=44;
    ctx.lineCap='butt';
    var len=r*2.4;
    for(var s=-len;s<len;s+=62){
        ctx.beginPath();
        ctx.moveTo(cx+s-len,cy-len);
        ctx.lineTo(cx+s+len,cy+len);
        ctx.stroke();
    }
    ctx.restore();
}

function drawAvatarCanvas(){
    var canvas=document.getElementById('avatar-canvas');
    if(!canvas)return;
    var ctx=canvas.getContext('2d');
    var W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);

    /* BG */
    ctx.fillStyle='#111318';
    ctx.fillRect(0,0,W,H);

    var body=avatarBodies[avatarConfig.body||0];
    var cx=W/2;
    var headR=W*0.335;        /* ~54px on 160 canvas */
    var headY=H*0.42;
    var bodyBW=headR*0.92;    /* body width */
    var bodyBH=headR*0.48;    /* body height */
    var bodyBY=headY+headR*0.82; /* body center */

    /* ── DROP SHADOW ── */
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,0.45)';
    ctx.shadowBlur=18;
    ctx.shadowOffsetY=7;
    ctx.beginPath();
    ctx.arc(cx,headY,headR,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.01)';
    ctx.fill();
    ctx.restore();

    /* ── BODY (semicircle below head) ── */
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx,bodyBY,bodyBW,bodyBH,0,0,Math.PI);
    ctx.fillStyle=body.base;
    ctx.fill();
    _drawSkribblStripes(ctx,cx,bodyBY,bodyBW);
    ctx.beginPath();
    ctx.ellipse(cx,bodyBY,bodyBW,bodyBH,0,0,Math.PI);
    ctx.strokeStyle='rgba(0,0,0,0.28)';
    ctx.lineWidth=2.5;
    ctx.stroke();
    ctx.restore();

    /* ── HEAD (full circle) ── */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx,headY,headR,0,Math.PI*2);
    ctx.fillStyle=body.base;
    ctx.fill();
    _drawSkribblStripes(ctx,cx,headY,headR);
    /* subtle shading */
    ctx.beginPath();
    ctx.arc(cx,headY,headR,0,Math.PI*2);
    ctx.clip();
    var shade=ctx.createRadialGradient(cx-headR*0.25,headY-headR*0.3,0,cx,headY,headR);
    shade.addColorStop(0,'rgba(255,255,255,0.14)');
    shade.addColorStop(1,'rgba(0,0,0,0.12)');
    ctx.fillStyle=shade;
    ctx.fillRect(cx-headR,headY-headR,headR*2,headR*2);
    ctx.restore();

    /* Head outline */
    ctx.beginPath();
    ctx.arc(cx,headY,headR,0,Math.PI*2);
    ctx.strokeStyle='rgba(0,0,0,0.28)';
    ctx.lineWidth=2.5;
    ctx.stroke();

    /* ── EYES ── */
    var eyeY=headY-headR*0.14;
    ctx.save();
    avatarEyes[avatarConfig.eyes||0].draw(ctx,cx,eyeY);
    ctx.restore();

    /* ── MOUTH ── */
    var mouthY=headY+headR*0.34;
    ctx.save();
    avatarMouths[avatarConfig.mouth||0].draw(ctx,cx,mouthY);
    ctx.restore();

    try{
        playerProfile._avatarDataUrl=canvas.toDataURL();
        _updateAvatarFrames();
    }catch(e){}
}

function _updateAvatarFrames(){
    var url=playerProfile._avatarDataUrl;
    if(!url)return;
    var f=document.getElementById('cc-avatar-frame');
    if(f){f.style.backgroundImage="url('"+url+"')";f.innerHTML='';}
    var m=document.getElementById('header-mini-avatar');
    if(m){m.style.backgroundImage="url('"+url+"')";m.style.display='block';}
}

function cycleAvatar(type,dir){
    var maps={body:avatarBodies,eyes:avatarEyes,mouth:avatarMouths};
    var arr=maps[type];if(!arr)return;
    avatarConfig[type]=((avatarConfig[type]||0)+dir+arr.length)%arr.length;
    drawAvatarCanvas();
}

function initAvatarCanvas(){
    if(playerProfile._avatarConfig)avatarConfig=Object.assign({body:0,eyes:0,mouth:0},playerProfile._avatarConfig);
    drawAvatarCanvas();
}

/* ===== REVIEW ADMIN PANEL (Shift+Ctrl+R) ===== */
function openReviewAdmin(){
    var pending=[];
    try{pending=JSON.parse(localStorage.getItem('cards_pending_reviews')||'[]');}catch(e){}

    var ov=document.getElementById('review-admin-ov');
    if(!ov){
        ov=document.createElement('div');
        ov.id='review-admin-ov';
        ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:99999;overflow-y:auto;padding:30px;display:flex;flex-direction:column;gap:16px;align-items:center;';
        document.body.appendChild(ov);
    }
    ov.innerHTML='';

    var header=document.createElement('div');
    header.style.cssText='display:flex;justify-content:space-between;align-items:center;width:100%;max-width:700px;';
    header.innerHTML='<h2 style="color:var(--brand-gold);margin:0;letter-spacing:3px;">REVIEW ADMIN ('+pending.length+' pending)</h2><button onclick="document.getElementById(\'review-admin-ov\').remove()" style="background:transparent;border:1px solid #555;color:#888;padding:8px 16px;cursor:pointer;border-radius:6px;">CLOSE</button>';
    ov.appendChild(header);

    if(!pending.length){
        var empty=document.createElement('div');
        empty.style.cssText='color:#666;font-size:1.1rem;margin:40px 0;';
        empty.innerText='No pending reviews.';
        ov.appendChild(empty);
        return;
    }

    pending.forEach(function(r,idx){
        var card=document.createElement('div');
        card.style.cssText='width:100%;max-width:700px;background:#1a1a22;border:1px solid #333;border-radius:12px;padding:20px;';
        card.innerHTML=
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">'+
                '<div>'+
                    '<div style="font-weight:900;color:#fff;font-size:1rem;">'+r.user+'</div>'+
                    '<div style="color:var(--brand-gold);font-size:0.85rem;">'+r.stars+'</div>'+
                '</div>'+
                '<div style="font-size:0.72rem;color:#555;">'+new Date(r.ts).toLocaleDateString()+'</div>'+
            '</div>'+
            '<div style="color:#ccc;font-style:italic;margin-bottom:16px;">"'+r.text+'"</div>'+
            '<div style="display:flex;gap:10px;">'+
                '<button onclick="approveReview('+idx+')" style="background:#27ae60;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-weight:900;cursor:pointer;">APPROVE</button>'+
                '<button onclick="rejectReview('+idx+')" style="background:#e74c3c;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-weight:900;cursor:pointer;">REJECT</button>'+
            '</div>';
        ov.appendChild(card);
    });
}

function approveReview(idx){
    var pending=[];
    var approved=[];
    try{pending=JSON.parse(localStorage.getItem('cards_pending_reviews')||'[]');}catch(e){}
    try{approved=JSON.parse(localStorage.getItem('cards_approved_reviews')||'[]');}catch(e){}
    var r=pending.splice(idx,1)[0];
    if(r)approved.push(r);
    try{
        localStorage.setItem('cards_pending_reviews',JSON.stringify(pending));
        localStorage.setItem('cards_approved_reviews',JSON.stringify(approved));
    }catch(e){}
    renderReviews();
    openReviewAdmin();
    showShopToast('Review approved!','success');
}

function rejectReview(idx){
    var pending=[];
    try{pending=JSON.parse(localStorage.getItem('cards_pending_reviews')||'[]');}catch(e){}
    pending.splice(idx,1);
    try{localStorage.setItem('cards_pending_reviews',JSON.stringify(pending));}catch(e){}
    openReviewAdmin();
    showShopToast('Review rejected','info');
}