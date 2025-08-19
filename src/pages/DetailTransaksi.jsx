import React, { useState, useEffect } from "react";
import { FiEdit3 } from "react-icons/fi";
import { IoChevronBack } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../SupabaseClient";

export default function DetailTransaksi() {
  const location = useLocation();
  const navigate = useNavigate();
  const { transaction } = location.state || {};
  const [verificationDetail, setVerificationDetail] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showAIDetailModal, setShowAIDetailModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchVerificationDetail = async () => {
      if (!transaction?.transaction_id) return;

      // First, try to get existing detail
      const { data, error } = await supabase
        .from("transaction_detail")
        .select("*")
        .eq("transaction_id", transaction.transaction_id);

      // If there's a real error (not just "not found")
      if (error) {
        console.error("Error fetching verification detail:", error);
        return;
      }

      // If we found existing data, use it
      if (data && data.length > 0) {
        setVerificationDetail(data[0]);
        return;
      }

      // Only create new detail if we didn't find any existing one
      const { data: existingCheck } = await supabase
        .from("transaction_detail")
        .select("count")
        .eq("transaction_id", transaction.transaction_id);

      // Double check that there really are no existing records
      if (existingCheck[0]?.count === 0) {
        const { data: newDetail, error: createError } = await supabase
          .from("transaction_detail")
          .insert([
            {
              transaction_id: transaction.transaction_id,
              verify_status: false,
            },
          ])
          .select();

        if (createError) {
          console.error("Error creating verification detail:", createError);
          return;
        }

        if (newDetail && newDetail.length > 0) {
          setVerificationDetail(newDetail[0]);
        }
      }
    };

    fetchVerificationDetail();
  }, [transaction]);

  if (!transaction) {
    return <div className="p-8 text-center">No transaction data available</div>;
  }

  const handleVerify = async (finalStatus) => {
    setIsUpdating(true);
    try {
      // First, update the transaction label
      const { data: transactionData, error: transactionError } = await supabase
        .from("transaction")
        .update({ Label: finalStatus })
        .eq("transaction_id", transaction.transaction_id)
        .select("*");

      if (transactionError) {
        console.error("Transaction update error:", transactionError);
        throw transactionError;
      }

      if (!transactionData || transactionData.length === 0) {
        throw new Error("Transaction not found");
      }

      // Then, update transaction_detail
      const { data: detailData, error: detailError } = await supabase
        .from("transaction_detail")
        .update({ verify_status: true })
        .eq("transaction_id", transaction.transaction_id)
        .select("*");

      if (detailError) {
        console.error("Transaction detail update error:", detailError.message);
        throw detailError;
      }

      if (!detailData || detailData.length === 0) {
        throw new Error("Transaction detail not found");
      }

      // Update local state with the returned data
      setVerificationDetail(detailData[0]); // Take the first item from the array
      transaction.label = finalStatus;
      setShowVerificationModal(false);
      alert("Status transaksi berhasil diperbarui!");
    } catch (error) {
      console.error("Error updating verification status:", error.message);
      alert("Failed to update verification status: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColor = {
    Normal: "bg-green-500",
    Suspicious: "bg-orange-500",
    "Red-Flag": "bg-red-500",
  };

  const suspiciousNotes = [
    "Melakukan transaksi di luar jam kerja normal",
    "Volume transaksi tidak proporsional dengan profil industri",
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-12 py-4 bg-white shadow-sm sticky top-0 z-10">
        <h1
          className="text-2xl font-bold text-violet-600 tracking-tight cursor-pointer hover:text-violet-700 transition-colors"
          onClick={() => navigate("/")}
        >
          carbonwatch
        </h1>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Title + Status + Back */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800 text-xl">
              ←
            </button>
            <div>
              <h2 className="text-xl font-semibold mb-1">Laporan Detail Transaksi</h2>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{transaction.id}</span>
                <span
                  className={`text-white text-xs px-2 py-1 rounded ${
                    transaction["Label"] === "Suspicious"
                      ? statusColor.Suspicious
                      : transaction["Label"] === "Red-Flag"
                      ? statusColor["Red-Flag"]
                      : statusColor.Normal
                  }`}
                >
                  {transaction["Label"] || "Normal"}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Status Validasi:{" "}
                {verificationDetail?.verify_status ? (
                  <span className="text-green-600 font-medium">Sudah Divalidasi</span>
                ) : (
                  <span className="text-orange-500 font-medium">Belum Divalidasi</span>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-2 md:mt-0">
            {!verificationDetail?.verify_status && (
              <button
                onClick={() => setShowVerificationModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium"
              >
                Validasi
              </button>
            )}
          </div>

          {/* Verification Modal */}
          {showVerificationModal && (
            <div
              className="fixed inset-0 bg-black flex items-center justify-center z-50"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            >
              <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4">
                <h2 className="text-xl font-semibold mb-2">Konfirmasi Validasi Peringatan Transaksi?</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Anda akan memvalidasi status transaksi ini sebagai <span className="font-medium">Suspicious</span>{" "}
                  berdasarkan temuan yang ada. Harap pastikan bahwa informasi yang terdeteksi sesuai dengan analisis
                  Anda.
                </p>

                {/* Transaction Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">ID Transaksi</p>
                      <p className="font-medium">{transaction.transaction_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Volume Karbon (Ton)</p>
                      <p className="font-medium">
                        {parseFloat(transaction["Carbon Volume"] || 0).toLocaleString()} Ton
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tanggal & Waktu</p>
                      <p className="font-medium">{transaction.Date || "2025-08-16 00:00:00"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nilai Transaksi (USD)</p>
                      <p className="font-medium">
                        ${parseFloat(transaction["Transaction Amount"] || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Jenis Transaksi</p>
                      <p className="font-medium">Pembelian Kredit</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pihak Lawan</p>
                      <p className="font-medium">{transaction["Buyer Industry"]}</p>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="flex items-start gap-2 mb-6">
                  <div className="text-yellow-500 mt-1">⚠️</div>
                  <p className="text-sm text-gray-600">
                    Dengan memvalidasi transaksi ini, Anda mengkonfirmasi bahwa Anda telah meninjau semua data dan
                    informasi terkait. Validasi Anda akan mempengaruhi pembaruan model AI serta status akhir transaksi
                    dalam sistem.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    disabled={isUpdating}
                    className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition text-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleVerify("Normal")}
                    disabled={isUpdating}
                    className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded transition text-sm"
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => handleVerify("Suspicious")}
                    disabled={isUpdating}
                    className="flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition text-sm"
                  >
                    Suspicious
                  </button>
                  <button
                    onClick={() => handleVerify("Red-Flag")}
                    disabled={isUpdating}
                    className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded transition text-sm"
                  >
                    Red-Flag
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detail Box */}
        <div className="bg-white rounded-xl p-6 text-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div>
              <span className="text-gray-500">ID Transaksi</span>
              <br />
              {transaction.transaction_id}
            </div>
            <div className="mt-4">
              <span className="text-gray-500">Tanggal & Waktu</span>
              <br />
              {transaction.Date ? transaction.Date.slice(0, 10) : "2025-08-16"}
            </div>
            <div className="mt-4">
              <span className="text-gray-500">Origin Country</span>
              <br />
              {transaction["Origin Country"]}
            </div>
            <div className="mt-4">
              <span className="text-gray-500">Entity Type</span>
              <br />
              {transaction["Entity Type"]}
            </div>
          </div>
          <div>
            <div>
              <span className="text-gray-500">Carbon Volume (Ton)</span>
              <br />
              {parseFloat(transaction["Carbon Volume"] || 0).toLocaleString()} Ton
            </div>
            <div className="mt-4">
              <span className="text-gray-500">Transaction Amount (USD)</span>
              <br />${parseFloat(transaction["Transaction Amount"] || 0).toLocaleString()}
            </div>
            <div className="mt-4">
              <span className="text-gray-500">Price per Ton (USD)</span>
              <br />${parseFloat(transaction["Price per Ton"] || 0).toLocaleString()}
            </div>
            <div className="mt-4">
              <span className="text-gray-500">Buyer Industry</span>
              <br />
              {transaction["Buyer Industry"]}
            </div>
          </div>
        </div>

        {/* AI Insight */}
        {!verificationDetail?.verify_status && (
          <div className="bg-white rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xl">
                ⚡
              </div>
              <div>
                <p className="text-sm text-gray-500">Mendeteksi pola transaksi yang tidak wajar</p>
                <p className="font-semibold">Petunjuk AI</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-700 mb-3">
                Telah mendeteksi potensi transaksi mencurigakan pada transaksi{" "}
                <span className="font-semibold">{transaction.transaction_id}</span>
              </p>

              {/* AI Insight Items */}
              <div
                onClick={() => setShowAIDetailModal(true)}
                className="bg-pink-50 text-pink-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-pink-100 transition-colors text-sm"
              >
                Melakukan transaksi di luar jam kerja normal
              </div>

              <div
                onClick={() => setShowAIDetailModal(true)}
                className="bg-orange-50 text-orange-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors text-sm"
              >
                Volume transaksi tidak proporsional dengan profil industri
              </div>
            </div>
          </div>
        )}

        {/* AI Detail Modal */}
        {showAIDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-start z-50">
            <div className="bg-white w-96 h-full overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Detail</h2>
                  <button
                    onClick={() => setShowAIDetailModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                  >
                    ✕
                  </button>
                </div>

                {/* AI Insight Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xl">
                    ⚡
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mendeteksi pola transaksi yang tidak wajar</p>
                    <p className="font-semibold">Petunjuk AI</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-6">
                  Telah mendeteksi potensi transaksi mencurigakan pada transaksi{" "}
                  <span className="font-semibold">{transaction.transaction_id}</span>
                </p>

                {/* Highlighted Items */}
                <div className="space-y-4 mb-6">
                  <div className="bg-pink-50 text-pink-600 px-4 py-2 rounded-lg text-sm">
                    Melakukan transaksi di luar jam kerja normal
                  </div>

                  <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-lg text-sm">
                    Volume transaksi tidak proporsional dengan profil industri
                  </div>
                </div>

                {/* Detailed Explanation */}
                <div className="space-y-4">
                  <p className="font-semibold text-gray-800">Alasan Peringatan AI:</p>

                  <div>
                    <p className="font-medium text-gray-700 mb-2">1. Transaksi Dilakukan di Luar Jam Normal:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                      <li>
                        Transaksi ini dilakukan pada waktu yang tidak biasa, yaitu pada pukul 23:32:00, di luar jam
                        transaksi yang biasa terjadi (08:00 - 18:00).
                      </li>
                      <li>
                        Model AI mempelajari pola waktu transaksi sebelumnya dan menandai aktivitas ini sebagai
                        mencurigakan karena tidak sesuai dengan profil jam operasi perusahaan.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700 mb-2">
                      2. Volume Transaksi Tidak Proporsional dengan Profil Industri:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                      <li>
                        Volume karbon yang terlibat ({parseFloat(transaction["Carbon Volume"] || 0).toLocaleString()}{" "}
                        ton) jauh lebih besar dibandingkan transaksi karbon lainnya dalam sektor ini, yang rata-rata
                        hanya berkisar antara 10,000 hingga 30,000 ton per transaksi.
                      </li>
                      <li>
                        AI menggunakan dataset historis dan perbandingan dengan industri serupa untuk menandai transaksi
                        ini sebagai outlier yang patut diperiksa lebih lanjut.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* AI Action */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-800 mb-2">Tindakan yang Diambil oleh AI:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>
                      Skor Risiko: 85% - Transaksi mencurigakan dengan probabilitas tinggi terjadinya kecurangan atau
                      pencucian uang.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
