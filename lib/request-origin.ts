import type {NextRequest} from 'next/server';
/** Compare against the incoming host: Next's internal URL can use localhost behind a proxy. */
export function isSameOrigin(request:NextRequest){
 const origin=request.headers.get('origin');if(!origin)return false;
 try {const url=new URL(origin);const host=request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()||request.headers.get('host')||request.nextUrl.host;return ['https:','http:'].includes(url.protocol)&&url.host===host;}catch{return false;}
}
