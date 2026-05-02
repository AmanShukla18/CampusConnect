export const formatRelativeTime = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

export const formatSessionTime = (dateInput: string | Date, durationMin = 60): string => {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const startStr = formatter.format(date);
  
  const endDate = new Date(date.getTime() + durationMin * 60000);
  const endStr = formatter.format(endDate);
  
  return `${startStr} - ${endStr}`;
};

export const formatPollExpiry = (expiresAt: string | Date): string => {
  const date = new Date(expiresAt);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `Ends in ${days} day${days > 1 ? 's' : ''}`;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `Ends in ${hours} hour${hours > 1 ? 's' : ''}`;
};

export const formatFullDate = (dateInput: string | Date): string => {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

export const isDatePast = (dateInput: string | Date): boolean => {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return true;
  return date.getTime() < new Date().getTime();
};

export const isDateToday = (dateInput: string | Date): boolean => {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};
