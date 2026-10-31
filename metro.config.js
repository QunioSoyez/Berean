// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bible text ships as .bjson files (plain JSON with a custom extension).
// Registering the extension as an asset makes Metro copy the files into the app
// instead of compiling them into the JS bundle, so each book loads on demand.
config.resolver.assetExts.push('bjson');

module.exports = config;
