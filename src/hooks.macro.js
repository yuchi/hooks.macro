const { addNamed } = require('@babel/helper-module-imports');
const { createMacro } = require('babel-plugin-macros');

module.exports = createMacro(memoMacro);

function ensureParentScopeBinding(parentPath, path) {
  const binding = path.scope.getBinding(path.node.name);

  if (binding == null) {
    return false;
  }

  return binding.scope === parentPath.scope;
}

function hookCreateTransform(parentPath, createPath, importedHookName, babel) {
  const { types: t } = babel;

  const references = [];

  createPath.traverse({
    Expression(path) {
      if (t.isIdentifier(path)) {
        if (
          // Excluding "b" in "a.b" form
          (!t.isMemberExpression(path.parentPath) ||
            path.parentKey === 'object') &&
          // Excluding bindings outside of the component
          ensureParentScopeBinding(parentPath, path)
        ) {
          if (
            !references.some(reference => reference.name === path.node.name)
          ) {
            references.push(path.node);
          }
        }
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

function hookTransform(path, state, macroName, hookName, autoClosure, babel) {
  const { types: t } = babel;

  const importedHookName = addNamed(path, hookName, 'react');

  const functionCallPath = path.parentPath;

  const argument = functionCallPath.get('arguments.0');

  if (
    t.isArrowFunctionExpression(argument) ||
    t.isFunctionExpression(argument)
  ) {
    hookCreateTransform(functionCallPath, argument, importedHookName, babel);
  } else if (autoClosure) {
    const closure = t.arrowFunctionExpression([], argument.node);
    const { 0: closurePath } = argument.replaceWith(closure);

    hookCreateTransform(functionCallPath, closurePath, importedHookName, babel);
  } else {
    throw state.file.buildCodeFrameError(
      (argument && argument.node) || path.node,
      `${macroName} must be called with a function or an arrow`,
    );
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
          hookTransform(
            referencePath,
            state,
            macroName,
            hookName,
            autoClosure,
            babel,
          );
        } else {
          throw state.file.buildCodeFrameError(
            referencePath.node,
            `${macroName} can only be used a function, and can not be passed around as an argument.`,
          );
        }
      });
    }
  });
}
