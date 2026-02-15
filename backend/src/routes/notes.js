const express = require('express');
const { body, param } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
} = require('../controllers/notesController');

const router = express.Router();

// All notes routes require authentication
router.use(authenticate);

// Validation rules for note creation and update
const noteValidation = [
  body('ciphertext')
    .notEmpty()
    .withMessage('Ciphertext is required')
    .isString()
    .withMessage('Ciphertext must be a string'),
  body('iv')
    .notEmpty()
    .withMessage('IV is required')
    .isString()
    .withMessage('IV must be a string'),
  body('authTag')
    .notEmpty()
    .withMessage('Auth tag is required')
    .isString()
    .withMessage('Auth tag must be a string')
];

// Validation for note ID parameter
const noteIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Note ID must be a positive integer')
];

// GET /api/notes - List all user notes
router.get('/', getNotes);

// GET /api/notes/:id - Get single note
router.get('/:id', noteIdValidation, getNote);

// POST /api/notes - Create new note
router.post('/', noteValidation, createNote);

// PUT /api/notes/:id - Update note
router.put('/:id', [...noteIdValidation, ...noteValidation], updateNote);

// DELETE /api/notes/:id - Delete note
router.delete('/:id', noteIdValidation, deleteNote);

module.exports = router;
