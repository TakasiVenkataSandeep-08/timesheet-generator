const {
  parseDateRange,
  formatDate,
  formatTime,
  isWeekend,
  isWorkHour,
  minutesBetween,
} = require('../../../src/utils/dateUtils');

describe('dateUtils', () => {
  describe('parseDateRange', () => {
    it('should parse last-week range', () => {
      const result = parseDateRange('last-week');
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
      expect(result.start.getTime()).toBeLessThan(result.end.getTime());
    });

    it('should parse this-week range', () => {
      const result = parseDateRange('this-week');
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
    });

    it('should parse last-month range', () => {
      const result = parseDateRange('last-month');
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
    });

    it('should parse this-month range', () => {
      const result = parseDateRange('this-month');
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
    });

    it('should parse date range with "to" separator', () => {
      const result = parseDateRange('2024-01-01 to 2024-01-31');
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
      expect(result.start.getFullYear()).toBe(2024);
      expect(result.end.getFullYear()).toBe(2024);
    });

    it('should parse date range with "-" separator', () => {
      const result = parseDateRange('2024-01-01-2024-01-31');
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
    });

    it('should throw error for invalid range', () => {
      expect(() => parseDateRange('invalid-range')).toThrow();
    });
  });

  describe('formatDate', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-01-15');
    });

    it('should handle date strings', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toBe('2024-01-15');
    });

    it('should return null for invalid date', () => {
      const result = formatDate('invalid');
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = formatDate(null);
      expect(result).toBeNull();
    });
  });

  describe('formatTime', () => {
    it('should format time to HH:mm', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = formatTime(date);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should pad hours and minutes', () => {
      const date = new Date('2024-01-15T09:05:00Z');
      const result = formatTime(date);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should return default for invalid date', () => {
      const result = formatTime('invalid');
      expect(result).toBe('00:00');
    });
  });

  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date('2024-01-06T10:00:00Z'); // Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    it('should return true for Sunday', () => {
      const sunday = new Date('2024-01-07T10:00:00Z'); // Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    it('should return false for Monday', () => {
      const monday = new Date('2024-01-01T10:00:00Z'); // Monday
      expect(isWeekend(monday)).toBe(false);
    });

    it('should return false for Friday', () => {
      const friday = new Date('2024-01-05T10:00:00Z'); // Friday
      expect(isWeekend(friday)).toBe(false);
    });
  });

  describe('isWorkHour', () => {
    it('should return true for time within work hours', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const config = { workHours: { start: '09:00', end: '17:00' } };
      expect(isWorkHour(date, config)).toBe(true);
    });

    it('should return false for time before work hours', () => {
      const date = new Date('2024-01-01T08:00:00Z');
      const config = { workHours: { start: '09:00', end: '17:00' } };
      expect(isWorkHour(date, config)).toBe(false);
    });

    it('should return false for time after work hours', () => {
      const date = new Date('2024-01-01T18:00:00Z');
      const config = { workHours: { start: '09:00', end: '17:00' } };
      expect(isWorkHour(date, config)).toBe(false);
    });

    it('should use default work hours if not configured', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      expect(isWorkHour(date, {})).toBe(true);
    });
  });

  describe('minutesBetween', () => {
    it('should calculate minutes between two dates', () => {
      const date1 = new Date('2024-01-01T09:00:00Z');
      const date2 = new Date('2024-01-01T10:00:00Z');
      const result = minutesBetween(date1, date2);
      expect(result).toBe(60);
    });

    it('should return absolute value', () => {
      const date1 = new Date('2024-01-01T10:00:00Z');
      const date2 = new Date('2024-01-01T09:00:00Z');
      const result = minutesBetween(date1, date2);
      expect(result).toBe(60);
    });

    it('should handle fractional minutes', () => {
      const date1 = new Date('2024-01-01T09:00:00Z');
      const date2 = new Date('2024-01-01T09:00:30Z');
      const result = minutesBetween(date1, date2);
      expect(result).toBe(0.5);
    });
  });
});

