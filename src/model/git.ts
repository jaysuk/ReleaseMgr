/**
 * GitHub access helpers. All requests go straight to GitHub's public API / raw-content hosts, which
 * send permissive CORS headers, so they work from the browser without a proxy. Native fetch (no axios
 * dependency to bundle). Every helper resolves to `null` on any failure so callers can show a friendly
 * "couldn't reach GitHub" state rather than throwing.
 */

/** A GitHub release as returned by the REST API (only the fields ReleaseMgr uses). */
export interface GitRelease {
	tag_name: string;
	name?: string;
	body?: string;
	published_at?: string;
	prerelease?: boolean;
	html_url?: string;
	assets?: Array<{ name: string; browser_download_url: string; size?: number }>;
}

async function getJson<T>(url: string): Promise<T | null> {
	try {
		const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
		if (!res.ok) {
			console.warn(`[ReleaseMgr] GitHub API ${res.status} for ${url}`);
			return null;
		}
		return (await res.json()) as T;
	} catch (e) {
		console.warn("[ReleaseMgr] GitHub request failed:", e);
		return null;
	}
}

async function getText(url: string): Promise<string | null> {
	try {
		const res = await fetch(url);
		if (!res.ok) {
			console.warn(`[ReleaseMgr] raw fetch ${res.status} for ${url}`);
			return null;
		}
		return await res.text();
	} catch (e) {
		console.warn("[ReleaseMgr] raw fetch failed:", e);
		return null;
	}
}

/**
 * Call the GitHub REST API for a repo. `apiURLSuffix` is e.g. "releases" or "releases/latest".
 * Returns the parsed JSON, or null on any error.
 */
export async function getByGitAPI<T = unknown>(apiURLSuffix: string, gitUName: string, gitRepoName: string): Promise<T | null> {
	if (!apiURLSuffix || !gitUName || !gitRepoName) {
		console.warn("[ReleaseMgr] getByGitAPI: missing args");
		return null;
	}
	return getJson<T>(`https://api.github.com/repos/${gitUName}/${gitRepoName}/${apiURLSuffix}`);
}

/** Convenience: list releases for a repo. */
export async function getReleases(gitUName: string, gitRepoName: string): Promise<Array<GitRelease> | null> {
	return getByGitAPI<Array<GitRelease>>("releases?per_page=100", gitUName, gitRepoName);
}

/** Fetch a wiki page's raw markdown (no CORS issues via raw.githubusercontent.com/wiki). */
export async function getByGitWikiRaw(wikiFileName: string, gitUName: string, gitRepoName: string): Promise<string | null> {
	if (!wikiFileName || !gitUName || !gitRepoName) {
		return null;
	}
	return getText(`https://raw.githubusercontent.com/wiki/${gitUName}/${gitRepoName}/${wikiFileName}`);
}

/**
 * Fetch a raw repo file as plain text. `filePathName` is "<ref>/<path>", e.g.
 * "main/RelMgrData/RelMgrData.json". Plain-text/JSON files only.
 */
export async function getByGitFileRaw(filePathName: string, gitUName: string, gitRepoName: string): Promise<string | null> {
	if (!filePathName || !gitUName || !gitRepoName) {
		return null;
	}
	return getText(`https://raw.githubusercontent.com/${gitUName}/${gitRepoName}/${filePathName}`);
}

/** Fetch arbitrary text/HTML from a URL. */
export async function getHTML(sURL: string): Promise<string | null> {
	if (!sURL) {
		return null;
	}
	return getText(sURL);
}
