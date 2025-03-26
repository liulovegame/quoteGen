import { supabase } from "@/lib/supabase";
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

export const config = {
    api: {
        bodyParser: false, // 禁用默认的 bodyParser，使用 formidable 处理
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    if (method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${method} Not Allowed`);
        return;
    }

    // 解析 FormData
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const action = fields.action?.[0] as "get" | "upload";
    const path = fields.path?.[0];

    if (!action || !path) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    switch (action) {
        case "get":
            return handleGet(path, res);
        case "upload":
            const file = files.file?.[0];
            if (!file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            return handlePost(path, file, res);
        default:
            res.status(400).json({ error: "Invalid action" });
    }
}

// 获取文件URL
async function handleGet(path: string, res: NextApiResponse) {
    try {
        const { data } = await supabase.storage.from("images").getPublicUrl(path);
        return res.status(200).json(data);
    } catch (error) {
        console.error("Error getting file:", error);
        return res.status(500).json({ error: "Error getting file" });
    }
}

// 上传文件
async function handlePost(path: string, file: formidable.File, res: NextApiResponse) {
    try {
        // 读取文件内容
        const fileData = await fs.promises.readFile(file.filepath);

        // 获取文件类型
        const contentType = file.mimetype || "image/png";

        const { data, error } = await supabase.storage.from("images").upload(path, fileData, {
            contentType,
            upsert: true,
        });

        if (error) {
            console.error("Supabase storage error:", error);
            return res.status(403).json({ 
                error: "文件上传失败", 
                details: error.message 
            });
        }
        
        return res.status(201).json(data);
    } catch (error) {
        console.error("Error uploading file:", error);
        return res.status(500).json({ 
            error: "文件上传失败", 
            details: error instanceof Error ? error.message : "未知错误" 
        });
    }
}
