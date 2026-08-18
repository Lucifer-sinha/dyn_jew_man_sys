// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Setup from './pages/Setup';
import Dashboard from './pages/dashboard'; // or wherever your main app is
import LandingPage from './pages/LandingPage'; // Import the LandingPage component


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />{/* Route for the landing page */}
        <Route path="/setup" element={<Setup />} />

        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
