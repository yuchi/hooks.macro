const path = require('path');
const pluginTester = require('babel-plugin-tester');
const plugin = require('babel-plugin-macros');

pluginTester({
  plugin,
  pluginName: 'Hooks macro',
  snapshot: true,
  tests: withFilename([
    {
      name: 'Throws if not called as function',
      error: true,
      code: `
        import { useAutoMemo } from './hooks.macro'

        console.log(useAutoMemo);
      `,
    },
    {
      name: 'Works with null',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const result = useAutoMemo(null);
        }
      `,
    },
    {
      name: 'Works with null returning arrow',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const result = useAutoMemo(() => null);
        }
      `,
    },
    {
      name: 'Works with external value',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          const result = useAutoMemo(value);
        }
      `,
    },
    {
      name: 'Works with external value returning arrow',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          const result = useAutoMemo(() => value);
        }
      `,
    },
    {
      name: 'Works with external obj',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = { a: { b: { c: 12 }} };
          const result = useAutoMemo(value.a['b'].c);
        }
      `,
    },
    {
      name: 'Works with external obj returning arrow',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = { a: { b: { c: 12 }} };
          const result = useAutoMemo(() => value.a['b'].c);
        }
      `,
    },
    {
      name: 'Skips out of component bindings',
      code: `
        import { useAutoMemo } from './hooks.macro'

        const value = { a: { b: { c: 12 }} };

        function FakeComponent() {
          const result = useAutoMemo(() => value.a['b'].c);
        }
      `,
    },
    {
      name: 'Works with function calls',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          function callback() {}
          const result = useAutoMemo(() => callback());
        }
      `,
    },
    {
      name: 'Works with function experssions',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          const result = useAutoMemo(function hallo() {
            return value * 2;
          });
        }
      `,
    },
  ]),
});

function withFilename(tests) {
  const cases = Array.isArray(tests)
    ? tests
    : Object.entries(tests).map(([name, code]) => ({ name, code }));

  return cases.map(t => {
    const test = { babelOptions: { filename: __filename } };
    if (typeof t === 'string') {
      test.code = t;
    } else {
      Object.assign(test, t);
    }

    return test;
  });
}
