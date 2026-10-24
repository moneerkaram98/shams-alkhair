/**
 * Executed INSIDE a Prisma serializable transaction. Does not import Prisma or
 * Next.js so the same financial behavior can be tested without a live server.
 * The caller must authenticate the actor and authorize FINANCE for the scope.
 */
export async function recordManualPaymentWithinTransaction({tx, prefix, request, actorId, scopeCode, makeReceipt, calculateBalance}) {
  const invoices = tx[`${prefix}Invoice`];
  const payments = tx[`${prefix}Payment`];
  const previous = await payments.findUnique({where:{idempotencyKey:request.idempotencyKey}});
  if (previous) {
    if (previous.invoiceId!==request.invoiceId ||
        previous.amountPiasters!==request.amountPiasters ||
        previous.method!==request.method ||
        (previous.reference??null)!==(request.reference??null) ||
        previous.recordedBy!==actorId) {
      throw new Error('PAYMENT_KEY_CONFLICT');
    }
    return {payment:previous,replayed:true};
  }
  const invoice=await invoices.findUnique({where:{id:request.invoiceId},include:{payments:{select:{amountPiasters:true}}}});
  if(!invoice || invoice.voidedAt)throw new Error('INVOICE_UNAVAILABLE');
  if(request.amountPiasters>calculateBalance(invoice,invoice.payments).remainingPiasters) {
    throw new Error('OVERPAYMENT');
  }
  const payment=await payments.create({data:{
    invoiceId:request.invoiceId,
    idempotencyKey:request.idempotencyKey,
    receiptNo:makeReceipt(),
    amountPiasters:request.amountPiasters,
    method:request.method,
    reference:request.reference,
    recordedBy:actorId
  }});
  // Select only id: the DB runtime role deliberately has no permission to
  // SELECT full audit records, and a failed INSERT rolls back the payment.
  await tx.auditEvent.create({
    data:{actorId,scopeCode,action:'MANUAL_PAYMENT_RECORD',subjectType:'PAYMENT',subjectId:payment.id},
    select:{id:true}
  });
  return {payment,replayed:false};
}
