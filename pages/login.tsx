"use client";

import { useState } from "react";
import { Form, Input, Button, Tabs, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";

export default function Login() {
    const [loginForm] = Form.useForm();
    const [registerForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [activeTab, setActiveTab] = useState("login");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // 处理 tab 切换
    const handleTabChange = (key: string) => {
        loginForm.resetFields();
        registerForm.resetFields();
        setActiveTab(key);
    };

    // 处理登录
    const handleLogin = async (values: { email: string; password: string }) => {
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            localStorage.setItem("quote_user", JSON.stringify(data.user));
            messageApi.success("登录成功！");
            router.push("/");
        } catch (error: any) {
            messageApi.error(error.message || "登录失败");
        }
    };

    // 处理注册
    const handleRegister = async (values: { email: string; password: string; name: string }) => {
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            messageApi.success("注册成功！请登录");
            // 设置登录表单的值
            loginForm.setFieldsValue({
                email: values.email,
                password: values.password,
            });
            setActiveTab("login");
        } catch (error: any) {
            messageApi.error(error.message || "注册失败");
        }
    };

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            if (activeTab === "login") {
                await handleLogin(values);
            } else {
                await handleRegister(values);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const items = [
        {
            key: "login",
            label: "登录",
            children: (
                <Form
                    form={loginForm}
                    name="login"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                    className="mt-4"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: "请输入邮箱！" },
                            { type: "email", message: "请输入有效的邮箱地址！" },
                        ]}
                    >
                        <Input prefix={<MailOutlined className="mr-2 text-gray-400" />} placeholder="请输入邮箱" />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: "请输入密码！" }]}>
                        <Input.Password
                            prefix={<LockOutlined className="mr-2 text-gray-400" />}
                            placeholder="请输入密码"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            登录
                        </Button>
                    </Form.Item>
                </Form>
            ),
        },
        {
            key: "register",
            label: "注册",
            children: (
                <Form
                    form={registerForm}
                    name="register"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                    className="mt-4"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: "请输入邮箱！" },
                            { type: "email", message: "请输入有效的邮箱地址！" },
                        ]}
                    >
                        <Input prefix={<MailOutlined className="mr-2 text-gray-400" />} placeholder="请输入邮箱" />
                    </Form.Item>

                    <Form.Item name="name" rules={[{ required: true, message: "请输入经办业务员姓名" }]}>
                        <Input
                            prefix={<UserOutlined className="mr-2 text-gray-400" />}
                            placeholder="请输入经办业务员姓名"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: "请输入密码！" },
                            { min: 6, message: "密码长度不能小于6位！" },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="mr-2 text-gray-400" />}
                            placeholder="请输入密码"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        dependencies={["password"]}
                        rules={[
                            { required: true, message: "请确认密码！" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error("两次输入的密码不一致！"));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="mr-2 text-gray-400" />}
                            placeholder="请确认密码"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            注册
                        </Button>
                    </Form.Item>
                </Form>
            ),
        },
    ];

    return (
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
            {contextHolder}
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-center text-2xl font-semibold text-blue-500 mb-8">众安车险报价系统</h1>
                <Tabs
                    activeKey={activeTab}
                    onChange={handleTabChange}
                    centered
                    items={items}
                    className="[&_.ant-tabs-nav::before]:border-b-0 
                    [&_.ant-tabs-tab]:text-base [&_.ant-tabs-tab]:py-2 [&_.ant-tabs-tab]:mx-8
                    [&_.ant-tabs-tab-active]:font-medium
                    [&_.ant-tabs-ink-bar]:h-[3px] [&_.ant-tabs-ink-bar]:rounded"
                />
            </div>
        </div>
    );
}
