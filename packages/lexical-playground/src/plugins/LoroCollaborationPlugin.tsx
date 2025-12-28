/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Binding, Provider} from '@lexical/loro';
import type {JSX} from 'react';

import {createBinding} from '@lexical/loro';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
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

    const {provider} = collabContext;

    if (shouldBootstrap) {
      provider.connect();
    }

    return () => {
      provider.disconnect();
    };
  }, [collabContext, shouldBootstrap]);

  const handleExportLoroDoc = () => {
    if (collabContext?.doc == null) {
      return;
    }

    const doc = collabContext.doc;
    // Export the Loro document as bytes
    const bytes = doc.export({mode: 'snapshot'});
    
    // Create a Blob and download it
    const blob = new Blob([bytes], {type: 'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loro-document-${Date.now()}.loro`;
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
