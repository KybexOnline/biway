import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
    Form, 
    Input, 
    Button, 
    Typography, 
    Row, 
    Col, 
    theme, 
    Grid,
    message 
} from "antd";
import { 
    UserOutlined, 
    LockOutlined,
    CheckCircleOutlined 
} from "@ant-design/icons";
import { useLogin } from "@refinedev/core";
import { API_URL } from "../../providers/constants";

const { Title, Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

export const Login = () => {
    const navigate = useNavigate();
    const { mutate: login, isPending } = useLogin();
    const { token } = useToken();
    const screens = useBreakpoint();
    const [form] = Form.useForm();

    const isSmallScreen = !screens.md;

    // Check if setup is needed
    useEffect(() => {
        const checkSystemStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/status`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.needs_setup) {
                        navigate('/setup');
                    }
                }
            } catch (error) {
                console.error("Failed to check system status:", error);
            }
        };

        checkSystemStatus();
    }, [navigate]);

    const onFinish = (values: any) => {
        login(values, {
            onError: (error: any) => {
                message.error(error?.message || "Invalid credentials. Please try again.");
            }
        });
    };

    return (
        <Row style={{ minHeight: "100vh", margin: 0, overflow: 'hidden' }}>
            {/* Left Panel - Mesh Background */}
            <Col
                xs={0}
                sm={0}
                md={12}
                lg={13}
                xl={14}
                className="mesh-background"
                style={{
                    background: 'linear-gradient(135deg, #6b46c1 0%, #7c3aed 45%, #a855f7 100%)',
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                    padding: '60px 40px',
                    color: '#fff',
                    overflow: 'hidden',
                }}
            >
                <div style={{
                    position: 'relative',
                    zIndex: 3,
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(28px)',
                    WebkitBackdropFilter: 'blur(28px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '28px',
                    padding: '52px 48px',
                    maxWidth: '520px',
                    width: '100%',
                    boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.35)',
                }}>
                    {/* Logo */}
                    <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.18)',
                        borderRadius: '20px',
                        padding: '12px',
                        marginBottom: '32px',
                    }}>
                        <img 
                            src="/icon.svg" 
                            alt="Biway Logo" 
                            style={{ width: '52px', height: '52px', filter: 'brightness(1.1)' }} 
                        />
                    </div>

                    <Title level={1} style={{ 
                        color: '#fff', 
                        fontSize: '3.1rem', 
                        fontWeight: 800, 
                        lineHeight: 1.05,
                        letterSpacing: '-0.04em',
                        marginBottom: 20
                    }}>
                        Welcome back
                    </Title>

                    <Text style={{ 
                        color: 'rgba(255,255,255,0.9)', 
                        fontSize: '1.22rem', 
                        lineHeight: 1.6 
                    }}>
                        Sign in to manage your secure mesh network.
                    </Text>
                </div>
            </Col>

            {/* Right Panel - Login Form */}
            <Col
                xs={24}
                md={12}
                lg={11}
                xl={10}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: token.colorBgContainer,
                    padding: isSmallScreen ? '48px 20px' : '80px 48px',
                }}
            >
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    {/* Mobile Header */}
                    {isSmallScreen && (
                        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
                            <div style={{
                                display: 'inline-flex',
                                background: `linear-gradient(135deg, #7c3aed, #a855f7)`,
                                borderRadius: '20px',
                                padding: '14px',
                                boxShadow: `0 12px 30px -8px rgba(124, 58, 237, 0.4)`
                            }}>
                                <img 
                                    src="/icon.svg" 
                                    alt="Biway Logo" 
                                    style={{ width: '48px', height: '48px' }} 
                                />
                            </div>
                            <Title level={2} style={{ marginTop: 24, fontWeight: 800 }}>
                                Welcome back
                            </Title>
                        </div>
                    )}

                    <div style={{ marginBottom: 48 }}>
                        <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: '2.2rem' }}>
                            Sign In
                        </Title>
                        <Text style={{ fontSize: '16.5px', color: token.colorTextSecondary, marginTop: 8, display: 'block' }}>
                            Enter your credentials to access the dashboard
                        </Text>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                        size="large"
                    >
                        <Form.Item
                            name="username"
                            label="Username"
                            rules={[{ required: true, message: 'Please enter your username' }]}
                        >
                            <Input 
                                prefix={<UserOutlined />} 
                                placeholder="Enter your username" 
                                style={{ 
                                    borderRadius: '14px', 
                                    height: '56px', 
                                    fontSize: '16px' 
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: 'Please enter your password' }]}
                        >
                            <Input.Password 
                                prefix={<LockOutlined />} 
                                placeholder="Enter your password" 
                                style={{ 
                                    borderRadius: '14px', 
                                    height: '56px', 
                                    fontSize: '16px' 
                                }}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginTop: 40 }}>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={isPending} 
                                block
                                size="large"
                                icon={<CheckCircleOutlined />}
                                style={{ 
                                    height: '58px', 
                                    fontSize: '17px', 
                                    fontWeight: 600,
                                    borderRadius: '14px',
                                    background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                                    boxShadow: '0 10px 30px -8px rgba(124, 58, 237, 0.5)',
                                }}
                            >
                                Sign In
                            </Button>
                        </Form.Item>
                    </Form>

                    <Text style={{ 
                        display: 'block', 
                        textAlign: 'center', 
                        marginTop: 32, 
                        color: token.colorTextTertiary,
                        fontSize: '13px'
                    }}>
                        Forgot your password? Contact your administrator.
                    </Text>
                </div>
            </Col>
        </Row>
    );
};