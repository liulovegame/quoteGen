import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// 初始化 Supabase 客户端
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, name } = req.body;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role: 'user',
                },
            },
        });

        if (error) throw error;

        return res.status(200).json({
            success: true,
            user: data.user?.user_metadata
        });
    } catch (error: any) {
        return res.status(400).json({
            error: error.message || '注册失败'
        });
    }
} 