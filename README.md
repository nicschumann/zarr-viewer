# Zarr Viewer

Very dumb and basic `webgl1`-based viewer for `zarr` archives. Geospatial timeseries oriented.

## Development

This project transpiles typescript to javascript using `esbuild`. For package management, we stick to vanilla `npm`. There are only a few packages to manage at that; we try to keep things minimal. To get up and running:

```sh
npm install   # to get all the dependencies
npm run dev   # start a livereload server for development
```

If you want to bundle a "production version" (the only difference is no livereload server), go ahead and `npm run build`. That's it.

_For those who are curious about the transpilation setup, everything is handled through shell scripts that live in the `scripts` folder._

### Style Notes

The `.js` and `.ts` files in this project are formatted with `prettier`. We recommend turning `Format on Save` on in your editor, so that you're only committing properly formatted code. This will avoid ugly diffs.
