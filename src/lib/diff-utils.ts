import * as Diff from 'diff';

/**
 * Generates HTML showing differences between two texts
 * @param oldText The original text
 * @param newText The edited text
 * @returns HTML string with differences highlighted
 */
export function getDiffHTML(oldText: string, newText: string): string {
  // Generate diff
  const diffArray = Diff.diffWords(oldText, newText);
  
  // Convert to HTML
  return diffArray
    .map(part => {
      // Added text (green)
      if (part.added) {
        return `<span style="background-color: #e6ffec; color: #24292f; text-decoration: none;">${part.value}</span>`;
      }
      // Removed text (red)
      if (part.removed) {
        return `<span style="background-color: #ffebe9; color: #24292f; text-decoration: line-through;">${part.value}</span>`;
      }
      // Unchanged text
      return `<span style="color: #24292f;">${part.value}</span>`;
    })
    .join('');
}

/**
 * Returns a plain text representation of the differences
 * @param oldText The original text
 * @param newText The edited text
 * @returns Plain text showing differences with +/- markers
 */
export function getDiffText(oldText: string, newText: string): string {
  const diffArray = Diff.diffLines(oldText, newText);
  
  return diffArray
    .map(part => {
      if (part.added) {
        return part.value.split('\n')
          .filter(line => line.trim() !== '')
          .map(line => `+ ${line}`)
          .join('\n');
      }
      if (part.removed) {
        return part.value.split('\n')
          .filter(line => line.trim() !== '')
          .map(line => `- ${line}`)
          .join('\n');
      }
      return part.value;
    })
    .join('');
} 