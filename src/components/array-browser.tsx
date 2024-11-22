import React, { useRef, useEffect } from "react";

import Input from "@/components/ui/input";
import { HTTPZarrStore, useApplicationState } from "@/state";
import clsx from "clsx";
import { readStore } from "@/state/read-metadata";
import ZarrBrowser from "./zarr-browser";

export default function ArraySelector() {
  const currentStore = useApplicationState((s) => s.store);
  const currentViewer = useApplicationState((s) => s.viewers[0]);
  const readHTTPStore = useApplicationState((s) => s.readHTTPStore);
  const addViewer = useApplicationState((s) => s.addViewer);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const inputElement = inputRef.current;
    if (inputElement) {
      // if we're working with an existing store...
      if (currentStore.type === "http") {
        inputElement.value = currentStore.uri;

        if (!currentStore.loaded) {
          readHTTPStore(currentStore.uri);
        }
      }

      const changeHandler = () => {
        readHTTPStore(inputElement.value);
        inputElement.blur();
      };

      const keydownHandler = (e: KeyboardEvent) => {
        console.log("keydown");
        if (e.key == "ArrowUp" && typeof currentViewer !== "undefined") {
          const sel = currentViewer.selection;
          addViewer({
            ...currentViewer,
            selection: [sel[0] + 1, sel[1], sel[2], sel[3]],
          });
        }

        if (e.key == "ArrowDown" && typeof currentViewer !== "undefined") {
          const sel = currentViewer.selection;
          addViewer({
            ...currentViewer,
            selection: [sel[0] - 1, sel[1], sel[2], sel[3]],
          });
        }
      };

      inputElement.addEventListener("change", changeHandler);

      window.addEventListener("keydown", keydownHandler);

      return () => {
        inputElement.removeEventListener("change", changeHandler);
        window.removeEventListener("keydown", keydownHandler);
      };
    }
  }, [currentViewer]);

  return (
    <section className="absolute top-0 left-0 h-screen w-screen z-10">
      <section className={clsx("flex m-2")}>
        <div className={clsx("mb-4", "")}>
          <Input
            ref={inputRef}
            placeholder="http://my-store.zarr"
            className="mb-2 w-[600px]"
          />
          {currentStore.type === "uninitialized" && (
            <div className="text-xs text-gray-400 p-2">
              We support any zarr store accessible via an HTTP API. We do not
              currently support direct s3 access. Drop us a line if you’d like
              to see that!{" "}
            </div>
          )}
          {currentStore.type === "http" && currentStore.loaded && (
            <ZarrBrowser store={currentStore} />
          )}
        </div>
      </section>
      {typeof currentViewer !== "undefined" &&
        currentStore.keys[currentViewer.path] && (
          <section className="absolute bottom-0 flex w-full">
            <div className="mx-auto  rounded-md border border-input bg-background px-3 py-2 flex mb-2">
              {currentViewer.selection.map((sel, i) => {
                return (
                  <div key={`dim-${i}`} className="px-2 text-center">
                    <div className="text-xs mb-1">
                      <span>
                        {
                          currentStore.keys[currentViewer.path].ref.attrs
                            ._ARRAY_DIMENSIONS[i]
                        }
                      </span>
                      {i == currentViewer.mapping[0] && <span> (X)</span>}
                      {i == currentViewer.mapping[1] && <span> (Y)</span>}
                    </div>
                    {typeof sel === "number" && <div>{sel}</div>}
                    {sel === null && <div>:</div>}
                    {typeof sel === "object" && (
                      <div>
                        {sel[0]}:{sel[1]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
    </section>
  );
}
