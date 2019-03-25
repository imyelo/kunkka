import * as importCwd from 'import-cwd'

export const parseShortcut = function (line: string | [string] | [string, any]) {
  let name, options
  if (Array.isArray(line)) {
    [name, options] = line
  } else {
    name = line
  }
  return {
    module: importCwd(name),
    name,
    options,
  }
}
