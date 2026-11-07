pub fn render_stage_receiver_html(initial_slot_id: &str) -> String {
    let safe_slot: String = initial_slot_id
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect();

    let template = r##"<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Xteon StageLink Receiver</title>
  <style>
    :root, [data-theme="dark"] {
      --stage-bg: #000000;
      --hud-bg: rgba(12, 16, 26, 0.92);
      --hud-card: #121726;
      --hud-border: rgba(148, 163, 184, 0.24);
      --text-main: #F8FAFC;
      --text-sub: #94A3B8;
      --btn-bg: rgba(30, 41, 59, 0.85);
      --btn-hover: rgba(51, 65, 85, 0.95);
      --cyan: #06B6D4;
      --cyan-soft: rgba(6, 182, 212, 0.18);
      --amber: #F59E0B;
      --amber-soft: rgba(245, 158, 11, 0.2);
      --emerald: #10B981;
      --emerald-soft: rgba(16, 185, 129, 0.2);
      --rose: #F43F5E;
      --rose-soft: rgba(244, 63, 94, 0.22);
    }
    [data-theme="light"] {
      --stage-bg: #F1F5F9;
      --hud-bg: rgba(255, 255, 255, 0.95);
      --hud-card: #FFFFFF;
      --hud-border: #CBD5E1;
      --text-main: #0F172A;
      --text-sub: #475569;
      --btn-bg: #E2E8F0;
      --btn-hover: #CBD5E1;
      --cyan: #0284C7;
      --cyan-soft: #E0F2FE;
      --amber: #B45309;
      --amber-soft: #FEF3C7;
      --emerald: #047857;
      --emerald-soft: #D1FAE5;
      --rose: #BE123C;
      --rose-soft: #FFE4E6;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html, body {
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      background: var(--stage-bg);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
      user-select: none;
    }

    /* Viewport & Rotation Container */
    #viewport-root {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--stage-bg);
      overflow: hidden;
    }
    #stage-rotator {
      width: 100%;
      height: 100%;
      display: flex;
      flex-shrink: 0;
      position: relative;
      transition: transform 0.2s ease;
      background: #000;
    }

    /* Stream Layout Modes */
    .layout-single #pane-secondary { display: none !important; }
    .layout-single #pane-primary { width: 100%; height: 100%; }

    .layout-side-70-30 { flex-direction: row; }
    .layout-side-70-30 #pane-primary { width: 70%; height: 100%; border-right: 2px solid #1E293B; }
    .layout-side-70-30 #pane-secondary { width: 30%; height: 100%; display: flex; }

    .layout-side-50-50 { flex-direction: row; }
    .layout-side-50-50 #pane-primary { width: 50%; height: 100%; border-right: 2px solid #1E293B; }
    .layout-side-50-50 #pane-secondary { width: 50%; height: 100%; display: flex; }

    .layout-top-bottom { flex-direction: column; }
    .layout-top-bottom #pane-primary { width: 100%; height: 65%; border-bottom: 2px solid #1E293B; }
    .layout-top-bottom #pane-secondary { width: 100%; height: 35%; display: flex; }

    /* Auto-stack side-by-side splits on narrow portrait phones so timer/slides never squish */
    @media (max-width: 560px) and (orientation: portrait) {
      .layout-side-70-30, .layout-side-50-50 { flex-direction: column; }
      .layout-side-70-30 #pane-primary { width: 100%; height: 64%; border-right: none; border-bottom: 2px solid #1E293B; }
      .layout-side-70-30 #pane-secondary { width: 100%; height: 36%; }
      .layout-side-50-50 #pane-primary { width: 100%; height: 50%; border-right: none; border-bottom: 2px solid #1E293B; }
      .layout-side-50-50 #pane-secondary { width: 100%; height: 50%; }
    }

    .layout-pip #pane-primary { width: 100%; height: 100%; }
    .layout-pip #pane-secondary {
      position: absolute;
      width: clamp(160px, 32%, 420px);
      aspect-ratio: 16 / 9;
      border: 2px solid var(--cyan);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 12px 32px rgba(0,0,0,0.85);
      z-index: 15;
      background: #000;
      display: flex;
      cursor: pointer;
    }
    .pip-br #pane-secondary { bottom: max(16px, env(safe-area-inset-bottom)); right: max(16px, env(safe-area-inset-right)); }
    .pip-bl #pane-secondary { bottom: max(16px, env(safe-area-inset-bottom)); left: max(16px, env(safe-area-inset-left)); }
    .pip-tr #pane-secondary { top: max(16px, env(safe-area-inset-top)); right: max(16px, env(safe-area-inset-right)); }
    .pip-tl #pane-secondary { top: max(16px, env(safe-area-inset-top)); left: max(16px, env(safe-area-inset-left)); }

    .stream-pane {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      overflow: hidden;
    }
    .stream-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: none;
    }
    .fit-cover .stream-img { object-fit: cover; }

    /* Stage Brightness Dimmer Veil */
    #dimmer-veil {
      position: fixed;
      inset: 0;
      background: #000;
      opacity: 0;
      pointer-events: none;
      z-index: 20;
      transition: opacity 0.2s ease;
    }

    /* Blackout Curtain */
    #blackout-curtain {
      position: fixed;
      inset: 0;
      background: #000000;
      z-index: 25;
      display: none;
    }

    /* Flash Identify Overlay */
    #flash-overlay {
      position: fixed;
      inset: 0;
      z-index: 45;
      background: linear-gradient(135deg, #06B6D4, #1D4ED8);
      color: #FFFFFF;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      animation: flashPulse 0.6s infinite alternate;
    }
    @keyframes flashPulse { from { filter: brightness(1); } to { filter: brightness(1.2); } }

    /* FOH Stage Whisper Banner */
    #whisper-banner {
      position: fixed;
      top: max(14px, env(safe-area-inset-top));
      left: 50%;
      transform: translateX(-50%);
      width: min(92vw, 760px);
      z-index: 40;
      border-radius: 16px;
      padding: 14px 18px;
      display: none;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
      -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
    }
    .whisper-INFO { background: rgba(8, 51, 68, 0.96); border: 2px solid #22D3EE; color: #ECFEFF; }
    .whisper-WARN { background: rgba(69, 26, 3, 0.96); border: 2px solid #FBBF24; color: #FEF3C7; }
    .whisper-CRITICAL { background: rgba(76, 5, 25, 0.96); border: 2px solid #FB7185; color: #FFE4E6; animation: critPulse 0.8s infinite alternate; }
    @keyframes critPulse { from { transform: translateX(-50%) scale(1); } to { transform: translateX(-50%) scale(1.02); } }
    #whisper-text { font-size: clamp(16px, 2.8vw, 26px); font-weight: 800; line-height: 1.3; flex: 1; }
    #whisper-ack {
      min-height: 44px;
      padding: 0 14px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.35);
      background: rgba(0,0,0,0.3);
      color: #FFF;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      flex-shrink: 0;
    }

    /* Standby / Minimized Notice */
    #standby-card {
      position: absolute;
      z-index: 12;
      max-width: min(90vw, 440px);
      background: var(--hud-card);
      border: 1px solid var(--hud-border);
      border-radius: 18px;
      padding: 22px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.4px;
      background: var(--cyan-soft);
      color: var(--cyan);
      margin-bottom: 10px;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

    /* Subtle Always-Reachable Corner Trigger When HUD Is Auto-Hidden */
    #hud-trigger-pill {
      position: fixed;
      right: max(12px, env(safe-area-inset-right));
      bottom: max(12px, env(safe-area-inset-bottom));
      z-index: 32;
      min-height: 44px;
      padding: 0 16px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(148, 163, 184, 0.3);
      color: #E2E8F0;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      opacity: 0.35;
      transition: opacity 0.2s ease, transform 0.15s ease;
      display: none;
      align-items: center;
      gap: 6px;
      -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
    }
    #hud-trigger-pill:hover, #hud-trigger-pill:active { opacity: 1; }

    /* Top Status Strip & Bottom Ergonomic Control Dock */
    #hud-top {
      position: fixed;
      top: 0; left: 0; right: 0;
      padding: max(10px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) 10px max(14px, env(safe-area-inset-left));
      background: var(--hud-bg);
      border-bottom: 1px solid var(--hud-border);
      z-index: 35;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
      transition: transform 0.22s ease, opacity 0.22s ease;
    }
    #hud-bottom {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      padding: 10px max(14px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
      background: var(--hud-bg);
      border-top: 1px solid var(--hud-border);
      z-index: 35;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 8px;
      -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
      transition: transform 0.22s ease, opacity 0.22s ease;
    }
    .hud-hidden #hud-top { transform: translateY(-110%); opacity: 0; pointer-events: none; }
    .hud-hidden #hud-bottom { transform: translateY(110%); opacity: 0; pointer-events: none; }
    .hud-hidden #hud-trigger-pill { display: inline-flex; }

    .ctrl-btn {
      min-height: 44px;
      padding: 0 13px;
      border-radius: 11px;
      border: 1px solid var(--hud-border);
      background: var(--btn-bg);
      color: var(--text-main);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
      transition: background 0.15s, border-color 0.15s;
    }
    .ctrl-btn:hover { background: var(--btn-hover); }
    .ctrl-btn:active { transform: scale(0.97); }
    .ctrl-btn.primary {
      background: var(--cyan-soft);
      color: var(--cyan);
      border-color: var(--cyan);
    }
    .ctrl-btn.active-ok {
      background: var(--emerald-soft);
      color: var(--emerald);
      border-color: var(--emerald);
    }

    /* PIN Authentication Gate Modal */
    #pin-gate {
      position: fixed;
      inset: 0;
      z-index: 60;
      background: var(--stage-bg);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .pin-card {
      width: min(92vw, 380px);
      background: var(--hud-card);
      border: 1px solid var(--hud-border);
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0,0,0,0.55);
    }
    .pin-input {
      width: 100%;
      min-height: 50px;
      margin: 16px 0 12px;
      border-radius: 12px;
      border: 2px solid var(--hud-border);
      background: var(--btn-bg);
      color: var(--text-main);
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 3px;
      text-align: center;
      outline: none;
    }
    .pin-input:focus { border-color: var(--cyan); }

    /* Minimized Source Warning Badge */
    #min-banner {
      position: fixed;
      bottom: 74px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 30;
      background: rgba(69, 26, 3, 0.94);
      border: 1px solid #F59E0B;
      color: #FDE68A;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      display: none;
      align-items: center;
      gap: 8px;
    }
  </style>
</head>
<body>
  <div id="viewport-root" onclick="handleCanvasTap(event)">
    <div id="stage-rotator" class="layout-single">
      <div id="pane-primary" class="stream-pane">
        <img id="img-primary" class="stream-img" alt="Stage Stream" />
      </div>
    </div>

    <div id="standby-card">
      <div id="conn-pill" class="status-pill"><span class="dot"></span><span id="conn-label">CONNECTING STAGELINK...</span></div>
      <h2 id="standby-title" style="font-size:18px;font-weight:800;margin-bottom:6px;">Preparing Stage Receiver</h2>
      <p id="standby-sub" style="font-size:13px;color:var(--text-sub);line-height:1.45;">Waiting for live video frames from Xteon FOH Workstation.</p>
    </div>
  </div>

  <!-- Mandatory User Gesture Stay-Awake Splash Screen -->
  <div id="stayawake-splash" onclick="dismissStayAwakeSplash(event)" style="position:fixed;inset:0;z-index:9999;background:rgba(7,9,14,0.96);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer;">
    <div style="width:min(92vw,400px);background:#121726;border:2px solid #06B6D4;border-radius:24px;padding:28px 24px;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.8),0 0 32px rgba(6,182,212,0.25);display:flex;flex-direction:column;align-items:center;gap:14px;">
      <div style="width:58px;height:58px;border-radius:18px;background:rgba(6,182,212,0.15);border:1.5px solid #06B6D4;display:flex;align-items:center;justify-content:center;font-size:28px;">📱</div>
      <div style="font-size:18px;font-weight:900;color:#F8FAFC;letter-spacing:0.5px;">LOCK STAGE DISPLAY</div>
      <div style="font-size:12px;color:#94A3B8;line-height:1.5;">Tap anywhere to enter Fullscreen and lock the screen awake. This prevents iPads, tablets, and phones from going dim during the service or event.</div>
      <button style="width:100%;min-height:50px;border-radius:14px;background:linear-gradient(135deg,#06B6D4,#2563EB);border:none;color:#000;font-size:14px;font-weight:900;letter-spacing:0.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 8px 24px rgba(6,182,212,0.4);">
        ⚡ TAP TO ACTIVATE STAY-AWAKE
      </button>
      <div style="font-size:10px;font-family:ui-monospace,monospace;color:#64748B;">WORKS ON ALL MOBILE & DESKTOP BROWSERS OVER LOCAL WI-FI</div>
    </div>
  </div>

  <canvas id="heartbeat-canvas" width="2" height="2" style="position:fixed;top:-10px;left:-10px;opacity:0.01;pointer-events:none;"></canvas>
  <video id="nosleep-video" playsinline webkit-playsinline loop muted style="position:fixed;width:1px;height:1px;opacity:0.001;pointer-events:none;z-index:-10;"></video>
  <div id="dimmer-veil"></div>
  <div id="blackout-curtain" onclick="handleCanvasTap(event)"></div>

  <div id="flash-overlay">
    <div style="font-size:14px;font-weight:800;letter-spacing:2px;opacity:0.9;">⚡ XTEON STAGELINK IDENTIFIER</div>
    <div id="flash-slot-title" style="font-size:clamp(28px,6vw,54px);font-weight:900;margin:10px 0;">STAGE MONITOR</div>
    <div id="flash-slot-zone" style="font-size:16px;font-weight:700;opacity:0.9;">📍 Stage Area</div>
  </div>

  <div id="whisper-banner" class="whisper-INFO">
    <div id="whisper-text"></div>
    <button id="whisper-ack" onclick="ackWhisper(event)">✓ Got It</button>
  </div>

  <div id="min-banner">
    <span>⚠️ Source window minimized at FOH — Holding last clean frame</span>
  </div>

  <!-- Top HUD Header -->
  <header id="hud-top" onclick="event.stopPropagation()">
    <div style="display:flex;align-items:center;gap:10px;min-width:0;">
      <div style="width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#06B6D4,#2563EB);color:#000;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">XT</div>
      <div style="min-width:0;">
        <div id="slot-title-bar" style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">StageLink Slot</div>
        <div id="slot-meta-bar" style="font-size:11px;color:var(--text-sub);">Connecting...</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <div id="stayawake-indicator" style="font-size:10px;font-family:ui-monospace,monospace;font-weight:bold;color:#10B981;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);padding:3px 8px;border-radius:999px;display:none;align-items:center;gap:5px;">
        <span style="width:6px;height:6px;border-radius:50%;background:#10B981;"></span>
        <span>AWAKE LOCKED</span>
      </div>
      <button class="ctrl-btn" onclick="toggleTheme()" id="btn-theme" title="Toggle Light / Dark Mode">🌙 Dark</button>
      <button class="ctrl-btn" onclick="goDirector()" title="Switch to FOH Walk-the-Room Controller">🎛️ FOH Remote</button>
    </div>
  </header>

  <!-- Bottom Ergonomic Control Dock -->
  <nav id="hud-bottom" onclick="event.stopPropagation()">
    <button class="ctrl-btn primary" id="btn-stage-lock" onclick="engageStageMode()">⛶ Fullscreen + Keep Awake</button>
    <button class="ctrl-btn" id="btn-fit" onclick="toggleFitMode()">📐 Fit: Contain</button>
    <button class="ctrl-btn" id="btn-rotate" onclick="cycleRotation()">↻ Rotate: 0°</button>
    <button class="ctrl-btn" id="btn-dimmer" onclick="cycleDimmer()">🔆 Dimmer: 100%</button>
    <button class="ctrl-btn" onclick="hideHudNow()">✕ Hide Bar</button>
  </nav>

  <!-- Persistent Corner Pill When Auto-Hidden -->
  <button id="hud-trigger-pill" onclick="showHud(event)">⚙️ Controls</button>

  <!-- FOH PIN Gate -->
  <div id="pin-gate">
    <div class="pin-card">
      <div style="width:44px;height:44px;margin:0 auto 12px;border-radius:12px;background:var(--cyan-soft);color:var(--cyan);display:flex;align-items:center;justify-content:center;font-weight:900;">🔒</div>
      <h2 style="font-size:18px;font-weight:800;">Xteon FOH Stage Security</h2>
      <p style="font-size:12px;color:var(--text-sub);margin-top:6px;">Scan the QR code in Xteon for instant access, or enter the FOH Companion PIN:</p>
      <input id="pin-field" class="pin-input" type="text" inputmode="numeric" placeholder="000-000" autocomplete="off" onkeydown="if(event.key==='Enter')submitPin()" />
      <div id="pin-err" style="color:var(--rose);font-size:12px;font-weight:700;min-height:18px;margin-bottom:8px;"></div>
      <button class="ctrl-btn primary" style="width:100%;min-height:48px;font-size:14px;" onclick="submitPin()">Unlock Stage Monitor</button>
    </div>
  </div>

  <script>
    const SLOT_ID = "__SLOT_ID__";
    const params = new URLSearchParams(window.location.search);
    let authKey = params.get('key') || localStorage.getItem('xteon_auth_key') || '';
    if (params.get('key')) {
      try { localStorage.setItem('xteon_auth_key', authKey); } catch (e) {}
    }

    let clientCid = params.get('cid') || '';
    try {
      if (!clientCid) clientCid = localStorage.getItem('xteon_stage_cid') || '';
      if (!clientCid) {
        clientCid = 'dev-' + Math.random().toString(36).substring(2, 9);
      }
      localStorage.setItem('xteon_stage_cid', clientCid);
    } catch (e) {}

    let ws = null;
    let reconnectTimer = null;
    let hudTimer = null;
    let wakeLockObj = null;
    let keepAwakeAudioCtx = null;
    let keepAwakeActive = false;
    let rotationDeg = 0;
    let fitCover = false;
    let dimmerIdx = 0;
    const dimmerLevels = [0, 0.30, 0.60];
    const dimmerLabels = ['100%', '70%', '40%'];
    let pipCornerIdx = 0;
    const pipCorners = ['pip-br', 'pip-bl', 'pip-tl', 'pip-tr'];
    let prevUrlA = null;
    let prevUrlB = null;
    let hasFrame = false;

    // Restore saved theme
    (function initTheme() {
      const saved = localStorage.getItem('xteon_web_theme') || 'dark';
      applyTheme(saved);
    })();

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('xteon_web_theme', theme); } catch (e) {}
      const btn = document.getElementById('btn-theme');
      if (btn) btn.textContent = theme === 'light' ? '☀️ Light' : '🌙 Dark';
    }

    function toggleTheme() {
      const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(cur);
      scheduleHudAutoHide();
    }

    function goDirector() {
      const q = authKey ? ('?key=' + encodeURIComponent(authKey)) : '';
      window.location.href = '/' + q;
    }

    function showHud(ev) {
      if (ev) ev.stopPropagation();
      document.body.classList.remove('hud-hidden');
      scheduleHudAutoHide();
    }

    function hideHudNow() {
      document.body.classList.add('hud-hidden');
      if (hudTimer) clearTimeout(hudTimer);
    }

    function handleCanvasTap() {
      if (document.body.classList.contains('hud-hidden')) {
        showHud();
      } else if (hasFrame) {
        hideHudNow();
      }
    }

    function scheduleHudAutoHide() {
      if (hudTimer) clearTimeout(hudTimer);
      if (!hasFrame) return;
      hudTimer = setTimeout(() => {
        document.body.classList.add('hud-hidden');
      }, 4500);
    }

    async function requestWakeLockSafe() {
      // 1. W3C Screen Wake Lock (Secure HTTPS / Localhost)
      try {
        if ('wakeLock' in navigator && (!wakeLockObj || wakeLockObj.released)) {
          wakeLockObj = await navigator.wakeLock.request('screen');
          wakeLockObj.addEventListener('release', () => {
            wakeLockObj = null;
          });
        }
      } catch (e) {}

      // 2. Universal Inline Video NoSleep Engine (Works on ALL mobile browsers including iOS Safari & Android Chrome over HTTP)
      try {
        const vid = document.getElementById('nosleep-video');
        if (vid) {
          vid.setAttribute('playsinline', '');
          vid.setAttribute('webkit-playsinline', '');
          vid.muted = true;
          vid.loop = true;
          if (!vid.src && !vid.srcObject) {
            // Valid minimal looping MP4 video data URI (250 bytes)
            vid.src = 'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAsVmdatAAACrgYF//+13wEB42dpdAAAACltZGF0AGBAbm9zbGVlcAAAAAAAAAAAAAAAEAAAAAAABAAAAAAACv//AAAAFnVoZHIBAAEAAAABAAABAAIAAAAAAAAVc3RzYwAAAAAAAAABAAAAAQAAAAEAAAAUc3RzenAAAAAAAAAEAAAABAAAABRzdGNvAAAAAAAAAAEAAAA4AAAAY3N0dHMAAAAAAAAAAQAAAAEAAAAU';
          }
          const p = vid.play();
          if (p && p.catch) p.catch(() => {});
        }
      } catch (e) {}

      // 3. Silent WebAudio oscillator fallback
      try {
        if (!keepAwakeAudioCtx) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (Ctx) {
            keepAwakeAudioCtx = new Ctx();
            const osc = keepAwakeAudioCtx.createOscillator();
            const gain = keepAwakeAudioCtx.createGain();
            gain.gain.value = 0.00001;
            osc.connect(gain);
            gain.connect(keepAwakeAudioCtx.destination);
            osc.start();
          }
        } else if (keepAwakeAudioCtx.state === 'suspended') {
          await keepAwakeAudioCtx.resume();
        }
      } catch (e) {}
    }

    // Auto-engage keep-awake on ANY touch, click, scroll or keypress across window
    ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach(evt => {
      window.addEventListener(evt, () => {
        requestWakeLockSafe();
      }, { passive: true });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        requestWakeLockSafe();
      }
    });

    // Auto-engage immediately on script initialization
    requestWakeLockSafe();

    let heartbeatTimer = null;
    function startSurfaceHeartbeat() {
      if (heartbeatTimer) return;
      const cvs = document.getElementById('heartbeat-canvas');
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      let flip = false;
      heartbeatTimer = setInterval(() => {
        if (ctx) {
          ctx.fillStyle = flip ? '#000000' : '#010101';
          ctx.fillRect(0, 0, 2, 2);
          flip = !flip;
        }
      }, 1000);
    }

    async function dismissStayAwakeSplash(ev) {
      if (ev) ev.stopPropagation();
      const splash = document.getElementById('stayawake-splash');
      if (splash) splash.style.display = 'none';

      try {
        const el = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          if (el.requestFullscreen) await el.requestFullscreen();
          else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        }
      } catch (err) {}

      await requestWakeLockSafe();
      startSurfaceHeartbeat();

      const ind = document.getElementById('stayawake-indicator');
      if (ind) ind.style.display = 'flex';
      const btn = document.getElementById('btn-stage-lock');
      if (btn) {
        btn.classList.add('active-ok');
        btn.textContent = '🟢 Stage Awake Active';
      }
    }

    async function engageStageMode() {
      await requestWakeLockSafe();
      startSurfaceHeartbeat();
      const btn = document.getElementById('btn-stage-lock');
      try {
        const el = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          if (el.requestFullscreen) await el.requestFullscreen();
          else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        } else {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
      } catch (e) {}
      btn.classList.add('active-ok');
      btn.textContent = '🟢 Stage Awake Active';
      const ind = document.getElementById('stayawake-indicator');
      if (ind) ind.style.display = 'flex';
      scheduleHudAutoHide();
    }

    function toggleFitMode() {
      fitCover = !fitCover;
      const rot = document.getElementById('stage-rotator');
      rot.classList.toggle('fit-cover', fitCover);
      document.getElementById('btn-fit').textContent = fitCover ? '📐 Fit: Fill' : '📐 Fit: Contain';
      scheduleHudAutoHide();
    }

    function applyRotationGeometry() {
      const rot = document.getElementById('stage-rotator');
      if (rotationDeg === 90 || rotationDeg === 270) {
        rot.style.width = window.innerHeight + 'px';
        rot.style.height = window.innerWidth + 'px';
      } else {
        rot.style.width = '100%';
        rot.style.height = '100%';
      }
      rot.style.transform = 'rotate(' + rotationDeg + 'deg)';
      const wb = document.getElementById('whisper-banner');
      if (wb) {
        wb.style.transform = rotationDeg === 180 ? 'translateX(-50%) rotate(180deg)' : 'translateX(-50%)';
      }
    }

    function cycleRotation() {
      rotationDeg = (rotationDeg + 90) % 360;
      applyRotationGeometry();
      document.getElementById('btn-rotate').textContent = '↻ Rotate: ' + rotationDeg + '°';
      scheduleHudAutoHide();
    }
    window.addEventListener('resize', applyRotationGeometry);

    function cycleDimmer() {
      dimmerIdx = (dimmerIdx + 1) % dimmerLevels.length;
      document.getElementById('dimmer-veil').style.opacity = String(dimmerLevels[dimmerIdx]);
      document.getElementById('btn-dimmer').textContent = '🔆 Dimmer: ' + dimmerLabels[dimmerIdx];
      scheduleHudAutoHide();
    }

    function cyclePipCorner(ev) {
      ev.stopPropagation();
      const rot = document.getElementById('stage-rotator');
      if (!rot.classList.contains('layout-pip')) {
        handleCanvasTap();
        return;
      }
      rot.classList.remove(pipCorners[pipCornerIdx]);
      pipCornerIdx = (pipCornerIdx + 1) % pipCorners.length;
      rot.classList.add(pipCorners[pipCornerIdx]);
    }

    function ackWhisper(ev) {
      ev.stopPropagation();
      document.getElementById('whisper-banner').style.display = 'none';
      fetch('/api/stagelink/slots/' + encodeURIComponent(SLOT_ID) + '/whisper/clear?key=' + encodeURIComponent(authKey), { method: 'POST' }).catch(() => {});
    }

    function applySlotMetadata(slot) {
      if (!slot) return;
      document.getElementById('slot-title-bar').textContent = (slot.name || SLOT_ID) + ' • 📍 ' + (slot.stage_zone || 'Stage');
      document.getElementById('slot-meta-bar').textContent =
        (slot.is_frozen ? '❄️ FROZEN • ' : '') +
        (slot.primary_source_label || slot.source_mode);

      document.getElementById('flash-slot-title').textContent = slot.name || SLOT_ID;
      document.getElementById('flash-slot-zone').textContent = '📍 ' + (slot.stage_zone || 'Stage');
      document.getElementById('flash-overlay').style.display = slot.is_flashing ? 'flex' : 'none';
      document.getElementById('blackout-curtain').style.display = slot.is_blackout ? 'block' : 'none';
      document.getElementById('min-banner').style.display = slot.source_minimized ? 'inline-flex' : 'none';

      // Always 100% clean full-screen stage layout
      const rot = document.getElementById('stage-rotator');
      rot.classList.remove('layout-side-70-30', 'layout-side-50-50', 'layout-top-bottom', 'layout-pip');
      rot.classList.add('layout-single');

      // Whisper banner
      const wb = document.getElementById('whisper-banner');
      if (slot.active_whisper && slot.active_whisper.message) {
        wb.className = 'whisper-' + (slot.active_whisper.tone || 'INFO');
        document.getElementById('whisper-text').textContent = '💬 ' + slot.active_whisper.message;
        wb.style.display = 'flex';
      } else {
        wb.style.display = 'none';
      }

      if (!hasFrame) {
        document.getElementById('standby-card').style.display = 'block';
        if (!slot.primary_source_id) {
          document.getElementById('standby-title').textContent = 'Live Link Connected';
          document.getElementById('standby-sub').textContent = 'Preparing stage receiver. Waiting for live video frames from XTEON FOH Workstation.';
        } else if (slot.source_missing) {
          document.getElementById('standby-title').textContent = 'Source Window Closed or Unassigned';
          document.getElementById('standby-sub').textContent = 'Select an active window or screen for "' + slot.name + '" in Xteon FOH.';
        } else {
          document.getElementById('standby-title').textContent = 'Connecting Live Stream...';
          document.getElementById('standby-sub').textContent = 'Receiving stream from "' + (slot.primary_source_label || slot.name) + '"...';
        }
      }
    }

    function renderFrameBlob(channel, jpegSlice) {
      const blob = new Blob([jpegSlice], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      if (channel === 2) {
        const imgB = document.getElementById('img-secondary');
        const oldUrl = prevUrlB;
        prevUrlB = url;
        imgB.onload = () => { if (oldUrl) URL.revokeObjectURL(oldUrl); };
        imgB.onerror = () => { URL.revokeObjectURL(url); };
        imgB.style.display = 'block';
        imgB.src = url;
      } else {
        const imgA = document.getElementById('img-primary');
        const oldUrl = prevUrlA;
        prevUrlA = url;
        imgA.onload = () => { if (oldUrl) URL.revokeObjectURL(oldUrl); };
        imgA.onerror = () => { URL.revokeObjectURL(url); };
        imgA.style.display = 'block';
        imgA.src = url;
        if (!hasFrame) {
          hasFrame = true;
          document.getElementById('standby-card').style.display = 'none';
          scheduleHudAutoHide();
          requestWakeLockSafe();
        }
      }
    }

    async function checkAuthAndConnect() {
      try {
        const res = await fetch('/api/auth/check?key=' + encodeURIComponent(authKey));
        if (res.status === 401) {
          document.getElementById('pin-gate').style.display = 'flex';
          return;
        }
      } catch (e) {}
      document.getElementById('pin-gate').style.display = 'none';
      connectWebSocket();
    }

    async function submitPin() {
      const val = document.getElementById('pin-field').value.trim();
      const errEl = document.getElementById('pin-err');
      errEl.textContent = '';
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: val })
        });
        if (!res.ok) {
          errEl.textContent = 'Invalid PIN. Check Xteon Mobile QR modal.';
          return;
        }
        const data = await res.json();
        authKey = data.session_token || val;
        try { localStorage.setItem('xteon_auth_key', authKey); } catch (e) {}
        document.getElementById('pin-gate').style.display = 'none';
        connectWebSocket();
      } catch (e) {
        errEl.textContent = 'Network unreachable.';
      }
    }

    function connectWebSocket() {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = proto + '//' + window.location.host + '/ws/stage/' + encodeURIComponent(SLOT_ID) + '?key=' + encodeURIComponent(authKey) + '&cid=' + encodeURIComponent(clientCid);
      try {
        ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';
      } catch (e) {
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        const lbl = document.getElementById('conn-label');
        if (lbl) lbl.textContent = 'LIVE LINK CONNECTED';
        if (!hasFrame) {
          document.getElementById('standby-title').textContent = 'Live Link Connected';
          document.getElementById('standby-sub').textContent = 'Preparing stage receiver. Waiting for live video frames from XTEON FOH Workstation.';
        }
      };

      ws.onmessage = (ev) => {
        if (typeof ev.data === 'string') {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'slot_state') applySlotMetadata(msg.slot);
            else if (msg.type === 'slot_removed') {
              hasFrame = false;
              if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
              if (ws) { try { ws.close(); } catch(e){} ws = null; }
              document.getElementById('standby-card').style.display = 'block';
              document.getElementById('standby-title').textContent = 'Receiver Disconnected';
              document.getElementById('standby-sub').innerHTML = 'This stage receiver was removed by the FOH operator.<br><br><a href="/stage" style="display:inline-block;padding:8px 16px;background:var(--cyan);color:#000;border-radius:8px;font-weight:bold;text-decoration:none;">Connect Available Screen</a>';
            } else if (msg.type === 'slot_reset') {
              hasFrame = false;
              document.getElementById('standby-card').style.display = 'block';
              document.getElementById('standby-title').textContent = 'Live Link Connected';
              document.getElementById('standby-sub').textContent = 'Standby. Waiting for FOH operator to share application or screen.';
              scheduleReconnect();
            } else if (msg.type === 'unauthorized') {
              if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
              document.getElementById('pin-gate').style.display = 'flex';
            }
          } catch (e) {}
        } else if (ev.data instanceof ArrayBuffer && ev.data.byteLength > 2) {
          const bytes = new Uint8Array(ev.data);
          renderFrameBlob(bytes[0], bytes.subarray(1));
        }
      };

      ws.onclose = () => {
        // Hold last clean frame on screen (never flash browser error page!)
        const meta = document.getElementById('slot-meta-bar');
        if (meta) meta.textContent = 'Reconnecting to FOH...';
        scheduleReconnect();
      };

      ws.onerror = () => {
        try { ws.close(); } catch (e) {}
      };
    }

    function scheduleReconnect() {
      if (reconnectTimer) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectWebSocket();
      }, 900);
    }

    checkAuthAndConnect();
  </script>
</body>
</html>"##;

    template.replace("__SLOT_ID__", &safe_slot)
}

pub fn render_screen_tester_html() -> &'static str {
    r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>⚡ Xteon Screen Tester</title>
  <style>
    :root {
      --bg: #121214;
      --header-bg: rgba(22, 22, 26, 0.96);
      --card: #18181c;
      --card-border: #2a2a32;
      --subcard: #141417;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --gold: #d4b28c;
      --gold-bg: rgba(212, 178, 140, 0.12);
      --gold-border: rgba(212, 178, 140, 0.35);
      --amber: #f59e0b;
      --amber-bg: rgba(245, 158, 11, 0.15);
      --amber-border: rgba(245, 158, 11, 0.38);
      --emerald: #10b981;
      --emerald-bg: rgba(16, 185, 129, 0.15);
      --emerald-border: rgba(16, 185, 129, 0.35);
      --cyan: #38bdf8;
      --cyan-bg: rgba(56, 189, 248, 0.14);
      --cyan-border: rgba(56, 189, 248, 0.35);
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, sans-serif;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      background: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      min-height: 100dvh;
      padding: 0 0 calc(40px + env(safe-area-inset-bottom)) 0;
      display: flex;
      flex-direction: column;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--header-bg);
      border-bottom: 1px solid var(--card-border);
      padding: max(12px, env(safe-area-inset-top)) 16px 12px 16px;
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #f59e0b, #d4b28c);
      color: #0b0c0e;
      font-size: 18px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
    }
    .brand-title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: var(--text-main);
    }
    .brand-subtitle {
      font-size: 11px;
      color: var(--gold);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-weight: 600;
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 9px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      background: var(--emerald-bg);
      color: var(--emerald);
      border: 1px solid var(--emerald-border);
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--emerald);
      box-shadow: 0 0 8px var(--emerald);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .btn-refresh {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: var(--subcard);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-refresh:active {
      transform: rotate(180deg) scale(0.92);
      color: var(--gold);
    }
    .main-content {
      padding: 16px;
      max-width: 680px;
      margin: 0 auto;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .status-banner {
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--card);
      border: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 12px;
    }
    .status-text {
      color: var(--text-muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .status-count {
      color: var(--text-main);
      font-weight: 700;
    }
    .awake-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      color: var(--gold);
      background: var(--gold-bg);
      border: 1px solid var(--gold-border);
      padding: 2px 7px;
      border-radius: 6px;
    }
    .displays-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .display-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      transition: border-color 0.2s ease;
    }
    .display-card.flashing {
      border-color: var(--amber);
      box-shadow: 0 0 24px rgba(245, 158, 11, 0.4);
    }
    .display-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }
    .display-title-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .display-number-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .screen-badge {
      font-size: 11px;
      font-weight: 800;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      padding: 2px 7px;
      border-radius: 6px;
      background: var(--amber-bg);
      color: var(--amber);
      border: 1px solid var(--amber-border);
    }
    .primary-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
      background: var(--cyan-bg);
      color: var(--cyan);
      border: 1px solid var(--cyan-border);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .display-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main);
      word-break: break-word;
    }
    .display-specs {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      padding: 8px 12px;
      background: var(--subcard);
      border-radius: 8px;
      border: 1px solid var(--card-border);
    }
    .spec-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .btn-flash {
      width: 100%;
      min-height: 52px;
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.22), rgba(212, 178, 140, 0.14));
      border: 1.5px solid var(--amber);
      color: #fbbf24;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.2);
      transition: all 0.15s ease;
      touch-action: manipulation;
    }
    .btn-flash:active {
      transform: scale(0.97);
      background: rgba(245, 158, 11, 0.4);
      color: #fff;
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.6);
    }
    .btn-flash.flashing-btn {
      background: #f59e0b;
      color: #0b0c0e;
      border-color: #f59e0b;
      box-shadow: 0 0 28px rgba(245, 158, 11, 0.8);
    }
    .help-card {
      background: var(--subcard);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 14px;
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
      display: flex;
      gap: 10px;
    }
    .help-icon {
      color: var(--gold);
      font-size: 16px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #18181c;
      color: #f3f4f6;
      border: 1px solid var(--amber);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 16px rgba(245, 158, 11, 0.35);
      padding: 10px 18px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }
    .toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    .empty-state {
      padding: 32px 16px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
      background: var(--card);
      border: 1px dashed var(--card-border);
      border-radius: 16px;
    }
  </style>
</head>
<body>
  <!-- Hidden looping video to enforce mobile HTTP wake lock -->
  <video id="nosleep-video" playsinline webkit-playsinline muted loop style="position:fixed;width:1px;height:1px;top:-100px;left:-100px;opacity:0.01;pointer-events:none;">
    <source src="data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAsVmdatAAACrgYF//+13wEB42dpdAAAACltZGF0AGBAbm9zbGVlcAAAAAAAAAAAAAAAEAAAAAAABAAAAAAACv//AAAAFnVoZHIBAAEAAAABAAABAAIAAAAAAAAVc3RzYwAAAAAAAAABAAAAAQAAAAEAAAAUc3RzenAAAAAAAAAEAAAABAAAABRzdGNvAAAAAAAAAAEAAAA4AAAAY3N0dHMAAAAAAAAAAQAAAAEAAAAU" type="video/mp4">
  </video>

  <header class="topbar">
    <div class="brand">
      <div class="brand-icon">⚡</div>
      <div>
        <div class="brand-title">XTEON COMPANION</div>
        <div class="brand-subtitle">SCREEN TESTER</div>
      </div>
    </div>
    <div class="topbar-actions">
      <div class="live-badge">
        <span class="live-dot"></span>
        <span>CONNECTED</span>
      </div>
      <button id="btn-refresh" class="btn-refresh" title="Refresh Displays" onclick="loadDisplays(true)">↻</button>
    </div>
  </header>

  <main class="main-content">
    <div class="status-banner">
      <div class="status-text">
        <span>Detected: </span>
        <span id="displays-count" class="status-count">Scanning...</span>
      </div>
      <div class="awake-indicator">
        <span>📱 Keep-Awake Active</span>
      </div>
    </div>

    <div id="displays-list" class="displays-grid">
      <div class="empty-state">Scanning for connected displays...</div>
    </div>

    <div class="help-card">
      <div class="help-icon">💡</div>
      <div>
        <strong>Walk-the-Room Mode:</strong> Tap any <strong>Flash Screen</strong> button to verify cable routing, projector alignment, and display numbering across your venue.
      </div>
    </div>
  </main>

  <div id="toast" class="toast">
    <span style="color:#f59e0b;">⚡</span>
    <span id="toast-text">Flash command sent</span>
  </div>

  <script>
    let displaysCache = [];
    let wakeLock = null;
    let audioKeepAwake = null;

    // Triple-Redundant Keep-Awake Engine
    async function initStayAwake() {
      // 1. W3C Screen Wake Lock API
      try {
        if ('wakeLock' in navigator && (!wakeLock || wakeLock.released)) {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', () => { wakeLock = null; });
        }
      } catch (e) {}

      // 2. Looping inline MP4 video
      try {
        const vid = document.getElementById('nosleep-video');
        if (vid) {
          vid.setAttribute('playsinline', '');
          vid.setAttribute('webkit-playsinline', '');
          vid.muted = true;
          vid.loop = true;
          const p = vid.play();
          if (p && p.catch) p.catch(() => {});
        }
      } catch (e) {}

      // 3. WebAudio silent oscillator
      try {
        if (!audioKeepAwake) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (Ctx) {
            audioKeepAwake = new Ctx();
            const osc = audioKeepAwake.createOscillator();
            const gain = audioKeepAwake.createGain();
            gain.gain.value = 0.00001;
            osc.connect(gain);
            gain.connect(audioKeepAwake.destination);
            osc.start();
          }
        } else if (audioKeepAwake.state === 'suspended') {
          audioKeepAwake.resume().catch(() => {});
        }
      } catch (e) {}
    }

    ['click', 'touchstart', 'visibilitychange'].forEach(evt => {
      document.addEventListener(evt, () => {
        if (evt === 'visibilitychange' && document.visibilityState !== 'visible') return;
        initStayAwake();
      }, { passive: true });
    });
    initStayAwake();

    function showToast(msg) {
      const t = document.getElementById('toast');
      const txt = document.getElementById('toast-text');
      txt.innerText = msg;
      t.classList.add('show');
      setTimeout(() => {
        t.classList.remove('show');
      }, 2200);
    }

    async function flashDisplay(id, osIndex, name) {
      if (navigator.vibrate) {
        try { navigator.vibrate([60, 40, 60]); } catch (e) {}
      }
      const card = document.getElementById('card-' + id);
      const btn = document.getElementById('btn-flash-' + id);
      if (card) card.classList.add('flashing');
      if (btn) {
        btn.classList.add('flashing-btn');
        btn.innerText = '⚡ FLASHING...';
      }
      showToast('⚡ Flashing Screen ' + osIndex + ' (' + name + ')');

      try {
        await fetch('/api/flash/' + encodeURIComponent(id), { method: 'POST' });
      } catch (e) {
        console.error('Flash failed', e);
      }

      setTimeout(() => {
        if (card) card.classList.remove('flashing');
        if (btn) {
          btn.classList.remove('flashing-btn');
          btn.innerText = '⚡ Flash Screen (' + osIndex + ')';
        }
      }, 1400);
    }

    async function loadDisplays(manual = false) {
      const refreshBtn = document.getElementById('btn-refresh');
      if (manual && refreshBtn) refreshBtn.style.transform = 'rotate(360deg)';

      try {
        const res = await fetch('/api/displays');
        if (!res.ok) throw new Error('Status ' + res.status);
        const displays = await res.json();
        displaysCache = displays;

        const countEl = document.getElementById('displays-count');
        if (countEl) {
          countEl.innerText = displays.length + ' Physical Display' + (displays.length === 1 ? '' : 's');
        }

        const container = document.getElementById('displays-list');
        if (!container) return;

        if (!displays || displays.length === 0) {
          container.innerHTML = '<div class="empty-state">No active display outputs detected.<br><span style="font-size:11px;color:#9ca3af;margin-top:6px;display:inline-block;">Connect an HDMI, DisplayPort, or virtual display on the PC to test.</span></div>';
          return;
        }

        container.innerHTML = displays.map(d => {
          const isPrimary = d.is_primary || d.os_index === 1;
          const alias = d.custom_alias || d.name || ('Display ' + d.os_index);
          const port = d.port_type || (isPrimary ? 'Internal / Primary' : 'External Video Out');
          const resText = (d.width && d.height) ? (d.width + ' × ' + d.height) : 'Unknown Resolution';
          const hzText = d.refresh_rate_hz ? (' @ ' + d.refresh_rate_hz + 'Hz') : '';
          const boundsText = d.bounds ? ('pos: ' + d.bounds.x + ', ' + d.bounds.y) : '';

          return `
            <div id="card-${d.id}" class="display-card">
              <div class="display-header">
                <div class="display-title-group">
                  <div class="display-number-row">
                    <span class="screen-badge">SCREEN ${d.os_index}</span>
                    ${isPrimary ? '<span class="primary-badge">PRIMARY</span>' : ''}
                  </div>
                  <div class="display-name">${alias}</div>
                </div>
              </div>

              <div class="display-specs">
                <div class="spec-item">📐 <strong>${resText}${hzText}</strong></div>
                <div class="spec-item">🔌 <span>${port}</span></div>
                ${boundsText ? '<div class="spec-item">📍 <span>' + boundsText + '</span></div>' : ''}
              </div>

              <button
                id="btn-flash-${d.id}"
                class="btn-flash"
                onclick="flashDisplay('${d.id}', ${d.os_index}, '${alias.replace(/'/g, "\\'")}')"
              >
                ⚡ Flash Screen (${d.os_index})
              </button>
            </div>
          `;
        }).join('');
      } catch (err) {
        console.error('Error fetching displays', err);
      } finally {
        if (manual && refreshBtn) {
          setTimeout(() => { refreshBtn.style.transform = 'none'; }, 400);
        }
      }
    }

    loadDisplays();
    setInterval(() => loadDisplays(false), 3000);
  </script>
</body>
</html>"##
}

pub fn render_companion_director_html() -> &'static str {
    r##"<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Xteon Mobile & StageLink Director</title>
  <style>
    :root, [data-theme="dark"] {
      --bg: #07090E;
      --header-bg: rgba(14, 17, 26, 0.94);
      --card: #121622;
      --subcard: #0A0D14;
      --border: #232B3E;
      --text: #F8FAFC;
      --muted: #94A3B8;
      --cyan: #06B6D4;
      --cyan-bg: rgba(6, 182, 212, 0.15);
      --cyan-border: rgba(6, 182, 212, 0.4);
      --amber: #F59E0B;
      --amber-bg: rgba(245, 158, 11, 0.15);
      --amber-border: rgba(245, 158, 11, 0.4);
      --emerald: #10B981;
      --emerald-bg: rgba(16, 185, 129, 0.15);
      --emerald-border: rgba(16, 185, 129, 0.4);
      --rose: #F43F5E;
      --rose-bg: rgba(244, 63, 94, 0.15);
      --rose-border: rgba(244, 63, 94, 0.4);
    }
    [data-theme="light"] {
      --bg: #F8FAFC;
      --header-bg: rgba(255, 255, 255, 0.95);
      --card: #FFFFFF;
      --subcard: #F1F5F9;
      --border: #CBD5E1;
      --text: #0F172A;
      --muted: #475569;
      --cyan: #0284C7;
      --cyan-bg: #E0F2FE;
      --cyan-border: #0284C7;
      --amber: #B45309;
      --amber-bg: #FEF3C7;
      --amber-border: #D97706;
      --emerald: #047857;
      --emerald-bg: #D1FAE5;
      --emerald-border: #059669;
      --rose: #BE123C;
      --rose-bg: #FFE4E6;
      --rose-border: #E11D48;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
    body {
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      min-height: 100dvh;
      padding-bottom: calc(80px + env(safe-area-inset-bottom));
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 30;
      background: var(--header-bg);
      border-bottom: 1px solid var(--border);
      padding: max(12px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 12px max(16px, env(safe-area-inset-left));
      -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
    }
    .topbar-inner {
      max-width: 1180px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .logo { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg, #06B6D4, #2563EB); color: #000; font-weight: 900; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .title { font-weight: 800; font-size: 15px; }
    .subtitle { font-size: 11px; color: var(--muted); }

    .container {
      max-width: 1180px;
      margin: 0 auto;
      padding: 16px max(14px, env(safe-area-inset-right)) 24px max(14px, env(safe-area-inset-left));
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }
    @media (min-width: 700px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 9px;
      border-radius: 7px;
      border: 1px solid transparent;
    }
    .b-cyan { background: var(--cyan-bg); color: var(--cyan); border-color: var(--cyan-border); }
    .b-amber { background: var(--amber-bg); color: var(--amber); border-color: var(--amber-border); }
    .b-emerald { background: var(--emerald-bg); color: var(--emerald); border-color: var(--emerald-border); }
    .b-rose { background: var(--rose-bg); color: var(--rose); border-color: var(--rose-border); }

    .btn {
      min-height: 44px;
      padding: 0 14px;
      border-radius: 11px;
      border: 1px solid var(--border);
      background: var(--subcard);
      color: var(--text);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s;
      text-decoration: none;
    }
    .btn:active { transform: scale(0.98); }
    .btn-cyan { background: var(--cyan-bg); color: var(--cyan); border-color: var(--cyan-border); }
    .btn-amber { background: var(--amber-bg); color: var(--amber); border-color: var(--amber-border); }
    .btn-emerald { background: var(--emerald-bg); color: var(--emerald); border-color: var(--emerald-border); }
    .btn-rose { background: var(--rose-bg); color: var(--rose); border-color: var(--rose-border); }

    .btn-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .btn-row > .btn { flex: 1 1 auto; }

    .spec-box {
      font-size: 12px;
      color: var(--muted);
      background: var(--subcard);
      border: 1px solid var(--border);
      padding: 8px 11px;
      border-radius: 10px;
    }

    .input {
      width: 100%;
      min-height: 44px;
      padding: 0 12px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--subcard);
      color: var(--text);
      font-size: 16px;
      outline: none;
    }
    .input:focus { border-color: var(--cyan); }

    /* Thumb-Friendly Sticky Bottom Navigation Bar */
    .bottom-nav {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 35;
      background: var(--header-bg);
      border-top: 1px solid var(--border);
      padding: 8px max(12px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
      -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
    }
    .bottom-nav-inner {
      max-width: 680px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .tab-btn {
      min-height: 46px;
      border-radius: 11px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .tab-btn.active {
      background: var(--cyan-bg);
      color: var(--cyan);
      border-color: var(--cyan-border);
    }

    /* Modal Sheet for Routing / Slot Creation */
    .sheet-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(0, 0, 0, 0.72);
      display: none;
      align-items: flex-end;
      justify-content: center;
      padding: 12px;
    }
    @media (min-width: 640px) {
      .sheet-backdrop { align-items: center; }
    }
    .sheet {
      width: min(100%, 500px);
      max-height: 86dvh;
      overflow-y: auto;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    #pin-gate {
      position: fixed;
      inset: 0;
      z-index: 60;
      background: var(--bg);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .toast {
      position: fixed;
      bottom: calc(76px + env(safe-area-inset-bottom));
      left: 50%;
      transform: translateX(-50%);
      background: var(--cyan);
      color: #FFF;
      padding: 10px 18px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 12px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
      z-index: 55;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <div class="logo">XT</div>
        <div>
          <div class="title">XTEON DIRECTOR</div>
          <div class="subtitle" id="conn-sub">Live FOH Companion & StageLink</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="btn" onclick="toggleTheme()" id="btn-theme" style="min-height:38px;padding:0 11px;">🌙 Dark</button>
      </div>
    </div>
  </header>

  <main class="container">
    <!-- Toolbar for current tab -->
    <div id="tab-header" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;"></div>
    <div id="main-grid" class="grid"></div>
  </main>

  <nav class="bottom-nav">
    <div class="bottom-nav-inner">
      <button class="tab-btn active" id="tab-stagelink" onclick="switchTab('STAGELINK')">📡 StageLink</button>
      <button class="tab-btn" id="tab-displays" onclick="switchTab('DISPLAYS')">🖥️ Displays</button>
      <button class="tab-btn" id="tab-windows" onclick="switchTab('WINDOWS')">🪟 Windows</button>
    </div>
  </nav>

  <!-- Create Wireless Slot Modal Sheet -->
  <div id="slot-sheet" class="sheet-backdrop" onclick="if(event.target===this)closeSlotSheet()">
    <div class="sheet">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3 style="font-size:16px;font-weight:800;">+ New Wireless Stage Monitor</h3>
        <button class="btn" style="min-height:36px;padding:0 10px;" onclick="closeSlotSheet()">✕</button>
      </div>
      <label style="font-size:12px;font-weight:700;color:var(--muted);">Monitor Name</label>
      <input id="new-slot-name" class="input" value="Pulpit Confidence Monitor" />
      <label style="font-size:12px;font-weight:700;color:var(--muted);">Stage Zone</label>
      <input id="new-slot-zone" class="input" value="Pulpit / Altar" />
      <label style="font-size:12px;font-weight:700;color:var(--muted);">Source Window or Screen</label>
      <select id="new-slot-src" class="input"></select>
      <div class="btn-row" style="margin-top:6px;">
        <button class="btn" onclick="closeSlotSheet()">Cancel</button>
        <button class="btn btn-cyan" onclick="createSlotAndOpen(false)">Create Slot</button>
        <button class="btn btn-emerald" onclick="createSlotAndOpen(true)">▶️ Create & Open Here</button>
      </div>
    </div>
  </div>

  <!-- Route Window Modal Sheet -->
  <div id="route-sheet" class="sheet-backdrop" onclick="if(event.target===this)closeRouteSheet()">
    <div class="sheet">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3 id="route-sheet-title" style="font-size:16px;font-weight:800;">Route Window to Screen</h3>
        <button class="btn" style="min-height:36px;padding:0 10px;" onclick="closeRouteSheet()">✕</button>
      </div>
      <div id="route-win-list" style="display:flex;flex-direction:column;gap:8px;"></div>
    </div>
  </div>

  <!-- FOH PIN Gate -->
  <div id="pin-gate">
    <div class="card" style="width:min(92vw,380px);text-align:center;padding:24px;">
      <h2 style="font-size:18px;font-weight:800;">🔒 FOH Companion Lock</h2>
      <p style="font-size:12px;color:var(--muted);">Enter the active FOH PIN shown in Xteon Desktop (Mobile QR):</p>
      <input id="pin-input" class="input" type="text" inputmode="numeric" placeholder="000-000" style="text-align:center;font-size:20px;font-weight:800;letter-spacing:3px;" onkeydown="if(event.key==='Enter')verifyPin()" />
      <div id="pin-err" style="color:var(--rose);font-size:12px;font-weight:700;min-height:16px;"></div>
      <button class="btn btn-cyan" onclick="verifyPin()">Unlock FOH Companion</button>
    </div>
  </div>

  <div id="toast" class="toast">Action Triggered</div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    let authKey = urlParams.get('key') || localStorage.getItem('xteon_auth_key') || '';
    if (urlParams.get('key')) {
      try { localStorage.setItem('xteon_auth_key', authKey); } catch (e) {}
    }
    const clientId = localStorage.getItem('xteon_cid') || ('mob_' + Math.random().toString(36).slice(2, 10));
    try { localStorage.setItem('xteon_cid', clientId); } catch (e) {}

    let activeTab = 'STAGELINK';
    let displaysData = [];
    let slotsData = [];
    let windowsData = [];
    let routeTargetDisplay = null;
    let draftWhispers = {};

    (function initTheme() {
      const saved = localStorage.getItem('xteon_web_theme') || 'dark';
      setTheme(saved);
    })();

    function setTheme(t) {
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('xteon_web_theme', t); } catch (e) {}
      const btn = document.getElementById('btn-theme');
      if (btn) btn.textContent = t === 'light' ? '☀️ Light' : '🌙 Dark';
    }
    function toggleTheme() {
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.opacity = '1';
      setTimeout(() => { t.style.opacity = '0'; }, 2200);
    }

    function esc(s) {
      return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function apiUrl(path) {
      const sep = path.includes('?') ? '&' : '?';
      return path + sep + 'key=' + encodeURIComponent(authKey) + '&cid=' + encodeURIComponent(clientId);
    }

    async function verifyPin() {
      const pin = document.getElementById('pin-input').value.trim();
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (!res.ok) {
        document.getElementById('pin-err').textContent = 'Incorrect PIN.';
        return;
      }
      const d = await res.json();
      authKey = d.session_token || pin;
      try { localStorage.setItem('xteon_auth_key', authKey); } catch (e) {}
      document.getElementById('pin-gate').style.display = 'none';
      syncAll();
    }

    function switchTab(tab) {
      activeTab = tab;
      document.getElementById('tab-stagelink').classList.toggle('active', tab === 'STAGELINK');
      document.getElementById('tab-displays').classList.toggle('active', tab === 'DISPLAYS');
      document.getElementById('tab-windows').classList.toggle('active', tab === 'WINDOWS');
      renderCurrentTab();
    }

    async function syncAll() {
      try {
        const [dRes, sRes, wRes] = await Promise.all([
          fetch(apiUrl('/api/displays')),
          fetch(apiUrl('/api/stagelink/slots')),
          fetch(apiUrl('/api/windows'))
        ]);
        if (dRes.status === 401 || sRes.status === 401) {
          document.getElementById('pin-gate').style.display = 'flex';
          return;
        }
        document.getElementById('pin-gate').style.display = 'none';
        displaysData = await dRes.json();
        slotsData = await sRes.json();
        windowsData = await wRes.json();
        document.getElementById('conn-sub').textContent =
          displaysData.length + ' Screens • ' + slotsData.length + ' Wireless Stage • ' + windowsData.length + ' Windows';
        renderCurrentTab();
      } catch (e) {
        document.getElementById('conn-sub').textContent = 'Reconnecting to Xteon FOH...';
      }
    }

    function renderCurrentTab() {
      const header = document.getElementById('tab-header');
      const grid = document.getElementById('main-grid');

      if (activeTab === 'STAGELINK') {
        header.innerHTML = `
          <div>
            <div style="font-size:15px;font-weight:800;">Wireless StageLink Monitors (${slotsData.length})</div>
            <div style="font-size:12px;color:var(--muted);">Turn this tablet/phone into a live wireless stage screen or send cues</div>
          </div>
          <button class="btn btn-cyan" onclick="openSlotSheet()">+ New Wireless Stage Monitor</button>
        `;
        if (slotsData.length === 0) {
          grid.innerHTML = `
            <div class="card" style="grid-column:1/-1;text-align:center;padding:28px;">
              <div style="font-size:16px;font-weight:800;">No Wireless Stage Monitors Active Yet</div>
              <div style="font-size:13px;color:var(--muted);max-width:440px;margin:4px auto 12px;">Create a Wireless StageLink slot to stream Kairon Timer, ProPresenter, or any window directly to this device with zero app install.</div>
              <div><button class="btn btn-cyan" onclick="openSlotSheet()">+ Create First Stage Monitor</button></div>
            </div>
          `;
          return;
        }
        grid.innerHTML = slotsData.map(s => `
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
              <div>
                <span class="badge b-cyan">📡 ${esc(s.source_mode)} • ${s.connected_clients} Viewing</span>
                <div style="font-size:16px;font-weight:800;margin-top:6px;">${esc(s.name)}</div>
                <div style="font-size:12px;color:var(--muted);">📍 ${esc(s.stage_zone)}</div>
              </div>
              ${s.is_frozen ? '<span class="badge b-amber">❄️ FROZEN</span>' : ''}
              ${s.is_blackout ? '<span class="badge b-rose">⬛ BLACKOUT</span>' : ''}
            </div>
            <div class="spec-box">
              🎯 Source: <strong>${esc(s.primary_source_label)}</strong>
              ${s.secondary_source_label ? (' + <strong>' + esc(s.secondary_source_label) + '</strong>') : ''}
            </div>
            ${s.source_minimized ? `
              <button class="btn btn-amber" onclick="restoreMin('${esc(s.primary_source_id)}')">⚠️ Source Minimized — Tap to Restore Behind</button>
            ` : ''}
            <a class="btn btn-emerald" href="/stage/${encodeURIComponent(s.id)}?key=${encodeURIComponent(authKey)}">
              ▶️ Use This Device as "${esc(s.name)}"
            </a>
            <div class="btn-row">
              <button class="btn btn-amber" onclick="postAct('/api/stagelink/slots/${encodeURIComponent(s.id)}/flash', '⚡ Flashing tablet')">⚡ Flash</button>
              <button class="btn" onclick="toggleSlotFreeze('${esc(s.id)}', ${!s.is_frozen})">${s.is_frozen ? '▶️ Unfreeze' : '❄️ Freeze'}</button>
              <button class="btn" onclick="toggleSlotBlackout('${esc(s.id)}', ${!s.is_blackout})">${s.is_blackout ? '💡 Unblank' : '⬛ Blackout'}</button>
            </div>
            <div style="display:flex;gap:6px;">
              <input id="whisp-${esc(s.id)}" class="input" placeholder="Stage Whisper (e.g. Wrap up in 2m)..." value="${esc(draftWhispers[s.id] || '')}" oninput="draftWhispers['${esc(s.id)}'] = this.value" onkeydown="if(event.key==='Enter')sendWhisper('${esc(s.id)}')" />
              <button class="btn btn-cyan" onclick="sendWhisper('${esc(s.id)}')">💬 Send</button>
              <button class="btn btn-rose" onclick="deleteSlot('${esc(s.id)}')">🗑️</button>
              ${s.active_whisper ? `<button class="btn btn-rose" onclick="clearWhisper('${esc(s.id)}')">✕</button>` : ''}
            </div>
          </div>
        `).join('');
      } else if (activeTab === 'DISPLAYS') {
        header.innerHTML = `
          <div>
            <div style="font-size:15px;font-weight:800;">Physical Display Outputs (${displaysData.length})</div>
            <div style="font-size:12px;color:var(--muted);">Flash screens, inspect resolution, or route windows remotely</div>
          </div>
          <button class="btn btn-amber" onclick="recallStrayWindows()">🛡️ Recall Stray Windows to FOH</button>
        `;
        grid.innerHTML = displaysData.map(d => {
          const onThis = windowsData.filter(w => w.display_os_index === d.os_index && !w.is_minimized);
          return `
            <div class="card">
              <div>
                <span class="badge ${d.is_primary ? 'b-cyan' : 'b-emerald'}">Screen ${d.os_index} • ${esc(d.port_type)}</span>
                <div style="font-size:16px;font-weight:800;margin-top:6px;">${esc(d.custom_alias || d.name)}</div>
                <div style="font-size:12px;color:var(--muted);">📍 ${esc(d.stage_zone || 'Stage Area')}</div>
              </div>
              <div class="spec-box">
                📐 ${d.width}×${d.height} @ ${d.refresh_rate_hz}Hz
                <div style="margin-top:4px;">🪟 Active Windows: <strong>${onThis.length ? onThis.map(w => esc(w.title)).slice(0,2).join(', ') : 'Desktop Only'}</strong></div>
              </div>
              <div class="btn-row">
                <button class="btn btn-amber" onclick="postAct('/api/flash/${encodeURIComponent(d.id)}', '⚡ Flashing Screen ' + ${d.os_index})">⚡ Flash</button>
                <button class="btn btn-cyan" onclick="openRouteSheet(${d.os_index})">🎯 Route App Here</button>
              </div>
            </div>
          `;
        }).join('');
      } else {
        header.innerHTML = `
          <div>
            <div style="font-size:15px;font-weight:800;">Open Host Application Windows (${windowsData.length})</div>
            <div style="font-size:12px;color:var(--muted);">Restore minimized timers or beam any window to a wireless stage screen</div>
          </div>
          <button class="btn btn-amber" onclick="recallStrayWindows()">🛡️ Recall Stray Windows</button>
        `;
        grid.innerHTML = windowsData.filter(w => !w.is_xteon_self).map(w => `
          <div class="card">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
              <div>
                <span class="badge ${w.is_minimized ? 'b-amber' : 'b-cyan'}">${w.is_minimized ? '⚠️ MINIMIZED' : ('Screen ' + (w.display_os_index || 1))}</span>
                <div style="font-size:15px;font-weight:800;margin-top:6px;word-break:break-word;">${esc(w.title)}</div>
                <div style="font-size:12px;color:var(--muted);">${esc(w.process_name)}</div>
              </div>
              ${w.is_pinned_stage ? '<span class="badge b-emerald">📌 Pinned</span>' : ''}
            </div>
            <div class="btn-row">
              ${w.is_minimized ? `<button class="btn btn-amber" onclick="restoreMin('W:${esc(w.hwnd_id)}')">🔄 Restore Behind</button>` : ''}
              <button class="btn btn-emerald" onclick="quickCastWindow('${esc(w.hwnd_id)}')">📡 Stream Here</button>
            </div>
          </div>
        `).join('');
      }
    }

    async function postAct(path, msg, bodyObj) {
      if (msg) showToast(msg);
      await fetch(apiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyObj ? JSON.stringify(bodyObj) : '{}'
      });
      syncAll();
    }

    function toggleSlotFreeze(id, freeze) {
      postAct('/api/stagelink/slots/' + encodeURIComponent(id) + '/freeze', freeze ? '❄️ Stage Frozen' : '▶️ Stage Live', { frozen: freeze });
    }
    function toggleSlotBlackout(id, blackout) {
      postAct('/api/stagelink/slots/' + encodeURIComponent(id) + '/blackout', blackout ? '⬛ Blackout Active' : '💡 Stage Unblanked', { blackout });
    }
    function sendWhisper(id) {
      const el = document.getElementById('whisp-' + id);
      if (!el || !el.value.trim()) return;
      postAct('/api/stagelink/slots/' + encodeURIComponent(id) + '/whisper', '💬 Whisper Sent', {
        message: el.value.trim(),
        tone: 'WARN',
        duration_seconds: 12
      });
      el.value = '';
    }
    function clearWhisper(id) {
      postAct('/api/stagelink/slots/' + encodeURIComponent(id) + '/whisper/clear', 'Whisper Cleared');
    }
    async function deleteSlot(id) {
      if (!confirm('Remove this Wireless Stage monitor slot?')) return;
      await fetch(apiUrl('/api/stagelink/slots/' + encodeURIComponent(id)), { method: 'DELETE' });
      showToast('🗑️ Slot Removed');
      syncAll();
    }
    function restoreMin(rawId) {
      const hwnd = rawId.replace(/^W:/, '');
      postAct('/api/windows/restore', '🔄 Restored Window Behind', { hwnd_id: hwnd });
    }
    async function recallStrayWindows() {
      const res = await fetch(apiUrl('/api/windows/recall'), { method: 'POST' });
      if (res.ok) {
        const d = await res.json();
        showToast('🛡️ Rescued ' + (d.rescued || 0) + ' window(s) to FOH');
        syncAll();
      }
    }

    function openSlotSheet() {
      const sel = document.getElementById('new-slot-src');
      const winOpts = windowsData.filter(w => !w.is_xteon_self).map(w => `<option value="WINDOW|||${esc(w.hwnd_id)}|||${esc(w.title)}">🪟 Window: ${esc(w.title)} (${esc(w.process_name)})</option>`).join('');
      const dispOpts = displaysData.map(d => `<option value="DISPLAY|||${esc(d.id)}|||Screen ${d.os_index}: ${esc(d.custom_alias || d.name)}">🖥️ Screen ${d.os_index}: ${esc(d.custom_alias || d.name)}</option>`).join('');
      sel.innerHTML = winOpts + dispOpts;
      document.getElementById('slot-sheet').style.display = 'flex';
    }
    function closeSlotSheet() { document.getElementById('slot-sheet').style.display = 'none'; }

    async function createSlotAndOpen(openHere) {
      const selVal = document.getElementById('new-slot-src').value;
      if (!selVal) return;
      const [mode, srcId, srcLabel] = selVal.split('|||');
      const name = document.getElementById('new-slot-name').value.trim() || 'Pulpit Stage Monitor';
      const zone = document.getElementById('new-slot-zone').value.trim() || 'Stage';
      const res = await fetch(apiUrl('/api/stagelink/slots'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          stage_zone: zone,
          source_mode: mode,
          primary_source_id: srcId,
          primary_source_label: srcLabel
        })
      });
      closeSlotSheet();
      if (res.ok) {
        const created = await res.json();
        if (openHere && created.id) {
          window.location.href = '/stage/' + encodeURIComponent(created.id) + '?key=' + encodeURIComponent(authKey);
          return;
        }
        showToast('📡 Stage Slot Created');
        syncAll();
      }
    }

    async function quickCastWindow(hwndId) {
      const win = windowsData.find(w => w.hwnd_id === hwndId);
      const title = win ? win.title : 'Stage Stream';
      const res = await fetch(apiUrl('/api/stagelink/slots'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title.slice(0, 32),
          stage_zone: 'Mobile Stage',
          source_mode: 'WINDOW',
          primary_source_id: hwndId,
          primary_source_label: title
        })
      });
      if (res.ok) {
        const slot = await res.json();
        window.location.href = '/stage/' + encodeURIComponent(slot.id) + '?key=' + encodeURIComponent(authKey);
      }
    }

    function openRouteSheet(osIdx) {
      routeTargetDisplay = displaysData.find(d => d.os_index === osIdx);
      if (!routeTargetDisplay) return;
      document.getElementById('route-sheet-title').textContent = 'Route App → Screen ' + osIdx;
      const listEl = document.getElementById('route-win-list');
      listEl.innerHTML = windowsData.filter(w => !w.is_xteon_self).map(w => `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px;border:1px solid var(--border);border-radius:12px;background:var(--subcard);">
          <div style="min-width:0;flex:1;">
            <div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(w.title)}</div>
            <div style="font-size:11px;color:var(--muted);">${esc(w.process_name)}</div>
          </div>
          <button class="btn btn-cyan" style="min-height:38px;" onclick="routeWinNow('${esc(w.hwnd_id)}', true)">Borderless</button>
          <button class="btn" style="min-height:38px;" onclick="routeWinNow('${esc(w.hwnd_id)}', false)">Maximize</button>
        </div>
      `).join('') || '<div style="font-size:13px;color:var(--muted);">No external application windows open.</div>';
      document.getElementById('route-sheet').style.display = 'flex';
    }
    function closeRouteSheet() { document.getElementById('route-sheet').style.display = 'none'; }

    async function routeWinNow(hwndId, borderless) {
      if (!routeTargetDisplay) return;
      closeRouteSheet();
      await postAct('/api/windows/route', '🎯 Window Routed to Screen ' + routeTargetDisplay.os_index, {
        hwnd_id: hwndId,
        display_id: routeTargetDisplay.id,
        borderless_fullscreen: borderless,
        pin_to_stage: true
      });
    }

    syncAll();
    setInterval(syncAll, 2000);
  </script>
</body>
</html>"##
}
