import { NextRequest, NextResponse } from 'next/server';
import {isSameOrigin} from '@/lib/request-origin';
import { getSession, passwordMatches, issueSession, SESSION_COOKIE } from '@/lib/auth';
export const runtime='nodejs';
const attempts=new Map<string,{count:number; until:number}>();
export async function GET(){return NextResponse.json({authenticated:!!(await getSession())},{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:NextRequest){
 if(!isSameOrigin(req)) return NextResponse.json({error:'Недопустимый источник'},{status:403});
 const key=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'unknown';const now=Date.now();
 for(const [k,v] of attempts) if(v.until<now) attempts.delete(k);
 const record=attempts.get(key)??{count:0,until:now+900000};
 if(record.count>=5) return NextResponse.json({error:'Слишком много попыток. Повторите через 15 минут.'},{status:429});
 record.count++;attempts.set(key,record);
 if(Number(req.headers.get('content-length')??0)>4096)return NextResponse.json({error:'Слишком длинный запрос'},{status:413});
 let password;try{password=(await req.json()).password;}catch{return NextResponse.json({error:'Неверный запрос'},{status:400});}
 if(typeof password!=='string'||password.length>1024||!passwordMatches(password))return NextResponse.json({error:'Неверный пароль'},{status:401});
 attempts.delete(key);const response=NextResponse.json({authenticated:true});response.cookies.set(SESSION_COOKIE,issueSession(),{httpOnly:true,secure:req.headers.get('origin')?.startsWith('https:')??true,sameSite:'strict',path:'/',maxAge:3600});return response;
}
export async function DELETE(req:NextRequest){if(!isSameOrigin(req))return NextResponse.json({error:'Недопустимый источник'},{status:403});const r=NextResponse.json({authenticated:false});r.cookies.delete(SESSION_COOKIE);return r;}
