import React from "react";

export default function StoreDisplay() {
  return (
    <div className="hover:bg-gray-200 rounded-md">
      {/* store label */}
      <div className="flex items-center">
        <div className="flex items-center text-center m-2 w-[30px] h-[30px] rounded-[100%] bg-green-300">
          <div className="text-md font-bold mx-auto text-green-700">A</div>
        </div>
        <div className="text-sm py-2 px-3">Store Name Here</div>
      </div>
      {/* store directory tree, if expanded */}
    </div>
  );
}
