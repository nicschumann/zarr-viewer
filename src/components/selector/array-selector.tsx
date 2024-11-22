import { cn } from "@/lib/utils";
import { ApplicationUIZone, FocusState, useApplicationState } from "@/state";
import React, {
  useRef,
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
  MutableRefObject,
  FocusEvent,
} from "react";

type IArraySelectorProps = {
  active: boolean;
} & React.ComponentProps<"div">;

type SelectorState = {
  names: string[];
  dims: number[];
  mapping: { x: number; y: number; prev: "x" | "y" };
  ui: {
    activeDim: number;
    focus: "input" | "axis" | "none";
    errorDims: number[];
  };
};

const getInputElements = (
  parent: MutableRefObject<HTMLDivElement>
): NodeListOf<HTMLInputElement> => {
  return parent.current.querySelectorAll("input");
};

const handleKeydown =
  (
    set: Dispatch<SetStateAction<SelectorState>>,
    parent: MutableRefObject<HTMLDivElement>
  ) =>
  (e: KeyboardEvent) => {
    if (!parent.current) return;
    if (
      e.key !== "ArrowRight" &&
      e.key !== "ArrowLeft" &&
      e.key !== "Escape" &&
      e.key !== "Enter"
    )
      return;

    set((prev) => {
      const inputs = parent.current.querySelectorAll("input");

      if (inputs.length !== prev.dims.length) return prev;
      if (inputs.length <= prev.ui.activeDim) return prev;
      const currIdx = prev.ui.activeDim;

      if (e.key === "Escape" && !e.repeat) {
        const currInput = inputs[currIdx];
        currInput.blur();

        return {
          ...prev,

          ui: {
            ...prev.ui,
            focus: "none",
          },
        };
      }

      if (e.key === "ArrowRight" && !e.repeat && prev.ui.focus !== "input") {
        const nextIdx = (prev.ui.activeDim + 1) % prev.dims.length;
        const nextInput = inputs[nextIdx];
        nextInput.focus();

        return {
          ...prev,

          ui: {
            ...prev.ui,
            activeDim: nextIdx,
            focus: "input",
          },
        };
      }

      if (e.key === "ArrowLeft" && !e.repeat && prev.ui.focus !== "input") {
        const prevIdx =
          (prev.ui.activeDim - 1 + prev.dims.length) % prev.dims.length;
        const prevInput = inputs[prevIdx];
        prevInput.focus();

        return {
          ...prev,

          ui: {
            ...prev.ui,
            activeDim: prevIdx,
            focus: "input",
          },
        };
      }

      if (e.key === "Enter" && !e.repeat) {
        const nextIdx = (prev.ui.activeDim + 1) % prev.dims.length;
        const nextInput = inputs[nextIdx];
        nextInput.focus();

        return {
          ...prev,

          ui: {
            ...prev.ui,
            activeDim: nextIdx,
            focus: "input",
          },
        };
      }

      return prev;
    });
  };

const handleFocus =
  (
    set: Dispatch<SetStateAction<SelectorState>>,
    setFocusData: (focusState: FocusState) => void,
    inputIndex: number,
    focusRegion: ApplicationUIZone
  ) =>
  (e: FocusEvent) => {
    if (focusRegion !== "selector") setFocusData({ region: "selector" });

    set((prev) => {
      return {
        ...prev,

        ui: {
          ...prev.ui,
          focus: "input",
          activeDim: inputIndex,
        },
      };
    });
  };

export default function ArraySelector({
  active,
  className,
}: IArraySelectorProps) {
  /**
   * This will later be pulled out as a prop.
   */
  const [selectorState, setSelectorState] = useState<SelectorState>({
    names: ["time", "channels", "lat", "lon"],
    dims: [1400, 1, 16000, 9000],
    mapping: { x: 3, y: 2, prev: "x" },
    ui: {
      activeDim: 0,
      focus: "input",
      errorDims: [],
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const focusRegion = useApplicationState((state) => state.ui.focus.region);
  const setFocusData = useApplicationState((state) => state.setFocusData);

  useEffect(() => {
    if (!containerRef.current) return;
    if (focusRegion !== "selector") return;
    const inputs = getInputElements(containerRef);

    // make sure the DOM state matches the UI proxy.
    for (let i = 0; i < inputs.length; i += 1) {
      if (
        selectorState.ui.activeDim == i &&
        selectorState.ui.focus == "input"
      ) {
        inputs[i].focus();
      } else {
        inputs[i].blur();
      }
    }

    const localKeydownHandler = handleKeydown(setSelectorState, containerRef);
    window.addEventListener("keydown", localKeydownHandler);

    return () => {
      window.removeEventListener("keydown", localKeydownHandler);
    };
  }, [active, focusRegion]);

  return (
    <div ref={containerRef} className={cn("flex w-fit", className)}>
      {selectorState.dims.map((dim, i) => {
        return (
          <div
            key={`dim-${i}`}
            className={cn(
              "mr-2 last:mr-0",
              "border-2 border-input border-gray-300 rounded-md bg-white",
              active &&
                selectorState.ui.activeDim === i &&
                focusRegion === "selector"
                ? "border-gray-400"
                : ""
            )}
          >
            {/* metadata above */}
            <div className="text-xs p-1 border-b border-gray-20">
              <div className="flex m-auto">
                <span>{selectorState.names[i]}</span>

                {selectorState.mapping.x === i && (
                  <span
                    // drag target
                    className="block ml-2 h-[16px] w-[16px] bg-red-300 text-red-700  rounded-sm text-xs uppercase text-center"
                  >
                    X
                  </span>
                )}
                {selectorState.mapping.y === i && (
                  <span
                    // drag target
                    className="block ml-2 h-[16px] w-[16px] bg-blue-300 text-blue-700 rounded-sm text-xs uppercase text-center"
                  >
                    Y
                  </span>
                )}
                {selectorState.mapping.x !== i &&
                  selectorState.mapping.y !== i && (
                    <span
                      // drag target
                      className="block ml-2 h-[16px] w-[16px] border border-gray-300 rounded-sm"
                    ></span>
                  )}
              </div>
            </div>
            {/* input above */}
            <div className="text-xs text-center w-fit">
              <input
                className={cn(
                  "flex h-7 w-[10ch] m-1 rounded-md bg-background py-2 px-3 text-md ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none  focus-visible:bg-gray-200 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                )}
                onFocus={handleFocus(
                  setSelectorState,
                  setFocusData,
                  i,
                  focusRegion
                )}
                defaultValue={0}
                min={0}
                max={dim}
              />
            </div>
            {/* metadata below */}
            <div className="text-xs p-1 border-t border-gray-20">
              <div className="flex w-fit m-auto">
                <span className="text-gray-400">units</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
