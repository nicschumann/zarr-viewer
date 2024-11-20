import { cn } from "@/lib/utils";
import { useApplicationState } from "@/state";
import React, { useRef, useState } from "react";

export default function AddStoreButton() {
  const [expanded, setExpanded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusRegion = useApplicationState((state) => state.ui.focus.region);
  const setFocusZone = useApplicationState((state) => state.setFocusZone);

  const handleClick = () => {
    if (!inputRef.current) return;

    if (!expanded) {
      setExpanded(true);
      inputRef.current.focus();
    } else {
      // submit the request
      setHasError(true);
    }
  };

  const handleFocus = () => {
    if (focusRegion !== "browser") setFocusZone("browser");
  };

  return (
    <div
      className={cn(
        "rounded-md border-2 ",
        focusRegion === "browser" ? "border-gray-400" : "border-white"
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
          {hasError && (
            <div className="bg-red-600 font-bold rounded-sm px-1 py-[3px] absolute top-[50%] right-2 text-red-100 translate-y-[-50%]">
              Error!
              <span
                onClick={() => setHasError(false)}
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
