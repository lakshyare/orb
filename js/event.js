/* ===== EVENT.JS ===== */

/* ─── COUNTDOWN ─── */
function startEventCountdown() {
    var startDate = new Date('2026-04-01T00:00:00');
    var endDate   = new Date('2026-06-01T23:59:59');

    function pad(n) { return String(n).padStart(2, '0'); }

    function tick() {
        var now = new Date();
        var target, phase;

if (now < startDate) {
    target = startDate;
    phase  = 'STARTS IN';
} else if (now < endDate) {
    target = endDate;

    var daysLeft = Math.floor((endDate - now) / 86400000);

    if (daysLeft <= 0) {
        phase = '⚠ FINAL HOURS';
    }
    else if (daysLeft <= 1) {
        phase = '🔥 LAST DAY';
    }
    else if (daysLeft <= 3) {
        phase = '🔥 LAST DAYS';
    }
    else {
        phase = 'ENDS IN';
    }
} else {
    var ph = document.getElementById('h2-cd-phase');
    var cd = document.getElementById('h2-countdown');
    if (ph) ph.innerText = 'EVENT HAS ENDED';
    if (cd) cd.style.display = 'none';
    return;
}

        var diff  = target - now;
        var days  = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var mins  = Math.floor((diff % 3600000)  / 60000);
        var secs  = Math.floor((diff % 60000)    / 1000);

        var el;
        el = document.getElementById('h2-cd-days');  if (el) el.innerText = pad(days);
        el = document.getElementById('h2-cd-hours'); if (el) el.innerText = pad(hours);
        el = document.getElementById('h2-cd-mins');  if (el) el.innerText = pad(mins);
        el = document.getElementById('h2-cd-secs');  if (el) el.innerText = pad(secs);
        el = document.getElementById('h2-cd-phase'); if (el) el.innerText = phase;
    }

    tick();
    setInterval(tick, 1000);
}

/* ─── EVENT MODAL ─── */
function openEventModal() {
    var ov = document.getElementById('event-modal-overlay');
    if (!ov) return;
    ov.style.display = 'flex';
    setTimeout(function(){ if(typeof initEvSlider==='function') initEvSlider(); }, 60);
}

function closeEventModal() {
    var ov = document.getElementById('event-modal-overlay');
    if (ov) ov.style.display = 'none';
}

function evScrollTo(section) {
    var body   = document.getElementById('ev-modal-body');
    var target = document.getElementById('ev-sec-' + section);
    if (!body || !target) return;
    body.scrollTo({ top: target.offsetTop - 16, behavior: 'smooth' });
}

function initEvSlider() {
    var body = document.getElementById('ev-modal-body');
    var nav  = document.getElementById('ev-nav');
    if (!body || !nav) return;

    var btns  = Array.prototype.slice.call(nav.querySelectorAll('.ev-nav-btn'));
    var thumb = document.getElementById('ev-nav-thumb');

    function updateThumb(btn) {
        if (!thumb || !btn) return;
        thumb.style.width = btn.offsetWidth + 'px';
        thumb.style.left  = btn.offsetLeft  + 'px';
    }

    function syncNav() {
        if(body._manualScrolling) return;
        var sections  = Array.prototype.slice.call(body.querySelectorAll('.ev-section'));
        var scrollTop = body.scrollTop;
        var activeIdx = 0;

        sections.forEach(function(sec, i) {
            if (sec.offsetTop - 50 <= scrollTop) activeIdx = i;
        });

        btns.forEach(function(b, i) { b.classList.toggle('active', i === activeIdx); });
        updateThumb(btns[activeIdx]);
    }

    if (!body._evBound) {
        body._evBound = true;
        body.addEventListener('scroll', syncNav);
    }

    btns.forEach(function(btn, i) {
        if (btn._evClickBound) return;
        btn._evClickBound = true;
        btn.addEventListener('click', function() {
            setTimeout(function() { updateThumb(btns[i]); }, 350);
        });
    });

    if (!nav._evResizeBound) {
        nav._evResizeBound = true;
        window.addEventListener('resize', function() {
            var active = nav.querySelector('.ev-nav-btn.active');
            updateThumb(active || btns[0]);
        });
    }

    body.scrollTop = 0;
    btns.forEach(function(b){ b.classList.remove('active'); });
    if (btns[0]) btns[0].classList.add('active');
    updateThumb(btns[0]);
}

/* ─── HIW SLIDER ─── */
function hiwScrollTo(section) {
    var body   = document.getElementById('hiw-modal-body');
    var target = document.getElementById('hiw-sec-' + section);

    if (!body || !target) return;

    body._manualScrolling = true;

    var scrollTop = Math.max(0, target.offsetTop - 32);

    body.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
    });

    var btns = document.querySelectorAll('.hiw-snav-btn');

    btns.forEach(function(btn){
        var txt = (btn.textContent || '').toLowerCase();

        var active =
            section === 'collect'
            ? txt.indexOf('collect') > -1
            : txt.indexOf(section) > -1;

        btn.classList.toggle('active', active);
    });

    setTimeout(function(){
        body._manualScrolling = false;
    }, 450);
}
function initHIWSlider() {
    var body = document.getElementById('hiw-modal-body');
    var nav  = document.getElementById('hiw-slider-nav');
    if (!body || !nav) return;

    var btns  = Array.prototype.slice.call(nav.querySelectorAll('.hiw-snav-btn'));
    var thumb = document.getElementById('hiw-snav-thumb');

    function updateThumb(btn) {
        if (!thumb || !btn) return;
        thumb.style.width = btn.offsetWidth + 'px';
        thumb.style.left  = btn.offsetLeft  + 'px';
    }

    function syncNav() {
        var sections  = Array.prototype.slice.call(body.querySelectorAll('.hiw-scroll-section'));
        var scrollTop = body.scrollTop;
        var activeIdx = 0;

        sections.forEach(function(sec, i) {
            if (sec.offsetTop - 50 <= scrollTop) activeIdx = i;
        });

        btns.forEach(function(b, i) { b.classList.toggle('active', i === activeIdx); });
        updateThumb(btns[activeIdx]);
    }

    if (!body._hiwBound) {
        body._hiwBound = true;
        body.addEventListener('scroll', syncNav);
    }

    btns.forEach(function(btn, i) {
        if (btn._hiwClickBound) return;
        btn._hiwClickBound = true;
        btn.addEventListener('click', function() {
            setTimeout(function() { updateThumb(btns[i]); }, 350);
        });
    });

    if (!nav._hiwResizeBound) {
        nav._hiwResizeBound = true;
        window.addEventListener('resize', function() {
            var active = nav.querySelector('.hiw-snav-btn.active');
            updateThumb(active || btns[0]);
        });
    }

    body.style.overscrollBehavior='contain';
    body.scrollTop = 0;
    btns.forEach(function(b){ b.classList.remove('active'); });
    if (btns[0]) btns[0].classList.add('active');
    updateThumb(btns[0]);
}

/* ─── BOOT ─── */
document.addEventListener('DOMContentLoaded', function() {
    startEventCountdown();
});
