import * as React from "react";
import ArraySelector from "./components/array-selector";
import ArrayRenderer from "./components/array-renderer";
import { useApplicationState } from "./state";

export default function App() {
  const viewers = useApplicationState((store) => store.viewers);
  return (
    <>
      {/* <React.StrictMode> */}

      <section className="absolute top-0 left-0 border">
        {viewers.length > 0 && <ArrayRenderer viewer={viewers[0]} />}
      </section>
      <ArraySelector />
      {/* </React.StrictMode> */}
    </>
  );
}
