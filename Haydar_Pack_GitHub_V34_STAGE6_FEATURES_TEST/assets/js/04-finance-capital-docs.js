/* Haydar Pack V33 Stage 5 split file: 04-finance-capital-docs.js. Preserves execution order from stable version. */
/* ===== HAYDAR PACK V23: INVOICE DISCOUNT + DOCUMENT LOGO + CAPITAL LOAN DETAILS ===== */
(function(){
  'use strict';
  var HP_SYNC_URL='https://script.google.com/macros/s/AKfycbw0RxMaw2gNicQjSD5T3LHhd-6d2DnABYKGNNMDD1NN3b09wJL3OatLviAn7xqDu2Zq6w/exec';
  window.HP_APPS_SCRIPT_URL=HP_SYNC_URL;

  function $(id){return document.getElementById(id)}
  function n(v){try{return num(v)}catch(e){var x=parseFloat(v);return isNaN(x)?0:x}}
  function txt(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function money(v){try{return fmt(v)}catch(e){return (n(v)).toLocaleString('ar-EG')+' ج'}}
  function today(){try{return todayStr()}catch(e){return new Date().toISOString().slice(0,10)}}
  function getOrder(id){return (DB.orders||[]).find(function(o){return o.id===id})}
  function getClient(id){return (DB.clients||[]).find(function(c){return c.id===id})||{name:'',phone:'',addr:'',code:''}}
  function getFactory(id){return (DB.factories||[]).find(function(f){return f.id===id})||{name:''}}
  function discount(o){return Math.max(0,n(o && (o.invoiceDiscount!=null?o.invoiceDiscount:o.discount)))}
  function grossClient(o){return (typeof billQty==='function'?billQty(o):n(o&&o.qty))*n(o&&o.price)+n(o&&o.aklashe)}
  function netClient(o){return Math.max(0,grossClient(o)-discount(o))}
  function getLogoUrl(){return 'hp-logo-v3-192.png?v=23'}

  function ensureTopLogo(){
    try{
      var box=document.querySelector('.logo-icon');
      if(box){box.innerHTML='<img class="hp-app-logo" src="hp-logo-v3-192.png?v=23" alt="Haydar Pack" onerror="this.src=\'icon-192.png?v=23\'">';}
      var link=document.querySelector('link[rel="icon"]'); if(link) link.href='hp-logo-v3-192.png?v=23';
      var apple=document.querySelector('link[rel="apple-touch-icon"]'); if(apple) apple.href='hp-logo-v3-192.png?v=23';
    }catch(e){console.error(e)}
  }

  function ensureDiscountField(){
    try{
      if($('o-discount')) return;
      var dep=$('o-deposit');
      if(!dep) return;
      var holder=dep.closest('.field') || dep.parentNode;
      holder.insertAdjacentHTML('afterend','<div class="field hp-invoice-discount-field"><label>خصم الفاتورة بالجنيه</label><input id="o-discount" type="number" min="0" step="0.01" value="0" oninput="calcOTotal()"></div>');
    }catch(e){console.error(e)}
  }

  function ensureCapitalTypes(){
    try{
      var s=$('cap-type'); if(!s) return;
      var want=[
        ['owner_add','إضافة رأس مال من فلوسك'],
        ['owner_withdraw','سحب شخصي من رأس المال'],
        ['loan_in','فلوس مستلفة دخلت السيولة'],
        ['loan_repay','رد فلوس مستلفة لصاحبها'],
        ['lend_out','فلوس أنت مسلفها لحد'],
        ['lend_repay','تحصيل فلوس كنت مسلفها']
      ];
      var old=s.value;
      s.innerHTML=want.map(function(x){return '<option value="'+x[0]+'">'+x[1]+'</option>'}).join('');
      if(old) s.value=old;
    }catch(e){console.error(e)}
  }

  var oldMigrate=window.migrate;
  window.migrate=function(){
    if(oldMigrate) oldMigrate.apply(this,arguments);
    DB.orders=DB.orders||[];
    DB.orders.forEach(function(o){
      if(o.invoiceDiscount==null && o.discount!=null) o.invoiceDiscount=n(o.discount);
      if(o.invoiceDiscount==null) o.invoiceDiscount=0;
    });
    DB.capitalMoves=DB.capitalMoves||[];
    DB.capitalMoves.forEach(function(m){m.amount=n(m.amount); if(!m.person && m.note) m.person=m.note;});
  };

  window.clientGrossForOrder=grossClient;
  window.orderInvoiceDiscount=discount;
  window.clientTotalForOrder=function(o){return netClient(o)};
  window.profitForOrder=function(o){
    var linked=0; try{ if(typeof orderExpenses==='function') linked=orderExpenses(o.id); }catch(e){}
    return netClient(o)-factoryTotalForOrder(o)-linked;
  };

  var oldCalc=window.calcOTotal;
  window.calcOTotal=function(){
    try{
      ensureDiscountField();
      var q=n(($('o-qty')||{}).value), p=n(($('o-price')||{}).value), a=n(($('o-ak')||{}).value), dep=n(($('o-deposit')||{}).value), dis=n(($('o-discount')||{}).value);
      var gross=q*p+a, net=Math.max(0,gross-dis);
      if($('o-total-prev')) $('o-total-prev').textContent=money(net);
      if($('o-due-prev')) $('o-due-prev').textContent=money(Math.max(0,net-dep));
    }catch(e){ if(oldCalc) oldCalc.apply(this,arguments); }
  };

  var oldOpenOrderForm=window.openOrderForm;
  window.openOrderForm=function(id){
    var r=oldOpenOrderForm?oldOpenOrderForm.apply(this,arguments):undefined;
    ensureDiscountField();
    var o=id?getOrder(id):null;
    if($('o-discount')) $('o-discount').value=o?discount(o):0;
    try{calcOTotal()}catch(e){}
    return r;
  };

  var oldSaveOrder=window.saveOrder;
  window.saveOrder=function(){
    ensureDiscountField();
    var oldId=$('o-edit-id')?$('o-edit-id').value:'';
    var oldCode=$('o-code')?$('o-code').value:'';
    var dis=n(($('o-discount')||{}).value);
    if(oldSaveOrder) oldSaveOrder.apply(this,arguments);
    if($('dr-order') && $('dr-order').classList.contains('open')) return;
    var o=oldId?getOrder(oldId):null;
    if(!o && oldCode) o=(DB.orders||[]).slice().reverse().find(function(x){return x.code===oldCode});
    if(o){ o.invoiceDiscount=dis; o.discount=dis; try{save(true)}catch(e){} try{refreshAll()}catch(e){} }
  };

  var oldOpenOrderDetail=window.openOrderDetail;
  window.openOrderDetail=function(id){
    if(oldOpenOrderDetail) oldOpenOrderDetail.apply(this,arguments);
    setTimeout(function(){
      try{
        var o=getOrder(id), body=$('order-detail-body'), card=body&&body.querySelector('.card');
        if(!o||!card||card.querySelector('.hp-discount-row')) return;
        var html='<div class="row hp-discount-row"><div class="row-sub">خصم الفاتورة</div><div class="row-val warn">'+money(discount(o))+'</div></div>'+
                 '<div class="row hp-discount-row"><div class="row-sub">إجمالي قبل الخصم</div><div class="row-val">'+money(grossClient(o))+'</div></div>'+
                 '<div class="row hp-discount-row"><div class="row-sub">إجمالي العميل بعد الخصم</div><div class="success row-val">'+money(netClient(o))+'</div></div>';
        card.insertAdjacentHTML('beforeend',html);
      }catch(e){console.error(e)}
    },0);
  };

  function selectedClientOrders(cid){
    var ids=Array.prototype.slice.call(document.querySelectorAll('.client-order-check:checked')).map(function(x){return x.value});
    return (DB.orders||[]).filter(function(o){return o.clientId===cid && ids.indexOf(o.id)>=0});
  }
  function orderColorCount(o){return o.colorCount||o.colorsCount||o.printColors||'1'}
  function orderFace(o){return o.face||o.printFace||'وجه واحد'}
  function itemName(o){
    var w=String(o.width||'').trim(), h=String(o.height||'').trim();
    if(w||h) return 'شنطة عرض '+(w||'—')+' × ارتفاع '+(h||'—');
    return o.name||o.size||o.type||'شنطة';
  }
  function rowsForDoc(orders,mode){
    var rows='',gross=0,disc=0,net=0;
    orders.forEach(function(o){
      var qty=mode==='quote'?n(o.qty):(typeof billQty==='function'?billQty(o):n(o.qty));
      var price=n(o.price), line=qty*price, ak=n(o.aklashe), d=discount(o);
      gross+=line+ak; disc+=d; net+=Math.max(0,line+ak-d);
      rows+='<tr><td>'+txt(o.code||'')+'</td><td>'+txt(itemName(o))+'</td><td>'+txt(o.type||'')+'</td><td>'+txt(o.color||'')+'</td><td>'+txt(o.handle||'بدون')+'</td><td>'+txt(orderColorCount(o))+'</td><td>'+txt(orderFace(o))+'</td><td>'+countFmt(qty)+'</td><td>'+money(price)+'</td><td>'+money(line)+'</td></tr>';
      if(ak>0) rows+='<tr><td>'+txt(o.code||'')+'</td><td>اكلاشيه</td><td>اكلاشيه</td><td>بدون</td><td>بدون</td><td>-</td><td>-</td><td>1</td><td>'+money(ak)+'</td><td>'+money(ak)+'</td></tr>';
    });
    return {rows:rows,gross:gross,discount:disc,net:net};
  }
  function quoteTerms(){return '<div class="terms"><b>ملاحظات عرض السعر:</b><br>برجاء مراجعة المقاسات والالوان والكمية والاسعار جيدا<br>قد يصل معدل العجز او الزيادة الى نسبة 3 %<br>مدة تسليم الاوردر من 10 الى 15 يوم من تاريخ دفع العربون<br>يتم التشغيل بعد دفع 50 % عربون من قيمة عرض السعر</div>'}
  function docHtml(title,docNo,client,head,body,totals,extra){
    return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>'+txt(docNo+' - '+title+' - Haydar Pack')+'</title><style>@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,Tahoma,sans-serif;color:#000;background:#fff;margin:0;font-size:10.5px}.sheet{width:100%;padding:2mm}.brand{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.brand-ar{display:flex;align-items:center;gap:10px;font-size:22px;font-weight:900;color:#c99739;text-align:right}.logo{width:64px;height:64px;object-fit:contain}.brand-left{direction:ltr;text-align:left}.brand-title{font-size:24px;font-weight:900;color:#0b2442}.tag{font-size:10px;font-weight:800;color:#111;margin-top:3px}.doc-title{text-align:center;font-size:20px;font-weight:900;text-decoration:underline;margin:3px 0 10px}.meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px 18px;margin-bottom:10px}.meta div{display:flex;justify-content:space-between;border-bottom:1px dotted #999;padding:3px 0}.meta b{min-width:70px}table{width:100%;border-collapse:collapse;table-layout:auto}th,td{border:1.2px solid #000;padding:4px 3px;text-align:center;vertical-align:middle;white-space:normal}th{background:#d9d9d9;font-weight:900}.totals{width:290px;margin-top:8px;margin-right:auto}.totals td{font-weight:900}.terms{font-size:11px;font-weight:900;line-height:1.6;margin-top:12mm;text-align:right}.foot{position:fixed;bottom:5mm;left:8mm;right:8mm;font-size:9px;display:flex;justify-content:space-between;border-top:1px solid #000;padding-top:3px}.no-print{position:fixed;top:6px;left:6px;display:flex;gap:6px}.no-print button{font-size:13px;padding:8px 12px;border:2px solid #000;background:#fff;font-weight:900}@media print{.no-print{display:none}.sheet{padding:0}}</style></head><body><div class="no-print"><button onclick="window.print()">طباعة / حفظ PDF</button><button onclick="window.close()">إغلاق</button></div><div class="sheet"><div class="brand"><div class="brand-ar"><img class="logo" src="'+getLogoUrl()+'"><div><div>حيدر باك</div><div class="tag">شنط قماش غير منسوجة صديقة للبيئة • شنط كرافت مطبوعة • جراب البدلة</div></div></div><div class="brand-left"><div class="brand-title">Haydar Pack</div><div class="tag">Eco-friendly bags & printed packaging</div></div></div><div class="doc-title">'+txt(title)+'</div><div class="meta"><div><b>التاريخ</b><span>'+txt(today())+'</span></div><div><b>رقم المستند</b><span>'+txt(docNo)+'</span></div><div><b>العميل</b><span>'+txt(client.name||'')+'</span></div><div><b>الهاتف</b><span>'+txt(client.phone||'')+'</span></div><div><b>العنوان</b><span>'+txt(client.addr||'')+'</span></div></div><table><thead>'+head+'</thead><tbody>'+body+'</tbody></table>'+totals+(extra||'')+'</div><div class="foot"><span>Haydar Pack</span><span>'+txt(docNo)+'</span><span>Generated: '+txt(today())+'</span></div><script>setTimeout(function(){try{window.print()}catch(e){}},500);</'+'script></body></html>';
  }
  function openDoc(html){var w=window.open('','_blank'); if(!w){toast('المتصفح منع فتح نافذة الطباعة. اسمح بالـ Popups وجرب تاني.');return;} w.document.open(); w.document.write(html); w.document.close();}
  function printClientDoc(cid,mode){
    var orders=selectedClientOrders(cid); if(!orders.length){toast('حدد أوردر واحد على الأقل');return;}
    var c=getClient(cid), no=(mode==='quote'?'QT':'INV')+'-'+today().replace(/-/g,'')+'-'+String(Date.now()).slice(-4);
    var tr=rowsForDoc(orders,mode), dep=orders.reduce(function(s,o){return s+n(o.deposit)},0);
    var head='<tr><th>كود الأوردر</th><th>اسم الصنف</th><th>نوع الشنطة</th><th>لون الشنطة</th><th>لون اليد</th><th>عدد الألوان</th><th>وجه</th><th>الكمية</th><th>سعر الشنطة</th><th>القيمة</th></tr>';
    var totals='<table class="totals"><tr><td>الإجمالي قبل الخصم</td><td>'+money(tr.gross)+'</td></tr><tr><td>خصم الفاتورة</td><td>'+money(tr.discount)+'</td></tr><tr><td>الإجمالي بعد الخصم</td><td>'+money(tr.net)+'</td></tr>'+(mode==='invoice'?'<tr><td>العربون المسجل</td><td>'+money(dep)+'</td></tr><tr><td>الصافي المستحق</td><td>'+money(Math.max(0,tr.net-dep))+'</td></tr>':'')+'</table>';
    openDoc(docHtml(mode==='quote'?'عرض سعر':'فاتورة بيع',no,c,head,tr.rows,totals,mode==='quote'?quoteTerms():''));
  }
  window.printSelectedClientQuote=function(cid){printClientDoc(cid,'quote')};
  window.printSelectedClientInvoice=function(cid){printClientDoc(cid,'invoice')};

  async function logoBuffer(){
    try{var r=await fetch('hp-logo-v3-192.png?v=23',{cache:'no-store'}); if(r.ok) return await r.arrayBuffer();}catch(e){}
    return null;
  }
  function setBorder(cell){cell.border={top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}}; cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};}
  async function exportDocExcel(orders,mode,filename){
    if(typeof ExcelJS==='undefined'){toast('مكتبة Excel لم تحمل بعد. افتح الإنترنت وجرب تاني.');return;}
    var wb=new ExcelJS.Workbook(), ws=wb.addWorksheet(mode==='quote'?'عرض سعر':'فاتورة بيع');
    ws.views=[{rightToLeft:true}]; ws.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0};
    ws.columns=[{width:18},{width:22},{width:16},{width:15},{width:15},{width:13},{width:13},{width:12},{width:15},{width:16}];
    var buf=await logoBuffer();
    if(buf){var img=wb.addImage({buffer:buf,extension:'png'}); ws.addImage(img,{tl:{col:0.15,row:0.1},ext:{width:64,height:64}});}
    ws.mergeCells('B1:J1'); ws.getCell('B1').value='حيدر باك  |  Haydar Pack'; ws.getCell('B1').font={bold:true,size:20,color:{argb:'FF0B2442'}}; ws.getCell('B1').alignment={horizontal:'center',vertical:'middle'};
    ws.mergeCells('B2:J2'); ws.getCell('B2').value='شنط قماش غير منسوجة صديقة للبيئة • شنط كرافت مطبوعة • جراب البدلة'; ws.getCell('B2').alignment={horizontal:'center'};
    ws.mergeCells('A4:J4'); ws.getCell('A4').value=mode==='quote'?'عرض سعر':'فاتورة بيع'; ws.getCell('A4').font={bold:true,size:18,underline:true}; ws.getCell('A4').alignment={horizontal:'center'};
    var first=orders[0]||{}, c=getClient(first.clientId), docNo=(mode==='quote'?'QT':'INV')+'-'+today().replace(/-/g,'')+'-'+String(Date.now()).slice(-4);
    ws.addRow([]); ws.addRow(['التاريخ',today(),'رقم المستند',docNo,'العميل',c.name||'','الهاتف',c.phone||'','العنوان',c.addr||'']);
    ws.addRow([]);
    var headers=['كود الأوردر','اسم الصنف','نوع الشنطة','لون الشنطة','لون اليد','عدد الألوان','وجه','الكمية','سعر الشنطة','القيمة']; ws.addRow(headers);
    var headerRow=ws.lastRow; headerRow.font={bold:true,color:{argb:'FFFFFFFF'}}; headerRow.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1A1A2E'}};
    var gross=0,disc=0,net=0;
    orders.forEach(function(o){
      var qty=mode==='quote'?n(o.qty):(typeof billQty==='function'?billQty(o):n(o.qty)), price=n(o.price), line=qty*price, ak=n(o.aklashe), d=discount(o);
      gross+=line+ak; disc+=d; net+=Math.max(0,line+ak-d);
      ws.addRow([o.code||'',itemName(o),o.type||'',o.color||'',o.handle||'بدون',orderColorCount(o),orderFace(o),qty,price,line]);
      if(ak>0) ws.addRow([o.code||'','اكلاشيه','اكلاشيه','بدون','بدون','-','-',1,ak,ak]);
    });
    ws.addRow([]); ws.addRow(['الإجمالي قبل الخصم','','','','','','','','',gross]); ws.addRow(['خصم الفاتورة','','','','','','','','',disc]); ws.addRow(['الإجمالي بعد الخصم','','','','','','','','',net]);
    if(mode==='invoice'){var dep=orders.reduce(function(s,o){return s+n(o.deposit)},0); ws.addRow(['العربون المسجل','','','','','','','','',dep]); ws.addRow(['الصافي المستحق','','','','','','','','',Math.max(0,net-dep)]);}
    ws.eachRow(function(row){row.height=Math.max(row.height||18,20); row.eachCell(setBorder);});
    [9,10].forEach(function(col){ws.getColumn(col).numFmt='#,##0.00 "ج"'});
    var out=await wb.xlsx.writeBuffer(), blob=new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=filename||((mode==='quote'?'عرض_سعر':'فاتورة')+'_'+docNo+'.xlsx'); a.click(); setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
  }
  window.exportQuoteExcel=function(id){var o=getOrder(id); if(!o)return; exportDocExcel([o],'quote','quote_'+(o.code||'order')+'.xlsx')};
  window.exportInvoiceExcel=function(id){var o=getOrder(id); if(!o)return; exportDocExcel([o],'invoice','invoice_'+(o.code||'order')+'.xlsx')};

  function loanBalances(){
    var map={borrow:{},lend:{}};
    (DB.capitalMoves||[]).forEach(function(m){
      var person=String(m.person||m.note||'بدون اسم').trim()||'بدون اسم', amt=n(m.amount);
      if(m.type==='loan_in') map.borrow[person]=(map.borrow[person]||0)+amt;
      if(m.type==='loan_repay') map.borrow[person]=(map.borrow[person]||0)-amt;
      if(m.type==='lend_out') map.lend[person]=(map.lend[person]||0)+amt;
      if(m.type==='lend_repay') map.lend[person]=(map.lend[person]||0)-amt;
    });
    return map;
  }
  function rowsFromBalances(obj,emptyText){
    var keys=Object.keys(obj).filter(function(k){return Math.abs(obj[k])>0.0001}).sort(function(a,b){return obj[b]-obj[a]});
    return keys.length?keys.map(function(k){return '<div class="row"><div class="row-name">'+txt(k)+'</div><div class="row-val">'+money(obj[k])+'</div></div>'}).join(''):'<p class="muted tiny">'+emptyText+'</p>';
  }
  function injectLoanDetails(){
    try{
      ensureCapitalTypes();
      var b=loanBalances();
      var target=$('capital-report-panel') || $('capital-panel');
      if(!target) return;
      var old=$('hp-loan-details'); if(old) old.remove();
      target.insertAdjacentHTML('beforeend','<div id="hp-loan-details"><div class="sec-label">تفاصيل السلف تحت رأس المال</div><div class="card"><div class="row"><div><div class="row-name">فلوس مستلفها من ناس</div><div class="row-sub">الاسم والمبلغ المتبقي عليك</div></div></div>'+rowsFromBalances(b.borrow,'لا توجد فلوس مستلفة مسجلة')+'<div class="row"><div><div class="row-name">فلوس أنت مسلفها لناس</div><div class="row-sub">الاسم والمبلغ المتبقي لك</div></div></div>'+rowsFromBalances(b.lend,'لا توجد فلوس مسلفة للغير مسجلة')+'</div></div>');
    }catch(e){console.error(e)}
  }
  var oldOpenCapital=window.openCapital;
  window.openCapital=function(){ensureCapitalTypes(); if(oldOpenCapital) oldOpenCapital.apply(this,arguments); ensureCapitalTypes();};
  var oldRenderCapitalMoves=window.renderCapitalMoves;
  window.renderCapitalMoves=function(){ if(oldRenderCapitalMoves) oldRenderCapitalMoves.apply(this,arguments); ensureCapitalTypes(); };
  var oldRenderReports=window.renderReports;
  window.renderReports=function(){ if(oldRenderReports) oldRenderReports.apply(this,arguments); injectLoanDetails(); };
  var oldRenderHome=window.renderHome;
  window.renderHome=function(){ if(oldRenderHome) oldRenderHome.apply(this,arguments); ensureTopLogo(); };
  var oldRefreshAll=window.refreshAll;
  window.refreshAll=function(){ if(oldRefreshAll) oldRefreshAll.apply(this,arguments); ensureTopLogo(); ensureCapitalTypes(); };

  ensureTopLogo(); ensureDiscountField(); ensureCapitalTypes();
  document.addEventListener('DOMContentLoaded',function(){ensureTopLogo(); ensureDiscountField(); ensureCapitalTypes();});
})();
