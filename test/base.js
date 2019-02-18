import test from 'ava'
import sinon from 'sinon'
import { VCli, Command } from '..'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

test.serial('run specified command', async (t) => {
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
