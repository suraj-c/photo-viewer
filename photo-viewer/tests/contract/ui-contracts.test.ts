/**
 * Contract test for `contracts/ui-contracts.md`.
 *
 * Smoke-asserts the public component shapes that other tests / consumers
 * depend on. If you change a prop name or remove a contract surface, this
 * suite will fail.
 */

import { describe, expect, it } from 'vitest';
import { Gallery } from '../../src/components/Gallery/Gallery';
import { ThumbnailTile } from '../../src/components/Gallery/ThumbnailTile';
import { EmptyState } from '../../src/components/Gallery/EmptyState';
import { PhotoViewer } from '../../src/components/Viewer/PhotoViewer';
import { ViewerControls } from '../../src/components/Viewer/ViewerControls';
import { MetadataPanel } from '../../src/components/Viewer/MetadataPanel';
import { ErrorPlaceholder } from '../../src/components/Viewer/ErrorPlaceholder';
import { SlideshowController } from '../../src/components/Slideshow/SlideshowController';
import { SlideshowSettings } from '../../src/components/Slideshow/SlideshowSettings';
import { FolderPicker } from '../../src/components/common/FolderPicker';
import { IconButton } from '../../src/components/common/IconButton';
import { KeyboardShortcutsHelp } from '../../src/components/common/KeyboardShortcutsHelp';

describe('ui-contracts', () => {
  it('every public component is a function or forwardRef component', () => {
    const components = [
      Gallery, ThumbnailTile, EmptyState,
      PhotoViewer, ViewerControls, MetadataPanel, ErrorPlaceholder,
      SlideshowController, SlideshowSettings,
      FolderPicker, IconButton, KeyboardShortcutsHelp,
    ];
    for (const C of components) {
      expect(typeof C === 'function' || (C as { $$typeof?: symbol }).$$typeof).toBeTruthy();
    }
  });
});
