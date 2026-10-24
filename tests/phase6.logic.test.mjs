import test from 'node:test';
import assert from 'node:assert/strict';
import {invoiceBalance,nextReview,nextDue,minutesFromClock,safeTimeRange,overlap,progressBySurah} from '../lib/stage6-calculations.mjs';
test('invoice amounts in piasters; partial and paid balances',()=>{
 assert.deepEqual(invoiceBalance({amountPiasters:20000,discountPiasters:1000,voidedAt:null},[{amountPiasters:3000}]),{totalPiasters:19000,paidPiasters:3000,remainingPiasters:16000,status:'PARTIAL'});
 assert.equal(invoiceBalance({amountPiasters:20000,discountPiasters:1000},[{amountPiasters:19000}]).status,'PAID');
 assert.equal(invoiceBalance({amountPiasters:20000,discountPiasters:1000,voidedAt:new Date()},[]).status,'VOID');
});
test('never accept overpayments in ledger computation',()=>assert.throws(()=>invoiceBalance({amountPiasters:1000,discountPiasters:0},[{amountPiasters:1001}])));
test('review algorithm increases with mastery with ceiling',()=>{assert.equal(nextReview(59),1);assert.equal(nextReview(70),2);assert.equal(nextReview(90,5),10);assert.equal(nextReview(100,40),90);assert.throws(()=>nextReview(101));});
test('review date computation works across month boundaries',()=>assert.equal(nextDue('2026-10-31T00:00:00Z',2).toISOString().slice(0,10),'2026-11-02'));
test('clock parsing rejects malformed values',()=>{assert.equal(minutesFromClock('17:30'),1050);assert.throws(()=>minutesFromClock('25:77'));assert.ok(safeTimeRange(600,660));assert.equal(safeTimeRange(660,600),false)});
test('weekly schedule overlap considers weekdays and half-open intervals',()=>{const a={weekday:2,fromMinute:600,toMinute:660};assert.equal(overlap(a,{weekday:2,fromMinute:650,toMinute:700}),true);assert.equal(overlap(a,{weekday:2,fromMinute:660,toMinute:700}),false);assert.equal(overlap(a,{weekday:3,fromMinute:650,toMinute:700}),false);});
test('progress grouped by surah and latest teacher mastery',()=>{const result=progressBySurah([{surahNumber:2,activity:'REVIEW',mastery:92},{surahNumber:2,activity:'NEW_MEMORIZATION',mastery:66},{surahNumber:1,activity:'REVIEW',mastery:100}]);assert.deepEqual(result,[{surah:1,newCount:0,reviewCount:1,latestMastery:100},{surah:2,newCount:1,reviewCount:1,latestMastery:92}]);});
