import * as zarr from "zarrita";

import {
  HTTPZarrStore,
  ZarrArray,
  ZarrGroup,
  ZarrStore,
  ZarrTree,
} from "@/state";
import { ArrayIndexer, CoordsMap, DateArrayIndexer, getIdxForSingleArr } from "@/lib/larray";

const getCoords = async(root, keys: { [key: string]: ZarrTree }) => {
  // populate coords mapping for the store
  // TODO(oli): include store + group prefix in coord keys
  debugger;
  const coords = {}
  for (let [k, v] of Object.entries(keys)) {
    if (v.type == "array") {
      const dims = v.ref.attrs._ARRAY_DIMENSIONS;
      if (!Array.isArray(dims)) {
        throw new Error("Dims is not an array");
      }
      for (const dimName of dims) {
        if (dimName in coords) {
          continue;
        }
        const coordArray = await zarr.open(root.resolve(`/${dimName}`), {
          kind: "array",
        });
        coords[dimName] = await getIdxForSingleArr(dimName, coordArray);
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
      const contents: { path: string; kind: string }[] = zarrStore.contents();

      const data = await Promise.all(
        contents.map(async ({ path, kind }) => {
          return await zarr.open(root.resolve(path));
        })
      );

      const { tree, keys } = buildtree(uri, data);

      const coords = await getCoords(root, keys);

      const result: ZarrStore = {
        type: "http",
        uri,
        loaded: true,
        keys,
        tree,
        coords
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

      const coords = await getCoords(root, { [record.path]: record });

      const result: ZarrStore = {
        type: "http",
        uri,
        loaded: true,
        keys: { [record.path]: record },
        tree: record,
        coords
      };

      return result;
    }

    // const arr = await zarr.open(zarrStore);
    // console.log(arr);
  } catch (e) {
    return {
      type: "error",
      message: e.message,
    };
  }
};
