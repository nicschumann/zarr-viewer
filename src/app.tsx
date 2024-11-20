import * as React from "react";
import ArraySelector from "./components/array-selector";
import ArrayRenderer from "./components/array-renderer";
import { useApplicationState } from "./state";
import * as zarr from "zarrita";
import { coordsFromZarr } from "./lib/larray";
import { useEffect, useState } from "react";

const getCoords = async(storePath) => {
  let store = await zarr.withConsolidated(new zarr.FetchStore(storePath));
  const node = await zarr.open.v2(store);
  const arr = await zarr.open.v2(node.resolve('/X'), { kind: "array" });

  if (arr instanceof zarr.Array) {
    return await coordsFromZarr(arr);
  }
}

const getURLParams = (): URLSearchParams => {
  const queryString = window.location.search;
  return new URLSearchParams(queryString);
}


export default function App() {
  const viewers = useApplicationState((store) => store.viewers);;
  const readHTTPStore = useApplicationState((s) => s.readHTTPStore);
  const addViewer = useApplicationState((s) => s.addViewer);


  useEffect(() => {
    const urlParams = getURLParams();
    const storePath = urlParams.get('store');
    const varName = urlParams.get('var');
    const time = new Date(urlParams.get('time'));
    const channel = urlParams.get('channel');
    const latStart = Number.parseFloat(urlParams.get('lat-start'));
    const latStop = Number.parseFloat(urlParams.get('lat-stop'));
    const lonStart = Number.parseFloat(urlParams.get('lon-start'));
    const lonStop = Number.parseFloat(urlParams.get('lon-stop'));


    async function getData() {

      await readHTTPStore(storePath);
      const coordsMap = await getCoords(storePath);
      let timeIndex, channelIndex, latIndex, lonIndex;
      latIndex = coordsMap.lat.sel({start: latStart, stop: latStop});
      lonIndex = coordsMap.lon.sel({start: lonStart, stop: lonStop});
      // timeIndex = coordsMap.time.isel({start: 421192, stop: 421195});
      timeIndex = coordsMap.time.sel(time);
      channelIndex = coordsMap.channel.isel(0);

      const indices = [
        timeIndex.zindex,
        channelIndex.zindex,
        latIndex.zindex,
        lonIndex.zindex,
      ]

      addViewer({
        path: `goes-fog-tomorrow-0.01-5min.zarr/${varName}`,
        selection: indices, // [421192, 0, [12600, 12900], [5600, 5900]],
        mapping: [3, 2],
      });

    };

    getData();
  }, []);
  return (
    <>
      {/* <React.StrictMode> */}

      <section className="absolute top-0 left-0 border">
        {viewers.length > 0 && <ArrayRenderer viewer={viewers[0]} />}
      </section>
      <ArraySelector />
      {/* </React.StrictMode> */}
    </>
  );
}
