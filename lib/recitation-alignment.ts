/** Display text is never normalized or rewritten: normalization ONLY for comparison. */
export type TokenDiff={kind:"MATCH"|"MISSING"|"EXTRA"|"SUBSTITUTED"|"ORDER";expected:string|null;actual:string|null;expectedIndex:number|null};
export function normalizeArabic(value:string){return value.normalize("NFKC").replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,"").replace(/[ٱأإآ]/g,"ا").replace(/ى/g,"ي").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/[،؛!؟.,:؛\u06dd\u06de]/g," ").replace(/\s+/g," ").trim();}
export const splitWords=(s:string)=>s.split(/\s+/u).filter(Boolean);
export function compareRecitation(expectedText:string,spokenText:string){
 const expected=splitWords(expectedText),spoken=splitWords(spokenText);
 if(expected.length>450||spoken.length>450)throw Error("المقطع أطول من الحد المدعوم");
 const a=expected.map(normalizeArabic),b=spoken.map(normalizeArabic),m=a.length,n=b.length;
 const dp:number[][]=Array.from({length:m+1},()=>Array(n+1).fill(0));
 for(let i=0;i<=m;i++)dp[i][0]=i;for(let j=0;j<=n;j++)dp[0][j]=j;
 for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
 let i=m,j=n;const reverse:TokenDiff[]=[];
 while(i>0||j>0){
  if(i>0&&j>0&&dp[i][j]===dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1)){
   reverse.push({kind:a[i-1]===b[j-1]?"MATCH":"SUBSTITUTED",expected:expected[i-1],actual:spoken[j-1],expectedIndex:i-1});i--;j--;
  }else if(i>0&&dp[i][j]===dp[i-1][j]+1){reverse.push({kind:"MISSING",expected:expected[i-1],actual:null,expectedIndex:i-1});i--;}
  else{reverse.push({kind:"EXTRA",expected:null,actual:spoken[j-1],expectedIndex:null});j--;}
 }
 const tokens=reverse.reverse();
 // Adjacent swaps get a distinct ORDER label instead of two substitutions.
 for(let k=0;k+1<tokens.length;k++){
  const x=tokens[k],y=tokens[k+1];
  if(x.kind==="SUBSTITUTED"&&y.kind==="SUBSTITUTED" && normalizeArabic(x.expected||"")===normalizeArabic(y.actual||"") && normalizeArabic(y.expected||"")===normalizeArabic(x.actual||"")){x.kind="ORDER";y.kind="ORDER";k++;}
 }
 const matched=tokens.filter(t=>t.kind==="MATCH").length;
 const agreement=m?Math.max(0,Math.min(100,Math.round(matched/m*100))):0;
 return {tokens,agreement,counts:{match:matched,missing:tokens.filter(x=>x.kind==="MISSING").length,extra:tokens.filter(x=>x.kind==="EXTRA").length,substituted:tokens.filter(x=>x.kind==="SUBSTITUTED").length,order:tokens.filter(x=>x.kind==="ORDER").length},disclaimer:"مقارنة نصية أولية تعتمد على التعرف الآلي على الكلام؛ لا تقيس التجويد أو مخارج الحروف، ولا تعتمد كتقييم نهائي."};
}
