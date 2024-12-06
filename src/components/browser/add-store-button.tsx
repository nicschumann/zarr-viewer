import { cn } from "@/lib/utils";
import { useApplicationState } from "@/state";
import { readStore, resultIsError } from "@/state/read-metadata";
import { Plus, X } from "lucide-react";
import React, { HTMLProps, useEffect, useRef, useState } from "react";

type ComponentUIState = {
  state: "loading" | "error" | "normal";
};

export default function AddStoreButton({
  className,
}: HTMLProps<HTMLDivElement>) {
  const [expanded, setExpanded] = useState(false);
  const [uiState, setUIState] = useState<ComponentUIState>({ state: "normal" });
  ///
  const inputRef = useRef<HTMLInputElement>(null);
  const focus = useApplicationState((state) => state.ui.focus);
  const browserUIState = useApplicationState((state) => state.ui.browser);

  const setFocusData = useApplicationState((state) => state.setFocusData);
  const setBrowserUIData = useApplicationState(
    (state) => state.setBrowserUIState
  );
  const addStore = useApplicationState((state) => state.addStore);

  const handleClick = () => {
    if (!inputRef.current) return;

    if (browserUIState.state !== "expanded") {
      setBrowserUIData({ ...browserUIState, state: "expanded" });
      setExpanded(true);
      setTimeout(() => {
        // need a little delay on this for the UI to transition...
        inputRef.current.focus();
      }, 10);
    } else if (!expanded) {
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
          if (resultIsError(storeOrError)) {
            console.log(storeOrError.message);
            setUIState({ state: "error" });
          } else {
            setUIState({ state: "normal" });
            addStore(storeOrError);
            // TODO(Nic): set the focus region to the newly added store, and expand it.
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
        focus.region === "browser" ? "border-gray-400" : "border-white",
        className
      )}
    >
      <div className="flex items-center cursor-pointer">
        <div
          onClick={handleClick}
          className="flex items-center text-center m-2 w-[28px] h-[28px] rounded-[100%] bg-gray-700"
        >
          <div className="text-md font-bold mx-auto text-white">
            <Plus width={20} />
          </div>
        </div>

        <div className={cn("text-sm  text-gray-500 relative")}>
          <input
            ref={inputRef}
            // TODO(Nic): factor this out as part of the layout subsystem.
            style={{ width: `calc(350px - 24px - 3em)` }}
            className={cn(
              "h-7 w-full m-1 italic rounded-md bg-background py-2 px-3 text-md ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none  focus-visible:bg-gray-200  focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              browserUIState.state === "expanded" ? "flex" : "hidden"
            )}
            onFocus={handleFocus}
            placeholder="Link A New Zarr Store..."
            type="url"
          />
          {uiState.state === "error" && (
            <div
              className="bg-red-600 flex items-center font-bold rounded-sm px-2 py-1 absolute top-0 right-0 text-red-100 z-10"
              style={{ transform: `translate(50%, -75%)` }}
            >
              Error!
              <span
                onClick={() => setUIState({ state: "normal" })}
                className="ml-5 font-normal hover:bg-white rounded-full p-0.5 hover:text-red-600"
              >
                <X size={16} />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
