/**
 * index.js
 *
 * Purpose: The app's real entry point (set as "main" in package.json).
 * Related to: registers App.js as the root component to run.
 */

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
