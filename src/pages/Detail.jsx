import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../SupabaseClient';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as PieTooltip
} from 'recharts';
import { format, subMonths } from 'date-fns';

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const statusColors = {
    Normal: 'text-green-600',
    Caution: 'text-orange-500',
    'Red-Flagged': 'text-red-600',
  };

  const CATEGORY_COLORS = ['#00C49F', '#FF9800', '#FF4D4F'];

  useEffect(() => {
    const fetchData = async () => {
      const cleanId = id.startsWith('id=') ? id.substring(3) : id;
      const { data: companyData } = await supabase
        .from('company')
        .select('*')
        .eq('company_id', cleanId)
        .single();

      const { data: transactionData } = await supabase
        .from('transaction')
        .select('*')
        .eq('company_id', cleanId);

      setCompany(companyData);
      setTransactions(transactionData);
    };
    fetchData();
  }, [id]);

  const countByStatus = () => {
    const count = { Verified: 0, Caution: 0, 'High-Risk': 0 };
    transactions.forEach(tx => {
      const label = tx["Label"] || 'Verified';
      if (count[label] !== undefined) {
        count[label]++;
      }
    });
    return [
      { name: 'Verified', value: count.Verified },
      { name: 'Caution', value: count.Caution },
      { name: 'High-Risk', value: count['High-Risk'] },
    ];
  };

  const getMonthlyCautionTrend = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Initialize data array with zero counts
    const monthlyData = months.map(month => ({
      month,
      caution: 0,
      highRisk: 0
    }));

    // Count transactions for each month
    transactions.forEach(t => {
      // Currently using static date, replace with t.date when available
      const currentMonth = '2025-08-16';
      const monthIndex = new Date(currentMonth).getMonth();
      
      if (t["Label"] === 'Caution') {
        monthlyData[monthIndex].caution++;
      } else if (t["Label"] === 'High-Risk') {
        monthlyData[monthIndex].highRisk++;
      }
    });

    return monthlyData;
  };

  if (!company) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="flex items-center justify-between px-12 py-4 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-violet-600 tracking-tight">carbonwatch</h1>
      </header>

      <main className="flex justify-center py-8 px-4">
        <div className="w-full max-w-7xl space-y-10">
          <div className="bg-white rounded-2xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex items-center gap-4">
              <img src={company.gambar} alt="logo" className="w-16 h-16 object-contain rounded" />
              <h2 className="text-xl font-bold text-gray-900">{company.nama_perusahaan}</h2>
            </div>

            <div className="text-sm text-gray-700 space-y-1">
              <div><span className="font-semibold">ID Perusahaan:</span> {company.company_id}</div>
              <div><span className="font-semibold">Sektor:</span> {company.sector}</div>
              <div><span className="font-semibold">NPWP:</span> {company.npwp}</div>
            </div>

            <div className="text-sm text-gray-700 space-y-1">
              <div><span className="font-semibold">Alamat:</span> {company.address}</div>
              <div>
                <span className="font-semibold">Situs Web:</span>{' '}
                <a href={company.website} className="text-blue-600 hover:underline">{company.website}</a>
              </div>
              <div><span className="font-semibold">Kontak:</span> {company.contact}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow p-6 h-64 flex flex-col">
              <h3 className="font-semibold mb-2">Tren Transaksi Mencurigakan dan Berisiko Tinggi</h3>
              <div className="flex-1 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getMonthlyCautionTrend()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Line type="monotone" dataKey="caution" stroke="#FFB547" strokeWidth={2} name="Caution" />
                    <Line type="monotone" dataKey="highRisk" stroke="#FF4842" strokeWidth={2} name="High Risk" />
                    <LineTooltip />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 h-64 flex flex-col">
              <h3 className="font-semibold mb-2">Distribusi Transaksi Berdasarkan Kategori</h3>
              <div className="flex-1 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={countByStatus()} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} label>
                      {countByStatus().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index]} />
                      ))}
                    </Pie>
                    <PieTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 h-64">
              <h3 className="font-semibold mb-2">Pola Transaksi Tidak Wajar yang Terdeteksi</h3>
              <ul className="space-y-2 text-sm">
                <li className="bg-pink-100 text-pink-600 px-4 py-2 rounded">Sering melakukan transaksi di luar jam kerja normal</li>
                <li className="bg-orange-100 text-orange-600 px-4 py-2 rounded">Volume transaksi tidak proporsional dengan profil industri</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-x-auto border border-gray-100">
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h3 className="text-lg font-semibold">Daftar Transaksi</h3>
              <button 
                onClick={() => navigate('/tambah-transaksi', { state: { company } })} 
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                + Tambah Transaksi
              </button>
            </div>
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-3">Transaction ID</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Transaction Amount (USD)</th>
                  <th className="px-6 py-3">Carbon Volume (Ton)</th>
                  <th className="px-6 py-3">Price per Ton (USD)</th>
                  <th className="px-6 py-3">Origin Country</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr 
                    key={t.transaction_id} 
                    className="border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer" 
                    onClick={() => navigate(`/detail-transaksi`, { 
                      state: { 
                        transaction: {
                          ...t,
                          company: company
                        }
                      }
                    })}
                  >
                    <td className="px-6 py-4">{t.transaction_id}</td>
                    <td className="px-6 py-4">2025-08-16</td>
                    <td className="px-6 py-4">{t["Transaction Amount"]}</td>
                    <td className="px-6 py-4">{t["Carbon Volume"]}</td>
                    <td className="px-6 py-4">{t["Price per Ton"]}</td>
                    <td className="px-6 py-4">{t["Origin Country"]}</td>
                    <td className={`px-6 py-4 font-medium ${
                      t["Label"] === 'Caution' ? 'text-yellow-500' :
                      t["Label"] === 'High-Risk' ? 'text-red-500' :
                      'text-green-500'
                    }`}>
                      {t["Label"] || 'Normal'}
                    </td>
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
