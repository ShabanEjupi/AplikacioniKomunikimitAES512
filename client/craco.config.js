module.exports = {
  typescript: {
    enableTypeScriptImplicitProjectReferences: true,
  },
  webpack: {
    configure: (webpackConfig) => {
      // Allow importing from outside src directory
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
      );
      return webpackConfig;
    },
  },
};
