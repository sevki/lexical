/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Binding, Provider, UserState} from '.';
import type {NodeKey, RangeSelection} from 'lexical';

import {$getSelection, $isRangeSelection} from 'lexical';

import {CollabElementNode} from './CollabElementNode';

export type Cursor = {
  anchor: CursorSelection;
  color: string;
  data: object;
  focus: CursorSelection;
  name: string;
  selections: Array<null | CursorSelection>;
};

export type CursorSelection = {
  key: NodeKey;
  offset: number;
};

export type SyncCursorPositionsFn = (
  binding: Binding,
  provider: Provider,
) => void;

export function syncCursorPositions(
  binding: Binding,
  provider: Provider,
): void {
  const awareness = provider.awareness;
  const localState = awareness.getLocalState();

  if (localState === null) {
    return;
  }

  const editor = binding.editor;
  const selection = editor.getEditorState().read($getSelection);

  if ($isRangeSelection(selection)) {
    const anchor = selection.anchor;
    const focus = selection.focus;

    localState.anchorPos = {key: anchor.key, offset: anchor.offset};
    localState.focusPos = {key: focus.key, offset: focus.offset};
    awareness.setLocalState(localState);
  }
}

export function getAnchorAndFocusCollabNodesForUserState(
  userState: UserState,
  binding: Binding,
): {
  anchor: null | CollabElementNode;
  focus: null | CollabElementNode;
} {
  const {anchorPos, focusPos} = userState;

  if (anchorPos === null || focusPos === null) {
    return {anchor: null, focus: null};
  }

  const collabNodeMap = binding.collabNodeMap;
  const anchor = collabNodeMap.get(anchorPos.key);
  const focus = collabNodeMap.get(focusPos.key);

  return {
    anchor: anchor instanceof CollabElementNode ? anchor : null,
    focus: focus instanceof CollabElementNode ? focus : null,
  };
}

export function syncLexicalSelectionToLoro(
  binding: Binding,
  provider: Provider,
  selection: RangeSelection,
): void {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const awareness = provider.awareness;
  const localState = awareness.getLocalState();

  if (localState !== null) {
    localState.anchorPos = {key: anchor.key, offset: anchor.offset};
    localState.focusPos = {key: focus.key, offset: focus.offset};
    awareness.setLocalState(localState);
  }
}

export function $syncLocalCursorPosition(
  binding: Binding,
  provider: Provider,
): void {
  const awareness = provider.awareness;
  const localState = awareness.getLocalState();

  if (localState === null) {
    return;
  }

  const selection = $getSelection();

  if ($isRangeSelection(selection)) {
    const anchor = selection.anchor;
    const focus = selection.focus;

    localState.anchorPos = {key: anchor.key, offset: anchor.offset};
    localState.focusPos = {key: focus.key, offset: focus.offset};
    awareness.setLocalState(localState);
  }
}
