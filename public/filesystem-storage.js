'use strict';

// Each item has a stable ID. A parent is either a folder ID or a built-in path.
(() => {
  const legacyKey = 'whoami.user-files.v1';
  const markerKey = 'whoami.fs.v2';
  const itemPrefix = 'whoami.fs.v2.item.';
  const shortcutPrefix = 'whoami.fs.v2.shortcut.';
  const home = '/home/roberto';
  const systemParent = path => 'system:' + path;
  const parentPath = path => path.slice(0, path.lastIndexOf('/'));
  const titleOf = path => path.slice(path.lastIndexOf('/') + 1);
  const empty = () => ({folders: [], documents: {}, shortcuts: {}});
  const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

  class FileSystemStorage {
    constructor(storage) {
      this.storage = storage;
      this.records = new Map();
      this.pathIds = new Map();
      this.blocked = false;
      this.data = empty();
    }

    load() {
      try {
        if (this.storage.getItem(markerKey) === 'ready') return this.readRecords();
        const raw = this.storage.getItem(legacyKey);
        if (!raw) {
          this.storage.setItem(markerKey, 'ready');
          return this.data;
        }
        const old = JSON.parse(raw);
        if (!old || !Array.isArray(old.folders) || !old.documents || typeof old.documents !== 'object') throw new Error('Invalid legacy data');
        const legacy = empty();
        legacy.folders = old.folders.filter(path => typeof path === 'string' && path.startsWith(home + '/'));
        for (const [path, content] of Object.entries(old.documents)) if (path.startsWith(home + '/') && typeof content === 'string') legacy.documents[path] = content;
        if (old.shortcuts && typeof old.shortcuts === 'object') for (const [key, path] of Object.entries(old.shortcuts)) if (typeof path === 'string' && path.startsWith(home + '/')) legacy.shortcuts[key] = path;
        try {
          // Remove records left by an interrupted migration while the legacy copy is intact.
          const abandoned = [];
          for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && (key.startsWith(itemPrefix) || key.startsWith(shortcutPrefix))) abandoned.push(key);
          }
          abandoned.forEach(key => this.storage.removeItem(key));
          this.write(legacy, {migration: true});
          // The legacy value remains intact until all records and the marker are saved.
          try { this.storage.removeItem(legacyKey); } catch { /* The completed marker makes a retained backup harmless. */ }
          return this.data;
        } catch {
          this.blocked = true;
          this.data = legacy;
          return legacy;
        }
      } catch {
        this.blocked = true;
        return this.data;
      }
    }

    readRecords() {
      const raw = new Map();
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (!key || (!key.startsWith(itemPrefix) && !key.startsWith(shortcutPrefix))) continue;
        const value = this.storage.getItem(key);
        const item = JSON.parse(value);
        raw.set(key, {value, item});
      }
      const itemById = new Map();
      for (const [key, {item}] of raw) {
        if (!key.startsWith(itemPrefix)) continue;
        if (!item || !['folder', 'file'].includes(item.type) || typeof item.title !== 'string' || typeof item.parent !== 'string' || (item.type === 'file' && typeof item.content !== 'string')) throw new Error('Invalid item');
        itemById.set(key.slice(itemPrefix.length), item);
      }
      const paths = new Map();
      const resolveParent = (parent, visiting = new Set()) => {
        if (parent.startsWith('system:')) {
          const path = parent.slice(7);
          if (path !== home && !path.startsWith(home + '/')) throw new Error('Invalid root');
          return path;
        }
        if (paths.has(parent)) return paths.get(parent);
        if (visiting.has(parent)) throw new Error('Folder cycle');
        const folder = itemById.get(parent);
        if (!folder || folder.type !== 'folder') throw new Error('Missing folder');
        visiting.add(parent);
        const path = resolveParent(folder.parent, visiting) + '/' + folder.title;
        visiting.delete(parent);paths.set(parent, path);return path;
      };
      const data = empty(), pathIds = new Map();
      for (const [id, item] of itemById) {
        const path = resolveParent(item.parent) + '/' + item.title;
        if (pathIds.has(path)) throw new Error('Duplicate path');
        pathIds.set(path, id);
        if (item.type === 'folder') data.folders.push(path); else data.documents[path] = item.content;
      }
      for (const [key, {item}] of raw) if (key.startsWith(shortcutPrefix)) {
        if (!item || typeof item.target !== 'string' || typeof item.parent !== 'string') throw new Error('Invalid shortcut');
        data.shortcuts[item.target] = resolveParent(item.parent);
      }
      this.records = new Map([...raw].map(([key, entry]) => [key, entry.value]));
      this.pathIds = pathIds;this.data = data;return data;
    }

    write(next, {remap = path => path, migration = false} = {}) {
      if (this.blocked) throw new Error('File storage is unavailable');
      const paths = new Map();
      const wantedPaths = new Set([...next.folders, ...Object.keys(next.documents)]);
      for (const [path, id] of this.pathIds) { const mapped = remap(path); if (wantedPaths.has(mapped)) paths.set(mapped, id); }
      for (const path of wantedPaths) if (!paths.has(path)) paths.set(path, newId());
      const parentId = path => paths.get(path) || systemParent(path);
      const wanted = new Map();
      for (const path of next.folders) wanted.set(itemPrefix + paths.get(path), JSON.stringify({type: 'folder', title: titleOf(path), parent: parentId(parentPath(path))}));
      for (const [path, content] of Object.entries(next.documents)) wanted.set(itemPrefix + paths.get(path), JSON.stringify({type: 'file', title: titleOf(path), content, parent: parentId(parentPath(path))}));
      for (const [target, path] of Object.entries(next.shortcuts)) wanted.set(shortcutPrefix + encodeURIComponent(target), JSON.stringify({target, parent: parentId(path)}));
      const changes = [];
      for (const [key, value] of wanted) if (this.records.get(key) !== value) changes.push({key, value});
      for (const key of this.records.keys()) if (!wanted.has(key)) changes.push({key, value: null});
      if (migration) changes.push({key: markerKey, value: 'ready'});
      const undo = [];
      try {
        for (const {key, value} of changes) {
          undo.push({key, value: this.storage.getItem(key)});
          if (value === null) this.storage.removeItem(key); else this.storage.setItem(key, value);
        }
      } catch (error) {
        for (const entry of undo.reverse()) try { if (entry.value === null) this.storage.removeItem(entry.key); else this.storage.setItem(entry.key, entry.value); } catch { /* Keep the original error and legacy data. */ }
        throw error;
      }
      this.records = wanted;this.pathIds = paths;this.data = next;
    }
  }
  window.PortfolioFileSystemStorage = FileSystemStorage;
})();
