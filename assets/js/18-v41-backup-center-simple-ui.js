/* Haydar Pack V41 — Backup Center + Simple Sync UI
   Scope: sync/backup UI only. Does not alter clients/orders/invoices/calculations. */
(function(){
  'use strict';
  var VERSION='41.1.0-stable-ui';
  var SITE_VERSION='41stable';
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
