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
