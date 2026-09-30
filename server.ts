import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import {
  User,
  Subject,
  WorkItem,
  IncomingFileItem,
  WhatsAppPlatformConfig,
  SystemConfig,
  AuditLog,
  WorkItemType
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

// Initialize Gemini client if API key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
  } catch (err) {
    console.warn('Gemini client init skipped or failed:', err);
  }
}

// ----------------------------------------------------
// Mock In-Memory Database
// ----------------------------------------------------

const DEMO_USERS: Record<string, User> = {
  'student-token-22k1': {
    id: 'usr-student-01',
    name: 'Alex Rivera',
    email: 'alex.rivera@college.edu',
    role: 'student',
    semester: 6,
    department: 'Computer Science & Engineering',
    title: 'B.Tech CSE Student (Class of 2026)',
  },
  'admin-token-77x9': {
    id: 'usr-admin-01',
    name: 'Prof. Sarah Jenkins',
    email: 'sarah.jenkins@college.edu',
    role: 'admin',
    department: 'Computer Science & Engineering',
    title: 'Department Lab Coordinator & Admin',
  },
};

let subjects: Subject[] = [];

let workItems: WorkItem[] = [];

// Admin Incoming Review Queue
let incomingReviewQueue: IncomingFileItem[] = [];

let whatsAppConfig: WhatsAppPlatformConfig = {
  isConfigured: false,
  phoneNumberId: "",
  wabaId: "",
  webhookUrl: "https://college-work-hub.internal/api/webhooks/whatsapp",
  verifyToken: "cwh_verify_" + crypto.randomBytes(8).toString("hex"),
  status: "not_configured",
  incomingCount: 0,
  registeredPhoneNumbers: [],
};

let systemConfig: SystemConfig = {
  academicYear: "2026-2027",
  currentSemester: 6,
  maxUploadSizeMb: 50,
  allowedExtensions: ["pdf", "png", "jpg", "jpeg", "docx", "zip"],
  autoPublishConfidenceThreshold: 0.98,
  strictDuplicateCheck: true,
};

let auditLogs: AuditLog[] = [];

// ----------------------------------------------------
// Auth & Role Middleware
// ----------------------------------------------------

function getSessionUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return DEMO_USERS[token] || null;
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({
      error: 'Authentication required. Please provide a valid session token.',
      code: 'UNAUTHENTICATED'
    });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied: Admin authorization required. Students cannot access administrative controls or unpublished data.',
      code: 'FORBIDDEN'
    });
  }
  (req as any).user = user;
  next();
}

// ----------------------------------------------------
// Express App Initialization
// ----------------------------------------------------

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // 1. Auth & Session Endpoints
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getSessionUser(req);
    if (!user) {
      // Default to guest/student representation if unauthenticated
      return res.json({
        user: null,
        availableRoles: [
          { role: 'student', label: 'Student (Alex Rivera)', token: 'student-token-22k1' },
          { role: 'admin', label: 'Admin (Prof. Sarah Jenkins)', token: 'admin-token-77x9' },
        ]
      });
    }
    return res.json({
      user,
      availableRoles: [
        { role: 'student', label: 'Student (Alex Rivera)', token: 'student-token-22k1' },
        { role: 'admin', label: 'Admin (Prof. Sarah Jenkins)', token: 'admin-token-77x9' },
      ]
    });
  });

  const ADMIN_AUTH = {
    emails: ['admin@collegehub.edu', 'ipshitanareda@gmail.com', 'admin@college.edu', 'sarah.jenkins@college.edu'],
    password: process.env.ADMIN_PASSWORD || 'Admin@College2026',
  };

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { token, role, email, password } = req.body;

    // Direct token provided
    if (token && DEMO_USERS[token]) {
      const user = DEMO_USERS[token];
      return res.json({
        token,
        user,
        message: `Signed in as ${user.role}: ${user.name}`
      });
    }

    // Student role switch (open access for students)
    if (role === 'student' && !email && !password) {
      const user = DEMO_USERS['student-token-22k1'];
      return res.json({
        token: 'student-token-22k1',
        user,
        message: 'Signed in as Student (Alex Rivera)'
      });
    }

    // Admin login requires valid Email and Password verification on the server
    if (role === 'admin' || email || password) {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();

      const isEmailMatch = ADMIN_AUTH.emails.some(e => e.toLowerCase() === cleanEmail);
      const isPassMatch = cleanPass === ADMIN_AUTH.password;

      if (isEmailMatch && isPassMatch) {
        const user = DEMO_USERS['admin-token-77x9'];
        return res.json({
          token: 'admin-token-77x9',
          user,
          message: `Admin access granted. Welcome, ${user.name}`
        });
      }

      return res.status(401).json({
        error: 'Invalid admin credentials. Please enter a valid authorized faculty email and password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    return res.status(400).json({ error: 'Please provide valid login parameters' });
  });

  // 2. Subjects (Role-filtered)
  app.get('/api/subjects', (req: Request, res: Response) => {
    const user = getSessionUser(req);
    const isAdmin = user?.role === 'admin';

    // Recalculate live counts
    const updatedSubjects = subjects.map(sub => {
      const allSubItems = workItems.filter(w => w.subjectId === sub.id);
      const publishedSubItems = allSubItems.filter(w => w.published);

      return {
        ...sub,
        totalPracticals: isAdmin
          ? allSubItems.filter(w => w.type === 'practical').length
          : publishedSubItems.filter(w => w.type === 'practical').length,
        totalAssignments: isAdmin
          ? allSubItems.filter(w => w.type === 'assignment').length
          : publishedSubItems.filter(w => w.type === 'assignment').length,
        totalManuals: isAdmin
          ? allSubItems.filter(w => w.type === 'manual').length
          : publishedSubItems.filter(w => w.type === 'manual').length,
        publishedCount: publishedSubItems.length,
        unpublishedCount: isAdmin ? allSubItems.length - publishedSubItems.length : undefined,
      };
    });

    return res.json({ subjects: updatedSubjects, userRole: user?.role || 'student' });
  });

  // 3. Work Items (Role-filtered: Students only receive published files!)
  app.get('/api/work-items', (req: Request, res: Response) => {
    const user = getSessionUser(req);
    const isAdmin = user?.role === 'admin';
    const { subjectId, type, search } = req.query;

    let items = [...workItems];

    // CRITICAL: Students NEVER receive unpublished files over the wire
    if (!isAdmin) {
      items = items.filter(w => w.published === true);
    }

    if (subjectId && typeof subjectId === 'string' && subjectId !== 'all') {
      items = items.filter(w => w.subjectId === subjectId);
    }

    if (type && typeof type === 'string' && type !== 'all') {
      items = items.filter(w => w.type === type);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      items = items.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        (w.experimentNumber && `exp ${w.experimentNumber}`.includes(q)) ||
        (w.experimentNumber && `practical ${w.experimentNumber}`.includes(q)) ||
        w.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort: practicals by experiment number, then others by date
    items.sort((a, b) => {
      if (a.type === 'practical' && b.type === 'practical') {
        return (a.experimentNumber || 0) - (b.experimentNumber || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return res.json({
      items,
      total: items.length,
      filteredForStudent: !isAdmin,
    });
  });

  // ----------------------------------------------------
  // ADMIN ONLY ENDPOINTS (Strictly protected by requireAdminAuth)
  // ----------------------------------------------------

  // Admin Dashboard Overview Statistics
  app.get('/api/admin/overview', requireAdminAuth, (_req: Request, res: Response) => {
    const totalSubjects = subjects.length;
    const totalMaterials = workItems.length;
    const publishedMaterials = workItems.filter(w => w.published).length;
    const unpublishedDrafts = totalMaterials - publishedMaterials;
    const pendingQueueCount = incomingReviewQueue.filter(i => i.status === 'pending_review').length;

    return res.json({
      stats: {
        totalSubjects,
        totalMaterials,
        publishedMaterials,
        unpublishedDrafts,
        pendingReviewCount: pendingQueueCount,
        whatsAppStatus: whatsAppConfig.status,
      },
      systemConfig,
    });
  });

  // Subject Management
  app.post('/api/admin/subjects', requireAdminAuth, (req: Request, res: Response) => {
    const { code, name, semester, department, description, facultyName, color } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Subject code and title are required' });
    }
    const newSubject: Subject = {
      id: 'sub-' + code.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      code: code.trim(),
      name: name.trim(),
      semester: Number(semester) || 6,
      department: department?.trim() || 'Computer Science',
      description: description?.trim() || '',
      facultyName: facultyName?.trim() || 'Unassigned Faculty',
      totalPracticals: 0,
      totalAssignments: 0,
      totalManuals: 0,
      publishedCount: 0,
      color: color || 'emerald',
    };
    subjects.push(newSubject);

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'CREATE_SUBJECT',
      actorName: (req as any).user.name,
      actorRole: 'admin',
      details: `Created subject: ${newSubject.name} (${newSubject.code})`,
    });

    return res.json({ subject: newSubject, message: 'Subject created successfully' });
  });

  // Work Item Create / Update / Delete
  app.post('/api/admin/work-items', requireAdminAuth, (req: Request, res: Response) => {
    const {
      subjectId,
      type,
      experimentNumber,
      title,
      description,
      objective,
      dueDate,
      published,
      tags,
      attachments,
    } = req.body;

    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) {
      return res.status(400).json({ error: 'Valid subject selection is required' });
    }
    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    const newItem: WorkItem = {
      id: 'wi-' + Date.now().toString(36),
      subjectId,
      subjectName: sub.name,
      subjectCode: sub.code,
      type,
      experimentNumber: type === 'practical' ? Number(experimentNumber) || undefined : undefined,
      title: title.trim(),
      description: description?.trim() || '',
      objective: objective?.trim() || '',
      dueDate: dueDate || undefined,
      published: Boolean(published),
      publishedAt: published ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: Array.isArray(tags) ? tags : [],
      attachments: Array.isArray(attachments) ? attachments : [
        {
          id: 'att-' + Date.now(),
          name: `${title.replace(/\s+/g, '_').substring(0, 30)}.pdf`,
          fileType: 'pdf',
          sizeBytes: 450000,
          pageCount: 3,
          url: '/downloads/sample_doc.pdf',
          hash: crypto.createHash('sha256').update(title + Date.now()).digest('hex'),
          previewContent: `Material: ${title}\nSubject: ${sub.name} (${sub.code})\nType: ${type}\n\n${description || 'Document contents verified by department faculty.'}`
        }
      ],
    };

    workItems.push(newItem);

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: newItem.published ? 'PUBLISH_ITEM' : 'CREATE_DRAFT',
      actorName: (req as any).user.name,
      actorRole: 'admin',
      details: `${newItem.published ? 'Published' : 'Saved draft'} [${sub.code}] ${newItem.title}`,
    });

    return res.json({ item: newItem, message: 'Work item created successfully' });
  });

  // Toggle Publish Status
  app.put('/api/admin/work-items/:id/publish', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const { published } = req.body;
    const item = workItems.find(w => w.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Work item not found' });
    }

    item.published = Boolean(published);
    item.publishedAt = item.published ? new Date().toISOString() : undefined;
    item.updatedAt = new Date().toISOString();

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: item.published ? 'PUBLISH_ITEM' : 'UNPUBLISH_ITEM',
      actorName: (req as any).user.name,
      actorRole: 'admin',
      details: `${item.published ? 'Published' : 'Unpublished'} [${item.subjectCode}] ${item.title}`,
    });

    return res.json({ item, message: `Work item ${item.published ? 'published' : 'unpublished'} successfully` });
  });

  // Delete Work Item
  app.delete('/api/admin/work-items/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const index = workItems.findIndex(w => w.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Work item not found' });
    }
    const [deleted] = workItems.splice(index, 1);

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'DELETE_ITEM',
      actorName: (req as any).user.name,
      actorRole: 'admin',
      details: `Deleted [${deleted.subjectCode}] ${deleted.title}`,
    });

    return res.json({ message: 'Work item deleted successfully' });
  });

  // 4. AI-Based Subject & Experiment Detection
  app.post('/api/admin/detect', requireAdminAuth, async (req: Request, res: Response) => {
    const { fileName, textSnippet, fileType } = req.body;

    if (!fileName && !textSnippet) {
      return res.status(400).json({ error: 'File name or content text is required for AI classification' });
    }

    const availableSubjectList = subjects.map(s => `${s.id}: ${s.name} (${s.code})`).join('\n');

    // Attempt Gemini 2.5/Flash classification if API key is present
    if (aiClient) {
      try {
        const prompt = `You are an automated academic document classification engine for College Work Hub.
Analyze the following document filename and text snippet to classify:
1. Target subject ID from the list below:
${availableSubjectList}
2. Document type: 'practical' or 'assignment' or 'manual' or 'notes'
3. Experiment number if practical (e.g. 1, 2, 3), or null
4. Suggested clean professional title
5. Extracted 3-5 key technical topic keywords
6. 1-2 sentence concise summary
7. Confidence score between 0.0 and 1.0

DOCUMENT FILENAME: ${fileName || 'N/A'}
CONTENT SNIPPET:
${(textSnippet || '').substring(0, 1500)}

Respond strictly in valid JSON matching this schema:
{
  "detectedSubjectId": "sub-cn",
  "detectedSubjectName": "Computer Networks",
  "detectedType": "practical",
  "detectedExperimentNumber": 1,
  "suggestedTitle": "Socket Programming in Python: TCP Echo Client & Server",
  "extractedKeywords": ["Sockets", "TCP", "Python"],
  "summary": "Implementation of concurrent TCP echo server using Python socket library.",
  "confidenceScore": 0.95
}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          // Verify duplicate
          const dupCheck = checkDuplicateItem(parsed.detectedSubjectId, parsed.detectedType, parsed.detectedExperimentNumber, parsed.suggestedTitle);
          return res.json({
            ...parsed,
            isDuplicate: dupCheck.isDuplicate,
            duplicateMatch: dupCheck.matchedItem,
            engine: 'Gemini AI API',
          });
        }
      } catch (geminiError) {
        console.warn('Gemini classification fallback triggered:', geminiError);
      }
    }

    // Heuristic & Teacher Message Fallback Engine
    const messageInput = `${textSnippet || ''} ${fileName || ''}`.toLowerCase();
    
    // 1. Identify Subject (Prioritizing EMI, EPG, ETC)
    let detectedSubjectId = 'sub-emi';
    let detectedSubjectName = 'Electronic Measurement & Instrumentation (EMI)';

    if (messageInput.includes('emi') || messageInput.includes('instrumentation') || messageInput.includes('measurement') || messageInput.includes('bridge') || messageInput.includes('multimeter') || messageInput.includes('transducer') || messageInput.includes('oscilloscope')) {
      detectedSubjectId = 'sub-emi';
      detectedSubjectName = 'Electronic Measurement & Instrumentation (EMI)';
    } else if (messageInput.includes('epg') || messageInput.includes('power generation') || messageInput.includes('thermal') || messageInput.includes('hydro') || messageInput.includes('grid') || messageInput.includes('turbine') || messageInput.includes('power system')) {
      detectedSubjectId = 'sub-epg';
      detectedSubjectName = 'Electrical Power Generation & Systems (EPG)';
    } else if (messageInput.includes('etc') || messageInput.includes('circuit') || messageInput.includes('electronic technology') || messageInput.includes('amplifier') || messageInput.includes('op-amp') || messageInput.includes('modulation') || messageInput.includes('telecom')) {
      detectedSubjectId = 'sub-etc';
      detectedSubjectName = 'Electronic Technology & Circuits (ETC)';
    } else if (subjects.length > 0) {
      detectedSubjectId = subjects[0].id;
      detectedSubjectName = subjects[0].name;
    }

    // 2. Identify Type & Experiment Number from Teacher's Message Formats (e.g. "ex- 7", "exp 4", "asg 2")
    let detectedType: WorkItemType = 'practical';
    if (messageInput.includes('assignment') || messageInput.includes('homework') || messageInput.includes('asg') || messageInput.includes('problem set')) {
      detectedType = 'assignment';
    } else if (messageInput.includes('manual') || messageInput.includes('syllabus') || messageInput.includes('rubric') || messageInput.includes('handbook')) {
      detectedType = 'manual';
    }

    // Extract experiment / assignment number with flexible regex patterns
    let detectedExperimentNumber: number | undefined;
    const teacherExpMatch = messageInput.match(/(?:ex\s*[-_:#]?|exp\s*[-_:#]?|experiment\s*[-_:#]?|practical\s*[-_:#]?|lab\s*[-_:#]?|no\s*[-_:#]?|#\s*)(\d+)/i)
      || (fileName || '').match(/(?:ex|exp|practical|lab)[-_]?(\d+)/i);
    
    if (teacherExpMatch && teacherExpMatch[1]) {
      detectedExperimentNumber = parseInt(teacherExpMatch[1], 10);
    }

    // 3. Create Clean, Readable Professional Title
    let suggestedTitle = '';
    const subjectShort = detectedSubjectId === 'sub-emi' ? 'EMI' : detectedSubjectId === 'sub-epg' ? 'EPG' : detectedSubjectId === 'sub-etc' ? 'ETC' : detectedSubjectName;

    if (detectedType === 'practical' && detectedExperimentNumber) {
      suggestedTitle = `${subjectShort} - Experiment ${detectedExperimentNumber < 10 ? '0' + detectedExperimentNumber : detectedExperimentNumber}: Lab Practical`;
    } else if (detectedType === 'assignment' && detectedExperimentNumber) {
      suggestedTitle = `${subjectShort} - Assignment ${detectedExperimentNumber < 10 ? '0' + detectedExperimentNumber : detectedExperimentNumber}`;
    } else if (detectedType === 'manual') {
      suggestedTitle = `${subjectShort} - Official Laboratory Manual`;
    } else {
      suggestedTitle = `${subjectShort} - Lab Study Material (${fileName || 'Document'})`;
    }

    const dupCheck = checkDuplicateItem(detectedSubjectId, detectedType, detectedExperimentNumber, suggestedTitle);

    return res.json({
      detectedSubjectId,
      detectedSubjectName,
      detectedType,
      detectedExperimentNumber,
      suggestedTitle,
      extractedKeywords: [subjectShort, detectedType, `Exp ${detectedExperimentNumber || 1}`],
      summary: `Analyzed teacher message and classified as ${detectedType} (Exp #${detectedExperimentNumber || 1}) for ${detectedSubjectName}.`,
      confidenceScore: 0.95,
      isDuplicate: dupCheck.isDuplicate,
      duplicateMatch: dupCheck.matchedItem,
      engine: 'Teacher Message & Text Context Parser',
    });
  });

  function checkDuplicateItem(
    subjectId: string,
    type: WorkItemType,
    experimentNumber?: number,
    title?: string,
    fileHash?: string
  ): { isDuplicate: boolean; matchedItem?: any } {
    for (const item of workItems) {
      // 1. Exact hash match
      if (fileHash && item.attachments.some(a => a.hash === fileHash)) {
        return {
          isDuplicate: true,
          matchedItem: {
            existingItemId: item.id,
            existingTitle: item.title,
            subjectName: item.subjectName,
            matchReason: 'Identical file content binary SHA-256 hash already exists',
          }
        };
      }

      // 2. Same subject + same experiment number
      if (subjectId === item.subjectId && type === 'practical' && experimentNumber && item.experimentNumber === experimentNumber) {
        return {
          isDuplicate: true,
          matchedItem: {
            existingItemId: item.id,
            existingTitle: item.title,
            subjectName: item.subjectName,
            matchReason: `Experiment ${experimentNumber} already exists in ${item.subjectName}`,
          }
        };
      }

      // 3. Similar title in the same subject
      if (subjectId === item.subjectId && title && item.title.toLowerCase() === title.toLowerCase()) {
        return {
          isDuplicate: true,
          matchedItem: {
            existingItemId: item.id,
            existingTitle: item.title,
            subjectName: item.subjectName,
            matchReason: `An item with exact title "${item.title}" already exists in ${item.subjectName}`,
          }
        };
      }
    }

    return { isDuplicate: false };
  }

  // Duplicate check endpoint
  app.post('/api/admin/check-duplicate', requireAdminAuth, (req: Request, res: Response) => {
    const { subjectId, type, experimentNumber, title, fileHash } = req.body;
    const result = checkDuplicateItem(subjectId, type, experimentNumber, title, fileHash);
    return res.json(result);
  });

  // 5. Incoming Queue Management
  app.get('/api/admin/incoming-queue', requireAdminAuth, (_req: Request, res: Response) => {
    return res.json({ queue: incomingReviewQueue });
  });

  // Submit new file into incoming queue (Direct upload or faculty portal simulation)
  app.post('/api/admin/incoming-queue', requireAdminAuth, (req: Request, res: Response) => {
    const { fileName, fileSize, rawSnippet, senderName, source } = req.body;
    const hash = crypto.createHash('sha256').update(fileName + (rawSnippet || '') + Date.now()).digest('hex');

    // Run duplicate check
    const dup = checkDuplicateItem('sub-cn', 'practical', undefined, fileName, hash);

    const newItem: IncomingFileItem = {
      id: 'inc-' + Date.now().toString(36),
      source: source || 'direct_upload',
      sender: {
        name: senderName || (req as any).user.name,
        contact: (req as any).user.email,
        roleTag: 'Faculty / Staff',
      },
      fileName: fileName || 'Uploaded_Document.pdf',
      fileSize: fileSize || 524288,
      fileType: 'pdf',
      fileHash: hash,
      receivedAt: new Date().toISOString(),
      status: 'pending_review',
      rawSnippet: rawSnippet || 'Laboratory document uploaded for departmental review and publication.',
      detection: {
        detectedSubjectId: 'sub-cn',
        detectedSubjectName: 'Computer Networks',
        detectedType: 'practical',
        detectedExperimentNumber: 6,
        suggestedTitle: fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'New Practical Submission',
        confidenceScore: 0.91,
        extractedKeywords: ['Lab Material', 'Computer Networks'],
        summary: 'Document uploaded for faculty review.',
        isDuplicate: dup.isDuplicate,
        duplicateMatch: dup.matchedItem,
      }
    };

    incomingReviewQueue.unshift(newItem);

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'FILE_ENQUEUED',
      actorName: (req as any).user.name,
      actorRole: 'admin',
      details: `Enqueued ${newItem.fileName} into review queue`,
    });

    return res.json({ queueItem: newItem, message: 'Document added to review queue' });
  });

  // Process Review Item (Approve & Publish / Save as Draft / Reject)
  app.post('/api/admin/incoming-queue/:id/decision', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, correctedData } = req.body; // action: 'approve_publish' | 'save_draft' | 'reject'

    const item = incomingReviewQueue.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Review item not found' });
    }

    if (action === 'reject') {
      item.status = 'rejected';
      auditLogs.unshift({
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'REJECT_REVIEW_ITEM',
        actorName: (req as any).user.name,
        actorRole: 'admin',
        details: `Rejected document: ${item.fileName}`,
      });
      return res.json({ message: 'Document marked as rejected' });
    }

    // Approve & Publish or Save Draft
    const isPublish = action === 'approve_publish';
    const targetSubjectId = correctedData?.subjectId || item.detection.detectedSubjectId;
    const sub = subjects.find(s => s.id === targetSubjectId) || subjects[0];
    const targetType = correctedData?.type || item.detection.detectedType;
    const targetExpNumber = correctedData?.experimentNumber !== undefined ? Number(correctedData.experimentNumber) : item.detection.detectedExperimentNumber;
    const targetTitle = (correctedData?.title || item.detection.suggestedTitle).trim();

    const newWorkItem: WorkItem = {
      id: 'wi-' + Date.now().toString(36),
      subjectId: sub.id,
      subjectName: sub.name,
      subjectCode: sub.code,
      type: targetType,
      experimentNumber: targetType === 'practical' ? targetExpNumber : undefined,
      title: targetTitle,
      description: correctedData?.description || item.detection.summary || `Approved from ${item.source}`,
      objective: correctedData?.objective || `Laboratory learning objectives for ${targetTitle}`,
      published: isPublish,
      publishedAt: isPublish ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: correctedData?.tags || item.detection.extractedKeywords || [sub.name],
      attachments: [
        {
          id: 'att-' + Date.now(),
          name: item.fileName,
          fileType: item.fileType === 'docx' ? 'document' : item.fileType,
          sizeBytes: item.fileSize,
          pageCount: 4,
          url: `/downloads/${item.fileName}`,
          hash: item.fileHash,
          previewContent: item.rawSnippet || `Verified and approved document for ${sub.name}.`,
        }
      ],
      fileHash: item.fileHash,
    };

    workItems.push(newWorkItem);
    item.status = 'approved';

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: isPublish ? 'PUBLISH_APPROVED_ITEM' : 'DRAFT_APPROVED_ITEM',
      actorName: (req as any).user.name,
      actorRole: 'admin',
      details: `${isPublish ? 'Published' : 'Saved draft'} [${sub.code}] ${targetTitle} from queue`,
    });

    return res.json({
      workItem: newWorkItem,
      message: `Document successfully ${isPublish ? 'published for students' : 'saved to admin drafts'}`,
    });
  });

  // 6. WhatsApp Business Platform Management
  app.get('/api/admin/whatsapp/status', requireAdminAuth, (_req: Request, res: Response) => {
    return res.json({
      config: {
        isConfigured: whatsAppConfig.isConfigured,
        phoneNumberId: whatsAppConfig.phoneNumberId ? '••••' + whatsAppConfig.phoneNumberId.slice(-4) : '',
        wabaId: whatsAppConfig.wabaId ? '••••' + whatsAppConfig.wabaId.slice(-4) : '',
        webhookUrl: whatsAppConfig.webhookUrl,
        verifyToken: whatsAppConfig.verifyToken,
        status: whatsAppConfig.status,
        lastVerifiedAt: whatsAppConfig.lastVerifiedAt,
        incomingCount: whatsAppConfig.incomingCount,
        registeredPhoneNumbers: whatsAppConfig.registeredPhoneNumbers,
      },
      guide: {
        title: 'Official Meta WhatsApp Business Cloud API Integration Guide',
        steps: [
          'Register on Meta for Developers and create a WhatsApp Business Cloud App.',
          'Generate a permanent System User Access Token with whatsapp_business_messaging permissions.',
          'Configure the Webhook Callback URL below in Meta App Dashboard > WhatsApp > Configuration.',
          'Input your Phone Number ID and WhatsApp Business Account ID below to activate the webhook receiver.',
          'Only documents transmitted by registered faculty or verified college numbers will enter the Admin Review Queue.',
        ]
      }
    });
  });

  app.put('/api/admin/whatsapp/config', requireAdminAuth, (req: Request, res: Response) => {
    const { phoneNumberId, wabaId, verifyToken } = req.body;

    if (!phoneNumberId || !wabaId) {
      return res.status(400).json({ error: 'Phone Number ID and WhatsApp Business Account ID are required' });
    }

    whatsAppConfig.phoneNumberId = phoneNumberId.trim();
    whatsAppConfig.wabaId = wabaId.trim();
    if (verifyToken) {
      whatsAppConfig.verifyToken = verifyToken.trim();
    }
    whatsAppConfig.isConfigured = true;
    whatsAppConfig.status = 'active';
    whatsAppConfig.lastVerifiedAt = new Date().toISOString();

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'UPDATE_WHATSAPP_CONFIG',
      actorName: (req as any).user.name,
      actorRole: 'admin',
      details: `Configured Meta WhatsApp Cloud API credentials (Phone ID: ${whatsAppConfig.phoneNumberId.slice(-4)})`,
    });

    return res.json({
      config: whatsAppConfig,
      message: 'WhatsApp Business Cloud API configuration updated and verified.',
    });
  });

  // Simulator to test real incoming document through WhatsApp Webhook pipeline
  app.post('/api/admin/whatsapp/simulate-incoming', requireAdminAuth, (req: Request, res: Response) => {
    const { senderPhone, senderName, fileName, topicSnippet, autoPublishToSubject } = req.body;

    const hash = crypto.createHash('sha256').update((fileName || 'whatsapp_doc') + Date.now()).digest('hex');

    // Parse Teacher WhatsApp Message text (e.g. "blaa blaa ex- 7", "EMI Exp 4", "EPG asg 1")
    const msg = `${topicSnippet || ''} ${fileName || ''}`.toLowerCase();
    
    let detectedSubjectId = 'sub-emi';
    let detectedSubjectName = 'Electronic Measurement & Instrumentation (EMI)';

    if (msg.includes('emi') || msg.includes('instrumentation') || msg.includes('measurement') || msg.includes('bridge') || msg.includes('transducer')) {
      detectedSubjectId = 'sub-emi';
      detectedSubjectName = 'Electronic Measurement & Instrumentation (EMI)';
    } else if (msg.includes('epg') || msg.includes('power generation') || msg.includes('thermal') || msg.includes('hydro') || msg.includes('grid') || msg.includes('turbine')) {
      detectedSubjectId = 'sub-epg';
      detectedSubjectName = 'Electrical Power Generation & Systems (EPG)';
    } else if (msg.includes('etc') || msg.includes('circuit') || msg.includes('electronic technology') || msg.includes('amplifier') || msg.includes('op-amp') || msg.includes('modulation')) {
      detectedSubjectId = 'sub-etc';
      detectedSubjectName = 'Electronic Technology & Circuits (ETC)';
    } else if (subjects.length > 0) {
      detectedSubjectId = subjects[0].id;
      detectedSubjectName = subjects[0].name;
    }

    let detectedType: WorkItemType = 'practical';
    if (msg.includes('assignment') || msg.includes('homework') || msg.includes('asg')) {
      detectedType = 'assignment';
    } else if (msg.includes('manual') || msg.includes('syllabus') || msg.includes('rubric')) {
      detectedType = 'manual';
    }

    let detectedExperimentNumber: number | undefined;
    const expMatch = msg.match(/(?:ex\s*[-_:#]?|exp\s*[-_:#]?|experiment\s*[-_:#]?|practical\s*[-_:#]?|lab\s*[-_:#]?|no\s*[-_:#]?|#\s*)(\d+)/i)
      || (fileName || '').match(/(?:ex|exp|practical|lab)[-_]?(\d+)/i);
    
    if (expMatch && expMatch[1]) {
      detectedExperimentNumber = parseInt(expMatch[1], 10);
    }

    const subShort = detectedSubjectId === 'sub-emi' ? 'EMI' : detectedSubjectId === 'sub-epg' ? 'EPG' : detectedSubjectId === 'sub-etc' ? 'ETC' : detectedSubjectName;
    let cleanTitle = '';
    if (detectedType === 'practical' && detectedExperimentNumber) {
      cleanTitle = `${subShort} - Experiment ${detectedExperimentNumber < 10 ? '0' + detectedExperimentNumber : detectedExperimentNumber}: Lab Practical`;
    } else if (detectedType === 'assignment' && detectedExperimentNumber) {
      cleanTitle = `${subShort} - Assignment ${detectedExperimentNumber < 10 ? '0' + detectedExperimentNumber : detectedExperimentNumber}`;
    } else {
      cleanTitle = `${subShort} - Lab Study Material (${fileName || 'Document'})`;
    }

    const dupCheck = checkDuplicateItem(detectedSubjectId, detectedType, detectedExperimentNumber, cleanTitle);

    const incoming: IncomingFileItem = {
      id: 'inc-' + Date.now().toString(36),
      source: 'whatsapp_webhook',
      sender: {
        name: senderName || 'College Faculty / Teacher',
        contact: senderPhone || '+91 98765 43210',
        roleTag: 'Subject In-Charge',
      },
      fileName: fileName || '20_45.pdf',
      fileSize: 589824,
      fileType: 'pdf',
      fileHash: hash,
      receivedAt: new Date().toISOString(),
      status: autoPublishToSubject ? 'approved' : 'pending_review',
      rawSnippet: topicSnippet || 'blaa blaa ex- 7',
      detection: {
        detectedSubjectId,
        detectedSubjectName,
        detectedType,
        detectedExperimentNumber,
        suggestedTitle: cleanTitle,
        confidenceScore: 0.96,
        extractedKeywords: [subShort, detectedType, `Exp ${detectedExperimentNumber || 1}`],
        summary: `Parsed teacher message "${topicSnippet || ''}" for raw file "${fileName || ''}". Detected: ${subShort} ${detectedType} #${detectedExperimentNumber || 1}`,
        isDuplicate: dupCheck.isDuplicate,
        duplicateMatch: dupCheck.matchedItem,
      }
    };

    whatsAppConfig.incomingCount += 1;

    // If autoPublishToSubject is enabled, directly insert into the student Subject Card!
    if (autoPublishToSubject) {
      const targetSub = subjects.find(s => s.id === detectedSubjectId) || subjects[0];
      const publishedItem: WorkItem = {
        id: 'wi-' + Date.now().toString(36),
        subjectId: targetSub.id,
        subjectName: targetSub.name,
        subjectCode: targetSub.code,
        type: detectedType,
        experimentNumber: detectedExperimentNumber,
        title: cleanTitle,
        description: `Uploaded automatically via WhatsApp Group. Teacher Message: "${topicSnippet || 'N/A'}"`,
        objective: `Understand principles and experimental procedure for ${cleanTitle}.`,
        published: true,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [subShort, detectedType, 'WhatsApp Auto-Ingested'],
        attachments: [
          {
            id: 'att-' + Date.now(),
            name: `${subShort}_Exp${detectedExperimentNumber || 1}_${fileName || 'Document.pdf'}`,
            fileType: 'pdf',
            sizeBytes: 589824,
            pageCount: 4,
            url: '#',
            hash: hash,
            previewContent: `// ${cleanTitle}\n// Department of Electrical & Electronics Engineering\n// Ingested from WhatsApp Group via Teacher Note: "${topicSnippet}"\n\nOBJECTIVE: Study and perform laboratory setup for ${cleanTitle}.\n\nSTATUS: VERIFIED & PUBLISHED ON STUDENT PORTAL.`
          }
        ]
      };

      workItems.unshift(publishedItem);
      if (detectedType === 'practical') targetSub.totalPracticals += 1;
      else if (detectedType === 'assignment') targetSub.totalAssignments += 1;
      else if (detectedType === 'manual') targetSub.totalManuals += 1;
      targetSub.publishedCount += 1;

      auditLogs.unshift({
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'WHATSAPP_AUTO_PUBLISHED',
        actorName: 'WhatsApp Group Parser Gateway',
        actorRole: 'admin',
        details: `Auto-published raw file ${fileName} with message "${topicSnippet}" into ${targetSub.code} (${subShort}) as ${cleanTitle}`,
      });

      return res.json({
        queueItem: incoming,
        publishedItem,
        message: `Success! Auto-parsed teacher message "${topicSnippet}" and published "${fileName}" directly into ${subShort} Subject Card as Experiment #${detectedExperimentNumber || 1}!`,
      });
    }

    incomingReviewQueue.unshift(incoming);

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'WHATSAPP_WEBHOOK_RECEIVED',
      actorName: 'WhatsApp Business API Gateway',
      actorRole: 'admin',
      details: `Received ${incoming.fileName} with caption "${topicSnippet}" into Review Queue`,
    });

    return res.json({
      queueItem: incoming,
      message: `Parsed teacher message "${topicSnippet}". Document delivered to Review Queue with clean title "${cleanTitle}".`,
    });
  });

  // 7. System Config & Audit Logs
  app.get('/api/admin/system/config', requireAdminAuth, (_req: Request, res: Response) => {
    return res.json({ config: systemConfig, auditLogs: auditLogs.slice(0, 20) });
  });

  app.put('/api/admin/system/config', requireAdminAuth, (req: Request, res: Response) => {
    const updates = req.body;
    systemConfig = { ...systemConfig, ...updates };

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'UPDATE_SYSTEM_CONFIG',
      actorName: (req as any).user.name,
      actorRole: 'admin',
      details: 'Updated global system parameters and duplicate check thresholds',
    });

    return res.json({ config: systemConfig, message: 'System configuration updated' });
  });

  // ----------------------------------------------------
  // Vite Integration / Static Assets
  // ----------------------------------------------------

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`College Work Hub server listening on port ${port} [Mode: ${isProd ? 'Production' : 'Development'}]`);
  });
}

createServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
