import * as bcrypt from 'bcrypt';

/**
 * Encrypts a plain text password using bcrypt.
 * @param password - The plain text password to encrypt.
 * @returns The hashed password.
 */
export async function encryptPassword(password: string): Promise<string> {
  const saltRounds = 10; // Number of salt rounds for bcrypt
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

/**
 * Compares a plain text password with a hashed password.
 * @param password - The plain text password.
 * @param hashedPassword - The hashed password to compare against.
 * @returns True if the passwords match, false otherwise.
 */
export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}