/* Haydar Pack V50 final-stable bundle: 07-clients-final.js
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
  var VERSION='2026.08.07-production-fix.5';
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

  function getPayment(paymentId){return arr('payments').find(function(p){return String(p&&p.id)===String(paymentId||'')})||null}
  function ensurePaymentForm(){
    var drawer=$('dr-payment');if(!drawer)return;
    var panel=drawer.querySelector('.drawer');if(!panel)return;
    if(!$('pay-edit-id')){var hidden=document.createElement('input');hidden.type='hidden';hidden.id='pay-edit-id';var cid=$('pay-cid');if(cid&&cid.parentNode)cid.parentNode.insertBefore(hidden,cid.nextSibling);else panel.appendChild(hidden)}
    var title=panel.querySelector('.drawer-title');if(title&&!$('pay-drawer-title'))title.innerHTML='<i class="ti ti-cash"></i> <span id="pay-drawer-title">تسجيل دفعة عميل</span>';
    var button=panel.querySelector('button[onclick="savePayment()"]');if(button){button.id='pay-save-btn'}
  }
  function setPaymentReceipt(receipt){
    if(!window.lastReceiptPreview)window.lastReceiptPreview={};
    window.lastReceiptPreview.payment=receipt&&typeof receipt==='object'?clone(receipt):null;
    var preview=$('pay-receipt-preview');if(!preview)return;
    if(receipt&&receipt.data){preview.src=receipt.data;preview.classList.remove('hide')}else{preview.removeAttribute('src');preview.classList.add('hide')}
  }

  window.openPaymentForm=function(cid,paymentId){
    ensurePaymentForm();
    var c=getClient(cid),payment=paymentId?getPayment(paymentId):null,edit=$('pay-edit-id'),title=$('pay-drawer-title'),button=$('pay-save-btn');
    if(!c){toastSafe('العميل غير موجود');return}
    if(paymentId&&!payment){toastSafe('الدفعة غير موجودة');return}
    if(edit)edit.value=payment?payment.id:'';
    if($('pay-cid'))$('pay-cid').value=cid;
    if($('pay-info'))$('pay-info').textContent=(payment?'تعديل دفعة لـ: ':'تسجيل دفعة لـ: ')+(c.name||'');
    if($('pay-amt'))$('pay-amt').value=payment?n(payment.amount):'';
    if($('pay-date'))$('pay-date').value=payment&&payment.date?payment.date:today();
    if($('pay-note'))$('pay-note').value=payment&&payment.note?payment.note:'';
    if($('pay-receipt'))$('pay-receipt').value='';
    setPaymentReceipt(payment&&payment.receipt?payment.receipt:null);
    if(title)title.textContent=payment?'تعديل دفعة العميل':'تسجيل دفعة عميل';
    if(button)button.innerHTML=payment?'<i class="ti ti-check"></i> حفظ تعديل الدفعة':'<i class="ti ti-check"></i> حفظ الدفعة';
    openIf('dr-payment');
  };

  window.editPayment=function(paymentId){
    var payment=getPayment(paymentId);if(!payment){toastSafe('الدفعة غير موجودة');return}
    closeIf('dr-client-detail');window.openPaymentForm(payment.clientId,payment.id);
  };

  window.savePayment=function(){
    ensurePaymentForm();
    var amount=n($('pay-amt')&&$('pay-amt').value),clientId=String($('pay-cid')&&$('pay-cid').value||''),paymentId=String($('pay-edit-id')&&$('pay-edit-id').value||'');
    if(!(amount>0)){toastSafe('أدخل مبلغ دفعة صحيح أكبر من صفر');return}
    if(!getClient(clientId)){toastSafe('العميل غير موجود');return}
    var receipt=window.lastReceiptPreview&&window.lastReceiptPreview.payment?clone(window.lastReceiptPreview.payment):null;
    var values={clientId:clientId,amount:amount,date:($('pay-date')&&$('pay-date').value)||today(),note:(($('pay-note')&&$('pay-note').value)||'').trim(),receipt:receipt,updatedAt:now()};
    if(paymentId){
      var payment=getPayment(paymentId);if(!payment){toastSafe('الدفعة غير موجودة');return}
      Object.assign(payment,values);toastSafe('تم تعديل الدفعة وإعادة حساب الرصيد');
    }else{
      ensureArr('payments').push(Object.assign({id:(typeof uid==='function'?uid():('pay_'+Date.now())),createdAt:now()},values));toastSafe('تم تسجيل الدفعة');
    }
    try{if(window.HP_V39_GUARD&&typeof HP_V39_GUARD.saveSafeSnapshot==='function')HP_V39_GUARD.saveSafeSnapshot(paymentId?'before-payment-edit':'before-payment-add')}catch(e){}
    try{if(typeof save==='function')save()}catch(e){try{localStorage.setItem('hayder_bags_app',JSON.stringify(DB))}catch(_){}}
    closeIf('dr-payment');if($('pay-edit-id'))$('pay-edit-id').value='';
    try{if(typeof refreshAll==='function')refreshAll();else window.renderClients()}catch(e){}
    setTimeout(function(){window.openClientDetail(clientId)},120);
  };

  window.deletePayment=function(paymentId){
    var payment=getPayment(paymentId);if(!payment){toastSafe('الدفعة غير موجودة');return}
    var client=getClient(payment.clientId),label=money(payment.amount)+' بتاريخ '+(payment.date||'بدون تاريخ');
    if(!confirm('تأكيد حذف الدفعة '+label+'؟\n\nسيتم تعديل رصيد العميل والسيولة وكشف الحساب، مع حفظ نسخة في سجل الحذف.'))return;
    try{if(window.HP_V39_GUARD&&typeof HP_V39_GUARD.saveSafeSnapshot==='function')HP_V39_GUARD.saveSafeSnapshot('before-payment-delete')}catch(e){}
    logDelete({type:'payment',label:'دفعة '+label+(client?' — '+(client.name||''):''),payment:clone(payment),client:client?{id:client.id,name:client.name||''}:null});
    DB.payments=arr('payments').filter(function(p){return String(p&&p.id)!==String(paymentId)});
    try{if(typeof save==='function')save()}catch(e){try{localStorage.setItem('hayder_bags_app',JSON.stringify(DB))}catch(_){}}
    try{if(typeof refreshAll==='function')refreshAll();else window.renderClients()}catch(e){}
    toastSafe('تم حذف الدفعة وإعادة حساب الرصيد والسيولة');
    setTimeout(function(){if(getClient(payment.clientId))window.openClientDetail(payment.clientId)},120);
  };

  window.openClientDetail=function(cid){
    var c=getClient(cid);if(!c){toastSafe('العميل غير موجود');return}
    var orders=clientOrders(cid).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))});
    var payments=clientPayments(cid).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))});
    var total=clientTotalSafe(cid)+n(c.debt), paid=clientPaidSafe(cid), bal=clientBalanceSafe(cid), profitSum=orders.reduce(function(s,o){return s+orderProfit(o)},0);
    var orderHtml=orders.length?orders.map(function(o){var p=orderProfit(o), exp=orderExpenseTotal(o.id);return '<div class="row"><label class="doc-select-row" onclick="event.stopPropagation()"><input type="checkbox" class="client-order-check" value="'+esc(o.id)+'"><span><span class="row-name">'+esc(o.code||'')+' '+(typeof statusBadge==='function'?statusBadge(o.status):esc(o.status||''))+'</span><span class="row-sub">'+esc(o.date||'')+' · نهائي '+count(orderBillQty(o))+' · مصنع '+money(orderFactoryTotal(o))+(exp>0?' · مصاريف '+money(exp):'')+'</span></span></label><div style="text-align:left"><div class="row-val">'+money(orderClientNet(o))+'</div><div class="tiny '+(p>=0?'success':'danger')+'">صافي الربح: '+money(p)+'</div><button class="btn small" onclick="closeDrawer(\'dr-client-detail\');openOrderDetail(\''+attr(o.id)+'\')">فتح</button></div></div>'}).join(''):'<p class="muted tiny">لا توجد أوردرات</p>';
    var payHtml=payments.length?payments.map(function(p){return '<div class="row"><div><div class="row-name">'+money(p.amount)+'</div><div class="row-sub">'+esc(p.date||'')+(p.note?' · '+esc(p.note):'')+'</div>'+(typeof receiptLink==='function'?receiptLink(p.receipt):'')+'</div><div style="text-align:left"><span class="badge bg-green">مدفوع</span><div class="btn-row" style="margin-top:7px;gap:6px"><button class="btn small amber" onclick="event.stopPropagation();editPayment(\''+attr(p.id)+'\')"><i class="ti ti-edit"></i> تعديل</button><button class="btn small red-out" onclick="event.stopPropagation();deletePayment(\''+attr(p.id)+'\')"><i class="ti ti-trash"></i> حذف</button></div></div></div>'}).join(''):'<p class="muted tiny">لا توجد دفعات</p>';
    var body=$('client-detail-body');if(!body)return;
    body.innerHTML='<div class="drawer-handle"></div><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div class="avatar av-blue" style="width:56px;height:56px;font-size:25px">'+esc((c.name||'?').charAt(0))+'</div><div><div class="drawer-title" style="margin:0">'+esc(clientNo(cid))+'- '+esc(c.name||'')+'</div><div class="row-sub">'+esc(c.phone||'')+(c.addr?' · '+esc(c.addr):'')+'</div></div></div><div class="stat-grid"><div class="stat-box blue"><div class="sl">إجمالي الطلبات</div><div class="sv">'+money(total)+'</div></div><div class="stat-box green"><div class="sl">المدفوع شامل العربون</div><div class="sv">'+money(paid)+'</div></div><div class="stat-box '+(bal>0?'red':'green')+'"><div class="sl">الرصيد</div><div class="sv">'+(bal>0?money(bal)+' باقي':bal<0?money(-bal)+' رصيد':'الحساب منتهي')+'</div></div><div class="stat-box amber"><div class="sl">مجموع صافي ربحك</div><div class="sv">'+money(profitSum)+'</div></div></div><div id="hp-v43-client-actions" class="btn-row" style="margin:10px 0 14px"><button class="btn amber" onclick="closeDrawer(\'dr-client-detail\');openClientForm(\''+attr(cid)+'\')"><i class="ti ti-edit"></i> تعديل بيانات العميل والمديونية</button><button class="btn red-out" onclick="deleteClient(\''+attr(cid)+'\')"><i class="ti ti-trash"></i> حذف العميل</button></div><button class="btn green full" style="margin-bottom:12px" onclick="closeDrawer(\'dr-client-detail\');openPaymentForm(\''+attr(cid)+'\')"><i class="ti ti-plus"></i> تسجيل دفعة</button><div class="sec-label">اختيار أوردرات لعرض السعر أو الفاتورة</div><div class="doc-action-bar"><button class="btn" onclick="toggleClientOrdersSelection(\''+attr(cid)+'\')"><i class="ti ti-checks"></i> تحديد/إلغاء الكل</button><button class="btn blue" onclick="printSelectedClientQuote(\''+attr(cid)+'\')"><i class="ti ti-file-dollar"></i> عرض سعر للمحدد</button><button class="btn green" onclick="printSelectedClientInvoice(\''+attr(cid)+'\')"><i class="ti ti-file-invoice"></i> فاتورة للمحدد</button><button class="btn amber" onclick="printSelectedClientStatement(\''+attr(cid)+'\')"><i class="ti ti-file-description"></i> كشف حساب عميل</button><button class="btn blue" onclick="printSelectedClientStatement(\''+attr(cid)+'\',true)">عرض كشف الحساب الكامل</button><button class="btn" onclick="exportClientReportExcel(\''+attr(cid)+'\')"><i class="ti ti-file-spreadsheet"></i> تقرير Excel</button></div><div class="card">'+orderHtml+'</div><div class="sec-label">الدفعات ('+payments.length+')</div><div class="card">'+payHtml+'</div><button class="btn full" style="margin-top:10px" onclick="closeDrawer(\'dr-client-detail\')">إغلاق</button>';
    openIf('dr-client-detail');
  };

  function boot(){ensureClientForm();ensurePaymentForm();patchAddButton();ensureClientFilters();try{if((window.activePage||'')==='clients')window.renderClients()}catch(e){}}
  window.HP_CLIENTS={version:VERSION,render:window.renderClients,openDetail:window.openClientDetail,openForm:window.openClientForm,save:window.saveClient,deleteClient:window.deleteClient};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setTimeout(boot,600);
})();


/* ===== END SOURCE: 19-v43-clients-cleanup.js ===== */


/* ===== V50 Sync Confirmation & Save Protection =====
   Loaded last on purpose. It wraps final write functions only, without changing calculations or data model. */
(function(){
  'use strict';
  var VERSION='2026.08.07-production-fix.5';
  var SITE_VERSION='production_20260807_fix7';
  var LOCAL_KEY='hayder_bags_app';
  var PENDING_KEY='hayder_pack_sync_pending_v37';
  var META_KEY='hayder_pack_sync_meta_v37';
  var GUARD_LOG_KEY='hayder_pack_save_confirm_log_v49_1';
  var inFlight=false, lastReason='', refreshTimer=null;

  // The confirmed mutation engine already owns retries and pending state.
  // Keep a compatibility facade for diagnostics, but never wrap writes or
  // start a second retry loop when that engine is active.
  if(window.HP_MUTATION_SYNC){
    window.HP_V501_SAVE_GUARD={
      version:VERSION,siteVersion:SITE_VERSION,passive:true,
      confirm:function(show){return typeof window.manualSync==='function'?window.manualSync(show!==false):Promise.resolve(false)},
      update:function(){},
      pending:function(){try{return JSON.parse(localStorage.getItem(PENDING_KEY)||'null')}catch(e){return null}},
      log:function(){return []}
    };
    return;
  }

  function $(id){return document.getElementById(id)}
  function now(){return new Date().toISOString()}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.log(msg)}catch(e){}}
  function fmtTime(v){if(!v)return 'لا توجد بعد';try{return new Date(v).toLocaleString('ar-EG')}catch(e){return String(v)}}
  function readJSON(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
  function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function readPending(){return readJSON(PENDING_KEY,null)}
  function readMeta(){return readJSON(META_KEY,{})||{}}
  function currentDB(){try{return window.DB||JSON.parse(localStorage.getItem(LOCAL_KEY)||'{}')}catch(e){return window.DB||{}}}
  function hashDB(){try{return window.HP_V37_SYNC&&window.HP_V37_SYNC.dataHash?window.HP_V37_SYNC.dataHash(currentDB()):JSON.stringify(currentDB()).length+''}catch(e){return ''}}
  function setSyncLine(state,msg){try{if(typeof setSyncState==='function')setSyncState(state,msg)}catch(e){}var s=$('sync-status'); if(s)s.textContent=msg||'';}
  function addLog(type,msg,extra){
    var arr=readJSON(GUARD_LOG_KEY,[])||[];
    arr.unshift({at:now(),type:type||'info',message:String(msg||''),extra:extra||'',pending:!!readPending()});
    arr=arr.slice(0,80);writeJSON(GUARD_LOG_KEY,arr);
    try{ if(window.HP_V50_STABILITY&&window.HP_V50_STABILITY.log) window.HP_V50_STABILITY.log('saveGuard.'+type,{message:msg,extra:extra},'V50'); }catch(e){}
  }
  function counts(db){db=db||{};return {clients:(db.clients||[]).length,orders:(db.orders||[]).length,payments:(db.payments||[]).length,factories:(db.factories||[]).length,expenses:(db.expenses||[]).length,transfers:(db.transfers||[]).length}}
  function renderCounts(c){return 'عملاء '+(c.clients||0)+' | أوردرات '+(c.orders||0)+' | دفعات '+(c.payments||0)+' | مصانع '+(c.factories||0)}
  function pendingText(){var p=readPending();return p?'يوجد تعديل في انتظار تأكيد Google':'لا توجد حركات معلقة'}
  function statusClass(){if(inFlight)return 'work';return readPending()?'wait':'ok'}

  function requestConfirm(reason,showToast){
    reason=reason||'important-change';lastReason=reason;
    try{if(!readPending() && window.HP_V37_SYNC && typeof window.HP_V37_SYNC.markPending==='function'){window.HP_V37_SYNC.markPending('v49.1-'+reason)}}catch(e){addLog('markPending.error',e.message||e,reason)}
    var p=readPending();
    if(!p){updatePanel();return Promise.resolve(true)}
    if(!navigator.onLine){setSyncLine('err','تم الحفظ على الجهاز — سيتم تأكيد Google عند رجوع الإنترنت');updatePanel();return Promise.resolve(false)}
    inFlight=true;updatePanel();setSyncLine('work','جاري تأكيد حفظ آخر تعديل على Google...');if(showToast)toastSafe('جاري تأكيد الحفظ على Google...');
    var push=(window.HP_V37_SYNC&&window.HP_V37_SYNC.push)||window.manualSync||window.manualSyncNow;
    if(typeof push!=='function'){inFlight=false;addLog('missingSync','لم يتم العثور على دالة المزامنة',reason);updatePanel();return Promise.resolve(false)}
    return Promise.resolve().then(function(){return push(false)}).then(function(ok){
      inFlight=false;
      if(!readPending()){
        setSyncLine('ok','تم تأكيد الحفظ على Google');addLog('confirmed','تم تأكيد الحفظ على Google',reason);if(showToast)toastSafe('تم تأكيد الحفظ على Google');updatePanel();return true;
      }
      addLog('pending','الحفظ محلي ولسه في انتظار Google',reason);setSyncLine('work','التعديل محفوظ محليًا — جاري انتظار تأكيد Google');setTimeout(function(){requestConfirm(reason,false)},3500);updatePanel();return !!ok;
    }).catch(function(e){
      inFlight=false;addLog('push.error',e.message||e,reason);setSyncLine('err',(e&&e.message?e.message:'تعذر تأكيد الحفظ')+' — سيعاد تلقائيًا');setTimeout(function(){requestConfirm(reason,false)},7000);updatePanel();return false;
    });
  }

  function afterWrite(reason,beforeHash){setTimeout(function(){var changed=false;try{changed=beforeHash&&hashDB()!==beforeHash}catch(e){}if(changed||readPending())requestConfirm(reason,true);else updatePanel()},180)}
  function wrapWrite(name,reason){
    var fn=window[name]; if(typeof fn!=='function'||fn.__hpV501Wrapped)return;
    var wrapped=function(){
      var before=hashDB();var ret;
      try{ret=fn.apply(this,arguments)}catch(e){addLog('function.error',e.message||e,name);throw e}
      if(ret&&typeof ret.then==='function')ret.finally(function(){afterWrite(reason||name,before)});else afterWrite(reason||name,before);
      return ret;
    };
    wrapped.__hpV501Wrapped=true;wrapped.__hpOriginal=fn;window[name]=wrapped;
  }
  function wrapAll(){[
    ['saveOrder','order-save'],['changeOrderStatus','order-status'],['saveFactoryPrices','factory-prices'],
    ['saveClient','client-save'],['deleteClient','client-delete'],['saveFactory','factory-save'],['deleteFactory','factory-delete'],
    ['saveTransfer','factory-transfer'],['saveExpense','expense-save'],['savePayment','payment-save'],
    ['deleteOrder','order-delete'],['archiveOrder','order-archive'],['restoreOrder','order-restore'],
    ['saveCapitalSettings','capital-settings'],['saveCapitalMovement','capital-move'],['deleteCapitalMove','capital-delete']
  ].forEach(function(x){wrapWrite(x[0],x[1])})}

  function ensureStyle(){if($('hp-v491-style'))return;var st=document.createElement('style');st.id='hp-v491-style';st.textContent='#hp-v491-save-guard{border:4px solid #000;border-radius:18px;background:#fff;padding:14px;margin:12px 0;box-shadow:0 3px 0 #000}.hp-v491-head{font-weight:900;font-size:18px;margin-bottom:8px}.hp-v491-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.hp-v491-box{border:3px solid #000;border-radius:14px;background:#f8fbff;padding:10px;font-weight:900}.hp-v491-box b{display:block;font-size:13px;margin-bottom:5px}.hp-v491-ok{background:#e7ffe9}.hp-v491-wait{background:#fff4cd}.hp-v491-work{background:#e8f2ff}.hp-v491-danger{background:#ffe5e5}.hp-v491-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.hp-v491-actions .btn{flex:1;min-width:170px}@media(max-width:520px){.hp-v491-grid{grid-template-columns:1fr}.hp-v491-actions .btn{min-width:100%}}';document.head.appendChild(st)}
  function panelHTML(){
    var p=readPending(), m=readMeta(), c=counts(currentDB()), cls=statusClass();
    var boxCls=cls==='ok'?'hp-v491-ok':cls==='work'?'hp-v491-work':'hp-v491-wait';
    return '<div id="hp-v491-save-guard"><div class="hp-v491-head">حماية الحفظ</div><div class="hp-v491-grid">'
      +'<div class="hp-v491-box '+boxCls+'"><b>حالة آخر تعديل</b><span id="hp-v491-status">'+esc(pendingText())+'</span></div>'
      +'<div class="hp-v491-box"><b>آخر حفظ محلي</b><span id="hp-v491-local">'+esc(fmtTime((p&&p.localUpdatedAt)||m.lastLocalSaveAt))+'</span></div>'
      +'<div class="hp-v491-box"><b>آخر تأكيد Google</b><span id="hp-v491-cloud">'+esc(fmtTime(m.lastCloudSaveAt||m.updatedAt))+'</span></div>'
      +'<div class="hp-v491-box"><b>ملخص الداتا الحالية</b><span id="hp-v491-counts">'+esc(renderCounts(c))+'</span></div>'
      +'</div><div class="hp-v491-actions"><button class="btn green" onclick="hpConfirmSaveNow(true)"><i class="ti ti-cloud-check"></i> تأكيد الحفظ الآن</button><button class="btn blue" onclick="hpV501DownloadSaveLog()"><i class="ti ti-file-download"></i> تنزيل سجل الحفظ</button></div>'
      +'<div class="muted tiny" style="margin-top:8px">أي تعديل مهم يعمل حفظ محلي ثم محاولة تأكيد فورية على Google. لا تمسح بيانات المتصفح إلا بعد اختفاء الحركات المعلقة.</div></div>';
  }
  function ensurePanel(){ensureStyle();var drawer=document.querySelector('#dr-sync .drawer');if(!drawer)return null;var host=$('hp-v41-sync-ui')||$('hp-v49-stability-card')||drawer;if(!$('hp-v491-save-guard')){if(host&&host.insertAdjacentHTML)host.insertAdjacentHTML(host.id==='hp-v41-sync-ui'?'afterend':'afterbegin',panelHTML());else drawer.insertAdjacentHTML('afterbegin',panelHTML())}return $('hp-v491-save-guard')}
  function updatePanel(){clearTimeout(refreshTimer);refreshTimer=setTimeout(function(){var p=readPending(),m=readMeta(),c=counts(currentDB());if(!ensurePanel())return;var status=$('hp-v491-status'),local=$('hp-v491-local'),cloud=$('hp-v491-cloud'),cc=$('hp-v491-counts');if(status)status.textContent=pendingText();if(local)local.textContent=fmtTime((p&&p.localUpdatedAt)||m.lastLocalSaveAt);if(cloud)cloud.textContent=fmtTime(m.lastCloudSaveAt||m.updatedAt);if(cc)cc.textContent=renderCounts(c);var first=document.querySelector('#hp-v491-save-guard .hp-v491-box');if(first){first.classList.remove('hp-v491-ok','hp-v491-wait','hp-v491-work','hp-v491-danger');first.classList.add(statusClass()==='ok'?'hp-v491-ok':statusClass()==='work'?'hp-v491-work':'hp-v491-wait')}},80)}

  window.hpConfirmSaveNow=function(show){return requestConfirm('manual-confirm',show!==false)};
  window.hpV501DownloadSaveLog=function(){var blob=new Blob([JSON.stringify(readJSON(GUARD_LOG_KEY,[]),null,2)],{type:'application/json;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='haydar_pack_save_guard_v49_1_'+Date.now()+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)};
  window.HP_V501_SAVE_GUARD={version:VERSION,siteVersion:SITE_VERSION,confirm:requestConfirm,update:updatePanel,pending:readPending,log:function(){return readJSON(GUARD_LOG_KEY,[])}};

  var oldOpenSync=window.openSync;if(typeof oldOpenSync==='function'&&!oldOpenSync.__hpV501OpenWrapped){var openWrapped=function(){var r=oldOpenSync.apply(this,arguments);setTimeout(function(){ensurePanel();updatePanel()},350);setTimeout(updatePanel,1400);return r};openWrapped.__hpV501OpenWrapped=true;window.openSync=openWrapped}
  window.addEventListener('beforeunload',function(e){try{if(readPending()||inFlight){e.preventDefault();e.returnValue='يوجد تعديل لم يتم تأكيد حفظه على Google بعد. انتظر حتى تختفي الحركات المعلقة.';return e.returnValue}}catch(_){}});
  window.addEventListener('online',function(){requestConfirm('online-return',false)});
  window.addEventListener('focus',function(){if(readPending())requestConfirm('focus-check',false);updatePanel()});
  document.addEventListener('visibilitychange',function(){if(!document.hidden){if(readPending())requestConfirm('visible-check',false);updatePanel()}});
  document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){wrapAll();ensurePanel();updatePanel();if(readPending())requestConfirm('boot-pending',false)},700)});
  setTimeout(function(){wrapAll();ensurePanel();updatePanel();if(readPending())requestConfirm('late-boot-pending',false)},1800);
})();

/* ===== END V50 Sync Confirmation & Save Protection ===== */

/* ===== V50 Backup Center Pro + Mobile Back Guard ===== */
(function(){
  'use strict';
  var VERSION='2026.08.07-production-fix.5';
  var SITE_VERSION='production_20260807_fix7';
  var booted=false;
  function $(id){return document.getElementById(id)}
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function now(){return new Date().toISOString()}
  function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.log(msg)}catch(e){}}
  function readDB(){try{return window.DB||JSON.parse(localStorage.getItem('hayder_bags_app')||'{}')||{}}catch(e){return window.DB||{}}}
  function countData(d){d=d||{};return {clients:(d.clients||[]).length,factories:(d.factories||[]).length,orders:(d.orders||[]).length,payments:(d.payments||[]).length,transfers:(d.transfers||[]).length,expenses:(d.expenses||[]).length,capitalMoves:(d.capitalMoves||[]).length,deleted:((d.deletedItems||[]).length+(d.deletedLog||[]).length+(d.deletedArchive||[]).length)}}
  function fmtCounts(c){c=c||{};return 'عملاء '+(c.clients||0)+' | مصانع '+(c.factories||0)+' | أوردرات '+(c.orders||0)+' | دفعات '+(c.payments||0)+' | حذف '+(c.deleted||0)}
  function fmtTime(v){if(!v)return '—';try{return new Date(v).toLocaleString('ar-EG')}catch(e){return String(v)}}
  function sizeText(n){n=Number(n)||0;if(!n)return '—';if(n>1024*1024)return (n/1024/1024).toFixed(2)+' MB';if(n>1024)return Math.round(n/1024)+' KB';return n+' B'}
  function currentCounts(){return countData(readDB())}
  function currentMeta(){try{return JSON.parse(localStorage.getItem('hayder_pack_sync_meta_v37')||'{}')||{}}catch(e){return {}}}
  function downloadText(name,text,type){try{var blob=new Blob([text],{type:type||'text/plain;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){try{URL.revokeObjectURL(a.href);a.remove()}catch(e){}},1200);return true}catch(e){toastSafe('تعذر تنزيل الملف');return false}}
  function fileStamp(){var d=new Date();function p(n){return String(n).padStart(2,'0')}return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())}
  function injectStyle(){
    if($('hp-v50-style'))return;
    var st=document.createElement('style');st.id='hp-v50-style';
    st.textContent='\n.hp-v50-pro{border:4px solid #000;border-radius:18px;background:#f7fbff;padding:14px;margin:12px 0;box-shadow:0 3px 0 #000;font-weight:900}.hp-v50-head{font-size:20px;font-weight:900;margin-bottom:8px}.hp-v50-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}.hp-v50-box{border:3px solid #000;border-radius:14px;background:#fff;padding:10px}.hp-v50-box b{display:block;font-size:13px;margin-bottom:5px;color:#123}.hp-v50-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.hp-v50-actions .btn{flex:1;min-width:170px}.hp-v50-table{width:100%;border-collapse:separate;border-spacing:0 8px;margin-top:10px}.hp-v50-table td,.hp-v50-table th{border:2px solid #000;background:#fff;padding:8px;font-weight:900;vertical-align:top}.hp-v50-table th{background:#e8f2ff}.hp-v50-note{border:3px dashed #8a4b00;background:#fff6df;border-radius:14px;padding:10px;margin-top:10px;line-height:1.7}.hp-v50-ok{background:#e7ffe9}.hp-v50-warn{background:#fff4cd}.hp-v50-bad{background:#ffe5e5}@media(max-width:650px){.hp-v50-grid{grid-template-columns:1fr}.hp-v50-actions .btn{min-width:100%}.hp-v50-table,.hp-v50-table tbody,.hp-v50-table tr,.hp-v50-table td{display:block;width:100%}.hp-v50-table thead{display:none}.hp-v50-table tr{border:3px solid #000;border-radius:14px;margin:10px 0;padding:8px;background:#fff}.hp-v50-table td{border:0;border-bottom:1px dashed #999}.hp-v50-table td:last-child{border-bottom:0}}\n';
    document.head.appendChild(st);
  }
  function getStatusPromise(showBusy){
    try{if(window.HP_V41_BACKUP_CENTER&&typeof window.HP_V41_BACKUP_CENTER.loadStatus==='function')return window.HP_V41_BACKUP_CENTER.loadStatus(!!showBusy)}catch(e){}
    return Promise.resolve(null);
  }
  function buildProHtml(status){
    status=status||{};
    var cur=status.current||{}, prev=status.previous||{}, latest=status.latestUsefulBackup||{}, backups=status.backups||[], cc=currentCounts(), meta=currentMeta();
    var risk=((cc.clients+cc.orders+cc.payments)===0)?'تحذير: الداتا المحلية قليلة جدًا — راجع قبل الحفظ أو الاسترجاع':'الداتا المحلية بها محتوى';
    var html='<div id="hp-v50-pro-card" class="hp-v50-pro">'
      +'<div class="hp-v50-head">🛡️ مركز النسخ الاحتياطي</div>'
      +'<div class="hp-v50-grid">'
      +'<div class="hp-v50-box hp-v50-ok"><b>الداتا الحالية على الجهاز</b>'+esc(fmtCounts(cc))+'</div>'
      +'<div class="hp-v50-box"><b>آخر تأكيد Google</b>'+esc(fmtTime(meta.lastCloudSaveAt||meta.updatedAt||cur.updatedAt))+'<br>Rev '+esc(meta.revision||cur.revision||'—')+'</div>'
      +'<div class="hp-v50-box"><b>قاعدة Google الحالية</b>'+esc(cur.counts?fmtCounts(cur.counts):'—')+'<br>'+esc(cur.name||'')+'</div>'
      +'<div class="hp-v50-box"><b>آخر Backup صالح</b>'+(latest&&latest.name?esc(fmtCounts(latest.counts))+'<br>'+esc(latest.name)+'<br>'+esc(fmtTime(latest.createdAt||latest.updatedAt)):'لا يوجد')+'</div>'
      +'</div>'
      +'<div class="hp-v50-note">'+esc(risk)+'<br>قبل أي استرجاع، البرنامج ينشئ Backup تلقائي من الوضع الحالي.</div>'
      +'<div class="hp-v50-actions">'
      +'<button class="btn green" onclick="hpV50CreateBackupPro()"><i class="ti ti-cloud-download"></i> Backup Pro الآن</button>'
      +'<button class="btn" onclick="hpV50DownloadLocalJson()"><i class="ti ti-download"></i> تنزيل JSON محلي</button>'
      +'<button class="btn blue" onclick="hpV50RefreshBackups()"><i class="ti ti-refresh"></i> تحديث القائمة</button>'
      +'<button class="btn amber" onclick="hpV50DownloadBackupReport()"><i class="ti ti-file-text"></i> تقرير النسخ</button>'
      +'</div>';
    if(status.rootFolderUrl||status.backupFolderUrl){
      html+='<div class="hp-v50-actions">'
        +(status.backupFolderUrl?'<button class="btn" onclick="window.open(\''+esc(status.backupFolderUrl)+'\',\'_blank\')">فتح فولدر Backups</button>':'')
        +(status.databaseUrl?'<button class="btn" onclick="window.open(\''+esc(status.databaseUrl)+'\',\'_blank\')">فتح ملف الداتا</button>':'')
        +'</div>';
    }
    html+='<div style="overflow:auto"><table class="hp-v50-table"><thead><tr><th>#</th><th>التاريخ</th><th>المحتوى</th><th>الحجم</th><th>الاسترجاع</th></tr></thead><tbody>';
    if(!backups.length) html+='<tr><td colspan="5">لا توجد نسخ معروضة.</td></tr>';
    backups.slice(0,20).forEach(function(b,i){
      var name=String(b.name||''), err=b.error;
      html+='<tr><td>'+(i+1)+'</td><td>'+esc(fmtTime(b.createdAt||b.updatedAt))+'<br><small>'+esc(name)+'</small></td>'
        +'<td>'+(err?'<span style="color:#900">غير صالح: '+esc(err)+'</span>':esc(fmtCounts(b.counts))+'<br>Rev '+esc(b.revision||0)+' | useful '+esc(b.usefulCount||0))+'</td>'
        +'<td>'+esc(sizeText(b.sizeBytes))+'</td>'
        +'<td><button class="btn amber" '+(err?'disabled':'')+' onclick="hpV50RestoreBackupPro('+JSON.stringify(name).replace(/</g,'\\u003c')+')">استرجاع آمن</button></td></tr>';
    });
    html+='</tbody></table></div>';
    html+='</div>';
    return html;
  }
  function enhanceBackupCenter(status){
    injectStyle();
    var center=$('hp-v41-backup-center'); if(!center)return;
    var old=$('hp-v50-pro-card'); if(old)old.remove();
    center.insertAdjacentHTML('afterbegin',buildProHtml(status||{}));
  }
  async function refreshPro(showBusy){
    injectStyle();
    try{var status=await getStatusPromise(showBusy);enhanceBackupCenter(status);return status}catch(e){var center=$('hp-v41-backup-center');if(center&&!$('hp-v50-pro-card'))center.insertAdjacentHTML('afterbegin','<div class="hp-v50-pro hp-v50-bad">تعذر تحميل Backup Center Pro: '+esc(e.message||e)+'</div>');throw e}
  }
  window.hpV50DownloadLocalJson=function(){
    var db=readDB(), env={format:'HayderPackBackup',formatVersion:2,appVersion:VERSION,siteVersion:SITE_VERSION,exportedAt:now(),counts:countData(db),data:db};
    downloadText('HaydarPack_Local_Backup_'+fileStamp()+'.json',JSON.stringify(env,null,2),'application/json;charset=utf-8');
  };
  window.hpV50DownloadBackupReport=function(){
    getStatusPromise(false).then(function(status){
      status=status||{};var lines=['Haydar Pack Backup Center Pro V50','Generated: '+now(),'','CURRENT LOCAL: '+fmtCounts(currentCounts())];
      if(status.current)lines.push('GOOGLE CURRENT: '+fmtCounts(status.current.counts)+' | Rev '+(status.current.revision||0));
      lines.push('', 'BACKUPS:');
      (status.backups||[]).forEach(function(b,i){lines.push((i+1)+') '+(b.name||'')+' | '+fmtTime(b.createdAt||b.updatedAt)+' | '+(b.error?('ERROR '+b.error):(fmtCounts(b.counts)+' | Rev '+(b.revision||0)+' | '+sizeText(b.sizeBytes))))});
      downloadText('HaydarPack_Backup_Report_'+fileStamp()+'.txt',lines.join('\n'),'text/plain;charset=utf-8');
    }).catch(function(e){toastSafe(e.message||'تعذر تنزيل التقرير')});
  };
  window.hpV50RefreshBackups=function(){refreshPro(true).then(function(){toastSafe('تم تحديث مركز النسخ')}).catch(function(e){toastSafe(e.message||'تعذر التحديث')})};
  window.hpV50CreateBackupPro=async function(){
    if(typeof window.hpV41CreateBackup==='function')await window.hpV41CreateBackup();
    setTimeout(function(){refreshPro(false).catch(function(){})},700);
  };
  window.hpV50RestoreBackupPro=async function(name){
    if(!name)return;
    var status=await getStatusPromise(false).catch(function(){return null});
    var b=status&&status.backups?(status.backups||[]).find(function(x){return String(x.name||'')===String(name)}):null;
    var cur=status&&status.current?status.current:null;
    var msg='استرجاع Backup سيستبدل الداتا الحالية على Google وعلى الجهاز.\n\nالنسخة المختارة:\n'+name+'\n'+(b&&b.counts?fmtCounts(b.counts):'')+'\n\nالحالي على Google:\n'+(cur&&cur.counts?fmtCounts(cur.counts):'غير معروف')+'\n\nهيتم إنشاء Backup للوضع الحالي قبل الاسترجاع. هل تكمل؟';
    if(!confirm(msg))return;
    var txt=prompt('للتأكيد اكتب كلمة: استرجاع');
    if(String(txt||'').trim()!=='استرجاع'){toastSafe('تم إلغاء الاسترجاع');return;}
    if(typeof window.hpV41RestoreBackup==='function')await window.hpV41RestoreBackup(name);
    setTimeout(function(){refreshPro(false).catch(function(){})},1200);
  };
  function wrapBackupCenter(){
    var oldToggle=window.hpV41ToggleBackupCenter;
    if(typeof oldToggle==='function'&&!oldToggle.__hpv50){
      window.hpV41ToggleBackupCenter=function(){var r=oldToggle.apply(this,arguments);setTimeout(function(){refreshPro(false).catch(function(){})},400);setTimeout(function(){refreshPro(false).catch(function(){})},1600);return r};
      window.hpV41ToggleBackupCenter.__hpv50=true;
    }
    if(window.HP_V41_BACKUP_CENTER&&typeof window.HP_V41_BACKUP_CENTER.loadStatus==='function'&&!window.HP_V41_BACKUP_CENTER.__hpv50){
      var oldLoad=window.HP_V41_BACKUP_CENTER.loadStatus;
      window.HP_V41_BACKUP_CENTER.loadStatus=function(){return oldLoad.apply(this,arguments).then(function(res){setTimeout(function(){enhanceBackupCenter(res)},50);return res})};
      window.HP_V41_BACKUP_CENTER.__hpv50=true;
    }
  }
  function isPageName(name){return !!$('pg-'+name)}
  function navButtons(name){return qa('.nb').filter(function(b){return (b.getAttribute('onclick')||'').indexOf("showPage('"+name+"'")>=0 || (b.textContent||'').trim()===name})}
  function activatePage(name){
    if(!isPageName(name))name='home';
    window.activePage=name;
    qa('.page').forEach(function(p){p.classList.remove('active')});
    var pg=$('pg-'+name);if(pg)pg.classList.add('active');
    qa('.nb').forEach(function(b){b.classList.remove('active')});
    navButtons(name).forEach(function(b){b.classList.add('active')});
    try{if(name==='home'&&typeof renderHome==='function')renderHome(); if(name==='orders'&&typeof renderOrders==='function')renderOrders(); if(name==='clients'&&typeof renderClients==='function')renderClients(); if(name==='factories'&&typeof renderFactories==='function')renderFactories(); if(name==='reports'&&typeof renderReports==='function')renderReports();}catch(e){console.warn('V50 nav render',e)}
  }
  function closeTopDrawer(){
    var drawers=qa('.drawer-root.open,.drawer.open,.modal.open');
    if(!drawers.length)drawers=qa('.drawer-root,.drawer,.modal').filter(function(d){return d.classList.contains('open')||getComputedStyle(d).display!=='none'&&d.offsetParent!==null&&/(dr-|drawer|modal)/.test(d.id||d.className||'')});
    var d=drawers[drawers.length-1]; if(!d)return false;
    try{d.classList.remove('open'); if(d.id&&typeof closeDrawer==='function')closeDrawer(d.id)}catch(e){}
    return true;
  }
  function setupBackGuard(){
    if(window.__HP_V50_BACK_GUARD)return; window.__HP_V50_BACK_GUARD=true;
    var suppress=false, oldShow=window.showPage;
    if(typeof oldShow==='function'){
      window.showPage=function(name,btn){
        if(suppress)return oldShow.apply(this,arguments);
        var r=oldShow.apply(this,arguments);
        try{if(isPageName(name))history.pushState({hpV50:true,page:name},'',location.pathname+location.search+'#'+name)}catch(e){}
        return r;
      };
    }
    try{history.replaceState({hpV50:true,page:window.activePage||'home'},'',location.pathname+location.search+'#'+(window.activePage||'home'))}catch(e){}
    window.addEventListener('popstate',function(ev){
      try{
        if(closeTopDrawer()){history.pushState({hpV50:true,page:window.activePage||'home'},'',location.pathname+location.search+'#'+(window.activePage||'home'));ev.stopImmediatePropagation();ev.preventDefault();return;}
        var target=ev.state&&ev.state.hpV50&&ev.state.page?ev.state.page:null;
        if(target&&isPageName(target)){suppress=true;activatePage(target);suppress=false;ev.stopImmediatePropagation();return;}
        if((window.activePage||'home')!=='home'){suppress=true;activatePage('home');suppress=false;history.pushState({hpV50:true,page:'home'},'',location.pathname+location.search+'#home');ev.stopImmediatePropagation();ev.preventDefault();return;}
        history.pushState({hpV50:true,page:'home'},'',location.pathname+location.search+'#home');ev.stopImmediatePropagation();ev.preventDefault();
      }catch(e){}
    },true);
  }
  function boot(){if(booted)return;booted=true;injectStyle();wrapBackupCenter();setupBackGuard();setTimeout(wrapBackupCenter,1200);setTimeout(function(){if($('hp-v41-backup-center')&&$('hp-v41-backup-center').style.display!=='none')refreshPro(false).catch(function(){})},1800)}
  document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,700)});
  window.addEventListener('load',function(){setTimeout(boot,1200)});
  setTimeout(boot,2200);
  window.HP_V50_BACKUP_PRO={version:VERSION,siteVersion:SITE_VERSION,refresh:refreshPro,downloadLocal:window.hpV50DownloadLocalJson};
})();
/* ===== END V50 Backup Center Pro + Mobile Back Guard ===== */
