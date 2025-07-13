const { ModuleScopePlugin } = require('react-dev-utils');

module.exports = {
  typescript: {
    enableTypeScriptImplicitProjectReferences: true,
  },
  webpack: {
    configure: (webpackConfig) => {
      // Allow importing from outside src directory
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => !(plugin instanceof ModuleScopePlugin)
      );
      return webpackConfig;
    },
  },
};
