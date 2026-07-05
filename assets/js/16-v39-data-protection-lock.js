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
    location.href=base+'?v=41stable&safeReload='+Date.now();
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
