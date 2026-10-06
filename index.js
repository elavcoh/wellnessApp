/**
 * index.js
 *
 * Purpose: The very first file Expo runs. It tells React Native which component is the
 * app (App.js).
 * Related to: App.js. Set as "main" in package.json.
 */

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
