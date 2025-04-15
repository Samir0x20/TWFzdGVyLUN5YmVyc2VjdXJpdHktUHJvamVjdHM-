require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const fs = require("fs");
const nodemailer = require("nodemailer");
const winston = require("winston");
const crypto = require("crypto");
const sanitizeHtml = require("sanitize-html");
const xss = require("xss");

const sanitizeInputAndLog = (input, logger, metadata = {}) => {
  const suspiciousPatterns = [
    /<script.*?>.*?<\/script>/gi, // Detect script tags
    /<.*?on\w+=".*?".*?>/gi, // Detect HTML tags with inline event handlers
    /['";$`\\]/gi, // Detect suspicious characters for injections
    /(union\s+select|drop\s+table|--)/gi, // Detect SQL injection keywords
  ];

  const sanitizeString = (str) => {
    if (typeof str !== "string") return str;

    // Apply both sanitizers: We use double sanitization here against html tags and xss
    let sanitized = xss(
      sanitizeHtml(str, {
        allowedTags: [], // Remove all HTML tags
        allowedAttributes: {}, // Remove all attributes
      })
    );

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(str)) {
        logger.warn("Suspicious input detected", {
          input: str,
          sanitized,
          ...metadata,
        });
        sanitized = sanitized.replace(pattern, "[REMOVED]");
      }
    }

    return sanitized;
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;

    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = sanitizeInputAndLog(obj[key], logger, metadata);
    }
    return sanitized;
  };

  if (typeof input === "string") {
    return sanitizeString(input);
  }

  if (typeof input === "object") {
    return sanitizeObject(input);
  }

  return input;
};

const app = express();
app.use(bodyParser.json());

// Ensure the logs folder exists
const logsDir = "./logs";
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logFileName = `${logsDir}/${new Date().toISOString().slice(0, 10)}.log`;

// Set up Winston logger
const transports = [
  new winston.transports.File({
    filename: logFileName,
    level: "info",
  }),
];

if (process.env.NODE_ENV === "development") {
  transports.push(
    new winston.transports.Console({
      level: "debug",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
});

// API Key Management
const API_KEYS_FILE = "./api-keys.json";

// Function to generate random API key
const generateApiKey = () => {
  return crypto.randomBytes(64).toString("hex");
};

// Initialize API keys structure
const initializeApiKeys = () => {
  try {
    if (!fs.existsSync(API_KEYS_FILE)) {
      const apiKeys = Array.from({ length: 10 }, (_, index) => ({
        key: generateApiKey(),
        label: `api_key_${index + 1}`,
      }));
      fs.writeFileSync(API_KEYS_FILE, JSON.stringify(apiKeys, null, 2));
      logger.info("Generated new API keys");
      return apiKeys;
    }
    const existingKeys = JSON.parse(fs.readFileSync(API_KEYS_FILE, "utf8"));
    logger.info("Loaded existing API keys");
    return existingKeys;
  } catch (error) {
    logger.error("Failed to initialize API keys", { error: error.message });
    process.exit(1);
  }
};

// Initialize API keys at startup
const apiKeys = initializeApiKeys();

// Function to get real IP address from nginx proxy
const getClientIp = (req) => {
  return (
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection.remoteAddress
  );
};

// Middleware to verify API key
const verifyApiKey = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const clientIp = getClientIp(req);
    const timestamp = new Date().toISOString();

    if (!authHeader) {
      logger.warn("Request received without API key", {
        clientIp,
        timestamp,
      });
      return res.status(401).json({ error: "API key required" });
    }

    const apiKey = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const keyDetails = apiKeys.find((k) => k.key === apiKey);

    if (!keyDetails) {
      logger.warn("Invalid API key attempted", {
        clientIp,
        timestamp,
        attemptedKey: apiKey.substring(0, 10) + "...",
      });
      return res.status(403).json({ error: "Invalid API key" });
    }

    // Log successful API key usage
    logger.info("API key used", {
      label: keyDetails.label,
      clientIp,
      timestamp,
    });

    // Add key details to request
    req.apiKeyDetails = {
      label: keyDetails.label,
      clientIp,
    };

    next();
  } catch (error) {
    logger.error("Error in API key verification", { error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Mail transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.NO_REPLY_SMTP_SERVER,
  port: parseInt(process.env.NO_REPLY_PORT, 10) || 465,
  secure: true,
  auth: {
    user: process.env.NO_REPLY_EMAIL_USER,
    pass: process.env.NO_REPLY_EMAIL_PASS,
  },
});

const applyPlaceholders = (template, replacements) => {
  for (const [key, value] of Object.entries(replacements)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const placeholderRegex = new RegExp(`\\[\\$${escapedKey}\\]`, "g");
    template = template.replace(placeholderRegex, value);
  }
  return template;
};

app.post("/send-email", verifyApiKey, async (req, res) => {
  const { email, subject, dynamicKeys } = req.body;
  const { label: apiKeyLabel, clientIp } = req.apiKeyDetails;
  const timestamp = new Date().toISOString();

  try {
    logger.info("Received /send-email request", {
      email,
      subject,
      apiKey: {
        label: apiKeyLabel,
        timestamp,
      },
      clientIp,
    });

    if (!email || !subject || !dynamicKeys) {
      logger.warn("Missing required fields in email request.", {
        email,
        subject,
        apiKeyLabel,
        clientIp,
        timestamp,
      });
      return res.status(400).json({
        error: "Missing required fields: email, subject, or dynamicKeys",
      });
    }

    const templatePath = "./mail_template.html";
    if (!fs.existsSync(templatePath)) {
      logger.error("Email template not found at path.", {
        templatePath,
        apiKeyLabel,
        clientIp,
        timestamp,
      });
      return res.status(500).json({ error: "Email template not found." });
    }

    const sanitizedEmail = sanitizeInputAndLog(email, logger, {
      clientIp,
      timestamp,
    });
    const sanitizedSubject = sanitizeInputAndLog(subject, logger, {
      clientIp,
      timestamp,
    });
    const sanitizedDynamicKeys = sanitizeInputAndLog(dynamicKeys, logger, {
      clientIp,
      timestamp,
    });

    let template = fs.readFileSync(templatePath, "utf8");
    const html = applyPlaceholders(template, sanitizedDynamicKeys);

    const mailOptions = {
      from: process.env.NO_REPLY_EMAIL_USER,
      to: sanitizedEmail,
      subject: sanitizedSubject,
      html,
      attachments: [
        {
          cid: "email-logo.png",
          filename: "email-logo.png",
          path: "./email-logo.png",
          contentType: "image/png",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    logger.info(`Email sent successfully to ${email}`, {
      subject,
      apiKeyLabel,
      clientIp,
      timestamp,
    });

    return res.json({ status: "Email sent successfully" });
  } catch (error) {
    logger.error("Error sending email", {
      error: error.message,
      apiKeyLabel,
      clientIp,
      timestamp,
    });
    return res.status(500).json({ error: "Failed to send email" });
  }
});

const PORT = process.env.PORT || 8443;

// mTLS handled by nginx now
app.listen(PORT, async () => {
  logger.info(`Mail server running on http://localhost:${PORT}`);
});
