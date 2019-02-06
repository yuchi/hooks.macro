# Hooks’ Macro :umbrella:

> Babel Macros for React Hooks automatic memoization invalidation.

- [Features](#features)
- [Roadmap](#roadmap-)
- [Installation](#installation)
- [Usage](#usage)
- [Full reference](#full-reference)
  - [`useAutoMemo`](#useautomemo)
  - [`useAutoCallback`](#useautocallback)
  - [`useAutoEffect`, `useAutoLayoutEffect`](#useautoeffect-useautolayouteffect)
- [Limitations](#limitations)
- [Inspiration](#inspiration)
- [License](#license)

## Features

1. Extracts all references used, and adds them to the _inputs_ array.

2. Favors **strict correctness over performance**, but uses **safe optimizations:**

   1. skips constants and useless memoization keys;

   2. traverses all functions called or referenced, and appends _their_ dependencies too, removing the need for unnecessary `useCallback` hooks.

3. By lowering the bar for high correctness, strives to:

   1. make the use of `useAutoMemo` and `useAutoCallback` simple and applicable in many more contests;

   2. reduce the overhead of modifying an input’s semantics (for example from a constant to a prop);

   3. reduce to the bare minimum cases of missed inputs — and therefore stale memoizations or effects.

4. Thoroughly tested: **50+ test cases and 100% code coverage.**

## Roadmap [![Help wanted!][hwb]][hw]

- [ ] Create a debug/trace facility to help debugging stale cache, performance issues.
- [ ] Create a escape hatch to signal that a reference should not be part of the inputs array.
- [ ] Identify a rule where we can safely add property accesses to the inputs array. Very important when dealing with refs (`ref.current`).
- [x] ~~Bail out on actual constants (such as primitive literals)~~ _Update: Done!_
- [ ] Warn/error on known non-invariant values (such as literal objects or arrays) — or auto-`useAutoMemo` them!
- [ ] Create a `auto()` generic macro to be used with other hooks and APIs with the same signature.

[hw]: https://github.com/yuchi/hooks.macro/labels/help%20wanted
[hwb]: https://img.shields.io/badge/-Help_wanted!-008672.svg?longCache=true&logo=github&logoColor=white&style=flat

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

### `useAutoEffect`, `useAutoLayoutEffect`

They work exactly like their standard React counterpart, but they automatically identify value dependencies.

```js
import { useAutoEffect, useAutoLayoutEffect } from 'hooks.macro';
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

4. Only locally defined functions declarations and explicit function expressions (`let x = () => {}`) are traversed for indirect dependencies — all other function calls (such as `xxx()`) are treated as normal input dependencies and appended too. This is unnecessary (but not harmful) for setters coming from `useState`, and not an issue at all if the function is the result of `useCallback` or `useAutoCallback`.

## Inspiration

React [documentation about `useMemo`][0] and [`use*Effect`][1] hooks cites: (emphasis mine)

> The array of inputs is not passed as arguments to the function. Conceptually, though, that’s what they represent: every value referenced inside the effect function should also appear in the inputs array. **In the future, a sufficiently advanced compiler could create this array automatically.**

This project tries to cover exactly that: to create the inputs array automatically.

[0]: https://reactjs.org/docs/hooks-reference.html#usememo
[1]: https://reactjs.org/docs/hooks-reference.html#conditionally-firing-an-effect

## License

MIT
