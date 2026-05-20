import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Merge from './pages/Merge'
import Split from './pages/Split'
import Compress from './pages/Compress'
import ToWord from './pages/ToWord'
import ToImage from './pages/ToImage'
import Rotate from './pages/Rotate'
import Edit from './pages/Edit'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/merge" element={<Merge />} />
        <Route path="/split" element={<Split />} />
        <Route path="/compress" element={<Compress />} />
        <Route path="/to-word" element={<ToWord />} />
        <Route path="/to-image" element={<ToImage />} />
        <Route path="/rotate" element={<Rotate />} />
        <Route path="/edit" element={<Edit />} />
      </Routes>
    </HashRouter>
  )
}
