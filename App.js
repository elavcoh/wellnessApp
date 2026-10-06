/**
 * App.js
 *
 * Purpose: The app's root component. It only renders the navigator - all screens and
 * logic live under src/.
 * Related to: index.js registers this component; RootNavigator.js decides the first screen.
 */

import RootNavigator from './src/navigation/RootNavigator';

// The whole app is the navigator - it decides which screen to show.
export default function App() {
  return <RootNavigator />;
}
