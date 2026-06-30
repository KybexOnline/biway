import { Authenticated, GitHubBanner, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  ErrorComponent,
  ThemedLayout,
  ThemedSider,
  ThemedTitle,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { App as AntdApp, Divider, Layout, Space, Typography } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";

import { ForgotPassword } from "./pages/forgotPassword";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { authProvider } from "./providers/auth";
import { dataProvider } from "./providers/data";
import { Setup } from "./pages/setup";
import { ServerList } from "./pages/servers";
import { CloudServerOutlined } from "@ant-design/icons";


function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider}
                notificationProvider={useNotificationProvider}
                routerProvider={routerProvider}
                authProvider={authProvider}
                resources={[
                  {
                    name: "servers",
                    list: "/servers",
                    create: "/servers/create",
                    meta: {
                      icon: <CloudServerOutlined />
                    }
                  }
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "ShQaWG-8mzJ2M-30grub",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <ThemedLayout
                          Header={Header}
                          Sider={(props) => <ThemedSider {...props} fixed />}
                          Title={({ collapsed }) => (
                            <ThemedTitle
                              collapsed={collapsed}
                              icon={
                                <img
                                  src="/icon.svg"
                                  alt="BiWay"
                                  style={{
                                    width: collapsed ? "28px" : "24px",
                                    // height: "auto",
                                    maxHeight: "32px",
                                  }}
                                />
                              }
                              text="BiWay"
                            />
                          )}
                          Footer={() => (
                            <Layout.Footer
                              style={{
                                background: "var(--ant-color-bg-container)",
                                borderTop: "1px solid var(--ant-color-border)",
                                padding: "28px 40px",
                                textAlign: "center",
                                boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.06)",
                              }}
                            >
                              <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                                <Space direction="vertical" size={10} style={{ width: "100%" }}>

                                  <Divider style={{ margin: "12px 0" }} />
                                  <Typography.Text type="secondary" style={{ fontSize: "14px" }}>
                                    BiWay | Powered by{" "}
                                    <a
                                      href="https://kybex.online"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: "var(--ant-color-primary)", textDecoration: "none" }}
                                    >
                                      kybex
                                    </a>
                                  </Typography.Text>


                                  <Typography.Text type="secondary" style={{ fontSize: "13px" }}>
                                    © {new Date().getFullYear()}. All rights reserved.
                                  </Typography.Text>

                                </Space>
                              </div>
                            </Layout.Footer>
                          )}
                        >
                          <Outlet />
                        </ThemedLayout>
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="servers" />}
                    />

                    <Route path="/servers">
                      <Route index element={<ServerList />} />
                    </Route>

                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-outer"
                        fallback={<Outlet />}
                      >
                        <NavigateToResource />
                      </Authenticated>
                    }
                  >
                    <Route path="/login" element={<Login />} />
                    <Route path="/setup" element={<Setup />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler
                  handler={({ resource, action, autoGeneratedTitle }) => {
                    if (resource?.name && action) {
                      return `${resource.name} - ${action} | Biway`;
                    }
                    return autoGeneratedTitle || "Biway";
                  }} />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
