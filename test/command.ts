import test from 'ava'
import * as sinon from 'sinon'
import { Cli, Command, FlagType} from '..'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

test.serial('parse flags: define', async (t) => {
  const spy = sinon.spy()

  class BuildCommand extends Command {
    static flags = {
      boolean: {
        type: FlagType.boolean,
      },
      string: {
        type: FlagType.string,
      },
      number: {
        type: FlagType.number,
      },
      booleanArray: {
        type: FlagType.boolean_array,
      },
      stringArray: {
        type: FlagType.string_array,
      },
      numberArray: {
        type: FlagType.number_array,
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build', '')

  t.deepEqual(spy.firstCall.args[0], {})

  t.pass()
})

test.serial('parse flags: types', async (t) => {
  const spy = sinon.spy()

  class BuildCommand extends Command {
    static flags = {
      boolean: {
        type: FlagType.boolean,
      },
      string: {
        type: FlagType.string,
      },
      number: {
        type: FlagType.number,
      },
      booleanArray: {
        type: FlagType.boolean_array,
      },
      stringArray: {
        type: FlagType.string_array,
      },
      numberArray: {
        type: FlagType.number_array,
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build', '--boolean --string 123 --number 456 --boolean-array true --boolean-array false --string-array a --string-array 1 --number-array 1 --number-array 2 --undefined')

  t.deepEqual(spy.firstCall.args[0], {
    boolean: true,
    string: '123',
    number: 456,
    booleanArray: [true, false],
    stringArray: ['a', '1'],
    numberArray: [1, 2],
  })

  t.pass()
})

test.serial('parse flags: default', async (t) => {
  const spy = sinon.spy()

  class BuildCommand extends Command {
    static flags = {
      boolean: {
        type: FlagType.boolean,
        default: true,
      },
      string: {
        type: FlagType.string,
        default: 'A',
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build', '')

  t.deepEqual(spy.firstCall.args[0], {
    boolean: true,
    string: 'A',
  })

  t.pass()
})

test.serial('parse flags: alias', async (t) => {
  const spy = sinon.spy()

  class BuildCommand extends Command {
    static flags = {
      boolean: {
        type: FlagType.boolean,
        alias: 'b',
      },
      string: {
        type: FlagType.string,
        alias: 's',
      },
      number: {
        type: FlagType.number,
        alias: ['n'],
      },
      booleanArray: {
        type: FlagType.boolean_array,
        alias: 'x',
      },
      stringArray: {
        type: FlagType.string_array,
        alias: 'y',
      },
      numberArray: {
        type: FlagType.number_array,
        alias: ['z'],
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build', '--b -s 123 -n 456 -x true -x false -y a -y 1 -z 1 --number-array 2 --undefined')

  t.deepEqual(spy.firstCall.args[0], {
    boolean: true,
    string: '123',
    number: 456,
    booleanArray: [true, false],
    stringArray: ['a', '1'],
    numberArray: [1, 2],
  })

  t.pass()
})

test.serial('parse flags: validate', async (t) => {
  const spy = sinon.spy()

  class BuildCommand extends Command {
    static flags = {
      string: {
        type: FlagType.string,
        validate: (v: string) => v.length > 5,
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli {
    static app = 'cli'
  }

  await t.throwsAsync(async () => {
    await run(t, Cli, BuildCommand, 'build', '--string 12345')
  })

  await run(t, Cli, BuildCommand, 'build', '--string 123456')

  t.deepEqual(spy.firstCall.args[0], {
    string: '123456',
  })

  t.pass()
})

test.serial('parse flags: filter', async (t) => {
  const spy = sinon.spy()

  class BuildCommand extends Command {
    static flags = {
      string: {
        type: FlagType.string,
        filter: (v: string) => `0${v}`,
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build', '--string 12345')

  t.deepEqual(spy.firstCall.args[0], {
    string: '012345',
  })

  t.pass()
})
