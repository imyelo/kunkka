import test from 'ava'
import * as sinon from 'sinon'
import { Cli, Command } from '..'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

test.serial('run specified command', async (t) => {
  const spy = sinon.spy()

  class BuildCommand extends Command {
    async run () {
      spy()
    }
  }

  class MyCli extends Cli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build')

  t.true(spy.calledOnce, 'command should ran once')

  t.pass()
})
