// Meridian ERP — shared reactive store

(function(){
  const LS_KEY = 'meridian-db-v2';

  const seed = {
    orders: [
      {id:"SO-8801",cust:"Northgate Industrial, LLC",po:"PO-11233",rep:"M. Price",date:"2026-03-28",req:"2026-04-04",promised:"2026-04-04",lines:12,total:38214,fulfilled:100,shipTo:"Reno, NV",wh:"WH-01",status:"Shipped",flags:""},
      {id:"SO-8821",cust:"Redwood Fabrication Co.",po:"PO-77421",rep:"A. Rao",date:"2026-03-30",req:"2026-04-05",promised:"2026-04-07",lines:6,total:13495,fulfilled:0,shipTo:"Dallas, TX",wh:"WH-02",status:"Credit hold",flags:"⚑"},
      {id:"SO-8833",cust:"Beacon Electric Supply",po:"4429",rep:"M. Price",date:"2026-04-01",req:"2026-04-08",promised:"2026-04-08",lines:3,total:2180,fulfilled:0,shipTo:"Reno, NV",wh:"WH-01",status:"Staged",flags:""},
      {id:"SO-8844",cust:"Polaris Tools Ltd.",po:"P-90012",rep:"A. Rao",date:"2026-04-02",req:"2026-04-09",promised:"2026-04-09",lines:18,total:47120,fulfilled:0,shipTo:"Dallas, TX",wh:"WH-02",status:"Picking",flags:""},
      {id:"SO-8850",cust:"Hilltop Mfg",po:"",rep:"M. Price",date:"2026-04-02",req:"2026-04-11",promised:"2026-04-11",lines:4,total:6410,fulfilled:0,shipTo:"Reno, NV",wh:"WH-01",status:"Approval",flags:""},
      {id:"SO-8861",cust:"Crestline Construction",po:"PO-3301",rep:"J. Park",date:"2026-04-03",req:"2026-04-05",promised:"2026-04-12",lines:22,total:84300,fulfilled:45,shipTo:"Columbus, OH",wh:"WH-03",status:"Partial",flags:""},
      {id:"SO-8864",cust:"Maple & Steel Co.",po:"PO-6612",rep:"A. Rao",date:"2026-04-03",req:"2026-04-06",promised:"2026-04-12",lines:9,total:18940,fulfilled:0,shipTo:"Dallas, TX",wh:"WH-02",status:"Overdue",flags:"⚑"},
      {id:"SO-8870",cust:"Sapphire Plastics",po:"",rep:"J. Park",date:"2026-04-04",req:"2026-04-10",promised:"2026-04-12",lines:5,total:9220,fulfilled:0,shipTo:"Columbus, OH",wh:"WH-03",status:"Picking",flags:""},
      {id:"SO-8873",cust:"Granite Pipe & Fit.",po:"G-4411",rep:"M. Price",date:"2026-04-04",req:"2026-04-08",promised:"2026-04-13",lines:14,total:28600,fulfilled:20,shipTo:"Reno, NV",wh:"WH-01",status:"Partial",flags:""},
      {id:"SO-8880",cust:"Vanguard Systems",po:"PO-14",rep:"A. Rao",date:"2026-04-05",req:"2026-04-09",promised:"2026-04-14",lines:7,total:15320,fulfilled:0,shipTo:"Dallas, TX",wh:"WH-02",status:"Overdue",flags:"⚑"},
      {id:"SO-8881",cust:"Ironclad Fasteners",po:"",rep:"J. Park",date:"2026-04-05",req:"2026-04-12",promised:"2026-04-14",lines:31,total:62100,fulfilled:0,shipTo:"Columbus, OH",wh:"WH-03",status:"Scheduled",flags:""},
      {id:"SO-8888",cust:"Evergreen Pumps",po:"EP-2201",rep:"M. Price",date:"2026-04-06",req:"2026-04-10",promised:"2026-04-15",lines:11,total:22410,fulfilled:0,shipTo:"Reno, NV",wh:"WH-01",status:"New",flags:""},
      {id:"SO-8892",cust:"Pacific Coating Ltd.",po:"",rep:"A. Rao",date:"2026-04-06",req:"2026-04-11",promised:"2026-04-15",lines:4,total:8740,fulfilled:0,shipTo:"Dallas, TX",wh:"WH-02",status:"New",flags:""},
      {id:"SO-8899",cust:"Harbor Tool Works",po:"HTW-88",rep:"J. Park",date:"2026-04-07",req:"2026-04-12",promised:"2026-04-16",lines:17,total:33900,fulfilled:0,shipTo:"Columbus, OH",wh:"WH-03",status:"Approval",flags:""},
      {id:"SO-8901",cust:"Summit Assemblies",po:"PO-7",rep:"M. Price",date:"2026-04-07",req:"2026-04-10",promised:"2026-04-17",lines:8,total:14220,fulfilled:0,shipTo:"Reno, NV",wh:"WH-01",status:"New",flags:""}
    ],
    items: [
      {sku:"WD-4120",name:"Widget, Alloy 4\" (BL)",cat:"Hardware",uom:"ea",onhand:120,avail:120,onSO:280,onPO:1000,rop:250,safety:100,cost:3.80,price:8.40,wh:"WH-02",lastCount:"2026-04-03",health:"Short",trend:"down"},
      {sku:"WD-4121",name:"Widget, Alloy 4\" (RD)",cat:"Hardware",uom:"ea",onhand:488,avail:488,onSO:120,onPO:0,rop:250,safety:100,cost:3.80,price:8.40,wh:"WH-02",lastCount:"2026-04-03",health:"OK",trend:"flat"},
      {sku:"WD-4122",name:"Widget, Alloy 4\" (GR)",cat:"Hardware",uom:"ea",onhand:214,avail:214,onSO:90,onPO:500,rop:250,safety:100,cost:3.80,price:8.40,wh:"WH-01",lastCount:"2026-03-28",health:"Low",trend:"down"},
      {sku:"WD-5200",name:"Widget, Composite 6\"",cat:"Hardware",uom:"ea",onhand:1240,avail:1000,onSO:240,onPO:0,rop:400,safety:150,cost:5.10,price:11.00,wh:"WH-01",lastCount:"2026-04-05",health:"OK",trend:"flat"},
      {sku:"SP-0091",name:"Sprocket 12T Stainless",cat:"Hardware",uom:"ea",onhand:200,avail:50,onSO:150,onPO:600,rop:150,safety:60,cost:6.70,price:14.20,wh:"WH-02",lastCount:"2026-04-01",health:"Low",trend:"up"},
      {sku:"SP-0092",name:"Sprocket 14T Stainless",cat:"Hardware",uom:"ea",onhand:412,avail:412,onSO:0,onPO:0,rop:150,safety:60,cost:7.10,price:15.40,wh:"WH-02",lastCount:"2026-04-01",health:"OK",trend:"flat"},
      {sku:"BR-7710",name:"Bracket, Universal",cat:"Hardware",uom:"ea",onhand:80,avail:0,onSO:80,onPO:300,rop:120,safety:50,cost:2.90,price:6.80,wh:"WH-02",lastCount:"2026-03-30",health:"Short",trend:"up"},
      {sku:"BR-7720",name:"Bracket, Heavy Duty",cat:"Hardware",uom:"ea",onhand:650,avail:600,onSO:50,onPO:0,rop:150,safety:60,cost:4.10,price:9.20,wh:"WH-02",lastCount:"2026-04-02",health:"OK",trend:"flat"},
      {sku:"CB-3302",name:"Cable Assy 3m",cat:"Hardware",uom:"ea",onhand:300,avail:200,onSO:100,onPO:400,rop:180,safety:80,cost:9.80,price:22.00,wh:"WH-02",lastCount:"2026-04-04",health:"OK",trend:"up"},
      {sku:"CB-3303",name:"Cable Assy 5m",cat:"Hardware",uom:"ea",onhand:88,avail:38,onSO:50,onPO:0,rop:100,safety:40,cost:14.30,price:32.00,wh:"WH-02",lastCount:"2026-04-04",health:"Low",trend:"up"},
      {sku:"FL-0203",name:"Flange 1.5\"",cat:"Hardware",uom:"ea",onhand:500,avail:420,onSO:80,onPO:0,rop:200,safety:80,cost:4.20,price:9.50,wh:"WH-02",lastCount:"2026-03-29",health:"OK",trend:"flat"},
      {sku:"FL-0204",name:"Flange 2\"",cat:"Hardware",uom:"ea",onhand:52,avail:52,onSO:0,onPO:200,rop:100,safety:40,cost:5.00,price:11.80,wh:"WH-02",lastCount:"2026-03-29",health:"Low",trend:"flat"},
      {sku:"GK-1100",name:"Gasket kit (10pc)",cat:"Hardware",uom:"kit",onhand:12,avail:0,onSO:38,onPO:100,rop:60,safety:30,cost:26.00,price:54.00,wh:"WH-02",lastCount:"2026-04-02",health:"Short",trend:"down"},
      {sku:"HG-0055",name:"Hinge, Spring 2\"",cat:"Hardware",uom:"ea",onhand:3410,avail:3400,onSO:10,onPO:0,rop:500,safety:200,cost:1.20,price:2.80,wh:"WH-01",lastCount:"2026-04-04",health:"Over",trend:"flat"},
      {sku:"RV-0021",name:"Rivet Pack 100ct",cat:"Hardware",uom:"pk",onhand:88,avail:88,onSO:0,onPO:0,rop:40,safety:15,cost:6.00,price:12.50,wh:"WH-03",lastCount:"2026-03-28",health:"OK",trend:"flat"}
    ],
    pos: [
      {id:"PO-2041",vendor:"Acme Supply Co.",created:"2026-04-07",need:"2026-04-28",lines:8,total:41280,wh:"WH-01",status:"Approval"},
      {id:"PO-2040",vendor:"Keller Materials",created:"2026-04-07",need:"2026-05-05",lines:4,total:18400,wh:"WH-02",status:"Approval"},
      {id:"PO-2039",vendor:"Acme Supply Co.",created:"2026-04-03",need:"2026-04-18",lines:8,total:42115,wh:"WH-02",status:"In Transit"},
      {id:"PO-2038",vendor:"Shenzhen Parts Ltd.",created:"2026-04-02",need:"2026-06-02",lines:22,total:78640,wh:"WH-03",status:"In Transit"},
      {id:"PO-2037",vendor:"Global Bearings",created:"2026-04-01",need:"2026-04-22",lines:3,total:6240,wh:"WH-01",status:"Sent"},
      {id:"PO-2035",vendor:"Northeast Steel",created:"2026-03-31",need:"2026-04-25",lines:12,total:52300,wh:"WH-03",status:"Sent"},
      {id:"PO-2031",vendor:"Keller Materials",created:"2026-03-28",need:"2026-04-18",lines:6,total:14900,wh:"WH-02",status:"Received"},
      {id:"PO-2029",vendor:"Aurora Fasteners",created:"2026-03-27",need:"2026-04-20",lines:18,total:22180,wh:"WH-01",status:"Received"},
      {id:"PO-2028",vendor:"Pacific Coatings",created:"2026-03-27",need:"2026-04-30",lines:2,total:3420,wh:"WH-03",status:"Draft"},
      {id:"PO-2024",vendor:"Acme Supply Co.",created:"2026-03-25",need:"2026-04-15",lines:10,total:36800,wh:"WH-02",status:"Delayed"},
      {id:"PO-2021",vendor:"Global Bearings",created:"2026-03-24",need:"2026-04-14",lines:4,total:9240,wh:"WH-01",status:"Received"},
      {id:"PO-2018",vendor:"Keller Materials",created:"2026-03-20",need:"2026-03-28",lines:4,total:12400,wh:"WH-01",status:"Closed"}
    ],
    wos: [
      {id:"WO-4401",item:"WD-4120",qty:1000,line:"Line A · CNC",status:"Running",start:"2026-04-13",end:"2026-04-15",done:18,target:240},
      {id:"WO-4402",item:"WD-4122",qty:500,line:"Line D · Paint",status:"Slow",start:"2026-04-14",end:"2026-04-16",done:60,target:180},
      {id:"WO-4403",item:"BR-7710",qty:300,line:"Line C · Weld",status:"Running",start:"2026-04-13",end:"2026-04-17",done:120,target:280},
      {id:"WO-4405",item:"CB-3302",qty:400,line:"Line B · Assy",status:"Running",start:"2026-04-13",end:"2026-04-15",done:140,target:200},
      {id:"WO-4408",item:"GK-1100",qty:100,line:"Line E · Pack",status:"Queued",start:"2026-04-15",end:"2026-04-17",done:0,target:0},
      {id:"WO-4409",item:"FL-0203",qty:200,line:"Line B · Assy",status:"Running",start:"2026-04-15",end:"2026-04-17",done:0,target:0},
      {id:"WO-4410",item:"WD-5200",qty:300,line:"Line D · Paint",status:"Running",start:"2026-04-16",end:"2026-04-18",done:160,target:180},
      {id:"WO-4412",item:"SP-0091",qty:600,line:"Line A · CNC",status:"Queued",start:"2026-04-16",end:"2026-04-18",done:0,target:0},
      {id:"WO-4415",item:"FL-0204",qty:200,line:"Line C · Weld",status:"Queued",start:"2026-04-17",end:"2026-04-20",done:0,target:0},
      {id:"WO-4418",item:"SP-0092",qty:400,line:"Line B · Assy",status:"Draft",start:"2026-04-17",end:"2026-04-19",done:0,target:0},
      {id:"WO-4420",item:"GK-1100",qty:200,line:"Line E · Pack",status:"Slow",start:"2026-04-17",end:"2026-04-19",done:40,target:100},
      {id:"WO-4422",item:"BR-7720",qty:250,line:"Line D · Paint",status:"Draft",start:"2026-04-18",end:"2026-04-20",done:0,target:0}
    ],
    customers: [
      {id:"C-10240",name:"Northgate Industrial, LLC",tier:"3",since:2019,owner:"M. Price",credit:50000,ar:18200,region:"West"},
      {id:"C-10244",name:"Redwood Fabrication Co.",tier:"2",since:2021,owner:"A. Rao",credit:10000,ar:22400,region:"South"},
      {id:"C-10251",name:"Beacon Electric Supply",tier:"2",since:2022,owner:"M. Price",credit:15000,ar:4120,region:"West"},
      {id:"C-10255",name:"Polaris Tools Ltd.",tier:"3",since:2020,owner:"A. Rao",credit:40000,ar:12100,region:"South"},
      {id:"C-10261",name:"Crestline Construction",tier:"2",since:2022,owner:"J. Park",credit:25000,ar:9800,region:"Midwest"}
    ],
    activity: [
      {ts:"04/02 10:14", ref:"SO-8821", msg:"Hold applied: Credit limit exceeded by $3,495", user:"system"},
      {ts:"04/01 16:02", ref:"SO-8821", msg:"PO acknowledged by customer", user:"edi"},
      {ts:"03/30 14:20", ref:"SO-8821", msg:"Order created from Quote Q-5521", user:"A. Rao"}
    ],
    notifications: []
  };

  let state;
  try {
    const raw = localStorage.getItem(LS_KEY);
    state = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(seed));
  } catch(e) { state = JSON.parse(JSON.stringify(seed)); }

  const listeners = new Set();
  function notify() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch(e){}
    listeners.forEach(l => { try { l(); } catch(e){} });
  }

  const Store = {
    get state() { return state; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() { state = JSON.parse(JSON.stringify(seed)); notify(); },
    update(mut) { mut(state); notify(); },
    toast(msg, kind="info") {
      const t = {id: Math.random().toString(36).slice(2), msg, kind, at: Date.now()};
      state.notifications.push(t);
      notify();
      setTimeout(() => {
        state.notifications = state.notifications.filter(x=>x.id!==t.id);
        notify();
      }, 3200);
    },
    // domain actions
    approveOrder(id) {
      Store.update(s => {
        const o = s.orders.find(x=>x.id===id);
        if (o && (o.status === 'Approval' || o.status === 'New')) {
          o.status = 'Scheduled';
          s.activity.unshift({ts: fmtNow(), ref:id, msg:"Order approved", user:"O. Marsh"});
        }
      });
      Store.toast(`Approved ${id}`, 'ok');
    },
    releaseHold(id) {
      Store.update(s => {
        const o = s.orders.find(x=>x.id===id);
        if (o) { o.status = 'Scheduled'; s.activity.unshift({ts: fmtNow(), ref:id, msg:"Credit hold released", user:"O. Marsh"}); }
      });
      Store.toast(`Released hold on ${id}`, 'ok');
    },
    cancelOrder(id) {
      Store.update(s => {
        const o = s.orders.find(x=>x.id===id);
        if (o) { o.status = 'Cancelled'; s.activity.unshift({ts: fmtNow(), ref:id, msg:"Order cancelled", user:"O. Marsh"}); }
      });
      Store.toast(`Cancelled ${id}`, 'warn');
    },
    shipOrder(id) {
      Store.update(s => {
        const o = s.orders.find(x=>x.id===id);
        if (o) { o.status = 'Shipped'; o.fulfilled = 100; s.activity.unshift({ts: fmtNow(), ref:id, msg:"Shipment confirmed", user:"M. Price"}); }
      });
      Store.toast(`Shipped ${id}`, 'ok');
    },
    createOrder(data) {
      const maxN = Math.max(...state.orders.map(o => parseInt(o.id.split('-')[1])||0));
      const id = `SO-${maxN+1}`;
      Store.update(s => {
        s.orders.unshift({
          id, cust: data.cust, po: data.po||"", rep: data.rep||"O. Marsh",
          date: todayISO(), req: data.req, promised: data.req,
          lines: parseInt(data.lines)||1, total: parseFloat(data.total)||0, fulfilled:0,
          shipTo: data.shipTo||"—", wh: data.wh||"WH-01",
          status: "New", flags: ""
        });
        s.activity.unshift({ts: fmtNow(), ref:id, msg:"Order created", user:"O. Marsh"});
      });
      Store.toast(`Created ${id}`, 'ok');
      return id;
    },
    approvePO(id) {
      Store.update(s => {
        const p = s.pos.find(x=>x.id===id);
        if (p && p.status === 'Approval') { p.status = 'Sent'; s.activity.unshift({ts: fmtNow(), ref:id, msg:"PO approved, sent to vendor", user:"O. Marsh"}); }
      });
      Store.toast(`Approved ${id}`, 'ok');
    },
    receivePO(id) {
      Store.update(s => {
        const p = s.pos.find(x=>x.id===id);
        if (p) { p.status = 'Received'; s.activity.unshift({ts: fmtNow(), ref:id, msg:"PO received into stock", user:"J. Ortiz"}); }
      });
      Store.toast(`Received ${id}`, 'ok');
    },
    createPO(data) {
      const maxN = Math.max(...state.pos.map(o => parseInt(o.id.split('-')[1])||0));
      const id = `PO-${maxN+1}`;
      Store.update(s => {
        s.pos.unshift({
          id, vendor: data.vendor, created: todayISO(),
          need: data.need, lines: parseInt(data.lines)||1,
          total: parseFloat(data.total)||0, wh: data.wh||"WH-01",
          status: "Approval"
        });
        s.activity.unshift({ts: fmtNow(), ref:id, msg:"PO created, awaiting approval", user:"O. Marsh"});
      });
      Store.toast(`Created ${id}`, 'ok');
      return id;
    },
    reorderItem(sku) {
      const it = state.items.find(x => x.sku === sku);
      if (!it) return;
      const need = Math.max(it.rop*2 - it.onhand, 200);
      const id = Store.createPO({vendor:"Acme Supply Co.", need: addDays(todayISO(),21), lines:1, total: need*it.cost, wh: it.wh});
      Store.update(s => {
        const x = s.items.find(i=>i.sku===sku); if (x) x.onPO += need;
      });
      return id;
    },
    releaseWO(id) {
      Store.update(s => {
        const w = s.wos.find(x=>x.id===id);
        if (w) w.status = 'Queued';
      });
      Store.toast(`Released ${id}`, 'ok');
    },
    startWO(id) {
      Store.update(s => {
        const w = s.wos.find(x=>x.id===id);
        if (w) w.status = 'Running';
      });
      Store.toast(`Started ${id}`, 'ok');
    },
    createItem(data) {
      const sku = (data.sku||'').trim().toUpperCase() || `NEW-${Math.floor(Math.random()*9000+1000)}`;
      if (state.items.some(i=>i.sku===sku)) { Store.toast(`SKU ${sku} already exists`, 'warn'); return null; }
      Store.update(s => {
        s.items.unshift({
          sku, name: data.name||'Untitled item', cat: data.cat||'Hardware', uom: data.uom||'ea',
          onhand: parseInt(data.onhand)||0, avail: parseInt(data.onhand)||0, onSO:0, onPO:0,
          rop: parseInt(data.rop)||100, safety: parseInt(data.safety)||40,
          cost: parseFloat(data.cost)||0, price: parseFloat(data.price)||0,
          wh: data.wh||'WH-02', lastCount: todayISO(),
          health: (parseInt(data.onhand)||0) < (parseInt(data.rop)||100) ? 'Low' : 'OK',
          trend: 'flat'
        });
        s.activity.unshift({ts: fmtNow(), ref:sku, msg:"Item created", user:"O. Marsh"});
      });
      Store.toast(`Created ${sku}`, 'ok');
      return sku;
    },
    createCustomer(data) {
      const maxN = Math.max(10000, ...state.customers.map(c => parseInt(c.id.split('-')[1])||0));
      const id = `C-${maxN+1}`;
      Store.update(s => {
        s.customers.unshift({
          id, name: data.name||'New Customer', tier: data.tier||'2',
          since: parseInt(data.since)||2026, owner: data.owner||'O. Marsh',
          credit: parseFloat(data.credit)||10000, ar: 0, region: data.region||'West'
        });
        s.activity.unshift({ts: fmtNow(), ref:id, msg:"Customer created", user:"O. Marsh"});
      });
      Store.toast(`Created ${data.name||id}`, 'ok');
      return id;
    },
    createWO(data) {
      const maxN = Math.max(4400, ...state.wos.map(w => parseInt(w.id.split('-')[1])||0));
      const id = `WO-${maxN+1}`;
      Store.update(s => {
        s.wos.unshift({
          id, item: data.item, qty: parseInt(data.qty)||100,
          line: data.line||'Line A · CNC', status: 'Draft',
          start: data.start||todayISO(), end: data.end||addDays(todayISO(),3),
          done:0, target:0
        });
        s.activity.unshift({ts: fmtNow(), ref:id, msg:"Work order created", user:"E. Vasquez"});
      });
      Store.toast(`Created ${id}`, 'ok');
      return id;
    },
    createUser(data) {
      Store.update(s => {
        s.activity.unshift({ts: fmtNow(), ref:data.email||'—', msg:`User invited · ${data.role||'Sales Rep'}`, user:"O. Marsh"});
      });
      Store.toast(`Invited ${data.name||data.email}`, 'ok');
    }
  };

  function fmtNow() {
    const d = new Date();
    return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  function todayISO() { return new Date().toISOString().slice(0,10); }
  function addDays(iso, n) { const d = new Date(iso); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

  window.Store = Store;
  window.fmtMoney = (n) => "$" + (n||0).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:2});
})();
