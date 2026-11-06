export function equalSplitCents(
  totalCents: number,
  memberCount: number,
): number[] {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    throw new Error("Total must be a non-negative safe integer");
  }
  if (!Number.isInteger(memberCount) || memberCount <= 0) {
    throw new Error("Member count must be positive");
  }

  const base = Math.floor(totalCents / memberCount);
  const remainder = totalCents % memberCount;
  return Array.from(
    { length: memberCount },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

export function majorUnitsToCents(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be positive");
  }
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents)) throw new Error("Amount is too large");
  return cents;
}
