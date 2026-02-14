/*
  Warnings:

  - A unique constraint covering the columns `[username_hash]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_hash_key" ON "users"("username_hash");
