import React from "react";

export const Card: React.FC = ({ name, description }) => {
  return (
    <div className="col-span-1 rounded-md border border-gray-300 p-5">
      <h2 className="text-xl font-semibold mb-2">{name}</h2>
      <p className="m-0">{description}</p>
    </div>
  );
};
