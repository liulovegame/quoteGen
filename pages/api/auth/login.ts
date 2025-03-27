import { createServerClient } from '@supabase/ssr'
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        // 创建 Supabase 客户端
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return req.cookies[name]
                    },
                    set(name: string, value: string, options: any) {
                        res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`)
                    },
                    remove(name: string, options: any) {
                        res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        return res.status(200).json({
            user: data.user?.user_metadata,
            session: {
                access_token: data.session?.access_token,
                refresh_token: data.session?.refresh_token
            }
        });
    } catch (error: any) {
        return res.status(400).json({
            error: error.message || '登录失败'
        });
    }
} 