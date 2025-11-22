import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin');

  // Dashboard routes
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // Allow public routes and root
  if (isPublicRoute || pathname === '/') {
    return NextResponse.next();
  }

  // For protected routes, we'll handle auth checks in the components
  // since Firebase Auth uses client-side tokens
  // This middleware just ensures the route structure is correct
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

