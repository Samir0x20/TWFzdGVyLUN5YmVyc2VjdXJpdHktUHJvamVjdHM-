import passwordValidation from '../main/app/utils/input_validation/passwordValidation.js';

// Example passwords to test
const testPasswords = [
  'P@ssw0rd123',      // Should fail
  '123456',           // Should fail (too short, common password)
  'aaaaaa',           // Should fail (repeating characters)
  'abcdef',           // Should fail (sequential characters)
  'password123',      // Should fail (common password)
  'Valid#2023Pass',   // Should pass
  'Short1!',          // Should fail (too short)
  'NoSpecialChar123', // Should fail (no special character)
  'NoNumber!',        // Should fail (no number)
  'NoUppercase1!',    // Should fail (no uppercase letter)
  'NOLOWERCASE1!',    // Should fail (no lowercase letter)
  'ValidPassword#1',  // Should pass
  'Another$Valid1',   // Should pass
  'Repetitive1111!',  // Should fail (repeating characters)
  'Sequential1234!',  // Should fail (sequential characters)
];

testPasswords.forEach(password => {
  try {
    passwordValidation.parse(password);
    console.log(`✔️ Password "${password}" is correct.`);
  } catch (e) {
    console.log(`❌ Password "${password}" is incorrect: ${e.message}`);
  }
});