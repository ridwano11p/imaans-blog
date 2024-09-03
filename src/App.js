import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './components/AppNavigator';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
          <AppNavigator />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
