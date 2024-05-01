'use server'
import { OpenAIAgent } from 'llamaindex/agent/openai'
// import your tools on top, that's it
import '@/tool/index.tool'
import { convertTools } from '@llamaindex/tool'
import type { JSX } from 'react'
import {
  createStreamableUI,
} from 'ai/rsc'
import { runWithStreamableUI } from '@/context'

export async function chatWithAI (
  message: string,
): Promise<JSX.Element> {
  const agent = new OpenAIAgent(
    {
      tools: convertTools('llamaindex')
    }
  )
  const uiStream = createStreamableUI()
  runWithStreamableUI(uiStream, () => agent.chat({
    stream: true,
    message,
  }).then(async (responseStream) => {
      return responseStream.pipeTo(
        new WritableStream({
          start: () => {
            uiStream.append('\n')
          },
          write: async (message) => {
            uiStream.append(message.response.delta)
          },
          close: () => {
            uiStream.done()
          }
        })
      )
    }
  )).catch(uiStream.error)
  return uiStream.value
}