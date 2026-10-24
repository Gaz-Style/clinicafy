import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// Public routes that don't require authentication redirect
const PUBLIC_PATHS = [
  '/workstation',
  '/portal',
  '/login',
  '/manual-de-marca',
  '/auth/callback',
  '/api/payments/webhook',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root landing page is public
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Allow public routes without session check
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
    || pathname.startsWith('/_next')
    || pathname.startsWith('/favicon')
    || pathname.endsWith('.webp')
    || pathname.endsWith('.png')
    || pathname.endsWith('.ico');

  if (isPublic) {
    return NextResponse.next();
  }

  // Update session and enforce auth
  const response = await updateSession(request);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
