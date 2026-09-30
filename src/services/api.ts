import {
  User,
  Subject,
  WorkItem,
  IncomingFileItem,
  WhatsAppPlatformConfig,
  SystemConfig,
  AuditLog,
  WorkItemType,
} from '../types/index.ts';

const TOKEN_KEY = 'cwh_session_token';

export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) || 'student-token-22k1';
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.error) errorMsg = errData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async getMe(): Promise<{ user: User | null; availableRoles: Array<{ role: string; label: string; token: string }> }> {
    return request('/api/auth/me');
  },

  async login(params: string | { role?: string; email?: string; password?: string; token?: string }): Promise<{ token: string; user: User; message: string }> {
    let body: any = {};
    if (typeof params === 'string') {
      const isToken = params.includes('token');
      body = isToken ? { token: params } : { role: params };
    } else {
      body = params;
    }
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Subjects
  async getSubjects(): Promise<{ subjects: Subject[]; userRole: string }> {
    return request('/api/subjects');
  },

  // Work Items
  async getWorkItems(params?: { subjectId?: string; type?: string; search?: string }): Promise<{ items: WorkItem[]; total: number; filteredForStudent: boolean }> {
    const query = new URLSearchParams();
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString();
    return request(`/api/work-items${qs ? `?${qs}` : ''}`);
  },

  // Admin Overview
  async getAdminOverview(): Promise<{
    stats: {
      totalSubjects: number;
      totalMaterials: number;
      publishedMaterials: number;
      unpublishedDrafts: number;
      pendingReviewCount: number;
      whatsAppStatus: string;
    };
    systemConfig: SystemConfig;
  }> {
    return request('/api/admin/overview');
  },

  // Subject Create
  async createSubject(data: Partial<Subject>): Promise<{ subject: Subject; message: string }> {
    return request('/api/admin/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Work Item Create
  async createWorkItem(data: {
    subjectId: string;
    type: WorkItemType;
    experimentNumber?: number;
    title: string;
    description: string;
    objective?: string;
    dueDate?: string;
    published: boolean;
    tags?: string[];
  }): Promise<{ item: WorkItem; message: string }> {
    return request('/api/admin/work-items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Toggle Publish
  async togglePublish(id: string, published: boolean): Promise<{ item: WorkItem; message: string }> {
    return request(`/api/admin/work-items/${id}/publish`, {
      method: 'PUT',
      body: JSON.stringify({ published }),
    });
  },

  // Delete Work Item
  async deleteWorkItem(id: string): Promise<{ message: string }> {
    return request(`/api/admin/work-items/${id}`, {
      method: 'DELETE',
    });
  },

  // AI Classification
  async detectDocument(data: {
    fileName: string;
    textSnippet?: string;
    fileType?: string;
  }): Promise<{
    detectedSubjectId: string;
    detectedSubjectName: string;
    detectedType: WorkItemType;
    detectedExperimentNumber?: number;
    suggestedTitle: string;
    extractedKeywords: string[];
    summary: string;
    confidenceScore: number;
    isDuplicate: boolean;
    duplicateMatch?: any;
    engine?: string;
  }> {
    return request('/api/admin/detect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Check Duplicate
  async checkDuplicate(data: {
    subjectId: string;
    type: WorkItemType;
    experimentNumber?: number;
    title?: string;
    fileHash?: string;
  }): Promise<{ isDuplicate: boolean; matchedItem?: any }> {
    return request('/api/admin/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Incoming Review Queue
  async getIncomingQueue(): Promise<{ queue: IncomingFileItem[] }> {
    return request('/api/admin/incoming-queue');
  },

  async enqueueFile(data: {
    fileName: string;
    fileSize?: number;
    rawSnippet?: string;
    senderName?: string;
    source?: 'direct_upload' | 'faculty_portal';
  }): Promise<{ queueItem: IncomingFileItem; message: string }> {
    return request('/api/admin/incoming-queue', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async processReviewDecision(
    id: string,
    action: 'approve_publish' | 'save_draft' | 'reject',
    correctedData?: Partial<WorkItem>
  ): Promise<{ workItem?: WorkItem; message: string }> {
    return request(`/api/admin/incoming-queue/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action, correctedData }),
    });
  },

  // WhatsApp Platform
  async getWhatsAppStatus(): Promise<{
    config: WhatsAppPlatformConfig;
    guide: { title: string; steps: string[] };
  }> {
    return request('/api/admin/whatsapp/status');
  },

  async updateWhatsAppConfig(data: {
    phoneNumberId: string;
    wabaId: string;
    verifyToken?: string;
  }): Promise<{ config: WhatsAppPlatformConfig; message: string }> {
    return request('/api/admin/whatsapp/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async simulateWhatsAppIncoming(data: {
    senderPhone?: string;
    senderName?: string;
    fileName: string;
    topicSnippet?: string;
    autoPublishToSubject?: boolean;
  }): Promise<{ queueItem: IncomingFileItem; publishedItem?: WorkItem; message: string }> {
    return request('/api/admin/whatsapp/simulate-incoming', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // System Config & Audit Logs
  async getSystemConfig(): Promise<{ config: SystemConfig; auditLogs: AuditLog[] }> {
    return request('/api/admin/system/config');
  },

  async updateSystemConfig(config: Partial<SystemConfig>): Promise<{ config: SystemConfig; message: string }> {
    return request('/api/admin/system/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },
};
