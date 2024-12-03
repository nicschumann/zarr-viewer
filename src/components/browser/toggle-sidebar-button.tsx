import { cn } from "@/lib/utils";
import { BrowserState, useApplicationState } from "@/state";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import React, { HTMLProps } from "react";

const browserStateUpdate: Record<BrowserState["state"], BrowserState["state"]> =
  {
    expanded: "collapsed",
    collapsed: "expanded",
  };

export default function ToggleSidebarButton({
  className,
  style,
}: HTMLProps<HTMLDivElement>) {
  const browserUI = useApplicationState((state) => state.ui.browser);

  const setBrowserUIState = useApplicationState(
    (state) => state.setBrowserUIState
  );

  const handleClick = () => {
    setBrowserUIState({
      ...browserUI,
      state: browserStateUpdate[browserUI.state],
    });
  };

  return (
    <div
      onClick={handleClick}
      className={cn("rounded-md w-[50px]", className)}
      style={style}
    >
      <div className="flex items-center cursor-pointer">
        <div className="flex items-center text-center m-2 w-[28px] h-[28px] rounded-[100%] bg-gray-200">
          <div className="text-md font-bold mx-auto text-white">
            {browserUI.state === "expanded" && <PanelLeftClose width={20} />}
            {browserUI.state !== "expanded" && <PanelLeftOpen width={20} />}
          </div>
        </div>
      </div>
    </div>
  );
}
