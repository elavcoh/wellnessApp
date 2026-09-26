const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required for expo-sqlite on web
config.resolver.assetExts.push('wasm');

// Required for SharedArrayBuffer used by SQLite
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader(
      'Cross-Origin-Embedder-Policy',
      'credentialless'
    );
    res.setHeader(
      'Cross-Origin-Opener-Policy',
      'same-origin'
    );

    return middleware(req, res, next);
  };
};

module.exports = config;