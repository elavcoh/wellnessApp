/**
 * App.js
 *
 * Purpose: The app's root component. Just renders RootNavigator.js, which
 * handles everything else (database setup, onboarding, navigation).
 * Related to: loaded by index.js.
 */

import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return <RootNavigator />;
}
