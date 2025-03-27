import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // 创建 Supabase 客户端
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 检查是否是 auth 相关的路由
  const isAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')

  if (!isAuthRoute) {
    // 获取 session
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      // 如果没有有效的 session，返回 401 错误
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      )
    }
  }

  return res
}

// 配置需要进行中间件处理的路径
export const config = {
  matcher: '/api/:path*',
} 