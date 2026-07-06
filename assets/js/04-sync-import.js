/* Haydar Pack V49 final-stable bundle: 04-sync-import.js
   Sources: 12-sync-import.js
   Based on V44.1 Sync Fix; production cleanup without business-logic changes. */



/* ===== BEGIN SOURCE: 12-sync-import.js ===== */

/* Haydar Pack V37 — Auto Local-First Sync Safety
   Scope: sync only. No UI features, calculations, documents, or data model changes.
   Guarantees:
   - Every change is saved locally first.
   - Sync runs automatically in the background; manual button is optional only.
   - Google data never overwrites a newer local pending change.
   - Failed sync retries automatically with backoff until it succeeds.
*/
(function(){
  'use strict';

  var VERSION='49.0.0-final-stable';
  var LOCAL_KEY='hayder_bags_app';
  var META_KEY='hayder_pack_sync_meta_v37';
  var PENDING_KEY='hayder_pack_sync_pending_v37';
  var URL_KEY='hayder_pack_stage4_backend_url_v32';
  var OLD_URL_KEY='hayder_pack_backend_url_v10';
  var LEGACY_PENDING_KEYS=['hayder_pack_stage4_pending_v32','hayder_pack_pwa_pending_v10','hayder_pack_unsynced_v9'];
  var LEGACY_META_KEYS=['hayder_pack_stage4_meta_v32','hayder_pack_pwa_meta_v10','hayder_pack_cloud_meta_v9'];
  var FIXED_URL='https://script.google.com/macros/s/AKfycbw0RxMaw2gNicQjSD5T3LHhd-6d2DnABYKGNNMDD1NN3b09wJL3OatLviAn7xqDu2Zq6w/exec';

  var state={revision:0,updatedAt:'',ackHash:'',lastLocalSaveAt:'',lastCloudSaveAt:'',lastError:'',lastAttemptAt:'',deviceId:''};
  var syncTimer=null, retryTimer=null, metaTimer=null;
  var saving=false, booted=false, suppress=false;

  function $(id){return document.getElementById(id)}
  function now(){return new Date().toISOString()}
  function clone(v){return JSON.parse(JSON.stringify(v||{}))}
  function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.log(msg)}catch(e){}}
  function num(v){var n=parseFloat(v);return isNaN(n)?0:n}
  function normArr(db,k){if(!Array.isArray(db[k]))db[k]=[]}
  function cleanData(input){
    var db=clone(input||{});
    ['clients','factories','orders','payments','transfers','expenses','capitalMoves','deletedItems','deletedLog','deletedArchive'].forEach(function(k){normArr(db,k)});
    if(!db.settings||typeof db.settings!=='object'||Array.isArray(db.settings))db.settings={};
    if(!Array.isArray(db.settings.extraMonths))db.settings.extraMonths=[];
    delete db.settings.dataSafety;
    delete db.settings.googleClientId;
    db.settings.autoSync=false;
    db._id=num(db._id)||1;
    db.version=Math.max(num(db.version)||0,11);
    return db;
  }
  function counts(db){db=db||{};return {
    clients:(db.clients||[]).length,
    factories:(db.factories||[]).length,
    orders:(db.orders||[]).length,
    payments:(db.payments||[]).length,
    transfers:(db.transfers||[]).length,
    expenses:(db.expenses||[]).length,
    capitalMoves:(db.capitalMoves||[]).length,
    deleted:((db.deletedItems||[]).length+(db.deletedLog||[]).length+(db.deletedArchive||[]).length)
  }}
  function hasUsefulData(db){var c=counts(db||{});return c.clients+c.orders+c.payments+c.transfers+c.expenses+c.capitalMoves+c.deleted>0}
  function usefulCount(db){var c=counts(db||{});return c.clients+c.factories+c.orders+c.payments+c.transfers+c.expenses+c.capitalMoves+c.deleted}
  function isDangerousRemote(incoming,base){
    var i=counts(incoming||{}), b=counts(base||{});
    var iCrit=i.clients+i.orders+i.payments+i.transfers+i.expenses+i.capitalMoves+i.deleted;
    var bCrit=b.clients+b.orders+b.payments+b.transfers+b.expenses+b.capitalMoves+b.deleted;
    if(bCrit>=5 && iCrit===0)return true;
    if(bCrit>=10 && iCrit<Math.floor(bCrit*0.35))return true;
    if(b.clients>=5 && i.clients===0)return true;
    if(b.clients>=10 && i.clients<Math.floor(b.clients*0.5))return true;
    if(b.payments>=5 && i.payments===0)return true;
    if(b.orders>=3 && i.orders===0)return true;
    return false;
  }
  function saveEmergencyLocalBackup(reason){
    try{
      if(!hasUsefulData(DB))return;
      var item={reason:reason||'backup',createdAt:now(),counts:counts(DB),data:cleanData(DB)};
      localStorage.setItem('hayder_pack_emergency_local_backup_v38',JSON.stringify(item));
      localStorage.setItem('hayder_pack_emergency_local_backup_v38_'+Date.now(),JSON.stringify(item));
    }catch(e){console.warn('emergency backup skipped',e)}
  }
  function getEmergencyLocalBackup(){try{return JSON.parse(localStorage.getItem('hayder_pack_emergency_local_backup_v38')||'null')}catch(e){return null}}

  function hashText(text){var h=2166136261;for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return ('00000000'+(h>>>0).toString(16)).slice(-8)}
  function dataHash(db){return hashText(JSON.stringify(cleanData(db)))}
  function fmtTime(v){if(!v)return 'لا توجد بعد';try{return new Date(v).toLocaleString('ar-EG')}catch(e){return String(v)}}
  function normalizeUrl(url){
    url=String(url||'').trim().replace(/\s+/g,'');
    if(!url)return '';
    url=url.replace(/[?#].*$/,'').replace(/\/+$/,'');
    var m=url.match(/^(https:\/\/script\.google\.com\/macros\/s\/[^\/]+)(?:\/(exec|dev))?$/);
    if(m)return m[1]+'/exec';
    return '';
  }
  function backendUrl(){
    var url='';
    try{url=localStorage.getItem(URL_KEY)||''}catch(e){}
    if(!url){try{url=localStorage.getItem(OLD_URL_KEY)||''}catch(e){}}
    if(!url&&typeof window.HP_APPS_SCRIPT_URL==='string')url=window.HP_APPS_SCRIPT_URL;
    url=normalizeUrl(url)||FIXED_URL;
    try{localStorage.setItem(URL_KEY,url);localStorage.setItem(OLD_URL_KEY,url)}catch(e){}
    window.HP_APPS_SCRIPT_URL=url;
    return url;
  }
  function deviceId(){
    if(state.deviceId)return state.deviceId;
    try{state.deviceId=localStorage.getItem('hayder_pack_device_id_v37')||''}catch(e){}
    if(!state.deviceId){state.deviceId='dev-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);try{localStorage.setItem('hayder_pack_device_id_v37',state.deviceId)}catch(e){}}
    return state.deviceId;
  }
  function saveState(){
    deviceId();
    try{localStorage.setItem(META_KEY,JSON.stringify(state))}catch(e){}
    updateUI();
  }
  function loadState(){
    try{var m=JSON.parse(localStorage.getItem(META_KEY)||'{}');if(m&&typeof m==='object')Object.assign(state,m)}catch(e){}
    LEGACY_META_KEYS.forEach(function(k){
      try{
        var m=JSON.parse(localStorage.getItem(k)||'{}');
        if(m&&typeof m==='object'){
          if(!state.revision&&m.revision)state.revision=Number(m.revision)||0;
          if(!state.updatedAt&&m.updatedAt)state.updatedAt=m.updatedAt;
          if(!state.ackHash&&(m.checksum||m.hash))state.ackHash=m.checksum||m.hash;
        }
      }catch(e){}
    });
    deviceId();saveState();
  }
  function setText(id,txt,cls){var el=$(id);if(!el)return;el.textContent=txt;if(cls)el.className='cloud-status-value '+cls}
  function pendingData(){try{return JSON.parse(localStorage.getItem(PENDING_KEY)||'null')}catch(e){return null}}
  function savePending(p){try{localStorage.setItem(PENDING_KEY,JSON.stringify(p))}catch(e){console.error(e)}updateUI()}
  function clearPending(){try{localStorage.removeItem(PENDING_KEY)}catch(e){}updateUI()}
  function pendingCount(){return pendingData()?1:0}
  function setSync(stateName,msg){
    try{if(typeof setSyncState==='function')setSyncState(stateName,msg||'')}catch(e){}
    var s=$('sync-status');if(s)s.textContent=msg||'';
    var cls=stateName==='ok'?'success':stateName==='work'?'warn':stateName==='err'?'danger':'';
    var label=stateName==='ok'?'متصل ومحفوظ':stateName==='work'?'مزامنة تلقائية':stateName==='err'?'محفوظ محليًا / لم يصل Google':'جاهز';
    setText('cloud-connection-status',label,cls);
    if(stateName==='err')showOffline(msg);
  }
  var offlineTimer=null;
  function showOffline(msg){
    var off=$('cloud-offline-banner');if(!off)return;
    off.textContent=msg||'تم الحفظ على الجهاز — سيتم الرفع تلقائيًا عند رجوع الاتصال.';
    off.classList.add('show');clearTimeout(offlineTimer);offlineTimer=setTimeout(function(){off.classList.remove('show')},4200);
  }
  function updateUI(){
    setText('cloud-revision-status',String(state.revision||0));
    setText('cloud-last-status',fmtTime(state.lastCloudSaveAt||state.updatedAt));
    var area=$('cloud-conflict-area');
    var p=pendingData();
    if(area){
      area.innerHTML=p?'<div class="cloud-conflict-note" style="background:#FFF2B8;border-color:#000;color:#000">تم حفظ آخر تعديل على الجهاز وجاري رفعه تلقائيًا إلى Google. لا تحتاج تضغط أي زر.<br>آخر حفظ محلي: '+fmtTime(p.localUpdatedAt||state.lastLocalSaveAt)+'<br>محاولات الرفع: '+(p.attempts||0)+'</div>':'';
    }
    var health=$('data-health-status');
    if(health&&p){health.textContent='سليمة — يوجد تعديل في انتظار الرفع التلقائي'}
  }
  function hideLoading(){var c=$('cloud-loading-cover');if(c)c.classList.add('hide')}
  function onePage(){
    try{
      var pages=[].slice.call(document.querySelectorAll('.page'));
      if(pages.length){var act=pages.filter(function(p){return p.classList.contains('active')});if(act.length!==1)pages.forEach(function(p,i){p.classList.toggle('active',i===0)})}
      var nav=[].slice.call(document.querySelectorAll('.nb'));
      if(nav.length){var nact=nav.filter(function(b){return b.classList.contains('active')});if(nact.length!==1)nav.forEach(function(b,i){b.classList.toggle('active',i===0)})}
    }catch(e){}
  }
  function jsonp(action,params,timeoutMs){
    return new Promise(function(resolve,reject){
      var url=backendUrl();
      var cb='hpV37_'+Date.now()+'_'+Math.floor(Math.random()*1000000);
      var q='action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();
      params=params||{};Object.keys(params).forEach(function(k){q+='&'+encodeURIComponent(k)+'='+encodeURIComponent(params[k])});
      var script=document.createElement('script'),done=false,timer;
      window[cb]=function(res){done=true;cleanup();resolve(res)};
      function cleanup(){try{delete window[cb]}catch(e){window[cb]=undefined}if(script&&script.parentNode)script.parentNode.removeChild(script);clearTimeout(timer)}
      script.onerror=function(){if(!done){cleanup();reject(new Error('تعذر الاتصال بـ Apps Script'))}};
      timer=setTimeout(function(){if(!done){cleanup();reject(new Error('المزامنة بطيئة — سيتم إعادة المحاولة تلقائيًا'))}},timeoutMs||30000);
      script.src=url+(url.indexOf('?')>=0?'&':'?')+q;document.head.appendChild(script);
    });
  }
  function postForm(action,fields){
    return new Promise(function(resolve){
      var url=backendUrl(), iframeName='hp_v37_post_'+Date.now();
      var iframe=document.createElement('iframe');iframe.name=iframeName;iframe.style.display='none';
      var form=document.createElement('form');form.method='POST';form.action=url;form.target=iframeName;form.style.display='none';form.acceptCharset='UTF-8';
      fields=fields||{};fields.action=action;fields.appVersion='49.0.0-final-stable';fields.siteVersion='49finalstable';
      Object.keys(fields).forEach(function(k){var t=document.createElement('textarea');t.name=k;t.value=String(fields[k]==null?'':fields[k]);form.appendChild(t)});
      document.body.appendChild(iframe);document.body.appendChild(form);form.submit();
      setTimeout(function(){try{form.remove();iframe.remove()}catch(e){}resolve({ok:true})},2300);
    });
  }
  function localWrite(db){
    try{
      DB=cleanData(db||DB);
      if(typeof reduceDBForStorage==='function')reduceDBForStorage();
      localStorage.setItem(LOCAL_KEY,JSON.stringify(DB));
      return true;
    }catch(e){console.error(e);toastSafe('تعذر الحفظ المحلي: مساحة الجهاز ممتلئة أو الصور كبيرة');return false}
  }
  function localRead(){
    try{var d=localStorage.getItem(LOCAL_KEY);if(d){DB=cleanData(JSON.parse(d));if(typeof migrate==='function')migrate();if(typeof reduceDBForStorage==='function')reduceDBForStorage();localStorage.setItem(LOCAL_KEY,JSON.stringify(DB));}}
    catch(e){console.error(e)}
  }
  function markPending(reason){
    var clean=cleanData(DB||{});
    if(!hasUsefulData(clean))return null;
    var old=pendingData()||{};
    var p={
      id:'chg-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),
      reason:reason||'auto-save',
      localUpdatedAt:now(),
      baseRevision:state.revision||0,
      deviceId:deviceId(),
      attempts:0,
      hash:dataHash(clean),
      counts:counts(clean),
      data:clean
    };
    if(old&&old.hash===p.hash){p.id=old.id||p.id;p.attempts=old.attempts||0;p.localUpdatedAt=old.localUpdatedAt||p.localUpdatedAt;}
    state.lastLocalSaveAt=p.localUpdatedAt;saveState();savePending(p);return p;
  }
  function migrateLegacyPending(){
    if(pendingData())return;
    for(var i=0;i<LEGACY_PENDING_KEYS.length;i++){
      try{
        var raw=localStorage.getItem(LEGACY_PENDING_KEYS[i]);if(!raw)continue;
        var old=JSON.parse(raw);var data=old&&old.data?old.data:(old&&old.local?old.local:null);
        if(data&&hasUsefulData(data)){
          DB=cleanData(data);
          markPending('legacy-pending');
          return;
        }
      }catch(e){}
    }
  }
  function applyRemote(data,meta,msg){
    if(!data||typeof data!=='object')throw new Error('الداتا القادمة من Google غير صالحة');
    var remoteClean=cleanData(data);
    if((!hasUsefulData(remoteClean) && hasUsefulData(DB)) || isDangerousRemote(remoteClean,DB)){
      saveEmergencyLocalBackup('blocked-dangerous-google-over-local');
      setSync('err','تم منع تحميل نسخة Google فارغة أو ناقصة فوق بيانات موجودة على الجهاز');
      throw new Error('Google أرجع نسخة فارغة/ناقصة — تم حماية الداتا المحلية ولم يتم استبدالها');
    }
    if(hasUsefulData(DB))saveEmergencyLocalBackup('before-remote-apply');
    suppress=true;
    try{
      DB=remoteClean;
      if(typeof migrate==='function')migrate();
      if(typeof reduceDBForStorage==='function')reduceDBForStorage();
      localStorage.setItem(LOCAL_KEY,JSON.stringify(DB));
    }finally{suppress=false}
    var h=dataHash(DB);
    state.revision=Number(meta&&meta.revision)||state.revision||0;
    state.updatedAt=(meta&&meta.updatedAt)||state.updatedAt||'';
    state.ackHash=(meta&&meta.checksum)||h;
    state.lastCloudSaveAt=state.updatedAt||now();
    state.lastError='';saveState();clearPending();
    try{if(typeof refreshAll==='function')refreshAll();if(typeof runDataHealthCheckUI==='function')runDataHealthCheckUI()}catch(e){console.error(e)}
    onePage();setSync('ok',msg||'تم تحديث الداتا من Google');
  }
  function schedulePush(delay){
    clearTimeout(syncTimer);
    delay=delay==null?1800:delay;
    syncTimer=setTimeout(function(){pushPending(false)},delay);
  }
  function scheduleRetry(){
    clearTimeout(retryTimer);
    var p=pendingData();if(!p)return;
    var tries=Number(p.attempts)||0;
    var delay=Math.min(120000,[5000,10000,20000,30000,60000,120000][Math.min(tries,5)]||120000);
    retryTimer=setTimeout(function(){pushPending(false)},delay);
  }
  function confirmUploaded(expectedHash,tries){
    tries=tries||1;
    return jsonp('data',{},30000).then(function(res){
      if(!res||res.ok===false)throw new Error((res&&res.message)||'تعذر تأكيد الحفظ على Google');
      var h=(res.checksum||dataHash(res.data||{}));
      if(h===expectedHash)return res;
      if(tries<6)return new Promise(function(resolve){setTimeout(resolve,1800)}).then(function(){return confirmUploaded(expectedHash,tries+1)});
      return res;
    });
  }
  async function forceReplacePending(p){
    if(!p||!hasUsefulData(p.data)){clearPending();throw new Error('تم منع رفع نسخة فارغة إلى Google')}
    setSync('work','جاري تثبيت آخر تعديل محلي على Google تلقائيًا...');
    await postForm('replace',{baseRevision:0,force:'1',data:JSON.stringify(p.data),reason:'v37-auto-local-first'});
    await new Promise(function(resolve){setTimeout(resolve,2600)});
    var res=await confirmUploaded(p.hash,1);
    var h=(res.checksum||dataHash(res.data||{}));
    if(h!==p.hash)throw new Error('لم يصل تأكيد Google حتى الآن — التعديل محفوظ محليًا وسيعاد التأكيد تلقائيًا');
    applyRemote(res.data,res,'تم حفظ التعديل على Google تلقائيًا');
    return true;
  }
  async function pushPending(show){
    if(saving)return false;
    var p=pendingData();
    if(!p){if(show)toastSafe('لا توجد تعديلات معلقة');return checkMeta(false)}
    if(!hasUsefulData(p.data)){clearPending();setSync('err','تم منع رفع نسخة فارغة إلى Google');return false}
    if(!navigator.onLine){setSync('err','تم الحفظ على الجهاز — سيتم الرفع تلقائيًا عند رجوع الإنترنت');scheduleRetry();return false}
    saving=true;p.attempts=Number(p.attempts||0)+1;p.lastAttemptAt=now();savePending(p);state.lastAttemptAt=p.lastAttemptAt;saveState();
    try{
      setSync('work','جاري المزامنة التلقائية مع Google...');
      await postForm('save',{baseRevision:p.baseRevision||0,data:JSON.stringify(p.data),clientTime:now(),deviceId:deviceId()});
      await new Promise(function(resolve){setTimeout(resolve,2600)});
      var res=await confirmUploaded(p.hash,1);
      if(!res||res.ok===false)throw new Error((res&&res.message)||'تعذر تأكيد الحفظ');
      var remoteHash=(res.checksum||dataHash(res.data||{}));
      if(remoteHash===p.hash){applyRemote(res.data,res,'تم حفظ التعديل على Google تلقائيًا');if(show)toastSafe('تمت المزامنة');saving=false;return true;}
      // Conflict or stale revision: local-first, keep user's latest local edit and retry with protected replace.
      await forceReplacePending(p);
      if(show)toastSafe('تمت المزامنة');saving=false;return true;
    }catch(e){
      saving=false;console.error(e);state.lastError=e.message||'فشل الرفع';saveState();setSync('err',(e.message||'تعذر الرفع')+' — سيعاد تلقائيًا');scheduleRetry();return false;
    }
  }
  async function restoreFromRecoveryAction(action,label){
    setSync('work','جاري محاولة استرجاع الداتا من Google Backup...');
    var res=await jsonp(action,{},45000);
    if(!res||res.ok===false)throw new Error((res&&res.message)||'فشل الاسترجاع من Google Backup');
    applyRemote(res.data,res,label||'تم استرجاع الداتا من Google Backup');
    toastSafe(label||'تم استرجاع الداتا');
    return res;
  }
  async function tryAutoRecoverFromGoogle(){
    try{
      var status=await jsonp('status',{},30000);
      if(status&&status.ok){
        var prevUseful=status.previous&&Number(status.previous.usefulCount||0)>0;
        var bakUseful=status.latestUsefulBackup&&Number(status.latestUsefulBackup.usefulCount||0)>0;
        if(prevUseful)return restoreFromRecoveryAction('restorePrevious','تم استرجاع الداتا من النسخة السابقة على Google');
        if(bakUseful)return restoreFromRecoveryAction('restoreLatestBackup','تم استرجاع الداتا من أحدث Backup على Google');
      }
      throw new Error('Google الحالي فارغ ولم أجد نسخة استرجاع تلقائية من داخل البرنامج');
    }catch(e){
      console.error(e);setSync('err',(e.message||'تعذر الاسترجاع')+' — لا تضيف بيانات جديدة الآن');return null;
    }
  }
  window.restorePreviousGoogleData=function(){return restoreFromRecoveryAction('restorePrevious','تم استرجاع النسخة السابقة من Google')};
  window.restoreLatestGoogleBackup=function(){return restoreFromRecoveryAction('restoreLatestBackup','تم استرجاع أحدث Backup من Google')};
  function pull(show){
    if(pendingData()){
      setSync('work','يوجد تعديل محفوظ محليًا — سيتم رفعه قبل أي تحميل من Google');
      return pushPending(show);
    }
    if(!navigator.onLine){setSync('err','أوفلاين — تم فتح آخر نسخة محفوظة على الجهاز');return Promise.resolve(null)}
    setSync('work','جاري تحميل آخر بيانات من Google...');
    return jsonp('data',{},30000).then(async function(res){
      if(!res||res.ok===false)throw new Error((res&&res.message)||'تعذر قراءة Google');
      var remoteClean=cleanData(res.data||{});
      if(!hasUsefulData(remoteClean)){
        if(hasUsefulData(DB)){
          saveEmergencyLocalBackup('blocked-empty-google-pull');
          setSync('err','Google أرجع نسخة فارغة — تم الحفاظ على بيانات الجهاز ولم يتم استبدالها');
          return res;
        }
        setSync('work','Google الحالي فارغ — جاري البحث عن نسخة سابقة/Backup تلقائيًا...');
        return await tryAutoRecoverFromGoogle();
      }
      applyRemote(remoteClean,res,show?'تم تحميل آخر بيانات من Google':'متصل ومحفوظ');if(show)toastSafe('تم تحميل آخر تحديث');return res;
    }).catch(function(e){console.error(e);setSync('err',(e.message||'تعذر الاتصال')+' — البرنامج يعمل من آخر نسخة محفوظة');return null});
  }
  function checkMeta(show){
    if(pendingData())return pushPending(false);
    if(!navigator.onLine)return Promise.resolve(null);
    return jsonp('meta',{},15000).then(function(meta){
      if(meta&&meta.ok){
        var remoteRev=Number(meta.revision)||0;
        if(remoteRev>Number(state.revision||0))return pull(false);
        state.revision=remoteRev||state.revision;state.updatedAt=meta.updatedAt||state.updatedAt;state.ackHash=meta.checksum||state.ackHash;saveState();setSync('ok','متصل ومحفوظ');
      }
      return meta;
    }).catch(function(e){if(show)setSync('err','تعذر قراءة حالة Google — سيعاد تلقائيًا');return null});
  }
  function backup(){
    if(!navigator.onLine){toastSafe('لازم إنترنت لإنشاء نسخة على Google');return}
    setSync('work','جاري إنشاء نسخة احتياطية...');
    jsonp('backup',{},30000).then(function(res){if(res&&res.ok){setSync('ok','تم إنشاء نسخة احتياطية على Google');toastSafe('تم إنشاء نسخة احتياطية')}else throw new Error((res&&res.message)||'تعذر إنشاء النسخة')}).catch(function(e){setSync('err',e.message||'تعذر إنشاء النسخة')});
  }
  function extractImport(parsed){
    if(!parsed||typeof parsed!=='object')throw new Error('ملف الداتا غير صالح');
    var data=parsed.data&&typeof parsed.data==='object'?parsed.data:parsed;
    data=cleanData(data);if(!hasUsefulData(data))throw new Error('ملف الداتا فارغ');
    return {data:data,hash:dataHash(data),counts:counts(data),meta:{revision:Number(parsed.revision)||0,updatedAt:parsed.updatedAt||parsed.exportedAt||''}};
  }
  function importFile(input){
    var file=input&&input.files&&input.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(){
      (async function(){
        try{
          var item=extractImport(JSON.parse(reader.result));
          var msg='سيتم استيراد الداتا ورفعها تلقائيًا إلى Google بعد إنشاء نسخة أمان.\n\nالعملاء: '+item.counts.clients+'\nالمصانع: '+item.counts.factories+'\nالأوردرات: '+item.counts.orders+'\nالدفعات: '+item.counts.payments+'\n\nهل تستمر؟';
          if(!confirm(msg))return;
          DB=item.data;localWrite(DB);var p=markPending('import-json');if(p){p.hash=item.hash;p.data=item.data;savePending(p)}
          setSync('work','تم حفظ ملف الاستيراد محليًا — جاري رفعه تلقائيًا إلى Google');
          await forceReplacePending(pendingData());
          toastSafe('تم الاستيراد والمزامنة');
        }catch(e){console.error(e);setSync('err',e.message||'فشل الاستيراد');toastSafe(e.message||'فشل الاستيراد')}
      })();
    };
    reader.onerror=function(){toastSafe('تعذر قراءة الملف')};reader.readAsText(file,'utf-8');
  }
  function downloadBackup(){
    try{
      var meta={format:'HayderPackBackup',version:VERSION,exportedAt:now(),revision:state.revision||0,updatedAt:state.updatedAt||'',counts:counts(DB),data:cleanData(DB)};
      var blob=new Blob([JSON.stringify(meta,null,2)],{type:'application/json;charset=utf-8'});
      var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='HaydarPack_Backup_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},400);toastSafe('تم تنزيل نسخة JSON');
    }catch(e){toastSafe('تعذر تنزيل النسخة')}
  }
  function ensureSyncPanel(){
    var drawer=document.querySelector('#dr-sync .drawer');if(!drawer)return;
    var old=$('hp-stage4-sync-panel');if(old)old.remove();
    if($('hp-v37-sync-panel'))return;
    var div=document.createElement('div');div.id='hp-v37-sync-panel';div.className='alert blue';
    div.innerHTML='<div style="font-weight:900;margin-bottom:8px">المزامنة التلقائية V40 Data Protection</div><div>أي تعديل يتحفظ فورًا على الجهاز ثم يترفع تلقائيًا على Google. لا تحتاج ترفع يدويًا.</div><div style="font-size:16px;margin-top:8px">رابط Apps Script /exec المستخدم:</div><div dir="ltr" style="word-break:break-all;font-size:14px;background:#fff;border:3px solid #000;border-radius:12px;padding:10px;margin:8px 0">'+backendUrl()+'</div><div id="hp-v37-pending-line" style="font-weight:900">حركات في انتظار الرفع: '+pendingCount()+'</div><div class="btn-row" style="margin-top:10px"><button class="btn green" onclick="refreshCloudData(true)"><i class="ti ti-refresh"></i> تحديث آمن من Google</button><button class="btn blue" onclick="manualSync()"><i class="ti ti-cloud-up"></i> مزامنة الآن للطوارئ</button></div><div class="btn-row" style="margin-top:8px"><button class="btn amber" onclick="restorePreviousGoogleData()"><i class="ti ti-rotate-clockwise"></i> استرجاع النسخة السابقة</button><button class="btn red" onclick="restoreLatestGoogleBackup()"><i class="ti ti-lifebuoy"></i> استرجاع أحدث Backup</button></div>';
    var grid=drawer.querySelector('.cloud-status-grid');drawer.insertBefore(div,grid||drawer.children[2]||null);
  }
  function triggerImport(){var i=$('cloud-import-input');if(i){i.value='';i.click()}}
  function boot(){
    if(booted)return;booted=true;backendUrl();loadState();localRead();migrateLegacyPending();
    var localHash=dataHash(DB||{});
    if(hasUsefulData(DB)&&!pendingData()){
      if(state.ackHash&&localHash!==state.ackHash)markPending('local-newer-than-ack');
      else if(!state.ackHash&&!state.revision)markPending('local-existing-no-meta');
    }
    try{if(typeof refreshAll==='function')refreshAll()}catch(e){}
    hideLoading();onePage();
    if(pendingData())pushPending(false);
    else if(navigator.onLine)pull(false);
    else setSync('err','أوفلاين — تم فتح آخر نسخة محفوظة على الجهاز');
    clearInterval(metaTimer);metaTimer=setInterval(function(){if(pendingData())pushPending(false);else checkMeta(false)},20000);
    try{if(typeof autoRefreshCurrentMonth==='function'){setInterval(autoRefreshCurrentMonth,60*60*1000);setTimeout(autoRefreshCurrentMonth,1500)}}catch(e){}
  }

  var oldOpenSync=window.openSync;
  window.openSync=function(){var r=oldOpenSync?oldOpenSync.apply(this,arguments):undefined;setTimeout(function(){ensureSyncPanel();updateUI();onePage()},0);return r};
  window.refreshCloudData=function(show){return pendingData()?pushPending(!!show):pull(!!show)};
  window.loadFromDrive=function(){return window.refreshCloudData(true)};
  window.manualSync=function(){return pushPending(true)};
  window.manualSyncNow=function(){return pushPending(true)};
  window.createCloudBackup=backup;
  window.triggerCloudImport=triggerImport;
  window.importCloudBackup=importFile;
  window.downloadManualBackup=downloadBackup;
  window.scheduleSync=function(){markPending('scheduled');schedulePush(1500)};
  window.save=save=function(skipSync){
    var ok=localWrite(DB);
    if(ok&&!suppress){
      markPending(skipSync?'auto-save-safe':'auto-save');
      setSync(navigator.onLine?'work':'err',navigator.onLine?'تم الحفظ على الجهاز — جاري الرفع تلقائيًا':'تم الحفظ على الجهاز — سيتم الرفع تلقائيًا عند رجوع الإنترنت');
      schedulePush(1500);
    }
    return ok;
  };
  window.HP_V37_SYNC={version:VERSION,backendUrl:backendUrl,push:pushPending,pull:pull,checkMeta:checkMeta,markPending:markPending,dataHash:dataHash};
  window.addEventListener('online',function(){setSync('work','رجع الإنترنت — جاري رفع أي تعديلات تلقائيًا');pushPending(false)});
  window.addEventListener('focus',function(){if(pendingData())pushPending(false);else checkMeta(false)});
  window.addEventListener('beforeunload',function(e){
    try{
      if(pendingData()){
        e.preventDefault();
        e.returnValue='يوجد تعديل محفوظ على الجهاز ولم يتم تأكيده على Google بعد. انتظر حتى تظهر حالة متصل ومحفوظ.';
        return e.returnValue;
      }
    }catch(_){}
  });
  document.addEventListener('visibilitychange',function(){if(!document.hidden){if(pendingData())pushPending(false);else checkMeta(false)}});
  window.addEventListener('error',function(){setTimeout(function(){hideLoading();onePage()},400)});
  window.addEventListener('unhandledrejection',function(){setTimeout(function(){hideLoading();onePage()},400)});
  document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,80);setTimeout(function(){hideLoading();onePage()},5000)});
  window.addEventListener('load',function(){setTimeout(function(){hideLoading();onePage();if(!booted)boot()},1000)});
  setTimeout(function(){hideLoading();onePage();if(!booted)boot()},6500);
})();


/* ===== END SOURCE: 12-sync-import.js ===== */
