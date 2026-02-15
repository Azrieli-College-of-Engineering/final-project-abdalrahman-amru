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

/**
 * Change user password
 * @route PUT /api/auth/change-password
 */
async function changePassword(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPasswordVerifier, newPasswordVerifier, newSaltLogin } = req.body;
    const userId = req.userId; // from JWT middleware
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(
      currentPasswordVerifier,
      user.passwordVerifier
    );
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password verifier
    const hashedNewVerifier = await bcrypt.hash(newPasswordVerifier, 10);
    
    // Update user password and salt
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordVerifier: hashedNewVerifier,
        saltLogin: newSaltLogin
      }
    });
    
    res.json({
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      error: 'Password change failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { register, login, changePassword };
