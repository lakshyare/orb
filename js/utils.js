/* ===== TOAST SYSTEM ===== */
function showToast(msg, type, icon){
    var container=document.getElementById('toast-container');
    if(!container){
        container=document.createElement('div');
        container.id='toast-container';
        container.style.cssText='position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(container);
    }
    var colors={success:'#2ecc71',error:'#e74c3c',info:'#3498db',gold:'#f1c40f'};
    var icons={success:'✓',error:'✕',info:'ℹ',gold:'💰'};
    var col=colors[type||'success'];
    var ico=icon||(icons[type||'success']);

    var t=document.createElement('div');
    t.style.cssText=
        'display:flex;align-items:center;gap:12px;'+
        'background:rgba(15,15,22,0.97);'+
        'border:1px solid '+col+';'+
        'border-left:4px solid '+col+';'+
        'color:#fff;padding:12px 18px;border-radius:10px;'+
        'font-size:0.88rem;font-weight:700;letter-spacing:0.5px;'+
        'box-shadow:0 8px 24px rgba(0,0,0,0.5);'+
        'pointer-events:all;cursor:pointer;'+
        'transform:translateX(120%);transition:transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275);'+
        'max-width:320px;min-width:200px;';

    t.innerHTML=
        '<span style="width:22px;height:22px;border-radius:50%;background:'+col+';display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:900;color:#111;flex-shrink:0;">'+ico+'</span>'+
        '<span style="flex:1;">'+msg+'</span>';

    t.onclick=function(){dismissToast(t);};
    container.appendChild(t);

    requestAnimationFrame(function(){
        requestAnimationFrame(function(){
            t.style.transform='translateX(0)';
        });
    });

    var timer=setTimeout(function(){dismissToast(t);},3200);
    t._timer=timer;

    /* Auto-cap at 4 toasts */
    var all=container.children;
    if(all.length>4)dismissToast(all[0]);
}

function dismissToast(t){
    if(!t||!t.parentNode)return;
    clearTimeout(t._timer);
    t.style.transform='translateX(120%)';
    setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},320);
}

/* Alias — keeps old showShopToast calls working */
function showShopToast(msg,type){showToast(msg,type);}
/* ===== UTILITIES ===== */
function getAccentColor(){return document.body.classList.contains('light-mode')?'#9254c2':'#f1c40f';}
function formatTodayStr(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function getTodayStr(){return formatTodayStr(new Date());}
function getWeekKey(){var d=new Date(),o=new Date(d.getFullYear(),0,1),w=Math.ceil((((d-o)/86400000)+o.getDay()+1)/7);return d.getFullYear()+'-W'+w;}
function cloneObj(o){return JSON.parse(JSON.stringify(o));}
function shuffleArray(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}
function getRandomItems(arr,count){return shuffleArray(arr).slice(0,count).map(cloneObj);}
function rarityValue(r){return r==='legendary'?3:r==='epic'?2:1;}
function getInventoryCounts(){var c={};myInventory.forEach(function(id){c[id]=(c[id]||0)+1;});return c;}
function getSellableExtrasCount(){var c=getInventoryCounts(),e=0;Object.keys(c).forEach(function(id){if(c[id]>1)e+=c[id]-1;});return e;}
function getDuplicateValue(r){return r==='legendary'?1000:r==='epic'?200:20;}
function incPlayerStat(key,amt){if(playerProfile[key]===undefined)playerProfile[key]=0;playerProfile[key]+=amt;}
function trackMostUsedCard(cid){if(!playerProfile.cardUseCounts)playerProfile.cardUseCounts={};playerProfile.cardUseCounts[cid]=(playerProfile.cardUseCounts[cid]||0)+1;}
function setLastOpened(cid){lastOpenedCardId=cid;saveLastOpened();renderHomeProgress();}
function getStreakMultiplier(){var s=playerProfile.winStreak;return s<2?1:Math.min(1+(s-1)*0.25,2.5);}
function getBattleRankLabel(){var p=playerProfile.battleRankPoints||0;return p>=450?'GOLD':p>=220?'SILVER':'BRONZE';}
function addBattleHistory(r,ps,bs,g,x){battleHistory.unshift({result:r,playerScore:ps,botScore:bs,gold:g,xp:x,timestamp:Date.now()});if(battleHistory.length>20)battleHistory=battleHistory.slice(0,20);}
function updateLoginVisitStreak(){var today=getTodayStr(),y=new Date();y.setDate(y.getDate()-1);var yStr=formatTodayStr(y);if(!loginVisitData.lastVisit){loginVisitData.streak=1;loginVisitData.lastVisit=today;}else if(loginVisitData.lastVisit===today){}else if(loginVisitData.lastVisit===yStr){loginVisitData.streak=(loginVisitData.streak||1)+1;loginVisitData.lastVisit=today;}else{loginVisitData.streak=1;loginVisitData.lastVisit=today;}saveLoginVisit();}
function getLoginStreak(){return loginVisitData.streak||1;}
function updateSellExtrasVisibility(){var b=document.getElementById('gallery-sell-btn');if(b)b.style.display=getSellableExtrasCount()>0?'inline-block':'none';}

/* Coins */
function animateCoins(t){coinAnimTarget=t;if(!coinAnimating){coinAnimating=true;tickCoin();}}
function tickCoin(){if(Math.abs(coinAnimCurrent-coinAnimTarget)<1){coinAnimCurrent=coinAnimTarget;document.getElementById('coin-display').innerText=coinAnimTarget;coinAnimating=false;return;}var d=coinAnimTarget-coinAnimCurrent;coinAnimCurrent+=Math.ceil(Math.abs(d)/12)*Math.sign(d);document.getElementById('coin-display').innerText=Math.round(coinAnimCurrent);requestAnimationFrame(tickCoin);}
function addCoins(a){coins+=a;animateCoins(coins);}
function spendCoins(a){coins-=a;animateCoins(coins);}

/* XP + Levels */
function xpForLevel(l){return 100+(l-1)*50;}
function getXPPercent(){return Math.min((playerProfile.xp/xpForLevel(playerProfile.level))*100,100);}
function addXP(a){playerProfile.xp+=a;var n=xpForLevel(playerProfile.level);while(playerProfile.xp>=n){playerProfile.xp-=n;playerProfile.level++;n=xpForLevel(playerProfile.level);createExplosion(window.innerWidth/2,window.innerHeight/2,'rainbow');showLevelUpOverlay(playerProfile.level);}}
function showLevelUpOverlay(lvl){var o=document.getElementById('levelup-overlay'),t=document.getElementById('levelup-text');t.innerText='LEVEL '+lvl;o.style.display='flex';setTimeout(function(){o.style.display='none';},1500);}

/* Particles */
var canvas,ctx,particles=[];
function initParticleCanvas(){canvas=document.getElementById('particle-canvas');ctx=canvas.getContext('2d');function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}window.addEventListener('resize',resize);resize();updateParticles();}
function createExplosion(x,y,color){for(var i=0;i<30;i++){var c;if(color==='accent')c=getAccentColor();else if(color==='gold')c='#f1c40f';else if(color==='red')c='#e74c3c';else c='hsl('+Math.floor(Math.random()*360)+',100%,50%)';particles.push({x:x,y:y,vx:(Math.random()-0.5)*10,vy:(Math.random()-0.5)*10,life:100,color:c,size:Math.random()*5+2});}}
function createSpark(x,y){for(var i=0;i<5;i++)particles.push({x:x,y:y,vx:(Math.random()-0.5)*6,vy:-Math.random()*5-2,life:60,color:'hsl('+(40+Math.floor(Math.random()*20))+',100%,'+(60+Math.floor(Math.random()*30))+'%)',size:Math.random()*3+1});}
function updateParticles(){ctx.clearRect(0,0,canvas.width,canvas.height);particles.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life-=2;ctx.globalAlpha=Math.max(p.life/100,0);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;particles=particles.filter(function(p){return p.life>0;});requestAnimationFrame(updateParticles);}

/* Idle arena particles */
var idleCanvas,idleCtx;
function initIdleCanvas(){idleCanvas=document.getElementById('idle-canvas');idleCtx=idleCanvas.getContext('2d');function resize(){idleCanvas.width=window.innerWidth;idleCanvas.height=window.innerHeight;}window.addEventListener('resize',resize);resize();for(var i=0;i<40;i++)idleParticles.push(makeIdleParticle());updateIdleParticles();}
function makeIdleParticle(){return{x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,vx:(Math.random()-0.5)*0.3,vy:-Math.random()*0.4-0.1,size:Math.random()*2.5+0.5,life:Math.random()*300+200,maxLife:500,hue:30+Math.random()*30,type:Math.random()<0.3?'ember':'dust'};}
function updateIdleParticles(){idleCtx.clearRect(0,0,idleCanvas.width,idleCanvas.height);var isHome=document.getElementById('home').classList.contains('active-section');var gameActive=document.getElementById('game').classList.contains('active-section');idleCanvas.style.opacity=(gameActive||isHome)?(isHome?'0.3':'0.6'):'0';idleParticles.forEach(function(p){p.x+=p.vx+Math.sin(Date.now()*0.001+p.y*0.01)*0.2;p.y+=p.vy;p.life--;var alpha=Math.min(p.life/100,1)*0.5;if(p.type==='ember'){idleCtx.fillStyle='hsla('+p.hue+',100%,60%,'+alpha+')';idleCtx.shadowBlur=8;idleCtx.shadowColor='hsla('+p.hue+',100%,50%,0.5)';}else{idleCtx.fillStyle='rgba(255,255,255,'+alpha*0.3+')';idleCtx.shadowBlur=0;}idleCtx.beginPath();idleCtx.arc(p.x,p.y,p.size,0,Math.PI*2);idleCtx.fill();idleCtx.shadowBlur=0;if(p.life<=0||p.y<-10||p.x<-10||p.x>idleCanvas.width+10){Object.assign(p,makeIdleParticle());p.y=idleCanvas.height+10;}});requestAnimationFrame(updateIdleParticles);}

/* Damage pops */
function spawnDamagePop(x,y,text,type){var p=document.createElement('div');p.className='damage-pop pop-'+type;p.innerText=text;p.style.left=x+'px';p.style.top=y+'px';document.body.appendChild(p);setTimeout(function(){if(p.parentNode)p.remove();},1500);}
function triggerScreenShake(){document.getElementById('battle-arena').classList.add('screen-shake');setTimeout(function(){document.getElementById('battle-arena').classList.remove('screen-shake');},400);}

/* Achievements */
function checkAchievements(){achievementDefs.forEach(function(a){if(!unlockedAchievements[a.id]&&a.check())unlockAchievement(a.id);});}
function unlockAchievement(id){if(unlockedAchievements[id])return;unlockedAchievements[id]=true;var a=achievementDefs.find(function(x){return x.id===id;});if(a)showAchievementToast(a);createExplosion(160,120,'accent');}
function showAchievementToast(a){var c=document.getElementById('achievement-container');var t=document.createElement('div');t.className='achievement-toast';t.innerHTML='<div class="achieve-icon">'+a.icon+'</div><div class="achieve-info"><div class="achieve-label">Achievement Unlocked!</div><div class="achieve-name">'+a.name+'</div><div class="achieve-desc">'+a.desc+'</div></div>';c.appendChild(t);setTimeout(function(){t.classList.add('leaving');setTimeout(function(){if(t.parentNode)t.remove();},400);},4500);}
function getAchievementRewardText(r){var p=[];if(r.gold)p.push('+'+r.gold+' Gold');if(r.xp)p.push('+'+r.xp+' XP');return p.join(' • ');}
function claimAchievementReward(id){var a=achievementDefs.find(function(x){return x.id===id;});if(!a||!unlockedAchievements[id]||claimedAchievementRewards[id])return;claimedAchievementRewards[id]=true;if(a.reward.gold)addCoins(a.reward.gold);if(a.reward.xp)addXP(a.reward.xp);
document.getElementById('achievement-claim-body').innerHTML='<div style="font-size:1.2rem;font-weight:900;color:var(--brand-gold);margin-bottom:10px;">'+a.name+'</div><div>'+getAchievementRewardText(a.reward)+'</div>';document.getElementById('achievement-claim-overlay').style.display='flex';renderAchievePanel();renderHomeProgress();renderCCStamps();}
function toggleAchievePanel(){var p=document.getElementById('achieve-panel');p.classList.toggle('open');if(p.classList.contains('open'))renderAchievePanel();}
function renderAchievePanel(){var b=document.getElementById('ap-body');b.innerHTML='';['Collection','Battle','Loyalty'].forEach(function(cat){var s=document.createElement('div');s.className='ap-category';s.innerHTML='<div class="ap-category-title">'+cat+'</div>';achievementDefs.filter(function(a){return a.cat===cat;}).forEach(function(a){var u=!!unlockedAchievements[a.id],cl=!!claimedAchievementRewards[a.id],pr=a.progress?a.progress():{current:u?1:0,max:1},pc=Math.round((pr.current/pr.max)*100);var cb='';if(u)cb='<button class="ap-claim-btn '+(cl?'claimed':'')+'" '+(cl?'disabled':'')+' onclick="claimAchievementReward(\''+a.id+'\')">'+(cl?'CLAIMED':'CLAIM '+getAchievementRewardText(a.reward))+'</button>';var d=document.createElement('div');d.className='ap-item '+(u?'unlocked':'locked');d.innerHTML='<div style="font-size:1.8rem;min-width:40px;text-align:center;">'+a.icon+'</div><div style="flex:1;"><div style="font-weight:900;color:'+(u?'white':'#bbb')+';">'+a.name+'</div><div style="font-size:0.8rem;color:#888;">'+a.desc+'</div><div class="ap-progress-wrap"><div class="ap-progress-bar"><div class="ap-progress-fill" style="width:'+pc+'%"></div></div><div class="ap-progress-text">'+pr.current+'/'+pr.max+'</div></div>'+cb+'</div>';s.appendChild(d);});b.appendChild(s);});}
function renderCCStamps(){var a=document.getElementById('cc-stamps-area');var c=Object.keys(unlockedAchievements).filter(function(k){return unlockedAchievements[k];}).length;a.innerHTML='<div class="cc-ach-summary">Achievements: '+c+'/'+achievementDefs.length+'</div>';}

/* Objectives */
function ensureObjectiveReset(){var today=getTodayStr(),week=getWeekKey();if(objectiveSystem.dailyDate!==today){objectiveSystem.dailyDate=today;objectiveSystem.dailyList=getRandomItems(dailyObjectiveTemplates,3).map(function(x){x.progress=0;x.completed=false;return x;});objectiveSystem.claimedDaily=[];saveObjectives();}if(objectiveSystem.weeklyKey!==week){objectiveSystem.weeklyKey=week;objectiveSystem.weekly=cloneObj(weeklyObjectiveTemplates[Math.floor(Math.random()*weeklyObjectiveTemplates.length)]);objectiveSystem.weekly.progress=0;objectiveSystem.weekly.completed=false;objectiveSystem.claimedWeekly=false;saveObjectives();}}
function updateObjectiveProgress(type,amt){ensureObjectiveReset();var ch=false;objectiveSystem.dailyList.forEach(function(o){if(o.type===type&&!o.completed){o.progress=Math.min(o.target,(o.progress||0)+amt);if(o.progress>=o.target)o.completed=true;ch=true;}});if(objectiveSystem.weekly&&objectiveSystem.weekly.type===type&&!objectiveSystem.weekly.completed){objectiveSystem.weekly.progress=Math.min(objectiveSystem.weekly.target,(objectiveSystem.weekly.progress||0)+amt);if(objectiveSystem.weekly.progress>=objectiveSystem.weekly.target)objectiveSystem.weekly.completed=true;ch=true;}if(ch){saveObjectives();renderHomeProgress();}}
function claimDailyObjective(i){ensureObjectiveReset();var o=objectiveSystem.dailyList[i];if(!o||!o.completed||objectiveSystem.claimedDaily.includes(i))return;objectiveSystem.claimedDaily.push(i);addCoins(o.reward.gold||0);addXP(o.reward.xp||0);saveObjectives();createExplosion(window.innerWidth/2,window.innerHeight/2,'accent');renderHomeProgress();}
function claimWeeklyObjective(){ensureObjectiveReset();var o=objectiveSystem.weekly;if(!o||!o.completed||objectiveSystem.claimedWeekly)return;objectiveSystem.claimedWeekly=true;addCoins(o.reward.gold||0);addXP(o.reward.xp||0);saveObjectives();createExplosion(window.innerWidth/2,window.innerHeight/2,'rainbow');renderHomeProgress();if(typeof updateWeeklyRewardBtn==='function')updateWeeklyRewardBtn();showShopToast('Weekly reward claimed!','success');}
function getCompletedDailyCount(){return objectiveSystem.dailyList.filter(function(o){return o.completed;}).length;}
function rerollDailyObjective(idx){ensureObjectiveReset();var today=getTodayStr();if(!objectiveSystem._rerollUsed)objectiveSystem._rerollUsed={};if(objectiveSystem._rerollUsed[today]){showShopToast('Already rerolled today!','error');return;}objectiveSystem._rerollUsed[today]=true;var pool=dailyObjectiveTemplates.filter(function(t){return!objectiveSystem.dailyList.some(function(o){return o.id===t.id;});});if(pool.length>0){var newObj=JSON.parse(JSON.stringify(pool[Math.floor(Math.random()*pool.length)]));newObj.progress=0;newObj.completed=false;objectiveSystem.dailyList[idx]=newObj;}saveObjectives();renderHomeProgress();showShopToast('Quest rerolled!','success');}
function claimAllDailyObjectives(){ensureObjectiveReset();var claimed=0;objectiveSystem.dailyList.forEach(function(o,i){if(o.completed&&!objectiveSystem.claimedDaily.includes(i)){objectiveSystem.claimedDaily.push(i);addCoins(o.reward.gold||0);addXP(o.reward.xp||0);claimed++;}});if(claimed>0){saveObjectives();createExplosion(window.innerWidth/2,window.innerHeight/2,'accent');renderHomeProgress();showShopToast('Claimed '+claimed+' rewards!','success');}else showShopToast('Nothing to claim!','error');}
