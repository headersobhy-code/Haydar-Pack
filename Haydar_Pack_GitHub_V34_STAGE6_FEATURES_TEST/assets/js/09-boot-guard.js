/* Haydar Pack V33 Stage 5 split file: 09-boot-guard.js. Preserves execution order from stable version. */
(function(){
  'use strict';
  var HP_STAGE_VERSION='31-stage3-docs-test';
  var HP_BOOT_MAX_MS=12000;
  function byId(id){return document.getElementById(id)}
  function safeToast(msg){try{if(typeof toast==='function')toast(msg)}catch(e){}}
  function setText(id,text){var el=byId(id); if(el) el.textContent=text;}
  function setState(state,msg){try{if(typeof setSyncState==='function')setSyncState(state,msg||'')}catch(e){} setText('sync-status',msg||'');}
  function enforceSingleActivePage(){
    try{
      var pages=[].slice.call(document.querySelectorAll('.page'));
      if(!pages.length) return;
      var active=pages.filter(function(p){return p.classList.contains('active')});
      if(active.length!==1){
        pages.forEach(function(p,i){p.classList.toggle('active',i===0)});
        var nav=[].slice.call(document.querySelectorAll('.nb'));
        nav.forEach(function(b,i){b.classList.toggle('active',i===0)});
      }
    }catch(e){console.warn('Stage1 page guard skipped',e)}
  }
  function hideLoading(reason){
    try{
      var cover=byId('cloud-loading-cover');
      if(cover){cover.classList.add('hide');cover.classList.add('hp-v29-forced-hide');}
      enforceSingleActivePage();
      if(reason){setState('err',reason);}
    }catch(e){console.warn('Stage1 loading guard skipped',e)}
  }
  function installGuards(){
    document.documentElement.setAttribute('data-hp-version',HP_STAGE_VERSION);
    enforceSingleActivePage();
    setTimeout(enforceSingleActivePage,800);
    setTimeout(enforceSingleActivePage,2500);
    setTimeout(function(){
      var cover=byId('cloud-loading-cover');
      if(cover && !cover.classList.contains('hide')){
        hideLoading('تم فتح البرنامج من النسخة المحلية. اضغط تحديث البيانات من Google لو الاتصال متاح.');
        safeToast('تم تخطي شاشة التحميل لحماية فتح البرنامج');
        try{if(typeof refreshAll==='function')refreshAll()}catch(e){}
      }
    },HP_BOOT_MAX_MS);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installGuards); else installGuards();
})();
