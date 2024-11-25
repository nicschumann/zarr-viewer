import * as React from "react";
import ArrayEditor from "./components/editor/array-editor";
import AddStoreButton from "./components/browser/add-store-button";
import StoreDisplay from "./components/browser/store-display";
import { useApplicationState } from "./state";

export default function App() {
  const margin = `1em`;
  const sidebarOpen = "350px";
  const sidebarWidth = `${sidebarOpen} + 2 * ${margin}`;

  const focusState = useApplicationState((state) => state.ui.focus);
  const stores = useApplicationState((state) => state.stores);
  const viewers = useApplicationState((state) => state.viewers);
  // const setFocusZone = useApplicationState((state) => state.setFocusZone);

  return (
    <>
      <React.StrictMode>
        <div className="flex">
          {/* browser */}
          <section>
            <div
              style={{ width: `calc(${sidebarWidth})` }}
              className="h-screen border"
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
              </div>
            </div>
          </section>
          {/* editors */}
          <section className="flex">
            {viewers.length === 0 && <div>no viewers</div>}
            {viewers.map((viewer, i) => {
              return (
                <ArrayEditor
                  viewer={viewer}
                  key={`viewer-${i}`}
                  sidebarWidth={sidebarWidth}
                />
              );
            })}
            <div className="absolute top-2 right-2 bg-blue-300 p-1 px-3 rounded text-xs">
              <span>focus: {focusState.region}</span>
            </div>
          </section>
        </div>
      </React.StrictMode>
    </>
  );
}
