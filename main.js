// Meridian ERP — app wiring

(function() {
  const main = document.getElementById('main');
  const bar = document.getElementById('screenbar');
  const subnav = document.getElementById('subnav');
  const megamenu = document.getElementById('megamenu');

  const labels = {
    dashboard: ["Home","Operations Dashboard"],
    orders: ["Sales","Sales Orders"],
    "order-detail": ["Sales","Sales Orders", () => View.currentOrder],
    inventory: ["Inventory","Item Records"],
    "item-detail": ["Inventory","Item Records", () => View.currentItem],
    procurement: ["Procurement","Purchase Orders"],
    manufacturing: ["Manufacturing","Work Orders"],
    crm: ["CRM","Customers","Redwood Fabrication Co."],
    reports: ["Reports","Operations"],
    admin: ["Admin","Users & Roles"]
  };

  let currentScreen = 'dashboard';

  function render() {
    const fn = Screens[currentScreen];
    if (!fn) return;
    main.innerHTML = fn();
    const crumbs = (labels[currentScreen] || ["Home"]).map(c => typeof c === 'function' ? c() : c);
    subnav.innerHTML = crumbs.map((c,i)=>`<span class="crumb">${c}</span>${i<crumbs.length-1?'<span class="crumb-sep">/</span>':''}`).join('') +
      `<span class="spacer" style="flex:1"></span>
       <span class="mono tiny">FY26 · Q2 · Week 16</span>
       <span class="mono tiny muted">Live data</span>`;
    bar.querySelectorAll('button[data-screen]').forEach(b => b.classList.toggle('active', b.dataset.screen === currentScreen));
    renderToasts();
  }

  function setScreen(key) {
    if (!Screens[key]) return;
    currentScreen = key;
    try { localStorage.setItem('meridian-screen', key); } catch(e){}
    render();
    window.scrollTo(0,0);
  }
  window.setScreen = setScreen;

  // drill-down helpers exposed for inline data-act
  window.drillOrder = (id) => { View.currentOrder = id; setScreen('order-detail'); };
  window.drillItem = (sku) => { View.currentItem = sku; setScreen('item-detail'); };
  window.drillPO = (id) => { View.procurement.selected = id; setScreen('procurement'); };

  window.prevOrder = () => {
    const ids = Store.state.orders.map(o=>o.id);
    const i = ids.indexOf(View.currentOrder);
    View.currentOrder = ids[(i-1+ids.length)%ids.length]; render();
  };
  window.nextOrder = () => {
    const ids = Store.state.orders.map(o=>o.id);
    const i = ids.indexOf(View.currentOrder);
    View.currentOrder = ids[(i+1)%ids.length]; render();
  };
  window.prevItem = () => {
    const ids = Store.state.items.map(o=>o.sku);
    const i = ids.indexOf(View.currentItem);
    View.currentItem = ids[(i-1+ids.length)%ids.length]; render();
  };
  window.nextItem = () => {
    const ids = Store.state.items.map(o=>o.sku);
    const i = ids.indexOf(View.currentItem);
    View.currentItem = ids[(i+1)%ids.length]; render();
  };

  // filter/sort setters
  window.setOrderView = (v) => { View.orders.view = v; render(); };
  window.setOrderSort = (k) => { const o = View.orders; if (o.sortKey===k) o.sortDir = o.sortDir==='asc'?'desc':'asc'; else { o.sortKey=k; o.sortDir='asc'; } render(); };
  window.setInvHealth = (k) => { View.inventory.health = k; render(); };
  window.setInvSort = (k) => { const o = View.inventory; if (o.sortKey===k) o.sortDir = o.sortDir==='asc'?'desc':'asc'; else { o.sortKey=k; o.sortDir='asc'; } render(); };
  window.setPOStatus = (s) => { View.procurement.status = s; render(); };
  window.openFilterMenu = () => Store.toast('Filter menu — add more filter chips as needed', 'info');

  // store actions passthrough
  window.approveOrder = (id) => { Store.approveOrder(id); };
  window.releaseHold = (id) => { Store.releaseHold(id); };
  window.cancelOrder = (id) => { Store.cancelOrder(id); };
  window.shipOrder = (id) => { Store.shipOrder(id); };
  window.approvePO = (id) => { Store.approvePO(id); };
  window.receivePO = (id) => { Store.receivePO(id); };
  window.reorderItem = (sku) => { const id = Store.reorderItem(sku); if (id) { Store.toast(`Created ${id} for ${sku}`, 'ok'); } };
  window.releaseWO = (id) => { Store.releaseWO(id); };
  window.startWO = (id) => { Store.startWO(id); };
  window.resetData = () => { if (confirm('Reset all demo data?')) { Store.reset(); Store.toast('Demo data reset', 'info'); } };

  // --- click delegation ---
  main.addEventListener('click', e => {
    // kpi drill
    const kpi = e.target.closest('.kpi[data-go]');
    if (kpi) {
      if (kpi.dataset.filter === 'overdue') View.orders.view = 'overdue';
      if (kpi.dataset.filter === 'short') View.inventory.health = 'short';
      setScreen(kpi.dataset.go); return;
    }
    // action button
    const actBtn = e.target.closest('[data-act]');
    if (actBtn) {
      e.stopPropagation();
      try { (new Function(actBtn.dataset.act))(); } catch(err) { console.error(err); }
      return;
    }
    // row drills
    const drillOrder = e.target.closest('.drill-order');
    if (drillOrder) { window.drillOrder(drillOrder.dataset.id); return; }
    const drillItem = e.target.closest('.drill-item');
    if (drillItem) { window.drillItem(drillItem.dataset.sku); return; }
    const drillPO = e.target.closest('.drill-po');
    if (drillPO) { View.procurement.selected = drillPO.dataset.id; render(); return; }
    // sortable th
    const sortTh = e.target.closest('th[data-sort]');
    if (sortTh) {
      const v = sortTh.dataset.view, k = sortTh.dataset.sort;
      if (View[v].sortKey === k) View[v].sortDir = View[v].sortDir==='asc'?'desc':'asc';
      else { View[v].sortKey = k; View[v].sortDir = 'asc'; }
      render(); return;
    }
    // pick other customer in CRM
    const pc = e.target.closest('.pick-cust');
    if (pc) { Store.toast(`Switched to ${pc.dataset.name}`, 'info'); return; }
    // new order buttons
    if (e.target.id === 'btnNewOrder' || e.target.id === 'btnNewOrderCust') {
      openNewOrderModal(e.target.dataset?.cust || '');
      return;
    }
    if (e.target.id === 'btnNewPO') { openNewPOModal(); return; }
    if (e.target.id === 'btnNewItem') { openNewItemModal(); return; }
    if (e.target.id === 'btnNewWO') { openNewWOModal(); return; }
    if (e.target.id === 'btnNewCustomer') { openNewCustomerModal(); return; }
    if (e.target.id === 'btnNewUser') { openNewUserModal(); return; }
    if (e.target.id === 'btnNewTask') { openNewTaskModal(); return; }
    if (e.target.id === 'btnOrdExport' || e.target.id === 'btnExportReport') { exportCSV(); return; }
  });

  // search inputs (delegated on main)
  main.addEventListener('input', e => {
    if (e.target.id === 'ordSearch') { View.orders.q = e.target.value; debouncedRender(); }
    else if (e.target.id === 'invSearch') { View.inventory.q = e.target.value; debouncedRender(); }
    else if (e.target.id === 'poSearch') { View.procurement.q = e.target.value; debouncedRender(); }
  });

  let renderTimer;
  function debouncedRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      const active = document.activeElement;
      const activeId = active?.id;
      const selStart = active?.selectionStart;
      render();
      if (activeId) {
        const el = document.getElementById(activeId);
        if (el) { el.focus(); try { el.setSelectionRange(selStart, selStart); } catch(e){} }
      }
    }, 120);
  }

  // top nav
  bar.addEventListener('click', e => {
    const b = e.target.closest('button[data-screen]');
    if (b) setScreen(b.dataset.screen);
  });
  megamenu.addEventListener('click', e => {
    const a = e.target.closest('a[data-screen]');
    if (a) { e.preventDefault(); setScreen(a.dataset.screen); }
  });

  // Tweaks
  const tweaks = document.getElementById('tweaks');
  document.getElementById('tweaksBtn').addEventListener('click', () => tweaks.classList.toggle('open'));
  const tweakState = Object.assign({ wobble:1, density:1, annotations:1, accent:'status', defaultScreen:'dashboard' }, TWEAK_DEFAULTS);
  function applyTweaks() {
    document.documentElement.style.setProperty('--wobble', tweakState.wobble);
    document.documentElement.style.setProperty('--density', tweakState.density);
    document.documentElement.style.setProperty('--annotations', tweakState.annotations);
    if (tweakState.accent === 'bw') {
      document.documentElement.style.setProperty('--accent-red','#1a1a1a');
      document.documentElement.style.setProperty('--accent-green','#3a3a3a');
      document.documentElement.style.setProperty('--accent-amber','#555');
      document.documentElement.style.setProperty('--accent-blue','#6b6b6b');
    } else {
      ['--accent-red','--accent-green','--accent-amber','--accent-blue'].forEach(k => document.documentElement.style.removeProperty(k));
    }
  }
  function persistTweaks() { try { window.parent.postMessage({type:'__edit_mode_set_keys', edits: tweakState}, '*'); } catch(e){} }
  document.getElementById('tw-wobble').addEventListener('input', e => { tweakState.wobble = parseFloat(e.target.value); applyTweaks(); persistTweaks(); });
  document.querySelectorAll('#tw-density button').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('#tw-density button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); tweakState.density = parseFloat(b.dataset.v); applyTweaks(); persistTweaks(); }));
  document.querySelectorAll('#tw-anno button').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('#tw-anno button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); tweakState.annotations = parseFloat(b.dataset.v); applyTweaks(); persistTweaks(); }));
  document.querySelectorAll('#tw-accent button').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('#tw-accent button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); tweakState.accent = b.dataset.v; applyTweaks(); persistTweaks(); }));
  document.getElementById('tw-wobble').value = tweakState.wobble;
  document.querySelectorAll('#tw-density button').forEach(b => b.classList.toggle('active', parseFloat(b.dataset.v)===tweakState.density));
  document.querySelectorAll('#tw-anno button').forEach(b => b.classList.toggle('active', parseFloat(b.dataset.v)===tweakState.annotations));
  document.querySelectorAll('#tw-accent button').forEach(b => b.classList.toggle('active', b.dataset.v===tweakState.accent));
  applyTweaks();

  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === '__activate_edit_mode') tweaks.classList.add('open');
    if (d.type === '__deactivate_edit_mode') tweaks.classList.remove('open');
  });
  try { window.parent.postMessage({type:'__edit_mode_available'}, '*'); } catch(e){}

  // ---- modals ----
  function openModal(title, bodyHTML, onSubmit) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal panel" style="position:relative;width:560px;max-width:94vw">
        <div class="panel-title">${title}<div class="actions"><a class="modal-close">✕ close</a></div></div>
        ${bodyHTML}
        <div class="row mt-8" style="justify-content:flex-end;gap:8px">
          <button class="btn modal-close">Cancel</button>
          <button class="btn primary modal-submit">Save</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => wrap.remove()));
    wrap.querySelector('.modal-submit').addEventListener('click', () => {
      const data = {};
      wrap.querySelectorAll('input,select,textarea').forEach(i => data[i.name] = i.value);
      if (onSubmit(data) !== false) wrap.remove();
    });
  }

  function openNewOrderModal(preCust='') {
    const custs = Store.state.customers.map(c=>c.name);
    openModal('New Sales Order', `
      <div class="form-row"><label>Customer</label><div class="val"><select class="input" name="cust" style="width:100%">${custs.map(c=>`<option ${c===preCust?'selected':''}>${c}</option>`).join('')}</select></div></div>
      <div class="form-row"><label>Customer PO</label><div class="val"><input class="input" name="po" placeholder="(optional)" style="width:100%"></div></div>
      <div class="form-row"><label>Warehouse</label><div class="val"><select class="input" name="wh" style="width:100%"><option>WH-01</option><option>WH-02</option><option>WH-03</option></select></div></div>
      <div class="form-row"><label>Required Ship</label><div class="val"><input class="input" name="req" type="date" value="${new Date(Date.now()+7*864e5).toISOString().slice(0,10)}"></div></div>
      <div class="form-row"><label>Lines</label><div class="val"><input class="input" name="lines" type="number" value="3" min="1"></div></div>
      <div class="form-row"><label>Total ($)</label><div class="val"><input class="input" name="total" type="number" value="5000" min="0"></div></div>
      <div class="form-row"><label>Rep</label><div class="val"><input class="input" name="rep" value="O. Marsh"></div></div>
    `, (data) => {
      if (!data.cust) return false;
      data.shipTo = data.cust;
      const id = Store.createOrder(data);
      View.currentOrder = id;
      setScreen('order-detail');
    });
  }

  function openNewPOModal() {
    openModal('New Purchase Order', `
      <div class="form-row"><label>Vendor</label><div class="val"><input class="input" name="vendor" value="Acme Supply Co." style="width:100%"></div></div>
      <div class="form-row"><label>Warehouse</label><div class="val"><select class="input" name="wh" style="width:100%"><option>WH-01</option><option>WH-02</option><option>WH-03</option></select></div></div>
      <div class="form-row"><label>Need-by</label><div class="val"><input class="input" name="need" type="date" value="${new Date(Date.now()+21*864e5).toISOString().slice(0,10)}"></div></div>
      <div class="form-row"><label>Lines</label><div class="val"><input class="input" name="lines" type="number" value="5" min="1"></div></div>
      <div class="form-row"><label>Total ($)</label><div class="val"><input class="input" name="total" type="number" value="20000" min="0"></div></div>
    `, (data) => {
      if (!data.vendor) return false;
      Store.createPO(data);
      render();
    });
  }

  function openNewItemModal() {
    openModal('New Item / SKU', `
      <div class="form-row"><label>SKU</label><div class="val"><input class="input" name="sku" placeholder="e.g. WD-4200" style="width:100%"></div></div>
      <div class="form-row"><label>Name</label><div class="val"><input class="input" name="name" placeholder="Description" style="width:100%"></div></div>
      <div class="form-row"><label>Category</label><div class="val"><select class="input" name="cat" style="width:100%"><option>Hardware</option><option>Electrical</option><option>Fasteners</option><option>Consumable</option></select></div></div>
      <div class="form-row"><label>Warehouse</label><div class="val"><select class="input" name="wh" style="width:100%"><option>WH-01</option><option selected>WH-02</option><option>WH-03</option></select></div></div>
      <div class="form-row"><label>UoM</label><div class="val"><input class="input" name="uom" value="ea" style="width:120px"></div></div>
      <div class="form-row"><label>On-hand</label><div class="val"><input class="input" name="onhand" type="number" value="0" min="0"></div></div>
      <div class="form-row"><label>Reorder pt.</label><div class="val"><input class="input" name="rop" type="number" value="150" min="0"></div></div>
      <div class="form-row"><label>Safety stock</label><div class="val"><input class="input" name="safety" type="number" value="50" min="0"></div></div>
      <div class="form-row"><label>Cost ($)</label><div class="val"><input class="input" name="cost" type="number" step="0.01" value="0"></div></div>
      <div class="form-row"><label>Price ($)</label><div class="val"><input class="input" name="price" type="number" step="0.01" value="0"></div></div>
    `, (data) => {
      if (!data.name) return false;
      const sku = Store.createItem(data);
      if (!sku) return false;
      View.currentItem = sku;
      setScreen('item-detail');
    });
  }

  function openNewWOModal() {
    const items = Store.state.items.map(i=>i.sku);
    openModal('New Work Order', `
      <div class="form-row"><label>Item</label><div class="val"><select class="input" name="item" style="width:100%">${items.map(sku=>`<option>${sku}</option>`).join('')}</select></div></div>
      <div class="form-row"><label>Quantity</label><div class="val"><input class="input" name="qty" type="number" value="100" min="1"></div></div>
      <div class="form-row"><label>Line</label><div class="val"><select class="input" name="line" style="width:100%"><option>Line A · CNC</option><option>Line B · Assy</option><option>Line C · Weld</option><option>Line D · Paint</option><option>Line E · Pack</option></select></div></div>
      <div class="form-row"><label>Start</label><div class="val"><input class="input" name="start" type="date" value="${new Date().toISOString().slice(0,10)}"></div></div>
      <div class="form-row"><label>Due</label><div class="val"><input class="input" name="end" type="date" value="${new Date(Date.now()+3*864e5).toISOString().slice(0,10)}"></div></div>
    `, (data) => {
      if (!data.item) return false;
      Store.createWO(data);
      render();
    });
  }

  function openNewCustomerModal() {
    openModal('New Customer', `
      <div class="form-row"><label>Name</label><div class="val"><input class="input" name="name" placeholder="Company name" style="width:100%"></div></div>
      <div class="form-row"><label>Tier</label><div class="val"><select class="input" name="tier" style="width:100%"><option>1</option><option selected>2</option><option>3</option></select></div></div>
      <div class="form-row"><label>Region</label><div class="val"><select class="input" name="region" style="width:100%"><option>West</option><option>South</option><option>Midwest</option><option>Northeast</option></select></div></div>
      <div class="form-row"><label>Owner</label><div class="val"><input class="input" name="owner" value="O. Marsh" style="width:100%"></div></div>
      <div class="form-row"><label>Credit limit ($)</label><div class="val"><input class="input" name="credit" type="number" value="10000" min="0"></div></div>
      <div class="form-row"><label>Since (year)</label><div class="val"><input class="input" name="since" type="number" value="2026" min="2000" max="2050"></div></div>
    `, (data) => {
      if (!data.name) return false;
      Store.createCustomer(data);
      render();
    });
  }

  function openNewUserModal() {
    openModal('Invite User', `
      <div class="form-row"><label>Name</label><div class="val"><input class="input" name="name" placeholder="Full name" style="width:100%"></div></div>
      <div class="form-row"><label>Email</label><div class="val"><input class="input" name="email" type="email" placeholder="person@meridian.ex" style="width:100%"></div></div>
      <div class="form-row"><label>Role</label><div class="val"><select class="input" name="role" style="width:100%"><option>Ops Manager</option><option>Warehouse Lead</option><option selected>Sales Rep</option><option>Controller</option><option>WH Clerk</option><option>Inv Analyst</option><option>Shop Floor</option></select></div></div>
      <div class="form-row"><label>Require MFA</label><div class="val"><select class="input" name="mfa" style="width:120px"><option>on</option><option>off</option></select></div></div>
    `, (data) => {
      if (!data.name || !data.email) return false;
      Store.createUser(data);
      render();
    });
  }

  function openNewTaskModal() {
    openModal('New Task', `
      <div class="form-row"><label>Subject</label><div class="val"><input class="input" name="subject" placeholder="e.g. Call about Q2 forecast" style="width:100%"></div></div>
      <div class="form-row"><label>Due</label><div class="val"><input class="input" name="due" type="date" value="${new Date(Date.now()+2*864e5).toISOString().slice(0,10)}"></div></div>
      <div class="form-row"><label>Owner</label><div class="val"><input class="input" name="owner" value="A. Rao" style="width:100%"></div></div>
      <div class="form-row"><label>Priority</label><div class="val"><select class="input" name="prio" style="width:100%"><option>Low</option><option selected>Normal</option><option>High</option></select></div></div>
    `, (data) => {
      if (!data.subject) return false;
      Store.update(s => { s.activity.unshift({ts: new Date().toLocaleDateString(), ref:'TASK', msg:`Task: ${data.subject} · due ${data.due} · ${data.prio}`, user:data.owner||'O. Marsh'}); });
      Store.toast(`Task created: ${data.subject}`, 'ok');
    });
  }

  function exportCSV() {
    const rows = Store.state.orders;
    const hdr = ['id','cust','date','req','lines','total','status'];
    const csv = [hdr.join(',')].concat(rows.map(r => hdr.map(h => `"${String(r[h]||'').replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'orders.csv'; a.click();
    Store.toast('Exported orders.csv', 'ok');
  }

  // ---- command palette ----
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey||e.ctrlKey) && e.key === 'k') { e.preventDefault(); openPalette(); }
    if (e.key === 'Escape') { document.querySelectorAll('.modal-backdrop, .palette-backdrop').forEach(x => x.remove()); }
  });
  const topSearch = document.querySelector('.search');
  if (topSearch) { topSearch.style.cursor = 'pointer'; topSearch.addEventListener('click', openPalette); }

  function openPalette() {
    const existing = document.querySelector('.palette-backdrop'); if (existing) { existing.remove(); return; }
    const s = Store.state;
    const items = [
      ...Object.keys(Screens).map(k => ({type:'Screen', label:k, act: () => setScreen(k)})),
      ...s.orders.map(o => ({type:'Order', label:`${o.id} · ${o.cust}`, act:()=>{ View.currentOrder=o.id; setScreen('order-detail'); }})),
      ...s.items.map(i => ({type:'Item', label:`${i.sku} · ${i.name}`, act:()=>{ View.currentItem=i.sku; setScreen('item-detail'); }})),
      ...s.pos.map(p => ({type:'PO', label:`${p.id} · ${p.vendor}`, act:()=>{ View.procurement.selected=p.id; setScreen('procurement'); }})),
      ...s.customers.map(c => ({type:'Customer', label:`${c.name}`, act:()=>setScreen('crm')})),
    ];
    const wrap = document.createElement('div');
    wrap.className = 'palette-backdrop';
    wrap.innerHTML = `
      <div class="palette">
        <input class="palette-input" autofocus placeholder="Jump to… (screen, SO #, SKU, PO #, customer)">
        <div class="palette-list"></div>
      </div>`;
    document.body.appendChild(wrap);
    const input = wrap.querySelector('.palette-input');
    const list = wrap.querySelector('.palette-list');
    let sel = 0;
    function render() {
      const q = input.value.toLowerCase();
      const filtered = items.filter(i => i.label.toLowerCase().includes(q)).slice(0,20);
      list.innerHTML = filtered.map((i, idx) => `<div class="palette-item ${idx===sel?'sel':''}" data-idx="${idx}"><span class="mono tiny muted">${i.type}</span> ${i.label}</div>`).join('') || '<div class="palette-item muted">No matches</div>';
      list._items = filtered;
    }
    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { sel = Math.min((list._items?.length||1)-1, sel+1); render(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { sel = Math.max(0, sel-1); render(); e.preventDefault(); }
      if (e.key === 'Enter') { const it = list._items?.[sel]; if (it) { it.act(); wrap.remove(); } }
    });
    list.addEventListener('click', (e) => {
      const it = e.target.closest('.palette-item'); if (!it || !list._items) return;
      const idx = parseInt(it.dataset.idx); const target = list._items[idx]; if (target) { target.act(); wrap.remove(); }
    });
    wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
    render();
  }

  // ---- toasts ----
  let toastHost;
  function renderToasts() {
    if (!toastHost) { toastHost = document.createElement('div'); toastHost.className = 'toast-host'; document.body.appendChild(toastHost); }
    toastHost.innerHTML = Store.state.notifications.map(t => `<div class="toast ${t.kind}">${escapeHTML(t.msg)}</div>`).join('');
  }

  // Subscribe to store
  Store.subscribe(() => { render(); });

  // Boot
  let start = tweakState.defaultScreen || 'dashboard';
  try { const saved = localStorage.getItem('meridian-screen'); if (saved && Screens[saved]) start = saved; } catch(e){}
  setScreen(start);
})();
