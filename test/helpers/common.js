import fs from 'fs-extra'
import tempy from 'tempy'
import sinon from 'sinon'

export const setup = (t) => {
  const cwd = tempy.directory()

  t.context.cwd = cwd

  t.context.stubs = new Map()
  t.context.stubs.set('cwd', sinon.stub(process, 'cwd').returns(cwd))
  t.context.stubs.set('argv', sinon.stub(process, 'argv'))

  t.context.spies = new Map()
}

export const teardown = async (t) => {
  await fs.remove(t.context.cwd)
  for (let stub of t.context.stubs.values()) {
    stub.restore()
  }
  for (let spy of t.context.spies.values()) {
    spy.restore()
  }
}

export const run = function (t, Cli, Command, commandName, args = '') {
  t.context.stubs.get('argv').value([
    '',
    '',
    commandName,
    ...args.split(' ').filter(Boolean),
  ])
  return new Promise((resolve) => {
    const cli = new Cli()
    cli.plugins.set({
      apply (api) {
        api.registerCommand(commandName, Command)
      },
    })
    cli.hooks.add('exit', () => {
      resolve()
    })
  })
}
