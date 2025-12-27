# `@lexical/loro`

This package provides a set of bindings for Loro CRDT that allow for collaborative editing with Lexical.

## About Loro

Loro is a high-performance CRDT (Conflict-free Replicated Data Type) library built in Rust with JavaScript/TypeScript bindings via WASM. It provides real-time collaboration capabilities with features like:

- Fast and efficient text collaboration
- Built-in undo/redo support
- Time-travel and version control
- Low memory footprint
- Type-safe TypeScript API

## Installation

```bash
npm install @lexical/loro loro-crdt
# or
yarn add @lexical/loro loro-crdt
# or
pnpm add @lexical/loro loro-crdt
```

## Usage

This package is based on the `@lexical/yjs` package and follows a similar API pattern. Basic usage:

```typescript
import {createBinding} from '@lexical/loro';
import {LoroDoc} from 'loro-crdt';
import {createEditor} from 'lexical';

// Create a Loro document
const doc = new LoroDoc();

// Create a Lexical editor
const editor = createEditor({
  // ... editor config
});

// Create the binding
const binding = createBinding(
  editor,
  provider, // Your collaboration provider
  'doc-id',
  doc,
  new Map()
);

// Start syncing
// ... sync logic
```

## Key Differences from Yjs

While this package is based on `@lexical/yjs`, there are some key differences due to Loro's architecture:

1. **Client ID**: Loro uses string-based peer IDs (`peerIdStr`) instead of numeric client IDs
2. **Data Structures**: Uses `LoroText` and `LoroMap` instead of Yjs's `XmlText` and `XmlElement`
3. **Undo Manager**: Uses Loro's native `UndoManager` instead of Yjs's `UndoManager`

## API Documentation

See the [Lexical documentation](https://lexical.dev/docs/api/modules/lexical_loro) for full API documentation.

## Loro Documentation

For more information about Loro CRDT:
- [Loro Official Documentation](https://loro.dev/docs/api/js)
- [Loro GitHub Repository](https://github.com/loro-dev/loro)
