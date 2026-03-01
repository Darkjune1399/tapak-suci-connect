import { useMemo } from "react";
import { getRoundLabel } from "@/lib/bracket-algorithm";
import { cn } from "@/lib/utils";

interface MatchData {
  id: string;
  round: number;
  match_number: number;
  participant1_id: string | null;
  participant2_id: string | null;
  winner_id: string | null;
  status: string;
  nomor_partai: number | null;
  gelanggang: number | null;
  waktu_mulai: string | null;
}

interface ParticipantInfo {
  id: string;
  member_name: string;
}

interface BracketViewProps {
  matches: MatchData[];
  participants: ParticipantInfo[];
  totalRounds: number;
  onSelectWinner?: (matchId: string, winnerId: string) => void;
  canEdit: boolean;
}

export function BracketView({ matches, participants, totalRounds, onSelectWinner, canEdit }: BracketViewProps) {
  const participantMap = useMemo(() => {
    const m = new Map<string, string>();
    participants.forEach((p) => m.set(p.id, p.member_name));
    return m;
  }, [participants]);

  const roundGroups = useMemo(() => {
    const groups: MatchData[][] = [];
    for (let r = 1; r <= totalRounds; r++) {
      groups.push(
        matches
          .filter((m) => m.round === r)
          .sort((a, b) => a.match_number - b.match_number)
      );
    }
    return groups;
  }, [matches, totalRounds]);

  if (totalRounds === 0 || matches.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Belum ada bracket. Generate bracket terlebih dahulu.
      </div>
    );
  }

  const getName = (id: string | null) => {
    if (!id) return "BYE";
    return participantMap.get(id) || "—";
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max items-start">
        {roundGroups.map((roundMatches, roundIdx) => {
          const round = roundIdx + 1;
          // Increase spacing progressively for each round
          const matchHeight = 96; // px per match card
          const spaceBetween = matchHeight * (Math.pow(2, roundIdx) - 1) + 24 * roundIdx;
          const topPadding = roundIdx === 0 ? 0 : (matchHeight + spaceBetween) / 2 - matchHeight / 2;

          return (
            <div key={round} className="flex flex-col items-center" style={{ minWidth: 230 }}>
              <div className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                {getRoundLabel(round, totalRounds)}
              </div>
              <div
                className="flex flex-col w-full"
                style={{ gap: `${spaceBetween}px`, paddingTop: `${topPadding}px` }}
              >
                {roundMatches.map((match) => {
                  const p1Name = getName(match.participant1_id);
                  const p2Name = getName(match.participant2_id);
                  const isBye = match.status === "bye";
                  const isCompleted = match.status === "completed";
                  const hasParticipant1 = Boolean(match.participant1_id);
                  const hasParticipant2 = Boolean(match.participant2_id);

                  const canSelectWinner =
                    canEdit &&
                    !isCompleted &&
                    ((hasParticipant1 && hasParticipant2) ||
                      (isBye && (hasParticipant1 || hasParticipant2)));

                  const canSelectParticipant1 = canSelectWinner && hasParticipant1;
                  const canSelectParticipant2 = canSelectWinner && hasParticipant2;

                  return (
                    <div key={match.id} className="relative">
                      {match.nomor_partai && (
                        <span className="absolute -top-5 left-1 text-[10px] text-muted-foreground">
                          P{match.nomor_partai}
                          {match.gelanggang ? ` • G${match.gelanggang}` : ""}
                        </span>
                      )}
                      {match.waktu_mulai && (
                        <span className="absolute -top-5 right-1 text-[10px] text-muted-foreground">
                          {new Date(match.waktu_mulai).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      <div
                        className={cn(
                          "rounded-lg border overflow-hidden text-sm shadow-sm",
                          isBye && "opacity-40 border-dashed",
                          isCompleted && "border-primary"
                        )}
                      >
                        <button
                          disabled={!canSelectParticipant1}
                          onClick={() =>
                            canSelectParticipant1 &&
                            match.participant1_id &&
                            onSelectWinner?.(match.id, match.participant1_id)
                          }
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2.5 text-left border-b transition-colors text-foreground",
                            match.winner_id === match.participant1_id &&
                              "bg-primary/10 font-semibold",
                            canSelectParticipant1 && "hover:bg-muted cursor-pointer",
                            !canSelectParticipant1 && "cursor-default"
                          )}
                        >
                          <span className="flex-1 truncate">{p1Name}</span>
                          {match.winner_id === match.participant1_id && (
                            <span className="text-xs text-primary font-bold">W</span>
                          )}
                        </button>

                        <button
                          disabled={!canSelectParticipant2}
                          onClick={() =>
                            canSelectParticipant2 &&
                            match.participant2_id &&
                            onSelectWinner?.(match.id, match.participant2_id)
                          }
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors text-foreground",
                            match.winner_id === match.participant2_id &&
                              "bg-primary/10 font-semibold",
                            canSelectParticipant2 && "hover:bg-muted cursor-pointer",
                            !canSelectParticipant2 && "cursor-default"
                          )}
                        >
                          <span className="flex-1 truncate">{p2Name}</span>
                          {match.winner_id === match.participant2_id && (
                            <span className="text-xs text-primary font-bold">W</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
