import * as React from "react";
import ArrayEditor from "./components/editor/array-editor";
import AddStoreButton from "./components/browser/add-store-button";
import StoreDisplay from "./components/browser/store-display";
import { useApplicationState } from "./state";
import ToggleSidebarButton from "./components/browser/toggle-sidebar-button";

export default function App() {
  const focusState = useApplicationState((state) => state.ui.focus);
  const stores = useApplicationState((state) => state.stores);
  const viewers = useApplicationState((state) => state.viewers);
  const browserState = useApplicationState((state) => state.ui.browser.state);

  const margin = `1em`;
  const sidebarOpen = "350px";
  const sidebarClosed = "55px";
  const sidebarWidth = `${
    browserState === "expanded" ? sidebarOpen : sidebarClosed
  } + 2 * ${margin}`;

  return (
    <>
      <React.StrictMode>
        <div className="flex">
          {/* browser */}
          <section>
            <div
              style={{ width: `calc(${sidebarWidth})` }}
              className="relative h-screen border"
            >
              <div
                className="bg-white h-full border-2 p-2 items-center border-gray-300 rounded-xl"
                style={{
                  margin: `${margin} 0 ${margin} ${margin}`,
                  height: `calc(100vh - 2 * ${margin})`,
                }}
              >
                {/* store label */}
                <AddStoreButton className="mb-2" />
                {/* NOTE(Nic): add something to make the store ordering consistent... */}
                {Object.entries(stores).map(([uri, store], i) => {
                  return <StoreDisplay key={`store-${i}`} store={store} />;
                })}

                <ToggleSidebarButton
                  className="absolute bottom-0"
                  style={{ transform: "translateY(-50%)" }}
                />
              </div>
            </div>
          </section>
          {/* editors */}
          <section>
            <div
              className="flex"
              style={{ width: `calc(100vw - (${sidebarWidth}))` }}
            >
              {viewers.length === 0 && <div>no viewers</div>}
              {viewers.map((viewer, i) => {
                return (
                  <ArrayEditor
                    viewer={viewer}
                    viewerIdx={i}
                    numViewers={viewers.length}
                    key={`viewer-${i}`}
                    sidebarWidth={sidebarWidth}
                  />
                );
              })}
            </div>
            <div className="absolute flex top-2 right-2 ">
              <span className="bg-blue-300 p-1 px-3 rounded text-xs">
                focus: {focusState.region}
              </span>
            </div>
          </section>
        </div>
      </React.StrictMode>
    </>
  );
}
