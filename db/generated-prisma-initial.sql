-- Generated with Prisma CLI 6.19.3 from prisma/schema.prisma
-- Reference only: applied to dedicated Supabase project via Supabase migration history.
-- Do not run again on the same database and do not mistake this for a Prisma _prisma_migrations record.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "academy";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "hifz_men";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "hifz_women";

-- CreateTable
CREATE TABLE "core"."Branch" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Department" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Program" (
    "id" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Level" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "nameAr" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."AppUser" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT 'User',
    "gender" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "passwordHash" TEXT,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."AccessScope" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,

    CONSTRAINT "AccessScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."RoleAssignment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scopeId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."SensitiveAccessGrant" (
    "id" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "approverId" UUID,
    "scopeId" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "SensitiveAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."AuditEvent" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "scopeCode" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenApplication" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "accessTokenHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "programCode" TEXT NOT NULL DEFAULT 'HIFZ',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "consentVersion" TEXT NOT NULL,
    "privacyConsentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenPlacementSlot" (
    "id" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "locationAr" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MenPlacementSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenPlacementBooking" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "slotId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenPlacementBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenPlacementResult" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "score" INTEGER,
    "recommendedLevel" TEXT,
    "passed" BOOLEAN,
    "teacherNotes" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenPlacementResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenApplication" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "accessTokenHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "programCode" TEXT NOT NULL DEFAULT 'HIFZ',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "consentVersion" TEXT NOT NULL,
    "privacyConsentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WomenApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenPlacementSlot" (
    "id" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "locationAr" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WomenPlacementSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenPlacementBooking" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "slotId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenPlacementBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenPlacementResult" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "score" INTEGER,
    "recommendedLevel" TEXT,
    "passed" BOOLEAN,
    "teacherNotes" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenPlacementResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyApplication" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "accessTokenHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "department" TEXT NOT NULL,
    "programCode" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "consentVersion" TEXT NOT NULL,
    "privacyConsentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyPlacementSlot" (
    "department" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "locationAr" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AcademyPlacementSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyPlacementBooking" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "slotId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyPlacementBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyPlacementResult" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "score" INTEGER,
    "recommendedLevel" TEXT,
    "passed" BOOLEAN,
    "teacherNotes" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyPlacementResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."ContactInquiry" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."AuthSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenStudent" (
    "id" UUID NOT NULL,
    "applicationId" UUID,
    "userId" UUID,
    "fullName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenGuardianLink" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'PARENT',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MenGuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenClassGroup" (
    "id" UUID NOT NULL,
    "nameAr" TEXT NOT NULL,
    "levelId" UUID,
    "capacity" INTEGER NOT NULL DEFAULT 25,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenClassGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenEnrollment" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenTeacherAssignment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MenTeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenLessonSession" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',

    CONSTRAINT "MenLessonSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenQrCredential" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "MenQrCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenAttendance" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" UUID NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenStudent" (
    "id" UUID NOT NULL,
    "applicationId" UUID,
    "userId" UUID,
    "fullName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WomenStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenGuardianLink" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'PARENT',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WomenGuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenClassGroup" (
    "id" UUID NOT NULL,
    "nameAr" TEXT NOT NULL,
    "levelId" UUID,
    "capacity" INTEGER NOT NULL DEFAULT 25,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenClassGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenEnrollment" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenTeacherAssignment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WomenTeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenLessonSession" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',

    CONSTRAINT "WomenLessonSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenQrCredential" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "WomenQrCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenAttendance" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" UUID NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WomenAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyStudent" (
    "id" UUID NOT NULL,
    "applicationId" UUID,
    "userId" UUID,
    "fullName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyGuardianLink" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'PARENT',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AcademyGuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyClassGroup" (
    "id" UUID NOT NULL,
    "department" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "levelId" UUID,
    "capacity" INTEGER NOT NULL DEFAULT 25,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyClassGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyEnrollment" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyTeacherAssignment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AcademyTeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyLessonSession" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',

    CONSTRAINT "AcademyLessonSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyQrCredential" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "AcademyQrCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyAttendance" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" UUID NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenLearningRecord" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "activity" TEXT NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "ayahFrom" INTEGER NOT NULL,
    "ayahTo" INTEGER NOT NULL,
    "mastery" INTEGER NOT NULL,
    "memoryErrors" INTEGER NOT NULL DEFAULT 0,
    "tajweedErrors" INTEGER NOT NULL DEFAULT 0,
    "makharijErrors" INTEGER NOT NULL DEFAULT 0,
    "teacherNote" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenLearningRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenStudentReport" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "teacherComment" TEXT,
    "generatedBy" UUID,
    "approvedBy" UUID,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenStudentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenReportPreference" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "guardianUserId" UUID NOT NULL,
    "weekly" BOOLEAN NOT NULL DEFAULT true,
    "monthly" BOOLEAN NOT NULL DEFAULT true,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "requireTeacherApproval" BOOLEAN NOT NULL DEFAULT true,
    "emailOptInAt" TIMESTAMP(3),
    "whatsappOptInAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenReportPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenReportDelivery" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "guardianUserId" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processingAt" TIMESTAMP(3),
    "providerId" TEXT,
    "lastError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenReportDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenFamilyMessage" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenFamilyMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenFamilyNotification" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenFamilyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenLearningRecord" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "activity" TEXT NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "ayahFrom" INTEGER NOT NULL,
    "ayahTo" INTEGER NOT NULL,
    "mastery" INTEGER NOT NULL,
    "memoryErrors" INTEGER NOT NULL DEFAULT 0,
    "tajweedErrors" INTEGER NOT NULL DEFAULT 0,
    "makharijErrors" INTEGER NOT NULL DEFAULT 0,
    "teacherNote" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenLearningRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenStudentReport" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "teacherComment" TEXT,
    "generatedBy" UUID,
    "approvedBy" UUID,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WomenStudentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenReportPreference" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "guardianUserId" UUID NOT NULL,
    "weekly" BOOLEAN NOT NULL DEFAULT true,
    "monthly" BOOLEAN NOT NULL DEFAULT true,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "requireTeacherApproval" BOOLEAN NOT NULL DEFAULT true,
    "emailOptInAt" TIMESTAMP(3),
    "whatsappOptInAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WomenReportPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenReportDelivery" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "guardianUserId" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processingAt" TIMESTAMP(3),
    "providerId" TEXT,
    "lastError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenReportDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenFamilyMessage" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenFamilyMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenFamilyNotification" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenFamilyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyLearningRecord" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "activity" TEXT NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "ayahFrom" INTEGER NOT NULL,
    "ayahTo" INTEGER NOT NULL,
    "mastery" INTEGER NOT NULL,
    "memoryErrors" INTEGER NOT NULL DEFAULT 0,
    "tajweedErrors" INTEGER NOT NULL DEFAULT 0,
    "makharijErrors" INTEGER NOT NULL DEFAULT 0,
    "teacherNote" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyLearningRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyStudentReport" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "teacherComment" TEXT,
    "generatedBy" UUID,
    "approvedBy" UUID,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyStudentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyReportPreference" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "guardianUserId" UUID NOT NULL,
    "weekly" BOOLEAN NOT NULL DEFAULT true,
    "monthly" BOOLEAN NOT NULL DEFAULT true,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "requireTeacherApproval" BOOLEAN NOT NULL DEFAULT true,
    "emailOptInAt" TIMESTAMP(3),
    "whatsappOptInAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyReportPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyReportDelivery" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "guardianUserId" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processingAt" TIMESTAMP(3),
    "providerId" TEXT,
    "lastError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyReportDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyFamilyMessage" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyFamilyMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyFamilyNotification" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyFamilyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenRecitationConsent" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "grantedBy" UUID NOT NULL,
    "acceptedPrivacyVersion" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "MenRecitationConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenRecitationAttempt" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "groupId" UUID,
    "surahNumber" INTEGER NOT NULL,
    "ayahFrom" INTEGER NOT NULL,
    "ayahTo" INTEGER NOT NULL,
    "sourceEdition" TEXT NOT NULL DEFAULT 'quran-foundation-uthmani',
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processingStartedAt" TIMESTAMP(3),
    "provider" TEXT,
    "transcript" TEXT,
    "alignment" JSONB,
    "provisionalMatch" INTEGER,
    "failureCode" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" UUID,
    "teacherMastery" INTEGER,
    "teacherMemoryErrors" INTEGER,
    "teacherTajweedErrors" INTEGER,
    "teacherMakharijErrors" INTEGER,
    "teacherComment" TEXT,

    CONSTRAINT "MenRecitationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenRecitationConsent" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "grantedBy" UUID NOT NULL,
    "acceptedPrivacyVersion" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "WomenRecitationConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenRecitationAttempt" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "groupId" UUID,
    "surahNumber" INTEGER NOT NULL,
    "ayahFrom" INTEGER NOT NULL,
    "ayahTo" INTEGER NOT NULL,
    "sourceEdition" TEXT NOT NULL DEFAULT 'quran-foundation-uthmani',
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processingStartedAt" TIMESTAMP(3),
    "provider" TEXT,
    "transcript" TEXT,
    "alignment" JSONB,
    "provisionalMatch" INTEGER,
    "failureCode" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" UUID,
    "teacherMastery" INTEGER,
    "teacherMemoryErrors" INTEGER,
    "teacherTajweedErrors" INTEGER,
    "teacherMakharijErrors" INTEGER,
    "teacherComment" TEXT,

    CONSTRAINT "WomenRecitationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyRecitationConsent" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "grantedBy" UUID NOT NULL,
    "acceptedPrivacyVersion" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "AcademyRecitationConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyRecitationAttempt" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "groupId" UUID,
    "surahNumber" INTEGER NOT NULL,
    "ayahFrom" INTEGER NOT NULL,
    "ayahTo" INTEGER NOT NULL,
    "sourceEdition" TEXT NOT NULL DEFAULT 'quran-foundation-uthmani',
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processingStartedAt" TIMESTAMP(3),
    "provider" TEXT,
    "transcript" TEXT,
    "alignment" JSONB,
    "provisionalMatch" INTEGER,
    "failureCode" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" UUID,
    "teacherMastery" INTEGER,
    "teacherMemoryErrors" INTEGER,
    "teacherTajweedErrors" INTEGER,
    "teacherMakharijErrors" INTEGER,
    "teacherComment" TEXT,

    CONSTRAINT "AcademyRecitationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenVideo" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'LESSON',
    "levelId" UUID,
    "groupId" UUID,
    "visibility" TEXT NOT NULL DEFAULT 'ENROLLED',
    "status" TEXT NOT NULL DEFAULT 'UPLOADING',
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedBy" UUID NOT NULL,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "providerUid" VARCHAR(32) NOT NULL,
    "durationSeconds" DOUBLE PRECISION,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenVideo" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'LESSON',
    "levelId" UUID,
    "groupId" UUID,
    "visibility" TEXT NOT NULL DEFAULT 'ENROLLED',
    "status" TEXT NOT NULL DEFAULT 'UPLOADING',
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedBy" UUID NOT NULL,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "providerUid" VARCHAR(32) NOT NULL,
    "durationSeconds" DOUBLE PRECISION,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WomenVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyVideo" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'LESSON',
    "levelId" UUID,
    "groupId" UUID,
    "visibility" TEXT NOT NULL DEFAULT 'ENROLLED',
    "status" TEXT NOT NULL DEFAULT 'UPLOADING',
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedBy" UUID NOT NULL,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "providerUid" VARCHAR(32) NOT NULL,
    "durationSeconds" DOUBLE PRECISION,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenInvoice" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "number" VARCHAR(40) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "amountPiasters" INTEGER NOT NULL,
    "discountPiasters" INTEGER NOT NULL DEFAULT 0,
    "dueAt" DATE NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "issuedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenPayment" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "receiptNo" VARCHAR(45) NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "amountPiasters" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" VARCHAR(150),
    "recordedBy" UUID NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenCertificate" (
    "verificationConsentAt" TIMESTAMP(3),
    "verificationConsentBy" UUID,
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "serial" VARCHAR(50) NOT NULL,
    "verifyCode" VARCHAR(64) NOT NULL,
    "kind" TEXT NOT NULL,
    "courseTitle" VARCHAR(160) NOT NULL,
    "publicVerification" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "issuerId" UUID NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "MenCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenSanadEntry" (
    "id" UUID NOT NULL,
    "certificateId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "scholarName" VARCHAR(200) NOT NULL,

    CONSTRAINT "MenSanadEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenExam" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "notes" VARCHAR(2000),
    "assessedBy" UUID NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenReviewTask" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "surah" INTEGER NOT NULL,
    "fromAyah" INTEGER NOT NULL,
    "toAyah" INTEGER NOT NULL,
    "dueAt" DATE NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "lastMastery" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenReviewTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenAward" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" VARCHAR(250) NOT NULL,
    "awardedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_men"."MenWeeklySchedule" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "fromMinute" INTEGER NOT NULL,
    "toMinute" INTEGER NOT NULL,
    "roomCode" VARCHAR(64) NOT NULL,
    "teacherId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenWeeklySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenInvoice" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "number" VARCHAR(40) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "amountPiasters" INTEGER NOT NULL,
    "discountPiasters" INTEGER NOT NULL DEFAULT 0,
    "dueAt" DATE NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "issuedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenPayment" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "receiptNo" VARCHAR(45) NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "amountPiasters" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" VARCHAR(150),
    "recordedBy" UUID NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenCertificate" (
    "verificationConsentAt" TIMESTAMP(3),
    "verificationConsentBy" UUID,
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "serial" VARCHAR(50) NOT NULL,
    "verifyCode" VARCHAR(64) NOT NULL,
    "kind" TEXT NOT NULL,
    "courseTitle" VARCHAR(160) NOT NULL,
    "publicVerification" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "issuerId" UUID NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "WomenCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenSanadEntry" (
    "id" UUID NOT NULL,
    "certificateId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "scholarName" VARCHAR(200) NOT NULL,

    CONSTRAINT "WomenSanadEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenExam" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "notes" VARCHAR(2000),
    "assessedBy" UUID NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenReviewTask" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "surah" INTEGER NOT NULL,
    "fromAyah" INTEGER NOT NULL,
    "toAyah" INTEGER NOT NULL,
    "dueAt" DATE NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "lastMastery" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenReviewTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenAward" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" VARCHAR(250) NOT NULL,
    "awardedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hifz_women"."WomenWeeklySchedule" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "fromMinute" INTEGER NOT NULL,
    "toMinute" INTEGER NOT NULL,
    "roomCode" VARCHAR(64) NOT NULL,
    "teacherId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenWeeklySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyInvoice" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "number" VARCHAR(40) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "amountPiasters" INTEGER NOT NULL,
    "discountPiasters" INTEGER NOT NULL DEFAULT 0,
    "dueAt" DATE NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "issuedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyPayment" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "receiptNo" VARCHAR(45) NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "amountPiasters" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" VARCHAR(150),
    "recordedBy" UUID NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyCertificate" (
    "verificationConsentAt" TIMESTAMP(3),
    "verificationConsentBy" UUID,
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "serial" VARCHAR(50) NOT NULL,
    "verifyCode" VARCHAR(64) NOT NULL,
    "kind" TEXT NOT NULL,
    "courseTitle" VARCHAR(160) NOT NULL,
    "publicVerification" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "issuerId" UUID NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "AcademyCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademySanadEntry" (
    "id" UUID NOT NULL,
    "certificateId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "scholarName" VARCHAR(200) NOT NULL,

    CONSTRAINT "AcademySanadEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyExam" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "notes" VARCHAR(2000),
    "assessedBy" UUID NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyReviewTask" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "surah" INTEGER NOT NULL,
    "fromAyah" INTEGER NOT NULL,
    "toAyah" INTEGER NOT NULL,
    "dueAt" DATE NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "lastMastery" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyReviewTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyAward" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" VARCHAR(250) NOT NULL,
    "awardedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."AcademyWeeklySchedule" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "fromMinute" INTEGER NOT NULL,
    "toMinute" INTEGER NOT NULL,
    "roomCode" VARCHAR(64) NOT NULL,
    "teacherId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyWeeklySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "core"."Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "core"."Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Program_code_key" ON "core"."Program"("code");

-- CreateIndex
CREATE INDEX "Program_departmentId_idx" ON "core"."Program"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Level_programId_order_key" ON "core"."Level"("programId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "core"."AppUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AccessScope_code_key" ON "core"."AccessScope"("code");

-- CreateIndex
CREATE INDEX "RoleAssignment_scopeId_role_idx" ON "core"."RoleAssignment"("scopeId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssignment_userId_scopeId_role_key" ON "core"."RoleAssignment"("userId", "scopeId", "role");

-- CreateIndex
CREATE INDEX "SensitiveAccessGrant_scopeId_requesterId_expiresAt_idx" ON "core"."SensitiveAccessGrant"("scopeId", "requesterId", "expiresAt");

-- CreateIndex
CREATE INDEX "AuditEvent_scopeCode_occurredAt_idx" ON "core"."AuditEvent"("scopeCode", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenApplication_reference_key" ON "hifz_men"."MenApplication"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "MenApplication_accessTokenHash_key" ON "hifz_men"."MenApplication"("accessTokenHash");

-- CreateIndex
CREATE INDEX "MenApplication_status_createdAt_idx" ON "hifz_men"."MenApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MenPlacementSlot_startsAt_active_idx" ON "hifz_men"."MenPlacementSlot"("startsAt", "active");

-- CreateIndex
CREATE UNIQUE INDEX "MenPlacementBooking_applicationId_key" ON "hifz_men"."MenPlacementBooking"("applicationId");

-- CreateIndex
CREATE INDEX "MenPlacementBooking_slotId_idx" ON "hifz_men"."MenPlacementBooking"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "MenPlacementResult_bookingId_key" ON "hifz_men"."MenPlacementResult"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "WomenApplication_reference_key" ON "hifz_women"."WomenApplication"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "WomenApplication_accessTokenHash_key" ON "hifz_women"."WomenApplication"("accessTokenHash");

-- CreateIndex
CREATE INDEX "WomenApplication_status_createdAt_idx" ON "hifz_women"."WomenApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WomenPlacementSlot_startsAt_active_idx" ON "hifz_women"."WomenPlacementSlot"("startsAt", "active");

-- CreateIndex
CREATE UNIQUE INDEX "WomenPlacementBooking_applicationId_key" ON "hifz_women"."WomenPlacementBooking"("applicationId");

-- CreateIndex
CREATE INDEX "WomenPlacementBooking_slotId_idx" ON "hifz_women"."WomenPlacementBooking"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "WomenPlacementResult_bookingId_key" ON "hifz_women"."WomenPlacementResult"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyApplication_reference_key" ON "academy"."AcademyApplication"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyApplication_accessTokenHash_key" ON "academy"."AcademyApplication"("accessTokenHash");

-- CreateIndex
CREATE INDEX "AcademyApplication_status_createdAt_idx" ON "academy"."AcademyApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AcademyPlacementSlot_startsAt_active_idx" ON "academy"."AcademyPlacementSlot"("startsAt", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyPlacementBooking_applicationId_key" ON "academy"."AcademyPlacementBooking"("applicationId");

-- CreateIndex
CREATE INDEX "AcademyPlacementBooking_slotId_idx" ON "academy"."AcademyPlacementBooking"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyPlacementResult_bookingId_key" ON "academy"."AcademyPlacementResult"("bookingId");

-- CreateIndex
CREATE INDEX "ContactInquiry_createdAt_idx" ON "core"."ContactInquiry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "core"."AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "core"."AuthSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenStudent_applicationId_key" ON "hifz_men"."MenStudent"("applicationId");

-- CreateIndex
CREATE INDEX "MenStudent_fullName_idx" ON "hifz_men"."MenStudent"("fullName");

-- CreateIndex
CREATE INDEX "MenGuardianLink_userId_active_idx" ON "hifz_men"."MenGuardianLink"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "MenGuardianLink_studentId_userId_key" ON "hifz_men"."MenGuardianLink"("studentId", "userId");

-- CreateIndex
CREATE INDEX "MenEnrollment_groupId_active_idx" ON "hifz_men"."MenEnrollment"("groupId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "MenEnrollment_studentId_groupId_key" ON "hifz_men"."MenEnrollment"("studentId", "groupId");

-- CreateIndex
CREATE INDEX "MenTeacherAssignment_userId_active_idx" ON "hifz_men"."MenTeacherAssignment"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "MenTeacherAssignment_userId_groupId_key" ON "hifz_men"."MenTeacherAssignment"("userId", "groupId");

-- CreateIndex
CREATE INDEX "MenLessonSession_startsAt_idx" ON "hifz_men"."MenLessonSession"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenLessonSession_groupId_startsAt_key" ON "hifz_men"."MenLessonSession"("groupId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenQrCredential_tokenHash_key" ON "hifz_men"."MenQrCredential"("tokenHash");

-- CreateIndex
CREATE INDEX "MenQrCredential_studentId_revokedAt_idx" ON "hifz_men"."MenQrCredential"("studentId", "revokedAt");

-- CreateIndex
CREATE INDEX "MenAttendance_sessionId_status_idx" ON "hifz_men"."MenAttendance"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MenAttendance_studentId_sessionId_key" ON "hifz_men"."MenAttendance"("studentId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WomenStudent_applicationId_key" ON "hifz_women"."WomenStudent"("applicationId");

-- CreateIndex
CREATE INDEX "WomenStudent_fullName_idx" ON "hifz_women"."WomenStudent"("fullName");

-- CreateIndex
CREATE INDEX "WomenGuardianLink_userId_active_idx" ON "hifz_women"."WomenGuardianLink"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "WomenGuardianLink_studentId_userId_key" ON "hifz_women"."WomenGuardianLink"("studentId", "userId");

-- CreateIndex
CREATE INDEX "WomenEnrollment_groupId_active_idx" ON "hifz_women"."WomenEnrollment"("groupId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "WomenEnrollment_studentId_groupId_key" ON "hifz_women"."WomenEnrollment"("studentId", "groupId");

-- CreateIndex
CREATE INDEX "WomenTeacherAssignment_userId_active_idx" ON "hifz_women"."WomenTeacherAssignment"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "WomenTeacherAssignment_userId_groupId_key" ON "hifz_women"."WomenTeacherAssignment"("userId", "groupId");

-- CreateIndex
CREATE INDEX "WomenLessonSession_startsAt_idx" ON "hifz_women"."WomenLessonSession"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "WomenLessonSession_groupId_startsAt_key" ON "hifz_women"."WomenLessonSession"("groupId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "WomenQrCredential_tokenHash_key" ON "hifz_women"."WomenQrCredential"("tokenHash");

-- CreateIndex
CREATE INDEX "WomenQrCredential_studentId_revokedAt_idx" ON "hifz_women"."WomenQrCredential"("studentId", "revokedAt");

-- CreateIndex
CREATE INDEX "WomenAttendance_sessionId_status_idx" ON "hifz_women"."WomenAttendance"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WomenAttendance_studentId_sessionId_key" ON "hifz_women"."WomenAttendance"("studentId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyStudent_applicationId_key" ON "academy"."AcademyStudent"("applicationId");

-- CreateIndex
CREATE INDEX "AcademyStudent_fullName_idx" ON "academy"."AcademyStudent"("fullName");

-- CreateIndex
CREATE INDEX "AcademyGuardianLink_userId_active_idx" ON "academy"."AcademyGuardianLink"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyGuardianLink_studentId_userId_key" ON "academy"."AcademyGuardianLink"("studentId", "userId");

-- CreateIndex
CREATE INDEX "AcademyEnrollment_groupId_active_idx" ON "academy"."AcademyEnrollment"("groupId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyEnrollment_studentId_groupId_key" ON "academy"."AcademyEnrollment"("studentId", "groupId");

-- CreateIndex
CREATE INDEX "AcademyTeacherAssignment_userId_active_idx" ON "academy"."AcademyTeacherAssignment"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyTeacherAssignment_userId_groupId_key" ON "academy"."AcademyTeacherAssignment"("userId", "groupId");

-- CreateIndex
CREATE INDEX "AcademyLessonSession_startsAt_idx" ON "academy"."AcademyLessonSession"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyLessonSession_groupId_startsAt_key" ON "academy"."AcademyLessonSession"("groupId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyQrCredential_tokenHash_key" ON "academy"."AcademyQrCredential"("tokenHash");

-- CreateIndex
CREATE INDEX "AcademyQrCredential_studentId_revokedAt_idx" ON "academy"."AcademyQrCredential"("studentId", "revokedAt");

-- CreateIndex
CREATE INDEX "AcademyAttendance_sessionId_status_idx" ON "academy"."AcademyAttendance"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyAttendance_studentId_sessionId_key" ON "academy"."AcademyAttendance"("studentId", "sessionId");

-- CreateIndex
CREATE INDEX "MenLearningRecord_studentId_assessedAt_idx" ON "hifz_men"."MenLearningRecord"("studentId", "assessedAt");

-- CreateIndex
CREATE INDEX "MenLearningRecord_groupId_assessedAt_idx" ON "hifz_men"."MenLearningRecord"("groupId", "assessedAt");

-- CreateIndex
CREATE INDEX "MenStudentReport_status_periodStart_idx" ON "hifz_men"."MenStudentReport"("status", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "MenStudentReport_studentId_periodType_periodStart_key" ON "hifz_men"."MenStudentReport"("studentId", "periodType", "periodStart");

-- CreateIndex
CREATE INDEX "MenReportPreference_guardianUserId_idx" ON "hifz_men"."MenReportPreference"("guardianUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MenReportPreference_studentId_guardianUserId_key" ON "hifz_men"."MenReportPreference"("studentId", "guardianUserId");

-- CreateIndex
CREATE INDEX "MenReportDelivery_status_createdAt_idx" ON "hifz_men"."MenReportDelivery"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenReportDelivery_reportId_guardianUserId_method_key" ON "hifz_men"."MenReportDelivery"("reportId", "guardianUserId", "method");

-- CreateIndex
CREATE INDEX "MenFamilyMessage_studentId_createdAt_idx" ON "hifz_men"."MenFamilyMessage"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "MenFamilyMessage_recipientId_readAt_idx" ON "hifz_men"."MenFamilyMessage"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "MenFamilyNotification_recipientId_createdAt_idx" ON "hifz_men"."MenFamilyNotification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "WomenLearningRecord_studentId_assessedAt_idx" ON "hifz_women"."WomenLearningRecord"("studentId", "assessedAt");

-- CreateIndex
CREATE INDEX "WomenLearningRecord_groupId_assessedAt_idx" ON "hifz_women"."WomenLearningRecord"("groupId", "assessedAt");

-- CreateIndex
CREATE INDEX "WomenStudentReport_status_periodStart_idx" ON "hifz_women"."WomenStudentReport"("status", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "WomenStudentReport_studentId_periodType_periodStart_key" ON "hifz_women"."WomenStudentReport"("studentId", "periodType", "periodStart");

-- CreateIndex
CREATE INDEX "WomenReportPreference_guardianUserId_idx" ON "hifz_women"."WomenReportPreference"("guardianUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WomenReportPreference_studentId_guardianUserId_key" ON "hifz_women"."WomenReportPreference"("studentId", "guardianUserId");

-- CreateIndex
CREATE INDEX "WomenReportDelivery_status_createdAt_idx" ON "hifz_women"."WomenReportDelivery"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WomenReportDelivery_reportId_guardianUserId_method_key" ON "hifz_women"."WomenReportDelivery"("reportId", "guardianUserId", "method");

-- CreateIndex
CREATE INDEX "WomenFamilyMessage_studentId_createdAt_idx" ON "hifz_women"."WomenFamilyMessage"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "WomenFamilyMessage_recipientId_readAt_idx" ON "hifz_women"."WomenFamilyMessage"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "WomenFamilyNotification_recipientId_createdAt_idx" ON "hifz_women"."WomenFamilyNotification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "AcademyLearningRecord_studentId_assessedAt_idx" ON "academy"."AcademyLearningRecord"("studentId", "assessedAt");

-- CreateIndex
CREATE INDEX "AcademyLearningRecord_groupId_assessedAt_idx" ON "academy"."AcademyLearningRecord"("groupId", "assessedAt");

-- CreateIndex
CREATE INDEX "AcademyStudentReport_status_periodStart_idx" ON "academy"."AcademyStudentReport"("status", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyStudentReport_studentId_periodType_periodStart_key" ON "academy"."AcademyStudentReport"("studentId", "periodType", "periodStart");

-- CreateIndex
CREATE INDEX "AcademyReportPreference_guardianUserId_idx" ON "academy"."AcademyReportPreference"("guardianUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyReportPreference_studentId_guardianUserId_key" ON "academy"."AcademyReportPreference"("studentId", "guardianUserId");

-- CreateIndex
CREATE INDEX "AcademyReportDelivery_status_createdAt_idx" ON "academy"."AcademyReportDelivery"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyReportDelivery_reportId_guardianUserId_method_key" ON "academy"."AcademyReportDelivery"("reportId", "guardianUserId", "method");

-- CreateIndex
CREATE INDEX "AcademyFamilyMessage_studentId_createdAt_idx" ON "academy"."AcademyFamilyMessage"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "AcademyFamilyMessage_recipientId_readAt_idx" ON "academy"."AcademyFamilyMessage"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "AcademyFamilyNotification_recipientId_createdAt_idx" ON "academy"."AcademyFamilyNotification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "MenRecitationConsent_studentId_revokedAt_idx" ON "hifz_men"."MenRecitationConsent"("studentId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenRecitationConsent_studentId_grantedBy_key" ON "hifz_men"."MenRecitationConsent"("studentId", "grantedBy");

-- CreateIndex
CREATE UNIQUE INDEX "MenRecitationAttempt_storageKey_key" ON "hifz_men"."MenRecitationAttempt"("storageKey");

-- CreateIndex
CREATE INDEX "MenRecitationAttempt_studentId_submittedAt_idx" ON "hifz_men"."MenRecitationAttempt"("studentId", "submittedAt");

-- CreateIndex
CREATE INDEX "MenRecitationAttempt_state_submittedAt_idx" ON "hifz_men"."MenRecitationAttempt"("state", "submittedAt");

-- CreateIndex
CREATE INDEX "WomenRecitationConsent_studentId_revokedAt_idx" ON "hifz_women"."WomenRecitationConsent"("studentId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WomenRecitationConsent_studentId_grantedBy_key" ON "hifz_women"."WomenRecitationConsent"("studentId", "grantedBy");

-- CreateIndex
CREATE UNIQUE INDEX "WomenRecitationAttempt_storageKey_key" ON "hifz_women"."WomenRecitationAttempt"("storageKey");

-- CreateIndex
CREATE INDEX "WomenRecitationAttempt_studentId_submittedAt_idx" ON "hifz_women"."WomenRecitationAttempt"("studentId", "submittedAt");

-- CreateIndex
CREATE INDEX "WomenRecitationAttempt_state_submittedAt_idx" ON "hifz_women"."WomenRecitationAttempt"("state", "submittedAt");

-- CreateIndex
CREATE INDEX "AcademyRecitationConsent_studentId_revokedAt_idx" ON "academy"."AcademyRecitationConsent"("studentId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyRecitationConsent_studentId_grantedBy_key" ON "academy"."AcademyRecitationConsent"("studentId", "grantedBy");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyRecitationAttempt_storageKey_key" ON "academy"."AcademyRecitationAttempt"("storageKey");

-- CreateIndex
CREATE INDEX "AcademyRecitationAttempt_studentId_submittedAt_idx" ON "academy"."AcademyRecitationAttempt"("studentId", "submittedAt");

-- CreateIndex
CREATE INDEX "AcademyRecitationAttempt_state_submittedAt_idx" ON "academy"."AcademyRecitationAttempt"("state", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenVideo_providerUid_key" ON "hifz_men"."MenVideo"("providerUid");

-- CreateIndex
CREATE INDEX "MenVideo_visibility_status_reviewStatus_publishedAt_idx" ON "hifz_men"."MenVideo"("visibility", "status", "reviewStatus", "publishedAt");

-- CreateIndex
CREATE INDEX "MenVideo_groupId_levelId_idx" ON "hifz_men"."MenVideo"("groupId", "levelId");

-- CreateIndex
CREATE INDEX "MenVideo_uploadedBy_createdAt_idx" ON "hifz_men"."MenVideo"("uploadedBy", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WomenVideo_providerUid_key" ON "hifz_women"."WomenVideo"("providerUid");

-- CreateIndex
CREATE INDEX "WomenVideo_visibility_status_reviewStatus_publishedAt_idx" ON "hifz_women"."WomenVideo"("visibility", "status", "reviewStatus", "publishedAt");

-- CreateIndex
CREATE INDEX "WomenVideo_groupId_levelId_idx" ON "hifz_women"."WomenVideo"("groupId", "levelId");

-- CreateIndex
CREATE INDEX "WomenVideo_uploadedBy_createdAt_idx" ON "hifz_women"."WomenVideo"("uploadedBy", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyVideo_providerUid_key" ON "academy"."AcademyVideo"("providerUid");

-- CreateIndex
CREATE INDEX "AcademyVideo_visibility_status_reviewStatus_publishedAt_idx" ON "academy"."AcademyVideo"("visibility", "status", "reviewStatus", "publishedAt");

-- CreateIndex
CREATE INDEX "AcademyVideo_groupId_levelId_idx" ON "academy"."AcademyVideo"("groupId", "levelId");

-- CreateIndex
CREATE INDEX "AcademyVideo_uploadedBy_createdAt_idx" ON "academy"."AcademyVideo"("uploadedBy", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenInvoice_number_key" ON "hifz_men"."MenInvoice"("number");

-- CreateIndex
CREATE INDEX "MenInvoice_studentId_dueAt_idx" ON "hifz_men"."MenInvoice"("studentId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenPayment_receiptNo_key" ON "hifz_men"."MenPayment"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "MenPayment_idempotencyKey_key" ON "hifz_men"."MenPayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MenPayment_invoiceId_receivedAt_idx" ON "hifz_men"."MenPayment"("invoiceId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenCertificate_serial_key" ON "hifz_men"."MenCertificate"("serial");

-- CreateIndex
CREATE UNIQUE INDEX "MenCertificate_verifyCode_key" ON "hifz_men"."MenCertificate"("verifyCode");

-- CreateIndex
CREATE INDEX "MenCertificate_studentId_issuedAt_idx" ON "hifz_men"."MenCertificate"("studentId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenSanadEntry_certificateId_position_key" ON "hifz_men"."MenSanadEntry"("certificateId", "position");

-- CreateIndex
CREATE INDEX "MenExam_studentId_assessedAt_idx" ON "hifz_men"."MenExam"("studentId", "assessedAt");

-- CreateIndex
CREATE INDEX "MenReviewTask_studentId_dueAt_completedAt_idx" ON "hifz_men"."MenReviewTask"("studentId", "dueAt", "completedAt");

-- CreateIndex
CREATE INDEX "MenAward_studentId_createdAt_idx" ON "hifz_men"."MenAward"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "MenWeeklySchedule_weekday_fromMinute_toMinute_idx" ON "hifz_men"."MenWeeklySchedule"("weekday", "fromMinute", "toMinute");

-- CreateIndex
CREATE INDEX "MenWeeklySchedule_teacherId_weekday_idx" ON "hifz_men"."MenWeeklySchedule"("teacherId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "WomenInvoice_number_key" ON "hifz_women"."WomenInvoice"("number");

-- CreateIndex
CREATE INDEX "WomenInvoice_studentId_dueAt_idx" ON "hifz_women"."WomenInvoice"("studentId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "WomenPayment_receiptNo_key" ON "hifz_women"."WomenPayment"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "WomenPayment_idempotencyKey_key" ON "hifz_women"."WomenPayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WomenPayment_invoiceId_receivedAt_idx" ON "hifz_women"."WomenPayment"("invoiceId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WomenCertificate_serial_key" ON "hifz_women"."WomenCertificate"("serial");

-- CreateIndex
CREATE UNIQUE INDEX "WomenCertificate_verifyCode_key" ON "hifz_women"."WomenCertificate"("verifyCode");

-- CreateIndex
CREATE INDEX "WomenCertificate_studentId_issuedAt_idx" ON "hifz_women"."WomenCertificate"("studentId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WomenSanadEntry_certificateId_position_key" ON "hifz_women"."WomenSanadEntry"("certificateId", "position");

-- CreateIndex
CREATE INDEX "WomenExam_studentId_assessedAt_idx" ON "hifz_women"."WomenExam"("studentId", "assessedAt");

-- CreateIndex
CREATE INDEX "WomenReviewTask_studentId_dueAt_completedAt_idx" ON "hifz_women"."WomenReviewTask"("studentId", "dueAt", "completedAt");

-- CreateIndex
CREATE INDEX "WomenAward_studentId_createdAt_idx" ON "hifz_women"."WomenAward"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "WomenWeeklySchedule_weekday_fromMinute_toMinute_idx" ON "hifz_women"."WomenWeeklySchedule"("weekday", "fromMinute", "toMinute");

-- CreateIndex
CREATE INDEX "WomenWeeklySchedule_teacherId_weekday_idx" ON "hifz_women"."WomenWeeklySchedule"("teacherId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyInvoice_number_key" ON "academy"."AcademyInvoice"("number");

-- CreateIndex
CREATE INDEX "AcademyInvoice_studentId_dueAt_idx" ON "academy"."AcademyInvoice"("studentId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyPayment_receiptNo_key" ON "academy"."AcademyPayment"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyPayment_idempotencyKey_key" ON "academy"."AcademyPayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AcademyPayment_invoiceId_receivedAt_idx" ON "academy"."AcademyPayment"("invoiceId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyCertificate_serial_key" ON "academy"."AcademyCertificate"("serial");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyCertificate_verifyCode_key" ON "academy"."AcademyCertificate"("verifyCode");

-- CreateIndex
CREATE INDEX "AcademyCertificate_studentId_issuedAt_idx" ON "academy"."AcademyCertificate"("studentId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademySanadEntry_certificateId_position_key" ON "academy"."AcademySanadEntry"("certificateId", "position");

-- CreateIndex
CREATE INDEX "AcademyExam_studentId_assessedAt_idx" ON "academy"."AcademyExam"("studentId", "assessedAt");

-- CreateIndex
CREATE INDEX "AcademyReviewTask_studentId_dueAt_completedAt_idx" ON "academy"."AcademyReviewTask"("studentId", "dueAt", "completedAt");

-- CreateIndex
CREATE INDEX "AcademyAward_studentId_createdAt_idx" ON "academy"."AcademyAward"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "AcademyWeeklySchedule_weekday_fromMinute_toMinute_idx" ON "academy"."AcademyWeeklySchedule"("weekday", "fromMinute", "toMinute");

-- CreateIndex
CREATE INDEX "AcademyWeeklySchedule_teacherId_weekday_idx" ON "academy"."AcademyWeeklySchedule"("teacherId", "weekday");

-- AddForeignKey
ALTER TABLE "core"."Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "core"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Level" ADD CONSTRAINT "Level_programId_fkey" FOREIGN KEY ("programId") REFERENCES "core"."Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "core"."AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "core"."AccessScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."SensitiveAccessGrant" ADD CONSTRAINT "SensitiveAccessGrant_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "core"."AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."SensitiveAccessGrant" ADD CONSTRAINT "SensitiveAccessGrant_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "core"."AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."SensitiveAccessGrant" ADD CONSTRAINT "SensitiveAccessGrant_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "core"."AccessScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenPlacementBooking" ADD CONSTRAINT "MenPlacementBooking_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "hifz_men"."MenApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenPlacementBooking" ADD CONSTRAINT "MenPlacementBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "hifz_men"."MenPlacementSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenPlacementResult" ADD CONSTRAINT "MenPlacementResult_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "hifz_men"."MenPlacementBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenPlacementBooking" ADD CONSTRAINT "WomenPlacementBooking_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "hifz_women"."WomenApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenPlacementBooking" ADD CONSTRAINT "WomenPlacementBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "hifz_women"."WomenPlacementSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenPlacementResult" ADD CONSTRAINT "WomenPlacementResult_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "hifz_women"."WomenPlacementBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyPlacementBooking" ADD CONSTRAINT "AcademyPlacementBooking_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "academy"."AcademyApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyPlacementBooking" ADD CONSTRAINT "AcademyPlacementBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "academy"."AcademyPlacementSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyPlacementResult" ADD CONSTRAINT "AcademyPlacementResult_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "academy"."AcademyPlacementBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "core"."AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenGuardianLink" ADD CONSTRAINT "MenGuardianLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenEnrollment" ADD CONSTRAINT "MenEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenEnrollment" ADD CONSTRAINT "MenEnrollment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "hifz_men"."MenClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenTeacherAssignment" ADD CONSTRAINT "MenTeacherAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "hifz_men"."MenClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenLessonSession" ADD CONSTRAINT "MenLessonSession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "hifz_men"."MenClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenQrCredential" ADD CONSTRAINT "MenQrCredential_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenAttendance" ADD CONSTRAINT "MenAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenAttendance" ADD CONSTRAINT "MenAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "hifz_men"."MenLessonSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenGuardianLink" ADD CONSTRAINT "WomenGuardianLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenEnrollment" ADD CONSTRAINT "WomenEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenEnrollment" ADD CONSTRAINT "WomenEnrollment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "hifz_women"."WomenClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenTeacherAssignment" ADD CONSTRAINT "WomenTeacherAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "hifz_women"."WomenClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenLessonSession" ADD CONSTRAINT "WomenLessonSession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "hifz_women"."WomenClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenQrCredential" ADD CONSTRAINT "WomenQrCredential_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenAttendance" ADD CONSTRAINT "WomenAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenAttendance" ADD CONSTRAINT "WomenAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "hifz_women"."WomenLessonSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyGuardianLink" ADD CONSTRAINT "AcademyGuardianLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyEnrollment" ADD CONSTRAINT "AcademyEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyEnrollment" ADD CONSTRAINT "AcademyEnrollment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "academy"."AcademyClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyTeacherAssignment" ADD CONSTRAINT "AcademyTeacherAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "academy"."AcademyClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyLessonSession" ADD CONSTRAINT "AcademyLessonSession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "academy"."AcademyClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyQrCredential" ADD CONSTRAINT "AcademyQrCredential_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyAttendance" ADD CONSTRAINT "AcademyAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyAttendance" ADD CONSTRAINT "AcademyAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academy"."AcademyLessonSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenLearningRecord" ADD CONSTRAINT "MenLearningRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenStudentReport" ADD CONSTRAINT "MenStudentReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenReportPreference" ADD CONSTRAINT "MenReportPreference_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenReportDelivery" ADD CONSTRAINT "MenReportDelivery_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "hifz_men"."MenStudentReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenFamilyMessage" ADD CONSTRAINT "MenFamilyMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenFamilyNotification" ADD CONSTRAINT "MenFamilyNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenLearningRecord" ADD CONSTRAINT "WomenLearningRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenStudentReport" ADD CONSTRAINT "WomenStudentReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenReportPreference" ADD CONSTRAINT "WomenReportPreference_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenReportDelivery" ADD CONSTRAINT "WomenReportDelivery_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "hifz_women"."WomenStudentReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenFamilyMessage" ADD CONSTRAINT "WomenFamilyMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenFamilyNotification" ADD CONSTRAINT "WomenFamilyNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyLearningRecord" ADD CONSTRAINT "AcademyLearningRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyStudentReport" ADD CONSTRAINT "AcademyStudentReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyReportPreference" ADD CONSTRAINT "AcademyReportPreference_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyReportDelivery" ADD CONSTRAINT "AcademyReportDelivery_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "academy"."AcademyStudentReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyFamilyMessage" ADD CONSTRAINT "AcademyFamilyMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyFamilyNotification" ADD CONSTRAINT "AcademyFamilyNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenRecitationConsent" ADD CONSTRAINT "MenRecitationConsent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenRecitationAttempt" ADD CONSTRAINT "MenRecitationAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenRecitationConsent" ADD CONSTRAINT "WomenRecitationConsent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenRecitationAttempt" ADD CONSTRAINT "WomenRecitationAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyRecitationConsent" ADD CONSTRAINT "AcademyRecitationConsent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyRecitationAttempt" ADD CONSTRAINT "AcademyRecitationAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenVideo" ADD CONSTRAINT "MenVideo_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "hifz_men"."MenClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenVideo" ADD CONSTRAINT "WomenVideo_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "hifz_women"."WomenClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyVideo" ADD CONSTRAINT "AcademyVideo_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "academy"."AcademyClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenInvoice" ADD CONSTRAINT "MenInvoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenPayment" ADD CONSTRAINT "MenPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "hifz_men"."MenInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenCertificate" ADD CONSTRAINT "MenCertificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenSanadEntry" ADD CONSTRAINT "MenSanadEntry_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "hifz_men"."MenCertificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenExam" ADD CONSTRAINT "MenExam_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenReviewTask" ADD CONSTRAINT "MenReviewTask_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenAward" ADD CONSTRAINT "MenAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_men"."MenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_men"."MenWeeklySchedule" ADD CONSTRAINT "MenWeeklySchedule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "hifz_men"."MenClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenInvoice" ADD CONSTRAINT "WomenInvoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenPayment" ADD CONSTRAINT "WomenPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "hifz_women"."WomenInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenCertificate" ADD CONSTRAINT "WomenCertificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenSanadEntry" ADD CONSTRAINT "WomenSanadEntry_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "hifz_women"."WomenCertificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenExam" ADD CONSTRAINT "WomenExam_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenReviewTask" ADD CONSTRAINT "WomenReviewTask_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenAward" ADD CONSTRAINT "WomenAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "hifz_women"."WomenStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hifz_women"."WomenWeeklySchedule" ADD CONSTRAINT "WomenWeeklySchedule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "hifz_women"."WomenClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyInvoice" ADD CONSTRAINT "AcademyInvoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyPayment" ADD CONSTRAINT "AcademyPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "academy"."AcademyInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyCertificate" ADD CONSTRAINT "AcademyCertificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademySanadEntry" ADD CONSTRAINT "AcademySanadEntry_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "academy"."AcademyCertificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyExam" ADD CONSTRAINT "AcademyExam_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyReviewTask" ADD CONSTRAINT "AcademyReviewTask_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyAward" ADD CONSTRAINT "AcademyAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy"."AcademyStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."AcademyWeeklySchedule" ADD CONSTRAINT "AcademyWeeklySchedule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "academy"."AcademyClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

