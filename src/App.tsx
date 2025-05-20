import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";
import { AlertComponent } from "./components/AlertComponent";
import FlowbiteWrapper from "./components/FlowbiteWrapper";
import ProtectedRoute from "./components/ProtectedRoute";
import { AlertProvider } from "./context/AlertContext";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import DashboardPage from "./pages";
import ForgotPasswordPage from "./pages/authentication/forgot-password";
import ProfileLockPage from "./pages/authentication/profile-lock";
import ResetPasswordPage from "./pages/authentication/reset-password";
import SignInPage from "./pages/authentication/sign-in";
import SignUpPage from "./pages/authentication/sign-up";
import PrivacyPage from "./pages/legal/privacy";
import NotFoundPage from "./pages/pages/404";
import ServerErrorPage from "./pages/pages/500";
import LoadingPage from "./pages/pages/loading";
import MaintenancePage from "./pages/pages/maintenance";
import PricingPage from "./pages/pages/pricing";
import UserFeedPage from "./pages/users/feed";
import UserListPage from "./pages/users/list";
import UserProfilePage from "./pages/users/profile";
import UserSettingsPage from "./pages/users/settings";
import React from "react";
import { BotProvider } from "./context/BotContext";
import { BotFileProvider } from "./context/BotFileContext";
import { BotModelProvider } from "./context/BotModelContext";
import ChatWidget from "./pages/dashboard/chat-widget";

const App: React.FC = () => (
  <AlertProvider>
    <AuthProvider>
      <BotProvider>
        <BotFileProvider>
          <BotModelProvider>
            <AlertComponent />
            <BrowserRouter>
              <Routes>
                <Route element={<FlowbiteWrapper />}>
                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<DashboardPage />} index />

                    <Route path="/users/feed" element={<UserFeedPage />} />
                    <Route path="/users/list" element={<UserListPage />} />

                    <Route
                      path="/users/profile"
                      element={<UserProfilePage />}
                    />
                    <Route
                      path="/users/settings"
                      element={<UserSettingsPage />}
                    />
                  </Route>
                  <Route
                    path="/chat-widget/:bot_model_id"
                    element={<ChatWidget />}
                  />
                  {/* Public Routes */}
                  <Route path="/pages/pricing" element={<PricingPage />} />
                  <Route
                    path="/pages/maintenance"
                    element={<MaintenancePage />}
                  />
                  <Route
                    path="/authentication/sign-in"
                    element={<SignInPage />}
                  />
                  <Route
                    path="/authentication/sign-up"
                    element={<SignUpPage />}
                  />
                  <Route
                    path="/authentication/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/authentication/reset-password"
                    element={<ResetPasswordPage />}
                  />
                  <Route
                    path="/authentication/profile-lock"
                    element={<ProfileLockPage />}
                  />

                  {/* Legal Pages */}
                  <Route path="/legal/privacy" element={<PrivacyPage />} />

                  {/* Testing */}
                  <Route path="/loading" element={<LoadingPage />} />

                  {/* Error Handling Routes */}
                  <Route path="/500" element={<ServerErrorPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </BotModelProvider>
        </BotFileProvider>
      </BotProvider>
    </AuthProvider>
  </AlertProvider>
);

export default App;
