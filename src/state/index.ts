import * as zarr from "zarrita";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { readStore } from "./read-metadata";
import { ArrayIndexer, CoordsMap } from "@/lib/larray";

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
  coordinateIndexKeys: CoordsMap;
};

export type ZarrStore = HTTPZarrStore;

export type IndexType = null | number | [number, number]; // no striding

export type DimensionMapping = { x: number; y?: number };

export type ZarrView = {
  // NOTE(Nic): path pointing at array variable we want to visualize
  // should be a key in the .store's keys object.
  state: "initialized" | "uninitialized";
  drawing: boolean;
  //
  store: string;
  path: string;
  //
  selection: IndexType[];
  mapping: DimensionMapping; // this maps array dims (u, v, w, ...) to layout dims (x, y)
};

export type ApplicationUIZone = "browser" | "selector" | "editor";

export type BrowserState = {
  state: "expanded" | "collapsed";
};

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
    browser: BrowserState;
    focus: FocusState;
  };
  stores: { [name: string]: ZarrStore };
  viewers: ZarrView[];
  addStore: (zarrStore: ZarrStore) => void;
  addViewer: (viewerSpec: ZarrView) => void;
  removeViewer: (viewerIdx: number) => void;
  updateViewer: (index: number, viewerSpec: ZarrView) => void;
  setViewerShouldDraw: (index: number, shouldDraw: boolean) => void;
  setFocusData: (focusState: FocusState) => void;
  setBrowserUIState: (browserState: BrowserState) => void;
}

export const useApplicationState = create<ApplicationState>()(
  immer((set) => ({
    // state:
    ui: {
      browser: {
        state: "collapsed",
      },
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
    removeViewer(viewerIdx) {
      set((state) => {
        state.viewers = state.viewers.filter((v, idx) => idx !== viewerIdx);
      });
    },
    updateViewer(index, viewerSpec) {
      set((state) => {
        if (index >= 0 && index < state.viewers.length) {
          state.viewers[index] = viewerSpec;
        }
      });
    },
    setViewerShouldDraw(index, shouldDraw) {
      set((state) => {
        if (index >= 0 && index < state.viewers.length) {
          state.viewers[index].drawing = shouldDraw;
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
    setBrowserUIState(browserState) {
      set((state) => {
        state.ui.browser = browserState;
      });
    },
  }))
);
