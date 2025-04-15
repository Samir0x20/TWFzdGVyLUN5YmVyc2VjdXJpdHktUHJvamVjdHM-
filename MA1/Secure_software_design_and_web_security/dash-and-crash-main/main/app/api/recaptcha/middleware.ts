import fetch from "node-fetch";

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export async function verifyRecaptcha(token: string) {
  if (!token) {
    throw new Error("No token provided");
  }

  const response = await fetch(
    'https://www.google.com/recaptcha/api/siteverify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    }
  );

  const data = await response.json();

  return data;
}