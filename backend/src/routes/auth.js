const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// Validation rules for registration
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('usernameHash')
    .notEmpty()
    .withMessage('Username hash is required')
    .isString(),
  body('passwordVerifier')
    .notEmpty()
    .withMessage('Password verifier is required')
    .isString(),
  body('saltLogin')
    .notEmpty()
    .withMessage('Salt is required')
    .isString()
];

// Validation rules for login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('passwordVerifier')
    .notEmpty()
    .withMessage('Password verifier is required')
    .isString()
];

// POST /api/auth/register - Register new user
router.post('/register', registerValidation, register);

// POST /api/auth/login - Login user
router.post('/login', loginValidation, login);

module.exports = router;
