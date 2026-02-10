// Buffer polyfill for browser environment
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

export { Buffer };
