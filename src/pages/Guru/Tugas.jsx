/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import debounce from "lodash/debounce";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaEdit,
  FaEye,
  FaPlus,
  FaSearch,
  FaSync,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function Tugas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const searchField = searchParams.get("searchField") || "title";
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const myTugas = searchParams.get("myTugas") === "true";

  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tugasToDelete, setTugasToDelete] = useState(null);

  const apiEndpoint = "/v1/tugas";

  // Debounced search handler
  const debouncedSearch = debounce((value, field) => {
    const params = {
      page: "1",
      searchField: field,
      myTugas: myTugas.toString(),
      ...(value && { search: value }),
      sortBy,
      sortOrder,
    };
    setSearchParams(params);
  }, 500);

  useEffect(() => {
    setSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery]);

  // Toggle function for myTugas filter
  const toggleMyTugas = () => {
    setSearchParams({
      page: "1",
      myTugas: (!myTugas).toString(),
      ...(searchQuery && { search: searchQuery }),
      searchField,
      sortBy,
      sortOrder,
    });
  };

  // React Query hook for fetching tugas
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "tugas",
      page,
      searchQuery,
      searchField,
      sortBy,
      sortOrder,
      myTugas,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        searchField,
        sortBy,
        sortOrder,
        myTugas: myTugas.toString(),
      });
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`${apiEndpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue refetching in background
    onError: (err) => {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    },
  });

  // Mutation for deleting tugas
  const deleteMutation = useMutation({
    mutationFn: (id) =>
      api.delete(`${apiEndpoint}/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries([
        "tugas",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myTugas,
      ]);
      const previousData = queryClient.getQueryData([
        "tugas",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myTugas,
      ]);
      queryClient.setQueryData(
        ["tugas", page, searchQuery, searchField, sortBy, sortOrder, myTugas],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((tugas) => tugas._id !== id),
          };
        }
      );
      return { previousData };
    },
    onError: (err, id, context) => {
      console.error("Delete Error:", err.response?.data || err.message);
      queryClient.setQueryData(
        ["tugas", page, searchQuery, searchField, sortBy, sortOrder, myTugas],
        context?.previousData
      );
      toast.error(err.response?.data?.error || "Failed to delete tugas");
    },
    onSuccess: () => {
      toast.success("Tugas deleted successfully");
    },
  });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value, searchField);
  };

  const handleSearchFieldChange = (e) => {
    const newField = e.target.value;
    setSearchParams({
      page: "1",
      searchField: newField,
      ...(search && { search }),
      sortBy,
      sortOrder,
      myTugas: myTugas.toString(),
    });
  };

  const handleSortChange = (field) => {
    const newSortOrder =
      sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSearchParams({
      page: "1",
      ...(searchQuery && { search: searchQuery }),
      searchField,
      sortBy: field,
      sortOrder: newSortOrder,
      myTugas: myTugas.toString(),
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage) {
      setSearchParams({
        page: newPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        searchField,
        sortBy,
        sortOrder,
        myTugas: myTugas.toString(),
      });
    }
  };

  const handleDeleteClick = (tugas) => {
    setTugasToDelete(tugas);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (tugasToDelete) {
      deleteMutation.mutate(tugasToDelete._id);
    }
    setIsModalOpen(false);
    setTugasToDelete(null);
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setTugasToDelete(null);
  };

  const handleManualRefetch = () => {
    refetch();
    toast.success("Data refreshed successfully");
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp)).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredTugas = data?.data || [];

  return (
    <div className="p-2 sm:p-4 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            {myTugas ? "Tugas Dari Saya" : "Semua Tugas"}
          </h1>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {user?.role === "Guru" && (
              <button
                onClick={toggleMyTugas}
                className={`px-2 py-1 text-xs sm:text-sm rounded-md ${
                  myTugas
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {myTugas ? "Perlihatkan Semua" : "Perlihatkan Tugas Saya"}
              </button>
            )}
            {user?.role === "Guru" && (
              <Link
                to="/teachers/tugas/new"
                className="flex items-center bg-indigo-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md hover:bg-indigo-700 transition-all duration-200 text-xs sm:text-sm"
              >
                <FaPlus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                Tambah
              </Link>
            )}
            <button
              onClick={handleManualRefetch}
              disabled={isLoading}
              className="flex items-center bg-blue-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md hover:bg-blue-700 transition-all duration-200 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSync
                className={`mr-1 h-3 w-3 sm:h-4 sm:w-4 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={searchField}
              onChange={handleSearchFieldChange}
              className="p-2 border rounded-md dark:bg-gray-800 dark:text-gray-200 text-xs sm:text-sm w-full sm:w-32"
            >
              <option value="title">Judul</option>
              <option value="kelas">Kelas</option>
              <option value="creator">Pembuat</option>
            </select>
            <div className="relative flex-1">
              <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Cari berdasarkan ${
                  searchField === "title"
                    ? "judul"
                    : searchField === "kelas"
                    ? "kelas"
                    : "pembuat"
                }...`}
                value={search}
                onChange={handleSearchChange}
                className="w-full p-2 pl-8 border rounded-md dark:bg-gray-800 dark:text-gray-200 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="p-2 border rounded-md dark:bg-gray-800 dark:text-gray-200 text-xs sm:text-sm flex-1"
            >
              <option value="title">Urutkan berdasarkan Judul</option>
              <option value="kelas">Urutkan berdasarkan Kelas</option>
              <option value="due_date">Urutkan berdasarkan Tenggat</option>
              <option value="created_at">Urutkan berdasarkan Dibuat</option>
            </select>
            <select
              value={sortOrder}
              onChange={() => handleSortChange(sortBy)}
              className="p-2 border rounded-md dark:bg-gray-800 dark:text-gray-200 text-xs sm:text-sm w-full sm:w-28"
            >
              <option value="asc">Naik</option>
              <option value="desc">Turun</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array(3)
            .fill()
            .map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"
              />
            ))}
        </div>
      )}

      {error && (
        <div className="mb-3 p-3 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-xs sm:text-sm">
            {error.response?.data?.error ||
              error.message ||
              "Gagal memuat tugas"}
          </span>
          <button
            onClick={handleManualRefetch}
            className="text-red-600 dark:text-red-300 hover:underline text-xs sm:text-sm"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {!isLoading && filteredTugas.length === 0 ? (
        <div className="p-4 text-center bg-white dark:bg-gray-800 rounded-md shadow">
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-3">
            Tidak ada tugas ditemukan
          </p>
          {user?.role === "Guru" && (
            <Link
              to="/teachers/tugas/new"
              className="inline-flex items-center bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-all duration-200 text-xs sm:text-sm"
            >
              <FaPlus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              Buat tugas pertama Anda
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="block sm:hidden space-y-3">
            {filteredTugas.map((tugas) => (
              <div
                key={tugas._id}
                className="bg-white dark:bg-gray-800 rounded-md shadow p-3 border dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white line-clamp-2">
                    {tugas.title}
                  </h3>
                </div>

                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p className="line-clamp-2">
                    <span className="font-semibold">Deskripsi:</span>{" "}
                    {tugas.description || "Tidak ada"}
                  </p>
                  <p>
                    <span className="font-semibold">Pembuat:</span>{" "}
                    {tugas.creator?.name || "Tidak diketahui"}
                  </p>
                  <p>
                    <span className="font-semibold">Kelas:</span>{" "}
                    {tugas.kelas?.name || "Tidak ada"}
                  </p>
                  <p>
                    <span className="font-semibold">Tenggat:</span>{" "}
                    {formatDate(tugas.due_date)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {tugas.hasEssayQuiz && (
                      <span className="px-1.5 py-0.5 text-[10px] sm:text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded">
                        Essay
                      </span>
                    )}
                    {tugas.hasMultipleChoice && (
                      <span className="px-1.5 py-0.5 text-[10px] sm:text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded">
                        Pilihan Ganda
                      </span>
                    )}
                    {tugas.hasShortQuiz && (
                      <span className="px-1.5 py-0.5 text-[10px] sm:text-xs bg-yellow-600 text-white dark:bg-yellow-600 dark:text-gray-100 rounded">
                        Jawaban Singkat
                      </span>
                    )}
                    {tugas.requiresFileUploads && (
                      <span className="px-1.5 py-0.5 text-[10px] sm:text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 rounded">
                        Unggah File
                      </span>
                    )}
                    {!tugas.hasEssayQuiz &&
                      !tugas.hasMultipleChoice &&
                      !tugas.hasShortQuiz &&
                      !tugas.requiresFileUploads && (
                        <span className="px-1.5 py-0.5 text-[10px] sm:text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded">
                          Tidak ada kuis
                        </span>
                      )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-3">
                  <Link
                    to={`/teachers/tugas/detail/${tugas._id}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                    title="Lihat Detail"
                  >
                    <FaEye className="h-4 w-4" />
                  </Link>
                  {tugas.requiresFileUpload && (
                    <Link
                      to={`/teachers/tugas/submit/${tugas._id}`}
                      className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 p-1"
                      title="Unggah File"
                    >
                      <FaUpload className="h-4 w-4" />
                    </Link>
                  )}
                  {user?.role === "Guru" && (
                    <>
                      <Link
                        to={`/teachers/tugas/edit/${tugas._id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                        title="Edit"
                      >
                        <FaEdit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(tugas)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                        title="Hapus"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th
                    className="px-3 py-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => handleSortChange("title")}
                  >
                    <div className="flex items-center">
                      Judul
                      {sortBy === "title" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-2">Deskripsi</th>
                  <th className="px-3 py-2">Pembuat</th>
                  <th className="px-3 py-2">Kelas</th>
                  <th className="px-3 py-2">Tenggat</th>
                  <th className="px-3 py-2">Jenis Kuis</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTugas.map((tugas) => (
                  <tr
                    key={tugas._id}
                    className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white max-w-[150px] truncate">
                      {tugas.title}
                    </td>
                    <td className="px-3 py-2 max-w-[200px] truncate">
                      {tugas.description || "Tidak ada"}
                    </td>
                    <td className="px-3 py-2">
                      {tugas.creator?.name || "Tidak diketahui"}
                    </td>
                    <td className="px-3 py-2">
                      {tugas.kelas?.name || "Tidak ada"}
                    </td>
                    <td className="px-3 py-2">{formatDate(tugas.due_date)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {tugas.hasEssayQuiz && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded">
                            Essay
                          </span>
                        )}
                        {tugas.hasMultipleChoice && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded">
                            Pilihan Ganda
                          </span>
                        )}
                        {tugas.hasShortQuiz && (
                          <span className="px-2 py-1 text-xs bg-yellow-600 text-white dark:bg-yellow-600 dark:text-gray-100 rounded">
                            Jawaban Singkat
                          </span>
                        )}
                        {tugas.requiresFileUploads && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 rounded">
                            Unggah File
                          </span>
                        )}
                        {!tugas.hasEssayQuiz &&
                          !tugas.hasMultipleChoice &&
                          !tugas.hasShortQuiz &&
                          !tugas.requiresFileUploads && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded">
                              Tidak ada kuis
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-3 py-2 flex space-x-2">
                      <Link
                        to={`/teachers/tugas/detail/${tugas._id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                        title="Lihat Detail"
                      >
                        <FaEye className="h-4 w-4" />
                      </Link>
                      {tugas.requiresFileUpload && (
                        <Link
                          to={`/teachers/tugas/submit/${tugas._id}`}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 p-1"
                          title="Unggah File"
                        >
                          <FaUpload className="h-4 w-4" />
                        </Link>
                      )}
                      {user?.role === "Guru" && (
                        <>
                          <Link
                            to={`/teachers/tugas/edit/${tugas._id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                            title="Edit"
                          >
                            <FaEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(tugas)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                            title="Hapus"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {filteredTugas.length} dari{" "}
              {data?.pagination?.totalTugas || 0} tugas
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(data?.pagination?.prevPage)}
                disabled={!data?.pagination?.prevPage || isLoading}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
              >
                {isLoading && (
                  <div className="animate-spin h-4 w-4 mr-1 border-t-2 border-gray-700 dark:border-gray-300 rounded-full" />
                )}
                Sebelumnya
              </button>
              <button
                onClick={() => handlePageChange(data?.pagination?.nextPage)}
                disabled={!data?.pagination?.nextPage || isLoading}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
              >
                {isLoading && (
                  <div className="animate-spin h-4 w-4 mr-1 border-t-2 border-gray-700 dark:border-gray-300 rounded-full" />
                )}
                Selanjutnya
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg p-4 w-full max-w-xs">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Konfirmasi Penghapusan
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
              Apakah Anda yakin ingin menghapus tugas{" "}
              <span className="font-medium">"{tugasToDelete?.title}"</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isLoading}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {deleteMutation.isLoading && (
                  <div className="animate-spin h-4 w-4 mr-1 border-t-2 border-white rounded-full" />
                )}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tugas;
