import { parseArgs } from 'node:util'
import OpenAI from 'openai'

const cwd = process.cwd()
const { values } = parseArgs({
  options: {
    id: {
      type: 'string'
    },
    tools: {
      type: 'string',
      short: 't'
    },
    toolsDist: {
      type: 'string',
      short: 'd'
    }
  }
})

if (!values.id) {
  throw new Error('id is required')
}

const toolsFilePath = values.tools
if (!toolsFilePath) {
  throw new Error('tools file is required')
}

const toolsDistFilePath = values.toolsDist
if (!toolsDistFilePath) {
  throw new Error('tools dist is required')
}
const toolsDistFile = join(cwd, toolsDistFilePath)

import { join } from 'node:path'
import { parseRoot } from '../compiler'
import type {
  JSONSchema7,
  JSONSchema7Definition,
  JSONSchema7TypeName
} from 'json-schema'
import type { Info } from '../internal'
import type { ToolMetadata } from 'llamaindex'
import { registerTools, injectMetadata, convertTools } from '../index'

const toolsFile = join(cwd, toolsFilePath)

const json = await parseRoot(toolsFile)
const children = json.children
if (Array.isArray(children)) {
  const schema = {
    type: 'object',
    properties: {} as {
      [key: string]: JSONSchema7Definition
    },
    additionalItems: false,
    required: [] as string[]
  } satisfies JSONSchema7
  const info: Info = {
    parameterMapping: {}
  }
  children.forEach(child => {
    const metadata: ToolMetadata = {
      name: child.name,
      description: '',
      parameters: schema
    }
    child.signatures?.forEach(signature => {
      const description = signature.comment?.summary.map(x => x.text).
        join('\n')
      if (description) {
        metadata.description += description
      }
      signature.parameters?.map((parameter, idx) => {
        if (parameter.type?.type === 'intrinsic') {
          // parameter.type.name
          schema.properties[parameter.name as string] = {
            type: parameter.type.name as JSONSchema7TypeName,
            description: parameter.comment?.summary.map(x => x.text).
              join('\n')
          } as JSONSchema7Definition
          schema.required.push(parameter.name as string)
          info.parameterMapping[parameter.name as string] = idx
        }
      })
    })
    injectMetadata(metadata, info)
  })
}

// fixme: migrate to toolsFile
const record = await import(toolsDistFile)
registerTools(record)
const tools = convertTools('llamaindex')

const openai = new OpenAI()

const thread = await openai.beta.threads.create({})
const threadId = thread.id

process.on('beforeExit', () => {
  openai.beta.threads.del(threadId)
})

import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import type {
  RunSubmitToolOutputsParams
} from 'openai/resources/beta/threads/runs/runs'
import type { AssistantStream } from 'openai/lib/AssistantStream'

const rl = readline.createInterface({ input, output })

async function handleStream (
  stream: AssistantStream
) {
  for await (const { event, data } of stream) {
    switch (event) {
      case 'thread.message.delta': {
        data.delta.content?.forEach((content) => {
          if (content.type === 'text' && content.text?.value) {
            rl.write(content.text.value)
          }
        })
      }
      case 'thread.run.requires_action': {
        if (data.object === 'thread.run') {
          if (data.required_action?.submit_tool_outputs.tool_calls) {
            const toolCalls = data.required_action.submit_tool_outputs.tool_calls
            const toolOutputs: RunSubmitToolOutputsParams.ToolOutput[] = []
            for (const toolCall of toolCalls) {
              const input = JSON.parse(toolCall.function.arguments)
              const tool = tools.find(
                tool => tool.metadata.name === toolCall.function.name)
              if (!tool) {
                throw new Error(`Cannot find tool: ${toolCall.function.name}`)
              }
              const output = await tool.call(input)
              toolOutputs.push({ tool_call_id: toolCall.id, output })
            }
            const stream = openai.beta.threads.runs.submitToolOutputsStream(
              threadId,
              data.id, {
                tool_outputs: toolOutputs
              }
            )
            return handleStream(stream)
          }
        }
      }
    }
  }
}

while (true) {
  const q = await rl.question('Question: ')

  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: q
  })

  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: values.id
  })

  await handleStream(stream)
  rl.write('\n')
}