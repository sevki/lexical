/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {BaseBinding, Binding} from '.';
import type {LoroText, LoroMap} from 'loro-crdt';

import {
  $getNodeByKey,
  $getRoot,
  $getWritableNodeState,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isRootNode,
  $isTextNode,
  createEditor,
  DecoratorNode,
  EditorState,
  ElementNode,
  LexicalNode,
  NodeKey,
  RangeSelection,
  TextNode,
} from 'lexical';
import invariant from 'shared/invariant';

import {isBindingV1} from './Bindings';
import {
  $createCollabDecoratorNode,
  CollabDecoratorNode,
} from './CollabDecoratorNode';
import {$createCollabElementNode, CollabElementNode} from './CollabElementNode';
import {
  $createCollabLineBreakNode,
  CollabLineBreakNode,
} from './CollabLineBreakNode';
import {$createCollabTextNode, CollabTextNode} from './CollabTextNode';

const baseExcludedProperties = new Set<string>([
  '__key',
  '__parent',
  '__next',
  '__prev',
  '__state',
]);
const elementExcludedProperties = new Set<string>([
  '__first',
  '__last',
  '__size',
]);
const rootExcludedProperties = new Set<string>(['__cachedText']);
const textExcludedProperties = new Set<string>(['__text']);

function isExcludedProperty(
  name: string,
  node: LexicalNode,
  binding: BaseBinding,
): boolean {
  if (
    baseExcludedProperties.has(name) ||
    typeof (node as unknown as Record<string, unknown>)[name] === 'function'
  ) {
    return true;
  }

  if ($isTextNode(node)) {
    if (textExcludedProperties.has(name)) {
      return true;
    }
  } else if ($isElementNode(node)) {
    if (
      elementExcludedProperties.has(name) ||
      ($isRootNode(node) && rootExcludedProperties.has(name))
    ) {
      return true;
    }
  }

  const nodeKlass = node.constructor;
  const excludedProperties = binding.excludedProperties.get(nodeKlass);
  return excludedProperties != null && excludedProperties.has(name);
}

export function initializeNodeProperties(binding: BaseBinding): void {
  const {editor, nodeProperties} = binding;
  editor.update(() => {
    editor._nodes.forEach((nodeInfo) => {
      const node = new nodeInfo.klass();
      const defaultProperties: {[property: string]: unknown} = {};
      for (const [property, value] of Object.entries(node)) {
        if (!isExcludedProperty(property, node, binding)) {
          defaultProperties[property] = value;
        }
      }
      nodeProperties.set(node.__type, Object.freeze(defaultProperties));
    });
  });
}

export function getDefaultNodeProperties(
  node: LexicalNode,
  binding: BaseBinding,
): {[property: string]: unknown} {
  const type = node.__type;
  const {nodeProperties} = binding;
  const properties = nodeProperties.get(type);
  invariant(
    properties !== undefined,
    'Node properties for %s not initialized for sync',
    type,
  );
  return properties;
}

export function $createCollabNodeFromLexicalNode(
  binding: Binding,
  lexicalNode: LexicalNode,
  parentCollabNode: CollabElementNode,
):
  | CollabElementNode
  | CollabTextNode
  | CollabDecoratorNode
  | CollabLineBreakNode {
  const nodeType = lexicalNode.__type;
  const doc = binding.doc;
  let collabNode;

  if ($isTextNode(lexicalNode)) {
    const map = doc.getMap(lexicalNode.__key);
    collabNode = $createCollabTextNode(
      map,
      lexicalNode.__text,
      parentCollabNode,
      nodeType,
    );
  } else if ($isElementNode(lexicalNode)) {
    const loroText = doc.getText(lexicalNode.__key);
    collabNode = $createCollabElementNode(loroText, parentCollabNode, nodeType);
  } else if ($isLineBreakNode(lexicalNode)) {
    const map = doc.getMap(lexicalNode.__key);
    collabNode = $createCollabLineBreakNode(map, parentCollabNode);
  } else if ($isDecoratorNode(lexicalNode)) {
    const map = doc.getMap(lexicalNode.__key);
    collabNode = $createCollabDecoratorNode(map, parentCollabNode, nodeType);
  } else {
    invariant(false, 'Expected text, element, decorator, or linebreak node');
  }

  collabNode._key = lexicalNode.__key;
  return collabNode;
}

export function $getOrInitCollabNodeFromSharedType(
  binding: Binding,
  sharedType: LoroText | LoroMap,
):
  | CollabElementNode
  | CollabTextNode
  | CollabDecoratorNode
  | CollabLineBreakNode {
  const collabNode = sharedType._collabNode;

  if (collabNode === undefined) {
    invariant(false, 'Collab node not initialized for shared type');
  }

  return collabNode;
}

export function syncPropertiesFromLexical(
  binding: BaseBinding,
  sharedType: LoroText | LoroMap,
  prevLexicalNode: LexicalNode | null,
  nextLexicalNode: LexicalNode,
): void {
  const properties = getDefaultNodeProperties(nextLexicalNode, binding);

  for (const property in properties) {
    const prevValue =
      prevLexicalNode === null
        ? undefined
        : (prevLexicalNode as unknown as Record<string, unknown>)[property];
    const nextValue = (nextLexicalNode as unknown as Record<string, unknown>)[
      property
    ];

    if (prevValue !== nextValue) {
      if ('set' in sharedType) {
        (sharedType as LoroMap).set(property, nextValue as string);
      }
    }
  }
}

export function $syncPropertiesFromLoro(
  binding: BaseBinding,
  sharedType: LoroText | LoroMap,
  lexicalNode: LexicalNode,
  keysChanged: null | Set<string>,
): void {
  const properties = getDefaultNodeProperties(lexicalNode, binding);

  for (const property in properties) {
    if (keysChanged === null || keysChanged.has(property)) {
      let sharedValue;
      
      if ('get' in sharedType && typeof sharedType.get === 'function') {
        sharedValue = (sharedType as LoroMap).get(property);
      }

      if (sharedValue !== undefined) {
        const writableNodeState = $getWritableNodeState(
          lexicalNode.getWritable(),
        );
        writableNodeState.updateFromUnknown(property, sharedValue);
      }
    }
  }
}

export function spliceString(
  str: string,
  index: number,
  delCount: number,
  newText: string,
): string {
  return str.slice(0, index) + newText + str.slice(index + delCount);
}

export function getPositionFromElementAndOffset(
  collabElement: CollabElementNode,
  offset: number,
  boundaryIsEdge: boolean,
): {
  length: number;
  node:
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode;
  nodeIndex: number;
  offset: number;
} {
  const children = collabElement._children;
  const childrenLength = children.length;

  if (childrenLength === 0) {
    return {
      length: 0,
      node: collabElement,
      nodeIndex: -1,
      offset: 0,
    };
  }

  let currentOffset = 0;
  let i = 0;

  for (; i < childrenLength; i++) {
    const child = children[i];
    const size = child.getSize();
    const nextOffset = currentOffset + size;

    if (offset < nextOffset || (boundaryIsEdge && offset === nextOffset)) {
      return {
        length: size - (offset - currentOffset),
        node: child,
        nodeIndex: i,
        offset: offset - currentOffset,
      };
    }

    currentOffset = nextOffset;
  }

  return {
    length: 0,
    node: collabElement,
    nodeIndex: i,
    offset: 0,
  };
}

export function createLexicalNodeFromCollabNode(
  binding: Binding,
  collabNode:
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode,
  parentKey: NodeKey,
): LexicalNode {
  const type = collabNode.getType();
  const editor = binding.editor;
  let lexicalNode;

  const registeredNodes = editor._nodes;
  const nodeInfo = registeredNodes.get(type);
  
  invariant(nodeInfo !== undefined, 'Node %s not registered in editor', type);

  lexicalNode = new nodeInfo.klass();
  lexicalNode.__key = collabNode._key;
  lexicalNode.__parent = parentKey;

  return lexicalNode;
}

export function doesSelectionNeedRecovering(
  selection: null | RangeSelection,
): boolean {
  if (selection === null) {
    return false;
  }

  const anchor = selection.anchor;
  const focus = selection.focus;

  return (
    $getNodeByKey(anchor.key) === null || $getNodeByKey(focus.key) === null
  );
}

export function $moveSelectionToPreviousNode(
  nodeToRemove: ElementNode | TextNode | DecoratorNode<unknown>,
): void {
  const previousNode = nodeToRemove.getPreviousSibling();

  if (previousNode !== null) {
    if ($isTextNode(previousNode)) {
      previousNode.select();
    } else if ($isElementNode(previousNode)) {
      previousNode.selectEnd();
    }
  }
}

export function syncWithTransaction(binding: Binding, fn: () => void): void {
  const doc = binding.doc;
  binding.doc.transact(fn);
}

export function getNodeTypeFromSharedType(
  sharedType: LoroText | LoroMap,
): string | undefined {
  if ('get' in sharedType && typeof sharedType.get === 'function') {
    return (sharedType as LoroMap).get('__type') as string | undefined;
  }
  return undefined;
}
