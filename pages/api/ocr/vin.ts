import { NextApiRequest, NextApiResponse } from "next";

// VIN 识别 API 配置
const VIN_CONFIG = {
    host: "ali-vin.showapi.com",
    path: "/vin",
    method: "GET",
    appcode: process.env.ALIYUN_VIN_APPCODE,
};

// VIN 缓存配置
const CACHE_EXPIRE_TIME = 30 * 24 * 60 * 60 * 1000; // 30 * 24小时过期

interface CacheItem {
    data: any;
    timestamp: number;
}

// 使用 Map 作为缓存存储
const vinCache = new Map<string, CacheItem>();

// 检查缓存是否过期
const isCacheExpired = (timestamp: number): boolean => {
    return Date.now() - timestamp > CACHE_EXPIRE_TIME;
};

// 从缓存获取数据
const getFromCache = (vin: string): any | null => {
    const cacheItem = vinCache.get(vin);
    if (!cacheItem) return null;

    // 如果缓存过期，删除缓存并返回 null
    if (isCacheExpired(cacheItem.timestamp)) {
        vinCache.delete(vin);
        return null;
    }

    return cacheItem.data;
};

// 将数据存入缓存
const setToCache = (vin: string, data: any): void => {
    vinCache.set(vin, {
        data,
        timestamp: Date.now(),
    });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    if (!process.env.ALIYUN_VIN_APPCODE) {
        return res.status(500).json({ message: "API configuration missing" });
    }

    try {
        const { vin } = req.body;

        if (!vin) {
            return res.status(400).json({ message: "vin is required" });
        }

        // 检查缓存
        const cachedData = getFromCache(vin);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                data: cachedData,
                fromCache: true,
            });
        }

        // 发送请求
        const response = await fetch(`https://${VIN_CONFIG.host}${VIN_CONFIG.path}?vin=${vin}`, {
            method: VIN_CONFIG.method,
            headers: {
                Authorization: `APPCODE ${VIN_CONFIG.appcode}`,
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`VIN API error: ${response.statusText}`);
        }

        const data = await response.json();
        const result = data.showapi_res_body;

        // 存入缓存
        setToCache(vin, result);

        // 返回结果
        return res.status(200).json({
            success: true,
            data: result,
            fromCache: false,
        });
    } catch (error: any) {
        console.error("VIN recognition error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
            error: error,
        });
    }
}
