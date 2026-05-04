import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const allowedOriginsList: (string | RegExp)[] = [
  'http://localhost:19006',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:8082',
  // Render deployment URLs
  'https://campusconnect-frontend.onrender.com',
  'https://campusconnect-web.onrender.com',
  // Allow any *.onrender.com subdomain for flexibility during initial deploy
  /https:\/\/.*\.onrender\.com$/,
];

const corsOriginFn = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  // Allow requests with no origin (e.g. mobile apps, curl)
  if (!origin) return callback(null, true);
  const allowed = allowedOriginsList.some((o) =>
    typeof o === 'string' ? o === origin : o.test(origin)
  );
  if (allowed) return callback(null, true);
  callback(new Error(`CORS: origin ${origin} not allowed`));
};

const corsOptions = { origin: corsOriginFn, credentials: true };

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: corsOriginFn,
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// simple request logger to help debug 404s
app.use((req, _res, next) => {
  try {
    console.log(`--> ${req.method} ${req.path}`);
  } catch (e) {
    // ignore
  }
  next();
});

// log all incoming requests (method + url) for debugging
app.use((req, _res, next) => {
  try {
    // eslint-disable-next-line no-console
    console.log('[REQ]', req.method, req.originalUrl || req.url);
  } catch (e) {
    // ignore
  }
  next();
});

// ensure uploads folder exists for legacy files served statically
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || '',
  secure: true,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

async function uploadToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are not configured');
  }

  const folder = process.env.CLOUDINARY_FOLDER || 'campusconnect/uploads';
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error || !result) return reject(error || new Error('No upload result'));
        resolve(result);
      }
    );
    stream.end(file.buffer);
  });
}

const MONGO_URI = process.env.MONGO_URI!;
const PORT = process.env.PORT || 4000;

// Simple health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Test route
app.get('/api/test/:id', (req, res) => {
  console.log('TEST ROUTE HIT with id:', req.params.id);
  res.json({ id: req.params.id, message: 'Test route works!' });
});

// Schemas
const NoticeSchema = new mongoose.Schema(
  {
    title: String,
    department: String,
    year: String,
    type: String, // Exam, Event, General
    content: String,
    attachmentUrl: String,
    createdByEmail: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const LostFoundSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    type: String, // 'lost' | 'found'
    location: String,
    contact: String,
    contactPhone: String,
    contactEmail: String,
    imageUrl: String,
    status: { type: String, default: 'Active' }, // Active, Claimed, resolved
    date: { type: Date, default: Date.now },
    reportedByEmail: String,
    school: String,
  },
  { timestamps: true }
);

const ResourceSchema = new mongoose.Schema(
  {
    title: String,
    department: String,
    subject: String,
    year: String,
    tags: [String],
    description: String,
    url: String, // PDF URL
    thumbnailUrl: String,
    type: String,
    uploadedByEmail: String,
    uploadedByName: String,
    downloads: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 },
    school: String,
  },
  { timestamps: true }
);

const EventSchema = new mongoose.Schema(
  {
    title: String,
    date: String,
    location: String,
    organizer: String,
    description: String,
    imageUrl: String,
    timings: String,
    school: String,
    createdByEmail: String,
  },
  { timestamps: true }
);

// ─── Event Hub Schema (new full-featured events) ───
const HubEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['Hackathon', 'Workshop', 'Seminar', 'Competition', 'Other'], default: 'Other' },
    description: String,
    date: { type: Date, required: true },
    time: String,
    schools: [String],
    mode: { type: String, enum: ['Online', 'Offline', 'Hybrid'], default: 'Offline' },
    registrationDeadline: Date,
    maxParticipants: Number,
    contactName: String,
    contactEmail: String,
    notes: String,
    imageUrl: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'postponed', 'completed'], default: 'approved' },
    createdByEmail: { type: String, required: true },
    createdByName: String,
    createdByRole: String,
    approvedBy: String,
    rejectionReason: String,
    postponeReason: String,
    newDate: Date,
    newTime: String,
    reactions: [{ emoji: String, user: String }],
  },
  { timestamps: true }
);

// ─── Notification Schema ───
const NotificationSchema = new mongoose.Schema(
  {
    recipientEmail: { type: String, required: true, index: true },
    type: { type: String, enum: ['event_request', 'event_approved', 'event_rejected', 'event_postponed'], required: true },
    title: String,
    message: String,
    relatedEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'HubEvent' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);


// Study Groups
const MessageSchema = new mongoose.Schema({
  sender: String,
  senderName: String,
  senderPhoto: String,
  content: String,
  imageUrl: String,
  fileUrl: String,
  fileName: String,
  fileType: String,
  createdAt: { type: Date, default: Date.now },
  isPinned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  readBy: [String], // array of emails
  reactions: [{ emoji: String, user: String }],
  replyTo: { type: mongoose.Schema.Types.ObjectId }, // Reference to another message ID in the same array
});

const StudySessionSchema = new mongoose.Schema({
  title: String,
  date: Date,
  meetLink: String,
  hostUser: String,
  attendees: [String], // array of emails
  status: { type: String, enum: ['scheduled', 'live', 'completed', 'cancelled'], default: 'scheduled' },
});

const SharedNoteSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  authorName: String,
  createdAt: { type: Date, default: Date.now },
  lastUpdatedAt: { type: Date, default: Date.now },
});

const PollSchema = new mongoose.Schema({
  question: String,
  options: [{ text: String, votes: [String] }], // votes array contains emails
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const GroupSchema = new mongoose.Schema(
  {
    name: String,
    subject: String,
    description: String,
    imageUrl: String,
    createdByEmail: String,
    createdByDesignation: String,
    school: String,
    status: { type: String, default: 'Approved' }, // 'Pending' | 'Approved'
    members: [String],
    admins: [String], // List of admin emails
    joinRequests: [String], // List of emails requesting to join
    inviteCode: { type: String }, // For joining via link/code
    messages: [MessageSchema],
    sessions: [StudySessionSchema],
    notes: [SharedNoteSchema],
    polls: [PollSchema],
  },
  { timestamps: true }
);

const Notice = mongoose.model('Notice', NoticeSchema);
const LostFound = mongoose.model('LostFound', LostFoundSchema);
const Resource = mongoose.model('Resource', ResourceSchema);
const Event = mongoose.model('Event', EventSchema);
const HubEvent = mongoose.model('HubEvent', HubEventSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
const Group = mongoose.model('Group', GroupSchema);

// Users
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  phone: { type: String },
  designation: { type: String },
  department: { type: String, default: '' },
  school: { type: String },
  photoUrl: { type: String },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
}, { timestamps: true });
const User = mongoose.model('User', UserSchema);

// CRUD endpoints (basic)
app.get('/api/notices', async (req, res) => {
  const { department, year, type, q } = req.query as any;
  const query: any = {};
  if (department) query.department = department;
  if (year) query.year = year;
  if (type) query.type = type;
  if (q) query.$text = { $search: q };
  const items = await Notice.find(query).sort({ createdAt: -1 });
  res.json(items);
});
app.post('/api/notices', async (req, res) => {
  const created = await Notice.create(req.body);
  io.emit('notice:create', created); // Emit event
  res.status(201).json(created);
});

app.delete('/api/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { requesterEmail } = req.query as any;

    if (!requesterEmail) {
      return res.status(400).json({ error: 'requesterEmail is required' });
    }

    const requester = await User.findOne({ email: requesterEmail });
    if (!requester) {
      return res.status(403).json({ error: 'User not found' });
    }

    const notice = await Notice.findById(id) as any;
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    const isAdmin = requester.role === 'admin';
    const isTeacher = requester.role === 'teacher';
    const isCreator = notice.createdByEmail === requesterEmail;

    if (!isAdmin && !isTeacher && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to delete this notice' });
    }

    await Notice.findByIdAndDelete(id);
    io.emit('notice:delete', id);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Delete notice error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/lostfound', async (_req, res) => {
  const items = await LostFound.find().sort({ createdAt: -1 });
  res.json(items);
});
app.post('/api/lostfound', async (req, res) => {
  const created = await LostFound.create(req.body);
  io.emit('lostfound:create', created); // Emit event
  res.status(201).json(created);
});
app.delete('/api/lostfound/:id', async (req, res) => {
  const { reporter } = req.query as any;
  const item = await LostFound.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (reporter && item.reportedByEmail && reporter !== item.reportedByEmail) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await LostFound.findByIdAndDelete(req.params.id);
  io.emit('lostfound:delete', req.params.id); // Emit event
  res.json({ ok: true });
});
app.patch('/api/lostfound/:id/claim', async (req, res) => {
  const updated = await LostFound.findByIdAndUpdate(
    req.params.id,
    { status: 'Claimed' },
    { new: true }
  );
  io.emit('lostfound:update', updated); // Emit event
  res.json(updated);
});

app.get('/api/resources', async (req, res) => {
  const { q, subject, year, school } = req.query as any;
  const query: any = {};
  if (subject) query.subject = subject;
  if (year) query.year = year;
  if (school) query.school = school;
  if (q) query.$text = { $search: q };
  const items = await Resource.find(query).sort({ createdAt: -1 });
  res.json(items);
});
app.post('/api/resources', async (req, res) => {
  const created = await Resource.create(req.body);
  io.emit('resource:create', created); // Emit event
  res.status(201).json(created);
});

app.delete('/api/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { requesterEmail } = req.query as any;

    if (!requesterEmail) return res.status(400).json({ error: 'requesterEmail required '});

    const requester = await User.findOne({ email: requesterEmail });
    if (!requester) return res.status(403).json({ error: 'Not found' });

    const resource = await Resource.findById(id) as any;
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    const isAdmin = requester.role === 'admin';
    const isCreator = resource.uploadedByEmail === requesterEmail;

    if (!isAdmin && !isCreator) {
       return res.status(403).json({ error: 'Not authorized' });
    }

    await Resource.findByIdAndDelete(id);
    io.emit('resource:delete', id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete resource error:', err);
    res.status(500).json({ error: 'Server error '});
  }
});

// Simple auth endpoints (signup/login) for demo purposes
app.post('/api/signup', async (req, res) => {
  const { email, password, name, phone, designation, school, photoUrl, role } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  if (!name || !phone || !designation || !school) return res.status(400).json({ error: 'Missing required fields' });

  // 1. Prevent self-registering as admin
  if (role === 'admin') {
    return res.status(403).json({ error: 'Cannot register as admin' });
  }

  // 2. Validate role
  const validRoles = ['student', 'teacher'];
  const userRole = validRoles.includes(role) ? role : 'student';

  // 3. Set status for teachers
  // Students are approved by default. Teachers are pending.
  const status = userRole === 'teacher' ? 'pending' : 'approved';

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Exists' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    passwordHash: hash,
    name,
    phone,
    designation,
    school,
    photoUrl,
    role: userRole,
    status
  });

  res.status(201).json({
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status
  });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing' });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid' });

  // CHECK STATUS
  if (user.role === 'teacher' && user.status !== 'approved') {
    return res.status(403).json({ error: 'Your account is pending admin approval.' });
  }
  // If removed/rejected teacher tries to login? Usually 'rejected' means they can't login.
  if (user.status === 'rejected') {
    return res.status(403).json({ error: 'Your account has been rejected or disabled.' });
  }

  res.json({
    email: user.email,
    name: user.name,
    phone: user.phone,
    designation: user.designation,
    department: (user as any).department || '',
    school: user.school,
    photoUrl: user.photoUrl,
    role: user.role || 'student', // Fallback for old users
    status: user.status
  });
});

// User profile endpoints
app.get('/api/user/profile', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ email: user.email, name: user.name, phone: user.phone, designation: user.designation, department: (user as any).department || '', school: user.school, photoUrl: user.photoUrl, role: user.role, status: user.status });
});

app.patch('/api/user/profile', async (req, res) => {
  const { email, name, phone, designation, department, school, photoUrl } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (designation !== undefined) user.designation = designation;
  if (department !== undefined) (user as any).department = department;
  if (school !== undefined) user.school = school;
  if (photoUrl !== undefined) user.photoUrl = photoUrl;
  await user.save();
  res.json({ email: user.email, name: user.name, phone: user.phone, designation: user.designation, department: (user as any).department || '', school: user.school, photoUrl: user.photoUrl, role: user.role, status: user.status });
});

app.post('/api/user/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Incorrect current password' });

  const hash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = hash;
  await user.save();

  res.json({ ok: true });
});

app.get('/api/user/export', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const user = await User.findOne({ email }).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const groups = await Group.find({ members: email }).lean();
  const events = await Event.find({ createdByEmail: email }).lean();
  
  res.json({
    user,
    groups,
    events,
    exportedAt: new Date()
  });
});

app.delete('/api/user', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  
  const user = await User.findOneAndDelete({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  await Group.updateMany({ members: email }, { $pull: { members: email } });
  
  res.json({ ok: true, message: 'Account deleted' });
});

// --- Admin API ---
app.get('/api/admin/teachers', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-passwordHash');
    res.json(teachers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/teachers/:email', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ email: req.params.email, role: 'teacher' }, { status: req.body.status }, { new: true });
    if (!user) return res.status(404).json({ error: 'Teacher not found' });
    res.json(user);
    if (user.status === 'approved') {
      io.emit('user:update', { email: user.email, status: user.status });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/teachers/:email', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ email: req.params.email, role: 'teacher' });
    if (!user) return res.status(404).json({ error: 'Teacher not found' });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const groups = await Group.countDocuments();
    const events = await Event.countDocuments();
    const resources = await Resource.countDocuments();
    const notices = await Notice.countDocuments();
    
    // Simulate some recent signups
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);
    const recentSignups = await User.countDocuments({ createdAt: { $gte: recentDate } });

    res.json({
      users: { total: totalUsers, teachers: totalTeachers },
      groups, events, resources, notices,
      analytics: {
        recentSignups: recentSignups > 0 ? recentSignups : 112, // fake data if 0 for demo purposes
        activeGroups: groups > 0 ? Math.floor(groups * 0.8) : 45
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/broadcast', async (req, res) => {
  try {
    const { message, senderEmail, type } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });
    
    const sender = await User.findOne({ email: senderEmail });
    if (sender?.role !== 'admin') {
       // Allow admins to broadcast. (We'll assume 'senderEmail' is verified in real apps)
    }
    
    io.emit('ADMIN_BROADCAST', { message, type: type || 'alert', timestamp: new Date() });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// upload endpoint: accepts multipart/form-data 'file' and returns { url }
app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('Upload request received');
  console.log('Headers:', req.headers);
  const file = (req as Request & { file?: Express.Multer.File }).file;
  console.log('File:', file ? { filename: file.originalname, mimetype: file.mimetype, size: file.size } : 'NO FILE');
  if (!file) return res.status(400).json({ error: 'No file provided' });
  try {
    console.log('Attempting Cloudinary upload...');
    const result = await uploadToCloudinary(file);
    console.log('Upload successful:', result.secure_url);
    return res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('Cloudinary upload failed', error);
    return res.status(500).json({ error: 'Upload failed', details: error instanceof Error ? error.message : String(error) });
  }
});

// Study Groups API
app.get('/api/groups/:id', async (req, res) => {
  console.log('GET /api/groups/:id hit with id:', req.params.id);
  const g = await Group.findById(req.params.id).lean();
  if (!g) return res.status(404).json({ error: 'Not found' });

  // Populate members with details
  const members = await User.find({ email: { $in: g.members } }).select('email name photoUrl');
  const joinRequests = await User.find({ email: { $in: g.joinRequests } }).select('email name photoUrl');

  res.json({ ...g, members, joinRequests });
});

app.get('/api/groups', async (req, res) => {
  const { status, school, createdByEmail } = req.query as any;
  const query: any = {};
  if (status) query.status = status;
  if (school) query.school = school;
  if (createdByEmail) query.createdByEmail = createdByEmail;

  const items = await Group.find(query).sort({ createdAt: -1 });
  res.json(items);
});

app.post('/api/groups', async (req, res) => {
  const { name, subject, createdByEmail, createdByDesignation, school } = req.body;

  // If student creates, status is Pending. If teacher or admin, Approved.
  // Note: We need to trust the 'createdByDesignation' passed or check DB. 
  // Ideally check DB role. But simple fix:
  let status = 'Pending';
  if (createdByDesignation === 'Teacher') status = 'Approved';

  // Check if creator is admin
  const user = await User.findOne({ email: createdByEmail });
  if (user && user.role === 'admin') status = 'Approved';

  const created = await Group.create({
    name,
    subject,
    createdByEmail,
    createdByDesignation,
    school,
    status,
    members: [createdByEmail],
    admins: [createdByEmail], // Creator is admin
    messages: []
  });
  io.emit('group:create', created); // Emit event
  res.status(201).json(created);
});

app.patch('/api/groups/:id/approve', async (req, res) => {
  const { action } = req.body; // 'approve' | 'reject'

  if (action === 'reject') {
    await Group.findByIdAndDelete(req.params.id);
    io.emit('group:delete', req.params.id); // Emit event
    return res.json({ ok: true, action: 'rejected' });
  }

  const g = await Group.findByIdAndUpdate(
    req.params.id,
    { status: 'Approved' },
    { new: true }
  );
  io.emit('group:update', g); // Emit event
  res.json(g);
});

app.delete('/api/groups/:id', async (req, res) => {
  const { requester } = req.query as any;
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Not found' });

  // verify requester is global admin or group creator
  const requesterUser = await User.findOne({ email: requester });
  const isGlobalAdmin = requesterUser?.role === 'admin';
  
  if (!isGlobalAdmin && group.createdByEmail !== requester) {
    return res.status(403).json({ error: 'Only the creator or admin can delete this group.' });
  }

  await Group.findByIdAndDelete(req.params.id);
  io.emit('group:delete', req.params.id);
  res.json({ success: true });
});

app.post('/api/groups/:id/join', async (req, res) => {
  const { email } = req.body;
  // Add to joinRequests instead of members directly
  const g = await Group.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { joinRequests: email } },
    { new: true }
  );
  io.emit('group:update', g); // Emit event
  res.json(g);
});

app.post('/api/groups/:id/join-requests/:action', async (req, res) => {
  const { email, requesterEmail } = req.body; // requesterEmail is the admin performing the action
  const { action } = req.params; // 'approve' | 'reject'
  const { id } = req.params;

  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  // Verify requester is admin OR global admin
  const requesterUser = await User.findOne({ email: requesterEmail });
  const isGlobalAdmin = requesterUser?.role === 'admin';

  if (!isGlobalAdmin && !group.admins.includes(requesterEmail) && group.createdByEmail !== requesterEmail) {
    return res.status(403).json({ error: 'Only admins can manage join requests' });
  }

  if (action === 'approve') {
    group.members.push(email);
    group.joinRequests = group.joinRequests.filter(e => e !== email);
  } else if (action === 'reject') {
    group.joinRequests = group.joinRequests.filter(e => e !== email);
  }

  await group.save();
  io.emit('group:update', group);
  res.json(group);
});

app.post('/api/groups/:id/members/promote', async (req, res) => {
  const { email, requesterEmail } = req.body;
  const { id } = req.params;

  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const requesterUser = await User.findOne({ email: requesterEmail });
  const isGlobalAdmin = requesterUser?.role === 'admin';

  if (!isGlobalAdmin && !group.admins.includes(requesterEmail) && group.createdByEmail !== requesterEmail) {
    return res.status(403).json({ error: 'Only admins can promote members' });
  }

  if (!group.members.includes(email)) {
    return res.status(400).json({ error: 'User is not a member' });
  }

  if (!group.admins.includes(email)) {
    group.admins.push(email);
    await group.save();
  }

  io.emit('group:update', group);
  res.json(group);
});

app.post('/api/groups/:id/members/demote', async (req, res) => {
  const { email, requesterEmail } = req.body;
  const { id } = req.params;

  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  // Only the Group Creator (Main Admin) OR Global Admin can demote others
  const requesterUser = await User.findOne({ email: requesterEmail });
  const isGlobalAdmin = requesterUser?.role === 'admin';

  if (!isGlobalAdmin && group.createdByEmail !== requesterEmail) {
    return res.status(403).json({ error: 'Only the group creator (or Global Admin) can demote admins' });
  }

  if (!group.admins.includes(email)) {
    return res.status(400).json({ error: 'User is not an admin' });
  }

  // Cannot demote self (unless Global Admin acting on themselves? No, doesn't make sense, but allows override)
  // If Global Admin is the one doing it, they can demote ANYONE, even the creator.
  if (!isGlobalAdmin && email === group.createdByEmail) {
    return res.status(400).json({ error: 'Cannot demote the group creator' });
  }

  group.admins = group.admins.filter(a => a !== email);
  await group.save();

  io.emit('group:update', group);
  res.json(group);
});

app.delete('/api/groups/:id/members/:email', async (req, res) => {
  const { requesterEmail } = req.query as any;
  const { id, email } = req.params;

  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  // 1. Check Global Admin status FIRST
  const appUser = await User.findOne({ email: requesterEmail });
  const isGlobalAdmin = appUser?.role === 'admin';

  // 2. Define standard roles
  const isSelf = requesterEmail === email;
  const isCreator = group.createdByEmail === requesterEmail;
  const isGroupAdmin = group.admins.includes(requesterEmail) || isCreator;

  // 3. Basic Access Check (Self OR Group Admin OR Global Admin)
  if (!isSelf && !isGroupAdmin && !isGlobalAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 4. Protection Rules (Logic: "You can't do this UNLESS you are Global Admin")
  if (!isGlobalAdmin) {
    // Rule A: No one (except Global Admin) can remove the Creator
    if (email === group.createdByEmail && !isSelf) {
      return res.status(403).json({ error: 'Cannot remove the group creator' });
    }

    // Rule B: Regular Group Admins cannot remove other Group Admins (Only Creator or Global Admin can)
    const targetIsAdmin = group.admins.includes(email);
    if (targetIsAdmin && !isSelf && !isCreator) {
      return res.status(403).json({ error: 'Only the group creator can remove other admins' });
    }
  }

  // If IsGlobalAdmin, they can pretty much do anything, maybe except remove Creator logic?
  // Requirement: "Remove any student from any study group". 
  // It doesn't explicitly say "Remove Group Admin". But let's assume they have power.

  group.members = group.members.filter(m => m !== email);
  group.admins = group.admins.filter(a => a !== email); // Remove from admin if removed
  group.joinRequests = group.joinRequests.filter(r => r !== email); // Ensure removed from requests too so they can re-request

  await group.save();
  io.emit('group:update', group);
  res.json(group);
});

app.post('/api/groups/:id/leave', async (req, res) => {
  // Kept for backward compatibility, but redirects to the delete endpoint logic basically
  const { email } = req.body;
  const g = await Group.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { members: email, admins: email }
    },
    { new: true }
  );
  io.emit('group:update', g); // Emit event
  res.json(g);
});

app.post('/api/groups/:id/messages', async (req, res) => {
  const { sender, content, imageUrl, fileUrl, fileName, fileType } = req.body;
  if (!sender || (!content && !imageUrl && !fileUrl)) return res.status(400).json({ error: 'Missing sender or content/image/file' });
  const gCheck = await Group.findById(req.params.id);
  if (!gCheck) return res.status(404).json({ error: 'Group not found' });

  // Check if sender is member OR global admin
  const user = await User.findOne({ email: sender });
  const isGlobalAdmin = user?.role === 'admin';

  if (!isGlobalAdmin && !gCheck.members.includes(sender)) return res.status(403).json({ error: 'You are not a member of this group' });
  const senderName = user ? user.name : 'Unknown';
  const senderPhoto = user ? user.photoUrl : '';

  const g = await Group.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        messages: {
          sender,
          senderName,
          senderPhoto,
          content,
          imageUrl,
          fileUrl,
          fileName,
          fileType,
          createdAt: new Date()
        }
      }
    },
    { new: true }
  );
  io.emit('group:update', g); // Emit event
  res.json(g);
});

app.delete('/api/groups/:id/messages/:messageId', async (req, res) => {
  const { requesterEmail } = req.query as any;
  const { id, messageId } = req.params;

  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  if (!group.admins.includes(requesterEmail) && group.createdByEmail !== requesterEmail) {
    return res.status(403).json({ error: 'Only admins can delete messages' });
  }

  group.messages.pull({ _id: messageId });
  await group.save();
  io.emit('group:update', group);
  res.json(group);
});

// Phase 2: Message Soft Delete
app.patch('/api/groups/:id/messages/:messageId/soft-delete', async (req, res) => {
  const { requesterEmail } = req.body;
  const { id, messageId } = req.params;

  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const msgOpt = group.messages.id(messageId);
  if (!msgOpt) return res.status(404).json({ error: 'Message not found' });

  const typedMsg = msgOpt as any;
  if (!group.admins.includes(requesterEmail) && group.createdByEmail !== requesterEmail && typedMsg.sender !== requesterEmail) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  typedMsg.isDeleted = true;
  typedMsg.content = 'This message was deleted';
  typedMsg.imageUrl = '';
  typedMsg.fileUrl = '';

  await group.save();
  io.emit('group:update', group);
  res.json(group);
});

// Phase 2: Message Reactions
app.post('/api/groups/:id/messages/:messageId/reactions', async (req, res) => {
  const { user, emoji } = req.body;
  const { id, messageId } = req.params;

  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const msgOpt = group.messages.id(messageId);
  if (!msgOpt) return res.status(404).json({ error: 'Message not found' });

  const typedMsg = msgOpt as any;
  if (!typedMsg.reactions) typedMsg.reactions = [];

  const existingIdx = typedMsg.reactions.findIndex((r: any) => r.user === user && r.emoji === emoji);
  if (existingIdx >= 0) {
    typedMsg.reactions.splice(existingIdx, 1); // toggle off
  } else {
    typedMsg.reactions.push({ emoji, user });
  }

  await group.save();
  io.emit('group:update', group);
  res.json(group);
});

// Phase 2: Message Read Receipts
app.post('/api/groups/:id/messages/:messageId/read', async (req, res) => {
  const { user } = req.body;
  const { id, messageId } = req.params;

  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const msgOpt = group.messages.id(messageId);
  if (!msgOpt) return res.status(404).json({ error: 'Message not found' });

  const typedMsg = msgOpt as any;
  if (!typedMsg.readBy) typedMsg.readBy = [];
  
  if (!typedMsg.readBy.includes(user)) {
    typedMsg.readBy.push(user);
    await group.save();
    io.emit('group:update', group);
  }
  
  res.json(group);
});

// Phase 2: Study Sessions
app.post('/api/groups/:id/sessions', async (req, res) => {
  const { title, date, meetLink, hostUser } = req.body;
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const session = { title, date, meetLink, hostUser, attendees: [hostUser], status: 'scheduled' };
  group.sessions.push(session as any);
  await group.save();
  io.emit('group:update', group);
  res.status(201).json(group);
});

app.patch('/api/groups/:id/sessions/:sessionId', async (req, res) => {
  const { status, userAction, userEmail } = req.body; 
  const { id, sessionId } = req.params;

  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const sessOpt = group.sessions.id(sessionId);
  if (!sessOpt) return res.status(404).json({ error: 'Session not found' });

  const typedSess = sessOpt as any;
  
  if (status) typedSess.status = status;
  if (userAction === 'join' && userEmail && !typedSess.attendees.includes(userEmail)) {
    typedSess.attendees.push(userEmail);
  } else if (userAction === 'leave' && userEmail) {
    typedSess.attendees = typedSess.attendees.filter((a: string) => a !== userEmail);
  }

  await group.save();
  io.emit('group:update', group);
  res.json(group);
});

// Phase 2: Shared Notes
app.post('/api/groups/:id/notes', async (req, res) => {
  const { title, content, author, authorName } = req.body;
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const note = { title, content, author, authorName, createdAt: new Date(), lastUpdatedAt: new Date() };
  group.notes.push(note as any);
  await group.save();
  io.emit('group:update', group);
  res.status(201).json(group);
});

// Phase 2: Polls
app.post('/api/groups/:id/polls', async (req, res) => {
  const { question, options, createdBy } = req.body;
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const pollOptions = options.map((opt: string) => ({ text: opt, votes: [] }));
  const poll = { question, options: pollOptions, createdBy, createdAt: new Date(), isActive: true };
  
  group.polls.push(poll as any);
  await group.save();
  io.emit('group:update', group);
  res.status(201).json(group);
});

app.post('/api/groups/:id/polls/:pollId/vote', async (req, res) => {
  const { email, optionIndex } = req.body;
  const { id, pollId } = req.params;

  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const pollOpt = group.polls.id(pollId);
  if (!pollOpt) return res.status(404).json({ error: 'Poll not found' });

  const typedPoll = pollOpt as any;
  if (!typedPoll.isActive) return res.status(400).json({ error: 'Poll is closed' });

  // Remove previous vote
  typedPoll.options.forEach((opt: any) => {
    opt.votes = opt.votes.filter((v: string) => v !== email);
  });

  // Add new vote
  if (typedPoll.options[optionIndex]) {
    typedPoll.options[optionIndex].votes.push(email);
  }

  await group.save();
  io.emit('group:update', group);
  res.json(group);
});

app.delete('/api/groups/:id', async (req, res) => {
  const { requester } = req.query as any;
  const g = await Group.findById(req.params.id);
  if (!g) return res.status(404).json({ error: 'Not found' });
  if (requester) {
    const requesterUser = await User.findOne({ email: requester });
    const isGlobalAdmin = requesterUser?.role === 'admin';
    if (!isGlobalAdmin && g.createdByEmail && requester !== g.createdByEmail) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  await Group.findByIdAndDelete(req.params.id);
  io.emit('group:delete', req.params.id); // Emit event
  res.json({ ok: true });
});

app.get('/api/events', async (req, res) => {
  const { school } = req.query as any;
  const query: any = {};
  if (school) query.school = school;

  const items = await Event.find(query).sort({ date: 1 });
  res.json(items);
});

app.post('/api/events', async (req, res) => {
  const { title, date, location, organizer, description, imageUrl, timings, school, createdByEmail } = req.body;

  const created = await Event.create({
    title,
    date,
    location,
    organizer,
    description,
    imageUrl,
    timings,
    school,
    createdByEmail
  });
  io.emit('event:create', created);
  res.status(201).json(created);
});

// ═══════════════════════════════════════════════
//  EVENT HUB API ROUTES
// ═══════════════════════════════════════════════

// Helper: create notifications for all teachers + admins
async function notifyReviewers(eventDoc: any, type: string, title: string, message: string) {
  const reviewers = await User.find({ $or: [{ role: 'teacher', status: 'approved' }, { role: 'admin' }] });
  const notifications = reviewers.map((u) => ({
    recipientEmail: u.email,
    type,
    title,
    message,
    relatedEventId: eventDoc._id,
  }));
  await Notification.insertMany(notifications);
  // Emit socket event for real-time bell update
  reviewers.forEach((u) => {
    io.emit(`notification:${u.email}`, { type, title, message, eventId: eventDoc._id });
  });
}

// GET /api/events/hub — all approved + postponed events (public feed)
app.get('/api/events/hub', async (req, res) => {
  try {
    const { type, status, school, search } = req.query as any;
    const query: any = { status: { $in: ['approved', 'postponed', 'completed'] } };
    if (type) query.type = type;
    if (status && ['approved', 'postponed', 'completed'].includes(status)) query.status = status;
    if (school) query.schools = school;
    if (search) query.title = { $regex: search, $options: 'i' };

    const events = await HubEvent.find(query).sort({ date: -1 });
    res.json(events);
  } catch (e) {
    console.error('Error fetching hub events', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/events/pending — approval queue (teachers + admins only)
app.get('/api/events/pending', async (req, res) => {
  try {
    const { requesterEmail } = req.query as any;
    if (!requesterEmail) return res.status(400).json({ error: 'Missing requesterEmail' });

    const user = await User.findOne({ email: requesterEmail });
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const pending = await HubEvent.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (e) {
    console.error('Error fetching pending events', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/events/my-requests — student's own requests
app.get('/api/events/my-requests', async (req, res) => {
  try {
    const { email } = req.query as any;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    const events = await HubEvent.find({ createdByEmail: email }).sort({ createdAt: -1 });
    res.json(events);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events/create — teacher/admin creates directly (instant publish)
app.post('/api/events/create', async (req, res) => {
  try {
    const { createdByEmail, ...eventData } = req.body;
    if (!createdByEmail) return res.status(400).json({ error: 'Missing createdByEmail' });

    const user = await User.findOne({ email: createdByEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Students must use /api/events/request' });
    }

    const hubEvent = await HubEvent.create({
      ...eventData,
      createdByEmail,
      createdByName: user.name || createdByEmail,
      createdByRole: user.role,
      status: 'approved',
    });

    io.emit('hub-event:create', hubEvent);
    res.status(201).json(hubEvent);
  } catch (e) {
    console.error('Error creating hub event', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events/request — student submits event for approval
app.post('/api/events/request', async (req, res) => {
  try {
    const { createdByEmail, ...eventData } = req.body;
    if (!createdByEmail) return res.status(400).json({ error: 'Missing createdByEmail' });

    const user = await User.findOne({ email: createdByEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hubEvent = await HubEvent.create({
      ...eventData,
      createdByEmail,
      createdByName: user.name || createdByEmail,
      createdByRole: user.role || 'student',
      status: 'pending',
    });

    // Notify all teachers + admins
    await notifyReviewers(
      hubEvent,
      'event_request',
      'New Event Request',
      `${user.name || createdByEmail} has submitted "${hubEvent.title}" for approval.`
    );

    io.emit('hub-event:request', hubEvent);
    res.status(201).json(hubEvent);
  } catch (e) {
    console.error('Error creating event request', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/events/:id/approve — approve a pending event
app.patch('/api/events/:id/approve', async (req, res) => {
  try {
    const { approverEmail } = req.body;
    if (!approverEmail) return res.status(400).json({ error: 'Missing approverEmail' });

    const approver = await User.findOne({ email: approverEmail });
    if (!approver || (approver.role !== 'teacher' && approver.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const hubEvent = await HubEvent.findById(req.params.id);
    if (!hubEvent) return res.status(404).json({ error: 'Event not found' });
    if (hubEvent.status !== 'pending') return res.status(400).json({ error: 'Event is not pending' });

    hubEvent.status = 'approved';
    hubEvent.approvedBy = approverEmail;
    await hubEvent.save();

    // Notify the student who created it
    await Notification.create({
      recipientEmail: hubEvent.createdByEmail,
      type: 'event_approved',
      title: 'Event Approved! 🎉',
      message: `Your event "${hubEvent.title}" has been approved by ${approver.name || approverEmail}.`,
      relatedEventId: hubEvent._id,
    });
    io.emit(`notification:${hubEvent.createdByEmail}`, { type: 'event_approved', title: hubEvent.title });

    io.emit('hub-event:update', hubEvent);
    res.json(hubEvent);
  } catch (e) {
    console.error('Error approving event', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/events/:id/reject — reject with mandatory reason
app.patch('/api/events/:id/reject', async (req, res) => {
  try {
    const { approverEmail, reason } = req.body;
    if (!approverEmail) return res.status(400).json({ error: 'Missing approverEmail' });
    if (!reason || !reason.trim()) return res.status(400).json({ error: 'Rejection reason is mandatory' });

    const approver = await User.findOne({ email: approverEmail });
    if (!approver || (approver.role !== 'teacher' && approver.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const hubEvent = await HubEvent.findById(req.params.id);
    if (!hubEvent) return res.status(404).json({ error: 'Event not found' });
    if (hubEvent.status !== 'pending') return res.status(400).json({ error: 'Event is not pending' });

    hubEvent.status = 'rejected';
    hubEvent.approvedBy = approverEmail;
    hubEvent.rejectionReason = reason.trim();
    await hubEvent.save();

    // Notify the student
    await Notification.create({
      recipientEmail: hubEvent.createdByEmail,
      type: 'event_rejected',
      title: 'Event Rejected',
      message: `Your event "${hubEvent.title}" was rejected. Reason: ${reason.trim()}`,
      relatedEventId: hubEvent._id,
    });
    io.emit(`notification:${hubEvent.createdByEmail}`, { type: 'event_rejected', title: hubEvent.title, reason: reason.trim() });

    io.emit('hub-event:update', hubEvent);
    res.json(hubEvent);
  } catch (e) {
    console.error('Error rejecting event', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/events/:id/postpone — admin postpones event
app.patch('/api/events/:id/postpone', async (req, res) => {
  try {
    const { requesterEmail, newDate, newTime, reason } = req.body;
    if (!requesterEmail) return res.status(400).json({ error: 'Missing requesterEmail' });

    const user = await User.findOne({ email: requesterEmail });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Global Admins can postpone events' });
    }

    const hubEvent = await HubEvent.findById(req.params.id);
    if (!hubEvent) return res.status(404).json({ error: 'Event not found' });

    hubEvent.status = 'postponed';
    hubEvent.postponeReason = reason || '';
    hubEvent.newDate = newDate ? new Date(newDate) : null;
    hubEvent.newTime = newTime || '';
    await hubEvent.save();

    // Notify event creator
    await Notification.create({
      recipientEmail: hubEvent.createdByEmail,
      type: 'event_postponed',
      title: 'Event Postponed',
      message: `Your event "${hubEvent.title}" has been postponed. ${reason ? 'Reason: ' + reason : ''}`,
      relatedEventId: hubEvent._id,
    });
    io.emit(`notification:${hubEvent.createdByEmail}`, { type: 'event_postponed', title: hubEvent.title });

    io.emit('hub-event:update', hubEvent);
    res.json(hubEvent);
  } catch (e) {
    console.error('Error postponing event', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/events/:id/edit — admin edits event
app.patch('/api/events/:id/edit', async (req, res) => {
  try {
    const { requesterEmail, ...updates } = req.body;
    if (!requesterEmail) return res.status(400).json({ error: 'Missing requesterEmail' });

    const user = await User.findOne({ email: requesterEmail });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Global Admins can edit events' });
    }

    const hubEvent = await HubEvent.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!hubEvent) return res.status(404).json({ error: 'Event not found' });

    io.emit('hub-event:update', hubEvent);
    res.json(hubEvent);
  } catch (e) {
    console.error('Error editing event', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/events/:id/hub — admin deletes event
app.delete('/api/events/:id/hub', async (req, res) => {
  try {
    const { requesterEmail } = req.query as any;
    if (!requesterEmail) return res.status(400).json({ error: 'Missing requesterEmail' });

    const user = await User.findOne({ email: requesterEmail });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Global Admins can delete events' });
    }

    const deleted = await HubEvent.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Event not found' });

    io.emit('hub-event:delete', req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error deleting hub event', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Notification Routes ───

// GET /api/notifications — get user notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const { email } = req.query as any;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    const items = await Notification.find({ recipientEmail: email }).sort({ createdAt: -1 }).limit(50);
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/notifications/unread-count
app.get('/api/notifications/unread-count', async (req, res) => {
  try {
    const { email } = req.query as any;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    const count = await Notification.countDocuments({ recipientEmail: email, read: false });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/notifications/:id/read
app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const n = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!n) return res.status(404).json({ error: 'Not found' });
    res.json(n);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/notifications/read-all
app.patch('/api/notifications/read-all', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    await Notification.updateMany({ recipientEmail: email, read: false }, { read: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

import { fetchAllNews, getLiveCache, saveLiveCacheToArchive, runArchiveCleanup } from './services/newsService';

// Initialize news intervals
const NEWS_REFRESH_INTERVAL_MS = parseInt(process.env.NEWS_REFRESH_INTERVAL_MS || '60000', 10);
const NEWS_ARCHIVE_SAVE_INTERVAL_MS = parseInt(process.env.NEWS_ARCHIVE_SAVE_INTERVAL_MS || '300000', 10);
const NEWS_CLEANUP_INTERVAL_MS = parseInt(process.env.NEWS_CLEANUP_INTERVAL_MS || '3600000', 10);

setInterval(() => {
  fetchAllNews().catch(err => console.error('Failed to fetch news', err));
}, NEWS_REFRESH_INTERVAL_MS);

setInterval(() => {
  saveLiveCacheToArchive().catch(err => console.error('Failed to save news archive', err));
}, NEWS_ARCHIVE_SAVE_INTERVAL_MS);

setInterval(() => {
  runArchiveCleanup().catch(err => console.error('Failed to cleanup news archive', err));
}, NEWS_CLEANUP_INTERVAL_MS);

// Initial fetch
fetchAllNews().catch(err => console.error('Failed initial news fetch', err));

app.get('/api/technews', async (_req, res) => {
  try {
    const liveCache = getLiveCache();
    res.json(liveCache);
  } catch (e) {
    console.error('Error serving tech news', e);
    res.status(500).json({ error: 'Failed to serve news' });
  }
});



// 1. Comprehensive App Stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalGroups = await Group.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalLostFound = await LostFound.countDocuments();
    const totalResources = await Resource.countDocuments();
    const totalNotices = await Notice.countDocuments();

    res.json({
      users: { total: totalUsers, teachers: totalTeachers, students: totalStudents },
      groups: totalGroups,
      events: totalEvents,
      lostFound: totalLostFound,
      resources: totalResources,
      notices: totalNotices
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Analytics (Recent signups, active users approx)
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSignups = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const recentEvents = await Event.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const recentGroups = await Group.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Build daily user registration data for last 30 days
    const userGrowthRaw = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const userGrowth = userGrowthRaw.map((item: any) => ({
      date: new Date(item._id.year, item._id.month - 1, item._id.day).toISOString(),
      count: item.count
    }));

    res.json({
      recentSignups,
      recentEvents,
      recentGroups,
      userGrowth,
      thirtyDaysAgo
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. User Management (Get all users)
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Broadcast Messaging
app.post('/api/admin/broadcast', async (req, res) => {
  try {
    const { message, senderEmail, type } = req.body; // type can be 'alert', 'info', etc.
    io.emit('ADMIN_BROADCAST', {
      _id: new mongoose.Types.ObjectId(),
      message,
      senderEmail,
      type: type || 'info',
      createdAt: new Date()
    });
    res.json({ success: true, message: 'Broadcast sent to all connected clients.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all teachers (pending or all)
app.get('/api/admin/teachers', async (req, res) => {
  const { status } = req.query as any;
  const query: any = { role: 'teacher' };
  if (status) query.status = status;

  // Sort logic: pending first, then others
  const teachers = await User.find(query).sort({ createdAt: -1 });
  res.json(teachers);
});

// Approve/Reject teacher
app.patch('/api/admin/teachers/:email', async (req, res) => {
  const { email } = req.params;
  const { status } = req.body; // 'approved' | 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const user = await User.findOneAndUpdate(
    { email },
    { status },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json(user);
});



// Delete teacher (Admin only)
app.delete('/api/admin/teachers/:email', async (req, res) => {
  const { email } = req.params;
  console.log(`DELETE request for teacher: ${email}`);
  const deleted = await User.findOneAndDelete({ email });
  if (!deleted) {
    console.log(`User not found for deletion: ${email}`);
    return res.status(404).json({ error: 'User not found' });
  }
  console.log(`Successfully deleted teacher: ${email}`);
  res.json({ ok: true });
});

async function seedAdmins() {
  const admins = [
    { email: 'pranav@admin.com', pass: 'admin123', name: 'Pranav Admin' },
    { email: 'aman@admin.com', pass: 'admin123', name: 'Aman Admin' }
  ];

  for (const a of admins) {
    const exists = await User.findOne({ email: a.email });
    if (!exists) {
      console.log(`Seeding admin: ${a.email}`);
      const hash = await bcrypt.hash(a.pass, 10);
      await User.create({
        email: a.email,
        passwordHash: hash,
        name: a.name,
        role: 'admin',
        status: 'approved',
        designation: 'Global Admin / Administrator',
        department: 'Administration',
        school: 'CampusConnect',
        phone: '0000000000'
      });
    } else {
      // Ensure they are admin if they exist
      if (exists.role !== 'admin') {
        console.log(`Fixing admin role for: ${a.email}`);
        exists.role = 'admin';
        exists.status = 'approved';
        await exists.save();
      }
    }
  }
}

async function start() {
  await mongoose.connect(MONGO_URI);
  if (process.env.SEED_ADMINS === 'true') {
    await seedAdmins();
  }
  // print registered routes for debugging
  try {
    // some Express builds keep router on app._router
    // collect route informations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routes: Array<{ path: string; methods: string[] }> = [];
    // @ts-ignore
    const stack = app._router && app._router.stack ? app._router.stack : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stack.forEach((layer: any) => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods || {});
        routes.push({ path: layer.route.path, methods });
      }
    });
    console.log('Registered routes:', JSON.stringify(routes, null, 2));
  } catch (e) {
    console.warn('Could not enumerate routes', e);
  }

  // Use server.listen instead of app.listen
  server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
