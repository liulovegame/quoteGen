import { NextApiRequest, NextApiResponse } from "next";

const TOKEN = `Bearer ${process.env.TEABLE_API_KEY}`;
const TABLE_ID = "tblbEuB7gAWrik7NgOi";
const VIEW_ID = "viwM9CbSUep5zHyJsSG";

// 字段 ID 映射
const FIELD_IDS = {
    // 输入字段
    amount: "fldR84LtqEGBCIlTH0f", // 金额字段ID
    // 输出字段
    fee: "fldFvq4CaGM8Eahiqfh", // 费用字段ID
};

// 金额映射函数
const mapAmountToString = (amount: number): string => {
    if (amount === 0) return "0";
    if (amount === 10000) return "1万";
    if (amount === 20000) return "2万";
    if (amount === 50000) return "5万";
    if (amount === 100000) return "10万";
    if (amount === 200000) return "20万";
    if (amount < 100000) return "10万以下";
    if (amount <= 200000) return "10万-20万";
    return "20万以上";
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { amount } = req.body;

        if (amount === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters",
            });
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
                fieldId: FIELD_IDS.amount,
                operator: "is",
                value: mapAmountToString(Number(amount)),
            },
        ];

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
