import { homedir } from 'os';
import { join } from 'path';

let customPRPGenDir: string | undefined;

/**
 * Sets a custom PRPGen directory path. This should be called early in the
 * application lifecycle, before any services are initialized.
 */
export function setPRPGenDirectory(dir: string): void {
  customPRPGenDir = dir;
}

/**
 * Gets the PRPGen directory path. Returns the custom directory if set,
 * otherwise falls back to the environment variable PRPGEN_DIR,
 * and finally defaults to ~/.prpgen
 */
export function getPRPGenDirectory(): string {
  // 1. Check if custom directory was set programmatically
  if (customPRPGenDir) {
    return customPRPGenDir;
  }

  // 2. Check environment variable
  const envDir = process.env.PRPGEN_DIR;
  if (envDir) {
    return envDir;
  }

  // 3. Default to ~/.prpgen
  return join(homedir(), '.prpgen');
}

/**
 * Gets a subdirectory path within the PRPGen directory
 */
export function getPRPGenSubdirectory(...subPaths: string[]): string {
  return join(getPRPGenDirectory(), ...subPaths);
}

// Temporary compatibility exports - to be removed after full migration
export const getCrystalDirectory = getPRPGenDirectory;
export const setCrystalDirectory = setPRPGenDirectory;
export const getCrystalSubdirectory = getPRPGenSubdirectory;