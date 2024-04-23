import * as Tools from './index.llama.js'
import { convertTools, registerTools } from '@llamaindex/tool'
import { OpenAI } from 'openai'
import { inspect } from 'node:util'
import { OpenAIAgent } from 'llamaindex'

registerTools(Tools)
const openai = new OpenAI()
{
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: 'What\'s my current weather?'
      }],
    tools: convertTools('openai')
  })

  console.log('response:',
    inspect(response, { depth: Number.MAX_VALUE, colors: true }))
}
{
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: 'What\'s the weather in London?'
      }],
    tools: convertTools('openai')
  })

  console.log('response:',
    inspect(response, { depth: Number.MAX_VALUE, colors: true }))
}
{
  const agent = new OpenAIAgent({
    tools: convertTools('llamaindex')
  })
  const response = await agent.chat({
    message: 'What\'s my current weather?'
  })
  console.log('response:',
    inspect(response, { depth: Number.MAX_VALUE, colors: true }))
}