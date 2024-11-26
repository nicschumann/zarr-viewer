import * as zarr from "zarrita";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { readStore } from "./read-metadata";

export type ZarrObject = zarr.Array<zarr.DataType, any> | zarr.Group<any>;

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

export type ZarrTree = ZarrGroup | ZarrArray;

export type HTTPZarrStore = {
  type: "http";
  uri: string;
  loaded: boolean;
  keys: { [key: string]: ZarrTree };
  tree: ZarrTree;
};

export type ZarrStore = HTTPZarrStore;

export type IndexType = null | number | [number, number]; // no striding

export type DimensionMapping = { x: number; y?: number };

export type ZarrView = {
  // NOTE(Nic): path pointing at array variable we want to visualize
  // should be a key in the .store's keys object.
  state: "initialized" | "uninitialized";
  //
  store: string;
  path: string;
  //
  selection: IndexType[];
  mapping: DimensionMapping; // this maps array dims (u, v, w, ...) to layout dims (x, y)
};

export type ApplicationUIZone = "browser" | "selector" | "editor";

export type FocusState =
  | {
      region: "browser";
      target: "add" | "store";
      storeIdx: number;
    }
  | {
      region: "selector";
      viewerIdx: number;
    }
  | { region: "editor" };

// type SelectorState = {
//   names: string[];
//   dims: number[];
//   mapping: { x: number; y: number; prev: "x" | "y" };
//   ui: {
//     activeDim: number;
//     focus: "input" | "axis" | "none";
//     errorDims: number[];
//   };
// };

interface ApplicationState {
  ui: {
    focus: FocusState;
  };
  stores: { [name: string]: ZarrStore };
  viewers: ZarrView[];
  addStore: (zarrStore: ZarrStore) => void;
  addViewer: (viewerSpec: ZarrView) => void;
  updateViewer: (index: number, viewerSpec: ZarrView) => void;
  setFocusData: (focusState: FocusState) => void;
}

export const useApplicationState = create<ApplicationState>()(
  immer((set) => ({
    // state:
    ui: {
      focus: {
        region: "browser",
        target: "add",
        storeIdx: -1,
      },
    },
    stores: {},
    viewers: [],

    // state update methods:
    addViewer(viewerSpec) {
      set((state) => {
        state.viewers.push(viewerSpec);
      });
    },
    updateViewer(index, viewerSpec) {
      set((state) => {
        if (index >= 0 && index < state.viewers.length) {
          state.viewers[index] = viewerSpec;
        }
      });
    },
    addStore(zarrStore) {
      set((state) => {
        state.stores[zarrStore.uri] = zarrStore;
      });
    },
    setFocusData(focusState) {
      set((state) => {
        state.ui.focus = focusState;
      });
    },
  }))
);
