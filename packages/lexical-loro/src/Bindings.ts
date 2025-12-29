/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {CollabDecoratorNode} from './CollabDecoratorNode';
import type {CollabElementNode} from './CollabElementNode';
import type {CollabLineBreakNode} from './CollabLineBreakNode';
import type {CollabTextNode} from './CollabTextNode';
import type {Cursor} from './SyncCursors';
import type {LexicalEditor, NodeKey} from 'lexical';
import type {LoroDoc} from 'loro-crdt';

import {Klass, LexicalNode} from 'lexical';
import invariant from 'shared/invariant';

import {Provider} from '.';
import {$createCollabElementNode} from './CollabElementNode';
import {initializeNodeProperties} from './Utils';

export type ClientID = string;

export interface BaseBinding {
  clientID: string;
  cursors: Map<ClientID, Cursor>;
  cursorsContainer: null | HTMLElement;
  doc: LoroDoc;
  docMap: Map<string, LoroDoc>;
  editor: LexicalEditor;
  id: string;
  nodeProperties: Map<string, {[property: string]: unknown}>; // node type to property to default value
  excludedProperties: ExcludedProperties;
}

export interface Binding extends BaseBinding {
  collabNodeMap: Map<
    NodeKey,
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode
  >;
  root: CollabElementNode;
}

export type AnyBinding = Binding;

export type ExcludedProperties = Map<Klass<LexicalNode>, Set<string>>;

function createBaseBinding(
  editor: LexicalEditor,
  id: string,
  doc: LoroDoc | null | undefined,
  docMap: Map<string, LoroDoc>,
  excludedProperties?: ExcludedProperties,
): BaseBinding {
  invariant(
    doc !== undefined && doc !== null,
    'createBinding: doc is null or undefined',
  );
  const binding = {
    clientID: doc.peerIdStr,
    cursors: new Map(),
    cursorsContainer: null,
    doc,
    docMap,
    editor,
    excludedProperties: excludedProperties || new Map(),
    id,
    nodeProperties: new Map(),
  };
  initializeNodeProperties(binding);
  return binding;
}

export function createBinding(
  editor: LexicalEditor,
  provider: Provider,
  id: string,
  doc: LoroDoc | null | undefined,
  docMap: Map<string, LoroDoc>,
  excludedProperties?: ExcludedProperties,
): Binding {
  invariant(
    doc !== undefined && doc !== null,
    'createBinding: doc is null or undefined',
  );
  
  // Get or create the root text container
  // In Loro, getText creates the container if it doesn't exist
  const rootLoroText = doc.getText('root');
  
  invariant(
    rootLoroText !== undefined && rootLoroText !== null,
    'createBinding: doc.getText("root") returned null or undefined. ' +
      'Loro Doc: ' +
      JSON.stringify({peerIdStr: doc.peerIdStr}) +
      ', rootLoroText type: ' +
      typeof rootLoroText,
  );
  
  const root: CollabElementNode = $createCollabElementNode(
    rootLoroText,
    null,
    'root',
  );
  root._key = 'root';
  return {
    ...createBaseBinding(editor, id, doc, docMap, excludedProperties),
    collabNodeMap: new Map(),
    root,
  };
}

export function isBindingV1(binding: BaseBinding): binding is Binding {
  return Object.hasOwn(binding, 'collabNodeMap');
}
