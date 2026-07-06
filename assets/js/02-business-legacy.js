/* Haydar Pack V49 final-stable bundle: 02-business-legacy.js
   Sources: 03-client-edit.js, 04-finance-capital-docs.js, 05-safe-import-boot.js, 06-delete-doclogo-sync.js, 07-doc-client-numbering.js, 08-doc-header-client-profit.js
   Based on V44.1 Sync Fix; production cleanup without business-logic changes. */



/* ===== BEGIN SOURCE: 03-client-edit.js ===== */

/* Haydar Pack V33 Stage 5 split file: 03-client-edit.js. Preserves execution order from stable version. */
/* ===== HAYDAR PACK V21: CLIENT EDIT ONLY ===== */
(function(){
  function hpClientEditEsc(v){return String(v==null?'':v).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
  function hpEnsureClientForm(){
    try{
      var dr=document.getElementById('dr-client');
      if(!dr) return;
      var drawer=dr.querySelector('.drawer');
      if(!drawer) return;
      if(!document.getElementById('c-edit-id')){
        var hidden=document.createElement('input');
        hidden.type='hidden';
        hidden.id='c-edit-id';
        drawer.insertBefore(hidden, drawer.children[1] || drawer.firstChild);
      }
      var title=drawer.querySelector('.drawer-title');
      if(title && !document.getElementById('client-drawer-title')){
        title.innerHTML='<i class="ti ti-user-plus"></i> <span id="client-drawer-title">عميل جديد</span>';
      }
      var btn=drawer.querySelector('button[onclick="saveClient()"]');
      if(btn && !btn.id) btn.id='client-save-btn';
    }catch(e){console.error(e)}
  }
  window.openClientForm=function(cid){
    hpEnsureClientForm();
    var edit=document.getElementById('c-edit-id');
    var title=document.getElementById('client-drawer-title');
    var btn=document.getElementById('client-save-btn');
    if(edit) edit.value='';
    ['c-name','c-phone','c-addr','c-debt'].forEach(function(id){var el=document.getElementById(id); if(el) el.value='';});
    if(title) title.textContent='عميل جديد';
    if(btn) btn.innerHTML='<i class="ti ti-check"></i> إضافة';
    if(cid){
      var c=(DB.clients||[]).find(function(x){return x.id===cid});
      if(c){
        if(edit) edit.value=c.id;
        if(title) title.textContent='تعديل بيانات العميل';
        if(btn) btn.innerHTML='<i class="ti ti-check"></i> حفظ التعديل';
        var n=document.getElementById('c-name'), p=document.getElementById('c-phone'), a=document.getElementById('c-addr'), d=document.getElementById('c-debt');
        if(n) n.value=c.name||'';
        if(p) p.value=c.phone||'';
        if(a) a.value=c.addr||'';
        if(d) d.value=(num(c.debt)||0)||'';
      }
    }
    openDrawer('dr-client');
  };
  window.saveClient=function(){
    hpEnsureClientForm();
    var nameEl=document.getElementById('c-name');
    var name=nameEl?String(nameEl.value||'').trim():'';
    if(!name){toast('أدخل اسم العميل');return;}
    var edit=document.getElementById('c-edit-id');
    var id=edit?String(edit.value||''):'';
    var patch={
      name:name,
      phone:(document.getElementById('c-phone')||{}).value||'',
      addr:(document.getElementById('c-addr')||{}).value||'',
      debt:num((document.getElementById('c-debt')||{}).value),
      updatedAt:todayStr()
    };
    if(id){
      var c=(DB.clients||[]).find(function(x){return x.id===id});
      if(!c){toast('العميل غير موجود');return;}
      Object.assign(c,patch);
      toast('تم تعديل بيانات العميل');
    }else{
      DB.clients=DB.clients||[];
      DB.clients.push(Object.assign({id:uid(),month:curMonth(),createdAt:todayStr()},patch));
      toast('تم إضافة العميل');
    }
    save();
    ['c-name','c-phone','c-addr','c-debt'].forEach(function(x){var el=document.getElementById(x); if(el) el.value='';});
    if(edit) edit.value='';
    closeDrawer('dr-client');
    refreshAll();
    if(id){setTimeout(function(){openClientDetail(id)},120);}
  };
  function hpPatchClientAddButton(){
    try{
      var btn=document.querySelector('#pg-clients .btn.primary');
      if(btn && String(btn.getAttribute('onclick')||'').indexOf('dr-client')>-1){btn.setAttribute('onclick','openClientForm()');}
    }catch(e){}
  }
  var oldOpenClientDetail=window.openClientDetail;
  window.openClientDetail=function(cid){
    if(oldOpenClientDetail) oldOpenClientDetail.apply(this, arguments);
    setTimeout(function(){
      try{
        var body=document.getElementById('client-detail-body');
        if(!body || body.innerHTML.indexOf('تعديل بيانات العميل')>-1) return;
        var safeId=hpClientEditEsc(cid);
        var html='<button class="btn amber full" style="margin-bottom:12px" onclick="closeDrawer(\'dr-client-detail\');openClientForm(\''+safeId+'\')"><i class="ti ti-edit"></i> تعديل بيانات العميل</button>';
        var anchor=body.querySelector('.doc-action-bar') || body.querySelector('.sec-label');
        if(anchor) anchor.insertAdjacentHTML('beforebegin',html); else body.insertAdjacentHTML('beforeend',html);
      }catch(e){console.error(e)}
    },0);
  };
  hpEnsureClientForm();
  hpPatchClientAddButton();
  document.addEventListener('DOMContentLoaded',function(){hpEnsureClientForm();hpPatchClientAddButton();});
})();


/* ===== END SOURCE: 03-client-edit.js ===== */



/* ===== BEGIN SOURCE: 04-finance-capital-docs.js ===== */

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
      if(box){box.innerHTML='<img class="hp-app-logo" src="hp-logo-v3-192.png?v=23" alt="Haydar Pack" onerror="this.src=\'hp-logo-v3-192.png?v=23\'">';}
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


/* ===== END SOURCE: 04-finance-capital-docs.js ===== */



/* ===== BEGIN SOURCE: 05-safe-import-boot.js ===== */

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
        box.innerHTML='<img class="hp-app-logo" src="hp-logo-v3-192.png?v=24" alt="Haydar Pack" onerror="this.onerror=null;this.src=\'hp-logo-v3-192.png?v=24\'">';
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


/* ===== END SOURCE: 05-safe-import-boot.js ===== */



/* ===== BEGIN SOURCE: 06-delete-doclogo-sync.js ===== */

/* Haydar Pack V33 Stage 5 split file: 06-delete-doclogo-sync.js. Preserves execution order from stable version. */
/* ===== HAYDAR PACK V25: STABLE DELETE + DOCUMENT DOUBLE LOGO + SYNC BUTTON =====
   Built on the working V24 FIXED version only.
   - Adds safe delete for client and order.
   - Keeps factory money recalculated automatically by removing the order itself.
   - Adds double logos in quote/invoice print and Excel documents.
   - Adds a clear update-data button and fixed Apps Script link in the sync drawer.
*/
(function(){
  'use strict';
  var HP_V25_SYNC_URL='https://script.google.com/macros/s/AKfycbw0RxMaw2gNicQjSD5T3LHhd-6d2DnABYKGNNMDD1NN3b09wJL3OatLviAn7xqDu2Zq6w/exec';
  window.HP_APPS_SCRIPT_URL=HP_V25_SYNC_URL;
  try{localStorage.setItem('hayder_pack_backend_url_v10',HP_V25_SYNC_URL);}catch(e){}

  function $(id){return document.getElementById(id)}
  function n(v){try{return num(v)}catch(e){var x=parseFloat(v);return isNaN(x)?0:x}}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function money(v){try{return fmt(v)}catch(e){return n(v).toLocaleString('ar-EG')+' ج'}}
  function today(){try{return todayStr()}catch(e){return new Date().toISOString().slice(0,10)}}
  function getOrder(id){return (DB.orders||[]).find(function(o){return o.id===id})}
  function getClient(id){return (DB.clients||[]).find(function(c){return c.id===id})||{name:'',phone:'',addr:''}}
  function logoUrl(){return 'hp-logo-v3-192.png?v=25'}
  function discount(o){return Math.max(0,n(o&&(o.invoiceDiscount!=null?o.invoiceDiscount:o.discount)))}
  function grossClient(o){return (typeof billQty==='function'?billQty(o):n(o&&o.qty))*n(o&&o.price)+n(o&&o.aklashe)}
  function netClient(o){return Math.max(0,grossClient(o)-discount(o))}

  function fixTopLogo(){
    try{
      var box=document.querySelector('.logo-icon');
      if(box){box.innerHTML='<img class="hp-app-logo" src="hp-logo-v3-192.png?v=25" alt="Haydar Pack" onerror="this.onerror=null;this.src=\'hp-logo-v3-192.png?v=25\'">';}
      var fav=document.querySelector('link[rel="icon"]'); if(fav) fav.href='hp-logo-v3-192.png?v=25';
      var apple=document.querySelector('link[rel="apple-touch-icon"]'); if(apple) apple.href='hp-logo-v3-192.png?v=25';
    }catch(e){}
  }

  function closeIf(id){try{var el=$(id); if(el) el.classList.remove('open')}catch(e){}}

  window.deleteOrder=function(id){
    var o=getOrder(id); if(!o){toast('الأوردر غير موجود');return;}
    if(!confirm('تأكيد حذف الأوردر '+(o.code||'')+' نهائيًا؟\n\nسيتم حذفه من حساب العميل ومن حساب المصنع، وسيتم حذف أي مصروفات مرتبطة به.')) return;
    DB.orders=(DB.orders||[]).filter(function(x){return x.id!==id});
    DB.expenses=(DB.expenses||[]).filter(function(e){return e.orderId!==id});
    try{save()}catch(e){}
    closeIf('dr-order-detail'); closeIf('dr-client-detail'); closeIf('dr-factory-detail');
    try{refreshAll()}catch(e){}
    toast('تم حذف الأوردر وتصحيح حساب العميل والمصنع');
  };

  window.deleteClient=function(cid){
    var c=getClient(cid); if(!c || !c.id){toast('العميل غير موجود');return;}
    var orderIds=(DB.orders||[]).filter(function(o){return o.clientId===cid}).map(function(o){return o.id});
    var payCount=(DB.payments||[]).filter(function(p){return p.clientId===cid}).length;
    var msg='تأكيد حذف العميل: '+(c.name||'')+'؟\n\nسيتم حذف:\n- بيانات العميل\n- '+orderIds.length+' أوردر خاص به\n- '+payCount+' دفعة خاصة به\n- أي مصروفات مرتبطة بأوردراته\n\nبعد الحذف كأن العميل وأوردراته لم يدخلوا الحسابات.';
    if(!confirm(msg)) return;
    var idMap={}; orderIds.forEach(function(id){idMap[id]=true});
    DB.clients=(DB.clients||[]).filter(function(x){return x.id!==cid});
    DB.orders=(DB.orders||[]).filter(function(o){return o.clientId!==cid});
    DB.payments=(DB.payments||[]).filter(function(p){return p.clientId!==cid});
    DB.expenses=(DB.expenses||[]).filter(function(e){return !idMap[e.orderId]});
    try{save()}catch(e){}
    closeIf('dr-client'); closeIf('dr-client-detail'); closeIf('dr-order-detail');
    try{refreshAll()}catch(e){}
    toast('تم حذف العميل وكل حساباته');
  };

  function addClientDeleteButton(cid){
    try{
      var body=$('client-detail-body'); if(!body || body.querySelector('#hp-v25-delete-client')) return;
      body.insertAdjacentHTML('beforeend','<button id="hp-v25-delete-client" class="btn red-out full" style="margin-top:10px" onclick="deleteClient(\''+String(cid).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')"><i class="ti ti-trash"></i> حذف العميل نهائيًا</button>');
    }catch(e){}
  }
  var baseClientDetail=window.openClientDetail;
  window.openClientDetail=function(cid){
    if(baseClientDetail) baseClientDetail.apply(this,arguments);
    setTimeout(function(){addClientDeleteButton(cid)},0);
  };

  var baseClientForm=window.openClientForm;
  if(baseClientForm){
    window.openClientForm=function(cid){
      var r=baseClientForm.apply(this,arguments);
      setTimeout(function(){
        try{
          var drawer=document.querySelector('#dr-client .drawer'); if(!drawer) return;
          var old=$('hp-v25-delete-client-form'); if(old) old.remove();
          if(cid){drawer.insertAdjacentHTML('beforeend','<button id="hp-v25-delete-client-form" class="btn red-out full" style="margin-top:12px" onclick="deleteClient(\''+String(cid).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')"><i class="ti ti-trash"></i> حذف العميل نهائيًا</button>');}
        }catch(e){}
      },0);
      return r;
    };
  }

  function addOrderDeleteButton(id){
    try{
      var body=$('order-detail-body'); if(!body || body.querySelector('#hp-v25-delete-order')) return;
      body.insertAdjacentHTML('beforeend','<button id="hp-v25-delete-order" class="btn red-out full" style="margin-top:10px" onclick="deleteOrder(\''+String(id).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')"><i class="ti ti-trash"></i> حذف الأوردر نهائيًا وتصحيح الحسابات</button>');
    }catch(e){}
  }
  var baseOrderDetail=window.openOrderDetail;
  window.openOrderDetail=function(id){
    if(baseOrderDetail) baseOrderDetail.apply(this,arguments);
    setTimeout(function(){addOrderDeleteButton(id)},0);
  };

  function selectedClientOrders(cid){
    var checks=[].slice.call(document.querySelectorAll('.client-order-check:checked')).map(function(x){return x.value});
    var all=(DB.orders||[]).filter(function(o){return o.clientId===cid});
    return checks.length?all.filter(function(o){return checks.indexOf(o.id)>=0}):all;
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
      var price=n(o.price), line=qty*price, ak=n(o.aklashe), d=discount(o), lineGross=line+ak;
      gross+=lineGross; disc+=d; net+=Math.max(0,lineGross-d);
      rows+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(itemName(o))+'</td><td>'+esc(o.type||'')+'</td><td>'+esc(o.color||'')+'</td><td>'+esc(o.handle||'بدون')+'</td><td>'+esc(orderColorCount(o))+'</td><td>'+esc(orderFace(o))+'</td><td>'+countFmt(qty)+'</td><td>'+money(price)+'</td><td>'+money(line)+'</td></tr>';
      if(ak>0) rows+='<tr><td>'+esc(o.code||'')+'</td><td>اكلاشيه</td><td>اكلاشيه</td><td>بدون</td><td>بدون</td><td>-</td><td>-</td><td>1</td><td>'+money(ak)+'</td><td>'+money(ak)+'</td></tr>';
    });
    return {rows:rows,gross:gross,discount:disc,net:net};
  }
  function quoteTerms(){return '<div class="terms"><b>ملاحظات عرض السعر:</b><br>برجاء مراجعة المقاسات والالوان والكمية والاسعار جيدا<br>قد يصل معدل العجز او الزيادة الى نسبة 3 %<br>مدة تسليم الاوردر من 10 الى 15 يوم من تاريخ دفع العربون<br>يتم التشغيل بعد دفع 50 % عربون من قيمة عرض السعر</div>'}
  function docHtml(title,docNo,client,head,body,totals,extra){
    return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>'+esc(docNo+' - '+title+' - Haydar Pack')+'</title><style>@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,Tahoma,sans-serif;color:#000;background:#fff;margin:0;font-size:10.5px}.sheet{width:100%;padding:2mm}.brand{display:grid;grid-template-columns:1fr 1.2fr 1fr;align-items:center;margin-bottom:8px;gap:8px}.brand-side{display:flex;align-items:center;gap:10px}.brand-side.left{direction:ltr;justify-content:flex-start}.brand-side.right{direction:rtl;justify-content:flex-start}.brand-name-ar{font-size:24px;font-weight:900;color:#c99739;line-height:1.1}.brand-center{text-align:center}.brand-title{font-size:24px;font-weight:900;color:#0b2442}.tag{font-size:10px;font-weight:800;color:#111;margin-top:3px}.logo{width:58px;height:58px;object-fit:contain}.doc-title{text-align:center;font-size:20px;font-weight:900;text-decoration:underline;margin:3px 0 10px}.meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px 18px;margin-bottom:10px}.meta div{display:flex;justify-content:space-between;border-bottom:1px dotted #999;padding:3px 0}.meta b{min-width:70px}table{width:100%;border-collapse:collapse;table-layout:auto}th,td{border:1.2px solid #000;padding:4px 3px;text-align:center;vertical-align:middle;white-space:normal}th{background:#d9d9d9;font-weight:900}.totals{width:290px;margin-top:8px;margin-right:auto}.totals td{font-weight:900}.terms{font-size:11px;font-weight:900;line-height:1.6;margin-top:12mm;text-align:right}.foot{position:fixed;bottom:5mm;left:8mm;right:8mm;font-size:9px;display:flex;justify-content:space-between;border-top:1px solid #000;padding-top:3px}.no-print{position:fixed;top:6px;left:6px;display:flex;gap:6px}.no-print button{font-size:13px;padding:8px 12px;border:2px solid #000;background:#fff;font-weight:900}@media print{.no-print{display:none}.sheet{padding:0}}</style></head><body><div class="no-print"><button onclick="window.print()">طباعة / PDF</button><button onclick="window.close()">إغلاق</button></div><div class="sheet"><div class="brand"><div class="brand-side right"><img class="logo" src="'+logoUrl()+'"><div><div class="brand-name-ar">حيدر باك</div><div class="tag">شنط قماش غير منسوجة</div></div></div><div class="brand-center"><div class="brand-title">Haydar Pack</div><div class="tag">شنط قماش غير منسوجة صديقة للبيئة • شنط كرافت مطبوعة • جراب البدلة</div></div><div class="brand-side left"><div><div class="brand-name-ar">حيدر باك</div><div class="tag">Eco-friendly bags & printed packaging</div></div><img class="logo" src="'+logoUrl()+'"></div></div><div class="doc-title">'+esc(title)+'</div><div class="meta"><div><b>التاريخ</b><span>'+esc(today())+'</span></div><div><b>رقم المستند</b><span>'+esc(docNo)+'</span></div><div><b>العميل</b><span>'+esc(client.name||'')+'</span></div><div><b>الهاتف</b><span>'+esc(client.phone||'')+'</span></div><div><b>العنوان</b><span>'+esc(client.addr||'')+'</span></div></div><table><thead>'+head+'</thead><tbody>'+body+'</tbody></table>'+totals+(extra||'')+'</div><div class="foot"><span>Haydar Pack</span><span>'+esc(docNo)+'</span><span>Generated: '+esc(today())+'</span></div><script>setTimeout(function(){try{window.print()}catch(e){}},500);</'+'script></body></html>';
  }
  function openDoc(html){var w=window.open('','_blank'); if(!w){toast('المتصفح منع فتح نافذة الطباعة. اسمح بالـ Popups وجرب تاني.');return;} w.document.open(); w.document.write(html); w.document.close();}
  function printClientDoc(cid,mode){
    var orders=selectedClientOrders(cid); if(!orders.length){toast('لا توجد أوردرات للعميل');return;}
    var c=getClient(cid), no=(mode==='quote'?'QT':'INV')+'-'+today().replace(/-/g,'')+'-'+String(Date.now()).slice(-4);
    var tr=rowsForDoc(orders,mode), dep=orders.reduce(function(s,o){return s+n(o.deposit)},0);
    var head='<tr><th>كود الأوردر</th><th>اسم الصنف</th><th>نوع الشنطة</th><th>لون الشنطة</th><th>لون اليد</th><th>عدد الألوان</th><th>وجه</th><th>الكمية</th><th>سعر الشنطة</th><th>القيمة</th></tr>';
    var totals='<table class="totals"><tr><td>الإجمالي قبل الخصم</td><td>'+money(tr.gross)+'</td></tr><tr><td>خصم الفاتورة</td><td>'+money(tr.discount)+'</td></tr><tr><td>الإجمالي بعد الخصم</td><td>'+money(tr.net)+'</td></tr>'+(mode==='invoice'?'<tr><td>العربون المسجل</td><td>'+money(dep)+'</td></tr><tr><td>الصافي المستحق</td><td>'+money(Math.max(0,tr.net-dep))+'</td></tr>':'')+'</table>';
    openDoc(docHtml(mode==='quote'?'عرض سعر':'فاتورة بيع',no,c,head,tr.rows,totals,mode==='quote'?quoteTerms():''));
  }
  window.printSelectedClientQuote=function(cid){printClientDoc(cid,'quote')};
  window.printSelectedClientInvoice=function(cid){printClientDoc(cid,'invoice')};

  async function logoBuffer(){try{var r=await fetch(logoUrl(),{cache:'no-store'}); if(r.ok)return await r.arrayBuffer();}catch(e){} return null;}
  function setBorder(cell){cell.border={top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}};cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};}
  async function exportDocExcel(orders,mode,filename){
    if(typeof ExcelJS==='undefined'){toast('مكتبة Excel لم تحمل بعد. افتح الإنترنت وجرب تاني.');return;}
    var wb=new ExcelJS.Workbook(), ws=wb.addWorksheet(mode==='quote'?'عرض سعر':'فاتورة بيع');
    ws.views=[{rightToLeft:true}]; ws.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0};
    ws.columns=[{width:18},{width:22},{width:16},{width:15},{width:15},{width:13},{width:13},{width:12},{width:15},{width:16}];
    var buf=await logoBuffer();
    if(buf){var img1=wb.addImage({buffer:buf,extension:'png'}), img2=wb.addImage({buffer:buf,extension:'png'}); ws.addImage(img1,{tl:{col:0.1,row:0.1},ext:{width:58,height:58}}); ws.addImage(img2,{tl:{col:8.9,row:0.1},ext:{width:58,height:58}});}
    ws.mergeCells('B1:I1'); ws.getCell('B1').value='حيدر باك  |  Haydar Pack  |  حيدر باك'; ws.getCell('B1').font={bold:true,size:20,color:{argb:'FF0B2442'}}; ws.getCell('B1').alignment={horizontal:'center',vertical:'middle'};
    ws.mergeCells('B2:I2'); ws.getCell('B2').value='شنط قماش غير منسوجة صديقة للبيئة • شنط كرافت مطبوعة • جراب البدلة'; ws.getCell('B2').alignment={horizontal:'center'};
    ws.mergeCells('A4:J4'); ws.getCell('A4').value=mode==='quote'?'عرض سعر':'فاتورة بيع'; ws.getCell('A4').font={bold:true,size:18,underline:true}; ws.getCell('A4').alignment={horizontal:'center'};
    var first=orders[0]||{}, c=getClient(first.clientId), docNo=(mode==='quote'?'QT':'INV')+'-'+today().replace(/-/g,'')+'-'+String(Date.now()).slice(-4);
    ws.addRow([]); ws.addRow(['التاريخ',today(),'رقم المستند',docNo,'العميل',c.name||'','الهاتف',c.phone||'','العنوان',c.addr||'']); ws.addRow([]);
    var headers=['كود الأوردر','اسم الصنف','نوع الشنطة','لون الشنطة','لون اليد','عدد الألوان','وجه','الكمية','سعر الشنطة','القيمة']; ws.addRow(headers);
    var headerRow=ws.lastRow; headerRow.font={bold:true,color:{argb:'FFFFFFFF'}}; headerRow.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1A1A2E'}};
    var gross=0,disc=0,net=0;
    orders.forEach(function(o){
      var qty=mode==='quote'?n(o.qty):(typeof billQty==='function'?billQty(o):n(o.qty)), price=n(o.price), line=qty*price, ak=n(o.aklashe), d=discount(o), lineGross=line+ak;
      gross+=lineGross; disc+=d; net+=Math.max(0,lineGross-d);
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

  function addSyncPanel(){
    try{
      var drawer=document.querySelector('#dr-sync .drawer'); if(!drawer || $('hp-v25-sync-panel')) return;
      var html='<div id="hp-v25-sync-panel" class="alert blue" style="margin-bottom:12px"><div style="font-weight:900;margin-bottom:8px">رابط Apps Script المستخدم للمزامنة</div><div dir="ltr" style="word-break:break-all;font-size:14px;background:#fff;border:3px solid #000;border-radius:12px;padding:10px;margin-bottom:10px">'+esc(HP_V25_SYNC_URL)+'</div><div class="btn-row"><button class="btn green" onclick="refreshCloudData(true)"><i class="ti ti-refresh"></i> تحديث البيانات من Google الآن</button><button class="btn blue" onclick="manualSync()"><i class="ti ti-cloud-up"></i> رفع آخر تعديل الآن</button></div></div>';
      var grid=drawer.querySelector('.cloud-status-grid');
      if(grid) grid.insertAdjacentHTML('beforebegin',html); else drawer.insertAdjacentHTML('afterbegin',html);
    }catch(e){}
  }
  var baseOpenSync=window.openSync;
  window.openSync=function(){var r=baseOpenSync?baseOpenSync.apply(this,arguments):undefined; setTimeout(function(){addSyncPanel(); fixTopLogo();},0); return r;};

  fixTopLogo();
  document.addEventListener('DOMContentLoaded',function(){fixTopLogo(); setTimeout(fixTopLogo,400)});
})();


/* ===== END SOURCE: 06-delete-doclogo-sync.js ===== */



/* ===== BEGIN SOURCE: 07-doc-client-numbering.js ===== */

/* Haydar Pack V33 Stage 5 split file: 07-doc-client-numbering.js. Preserves execution order from stable version. */
/* ===== Haydar Pack V26: document header + client numbering only ===== */
(function(){
  'use strict';
  var VER='26';
  function byId(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function n(v){var x=parseFloat(v);return isNaN(x)?0:x}
  function money(v){try{return n(v).toLocaleString('ar-EG',{minimumFractionDigits:0,maximumFractionDigits:2})+' ج'}catch(e){return String(n(v))+' ج'}}
  function count(v){try{return Math.round(n(v)).toLocaleString('ar-EG')}catch(e){return String(Math.round(n(v)))}}
  function today(){try{return todayStr()}catch(e){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day}}
  function logo(){return 'hp-logo-v3-192.png?v='+VER}
  function getClient(id){return (window.DB&&DB.clients||[]).find(function(c){return c.id===id})||{name:'',phone:'',addr:'',debt:0}}
  function getFactory(id){return (window.DB&&DB.factories||[]).find(function(f){return f.id===id})||{name:'',phone:'',debt:0}}
  function qty(o,mode){return mode==='quote'?n(o.qty):(typeof window.billQty==='function'?billQty(o):n(o.fQty)||n(o.qty))}
  function discount(o){return Math.max(0,n(o&&(o.invoiceDiscount!=null?o.invoiceDiscount:o.discount)))}
  function itemName(o){var w=String(o.width||'').trim(),h=String(o.height||'').trim();if(w||h)return 'شنطة عرض '+(w||'—')+' × ارتفاع '+(h||'—');return o.name||o.size||o.type||'شنطة'}
  function docNo(prefix){return prefix+'-'+today().replace(/-/g,'')+'-'+String(Date.now()).slice(-5)}
  function checked(cls){return [].slice.call(document.querySelectorAll('.'+cls+':checked')).map(function(x){return x.value})}
  function clientOrders(cid){var all=(DB.orders||[]).filter(function(o){return o.clientId===cid}),ids=checked('client-order-check');return ids.length?all.filter(function(o){return ids.indexOf(o.id)>=0}):all}
  function factoryOrders2(fid){var all=(DB.orders||[]).filter(function(o){return o.factoryId===fid}),ids=checked('factory-order-check');return ids.length?all.filter(function(o){return ids.indexOf(o.id)>=0}):all}
  function header(){return '<div class="hp-doc-brand"><div class="hp-brand-en"><img src="'+logo()+'"><div><div class="hp-en-title">Haydarpack</div><div class="hp-en-sub">Eco-friendly bags &amp; printed packaging</div></div></div><div class="hp-brand-ar"><div><div class="hp-ar-title">حيدر باك</div><div class="hp-ar-sub">شنط قماش غير منسوجة صديقة للبيئة</div></div><img src="'+logo()+'"></div></div>'}
  function meta(rows){return '<div class="hp-doc-meta">'+rows.map(function(r){return '<div><b>'+esc(r[0])+'</b><span>'+esc(r[1]||'')+'</span></div>'}).join('')+'</div>'}
  function css(){return '@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,Tahoma,sans-serif;color:#000;background:#fff;margin:0;font-size:10.5px}.sheet{width:100%;padding:1mm}.hp-doc-brand{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #0b2442;padding-bottom:5px;margin-bottom:8px}.hp-brand-en,.hp-brand-ar{display:flex;align-items:center;gap:9px;min-width:275px}.hp-brand-en{direction:ltr;text-align:left;justify-content:flex-start}.hp-brand-ar{direction:rtl;text-align:right;justify-content:flex-start}.hp-brand-en img,.hp-brand-ar img{width:70px;height:70px;object-fit:contain}.hp-en-title{font-size:25px;line-height:1;font-weight:900;color:#0b2442}.hp-en-sub{font-size:11px;font-weight:900;color:#111;margin-top:6px}.hp-ar-title{font-size:27px;line-height:1;font-weight:900;color:#ad7b25}.hp-ar-sub{font-size:12px;font-weight:900;color:#111;margin-top:6px;white-space:nowrap}.doc-title{text-align:center;font-size:20px;font-weight:900;text-decoration:underline;margin:4px 0 9px}.hp-doc-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px 18px;margin-bottom:10px}.hp-doc-meta div{display:flex;justify-content:space-between;border-bottom:1px dotted #777;padding:3px 0}.hp-doc-meta b{min-width:78px}.main-table,.totals,.extra-table{width:100%;border-collapse:collapse;table-layout:auto}th,td{border:1.2px solid #000;padding:4px 3px;text-align:center;vertical-align:middle;white-space:normal}th{background:#d9d9d9;font-weight:900}.totals{width:320px;margin-top:8px;margin-right:auto}.totals td{font-weight:900}.section-title{font-size:13px;font-weight:900;margin:12px 0 5px;text-decoration:underline}.terms{font-size:11px;font-weight:900;line-height:1.6;margin-top:10mm;text-align:right}.note{font-size:11px;font-weight:900;line-height:1.5;margin:8px 0}.foot{position:fixed;bottom:5mm;left:8mm;right:8mm;font-size:9px;display:flex;justify-content:space-between;border-top:1px solid #000;padding-top:3px}.no-print{position:fixed;top:6px;left:6px;display:flex;gap:6px;z-index:10}.no-print button{font-size:13px;padding:8px 12px;border:2px solid #000;background:#fff;font-weight:900}@media print{.no-print{display:none}.sheet{padding:0}}'}
  function base(title,no,metaHtml,head,body,totals,extra){return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>'+esc(no+' - '+title+' - Haydar Pack')+'</title><style>'+css()+'</style></head><body><div class="no-print"><button onclick="window.print()">طباعة / حفظ PDF</button><button onclick="window.close()">إغلاق</button></div><div class="sheet">'+header()+'<div class="doc-title">'+esc(title)+'</div>'+metaHtml+'<table class="main-table"><thead>'+head+'</thead><tbody>'+body+'</tbody></table>'+totals+(extra||'')+'</div><div class="foot"><span>Haydar Pack</span><span>'+esc(no)+'</span><span>Generated: '+esc(today())+'</span></div><script>setTimeout(function(){try{window.print()}catch(e){}},450);<\/script></body></html>'}
  function open(html){var w=window.open('','_blank');if(!w){try{toast('المتصفح منع فتح نافذة الطباعة. اسمح بالـ Popups وجرب تاني.')}catch(e){}return}w.document.open();w.document.write(html);w.document.close()}
  function rowsClient(orders,mode){var body='',gross=0,disc=0,net=0;orders.forEach(function(o){var q=qty(o,mode),price=n(o.price),bag=q*price,ak=n(o.aklashe),g=bag+ak,d=discount(o),after=Math.max(0,g-d);gross+=g;disc+=d;net+=after;body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(itemName(o))+'</td><td>'+esc(o.type||'')+'</td><td>'+esc(o.color||'')+'</td><td>'+esc(o.handle||'بدون')+'</td><td>'+esc(o.colorCount||o.colorsCount||o.printColors||'1')+'</td><td>'+esc(o.face||o.printFace||'وجه واحد')+'</td><td>'+count(q)+'</td><td>'+money(price)+'</td><td>'+money(bag)+'</td></tr>';if(ak>0)body+='<tr><td>'+esc(o.code||'')+'</td><td>اكلاشيه</td><td>اكلاشيه</td><td>بدون</td><td>بدون</td><td>-</td><td>-</td><td>1</td><td>'+money(ak)+'</td><td>'+money(ak)+'</td></tr>'});return{body:body,gross:gross,disc:disc,net:net}}
  function printClientDoc(cid,mode){var orders=clientOrders(cid);if(!orders.length){try{toast('لا توجد أوردرات للعميل')}catch(e){}return}var c=getClient(cid),no=docNo(mode==='quote'?'QT':'INV'),r=rowsClient(orders,mode),dep=orders.reduce(function(s,o){return s+n(o.deposit)},0),head='<tr><th>كود الأوردر</th><th>اسم الصنف</th><th>نوع الشنطة</th><th>لون الشنطة</th><th>لون اليد</th><th>عدد الألوان</th><th>وجه</th><th>الكمية</th><th>سعر الشنطة</th><th>القيمة</th></tr>',tot='<table class="totals"><tr><td>الإجمالي قبل الخصم</td><td>'+money(r.gross)+'</td></tr><tr><td>خصم الفاتورة</td><td>'+money(r.disc)+'</td></tr><tr><td>الإجمالي بعد الخصم</td><td>'+money(r.net)+'</td></tr>'+(mode==='invoice'?'<tr><td>العربون المسجل</td><td>'+money(dep)+'</td></tr><tr><td>الصافي المستحق</td><td>'+money(Math.max(0,r.net-dep))+'</td></tr>':'')+'</table>',extra=mode==='quote'?'<div class="terms"><b>ملاحظات عرض السعر:</b><br>برجاء مراجعة المقاسات والالوان والكمية والاسعار جيدا<br>قد يصل معدل العجز او الزيادة الى نسبة 3 %<br>مدة تسليم الاوردر من 10 الى 15 يوم من تاريخ دفع العربون<br>يتم التشغيل بعد دفع 50 % عربون من قيمة عرض السعر</div>':'';open(base(mode==='quote'?'عرض سعر':'فاتورة بيع',no,meta([['التاريخ',today()],['رقم المستند',no],['العميل',c.name],['رقم الهاتف',c.phone],['العنوان',c.addr]]),head,r.body,tot,extra))}
  function printClientStatement(cid){var orders=clientOrders(cid);if(!orders.length){try{toast('لا توجد أوردرات للعميل')}catch(e){}return}var c=getClient(cid),no=docNo('CS'),isFull=!checked('client-order-check').length,body='',gross=0,disc=0,net=0,deps=0;orders.forEach(function(o){var g=qty(o,'invoice')*n(o.price)+n(o.aklashe),d=discount(o),after=Math.max(0,g-d),dep=n(o.deposit);gross+=g;disc+=d;net+=after;deps+=dep;body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(o.date||'')+'</td><td>'+esc(itemName(o))+'</td><td>'+count(qty(o,'invoice'))+'</td><td>'+money(g)+'</td><td>'+money(d)+'</td><td>'+money(after)+'</td><td>'+money(dep)+'</td><td>'+money(Math.max(0,after-dep))+'</td><td>'+esc(o.status||'')+'</td></tr>'});var pays=isFull?(DB.payments||[]).filter(function(p){return p.clientId===cid}):[],paid=pays.reduce(function(s,p){return s+n(p.amount)},0),oldDebt=isFull?n(c.debt):0,remain=net+oldDebt-deps-paid,head='<tr><th>كود الأوردر</th><th>التاريخ</th><th>الصنف</th><th>الكمية</th><th>قبل الخصم</th><th>الخصم</th><th>بعد الخصم</th><th>العربون</th><th>باقي الأوردر</th><th>الحالة</th></tr>',tot='<table class="totals"><tr><td>إجمالي قبل الخصم</td><td>'+money(gross)+'</td></tr><tr><td>إجمالي الخصومات</td><td>'+money(disc)+'</td></tr><tr><td>إجمالي بعد الخصم</td><td>'+money(net)+'</td></tr><tr><td>مديونية قديمة محتسبة</td><td>'+money(oldDebt)+'</td></tr><tr><td>عربون الأوردرات</td><td>'+money(deps)+'</td></tr><tr><td>دفعات عامة محتسبة</td><td>'+money(paid)+'</td></tr><tr><td>المتبقى</td><td>'+money(remain)+'</td></tr></table>',extra=(isFull?'':'<div class="note">تنبيه: الكشف مبني على الأوردرات المحددة فقط، لذلك لم يتم احتساب الدفعات العامة أو المديونية القديمة.</div>')+(pays.length?'<div class="section-title">الدفعات العامة المحتسبة</div><table class="extra-table"><thead><tr><th>التاريخ</th><th>المبلغ</th><th>ملاحظة</th></tr></thead><tbody>'+pays.map(function(p){return '<tr><td>'+esc(p.date||'')+'</td><td>'+money(p.amount)+'</td><td>'+esc(p.note||'')+'</td></tr>'}).join('')+'</tbody></table>':'');open(base('كشف حساب عميل',no,meta([['التاريخ',today()],['رقم الكشف',no],['العميل',c.name],['رقم الهاتف',c.phone],['العنوان',c.addr]]),head,body,tot,extra))}
  function printFactoryStatement(fid){var orders=factoryOrders2(fid);if(!orders.length){try{toast('لا توجد أوردرات للمصنع')}catch(e){}return}var f=getFactory(fid),no=docNo('FS'),isFull=!checked('factory-order-check').length,body='',total=0;orders.forEach(function(o){var c=getClient(o.clientId),q=n(o.fQty)||n(o.qty),price=n(o.fPrice),line=q*price,ak=n(o.fAk);total+=line+ak;body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(c.name||'')+'</td><td>'+esc(itemName(o))+'</td><td>'+esc(o.type||'')+'</td><td>'+esc(o.size||((o.width||o.height)?((o.width||'—')+' × '+(o.height||'—')):''))+'</td><td>'+esc(o.color||'')+'</td><td>'+esc(o.handle||'بدون')+'</td><td>'+count(q)+'</td><td>'+money(price)+'</td><td>'+money(line)+'</td></tr>';if(ak>0)body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(c.name||'')+'</td><td>اكلاشيه</td><td>اكلاشيه</td><td>-</td><td>بدون</td><td>بدون</td><td>1</td><td>'+money(ak)+'</td><td>'+money(ak)+'</td></tr>'});var trs=isFull?(DB.transfers||[]).filter(function(t){return t.factoryId===fid}):[],paid=trs.reduce(function(s,t){return s+n(t.amount)},0),oldDebt=isFull?n(f.debt):0,remain=total+oldDebt-paid,head='<tr><th>كود الأوردر</th><th>العميل</th><th>الصنف</th><th>النوع</th><th>المقاس</th><th>لون الشنطة</th><th>لون اليد</th><th>الكمية</th><th>سعر المصنع</th><th>القيمة</th></tr>',tot='<table class="totals"><tr><td>إجمالي المصنع</td><td>'+money(total)+'</td></tr><tr><td>مديونية قديمة محتسبة</td><td>'+money(oldDebt)+'</td></tr><tr><td>تحويلات محتسبة</td><td>'+money(paid)+'</td></tr><tr><td>المتبقى</td><td>'+money(remain)+'</td></tr></table>',extra=(isFull?'':'<div class="note">تنبيه: الكشف مبني على الأوردرات المحددة فقط، لذلك لم يتم احتساب التحويلات العامة أو المديونية القديمة.</div>')+(trs.length?'<div class="section-title">تحويلات المصنع المحتسبة</div><table class="extra-table"><thead><tr><th>التاريخ</th><th>طريقة التحويل</th><th>المبلغ</th><th>ملاحظة</th></tr></thead><tbody>'+trs.map(function(t){return '<tr><td>'+esc(t.date||'')+'</td><td>'+esc(t.type||'')+'</td><td>'+money(t.amount)+'</td><td>'+esc(t.note||'')+'</td></tr>'}).join('')+'</tbody></table>':'');open(base('كشف حساب مصنع',no,meta([['التاريخ',today()],['رقم الكشف',no],['المصنع',f.name],['رقم الهاتف',f.phone||''],['الفترة',isFull?'كل البيانات':'المحدد فقط']]),head,body,tot,extra))}
  window.printSelectedClientQuote=function(cid){printClientDoc(cid,'quote')};
  window.printSelectedClientInvoice=function(cid){printClientDoc(cid,'invoice')};
  window.printSelectedClientStatement=function(cid){printClientStatement(cid)};
  window.printSelectedFactoryStatement=function(fid){printFactoryStatement(fid)};
  function activity(cid){var mx=0;(DB.orders||[]).forEach(function(o){if(o.clientId===cid){mx=Math.max(mx,Date.parse(o.updatedAt||o.createdAt||o.deliveredAt||o.date||'')||0)}});(DB.payments||[]).forEach(function(p){if(p.clientId===cid){mx=Math.max(mx,Date.parse(p.updatedAt||p.createdAt||p.date||'')||0)}});return mx}
  window.renderClients=function(){var q=(byId('q-clients')?byId('q-clients').value:'').toLowerCase(),clients=(DB.clients||[]).filter(function(c){return !q||String(c.name||'').toLowerCase().includes(q)||String(c.phone||'').includes(q)});clients.sort(function(a,b){var d=activity(b.id)-activity(a.id);if(d)return d;return String(a.name||'').localeCompare(String(b.name||''),'ar')});var el=byId('clients-list');if(!el)return;el.innerHTML=clients.length?clients.map(function(c,i){var bal=typeof clientBalance==='function'?clientBalance(c.id):0,total=(typeof clientTotal==='function'?clientTotal(c.id):0)+n(c.debt),paid=typeof clientPaid==='function'?clientPaid(c.id):0,pct=total>0?Math.min(100,Math.round(paid/total*100)):0,ords=(DB.orders||[]).filter(function(o){return o.clientId===c.id}).length;return '<div class="card clickable" onclick="openClientDetail(\''+c.id+'\')"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px"><div style="display:flex;align-items:center;gap:10px"><div class="avatar av-blue">'+esc((c.name||'?').charAt(0))+'</div><div><div class="row-name"><span class="badge bg-blue" style="margin-left:6px">#'+(i+1)+'</span>'+esc(c.name||'')+'</div><div class="row-sub">'+esc(c.phone||'بدون هاتف')+'</div></div></div><span class="badge '+(bal>0?'bg-red':bal<0?'bg-green':'bg-gray')+'">'+(bal>0?money(bal)+' باقي':bal<0?money(-bal)+' رصيد':'مكتمل')+'</span></div><div class="prog"><div class="prog-fill" style="width:'+pct+'%"></div></div><div class="tiny muted" style="margin-top:4px">'+pct+'% مدفوع · '+ords+' أوردر</div></div>'}).join(''):'<div class="empty"><i class="ti ti-users"></i><p>لا يوجد عملاء</p></div>'}
  try{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){try{renderClients()}catch(e){}});else renderClients()}catch(e){}
})();


/* ===== END SOURCE: 07-doc-client-numbering.js ===== */



/* ===== BEGIN SOURCE: 08-doc-header-client-profit.js ===== */

/* Haydar Pack V33 Stage 5 split file: 08-doc-header-client-profit.js. Preserves execution order from stable version. */
/* ===== Haydar Pack V27: outer document header + client profit details ===== */
(function(){
  'use strict';
  var VER='27';
  var LOGO='hp-logo-v3-192.png?v='+VER;
  function byId(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function n(v){var x=parseFloat(v);return isNaN(x)?0:x}
  function money(v){try{return n(v).toLocaleString('ar-EG',{minimumFractionDigits:0,maximumFractionDigits:2})+' ج'}catch(e){return String(n(v))+' ج'}}
  function count(v){try{return Math.round(n(v)).toLocaleString('ar-EG')}catch(e){return String(Math.round(n(v)))}}
  function today(){try{return todayStr()}catch(e){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day}}
  function docNo(prefix){return prefix+'-'+today().replace(/-/g,'')+'-'+String(Date.now()).slice(-5)}
  function getClient(id){return (window.DB&&DB.clients||[]).find(function(c){return c.id===id})||{id:id,name:'',phone:'',addr:'',debt:0}}
  function getFactory(id){return (window.DB&&DB.factories||[]).find(function(f){return f.id===id})||{id:id,name:'',phone:'',debt:0}}
  function bill(o,mode){return mode==='quote'?n(o&&o.qty):(typeof window.billQty==='function'?billQty(o):n(o&&o.fQty)||n(o&&o.qty))}
  function discount(o){return Math.max(0,n(o&&(o.invoiceDiscount!=null?o.invoiceDiscount:o.discount)))}
  function grossClient(o){return bill(o,'invoice')*n(o&&o.price)+n(o&&o.aklashe)}
  function netClient(o){return Math.max(0,grossClient(o)-discount(o))}
  function factoryTotal(o){try{return factoryTotalForOrder(o)}catch(e){return n(o&&o.fQty)*n(o&&o.fPrice)+n(o&&o.fAk)}}
  function orderExpenses(o){return (DB.expenses||[]).filter(function(e){return e.orderId===(o&&o.id)}).reduce(function(s,e){return s+n(e.amount)},0)}
  function orderProfit(o){return netClient(o)-factoryTotal(o)-orderExpenses(o)}
  function status(st){try{return statusBadge(st)}catch(e){return '<span class="badge bg-gray">'+esc(st||'')+'</span>'}}
  function itemName(o){var w=String(o&&o.width||'').trim(),h=String(o&&o.height||'').trim();if(w||h)return 'شنطة عرض '+(w||'—')+' × ارتفاع '+(h||'—');return (o&&o.name)||((o&&o.size)||((o&&o.type)||'شنطة'))}
  function selectedIds(cls){return [].slice.call(document.querySelectorAll('.'+cls+':checked')).map(function(x){return x.value})}
  function clientOrders(cid){var all=(DB.orders||[]).filter(function(o){return o.clientId===cid}),ids=selectedIds('client-order-check');return ids.length?all.filter(function(o){return ids.indexOf(o.id)>=0}):all}
  function factoryOrders(fid){var all=(DB.orders||[]).filter(function(o){return o.factoryId===fid}),ids=selectedIds('factory-order-check');return ids.length?all.filter(function(o){return ids.indexOf(o.id)>=0}):all}
  function openDoc(html){var w=window.open('','_blank'); if(!w){try{toast('المتصفح منع فتح نافذة الطباعة. اسمح بالـ Popups وجرب تاني.')}catch(e){} return;} w.document.open(); w.document.write(html); w.document.close();}
  function meta(rows){return '<div class="hp-doc-meta">'+rows.map(function(r){return '<div><b>'+esc(r[0])+'</b><span>'+esc(r[1]||'')+'</span></div>'}).join('')+'</div>'}
  function docCss(){return '@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,Tahoma,sans-serif;color:#000;background:#fff;margin:0;font-size:10.5px}.sheet{width:100%;padding:1mm}.hp-doc-brand{direction:ltr;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #0b2442;padding-bottom:6px;margin-bottom:8px;width:100%;gap:16px}.hp-brand-en{direction:ltr;text-align:left;display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:10px;min-width:310px;flex:0 0 auto}.hp-brand-ar{direction:ltr;text-align:right;display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:10px;min-width:310px;flex:0 0 auto}.hp-brand-en img,.hp-brand-ar img{width:74px;height:74px;object-fit:contain;flex:0 0 auto}.hp-ar-copy{direction:rtl;text-align:right}.hp-en-title{font-size:27px;line-height:1;font-weight:900;color:#0b2442;letter-spacing:.2px}.hp-en-sub{font-size:11px;font-weight:900;color:#111;margin-top:7px;white-space:nowrap}.hp-ar-title{font-size:29px;line-height:1;font-weight:900;color:#ad7b25}.hp-ar-sub{font-size:12px;font-weight:900;color:#111;margin-top:7px;white-space:nowrap}.doc-title{text-align:center;font-size:20px;font-weight:900;text-decoration:underline;margin:4px 0 9px}.hp-doc-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px 18px;margin-bottom:10px}.hp-doc-meta div{display:flex;justify-content:space-between;border-bottom:1px dotted #777;padding:3px 0}.hp-doc-meta b{min-width:78px}.main-table,.totals,.extra-table{width:100%;border-collapse:collapse;table-layout:auto}th,td{border:1.2px solid #000;padding:4px 3px;text-align:center;vertical-align:middle;white-space:normal}th{background:#d9d9d9;font-weight:900}.totals{width:330px;margin-top:8px;margin-right:auto}.totals td{font-weight:900}.section-title{font-size:13px;font-weight:900;margin:12px 0 5px;text-decoration:underline}.terms,.note{font-size:11px;font-weight:900;line-height:1.6;margin-top:8mm;text-align:right}.foot{position:fixed;bottom:5mm;left:8mm;right:8mm;font-size:9px;display:flex;justify-content:space-between;border-top:1px solid #000;padding-top:3px}.no-print{position:fixed;top:6px;left:6px;display:flex;gap:6px;z-index:10}.no-print button{font-size:13px;padding:8px 12px;border:2px solid #000;background:#fff;font-weight:900}@media print{.no-print{display:none}.sheet{padding:0}}'}
  function docHeader(){return '<div class="hp-doc-brand"><div class="hp-brand-en"><img src="'+LOGO+'" onerror="this.onerror=null;this.src=\'hp-logo-v3-192.png?v='+VER+'\'"><div><div class="hp-en-title">Haydarpack</div><div class="hp-en-sub">Eco-friendly bags &amp; printed packaging</div></div></div><div class="hp-brand-ar"><div class="hp-ar-copy"><div class="hp-ar-title">حيدر باك</div><div class="hp-ar-sub">شنط قماش غير منسوجة صديقة للبيئة</div></div><img src="'+LOGO+'" onerror="this.onerror=null;this.src=\'hp-logo-v3-192.png?v='+VER+'\'"></div></div>'}
  function docHtml(title,no,metaHtml,head,body,totals,extra){return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>'+esc(no+' - '+title+' - Haydar Pack')+'</title><style>'+docCss()+'</style></head><body><div class="no-print"><button onclick="window.print()">طباعة / حفظ PDF</button><button onclick="window.close()">إغلاق</button></div><div class="sheet">'+docHeader()+'<div class="doc-title">'+esc(title)+'</div>'+metaHtml+'<table class="main-table"><thead>'+head+'</thead><tbody>'+body+'</tbody></table>'+totals+(extra||'')+'</div><div class="foot"><span>Haydar Pack</span><span>'+esc(no)+'</span><span>Generated: '+esc(today())+'</span></div><script>setTimeout(function(){try{window.print()}catch(e){}},450);<\/script></body></html>'}
  function clientRows(orders,mode){var body='',gross=0,disc=0,net=0;orders.forEach(function(o){var q=bill(o,mode),price=n(o.price),bag=q*price,ak=n(o.aklashe),g=bag+ak,d=discount(o),after=Math.max(0,g-d);gross+=g;disc+=d;net+=after;body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(itemName(o))+'</td><td>'+esc(o.type||'')+'</td><td>'+esc(o.color||'')+'</td><td>'+esc(o.handle||'بدون')+'</td><td>'+esc(o.colorCount||o.colorsCount||o.printColors||'1')+'</td><td>'+esc(o.face||o.printFace||'وجه واحد')+'</td><td>'+count(q)+'</td><td>'+money(price)+'</td><td>'+money(bag)+'</td></tr>';if(ak>0)body+='<tr><td>'+esc(o.code||'')+'</td><td>اكلاشيه</td><td>اكلاشيه</td><td>بدون</td><td>بدون</td><td>-</td><td>-</td><td>1</td><td>'+money(ak)+'</td><td>'+money(ak)+'</td></tr>'});return{body:body,gross:gross,disc:disc,net:net}}
  function printClientDoc(cid,mode){var orders=clientOrders(cid); if(!orders.length){try{toast('لا توجد أوردرات للعميل')}catch(e){} return;} var c=getClient(cid),no=docNo(mode==='quote'?'QT':'INV'),r=clientRows(orders,mode),dep=orders.reduce(function(s,o){return s+n(o.deposit)},0),head='<tr><th>كود الأوردر</th><th>اسم الصنف</th><th>نوع الشنطة</th><th>لون الشنطة</th><th>لون اليد</th><th>عدد الألوان</th><th>وجه</th><th>الكمية</th><th>سعر الشنطة</th><th>القيمة</th></tr>',tot='<table class="totals"><tr><td>الإجمالي قبل الخصم</td><td>'+money(r.gross)+'</td></tr><tr><td>خصم الفاتورة</td><td>'+money(r.disc)+'</td></tr><tr><td>الإجمالي بعد الخصم</td><td>'+money(r.net)+'</td></tr>'+(mode==='invoice'?'<tr><td>العربون المسجل</td><td>'+money(dep)+'</td></tr><tr><td>الصافي المستحق</td><td>'+money(Math.max(0,r.net-dep))+'</td></tr>':'')+'</table>',extra=mode==='quote'?'<div class="terms"><b>ملاحظات عرض السعر:</b><br>برجاء مراجعة المقاسات والألوان والكمية والأسعار جيدًا<br>قد يصل معدل العجز أو الزيادة إلى نسبة 3%<br>مدة تسليم الأوردر من 10 إلى 15 يوم من تاريخ دفع العربون<br>يتم التشغيل بعد دفع 50% عربون من قيمة عرض السعر</div>':''; openDoc(docHtml(mode==='quote'?'عرض سعر':'فاتورة بيع',no,meta([['التاريخ',today()],['رقم المستند',no],['العميل',c.name],['رقم الهاتف',c.phone],['العنوان',c.addr]]),head,r.body,tot,extra));}
  function printClientStatement(cid){var orders=clientOrders(cid); if(!orders.length){try{toast('لا توجد أوردرات للعميل')}catch(e){} return;} var c=getClient(cid),no=docNo('CS'),isFull=!selectedIds('client-order-check').length,body='',gross=0,disc=0,net=0,deps=0;orders.forEach(function(o){var g=grossClient(o),d=discount(o),after=Math.max(0,g-d),dep=n(o.deposit);gross+=g;disc+=d;net+=after;deps+=dep;body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(o.date||'')+'</td><td>'+esc(itemName(o))+'</td><td>'+count(bill(o,'invoice'))+'</td><td>'+money(g)+'</td><td>'+money(d)+'</td><td>'+money(after)+'</td><td>'+money(dep)+'</td><td>'+money(Math.max(0,after-dep))+'</td><td>'+esc(o.status||'')+'</td></tr>'}); var pays=isFull?(DB.payments||[]).filter(function(p){return p.clientId===cid}):[],paid=pays.reduce(function(s,p){return s+n(p.amount)},0),oldDebt=isFull?n(c.debt):0,remain=net+oldDebt-deps-paid,head='<tr><th>كود الأوردر</th><th>التاريخ</th><th>الصنف</th><th>الكمية</th><th>قبل الخصم</th><th>الخصم</th><th>بعد الخصم</th><th>العربون</th><th>باقي الأوردر</th><th>الحالة</th></tr>',tot='<table class="totals"><tr><td>إجمالي قبل الخصم</td><td>'+money(gross)+'</td></tr><tr><td>إجمالي الخصومات</td><td>'+money(disc)+'</td></tr><tr><td>إجمالي بعد الخصم</td><td>'+money(net)+'</td></tr><tr><td>مديونية قديمة محتسبة</td><td>'+money(oldDebt)+'</td></tr><tr><td>عربون الأوردرات</td><td>'+money(deps)+'</td></tr><tr><td>دفعات عامة محتسبة</td><td>'+money(paid)+'</td></tr><tr><td>المتبقى</td><td>'+money(remain)+'</td></tr></table>',extra=(isFull?'':'<div class="note">تنبيه: الكشف مبني على الأوردرات المحددة فقط، لذلك لم يتم احتساب الدفعات العامة أو المديونية القديمة.</div>')+(pays.length?'<div class="section-title">الدفعات العامة المحتسبة</div><table class="extra-table"><thead><tr><th>التاريخ</th><th>المبلغ</th><th>ملاحظة</th></tr></thead><tbody>'+pays.map(function(p){return '<tr><td>'+esc(p.date||'')+'</td><td>'+money(p.amount)+'</td><td>'+esc(p.note||'')+'</td></tr>'}).join('')+'</tbody></table>':''); openDoc(docHtml('كشف حساب عميل',no,meta([['التاريخ',today()],['رقم الكشف',no],['العميل',c.name],['رقم الهاتف',c.phone],['العنوان',c.addr]]),head,body,tot,extra));}
  function printFactoryStatement(fid){var orders=factoryOrders(fid); if(!orders.length){try{toast('لا توجد أوردرات للمصنع')}catch(e){} return;} var f=getFactory(fid),no=docNo('FS'),isFull=!selectedIds('factory-order-check').length,body='',total=0;orders.forEach(function(o){var c=getClient(o.clientId),q=n(o.fQty)||n(o.qty),price=n(o.fPrice),line=q*price,ak=n(o.fAk);total+=line+ak;body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(c.name||'')+'</td><td>'+esc(itemName(o))+'</td><td>'+esc(o.type||'')+'</td><td>'+esc(o.size||((o.width||o.height)?((o.width||'—')+' × '+(o.height||'—')):''))+'</td><td>'+esc(o.color||'')+'</td><td>'+esc(o.handle||'بدون')+'</td><td>'+count(q)+'</td><td>'+money(price)+'</td><td>'+money(line)+'</td></tr>';if(ak>0)body+='<tr><td>'+esc(o.code||'')+'</td><td>'+esc(c.name||'')+'</td><td>اكلاشيه</td><td>اكلاشيه</td><td>-</td><td>بدون</td><td>بدون</td><td>1</td><td>'+money(ak)+'</td><td>'+money(ak)+'</td></tr>'}); var trs=isFull?(DB.transfers||[]).filter(function(t){return t.factoryId===fid}):[],paid=trs.reduce(function(s,t){return s+n(t.amount)},0),oldDebt=isFull?n(f.debt):0,remain=total+oldDebt-paid,head='<tr><th>كود الأوردر</th><th>العميل</th><th>الصنف</th><th>النوع</th><th>المقاس</th><th>لون الشنطة</th><th>لون اليد</th><th>الكمية</th><th>سعر المصنع</th><th>القيمة</th></tr>',tot='<table class="totals"><tr><td>إجمالي المصنع</td><td>'+money(total)+'</td></tr><tr><td>مديونية قديمة محتسبة</td><td>'+money(oldDebt)+'</td></tr><tr><td>تحويلات محتسبة</td><td>'+money(paid)+'</td></tr><tr><td>المتبقى</td><td>'+money(remain)+'</td></tr></table>',extra=(isFull?'':'<div class="note">تنبيه: الكشف مبني على الأوردرات المحددة فقط، لذلك لم يتم احتساب التحويلات العامة أو المديونية القديمة.</div>')+(trs.length?'<div class="section-title">تحويلات المصنع المحتسبة</div><table class="extra-table"><thead><tr><th>التاريخ</th><th>طريقة التحويل</th><th>المبلغ</th><th>ملاحظة</th></tr></thead><tbody>'+trs.map(function(t){return '<tr><td>'+esc(t.date||'')+'</td><td>'+esc(t.type||'')+'</td><td>'+money(t.amount)+'</td><td>'+esc(t.note||'')+'</td></tr>'}).join('')+'</tbody></table>':''); openDoc(docHtml('كشف حساب مصنع',no,meta([['التاريخ',today()],['رقم الكشف',no],['المصنع',f.name],['رقم الهاتف',f.phone||''],['الفترة',isFull?'كل البيانات':'المحدد فقط']]),head,body,tot,extra));}
  window.printSelectedClientQuote=function(cid){printClientDoc(cid,'quote')};
  window.printSelectedClientInvoice=function(cid){printClientDoc(cid,'invoice')};
  window.printSelectedClientStatement=function(cid){printClientStatement(cid)};
  window.printSelectedFactoryStatement=function(fid){printFactoryStatement(fid)};
  window.openClientDetail=function(cid){var c=getClient(cid); if(!c||!c.id){return;} var orders=(DB.orders||[]).filter(function(o){return o.clientId===cid}).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))}); var payments=(DB.payments||[]).filter(function(p){return p.clientId===cid}).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))}); var total=typeof clientTotal==='function'?clientTotal(cid)+n(c.debt):0, paid=typeof clientPaid==='function'?clientPaid(cid):0, bal=typeof clientBalance==='function'?clientBalance(cid):0, profitSum=orders.reduce(function(s,o){return s+orderProfit(o)},0); var orderHtml=orders.length?orders.map(function(o){var p=orderProfit(o), exp=orderExpenses(o); return '<div class="row"><label class="doc-select-row" onclick="event.stopPropagation()"><input type="checkbox" class="client-order-check" value="'+esc(o.id)+'"><span><span class="row-name">'+esc(o.code||'')+' - '+esc(itemName(o))+' '+status(o.status)+'</span><span class="row-sub">'+esc(o.date||'')+' · نهائي '+count(bill(o,'invoice'))+' · مصنع '+money(factoryTotal(o))+(exp>0?' · مصاريف '+money(exp):'')+'</span></span></label><div style="text-align:left"><div class="row-val">'+money(netClient(o))+'</div><div class="tiny '+(p>=0?'success':'danger')+'">صافي الربح: '+money(p)+'</div><button class="btn small" onclick="closeDrawer(\'dr-client-detail\');openOrderDetail(\''+esc(o.id)+'\')">فتح</button></div></div>'}).join(''):'<p class="muted tiny">لا توجد أوردرات</p>'; var payHtml=payments.length?payments.map(function(p){return '<div class="row"><div><div class="row-name">'+money(p.amount)+'</div><div class="row-sub">'+esc(p.date||'')+(p.note?' · '+esc(p.note):'')+'</div>'+(typeof receiptLink==='function'?receiptLink(p.receipt):'')+'</div><span class="badge bg-green">مدفوع</span></div>'}).join(''):'<p class="muted tiny">لا توجد دفعات</p>'; var body=byId('client-detail-body'); if(!body)return; body.innerHTML='<div class="drawer-handle"></div><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div class="avatar av-blue" style="width:56px;height:56px;font-size:25px">'+esc((c.name||'?').charAt(0))+'</div><div><div class="drawer-title" style="margin:0">'+esc(c.name||'')+'</div><div class="row-sub">'+esc(c.phone||'')+(c.addr?' · '+esc(c.addr):'')+'</div></div></div><div class="stat-grid"><div class="stat-box blue"><div class="sl">إجمالي الطلبات</div><div class="sv">'+money(total)+'</div></div><div class="stat-box green"><div class="sl">المدفوع شامل العربون</div><div class="sv">'+money(paid)+'</div></div><div class="stat-box '+(bal>0?'red':'green')+'"><div class="sl">الرصيد</div><div class="sv">'+(bal>0?money(bal)+' باقي':bal<0?money(-bal)+' رصيد':'الحساب منتهي')+'</div></div><div class="stat-box amber"><div class="sl">مجموع صافي ربحك</div><div class="sv">'+money(profitSum)+'</div></div></div><button class="btn green full" style="margin-bottom:12px" onclick="closeDrawer(\'dr-client-detail\');openPaymentForm(\''+esc(cid)+'\')"><i class="ti ti-plus"></i> تسجيل دفعة</button><div class="sec-label">اختيار أوردرات لعرض السعر أو الفاتورة</div><div class="doc-action-bar"><button class="btn" onclick="toggleClientOrdersSelection(\''+esc(cid)+'\')"><i class="ti ti-checks"></i> تحديد/إلغاء الكل</button><button class="btn blue" onclick="printSelectedClientQuote(\''+esc(cid)+'\')"><i class="ti ti-file-dollar"></i> عرض سعر للمحدد</button><button class="btn green" onclick="printSelectedClientInvoice(\''+esc(cid)+'\')"><i class="ti ti-file-invoice"></i> فاتورة للمحدد</button><button class="btn amber" onclick="printSelectedClientStatement(\''+esc(cid)+'\')"><i class="ti ti-file-description"></i> كشف حساب عميل</button><button class="btn" onclick="exportClientReportExcel(\''+esc(cid)+'\')"><i class="ti ti-file-spreadsheet"></i> تقرير Excel</button></div><div class="card">'+orderHtml+'</div><div class="sec-label">الدفعات ('+payments.length+')</div><div class="card">'+payHtml+'</div><button class="btn red-out full" style="margin-top:10px" onclick="deleteClient(\''+esc(cid)+'\')"><i class="ti ti-trash"></i> حذف العميل نهائيًا</button><button class="btn full" style="margin-top:10px" onclick="closeDrawer(\'dr-client-detail\')">إغلاق</button>'; if(typeof openDrawer==='function')openDrawer('dr-client-detail');};

  function hpClientOptionLabel(c,i){return String(i+1)+'- '+(c&&c.name?c.name:'عميل بدون اسم')}
  function hpApplyClientNumbersToOrderSelect(){try{var el=byId('o-client'); if(!el||!window.DB||!DB.clients)return; var current=el.value||''; el.innerHTML='<option value="">— اختر عميل —</option>'+DB.clients.map(function(c,i){return '<option value="'+esc(c.id)+'">'+esc(hpClientOptionLabel(c,i))+'</option>'}).join(''); if(current) el.value=current;}catch(e){}}
  try{var hpOldFillOrderSelects=window.fillOrderSelects; window.fillOrderSelects=function(){if(typeof hpOldFillOrderSelects==='function')hpOldFillOrderSelects(); hpApplyClientNumbersToOrderSelect();};}catch(e){}

  try{var box=document.querySelector('.logo-icon'); if(box){box.innerHTML='<img class="hp-app-logo" src="hp-logo-v3-192.png?v='+VER+'" alt="Haydar Pack" onerror="this.onerror=null;this.src=\'hp-logo-v3-192.png?v='+VER+'\'">';}}catch(e){}
})();


/* ===== END SOURCE: 08-doc-header-client-profit.js ===== */
