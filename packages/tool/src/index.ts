import type { ChatCompletionTool } from 'openai/resources/chat/completions'
import { type Info, store, toolMetadataAtom, toolsAtom } from './internal'
import type { BaseToolWithCall, ToolMetadata } from 'llamaindex'
import { atom } from 'jotai/vanilla'

export type {
  Info
}

/**
 * @internal
 */
export function injectMetadata (
  metadata: ToolMetadata,
  info: Info
) {
  store.get(toolMetadataAtom).push([metadata, info])
}

export function registerTools (
  fns: Record<string, (...args: any[]) => any>
) {
  store.set(
    toolsAtom,
    fns
  )
}

const openaiToolsAtom = atom<ChatCompletionTool[]>(get => {
  const metadata = get(toolMetadataAtom)
  return metadata.map(([metadata]) => ({
    type: 'function',
    function: {
      parameters: metadata.parameters,
      name: metadata.name,
      description: metadata.description
    }
  }))
})

const llamaindexToolsAtom = atom<BaseToolWithCall[]>(get => {
  const metadata = get(toolMetadataAtom)
  const fns = get(toolsAtom)
  return metadata.map(([metadata, info]) => ({
    call: (input: Record<string, unknown>) => {
      const args = Object.entries(info.parameterMapping).
        reduce((arr, [name, idx]) => {
          arr[idx] = input[name]
          return arr
        }, [] as unknown[])
      const fn = fns[metadata.name]
      if (!fn) {
        throw new Error(`Cannot find function to call: ${metadata.name}`)
      }
      return fn(...args)
    },
    metadata
  }))
})

export function convertTools (
  format: 'openai'
): ChatCompletionTool[];
export function convertTools (
  format: 'llamaindex'
): BaseToolWithCall[];
export function convertTools (
  format: string
): ChatCompletionTool[] | BaseToolWithCall[] {
  switch (format) {
    case 'openai': {
      return store.get(openaiToolsAtom)
    }
    case 'llamaindex': {
      return store.get(llamaindexToolsAtom)
    }
  }
  throw new Error(`Unknown format: ${format}`)
}