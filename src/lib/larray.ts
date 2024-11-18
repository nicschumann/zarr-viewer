import * as zarr from "zarrita";
export interface Slice {
  start: number;
  stop: number;
  step?: number | null;
}
type Predicate = Slice | number | Array<number>;
type Predicates = Record<string, Predicate>;
export type CoordsMap = Record<string, ArrayIndexer>;

function isSlice(pred: Predicate): pred is Slice {
  return (pred as Slice).start != undefined;
}

function isArray(pred: Predicate): pred is Array<any> {
  return Array.isArray(pred);
}

function isNumber(pred: Predicate): pred is number {
  return Number.isFinite(pred);
}

export class ArrayIndexer {
  readonly array: Array<number>;
  private readonly visibleIndexes: Array<number>;

  constructor(
    array: Array<any>,
    visibleIndexes: Array<number> | null = null
  ) {
    this.array = array;
    this.visibleIndexes = visibleIndexes || Array.from(array).map((_, i) => i);
  }

  sel(pred: Predicate) {
    let visibleIndexes;
    if (isSlice(pred)) {
      const startIndex = this.array.findIndex((value) => value >= pred.start);
      const stopIndex = this.array.findLastIndex((value) => value < pred.stop);
      visibleIndexes = this.visibleIndexes.filter(
        (v) => v >= startIndex && v <= stopIndex
      );
    } else if (isNumber(pred)) {
      const value = this.array.indexOf(pred);
      if (value >= 0 && this.visibleIndexes.indexOf(value) >= 0) {
        visibleIndexes = [value];
      } else {
        visibleIndexes = [];
      }
    } else if (isArray(pred)) {
      const n = this.array
        .map((v, i) => (pred.indexOf(v) >= 0 ? i : -1))
        .filter((v) => v > -1);
      visibleIndexes = this.visibleIndexes.filter((v) => n.indexOf(v) >= 0);
    }
    return new ArrayIndexer(this.array, visibleIndexes);
  }

  isel(pred: Predicate) {
    let visibleIndexes;
    if (isSlice(pred)) {
      visibleIndexes = this.visibleIndexes.slice(pred.start, pred.stop);
    } else if (isNumber(pred)) {
      if (pred < this.visibleIndexes.length) {
        visibleIndexes = [this.visibleIndexes[pred]];
      } else {
        visibleIndexes = [];
      }
    } else if (isArray(pred)) {
      visibleIndexes = this.visibleIndexes.filter(
        (v, i) => pred.indexOf(i) >= 0
      );
    }
    return new ArrayIndexer(this.array, visibleIndexes);
  }

  get zindex() {
    if (this.visibleIndexes.length > 1) {
      return zarr.slice(
        this.visibleIndexes[0],
        this.visibleIndexes[this.visibleIndexes.length - 1] + 1
      );
    } else {
      return this.visibleIndexes.length ? this.visibleIndexes[0] : null;
    }
  }

  get vals() {
    console.log(this.visibleIndexes);
    return this.visibleIndexes.map((v) => this.array[v]);
  }
}

function isTypedNumberArray(arr: any): boolean {
  return (
    ArrayBuffer.isView(arr) &&
    !(arr instanceof DataView) // Exclude DataView, which is also an ArrayBuffer view but not a typed array
  );
}

export const coordsFromZarr = async (
  node: zarr.Array<zarr.DataType,any>
): Promise<CoordsMap> => {
  const dims = node.attrs._ARRAY_DIMENSIONS;
  if (!Array.isArray(dims)) {
    throw new Error("Dims is not an array");
  }
  const coords = await Promise.all(
    dims.map(async (d) => {
      const coordArray = await zarr.open(node.resolve(`/${d}`), {
        kind: "array",
      });
      const arr = await zarr.get(coordArray);
      const data = arr.data;
      return [d, new ArrayIndexer(data)];
    })
  );
  return Object.fromEntries(coords);
};
