const { addNamed } = require('@babel/helper-module-imports');
const { createMacro } = require('babel-plugin-macros');

module.exports = createMacro(memoMacro);

function reachSignificantScope(t, scope) {
  while (scope.path.parentPath && t.isBlockStatement(scope.path)) {
    scope = scope.path.parentPath.scope;
  }

  return scope;
}

function getDirectFunctionInitPath(t, path) {
  if (t.isFunctionDeclaration(path)) {
    return path;
  }

  if (t.isVariableDeclarator(path)) {
    const initPath = path.get('init');

    if (
      t.isArrowFunctionExpression(initPath) ||
      t.isFunctionExpression(initPath)
    ) {
      return initPath;
    }
  }

  return null;
}

function isStaticKnownHookValue(t, path, binding) {
  const bindingPath = binding.path;

  if (t.isVariableDeclarator(bindingPath)) {
    const idPath = bindingPath.get('id');
    const initPath = bindingPath.get('init');

    const apiName = getMatchingReactAPICallExpression(
      t,
      initPath,
      'useRef',
      'useState',
      'useReducer',
    );

    if (apiName === 'useRef') {
      // Refs are known to be static
      return true;
    } else if (apiName === 'useState' || apiName === 'useReducer') {
      if (t.isArrayPattern(idPath)) {
        const [statePath, dispatchFnPath] = idPath.get('elements');

        if (
          t.isIdentifier(dispatchFnPath) &&
          dispatchFnPath.node.name === path.node.name
        ) {
          // State setters and dispatch functions are known to be static
          return true;
        } else if (
          t.isIdentifier(statePath) &&
          statePath.node.name &&
          (dispatchFnPath == null || isUnusedReference(t, dispatchFnPath))
        ) {
          // State values with a missing or unused setters/dispatch fns
          // cannot change, therefore are static
          return true;
        }
      }
    }
  }

  return false;
}

function getMatchingReactAPICallExpression(t, path, ...methodNames) {
  if (t.isCallExpression(path)) {
    const calleePath = path.get('callee');

    return (
      getMatchingReactMemberExpression(t, calleePath, ...methodNames) ||
      getMatchingReactNamedImport(t, calleePath, ...methodNames)
    );
  }

  return false;
}

function getMatchingReactMemberExpression(t, path, ...names) {
  if (
    t.isMemberExpression(path) &&
    isReactNamespaceImport(t, path.get('object')) &&
    t.isIdentifier(path.node.property) &&
    names.includes(path.node.property.name)
  ) {
    return path.node.property.name;
  }

  return false;
}

function isReactNamespaceImport(t, path) {
  if (t.isIdentifier(path)) {
    if (path.node.name === 'React') {
      return true;
    }

    const binding = path.scope.getBinding(path.node.name);

    if (binding == null) {
      return null;
    }

    const bindingPath = binding.path;

    if (isReactImport(t, bindingPath)) {
      if (
        // import React from 'react'
        t.isImportDefaultSpecifier(bindingPath) ||
        // import * as React from 'react'
        t.isImportNamespaceSpecifier(bindingPath)
      ) {
        return true;
      }
    }

    // TODO require('react')
  }

  return false;
}

function getMatchingReactNamedImport(t, path, ...names) {
  if (t.isIdentifier(path)) {
    const binding = path.scope.getBinding(path.node.name);

    if (binding == null) {
      return null;
    }

    const bindingPath = binding.path;

    if (isReactImport(t, bindingPath)) {
      if (
        t.isImportSpecifier(bindingPath) &&
        names.includes(bindingPath.node.imported.name)
      ) {
        return bindingPath.node.imported.name;
      }
    }
  }

  return false;
}

function isReactImport(t, path) {
  return (
    t.isImportDeclaration(path.parent) && path.parent.source.value === 'react'
  );
}

function isImmutableLiteral(t, path) {
  if (t.isVariableDeclarator(path)) {
    const initPath = path.get('init');

    return isImmutableLiteral(initPath);
  } else {
    return (
      t.isBigIntLiteral(path) ||
      t.isBooleanLiteral(path) ||
      t.isNullLiteral(path) ||
      t.isNumericLiteral(path) ||
      t.isStringLiteral(path)
    );
  }
}

function isUnusedReference(t, path) {
  const binding = path.scope.getBinding(path.node.name);

  return !binding.referenced;
}

function guardFromRecursion(visitedEntryNodes, node) {
  if (visitedEntryNodes.includes(node)) {
    return false;
  } else {
    visitedEntryNodes.push(node);
    return true;
  }
}

function visitInputsReferences(
  parentPath,
  entryPath,
  babel,
  visitedEntryNodes,
  visitor,
) {
  if (!guardFromRecursion(visitedEntryNodes, entryPath.node)) {
    return;
  }

  const { types: t } = babel;

  const parentScope = reachSignificantScope(t, parentPath.scope);

  entryPath.traverse({
    Expression(path) {
      if (!t.isIdentifier(path)) {
        return;
      }

      const binding = path.scope.getBinding(path.node.name);

      // Reference without a binding (such as globals) are excluded
      if (binding == null) {
        return;
      }

      // Excluding bindings outside of the component
      if (reachSignificantScope(t, binding.scope) !== parentScope) {
        return;
      }

      if (binding.constant) {
        const functionInitPath = getDirectFunctionInitPath(t, binding.path);

        // Traverse only “constant” function references (as in “never re-assigned”)
        if (functionInitPath) {
          visitInputsReferences(
            parentPath,
            functionInitPath,
            babel,
            visitedEntryNodes,
            visitor,
          );
          return;
        }

        // Skip known static hook values (state setters, refs, dispatchers)
        if (isStaticKnownHookValue(t, path, binding)) {
          return;
        }

        // Skip known immutables (numbers, booleans), they will never change
        if (isImmutableLiteral(t, binding.path)) {
          return;
        }
      }

      // All other bindings are included
      visitor(path);
    },
  });
}

function hookCreateTransform(parentPath, createPath, importedHookName, babel) {
  const { types: t } = babel;

  const visitedEntryNodes = [];
  const references = [];

  visitInputsReferences(
    parentPath,
    createPath,
    babel,
    visitedEntryNodes,
    ({ node }) => {
      if (!references.some(reference => reference.name === node.name)) {
        references.push(node);
      }
    },
  );

  parentPath.replaceWith(
    t.callExpression(importedHookName, [
      createPath.node,
      t.arrayExpression(references),
    ]),
  );
}

function collectIdentifierNodesInFunction(functionExpressionPath, babel) {
  const { types: t } = babel;
  const result = [];

  const parentScope = reachSignificantScope(
    t,
    functionExpressionPath.parentPath.scope,
  );

  functionExpressionPath.traverse({
    Expression(path) {
      if (!t.isIdentifier(path)) {
        return;
      }

      const binding = path.scope.getBinding(path.node.name);

      // Reference without a binding (such as globals) are excluded
      if (binding == null) {
        return;
      }

      // Excluding bindings outside of the component
      if (reachSignificantScope(t, binding.scope) !== parentScope) {
        return;
      }

      result.push(path.node);
    },
  });

  return result;
}

function autoRetrieveReferences(ownPath, functionCallPath, state, babel) {
  const { types: t } = babel;
  const references = [];

  functionCallPath.parentPath.traverse({
    Expression(path) {
      if (!t.isFunctionExpression(path) && !t.isArrowFunctionExpression(path)) {
        return;
      }

      references.push(...collectIdentifierNodesInFunction(path, babel));
    },
  });

  const includedNames = {};

  return references.filter(node => {
    if (includedNames[node.name]) return false;
    includedNames[node.name] = true;
    return true;
  });
}

function visitAutoReferences(entryPath, babel, visitor) {
  const { types: t } = babel;

  entryPath.traverse({
    Expression(path) {
      if (!t.isIdentifier(path)) {
        return;
      }

      // All other bindings are included
      visitor(path);
    },
  });
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

function autoTransform(path, state, macroName, hook, autoClosure, babel) {
  const { types: t } = babel;

  const functionCallPath = path.parentPath;

  const argument = functionCallPath.get('arguments.0');

  if (argument) {
    throw state.file.buildCodeFrameError(
      (argument && argument.node) || path.node,
      `${macroName} does not accept any arguments`,
    );
  }

  const references = autoRetrieveReferences(
    path,
    functionCallPath,
    state,
    babel,
  );

  functionCallPath.replaceWith(t.arrayExpression(references));
}

const CONFIGS = [
  ['useAutoMemo', 'useMemo', true, hookTransform],
  ['useAutoCallback', 'useCallback', false, hookTransform],
  ['useAutoEffect', 'useEffect', false, hookTransform],
  ['useAutoLayoutEffect', 'useLayoutEffect', false, hookTransform],
  ['auto', null, false, autoTransform],
];

function memoMacro({ references, state, babel }) {
  const { types: t } = babel;

  CONFIGS.forEach(
    ({ 0: macroName, 1: hookName, 2: autoClosure, 3: transform }) => {
      if (references[macroName]) {
        references[macroName].forEach(referencePath => {
          if (
            t.isCallExpression(referencePath.parentPath) &&
            referencePath.parentPath.node.callee === referencePath.node
          ) {
            transform(
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
    },
  );
}
