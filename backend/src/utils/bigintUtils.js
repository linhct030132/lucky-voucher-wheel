/**
 * Utility functions to handle BigInt serialization issues
 */

/**
 * Recursively converts BigInt values to numbers in an object or array
 * @param {any} obj - The object to process
 * @returns {any} The processed object with BigInt values converted to numbers
 */
function convertBigIntToNumber(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return Number(obj);
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }

  if (typeof obj === "object") {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }

  return obj;
}

/**
 * Safely processes database query results to handle BigInt values
 * @param {any} result - The database query result
 * @returns {any} The processed result with BigInt values converted
 */
function processDatabaseResult(result) {
  return convertBigIntToNumber(result);
}

/**
 * Custom JSON stringify that handles BigInt values
 * @param {any} obj - The object to stringify
 * @returns {string} JSON string
 */
function safeStringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "bigint") {
      return Number(value);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
}

module.exports = {
  convertBigIntToNumber,
  processDatabaseResult,
  safeStringify,
};
