import Handlebars from 'handlebars';

export default function({ Plugin, types: t }) {
  const IMPORT_NAME = 'handlebars-inline-precompile';
  const IMPORT_PROP = '_handlebarsImportSpecifier';

  function isReferenceToImport(node, file) {
    return t.isIdentifier(node, {
      name: file[IMPORT_PROP] && file[IMPORT_PROP].input
    });
  }

  // Precompile template and replace node.
  function compile(path, template, importName) {
    let precompiled = Handlebars.precompile(template);
    path.replaceWithSourceString(`${importName}.template(${precompiled})`);
  }

  return {
    visitor: {

      /**
       * Find the import declaration for `hbs`.
       */

      ImportDeclaration(path, file) {
        const { node, scope } = path;
        // Filter out anything other than the `hbs` module.
        if (!t.isLiteral(node.source, { value: IMPORT_NAME })) {
          return;
        }

        let first = node.specifiers && node.specifiers[0];

        // Throw an error if using anything other than the default import.
        if (!t.isImportDefaultSpecifier(first)) {
          let usedImportStatement = file.code.slice(node.start, node.end);
          throw this.errorWithNode(node, `Only \`import hbs from '${IMPORT_NAME}'\` is supported. You used: \`${usedImportStatement}\``);
        }

        let name = scope.generateUidIdentifier('Handlebars').name;

        // Store the import name to lookup references elsewhere.
        file[IMPORT_PROP] = {
          input: first.local.name,
          output: name
        };

        file.addImport('handlebars/runtime', 'default', name);
        path.remove();
      },

      /**
       * Look for places where `hbs` is called normally.
       */

      CallExpression(path, file) {
        const { node } = path;

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
          throw this.errorWithNode(node, `${node.callee.name} should be invoked with a single argument: the template string`);
        }

        compile(path, template, file[IMPORT_PROP].output);
      },

      /**
       * Look for places where `hbs` is called as a tagged template.
       */

      TaggedTemplateExpression(path, file) {
        const { node } = path;

        // filter out anything other than `hbs`.
        if (!isReferenceToImport(node.tag, file)) {
          return;
        }

        // hbs`${template}` is not supported.
        if (node.quasi.expressions.length) {
          throw this.errorWithNode(node, 'placeholders inside a tagged template string are not supported');
        }

        let template = node.quasi.quasis.map(quasi => quasi.value.cooked).join('');

        compile(path, template, file[IMPORT_PROP].output);
      }
    }
  };
}
