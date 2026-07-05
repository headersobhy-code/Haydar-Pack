/* Haydar Pack V33 Stage 5 split file: 05-safe-import-boot.js. Preserves execution order from stable version. */
/* ===== HAYDAR PACK V24: SAFE GITHUB IMPORT + BOOT GUARD =====
   - No google.script.run usage on GitHub Pages.
   - Import JSON posts directly to Apps Script /exec then confirms through JSONP.
   - Keeps boot screen from sticking and keeps only one page active.
*/
(function(){
  'use strict';
  var HP_LOCAL_KEY='hayder_bags_app';
  var HP_PWA_META_KEY='hayder_pack_pwa_meta_v10';
  var HP_PWA_PENDING_KEY='hayder_pack_pwa_pending_v10';
  var HP_PWA_BACKEND_KEY='hayder_pack_backend_url_v10';
  var HP_FIXED_BACKEND='https://script.google.com/macros/s/AKfycbw0RxMaw2gNicQjSD5T3LHhd-6d2DnABYKGNNMDD1NN3b09wJL3OatLviAn7xqDu2Zq6w/exec';

  function hpV24Toast(msg){try{if(typeof toast==='function')toast(msg);else alert(msg)}catch(e){}}
  function hpV24SetState(state,msg){
    try{if(typeof setSyncState==='function')setSyncState(state,msg||'');}catch(e){}
    var s=document.getElementById('sync-status'); if(s)s.textContent=msg||'';
    var c=document.getElementById('cloud-connection-status');
    if(c){c.textContent=state==='ok'?'متصل ومحفوظ':state==='work'?'جاري المزامنة':state==='err'?'غير متزامن':'جاهز';c.className='cloud-status-value '+(state==='ok'?'success':state==='work'?'warn':state==='err'?'danger':'');}
  }
  function hpV24HideLoading(){var c=document.getElementById('cloud-loading-cover');if(c)c.classList.add('hide');}
  function hpV24OneActivePage(){
    try{
      var pages=[].slice.call(document.querySelectorAll('.page'));
      if(!pages.length)return;
      var active=pages.filter(function(p){return p.classList.contains('active')});
      if(active.length!==1){pages.forEach(function(p,i){p.classList.toggle('active',i===0)});}
      var nav=[].slice.call(document.querySelectorAll('.nb'));
      if(nav.length && document.querySelectorAll('.nb.active').length!==1){nav.forEach(function(b,i){b.classList.toggle('active',i===0)});}
    }catch(e){}
  }
  function hpV24FixLogo(){
    try{
      var box=document.querySelector('.logo-icon');
      if(box){
        box.innerHTML='<img class="hp-app-logo" src="hp-logo-v3-192.png?v=24" alt="Haydar Pack" onerror="this.onerror=null;this.src=\'icon-192.png?v=24\'">';
      }
    }catch(e){}
  }
  function hpV24NormalizeUrl(url){
    url=String(url||'').trim().replace(/\s+/g,'');
    if(!url)return '';
    url=url.replace(/[?#].*$/,'').replace(/\/+$/,'');
    var m=url.match(/^(https:\/\/script\.google\.com\/macros\/s\/[^\/]+)(?:\/(exec|dev))?$/);
    if(m)return m[1]+'/exec';
    return url;
  }
  function hpV24BackendUrl(){
    var url='';
    try{url=String(localStorage.getItem(HP_PWA_BACKEND_KEY)||'').trim();}catch(e){}
    if(!url && typeof window.HP_APPS_SCRIPT_URL==='string')url=window.HP_APPS_SCRIPT_URL;
    url=hpV24NormalizeUrl(url||HP_FIXED_BACKEND);
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[^\/]+\/exec$/.test(url))url=HP_FIXED_BACKEND;
    try{localStorage.setItem(HP_PWA_BACKEND_KEY,url);}catch(e){}
    window.HP_APPS_SCRIPT_URL=url;
    return url;
  }
  function hpV24Jsonp(action,params,timeoutMs){
    return new Promise(function(resolve,reject){
      var url=hpV24BackendUrl();
      var cb='hpV24cb_'+Date.now()+'_'+Math.floor(Math.random()*1000000);
      var q='action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_=' + Date.now();
      params=params||{};
      Object.keys(params).forEach(function(k){q+='&'+encodeURIComponent(k)+'='+encodeURIComponent(params[k]);});
      var script=document.createElement('script'),done=false,timer;
      window[cb]=function(res){done=true;cleanup();resolve(res);};
      function cleanup(){try{delete window[cb]}catch(e){window[cb]=undefined} if(script&&script.parentNode)script.parentNode.removeChild(script); clearTimeout(timer);}
      script.onerror=function(){if(!done){cleanup();reject(new Error('تعذر الاتصال برابط المزامنة'))}};
      timer=setTimeout(function(){if(!done){cleanup();reject(new Error('لم يصل رد من Apps Script'))}},timeoutMs||30000);
      script.src=url+(url.indexOf('?')>=0?'&':'?')+q;
      document.head.appendChild(script);
    });
  }
  function hpV24Post(action,fields){
    return new Promise(function(resolve){
      var url=hpV24BackendUrl();
      var iframeName='hp_v24_post_'+Date.now();
      var iframe=document.createElement('iframe');iframe.name=iframeName;iframe.style.display='none';
      var form=document.createElement('form');form.method='POST';form.action=url;form.target=iframeName;form.style.display='none';form.acceptCharset='UTF-8';
      fields=fields||{};fields.action=action;
      Object.keys(fields).forEach(function(k){var inp=document.createElement('textarea');inp.name=k;inp.value=String(fields[k]==null?'':fields[k]);form.appendChild(inp);});
      document.body.appendChild(iframe);document.body.appendChild(form);form.submit();
      setTimeout(function(){try{form.remove();iframe.remove();}catch(e){} resolve({ok:true});},2200);
    });
  }
  function hpV24Counts(db){
    db=db||{};
    return {clients:(db.clients||[]).length,factories:(db.factories||[]).length,orders:(db.orders||[]).length,payments:(db.payments||[]).length,transfers:(db.transfers||[]).length,expenses:(db.expenses||[]).length};
  }
  function hpV24ExtractData(parsed){
    if(!parsed||typeof parsed!=='object')throw new Error('ملف الداتا غير صالح');
    var data=parsed;
    if(parsed.format==='HayderPackCloudDB' && parsed.data && typeof parsed.data==='object')data=parsed.data;
    else if(parsed.format==='HayderPackBackup' && parsed.data && typeof parsed.data==='object')data=parsed.data;
    else if(parsed.data && parsed.data.clients && parsed.data.orders)data=parsed.data;
    if(!data||typeof data!=='object')throw new Error('ملف الداتا غير صالح');
    ['clients','factories','orders','payments','transfers','expenses'].forEach(function(k){if(!Array.isArray(data[k]))data[k]=[];});
    if(!data.settings||typeof data.settings!=='object'||Array.isArray(data.settings))data.settings={};
    delete data.settings.dataSafety;delete data.settings.googleClientId;data.settings.autoSync=false;
    data._id=Number(data._id)||1;data.version=Math.max(Number(data.version)||0,9);
    return data;
  }
  function hpV24ApplyData(data,meta){
    DB=JSON.parse(JSON.stringify(data||{}));
    if(typeof migrate==='function')migrate();
    if(typeof reduceDBForStorage==='function')reduceDBForStorage();
    try{localStorage.setItem(HP_LOCAL_KEY,JSON.stringify(DB));}catch(e){}
    try{localStorage.removeItem(HP_PWA_PENDING_KEY);}catch(e){}
    try{localStorage.setItem(HP_PWA_META_KEY,JSON.stringify({revision:Number(meta&&meta.revision)||0,updatedAt:(meta&&meta.updatedAt)||''}));}catch(e){}
    var rev=document.getElementById('cloud-revision-status');if(rev)rev.textContent=String(Number(meta&&meta.revision)||0);
    var last=document.getElementById('cloud-last-status');if(last){try{last.textContent=new Date((meta&&meta.updatedAt)||Date.now()).toLocaleString('ar-EG')}catch(e){last.textContent=(meta&&meta.updatedAt)||''}}
    if(typeof refreshAll==='function')refreshAll();
    if(typeof runDataHealthCheckUI==='function')runDataHealthCheckUI();
    hpV24OneActivePage();
  }
  function hpV24ConfirmImportedData(data){
    var c=hpV24Counts(data);
    return confirm('سيتم رفع الداتا إلى Google واستبدال قاعدة البيانات الحالية بعد إنشاء نسخة أمان تلقائيًا.\n\nالملف يحتوي على:\n- العملاء: '+c.clients+'\n- المصانع: '+c.factories+'\n- الأوردرات: '+c.orders+'\n- الدفعات: '+c.payments+'\n- التحويلات: '+c.transfers+'\n- المصروفات: '+c.expenses+'\n\nهل تستمر؟');
  }
  function hpV24WaitForImport(expectedCounts,startedRevision,attempt){
    attempt=attempt||1;
    hpV24Jsonp('data',{},30000).then(function(res){
      if(!res||!res.ok){throw new Error((res&&res.message)||'فشل قراءة الداتا بعد الاستيراد');}
      var got=hpV24Counts(res.data||{});
      var changed=Number(res.revision)>Number(startedRevision||0);
      var looksSame=got.clients===expectedCounts.clients && got.orders===expectedCounts.orders && got.factories===expectedCounts.factories && got.payments===expectedCounts.payments && got.transfers===expectedCounts.transfers && got.expenses===expectedCounts.expenses;
      if(changed||looksSame||attempt>=8){
        hpV24ApplyData(res.data,res);hpV24SetState('ok','تم استيراد الداتا إلى Google بنجاح');hpV24Toast('تم الاستيراد بنجاح');
      }else{
        hpV24SetState('work','جاري تأكيد الاستيراد على Google...');setTimeout(function(){hpV24WaitForImport(expectedCounts,startedRevision,attempt+1)},1600);
      }
    }).catch(function(err){
      if(attempt<8){setTimeout(function(){hpV24WaitForImport(expectedCounts,startedRevision,attempt+1)},2000);}
      else{hpV24SetState('err',err.message||'تعذر تأكيد الاستيراد');hpV24Toast('لو الداتا لم تظهر، اضغط تحميل آخر داتا بعد ثواني');}
    });
  }
  window.triggerCloudImport=function(){
    var i=document.getElementById('cloud-import-input');
    if(i){i.value='';i.click();}
  };
  window.importCloudBackup=function(input){
    var file=input&&input.files&&input.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(){
      try{
        if(!navigator.onLine){hpV24Toast('لازم إنترنت للاستيراد إلى Google');return;}
        var parsed=JSON.parse(reader.result);var data=hpV24ExtractData(parsed);var counts=hpV24Counts(data);
        if(counts.clients+counts.factories+counts.orders+counts.payments+counts.transfers+counts.expenses===0)throw new Error('ملف الداتا فارغ');
        if(!hpV24ConfirmImportedData(data))return;
        hpV24BackendUrl();
        hpV24SetState('work','جاري رفع الداتا القديمة إلى Google...');
        hpV24Jsonp('meta',{},15000).catch(function(){return {revision:0}}).then(function(meta){
          var startedRevision=Number(meta&&meta.revision)||0;
          return hpV24Post('replace',{data:JSON.stringify(data),reason:'manual-import-from-github-v24'}).then(function(){
            setTimeout(function(){hpV24WaitForImport(counts,startedRevision,1)},1800);
          });
        });
      }catch(e){hpV24SetState('err',e.message||'ملف الداتا غير صالح');hpV24Toast(e.message||'ملف الداتا غير صالح');}
    };
    reader.onerror=function(){hpV24Toast('تعذر قراءة الملف')};
    reader.readAsText(file,'utf-8');
  };
  function hpV24UpdateSyncInput(){
    try{
      var input=document.getElementById('pwa-backend-url');if(input)input.value=hpV24BackendUrl();
    }catch(e){}
  }
  var oldOpenSync=window.openSync;
  window.openSync=function(){
    var r=oldOpenSync?oldOpenSync.apply(this,arguments):undefined;
    setTimeout(function(){hpV24UpdateSyncInput();hpV24FixLogo();hpV24OneActivePage();},0);
    return r;
  };
  window.addEventListener('error',function(){setTimeout(hpV24HideLoading,500)});
  window.addEventListener('unhandledrejection',function(){setTimeout(hpV24HideLoading,500)});
  window.addEventListener('load',function(){setTimeout(function(){hpV24HideLoading();hpV24OneActivePage();hpV24FixLogo();},2500)});
  document.addEventListener('DOMContentLoaded',function(){hpV24BackendUrl();hpV24FixLogo();hpV24OneActivePage();setTimeout(hpV24HideLoading,6500);});
  setTimeout(function(){hpV24HideLoading();hpV24OneActivePage();hpV24FixLogo();},9000);
})();
