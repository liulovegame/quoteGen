import type { NextApiRequest, NextApiResponse } from "next";

const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_ENDPOINT = process.env.DIFY_API_ENDPOINT;

export const maxDuration = 30;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: "Text is required" });
        }

        const response = await fetch(`${DIFY_API_ENDPOINT}/workflows/run`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${DIFY_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: {
                    user_input: text,
                },
                response_mode: "blocking",
                user: "default-user",
            }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error?.message || "Failed to process text");
        }
        // 解析返回的数据
        try {
            const extractedData = JSON.parse(data.data.outputs.text);
            return res.status(200).json(extractedData);
        } catch (parseError) {
            console.error("Error parsing extracted data:", parseError, data.data);
            return res.status(422).json({ message: "Failed to parse extracted data" });
        }
    } catch (error: any) {
        console.error("Error processing request:", error);
        return res.status(500).json({
            message: "Error processing request",
            error: error.message,
        });
    }
}
