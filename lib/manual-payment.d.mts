export type ManualPaymentRequest = {invoiceId:string; idempotencyKey:string;amountPiasters:number;method:string;reference?:string};
export type RecordedPayment = {id:string;invoiceId:string;idempotencyKey:string;amountPiasters:number;method:string;reference?:string|null;receiptNo:string;recordedBy:string};
export function recordManualPaymentWithinTransaction(args:{
 tx:any;prefix:string;request:ManualPaymentRequest;actorId:string;scopeCode:string;
 makeReceipt:()=>string;calculateBalance:(invoice:any,payments:any[])=>{remainingPiasters:number};
}):Promise<{payment:RecordedPayment;replayed:boolean}>;
