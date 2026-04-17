// Meridian ERP — interactive screens (reads from Store, dispatches actions)

const Screens = {};
const UI = {};

// ---- view state (not persisted) ----
const View = {
  orders: { q:'', status:'open', sortKey:'date', sortDir:'desc', view:'all', selected:null },
  inventory: { q:'', cat:'all', health:'all', sortKey:'sku', sortDir:'asc' },
  procurement: { q:'', status:'all', selected:null, sortKey:'created', sortDir:'desc' },
  manufacturing: { q:'', status:'all' },
  currentOrder: 'SO-8821',
  currentItem: 'WD-4120'
};

// ---------- helpers ----------
function escapeHTML(s){return String(s).replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function sortRows(rows, key, dir='asc') {
  const d = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a,b) => {
    const av=a[key], bv=b[key];
    if (typeof av === 'number' && typeof bv === 'number') return (av-bv)*d;
    return String(av||'').localeCompare(String(bv||''))*d;
  });
}
function th(label, key, view) {
  const isActive = View[view].sortKey === key;
  const arrow = isActive ? (View[view].sortDir==='asc'?' ▲':' ▼') : '';
  return `<th data-sort="${key}" data-view="${view}" style="cursor:pointer${isActive?';background:#f0ead8':''}">${label}${arrow}</th>`;
}
function sparkline(points, {width=80, height=22, stroke="#1a1a1a"} = {}) {
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const d = points.map((p,i) => `${i===0?'M':'L'} ${(i*step).toFixed(1)} ${(height - ((p-min)/range)*height).toFixed(1)}`).join(' ');
  return `<svg class="spark" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="${d}" fill="none" stroke="${stroke}" stroke-width="1.5"/></svg>`;
}
function barChart(values, {width=520, height=160, label=""} = {}) {
  const max = Math.max(...values) * 1.15;
  const bw = width / values.length;
  const bars = values.map((v,i) => {
    const h = (v/max)*(height-24);
    return `<rect x="${(i*bw+4).toFixed(1)}" y="${(height-8-h).toFixed(1)}" width="${(bw-8).toFixed(1)}" height="${h.toFixed(1)}" fill="#1a1a1a" fill-opacity="0.75" stroke="#1a1a1a" stroke-width="1"/>`;
  }).join('');
  return `<div class="chart"><div class="chart-label">${label}</div><svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${bars}<line x1="0" y1="${height-8}" x2="${width}" y2="${height-8}" stroke="#1a1a1a" stroke-width="1"/></svg></div>`;
}
function lineChart(series, {width=520, height=160, label=""} = {}) {
  const all = series.flat(); const max = Math.max(...all)*1.1, min = Math.min(...all)*0.9, range = max-min||1;
  const paths = series.map((s, si) => {
    const step = width/(s.length-1);
    const d = s.map((p,i) => `${i===0?'M':'L'} ${(i*step).toFixed(1)} ${(height-8-((p-min)/range)*(height-16)).toFixed(1)}`).join(' ');
    const dash = si===1?'stroke-dasharray="4 3"':''; const color = si===0?'#1a1a1a':'#6b6b6b';
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" ${dash}/>`;
  }).join('');
  const gl = [0.25,0.5,0.75].map(g => `<line x1="0" x2="${width}" y1="${(g*(height-16)+8).toFixed(1)}" y2="${(g*(height-16)+8).toFixed(1)}" stroke="#9a9a9a" stroke-width="0.5" stroke-dasharray="2 3"/>`).join('');
  return `<div class="chart"><div class="chart-label">${label}</div><svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${gl}${paths}</svg></div>`;
}
function donutChart(parts, {size=140} = {}) {
  const total = parts.reduce((s,p)=>s+p.v,0);
  let a0 = -Math.PI/2;
  const r = size/2-10, cx=size/2, cy=size/2;
  const arcs = parts.map((p,i) => {
    const a1 = a0 + (p.v/total)*Math.PI*2;
    const large = (a1-a0) > Math.PI ? 1 : 0;
    const x0 = cx+r*Math.cos(a0), y0 = cy+r*Math.sin(a0);
    const x1 = cx+r*Math.cos(a1), y1 = cy+r*Math.sin(a1);
    const path = `<path d="M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="#1a1a1a" fill-opacity="${0.3+i*0.18}" stroke="#1a1a1a" stroke-width="1"/>`;
    a0 = a1; return path;
  }).join('');
  const legend = parts.map((p,i) => `<div class="row" style="font-size:11px"><span style="width:10px;height:10px;border:1px solid #1a1a1a;background:rgba(0,0,0,${0.3+i*0.18})"></span> ${p.label} <span class="mono muted">${Math.round(p.v/total*100)}%</span></div>`).join('');
  return `<div class="row" style="gap:14px;align-items:center"><svg width="${size}" height="${size}">${arcs}<circle cx="${cx}" cy="${cy}" r="${(r*0.55).toFixed(1)}" fill="#fafaf7" stroke="#1a1a1a" stroke-width="1"/></svg><div style="display:flex;flex-direction:column;gap:4px">${legend}</div></div>`;
}
function statusPill(s) {
  const map = {
    "Shipped":"ok","Credit hold":"err","Overdue":"err","Approval":"warn","Scheduled":"ok","Partial":"info","Picking":"muted","Staged":"muted","New":"muted","Cancelled":"muted",
    "Received":"ok","Closed":"ok","Sent":"muted","In Transit":"info","Delayed":"err","Draft":"muted",
    "Running":"ok","Slow":"warn","Queued":"info",
    "OK":"ok","Low":"warn","Short":"err","Over":"info"
  };
  return `<span class="pill ${map[s]||'muted'}">${s}</span>`;
}

// =========================================================
// DASHBOARD
// =========================================================
Screens.dashboard = () => {
  const s = Store.state;
  const openSO = s.orders.filter(o => !['Shipped','Closed','Cancelled'].includes(o.status)).length;
  const overdue = s.orders.filter(o => o.status === 'Overdue' || o.status === 'Credit hold').length;
  const stockShort = s.items.filter(i => i.health === 'Short').length;
  const lowStock = s.items.filter(i => i.health === 'Low').length;
  const approvalsSO = s.orders.filter(o => o.status === 'Approval' || o.status === 'New');
  const approvalsPO = s.pos.filter(p => p.status === 'Approval');
  const inboundToday = s.pos.filter(p => p.status === 'In Transit' || p.status === 'Sent').length;

  const queue = [
    ...approvalsPO.slice(0,3).map(p => ({type:'Approve', kind:'err', ref:`${p.id} · ${p.vendor}`, action:`approvePO('${p.id}')`, age:'2d'})),
    ...approvalsSO.slice(0,3).map(o => ({type:'Approve', kind:'warn', ref:`${o.id} · ${o.cust}`, action:`approveOrder('${o.id}')`, age:'6h'})),
    ...s.orders.filter(o=>o.status==='Credit hold').slice(0,2).map(o => ({type:'Review', kind:'warn', ref:`${o.id} · credit hold`, action:`drillOrder('${o.id}')`, age:'1d'})),
    {type:'Assign', kind:'info', ref:'WO-4412 routing miss', action:`setScreen('manufacturing')`, age:'4h'},
    {type:'Review', kind:'warn', ref:'Cycle count var · Bin B-14', action:`setScreen('inventory')`, age:'3h'}
  ];

  return `
<h1 class="page-title">Operations Dashboard <span class="subtitle">Good afternoon, Olivia — here's what needs you today.</span></h1>

<div class="kpi-grid">
  <div class="kpi clickable" data-go="orders"><div class="label">Open Sales Orders</div><div class="value">${openSO}</div><div class="delta up">▲ click to drill</div></div>
  <div class="kpi clickable" data-go="orders" data-filter="overdue"><div class="label">Overdue / Hold</div><div class="value" style="color:var(--accent-red)">${overdue}</div><div class="delta down">needs attention</div></div>
  <div class="kpi clickable" data-go="procurement"><div class="label">Inbound POs</div><div class="value">${inboundToday}</div><div class="delta">7 arriving today</div></div>
  <div class="kpi clickable" data-go="inventory" data-filter="short"><div class="label">Stockouts</div><div class="value" style="color:var(--accent-amber)">${stockShort+lowStock}</div><div class="delta">${stockShort} critical</div></div>
  <div class="kpi clickable" data-go="manufacturing"><div class="label">WO Utilization</div><div class="value">78%</div><div class="delta up">▲ 4pt vs target</div></div>
  <div class="kpi clickable" data-go="reports"><div class="label">On-Time Ship</div><div class="value">94.1%</div><div class="delta up">▲ 0.8%</div></div>
</div>

<div class="grid-12">
  <div class="panel col-8">
    <div class="panel-title">Order &amp; Fulfillment Volume — rolling 12 weeks
      <div class="actions"><a>Filter</a><a>Export</a></div>
    </div>
    ${lineChart([[120,140,132,155,170,162,180,195,188,210,225,240],[110,125,128,140,150,155,168,172,180,190,200,215]], {label:"— Orders   — — Fulfilled"})}
  </div>

  <div class="panel col-4">
    <div class="panel-title">My Action Queue <span class="mono tiny muted">${queue.length} items</span></div>
    <table class="data">
      <thead><tr><th>#</th><th>Type</th><th>Record</th><th>Age</th><th></th></tr></thead>
      <tbody>
        ${queue.map((q,i) => `
          <tr>
            <td>${i+1}</td>
            <td><span class="pill ${q.kind}">${q.type}</span></td>
            <td>${escapeHTML(q.ref)}</td>
            <td>${q.age}</td>
            <td><button class="btn sm" data-act="${q.action}">Do</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="panel col-4">
    <div class="panel-title">Inventory Health</div>
    ${donutChart([
      {label:"In stock", v: s.items.filter(i=>i.health==='OK').length || 1},
      {label:"Low", v: lowStock || 1},
      {label:"Short", v: stockShort || 1},
      {label:"Over", v: s.items.filter(i=>i.health==='Over').length || 1}
    ])}
    <div class="mt-8 tiny muted">${s.items.length} SKUs tracked</div>
  </div>

  <div class="panel col-4">
    <div class="panel-title">Fulfillment SLA — last 20d</div>
    ${barChart([92,88,94,95,93,90,96,94,97,95,93,98,94,92,95,93,91,96,94,95], {label:"% on-time"})}
    <div class="row tiny mt-8" style="justify-content:space-between"><span class="muted">Target: 95%</span>${statusPill('On track')}</div>
  </div>

  <div class="panel col-4">
    <div class="panel-title">Top Back-Ordered Items</div>
    <table class="data">
      <thead><tr><th>SKU</th><th>Item</th><th class="num">Short</th></tr></thead>
      <tbody>
        ${s.items.filter(i=>i.health==='Short'||i.health==='Low').slice(0,6).map(i => `
          <tr class="drill-item" data-sku="${i.sku}">
            <td><strong>${i.sku}</strong></td><td>${escapeHTML(i.name)}</td>
            <td class="num">${Math.max(0, i.onSO - i.avail)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="panel col-12">
    <div class="panel-title">Today's Shipping &amp; Receiving
      <div class="actions"><a>by Warehouse</a><a>Timeline</a></div>
    </div>
    <table class="data">
      <thead><tr><th>Time</th><th>Type</th><th>Doc</th><th>Party</th><th>WH</th><th class="num">Lines</th><th class="num">Qty</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${s.orders.filter(o=>['Picking','Staged','Scheduled','Partial','Credit hold'].includes(o.status)).slice(0,6).map(o=>`
          <tr class="drill-order" data-id="${o.id}">
            <td class="mono">—</td><td>Outbound</td><td>${o.id}</td><td>${escapeHTML(o.cust)}</td>
            <td>${o.wh}</td><td class="num">${o.lines}</td><td class="num">${o.total}</td>
            <td>${statusPill(o.status)}</td>
            <td><button class="btn sm" data-act="shipOrder('${o.id}')">Ship</button></td>
          </tr>
        `).join('')}
        ${s.pos.filter(p=>p.status==='In Transit').slice(0,3).map(p=>`
          <tr class="drill-po" data-id="${p.id}">
            <td class="mono">—</td><td>Inbound</td><td>${p.id}</td><td>${escapeHTML(p.vendor)}</td>
            <td>${p.wh}</td><td class="num">${p.lines}</td><td class="num">—</td>
            <td>${statusPill(p.status)}</td>
            <td><button class="btn sm" data-act="receivePO('${p.id}')">Receive</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</div>
`;};

// =========================================================
// ORDERS LIST
// =========================================================
Screens.orders = () => {
  const s = Store.state;
  const v = View.orders;
  let rows = s.orders;
  if (v.view === 'overdue') rows = rows.filter(o => o.status==='Overdue' || o.status==='Credit hold');
  else if (v.view === 'approval') rows = rows.filter(o => o.status==='Approval' || o.status==='New');
  else if (v.view === 'hold') rows = rows.filter(o => o.status==='Credit hold');
  else if (v.view === 'open') rows = rows.filter(o => !['Shipped','Closed','Cancelled'].includes(o.status));
  if (v.q) {
    const q = v.q.toLowerCase();
    rows = rows.filter(o => [o.id,o.cust,o.po,o.rep,o.shipTo,o.status].some(x => String(x||'').toLowerCase().includes(q)));
  }
  rows = sortRows(rows, v.sortKey, v.sortDir);

  return `
<h1 class="page-title">Sales Orders <span class="subtitle">${s.orders.length} total · ${rows.length} shown · ${fmtMoney(rows.reduce((a,b)=>a+b.total,0))} pipeline</span></h1>

<div class="toolbar">
  <button class="btn primary" id="btnNewOrder">+ New Order</button>
  <button class="btn">Import CSV</button>
  <div class="sep"></div>
  <span class="chip">Status: ${v.view} <span class="x" data-act="setOrderView('all')">×</span></span>
  <button class="btn ghost sm" data-act="openFilterMenu()">+ Filter</button>
  <div class="spacer"></div>
  <input class="input" id="ordSearch" placeholder="Search orders…" value="${escapeHTML(v.q)}" style="width:240px">
  <button class="btn sm" id="btnOrdExport">Export CSV</button>
</div>

<div class="grid-12">
  <div class="col-3">
    <div class="rail">
      <h5>Views</h5>
      <ul>
        ${[
          ['all',"All Orders",s.orders.length],
          ['open',"Open",s.orders.filter(o=>!['Shipped','Closed','Cancelled'].includes(o.status)).length],
          ['overdue',"Overdue / Hold",s.orders.filter(o=>o.status==='Overdue'||o.status==='Credit hold').length],
          ['approval',"Awaiting Approval",s.orders.filter(o=>o.status==='Approval'||o.status==='New').length],
          ['hold',"On Credit Hold",s.orders.filter(o=>o.status==='Credit hold').length],
        ].map(([k,l,c]) => `<li class="${v.view===k?'active':''}" data-act="setOrderView('${k}')">${l} <span class="count">${c}</span></li>`).join('')}
      </ul>
      <h5>Sort by</h5>
      <ul>
        ${[['date','Order date'],['req','Req ship'],['total','Amount'],['cust','Customer'],['status','Status']].map(([k,l]) => `<li class="${v.sortKey===k?'active':''}" data-act="setOrderSort('${k}')">${l}${v.sortKey===k?(v.sortDir==='asc'?' ▲':' ▼'):''}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="col-9">
    <div class="panel" style="padding:0">
      <table class="data">
        <thead>
          <tr>
            <th style="width:24px"><span class="cb"></span></th>
            ${th('SO #','id','orders')}${th('Customer','cust','orders')}${th('PO #','po','orders')}${th('Rep','rep','orders')}
            ${th('Order','date','orders')}${th('Req Ship','req','orders')}
            ${th('Lines','lines','orders')}${th('Total','total','orders')}${th('Fulfilled %','fulfilled','orders')}
            ${th('WH','wh','orders')}${th('Status','status','orders')}
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(o => `
            <tr class="drill-order ${v.selected===o.id?'selected':''}" data-id="${o.id}">
              <td><span class="cb ${v.selected===o.id?'checked':''}"></span></td>
              <td><strong>${o.id}</strong></td><td>${escapeHTML(o.cust)}</td><td>${escapeHTML(o.po)}</td><td>${o.rep}</td>
              <td>${o.date.slice(5)}</td><td>${o.req.slice(5)}</td>
              <td class="num">${o.lines}</td><td class="num">${fmtMoney(o.total)}</td>
              <td class="num">${o.fulfilled}%</td>
              <td>${o.wh}</td><td>${statusPill(o.status)}</td>
              <td style="white-space:nowrap">
                ${o.status==='Credit hold'?`<button class="btn sm" data-act="releaseHold('${o.id}')">Release</button>`:''}
                ${o.status==='Approval'||o.status==='New'?`<button class="btn sm" data-act="approveOrder('${o.id}')">Approve</button>`:''}
                ${o.status==='Picking'||o.status==='Staged'?`<button class="btn sm" data-act="shipOrder('${o.id}')">Ship</button>`:''}
              </td>
            </tr>
          `).join('')}
          ${rows.length===0 ? `<tr><td colspan="13" class="center muted" style="padding:20px">No orders match your filters.</td></tr>` : ''}
        </tbody>
      </table>
      <div class="row" style="padding:6px 10px;border-top:1.5px solid var(--line);background:var(--paper-2);font-size:12px">
        <span class="mono muted">Showing ${rows.length} of ${s.orders.length}</span>
        <span class="spacer"></span>
        <span class="mono muted">Σ total: ${fmtMoney(rows.reduce((a,b)=>a+b.total,0))}</span>
      </div>
    </div>
  </div>
</div>
`;};

// =========================================================
// ORDER DETAIL
// =========================================================
Screens['order-detail'] = () => {
  const s = Store.state;
  const o = s.orders.find(x=>x.id===View.currentOrder) || s.orders[0];
  const activity = s.activity.filter(a => a.ref === o.id);

  return `
<div class="row">
  <h1 class="page-title">${o.id} <span class="subtitle">${escapeHTML(o.cust)} · Created ${o.date} · ${o.rep}</span></h1>
  <div class="spacer"></div>
  <button class="btn" data-act="prevOrder()">◀ Prev</button>
  <button class="btn" data-act="nextOrder()">Next ▶</button>
  ${o.status==='Credit hold'?`<button class="btn primary" data-act="releaseHold('${o.id}')">Release Hold</button>`:''}
  ${o.status==='Approval'||o.status==='New'?`<button class="btn primary" data-act="approveOrder('${o.id}')">Approve</button>`:''}
  ${!['Shipped','Cancelled','Closed'].includes(o.status)?`<button class="btn" data-act="cancelOrder('${o.id}')">Cancel</button>`:''}
  ${o.status==='Picking'||o.status==='Staged'||o.status==='Scheduled'?`<button class="btn primary" data-act="shipOrder('${o.id}')">Ship</button>`:''}
</div>

<div class="grid-12">
  <div class="panel col-8">
    <div class="panel-title">Header — ${statusPill(o.status)}</div>
    <div class="grid-12" style="gap:0 18px">
      <div class="col-6">
        <div class="form-row"><label>Customer</label><div class="val">${escapeHTML(o.cust)}</div></div>
        <div class="form-row"><label>Customer PO</label><div class="val">${escapeHTML(o.po||'—')}</div></div>
        <div class="form-row"><label>Sales Rep</label><div class="val">${o.rep}</div></div>
        <div class="form-row"><label>Warehouse</label><div class="val">${o.wh}</div></div>
      </div>
      <div class="col-6">
        <div class="form-row"><label>Order Date</label><div class="val">${o.date}</div></div>
        <div class="form-row"><label>Required Ship</label><div class="val">${o.req}</div></div>
        <div class="form-row"><label>Promised</label><div class="val">${o.promised}</div></div>
        <div class="form-row"><label>Ship To</label><div class="val">${escapeHTML(o.shipTo)}</div></div>
      </div>
    </div>
  </div>

  <div class="panel col-4">
    <div class="panel-title">Totals</div>
    <table class="data" style="border:none">
      <tbody>
        <tr><td>Subtotal</td><td class="num">${fmtMoney(o.total*0.92)}</td></tr>
        <tr><td>Freight est.</td><td class="num">${fmtMoney(o.total*0.03)}</td></tr>
        <tr><td>Tax</td><td class="num">${fmtMoney(o.total*0.05)}</td></tr>
        <tr style="border-top:2px solid var(--line)"><td><strong>Total</strong></td><td class="num"><strong>${fmtMoney(o.total)}</strong></td></tr>
      </tbody>
    </table>
    <div class="mt-8 tiny muted">Fulfilled: ${o.fulfilled}%</div>
  </div>

  <div class="panel col-12">
    <div class="panel-title">Line Items <span class="mono tiny muted">${o.lines} lines</span></div>
    <table class="data">
      <thead><tr><th>#</th><th>SKU</th><th>Description</th><th class="num">Qty</th><th class="num">Avail</th><th class="num">Unit</th><th class="num">Ext</th><th>Status</th></tr></thead>
      <tbody>
        ${s.items.slice(0, Math.min(o.lines, 6)).map((it,i) => {
          const qty = Math.floor(40 + (i*13)%180);
          const ext = qty * it.price;
          return `<tr class="drill-item" data-sku="${it.sku}">
            <td>${i+1}</td><td><strong>${it.sku}</strong></td><td>${escapeHTML(it.name)}</td>
            <td class="num">${qty}</td><td class="num">${it.avail}</td>
            <td class="num">$${it.price.toFixed(2)}</td><td class="num">${fmtMoney(ext)}</td>
            <td>${it.avail >= qty ? statusPill('Committed') : statusPill('Short '+(qty-it.avail))}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="panel col-12">
    <div class="panel-title">Activity</div>
    <table class="data">
      <tbody>
        ${(activity.length?activity:[{ts:"—",msg:"No activity for this order.",user:""}]).map(a => `
          <tr><td style="width:120px">${a.ts}</td><td>${escapeHTML(a.msg)}</td><td class="muted">${escapeHTML(a.user)}</td></tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</div>
`;};

// =========================================================
// INVENTORY LIST
// =========================================================
Screens.inventory = () => {
  const s = Store.state;
  const v = View.inventory;
  let rows = s.items;
  if (v.health === 'short') rows = rows.filter(i => i.health === 'Short');
  else if (v.health === 'low') rows = rows.filter(i => i.health === 'Low' || i.health === 'Short');
  else if (v.health === 'over') rows = rows.filter(i => i.health === 'Over');
  if (v.q) {
    const q = v.q.toLowerCase();
    rows = rows.filter(i => [i.sku,i.name,i.cat,i.wh].some(x => String(x||'').toLowerCase().includes(q)));
  }
  rows = sortRows(rows, v.sortKey, v.sortDir);

  return `
<h1 class="page-title">Inventory — Item Records <span class="subtitle">${s.items.length} SKUs · ${rows.length} shown</span></h1>

<div class="toolbar">
  <button class="btn primary" id="btnNewItem">+ New Item</button>
  <button class="btn">Receive Stock</button>
  <button class="btn">Transfer</button>
  <button class="btn">Adjust</button>
  <div class="sep"></div>
  <div class="spacer"></div>
  <input class="input" id="invSearch" placeholder="Search SKU / name…" value="${escapeHTML(v.q)}" style="width:240px">
</div>

<div class="grid-12">
  <div class="col-3">
    <div class="rail">
      <h5>Health Filters</h5>
      <ul>
        ${[
          ['all',"All",s.items.length],
          ['short',"Stockout (Short)",s.items.filter(i=>i.health==='Short').length],
          ['low',"Low stock",s.items.filter(i=>i.health==='Low').length],
          ['over',"Overstock",s.items.filter(i=>i.health==='Over').length],
        ].map(([k,l,c]) => `<li class="${v.health===k?'active':''}" data-act="setInvHealth('${k}')">${l} <span class="count">${c}</span></li>`).join('')}
      </ul>
      <h5>Sort by</h5>
      <ul>
        ${[['sku','SKU'],['onhand','On hand'],['avail','Available'],['health','Health']].map(([k,l]) => `<li class="${v.sortKey===k?'active':''}" data-act="setInvSort('${k}')">${l}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="col-9">
    <div class="panel" style="padding:0">
      <table class="data">
        <thead>
          <tr>
            ${th('SKU','sku','inventory')}${th('Name','name','inventory')}${th('Cat','cat','inventory')}
            ${th('On Hand','onhand','inventory')}${th('Avail','avail','inventory')}${th('On SO','onSO','inventory')}${th('On PO','onPO','inventory')}
            ${th('ROP','rop','inventory')}${th('Cost','cost','inventory')}${th('Price','price','inventory')}
            <th>WH</th>${th('Health','health','inventory')}
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(it => `
            <tr class="drill-item" data-sku="${it.sku}">
              <td><strong>${it.sku}</strong></td><td>${escapeHTML(it.name)}</td><td>${it.cat}</td>
              <td class="num">${it.onhand}</td><td class="num ${it.avail<=0?'':''}" style="${it.avail<=0?'color:var(--accent-red);font-weight:700':''}">${it.avail}</td>
              <td class="num">${it.onSO}</td><td class="num">${it.onPO}</td>
              <td class="num">${it.rop}</td>
              <td class="num">$${it.cost.toFixed(2)}</td><td class="num">$${it.price.toFixed(2)}</td>
              <td>${it.wh}</td><td>${statusPill(it.health)}</td>
              <td>${it.health==='Short'||it.health==='Low'?`<button class="btn sm" data-act="reorderItem('${it.sku}')">Reorder</button>`:''}</td>
            </tr>
          `).join('')}
          ${rows.length===0 ? `<tr><td colspan="13" class="center muted" style="padding:20px">No items match.</td></tr>` : ''}
        </tbody>
      </table>
    </div>
  </div>
</div>
`;};

// =========================================================
// ITEM DETAIL
// =========================================================
Screens['item-detail'] = () => {
  const s = Store.state;
  const it = s.items.find(x => x.sku === View.currentItem) || s.items[0];
  return `
<div class="row">
  <h1 class="page-title">${it.sku} <span class="subtitle">${escapeHTML(it.name)} · ${it.cat} · ${statusPill(it.health)}</span></h1>
  <div class="spacer"></div>
  <button class="btn" data-act="prevItem()">◀ Prev</button>
  <button class="btn" data-act="nextItem()">Next ▶</button>
  ${it.health==='Short'||it.health==='Low'?`<button class="btn primary" data-act="reorderItem('${it.sku}')">Create Reorder PO</button>`:`<button class="btn">Edit Item</button>`}
</div>

<div class="grid-12">
  <div class="panel col-3">
    <div class="imgph" style="height:180px;aspect-ratio:auto">product<br/>photo</div>
    <div class="form-row"><label>SKU</label><div class="val">${it.sku}</div></div>
    <div class="form-row"><label>Category</label><div class="val">${it.cat}</div></div>
    <div class="form-row"><label>UoM</label><div class="val">${it.uom}</div></div>
    <div class="form-row"><label>Primary WH</label><div class="val">${it.wh}</div></div>
    <div class="form-row"><label>Last Count</label><div class="val">${it.lastCount}</div></div>
    <div class="form-row"><label>Cost</label><div class="val">$${it.cost.toFixed(2)}</div></div>
    <div class="form-row"><label>Price</label><div class="val">$${it.price.toFixed(2)}</div></div>
    <div class="form-row"><label>ROP</label><div class="val">${it.rop}</div></div>
    <div class="form-row"><label>Safety</label><div class="val">${it.safety}</div></div>
  </div>

  <div class="panel col-5">
    <div class="panel-title">Stock Snapshot</div>
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi"><div class="label">On hand</div><div class="value">${it.onhand}</div><div class="delta muted">${it.uom}</div></div>
      <div class="kpi"><div class="label">Available</div><div class="value" style="${it.avail<=0?'color:var(--accent-red)':''}">${it.avail}</div><div class="delta ${it.avail<=0?'down':''}">${it.avail<=0?'short':'ok'}</div></div>
      <div class="kpi"><div class="label">On SO</div><div class="value">${it.onSO}</div><div class="delta muted">committed</div></div>
      <div class="kpi"><div class="label">On PO</div><div class="value">${it.onPO}</div><div class="delta">incoming</div></div>
    </div>
    <div class="panel-title mt-8" style="border:none;padding:0">Recent Transactions</div>
    <table class="data">
      <thead><tr><th>Date</th><th>Type</th><th>Doc</th><th class="num">Qty</th><th class="num">Balance</th></tr></thead>
      <tbody>
        <tr><td>04/05</td><td>Ship</td><td>SO-8801</td><td class="num">-200</td><td class="num">${it.onhand}</td></tr>
        <tr><td>04/03</td><td>Adj</td><td>CC-0412</td><td class="num">-3</td><td class="num">${it.onhand+200}</td></tr>
        <tr><td>03/28</td><td>Receipt</td><td>PO-2018</td><td class="num">+400</td><td class="num">${it.onhand+203}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="panel col-4">
    <div class="panel-title">Demand vs Supply — next 90d</div>
    ${lineChart([[it.onhand,it.onhand-20,it.onhand-40,it.onhand-60,20,10,0,0,0,0,0,0],[it.onhand,it.onhand,it.onhand,it.onhand+it.onPO,it.onhand+it.onPO-20,it.onhand+it.onPO-40,it.onhand+it.onPO-60,it.onhand+it.onPO-80,it.onhand+it.onPO-100,it.onhand+it.onPO-120,it.onhand+it.onPO-140,it.onhand+it.onPO-160]], {label:"— Projected   — — After PO"})}
    <div class="row tiny mt-8" style="justify-content:space-between">
      <span>ROP <strong>${it.rop}</strong></span>
      <span>Safety <strong>${it.safety}</strong></span>
    </div>
  </div>
</div>
`;};

window.Screens = Screens;
window.View = View;
window.sortRows = sortRows;
window.sparkline = sparkline;
window.barChart = barChart;
window.lineChart = lineChart;
window.donutChart = donutChart;
window.statusPill = statusPill;
window.escapeHTML = escapeHTML;
