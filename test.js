var transformer = require('./');

function test(actual) {
  var ast = transformer.parse(actual);
  var out = transformer.print(ast);

  if (out !== actual) {
    console.log('Failed:');
    console.log(out);
    console.log('Expected:');
    console.log(actual);
    console.log();
  } else {
    console.log('Success:');
    console.log(out);
    console.log();
  }
}

test('var a = 1;');
test('function a(a, b, c) {}');
test('new A();');
test('function a() {\n  return a;\n}');
test('for (var i = 0; i < 10; i++) {}');
test('bar[baz];');
test('\'bah\';');
test('while (true) {}');
test('do {} while (true);');
test('try {} catch (e) {}');
test('switch (foo) {}');
test('switch (foo) {\n  case 1: break;\n  default: break;\n}');
