import React, { useState } from 'react';
import { FiUploadCloud } from 'react-icons/fi';

export default function TambahTransaksi() {
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setFileData(content);
    };

    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!fileData) {
      alert('Mohon unggah file terlebih dahulu!');
      return;
    }

    // Handle parsing / upload here
    alert('File berhasil diunggah!');
    console.log(fileData);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-12 py-4 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-violet-600 tracking-tight">carbonwatch</h1>
      </header>

      {/* Main Content */}
      <main className="px-6 py-10 max-w-7xl mx-auto space-y-6">
        {/* Sub-header */}
        <div className="bg-white rounded-xl shadow-sm px-6 py-4 flex items-center gap-4">
          <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800 text-xl">
            ←
          </button>
          <h2 className="text-lg font-semibold">Tambah Transaksi</h2>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow px-6 py-6">
          <h3 className="text-md font-semibold mb-4">Tambah Transaksi Perusahaan</h3>

          <label className="block text-sm text-gray-600 mb-1">Unggah File</label>

          <label className="relative flex items-center w-full bg-gray-100 border rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-200">
            <span className="text-gray-500 flex-1 truncate">
              {fileName || 'Unggah Data Transaksi'}
            </span>
            <FiUploadCloud className="text-xl text-gray-500" />
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>

          <button
            onClick={handleSubmit}
            className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition"
          >
            Tambah Transaksi
          </button>
        </div>
      </main>
    </div>
  );
}