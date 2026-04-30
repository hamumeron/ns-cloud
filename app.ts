// ns-cloud — main application (TypeScript source)
// Compile: tsc app.ts --target ES2020 --module ES2020 --moduleResolution bundler

// ── Types ──────────────────────────────────────────────────────────────────

type PageId = 'overview' | 'repos' | 'workers' | 'dns' | 'analytics' | 'deployments' | 'logs' | 'settings';
type PillVariant = 'green' | 'blue' | 'amber' | 'red' | 'gray';
type DotVariant = 'green' | 'blue' | 'amber';
type ToastType = 'success' | 'error' | 'info';
type LogLevel = 'INFO' | 'OK' | 'WARN' | 'ERR';

interface RepoData {
  name: string;
  branch: string;
  dot: DotVariant;
  timeAgo: string;
  commit: string;
  status: PillVariant;
  statusLabel: string;
}

interface WorkerData {
  name: string;
  route: string;
  status: PillVariant;
  statusLabel: string;
  latency: string;
  reqs: string;
  err: string;
}

interface DnsZone {
  name: string;
  type: PillVariant;
  typeLabel: string;
  meta: string;
  dot: DotVariant;
}

interface DeployEntry {
  sha: string;
  msg: string;
  status: PillVariant;
  statusLabel: string;
  time: string;
}

interface LogEntry {
  time: string;
  level: LogLevel;
  msg: string;
}

interface SettingToggle { type: 'toggle'; key: string; label: string; value: boolean; }
interface SettingText   { type: 'text';   key: string; label: string; value: string; }
type Setting = SettingToggle | SettingText;

// ── Data ───────────────────────────────────────────────────────────────────

const REPOS: RepoData[] = [
  { name: 'ns-cloud/api',      branch: 'main',       dot: 'green', timeAgo: '2 min ago',  commit: 'fix: auth token expiry edge case',         status: 'green', statusLabel: 'Deployed' },
  { name: 'ns-cloud/frontend', branch: 'feat/auth',  dot: 'blue',  timeAgo: '47 min ago', commit: 'feat: add oauth2 login flow (+234 -18)',    status: 'amber', statusLabel: 'PR Open'  },
  { name: 'ns-cloud/workers',  branch: 'main',       dot: 'green', timeAgo: '3 hr ago',   commit: 'perf: reduce cold start by 40ms',           status: 'green', statusLabel: 'Deployed' },
  { name: 'ns-cloud/infra',    branch: 'dev',        dot: 'amber', timeAgo: '1 day ago',  commit: 'chore: update CF worker KV bindings',       status: 'blue',  statusLabel: 'Staging'  },
  { name: 'ns-cloud/docs',     branch: 'main',       dot: 'green', timeAgo: '3 days ago', commit: 'docs: update API reference for v2',         status: 'green', statusLabel: 'Deployed' },
];

const WORKERS: WorkerData[] = [
  { name: 'api-gateway',  route: 'ns-api.example.workers.dev/*',   status: 'green', statusLabel: 'Active',  latency: '8.2ms', reqs: '42k',  err: '0.1%' },
  { name: 'image-resize', route: 'cdn.example.com/img/*',          status: 'green', statusLabel: 'Active',  latency: '14ms',  reqs: '91k',  err: '0.0%' },
  { name: 'auth-check',   route: 'auth.example.workers.dev/*',     status: 'blue',  statusLabel: 'Staging', latency: '5.1ms', reqs: '1.2k', err: '0.4%' },
  { name: 'kv-cache',     route: 'cache.example.workers.dev/*',    status: 'green', statusLabel: 'Active',  latency: '2.3ms', reqs: '210k', err: '0.0%' },
];

const DNS_ZONES: DnsZone[] = [
  { name: 'example.com',         type: 'green', typeLabel: 'Proxied',  meta: 'SSL: Full · TTL: Auto', dot: 'green' },
  { name: 'api.example.com',     type: 'blue',  typeLabel: 'CNAME',    meta: '→ workers.dev',         dot: 'green' },
  { name: 'cdn.example.com',     type: 'green', typeLabel: 'Proxied',  meta: 'Cache: Aggressive',     dot: 'green' },
  { name: 'staging.example.com', type: 'amber', typeLabel: 'DNS only', meta: 'No proxy',              dot: 'amber' },
];

const PAGE_RULES = [
  { pattern: 'example.com/api/*',    action: 'Cache Level: Bypass' },
  { pattern: 'example.com/static/*', action: 'Cache Everything · 30d TTL' },
];

const CHART_DATA = { days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], vals: [98,120,115,142,160,88,105] };

const COUNTRIES = [
  { name: 'Japan',         pct: '38%' },
  { name: 'United States', pct: '24%' },
  { name: 'Germany',       pct: '12%' },
  { name: 'Others',        pct: '26%' },
];

const DEPLOYMENTS: DeployEntry[] = [
  { sha: 'a1b2c3d', msg: 'fix: auth token expiry edge case',         status: 'green', statusLabel: 'Success', time: '12 min ago' },
  { sha: 'f4e5d6c', msg: 'feat: add rate limiting middleware',        status: 'green', statusLabel: 'Success', time: '2 hr ago'   },
  { sha: '9b8a7c6', msg: 'chore: update CF worker KV bindings',       status: 'amber', statusLabel: 'Queued',  time: '3 hr ago'   },
  { sha: '3d2c1b0', msg: 'perf: optimize image resize worker',        status: 'green', statusLabel: 'Success', time: '1 day ago'  },
  { sha: 'e1f2a3b', msg: 'fix: CORS headers on preflight',            status: 'red',   statusLabel: 'Failed',  time: '2 days ago' },
];

const GITHUB_SETTINGS: Setting[] = [
  { type: 'text',   key: 'org',          label: 'Organization',     value: 'ns-cloud' },
  { type: 'toggle', key: 'auto_deploy',  label: 'Auto-deploy on push', value: true  },
  { type: 'toggle', key: 'pr_preview',   label: 'PR previews',      value: true  },
  { type: 'toggle', key: 'status_check', label: 'Status checks',    value: true  },
];

const CF_SETTINGS: Setting[] = [
  { type: 'text',   key: 'account_id',   label: 'Account ID',   value: '••••f3a2' },
  { type: 'text',   key: 'api_token',    label: 'API Token',    value: '••••••••' },
  { type: 'toggle', key: 'always_on',    label: 'Always Online', value: true  },
  { type: 'toggle', key: 'minify',       label: 'Minify assets', value: false },
];

const LOG_POOL: LogEntry[] = [
  { time: '', level: 'INFO', msg: 'GET /api/v1/users → 200 (8ms)' },
  { time: '', level: 'INFO', msg: 'POST /api/v1/auth/refresh → 200 (5ms)' },
  { time: '', level: 'WARN', msg: 'Rate limit approaching for IP 203.0.113.42' },
  { time: '', level: 'OK',   msg: 'CF Worker deployed: kv-cache v3.2.1' },
  { time: '', level: 'INFO', msg: 'GET /api/v1/items?page=2 → 200 (11ms)' },
  { time: '', level: 'INFO', msg: 'Cache HIT /static/main.js (CF Edge: NRT)' },
  { time: '', level: 'INFO', msg: 'GET /api/v1/stats → 200 (3ms)' },
  { time: '', level: 'WARN', msg: 'Worker memory usage at 85%' },
  { time: '', level: 'OK',   msg: 'DNS propagation complete for cdn.example.com' },
  { time: '', level: 'ERR',  msg: 'Timeout on upstream /auth/verify (3001ms)' },
  { time: '', level: 'INFO', msg: 'POST /api/v1/upload → 201 (142ms)' },
  { time: '', level: 'OK',   msg: 'GitHub Action: deploy-to-workers passed' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function pill(variant: PillVariant, label: string): string {
  return `<span class="pill pill-${variant}">${label}</span>`;
}

function dot(variant: DotVariant): string {
  return `<span class="commit-dot dot-${variant}"></span>`;
}

function nowTime(): string {
  return new Date().toLocaleTimeString('ja-JP', { hour12: false });
}

// ── Toast ──────────────────────────────────────────────────────────────────

function showToast(msg: string, type: ToastType = 'info', duration = 3000): void {
  const container = el('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-dot"></span>${msg}`;
  container.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ── Navigation ─────────────────────────────────────────────────────────────

function initNav(): void {
  document.querySelectorAll<HTMLButtonElement>('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId = btn.dataset.page as PageId;
      navigateTo(pageId, btn);
    });
  });
}

function navigateTo(pageId: PageId, btn: HTMLButtonElement): void {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');
  onPageEnter(pageId);
}

// ── Clock ──────────────────────────────────────────────────────────────────

function initClock(): void {
  const tick = (): void => {
    const timeEl = el('topbar-time');
    if (timeEl) timeEl.textContent = nowTime();
  };
  tick();
  setInterval(tick, 1000);
}

// ── Overview ───────────────────────────────────────────────────────────────

function renderRecentPushes(): void {
  const list = el('recent-pushes');
  if (!list) return;
  list.innerHTML = REPOS.slice(0, 3).map(r => `
    <li class="repo-row">
      ${dot(r.dot)}
      <span class="repo-name">${r.name}</span>
      <span class="repo-branch">${r.branch}</span>
      <span class="repo-time">${r.timeAgo}</span>
    </li>`).join('');
}

function renderEdgeMap(): void {
  const map = el('edge-map');
  if (!map || map.querySelector('.edge-node')) return;
  const positions = [
    [18,40],[30,30],[52,35],[68,42],[82,28],[87,58],[72,65],[48,68],[26,62],[91,42],[60,20],[40,55]
  ];
  positions.forEach(([x, y], i) => {
    const node = document.createElement('div');
    node.className = 'edge-node';
    node.style.left = `${x}%`;
    node.style.top  = `${y}%`;
    (node.children[0] as HTMLElement | undefined);
    const delay = (i * 0.22).toFixed(2);
    node.style.animationDelay = `${delay}s`;
    map.appendChild(node);
  });
}

// ── Repos ──────────────────────────────────────────────────────────────────

function renderRepos(): void {
  const container = el('repo-cards');
  if (!container) return;
  container.innerHTML = REPOS.map(r => `
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">${r.name}</span>
        ${pill(r.status, r.statusLabel)}
      </div>
      <div class="repo-card-inner">
        <div class="repo-card-row">
          <span class="repo-branch">${r.branch}</span>
          <div class="repo-actions">
            <button class="btn" data-action="pr" data-repo="${r.name}">PR</button>
            <button class="btn btn-primary" data-action="deploy" data-repo="${r.name}">Deploy</button>
          </div>
        </div>
        <div class="repo-commit">Last commit: ${r.commit} — ${r.timeAgo}</div>
      </div>
    </div>`).join('');

  container.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action!;
      const repo   = btn.dataset.repo!;
      if (action === 'deploy') {
        showToast(`Deploying ${repo}…`, 'info');
        setTimeout(() => showToast(`${repo} deployed successfully`, 'success'), 2000);
      } else {
        showToast(`Opening PR for ${repo}`, 'info');
      }
    });
  });
}

// ── Workers ────────────────────────────────────────────────────────────────

function renderWorkers(): void {
  const grid = el('worker-grid');
  if (!grid) return;
  grid.innerHTML = WORKERS.map(w => `
    <div class="worker-card">
      <div class="worker-head">
        <span class="worker-name">${w.name}</span>
        ${pill(w.status, w.statusLabel)}
      </div>
      <div class="worker-route">${w.route}</div>
      <div class="worker-stats">
        <div><div class="worker-stat-v">${w.latency}</div><div class="worker-stat-l">Latency</div></div>
        <div><div class="worker-stat-v">${w.reqs}</div><div class="worker-stat-l">Req/day</div></div>
        <div><div class="worker-stat-v">${w.err}</div><div class="worker-stat-l">Errors</div></div>
      </div>
    </div>`).join('');

  el<HTMLButtonElement>('new-worker-btn')?.addEventListener('click', () => {
    showToast('Worker creation wizard coming soon', 'info');
  });
}

// ── DNS ────────────────────────────────────────────────────────────────────

function renderDns(): void {
  const list = el('dns-list');
  if (list) {
    list.innerHTML = DNS_ZONES.map(z => `
      <li class="cf-row">
        ${dot(z.dot)}
        <span class="cf-domain">${z.name}</span>
        ${pill(z.type, z.typeLabel)}
        <span class="cf-meta">${z.meta}</span>
      </li>`).join('');
  }

  const rules = el('rules-list');
  if (rules) {
    rules.innerHTML = PAGE_RULES.map(r => `
      <li class="cf-row">
        <span class="cf-domain" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.pattern}</span>
        <span class="cf-meta" style="flex:1">${r.action}</span>
        <button class="btn" data-pattern="${r.pattern}">Edit</button>
      </li>`).join('');

    rules.querySelectorAll<HTMLButtonElement>('[data-pattern]').forEach(btn => {
      btn.addEventListener('click', () => showToast(`Editing rule: ${btn.dataset.pattern}`, 'info'));
    });
  }

  el<HTMLButtonElement>('add-record-btn')?.addEventListener('click', () => {
    showToast('Add DNS record panel coming soon', 'info');
  });
}

// ── Analytics ──────────────────────────────────────────────────────────────

function renderAnalytics(): void {
  const bars   = el('chart-bars');
  const labels = el('chart-labels');
  if (!bars || !labels) return;
  if (bars.children.length > 0) return; // already rendered

  const max = Math.max(...CHART_DATA.vals);
  bars.innerHTML = CHART_DATA.vals.map((v, i) => {
    const h = Math.round((v / max) * 100);
    return `<div class="chart-bar" style="height:${h}px" title="${CHART_DATA.days[i]}: ${v}k reqs">
      <span class="chart-bar-val">${v}k</span>
    </div>`;
  }).join('');

  labels.innerHTML = CHART_DATA.days.map(d =>
    `<span class="chart-label">${d}</span>`
  ).join('');

  const countryList = el('country-list');
  if (countryList) {
    countryList.innerHTML = COUNTRIES.map(c => `
      <li class="cf-row">
        <span class="cf-domain">${c.name}</span>
        <span class="cf-meta">${c.pct}</span>
      </li>`).join('');
  }

  // Animate progress bar
  const fill = el('cache-fill');
  if (fill) setTimeout(() => { fill.style.width = '87%'; }, 100);
}

// ── Deployments ────────────────────────────────────────────────────────────

function renderDeployments(): void {
  const list = el('deploy-list');
  if (!list) return;
  list.innerHTML = DEPLOYMENTS.map(d => `
    <li class="deploy-row">
      <span class="deploy-sha">${d.sha}</span>
      <span class="deploy-msg">${d.msg}</span>
      ${pill(d.status, d.statusLabel)}
      <span class="deploy-time">${d.time}</span>
    </li>`).join('');

  el<HTMLButtonElement>('deploy-now-btn')?.addEventListener('click', () => {
    showToast('Triggering deployment…', 'info');
    setTimeout(() => showToast('Deployment started on main branch', 'success'), 1500);
  });
}

// ── Logs ───────────────────────────────────────────────────────────────────

let logInterval: number | null = null;
let logPaused = false;
let logIdx = 0;

function levelClass(level: LogLevel): string {
  const map: Record<LogLevel, string> = {
    INFO: 'log-level-info',
    OK:   'log-level-ok',
    WARN: 'log-level-warn',
    ERR:  'log-level-err',
  };
  return map[level];
}

function appendLog(entry: LogEntry): void {
  const panel = el('log-panel');
  if (!panel) return;
  // Remove cursor line if present
  const cursor = panel.querySelector('.log-cursor');
  if (cursor?.parentElement) cursor.parentElement.remove();

  const line = document.createElement('div');
  line.className = 'log-line';
  line.innerHTML = `
    <span class="log-time">${nowTime()}</span>
    <span class="${levelClass(entry.level)}">[${entry.level}]</span>
    <span class="log-msg">${entry.msg}</span>`;
  panel.appendChild(line);

  // Add cursor line
  const cursorLine = document.createElement('div');
  cursorLine.className = 'log-line';
  cursorLine.innerHTML = `<span class="log-time"></span><span class="log-msg">waiting for new events<span class="log-cursor"></span></span>`;
  panel.appendChild(cursorLine);

  panel.scrollTop = panel.scrollHeight;
}

function initLogs(): void {
  const panel = el('log-panel');
  if (!panel) return;
  panel.innerHTML = '';

  // Seed initial lines
  LOG_POOL.slice(0, 6).forEach(e => appendLog(e));
  logIdx = 6;

  if (logInterval) clearInterval(logInterval);
  logInterval = window.setInterval(() => {
    if (logPaused) return;
    appendLog(LOG_POOL[logIdx % LOG_POOL.length]);
    logIdx++;
  }, 1800);

  const pauseBtn = el<HTMLButtonElement>('log-pause-btn');
  const logStatus = el('log-status');
  pauseBtn?.addEventListener('click', () => {
    logPaused = !logPaused;
    pauseBtn.textContent = logPaused ? 'Resume' : 'Pause';
    if (logStatus) {
      logStatus.textContent  = logPaused ? 'Paused' : 'Streaming';
      logStatus.className    = `pill ${logPaused ? 'pill-amber' : 'pill-green'}`;
    }
  });

  el<HTMLButtonElement>('log-clear-btn')?.addEventListener('click', () => {
    if (panel) panel.innerHTML = '';
    showToast('Logs cleared', 'info');
  });
}

// ── Settings ───────────────────────────────────────────────────────────────

function renderSettingRows(containerId: string, settings: Setting[]): void {
  const container = el(containerId);
  if (!container) return;
  container.innerHTML = settings.map(s => {
    if (s.type === 'toggle') {
      const offClass = s.value ? '' : ' off';
      return `<div class="settings-row">
        <span class="settings-key">${s.label}</span>
        <button class="toggle${offClass}" data-key="${s.key}" aria-label="${s.label} toggle"></button>
      </div>`;
    } else {
      return `<div class="settings-row">
        <span class="settings-key">${s.label}</span>
        <span class="settings-val">${s.value}</span>
      </div>`;
    }
  }).join('');

  container.querySelectorAll<HTMLButtonElement>('.toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('off');
      const isOn = !btn.classList.contains('off');
      showToast(`${btn.dataset.key} ${isOn ? 'enabled' : 'disabled'}`, isOn ? 'success' : 'info');
    });
  });
}

function renderSettings(): void {
  renderSettingRows('github-settings', GITHUB_SETTINGS);
  renderSettingRows('cf-settings',     CF_SETTINGS);

  const webhooks = el('webhook-settings');
  if (webhooks) {
    webhooks.innerHTML = `
      <div class="settings-row"><span class="settings-key">Slack #deploys</span>${pill('green', 'Active')}</div>
      <div class="settings-row"><span class="settings-key">Discord alerts</span>${pill('gray', 'Inactive')}</div>`;
  }

  el<HTMLButtonElement>('add-webhook-btn')?.addEventListener('click', () => {
    showToast('Webhook configuration panel coming soon', 'info');
  });
}

// ── Page Lifecycle ─────────────────────────────────────────────────────────

const rendered = new Set<PageId>();

function onPageEnter(page: PageId): void {
  if (rendered.has(page)) {
    // Re-trigger animations
    if (page === 'analytics') {
      const fill = el('cache-fill');
      if (fill) { fill.style.width = '0'; setTimeout(() => { fill.style.width = '87%'; }, 50); }
    }
    if (page === 'logs') initLogs();
    return;
  }
  rendered.add(page);

  switch (page) {
    case 'overview':    renderRecentPushes(); renderEdgeMap();  break;
    case 'repos':       renderRepos();                          break;
    case 'workers':     renderWorkers();                        break;
    case 'dns':         renderDns();                            break;
    case 'analytics':   renderAnalytics();                      break;
    case 'deployments': renderDeployments();                    break;
    case 'logs':        initLogs();                             break;
    case 'settings':    renderSettings();                       break;
  }
}

// ── Boot ───────────────────────────────────────────────────────────────────

function boot(): void {
  initNav();
  initClock();
  // Render initial page
  onPageEnter('overview');
}

document.addEventListener('DOMContentLoaded', boot);
