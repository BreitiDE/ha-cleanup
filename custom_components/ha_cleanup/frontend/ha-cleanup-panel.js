/* Home Assistant Cleanup – sidebar panel (vanilla web component, no build step). */
const VERSION = "1.2.4";

const CSS = `
:host {
  color-scheme: light;
  --page:#f9f9f7; --surface:#fcfcfb; --field:#ffffff; --ink:#0b0b0b; --ink-2:#52514e; --muted:#6b6a65;
  --grid:#e1e0d9; --axis:#c3c2b7; --border:rgba(11,11,11,.10); --field-border:rgba(11,11,11,.20); --hover:rgba(11,11,11,.04);
  --accent:#ce6c00; --accent-text:#a45502; --on-accent:#0b0b0b; --accent-soft:rgba(206,108,0,.12); --track:#f0efec;
  --good:#0ca30c; --good-bg:rgba(12,163,12,.12); --good-text:#086b08;
  --warning:#fab219; --warn-bg:rgba(250,178,25,.18); --warn-text:#7a5200;
  --critical:#d03b3b; --crit-bg:rgba(208,59,59,.12); --crit-text:#a62a2a;
  --s2:#2a78d6;
  --shadow:0 12px 40px rgba(0,0,0,.18);
  display:block; min-height:100vh; background:var(--page); color:var(--ink);
  font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif; -webkit-font-smoothing:antialiased;
}
:host([dark]) {
  color-scheme: dark;
  --page:#0d0d0d; --surface:#1a1a19; --field:#232322; --ink:#f0efec; --ink-2:#c3c2b7; --muted:#9a998f;
  --grid:#2c2c2a; --axis:#383835; --border:rgba(255,255,255,.10); --field-border:rgba(255,255,255,.20); --hover:rgba(255,255,255,.05);
  --accent-text:#e09156; --accent-soft:rgba(206,108,0,.18); --track:#262624;
  --good-bg:rgba(12,163,12,.18); --good-text:#6fd36f; --warn-bg:rgba(250,178,25,.16); --warn-text:#f5c860;
  --crit-bg:rgba(208,59,59,.18); --crit-text:#f08a8a; --s2:#3987e5; --shadow:0 12px 40px rgba(0,0,0,.6);
}
* { box-sizing:border-box; }
[hidden] { display:none !important; }
a { color:var(--accent-text); }
:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
svg.i { width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; flex:none; }
.wrap { max-width:1400px; margin:0 auto; padding:0 20px; }
header { background:var(--surface); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:20; }
header .wrap { display:flex; flex-wrap:wrap; align-items:center; gap:10px 24px; padding-top:10px; padding-bottom:10px; }
.brand { display:flex; align-items:center; gap:10px; font-weight:650; font-size:18px; white-space:nowrap; }
nav { display:flex; flex-wrap:wrap; gap:4px; }
nav button { font:inherit; border:0; background:transparent; color:var(--ink-2); padding:8px 12px; border-radius:8px; cursor:pointer; }
nav button[aria-current="page"] { background:var(--accent-soft); color:var(--accent-text); font-weight:600; }
nav button:hover:not([aria-current]) { background:var(--hover); }
.who { margin-left:auto; display:flex; align-items:center; gap:14px; color:var(--ink-2); font-size:13px; flex-wrap:wrap; }
.dot { width:8px; height:8px; border-radius:50%; background:var(--muted); display:inline-block; }
.dot.ok { background:var(--good); } .dot.bad { background:var(--critical); } .dot.busy { background:var(--accent); }
main.wrap { padding-top:20px; padding-bottom:48px; display:flex; flex-direction:column; gap:16px; }
.view { display:flex; flex-direction:column; gap:16px; }
.btn { font:inherit; padding:9px 14px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--ink);
  cursor:pointer; display:inline-flex; align-items:center; gap:8px; min-height:38px; text-decoration:none; white-space:nowrap; }
.btn:hover { background:var(--hover); }
.btn.primary { background:var(--accent); border-color:var(--accent); color:var(--on-accent); font-weight:600; }
.btn.primary:hover { filter:brightness(1.06); }
.btn.small { padding:5px 10px; min-height:30px; font-size:13px; }
.btn.danger { color:var(--crit-text); }
.btn:disabled { opacity:.5; cursor:default; }
.icon-btn { width:32px; height:32px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--ink-2);
  cursor:pointer; display:inline-flex; align-items:center; justify-content:center; text-decoration:none; flex:none; }
.icon-btn:hover { background:var(--hover); color:var(--ink); }
.icon-btn.danger { color:var(--crit-text); }
.icon-btn.ok { color:var(--good-text); }
.icon-btn:disabled { opacity:.3; cursor:default; }
.icon-btn:disabled:hover { background:var(--surface); }
.actions { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
.target { margin-left:auto; display:flex; align-items:center; gap:10px; padding:7px 12px; border-radius:8px; border:1px solid var(--border);
  background:var(--surface); flex-wrap:wrap; min-width:0; max-width:100%; min-height:38px; }
.target code { font-size:13px; overflow-wrap:anywhere; }
.target .lbl { color:var(--ink-2); font-size:13px; }
.linkbtn { font:inherit; font-size:13px; background:none; border:0; padding:0; color:var(--accent-text); text-decoration:underline; cursor:pointer; }
.stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(165px,1fr)); gap:12px; }
.card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; min-width:0; }
.kpi { padding:14px 16px; }
.kpi .l { color:var(--ink-2); font-size:12px; }
.kpi .v { font-size:26px; font-weight:600; letter-spacing:-.02em; margin-top:2px; font-variant-numeric:tabular-nums; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.kpi .s { color:var(--muted); font-size:12px; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.kpi.hl .v { color:var(--accent-text); }
.kpi.bad .v { color:var(--crit-text); }
.card-head { display:flex; flex-wrap:wrap; align-items:center; gap:8px 16px; margin-bottom:10px; }
h2 { font-size:15px; font-weight:600; margin:0; }
h3 { font-size:13px; font-weight:600; margin:0 0 6px; }
.hint { color:var(--muted); font-size:12px; }
.seg { margin-left:auto; display:inline-flex; border:1px solid var(--border); border-radius:8px; padding:2px; flex-wrap:wrap; }
.seg.l { margin-left:0; }
.seg button { font:inherit; font-size:13px; padding:5px 10px; border-radius:6px; border:0; background:transparent; color:var(--ink-2); cursor:pointer; }
.seg button[aria-pressed="true"] { background:var(--accent); color:var(--on-accent); font-weight:600; }
.table-wrap { overflow-x:auto; margin:0 -16px; padding:0 16px; }
table { width:100%; border-collapse:collapse; font-size:13px; }
th { text-align:left; color:var(--muted); font-weight:500; font-size:12px; padding:6px 8px; border-bottom:1px solid var(--axis); white-space:nowrap; }
td { padding:9px 8px; border-bottom:1px solid var(--grid); vertical-align:top; }
td.num, th.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
td.nw { white-space:nowrap; }
td.mid { vertical-align:middle; }
tbody tr:hover { background:var(--hover); }
tr.sel { background:var(--accent-soft); }
tr.flash td { animation:flash 1.6s ease-out; }
@keyframes flash { from { background:rgba(206,108,0,.35); } to { background:transparent; } }
.t { font-weight:600; }
.sub { color:var(--muted); font-size:12px; overflow-wrap:anywhere; }
.mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
.badge { display:inline-block; font-size:11px; padding:1px 6px; border-radius:4px; border:1px solid var(--border); color:var(--ink-2); white-space:nowrap; }
.badge.acc { border-color:transparent; background:var(--accent-soft); color:var(--accent-text); }
.pill { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; padding:2px 8px; border-radius:999px; white-space:nowrap; }
.pill::before { content:""; width:7px; height:7px; border-radius:50%; background:currentColor; }
.pill.ok { background:var(--good-bg); color:var(--good-text); }
.pill.warn { background:var(--warn-bg); color:var(--warn-text); }
.pill.error { background:var(--crit-bg); color:var(--crit-text); }
.pill.neutral { background:var(--track); color:var(--ink-2); }
.pill.acc { background:var(--accent-soft); color:var(--accent-text); }
.empty { color:var(--muted); padding:22px 0; text-align:center; }
.row-actions { display:inline-flex; gap:4px; }
.msg-err { color:var(--crit-text); }
.dimmed { color:var(--muted); }
.up { color:var(--crit-text); } .down { color:var(--s2); }
.form-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; }
label.f { display:flex; flex-direction:column; gap:6px; font-size:13px; color:var(--ink-2); min-width:0; }
label.f .hint { margin-top:-2px; }
input[type=text], input[type=number], input[type=search], input[type=time], select, textarea {
  font:inherit; font-size:14px; padding:8px 10px; border-radius:8px; border:1px solid var(--field-border); background:var(--field); color:var(--ink); min-width:0; width:100%; }
select { width:auto; }
label.f select { width:100%; }
input[type=checkbox] { accent-color:var(--accent); width:16px; height:16px; margin:0; }
.inline { display:flex; gap:8px; align-items:center; }
.check { display:flex; gap:10px; align-items:flex-start; font-size:13px; color:var(--ink); }
.check input { margin-top:2px; }
.check .hint { display:block; }
/* entity picker */
.picker { position:relative; flex:1 1 360px; max-width:560px; }
.picker > svg { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; }
.picker input { padding-left:34px; min-height:38px; }
.dropdown { position:absolute; left:0; right:0; top:calc(100% + 4px); z-index:30; background:var(--surface); border:1px solid var(--border);
  border-radius:12px; box-shadow:var(--shadow); max-height:420px; overflow:auto; padding:4px; }
.dropdown button { display:flex; width:100%; text-align:left; gap:10px; align-items:center; font:inherit; background:none; border:0; border-radius:8px;
  padding:7px 10px; color:var(--ink); cursor:pointer; }
.dropdown button.active, .dropdown button:hover { background:var(--accent-soft); }
.dropdown .nm { flex:1; min-width:0; }
.dropdown .nm div { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dropdown .more { padding:8px 10px; color:var(--muted); font-size:12px; }
/* entity overview */
.ov { display:grid; grid-template-columns:minmax(0,1fr) 280px; gap:16px; }
.chart { position:relative; flex:1; min-height:260px; user-select:none; }
.ov-main { display:flex; flex-direction:column; min-width:0; }
.chart svg { display:block; width:100%; height:100%; overflow:visible; }
th button.sort { font:inherit; font-size:12px; color:var(--muted); background:none; border:0; padding:0; cursor:pointer; white-space:nowrap; display:inline-flex; gap:4px; align-items:center; }
th button.sort:hover { color:var(--ink); }
th button.sort[aria-sort] { color:var(--accent-text); font-weight:600; }
.chart .zsel { position:absolute; top:10px; bottom:24px; background:var(--accent-soft); border-left:1px solid var(--accent); border-right:1px solid var(--accent); pointer-events:none; z-index:4; }
.chart.zoomable { cursor:crosshair; }
.chart .tip { position:absolute; pointer-events:none; background:var(--surface); border:1px solid var(--border); box-shadow:var(--shadow);
  border-radius:8px; padding:6px 9px; font-size:12px; white-space:nowrap; z-index:5; }
.chart .tip b { font-variant-numeric:tabular-nums; }
.legend { display:flex; flex-wrap:wrap; gap:6px 16px; font-size:12px; color:var(--ink-2); margin-top:6px; }
.legend i { display:inline-block; width:12px; height:3px; border-radius:2px; vertical-align:middle; margin-right:6px; }
.legend i.band { height:10px; background:var(--accent-soft); }
.legend i.dotc { width:8px; height:8px; border-radius:50%; background:var(--critical); }
.legend i.dash { background:repeating-linear-gradient(90deg,var(--ink-2) 0 4px,transparent 4px 7px); }
dl.facts { display:grid; grid-template-columns:max-content 1fr; gap:5px 14px; margin:0; font-size:13px; }
dl.facts dt { color:var(--muted); } dl.facts dd { margin:0; text-align:right; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
.side { display:flex; flex-direction:column; gap:14px; min-width:0; }
.box { border:1px solid var(--border); border-radius:8px; padding:12px; }
.range { display:grid; grid-template-columns:1fr 1fr auto; gap:8px; align-items:end; }
.range label.f { gap:4px; font-size:12px; }
details summary { cursor:pointer; color:var(--ink-2); font-size:13px; }
pre.code { margin:8px 0 0; padding:10px 12px; border-radius:8px; background:var(--track); font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;
  overflow:auto; white-space:pre; }
.selbar { display:flex; flex-wrap:wrap; align-items:center; gap:8px 10px; padding:10px 14px; border-radius:12px; background:var(--accent-soft); margin-bottom:10px; }
.selbar .end { margin-left:auto; }
.banner { display:flex; flex-wrap:wrap; align-items:center; gap:10px; padding:10px 14px; border-radius:12px; font-size:13px; font-weight:500; }
.banner.warn { background:var(--warn-bg); color:var(--warn-text); }
.banner.info { background:var(--accent-soft); color:var(--accent-text); }
.banner.err { background:var(--crit-bg); color:var(--crit-text); }
.banner .end { margin-left:auto; display:inline-flex; gap:8px; }
.pager { display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding-top:12px; color:var(--ink-2); font-size:13px; }
.pager .end { margin-left:auto; display:inline-flex; gap:4px; align-items:center; }
.bar { height:6px; border-radius:3px; background:var(--track); overflow:hidden; min-width:120px; }
.bar > div { height:100%; background:var(--accent); border-radius:3px; transition:width .3s; }
.spin { width:14px; height:14px; border-radius:50%; border:2px solid var(--accent-soft); border-top-color:var(--accent); animation:spin .8s linear infinite; display:inline-block; }
@keyframes spin { to { transform:rotate(360deg); } }
.loading { display:flex; align-items:center; gap:10px; color:var(--ink-2); padding:22px 0; justify-content:center; }
dialog { border:1px solid var(--border); border-radius:12px; padding:0; background:var(--surface); color:var(--ink); box-shadow:var(--shadow);
  width:min(560px,calc(100vw - 24px)); max-height:calc(100vh - 32px); }
dialog::backdrop { background:rgba(11,11,11,.45); }
.dlg { display:flex; flex-direction:column; max-height:calc(100vh - 34px); }
.dlg-head { display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid var(--grid); }
.dlg-head h2 { font-size:16px; }
.dlg-head .icon-btn { margin-left:auto; }
.dlg-body { padding:16px 20px; overflow:auto; display:flex; flex-direction:column; gap:14px; font-size:14px; }
.dlg-foot { display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:flex-end; padding:14px 20px; border-top:1px solid var(--grid); }
.dlg-foot .grow { margin-right:auto; color:var(--ink-2); font-size:13px; }
.form-err { color:var(--crit-text); font-size:13px; margin:0; }
.toast { position:fixed; left:50%; bottom:20px; transform:translateX(-50%); background:var(--ink); color:var(--page); padding:10px 16px;
  border-radius:8px; font-size:13px; box-shadow:var(--shadow); z-index:50; max-width:calc(100vw - 32px); display:flex; gap:14px; align-items:center; }
.toast.err { background:var(--critical); color:#fff; }
.toast button { font:inherit; font-weight:600; background:none; border:0; color:var(--accent); cursor:pointer; padding:0; }
footer { color:var(--muted); font-size:12px; display:flex; flex-wrap:wrap; gap:16px; }
.fchip { display:inline-flex; gap:6px; align-items:center; font-size:12px; padding:3px 6px 3px 10px; border-radius:999px; background:var(--accent-soft); color:var(--accent-text); font-weight:600; }
.fchip button { border:0; background:none; color:inherit; cursor:pointer; padding:0; display:inline-flex; }
.chips { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.chips button { font:12px ui-monospace,SFMono-Regular,Menlo,monospace; padding:3px 8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--ink); cursor:pointer; }
.chips button:hover { background:var(--hover); }
.target.db { cursor:help; }
/* analysis overlay */
.overlay { position:fixed; inset:0; z-index:40; background:rgba(11,11,11,.55); overflow:auto; overscroll-behavior:contain; padding:24px 20px; }
.sheet { max-width:1400px; margin:0 auto; background:var(--page); border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow); }
.sheet-head { position:sticky; top:-24px; z-index:5; display:flex; flex-wrap:wrap; align-items:center; gap:10px 16px; padding:14px 20px;
  background:var(--surface); border-bottom:1px solid var(--border); border-radius:12px 12px 0 0; }
.sheet-head .ttl { min-width:0; margin-right:auto; }
.sheet-head h2 { font-size:17px; }
.sheet-head .ctl { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.sheet-body { padding:16px 20px 20px; display:flex; flex-direction:column; gap:16px; }
@media (max-width:980px) { .ov { grid-template-columns:minmax(0,1fr); } }
@media (max-width:700px) { .overlay { padding:0; } .sheet { border-radius:0; min-height:100%; } .sheet-head { top:0; border-radius:0; } .sheet-body { padding:12px; } }
@media (max-width:700px) { .target, .who { margin-left:0; } .wrap { padding:0 12px; } }
`;

const I = {
  logo: `<svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#ce6c00"/><path d="M7 22l6-6 4 4 8-9" fill="none" stroke="#0b0b0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="9" r="2.4" fill="#0b0b0b"/></svg>`,
  first: '<svg class="i" viewBox="0 0 24 24"><path d="M17 6l-6 6 6 6M8 6v12"/></svg>',
  last: '<svg class="i" viewBox="0 0 24 24"><path d="M7 6l6 6-6 6M16 6v12"/></svg>',
  search: '<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  scan: '<svg class="i" viewBox="0 0 24 24"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10"/></svg>',
  chart: '<svg class="i" viewBox="0 0 24 24"><path d="M4 19h16M6 15l4-5 3 3 5-7"/></svg>',
  filter: '<svg class="i" viewBox="0 0 24 24"><path d="M4 5h16l-6 8v5l-4 2v-7z"/></svg>',
  db: '<svg class="i" viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></svg>',
  edit: '<svg class="i" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  x: '<svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg class="i" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
  dl: '<svg class="i" viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  restore: '<svg class="i" viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5"/></svg>',
  plus: '<svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  undo: '<svg class="i" viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  prev: '<svg class="i" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg class="i" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  trash: '<svg class="i" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  folder: '<svg class="i" viewBox="0 0 24 24"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SOURCES = { states: "States", statistics: "Hourly statistics", statistics_short_term: "5-minute statistics" };
const METHODS = {
  spike: ["Spike detection", "Compares each value with its neighbours (rolling median). Best for single wrong values."],
  iqr: ["IQR fences", "Flags values far outside the middle 50 % of all values."],
  zscore: ["Z-score", "Flags values many standard deviations away from the mean."],
  range: ["Plausible range only", "Only flags values outside the minimum / maximum you set for the entity."],
};
const DEF_THRESH = { spike: 6, iqr: 3, zscore: 4, range: 0 };
const PERIODS = [[1, "24 hours"], [3, "3 days"], [7, "7 days"], [14, "14 days"], [31, "31 days"], [90, "90 days"], [365, "1 year"], [3650, "All"]];
const ACTIONS = { edit: "Value changed", delete: "Values deleted", adjust: "Counter adjusted", undo: "Undo", backup: "Backup created",
  backup_delete: "Backup deleted", restore: "Restore", settings: "Settings saved", error: "Error",
  scan: "Scan", purge: "Orphans removed" };
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

class HaCleanupPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.S = {
      view: "entities", info: null, entities: null, scan: new Map(), scanning: null, entityFilter: "all", entityPage: 1,
      selected: null, source: "states", days: 7, method: null, threshold: null, result: null, loading: false, err: null,
      sel: new Set(), sort: "time", outPage: 1, chartMode: "normal", q: "", ddIndex: 0,
      settings: null, backups: null, log: null, logFilter: "all", lastScan: null, orphanSel: new Set(), fscan: null, recent: [], anaRestore: null, rg: { q: "", filter: "all", page: 1, per: 25 },
    };
    try {
      const v = localStorage.getItem("ha-cleanup-view"); if (v) this.S.view = v;
      const s = localStorage.getItem("ha-cleanup-source"); if (s && SOURCES[s]) this.S.source = s;
      const ui = JSON.parse(localStorage.getItem("ha-cleanup-ui") || "null");
      if (ui && typeof ui === "object") {
        if (["all", "outliers", "stats", "orphaned"].includes(ui.entityFilter)) this.S.entityFilter = ui.entityFilter;
        if (ui.entityPage > 0) this.S.entityPage = ui.entityPage;
        if (typeof ui.q === "string") this.S.q = ui.q;
        if (ui.scanDays > 0) this.S.scanDays = ui.scanDays;
        if (Array.isArray(ui.recent)) this.S.recent = ui.recent.slice(0, 6);
        if (ui.fscan && Array.isArray(ui.fscan.results)) this.S.fscan = { ...ui.fscan, map: new Map(ui.fscan.results.map((x) => [x.entity_id, x])) };
        if (ui.ana && ui.ana.entity) this.S.anaRestore = ui.ana;
        if (ui.rg && typeof ui.rg === "object") this.S.rg = { ...this.S.rg, ...ui.rg };
        if (ui.esort && ["name", "count", "outliers"].includes(ui.esort.key)) this.S.esort = ui.esort;
      }
    } catch {}
  }

  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    this.toggleAttribute("dark", !!(h.themes && h.themes.darkMode));
    if (first) this._init();
    else if (this.$("who-user")) this.$("who-user").textContent = h.user?.name || "–";
  }
  get hass() { return this._hass; }
  set narrow(n) { this.toggleAttribute("narrow", !!n); }
  set panel(p) { this._panel = p; }

  $(id) { return this.shadowRoot.getElementById(id); }
  ws(type, data = {}) { return this._hass.callWS({ type: `ha_cleanup/${type}`, ...data }); }

  // ------------------------------------------------------------------ formatting
  get lang() { return this._hass?.locale?.language || this._hass?.language || navigator.language || "en"; }
  get tz() { const l = this._hass?.locale; return l && l.time_zone === "local" ? undefined : this._hass?.config?.time_zone; }
  num(v, max = 3) {
    if (v == null || !isFinite(v)) return "–";
    const a = Math.abs(v);
    const digits = a !== 0 && a < 0.01 ? 6 : a >= 1000 ? Math.min(max, 1) : max;
    return new Intl.NumberFormat(this.lang, { maximumFractionDigits: digits }).format(v);
  }
  int(v) { return v == null ? "–" : new Intl.NumberFormat(this.lang).format(v); }
  dt(ts, withSec = false) {
    if (!ts) return "–";
    return new Intl.DateTimeFormat(this.lang, { weekday: "short", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
      ...(withSec ? { second: "2-digit" } : {}), timeZone: this.tz }).format(new Date(ts * 1000));
  }
  shortDt(ts) {
    return new Intl.DateTimeFormat(this.lang, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: this.tz }).format(new Date(ts * 1000));
  }
  bytes(b) {
    if (b == null) return "–";
    if (b >= 1e9) return this.num(b / 1e9, 1) + " GB";
    if (b >= 1e6) return Math.round(b / 1e6) + " MB";
    if (b >= 1e3) return Math.round(b / 1e3) + " kB";
    return b + " B";
  }
  ago(ts) {
    const d = Date.now() / 1000 - ts;
    if (d < 90) return "just now";
    if (d < 3600) return `${Math.round(d / 60)} min ago`;
    if (d < 86400 * 2) return `${Math.round(d / 3600)} h ago`;
    return `${Math.round(d / 86400)} days ago`;
  }
  unit(u) { return u ? ` ${esc(u)}` : ""; }

  toast(msg, isErr = false, action = null) {
    this.shadowRoot.querySelector(".toast")?.remove(); clearTimeout(this._toastT);
    const d = document.createElement("div");
    d.className = "toast" + (isErr ? " err" : ""); d.setAttribute("role", "status");
    const s = document.createElement("span"); s.textContent = msg; d.appendChild(s);
    if (action) { const b = document.createElement("button"); b.textContent = action.label; b.onclick = () => { d.remove(); action.run(); }; d.appendChild(b); }
    this.shadowRoot.appendChild(d);
    this._toastT = setTimeout(() => d.remove(), isErr ? 7000 : action ? 9000 : 3500);
  }
  errMsg(e) { return e?.message || e?.error?.message || String(e); }

  // ------------------------------------------------------------------ skeleton
  _init() {
    this.shadowRoot.innerHTML = `<style>${CSS}</style>
      <header><div class="wrap">
        <div class="brand">${I.logo}Cleanup</div>
        <nav aria-label="Main menu">
          <button data-view="entities">Entities</button><button data-view="ranges">Ranges</button><button data-view="backup">Backup</button>
          <button data-view="settings">Settings</button><button data-view="logs">Logs</button>
        </nav>
        <div class="who">
          <span><span class="dot" id="status-dot"></span> <span id="status-text">connecting …</span></span>
          <span>signed in as <b id="who-user">${esc(this._hass.user?.name || "–")}</b></span>
        </div>
      </div></header>
      <main class="wrap">
        <div id="banners"></div>
        <section class="view" id="view-entities"></section>
        <section class="view" id="view-backup" hidden></section>
        <section class="view" id="view-ranges" hidden></section>
        <section class="view" id="view-settings" hidden></section>
        <section class="view" id="view-logs" hidden></section>
        <footer><span>Home Assistant Cleanup ${VERSION}</span><span id="foot"></span></footer>
      </main>
      <div class="overlay" id="ana" hidden role="dialog" aria-modal="true" aria-labelledby="ana-title">
        <div class="sheet">
          <div class="sheet-head">
            <div class="ttl"><h2 id="ana-title">–</h2><div class="sub mono" id="ana-id"></div></div>
            <div class="ctl">
              <select id="source" aria-label="Data source">${Object.entries(SOURCES).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
              <select id="days" aria-label="Period">${PERIODS.map(([d, l]) => `<option value="${d}">${l}</option>`).join("")}</select>
              <button class="icon-btn" data-act="reanalyze" title="Reload" aria-label="Reload">${I.restore}</button>
              <button class="icon-btn" data-act="close-ana" title="Close (Esc)" aria-label="Close">${I.x}</button>
            </div>
          </div>
          <div class="sheet-body">
            <section class="card" id="ov-card"></section>
            <section class="card" id="out-card" hidden></section>
          </div>
        </div>
      </div>
      <dialog id="dlg"></dialog>`;
    const root = this.shadowRoot;
    root.querySelector("nav").addEventListener("click", (e) => { const b = e.target.closest("button[data-view]"); if (b) this.show(b.dataset.view); });
    root.addEventListener("click", (e) => this.onClick(e));
    root.addEventListener("change", (e) => this.onChange(e));
    root.addEventListener("input", (e) => this.onInput(e));
    root.addEventListener("keydown", (e) => this.onKey(e));
    root.addEventListener("focusin", (e) => { if (e.target.id === "picker") this.openDropdown(); });
    root.addEventListener("mousedown", (e) => { if (!e.composedPath().some((n) => n.classList?.contains?.("picker"))) this.closeDropdown(); });
    this._resize = new ResizeObserver(() => { if (this.S.result && this.S.anaOpen) this.drawChart(); });
    this._resize.observe(this.$("ana").querySelector(".sheet"));
    this.$("ana").addEventListener("mousedown", (e) => { if (e.target === this.$("ana")) this.closeAna(); });
    this.show(this.S.view);
    this.loadInfo();
    this.loadLastScan();
  }

  show(view) {
    if (!["entities", "ranges", "backup", "settings", "logs"].includes(view)) view = "entities";
    this.S.view = view;
    try { localStorage.setItem("ha-cleanup-view", view); } catch {}
    this.shadowRoot.querySelectorAll("nav button").forEach((b) => b.dataset.view === view ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
    this.shadowRoot.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== "view-" + view));
    if (view === "entities") this.viewEntities();
    if (view === "backup") this.viewBackup();
    if (view === "settings") this.viewSettings();
    if (view === "ranges") this.viewRanges();
    if (view === "logs") this.viewLogs();
  }

  /** Scan results currently shown: the filter scan if one is active, otherwise the last full scan. */
  get sc() { return this.S.fscan ? this.S.fscan.map : this.S.scan; }

  saveUI() {
    try {
      const f = this.S.fscan;
      localStorage.setItem("ha-cleanup-ui", JSON.stringify({
        entityFilter: this.S.entityFilter, entityPage: this.S.entityPage, q: this.S.q, scanDays: this.S.scanDays, recent: this.S.recent,
        fscan: f ? { pattern: f.pattern, days: f.days, ts: f.ts, ids: f.ids, results: [...f.map.values()] } : null,
        ana: this.S.anaOpen && this.S.selected ? { entity: this.S.selected, source: this.S.source, days: this.S.days } : null,
        rg: this.S.rg, esort: this.S.esort,
      }));
    } catch {}
  }

  /** Entities with recorded states that match "sensor.*, *victron*" (entity_id or name, case-insensitive). */
  matchPattern(pattern) {
    const terms = String(pattern || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (!terms.length || !this.S.entities) return [];
    const tests = terms.map((t) => {
      if (t.includes("*") || t.includes("?")) {
        const re = new RegExp("^" + t.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
        return (e) => re.test(e.entity_id) || re.test(String(e.name || "").toLowerCase());
      }
      const exact = this.S.entities.some((e) => e.entity_id === t);
      return exact ? (e) => e.entity_id === t : (e) => e.entity_id.includes(t) || String(e.name || "").toLowerCase().includes(t);
    });
    return this.S.entities.filter((e) => e.has_states && tests.some((f) => f(e)));
  }

  async loadLastScan() {
    try {
      const r = await this.ws("scan/last");
      if (r.scan) {
        this.S.lastScan = r.scan;
        this.S.scan = new Map(r.scan.results.map((x) => [x.entity_id, x]));
        if (this.S.view === "entities") { this.renderEntityStats(); this.renderEntityTable(); }
      }
    } catch {}
  }

  async loadInfo() {
    try {
      this.S.info = await this.ws("info");
      const i = this.S.info;
      if (this.S.method == null) { this.S.method = i.settings.method; this.S.days = i.settings.days; }
      this.$("status-dot").className = "dot " + (i.busy || i.scanning ? "busy" : "ok");
      this.$("status-text").textContent = i.scanning ? `scan running ${i.scanning.done}/${i.scanning.total} …` : i.busy ? `${i.busy} running …` : `Recorder · ${i.engine === "sqlite" ? "SQLite" : i.engine}${i.db_size ? " · " + this.bytes(i.db_size) : ""}`;
      this.renderBanners();
      if (i.scanning && !this._polling) { this.S.scanning = i.scanning; this.renderScanProgress(); this.pollScan(); }
      if (this.S.view === "entities") this.renderEntityStats();
      if (this.S.view === "backup") this.renderBackupStats();
      if (this.S.view === "logs") this.renderLogs();
      if (this.S.view === "ranges") this.renderRanges();
    } catch (e) {
      this.$("status-dot").className = "dot bad";
      this.$("status-text").textContent = "not available";
      this.$("banners").innerHTML = `<div class="banner err">${esc(this.errMsg(e))}</div>`;
    }
  }

  renderBanners() {
    const p = this.S.info?.pending_restore;
    this.$("banners").innerHTML = p ? `<div class="banner warn">${I.restore}<span>Restore of <b>${esc(p.name)}</b> is prepared. It replaces the database during the next restart of Home Assistant.</span>
      <span class="end"><button class="btn small primary" data-act="restart">Restart now</button><button class="btn small" data-act="cancel-restore">Cancel restore</button></span></div>` : "";
  }

  // =================================================================== ENTITIES
  viewEntities() {
    const v = this.$("view-entities");
    if (!v.dataset.ready) {
      v.dataset.ready = "1";
      v.innerHTML = `
        <div class="actions">
          <div class="picker">${I.search}
            <input type="search" id="picker" placeholder="Search entities: name, entity_id, unit …" autocomplete="off" spellcheck="false" aria-label="Search entity" role="combobox" aria-expanded="false">
            <div class="dropdown" id="dropdown" hidden role="listbox"></div>
          </div>
          <select id="scan-days" aria-label="Scan period" title="Period checked by “Scan all”"></select>
          <button class="btn primary" data-act="scan">${I.scan}Scan all</button>
          <button class="btn" data-act="scan-filter">${I.filter}Scan filter …</button>
          <div class="target db" id="db-box">${I.db}<code id="db-path">–</code></div>
        </div>
        <div id="fscan-bar"></div>
        <section class="stats" id="entity-stats" aria-label="Statistics"></section>
        <section class="card" aria-labelledby="h-ent">
          <div class="card-head"><h2 id="h-ent">Entities</h2><span class="hint" id="ent-hint">numeric entities in the recorder</span>
            <div class="seg" id="ent-seg" role="group" aria-label="Filter">
              <button data-f="all" aria-pressed="true">All</button><button data-f="outliers" aria-pressed="false">With outliers</button>
              <button data-f="stats" aria-pressed="false">Long-term statistics</button><button data-f="orphaned" aria-pressed="false">Orphaned</button>
            </div></div>
          <div id="scan-progress"></div><div id="orph-bar"></div>
          <div class="table-wrap"><table id="ent-table" style="min-width:860px"></table></div>
          <div class="pager" id="ent-pager"></div>
        </section>`;
    }
    if (this.$("picker").value !== this.S.q) this.$("picker").value = this.S.q;
    this.renderScanProgress();
    this.renderEntityStats();
    if (!this.S.entities) this.loadEntities();
    else this.renderEntityTable();
  }

  async loadEntities() {
    if (this._loadingEntities) return this._loadingEntities;
    this._loadingEntities = this._loadEntities().finally(() => { this._loadingEntities = null; });
    return this._loadingEntities;
  }

  async _loadEntities() {
    if (this.$("ent-table")) this.$("ent-table").innerHTML = `<tbody><tr><td><div class="loading"><span class="spin"></span>Reading the recorder …</div></td></tr></tbody>`;
    try {
      const r = await this.ws("entities");
      this.S.entities = r.entities;
      if (this.$("ent-table")) { this.renderEntityStats(); this.renderEntityTable(); }
      const a = this.S.anaRestore; this.S.anaRestore = null;
      if (a && this.S.entities.some((e) => e.entity_id === a.entity)) {
        if (SOURCES[a.source]) this.S.source = a.source;
        if (a.days > 0) this.S.days = a.days;
        this.S.selected = a.entity; this.openAna(); this.analyze();
      }
      if (this.S.view === "ranges") this.renderRanges();
    } catch (e) { if (this.$("ent-table")) this.$("ent-table").innerHTML = `<tbody><tr><td class="empty msg-err">${esc(this.errMsg(e))}</td></tr></tbody>`; }
  }

  renderScanDays() {
    const sel = this.$("scan-days"), i = this.S.info; if (!sel) return;
    const def = Number(i?.settings.scan_days ?? 3);
    if (this.S.scanDays == null) this.S.scanDays = def;
    const keep = i?.keep_days;
    // States only exist for the recorder's keep_days, so longer periods add nothing.
    let opts = [[1, "Last 24 hours"], [3, "Last 3 days"], [7, "Last 7 days"], [14, "Last 14 days"], [31, "Last 31 days"]];
    if (keep) { opts = opts.filter(([d]) => d < keep); opts.push([keep, `All kept (${keep} days)`]); }
    if (!opts.some(([d]) => d === def)) opts.push([def, `Last ${this.num(def)} days`]);
    if (this.S.scanDays !== def && !opts.some(([d]) => d === this.S.scanDays)) opts.push([this.S.scanDays, `Last ${this.num(this.S.scanDays)} days`]);
    opts.sort((a, b) => a[0] - b[0]);
    sel.innerHTML = opts.map(([d, l]) => `<option value="${d}" ${d === this.S.scanDays ? "selected" : ""}>${l}${d === def ? " (default)" : ""}</option>`).join("");
  }

  renderEntityStats() {
    this.renderScanDays();
    const box = this.$("entity-stats"); if (!box) return;
    const i = this.S.info, ents = this.S.entities || [];
    if (this.$("db-path")) {
      const full = i ? (i.db_path || i.engine) : "–";
      this.$("db-path").textContent = i?.db_path ? i.db_path.split("/").pop() : full;
      this.$("db-box").title = i?.db_path ? `Database: ${i.db_path}` : `Database: ${full}`;
    }
    const fs = this.S.fscan;
    this.$("fscan-bar").innerHTML = fs ? `<div class="banner info" style="padding:8px 14px"><span>Showing scan result for filter</span>
      <span class="fchip"><span class="mono">${esc(fs.pattern)}</span> · ${this.int(fs.ids.length)} entit${fs.ids.length === 1 ? "y" : "ies"} · last ${this.num(fs.days)} days · ${this.ago(fs.ts)}<button data-act="fscan-clear" title="Back to the full scan" aria-label="Back to the full scan">${I.x}</button></span>
      <span class="end"><button class="btn small" data-act="fscan-rerun">${I.restore}Run again</button></span></div>` : "";
    const withStats = ents.filter((e) => e.statistic);
    const counters = withStats.filter((e) => e.statistic.has_sum).length;
    const orphaned = ents.filter((e) => e.orphaned).length;
    const scanned = [...this.sc.values()];
    const withOut = scanned.filter((r) => r.outliers > 0);
    const totalOut = withOut.reduce((a, r) => a + r.outliers, 0);
    const tiles = [
      ["Numeric entities", this.S.entities ? this.int(ents.length) : "…", this.S.entities ? `${this.int(ents.filter((e) => e.exists).length)} active · ${this.int(ents.filter((e) => e.has_states).length)} with history` : "loading"],
      ["Long-term statistics", this.S.entities ? this.int(withStats.length) : "…", `${this.int(withStats.length - counters)} measured · ${this.int(counters)} counter${counters === 1 ? "" : "s"}`],
      ["Outliers found", scanned.length ? this.int(totalOut) : "–", scanned.length ? (fs ? `in ${this.int(withOut.length)} of ${this.int(scanned.length)} filtered entities` : `in ${this.int(withOut.length)} entities · ${this.S.lastScan ? this.ago(this.S.lastScan.ts) + (this.S.lastScan.aborted ? " · stopped, partial" : "") : "just now"}`) : (i?.next_scan ? `next scan ${this.shortDt(i.next_scan)}` : "run “Scan all”"), totalOut ? "bad" : ""],
      ["Orphaned", this.S.entities ? this.int(orphaned) : "…", "entity no longer exists"],
      ["Database", i?.db_size ? this.bytes(i.db_size) : (i ? (i.engine === "sqlite" ? "–" : i.engine) : "…"), i ? `states kept ${i.keep_days} days` : ""],
      ["Changes", i ? this.int(i.changes_30d) : "…", i ? `${this.int(i.changed_values_30d)} values · last 30 days` : ""],
    ];
    box.innerHTML = tiles.map(([l, v, s, c]) => `<div class="card kpi ${c || ""}"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${esc(s)}</div></div>`).join("");
  }

  filteredEntities() {
    const q = this.S.q.trim().toLowerCase();
    let list = this.S.entities || [];
    if (this.S.fscan) { const ids = new Set(this.S.fscan.ids); list = list.filter((e) => ids.has(e.entity_id)); }
    if (q) {
      const parts = q.split(/\s+/);
      list = list.filter((e) => { const h = `${e.entity_id} ${e.name} ${e.unit || ""} ${e.device_class || ""}`.toLowerCase(); return parts.every((p) => h.includes(p)); });
    }
    const f = this.S.entityFilter;
    if (f === "outliers") list = list.filter((e) => (this.sc.get(e.entity_id)?.outliers || 0) > 0).sort((a, b) => this.sc.get(b.entity_id).max_score - this.sc.get(a.entity_id).max_score);
    if (f === "stats") list = list.filter((e) => e.statistic);
    if (f === "orphaned") list = list.filter((e) => e.orphaned);
    const so = this.S.esort;
    if (so) {
      const dir = so.dir === "desc" ? -1 : 1;
      if (so.key === "name") {
        list = [...list].sort((a, b) => dir * String(a.name || a.entity_id).localeCompare(String(b.name || b.entity_id), this.lang, { sensitivity: "base" }) || a.entity_id.localeCompare(b.entity_id));
      } else {
        // Entities without a scan result always go to the end, whatever the direction.
        const val = (e) => this.sc.get(e.entity_id)?.[so.key];
        list = [...list].sort((a, b) => {
          const va = val(a), vb = val(b);
          if (va == null && vb == null) return a.entity_id.localeCompare(b.entity_id);
          if (va == null) return 1;
          if (vb == null) return -1;
          return dir * (va - vb) || a.entity_id.localeCompare(b.entity_id);
        });
      }
    }
    return list;
  }

  sortHead(key, label, num) {
    const so = this.S.esort, on = so && so.key === key;
    const arrow = on ? (so.dir === "asc" ? (key === "name" ? "A→Z ↑" : "↑") : (key === "name" ? "Z→A ↓" : "↓")) : "";
    const tip = key === "name" ? "Sort by name (A–Z / Z–A)" : "Sort (large → small / small → large)";
    return `<th class="${num ? "num" : ""}"><button class="sort" data-esort="${key}" title="${tip}" ${on ? `aria-sort="${so.dir === "asc" ? "ascending" : "descending"}"` : ""}>${label}${arrow ? ` <span>${arrow}</span>` : ""}</button></th>`;
  }

  renderEntityTable() {
    const tbl = this.$("ent-table"); if (!tbl || !this.S.entities) return;
    const list = this.filteredEntities();
    const per = 50, pages = Math.max(1, Math.ceil(list.length / per));
    this.S.entityPage = Math.min(this.S.entityPage, pages);
    const page = list.slice((this.S.entityPage - 1) * per, this.S.entityPage * per);
    const orphansOnPage = page.filter((e) => e.orphaned);
    const allOrph = orphansOnPage.length && orphansOnPage.every((e) => this.S.orphanSel.has(e.entity_id));
    const head = `<thead><tr><th style="width:28px">${orphansOnPage.length ? `<input type="checkbox" id="orph-all" ${allOrph ? "checked" : ""} aria-label="Select orphaned entities on this page" title="Select orphaned entities">` : ""}</th><th>Status</th>${this.sortHead("name", "Entity")}<th class="num">Current</th><th>Statistics</th>${this.sortHead("count", "Values scanned", true)}${this.sortHead("outliers", "Outliers", true)}<th>Worst value</th><th class="num">Actions</th></tr></thead>`;
    if (!page.length) {
      const msg = this.S.entityFilter === "outliers" && !this.sc.size ? "No scan yet. “Scan all” checks every entity for outliers." : "No entities match.";
      tbl.innerHTML = head + `<tbody><tr><td colspan="9" class="empty">${msg}</td></tr></tbody>`;
    } else {
      tbl.innerHTML = head + "<tbody>" + page.map((e) => {
        const sc = this.sc.get(e.entity_id);
        const status = e.orphaned ? `<span class="pill neutral">Orphaned</span>` : !e.exists ? `<span class="pill neutral">${e.external ? "External" : "Inactive"}</span>`
          : sc ? (sc.outliers ? `<span class="pill error">${this.int(sc.outliers)} outlier${sc.outliers === 1 ? "" : "s"}</span>` : `<span class="pill ok">Clean</span>`) : `<span class="pill neutral">Not scanned</span>`;
        const st = e.statistic ? `<span class="badge">${e.statistic.has_sum ? "counter (sum)" : "measurement"}</span>` : `<span class="dimmed">–</span>`;
        const cur = e.state == null ? "–" : isFinite(parseFloat(e.state)) ? this.num(parseFloat(e.state)) + this.unit(e.unit) : esc(e.state);
        const osel = this.S.orphanSel.has(e.entity_id);
        return `<tr class="${e.entity_id === this.S.selected || osel ? "sel" : ""}">
          <td class="mid">${e.orphaned ? `<input type="checkbox" data-orph="${esc(e.entity_id)}" ${osel ? "checked" : ""} aria-label="Select">` : ""}</td>
          <td class="nw">${status}</td>
          <td><div class="t">${esc(e.name)}</div><div class="sub mono">${esc(e.entity_id)}</div></td>
          <td class="num">${cur}</td><td>${st}${e.limits ? ` <span class="badge acc" title="Plausible range set">range</span>` : ""}</td>
          <td class="num">${sc ? this.int(sc.count) : "–"}</td>
          <td class="num ${sc?.outliers ? "msg-err" : ""}">${sc ? this.int(sc.outliers) : "–"}</td>
          <td class="nw">${sc?.worst_value != null ? `${this.num(sc.worst_value)}${this.unit(e.unit)} <span class="sub">${this.shortDt(sc.worst_ts)}</span>` : `<span class="dimmed">–</span>`}</td>
          <td class="num"><span class="row-actions">${e.orphaned ? `<button class="icon-btn danger" data-purge="${esc(e.entity_id)}" title="Remove from database" aria-label="Remove from database">${I.trash}</button>` : ""}<button class="btn small" data-analyze="${esc(e.entity_id)}">${I.chart}Analyze</button></span></td></tr>`;
      }).join("") + "</tbody>";
    }
    this.$("ent-hint").textContent = `${this.int(list.length)} of ${this.int(this.S.entities.length)} numeric entities` + (this.S.fscan ? ` · filter ${this.S.fscan.pattern}` : "") + (this.S.q ? ` matching “${this.S.q}”` : "");
    this.saveUI();
    const nOrph = this.S.orphanSel.size, allOrphans = this.S.entities.filter((e) => e.orphaned).length;
    this.$("orph-bar").innerHTML = nOrph ? `<div class="selbar"><b>${this.int(nOrph)} orphaned selected</b>
      <button class="btn small danger" data-act="purge-selected">${I.trash}Remove from database</button>
      <span class="end">${nOrph < allOrphans ? `<button class="linkbtn" data-act="orph-all">Select all ${this.int(allOrphans)} orphaned</button> ` : ""}<button class="linkbtn" data-act="orph-none">Clear selection</button></span></div>`
      : this.S.entityFilter === "orphaned" && allOrphans ? `<div class="hint" style="margin-bottom:8px">Orphaned entities no longer exist in Home Assistant, but their history and statistics are still in the database. Select them to remove the data.</div>` : "";
    const p = this.S.entityPage;
    this.$("ent-pager").innerHTML = pages > 1 ? `<span>${this.int((p - 1) * per + 1)}–${this.int(Math.min(list.length, p * per))} of ${this.int(list.length)}</span>
      <span class="end"><button class="icon-btn" data-epage="${p - 1}" ${p <= 1 ? "disabled" : ""} aria-label="Previous page">${I.prev}</button>
      <span style="padding:0 6px">Page ${p} of ${pages}</span>
      <button class="icon-btn" data-epage="${p + 1}" ${p >= pages ? "disabled" : ""} aria-label="Next page">${I.next}</button></span>` : "";
    this.$("ent-seg").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === this.S.entityFilter));
  }

  // ---------------- picker
  openDropdown() {
    const dd = this.$("dropdown"); if (!dd || !this.S.entities) return;
    const list = this.filteredEntities().slice(0, 60);
    this.S.ddList = list; this.S.ddIndex = Math.min(this.S.ddIndex, Math.max(0, list.length - 1));
    dd.innerHTML = list.length ? list.map((e, i) => `<button type="button" role="option" data-pick="${esc(e.entity_id)}" class="${i === this.S.ddIndex ? "active" : ""}">
        <span class="nm"><div class="t">${esc(e.name)}</div><div class="sub mono">${esc(e.entity_id)}</div></span>
        ${e.unit ? `<span class="badge">${esc(e.unit)}</span>` : ""}${e.statistic ? `<span class="badge">${e.statistic.has_sum ? "Σ" : "LTS"}</span>` : ""}
        ${this.sc.get(e.entity_id)?.outliers ? `<span class="pill error">${this.sc.get(e.entity_id).outliers}</span>` : ""}</button>`).join("")
      + (this.filteredEntities().length > 60 ? `<div class="more">Type more to narrow down …</div>` : "")
      : `<div class="more">No numeric entity matches.</div>`;
    dd.hidden = false; this.$("picker").setAttribute("aria-expanded", "true");
  }
  closeDropdown() { const dd = this.$("dropdown"); if (dd && !dd.hidden) { dd.hidden = true; this.$("picker").setAttribute("aria-expanded", "false"); } }

  pick(entityId) {
    this.S.selected = entityId; this.S.sel.clear(); this.S.outPage = 1; this.S.zoom = null;
    const e = this.S.entities?.find((x) => x.entity_id === entityId);
    if (e && !e.has_states && this.S.source === "states") { this.S.source = "statistics"; this.$("source").value = "statistics"; }
    this.closeDropdown();
    if (this.$("picker")) { this.$("picker").value = ""; this.S.q = ""; this.renderEntityTable(); }
    this.openAna();
    this.analyze();
  }

  // ---------------- analysis overlay
  openAna() {
    const e = this.S.entities?.find((x) => x.entity_id === this.S.selected);
    this.$("ana-title").textContent = e?.name || this.S.selected;
    this.$("ana-id").textContent = this.S.selected;
    this.$("source").value = this.S.source; this.$("days").value = String(this.S.days);
    if (!this.S.anaOpen) {
      this.S.result = null; this.S.zoom = null; this.$("out-card").hidden = true;
      this.$("ov-card").innerHTML = "";
      this._lastFocus = this.shadowRoot.activeElement;
    }
    this.S.anaOpen = true; this.$("ana").hidden = false; this.$("ana").scrollTop = 0; this.saveUI();
    this.$("ana").querySelector('[data-act="close-ana"]').focus({ preventScroll: true });
  }

  closeAna() {
    if (!this.S.anaOpen) return;
    this.S.anaOpen = false; this.$("ana").hidden = true; this.S.result = null; this.S.zoom = null; this.S.sel.clear(); this.saveUI();
    if (this.S.view === "entities") { this.renderEntityTable(); this.renderEntityStats(); }
    try { this._lastFocus?.focus({ preventScroll: true }); } catch {}
  }

  // ---------------- analyze
  async analyze() {
    if (!this.S.selected) { this.toast("Choose an entity first (search field or table).", true); return; }
    this.S.loading = true; this.S.err = null;
    const ov = this.$("ov-card");
    if (!this.S.result || this.S.result.entity_id !== this.S.selected) ov.innerHTML = `<div class="loading"><span class="spin"></span>Loading ${esc(this.S.selected)} …</div>`;
    else ov.querySelector(".chart")?.style.setProperty("opacity", ".5");
    try {
      const r = await this.ws("analyze", { entity_id: this.S.selected, source: this.S.source, days: this.S.days, method: this.S.method || undefined,
        threshold: this.S.threshold || undefined });
      if (!this.S.anaOpen || r.entity_id !== this.S.selected) return;
      this.S.result = r; this.S.loading = false;
      this.$("ana-title").textContent = r.name;
      if (this.S.zoom && this.S.zoom.key !== this.zoomKey()) this.S.zoom = null;
      // keep the scan table in sync for the states source
      if (this.S.source === "states" && this.S.days <= (this.S.info?.settings.scan_days || 3)) {
        const target = this.S.fscan && this.S.fscan.map.has(r.entity_id) ? this.S.fscan.map : this.S.scan;
        target.set(r.entity_id, { entity_id: r.entity_id, count: r.stats.count || 0, outliers: r.total_outliers, max_score: Math.max(0, ...r.outliers.map((o) => o.score)),
          worst_value: r.outliers.length ? r.outliers.reduce((a, b) => (b.score > a.score ? b : a)).value : null,
          worst_ts: r.outliers.length ? r.outliers.reduce((a, b) => (b.score > a.score ? b : a)).ts : null });
      }
      this.S.sel = new Set([...this.S.sel].filter((id) => r.outliers.some((o) => o.id === id)));
      this.renderOverview(); this.renderOutliers(); this.renderEntityTable(); this.renderEntityStats();
      if (this.S.zoom) this.loadZoom();
    } catch (e) {
      this.S.loading = false; this.S.result = null;
      ov.innerHTML = `<div class="card-head"><h2>${esc(this.S.selected)}</h2></div><div class="empty msg-err">${esc(this.errMsg(e))}</div>`;
      this.$("out-card").hidden = true;
    }
  }

  zoomLabel() {
    const z = this.S.zoom; if (!z) return "";
    const f = new Intl.DateTimeFormat(this.lang, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: this.tz });
    const g = new Intl.DateTimeFormat(this.lang, { hour: "2-digit", minute: "2-digit", ...(z.end - z.start < 3600 ? { second: "2-digit" } : {}), timeZone: this.tz });
    const sameDay = new Date(z.start * 1000).toDateString() === new Date(z.end * 1000).toDateString();
    return `${f.format(new Date(z.start * 1000))} – ${sameDay ? g.format(new Date(z.end * 1000)) : f.format(new Date(z.end * 1000))}`;
  }

  renderOverview() {
    const r = this.S.result, ov = this.$("ov-card"); if (!r) return;
    ov.hidden = false;
    const s = r.stats, u = r.unit;
    const kindLabel = r.kind === "sum" ? "change per period" : r.kind === "measurement" ? "mean per period" : "recorded states";
    const thr = r.info?.threshold;
    const method = this.S.method || r.info?.method || "spike";
    const facts = [
      ["Values", this.int(s.count) + (r.truncated ? " (newest only)" : "")],
      ...(r.skipped ? [["unknown / unavailable", this.int(r.skipped)]] : []),
      ["Minimum", s.count ? this.num(r.stats_minmax?.min ?? s.min) + this.unit(u) : "–"],
      ["Maximum", s.count ? this.num(r.stats_minmax?.max ?? s.max) + this.unit(u) : "–"],
      ["Mean", this.num(s.mean) + this.unit(u)], ["Median", this.num(s.median) + this.unit(u)],
      ["Std. deviation", this.num(s.std)], ["1 % / 99 %", s.count ? `${this.num(s.p01)} / ${this.num(s.p99)}` : "–"],
      ["Resolution", this.num(r.info?.resolution)],
      ...(r.current != null ? [["Current state", isFinite(parseFloat(r.current)) ? this.num(parseFloat(r.current)) + this.unit(u) : esc(r.current)]] : []),
    ];
    ov.innerHTML = `
      <div class="card-head"><h2>Overview</h2>
        <span class="hint">${esc(SOURCES[r.source])} · ${kindLabel} · ${this.dt(r.start)} – ${this.dt(Math.min(r.end, Date.now() / 1000))}</span>
        ${this.S.zoom ? `<span class="fchip" style="padding-right:10px" title="Drag again to zoom further">Zoom ${esc(this.zoomLabel())}</span>
          <button class="btn small" data-act="zoom-reset">${I.restore}Reset zoom</button>` : ""}
        <div class="seg" id="chart-seg" role="group" aria-label="Chart scale"><button data-cm="normal" aria-pressed="${this.S.chartMode === "normal"}">Normal range</button><button data-cm="full" aria-pressed="${this.S.chartMode === "full"}">Full range</button></div></div>
      <div class="ov">
        <div class="ov-main"><div class="chart" id="chart"></div>
          <div class="legend"><span><i style="background:var(--accent)"></i>${r.kind === "sum" ? "change per period" : "value"}</span>${r.kind === "measurement" ? `<span><i class="band"></i>min – max per period</span>` : `<span id="band-legend" hidden><i class="band"></i>min – max per pixel</span>`}
            <span><i class="dotc"></i>outlier</span>${r.limits?.min != null || r.limits?.max != null ? `<span><i class="dash"></i>plausible range</span>` : ""}
            <span class="hint" style="margin-left:auto">${this.S.zoom ? "drag to zoom further · double-click or “Reset zoom” to see the whole period" : "drag across the chart to zoom into a time range"}</span></div></div>
        <div class="side">
          <dl class="facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
          <div class="box"><h3>Detection</h3>
            <div class="form-grid" style="grid-template-columns:1fr 92px;gap:8px">
              <label class="f" style="font-size:12px;gap:4px">Method<select id="method">${Object.entries(METHODS).map(([k, [l]]) => `<option value="${k}" ${k === method ? "selected" : ""}>${l}</option>`).join("")}</select></label>
              <label class="f" style="font-size:12px;gap:4px" title="Higher = fewer outliers">Sensitivity<input type="number" id="threshold" min="0.5" step="0.5" value="${thr ?? ""}" ${method === "range" ? "disabled" : ""}></label>
            </div>
            <div class="hint" style="margin-top:6px">${esc(METHODS[method]?.[1] || "")} Higher number = only stronger outliers.</div>
          </div>
          <div class="box"><h3>Plausible range</h3>
            <div class="range"><label class="f">Minimum<input type="number" id="lim-min" step="any" value="${r.limits?.min ?? ""}" placeholder="none"></label>
              <label class="f">Maximum<input type="number" id="lim-max" step="any" value="${r.limits?.max ?? ""}" placeholder="none"></label>
              <button class="btn small" data-act="save-limits">Save</button></div>
            <div class="hint" style="margin-top:6px">Values outside are always flagged, with every method and in “Scan all”.</div>
          </div>
        </div>
      </div>
      ${this.preventionHtml(r)}`;
    this.drawChart();
  }

  preventionHtml(r) {
    if (!r.entity_id.startsWith("sensor.") || !r.stats.count) return "";
    const sig = r.info?.robust_sigma || r.stats.std || 1;
    const radius = Number((Math.max(sig * 5, (r.info?.resolution || 0) * 5)).toPrecision(2));
    const lo = r.limits?.min, hi = r.limits?.max;
    const slug = r.entity_id.split(".")[1];
    const ha = `sensor:
  - platform: filter
    name: "${r.name} (filtered)"
    unique_id: ${slug}_filtered
    entity_id: ${r.entity_id}
    filters:
      - filter: outlier
        window_size: 4
        radius: ${radius}${lo != null || hi != null ? `
      - filter: range${lo != null ? `
        lower_bound: ${lo}` : ""}${hi != null ? `
        upper_bound: ${hi}` : ""}` : ""}`;
    const esp = `    filters:${lo != null || hi != null ? `
      - clamp:${lo != null ? `
          min_value: ${lo}` : ""}${hi != null ? `
          max_value: ${hi}` : ""}
          ignore_out_of_range: true` : ""}
      - median:
          window_size: 5
          send_every: 1`;
    return `<details style="margin-top:14px"><summary>Prevent new outliers for this sensor</summary>
      <div class="form-grid" style="margin-top:8px">
        <div><div class="hint">Home Assistant <b>filter</b> integration (configuration.yaml). Use the new entity in dashboards and the energy panel.</div><pre class="code">${esc(ha)}</pre></div>
        <div><div class="hint">If the sensor comes from <b>ESPHome</b>: filter on the device, before the value is sent.</div><pre class="code">${esc(esp)}</pre></div>
      </div></details>`;
  }

  /** Outliers shown in chart and list: all, or only those inside the zoomed time range. */
  visibleOutliers() {
    const r = this.S.result; if (!r) return [];
    const z = this.S.zoom;
    return z ? r.outliers.filter((o) => o.ts >= z.start && o.ts <= z.end) : r.outliers;
  }

  zoomKey() { return `${this.S.selected}|${this.S.source}|${this.S.days}`; }

  async zoomTo(start, end) {
    if (end - start < 60) { const m = (start + end) / 2; start = m - 30; end = m + 30; }
    this.S.zoom = { key: this.zoomKey(), start, end, chart: null, loading: true };
    this.S.outPage = 1;
    this.renderOverview(); this.renderOutliers();
    await this.loadZoom();
  }

  async loadZoom() {
    const z = this.S.zoom; if (!z) return;
    z.loading = true;
    try {
      // Fetch the zoomed time range again so the chart shows every single value, not the downsampled overview.
      const r = await this.ws("analyze", { entity_id: this.S.selected, source: this.S.source, start: z.start, end: z.end,
        method: this.S.method || undefined, threshold: this.S.threshold || undefined });
      if (this.S.zoom !== z) return;
      z.chart = r.chart; z.count = r.stats.count || 0; z.loading = false;
    } catch (e) { if (this.S.zoom === z) { this.S.zoom = null; this.toast(this.errMsg(e), true); } }
    this.drawChart();
  }

  resetZoom() { if (!this.S.zoom) return; this.S.zoom = null; this.S.outPage = 1; this.renderOverview(); this.renderOutliers(); }

  drawChart() {
    const box = this.$("chart"), r = this.S.result; if (!box || !r) return;
    const W = Math.max(280, box.clientWidth), H = box.clientHeight || 260;
    const pad = { l: 56, r: 10, t: 10, b: 24 };
    const z = this.S.zoom;
    if (z && z.loading && !z.chart) { box.innerHTML = `<div class="loading" style="height:100%"><span class="spin"></span>Loading the zoomed range …</div>`; return; }
    const c = z ? z.chart : r.chart, n = c.t.length;
    if (!n) { box.innerHTML = `<div class="empty">${z ? "No values in the zoomed time range." : "No numeric values in this period."}</div>`; this.bindZoom(box, null); return; }
    const outs = this.visibleOutliers();
    const t1 = z ? z.end : Math.max(c.t[n - 1], Math.min(r.end, Date.now() / 1000));
    const tmin = z ? z.start : Math.min(r.start, c.t[0]);
    let lo, hi;
    if (this.S.chartMode === "normal" && outs.length) {
      const flagged = new Set(outs.map((o) => o.value));
      const pool = [];
      for (let i = 0; i < n; i++) { if (!flagged.has(c.max[i])) pool.push(c.max[i]); if (!flagged.has(c.min[i])) pool.push(c.min[i]); }
      outs.forEach((o) => pool.push(o.expected));
      lo = Math.min(...pool); hi = Math.max(...pool);
    } else {
      lo = Math.min(...c.min, ...outs.map((o) => o.value)); hi = Math.max(...c.max, ...outs.map((o) => o.value));
    }
    if (r.limits?.min != null) lo = Math.min(lo, r.limits.min);
    if (r.limits?.max != null) hi = Math.max(hi, r.limits.max);
    if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; }
    if (hi === lo) { hi += Math.abs(hi) * 0.05 || 1; lo -= Math.abs(lo) * 0.05 || 1; }
    const span = hi - lo; lo -= span * 0.06; hi += span * 0.06;
    const X = (t) => pad.l + ((t - tmin) / ((t1 - tmin) || 1)) * (W - pad.l - pad.r);
    const Y = (v) => pad.t + (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (H - pad.t - pad.b);
    // ticks
    const yt = [];
    const step = niceStep((hi - lo) / 4);
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) yt.push(Math.abs(v) < step * 1e-6 ? 0 : v);
    const xt = []; for (let k = 0; k <= 4; k++) xt.push(tmin + ((t1 - tmin) * k) / 4);
    const short = (t1 - tmin) < 2 * 86400;
    const tiny = (t1 - tmin) < 2 * 3600;
    const xf = new Intl.DateTimeFormat(this.lang, tiny ? { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: this.tz } : short ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: this.tz } : { day: "2-digit", month: "2-digit", timeZone: this.tz });
    let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Values over time">`;
    yt.forEach((v) => { svg += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)"/><text x="${pad.l - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${esc(this.num(v, 2))}</text>`; });
    svg += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}" stroke="var(--axis)"/>`;
    xt.forEach((t, k) => { svg += `<text x="${X(t)}" y="${H - 6}" text-anchor="${k === 0 ? "start" : k === 4 ? "end" : "middle"}" font-size="11" fill="var(--muted)">${esc(xf.format(new Date(t * 1000)))}</text>`; });
    // band
    const bandDiff = c.min.some((m, i) => m !== c.max[i]);
    if (bandDiff) {
      let d = `M${X(c.t[0])},${Y(c.max[0])}`;
      for (let i = 1; i < n; i++) d += `L${X(c.t[i])},${Y(c.max[i])}`;
      for (let i = n - 1; i >= 0; i--) d += `L${X(c.t[i])},${Y(c.min[i])}`;
      svg += `<path d="${d}Z" fill="var(--accent-soft)" stroke="none"/>`;
    }
    const bl = this.$("band-legend"); if (bl) bl.hidden = !bandDiff;
    let d = ""; for (let i = 0; i < n; i++) d += (i ? "L" : "M") + X(c.t[i]).toFixed(1) + "," + Y(c.mean[i]).toFixed(1);
    svg += `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round"/>`;
    if (n < 80) for (let i = 0; i < n; i++) svg += `<circle cx="${X(c.t[i])}" cy="${Y(c.mean[i])}" r="2" fill="var(--accent)"/>`;
    [["min", r.limits?.min], ["max", r.limits?.max]].forEach(([, v]) => { if (v != null) svg += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--ink-2)" stroke-dasharray="4 3"/>`; });
    outs.forEach((o) => {
      const clipped = o.value > hi || o.value < lo;
      const cx = X(o.ts), cy = Y(o.value);
      svg += clipped ? `<path d="M${cx - 5},${cy + (o.value > hi ? 6 : -6)}L${cx},${cy}L${cx + 5},${cy + (o.value > hi ? 6 : -6)}" fill="none" stroke="var(--critical)" stroke-width="2"/>` : "";
      svg += `<circle cx="${cx}" cy="${cy}" r="4.5" fill="var(--critical)" stroke="var(--surface)" stroke-width="1.5" data-oid="${o.id}" style="cursor:pointer"/>`;
    });
    svg += `<line id="hover-line" x1="0" x2="0" y1="${pad.t}" y2="${H - pad.b}" stroke="var(--axis)" visibility="hidden"/></svg><div class="tip" hidden id="tip"></div>`;
    box.innerHTML = svg; box.style.opacity = "";
    this._chartGeom = { X, Y, W, H, pad, tmin, t1 };
    this.bindZoom(box, this._chartGeom);
    box.onmousemove = (ev) => { if (!this._drag) this.chartHover(ev); };
    box.onmouseleave = () => { this.$("tip").hidden = true; this.$("hover-line").setAttribute("visibility", "hidden"); };
  }

  bindZoom(box, g) {
    box.classList.toggle("zoomable", !!g);
    box.onpointerdown = (ev) => {
      if (!g || ev.button !== 0) return;
      const rect = box.getBoundingClientRect(), sx = rect.width / g.W;
      const x0 = ev.clientX - rect.left;
      if (x0 < g.pad.l * sx || x0 > (g.W - g.pad.r) * sx) return;
      const sel = document.createElement("div"); sel.className = "zsel"; box.appendChild(sel);
      this._drag = { x0, x1: x0, sel, rect, sx };
      box.setPointerCapture(ev.pointerId);
      this.$("tip") && (this.$("tip").hidden = true);
    };
    box.onpointermove = (ev) => {
      const d = this._drag; if (!d) return;
      d.x1 = Math.max(g.pad.l * d.sx, Math.min((g.W - g.pad.r) * d.sx, ev.clientX - d.rect.left));
      d.sel.style.left = Math.min(d.x0, d.x1) + "px"; d.sel.style.width = Math.abs(d.x1 - d.x0) + "px";
    };
    box.onpointerup = (ev) => {
      const d = this._drag; if (!d) return;
      this._drag = null; d.sel.remove();
      if (Math.abs(d.x1 - d.x0) < 8) return; // a click, e.g. on an outlier dot
      const toT = (px) => g.tmin + ((px / d.sx - g.pad.l) / (g.W - g.pad.l - g.pad.r)) * (g.t1 - g.tmin);
      this._noClick = true; setTimeout(() => (this._noClick = false), 0);
      this.zoomTo(toT(Math.min(d.x0, d.x1)), toT(Math.max(d.x0, d.x1)));
    };
    box.onpointercancel = () => { if (this._drag) { this._drag.sel.remove(); this._drag = null; } };
    box.ondblclick = () => this.resetZoom();
  }

  chartHover(ev) {
    const r = this.S.result, g = this._chartGeom, box = this.$("chart"); if (!r || !g) return;
    const rect = box.getBoundingClientRect(), x = (ev.clientX - rect.left) * (g.W / rect.width);
    if (x < g.pad.l || x > g.W - g.pad.r) return;
    const t = g.tmin + ((x - g.pad.l) / (g.W - g.pad.l - g.pad.r)) * (g.t1 - g.tmin);
    const c = this.S.zoom?.chart || r.chart; let best = 0, bd = Infinity;
    for (let i = 0; i < c.t.length; i++) { const dd = Math.abs(c.t[i] - t); if (dd < bd) { bd = dd; best = i; } }
    let near = null; const tol = (g.t1 - g.tmin) / 150;
    this.visibleOutliers().forEach((o) => { if (Math.abs(o.ts - t) < tol && (!near || Math.abs(o.ts - t) < Math.abs(near.ts - t))) near = o; });
    const tip = this.$("tip"), u = this.unit(r.unit);
    const range = c.min[best] !== c.max[best] ? `<div class="sub">min ${this.num(c.min[best])} · max ${this.num(c.max[best])}</div>` : "";
    tip.innerHTML = `<div class="sub">${this.dt(c.t[best])}</div><b>${this.num(c.mean[best])}${u}</b>${range}` +
      (near ? `<div class="msg-err" style="margin-top:4px">Outlier ${this.shortDt(near.ts)}: <b>${this.num(near.value)}${u}</b></div>` : "");
    tip.hidden = false;
    const px = (g.X(c.t[best]) / g.W) * rect.width;
    tip.style.left = Math.min(rect.width - tip.offsetWidth - 4, Math.max(0, px + 12)) + "px"; tip.style.top = "6px";
    const hl = this.$("hover-line"); hl.setAttribute("x1", g.X(c.t[best])); hl.setAttribute("x2", g.X(c.t[best])); hl.setAttribute("visibility", "visible");
  }

  // ---------------- outlier list
  severity(o) {
    const thr = this.S.result?.info?.threshold || 6;
    if (o.reason?.includes("plausible")) return ["error", "Out of range"];
    if (o.reason?.includes("backwards")) return ["error", "Backwards"];
    if (o.score >= thr * 3) return ["error", "Strong"];
    return ["warn", "Suspicious"];
  }

  renderOutliers() {
    const r = this.S.result, card = this.$("out-card"); if (!r) return;
    card.hidden = false;
    const isSum = r.kind === "sum", u = this.unit(r.unit);
    let list = [...this.visibleOutliers()];
    if (this.S.sort === "score") list.sort((a, b) => b.score - a.score);
    const zoomNote = this.S.zoom ? `<div class="banner info" style="margin-bottom:10px;padding:8px 14px">Showing ${this.int(list.length)} of ${this.int(r.outliers.length)} outliers in the zoomed time range ${esc(this.zoomLabel())}<span class="end"><button class="btn small" data-act="zoom-reset">${I.restore}Reset zoom</button></span></div>` : "";
    const per = 100, pages = Math.max(1, Math.ceil(list.length / per));
    this.S.outPage = Math.min(this.S.outPage, pages);
    const page = list.slice((this.S.outPage - 1) * per, this.S.outPage * per);
    const n = this.S.sel.size;
    const capped = r.total_outliers > r.outliers.length ? ` · showing the ${this.int(r.outliers.length)} strongest of ${this.int(r.total_outliers)}` : "";
    const sumHint = isSum ? `<div class="banner info" style="margin-bottom:10px">This is a counter. A fix shifts the running total from that period onward by the difference, exactly like “Adjust sum” in Developer tools → Statistics. Energy dashboard values follow.</div>` : "";
    const stateHint = r.source === "states" && r.state_class ? `<div class="hint" style="margin-bottom:8px">Note: long-term statistics are calculated from states every 5 minutes. Fixing states does not change statistics that were already compiled – check “Hourly statistics” as well.</div>` : "";
    let head = `<div class="card-head"><h2>Outliers</h2><span class="hint">${this.int(r.total_outliers)} found in ${this.int(r.stats.count || 0)} values · ${esc(METHODS[r.info?.method]?.[0] || "")}${r.info?.method !== "range" ? `, sensitivity ${this.num(r.info?.threshold)}` : ""}${capped}</span>
      <div class="seg" id="out-seg" role="group" aria-label="Sort"><button data-sort="time" aria-pressed="${this.S.sort === "time"}">By time</button><button data-sort="score" aria-pressed="${this.S.sort === "score"}">By severity</button></div></div>${zoomNote}${sumHint}${stateHint}`;
    if (n) head += `<div class="selbar"><b>${this.int(n)} selected</b>
      <button class="btn small primary" data-act="bulk-apply">${I.check}${isSum ? "Apply corrections" : "Replace with expected values"}</button>
      ${isSum ? "" : `<button class="btn small danger" data-act="bulk-delete">${I.trash}Delete</button>`}
      <span class="end"><button class="linkbtn" data-act="sel-none">Clear selection</button></span></div>`;
    if (!list.length) {
      card.innerHTML = head + `<div class="empty">${this.S.zoom ? "No outliers in the zoomed time range." : `No outliers in this period with the current settings. 🎉`}<br><span class="hint">Try a longer period, a lower sensitivity or another source.</span></div>`;
      return;
    }
    const allOnPage = page.length && page.every((o) => this.S.sel.has(o.id));
    const rows = page.map((o) => {
      const [cls, label] = this.severity(o);
      const dev = o.value - o.expected;
      const latest = o.is_latest;
      const fieldTag = r.kind === "measurement" ? ` <span class="badge">${esc(o.field)}</span>` : "";
      const actions = isSum
        ? `<button class="icon-btn ok" data-fix="${o.id}" title="Apply correction (${this.num(o.adjustment)})" aria-label="Apply correction">${I.check}</button>
           <button class="icon-btn" data-edit="${o.id}" title="Set value for this period" aria-label="Edit">${I.edit}</button>`
        : `<button class="icon-btn ok" data-fix="${o.id}" title="Replace with ${esc(o.suggested ?? this.num(o.expected))}" aria-label="Replace with expected value">${I.check}</button>
           <button class="icon-btn" data-edit="${o.id}" title="Edit value" aria-label="Edit">${I.edit}</button>
           <button class="icon-btn danger" data-del="${o.id}" ${latest ? "disabled" : ""} title="${latest ? "Newest state – edit it instead" : "Delete"}" aria-label="Delete">${I.x}</button>`;
      return `<tr data-oid="${o.id}" class="${this.S.sel.has(o.id) ? "sel" : ""}">
        <td class="mid"><input type="checkbox" data-osel="${o.id}" ${this.S.sel.has(o.id) ? "checked" : ""} aria-label="Select"></td>
        <td class="nw"><span class="pill ${cls}">${label}</span></td>
        <td class="nw">${this.dt(o.ts, r.source === "states")}</td>
        <td class="num t">${this.num(o.value)}${u}${fieldTag}</td>
        <td class="num">${this.num(o.expected)}${u}</td>
        <td class="num ${dev > 0 ? "up" : "down"}">${dev > 0 ? "+" : ""}${this.num(dev)}<div class="sub">score ${this.num(o.score, 1)}</div></td>
        <td class="num sub">${this.num(o.prev)} → <b style="color:var(--ink)">${this.num(o.value)}</b> → ${this.num(o.next)}</td>
        ${isSum ? `<td class="num">${o.adjustment > 0 ? "+" : ""}${this.num(o.adjustment)}${u}</td>` : ""}
        <td class="sub">${esc(o.reason)}</td>
        <td class="num"><span class="row-actions">${actions}</span></td></tr>`;
    }).join("");
    card.innerHTML = head + `<div class="table-wrap"><table style="min-width:980px"><thead><tr>
      <th style="width:28px"><input type="checkbox" id="out-all" ${allOnPage ? "checked" : ""} aria-label="Select all on this page"></th>
      <th>Status</th><th>Time</th><th class="num">${isSum ? "Change" : "Value"}</th><th class="num">Expected</th><th class="num">Deviation</th><th class="num">Before → value → after</th>
      ${isSum ? `<th class="num">Correction</th>` : ""}<th>Reason</th><th class="num">Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${pages > 1 ? `<div class="pager"><span>${this.int((this.S.outPage - 1) * per + 1)}–${this.int(Math.min(list.length, this.S.outPage * per))} of ${this.int(list.length)}</span>
        <span class="end"><button class="icon-btn" data-opage="${this.S.outPage - 1}" ${this.S.outPage <= 1 ? "disabled" : ""} aria-label="Previous">${I.prev}</button>
        <span style="padding:0 6px">Page ${this.S.outPage} of ${pages}</span><button class="icon-btn" data-opage="${this.S.outPage + 1}" ${this.S.outPage >= pages ? "disabled" : ""} aria-label="Next">${I.next}</button></span></div>` : ""}`;
  }

  outlier(id) { return this.S.result?.outliers.find((o) => String(o.id) === String(id)); }

  async applyFix(items) {
    const r = this.S.result; if (!r || !items.length) return;
    try {
      let res;
      if (r.kind === "sum") {
        res = await this.ws("adjust", { entity_id: r.entity_id, items: items.map((o) => ({ ts: o.ts, adjustment: o.adjustment, value: o.value })) });
        this.toast(`${res.adjusted} correction${res.adjusted === 1 ? "" : "s"} applied`, false, { label: "Undo", run: () => this.undo(res.log_id) });
      } else if (r.kind === "measurement") {
        res = await this.ws("update", { source: r.source, entity_id: r.entity_id, items: items.map((o) => {
          const it = { id: o.id }; Object.entries(o.fields).forEach(([f, v]) => (it[f] = v.expected));
          if (it.min != null && it.max != null && it.min > it.max) [it.min, it.max] = [it.max, it.min];
          const row = { ...o.row, ...it }; if (row.min != null && row.mean != null && row.min > row.mean) it.min = row.mean;
          if (row.max != null && row.mean != null && row.max < row.mean) it.max = row.mean;
          return it; }) });
        this.toast(`${res.changed} value${res.changed === 1 ? "" : "s"} replaced`, false, { label: "Undo", run: () => this.undo(res.log_id) });
      } else {
        res = await this.ws("update", { source: r.source, entity_id: r.entity_id, items: items.map((o) => ({ id: o.id, value: o.suggested ?? o.expected })) });
        this.toast(`${res.changed} value${res.changed === 1 ? "" : "s"} replaced`, false, { label: "Undo", run: () => this.undo(res.log_id) });
      }
      items.forEach((o) => this.S.sel.delete(o.id));
      this.analyze(); this.loadInfo();
    } catch (e) { this.toast(this.errMsg(e), true); }
  }

  async deleteRows(items) {
    const r = this.S.result; if (!r || !items.length) return;
    const ok = await this.confirm("Delete values", `<p style="margin:0">Delete <b>${items.length}</b> value${items.length === 1 ? "" : "s"} of <b>${esc(r.name)}</b> from ${esc(SOURCES[r.source])}?</p>
      <p class="hint" style="margin:0">Deleting cannot be undone in the log. Create a backup first if you are unsure. Replacing with the expected value is usually the better choice: the history keeps its timing.</p>`, "Delete", true);
    if (!ok) return;
    try {
      const res = await this.ws("delete", { source: r.source, entity_id: r.entity_id, ids: items.map((o) => o.id) });
      this.toast(`${res.deleted} value${res.deleted === 1 ? "" : "s"} deleted`);
      items.forEach((o) => this.S.sel.delete(o.id));
      this.analyze(); this.loadInfo();
    } catch (e) { this.toast(this.errMsg(e), true); }
  }

  async undo(logId) {
    try { const r = await this.ws("log/undo", { entry_id: logId }); this.toast(`Undone (${r.restored})`); if (this.S.view === "entities") this.analyze(); if (this.S.view === "logs") this.viewLogs(); this.loadInfo(); }
    catch (e) { this.toast(this.errMsg(e), true); }
  }

  editDialog(o) {
    const r = this.S.result, u = r.unit ? ` (${esc(r.unit)})` : "";
    let body;
    if (r.kind === "measurement") {
      body = `<p class="hint" style="margin:0">Period starting ${this.dt(o.ts)}. Flagged: ${Object.keys(o.fields).map(esc).join(", ")}. Expected values are filled in.</p>
        <div class="form-grid" style="grid-template-columns:repeat(3,1fr)">${["min", "mean", "max"].map((f) => `<label class="f">${f}${u}<input type="number" step="any" name="${f}" value="${o.fields[f] ? Number(o.fields[f].expected.toPrecision(10)) : o.row[f] ?? ""}">
          <span class="hint">now ${this.num(o.row[f])}</span></label>`).join("")}</div>`;
    } else if (r.kind === "sum") {
      body = `<p class="hint" style="margin:0">Period starting ${this.dt(o.ts)}. The counter rose by <b>${this.num(o.value)}</b>${esc(r.unit ? " " + r.unit : "")}; neighbouring periods: ${this.num(o.prev)} and ${this.num(o.next)}.</p>
        <label class="f">Correct change for this period${u}<input type="number" step="any" name="value" value="${Number(o.expected.toPrecision(10))}"></label>
        <p class="hint" style="margin:0" id="adj-hint"></p>`;
    } else {
      body = `<p class="hint" style="margin:0">State from ${this.dt(o.ts, true)}. Stored value: <b class="mono">${esc(o.raw)}</b> · before ${this.num(o.prev)} · after ${this.num(o.next)}</p>
        <label class="f">New value${u}<input type="number" step="any" name="value" value="${esc(o.suggested ?? o.expected)}"></label>`;
    }
    this.openDialog("Edit value", body, "Save", async (form) => {
      if (r.kind === "measurement") {
        const it = { id: o.id }; ["min", "mean", "max"].forEach((f) => { const v = form[f].value; if (v !== "") it[f] = parseFloat(v); });
        const res = await this.ws("update", { source: r.source, entity_id: r.entity_id, items: [it] });
        this.toast("Value saved", false, { label: "Undo", run: () => this.undo(res.log_id) });
      } else if (r.kind === "sum") {
        const v = parseFloat(form.value.value); if (!isFinite(v)) throw new Error("Please enter a number.");
        const res = await this.ws("adjust", { entity_id: r.entity_id, items: [{ ts: o.ts, adjustment: v - o.value, value: o.value }] });
        this.toast("Correction applied", false, { label: "Undo", run: () => this.undo(res.log_id) });
      } else {
        const v = form.value.value.trim(); if (v === "" || !isFinite(parseFloat(v))) throw new Error("Please enter a number.");
        const res = await this.ws("update", { source: r.source, entity_id: r.entity_id, items: [{ id: o.id, value: v }] });
        this.toast("Value saved", false, { label: "Undo", run: () => this.undo(res.log_id) });
      }
      this.analyze(); this.loadInfo();
    });
    if (r.kind === "sum") {
      const f = this.$("dlg").querySelector("form"), h = this.$("adj-hint");
      const upd = () => { const v = parseFloat(f.value.value); h.textContent = isFinite(v) ? `All later totals change by ${v - o.value > 0 ? "+" : ""}${this.num(v - o.value)}${r.unit ? " " + r.unit : ""}.` : ""; };
      f.value.addEventListener("input", upd); upd();
    }
  }

  async purgeOrphans(ids) {
    ids = ids.filter((id) => this.S.entities.find((e) => e.entity_id === id)?.orphaned);
    if (!ids.length) return;
    const bk = this.S.info?.settings.backup_before_purge ?? true;
    const sqlite = this.S.info?.engine === "sqlite";
    const ok = await this.confirm("Remove orphaned entities", `<p style="margin:0">Remove all history and statistics of <b>${ids.length}</b> entit${ids.length === 1 ? "y" : "ies"} that no longer exist${ids.length === 1 ? "" : ""}?</p>
      <ul class="file-list" style="max-height:200px;overflow:auto;margin:0;padding:6px 10px;list-style:none;border:1px solid var(--border);border-radius:8px;font:12px ui-monospace,Menlo,monospace">${ids.slice(0, 100).map((x) => `<li>${esc(x)}</li>`).join("")}${ids.length > 100 ? `<li class="dimmed">… and ${ids.length - 100} more</li>` : ""}</ul>
      <p class="hint" style="margin:0">Uses the recorder's own functions (purge entities, clear statistics). This cannot be undone in the log.</p>
      ${sqlite ? `<label class="check"><input type="checkbox" name="backup" ${bk ? "checked" : ""}><span>Create a safety backup first</span></label>` : ""}`, "Remove", true, true);
    if (!ok) return;
    this.toast(`Removing ${ids.length} entit${ids.length === 1 ? "y" : "ies"} …`);
    try {
      const r = await this.ws("orphans/purge", { entity_ids: ids, backup: sqlite ? ok.backup : false });
      this.toast(`${r.removed} orphaned entit${r.removed === 1 ? "y" : "ies"} removed` + (r.removed < ids.length ? ` · ${ids.length - r.removed} still have data (recorder busy, try again later)` : ""), r.removed < ids.length);
      ids.forEach((x) => this.S.orphanSel.delete(x));
      this.S.entities = null; this.loadEntities(); this.loadInfo();
    } catch (e) { this.toast(this.errMsg(e), true); }
  }

  // Scans run as a background task inside Home Assistant. The panel only starts them and shows the progress,
  // so leaving the page, closing the browser or a second device does not stop or duplicate a scan.
  async scanAll() {
    if (this.S.scanning) { this.toast("A scan is already running.", true); return; }
    const days = this.S.scanDays ?? this.S.info?.settings.scan_days ?? 3;
    try {
      const r = await this.ws("scan/start", { days });
      this.S.myScan = { mode: "all" }; this.S.scanning = r.scanning;
      this.renderScanProgress(); this.pollScan();
    } catch (e) { this.toast(this.errMsg(e), true); this.pollScan(); }
  }

  /** Scan only the entities matching a pattern. Stored separately, the last full scan stays untouched. */
  async scanFiltered(pattern, days) {
    if (this.S.scanning) { this.toast("A scan is already running.", true); return; }
    const ents = this.matchPattern(pattern);
    if (!ents.length) return;
    pattern = pattern.split(",").map((t) => t.trim()).filter(Boolean).join(", ");
    this.S.recent = [pattern, ...this.S.recent.filter((r) => r !== pattern)].slice(0, 6);
    try {
      const r = await this.ws("scan/start", { days, entity_ids: ents.map((e) => e.entity_id), pattern });
      this.S.myScan = { mode: "filter", single: ents.length === 1 ? ents[0].entity_id : null }; this.S.scanning = r.scanning;
      this.saveUI(); this.renderScanProgress(); this.pollScan();
    } catch (e) { this.toast(this.errMsg(e), true); this.pollScan(); }
  }

  renderScanProgress() {
    const s = this.S.scanning;
    const box = this.$("scan-progress");
    if (box) {
      box.innerHTML = s ? `<div class="banner info" style="margin-bottom:10px"><span class="spin"></span>
        <span>${s.mode === "filter" ? `Filter scan <span class="mono">${esc(s.pattern || "")}</span>` : "Scan all"} · last ${this.num(s.days)} days: ${s.total ? `${this.int(s.done)} of ${this.int(s.total)} entities` : "preparing …"}${s.stopping ? " · stopping …" : ""} <span class="hint">· runs in Home Assistant, you can leave this page</span></span>
        <div class="bar" style="flex:1"><div style="width:${s.total ? (s.done / s.total) * 100 : 0}%"></div></div>
        <button class="btn small" data-act="scan-stop" ${s.stopping ? "disabled" : ""}>${I.x}Stop</button></div>` : "";
    }
    this.shadowRoot.querySelectorAll('[data-act="scan"], [data-act="scan-filter"]').forEach((b) => {
      b.disabled = !!s; b.title = s ? "A scan is running – wait until it is finished or stop it" : "";
    });
    if (s) { this.$("status-dot").className = "dot busy"; this.$("status-text").textContent = s.total ? `scan running ${s.done}/${s.total} …` : "scan starting …"; }
  }

  async pollScan() {
    if (this._polling) return;
    this._polling = true;
    let wasRunning = !!this.S.scanning, mode = this.S.scanning?.mode;
    try {
      for (;;) {
        if (!this.isConnected) return; // an old copy of the panel: the new one polls itself
        let st;
        try { st = await this.ws("scan/status"); } catch { await new Promise((r) => setTimeout(r, 3000)); continue; }
        const stopping = this.S.scanning?.stopping;
        this.S.scanning = st.scanning ? { ...st.scanning, stopping } : null;
        if (st.scanning) { wasRunning = true; mode = st.scanning.mode; }
        this.renderScanProgress();
        if (!st.scanning) {
          if (wasRunning) await this.scanFinished(mode, st.error);
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    } finally { this._polling = false; }
  }

  async scanFinished(mode, error) {
    const mine = this.S.myScan; this.S.myScan = null;
    this.loadInfo();
    if (error) { this.toast("Scan failed: " + error, true); return; }
    if (mode === "filter") {
      const st = await this.ws("scan/status", { with_filter: true }).catch(() => null);
      const f = st?.filter; if (!f) return;
      this.S.fscan = { pattern: f.pattern, days: f.days, ts: f.ts, ids: f.ids, map: new Map(f.results.map((x) => [x.entity_id, x])) };
      const found = f.results.filter((x) => x.outliers).length;
      this.S.entityFilter = found ? "outliers" : "all"; this.S.entityPage = 1;
      if (this.S.view === "entities") { this.renderEntityStats(); this.renderEntityTable(); }
      if (mine?.single && !f.aborted) { this.pick(mine.single); return; }
      this.toast(f.aborted ? `Filter scan stopped after ${f.scanned} of ${f.total} entities` : `Filter scan: ${found} of ${f.ids.length} entit${f.ids.length === 1 ? "y" : "ies"} with outliers`);
      return;
    }
    await this.loadLastScan();
    this.S.fscan = null;
    const ls = this.S.lastScan;
    const found = ls ? ls.results.filter((x) => x.outliers).length : 0;
    if (found) { this.S.entityFilter = "outliers"; this.S.entityPage = 1; }
    if (this.S.view === "entities") { this.renderEntityStats(); this.renderEntityTable(); }
    this.toast(ls?.aborted ? `Scan stopped after ${ls.scanned} of ${ls.total} entities – partial result shown` : `Scan finished: ${found} entit${found === 1 ? "y" : "ies"} with outliers`);
  }

  filterDialog(preset) {
    const def = Number(this.S.info?.settings.scan_days ?? 3), keep = this.S.info?.keep_days;
    let opts = [[1, "Last 24 hours"], [3, "Last 3 days"], [7, "Last 7 days"], [14, "Last 14 days"], [31, "Last 31 days"]];
    if (keep) { opts = opts.filter(([d]) => d < keep); opts.push([keep, `All kept (${keep} days)`]); }
    if (!opts.some(([d]) => d === def)) opts.push([def, `Last ${this.num(def)} days`]);
    opts.sort((a, b) => a[0] - b[0]);
    const cur = this.S.fscan?.days ?? this.S.scanDays ?? def;
    const value = preset ?? this.S.fscan?.pattern ?? "";
    const quick = ["sensor.*", "*temperature*", "*power*", "*energy*", "*humidity*"];
    this.openDialog("Scan filter", `
      <label class="f">Entities<input type="text" name="pattern" class="mono" spellcheck="false" autocomplete="off" value="${esc(value)}" placeholder="sensor.*, *victron*, sensor.wohnzimmer_temperatur">
        <span class="hint">One entity, or a pattern with <code>*</code> as wildcard. Several separated by comma. Matches entity_id and name.</span></label>
      <div class="chips"><span class="hint">Quick:</span>${quick.map((q) => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
      ${this.S.recent.length ? `<div class="chips"><span class="hint">Recent:</span>${this.S.recent.map((q) => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>` : ""}
      <label class="f">Period<select name="days">${opts.map(([d, l]) => `<option value="${d}" ${d === cur ? "selected" : ""}>${l}${d === def ? " (default)" : ""}</option>`).join("")}</select></label>
      <div class="box" id="f-preview"></div>`, "Scan", async (form) => {
      const pattern = form.pattern.value.trim();
      if (!this.matchPattern(pattern).length) throw new Error("No entity with recorded states matches this filter.");
      const days = parseFloat(form.days.value);
      setTimeout(() => this.scanFiltered(pattern, days), 0);
    });
    const d = this.$("dlg"), form = d.querySelector("form"), inp = form.pattern, btn = form.querySelector('[type="submit"]');
    const upd = () => {
      const m = this.matchPattern(inp.value), all = (this.S.entities || []).length;
      btn.disabled = !m.length;
      btn.textContent = m.length ? `Scan ${this.int(m.length)} entit${m.length === 1 ? "y" : "ies"}` : "Scan";
      this.$("f-preview").innerHTML = !inp.value.trim() ? `<span class="hint">Type a filter to see the matching entities (${this.int(all)} numeric entities in total).</span>`
        : m.length ? `<b style="font-size:13px">${this.int(m.length)} entit${m.length === 1 ? "y matches" : "ies match"}</b>${m.length === 1 ? ` <span class="hint">· opens the analysis right after the scan</span>` : ""}
          <div class="sub mono" style="margin-top:6px;line-height:1.7">${m.slice(0, 6).map((e) => esc(e.entity_id)).join("<br>")}${m.length > 6 ? `<br>… and ${this.int(m.length - 6)} more` : ""}</div>`
        : `<span class="msg-err" style="font-size:13px">No entity with recorded states matches.</span>`;
    };
    inp.addEventListener("input", upd);
    d.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => { inp.value = b.dataset.q; upd(); inp.focus(); }));
    upd();
  }

  // ===================================================================== BACKUP
  async viewBackup() {
    const v = this.$("view-backup");
    if (!v.dataset.ready) {
      v.dataset.ready = "1";
      v.innerHTML = `<div class="actions">
          <button class="btn primary" data-act="backup-create">${I.plus}Create backup</button>
          <button class="btn" data-act="backup-refresh">${I.restore}Refresh</button>
          <div class="target">${I.folder}<span class="lbl">Backup folder</span><code id="bk-dir">–</code><button class="linkbtn" data-act="goto-settings">change</button></div>
        </div>
        <div id="bk-banner"></div>
        <section class="stats" id="backup-stats" aria-label="Statistics"></section>
        <section class="card"><div class="card-head"><h2>Backups</h2><span class="hint">newest first</span></div>
          <div class="table-wrap"><table id="bk-table" style="min-width:820px"></table></div></section>
        <section class="card"><h2 style="margin-bottom:8px">How it works</h2>
          <div class="hint" style="font-size:13px;line-height:1.6">
          A backup is a consistent copy of the recorder database made with SQLite's online backup function while Home Assistant keeps running. Every copy is checked with <code>PRAGMA quick_check</code> before it is kept.<br>
          A restore is prepared first: the backup is unpacked next to the database and checked. The file is swapped while Home Assistant shuts down, after the recorder has closed the database, so the running database is never overwritten. History recorded between the backup and the restart is lost.<br>
          Backups in <code>/config</code> are also included in Home Assistant's own backups and can make them large. Choose another folder (e.g. <code>/share</code> or <code>/media</code>) in Settings if you prefer.</div></section>`;
    }
    this.renderBackupStats();
    try { this.S.backups = await this.ws("backup/list"); } catch (e) { this.toast(this.errMsg(e), true); return; }
    this.renderBackups();
  }

  renderBackupStats() {
    const box = this.$("backup-stats"); if (!box) return;
    const b = this.S.backups, i = this.S.info, list = b?.backups || [];
    const newest = list[0];
    const total = list.reduce((a, x) => a + x.size, 0);
    const tiles = [
      ["Backups", b ? this.int(list.length) : "…", i ? `keeping the newest ${i.settings.backup_keep || "all"}` : ""],
      ["Newest backup", newest ? this.ago(newest.created) : "–", newest ? this.dt(newest.created) : "no backup yet", newest ? "" : "bad"],
      ["Used by backups", b ? this.bytes(total) : "…", i?.settings.backup_compress ? "compressed (gzip)" : "uncompressed"],
      ["Database", i?.db_size ? this.bytes(i.db_size) : "–", i ? (i.engine === "sqlite" ? "SQLite incl. write-ahead log" : i.engine) : ""],
      ["Free space", b?.free != null ? this.bytes(b.free) : "–", "in the backup folder"],
    ];
    box.innerHTML = tiles.map(([l, v, s, c]) => `<div class="card kpi ${c || ""}"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${esc(s)}</div></div>`).join("");
  }

  renderBackups() {
    const b = this.S.backups; if (!b) return;
    this.$("bk-dir").textContent = b.directory;
    this.$("bk-banner").innerHTML = !b.supported ? `<div class="banner warn">Your recorder uses ${esc(b.engine)}. Backup and restore from this panel need the default SQLite database – use the database's own tools (mysqldump, pg_dump). Finding and fixing outliers works normally.</div>`
      : b.busy ? `<div class="banner info"><span class="spin"></span>${esc(b.busy)} is running …</div>` : "";
    this.$("view-backup").querySelector('[data-act="backup-create"]').disabled = !b.supported || !!b.busy;
    this.renderBackupStats();
    const head = `<thead><tr><th>Status</th><th>Created</th><th>File</th><th class="num">Size</th><th class="num">Database</th><th class="num">Duration</th><th class="num">Actions</th></tr></thead>`;
    if (!b.backups.length) { this.$("bk-table").innerHTML = head + `<tbody><tr><td colspan="7" class="empty">No backups yet. “Create backup” makes the first one.</td></tr></tbody>`; return; }
    this.$("bk-table").innerHTML = head + "<tbody>" + b.backups.map((x) => {
      const pend = b.pending_restore?.name === x.name;
      const st = pend ? `<span class="pill acc">Restore pending</span>` : x.check === "ok" ? `<span class="pill ok">Verified</span>` : `<span class="pill neutral">Unchecked</span>`;
      return `<tr><td class="nw">${st}${x.kind === "safety" ? `<div class="sub">safety copy</div>` : ""}</td>
        <td class="nw">${this.dt(x.created, true)}<div class="sub">${this.ago(x.created)}</div></td>
        <td><div class="t mono" style="font-size:12px">${esc(x.name)}</div>${x.note ? `<div class="sub">${esc(x.note)}</div>` : ""}</td>
        <td class="num">${this.bytes(x.size)}<div class="sub">${x.compressed ? "gzip" : "raw"}</div></td>
        <td class="num">${this.bytes(x.db_size)}</td><td class="num">${x.duration != null ? this.num(x.duration, 1) + " s" : "–"}</td>
        <td class="num"><span class="row-actions">
          <button class="icon-btn" data-bdl="${esc(x.name)}" title="Download" aria-label="Download">${I.dl}</button>
          <button class="icon-btn" data-brestore="${esc(x.name)}" title="Restore" aria-label="Restore" ${b.supported ? "" : "disabled"}>${I.restore}</button>
          <button class="icon-btn danger" data-bdel="${esc(x.name)}" title="Delete" aria-label="Delete">${I.x}</button></span></td></tr>`;
    }).join("") + "</tbody>";
  }

  async createBackup() {
    const btn = this.$("view-backup").querySelector('[data-act="backup-create"]');
    btn.disabled = true; const old = btn.innerHTML; btn.innerHTML = `<span class="spin"></span>Creating backup …`;
    this.$("status-dot").className = "dot busy"; this.$("status-text").textContent = "backup running …";
    try { const r = await this.ws("backup/create", {}); this.toast(`Backup ${r.name} created (${this.bytes(r.size)})`); }
    catch (e) { this.toast(this.errMsg(e), true); }
    btn.innerHTML = old; btn.disabled = false;
    this.loadInfo(); this.viewBackup();
  }

  async restoreBackup(name) {
    const s = this.S.info?.settings || {};
    const ok = await this.confirm("Restore database", `<p style="margin:0">Replace the recorder database with <b class="mono">${esc(name)}</b>?</p>
      <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--ink-2)">
        ${s.backup_before_restore ? "<li>A safety backup of the current database is made first.</li>" : "<li><b>No</b> safety backup will be made (see Settings).</li>"}
        <li>The backup is unpacked and checked now, the swap happens while Home Assistant restarts.</li>
        <li>History and statistics recorded after the backup are lost.</li></ul>
      <label class="check"><input type="checkbox" name="restart" ${s.auto_restart_after_restore ? "checked" : ""}><span>Restart Home Assistant right away</span></label>`, "Restore", true, true);
    if (!ok) return;
    this.toast("Preparing restore … this can take a while for big databases");
    try {
      const r = await this.ws("backup/restore", { name, restart: ok.restart });
      this.toast(r.restarting ? "Restore prepared – Home Assistant restarts now" : "Restore prepared – it is applied at the next restart");
    } catch (e) { this.toast(this.errMsg(e), true); }
    this.loadInfo(); this.viewBackup();
  }

  async downloadBackup(name) {
    try {
      const r = await this._hass.callWS({ type: "auth/sign_path", path: `/api/ha_cleanup/backup/${encodeURIComponent(name)}`, expires: 300 });
      const a = document.createElement("a"); a.href = r.path; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { this.toast(this.errMsg(e), true); }
  }


  // ===================================================================== RANGES
  rangeRows() {
    const limits = this.S.info?.settings.limits || {};
    const ents = new Map((this.S.entities || []).map((e) => [e.entity_id, e]));
    return Object.entries(limits).map(([id, l]) => {
      const e = ents.get(id), sc = this.S.scan.get(id);
      const lo = l.min ?? null, hi = l.max ?? null;
      let status = "none", outside = null, worst = null, worstTs = null;
      if (sc) {
        const same = sc.limits && sc.limits.min === lo && sc.limits.max === hi;
        if (same && sc.outside != null) { outside = sc.outside; worst = sc.outside_value; worstTs = sc.outside_ts; }
        else if (sc.min != null) {
          const below = lo != null && sc.min < lo, above = hi != null && sc.max > hi;
          outside = below || above ? -1 : 0; worst = below ? sc.min : above ? sc.max : null;
        }
        status = outside == null ? "none" : outside ? "out" : "ok";
      }
      if (!e && this.S.entities) status = "missing";
      const counter = !!(e?.statistic?.has_sum || String(e?.state_class || "").startsWith("total"));
      return { id, name: e?.name || id, unit: e?.unit || "", state: e?.state, lo, hi, status, outside, worst, worstTs, exists: !!e, counter };
    });
  }

  viewRanges() {
    const v = this.$("view-ranges");
    if (!v.dataset.ready) {
      v.dataset.ready = "1";
      v.innerHTML = `
        <div class="actions">
          <div class="picker" style="max-width:460px">${I.search}<input type="search" id="rg-q" placeholder="Search ranges: name, entity_id, unit …" autocomplete="off" spellcheck="false" aria-label="Search ranges"></div>
          <button class="btn primary" data-act="rg-add">${I.plus}Add range</button>
        </div>
        <section class="stats" id="rg-stats" aria-label="Statistics"></section>
        <section class="card" aria-labelledby="h-rg">
          <div class="card-head"><h2 id="h-rg">Plausible ranges</h2><span class="hint" id="rg-hint">values outside are always reported as outliers</span>
            <div class="seg" id="rg-seg" role="group" aria-label="Filter">
              <button data-rgf="all">All</button><button data-rgf="out">Values outside</button><button data-rgf="one">Only one limit</button>
            </div></div>
          <div class="table-wrap"><table id="rg-table" style="min-width:900px"></table></div>
          <div class="pager" id="rg-pager"></div>
        </section>`;
    }
    this.$("rg-q").value = this.S.rg.q;
    if (!this.S.entities) this.loadEntities();
    if (!this.S.lastScan) this.loadLastScan();
    this.renderRanges();
  }

  renderRanges() {
    const tbl = this.$("rg-table"); if (!tbl || this.S.view !== "ranges") return;
    const all = this.rangeRows(), rg = this.S.rg, nEnt = (this.S.entities || []).length;
    const both = all.filter((r) => r.lo != null && r.hi != null).length;
    const out = all.filter((r) => r.status === "out"), ok = all.filter((r) => r.status === "ok").length, none = all.filter((r) => r.status === "none").length;
    const exist = all.filter((r) => r.exists).length, missing = all.filter((r) => r.status === "missing").length;
    const outVals = out.reduce((a, r) => a + (r.outside > 0 ? r.outside : 0), 0);
    const ls = this.S.lastScan;
    const tiles = [
      ["Plausible ranges", this.int(all.length), this.S.entities ? `for ${this.int(exist)} of ${this.int(nEnt)} numeric entities${missing ? ` · ${this.int(missing)} entity not found` : ""}` : "entities with min / max"],
      ["Min and max", this.int(both), `${this.int(all.length - both)} with only one limit`],
      ["Values outside", out.length ? this.int(outVals || out.length) : "0", out.length ? `in ${this.int(out.length)} entit${out.length === 1 ? "y" : "ies"}${ls ? " · last scan " + this.ago(ls.ts) : ""}` : (ls ? `last scan ${this.ago(ls.ts)}` : "no scan yet"), out.length ? "bad" : ""],
      ["Clean", this.int(ok), "no value outside the range"],
      ["Not scanned", this.int(none), "run “Scan all” on Entities"],
    ];
    this.$("rg-stats").innerHTML = tiles.map(([l, v, s, c]) => `<div class="card kpi ${c || ""}"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${esc(s)}</div></div>`).join("");
    const q = rg.q.trim().toLowerCase();
    let list = all;
    if (q) { const parts = q.split(/\s+/); list = list.filter((r) => parts.every((p) => `${r.id} ${r.name} ${r.unit}`.toLowerCase().includes(p))); }
    if (rg.filter === "out") list = list.filter((r) => r.status === "out");
    if (rg.filter === "one") list = list.filter((r) => r.lo == null || r.hi == null);
    const rank = { out: 0, ok: 1, none: 2, missing: 3 };
    list.sort((a, b) => rank[a.status] - rank[b.status] || (b.outside || 0) - (a.outside || 0) || a.name.localeCompare(b.name));
    const per = rg.per || list.length || 1, pages = Math.max(1, Math.ceil(list.length / per));
    rg.page = Math.min(Math.max(1, rg.page), pages);
    const page = list.slice((rg.page - 1) * per, rg.page * per);
    const head = `<thead><tr><th>Status</th><th>Entity</th><th>Unit</th><th class="num">Minimum</th><th class="num">Maximum</th><th class="num">Current</th><th>Worst value outside</th><th class="num">Actions</th></tr></thead>`;
    if (!page.length) {
      tbl.innerHTML = head + `<tbody><tr><td colspan="8" class="empty">${all.length ? "No range matches." : "No plausible ranges yet. “Add range” sets a minimum and maximum for an entity."}</td></tr></tbody>`;
    } else {
      tbl.innerHTML = head + "<tbody>" + page.map((r) => {
        const pill = r.status === "out" ? (r.outside > 0 ? `<span class="pill error">${this.int(r.outside)} outside</span>`
            : `<span class="pill error" title="The range was changed after the last scan. Run a scan for the exact number.">outside</span>`)
          : r.status === "ok" ? `<span class="pill ok">Clean</span>` : r.status === "missing" ? `<span class="pill neutral">Not found</span>` : `<span class="pill neutral">Not scanned</span>`;
        const cur = r.state == null ? "–" : isFinite(parseFloat(r.state)) ? this.num(parseFloat(r.state)) + this.unit(r.unit) : esc(r.state);
        return `<tr><td class="nw">${pill}</td>
          <td><div class="t">${esc(r.name)}</div><div class="sub mono">${esc(r.id)}</div></td>
          <td>${esc(r.unit) || `<span class="dimmed">–</span>`}</td>
          <td class="num">${r.lo != null ? this.num(r.lo) : `<span class="dimmed">–</span>`}</td>
          <td class="num">${r.hi != null ? this.num(r.hi) : `<span class="dimmed">–</span>`}</td>
          <td class="num">${cur}</td>
          <td class="nw">${r.worst != null ? `${this.num(r.worst)}${this.unit(r.unit)}${r.worstTs ? ` <span class="sub">${this.shortDt(r.worstTs)}</span>` : ""}` : `<span class="dimmed">–</span>`}</td>
          <td class="num"><span class="row-actions">
            <button class="icon-btn" data-analyze="${esc(r.id)}" title="Analyze" aria-label="Analyze">${I.chart}</button>
            <button class="icon-btn" data-redit="${esc(r.id)}" title="Edit range" aria-label="Edit range">${I.edit}</button>
            <button class="icon-btn danger" data-rdel="${esc(r.id)}" title="Remove range" aria-label="Remove range">${I.x}</button></span></td></tr>`;
      }).join("") + "</tbody>";
    }
    this.$("rg-hint").textContent = `${this.int(list.length)} of ${this.int(all.length)} · values outside are always reported as outliers · entities with values outside first`;
    this.$("rg-seg").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.rgf === rg.filter));
    const from = list.length ? (rg.page - 1) * per + 1 : 0, to = Math.min(list.length, rg.page * per);
    this.$("rg-pager").innerHTML = `<span>${this.int(from)}–${this.int(to)} of ${this.int(list.length)}</span>
      <span class="end"><label class="inline" style="gap:6px">per page <select id="rg-per" style="width:auto;padding:5px 8px;font-size:13px">${[10, 25, 50, 100, 0].map((n) => `<option value="${n}" ${n === rg.per ? "selected" : ""}>${n || "All"}</option>`).join("")}</select></label>
      <button class="icon-btn" data-rgpage="1" ${rg.page <= 1 ? "disabled" : ""} aria-label="First page">${I.first}</button>
      <button class="icon-btn" data-rgpage="${rg.page - 1}" ${rg.page <= 1 ? "disabled" : ""} aria-label="Previous page">${I.prev}</button>
      <span style="padding:0 6px">Page ${rg.page} of ${pages}</span>
      <button class="icon-btn" data-rgpage="${rg.page + 1}" ${rg.page >= pages ? "disabled" : ""} aria-label="Next page">${I.next}</button>
      <button class="icon-btn" data-rgpage="${pages}" ${rg.page >= pages ? "disabled" : ""} aria-label="Last page">${I.last}</button></span>`;
    this.saveUI();
  }

  async setRange(entityId, lo, hi) {
    const r = await this.ws("limits", { entity_id: entityId, min: lo, max: hi });
    this.patchLimits(entityId, r.limits || null);
    this.renderRanges();
    return r;
  }

  suggestRange(st, unit) {
    if (!st || !st.count) return null;
    const span = st.max - st.min, mag = Math.max(Math.abs(st.max), Math.abs(st.min));
    const margin = Math.max(span * 0.5, mag * 0.1, 1e-6);
    const step = niceStep(margin);
    let lo = Math.floor((st.min - margin) / step) * step, hi = Math.ceil((st.max + margin) / step) * step;
    if (st.min >= 0) lo = Math.max(0, lo);
    if (unit === "%") { lo = Math.max(0, lo); hi = Math.min(100, hi); }
    const fix = (x) => Number(x.toPrecision(6));
    return { lo: fix(lo), hi: fix(hi) };
  }

  rangeDialog(entityId) {
    const editing = !!entityId;
    const cur = editing ? (this.S.info?.settings.limits || {})[entityId] || {} : {};
    const limits = this.S.info?.settings.limits || {};
    this.openDialog(editing ? "Edit plausible range" : "Add plausible range", `
      ${editing ? "" : `<div style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--ink-2)">Entity
        <div class="picker" style="max-width:none;flex:none">${I.search}<input type="search" name="ent" placeholder="Search: name or entity_id" autocomplete="off" spellcheck="false"></div>
        <div class="dir-list" id="rg-pick" style="max-height:220px;overflow:auto;border:1px solid var(--border);border-radius:8px" hidden></div></div>`}
      <div class="box" id="rg-info" style="font-size:13px" ${editing ? "" : "hidden"}></div>
      <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px">
        <label class="f"><span id="rg-lo-l">Minimum</span><input type="number" name="lo" step="any" placeholder="none" value="${cur.min ?? ""}"></label>
        <label class="f"><span id="rg-hi-l">Maximum</span><input type="number" name="hi" step="any" placeholder="none" value="${cur.max ?? ""}"></label>
      </div>
      <p class="hint" style="margin:0" id="rg-sug">Leave a field empty for no limit.</p>`, "Save range", async (form) => {
      const id = editing ? entityId : form.dataset.entity;
      if (!id) throw new Error("Choose an entity first.");
      const num = (x) => (x.trim() === "" ? null : parseFloat(x));
      const lo = num(form.lo.value), hi = num(form.hi.value);
      if ((lo != null && !isFinite(lo)) || (hi != null && !isFinite(hi))) throw new Error("Please enter numbers.");
      if (lo == null && hi == null) throw new Error("Set a minimum, a maximum or both.");
      if (lo != null && hi != null && lo > hi) throw new Error("Minimum must be lower than maximum.");
      await this.setRange(id, lo, hi);
      this.toast(editing ? "Range saved" : "Range added");
    });
    const form = this.$("dlg").querySelector("form");
    const choose = async (id) => {
      form.dataset.entity = id;
      const e = this.S.entities?.find((x) => x.entity_id === id);
      const u = e?.unit ? ` (${e.unit})` : "";
      this.$("rg-lo-l").textContent = "Minimum" + u; this.$("rg-hi-l").textContent = "Maximum" + u;
      const info = this.$("rg-info"); info.hidden = false;
      info.innerHTML = `<b>${esc(e?.name || id)}</b> <span class="sub mono">${esc(id)}</span>${limits[id] && !editing ? `<div class="msg-err" style="margin-top:4px">This entity already has a range – saving replaces it.</div>` : ""}<div class="hint" style="margin-top:4px"><span class="spin" style="width:10px;height:10px;vertical-align:-1px"></span> reading the last 7 days …</div>`;
      if (!editing && limits[id]) { form.lo.value = limits[id].min ?? ""; form.hi.value = limits[id].max ?? ""; }
      try {
        const src = e && !e.has_states && e.statistic ? "statistics" : "states";
        const r = await this.ws("analyze", { entity_id: id, source: src, days: 7, method: "range" });
        if (form.dataset.entity !== id) return;
        const st = r.stats, mm = r.stats_minmax || {};
        const stat = st.count ? { count: st.count, min: mm.min ?? st.min, max: mm.max ?? st.max } : null;
        info.querySelector(".hint").textContent = stat ? `last 7 days: min ${this.num(stat.min)}${e?.unit ? " " + e.unit : ""} · max ${this.num(stat.max)}${e?.unit ? " " + e.unit : ""}${r.current != null ? " · current " + r.current + (e?.unit ? " " + e.unit : "") : ""}` : "no numeric values in the last 7 days";
        const counter = !!(e?.statistic?.has_sum || String(e?.state_class || "").startsWith("total"));
        let sg = this.suggestRange(st.count ? { count: st.count, min: st.p01 ?? stat.min, max: st.p99 ?? stat.max } : null, e?.unit);
        // A meter reading keeps growing: a maximum would soon be wrong, so only suggest a lower limit.
        if (sg && counter) sg = { lo: 0, hi: "" };
        this.$("rg-sug").innerHTML = sg ? `Leave a field empty for no limit. Suggestion from the recorded values: <button type="button" class="linkbtn" id="rg-use">${counter ? "minimum 0, no maximum" : `${this.num(sg.lo)} … ${this.num(sg.hi)}${e?.unit ? " " + esc(e.unit) : ""}`}</button>${counter ? `<br>This is a growing counter. Jumps of a counter are found by spike detection on the hourly statistics, a maximum does not help.` : ""}` : "Leave a field empty for no limit.";
        const use = this.$("rg-use"); if (use) use.onclick = () => { form.lo.value = sg.lo; form.hi.value = sg.hi; };
        if (!editing && !limits[id] && sg && form.lo.value === "" && form.hi.value === "") { form.lo.value = sg.lo; form.hi.value = sg.hi; }
      } catch (err) { info.querySelector(".hint").textContent = this.errMsg(err); }
    };
    if (editing) { choose(entityId); return; }
    const inp = form.ent, box = this.$("rg-pick");
    const list = () => {
      const q = inp.value.trim().toLowerCase();
      if (!q) { box.hidden = true; return; }
      const parts = q.split(/\s+/);
      const m = (this.S.entities || []).filter((e) => parts.every((p) => `${e.entity_id} ${e.name} ${e.unit || ""}`.toLowerCase().includes(p))).slice(0, 30);
      box.hidden = false;
      box.innerHTML = m.length ? m.map((e) => `<button type="button" data-pickr="${esc(e.entity_id)}" style="display:flex;gap:10px;align-items:center"><span style="flex:1;min-width:0"><span class="t">${esc(e.name)}</span> <span class="sub mono">${esc(e.entity_id)}</span></span>${e.unit ? `<span class="badge">${esc(e.unit)}</span>` : ""}${limits[e.entity_id] ? `<span class="badge acc">range</span>` : ""}</button>`).join("")
        : `<div class="empty" style="padding:12px">No numeric entity matches.</div>`;
      box.querySelectorAll("[data-pickr]").forEach((b) => (b.onclick = () => { const e = this.S.entities.find((x) => x.entity_id === b.dataset.pickr); inp.value = e.entity_id; box.hidden = true; choose(e.entity_id); form.lo.focus(); }));
    };
    inp.addEventListener("input", () => { delete form.dataset.entity; this.$("rg-info").hidden = true; list(); });
    inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); box.querySelector("[data-pickr]")?.click(); } });
    if (!this.S.entities) this.loadEntities().then(list);
  }

  // =================================================================== SETTINGS
  async viewSettings() {
    const v = this.$("view-settings");
    let data;
    try { data = await this.ws("settings/get"); } catch (e) { v.innerHTML = `<div class="banner err">${esc(this.errMsg(e))}</div>`; return; }
    const s = data.settings, i = this.S.info;
    v.innerHTML = `
      <section class="stats" aria-label="Statistics">
        ${[["Database engine", i ? (i.engine === "sqlite" ? "SQLite" : i.engine) : "…", i?.db_path || ""],
           ["History kept", i ? `${i.keep_days} days` : "…", "recorder purge_keep_days"],
           ["States in DB", i ? "≈ " + this.int(i.counts.states) : "…", `${i ? this.int(i.counts.statistics) : "…"} hourly · ${i ? this.int(i.counts.statistics_short_term) : "…"} 5-min statistics`],
           ["Automatic scan", i ? ({ off: "Off", daily: "Daily", weekly: "Weekly" }[i.settings.auto_scan] || "Off") : "…", i?.next_scan ? `next ${this.dt(i.next_scan)}` : "not scheduled"]].map(([l, x, sub]) => `<div class="card kpi"><div class="l">${l}</div><div class="v">${esc(x)}</div><div class="s">${esc(sub)}</div></div>`).join("")}
      </section>
      <form id="settings-form" style="display:flex;flex-direction:column;gap:16px">
      <section class="card"><h2 style="margin-bottom:12px">Outlier detection</h2>
        <div class="form-grid">
          <label class="f">Default method<select name="method">${Object.entries(METHODS).map(([k, [l]]) => `<option value="${k}" ${k === s.method ? "selected" : ""}>${l}</option>`).join("")}</select><span class="hint" id="m-hint">${esc(METHODS[s.method]?.[1])}</span></label>
          <label class="f">Sensitivity<input type="number" name="threshold" min="0.5" step="0.5" value="${s.threshold ?? ""}" placeholder="default ${DEF_THRESH[s.method]}"><span class="hint">Higher = only stronger outliers. Empty = default of the method.</span></label>
          <label class="f">Neighbours per side<input type="number" name="window" min="1" max="50" value="${s.window}"><span class="hint">Spike detection: values compared on each side.</span></label>
          <label class="f">Max. spike length<input type="number" name="max_run" min="1" max="50" value="${s.max_run ?? 3}"><span class="hint">Longer runs of deviating values are treated as real events (kettle, heating) and not reported.</span></label>
          <label class="f">Default period (days)<input type="number" name="days" min="0.1" step="any" value="${s.days}"></label>
          <label class="f">“Scan all” period (days)<input type="number" name="scan_days" min="0.1" step="any" value="${s.scan_days}"><span class="hint">Keep it short on large installations.</span></label>
          <label class="f">Max. values per analysis<input type="number" name="max_rows" min="1000" step="1000" value="${s.max_rows}"><span class="hint">Only the newest values are used above this.</span></label>
          <label class="f">Max. outliers listed<input type="number" name="max_outliers" min="10" value="${s.max_outliers}"></label>
        </div></section>
      <section class="card"><div class="card-head"><h2>Automatic scan &amp; notification</h2><span class="hint">${i?.last_scan ? `last scan ${this.ago(i.last_scan.ts)} · ${this.int(i.last_scan.outliers)} outliers in ${this.int(i.last_scan.with_outliers)} entities` : "no scan yet"}${i?.next_scan ? ` · next ${esc(this.dt(i.next_scan))}` : ""}</span></div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="form-grid">
            <label class="f">Run<select name="auto_scan"><option value="off" ${s.auto_scan === "off" ? "selected" : ""}>Off</option><option value="daily" ${s.auto_scan === "daily" ? "selected" : ""}>Daily</option><option value="weekly" ${s.auto_scan === "weekly" ? "selected" : ""}>Weekly</option></select></label>
            <label class="f">Weekday<select name="auto_scan_weekday" ${s.auto_scan !== "weekly" ? "disabled" : ""}>${WEEKDAYS.map((d, k) => `<option value="${k}" ${k === Number(s.auto_scan_weekday) ? "selected" : ""}>${d}</option>`).join("")}</select></label>
            <label class="f">Time<input type="time" name="auto_scan_time" value="${esc(s.auto_scan_time)}"></label>
            <label class="f">Period checked (days)<input type="number" name="auto_scan_days" min="0.1" step="any" value="${s.auto_scan_days}"><span class="hint">7 for a weekly scan, 1 for a daily one.</span></label>
          </div>
          <div class="form-grid">
            <label class="f">Notify service (optional)<select name="notify_service"><option value="">– none –</option>${Object.keys(this._hass.services.notify || {}).filter((n) => n !== "persistent_notification" && n !== "send_message").sort().map((n) => `<option value="notify.${n}" ${s.notify_service === "notify." + n ? "selected" : ""}>notify.${esc(n)}</option>`).join("")}${s.notify_service && !Object.keys(this._hass.services.notify || {}).includes(s.notify_service.replace("notify.", "")) ? `<option value="${esc(s.notify_service)}" selected>${esc(s.notify_service)} (missing)</option>` : ""}</select><span class="hint">e.g. the Companion app on your phone.</span></label>
          </div>
          <label class="check"><input type="checkbox" name="notify_persistent" ${s.notify_persistent ? "checked" : ""}><span>Show a notification in Home Assistant<span class="hint">Appears under Notifications in the sidebar, with a link to this panel.</span></span></label>
          <label class="check"><input type="checkbox" name="notify_only_new" ${s.notify_only_new ? "checked" : ""}><span>Only notify about new outliers<span class="hint">Outliers recorded after the previous scan. Old ones you have not fixed yet are not reported again.</span></span></label>
          <label class="check"><input type="checkbox" name="notify_when_clean" ${s.notify_when_clean ? "checked" : ""}><span>Also notify when nothing was found</span></label>
          <div class="actions"><button class="btn" type="button" data-act="scan-server">${I.scan}Scan now and notify</button><button class="btn" type="button" data-act="notify-test">Send test notification</button>
            <span class="hint">Automations can use the service <code>ha_cleanup.scan</code> and the event <code>ha_cleanup_scan_finished</code>.</span></div>
        </div></section>
      <section class="card"><h2 style="margin-bottom:12px">Backup</h2>
        <div style="display:flex;flex-direction:column;gap:14px">
          <label class="f">Backup folder<input type="text" name="backup_dir" value="${esc(s.backup_dir)}" placeholder="${esc(data.backup_dir)}" spellcheck="false"><span class="hint">Empty = <code>/config/ha_cleanup/backups</code>. Must be writable by Home Assistant, e.g. <code>/share/ha_cleanup</code> or <code>/media/backups</code>.</span></label>
          <div class="form-grid">
            <label class="f">Keep newest backups<input type="number" name="backup_keep" min="0" max="100" value="${s.backup_keep}"><span class="hint">Older ones are deleted. 0 = keep all.</span></label>
          </div>
          <label class="check"><input type="checkbox" name="backup_compress" ${s.backup_compress ? "checked" : ""}><span>Compress backups (gzip)<span class="hint">Usually 70–85 % smaller, takes a bit longer.</span></span></label>
          <label class="check"><input type="checkbox" name="backup_before_restore" ${s.backup_before_restore ? "checked" : ""}><span>Create a safety backup before every restore</span></label>
          <label class="check"><input type="checkbox" name="backup_before_purge" ${s.backup_before_purge ? "checked" : ""}><span>Create a safety backup before removing orphaned entities</span></label>
          <label class="check"><input type="checkbox" name="auto_restart_after_restore" ${s.auto_restart_after_restore ? "checked" : ""}><span>Restart Home Assistant right after preparing a restore</span></label>
        </div></section>
      <div class="actions"><button class="btn primary" type="submit">Save settings</button><button class="btn" type="button" data-act="settings-reset">Reset to defaults</button></div>
      </form>`;
  }

  async saveSettings(form) {
    const val = (n) => form[n].value;
    const settings = {
      method: val("method"), threshold: val("threshold") === "" ? null : parseFloat(val("threshold")), window: parseInt(val("window")), max_run: parseInt(val("max_run")),
      days: parseFloat(val("days")), scan_days: parseFloat(val("scan_days")), max_rows: parseInt(val("max_rows")), max_outliers: parseInt(val("max_outliers")),
      backup_dir: val("backup_dir").trim(), backup_keep: parseInt(val("backup_keep")), backup_compress: form.backup_compress.checked,
      backup_before_restore: form.backup_before_restore.checked, auto_restart_after_restore: form.auto_restart_after_restore.checked,
      backup_before_purge: form.backup_before_purge.checked, auto_scan: val("auto_scan"), auto_scan_weekday: parseInt(form.auto_scan_weekday.value),
      auto_scan_time: val("auto_scan_time"), auto_scan_days: parseFloat(val("auto_scan_days")), notify_service: val("notify_service"),
      notify_persistent: form.notify_persistent.checked, notify_only_new: form.notify_only_new.checked, notify_when_clean: form.notify_when_clean.checked,
    };
    try {
      await this.ws("settings/set", { settings });
      this.S.method = settings.method; this.S.threshold = null; this.S.days = settings.days; this.S.scanDays = null;
      this.toast("Settings saved"); this.loadInfo(); this.viewSettings();
    } catch (e) { this.toast(this.errMsg(e), true); }
  }

  // ======================================================================= LOGS
  async viewLogs() {
    const v = this.$("view-logs");
    if (!v.dataset.ready) {
      v.dataset.ready = "1";
      v.innerHTML = `<section class="stats" id="log-stats" aria-label="Statistics"></section>
        <section class="card"><div class="card-head"><h2>Activity</h2><span class="hint">newest first · changes can be undone here</span>
          <div class="seg" id="log-seg" role="group" aria-label="Filter">
            <button data-lf="all" aria-pressed="true">All</button><button data-lf="changes" aria-pressed="false">Changes</button>
            <button data-lf="backups" aria-pressed="false">Backups</button><button data-lf="errors" aria-pressed="false">Errors</button></div>
          <button class="btn small" data-act="log-clear">Clear log</button></div>
          <div class="table-wrap"><table id="log-table" style="min-width:860px"></table></div></section>`;
    }
    try { this.S.log = (await this.ws("log/list")).entries; } catch (e) { this.toast(this.errMsg(e), true); return; }
    this.renderLogs();
  }

  renderLogs() {
    const t = this.$("log-table"); if (!t || !this.S.log) return;
    const all = this.S.log, since = Date.now() / 1000 - 30 * 86400;
    const recent = all.filter((e) => e.ts >= since);
    const ch = recent.filter((e) => ["edit", "delete", "adjust", "purge"].includes(e.action));
    const tiles = [
      ["Changes", this.int(ch.length), "last 30 days"],
      ["Values changed", this.int(ch.reduce((a, e) => a + (e.count || 0), 0)), "edited, deleted or adjusted"],
      ["Backups", this.int(recent.filter((e) => e.action === "backup").length), "created · last 30 days"],
      ["Errors", this.int(recent.filter((e) => e.action === "error").length), "last 30 days", recent.some((e) => e.action === "error") ? "bad" : ""],
    ];
    this.$("log-stats").innerHTML = tiles.map(([l, v, s, c]) => `<div class="card kpi ${c || ""}"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${esc(s)}</div></div>`).join("");
    const f = this.S.logFilter;
    const list = all.filter((e) => f === "all" || (f === "changes" && ["edit", "delete", "adjust", "undo", "purge"].includes(e.action))
      || (f === "backups" && ["backup", "backup_delete", "restore"].includes(e.action)) || (f === "errors" && e.action === "error"));
    this.$("log-seg").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lf === f));
    const head = `<thead><tr><th>Status</th><th>Time</th><th>Action</th><th>Entity</th><th>Details</th><th>User</th><th class="num">Undo</th></tr></thead>`;
    if (!list.length) { t.innerHTML = head + `<tbody><tr><td colspan="7" class="empty">Nothing logged yet.</td></tr></tbody>`; return; }
    t.innerHTML = head + "<tbody>" + list.slice(0, 500).map((e) => {
      const pill = e.action === "error" ? `<span class="pill error">Error</span>` : e.undone ? `<span class="pill neutral">Undone</span>`
        : ["edit", "delete", "adjust", "purge"].includes(e.action) ? `<span class="pill acc">Changed</span>`
        : e.action === "scan" ? (e.count ? `<span class="pill warn">${this.int(e.count)} found</span>` : `<span class="pill ok">Clean</span>`) : `<span class="pill ok">OK</span>`;
      return `<tr><td class="nw">${pill}</td><td class="nw">${this.dt(e.ts, true)}</td>
        <td><div class="t">${esc(ACTIONS[e.action] || e.action)}</div>${e.source ? `<div class="sub">${esc(SOURCES[e.source] || e.source)}</div>` : ""}</td>
        <td class="mono" style="font-size:12px">${e.entity_id ? `<button class="linkbtn mono" data-analyze="${esc(e.entity_id)}">${esc(e.entity_id)}</button>` : "–"}</td>
        <td style="font-size:12px;max-width:440px">${this.logDetails(e)}</td>
        <td class="sub nw">${esc(e.user || "–")}</td>
        <td class="num">${e.undo && !e.undone ? `<button class="btn small" data-undo="${e.id}">${I.undo}Undo</button>` : ""}</td></tr>`;
    }).join("") + "</tbody>";
  }

  logDetails(e) {
    if (e.message) return esc(e.message);
    const d = e.details || [], more = (e.details_total || d.length) - Math.min(d.length, 3);
    const fmtV = (v) => (v && typeof v === "object" ? Object.entries(v).filter(([, x]) => x != null).map(([k, x]) => `${k} ${this.num(x)}`).join(", ") : esc(v));
    const lines = d.slice(0, 3).map((x) => {
      if (e.action === "adjust") return `${this.shortDt(x.ts)}: ${x.adjustment > 0 ? "+" : ""}${this.num(x.adjustment)}${e.unit ? " " + esc(e.unit) : ""}`;
      if (e.action === "delete") return `${this.shortDt(x.ts)}: ${fmtV(x.old)} deleted`;
      return `${this.shortDt(x.ts)}: ${fmtV(x.old)} → <b>${fmtV(x.new)}</b>`;
    });
    return `${this.int(e.count || 0)} value${e.count === 1 ? "" : "s"}${lines.length ? "<div class='sub'>" + lines.join("<br>") + (more > 0 ? `<br>… and ${this.int(more)} more` : "") + "</div>" : ""}`;
  }

  // ==================================================================== dialogs
  openDialog(title, bodyHtml, okLabel, onOk, danger = false) {
    const d = this.$("dlg");
    d.innerHTML = `<form class="dlg" method="dialog"><div class="dlg-head"><h2>${esc(title)}</h2><button class="icon-btn" type="button" data-close aria-label="Close">${I.x}</button></div>
      <div class="dlg-body">${bodyHtml}<p class="form-err" hidden></p></div>
      <div class="dlg-foot"><button class="btn" type="button" data-close>Cancel</button><button class="btn primary ${danger ? "" : ""}" type="submit">${esc(okLabel)}</button></div></form>`;
    const form = d.querySelector("form"), err = d.querySelector(".form-err");
    d.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => d.close()));
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      const btn = form.querySelector('[type="submit"]'); btn.disabled = true;
      try { await onOk(form); d.close(); } catch (e) { err.textContent = this.errMsg(e); err.hidden = false; }
      btn.disabled = false;
    };
    d.showModal();
    setTimeout(() => form.querySelector("input:not([type=checkbox])")?.focus(), 30);
  }

  confirm(title, html, okLabel, danger = false, withForm = false) {
    return new Promise((resolve) => {
      let done = false;
      this.openDialog(title, html, okLabel, async (form) => {
        done = true;
        resolve(withForm ? { restart: form.restart?.checked ?? false, backup: form.backup?.checked ?? false } : true);
      }, danger);
      this.$("dlg").addEventListener("close", () => { if (!done) resolve(false); }, { once: true });
    });
  }

  // ===================================================================== events
  async onClick(e) {
    const t = e.target;
    const btn = t.closest("button, circle[data-oid]");
    if (!btn) return;
    const ds = btn.dataset;
    if (ds.pick) { this.pick(ds.pick); return; }
    if (ds.analyze) { this.pick(ds.analyze); return; }
    if (ds.f) { this.S.entityFilter = ds.f; this.S.entityPage = 1; this.renderEntityTable(); return; }
    if (ds.q) return;
    if (ds.epage) { this.S.entityPage = +ds.epage; this.renderEntityTable(); return; }
    if (ds.opage) { this.S.outPage = +ds.opage; this.renderOutliers(); return; }
    if (ds.sort) { this.S.sort = ds.sort; this.S.outPage = 1; this.renderOutliers(); return; }
    if (ds.cm) { this.S.chartMode = ds.cm; this.$("chart-seg").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.cm === ds.cm)); this.drawChart(); return; }
    if (ds.lf) { this.S.logFilter = ds.lf; this.renderLogs(); return; }
    if (ds.oid && btn.tagName.toLowerCase() === "circle") {
      if (this._noClick) return;
      const vis = this.visibleOutliers(), list = this.S.sort === "score" ? [...vis].sort((a, b) => b.score - a.score) : vis;
      const idx = list.findIndex((o) => String(o.id) === ds.oid);
      if (idx >= 0) { this.S.outPage = Math.floor(idx / 100) + 1; this.renderOutliers(); }
      const row = this.$("out-card").querySelector(`tr[data-oid="${ds.oid}"]`);
      if (row) { row.scrollIntoView({ behavior: "smooth", block: "center" }); row.classList.remove("flash"); void row.offsetWidth; row.classList.add("flash"); }
      return;
    }
    if (ds.fix) { this.applyFix([this.outlier(ds.fix)]); return; }
    if (ds.edit) { this.editDialog(this.outlier(ds.edit)); return; }
    if (ds.del) { this.deleteRows([this.outlier(ds.del)]); return; }
    if (ds.undo) { this.undo(ds.undo); return; }
    if (ds.bdl) { this.downloadBackup(ds.bdl); return; }
    if (ds.brestore) { this.restoreBackup(ds.brestore); return; }
    if (ds.bdel) {
      if (await this.confirm("Delete backup", `<p style="margin:0">Delete <b class="mono">${esc(ds.bdel)}</b>?</p>`, "Delete", true)) {
        try { await this.ws("backup/delete", { name: ds.bdel }); this.toast("Backup deleted"); } catch (err) { this.toast(this.errMsg(err), true); }
        this.viewBackup();
      }
      return;
    }
    if (ds.purge) { this.purgeOrphans([ds.purge]); return; }
    if (ds.esort) {
      // Click: first direction (A→Z for names, large → small for numbers), click again: reverse, third click: off.
      const k = ds.esort, so = this.S.esort, first = k === "name" ? "asc" : "desc";
      this.S.esort = !so || so.key !== k ? { key: k, dir: first } : so.dir === first ? { key: k, dir: first === "asc" ? "desc" : "asc" } : null;
      this.S.entityPage = 1; this.renderEntityTable(); return;
    }
    if (ds.rgf) { this.S.rg.filter = ds.rgf; this.S.rg.page = 1; this.renderRanges(); return; }
    if (ds.rgpage) { this.S.rg.page = +ds.rgpage; this.renderRanges(); return; }
    if (ds.redit) { this.rangeDialog(ds.redit); return; }
    if (ds.rdel) {
      const id = ds.rdel, old = { ...((this.S.info?.settings.limits || {})[id] || {}) };
      try { await this.setRange(id, null, null);
        this.toast("Range removed", false, { label: "Undo", run: () => this.setRange(id, old.min ?? null, old.max ?? null).then(() => this.toast("Range restored")).catch((e) => this.toast(this.errMsg(e), true)) }); }
      catch (err) { this.toast(this.errMsg(err), true); }
      return;
    }
    if (ds.pickr) return;

    switch (ds.act) {
      case "reanalyze": this.analyze(); break;
      case "zoom-reset": this.resetZoom(); break;
      case "close-ana": this.closeAna(); break;
      case "scan": this.scanAll(); break;
      case "scan-stop":
        if (this.S.scanning) { this.S.scanning.stopping = true; this.renderScanProgress(); try { await this.ws("scan/stop"); } catch (err) { this.toast(this.errMsg(err), true); } }
        break;
      case "purge-selected": this.purgeOrphans([...this.S.orphanSel]); break;
      case "orph-all": this.S.entities.filter((x) => x.orphaned).forEach((x) => this.S.orphanSel.add(x.entity_id)); this.renderEntityTable(); break;
      case "orph-none": this.S.orphanSel.clear(); this.renderEntityTable(); break;
      case "scan-server": {
        btn.disabled = true; const old = btn.innerHTML; btn.innerHTML = `<span class="spin"></span>Scanning …`;
        try { const r = await this.ws("scan/run", { notify: true }); const sm = r.summary;
          this.S.lastScan = r.scan; this.S.scan = new Map(r.scan.results.map((x) => [x.entity_id, x])); this.S.fscan = null;
          this.toast(`Scan finished: ${sm.outliers} outlier${sm.outliers === 1 ? "" : "s"} in ${sm.with_outliers} entit${sm.with_outliers === 1 ? "y" : "ies"}`); }
        catch (err) { this.toast(this.errMsg(err), true); }
        btn.innerHTML = old; btn.disabled = false; this.loadInfo(); if (this.S.view === "settings") setTimeout(() => this.viewSettings(), 300);
        break;
      }
      case "notify-test":
        try { const r = await this.ws("notify/test"); this.toast(r.sent ? `Sent to ${r.targets.join(", ")}` : "Nothing sent – enable a notification target first", !r.sent); }
        catch (err) { this.toast(this.errMsg(err), true); }
        break;
      case "scan-filter": this.filterDialog(); break;
      case "rg-add": this.rangeDialog(); break;
      case "fscan-clear": this.S.fscan = null; this.S.entityPage = 1; this.renderEntityStats(); this.renderEntityTable(); break;
      case "fscan-rerun": if (this.S.fscan) this.scanFiltered(this.S.fscan.pattern, this.S.fscan.days); break;
      case "goto-settings": this.show("settings"); break;
      case "save-limits": {
        const mn = this.$("lim-min").value, mx = this.$("lim-max").value;
        const lim = { min: mn === "" ? null : parseFloat(mn), max: mx === "" ? null : parseFloat(mx) };
        try { await this.ws("limits", { entity_id: this.S.result.entity_id, ...lim }); this.patchLimits(this.S.result.entity_id, lim.min == null && lim.max == null ? null : lim);
          this.toast("Plausible range saved"); this.analyze(); } catch (err) { this.toast(this.errMsg(err), true); }
        break;
      }
      case "bulk-apply": this.applyFix(this.S.result.outliers.filter((o) => this.S.sel.has(o.id))); break;
      case "bulk-delete": this.deleteRows(this.S.result.outliers.filter((o) => this.S.sel.has(o.id))); break;
      case "sel-none": this.S.sel.clear(); this.renderOutliers(); break;
      case "backup-create": this.createBackup(); break;
      case "backup-refresh": this.viewBackup(); this.loadInfo(); break;
      case "restart":
        if (await this.confirm("Restart Home Assistant", "<p style='margin:0'>Restart now to apply the prepared restore?</p>", "Restart")) {
          this._hass.callService("homeassistant", "restart"); this.toast("Restarting …");
        }
        break;
      case "cancel-restore":
        try { await this.ws("backup/cancel_restore"); this.toast("Restore cancelled"); } catch (err) { this.toast(this.errMsg(err), true); }
        this.loadInfo(); if (this.S.view === "backup") this.viewBackup();
        break;
      case "log-clear":
        if (await this.confirm("Clear log", "<p style='margin:0'>Remove all log entries? Undo is no longer possible afterwards.</p>", "Clear", true)) {
          await this.ws("log/clear"); this.viewLogs(); this.loadInfo();
        }
        break;
      case "settings-reset":
        if (await this.confirm("Reset settings", "<p style='margin:0'>Reset detection and backup settings to their defaults? Plausible ranges are kept.</p>", "Reset")) {
          const d = (await this.ws("settings/get")).defaults; const { limits, ...rest } = d;
          await this.ws("settings/set", { settings: rest }); this.toast("Defaults restored"); this.loadInfo(); this.viewSettings();
        }
        break;
    }
  }

  patchLimits(entityId, lim) {
    const e = this.S.entities?.find((x) => x.entity_id === entityId); if (e) e.limits = lim;
    if (this.S.info) { const l = { ...(this.S.info.settings.limits || {}) }; if (lim) l[entityId] = lim; else delete l[entityId]; this.S.info.settings.limits = l; }
  }

  onChange(e) {
    const t = e.target;
    if (t.id === "source") { this.S.source = t.value; try { localStorage.setItem("ha-cleanup-source", t.value); } catch {} this.saveUI(); this.S.sel.clear(); if (this.S.selected) this.analyze(); }
    else if (t.id === "rg-per") { this.S.rg.per = parseInt(t.value); this.S.rg.page = 1; this.renderRanges(); }
    else if (t.id === "scan-days") { this.S.scanDays = parseFloat(t.value); this.saveUI(); }
    else if (t.id === "days") { this.S.days = parseFloat(t.value); this.saveUI(); if (this.S.selected) this.analyze(); }
    else if (t.id === "method") { this.S.method = t.value; this.S.threshold = null; this.analyze(); }
    else if (t.id === "threshold") { const v = parseFloat(t.value); this.S.threshold = isFinite(v) && v > 0 ? v : null; this.analyze(); }
    else if (t.id === "out-all") {
      const vis = this.visibleOutliers(), list = this.S.sort === "score" ? [...vis].sort((a, b) => b.score - a.score) : vis;
      list.slice((this.S.outPage - 1) * 100, this.S.outPage * 100).forEach((o) => (t.checked ? this.S.sel.add(o.id) : this.S.sel.delete(o.id)));
      this.renderOutliers();
    } else if (t.dataset.osel) {
      const id = this.outlier(t.dataset.osel).id; t.checked ? this.S.sel.add(id) : this.S.sel.delete(id); this.renderOutliers();
    } else if (t.dataset.orph) {
      t.checked ? this.S.orphanSel.add(t.dataset.orph) : this.S.orphanSel.delete(t.dataset.orph); this.renderEntityTable();
    } else if (t.id === "orph-all") {
      const per = 50, list = this.filteredEntities().slice((this.S.entityPage - 1) * per, this.S.entityPage * per).filter((x) => x.orphaned);
      list.forEach((x) => (t.checked ? this.S.orphanSel.add(x.entity_id) : this.S.orphanSel.delete(x.entity_id))); this.renderEntityTable();
    } else if (t.name === "auto_scan" && t.form?.id === "settings-form") {
      t.form.auto_scan_weekday.disabled = t.value !== "weekly";
    } else if (t.name === "method" && t.form?.id === "settings-form") {
      this.$("m-hint").textContent = METHODS[t.value]?.[1] || ""; t.form.threshold.placeholder = `default ${DEF_THRESH[t.value]}`;
    }
  }

  onInput(e) {
    if (e.target.id === "rg-q") { this.S.rg.q = e.target.value; this.S.rg.page = 1; clearTimeout(this._rqT); this._rqT = setTimeout(() => this.renderRanges(), 150); return; }
    if (e.target.id === "picker") {
      this.S.q = e.target.value; this.S.ddIndex = 0; this.S.entityPage = 1;
      this.openDropdown(); clearTimeout(this._qT); this._qT = setTimeout(() => this.renderEntityTable(), 150);
    }
  }

  onKey(e) {
    if (e.key === "Escape" && this.S.anaOpen && e.target.id !== "picker" && !this.$("dlg").open) { e.preventDefault(); this.closeAna(); return; }
    if (e.target.id === "picker") {
      const dd = this.$("dropdown"), list = this.S.ddList || [];
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); if (dd.hidden) this.openDropdown();
        this.S.ddIndex = Math.max(0, Math.min(list.length - 1, this.S.ddIndex + (e.key === "ArrowDown" ? 1 : -1)));
        dd.querySelectorAll("button").forEach((b, i) => b.classList.toggle("active", i === this.S.ddIndex));
        dd.querySelectorAll("button")[this.S.ddIndex]?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") { e.preventDefault(); if (list[this.S.ddIndex]) this.pick(list[this.S.ddIndex].entity_id); }
      else if (e.key === "Escape") this.closeDropdown();
    }
    if (e.target.form?.id === "settings-form" && e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); this.saveSettings(e.target.form); }
  }

  connectedCallback() {
    if (this._hass && this.S.info) { this.loadInfo(); this.loadLastScan(); }
    if (this._submitBound) return;
    this._submitBound = true;
    this.shadowRoot.addEventListener("submit", (e) => { if (e.target.id === "settings-form") { e.preventDefault(); this.saveSettings(e.target); } });
  }
}

function niceStep(raw) {
  if (!isFinite(raw) || raw <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

if (!customElements.get("ha-cleanup-panel")) customElements.define("ha-cleanup-panel", HaCleanupPanel);
