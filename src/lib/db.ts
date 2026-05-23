const DB_NAME = 'HabitLoopDB';
const STORE_NAME = 'keyvalue';
const DB_VERSION = 2;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Recovers a value by key from IndexedDB.
 */
export async function getVal<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve((req.result as T) || null);
      };
      req.onerror = () => {
        reject(req.error);
      };
    });
  } catch (error) {
    console.warn(`IndexedDB getVal query failed for key "${key}" (falling back):`, error);
    return null;
  }
}

/**
 * Saves a value by key into IndexedDB.
 */
export async function setVal(key: string, val: any): Promise<void> {
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(val, key);
      req.onsuccess = () => {
        resolve();
      };
      req.onerror = () => {
        reject(req.error);
      };
    });
  } catch (error) {
    console.warn(`IndexedDB setVal write failed for key "${key}":`, error);
  }
}

/**
 * Removes a value by key from IndexedDB.
 */
export async function delVal(key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn(`IndexedDB delVal failed for key "${key}":`, error);
  }
}

/**
 * Completely clears all key-value entries.
 */
export async function clearAllVal(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('IndexedDB clearAllVal failed:', error);
  }
}
