import content from "@/content/site.json";
export type Teacher={name:string;department:string;qualification:string;description?:string};
export type Course={title:string;department:string;level:string;schedule?:string;fee?:string;description:string};
export type Announcement={title:string;date:string;summary:string};
export type GalleryItem={title:string;kind:"photo"|"video";url:string};
/** Publicly approved entries only; edit content/site.json and redeploy. */
export const siteContent=content as {teachers:Teacher[];courses:Course[];news:Announcement[];gallery:GalleryItem[]};
