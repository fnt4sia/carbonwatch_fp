import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Detail from './pages/Detail';
import TambahPerusahaan from './pages/TambahPerusahaan';
import TambahTransaksi from './pages/TambahTransaksi';
import DetailTransaksi from './pages/DetailTransaksi';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/tambah-perusahaan" element={<TambahPerusahaan />} />
        <Route path="/tambah-transaksi" element={<TambahTransaksi />} />
        <Route path="/detail-transaksi" element={<DetailTransaksi />} />
      </Routes>
    </Router>
  );
}

export default App;
