interface RequestOptions extends RequestInit {
    data?: any;
}

interface ResponseData<T = any> {
    success: boolean;
    data?: T;
    message?: string;
}

// 统一的请求处理函数
export async function request<T = any>(url: string, options: RequestOptions = {}): Promise<ResponseData<T>> {
    try {
        const { data, ...restOptions } = options;
        
        // 设置默认请求头
        const headers = new Headers(options.headers);

        // 如果是 FormData，不设置 Content-Type，让浏览器自动设置
        if (!(data instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        // 构建请求配置
        const requestOptions: RequestInit = {
            ...restOptions,
            headers,
            body: data instanceof FormData ? data : (data ? JSON.stringify(data) : restOptions.body),
        };

        // 发送请求
        const response = await fetch(url, requestOptions);

        // 处理 401 未授权状态
        if (response.status === 401) {
            // 清除本地存储的用户信息
            localStorage.removeItem("quote_user");
            // 重定向到登录页
            window.location.href = "/login";
            throw new Error("未授权，请重新登录");
        }

        // 解析响应数据
        const result = await response.json();

        // 如果响应不成功，抛出错误
        if (!response.ok) {
            console.log("请求失败：", result.message);
            throw new Error(result.message || "请求失败，请重试");
        }

        return result;
    } catch (error) {
        console.error("Request error:", error);
        throw error;
    }
}

// 便捷的请求方法
export const http = {
    get: <T = any>(url: string, options?: RequestOptions) => 
        request<T>(url, { ...options, method: "GET" }),

    post: <T = any>(url: string, data?: any, options?: RequestOptions) =>
        request<T>(url, { ...options, method: "POST", data }),

    put: <T = any>(url: string, data?: any, options?: RequestOptions) =>
        request<T>(url, { ...options, method: "PUT", data }),

    delete: <T = any>(url: string, options?: RequestOptions) => 
        request<T>(url, { ...options, method: "DELETE" }),
};
