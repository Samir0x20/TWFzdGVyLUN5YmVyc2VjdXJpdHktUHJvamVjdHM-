require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const winston = require("winston");
const { format } = require("winston");
const Transport = require("winston-transport");
const fs = require("fs");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class PrismaTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.prisma = opts.prisma;
  }

  async log(info, callback) {
    try {
      await this.prisma.log.create({
        data: {
          level: info.level,
          message: info.message,
        },
      });
      this.emit("logged", info);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// Function to verify the log entry signature
function verifyHMAC(entry, secret) {
  const { mainServerHMAC, ...logEntry } = entry;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(logEntry));
  return hmac.digest("hex") === mainServerHMAC;
}

// Function to hash a log entry using HMAC
function computeHMAC(entry, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(entry));
  return hmac.digest("hex");
}

// Function to verify if the previousHMAC is correct
async function verifyPreviousHMAC(currentLogEntry) {
  const previousLog = await prisma.log.findFirst({
    where: { sequenceNumber: currentLogEntry.sequenceNumber - 1 },
    orderBy: { sequenceNumber: "desc" },
  });

  if (!previousLog) {
    return false;
  }

  const recomputedBlockHMAC = computeHMAC(
    {
      sequenceNumber: previousLog.sequenceNumber,
      log: previousLog.log,
      mainServerHMAC: previousLog.mainServerHMAC,
      timestamp: previousLog.timestamp,
      previousHMAC: previousLog.previousHMAC,
    },
    process.env.LOG_SERVER_SECRET
  );

  return recomputedBlockHMAC === currentLogEntry.previousHMAC;
}

// *** Initialize Winston Logger ***
const logger = winston.createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new PrismaTransport({ prisma })],
});

// TODO: SOmehting Better
function stripSensitiveData(obj) {
  const SENSITIVE_KEYS = ["password", "creditCardNumber", "ssn", "token"];

  // Recursively traverse object and sanitize sensitive fields
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

  sanitize(obj);
  return obj;
}

// Express Setup
const app = express();
app.use(bodyParser.json());

let lastSequenceNumber = 0;
let lastLogHMAC = "0";

// Initialize lastSequenceNumber and lastLogHash from the database
async function initializeLastSequenceNumber() {
  const latestLog = await prisma.log.findFirst({
    orderBy: {
      sequenceNumber: "desc",
    },
  });
  if (latestLog !== null) {
    lastSequenceNumber = latestLog.sequenceNumber;
    lastLogHMAC = latestLog.blockHMAC;
  } else {
    lastSequenceNumber = 0;
    lastLogHMAC = "0";
  }
}

// General logging endpoint
app.post("/log/:level", async (req, res) => {
  const { sequenceNumber, log, mainServerHMAC } = req.body;
  const safeData = stripSensitiveData(log);

  const logEntry = {
    sequenceNumber,
    log: safeData,
    mainServerHMAC,
    timestamp: new Date().toISOString(),
    previousHMAC: lastLogHMAC,
  };

  // Verify the HMAC of the main server
  if (!verifyHMAC(req.body, process.env.MAIN_SERVER_SECRET)) {
    console.log("Invalid signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Verify the previousHMAC
  if (!(await verifyPreviousHMAC(logEntry)) && lastSequenceNumber !== 0) {
    console.log("Invalid previousHMAC", logEntry);
    // console.log("Invalid previousHMAC");
    return res.status(400).json({ error: "Invalid previousHMAC" });
  }

  if (sequenceNumber === lastSequenceNumber + 1) {
    try {
      logEntry.blockHMAC = computeHMAC(logEntry, process.env.LOG_SERVER_SECRET);

      const log = await prisma.log.create({
        data: logEntry,
      });

      lastSequenceNumber = sequenceNumber;
      lastLogHMAC = logEntry.blockHMAC;

      res.json({ status: "logged", log });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "error", error: "Failed to log message" });
    }
  } else {
    console.log("Invalid sequence number");
    res.status(400).json({ error: "Invalid sequence number" });
  }
});

// Endpoint to get the current sequence number
app.get("/current-sequence-number", async (req, res) => {
  try {
    const latestLog = await prisma.log.findFirst({
      orderBy: {
        sequenceNumber: "desc",
      },
    });
    const currentSequenceNumber = latestLog ? latestLog.sequenceNumber : 0;
    res.json({ currentSequenceNumber });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", error: "Failed to retrieve sequence number" });
  }
});

// alternative with separate endpoints for different log levels
app.post("/log/info", (req, res) => {
  const safeData = stripSensitiveData(req.body);
  logger.info(JSON.stringify(safeData));
  res.json({ status: "logged", level: "info" });
});

app.post("/log/warn", (req, res) => {
  const safeData = stripSensitiveData(req.body);
  logger.warn(JSON.stringify(safeData));
  res.json({ status: "logged", level: "warn" });
});

app.post("/log/error", (req, res) => {
  const safeData = stripSensitiveData(req.body);
  logger.error(JSON.stringify(safeData));
  res.json({ status: "logged", level: "error" });
});

// *** Start Server ***
const PORT = process.env.PORT || 8001;

// mTLS handled by nginx now
app.listen(PORT, async () => {
  await initializeLastSequenceNumber();
  console.log(`Log server running on http://localhost:${PORT}`);
});
