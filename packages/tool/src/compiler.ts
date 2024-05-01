import td from 'typedoc'

export async function parseRoot (
  entryPoint: string
) {
  const app = await td.Application.bootstrapWithPlugins({
    entryPoints: [entryPoint]
  }, [
    new td.TypeDocReader(),
    new td.PackageJsonReader(),
    new td.TSConfigReader()
  ])
  const project = await app.convert()

  if (project) {
    return app.serializer.projectToObject(project, process.cwd())
  }
  throw new Error('Failed to parse root')
}