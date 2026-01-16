const Holidays = require('date-holidays');

/**
 * Holiday detection utilities
 */

let holidaysCache = null;

/**
 * Get holidays instance for country
 */
function getHolidaysInstance(country = 'US', state = null) {
  const cacheKey = `${country}-${state || 'default'}`;
  
  if (!holidaysCache) {
    holidaysCache = new Map();
  }

  if (!holidaysCache.has(cacheKey)) {
    const hd = new Holidays(country, state);
    holidaysCache.set(cacheKey, hd);
  }

  return holidaysCache.get(cacheKey);
}

/**
 * Check if date is a holiday
 */
function isHoliday(date, options = {}) {
  const {
    country = 'US',
    state = null,
    customHolidays = [],
  } = options;

  // Check custom holidays first
  const dateStr = date.toISOString().split('T')[0];
  if (customHolidays.some(h => {
    const holidayDate = typeof h === 'string' ? new Date(h) : h;
    return holidayDate.toISOString().split('T')[0] === dateStr;
  })) {
    return true;
  }

  // Check country holidays
  try {
    const hd = getHolidaysInstance(country, state);
    const holiday = hd.isHoliday(date);
    return holiday !== false;
  } catch (error) {
    // If country not found, return false
    return false;
  }
}

/**
 * Get holidays for date range
 */
function getHolidaysInRange(startDate, endDate, options = {}) {
  const {
    country = 'US',
    state = null,
    customHolidays = [],
  } = options;

  const holidays = [];

  // Add custom holidays
  customHolidays.forEach(holiday => {
    const date = typeof holiday === 'string' ? new Date(holiday) : holiday;
    if (date >= startDate && date <= endDate) {
      holidays.push({
        date,
        name: typeof holiday === 'object' && holiday.name ? holiday.name : 'Custom Holiday',
        type: 'custom',
      });
    }
  });

  // Get country holidays
  try {
    const hd = getHolidaysInstance(country, state);
    const countryHolidays = hd.getHolidays(startDate.getFullYear());
    
    countryHolidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      if (holidayDate >= startDate && holidayDate <= endDate) {
        holidays.push({
          date: holidayDate,
          name: holiday.name,
          type: holiday.type || 'public',
        });
      }
    });
  } catch (error) {
    // If country not found, skip
  }

  return holidays.sort((a, b) => a.date - b.date);
}

/**
 * Filter dates to exclude holidays
 */
function excludeHolidays(dates, options = {}) {
  return dates.filter(date => !isHoliday(date, options));
}

module.exports = {
  isHoliday,
  getHolidaysInRange,
  excludeHolidays,
  getHolidaysInstance,
};

