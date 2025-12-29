/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Binding, Provider} from '@lexical/loro';
import type {JSX} from 'react';

import {createBinding, syncLexicalUpdateToLoro} from '@lexical/loro';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  SKIP_COLLAB_TAG,
} from 'lexical';
import {LoroDoc} from 'loro-crdt';
import {useEffect, useMemo, useState} from 'react';

import Button from '../ui/Button';

export function LoroCollaborationPlugin({
  id,
  providerFactory,
  shouldBootstrap,
}: {
  id: string;
  providerFactory: (
    docId: string,
    loroDocMap: Map<string, LoroDoc>,
  ) => Provider;
  shouldBootstrap: boolean;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const [collabContext, setCollabContext] = useState<{
    binding: Binding;
    doc: LoroDoc;
    provider: Provider;
  }>();

  const loroDocMap = useMemo(() => new Map<string, LoroDoc>(), []);

  useEffect(() => {
    const provider = providerFactory(id, loroDocMap);
    const doc = loroDocMap.get(id);

    if (doc == null) {
      return;
    }

    const binding = createBinding(editor, provider, id, doc, loroDocMap);

    setCollabContext({
      binding,
      doc,
      provider,
    });

    return () => {
      // Cleanup
    };
  }, [editor, id, loroDocMap, providerFactory]);

  useEffect(() => {
    if (collabContext == null) {
      return;
    }

    const {provider, binding} = collabContext;

    // Register update listener to sync Lexical changes to Loro
    const removeUpdateListener = editor.registerUpdateListener(
      ({
        prevEditorState,
        editorState: currEditorState,
        dirtyElements,
        dirtyLeaves,
        normalizedNodes,
        tags,
      }) => {
        if (!tags.has(SKIP_COLLAB_TAG)) {
          syncLexicalUpdateToLoro(
            binding,
            provider,
            prevEditorState,
            currEditorState,
            dirtyElements,
            dirtyLeaves,
            normalizedNodes,
            tags,
          );
        }
      },
    );

    if (shouldBootstrap) {
      provider.connect();

      // Bootstrap the editor with initial content if empty (after connect)
      editor.update(
        () => {
          const root = $getRoot();
          if (root.isEmpty()) {
            const paragraph = $createParagraphNode();
            const text = $createTextNode(
              'Welcome to Lexical with Loro CRDT Collaboration!',
            );
            paragraph.append(text);
            root.append(paragraph);
          }
        },
        {
          tag: 'history-merge',
        },
      );
    }

    return () => {
      provider.disconnect();
      removeUpdateListener();
    };
  }, [collabContext, shouldBootstrap, editor]);

  const handleExportLoroDoc = () => {
    if (collabContext?.doc == null) {
      return;
    }

    const doc = collabContext.doc;
    // Export as JSON for human readability and debugging
    const jsonUpdates = doc.exportJsonUpdates();
    const jsonString = JSON.stringify(jsonUpdates, null, 2);

    // Create a Blob and download it
    const blob = new Blob([jsonString], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `loro-document-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: '20px',
        top: '80px',
        zIndex: 10,
      }}>
      <Button
        onClick={handleExportLoroDoc}
        disabled={collabContext?.doc == null}
        small={true}
        title="Export Loro Document (for https://inspector.loro.dev/)">
        Export Loro Doc
      </Button>
    </div>
  );
}
