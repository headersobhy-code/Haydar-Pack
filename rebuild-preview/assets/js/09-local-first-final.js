/* Final precedence gate for Local First V58.0. */
(function(){
  'use strict';
  function cleanLegacy(){
    ['hp-v41-sync-ui','hp-v491-save-guard','hp-v39-guard-panel','hp-v37-sync-panel','hp-stage4-sync-panel','hp-v25-sync-panel','hp-v50-pro-card'].forEach(function(id){var e=document.getElementById(id);if(e)e.remove()});
    if(window.HP_LOCAL_STORAGE&&window.HP_LOCAL_STORAGE.renderPanel)window.HP_LOCAL_STORAGE.renderPanel();
  }
  window.openSync=function(){try{if(typeof openDrawer==='function')openDrawer('dr-sync');else document.getElementById('dr-sync').classList.add('open')}catch(e){}setTimeout(cleanLegacy,0);setTimeout(cleanLegacy,400)};
  window.save=save=function(){
    try{if(typeof reduceDBForStorage==='function')reduceDBForStorage();HPPreviewStorage.setItem('hayder_bags_app',JSON.stringify(window.DB||DB||{}));if(window.HP_LOCAL_STORAGE)window.HP_LOCAL_STORAGE.persist('business-save',false);return true}
    catch(e){try{if(typeof toast==='function')toast('تعذر الحفظ المحلي: مساحة الجهاز ممتلئة')}catch(_){}return false}
  };
  window.scheduleSync=function(){if(window.HP_LOCAL_STORAGE)window.HP_LOCAL_STORAGE.persist('compatibility-save',false);return true};
  window.manualSync=window.manualSyncNow=window.createCloudBackup=function(){return window.HP_LOCAL_STORAGE?window.HP_LOCAL_STORAGE.cloudBackup(true):Promise.resolve(false)};
  window.refreshCloudData=window.loadFromDrive=function(){try{if(typeof toast==='function')toast('لن يتم استبدال الداتا تلقائيًا. استخدم استيراد JSON.') }catch(e){}return Promise.resolve(false)};
  document.addEventListener('DOMContentLoaded',function(){setTimeout(cleanLegacy,1600);setTimeout(cleanLegacy,3200)});
})();
