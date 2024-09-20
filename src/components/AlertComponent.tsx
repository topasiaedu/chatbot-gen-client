import React from 'react';
import { useAlertContext } from '../context/AlertContext';
import { Alert } from 'flowbite-react';

export const AlertComponent: React.FC = () => {
  const { message, type, visible, hideAlert } = useAlertContext();

  return (
    <>
      {visible && (
      <div className="fixed top-0 right-0 p-4 m-4 w-80" style={{ zIndex: 9999 }}>
        <Alert color={type=== 'error' ? 'failure' : type} onDismiss={hideAlert} rounded withBorderAccent>
          {message}
        </Alert>
      </div>
      )}
    </>
  );
};