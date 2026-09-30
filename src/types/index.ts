export type Role = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  semester?: number;
  department?: string;
  title?: string;
}

export type WorkItemType = 'practical' | 'assignment' | 'manual' | 'notes';

export interface Attachment {
  id: string;
  name: string;
  fileType: 'pdf' | 'image' | 'archive' | 'document' | 'code';
  sizeBytes: number;
  url: string;
  previewContent?: string;
  pageCount?: number;
  hash: string;
}

export interface WorkItem {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  type: WorkItemType;
  experimentNumber?: number;
  title: string;
  description: string;
  objective?: string;
  dueDate?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  attachments: Attachment[];
  fileHash?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester: number;
  department: string;
  description: string;
  facultyName: string;
  totalPracticals: number;
  totalAssignments: number;
  totalManuals: number;
  publishedCount: number;
  color: string;
}

export interface IncomingFileItem {
  id: string;
  source: 'direct_upload' | 'whatsapp_webhook' | 'faculty_portal';
  sender: {
    name: string;
    contact: string;
    roleTag?: string;
  };
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'image' | 'docx';
  fileHash: string;
  receivedAt: string;
  status: 'pending_review' | 'approved' | 'rejected';
  rawSnippet?: string;
  detection: {
    detectedSubjectId: string;
    detectedSubjectName: string;
    detectedType: WorkItemType;
    detectedExperimentNumber?: number;
    suggestedTitle: string;
    confidenceScore: number; // 0 to 1
    extractedKeywords: string[];
    summary: string;
    isDuplicate: boolean;
    duplicateMatch?: {
      existingItemId: string;
      existingTitle: string;
      subjectName: string;
      matchReason: string;
    };
  };
}

export interface WhatsAppPlatformConfig {
  isConfigured: boolean;
  phoneNumberId: string;
  wabaId: string;
  webhookUrl: string;
  verifyToken: string;
  status: 'active' | 'not_configured' | 'pending_verification';
  lastVerifiedAt?: string;
  incomingCount: number;
  registeredPhoneNumbers: string[];
}

export interface SystemConfig {
  academicYear: string;
  currentSemester: number;
  maxUploadSizeMb: number;
  allowedExtensions: string[];
  autoPublishConfidenceThreshold: number;
  strictDuplicateCheck: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole: Role;
  details: string;
}
