import { useEffect, useState } from 'react'

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem('ketchup-os:' + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function useStorage<T>(key: string, fallback: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    const initial = typeof fallback === 'function' ? (fallback as () => T)() : fallback
    return readStorage(key, initial)
  })
  const [storageError, setStorageError] = useState(false)
  useEffect(() => {
    try {
      localStorage.setItem('ketchup-os:' + key, JSON.stringify(value))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [key, value])
  return [value, setValue, storageError] as const
}
