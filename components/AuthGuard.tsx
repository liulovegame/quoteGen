import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface AuthGuardProps {
    children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
    const router = useRouter();
    const publicPaths = ['/login'];

    useEffect(() => {
        const checkAuth = () => {
            const user = localStorage.getItem('quote_user');
            const isPublicPath = publicPaths.includes(router.pathname);

            if (!user && !isPublicPath) {
                // 如果没有用户信息且不是公开路径，重定向到登录页
                router.replace('/login');
            } else if (user && isPublicPath) {
                // 如果有用户信息且在登录页，重定向到首页
                router.replace('/');
            }
        };

        checkAuth();
    }, [router.pathname]);

    return <>{children}</>;
};

export default AuthGuard; 