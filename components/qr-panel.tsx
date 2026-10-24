"use client";
import {useEffect,useState} from "react";
import QRCode from "qrcode";
type Card={id:string;name:string;token:string};
function escapeHtml(text:string){return text.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"} as Record<string,string>)[c]||c);}
export default function QrPanel({cards,scopeName,onClear}:{cards:Card[];scopeName:string;onClear:()=>void}){
 const [images,setImages]=useState<{id:string;name:string;data:string}[]>([]);
 useEffect(()=>{let alive=true;Promise.all(cards.map(async c=>({id:c.id,name:c.name,data:await QRCode.toDataURL(c.token,{errorCorrectionLevel:"H",margin:2,width:250})}))).then(result=>{if(alive)setImages(result);}).catch(()=>{});return()=>{alive=false;};},[cards]);
 function printCards(){if(!images.length)return;const page=window.open("","_blank");if(!page){alert("يرجى السماح بالنوافذ المنبثقة للطباعة");return;}const tiles=images.map(item=>`<article><h2>مدرسة شمس الخير للقرآن الكريم</h2><img src="${item.data}" alt="QR"/><h3>${escapeHtml(item.name)}</h3><p>كارت حضور خاص · يرجى الاحتفاظ به</p></article>`).join("");page.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>بطاقات الطلاب</title><style>@page{size:A4;margin:12mm}body{font-family:Tahoma,Arial;display:grid;grid-template-columns:1fr 1fr;gap:12px}article{border:2px solid #174638;border-radius:15px;text-align:center;padding:15px;break-inside:avoid;color:#174638}img{width:150px;height:150px}h2{font-size:17px}h3{margin:3px;font-size:18px}p{font-size:11px;color:#555}@media print{article{page-break-inside:avoid}}</style></head><body>${tiles}</body></html>`);page.document.close();page.focus();setTimeout(()=>page.print(),600);}
 return <div className="dash-qr"><h3>كروت QR الجديدة — انسخها أو اطبعها الآن</h3><p>هذه الرموز تُعرض لمرة واحدة فقط. لإعادة الإصدار ستُلغى الكروت القديمة.</p><div className="dash-qr-grid">{images.map(img=><div key={img.id}><img src={img.data} alt={`QR للطالب ${img.name}`} /><strong>{img.name}</strong></div>)}</div><button className="btn" onClick={printCards}>طباعة الكروت / حفظ PDF</button> <button className="btn secondary" onClick={onClear}>إغلاق الرموز</button></div>;
}
