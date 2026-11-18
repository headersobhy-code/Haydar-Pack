/* Haydar Pack V55 Lite Consolidation: post-V49 modules merged into this single file. */


/* ===== CONSOLIDATED SOURCE: 08-mobile-ux.js ===== */
/* Haydar Pack V54.2 - Mobile Back Guard Lite Fix
   Removes floating button completely and keeps a stronger history buffer for Android/iOS back. */
(function(){
  'use strict';
  var VERSION='54.2.0-mobile-back-lite-fix';
  var SITE_VERSION='production_20260807_fix7';
  var booted=false, stack=[];
  function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function isMobile(){try{return window.matchMedia('(max-width: 760px)').matches}catch(e){return window.innerWidth<=760}}
  function page(){return window.activePage||'home'}
  function toast(msg){try{if(typeof window.toast==='function')window.toast(msg);else console.log(msg)}catch(e){}}
  function btnFor(name){return document.querySelector(".nb[onclick*=\"'"+String(name).replace(/'/g,'')+"'\"]")||document.querySelector('.nb')}
  function removeFloating(){qa('#hp-mobile-fab,#hp-v51-fab,.hp-mobile-fab,.hp-v51-fab,.hp-fab,.floating-action,.quick-action-fab').forEach(function(x){try{x.remove()}catch(e){try{x.style.display='none'}catch(_){}}});document.body.classList.add('hp-no-mobile-fab')}
  function injectStyle(){if(document.getElementById('hp-v541-mobile-style'))return;var st=document.createElement('style');st.id='hp-v541-mobile-style';st.textContent='@media(max-width:760px){#hp-mobile-fab,#hp-v51-fab,.hp-mobile-fab,.hp-v51-fab,.hp-fab,.floating-action,.quick-action-fab{display:none!important;visibility:hidden!important;pointer-events:none!important}.overlay.open{align-items:stretch!important;justify-content:flex-end!important}.drawer{max-height:96dvh!important;padding-bottom:calc(70px + env(safe-area-inset-bottom,0px))!important}.table-wrap:before{content:"اسحب يمين/شمال لرؤية باقي الجدول";display:block;background:#fff6df;border-bottom:3px solid #000;padding:8px 10px;font-size:15px;font-weight:900;color:#000!important}.hp-v541-closebar{position:sticky;top:0;z-index:50;margin:-8px 0 12px!important;background:#fff!important;border:4px solid #000!important;border-radius:18px!important;padding:8px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important}.hp-v541-closebar .btn{min-height:44px!important;font-size:16px!important}.hp-v541-title{font-weight:900;color:#000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}';document.head.appendChild(st)}
  function currentOverlay(){var list=qa('.hp-v53-modal.active,.modal.active,.modal.open,.overlay.open,.drawer-root.open');return list[list.length-1]||null}
  function closeOverlay(){var x=currentOverlay();if(!x)return false;try{if(x.classList.contains('overlay')&&x.id&&typeof window.closeDrawer==='function')window.closeDrawer(x.id);else{x.classList.remove('active');x.classList.remove('open')}}catch(e){try{x.classList.remove('active');x.classList.remove('open')}catch(_){}}setTimeout(updateDrawers,80);return true}
  function safeShow(name){try{if(typeof window.showPage==='function')window.showPage(name,btnFor(name));else window.activePage=name}catch(e){try{window.activePage=name}catch(_){}}try{window.scrollTo({top:0,behavior:'auto'})}catch(e){}}
  function backInside(){removeFloating();if(closeOverlay())return true;if(!stack.length)stack=['home'];if(stack.length>1){stack.pop();safeShow(stack[stack.length-1]||'home');return true}if(page()!=='home'){stack=['home'];safeShow('home');return true}safeShow('home');toast('أنت في الصفحة الرئيسية');return true}
  function pushTrap(){if(!isMobile())return;try{for(var i=0;i<2;i++){history.pushState({hpBackTrap:true,page:page(),t:Date.now(),i:i},'',location.href)}}catch(e){}}
  function wrapShowPage(){var old=window.showPage;if(typeof old!=='function'||old.__hpV541)return;var wrapped=function(name,btn){var before=page();var r=old.apply(this,arguments);var after=name||page();if(after&&after!==before){if(!stack.length)stack=[before||'home'];stack.push(after);if(stack.length>40)stack=stack.slice(-40);pushTrap()}setTimeout(function(){removeFloating();updateDrawers()},80);return r};wrapped.__hpV541=true;wrapped.__hpOriginal=old;window.showPage=wrapped}
  function updateDrawers(){removeFloating();qa('.overlay.open').forEach(function(ov){var drawer=ov.querySelector('.drawer')||ov;if(!drawer||drawer.querySelector('.hp-v541-closebar'))return;var bar=document.createElement('div');bar.className='hp-v541-closebar';bar.innerHTML='<button class="btn" type="button">← رجوع</button><div class="hp-v541-title">رجوع</div>';bar.querySelector('button').onclick=function(e){e.preventDefault();closeOverlay()};drawer.insertBefore(bar,drawer.firstChild)})}
  function boot(){if(booted)return;booted=true;injectStyle();removeFloating();stack=[page()||'home'];wrapShowPage();try{history.replaceState({hpBackRoot:true,page:page()},'',location.href);pushTrap()}catch(e){}window.addEventListener('popstate',function(ev){try{ev.preventDefault();ev.stopImmediatePropagation()}catch(e){}setTimeout(function(){backInside();pushTrap()},10)},true);setInterval(function(){if(isMobile()){removeFloating();updateDrawers()}},1200);try{console.log('Haydar Pack Mobile Back Guard V54.2 loaded')}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,250)});else setTimeout(boot,250);window.addEventListener('load',function(){setTimeout(boot,300)});
  window.HP_V51_MOBILE_UX=window.HP_V52_MOBILE_UX={version:VERSION,siteVersion:SITE_VERSION,back:backInside,refresh:function(){removeFloating();updateDrawers()},floatingRemoved:true};
})();

/* ===== V57.8 SAFE SUBMISSION GUARD ===== */
(function(){
  'use strict';
  var installed=false, locks={};
  var rules={
    saveOrder:{nonNegative:['o-qty','o-price','o-ak','o-deposit','o-discount']},
    saveTransfer:{positive:['t-amt']},
    saveExpense:{positive:['ex-amt']},
    savePayment:{positive:['pay-amt']},
    saveClient:{},
    saveFactory:{}
  };
  function notify(msg){try{if(typeof window.toast==='function')window.toast(msg)}catch(e){}}
  function value(id){var el=document.getElementById(id);if(!el||String(el.value||'').trim()==='')return null;var v=Number(String(el.value).replace(/,/g,''));return isFinite(v)?v:NaN}
  function validate(rule){
    var ids=(rule&&rule.nonNegative)||[];
    for(var i=0;i<ids.length;i++){var v=value(ids[i]);if(v!=null&&(!isFinite(v)||v<0)){notify('القيم المالية والكميات لا يمكن أن تكون سالبة');return false}}
    ids=(rule&&rule.positive)||[];
    for(var j=0;j<ids.length;j++){var p=value(ids[j]);if(p==null||!isFinite(p)||p<=0){notify('أدخل مبلغًا صحيحًا أكبر من صفر');return false}}
    return true;
  }
  function wrap(name,rule){
    var original=window[name];
    if(typeof original!=='function'||original.__hpSafeSubmit)return;
    var guarded=function(){
      if(!validate(rule))return false;
      if(locks[name]){notify('جاري حفظ العملية، انتظر لحظة');return false}
      locks[name]=true;
      try{return original.apply(this,arguments)}
      finally{setTimeout(function(){locks[name]=false},900)}
    };
    guarded.__hpSafeSubmit=true;
    guarded.__hpOriginal=original;
    window[name]=guarded;
  }
  function install(){
    if(installed)return;
    installed=true;
    Object.keys(rules).forEach(function(name){wrap(name,rules[name])});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('load',install);
  setTimeout(install,1800);
})();


/* ===== CONSOLIDATED SOURCE: 09-reports-pro.js ===== */
/* Haydar Pack V52 Reports Pro - V54.2 event-safe buttons */
(function(){
  'use strict';
  var VERSION='2026.08.07-production-fix.5';
  var SITE_VERSION='production_20260807_fix7';
  var ROOT_ID='hp-v52-reports-pro';

  function byId(id){return document.getElementById(id)}
  function arr(name){return (window.DB && Array.isArray(DB[name])) ? DB[name] : []}
  function n(v){var x=parseFloat(v);return isNaN(x)?0:x}
  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})
  }
  function money(v){
    try{return n(v).toLocaleString('ar-EG',{minimumFractionDigits:0,maximumFractionDigits:2})+' ج'}catch(e){return String(n(v))+' ج'}
  }
  function count(v){
    try{return n(v).toLocaleString('ar-EG',{maximumFractionDigits:0})}catch(e){return String(n(v))}
  }
  function data(v){return esc(String(v==null?'':v))}
  function actionBtn(kind,id,label,cls){return '<button type="button" class="btn small '+esc(cls||'')+'" data-hp-v52-action="'+esc(kind)+'" data-hp-v52-id="'+data(id)+'">'+esc(label||'فتح')+'</button>'}
  function csvBtn(type,label,cls){return '<button type="button" class="btn small '+esc(cls||'')+'" data-hp-v52-csv="'+esc(type)+'">'+esc(label||'CSV')+'</button>'}
  function dateOf(o){return String((o&&o.date)||'')}
  function monthOf(o){var d=dateOf(o); return /^\d{4}-\d{2}/.test(d)?d.slice(0,7):''}
  function monthLabel(m){
    if(!m)return 'بدون تاريخ';
    var p=m.split('-'); return p.length===2 ? p[1]+'/'+p[0] : m;
  }
  function safeDateMatch(date,period,month){
    try{if(typeof window.dateMatches==='function')return window.dateMatches(date,period,month)}catch(e){}
    if(!date)return period==='all' || !period;
    if(period==='month')return String(date).slice(0,7)===(month||'');
    return true;
  }
  function activePeriod(){return window.repPeriod || 'all'}
  function activeMonth(){return window.selRepMonth || latestMonth()}
  function latestMonth(){
    var ms={}; arr('orders').forEach(function(o){var m=monthOf(o); if(m)ms[m]=1});
    var keys=Object.keys(ms).sort(); return keys.length?keys[keys.length-1]:(new Date().toISOString().slice(0,7));
  }
  function filteredOrders(){
    var p=activePeriod(), m=activeMonth();
    return arr('orders').filter(function(o){return safeDateMatch(o.date,p,m)})
  }
  function filteredExpenses(){
    var p=activePeriod(), m=activeMonth();
    return arr('expenses').filter(function(e){return safeDateMatch(e.date,p,m)})
  }
  function filteredPayments(){
    var p=activePeriod(), m=activeMonth();
    return arr('payments').filter(function(e){return safeDateMatch(e.date,p,m)})
  }
  function filteredTransfers(){
    var p=activePeriod(), m=activeMonth();
    return arr('transfers').filter(function(e){return safeDateMatch(e.date,p,m)})
  }
  function calc(){return window.HP_CALC||{}}
  function orderClient(o){
    try{if(calc().clientNetForOrder)return calc().clientNetForOrder(o)}catch(e){}
    try{if(typeof window.clientTotalForOrder==='function')return window.clientTotalForOrder(o)}catch(e){}
    var qty=n(o&&o.fQty)>0?n(o.fQty):n(o&&o.qty); return Math.max(0,qty*n(o&&o.price)+n(o&&o.aklashe)-n(o&&o.discount)-n(o&&o.invoiceDiscount));
  }
  function orderFactory(o){
    try{if(calc().factoryTotalForOrder)return calc().factoryTotalForOrder(o)}catch(e){}
    try{if(typeof window.factoryTotalForOrder==='function')return window.factoryTotalForOrder(o)}catch(e){}
    return n(o&&o.fQty)*n(o&&o.fPrice)+n(o&&o.fAk);
  }
  function orderExp(orderId){
    try{if(calc().orderExpenseTotal)return calc().orderExpenseTotal(orderId)}catch(e){}
    return arr('expenses').filter(function(e){return e.orderId===orderId}).reduce(function(s,e){return s+n(e.amount)},0)
  }
  function orderProfit(o){
    try{if(calc().profitForOrder)return calc().profitForOrder(o)}catch(e){}
    try{if(typeof window.profitForOrder==='function')return window.profitForOrder(o)}catch(e){}
    return orderClient(o)-orderFactory(o)-orderExp(o&&o.id);
  }
  function clientName(id){var c=arr('clients').find(function(x){return x.id===id}); return c?c.name:'؟'}
  function factoryName(id){var f=arr('factories').find(function(x){return x.id===id}); return f?f.name:'؟'}
  function clientBalance(id){
    try{if(calc().clientBalance)return calc().clientBalance(id)}catch(e){}
    try{if(typeof window.clientBalance==='function')return window.clientBalance(id)}catch(e){}
    var c=arr('clients').find(function(x){return x.id===id})||{};
    var total=arr('orders').filter(function(o){return o.clientId===id}).reduce(function(s,o){return s+orderClient(o)},0);
    var deposits=arr('orders').filter(function(o){return o.clientId===id}).reduce(function(s,o){return s+n(o.deposit)},0);
    var payments=arr('payments').filter(function(p){return p.clientId===id}).reduce(function(s,p){return s+n(p.amount)},0);
    return total+n(c.debt)-deposits-payments;
  }
  function factoryBalance(id){
    try{if(calc().factoryBalance)return calc().factoryBalance(id)}catch(e){}
    try{if(typeof window.factoryBalance==='function')return window.factoryBalance(id)}catch(e){}
    var f=arr('factories').find(function(x){return x.id===id})||{};
    var total=arr('orders').filter(function(o){return o.factoryId===id}).reduce(function(s,o){return s+orderFactory(o)},0);
    var paid=arr('transfers').filter(function(t){return t.factoryId===id}).reduce(function(s,t){return s+n(t.amount)},0);
    return total+n(f.debt)-paid;
  }
  function addMap(map,id,patch){
    id=id||'__none__';
    if(!map[id])map[id]={id:id,name:'؟',orders:0,sales:0,cost:0,expenses:0,profit:0,paid:0,balance:0};
    Object.keys(patch||{}).forEach(function(k){map[id][k]=(map[id][k]||0)+n(patch[k])});
    return map[id];
  }
  function topRows(rows,key,limit){
    return rows.slice().sort(function(a,b){return n(b[key])-n(a[key])}).slice(0,limit||10)
  }
  function statusClass(v){return n(v)>=0?'good':'bad'}
  function rowHtml(r,cols,action){
    return '<div class="hp-v52-row">'+cols.map(function(c){
      var val=typeof c.val==='function'?c.val(r):r[c.key];
      var cls=c.cls||''; if(typeof c.cls==='function')cls=c.cls(r)||'';
      return '<div class="'+cls+'"><span class="hp-v52-lbl">'+esc(c.label)+'</span><b>'+esc(val)+'</b></div>';
    }).join('')+(action?'<div class="hp-v52-actions">'+action(r)+'</div>':'')+'</div>';
  }
  function makeSummary(){
    var orders=filteredOrders(), expenses=filteredExpenses(), payments=filteredPayments(), transfers=filteredTransfers();
    var sales=orders.reduce(function(s,o){return s+orderClient(o)},0);
    var cost=orders.reduce(function(s,o){return s+orderFactory(o)},0);
    var exp=expenses.reduce(function(s,e){return s+n(e.amount)},0);
    var profit=sales-cost-exp;
    var paid=payments.reduce(function(s,p){return s+n(p.amount)},0)+orders.reduce(function(s,o){return s+n(o.deposit)},0);
    var factoryPaid=transfers.reduce(function(s,t){return s+n(t.amount)},0);
    var clientsTouched={}; orders.forEach(function(o){if(o.clientId)clientsTouched[o.clientId]=1});
    var factoriesTouched={}; orders.forEach(function(o){if(o.factoryId)factoriesTouched[o.factoryId]=1});
    return {orders:orders,expenses:expenses,payments:payments,transfers:transfers,sales:sales,cost:cost,exp:exp,profit:profit,paid:paid,factoryPaid:factoryPaid,clients:Object.keys(clientsTouched).length,factories:Object.keys(factoriesTouched).length};
  }
  function clientsReport(orders){
    var map={};
    orders.forEach(function(o){var r=addMap(map,o.clientId,{orders:1,sales:orderClient(o),cost:orderFactory(o),expenses:orderExp(o.id),profit:orderProfit(o)});r.name=clientName(o.clientId)});
    filteredPayments().forEach(function(p){var r=addMap(map,p.clientId,{paid:n(p.amount)});r.name=clientName(p.clientId)});
    orders.forEach(function(o){var r=addMap(map,o.clientId,{paid:n(o.deposit)});r.name=clientName(o.clientId)});
    Object.keys(map).forEach(function(id){map[id].balance=clientBalance(id)});
    return Object.keys(map).map(function(id){return map[id]})
  }
  function factoriesReport(orders){
    var map={};
    orders.forEach(function(o){var r=addMap(map,o.factoryId,{orders:1,sales:orderClient(o),cost:orderFactory(o),profit:orderProfit(o)});r.name=factoryName(o.factoryId)});
    filteredTransfers().forEach(function(t){var r=addMap(map,t.factoryId,{paid:n(t.amount)});r.name=factoryName(t.factoryId)});
    Object.keys(map).forEach(function(id){map[id].balance=factoryBalance(id)});
    return Object.keys(map).map(function(id){return map[id]})
  }
  function statusReport(orders){
    var map={};
    orders.forEach(function(o){var st=(typeof window.normalizeStatus==='function')?window.normalizeStatus(o.status):(o.status||'تحت التنفيذ');var r=addMap(map,st,{orders:1,sales:orderClient(o),cost:orderFactory(o),profit:orderProfit(o)});r.name=st});
    return Object.keys(map).map(function(k){return map[k]})
  }
  function monthsBack(limit){
    var src={}; arr('orders').forEach(function(o){var m=monthOf(o); if(m)src[m]=1}); arr('expenses').forEach(function(e){var m=monthOf(e); if(m)src[m]=1});
    var keys=Object.keys(src).sort();
    if(!keys.length){keys=[new Date().toISOString().slice(0,7)]}
    return keys.slice(-limit);
  }
  function monthlyReport(){
    return monthsBack(8).map(function(m){
      var orders=arr('orders').filter(function(o){return monthOf(o)===m});
      var exp=arr('expenses').filter(function(e){return monthOf(e)===m}).reduce(function(s,e){return s+n(e.amount)},0);
      var sales=orders.reduce(function(s,o){return s+orderClient(o)},0);
      var cost=orders.reduce(function(s,o){return s+orderFactory(o)},0);
      return {id:m,name:monthLabel(m),orders:orders.length,sales:sales,cost:cost,expenses:exp,profit:sales-cost-exp};
    })
  }
  function cards(summary){
    return '<div class="hp-v52-kpis">'
      +'<div class="hp-v52-kpi good"><span>مبيعات الفترة</span><b>'+money(summary.sales)+'</b></div>'
      +'<div class="hp-v52-kpi bad"><span>تكلفة المصانع</span><b>'+money(summary.cost)+'</b></div>'
      +'<div class="hp-v52-kpi bad"><span>مصروفات الفترة</span><b>'+money(summary.exp)+'</b></div>'
      +'<div class="hp-v52-kpi '+statusClass(summary.profit)+'"><span>صافي الربح</span><b>'+money(summary.profit)+'</b></div>'
      +'<div class="hp-v52-kpi"><span>أوردرات الفترة</span><b>'+count(summary.orders.length)+'</b></div>'
      +'<div class="hp-v52-kpi"><span>عملاء الفترة</span><b>'+count(summary.clients)+'</b></div>'
      +'</div>';
  }
  function tableBlock(title,subtitle,rows,cols,action,empty){
    return '<section class="hp-v52-block"><div class="hp-v52-title"><div><h3>'+esc(title)+'</h3>'+(subtitle?'<p>'+esc(subtitle)+'</p>':'')+'</div></div>'+
      '<div class="hp-v52-table">'+(rows&&rows.length?rows.map(function(r){return rowHtml(r,cols,action)}).join(''):'<div class="hp-v52-empty">'+esc(empty||'لا توجد بيانات')+'</div>')+'</div></section>';
  }
  function buildHtml(){
    var summary=makeSummary(), clients=clientsReport(summary.orders), factories=factoriesReport(summary.orders), statuses=statusReport(summary.orders), months=monthlyReport();
    var debtRows=arr('clients').map(function(c){return {id:c.id,name:c.name||'؟',balance:clientBalance(c.id),orders:arr('orders').filter(function(o){return o.clientId===c.id}).length}}).filter(function(r){return r.balance>0});
    var html='<div class="hp-v52-head"><div><div class="sec-label">Reports Pro V52</div><h2>تقارير الإدارة المتقدمة</h2><p>الفترة الحالية: '+esc(activePeriod()==='month'?'شهر '+monthLabel(activeMonth()):'كل البيانات / حسب اختيار الفلاتر')+'</p></div><div class="hp-v52-tools">'
      +csvBtn('summary','ملخص CSV','blue')
      +csvBtn('clients','عملاء CSV','')
      +csvBtn('orders','أوردرات CSV','')
      +'</div></div>';
    html+=cards(summary);
    html+='<div class="hp-v52-grid">';
    html+=tableBlock('أعلى العملاء مبيعات','حسب الفترة المختارة',topRows(clients,'sales',8),[
      {label:'العميل',key:'name'},{label:'مبيعات',val:function(r){return money(r.sales)},cls:'good'},{label:'مدفوع',val:function(r){return money(r.paid)}},{label:'ربح',val:function(r){return money(r.profit)},cls:function(r){return statusClass(r.profit)}},{label:'رصيد حالي',val:function(r){return money(r.balance)},cls:function(r){return r.balance>0?'bad':'good'}}
    ],function(r){return actionBtn('client',r.id,'تفاصيل','')},'لا توجد مبيعات عملاء');
    html+=tableBlock('أعلى العملاء مديونية','الأرصدة الحالية الإجمالية',topRows(debtRows,'balance',8),[
      {label:'العميل',key:'name'},{label:'الرصيد',val:function(r){return money(r.balance)},cls:'bad'},{label:'عدد الأوردرات',val:function(r){return count(r.orders)}}
    ],function(r){return actionBtn('client',r.id,'تحصيل','')},'لا توجد مديونيات عملاء');
    html+=tableBlock('تقرير المصانع','تكلفة ومدفوعات المصانع حسب الفترة',topRows(factories,'cost',8),[
      {label:'المصنع',key:'name'},{label:'تكلفة',val:function(r){return money(r.cost)},cls:'bad'},{label:'محول',val:function(r){return money(r.paid)}},{label:'رصيد حالي',val:function(r){return money(r.balance)},cls:function(r){return r.balance>0?'bad':'good'}},{label:'ربح أوردراته',val:function(r){return money(r.profit)},cls:function(r){return statusClass(r.profit)}}
    ],function(r){return actionBtn('factory',r.id,'تفاصيل','')},'لا توجد بيانات مصانع');
    html+=tableBlock('حالات الأوردرات','عدد وقيمة كل حالة',topRows(statuses,'orders',10),[
      {label:'الحالة',key:'name'},{label:'عدد',val:function(r){return count(r.orders)}},{label:'مبيعات',val:function(r){return money(r.sales)},cls:'good'},{label:'ربح',val:function(r){return money(r.profit)},cls:function(r){return statusClass(r.profit)}}
    ],null,'لا توجد أوردرات');
    html+=tableBlock('اتجاه آخر الشهور','قراءة سريعة للمبيعات والربح',months,[
      {label:'الشهر',key:'name'},{label:'أوردرات',val:function(r){return count(r.orders)}},{label:'مبيعات',val:function(r){return money(r.sales)},cls:'good'},{label:'تكلفة',val:function(r){return money(r.cost)},cls:'bad'},{label:'ربح',val:function(r){return money(r.profit)},cls:function(r){return statusClass(r.profit)}}
    ],null,'لا توجد شهور');
    html+='</div>';
    return html;
  }
  function ensureRoot(){
    var reports=byId('pg-reports'); if(!reports)return null;
    var root=byId(ROOT_ID);
    if(!root){root=document.createElement('div'); root.id=ROOT_ID; root.className='hp-v52-wrap'; reports.appendChild(root)}
    return root;
  }
  function renderPro(){
    try{var root=ensureRoot(); if(root)root.innerHTML=buildHtml()}catch(e){console.error('V52 reports render failed',e); try{if(window.HP_V50_STABILITY&&HP_V50_STABILITY.log)HP_V50_STABILITY.log('V52_REPORTS_ERROR',String(e&&e.message||e),'renderPro')}catch(_){}}
  }
  function csvEscape(v){v=String(v==null?'':v); return '"'+v.replace(/"/g,'""')+'"'}
  function download(name,rows){
    var csv='\ufeff'+rows.map(function(r){return r.map(csvEscape).join(',')}).join('\n');
    var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){URL.revokeObjectURL(a.href); a.remove()},500);
  }
  function exportCsv(type){
    var summary=makeSummary(), rows=[];
    if(type==='clients'){
      rows=[['Client','Orders','Sales','Paid in period','Current balance','Profit in period']].concat(clientsReport(summary.orders).map(function(r){return [r.name,r.orders,r.sales,r.paid,r.balance,r.profit]}));
      return download('haydar-pack-v52-clients.csv',rows);
    }
    if(type==='orders'){
      rows=[['Code','Date','Client','Factory','Status','Sales','Factory cost','Expenses','Profit']].concat(summary.orders.map(function(o){return [o.code||'',o.date||'',clientName(o.clientId),factoryName(o.factoryId),o.status||'',orderClient(o),orderFactory(o),orderExp(o.id),orderProfit(o)]}));
      return download('haydar-pack-v52-orders.csv',rows);
    }
    if(type==='factories'){
      rows=[['Factory','Orders','Factory cost','Transfers in period','Current balance','Order profit']].concat(factoriesReport(summary.orders).map(function(r){return [r.name,r.orders,r.cost,r.paid,r.balance,r.profit]}));
      return download('haydar-pack-v52-factories.csv',rows);
    }
    rows=[['Metric','Value'],['Sales',summary.sales],['Factory cost',summary.cost],['Expenses',summary.exp],['Profit',summary.profit],['Orders',summary.orders.length],['Clients',summary.clients],['Factories',summary.factories]];
    return download('haydar-pack-v52-summary.csv',rows);
  }
  function bindEvents(){if(window.__HP_V542_V52_EVENTS)return;window.__HP_V542_V52_EVENTS=true;document.addEventListener('click',function(ev){var b=ev.target&&ev.target.closest?ev.target.closest('[data-hp-v52-action],[data-hp-v52-csv]'):null;if(!b)return;try{ev.preventDefault();ev.stopPropagation()}catch(e){}var csv=b.getAttribute('data-hp-v52-csv');if(csv)return exportCsv(csv);var kind=b.getAttribute('data-hp-v52-action'), id=b.getAttribute('data-hp-v52-id')||'';try{if(kind==='client'&&typeof window.openClientDetail==='function')return window.openClientDetail(id);if(kind==='factory'&&typeof window.openFactoryDetail==='function')return window.openFactoryDetail(id)}catch(e){console.error('V52 action failed',e)}})}
  function hookReports(){
    if(window.__HP_V52_REPORTS_HOOKED)return; window.__HP_V52_REPORTS_HOOKED=true; bindEvents();
    var old=window.renderReports;
    window.renderReports=function(){
      if(typeof old==='function')old.apply(this,arguments);
      renderPro();
    };
    setTimeout(function(){try{if((window.activePage||'')==='reports')renderPro()}catch(e){}},400);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hookReports); else hookReports();
  window.HP_V52_REPORTS_PRO={version:VERSION,siteVersion:SITE_VERSION,render:renderPro,exportCsv:exportCsv,summary:makeSummary};
})();


/* ===== CONSOLIDATED SOURCE: 10-reports-finance-insights.js ===== */
/* Haydar Pack V54.2 - Finance Insights Lite Fix
   No inline onclick with dynamic ids. Fixes broken report buttons and Unexpected end of input. */
(function(){
  'use strict';
  var VERSION='54.2.0-finance-lite-fix';
  var SITE_VERSION='production_20260807_fix7';
  var ROOT_ID='hp-v53-finance-insights';
  var MODAL_ID='hp-v53-drilldown-modal';
  var lastError='';
  function byId(id){return document.getElementById(id)}
  function arr(k){return (window.DB&&Array.isArray(DB[k]))?DB[k]:[]}
  function n(v){var x=parseFloat(v);return isNaN(x)?0:x}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function safeJs(v){return JSON.stringify(String(v==null?'':v))}
  function data(v){return esc(String(v==null?'':v))}
  function btnOpen(type,id,label,cls){return '<button type="button" class="btn small '+esc(cls||'')+'" data-hp-v53-open="'+esc(type)+'" data-hp-v53-id="'+data(id)+'">'+esc(label||'فتح')+'</button>'}
  function btnDirect(fn,id,label,cls){return '<button type="button" class="btn '+esc(cls||'')+'" data-hp-v53-direct="'+esc(fn)+'" data-hp-v53-id="'+data(id)+'">'+esc(label||'فتح')+'</button>'}
  function btnTool(action,label,cls){return '<button type="button" class="btn '+esc(cls||'')+'" data-hp-v53-tool="'+esc(action)+'">'+esc(label||'تحديث')+'</button>'}
  function money(v){try{return n(v).toLocaleString('ar-EG',{maximumFractionDigits:2})+' ج'}catch(e){return String(n(v))+' ج'}}
  function count(v){try{return n(v).toLocaleString('ar-EG',{maximumFractionDigits:0})}catch(e){return String(n(v))}}
  function pct(v){try{return (n(v)*100).toLocaleString('ar-EG',{maximumFractionDigits:1})+'%'}catch(e){return String(Math.round(n(v)*100))+'%'}}
  function today0(){var d=new Date();d.setHours(0,0,0,0);return d}
  function daysSince(d){if(!d)return 9999;var x=new Date(d);if(isNaN(x.getTime()))return 9999;x.setHours(0,0,0,0);return Math.max(0,Math.round((today0()-x)/86400000))}
  function monthOf(o){var d=String((o&&o.date)||'');return /^\d{4}-\d{2}/.test(d)?d.slice(0,7):''}
  function latestMonth(){var m={};arr('orders').forEach(function(o){var x=monthOf(o);if(x)m[x]=1});var ks=Object.keys(m).sort();return ks.length?ks[ks.length-1]:(new Date().toISOString().slice(0,7))}
  function activePeriod(){return window.repPeriod||'all'}
  function activeMonth(){return window.selRepMonth||latestMonth()}
  function matchDate(date){try{if(typeof window.dateMatches==='function')return window.dateMatches(date,activePeriod(),activeMonth())}catch(e){} if(activePeriod()==='month')return String(date||'').slice(0,7)===activeMonth();return true}
  function periodOrders(){return arr('orders').filter(function(o){return matchDate(o&&o.date)})}
  function periodExpenses(){return arr('expenses').filter(function(o){return matchDate(o&&o.date)})}
  function periodPayments(){return arr('payments').filter(function(o){return matchDate(o&&o.date)})}
  function periodTransfers(){return arr('transfers').filter(function(o){return matchDate(o&&o.date)})}
  function calc(){return window.HP_CALC||{}}
  function qty(o){return n(o&&o.fQty)>0?n(o&&o.fQty):n(o&&o.qty)}
  function orderClient(o){try{if(calc().clientNetForOrder)return calc().clientNetForOrder(o)}catch(e){} try{if(typeof window.clientTotalForOrder==='function')return window.clientTotalForOrder(o)}catch(e){} return Math.max(0,qty(o)*n(o&&o.price)+n(o&&o.aklashe)-n(o&&o.discount)-n(o&&o.invoiceDiscount))}
  function orderFactory(o){try{if(calc().factoryTotalForOrder)return calc().factoryTotalForOrder(o)}catch(e){} try{if(typeof window.factoryTotalForOrder==='function')return window.factoryTotalForOrder(o)}catch(e){} return Math.max(0,n(o&&o.fQty)*n(o&&o.fPrice)+n(o&&o.fAk))}
  function orderExpense(id){try{if(calc().orderExpenseTotal)return calc().orderExpenseTotal(id)}catch(e){} return arr('expenses').filter(function(e){return e.orderId===id}).reduce(function(s,e){return s+n(e.amount)},0)}
  function orderProfit(o){try{if(calc().profitForOrder)return calc().profitForOrder(o)}catch(e){} try{if(typeof window.profitForOrder==='function')return window.profitForOrder(o)}catch(e){} return orderClient(o)-orderFactory(o)-orderExpense(o&&o.id)}
  function cname(id){var c=arr('clients').find(function(x){return x.id===id});return c?(c.name||'بدون اسم'):'؟'}
  function fname(id){var f=arr('factories').find(function(x){return x.id===id});return f?(f.name||'بدون اسم'):'؟'}
  function lastDate(items){return (items||[]).map(function(x){return x&&x.date||''}).filter(Boolean).sort().pop()||''}
  function normalizeStatus(st){try{if(typeof window.normalizeStatus==='function')return window.normalizeStatus(st)}catch(e){} return String(st||'تحت التنفيذ')}
  function isDelivered(o){return /تم|توصيل|delivered|done/i.test(normalizeStatus(o&&o.status))}
  function isClosed(o){return /تم|توصيل|ملغي|cancel|delivered|done/i.test(normalizeStatus(o&&o.status))}
  function clientBalance(id){try{if(calc().clientBalance)return calc().clientBalance(id)}catch(e){} try{if(typeof window.clientBalance==='function')return window.clientBalance(id)}catch(e){} var c=arr('clients').find(function(x){return x.id===id})||{};var os=arr('orders').filter(function(o){return o.clientId===id});var total=os.reduce(function(s,o){return s+orderClient(o)},0);var dep=os.reduce(function(s,o){return s+n(o.deposit)},0);var pay=arr('payments').filter(function(p){return p.clientId===id}).reduce(function(s,p){return s+n(p.amount)},0);return total+n(c.debt)-dep-pay}
  function factoryBalance(id){try{if(calc().factoryBalance)return calc().factoryBalance(id)}catch(e){} try{if(typeof window.factoryBalance==='function')return window.factoryBalance(id)}catch(e){} var f=arr('factories').find(function(x){return x.id===id})||{};var total=arr('orders').filter(function(o){return o.factoryId===id}).reduce(function(s,o){return s+orderFactory(o)},0);var paid=arr('transfers').filter(function(t){return t.factoryId===id}).reduce(function(s,t){return s+n(t.amount)},0);return total+n(f.debt)-paid}
  function statCls(v){return n(v)>=0?'good':'bad'}
  function asArray(v){if(Array.isArray(v))return v;if(v==null||v===false)return [];return [String(v)]}
  function row(cells,action){cells=asArray(cells);return '<div class="hp-v53-row">'+cells.map(function(c){c=c||{};return '<div class="'+esc(c.cls||'')+'"><span>'+esc(c.label||'')+'</span><b>'+esc(c.val==null?'':c.val)+'</b></div>'}).join('')+(action?'<div class="hp-v53-actions">'+action+'</div>':'')+'</div>'}
  function block(title,sub,rows,empty){rows=asArray(rows);return '<section class="hp-v53-block"><div class="hp-v53-title"><h3>'+esc(title)+'</h3>'+(sub?'<p>'+esc(sub)+'</p>':'')+'</div><div class="hp-v53-table">'+(rows.length?rows.join(''):'<div class="hp-v53-empty">'+esc(empty||'لا توجد بيانات')+'</div>')+'</div></section>'}
  function summary(){var os=periodOrders(), es=periodExpenses(), ps=periodPayments(), ts=periodTransfers();var sales=os.reduce(function(s,o){return s+orderClient(o)},0);var cost=os.reduce(function(s,o){return s+orderFactory(o)},0);var exp=es.reduce(function(s,e){return s+n(e.amount)},0);var cashIn=ps.reduce(function(s,p){return s+n(p.amount)},0)+os.reduce(function(s,o){return s+n(o.deposit)},0);var fpaid=ts.reduce(function(s,t){return s+n(t.amount)},0);var cDebt=arr('clients').reduce(function(s,c){return s+Math.max(0,clientBalance(c.id))},0);var fDebt=arr('factories').reduce(function(s,f){return s+Math.max(0,factoryBalance(f.id))},0);return {orders:os,sales:sales,cost:cost,exp:exp,profit:sales-cost-exp,cashIn:cashIn,fpaid:fpaid,netCash:cashIn-fpaid-exp,clientDebt:cDebt,factoryDebt:fDebt,coverage:fDebt?cDebt/fDebt:0,settlement:cDebt-fDebt}}
  function actions(){var s=summary(), out=[]; if(s.clientDebt>0)out.push({level:'تحصيل',title:'ابدأ بالتحصيل',text:'رصيد العملاء الحالي '+money(s.clientDebt)+' — افتح أولوية العملاء تحت.'}); if(s.factoryDebt>0)out.push({level:'مصانع',title:'راجع التزامات المصانع',text:'رصيد مصانع مستحق '+money(s.factoryDebt)+' — قارن قبل أي تحويل.'}); if(s.settlement<0)out.push({level:'خطر',title:'فجوة سيولة بعد التسويات',text:'بعد تحصيل كل العملاء قد يبقى عجز '+money(Math.abs(s.settlement))}); if(s.profit<0)out.push({level:'ربح',title:'الفترة خاسرة',text:'صافي الربح للفترة '+money(s.profit)}); if(!out.length)out.push({level:'مستقر',title:'لا توجد تنبيهات قوية',text:'الأرقام الحالية لا تظهر خطر مباشر، راجع التقارير التفصيلية.'});return out}
  function clientPriority(){return arr('clients').map(function(c){var os=arr('orders').filter(function(o){return o.clientId===c.id});var ps=arr('payments').filter(function(p){return p.clientId===c.id});var bal=clientBalance(c.id);var ld=lastDate(os.concat(ps));var d=daysSince(ld);var score=Math.max(0,bal)*(1+Math.min(d,120)/45)+os.filter(isDelivered).length*500;return {id:c.id,name:c.name||'؟',balance:bal,orders:os.length,last:ld,days:d,score:score}}).filter(function(r){return r.balance>0}).sort(function(a,b){return b.score-a.score}).slice(0,10)}
  function factoryPriority(){return arr('factories').map(function(f){var os=arr('orders').filter(function(o){return o.factoryId===f.id});var ts=arr('transfers').filter(function(t){return t.factoryId===f.id});var bal=factoryBalance(f.id);var ld=lastDate(os.concat(ts));var d=daysSince(ld);var pending=os.filter(function(o){return !isClosed(o)}).length;var score=Math.max(0,bal)*(1+Math.min(d,120)/60)+pending*300;return {id:f.id,name:f.name||'؟',balance:bal,orders:os.length,pending:pending,last:ld,days:d,score:score}}).filter(function(r){return r.balance>0}).sort(function(a,b){return b.score-a.score}).slice(0,10)}
  function lossOrders(){return periodOrders().map(function(o){return {id:o.id,code:o.code||o.id,date:o.date||'',client:cname(o.clientId),factory:fname(o.factoryId),sales:orderClient(o),cost:orderFactory(o),profit:orderProfit(o),status:normalizeStatus(o.status)}}).filter(function(r){return r.profit<0}).sort(function(a,b){return a.profit-b.profit}).slice(0,10)}
  function highDelivered(){return periodOrders().filter(isDelivered).map(function(o){return {id:o.id,code:o.code||o.id,date:o.date||'',client:cname(o.clientId),value:orderClient(o),deposit:n(o.deposit),profit:orderProfit(o),days:daysSince(o.date)}}).sort(function(a,b){return b.value-a.value}).slice(0,10)}
  function dataQuality(){var out=[];arr('orders').forEach(function(o){var miss=[];if(!o.date)miss.push('تاريخ');if(!o.clientId)miss.push('عميل');if(!o.factoryId)miss.push('مصنع');if(!o.status)miss.push('حالة');if(n(o.price)<=0&&n(o.fPrice)<=0)miss.push('أسعار');if(miss.length)out.push({type:'order',id:o.id,name:o.code||o.id,missing:miss.join(' / '),impact:orderClient(o)})});arr('clients').forEach(function(c){if(!c.name)out.push({type:'client',id:c.id,name:c.id,missing:'اسم العميل',impact:clientBalance(c.id)})});arr('factories').forEach(function(f){if(!f.name)out.push({type:'factory',id:f.id,name:f.id,missing:'اسم المصنع',impact:factoryBalance(f.id)})});return out.sort(function(a,b){return Math.abs(b.impact)-Math.abs(a.impact)}).slice(0,10)}
  function months(){var m={};['orders','payments','expenses','transfers'].forEach(function(k){arr(k).forEach(function(x){var mm=monthOf(x);if(mm)m[mm]=1})});return Object.keys(m).sort().slice(-8).map(function(mm){var os=arr('orders').filter(function(o){return monthOf(o)===mm});var ps=arr('payments').filter(function(p){return monthOf(p)===mm});var es=arr('expenses').filter(function(e){return monthOf(e)===mm});var ts=arr('transfers').filter(function(t){return monthOf(t)===mm});var cash=ps.reduce(function(s,p){return s+n(p.amount)},0)+os.reduce(function(s,o){return s+n(o.deposit)},0);var ex=es.reduce(function(s,e){return s+n(e.amount)},0);var tr=ts.reduce(function(s,t){return s+n(t.amount)},0);return {id:mm,cash:cash,transfers:tr,expenses:ex,net:cash-tr-ex,profit:os.reduce(function(s,o){return s+orderProfit(o)},0)}})}
  function buildHtml(){var s=summary(), ac=actions(), cp=clientPriority(), fp=factoryPriority(), lo=lossOrders(), hd=highDelivered(), dq=dataQuality(), ms=months();var html='<div class="hp-v53-wrap"><div class="hp-v53-head"><div><div class="sec-label">Reports Pro V53.4 داخل V54.2</div><h2>تنبيهات تنفيذية وتحليل كاش فلو — غير مكرر</h2><p>يعرض ماذا تفعل الآن، وليس نفس ملخص V52.</p></div><div class="hp-v53-tools">'+btnTool('actions','CSV تنبيهات','blue')+btnTool('cashflow','CSV كاش فلو','')+btnTool('refresh','تحديث','green')+'</div></div>';
    html+='<div class="hp-v53-kpis"><div class="'+statCls(s.netCash)+'"><span>صافي حركة الكاش</span><b>'+money(s.netCash)+'</b></div><div><span>مديونية العملاء</span><b>'+money(s.clientDebt)+'</b></div><div><span>التزامات المصانع</span><b>'+money(s.factoryDebt)+'</b></div><div class="'+statCls(s.settlement)+'"><span>بعد تحصيل/تسوية الكل</span><b>'+money(s.settlement)+'</b></div><div><span>تغطية العملاء للمصانع</span><b>'+pct(s.coverage)+'</b></div></div>';
    html+='<div class="hp-v53-grid">';
    html+=block('ماذا تفعل الآن؟','تنبيهات عملية حسب الداتا الحالية',ac.map(function(a){return row([{label:'الأولوية',val:a.level},{label:'العنوان',val:a.title},{label:'الإجراء',val:a.text}])}));
    html+=block('أولوية تحصيل العملاء','ترتيب حسب المبلغ والقدم والأوردرات المسلمة',cp.map(function(r){return row([{label:'العميل',val:r.name},{label:'المطلوب',val:money(r.balance),cls:'bad'},{label:'آخر حركة',val:r.last||'—'},{label:'منذ',val:r.days>=9999?'—':r.days+' يوم'}],btnOpen('client',r.id,'كشف','blue'))}),'لا توجد مديونية عملاء');
    html+=block('أولوية تسوية المصانع','مصانع محتاجة مراجعة قبل التحويل',fp.map(function(r){return row([{label:'المصنع',val:r.name},{label:'المطلوب',val:money(r.balance),cls:'bad'},{label:'قيد التنفيذ',val:count(r.pending)},{label:'آخر حركة',val:r.last||'—'}],btnOpen('factory',r.id,'كشف','blue'))}),'لا توجد التزامات مصانع');
    html+=block('أوردرات خاسرة تحتاج مراجعة','ليست موجودة بهذا الشكل في V52',lo.map(function(r){return row([{label:'الأوردر',val:r.code},{label:'العميل',val:r.client},{label:'المبيعات',val:money(r.sales),cls:'good'},{label:'التكلفة',val:money(r.cost),cls:'bad'},{label:'الربح',val:money(r.profit),cls:'bad'}],btnOpen('order',r.id,'فتح',''))}),'لا توجد أوردرات خاسرة في الفترة');
    html+=block('أوردرات مسلمة كبيرة القيمة','للمتابعة بعد التسليم والتحصيل',hd.map(function(r){return row([{label:'الأوردر',val:r.code},{label:'العميل',val:r.client},{label:'القيمة',val:money(r.value),cls:'good'},{label:'العربون',val:money(r.deposit)},{label:'منذ',val:r.days+' يوم'}],btnOpen('order',r.id,'فتح',''))}),'لا توجد أوردرات مسلمة في الفترة');
    html+=block('جودة البيانات الناقصة','أي نقص هنا ممكن يبوظ التقارير والحسابات',dq.map(function(r){return row([{label:'النوع',val:r.type},{label:'السجل',val:r.name},{label:'الناقص',val:r.missing},{label:'قيمة تقريبية',val:money(r.impact)}],r.type==='order'?btnOpen('order',r.id,'فتح',''):'')}),'لا توجد مشاكل بيانات واضحة');
    html+=block('صافي الكاش آخر الشهور','تحصيلات - تحويلات مصانع - مصروفات',ms.map(function(r){return row([{label:'الشهر',val:r.id},{label:'تحصيل',val:money(r.cash),cls:'good'},{label:'مصانع',val:money(r.transfers),cls:'bad'},{label:'مصروفات',val:money(r.expenses),cls:'bad'},{label:'الصافي',val:money(r.net),cls:statCls(r.net)}],btnOpen('month',r.id,'تفاصيل',''))}),'لا توجد شهور كافية');
    html+='</div></div>';return html}
  function ensureRoot(){var page=byId('pg-reports');if(!page)return null;var root=byId(ROOT_ID);if(!root){root=document.createElement('div');root.id=ROOT_ID;root.className='hp-v53-finance-fixed';var v52=byId('hp-v52-reports-pro');var v54=byId('hp-v54-1-repair');page.insertBefore(root,v52||v54||page.firstChild)}return root}
  function render(){try{injectStyle();var r=ensureRoot();if(!r)return;r.innerHTML=buildHtml();lastError=''}catch(e){lastError=String(e&&e.message||e);console.error('V54.2 finance render failed',e);try{if(window.HP_V50_STABILITY&&HP_V50_STABILITY.log)HP_V50_STABILITY.log('V53_REPORTS_ERROR',lastError,'render V54.2')}catch(_){}}}
  function ensureModal(){var m=byId(MODAL_ID);if(m)return m;m=document.createElement('div');m.id=MODAL_ID;m.className='hp-v53-modal';m.innerHTML='<div class="hp-v53-modal-card"><button type="button" class="hp-v53-close" data-hp-v53-tool="close">×</button><div id="hp-v53-modal-body"></div></div>';document.body.appendChild(m);return m}
  function detailLine(l,v,cls){return '<div class="hp-v53-detail-line '+(cls||'')+'"><span>'+esc(l)+'</span><b>'+esc(v)+'</b></div>'}
  function miniRows(items,cols){items=asArray(items);return '<div class="hp-v53-mini">'+(items.length?items.map(function(x){return '<div class="hp-v53-mini-row">'+cols.map(function(c){var v=typeof c.val==='function'?c.val(x):x[c.key];return '<div><span>'+esc(c.label)+'</span><b>'+esc(v)+'</b></div>'}).join('')+'</div>'}).join(''):'<div class="hp-v53-empty">لا توجد حركات</div>')+'</div>'}
  function open(type,id){try{var title='تفاصيل',body='';if(type==='client'){var c=arr('clients').find(function(x){return x.id===id})||{};var os=arr('orders').filter(function(o){return o.clientId===id});title='كشف سريع للعميل: '+(c.name||'؟');body='<div class="hp-v53-detail-grid">'+detailLine('رصيد العميل',money(clientBalance(id)),'bad')+detailLine('عدد الأوردرات',count(os.length))+detailLine('مبيعاته',money(os.reduce(function(s,o){return s+orderClient(o)},0)),'good')+'</div>'+miniRows(os.slice(0,30),[{label:'تاريخ',key:'date'},{label:'كود',key:'code'},{label:'حالة',val:function(o){return normalizeStatus(o.status)}},{label:'قيمة',val:function(o){return money(orderClient(o))}},{label:'ربح',val:function(o){return money(orderProfit(o))}}])+'<div class="hp-v53-actions-line">'+btnDirect('openClientDetail',id,'فتح العميل','blue')+'</div>'}
      else if(type==='factory'){var f=arr('factories').find(function(x){return x.id===id})||{};var fos=arr('orders').filter(function(o){return o.factoryId===id});title='كشف سريع للمصنع: '+(f.name||'؟');body='<div class="hp-v53-detail-grid">'+detailLine('رصيد المصنع',money(factoryBalance(id)),'bad')+detailLine('عدد الأوردرات',count(fos.length))+detailLine('تكلفة أوردراته',money(fos.reduce(function(s,o){return s+orderFactory(o)},0)),'bad')+'</div>'+miniRows(fos.slice(0,30),[{label:'تاريخ',key:'date'},{label:'كود',key:'code'},{label:'عميل',val:function(o){return cname(o.clientId)}},{label:'تكلفة',val:function(o){return money(orderFactory(o))}},{label:'ربح',val:function(o){return money(orderProfit(o))}}])+'<div class="hp-v53-actions-line">'+btnDirect('openFactoryDetail',id,'فتح المصنع','blue')+'</div>'}
      else if(type==='order'){var o=arr('orders').find(function(x){return x.id===id})||{};title='تفاصيل أوردر '+(o.code||o.id||'');body='<div class="hp-v53-detail-grid">'+detailLine('العميل',cname(o.clientId))+detailLine('المصنع',fname(o.factoryId))+detailLine('المبيعات',money(orderClient(o)),'good')+detailLine('التكلفة',money(orderFactory(o)),'bad')+detailLine('الربح',money(orderProfit(o)),statCls(orderProfit(o)))+'</div><div class="hp-v53-actions-line">'+btnDirect('openOrderDetail',id,'فتح الأوردر','blue')+'</div>'}
      else if(type==='month'){title='تفاصيل شهر '+id;var mos=arr('orders').filter(function(o){return monthOf(o)===id});body=miniRows(mos.slice(0,40),[{label:'تاريخ',key:'date'},{label:'كود',key:'code'},{label:'عميل',val:function(o){return cname(o.clientId)}},{label:'قيمة',val:function(o){return money(orderClient(o))}},{label:'ربح',val:function(o){return money(orderProfit(o))}}])}
      var m=ensureModal();var b=byId('hp-v53-modal-body');if(b)b.innerHTML='<div class="hp-v53-modal-title"><h3>'+esc(title)+'</h3><p>قراءة فقط — لا يعدل البيانات.</p></div>'+body;m.classList.add('active')}catch(e){console.error(e)}}
  function close(){var m=byId(MODAL_ID);if(m)m.classList.remove('active')}
  function csvEscape(v){v=String(v==null?'':v);return '"'+v.replace(/"/g,'""')+'"'}
  function download(name,rows){rows=asArray(rows);var csv='\ufeff'+rows.map(function(r){return asArray(r).map(csvEscape).join(',')}).join('\n');var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
  function exportCsv(type){if(type==='actions')return download('haydar-pack-v54-1-actions.csv',[['Level','Title','Action']].concat(actions().map(function(a){return [a.level,a.title,a.text]})));if(type==='cashflow')return download('haydar-pack-v54-1-cashflow.csv',[['Month','Cash in','Factory paid','Expenses','Net','Profit']].concat(months().map(function(r){return [r.id,r.cash,r.transfers,r.expenses,r.net,r.profit]})));var s=summary();return download('haydar-pack-v54-1-summary.csv',[['Metric','Value'],['Net cash',s.netCash],['Client debt',s.clientDebt],['Factory debt',s.factoryDebt],['Settlement',s.settlement],['Profit',s.profit]])}
  function bindEvents(){if(window.__HP_V542_FINANCE_EVENTS)return;window.__HP_V542_FINANCE_EVENTS=true;document.addEventListener('click',function(ev){var b=ev.target&&ev.target.closest?ev.target.closest('[data-hp-v53-open],[data-hp-v53-tool],[data-hp-v53-direct]'):null;if(!b)return;try{ev.preventDefault();ev.stopPropagation()}catch(e){}var t=b.getAttribute('data-hp-v53-tool');if(t){if(t==='refresh')return render();if(t==='close')return close();return exportCsv(t)}var o=b.getAttribute('data-hp-v53-open');if(o)return open(o,b.getAttribute('data-hp-v53-id')||'');var fn=b.getAttribute('data-hp-v53-direct'), id=b.getAttribute('data-hp-v53-id')||'';try{if(fn&&typeof window[fn]==='function')window[fn](id)}catch(e){console.error('V54.2 direct open failed',e)}})}
  function injectStyle(){if(byId('hp-v541-finance-style'))return;var st=document.createElement('style');st.id='hp-v541-finance-style';st.textContent='.hp-v53-wrap{margin:18px 0;padding:18px;border:1px solid #dbe3ee;border-radius:18px;background:#fff}.hp-v53-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.hp-v53-head h2{margin:3px 0;font-size:24px}.hp-v53-head p{margin:0;color:#5b6b83;font-weight:900}.hp-v53-tools{display:flex;gap:8px;flex-wrap:wrap}.hp-v53-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:12px 0}.hp-v53-kpis div{border:1px solid #e0e7f0;border-radius:14px;padding:10px;background:#f8fafc}.hp-v53-kpis span,.hp-v53-row span{display:block;font-weight:900;color:#667085}.hp-v53-kpis b{font-size:20px}.hp-v53-grid{display:grid;grid-template-columns:1fr;gap:14px}.hp-v53-block{border:1px solid #e6edf5;border-radius:16px;padding:12px;background:#fbfdff}.hp-v53-title h3{margin:0 0 4px;font-size:20px}.hp-v53-title p{margin:0 0 10px;color:#667085;font-weight:900}.hp-v53-row{display:grid;grid-template-columns:repeat(4,1fr) auto;gap:8px;align-items:center;border-top:1px solid #e6edf5;padding:9px 0}.hp-v53-row:first-child{border-top:0}.hp-v53-row b{font-size:15px}.hp-v53-actions{display:flex;gap:6px;justify-content:flex-end}.hp-v53-empty{padding:12px;border:1px dashed #cbd5e1;border-radius:12px;font-weight:900;color:#667085}.hp-v53-row .good,.hp-v53-kpis .good{color:#087443!important}.hp-v53-row .bad,.hp-v53-kpis .bad{color:#b42318!important}.hp-v53-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:5000;padding:14px;overflow:auto}.hp-v53-modal.active{display:block}.hp-v53-modal-card{background:#fff;border-radius:18px;max-width:900px;margin:20px auto;padding:16px;position:relative}.hp-v53-close{position:absolute;left:12px;top:12px;border:2px solid #000;border-radius:50%;width:36px;height:36px;background:#fff;font-weight:900}.hp-v53-detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.hp-v53-detail-line,.hp-v53-mini-row{border:1px solid #e5e7eb;border-radius:12px;padding:10px;margin-bottom:8px}.hp-v53-mini-row{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}@media(max-width:720px){.hp-v53-head{display:block}.hp-v53-tools{margin-top:10px}.hp-v53-kpis,.hp-v53-row,.hp-v53-detail-grid,.hp-v53-mini-row{grid-template-columns:1fr}.hp-v53-actions{justify-content:stretch}.hp-v53-actions .btn{width:100%}}';document.head.appendChild(st)}
  function hook(){if(window.__HP_V542_FINANCE_HOOKED)return;window.__HP_V542_FINANCE_HOOKED=true;bindEvents();var old=window.renderReports;window.renderReports=function(){try{if(typeof old==='function')old.apply(this,arguments)}catch(e){console.error('V52 render before V54.2 failed',e)}render()};var tries=0;var timer=setInterval(function(){tries++;try{if((window.activePage||'')==='reports')render()}catch(e){}if(tries>10)clearInterval(timer)},450);setTimeout(render,800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
  window.HP_V53_FINANCE={version:VERSION,siteVersion:SITE_VERSION,refresh:render,open:open,close:close,exportCsv:exportCsv,summary:summary,actions:actions,lastError:function(){return lastError}};
})();


/* ===== CONSOLIDATED SOURCE: 11-post49-audit-finalizer.js ===== */
/* Haydar Pack V54.2 - Post V49 Audit + Backend Link Settings
   Final frontend tester: verifies post-V49 modules through V54, forces reports order, injects Apps Script /exec editor in sync screen. */
(function(){
  'use strict';
  var VERSION='2026.08.07-production-fix.5';
  var SITE_VERSION='production_20260807_fix7';
  var REPORT_AUDIT_ID='hp-v533-post49-audit-strip';
  var BACKEND_PANEL_ID='hp-v533-backend-panel';
  var URL_KEY='hayder_pack_stage4_backend_url_v32';
  var OLD_URL_KEY='hayder_pack_backend_url_v10';
  var DEFAULT_URL=(typeof window.HP_APPS_SCRIPT_URL==='string'&&window.HP_APPS_SCRIPT_URL)||'https://script.google.com/macros/s/AKfycbyz3ChhXQ2xMZdD2UHmAsLitbgIvKcSGiQYX7zBNNrJb6h9lem5sLlOBgpkPCOyrWZd2A/exec';
  var MODULES=[
    {key:'save',label:'V49.1 حماية الحفظ',global:'HP_V501_SAVE_GUARD',alt:'HP_V49_1_SAVE_GUARD'},
    {key:'backup',label:'V50 Backup Pro',global:'HP_V50_BACKUP_PRO'},
    {key:'mobile',label:'V51/V53.3 Mobile Back',global:'HP_V51_MOBILE_UX',alt:'HP_V52_MOBILE_UX'},
    {key:'reports',label:'V52 Reports Pro',global:'HP_V52_REPORTS_PRO'},
    {key:'finance',label:'V53.4 Finance Repair',global:'HP_V53_FINANCE'},
    {key:'documents',label:'V55.1 Docs Root Fix',global:'HP_V54_DOCS'}
  ];
  function byId(id){return document.getElementById(id)}
  function q(sel,root){return (root||document).querySelector(sel)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function toastSafe(msg){try{if(typeof window.toast==='function')window.toast(msg);else console.log(msg)}catch(e){}}
  function log(type,msg,extra){try{if(window.HP_V50_STABILITY&&HP_V50_STABILITY.log)HP_V50_STABILITY.log(type,msg,extra||'V54')}catch(e){}}
  function has(m){return !!(window[m.global]||(m.alt&&window[m.alt]))}
  function aliasModules(){try{if(window.HP_V501_SAVE_GUARD&&!window.HP_V49_1_SAVE_GUARD)window.HP_V49_1_SAVE_GUARD=window.HP_V501_SAVE_GUARD}catch(e){} try{if(window.HP_V52_MOBILE_UX&&!window.HP_V51_MOBILE_UX)window.HP_V51_MOBILE_UX=window.HP_V52_MOBILE_UX}catch(e){}}
  function moduleStatus(){aliasModules();return MODULES.map(function(m){return {key:m.key,label:m.label,ok:has(m)}})}
  function normalizeUrl(url){url=String(url||'').trim().replace(/\s+/g,'').replace(/[?#].*$/,'').replace(/\/+$/,''); var m=url.match(/^(https:\/\/script\.google\.com\/macros\/s\/[^\/]+)(?:\/(exec|dev))?$/); return m?m[1]+'/exec':''}
  function currentBackend(){var u=''; try{u=HPPreviewStorage.getItem(URL_KEY)||HPPreviewStorage.getItem(OLD_URL_KEY)||''}catch(e){} u=normalizeUrl(u)||normalizeUrl(window.HP_APPS_SCRIPT_URL)||normalizeUrl(DEFAULT_URL); try{HPPreviewStorage.setItem(URL_KEY,u);HPPreviewStorage.setItem(OLD_URL_KEY,u)}catch(e){} window.HP_APPS_SCRIPT_URL=u; return u}
  function setBackend(url){url=normalizeUrl(url); if(!url){toastSafe('رابط Apps Script غير صحيح. لازم يكون رابط /exec');return false} try{HPPreviewStorage.setItem(URL_KEY,url);HPPreviewStorage.setItem(OLD_URL_KEY,url)}catch(e){} window.HP_APPS_SCRIPT_URL=url; toastSafe('تم حفظ رابط Apps Script الجديد على هذا الجهاز'); injectBackendPanel(true); return true}
  function resetBackend(){if(!confirm('ترجع رابط Apps Script الافتراضي؟'))return; setBackend(DEFAULT_URL)}
  function saveBackendFromInput(){var inp=byId('hp-v533-backend-url'); if(!inp)return; if(confirm('سيتم تغيير رابط Apps Script المستخدم للمزامنة على هذا الجهاز. تأكد أنك عملت Deploy صحيح. تكمل؟'))setBackend(inp.value)}
  function testBackend(){currentBackend(); var line=byId('hp-v533-backend-test'); if(line)line.textContent='جاري اختبار الاتصال...'; try{if(window.HP_V37_SYNC&&typeof HP_V37_SYNC.checkMeta==='function'){HP_V37_SYNC.checkMeta(true).then(function(res){if(line)line.textContent=res?'تم الاتصال بنجاح أو تم قراءة الحالة.':'لم يصل رد واضح، راجع الرابط أو الصلاحيات.'}).catch(function(e){if(line)line.textContent=e.message||'فشل الاختبار'});return}}catch(e){} if(line)line.textContent='تعذر تشغيل اختبار المزامنة الآن، لكن الرابط محفوظ.'}
  function injectStyle(){if(byId('hp-v533-style'))return; var st=document.createElement('style'); st.id='hp-v533-style'; st.textContent='\n#'+REPORT_AUDIT_ID+'{margin:0 0 14px 0;padding:12px 14px;border:3px solid #0f5f2f;border-radius:18px;background:#e9fff1;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;direction:rtl;font-weight:900}\n#'+REPORT_AUDIT_ID+'.bad{border-color:#b91c1c;background:#fff1f1}\n#'+REPORT_AUDIT_ID+' small{display:block;color:#475569;margin-top:4px;font-weight:800}.hp-v533-audit-items{display:flex;gap:8px;flex-wrap:wrap}.hp-v533-audit-items span{border:2px solid #d0d7e2;border-radius:999px;padding:7px 10px;background:#fff}.hp-v533-audit-items span.ok{border-color:#15803d;color:#166534}.hp-v533-audit-items span.bad{border-color:#b91c1c;color:#b91c1c}\n#'+BACKEND_PANEL_ID+'{border:4px solid #000;border-radius:18px;background:#fff7d8;padding:14px;margin:12px 0;box-shadow:0 3px 0 #000;direction:rtl}#'+BACKEND_PANEL_ID+' h3{margin:0 0 6px;font-size:20px}#'+BACKEND_PANEL_ID+' input{width:100%;direction:ltr;text-align:left;border:3px solid #000;border-radius:14px;padding:10px;font-weight:800;font-family:monospace;box-sizing:border-box;background:#fff}#hp-v533-backend-test{font-weight:900;margin-top:8px;color:#334155}\n.hp-v53-alert{border:3px solid #000;border-radius:16px;padding:10px;margin:8px 0;background:#fff;display:grid;gap:4px}.hp-v53-alert b{font-size:17px}.hp-v53-alert.good{border-color:#15803d;background:#edfff2}.hp-v53-alert.warn{border-color:#a16207;background:#fff7d6}.hp-v53-alert.bad{border-color:#b91c1c;background:#fff1f1}\n@media(max-width:700px){#'+REPORT_AUDIT_ID+'{font-size:13px}.hp-v533-audit-items span{padding:6px 8px}}\n'; document.head.appendChild(st)}
  function auditHtml(){var rows=moduleStatus(), ok=rows.every(function(r){return r.ok}); return '<div id="'+REPORT_AUDIT_ID+'" class="'+(ok?'ok':'bad')+'"><div><b>فحص نسخة V54.2</b><small>تأكيد وجود كل ما بعد V49 حتى Documents Pro بدون مسح القديم</small></div><div class="hp-v533-audit-items">'+rows.map(function(r){return '<span class="'+(r.ok?'ok':'bad')+'">'+(r.ok?'✓':'!')+' '+esc(r.label)+'</span>'}).join('')+'</div></div>'}
  function placeAuditStrip(){injectStyle(); var reports=byId('pg-reports'); if(!reports)return; var old=byId(REPORT_AUDIT_ID); if(old)old.remove(); var holder=document.createElement('div');holder.innerHTML=auditHtml(); reports.insertBefore(holder.firstChild,reports.firstChild)}
  function forceReportsOrder(){
    var reports=byId('pg-reports'); if(!reports)return;
    try{if(window.HP_V52_REPORTS_PRO&&typeof HP_V52_REPORTS_PRO.render==='function')HP_V52_REPORTS_PRO.render()}catch(e){log('V53_3_V52_RENDER_ERROR',String(e&&e.message||e))}
    try{if(window.HP_V53_FINANCE&&typeof HP_V53_FINANCE.refresh==='function')HP_V53_FINANCE.refresh()}catch(e){log('V53_3_FINANCE_RENDER_ERROR',String(e&&e.message||e))}
    var v53=byId('hp-v53-finance-insights'), v52=byId('hp-v52-reports-pro'), strip=byId(REPORT_AUDIT_ID);
    if(v53&&v52&&v52.parentNode===reports)reports.insertBefore(v53,v52);
    if(strip&&strip.parentNode===reports)reports.insertBefore(strip,reports.firstChild);
    if(!v53){var box=document.createElement('div');box.id='hp-v53-finance-insights';box.className='hp-v53-wrap';box.innerHTML='<div class="hp-v53-head"><div><div class="sec-label">Reports Pro V53.3</div><h2>قسم V53 لم يتحمل</h2><p>لو ظهرت الرسالة دي، ارفع ملفات V53.3 كاملة وافتح الرابط الجديد.</p></div><div><button class="btn small blue" type="button" data-hp-v552-reload="1">إعادة تحميل</button></div></div>';reports.insertBefore(box,v52||reports.firstChild);log('V53_3_FINANCE_MISSING','HP_V53_FINANCE root missing after render')}
  }
  function finalRenderReports(){try{if(typeof window.__hpV533BaseReports==='function')window.__hpV533BaseReports.apply(this,arguments)}catch(e){log('V53_3_BASE_REPORTS_ERROR',String(e&&e.message||e))} try{placeAuditStrip();forceReportsOrder()}catch(e){log('V53_3_FINAL_REPORTS_ERROR',String(e&&e.message||e))}}
  function injectBackendPanel(force){
    injectStyle(); var drawer=q('#dr-sync .drawer')||q('#dr-settings .drawer'); if(!drawer)return; var old=byId(BACKEND_PANEL_ID); if(old)old.remove();
    var div=document.createElement('div'); div.id=BACKEND_PANEL_ID;
    var url=currentBackend();
    div.innerHTML='<h3>تغيير رابط Apps Script من البرنامج</h3><div style="font-weight:900;margin-bottom:8px">استخدمه فقط لو عملت Apps Script جديد أو Deploy جديد. هذا يغير رابط المزامنة على هذا الجهاز فقط.</div><input id="hp-v533-backend-url" value="'+esc(url)+'" placeholder="https://script.google.com/macros/s/.../exec"><div class="btn-row" style="margin-top:10px"><button class="btn blue" type="button" data-hp-v533-backend="save">حفظ الرابط</button><button class="btn green" type="button" data-hp-v533-backend="test">اختبار الاتصال</button><button class="btn" type="button" data-hp-v533-backend="reset">رجوع للافتراضي</button></div><div id="hp-v533-backend-test">الرابط الحالي محفوظ محليًا وسيستخدم في المزامنة والنسخ الاحتياطي.</div>';
    var anchor=byId('hp-v41-sync-ui')||byId('hp-v37-sync-panel')||drawer.children[2];
    if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(div,anchor.nextSibling); else drawer.insertBefore(div,drawer.firstChild);
    if(force){var inp=byId('hp-v533-backend-url'); if(inp)inp.focus()}
  }
  function bindBackendEvents(){
    if(window.__HP_V552_BACKEND_EVENTS)return; window.__HP_V552_BACKEND_EVENTS=true;
    document.addEventListener('click',function(ev){
      var b=ev.target&&ev.target.closest?ev.target.closest('[data-hp-v533-backend],[data-hp-v552-reload]'):null;
      if(!b)return;
      try{ev.preventDefault();ev.stopPropagation()}catch(e){}
      if(b.hasAttribute('data-hp-v552-reload')){try{location.reload()}catch(e){} return;}
      var a=b.getAttribute('data-hp-v533-backend');
      if(a==='save')return saveBackendFromInput();
      if(a==='test')return testBackend();
      if(a==='reset')return resetBackend();
    },true);
  }
  function hookOpenSync(){var old=window.openSync; if(typeof old==='function'&&!old.__hpV533Backend){var w=function(){var r=old.apply(this,arguments); setTimeout(function(){injectBackendPanel(false)},260); setTimeout(function(){injectBackendPanel(false)},900); return r}; w.__hpV533Backend=true; w.__hpOriginal=old; window.openSync=w}}
  function hookReports(){if(window.__HP_V533_AUDIT_HOOKED)return; window.__HP_V533_AUDIT_HOOKED=true; aliasModules(); window.__hpV533BaseReports=window.renderReports; window.renderReports=finalRenderReports; setTimeout(function(){try{if((window.activePage||'')==='reports')window.renderReports()}catch(e){}},250); setTimeout(function(){try{if((window.activePage||'')==='reports')window.renderReports()}catch(e){}},900); setTimeout(function(){try{if((window.activePage||'')==='reports')window.renderReports()}catch(e){}},1800)}
  function boot(){injectStyle();bindBackendEvents();hookOpenSync();hookReports();setTimeout(function(){try{if(q('#dr-sync.open .drawer'))injectBackendPanel(false)}catch(e){}},1000)}
  function verify(){var s=moduleStatus();return {version:VERSION,siteVersion:SITE_VERSION,modules:s,ok:s.every(function(x){return x.ok}),backendUrl:currentBackend()}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.HP_V53_3_FINAL={version:VERSION,siteVersion:SITE_VERSION,verify:verify,renderReports:finalRenderReports,forceReportsOrder:forceReportsOrder,backendUrl:currentBackend,saveBackendUrl:saveBackendFromInput,resetBackendUrl:resetBackend,testBackendUrl:testBackend,injectBackendPanel:injectBackendPanel};
  window.HP_POST49_AUDIT=window.HP_V53_3_FINAL;
})();


/* ===== CONSOLIDATED SOURCE: 12-documents-pro.js ===== */
/* Haydar Pack V54 - Documents Pro
   Professional document archive + stable numbering + reprint snapshots.
   Built on V53.3 without touching sync/backend logic. */
(function(){
  'use strict';
  var VERSION='2026.08.07-production-fix.5';
  var SITE_VERSION='production_20260807_fix7';
  var ROOT_ID='hp-v54-1-repair';
  var PREVIEW_MODAL_ID='hp-v54-doc-preview';
  var STATUS={draft:'Draft',sent:'Sent',paid:'Paid',cancelled:'Cancelled'};
  var booted=false;
  function byId(id){return document.getElementById(id)}
  function arr(k){return (window.DB&&Array.isArray(DB[k]))?DB[k]:[]}
  function n(v){var x=parseFloat(v);return isNaN(x)?0:x}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function attr(v){return esc(v).replace(/\n/g,' ')}
  function safeJs(v){return JSON.stringify(String(v==null?'':v))}
  function data(v){return esc(String(v==null?'':v))}
  function docBtn(action,id,label,cls){return '<button type="button" class="btn small '+esc(cls||'')+'" data-hp-v54-action="'+esc(action)+'" data-hp-v54-id="'+data(id)+'">'+esc(label||action)+'</button>'}
  function toolBtn(action,label,cls){return '<button type="button" class="btn '+esc(cls||'')+'" data-hp-v54-tool="'+esc(action)+'">'+esc(label||action)+'</button>'}
  function money(v){try{return n(v).toLocaleString('ar-EG',{maximumFractionDigits:2})+' ج'}catch(e){return String(n(v))+' ج'}}
  function count(v){try{return n(v).toLocaleString('ar-EG',{maximumFractionDigits:0})}catch(e){return String(n(v))}}
  function nowIso(){try{return new Date().toISOString()}catch(e){return ''}}
  function today(){try{return new Date().toISOString().slice(0,10)}catch(e){return ''}}
  function year(){return String(new Date().getFullYear())}
  function toast(msg){try{if(typeof window.toast==='function')window.toast(msg);else console.log(msg)}catch(e){}}
  function log(type,msg,extra){try{if(window.HP_V50_STABILITY&&HP_V50_STABILITY.log)HP_V50_STABILITY.log(type,msg,extra||'V54')}catch(e){}}
  function ensureStore(){
    if(!window.DB)window.DB={};
    if(!Array.isArray(DB.documents))DB.documents=[];
    if(!DB.documentCounters||typeof DB.documentCounters!=='object'||Array.isArray(DB.documentCounters))DB.documentCounters={};
    return DB.documents;
  }
  function client(id){return arr('clients').find(function(x){return x.id===id})||{name:'؟'}}
  function factory(id){return arr('factories').find(function(x){return x.id===id})||{name:'؟'}}
  function calc(){return window.HP_CALC||{}}
  function orderTitle(o){o=o||{}; if(String(o.name||'').trim())return o.name; if(o.size)return (o.type||'شنطة')+' '+o.size; var w=String(o.width||'').trim(),h=String(o.height||'').trim(); return (o.type||'شنطة')+(w||h?' '+(w||'—')+' × '+(h||'—'):'')}
  function sizeText(o){o=o||{}; if(o.size)return o.size; var w=String(o.width||'').trim(),h=String(o.height||'').trim(); return (w||h)?(w||'—')+' × '+(h||'—'):'—'}
  function billQty(o){try{if(typeof window.billQty==='function')return window.billQty(o)}catch(e){} return n(o&&o.fQty)>0?n(o.fQty):n(o&&o.qty)}
  function clientTotal(o){try{if(calc().clientNetForOrder)return calc().clientNetForOrder(o)}catch(e){} try{if(typeof window.clientTotalForOrder==='function')return window.clientTotalForOrder(o)}catch(e){} return Math.max(0,billQty(o)*n(o&&o.price)+n(o&&o.aklashe)-n(o&&o.discount)-n(o&&o.invoiceDiscount))}
  function factoryTotal(o){try{if(calc().factoryTotalForOrder)return calc().factoryTotalForOrder(o)}catch(e){} try{if(typeof window.factoryTotalForOrder==='function')return window.factoryTotalForOrder(o)}catch(e){} return (n(o&&o.fQty)||n(o&&o.qty))*n(o&&o.fPrice)+n(o&&o.fAk)}
  function discount(o){try{if(calc().orderDiscount)return calc().orderDiscount(o)}catch(e){} return Math.max(0,n(o&&(o.invoiceDiscount!=null?o.invoiceDiscount:o.discount)))}
  function clientBalance(id){try{if(calc().clientBalance)return calc().clientBalance(id)}catch(e){} try{if(typeof window.clientBalance==='function')return window.clientBalance(id)}catch(e){} var c=client(id); var os=arr('orders').filter(function(o){return o.clientId===id}); var ps=arr('payments').filter(function(p){return p.clientId===id}); var sales=os.reduce(function(s,o){return s+clientTotal(o)},0), deposits=os.reduce(function(s,o){return s+n(o.deposit)},0), paid=ps.reduce(function(s,p){return s+n(p.amount)},0); return sales+n(c.debt)-deposits-paid}
  function factoryBalance(id){try{if(calc().factoryBalance)return calc().factoryBalance(id)}catch(e){} try{if(typeof window.factoryBalance==='function')return window.factoryBalance(id)}catch(e){} var f=factory(id); var os=arr('orders').filter(function(o){return o.factoryId===id}); var ts=arr('transfers').filter(function(t){return t.factoryId===id}); return os.reduce(function(s,o){return s+factoryTotal(o)},0)+n(f.debt)-ts.reduce(function(s,t){return s+n(t.amount)},0)}
  function selectedIds(cls){return Array.prototype.slice.call(document.querySelectorAll('.'+cls+':checked')).map(function(x){return x.value})}
  function selectedClientOrders(cid){var all=arr('orders').filter(function(o){return o.clientId===cid}); var ids=selectedIds('client-order-check'); return ids.length?all.filter(function(o){return ids.indexOf(o.id)>=0}):all}
  function selectedFactoryOrders(fid){var all=(typeof window.factoryOrdersFiltered==='function')?window.factoryOrdersFiltered(fid):arr('orders').filter(function(o){return o.factoryId===fid}); var ids=selectedIds('factory-order-check'); return ids.length?all.filter(function(o){return ids.indexOf(o.id)>=0}):all}
  function prefix(type){return {quote:'QT',invoice:'INV',clientStatement:'CS',factoryStatement:'FS'}[type]||'DOC'}
  function typeTitle(type){return {quote:'عرض سعر',invoice:'فاتورة بيع',clientStatement:'كشف حساب عميل',factoryStatement:'كشف حساب مصنع'}[type]||'مستند'}
  function nextNo(type){ensureStore(); var key=year()+'-'+prefix(type); DB.documentCounters[key]=n(DB.documentCounters[key])+1; return 'HP-'+year()+'-'+prefix(type)+'-'+String(DB.documentCounters[key]).padStart(4,'0')}
  function saveData(reason){
    try{if(typeof window.save==='function')window.save(false);else HPPreviewStorage.setItem('hayder_bags_app',JSON.stringify(DB))}catch(e){log('V54_SAVE_ERROR',String(e&&e.message||e),reason)}
    try{if(window.HP_V37_SYNC&&typeof HP_V37_SYNC.markPending==='function')HP_V37_SYNC.markPending('v54-documents-'+(reason||'save'))}catch(e){}
    setTimeout(function(){try{if(window.HP_V501_SAVE_GUARD&&typeof HP_V501_SAVE_GUARD.confirm==='function')HP_V501_SAVE_GUARD.confirm('v54-documents-'+(reason||'save'),false);else if(window.HP_V37_SYNC&&typeof HP_V37_SYNC.push==='function')HP_V37_SYNC.push(false)}catch(e){}},220);
  }
  function logo(){return 'hp-logo-v3-192.png?v='+SITE_VERSION}
  function printRepairCss(){return '@page{size:A4 landscape;margin:8mm}html,body{width:100%;max-width:100%;min-width:0;height:auto;overflow:visible!important}.sheet{width:100%;max-width:100%;min-width:0;height:auto;overflow:visible!important;transform:none!important;contain:none!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.hp-doc-head,.brand,.brand>div,.meta,.meta>div{min-width:0}.brand{flex:1 1 0}.brand img{flex:0 0 auto}.brand>div,.meta span{overflow-wrap:anywhere;word-break:normal}table{width:100%!important;max-width:100%!important;table-layout:fixed!important}thead{display:table-header-group}tfoot{display:table-footer-group}tr{page-break-inside:avoid;break-inside:avoid-page}th,td{min-width:0;overflow-wrap:anywhere;word-break:normal}.totals,.terms,.note,.sign{page-break-inside:avoid;break-inside:avoid-page}.totals{width:72mm!important;max-width:72mm!important;margin-top:7px!important;margin-right:auto!important;margin-left:0!important;table-layout:auto!important}img{max-width:100%}@media print{@page{size:A4 landscape;margin:8mm}html,body{width:auto!important;max-width:none!important;min-width:0!important;height:auto!important;overflow:visible!important}body{margin:0!important}.no-print{display:none!important}.sheet{width:100%!important;max-width:none!important;min-width:0!important;height:auto!important;padding:0!important;margin:0!important;overflow:visible!important;transform:none!important}table{width:100%!important;max-width:100%!important;table-layout:fixed!important}thead{display:table-header-group!important}tr{page-break-inside:avoid!important;break-inside:avoid-page!important}}'}
  function docCss(){return '@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#111;font-family:Arial,Tahoma,sans-serif;font-size:11px}.sheet{padding:2mm}.no-print{position:fixed;top:8px;left:8px;z-index:999;display:flex;gap:7px}.no-print button{font-weight:900;border:2px solid #000;border-radius:9px;background:#fff;color:#000;padding:8px 12px}.hp-doc-head{direction:ltr;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0b2442;padding-bottom:7px;margin-bottom:9px}.brand{display:flex;align-items:center;gap:10px}.brand.r{direction:rtl;text-align:right}.brand.l{direction:ltr;text-align:left}.brand img{width:68px;height:68px;object-fit:contain}.title-en{font-size:25px;font-weight:900;color:#0b2442}.title-ar{font-size:27px;font-weight:900;color:#ad7b25}.sub{font-size:11px;font-weight:900;color:#111;margin-top:5px}.doc-title{text-align:center;font-size:22px;font-weight:900;margin:6px 0 9px;text-decoration:underline}.doc-chip{display:none!important}.meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px 14px;margin-bottom:8px}.meta div{border-bottom:1px dotted #777;padding:3px 0;display:flex;justify-content:space-between;gap:12px}.meta b{white-space:nowrap}table{border-collapse:collapse}th,td{border:1.2px solid #000;text-align:center;vertical-align:middle;padding:4px 3px}th{background:#e7edf8;font-weight:900}.totals{margin-top:9px;margin-right:auto}.totals td{font-weight:900}.terms,.note{margin-top:10px;line-height:1.65;font-weight:900}.sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:18px;font-weight:900}.sign div{border-top:1px solid #000;padding-top:7px;text-align:center}.foot{display:none}'+printRepairCss()}
  function meta(rows){return '<div class="meta">'+rows.map(function(r){return '<div><b>'+esc(r[0])+'</b><span>'+esc(r[1]||'')+'</span></div>'}).join('')+'</div>'}
  function header(){return '<div class="hp-doc-head"><div class="brand l"><img src="'+logo()+'"><div><div class="title-en">Haydar Pack</div><div class="sub">Eco-friendly bags &amp; printed packaging</div></div></div><div class="brand r"><img src="'+logo()+'"><div><div class="title-ar">حيدر باك</div><div class="sub">شنط قماش غير منسوجة صديقة للبيئة</div></div></div></div>'}
  function cleanFileName(v){var out=String(v==null?'':v);try{out=out.normalize('NFKC')}catch(e){}out=out.replace(/[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,' ').replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'').slice(0,140);if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(out))out='Haydar Pack '+out;return out||'Haydar Pack'}
  function makeDocTitle(typeOrTitle,name,no){var t=typeTitle(typeOrTitle)||String(typeOrTitle||'مستند'); if(typeOrTitle==='invoice')t='فاتورة'; if(typeOrTitle==='quote')t='عرض سعر'; if(typeOrTitle==='clientStatement'||typeOrTitle==='factoryStatement')t='كشف حساب'; return cleanFileName(t+(name?' '+name:'')+(no?' - '+no:''))}
  function docHtml(title,no,status,metaHtml,head,body,totals,extra,fileTitle){return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>'+esc(cleanFileName(fileTitle||((title||'مستند')+' - '+no)))+'</title><style>'+docCss()+'</style></head><body><div class="no-print"><button onclick="window.hpPrintWhenReady()">طباعة / PDF</button><button onclick="window.close()">إغلاق</button></div><div class="sheet">'+header()+'<div class="doc-title">'+esc(title)+'</div>'+metaHtml+'<table><thead>'+head+'</thead><tbody>'+body+'</tbody></table>'+totals+(extra||'')+'</div></body></html>'}
  function rowsClient(orders,mode){var body='',gross=0,disc=0,net=0,deps=0; orders.forEach(function(o){var q=billQty(o), price=n(o.price), before=q*price+n(o.aklashe), d=discount(o), after=Math.max(0,before-d), dep=n(o.deposit); gross+=before; disc+=d; net+=after; deps+=dep; body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(orderTitle(o))+'</td><td>'+esc(o.type||'')+'</td><td>'+esc(sizeText(o))+'</td><td>'+esc(o.color||'')+'</td>'+(mode==='invoice'?'<td>'+esc(o.print||'')+'</td>':'')+'<td>'+esc(o.handle||'بدون')+'</td><td>'+esc(o.colorCount||o.colorsCount||o.printColors||'1')+'</td><td>'+esc(o.face||o.printFace||o.printSide||'وجه واحد')+'</td><td>'+count(q)+'</td><td>'+money(price)+'</td><td>'+money(q*price)+'</td></tr>'; if(n(o.aklashe)>0)body+='<tr><td>'+esc(o.code||'')+'</td><td>اكلاشيه / تجهيز طباعة</td><td>اكلاشيه</td><td>-</td><td>-</td>'+(mode==='invoice'?'<td></td>':'')+'<td>-</td><td>-</td><td>-</td><td>1</td><td>'+money(o.aklashe)+'</td><td>'+money(o.aklashe)+'</td></tr>'}); return {body:body,gross:gross,disc:disc,net:net,deps:deps}}
  function rowsFactory(orders){var body='',total=0; orders.forEach(function(o){var c=client(o.clientId), q=n(o.fQty)||n(o.qty), price=n(o.fPrice), val=factoryTotal(o); total+=val; body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(c.name||'')+'</td><td>'+esc(orderTitle(o))+'</td><td>'+esc(o.type||'')+'</td><td>'+esc(sizeText(o))+'</td><td>'+esc(o.color||'')+'</td><td>'+esc(o.handle||'بدون')+'</td><td>'+count(q)+'</td><td>'+money(price)+'</td><td>'+money(val)+'</td></tr>'}); return {body:body,total:total}}
  function addRecord(rec){var docs=ensureStore(); docs.unshift(rec); if(docs.length>120)DB.documents=docs.slice(0,120); saveData('document-'+rec.type); renderCenter(); return rec}
  function printRuntime(autoPrint){return '<script id="hp-print-runtime">(function(){var busy=false;function waitAssets(){var jobs=[];try{if(document.fonts&&document.fonts.ready)jobs.push(document.fonts.ready)}catch(e){}Array.prototype.forEach.call(document.images||[],function(img){if(typeof img.decode==="function"){jobs.push(img.decode().catch(function(){}));return}if(img.complete)return;var p=new Promise(function(resolve){img.addEventListener("load",resolve,{once:true});img.addEventListener("error",resolve,{once:true})});jobs.push(p)});return Promise.race([Promise.all(jobs),new Promise(function(resolve){setTimeout(resolve,3000)})])}window.hpPrintWhenReady=function(){if(busy)return;busy=true;waitAssets().catch(function(){}).then(function(){requestAnimationFrame(function(){requestAnimationFrame(function(){busy=false;try{window.focus();window.print()}catch(e){busy=false}})})})};'+(autoPrint?'if(document.readyState==="complete")setTimeout(window.hpPrintWhenReady,0);else window.addEventListener("load",function(){setTimeout(window.hpPrintWhenReady,0)},{once:true});':'')+'})();<\/script>'}
  function preparePrintHtml(html,autoPrint){
    html=String(html||'').replace(/onclick=(["'])window\.print\(\)\1/gi,'onclick="window.hpPrintWhenReady()"');
    if(html.indexOf('data-hp-print-repair')<0){
      var repair='<style data-hp-print-repair="57.8">'+printRepairCss()+'</style>';
      html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,repair+'</head>'):repair+html;
    }
    html=html.replace(/<script id="hp-print-runtime">[\s\S]*?<\/script>/i,'');
    var runtime=printRuntime(!!autoPrint);
    return /<\/body>/i.test(html)?html.replace(/<\/body>/i,runtime+'</body>'):html+runtime;
  }
  function openHtml(html,autoPrint){var w=window.open('','_blank'); if(!w){toast('المتصفح منع فتح المستند. اسمح بالـ Popups.'); return false} w.document.open(); w.document.write(preparePrintHtml(html,!!autoPrint)); w.document.close(); return true}
  function clientDoc(cid,type,explicitOrders){try{var orders=explicitOrders||selectedClientOrders(cid); if(!orders.length){toast('لا توجد أوردرات للعميل');return} var c=client(cid), no=nextNo(type), r=rowsClient(orders,type), title=typeTitle(type), dep=r.deps, head='<tr><th>كود الأوردر</th><th>اسم الصنف</th><th>النوع</th><th>المقاس</th><th>لون الشنطة</th>'+(type==='invoice'?'<th>لون الطباعة</th>':'')+'<th>لون اليد</th><th>عدد الألوان</th><th>وجه</th><th>الكمية</th><th>سعر الشنطة</th><th>القيمة</th></tr>'; var totals='<table class="totals"><tr><td>الإجمالي قبل الخصم</td><td>'+money(r.gross)+'</td></tr><tr><td>إجمالي الخصومات</td><td>'+money(r.disc)+'</td></tr><tr><td>الإجمالي بعد الخصم</td><td>'+money(r.net)+'</td></tr>'+(type==='invoice'?'<tr><td>العربون المسجل</td><td>'+money(dep)+'</td></tr><tr><td>الصافي المستحق</td><td>'+money(Math.max(0,r.net-dep))+'</td></tr>':'')+'</table>'; var extra=type==='quote'?'<div class="terms"><b>شروط عرض السعر:</b><br>برجاء مراجعة المقاسات والألوان والكميات جيدًا قبل التشغيل.<br>قد يحدث عجز أو زيادة تشغيلية في حدود 3%.<br>التشغيل يبدأ بعد اعتماد العرض ودفع العربون المتفق عليه.</div>':''; var html=docHtml(title,no,STATUS.draft,meta([['التاريخ',today()],['رقم المستند',no],['العميل',c.name],['الهاتف',c.phone||''],['العنوان',c.addr||''],['عدد الأوردرات',orders.length]]),head,r.body,totals,extra,makeDocTitle(type,c.name,no)); addRecord({id:'doc_'+Date.now()+'_'+Math.random().toString(36).slice(2),no:no,type:type,title:title,status:STATUS.draft,date:today(),createdAt:nowIso(),entityType:'client',entityId:cid,entityName:c.name||'',orders:orders.map(function(o){return o.id}),total:r.net,html:html,fileName:makeDocTitle(type,c.name,no)}); openHtml(html,false); toast('تم إنشاء '+title+' وحفظه في سجل المستندات') }catch(e){log('V54_CLIENT_DOC_ERROR',String(e&&e.message||e),type); toast('حدث خطأ أثناء إنشاء المستند')}}
  function allocateStatement(orders,payments){
    function chronological(a,b){
      return String(a.date||a.createdAt||'').localeCompare(String(b.date||b.createdAt||'')) ||
        String(a.createdAt||'').localeCompare(String(b.createdAt||'')) ||
        String(a.id||'').localeCompare(String(b.id||''));
    }
    function cents(value){return Math.round(n(value)*100)}
    var lines=orders.slice().sort(chronological).map(function(order){
      return {order:order,remaining:Math.max(0,cents(clientTotal(order))-cents(order.deposit)),allocations:[]};
    });
    var next=0;
    payments.slice().sort(chronological).forEach(function(payment){
      var available=cents(payment.amount);
      while(available>0 && next<lines.length){
        var line=lines[next];
        var applied=Math.min(available,line.remaining);
        if(applied) line.allocations.push({payment:payment,amount:applied/100});
        line.remaining-=applied;
        available-=applied;
        if(line.remaining===0) next++;
      }
    });
    return lines;
  }
  function clientStatement(cid,full){
    try{
      var c=client(cid);
      var orders=arr('orders').filter(function(o){return o.clientId===cid});
      var payments=arr('payments').filter(function(p){return p.clientId===cid});
      var ledger=allocateStatement(orders,payments);
      var visible=full?ledger:ledger.filter(function(line){return line.remaining>0});
      var no=nextNo('clientStatement');
      var body=visible.map(function(line){
        var o=line.order;
        return '<tr><td>'+esc(o.code||'')+'</td><td>'+esc(o.date||'')+'</td><td>'+esc(orderTitle(o))+'</td><td>'+count(billQty(o))+'</td><td>'+money(billQty(o)*n(o.price)+n(o.aklashe))+'</td><td>'+money(discount(o))+'</td><td>'+money(clientTotal(o))+'</td><td>'+money(o.deposit)+'</td><td>'+money(line.remaining/100)+'</td><td>'+esc(o.status||'')+'</td></tr>';
      }).join('')||'<tr><td colspan="10">لا توجد أوردرات مفتوحة في هذا الكشف</td></tr>';
      var head='<tr><th>كود</th><th>التاريخ</th><th>الصنف</th><th>الكمية</th><th>قبل الخصم</th><th>الخصم</th><th>بعد الخصم</th><th>العربون</th><th>باقي الأوردر</th><th>الحالة</th></tr>';
      var balance=clientBalance(cid);
      var totals='<table class="totals"><tr><td>إجمالي باقي الأوردرات المعروضة</td><td>'+money(visible.reduce(function(sum,line){return sum+line.remaining},0)/100)+'</td></tr><tr><td>رصيد حساب العميل</td><td>'+money(balance)+'</td></tr></table>';
      function paymentRow(payment,amount,code){
        return esc(payment.date||'')+' — '+money(amount)+' — '+esc(payment.note||'')+(code?' — '+esc(code):'');
      }
      var details=full?payments.map(function(payment){return paymentRow(payment,payment.amount,'')}):
        visible.flatMap(function(line){return line.allocations.map(function(allocation){
          return paymentRow(allocation.payment,allocation.amount,line.order.code);
        })});
      var extra=details.length?'<div class="terms"><b>'+(full?'كل الدفعات المسجلة:':'الدفعات المخصصة للأوردرات المفتوحة:')+'</b><br>'+details.join('<br>')+'</div>':'';
      var title=full?'كشف حساب عميل كامل':'كشف حساب عميل — الأوردرات المفتوحة';
      var fileName=makeDocTitle('clientStatement',c.name,no);
      var html=docHtml(title,no,STATUS.draft,meta([['التاريخ',today()],['رقم الكشف',no],['العميل',c.name],['الهاتف',c.phone||''],['عدد الأوردرات',visible.length]]),head,body,totals,extra,fileName);
      addRecord({id:'doc_'+Date.now()+'_'+Math.random().toString(36).slice(2),no:no,type:'clientStatement',title:title,status:STATUS.draft,date:today(),createdAt:nowIso(),entityType:'client',entityId:cid,entityName:c.name||'',orders:visible.map(function(line){return line.order.id}),total:balance,html:html,fileName:fileName});
      openHtml(html,false);
      toast('تم إنشاء كشف الحساب وحفظه');
    }catch(e){
      log('V54_CLIENT_STATEMENT_ERROR',String(e&&e.message||e),'clientStatement');
      toast('حدث خطأ في كشف الحساب');
    }
  }
  function factoryStatement(fid){try{var orders=selectedFactoryOrders(fid); if(!orders.length){toast('لا توجد أوردرات للمصنع');return} var f=factory(fid), no=nextNo('factoryStatement'), r=rowsFactory(orders), ts=arr('transfers').filter(function(t){return t.factoryId===fid}), paid=ts.reduce(function(s,t){return s+n(t.amount)},0); var head='<tr><th>كود</th><th>عميل</th><th>الصنف</th><th>النوع</th><th>المقاس</th><th>لون الشنطة</th><th>لون اليد</th><th>الكمية</th><th>سعر المصنع</th><th>القيمة</th></tr>'; var totals='<table class="totals"><tr><td>إجمالي تكلفة الأوردرات</td><td>'+money(r.total)+'</td></tr><tr><td>تحويلات مسجلة</td><td>'+money(paid)+'</td></tr><tr><td>رصيد المصنع الحالي</td><td>'+money(factoryBalance(fid))+'</td></tr></table>'; var html=docHtml(typeTitle('factoryStatement'),no,STATUS.draft,meta([['التاريخ',today()],['رقم الكشف',no],['المصنع',f.name],['الهاتف',f.phone||''],['الرصيد الحالي',money(factoryBalance(fid))],['عدد الأوردرات',orders.length]]),head,r.body,totals,'',makeDocTitle('factoryStatement',f.name,no)); addRecord({id:'doc_'+Date.now()+'_'+Math.random().toString(36).slice(2),no:no,type:'factoryStatement',title:typeTitle('factoryStatement'),status:STATUS.draft,date:today(),createdAt:nowIso(),entityType:'factory',entityId:fid,entityName:f.name||'',orders:orders.map(function(o){return o.id}),total:r.total-paid,html:html,fileName:makeDocTitle('factoryStatement',f.name,no)}); openHtml(html,false); toast('تم إنشاء كشف المصنع وحفظه') }catch(e){log('V54_FACTORY_STATEMENT_ERROR',String(e&&e.message||e),'factoryStatement'); toast('حدث خطأ في كشف المصنع')}}
  function sanitizeStoredHtml(html,rec){
    html=String(html||'');
    var title=cleanFileName((rec&&rec.fileName)||makeDocTitle(rec&&rec.type,rec&&rec.entityName,rec&&rec.no));
    if(!html)return '';
    html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+esc(title)+'</title>');
    html=html.replace(/\s*<span class="doc-chip">[\s\S]*?<\/span>/gi,'');
    html=html.replace(/<div class="note">تم إصدار الفاتورة[\s\S]*?<\/div>/gi,'');
    html=html.replace(/<div class="note">كشف المصنع[\s\S]*?<\/div>/gi,'');
    html=html.replace(/<div class="sign">[\s\S]*?<\/div>\s*<\/div>\s*<div class="foot">[\s\S]*?<\/div>/i,'</div>');
    html=html.replace(/<div class="sign">[\s\S]*?<\/div>/gi,'');
    html=html.replace(/<div class="foot">[\s\S]*?<\/div>/gi,'');
    html=html.replace(/\.doc-chip\{[^}]*\}/g,'.doc-chip{display:none!important}');
    return html;
  }
  function openRecord(id,autoPrint){
    try{
      var d=ensureStore().find(function(x){return x.id===id});
      if(!d){toast('المستند غير موجود في السجل');return false}
      var html=sanitizeStoredHtml(d.html,d);
      if(!html){toast('المستند قديم ولا يحتوي نسخة محفوظة');return false}
      return openHtml(html,!!autoPrint);
    }catch(e){log('V54_OPEN_RECORD_ERROR',String(e&&e.message||e),'openRecord');toast('حدث خطأ أثناء فتح المستند');return false}
  }
  function docs(){return ensureStore().slice().sort(function(a,b){return String(b.createdAt||b.date||'').localeCompare(String(a.createdAt||a.date||''))})}
  function statusClass(s){s=String(s||''); if(s===STATUS.paid)return 'ok'; if(s===STATUS.sent)return 'blue'; if(s===STATUS.cancelled)return 'bad'; return 'draft'}
  function setStatus(id,st){var d=ensureStore().find(function(x){return x.id===id}); if(!d)return; d.status=st||STATUS.draft; d.statusAt=nowIso(); saveData('document-status'); renderCenter(); toast('تم تحديث حالة المستند')}
  function ensureRoot(){
    var page=byId('pg-reports');
    if(!page)return null;
    var root=byId(ROOT_ID);
    if(!root){
      root=document.createElement('div');
      root.id=ROOT_ID;
      root.className='hp-v54-docs-pro';
      var after=byId('hp-v53-finance-fixed')||byId('hp-v52-reports-pro')||byId('hp-v53-2-audit')||null;
      if(after&&after.parentNode===page&&after.nextSibling)page.insertBefore(root,after.nextSibling);
      else if(after&&after.parentNode===page)page.appendChild(root);
      else page.appendChild(root);
    }
    return root;
  }
    function bindEvents(){if(window.__HP_V542_DOC_EVENTS)return;window.__HP_V542_DOC_EVENTS=true;document.addEventListener('click',function(ev){var b=ev.target&&ev.target.closest?ev.target.closest('[data-hp-v54-action],[data-hp-v54-tool]'):null;if(!b)return;try{ev.preventDefault();ev.stopPropagation()}catch(e){}var tool=b.getAttribute('data-hp-v54-tool');if(tool){if(tool==='exportCsv')return exportCsv();if(tool==='exportJson')return exportJson();if(tool==='refresh')return renderCenter()}var act=b.getAttribute('data-hp-v54-action'), id=b.getAttribute('data-hp-v54-id')||'';if(act==='open')return openRecord(id,false);if(act==='print')return openRecord(id,true)},true);document.addEventListener('change',function(ev){var s=ev.target;if(!s||!s.matches||!s.matches('[data-hp-v54-status]'))return;try{ev.preventDefault()}catch(e){}setStatus(s.getAttribute('data-hp-v54-status')||'',s.value)},true)}
  function renderCenter(){try{var root=ensureRoot(); if(!root)return; bindEvents(); var ds=docs(); var stats={draft:0,sent:0,paid:0,cancelled:0}; ds.forEach(function(d){Object.keys(stats).forEach(function(k){if(String(d.status||STATUS.draft).toLowerCase()===k)stats[k]++})}); var rows=ds.slice(0,12).map(function(d){var select='<select data-hp-v54-status="'+data(d.id)+'"><option '+(d.status===STATUS.draft?'selected':'')+'>Draft</option><option '+(d.status===STATUS.sent?'selected':'')+'>Sent</option><option '+(d.status===STATUS.paid?'selected':'')+'>Paid</option><option '+(d.status===STATUS.cancelled?'selected':'')+'>Cancelled</option></select>';return '<div class="hp-v54-doc-row"><div><b>'+esc(d.no)+'</b><span>'+esc(d.title||typeTitle(d.type))+' · '+esc(d.entityName||'')+' · '+esc(d.date||'')+'</span></div><span class="hp-v54-status '+statusClass(d.status)+'">'+esc(d.status||STATUS.draft)+'</span><div class="hp-v54-actions">'+docBtn('open',d.id,'فتح','blue')+docBtn('print',d.id,'طباعة','')+select+'</div></div>'}).join('') || '<div class="muted" style="font-weight:900">لسه مفيش مستندات محفوظة. افتح عميل وحدد أوردرات واعمل عرض سعر أو فاتورة.</div>'; root.innerHTML='<div class="hp-v54-head"><div><div class="sec-label">Documents Pro V54.2</div><h2>أرشيف المستندات وإعادة الطباعة</h2><p>أرقام ثابتة، حفظ Snapshot للمستند، حالة Draft/Sent/Paid/Cancelled، وإعادة فتح نفس المستند بعد كده.</p></div><div class="hp-v54-tools">'+toolBtn('exportCsv','CSV سجل المستندات','blue')+toolBtn('exportJson','JSON Backup','')+toolBtn('refresh','تحديث','green')+'</div></div><div class="hp-v54-stats"><div><b>'+count(ds.length)+'</b><span>إجمالي المستندات</span></div><div><b>'+count(stats.draft)+'</b><span>Draft</span></div><div><b>'+count(stats.sent)+'</b><span>Sent</span></div><div><b>'+count(stats.paid)+'</b><span>Paid</span></div><div><b>'+count(stats.cancelled)+'</b><span>Cancelled</span></div></div><div class="hp-v54-doc-list">'+rows+'</div>'; }catch(e){log('V54_RENDER_ERROR',String(e&&e.message||e),'renderCenter')}}
    function exportCsv(){var rows=[['No','Type','Status','Date','Entity','Total','Orders']].concat(docs().map(function(d){return [d.no,d.title||d.type,d.status,d.date,d.entityName,d.total,(d.orders||[]).length]})); download('haydar-pack-v54-documents.csv',rows.map(function(r){return r.map(csvCell).join(',')}).join('\n'),'text/csv;charset=utf-8')}
  function exportJson(){download('haydar-pack-v54-documents.json',JSON.stringify({exportedAt:nowIso(),documents:docs()},null,2),'application/json;charset=utf-8')}
  function injectStyle(){if(byId('hp-v54-style'))return; var st=document.createElement('style'); st.id='hp-v54-style'; st.textContent='.hp-v54-docs-pro{margin:18px 0;padding:18px;border:1px solid #dbe3ee;border-radius:18px;background:#fff;box-shadow:0 1px 0 rgba(0,0,0,.04)}.hp-v54-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.hp-v54-head h2{margin:3px 0;font-size:24px}.hp-v54-head p{margin:0;color:#5b6b83;font-weight:900}.hp-v54-tools{display:flex;gap:8px;flex-wrap:wrap}.hp-v54-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:12px 0}.hp-v54-stats div{border:1px solid #e0e7f0;border-radius:14px;padding:10px;background:#f8fafc}.hp-v54-stats b{display:block;font-size:24px}.hp-v54-stats span{font-weight:900;color:#667085}.hp-v54-doc-row{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;border:1px solid #e6edf5;border-radius:14px;padding:10px;margin-bottom:8px}.hp-v54-doc-row b{font-size:16px}.hp-v54-doc-row span{display:block;color:#5b6b83;font-weight:900}.hp-v54-status{border:2px solid #111;border-radius:999px;padding:5px 10px;font-weight:900;color:#000!important}.hp-v54-status.ok{background:#d9fbe8}.hp-v54-status.blue{background:#dbeafe}.hp-v54-status.bad{background:#ffe0e0}.hp-v54-status.draft{background:#fff2c2}.hp-v54-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.hp-v54-actions select{border:2px solid #000;border-radius:10px;font-weight:900;padding:7px;background:#fff}@media(max-width:720px){.hp-v54-head{display:block}.hp-v54-tools{margin-top:10px}.hp-v54-stats{grid-template-columns:1fr 1fr}.hp-v54-doc-row{grid-template-columns:1fr}.hp-v54-actions .btn,.hp-v54-actions select{width:100%;min-height:42px}}'; document.head.appendChild(st)}
  function wrapReports(){var old=window.renderReports; if(typeof old==='function'&&!old.__hpV54Docs){var w=function(){var r=old.apply(this,arguments); setTimeout(renderCenter,60); return r}; w.__hpV54Docs=true; w.__hpOriginal=old; window.renderReports=w}}
  function boot(){if(booted)return;booted=true;try{ensureStore();injectStyle();wrapReports();setTimeout(renderCenter,400);setTimeout(renderCenter,1200); console.log('Haydar Pack V55.3 Documents Stable Repair loaded',VERSION)}catch(e){log('V54_BOOT_ERROR',String(e&&e.message||e),'boot')}}
  window.printSelectedClientQuote=function(cid){clientDoc(cid,'quote')};
  window.printOrderInvoice=function(id){
    var order=arr('orders').find(function(entry){return entry.id===id});
    if(order) clientDoc(order.clientId,'invoice',[order]);
  };
  window.printSelectedClientInvoice=function(cid){clientDoc(cid,'invoice')};
  window.printSelectedClientStatement=function(cid,full){clientStatement(cid,full===true)};
  window.printSelectedFactoryStatement=function(fid){factoryStatement(fid)};
  window.HP_V54_DOCS={version:VERSION,siteVersion:SITE_VERSION,refresh:renderCenter,open:function(id){openRecord(id,false)},print:function(id){openRecord(id,true)},status:setStatus,exportCsv:exportCsv,exportJson:exportJson,createClientQuote:function(cid){clientDoc(cid,'quote')},createClientInvoice:function(cid){clientDoc(cid,'invoice')},createClientStatement:clientStatement,createFactoryStatement:factoryStatement,docs:docs};
  document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,700)}); window.addEventListener('load',function(){setTimeout(boot,500)}); setTimeout(boot,1500);
})();


/* ===== V55 QUALITY GATE + SAFE CORE (NO NEW JS FILE) =====
   Built on V54.2 Lite Repair. This module is intentionally appended to the consolidated
   post-V49 file to avoid increasing JavaScript file count. */
(function(){
  'use strict';
  var VERSION='2026.08.07-production-fix.5';
  var SITE_VERSION='production_20260807_fix7';
  var CARD_ID='hp-v55-quality-gate';
  var STYLE_ID='hp-v55-quality-style';
  function $(id){return document.getElementById(id)}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function now(){try{return new Date().toLocaleString('ar-EG')}catch(e){return new Date().toISOString()}}
  function has(name){try{return !!window[name]}catch(e){return false}}
  function getBackend(){try{return String(HPPreviewStorage.getItem('haydar_pack_apps_script_url')||HPPreviewStorage.getItem('HP_BACKEND_URL')||window.HP_APPS_SCRIPT_URL||'')}catch(e){return String(window.HP_APPS_SCRIPT_URL||'')}}
  function errors(){try{var keys=['hayder_pack_error_log_v49','hp_error_log_v48','hp_error_log'];for(var i=0;i<keys.length;i++){var raw=HPPreviewStorage.getItem(keys[i]);if(raw){var arr=JSON.parse(raw)||[];if(Array.isArray(arr))return arr}}return []}catch(e){return []}}
  function dbCount(k){try{return (window.DB&&Array.isArray(window.DB[k]))?window.DB[k].length:0}catch(e){return 0}}
  function modRows(){
    return [
      ['V49.1 Save Protection', has('HP_V501_SAVE_GUARD')||has('HP_V49_1_SAVE_GUARD')],
      ['V50 Backup Center Pro', has('HP_V50_BACKUP_PRO')],
      ['V51 Mobile Back Guard بدون زر عائم', (has('HP_V51_MOBILE_UX')||has('HP_V52_MOBILE_UX')) && !document.querySelector('#hp-mobile-fab,#hp-v51-fab,.hp-mobile-fab,.hp-v51-fab,.quick-action-fab')],
      ['V52 Reports Pro', has('HP_V52_REPORTS_PRO')],
      ['V53 Finance Insights Repair', has('HP_V53_FINANCE')],
      ['V54 Documents Pro', has('HP_V54_DOCS')],
      ['Apps Script URL editable', has('HP_V53_3_FINAL') && typeof window.HP_V53_3_FINAL.saveBackendUrl==='function'],
      ['V56 Capital & Wallet', has('HP_V56_CAPITAL_WALLET')],
      ['Post-V49 modules consolidated', true]
    ];
  }
  function criticalErrors(){
    var err=errors();
    var nowMs=Date.now();
    var critical=err.filter(function(x){var s=String((x&&x.message)||x||'')+' '+String((x&&x.type)||'');return /Unexpected end of input|rows\.join is not a function|ensureRoot is not defined|V54_RENDER_ERROR/i.test(s)});
    var recent=critical.filter(function(x){
      var t=Date.parse((x&&x.time)||(x&&x.ts)||(x&&x.date)||'');
      return isFinite(t) && nowMs-t<30*60*1000;
    });
    return {total:critical.length,recent:recent.length};
  }
  function scan(){
    var rows=modRows();
    var ce=criticalErrors();
    var domChecks=[
      ['مفيش زر عائم', !document.querySelector('#hp-mobile-fab,#hp-v51-fab,.hp-mobile-fab,.hp-v51-fab,.quick-action-fab')],
      ['V53 فوق V52 عند التقارير', (function(){var v53=document.getElementById('hp-v53-finance-insights'),v52=document.getElementById('hp-v52-reports-pro');return !v53||!v52||!!(v53.compareDocumentPosition(v52)&Node.DOCUMENT_POSITION_FOLLOWING)})()],
      ['Documents Pro جاهز', has('HP_V54_DOCS')&&typeof window.HP_V54_DOCS.refresh==='function'],
      ['Back Guard جاهز', (has('HP_V51_MOBILE_UX')||has('HP_V52_MOBILE_UX'))]
    ];
    rows=rows.concat(domChecks);
    var ok=rows.every(function(r){return !!r[1]}) && ce.recent===0;
    return {
      ok:ok, rows:rows, criticalErrors:ce, oldErrors:ce.total, backend:getBackend(), time:now(),
      counts:{clients:dbCount('clients'), factories:dbCount('factories'), orders:dbCount('orders'), payments:dbCount('payments'), documents:dbCount('documents')}
    };
  }
  function injectStyle(){
    if($(STYLE_ID))return;
    var st=document.createElement('style');st.id=STYLE_ID;
    st.textContent='#'+CARD_ID+'{border:4px solid #000;border-radius:18px;padding:14px;margin:14px 0;background:#fff;box-shadow:0 4px 0 #000;direction:rtl}#'+CARD_ID+'.ok{background:#eafff0}#'+CARD_ID+'.bad{background:#fff3e6}#'+CARD_ID+' h3{margin:0 0 8px;font-size:24px}#'+CARD_ID+' .hp-v55-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin:10px 0}#'+CARD_ID+' .hp-v55-pill{border:2px solid #000;border-radius:999px;padding:8px 10px;font-weight:900;background:#fff}#'+CARD_ID+' .hp-v55-pill.ok{background:#d9ffe2}#'+CARD_ID+' .hp-v55-pill.bad{background:#ffe0da}#'+CARD_ID+' .hp-v55-meta{font-weight:900;color:#334155;font-size:14px;line-height:1.8;word-break:break-word}#'+CARD_ID+' .btn-row{margin-top:10px}';
    document.head.appendChild(st);
  }
  function html(){
    var s=scan();
    var rowHtml=s.rows.map(function(r){return '<span class="hp-v55-pill '+(r[1]?'ok':'bad')+'">'+(r[1]?'✓ ':'! ')+esc(r[0])+'</span>'}).join('');
    var c=s.counts;
    return '<h3>V57.8 Print Reliability Gate — فحص رأس المال والسيولة</h3>'+
      '<div class="hp-v55-meta">الحالة بعد الاختبار: <b>'+(s.ok?'سليمة':'تحتاج مراجعة')+'</b> · آخر فحص: '+esc(s.time)+'</div>'+
      '<div class="hp-v55-grid">'+rowHtml+'</div>'+
      '<div class="hp-v55-meta">الداتا: عملاء '+c.clients+' | مصانع '+c.factories+' | أوردرات '+c.orders+' | دفعات '+c.payments+' | مستندات '+c.documents+'</div>'+
      '<div class="hp-v55-meta">أخطاء حرجة محفوظة بالسجل: '+s.criticalErrors.total+' | حديثة بعد الإصلاح: '+s.criticalErrors.recent+'</div>'+
      '<div class="hp-v55-meta" dir="ltr">Apps Script: '+esc(s.backend||'غير محدد')+'</div>'+
      '<div class="btn-row"><button class="btn green" type="button" data-hp-v55="scan">إعادة الفحص</button><button class="btn blue" type="button" data-hp-v55="download">تنزيل تقرير V57.8</button></div>';
  }
  function place(){
    try{
      injectStyle();
      var target=document.querySelector('#dr-sync .drawer')||document.querySelector('#dr-settings .drawer')||document.body;
      if(!target)return;
      var card=$(CARD_ID); if(!card){card=document.createElement('div');card.id=CARD_ID;var anchor=target.querySelector('#hp-v533-backend-panel')||target.querySelector('#hp-v50-backup-pro')||target.querySelector('.cloud-status-grid'); if(anchor)anchor.insertAdjacentElement('afterend',card); else target.appendChild(card)}
      var s=scan(); card.className=s.ok?'ok':'bad'; card.innerHTML=html();
    }catch(e){try{console.error('V57 Stable Production Gate render failed',e)}catch(_){}}
  }
  function download(){
    var s=scan();
    var txt='Haydar Pack V57.8 Print Reliability Gate Report\nTime: '+s.time+'\nStatus: '+(s.ok?'OK':'Needs review')+'\nBackend: '+s.backend+'\nCounts: '+JSON.stringify(s.counts)+'\nOld critical errors: '+s.oldErrors+'\n\nModules:\n'+s.rows.map(function(r){return (r[1]?'OK  ':'MISS')+' - '+r[0]}).join('\n');
    try{var blob=new Blob([txt],{type:'text/plain;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='haydar_pack_v56_regression_report.txt';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){alert(txt)}
  }
  function bind(){if(window.__HP_V55_QG_EVENTS)return;window.__HP_V55_QG_EVENTS=true;document.addEventListener('click',function(ev){var b=ev.target&&ev.target.closest?ev.target.closest('[data-hp-v55]'):null;if(!b)return;try{ev.preventDefault();ev.stopPropagation()}catch(e){}var a=b.getAttribute('data-hp-v55');if(a==='scan')place();if(a==='download')download();},true)}
  function wrapShowPage(){var old=window.showPage;if(typeof old!=='function'||old.__hpV55QG)return;var w=function(){var r=old.apply(this,arguments);setTimeout(place,120);setTimeout(function(){try{if(window.HP_V53_FINANCE&&typeof HP_V53_FINANCE.refresh==='function')HP_V53_FINANCE.refresh(); if(window.HP_V54_DOCS&&typeof HP_V54_DOCS.refresh==='function')HP_V54_DOCS.refresh()}catch(e){}},250);return r};w.__hpV55QG=true;w.__hpOriginal=old;window.showPage=w}
  function boot(){try{bind();wrapShowPage();place();setTimeout(place,800);setInterval(function(){if((window.activePage||'')==='sync'||document.querySelector('#dr-sync.open,#dr-sync .drawer'))place()},2500);console.log('Haydar Pack V57.8 Print Reliability Gate loaded',VERSION)}catch(e){try{console.error(e)}catch(_){}}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,300)});else setTimeout(boot,300);
  window.HP_V55_QUALITY_GATE={version:VERSION,siteVersion:SITE_VERSION,scan:scan,render:place,download:download};
})();

/* ===== V56 CAPITAL & WALLET INTELLIGENCE DASHBOARD =====
   Adds a separate page for capital/liquidity decisions without touching old reports.
   Business profit definition: client order value - factory order cost.
   House expenses affect liquidity and monthly net after house expenses, not the base order profit. */
(function(){
  'use strict';
  var VERSION='2026.08.07-production-fix.5';
  var SITE_VERSION='production_20260807_fix7';
  var PAGE='capital';
  var PAGE_ID='pg-capital';
  var NAV_ID='hp-v56-nav';
  var STYLE_ID='hp-v56-style';
  var EXPORT_NAME='haydar-pack-v56-capital-intelligence.csv';
  function byId(id){return document.getElementById(id)}
  function q(sel,root){return (root||document).querySelector(sel)}
  function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function attr(v){return esc(v).replace(/\n/g,' ')}
  function n(v){var x=parseFloat(String(v==null?'':v).replace(/,/g,''));return isNaN(x)?0:x}
  function money(v){try{return n(v).toLocaleString('ar-EG',{maximumFractionDigits:2})+' ج'}catch(e){return String(n(v))+' ج'}}
  function pct(v){v=n(v);return (isFinite(v)?Math.max(0,Math.min(999,v)):0).toLocaleString('ar-EG',{maximumFractionDigits:1})+'%'}
  function today(){try{return new Date().toISOString().slice(0,10)}catch(e){return ''}}
  function monthStart(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01'}
  function monthEnd(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(new Date(d.getFullYear(),d.getMonth()+1,0).getDate()).padStart(2,'0')}
  function uid(){try{if(typeof window.uid==='function')return window.uid()}catch(e){} return 'v56_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
  function toast(msg){try{if(typeof window.toast==='function')window.toast(msg);else console.log(msg)}catch(e){}}
  function log(type,msg,extra){try{if(window.HP_V50_STABILITY&&HP_V50_STABILITY.log)HP_V50_STABILITY.log(type,msg,extra||'V56')}catch(e){}}
  function arr(k){return (window.DB&&Array.isArray(DB[k]))?DB[k]:[]}
  function saveData(reason){
    try{if(typeof window.save==='function')window.save(false);else HPPreviewStorage.setItem('hayder_bags_app',JSON.stringify(window.DB||{}))}catch(e){log('V56_SAVE_ERROR',String(e&&e.message||e),reason)}
    try{if(window.HP_V37_SYNC&&typeof HP_V37_SYNC.markPending==='function')HP_V37_SYNC.markPending('v56-'+(reason||'save'))}catch(e){}
    setTimeout(function(){try{if(window.HP_V501_SAVE_GUARD&&typeof HP_V501_SAVE_GUARD.confirm==='function')HP_V501_SAVE_GUARD.confirm('v56-'+(reason||'save'),false);else if(window.HP_V37_SYNC&&typeof HP_V37_SYNC.push==='function')HP_V37_SYNC.push(false)}catch(e){}},250);
  }
  function ensureData(){
    if(!window.DB)window.DB={};
    if(!Array.isArray(DB.houseExpenses))DB.houseExpenses=[];
    if(!Array.isArray(DB.walletAdjustments))DB.walletAdjustments=[];
    DB.settings=DB.settings||{};
    DB.settings.v56Wallet=DB.settings.v56Wallet||{};
    var s=DB.settings.v56Wallet;
    if(s.openingLiquidity==null)s.openingLiquidity=0;
    if(!s.openingDate)s.openingDate=monthStart();
    if(!s.reportFrom)s.reportFrom=monthStart();
    if(!s.reportTo)s.reportTo=monthEnd();
    return s;
  }
  function dateOf(v){v=String(v||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:''}
  function inRange(date,from,to){date=dateOf(date); if(!date)return false; if(from&&date<from)return false; if(to&&date>to)return false; return true}
  function daysAgo(date){date=dateOf(date); if(!date)return null; var a=new Date(date+'T00:00:00'), b=new Date(today()+'T00:00:00'); var d=Math.round((b-a)/(24*3600*1000)); return isFinite(d)?Math.max(0,d):null}
  function daysBetween(a,b){a=dateOf(a);b=dateOf(b); if(!a||!b)return null; var x=new Date(a+'T00:00:00'),y=new Date(b+'T00:00:00'); var d=Math.round((y-x)/(24*3600*1000)); return isFinite(d)?Math.abs(d):null}
  function clientName(id){var c=arr('clients').find(function(x){return x.id===id});return c?(c.name||'بدون اسم'):'عميل غير موجود'}
  function factoryName(id){var f=arr('factories').find(function(x){return x.id===id});return f?(f.name||'بدون اسم'):'مصنع غير موجود'}
  function orderClientTotal(o){try{if(typeof window.clientTotalForOrder==='function')return n(window.clientTotalForOrder(o))}catch(e){} var qty=(n(o&&o.fQty)||n(o&&o.qty));return Math.max(0,qty*n(o&&o.price)+n(o&&o.aklashe)-n(o&&o.discount)-n(o&&o.invoiceDiscount))}
  function orderFactoryTotal(o){try{if(typeof window.factoryTotalForOrder==='function')return n(window.factoryTotalForOrder(o))}catch(e){} var qty=(n(o&&o.fQty)||n(o&&o.qty));return Math.max(0,qty*n(o&&o.fPrice)+n(o&&o.fAk))}
  function orderProfit(o){return orderClientTotal(o)-orderFactoryTotal(o)}
  function clientBalance(id){try{if(typeof window.clientBalance==='function')return n(window.clientBalance(id))}catch(e){} var c=arr('clients').find(function(x){return x.id===id})||{}; var os=arr('orders').filter(function(o){return o.clientId===id}); var ps=arr('payments').filter(function(p){return p.clientId===id}); return os.reduce(function(s,o){return s+orderClientTotal(o)-n(o.deposit)},n(c.debt))-ps.reduce(function(s,p){return s+n(p.amount)},0)}
  function factoryBalance(id){try{if(typeof window.factoryBalance==='function')return n(window.factoryBalance(id))}catch(e){} var f=arr('factories').find(function(x){return x.id===id})||{}; var os=arr('orders').filter(function(o){return o.factoryId===id}); var ts=arr('transfers').filter(function(t){return t.factoryId===id}); return os.reduce(function(s,o){return s+orderFactoryTotal(o)},n(f.debt))-ts.reduce(function(s,t){return s+n(t.amount)},0)}
  function paymentEventsForClient(cid){
    var events=[];
    arr('orders').filter(function(o){return o.clientId===cid&&n(o.deposit)>0}).forEach(function(o){events.push({date:dateOf(o.date)||today(),amount:n(o.deposit),type:'عربون أوردر',ref:o.code||''})});
    arr('payments').filter(function(p){return p.clientId===cid}).forEach(function(p){events.push({date:dateOf(p.date)||today(),amount:n(p.amount),type:'دفعة',ref:p.note||''})});
    return events.sort(function(a,b){return String(a.date).localeCompare(String(b.date))});
  }
  function averageGap(events){if(!events||events.length<2)return null; var gaps=[]; for(var i=1;i<events.length;i++){var d=daysBetween(events[i-1].date,events[i].date); if(d!=null)gaps.push(d)} return gaps.length?gaps.reduce(function(s,x){return s+x},0)/gaps.length:null}
  function getPeriod(){var s=ensureData();return {from:dateOf(s.reportFrom)||monthStart(),to:dateOf(s.reportTo)||today()}}
  function calcAll(){
    var s=ensureData(), p=getPeriod(), allOrders=arr('orders'), periodOrders=allOrders.filter(function(o){return inRange(o.date,p.from,p.to)});
    var orderSales=periodOrders.reduce(function(x,o){return x+orderClientTotal(o)},0);
    var orderCosts=periodOrders.reduce(function(x,o){return x+orderFactoryTotal(o)},0);
    var orderProfitSum=orderSales-orderCosts;
    var businessExpenses=arr('expenses').filter(function(e){return inRange(e.date,p.from,p.to)}).reduce(function(x,e){return x+n(e.amount)},0);
    var housePeriod=arr('houseExpenses').filter(function(e){return inRange(e.date,p.from,p.to)}).reduce(function(x,e){return x+n(e.amount)},0);
    var profitAfterBusiness=orderProfitSum-businessExpenses;
    /* V57: user-defined profit is order sales minus factory order cost.
       Home expenses are shown separately as profit after home expenses only. */
    var profitAfterHouse=orderProfitSum-housePeriod;
    var flowFrom=dateOf(s.openingDate)||'';
    var flowTo=today();
    function flowIn(d){return inRange(d,flowFrom,flowTo)}
    var deposits=allOrders.filter(function(o){return n(o.deposit)>0&&flowIn(o.date)}).reduce(function(x,o){return x+n(o.deposit)},0);
    var payments=arr('payments').filter(function(x){return flowIn(x.date)}).reduce(function(x,p){return x+n(p.amount)},0);
    var customerReceipts=deposits+payments;
    var factoryPaid=arr('transfers').filter(function(t){return flowIn(t.date)}).reduce(function(x,t){return x+n(t.amount)},0);
    var businessPaid=arr('expenses').filter(function(e){return flowIn(e.date)}).reduce(function(x,e){return x+n(e.amount)},0);
    var housePaid=arr('houseExpenses').filter(function(e){return flowIn(e.date)}).reduce(function(x,e){return x+n(e.amount)},0);
    var adjustments=arr('walletAdjustments').filter(function(a){return flowIn(a.date)}).reduce(function(x,a){return x+(a.type==='out'?-n(a.amount):n(a.amount))},0);
    var capitalEffect=arr('capitalMoves').filter(function(m){return flowIn(m.date)}).reduce(function(x,m){var type=String(m.type||''); var val=n(m.amount); if(type==='owner_add'||type==='loan_in'||type==='lend_repay')return x+val; if(type==='owner_withdraw'||type==='loan_repay'||type==='lend_out')return x-val; return x},0);
    var liquidity=n(s.openingLiquidity)+customerReceipts+adjustments+capitalEffect-factoryPaid-businessPaid-housePaid;
    var receivables=arr('clients').reduce(function(x,c){return x+Math.max(0,clientBalance(c.id))},0);
    var factoryDue=arr('factories').reduce(function(x,f){return x+Math.max(0,factoryBalance(f.id))},0);
    var totalAllSales=allOrders.reduce(function(x,o){return x+orderClientTotal(o)},0);
    var totalAllCosts=allOrders.reduce(function(x,o){return x+orderFactoryTotal(o)},0);
    return {settings:s,period:p,orderSales:orderSales,orderCosts:orderCosts,orderProfit:orderProfitSum,businessExpenses:businessExpenses,houseExpenses:housePeriod,profitAfterBusiness:profitAfterBusiness,profitAfterHouse:profitAfterHouse,customerReceipts:customerReceipts,factoryPaid:factoryPaid,businessPaid:businessPaid,housePaid:housePaid,adjustments:adjustments,capitalEffect:capitalEffect,liquidity:liquidity,receivables:receivables,factoryDue:factoryDue,capitalPosition:receivables-factoryDue+liquidity,totalAllSales:totalAllSales,totalAllCosts:totalAllCosts,totalAllProfit:totalAllSales-totalAllCosts};
  }
  function clientRows(){
    return arr('clients').map(function(c){
      var os=arr('orders').filter(function(o){return o.clientId===c.id});
      var sales=os.reduce(function(s,o){return s+orderClientTotal(o)},0)+n(c.debt);
      var profit=os.reduce(function(s,o){return s+orderProfit(o)},0);
      var ev=paymentEventsForClient(c.id);
      var paid=ev.reduce(function(s,e){return s+n(e.amount)},0);
      var balance=clientBalance(c.id);
      var avgPay=ev.length?paid/ev.length:0;
      var last=ev.length?ev[ev.length-1].date:'';
      var ago=daysAgo(last);
      var ratio=sales>0?paid/sales*100:0;
      var gap=averageGap(ev);
      var liquidityImpact=Math.max(0,balance)-Math.max(0,profit);
      var score=0;
      if(balance>0)score+=Math.min(40,balance/1000);
      if(ago==null)score+=balance>0?25:0; else score+=Math.min(25,ago*1.2);
      if(ratio<50&&sales>0)score+=20; else if(ratio<75&&sales>0)score+=10;
      if(liquidityImpact>0)score+=Math.min(15,liquidityImpact/1000);
      score=Math.round(Math.min(100,score));
      var rec=score>=70?'لا تبدأ أوردر جديد قبل تحصيل دفعة':score>=45?'تابعه خلال أيام واطلب دفعة':balance>0?'متابعة عادية':sales>0?'عميل جيد في السداد':'لا توجد بيانات كافية';
      return {id:c.id,name:c.name||'بدون اسم',sales:sales,paid:paid,balance:balance,profit:profit,events:ev.length,avgPay:avgPay,last:last,ago:ago,ratio:ratio,gap:gap,liquidityImpact:liquidityImpact,score:score,rec:rec,orders:os.length};
    }).sort(function(a,b){return (b.score*100000+b.balance)-(a.score*100000+a.balance)});
  }
  function factoryRows(){
    return arr('factories').map(function(f){
      var os=arr('orders').filter(function(o){return o.factoryId===f.id});
      var cost=os.reduce(function(s,o){return s+orderFactoryTotal(o)},0)+n(f.debt);
      var tr=arr('transfers').filter(function(t){return t.factoryId===f.id}).sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''))});
      var paid=tr.reduce(function(s,t){return s+n(t.amount)},0);
      var due=cost-paid;
      var last=tr.length?tr[tr.length-1].date:'';
      return {id:f.id,name:f.name||'بدون اسم',cost:cost,paid:paid,due:due,last:last,orders:os.length};
    }).sort(function(a,b){return b.due-a.due});
  }
  function actionItems(c,clients,factories){
    var out=[];
    var high=clients.filter(function(x){return x.balance>0}).slice(0,5);
    high.forEach(function(x){out.push('تابع '+x.name+' — عليه '+money(x.balance)+'، '+(x.ago==null?'ولا توجد دفعة حديثة واضحة':'آخر دفعة منذ '+x.ago+' يوم')+'. '+x.rec+'.')});
    if(c.houseExpenses>0)out.push('مصروفات البيت في الفترة '+money(c.houseExpenses)+'؛ ربحك بعد مصروفات البيت أصبح '+money(c.profitAfterHouse)+'.');
    if(c.liquidity<0)out.push('السيولة الفعلية سالبة: '+money(c.liquidity)+' — راجع التحصيل قبل أي التزام جديد.');
    else if(c.liquidity<c.factoryDue*0.15&&c.factoryDue>0)out.push('السيولة قليلة مقارنة بالتزامات المصانع؛ الأولوية للتحصيل من العملاء الأعلى مديونية.');
    var f=factories.find(function(x){return x.due>0}); if(f)out.push('راجع تسوية مصنع '+f.name+' لأن المتبقي عليه '+money(f.due)+' على مستوى المصنع إجمالاً.');
    if(!out.length)out.push('الوضع مستقر حاليًا: لا توجد تنبيهات حرجة من الداتا الحالية.');
    return out.slice(0,8);
  }
  function metric(label,val,sub,cls){return '<div class="hp-v56-metric '+(cls||'')+'"><span>'+esc(label)+'</span><b>'+esc(val)+'</b><small>'+esc(sub||'')+'</small></div>'}
  function row3(name,a,b,c,btn){return '<div class="hp-v56-row"><div><b>'+esc(name)+'</b>'+(btn||'')+'</div><div>'+a+'</div><div>'+b+'</div><div>'+c+'</div></div>'}
  function categoryOptions(v){var cats=['أكل','مواصلات','إيجار','فواتير','شخصي','طوارئ','أخرى'];return cats.map(function(c){return '<option '+(c===v?'selected':'')+'>'+esc(c)+'</option>'}).join('')}
  function buildHtml(){
    var c=calcAll(), clients=clientRows(), factories=factoryRows(), topClients=clients.slice(0,10), topFactories=factories.slice(0,6), actions=actionItems(c,clients,factories);
    var s=c.settings;
    var rowsClients=topClients.length?topClients.map(function(x){var last=x.ago==null?'—':x.ago+' يوم';var gap=x.gap==null?'—':Math.round(x.gap)+' يوم';var btn='<button type="button" class="btn small blue" data-hp-v56-client="'+attr(x.id)+'">كشف</button>';return '<div class="hp-v56-client-card"><div class="hp-v56-client-top"><div><b>'+esc(x.name)+'</b><small>Risk '+x.score+'/100 · '+esc(x.rec)+'</small></div>'+btn+'</div><div class="hp-v56-client-grid">'+metric('مديونية',money(x.balance),'المتبقي الحالي',x.balance>0?'bad':'ok')+metric('متوسط الدفعة',money(x.avgPay),x.events+' دفعات')+metric('آخر دفعة',last,'متوسط بين الدفعات: '+gap)+metric('نسبة التحصيل',pct(x.ratio),'إجمالي مدفوع / طلبات')+metric('تأثير السيولة',money(x.liquidityImpact),'مديونية ناقص ربح العميل',x.liquidityImpact>0?'bad':'ok')+metric('ربح العميل',money(x.profit),'فرق البيع والتكلفة')+'</div></div>'}).join(''):'<div class="hp-v56-empty">لا توجد بيانات عملاء كافية.</div>';
    var rowsFactories=topFactories.length?topFactories.map(function(f){var last=f.last?('آخر دفعة '+f.last):'لا توجد دفعات';var btn='<button type="button" class="btn small" data-hp-v56-factory="'+attr(f.id)+'">كشف</button>';return row3(f.name,money(f.cost),money(f.paid),'<b class="'+(f.due>0?'hp-v56-red':'hp-v56-green')+'">'+money(f.due)+'</b><small>'+esc(last)+'</small>',btn)}).join(''):'<div class="hp-v56-empty">لا توجد بيانات مصانع.</div>';
    var houseRows=arr('houseExpenses').slice().sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))}).slice(0,12).map(function(e){return '<div class="hp-v56-exp-row"><div><b>'+esc(e.category||'أخرى')+'</b><small>'+esc(e.date||'')+(e.note?' · '+esc(e.note):'')+'</small></div><b>'+money(e.amount)+'</b><div><button type="button" class="btn small" data-hp-v56-edit-house="'+attr(e.id)+'">تعديل</button><button type="button" class="btn small red-out" data-hp-v56-del-house="'+attr(e.id)+'">حذف</button></div></div>'}).join('')||'<div class="hp-v56-empty">لا توجد مصروفات بيت مسجلة.</div>';
    var adjRows=arr('walletAdjustments').slice().sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))}).slice(0,8).map(function(e){return '<div class="hp-v56-exp-row"><div><b>'+(e.type==='out'?'خروج سيولة':'دخول سيولة')+'</b><small>'+esc(e.date||'')+(e.note?' · '+esc(e.note):'')+'</small></div><b class="'+(e.type==='out'?'hp-v56-red':'hp-v56-green')+'">'+(e.type==='out'?'-':'+')+money(e.amount)+'</b><div><button type="button" class="btn small red-out" data-hp-v56-del-adj="'+attr(e.id)+'">حذف</button></div></div>'}).join('')||'<div class="hp-v56-empty">لا توجد تسويات يدوية.</div>';
    return '<div class="hp-v56-head"><div><div class="sec-label">V57 Capital & Wallet Stable</div><h2>رأس المال والسيولة</h2><p>الربح هنا = قيمة أوردر العميل - تكلفة أوردر المصنع. مصروفات البيت تظهر في خانة ربح بعد مصروفات البيت فقط، وتخصم أيضًا من السيولة الفعلية.</p></div><button type="button" class="btn blue" data-hp-v56-export="1">CSV</button></div>'+
      '<div class="hp-v56-panel"><h3>إعدادات السيولة والفترة</h3><div class="hp-v56-form-grid"><label>رصيد افتتاحي للسيولة<input id="hp-v56-opening" type="number" step="0.01" value="'+attr(s.openingLiquidity)+'"></label><label>من تاريخ<input id="hp-v56-opening-date" type="date" value="'+attr(s.openingDate)+'"></label><label>تقرير من<input id="hp-v56-from" type="date" value="'+attr(c.period.from)+'"></label><label>تقرير إلى<input id="hp-v56-to" type="date" value="'+attr(c.period.to)+'"></label></div><button type="button" class="btn green" data-hp-v56-save-settings="1">حفظ وإعادة الحساب</button></div>'+
      '<div class="hp-v56-metrics">'+metric('السيولة الفعلية الآن',money(c.liquidity),'رصيد افتتاحي + تحصيل - مصانع - مصروفات - بيت ± تسويات',c.liquidity>=0?'ok':'bad')+metric('ربح الأوردرات',money(c.orderProfit),'مبيعات العملاء - تكلفة المصانع',c.orderProfit>=0?'ok':'bad')+metric('ربح بعد مصروفات البيت',money(c.profitAfterHouse),'ربح الأوردرات - مصروفات البيت فقط',c.profitAfterHouse>=0?'ok':'bad')+metric('مع العملاء',money(c.receivables),'مديونية العملاء الحالية','bad')+metric('مطلوب للمصانع',money(c.factoryDue),'تقديري على مستوى المصنع','warn')+metric('صافي موقف رأس المال',money(c.capitalPosition),'سيولة + عملاء - مصانع',c.capitalPosition>=0?'ok':'bad')+'</div>'+
      '<div class="hp-v56-grid2"><div class="hp-v56-panel"><h3>ماذا أفعل اليوم؟</h3><ol class="hp-v56-actions">'+actions.map(function(a){return '<li>'+esc(a)+'</li>'}).join('')+'</ol></div><div class="hp-v56-panel"><h3>تفصيل السيولة</h3>'+row3('تحصيلات العملاء',money(c.customerReceipts),'من تاريخ الرصيد', '')+row3('مدفوع للمصانع',money(c.factoryPaid),'إجمالي تحويلات', '')+row3('مصروفات الشغل',money(c.businessPaid),'مصروفات مسجلة', '')+row3('مصروفات البيت',money(c.housePaid),'تخصم من السيولة', '')+row3('تسويات + رأس مال',money(c.adjustments+c.capitalEffect),'إضافات/سحوبات', '')+'</div></div>'+
      '<div class="hp-v56-panel"><h3>مصروفات البيت</h3><div class="hp-v56-form-grid"><input type="hidden" id="hp-v56-house-id"><label>التاريخ<input id="hp-v56-house-date" type="date" value="'+today()+'"></label><label>التصنيف<select id="hp-v56-house-cat">'+categoryOptions('')+'</select></label><label>المبلغ<input id="hp-v56-house-amt" type="number" step="0.01"></label><label>ملاحظة<input id="hp-v56-house-note" placeholder="اختياري"></label></div><div class="btn-row"><button type="button" class="btn green" data-hp-v56-save-house="1">حفظ مصروف البيت</button><button type="button" class="btn" data-hp-v56-clear-house="1">تفريغ</button></div><div class="hp-v56-list">'+houseRows+'</div></div>'+
      '<div class="hp-v56-panel"><h3>تسويات يدوية للسيولة</h3><div class="hp-v56-form-grid"><label>التاريخ<input id="hp-v56-adj-date" type="date" value="'+today()+'"></label><label>النوع<select id="hp-v56-adj-type"><option value="in">دخول سيولة</option><option value="out">خروج سيولة</option></select></label><label>المبلغ<input id="hp-v56-adj-amt" type="number" step="0.01"></label><label>ملاحظة<input id="hp-v56-adj-note" placeholder="مثال: دخل خارجي / سحب شخصي"></label></div><button type="button" class="btn blue" data-hp-v56-save-adj="1">حفظ التسوية</button><div class="hp-v56-list">'+adjRows+'</div></div>'+
      '<div class="hp-v56-panel"><h3>أولوية تحصيل العملاء</h3>'+rowsClients+'</div>'+
      '<div class="hp-v56-panel"><h3>المصانع والتسويات</h3><p class="hp-v56-note">الدفع للمصنع عندك غير مربوط بالأوردر؛ لذلك التحليل هنا على مستوى المصنع إجمالاً وليس على مستوى أوردر محدد.</p><div class="hp-v56-table-head"><span>المصنع</span><span>إجمالي مستحق</span><span>مدفوع</span><span>المتبقي</span></div>'+rowsFactories+'</div>';
  }
  function ensureStyle(){if(byId(STYLE_ID))return;var st=document.createElement('style');st.id=STYLE_ID;st.textContent='.hp-v56-page{padding:0 0 90px}.hp-v56-head,.hp-v56-panel{background:#fff;border:1px solid #dbe3ee;border-radius:18px;padding:16px;margin:12px 0;box-shadow:0 1px 0 rgba(0,0,0,.04)}.hp-v56-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.hp-v56-head h2{font-size:28px;margin:4px 0}.hp-v56-head p,.hp-v56-note{color:#5b6b83;font-weight:900;line-height:1.7}.hp-v56-form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.hp-v56-form-grid label{font-weight:900;color:#24364f}.hp-v56-form-grid input,.hp-v56-form-grid select{width:100%;margin-top:5px;border:2px solid #d7e1ef;border-radius:12px;padding:11px;font-weight:900;background:#fff}.hp-v56-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:12px 0}.hp-v56-metric{border:2px solid #dbe3ee;border-radius:16px;padding:13px;background:#f8fafc}.hp-v56-metric span{display:block;color:#667085;font-size:13px;font-weight:900}.hp-v56-metric b{display:block;font-size:22px;margin:7px 0;color:#111}.hp-v56-metric small{font-weight:900;color:#5b6b83;line-height:1.5}.hp-v56-metric.ok b,.hp-v56-green{color:#067a46!important}.hp-v56-metric.bad b,.hp-v56-red{color:#b42318!important}.hp-v56-metric.warn b{color:#b77900!important}.hp-v56-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}.hp-v56-actions{font-weight:900;line-height:2}.hp-v56-row,.hp-v56-exp-row{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:10px;align-items:center;border:1px solid #e6edf5;border-radius:14px;padding:10px;margin-bottom:8px}.hp-v56-exp-row{grid-template-columns:1fr auto auto}.hp-v56-row small,.hp-v56-exp-row small{display:block;color:#667085;font-weight:900;margin-top:4px}.hp-v56-client-card{border:1px solid #e6edf5;border-radius:16px;padding:12px;margin-bottom:10px;background:#fbfdff}.hp-v56-client-top{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:10px}.hp-v56-client-top b{font-size:18px}.hp-v56-client-top small{display:block;color:#5b6b83;font-weight:900;margin-top:4px}.hp-v56-client-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.hp-v56-table-head{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:10px;color:#667085;font-weight:900;padding:0 10px 8px}.hp-v56-empty{padding:14px;border:1px dashed #bdc8d9;border-radius:14px;color:#667085;font-weight:900}.navbar .nb.hp-v56-nav i{font-size:20px}@media(max-width:760px){.hp-v56-head{display:block}.hp-v56-grid2{grid-template-columns:1fr}.hp-v56-row,.hp-v56-table-head{grid-template-columns:1fr}.hp-v56-exp-row{grid-template-columns:1fr}.hp-v56-page{padding-bottom:120px}}';document.head.appendChild(st)}
  function ensurePage(){ensureStyle();var content=q('.content');if(!content)return null;var page=byId(PAGE_ID);if(!page){page=document.createElement('div');page.className='page hp-v56-page';page.id=PAGE_ID;content.appendChild(page)}var nav=q('.navbar');if(nav&&!byId(NAV_ID)){var btn=document.createElement('button');btn.id=NAV_ID;btn.className='nb hp-v56-nav';btn.type='button';btn.innerHTML='<i class="ti ti-wallet"></i>السيولة';btn.addEventListener('click',function(){try{showPage(PAGE,btn)}catch(e){}});var reports=qa('.nb',nav).find(function(b){return /تقارير/.test(b.textContent||'')});if(reports&&reports.nextSibling)nav.insertBefore(btn,reports.nextSibling);else nav.appendChild(btn)}return page}
  function render(){try{var page=ensurePage();if(!page)return;ensureData();page.innerHTML=buildHtml()}catch(e){log('V56_RENDER_ERROR',String(e&&e.message||e),'render');console.error(e)}}
  function clearHouseForm(){['hp-v56-house-id','hp-v56-house-amt','hp-v56-house-note'].forEach(function(id){var x=byId(id);if(x)x.value=''});var d=byId('hp-v56-house-date');if(d)d.value=today()}
  function saveSettings(){var s=ensureData();s.openingLiquidity=n(byId('hp-v56-opening')&&byId('hp-v56-opening').value);s.openingDate=dateOf(byId('hp-v56-opening-date')&&byId('hp-v56-opening-date').value)||today();s.reportFrom=dateOf(byId('hp-v56-from')&&byId('hp-v56-from').value)||monthStart();s.reportTo=dateOf(byId('hp-v56-to')&&byId('hp-v56-to').value)||today();saveData('settings');render();toast('تم حفظ إعدادات السيولة وإعادة الحساب')}
  function saveHouse(){ensureData();var id=String(byId('hp-v56-house-id')&&byId('hp-v56-house-id').value||'');var amount=n(byId('hp-v56-house-amt')&&byId('hp-v56-house-amt').value);if(amount<=0){toast('أدخل مبلغ مصروف البيت');return}var item={id:id||uid(),date:dateOf(byId('hp-v56-house-date')&&byId('hp-v56-house-date').value)||today(),category:(byId('hp-v56-house-cat')&&byId('hp-v56-house-cat').value)||'أخرى',amount:amount,note:(byId('hp-v56-house-note')&&byId('hp-v56-house-note').value)||''};var i=DB.houseExpenses.findIndex(function(x){return x.id===item.id});if(i>=0)DB.houseExpenses[i]=item;else DB.houseExpenses.push(item);saveData('house-expense');render();toast('تم حفظ مصروف البيت')}
  function editHouse(id){var e=arr('houseExpenses').find(function(x){return x.id===id});if(!e)return;var h=byId('hp-v56-house-id'),d=byId('hp-v56-house-date'),c=byId('hp-v56-house-cat'),a=byId('hp-v56-house-amt'),n0=byId('hp-v56-house-note');if(h)h.value=e.id;if(d)d.value=dateOf(e.date)||today();if(c)c.value=e.category||'أخرى';if(a)a.value=n(e.amount)||'';if(n0)n0.value=e.note||'';try{a&&a.focus()}catch(_){}}
  function delHouse(id){if(!confirm('حذف مصروف البيت؟'))return;DB.houseExpenses=arr('houseExpenses').filter(function(x){return x.id!==id});saveData('delete-house');render();toast('تم الحذف')}
  function saveAdjustment(){ensureData();var amount=n(byId('hp-v56-adj-amt')&&byId('hp-v56-adj-amt').value);if(amount<=0){toast('أدخل مبلغ التسوية');return}DB.walletAdjustments.push({id:uid(),date:dateOf(byId('hp-v56-adj-date')&&byId('hp-v56-adj-date').value)||today(),type:(byId('hp-v56-adj-type')&&byId('hp-v56-adj-type').value)||'in',amount:amount,note:(byId('hp-v56-adj-note')&&byId('hp-v56-adj-note').value)||''});saveData('wallet-adjustment');render();toast('تم حفظ التسوية')}
  function delAdjustment(id){if(!confirm('حذف التسوية؟'))return;DB.walletAdjustments=arr('walletAdjustments').filter(function(x){return x.id!==id});saveData('delete-adjustment');render();toast('تم الحذف')}
  function openClient(id){try{if(typeof window.openClientDetail==='function')window.openClientDetail(id)}catch(e){log('V56_CLIENT_OPEN_ERROR',String(e&&e.message||e),'openClient')}}
  function openFactory(id){try{if(typeof window.openFactoryDetail==='function')window.openFactoryDetail(id)}catch(e){log('V56_FACTORY_OPEN_ERROR',String(e&&e.message||e),'openFactory')}}
  function csvCell(v){v=String(v==null?'':v);return '"'+v.replace(/"/g,'""')+'"'}
  function exportCsv(){try{var c=calcAll(), clients=clientRows();var rows=[['Metric','Value'],['السيولة الفعلية',c.liquidity],['ربح الأوردرات',c.orderProfit],['ربح بعد مصروفات البيت',c.profitAfterHouse],['مديونية العملاء',c.receivables],['مطلوب للمصانع',c.factoryDue],[],['Client','Debt','Paid','Avg Payment','Last Payment Days','Collection %','Risk','Recommendation']];clients.forEach(function(x){rows.push([x.name,x.balance,x.paid,x.avgPay,x.ago==null?'':x.ago,x.ratio,x.score,x.rec])});var blob=new Blob([rows.map(function(r){return r.map(csvCell).join(',')}).join('\n')],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=EXPORT_NAME;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},400)}catch(e){log('V56_EXPORT_ERROR',String(e&&e.message||e),'exportCsv');toast('تعذر تصدير CSV')}}
  function bind(){if(window.__HP_V56_EVENTS)return;window.__HP_V56_EVENTS=true;document.addEventListener('click',function(ev){var t=ev.target&&ev.target.closest?ev.target.closest('[data-hp-v56-save-settings],[data-hp-v56-save-house],[data-hp-v56-clear-house],[data-hp-v56-edit-house],[data-hp-v56-del-house],[data-hp-v56-save-adj],[data-hp-v56-del-adj],[data-hp-v56-client],[data-hp-v56-factory],[data-hp-v56-export]'):null;if(!t)return;try{ev.preventDefault();ev.stopPropagation()}catch(e){}if(t.hasAttribute('data-hp-v56-save-settings'))return saveSettings();if(t.hasAttribute('data-hp-v56-save-house'))return saveHouse();if(t.hasAttribute('data-hp-v56-clear-house'))return clearHouseForm();if(t.hasAttribute('data-hp-v56-edit-house'))return editHouse(t.getAttribute('data-hp-v56-edit-house'));if(t.hasAttribute('data-hp-v56-del-house'))return delHouse(t.getAttribute('data-hp-v56-del-house'));if(t.hasAttribute('data-hp-v56-save-adj'))return saveAdjustment();if(t.hasAttribute('data-hp-v56-del-adj'))return delAdjustment(t.getAttribute('data-hp-v56-del-adj'));if(t.hasAttribute('data-hp-v56-client'))return openClient(t.getAttribute('data-hp-v56-client'));if(t.hasAttribute('data-hp-v56-factory'))return openFactory(t.getAttribute('data-hp-v56-factory'));if(t.hasAttribute('data-hp-v56-export'))return exportCsv();},true)}
  function wrapShowPage(){var old=window.showPage;if(typeof old!=='function'||old.__hpV56)return;var w=function(name,btn){ensurePage();var r=old.apply(this,arguments);if(name===PAGE||String(name)==='capital-intelligence'){setTimeout(render,80);setTimeout(render,450)}return r};w.__hpV56=true;w.__hpOriginal=old;window.showPage=w}
  function wrapRefresh(){var old=window.refreshAll;if(typeof old==='function'&&!old.__hpV56){var w=function(){var r=old.apply(this,arguments);try{if((window.activePage||'')===PAGE)setTimeout(render,120)}catch(e){}return r};w.__hpV56=true;w.__hpOriginal=old;window.refreshAll=w}}
  function boot(){try{ensureData();ensurePage();bind();wrapShowPage();wrapRefresh();setTimeout(function(){if((window.activePage||'')===PAGE)render()},500);console.log('Haydar Pack V57 Capital & Wallet Stable loaded',VERSION)}catch(e){log('V56_BOOT_ERROR',String(e&&e.message||e),'boot');console.error(e)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,500)});else setTimeout(boot,500);
  window.HP_V56_CAPITAL_WALLET={version:VERSION,siteVersion:SITE_VERSION,render:render,calc:calcAll,clients:clientRows,factories:factoryRows,exportCsv:exportCsv};
})();

/* ===== V57.8 Print Reliability + Smart Summary (no new JS files) ===== */
(function(){
  'use strict';
  var VERSION='2026.08.07-production-fix.5', SITE_VERSION='production_20260807_fix7';
  function q(s,root){return (root||document).querySelector(s)}
  function qa(s,root){return Array.prototype.slice.call((root||document).querySelectorAll(s))}
  function byId(id){return document.getElementById(id)}
  function n(v){var x=parseFloat(String(v==null?'':v).replace(/,/g,''));return isNaN(x)?0:x}
  function esc(v){try{return typeof safe==='function'?safe(v):String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}catch(e){return String(v==null?'':v)}}
  function money(v){try{return typeof fmt==='function'?fmt(v):n(v).toLocaleString('ar-EG')+' ج'}catch(e){return n(v).toLocaleString('ar-EG')+' ج'} }
  function arr(k){return (window.DB&&Array.isArray(DB[k]))?DB[k]:[]}
  function today(){try{return todayStr()}catch(e){return new Date().toISOString().slice(0,10)}}
  function daysAgo(d){if(!d)return null;var x=new Date(String(d).slice(0,10)+'T00:00:00'), y=new Date(today()+'T00:00:00');if(isNaN(x))return null;return Math.floor((y-x)/86400000)}
  function clientTotal(o){try{return typeof clientTotalForOrder==='function'?clientTotalForOrder(o):n(o.qty||o.fQty)*n(o.price)+n(o.aklashe)}catch(e){return 0}}
  function factoryTotal(o){try{return typeof factoryTotalForOrder==='function'?factoryTotalForOrder(o):n(o.fQty)*n(o.fPrice)+n(o.fAk)}catch(e){return 0}}
  function clientBal(id){try{return typeof clientBalance==='function'?clientBalance(id):0}catch(e){return 0}}
  function factoryBal(id){try{return typeof factoryBalance==='function'?factoryBalance(id):0}catch(e){return 0}}
  function log(type,msg,ctx){try{if(window.HP_ERROR_LOG&&typeof HP_ERROR_LOG.add==='function')HP_ERROR_LOG.add(type,msg,ctx)}catch(e){} }
  function pendingCount(){try{return HPPreviewStorage.getItem('hayder_pack_sync_pending_v37')?1:0}catch(e){return 0}}
  function latestDate(list){var out='';(list||[]).forEach(function(x){var d=String((x&&x.date)||'');if(d&&d>out)out=d});return out}
  function calculate(){
    var capital=null;
    try{if(window.HP_V56_CAPITAL_WALLET&&typeof HP_V56_CAPITAL_WALLET.calc==='function')capital=HP_V56_CAPITAL_WALLET.calc()}catch(e){capital=null}
    var orders=arr('orders'), clients=arr('clients'), factories=arr('factories');
    var sales=orders.reduce(function(s,o){return s+clientTotal(o)},0);
    var costs=orders.reduce(function(s,o){return s+factoryTotal(o)},0);
    var orderProfit=sales-costs;
    var house=arr('houseExpenses').reduce(function(s,e){return s+n(e.amount)},0);
    var receivables=clients.reduce(function(s,c){return s+Math.max(0,clientBal(c.id))},0);
    var factoryDue=factories.reduce(function(s,f){return s+Math.max(0,factoryBal(f.id))},0);
    var liquidity=capital&&isFinite(capital.liquidity)?capital.liquidity:null;
    if(liquidity==null){
      var opening=n((((DB.settings||{}).capitalWallet||{}).openingLiquidity)||((DB.settings||{}).openingLiquidity));
      var receipts=arr('payments').reduce(function(s,p){return s+n(p.amount)},0)+orders.reduce(function(s,o){return s+n(o.deposit)},0);
      var factoryPaid=arr('transfers').reduce(function(s,t){return s+n(t.amount)},0);
      var exp=arr('expenses').reduce(function(s,e){return s+n(e.amount)},0);
      var adj=arr('walletAdjustments').reduce(function(s,a){return s+(String(a.type)==='out'?-n(a.amount):n(a.amount))},0);
      liquidity=opening+receipts-factoryPaid-exp-house+adj;
    }
    var clientRows=clients.map(function(c){
      var os=orders.filter(function(o){return o.clientId===c.id});
      var bal=Math.max(0,clientBal(c.id));
      var payEvents=arr('payments').filter(function(p){return p.clientId===c.id}).concat(os.filter(function(o){return n(o.deposit)>0}).map(function(o){return {date:o.date,amount:n(o.deposit)}}));
      payEvents.sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''))});
      var last=latestDate(payEvents), ago=daysAgo(last);
      var paid=payEvents.reduce(function(s,p){return s+n(p.amount)},0);
      var avg=payEvents.length?paid/payEvents.length:0;
      var sale=os.reduce(function(s,o){return s+clientTotal(o)},0)+n(c.debt);
      var ratio=sale>0?paid/sale*100:0;
      var score=0;if(bal>0)score+=Math.min(45,bal/1000);if(ago==null&&bal>0)score+=25;else if(ago!=null)score+=Math.min(30,ago*1.2);if(ratio<50&&sale>0)score+=20;else if(ratio<75&&sale>0)score+=10;score=Math.round(Math.min(100,score));
      return {id:c.id,name:c.name||'بدون اسم',balance:bal,paid:paid,avg:avg,last:last,ago:ago,ratio:ratio,score:score,orders:os.length};
    }).filter(function(x){return x.balance>0||x.paid>0||x.orders>0}).sort(function(a,b){return (b.score*100000+b.balance)-(a.score*100000+a.balance)});
    var topClient=clientRows[0]||null;
    var houseMonth=arr('houseExpenses').filter(function(e){return String(e.date||'').slice(0,7)===today().slice(0,7)}).reduce(function(s,e){return s+n(e.amount)},0);
    return {sales:sales,costs:costs,orderProfit:orderProfit,house:house,houseMonth:houseMonth,profitAfterHouse:orderProfit-house,receivables:receivables,factoryDue:factoryDue,liquidity:liquidity,clients:clientRows,topClient:topClient,pending:pendingCount()};
  }
  function style(){
    if(byId('hp-v573-style'))return;
    var st=document.createElement('style');st.id='hp-v573-style';st.textContent='\
      .hp-v573-summary{border:2px solid #dbe7ff;background:linear-gradient(180deg,#f8fbff,#fff);border-radius:20px;padding:14px;margin:0 0 14px;box-shadow:0 6px 18px rgba(15,23,42,.06)}\
      .hp-v573-summary-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}.hp-v573-summary-head h2{margin:0;font-size:24px}.hp-v573-summary-head p{margin:6px 0 0;color:#64748b;font-weight:900}.hp-v573-pill{border:1px solid #c7d2fe;background:#eef2ff;color:#27358a;border-radius:999px;padding:7px 10px;font-weight:900;white-space:nowrap}.hp-v573-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}.hp-v573-kpi{border:1px solid #e5edf7;background:#fff;border-radius:16px;padding:11px}.hp-v573-kpi span{display:block;color:#64748b;font-size:12px;font-weight:900}.hp-v573-kpi b{display:block;margin-top:6px;font-size:19px;color:#111827}.hp-v573-kpi.good b{color:#067a46}.hp-v573-kpi.bad b{color:#b42318}.hp-v573-kpi.warn b{color:#b77900}.hp-v573-actions{margin-top:10px;border-top:1px dashed #d7e2f0;padding-top:10px;font-weight:900;line-height:1.8}.hp-v573-actions div{padding:6px 8px;background:#f8fafc;border-radius:12px;margin:5px 0}.hp-v573-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.hp-v573-btns button{min-height:40px}.hp-soft-card,.card{transition:box-shadow .18s ease,transform .18s ease}.card:hover{box-shadow:0 8px 22px rgba(15,23,42,.08)}.btn{touch-action:manipulation}.page{scroll-margin-top:12px}@media(max-width:760px){.hp-v573-summary-head{display:block}.hp-v573-pill{display:inline-block;margin-top:8px}.hp-v573-summary{margin:8px 0 12px;padding:12px}.hp-v573-kpi b{font-size:17px}.hp-v573-btns .btn{flex:1 1 100%}.table-wrap,.hp-v56-row,.hp-v53-mini{overflow-x:auto;-webkit-overflow-scrolling:touch}}\
    ';document.head.appendChild(st);
  }
  function actionLines(c){
    var out=[];
    if(c.pending>0)out.push('فيه تعديل لسه لم يتم تأكيده على Google — افتح المزامنة والحماية قبل الخروج.');
    if(c.topClient&&c.topClient.balance>0)out.push('أولوية التحصيل: '+c.topClient.name+' عليه '+money(c.topClient.balance)+(c.topClient.ago==null?' ولا توجد دفعة حديثة واضحة.':' وآخر دفعة منذ '+c.topClient.ago+' يوم.'));
    if(c.liquidity<0)out.push('السيولة الفعلية سالبة: '+money(c.liquidity)+' — راجع التحصيل والمصروفات قبل أي التزام جديد.');
    else if(c.factoryDue>0&&c.liquidity<c.factoryDue*.15)out.push('السيولة قليلة مقارنة بالتزامات المصانع — الأولوية للتحصيل قبل التحويلات الجديدة.');
    if(c.houseMonth>0)out.push('مصروفات البيت هذا الشهر '+money(c.houseMonth)+'؛ تابعها لأنها تخصم من السيولة ومن ربحك بعد مصروفات البيت.');
    if(!out.length)out.push('الوضع مستقر مبدئيًا — تابع الحفظ والنسخ الاحتياطي بشكل دوري.');
    return out.slice(0,5);
  }
  function summaryHtml(){
    var c=calculate();
    var clsLiquidity=c.liquidity<0?'bad':(c.factoryDue>0&&c.liquidity<c.factoryDue*.15?'warn':'good');
    return '<section id="hp-v573-daily-summary" class="hp-v573-summary">'
      +'<div class="hp-v573-summary-head"><div><h2>ملخص اليوم</h2><p>نظرة سريعة على السيولة، رأس المال، والتحصيل قبل ما تبدأ شغلك.</p></div><span class="hp-v573-pill">V57.8 Smart Summary</span></div>'
      +'<div class="hp-v573-kpis">'
      +'<div class="hp-v573-kpi '+clsLiquidity+'"><span>السيولة الفعلية</span><b>'+money(c.liquidity)+'</b></div>'
      +'<div class="hp-v573-kpi bad"><span>مديونية العملاء</span><b>'+money(c.receivables)+'</b></div>'
      +'<div class="hp-v573-kpi warn"><span>التزامات المصانع</span><b>'+money(c.factoryDue)+'</b></div>'
      +'<div class="hp-v573-kpi"><span>ربح الأوردرات</span><b>'+money(c.orderProfit)+'</b></div>'
      +'<div class="hp-v573-kpi"><span>ربح بعد مصروفات البيت</span><b>'+money(c.profitAfterHouse)+'</b></div>'
      +'<div class="hp-v573-kpi"><span>مصروفات البيت هذا الشهر</span><b>'+money(c.houseMonth)+'</b></div>'
      +'</div>'
      +'<div class="hp-v573-actions">'+actionLines(c).map(function(x){return '<div>'+esc(x)+'</div>'}).join('')+'</div>'
      +'<div class="hp-v573-btns"><button class="btn primary" data-hp-v573-page="capital-intelligence"><i class="ti ti-wallet"></i> افتح السيولة</button><button class="btn blue" data-hp-v573-page="reports"><i class="ti ti-chart-bar"></i> التقارير</button><button class="btn green" data-hp-v573-sync><i class="ti ti-cloud-up"></i> مزامنة وحماية</button></div>'
      +'</section>';
  }
  function placeSummary(){
    try{style();var home=byId('pg-home');if(!home)return;var old=byId('hp-v573-daily-summary');if(old)old.remove();home.insertAdjacentHTML('afterbegin',summaryHtml())}catch(e){log('V57_3_SUMMARY_ERROR',String(e&&e.message||e),'placeSummary')}
  }
  function wrapHome(){var old=window.renderHome;if(typeof old!=='function'||old.__hpV573)return;var w=function(){var r=old.apply(this,arguments);setTimeout(placeSummary,40);return r};w.__hpV573=true;w.__hpOriginal=old;window.renderHome=w}
  function bind(){if(window.__HP_V573_EVENTS)return;window.__HP_V573_EVENTS=true;document.addEventListener('click',function(ev){var t=ev.target&&ev.target.closest?ev.target.closest('[data-hp-v573-page],[data-hp-v573-sync]'):null;if(!t)return;try{ev.preventDefault();ev.stopPropagation()}catch(e){}if(t.hasAttribute('data-hp-v573-sync')){try{if(typeof window.openBackupCenter==='function')return window.openBackupCenter(); if(typeof window.renderSyncPanel==='function')return window.renderSyncPanel(); if(typeof window.manualSync==='function')return window.manualSync(); if(typeof window.showPage==='function')return window.showPage('reports')}catch(e){}return}var page=t.getAttribute('data-hp-v573-page');try{if(typeof window.showPage==='function')window.showPage(page)}catch(e){}},true)}
  function boot(){try{style();bind();wrapHome();setTimeout(function(){if((window.activePage||'home')==='home')placeSummary()},700);console.log('Haydar Pack '+VERSION+' loaded')}catch(e){log('V57_3_BOOT_ERROR',String(e&&e.message||e),'boot')}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,500)});else setTimeout(boot,500);
  window.HP_V57_3_POLISH={version:VERSION,siteVersion:SITE_VERSION,renderSummary:placeSummary,calc:calculate};
})();
