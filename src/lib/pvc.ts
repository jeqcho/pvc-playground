/**
 * Proportional Veto Core (PVC) computation utilities
 */

// Simple assertion function for debugging
function assert(condition: boolean, message?: string): asserts condition {
	if (!condition) {
		throw new Error(message || 'Assertion failed');
	}
}

export type Alternative = string;
export type VoterPreference = Alternative[];
export type PreferenceProfile = VoterPreference[];

export interface VetoCoalitionResult {
	coalition: number[]; // indices of voters in the veto coalition
	selectedAlternative: Alternative;
	preferredAlternatives: Alternative[];
	dashboardValues: {
		T: number;
		T_size: number;
		v_T: number;
		B: Alternative[];
		lambda_B_over_P: number;
	};
}

/**
 * Compute the Proportional Veto Core (PVC) for a given preference profile
 * @param preferences - Matrix where preferences[i][j] is the alternative at rank i (0-indexed) for voter j
 * @param alternatives - List of all alternatives
 * @returns Array of alternatives in the PVC
 */
export function computePVC(preferences: string[][], alternatives: Alternative[]): Alternative[] {
	const m = alternatives.length;
	const n = preferences[0]?.length || 0; // number of voters (columns)

	if (m === 0 || n === 0) return [];

	// Map alternatives to indices for number representation
	const altToIndex = new Map<Alternative, number>();
	alternatives.forEach((alt, idx) => altToIndex.set(alt, idx));

	// Convert preference matrix to profile format (each voter's complete ordering)
	// Note that `profile` is [voter][alternative] while `preferences` is the transpose
	const profile: number[][] = [];
	for (let voter = 0; voter < n; voter++) {
		const voterPrefs: number[] = [];
		for (let rank = 0; rank < m; rank++) {
			const alt = preferences[rank][voter];
			const index = altToIndex.get(alt) ?? -1;
			if (index === -1) return []; // Invalid preference
			voterPrefs.push(index);
		}
		profile.push(voterPrefs);
	}

	// Define p_i = (m-1)/n for each voter
	// To avoid floating point issues, work with the fraction directly
	const numerator = m - 1;
	const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
	const commonDivisor = gcd(numerator, n);

	// Reduce fraction to lowest terms
	const reducedNumerator = numerator / commonDivisor;
	const reducedDenominator = n / commonDivisor;

	const p_i = reducedNumerator; // After duplication, p_i becomes an integer

	// Initialize remaining alternatives - after duplication, each alt appears multiple times
	let remainingAlts: number[] = [];
	// Each alternative appears reducedDenominator times
	for (let alt = 0; alt < m; alt++) {
		for (let i = 0; i < reducedDenominator; i++) {
			remainingAlts.push(alt);
		}
	}

	// Initialize remaining counts - each alternative appears reducedDenominator times
	let remainingCounts = new Map<number, number>();
	for (let alt = 0; alt < m; alt++) {
		remainingCounts.set(alt, reducedDenominator);
	}

	// Sequential elimination rounds
	for (let voter = 0; voter < n; voter++) {
		assert(remainingAlts.length > 1, 'Should have multiple alternatives remaining at start of round');
		const voterPrefs = profile[voter];

		// Find this voter's preference order among remaining alternatives
		const remainingPrefs: number[] = [];
		for (const alt of voterPrefs) {
			const count = remainingCounts.get(alt) || 0;
			for (let i = 0; i < count; i++) {
				remainingPrefs.push(alt);
			}
		}

		// Take the p_i least preferred (from the end of their preference order)
		const toEliminate = remainingPrefs.slice(-p_i);

		// Remove these alternatives from remainingAlts and update counts
		toEliminate.forEach(altToRemove => {
			const index = remainingAlts.indexOf(altToRemove);
			assert(index > -1);
			remainingAlts.splice(index, 1);
			// Update count
			const currentCount = remainingCounts.get(altToRemove) || 0;
			if (currentCount > 1) {
				remainingCounts.set(altToRemove, currentCount - 1);
			} else {
				remainingCounts.delete(altToRemove);
			}
		});
	}

	// Collapse clones
	assert(remainingAlts.length > 0, `PVC should be empty. remainingAlts is ${remainingAlts}`);
	// Convert back to alternative names
	const remainingAltsSet = new Set(remainingAlts);
	const result = Array.from(remainingAltsSet).map(idx => alternatives[idx]);

	return result;
}

/**
 * Compute a veto coalition for a given alternative not in the PVC
 * @param alternative - The alternative to find a veto coalition for
 * @param preferences - Matrix where preferences[i][j] is the i-th ranked alternative for voter j
 * @param alternatives - List of all alternatives
 * @param pvc - Current PVC
 * @returns Veto coalition result with coalition members and dashboard values
 */
export function computeVetoCoalition(
	alternative: Alternative,
	preferences: string[][],
	alternatives: Alternative[],
	pvc: Alternative[]
): VetoCoalitionResult {
	const n = preferences[0]?.length || 0; // number of voters

	// TODO: Implement actual veto coalition computation logic
	// For now, return dummy result (voters 0 and 2, or just 0 if n < 3)
	const coalition = n < 3 ? [0] : [0, 2];

	// Compute preferred alternatives (dummy logic for now)
	const altIndex = alternatives.indexOf(alternative);
	const preferredAlternatives = alternatives.slice(0, altIndex);

	// Dashboard values (dummy for now)
	const dashboardValues = {
		T: coalition.length,
		T_size: coalition.length,
		v_T: Math.floor(Math.random() * 10),
		B: preferredAlternatives,
		lambda_B_over_P: Math.random()
	};

	return {
		coalition,
		selectedAlternative: alternative,
		preferredAlternatives,
		dashboardValues
	};
}

/**
 * Validate a voter's preference ordering
 * @param voterPrefs - Single voter's preference ordering
 * @param alternatives - List of all valid alternatives
 * @returns true if the preference ordering is valid
 */
export function validateVoterPreferences(voterPrefs: Alternative[], alternatives: Alternative[]): boolean {
	// Check for correct length
	if (voterPrefs.length !== alternatives.length) {
		return false;
	}

	// Check for duplicates
	const unique = new Set(voterPrefs);
	if (unique.size !== voterPrefs.length) {
		return false;
	}

	// Check for empty entries
	if (voterPrefs.some(pref => !pref)) {
		return false;
	}

	// Check if all entries are valid alternatives
	return voterPrefs.every(pref => alternatives.includes(pref));
}

/**
 * Convert preference matrix format to preference profile format
 * @param preferences - Matrix where preferences[i][j] is the i-th ranked alternative for voter j
 * @returns Array where each element is a voter's complete preference ordering
 */
export function matrixToProfile(preferences: string[][]): PreferenceProfile {
	const m = preferences.length; // number of alternatives
	const n = preferences[0]?.length || 0; // number of voters

	const profile: PreferenceProfile = [];

	for (let voter = 0; voter < n; voter++) {
		const voterPrefs: Alternative[] = [];
		for (let rank = 0; rank < m; rank++) {
			voterPrefs.push(preferences[rank][voter]);
		}
		profile.push(voterPrefs);
	}

	return profile;
}

/**
 * Generate alternatives a, b, c, ... based on the number m
 * @param m - Number of alternatives
 * @returns Array of alternative labels
 */
export function generateAlternatives(m: number): Alternative[] {
	return Array.from({ length: m }, (_, i) => String.fromCharCode(97 + i));
}