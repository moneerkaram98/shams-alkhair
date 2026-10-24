import test from 'node:test';
import assert from 'node:assert/strict';
import {recordManualPaymentWithinTransaction} from '../lib/manual-payment.mjs';

function fakeDatabase({failAudit=false}={}){
 let state={invoice:{id:'invoice-1',amountPiasters:20000,discountPiasters:2000,voidedAt:null}, payments:[],audits:[]};
 const transaction=async(callback,opts)=>{
  assert.equal(opts.isolationLevel,'Serializable');
  const pending=structuredClone(state);const tx={
   MenInvoice:{findUnique:async({where})=>where.id===pending.invoice.id?{...pending.invoice,payments:pending.payments.map(p=>({amountPiasters:p.amountPiasters}))}:null},
   MenPayment:{
     findUnique:async({where})=>pending.payments.find(p=>p.idempotencyKey===where.idempotencyKey)||null,
     create:async({data})=>{const row={id:`payment-${pending.payments.length+1}`,...data};pending.payments.push(row);return row;}
   },
   auditEvent:{create:async({data,select})=>{assert.deepEqual(select,{id:true});if(failAudit)throw Error('AUDIT_UNAVAILABLE');pending.audits.push(data);return {id:'audit-1'};}}
  };
  const result=await callback(tx);
  state=pending;
  return result;
 };
 return {transaction,get state(){return state;}};
}
const request={invoiceId:'invoice-1',idempotencyKey:'11111111-1111-4111-8111-111111111111',amountPiasters:5000,method:'CASH'};
function call(tx,req=request){return recordManualPaymentWithinTransaction({tx,prefix:'Men',request:req,actorId:'staff-1',scopeCode:'HIFZ_MEN',makeReceipt:()=> 'receipt-1',calculateBalance:(i,ps)=>({remainingPiasters:i.amountPiasters-i.discountPiasters-ps.reduce((sum,p)=>sum+p.amountPiasters,0)})});}

test('Payment creates receipt and audit atomically',async()=>{
 const db=fakeDatabase();const created=await db.transaction(tx=>call(tx),{isolationLevel:'Serializable'});
 assert.equal(created.replayed,false);assert.equal(db.state.payments.length,1);assert.equal(db.state.audits.length,1);
 assert.equal(db.state.audits[0].action,'MANUAL_PAYMENT_RECORD');
});
test('same idempotency key and identical request replays without duplicate charge',async()=>{
 const db=fakeDatabase();await db.transaction(tx=>call(tx),{isolationLevel:'Serializable'});
 const replay=await db.transaction(tx=>call(tx),{isolationLevel:'Serializable'});
 assert.equal(replay.replayed,true);assert.equal(db.state.payments.length,1);assert.equal(db.state.audits.length,1);
});
test('same key with different amount fails closed',async()=>{
 const db=fakeDatabase();await db.transaction(tx=>call(tx),{isolationLevel:'Serializable'});
 await assert.rejects(()=>db.transaction(tx=>call(tx,{...request,amountPiasters:1000}),{isolationLevel:'Serializable'}),/PAYMENT_KEY_CONFLICT/);
 assert.equal(db.state.payments.length,1);
});
test('more than remaining balance rejected',async()=>{
 const db=fakeDatabase();await assert.rejects(()=>db.transaction(tx=>call(tx,{...request,amountPiasters:18001}),{isolationLevel:'Serializable'}),/OVERPAYMENT/);
 assert.equal(db.state.payments.length,0);assert.equal(db.state.audits.length,0);
});
test('audit failure aborts entire payment transaction',async()=>{
 const db=fakeDatabase({failAudit:true});await assert.rejects(()=>db.transaction(tx=>call(tx),{isolationLevel:'Serializable'}),/AUDIT_UNAVAILABLE/);
 assert.equal(db.state.payments.length,0);
});
