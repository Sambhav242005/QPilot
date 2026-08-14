// ─── API Client ──────────────────────────────────────────────────────
// Typed API client for QPilot backend

const API_BASE_URL = "";

// ─── Types ───────────────────────────────────────────────────────────
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface Complaint {
  id: string;
  raw_input: string;
  status: string;
  extraction: unknown | null;
  classification: unknown | null;
  risk_assessment: unknown | null;
  completeness: unknown | null;
  created_at: string;
  updated_at: string;
}

interface AuditEvent {
  id: string;
  createdAt: string;
  complaintId: string;
  eventType: string;
  description: string;
  actor: string;
  details: string | null;
}

// ─── HTTP Client ─────────────────────────────────────────────────────
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Don't set Content-Type for FormData — browser sets multipart boundary automatically
  const isFormData = options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData
    ? {}
    : { "Content-Type": "application/json" };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data?.error ?? data?.detail ?? `HTTP ${response.status}`,
    };
  }

  // Backend returns raw objects, not wrapped in { success, data }.
  // Wrap them so callers can rely on res.success / res.data.
  return { success: true, data: data as T };
}

// ─── Complaint API ───────────────────────────────────────────────────
export const complaintApi = {
  /**
   * Get all complaints with optional filtering
   */
  async getAll(params?: {
    status?: string;
    reviewState?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Complaint[]>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.reviewState) searchParams.set("reviewState", params.reviewState);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));

    const query = searchParams.toString();
    return request<Complaint[]>(`/api/v1/complaints${query ? `?${query}` : ""}`);
  },

  /**
   * Get a single complaint by ID
   */
  async getById(id: string): Promise<ApiResponse<Complaint>> {
    return request<Complaint>(`/api/v1/complaints/${id}`);
  },

  /**
   * Create a new complaint
   */
  async create(data: {
    rawInput: string;
    inputType?: string;
    filePath?: string;
  }): Promise<ApiResponse<Complaint>> {
    return request<Complaint>("/api/v1/complaints", {
      method: "POST",
      body: JSON.stringify({
        raw_input: data.rawInput,
        input_type: data.inputType ?? "text",
      }),
    });
  },

  /**
   * Update a complaint
   */
  async update(id: string, data: Record<string, unknown>): Promise<ApiResponse<Complaint>> {
    return request<Complaint>(`/api/v1/complaints/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a complaint
   */
  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return request<{ message: string }>(`/api/v1/complaints/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Commit a complaint to QMS
   */
  async commit(
    id: string,
  ): Promise<ApiResponse<{ id: string; qmsId: string; committedAt: string; message: string }>> {
    return request(`/api/v1/complaints/${id}/commit`, {
      method: "POST",
    });
  },

  /**
   * Process a complaint through AI workflow
   */
  async process(id: string): Promise<ApiResponse<Complaint>> {
    return request<Complaint>(`/api/v1/complaints/${id}/process`, {
      method: "POST",
    });
  },

  /**
   * Send a chat message about a complaint
   */
  async sendMessage(id: string, message: string): Promise<ApiResponse<{ role: string; content: string }>> {
    return request(`/api/v1/complaints/${id}/message?message=${encodeURIComponent(message)}`, {
      method: "POST",
    });
  },

  /**
   * Apply a correction to a complaint
   */
  async correct(id: string, correction: string): Promise<ApiResponse<Complaint>> {
    return request<Complaint>(`/api/v1/complaints/${id}/correct?correction=${encodeURIComponent(correction)}`, {
      method: "POST",
    });
  },

  /**
   * Upload a document for a complaint
   */
  async upload(id: string, file: File): Promise<ApiResponse<Complaint>> {
    const formData = new FormData();
    formData.append("file", file);
    return request<Complaint>(`/api/v1/complaints/${id}/upload`, {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Check for duplicate complaints
   */
  async checkDuplicates(id: string): Promise<ApiResponse<Array<{
    complaint_id: string;
    product_name: string;
    batch_number: string;
    score: number;
    label: string;
    reasons: string[];
  }>>> {
    return request(`/api/v1/complaints/${id}/duplicates`);
  },
};

// ─── Export Types ────────────────────────────────────────────────────
export type { Complaint, AuditEvent, ApiResponse };
