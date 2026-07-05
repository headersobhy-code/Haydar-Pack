/* Haydar Pack V33 Stage 5 split file: 02-pwa-register.js. Preserves execution order from stable version. */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./sw.js').catch(function(e){console.warn('SW registration failed', e)});
  });
}


/* ===== HAYDAR PACK V12 FIX: LOGO + DEFAULT BAG COLOR ===== */
(function(){
  var HP_DEFAULT_BAG_COLOR='ابيض';
  function hpApplyDefaultBagColor(force){
    try{
      var edit=document.getElementById('o-edit-id');
      var color=document.getElementById('o-color');
      if(!color) return;
      if(force || !(edit && edit.value) && !String(color.value||'').trim()) color.value=HP_DEFAULT_BAG_COLOR;
    }catch(e){}
  }
  try{
    var box=document.querySelector('.logo-icon');
    if(box) box.innerHTML='<img class="hp-app-logo" src="hp-logo-v3-192.png" alt="Haydar Pack">';
  }catch(e){}
  try{
    if(typeof window.openOrderForm==='function'){
      var oldOpenOrderForm=window.openOrderForm;
      window.openOrderForm=function(id){
        var r=oldOpenOrderForm.apply(this, arguments);
        if(!id){ hpApplyDefaultBagColor(true); setTimeout(function(){hpApplyDefaultBagColor(true)},50); }
        return r;
      };
    }
  }catch(e){}
  document.addEventListener('DOMContentLoaded',function(){hpApplyDefaultBagColor(false)});
})();
