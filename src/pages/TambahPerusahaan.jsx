import React, { useState, useRef } from 'react';
import { supabase } from '../SupabaseClient';
import { useNavigate } from 'react-router-dom';

export default function TambahPerusahaan() {
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company_id: '',
    nama_perusahaan: '',
    sector: '',
    alamat: '',
    kontak: '',
    npwp: '',
    website: '',
    gambar: null,
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      setForm({ ...form, gambar: previewUrl });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { company_id, nama_perusahaan, sector, alamat, kontak, npwp, website, gambar } = form;
    const { error } = await supabase.from('company').insert([
      {
        company_id,
        nama_perusahaan,
        sector,
        alamat,
        kontak,
        npwp,
        website,
        gambar,
      },
    ]);
    if (error) console.error('Insert error:', error);
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="flex items-center justify-between px-12 py-4 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-violet-600 tracking-tight">carbonwatch</h1>
      </header>

      <main className="flex justify-center py-8 px-4">
        <div className="w-full max-w-7xl">
          <div className="bg-white rounded-2xl shadow p-8">
            <div className="flex items-center mb-6">
              <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800 text-xl">
                ←
              </button>
              <span className="text-lg font-semibold">Tambah Perusahaan</span>
            </div>

            <h2 className="text-xl font-bold mb-6">Informasi Perusahaan</h2>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block font-medium mb-1">ID Perusahaan</label>
                <input
                  type="text"
                  name="company_id"
                  value={form.company_id}
                  onChange={handleChange}
                  placeholder="ID Perusahaan"
                  className="w-full bg-gray-100 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Nama Perusahaan</label>
                <input
                  type="text"
                  name="nama_perusahaan"
                  value={form.nama_perusahaan}
                  onChange={handleChange}
                  placeholder="Nama Perusahaan"
                  className="w-full bg-gray-100 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Unggah Foto</label>
                <div
                  className="relative cursor-pointer bg-gray-100 rounded-lg px-4 py-3 flex items-center justify-between"
                  onClick={() => fileInputRef.current.click()}
                >
                  <span className="text-gray-500">
                    {logoPreview ? "Logo telah dipilih" : "Unggah logo atau ikon perusahaan"}
                  </span>
                  <span className="text-gray-400 text-xl">📤</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                {logoPreview && (
                  <div className="mt-3">
                    <img
                      src={logoPreview}
                      alt="Preview Logo"
                      className="w-24 h-24 object-contain border border-gray-200 rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1">Sektor Perusahaan</label>
                <select
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  className="w-full bg-gray-100 rounded-lg px-4 py-3"
                >
                  <option value="">Pilih sektor</option>
                  <option value="Energi">Energi</option>
                  <option value="Manufaktur">Manufaktur</option>
                  <option value="Kehutanan">Kehutanan</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-medium mb-1">Alamat</label>
                  <input
                    type="text"
                    name="alamat"
                    value={form.alamat}
                    onChange={handleChange}
                    placeholder="Alamat Perusahaan"
                    className="w-full bg-gray-100 rounded-lg px-4 py-3"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-medium mb-1">Kontak</label>
                  <input
                    type="text"
                    name="kontak"
                    value={form.kontak}
                    onChange={handleChange}
                    placeholder="Kontak Perusahaan"
                    className="w-full bg-gray-100 rounded-lg px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">NPWP</label>
                <input
                  type="text"
                  name="npwp"
                  value={form.npwp}
                  onChange={handleChange}
                  placeholder="NPWP Perusahaan"
                  className="w-full bg-gray-100 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Situs Web</label>
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="Situs Web Perusahaan"
                  className="w-full bg-gray-100 rounded-lg px-4 py-3"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-8 py-3 rounded-full bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition"
              >
                Tambah Perusahaan
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
