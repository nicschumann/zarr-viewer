// sum.test.js
import { expect, test } from 'vitest'
import ndarray from "ndarray";
import { ArrayIndexer, coordsFromZarr, Slice } from './larray.js'
import * as zarr from "zarrita";
import { get, slice } from "@zarrita/indexing";

function* range(
	start: number,
	stop?: number,
	step = 1,
): Iterable<number> {
	if (stop === undefined) {
		stop = start;
		start = 0;
	}
	for (let i = start; i < stop; i += step) {
		yield i;
	}
}

// TODO: super hardcoded for now
const mkTestArr = async (name: string): Promise<zarr.Array<zarr.DataType, any>> => {
	let h = zarr.root();
	let a = await zarr.create(h.resolve(`/${name}`), {
		shape: [100],
		chunk_shape: [100],
		data_type: "int32",
    attributes: {
      // NOTE: this is xarray convention, not a standard!
      _ARRAY_DIMENSIONS: [name]
    }
	});
  expect(a).toBeInstanceOf(zarr.Array);
  // easiest way to set a complete array?
  const arr = ndarray(new Int32Array(range(0, 100 * 5, 5)), [100]);
  await zarr.set(a, null, arr);
  return await zarr.open(h.resolve(`/${name}`), { kind: "array" });
}

test('indexer slices', async () => {
  const array = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const idxr = new ArrayIndexer(array);

  const filter: Slice = {start: 25, stop: 75};
  const first = idxr.sel(filter)
  const expectedFirstVals = [30, 40, 50, 60, 70];
  expect(first.vals).toStrictEqual(expectedFirstVals);

  // no mutation with subsequent selects
  const second = idxr.sel({start: 35, stop: 55});
  expect(second.vals).toStrictEqual([40, 50]);
  expect(first.vals).toStrictEqual(expectedFirstVals);
})

test('indexer sel + isel', async () => {
  const array = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const idxr = new ArrayIndexer(array);
  const first = idxr.isel({start: 0, stop: 5}).sel(10);
  expect(first.vals).toStrictEqual([10]);
  const second = idxr.isel({start: 5, stop: 8}).sel(10);
  expect(second.vals).toStrictEqual([]);
})

test('indexer select to empty yield empty array', async () => {
  const array = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const idxr = new ArrayIndexer(array);
  const first = idxr.isel(50)
  expect(first.vals).toStrictEqual([]);
  const second = idxr.sel(500)
  expect(second.vals).toStrictEqual([]);
})

test('indexer isel uses appropriate offsets', async () => {
  const array = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const idxr = new ArrayIndexer(array);
  const filter: Slice = {start: 25, stop: 75};
  const first = idxr.sel(filter).isel({start: 0, stop: 1})
  expect(first.vals).toEqual([30]);
})

test('indexer get zarr array slices', async () => {
  const array = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const idxr = new ArrayIndexer(array);
  const filter: Slice = {start: 25, stop: 75};
  const first = idxr.sel(filter);
  expect(first.zindex).toEqual(zarr.slice(2, 7));
  expect(first.sel(30).zindex).toEqual(2);
  expect(first.sel(300).zindex).toEqual(null);
})


test('coordsFromZarr', async () => {
  // create a populated array
  const testArr = await mkTestArr("lat")
  const data = await zarr.get(testArr, [zarr.slice(0, 10)]);
  expect(data.data).toEqual(new Int32Array([0, 5, 10, 15, 20, 25, 30, 35, 40, 45]));

  // generate coord map from array
  const coordMap = await coordsFromZarr(testArr);
  expect(Object.keys(coordMap)).toEqual(["lat"]);
  expect(coordMap.lat).toBeInstanceOf(ArrayIndexer);

  // actually perform a selection and query the zarr store using it
  const filtered = coordMap.lat.sel({start: 20, stop: 50});
  expect(filtered.vals).toEqual([20, 25, 30, 35, 40, 45]);
  const filteredData = await zarr.get(testArr, [filtered.zindex])
  expect(filteredData.data).toEqual(new Int32Array([20, 25, 30, 35, 40, 45]));

});