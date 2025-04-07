import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { runAsync, getAsync, allAsync } from '../models/db.js';

const router = express.Router();

// Get all tags
router.get('/', async (req, res) => {
  try {
    const tags = await allAsync(
      `SELECT t.*, COUNT(bt.bookmark_id) as bookmark_count
       FROM tags t
       LEFT JOIN bookmark_tags bt ON t.id = bt.tag_id
       GROUP BY t.id
       ORDER BY t.name`
    );
    res.json(tags);
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
});

// Get a tag by ID
router.get('/:id', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    
    const tag = await getAsync(
      `SELECT t.*, COUNT(bt.bookmark_id) as bookmark_count
       FROM tags t
       LEFT JOIN bookmark_tags bt ON t.id = bt.tag_id
       WHERE t.id = ?
       GROUP BY t.id`,
      [id]
    );
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    
    res.json(tag);
  } catch (err) {
    console.error('Error fetching tag:', err);
    res.status(500).json({ message: 'Failed to fetch tag' });
  }
});

// Get bookmarks with a specific tag
router.get('/:id/bookmarks', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    
    // Check if tag exists
    const tag = await getAsync('SELECT * FROM tags WHERE id = ?', [id]);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    
    const bookmarks = await allAsync(
      `SELECT b.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names
       FROM bookmarks b
       JOIN bookmark_tags bt ON b.id = bt.bookmark_id
       LEFT JOIN bookmark_tags bt2 ON b.id = bt2.bookmark_id
       LEFT JOIN tags t ON bt2.tag_id = t.id
       WHERE bt.tag_id = ?
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
    console.error('Error fetching bookmarks with tag:', err);
    res.status(500).json({ message: 'Failed to fetch bookmarks with tag' });
  }
});

// Create a new tag
router.post(
  '/',
  [body('name').isString().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { name } = req.body;
      
      // Check if tag already exists
      const existingTag = await getAsync('SELECT * FROM tags WHERE name = ?', [name]);
      if (existingTag) {
        return res.status(409).json({ message: 'Tag already exists' });
      }
      
      // Create the new tag
      const result = await runAsync('INSERT INTO tags (name) VALUES (?)', [name]);
      const newTag = await getAsync('SELECT * FROM tags WHERE id = ?', [result.lastID]);
      
      res.status(201).json(newTag);
    } catch (err) {
      console.error('Error creating tag:', err);
      res.status(500).json({ message: 'Failed to create tag' });
    }
  }
);

// Update a tag
router.put(
  '/:id',
  [
    param('id').isInt(),
    body('name').isString().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      // Check if tag exists
      const tag = await getAsync('SELECT * FROM tags WHERE id = ?', [id]);
      if (!tag) {
        return res.status(404).json({ message: 'Tag not found' });
      }
      
      // Check if the new name already exists for another tag
      const existingTag = await getAsync('SELECT * FROM tags WHERE name = ? AND id != ?', [name, id]);
      if (existingTag) {
        return res.status(409).json({ message: 'Tag name already exists' });
      }
      
      // Update the tag
      await runAsync('UPDATE tags SET name = ? WHERE id = ?', [name, id]);
      
      // Get the updated tag
      const updatedTag = await getAsync(
        `SELECT t.*, COUNT(bt.bookmark_id) as bookmark_count
         FROM tags t
         LEFT JOIN bookmark_tags bt ON t.id = bt.tag_id
         WHERE t.id = ?
         GROUP BY t.id`,
        [id]
      );
      
      res.json(updatedTag);
    } catch (err) {
      console.error('Error updating tag:', err);
      res.status(500).json({ message: 'Failed to update tag' });
    }
  }
);

// Delete a tag
router.delete('/:id', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    
    // Check if tag exists
    const tag = await getAsync('SELECT * FROM tags WHERE id = ?', [id]);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    
    // Start transaction
    await runAsync('BEGIN TRANSACTION');
    
    // Delete tag associations
    await runAsync('DELETE FROM bookmark_tags WHERE tag_id = ?', [id]);
    
    // Delete the tag
    await runAsync('DELETE FROM tags WHERE id = ?', [id]);
    
    // Commit transaction
    await runAsync('COMMIT');
    
    res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (err) {
    // Rollback on error
    await runAsync('ROLLBACK');
    console.error('Error deleting tag:', err);
    res.status(500).json({ message: 'Failed to delete tag' });
  }
});

export default router; 