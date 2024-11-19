import * as zarr from "zarrita";

import {
  HTTPZarrStore,
  ZarrArray,
  ZarrGroup,
  ZarrStore,
  ZarrTree,
} from "@/state";

const buildtree = (
  uri: string,
  contents: (zarr.Array<zarr.DataType, any> | zarr.Group<any>)[]
): { tree: ZarrTree; keys: { [name: string]: ZarrTree } } => {
  const uriParts = uri.split("/");
  const storeName = uriParts[uriParts.length - 1];
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

  return { tree: subtrees[storeName], keys };
};

export const read = async (uri: string) => {
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

      // console.log(data);
      const result: ZarrStore = {
        type: "http",
        uri,
        loaded: true,
        keys,
        tree,
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

      const result: ZarrStore = {
        type: "http",
        uri,
        loaded: true,
        keys: { [record.path]: record },
        tree: record,
      };

      return result;
    }

    // const arr = await zarr.open(zarrStore);
    // console.log(arr);
  } catch (e) {
    console.log(e);
  }
};
