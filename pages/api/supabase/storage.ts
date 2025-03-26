import { supabase } from '@/lib/supabase';
import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb' // 设置最大文件大小
        }
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    if (method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
        return;
    }

    const { action } = req.body;

    switch (action) {
        case 'get':
            return handleGet(req, res);
        case 'upload':
            return handlePost(req, res);
        default:
            res.status(400).json({ error: 'Invalid action' });
    }
}

// 获取文件URL
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { bucket, path } = req.body;

        if (!bucket || !path) {
            return res.status(400).json({ error: 'Missing bucket or path' });
        }

        const { data } = await supabase
            .storage
            .from(bucket)
            .getPublicUrl(path);

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error getting file:', error);
        return res.status(500).json({ error: 'Error getting file' });
    }
}

// 上传文件
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { bucket, path, fileData } = req.body;

        if (!bucket || !path || !fileData) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 将 base64 转换为 Buffer
        const buffer = Buffer.from(fileData.replace(/^data:.*?;base64,/, ''), 'base64');

        const { data, error } = await supabase
            .storage
            .from(bucket)
            .upload(path, buffer, {
                contentType: 'image/png', // 可以根据实际文件类型修改
                upsert: true // 如果文件已存在则覆盖
            });

        if (error) throw error;
        return res.status(201).json(data);
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({ error: 'Error uploading file' });
    }
} 