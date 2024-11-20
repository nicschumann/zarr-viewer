const timeUnitToMs = {
    seconds: BigInt(1000),
    minutes: BigInt(60 * 1000),
    hours: BigInt(60 * 60 * 1000),
    days: BigInt(24 * 60 * 60 * 1000)
  } as const;

export const date2num = (dates: Date[], unitsSince: string): BigInt64Array => {
    // Regular expression to extract the unit and the base date
    const match = unitsSince.match(/(\w+)\s+since\s+(.+)/i);
    if (!match) {
      throw new Error("Invalid units format. Expected 'units since base_date'.");
    }

    const timeUnit = match[1].toLowerCase() as keyof typeof timeUnitToMs; // e.g., "minutes"
    const baseDateStr = match[2]; // e.g., "2015-01-01 08:00:00"

    // Validate and parse the base date
    const baseDate = new Date(baseDateStr);
    if (isNaN(baseDate.getTime())) {
      throw new Error("Invalid base date format.");
    }

    // Ensure the time unit is supported
    const timeUnitMs = timeUnitToMs[timeUnit];
    if (!timeUnitMs) {
      throw new Error("Unsupported time unit. Use seconds, minutes, hours, or days.");
    }

    // Calculate the BigInt time offset for each date
    return BigInt64Array.from(
      dates.map((date) => {
        const diffMs = BigInt(date.getTime() - baseDate.getTime()); // Get the difference in milliseconds as BigInt
        return diffMs / timeUnitMs; // Convert the difference to the appropriate time unit
      })
    );
  };


  export const num2date = (timeOffsets: BigInt64Array, unitsSince: string): Date[] => {
    // Regular expression to extract the unit and the base date
    const match = unitsSince.match(/(\w+)\s+since\s+(.+)/i);
    if (!match) {
      throw new Error("Invalid units format. Expected 'units since base_date'.");
    }

    const timeUnit = match[1].toLowerCase() as keyof typeof timeUnitToMs; // Ensure timeUnit is a key of timeUnitToMs
    const baseDateStr = match[2];

    // Validate the base date
    const baseDate = new Date(baseDateStr);
    if (isNaN(baseDate.getTime())) {
      throw new Error("Invalid base date format.");
    }

    // Ensure the time unit is supported
    const timeUnitMs = timeUnitToMs[timeUnit];
    if (!timeUnitMs) {
      throw new Error("Unsupported time unit. Use seconds, minutes, hours, or days.");
    }

    // Convert each time offset to a Date object
    return Array.from(timeOffsets).map((timeOffset) => {
      const timeOffsetInMs = timeOffset * timeUnitMs; // Use BigInt for the time calculation
      return new Date(baseDate.getTime() + Number(timeOffsetInMs)); // Convert BigInt to number safely
    });
  };
