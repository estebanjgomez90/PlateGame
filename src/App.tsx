import { useState } from 'react'
import MapController from './components/Map'
import './App.css'
import SharedSession from './components/SharedSession'
import { Routes, Route } from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div className="h-screen flex-col justify-center">
    <h1 className="app-header">
      Welcome to PlateGame!
    </h1>
    <main className="flex-1 flex items-center justify-center p-4">
    <div className="map-container w-full h-full">
      {/* MapController is now large and centered */}
      <Routes>
        <Route index element={<MapController />} />
        <Route path="/game/:sessionId" element={<MapController />} />
      </Routes>
    </div>
  </main>
  </div>
    </>
  )
}

export default App
