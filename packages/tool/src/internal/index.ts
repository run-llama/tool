import { atom, createStore } from 'jotai/vanilla'
import type { ToolMetadata } from 'llamaindex'

export type Info = {
  originalFunction?: (...args: any[]) => any
  parameterMapping: Record<string, number>
}

export const store = createStore()
export const toolMetadataAtom = atom<[ToolMetadata, Info][]>([])
export const toolsAtom = atom<Record<string, (...args: any[]) => any>>({})
