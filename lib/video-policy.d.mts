declare module "@/lib/video-policy.mjs" {
 export function canViewVideo(video: {scope:string;visibility:string;levelId?:string|null;groupId?:string|null;status:string;reviewStatus:string;publishedAt?:unknown;deletedAt?:unknown},viewer:{scope:string;staffAccess:boolean;activeEnrollments:Array<{groupId:string;levelId?:string|null}>}|null):boolean;
 export function validateVisibility(scope:string,visibility:string,levelId?:string|null,groupId?:string|null):boolean;
}
