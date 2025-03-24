import "@/styles/globals.css";
import { ConfigProvider, App as AntApp } from "antd";
import type { AppProps } from "next/app";
import { StyleProvider } from "@ant-design/cssinjs";
import theme from "../theme/themeConfig";
import zhCN from "antd/locale/zh_CN";
// for date-picker i18n
import "dayjs/locale/zh-cn";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";

export default function App({ Component, pageProps }: AppProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 在客户端渲染之前不进行认证检查
    if (!mounted) {
        return null;
    }

    return (
        <AuthGuard>
            <StyleProvider hashPriority="high">
                <ConfigProvider locale={zhCN} theme={theme}>
                    <AntApp>
                        <Component {...pageProps} />
                    </AntApp>
                </ConfigProvider>
            </StyleProvider>
        </AuthGuard>
    );
}
