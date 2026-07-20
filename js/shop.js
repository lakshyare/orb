/* ===== SHOP.JS ===== */

var shopSleeves=[
    {id:'obsidian',name:'Obsidian Sleeve',price:80,desc:'Stealth black finish with sharp gold edges',cssClass:'sleeve-obsidian'},
    {id:'inferno',name:'Inferno Sleeve',price:140,desc:'Molten red-orange pulse effect',cssClass:'sleeve-inferno'},
    {id:'phantom',name:'Phantom Sleeve',price:180,desc:'Nebula haze with spectral glow',cssClass:'sleeve-phantom'},
    {id:'royal',name:'Royal Gold Sleeve',price:240,desc:'Polished elite gold shimmer',cssClass:'sleeve-royal'},
    {id:'holo',name:'Holographic Sleeve',price:320,desc:'Full-spectrum prismatic shift',cssClass:'sleeve-holo'}
];

var shopArenas=[
    {id:'classic',name:'Classic Oak Arena',price:0,desc:'The original CARDs battleground',previewClass:'arena-prev-classic'},
    {id:'stone',name:'Obsidian Forge Arena',price:1200,desc:'Volcanic stone and ember glow',previewClass:'arena-prev-stone'},
    {id:'frozen',name:'Ice Tundra Arena',price:2000,desc:'Frozen field with blue crystal cuts',previewClass:'arena-prev-frozen'}
];

var shopConfirmContext=null;

function showShopToast(msg,type){
    var c=document.getElementById('shop-toast');
    if(!c){c=document.createElement('div');c.id='shop-toast';document.body.appendChild(c);}
    c.className='shop-toast shop-toast-'+(type||'success')+' show';
    c.innerText=msg;
    setTimeout(function(){c.classList.remove('show');},2200);
}

function updateShopGoldDisplay(){
    var el=document.getElementById('shop-gold-display');
    if(el)el.innerText=coins;
}

function finalizeShopState(msg){
    saveFullState();
    renderShop();
    renderRacks();
    renderGallery();
    updateHeaderProfile();
    checkAchievements();
    showShopToast(msg,'success');
}

function openShopPreview(kind,itemId){
    var item=(kind==='sleeve'?shopSleeves:shopArenas).find(function(x){return x.id===itemId;});
    if(!item)return;

    var ov=document.getElementById('shop-preview-overlay');
    var title=document.getElementById('shop-preview-title');
    var desc=document.getElementById('shop-preview-desc');
    var art=document.getElementById('shop-preview-art');
    if(!ov||!title||!desc||!art)return;

    title.innerText=item.name;
    desc.innerText=item.desc;
    art.className='shop-preview-art '+(kind==='sleeve'?(item.cssClass||''):(item.previewClass||''));
    ov.style.display='flex';
}

function closeShopPreview(){
    var ov=document.getElementById('shop-preview-overlay');
    if(ov)ov.style.display='none';
}

function openShopConfirm(item,opt){
    var ov=document.getElementById('shop-confirm-overlay');
    var title=document.getElementById('shop-confirm-title');
    var sub=document.getElementById('shop-confirm-sub');
    var qtyWrap=document.getElementById('shop-confirm-qty-wrap');
    var qtyInput=document.getElementById('shop-confirm-qty');
    var buyBtn=document.getElementById('shop-confirm-buy-btn');
    var buyMoreBtn=document.getElementById('shop-confirm-buy-more-btn');
    if(!ov||!title||!sub||!buyBtn||!buyMoreBtn)return;

    var isSleeve=!!(opt&&opt.allowCustomQty);
    title.innerText=item.name;
    sub.innerHTML='Buy <strong>1x</strong> for <strong>'+item.price+'g</strong>';

    if(qtyWrap&&qtyInput){
        qtyWrap.style.display=isSleeve?'block':'none';
        qtyInput.value='1';
        qtyInput.min='1';
        qtyInput.oninput=function(){
            var q=Math.max(1,parseInt(qtyInput.value||'1')||1);
            qtyInput.value=String(q);
            sub.innerHTML='Buy <strong>'+q+'x</strong> for <strong>'+(q*item.price)+'g</strong>';
        };
    }

    buyBtn.innerText='CONFIRM';
    buyMoreBtn.style.display=isSleeve?'inline-flex':'none';
    buyMoreBtn.innerText='BUY MORE';

    shopConfirmContext={item:item,opt:opt};

    buyBtn.onclick=function(){
        var qty=1;
        if(isSleeve&&qtyInput){
            qty=Math.max(1,parseInt(qtyInput.value||'1')||1);
        }
        if(opt&&typeof opt.onConfirm==='function')opt.onConfirm(qty);
    };

    buyMoreBtn.onclick=function(){
        if(!qtyInput)return;
        qtyInput.value=String(Math.max(1,(parseInt(qtyInput.value||'1')||1)+1));
        var q=parseInt(qtyInput.value||'1')||1;
        sub.innerHTML='Buy <strong>'+q+'x</strong> for <strong>'+(q*item.price)+'g</strong>';
    };

    ov.style.display='flex';
}

function closeShopConfirm(){
    var ov=document.getElementById('shop-confirm-overlay');
    if(ov)ov.style.display='none';
    shopConfirmContext=null;
}

function buySleeve(itemId){
    var item=shopSleeves.find(function(x){return x.id===itemId;});
    if(!item)return;

    openShopConfirm(item,{
        allowCustomQty:true,
        onConfirm:function(qty){
            var total=item.price*qty;
            if(coins<total){showShopToast('Not enough gold!','error');return;}
            spendCoins(total);
            shopState.ownedSleeves[item.id]=(shopState.ownedSleeves[item.id]||0)+qty;
            createExplosion(window.innerWidth/2,window.innerHeight/2,'accent');
            closeShopConfirm();
            finalizeShopState('Bought '+qty+'x '+item.name);
        }
    });
}

function buyArena(itemId){
    var item=shopArenas.find(function(x){return x.id===itemId;});
    if(!item)return;
    if(shopState.ownedArenas.indexOf(item.id)>-1){showShopToast('Already owned!','error');return;}

    openShopConfirm(item,{
        allowCustomQty:false,
        onConfirm:function(){
            if(coins<item.price){showShopToast('Not enough gold!','error');return;}
            spendCoins(item.price);
            shopState.ownedArenas.push(item.id);
            createExplosion(window.innerWidth/2,window.innerHeight/2,'rainbow');
            closeShopConfirm();
            finalizeShopState(item.name+' unlocked');
        }
    });
}

function equipArena(itemId){
    if(shopState.ownedArenas.indexOf(itemId)===-1)return;
    shopState.equippedArena=itemId;
    saveFullState();
    applyArenaTheme();
    renderShop();
    showShopToast('Arena equipped','success');
}

function applyArenaTheme(){
    var bc=document.getElementById('board-center');
    if(!bc)return;
    ['arena-stone','arena-velvet','arena-frozen','arena-dragon'].forEach(function(c){bc.classList.remove(c);});
    if(shopState.equippedArena!=='classic')bc.classList.add('arena-'+shopState.equippedArena);

    var pl=document.getElementById('plank-left');
    var pr=document.getElementById('plank-right');
    [pl,pr].forEach(function(el){
        if(!el)return;
        ['rack-stone','rack-velvet','rack-frozen','rack-dragon'].forEach(function(c){el.classList.remove(c);});
        if(shopState.equippedArena!=='classic')el.classList.add('rack-'+shopState.equippedArena);
    });
}

function renderShopHeaderCard(grid,title,sub){
    var h=document.createElement('div');
    h.className='shop-section-head shop-v3-section';
    h.innerHTML='<h2>'+title+'</h2><p>'+sub+'</p>';
    grid.appendChild(h);
}

function createInfoButton(kind,id){
    return '<button class="shop-info-btn" onclick="openShopPreview(\''+kind+'\',\''+id+'\');event.stopPropagation();">i</button>';
}

function createSleeveItemCard(item,owned){
    var el=document.createElement('div');
    el.className='shop-v3-item';
    el.innerHTML=
        '<div class="shop-v3-preview"><div class="siv2-swatch '+item.cssClass+'"></div></div>'+
        '<div class="shop-v3-body">'+
            '<div class="shop-v3-name">'+item.name+' '+createInfoButton('sleeve',item.id)+'</div>'+
            '<div class="shop-v3-desc">'+item.desc+'</div>'+
            '<div class="shop-v3-meta">Owned: '+owned+'</div>'+
        '</div>'+
        '<button class="shop-v3-buy" onclick="buySleeve(\''+item.id+'\')">BUY</button>';
    return el;
}

function createArenaItemCard(item,owned,equipped){
    var el=document.createElement('div');
    el.className='shop-v3-item'+(equipped?' active':'');
    var action='';

    if(equipped)action='<div class="shop-v3-badge">EQUIPPED</div>';
    else if(owned)action='<button class="shop-v3-buy equip" onclick="equipArena(\''+item.id+'\')">EQUIP</button>';
    else if(item.price===0)action='<div class="shop-v3-badge">DEFAULT</div>';
    else action='<button class="shop-v3-buy" onclick="buyArena(\''+item.id+'\')">BUY</button>';

    el.innerHTML=
        '<div class="shop-v3-preview"><div class="siv2-swatch '+item.previewClass+'"></div></div>'+
        '<div class="shop-v3-body">'+
            '<div class="shop-v3-name">'+item.name+' '+createInfoButton('arena',item.id)+'</div>'+
            '<div class="shop-v3-desc">'+item.desc+'</div>'+
            '<div class="shop-v3-meta">'+(owned?'Owned':'Price: '+item.price+'g')+'</div>'+
        '</div>'+
        action;
    return el;
}

function renderShop(){
    var grid=document.getElementById('shop-grid');
    if(!grid)return;
    grid.innerHTML='';
    updateShopGoldDisplay();

    renderShopHeaderCard(grid,'Card Sleeves','Use i to preview, then buy any amount');
    shopSleeves.forEach(function(item){
        var owned=shopState.ownedSleeves[item.id]||0;
        grid.appendChild(createSleeveItemCard(item,owned));
    });

    renderShopHeaderCard(grid,'Battle Arenas','Visual map themes for your arena');
    shopArenas.forEach(function(item){
        var owned=shopState.ownedArenas.indexOf(item.id)>-1;
        var equipped=shopState.equippedArena===item.id;
        grid.appendChild(createArenaItemCard(item,owned,equipped));
    });
}
/* ===== FAKE SHOP BUTTON ===== */

var fakeShopClicks = 0;

var fakeShopMessages = [
    "Access Denied.",
    "Nice try.",
    "Still unavailable.",
    "The merchant is sleeping.",
    "Please stop clicking.",
    "...",
    "Seriously?",
    "You know this won't work, right?",
    "The goblins misplaced the inventory.",
    "Loading shop...",
    "Loading shop... 1%",
    "Loading shop... 0%",
    "Market.exe not found.",
    "You're still here?",
    "This is becoming concerning.",
    "Fine.",
    "Maybe one more click.",
    "No.",
    "Definitely no.",
    "Absolutely not.",
    "Stop farming dialogue.",
    "The shop is hiding.",
    "The merchant went fishing.",
    "Achievement nearby...",
    "🏆 Achievement Unlocked<br>Persistent Customer<br>+100 Gold",
    "Just kidding.",
    "You really thought that was real?",
    "Okay NOW stop clicking."
];

function fakeShopClick(){

    var msg = document.getElementById('shop-message');
    if(!msg) return;

    fakeShopClicks++;

    var btn = document.getElementById('fake-shop-btn');

    if(btn){
        btn.classList.remove('shake');
        void btn.offsetWidth;
        btn.classList.add('shake');
    }

var index = Math.min(
    fakeShopClicks - 1,
    fakeShopMessages.length - 1
);

msg.innerHTML = fakeShopMessages[index];
}

/* ===== SHOP TEXT AUTO-RECYCLE (every 2 hrs) ===== */
var SHOP_RECYCLE_MS = 2 * 60 * 60 * 1000;

function initShopRecycle(){
    var msg=document.getElementById('shop-message');
    if(!msg)return;
    var last=parseInt(localStorage.getItem('cards_shop_msg_ts')||'0');
    var idx=parseInt(localStorage.getItem('cards_shop_msg_idx')||'0');
    var now=Date.now();
    if(!last||now-last>=SHOP_RECYCLE_MS){
        idx=(idx+1)%fakeShopMessages.length;
        localStorage.setItem('cards_shop_msg_ts',String(now));
        localStorage.setItem('cards_shop_msg_idx',String(idx));
    }
    msg.innerHTML=fakeShopMessages[idx];
    fakeShopClicks=idx+1;
}