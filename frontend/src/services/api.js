import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api'
});

// Bookmarks
export const fetchBookmarks = async (folderId = null) => {
  const params = {};
  if (folderId) params.folder_id = folderId;
  
  const response = await api.get('/bookmarks', { params });
  return response.data;
};

export const addBookmark = async (bookmarkData) => {
  const response = await api.post('/bookmarks', bookmarkData);
  return response.data;
};

export const updateBookmark = async ({ id, ...bookmarkData }) => {
  const response = await api.put(`/bookmarks/${id}`, bookmarkData);
  return response.data;
};

export const deleteBookmark = async (id) => {
  const response = await api.delete(`/bookmarks/${id}`);
  return response.data;
};

// Folders
export const fetchFolders = async () => {
  const response = await api.get('/folders');
  return response.data;
};

export const addFolder = async (folderData) => {
  const response = await api.post('/folders', folderData);
  return response.data;
};

export const updateFolder = async ({ id, ...folderData }) => {
  const response = await api.put(`/folders/${id}`, folderData);
  return response.data;
};

export const deleteFolder = async (id) => {
  const response = await api.delete(`/folders/${id}`);
  return response.data;
};

// Tags
export const fetchTags = async () => {
  const response = await api.get('/tags');
  return response.data;
};

export const searchByTag = async (tagName) => {
  const response = await api.get(`/tags/${tagName}/bookmarks`);
  return response.data;
};

// URL metadata fetch
export const fetchUrlMetadata = async (url) => {
  const response = await api.post('/bookmarks/fetch-metadata', { url });
  return response.data;
};

// Search
export const searchBookmarks = async (query) => {
  const response = await api.get('/bookmarks/search', { params: { q: query } });
  return response.data;
};

export default api; 