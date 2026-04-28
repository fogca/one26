/**
 * FontPlus integration helpers.
 *
 * The accessor script (loaded in `app.html`) exposes a global `FONTPLUS`
 * object. On the initial server-rendered page it auto-fetches the subset
 * needed for the visible text. For SvelteKit's client-side navigations the
 * DOM changes without a full reload, so we have to call `FONTPLUS.reload()`
 * each time and wait for the complete event before revealing the new copy —
 * otherwise the user briefly sees the fallback font and watches it swap.
 *
 * Every helper is defensive about the script being missing/blocked and
 * about the complete event never firing: each call resolves within a hard
 * timeout so navigation is never permanently blocked by font loading.
 */

type FontPlusGlobal = {
	reload: (init?: boolean) => void;
	attachCompleteEvent: (callback: () => void) => void;
	targetSelector: (selector: string) => void;
	async: () => void;
	start: () => void;
	isloading: () => boolean;
	setFonts: (fonts: string[]) => void;
	load: (fonts: unknown[], callback: () => void, tagid?: string) => void;
};

declare global {
	interface Window {
		FONTPLUS?: FontPlusGlobal;
	}
}

const SCRIPT_WAIT_MS = 4000;
const RELOAD_WAIT_MS = 1800;

/** Resolves once `window.FONTPLUS` is available, or rejects on timeout. */
export function waitForFontPlus(timeoutMs = SCRIPT_WAIT_MS): Promise<FontPlusGlobal> {
	if (typeof window === 'undefined') {
		return Promise.reject(new Error('FontPlus: not in browser'));
	}
	if (window.FONTPLUS) return Promise.resolve(window.FONTPLUS);

	return new Promise((resolve, reject) => {
		const start = Date.now();
		const tick = () => {
			if (window.FONTPLUS) return resolve(window.FONTPLUS);
			if (Date.now() - start > timeoutMs) {
				return reject(new Error('FontPlus: script load timed out'));
			}
			window.requestAnimationFrame(tick);
		};
		tick();
	});
}

/**
 * Trigger a fresh FontPlus subset fetch for the current DOM and resolve
 * once the fonts have actually rendered (or the safety timeout fires).
 * Always resolves — never rejects — so callers can `await` it inline
 * without try/catch.
 */
export function reloadFontPlus(): Promise<void> {
	return waitForFontPlus()
		.then(
			(fp) =>
				new Promise<void>((resolve) => {
					let settled = false;
					const finish = () => {
						if (settled) return;
						settled = true;
						resolve();
					};

					// Hard ceiling so the page never waits forever for fonts.
					const safety = window.setTimeout(finish, RELOAD_WAIT_MS);

					fp.attachCompleteEvent(() => {
						window.clearTimeout(safety);
						finish();
					});

					try {
						fp.reload(true);
					} catch {
						window.clearTimeout(safety);
						finish();
					}
				})
		)
		.catch(() => undefined);
}
