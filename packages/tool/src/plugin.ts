import { createWebpackPlugin, type UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import { parseRoot } from './compiler'
import type { Compiler } from 'webpack'
import type {
  JSONSchema7,
  JSONSchema7Definition,
  JSONSchema7TypeName
} from 'json-schema'
import type { Info } from './internal'
import type { ToolMetadata } from 'llamaindex'

export interface Options {

}

const roots: string[] = []

const name = 'llama-index-tool'

export const unpluginFactory: UnpluginFactory<Options | undefined> = options => ({
  name,
  transformInclude (id) {
    const isTool =  /tool\.tsx?$/.test(id)
    if (isTool) {
      roots.push(id)
    }
    return isTool;
  },
  async transform (code, id) {
    if (roots.includes(id)) {
      const json = await parseRoot(id)
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
          code = `injectMetadata(${JSON.stringify(
              metadata)}, ${JSON.stringify(info)});\n` +
            code
        })
      }
      if (!/^import\s+{\sinjectMetadata\s}\s+from\s+['"]@llamaindex\/tool['"]/.test(code)) {
        code = `import {injectMetadata} from '@llamaindex/tool';\n${code}`
      }
      return {
        code,
        map: null
      }
    }
  },
  webpack(compiler: Compiler) {
    if (compiler.options.mode === 'development') {
      compiler.hooks.done.tap(name, async (state) => {
        if (state.hasErrors()) {
          return
        }
      })
    }
  },
})

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

export const webpackPlugin = createWebpackPlugin(unpluginFactory)
