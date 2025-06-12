import { Flowbite } from "flowbite-react";
import type { FC } from "react";
import { Outlet } from "react-router";
import theme from "../flowbite-theme";
import React from "react";

const FlowbiteWrapper: FC = function () {
  return (
    <Flowbite theme={{ mode: 'light', theme }}>
      <Outlet />
    </Flowbite>
  );
};

export default FlowbiteWrapper;
