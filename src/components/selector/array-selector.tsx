import { cn } from "@/lib/utils";
import {
  ApplicationUIZone,
  FocusState,
  useApplicationState,
  ZarrView,
} from "@/state";
import { CommandIcon, CornerDownLeft, Plus } from "lucide-react";
import React, {
  useRef,
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
  MutableRefObject,
  FocusEvent,
  ChangeEvent,
} from "react";
import { ArrayIndexer, coordsFromZarr } from "@/lib/larray";

type IArraySelectorProps = {
  viewer: ZarrView;
  viewerIdx: number;
  active: boolean;
} & React.ComponentProps<"div">;

const getInputElements = (
  parent: MutableRefObject<HTMLDivElement>
): NodeListOf<HTMLInputElement> => {
  return parent.current.querySelectorAll("input");
};

const handleKeydown =
  (
    numDims: number,
    setLocalUI: Dispatch<SetStateAction<LocalUIData>>,
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

    setLocalUI((prev) => {
      const inputs = getInputElements(parent);

      if (inputs.length !== numDims) return prev;
      if (inputs.length <= prev.activeDim) return prev;
      const currIdx = prev.activeDim;

      if (e.key === "Escape" && !e.repeat) {
        const currInput = inputs[currIdx];
        currInput.blur();

        return {
          ...prev,
          focus: "none",
        };
      }

      if (e.key === "ArrowRight" && !e.repeat && prev.focus !== "input") {
        const nextIdx = (prev.activeDim + 1) % numDims;
        const nextInput = inputs[nextIdx];
        nextInput.focus();

        return {
          ...prev,
          activeDim: nextIdx,
          focus: "input",
        };
      }

      if (e.key === "ArrowLeft" && !e.repeat && prev.focus !== "input") {
        const prevIdx = (prev.activeDim - 1 + numDims) % numDims;
        const prevInput = inputs[prevIdx];
        prevInput.focus();

        return {
          ...prev,
          activeDim: prevIdx,
          focus: "input",
        };
      }

      if (e.key === "Enter" && !e.repeat && !e.metaKey) {
        const nextIdx = (prev.activeDim + 1) % numDims;
        const nextInput = inputs[nextIdx];
        nextInput.focus();

        return {
          ...prev,
          activeDim: nextIdx,
          focus: "input",
        };
      }

      if (e.key === "Enter" && !e.repeat && e.metaKey) {
        const nextIdx = (prev.activeDim + 1) % numDims;
        const nextInput = inputs[nextIdx];
        nextInput.focus();

        return {
          ...prev,
          activeDim: nextIdx,
          focus: "input",
        };
      }

      return prev;
    });
  };

const handleFocus =
  (
    setFocusData: (focusState: FocusState) => void,
    setLocalUI: Dispatch<SetStateAction<LocalUIData>>,
    viewerIdx: number,
    inputIndex: number,
    focusRegion: ApplicationUIZone
  ) =>
  (_: FocusEvent) => {
    if (focusRegion !== "selector")
      // NOTE(Nic): this should take the current viewer index as a param as well.
      setFocusData({
        region: "selector",
        viewerIdx,
      });

    setLocalUI((prev) => ({
      ...prev,
      activeDim: inputIndex,
      part: "input",
    }));
  };

type LocalUIData = {
  activeDim: number;
  focus: "input" | "axis" | "none";
  errorDims: number[];
};

function isIntegerOrSlice(input) {
  return /^(\d+)(?::(\d+)?)?$/.test(input);
}

export default function ArraySelector({
  viewer,
  viewerIdx,
  className,
  style,
}: IArraySelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stores = useApplicationState((state) => state.stores);
  const focus = useApplicationState((state) => state.ui.focus);

  const setFocusData = useApplicationState((state) => state.setFocusData);
  const updateViewer = useApplicationState((state) => state.updateViewer);
  const setViewerShouldDraw = useApplicationState(
    (state) => state.setViewerShouldDraw
  );

  const store = stores[viewer.store];

  /**
   * Return an error if there's no such store for this viewer
   */
  if (typeof store === "undefined") {
    return (
      <div
        ref={containerRef}
        className={cn("flex w-fit", className)}
        style={style}
      >
        <div>No Such Store: {viewer.store}</div>
      </div>
    );
  }

  const tree = store.keys[viewer.path];

  /**
   * Return an error if the view requests a key that's not defined in the store.
   */
  if (typeof tree === "undefined") {
    return (
      <div
        ref={containerRef}
        className={cn("flex w-fit", className)}
        style={style}
      >
        <div>No Such Path in Store: {viewer.path}</div>
      </div>
    );
  }

  /**
   * Now, make sure we're dealing with an array; it should be impossible for
   * a viewer to select into a group.
   */
  if (tree.type === "group") {
    return (
      <div
        ref={containerRef}
        className={cn("flex w-fit", className)}
        style={style}
      >
        <div>A selector cannot select into a group!</div>
      </div>
    );
  }

  const dims = tree.ref.shape;
  /**
   * NOTE(Nic): Name Heuristics could be implemented here...
   */
  const names = dims.map((_, i) =>
    typeof tree.ref.attrs._ARRAY_DIMENSIONS !== "undefined"
      ? (tree.ref.attrs._ARRAY_DIMENSIONS[i] as string)
      : "unnamed"
  );

  const [localUI, setLocalUI] = useState<LocalUIData>({
    activeDim: 0,
    focus: "input",
    errorDims: [],
  });


  /**
   * NOTE(Nic): This useEffect sets up keyboard handling iff the user is focused on
   * the current selector panel, otherwise it returns. We only run this if we've
   * already passed all of the sanity checks above, of course.
   */
  useEffect(() => {
    if (!containerRef.current) return;
    if (focus.region !== "selector") return;
    const inputs = getInputElements(containerRef);

    // make sure the DOM state matches the UI proxy.
    for (let i = 0; i < inputs.length; i += 1) {
      if (localUI.activeDim == i && localUI.focus == "input") {
        inputs[i].focus();
      } else {
        inputs[i].blur();
      }
    }

    const localKeydownHandler = handleKeydown(
      dims.length,
      setLocalUI,
      containerRef
    );
    window.addEventListener("keydown", localKeydownHandler);

    return () => {
      window.removeEventListener("keydown", localKeydownHandler);
    };
  }, [focus.region, dims]);

  const handleLabelChange = (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // find coordinate indexer
    const prefix = viewer.path.split('/').slice(0, -1).join('/')
    const coordKey = [prefix, names[i]].join('/');
    const labelIdx: ArrayIndexer = store.coordinateIndexKeys[coordKey];

    const slice = val.split(" : ");

    const indices = slice.map(s => {
      try {
        const checkValue = labelIdx.fromString(s);
        const idx = labelIdx.indexOf(checkValue);
        return idx;
      } catch (err) {
        console.log("Invalid value or value not found in index")
      }
    })

    let updateInputValue;

    if (slice.length == 1) {
      if ((indices.length == 1) && indices[0] >= 0) {
        updateInputValue = `${indices[0]}`;
      } else {
        // pass
      }
    } else {
      if ((indices[0] >= 0 && indices[1] >= 0)) {
        if ((indices[1] > indices[0])) {
          updateInputValue = indices.join(" : ")
        }
      } else if (indices[0] >= 0) {
        updateInputValue = `${indices[0]} : ${slice[1]}`
      } else if (indices[1] >= 0) {
        updateInputValue = `${slice[0]} : ${indices[1]}`
      }
    }

    if (updateInputValue) {
      const indexTarget = e.target.parentElement.parentElement.parentElement.querySelector('.index');
      indexTarget.value = updateInputValue;
      setNewValues(updateInputValue, i, e.target)
    }

  };

  const setNewValues = (val, i, labelTarget) => {

    if (!isIntegerOrSlice(val)) {
      setLocalUI((p) => ({ ...p, errorDims: [i, ...p.errorDims] }));
    } else {
      setLocalUI((p) => ({
        ...p,
        errorDims: p.errorDims.filter((dim) => dim !== i),
      }));

      const newViewerSpec: ZarrView = {
        ...viewer,
      };

      /**
       * NOTE(Nic): very simple and bad validation for now. We have to update the selection
       * by replacing the array because otherwise the state watchers won't trigger properly :C
       */
      /**
       * TODO(Nic): add heuristics about whether the view should draw here...
       * TODO(Oli): Retrieve the indices from the Indexer rather than manually computing here
       */
      // persist the selected indices for subsequent mapping to labels
      let sel = []
      if (val.indexOf(":") !== -1) {
        const slice = val.split(":");
        if (slice.length !== 2) {
          setLocalUI((p) => ({ ...p, errorDims: [i, ...p.errorDims] }));
        } else if (slice[0] === "" && slice[1] === "") {
          newViewerSpec.selection = newViewerSpec.selection.map((v, j) =>
            j === i ? null : v
          );
        } else if (slice[0].length > 0 && slice[1] === "") {
          newViewerSpec.selection = newViewerSpec.selection.map((v, j) =>
            j === i ? [parseInt(slice[0]), dims[i]] : v
          );
          sel.push(parseInt(slice[0]), dims[i])
        } else if (slice[0] === "" && slice[1].length > 0) {
          newViewerSpec.selection = newViewerSpec.selection.map((v, j) =>
            j === i ? [0, parseInt(slice[1])] : v
          );
          sel.push(0, parseInt(slice[1]))
        } else {
          newViewerSpec.selection = newViewerSpec.selection.map((v, j) =>
            j === i ? [parseInt(slice[0]), parseInt(slice[1])] : v
          );
          sel.push(parseInt(slice[0]), parseInt(slice[1]))
        }
        newViewerSpec.drawing = false;
      } else {
        newViewerSpec.selection = newViewerSpec.selection.map((v, j) =>
          j === i ? parseInt(val) : v
        );

        sel.push(parseInt(val))
      }

      const prefix = viewer.path.split('/').slice(0, -1).join('/')
      const coordKey = [prefix, names[i]].join('/');
      const labelIdx: ArrayIndexer = store.coordinateIndexKeys[coordKey];
      const targetLabelValues = sel.map(v => labelIdx.valHuman(v));
      // TODO(Oli): use react ;)
      labelTarget.value = targetLabelValues.join(' : ');
      updateViewer(viewerIdx, newViewerSpec);
    }

  }


  const handleDimChange = (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewValues(val, i, e.target.parentElement.parentElement.querySelector('.label'));
  };

  const handleShouldDraw = () => {
    // TODO(Nic): validate
    setViewerShouldDraw(viewerIdx, true);
  };

  return (
    <div
      ref={containerRef}
      className={cn("flex w-fit", className)}
      style={style}
    >
      {dims.map((dim, i) => {
        return (
          <div
            key={`dim-${i}`}
            className={cn(
              "mr-2 last:mr-0",
              "border-2 border-input border-gray-300 rounded-md bg-white",
              focus.region === "selector" && localUI.activeDim === i
                ? "border-gray-400"
                : "",
              localUI.errorDims.includes(i) ? "border-red-400" : ""
            )}
          >
            {/* metadata above */}
            <div className="flex text-xs p-1 border-b border-gray-20">
              <div className="flex mx-auto">
                <span>{names[i]}</span>

                {viewer.mapping.x === i && (
                  <span
                    // drag target
                    className="block ml-2 h-[16px] w-[16px] bg-red-300 text-red-700  rounded-sm text-xs uppercase text-center"
                  >
                    X
                  </span>
                )}
                {viewer.mapping.y === i && (
                  <span
                    // drag target
                    className="block ml-2 h-[16px] w-[16px] bg-blue-300 text-blue-700 rounded-sm text-xs uppercase text-center"
                  >
                    Y
                  </span>
                )}
                {viewer.mapping.x !== i && viewer.mapping.y !== i && (
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
                  "index flex h-7 w-[25ch] m-1 rounded-md bg-background py-2 px-3 text-md ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none  focus-visible:bg-gray-200 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                )}
                onFocus={handleFocus(
                  setFocusData,
                  setLocalUI,
                  viewerIdx,
                  i,
                  focus.region
                )}
                onChange={handleDimChange(i)}
                defaultValue={0}
                min={0}
                max={dim}
              />
            </div>
            {/* metadata below */}
            <div className="text-xs p-1 border-t border-gray-20">
              <div className="flex w-fit m-auto">
                <input
                  className={cn(
                    "flex h-7 w-[25ch] m-1 rounded-md bg-background py-2 px-3 text-md ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none  focus-visible:bg-gray-200 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm label"
                )}
                onKeyUp={handleLabelChange(i)}
                />
              </div>
            </div>
          </div>
        );
      })}
      <div
        onMouseDown={handleShouldDraw}
        className={cn(
          "flex items-center mr-2 last:mr-0",
          "border-2 border-input border-gray-400 rounded-md bg-gray-300 p-2"
        )}
      >
        <CommandIcon size={18} />
        <Plus size={18} />
        <CornerDownLeft size={18} />
      </div>
    </div>
  );
}
