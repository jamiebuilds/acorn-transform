var acorn = require('acorn');
var walk  = require('acorn/util/walk');

function indent(string) {
  return string.split('\n').map(function(line) {
    return '  ' + line;
  }).join('\n');
}

function printer(node, print) {
  switch (node.type) {
    case 'Program':
      return node.body.map(print).join('\n');

    case 'EmptyStatement':
      return '';

    case 'ExpressionStatement':
      return print(node.expression) + ';';

    case 'BinaryExpression':
    case 'LogicalExpression':
    case 'AssignmentExpression':
      return print(node.left) + ' ' + node.operator + ' ' + print(node.right);

    case 'MemberExpression':
      var code = print(node.object);
      if (node.computed) {
        code += '[' + print(node.property) + ']';
      } else {
        code += '.' + print(node.property);
      }
      return code;

    case 'Path':
      return '.' + print(node.body);

    case 'Identifier':
      return node.name;

    case 'SpreadElement':
    case 'SpreadElementPattern':
    case 'SpreadProperty':
    case 'SpreadPropertyPattern':
      return '...' + print(node.argument);

    case 'FunctionDeclaration':
    case 'FunctionExpression':
      var code = '';
      if (node.async) code += 'async ';
      code += 'function';
      if (node.generator) code += '*';
      if (node.id) code += ' ' + print(node.id);
      code += '(' + node.params.map(print).join(', ') + ')';
      code += ' ' + print(node.body);
      return code;

    case 'ArrowFunctionExpression':
      var code = '';
      if (node.async) code += 'async ';
      if (node.params.length === 1) {
        code += print(node.params[0]);
      } else {
        code += '(' + node.params.map(print).join(', ') + ')';
      }
      code += ' => ';
      code += print(node.body);
      return code;

    case 'MethodDefinition':
      throw new Error('MethodDefinition');
      return;

    case 'YieldExpression':
      var code = 'yield';
      if (node.delegate) code += '*';
      if (node.argument) code += ' ' + print(node.argument);
      return code;

    case 'AwaitExpression':
      var code = 'await';
      if (node.all) code += '*';
      if (node.argument) code += print(node.argument);
      return code;

    case 'ModuleDeclaration':
      var code = 'module ' + print(node.id);
      if (node.source) {
        code += ' from ' + print(node.source);
      } else {
        code += print(node.body);
      }
      return code;

    case 'ImportSpecifier':
    case 'ExportSpecifier':
      var code = print(node.id);
      if (node.name) code += ' as ' + print(node.name);
      return code;

    case 'ExportBatchSpecifier':
      return '*';

    case 'ExportDeclaration':
      throw new Error('ExportDeclaration');

    case 'ImportDeclaration':
      throw new Error('ImportDeclaration');

    case 'BlockStatement':
      if (node.body.length === 0) {
        return '{}';
      } else {
        return '{\n' + indent(node.body.map(print).join('\n')) + '\n}'
      }

    case 'ReturnStatement':
      var code = 'return';
      if (node.argument) {
        code += ' ' + print(node.argument);
      }
      code += ';';
      return code;

    case 'CallExpression':
      return print(node.callee) + '(' + node.arguments.map(print).join(', ') + ')';

    case 'ObjectExpression':
    case 'ObjectPattern':
      throw new Error('ObjectPattern');

    case 'PropertyPattern':
      return print(node.key) + ': ' + print(node.pattern);

    case 'Property':
      if (node.method || node.kind === 'get' || node.kind === 'set') {
        throw new Error('Property');
      } else {
        return print(node.key) + ': ' + print(node.value);
      }

    case 'ArrayExpression':
    case 'ArrayPattern':
      throw new Error('ArrayPattern');

    case 'SequenceExpression':
      return node.expressions.map(print).join(', ');

    case 'ThisExpression':
      return 'this';

    case 'Literal':
      if (typeof node.value !== 'string') {
        return '' + node.value;
      }
      // intentionally fall through...

    case 'ModuleSpecifier':
      return '\'' + node.value + '\'';

    case 'UnaryExpression':
      var code = node.operator;
      if (/[a-z]$/.test(node.operator)) {
        code += ' ';
      }
      code += print(node.argument);
      return code;

    case 'UpdateExpression':
      var parts = [print(node.argument)];
      parts.push(node.operator);
      if (node.prefix) parts.reverse();
      return parts.join('');

    case 'ConditionalExpression':
      var code = '(';
      code += print(node.test);
      code += ' ? ';
      code += print(node.consequent);
      code += ' : ';
      code += print(node.alternate);
      code += ')';
      return code;

    case 'NewExpression':
      var code = 'new ';
      code += print(node.callee);
      if (node.arguments) {
        code += '(' + node.arguments.map(print).join(', ') + ')';
      }
      return code;

    case 'VariableDeclaration':
      var code = node.kind + ' ';
      var maxLen = 0;
      var printed = node.declarations.map(function(childPath) {
        var lines = print(childPath);
        maxLen = Math.max(maxLen, lines.length);
        return lines;
      });
      switch (maxLen) {
        case 0:
          code += printed[0];
        case 1:
          code += printed.join(', ');
          break;
        default:
          code += printed.join(',\n    ');
          break;
      }
      var parent = walk.findNodeAround(node).node;
      if (
        parent.type !== 'ForStatement' &&
        parent.type !== 'ForInStatement' &&
        parent.type !== 'ForOfStatement' &&
        parent.type !== 'ForOfStatement'
      ) {
        code += ';';
      }
      return code;

    case 'VariableDeclarator':
      if (node.init) {
        return print(node.id) + ' = ' + print(node.init);
      } else {
        return print(node.id);
      }

    case 'WithStatement':
      return 'with (' + print(node.object) + ') ' + print(node.body);

    case 'IfStatement':
      var code = 'if (' + print(node.test) + ') ';
      code += print(node.consequent);
      return code;

    case 'ForStatement':
      var code = 'for (';
      code += print(node.init) + ' ';
      code += print(node.test) + '; ';
      code += print(node.update)
      code += ') ';
      code += print(node.body);
      return code;

    case 'WhileStatement':
      return 'while (' + print(node.test) + ') ' + print(node.body);

    case 'ForInStatement':
      var code = node.each ? 'for each (' : 'for (';
      code += print(node.left);
      code += ' in ';
      code += print(node.right);
      code += ') ';
      code += print(node.body);
      return code;

    case 'DoWhileStatement':
      var code = 'do ' + print(node.body);
      if (/\}$/.test(code)) {
        code += ' while';
      } else {
        code += '\nwhile';
      }
      code += ' (' + print(node.test) + ');';
      return code;

    case 'BreakStatement':
      var code = 'break';
      if (node.label) code += print(node.label);
      code += ';';
      return code;

    case 'ContinueStatement':
      var code = 'continue';
      if (node.label) code += print(node.label);
      code += ';';
      return code;

    case 'LabeledStatement':
      return print(node.label) + ':\n' + print(node.body);

    case 'TryStatement':
      var code = 'try ' + print(node.block);
      code += ' ' + print(node.handler);
      if (node.finalizer) {
        code += ' finally ' + print(node.finalizer);
      }
      return code;

    case 'CatchClause':
      var code = 'catch (' + print(node.param);
      if (node.guard) {
        code += ' if ' + print(node.guard);
      }
      code += ') ' + print(node.body);
      return code;

    case 'ThrowStatement':
      return 'throw ' + print(node.argument) + ';';

    case 'SwitchStatement':
      var code = 'switch (';
      code += print(node.discriminant);
      code += ') {';
      if (node.cases.length > 0) {
        code += '\n' + node.cases.map(print).join('\n') + '\n';
      }
      code += '}';
      return code;

    case 'SwitchCase':
      var code = '';
      if (node.test) {
        code += 'case ' + print(node.test) + ':';
      } else {
        code += 'default:';
      }
      if (node.consequent.length === 1) {
        code += ' ' + print(node.consequent[0]);
      } else if (node.consequent.length > 1) {
        code += '\n' + indent(node.consequent.map(print).join('\n'));
      }
      return indent(code);

    case 'DebuggerStatement':
      return 'debugger;';

    default:
      console.log('>> ' + node.type);
      return;
  }
}

function parse(code) {
  return acorn.parse(code);
}

function print(ast) {
  // visit...
  var printed = printer(ast, print);
  // diff...
  // clean...
  return printed;
}

exports.print = print;
exports.parse = parse;
