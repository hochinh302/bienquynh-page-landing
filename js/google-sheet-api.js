(function () {
  'use strict';

  const config = window.BQ_CONFIG || {};
  const SCRIPT_URL = config.GOOGLE_SCRIPT_URL || '';
  const DEBUG = Boolean(config.DEBUG);

  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function getVisitorId() {
    const key = 'bq_visitor_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = uuid();
      localStorage.setItem(key, id);
    }
    return id;
  }

  function getSessionId() {
    const key = 'bq_session_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = uuid();
      sessionStorage.setItem(key, id);
    }
    return id;
  }

  function basePayload() {
    return {
      created_at: new Date().toISOString(),
      page_url: location.href,
      page_path: location.pathname,
      referrer: document.referrer || '',
      user_agent: navigator.userAgent || '',
      language: navigator.language || '',
      screen: `${screen.width}x${screen.height}`,
      visitor_id: getVisitorId(),
      session_id: getSessionId()
    };
  }

  function saveLocalFallback(payload) {
    const key = 'bq_pending_events';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    current.push(payload);
    localStorage.setItem(key, JSON.stringify(current.slice(-50)));
  }

  async function send(payload) {
    const finalPayload = { ...basePayload(), ...payload };

    if (!SCRIPT_URL || SCRIPT_URL.includes('PASTE_GOOGLE_APPS_SCRIPT')) {
      saveLocalFallback(finalPayload);
      if (DEBUG) console.warn('[BQ] Chưa cấu hình GOOGLE_SCRIPT_URL. Đã lưu tạm localStorage:', finalPayload);
      return { ok: false, local: true };
    }

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(finalPayload)
      });
      if (DEBUG) console.log('[BQ] Sent:', finalPayload);
      return { ok: true };
    } catch (error) {
      saveLocalFallback(finalPayload);
      if (DEBUG) console.error('[BQ] Send failed, saved locally:', error, finalPayload);
      return { ok: false, error };
    }
  }

  function trackPageView(pageType) {
    return send({ event_type: 'page_view', page_type: pageType || 'unknown' });
  }

  function trackEvent(eventName, extra) {
    return send({ event_type: eventName, ...(extra || {}) });
  }

  window.BQSheetAPI = { send, trackPageView, trackEvent };
})();
