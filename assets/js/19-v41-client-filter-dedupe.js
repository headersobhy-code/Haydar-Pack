/* Haydar Pack V41.1 — Client Filter De-duplication
   Scope: fixes duplicated client filter chips only. Keeps V41 data protection/backup logic unchanged. */
(function(){
  'use strict';
  var VERSION='41.1.0-client-filter-dedupe';
  var timer=null, wrapped=false;
  function byId(id){return document.getElementById(id)}
  function all(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function isClientFilter(el){
    if(!el || !el.querySelector) return false;
    if(el.id==='hp-v36-client-filter' || el.id==='hp-stage6-client-filter') return true;
    if(el.classList && el.classList.contains('hp-stage6-filter')) return !!(el.querySelector('[data-f]') || el.querySelector('[data-s]'));
    return false;
  }
  function cleanupClientFilters(){
    var page=byId('pg-clients');
    if(!page) return;
    var seen=[];
    all('#hp-v36-client-filter, #hp-stage6-client-filter, .hp-stage6-filter', page).forEach(function(el){
      if(isClientFilter(el) && seen.indexOf(el)<0) seen.push(el);
    });
    if(seen.length<=1) return;
    var keeper=seen.filter(function(el){return el.id==='hp-v36-client-filter'})[0] || seen[seen.length-1] || seen[0];
    seen.forEach(function(el){
      if(el!==keeper && el.parentNode) el.parentNode.removeChild(el);
    });
    // Keep the final V36 filter identity so the latest handlers/state remain valid.
    if(keeper && keeper.id!=='hp-v36-client-filter' && !byId('hp-v36-client-filter')){
      try{keeper.id='hp-v36-client-filter'}catch(e){}
    }
  }
  function scheduleCleanup(){
    clearTimeout(timer);
    timer=setTimeout(cleanupClientFilters, 25);
  }
  function wrapRenderClients(){
    if(wrapped || typeof window.renderClients!=='function' || window.renderClients.__hpV41FilterFix) return;
    var old=window.renderClients;
    var fixed=function(){
      var r=old.apply(this,arguments);
      cleanupClientFilters();
      setTimeout(cleanupClientFilters,0);
      setTimeout(cleanupClientFilters,80);
      return r;
    };
    fixed.__hpV41FilterFix=true;
    window.renderClients=fixed;
    wrapped=true;
  }
  function boot(){
    wrapRenderClients();
    cleanupClientFilters();
    try{ if(window.activePage==='clients' && typeof window.renderClients==='function') window.renderClients(); }catch(e){}
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,300);setTimeout(boot,1200)});
  window.addEventListener('load',function(){setTimeout(boot,300);setTimeout(cleanupClientFilters,1800)});
  setTimeout(boot,700);
  setTimeout(boot,2200);
  try{
    var obs=new MutationObserver(scheduleCleanup);
    obs.observe(document.documentElement,{childList:true,subtree:true});
  }catch(e){}
  window.HP_V41_FILTER_DEDUPE={version:VERSION,cleanup:cleanupClientFilters};
})();
