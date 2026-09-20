const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

const DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", DATE_OPTS);
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-GB", DATETIME_OPTS);
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-GB", TIME_OPTS);
}
