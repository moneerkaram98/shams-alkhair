export const domains=["men","women","academy"] as const;
export type Scope=typeof domains[number];
export const scopes:Record<Scope,{code:string;name:string;client:"staffMen"|"staffWomen"|"staffAcademy";prefix:"men"|"women"|"academy"}>={
 men:{code:"HIFZ_MEN",name:"تحفيظ الرجال",client:"staffMen",prefix:"men"},
 women:{code:"HIFZ_WOMEN",name:"تحفيظ النساء",client:"staffWomen",prefix:"women"},
 academy:{code:"ACADEMY",name:"الحضانة والتجويد والإجازات",client:"staffAcademy",prefix:"academy"}
};
export function isScope(value:unknown):value is Scope{return typeof value==="string"&&domains.includes(value as Scope);}
export const attendanceStatuses=["PRESENT","LATE","ABSENT","EXCUSED","LEFT_EARLY"] as const;
export type AttendanceStatus=typeof attendanceStatuses[number];
export const statusLabels:Record<AttendanceStatus,string>={PRESENT:"حاضر",LATE:"متأخر",ABSENT:"غائب",EXCUSED:"غائب بعذر",LEFT_EARLY:"مستأذن"};
export const staffRoles=["SUPER_ADMIN","SUPERVISOR","TEACHER","RECEPTION"] as const;
