import axios, { AxiosError } from "axios";
import { z } from "zod";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  paramsSerializer: {
    indexes: null, // Serialize array params as ?season=2024-25&season=2025-26 for FastAPI Query(list[str])
  },
});

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function normalizeAxiosError(error: unknown): never {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 500;
    const detail = error.response?.data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail
          ? JSON.stringify(detail)
          : error.message || `HTTP ${status}`;
    throw new ApiError(status, message);
  }
  throw error instanceof Error ? error : new Error(String(error));
}

export async function apiGet<T>(
  path: string,
  schema: z.ZodType<T>,
  params?: Record<string, string | number | string[] | undefined | null>
): Promise<T> {
  try {
    const cleanParams: Record<string, string | number | string[]> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;
        cleanParams[key] = value;
      }
    }
    const response = await httpClient.get(path, { params: cleanParams });
    return schema.parse(response.data);
  } catch (error) {
    normalizeAxiosError(error);
  }
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  schema: z.ZodType<T>
): Promise<T> {
  try {
    const response = await httpClient.post(path, body);
    return schema.parse(response.data);
  } catch (error) {
    normalizeAxiosError(error);
  }
}
