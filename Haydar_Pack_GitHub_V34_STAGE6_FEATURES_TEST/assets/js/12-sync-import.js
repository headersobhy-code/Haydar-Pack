/* Haydar Pack V33 Stage 5 split file: 12-sync-import.js. Preserves execution order from stable version. */
/* ===== HAYDAR PACK V32 STAGE 4 TEST: CLEAN SYNC + IMPORT ONLY =====
   Scope: GitHub PWA <-> Apps Script /exec sync layer.
   No UI/features/calculation/document changes here.
   Goals:
   - One final sync adapter overrides older duplicated sync functions.
   - JSONP reads from Apps Script; hidden form POST writes to Apps Script.
   - Import JSON from GitHub page uploads directly to Google with backup and confirmation.
   - Boot cannot remain stuck; one active page only.
*/
(function(){
  'use strict';
  var STAGE='32stage4';
  var LOCAL_KEY='hayder_bags_app';
  var META_KEY='hayder_pack_stage4_meta_v32';
  var PENDING_KEY='hayder_pack_stage4_pending_v32';
  var URL_KEY='hayder_pack_stage4_backend_url_v32';
  var OLD_URL_KEY='hayder_pack_backend_url_v10';
  var FIXED_URL='https://script.google.com/macros/s/AKfycbw0RxMaw2gNicQjSD5T3LHhd-6d2DnABYKGNNMDD1NN3b09wJL3OatLviAn7xqDu2Zq6w/exec';
  var syncTimer=null, metaTimer=null, saving=false, bootDone=false;
  var state={revision:0,updatedAt:'',checksum:''};
  function $(id){return document.getElementById(id)}
  function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.log(msg)}catch(e){}}
  function clone(v){return JSON.parse(JSON.stringify(v||{}))}
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
    if(!url && typeof window.HP_APPS_SCRIPT_URL==='string')url=window.HP_APPS_SCRIPT_URL;
    url=normalizeUrl(url)||FIXED_URL;
    try{localStorage.setItem(URL_KEY,url);localStorage.setItem(OLD_URL_KEY,url)}catch(e){}
    window.HP_APPS_SCRIPT_URL=url;
    return url;
  }
  function num(v){var n=parseFloat(v);return isNaN(n)?0:n}
  function counts(db){db=db||{};return {clients:(db.clients||[]).length,factories:(db.factories||[]).length,orders:(db.orders||[]).length,payments:(db.payments||[]).length,transfers:(db.transfers||[]).length,expenses:(db.expenses||[]).length,capitalMoves:(db.capitalMoves||[]).length}}
  function cleanData(input){
    var db=clone(input||{});
    ['clients','factories','orders','payments','transfers','expenses','capitalMoves'].forEach(function(k){if(!Array.isArray(db[k]))db[k]=[]});
    if(!db.settings||typeof db.settings!=='object'||Array.isArray(db.settings))db.settings={};
    delete db.settings.dataSafety;delete db.settings.googleClientId;db.settings.autoSync=false;
    if(!Array.isArray(db.settings.extraMonths))db.settings.extraMonths=[];
    db._id=num(db._id)||1;db.version=Math.max(num(db.version)||0,10);
    return db;
  }
  function hashText(text){var h=2166136261;for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return ('00000000'+(h>>>0).toString(16)).slice(-8)}
  function dataHash(db){return hashText(JSON.stringify(cleanData(db)))}
  function setText(id,txt,cls){var el=$(id);if(!el)return;el.textContent=txt;if(cls)el.className='cloud-status-value '+cls}
  function fmtTime(v){if(!v)return 'لا توجد بعد';try{return new Date(v).toLocaleString('ar-EG')}catch(e){return String(v)}}
  function saveMeta(meta){
    state.revision=Number(meta&&meta.revision)||state.revision||0;
    state.updatedAt=(meta&&meta.updatedAt)||state.updatedAt||'';
    state.checksum=(meta&&meta.checksum)||state.checksum||'';
    try{localStorage.setItem(META_KEY,JSON.stringify(state))}catch(e){}
    setText('cloud-revision-status',String(state.revision||0));
    setText('cloud-last-status',fmtTime(state.updatedAt));
  }
  function loadMeta(){try{var m=JSON.parse(localStorage.getItem(META_KEY)||'{}');state.revision=Number(m.revision)||0;state.updatedAt=m.updatedAt||'';state.checksum=m.checksum||''}catch(e){}saveMeta(state)}
  function setSync(stateName,msg){
    try{if(typeof setSyncState==='function')setSyncState(stateName,msg||'')}catch(e){}
    var s=$('sync-status');if(s)s.textContent=msg||'';
    var cls=stateName==='ok'?'success':stateName==='work'?'warn':stateName==='err'?'danger':'';
    setText('cloud-connection-status',stateName==='ok'?'متصل ومحفوظ':stateName==='work'?'جاري المزامنة':stateName==='err'?'غير متزامن':'جاهز',cls);
  }
  function hideLoading(){var c=$('cloud-loading-cover');if(c)c.classList.add('hide')}
  function onePage(){
    try{
      var pages=[].slice.call(document.querySelectorAll('.page'));
      if(!pages.length)return;
      var act=pages.filter(function(p){return p.classList.contains('active')});
      if(act.length!==1){pages.forEach(function(p,i){p.classList.toggle('active',i===0)})}
      var nav=[].slice.call(document.querySelectorAll('.nb'));
      var nact=nav.filter(function(b){return b.classList.contains('active')});
      if(nav.length&&nact.length!==1){nav.forEach(function(b,i){b.classList.toggle('active',i===0)})}
    }catch(e){}
  }
  function jsonp(action,params,timeoutMs){
    return new Promise(function(resolve,reject){
      var url=backendUrl();
      var cb='hpStage4_'+Date.now()+'_'+Math.floor(Math.random()*1000000);
      var q='action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();
      params=params||{};Object.keys(params).forEach(function(k){q+='&'+encodeURIComponent(k)+'='+encodeURIComponent(params[k])});
      var script=document.createElement('script'),done=false,timer;
      window[cb]=function(res){done=true;cleanup();resolve(res)};
      function cleanup(){try{delete window[cb]}catch(e){window[cb]=undefined}if(script&&script.parentNode)script.parentNode.removeChild(script);clearTimeout(timer)}
      script.onerror=function(){if(!done){cleanup();reject(new Error('تعذر الاتصال برابط Apps Script /exec'))}};
      timer=setTimeout(function(){if(!done){cleanup();reject(new Error('لم يصل رد من Apps Script. راجع Deploy كـ Web app /exec'))}},timeoutMs||30000);
      script.src=url+(url.indexOf('?')>=0?'&':'?')+q;
      document.head.appendChild(script);
    });
  }
  function postForm(action,fields){
    return new Promise(function(resolve){
      var url=backendUrl();
      var iframeName='hp_stage4_post_'+Date.now();
      var iframe=document.createElement('iframe');iframe.name=iframeName;iframe.style.display='none';
      var form=document.createElement('form');form.method='POST';form.action=url;form.target=iframeName;form.style.display='none';form.acceptCharset='UTF-8';
      fields=fields||{};fields.action=action;
      Object.keys(fields).forEach(function(k){var t=document.createElement('textarea');t.name=k;t.value=String(fields[k]==null?'':fields[k]);form.appendChild(t)});
      document.body.appendChild(iframe);document.body.appendChild(form);form.submit();
      setTimeout(function(){try{form.remove();iframe.remove()}catch(e){}resolve({ok:true})},2200);
    });
  }
  function localWrite(db){
    try{DB=cleanData(db||DB);if(typeof migrate==='function')migrate();if(typeof reduceDBForStorage==='function')reduceDBForStorage();localStorage.setItem(LOCAL_KEY,JSON.stringify(DB));return true}
    catch(e){console.error(e);toastSafe('تعذر الحفظ المحلي: مساحة الجهاز ممتلئة أو الداتا كبيرة');return false}
  }
  function applyRemote(data,meta,msg){
    if(!data||typeof data!=='object')throw new Error('الداتا القادمة من Google غير صالحة');
    localWrite(data);saveMeta({revision:meta&&meta.revision,updatedAt:meta&&meta.updatedAt,checksum:(meta&&meta.checksum)||dataHash(data)});
    try{localStorage.removeItem(PENDING_KEY)}catch(e){}
    try{if(typeof refreshAll==='function')refreshAll();if(typeof runDataHealthCheckUI==='function')runDataHealthCheckUI()}catch(e){console.error(e)}
    onePage();setSync('ok',msg||'تم تحميل آخر بيانات من Google');
  }
  function pendingData(){try{return JSON.parse(localStorage.getItem(PENDING_KEY)||'null')}catch(e){return null}}
  function storePending(data){
    var clean=cleanData(data||DB);
    var p={at:new Date().toISOString(),baseRevision:state.revision||0,checksum:dataHash(clean),counts:counts(clean),data:clean};
    try{localStorage.setItem(PENDING_KEY,JSON.stringify(p))}catch(e){console.error(e)}
    return p;
  }
  function schedulePush(){clearTimeout(syncTimer);syncTimer=setTimeout(function(){pushPending(false)},900)}
  function pull(show){
    if(!navigator.onLine){setSync('err','أوفلاين — تم فتح آخر نسخة محفوظة على الجهاز');hideLoading();return Promise.resolve(null)}
    setSync('work','جاري تحميل آخر بيانات من Google...');
    return jsonp('data',{},30000).then(function(res){
      if(!res||res.ok===false)throw new Error((res&&res.message)||'تعذر قراءة قاعدة Google');
      applyRemote(res.data,res,show?'تم تحميل آخر تحديث من Google':'متصل ومحفوظ');
      if(show)toastSafe('تم تحميل آخر تحديث');
      return res;
    }).catch(function(err){console.error(err);setSync('err',err.message||'تعذر الاتصال بـ Google');return null}).finally(function(){hideLoading();onePage()});
  }
  function pushPending(show){
    if(saving)return Promise.resolve(false);
    var p=pendingData();
    if(!p){if(show)toastSafe('لا توجد تعديلات معلقة للرفع');return checkMeta().then(function(){return true})}
    if(!navigator.onLine){setSync('err','أوفلاين — التعديل محفوظ على الجهاز وسيتم رفعه عند رجوع الإنترنت');return Promise.resolve(false)}
    saving=true;setSync('work','جاري رفع آخر تعديل إلى Google...');
    return postForm('save',{baseRevision:p.baseRevision||0,data:JSON.stringify(p.data),clientTime:new Date().toISOString()}).then(function(){
      return new Promise(function(resolve){setTimeout(resolve,1600)});
    }).then(function(){return jsonp('data',{},30000)}).then(function(res){
      saving=false;
      if(!res||res.ok===false)throw new Error((res&&res.message)||'تعذر تأكيد الحفظ');
      var remoteHash=(res.checksum||dataHash(res.data||{}));
      if(remoteHash===p.checksum){
        applyRemote(res.data,res,'تم رفع آخر تعديل إلى Google');
        if(show)toastSafe('تم رفع آخر تعديل إلى Google');
        return true;
      }
      if(Number(res.revision)>Number(p.baseRevision||0)){
        setSync('err','تم منع تعارض: Google يحتوي على داتا مختلفة/أحدث. حمّل آخر داتا قبل التعديل.');
        toastSafe('تم منع الكتابة فوق داتا مختلفة على Google');
        return false;
      }
      setSync('err','لم يتم تأكيد الحفظ. التعديل محفوظ على الجهاز، جرّب رفع آخر تعديل مرة أخرى.');
      return false;
    }).catch(function(err){saving=false;console.error(err);setSync('err',err.message||'تعذر رفع التعديل');return false});
  }
  function checkMeta(){
    if(!navigator.onLine)return Promise.resolve(null);
    return jsonp('meta',{},15000).then(function(meta){
      if(meta&&meta.ok){
        saveMeta(meta);
        var p=pendingData();
        if(!p && meta.revision && Number(meta.revision)>Number(state.revision||0))return pull(false);
        setSync('ok','متصل ومحفوظ');
      }
      return meta;
    }).catch(function(){return null});
  }
  function backup(){
    if(!navigator.onLine){toastSafe('لازم إنترنت لإنشاء نسخة على Google');return}
    setSync('work','جاري إنشاء نسخة احتياطية على Google...');
    jsonp('backup',{},30000).then(function(res){
      if(res&&res.ok){setSync('ok','تم إنشاء نسخة احتياطية على Google');toastSafe('تم إنشاء نسخة احتياطية على Google')}
      else setSync('err',(res&&res.message)||'تعذر إنشاء النسخة الاحتياطية');
    }).catch(function(err){setSync('err',err.message||'تعذر إنشاء النسخة الاحتياطية')});
  }
  function extractImport(parsed){
    if(!parsed||typeof parsed!=='object')throw new Error('ملف الداتا غير صالح');
    var meta={revision:Number(parsed.revision)||0,updatedAt:parsed.updatedAt||parsed.exportedAt||'',format:parsed.format||''};
    var data=parsed;
    if(parsed.data&&typeof parsed.data==='object')data=parsed.data;
    data=cleanData(data);
    var c=counts(data);
    if(c.clients+c.factories+c.orders+c.payments+c.transfers+c.expenses+c.capitalMoves===0)throw new Error('ملف الداتا فارغ');
    return {data:data,meta:meta,counts:c,checksum:dataHash(data)};
  }
  function importFile(input){
    var file=input&&input.files&&input.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(){
      (async function(){
        try{
          if(!navigator.onLine)throw new Error('لازم إنترنت لاستيراد الداتا إلى Google');
          var item=extractImport(JSON.parse(reader.result));
          var server=await jsonp('meta',{},15000).catch(function(){return {revision:state.revision||0,updatedAt:state.updatedAt||''}});
          var msg='سيتم رفع الداتا إلى Google واستبدال قاعدة البيانات الحالية بعد إنشاء نسخة أمان تلقائيًا.\n\nالملف يحتوي على:\n- العملاء: '+item.counts.clients+'\n- المصانع: '+item.counts.factories+'\n- الأوردرات: '+item.counts.orders+'\n- الدفعات: '+item.counts.payments+'\n- التحويلات: '+item.counts.transfers+'\n- المصروفات: '+item.counts.expenses+'\n\nهل تستمر؟';
          if(!confirm(msg))return;
          var serverRev=Number(server&&server.revision)||0;
          var fileRev=Number(item.meta.revision)||0;
          var serverNewer=fileRev && serverRev>fileRev;
          if(serverNewer){
            if(!confirm('تحذير مهم: Google يبدو أحدث من ملف الاستيراد.\nلو كملت، ممكن تستبدل داتا أحدث بملف أقدم.\n\nهل أنت متأكد؟'))return;
          }
          setSync('work','جاري استيراد الداتا إلى Google...');
          await postForm('replace',{baseRevision:serverRev,data:JSON.stringify(item.data),reason:'stage4-import-from-github'});
          await new Promise(function(resolve){setTimeout(resolve,1800)});
          var after=await jsonp('data',{},30000);
          if(!after||after.ok===false)throw new Error((after&&after.message)||'تعذر تأكيد الاستيراد');
          var afterHash=(after.checksum||dataHash(after.data||{}));
          if(afterHash!==item.checksum){
            setSync('err','لم يتم تأكيد الاستيراد. قد يكون Google منع الاستبدال بسبب داتا أحدث.');
            toastSafe('لم يتم تأكيد الاستيراد — اضغط تحميل آخر داتا وراجعها');
            return;
          }
          applyRemote(after.data,after,'تم استيراد الداتا إلى Google بنجاح');toastSafe('تم الاستيراد بنجاح');
        }catch(e){console.error(e);setSync('err',e.message||'فشل الاستيراد');toastSafe(e.message||'فشل الاستيراد')}
      })();
    };
    reader.onerror=function(){toastSafe('تعذر قراءة ملف الداتا')};
    reader.readAsText(file,'utf-8');
  }
  function downloadBackup(){
    try{
      var meta=Object.assign({},state,{exportedAt:new Date().toISOString(),format:'HayderPackBackup',stage:STAGE,counts:counts(DB),data:cleanData(DB)});
      var blob=new Blob([JSON.stringify(meta,null,2)],{type:'application/json;charset=utf-8'});
      var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='HaydarPack_Backup_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},400);toastSafe('تم تنزيل نسخة JSON على الجهاز');
    }catch(e){toastSafe('تعذر تنزيل النسخة')}
  }
  function ensureSyncPanel(){
    var drawer=document.querySelector('#dr-sync .drawer');if(!drawer||$('hp-stage4-sync-panel'))return;
    var div=document.createElement('div');div.id='hp-stage4-sync-panel';div.className='alert blue';
    div.innerHTML='<div style="font-weight:900;margin-bottom:8px">مزامنة V32 Stage 4</div><div style="font-size:16px;margin-bottom:6px">رابط Apps Script /exec المستخدم:</div><div dir="ltr" style="word-break:break-all;font-size:14px;background:#fff;border:3px solid #000;border-radius:12px;padding:10px;margin-bottom:10px">'+backendUrl()+'</div><div class="btn-row"><button class="btn green" onclick="refreshCloudData(true)"><i class="ti ti-refresh"></i> تحديث البيانات من Google الآن</button><button class="btn blue" onclick="manualSync()"><i class="ti ti-cloud-up"></i> رفع آخر تعديل الآن</button></div><div class="btn-row"><button class="btn amber" onclick="triggerCloudImport()"><i class="ti ti-file-upload"></i> استيراد JSON إلى Google</button><button class="btn" onclick="downloadManualBackup()"><i class="ti ti-download"></i> تنزيل Backup JSON</button></div>';
    var grid=drawer.querySelector('.cloud-status-grid');drawer.insertBefore(div,grid||drawer.children[2]||null);
  }
  function triggerImport(){var i=$('cloud-import-input');if(i){i.value='';i.click()}}
  function boot(){
    if(bootDone)return;bootDone=true;loadMeta();backendUrl();onePage();hideLoading();
    try{if(typeof load==='function')load()}catch(e){console.error(e);hideLoading();onePage()}
    if(navigator.onLine){pull(false)}else setSync('err','أوفلاين — تم فتح آخر نسخة محفوظة على الجهاز');
    clearInterval(metaTimer);metaTimer=setInterval(function(){if(!pendingData()&&!saving)checkMeta()},60000);
  }
  var oldOpenSync=window.openSync;
  window.openSync=function(){var r=oldOpenSync?oldOpenSync.apply(this,arguments):undefined;setTimeout(function(){ensureSyncPanel();loadMeta();onePage()},0);return r};
  window.refreshCloudData=function(show){return pull(!!show)};
  window.loadFromDrive=function(){return pull(true)};
  window.manualSync=function(){return pushPending(true)};
  window.createCloudBackup=backup;
  window.triggerCloudImport=triggerImport;
  window.importCloudBackup=importFile;
  window.downloadManualBackup=downloadBackup;
  window.scheduleSync=schedulePush;
  window.save=save=function(skipSync){var ok=localWrite(DB);if(ok&&!skipSync){storePending(DB);setSync(navigator.onLine?'work':'err',navigator.onLine?'تم الحفظ على الجهاز وجاري الرفع':'أوفلاين — تم الحفظ على الجهاز');schedulePush()}return ok};
  window.addEventListener('online',function(){setSync('work','رجع الإنترنت — جاري رفع أي تعديلات معلقة');pushPending(false)});
  window.addEventListener('focus',function(){if(!pendingData())checkMeta()});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&!pendingData())checkMeta()});
  window.addEventListener('error',function(){setTimeout(function(){hideLoading();onePage()},400)});
  window.addEventListener('unhandledrejection',function(){setTimeout(function(){hideLoading();onePage()},400)});
  document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,50);setTimeout(function(){hideLoading();onePage()},5000)});
  window.addEventListener('load',function(){setTimeout(function(){hideLoading();onePage()},1200)});
  setTimeout(function(){hideLoading();onePage();if(!bootDone)boot()},6500);
  window.HP_STAGE4_SYNC={version:STAGE,pull:pull,push:pushPending,backendUrl:backendUrl,counts:counts,dataHash:dataHash};
})();
