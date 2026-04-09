export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const fallback = { message: "Request failed" };
    const payload = (await response.json().catch(() => fallback)) as { message?: string };
    throw new Error(payload.message ?? fallback.message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

