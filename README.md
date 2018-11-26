# Hooks’ Macro :umbrella:

> Babel Macros for React Hooks automatic memoization invalidation.

> **Note:** This is using the new [React Hooks API Proposal](https://reactjs.org/docs/hooks-intro.html)
> which is subject to change until React 16.7 final.
>
> You'll need to install `react`, `react-dom`, etc at `^16.7.0-alpha.0`
>
> ```
> npm install react@next react-dom@next
> ```
> ```
> yarn add react@next react-dom@next
> ```

## Installation

Requires [`babel-plugin-macros`](https://www.npmjs.com/package/babel-plugin-macros), which is already configured for you if you are using Create React App v2+.

```
npm install --dev hooks.macro
```

```
yarn add --dev hooks.macro
```

## Usage

Replace:

```js
import { useMemo } from 'react';

function MyComponent({ labels }) {
  const myComputation = useMemo(
    () => labels.map(label => label.toUpperCase()),
    [labels],
  );
}
```

With:

```js
import { useAutoMemo } from 'hooks.macro';

function MyComponent({ labels }) {
  const myComputation = useAutoMemo(() =>
    labels.map(label => label.toUpperCase()),
  );
}
```

Or even:

```js
import { useAutoMemo } from 'hooks.macro';

function MyComponent({ labels }) {
  const myComputation = useAutoMemo(labels.map(label => label.toUpperCase()));
}
```

## Full reference

### `useAutoMemo`

Exactly like React’s `useMemo` but automatically identifies value dependencies.

Can be passed a factory function or directly a value, will convert the latter to a function for you.

```js
import { useAutoMemo } from 'hooks.macro';
```

```js
useAutoMemo(value);
useAutoMemo(() => value);
```

Both become:

```js
useMemo(() => value, [value]);
```

### `useAutoCallback`

Exactly like React’s `useCallback` but automatically identifies value dependencies.

```js
import { useAutoCallback } from 'hooks.macro';
```

```js
useAutoCallback(() => {
  doSomethingWith(value);
});
```

Becomes:

```js
useCallback(
  () => {
    doSomethingWith(value);
  },
  [doSomethingWith, value],
);
```

### `useAutoEffect`, `useAutoMutationEffect`, `useAutoLayoutEffect`

They work exactly like their standard React counterpart, but they automatically identify value dependencies.

```js
import {
  useAutoEffect,
  useAutoMutationEffect,
  useAutoLayoutEffect,
} from 'hooks.macro';
```

```js
useAutoEffect(() => {
  doSomethingWith(value);
});
```

Becomes:

```js
useEffect(
  () => {
    doSomethingWith(value);
  },
  [doSomethingWith, value],
);
```

## Limitations

To make this work I currently needed to pose some limitations. This could change in the future (PR **_very_** welcome).

1. Only variables created in the scope of the component body are automatically trapped as value dependencies.

2. Only variables, and not properties’ access, are trapped. This means that if you use `obj.prop` only `[obj]` will become part of the memoization invalidation keys. This is a problem for refs, and will be addressed specifically in a future release.

   You can work around this limitation by creating a variable which holds the current value, such as `const { current } = ref`.

3. Currently there’s no way to add additional keys for more fine grained cache invalidation. Could be an important escape hatch when you do nasty things, but in that case I’d prefer to use `useMemo`/`useCallback` directly.

## Inspiration

React [documentation about `useMemo`][0] and [`use*Effect`][1] hooks cites: (emphasis mine)

> The array of inputs is not passed as arguments to the function. Conceptually, though, that’s what they represent: every value referenced inside the effect function should also appear in the inputs array. **In the future, a sufficiently advanced compiler could create this array automatically.**

This project tries to cover exactly that: to create the inputs array automatically.

[0]: https://reactjs.org/docs/hooks-reference.html#usememo
[1]: https://reactjs.org/docs/hooks-reference.html#conditionally-firing-an-effect

## License

MIT
