import * as React from "react";

function BG() {
  return (
    <section className="w-screen h-screen bg-blue-600 absolute top-0 left-0"></section>
  );
}

export default function App() {
  return (
    <React.StrictMode>
      <BG />
    </React.StrictMode>
  );
}
