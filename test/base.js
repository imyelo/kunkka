import test from 'ava'
import sinon from 'sinon'
import proxy from 'proxyquire'
import MemoryFS from 'memory-fs'

test.beforeEach((t) => {
  const fs = new MemoryFS()
  fs['@global'] = true
  fs['@noCallThru'] = true

  t.context.module = proxy.load('..', {
    fs,
  })

  t.context.fs = fs

  t.context.stubs = new Map()
  t.context.stubs.set('cwd', sinon.stub(process, 'cwd').returns('/'))
  t.context.stubs.set('argv', sinon.stub(process, 'argv'))

  t.context.spies = new Map()
})

test.afterEach.always((t) => {
  for (let stub of t.context.stubs.values()) {
    stub.restore()
  }
  for (let spy of t.context.spies.values()) {
    spy.restore()
  }
})

function run (t, Cli, Command, commandName) {
  t.context.stubs.get('argv').value(['', '', commandName])
  return new Promise((resolve) => {
    const cli = new Cli()
    cli.plugins.add({
      apply (api) {
        api.registerCommand(commandName, Command)
      },
    })
    cli.hooks.add('exit', () => {
      resolve()
    })
  })
}

test.serial('run specified command', async (t) => {
  const { VCli, Command } = t.context.module
  const spy = sinon.spy()

  class BuildCommand extends Command {
    run () {
      spy()
    }
  }

  class Cli extends VCli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build')

  t.true(spy.calledOnce, 'command should ran once')

  t.pass()
})

test.serial('parse .{appname}rc', async (t) => {
  const { VCli, Command } = t.context.module
  const { fs } = t.context
  const spy = sinon.spy()

  const RC = {
    name: 'hi',
  }

  fs.writeFileSync('/.clirc', JSON.stringify(RC))

  class BuildCommand extends Command {
    run () {
      spy(this.config)
    }
  }

  class Cli extends VCli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build')

  t.true(spy.calledWith(RC), 'config should be parsed')

  t.pass()
})
