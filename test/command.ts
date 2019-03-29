import test from 'ava'
import * as sinon from 'sinon'
import { Cli, Command, FlagType} from '..'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

test.serial('parse flags', async (t) => {
  const spy = sinon.spy()

  class BuildCommand extends Command {
    static flags = {
      debug: {
        type: FlagType.boolean,
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build', '--debug --foo')

  t.deepEqual(spy.firstCall.args[0], {
    debug: true,
  })

  t.pass()
})
