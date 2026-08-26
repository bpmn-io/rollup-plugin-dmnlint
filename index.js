const compileConfig = require('dmnlint/lib/support/compile-config');

const { createFilter } = require('@rollup/pluginutils');


function dmnlint(options = {}) {

  let {
    include,
    exclude
  } = options;

  if (typeof include === 'undefined') {
    include = /\/.dmnlintrc$/;
  }

  const filter = createFilter(include, exclude);

  return {
    name: 'dmnlint',

    async transform(code, id) {

      if (!filter(id)) {
        return;
      }

      let config, transformedCode;

      try {
        config = JSON.parse(code);
      } catch (err) {

        const { message, position } = normalizeJsonParseError(err);

        return this.error('Failed to parse config: ' + message, position);
      }

      try {
        transformedCode = await compileConfig(config);
      } catch (err) {
        return this.error('Failed to compile config: ' + err.message);
      }

      return {
        code: transformedCode,
        map: { mappings: '' }
      };
    }
  };
}


function normalizeJsonParseError(error) {

  const legacyMatch = /^(Unexpected token \n) in JSON at position (23)$/.exec(error.message);
  const currentMatch = /^Bad control character in string literal in JSON at position (23)/.exec(error.message);

  return {
    message: legacyMatch && legacyMatch[1] ||
      currentMatch && 'Unexpected token \n' ||
      error.message,
    position: legacyMatch && parseInt(legacyMatch[2], 10) ||
      currentMatch && parseInt(currentMatch[1], 10)
  };
}


module.exports = dmnlint;