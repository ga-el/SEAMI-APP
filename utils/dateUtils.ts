/**
 * Calculates how long ago a date was and returns a human-readable string.
 * @param date The date to compare with the current time.
 * @returns A string like "hace 5 min", "hace 2 horas", etc.
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'hace unos segundos';
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
  }

  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `hace ${months} mes${months > 1 ? 'es' : ''}`;
  }

  const years = Math.floor(diffDays / 365);
  return `hace ${years} año${years > 1 ? 's' : ''}`;
};

/**
 * Formats seconds into a human-readable duration string (e.g., "16:27", "1:05:30").
 * @param seconds The duration in seconds (can be a number or string).
 * @returns A formatted duration string.
 */
export const formatDuration = (seconds: number | string | null | undefined): string => {
  if (seconds === null || seconds === undefined || seconds === '') return '0:00';

  // If it's already a formatted string like "H:MM:SS" or "MM:SS", return it.
  if (typeof seconds === 'string' && seconds.includes(':')) return seconds;

  const totalSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (isNaN(totalSeconds)) return '0:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedMinutes = hours > 0 ? minutes.toString().padStart(2, '0') : minutes.toString();
  const paddedSeconds = secs.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${paddedMinutes}:${paddedSeconds}`;
};
