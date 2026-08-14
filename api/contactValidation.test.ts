import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_CONTACT_MESSAGE_LENGTH, validateContactPayload } from './contactValidation.ts';

describe('contact payload validation', () => {
  it('accepts and trims a supported message', () => {
    assert.deepEqual(validateContactPayload({ type: 'Message', message: '  Bonjour  ' }), {
      type: 'Message',
      message: 'Bonjour',
    });
  });

  it('rejects unsupported categories and empty messages', () => {
    assert.equal(validateContactPayload({ type: 'Admin', message: 'test' }), null);
    assert.equal(validateContactPayload({ type: 'Message', message: '   ' }), null);
  });

  it('rejects oversized messages', () => {
    assert.equal(
      validateContactPayload({ type: 'Signalement de bug', message: 'x'.repeat(MAX_CONTACT_MESSAGE_LENGTH + 1) }),
      null,
    );
  });
});
