/* Haydar Pack V49 final-stable bundle: 06-data-protection-images-backup.js
   Sources: 16-v39-data-protection-lock.js, 17-v40-image-separation.js, 18-v41-backup-center-simple-ui.js
   Based on V44.1 Sync Fix; production cleanup without business-logic changes. */



/* ===== BEGIN SOURCE: 16-v39-data-protection-lock.js ===== */

/* Haydar Pack V39 — Data Protection Lock
   حماية إضافية فوق V38/V37: يمنع النسخ الفارغة أو الناقصة من مسح نسخة سليمة.
   لا يغير الفواتير/الفلاتر/العملاء/الأوردرات. */
(function(){
  var VERSION='39-data-protection-lock';
  var LOCAL_KEY='hayder_bags_app';
  var SNAP_KEY='hayder_pack_v39_last_safe_snapshot';
  var SNAP_META_KEY='hayder_pack_v39_last_safe_snapshot_meta';
  var URL_KEY='hayder_pack_stage4_backend_url_v32';
  var OLD_URL_KEY='hayder_pack_backend_url_v10';
  var FIXED_URL='https://script.google.com/macros/s/AKfycbw0RxMaw2gNicQjSD5T3LHhd-6d2DnABYKGNNMDD1NN3b09wJL3OatLviAn7xqDu2Zq6w/exec';

  function $(id){return document.getElementById(id)}
  function arr(v){return Array.isArray(v)?v:[]}
  function now(){return new Date().toISOString()}
  function clone(v){return JSON.parse(JSON.stringify(v||{}))}
  function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.log(msg)}catch(e){}}
  function cleanData(input){
    var db=clone(input||{});
    ['clients','factories','orders','payments','transfers','expenses','capitalMoves','deletedItems','deletedLog','deletedArchive'].forEach(function(k){if(!Array.isArray(db[k]))db[k]=[]});
    if(!db.settings||typeof db.settings!=='object'||Array.isArray(db.settings))db.settings={};
    if(!Array.isArray(db.settings.extraMonths))db.settings.extraMonths=[];
    db.settings.autoSync=false;
    db._id=Number(db._id)||1;
    db.version=Math.max(Number(db.version)||0,11);
    return db;
  }
  function counts(db){db=db||{};return {
    clients:arr(db.clients).length,
    factories:arr(db.factories).length,
    orders:arr(db.orders).length,
    payments:arr(db.payments).length,
    transfers:arr(db.transfers).length,
    expenses:arr(db.expenses).length,
    capitalMoves:arr(db.capitalMoves).length,
    deleted:arr(db.deletedItems).length+arr(db.deletedLog).length+arr(db.deletedArchive).length
  }}
  function criticalFromCounts(c){c=c||{};return (c.clients||0)+(c.orders||0)+(c.payments||0)+(c.transfers||0)+(c.expenses||0)+(c.capitalMoves||0)+(c.deleted||0)}
  function criticalCount(db){return criticalFromCounts(counts(db||{}))}
  function fmtCounts(c){c=c||{};return 'عملاء '+(c.clients||0)+' / مصانع '+(c.factories||0)+' / أوردرات '+(c.orders||0)+' / دفعات '+(c.payments||0)}
  function isDangerousIncoming(incomingC,baseC){
    incomingC=incomingC||{};baseC=baseC||{};
    var inCrit=criticalFromCounts(incomingC), baseCrit=criticalFromCounts(baseC), reasons=[];
    if(baseCrit>=5 && inCrit===0) reasons.push('النسخة الجديدة لا تحتوي أي بيانات تشغيل أساسية');
    if(baseCrit>=10 && inCrit<Math.floor(baseCrit*0.35)) reasons.push('انخفاض حاد في إجمالي البيانات');
    if((baseC.clients||0)>=5 && (incomingC.clients||0)===0) reasons.push('العملاء سيصبحوا صفر');
    if((baseC.clients||0)>=10 && (incomingC.clients||0)<Math.floor((baseC.clients||0)*0.5)) reasons.push('عدد العملاء ناقص بشكل خطر');
    if((baseC.payments||0)>=5 && (incomingC.payments||0)===0) reasons.push('الدفعات ستصبح صفر');
    if((baseC.orders||0)>=3 && (incomingC.orders||0)===0) reasons.push('الأوردرات ستصبح صفر');
    return {danger:reasons.length>0,reasons:reasons,inCritical:inCrit,baseCritical:baseCrit};
  }
  function backendUrl(){
    var url='';
    try{url=localStorage.getItem(URL_KEY)||localStorage.getItem(OLD_URL_KEY)||''}catch(e){}
    if(!url && window.HP_V37_SYNC && typeof window.HP_V37_SYNC.backendUrl==='function') {try{url=window.HP_V37_SYNC.backendUrl()}catch(e){}}
    if(!url&&typeof window.HP_APPS_SCRIPT_URL==='string')url=window.HP_APPS_SCRIPT_URL;
    url=String(url||FIXED_URL).trim().replace(/\s+/g,'').replace(/[?#].*$/,'').replace(/\/+$/,'');
    var m=url.match(/^(https:\/\/script\.google\.com\/macros\/s\/[^\/]+)(?:\/(exec|dev))?$/);
    url=m?m[1]+'/exec':FIXED_URL;
    try{localStorage.setItem(URL_KEY,url);localStorage.setItem(OLD_URL_KEY,url)}catch(e){}
    window.HP_APPS_SCRIPT_URL=url;
    return url;
  }
  function jsonp(action,params,timeoutMs){
    return new Promise(function(resolve,reject){
      var url=backendUrl(), cb='hpV39_'+Date.now()+'_'+Math.floor(Math.random()*1000000);
      var q='action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();
      params=params||{};Object.keys(params).forEach(function(k){q+='&'+encodeURIComponent(k)+'='+encodeURIComponent(params[k])});
      var script=document.createElement('script'),done=false,timer;
      window[cb]=function(res){done=true;cleanup();resolve(res)};
      function cleanup(){try{delete window[cb]}catch(e){window[cb]=undefined}if(script&&script.parentNode)script.parentNode.removeChild(script);clearTimeout(timer)}
      script.onerror=function(){if(!done){cleanup();reject(new Error('تعذر الاتصال بـ Apps Script'))}};
      timer=setTimeout(function(){if(!done){cleanup();reject(new Error('الاتصال بطيء — لم يتم حذف أي بيانات'))}},timeoutMs||30000);
      script.src=url+(url.indexOf('?')>=0?'&':'?')+q;document.head.appendChild(script);
    });
  }
  function writeLocal(db){
    DB=cleanData(db);
    try{if(typeof reduceDBForStorage==='function')reduceDBForStorage()}catch(e){}
    localStorage.setItem(LOCAL_KEY,JSON.stringify(DB));
    try{if(typeof refreshAll==='function')refreshAll(); if(typeof runDataHealthCheckUI==='function')runDataHealthCheckUI()}catch(e){}
  }
  function currentDB(){try{return cleanData(DB||JSON.parse(localStorage.getItem(LOCAL_KEY)||'{}'))}catch(e){return cleanData(DB||{})}}
  function saveSafeSnapshot(reason){
    var db=currentDB(), c=counts(db), crit=criticalFromCounts(c);
    if(crit<=0)return false;
    var item={version:VERSION,reason:reason||'auto',createdAt:now(),counts:c,critical:crit,data:db};
    try{
      localStorage.setItem(SNAP_KEY,JSON.stringify(item));
      localStorage.setItem(SNAP_META_KEY,JSON.stringify({version:VERSION,reason:item.reason,createdAt:item.createdAt,counts:c,critical:crit}));
      updateGuardUI();
      return true;
    }catch(e){console.warn('V39 snapshot skipped',e);return false}
  }
  function readSafeSnapshot(){try{return JSON.parse(localStorage.getItem(SNAP_KEY)||'null')}catch(e){return null}}
  function restoreLocalSnapshot(){
    var snap=readSafeSnapshot();
    if(!snap||!snap.data||criticalCount(snap.data)<=0){toastSafe('لا توجد نسخة محلية آمنة للاسترجاع');return false}
    writeLocal(snap.data);
    toastSafe('تم استرجاع آخر نسخة محلية آمنة');
    return true;
  }
  function localDestructiveReport(){
    var snap=readSafeSnapshot(); if(!snap||!snap.counts)return {danger:false};
    return isDangerousIncoming(counts(currentDB()),snap.counts);
  }
  function protectLocalBeforeUpload(){
    var report=localDestructiveReport();
    if(report.danger){
      var msg='تم منع المزامنة لحماية الداتا: '+report.reasons.join(' — ');
      try{if(confirm(msg+'\n\nهل تريد استرجاع آخر نسخة محلية آمنة الآن؟'))restoreLocalSnapshot()}catch(e){restoreLocalSnapshot()}
      toastSafe('تم إيقاف الرفع حتى لا يتم رفع نسخة ناقصة');
      updateGuardUI('خطر — تم إيقاف الرفع');
      return false;
    }
    saveSafeSnapshot('before-upload-or-save');
    return true;
  }
  async function restoreBestCloud(){
    var res=await jsonp('restoreBestSafetyBackup',{},45000);
    if(!res||res.ok===false)throw new Error((res&&res.message)||'فشل استرجاع أفضل نسخة Google');
    toastSafe('تم استرجاع أفضل نسخة آمنة على Google');
    return res;
  }
  async function cloudPreflight(show){
    var localC=counts(currentDB());
    var status=await jsonp('safetyStatus',{},35000).catch(function(){return jsonp('status',{},35000)});
    if(!status||status.ok===false)throw new Error((status&&status.message)||'تعذر فحص حماية Google');
    var current=status.current||{}, best=status.bestSafetySummary||status.latestUsefulBackup||status.previous||status.current||{};
    var currentC=current.counts||{}, bestC=best.counts||{};
    var currentVsBest=isDangerousIncoming(currentC,bestC);
    if(currentVsBest.danger){
      updateGuardUI('Google الحالي مشبوه — جاري الاسترجاع');
      await restoreBestCloud();
      return {status:status,restored:true};
    }
    var remoteVsLocal=isDangerousIncoming(currentC,localC);
    if(criticalFromCounts(localC)>=5 && remoteVsLocal.danger){
      saveSafeSnapshot('blocked-dangerous-cloud-over-local');
      updateGuardUI('تم منع تحميل Google لأنه أقل من بيانات الجهاز');
      return {status:status,localNewer:true,message:'تم منع تحميل نسخة Google لأنها أقل من نسخة الجهاز'};
    }
    return {status:status,ok:true};
  }
  var oldRefresh=window.refreshCloudData;
  window.refreshCloudData=async function(show){
    saveSafeSnapshot('before-safe-google-refresh');
    try{
      var pf=await cloudPreflight(!!show);
      if(pf.localNewer){
        toastSafe(pf.message+' — سيتم رفع نسخة الجهاز بدل التحميل');
        if(typeof window.manualSync==='function')return window.manualSync(true);
        return false;
      }
    }catch(e){
      toastSafe((e&&e.message)||'فشل فحص الأمان — لم يتم حذف أي بيانات');
      return false;
    }
    return oldRefresh?oldRefresh.apply(this,arguments):false;
  };
  window.loadFromDrive=function(){return window.refreshCloudData(true)};

  var oldManual=window.manualSync;
  window.manualSync=function(){if(!protectLocalBeforeUpload())return false;return oldManual?oldManual.apply(this,arguments):false};
  window.manualSyncNow=function(){return window.manualSync(true)};
  var oldSchedule=window.scheduleSync;
  window.scheduleSync=function(){if(!protectLocalBeforeUpload())return false;return oldSchedule?oldSchedule.apply(this,arguments):false};
  var oldSave=window.save;
  if(oldSave){
    window.save=function(){
      if(!protectLocalBeforeUpload())return false;
      var r=oldSave.apply(this,arguments);
      setTimeout(function(){saveSafeSnapshot('after-save')},300);
      return r;
    };
    try{save=window.save}catch(e){}
  }
  window.hpV39RestoreLocalSnapshot=restoreLocalSnapshot;
  window.hpV39RestoreBestCloud=function(){return restoreBestCloud().then(function(){return window.refreshCloudData(true)}).catch(function(e){toastSafe(e.message||'فشل الاسترجاع')})};
  window.hpV39DataGuardCheck=async function(){
    saveSafeSnapshot('manual-check');
    try{var pf=await cloudPreflight(true);toastSafe(pf.localNewer?'نسخة الجهاز أحدث من Google — تم منع التحميل':'فحص الحماية سليم');updateGuardUI('فحص الحماية سليم');return pf}catch(e){toastSafe(e.message||'تعذر الفحص');updateGuardUI('فشل فحص الحماية');return null}
  };
  window.hpStage6HardReload=async function(){
    saveSafeSnapshot('before-safe-reload');
    try{await cloudPreflight(true)}catch(e){toastSafe((e&&e.message)||'فشل فحص الأمان — سيتم إعادة تحميل الصفحة فقط بدون مسح')}
    var base=location.href.split('?')[0];
    location.href=base+'?v=49finalstable&safeReload='+Date.now();
  };
  function panelHtml(){
    var c=counts(currentDB()), snap=readSafeSnapshot(), sc=snap&&snap.counts;
    return '<div id="hp-v39-guard-panel" class="alert blue" style="border-width:4px;margin:12px 0">'
      +'<div style="font-weight:900;font-size:18px;margin-bottom:6px">قفل حماية الداتا V39</div>'
      +'<div id="hp-v39-guard-line">نسخة الجهاز: '+fmtCounts(c)+'</div>'
      +'<div>آخر نسخة محلية آمنة: '+(sc?fmtCounts(sc):'لا توجد بعد')+'</div>'
      +'<div class="btn-row" style="margin-top:10px"><button class="btn green" onclick="hpV39DataGuardCheck()"><i class="ti ti-shield-check"></i> فحص الحماية</button><button class="btn amber" onclick="hpV39RestoreLocalSnapshot()"><i class="ti ti-rotate-clockwise"></i> استرجاع محلي آمن</button><button class="btn red" onclick="hpV39RestoreBestCloud()"><i class="ti ti-lifebuoy"></i> استرجاع أفضل Google</button></div>'
      +'<div style="font-size:14px;margin-top:8px">أي تحميل أو رفع مشبوه بيتوقف تلقائيًا قبل ما يمسح بيانات سليمة.</div>'
      +'</div>';
  }
  function injectGuardPanel(){
    var target=document.querySelector('#dr-sync .drawer') || document.querySelector('#dr-settings .drawer');
    if(!target)return;
    var old=$('hp-v39-guard-panel'); if(old)old.remove();
    var anchor=target.querySelector('.cloud-status-grid') || target.querySelector('#hp-stage6-settings-body') || target.children[2];
    if(anchor)anchor.insertAdjacentHTML('beforebegin',panelHtml()); else target.insertAdjacentHTML('afterbegin',panelHtml());
  }
  function updateGuardUI(msg){
    var line=$('hp-v39-guard-line');
    if(line){var c=counts(currentDB());line.textContent=(msg?msg+' — ':'')+'نسخة الجهاز: '+fmtCounts(c)}
  }
  var oldOpenSync=window.openSync;
  window.openSync=function(){var r=oldOpenSync?oldOpenSync.apply(this,arguments):undefined;setTimeout(function(){injectGuardPanel();updateGuardUI()},100);return r};
  var oldOpenSettings=window.openSettings;
  window.openSettings=function(){var r=oldOpenSettings?oldOpenSettings.apply(this,arguments):undefined;setTimeout(function(){injectGuardPanel();updateGuardUI()},120);return r};
  function boot(){
    saveSafeSnapshot('boot');
    var rep=localDestructiveReport();
    if(rep.danger){restoreLocalSnapshot();toastSafe('تم استرجاع نسخة محلية آمنة لأن النسخة المفتوحة كانت ناقصة')}
    setInterval(function(){saveSafeSnapshot('auto-interval')},60000);
    setTimeout(function(){try{injectGuardPanel()}catch(e){}},1200);
    setTimeout(function(){
      cloudPreflight(false).then(function(pf){
        if(pf&&pf.restored&&oldRefresh){oldRefresh(false)}
      }).catch(function(e){console.warn('V39 boot cloud preflight skipped',e)});
    },2200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,900)});else setTimeout(boot,900);
  window.HP_V39_GUARD={version:VERSION,counts:counts,criticalCount:criticalCount,saveSafeSnapshot:saveSafeSnapshot,restoreLocalSnapshot:restoreLocalSnapshot,cloudPreflight:cloudPreflight};
})();


/* ===== END SOURCE: 16-v39-data-protection-lock.js ===== */



/* ===== BEGIN SOURCE: 17-v40-image-separation.js ===== */

/* Haydar Pack V40 — Image Separation & Sync Booster
   Scope: move receipt/design image data out of the main JSON database.
   Main DB stores small references only; image data is uploaded separately to Apps Script Drive / Images.
*/
(function(){
  'use strict';
  var VER='40-image-separation';
  var LOCAL_KEY='hayder_bags_app';
  var IMG_PREFIX='hayder_pack_v40_image_';
  var IMG_INDEX_KEY='hayder_pack_v40_image_index';
  var IMG_QUEUE_KEY='hayder_pack_v40_image_queue';
  var URL_KEY='hayder_pack_stage4_backend_url_v32';
  var OLD_URL_KEY='hayder_pack_backend_url_v10';
  var FIXED_URL='https://script.google.com/macros/s/AKfycbw0RxMaw2gNicQjSD5T3LHhd-6d2DnABYKGNNMDD1NN3b09wJL3OatLviAn7xqDu2Zq6w/exec';
  var uploadTimer=null, processing=false, syncDebounce=null;

  function $(id){return document.getElementById(id)}
  function now(){return new Date().toISOString()}
  function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.log(msg)}catch(e){}}
  function clone(v){return JSON.parse(JSON.stringify(v||{}))}
  function n(v){var x=parseFloat(v);return isNaN(x)?0:x}
  function safe(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function normalizeUrl(url){url=String(url||'').trim().replace(/\s+/g,'').replace(/[?#].*$/,'').replace(/\/+$/,'');var m=url.match(/^(https:\/\/script\.google\.com\/macros\/s\/[^\/]+)(?:\/(exec|dev))?$/);return m?m[1]+'/exec':''}
  function backendUrl(){var u='';try{u=localStorage.getItem(URL_KEY)||localStorage.getItem(OLD_URL_KEY)||''}catch(e){} if(!u&&typeof window.HP_APPS_SCRIPT_URL==='string')u=window.HP_APPS_SCRIPT_URL;u=normalizeUrl(u)||FIXED_URL;try{localStorage.setItem(URL_KEY,u);localStorage.setItem(OLD_URL_KEY,u)}catch(e){} window.HP_APPS_SCRIPT_URL=u;return u}
  function jsonp(action,params,timeoutMs){return new Promise(function(resolve,reject){var url=backendUrl(),cb='hpV40_'+Date.now()+'_'+Math.floor(Math.random()*1000000),q='action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();params=params||{};Object.keys(params).forEach(function(k){q+='&'+encodeURIComponent(k)+'='+encodeURIComponent(params[k])});var script=document.createElement('script'),done=false,timer;window[cb]=function(res){done=true;cleanup();resolve(res)};function cleanup(){try{delete window[cb]}catch(e){window[cb]=undefined}if(script&&script.parentNode)script.parentNode.removeChild(script);clearTimeout(timer)}script.onerror=function(){if(!done){cleanup();reject(new Error('تعذر الاتصال بصور Google'))}};timer=setTimeout(function(){if(!done){cleanup();reject(new Error('تحميل/رفع الصور بطيء — سيعاد تلقائيًا'))}},timeoutMs||35000);script.src=url+(url.indexOf('?')>=0?'&':'?')+q;document.head.appendChild(script)})}
  function postForm(action,fields,waitMs){return new Promise(function(resolve){var url=backendUrl(),iframeName='hp_v40_img_post_'+Date.now();var iframe=document.createElement('iframe');iframe.name=iframeName;iframe.style.display='none';var form=document.createElement('form');form.method='POST';form.action=url;form.target=iframeName;form.style.display='none';form.acceptCharset='UTF-8';fields=fields||{};fields.action=action;Object.keys(fields).forEach(function(k){var t=document.createElement('textarea');t.name=k;t.value=String(fields[k]==null?'':fields[k]);form.appendChild(t)});document.body.appendChild(iframe);document.body.appendChild(form);form.submit();setTimeout(function(){try{form.remove();iframe.remove()}catch(e){}resolve({ok:true})},waitMs||2600)})}
  function readIndex(){try{var a=JSON.parse(localStorage.getItem(IMG_INDEX_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
  function saveIndex(arr){try{localStorage.setItem(IMG_INDEX_KEY,JSON.stringify(Array.from(new Set(arr||[]))))}catch(e){}}
  function addIndex(id){var a=readIndex();if(a.indexOf(id)<0){a.push(id);saveIndex(a)}}
  function readQueue(){try{var a=JSON.parse(localStorage.getItem(IMG_QUEUE_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
  function saveQueue(a){try{localStorage.setItem(IMG_QUEUE_KEY,JSON.stringify(Array.from(new Set(a||[]))))}catch(e){}updateImagePanel()}
  function queueImage(id){if(!id)return;var q=readQueue();if(q.indexOf(id)<0){q.push(id);saveQueue(q)}scheduleImageUpload(900)}
  function deQueue(id){saveQueue(readQueue().filter(function(x){return x!==id}))}
  function imgKey(id){return IMG_PREFIX+id}
  function makeId(kind){return 'img_'+String(kind||'image').replace(/[^a-z0-9_-]/gi,'').slice(0,16)+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9)}
  function saveLocalImage(item){if(!item||!item.id||!item.data)return null;item.createdAt=item.createdAt||now();item.updatedAt=now();try{localStorage.setItem(imgKey(item.id),JSON.stringify(item));addIndex(item.id);queueImage(item.id);return item}catch(e){console.error(e);toastSafe('مساحة الجهاز قربت تتملي بسبب الصور — سيتم حفظ المرجع فقط');return item}}
  function getLocalImage(id){try{return JSON.parse(localStorage.getItem(imgKey(id))||'null')}catch(e){return null}}
  function markUploaded(id,meta){var it=getLocalImage(id);if(it){it.uploaded=true;it.uploadedAt=now();it.remote=meta||{};try{localStorage.setItem(imgKey(id),JSON.stringify(it))}catch(e){}}deQueue(id);updateImagePanel()}
  function isDataUrl(s){return typeof s==='string'&&/^data:image\//.test(s)}
  function refFromImageObj(obj,kind){if(!obj)return null;if(obj.ref==='v40-drive-image'&&obj.id)return obj;if(obj.id&&obj.ref)return obj;if(obj.data&&isDataUrl(obj.data)){var id=obj.id||makeId(kind);var item={id:id,kind:kind||'image',name:obj.name||'image.jpg',type:obj.type||'image/jpeg',size:obj.size||obj.data.length,data:obj.data,createdAt:obj.createdAt||now(),source:'v40-migration'};saveLocalImage(item);return {ref:'v40-drive-image',id:id,kind:item.kind,name:item.name,type:item.type,size:item.size,createdAt:item.createdAt,uploaded:false,thumb:''}}return obj}
  function compressFile(file,maxW,maxH,quality,cb){if(!file){cb(null);return}if(!/^image\//.test(file.type||'')){toastSafe('اختار ملف صورة فقط');cb(null);return}var reader=new FileReader();reader.onerror=function(){toastSafe('تعذر قراءة الصورة');cb(null)};reader.onload=function(ev){var img=new Image();img.onerror=function(){toastSafe('تعذر تجهيز الصورة');cb(null)};img.onload=function(){try{var w=img.width||1,h=img.height||1,scale=Math.min(1,(maxW||900)/w,(maxH||900)/h);var canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));var ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);var q=quality||0.58;var data=canvas.toDataURL('image/jpeg',q);if(data.length>260000){data=canvas.toDataURL('image/jpeg',0.45)}if(data.length>420000){var c2=document.createElement('canvas'),sc=Math.sqrt(380000/data.length);c2.width=Math.max(1,Math.round(canvas.width*sc));c2.height=Math.max(1,Math.round(canvas.height*sc));c2.getContext('2d').drawImage(canvas,0,0,c2.width,c2.height);data=c2.toDataURL('image/jpeg',0.42)}cb({name:file.name,type:'image/jpeg',size:data.length,data:data,compressed:true,width:canvas.width,height:canvas.height})}catch(e){console.error(e);cb({name:file.name,type:file.type||'image/jpeg',size:file.size||0,data:ev.target.result,compressed:false})}};img.src=ev.target.result};reader.readAsDataURL(file)}
  function db(){try{return DB||JSON.parse(localStorage.getItem(LOCAL_KEY)||'{}')}catch(e){return DB||{}}}
  function migrateImagesInDB(reason){var d=db(),changed=false;if(!d||typeof d!=='object')return false;['payments','transfers'].forEach(function(k){(d[k]||[]).forEach(function(x){if(x&&x.receipt&&x.receipt.data){x.receipt=refFromImageObj(x.receipt,k==='payments'?'payment-receipt':'transfer-receipt');changed=true}})});(d.orders||[]).forEach(function(o){if(o&&o.designImage&&o.designImage.data){o.designImage=refFromImageObj(o.designImage,'order-design');changed=true}});if(changed){try{DB=d;localStorage.setItem(LOCAL_KEY,JSON.stringify(d));setTimeout(function(){try{if(typeof window.scheduleSync==='function')window.scheduleSync()}catch(e){}},700)}catch(e){console.error(e)}toastSafe('V40: تم فصل الصور عن ملف الداتا وتسريع المزامنة')}return changed}
  var oldReduce=window.reduceDBForStorage;
  window.reduceDBForStorage=function(){try{migrateImagesInDB('reduce')}catch(e){console.warn(e)}if(typeof oldReduce==='function'){try{return oldReduce.apply(this,arguments)}catch(e){console.warn(e)}}};
  try{reduceDBForStorage=window.reduceDBForStorage}catch(e){}

  var oldSave=window.save;
  if(typeof oldSave==='function'){
    window.save=function(){try{migrateImagesInDB('before-save')}catch(e){}return oldSave.apply(this,arguments)};
    try{save=window.save}catch(e){}
  }

  window.compressedImageFile=function(file,maxW,maxH,quality,cb){compressFile(file,maxW||900,maxH||900,quality||0.58,cb)};
  window.previewReceipt=function(input,imgId){var file=input.files&&input.files[0];if(!file)return;toastSafe('جاري ضغط الإيصال وفصله عن ملف الداتا...');compressFile(file,900,900,0.55,function(obj){if(!obj)return;var kind=imgId&&imgId.indexOf('pay')===0?'payment-receipt':'transfer-receipt';obj.id=makeId(kind);obj.kind=kind;saveLocalImage(obj);var ref={ref:'v40-drive-image',id:obj.id,kind:kind,name:obj.name,type:obj.type,size:obj.size,createdAt:obj.createdAt,uploaded:false};if(imgId&&imgId.indexOf('pay')===0)lastReceiptPreview.payment=ref;else lastReceiptPreview.transfer=ref;var img=$(imgId);if(img){img.src=obj.data;img.classList.remove('hide')}toastSafe('تم تجهيز الإيصال — سيترفع تلقائيًا خارج ملف الداتا')})};
  window.previewDesignImage=function(input){var file=input.files&&input.files[0];if(!file)return;toastSafe('جاري ضغط صورة التصميم وفصلها عن ملف الداتا...');compressFile(file,1000,1000,0.58,function(obj){if(!obj)return;obj.id=makeId('order-design');obj.kind='order-design';saveLocalImage(obj);currentDesignImage={ref:'v40-drive-image',id:obj.id,kind:'order-design',name:obj.name,type:obj.type,size:obj.size,createdAt:obj.createdAt,uploaded:false};var img=$('o-design-preview');if(img){img.src=obj.data;img.classList.remove('hide')}toastSafe('تم تجهيز صورة التصميم — سيترفع تلقائيًا خارج ملف الداتا')})};
  async function loadImageData(id){var local=getLocalImage(id);if(local&&local.data)return local.data;var res=await jsonp('imageGet',{id:id},45000);if(!res||res.ok===false||!res.data)throw new Error((res&&res.message)||'لم يتم العثور على الصورة');try{saveLocalImage({id:id,kind:res.kind||'image',name:res.name||id,type:res.type||'image/jpeg',size:res.size||res.data.length,data:res.data,uploaded:true,uploadedAt:now(),source:'cloud-cache'})}catch(e){}return res.data}
  window.hpV40OpenImage=function(id,title){if(!id){toastSafe('لا توجد صورة');return}var w=window.open('','_blank');if(!w){toastSafe('المتصفح منع فتح الصورة. اسمح بالـ Popups.');return}w.document.open();w.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>'+safe(title||'صورة')+'</title><style>body{margin:0;background:#111;color:#fff;font-family:Arial,Tahoma,sans-serif;text-align:center}.bar{position:sticky;top:0;background:#000;padding:10px;display:flex;gap:8px;justify-content:center;z-index:2}.bar button{font-size:16px;font-weight:900;padding:8px 14px;border:2px solid #fff;border-radius:8px;background:#fff;color:#000}.msg{padding:20px;font-size:20px;font-weight:900}img{max-width:98vw;max-height:calc(100vh - 70px);object-fit:contain;margin-top:8px;background:#fff}</style></head><body><div class="bar"><button onclick="window.print()">طباعة</button><button onclick="window.close()">إغلاق</button></div><div class="msg" id="m">جاري تحميل الصورة...</div><img id="im" alt="صورة" style="display:none"></body></html>');w.document.close();loadImageData(id).then(function(src){try{w.document.getElementById('m').style.display='none';var im=w.document.getElementById('im');im.src=src;im.style.display='inline-block'}catch(e){}}).catch(function(e){try{w.document.getElementById('m').textContent=(e&&e.message)||'تعذر تحميل الصورة'}catch(_){}})};
  var oldReceiptLink=window.receiptLink;
  window.receiptLink=function(r){if(!r)return '';if(r.id){return '<button type="button" class="btn small" onclick="hpV40OpenImage(\''+safe(r.id)+'\',\'إيصال\')"><i class="ti ti-photo"></i> عرض الإيصال</button>'}if(r.data){var ref=refFromImageObj(r,'legacy-receipt');return ref&&ref.id?'<button type="button" class="btn small" onclick="hpV40OpenImage(\''+safe(ref.id)+'\',\'إيصال\')"><i class="ti ti-photo"></i> عرض الإيصال</button>':(oldReceiptLink?oldReceiptLink(r):'')}return oldReceiptLink?oldReceiptLink(r):''};
  var oldOpenOrderForm=window.openOrderForm;
  if(typeof oldOpenOrderForm==='function'){
    window.openOrderForm=function(id){var r=oldOpenOrderForm.apply(this,arguments);setTimeout(function(){try{if(currentDesignImage&&currentDesignImage.id&&!currentDesignImage.data){var local=getLocalImage(currentDesignImage.id);if(local&&local.data){var img=$('o-design-preview');if(img){img.src=local.data;img.classList.remove('hide')}}else{loadImageData(currentDesignImage.id).then(function(src){var img=$('o-design-preview');if(img){img.src=src;img.classList.remove('hide')}}).catch(function(){})}}}catch(e){}},100);return r};
  }
  async function processQueue(){if(processing)return;var q=readQueue();if(!q.length){updateImagePanel();return}if(!navigator.onLine){scheduleImageUpload(10000);return}processing=true;try{for(var i=0;i<Math.min(3,q.length);i++){var id=q[i],it=getLocalImage(id);if(!it||!it.data){deQueue(id);continue}try{await postForm('imagePut',{id:it.id,kind:it.kind||'image',name:it.name||it.id,type:it.type||'image/jpeg',size:it.size||it.data.length,data:it.data},2800);var meta=await jsonp('imageMeta',{id:it.id},25000);if(meta&&meta.ok){markUploaded(id,meta)}else throw new Error((meta&&meta.message)||'لم يتم تأكيد رفع الصورة')}catch(e){console.warn('image upload retry',e);scheduleImageUpload(20000);break}}}finally{processing=false;updateImagePanel();if(readQueue().length)scheduleImageUpload(12000)}}
  function scheduleImageUpload(delay){clearTimeout(uploadTimer);uploadTimer=setTimeout(processQueue,delay==null?1800:delay)}
  function imageStats(){var ids=readIndex(),q=readQueue(),uploaded=0,local=0,bytes=0;ids.forEach(function(id){var it=getLocalImage(id);if(it){local++;bytes+=n(it.size)||(it.data?it.data.length:0);if(it.uploaded)uploaded++}});return {total:ids.length,local:local,uploaded:uploaded,queue:q.length,bytes:bytes}}
  function updateImagePanel(){var s=imageStats();var line=$('hp-v40-image-line');if(line)line.textContent='الصور المفصولة: '+s.total+' — مرفوع: '+s.uploaded+' — في انتظار الرفع: '+s.queue+' — كاش محلي تقريبًا: '+Math.round(s.bytes/1024)+' KB'}
  function injectPanel(){var target=document.querySelector('#dr-sync .drawer')||document.querySelector('#dr-settings .drawer');if(!target)return;var old=$('hp-v40-image-panel');if(old)old.remove();var html='<div id="hp-v40-image-panel" class="alert green" style="border-width:4px;margin:12px 0"><div style="font-weight:900;font-size:18px;margin-bottom:6px">V40 فصل الصور وتسريع المزامنة</div><div id="hp-v40-image-line">...</div><div class="btn-row" style="margin-top:10px"><button class="btn green" onclick="hpV40ImageCheck()"><i class="ti ti-photo-check"></i> فحص الصور</button><button class="btn blue" onclick="hpV40UploadImagesNow()"><i class="ti ti-cloud-up"></i> رفع الصور المعلقة الآن</button></div><div style="font-size:14px;margin-top:8px">الإيصالات وصور التصميم الجديدة لا تدخل داخل ملف الداتا الرئيسي؛ ده يقلل البطء وخطر فشل المزامنة.</div></div>';var anchor=$('hp-v39-guard-panel')||target.querySelector('.cloud-status-grid')||target.children[2];if(anchor)anchor.insertAdjacentHTML('afterend',html);else target.insertAdjacentHTML('afterbegin',html);updateImagePanel()}
  window.hpV40ImageCheck=function(){migrateImagesInDB('manual-check');processQueue();updateImagePanel();toastSafe('تم فحص الصور وتشغيل الرفع التلقائي')};
  window.hpV40UploadImagesNow=function(){processQueue();toastSafe('جاري رفع الصور المعلقة تلقائيًا')};
  var oldOpenSync=window.openSync;
  window.openSync=function(){var r=oldOpenSync?oldOpenSync.apply(this,arguments):undefined;setTimeout(function(){injectPanel();updateImagePanel()},150);return r};
  var oldOpenSettings=window.openSettings;
  window.openSettings=function(){var r=oldOpenSettings?oldOpenSettings.apply(this,arguments):undefined;setTimeout(function(){injectPanel();updateImagePanel()},180);return r};
  function boot(){try{migrateImagesInDB('boot')}catch(e){console.warn(e)}scheduleImageUpload(2500);setInterval(function(){try{migrateImagesInDB('interval');processQueue()}catch(e){}},60000);setTimeout(function(){try{injectPanel()}catch(e){}},1800)}
  window.addEventListener('online',function(){scheduleImageUpload(1000)});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)scheduleImageUpload(1000)});
  document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,900)});
  window.addEventListener('load',function(){setTimeout(boot,1200)});
  setTimeout(boot,2500);
  window.HP_V40_IMAGES={version:VER,backendUrl:backendUrl,migrate:migrateImagesInDB,processQueue:processQueue,stats:imageStats,loadImage:loadImageData};
})();


/* ===== END SOURCE: 17-v40-image-separation.js ===== */



/* ===== BEGIN SOURCE: 18-v41-backup-center-simple-ui.js ===== */

/* Haydar Pack V41 — Backup Center + Simple Sync UI
   Scope: sync/backup UI only. Does not alter clients/orders/invoices/calculations. */
(function(){
  'use strict';
  var VERSION='49.0.0-final-stable';
  var SITE_VERSION='49finalstable';
  var LOCAL_KEY='hayder_bags_app';
  var META_KEY='hayder_pack_sync_meta_v37';
  var PENDING_KEY='hayder_pack_sync_pending_v37';
  var URL_KEY='hayder_pack_stage4_backend_url_v32';
  var OLD_URL_KEY='hayder_pack_backend_url_v10';
  var FIXED_URL='https://script.google.com/macros/s/AKfycbw0RxMaw2gNicQjSD5T3LHhd-6d2DnABYKGNNMDD1NN3b09wJL3OatLviAn7xqDu2Zq6w/exec';
  var statusCache=null, loadingBackups=false, observer=null, lastAutoBackupAt=0, booted=false, simpleTimer=null;

  function $(id){return document.getElementById(id)}
  function q(sel,root){return (root||document).querySelector(sel)}
  function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function safe(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function now(){return new Date().toISOString()}
  function arr(v){return Array.isArray(v)?v:[]}
  function clone(v){return JSON.parse(JSON.stringify(v||{}))}
  function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.log(msg)}catch(e){}}
  function cleanData(input){
    var db=clone(input||{});
    ['clients','factories','orders','payments','transfers','expenses','capitalMoves','deletedItems','deletedLog','deletedArchive'].forEach(function(k){if(!Array.isArray(db[k]))db[k]=[]});
    if(!db.settings||typeof db.settings!=='object'||Array.isArray(db.settings))db.settings={};
    if(!Array.isArray(db.settings.extraMonths))db.settings.extraMonths=[];
    db.settings.autoSync=false;
    db._id=Number(db._id)||1;
    db.version=Math.max(Number(db.version)||0,11);
    return db;
  }
  function currentDB(){try{return cleanData(window.DB||JSON.parse(localStorage.getItem(LOCAL_KEY)||'{}'))}catch(e){return cleanData(window.DB||{})}}
  function counts(db){db=db||{};return {
    clients:arr(db.clients).length,factories:arr(db.factories).length,orders:arr(db.orders).length,payments:arr(db.payments).length,
    transfers:arr(db.transfers).length,expenses:arr(db.expenses).length,capitalMoves:arr(db.capitalMoves).length,
    deleted:arr(db.deletedItems).length+arr(db.deletedLog).length+arr(db.deletedArchive).length
  }}
  function usefulFromCounts(c){c=c||{};return (c.clients||0)+(c.orders||0)+(c.payments||0)+(c.transfers||0)+(c.expenses||0)+(c.capitalMoves||0)+(c.deleted||0)}
  function fmtCounts(c){c=c||{};return 'عملاء: '+(c.clients||0)+' | مصانع: '+(c.factories||0)+' | أوردرات: '+(c.orders||0)+' | دفعات: '+(c.payments||0)}
  function fmtTime(v){if(!v)return 'لا توجد بعد';try{return new Date(v).toLocaleString('ar-EG')}catch(e){return String(v)}}
  function readMeta(){try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')||{}}catch(e){return {}}}
  function readPending(){try{return JSON.parse(localStorage.getItem(PENDING_KEY)||'null')}catch(e){return null}}
  function pendingCount(){return readPending()?1:0}
  function backendUrl(){
    var url='';try{url=localStorage.getItem(URL_KEY)||localStorage.getItem(OLD_URL_KEY)||''}catch(e){}
    if(!url&&window.HP_V37_SYNC&&typeof window.HP_V37_SYNC.backendUrl==='function'){try{url=window.HP_V37_SYNC.backendUrl()}catch(e){}}
    if(!url&&typeof window.HP_APPS_SCRIPT_URL==='string')url=window.HP_APPS_SCRIPT_URL;
    url=String(url||FIXED_URL).trim().replace(/\s+/g,'').replace(/[?#].*$/,'').replace(/\/+$/,'');
    var m=url.match(/^(https:\/\/script\.google\.com\/macros\/s\/[^\/]+)(?:\/(exec|dev))?$/);
    url=m?m[1]+'/exec':FIXED_URL;
    try{localStorage.setItem(URL_KEY,url);localStorage.setItem(OLD_URL_KEY,url)}catch(e){}
    window.HP_APPS_SCRIPT_URL=url;
    return url;
  }
  function jsonp(action,params,timeoutMs){
    return new Promise(function(resolve,reject){
      var url=backendUrl(), cb='hpV41_'+Date.now()+'_'+Math.floor(Math.random()*1000000);
      var q='action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&clientAppVersion='+encodeURIComponent(VERSION)+'&siteVersion='+encodeURIComponent(SITE_VERSION)+'&_='+Date.now();
      params=params||{};Object.keys(params).forEach(function(k){q+='&'+encodeURIComponent(k)+'='+encodeURIComponent(params[k])});
      var script=document.createElement('script'),done=false,timer;
      window[cb]=function(res){done=true;cleanup();resolve(res)};
      function cleanup(){try{delete window[cb]}catch(e){window[cb]=undefined}if(script&&script.parentNode)script.parentNode.removeChild(script);clearTimeout(timer)}
      script.onerror=function(){if(!done){cleanup();reject(new Error('تعذر الاتصال بـ Apps Script'))}};
      timer=setTimeout(function(){if(!done){cleanup();reject(new Error('الاتصال بطيء — لم يتم حذف أي بيانات'))}},timeoutMs||30000);
      script.src=url+(url.indexOf('?')>=0?'&':'?')+q;document.head.appendChild(script);
    });
  }
  function postForm(action,fields,waitMs){
    return new Promise(function(resolve){
      var url=backendUrl(), iframeName='hp_v41_post_'+Date.now();
      var iframe=document.createElement('iframe');iframe.name=iframeName;iframe.style.display='none';
      var form=document.createElement('form');form.method='POST';form.action=url;form.target=iframeName;form.style.display='none';form.acceptCharset='UTF-8';
      fields=fields||{};fields.action=action;fields.appVersion=VERSION;fields.siteVersion=SITE_VERSION;
      Object.keys(fields).forEach(function(k){var t=document.createElement('textarea');t.name=k;t.value=String(fields[k]==null?'':fields[k]);form.appendChild(t)});
      document.body.appendChild(iframe);document.body.appendChild(form);form.submit();
      setTimeout(function(){try{form.remove();iframe.remove()}catch(e){}resolve({ok:true})},waitMs||2600);
    });
  }
  function injectStyle(){
    if($('hp-v41-style'))return;
    var st=document.createElement('style');st.id='hp-v41-style';
    st.textContent='\n#dr-sync .hp-v41-hidden{display:none!important}\n#hp-v41-sync-ui{margin:12px 0}\n.hp-v41-card{border:4px solid #000;border-radius:18px;background:#fff;padding:14px;margin:10px 0;box-shadow:0 3px 0 #000}\n.hp-v41-summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}\n.hp-v41-mini{border:3px solid #000;border-radius:14px;padding:10px;background:#f8fbff;font-weight:900}\n.hp-v41-mini b{display:block;font-size:13px;margin-bottom:4px;color:#123}\n.hp-v41-counts{font-size:16px;font-weight:900;line-height:1.8}\n.hp-v41-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.hp-v41-actions .btn{flex:1;min-width:180px}\n.hp-v41-backup-list{display:grid;gap:10px;margin-top:10px}.hp-v41-backup-item{border:3px solid #000;border-radius:15px;background:#fff;padding:12px;font-weight:900}.hp-v41-backup-item .muted{font-size:13px;opacity:.8;line-height:1.6}.hp-v41-danger-note{border:3px dashed #8a4b00;background:#fff2d5;border-radius:14px;padding:10px;margin-top:10px;font-weight:900}.hp-v41-pill{display:inline-block;border:2px solid #000;border-radius:999px;padding:4px 10px;margin:2px;background:#e8f2ff;font-size:13px;font-weight:900}\n@media(max-width:520px){.hp-v41-summary{grid-template-columns:1fr}.hp-v41-actions .btn{min-width:100%}}\n';
    document.head.appendChild(st);
  }
  function currentStatusText(){
    var meta=readMeta(), c=counts(currentDB()), pend=pendingCount();
    var health=$('data-health-status'), conn=$('cloud-connection-status');
    return {
      conn: conn?conn.textContent:(navigator.onLine?'متصل':'أوفلاين'),
      health: health?health.textContent:(usefulFromCounts(c)>0?'سليمة':'تحتاج مراجعة'),
      last: meta.lastCloudSaveAt||meta.updatedAt||'',
      revision: meta.revision||'',
      counts:c,
      pending:pend
    };
  }
  function simpleHtml(){
    var s=currentStatusText(), imgStats=null;
    try{if(window.HP_V40_IMAGES&&typeof window.HP_V40_IMAGES.stats==='function')imgStats=window.HP_V40_IMAGES.stats()}catch(e){}
    return '<div id="hp-v41-sync-ui" class="alert blue" style="border-width:4px">'
      +'<div style="font-size:22px;font-weight:900;margin-bottom:6px"><i class="ti ti-shield-check"></i> المزامنة والحماية</div>'
      +'<div style="font-weight:900;line-height:1.7">استخدم زر واحد يوميًا. أدوات الاسترجاع والنسخ موجودة داخل مركز النسخ الاحتياطي فقط.</div>'
      +'<div class="hp-v41-summary">'
      +'<div class="hp-v41-mini"><b>الحالة</b><span id="hp-v41-conn">'+safe(s.conn)+'</span></div>'
      +'<div class="hp-v41-mini"><b>آخر حفظ Google</b><span id="hp-v41-last">'+safe(fmtTime(s.last))+'</span></div>'
      +'<div class="hp-v41-mini"><b>حالة الداتا</b><span id="hp-v41-health">'+safe(s.health)+'</span></div>'
      +'<div class="hp-v41-mini"><b>حركات في انتظار الرفع</b><span id="hp-v41-pending">'+safe(String(s.pending))+'</span></div>'
      +'</div>'
      +'<div class="hp-v41-counts" id="hp-v41-counts">'+safe(fmtCounts(s.counts))+'</div>'
      +(imgStats?'<div class="hp-v41-counts" id="hp-v41-images">صور مفصولة: '+safe(imgStats.total)+' | في انتظار الرفع: '+safe(imgStats.queue)+'</div>':'')
      +'<div class="hp-v41-actions"><button class="btn green" onclick="hpV41SyncProtectNow()"><i class="ti ti-cloud-check"></i> مزامنة وحماية الآن</button><button class="btn blue" onclick="hpV41ToggleBackupCenter()"><i class="ti ti-database"></i> مركز النسخ الاحتياطي</button></div>'
      +'<div id="hp-v41-working" class="hp-v41-danger-note" style="display:none"></div>'
      +'<div id="hp-v41-backup-center" class="hp-v41-card" style="display:none"></div>'
      +'</div>';
  }
  function ensureSimplePanel(){
    injectStyle();
    var drawer=q('#dr-sync .drawer'); if(!drawer)return null;
    if(!$('hp-v41-sync-ui')){
      var title=drawer.querySelector('.drawer-title');
      if(title)title.insertAdjacentHTML('afterend',simpleHtml()); else drawer.insertAdjacentHTML('afterbegin',simpleHtml());
    }
    updateSimpleUI();
    hideLegacySyncUI();
    return $('hp-v41-sync-ui');
  }
  function hideLegacySyncUI(){
    var drawer=q('#dr-sync .drawer'); if(!drawer)return;
    qa(':scope > *',drawer).forEach(function(ch){
      var id=ch.id||'';
      if(ch.classList.contains('drawer-handle')||ch.classList.contains('drawer-title')||id==='hp-v41-sync-ui'||id==='cloud-import-input')return;
      if(id==='sync-status'){ch.classList.add('hp-v41-hidden');return;}
      if(ch.tagName==='BUTTON' && /إغلاق/.test(ch.textContent||''))return;
      ch.classList.add('hp-v41-hidden');
    });
    ['hp-v37-sync-panel','hp-v39-guard-panel','hp-v40-image-panel','cloud-conflict-area','data-health-details'].forEach(function(id){var el=$(id);if(el)el.classList.add('hp-v41-hidden')});
  }
  function updateSimpleUI(){
    var s=currentStatusText(), imgStats=null;
    try{if(window.HP_V40_IMAGES&&typeof window.HP_V40_IMAGES.stats==='function')imgStats=window.HP_V40_IMAGES.stats()}catch(e){}
    var el;
    if((el=$('hp-v41-conn')))el.textContent=s.conn;
    if((el=$('hp-v41-last')))el.textContent=fmtTime(s.last);
    if((el=$('hp-v41-health')))el.textContent=s.health;
    if((el=$('hp-v41-pending')))el.textContent=String(s.pending);
    if((el=$('hp-v41-counts')))el.textContent=fmtCounts(s.counts);
    if((el=$('hp-v41-images'))&&imgStats)el.textContent='صور مفصولة: '+imgStats.total+' | في انتظار الرفع: '+imgStats.queue;
  }
  function setWorking(msg,type){var el=$('hp-v41-working'); if(!el)return; el.style.display=msg?'block':'none'; el.textContent=msg||''; el.style.background=type==='ok'?'#d8f6e4':(type==='err'?'#ffe0e0':'#fff2d5')}
  async function autoSafetySnapshot(reason){
    try{if(window.HP_V39_GUARD&&typeof window.HP_V39_GUARD.saveSafeSnapshot==='function')window.HP_V39_GUARD.saveSafeSnapshot(reason||'v41')}catch(e){}
  }
  async function throttledCloudBackup(reason){
    var t=Date.now(); if(t-lastAutoBackupAt<10*60*1000)return null; lastAutoBackupAt=t;
    try{return await jsonp('backup',{reason:reason||'V41Auto'},35000)}catch(e){console.warn('auto backup skipped',e);return null}
  }
  window.hpV41SyncProtectNow=async function(){
    ensureSimplePanel(); setWorking('جاري فحص الحماية والمزامنة...', 'work');
    try{
      await autoSafetySnapshot('v41-sync-now');
      if(window.HP_V39_GUARD&&typeof window.HP_V39_GUARD.cloudPreflight==='function'){
        try{await window.HP_V39_GUARD.cloudPreflight(true)}catch(e){console.warn(e)}
      }
      if(typeof window.refreshCloudData==='function')await window.refreshCloudData(true);
      try{if(window.HP_V40_IMAGES&&typeof window.HP_V40_IMAGES.processQueue==='function')window.HP_V40_IMAGES.processQueue()}catch(e){}
      await loadBackupStatus(false);
      updateSimpleUI(); setWorking('تمت المزامنة والفحص. لا توجد خطوات مطلوبة.', 'ok');
      toastSafe('تمت المزامنة والحماية');
    }catch(e){console.error(e);setWorking((e&&e.message)||'تعذر إتمام المزامنة — لم يتم حذف أي بيانات', 'err');toastSafe((e&&e.message)||'تعذر المزامنة')}
  };
  function centerBaseHtml(status){
    var cur=status&&status.current, prev=status&&status.previous, latest=status&&status.latestUsefulBackup, backups=(status&&status.backups)||[];
    var localC=counts(currentDB()), meta=readMeta();
    var html='<div style="font-size:20px;font-weight:900;margin-bottom:8px"><i class="ti ti-database"></i> مركز النسخ الاحتياطي V41</div>';
    html+='<div class="hp-v41-summary">'
      +'<div class="hp-v41-mini"><b>Google الحالي</b>'+(cur?safe(fmtCounts(cur.counts))+'<br><span class="muted">Rev '+safe(cur.revision)+' — '+safe(fmtTime(cur.updatedAt))+'</span>':'لم يتم التحميل')+'</div>'
      +'<div class="hp-v41-mini"><b>الجهاز الحالي</b>'+safe(fmtCounts(localC))+'<br><span class="muted">Rev '+safe(meta.revision||'—')+' — '+safe(fmtTime(meta.lastLocalSaveAt||meta.lastCloudSaveAt||meta.updatedAt))+'</span></div>'
      +'<div class="hp-v41-mini"><b>آخر Backup</b>'+(latest?safe(fmtCounts(latest.counts))+'<br><span class="muted">'+safe(latest.name)+'<br>'+safe(fmtTime(latest.createdAt||latest.updatedAt))+'</span>':'لا يوجد')+'</div>'
      +'<div class="hp-v41-mini"><b>عدد النسخ المعروضة</b>'+safe(String(backups.length))+'</div>'
      +'</div>';
    html+='<div class="hp-v41-actions"><button class="btn green" onclick="hpV41CreateBackup()"><i class="ti ti-cloud-download"></i> إنشاء Backup الآن</button><button class="btn" onclick="downloadManualBackup()"><i class="ti ti-download"></i> تنزيل نسخة على الجهاز</button></div>';
    html+='<div class="hp-v41-backup-list" id="hp-v41-backup-list">';
    if(!backups.length) html+='<div class="hp-v41-backup-item">لا توجد نسخ احتياطية معروضة حتى الآن.</div>';
    backups.forEach(function(b,i){
      var name=String(b.name||''), disabled=b.error?' disabled':'';
      html+='<div class="hp-v41-backup-item">'
        +'<div>نسخة '+safe(String(i+1))+' — '+safe(fmtTime(b.createdAt||b.updatedAt))+'</div>'
        +'<div class="muted">'+safe(name)+'</div>'
        +(b.error?'<div class="muted" style="color:#900">غير صالح: '+safe(b.error)+'</div>':'<div class="muted">'+safe(fmtCounts(b.counts))+' | Rev '+safe(b.revision||0)+' | useful '+safe(b.usefulCount||0)+'</div>')
        +'<div class="hp-v41-actions"><button class="btn amber" '+disabled+' onclick="hpV41RestoreBackup('+JSON.stringify(name).replace(/</g,'\\u003c')+')"><i class="ti ti-restore"></i> استرجاع هذه النسخة</button></div>'
        +'</div>';
    });
    html+='</div>';
    html+='<details class="hp-v41-danger-note"><summary style="cursor:pointer;font-size:17px">أدوات طوارئ متقدمة</summary>'
      +'<div style="margin-top:10px;line-height:1.7">استخدمها فقط لو الداتا ناقصة أو محتاج استرجاع. الأدوات مخفية عشان المستخدم اليومي مايستخدمهاش بالغلط.</div>'
      +'<div class="hp-v41-actions"><button class="btn amber" onclick="restorePreviousGoogleData()">استرجاع النسخة السابقة</button><button class="btn red" onclick="restoreLatestGoogleBackup()">استرجاع أحدث Backup</button><button class="btn" onclick="hpV39RestoreLocalSnapshot()">استرجاع محلي آمن</button></div>'
      +'<div class="hp-v41-actions"><button class="btn" onclick="runDataHealthCheckUI();toast(\'تم فحص قاعدة البيانات\')">فحص قاعدة البيانات</button><button class="btn" onclick="hpV40ImageCheck()">فحص الصور</button><button class="btn amber" onclick="triggerCloudImport()">استيراد داتا قديمة</button></div>'
      +'<div class="hp-v41-actions"><button class="btn blue" onclick="hpStage6HardReload()">إعادة تحميل آمن</button><button class="btn green" onclick="hpV41SyncProtectNow()">مزامنة وحماية الآن</button></div>'
      +'</details>';
    return html;
  }
  async function loadBackupStatus(showBusy){
    if(loadingBackups)return statusCache;
    loadingBackups=true;
    try{
      if(showBusy)setWorking('جاري تحميل سجل النسخ الاحتياطي...', 'work');
      var res=await jsonp('backupCenterStatus',{},45000).catch(async function(){
        var s=await jsonp('safetyStatus',{},35000); var l=await jsonp('listBackups',{},35000).catch(function(){return {backups:[]}}); s.backups=l.backups||[]; return s;
      });
      if(!res||res.ok===false)throw new Error((res&&res.message)||'تعذر تحميل مركز النسخ');
      statusCache=res;
      var center=$('hp-v41-backup-center'); if(center)center.innerHTML=centerBaseHtml(res);
      updateSimpleUI();
      if(showBusy)setWorking('', 'ok');
      return res;
    }finally{loadingBackups=false}
  }
  window.hpV41ToggleBackupCenter=function(){
    ensureSimplePanel(); var c=$('hp-v41-backup-center'); if(!c)return;
    var willOpen=c.style.display==='none'||!c.style.display; c.style.display=willOpen?'block':'none';
    if(willOpen){c.innerHTML='<div class="hp-v41-backup-item">جاري تحميل سجل النسخ...</div>';loadBackupStatus(true).catch(function(e){c.innerHTML='<div class="hp-v41-backup-item" style="background:#ffe0e0">'+safe(e.message||'تعذر التحميل')+'</div>'})}
  };
  window.hpV41CreateBackup=async function(){
    ensureSimplePanel(); setWorking('جاري إنشاء Backup على Google...', 'work');
    try{await autoSafetySnapshot('v41-manual-backup'); var res=await jsonp('backup',{reason:'V41Manual'},45000); if(!res||res.ok===false)throw new Error((res&&res.message)||'تعذر إنشاء Backup'); toastSafe('تم إنشاء Backup'); await loadBackupStatus(false); setWorking('تم إنشاء Backup بنجاح', 'ok')}catch(e){setWorking(e.message||'فشل إنشاء Backup','err');toastSafe(e.message||'فشل إنشاء Backup')}
  };
  function applyRemoteLocal(res,msg){
    if(!res||!res.data)throw new Error('النسخة المسترجعة لم ترجع داتا صالحة');
    window.DB=cleanData(res.data);
    try{if(typeof migrate==='function')migrate()}catch(e){}
    try{if(typeof reduceDBForStorage==='function')reduceDBForStorage()}catch(e){}
    localStorage.setItem(LOCAL_KEY,JSON.stringify(window.DB));
    try{localStorage.removeItem(PENDING_KEY)}catch(e){}
    var meta=readMeta(); meta.revision=Number(res.revision)||meta.revision||0; meta.updatedAt=res.updatedAt||meta.updatedAt||now(); meta.lastCloudSaveAt=meta.updatedAt; meta.ackHash=res.checksum||meta.ackHash||''; meta.lastError=''; localStorage.setItem(META_KEY,JSON.stringify(meta));
    try{if(typeof refreshAll==='function')refreshAll(); if(typeof runDataHealthCheckUI==='function')runDataHealthCheckUI()}catch(e){}
    updateSimpleUI(); toastSafe(msg||'تم استرجاع النسخة');
  }
  window.hpV41RestoreBackup=async function(name){
    if(!name)return;
    var ok=confirm('هتسترجع النسخة دي وتستبدل الداتا الحالية بها بعد إنشاء Backup قبل الاسترجاع:\n\n'+name+'\n\nهل أنت متأكد؟'); if(!ok)return;
    ensureSimplePanel(); setWorking('جاري استرجاع النسخة المحددة...', 'work');
    try{await autoSafetySnapshot('v41-before-restore-named'); await throttledCloudBackup('BeforeNamedRestore'); var res=await jsonp('restoreBackupByName',{name:name},60000); if(!res||res.ok===false)throw new Error((res&&res.message)||'فشل الاسترجاع'); applyRemoteLocal(res,'تم استرجاع النسخة المحددة'); await loadBackupStatus(false); setWorking('تم الاسترجاع بنجاح', 'ok')}catch(e){console.error(e);setWorking(e.message||'فشل الاسترجاع','err');toastSafe(e.message||'فشل الاسترجاع')}
  };
  function wrapCritical(fnName,reason){
    var old=window[fnName]; if(typeof old!=='function'||old.__hpv41Wrapped)return;
    var wrapped=function(){try{autoSafetySnapshot('before-'+reason);throttledCloudBackup('Before_'+reason)}catch(e){} return old.apply(this,arguments)};
    wrapped.__hpv41Wrapped=true; window[fnName]=wrapped;
  }
  function preventOldUrl(){
    try{
      var params=new URLSearchParams(location.search), v=params.get('v')||'';
      if(v && v!==SITE_VERSION){params.set('v',SITE_VERSION); history.replaceState(null,'',location.pathname+'?'+params.toString()+location.hash)}
    }catch(e){}
  }
  function boot(){
    preventOldUrl(); injectStyle(); ensureSimplePanel();
    wrapCritical('deleteClient','delete-client'); wrapCritical('deleteOrder','delete-order'); wrapCritical('triggerCloudImport','import-json');
    var oldReload=window.hpStage6HardReload; if(typeof oldReload==='function'&&!oldReload.__hpv41Wrapped){window.hpStage6HardReload=function(){try{autoSafetySnapshot('before-safe-reload-v41');throttledCloudBackup('BeforeSafeReload')}catch(e){} return oldReload.apply(this,arguments)};window.hpStage6HardReload.__hpv41Wrapped=true;}
    if(booted)return;
    booted=true;
    if(!simpleTimer) simpleTimer=setInterval(updateSimpleUI,3000);
    setTimeout(function(){loadBackupStatus(false).catch(function(){})},2500);
  }
  var oldOpenSync=window.openSync;
  window.openSync=function(){var r=oldOpenSync?oldOpenSync.apply(this,arguments):undefined;setTimeout(function(){ensureSimplePanel();hideLegacySyncUI();loadBackupStatus(false).catch(function(){})},250);setTimeout(hideLegacySyncUI,800);return r};
  var oldSetSyncState=window.setSyncState;
  if(typeof oldSetSyncState==='function')window.setSyncState=function(){var r=oldSetSyncState.apply(this,arguments);setTimeout(updateSimpleUI,0);return r};
  document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,1200)});
  window.addEventListener('load',function(){setTimeout(boot,1600)});
  setTimeout(boot,2800);
  // V41.1 stable fix: no whole-page MutationObserver.
  // The sync UI is created only through openSync/boot to avoid browser freezes.
  try{ if(observer && observer.disconnect) observer.disconnect(); }catch(e){}
  window.HP_V41_BACKUP_CENTER={version:VERSION,backendUrl:backendUrl,loadStatus:loadBackupStatus,sync:window.hpV41SyncProtectNow};
})();


/* ===== END SOURCE: 18-v41-backup-center-simple-ui.js ===== */


/* ===== BEGIN V49 FINAL STABILITY GUARD ===== */
(function(){
  'use strict';
  var VERSION='49.0.0-final-stable';
  var SITE_VERSION='49finalstable';
  var LOG_KEY='hayder_pack_error_log_v49';
  var MAX_LOGS=80;
  var wrapped=false;
  function $(id){return document.getElementById(id)}
  function now(){return new Date().toISOString()}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function readLogs(){try{return JSON.parse(localStorage.getItem(LOG_KEY)||'[]')||[]}catch(e){return []}}
  function writeLogs(list){try{localStorage.setItem(LOG_KEY,JSON.stringify((list||[]).slice(0,MAX_LOGS)))}catch(e){}}
  function counts(){try{var d=window.DB||{};return {clients:(d.clients||[]).length,factories:(d.factories||[]).length,orders:(d.orders||[]).length,payments:(d.payments||[]).length,transfers:(d.transfers||[]).length,expenses:(d.expenses||[]).length}}catch(e){return {}}}
  function msgFrom(err){try{return (err&&err.message)||String(err&&err.reason||err)||'Unknown error'}catch(e){return 'Unknown error'}}
  function stackFrom(err){try{return String((err&&err.stack)||(err&&err.reason&&err.reason.stack)||'').slice(0,3000)}catch(e){return ''}}
  function addLog(kind,err,ctx,extra){
    var entry={
      at:now(),
      version:VERSION,
      siteVersion:SITE_VERSION,
      kind:kind||'error',
      context:ctx||'',
      message:msgFrom(err),
      stack:stackFrom(err),
      url:String(location.href||''),
      online:!!navigator.onLine,
      counts:counts(),
      extra:extra||null
    };
    var list=readLogs(); list.unshift(entry); writeLogs(list); updateWidget();
    try{console.warn('[Haydar Pack V49 captured]',entry)}catch(e){}
    return entry;
  }
  function toastSafe(m){try{if(typeof toast==='function')toast(m)}catch(e){}}
  window.hpV49LogError=function(kind,err,ctx,extra){return addLog(kind,err,ctx,extra)};
  window.addEventListener('error',function(e){
    addLog('window.error', e.error||e.message, 'global', {source:e.filename||'',line:e.lineno||0,col:e.colno||0});
  });
  window.addEventListener('unhandledrejection',function(e){
    addLog('unhandled.promise', e.reason||'Unhandled promise rejection', 'promise', null);
  });
  function injectStyle(){
    if($('hp-v49-style'))return;
    var st=document.createElement('style'); st.id='hp-v49-style';
    st.textContent='\n.hp-v49-card{border:4px solid #000;border-radius:18px;background:#f7fff8;padding:14px;margin:12px 0;box-shadow:0 3px 0 #000;font-weight:900}\n.hp-v49-head{font-size:19px;font-weight:900;margin-bottom:8px;display:flex;align-items:center;gap:8px}\n.hp-v49-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}.hp-v49-mini{border:3px solid #000;border-radius:14px;background:#fff;padding:10px;min-height:54px}.hp-v49-mini b{display:block;font-size:13px;color:#123;margin-bottom:5px}.hp-v49-mini span{font-size:14px;word-break:break-word}\n.hp-v49-log{direction:ltr;text-align:left;background:#0b1020;color:#e8f0ff;border-radius:14px;padding:10px;max-height:260px;overflow:auto;white-space:pre-wrap;font-size:12px;margin-top:10px}\n.hp-v49-ok{color:#077a2d}.hp-v49-warn{color:#a15c00}.hp-v49-bad{color:#9b111e}\n@media(max-width:520px){.hp-v49-grid{grid-template-columns:1fr}}\n';
    document.head.appendChild(st);
  }
  function statusText(){
    var logs=readLogs();
    var last=logs[0];
    var pending=0;
    try{ if(window.HP_V37_SYNC){ var p=localStorage.getItem('hayder_pack_sync_pending_v37'); pending=p?1:0; } }catch(e){}
    var cls=logs.length?'hp-v49-warn':'hp-v49-ok';
    return {logs:logs,last:last,pending:pending,cls:cls};
  }
  function logSummaryText(){
    var logs=readLogs();
    if(!logs.length)return 'No errors logged.';
    return logs.slice(0,20).map(function(x,i){
      return '#'+(i+1)+' ['+(x.at||'')+'] '+(x.kind||'error')+' | '+(x.context||'')+'\n'+(x.message||'')+'\n'+(x.stack||'').slice(0,900)+'\n';
    }).join('\n---\n');
  }
  function widgetHtml(){
    var s=statusText(), last=s.last;
    return '<div id="hp-v49-stability-widget" class="hp-v49-card">'
      +'<div class="hp-v49-head"><i class="ti ti-activity-heartbeat"></i> حالة النظام V49</div>'
      +'<div class="hp-v49-grid">'
      +'<div class="hp-v49-mini"><b>الأخطاء المسجلة</b><span id="hp-v49-count" class="'+s.cls+'">'+esc(String(s.logs.length))+'</span></div>'
      +'<div class="hp-v49-mini"><b>آخر خطأ</b><span id="hp-v49-last">'+esc(last?(last.message||'—'):'لا يوجد')+'</span></div>'
      +'<div class="hp-v49-mini"><b>الاتصال</b><span id="hp-v49-online">'+esc(navigator.onLine?'متصل':'أوفلاين')+'</span></div>'
      +'<div class="hp-v49-mini"><b>حركات معلقة</b><span id="hp-v49-pending">'+esc(String(s.pending))+'</span></div>'
      +'</div>'
      +'<div class="hp-v41-actions"><button class="btn" onclick="hpV49ToggleLog()"><i class="ti ti-list-details"></i> عرض سجل الأخطاء</button><button class="btn blue" onclick="hpV49DownloadLog()"><i class="ti ti-download"></i> تنزيل التقرير</button><button class="btn amber" onclick="hpV49ClearLog()"><i class="ti ti-trash"></i> مسح السجل</button></div>'
      +'<pre id="hp-v49-log-box" class="hp-v49-log" style="display:none"></pre>'
      +'</div>';
  }
  function ensureWidget(){
    injectStyle();
    var host=$('hp-v41-sync-ui') || document.querySelector('#dr-sync .drawer');
    if(!host)return;
    if(!$('hp-v49-stability-widget')){
      var working=$('hp-v41-working');
      if(working)working.insertAdjacentHTML('afterend', widgetHtml()); else host.insertAdjacentHTML('beforeend', widgetHtml());
    }
    updateWidget();
  }
  function updateWidget(){
    var s=statusText(), last=s.last, el;
    if((el=$('hp-v49-count'))){el.textContent=String(s.logs.length);el.className=s.cls;}
    if((el=$('hp-v49-last')))el.textContent=last?(last.message||'—'):'لا يوجد';
    if((el=$('hp-v49-online')))el.textContent=navigator.onLine?'متصل':'أوفلاين';
    if((el=$('hp-v49-pending')))el.textContent=String(s.pending);
    if((el=$('hp-v49-log-box'))&&el.style.display!=='none')el.textContent=logSummaryText();
  }
  window.hpV49ToggleLog=function(){ensureWidget();var box=$('hp-v49-log-box');if(!box)return;var show=box.style.display==='none'||!box.style.display;box.style.display=show?'block':'none';if(show)box.textContent=logSummaryText();};
  window.hpV49ClearLog=function(){if(!confirm('مسح سجل الأخطاء المحلي فقط؟ الداتا لن تتأثر.'))return;writeLogs([]);updateWidget();toastSafe('تم مسح سجل الأخطاء')};
  window.hpV49DownloadLog=function(){
    var report='Haydar Pack V49 Error Report\nGenerated: '+now()+'\nURL: '+location.href+'\nOnline: '+navigator.onLine+'\nCounts: '+JSON.stringify(counts())+'\n\n'+logSummaryText();
    try{var blob=new Blob([report],{type:'text/plain;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='haydar-pack-error-report-'+Date.now()+'.txt';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){addLog('download.error',e,'hpV49DownloadLog');}
  };
  function fallbackRender(name){
    var targets={renderOrders:'orders-list',renderClients:'clients-list',renderFactories:'factories-list',renderReports:'rep-stats',renderHome:'h-status'};
    var id=targets[name], el=id&&$(id); if(!el)return;
    el.innerHTML='<div class="alert amber" style="border-width:4px"><b>حصل خطأ عرض مؤقت.</b><br>الداتا لم يتم حذفها. افتح المزامنة والحماية ثم نزّل تقرير الأخطاء أو اعمل Refresh آمن.</div>';
  }
  function wrap(name,opts){
    var old=window[name]; if(typeof old!=='function'||old.__hpv49Wrapped)return;
    var w=function(){try{return old.apply(this,arguments)}catch(e){addLog('guarded.function',e,name,{args:Array.prototype.slice.call(arguments,0,3).map(function(a){return String(a).slice(0,120)})});fallbackRender(name);toastSafe('حصل خطأ مؤقت — اتسجل في حالة النظام');if(opts&&opts.rethrow)throw e;return null;}};
    w.__hpv49Wrapped=true; window[name]=w;
  }
  function wrapCriticalFunctions(){
    if(wrapped)return; wrapped=true;
    ['refreshAll','renderHome','renderOrders','renderClients','renderFactories','renderReports','openOrderDetail','openClientDetail','openFactoryDetail','openSync'].forEach(function(n){wrap(n)});
    var oldOpen=window.openSync;
    if(typeof oldOpen==='function'&&!oldOpen.__hpv49OpenWrapped){
      window.openSync=function(){var r;try{r=oldOpen.apply(this,arguments)}catch(e){addLog('openSync.error',e,'openSync');try{openDrawer('dr-sync')}catch(_){}}setTimeout(ensureWidget,350);setTimeout(updateWidget,1000);return r};
      window.openSync.__hpv49OpenWrapped=true;
    }
  }
  function boot(){injectStyle();wrapCriticalFunctions();ensureWidget();updateWidget();}
  document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,1600)});
  window.addEventListener('load',function(){setTimeout(boot,1800)});
  window.addEventListener('online',function(){setTimeout(updateWidget,200)});
  window.addEventListener('offline',function(){setTimeout(updateWidget,200)});
  setTimeout(boot,3000);
  window.HP_V49_STABILITY={version:VERSION,siteVersion:SITE_VERSION,readLogs:readLogs,log:addLog,clear:function(){writeLogs([]);updateWidget()},update:updateWidget};
})();
/* ===== END V49 FINAL STABILITY GUARD ===== */
