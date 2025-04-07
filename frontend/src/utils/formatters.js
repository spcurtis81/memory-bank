/**
 * Format a URL to display just the hostname
 * @param {string} url - The URL to format
 * @returns {string} The formatted URL
 */
export const formatUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
};

/**
 * Format a date string to a human-readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Truncate URL to a specified length
 * @param {string} url - The URL to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} The truncated URL
 */
export const truncateUrl = (url, maxLength = 40) => {
  if (!url) return '';
  if (url.length <= maxLength) return url;
  
  return url.substring(0, maxLength) + '...';
}; 