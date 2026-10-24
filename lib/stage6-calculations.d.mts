export function invoiceBalance(invoice:{amountPiasters:number;discountPiasters:number;voidedAt?:Date|null},payments:Array<{amountPiasters:number}>):{totalPiasters:number;paidPiasters:number;remainingPiasters:number;status:string};
export function nextReview(mastery:number,previousDays?:number):number;
export function nextDue(date:Date|string,days:number):Date;
export function minutesFromClock(s:string):number;
export function safeTimeRange(fromMinute:number,toMinute:number):boolean;
export function overlap(a:{weekday:number;fromMinute:number;toMinute:number},b:{weekday:number;fromMinute:number;toMinute:number}):boolean;
export function progressBySurah(records:Array<{surahNumber:number;activity:string;mastery:number}>):Array<{surah:number;newCount:number;reviewCount:number;latestMastery:number|null}>;
