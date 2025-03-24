import { NextApiRequest, NextApiResponse } from "next";

const TOKEN = `Bearer ${process.env.TEABLE_API_KEY}`;
const TABLE_ID = "tblDNylQrP43B7PzAS4"; // 机动车损失服务表 ID

// 字段 ID 映射
const FIELD_IDS = {
    // 输入字段
    nature: "fldTXs5xFJLYLuIzSjw", // 车辆性质
    type: "fldLTHoLOYw91oiGDMJ", // 车辆种类
    // 输出字段映射
    depreciationRate: "fldAr7zAqTqNPuCqhjR", // 月折旧费
    fee: "fldAWolR8kPfxrSpJw2", // 费用
};

// 视图 ID
const VIEW_ID = "viwnTIRz4V0ZLD9T0zC";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { nature, type } = req.body;

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
            depreciationRate: (record.fields[FIELD_IDS.depreciationRate] * 100).toFixed(2),
            fee: (record.fields[FIELD_IDS.fee] * 100).toFixed(2),
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
