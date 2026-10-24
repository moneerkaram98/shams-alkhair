// Framework-independent authorization policy; checked again on every request.
export const videoScopes=["men","women","academy"];
export const visibilityModes=["PUBLIC","ENROLLED","LEVEL","GROUP"];
export function validateVisibility(scope, visibility, levelId, groupId) {
 if (!videoScopes.includes(scope)||!visibilityModes.includes(visibility))return false;
 if (visibility==="PUBLIC" && scope!=="academy")return false; // no public women's media
 if (visibility==="GROUP"&&!groupId)return false;
 if (visibility==="LEVEL"&&!levelId)return false;
 if (visibility==="PUBLIC"&&(groupId||levelId))return false;
 return true;
}
export function canViewVideo({scope,visibility,levelId,groupId,status,reviewStatus,publishedAt,deletedAt}, viewer){
 if(deletedAt||status!=="READY"||reviewStatus!=="APPROVED"||!publishedAt)return false;
 if(visibility==="PUBLIC")return scope==="academy";
 if(!viewer || viewer.scope!==scope)return false;
 if(viewer.staffAccess)return true;
 if(visibility==="ENROLLED")return viewer.activeEnrollments.length>0;
 if(visibility==="LEVEL")return viewer.activeEnrollments.some(e=>e.levelId===levelId&&levelId!=null);
 if(visibility==="GROUP")return viewer.activeEnrollments.some(e=>e.groupId===groupId&&groupId!=null);
 return false;
}
