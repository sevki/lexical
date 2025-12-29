/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

declare module 'loro-crdt' {
  declare export class LoroDoc {
    constructor(): this;
    
    getList(name: string): LoroList;
    getMap(name: string): LoroMap;
    getText(name: string): LoroText;
    getTree(name: string): LoroTree;
    
    +peerIdStr: string;
    
    // $FlowFixMe[unclear-type]: temp
    transact(fn: Function): void;
  }

  declare export class LoroText {
    // $FlowFixMe[unclear-type]: temp
    _collabNode: any;
    
    delete(offset: number, length: number): void;
    insert(offset: number, text: string): void;
    
    length: number;
    
    toString(): string;
  }

  declare export class LoroMap {
    // $FlowFixMe[unclear-type]: temp
    _collabNode: any;
    
    delete(key: string): void;
    get(key: string): mixed;
    has(key: string): boolean;
    set(key: string, value: mixed): void;
  }

  declare export class LoroList {
    // $FlowFixMe[unclear-type]: temp
    _collabNode: any;
    
    delete(index: number, length: number): void;
    get(index: number): mixed;
    insert(index: number, value: mixed): void;
    
    length: number;
  }

  declare export class LoroTree {
    // Constructor and methods
  }

  declare export class UndoManager {
    canRedo(): boolean;
    canUndo(): boolean;
    
    constructor(doc: LoroDoc, options?: {...}): this;
    
    redo(): void;
    undo(): void;
  }

  declare export {
    LoroDoc as Doc,
  };
}
