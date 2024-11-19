// sum.test.js
import { expect, test } from 'vitest';
import { num2date, date2num } from './cf-time';

test('num2date', () => {
    // Example usage:
    let unitsSince = "minutes since 2015-01-01 08:00:00";
    const input = new BigInt64Array([0, 5, 10, 50].map(BigInt));
    let result = num2date(input, unitsSince);
    const expected = [
        new Date("2015-01-01T16:00:00.000Z"),
        new Date("2015-01-01T16:05:00.000Z"),
        new Date("2015-01-01T16:10:00.000Z"),
        new Date("2015-01-01T16:50:00.000Z")
    ]
    expect(result).toEqual(expected);
  });

  test('date2num', () => {
    // Example usage:
    let unitsSince = "minutes since 2015-01-01 08:00:00";
    const dates = [
        new Date("2015-01-01T16:00:00.000Z"),
        new Date("2015-01-01T16:05:00.000Z"),
        new Date("2015-01-01T16:10:00.000Z"),
        new Date("2015-01-01T16:50:00.000Z")
    ]

    let result = date2num(dates, unitsSince);
    const expected = new BigInt64Array([0, 5, 10, 50].map(BigInt));
    expect(result).toEqual(expected);
  });
