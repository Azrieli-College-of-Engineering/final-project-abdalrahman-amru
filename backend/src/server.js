require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { prisma, pool } = require('./utils/prisma');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
    reportOnly: false,
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// CSP violation reporting endpoint
app.post('/api/csp-violation-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  if (req.body) {
    console.error('CSP Violation:', JSON.stringify(req.body, null, 2));
  }
  res.status(204).end();
});

// Rate limiting - General API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: false,
});

// Body parsing
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database health check endpoint
app.get('/db-health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Secure Notes API',
    version: '1.0.0'
  });
});

// API Routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/notes', notesRoutes);

// Admin endpoint for tampering simulation (DEV ONLY)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/admin/tamper-note/:id', express.json(), async (req, res) => {
    try {
      const { id } = req.params;
      const noteId = parseInt(id);
      
      if (isNaN(noteId)) {
        return res.status(400).json({ error: 'Invalid note ID' });
      }
      
      // Get the note
      const note = await prisma.note.findUnique({
        where: { id: noteId }
      });
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      // Tamper with the ciphertext (flip some bits)
      const tamperedCiphertext = note.ciphertext.slice(0, -5) + 'XXXXX';
      
      // Update the note with tampered data
      await prisma.note.update({
        where: { id: noteId },
        data: { ciphertext: tamperedCiphertext }
      });
      
      res.json({
        message: 'Note tampered successfully (for testing purposes)',
        originalCiphertext: note.ciphertext.slice(0, 50) + '...',
        tamperedCiphertext: tamperedCiphertext.slice(0, 50) + '...'
      });
      
    } catch (error) {
      console.error('Tamper note error:', error);
      res.status(500).json({ error: 'Failed to tamper note' });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  DB check: http://localhost:${PORT}/db-health`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});

startServer();
