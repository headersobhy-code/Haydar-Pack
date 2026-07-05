/* Haydar Pack V36 FINAL FEATURE INTEGRITY
   Purpose: preserve all previously-approved features after V35 fixes.
   GitHub only. Does not change Apps Script.
*/
(function(){
  'use strict';
  var V='v36-final-integrity';
  var clientFilter='all';
  var clientSort='activity';

  function byId(id){return document.getElementById(id)}
  function arr(name){return (window.DB && Array.isArray(DB[name]))?DB[name]:[]}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function q(v){return String(v==null?'':v).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
  function n(v){try{return num(v)}catch(e){var x=parseFloat(v);return isNaN(x)?0:x}}
  function money(v){try{return fmt(v)}catch(e){return n(v).toLocaleString('ar-EG',{maximumFractionDigits:2})+' ج'}}
  function count(v){try{return countFmt(v)}catch(e){return Math.round(n(v)).toLocaleString('ar-EG')}}
  function today(){try{return todayStr()}catch(e){var d=new Date();return d.toISOString().slice(0,10)}}
  function getClient(cid){return arr('clients').find(function(c){return c.id===cid})||null}
  function orderExpenses(oid){return arr('expenses').filter(function(e){return e.orderId===oid}).reduce(function(s,e){return s+n(e.amount)},0)}
  function clientNo(cid){var i=arr('clients').findIndex(function(c){return c.id===cid});return i>=0?i+1:''}
  function orderDiscount(o){if(window.HP_CALC&&typeof HP_CALC.orderDiscount==='function')return HP_CALC.orderDiscount(o);return Math.max(0,n(o&&(o.invoiceDiscount!=null?o.invoiceDiscount:o.discount)))}
  function bill(o){if(typeof billQty==='function')return billQty(o);return n(o&&o.fQty)>0?n(o.fQty):n(o&&o.qty)}
  function clientTotal(o){if(typeof netClientForOrder==='function')return netClientForOrder(o);var gross=bill(o)*n(o&&o.price)+n(o&&o.aklashe);return Math.max(0,gross-orderDiscount(o))}
  function factoryTotal(o){if(typeof factoryTotalForOrder==='function')return factoryTotalForOrder(o);return n(o&&o.fQty)*n(o&&o.fPrice)+n(o&&o.fAk)}
  function orderProfit(o){if(typeof profitForOrder==='function')return profitForOrder(o);return clientTotal(o)-factoryTotal(o)-orderExpenses(o&&o.id)}
  function clientProfit(c){return arr('orders').filter(function(o){return o.clientId===c.id}).reduce(function(s,o){return s+orderProfit(o)},0)}
  function clientActivity(c){var dates=[];arr('orders').forEach(function(o){if(o.clientId===c.id)dates.push(o.date||'')});arr('payments').forEach(function(p){if(p.clientId===c.id)dates.push(p.date||'')});dates.push(c.updatedAt||c.createdAt||c.month||'');return dates.sort().pop()||''}
  function notify(msg){try{toast(msg)}catch(e){console.log(msg)}}
  function saveRefresh(msg){try{save()}catch(e){try{localStorage.setItem('hayder_bags_app',JSON.stringify(DB))}catch(_){}}try{refreshAll()}catch(e){}if(msg)notify(msg)}

  function ensureDeleteLog(){DB.deletedLog=Array.isArray(DB.deletedLog)?DB.deletedLog:[];}
  function logDelete(entry){ensureDeleteLog();entry.id='del_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);entry.deletedAt=new Date().toISOString();entry.deletedDate=today();DB.deletedLog.unshift(entry);if(DB.deletedLog.length>100)DB.deletedLog=DB.deletedLog.slice(0,100)}

  // Final delete safety: keep delete-log and remove related calculations cleanly.
  window.deleteOrder=function(id){
    var o=arr('orders').find(function(x){return x.id===id});
    if(!o){notify('الأوردر غير موجود');return;}
    if(!confirm('تأكيد حذف الأوردر '+(o.code||'')+'؟\nسيتم حذفه من العميل والمصنع والتقارير مع حفظ نسخة في سجل الحذف.'))return;
    var linked=arr('expenses').filter(function(e){return e.orderId===id});
    logDelete({type:'order',label:'أوردر '+(o.code||''),order:JSON.parse(JSON.stringify(o)),expenses:JSON.parse(JSON.stringify(linked))});
    DB.orders=arr('orders').filter(function(x){return x.id!==id});
    DB.expenses=arr('expenses').filter(function(e){return e.orderId!==id});
    ['dr-order-detail','dr-client-detail','dr-factory-detail'].forEach(function(id){var el=byId(id);if(el)el.classList.remove('open')});
    saveRefresh('تم حذف الأوردر وحفظ نسخة للاسترجاع');
  };

  window.deleteClient=function(cid){
    var c=getClient(cid);
    if(!c){notify('العميل غير موجود');return;}
    var orders=arr('orders').filter(function(o){return o.clientId===cid});
    var ids={};orders.forEach(function(o){ids[o.id]=true});
    var payments=arr('payments').filter(function(p){return p.clientId===cid});
    var expenses=arr('expenses').filter(function(e){return ids[e.orderId]});
    if(!confirm('تأكيد حذف العميل: '+(c.name||'')+'؟\nسيتم حذف العميل وأوردراته ودفعاته من الحسابات مع حفظ نسخة في سجل الحذف.'))return;
    logDelete({type:'client',label:'عميل '+(c.name||''),client:JSON.parse(JSON.stringify(c)),orders:JSON.parse(JSON.stringify(orders)),payments:JSON.parse(JSON.stringify(payments)),expenses:JSON.parse(JSON.stringify(expenses))});
    DB.clients=arr('clients').filter(function(x){return x.id!==cid});
    DB.orders=arr('orders').filter(function(o){return o.clientId!==cid});
    DB.payments=arr('payments').filter(function(p){return p.clientId!==cid});
    DB.expenses=arr('expenses').filter(function(e){return !ids[e.orderId]});
    ['dr-client','dr-client-detail','dr-order-detail'].forEach(function(id){var el=byId(id);if(el)el.classList.remove('open')});
    saveRefresh('تم حذف العميل وحفظ نسخة للاسترجاع');
  };

  window.hpStage6RestoreDeleted=window.hpStage6RestoreDeleted||function(logId){
    ensureDeleteLog();var entry=DB.deletedLog.find(function(x){return x.id===logId});if(!entry||entry.restoredAt){notify('السجل غير متاح للاسترجاع');return;}
    if(entry.type==='order'&&entry.order){if(!arr('orders').some(function(o){return o.id===entry.order.id}))DB.orders.push(entry.order);(entry.expenses||[]).forEach(function(e){if(!arr('expenses').some(function(x){return x.id===e.id}))DB.expenses.push(e);});}
    if(entry.type==='client'&&entry.client){if(!arr('clients').some(function(c){return c.id===entry.client.id}))DB.clients.push(entry.client);(entry.orders||[]).forEach(function(o){if(!arr('orders').some(function(x){return x.id===o.id}))DB.orders.push(o);});(entry.payments||[]).forEach(function(p){if(!arr('payments').some(function(x){return x.id===p.id}))DB.payments.push(p);});(entry.expenses||[]).forEach(function(e){if(!arr('expenses').some(function(x){return x.id===e.id}))DB.expenses.push(e);});}
    entry.restoredAt=new Date().toISOString();saveRefresh('تم الاسترجاع من سجل الحذف');
  };

  function ensureClientFilters(){
    var page=byId('pg-clients');if(!page)return;
    // V41.1 stable fix: one filter bar only.
    // If old Stage6 filter or duplicated V36 filters exist, remove them all once and rebuild one clean bar.
    var all=[].slice.call(page.querySelectorAll('#hp-v36-client-filter,#hp-stage6-client-filter,.hp-stage6-filter'));
    var cleanOne=(all.length===1 && all[0].id==='hp-v36-client-filter');
    if(cleanOne)return;
    all.forEach(function(el){try{el.remove()}catch(e){}});
    var search=page.querySelector('.search-wrap');
    var html='<div id="hp-v36-client-filter" class="hp-stage6-filter"><div class="chips"><button class="chip active" data-f="all">كل العملاء</button><button class="chip" data-f="due">عليه باقي</button><button class="chip" data-f="paid">حسابه منتهي</button><button class="chip" data-f="credit">له رصيد</button></div><div class="chips"><button class="chip active" data-s="activity">الأحدث حركة</button><button class="chip" data-s="number">رقم العميل</button><button class="chip" data-s="name">الاسم</button><button class="chip" data-s="balance">أكبر مديونية</button><button class="chip" data-s="profit">أعلى ربح</button></div></div>';
    if(search)search.insertAdjacentHTML('afterend',html);else page.insertAdjacentHTML('afterbegin',html);
    page.querySelectorAll('#hp-v36-client-filter [data-f]').forEach(function(b){b.onclick=function(){clientFilter=b.getAttribute('data-f');page.querySelectorAll('#hp-v36-client-filter [data-f]').forEach(function(x){x.classList.remove('active')});b.classList.add('active');renderClients();};});
    page.querySelectorAll('#hp-v36-client-filter [data-s]').forEach(function(b){b.onclick=function(){clientSort=b.getAttribute('data-s');page.querySelectorAll('#hp-v36-client-filter [data-s]').forEach(function(x){x.classList.remove('active')});b.classList.add('active');renderClients();};});
  }

  window.renderClients=function(){
    ensureClientFilters();
    var qv=(byId('q-clients')?byId('q-clients').value:'').trim().toLowerCase();
    var clients=arr('clients').slice().filter(function(c){
      var bal=typeof clientBalance==='function'?clientBalance(c.id):0;
      if(clientFilter==='due'&&!(bal>0))return false;
      if(clientFilter==='paid'&&!(Math.abs(bal)<0.01))return false;
      if(clientFilter==='credit'&&!(bal<0))return false;
      if(!qv)return true;
      var no=String(clientNo(c.id));
      return no===qv||String(c.name||'').toLowerCase().includes(qv)||String(c.phone||'').toLowerCase().includes(qv)||String(c.addr||'').toLowerCase().includes(qv);
    });
    clients.sort(function(a,b){
      if(clientSort==='number')return clientNo(a.id)-clientNo(b.id);
      if(clientSort==='name')return String(a.name||'').localeCompare(String(b.name||''),'ar');
      if(clientSort==='balance')return (typeof clientBalance==='function'?clientBalance(b.id):0)-(typeof clientBalance==='function'?clientBalance(a.id):0);
      if(clientSort==='profit')return clientProfit(b)-clientProfit(a);
      return String(clientActivity(b)).localeCompare(String(clientActivity(a)));
    });
    var holder=byId('clients-list');if(!holder)return;
    holder.innerHTML=clients.length?clients.map(function(c){
      var no=clientNo(c.id), bal=typeof clientBalance==='function'?clientBalance(c.id):0, total=(typeof clientTotal==='function'?clientTotal(c.id):0)+n(c.debt), paid=typeof clientPaid==='function'?clientPaid(c.id):0, pct=total>0?Math.min(100,Math.round(paid/total*100)):0, ords=arr('orders').filter(function(o){return o.clientId===c.id}).length, prof=clientProfit(c);
      return '<div class="card clickable" onclick="openClientDetail(\''+q(c.id)+'\')"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:10px"><div style="display:flex;align-items:center;gap:10px"><div class="avatar av-blue">'+no+'</div><div><div class="row-name">'+no+'- '+esc(c.name||'')+'</div><div class="row-sub">'+esc(c.phone||'بدون هاتف')+(c.addr?' · '+esc(c.addr):'')+'</div></div></div><span class="badge '+(bal>0?'bg-red':bal<0?'bg-green':'bg-gray')+'">'+(bal>0?money(bal)+' باقي':bal<0?money(-bal)+' رصيد':'مكتمل')+'</span></div><div class="prog"><div class="prog-fill" style="width:'+pct+'%"></div></div><div class="tiny muted" style="margin-top:4px">'+pct+'% مدفوع · '+ords+' أوردر · ربح '+money(prof)+'</div></div>';
    }).join(''):'<div class="empty"><i class="ti ti-users"></i><p>لا يوجد عملاء حسب الفلتر الحالي</p></div>';
  };

  // Final client detail with edit/debt/delete always present and profit by order.
  window.openClientDetail=function(cid){
    var c=getClient(cid); if(!c)return;
    var orders=arr('orders').filter(function(o){return o.clientId===cid});
    var payments=arr('payments').filter(function(p){return p.clientId===cid});
    var total=(typeof clientTotal==='function'?clientTotal(cid):orders.reduce(function(s,o){return s+clientTotal(o)},0))+n(c.debt);
    var paid=typeof clientPaid==='function'?clientPaid(cid):payments.reduce(function(s,p){return s+n(p.amount)},0)+orders.reduce(function(s,o){return s+n(o.deposit)},0);
    var bal=typeof clientBalance==='function'?clientBalance(cid):total-paid;
    var profitSum=orders.reduce(function(s,o){return s+orderProfit(o)},0);
    var orderHtml=orders.length?orders.map(function(o){var p=orderProfit(o), exp=orderExpenses(o.id);return '<div class="row"><label class="doc-select-row"><input type="checkbox" class="client-order-check" value="'+esc(o.id)+'"><span><span class="row-name">'+esc(o.code||'')+' '+(typeof statusBadge==='function'?statusBadge(o.status):esc(o.status||''))+'</span><span class="row-sub">'+esc(o.date||'')+' · نهائي '+count(bill(o))+' · مصنع '+money(factoryTotal(o))+(exp>0?' · مصاريف '+money(exp):'')+'</span></span></label><div style="text-align:left"><div class="row-val">'+money(clientTotal(o))+'</div><div class="tiny '+(p>=0?'success':'danger')+'">صافي الربح: '+money(p)+'</div><button class="btn small" onclick="closeDrawer(\'dr-client-detail\');openOrderDetail(\''+q(o.id)+'\')">فتح</button></div></div>'}).join(''):'<p class="muted tiny">لا توجد أوردرات</p>';
    var payHtml=payments.length?payments.map(function(p){return '<div class="row"><div><div class="row-name">'+money(p.amount)+'</div><div class="row-sub">'+esc(p.date||'')+(p.note?' · '+esc(p.note):'')+'</div>'+(typeof receiptLink==='function'?receiptLink(p.receipt):'')+'</div><span class="badge bg-green">مدفوع</span></div>'}).join(''):'<p class="muted tiny">لا توجد دفعات</p>';
    var body=byId('client-detail-body'); if(!body)return;
    body.innerHTML='<div class="drawer-handle"></div><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div class="avatar av-blue" style="width:56px;height:56px;font-size:25px">'+esc((c.name||'?').charAt(0))+'</div><div><div class="drawer-title" style="margin:0">'+clientNo(cid)+'- '+esc(c.name||'')+'</div><div class="row-sub">'+esc(c.phone||'')+(c.addr?' · '+esc(c.addr):'')+'</div></div></div><div class="stat-grid"><div class="stat-box blue"><div class="sl">إجمالي الطلبات</div><div class="sv">'+money(total)+'</div></div><div class="stat-box green"><div class="sl">المدفوع شامل العربون</div><div class="sv">'+money(paid)+'</div></div><div class="stat-box '+(bal>0?'red':'green')+'"><div class="sl">الرصيد</div><div class="sv">'+(bal>0?money(bal)+' باقي':bal<0?money(-bal)+' رصيد':'الحساب منتهي')+'</div></div><div class="stat-box amber"><div class="sl">مجموع صافي ربحك</div><div class="sv">'+money(profitSum)+'</div></div></div><div id="hp-v36-client-actions" class="btn-row" style="margin:10px 0 14px"><button class="btn amber" onclick="closeDrawer(\'dr-client-detail\');openClientForm(\''+q(cid)+'\')"><i class="ti ti-edit"></i> تعديل بيانات العميل والمديونية</button><button class="btn red-out" onclick="deleteClient(\''+q(cid)+'\')"><i class="ti ti-trash"></i> حذف العميل</button></div><button class="btn green full" style="margin-bottom:12px" onclick="closeDrawer(\'dr-client-detail\');openPaymentForm(\''+q(cid)+'\')"><i class="ti ti-plus"></i> تسجيل دفعة</button><div class="sec-label">اختيار أوردرات لعرض السعر أو الفاتورة</div><div class="doc-action-bar"><button class="btn" onclick="toggleClientOrdersSelection(\''+q(cid)+'\')"><i class="ti ti-checks"></i> تحديد/إلغاء الكل</button><button class="btn blue" onclick="printSelectedClientQuote(\''+q(cid)+'\')"><i class="ti ti-file-dollar"></i> عرض سعر للمحدد</button><button class="btn green" onclick="printSelectedClientInvoice(\''+q(cid)+'\')"><i class="ti ti-file-invoice"></i> فاتورة للمحدد</button><button class="btn amber" onclick="printSelectedClientStatement(\''+q(cid)+'\')"><i class="ti ti-file-description"></i> كشف حساب عميل</button><button class="btn" onclick="exportClientReportExcel(\''+q(cid)+'\')"><i class="ti ti-file-spreadsheet"></i> تقرير Excel</button></div><div class="card">'+orderHtml+'</div><div class="sec-label">الدفعات ('+payments.length+')</div><div class="card">'+payHtml+'</div><button class="btn full" style="margin-top:10px" onclick="closeDrawer(\'dr-client-detail\')">إغلاق</button>';
    if(typeof openDrawer==='function')openDrawer('dr-client-detail');
  };

  // Keep client form delete button present when editing.
  var previousOpenClientForm=window.openClientForm;
  if(previousOpenClientForm){
    window.openClientForm=function(cid){
      var r=previousOpenClientForm.apply(this,arguments);
      setTimeout(function(){
        var drawer=document.querySelector('#dr-client .drawer'); if(!drawer)return;
        var old=byId('hp-v36-client-form-delete'); if(old)old.remove();
        if(cid)drawer.insertAdjacentHTML('beforeend','<button id="hp-v36-client-form-delete" class="btn red-out full" style="margin-top:12px" onclick="deleteClient(\''+q(cid)+'\')"><i class="ti ti-trash"></i> حذف العميل من الحسابات</button>');
      },20);
      return r;
    };
  }

  // Auto archive delivered orders - final guard.
  var oldChange=window.changeOrderStatus;
  window.changeOrderStatus=function(id,st){
    if(typeof oldChange==='function')oldChange(id,st);else{var o=arr('orders').find(function(x){return x.id===id});if(o)o.status=st;}
    var o=arr('orders').find(function(x){return x.id===id});
    if(o&&st==='تم التوصيل للعميل'){o.status=st;o.deliveredAt=o.deliveredAt||today();o.archived=true;o.archivedAt=o.archivedAt||today();try{save()}catch(e){}notify('تم التسليم ونقل الأوردر للأرشيف تلقائيًا');}
    try{refreshAll()}catch(e){}
  };

  function init(){
    ensureClientFilters();
    try{renderClients()}catch(e){}
    try{if(typeof HP_autoArchiveDelivered==='function')HP_autoArchiveDelivered()}catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
