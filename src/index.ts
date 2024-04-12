import { ChatCompletionTool } from 'openai/resources/chat/completions'
import { Info, store, toolMetadataAtom, toolsAtom } from './internal'
import { BaseTool, ToolMetadata } from 'llamaindex'

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

export function getTools (
  format: 'openai'
): ChatCompletionTool[];
export function getTools (
  format: 'llamaindex'
): BaseTool[];
export function getTools (
  format: string
): ChatCompletionTool[] | BaseTool[] {
  switch (format) {
    case 'openai': {
      return store.get(toolMetadataAtom).
        map<ChatCompletionTool>(([metadata]) => ({
          type: 'function',
          function: {
            parameters: metadata.parameters,
            name: metadata.name,
            description: metadata.description
          }
        }))
    }
    case 'llamaindex': {
      const fns = store.get(toolsAtom)
      return store.get(toolMetadataAtom).map(([metadata, info]) => ({
        call: (input: Record<string, unknown>) => {
          const args = Object.entries(info.parameterMapping).
            reduce((arr, [name, idx]) => {
              arr[idx] = input[name]
              return arr
            }, [] as unknown[])
          console.debug('find function:', metadata.name, args)
          const fn = fns[metadata.name]
          if (!fn) {
            throw new Error(`Cannot find function to call: ${metadata.name}`)
          }
          return fn(...args)
        },
        metadata
      }))
    }
  }
  throw new Error(`Unknown format: ${format}`)
}