const { validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma');

/**
 * Get all notes for the authenticated user
 * @route GET /api/notes
 */
async function getNotes(req, res) {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ciphertext: true,
        iv: true,
        authTag: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json({ notes });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notes',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get a single note by ID
 * @route GET /api/notes/:id
 */
async function getNote(req, res) {
  try {
    const { id } = req.params;
    
    // Validate ID
    const noteId = parseInt(id);
    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }
    
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: req.userId
      }
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch note',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Create a new note
 * @route POST /api/notes
 */
async function createNote(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ciphertext, iv, authTag } = req.body;
    
    const note = await prisma.note.create({
      data: {
        userId: req.userId,
        ciphertext,
        iv,
        authTag
      }
    });
    
    res.status(201).json({
      message: 'Note created successfully',
      noteId: note.id,
      createdAt: note.createdAt
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ 
      error: 'Failed to create note',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Update an existing note
 * @route PUT /api/notes/:id
 */
async function updateNote(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { ciphertext, iv, authTag } = req.body;
    
    // Validate ID
    const noteId = parseInt(id);
    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }
    
    // Verify ownership
    const existing = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: req.userId
      }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Update note
    const note = await prisma.note.update({
      where: { id: noteId },
      data: { ciphertext, iv, authTag }
    });
    
    res.json({
      message: 'Note updated successfully',
      noteId: note.id,
      updatedAt: note.updatedAt
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ 
      error: 'Failed to update note',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Delete a note
 * @route DELETE /api/notes/:id
 */
async function deleteNote(req, res) {
  try {
    const { id } = req.params;
    
    // Validate ID
    const noteId = parseInt(id);
    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }
    
    // Verify ownership
    const existing = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: req.userId
      }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Delete note
    await prisma.note.delete({
      where: { id: noteId }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ 
      error: 'Failed to delete note',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
};
