import { NextApiRequest, NextApiResponse } from "next";

const TOKEN = `Bearer ${process.env.TEABLE_API_KEY}`;
const TABLE_ID = "tblrsTWVNsDJOFQpzYu"; // 车上人员责任服务表 ID

// 字段 ID 映射
const FIELD_IDS = {
    // 输入字段
    category: "fldpKKJTxOdSGMHvbp3", // 服务类别
    nature: "fld51B0jvkOxcoOJWuY", // 车辆性质
    type: "fld7c2ktKqRKzAhQS2Z", // 车辆种类
    amount: "fldeg1sXxkKvdNBafOe", // 保额
    // 输出字段映射
    fee: "fldtBP5N9CDvhGp0fMy", // 保费
};

// 视图 ID
const VIEW_ID = "viwWHV0b1mA8pDFA9eR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { nature, type, category, amount } = req.body;

        if (!category) {
            return res.status(400).json({ message: "category is required" });
        }

        const url = new URL(`${process.env.TEABLE_BASE_URL || 'https://app.teable.cn/api'}/table/${TABLE_ID}/record`);

        // 构建查询参数
        const params: Record<string, string> = {
            fieldKeyType: "id",
            viewId: VIEW_ID,
        };

        // 构建 filter
        const filterSet = [
            {
                fieldId: FIELD_IDS.category,
                operator: "is",
                value: category,
            },
        ];

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

        params.filter = JSON.stringify({
            conjunction: "and",
            filterSet: filterSet,
        });

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