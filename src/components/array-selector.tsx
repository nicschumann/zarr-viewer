import React, { useRef, useEffect } from "react";

import Input from "@/components/ui/input";
import { HTTPZarrStore, useApplicationState } from "@/state";
import clsx from "clsx";
import { read } from "@/state/read-metadata";
import ZarrBrowser from "./ui/zarr-browser";

export default function ArraySelector() {
  const currentStore = useApplicationState((s) => s.store);
  const readHTTPStore = useApplicationState((s) => s.readHTTPStore);
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

      inputElement.addEventListener("change", changeHandler);

      return () => {
        inputElement.removeEventListener("change", changeHandler);
      };
    }
  }, []);

  return (
    <section className="absolute top-0 left-0 z-10">
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
    </section>
  );
}
