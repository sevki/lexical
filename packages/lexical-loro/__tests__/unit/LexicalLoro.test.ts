/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createEditor} from 'lexical';
import {describe, expect, test} from 'vitest';

import {createBinding} from '../../src/index';

describe('LexicalLoro tests', () => {
  test('createBinding exports correctly', () => {
    expect(createBinding).toBeDefined();
    expect(typeof createBinding).toBe('function');
  });

  test('package exports', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loro = require('../../LexicalLoro.js');

    expect(loro.createBinding).toBeDefined();
    expect(loro.createUndoManager).toBeDefined();
    expect(loro.initLocalState).toBeDefined();
    expect(loro.setLocalStateFocus).toBeDefined();
    expect(loro.syncLexicalUpdateToLoro).toBeDefined();
    expect(loro.syncLoroChangesToLexical).toBeDefined();
    expect(loro.syncCursorPositions).toBeDefined();
    expect(loro.getAnchorAndFocusCollabNodesForUserState).toBeDefined();
    expect(loro.CONNECTED_COMMAND).toBeDefined();
    expect(loro.TOGGLE_CONNECT_COMMAND).toBeDefined();
  });

  test('editor can be created', () => {
    const editor = createEditor();
    expect(editor).toBeDefined();
  });
});
