/* Haydar Pack V49 final-stable bundle: 07-clients-final.js
   Sources: 19-v43-clients-cleanup.js
   Based on V44.1 Sync Fix; production cleanup without business-logic changes. */



/* ===== BEGIN SOURCE: 19-v43-clients-cleanup.js ===== */

/* Haydar Pack V43 — Clients Cleanup
   Scope: clients page/runtime only. Final single owner for:
   - client filters/sort bar
   - renderClients
   - openClientDetail
   - openClientForm/saveClient
   - deleteClient with delete-log safety
   GitHub only. Does not alter Apps Script or cloud data schema.
*/
(function(){
  'use strict';
  var VERSION='49.0.0-final-stable';
  var state={filter:'all',sort:'activity'};

  function $(id){return document.getElementById(id)}
  function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function arr(name){return (window.DB && Array.isArray(DB[name]))?DB[name]:[]}
  function ensureArr(name){if(!window.DB)window.DB={};if(!Array.isArray(DB[name]))DB[name]=[];return DB[name]}
  function n(v){try{return typeof num==='function'?num(v):(parseFloat(v)||0)}catch(e){var x=parseFloat(v);return isNaN(x)?0:x}}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function attr(v){return String(v==null?'':v).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
  function money(v){try{return typeof fmt==='function'?fmt(v):n(v).toLocaleString('ar-EG',{maximumFractionDigits:2})+' ج'}catch(e){return String(n(v))+' ج'}}
  function count(v){try{return typeof countFmt==='function'?countFmt(v):Math.round(n(v)).toLocaleString('ar-EG')}catch(e){return String(Math.round(n(v)))}}
  function today(){try{return typeof todayStr==='function'?todayStr():new Date().toISOString().slice(0,10)}catch(e){return new Date().toISOString().slice(0,10)}}
  function now(){return new Date().toISOString()}
  function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.log(msg)}catch(e){}}
  function closeIf(id){try{var el=$(id);if(el)el.classList.remove('open')}catch(e){}}
  function openIf(id){try{if(typeof openDrawer==='function')openDrawer(id);else{var el=$(id);if(el)el.classList.add('open')}}catch(e){}}
  function clone(v){try{return JSON.parse(JSON.stringify(v||{}))}catch(e){return v}}

  function getClient(cid){return arr('clients').find(function(c){return c.id===cid})||null}
  function clientNo(cid){var i=arr('clients').findIndex(function(c){return c.id===cid});return i>=0?i+1:''}
  function clientOrders(cid){return arr('orders').filter(function(o){return o.clientId===cid})}
  function clientPayments(cid){return arr('payments').filter(function(p){return p.clientId===cid})}
  function orderBillQty(o){if(typeof window.billQty==='function')return window.billQty(o);return n(o&&o.fQty)>0?n(o.fQty):n(o&&o.qty)}
  function orderDiscount(o){if(window.HP_CALC&&typeof HP_CALC.orderDiscount==='function')return HP_CALC.orderDiscount(o);return Math.max(0,n(o&&(o.invoiceDiscount!=null?o.invoiceDiscount:o.discount)))}
  function orderClientNet(o){if(window.HP_CALC&&typeof HP_CALC.clientNetForOrder==='function')return HP_CALC.clientNetForOrder(o);if(typeof window.netClientForOrder==='function')return window.netClientForOrder(o);if(typeof window.clientTotalForOrder==='function')return window.clientTotalForOrder(o);return Math.max(0,orderBillQty(o)*n(o&&o.price)+n(o&&o.aklashe)-orderDiscount(o))}
  function orderFactoryTotal(o){if(window.HP_CALC&&typeof HP_CALC.factoryTotalForOrder==='function')return HP_CALC.factoryTotalForOrder(o);if(typeof window.factoryTotalForOrder==='function')return window.factoryTotalForOrder(o);return n(o&&o.fQty)*n(o&&o.fPrice)+n(o&&o.fAk)}
  function orderExpenseTotal(oid){if(window.HP_CALC&&typeof HP_CALC.orderExpenseTotal==='function')return HP_CALC.orderExpenseTotal(oid);if(typeof window.orderExpenses==='function')return window.orderExpenses(oid);return arr('expenses').filter(function(e){return e.orderId===oid}).reduce(function(s,e){return s+n(e.amount)},0)}
  function orderProfit(o){if(window.HP_CALC&&typeof HP_CALC.profitForOrder==='function')return HP_CALC.profitForOrder(o);if(typeof window.profitForOrder==='function')return window.profitForOrder(o);return orderClientNet(o)-orderFactoryTotal(o)-orderExpenseTotal(o&&o.id)}
  function clientTotalSafe(cid){if(window.HP_CALC&&typeof HP_CALC.clientTotal==='function')return HP_CALC.clientTotal(cid);if(typeof window.clientTotal==='function')return window.clientTotal(cid);return clientOrders(cid).reduce(function(s,o){return s+orderClientNet(o)},0)}
  function clientPaidSafe(cid){if(window.HP_CALC&&typeof HP_CALC.clientPaid==='function')return HP_CALC.clientPaid(cid);if(typeof window.clientPaid==='function')return window.clientPaid(cid);var deps=clientOrders(cid).reduce(function(s,o){return s+n(o.deposit)},0);var pays=clientPayments(cid).reduce(function(s,p){return s+n(p.amount)},0);return deps+pays}
  function clientBalanceSafe(cid){var c=getClient(cid)||{};if(window.HP_CALC&&typeof HP_CALC.clientBalance==='function')return HP_CALC.clientBalance(cid);if(typeof window.clientBalance==='function')return window.clientBalance(cid);return clientTotalSafe(cid)+n(c.debt)-clientPaidSafe(cid)}
  function clientProfit(c){return clientOrders(c.id).reduce(function(s,o){return s+orderProfit(o)},0)}
  function clientActivity(c){var dates=[];clientOrders(c.id).forEach(function(o){dates.push(o.updatedAt||o.deliveredAt||o.archivedAt||o.date||'')});clientPayments(c.id).forEach(function(p){dates.push(p.updatedAt||p.date||'')});dates.push(c.updatedAt||c.createdAt||c.month||'');return dates.sort().pop()||''}

  function setActiveButtons(bar){
    if(!bar)return;
    qa('[data-f]',bar).forEach(function(b){b.classList.toggle('active',b.getAttribute('data-f')===state.filter)});
    qa('[data-s]',bar).forEach(function(b){b.classList.toggle('active',b.getAttribute('data-s')===state.sort)});
  }
  function ensureClientFilters(){
    var page=$('pg-clients');if(!page)return null;
    var existing=qa('#hp-v43-client-filter',page);
    if(existing.length===1){setActiveButtons(existing[0]);return existing[0]}
    qa('#hp-v43-client-filter,#hp-v36-client-filter,#hp-stage6-client-filter,.hp-stage6-filter',page).forEach(function(el){try{el.remove()}catch(e){}});
    var html='<div id="hp-v43-client-filter" class="hp-stage6-filter hp-v43-filter"><div class="chips"><button class="chip" data-f="all">كل العملاء</button><button class="chip" data-f="due">عليه باقي</button><button class="chip" data-f="paid">حسابه منتهي</button><button class="chip" data-f="credit">له رصيد</button></div><div class="chips"><button class="chip" data-s="activity">الأحدث حركة</button><button class="chip" data-s="number">رقم العميل</button><button class="chip" data-s="name">الاسم</button><button class="chip" data-s="balance">أكبر مديونية</button><button class="chip" data-s="profit">أعلى ربح</button></div><div class="tiny muted" id="hp-v43-client-count" style="font-weight:900;margin-top:8px"></div></div>';
    var search=page.querySelector('.search-wrap');
    if(search)search.insertAdjacentHTML('afterend',html);else page.insertAdjacentHTML('afterbegin',html);
    var bar=$('hp-v43-client-filter');
    qa('[data-f]',bar).forEach(function(b){b.onclick=function(){state.filter=b.getAttribute('data-f')||'all';window.renderClients()}});
    qa('[data-s]',bar).forEach(function(b){b.onclick=function(){state.sort=b.getAttribute('data-s')||'activity';window.renderClients()}});
    setActiveButtons(bar);return bar;
  }

  function filteredSortedClients(){
    var qv=(($('q-clients')&&$('q-clients').value)||'').trim().toLowerCase();
    var all=arr('clients').slice();
    var list=all.filter(function(c){
      var bal=clientBalanceSafe(c.id);
      if(state.filter==='due'&&!(bal>0))return false;
      if(state.filter==='paid'&&!(Math.abs(bal)<0.01))return false;
      if(state.filter==='credit'&&!(bal<0))return false;
      if(!qv)return true;
      var no=String(clientNo(c.id));
      return no===qv||String(c.name||'').toLowerCase().indexOf(qv)>=0||String(c.phone||'').toLowerCase().indexOf(qv)>=0||String(c.addr||'').toLowerCase().indexOf(qv)>=0;
    });
    list.sort(function(a,b){
      if(state.sort==='number')return clientNo(a.id)-clientNo(b.id);
      if(state.sort==='name')return String(a.name||'').localeCompare(String(b.name||''),'ar');
      if(state.sort==='balance')return clientBalanceSafe(b.id)-clientBalanceSafe(a.id);
      if(state.sort==='profit')return clientProfit(b)-clientProfit(a);
      return String(clientActivity(b)).localeCompare(String(clientActivity(a)));
    });
    return {list:list,total:all.length};
  }

  window.renderClients=function(){
    var bar=ensureClientFilters();
    var holder=$('clients-list');if(!holder)return;
    var res=filteredSortedClients(), clients=res.list;
    var countLine=$('hp-v43-client-count');if(countLine)countLine.textContent='المعروض: '+clients.length+' من '+res.total+' عميل';
    holder.innerHTML=clients.length?clients.map(function(c){
      var no=clientNo(c.id), bal=clientBalanceSafe(c.id), total=clientTotalSafe(c.id)+n(c.debt), paid=clientPaidSafe(c.id), pct=total>0?Math.min(100,Math.round(paid/total*100)):0, ords=clientOrders(c.id).length, prof=clientProfit(c);
      return '<div class="card clickable" onclick="openClientDetail(\''+attr(c.id)+'\')"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:10px"><div style="display:flex;align-items:center;gap:10px"><div class="avatar av-blue">'+esc(no||'?')+'</div><div><div class="row-name">'+esc(no)+'- '+esc(c.name||'')+'</div><div class="row-sub">'+esc(c.phone||'بدون هاتف')+(c.addr?' · '+esc(c.addr):'')+'</div></div></div><span class="badge '+(bal>0?'bg-red':bal<0?'bg-green':'bg-gray')+'">'+(bal>0?money(bal)+' باقي':bal<0?money(-bal)+' رصيد':'مكتمل')+'</span></div><div class="prog"><div class="prog-fill" style="width:'+pct+'%"></div></div><div class="tiny muted" style="margin-top:4px">'+pct+'% مدفوع · '+ords+' أوردر · ربح '+money(prof)+'</div></div>';
    }).join(''):'<div class="empty"><i class="ti ti-users"></i><p>لا يوجد عملاء حسب الفلتر الحالي</p></div>';
    setActiveButtons(bar);
  };

  function ensureClientForm(){
    var dr=$('dr-client');if(!dr)return;
    var drawer=dr.querySelector('.drawer');if(!drawer)return;
    if(!$('c-edit-id')){var hidden=document.createElement('input');hidden.type='hidden';hidden.id='c-edit-id';drawer.insertBefore(hidden,drawer.children[1]||drawer.firstChild)}
    var title=drawer.querySelector('.drawer-title');if(title&&!$('client-drawer-title'))title.innerHTML='<i class="ti ti-user-plus"></i> <span id="client-drawer-title">عميل جديد</span>';
    var btn=drawer.querySelector('button[onclick="saveClient()"]');if(btn){btn.id='client-save-btn'}
  }
  function patchAddButton(){
    var btn=document.querySelector('#pg-clients .btn.primary');
    if(btn)btn.setAttribute('onclick','openClientForm()');
  }
  function clearClientForm(){['c-name','c-phone','c-addr','c-debt'].forEach(function(id){var el=$(id);if(el)el.value=''})}
  function removeFormDeleteButtons(){qa('#hp-v25-delete-client-form,#hp-stage6-client-form-delete,#hp-v36-client-form-delete,#hp-v43-client-form-delete').forEach(function(el){try{el.remove()}catch(e){}})}

  window.openClientForm=function(cid){
    ensureClientForm();patchAddButton();removeFormDeleteButtons();
    var edit=$('c-edit-id'), title=$('client-drawer-title'), btn=$('client-save-btn');
    if(edit)edit.value='';clearClientForm();
    if(title)title.textContent='عميل جديد';if(btn)btn.innerHTML='<i class="ti ti-check"></i> إضافة';
    if(cid){
      var c=getClient(cid);
      if(c){
        if(edit)edit.value=c.id;
        if(title)title.textContent='تعديل بيانات العميل';
        if(btn)btn.innerHTML='<i class="ti ti-check"></i> حفظ التعديل';
        if($('c-name'))$('c-name').value=c.name||'';
        if($('c-phone'))$('c-phone').value=c.phone||'';
        if($('c-addr'))$('c-addr').value=c.addr||'';
        if($('c-debt'))$('c-debt').value=n(c.debt)||'';
        var drawer=document.querySelector('#dr-client .drawer');
        if(drawer)drawer.insertAdjacentHTML('beforeend','<button id="hp-v43-client-form-delete" class="btn red-out full" style="margin-top:12px" onclick="deleteClient(\''+attr(cid)+'\')"><i class="ti ti-trash"></i> حذف العميل من الحسابات</button>');
      }
    }
    openIf('dr-client');
  };

  window.saveClient=function(){
    ensureClientForm();
    var name=(($('c-name')&&$('c-name').value)||'').trim();
    if(!name){toastSafe('أدخل اسم العميل');return}
    var edit=$('c-edit-id'), id=edit?String(edit.value||''):'';
    var patch={name:name,phone:(($('c-phone')&&$('c-phone').value)||''),addr:(($('c-addr')&&$('c-addr').value)||''),debt:n($('c-debt')&&$('c-debt').value),updatedAt:now()};
    if(id){
      var c=getClient(id);if(!c){toastSafe('العميل غير موجود');return}
      Object.assign(c,patch);toastSafe('تم تعديل بيانات العميل');
    }else{
      ensureArr('clients').push(Object.assign({id:(typeof uid==='function'?uid():('c_'+Date.now())),month:(typeof curMonth==='function'?curMonth():today().slice(0,7)),createdAt:now()},patch));
      toastSafe('تم إضافة العميل');
    }
    try{if(window.HP_V39_GUARD&&typeof HP_V39_GUARD.saveSafeSnapshot==='function')HP_V39_GUARD.saveSafeSnapshot(id?'v43-client-edit':'v43-client-add')}catch(e){}
    try{if(typeof save==='function')save()}catch(e){try{localStorage.setItem('hayder_bags_app',JSON.stringify(DB))}catch(_){}}
    closeIf('dr-client');clearClientForm();removeFormDeleteButtons();if(edit)edit.value='';
    try{if(typeof refreshAll==='function')refreshAll();else window.renderClients()}catch(e){window.renderClients()}
    if(id)setTimeout(function(){window.openClientDetail(id)},120);
  };

  function logDelete(entry){
    ensureArr('deletedLog');
    entry.id='del_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
    entry.deletedAt=now();entry.deletedDate=today();
    DB.deletedLog.unshift(entry);if(DB.deletedLog.length>120)DB.deletedLog=DB.deletedLog.slice(0,120);
  }
  window.deleteClient=function(cid){
    var c=getClient(cid);if(!c){toastSafe('العميل غير موجود');return}
    var orders=clientOrders(cid), ids={};orders.forEach(function(o){ids[o.id]=true});
    var payments=clientPayments(cid), expenses=arr('expenses').filter(function(e){return ids[e.orderId]});
    if(!confirm('تأكيد حذف العميل: '+(c.name||'')+'؟\n\nسيتم حذف العميل وأوردراته ودفعاته من الحسابات، مع حفظ نسخة في سجل الحذف للاسترجاع.'))return;
    try{if(window.HP_V39_GUARD&&typeof HP_V39_GUARD.saveSafeSnapshot==='function')HP_V39_GUARD.saveSafeSnapshot('before-v43-delete-client')}catch(e){}
    logDelete({type:'client',label:'عميل '+(c.name||''),client:clone(c),orders:clone(orders),payments:clone(payments),expenses:clone(expenses)});
    DB.clients=arr('clients').filter(function(x){return x.id!==cid});
    DB.orders=arr('orders').filter(function(o){return o.clientId!==cid});
    DB.payments=arr('payments').filter(function(p){return p.clientId!==cid});
    DB.expenses=arr('expenses').filter(function(e){return !ids[e.orderId]});
    closeIf('dr-client');closeIf('dr-client-detail');closeIf('dr-order-detail');
    try{if(typeof save==='function')save()}catch(e){try{localStorage.setItem('hayder_bags_app',JSON.stringify(DB))}catch(_){}}
    try{if(typeof refreshAll==='function')refreshAll();else window.renderClients()}catch(e){}
    toastSafe('تم حذف العميل وحفظ نسخة في سجل الحذف');
  };

  window.openClientDetail=function(cid){
    var c=getClient(cid);if(!c){toastSafe('العميل غير موجود');return}
    var orders=clientOrders(cid).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))});
    var payments=clientPayments(cid).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))});
    var total=clientTotalSafe(cid)+n(c.debt), paid=clientPaidSafe(cid), bal=clientBalanceSafe(cid), profitSum=orders.reduce(function(s,o){return s+orderProfit(o)},0);
    var orderHtml=orders.length?orders.map(function(o){var p=orderProfit(o), exp=orderExpenseTotal(o.id);return '<div class="row"><label class="doc-select-row" onclick="event.stopPropagation()"><input type="checkbox" class="client-order-check" value="'+esc(o.id)+'"><span><span class="row-name">'+esc(o.code||'')+' '+(typeof statusBadge==='function'?statusBadge(o.status):esc(o.status||''))+'</span><span class="row-sub">'+esc(o.date||'')+' · نهائي '+count(orderBillQty(o))+' · مصنع '+money(orderFactoryTotal(o))+(exp>0?' · مصاريف '+money(exp):'')+'</span></span></label><div style="text-align:left"><div class="row-val">'+money(orderClientNet(o))+'</div><div class="tiny '+(p>=0?'success':'danger')+'">صافي الربح: '+money(p)+'</div><button class="btn small" onclick="closeDrawer(\'dr-client-detail\');openOrderDetail(\''+attr(o.id)+'\')">فتح</button></div></div>'}).join(''):'<p class="muted tiny">لا توجد أوردرات</p>';
    var payHtml=payments.length?payments.map(function(p){return '<div class="row"><div><div class="row-name">'+money(p.amount)+'</div><div class="row-sub">'+esc(p.date||'')+(p.note?' · '+esc(p.note):'')+'</div>'+(typeof receiptLink==='function'?receiptLink(p.receipt):'')+'</div><span class="badge bg-green">مدفوع</span></div>'}).join(''):'<p class="muted tiny">لا توجد دفعات</p>';
    var body=$('client-detail-body');if(!body)return;
    body.innerHTML='<div class="drawer-handle"></div><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div class="avatar av-blue" style="width:56px;height:56px;font-size:25px">'+esc((c.name||'?').charAt(0))+'</div><div><div class="drawer-title" style="margin:0">'+esc(clientNo(cid))+'- '+esc(c.name||'')+'</div><div class="row-sub">'+esc(c.phone||'')+(c.addr?' · '+esc(c.addr):'')+'</div></div></div><div class="stat-grid"><div class="stat-box blue"><div class="sl">إجمالي الطلبات</div><div class="sv">'+money(total)+'</div></div><div class="stat-box green"><div class="sl">المدفوع شامل العربون</div><div class="sv">'+money(paid)+'</div></div><div class="stat-box '+(bal>0?'red':'green')+'"><div class="sl">الرصيد</div><div class="sv">'+(bal>0?money(bal)+' باقي':bal<0?money(-bal)+' رصيد':'الحساب منتهي')+'</div></div><div class="stat-box amber"><div class="sl">مجموع صافي ربحك</div><div class="sv">'+money(profitSum)+'</div></div></div><div id="hp-v43-client-actions" class="btn-row" style="margin:10px 0 14px"><button class="btn amber" onclick="closeDrawer(\'dr-client-detail\');openClientForm(\''+attr(cid)+'\')"><i class="ti ti-edit"></i> تعديل بيانات العميل والمديونية</button><button class="btn red-out" onclick="deleteClient(\''+attr(cid)+'\')"><i class="ti ti-trash"></i> حذف العميل</button></div><button class="btn green full" style="margin-bottom:12px" onclick="closeDrawer(\'dr-client-detail\');openPaymentForm(\''+attr(cid)+'\')"><i class="ti ti-plus"></i> تسجيل دفعة</button><div class="sec-label">اختيار أوردرات لعرض السعر أو الفاتورة</div><div class="doc-action-bar"><button class="btn" onclick="toggleClientOrdersSelection(\''+attr(cid)+'\')"><i class="ti ti-checks"></i> تحديد/إلغاء الكل</button><button class="btn blue" onclick="printSelectedClientQuote(\''+attr(cid)+'\')"><i class="ti ti-file-dollar"></i> عرض سعر للمحدد</button><button class="btn green" onclick="printSelectedClientInvoice(\''+attr(cid)+'\')"><i class="ti ti-file-invoice"></i> فاتورة للمحدد</button><button class="btn amber" onclick="printSelectedClientStatement(\''+attr(cid)+'\')"><i class="ti ti-file-description"></i> كشف حساب عميل</button><button class="btn" onclick="exportClientReportExcel(\''+attr(cid)+'\')"><i class="ti ti-file-spreadsheet"></i> تقرير Excel</button></div><div class="card">'+orderHtml+'</div><div class="sec-label">الدفعات ('+payments.length+')</div><div class="card">'+payHtml+'</div><button class="btn full" style="margin-top:10px" onclick="closeDrawer(\'dr-client-detail\')">إغلاق</button>';
    openIf('dr-client-detail');
  };

  function boot(){ensureClientForm();patchAddButton();ensureClientFilters();try{if((window.activePage||'')==='clients')window.renderClients()}catch(e){}}
  window.HP_CLIENTS={version:VERSION,render:window.renderClients,openDetail:window.openClientDetail,openForm:window.openClientForm,save:window.saveClient,deleteClient:window.deleteClient};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setTimeout(boot,600);
})();


/* ===== END SOURCE: 19-v43-clients-cleanup.js ===== */
