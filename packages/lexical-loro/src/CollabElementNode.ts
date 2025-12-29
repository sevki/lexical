/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Binding} from '.';
import type {ElementNode, NodeKey, NodeMap} from 'lexical';
import type {LoroText} from 'loro-crdt';

import {$createChildrenArray} from '@lexical/offset';
import {
  $getNodeByKey,
  $getNodeByKeyOrThrow,
  $isDecoratorNode,
  $isElementNode,
  $isTextNode,
} from 'lexical';
import invariant from 'shared/invariant';

import {CollabDecoratorNode} from './CollabDecoratorNode';
import {CollabLineBreakNode} from './CollabLineBreakNode';
import {CollabTextNode} from './CollabTextNode';
import {
  $createCollabNodeFromLexicalNode,
  $syncPropertiesFromLoro,
  syncPropertiesFromLexical,
} from './Utils';

type IntentionallyMarkedAsDirtyElement = boolean;

export class CollabElementNode {
  _key: NodeKey;
  _children: Array<
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode
  >;
  _loroText: LoroText;
  _type: string;
  _parent: null | CollabElementNode;

  constructor(
    loroText: LoroText,
    parent: null | CollabElementNode,
    type: string,
  ) {
    this._key = '';
    this._children = [];
    this._loroText = loroText;
    this._type = type;
    this._parent = parent;
  }

  getPrevNode(nodeMap: null | NodeMap): null | ElementNode {
    if (nodeMap === null) {
      return null;
    }

    const node = nodeMap.get(this._key);
    return $isElementNode(node) ? node : null;
  }

  getNode(): null | ElementNode {
    const node = $getNodeByKey(this._key);
    return $isElementNode(node) ? node : null;
  }

  getSharedType(): LoroText {
    return this._loroText;
  }

  getType(): string {
    return this._type;
  }

  getKey(): NodeKey {
    return this._key;
  }

  isEmpty(): boolean {
    return this._children.length === 0;
  }

  getSize(): number {
    return 1;
  }

  getOffset(): number {
    const collabElementNode = this._parent;
    invariant(
      collabElementNode !== null,
      'getOffset: could not find collab element node',
    );

    return collabElementNode.getChildOffset(this);
  }

  syncPropertiesFromLoro(
    binding: Binding,
    keysChanged: null | Set<string>,
  ): void {
    const lexicalNode = this.getNode();
    invariant(
      lexicalNode !== null,
      'syncPropertiesFromLoro: could not find element node',
    );
    $syncPropertiesFromLoro(binding, this._loroText, lexicalNode, keysChanged);
  }

  getChildOffset(
    collabNode:
      | CollabDecoratorNode
      | CollabElementNode
      | CollabLineBreakNode
      | CollabTextNode,
  ): number {
    const children = this._children;
    const childrenLength = children.length;
    let offset = 0;

    for (let i = 0; i < childrenLength; i++) {
      const child = children[i];

      if (child === collabNode) {
        return offset;
      }

      offset += child.getSize();
    }

    return offset;
  }

  syncChildrenFromLexical(
    binding: Binding,
    nextLexicalNode: ElementNode,
    prevNodeMap: null | NodeMap,
  ): IntentionallyMarkedAsDirtyElement {
    const prevLexicalNode = this.getPrevNode(prevNodeMap);
    const children = this._children;
    let markedAsDirty = false;

    syncPropertiesFromLexical(
      binding,
      this._loroText,
      prevLexicalNode,
      nextLexicalNode,
    );

    const nextChildrenKeys = $createChildrenArray(nextLexicalNode, null);
    const nextChildrenLength = nextChildrenKeys.length;
    const collabNodeMap = binding.collabNodeMap;

    for (let i = 0; i < nextChildrenLength; i++) {
      const nextKey = nextChildrenKeys[i];
      const nextChild = $getNodeByKeyOrThrow(nextKey);
      const collabNode = collabNodeMap.get(nextKey);

      if (collabNode === undefined) {
        // New node
        const newCollabNode = $createCollabNodeFromLexicalNode(
          binding,
          nextChild,
          this,
        );
        children.splice(i, 0, newCollabNode);
        collabNodeMap.set(nextKey, newCollabNode);
      } else if (collabNode._parent !== this) {
        // Moved node
        const oldParent = collabNode._parent;
        if (oldParent !== null) {
          const oldParentChildren = oldParent._children;
          const oldIndex = oldParentChildren.indexOf(collabNode);
          oldParentChildren.splice(oldIndex, 1);
        }
        children.splice(i, 0, collabNode);
        collabNode._parent = this;
      }

      // Handle Element and Text nodes
      if ($isElementNode(nextChild)) {
        if (collabNode instanceof CollabElementNode) {
          const nextNodeMarkedAsDirty = collabNode.syncChildrenFromLexical(
            binding,
            nextChild,
            prevNodeMap,
          );
          markedAsDirty = markedAsDirty || nextNodeMarkedAsDirty;
        }
      } else if ($isTextNode(nextChild)) {
        if (collabNode instanceof CollabTextNode) {
          collabNode.syncPropertiesAndTextFromLexical(
            binding,
            nextChild,
            prevNodeMap,
          );
        }
      } else if ($isDecoratorNode(nextChild)) {
        if (collabNode instanceof CollabDecoratorNode) {
          collabNode.syncPropertiesFromLexical(binding, nextChild, prevNodeMap);
        }
      }
    }

    // Remove any deleted children
    const childrenLength = children.length;

    for (let i = nextChildrenLength; i < childrenLength; i++) {
      const collabNode = children[i];
      collabNode.destroy(binding);
    }

    children.length = nextChildrenLength;

    return markedAsDirty;
  }

  destroy(binding: Binding): void {
    const children = this._children;
    const childrenLength = children.length;
    const collabNodeMap = binding.collabNodeMap;

    for (let i = 0; i < childrenLength; i++) {
      children[i].destroy(binding);
    }

    if (collabNodeMap.get(this._key) === this) {
      collabNodeMap.delete(this._key);
    }
  }
}

export function $createCollabElementNode(
  loroText: LoroText,
  parent: null | CollabElementNode,
  type: string,
): CollabElementNode {
  const collabNode = new CollabElementNode(loroText, parent, type);
  loroText._collabNode = collabNode;
  return collabNode;
}
