## v1.1.1 (April 6, 2020)

- Ignore static state values. Closes #11 (3e093fd23569ef99791baae2505f8d548a64d807)
- Actually build the project before publishing it...

## v1.1.0 (April 6, 2020)

- Ignore constant state setters, reducers’ dispatch functions, refs. Closes #10 (f0082d33a3bf2879df0270532d5415a719bad703)

## v1.0.1 (February 6, 2019)

- Make sure all built files are included in the distribution (54201821869669a76c60360a8b7b74f88c5654d7)

## v1.0.0 (February 6, 2019)

- Remove alpha warnings. React Hooks are live!
- Fix export names in TypeScript typings (2ccd5f6335b6ac79603ee990537a55ab47f67afa)

## v0.2.0 (December 17, 2018)

- Remove `useMutationEffect` since it is not part of React anymore (a2a5aaab7ae33907b53d6b4a11ceb53b5a4c6ad4)
- Add complete typings for both TypeScript and Flow (d725da57b40ef74fe4776f24027caf2236025beb)

## v0.1.7 (December 4, 2018)

- Avoid maximum-callstack-by-recursion with circular/recursive references (fbcd59f180d80bea05abaf7108b7bf6f6346dc9a, cf03ded192c3ea89bd2cad11019017e54816ecff)

## v0.1.6 (November 30, 2018)

- Even more precise and/or pedantic tests, reached 100% code coverage (286696463eede515b01915fdee726adfd011a6f3, 3c5ca59db0e80f928d78f2a48b5b0399c14a037a, dd5eee7c2476e778c09683fd8ebcc692a3cbca2c, af8279f1872c56fde5c64d67b8211186030f07ed, c0632577c51224cf0c9eec63854fbc12ab53b9aa)
- Traverse block scopes (a267cf5f63291c00184e0211550eaec7d3df8f6e, 98a8dc471d9c10fe9c0061854499394c6e3287ad)
- Stricter policy on function references, which now must be constants (8fb9006af0f8113c3e90f806ebe0bd7b897e0509, 33beb4bc2d457d712f3811c05128c14446418353)
- Constants are now skipped (84b905dd57013ec7fa80ab945689374ad0bfa8db, 4fffbb60006a5e7b99a90ffc87e7d3a31e47e636)

## v0.1.5 (November 30, 2018)

This version has been skipped for a slip on author side.

## v0.1.4 (November 26, 2018)

- When possible avoid passing functions as inputs, and traverse them instead (ef33963137f66cc4c39490e33777655790f32bec)

## v0.1.4 (November 26, 2018)

- When possible avoid passing functions as inputs, and traverse them instead (ef33963137f66cc4c39490e33777655790f32bec)

## v0.1.3 (November 23, 2018)

- All standard memoizing React hooks are now proxied (dbce56d6e29386cfe5cd7d9717b72355f0cc77e1)
- Use Babel utilities to show the location of validation errors (7f2c9daaa5aeba81759461218eb5af0e28e20d39)

## v0.1.2 (November 23, 2018)

- Avoid including twice the same reference (bbc403eef4a63156651e587f156935d1a06c41f0)
- Small performance improvements (bbc403eef4a63156651e587f156935d1a06c41f0)
- Stricter validation checks (bbc403eef4a63156651e587f156935d1a06c41f0)

## v0.1.1 (November 23, 2018)

- Better expression selector (a6a872fde2ff79aa465a083180d900076577b618)

## v0.1.0 (November 23, 2018)

- Initial release for `useAutoMemo` and `useAutoCallback`
