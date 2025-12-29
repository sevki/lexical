/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {LoroDoc} from 'loro-crdt';
import {describe, expect, it} from 'vitest';

describe('Loro API Test', () => {
  it('doc.getText should return a valid LoroText object', () => {
    const doc = new LoroDoc();
    const text = doc.getText('root');
    
    expect(text).toBeDefined();
    expect(text).not.toBeNull();
    expect(typeof text.insert).toBe('function');
    expect(typeof text.delete).toBe('function');
  });

  it('should be able to insert and read text', () => {
    const doc = new LoroDoc();
    const text = doc.getText('root');
    
    text.insert(0, 'Hello World');
    expect(text.toString()).toBe('Hello World');
  });

  it('should export JSON updates after text insertion', () => {
    const doc = new LoroDoc();
    const text = doc.getText('root');
    
    text.insert(0, 'Test');
    
    const exported = doc.exportJsonUpdates();
    expect(exported).toBeDefined();
    expect(Array.isArray(exported)).toBe(true);
  });
});
