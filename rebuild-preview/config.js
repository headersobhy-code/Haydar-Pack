// يمكن تغيير رابط النسخ الاحتياطي لكل جهاز من الإعدادات.
window.HP_BACKUP_DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbz-SghE63_75pj2O1QrKbQR-rmFNKQXunOfkgnmZYyAJL32BlXuwNHp_bTth2fSdm3hOQ/exec';
window.HPPreviewStorage = {
  getItem(key) { return window.localStorage.getItem('haydar-preview:' + key); },
  setItem(key, value) { window.localStorage.setItem('haydar-preview:' + key, value); },
  removeItem(key) { window.localStorage.removeItem('haydar-preview:' + key); }
};
window.HPPreviewIndexedDB = {
  open(name, ...args) { return window.indexedDB.open('haydar-preview:' + name, ...args); },
  deleteDatabase(name) { return window.indexedDB.deleteDatabase('haydar-preview:' + name); }
};
