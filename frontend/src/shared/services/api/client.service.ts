import axios, { AxiosInstance, AxiosError } from "axios";
import type { ApiResponse } from "../../../types/api";

// Base URL configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Query options interface for compatibility
interface QueryOptions {
  where?: Record<string, unknown>;
  orderBy?: { field: string; direction: "asc" | "desc" }[];
  limit?: number;
  offset?: number;
  select?: string[];
}

// HTTP Client for backend API communication
class HttpClient {
  private axiosInstance: AxiosInstance;
  private authToken: string | null = null;
  private currentUser: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Setup interceptors
    this.setupInterceptors();

    // Load existing auth token
    this.loadAuthToken();
  }

  /**
   * Setup axios interceptors for automatic JWT handling
   */
  private setupInterceptors(): void {
    // Request interceptor - Add JWT token to all requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token to requests if available
        if (this.authToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers?.Authorization ? "✅ Auth" : "❌ No Auth",
          data: config.data ? Object.keys(config.data) : "No data",
        });

        return config;
      },
      (error) => {
        console.error("❌ Request interceptor error:", error);
        return Promise.reject(error);
      },
    );

    // Response interceptor - Handle auth errors and token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(
          `✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        );
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosError['config'] & { _retry?: boolean };

        // Handle 401 Unauthorized - attempt token refresh
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry
        ) {
          console.log("🔄 401 Unauthorized - attempting token refresh...");
          originalRequest._retry = true;

          try {
            await this.refreshAuthToken();
            // Retry original request with new token
            if (this.authToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${this.authToken}`;
            }
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            console.error("❌ Token refresh failed:", refreshError);
            // Clear auth and redirect to login
            this.clearAuthToken();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        console.error(
          `❌ ${error.response?.status || "Network"} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}:`,
          error.message,
        );
        return Promise.reject(error);
      },
    );
  }

  /**
   * Load auth token from localStorage
   */
  private loadAuthToken(): void {
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        this.authToken = token;
        this.currentUser = userData.id;
        console.log("🔑 Auth token loaded for user:", userData.email);
      } catch (error) {
        console.warn("⚠️ Invalid stored auth data:", error);
        this.clearAuthToken();
      }
    }
  }

  /**
   * Set authentication token and user
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem("auth_token", token);

    // Try to decode token to get user info (if JWT format)
    try {
      // For now, we'll use the user data from localStorage
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        this.currentUser = userData.id;
        console.log("🔑 Auth token set for user:", userData.email);
      }
    } catch {
      console.warn("⚠️ Could not decode token for user info");
    }
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
    this.currentUser = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    console.log("🧹 Auth token cleared");
  }

  /**
   * Get current user ID
   */
  getCurrentUser(): string | null {
    return this.currentUser;
  }

  /**
   * Refresh auth token using refresh endpoint
   */
  private async refreshAuthToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<string> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        },
      );

      if (response.data.success && response.data.data?.token) {
        const newToken = response.data.data.token;
        this.setAuthToken(newToken);
        console.log("✅ Token refreshed successfully");
        return newToken;
      } else {
        throw new Error("Invalid refresh response");
      }
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      throw error;
    }
  }

  /**
   * Create API response wrapper
   */
  private createResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  /**
   * Create error response wrapper
   */
  private createErrorResponse(error: string): ApiResponse<never> {
    return {
      success: false,
      error,
    };
  }

  /**
   * Handle axios errors and convert to API response format
   */
  private handleAxiosError(error: AxiosError): ApiResponse<never> {
    if (error.response?.data) {
      const responseData = error.response.data as { error?: string; message?: string };
      return {
        success: false,
        error: responseData.error || responseData.message || "Server error",
      };
    }

    if (error.request) {
      return this.createErrorResponse("No response from server");
    }

    return this.createErrorResponse(error.message || "Network error");
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    query?: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    try {
      const params = new URLSearchParams();

      // Convert query options to URL params
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === "object") {
              params.append(key, JSON.stringify(value));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      const url = params.toString() ? `${endpoint}?${params}` : endpoint;
      const response = await this.axiosInstance.get(url);

      // Backend returns data in {success, data, message} format
      if (response.data.success) {
        return this.createResponse(
          response.data.data as T,
          response.data.message,
        );
      } else {
        return this.createErrorResponse(
          response.data.error || "Request failed",
        );
      }
    } catch (error) {
      return this.handleAxiosError(error as AxiosError);
    }
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post(endpoint, data);

      // Backend returns data in {success, data, message} format
      if (response.data.success) {
        return this.createResponse(
          response.data.data as T,
          response.data.message,
        );
      } else {
        return this.createErrorResponse(
          response.data.error || "Request failed",
        );
      }
    } catch (error) {
      return this.handleAxiosError(error as AxiosError);
    }
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put(endpoint, data);

      // Backend returns data in {success, data, message} format
      if (response.data.success) {
        return this.createResponse(
          response.data.data as T,
          response.data.message,
        );
      } else {
        return this.createErrorResponse(
          response.data.error || "Request failed",
        );
      }
    } catch (error) {
      return this.handleAxiosError(error as AxiosError);
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch(endpoint, data);

      // Backend returns data in {success, data, message} format
      if (response.data.success) {
        return this.createResponse(
          response.data.data as T,
          response.data.message,
        );
      } else {
        return this.createErrorResponse(
          response.data.error || "Request failed",
        );
      }
    } catch (error) {
      return this.handleAxiosError(error as AxiosError);
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete(endpoint);

      // Backend returns data in {success, data, message} format
      if (response.data.success) {
        return this.createResponse(
          response.data.data as T,
          response.data.message,
        );
      } else {
        return this.createErrorResponse(
          response.data.error || "Request failed",
        );
      }
    } catch (error) {
      return this.handleAxiosError(error as AxiosError);
    }
  }

  /**
   * Backup functionality (not supported in HTTP mode)
   */
  async backup(): Promise<ApiResponse<string>> {
    return this.createErrorResponse("Backup not supported in HTTP mode");
  }

  /**
   * Restore functionality (not supported in HTTP mode)
   */
   
  async restore(_backupData: string): Promise<ApiResponse<void>> {
    return this.createErrorResponse("Restore not supported in HTTP mode");
  }

  /**
   * Clear data functionality (not supported in HTTP mode)
   */
   
  async clearData(_collection?: string): Promise<ApiResponse<void>> {
    return this.createErrorResponse("Clear data not supported in HTTP mode");
  }
}

// API Client wrapper with same interface for compatibility
class ApiClient {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.httpClient.setAuthToken(token);
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.httpClient.clearAuthToken();
  }

  /**
   * Get current user ID
   */
  getCurrentUser(): string | null {
    return this.httpClient.getCurrentUser();
  }

  /**
   * GET request - maintains same interface as LocalStorage version
   */
  async get<T>(
    endpoint: string,
    query?: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    return this.httpClient.get<T>(endpoint, query);
  }

  /**
   * POST request - maintains same interface as LocalStorage version
   */
  async post<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    return this.httpClient.post<T>(endpoint, data);
  }

  /**
   * PUT request - maintains same interface as LocalStorage version
   */
  async put<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    return this.httpClient.put<T>(endpoint, data);
  }

  /**
   * PATCH request - maintains same interface as LocalStorage version
   */
  async patch<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    return this.httpClient.patch<T>(endpoint, data);
  }

  /**
   * DELETE request - maintains same interface as LocalStorage version
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.httpClient.delete<T>(endpoint);
  }

  /**
   * Backup method - maintains same interface
   */
  async backup(): Promise<ApiResponse<string>> {
    return this.httpClient.backup();
  }

  /**
   * Restore method - maintains same interface
   */
  async restore(backupData: string): Promise<ApiResponse<void>> {
    return this.httpClient.restore(backupData);
  }

  /**
   * Clear data method - maintains same interface
   */
  async clearData(collection?: string): Promise<ApiResponse<void>> {
    return this.httpClient.clearData(collection);
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient();

// Export types for compatibility
export type { QueryOptions };
