/* Haydar Pack V34 Stage 6 Test
   Future improvements only:
   - Settings screen
   - Delete log and restore
   - Stronger profit reports
   - Better client search/filter/sort
   - Client detail edit/debt/delete safety
   - Print/PDF polish helpers
   No Apps Script changes required.
*/
(function(){
  'use strict';
  var HP_STAGE6_VERSION='V34_STAGE6_TEST';
  var clientFilter='all';
  var clientSort='activity';

  function byId(id){return document.getElementById(id)}
  function arr(x){return Array.isArray(x)?x:[]}
  function n(v){try{return num(v)}catch(e){var x=parseFloat(v);return isNaN(x)?0:x}}
  function money(v){try{return fmt(v)}catch(e){return n(v).toLocaleString('ar-EG')+' ج'}}
  function count(v){try{return countFmt(v)}catch(e){return Math.round(n(v)).toLocaleString('ar-EG')}}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function today(){try{return todayStr()}catch(e){return new Date().toISOString().slice(0,10)}}
  function nowIso(){return new Date().toISOString()}
  function safeId(v){return String(v==null?'':v).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
  function clientNo(cid){var i=arr(DB.clients).findIndex(function(c){return c.id===cid}); return i>=0?i+1:''}
  function getClient(cid){return arr(DB.clients).find(function(c){return c.id===cid})||null}
  function getFactory(fid){return arr(DB.factories).find(function(f){return f.id===fid})||null}
  function getOrder(oid){return arr(DB.orders).find(function(o){return o.id===oid})||null}
  function orderNet(o){if(typeof netClientForOrder==='function') return netClientForOrder(o); if(typeof clientTotalForOrder==='function') return clientTotalForOrder(o); return (typeof billQty==='function'?billQty(o):n(o&&o.qty))*n(o&&o.price)+n(o&&o.aklashe)-n(o&&o.discount)}
  function orderFactory(o){if(typeof factoryTotalForOrder==='function') return factoryTotalForOrder(o); return n(o&&o.fQty)*n(o&&o.fPrice)+n(o&&o.fAk)}
  function orderExpenses(oid){return arr(DB.expenses).filter(function(e){return e.orderId===oid}).reduce(function(s,e){return s+n(e.amount)},0)}
  function orderProfitSafe(o){if(typeof profitForOrder==='function') return profitForOrder(o); return orderNet(o)-orderFactory(o)-orderExpenses(o&&o.id)}
  function closeIf(id){try{var el=byId(id); if(el) el.classList.remove('open')}catch(e){}}
  function notify(msg){try{toast(msg)}catch(e){console.log(msg)}}

  function ensureStage6Data(){
    DB.settings=DB.settings||{};
    DB.settings.stage6=DB.settings.stage6||{version:HP_STAGE6_VERSION,createdAt:today()};
    DB.deletedLog=arr(DB.deletedLog);
    DB.clientNotes=DB.clientNotes||{};
  }
  function saveAndRefresh(msg){
    ensureStage6Data();
    try{save()}catch(e){try{localStorage.setItem('hayder_bags_app',JSON.stringify(DB))}catch(_){}}
    try{refreshAll()}catch(e){}
    if(msg) notify(msg);
  }

  function logDelete(entry){
    ensureStage6Data();
    entry.id='del_'+Date.now()+'_'+Math.random().toString(16).slice(2,8);
    entry.deletedAt=nowIso();
    entry.deletedDate=today();
    DB.deletedLog.unshift(entry);
    if(DB.deletedLog.length>100) DB.deletedLog=DB.deletedLog.slice(0,100);
    return entry.id;
  }

  window.hpStage6RestoreDeleted=function(logId){
    ensureStage6Data();
    var entry=arr(DB.deletedLog).find(function(x){return x.id===logId});
    if(!entry){notify('السجل غير موجود');return;}
    if(entry.type==='order'){
      var o=entry.order;
      if(!o){notify('لا توجد بيانات للأوردر');return;}
      if(getOrder(o.id)){notify('الأوردر موجود بالفعل');return;}
      DB.orders=arr(DB.orders); DB.orders.push(o);
      arr(entry.expenses).forEach(function(e){ if(!arr(DB.expenses).some(function(x){return x.id===e.id})){DB.expenses.push(e);} });
    }else if(entry.type==='client'){
      var c=entry.client;
      if(!c){notify('لا توجد بيانات للعميل');return;}
      if(getClient(c.id)){notify('العميل موجود بالفعل');return;}
      DB.clients=arr(DB.clients); DB.orders=arr(DB.orders); DB.payments=arr(DB.payments); DB.expenses=arr(DB.expenses);
      DB.clients.push(c);
      arr(entry.orders).forEach(function(o){ if(!getOrder(o.id)) DB.orders.push(o); });
      arr(entry.payments).forEach(function(p){ if(!DB.payments.some(function(x){return x.id===p.id})) DB.payments.push(p); });
      arr(entry.expenses).forEach(function(e){ if(!DB.expenses.some(function(x){return x.id===e.id})) DB.expenses.push(e); });
    }else{
      notify('نوع السجل غير مدعوم');return;
    }
    entry.restoredAt=nowIso();
    saveAndRefresh('تم الاسترجاع من سجل الحذف');
    renderDeleteLogArea();
  };

  window.hpStage6PurgeDeletedLog=function(){
    if(!confirm('مسح سجل الحذف نهائيًا؟ لن تستطيع الاسترجاع بعد ذلك.')) return;
    DB.deletedLog=[]; saveAndRefresh('تم مسح سجل الحذف'); renderDeleteLogArea();
  };

  function renderDeleteLogArea(){
    ensureStage6Data();
    var area=byId('hp-stage6-delete-log'); if(!area) return;
    var list=arr(DB.deletedLog);
    if(!list.length){area.innerHTML='<div class="empty"><i class="ti ti-trash-off"></i><p>لا يوجد حذف مسجل</p></div>';return;}
    area.innerHTML=list.slice(0,40).map(function(e){
      var restored=e.restoredAt?'<span class="badge bg-green">تم الاسترجاع</span>':'<button class="btn small green" onclick="hpStage6RestoreDeleted(\''+safeId(e.id)+'\')"><i class="ti ti-rotate-clockwise"></i> استرجاع</button>';
      return '<div class="row"><div><div class="row-name">'+esc(e.label||e.type)+'</div><div class="row-sub">'+esc(e.deletedDate||'')+' · '+esc(e.type==='client'?'عميل':'أوردر')+'</div></div><div>'+restored+'</div></div>';
    }).join('')+'<button class="btn red-out full" style="margin-top:12px" onclick="hpStage6PurgeDeletedLog()"><i class="ti ti-trash"></i> مسح سجل الحذف</button>';
  }

  var previousDeleteOrder=window.deleteOrder;
  window.deleteOrder=function(id){
    var o=getOrder(id); if(!o){notify('الأوردر غير موجود');return;}
    if(!confirm('تأكيد حذف الأوردر '+(o.code||'')+'؟\n\nسيتم حذفه من حساب العميل والمصنع والتقارير، مع حفظ نسخة في سجل الحذف للاسترجاع.')) return;
    var linkedExpenses=arr(DB.expenses).filter(function(e){return e.orderId===id});
    logDelete({type:'order',label:'أوردر '+(o.code||''),order:JSON.parse(JSON.stringify(o)),expenses:JSON.parse(JSON.stringify(linkedExpenses))});
    DB.orders=arr(DB.orders).filter(function(x){return x.id!==id});
    DB.expenses=arr(DB.expenses).filter(function(e){return e.orderId!==id});
    closeIf('dr-order-detail'); closeIf('dr-client-detail'); closeIf('dr-factory-detail');
    saveAndRefresh('تم حذف الأوردر وحفظه في سجل الحذف');
  };

  var previousDeleteClient=window.deleteClient;
  window.deleteClient=function(cid){
    var c=getClient(cid); if(!c){notify('العميل غير موجود');return;}
    var orders=arr(DB.orders).filter(function(o){return o.clientId===cid});
    var orderIds={}; orders.forEach(function(o){orderIds[o.id]=true});
    var payments=arr(DB.payments).filter(function(p){return p.clientId===cid});
    var expenses=arr(DB.expenses).filter(function(e){return orderIds[e.orderId]});
    if(!confirm('تأكيد حذف العميل: '+(c.name||'')+'؟\n\nسيتم حذف العميل وأوردراته ودفعاته من الحسابات، مع حفظ نسخة في سجل الحذف للاسترجاع.')) return;
    logDelete({type:'client',label:'عميل '+(c.name||''),client:JSON.parse(JSON.stringify(c)),orders:JSON.parse(JSON.stringify(orders)),payments:JSON.parse(JSON.stringify(payments)),expenses:JSON.parse(JSON.stringify(expenses))});
    DB.clients=arr(DB.clients).filter(function(x){return x.id!==cid});
    DB.orders=arr(DB.orders).filter(function(o){return o.clientId!==cid});
    DB.payments=arr(DB.payments).filter(function(p){return p.clientId!==cid});
    DB.expenses=arr(DB.expenses).filter(function(e){return !orderIds[e.orderId]});
    closeIf('dr-client'); closeIf('dr-client-detail'); closeIf('dr-order-detail');
    saveAndRefresh('تم حذف العميل وحفظه في سجل الحذف');
  };

  function ensureSettingsOverlay(){
    if(byId('dr-settings')) return;
    var html='<div class="overlay" id="dr-settings"><div class="drawer"><div class="drawer-handle"></div><div class="drawer-title"><i class="ti ti-settings"></i> إعدادات Haydar Pack</div><div id="hp-stage6-settings-body"></div><button class="btn full" onclick="closeDrawer(\'dr-settings\')">إغلاق</button></div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
  }
  function addSettingsButton(){
    try{
      var top=document.querySelector('.top-actions'); if(!top || byId('hp-stage6-settings-btn')) return;
      top.insertAdjacentHTML('afterbegin','<button id="hp-stage6-settings-btn" class="topbar-btn" onclick="openSettings()" title="الإعدادات"><i class="ti ti-settings"></i></button>');
    }catch(e){}
  }
  window.openSettings=function(){
    ensureStage6Data(); ensureSettingsOverlay();
    var body=byId('hp-stage6-settings-body'); if(!body) return;
    var counts={clients:arr(DB.clients).length,orders:arr(DB.orders).length,factories:arr(DB.factories).length,payments:arr(DB.payments).length,trash:arr(DB.deletedLog).length};
    var url=(window.HP_APPS_SCRIPT_URL||'').replace(/</g,'&lt;');
    body.innerHTML=''
      +'<div class="alert blue">دي شاشة إعدادات خفيفة للنسخة المنظمة. لا تغير الداتا إلا من الأزرار الواضحة.</div>'
      +'<div class="cloud-status-grid">'
      +'<div class="cloud-status-card"><div class="cloud-status-label">الإصدار</div><div class="cloud-status-value">'+HP_STAGE6_VERSION+'</div></div>'
      +'<div class="cloud-status-card"><div class="cloud-status-label">Apps Script</div><div class="cloud-status-value">'+(url||'غير محدد')+'</div></div>'
      +'<div class="cloud-status-card"><div class="cloud-status-label">العملاء</div><div class="cloud-status-value">'+counts.clients+'</div></div>'
      +'<div class="cloud-status-card"><div class="cloud-status-label">الأوردرات</div><div class="cloud-status-value">'+counts.orders+'</div></div>'
      +'</div>'
      +'<div class="btn-row"><button class="btn green" onclick="refreshCloudData(true)"><i class="ti ti-refresh"></i> تحديث من Google</button><button class="btn blue" onclick="manualSyncNow()"><i class="ti ti-cloud-up"></i> رفع آخر تعديل</button></div>'
      +'<div class="btn-row"><button class="btn" onclick="downloadManualBackup()"><i class="ti ti-download"></i> تنزيل Backup</button><button class="btn amber" onclick="hpStage6HardReload()"><i class="ti ti-reload"></i> إعادة تحميل آمن</button></div>'
      +'<div class="sec-label">سجل الحذف والاسترجاع</div><div class="card" id="hp-stage6-delete-log"></div>';
    openDrawer('dr-settings'); renderDeleteLogArea();
  };
  window.hpStage6HardReload=function(){
    var base=location.href.split('?')[0]; location.href=base+'?v=41stable&safeReload='+Date.now();
  };
  if(!window.manualSyncNow){
    window.manualSyncNow=function(){
      try{
        if(typeof manualSync==='function') manualSync();
        else save();
        notify('تم طلب رفع آخر تعديل');
      }catch(e){notify('تعذر رفع آخر تعديل')}
    };
  }

  function clientActivity(c){
    var dates=[]; arr(DB.orders).forEach(function(o){if(o.clientId===c.id) dates.push(o.date||'')}); arr(DB.payments).forEach(function(p){if(p.clientId===c.id) dates.push(p.date||'')}); dates.push(c.updatedAt||c.createdAt||c.month||'');
    return dates.sort().pop()||'';
  }
  function clientProfit(c){return arr(DB.orders).filter(function(o){return o.clientId===c.id}).reduce(function(s,o){return s+orderProfitSafe(o)},0)}
  function injectClientFilters(){
    // V41.1: client filters are owned only by 15-v36-feature-integrity.js.
    // Keeping this no-op prevents duplicate filters and avoids DOM re-injection loops.
    try{var old=byId('hp-stage6-client-filter'); if(old) old.remove();}catch(e){}
    return;
  }

  window.renderClients=function(){
    injectClientFilters();
    var q=(byId('q-clients')?byId('q-clients').value:'').trim().toLowerCase();
    var clients=arr(DB.clients).slice();
    clients=clients.filter(function(c){
      var no=String(clientNo(c.id));
      var bal=(typeof clientBalance==='function'?clientBalance(c.id):0);
      if(clientFilter==='due' && !(bal>0)) return false;
      if(clientFilter==='paid' && !(Math.abs(bal)<0.01)) return false;
      if(clientFilter==='credit' && !(bal<0)) return false;
      if(!q) return true;
      return no===q || String(c.name||'').toLowerCase().includes(q) || String(c.phone||'').toLowerCase().includes(q) || String(c.addr||'').toLowerCase().includes(q);
    });
    clients.sort(function(a,b){
      if(clientSort==='number') return clientNo(a.id)-clientNo(b.id);
      if(clientSort==='name') return String(a.name||'').localeCompare(String(b.name||''),'ar');
      if(clientSort==='balance') return (typeof clientBalance==='function'?clientBalance(b.id):0)-(typeof clientBalance==='function'?clientBalance(a.id):0);
      if(clientSort==='profit') return clientProfit(b)-clientProfit(a);
      return String(clientActivity(b)).localeCompare(String(clientActivity(a)));
    });
    var holder=byId('clients-list'); if(!holder) return;
    holder.innerHTML=clients.length?clients.map(function(c){
      var no=clientNo(c.id), bal=(typeof clientBalance==='function'?clientBalance(c.id):0), total=(typeof clientTotal==='function'?clientTotal(c.id):0)+n(c.debt), paid=(typeof clientPaid==='function'?clientPaid(c.id):0), pct=total>0?Math.min(100,Math.round(paid/total*100)):0, ords=arr(DB.orders).filter(function(o){return o.clientId===c.id}).length, prof=clientProfit(c);
      return '<div class="card clickable" onclick="openClientDetail(\''+safeId(c.id)+'\')"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:10px"><div style="display:flex;align-items:center;gap:10px"><div class="avatar av-blue">'+no+'</div><div><div class="row-name">'+no+'- '+esc(c.name||'')+'</div><div class="row-sub">'+esc(c.phone||'بدون هاتف')+(c.addr?' · '+esc(c.addr):'')+'</div></div></div><span class="badge '+(bal>0?'bg-red':bal<0?'bg-green':'bg-gray')+'">'+(bal>0?money(bal)+' باقي':bal<0?money(-bal)+' رصيد':'مكتمل')+'</span></div><div class="prog"><div class="prog-fill" style="width:'+pct+'%"></div></div><div class="tiny muted" style="margin-top:4px">'+pct+'% مدفوع · '+ords+' أوردر · ربح '+money(prof)+'</div></div>';
    }).join(''):'<div class="empty"><i class="ti ti-users"></i><p>لا يوجد عملاء حسب الفلتر الحالي</p></div>';
  };

  function addClientButtons(cid){
    var body=byId('client-detail-body'); if(!body) return;
    var c=getClient(cid); if(!c) return;
    if(!byId('hp-stage6-client-actions')){
      var html='<div id="hp-stage6-client-actions" class="btn-row" style="margin:10px 0 14px"><button class="btn amber" onclick="closeDrawer(\'dr-client-detail\');openClientForm(\''+safeId(cid)+'\')"><i class="ti ti-edit"></i> تعديل بيانات العميل والمديونية</button><button class="btn red-out" onclick="deleteClient(\''+safeId(cid)+'\')"><i class="ti ti-trash"></i> حذف العميل</button></div>';
      var target=body.querySelector('.stat-grid'); if(target) target.insertAdjacentHTML('afterend',html); else body.insertAdjacentHTML('afterbegin',html);
    }
  }
  var oldOpenClientDetail=window.openClientDetail;
  window.openClientDetail=function(cid){
    if(oldOpenClientDetail) oldOpenClientDetail.apply(this,arguments);
    setTimeout(function(){addClientButtons(cid)},10);
  };
  var oldOpenClientForm=window.openClientForm;
  if(oldOpenClientForm){
    window.openClientForm=function(cid){
      var r=oldOpenClientForm.apply(this,arguments);
      setTimeout(function(){
        try{
          var drawer=document.querySelector('#dr-client .drawer'); if(!drawer) return;
          var old=byId('hp-stage6-client-form-delete'); if(old) old.remove();
          if(cid){drawer.insertAdjacentHTML('beforeend','<button id="hp-stage6-client-form-delete" class="btn red-out full" style="margin-top:12px" onclick="deleteClient(\''+safeId(cid)+'\')"><i class="ti ti-trash"></i> حذف العميل من الحسابات</button>');}
        }catch(e){}
      },10);
      return r;
    };
  }

  var oldRenderReports=window.renderReports;
  window.renderReports=function(){
    if(oldRenderReports) oldRenderReports.apply(this,arguments);
    setTimeout(renderProfitInsights,0);
  };
  function renderProfitInsights(){
    var stats=byId('rep-stats'); if(!stats) return;
    var existing=byId('hp-stage6-profit-insights'); if(existing) existing.remove();
    var orders=(typeof periodOrders==='function'?periodOrders(repPeriod,selRepMonth):arr(DB.orders));
    var exps=(typeof periodExpenses==='function'?periodExpenses(repPeriod,selRepMonth):arr(DB.expenses));
    var totalProfit=orders.reduce(function(s,o){return s+orderProfitSafe(o)},0)-exps.filter(function(e){return !e.orderId}).reduce(function(s,e){return s+n(e.amount)},0);
    var losses=orders.filter(function(o){return orderProfitSafe(o)<0});
    var best=orders.slice().sort(function(a,b){return orderProfitSafe(b)-orderProfitSafe(a)})[0];
    var byClient={}; orders.forEach(function(o){byClient[o.clientId]=(byClient[o.clientId]||0)+orderProfitSafe(o)});
    var topClientId=Object.keys(byClient).sort(function(a,b){return byClient[b]-byClient[a]})[0];
    var topClient=getClient(topClientId)||{};
    var avg=orders.length?totalProfit/orders.length:0;
    var html='<div id="hp-stage6-profit-insights"><div class="sec-label">تحليل أرباح متقدم</div><div class="report-insights-grid">'
      +'<div class="insight-card"><div class="insight-title">صافي الربح التحليلي</div><div class="insight-value '+(totalProfit>=0?'up':'down')+'">'+money(totalProfit)+'</div><div class="insight-sub">بعد تكلفة المصنع ومصاريف الفترة</div></div>'
      +'<div class="insight-card"><div class="insight-title">متوسط ربح الأوردر</div><div class="insight-value '+(avg>=0?'up':'down')+'">'+money(avg)+'</div><div class="insight-sub">على '+orders.length+' أوردر</div></div>'
      +'<div class="insight-card"><div class="insight-title">أفضل عميل ربحًا</div><div class="insight-value up">'+esc(topClient.name||'—')+'</div><div class="insight-sub">'+(topClientId?money(byClient[topClientId]):'—')+'</div></div>'
      +'<div class="insight-card"><div class="insight-title">أوردرات خاسرة</div><div class="insight-value '+(losses.length?'down':'up')+'">'+losses.length+'</div><div class="insight-sub">'+(best?'أعلى ربح: '+esc(best.code||'')+' · '+money(orderProfitSafe(best)):'لا توجد بيانات')+'</div></div>'
      +'</div></div>';
    stats.insertAdjacentHTML('afterend',html);
  }

  function polishDocs(){
    try{document.documentElement.style.setProperty('--hp-stage6','1')}catch(e){}
  }

  function init(){
    ensureStage6Data(); ensureSettingsOverlay(); addSettingsButton(); injectClientFilters(); polishDocs();
    try{if(activePage==='clients') renderClients(); if(activePage==='reports') renderReports();}catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
