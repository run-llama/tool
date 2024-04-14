# @llamaindex/tool

> Transform JS function for LLM tool call.

- ✅OpenAI
- 🚧ClaudeAI
- ✅LlamaIndexTS
- 🚧LangChainJS

## Usage

### In your code

```ts
// @file: index.llama.ts
export function getWeather(city: string) {
  return `The weather in ${city} is sunny.`
}
export function getTemperature(city: string) {
  return `The temperature in ${city} is 25°C.`
}
export function getCurrentCity() {
  return 'New York'
}
// @file: app.ts
import Tools from './index.llama'
import { registerTools, convertTools } from '@llamaindex/tool'
// Register tools on top level
registerTools(Tools)

import { OpenAI } from 'openai'
const openai = new OpenAI()
openai.chat.completions.create({
  messages: [
    {
      role: 'user',
      content: 'What is the weather in the current city?'
    }
  ],
  tools: convertTools('openai')
})

// or you can use llamaindex openai agent
import { OpenAIAgent } from 'llamaindex'
const agent = new OpenAIAgent({
  tools: convertTools('llamaindex')
})
const { response } = await agent.chat({
  message: 'What is the temperature in the current city?'
})
console.log('Response:', response)
```

### Run with Node.js

```shell
node --import tsx --import @llamaindex/tool/register ./app.ts
```

### Vite (WIP)

```ts
import { defineConfig } from 'vite'
import tool from '@llamaindex/tool/vite'

export default defineConfig({
  plugins: [
    tool()
  ]
})
```

### Next.js (WIP)

```ts
// next.config.js
const withTool = require('@llamaindex/tool/next')

const config = {
  // Your Next.js config
}
module.exports = withTool(config)
```
