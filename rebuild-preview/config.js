// ضع رابط نشر Apps Script المخصص لهذه النسخة بعد ضبط صلاحيات الوصول.
window.HP_APPS_SCRIPT_URL = '';
window.HPPreviewStorage = {
  getItem(key) { return window.localStorage.getItem('haydar-preview:' + key); },
  setItem(key, value) { window.localStorage.setItem('haydar-preview:' + key, value); },
  removeItem(key) { window.localStorage.removeItem('haydar-preview:' + key); }
};
window.HPPreviewIndexedDB = {
  open(name, ...args) { return window.indexedDB.open('haydar-preview:' + name, ...args); },
  deleteDatabase(name) { return window.indexedDB.deleteDatabase('haydar-preview:' + name); }
};
