import test from 'ava'
import * as sinon from 'sinon'
import { Cli, Command, FlagType } from '..'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

test.serial('parse flags: define', async (t) => {
  const spy = sinon.spy()

  class BuildCommand extends Command<never> {
    static flags = {
      boolean: {
        type: FlagType.Boolean,
      },
      string: {
        type: FlagType.String,
      },
      number: {
        type: FlagType.Number,
      },
      booleanArray: {
        type: FlagType.BooleanArray,
      },
      stringArray: {
        type: FlagType.StringArray,
      },
      numberArray: {
        type: FlagType.NumberArray,
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli<never> {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build', '')

  t.deepEqual(spy.firstCall.args[0], {})

  t.pass()
})

test.serial('parse flags: types', async (t) => {
  const spy = sinon.spy()

  class BuildCommand extends Command<never> {
    static flags = {
      boolean: {
        type: FlagType.Boolean,
      },
      string: {
        type: FlagType.String,
      },
      number: {
        type: FlagType.Number,
      },
      booleanArray: {
        type: FlagType.BooleanArray,
      },
      stringArray: {
        type: FlagType.StringArray,
      },
      numberArray: {
        type: FlagType.NumberArray,
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli<never> {
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

  class BuildCommand extends Command<never> {
    static flags = {
      boolean: {
        type: FlagType.Boolean,
        default: true,
      },
      string: {
        type: FlagType.String,
        default: 'A',
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli<never> {
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

  class BuildCommand extends Command<never> {
    static flags = {
      boolean: {
        type: FlagType.Boolean,
        alias: 'b',
      },
      string: {
        type: FlagType.String,
        alias: 's',
      },
      number: {
        type: FlagType.Number,
        alias: ['n'],
      },
      booleanArray: {
        type: FlagType.BooleanArray,
        alias: 'x',
      },
      stringArray: {
        type: FlagType.StringArray,
        alias: 'y',
      },
      numberArray: {
        type: FlagType.NumberArray,
        alias: ['z'],
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli<never> {
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

  class BuildCommand extends Command<never> {
    static flags = {
      string: {
        type: FlagType.String,
        validate: (v: string) => v.length > 5,
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli<never> {
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

  class BuildCommand extends Command<never> {
    static flags = {
      string: {
        type: FlagType.String,
        filter: (v: string) => `0${v}`,
      },
    }
    async run () {
      spy(this.flags)
    }
  }

  class MyCli extends Cli<never> {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build', '--string 12345')

  t.deepEqual(spy.firstCall.args[0], {
    string: '012345',
  })

  t.pass()
})
