/** Pure logic used in API and independently tested without credentials. All amounts in integer piasters. */
export function invoiceBalance(invoice, payments){
 const total=invoice.amountPiasters-invoice.discountPiasters;
 if(!Number.isSafeInteger(total)||total<0)throw Error('Invalid invoice total');
 const paid=payments.reduce((sum,p)=>sum+p.amountPiasters,0);
 if(!Number.isSafeInteger(paid)||paid<0||paid>total)throw Error('Inconsistent payments');
 return {totalPiasters:total,paidPiasters:paid,remainingPiasters:total-paid,status:invoice.voidedAt?'VOID':paid===total?'PAID':paid?'PARTIAL':'OPEN'};
}
/** Simple, explainable spaced repetition, not a medically or academically validated score. */
export function nextReview(mastery, previousDays=1){
 if(!Number.isInteger(mastery)||mastery<0||mastery>100)throw Error('Invalid mastery');
 const intervalDays=mastery<60?1:mastery<80?2:mastery<95?Math.min(30,Math.max(3,previousDays*2)):Math.min(90,Math.max(7,previousDays*3));
 return intervalDays;
}
export function nextDue(date,days){
 const d=new Date(date);if(!Number.isFinite(d.valueOf())||!Number.isSafeInteger(days)||days<1||days>90)throw Error('Invalid review');
 d.setUTCDate(d.getUTCDate()+days);return d;
}
export function minutesFromClock(hhmm){
 if(typeof hhmm!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm))throw Error('Invalid HH:mm');
 const [h,m]=hhmm.split(':').map(Number);return 60*h+m;
}
export function safeTimeRange(fromMinute,toMinute){
 return Number.isInteger(fromMinute)&&Number.isInteger(toMinute)&&fromMinute>=0&&toMinute<=1440&&toMinute>fromMinute&&toMinute-fromMinute>=15;
}
export function overlap(a,b){return a.weekday===b.weekday&&a.fromMinute<b.toMinute&&b.fromMinute<a.toMinute;}
export function progressBySurah(records){
 const result=new Map();
 for(const r of records){if(!Number.isInteger(r.surahNumber)||r.surahNumber<1||r.surahNumber>114)continue;
  const v=result.get(r.surahNumber)??{surah:r.surahNumber,newCount:0,reviewCount:0,latestMastery:null};
  if(r.activity==='REVIEW')v.reviewCount++;else if(r.activity==='NEW_MEMORIZATION')v.newCount++;
  if(v.latestMastery===null)v.latestMastery=r.mastery;
  result.set(r.surahNumber,v);
 }
 return [...result.values()].sort((a,b)=>a.surah-b.surah);
}
