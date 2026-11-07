/* IndexedDB persistence for NEXUS content (notes, tasks, stats, documents...).
   Preferences live in localStorage; this store is for the larger, structured data.
   Falls back to localStorage if IndexedDB is unavailable. */

const DB_NAME = 'nexus-hub'
const DB_VERSION = 1
const STORE = 'state'
const KEY = 'nexus-content'
const FALLBACK_KEY = 'nexus.content.fallback.v1'

let dbPromise = null

function openDatabase() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponible'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB error'))
    request.onblocked = () => reject(new Error('IndexedDB bloquée'))
  })
  return dbPromise
}

export async function readContent() {
  try {
    const db = await openDatabase()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(KEY)
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
}

export async function writeContent(value) {
  try {
    const db = await openDatabase()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(value, KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    return { backend: 'indexeddb' }
  } catch {
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(value))
      return { backend: 'localstorage' }
    } catch {
      return { backend: 'memory' }
    }
  }
}

export async function clearContent() {
  try {
    const db = await openDatabase()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(FALLBACK_KEY)
  } catch {
    /* ignore */
  }
}
