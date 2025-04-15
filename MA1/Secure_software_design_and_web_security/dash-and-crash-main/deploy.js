const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const appName = "dash-and-crash";

// Read gitlab token from file
function loadToken() {
  const tokenFilePath = path.join(__dirname, "token.txt");
  try {
    const token = fs.readFileSync(tokenFilePath, "utf8").trim();
    return token;
  } catch (error) {
    throw new Error(
      "Failed to load GitLab token. Ensure token.txt exists and is readable."
    );
  }
}

const repoUrl = `https://suyeonORG:${loadToken()}@gitlab.com/suyeonORG/dash-and-crash.git`;
const projectDir = path.join(__dirname, appName);
const cacheDir = path.join(__dirname, "npm_cache");
const pm2AppNames = {
  main: "main",
  log: "log-server",
  mail: "mail-server",
};

async function main() {
  try {
    console.log("[INFO] Starting deployment process...");

    await stopApps();
    await cacheDependencies();
    await cleanDirectories();
    await cloneRepo();
    await restoreDependencies();
    await setupEnvFiles();
    await installMailDependencies(); // Install mail dependencies first
    await copyDkimPem(); // Copy DKIM private key
    await startMailServer(); // Start mail server first
    await updateMailApiKey(); // Add this new line here
    await runPrismaMigrations();
    await installMissingDependencies();
    moveFiles(
      [
        "government.key",
        "government_root_ca.cert",
        "insurance.key",
        "insurance_root_ca.cert",
        "police.key",
        "police_root_ca.cert",
        "malicious.key",
        "malicious_root_ca.cert",
      ],
      "/home/dashandcrash/dash-and-crash/dash-and-crash/"
    );
    await overwritePackageJson();
    await buildApps();
    await startApps();
    console.log("[INFO] Deployment successful!");
  } catch (err) {
    console.error("[ERROR] Deployment failed:", err);
    process.exit(1);
  }
}

async function updateMailApiKey() {
  console.log("[INFO] Updating mail API key in main .env file...");

  // Wait for api-keys.json to be generated (max 30 seconds)
  const apiKeysPath = path.join(projectDir, "mail-server", "api-keys.json");
  let attempts = 0;
  const maxAttempts = 30;

  while (!fs.existsSync(apiKeysPath) && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;
    console.log(
      `[INFO] Waiting for api-keys.json to be generated... (${attempts}/${maxAttempts})`
    );
  }

  if (!fs.existsSync(apiKeysPath)) {
    throw new Error(
      "api-keys.json was not generated within the timeout period"
    );
  }

  // Read the API key from api-keys.json
  const apiKeys = JSON.parse(fs.readFileSync(apiKeysPath, "utf8"));
  if (!apiKeys.length || !apiKeys[0].key) {
    throw new Error("No API key found in api-keys.json");
  }
  const apiKey = apiKeys[0].key;

  // Update the main .env file
  const mainEnvPath = path.join(projectDir, "main", ".env");
  let envContent = "";

  if (fs.existsSync(mainEnvPath)) {
    envContent = fs.readFileSync(mainEnvPath, "utf8");
    // Replace existing MAIL_API_KEY if it exists
    if (envContent.includes("MAIL_API_KEY=")) {
      envContent = envContent.replace(
        /MAIL_API_KEY=.*/g,
        `MAIL_API_KEY=${apiKey}`
      );
    } else {
      // Add new line if it doesn't end with one
      if (!envContent.endsWith("\n")) {
        envContent += "\n";
      }
      envContent += `MAIL_API_KEY=${apiKey}\n`;
    }
  } else {
    envContent = `MAIL_API_KEY=${apiKey}\n`;
  }

  fs.writeFileSync(mainEnvPath, envContent);
  console.log("[INFO] Successfully updated MAIL_API_KEY in main .env file");
}

async function overwritePackageJson() {
  try {
    const packageJsonPath = path.join(projectDir, "main", "package.json");

    console.log(`[INFO] Reading package.json from ${packageJsonPath}...`);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    console.log("[INFO] Overwriting 'start:prod' script...");
    packageJson.scripts["start:prod"] = "next start -p 39846";

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      "utf8"
    );
    console.log("[INFO] Successfully updated package.json.");
  } catch (error) {
    console.error("[ERROR] Failed to overwrite package.json:", error.message);
    throw error;
  }
}

function moveFiles(filenames, destinationDir) {
  filenames.forEach((filename) => {
    const source = path.join(__dirname, filename);
    const destination = path.join(destinationDir, filename);

    try {
      if (!fs.existsSync(source)) {
        console.error(`[ERROR] File not found: ${source}`);
        return;
      }

      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
      }

      fs.copyFileSync(source, destination);
      console.log(`[INFO] Moved: ${filename} -> ${destination}`);
    } catch (error) {
      console.error(`[ERROR] Failed to move ${filename}:`, error.message);
    }
  });
}
async function stopApps() {
  console.log("[INFO] Stopping PM2 apps...");
  for (const appName of Object.values(pm2AppNames)) {
    await execCommand(`pm2 delete ${appName}`, true);
  }
}

async function cacheDependencies() {
  console.log("[INFO] Caching existing dependencies...");
  await execCommand(`mkdir -p ${cacheDir}`);
  for (const subdir of ["log-server", "main", "mail-server"]) {
    const nodeModulesPath = path.join(projectDir, subdir, "node_modules");
    const cachePath = path.join(cacheDir, subdir);
    if (fs.existsSync(nodeModulesPath)) {
      console.log(`[INFO] Caching ${nodeModulesPath} to ${cachePath}`);
      await execCommand(`rm -rf ${cachePath}`);
      await execCommand(`mv ${nodeModulesPath} ${cachePath}`);
    }
  }
}

async function cleanDirectories() {
  console.log("[INFO] Cleaning old directories...");
  await execCommand(`rm -rf ${projectDir}`);
}

async function cloneRepo() {
  console.log("[INFO] Cloning repository...");
  await execCommand(`git clone ${repoUrl} ${projectDir}`);
}

async function restoreDependencies() {
  console.log("[INFO] Restoring cached dependencies...");
  for (const subdir of ["log-server", "main", "mail-server"]) {
    const cachePath = path.join(cacheDir, subdir);
    const nodeModulesPath = path.join(projectDir, subdir, "node_modules");
    if (fs.existsSync(cachePath)) {
      console.log(`[INFO] Restoring ${cachePath} to ${nodeModulesPath}`);
      await execCommand(`mv ${cachePath} ${nodeModulesPath}`);
    }
  }
}

async function setupEnvFiles() {
  console.log("[INFO] Setting up .env files...");
  const envFiles = {
    log: path.join(__dirname, ".log.env"),
    main: path.join(__dirname, ".main.env"),
    mail: path.join(__dirname, ".mail.env"),
  };

  for (const [key, envFile] of Object.entries(envFiles)) {
    const targetDir =
      key === "main"
        ? path.join(projectDir, key)
        : path.join(projectDir, key + "-server");

    await execCommand(`cp ${envFile} ${path.join(targetDir, ".env")}`);
  }
}

async function copyDkimPem() {
  console.log("[INFO] Copying DKIM private key...");
  const sourcePath = path.join(__dirname, "dkim.pem");
  const destPath = path.join(projectDir, "mail-server", "dkim.pem");

  if (!fs.existsSync(sourcePath)) {
    throw new Error("DKIM private key not found at " + sourcePath);
  }

  await execCommand(`cp ${sourcePath} ${destPath}`);
  console.log("[INFO] DKIM private key copied successfully.");
}

async function startMailServer() {
  console.log("[INFO] Starting Mail Server...");
  await execCommand(
    `pm2 start npm --name ${pm2AppNames.mail} -- run start`,
    false,
    {
      cwd: path.join(projectDir, "mail-server"),
    }
  );
  console.log("[INFO] Mail Server started successfully.");
}

async function installMailDependencies() {
  console.log("[INFO] Installing mail dependencies...");
  for (const subdir of ["mail-server"]) {
    await execCommand(`npm install`, false, {
      cwd: path.join(projectDir, subdir),
    });
  }
}

async function installMissingDependencies() {
  console.log("[INFO] Installing missing dependencies...");
  for (const subdir of ["log-server", "main", "mail-server"]) {
    await execCommand(`npm install`, false, {
      cwd: path.join(projectDir, subdir),
    });
  }
}

async function buildApps() {
  console.log("[INFO] Building Next.js application...");
  await execCommand(`npm run build`, false, {
    cwd: path.join(projectDir, "main"),
  });
}

async function startApps() {
  console.log("[INFO] Starting PM2 apps...");

  // Start the log-server
  await execCommand(
    `pm2 start npm --name ${pm2AppNames.log} -- run start`,
    false,
    {
      cwd: path.join(projectDir, "log-server"),
    }
  );

  // Start the main-server
  await execCommand(
    `pm2 start npm --name ${pm2AppNames.main} -- run start:prod`,
    false,
    {
      cwd: path.join(projectDir, "main"),
    }
  );
}

function execCommand(command, ignoreErrors = false, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (err, stdout, stderr) => {
      console.log(`[INFO] Command [${command}] stdout:`);
      console.log(stdout);
      console.error(`[INFO] Command [${command}] stderr:`);
      console.error(stderr);

      if (err && !ignoreErrors) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function runPrismaMigrations() {
  console.log("[INFO] Running Prisma migrations...");

  for (const subdir of ["log-server", "main", "mail-server"]) {
    const projectPath = path.join(projectDir, subdir);

    try {
      if (!fs.existsSync(path.join(projectPath, "prisma/schema.prisma"))) {
        console.log(
          `[WARN] No Prisma schema found for ${subdir}, skipping migrations.`
        );
        continue;
      }

      console.log(`[INFO] Generating Prisma client for ${subdir}`);
      await execCommand(`npx prisma generate`, false, { cwd: projectPath });

      console.log(`[INFO] Applying Prisma migrations for ${subdir}`);
      const result = await execCommand(`npx prisma migrate deploy`, false, {
        cwd: projectPath,
      });
      if (result.includes("No pending migrations")) {
        console.log(`[INFO] No migrations to apply for ${subdir}.`);
      } else {
        console.log(`[INFO] Migrations applied for ${subdir}.`);
      }

      const migrationsPath = path.join(projectPath, "prisma/migrations");
      if (
        !fs.existsSync(migrationsPath) ||
        fs.readdirSync(migrationsPath).length === 0
      ) {
        console.log(
          `[INFO] No migrations directory found for ${subdir}, running 'migrate dev' to initialize.`
        );
        await execCommand(
          `npx prisma migrate dev --name init --skip-generate`,
          false,
          { cwd: projectPath }
        );
      }
    } catch (error) {
      console.error(
        `[ERROR] Failed to run Prisma migrations for ${subdir}:`,
        error
      );
      throw error;
    }
  }
}

main();
