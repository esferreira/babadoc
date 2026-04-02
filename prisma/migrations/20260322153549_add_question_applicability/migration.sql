-- CreateTable
CREATE TABLE "QuestionApplicability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionApplicability_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "QuestionApplicability_artifactType_idx" ON "QuestionApplicability"("artifactType");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionApplicability_questionId_artifactType_key" ON "QuestionApplicability"("questionId", "artifactType");
