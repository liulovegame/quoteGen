import { NextApiRequest, NextApiResponse } from "next";
import * as $OpenApi from "@alicloud/openapi-client";
import * as $Util from "@alicloud/tea-util";
import Ocr, * as $Ocr from "@alicloud/ocr-api20210707";
import { IncomingForm, Files, Fields, File } from "formidable";
import { promises as fs } from "fs";
import * as Stream from "@alicloud/darabonba-stream";

// 配置 Next.js 以禁用默认的 bodyParser
export const config = {
    api: {
        bodyParser: false,
    },
};

// 创建 OCR 客户端
const createClient = (): Ocr => {
    const config = new $OpenApi.Config({
        // 必填，您的 AccessKey ID
        accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
        // 必填，您的 AccessKey Secret
        accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
        // Endpoint 请参考 https://api.aliyun.com/product/ocr-api
        endpoint: "ocr-api.cn-hangzhou.aliyuncs.com",
        // 访问的域名
        regionId: "cn-hangzhou",
    });

    return new Ocr(config);
};

// 解析 FormData
const parseForm = async (req: NextApiRequest): Promise<{ files: Files }> => {
    return new Promise((resolve, reject) => {
        const form = new IncomingForm();
        form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
            if (err) reject(err);
            resolve({ files });
        });
    });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    if (!process.env.ALIYUN_ACCESS_KEY_ID || !process.env.ALIYUN_ACCESS_KEY_SECRET) {
        return res.status(500).json({ message: "API configuration missing" });
    }

    try {
        // 解析上传的文件
        const { files } = await parseForm(req);
        const file = (files.file as File[])?.[0] || (files.file as unknown as File);

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // 创建客户端
        const client = createClient();

        // 创建运行时选项
        const runtime = new $Util.RuntimeOptions({
            readTimeout: 30000,
            connectTimeout: 10000,
            ignoreSSL: true,
        });

        try {
            // 使用 darabonba-stream 读取文件
            const bodyStream = await Stream.default.readFromFilePath(file.filepath);

            // 创建请求
            const recognizeRequest = new $Ocr.RecognizeAllTextRequest({
                body: bodyStream,
                type: "Advanced",
            });

            // 设置请求超时
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error("OCR 识别超时，请重试"));
                }, 30000);
            });

            // 调用 API，使用 Promise.race 实现超时控制
            const result = await Promise.race([
                client.recognizeAllTextWithOptions(recognizeRequest, runtime),
                timeoutPromise
            ]) as $Ocr.RecognizeAllTextResponse;

            // 清理临时文件
            await fs.unlink(file.filepath).catch(console.error);

            // 处理结果
            return res.status(200).json({
                success: true,
                data: result.body?.data,
            });
        } catch (error: any) {
            // 清理临时文件
            await fs.unlink(file.filepath).catch(console.error);

            // 使用 Tea.assertAsString 处理错误信息
            if (error.data?.["Recommend"]) {
                const errorMessage = $Util.default.assertAsString(error.message);
                return res.status(500).json({
                    success: false,
                    message: errorMessage,
                    recommend: error.data["Recommend"],
                });
            }

            throw error; // 抛出其他错误，由外层统一处理
        }
    } catch (error: any) {
        console.error("OCR recognition error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
            error: error,
        });
    }
}
