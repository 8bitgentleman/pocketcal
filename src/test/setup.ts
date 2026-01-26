/**
 * Test setup file for Vitest
 * Configures testing environment and global mocks
 */

import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock window.location for URL tests
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://unispace-pto-calendar.netlify.app',
    pathname: '/',
    hostname: 'unispace-pto-calendar.netlify.app',
    hash: ''
  },
  writable: true
})

// Mock navigator.userAgent
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Environment)'
  },
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock fetch for license validation tests
globalThis.fetch = vi.fn()

// Setup global console spy to catch warnings/errors in tests
console.warn = vi.fn()
console.error = vi.fn()

// Restore original console methods after tests
afterEach(() => {
  vi.clearAllMocks()
})