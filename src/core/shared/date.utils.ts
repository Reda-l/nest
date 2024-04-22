// Transform to DD-MM-YYYY format
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatDateTime(date: Date): string {
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}


// Transform to mongo date
export function parseDate(dateString: string): Date {
  const [day, month, year] = dateString.split('-').map(Number);
  // Create date object in UTC timezone
  return new Date(Date.UTC(year, month - 1, day));
}

export function parseDateTime(dateTimeString: string): Date {
  // Check if the date string includes 'T' and 'Z'
  if (dateTimeString.includes('T') && dateTimeString.includes('Z')) {
    // Remove the 'T' and 'Z' and split the date and time parts
    const dateTimeParts = dateTimeString.replace('T', ' ').replace('Z', '').split(' ');

    // Extract date and time components
    const [datePart, timePart] = dateTimeParts;
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    // Create date object in UTC timezone
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  } else {
    // If the date string does not include 'T' and 'Z', use the original logic
    const [datePart, timePart] = dateTimeString.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    // Create date object in UTC timezone
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  }
}



