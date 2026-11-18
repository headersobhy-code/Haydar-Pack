/* Haydar Pack Local First V58.0
   Local writes never wait for Google. IndexedDB is the durable store and
   HPPreviewStorage is a synchronous compatibility cache for the legacy UI. */
(function(){
  'use strict';
  var VERSION='2026.08.11-local-first.2';
  var SITE_VERSION='production_20260811_local_first_2';
  var LOCAL_KEY='hayder_bags_app';
  var DB_NAME='haydar_pack_local_first';
  var DB_VERSION=1;
  var STATE_STORE='state';
  var SNAP_STORE='snapshots';
  var CURRENT_KEY='current';
  var META_KEY='hayder_pack_local_first_meta_v1';
  var BACKUP_INTERVAL=24*60*60*1000;
  var SAVE_DELAY=80;
  var MAX_SNAPSHOTS=10;
  var backend=(String(window.HP_APPS_SCRIPT_URL||'')).trim();
  var idb=null, mirrorTimer=null, backupTimer=null, booted=false, saveSerial=0;
  var deviceBackupInFlight=null;
  window.HP_MUTATION_SYNC=true;
  window.HP_LOCAL_FIRST=true;

  function $(id){return document.getElementById(id)}
  function now(){return new Date().toISOString()}
  function clone(v){return JSON.parse(JSON.stringify(v||{}))}
  function toastSafe(msg){try{if(typeof toast==='function')toast(msg)}catch(e){}}
  function readJSON(key,fallback){try{var raw=HPPreviewStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(e){return fallback}}
  function writeJSON(key,value){try{HPPreviewStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}}
  function cleanData(input){
    var data=clone(input||{});
    ['clients','factories','orders','payments','transfers','expenses','capitalMoves','documents','houseExpenses','walletAdjustments','deletedItems','deletedLog','deletedArchive'].forEach(function(k){if(!Array.isArray(data[k]))data[k]=[]});
    if(!data.settings||typeof data.settings!=='object'||Array.isArray(data.settings))data.settings={};
    data.settings.autoSync=false;
    if(!Array.isArray(data.settings.extraMonths))data.settings.extraMonths=[];
    data._id=Number(data._id)||1;
    data.version=Math.max(Number(data.version)||0,11);
    return data;
  }
  function counts(data){data=data||{};return {clients:(data.clients||[]).length,factories:(data.factories||[]).length,orders:(data.orders||[]).length,payments:(data.payments||[]).length,transfers:(data.transfers||[]).length,expenses:(data.expenses||[]).length,capitalMoves:(data.capitalMoves||[]).length,documents:(data.documents||[]).length,deleted:(data.deletedItems||[]).length+(data.deletedLog||[]).length+(data.deletedArchive||[]).length}}
  function useful(data){var c=counts(data);return Object.keys(c).reduce(function(s,k){return s+Number(c[k]||0)},0)}
  function meta(){return readJSON(META_KEY,{version:VERSION,lastLocalSaveAt:'',lastDeviceBackupAt:'',lastCloudBackupAt:'',lastCloudBackupAttemptAt:'',cloudBackupError:''})}
  function saveMeta(m){m.version=VERSION;writeJSON(META_KEY,m)}
  function openIDB(){
    if(idb)return Promise.resolve(idb);
    return new Promise(function(resolve,reject){
      if(!window.HPPreviewIndexedDB)return reject(new Error('IndexedDB غير متاح'));
      var req=HPPreviewIndexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=function(){var d=req.result;if(!d.objectStoreNames.contains(STATE_STORE))d.createObjectStore(STATE_STORE,{keyPath:'key'});if(!d.objectStoreNames.contains(SNAP_STORE)){var s=d.createObjectStore(SNAP_STORE,{keyPath:'id'});s.createIndex('createdAt','createdAt')}};
      req.onsuccess=function(){idb=req.result;idb.onversionchange=function(){idb.close();idb=null};resolve(idb)};
      req.onerror=function(){reject(req.error||new Error('تعذر فتح IndexedDB'))};
    });
  }
  function idbGet(store,key){return openIDB().then(function(d){return new Promise(function(resolve,reject){var r=d.transaction(store,'readonly').objectStore(store).get(key);r.onsuccess=function(){resolve(r.result||null)};r.onerror=function(){reject(r.error)}})})}
  function idbPut(store,value){return openIDB().then(function(d){return new Promise(function(resolve,reject){var tx=d.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=function(){resolve(value)};tx.onerror=function(){reject(tx.error)}})})}
  function idbAll(store){return openIDB().then(function(d){return new Promise(function(resolve,reject){var r=d.transaction(store,'readonly').objectStore(store).getAll();r.onsuccess=function(){resolve(r.result||[])};r.onerror=function(){reject(r.error)}})})}
  function idbDelete(store,key){return openIDB().then(function(d){return new Promise(function(resolve,reject){var tx=d.transaction(store,'readwrite');tx.objectStore(store).delete(key);tx.oncomplete=function(){resolve()};tx.onerror=function(){reject(tx.error)}})})}
  function setStatus(msg,state){
    updatePanel();
    if(typeof setSyncState==='function') setSyncState(state||'ok',msg);
  }
  function persistMirror(reason,makeSnapshot){
    var serial=++saveSerial, data=cleanData(window.DB||{}), stamp=now();

    return idbPut(STATE_STORE,{key:CURRENT_KEY,version:VERSION,updatedAt:stamp,serial:serial,reason:reason||'save',counts:counts(data),data:data}).then(function(){
      if(makeSnapshot)return createLocalSnapshot(reason||'manual');
    }).then(function(){setStatus('محفوظ فورًا على هذا الجهاز','ok');return true}).catch(function(error){console.error(error);setStatus('محفوظ في كاش الجهاز — تعذر تحديث التخزين الدائم','err');return false});
  }
  function scheduleMirror(reason){clearTimeout(mirrorTimer);mirrorTimer=setTimeout(function(){persistMirror(reason||'save',false)},SAVE_DELAY)}
  function localSave(){
    if(typeof reduceDBForStorage==='function') reduceDBForStorage();
    if(!writeJSON(LOCAL_KEY,window.DB||{})){
      toastSafe('تعذر الحفظ على الجهاز. راجع مساحة المتصفح.');
      return false;
    }
    var status=meta();
    status.lastLocalSaveAt=now();
    saveMeta(status);
    scheduleMirror('business-save');
    setStatus('تم الحفظ على الجهاز','ok');
    return true;
  }
  function createLocalSnapshot(reason){
    var data=cleanData(window.DB||{}), stamp=now(), rec={id:'snap_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),createdAt:stamp,reason:reason||'manual',version:VERSION,counts:counts(data),data:data};
    return idbPut(SNAP_STORE,rec).then(function(){return idbAll(SNAP_STORE)}).then(function(all){all.sort(function(a,b){return String(b.createdAt).localeCompare(String(a.createdAt))});return Promise.all(all.slice(MAX_SNAPSHOTS).map(function(x){return idbDelete(SNAP_STORE,x.id)}))}).then(function(){var m=meta();m.lastSnapshotAt=stamp;if(reason==='daily-device')m.lastDailyDeviceBackupAt=stamp;saveMeta(m);updatePanel();return rec});
  }
  function extract(parsed){var data=parsed&&parsed.data&&typeof parsed.data==='object'?parsed.data:parsed;if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('ملف JSON غير صالح');data=cleanData(data);if(!useful(data))throw new Error('ملف JSON فارغ');return data}
  function validate(data){
    var errors=[],seen={};['clients','factories','orders','payments','transfers','expenses'].forEach(function(k){(data[k]||[]).forEach(function(x){var id=String(x&&x.id||'');if(!id)errors.push(k+': سجل بدون ID');else if(seen[k+':'+id])errors.push(k+': ID مكرر '+id);else seen[k+':'+id]=true})});
    var clients={};(data.clients||[]).forEach(function(x){clients[String(x.id)]=1});var factories={};(data.factories||[]).forEach(function(x){factories[String(x.id)]=1});
    (data.orders||[]).forEach(function(o){if(!clients[String(o.clientId)])errors.push('أوردر مرتبط بعميل غير موجود: '+String(o.code||o.id));if(!factories[String(o.factoryId)])errors.push('أوردر مرتبط بمصنع غير موجود: '+String(o.code||o.id))});
    (data.payments||[]).forEach(function(p){if(!clients[String(p.clientId)])errors.push('دفعة مرتبطة بعميل غير موجود: '+String(p.id))});
    return {ok:!errors.length,errors:errors,counts:counts(data)};
  }
  function applyData(data,reason){
    var report=validate(data);if(!report.ok)throw new Error('تم رفض الملف: '+report.errors.slice(0,4).join(' — '));
    return createLocalSnapshot('before-'+reason).then(function(){
      var incoming=cleanData(data);
      if(!writeJSON(LOCAL_KEY,incoming)) throw new Error('تعذر حفظ البيانات المستوردة على الجهاز');
      window.DB=incoming;
      DB=incoming;
      var status=meta();
      status.lastLocalSaveAt=now();
      saveMeta(status);
      return persistMirror(reason,false);
    }).then(function(){try{if(typeof migrate==='function')migrate();if(typeof refreshAll==='function')refreshAll()}catch(e){};return report});
  }
  function importFile(input){
    var file=input&&input.files&&input.files[0];if(!file)return;var reader=new FileReader();
    reader.onload=function(){try{var data=extract(JSON.parse(reader.result));var report=validate(data);if(!report.ok)throw new Error(report.errors.slice(0,4).join(' — '));if(!confirm('سيتم حفظ نسخة محلية قبل الاستيراد ثم استبدال بيانات هذا الجهاز فقط. هل تستمر؟'))return;applyData(data,'json-import').then(function(){toastSafe('تم استيراد الداتا وحفظها على هذا الجهاز')}).catch(function(e){toastSafe(e.message||'فشل الاستيراد')})}catch(e){toastSafe(e.message||'ملف JSON غير صالح')}};
    reader.onerror=function(){toastSafe('تعذر قراءة الملف')};reader.readAsText(file,'utf-8');
  }
  function downloadBackup(){
    var data=cleanData(window.DB||{}),payload={format:'HayderPackBackup',version:VERSION,exportedAt:now(),storageMode:'local-first',counts:counts(data),data:data};
    var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='HaydarPack_Backup_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},600);var m=meta();m.lastDeviceBackupAt=now();saveMeta(m);toastSafe('تم تنزيل نسخة JSON');
  }
  var backupInFlight=null;
  function postCloudSnapshot(manual){
    if(backupInFlight) return backupInFlight;
    backupInFlight=uploadSnapshot(manual).finally(function(){backupInFlight=null;updatePanel()});
    updatePanel();
    return backupInFlight;
  }
  function uploadSnapshot(manual){
    if(!backend){if(manual)toastSafe('رابط Google Drive غير مضبوط');return Promise.resolve(false)}
    if(!navigator.onLine){if(manual)toastSafe('لا يوجد إنترنت — الداتا محفوظة على الجهاز');return Promise.resolve(false)}
    var data=cleanData(window.DB||{}),report=validate(data);if(!useful(data)||!report.ok){if(manual)toastSafe('تم منع الـBackup: الداتا تحتاج مراجعة');return Promise.resolve(false)}
    var token='lf_'+Date.now()+'_'+Math.random().toString(36).slice(2,10),m=meta();m.lastCloudBackupAttemptAt=now();m.cloudBackupError='';saveMeta(m);
    return new Promise(function(resolve){
      var iframe=document.createElement('iframe'),form=document.createElement('form'),name='hp_lf_'+Date.now();iframe.name=name;iframe.style.display='none';form.method='POST';form.action=backend;form.target=name;form.style.display='none';
      var fields={action:'backupSnapshot',backupToken:token,data:JSON.stringify(data),appVersion:VERSION,siteVersion:SITE_VERSION,reason:manual?'manual-local-first':'daily-local-first'};
      Object.keys(fields).forEach(function(k){var t=document.createElement('textarea');t.name=k;t.value=fields[k];form.appendChild(t)});document.body.appendChild(iframe);document.body.appendChild(form);form.submit();
      setTimeout(function(){pollBackup(token,manual).then(resolve).finally(function(){form.remove();iframe.remove()})},1800);
    });
  }
  function jsonp(action,params,timeout){return new Promise(function(resolve,reject){var cb='hpLf_'+Date.now()+'_'+Math.floor(Math.random()*99999),s=document.createElement('script'),done=false,timer;window[cb]=function(r){done=true;clean();resolve(r)};function clean(){clearTimeout(timer);try{delete window[cb]}catch(e){};if(s.parentNode)s.remove()}s.onerror=function(){if(!done){clean();reject(new Error('تعذر الاتصال'))}};var q='action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb);Object.keys(params||{}).forEach(function(k){q+='&'+encodeURIComponent(k)+'='+encodeURIComponent(params[k])});s.src=backend+(backend.indexOf('?')>=0?'&':'?')+q+'&_='+Date.now();document.head.appendChild(s);timer=setTimeout(function(){if(!done){clean();reject(new Error('انتهت مهلة التأكيد'))}},timeout||12000)})}
  function pollBackup(token,manual){var tries=0;function run(){tries++;return jsonp('getBackupSnapshotStatus',{backupToken:token},10000).then(function(r){if(r&&r.status==='committed'){var m=meta();m.lastCloudBackupAt=r.createdAt||now();m.cloudBackupError='';saveMeta(m);setStatus('محفوظ على الجهاز — والـBackup الخارجي ناجح','ok');if(manual)toastSafe('تم إنشاء Backup خارجي بنجاح');return true}if(tries<4)return new Promise(function(res){setTimeout(res,1200*tries)}).then(run);throw new Error((r&&r.message)||'لم يتم تأكيد الـBackup')})}return run().catch(function(e){var m=meta();m.cloudBackupError=String(e.message||e);saveMeta(m);setStatus('الداتا محفوظة على الجهاز — تعذر الـBackup الخارجي','soft');if(manual)toastSafe('الداتا محفوظة محليًا، لكن تعذر تأكيد الـBackup الخارجي');return false})}
  function restoreLatestCloudBackup(){
    if(!backend){toastSafe('رابط Google Drive غير مضبوط');return Promise.resolve(false)}
    if(!navigator.onLine){toastSafe('لا يوجد إنترنت — لا يمكن جلب الـBackup الخارجي');return Promise.resolve(false)}
    setStatus('جاري فحص آخر Backup خارجي...','soft');
    return jsonp('getLatestLocalFirstBackup',{},30000).then(function(r){
      if(!r||!r.ok||!r.data)throw new Error((r&&r.message)||'لم يتم العثور على Backup خارجي صالح');
      var data=extract(r.data),report=validate(data);
      if(!report.ok)throw new Error('الـBackup الخارجي غير صالح: '+report.errors.slice(0,4).join(' — '));
      var c=r.counts||report.counts||counts(data),when=r.createdAt?new Date(r.createdAt).toLocaleString('ar-EG'):'غير محدد';
      var message='تم العثور على آخر Backup خارجي بتاريخ: '+when+'\n\nالعملاء: '+(c.clients||0)+'\nالأوردرات: '+(c.orders||0)+'\nالدفعات: '+(c.payments||0)+'\nالمستندات: '+(c.documents||0)+'\n\nسيتم حفظ لقطة أمان من بيانات هذا الجهاز ثم استبدالها. هل تريد الاسترجاع؟';
      if(!confirm(message)){setStatus('تم إلغاء الاسترجاع — الداتا الحالية لم تتغير','ok');return false}
      return applyData(data,'cloud-backup-restore').then(function(){
        var m=meta();m.lastCloudRestoreAt=now();m.lastCloudRestoreSource=r.fileName||'';saveMeta(m);
        setStatus('تم استرجاع الـBackup الخارجي وحفظه على هذا الجهاز','ok');toastSafe('تم استرجاع آخر Backup خارجي بنجاح');return true;
      });
    }).catch(function(e){setStatus('تعذر استرجاع الـBackup الخارجي','err');toastSafe(e.message||'فشل الاسترجاع');return false});
  }
  function maybeDailyBackup(){
    if(!backend || !backupReady || !navigator.onLine || document.hidden || backupInFlight) return;
    clearTimeout(backupTimer);
    var status=meta();
    var lastSuccess=Date.parse(status.lastCloudBackupAt)||0;
    var lastAttempt=Date.parse(status.lastCloudBackupAttemptAt)||0;
    if(Date.now()-lastSuccess<BACKUP_INTERVAL || Date.now()-lastAttempt<60000) return;
    backupTimer=setTimeout(function(){postCloudSnapshot(false)},2500);
  }
  var backupReady=false;
  setInterval(maintainBackups,60000);
  function updatePanel(){
    var status=meta();
    function show(id,value){var element=$(id);if(element)element.textContent=value}
    function time(value){return value?new Date(value).toLocaleString('ar-EG'):'—'}
    show('backup-local-save',time(status.lastLocalSaveAt));
    show('backup-device-copy',time(status.lastSnapshotAt));
    show('backup-cloud-copy',time(status.lastCloudBackupAt));
    var cloudStatus='الحفظ على الجهاز يعمل بدون إنترنت.';
    if(!backend) cloudStatus+=' Google Drive غير مربوط بهذه النسخة.';
    else if(!navigator.onLine) cloudStatus+=' رفع Google مؤجل حتى يرجع الاتصال.';
    else if(backupInFlight) cloudStatus+=' جارٍ رفع النسخة وانتظار التأكيد.';
    else if(status.cloudBackupError) cloudStatus+=' تعذر تأكيد الرفع: '+status.cloudBackupError;
    else cloudStatus+=' النسخ على Google يعمل تلقائيًا عند توفر الاتصال.';
    show('backup-status',cloudStatus);
    ['backup-cloud-upload','backup-cloud-restore'].forEach(function(id){
      var button=$(id);
      if(button)button.disabled=!backend||!navigator.onLine||!!backupInFlight;
    });
  }
  function deviceBackup(manual){
    if(!backupReady || !useful(window.DB||{})) return Promise.resolve(false);
    if(deviceBackupInFlight) return manual?deviceBackupInFlight.then(function(){return deviceBackup(true)}):deviceBackupInFlight;
    deviceBackupInFlight=createLocalSnapshot(manual?'manual-device':'daily-device').then(function(){
      if(manual)toastSafe('تم حفظ نسخة داخل التطبيق');
      return true;
    }).catch(function(error){
      console.error(error);
      if(manual)toastSafe('تعذر حفظ النسخة داخل التطبيق');
      return false;
    }).finally(function(){deviceBackupInFlight=null});
    return deviceBackupInFlight;
  }
  function maintainBackups(){
    if(!backupReady || document.hidden) return;
    var last=Date.parse(meta().lastDailyDeviceBackupAt)||0;
    if(Date.now()-last>=BACKUP_INTERVAL)deviceBackup(false);
    maybeDailyBackup();
    updatePanel();
  }
  function restoreDeviceBackup(){
    return idbAll(SNAP_STORE).then(function(snapshots){
      snapshots.sort(function(a,b){return b.createdAt.localeCompare(a.createdAt)});
      var snapshot=snapshots.find(function(item){return useful(item.data)&&validate(item.data).ok});
      if(!snapshot){toastSafe('لا توجد نسخة قابلة للاسترجاع على هذا الجهاز');return false}
      var date=new Date(snapshot.createdAt).toLocaleString('ar-EG');
      if(!confirm('استرجاع نسخة '+date+'؟ سيتم حفظ نسخة من البيانات الحالية قبل الاسترجاع.'))return false;
      return applyData(snapshot.data,'device-backup-restore').then(function(){
        toastSafe('تم استرجاع النسخة على هذا الجهاز');
        return true;
      });
    }).catch(function(e){toastSafe(e.message||'تعذر استرجاع النسخة');return false});
  }
  function boot(){
    if(booted)return;booted=true;
    var cache=readJSON(LOCAL_KEY,null);
    openIDB().then(function(){return idbGet(STATE_STORE,CURRENT_KEY)}).then(function(rec){
      var chosen=rec&&rec.data?cleanData(rec.data):(cache?cleanData(cache):cleanData(window.DB||{}));
      var cachedAt=Date.parse(meta().lastLocalSaveAt)||0;
      if(cache && (!rec || !cachedAt || cachedAt>=Date.parse(rec.updatedAt))) chosen=cleanData(cache);
      window.DB=chosen;try{DB=chosen}catch(e){};writeJSON(LOCAL_KEY,chosen);return persistMirror(rec?'boot-idb':'migrate-localstorage',!rec&&useful(chosen)>0);
    }).catch(function(e){console.warn('IndexedDB fallback',e);if(cache){window.DB=cleanData(cache);try{DB=window.DB}catch(_){}}}).then(function(){try{if(typeof migrate==='function')migrate();if(typeof refreshAll==='function')refreshAll()}catch(e){};var cover=$('cloud-loading-cover');if(cover)cover.classList.add('hide');setStatus('جاهز — الحفظ محلي وفوري','ok');updatePanel();backupReady=true;maintainBackups()});
  }
  window.save=save=function(){return localSave()};
  window.scheduleSync=function(){scheduleMirror('compatibility-save');return true};
  window.manualSync=function(){return postCloudSnapshot(true)};
  window.manualSyncNow=window.manualSync;
  window.createCloudBackup=function(){return postCloudSnapshot(true)};
  window.restoreLatestExternalBackup=restoreLatestCloudBackup;
  window.downloadManualBackup=downloadBackup;
  window.triggerCloudImport=function(){var i=$('cloud-import-input');if(i){i.value='';i.click()}};
  window.importCloudBackup=importFile;
  window.refreshCloudData=function(){toastSafe('لا يوجد تحميل تلقائي. استخدم استيراد JSON لنقل الداتا بين الأجهزة.');return Promise.resolve(false)};
  window.loadFromDrive=window.refreshCloudData;
  window.HP_LOCAL_STORAGE={version:VERSION,open:openIDB,persist:persistMirror,snapshot:createLocalSnapshot,validate:validate,applyData:applyData,counts:counts,meta:meta,renderPanel:updatePanel,saveLocal:localSave,cloudBackup:postCloudSnapshot,restoreLatestExternal:restoreLatestCloudBackup};
  window.addEventListener('online',maintainBackups);
  window.addEventListener('offline',updatePanel);
  window.createDeviceBackup=function(){return deviceBackup(true)};
  window.restoreDeviceBackup=restoreDeviceBackup;
  document.addEventListener('visibilitychange',function(){if(!document.hidden)maintainBackups()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,40)});else setTimeout(boot,0);
  window.addEventListener('load',function(){setTimeout(function(){if(!booted)boot()},200)});
})();
