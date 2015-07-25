import Handlebars from 'handlebars';

export default function({ Plugin, types: t }) {
  const IMPORT_NAME = 'handlebars-inline-precompile';
  const IMPORT_PROP = '_handlebarsImportSpecifier';

  function createImport(name) {
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(name),
        t.memberExpression(
          t.callExpression(t.identifier('require'), [
            t.literal('handlebars/runtime')
          ]),
          t.identifier('default')
        )
      )
    ]);
  }

  function isReferenceToImport(node, file) {
    return t.isIdentifier(node, {
      name: file[IMPORT_PROP] && file[IMPORT_PROP].input
    });
  }

  // Precompile template and replace node.
  function compile(visitor, template, importName) {
    let precompiled = Handlebars.precompile(template);
    visitor.replaceWithSourceString(`${importName}.template((${precompiled}).main)`);
  }

  let visitor = {

    /**
     * Find the import declaration for `hbs`.
     */

    ImportDeclaration(node, parent, scope, file) {
      // Filter out anything other than the `hbs` module.
      if (!t.isLiteral(node.source, { value: IMPORT_NAME })) {
        return;
      }

      let first = node.specifiers && node.specifiers[0];

      // Throw an error if using anything other than the default import.
      if (!t.isImportDefaultSpecifier(first)) {
        let usedImportStatement = file.code.slice(node.start, node.end);
        throw file.errorWithNode(node, `Only \`import hbs from '${IMPORT_NAME}'\` is supported. You used: \`${usedImportStatement}\``);
      }

      let name = scope.generateUidIdentifier('Handlebars').name;

      // Store the import name to lookup references elsewhere.
      file[IMPORT_PROP] = {
        input: first.local.name,
        output: name
      };

      return createImport(name);
    },

    /**
     * Look for places where `hbs` is called normally.
     */

    CallExpression(node, parent, scope, file) {
      // filter out anything other than `hbs`.
      if (!isReferenceToImport(node.callee, file)) {
        return;
      }

      let template = node.arguments[0].value;

      // `hbs` should be called as `hbs('template')`.
      if (
        node.arguments.length !== 1 ||
        typeof template !== 'string'
      ) {
        throw file.errorWithNode(node, `${node.callee.name} should be invoked with a single argument: the template string`);
      }

      compile(this, template, file[IMPORT_PROP].output);
    },

    /**
     * Look for places where `hbs` is called as a tagged template.
     */

    TaggedTemplateExpression(node, parent, scope, file) {
      // filter out anything other than `hbs`.
      if (!isReferenceToImport(node.tag, file)) {
        return;
      }

      // hbs`${template}` is not supported.
      if (node.quasi.expressions.length) {
        throw file.errorWithNode(node, 'placeholders inside a tagged template string are not supported');
      }

      let template = node.quasi.quasis.map(quasi => quasi.value.cooked).join('');

      compile(this, template, file[IMPORT_PROP].output);
    }
  };

  return new Plugin('handlebars-inline-precompile', { visitor });
}
