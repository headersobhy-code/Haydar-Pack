/* Haydar Pack V49 final-stable bundle: 03-boot-calc-print.js
   Sources: 09-boot-guard.js, 10-calculations.js, 11-printing.js
   Based on V44.1 Sync Fix; production cleanup without business-logic changes. */



/* ===== BEGIN SOURCE: 09-boot-guard.js ===== */

/* Haydar Pack V33 Stage 5 split file: 09-boot-guard.js. Preserves execution order from stable version. */
(function(){
  'use strict';
  var HP_STAGE_VERSION='31-stage3-docs-test';
  var HP_BOOT_MAX_MS=12000;
  function byId(id){return document.getElementById(id)}
  function safeToast(msg){try{if(typeof toast==='function')toast(msg)}catch(e){}}
  function setText(id,text){var el=byId(id); if(el) el.textContent=text;}
  function setState(state,msg){try{if(typeof setSyncState==='function')setSyncState(state,msg||'')}catch(e){} setText('sync-status',msg||'');}
  function enforceSingleActivePage(){
    try{
      var pages=[].slice.call(document.querySelectorAll('.page'));
      if(!pages.length) return;
      var active=pages.filter(function(p){return p.classList.contains('active')});
      if(active.length!==1){
        pages.forEach(function(p,i){p.classList.toggle('active',i===0)});
        var nav=[].slice.call(document.querySelectorAll('.nb'));
        nav.forEach(function(b,i){b.classList.toggle('active',i===0)});
      }
    }catch(e){console.warn('Stage1 page guard skipped',e)}
  }
  function hideLoading(reason){
    try{
      var cover=byId('cloud-loading-cover');
      if(cover){cover.classList.add('hide');cover.classList.add('hp-v29-forced-hide');}
      enforceSingleActivePage();
      if(reason){setState('err',reason);}
    }catch(e){console.warn('Stage1 loading guard skipped',e)}
  }
  function installGuards(){
    document.documentElement.setAttribute('data-hp-version',HP_STAGE_VERSION);
    enforceSingleActivePage();
    setTimeout(enforceSingleActivePage,800);
    setTimeout(enforceSingleActivePage,2500);
    setTimeout(function(){
      var cover=byId('cloud-loading-cover');
      if(cover && !cover.classList.contains('hide')){
        hideLoading('تم فتح البرنامج من النسخة المحلية. اضغط تحديث البيانات من Google لو الاتصال متاح.');
        safeToast('تم تخطي شاشة التحميل لحماية فتح البرنامج');
        try{if(typeof refreshAll==='function')refreshAll()}catch(e){}
      }
    },HP_BOOT_MAX_MS);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installGuards); else installGuards();
})();


/* ===== END SOURCE: 09-boot-guard.js ===== */



/* ===== BEGIN SOURCE: 10-calculations.js ===== */

/* Haydar Pack V33 Stage 5 split file: 10-calculations.js. Preserves execution order from stable version. */
(function(){
  'use strict';
  var STAGE='31-stage3-docs-test';
  function n(v){var x=parseFloat(v);return isNaN(x)?0:x}
  function arr(name){return (window.DB && Array.isArray(DB[name])) ? DB[name] : []}
  function byId(id){return document.getElementById(id)}
  function money(v){try{return n(v).toLocaleString('ar-EG',{minimumFractionDigits:0,maximumFractionDigits:2})+' ج'}catch(e){return String(n(v))+' ج'}}
  function orderDiscount(o){return Math.max(0,n(o && (o.invoiceDiscount!=null ? o.invoiceDiscount : o.discount)))}
  function billQtyCentral(o){o=o||{}; return n(o.fQty)>0 ? n(o.fQty) : n(o.qty)}
  function clientGrossForOrder(o){o=o||{}; return (billQtyCentral(o)*n(o.price))+n(o.aklashe)}
  function clientNetForOrder(o){return Math.max(0,clientGrossForOrder(o)-orderDiscount(o))}
  function factoryTotalForOrderCentral(o){o=o||{}; return (n(o.fQty)*n(o.fPrice))+n(o.fAk)}
  function orderExpenseTotal(orderId){return arr('expenses').filter(function(e){return e.orderId===orderId}).reduce(function(s,e){return s+n(e.amount)},0)}
  function profitForOrderCentral(o){o=o||{}; return clientNetForOrder(o)-factoryTotalForOrderCentral(o)-orderExpenseTotal(o.id)}
  function clientOrders(cid){return arr('orders').filter(function(o){return o.clientId===cid})}
  function clientTotalCentral(cid){return clientOrders(cid).reduce(function(s,o){return s+clientNetForOrder(o)},0)}
  function clientDepositsCentral(cid){return clientOrders(cid).reduce(function(s,o){return s+n(o.deposit)},0)}
  function clientPaymentsOnly(cid){return arr('payments').filter(function(p){return p.clientId===cid}).reduce(function(s,p){return s+n(p.amount)},0)}
  function clientPaidCentral(cid){return clientPaymentsOnly(cid)+clientDepositsCentral(cid)}
  function clientBalanceCentral(cid){var c=arr('clients').find(function(x){return x.id===cid})||{}; return clientTotalCentral(cid)+n(c.debt)-clientPaidCentral(cid)}
  function factoryOrders(fid){return arr('orders').filter(function(o){return o.factoryId===fid})}
  function factoryTotalCentral(fid){return factoryOrders(fid).reduce(function(s,o){return s+factoryTotalForOrderCentral(o)},0)}
  function factoryPaidCentral(fid){return arr('transfers').filter(function(t){return t.factoryId===fid}).reduce(function(s,t){return s+n(t.amount)},0)}
  function factoryBalanceCentral(fid){var f=arr('factories').find(function(x){return x.id===fid})||{}; return factoryTotalCentral(fid)+n(f.debt)-factoryPaidCentral(fid)}
  function periodOrdersCentral(period,month){return arr('orders').filter(function(o){return (typeof dateMatches==='function') ? dateMatches(o.date,period,month) : true})}
  function periodExpensesCentral(period,month){return arr('expenses').filter(function(e){return (typeof dateMatches==='function') ? dateMatches(e.date,period,month) : true})}
  function periodTotalsCentral(period,month){
    var orders=periodOrdersCentral(period,month);
    var income=orders.reduce(function(s,o){return s+clientNetForOrder(o)},0);
    var fcost=orders.reduce(function(s,o){return s+factoryTotalForOrderCentral(o)},0);
    var expenses=periodExpensesCentral(period,month).reduce(function(s,e){return s+n(e.amount)},0);
    return {orders:orders,income:income,fcost:fcost,expenses:expenses,profit:income-fcost-expenses};
  }
  window.HP_CALC={
    version:STAGE,
    num:n,
    orderDiscount:orderDiscount,
    billQty:billQtyCentral,
    clientGrossForOrder:clientGrossForOrder,
    clientNetForOrder:clientNetForOrder,
    factoryTotalForOrder:factoryTotalForOrderCentral,
    orderExpenseTotal:orderExpenseTotal,
    profitForOrder:profitForOrderCentral,
    clientTotal:clientTotalCentral,
    clientDeposits:clientDepositsCentral,
    clientPaymentsOnly:clientPaymentsOnly,
    clientPaid:clientPaidCentral,
    clientBalance:clientBalanceCentral,
    factoryTotal:factoryTotalCentral,
    factoryPaid:factoryPaidCentral,
    factoryBalance:factoryBalanceCentral,
    periodTotals:periodTotalsCentral
  };
  window.orderDiscount=orderDiscount;
  window.billQty=billQtyCentral;
  window.clientGrossTotalForOrder=clientGrossForOrder;
  window.clientTotalForOrder=clientNetForOrder;
  window.factoryTotalForOrder=factoryTotalForOrderCentral;
  window.orderExpenses=orderExpenseTotal;
  window.profitForOrder=profitForOrderCentral;
  window.clientTotal=clientTotalCentral;
  window.clientDeposits=clientDepositsCentral;
  window.clientPaid=clientPaidCentral;
  window.clientBalance=clientBalanceCentral;
  window.factoryTotal=factoryTotalCentral;
  window.factoryPaid=factoryPaidCentral;
  window.factoryBalance=factoryBalanceCentral;
  window.periodTotals=periodTotalsCentral;
  window.deleteOrder=function(id){
    var o=arr('orders').find(function(x){return x.id===id});
    if(!o){try{toast('الأوردر غير موجود')}catch(e){} return;}
    if(!confirm('تأكيد حذف الأوردر '+(o.code||'')+' نهائيًا؟\nسيتم حذف أثره من العميل والمصنع والتقارير وكأنه لم يدخل.'))return;
    var beforeExp=arr('expenses').length;
    DB.orders=arr('orders').filter(function(x){return x.id!==id});
    DB.expenses=arr('expenses').filter(function(e){return e.orderId!==id});
    try{if(typeof save==='function')save()}catch(e){}
    try{if(typeof closeDrawer==='function')closeDrawer('dr-order-detail')}catch(e){}
    try{if(typeof refreshAll==='function')refreshAll()}catch(e){}
    var removedExp=beforeExp-arr('expenses').length;
    try{toast('تم حذف الأوردر نهائيًا'+(removedExp?(' وحذف '+removedExp+' مصروف مرتبط'):'') )}catch(e){}
  };
  window.deleteClient=function(cid){
    var c=arr('clients').find(function(x){return x.id===cid});
    if(!c){try{toast('العميل غير موجود')}catch(e){} return;}
    var orderIds=arr('orders').filter(function(o){return o.clientId===cid}).map(function(o){return o.id});
    var msg='تأكيد حذف العميل '+(c.name||'')+' نهائيًا؟\nسيتم حذف العميل وأوردراته ودفعاته ومصاريف أوردراته من الحسابات.';
    if(!confirm(msg))return;
    DB.clients=arr('clients').filter(function(x){return x.id!==cid});
    DB.orders=arr('orders').filter(function(o){return o.clientId!==cid});
    DB.payments=arr('payments').filter(function(p){return p.clientId!==cid});
    DB.expenses=arr('expenses').filter(function(e){return orderIds.indexOf(e.orderId)<0});
    try{if(typeof save==='function')save()}catch(e){}
    try{if(typeof closeDrawer==='function')closeDrawer('dr-client-detail')}catch(e){}
    try{if(typeof refreshAll==='function')refreshAll()}catch(e){}
    try{toast('تم حذف العميل وكل حساباته المرتبطة')}catch(e){}
  };
  function installBadge(){
    try{
      var sync=byId('sync-status');
      if(sync && sync.getAttribute('data-stage2')!=='1'){
        sync.setAttribute('data-stage2','1');
      }
      document.documentElement.setAttribute('data-hp-calc-version',STAGE);
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installBadge); else installBadge();
  setTimeout(function(){try{if(typeof refreshAll==='function')refreshAll()}catch(e){}},600);
})();


/* ===== END SOURCE: 10-calculations.js ===== */



/* ===== BEGIN SOURCE: 11-printing.js ===== */

/* Haydar Pack V33 Stage 5 split file: 11-printing.js. Preserves execution order from stable version. */
(function(){
  'use strict';
  var VER='31-stage3-docs-test';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function n(v){var x=parseFloat(v);return isNaN(x)?0:x}
  function money(v){try{return n(v).toLocaleString('ar-EG',{minimumFractionDigits:0,maximumFractionDigits:2})+' ج'}catch(e){return String(n(v))+' ج'}}
  function count(v){try{return Math.round(n(v)).toLocaleString('ar-EG')}catch(e){return String(Math.round(n(v)))}}
  function today(){try{return todayStr()}catch(e){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day}}
  function docNo(prefix){return prefix+'-'+today().replace(/-/g,'')+'-'+String(Date.now()).slice(-5)}
  function logo(){return 'hp-logo-v3-192.png?v='+VER}
  function arr(name){return (window.DB && Array.isArray(DB[name]))?DB[name]:[]}
  function getClient(cid){return arr('clients').find(function(c){return c.id===cid})||{name:'',phone:'',addr:'',debt:0}}
  function getFactory(fid){return arr('factories').find(function(f){return f.id===fid})||{name:'',phone:'',debt:0}}
  function checked(cls){return [].slice.call(document.querySelectorAll('.'+cls+':checked')).map(function(x){return x.value})}
  function selectedClientOrders(cid){var all=arr('orders').filter(function(o){return o.clientId===cid});var ids=checked('client-order-check');return ids.length?all.filter(function(o){return ids.indexOf(o.id)>=0}):all}
  function selectedFactoryOrders(fid){var source=(typeof window.factoryOrdersFiltered==='function')?window.factoryOrdersFiltered(fid):arr('orders').filter(function(o){return o.factoryId===fid});var ids=checked('factory-order-check');return ids.length?source.filter(function(o){return ids.indexOf(o.id)>=0}):source}
  function bill(o,mode){if(mode==='quote')return n(o&&o.qty);if(window.HP_CALC&&typeof HP_CALC.billQty==='function')return HP_CALC.billQty(o);if(typeof window.billQty==='function')return window.billQty(o);return n(o&&o.fQty)>0?n(o.fQty):n(o&&o.qty)}
  function discount(o){if(window.HP_CALC&&typeof HP_CALC.orderDiscount==='function')return HP_CALC.orderDiscount(o);return Math.max(0,n(o&&(o.invoiceDiscount!=null?o.invoiceDiscount:o.discount)))}
  function factoryTotal(o){if(window.HP_CALC&&typeof HP_CALC.factoryTotalForOrder==='function')return HP_CALC.factoryTotalForOrder(o);return n(o&&o.fQty)*n(o&&o.fPrice)+n(o&&o.fAk)}
  function orderTitle(o){o=o||{};if(String(o.name||'').trim())return o.name;var w=String(o.width||'').trim(),h=String(o.height||'').trim();if(w||h)return 'شنطة عرض '+(w||'—')+' × ارتفاع '+(h||'—');return o.size||o.type||'شنطة'}
  function sizeText(o){o=o||{};if(o.size)return o.size;var w=String(o.width||'').trim(),h=String(o.height||'').trim();return (w||h)?((w||'—')+' × '+(h||'—')):'—'}
  function colorCount(o){return (o&&(o.colorCount||o.colorsCount||o.printColors||o.color_count))||'1'}
  function printFace(o){return (o&&(o.face||o.printFace||o.printSide))||'وجه واحد'}
  function documentCss(){return '@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{margin:0;background:#fff;color:#000;font-family:Arial,Tahoma,sans-serif;font-size:10.5px}.sheet{width:100%;padding:1mm}.hp-doc-header{direction:ltr;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #0b2442;padding-bottom:6px;margin-bottom:9px}.hp-brand-left,.hp-brand-right{display:flex;align-items:center;gap:10px;min-width:300px}.hp-brand-left{direction:ltr;text-align:left;justify-content:flex-start}.hp-brand-right{direction:rtl;text-align:right;justify-content:flex-start;flex-direction:row-reverse}.hp-brand-left img,.hp-brand-right img{width:72px;height:72px;object-fit:contain;display:block}.hp-en-title{font-size:27px;font-weight:900;line-height:1;color:#0b2442;letter-spacing:.2px}.hp-en-sub{font-size:11px;font-weight:900;color:#111;margin-top:7px;white-space:nowrap}.hp-ar-title{font-size:30px;font-weight:900;line-height:1;color:#ad7b25;letter-spacing:.2px}.hp-ar-sub{font-size:12px;font-weight:900;color:#111;margin-top:7px;white-space:nowrap}.doc-title{text-align:center;font-size:20px;font-weight:900;text-decoration:underline;margin:4px 0 10px}.meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px 18px;margin-bottom:10px}.meta div{display:flex;justify-content:space-between;border-bottom:1px dotted #777;padding:3px 0}.meta b{min-width:78px}table{width:100%;border-collapse:collapse;table-layout:auto}th,td{border:1.2px solid #000;padding:4px 3px;text-align:center;vertical-align:middle;white-space:normal}th{background:#d9d9d9;font-weight:900}.totals{width:330px;margin-top:8px;margin-right:auto}.totals td{font-weight:900}.section-title{font-size:13px;font-weight:900;margin:12px 0 5px;text-decoration:underline}.terms,.note{font-size:11px;font-weight:900;line-height:1.6;margin-top:9px;text-align:right}.foot{position:fixed;bottom:5mm;left:8mm;right:8mm;font-size:9px;display:flex;justify-content:space-between;border-top:1px solid #000;padding-top:3px}.no-print{position:fixed;top:6px;left:6px;display:flex;gap:6px;z-index:10}.no-print button{font-size:13px;padding:8px 12px;border:2px solid #000;background:#fff;font-weight:900}@media print{.no-print{display:none}.sheet{padding:0}}'}
  function headerHtml(){return '<div class="hp-doc-header"><div class="hp-brand-left"><img src="'+logo()+'" alt="Haydar Pack"><div><div class="hp-en-title">Haydarpack</div><div class="hp-en-sub">Eco-friendly bags &amp; printed packaging</div></div></div><div class="hp-brand-right"><img src="'+logo()+'" alt="حيدر باك"><div><div class="hp-ar-title">حيدر باك</div><div class="hp-ar-sub">شنط قماش غير منسوجة صديقة للبيئة</div></div></div></div>'}
  function metaHtml(rows){return '<div class="meta">'+rows.map(function(r){return '<div><b>'+esc(r[0])+'</b><span>'+esc(r[1]||'')+'</span></div>'}).join('')+'</div>'}
  function baseDoc(title,no,meta,head,body,totals,extra){return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>'+esc(no+' - '+title+' - Haydar Pack')+'</title><style>'+documentCss()+'</style></head><body><div class="no-print"><button onclick="window.print()">طباعة / حفظ PDF</button><button onclick="window.close()">إغلاق</button></div><div class="sheet">'+headerHtml()+'<div class="doc-title">'+esc(title)+'</div>'+meta+'<table><thead>'+head+'</thead><tbody>'+body+'</tbody></table>'+totals+(extra||'')+'</div><div class="foot"><span>Haydar Pack</span><span>'+esc(no)+'</span><span>Generated: '+esc(today())+'</span></div><script>setTimeout(function(){try{window.print()}catch(e){}},450);<\/script></body></html>'}
  function openDoc(html){var w=window.open('','_blank');if(!w){try{toast('المتصفح منع فتح نافذة الطباعة. اسمح بالـ Popups وجرب تاني.')}catch(e){}return}w.document.open();w.document.write(html);w.document.close()}
  function clientRows(orders,mode){var body='',gross=0,disc=0,net=0;orders.forEach(function(o){var q=bill(o,mode),price=n(o.price),bag=q*price,ak=n(o.aklashe),g=bag+ak,d=discount(o),after=Math.max(0,g-d);gross+=g;disc+=d;net+=after;body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(orderTitle(o))+'</td><td>'+esc(o.type||'')+'</td><td>'+esc(sizeText(o))+'</td><td>'+esc(o.color||'')+'</td><td>'+esc(o.handle||'بدون')+'</td><td>'+esc(colorCount(o))+'</td><td>'+esc(printFace(o))+'</td><td>'+count(q)+'</td><td>'+money(price)+'</td><td>'+money(bag)+'</td></tr>';if(ak>0){body+='<tr><td>'+esc(o.code||'')+'</td><td>اكلاشيه / تجهيز طباعة</td><td>اكلاشيه</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>1</td><td>'+money(ak)+'</td><td>'+money(ak)+'</td></tr>'}});return {body:body,gross:gross,disc:disc,net:net}}
  function clientDocument(cid,mode){var orders=selectedClientOrders(cid);if(!orders.length){try{toast('حدد أوردر واحد على الأقل')}catch(e){}return}var c=getClient(cid),no=docNo(mode==='quote'?'QT':'INV'),rows=clientRows(orders,mode),dep=orders.reduce(function(s,o){return s+n(o.deposit)},0),head='<tr><th>كود الأوردر</th><th>اسم الصنف</th><th>نوع الشنطة</th><th>المقاس</th><th>لون الشنطة</th><th>لون اليد</th><th>عدد الألوان</th><th>وجه</th><th>الكمية</th><th>سعر الشنطة</th><th>القيمة</th></tr>',tot='<table class="totals"><tr><td>الإجمالي قبل الخصم</td><td>'+money(rows.gross)+'</td></tr><tr><td>خصم الفاتورة</td><td>'+money(rows.disc)+'</td></tr><tr><td>الإجمالي بعد الخصم</td><td>'+money(rows.net)+'</td></tr>'+(mode==='invoice'?'<tr><td>العربون المسجل</td><td>'+money(dep)+'</td></tr><tr><td>الصافي المستحق</td><td>'+money(Math.max(0,rows.net-dep))+'</td></tr>':'')+'</table>',extra=mode==='quote'?'<div class="terms"><b>ملاحظات عرض السعر:</b><br>برجاء مراجعة المقاسات والألوان والكمية والأسعار جيدًا<br>قد يصل معدل العجز أو الزيادة إلى نسبة 3%<br>مدة تسليم الأوردر من 10 إلى 15 يوم من تاريخ دفع العربون<br>يتم التشغيل بعد دفع 50% عربون من قيمة عرض السعر</div>':'';openDoc(baseDoc(mode==='quote'?'عرض سعر':'فاتورة بيع',no,metaHtml([['التاريخ',today()],['رقم المستند',no],['العميل',c.name],['رقم الهاتف',c.phone],['العنوان',c.addr]]),head,rows.body,tot,extra))}
  function clientStatement(cid){var orders=selectedClientOrders(cid);if(!orders.length){try{toast('لا توجد أوردرات للعميل')}catch(e){}return}var c=getClient(cid),no=docNo('CS'),isFull=!checked('client-order-check').length,body='',gross=0,disc=0,net=0,deps=0;orders.forEach(function(o){var q=bill(o,'invoice'),g=q*n(o.price)+n(o.aklashe),d=discount(o),after=Math.max(0,g-d),dep=n(o.deposit);gross+=g;disc+=d;net+=after;deps+=dep;body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(o.date||'')+'</td><td>'+esc(orderTitle(o))+'</td><td>'+count(q)+'</td><td>'+money(g)+'</td><td>'+money(d)+'</td><td>'+money(after)+'</td><td>'+money(dep)+'</td><td>'+money(Math.max(0,after-dep))+'</td><td>'+esc(o.status||'')+'</td></tr>'});var pays=isFull?arr('payments').filter(function(p){return p.clientId===cid}):[],paid=pays.reduce(function(s,p){return s+n(p.amount)},0),oldDebt=isFull?n(c.debt):0,remain=net+oldDebt-deps-paid,head='<tr><th>كود الأوردر</th><th>التاريخ</th><th>الصنف</th><th>الكمية</th><th>قبل الخصم</th><th>الخصم</th><th>بعد الخصم</th><th>العربون</th><th>باقي الأوردر</th><th>الحالة</th></tr>',tot='<table class="totals"><tr><td>إجمالي قبل الخصم</td><td>'+money(gross)+'</td></tr><tr><td>إجمالي الخصومات</td><td>'+money(disc)+'</td></tr><tr><td>إجمالي بعد الخصم</td><td>'+money(net)+'</td></tr><tr><td>مديونية قديمة محتسبة</td><td>'+money(oldDebt)+'</td></tr><tr><td>عربون الأوردرات</td><td>'+money(deps)+'</td></tr><tr><td>دفعات عامة محتسبة</td><td>'+money(paid)+'</td></tr><tr><td>المتبقى</td><td>'+money(remain)+'</td></tr></table>',extra=(isFull?'':'<div class="note">تنبيه: الكشف مبني على الأوردرات المحددة فقط، لذلك لم يتم احتساب الدفعات العامة أو المديونية القديمة.</div>')+(pays.length?'<div class="section-title">الدفعات العامة المحتسبة</div><table><thead><tr><th>التاريخ</th><th>المبلغ</th><th>ملاحظة</th></tr></thead><tbody>'+pays.map(function(p){return '<tr><td>'+esc(p.date||'')+'</td><td>'+money(p.amount)+'</td><td>'+esc(p.note||'')+'</td></tr>'}).join('')+'</tbody></table>':'');openDoc(baseDoc('كشف حساب عميل',no,metaHtml([['التاريخ',today()],['رقم الكشف',no],['العميل',c.name],['رقم الهاتف',c.phone],['العنوان',c.addr]]),head,body,tot,extra))}
  function factoryRows(orders){var body='',total=0;orders.forEach(function(o){var c=getClient(o.clientId),q=n(o.fQty)||n(o.qty),price=n(o.fPrice),ak=n(o.fAk),val=factoryTotal(o);total+=val;body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(c.name||'')+'</td><td>'+esc(orderTitle(o))+'</td><td>'+esc(o.type||'')+'</td><td>'+esc(sizeText(o))+'</td><td>'+esc(o.color||'')+'</td><td>'+esc(o.handle||'بدون')+'</td><td>'+esc(colorCount(o))+'</td><td>'+esc(printFace(o))+'</td><td>'+count(q)+'</td><td>'+money(price)+'</td><td>'+money(val)+'</td></tr>';if(ak>0){body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(c.name||'')+'</td><td>اكلاشيه / تجهيز طباعة</td><td>اكلاشيه</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>1</td><td>'+money(ak)+'</td><td>'+money(ak)+'</td></tr>'}});return {body:body,total:total}}
  function factoryStatement(fid){var orders=selectedFactoryOrders(fid);if(!orders.length){try{toast('لا توجد أوردرات للتصدير')}catch(e){}return}var f=getFactory(fid),no=docNo('FS'),rows=factoryRows(orders),trs=(typeof window.factoryPeriodTransfers==='function')?window.factoryPeriodTransfers(fid):arr('transfers').filter(function(t){return t.factoryId===fid}),paid=trs.reduce(function(s,t){return s+n(t.amount)},0),head='<tr><th>كود الأوردر</th><th>عميل</th><th>اسم الصنف</th><th>النوع</th><th>المقاس</th><th>لون الشنطة</th><th>لون اليد</th><th>عدد الألوان</th><th>وجه</th><th>الكمية</th><th>سعر المصنع</th><th>القيمة</th></tr>',tot='<table class="totals"><tr><td>إجمالي مستحق المحدد</td><td>'+money(rows.total)+'</td></tr><tr><td>تحويلات الفترة</td><td>'+money(paid)+'</td></tr><tr><td>الصافي</td><td>'+money(rows.total-paid)+'</td></tr></table>',extra=trs.length?'<div class="section-title">تحويلات الفترة المسجلة</div><table><thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>ملاحظة</th></tr></thead><tbody>'+trs.map(function(t){return '<tr><td>'+esc(t.date||'')+'</td><td>'+esc(t.type||'')+'</td><td>'+money(t.amount)+'</td><td>'+esc(t.note||'')+'</td></tr>'}).join('')+'</tbody></table>':'<div class="note">لا توجد تحويلات مسجلة في الفترة المختارة.</div>';openDoc(baseDoc('كشف حساب مصنع',no,metaHtml([['التاريخ',today()],['رقم الكشف',no],['المصنع',f.name],['رقم الهاتف',f.phone||''],['الفترة',(typeof factoryDetailPeriod!=='undefined'&&factoryDetailPeriod==='month'&&typeof monthLabel==='function')?monthLabel(factoryDetailMonth):'كل الفترات']]),head,rows.body,tot,extra))}
  window.HP_DOC={version:VER,openDoc:openDoc,baseDoc:baseDoc,clientDocument:clientDocument,clientStatement:clientStatement,factoryStatement:factoryStatement};
  window.printSelectedClientQuote=function(cid){clientDocument(cid,'quote')};
  window.printSelectedClientInvoice=function(cid){clientDocument(cid,'invoice')};
  window.printSelectedClientStatement=function(cid){clientStatement(cid)};
  window.printSelectedFactoryStatement=function(fid){factoryStatement(fid)};
})();


/* ===== END SOURCE: 11-printing.js ===== */
