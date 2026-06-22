# ReleaseMgr (DWC 3.7 port)

ReleaseMgr is a DuetWebControl plugin to help with your RRF firmware updating experience.
It scans your current hardware and `config.g` information, and highlights lines in the release notes
that **may** impact your current configuration.
Through the GitHub API it displays the release information and provides download links for the
released files. The plugin supports **RRF, DWC, DSF (SBC), and Team Gloomy** releases.

> This repository is a **fork** of [MintyTrebor/ReleaseMgr](https://github.com/MintyTrebor/ReleaseMgr),
> ported to **DuetWebControl 3.7** (Vue 3 / Vuetify 4 / Pinia). All credit for the original plugin and
> its design goes to Minty Trebor. Licensed GPL-3.0-or-later, same as upstream.

## What the 3.7 port changes

- **Vue 3 / Vuetify 4 / Pinia** rewrite of every component (the original targeted DWC 3.5/Vue 2).
- Build moved from the old webpack chunk to the standard 3.7 external-plugin **Vite** build, via
  [`dwc-plugin-test-kit`](https://github.com/jaysuk/dwc-plugin-test-kit) (typecheck / tests / CI).
- **Self-update + diagnostics** through [`dwc-plugin-runtime`](https://github.com/jaysuk/dwc-plugin-runtime),
  so it participates in Flexible Layouts' unified plugin-update popup.
- Network calls use native `fetch` (the `axios` dependency was dropped).
- Lives under **Plugins → ReleaseMgr**.

## Develop

```bash
npm install
npm test
DWC_DIR=/path/to/DuetWebControl npm run typecheck
DWC_DIR=/path/to/DuetWebControl npm run verify-build
```

Releases: `npm run release -- <version> --push` (bumps `plugin.json` + `package.json`, tags, and the
CI builds the installable ZIP and publishes the GitHub Release).

## Disclaimer

All information provided in ReleaseMgr is indicative and should not be taken out of context. You should
not solely rely on ReleaseMgr for evaluating the impact of updating your current firmware/software.
**All release notes should be read in full before updating!**
**You are fully responsible for the consequences of updating your firmware.**
*Superseded Beta and RC firmware versions are not generally supported, and using them is at your own risk.*

## License

GPL-3.0-or-later.
