/// <reference types="vite/client" />

import type { PencilApi } from '../electron/preload'

declare global {
  interface Window {
    pencil: PencilApi
  }
}

export {}
