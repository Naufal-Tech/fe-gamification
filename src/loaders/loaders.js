/* eslint-disable no-unused-vars */
import { redirect } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

// In your loader
const cache = new Map();

// Centralized auth service - FIXED
function getAccessToken() {
  const storeToken = useAuthStore.getState().accessToken;
  const localToken = localStorage.getItem("accessToken");

  // Use store token first, fallback to localStorage
  return storeToken || localToken;
}

// Enhanced auth check - NEW
function isValidAuth() {
  const { isAuthenticated, accessToken, user } = useAuthStore.getState();
  const localToken = localStorage.getItem("accessToken");

  return isAuthenticated && (accessToken || localToken) && user;
}

// Handle auth errors consistently - NEW
function handleAuthError() {
  const { clearAuth } = useAuthStore.getState();
  clearAuth();
  throw redirect("/sign-in");
}

export const userLoader = async () => {
  // Check auth state first
  if (!isValidAuth()) {
    return null;
  }

  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    const response = await api.get("/v1/users/info-user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      withCredentials: true,
    });

    console.log("Loader fetched user info:", response.data);

    const { setUser } = useAuthStore.getState();
    setUser(response.data.user);

    return response.data.user;
  } catch (error) {
    console.error("Loader failed to fetch user info:", error);
    if (error.response?.status === 401) {
      handleAuthError();
    }
    return null;
  }
};

export async function multipleChoiceLoader({ request }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";

  try {
    const response = await api.get(`/v1/multiple-choice?page=${page}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load data", {
      status: error.response?.status || 500,
    });
  }
}

export async function categoryLoader() {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  try {
    const response = await api.get("/v1/category-quiz");
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load categories", {
      status: error.response?.status || 500,
    });
  }
}

export async function kelasLoader() {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  try {
    const response = await api.get("/v1/kelas");
    return response.data.kelas;
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load classes", {
      status: error.response?.status || 500,
    });
  }
}

export async function multipleChoiceEditLoader({ params }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  try {
    const [bundleResponse, categoriesResponse] = await Promise.all([
      api.get(`/v1/multiple-choice/detail/${params.id}`),
      api.get("/v1/category-quiz"),
    ]);

    return {
      bundle: bundleResponse.data,
      categories: categoriesResponse.data,
    };
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load bundle or categories", {
      status: error.response?.status || 500,
    });
  }
}

export const classLoader = async () => {
  // This loader doesn't seem to require auth based on your code
  // But if it should, add the auth check
  try {
    const response = await api.get("/v1/kelas", {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    console.log("Loader fetched classes:", response.data);
    return response.data.kelas;
  } catch (error) {
    console.error("Loader failed to fetch classes:", error);
    if (error.response?.status === 401 && isValidAuth()) {
      handleAuthError();
    }
    return [];
  }
};

export async function shortQuizEditLoader({ params }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  try {
    const [quizResponse, categoriesResponse, kelasResponse] = await Promise.all(
      [
        api.get(`/v1/short-quiz/detail/${params.id}`),
        api.get("/v1/category-quiz"),
        api.get("/v1/kelas"),
      ]
    );

    return {
      quiz: quizResponse.data,
      categories: categoriesResponse.data,
      kelasList: kelasResponse.data.kelas,
    };
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load quiz data", {
      status: error.response?.status || 500,
    });
  }
}

export async function shortQuizAddLoader({ request }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  try {
    const [categoriesRes, kelasRes] = await Promise.all([
      api.get("/v1/category-quiz"),
      api.get("/v1/kelas"),
    ]);

    return {
      categories: categoriesRes.data.data,
      kelasList: kelasRes.data.kelas || kelasRes.data.data || kelasRes.data,
    };
  } catch (err) {
    if (err.response?.status === 401) {
      handleAuthError();
    }
    throw new Response(err.response?.data?.error || "Failed to load data", {
      status: err.response?.status || 500,
    });
  }
}

export async function multipleChoiceCreateLoader() {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  try {
    const [categoriesResponse, kelasResponse] = await Promise.all([
      api.get("/v1/category-quiz"),
      api.get("/v1/kelas"),
    ]);

    return {
      categories: categoriesResponse.data.data,
      kelas: kelasResponse.data.kelas,
    };
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load create form data", {
      status: error.response?.status || 500,
    });
  }
}

export async function teacherClassesLoader() {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  const user = await userLoader();
  if (!user) {
    throw redirect("/sign-in");
  }
  return user;
}

export async function shortQuizLoader({ request }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const searchQuery = url.searchParams.get("search") || "";
  const searchField = url.searchParams.get("searchField") || "title";
  const sortBy = url.searchParams.get("sortBy") || "created_at";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const myQuizzes = url.searchParams.get("myQuizzes") || "false";

  try {
    const params = new URLSearchParams({
      page,
      searchField,
      sortBy,
      sortOrder,
      myQuizzes,
    });

    if (searchQuery) {
      params.append("search", searchQuery);
    }

    const response = await api.get(`/v1/short-quiz?${params.toString()}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load short quizzes", {
      status: error.response?.status || 500,
    });
  }
}

export async function tugasLoader({ request }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const searchQuery = url.searchParams.get("search") || "";
  const searchField = url.searchParams.get("searchField") || "title";
  const sortBy = url.searchParams.get("sortBy") || "created_at";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const myTugas = url.searchParams.get("myTugas") || "false";

  try {
    const params = new URLSearchParams({
      page,
      searchField,
      sortBy,
      sortOrder,
      myTugas,
    });

    if (searchQuery) {
      params.append("search", searchQuery);
    }

    const response = await api.get(`/v1/tugas?${params.toString()}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load assignments", {
      status: error.response?.status || 500,
    });
  }
}

export async function tugasAddLoader() {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  try {
    const [kelasResponse, categoriesResponse] = await Promise.all([
      api.get("/v1/kelas"),
      api.get("/v1/categories"),
    ]);

    return {
      kelas: kelasResponse.data.data,
      categories: categoriesResponse.data.data,
    };
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load data for creating assignment", {
      status: error.response?.status || 500,
    });
  }
}

export async function tugasEditLoader({ params }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  try {
    const [tugasResponse, kelasResponse, categoriesResponse] =
      await Promise.all([
        api.get(`/v1/tugas/${params.id}`),
        api.get("/v1/kelas"),
        api.get("/v1/categories"),
      ]);

    return {
      tugas: tugasResponse.data.data,
      kelas: kelasResponse.data.data,
      categories: categoriesResponse.data.data,
    };
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load assignment data", {
      status: error.response?.status || 500,
    });
  }
}

export async function tugasDetailLoader({ params }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  try {
    const response = await api.get(`/v1/tugas/${params.id}`);
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load assignment details", {
      status: error.response?.status || 500,
    });
  }
}

export async function tugasSubmitLoader({ params }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  try {
    const response = await api.get(`/v1/tugas/${params.id}`);
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load assignment for submission", {
      status: error.response?.status || 500,
    });
  }
}

export async function examLoader({ request }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const searchQuery = url.searchParams.get("search") || "";
  const searchField = url.searchParams.get("searchField") || "title";
  const sortBy = url.searchParams.get("sortBy") || "created_at";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const myExams = url.searchParams.get("myExams") || "false";

  try {
    const params = new URLSearchParams({
      page,
      searchField,
      sortBy,
      sortOrder,
      myExams,
    });

    if (searchQuery) {
      params.append("search", searchQuery);
    }

    const response = await api.get(`/v1/exam?${params.toString()}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load exams", {
      status: error.response?.status || 500,
    });
  }
}

export async function penilaianTugasLoader({ request }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const searchQuery = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "submitted";
  const kelasId = url.searchParams.get("kelasId") || "";
  const tugasId = url.searchParams.get("tugasId") || "";
  const sortBy = url.searchParams.get("sortBy") || "submittedAt";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";

  try {
    const params = new URLSearchParams({
      page,
      status,
      sortBy,
      sortOrder,
      limit: "10",
    });

    if (searchQuery) params.append("search", searchQuery);
    if (kelasId) params.append("kelasId", kelasId);
    if (tugasId) params.append("tugasId", tugasId);

    const response = await api.get(`/v1/tugas/my-tugas?${params.toString()}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load submissions", {
      status: error.response?.status || 500,
    });
  }
}

export async function kelasTugasLoader({ request }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const searchQuery = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sortBy") || "created_at";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      sortBy,
      sortOrder,
    });

    if (searchQuery.trim()) {
      params.append("search", searchQuery.trim());
    }

    const response = await api.get(
      `/v1/kelas/tugas-info?${params.toString()}`,
      {
        timeout: 10000,
      }
    );

    const data = response.data.data;

    // Validate pagination and redirect if necessary
    if (
      data.pagination &&
      data.pagination.currentPage > data.pagination.totalPages &&
      data.pagination.totalPages > 0
    ) {
      const correctedUrl = new URL(request.url);
      correctedUrl.searchParams.set(
        "page",
        data.pagination.totalPages.toString()
      );

      throw new Response(null, {
        status: 302,
        headers: {
          Location: correctedUrl.toString(),
        },
      });
    }

    return data;
  } catch (error) {
    console.error("Loader Error:", error);

    if (error.response?.status === 401) {
      handleAuthError();
    }

    if (error.response?.status === 404) {
      throw new Response("Not Found", {
        status: 404,
        statusText: "Page not found",
      });
    }

    if (error.code === "ECONNABORTED") {
      throw new Response("Request timeout", {
        status: 408,
        statusText: "Request timed out",
      });
    }

    throw new Response("Failed to load class assignments", {
      status: error.response?.status || 500,
      statusText: error.response?.statusText || "Internal Server Error",
    });
  }
}

export async function kelasExamsLoader({ request }) {
  if (!isValidAuth()) {
    throw redirect("/sign-in");
  }

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const searchQuery = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sortBy") || "created_at";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";

  // Create a cache key based on query parameters
  const cacheKey = `${page}-${searchQuery}-${sortBy}-${sortOrder}`;

  // Check cache
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const params = new URLSearchParams({
      page,
      sortBy,
      sortOrder,
    });

    if (searchQuery) {
      params.append("search", searchQuery);
    }

    const response = await api.get(`/v1/kelas/exam-info?${params.toString()}`);

    // Store in cache
    cache.set(cacheKey, response.data.data);

    // Limit cache size (e.g., 10 pages)
    if (cache.size > 10) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    return response.data.data;
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError();
    }
    throw new Response("Failed to load class exams", {
      status: error.response?.status || 500,
    });
  }
}
