/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createEditor} from 'lexical';
import {describe, expect, test} from 'vitest';

import * as LexicalLoro from '../../src/index';
import {createBinding} from '../../src/index';

describe('LexicalLoro tests', () => {
  test('createBinding exports correctly', () => {
    expect(createBinding).toBeDefined();
    expect(typeof createBinding).toBe('function');
  });

  test('package exports', () => {
    expect(LexicalLoro.createBinding).toBeDefined();
    expect(LexicalLoro.createUndoManager).toBeDefined();
    expect(LexicalLoro.initLocalState).toBeDefined();
    expect(LexicalLoro.setLocalStateFocus).toBeDefined();
    expect(LexicalLoro.syncLexicalUpdateToLoro).toBeDefined();
    expect(LexicalLoro.syncLoroChangesToLexical).toBeDefined();
    expect(LexicalLoro.syncCursorPositions).toBeDefined();
    expect(LexicalLoro.getAnchorAndFocusCollabNodesForUserState).toBeDefined();
    expect(LexicalLoro.CONNECTED_COMMAND).toBeDefined();
    expect(LexicalLoro.TOGGLE_CONNECT_COMMAND).toBeDefined();
  });

  test('editor can be created', () => {
    const editor = createEditor();
    expect(editor).toBeDefined();
  });
});
