import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { runAsync, getAsync, allAsync } from '../models/db.js';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const router = express.Router();

// Get all bookmarks
router.get('/', async (req, res) => {
  try {
    const { folder_id } = req.query;
    
    let bookmarks;
    if (folder_id) {
      bookmarks = await allAsync(
        `SELECT b.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names
         FROM bookmarks b
         LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
         LEFT JOIN tags t ON bt.tag_id = t.id
         WHERE b.folder_id = ?
         GROUP BY b.id
         ORDER BY b.created_at DESC`,
        [folder_id]
      );
    } else {
      bookmarks = await allAsync(
        `SELECT b.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names
         FROM bookmarks b
         LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
         LEFT JOIN tags t ON bt.tag_id = t.id
         GROUP BY b.id
         ORDER BY b.created_at DESC`
      );
    }
    
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
    console.error('Error fetching bookmarks:', err);
    res.status(500).json({ message: 'Failed to fetch bookmarks' });
  }
});

// Get a single bookmark by ID
router.get('/:id', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const bookmark = await getAsync(
      `SELECT b.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names
       FROM bookmarks b
       LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
       LEFT JOIN tags t ON bt.tag_id = t.id
       WHERE b.id = ?
       GROUP BY b.id`,
      [req.params.id]
    );
    
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    // Process tags
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
    
    res.json({
      ...bookmark,
      tags
    });
  } catch (err) {
    console.error('Error fetching bookmark:', err);
    res.status(500).json({ message: 'Failed to fetch bookmark' });
  }
});

// Create a new bookmark
router.post(
  '/',
  [
    body('url').isURL(),
    body('title').isString(),
    body('folder_id').optional({ nullable: true }).isInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { url, title, folder_id, tags = [] } = req.body;
      
      // Start a transaction
      await runAsync('BEGIN TRANSACTION');
      
      // Insert the bookmark
      const result = await runAsync(
        `INSERT INTO bookmarks (title, url, folder_id)
         VALUES (?, ?, ?)`,
        [title, url, folder_id]
      );
      
      const bookmarkId = result.lastID;
      
      // Process tags
      if (tags.length > 0) {
        for (const tagName of tags) {
          // Check if tag exists
          let tagResult = await getAsync(
            'SELECT id FROM tags WHERE name = ?',
            [tagName]
          );
          
          let tagId;
          if (tagResult) {
            tagId = tagResult.id;
          } else {
            // Create new tag
            const newTag = await runAsync(
              'INSERT INTO tags (name) VALUES (?)',
              [tagName]
            );
            tagId = newTag.lastID;
          }
          
          // Associate tag with bookmark
          await runAsync(
            'INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
            [bookmarkId, tagId]
          );
        }
      }
      
      // Commit transaction
      await runAsync('COMMIT');
      
      // Get the created bookmark with tags
      const createdBookmark = await getAsync(
        `SELECT b.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names
         FROM bookmarks b
         LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
         LEFT JOIN tags t ON bt.tag_id = t.id
         WHERE b.id = ?
         GROUP BY b.id`,
        [bookmarkId]
      );
      
      // Process tags for response
      const responseTags = [];
      if (createdBookmark.tag_ids) {
        const tagIds = createdBookmark.tag_ids.split(',');
        const tagNames = createdBookmark.tag_names.split(',');
        
        for (let i = 0; i < tagIds.length; i++) {
          if (tagIds[i]) {
            responseTags.push({
              id: parseInt(tagIds[i]),
              name: tagNames[i]
            });
          }
        }
      }
      
      // Remove the raw tags fields
      delete createdBookmark.tag_ids;
      delete createdBookmark.tag_names;
      
      res.status(201).json({
        ...createdBookmark,
        tags: responseTags
      });
    } catch (err) {
      // Rollback on error
      await runAsync('ROLLBACK');
      console.error('Error creating bookmark:', err);
      res.status(500).json({ message: 'Failed to create bookmark' });
    }
  }
);

// Update a bookmark
router.put(
  '/:id',
  [
    param('id').isInt(),
    body('url').optional().isURL(),
    body('title').optional().isString(),
    body('folder_id').optional({ nullable: true }).isInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { id } = req.params;
      const { url, title, folder_id, tags } = req.body;
      
      // Check if bookmark exists
      const bookmark = await getAsync('SELECT * FROM bookmarks WHERE id = ?', [id]);
      if (!bookmark) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }
      
      // Start transaction
      await runAsync('BEGIN TRANSACTION');
      
      // Update fields that are provided
      const updateFields = [];
      const updateValues = [];
      
      if (url !== undefined) {
        updateFields.push('url = ?');
        updateValues.push(url);
      }
      
      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }
      
      if (folder_id !== undefined) {
        updateFields.push('folder_id = ?');
        updateValues.push(folder_id);
      }
      
      // Update timestamp
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      // Add ID at the end of values for the WHERE clause
      updateValues.push(id);
      
      // Update bookmark if there are fields to update
      if (updateFields.length > 0) {
        await runAsync(
          `UPDATE bookmarks SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }
      
      // Update tags if provided
      if (tags !== undefined) {
        // First remove all existing tag associations
        await runAsync('DELETE FROM bookmark_tags WHERE bookmark_id = ?', [id]);
        
        // Then add new tag associations
        if (tags.length > 0) {
          for (const tagName of tags) {
            // Check if tag exists
            let tagResult = await getAsync('SELECT id FROM tags WHERE name = ?', [tagName]);
            
            let tagId;
            if (tagResult) {
              tagId = tagResult.id;
            } else {
              // Create new tag
              const newTag = await runAsync('INSERT INTO tags (name) VALUES (?)', [tagName]);
              tagId = newTag.lastID;
            }
            
            // Associate tag with bookmark
            await runAsync(
              'INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
              [id, tagId]
            );
          }
        }
      }
      
      // Commit transaction
      await runAsync('COMMIT');
      
      // Get the updated bookmark with tags
      const updatedBookmark = await getAsync(
        `SELECT b.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names
         FROM bookmarks b
         LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
         LEFT JOIN tags t ON bt.tag_id = t.id
         WHERE b.id = ?
         GROUP BY b.id`,
        [id]
      );
      
      // Process tags for response
      const responseTags = [];
      if (updatedBookmark.tag_ids) {
        const tagIds = updatedBookmark.tag_ids.split(',');
        const tagNames = updatedBookmark.tag_names.split(',');
        
        for (let i = 0; i < tagIds.length; i++) {
          if (tagIds[i]) {
            responseTags.push({
              id: parseInt(tagIds[i]),
              name: tagNames[i]
            });
          }
        }
      }
      
      // Remove the raw tags fields
      delete updatedBookmark.tag_ids;
      delete updatedBookmark.tag_names;
      
      res.json({
        ...updatedBookmark,
        tags: responseTags
      });
    } catch (err) {
      // Rollback on error
      await runAsync('ROLLBACK');
      console.error('Error updating bookmark:', err);
      res.status(500).json({ message: 'Failed to update bookmark' });
    }
  }
);

// Delete a bookmark
router.delete('/:id', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    
    // Check if bookmark exists
    const bookmark = await getAsync('SELECT * FROM bookmarks WHERE id = ?', [id]);
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    // Start transaction
    await runAsync('BEGIN TRANSACTION');
    
    // Delete bookmark tags associations first (foreign key constraint)
    await runAsync('DELETE FROM bookmark_tags WHERE bookmark_id = ?', [id]);
    
    // Delete the bookmark
    await runAsync('DELETE FROM bookmarks WHERE id = ?', [id]);
    
    // Commit transaction
    await runAsync('COMMIT');
    
    res.status(200).json({ message: 'Bookmark deleted successfully' });
  } catch (err) {
    // Rollback on error
    await runAsync('ROLLBACK');
    console.error('Error deleting bookmark:', err);
    res.status(500).json({ message: 'Failed to delete bookmark' });
  }
});

// Search bookmarks
router.get('/search', query('q').isString(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { q } = req.query;
    
    const bookmarks = await allAsync(
      `SELECT b.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names
       FROM bookmarks b
       LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
       LEFT JOIN tags t ON bt.tag_id = t.id
       WHERE b.title LIKE ? OR b.url LIKE ? OR t.name LIKE ?
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
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
    console.error('Error searching bookmarks:', err);
    res.status(500).json({ message: 'Failed to search bookmarks' });
  }
});

// Fetch URL metadata
router.post('/fetch-metadata', body('url').isURL(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { url } = req.body;
    
    // Fetch the page content
    const response = await fetch(url);
    const html = await response.text();
    
    // Parse the HTML
    const $ = cheerio.load(html);
    
    // Extract the title
    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    
    // Extract description
    const description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || '';
    
    // Extract favicon
    let favicon = $('link[rel="icon"]').attr('href') || 
                 $('link[rel="shortcut icon"]').attr('href') || '';
    
    // Make favicon URL absolute if it's relative
    if (favicon && !favicon.startsWith('http')) {
      const urlObj = new URL(url);
      if (favicon.startsWith('/')) {
        favicon = `${urlObj.protocol}//${urlObj.host}${favicon}`;
      } else {
        favicon = `${urlObj.protocol}//${urlObj.host}/${favicon}`;
      }
    }
    
    res.json({
      title,
      description,
      favicon,
      url
    });
  } catch (err) {
    console.error('Error fetching URL metadata:', err);
    res.status(500).json({ message: 'Failed to fetch URL metadata' });
  }
});

export default router; 