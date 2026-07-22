// Static per-km/per-min rate table — there is no external cab
// price/availability API to call (see lib/routing.ts for why), so fares are
// computed locally against a real route.
export interface CabType {
  id: string;
  label: string;
  seats: number;
  baseFare: number;
  perKm: number;
  perMin: number;
}

export const CAB_TYPES: CabType[] = [
  { id: "mini", label: "Mini", seats: 4, baseFare: 2.5, perKm: 0.9, perMin: 0.15 },
  { id: "sedan", label: "Sedan", seats: 4, baseFare: 4, perKm: 1.2, perMin: 0.2 },
  { id: "suv", label: "SUV", seats: 6, baseFare: 6, perKm: 1.6, perMin: 0.25 },
  { id: "prime", label: "Prime", seats: 4, baseFare: 8, perKm: 2, perMin: 0.3 },
];

export function estimateFare(cabType: CabType, distanceKm: number, durationMin: number): number {
  const fare = cabType.baseFare + cabType.perKm * distanceKm + cabType.perMin * durationMin;
  return Math.round(fare * 100) / 100;
}
