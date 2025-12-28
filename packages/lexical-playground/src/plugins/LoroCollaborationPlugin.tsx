/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Binding, Provider} from '@lexical/loro';

import {createBinding} from '@lexical/loro';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {LoroDoc} from 'loro-crdt';
import {useEffect, useMemo, useState} from 'react';

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
}): null {
  const [editor] = useLexicalComposerContext();

  const [collabContext, setCollabContext] = useState<{
    binding: Binding;
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

  return null;
}
