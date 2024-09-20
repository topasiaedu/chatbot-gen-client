import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";

type AlertContextType = {
  message: string;
  type: "info" | "success" | "warning" | "error";
  showAlert: (
    message: string,
    type: "info" | "success" | "warning" | "error"
  ) => void;
  hideAlert: () => void;
  visible: boolean;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">(
    "success"
  );
  const [visible, setVisible] = useState(false);

  const showAlert = useCallback(
    (message: string, type: "info" | "success" | "warning" | "error") => {
      setMessage(message);
      setType(type);
      setVisible(true);
    },
    []
  );

  const hideAlert = useCallback(() => {
    setMessage("");
    setType("info");
    setVisible(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, [visible]);

  const contextValue = useMemo(
    () => ({ message, type, showAlert, hideAlert, visible }),
    [message, type, showAlert, hideAlert, visible]
  );

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
    </AlertContext.Provider>
  );
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Add the whyDidYouRender property after defining the component
(AlertProvider as any).whyDidYouRender = true; // Add this line

export const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
