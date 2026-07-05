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
