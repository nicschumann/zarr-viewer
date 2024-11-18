import * as zarr from "zarrita";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { read } from "./read-metadata";

export type ZarrObject = zarr.Array<zarr.DataType, any> | zarr.Group<any>;

export type ZarrEmpty = {
  type: "empty";
  children: { [name: string]: ZarrTree };
};

export type ZarrGroup = {
  type: "group";
  path: string;
  name: string;
  ref: zarr.Group<any>;
  children: { [name: string]: ZarrTree };
};

export type ZarrArray = {
  type: "array";
  name: string;
  path: string;
  ref: zarr.Array<zarr.DataType, any>;
  children: { [name: string]: ZarrTree };
};

export type ZarrTree = ZarrGroup | ZarrArray | ZarrEmpty;

export type HTTPZarrStore = {
  type: "http";
  uri: string;
  loaded: boolean;
  keys: { [key: string]: ZarrTree };
  tree: ZarrTree;
};

export type Uninitialized = {
  type: "uninitialized";
  keys: {};
};

export type ZarrStore = HTTPZarrStore | Uninitialized;

export type IndexType = null | number | [number, number];

export type DimensionMapping = { x: string; y?: string };

export type ZarrViewer = {
  // NOTE(Nic): path pointing at array variable we want to visualize
  // should be a key in the .store's keys object.
  path: string;
  selection: IndexType[];
};

interface ApplicationState {
  store: ZarrStore;
  viewers: ZarrViewer[];
  readHTTPStore: (uri: string) => Promise<void>;
  addViewer: (viewerSpec: ZarrViewer) => void;
}

export const useApplicationState = create<ApplicationState>()(
  immer((set) => ({
    // NOTE(Nic): maybe you should be able to view and walk multiple stores?
    store: {
      type: "http",
      uri: "http://localhost:8000/zarr/goes-fog-tomorrow-0.01-5min.zarr/X",
      loaded: false,
      keys: {},
      tree: { type: "empty", children: {} },
    },
    viewers: [],
    addViewer(viewerSpec) {
      set((state) => {
        state.viewers = [viewerSpec];
      });
    },
    async readHTTPStore(uri) {
      const result = await read(uri);

      set((state) => {
        state.store = result;
      });
    },
  }))
);