import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES: Record<string, { roles: string[] }> = {
    '/admin': { roles: ['admin'] },
    '/dashboard': { roles: ['admin', 'user'] },
}

const PUBLIC_ROUTES = ['/login', '/register', '/auth', '/', '/catalogo', '/producto']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
    if (isPublic) return NextResponse.next()

    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('returnUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    const matchedRoute = Object.keys(PROTECTED_ROUTES).find(r => pathname.startsWith(r))

    if (matchedRoute) {
        const requiredRoles = PROTECTED_ROUTES[matchedRoute].roles

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profileError || !profile) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        if (!requiredRoles.includes(profile.role)) {
            if (profile.role === 'user') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}