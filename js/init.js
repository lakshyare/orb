/* ===== INIT.JS ===== */
function scrollToHero(){
    navTo('home',document.querySelector('.nav-btn'));
    setTimeout(function(){
        var section=document.getElementById('home');
        if(section)section.scrollTo({top:0,behavior:'smooth'});
    },50);
}

var validPages=['home','gallery','shop','news','game'];

function navTo(pid,btn){
    if(packBuffer.length>0){
        packBuffer=[];packPendingCards=[];
        document.getElementById('pack-area').innerHTML='';
    }
    document.querySelectorAll('.page-section').forEach(function(p){p.classList.remove('active-section');});
    document.getElementById(pid).classList.add('active-section');
    document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active');});
    if(btn)btn.classList.add('active');
    if(pid==='gallery'){renderGallery();updateObjectiveProgress('visit_gallery',1);}
    if(pid==='game'){renderRacks();applyArenaTheme();}
    if(pid==='shop')renderShop();
    if(pid==='news'&&typeof renderNewsHub==='function')renderNewsHub();
    closeMobileNav();
    /* Fix 5: Hash routing */
    if(location.hash!=='#'+pid){
        history.replaceState(null,'',('#'+pid));
    }
}

function handleHash(){
    var hash=(location.hash||'').replace('#','');
    if(validPages.indexOf(hash)===-1) hash='home';
    var navBtns=document.querySelectorAll('.nav-btn:not(.play-btn)');
    var btn=null;
    navBtns.forEach(function(b){
        if(b.textContent.trim().toLowerCase()===hash) btn=b;
    });
    if(hash==='game') btn=document.querySelector('.play-btn');
    navTo(hash,btn);
}


/* Hamburger */
function toggleMobileNav(){
    var n=document.getElementById('nav-buttons');
    if(!n)return;
    n.classList.toggle('mobile-open');
}
function closeMobileNav(){
    var n=document.getElementById('nav-buttons');
    if(n)n.classList.remove('mobile-open');
}

/* Mobile deck drawer */
var mobileDrawerTab='deck';
function openMobileDrawer(){document.getElementById('mobile-deck-drawer').classList.add('open');renderMobileDrawer();}
function closeMobileDrawer(){document.getElementById('mobile-deck-drawer').classList.remove('open');}
function switchDrawerTab(tab,btn){mobileDrawerTab=tab;document.querySelectorAll('.mdt').forEach(function(b){b.classList.remove('active');});if(btn)btn.classList.add('active');renderMobileDrawer();}
function renderMobileDrawer(){
    var g=document.getElementById('mobile-drawer-grid');
    g.innerHTML='';
    var ids=mobileDrawerTab==='deck'?myDeck:[...new Set(myInventory)].filter(function(id){return!myDeck.includes(id);});
    ids.forEach(function(id){
        var c=allCards.find(function(x){return x.id===id;});if(!c)return;
        var d=document.createElement('div');
        d.className='mobile-drawer-card '+c.rarity;
        d.style.backgroundImage="url('"+c.img+"')";
        d.onclick=function(e){closeMobileDrawer();inspectCard(c,'mdc-'+id,e);};
        d.id='mdc-'+id;
        g.appendChild(d);
    });
}

/* Museum mode */
var museumActive=false;
function toggleMuseum(){
    if(!document.getElementById('gallery').classList.contains('active-section'))return;
    museumActive=!museumActive;
    document.getElementById('gallery-grid-container').style.display=museumActive?'none':'flex';
    document.getElementById('museum-wall').style.display=museumActive?'flex':'none';
    document.getElementById('museum-hint').style.display='none';
    if(museumActive)renderMuseum();
}

/* ===== HIW scroll observer ===== */
function initHIWScrollObserver(){
    var homeSection=document.getElementById('home');
    if(!homeSection)return;
    var cards=document.querySelectorAll('.hiw-step-card');
    if(!cards.length)return;

    function checkVisible(){
        cards.forEach(function(card){
            if(card.classList.contains('hiw-visible'))return;
            var rect=card.getBoundingClientRect();
            if(rect.top<window.innerHeight*0.88){
                var delay=parseInt(card.getAttribute('data-delay')||0);
                setTimeout(function(){card.classList.add('hiw-visible');},delay);
            }
        });
    }
    homeSection.addEventListener('scroll',checkVisible);
    window.addEventListener('resize',checkVisible);
    setTimeout(checkVisible,300);
}

/* ===== RACK CARD CLICK → INSPECT ===== */
function initRackInspection(){
    ['plank-left','plank-right'].forEach(function(plankId){
        var plank=document.getElementById(plankId);
        if(!plank||plank._rackInspect)return;
        plank._rackInspect=true;
        plank.addEventListener('click',function(e){
            var rc=e.target.closest('.rack-card-container');
            if(!rc)return;
            var cardId=parseInt(rc.getAttribute('data-card-id'));
            if(!cardId)return;
            var card=allCards.find(function(c){return c.id===cardId;});
            if(!card)return;
            var front=rc.querySelector('.card-front');
            if(!front)return;
            var elId='rack-'+cardId+'-'+Date.now();
            front.id=elId;
            inspectCard(card,elId,e);
        });
    });
}

/* Close mobile nav when tapping outside */
function initOutsideTapCloseNav(){
    if(document._outsideNavBound)return;
    document._outsideNavBound=true;
    document.addEventListener('click',function(e){
        if(window.innerWidth>760)return;
        var nav=document.getElementById('nav-buttons');
        var hb=document.getElementById('hamburger');
        if(!nav||!hb||!nav.classList.contains('mobile-open'))return;
        if(nav.contains(e.target)||hb.contains(e.target))return;
        closeMobileNav();
    });
}

/* ===== HERO ROTATOR ===== */
var heroRotatorTimer=null;
var heroRotatorIndex=0;

function initHeroRotator(){
    var rotator=document.getElementById('hero-rotator');
    if(!rotator)return;

    var slides=Array.prototype.slice.call(rotator.querySelectorAll('.hero-slide'));
    if(!slides.length)return;

    if(heroRotatorTimer){
        clearInterval(heroRotatorTimer);
        heroRotatorTimer=null;
    }

    heroRotatorIndex=0;
    updateHeroRotatorUI(slides);

    heroRotatorTimer=setInterval(function(){
        nextHeroSlide();
    },7000);
}

function updateHeroRotatorUI(slides) {
    if(!slides) {
        var rotator=document.getElementById('hero-rotator');
        if(!rotator)return;
        slides=Array.prototype.slice.call(rotator.querySelectorAll('.hero-slide'));
    }
    slides.forEach(function(s,i){ s.classList.toggle('active',i===heroRotatorIndex); });
    
    // Update dots
    var dots = document.querySelectorAll('.hero-dot');
    dots.forEach(function(d,i){ d.classList.toggle('active',i===heroRotatorIndex); });
}

function nextHeroSlide() {
    var rotator=document.getElementById('hero-rotator');
    if(!rotator)return;
    var slides=Array.prototype.slice.call(rotator.querySelectorAll('.hero-slide'));
    heroRotatorIndex = (heroRotatorIndex + 1) % slides.length;
    updateHeroRotatorUI(slides);
    resetHeroTimer();
}

function prevHeroSlide() {
    var rotator=document.getElementById('hero-rotator');
    if(!rotator)return;
    var slides=Array.prototype.slice.call(rotator.querySelectorAll('.hero-slide'));
    heroRotatorIndex = (heroRotatorIndex - 1 + slides.length) % slides.length;
    updateHeroRotatorUI(slides);
    resetHeroTimer();
}

function goToHeroSlide(index) {
    heroRotatorIndex = index;
    updateHeroRotatorUI();
    resetHeroTimer();
}

function resetHeroTimer() {
    if(heroRotatorTimer) clearInterval(heroRotatorTimer);
    heroRotatorTimer=setInterval(function(){
        nextHeroSlide();
    },7000);
}

/* Keyboard */
document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
    var key=e.key.toLowerCase();

    if(key==='escape'){
        closeInspection();
        closeProfile();
        closeSettings();
        closeDailyReward();
        closeFilterOverlay();
        closeMobileDrawer();
        closeMobileNav();
        closeHIWOverlay();
        closeEventModal();
        document.getElementById('welcome-back-overlay').style.display='none';
    }
    if(key==='m'&&e.shiftKey){e.preventDefault();toggleMuseum();return;}

    if(battleState.active&&!battleState.resolving){
        if(key===' '||e.code==='Space'){
            e.preventDefault();
            if(battleState.phase==='draw')drawCard();
            return;
        }
        if(key>='1'&&key<='5'){
            var idx=parseInt(key)-1;
            if(battleState.phase==='play'&&idx<battleState.userHand.length)playHandCard(idx);
            return;
        }
        if(key==='a'&&battleState.phase==='stat'&&battleState.playerChoosesStat){resolveRound('dmg');return;}
        if(key==='d'&&battleState.phase==='stat'&&battleState.playerChoosesStat){resolveRound('hp');return;}
    }
});

/* Boot */
(function boot(){
    loadState();

    try{
        var t=localStorage.getItem('cards_theme');
        if(!t){
            setTheme('dark');
            localStorage.setItem('cards_theme','dark');
        }else{
            setTheme(t);
        }
    }catch(e){
        setTheme('dark');
    }

    try{
        var s=localStorage.getItem('cards_sound');
        if(s==='false'){
            soundEnabled=false;
            document.getElementById('sound-on').classList.remove('active');
            document.getElementById('sound-off').classList.add('active');
        }
    }catch(e){}

    initParticleCanvas();
    initIdleCanvas();

    /* Load cards from JSON, then run all card-dependent init */
    loadCards().then(function(){
        ensureObjectiveReset();
        updateLoginVisitStreak();
        document.getElementById('coin-display').innerText=coins;

        renderReviews();
        initCCTilt();
        renderRacks();
        renderGallery();
        renderHomeProgress();
        updateHeaderProfile();
        updateDailyBtn();
        checkAchievements();
        initTilt();
        initHomeTouchHover();
        checkWelcomeBack();
        updateHeroFightBtn();
        initHIWScrollObserver();
        initRackInspection();
        initOutsideTapCloseNav();
        initHeroRotator();
        applyArenaTheme();
        initDeckPresets();
        loadPerformanceMode();
        loadHighContrast();
        loadHeaderFrost();
        initExtendedKeyboard();
        if(typeof initDeckPresetToggle==='function')initDeckPresetToggle();
        if(typeof startIntroTutorial==='function')startIntroTutorial(false);

        checkWhatsNew();

        /* Fix 5: Apply hash routing after boot */
        if(location.hash && location.hash!=='#home'){
            handleHash();
        }
        window.addEventListener('hashchange', handleHash);

        /* Cheat code: Shift+Ctrl+M adds 500 gold for testing */
        document.addEventListener('keydown',function(e){
            if(e.shiftKey && e.ctrlKey && (e.key==='m'||e.key==='M')){
                e.preventDefault();
                addCoins(500);
                saveFullState();
                createExplosion(window.innerWidth/2,window.innerHeight/2,'rainbow');
                showShopToast('+500 Gold!','success');
                updateShopGoldDisplay();
            }
            if(e.shiftKey && e.ctrlKey && (e.key==='r'||e.key==='R')){
            e.preventDefault();
            openReviewAdmin();
        }
        });
    });
})();
