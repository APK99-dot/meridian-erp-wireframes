// Meridian ERP — remaining screens (procurement, manufacturing, crm, reports, admin)

// =========================================================
// PROCUREMENT
// =========================================================
Screens.procurement = () => {
  const s = Store.state;
  const v = View.procurement;
  let rows = s.pos;
  if (v.status !== 'all') rows = rows.filter(p => p.status === v.status);
  if (v.q) { const q = v.q.toLowerCase(); rows = rows.filter(p => [p.id,p.vendor,p.wh,p.status].some(x=>String(x||'').toLowerCase().includes(q))); }
  rows = sortRows(rows, v.sortKey, v.sortDir);
  const sel = s.pos.find(p => p.id === v.selected) || rows[0];

  return `
<h1 class="page-title">Purchase Orders <span class="subtitle">${s.pos.length} total · ${s.pos.filter(p=>p.status==='Approval').length} awaiting approval</span></h1>

<div class="toolbar">
  <button class="btn primary" id="btnNewPO">+ New PO</button>
  <button class="btn">From Requisition</button>
  <button class="btn">Reorder Suggestions (${s.items.filter(i=>i.health==='Short'||i.health==='Low').length})</button>
  <div class="sep"></div>
  ${['all','Approval','Sent','In Transit','Received','Delayed','Draft','Closed'].map(st => `<button class="btn sm ${v.status===st?'primary':'ghost'}" data-act="setPOStatus('${st}')">${st==='all'?'All':st}</button>`).join('')}
  <div class="spacer"></div>
  <input class="input" id="poSearch" placeholder="Search POs…" value="${escapeHTML(v.q)}" style="width:220px">
</div>

<div class="grid-12">
  <div class="col-6">
    <div class="panel" style="padding:0">
      <table class="data">
        <thead><tr>${th('PO #','id','procurement')}${th('Vendor','vendor','procurement')}${th('Created','created','procurement')}${th('Need-by','need','procurement')}${th('Lines','lines','procurement')}${th('Total','total','procurement')}<th>WH</th>${th('Status','status','procurement')}<th></th></tr></thead>
        <tbody>
          ${rows.map(p => `
            <tr class="drill-po ${sel&&sel.id===p.id?'selected':''}" data-id="${p.id}">
              <td><strong>${p.id}</strong></td><td>${escapeHTML(p.vendor)}</td><td>${p.created.slice(5)}</td>
              <td>${p.need.slice(5)}</td><td class="num">${p.lines}</td><td class="num">${fmtMoney(p.total)}</td>
              <td>${p.wh}</td><td>${statusPill(p.status)}</td>
              <td>${p.status==='Approval'?`<button class="btn sm" data-act="approvePO('${p.id}')">Approve</button>`:p.status==='In Transit'?`<button class="btn sm" data-act="receivePO('${p.id}')">Receive</button>`:''}</td>
            </tr>
          `).join('')}
          ${rows.length===0?`<tr><td colspan="9" class="center muted" style="padding:20px">No POs match.</td></tr>`:''}
        </tbody>
      </table>
    </div>
  </div>

  <div class="col-6" style="display:flex;flex-direction:column;gap:14px">
    ${sel ? `
      <div class="panel">
        <div class="panel-title">${sel.id} — ${escapeHTML(sel.vendor)}
          <div class="actions">
            ${sel.status==='Approval'?`<a data-act="approvePO('${sel.id}')">Approve ✓</a>`:''}
            ${sel.status==='In Transit'?`<a data-act="receivePO('${sel.id}')">Receive ✓</a>`:''}
          </div>
        </div>
        <div class="grid-12" style="gap:0 14px">
          <div class="col-6">
            <div class="form-row"><label>Vendor</label><div class="val">${escapeHTML(sel.vendor)}</div></div>
            <div class="form-row"><label>Created</label><div class="val">${sel.created}</div></div>
            <div class="form-row"><label>Need-by</label><div class="val">${sel.need}</div></div>
          </div>
          <div class="col-6">
            <div class="form-row"><label>Ship to</label><div class="val">${sel.wh}</div></div>
            <div class="form-row"><label>Total</label><div class="val">${fmtMoney(sel.total)}</div></div>
            <div class="form-row"><label>Status</label><div class="val">${statusPill(sel.status)}</div></div>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">Approval Workflow</div>
        <div class="row" style="gap:0;align-items:stretch;font-size:12px">
          <div style="flex:1;padding:6px;border:1px solid var(--line);background:var(--paper-2)"><div class="mono tiny muted">SUBMITTED</div><div class="pill ok mt-8">✓ Done</div></div>
          <div style="flex:1;padding:6px;border:1px solid var(--line);border-left:none"><div class="mono tiny muted">DEPT APPROVAL</div><div class="pill ${sel.status==='Approval'?'warn':'ok'} mt-8">${sel.status==='Approval'?'⏳ Pending':'✓ Done'}</div></div>
          <div style="flex:1;padding:6px;border:1px solid var(--line);border-left:none"><div class="mono tiny muted">VENDOR ACK</div><div class="pill ${['Sent','In Transit','Received','Closed'].includes(sel.status)?'ok':'muted'} mt-8">${['Sent','In Transit','Received','Closed'].includes(sel.status)?'✓':'—'}</div></div>
          <div style="flex:1;padding:6px;border:1px solid var(--line);border-left:none"><div class="mono tiny muted">RECEIVE</div><div class="pill ${sel.status==='Received'||sel.status==='Closed'?'ok':'muted'} mt-8">${sel.status==='Received'||sel.status==='Closed'?'✓ Done':'Pending'}</div></div>
        </div>
      </div>
    ` : '<div class="panel muted">No PO selected.</div>'}
  </div>
</div>
`;};

// =========================================================
// MANUFACTURING
// =========================================================
Screens.manufacturing = () => {
  const s = Store.state;
  return `
<h1 class="page-title">Work Orders <span class="subtitle">${s.wos.filter(w=>w.status!=='Draft').length} active · 78% utilization</span></h1>

<div class="toolbar">
  <button class="btn primary" id="btnNewWO">+ New WO</button>
  <button class="btn">Run MRP</button>
  <button class="btn">Release All Ready</button>
  <div class="spacer"></div>
  <button class="btn sm">Timeline</button>
</div>

<div class="grid-12">
  <div class="panel col-12">
    <div class="panel-title">Active Work Orders</div>
    <table class="data">
      <thead><tr><th>WO #</th><th>Item</th><th>Line</th><th class="num">Qty</th><th>Start</th><th>End</th><th class="num">Progress</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${s.wos.map(w => `
          <tr>
            <td><strong>${w.id}</strong></td><td class="drill-item" data-sku="${w.item}" style="cursor:pointer;text-decoration:underline dotted">${w.item}</td>
            <td>${w.line}</td><td class="num">${w.qty}</td>
            <td>${w.start.slice(5)}</td><td>${w.end.slice(5)}</td>
            <td class="num">${w.target?Math.round(w.done/w.target*100)+'%':'—'}</td>
            <td>${statusPill(w.status)}</td>
            <td>
              ${w.status==='Draft'?`<button class="btn sm" data-act="releaseWO('${w.id}')">Release</button>`:''}
              ${w.status==='Queued'?`<button class="btn sm" data-act="startWO('${w.id}')">Start</button>`:''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="panel col-6">
    <div class="panel-title">Capacity Utilization</div>
    <table class="data">
      <thead><tr><th>Line</th><th class="num">Std hrs</th><th class="num">Sched</th><th class="num">%</th><th>Load</th></tr></thead>
      <tbody>
        ${[['Line A · CNC',40,36,90],['Line B · Assy',40,34,85],['Line C · Weld',40,32,80],['Line D · Paint',40,44,110],['Line E · Pack',40,22,55],['Cell F · QA',40,38,95]].map(r => `
          <tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}%</td><td><div class="ganttbar ${r[3]>100?'warn':'ok'}" style="width:${Math.min(100,r[3])}%;height:8px"></div></td></tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="panel col-6">
    <div class="panel-title">Material Shortages (blocking WOs)</div>
    <table class="data">
      <thead><tr><th>SKU</th><th>Item</th><th class="num">Needed</th><th class="num">Short</th><th></th></tr></thead>
      <tbody>
        ${s.items.filter(i=>i.health==='Short').map(i => `
          <tr class="drill-item" data-sku="${i.sku}">
            <td><strong>${i.sku}</strong></td><td>${escapeHTML(i.name)}</td>
            <td class="num">${i.onSO}</td><td class="num" style="color:var(--accent-red)">${i.onSO-i.avail}</td>
            <td><button class="btn sm" data-act="reorderItem('${i.sku}')">Reorder</button></td>
          </tr>
        `).join('') || '<tr><td colspan="5" class="center muted" style="padding:16px">No shortages — all WOs have materials.</td></tr>'}
      </tbody>
    </table>
  </div>
</div>
`;};

// =========================================================
// CRM
// =========================================================
Screens.crm = () => {
  const s = Store.state;
  const cust = s.customers.find(c=>c.name==='Redwood Fabrication Co.') || s.customers[0];
  const orders = s.orders.filter(o => o.cust === cust.name);
  return `
<div class="row">
  <h1 class="page-title">${escapeHTML(cust.name)} <span class="subtitle">Customer · Tier ${cust.tier} · Since ${cust.since} · ${cust.owner}</span></h1>
  <div class="spacer"></div>
  <button class="btn">Log Call</button>
  <button class="btn" id="btnNewTask">New Task</button>
  <button class="btn" id="btnNewCustomer">+ New Customer</button>
  <button class="btn primary" id="btnNewOrderCust" data-cust="${escapeHTML(cust.name)}">+ New Order</button>
</div>

<div class="grid-12">
  <div class="panel col-4">
    <div class="panel-title">Account</div>
    <div class="form-row"><label>ID</label><div class="val">${cust.id}</div></div>
    <div class="form-row"><label>Tier</label><div class="val">${cust.tier}</div></div>
    <div class="form-row"><label>Credit Limit</label><div class="val">${fmtMoney(cust.credit)} ${cust.ar>cust.credit?statusPill('over'):''}</div></div>
    <div class="form-row"><label>Open AR</label><div class="val">${fmtMoney(cust.ar)}</div></div>
    <div class="form-row"><label>Region</label><div class="val">${cust.region}</div></div>
    <div class="form-row"><label>Owner</label><div class="val">${cust.owner}</div></div>

    <div class="panel-title mt-8">Other Customers</div>
    <table class="data">
      <tbody>
        ${s.customers.filter(c=>c.id!==cust.id).map(c => `<tr style="cursor:pointer" class="pick-cust" data-name="${escapeHTML(c.name)}"><td>${escapeHTML(c.name)}</td><td>${c.region}</td><td>${fmtMoney(c.ar)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="panel col-5">
    <div class="panel-title">Revenue — last 12mo</div>
    ${barChart([18,22,14,19,24,27,21,25,30,28,32,35])}
    <div class="panel-title mt-8" style="border:none;padding:0">Orders (${orders.length})</div>
    <table class="data">
      <thead><tr><th>SO</th><th>Date</th><th class="num">Total</th><th>Status</th></tr></thead>
      <tbody>
        ${orders.slice(0,8).map(o => `<tr class="drill-order" data-id="${o.id}"><td><strong>${o.id}</strong></td><td>${o.date.slice(5)}</td><td class="num">${fmtMoney(o.total)}</td><td>${statusPill(o.status)}</td></tr>`).join('') || '<tr><td colspan="4" class="center muted" style="padding:16px">No orders yet.</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="panel col-3">
    <div class="panel-title">Activity</div>
    <div style="font-family:var(--hand);font-size:12px;display:flex;flex-direction:column;gap:8px">
      ${s.activity.slice(0,8).map(a => `<div><span class="mono tiny muted">${a.ts} · ${a.user||'—'}</span><br/>${escapeHTML(a.msg)} <span class="muted">${a.ref?`(${a.ref})`:''}</span></div>`).join('')}
    </div>
  </div>
</div>
`;};

// =========================================================
// REPORTS
// =========================================================
Screens.reports = () => {
  const s = Store.state;
  const totalRev = s.orders.reduce((a,b)=>a+b.total,0);
  const openAR = s.customers.reduce((a,b)=>a+b.ar,0);
  const shippedPct = Math.round(s.orders.filter(o=>o.status==='Shipped').length/s.orders.length*100)||0;
  return `
<h1 class="page-title">Reports — Operations <span class="subtitle">Live · pulled from current store state</span></h1>

<div class="toolbar">
  <button class="btn ghost sm">Period: QTD ▾</button>
  <button class="btn ghost sm">Warehouse: All ▾</button>
  <div class="spacer"></div>
  <button class="btn sm" id="btnExportReport">Export CSV</button>
  <button class="btn sm" data-act="resetData()">Reset Demo Data</button>
</div>

<div class="grid-12">
  <div class="panel col-3"><div class="label mono tiny muted">ORDER PIPELINE</div><div class="value" style="font-family:var(--hand-2);font-size:34px;font-weight:700">${fmtMoney(totalRev)}</div><div class="delta up mono">${s.orders.length} orders</div></div>
  <div class="panel col-3"><div class="label mono tiny muted">OPEN AR</div><div class="value" style="font-family:var(--hand-2);font-size:34px;font-weight:700">${fmtMoney(openAR)}</div><div class="delta down mono">${s.customers.length} cust</div></div>
  <div class="panel col-3"><div class="label mono tiny muted">SHIPPED</div><div class="value" style="font-family:var(--hand-2);font-size:34px;font-weight:700">${shippedPct}%</div><div class="delta up mono">of all SOs</div></div>
  <div class="panel col-3"><div class="label mono tiny muted">SKU HEALTH</div><div class="value" style="font-family:var(--hand-2);font-size:34px;font-weight:700">${s.items.filter(i=>i.health==='OK').length}/${s.items.length}</div><div class="delta mono">healthy</div></div>

  <div class="panel col-8">
    <div class="panel-title">Revenue by Channel — 12 weeks</div>
    ${lineChart([[800,820,860,890,910,950,980,1020,1050,1100,1140,1180],[420,440,430,460,480,500,520,540,560,580,610,640],[220,230,240,260,280,300,310,330,340,360,380,400]])}
  </div>

  <div class="panel col-4">
    <div class="panel-title">AR Aging</div>
    <table class="data">
      <thead><tr><th>Bucket</th><th class="num">Amount</th></tr></thead>
      <tbody>
        <tr><td>Current</td><td class="num">${fmtMoney(openAR*0.58)}</td></tr>
        <tr><td>1–30 days</td><td class="num">${fmtMoney(openAR*0.17)}</td></tr>
        <tr><td>31–60 days</td><td class="num">${fmtMoney(openAR*0.12)}</td></tr>
        <tr><td>61–90 days</td><td class="num">${fmtMoney(openAR*0.07)}</td></tr>
        <tr><td>90+ days</td><td class="num">${fmtMoney(openAR*0.06)}</td></tr>
        <tr style="border-top:2px solid var(--line)"><td><strong>Total</strong></td><td class="num"><strong>${fmtMoney(openAR)}</strong></td></tr>
      </tbody>
    </table>
  </div>

  <div class="panel col-12">
    <div class="panel-title">Orders by Status</div>
    <table class="data">
      <thead><tr><th>Status</th><th class="num">Count</th><th class="num">Total Value</th><th>Distribution</th></tr></thead>
      <tbody>
        ${Object.entries(s.orders.reduce((m,o)=>{m[o.status]=m[o.status]||{n:0,v:0};m[o.status].n++;m[o.status].v+=o.total;return m;},{})).sort((a,b)=>b[1].v-a[1].v).map(([k,v]) => `
          <tr><td>${statusPill(k)}</td><td class="num">${v.n}</td><td class="num">${fmtMoney(v.v)}</td><td><div class="ganttbar" style="width:${Math.round(v.v/totalRev*100)}%;height:8px"></div></td></tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</div>
`;};

// =========================================================
// ADMIN
// =========================================================
Screens.admin = () => `
<h1 class="page-title">Administration <span class="subtitle">System · Company · Security · Integrations</span></h1>

<div class="grid-12">
  <div class="col-3">
    <div class="rail">
      <h5>System</h5>
      <ul><li class="active">◎ Users &amp; Roles</li><li>○ Permission Sets</li><li>○ Audit Log</li><li>○ Saved Searches</li></ul>
      <h5>Company</h5>
      <ul><li>○ Subsidiaries</li><li>○ Warehouses</li><li>○ Currencies &amp; Tax</li></ul>
      <h5>Workflows</h5>
      <ul><li>○ Approval Routes</li><li>○ Email Templates</li><li>○ Number Sequences</li></ul>
      <h5>Integrations</h5>
      <ul><li>○ EDI Partners</li><li>○ Shipping Carriers</li><li>○ Payment Gateways</li><li>○ API Tokens</li></ul>
      <h5>Data</h5>
      <ul><li data-act="resetData()" style="color:var(--accent-red)">⟳ Reset Demo Data</li></ul>
    </div>
  </div>

  <div class="col-9" style="display:flex;flex-direction:column;gap:14px">
    <div class="panel">
      <div class="panel-title">Users &amp; Roles <span class="mono tiny muted">8 users · 5 roles</span>
        <div class="actions"><a id="btnNewUser" style="cursor:pointer">+ New User</a></div>
      </div>
      <table class="data">
        <thead><tr><th><span class="cb"></span></th><th>Name</th><th>Email</th><th>Role</th><th>MFA</th><th>Last Login</th><th>Status</th></tr></thead>
        <tbody>
          ${[
            ["Olivia Marsh","omarsh@meridian.ex","Ops Manager","on","2m ago","Active"],
            ["Marcus Price","mprice@meridian.ex","Warehouse Lead","on","14m ago","Active"],
            ["Ana Rao","arao@meridian.ex","Sales Rep","on","1h ago","Active"],
            ["Jordan Park","jpark@meridian.ex","Controller","on","yesterday","Active"],
            ["Diego Nguyen","dnguyen@meridian.ex","WH Clerk","off","3d ago","Pending MFA"],
            ["Tasha Bell","tbell@meridian.ex","Inv Analyst","on","22m ago","Active"],
            ["Elliot Vasquez","evasquez@meridian.ex","Shop Floor","on","8m ago","Active"],
            ["Priya Kapoor","pkapoor@meridian.ex","Sales Rep","on","6h ago","Disabled"]
          ].map(r => `<tr><td><span class="cb"></span></td><td>${r[0]}</td><td class="mono tiny">${r[1]}</td><td>${r[2]}</td><td>${statusPill(r[3]==='on'?'OK':'Low')}</td><td class="mono tiny">${r[4]}</td><td>${statusPill(r[5]==='Active'?'OK':r[5]==='Disabled'?'muted':'Low')}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="panel">
      <div class="panel-title">Recent Audit Events <span class="mono tiny muted">${Store.state.activity.length} total</span></div>
      <table class="data">
        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Target</th></tr></thead>
        <tbody>
          ${Store.state.activity.slice(0,10).map(a => `<tr><td class="mono tiny">${a.ts}</td><td>${a.user||'—'}</td><td>${escapeHTML(a.msg)}</td><td>${a.ref||'—'}</td></tr>`).join('') || '<tr><td colspan="4" class="center muted" style="padding:16px">No events yet.</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>
</div>
`;

window.Screens = Screens;
