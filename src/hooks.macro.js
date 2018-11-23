const { addNamed } = require('@babel/helper-module-imports');
const { createMacro, MacroError } = require('babel-plugin-macros');

module.exports = createMacro(memoMacro);

function hookCreateTransform(parentPath, createPath, importedHookName, babel) {
  const { types: t } = babel;

  const references = [];

  createPath.traverse({
    Identifier(path) {
      if (
        // Excluding "b" in "a.b" form
        (path.parentPath.type !== 'MemberExpression' ||
          path.parentKey === 'object') &&
        // Excluding bindings outside of the component
        parentPath.scope.hasOwnBinding(path.node.name)
      ) {
        references.push(path.node);
      }
    },
  });

  parentPath.replaceWith(
    t.callExpression(importedHookName, [
      createPath.node,
      t.arrayExpression(references),
    ]),
  );
}

function hookTransform(path, state, hookName, babel) {
  const { types: t } = babel;

  const importedHookName = addNamed(path, hookName, 'react');

  const functionCallPath = path.parentPath;

  const argument = functionCallPath.get('arguments.0');

  let references = [];

  if (
    !t.isArrowFunctionExpression(argument) &&
    !t.isFunctionExpression(argument)
  ) {
    const closure = t.arrowFunctionExpression([], argument.node);
    const { 0: closurePath } = argument.replaceWith(closure);

    hookCreateTransform(functionCallPath, closurePath, importedHookName, babel);
  } else {
    hookCreateTransform(functionCallPath, argument, importedHookName, babel);
  }
}

const CONFIGS = [
  ['useAutoMemo', 'useMemo', true],
  ['useAutoCallback', 'useCallback', false],
];

function memoMacro({ references, state, babel }) {
  const { types: t } = babel;

  CONFIGS.forEach(({ 0: macroName, 1: hookName, 2: autoClosure }) => {
    if (references[macroName]) {
      references[macroName].forEach(referencePath => {
        if (
          t.isCallExpression(referencePath.parentPath) &&
          referencePath.parentPath.node.callee === referencePath.node
        ) {
          hookTransform(referencePath, state, hookName, babel);
        } else {
          throw new MacroError(
            `useAutoMemo can only be used a function, and can not be passed around as an argument.`,
          );
        }
      });
    }
  });
}
