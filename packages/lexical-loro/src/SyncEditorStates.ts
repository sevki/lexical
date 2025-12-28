/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {EditorState, NodeKey} from 'lexical';

import {
  $addUpdateTag,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  SKIP_COLLAB_TAG,
} from 'lexical';

import {Binding, Provider} from '.';
import {syncLexicalSelectionToLoro} from './SyncCursors';
import {syncWithTransaction} from './Utils';

export function syncLexicalUpdateToLoro(
  binding: Binding,
  provider: Provider,
  prevEditorState: EditorState,
  currEditorState: EditorState,
  dirtyElements: Map<NodeKey, IntentionallyMarkedAsDirtyElement>,
  dirtyLeaves: Set<NodeKey>,
  normalizedNodes: Set<NodeKey>,
  tags: Set<string>,
): void {
  syncWithTransaction(binding, () => {
    if (tags.has(SKIP_COLLAB_TAG) === false) {
      currEditorState.read(() => {
        const root = $getRoot();
        const collabRoot = binding.root;
        collabRoot.syncChildrenFromLexical(
          binding,
          root,
          prevEditorState._nodeMap,
        );
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          syncLexicalSelectionToLoro(binding, provider, selection);
        }
      });
    }
  });
}

export function syncLoroChangesToLexical(
  binding: Binding,
  provider: Provider,
  events: Array<unknown>,
  isFromUndoManger: boolean,
): void {
  binding.editor.update(
    () => {
      $addUpdateTag(SKIP_COLLAB_TAG);
      // Simplified sync - in a real implementation, this would handle
      // Loro events and update the Lexical editor state accordingly
    },
    {
      tag: isFromUndoManger ? 'historic' : 'collaboration',
    },
  );
}

type IntentionallyMarkedAsDirtyElement = boolean;
