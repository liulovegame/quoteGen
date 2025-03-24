import { NextApiRequest, NextApiResponse } from "next";

const TOKEN = `Bearer ${process.env.TEABLE_API_KEY}`;
const TABLE_ID = "tblFj2TYJUQDOSQvuaN"; // 第三者责任服务表 ID

// 字段 ID 映射
const FIELD_IDS = {
    // 输入字段
    nature: "fldNHVsHCBFuUwDYNyz", // 车辆性质
    type: "fldcWpuXcKFt9Y7KHD5", // 车辆种类
    amount: "fldLz5Q0dXgcaxpJaSl", // 保额
    // 输出字段映射
    fee: "fldJ5ktPnQ6JMezOJGv", // 保费
};

// 视图 ID
const VIEW_ID = "viw21uSErlGfcGy0u1A";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { nature, type, amount } = req.body;

        const url = new URL(`${process.env.TEABLE_BASE_URL || 'https://app.teable.cn/api'}/table/${TABLE_ID}/record`);

        // 构建查询参数
        const params: Record<string, string> = {
            fieldKeyType: "id",
            viewId: VIEW_ID,
        };

        // 构建 filter
        const filterSet = [];
        if (nature) {
            filterSet.push({
                fieldId: FIELD_IDS.nature,
                operator: "is",
                value: nature,
            });
        }
        if (type) {
            filterSet.push({
                fieldId: FIELD_IDS.type,
                operator: "is",
                value: type,
            });
        }
        if (amount) {
            filterSet.push({
                fieldId: FIELD_IDS.amount,
                operator: "is",
                value: amount,
            });
        }

        if (filterSet.length > 0) {
            params.filter = JSON.stringify({
                conjunction: "and",
                filterSet: filterSet,
            });
        }

        // 添加查询参数
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        // 发送请求
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                Authorization: TOKEN,
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 处理返回数据，将字段 ID 映射回字段名
        const mappedRecords = data.records?.map((record: any) => ({
            fee: record.fields[FIELD_IDS.fee],
        })) || [];

        return res.status(200).json({
            success: true,
            data: mappedRecords,
        });
    } catch (error: any) {
        console.error("Teable API Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
            error: error,
        });
    }
}
