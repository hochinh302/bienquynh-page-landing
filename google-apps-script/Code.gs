const SHEETS = {
  USERS: 'leads_users',
  MERCHANTS: 'leads_merchants',
  PAGE_VIEWS: 'page_views',
  EVENTS: 'events'
};

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheets_(ss);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      routePayload_(ss, payload);
    } finally {
      lock.releaseLock();
    }

    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function doGet() {
  return json_({ ok: true, message: 'Biển Quỳnh Google Sheet API is running.' });
}

function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return e && e.parameter ? e.parameter : {};
}

function routePayload_(ss, p) {
  if (p.event_type === 'page_view') {
    appendObject_(ss.getSheetByName(SHEETS.PAGE_VIEWS), p);
    return;
  }

  if (p.event_type === 'lead_submit') {
    if (p.lead_type === 'merchant') {
      appendObject_(ss.getSheetByName(SHEETS.MERCHANTS), p);
    } else {
      appendObject_(ss.getSheetByName(SHEETS.USERS), p);
    }
    return;
  }

  appendObject_(ss.getSheetByName(SHEETS.EVENTS), p);
}

function ensureSheets_(ss) {
  const definitions = {
    [SHEETS.USERS]: [
      'created_at', 'lead_type', 'name', 'phone', 'email', 'travel_date', 'number_of_people',
      'need', 'note', 'source', 'page_url', 'page_path', 'referrer', 'user_agent',
      'language', 'screen', 'visitor_id', 'session_id'
    ],
    [SHEETS.MERCHANTS]: [
      'created_at', 'lead_type', 'business_name', 'business_type', 'contact_name', 'phone',
      'email', 'address', 'need', 'free_trial_interest', 'note', 'source', 'page_url',
      'page_path', 'referrer', 'user_agent', 'language', 'screen', 'visitor_id', 'session_id'
    ],
    [SHEETS.PAGE_VIEWS]: [
      'created_at', 'event_type', 'page_type', 'page_url', 'page_path', 'referrer',
      'user_agent', 'language', 'screen', 'visitor_id', 'session_id'
    ],
    [SHEETS.EVENTS]: [
      'created_at', 'event_type', 'page_type', 'page_url', 'page_path', 'referrer',
      'user_agent', 'language', 'screen', 'visitor_id', 'session_id'
    ]
  };

  Object.keys(definitions).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = definitions[name];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }
  });
}

function appendObject_(sheet, obj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(key => obj[key] || '');
  sheet.appendRow(row);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
