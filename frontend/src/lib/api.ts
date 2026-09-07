export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return `http://${window.location.hostname}:5000/api/v1`;
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authToken', token);
}

/**
 * Ensures the client has an active synthetic demo token.
 * Authenticates via backend /auth/register or /auth/login with synthetic data.
 */
export async function ensureAuthenticated(): Promise<string> {
  const existing = getAuthToken();
  if (existing) return existing;

  try {
    const demoPayload = {
      name: 'Ramesh Kumar (Demo Vendor)',
      email: `demo_vendor_${Date.now().toString().slice(-4)}@streetsanitation.local`,
      password: 'DemoVendorPassword123!',
      phone: '8102098695',
    };

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(demoPayload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.data?.token) {
        setAuthToken(data.data.token);
        return data.data.token;
      }
    }
  } catch (err) {
    console.warn('Backend offline or unreachable during demo session setup:', err);
  }

  // Fallback synthetic token representation for disconnected demo environments
  const fallback = 'demo_synthetic_jwt_token_2026';
  setAuthToken(fallback);
  return fallback;
}

/**
 * Generic API fetch wrapper with Bearer token, cookies, and human-friendly error messages.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const token = await ensureAuthenticated();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    const baseUrl = getApiBaseUrl();
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      let message = 'Unable to connect. Please try again.';
      if (res.status === 401) {
        message = 'Your session has expired. Please sign in again.';
      } else if (res.status === 404) {
        message = 'Application not found.';
      } else if (res.status === 400 && json?.error?.message) {
        message = json.error.message;
      } else if (json?.message) {
        message = json.message;
      }
      return { success: false, error: message };
    }

    return { success: true, data: json?.data || json };
  } catch (e: any) {
    return {
      success: false,
      error: 'Unable to connect to service. Please check your network and try again.',
    };
  }
}