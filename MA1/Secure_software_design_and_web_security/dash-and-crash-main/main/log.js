import fetch from "node-fetch";
import crypto from "crypto";
import dotenv from "dotenv"; // Use import instead of require

dotenv.config(); // Load environment variables

// Log levels
/**
 * @typedef {"info" | "warn" | "error"} LogLevel
 */

// Sequence number
let sequenceNumber = 0;

// Function to sign the log entry
function logEntryHMAC(entry, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(entry));
  return hmac.digest("hex");
}

// Function to initialize the sequence number
async function initializeSequenceNumber() {
  const logServer = process.env.LOG_SERVER;
  try {
    const response = await fetch(`${logServer}/current-sequence-number`);
    const data = await response.json();
    sequenceNumber = data.currentSequenceNumber;
  } catch (err) {
    console.error("Failed to retrieve current sequence number:", err);
  }
}

// Initialize the sequence number when the module is loaded
await initializeSequenceNumber();

// Log function
/**
 * @param {LogLevel} level
 * @param {string} message
 * @param {Record<string, any>} [additionalData={}]
 */
export async function log(level, message, additionalData = {}) {
  const logServer = process.env.LOG_SERVER;
  const secret = process.env.LOG_SECRET;
  if (!logServer || !secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("LOG_SERVER or LOG_SECRET environment variable is not set.");
    }
    return;
  }

  // if (process.env.NODE_ENV === "development") {
  console.log(message, additionalData);
  // }

  try {
    const safeData = stripSensitiveData(additionalData);
    const logEntry = {
      sequenceNumber: sequenceNumber + 1,
      log: JSON.stringify({
        level,
        message,
        additionalData: safeData,
        timestamp: new Date().toISOString(),
      }),
    };

    // Sign the log entry
    logEntry.mainServerHMAC = logEntryHMAC(logEntry, secret);

    // Increment the sequence number immediately after sending the request
    sequenceNumber++;

    await fetch(`${logServer}/log/${level}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logEntry),
    })
      .then((data) => {
        if (data.status !== "logged") {
          initializeSequenceNumber();
        }
      })
      .catch((err) => {
        console.error(`[DEBUG] Failed to send log to server:`, err);
      });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to send log to server:", err);
    }
  }
}

// Strip sensitive data
/**
 * @param {Record<string, any>} obj
 * @returns {Record<string, any>}
 */
function stripSensitiveData(obj) {
  const SENSITIVE_KEYS = ["password", "creditCardNumber", "ssn", "token"];

  /**
   * @param {any} o
   */
  function sanitize(o) {
    if (o && typeof o === "object") {
      for (const key in o) {
        if (SENSITIVE_KEYS.includes(key)) {
          o[key] = "***REDACTED***";
        } else {
          sanitize(o[key]);
        }
      }
    }
  }

  const sanitized = JSON.parse(JSON.stringify(obj)); // Deep clone to avoid mutating the original
  sanitize(sanitized);
  return sanitized;
}
