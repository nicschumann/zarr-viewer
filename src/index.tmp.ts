import create_regl from "regl";
import * as zarr from "zarrita";
import { get } from "@zarrita/indexing";
import { coordsFromZarr } from "./lib/larray";

  window.onload = async () => {

    const storePath = "http://localhost:3000/goes-fog-tomorrow-0.01-5min.zarr/";
    let store = await zarr.withConsolidated(new zarr.FetchStore(storePath));
    const node = await zarr.open.v2(store);
    const arr = await zarr.open.v2(node.resolve('/X'), { kind: "array" });

    if (arr instanceof zarr.Array) {

      const coordsMap = await coordsFromZarr(arr);
      let timeIndex, channelIndex, latIndex, lonIndex;
      latIndex = coordsMap.lat.sel({start: 36, stop: 39});
      lonIndex = coordsMap.lon.sel({start: -124, stop: -121});
      timeIndex = coordsMap.time.isel({start: 421192, stop: 421195});
      channelIndex = coordsMap.channel.isel(0);
      console.log(timeIndex, channelIndex, latIndex, lonIndex)

      const indices = [
        timeIndex.zindex,
        channelIndex.zindex,
        latIndex.zindex,
        lonIndex.zindex,
      ]
      console.log(timeIndex.vals)
      const region = await get(arr, indices);
      console.log(region);
    }
  };