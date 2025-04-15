import emailValidator from '../main/app/utils/input_validation/emailValidation.js';

// Regular expression for email validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// List of valid email addresses
const validEmails = [
  "email@example.com",
  "firstname.lastname@example.com",
  "email@subdomain.example.com",
  "firstname+lastname@example.com",
  "email@123.123.123.123",
  "email@[123.123.123.123]",
  "\"email\"@example.com",
  "1234567890@example.com",
  "email@example-one.com",
  "_______@example.com",
  "email@example.name",
  "email@example.museum",
  "email@example.co.jp",
  "firstname-lastname@example.com",
  "much.\"more\\ unusual\"@example.com",
  "very.unusual.\"@\".unusual.com@example.com",
  "very.\"(),:;<>[]\".VERY.\"very@\\\\ \"very\".unusual@strange.example.com"
];

// List of invalid email addresses
const invalidEmails = [
  "plainaddress",
  "#@%^%#$@#$@#.com",
  "@example.com",
  "Joe Smith <email@example.com>",
  "email.example.com",
  "email@example@example.com",
  ".email@example.com",
  "email.@example.com",
  "email..email@example.com",
  "あいうえお@example.com",
  "email@example.com (Joe Smith)",
  "email@example",
  "email@-example.com",
  "email@example.web",
  "email@111.222.333.44444",
  "email@example..com",
  "Abc..123@example.com",
  "\"(),:;<>[\\]@example.com",
  "just\"not\"right@example.com",
  "this\\ is\"really\"not\\allowed@example.com"
];

// Function to test emails using PEG.js validator
function testEmailsWithPegjs(emails, isValid) {
  console.log(`Testing ${isValid ? "valid" : "invalid"} emails with GRAMMAR-BASED validator:`);
  emails.forEach(email => {
    try {
      emailValidator.parse(email);
      console.log(`✔️  ${email} is valid`);
    } catch (error) {
      console.log(`❌  ${email} is invalid: ${error.message}`);
    }
  });
}

// Function to test emails using regular expression
function testEmailsWithRegex(emails, isValid) {
  console.log(`\nTesting ${isValid ? "valid" : "invalid"} emails with REGEX:`);
  emails.forEach(email => {
    if (emailRegex.test(email)) {
      console.log(`✔️  ${email} is valid`);
    } else {
      console.log(`❌  ${email} is invalid`);
    }
  });
}

// Run the tests
testEmailsWithPegjs(validEmails, true);
testEmailsWithPegjs(invalidEmails, false);
testEmailsWithRegex(validEmails, true);
testEmailsWithRegex(invalidEmails, false);