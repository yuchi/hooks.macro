const path = require('path');
const pluginTester = require('babel-plugin-tester').default;
const plugin = require('babel-plugin-macros');

const REACT_IMPORTS = [
  // Working imports
  {
    name: 'default import',
    import: `import React from 'react';`,
    prefix: 'React.',
    supported: true,
  },
  {
    name: 'namespace import',
    import: `import * as React from 'react';`,
    prefix: 'React.',
    supported: true,
  },
  {
    name: 'named import',
    import: `import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';`,
    prefix: '',
    supported: true,
  },
  {
    name: 'renamed default import',
    import: `import Baz from 'react';`,
    prefix: `Baz.`,
    supported: true,
  },
  {
    name: 'renamed namespace import',
    import: `import * as Baz from 'react';`,
    prefix: `Baz.`,
    supported: true,
  },
  {
    name: 'global variable access',
    import: ``,
    prefix: `React.`,
    supported: true,
  },
  // Skipped imports
  {
    name: 'wrong default/namespace import',
    import: `import { Foo } from 'react';`,
    prefix: 'Foo.',
    supported: false,
  },
  {
    name: 'extraneous default import',
    import: `import Foo from 'foo';`,
    prefix: 'Foo.',
    supported: false,
  },
  {
    name: 'extraneous global access',
    import: ``,
    prefix: 'Foo.',
    supported: false,
  },
];

pluginTester({
  plugin,
  pluginName: 'Hooks macro ›',
  snapshot: true,
  babelOptions: {
    plugins: [
      '@babel/plugin-syntax-jsx',
      '@babel/plugin-syntax-do-expressions',
    ],
    filename: __filename,
  },
  tests: [
    ...[
      'useAutoMemo',
      'useAutoCallback',
      'useAutoEffect',
      'useAutoLayoutEffect',
    ].map(macroName => ({
      title: `Throws if not called as function (${macroName})`,
      error: true,
      snapshot: false,
      code: `
        import { ${macroName} } from './hooks.macro'
        console.log(${macroName});
      `,
    })),
    ...['useAutoCallback', 'useAutoEffect', 'useAutoLayoutEffect'].map(
      macroName => ({
        title: `Throws if not called with a function (${macroName})`,
        error: true,
        snapshot: false,
        code: `
        import { ${macroName} } from './hooks.macro'
        function FakeComponent() {
          ${macroName}(12);
        }
      `,
      }),
    ),
    ...['useAutoCallback', 'useAutoEffect', 'useAutoLayoutEffect'].map(
      macroName => ({
        title: `Throws if called without arguments (${macroName})`,
        error: true,
        snapshot: false,
        code: `
        import { ${macroName} } from './hooks.macro'
        function FakeComponent() {
          ${macroName}();
        }
      `,
      }),
    ),
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
          const value = useSomething(12);
          const result = useAutoMemo(value);
        }
      `,
    },
    {
      title: 'Works with external value returning arrow',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = useSomething(12);
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
          const a = useSomething(12);
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
          const v = useSomething(12);
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
          const v = useSomething(12);
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
          const v = useSomething(12);
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
          const value = useSomething(12);
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
          const value = useSomething(12);
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
          const value = useSomething(12);
          const result = useAutoMemo(() => onSomething(value));
        }
      `,
    },
    {
      title: 'Works with funcs from props, again',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ onSomething }) {
          const value = useSomething(12);
          const result = useAutoMemo(() => { onSomething(value) });
        }
      `,
    },
    {
      title: 'Works with indirect dependencies (function declaration)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const value = useSomething(12);
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
          const value = useSomething(12);
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
          const value = useSomething(12);
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
          const value = useSomething(12);
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
          const value = useSomething(12);
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
          const value = useSomething(12);
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
          const value = useSomething(12);
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
      title:
        'Works with indirect dependencies (arrow, without call expression)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ values, whitelist }) {
          const valid = value => whitelist.includes(value);
          const goodValues = useAutoMemo(values.filter(valid));
        }
      `,
    },
    {
      title:
        'Works with indirect dependencies (function expression, without call expression)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ values, whitelist }) {
          const valid = function valid(value) {
            return whitelist.includes(value);
          };
          const goodValues = useAutoMemo(values.filter(valid));
        }
      `,
    },
    {
      title:
        'Works with indirect dependencies (function declaration, without call expression)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ values, whitelist }) {
          const goodValues = useAutoMemo(values.filter(valid));
          function valid(value) {
            return whitelist.includes(value);
          }
        }
      `,
    },
    {
      title: 'Works with variables used as JSX tags',
      code: `
        import { useAutoMemo } from './hooks.macro'

        const Comp1 = () => null;
        const Comp2 = () => null;

        function FakeComponent({ prop }) {
          const Component = prop ? Comp1 : Comp2;
          return useAutoMemo(<Component />);
        }
      `,
    },
    {
      title: 'Works with variables used as JSX tags (member access)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        const Comp1 = () => null;
        const Comp2 = () => null;

        function FakeComponent({ prop }) {
          const Config = { component: prop ? Comp1 : Comp2 };
          return useAutoMemo(<Config.component />);
        }
      `,
    },
    {
      title: 'Is not confused by native JSX tags',
      code: `
        import { useAutoMemo } from './hooks.macro'

        const Comp1 = () => null;
        const Comp2 = () => null;

        function FakeComponent({ prop }) {
          const div = 'hallo';
          const Component = prop ? Comp1 : Comp2;
          return useAutoMemo(<div><Component /></div>);
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
      title: 'Is not confused by re-assignments',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ value }) {
          let fn = () => value;
          fn = 14;
          return useAutoMemo(() => fn());
        }
      `,
    },
    {
      title: 'Is not confused by block scopes',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ propValue = 2 }) {
          const outer = useSomething(3);
          {
            const inner = useSomething(7);
            const result = useAutoMemo(outer * inner * propValue);
          }
        }
      `,
    },
    {
      title: 'Is not confused by omonims in other block scopes',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          {
            const inner = useSomething(7);
            const result = useAutoMemo(inner * other);
          }
          {
            const other = useSomething(6);
          }
        }
      `,
    },
    {
      title: 'Is not confused by do expression scopes',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ propValue = 2 }) {
          const outer = useSomething(3);
          const result = do {
            const inner = useSomething(7);
            useAutoMemo(outer * inner * propValue);
          }
        }
      `,
    },
    {
      title: 'Is not confused by do expression scopes (with shadowing)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        const shadow = 12;
        function FakeComponent({ propValue = 2 }) {
          const result = do {
            const shadow = useSomething(7);
            useAutoMemo(shadow * propValue);
          }
          useAutoMemo(shadow * propValue);
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
    {
      title: 'Skips numeric constants',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const literal = 3.5;
          const value = useSomething(12);
          return useAutoMemo(() => literal * value);
        }
      `,
    },
    {
      title: 'Skips immutable constants',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          const number = 3.5;
          const string = 'hallo';
          const nullish = null;
          const value = useSomething(12);
          return useAutoMemo(() => [value, number, string, nullish]);
        }
      `,
    },
    {
      title: 'Is not confused by default assignments',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ number = 12 }) {
          return useAutoMemo(() => number);
        }
      `,
    },
    {
      title: 'Is not confused by re-assignments over literal',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent() {
          let literal = 3.5;
          literal = Math.random();
          const value = useSomething(12);
          return useAutoMemo(() => literal * value);
        }
      `,
    },
    {
      title: 'Is not confused by self-recursive function (directly called)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ propValue }) {
          return useAutoMemo(fibonacci(propValue));
          function fibonacci(n) {
            return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
          }
        }
      `,
    },
    {
      title: 'Is not confused by self-recursive function (indirectly called)',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ propValue }) {
          return useAutoMemo(calculate());
          function calculate() {
            return fibonacci(propValue);
          }
          function fibonacci(n) {
            return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
          }
        }
      `,
    },
    {
      title: 'Is not confused by indirect recursive functions',
      code: `
        import { useAutoMemo } from './hooks.macro'

        function FakeComponent({ propValue }) {
          return useAutoMemo(first());
          function first() {
            return propValue > 0 ? second() : propValue + 1;
          }
          function second() {
            return propValue < 0 ? first() : propValue + 2;
          }
        }
      `,
    },
    ...REACT_IMPORTS.map(imp => ({
      title: `${
        imp.supported ? 'Skips' : 'Keeps'
      } known static hooks’ values (${imp.name})`,
      code: `
        ${imp.import}
        import { useAutoCallback, useAutoEffect, useAutoMemo } from './hooks.macro';

        function FakeComponent() {
          const ref = ${imp.prefix}useRef(false);
          const [c, setC] = ${imp.prefix}useState(0);
          const [s, dispatch] = ${imp.prefix}useReducer((s, a) => s + a, 0);

          useAutoEffect(() => {
            setC(c => c + 1);
            dispatch(41);
          });

          const handleSomething = useAutoCallback(() => {
            setC(s + 123);
            dispatch(c + 123);
            ref.current = true;
          });

          return useAutoMemo(c + s);
        }
      `,
    })),
    ...REACT_IMPORTS.map(imp => ({
      title: `Is not confused by re-assigned known static hooks’ values (${imp.name})`,
      code: `
        ${imp.import}
        import { useAutoCallback, useAutoEffect, useAutoMemo } from './hooks.macro';

        function FakeComponent() {
          let [c, setC] = ${imp.prefix}useState(0);

          if (c > 4) {
            setC = console.log;
          }

          useAutoEffect(() => {
            setC(123);
          });
        }
      `,
    })),
    ...REACT_IMPORTS.map(imp => ({
      title: `Keeps other unknown React hooks’ values (${imp.name})`,
      code: `
        ${imp.import}
        import { useAutoEffect } from './hooks.macro';

        const Context = ${imp.prefix}createContext(null);

        function FakeComponent() {
          const value = ${imp.prefix}useContext(Context);

          useAutoEffect(() => {
            console.log(value);
          });
        }
      `,
    })),
    {
      title: 'Skips state values with missing setters',
      code: `
        import React from 'react';
        import { useAutoEffect } from './hooks.macro';

        function FakeComponent() {
          const [id] = React.useState(Math.random);
          useAutoEffect(() => {
            console.log(id)
          });
        }
      `,
    },
    {
      title: 'Skips state values with unused setters',
      code: `
        import React from 'react';
        import { useAutoEffect } from './hooks.macro';

        function FakeComponent() {
          const [id, setId] = React.useState(Math.random);
          useAutoEffect(() => {
            console.log(id)
          });
        }
      `,
    },
  ],
});
