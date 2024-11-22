import * as zarr from "zarrita";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { readStore } from "./read-metadata";

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

export type ZarrStore = HTTPZarrStore;

export type IndexType = null | number | [number, number]; // no striding

export type DimensionMapping = { x: string; y?: string };

export type ZarrViewer = {
  // NOTE(Nic): path pointing at array variable we want to visualize
  // should be a key in the .store's keys object.
  path: string;
  selection: IndexType[];
  mapping: number[]; // this maps array dims (u, v, w, ...) to layout dims (x, y)
};

export type ApplicationUIZone = "browser" | "selector" | "editor";

export type FocusState =
  | {
      region: "browser";
      target: "add" | "store";
      storeIdx: number;
    }
  | { region: "selector" }
  | { region: "editor" };

interface ApplicationState {
  ui: {
    focus: FocusState;
  };
  stores: ZarrStore[];
  viewers: ZarrViewer[];
  addStore: (zarrStore: ZarrStore) => void;
  addViewer: (viewerSpec: ZarrViewer) => void;
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
    stores: [],
    viewers: [],

    // state update methods:
    addViewer(viewerSpec) {
      set((state) => {
        state.viewers = [viewerSpec];
      });
    },
    addStore(zarrStore) {
      set((state) => {
        state.stores.push(zarrStore);
      });
    },
    setFocusData(focusState) {
      set((state) => {
        state.ui.focus = focusState;
      });
    },
  }))
);
