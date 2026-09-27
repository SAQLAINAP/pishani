import { useSyncExternalStore } from 'react'
import { store } from './storage'

export function useSave() {
  return useSyncExternalStore(store.subscribe, store.get)
}
