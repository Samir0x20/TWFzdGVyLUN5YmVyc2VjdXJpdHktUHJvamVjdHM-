{
  // Helper Functions
  function isSequential(str) {
    for (let i = 0; i < str.length - 2; i++) {
      // Check ascending sequence
      if (
        str.charCodeAt(i) + 1 === str.charCodeAt(i + 1) &&
        str.charCodeAt(i + 1) + 1 === str.charCodeAt(i + 2)
      ) {
        return true;
      }
      // Check descending sequence
      if (
        str.charCodeAt(i) - 1 === str.charCodeAt(i + 1) &&
        str.charCodeAt(i + 1) - 1 === str.charCodeAt(i + 2)
      ) {
        return true;
      }
    }
    return false; // No sequences
  }

  function isRepeating(str) {
    return /(.)\1{2,}/.test(str); // Matches three or more consecutive repeating characters
  }
}

Password
  = password:$(Characters) {
      // Ensure the password meets all requirements
      if (password.length < 8 || password.length > 64) {
        throw new Error("Password must be between 8 and 64 characters");
      }
      if (!/[A-Z]/.test(password)) {
        throw new Error("Password must contain at least one uppercase letter");
      }
      if (!/[a-z]/.test(password)) {
        throw new Error("Password must contain at least one lowercase letter");
      }
      if (!/[0-9]/.test(password)) {
        throw new Error("Password must contain at least one digit");
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new Error("Password must contain at least one special character");
      }
      if (isSequential(password)) {
        throw new Error("Password must not contain sequential characters");
      }
      if (isRepeating(password)) {
        throw new Error("Password must not contain repeating characters");
      }
      return password; // Return the validated password
    }

Characters
  = (![ \t\n\r] .)+ // Match all non-space characters, at least one
