import Link from "next/link";
import {notFound} from "next/navigation";
import {sections} from "@/lib/sections";
export function generateStaticParams(){return sections.map(s=>({slug:s.slug}));}
export default async function DepartmentPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const s=sections.find(x=>x.slug===slug);if(!s)notFound();
 return <div className="container inner-page"><span className="eyebrow">أقسام المدرسة</span><h1>{s.name}</h1><p className="lead">{s.summary}</p><div className="panel"><h2>عن القسم</h2><p>{s.details}</p><p>تُحدد المواعيد والرسوم بعد اعتماد الإدارة لها، ولا تُعلن بيانات غير مؤكدة.</p></div><Link href={`/register?department=${s.code}`} className="btn">الالتحاق بهذا القسم ←</Link></div>
}
