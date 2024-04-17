// Transform to DD-MM-YYYY format
export function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

// Transform to mongo date
export function parseDate(dateString: string): Date {
  const [day, month, year] = dateString.split('-').map(Number);
  // Create date object in UTC timezone
  return new Date(Date.UTC(year, month - 1, day));
}