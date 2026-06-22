/**
 * Shared plugin identifiers. Leaf module so any file can import them without pulling in index.ts.
 */

/** Manifest id (plugin.json `id`) — used for dwcPluginLoaded/Unloaded events + the dwcFiles manifest. */
export const PLUGIN_MANIFEST_ID = "ReleaseMgr";

/** camelCase key for settings persistence and i18n (`plugins.releaseMgr.*`). */
export const PLUGIN_ID = "releaseMgr";

/** Route path for the standalone DWC page. */
export const ROUTE_PATH = "/Plugins/ReleaseMgr";

/** localStorage key for the persisted settings (auto-check / alert-once). */
export const LS_SETTINGS = "releaseMgr.settings";

/**
 * GitHub source for ReleaseMgr's own data files (board map, splash content). Points at this fork so the
 * shipped plugin and its data stay in lockstep.
 */
export const DATA_OWNER = "jaysuk";
export const DATA_REPO = "ReleaseMgr";
