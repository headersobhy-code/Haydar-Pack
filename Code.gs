/**
 * Haydar Pack production backend — confirmed Google mutations.
 * Backward-compatible Drive JSON storage with confirmed, idempotent mutations.
 * Deploy as a Google Apps Script Web App from the owner's Google account.
 */
const HP_APP_VERSION = '2026.08.07-production-fix.5';
const HP_REQUIRED_CLIENT_APP_VERSION = '2026.08.07-production-fix.5';
const HP_MIN_CLIENT_APP_VERSION = HP_REQUIRED_CLIENT_APP_VERSION;
const HP_SCHEMA_VERSION = 11;
const HP_ROOT_FOLDER_NAME = 'Hayder Pack ERP';
const HP_BACKUP_FOLDER_NAME = 'Backups';
const HP_IMAGE_FOLDER_NAME = 'Images';
const HP_REVISION_FOLDER_NAME = 'State Revisions';
const HP_DB_FILE_NAME = 'HayderPack_Cloud_Database.json';
const HP_PREVIOUS_FILE_NAME = 'HayderPack_Previous.json';
const HP_PROP_ROOT_FOLDER_ID = 'HP_ROOT_FOLDER_ID';
const HP_PROP_BACKUP_FOLDER_ID = 'HP_BACKUP_FOLDER_ID';
const HP_PROP_IMAGE_FOLDER_ID = 'HP_IMAGE_FOLDER_ID';
const HP_PROP_REVISION_FOLDER_ID = 'HP_REVISION_FOLDER_ID';
const HP_PROP_DB_FILE_ID = 'HP_DB_FILE_ID';
const HP_PROP_PREVIOUS_FILE_ID = 'HP_PREVIOUS_FILE_ID';
const HP_PROP_LAST_DAILY_BACKUP = 'HP_LAST_DAILY_BACKUP';
const HP_PROP_CURRENT_REVISION_FILE_ID = 'HP_CURRENT_REVISION_FILE_ID';
const HP_PROP_CURRENT_REVISION = 'HP_CURRENT_REVISION';
const HP_PROP_PRE_UPGRADE_BACKUP = 'HP_PRE_UPGRADE_BACKUP';
const HP_TIMEZONE = 'Africa/Cairo';
const HP_MAX_JSON_CHARS = 9000000;
const HP_MAX_IMAGE_CHARS = 2500000;
const HP_MAX_MUTATION_CHARS = 9000000;
const HP_MUTATION_LOG_LIMIT = 250;
const HP_REVISION_RETENTION = 60;
const HP_CONFLICT_POLICY_VERSION = 3;
const HP_MUTATION_LEASE_MS = 180000;
let HP_STORAGE_REQUEST_CACHE = null;


function doGet(e) {
  HP_STORAGE_REQUEST_CACHE = null;
  const action = e && e.parameter && e.parameter.action;
  if (action) {
    let result;
    try {
      result = handleApiGet_(action, e.parameter || {});
    } catch (error) {
      result = errorResponse_(error, 'SERVER_INTERNAL_ERROR');
    }
    return apiJsonp_(result, e.parameter.callback);
  }
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Haydar Pack Backend</title></head><body style="font-family:Arial,Tahoma,sans-serif;padding:24px;line-height:1.8">' +
    '<h2>Haydar Pack Backend OK</h2>' +
    '<p>هذا الرابط خاص بالمزامنة فقط. افتح البرنامج من GitHub Pages.</p>' +
    '<p>اختبار المزامنة: أضف <code>?action=meta</code> في نهاية الرابط.</p>' +
    '</body></html>'
  ).setTitle('Haydar Pack Backend')
   .addMetaTag('viewport', 'width=device-width, initial-scale=1')
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function parsePostRequest_(e) {
  const params = Object.assign({}, (e && e.parameter) || {});
  const raw = e && e.postData && e.postData.contents ? String(e.postData.contents) : '';
  if (raw) {
    try {
      const body = JSON.parse(raw);
      if (body && typeof body === 'object') Object.keys(body).forEach(function(k) { params[k] = body[k]; });
    } catch (err) {
      // Non-JSON form posts are still supported through e.parameter.
    }
  }
  return params;
}

function parseDataPayload_(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string' && value) return JSON.parse(value);
  return {};
}

function doPost(e) {
  HP_STORAGE_REQUEST_CACHE = null;
  let res = null;
  try {
    const p = parsePostRequest_(e);
    const action = String(p.action || '');
    if (action === 'commitMutation') {
      res = commitMutation({
        appVersion: p.appVersion || p.siteVersion || '',
        mutationId: p.mutationId || '',
        deviceId: p.deviceId || '',
        baseRevision: Number(p.baseRevision) || 0,
        operation: p.operation || '',
        entityType: p.entityType || '',
        payload: parseDataPayload_(p.payload),
        createdAt: p.createdAt || ''
      });
    } else if (action === 'save' || action === 'replace') {
      res = {
        ok:false,
        category:'VERSION_REJECTED',
        outdated:true,
        protected:true,
        message:'تم إيقاف مسار الحفظ القديم لحماية الداتا. ارفع ملفات GitHub النهائية ثم أعد المحاولة.'
      };
    } else if (action === 'backupSnapshot') {
      res = saveLocalFirstBackupSnapshot_({
        data: parseDataPayload_(p.data),
        backupToken: p.backupToken || '',
        reason: p.reason || 'local-first',
        appVersion: p.appVersion || p.siteVersion || ''
      });
    } else if (action === 'imagePut') {
      res = saveImageBlob_(p);
    } else {
      res = {ok:false, category:'INVALID_PAYLOAD', message:'طلب غير معروف'};
    }
  } catch (err) {
    res = errorResponse_(err, 'SERVER_INTERNAL_ERROR');
  }
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function handleApiGet_(action, p) {
  try {
    if (action === 'data' || action === 'getState') return getServerData();
    if (action === 'meta' || action === 'getRevision') return getServerMeta();
    if (action === 'getMutationStatus') return getMutationStatus(p.mutationId || '', p.appVersion || '');
    if (action === 'healthCheck') return healthCheck();
    if (action === 'ping') return {ok:true, pong:true, appVersion: HP_APP_VERSION, serverTime: new Date().toISOString()};
    if (action === 'backup' || action === 'createBackup') return createManualBackup();
    if (action === 'getBackupSnapshotStatus') return getLocalFirstBackupStatus_(p.backupToken || '');
    if (action === 'getLatestLocalFirstBackup') return getLatestLocalFirstBackup_();
    if (action === 'status') return getRecoveryStatus();
    if (action === 'safetyStatus') return getDataProtectionStatus();
    if (action === 'listBackups') return listRecoveryBackups();
    if (action === 'backupCenterStatus') return getBackupCenterStatus();
    if (action === 'restoreBackupByName') return restoreBackupByName(p.name || '');
    if (action === 'restorePrevious') return restorePreviousDatabase();
    if (action === 'restoreLatestBackup') return restoreLatestUsefulBackup();
    if (action === 'restoreBestSafetyBackup') return restoreBestSafetyBackup();
    if (action === 'imageGet') return getImageBlob_(p.id || '');
    if (action === 'imageMeta') return getImageMeta_(p.id || '');
    if (action === 'listImages') return listImageBlobs_();
    if (action === 'setup') return setupHayderPack();
    return {ok:false, category:'INVALID_PAYLOAD', message:'طلب غير معروف'};
  } catch (err) {
    return errorResponse_(err, 'SERVER_INTERNAL_ERROR');
  }
}

function apiJsonp_(obj, callback) {
  const cb = String(callback || 'callback').replace(/[^a-zA-Z0-9_.$]/g, '') || 'callback';
  return ContentService.createTextOutput(cb + '(' + JSON.stringify(obj) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}



function isClientVersionAllowed_(version) {
  return String(version || '').trim().toLowerCase() === HP_REQUIRED_CLIENT_APP_VERSION.toLowerCase();
}

function hpError_(category, message, details) {
  const error = new Error(message || 'تعذر تنفيذ الطلب');
  error.category = category || 'SERVER_INTERNAL_ERROR';
  error.details = details || null;
  return error;
}

function errorResponse_(error, fallbackCategory) {
  const category = String(error && error.category || fallbackCategory || 'SERVER_INTERNAL_ERROR');
  const result = {
    ok: false,
    category: category,
    message: String(error && error.message || 'تعذر تنفيذ الطلب'),
    serverTimestamp: new Date().toISOString(),
    backendVersion: HP_APP_VERSION
  };
  if (error && error.details) result.details = error.details;
  return result;
}

function mutationPropertyKey_(mutationId) {
  return 'HP_MUT_' + sha256Text_(String(mutationId || '')).slice(0, 40);
}

function readMutationProperty_(mutationId) {
  if (!mutationId) return null;
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(mutationPropertyKey_(mutationId));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function writeMutationProperty_(mutationId, result) {
  if (!mutationId || !result) return;
  try {
    const compact = {
      mutationId: String(mutationId),
      status: result.status || (result.ok ? 'committed' : 'rejected'),
      ok: result.ok === true,
      category: result.category || '',
      message: result.message || '',
      revision: Number(result.revision) || 0,
      stateHash: result.stateHash || '',
      entityId: result.entityId || '',
      operation: result.operation || '',
      serverTimestamp: result.serverTimestamp || new Date().toISOString(),
      conflictPolicyVersion: Number(result.conflictPolicyVersion) || 0,
      details: result.details || null
    };
    if (result.processingToken) compact.processingToken = String(result.processingToken);
    if (result.startedAt) compact.startedAt = String(result.startedAt);
    if (result.leaseExpiresAt) compact.leaseExpiresAt = String(result.leaseExpiresAt);
    if (result.timing) compact.timing = result.timing;
    PropertiesService.getScriptProperties().setProperty(mutationPropertyKey_(mutationId), JSON.stringify(compact));
  } catch (error) {
    console.error('Mutation status property write failed', error);
  }
}

function mutationLeaseActive_(receipt, atMillis) {
  if (!receipt || receipt.status !== 'processing') return false;
  const expires = Date.parse(String(receipt.leaseExpiresAt || ''));
  return isFinite(expires) && expires > Number(atMillis || Date.now());
}

function createProcessingReceipt_(request, token) {
  const started = new Date();
  return {
    ok:true,
    status:'processing',
    mutationId:String(request.mutationId || ''),
    operation:String(request.operation || ''),
    processingToken:String(token || ''),
    startedAt:started.toISOString(),
    leaseExpiresAt:new Date(started.getTime() + HP_MUTATION_LEASE_MS).toISOString(),
    serverTimestamp:started.toISOString(),
    backendVersion:HP_APP_VERSION
  };
}

function isRetryableRejectedReceipt_(receipt, appVersion) {
  if (!receipt || receipt.status !== 'rejected') return false;
  if (receipt.category === 'REVISION_CONFLICT') return Number(receipt.conflictPolicyVersion || 0) < HP_CONFLICT_POLICY_VERSION;
  return receipt.category === 'VERSION_REJECTED' && isClientVersionAllowed_(appVersion || '');
}

function deleteMutationProperty_(mutationId) {
  if (!mutationId) return;
  try { PropertiesService.getScriptProperties().deleteProperty(mutationPropertyKey_(mutationId)); }
  catch (error) { console.error('Mutation property delete failed', error); }
}

function findMutationReceipt_(envelope, mutationId) {
  const list = envelope && Array.isArray(envelope.mutationLog) ? envelope.mutationLog : [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (String(list[i] && list[i].mutationId || '') === String(mutationId || '')) return list[i];
  }
  return null;
}

function getMutationStatus(mutationId, appVersion) {
  mutationId = String(mutationId || '').trim();
  if (!mutationId) return {ok:false, category:'INVALID_PAYLOAD', message:'رقم عملية الحفظ غير موجود'};
  const storedBeforeLock = readMutationProperty_(mutationId);
  if (storedBeforeLock && !isRetryableRejectedReceipt_(storedBeforeLock, appVersion)) {
    if (storedBeforeLock.status !== 'processing' || mutationLeaseActive_(storedBeforeLock)) return storedBeforeLock;
  }
  const lock = LockService.getScriptLock();
  let acquired = false;
  try {
    if (typeof lock.tryLock === 'function') acquired = lock.tryLock(1200);
    else {
      lock.waitLock(30000);
      acquired = true;
    }
  } catch (error) {
    acquired = false;
  }
  if (!acquired) {
    return {
      ok:true,
      status:'processing',
      mutationId:mutationId,
      serverTimestamp:new Date().toISOString()
    };
  }
  try {
    const storedAfterLock = readMutationProperty_(mutationId);
    if (storedAfterLock && !isRetryableRejectedReceipt_(storedAfterLock, appVersion)) {
      if (storedAfterLock.status !== 'processing' || mutationLeaseActive_(storedAfterLock)) return storedAfterLock;
    }
    const current = readDatabase_();
    const receipt = findMutationReceipt_(current, mutationId);
    if (receipt) {
      const recovered = Object.assign({ok:true, status:'committed', recoveredFromState:true}, receipt);
      writeMutationProperty_(mutationId, recovered);
      return recovered;
    }
    if (storedAfterLock && storedAfterLock.status === 'processing') {
      return Object.assign({}, storedAfterLock, {ok:true,status:'recovering',leaseExpired:true,canResubmit:true,serverTimestamp:new Date().toISOString()});
    }
    return {
      ok:true,
      status:'not_found',
      mutationId:mutationId,
      revision:Number(current.revision) || 0,
      stateHash:current.stateHash || stateHashData_(current.data || {}),
      serverTimestamp:new Date().toISOString()
    };
  } finally {
    if (acquired) lock.releaseLock();
  }
}

function validateMutationRequest_(request) {
  if (!request || typeof request !== 'object') throw hpError_('INVALID_PAYLOAD', 'طلب الحفظ غير صالح');
  if (!isClientVersionAllowed_(request.appVersion || '')) {
    throw hpError_('VERSION_REJECTED', 'نسخة البرنامج قديمة. افتح آخر نسخة من GitHub ثم أعد المحاولة.');
  }
  const mutationId = String(request.mutationId || '').trim();
  if (!/^[a-zA-Z0-9._:-]{12,180}$/.test(mutationId)) throw hpError_('INVALID_PAYLOAD', 'رقم عملية الحفظ غير صالح');
  const deviceId = String(request.deviceId || '').trim();
  if (!deviceId || deviceId.length > 180) throw hpError_('INVALID_PAYLOAD', 'معرف الجهاز غير صالح');
  const operation = String(request.operation || '').trim();
  if (!operation || operation.length > 80) throw hpError_('INVALID_PAYLOAD', 'نوع عملية الحفظ غير صالح');
  const payloadText = JSON.stringify(request.payload || {});
  if (payloadText.length > HP_MAX_MUTATION_CHARS) throw hpError_('INVALID_PAYLOAD', 'حجم عملية الحفظ أكبر من المسموح');
  return {mutationId:mutationId, deviceId:deviceId, operation:operation};
}

function commitMutation(request) {
  const startedAt = Date.now();
  const timing = {validationMs:0,lockWaitMs:0,stateReadMs:0,mutationApplyMs:0,stateValidationMs:0,stateWriteMs:0,receiptWriteMs:0,totalDurationMs:0};
  let mutationId = String(request && request.mutationId || '').trim();
  let operation = String(request && request.operation || '').trim();
  let validationStarted = Date.now();
  try {
    const checkedBeforeLock = validateMutationRequest_(request);
    mutationId = checkedBeforeLock.mutationId;
    operation = checkedBeforeLock.operation;
    timing.validationMs = Date.now() - validationStarted;
    const beforeLock = readMutationProperty_(mutationId);
    if (beforeLock && !isRetryableRejectedReceipt_(beforeLock, request.appVersion)) {
      if (beforeLock.status !== 'processing' || mutationLeaseActive_(beforeLock)) return Object.assign({}, beforeLock, {duplicate:true});
    }
  } catch (error) {
    const invalid = errorResponse_(error, 'INVALID_PAYLOAD');
    invalid.mutationId = mutationId;
    invalid.operation = operation;
    invalid.status = 'rejected';
    invalid.timing = timing;
    if (mutationId) writeMutationProperty_(mutationId, invalid);
    return invalid;
  }
  const lock = LockService.getScriptLock();
  const lockStarted = Date.now();
  try {
    lock.waitLock(30000);
    timing.lockWaitMs = Date.now() - lockStarted;
  } catch (error) {
    return errorResponse_(hpError_('SERVER_INTERNAL_ERROR', 'الخادم مشغول بعملية حفظ أخرى. سيتم إعادة المحاولة بنفس العملية.'), 'SERVER_INTERNAL_ERROR');
  }
  try {
    const checked = validateMutationRequest_(request);
    mutationId = checked.mutationId;
    operation = checked.operation;
    const readStarted = Date.now();
    const current = readDatabase_();
    timing.stateReadMs = Date.now() - readStarted;
    const existing = findMutationReceipt_(current, mutationId) || readMutationProperty_(mutationId);
    if (existing && (existing.status === 'committed' || existing.ok === true)) {
      return Object.assign({}, existing, {ok:true, duplicate:true, status:'committed'});
    }
    if (existing && existing.status === 'rejected') {
      if (isRetryableRejectedReceipt_(existing, request.appVersion)) deleteMutationProperty_(mutationId);
      else return existing;
    }
    if (mutationLeaseActive_(existing)) return Object.assign({}, existing, {duplicate:true});
    const processingToken = typeof Utilities.getUuid === 'function' ? Utilities.getUuid() : mutationId + '-' + Date.now();
    writeMutationProperty_(mutationId, createProcessingReceipt_(request, processingToken));

    const currentRevision = Number(current.revision) || 0;
    const baseRevision = Number(request.baseRevision) || 0;
    if (baseRevision > currentRevision) {
      throw hpError_('REVISION_CONFLICT', 'رقم النسخة الموجودة على الجهاز أحدث من Google بصورة غير متوقعة. أعد تحميل البيانات ثم حاول مرة أخرى.', {baseRevision:baseRevision,currentRevision:currentRevision});
    }

    const applyStarted = Date.now();
    let nextData;
    let entityId = '';
    if (operation === 'replaceSnapshot') {
      if (!request.payload || request.payload.confirm !== 'REPLACE_CONFIRMED') throw hpError_('INVALID_PAYLOAD', 'استيراد النسخة يحتاج تأكيدًا صريحًا');
      if (baseRevision !== currentRevision) throw hpError_('REVISION_CONFLICT', 'تم منع الاستيراد لأن Google يحتوي على تعديل أحدث');
      nextData = normalizeData_(request.payload.data || {});
      const safety = destructiveSafetyReport_(nextData, current, {});
      if (!safety.ok) throw hpError_('STATE_VALIDATION_FAILED', safety.message, safety);
      createTimestampBackup_(current, 'BeforeImport');
    } else {
      const applied = applyMutationPatch_(current.data || {}, request.payload && request.payload.patch, baseRevision, currentRevision);
      nextData = applied.data;
      entityId = applied.entityId || '';
    }

    timing.mutationApplyMs = Date.now() - applyStarted;
    const stateValidationStarted = Date.now();
    nextData = normalizeData_(nextData);
    const report = validateData_(nextData);
    if (!report.ok) throw hpError_('STATE_VALIDATION_FAILED', 'تم منع الحفظ لحماية الداتا: ' + report.errors.slice(0, 5).join(' — '), report);
    if (hasUsefulData_(current.data || {}) && !hasUsefulData_(nextData)) throw hpError_('STATE_VALIDATION_FAILED', 'تم منع حفظ نسخة فارغة فوق بيانات Google الحالية');

    timing.stateValidationMs = Date.now() - stateValidationStarted;
    ensurePreUpgradeBackup_(current);
    const next = makeEnvelope_(nextData, currentRevision + 1, operation, current);
    const receipt = {
      ok:true,
      status:'committed',
      mutationId:mutationId,
      operation:operation,
      entityId:entityId,
      revision:next.revision,
      stateHash:next.stateHash,
      serverTimestamp:new Date().toISOString(),
      counts:countData_(next.data || {}),
      baseRevision:baseRevision,
      rebased:baseRevision !== currentRevision,
      durationMs:Date.now() - startedAt,
      backendVersion:HP_APP_VERSION
    };
    next.updatedByMutationId = mutationId;
    next.mutationLog = appendMutationReceipt_(current.mutationLog, receipt);
    const writeStarted = Date.now();
    writeDatabase_(current, next, false);
    timing.stateWriteMs = Date.now() - writeStarted;
    timing.totalDurationMs = Date.now() - startedAt;
    receipt.durationMs = timing.totalDurationMs;
    receipt.timing = timing;
    const receiptStarted = Date.now();
    writeMutationProperty_(mutationId, receipt);
    timing.receiptWriteMs = Date.now() - receiptStarted;
    if (next.revision % 25 === 0) cleanupMutationProperties_();
    return receipt;
  } catch (error) {
    try {
      if (mutationId) {
        const afterFailure = readDatabase_();
        const committed = findMutationReceipt_(afterFailure, mutationId);
        if (committed) return Object.assign({}, committed, {ok:true, status:'committed', recoveredAfterTimeout:true});
      }
    } catch (readError) {
      console.error('Post-failure mutation lookup failed', readError);
    }
    const result = errorResponse_(error, 'SERVER_INTERNAL_ERROR');
    result.mutationId = mutationId;
    result.operation = operation;
    result.status = result.category === 'SERVER_INTERNAL_ERROR' || result.category === 'GOOGLE_DRIVE_WRITE_FAILED' ? 'unknown' : 'rejected';
    if (result.category === 'REVISION_CONFLICT') result.conflictPolicyVersion = HP_CONFLICT_POLICY_VERSION;
    result.durationMs = Date.now() - startedAt;
    timing.totalDurationMs = result.durationMs;
    result.timing = timing;
    if (mutationId && result.status === 'rejected') writeMutationProperty_(mutationId, result);
    console.error(JSON.stringify({mutationId:mutationId,operation:operation,category:result.category,message:result.message,durationMs:result.durationMs}));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function appendMutationReceipt_(existing, receipt) {
  const list = Array.isArray(existing) ? existing.slice(-HP_MUTATION_LOG_LIMIT + 1) : [];
  list.push(JSON.parse(JSON.stringify(receipt)));
  return list;
}

function cleanupMutationProperties_() {
  try {
    const props = PropertiesService.getScriptProperties();
    const all = props.getProperties();
    const entries = Object.keys(all).filter(function(key) { return key.indexOf('HP_MUT_') === 0; }).map(function(key) {
      let timestamp = '';
      try { timestamp = JSON.parse(all[key] || '{}').serverTimestamp || ''; } catch (error) {}
      return {key:key,timestamp:timestamp};
    });
    if (entries.length <= 300) return;
    entries.sort(function(a, b) { return String(b.timestamp).localeCompare(String(a.timestamp)); });
    entries.slice(300).forEach(function(entry) { props.deleteProperty(entry.key); });
  } catch (error) {
    console.error('Mutation property cleanup failed', error);
  }
}

function isMergeMetadataField_(key) {
  return key === 'updatedAt' || key === 'modifiedAt' || key === 'lastModifiedAt' || key === 'syncedAt';
}

function recordWithoutMergeMetadata_(record) {
  const out = {};
  Object.keys(record || {}).forEach(function(key) {
    if (!isMergeMetadataField_(key)) out[key] = record[key];
  });
  return out;
}

function recordsEqualIgnoringMetadata_(left, right) {
  return deepEqual_(recordWithoutMergeMetadata_(left), recordWithoutMergeMetadata_(right));
}

function mergeMetadataValue_(currentValue, afterValue) {
  const currentText = String(currentValue || '');
  const afterText = String(afterValue || '');
  return currentText > afterText ? currentValue : afterValue;
}

function historyEventDuplicate_(left, right) {
  if (deepEqual_(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (String(left.type || '') !== String(right.type || '') || String(left.label || '') !== String(right.label || '')) return false;
  const leftTime = Date.parse(String(left.at || ''));
  const rightTime = Date.parse(String(right.at || ''));
  return isFinite(leftTime) && isFinite(rightTime) && Math.abs(leftTime - rightTime) < 5000;
}

function mergeOrderHistory_(currentHistory, afterHistory) {
  const merged = [];
  function appendUnique(event) {
    if (event == null) return;
    if (merged.some(function(existing) { return historyEventDuplicate_(existing, event); })) return;
    merged.push(JSON.parse(JSON.stringify(event)));
  }
  (Array.isArray(currentHistory) ? currentHistory : []).forEach(appendUnique);
  (Array.isArray(afterHistory) ? afterHistory : []).forEach(appendUnique);
  return merged.map(function(event, index) { return {event:event, index:index}; }).sort(function(left, right) {
    const leftAt = String(left.event && left.event.at || '');
    const rightAt = String(right.event && right.event.at || '');
    if (leftAt && rightAt && leftAt !== rightAt) return leftAt.localeCompare(rightAt);
    return left.index - right.index;
  }).map(function(item) { return item.event; });
}

function mergeRecordUpdate_(currentRecord, beforeRecord, afterRecord, collectionKey, id) {
  if (!beforeRecord || typeof beforeRecord !== 'object' || Array.isArray(beforeRecord) ||
      !afterRecord || typeof afterRecord !== 'object' || Array.isArray(afterRecord)) {
    throw hpError_('INVALID_PAYLOAD', 'بيانات تعديل السجل غير مكتملة داخل ' + collectionKey);
  }
  const merged = JSON.parse(JSON.stringify(currentRecord || {}));
  const keys = {};
  Object.keys(beforeRecord).concat(Object.keys(afterRecord)).forEach(function(key) { keys[key] = true; });
  const conflicts = [];
  const appliedFields = [];

  Object.keys(keys).sort().forEach(function(field) {
    const beforeExists = Object.prototype.hasOwnProperty.call(beforeRecord, field);
    const afterExists = Object.prototype.hasOwnProperty.call(afterRecord, field);
    const currentExists = Object.prototype.hasOwnProperty.call(currentRecord || {}, field);
    const beforeValue = beforeRecord[field];
    const afterValue = afterRecord[field];
    const currentValue = currentRecord && currentRecord[field];
    const operationChangedField = beforeExists !== afterExists || !deepEqual_(beforeValue, afterValue);
    if (!operationChangedField) return;

    if (isMergeMetadataField_(field)) {
      if (afterExists) merged[field] = mergeMetadataValue_(currentValue, afterValue);
      else delete merged[field];
      appliedFields.push(field);
      return;
    }

    // Order history is append-only. A status update and another order edit may both
    // add valid timeline events from the same old revision; preserve both instead
    // of rejecting the whole order because the arrays are not byte-identical.
    if (collectionKey === 'orders' && field === 'history' && afterExists && Array.isArray(afterValue)) {
      merged[field] = mergeOrderHistory_(currentValue, afterValue);
      appliedFields.push(field);
      return;
    }

    const currentMatchesBefore = currentExists === beforeExists && (!currentExists || deepEqual_(currentValue, beforeValue));
    const currentAlreadyAfter = currentExists === afterExists && (!currentExists || deepEqual_(currentValue, afterValue));
    if (!currentMatchesBefore && !currentAlreadyAfter) {
      conflicts.push(field);
      return;
    }
    if (afterExists) merged[field] = JSON.parse(JSON.stringify(afterValue));
    else delete merged[field];
    appliedFields.push(field);
  });

  if (conflicts.length) {
    throw hpError_(
      'REVISION_CONFLICT',
      'يوجد تعديل أحدث لنفس البيانات في الحقول: ' + conflicts.join('، ') + '. لم يتم الاستبدال لحماية الداتا.',
      {key:collectionKey,id:id,conflictingFields:conflicts,conflictPolicyVersion:HP_CONFLICT_POLICY_VERSION}
    );
  }
  return {record:merged, appliedFields:appliedFields};
}

function applyMutationPatch_(currentData, patch, baseRevision, currentRevision) {
  if (!patch || typeof patch !== 'object') throw hpError_('INVALID_PAYLOAD', 'تفاصيل التعديل غير موجودة');
  const collections = Array.isArray(patch.collections) ? patch.collections : [];
  const values = Array.isArray(patch.values) ? patch.values : [];
  if (!collections.length && !values.length) throw hpError_('INVALID_PAYLOAD', 'لا توجد تغييرات للحفظ');
  if (collections.length + values.length > 200) throw hpError_('INVALID_PAYLOAD', 'عدد تغييرات العملية أكبر من المسموح');
  const next = JSON.parse(JSON.stringify(currentData || {}));
  let entityId = '';

  collections.forEach(function(change) {
    const key = safeDataKey_(change && change.key);
    if (!Array.isArray(next[key])) next[key] = [];
    const list = next[key];
    const adds = Array.isArray(change.adds) ? change.adds : [];
    const updates = Array.isArray(change.updates) ? change.updates : [];
    const deletes = Array.isArray(change.deletes) ? change.deletes : [];
    if (adds.length + updates.length + deletes.length > 1500) throw hpError_('INVALID_PAYLOAD', 'عدد السجلات داخل عملية الحفظ أكبر من المسموح');

    adds.forEach(function(item) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw hpError_('INVALID_PAYLOAD', 'سجل جديد غير صالح داخل ' + key);
      const id = String(item.id || '').trim();
      if (!id) throw hpError_('INVALID_PAYLOAD', 'سجل جديد بدون ID داخل ' + key);
      const index = findRecordIndex_(list, id);
      if (index >= 0) {
        if (!recordsEqualIgnoringMetadata_(list[index], item)) throw hpError_('REVISION_CONFLICT', 'يوجد سجل مختلف بنفس المعرف داخل ' + key, {key:key,id:id,conflictingFields:['id'],conflictPolicyVersion:HP_CONFLICT_POLICY_VERSION});
      } else {
        list.push(JSON.parse(JSON.stringify(item)));
      }
      if (!entityId) entityId = id;
    });

    updates.forEach(function(item) {
      const id = String(item && item.id || '').trim();
      if (!id || !item || !item.after) throw hpError_('INVALID_PAYLOAD', 'تعديل سجل غير صالح داخل ' + key);
      const index = findRecordIndex_(list, id);
      if (index < 0) throw hpError_('REVISION_CONFLICT', 'السجل المطلوب تعديله لم يعد موجودًا داخل ' + key, {key:key,id:id,conflictingFields:['deleted'],conflictPolicyVersion:HP_CONFLICT_POLICY_VERSION});
      if (deepEqual_(list[index], item.after)) return;
      list[index] = mergeRecordUpdate_(list[index], item.before, item.after, key, id).record;
      if (!entityId) entityId = id;
    });

    deletes.forEach(function(item) {
      const id = String(item && item.id || '').trim();
      if (!id) throw hpError_('INVALID_PAYLOAD', 'حذف سجل بدون ID داخل ' + key);
      const index = findRecordIndex_(list, id);
      if (index < 0) return;
      if (item.before && !recordsEqualIgnoringMetadata_(list[index], item.before)) throw hpError_('REVISION_CONFLICT', 'يوجد تعديل أحدث على السجل؛ تم منع حذفه لحماية الداتا.', {key:key,id:id,conflictingFields:['record'],conflictPolicyVersion:HP_CONFLICT_POLICY_VERSION});
      list.splice(index, 1);
      if (!entityId) entityId = id;
    });
  });

  values.forEach(function(change) {
    const key = safeDataKey_(change && change.key);
    const currentExists = Object.prototype.hasOwnProperty.call(next, key);
    if (key === '_id') {
      next._id = Math.max(Number(next._id) || 1, Number(change.after) || 1);
      return;
    }
    if (currentExists === !!change.afterExists && deepEqual_(next[key], change.after)) return;
    if (currentExists !== !!change.beforeExists || (currentExists && !deepEqual_(next[key], change.before))) {
      throw hpError_('REVISION_CONFLICT', 'يوجد إصدار أحدث من الإعدادات المشتركة. لم يتم الاستبدال لحماية الداتا.', {key:key,baseRevision:baseRevision,currentRevision:currentRevision,conflictingFields:[key],conflictPolicyVersion:HP_CONFLICT_POLICY_VERSION});
    }
    if (change.afterExists) next[key] = JSON.parse(JSON.stringify(change.after));
    else delete next[key];
  });
  return {data:next, entityId:entityId};
}

function safeDataKey_(value) {
  const key = String(value || '');
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,79}$/.test(key) || key === '__proto__' || key === 'constructor' || key === 'prototype') {
    throw hpError_('INVALID_PAYLOAD', 'اسم جزء البيانات غير صالح');
  }
  return key;
}

function findRecordIndex_(list, id) {
  for (let i = 0; i < list.length; i++) if (String(list[i] && list[i].id || '') === String(id)) return i;
  return -1;
}

function canonicalize_(value) {
  if (Array.isArray(value)) return value.map(canonicalize_);
  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).sort().forEach(function(key) { out[key] = canonicalize_(value[key]); });
    return out;
  }
  return value;
}

function deepEqual_(left, right) {
  return JSON.stringify(canonicalize_(left)) === JSON.stringify(canonicalize_(right));
}

function sha256Text_(text) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text || ''), Utilities.Charset.UTF_8);
  return digest.map(function(byte) { const n = byte < 0 ? byte + 256 : byte; return ('0' + n.toString(16)).slice(-2); }).join('');
}

function stateHashData_(data) {
  return sha256Text_(JSON.stringify(canonicalize_(normalizeData_(data || {}))));
}

function getServerData() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const envelope = readDatabase_();
    return responseFromEnvelope_(envelope);
  } finally {
    lock.releaseLock();
  }
}

function getServerMeta() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const envelope = readDatabase_();
    return {
      ok: true,
      revision: Number(envelope.revision) || 0,
      updatedAt: envelope.updatedAt || '',
      appVersion: HP_APP_VERSION,
      backendVersion: HP_APP_VERSION,
      requiredClientVersion: HP_REQUIRED_CLIENT_APP_VERSION,
      schemaVersion: Number(envelope.schemaVersion) || HP_SCHEMA_VERSION,
      counts: countData_(envelope.data || {}),
      checksum: checksumData_(envelope.data || {}),
      stateHash: envelope.stateHash || stateHashData_(envelope.data || {}),
      updatedByMutationId: envelope.updatedByMutationId || ''
    };
  } finally {
    lock.releaseLock();
  }
}

function healthCheck() {
  const started = Date.now();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const storage = ensureStorage_();
    const envelope = readDatabase_();
    let previousReadable = false;
    try { readEnvelopeFromFile_(storage.previous); previousReadable = true; } catch (error) { previousReadable = false; }
    return {
      ok:true,
      status:'healthy',
      applicationVersion:HP_REQUIRED_CLIENT_APP_VERSION,
      backendVersion:HP_APP_VERSION,
      schemaVersion:HP_SCHEMA_VERSION,
      revision:Number(envelope.revision) || 0,
      stateHash:envelope.stateHash || stateHashData_(envelope.data || {}),
      updatedAt:envelope.updatedAt || '',
      updatedByMutationId:envelope.updatedByMutationId || '',
      counts:countData_(envelope.data || {}),
      controls:controlTotals_(envelope.data || {}),
      mainReadable:true,
      previousReadable:previousReadable,
      preMigrationBackup:PropertiesService.getScriptProperties().getProperty(HP_PROP_PRE_UPGRADE_BACKUP) || '',
      durationMs:Date.now() - started,
      serverTimestamp:new Date().toISOString()
    };
  } finally {
    lock.releaseLock();
  }
}

function saveServerData(request) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (!request || !request.data || typeof request.data !== 'object') {
      return {ok: false, message: 'لم تصل بيانات صالحة للحفظ'};
    }
    const current = readDatabase_();
    const baseRevision = Number(request.baseRevision) || 0;
    const currentRevision = Number(current.revision) || 0;
    if (baseRevision !== currentRevision) {
      const conflict = responseFromEnvelope_(current);
      conflict.ok = false;
      conflict.conflict = true;
      conflict.message = 'يوجد إصدار أحدث من البيانات على Google';
      return conflict;
    }
    const data = normalizeData_(request.data);
    const report = validateData_(data);
    if (!report.ok) return {ok: false, message: 'تم منع الحفظ لحماية قاعدة البيانات: ' + report.errors.slice(0, 4).join(' — '), report: report};
    if (hasUsefulData_(current.data || {}) && !hasUsefulData_(data)) {
      return {ok:false, protected:true, message:'تم منع حفظ نسخة فارغة فوق داتا موجودة على Google. استخدم الاسترجاع أو راجع النسخة قبل الحفظ.'};
    }
    const safety = destructiveSafetyReport_(data, current, request || {});
    if (!safety.ok) return {ok:false, protected:true, destructive:true, message:safety.message, safety:safety};
    const next = makeEnvelope_(data, currentRevision + 1, 'normal-save', current);
    writeDatabase_(current, next, false);
    return {ok: true, revision: next.revision, updatedAt: next.updatedAt, appVersion: HP_APP_VERSION, schemaVersion: HP_SCHEMA_VERSION};
  } catch (error) {
    console.error(error);
    return {ok: false, message: error.message || 'تعذر الحفظ على Google'};
  } finally {
    lock.releaseLock();
  }
}

function replaceServerData(request) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (!request || !request.data || typeof request.data !== 'object') return {ok: false, message: 'ملف الاستيراد غير صالح'};
    const current = readDatabase_();
    const currentRevision = Number(current.revision) || 0;
    const baseRevision = Number(request.baseRevision) || 0;
    const force = request.force === true;
    if (!force && baseRevision && baseRevision !== currentRevision) {
      const conflict = responseFromEnvelope_(current);
      conflict.ok = false;
      conflict.conflict = true;
      conflict.message = 'تم منع الاستيراد لأن Google يحتوي على داتا أحدث. حمّل آخر داتا أولاً أو أعد المحاولة بعد المراجعة.';
      return conflict;
    }
    const data = normalizeData_(request.data);
    const report = validateData_(data);
    if (!report.ok) return {ok: false, message: 'تم رفض النسخة لأنها تحتوي أخطاء: ' + report.errors.slice(0, 5).join(' — '), report: report};
    if (hasUsefulData_(current.data || {}) && !hasUsefulData_(data) && String(request.forceBlank || '') !== '1') {
      return {ok:false, protected:true, message:'تم منع استبدال Google بنسخة فارغة. لو دي عملية مقصودة لازم forceBlank=1.'};
    }
    const safety = destructiveSafetyReport_(data, current, request || {});
    if (!safety.ok) return {ok:false, protected:true, destructive:true, message:safety.message, safety:safety};
    createTimestampBackup_(current, 'BeforeImport');
    const next = makeEnvelope_(data, currentRevision + 1, String(request.reason || 'replace'), current);
    writeDatabase_(current, next, true);
    return responseFromEnvelope_(next);
  } catch (error) {
    console.error(error);
    return {ok: false, message: error.message || 'تعذر استيراد الداتا'};
  } finally {
    lock.releaseLock();
  }
}


function usefulCount_(db) {
  const c = countData_(db || {});
  const deleted = (Array.isArray(db.deletedItems) ? db.deletedItems.length : 0) +
                  (Array.isArray(db.deletedLog) ? db.deletedLog.length : 0) +
                  (Array.isArray(db.deletedArchive) ? db.deletedArchive.length : 0);
  return c.clients + c.factories + c.orders + c.payments + c.transfers + c.expenses + c.capitalMoves + deleted;
}

function hasUsefulData_(db) {
  return usefulCount_(db || {}) > 0;
}

function criticalUsefulCount_(db) {
  db = db || {};
  const c = countData_(db || {});
  const deleted = (Array.isArray(db.deletedItems) ? db.deletedItems.length : 0) +
                  (Array.isArray(db.deletedLog) ? db.deletedLog.length : 0) +
                  (Array.isArray(db.deletedArchive) ? db.deletedArchive.length : 0);
  // المصانع وحدها لا تكفي لاعتبار النسخة آمنة، لأنها ممكن تكون داتا افتراضية.
  return c.clients + c.orders + c.payments + c.transfers + c.expenses + c.capitalMoves + deleted;
}

function envelopeScore_(env) {
  const db = env && env.data ? env.data : {};
  return criticalUsefulCount_(db) * 1000 + usefulCount_(db);
}

function bestSafetyBaselineEnvelope_(currentEnvelope) {
  const storage = ensureStorage_();
  let best = {name:'current', envelope: currentEnvelope || readDatabase_(), source:'current'};
  try {
    const prev = readEnvelopeFromFile_(storage.previous);
    if (envelopeScore_(prev) > envelopeScore_(best.envelope)) best = {name:storage.previous.getName(), envelope:prev, source:'previous'};
  } catch (e) {}
  try {
    const latest = findLatestUsefulBackupFile_(storage.backups);
    if (latest && envelopeScore_(latest.envelope) > envelopeScore_(best.envelope)) best = {name:latest.file.getName(), envelope:latest.envelope, source:'backup'};
  } catch (e) {}
  return best;
}

function destructiveSafetyReport_(incomingData, currentEnvelope, request) {
  request = request || {};
  if (String(request.forceDanger || '') === 'I_UNDERSTAND_DATA_LOSS') return {ok:true, bypass:true};
  const incoming = normalizeData_(incomingData || {});
  const baseline = bestSafetyBaselineEnvelope_(currentEnvelope || readDatabase_());
  const b = countData_(baseline.envelope.data || {});
  const i = countData_(incoming);
  const bCritical = criticalUsefulCount_(baseline.envelope.data || {});
  const iCritical = criticalUsefulCount_(incoming);
  const problems = [];

  if (bCritical >= 5 && iCritical === 0) problems.push('النسخة الجديدة لا تحتوي أي بيانات تشغيل أساسية رغم وجود نسخة سابقة سليمة');
  if (bCritical >= 10 && iCritical < Math.floor(bCritical * 0.35)) problems.push('انخفاض حاد في حجم البيانات الأساسية');
  if (b.clients >= 5 && i.clients === 0) problems.push('عدد العملاء سيصبح صفر بعد أن كان ' + b.clients);
  if (b.clients >= 10 && i.clients < Math.floor(b.clients * 0.5)) problems.push('عدد العملاء انخفض من ' + b.clients + ' إلى ' + i.clients);
  if (b.payments >= 5 && i.payments === 0) problems.push('دفعات العملاء ستصبح صفر بعد أن كانت ' + b.payments);
  if (b.payments >= 8 && i.payments < Math.floor(b.payments * 0.5)) problems.push('دفعات العملاء انخفضت من ' + b.payments + ' إلى ' + i.payments);
  if (b.orders >= 3 && i.orders === 0) problems.push('الأوردرات ستصبح صفر بعد أن كانت ' + b.orders);
  if (b.orders >= 8 && i.orders < Math.floor(b.orders * 0.5)) problems.push('الأوردرات انخفضت من ' + b.orders + ' إلى ' + i.orders);
  if (b.factories >= 5 && i.factories === 0) problems.push('المصانع ستصبح صفر بعد أن كانت ' + b.factories);

  if (!problems.length) return {
    ok:true,
    baselineSource:baseline.source,
    baselineName:baseline.name,
    baselineCounts:b,
    incomingCounts:i,
    baselineCritical:bCritical,
    incomingCritical:iCritical
  };

  return {
    ok:false,
    message:'تم إيقاف الحفظ لحماية الداتا: ' + problems.join(' — ') + '. استخدم الاسترجاع من النسخة السابقة أو أحدث Backup بدل رفع النسخة الحالية.',
    problems:problems,
    baselineSource:baseline.source,
    baselineName:baseline.name,
    baselineCounts:b,
    incomingCounts:i,
    baselineCritical:bCritical,
    incomingCritical:iCritical
  };
}

function getDataProtectionStatus() {
  const storage = ensureStorage_();
  const current = readDatabase_();
  const best = bestSafetyBaselineEnvelope_(current);
  let previous = null;
  try { previous = readEnvelopeFromFile_(storage.previous); } catch (e) { previous = null; }
  return {
    ok:true,
    appVersion:HP_APP_VERSION,
    current: envelopeSummary_(storage.dbFile.getName(), current, storage.dbFile.getDateCreated().toISOString()),
    previous: previous ? envelopeSummary_(storage.previous.getName(), previous, storage.previous.getDateCreated().toISOString()) : null,
    latestUsefulBackup: latestUsefulBackupSummary_(),
    bestSafetySource: best.source,
    bestSafetyName: best.name,
    bestSafetySummary: envelopeSummary_(best.name, best.envelope, '')
  };
}

function restoreBestSafetyBackup() {
  const current = readDatabase_();
  const best = bestSafetyBaselineEnvelope_(current);
  if (!best || !best.envelope || !hasUsefulData_(best.envelope.data || {})) return {ok:false, message:'لم يتم العثور على نسخة أمان صالحة'};
  if (best.source === 'current') return responseFromEnvelope_(current);
  const res = restoreEnvelope_(best.envelope, 'restore-best-safety:' + best.name);
  if (res && res.ok) res.restoredFrom = best.name;
  return res;
}

function readEnvelopeFromFile_(file) {
  const text = file.getBlob().getDataAsString('UTF-8');
  const parsed = JSON.parse(text);
  if (parsed && parsed.format === 'HayderPackCloudDB' && parsed.data) return parseAndVerifyEnvelopeText_(text, file.getName());
  const env = makeEnvelope_(parsed || {}, 0, 'legacy-file');
  const report = validateData_(env.data);
  if (!report.ok) throw hpError_('STATE_VALIDATION_FAILED', 'النسخة غير صالحة: ' + report.errors.slice(0, 4).join(' — '));
  return env;
}

function envelopeSummary_(name, env, createdAt) {
  const counts = countData_(env.data || {});
  return {
    name: name,
    revision: Number(env.revision) || 0,
    updatedAt: env.updatedAt || '',
    createdAt: createdAt || '',
    usefulCount: usefulCount_(env.data || {}),
    counts: counts,
    checksum: checksumData_(env.data || {})
  };
}

function getRecoveryStatus() {
  const storage = ensureStorage_();
  const current = readDatabase_();
  let previous = null;
  try { previous = readEnvelopeFromFile_(storage.previous); } catch (e) { previous = null; }
  return {
    ok: true,
    appVersion: HP_APP_VERSION,
    current: envelopeSummary_(storage.dbFile.getName(), current, storage.dbFile.getDateCreated().toISOString()),
    previous: previous ? envelopeSummary_(storage.previous.getName(), previous, storage.previous.getDateCreated().toISOString()) : null,
    latestUsefulBackup: latestUsefulBackupSummary_()
  };
}

function latestUsefulBackupSummary_() {
  const storage = ensureStorage_();
  const latest = findLatestUsefulBackupFile_(storage.backups);
  if (!latest) return null;
  return envelopeSummary_(latest.file.getName(), latest.envelope, latest.file.getDateCreated().toISOString());
}

function listRecoveryBackups() {
  const storage = ensureStorage_();
  const files = [];
  const it = storage.backups.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort(function(a, b) { return b.getDateCreated().getTime() - a.getDateCreated().getTime(); });
  const result = [];
  files.slice(0, 20).forEach(function(file) {
    try {
      const env = readEnvelopeFromFile_(file);
      result.push(envelopeSummary_(file.getName(), env, file.getDateCreated().toISOString()));
    } catch (e) {
      result.push({name:file.getName(), createdAt:file.getDateCreated().toISOString(), error:e.message || 'غير صالح'});
    }
  });
  return {ok:true, backups:result};
}


function getBackupCenterStatus() {
  const storage = ensureStorage_();
  const current = readDatabase_();
  let previous = null;
  try { previous = readEnvelopeFromFile_(storage.previous); } catch (e) { previous = null; }
  const listed = listRecoveryBackups();
  return {
    ok: true,
    appVersion: HP_APP_VERSION,
    minClientAppVersion: HP_MIN_CLIENT_APP_VERSION,
    current: envelopeSummary_(storage.dbFile.getName(), current, storage.dbFile.getDateCreated().toISOString()),
    previous: previous ? envelopeSummary_(storage.previous.getName(), previous, storage.previous.getDateCreated().toISOString()) : null,
    latestUsefulBackup: latestUsefulBackupSummary_(),
    backups: listed.backups || []
  };
}

function restoreBackupByName(name) {
  name = String(name || '').trim();
  if (!name) return {ok:false, message:'لم يتم تحديد اسم النسخة'};
  if (name.indexOf('/') >= 0 || name.indexOf('\\\\') >= 0 || name.length > 160) return {ok:false, message:'اسم النسخة غير صالح'};
  const storage = ensureStorage_();
  const files = storage.backups.getFilesByName(name);
  if (!files.hasNext()) return {ok:false, message:'لم يتم العثور على النسخة المطلوبة'};
  const file = files.next();
  const env = readEnvelopeFromFile_(file);
  if (!env || !env.data || !hasUsefulData_(env.data || {})) return {ok:false, message:'تم رفض الاسترجاع لأن النسخة المختارة فارغة أو غير صالحة'};
  const res = restoreEnvelope_(env, 'restore-named-backup:' + file.getName());
  if (res && res.ok) res.restoredFrom = file.getName();
  return res;
}

function findLatestUsefulBackupFile_(folder) {
  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort(function(a, b) { return b.getDateCreated().getTime() - a.getDateCreated().getTime(); });
  for (let i = 0; i < files.length; i++) {
    try {
      const env = readEnvelopeFromFile_(files[i]);
      if (hasUsefulData_(env.data || {})) return {file: files[i], envelope: env};
    } catch (e) {}
  }
  return null;
}

function restoreEnvelope_(sourceEnvelope, label) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const current = readDatabase_();
    if (!sourceEnvelope || !sourceEnvelope.data || !hasUsefulData_(sourceEnvelope.data)) {
      return {ok:false, message:'تم رفض الاسترجاع لأن النسخة المختارة فارغة أو غير صالحة'};
    }
    const data = normalizeData_(sourceEnvelope.data);
    const report = validateData_(data);
    if (!report.ok) return {ok:false, message:'تم رفض الاسترجاع: ' + report.errors.slice(0, 5).join(' — '), report:report};
    createTimestampBackup_(current, 'BeforeRestore');
    const next = makeEnvelope_(data, (Number(current.revision) || 0) + 1, label || 'restore', current);
    writeDatabase_(current, next, true);
    return responseFromEnvelope_(next);
  } finally {
    lock.releaseLock();
  }
}

function restorePreviousDatabase() {
  const storage = ensureStorage_();
  const previous = readEnvelopeFromFile_(storage.previous);
  return restoreEnvelope_(previous, 'restore-previous');
}

function restoreLatestUsefulBackup() {
  const storage = ensureStorage_();
  const latest = findLatestUsefulBackupFile_(storage.backups);
  if (!latest) return {ok:false, message:'لم يتم العثور على Backup صالح يحتوي داتا'};
  const res = restoreEnvelope_(latest.envelope, 'restore-latest-backup:' + latest.file.getName());
  if (res && res.ok) res.restoredFrom = latest.file.getName();
  return res;
}

function createManualBackup() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const current = readDatabase_();
    const file = createTimestampBackup_(current, 'Manual');
    return {ok: true, fileName: file.getName(), createdAt: new Date().toISOString()};
  } catch (error) {
    console.error(error);
    return {ok: false, message: error.message || 'تعذر إنشاء النسخة الاحتياطية'};
  } finally {
    lock.releaseLock();
  }
}

function setupHayderPack() {
  const storage = ensureStorage_();
  return {
    ok: true,
    rootFolderName: storage.root.getName(),
    databaseFileName: storage.dbFile.getName(),
    backupFolderName: storage.backups.getName(),
    imagesFolderName: storage.images.getName(),
    databaseUrl: storage.dbFile.getUrl(),
    imagesFolderUrl: storage.images.getUrl(),
    rootFolderUrl: storage.root.getUrl()
  };
}


function sanitizeImageId_(id) {
  id = String(id || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id || id.length < 8) throw new Error('معرف الصورة غير صالح');
  return id.slice(0, 80);
}

function imageFileName_(id) {
  return 'HayderPack_Image_' + sanitizeImageId_(id) + '.json';
}

function imageSummaryFromObject_(obj, createdAt) {
  obj = obj || {};
  return {
    ok: true,
    id: obj.id || '',
    kind: obj.kind || 'image',
    name: obj.name || '',
    type: obj.type || 'image/jpeg',
    size: Number(obj.size) || (obj.data ? String(obj.data).length : 0),
    createdAt: obj.createdAt || createdAt || '',
    updatedAt: obj.updatedAt || '',
    appVersion: HP_APP_VERSION
  };
}

function readImageObject_(id) {
  const storage = ensureStorage_();
  const file = findChildFile_(storage.images, imageFileName_(id));
  if (!file) throw new Error('الصورة غير موجودة على Google');
  const obj = JSON.parse(file.getBlob().getDataAsString('UTF-8'));
  if (!obj || !obj.data || String(obj.data).indexOf('data:image/') !== 0) throw new Error('ملف الصورة غير صالح');
  obj.id = sanitizeImageId_(obj.id || id);
  return {file:file, object:obj};
}

function saveImageBlob_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const id = sanitizeImageId_(p.id || '');
    const data = String(p.data || '');
    if (data.indexOf('data:image/') !== 0) return {ok:false, message:'تم رفض الصورة لأنها ليست صورة صالحة'};
    if (data.length > HP_MAX_IMAGE_CHARS) return {ok:false, message:'حجم الصورة كبير جدًا. صغّرها أو أعد رفعها بجودة أقل'};
    const storage = ensureStorage_();
    const name = imageFileName_(id);
    const obj = {
      id:id,
      kind:String(p.kind || 'image').slice(0, 40),
      name:String(p.name || name).slice(0, 180),
      type:String(p.type || 'image/jpeg').slice(0, 80),
      size:Number(p.size) || data.length,
      data:data,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      appVersion:HP_APP_VERSION
    };
    let file = findChildFile_(storage.images, name);
    if (file) {
      let oldCreated = '';
      try { oldCreated = JSON.parse(file.getBlob().getDataAsString('UTF-8')).createdAt || ''; } catch (e) {}
      if (oldCreated) obj.createdAt = oldCreated;
      file.setContent(JSON.stringify(obj));
    } else {
      file = storage.images.createFile(name, JSON.stringify(obj), MimeType.PLAIN_TEXT);
    }
    const res = imageSummaryFromObject_(obj, file.getDateCreated().toISOString());
    res.fileName = file.getName();
    return res;
  } finally {
    lock.releaseLock();
  }
}

function getImageMeta_(id) {
  const pair = readImageObject_(id);
  const res = imageSummaryFromObject_(pair.object, pair.file.getDateCreated().toISOString());
  res.fileName = pair.file.getName();
  return res;
}

function getImageBlob_(id) {
  const pair = readImageObject_(id);
  const res = imageSummaryFromObject_(pair.object, pair.file.getDateCreated().toISOString());
  res.fileName = pair.file.getName();
  res.data = pair.object.data;
  return res;
}

function listImageBlobs_() {
  const storage = ensureStorage_();
  const out = [];
  const it = storage.images.getFiles();
  while (it.hasNext() && out.length < 100) {
    const f = it.next();
    try {
      const obj = JSON.parse(f.getBlob().getDataAsString('UTF-8'));
      const meta = imageSummaryFromObject_(obj, f.getDateCreated().toISOString());
      meta.fileName = f.getName();
      out.push(meta);
    } catch (e) {
      out.push({ok:false, fileName:f.getName(), message:e.message || 'تعذر قراءة الصورة'});
    }
  }
  return {ok:true, appVersion:HP_APP_VERSION, images:out};
}

function ensureStorage_() {
  if (HP_STORAGE_REQUEST_CACHE) return HP_STORAGE_REQUEST_CACHE;
  const props = PropertiesService.getScriptProperties();
  let root = getFolderByStoredId_(props.getProperty(HP_PROP_ROOT_FOLDER_ID));
  if (!root) {
    root = findBestRootFolder_() || DriveApp.createFolder(HP_ROOT_FOLDER_NAME);
    props.setProperty(HP_PROP_ROOT_FOLDER_ID, root.getId());
  }
  let backups = getFolderByStoredId_(props.getProperty(HP_PROP_BACKUP_FOLDER_ID));
  if (!backups) {
    backups = findChildFolder_(root, HP_BACKUP_FOLDER_NAME) || root.createFolder(HP_BACKUP_FOLDER_NAME);
    props.setProperty(HP_PROP_BACKUP_FOLDER_ID, backups.getId());
  }
  let images = getFolderByStoredId_(props.getProperty(HP_PROP_IMAGE_FOLDER_ID));
  if (!images) {
    images = findChildFolder_(root, HP_IMAGE_FOLDER_NAME) || root.createFolder(HP_IMAGE_FOLDER_NAME);
    props.setProperty(HP_PROP_IMAGE_FOLDER_ID, images.getId());
  }
  let revisions = getFolderByStoredId_(props.getProperty(HP_PROP_REVISION_FOLDER_ID));
  if (!revisions) {
    revisions = findChildFolder_(root, HP_REVISION_FOLDER_NAME) || root.createFolder(HP_REVISION_FOLDER_NAME);
    props.setProperty(HP_PROP_REVISION_FOLDER_ID, revisions.getId());
  }
  let dbFile = getFileByStoredId_(props.getProperty(HP_PROP_DB_FILE_ID));
  if (!dbFile) {
    dbFile = findChildFile_(root, HP_DB_FILE_NAME);
    if (!dbFile) dbFile = root.createFile(HP_DB_FILE_NAME, JSON.stringify(makeEnvelope_(blankData_(), 0, 'initial'), null, 2), MimeType.PLAIN_TEXT);
    props.setProperty(HP_PROP_DB_FILE_ID, dbFile.getId());
  }
  let previous = getFileByStoredId_(props.getProperty(HP_PROP_PREVIOUS_FILE_ID));
  if (!previous) {
    previous = findChildFile_(root, HP_PREVIOUS_FILE_NAME);
    if (!previous) previous = root.createFile(HP_PREVIOUS_FILE_NAME, dbFile.getBlob().getDataAsString('UTF-8'), MimeType.PLAIN_TEXT);
    props.setProperty(HP_PROP_PREVIOUS_FILE_ID, previous.getId());
  }
  HP_STORAGE_REQUEST_CACHE = {root: root, backups: backups, images: images, revisions: revisions, dbFile: dbFile, previous: previous};
  return HP_STORAGE_REQUEST_CACHE;
}

function readDatabase_() {
  const storage = ensureStorage_();
  try {
    return parseAndVerifyEnvelopeText_(storage.dbFile.getBlob().getDataAsString('UTF-8'), 'قاعدة البيانات الرئيسية');
  } catch (error) {
    console.error('Main DB read failed', error);
    throw hpError_('STATE_VALIDATION_FAILED', 'تعذر قراءة قاعدة Google الرئيسية بأمان. تم إيقاف الحفظ ولم يتم استبدالها تلقائيًا.', {databaseFile:HP_DB_FILE_NAME});
  }
}

function writeDatabase_(current, next, forceDaily) {
  const storage = ensureStorage_();
  next.data = normalizeData_(next.data || {});
  next.stateHash = stateHashData_(next.data);
  const currentText = JSON.stringify(current, null, 2);
  const nextText = JSON.stringify(next, null, 2);
  if (nextText.length > HP_MAX_JSON_CHARS) throw new Error('حجم قاعدة البيانات أصبح كبيرًا جدًا. احذف صورًا قديمة أو تواصل لتقسيم الصور عن الداتا.');
  let revisionFile = null;
  try {
    storage.previous.setContent(currentText);
    parseAndVerifyEnvelopeText_(storage.previous.getBlob().getDataAsString('UTF-8'), 'النسخة السابقة');
    createDailyBackupIfNeeded_(current, forceDaily);
    const revisionName = 'state_rev_' + String(Number(next.revision) || 0).padStart(8, '0') + '.json';
    revisionFile = storage.revisions.createFile(revisionName, nextText, MimeType.PLAIN_TEXT);
    const revisionEnvelope = parseAndVerifyEnvelopeText_(revisionFile.getBlob().getDataAsString('UTF-8'), revisionName);
    if (revisionEnvelope.stateHash !== next.stateHash || Number(revisionEnvelope.revision) !== Number(next.revision)) {
      throw hpError_('GOOGLE_DRIVE_WRITE_FAILED', 'فشل التحقق من ملف نسخة الحالة الجديدة');
    }
    storage.dbFile.setContent(nextText);
    const verified = parseAndVerifyEnvelopeText_(storage.dbFile.getBlob().getDataAsString('UTF-8'), HP_DB_FILE_NAME);
    if (verified.stateHash !== next.stateHash || Number(verified.revision) !== Number(next.revision)) {
      throw hpError_('GOOGLE_DRIVE_WRITE_FAILED', 'Google لم يؤكد تطابق قاعدة البيانات بعد الكتابة');
    }
    const props = PropertiesService.getScriptProperties();
    props.setProperty(HP_PROP_CURRENT_REVISION_FILE_ID, revisionFile.getId());
    props.setProperty(HP_PROP_CURRENT_REVISION, String(next.revision));
    if (Number(next.revision) % 10 === 0) trimRevisionFiles_(storage.revisions, HP_REVISION_RETENTION);
  } catch (error) {
    console.error('Database verified write failed', error);
    try {
      storage.dbFile.setContent(currentText);
      parseAndVerifyEnvelopeText_(storage.dbFile.getBlob().getDataAsString('UTF-8'), HP_DB_FILE_NAME + ' rollback');
    } catch (rollbackError) {
      console.error('Database rollback after failed write also failed', rollbackError);
    }
    if (error && error.category) throw error;
    throw hpError_('GOOGLE_DRIVE_WRITE_FAILED', error && error.message || 'تعذر الكتابة والتحقق من Google Drive');
  }
}

function parseAndVerifyEnvelopeText_(text, label) {
  let parsed;
  try { parsed = JSON.parse(String(text || '')); }
  catch (error) { throw hpError_('STATE_VALIDATION_FAILED', String(label || 'الملف') + ' ليس JSON صالحًا'); }
  if (!parsed || parsed.format !== 'HayderPackCloudDB' || !parsed.data) throw hpError_('STATE_VALIDATION_FAILED', 'تنسيق ' + String(label || 'قاعدة البيانات') + ' غير معروف');
  parsed.data = normalizeData_(parsed.data);
  const report = validateData_(parsed.data);
  if (!report.ok) throw hpError_('STATE_VALIDATION_FAILED', String(label || 'قاعدة البيانات') + ' بها أخطاء: ' + report.errors.slice(0, 4).join(' — '), report);
  const actualHash = stateHashData_(parsed.data);
  if (parsed.stateHash && parsed.stateHashAlgorithm === 'SHA-256-CANONICAL-V1' && String(parsed.stateHash) !== actualHash) throw hpError_('STATE_VALIDATION_FAILED', 'بصمة ' + String(label || 'قاعدة البيانات') + ' لا تطابق محتواها');
  parsed.stateHash = actualHash;
  parsed.stateHashAlgorithm = 'SHA-256-CANONICAL-V1';
  if (!Array.isArray(parsed.mutationLog)) parsed.mutationLog = [];
  return parsed;
}

function ensurePreUpgradeBackup_(current) {
  const props = PropertiesService.getScriptProperties();
  const existing = props.getProperty(HP_PROP_PRE_UPGRADE_BACKUP);
  if (existing) return existing;
  const snapshot = JSON.parse(JSON.stringify(current));
  snapshot.stateHash = stateHashData_(snapshot.data || {});
  snapshot.stateHashAlgorithm = 'SHA-256-CANONICAL-V1';
  snapshot.controls = controlTotals_(snapshot.data || {});
  snapshot.preMigrationFor = HP_APP_VERSION;
  snapshot.preMigrationCreatedAt = new Date().toISOString();
  const file = createTimestampBackup_(snapshot, 'PreUpgrade');
  const verified = readEnvelopeFromFile_(file);
  if (stateHashData_(verified.data || {}) !== stateHashData_(current.data || {})) throw hpError_('GOOGLE_DRIVE_WRITE_FAILED', 'فشل التحقق من نسخة ما قبل التحديث');
  props.setProperty(HP_PROP_PRE_UPGRADE_BACKUP, file.getName());
  return file.getName();
}

function trimRevisionFiles_(folder, keep) {
  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) {
    const file = it.next();
    if (file.getName().indexOf('state_rev_') === 0) files.push(file);
  }
  files.sort(function(a, b) { return b.getDateCreated().getTime() - a.getDateCreated().getTime(); });
  files.slice(Math.max(1, Number(keep) || HP_REVISION_RETENTION)).forEach(function(file) { file.setTrashed(true); });
}

function createDailyBackupIfNeeded_(envelope, force) {
  const props = PropertiesService.getScriptProperties();
  const day = Utilities.formatDate(new Date(), HP_TIMEZONE, 'yyyy-MM-dd');
  if (!force && props.getProperty(HP_PROP_LAST_DAILY_BACKUP) === day) return;
  const storage = ensureStorage_();
  storage.backups.createFile('HayderPack_Daily_' + day + '.json', JSON.stringify(envelope, null, 2), MimeType.PLAIN_TEXT);
  props.setProperty(HP_PROP_LAST_DAILY_BACKUP, day);
  trimBackups_(storage.backups, 'HayderPack_Daily_', 30);
}

function createTimestampBackup_(envelope, label) {
  const storage = ensureStorage_();
  const stamp = Utilities.formatDate(new Date(), HP_TIMEZONE, 'yyyy-MM-dd_HH-mm-ss');
  return storage.backups.createFile('HayderPack_' + label + '_' + stamp + '.json', JSON.stringify(envelope, null, 2), MimeType.PLAIN_TEXT);
}

function trimBackups_(folder, prefix, keep) {
  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (f.getName().indexOf(prefix) === 0) files.push(f);
  }
  files.sort(function(a, b) { return b.getDateCreated().getTime() - a.getDateCreated().getTime(); });
  files.slice(keep).forEach(function(file) { file.setTrashed(true); });
}

function makeEnvelope_(data, revision, reason, current) {
  const normalized = normalizeData_(data);
  const envelope = {
    format: 'HayderPackCloudDB',
    formatVersion: 2,
    appVersion: HP_APP_VERSION,
    schemaVersion: HP_SCHEMA_VERSION,
    revision: Number(revision) || 0,
    updatedAt: new Date().toISOString(),
    reason: reason || '',
    stateHash: stateHashData_(normalized),
    stateHashAlgorithm: 'SHA-256-CANONICAL-V1',
    updatedByMutationId: '',
    mutationLog: current && Array.isArray(current.mutationLog) ? current.mutationLog.slice(-HP_MUTATION_LOG_LIMIT) : [],
    controls: controlTotals_(normalized),
    data: normalized
  };
  return envelope;
}

/* Local-first backups are append-only snapshots. They never replace the
   production database, so a slow or lost response cannot block the user or
   overwrite another device. The token provides an idempotent receipt. */
function localFirstReceiptKey_(token) {
  return 'HP_LF_BACKUP_' + String(token || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
}

function saveLocalFirstBackupSnapshot_(request) {
  const token = String(request && request.backupToken || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  if (!token) return {ok:false, status:'rejected', message:'backupToken مطلوب'};
  const props = PropertiesService.getScriptProperties();
  const key = localFirstReceiptKey_(token);
  const prior = props.getProperty(key);
  if (prior) {
    try { return JSON.parse(prior); } catch (e) { /* recreate receipt safely */ }
  }
  const data = normalizeData_(request.data || {});
  const report = validateData_(data);
  if (!report.ok) return {ok:false, status:'rejected', message:'تم رفض Backup غير صالح: ' + report.errors.slice(0, 5).join(' — ')};
  if (!hasUsefulData_(data)) return {ok:false, status:'rejected', message:'تم منع Backup فارغ'};
  const current = readDatabase_();
  const env = makeEnvelope_(data, Number(current.revision) || 0, String(request.reason || 'local-first-backup'), current);
  env.backupToken = token;
  env.sourceMode = 'local-first';
  env.sourceAppVersion = String(request.appVersion || '');
  const file = createTimestampBackup_(env, 'LocalFirst');
  trimBackups_(ensureStorage_().backups, 'HayderPack_LocalFirst_', 10);
  const receipt = {ok:true,status:'committed',backupToken:token,createdAt:new Date().toISOString(),fileName:file.getName(),counts:countData_(data),checksum:checksumData_(data)};
  props.setProperty(key, JSON.stringify(receipt));
  return receipt;
}

function getLocalFirstBackupStatus_(token) {
  token = String(token || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  if (!token) return {ok:false,status:'unknown',message:'backupToken مطلوب'};
  const raw = PropertiesService.getScriptProperties().getProperty(localFirstReceiptKey_(token));
  if (!raw) return {ok:true,status:'processing',backupToken:token};
  try { return JSON.parse(raw); } catch (e) { return {ok:false,status:'unknown',backupToken:token,message:'تعذر قراءة إيصال الـBackup'}; }
}

function getLatestLocalFirstBackup_() {
  const folder = ensureStorage_().backups;
  const files = folder.getFiles();
  const candidates = [];
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().indexOf('HayderPack_LocalFirst_') === 0) candidates.push(file);
  }
  candidates.sort(function(a, b) { return b.getDateCreated().getTime() - a.getDateCreated().getTime(); });
  if (!candidates.length) return {ok:false, status:'not_found', message:'لا يوجد Backup خارجي Local-first صالح حتى الآن'};

  for (let i = 0; i < candidates.length; i++) {
    const file = candidates[i];
    try {
      const env = parseAndVerifyEnvelopeText_(file.getBlob().getDataAsString('UTF-8'), 'Backup Local-first');
      const data = normalizeData_(env.data || {});
      const report = validateData_(data);
      if (!report.ok || !hasUsefulData_(data)) continue;
      return {
        ok:true,
        status:'available',
        fileName:file.getName(),
        createdAt:env.updatedAt || file.getDateCreated().toISOString(),
        sourceAppVersion:env.sourceAppVersion || env.appVersion || '',
        counts:countData_(data),
        checksum:checksumData_(data),
        data:data
      };
    } catch (error) {
      // Try the next newest Local-first snapshot instead of blocking recovery.
    }
  }
  return {ok:false, status:'invalid', message:'تم العثور على Backups خارجية، لكن لا توجد نسخة سليمة قابلة للاسترجاع'};
}

function responseFromEnvelope_(envelope) {
  return {
    ok: true,
    revision: Number(envelope.revision) || 0,
    updatedAt: envelope.updatedAt || '',
    appVersion: envelope.appVersion || HP_APP_VERSION,
    backendVersion: HP_APP_VERSION,
    schemaVersion: Number(envelope.schemaVersion) || HP_SCHEMA_VERSION,
    counts: countData_(envelope.data || {}),
    checksum: checksumData_(envelope.data || {}),
    stateHash: envelope.stateHash || stateHashData_(envelope.data || {}),
    updatedByMutationId: envelope.updatedByMutationId || '',
    data: envelope.data
  };
}


function countData_(db) {
  db = db || {};
  return {
    clients: Array.isArray(db.clients) ? db.clients.length : 0,
    factories: Array.isArray(db.factories) ? db.factories.length : 0,
    orders: Array.isArray(db.orders) ? db.orders.length : 0,
    payments: Array.isArray(db.payments) ? db.payments.length : 0,
    transfers: Array.isArray(db.transfers) ? db.transfers.length : 0,
    expenses: Array.isArray(db.expenses) ? db.expenses.length : 0,
    capitalMoves: Array.isArray(db.capitalMoves) ? db.capitalMoves.length : 0
  };
}

function checksumData_(db) {
  const text = JSON.stringify(normalizeData_(db || {}));
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8);
}

function controlTotals_(db) {
  db = normalizeData_(db || {});
  function n(value) { const number = Number(value); return isFinite(number) ? number : 0; }
  function money(value) { return Math.round((n(value) + Number.EPSILON) * 100) / 100; }
  function orderQty(order) { return n(order && order.fQty) > 0 ? n(order.fQty) : n(order && order.qty); }
  function discount(order) { return Math.max(0, n(order && (order.invoiceDiscount != null ? order.invoiceDiscount : order.discount))); }
  function customerOrderValue(order) { return money(Math.max(0, orderQty(order) * n(order && order.price) + n(order && order.aklashe) - discount(order))); }
  function factoryOrderCost(order) { return money(n(order && order.fQty) * n(order && order.fPrice) + n(order && order.fAk)); }
  function sum(list, getter) { return money((Array.isArray(list) ? list : []).reduce(function(total, item) { return total + n(getter(item)); }, 0)); }

  const orderTotals = sum(db.orders, customerOrderValue);
  const factoryCosts = sum(db.orders, factoryOrderCost);
  const paymentTotals = sum(db.payments, function(item) { return item.amount; });
  const deposits = sum(db.orders, function(item) { return item.deposit; });
  const factoryPaymentTotals = sum(db.transfers, function(item) { return item.amount; });
  const expenseTotals = sum(db.expenses, function(item) { return item.amount; });
  const householdExpenseTotals = sum(db.houseExpenses, function(item) { return item.amount; });
  const clientOpening = sum(db.clients, function(item) { return item.debt; });
  const factoryOpening = sum(db.factories, function(item) { return item.debt; });
  const customerBalances = money(orderTotals + clientOpening - deposits - paymentTotals);
  const factoryBalances = money(factoryCosts + factoryOpening - factoryPaymentTotals);
  const profitTotals = money(orderTotals - factoryCosts);
  const profitAfterHousehold = money(profitTotals - householdExpenseTotals);

  const wallet = db.settings && db.settings.v56Wallet || {};
  const openingDate = String(wallet.openingDate || '');
  function inLiquidityRange(item) { const date = String(item && item.date || ''); return !openingDate || !date || date >= openingDate; }
  const liquidityDeposits = sum((db.orders || []).filter(inLiquidityRange), function(item) { return item.deposit; });
  const liquidityPayments = sum((db.payments || []).filter(inLiquidityRange), function(item) { return item.amount; });
  const liquidityFactory = sum((db.transfers || []).filter(inLiquidityRange), function(item) { return item.amount; });
  const liquidityExpenses = sum((db.expenses || []).filter(inLiquidityRange), function(item) { return item.amount; });
  const liquidityHouse = sum((db.houseExpenses || []).filter(inLiquidityRange), function(item) { return item.amount; });
  const adjustments = money((db.walletAdjustments || []).filter(inLiquidityRange).reduce(function(total, item) { return total + (item.type === 'out' ? -n(item.amount) : n(item.amount)); }, 0));
  const capitalEffect = money((db.capitalMoves || []).filter(inLiquidityRange).reduce(function(total, item) {
    const type = String(item.type || ''), value = n(item.amount);
    if (type === 'owner_add' || type === 'loan_in' || type === 'lend_repay') return total + value;
    if (type === 'owner_withdraw' || type === 'loan_repay' || type === 'lend_out') return total - value;
    return total;
  }, 0));
  const liquidity = money(n(wallet.openingLiquidity) + liquidityDeposits + liquidityPayments + adjustments + capitalEffect - liquidityFactory - liquidityExpenses - liquidityHouse);

  return {
    counts:Object.assign(countData_(db), {
      documents:Array.isArray(db.documents) ? db.documents.length : 0,
      houseExpenses:Array.isArray(db.houseExpenses) ? db.houseExpenses.length : 0,
      walletAdjustments:Array.isArray(db.walletAdjustments) ? db.walletAdjustments.length : 0,
      archivedOrders:(db.orders || []).filter(function(order) { return !!order.archived; }).length,
      deliveredOrders:(db.orders || []).filter(function(order) { return order.status === 'تم التوصيل للعميل'; }).length
    }),
    totals:{
      orderTotals:orderTotals,
      factoryCosts:factoryCosts,
      paymentTotals:paymentTotals,
      deposits:deposits,
      factoryPaymentTotals:factoryPaymentTotals,
      expenseTotals:expenseTotals,
      householdExpenseTotals:householdExpenseTotals,
      profitTotals:profitTotals,
      profitAfterHousehold:profitAfterHousehold,
      customerBalances:customerBalances,
      factoryBalances:factoryBalances,
      liquidity:liquidity
    }
  };
}

function blankData_() {
  return {
    clients: [], factories: [], orders: [], payments: [], transfers: [], expenses: [], capitalMoves: [],
    settings: {autoSync: false, extraMonths: [], lastSeenMonth: Utilities.formatDate(new Date(), HP_TIMEZONE, 'yyyy-MM')},
    _id: 1, version: HP_SCHEMA_VERSION
  };
}

function normalizeData_(input) {
  const db = JSON.parse(JSON.stringify(input || {}));
  ['clients','factories','orders','payments','transfers','expenses','capitalMoves','documents','houseExpenses','walletAdjustments','deletedItems','deletedLog','deletedArchive'].forEach(function(key) {
    if (!Array.isArray(db[key])) db[key] = [];
  });
  if (!db.settings || typeof db.settings !== 'object' || Array.isArray(db.settings)) db.settings = {};
  delete db.settings.dataSafety;
  delete db.settings.googleClientId;
  db.settings.autoSync = false;
  if (!Array.isArray(db.settings.extraMonths)) db.settings.extraMonths = [];
  db._id = Number(db._id) || 1;
  db.version = Math.max(Number(db.version) || 0, HP_SCHEMA_VERSION);
  return db;
}

function validateData_(db) {
  const errors = [], warnings = [];
  const counts = {clients:db.clients.length,factories:db.factories.length,orders:db.orders.length,payments:db.payments.length,transfers:db.transfers.length,expenses:db.expenses.length};
  function idsFor(arr, label) {
    const set = {};
    arr.forEach(function(item, i) {
      if (!item || typeof item !== 'object') { errors.push(label + ' رقم ' + (i + 1) + ' غير صالح'); return; }
      const id = String(item.id || '');
      if (!id) errors.push(label + ' رقم ' + (i + 1) + ' بدون ID');
      else if (set[id]) errors.push('ID مكرر في ' + label + ': ' + id);
      else set[id] = true;
    });
    return set;
  }
  function finiteNonNegative(v) { if (v === null || v === undefined || v === '') return true; const n = Number(v); return isFinite(n) && n >= 0; }
  function validDate(v) { return !v || /^\d{4}-\d{2}-\d{2}$/.test(String(v)); }
  const clientIds = idsFor(db.clients, 'العملاء');
  const factoryIds = idsFor(db.factories, 'المصانع');
  const orderIds = idsFor(db.orders, 'الأوردرات');
  idsFor(db.payments, 'دفعات العملاء'); idsFor(db.transfers, 'تحويلات المصانع'); idsFor(db.expenses, 'المصروفات'); idsFor(db.capitalMoves, 'حركات رأس المال');
  const codes = {};
  db.orders.forEach(function(o, i) {
    const label = 'الأوردر رقم ' + (i + 1), code = String(o.code || '').trim();
    if (!code) warnings.push(label + ' بدون كود'); else if (codes[code]) errors.push('كود أوردر مكرر: ' + code); else codes[code] = true;
    if (!clientIds[String(o.clientId || '')]) errors.push((code || label) + ' مرتبط بعميل غير موجود');
    if (!factoryIds[String(o.factoryId || '')]) errors.push((code || label) + ' مرتبط بمصنع غير موجود');
    ['qty','fQty','price','aklashe','deposit','fPrice','fAk'].forEach(function(k) { if (!finiteNonNegative(o[k])) errors.push((code || label) + ' به قيمة غير صحيحة في ' + k); });
    if (!validDate(o.date)) warnings.push((code || label) + ' به تاريخ غير قياسي');
  });
  db.clients.forEach(function(c) { if (!String(c.name || '').trim()) warnings.push('عميل بدون اسم: ' + String(c.id || '')); if (!finiteNonNegative(c.debt)) errors.push('مديونية عميل غير صحيحة: ' + String(c.name || c.id || '')); });
  db.factories.forEach(function(f) { if (!String(f.name || '').trim()) warnings.push('مصنع بدون اسم: ' + String(f.id || '')); if (!finiteNonNegative(f.debt)) errors.push('مديونية مصنع غير صحيحة: ' + String(f.name || f.id || '')); });
  db.payments.forEach(function(p) { if (!clientIds[String(p.clientId || '')]) errors.push('دفعة مرتبطة بعميل غير موجود: ' + String(p.id || '')); if (!finiteNonNegative(p.amount) || Number(p.amount) <= 0) errors.push('قيمة دفعة غير صحيحة: ' + String(p.id || '')); if (!validDate(p.date)) warnings.push('تاريخ دفعة غير قياسي: ' + String(p.id || '')); });
  db.transfers.forEach(function(t) { if (!factoryIds[String(t.factoryId || '')]) errors.push('تحويل مرتبط بمصنع غير موجود: ' + String(t.id || '')); if (!finiteNonNegative(t.amount) || Number(t.amount) <= 0) errors.push('قيمة تحويل غير صحيحة: ' + String(t.id || '')); if (!validDate(t.date)) warnings.push('تاريخ تحويل غير قياسي: ' + String(t.id || '')); });
  db.expenses.forEach(function(e) { if (e.orderId && !orderIds[String(e.orderId)]) warnings.push('مصروف مرتبط بأوردر غير موجود: ' + String(e.id || '')); if (!finiteNonNegative(e.amount) || Number(e.amount) <= 0) errors.push('قيمة مصروف غير صحيحة: ' + String(e.id || '')); if (!validDate(e.date)) warnings.push('تاريخ مصروف غير قياسي: ' + String(e.id || '')); });
  db.capitalMoves.forEach(function(m) { if (!finiteNonNegative(m.amount) || Number(m.amount) <= 0) errors.push('قيمة حركة رأس مال غير صحيحة: ' + String(m.id || '')); if (!validDate(m.date)) warnings.push('تاريخ حركة رأس مال غير قياسي: ' + String(m.id || '')); });
  (db.houseExpenses || []).forEach(function(item) { if (!finiteNonNegative(item.amount) || Number(item.amount) <= 0) warnings.push('قيمة مصروف بيت تاريخية غير قياسية: ' + String(item.id || '')); if (!validDate(item.date)) warnings.push('تاريخ مصروف بيت غير قياسي: ' + String(item.id || '')); });
  (db.walletAdjustments || []).forEach(function(item) { if (!finiteNonNegative(item.amount) || Number(item.amount) <= 0) warnings.push('قيمة تسوية سيولة تاريخية غير قياسية: ' + String(item.id || '')); if (!validDate(item.date)) warnings.push('تاريخ تسوية سيولة غير قياسي: ' + String(item.id || '')); });
  return {ok: errors.length === 0, errors: errors, warnings: warnings, counts: counts};
}

function getFolderByStoredId_(id) { if (!id) return null; try { return DriveApp.getFolderById(id); } catch (e) { return null; } }
function getFileByStoredId_(id) { if (!id) return null; try { return DriveApp.getFileById(id); } catch (e) { return null; } }
function findFirstFolderByName_(name) { const it = DriveApp.getFoldersByName(name); return it.hasNext() ? it.next() : null; }
function findChildFolder_(parent, name) { const it = parent.getFoldersByName(name); return it.hasNext() ? it.next() : null; }
function findChildFile_(parent, name) { const it = parent.getFilesByName(name); return it.hasNext() ? it.next() : null; }

function findBestRootFolder_() {
  const it = DriveApp.getFoldersByName(HP_ROOT_FOLDER_NAME);
  let best = null, bestRevision = -1, bestUseful = -1;
  while (it.hasNext()) {
    const folder = it.next();
    const file = findChildFile_(folder, HP_DB_FILE_NAME);
    if (!file) {
      if (!best) best = folder;
      continue;
    }
    try {
      const parsed = JSON.parse(file.getBlob().getDataAsString('UTF-8'));
      const data = parsed && parsed.data ? normalizeData_(parsed.data) : normalizeData_(parsed || {});
      const revision = Number(parsed && parsed.revision) || 0;
      const useful = usefulCount_(data);
      if (revision > bestRevision || (revision === bestRevision && useful > bestUseful)) {
        best = folder;
        bestRevision = revision;
        bestUseful = useful;
      }
    } catch (error) {
      console.error('Skipped unreadable Hayder Pack root candidate', error);
    }
  }
  return best;
}

// Run once as the Drive owner after reviewing the deployment permissions.
function installHaydarDailyBackup() {
  const handler = 'runHaydarDailyBackup';
  const triggers = ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction() === handler;
  });
  if (triggers.length) return;
  ScriptApp.newTrigger(handler).timeBased().atHour(3).everyDays(1).inTimezone(HP_TIMEZONE).create();
}

function runHaydarDailyBackup() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const day = Utilities.formatDate(new Date(), HP_TIMEZONE, 'yyyy-MM-dd');
    const folder = ensureStorage_().backups;
    const name = 'HayderPack_Scheduled_' + day + '.json';
    if (folder.getFilesByName(name).hasNext()) return;
    const snapshot = getLatestLocalFirstBackup_();
    const envelope = snapshot.ok
      ? makeEnvelope_(snapshot.data, 0, 'scheduled-local-first-backup')
      : readDatabase_();
    if (!hasUsefulData_(envelope.data)) return;
    folder.createFile(name, JSON.stringify(envelope, null, 2), MimeType.PLAIN_TEXT);
    trimBackups_(folder, 'HayderPack_Scheduled_', 30);
  } finally {
    lock.releaseLock();
  }
}
