import validator from 'validator';

/**
 * Generates a random string of the specified length
 * 
 * @param length - The length of the random string to generate
 * @returns {string} The generated random string
 */

export function generateRandomString(length: number): string {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function sanitize(input: string): string {
    return validator.blacklist(input, `';"\\*<>&#%|\\0`);
}
