import * as React from "react";
import ArraySelector from "@/components/selector/array-selector";

export default function App() {
  return (
    <>
      <React.StrictMode>
        <section className="group flex">
          <div className="w-[50%] h-screen relative">
            <div className="absolute w-full h-full top-0 left-0 ">
              <div
                className="relative my-4 group-first:ml-2 mx-1 group-last:mr-2 border-2 border-gray-300 rounded-xl bg-white"
                style={{
                  height: "calc(100% - 2em)",
                }}
              >
                <div>This is where canvas 1 goes</div>
                <ArraySelector
                  className="absolute bottom-2 left-2"
                  active={true}
                />
              </div>
            </div>
          </div>
          <div className="w-[50%] h-screen relative">
            <div className="absolute w-full h-full top-0 left-0 ">
              <div
                className="relative my-4 group-first:ml-2 mx-1 group-last:mr-2 ml-2 border-2 border-gray-300 rounded-xl bg-white"
                style={{
                  height: "calc(100% - 2em)",
                }}
              >
                <div>this is where canvas 2 goes</div>
                <ArraySelector
                  className="absolute bottom-2 left-2"
                  active={true}
                />
              </div>
            </div>
          </div>
        </section>
      </React.StrictMode>
    </>
  );
}
