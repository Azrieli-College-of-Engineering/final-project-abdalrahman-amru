const express = require('express');
const { body } = require('express-validator');
const { register, login, changePassword } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

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

// PUT /api/auth/change-password - Change user password (requires authentication)
const changePasswordValidation = [
  body('currentPasswordVerifier')
    .notEmpty()
    .withMessage('Current password verifier is required')
    .isString(),
  body('newPasswordVerifier')
    .notEmpty()
    .withMessage('New password verifier is required')
    .isString(),
  body('newSaltLogin')
    .notEmpty()
    .withMessage('New salt is required')
    .isString()
];

router.put('/change-password', authenticate, changePasswordValidation, changePassword);

module.exports = router;
