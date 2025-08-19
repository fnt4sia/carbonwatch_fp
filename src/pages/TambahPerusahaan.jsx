import React, { useState, useRef } from "react";
import { supabase } from "../SupabaseClient";
import { useNavigate } from "react-router-dom";

export default function TambahPerusahaan() {
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company_id: "",
    nama_perusahaan: "",
    sector: "",
    alamat: "",
    kontak: "",
    npwp: "",
    website: "",
    gambar: null,
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert("File size should be less than 5MB");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      setLogoFile(file); // Store the actual file for upload
      setForm({ ...form, gambar: null }); // Reset gambar URL until uploaded
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let gambarUrl = null;

      // Upload image to Supabase Storage if file is selected
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${form.company_id || Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `company-logos/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("company-images")
          .upload(filePath, logoFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          alert("Error uploading image: " + uploadError.message);
          setIsUploading(false);
          return;
        }

        // Get public URL for the uploaded image
        const {
          data: { publicUrl },
        } = supabase.storage.from("company-images").getPublicUrl(filePath);

        gambarUrl = publicUrl;
      }

      // Insert company data with image URL
      const { company_id, nama_perusahaan, sector, address, contact, npwp, website } = form;
      const { error } = await supabase.from("company").insert([
        {
          company_id,
          nama_perusahaan,
          sector,
          address,
          contact,
          npwp,
          website,
          gambar: gambarUrl,
        },
      ]);

      if (error) {
        console.error("Insert error:", error);
        alert("Error saving company: " + error.message);
      } else {
        alert("Company added successfully!");
        navigate("/");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="flex items-center justify-between px-12 py-4 bg-white shadow-sm">
        <h1
          className="text-2xl font-bold text-violet-600 tracking-tight cursor-pointer hover:text-violet-700 transition-colors"
          onClick={() => navigate("/")}
        >
          carbonwatch
        </h1>
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
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Alamat Perusahaan"
                    className="w-full bg-gray-100 rounded-lg px-4 py-3"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-medium mb-1">Kontak</label>
                  <input
                    type="text"
                    name="contact"
                    value={form.contact}
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
                disabled={isUploading}
                className={`w-full mt-8 py-3 rounded-full font-semibold text-lg transition ${
                  isUploading ? "bg-gray-400 cursor-not-allowed text-white" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Mengunggah...
                  </span>
                ) : (
                  "Tambah Perusahaan"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
