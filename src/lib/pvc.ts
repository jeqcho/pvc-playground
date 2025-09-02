/**
 * Proportional Veto Core (PVC) computation utilities
 */

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
 * @param preferences - Matrix where preferences[i][j] is the i-th ranked alternative for voter j
 * @param alternatives - List of all alternatives
 * @returns Array of alternatives in the PVC
 */
export function computePVC(preferences: string[][], alternatives: Alternative[]): Alternative[] {
	// TODO: Implement actual PVC computation logic
	// For now, return dummy result (first 2 alternatives or all if < 2)
	if (alternatives.length < 2) {
		return alternatives;
	}
	return alternatives.slice(0, 2);
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