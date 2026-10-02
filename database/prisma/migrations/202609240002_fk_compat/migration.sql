-- NO ACTION preserves referential integrity and yields standard SQLSTATE 23503.
ALTER TABLE "teams" DROP CONSTRAINT "teams_clubId_fkey";
ALTER TABLE "teams" ADD CONSTRAINT "teams_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "teams" DROP CONSTRAINT "teams_coachId_fkey";
ALTER TABLE "teams" ADD CONSTRAINT "teams_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "tournament_teams" DROP CONSTRAINT "tournament_teams_teamId_fkey";
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "matches" DROP CONSTRAINT "matches_tournamentId_fkey";
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "matches" DROP CONSTRAINT "matches_homeTeamId_fkey";
ALTER TABLE "matches" ADD CONSTRAINT "matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "matches" DROP CONSTRAINT "matches_awayTeamId_fkey";
ALTER TABLE "matches" ADD CONSTRAINT "matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "matches" DROP CONSTRAINT "matches_tournamentId_homeTeamId_fkey";
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_homeTeamId_fkey" FOREIGN KEY ("tournamentId", "homeTeamId") REFERENCES "tournament_teams"("tournamentId", "teamId") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "matches" DROP CONSTRAINT "matches_tournamentId_awayTeamId_fkey";
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_awayTeamId_fkey" FOREIGN KEY ("tournamentId", "awayTeamId") REFERENCES "tournament_teams"("tournamentId", "teamId") ON DELETE NO ACTION ON UPDATE CASCADE;
