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
      if(box){box.innerHTML='<img class="hp-app-logo" src="hp-logo-v3-192.png?v=25" alt="Haydar Pack" onerror="this.onerror=null;this.src=\'icon-192.png?v=25\'">';}
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
