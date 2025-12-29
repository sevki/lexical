/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Provider} from '@lexical/loro';

import {LoroDoc} from 'loro-crdt';

const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);
const WEBSOCKET_ENDPOINT =
  params.get('collabEndpoint') || 'ws://localhost:1234';
const WEBSOCKET_SLUG = 'playground';
const WEBSOCKET_ID = params.get('collabId') || '0';

type AwarenessState = {
  getLocalState: () => null;
  getStates: () => Map<never, never>;
  off: () => void;
  on: () => void;
  setLocalState: () => void;
};

type ListenerCallback = (...args: unknown[]) => void;

// Simple mock provider for Loro (similar to Yjs WebsocketProvider)
class LoroMockProvider implements Provider {
  awareness: AwarenessState;
  private _connected: boolean = false;
  private _listeners: Map<string, Set<ListenerCallback>> = new Map();

  constructor(
    public endpoint: string,
    public room: string,
    public doc: LoroDoc,
    public options: {connect?: boolean} = {},
  ) {
    // Mock awareness for cursor tracking
    this.awareness = {
      getLocalState: () => null,
      getStates: () => new Map(),
      off: () => {},
      on: () => {},
      setLocalState: () => {},
    };

    // Auto-connect unless specified
    if (options.connect !== false) {
      this.connect();
    }
  }

  connect(): void {
    this._connected = true;
    setTimeout(() => {
      this._emit('sync', true);
      this._emit('status', {status: 'connected'});
    }, 100);
  }

  disconnect(): void {
    this._connected = false;
    this._emit('status', {status: 'disconnected'});
  }

  on(type: string, cb: ListenerCallback): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(cb);
  }

  off(type: string, cb: ListenerCallback): void {
    const listeners = this._listeners.get(type);
    if (listeners) {
      listeners.delete(cb);
    }
  }

  private _emit(type: string, ...args: unknown[]): void {
    const listeners = this._listeners.get(type);
    if (listeners) {
      listeners.forEach((cb) => cb(...args));
    }
  }
}

// parent dom -> child doc
export function createLoroProvider(
  id: string,
  loroDocMap: Map<string, LoroDoc>,
): Provider {
  let doc = loroDocMap.get(id);

  if (doc === undefined) {
    doc = new LoroDoc();
    loroDocMap.set(id, doc);
  }

  return createLoroProviderWithDoc(id, doc);
}

export function createLoroProviderWithDoc(id: string, doc: LoroDoc): Provider {
  return new LoroMockProvider(
    WEBSOCKET_ENDPOINT,
    WEBSOCKET_SLUG + '/' + WEBSOCKET_ID + '/' + id,
    doc,
    {
      connect: false,
    },
  );
}
