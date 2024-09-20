import React from "react";
import { Card } from "flowbite-react";

interface UpdateNoticeComponentProps {
  title: string;
  message: string;
}

const UpdateNoticeComponent: React.FC<UpdateNoticeComponentProps> = ({
  title,
  message,
}) => {
  return (
    <Card className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white mt-4`}>
      <h3 className="text-lg font-semibold">New Feature: {title}</h3>
      <p className="text-sm mt-1">{message}</p>
    </Card>
  );
};

export default UpdateNoticeComponent;
