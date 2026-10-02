"use strict";
const API_URL="https://script.google.com/macros/s/AKfycbwr5ZD74X1UrZD3cJTRD7RaA5pAVKlEbDCPmLLANP3-KXQOCnQQJGfqgb9PjgYbSM1r/exec";
const LOGIN_USERNAME="admin", LOGIN_PASSWORD="krikal123", LOGIN_KEY="krikalLoggedIn";
let inventoryData=[], currentTxnType="sales", filteredData=[];

const $=id=>document.getElementById(id);
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const today=()=>new Date().toISOString().slice(0,10);
const monthStart=()=>today().slice(0,8)+"01";
const key=t=>"krikal_"+t;
const load=t=>JSON.parse(localStorage.getItem(key(t))||"[]");
const save=(t,d)=>localStorage.setItem(key(t),JSON.stringify(d));
const setText=(id,v)=>{if($(id))$(id).textContent=v};

document.addEventListener("DOMContentLoaded",()=>{
  $("loginForm")?.addEventListener("submit",login);
  $("togglePassword")?.addEventListener("click",()=>{$("loginPassword").type=$("loginPassword").type==="password"?"text":"password"});
  $("logoutBtn")?.addEventListener("click",()=>{localStorage.removeItem(LOGIN_KEY);location.reload()});
  document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.page)));
  document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.open)));
  document.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>openTxn(b.dataset.add)));
  $("closeTxn")?.addEventListener("click",closeTxn); $("txnForm")?.addEventListener("submit",saveTxn);
  $("refreshBtn")?.addEventListener("click",()=>{loadInventory();renderAll();});
  $("searchInput")?.addEventListener("input",filterInventory); $("categoryFilter")?.addEventListener("change",filterInventory); $("statusFilter")?.addEventListener("change",filterInventory);
  $("clearFiltersBtn")?.addEventListener("click",()=>{$("searchInput").value="";$("categoryFilter").value="";$("statusFilter").value="";filterInventory()});
  $("exportCsvBtn")?.addEventListener("click",exportInventory);
  $("mobileMenu")?.addEventListener("click",()=>{$("sidebar")?.classList.toggle("open")});
  if(localStorage.getItem(LOGIN_KEY)==="true") showApp(); else $("loginScreen").classList.remove("hidden");
});
function login(e){e.preventDefault();if($("loginUsername").value.trim()===LOGIN_USERNAME&&$("loginPassword").value===LOGIN_PASSWORD){localStorage.setItem(LOGIN_KEY,"true");showApp()}else $("loginError").textContent="Invalid username or password."}
function showApp(){$("loginScreen").classList.add("hidden");$("app").classList.remove("hidden");openPage("home");loadInventory();renderAll()}
function openPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const p=$(page+"Page"); if(p)p.classList.add("active");
  document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  setText("currentPageLabel",({home:"Overview",sales:"Sales",purchase:"Purchase",recharge:"Recharge",expenses:"Expenses",inventory:"Inventory",customers:"Customers",suppliers:"Suppliers"})[page]||"Overview");
  if(page==="customers"||page==="suppliers") renderMasters();
  if(page==="inventory") filterInventory();
  $("sidebar")?.classList.remove("open");
}
async function loadInventory(){
 try{const r=await fetch(API_URL);const j=await r.json();if(j.success){inventoryData=j.data||[];inventoryData=inventoryData.map(x=>({...x,stock:Number(x.stock??x.quantity??0)}));setText("lastUpdated","Synced "+new Date().toLocaleTimeString("en-IN"));populateCategories();filterInventory();renderDashboard()}}
 catch(e){setText("lastUpdated","Offline / sync failed");renderDashboard()}
}
function status(stock){const n=Number(stock||0), limit=5;return n<=0?["Out of Stock","out-stock"]:n<=limit?["Low Stock","low-stock"]:["Available","available"]}
function populateCategories(){const s=$("categoryFilter");if(!s)return;const old=s.value;const cats=[...new Set(inventoryData.map(x=>x.category).filter(Boolean))].sort();s.innerHTML='<option value="">All Categories</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");s.value=old}
function filterInventory(){
 let d=[...inventoryData], q=($("searchInput")?.value||"").toLowerCase(), c=$("categoryFilter")?.value||"", st=$("statusFilter")?.value||"";
 d=d.filter(x=>(!q||`${x.itemName||""} ${x.model||""} ${x.category||""}`.toLowerCase().includes(q))&&(!c||x.category===c)&&(!st||status(x.stock)[1]===st));
 filteredData=d;const body=$("inventoryBody");if(!body)return;
 setText("inventoryCount",`${d.length} items`);
 body.innerHTML=d.length?d.map(x=>{const z=status(x.stock);return `<tr><td><strong>${esc(x.itemName)}</strong><br><small>${esc(x.model||"")}</small></td><td>${esc(x.category||"-")}</td><td>${x.stock}</td><td><span class="status-badge ${z[1]}">${z[0]}</span></td></tr>`}).join(""):'<tr><td colspan="4">No inventory found.</td></tr>';
}
function exportInventory(){const rows=[["Product","Model","Category","Stock","Status"],...filteredData.map(x=>[x.itemName,x.model,x.category,x.stock,status(x.stock)[0]])];const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="krikal-inventory.csv";a.click()}
const types={sales:{title:"Add Sale",ref:"Invoice No.",party:"Customer",type:"Payment / Category"},purchase:{title:"Add Purchase",ref:"Bill No.",party:"Supplier",type:"Category"},recharge:{title:"Add Recharge",ref:"Mobile / Ref",party:"Operator / Customer",type:"Recharge Type"},expense:{title:"Add Expense",ref:"Reference",party:"Paid To",type:"Expense Category"}};
function openTxn(type){currentTxnType=type;const x=types[type];setText("formTitle",x.title);setText("refLabel",x.ref);setText("partyLabel",x.party);setText("typeLabel",x.type);$("txnForm").reset();$("txDate").value=today();$("txnModal").classList.remove("hidden");$("txAmount").focus()}
function closeTxn(){$("txnModal").classList.add("hidden")}
function saveTxn(e){e.preventDefault();const row={id:Date.now(),date:$("txDate").value,ref:$("txRef").value.trim(),party:$("txParty").value.trim(),type:$("txType").value.trim(),amount:Number($("txAmount").value||0)};if(!row.date||row.amount<0)return;const d=load(currentTxnType);d.unshift(row);save(currentTxnType,d);closeTxn();renderAll();openPage(currentTxnType==="expense"?"expenses":currentTxnType);alert("Entry saved successfully")}
function total(t,filter=()=>true){return load(t).filter(filter).reduce((a,x)=>a+Number(x.amount||0),0)}
function completedData(t){return load(t)}
function renderAll(){renderDashboard();["sales","purchase","recharge","expense"].forEach(renderRegister);renderMasters()}
function renderDashboard(){
 const s=total("sales"),p=total("purchase"),r=total("recharge"),e=total("expense");
 setText("kpiSales",money(s));setText("kpiPurchase",money(p));setText("kpiRecharge",money(r));setText("kpiExpense",money(e));
 const counts={available:0,low:0,out:0};inventoryData.forEach(x=>counts[status(x.stock)[1].replace("low-stock","low").replace("out-stock","out")]++);
 setText("bAvail",counts.available);setText("bLow",counts.low);setText("bOut",counts.out);setText("bTotal",inventoryData.length);
 const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10))}
 const vals=days.map(d=>total("sales",x=>x.date===d));const max=Math.max(...vals,1),box=$("bizBars");if(box)box.innerHTML=vals.map((v,i)=>`<div class="biz-bar"><b style="font-size:8px;color:#8fa0b7">${v?money(v):""}</b><i style="height:${Math.max(v?5:2,v/max*85)}%"></i><span>${days[i].slice(5)}</span></div>`).join("");
 const all=[...load("sales").map(x=>({...x,kind:"Sale"})),...load("purchase").map(x=>({...x,kind:"Purchase"})),...load("recharge").map(x=>({...x,kind:"Recharge"})),...load("expense").map(x=>({...x,kind:"Expense"}))].sort((a,b)=>b.id-a.id).slice(0,8);
 $("recentActivity").innerHTML=all.length?all.map(x=>`<div class="biz-row"><span>${esc(x.kind)} · ${esc(x.party||x.ref||"-")} <small>${esc(x.date)}</small></span><b>${money(x.amount)}</b></div>`).join(""):'<div class="biz-row"><span>No transactions yet</span><b>₹0</b></div>';
}
function renderRegister(t){
 const page=t==="expense"?"expenses":t, data=load(t), prefix=t==="expense"?"expense":t;
 setText(prefix+"Today",money(total(t,x=>x.date===today())));setText(prefix+"Month",money(total(t,x=>x.date>=monthStart())));setText(prefix+"Total",money(total(t)));
 const body=$(t+"Body");if(!body)return;setText(t+"Count",`${data.length} entries`);
 body.innerHTML=data.length?data.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.ref||"-")}</td><td>${esc(x.party||"-")}</td><td><strong>${money(x.amount)}</strong></td></tr>`).join(""):'<tr><td colspan="4">No entries yet.</td></tr>';
}
function renderMasters(){
 const customers={};load("sales").forEach(x=>{const n=x.party||"Unknown";customers[n]??={n,c:0,v:0};customers[n].c++;customers[n].v+=x.amount});
 $("customerBody")&&( $("customerBody").innerHTML=Object.values(customers).sort((a,b)=>b.v-a.v).map(x=>`<tr><td>${esc(x.n)}</td><td>${x.c}</td><td>${money(x.v)}</td></tr>`).join("")||'<tr><td colspan="3">No customer data.</td></tr>');
 const suppliers={};load("purchase").forEach(x=>{const n=x.party||"Unknown";suppliers[n]??={n,c:0,v:0};suppliers[n].c++;suppliers[n].v+=x.amount});
 $("supplierBody")&&( $("supplierBody").innerHTML=Object.values(suppliers).sort((a,b)=>b.v-a.v).map(x=>`<tr><td>${esc(x.n)}</td><td>${x.c}</td><td>${money(x.v)}</td></tr>`).join("")||'<tr><td colspan="3">No supplier data.</td></tr>');
}


/* KRIKAL Payments Module */
const PAYMENT_KEY = "krikal_payments_v1";
function getPayments(){ try{return JSON.parse(localStorage.getItem(PAYMENT_KEY)||"[]")}catch(e){return []} }
function savePayments(a){localStorage.setItem(PAYMENT_KEY,JSON.stringify(a))}
function openPaymentForm(){
  const m=document.getElementById("paymentModal"); if(!m)return;
  m.style.display="flex";
  const d=document.getElementById("pDate"); if(d && !d.value)d.value=new Date().toISOString().slice(0,10);
}
function closePaymentForm(){const m=document.getElementById("paymentModal"); if(m)m.style.display="none"}
function savePayment(e){
  e.preventDefault();
  const p={id:Date.now(),date:document.getElementById("pDate").value,type:document.getElementById("pType").value,
    party:document.getElementById("pParty").value,ref:document.getElementById("pRef").value,
    amount:Number(document.getElementById("pAmount").value||0),mode:document.getElementById("pMode").value,
    status:document.getElementById("pStatus").value,notes:document.getElementById("pNotes").value};
  const a=getPayments();a.push(p);savePayments(a);e.target.reset();closePaymentForm();renderPayments();
}
function renderPayments(){
  const a=getPayments();
  let received=0,paid=0,pendingReceive=0,pendingPay=0;
  a.forEach(p=>{
    if(p.type==="received"){received+=p.amount;if(p.status==="Pending")pendingReceive+=p.amount}
    else {paid+=p.amount;if(p.status==="Pending")pendingPay+=p.amount}
  });
  const set=(id,v)=>{const x=document.getElementById(id);if(x)x.textContent="₹"+v.toLocaleString("en-IN",{maximumFractionDigits:2})};
  set("paymentReceived",received);set("paymentPaid",paid);set("paymentPendingReceive",pendingReceive);set("paymentPendingPay",pendingPay);
  const tb=document.getElementById("paymentTableBody"); if(!tb)return;
  tb.innerHTML=a.length?a.slice().reverse().map(p=>`<tr><td>${p.date||""}</td><td>${p.type==="received"?"Received":"Paid"}</td><td>${p.party||"-"}</td><td>${p.ref||"-"}</td><td>₹${p.amount.toLocaleString("en-IN",{maximumFractionDigits:2})}</td><td>${p.mode}</td><td>${p.status}</td><td>${p.notes||"-"}</td></tr>`).join(""):'<tr><td colspan="8" style="text-align:center;">No payments recorded</td></tr>';
}
document.addEventListener("DOMContentLoaded",renderPayments);


/* payment-section-refresh-v4 */
document.addEventListener("click", function(e){
  const btn=e.target.closest && e.target.closest("[onclick*=\"payments\"]");
  if(btn && typeof renderPayments==="function") setTimeout(renderPayments,50);
});


/* KRIKAL V6 - Billing / SQL-ready transaction model */
const BILL_KEY="krikal_bills_v1";
function kbBills(){try{return JSON.parse(localStorage.getItem(BILL_KEY)||"[]")}catch(e){return[]}}
function kbSaveBills(a){localStorage.setItem(BILL_KEY,JSON.stringify(a))}
function kbBillMoney(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}
function addBillRow(){
  const tb=document.getElementById("billItems"); if(!tb)return;
  const tr=document.createElement("tr");
  tr.innerHTML='<td><input class="bill-product" placeholder="Product"></td><td><input class="bill-qty" type="number" min="1" value="1"></td><td><input class="bill-rate" type="number" min="0" step="0.01" value="0"></td><td class="bill-line-total">₹0</td>';
  tb.appendChild(tr); bindBillCalc();
}
function bindBillCalc(){
  document.querySelectorAll("#billItems input").forEach(x=>x.oninput=calcBill);
  calcBill();
}
function calcBill(){
  let total=0;
  document.querySelectorAll("#billItems tr").forEach(tr=>{
    const q=Number(tr.querySelector(".bill-qty")?.value||0);
    const r=Number(tr.querySelector(".bill-rate")?.value||0);
    const t=q*r; total+=t;
    const cell=tr.querySelector(".bill-line-total"); if(cell)cell.textContent=kbBillMoney(t);
  });
  const el=document.getElementById("billTotal");if(el)el.textContent=kbBillMoney(total);
  return total;
}
function openBillForm(){
  const d=document.getElementById("billDate"); if(d&&!d.value)d.value=new Date().toISOString().slice(0,10);
  bindBillCalc();
}
function saveLocalBill(e){
  e.preventDefault();
  const items=[];
  document.querySelectorAll("#billItems tr").forEach(tr=>{
    const product=tr.querySelector(".bill-product")?.value?.trim();
    const qty=Number(tr.querySelector(".bill-qty")?.value||0);
    const rate=Number(tr.querySelector(".bill-rate")?.value||0);
    if(product&&qty>0)items.push({product,qty,rate,total:qty*rate});
  });
  const bill={
    invoiceNo:document.getElementById("billNo").value.trim(),
    date:document.getElementById("billDate").value,
    customer:document.getElementById("billCustomer").value.trim(),
    status:document.getElementById("billStatus").value,
    paymentMode:document.getElementById("billMode").value,
    items,total:items.reduce((a,x)=>a+x.total,0),
    createdAt:new Date().toISOString()
  };
  if(!bill.invoiceNo||!items.length){alert("Invoice number and at least one item are required.");return}
  const a=kbBills();a.push(bill);kbSaveBills(a);
  renderBills();
  alert("Bill saved locally. SQL/API connection will post the same transaction to SQL.");
}
function renderBills(){
  const tb=document.getElementById("billTableBody");if(!tb)return;
  const a=kbBills();
  tb.innerHTML=a.length?a.slice().reverse().map(b=>`<tr><td>${b.invoiceNo}</td><td>${b.date}</td><td>${b.customer||"-"}</td><td>${kbBillMoney(b.total)}</td><td>${b.status}</td></tr>`).join(""):'<tr><td colspan="5" style="text-align:center;">No bills yet</td></tr>';
}
/* Backend contract: POST this JSON to your secured API.
   The server should create one transaction and its child rows atomically:
   Sales -> SalesItems -> StockMovement -> CustomerLedger.
   Never put SQL username/password in frontend JavaScript.
*/
function buildSqlReadySalePayload(bill){
  return {type:"SALE",invoiceNo:bill.invoiceNo,date:bill.date,customer:bill.customer,
    paymentStatus:bill.status,paymentMode:bill.paymentMode,total:bill.total,items:bill.items};
}
document.addEventListener("DOMContentLoaded",()=>{renderBills();bindBillCalc();});


/* KRIKAL V8 - separate Model column + model search */
(function(){
  function modelValue(x){
    return String(x?.model ?? x?.Model ?? x?.MODEL ?? "").trim();
  }
  function productValue(x){
    return String(x?.product_name ?? x?.product ?? x?.item_name ?? x?.Item ?? x?.name ?? x?.["Item Name"] ?? "").trim();
  }
  function applyModelSearch(){
    const input=document.getElementById("modelSearch");
    if(!input) return;
    const q=input.value.trim().toLowerCase();

    // If the existing renderer exposes a global inventory array, filter through it.
    const candidates=[window.inventoryData,window.inventory,window.products,window.stockData]
      .find(v=>Array.isArray(v));

    if(Array.isArray(candidates)){
      const filtered=candidates.filter(x=>!q || modelValue(x).toLowerCase().includes(q));
      if(typeof renderInventory==="function") { renderInventory(filtered); return; }
      if(typeof renderTable==="function") { renderTable(filtered); return; }
    }

    // Generic fallback: filter visible inventory table rows by the model column.
    const table=document.querySelector("#inventory table, .inventory-table, table");
    if(!table) return;
    const rows=table.querySelectorAll("tbody tr");
    rows.forEach(row=>{
      const cells=row.querySelectorAll("td");
      if(!cells.length) return;
      // Model is the second column after Product in V8.
      const model=(cells[1]?.textContent||"").trim().toLowerCase();
      row.style.display=(!q || model.includes(q)) ? "" : "none";
    });
  }

  document.addEventListener("input",e=>{
    if(e.target && e.target.id==="modelSearch") applyModelSearch();
  });
  document.addEventListener("DOMContentLoaded",()=>{
    const input=document.getElementById("modelSearch");
    if(input) input.addEventListener("keyup",applyModelSearch);
  });
  window.applyModelSearch=applyModelSearch;
})();

