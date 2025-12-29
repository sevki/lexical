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
    console.log('Created LoroDoc, peerIdStr:', doc.peerIdStr);
    
    const text = doc.getText('root');
    console.log('getText returned:', text);
    console.log('typeof text:', typeof text);
    console.log('text constructor:', text?.constructor?.name);
    console.log('text keys:', text ? Object.keys(text) : 'N/A');
    
    expect(text).toBeDefined();
    expect(text).not.toBeNull();
    
    // Log what methods/properties are actually available
    if (text) {
      console.log('Available methods:');
      console.log('  - insert:', typeof text.insert);
      console.log('  - delete:', typeof text.delete);
      console.log('  - length:', typeof text.length);
      console.log('  - toString:', typeof text.toString);
    }
    
    expect(typeof text.insert).toBe('function');
    expect(typeof text.delete).toBe('function');
    expect(typeof text.length).toBe('number');
    
    // Initial length should be 0
    expect(text.length).toBe(0);
  });

  it('should be able to insert and read text', () => {
    const doc = new LoroDoc();
    const text = doc.getText('root');
    
    text.insert(0, 'Hello World');
    expect(text.toString()).toBe('Hello World');
    expect(text.length).toBe(11);
  });

  it('should export JSON updates after text insertion', () => {
    const doc = new LoroDoc();
    const text = doc.getText('root');
    
    text.insert(0, 'Test');
    
    const exported = doc.exportJsonUpdates();
    expect(exported).toBeDefined();
    
    // Log the type for debugging
    console.log('exportJsonUpdates returned type:', typeof exported);
    console.log('exportJsonUpdates value:', JSON.stringify(exported).substring(0, 100));
  });
  
  it('getText is idempotent on same container name', () => {
    const doc = new LoroDoc();
    const text1 = doc.getText('root');
    const text2 = doc.getText('root');
    
    // Should return the same underlying container
    text1.insert(0, 'shared');
    expect(text2.toString()).toBe('shared');
    expect(text1.length).toBe(text2.length);
  });
});
