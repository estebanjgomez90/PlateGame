import MapController from './components/Map'
import './App.css'
import { Routes, Route, HashRouter } from 'react-router-dom';
import { useEffect } from 'react'

function App() {
    useEffect(() => {
      console.log("App component mounted");
    }, [])  

  return (
    <>
    <div className="h-screen flex-col justify-center">
    <h1 className="app-header">
      Welcome to PlateGame!
    </h1>
    <main className="flex-1 flex items-center justify-center p-4">
    <div className="map-container w-full h-full">
      {/* MapController is now large and centered */}
      <HashRouter>
        <Routes>
          <Route path="*" element={<MapController />} />
        </Routes>
      </HashRouter>
    </div>
  </main>
  </div>
    </>
  )
}

export default App
