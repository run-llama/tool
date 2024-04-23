import { parseArgs } from 'node:util'
import { join } from 'node:path'
import { parseRoot } from '../compiler'
import type {
  JSONSchema7,
  JSONSchema7Definition,
  JSONSchema7TypeName
} from 'json-schema'
import type { Info } from '../internal'
import type { ToolMetadata } from 'llamaindex'
import { convertTools, injectMetadata } from '../index'
import OpenAI from 'openai'

const cwd = process.cwd()
const { values } = parseArgs({
  options: {
    tools: {
      type: 'string',
      short: 't'
    }
  }
})

const toolsFilePath = values.tools
if (!toolsFilePath) {
  throw new Error('tools file is required')
}

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

const tools = convertTools('openai')

const openai = new OpenAI()

const result = await openai.beta.assistants.create({
  model: 'gpt-3.5-turbo',
  tools
})

console.log('Successfully created assistant:', result.id)
