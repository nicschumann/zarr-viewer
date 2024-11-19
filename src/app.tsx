import * as React from "react";
import ArraySelector from "@/components/selector/array-selector";

export default function App() {
  return (
    <>
      <React.StrictMode>
        <ArraySelector active={true} />
      </React.StrictMode>
    </>
  );
}
