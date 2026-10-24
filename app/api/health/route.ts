import {NextResponse} from 'next/server';
import {db} from '@/lib/db';

export const runtime='nodejs';
export const dynamic='force-dynamic';

/** Readiness probe. Never return private connection strings or exception details. */
export async function GET(){
  try{
    // Exercising all independent roles catches missing configuration at startup,
    // without reading any student tables or crossing a section's privileges.
    const domains=['auth','men','women','academy','contact','staffMen','staffWomen','staffAcademy'] as const;
    await Promise.all(domains.map(domain=>db(domain).$queryRaw`SELECT 1`));
    return NextResponse.json({status:'ready'},{headers:{'Cache-Control':'no-store'}});
  }catch{
    return NextResponse.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
