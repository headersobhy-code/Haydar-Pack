/* Local-first entry points loaded after the legacy modules. */
(function(){
  'use strict';
  var storage=window.HP_LOCAL_STORAGE;
  window.openSync=function(){
    storage.renderPanel();
    if(typeof window.renderDeletedHistory==='function')window.renderDeletedHistory();
    openDrawer('dr-backup');
  };
  window.save=save=storage.saveLocal;
  window.scheduleSync=function(){storage.persist('compatibility-save',false);return true};
  window.manualSync=window.manualSyncNow=window.createCloudBackup=function(){return storage.cloudBackup(true)};
  window.refreshCloudData=window.loadFromDrive=function(){return Promise.resolve(false)};
})();
