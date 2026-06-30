import React, { useState } from "react";
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
    message,
    Progress
} from "antd";
import { 
    UserOutlined, 
    LockOutlined,
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    EyeOutlined,
    EyeInvisibleOutlined
} from "@ant-design/icons";
import { API_URL } from "../../providers/constants";

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

export const Setup = () => {
    const navigate = useNavigate();
    const { token } = useToken();
    const screens = useBreakpoint();
    const [form] = Form.useForm();
    
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const isSmallScreen = !screens.md;

    const calculateStrength = (password: string): number => {
        let score = 0;
        if (password.length >= 8) score += 25;
        if (password.length >= 12) score += 20;
        if (/[A-Z]/.test(password)) score += 20;
        if (/[0-9]/.test(password)) score += 20;
        if (/[^A-Za-z0-9]/.test(password)) score += 15;
        return Math.min(100, score);
    };

    const onFinish = async (values: any) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/initial`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: values.username,
                    password: values.password
                }),
            });
            
            const data = await response.json();

            if (response.status === 201) {
                message.success('System successfully initialized!', 2.5);
                setTimeout(() => navigate('/login'), 1600);
            } else if (response.status === 409) {
                message.warning('System is already initialized.');
                navigate('/login');
            } else {
                message.error(data.error || 'Initialization failed.');
            }
        } catch (error) {
            message.error('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordStrength(calculateStrength(e.target.value));
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
                {/* Glass Card */}
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
                    {/* Custom Logo */}
                    <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.18)',
                        borderRadius: '20px',
                        padding: '12px',
                        marginBottom: '32px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                    }}>
                        <img 
                            src="/icon.svg" 
                            alt="Biway Logo" 
                            style={{ 
                                width: '52px', 
                                height: '52px',
                                filter: 'brightness(1.1)'
                            }} 
                        />
                    </div>

                    <Title level={1} style={{ 
                        color: '#fff', 
                        fontSize: '3.2rem', 
                        fontWeight: 800, 
                        lineHeight: 1.05,
                        letterSpacing: '-0.04em',
                        marginBottom: 20
                    }}>
                        Initialize Biway
                    </Title>

                    <Paragraph style={{ 
                        color: 'rgba(255,255,255,0.9)', 
                        fontSize: '1.2rem', 
                        lineHeight: 1.6 
                    }}>
                        Create your master account to take control of your secure mesh network.
                    </Paragraph>

                    <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {[
                            "End-to-end encrypted mesh",
                            "Zero-trust architecture",
                            "Instant node deployment",
                            "Full administrative control"
                        ].map((feature, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <CheckCircleOutlined style={{ color: '#c4b5fd', fontSize: '22px' }} />
                                <Text style={{ color: '#fff', fontSize: '1.02rem' }}>{feature}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Col>

            {/* Right Panel - Form */}
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
                    {/* Mobile Logo */}
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
                                System Setup
                            </Title>
                        </div>
                    )}

                    <div style={{ marginBottom: 48 }}>
                        <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: '2.2rem' }}>
                            Create Master Account
                        </Title>
                        <Text style={{ fontSize: '16.5px', color: token.colorTextSecondary, marginTop: 8, display: 'block' }}>
                            This account holds full system privileges.
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
                            label="Admin Username"
                            rules={[
                                { required: true, message: 'Username is required' },
                                { min: 4, message: 'Minimum 4 characters' },
                            ]}
                        >
                            <Input 
                                prefix={<UserOutlined />} 
                                placeholder="admin" 
                                style={{ borderRadius: '14px', height: '56px', fontSize: '16px' }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Master Password"
                            rules={[{ required: true, message: 'Password is required' }]}
                        >
                            <Input.Password 
                                prefix={<LockOutlined />} 
                                placeholder="••••••••••" 
                                onChange={handlePasswordChange}
                                style={{ borderRadius: '14px', height: '56px', fontSize: '16px' }}
                            />
                        </Form.Item>

                        {form.getFieldValue('password') && (
                            <div style={{ marginBottom: 24 }}>
                                <Progress 
                                    percent={passwordStrength} 
                                    showInfo={false}
                                    strokeColor={passwordStrength > 70 ? '#a855f7' : passwordStrength > 40 ? '#eab308' : '#ef4444'}
                                    style={{ height: 6, borderRadius: 999 }}
                                />
                                <Text style={{ fontSize: '12.5px', color: token.colorTextTertiary }}>
                                    {passwordStrength > 70 ? 'Strong password' : passwordStrength > 40 ? 'Medium' : 'Weak'}
                                </Text>
                            </div>
                        )}

                        <Form.Item
                            name="confirmPassword"
                            label="Confirm Password"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Please confirm password' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                                        return Promise.reject('Passwords do not match');
                                    },
                                }),
                            ]}
                        >
                            <Input.Password 
                                prefix={<SafetyCertificateOutlined />} 
                                placeholder="••••••••••" 
                                style={{ borderRadius: '14px', height: '56px', fontSize: '16px' }}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginTop: 40 }}>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={isLoading} 
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
                                Initialize System
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
                        One-time setup • Keep credentials secure
                    </Text>
                </div>
            </Col>
        </Row>
    );
};