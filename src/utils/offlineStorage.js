import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const STORAGE_KEY = 'sheetflow_offline_records';
const FILE_NAME = 'sheetflow_records.json';
const QUEUE_KEY = 'sheetflow_pending_sync';

/**
 * Saves transactions to multi-tiered persistent Android device memory:
 * 1. Synchronous localStorage for instant access
 * 2. Capacitor Preferences (Android SharedPreferences - persists across phone reboots)
 * 3. Capacitor Filesystem (Android sandboxed internal Directory.Data - persists indefinitely)
 */
export async function saveOfflineTransactions(transactions) {
  if (!transactions) return;

  const jsonString = JSON.stringify(transactions);

  // 1. Instant local storage cache
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, jsonString);
    }
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  // 2. Android SharedPreferences (Persistent across reboots)
  try {
    await Preferences.set({
      key: STORAGE_KEY,
      value: jsonString,
    });
  } catch (e) {
    console.warn('Preferences save error:', e);
  }

  // 3. Android Internal Storage (Directory.Data - permanent file storage)
  try {
    await Filesystem.writeFile({
      path: FILE_NAME,
      data: jsonString,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
  } catch (e) {
    console.warn('Filesystem save error:', e);
  }
}

/**
 * Loads transactions from Android device memory even without internet or Google Sheets.
 * Reads in order of reliability: Preferences -> Filesystem -> localStorage
 */
export async function loadOfflineTransactions() {
  // 1. Check Capacitor Preferences (SharedPreferences)
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Preferences read error:', e);
  }

  // 2. Check Android Directory.Data file storage
  try {
    const fileResult = await Filesystem.readFile({
      path: FILE_NAME,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    if (fileResult && fileResult.data) {
      const strData = typeof fileResult.data === 'string' ? fileResult.data : '';
      if (strData) {
        const parsed = JSON.parse(strData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    // File may not exist yet on fresh install, this is expected
  }

  // 3. Fallback to localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const localVal = window.localStorage.getItem(STORAGE_KEY);
      if (localVal) {
        const parsed = JSON.parse(localVal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }

  return [];
}

/**
 * Queue an offline action (create, update, delete) to sync when Google Sheets is reachable.
 */
export async function enqueueOfflineAction(action) {
  try {
    const existingQueue = await getOfflinePendingQueue();
    existingQueue.push({
      ...action,
      queuedAt: Date.now(),
    });
    const queueStr = JSON.stringify(existingQueue);
    await Preferences.set({ key: QUEUE_KEY, value: queueStr });
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(QUEUE_KEY, queueStr);
    }
  } catch (e) {
    console.warn('Failed to enqueue offline action:', e);
  }
}

/**
 * Get pending sync queue
 */
export async function getOfflinePendingQueue() {
  try {
    const { value } = await Preferences.get({ key: QUEUE_KEY });
    if (value) {
      return JSON.parse(value) || [];
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      const local = window.localStorage.getItem(QUEUE_KEY);
      if (local) return JSON.parse(local) || [];
    }
  } catch (e) {
    console.warn('Failed to read offline queue:', e);
  }
  return [];
}

/**
 * Clear pending sync queue after successful sync
 */
export async function clearOfflinePendingQueue() {
  try {
    await Preferences.remove({ key: QUEUE_KEY });
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(QUEUE_KEY);
    }
  } catch (e) {
    console.warn('Failed to clear offline queue:', e);
  }
}

/**
 * Syncs any pending offline actions to Google Sheets once connection is restored
 */
export async function syncPendingOfflineActions(sheetApiUrl) {
  const queue = await getOfflinePendingQueue();
  if (!queue || queue.length === 0) return;

  const failedItems = [];

  for (const item of queue) {
    try {
      await fetch(sheetApiUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
    } catch (err) {
      console.warn('Sync pending item failed, will retry later:', err);
      failedItems.push(item);
    }
  }

  if (failedItems.length > 0) {
    const queueStr = JSON.stringify(failedItems);
    await Preferences.set({ key: QUEUE_KEY, value: queueStr });
  } else {
    await clearOfflinePendingQueue();
  }
}
