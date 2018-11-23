const path = require('path');
const pluginTester = require('babel-plugin-tester');
const plugin = require('babel-plugin-macros');

pluginTester({
  plugin,
  pluginName: 'Hooks macro ›',
  snapshot: true,
  tests: withFilename([
    {
      title: 'Throws if not called as function',
      error: true,
      code: `
        import { useAutoMemo } from './hooks.macro'

        console.log(useAutoMemo);
      `,
    },
    {
      title: 'Works with null',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const result = useAutoMemo(null);
        }
      `,
    },
    {
      title: 'Works with null returning arrow',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const result = useAutoMemo(() => null);
        }
      `,
    },
    {
      title: 'Works with external value',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          const result = useAutoMemo(value);
        }
      `,
    },
    {
      title: 'Works with external value returning arrow',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          const result = useAutoMemo(() => value);
        }
      `,
    },
    {
      title: 'Works with external obj',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = { a: { b: { c: 12 }} };
          const result = useAutoMemo(value.a['b'].c);
        }
      `,
    },
    {
      title: 'Works with external obj returning arrow',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = { a: { b: { c: 12 }} };
          const result = useAutoMemo(() => value.a['b'].c);
        }
      `,
    },
    {
      title: 'Skips out of component bindings',
      code: `
        import { useAutoMemo } from './hooks.macro'

        const value = { a: { b: { c: 12 }} };

        function FakeComponent() {
          const result = useAutoMemo(() => value.a['b'].c);
        }
      `,
    },
    {
      title: 'Skips internal bindings',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = [1, 2, 3];
          const result = useAutoMemo(() => value.map(v => v * 2));
        }
      `,
    },
    {
      title: 'Skips internal bindings with omonims',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const v = 12;
          const value = [1, 2, 3];
          const result = useAutoMemo(() => value.map(v => v * 2));
        }
      `,
    },
    {
      title: 'Skips internal destructuring bindings with omonims',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const v = 12;
          const value = [1, 2, 3];
          const result = useAutoMemo(() => {
            const [v] = value;
            return v;
          });
        }
      `,
    },
    {
      title: 'Skips internal const bindings with omonims',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const v = 12;
          const result = useAutoMemo(() => {
            const v = 42;
            return v;
          });
        }
      `,
    },
    {
      title: 'Skips globals',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const result = useAutoMemo(() => window.innerHeight);
        }
      `,
    },
    {
      title: 'Works with function calls',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          function callback() {}
          const result = useAutoMemo(() => callback());
        }
      `,
    },
    {
      title: 'Works with function expressions',
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
    {
      title: 'Works with multiple identical expressions',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          const result = useAutoMemo(value * value);
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
