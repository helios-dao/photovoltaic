module.exports = {
    resolve: {
    fallback: {
      path: require.resolve("path-browserify")
    }
  },
    future: {
        webpack5: true
    },
    webpack: (config) => {
      // Important: return the modified config
      return config
    },
  }