/**
 * Truncates text to a specified length and adds ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum number of characters
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};