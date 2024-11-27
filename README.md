# Zarr Viewer

Very ~~dumb and basic~~ advanced `webgl1`-based viewer for `zarr` archives. Geospatial timeseries oriented, but aspires to be general purpose.

## Stucture

Thi zarr viewer is a big sandbox for traversing and visualizing zarr stores. This section gives an overview of the components of the interface.

### Browser

You gotta get your zarr stores into the sandbox somehow, right? This is how. You paste a URL to a zarr store (or `group` / `array` within a store), and the system will load the metadata for that store, and give you a nice way traversing it to find arrays.

#### Actions

- Clicking the big plus button will open a text-box where you can paste a zarr url.
- Clicking on a group will open up its contents.
- Clicking on an array, will open up an `Selector` for its contents. You can use the selector to quickly select a slice of the array (limited to `4096  x 4096` right now).
- You can also navigate the array with your keyboard:
  - `up`/`down` arrow keys to move the selection,
  - `left`/`right` arrowkeys to enter/exit a group.
  - `enter`/`right` arrow keys to open an Indexer on an array.
  - `esc` to leave the browser and focus on the big plus, to add another zarr.

### Selector

Once you have selected an array you want to visualize, you need to decide which part of the array space you care about, and which plane you want to visualize. (Note that we only support visualizing a 2D plane at this time.)

#### Actions

- Clicking on an array displays an selector that shows one input field for each dimension in the array.
- Each of these input fields contains a medium-sized box that displays information about that particular dimension:
  - You can enter either a specific index as an Integer (eg. `0`), a range (`0:10`), or select the entire range (eg, `:`).
    - **NOTE**: we should have some way of specifying "interesting selection patterns". This is not figured out yet, but we want to do things like "select 10 indices, then skip the next 15". It strikes me that we can extend the slicing syntax a bit to do that.
  - Above each dimension, the dimension's name appears (eg, `time`), if available.
    - next to the array dimension name, a small box appears. Clicking this box will assign that dimension to one of the two available spatial axes (`X` or `Y`). Clicking multiple times, cycles the axes.
      - by default,
  - Below each dimension, the dimension's unit appears (eg, `5-minute-chunks since January 1st 2015`).
    - clicking on the units (if available) will cycle the dimension display between integer indices and "logical" indices. For example, a time axis will display datetime strings rather than the corresponding integer indices, if you click.
- above only one of the modules an up/down arrow key icon is displayed. This indicates that when the viewer is opened, you will be able to use the arrow keys to seek forward and backwards along that axis.

### Viewer

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
