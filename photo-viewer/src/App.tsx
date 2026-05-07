import React, { useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { FolderPicker } from './components/common/FolderPicker';
import { IconButton } from './components/common/IconButton';
import { KeyboardShortcutsHelp, SHORTCUT_GROUPS } from './components/common/KeyboardShortcutsHelp';
import { Gallery } from './components/Gallery/Gallery';
import { PhotoViewer } from './components/Viewer/PhotoViewer';
import { SlideshowController } from './components/Slideshow/SlideshowController';
import { useCollection } from './hooks/useCollection';
import { useSlideshow } from './hooks/useSlideshow';
import { type ShortcutBinding, useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { DEFAULT_INTERVAL_SECONDS } from './models/SlideshowSession';
import type { FolderReader } from './services/folderReader';

export interface AppProps {
  /** Test seam: inject a mock folder reader so tests don't need a real picker. */
  folderReader?: FolderReader;
}

export function App({ folderReader }: AppProps = {}) {
  const collectionApi = useCollection({ reader: folderReader });
  const {
    collection,
    currentIndex,
    loading,
    error,
    selectFolder,
    refresh,
    openAt,
    next,
    prev,
    closeViewer,
    viewerOpen,
  } = collectionApi;

  const [helpOpen, setHelpOpen] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(DEFAULT_INTERVAL_SECONDS);

  const slideshow = useSlideshow({
    collection,
    startIndex: currentIndex < 0 ? 0 : currentIndex,
    onIndexChange: (idx) => openAt(idx),
  });

  const activePhoto =
    collection && currentIndex >= 0 && currentIndex < collection.photos.length
      ? collection.photos[currentIndex]
      : null;

  const canPrev = currentIndex > 0;
  const canNext = !!collection && currentIndex < collection.photos.length - 1;

  const toggleHelp = useCallback(() => setHelpOpen((v) => !v), []);
  const toggleMetadata = useCallback(() => setMetadataOpen((v) => !v), []);

  const startSlideshow = useCallback(() => {
    if (!collection || collection.photos.length === 0) return;
    const idx = currentIndex >= 0 ? currentIndex : 0;
    slideshow.start(idx, intervalSeconds);
    openAt(idx);
  }, [collection, currentIndex, intervalSeconds, slideshow, openAt]);

  const stopSlideshow = useCallback(() => {
    slideshow.stop();
  }, [slideshow]);

  const toggleSlideshow = useCallback(() => {
    if (slideshow.session) stopSlideshow();
    else startSlideshow();
  }, [slideshow.session, startSlideshow, stopSlideshow]);

  // Active scopes — narrowest first (slideshow > viewer > gallery > global).
  const activeScopes = useMemo<ShortcutBinding['scope'][]>(() => {
    const scopes: ShortcutBinding['scope'][] = [];
    if (slideshow.session) scopes.push('slideshow');
    if (viewerOpen) scopes.push('viewer');
    if (collection && !viewerOpen) scopes.push('gallery');
    scopes.push('global');
    return scopes;
  }, [slideshow.session, viewerOpen, collection]);

  // ---------------------------------------------------------------------------
  // Keyboard bindings — every entry mirrors `contracts/keyboard-shortcuts.md`.
  // The contract test suite walks this list to assert every documented shortcut
  // is bound.
  // ---------------------------------------------------------------------------
  const bindings = useMemo<ShortcutBinding[]>(() => {
    return [
      // Global
      { scope: 'global', key: '?', description: 'Toggle keyboard shortcuts help', handler: toggleHelp },
      { scope: 'global', key: 'o', description: 'Open folder picker', handler: () => void selectFolder() },
      {
        scope: 'global',
        key: 'escape',
        description: 'Close help overlay',
        handler: () => {
          if (helpOpen) setHelpOpen(false);
        },
      },

      // Gallery
      { scope: 'gallery', key: 's', description: 'Start slideshow', handler: startSlideshow },

      // Viewer
      { scope: 'viewer', key: 'arrowright', description: 'Next photo', handler: next },
      { scope: 'viewer', key: 'pagedown', description: 'Next photo', handler: next },
      { scope: 'viewer', key: 'arrowleft', description: 'Previous photo', handler: prev },
      { scope: 'viewer', key: 'pageup', description: 'Previous photo', handler: prev },
      { scope: 'viewer', key: 'home', description: 'First photo', handler: () => openAt(0) },
      {
        scope: 'viewer',
        key: 'end',
        description: 'Last photo',
        handler: () => collection && openAt(collection.photos.length - 1),
      },
      { scope: 'viewer', key: '+', description: 'Zoom in', handler: () => dispatchViewerEvent('zoom-in') },
      { scope: 'viewer', key: '=', description: 'Zoom in', handler: () => dispatchViewerEvent('zoom-in') },
      { scope: 'viewer', key: '-', description: 'Zoom out', handler: () => dispatchViewerEvent('zoom-out') },
      { scope: 'viewer', key: '0', description: 'Fit to screen', handler: () => dispatchViewerEvent('fit') },
      { scope: 'viewer', key: '[', description: 'Rotate left', handler: () => dispatchViewerEvent('rotate-left') },
      { scope: 'viewer', key: ']', description: 'Rotate right', handler: () => dispatchViewerEvent('rotate-right') },
      { scope: 'viewer', key: 'arrowup', description: 'Pan up (when zoomed)', handler: () => dispatchViewerEvent('pan-up') },
      { scope: 'viewer', key: 'arrowdown', description: 'Pan down (when zoomed)', handler: () => dispatchViewerEvent('pan-down') },
      { scope: 'viewer', key: 'i', description: 'Toggle metadata panel', handler: toggleMetadata },
      { scope: 'viewer', key: 's', description: 'Toggle slideshow', handler: toggleSlideshow },
      { scope: 'viewer', key: 'escape', description: 'Return to gallery', handler: closeViewer },
      { scope: 'viewer', key: 'backspace', description: 'Return to gallery', handler: closeViewer },

      // Slideshow
      {
        scope: 'slideshow',
        key: 'space',
        description: 'Pause / resume slideshow',
        handler: () => {
          if (slideshow.isRunning) slideshow.pause();
          else if (slideshow.isPaused) slideshow.resume();
        },
      },
      { scope: 'slideshow', key: 'escape', description: 'Stop slideshow', handler: stopSlideshow },
      { scope: 'slideshow', key: 'arrowright', description: 'Skip next', handler: slideshow.skipNext },
      { scope: 'slideshow', key: 'arrowleft', description: 'Skip previous', handler: slideshow.skipPrev },
      {
        scope: 'slideshow',
        key: '+',
        description: 'Increase interval',
        handler: () => {
          const nextS = clampUI(intervalSeconds + 1);
          setIntervalSeconds(nextS);
          slideshow.setInterval(nextS);
        },
      },
      {
        scope: 'slideshow',
        key: '-',
        description: 'Decrease interval',
        handler: () => {
          const nextS = clampUI(intervalSeconds - 1);
          setIntervalSeconds(nextS);
          slideshow.setInterval(nextS);
        },
      },
    ];
  }, [
    toggleHelp,
    selectFolder,
    helpOpen,
    startSlideshow,
    next,
    prev,
    openAt,
    collection,
    toggleMetadata,
    toggleSlideshow,
    closeViewer,
    slideshow,
    stopSlideshow,
    intervalSeconds,
  ]);

  useKeyboardShortcuts({ bindings, activeScopes });

  return (
    <ErrorBoundary>
      <div className="pv-app">
        <header className="pv-header">
          <h1 className="pv-header__title">Photo Viewer</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {collection ? (
              <span className="pv-header__meta" data-testid="collection-meta">
                {collection.folderName} · {collection.total} photo{collection.total === 1 ? '' : 's'}
                {collection.unsupportedCount > 0 ? ` · ${collection.unsupportedCount} skipped` : ''}
              </span>
            ) : null}
            <IconButton label="Open folder" iconChar="📂" onClick={() => void selectFolder()}>
              Open folder
            </IconButton>
            {collection ? (
              <IconButton label="Refresh folder" iconChar="↻" onClick={() => void refresh()} />
            ) : null}
            <IconButton label="Keyboard shortcuts" iconChar="?" onClick={toggleHelp} />
          </div>
        </header>

        <main className="pv-main">
          {!collection ? (
            <FolderPicker onPick={() => void selectFolder()} loading={loading} error={error} />
          ) : viewerOpen && activePhoto ? (
            <PhotoViewer
              photo={activePhoto}
              canPrev={canPrev}
              canNext={canNext}
              metadataOpen={metadataOpen}
              slideshowRunning={!!slideshow.session}
              onPrev={prev}
              onNext={next}
              onClose={closeViewer}
              onToggleMetadata={toggleMetadata}
              onToggleSlideshow={toggleSlideshow}
            />
          ) : (
            <Gallery
              collection={collection}
              onOpen={openAt}
              onPickAnother={() => void selectFolder()}
              restoreIndex={currentIndex >= 0 ? currentIndex : undefined}
            />
          )}
        </main>

        {viewerOpen && slideshow.session ? (
          <SlideshowController
            status={slideshow.session.status}
            intervalSeconds={slideshow.session.intervalSeconds}
            onStart={startSlideshow}
            onPause={slideshow.pause}
            onResume={slideshow.resume}
            onStop={stopSlideshow}
            onIntervalChange={(s) => {
              setIntervalSeconds(s);
              slideshow.setInterval(s);
            }}
          />
        ) : null}

        <KeyboardShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} groups={SHORTCUT_GROUPS} />
      </div>
    </ErrorBoundary>
  );
}

/**
 * Fire a CustomEvent that the active `PhotoViewer` listens for. Decouples
 * App-level keyboard wiring from the viewer's internal hook ownership without
 * forcing a global state container.
 */
function dispatchViewerEvent(detail: string) {
  window.dispatchEvent(new CustomEvent('pv-viewer-cmd', { detail }));
}

function clampUI(s: number) {
  return Math.min(60, Math.max(1, Math.round(s)));
}
