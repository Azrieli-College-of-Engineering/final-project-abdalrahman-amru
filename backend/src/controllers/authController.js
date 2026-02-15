const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
async function register(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, usernameHash, passwordVerifier, saltLogin } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password verifier before storing
    const hashedVerifier = await bcrypt.hash(passwordVerifier, 10);
    
    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        usernameHash,
        passwordVerifier: hashedVerifier,
        saltLogin
      }
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Login user
 * @route POST /api/auth/login
 */
async function login(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, passwordVerifier } = req.body;
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(
      passwordVerifier,
      user.passwordVerifier
    );
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      token,
      userId: user.id,
      email: user.email,
      saltLogin: user.saltLogin
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { register, login };
