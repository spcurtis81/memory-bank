import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { runAsync, getAsync, allAsync } from '../models/db.js';

const router = express.Router();

// Get all folders
router.get('/', async (req, res) => {
  try {
    const folders = await allAsync(
      `SELECT * FROM folders ORDER BY parent_id NULLS FIRST, name`
    );
    res.json(folders);
  } catch (err) {
    console.error('Error fetching folders:', err);
    res.status(500).json({ message: 'Failed to fetch folders' });
  }
});

// Get a folder by ID
router.get('/:id', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    
    const folder = await getAsync('SELECT * FROM folders WHERE id = ?', [id]);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    res.json(folder);
  } catch (err) {
    console.error('Error fetching folder:', err);
    res.status(500).json({ message: 'Failed to fetch folder' });
  }
});

// Create a new folder
router.post(
  '/',
  [
    body('name').isString().notEmpty(),
    body('parent_id').optional({ nullable: true }).isInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { name, parent_id } = req.body;
      
      // Check if parent folder exists if parent_id is provided
      if (parent_id) {
        const parentFolder = await getAsync('SELECT * FROM folders WHERE id = ?', [parent_id]);
        if (!parentFolder) {
          return res.status(400).json({ message: 'Parent folder not found' });
        }
      }
      
      // Create the new folder
      const result = await runAsync(
        'INSERT INTO folders (name, parent_id) VALUES (?, ?)',
        [name, parent_id]
      );
      
      const newFolder = await getAsync('SELECT * FROM folders WHERE id = ?', [result.lastID]);
      
      res.status(201).json(newFolder);
    } catch (err) {
      console.error('Error creating folder:', err);
      res.status(500).json({ message: 'Failed to create folder' });
    }
  }
);

// Update a folder
router.put(
  '/:id',
  [
    param('id').isInt(),
    body('name').optional().isString().notEmpty(),
    body('parent_id').optional({ nullable: true }).isInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { id } = req.params;
      const { name, parent_id } = req.body;
      
      // Check if folder exists
      const folder = await getAsync('SELECT * FROM folders WHERE id = ?', [id]);
      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }
      
      // Check if parent folder exists if parent_id is provided
      if (parent_id !== undefined && parent_id !== null) {
        // Check if the parent_id refers to the folder itself
        if (parseInt(id) === parseInt(parent_id)) {
          return res.status(400).json({ message: 'A folder cannot be its own parent' });
        }
        
        // Check if the parent folder exists
        const parentFolder = await getAsync('SELECT * FROM folders WHERE id = ?', [parent_id]);
        if (!parentFolder) {
          return res.status(400).json({ message: 'Parent folder not found' });
        }
        
        // Check if the new parent is a descendant of the current folder
        // This is a simplified check and may need more sophisticated logic for deeper hierarchies
        const childFolders = await allAsync('SELECT id FROM folders WHERE parent_id = ?', [id]);
        if (childFolders.some(child => child.id === parseInt(parent_id))) {
          return res.status(400).json({ message: 'Cannot set a descendant as parent' });
        }
      }
      
      // Prepare update query
      const updateFields = [];
      const updateValues = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      
      if (parent_id !== undefined) {
        updateFields.push('parent_id = ?');
        updateValues.push(parent_id);
      }
      
      // Add updated timestamp
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      // Add ID for WHERE clause
      updateValues.push(id);
      
      // Update the folder
      await runAsync(
        `UPDATE folders SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      // Get updated folder
      const updatedFolder = await getAsync('SELECT * FROM folders WHERE id = ?', [id]);
      
      res.json(updatedFolder);
    } catch (err) {
      console.error('Error updating folder:', err);
      res.status(500).json({ message: 'Failed to update folder' });
    }
  }
);

// Delete a folder
router.delete('/:id', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    
    // Check if folder exists
    const folder = await getAsync('SELECT * FROM folders WHERE id = ?', [id]);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Start transaction
    await runAsync('BEGIN TRANSACTION');
    
    // Get bookmarks in the folder
    const bookmarks = await allAsync('SELECT id FROM bookmarks WHERE folder_id = ?', [id]);
    
    // Unlink bookmarks from the folder (set folder_id to null)
    if (bookmarks.length > 0) {
      await runAsync('UPDATE bookmarks SET folder_id = NULL WHERE folder_id = ?', [id]);
    }
    
    // Move child folders to parent's level
    await runAsync(
      'UPDATE folders SET parent_id = ? WHERE parent_id = ?',
      [folder.parent_id, id]
    );
    
    // Delete the folder
    await runAsync('DELETE FROM folders WHERE id = ?', [id]);
    
    // Commit transaction
    await runAsync('COMMIT');
    
    res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (err) {
    // Rollback on error
    await runAsync('ROLLBACK');
    console.error('Error deleting folder:', err);
    res.status(500).json({ message: 'Failed to delete folder' });
  }
});

// Get bookmarks in a folder
router.get('/:id/bookmarks', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    
    // Check if folder exists
    const folder = await getAsync('SELECT * FROM folders WHERE id = ?', [id]);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    const bookmarks = await allAsync(
      `SELECT b.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names
       FROM bookmarks b
       LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
       LEFT JOIN tags t ON bt.tag_id = t.id
       WHERE b.folder_id = ?
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [id]
    );
    
    // Process the results to format tags
    const formattedBookmarks = bookmarks.map(bookmark => {
      const tags = [];
      
      if (bookmark.tag_ids) {
        const tagIds = bookmark.tag_ids.split(',');
        const tagNames = bookmark.tag_names.split(',');
        
        for (let i = 0; i < tagIds.length; i++) {
          if (tagIds[i]) {
            tags.push({
              id: parseInt(tagIds[i]),
              name: tagNames[i]
            });
          }
        }
      }
      
      // Remove the raw tags fields
      delete bookmark.tag_ids;
      delete bookmark.tag_names;
      
      return {
        ...bookmark,
        tags
      };
    });
    
    res.json(formattedBookmarks);
  } catch (err) {
    console.error('Error fetching bookmarks in folder:', err);
    res.status(500).json({ message: 'Failed to fetch bookmarks in folder' });
  }
});

export default router; 