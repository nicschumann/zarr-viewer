import { cn } from "@/lib/utils";
import { useApplicationState } from "@/state";
import { readStore, resultIsError } from "@/state/read-metadata";
import React, { useEffect, useRef, useState } from "react";

type ComponentUIState = {
  state: "loading" | "error" | "normal";
};

export default function AddStoreButton() {
  const [expanded, setExpanded] = useState(false);
  const [uiState, setUIState] = useState<ComponentUIState>({ state: "normal" });
  ///
  const inputRef = useRef<HTMLInputElement>(null);
  const focus = useApplicationState((state) => state.ui.focus);
  const setFocusData = useApplicationState((state) => state.setFocusData);

  const handleClick = () => {
    if (!inputRef.current) return;

    if (!expanded) {
      setExpanded(true);
      inputRef.current.focus();
    } else {
      // submit the request
      setUIState({ state: "error" });
    }
  };

  const handleFocus = async () => {
    if (focus.region !== "browser")
      setFocusData({
        region: "browser",
        target: "add",
        storeIdx: -1,
      });
  };

  useEffect(() => {
    if (focus.region !== "browser") return;
    if (focus.target !== "add") return;
    if (inputRef.current === null) return;

    const keydownHandler = async (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const maybeURI = inputRef.current.value;
        if (maybeURI.length > 0 && inputRef.current.validity.valid) {
          setUIState({ state: "loading" });
          const storeOrError = await readStore(maybeURI);
          console.log(storeOrError);
          if (resultIsError(storeOrError)) {
            setUIState({ state: "error" });
          } else {
            setUIState({ state: "normal" });
            // set store in the state array.
          }
        } else {
          setUIState({ state: "error" });
        }
      }
    };

    window.addEventListener("keydown", keydownHandler);

    return () => {
      window.removeEventListener("keydown", keydownHandler);
    };
  }, [focus.region]);

  return (
    <div
      className={cn(
        "rounded-md border-2 ",
        focus.region === "browser" ? "border-gray-400" : "border-white"
      )}
    >
      <div className="flex items-center cursor-pointer">
        <div
          onClick={handleClick}
          className="flex items-center text-center m-2 w-[28px] h-[28px] rounded-[100%] bg-gray-700"
        >
          <div className="text-md font-bold mx-auto text-white">
            {/* TODO(Nic): replace this with an actually nice icon please, the plus is not aligned properly. */}
            +
          </div>
        </div>

        <div className={cn("text-sm  text-gray-500 relative")}>
          <input
            ref={inputRef}
            // TODO(Nic): factor this out as part of the layout subsystem.
            style={{ width: `calc(350px - 24px - 3em)` }}
            className={cn(
              "flex h-7 w-full m-1 italic rounded-md bg-background py-2 px-3 text-md ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none  focus-visible:bg-gray-200  focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            )}
            onFocus={handleFocus}
            placeholder="Link A New Zarr Store..."
            type="url"
          />
          {uiState.state === "error" && (
            <div
              className="bg-red-600 font-bold rounded-sm px-1 py-[3px] absolute top-0 right-0 text-red-100 z-10"
              style={{ transform: `translate(50%, -75%)` }}
            >
              Error!
              <span
                onClick={() => setUIState({ state: "normal" })}
                className="ml-3 font-normal"
              >
                [x]
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
