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
})

test.afterEach.always((t) => {
  for (let stub of t.context.stubs.values()) {
    stub.restore()
  }
})


test.serial('base', async (t) => {
  const { VCli, Command } = t.context.module
  const { fs, stubs } = t.context
  const spy = sinon.spy()

  fs.writeFileSync('/.clirc', JSON.stringify({
    name: 'hi',
  }))
  stubs.get('argv').value(['', '', 'build'])

  class BuildCommand extends Command {
    run () {
      spy()
    }
  }

  const plugin = {
    apply (api) {
      api.registerCommand('build', BuildCommand)
    }
  }

  class Cli extends VCli {
    static app = 'cli'
  }

  const cli = new Cli()
  cli.plugins.add(plugin)

  await new Promise((resolve, reject) => {
    cli.hooks.add('exit', () => {
      resolve()
    })
  })

  t.true(spy.calledOnce)

  t.pass()
})
