import { create } from 'zustand';

export interface BetSlipLeg {
  id: string; // The MarketOutcome id
  matchId: string;
  matchName: string;
  marketName: string;
  outcomeName: string;
  oddsDecimal: number;
  allowOnlySingles: boolean;
}

interface BetSlipState {
  legs: BetSlipLeg[];
  riskAmount: number;
  oddsFormat: 'decimal' | 'american';
  addLeg: (leg: BetSlipLeg) => void;
  removeLeg: (id: string) => void;
  clearSlip: () => void;
  setRiskAmount: (amount: number) => void;
  toggleOddsFormat: () => void;
}

export const useBetSlip = create<BetSlipState>((set) => ({
  legs: [],
  riskAmount: 0,
  oddsFormat: 'decimal',
  addLeg: (leg) =>
    set((state) => {
      // Prevent adding multiple outcomes from the same match
      const existingMatchIndex = state.legs.findIndex((l) => l.matchId === leg.matchId);
      let newLegs = [...state.legs];
      if (existingMatchIndex !== -1) {
        // Replace if from same match
        newLegs[existingMatchIndex] = leg;
      } else {
        newLegs.push(leg);
      }
      return { legs: newLegs };
    }),
  removeLeg: (id) =>
    set((state) => ({ legs: state.legs.filter((l) => l.id !== id) })),
  clearSlip: () => set({ legs: [], riskAmount: 0 }),
  setRiskAmount: (riskAmount) => set({ riskAmount }),
  toggleOddsFormat: () => set((state) => ({ oddsFormat: state.oddsFormat === 'decimal' ? 'american' : 'decimal' }))
}));
