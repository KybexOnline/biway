import { useState } from "react";
import { useOne, HttpError } from "@refinedev/core";
import {
  Space,
  Input,
  Modal,
  Tag,
  Row,
  Col,
  Typography,
  Button,
  Tabs,
  Badge,
  Skeleton,
  Tooltip,
  message,
  theme,
} from "antd";
import {
  CloudServerOutlined,
  GlobalOutlined,
  LockOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  RocketOutlined,
  ConsoleSqlOutlined,
} from "@ant-design/icons";

const { Text, Title, Paragraph } = Typography;

export interface IServer {
  id: number | string;
  name: string;
  tags: string[];
  provider: string;
  public_ip: string;
  private_ip: string;
  status?: string;
  api_key: string;
}

interface ServerShowModalProps {
  id: number | null;
  onClose: () => void;
}

export const ServerShowModal = ({ id, onClose }: ServerShowModalProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [bashCopied, setBashCopied] = useState(false);
  const { token } = theme.useToken();

  const baseUrl = window.location.origin;

  // Fetch server details
  const { result, query } = useOne<IServer, HttpError>({
    resource: "servers",
    id: id ?? "",
    queryOptions: {
      enabled: id !== null && id !== undefined,
    },
  });

  const { isLoading, isFetching, isError } = query;
  const loading = isLoading || isFetching;
  const server = result;

  const bashCommand = `curl -fsSL ${baseUrl}/install-agent.sh | bash -s -- --token=${server?.api_key || ""}`;

  const handleCopy = (text: string, type: "bash" | "general" = "general") => {
    navigator.clipboard.writeText(text);
    if (type === "bash") {
      setBashCopied(true);
      setTimeout(() => setBashCopied(false), 2000);
    } else {
      message.success("Copied to clipboard!");
    }
  };

  // Reusable styles
  const modernCardStyle = {
    background: token.colorBgContainer,
    borderRadius: "12px",
    border: `1px solid ${token.colorBorderSecondary}`,
    padding: "20px",
    boxShadow: token.boxShadowTertiary,
    height: "100%",
    transition: "all 0.3s ease",
  };

  const labelStyle = {
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    color: token.colorTextSecondary,
    marginBottom: "8px",
    display: "block",
    fontWeight: 600,
  };

  return (
    <Modal
      open={id !== null}
      onCancel={onClose}
      footer={null}
      width={850}
      centered
      destroyOnClose
      style={{ top: 20 }}
      styles={{ body: { padding: "0 24px 24px 24px" } }}
      title={
        <Space align="center" style={{ padding: "20px 0 10px 0", width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "14px",
              background: token.colorPrimary,
              color: token.colorTextLightSolid,
              boxShadow: `0 4px 10px ${token.colorPrimary}40`,
            }}
          >
            <CloudServerOutlined style={{ fontSize: 24 }} />
          </div>
          <div style={{ marginLeft: 8 }}>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              {loading ? <Skeleton.Input active size="small" /> : server?.name || "Server Details"}
            </Title>
            <Space size={16}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                ID: <Text code style={{ fontSize: 12 }}>{server?.id || id || "..."}</Text>
              </Text>
              {!loading && server && (
                <Badge
                  status={server.status === "online" ? "success" : "error"}
                  text={
                    <Text
                      style={{
                        color: server.status === "online" ? token.colorSuccess : token.colorError,
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      {server.status}
                    </Text>
                  }
                />
              )}
            </Space>
          </div>
        </Space>
      }
    >
      {loading ? (
        <div style={{ marginTop: 24 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : isError ? (
        <div style={{ marginTop: 24, textAlign: "center", padding: "40px 0" }}>
          <Text type="danger">Failed to load server details.</Text>
        </div>
      ) : server ? (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: "details",
              label: <span style={{ fontWeight: 500 }}>Overview</span>,
              children: (
                <div style={{ paddingTop: 12 }}>
                  <Row gutter={[20, 20]}>
                    {/* Top Stats Row */}
                    <Col span={24}>
                      <div style={{ ...modernCardStyle, padding: "16px 24px", background: token.colorFillQuaternary }}>
                        <Row gutter={24}>
                          <Col xs={24} sm={8}>
                            <Text style={labelStyle}>Provider</Text>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {server.provider && (
                                <img
                                  src={`https://logo.clearbit.com/${server.provider}.com`}
                                  alt={server.provider}
                                  style={{ width: 18, height: 18, borderRadius: 4 }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              )}
                              <Text strong style={{ fontSize: 15, textTransform: "capitalize" }}>
                                {server.provider || "N/A"}
                              </Text>
                            </div>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Text style={labelStyle}>Tags</Text>
                            <Space size={[0, 4]} wrap>
                              {server.tags?.length ? (
                                server.tags.map((tag) => (
                                  <Tag key={tag} color="blue" style={{ borderRadius: 6, margin: 0, marginRight: 6 }}>
                                    {tag}
                                  </Tag>
                                ))
                              ) : (
                                <Text type="secondary">No tags</Text>
                              )}
                            </Space>
                          </Col>
                        </Row>
                      </div>
                    </Col>

                    {/* Network Cards */}
                    <Col xs={24} md={12}>
                      <div style={modernCardStyle}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                          <div
                            style={{
                              background: token.colorPrimaryBg,
                              padding: "8px",
                              borderRadius: "8px",
                              marginRight: "12px",
                            }}
                          >
                            <GlobalOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                          </div>
                          <Text strong style={{ fontSize: 16 }}>Public Access</Text>
                        </div>
                        <Text style={labelStyle}>Public IPv4 Address</Text>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: token.colorFillAlter,
                            padding: "10px 16px",
                            borderRadius: "8px",
                          }}
                        >
                          <Text code style={{ background: "transparent", border: "none", padding: 0, fontSize: 15 }}>
                            {server.public_ip || "Not assigned"}
                          </Text>
                          {server.public_ip && (
                            <Tooltip title="Copy IP">
                              <Button
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopy(server.public_ip)}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div style={modernCardStyle}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                          <div
                            style={{
                              background: token.colorSuccessBg,
                              padding: "8px",
                              borderRadius: "8px",
                              marginRight: "12px",
                            }}
                          >
                            <LockOutlined style={{ color: token.colorSuccess, fontSize: 18 }} />
                          </div>
                          <Text strong style={{ fontSize: 16 }}>Internal Network</Text>
                        </div>
                        <Text style={labelStyle}>Private IPv4 Address</Text>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: token.colorFillAlter,
                            padding: "10px 16px",
                            borderRadius: "8px",
                          }}
                        >
                          <Text code style={{ background: "transparent", border: "none", padding: 0, fontSize: 15 }}>
                            {server.private_ip || "Not assigned"}
                          </Text>
                          {server.private_ip && (
                            <Tooltip title="Copy IP">
                              <Button
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopy(server.private_ip)}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: "agent",
              label: (
                <Space size={6}>
                  <RocketOutlined />
                  <span style={{ fontWeight: 500 }}>Agent Setup</span>
                </Space>
              ),
              children: (
                <div style={{ paddingTop: 12 }}>
                  <div style={{ ...modernCardStyle, padding: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        background: token.colorFillQuaternary,
                        padding: "20px 24px",
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <Title level={5} style={{ margin: 0 }}>
                        Connect your server to the platform
                      </Title>
                      <Text type="secondary">
                        Install our lightweight agent to enable monitoring, deployments, and automated tasks.
                      </Text>
                    </div>

                    <div style={{ padding: "24px" }}>
                      <Tabs
                        tabPosition="left"
                        items={[
                          {
                            key: "bash",
                            label: (
                              <Space>
                                <ConsoleSqlOutlined /> Terminal Command
                              </Space>
                            ),
                            children: (
                              <div style={{ paddingLeft: 16 }}>
                                <Text strong style={{ fontSize: 15, display: "block", marginBottom: 8 }}>
                                  Manual Installation
                                </Text>
                                <Paragraph type="secondary">
                                  Connect to your server via SSH and execute the following command as{" "}
                                  <Text code>root</Text> or with <Text code>sudo</Text> privileges.
                                </Paragraph>

                                <div
                                  style={{
                                    background: "#1e1e1e",
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    marginTop: 16,
                                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                  }}
                                >
                                  <div
                                    style={{
                                      background: "#2d2d2d",
                                      padding: "10px 16px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
                                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
                                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f" }} />
                                    <Text
                                      style={{
                                        color: "#858585",
                                        fontSize: 12,
                                        marginLeft: 12,
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      bash — {server.public_ip || "IP_ADDRESS"}
                                    </Text>
                                  </div>
                                  <div style={{ padding: "20px", position: "relative" }}>
                                    <code
                                      style={{
                                        color: "#a6accd",
                                        fontFamily: '"Fira Code", monospace',
                                        fontSize: 13,
                                        wordBreak: "break-all",
                                        lineHeight: 1.6,
                                      }}
                                    >
                                      curl -fsSL {baseUrl}/install-agent.sh | bash -s -- --token={server?.api_key}
                                    </code>

                                    <Tooltip title={bashCopied ? "Copied!" : "Copy Command"}>
                                      <Button
                                        type="primary"
                                        icon={bashCopied ? <CheckCircleOutlined /> : <CopyOutlined />}
                                        onClick={() => handleCopy(bashCommand, "bash")}
                                        style={{
                                          position: "absolute",
                                          bottom: 16,
                                          right: 16,
                                          background: bashCopied ? token.colorSuccess : "rgba(255,255,255,0.1)",
                                          border: "none",
                                          color: "white",
                                        }}
                                      />
                                    </Tooltip>
                                  </div>
                                </div>
                              </div>
                            ),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <div style={{ marginTop: 24, textAlign: "center", padding: "40px 0" }}>
          <Text type="secondary">Server details could not be loaded.</Text>
        </div>
      )}
    </Modal>
  );
};