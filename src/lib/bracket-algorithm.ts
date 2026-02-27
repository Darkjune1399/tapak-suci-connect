/**
 * Single Elimination Bracket Algorithm
 * - Power-of-2 bracket slots with BYE positions
 * - Same-club (cabang/unit) separation in first round
 * - Seed management
 */

export interface BracketParticipant {
  id: string;
  member_id: string;
  member_name: string;
  cabang: string | null;
  unit_latihan: string | null;
  seed_number: number | null;
}

export interface BracketMatch {
  round: number;
  match_number: number;
  participant1_id: string | null;
  participant2_id: string | null;
  status: "pending" | "bye" | "completed";
  winner_id?: string | null;
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Compute number of rounds for n bracket slots
 */
export function getRoundCount(participantCount: number): number {
  const slots = nextPowerOf2(participantCount);
  return Math.log2(slots);
}

/**
 * Generate single elimination bracket matches.
 * Returns matches for ALL rounds (first round with participants, later rounds empty).
 */
export function generateBracket(participants: BracketParticipant[]): BracketMatch[] {
  const n = participants.length;
  if (n < 2) return [];

  const bracketSize = nextPowerOf2(n);
  const totalRounds = Math.log2(bracketSize);
  const byeCount = bracketSize - n;

  // Separate seeded and unseeded
  const seeded = participants
    .filter((p) => p.seed_number != null && p.seed_number > 0)
    .sort((a, b) => (a.seed_number || 0) - (b.seed_number || 0));
  const unseeded = participants.filter(
    (p) => p.seed_number == null || p.seed_number <= 0
  );

  // Shuffle unseeded with same-club separation
  const ordered = arrangeWithClubSeparation(seeded, unseeded, bracketSize);

  // Place BYEs: standard tournament bye placement at bottom positions
  const slots: (BracketParticipant | null)[] = new Array(bracketSize).fill(null);
  
  // Standard seed positions for bracket (1-indexed positions mapped to 0-indexed slots)
  const seedPositions = getSeedPositions(bracketSize);
  
  // Place participants in seed order positions
  for (let i = 0; i < ordered.length; i++) {
    slots[seedPositions[i]] = ordered[i];
  }

  // Generate first round matches
  const matches: BracketMatch[] = [];
  const firstRoundMatches = bracketSize / 2;

  for (let i = 0; i < firstRoundMatches; i++) {
    const p1 = slots[i * 2];
    const p2 = slots[i * 2 + 1];

    const isBye = !p1 || !p2;
    matches.push({
      round: 1,
      match_number: i + 1,
      participant1_id: p1?.id || null,
      participant2_id: p2?.id || null,
      status: isBye ? "bye" : "pending",
      winner_id: isBye ? (p1?.id || p2?.id || null) : null,
    });
  }

  // Generate subsequent round matches (empty)
  let matchesInRound = firstRoundMatches / 2;
  for (let round = 2; round <= totalRounds; round++) {
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        round,
        match_number: i + 1,
        participant1_id: null,
        participant2_id: null,
        status: "pending",
      });
    }
    matchesInRound = matchesInRound / 2;
  }

  return matches;
}

/**
 * Standard seed position mapping for bracket.
 * Returns 0-indexed slot positions ordered by seed priority.
 */
function getSeedPositions(bracketSize: number): number[] {
  if (bracketSize === 1) return [0];
  if (bracketSize === 2) return [0, 1];

  // Build recursively
  const positions: number[] = [0, 1];
  let size = 2;
  while (size < bracketSize) {
    const newPositions: number[] = [];
    for (const pos of positions) {
      newPositions.push(pos * 2);
      newPositions.push(size * 2 - 1 - pos * 2);
    }
    positions.length = 0;
    positions.push(...newPositions);
    size *= 2;
  }
  return positions;
}

/**
 * Arrange participants trying to keep same-club athletes apart in first round.
 * Seeded players get priority positions; unseeded are shuffled with separation logic.
 */
function arrangeWithClubSeparation(
  seeded: BracketParticipant[],
  unseeded: BracketParticipant[],
  _bracketSize: number
): BracketParticipant[] {
  // Shuffle unseeded randomly
  const shuffled = [...unseeded].sort(() => Math.random() - 0.5);

  // Group by club (cabang + unit)
  const clubKey = (p: BracketParticipant) =>
    `${p.cabang || ""}|${p.unit_latihan || ""}`;

  // Try to separate same-club by placing them in alternating halves
  const clubGroups = new Map<string, BracketParticipant[]>();
  for (const p of shuffled) {
    const key = clubKey(p);
    if (!clubGroups.has(key)) clubGroups.set(key, []);
    clubGroups.get(key)!.push(p);
  }

  // Interleave groups to maximize separation
  const result: BracketParticipant[] = [];
  const groups = Array.from(clubGroups.values()).sort(
    (a, b) => b.length - a.length
  );

  // Round-robin pick from groups
  let groupIdx = 0;
  const totalUnseeded = shuffled.length;
  for (let i = 0; i < totalUnseeded; i++) {
    // Find next group with remaining participants
    let attempts = 0;
    while (groups[groupIdx].length === 0 && attempts < groups.length) {
      groupIdx = (groupIdx + 1) % groups.length;
      attempts++;
    }
    if (groups[groupIdx].length > 0) {
      result.push(groups[groupIdx].shift()!);
    }
    groupIdx = (groupIdx + 1) % groups.length;
  }

  // Seeded first, then arranged unseeded
  return [...seeded, ...result];
}

/**
 * Get round label
 */
export function getRoundLabel(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Final";
  if (round === totalRounds - 1) return "Semi Final";
  if (round === totalRounds - 2) return "Quarter Final";
  return `Babak ${round}`;
}
