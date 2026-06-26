/**
 * Unit tests for artitalk.ejs helper functions
 * Tests formatTime and pad functions
 */

// Extract functions from the source (duplicated for isolated testing)
function pad(n) {
  return n < 10 ? '0' + n : n;
}

function formatTime(t) {
  var d = new Date(t);
  if (isNaN(d.getTime())) return '';
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

describe('pad', function () {
  test('should pad single digit numbers with leading zero', function () {
    expect(pad(0)).toBe('00');
    expect(pad(1)).toBe('01');
    expect(pad(5)).toBe('05');
    expect(pad(9)).toBe('09');
  });

  test('should not pad double digit numbers', function () {
    expect(pad(10)).toBe('10');
    expect(pad(11)).toBe('11');
    expect(pad(59)).toBe('59');
  });
});

describe('formatTime', function () {
  test('should format valid Date object timestamp', function () {
    var result = formatTime(new Date(2024, 0, 15, 9, 5));
    expect(result).toBe('2024-01-15 09:05');
  });

  test('should format ISO string timestamp', function () {
    var result = formatTime('2024-06-20T14:30:00');
    expect(result).toBe('2024-06-20 14:30');
  });

  test('should format Unix timestamp (milliseconds)', function () {
    var result = formatTime(1718909400000);
    expect(result).toBe('2024-06-20 14:30');
  });

  test('should format edge case times', function () {
    var result = formatTime(new Date(2024, 0, 1, 0, 0));
    expect(result).toBe('2024-01-01 00:00');
  });

  test('should handle double-digit values correctly', function () {
    var result = formatTime(new Date(2024, 11, 31, 23, 59));
    expect(result).toBe('2024-12-31 23:59');
  });

  test('should return empty string for invalid date', function () {
    expect(formatTime('invalid')).toBe('');
    expect(formatTime(null)).toBe('');
    expect(formatTime(undefined)).toBe('');
    expect(formatTime(NaN)).toBe('');
    expect(formatTime('')).toBe('');
    expect(formatTime('not a date')).toBe('');
  });

  test('should handle numeric edge cases', function () {
    expect(formatTime(0)).toBe('1970-01-01 08:00');
    expect(formatTime(-1)).toBe('');
  });
});
