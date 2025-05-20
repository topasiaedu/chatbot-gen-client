import React from "react";
import Lottie from "lottie-react";
import animationData from "../pages/dashboard/loading.json";

/**
 * LoadingScreen component displays an animated loading indicator
 * @param message - Optional custom loading message
 * @returns React component
 */
const LoadingScreen = ({ message = "Loading chat..." }: { message?: string }): JSX.Element => {
  return (
    <div className="flex flex-col h-[100vh] justify-center items-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="rounded-2xl p-8">
        <Lottie
          animationData={animationData}
          loop
          autoplay
          style={{ width: 180, height: 180 }}
        />
        <div className="text-center text-gray-600 dark:text-gray-300 mt-4 font-medium">
          {message}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 