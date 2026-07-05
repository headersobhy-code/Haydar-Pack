/* Haydar Pack V35: delivery auto-archive, document header pagination, receipt viewer, order filters/count. GitHub only. */
(function(){
  'use strict';
  var VER='35-fixes-docs-archive-receipts';
  function byId(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function n(v){var x=parseFloat(v);return isNaN(x)?0:x}
  function money(v){try{return n(v).toLocaleString('ar-EG',{minimumFractionDigits:0,maximumFractionDigits:2})+' ج'}catch(e){return String(n(v))+' ج'}}
  function count(v){try{return Math.round(n(v)).toLocaleString('ar-EG')}catch(e){return String(Math.round(n(v)))} }
  function today(){try{return todayStr()}catch(e){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day}}
  function monthAdd(m,delta){try{if(window.monthAdd)return window.monthAdd(m,delta)}catch(e){} var p=String(m||today().slice(0,7)).split('-'),y=parseInt(p[0],10),mo=parseInt(p[1],10)-1+(delta||0); y+=Math.floor(mo/12); mo=((mo%12)+12)%12; return y+'-'+String(mo+1).padStart(2,'0')}
  function curMonthSafe(){try{return curMonth()}catch(e){return today().slice(0,7)}}
  function docNo(prefix){return prefix+'-'+today().replace(/-/g,'')+'-'+String(Date.now()).slice(-5)}
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
  function logo(){return 'hp-logo-v3-192.png?v='+VER}

  // 1) Auto archive any delivered order, from status change or save.
  function markDeliveredArchived(o){
    if(!o) return false;
    if(o.status==='تم التوصيل للعميل'){
      if(!o.deliveredAt) o.deliveredAt=today();
      if(!o.archived){ o.archived=true; o.archivedAt=today(); return true; }
    }
    return false;
  }
  window.HP_autoArchiveDelivered=function(){
    var changed=false; arr('orders').forEach(function(o){ if(markDeliveredArchived(o)) changed=true; });
    if(changed){try{save()}catch(e){try{localStorage.setItem('hayder_bags_app',JSON.stringify(DB))}catch(_){}}}
    return changed;
  };
  var oldChange=window.changeOrderStatus;
  window.changeOrderStatus=function(id,st){
    if(typeof oldChange==='function') oldChange(id,st); else {var o=arr('orders').find(function(x){return x.id===id}); if(o)o.status=st;}
    var o=arr('orders').find(function(x){return x.id===id});
    var archived=markDeliveredArchived(o);
    if(archived){try{save()}catch(e){} try{toast('تم التسليم ونقل الأوردر للأرشيف تلقائيًا')}catch(e){}}
    try{refreshAll()}catch(e){try{renderOrders();renderHome()}catch(_){}}
    try{if(byId('dr-order-detail')&&byId('dr-order-detail').classList.contains('open')){closeDrawer('dr-order-detail')}}catch(e){}
  };
  var oldSaveOrder=window.saveOrder;
  window.saveOrder=function(){
    if(typeof oldSaveOrder==='function') oldSaveOrder.apply(this,arguments);
    var changed=false; arr('orders').forEach(function(o){ if(markDeliveredArchived(o)) changed=true; });
    if(changed){try{save()}catch(e){} try{refreshAll()}catch(e){}}
  };

  // 2) Add previous month filter support and count displayed orders.
  var oldDateMatches=window.dateMatches;
  window.dateMatches=function(v,period,month){
    if(period==='last_month' || period==='prev_month') return String(v||'').slice(0,7)===monthAdd(curMonthSafe(),-1);
    return typeof oldDateMatches==='function'?oldDateMatches(v,period,month):true;
  };
  var oldPeriodChips=window.periodChips;
  window.periodChips=function(container,current,fn){
    if(container==='period-chips'){
      var opts=[['all','كل البيانات'],['today','اليوم'],['week','الأسبوع الحالي'],['month','الشهر الحالي'],['last_month','الشهر الماضي']];
      var el=byId(container); if(!el)return;
      el.innerHTML=opts.map(function(o){return '<button class="chip '+(current===o[0]?'active':'')+'" onclick="'+fn+'(\''+o[0]+'\')">'+o[1]+'</button>'}).join('');
      return;
    }
    if(typeof oldPeriodChips==='function')return oldPeriodChips(container,current,fn);
  };
  function updateOrderCount(){
    var list=byId('orders-list'); if(!list)return;
    var count=list.querySelectorAll('.card.clickable').length;
    if(list.querySelector('.empty')) count=0;
    var box=byId('orders-visible-count');
    if(!box){
      box=document.createElement('div'); box.id='orders-visible-count'; box.className='alert blue';
      list.parentNode.insertBefore(box,list);
    }
    var arch=(typeof window.showArchive!=='undefined'&&window.showArchive)?'الأرشيف':'النشط';
    box.innerHTML='عدد الأوردرات المعروضة: <b>'+count.toLocaleString('ar-EG')+'</b> · '+arch;
  }
  var oldRenderOrders=window.renderOrders;
  window.renderOrders=function(){
    if(typeof oldRenderOrders==='function') oldRenderOrders.apply(this,arguments);
    updateOrderCount();
  };
  setTimeout(function(){try{HP_autoArchiveDelivered(); updateOrderCount()}catch(e){}},600);

  // 3) Receipt viewer: open image inside real HTML page instead of direct data-url link to avoid blank pages.
  window.HP_RECEIPTS=window.HP_RECEIPTS||{};
  window.openReceiptViewer=function(key){
    var src=window.HP_RECEIPTS[key]||key||'';
    if(!src){try{toast('لا توجد صورة إيصال')}catch(e){}return;}
    var w=window.open('','_blank');
    if(!w){try{toast('المتصفح منع فتح الإيصال. اسمح بالـ Popups.')}catch(e){}return;}
    w.document.open();
    w.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>إيصال الدفع</title><style>body{margin:0;background:#111;color:#fff;font-family:Arial,Tahoma,sans-serif;text-align:center}.bar{position:sticky;top:0;background:#000;padding:10px;display:flex;gap:8px;justify-content:center}.bar button{font-size:16px;font-weight:900;padding:8px 14px;border:2px solid #fff;border-radius:8px;background:#fff;color:#000}img{max-width:98vw;max-height:calc(100vh - 70px);object-fit:contain;margin-top:8px;background:#fff}</style></head><body><div class="bar"><button onclick="window.print()">طباعة</button><button onclick="window.close()">إغلاق</button></div><img alt="إيصال" src="'+src.replace(/"/g,'&quot;')+'"></body></html>');
    w.document.close();
  };
  window.receiptLink=function(r){
    if(!r||!r.data)return '';
    var key='rc_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    window.HP_RECEIPTS[key]=r.data;
    return '<button type="button" class="btn small" onclick="openReceiptViewer(\''+key+'\')"><i class="ti ti-photo"></i> عرض الإيصال</button>';
  };

  // 4) Clean printable documents with exact edge header and safer multi-page CSS.
  function documentCss(){return '@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#000;font-family:Arial,Tahoma,sans-serif;font-size:10.5px}.sheet{width:100%;padding:1mm}.hp-doc-header{direction:ltr;display:flex;align-items:flex-start;justify-content:space-between;width:100%;border-bottom:2px solid #0b2442;padding-bottom:6px;margin-bottom:9px;break-inside:avoid;page-break-inside:avoid}.hp-brand-left{direction:ltr;text-align:left;display:flex;align-items:center;gap:10px;justify-content:flex-start;margin-right:auto}.hp-brand-right{direction:rtl;text-align:right;display:flex;align-items:center;gap:10px;justify-content:flex-start;margin-left:auto}.hp-brand-left img,.hp-brand-right img{width:72px;height:72px;object-fit:contain;display:block;flex:0 0 auto}.hp-en-title{font-size:27px;font-weight:900;line-height:1;color:#0b2442;letter-spacing:.2px}.hp-en-sub{font-size:11px;font-weight:900;color:#111;margin-top:7px;white-space:nowrap}.hp-ar-title{font-size:30px;font-weight:900;line-height:1;color:#ad7b25;letter-spacing:.2px}.hp-ar-sub{font-size:12px;font-weight:900;color:#111;margin-top:7px;white-space:nowrap}.doc-title{text-align:center;font-size:20px;font-weight:900;text-decoration:underline;margin:4px 0 10px;break-after:avoid}.meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px 18px;margin-bottom:10px;break-inside:avoid}.meta div{display:flex;justify-content:space-between;border-bottom:1px dotted #777;padding:3px 0}.meta b{min-width:78px}table{width:100%;border-collapse:collapse;table-layout:auto;page-break-inside:auto}thead{display:table-header-group}tfoot{display:table-footer-group}tr{page-break-inside:avoid;break-inside:avoid}th,td{border:1.2px solid #000;padding:4px 3px;text-align:center;vertical-align:middle;white-space:normal}th{background:#d9d9d9;font-weight:900}.totals{width:330px;margin-top:8px;margin-right:auto;break-inside:avoid;page-break-inside:avoid}.totals td{font-weight:900}.section-title{font-size:13px;font-weight:900;margin:12px 0 5px;text-decoration:underline;break-after:avoid}.terms,.note{font-size:11px;font-weight:900;line-height:1.6;margin-top:9px;text-align:right;break-inside:avoid}.foot{position:fixed;bottom:5mm;left:8mm;right:8mm;font-size:9px;display:flex;justify-content:space-between;border-top:1px solid #000;padding-top:3px}.no-print{position:fixed;top:6px;left:6px;display:flex;gap:6px;z-index:10}.no-print button{font-size:13px;padding:8px 12px;border:2px solid #000;background:#fff;font-weight:900}@media print{.no-print{display:none}.sheet{padding:0}}'}
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
