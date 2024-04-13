import type { LoadHook } from 'node:module'
import type {
  JSONSchema7,
  JSONSchema7Definition,
  JSONSchema7TypeName
} from 'json-schema'
import { stat } from 'node:fs/promises'
import { parse } from '@swc/core'
import type {
  ExportDeclaration,
  ImportDeclaration,
  ExpressionStatement
} from '@swc/types'
import { parseRoot } from './compiler'
import type { ToolMetadata } from 'llamaindex'
import type { Info } from '.'

export const load: LoadHook = async (url, context, nextLoad) => {
  const output = await nextLoad(url, context)
  if (typeof output.source === 'string') {
    const m = await parse(output.source)
    const importNodes = m.body.filter(
      (node): node is ImportDeclaration => node.type === 'ImportDeclaration')
    const exportNodes = m.body.filter(
      (node): node is ExportDeclaration => node.type === 'ExportDeclaration')
    const hasRegisterTool = importNodes.find(
      node => node.source.value === '@llamaindex/tool' &&
        node.specifiers.find(specifier =>
          specifier.type === 'ImportSpecifier' &&
          specifier.local.value === 'registerTools'
        )
    )
    if (hasRegisterTool) {
      // if injectMetadata is not called, inject it
      if (
        importNodes.find(node =>
          node.source.value === '@llamaindex/tool' &&
          node.specifiers.find(specifier =>
            specifier.type === 'ImportSpecifier' &&
            specifier.local.value === 'injectMetadata'
          )
        ) === undefined
      ) {
        output.source = `import { injectMetadata } from "@llamaindex/tool";` +
          output.source
      }
      // user register tools, find target import file
      const [callExpression, ...rest] = m.body.filter(
        (node): node is ExpressionStatement => node.type ===
          'ExpressionStatement' &&
          node.expression.type === 'CallExpression' &&
          node.expression.callee.type === 'Identifier' &&
          node.expression.callee.value === 'registerTools'
      )
      if (rest.length !== 0) {
        // todo: support register multiple times
        console.warn('registerTools should be only called once')
      }
      if (callExpression && callExpression.expression.type ===
        'CallExpression') {
        const arg = callExpression.expression.arguments[0]
        if (!arg) {
          throw new Error('registerTools should have one argument')
        }
        if (arg.expression.type === 'Identifier') {
          const id = arg.expression.value
          const node = importNodes.find(node =>
            node.specifiers.find(specifier => specifier.local.value === id)
          )
          if (!node) {
            throw new Error('Cannot find import node')
          }
          const source = node.source.value
          const baseUrl = new URL('./', url)
          let targetFile = new URL(source, baseUrl).pathname
          const extensions = ['.ts']
          for (const ext of extensions) {
            try {
              await stat(targetFile + ext)
              targetFile += ext
              break
            } catch (e) {
              if (e && typeof e === 'object' && 'code' in e && e.code !==
                'ENOENT') {
                throw e
              }
            }
          }
          const json = await parseRoot(targetFile)
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
              output.source = `\ninjectMetadata(${JSON.stringify(
                  metadata)}, ${JSON.stringify(info)});\n` +
                output.source
            })
          }
        }
      }
    }
  }

  return output
}