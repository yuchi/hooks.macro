const { addNamed } = require('@babel/helper-module-imports');
const { createMacro } = require('babel-plugin-macros');

module.exports = createMacro(memoMacro);

function ensureParentScopeBinding(parentPath, path) {
  const binding = path.scope.getBinding(path.node.name);

  if (binding == null) {
    return null;
  }

  if (binding.scope !== parentPath.scope) {
    return null;
  }

  return binding;
}

function visitInputsReferences(parentPath, entryPath, babel, visitor) {
  const { types: t } = babel;

  entryPath.traverse({
    Expression(path) {
      if (!t.isIdentifier(path)) {
        return;
      }

      const binding = ensureParentScopeBinding(parentPath, path);

      // Excluding bindings outside of the component
      if (binding == null) {
        return;
      }

      if (t.isCallExpression(path.parentPath)) {
        if (t.isFunctionDeclaration(binding.path)) {
          visitInputsReferences(parentPath, binding.path, babel, visitor);
        } else if (t.isVariableDeclarator(binding.path)) {
          const initPath = binding.path.get('init');

          if (
            t.isArrowFunctionExpression(initPath) ||
            t.isFunctionExpression(initPath)
          ) {
            visitInputsReferences(parentPath, initPath, babel, visitor);
          } else {
            visitor(path);
          }
        } else {
          visitor(path);
        }
      }
      // Excluding "b" in "a.b" form
      else if (
        !t.isMemberExpression(path.parentPath) ||
        path.parentKey === 'object'
      ) {
        visitor(path);
      }
    },
  });
}

function hookCreateTransform(parentPath, createPath, importedHookName, babel) {
  const { types: t } = babel;

  const references = [];

  visitInputsReferences(parentPath, createPath, babel, ({ node }) => {
    if (!references.some(reference => reference.name === node.name)) {
      references.push(node);
    }
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
  ['useAutoEffect', 'useEffect', false],
  ['useAutoMutationEffect', 'useMutationEffect', false],
  ['useAutoLayoutEffect', 'useLayoutEffect', false],
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
