import * as zarr from "zarrita";
import { num2date, date2num } from "./cf-time";
import { UnicodeStringArray } from "@zarrita/typedarray"
export interface Slice {
  start: number | Date;
  stop: number | Date;
  step?: number | Date | null;
}
type Predicate = Slice | number | Array<number> | string;
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
  readonly array: Array<number> | Array<string>;
  protected readonly visibleIndexes: Array<number>;

  constructor(
    array: UnicodeStringArray | Array<any>,
    visibleIndexes: Array<number> | null = null
  ) {
    if (array instanceof UnicodeStringArray) {
      // TODO: we can do better than just replicating the array
      // Also, sel slices against this is not valid
      this.array = []
      for (var i=0;i<array.length;i++) {
        this.array.push(array.get(i));
      }
    } else {
      this.array = array;
    }
    this.visibleIndexes = visibleIndexes || Array.from(array).map((_, i) => i);
  }

  // translate a lookup value to a value stored in the underlying array
  protected translateH2A(value: number): number {
   return value;
  }

  protected translateA2H(value: number): number {
    return value;
   }

  public sel(pred: Predicate): ArrayIndexer {
    let visibleIndexes;
    if (isSlice(pred)) {
      const translatedSlice: Slice = {
        start: this.translateH2A(pred.start),
        stop: this.translateH2A(pred.stop),
        step: this.translateH2A(pred.step)
      };
      const startIndex = this.array.findIndex((value) => value >= translatedSlice.start);
      const stopIndex = this.array.findLastIndex((value) => value < translatedSlice.stop);
      visibleIndexes = this.visibleIndexes.filter(
        (v) => v >= startIndex && v <= stopIndex
      );
    } else if (isArray(pred)) {
      const translatedPred = pred.map(this.translateH2A);
      const n = this.array
        .map((v, i) => (translatedPred.indexOf(v) >= 0 ? i : -1))
        .filter((v) => v > -1);
      visibleIndexes = this.visibleIndexes.filter((v) => n.indexOf(v) >= 0);
    } else {
      const translatedPred = this.translateH2A(pred);
      const value = this.array.indexOf(translatedPred);
      if (value >= 0 && this.visibleIndexes.indexOf(value) >= 0) {
        visibleIndexes = [value];
      } else {
        visibleIndexes = [];
      }
    }
    return this.newCopyOf(this.array, visibleIndexes);
  }

  public isel(pred: Predicate) {
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
    return this.newCopyOf(this.array, visibleIndexes);
  }

  protected newCopyOf(array, visibleIndexes): ArrayIndexer {
    return new ArrayIndexer(array, visibleIndexes);
  }

  public get zindex() {
    if (this.visibleIndexes.length > 1) {
      return [
        this.visibleIndexes[0],
        this.visibleIndexes[this.visibleIndexes.length - 1] + 1
      ];
    } else {
      return this.visibleIndexes.length ? this.visibleIndexes[0] : null;
    }
  }

  public get vals() {
    return this.visibleIndexes.map((v) => this.array[v]);
  }

  public get valsHuman() {
    return this.visibleIndexes.map((v) => this.translateA2H(this.array[v]));
  }

  public valHuman(idx: number) {
    const visibleIdx = this.visibleIndexes[idx];
    let v = this.array[visibleIdx]
    if (Number.isFinite(v) && !Number.isInteger(v)) {
      v = parseFloat(v.toFixed(2))
    }
    return this.translateA2H(v);
  }

}

function isTypedNumberArray(arr: any): boolean {
  return (
    ArrayBuffer.isView(arr) &&
    !(arr instanceof DataView) // Exclude DataView, which is also an ArrayBuffer view but not a typed array
  );
}

export class DateArrayIndexer extends ArrayIndexer {

  readonly dateUnits: string;

  constructor(
    array: Array<any>,
    visibleIndexes: Array<number> | null = null,
    units: string
  ) {
    super(array, visibleIndexes)
    this.dateUnits = units;
  }

  protected newCopyOf(array: any, visibleIndexes: any): DateArrayIndexer {
    return new DateArrayIndexer(array, visibleIndexes, this.dateUnits);
  }

  protected translateH2A(value: number | Date): BigInt {
    if (value instanceof Date) {
      return BigInt(date2num([value], this.dateUnits)[0]);
    }
  }

  protected translateA2H(value: number): number | Date {
    return num2date(new BigInt64Array([BigInt(value)]), this.dateUnits)[0];
  }

  public valHuman(idx: number) {
    const visibleIdx = this.visibleIndexes[idx];
    let v = this.array[visibleIdx]
    const d = this.translateA2H(v);
    return d.toISOString();
  }

}

export class StringArrayIndexer extends ArrayIndexer {

  constructor(
    array: Array<any>,
    visibleIndexes: Array<number> | null = null
  ) {
    super(array, visibleIndexes)
  }

  public valHuman(idx: number) {
    let v = this.array[idx]
    const d = this.translateA2H(v);
  }

}

export const getIdxForSingleArr = async (d, coordArray) => {
  const arr = await zarr.get(coordArray);
  const data = arr.data;
  if (d == 'time') {
    return new DateArrayIndexer(data, null, coordArray.attrs.units);
  } else {
    return new ArrayIndexer(data);
  }
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
      if (d == 'time') {
        return [d, new DateArrayIndexer(data, null, coordArray.attrs.units)]
      } else {
        return [d, new ArrayIndexer(data)];
      }
    })
  );
  return Object.fromEntries(coords);
};
