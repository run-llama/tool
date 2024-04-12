# @llamaindex/tool

> Transform JS function for LLM tool call.

- ✅OpenAI
- 🚧ClaudeAI
- ✅LlamaIndexTS
- 🚧LangChainJS

## Usage

### Node.js

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
