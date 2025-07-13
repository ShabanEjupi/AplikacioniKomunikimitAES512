module.exports = {
  typescript: {
    enableTypeScriptImplicitProjectReferences: true,
  },
  webpack: {
    configure: (webpackConfig) => {
      // Allow importing from outside src directory by removing ModuleScopePlugin
      try {
        const { ModuleScopePlugin } = require('react-dev-utils');
        webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
          (plugin) => !(plugin instanceof ModuleScopePlugin)
        );
      } catch (error) {
        // If react-dev-utils is not available, try alternative approach
        console.warn('Warning: react-dev-utils not found, using alternative module scope configuration');
        webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
          (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
        );
      }
      return webpackConfig;
    },
  },
};
