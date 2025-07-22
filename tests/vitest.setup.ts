import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock Tauri API for tests
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((cmd: string, args?: any) => {
    // Mock responses for different commands
    switch (cmd) {
      case 'get_version':
        return Promise.resolve('0.1.12');
      case 'get_config':
        return Promise.resolve({ claudePath: null });
      case 'get_all_prps':
        return Promise.resolve([]);
      case 'get_all_templates':
        return Promise.resolve([]);
      default:
        return Promise.resolve(null);
    }
  })
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {}))
}));

vi.mock('@tauri-apps/api/app', () => ({
  getVersion: vi.fn(() => Promise.resolve('0.1.12'))
}));

vi.mock('@tauri-apps/plugin-os', () => ({
  platform: vi.fn(() => Promise.resolve('darwin'))
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(() => Promise.resolve(null))
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn(() => Promise.resolve())
}));

// Set up global test utilities
global.testUtils = {
  createMockPRP: (overrides = {}) => ({
    id: 1,
    title: 'Test PRP',
    content: 'Test content',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),
  
  createMockTemplate: (overrides = {}) => ({
    id: 1,
    title: 'Test Template',
    content: 'Template content',
    category: 'general',
    tags: [],
    isPRPTemplate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  })
};

// Suppress console errors during tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});