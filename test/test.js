var { expect } = require('chai');
var { rollup } = require('rollup');

var dmnlint = require('../');

function createBundle(options, dmnlintOptions = {}) {
  options.plugins = [dmnlint(dmnlintOptions)];

  return rollup(options);
}


async function generateBundle(bundle, options) {
  const { output } = await bundle.generate(options);

  return output[0];
}


describe('rollup-plugin-dmnlint', function() {

  describe('should pack config', function() {

    it('.dmnlintrc', async function() {

      // given
      const bundle = await createBundle({ input: 'test/fixtures/basic.js' });

      // when
      const { code } = await generateBundle(bundle, { format: 'iife', moduleName: 'cfg' });

      // then
      new Function('expect', code)(expect);
    });


    it('custom name', async function() {

      // given
      const bundle = await createBundle(
        { input: 'test/fixtures/custom-name.js' },
        { include: /\/dmnlint-config.json$/ }
      );

      // when
      const { code } = await generateBundle(bundle, { format: 'iife', moduleName: 'cfg' });

      // then
      new Function('expect', code)(expect);
    });

  });


  it('should output sourcemap', async function() {
    // given
    const bundle = await createBundle({ input: 'test/fixtures/basic.js' });

    // when
    const { code, map } = await generateBundle(bundle, { sourcemap: true, format: 'esm' });

    // then
    expect(code).to.exist;
    expect(map).to.exist;
  });


  it('should throw when failing to resolve', async function() {

    let err;

    try {
      await createBundle(
        { input: 'test/fixtures/error.js' },
        { include: /\/dmnlint-config-error.json$/ }
      );


    } catch (e) {
      err = e;
    }

    expectError(err, 'Failed to compile config: Cannot resolve config <base> from <dmnlint-plugin-unknown>');
  });


  it('should throw when parsing bad JSON', async function() {

    let err;

    try {
      await createBundle(
        { input: 'test/fixtures/bad-json-error.js' },
        { include: /\/dmnlint-config-bad-json-error.json$/ }
      );

    } catch (e) {
      err = e;
    }

    expectError(err, 'Failed to parse config: Unexpected token \n');
  });

});


// helpers //////////////////

function expectError(err, expectedMessage) {

  expect(err).to.exist;

  const message = err.message;

  if (message.startsWith(expectedMessage)) {
    return;
  }

  expect(message).to.eql(expectedMessage);
}