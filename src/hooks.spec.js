const path = require('path');
const pluginTester = require('babel-plugin-tester');
const plugin = require('babel-plugin-macros');

pluginTester({
  plugin,
  pluginName: 'Hooks macro ›',
  snapshot: true,
  tests: withFilename([
    {
      title: 'Throws if not called as function (useAutoMemo)',
      error: true,
      snapshot: false,
      code: `
        import { useAutoMemo } from './hooks.macro'
        console.log(useAutoMemo);
      `,
    },
    {
      title: 'Throws if not called as function (useAutoCallback)',
      error: true,
      snapshot: false,
      code: `
        import { useAutoCallback } from './hooks.macro'
        console.log(useAutoCallback);
      `,
    },
    {
      title: 'Throws if not called as function (useAutoEffect)',
      error: true,
      snapshot: false,
      code: `
        import { useAutoEffect } from './hooks.macro'
        console.log(useAutoEffect);
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
      title: 'Works with external obj and conflicting bindings',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const a = 12;
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
    {
      title: 'Works with values from props',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ propValue }) {
          const result = useAutoMemo(() => propValue);
        }
      `,
    },
    {
      title: 'Works with funcs from props',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ onSomething }) {
          const value = 12;
          const result = useAutoMemo(() => onSomething(value));
        }
      `,
    },
    {
      title: 'Works with funcs from props, again',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ onSomething }) {
          const value = 12;
          const result = useAutoMemo(() => { onSomething(value) });
        }
      `,
    },
    {
      title: 'Works with indirect dependencies (function declaration)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          const result = useAutoMemo(() => getDoubleValue());

          function getDoubleValue() {
            return value * 2;
          }
        }
      `,
    },
    {
      title: 'Works with indirect dependencies (function expression)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          const getDoubleValue = function() {
            return value * 2;
          }

          const result = useAutoMemo(() => getDoubleValue());
        }
      `,
    },
    {
      title: 'Works with indirect dependencies (arrow with expr)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          const getDoubleValue = () => value * 2;
          const result = useAutoMemo(() => getDoubleValue());
        }
      `,
    },
    {
      title: 'Works with indirect dependencies (arrow with body)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          const getDoubleValue = () => {
            return value * 2;
          }
          const result = useAutoMemo(() => getDoubleValue());
        }
      `,
    },
    {
      title: 'Works with indirect `let` dependencies (arrow with expr)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          let getDoubleValue = () => value * 2;
          const result = useAutoMemo(() => getDoubleValue());
        }
      `,
    },
    {
      title: 'Works with indirect `let` dependencies (arrow with body)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          let getDoubleValue = () => {
            return value * 2;
          }
          const result = useAutoMemo(() => getDoubleValue());
        }
      `,
    },
    {
      title: 'Works with doubly indirect dependencies',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = 12;
          function getValue() {
            return value;
          }
          function getDoubleValue() {
            return getValue() * 2;
          }
          const result = useAutoMemo(() => getDoubleValue());
        }
      `,
    },
    {
      title: 'Works with doubly indirect dependencies on props',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ getValue }) {
          function getDoubleValue() {
            return getValue() * 2;
          }
          const result = useAutoMemo(() => getDoubleValue());
        }
      `,
    },
    {
      // This test should error, since there’s an access-before-define
      title: 'Is not confused by later bindings',
      skip: true,
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ value }) {
          const result = useAutoMemo(() => something());
          const something = () => value;
        }
      `,
    },
    {
      title: 'Does not create a double require() with named hook import',
      code: `
        import { useMemo } from 'react';
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ value }) {
          return useAutoMemo(() => value);
        }
      `,
    },
    {
      title: 'Does not create a double require() with default React import',
      code: `
        import React from 'react';
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ value }) {
          return useAutoMemo(() => value);
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
