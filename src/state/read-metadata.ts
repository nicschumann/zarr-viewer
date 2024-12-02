import * as zarr from "zarrita";

import {
  HTTPZarrStore,
  ZarrArray,
  ZarrGroup,
  ZarrStore,
  ZarrTree,
} from "@/state";
import { ArrayIndexer, CoordsMap, DateArrayIndexer, getIdxForSingleArr } from "@/lib/larray";

/**
 * Given a store root and key mapping for elements in our store, yield
 * coordinate indices for all array coordinates found.
 *
 * @returns
 */
const getCoordsIndices = async(root: zarr.Group<any>, keys: { [key: string]: ZarrTree }): Promise<CoordsMap> => {
  const coords = {}
  for (let [k, v] of Object.entries(keys)) {
    if (v.type == "array") {
      const dims = v.ref.attrs._ARRAY_DIMENSIONS;
      if (!Array.isArray(dims)) {
        throw new Error("Dims is not an array");
      }
      const parts = k.split('/')
      const prefix = parts.slice(0, -1).join('/');
      for (const dimName of dims) {
        const coordKey = `${prefix}/${dimName}`
        // don't refetch if we've already retrieve these coords
        if (coordKey in coords) {
          continue;
        }
        const coordArray = await zarr.open(root.resolve(`${dimName}`), {
          kind: "array",
        });
        coords[coordKey] = await getIdxForSingleArr(dimName, coordArray);
      }
    }
  }
  return coords;
}

const buildtree = (
  uri: string,
  contents: (zarr.Array<zarr.DataType, any> | zarr.Group<any>)[]
): { tree: ZarrTree; keys: { [name: string]: ZarrTree } } => {
  const uriParts = uri.split("/");
  console.log(uriParts);

  const storeName =
    uriParts[uriParts.length - 1].length > 0 // handle trailing slash...
      ? uriParts[uriParts.length - 1]
      : uriParts[uriParts.length - 2];

  const parts = contents.map((value) =>
    (storeName + value.path).split("/").filter((v) => v)
  );

  const subtrees: { [name: string]: ZarrTree } = {};
  const keys: { [name: string]: ZarrTree } = {};

  parts.forEach((sequence, i) => {
    let current = subtrees;
    let data = contents[i];

    sequence.forEach((pathComponent, j) => {
      const path = sequence.slice(0, j + 1).join("/");

      if (
        typeof current[pathComponent] === "undefined" &&
        data.kind === "group"
      ) {
        const record: ZarrGroup = {
          type: data.kind,
          name: pathComponent,
          path,
          ref: data,
          children: {},
        };
        current[pathComponent] = record;
        keys[path] = record;
      } else if (
        typeof current[pathComponent] === "undefined" &&
        data.kind === "array"
      ) {
        const record: ZarrArray = {
          type: data.kind,
          name: pathComponent,
          path,
          ref: data,
          children: {},
        };
        current[pathComponent] = record;
        keys[path] = record;
      }

      current = current[pathComponent].children;
    });
  });

  console.log(subtrees);
  console.log(contents);
  console.log(storeName);

  return { tree: subtrees[storeName], keys };
};

type ReadStoreError = {
  type: "error";
  message: string;
};

export const resultIsError = (
  storeOrError: ZarrStore | ReadStoreError
): storeOrError is ReadStoreError => {
  return storeOrError.type === "error";
};

export const readStore = async (
  uri: string
): Promise<ZarrStore | ReadStoreError> => {
  try {
    let zarrStore = await zarr.tryWithConsolidated(new zarr.FetchStore(uri));
    let root = await zarr.open(zarrStore);
    try {
      // object is a group
      // TODO(oli/nic): refactor the try/catch if/else's here.q
      if (!(root.kind == "group")) {
        throw Error("Can not process non-group")
      }
      const contents: { path: string; kind: string }[] = zarrStore.contents();

      const data = await Promise.all(
        contents.map(async ({ path, kind }) => {
          return await zarr.open(root.resolve(path));
        })
      );

      const { tree, keys } = buildtree(uri, data);

      const result: ZarrStore = {
        type: "http",
        uri,
        loaded: true,
        keys,
        tree,
        coordinateIndexKeys: await getCoordsIndices(root, keys)
      };

      return result;
    } catch (e) {
      // object is an array
      const arrayPath = uri.split("/");
      const name = arrayPath[arrayPath.length - 1];
      const data: zarr.Array<zarr.DataType, any> = root as zarr.Array<
        zarr.DataType,
        any
      >;

      const record: ZarrArray = {
        name,
        path: arrayPath.slice(-2).join("/"),
        type: "array",
        ref: data,
        children: {},
      };

      // to look up coords, we need a root from which to resolve them
      // make a root store at the group/root holding the array
      const prefixUri = arrayPath.slice(0, arrayPath.length-1).join('/');
      const zarrStore = new zarr.FetchStore(prefixUri);
      const tmpRoot = await zarr.open(zarrStore);
      if (!(tmpRoot.kind == "group")) {
        throw Error("Unable to identify array root group")
      }
      const coords = await getCoordsIndices(tmpRoot, { [record.path]: record });
      const result: ZarrStore = {
        type: "http",
        uri,
        loaded: true,
        keys: { [record.path]: record },
        tree: record,
        coordinateIndexKeys: coords
      };

      return result;
    }

  } catch (e) {
    return {
      type: "error",
      message: e.message,
    };
  }
};
