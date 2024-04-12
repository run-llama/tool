import { atom, createStore } from 'jotai/vanilla'
import { ToolMetadata } from 'llamaindex'

export type Info = {
  parameterMapping: Record<string, number>
}

export const store = createStore()
export const toolMetadataAtom = atom<[ToolMetadata, Info][]>([])
export const toolsAtom = atom<Record<string, (...args: any[]) => any>>({})