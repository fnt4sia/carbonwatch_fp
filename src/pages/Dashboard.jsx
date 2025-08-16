import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../SupabaseClient'; // make sure this path is correct

function InfoCard({ title, value, percent, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-600">
        <span className="text-xl">{icon}</span>
        <span className="font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-2 text-2xl font-bold text-gray-800">
        <span>{value}</span>
        <span className="text-green-500 text-sm font-medium flex items-center gap-1">
          {percent} <span className="text-base">↑</span>
        </span>
      </div>
    </div>
  );
}

function Dashboard() {
  const [search, setSearch] = useState('');
  const [companyData, setCompanyData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompaniesAndTransactions = async () => {
      // Fetch companies
      const { data: companies, error: companyError } = await supabase
        .from('company')
        .select('*');

      if (companyError) {
        console.error('Error fetching companies:', companyError);
        return;
      }

      // Fetch all transactions
      const { data: transactions, error: transactionError } = await supabase
        .from('transaction')
        .select('*');

      if (transactionError) {
        console.error('Error fetching transactions:', transactionError);
        return;
      }

      // Calculate totals for each company
      const companiesWithTotals = companies.map(company => {
        const companyTransactions = transactions.filter(t => t.company_id === company.company_id);
        
        const totals = companyTransactions.reduce((acc, t) => ({
          totalVolume: acc.totalVolume + (parseFloat(t["Carbon Volume"]) || 0),
          totalAmount: acc.totalAmount + (parseFloat(t["Transaction Amount"]) || 0),
          suspiciousCount: acc.suspiciousCount + (t["Label"] === 'Caution' || t["Label"] === 'High-Risk' ? 1 : 0)
        }), { totalVolume: 0, totalAmount: 0, suspiciousCount: 0 });

        return {
          ...company,
          totalVolume: totals.totalVolume,
          totalAmount: totals.totalAmount,
          suspiciousCount: totals.suspiciousCount
        };
      });

      setCompanyData(companiesWithTotals);
    };

    fetchCompaniesAndTransactions();
  }, []);

  const filteredCompanies = companyData.filter(
    c =>
      c.nama_perusahaan?.toLowerCase().includes(search.toLowerCase()) ||
      c.sector?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="flex items-center justify-between px-12 py-4 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-violet-600 tracking-tight">carbonwatch</h1>
        <input
          type="text"
          placeholder="Cari perusahaan atau sektor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-72 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </header>

      <main className="flex justify-center py-8 px-4">
        <div className="w-full max-w-7xl space-y-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
            <button
              onClick={() => navigate('/tambah-perusahaan')}
              className="px-5 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 shadow"
            >
              + Tambah Perusahaan
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <InfoCard 
              title="Perusahaan Dipantau" 
              value={companyData.length} 
              percent="5%" 
              icon="🏢" 
            />
            <InfoCard 
              title="Volume Karbon" 
              value={`${companyData.reduce((sum, c) => sum + (c.totalVolume || 0), 0).toLocaleString()} Ton`}
              percent="5%" 
              icon="🌱" 
            />
            <InfoCard 
              title="Nilai Transaksi" 
              value={`$${companyData.reduce((sum, c) => sum + (c.totalAmount || 0), 0).toLocaleString()}`}
              percent="8%" 
              icon="💰" 
            />
            <InfoCard 
              title="Transaksi Mencurigakan" 
              value={companyData.reduce((sum, c) => sum + (c.suspiciousCount || 0), 0)}
              percent="1%" 
              icon="🚩" 
            />
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-x-auto border border-gray-100">
            <table className="min-w-full text-sm table-auto border-separate border-spacing-y-1">
              <thead className="text-gray-700 bg-white rounded-md">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">ID</th>
                  <th className="px-6 py-3 text-left font-semibold">Perusahaan</th>
                  <th className="px-6 py-3 text-left font-semibold">Sektor</th>
                  <th className="px-6 py-3 text-left font-semibold">Total Volume Karbon (Ton)</th>
                  <th className="px-6 py-3 text-left font-semibold">Total Nilai Transaksi (USD)</th>
                  <th className="px-6 py-3 text-left font-semibold">Transaksi Mencurigakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((c) => (
                  <tr
                    key={c.company_id}
                    className="bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => navigate(`/detail/${encodeURIComponent(c.company_id)}`)}
                  >
                    <td className="px-6 py-5 text-base">{c.company_id?.slice(0, 3).toUpperCase() || 'N/A'}</td>
                    <td className="px-6 py-5 flex items-center gap-3 text-base">
                      {c.gambar && (
                        <img
                          src={c.gambar}
                          alt="logo"
                          className="w-6 h-6 rounded object-contain"
                        />
                      )}
                      {c.nama_perusahaan}
                    </td>
                    <td className="px-6 py-5 text-base">{c.sector}</td>
                    <td className="px-6 py-5 text-base">{c.totalVolume.toLocaleString()}</td>
                    <td className="px-6 py-5 text-base">${c.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-5 text-base">{c.suspiciousCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
