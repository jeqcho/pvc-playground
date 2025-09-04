/**
 * Proportional Veto Core (PVC) computation utilities
 */

// Simple assertion function for debugging
function assert(condition: boolean, message?: string): asserts condition {
	if (!condition) {
		throw new Error(message || 'Assertion failed');
	}
}

export function areNumbersApproximatelyEqual(num1: number, num2: number, tolerance: number = Number.EPSILON): boolean {
	return Math.abs(num1 - num2) < tolerance;
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
 * Compute the Proportional Veto Core (PVC) for a given preference profile by successive elimination
 * @param preferences - Matrix where preferences[i][j] is the alternative at rank i (0-indexed) for voter j
 * @param alternatives - List of all alternatives
 * @returns Array of alternatives in the PVC
 */
export function computePVC(preferences: string[][], alternatives: Alternative[]): Alternative[] {
	console.log('=== Starting computePVC ===');
	const m = alternatives.length;
	const n = preferences[0]?.length || 0; // number of voters (columns)
	console.log(`Number of alternatives (m): ${m}`);
	console.log(`Number of voters (n): ${n}`);
	console.log('Alternatives:', alternatives);
	console.log('Preferences matrix:', preferences);

	if (m === 0 || n === 0) {
		console.log('Early return: empty alternatives or no voters');
		return [];
	}

	// Map alternatives to indices for number representation
	const altToIndex = new Map<Alternative, number>();
	alternatives.forEach((alt, idx) => altToIndex.set(alt, idx));
	console.log('Alternative to index mapping:', altToIndex);

	// Convert preference matrix to profile format (each voter's complete ordering)
	// Note that `profile` is [voter][alternative] while `preferences` is the transpose
	console.log('Converting preference matrix to profile format...');
	const profile: number[][] = [];
	for (let voter = 0; voter < n; voter++) {
		const voterPrefs: number[] = [];
		for (let rank = 0; rank < m; rank++) {
			const alt = preferences[rank][voter];
			const index = altToIndex.get(alt) ?? -1;
			assert(index != -1);
			voterPrefs.push(index);
		}
		console.log(`Voter ${voter} preferences (as indices):`, voterPrefs);
		profile.push(voterPrefs);
	}
	console.log('Complete profile (numeric):', profile);

	// Define p_i = (m-1)/n for each voter
	// To avoid floating point issues, work with the fraction directly
	console.log('Computing p_i values...');
	const numerator = m - 1;
	const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
	const commonDivisor = gcd(numerator, n);
	console.log(`Original fraction: (m-1)/n = ${numerator}/${n}`);
	console.log(`GCD of ${numerator} and ${n}: ${commonDivisor}`);

	// Reduce fraction to lowest terms
	const reducedNumerator = numerator / commonDivisor;
	const reducedDenominator = n / commonDivisor;
	console.log(`Reduced fraction: ${reducedNumerator}/${reducedDenominator}`);

	const p_i = reducedNumerator; // After duplication, p_i becomes an integer
	console.log(`p_i (elimination count per voter): ${p_i}`);

	// Initialize remaining alternatives - after duplication, each alt appears multiple times
	console.log('Initializing remaining alternatives with duplication...');
	let remainingAlts: number[] = [];
	// Each alternative appears reducedDenominator times
	for (let alt = 0; alt < m; alt++) {
		for (let i = 0; i < reducedDenominator; i++) {
			remainingAlts.push(alt);
		}
	}
	console.log(`Initial remainingAlts (each alt appears ${reducedDenominator} times):`, remainingAlts);

	// Initialize remaining counts - each alternative appears reducedDenominator times
	let remainingCounts = new Map<number, number>();
	for (let alt = 0; alt < m; alt++) {
		remainingCounts.set(alt, reducedDenominator);
	}
	console.log('Initial remainingCounts:', remainingCounts);

	// Sequential elimination rounds
	console.log('\n=== Starting sequential elimination rounds ===');
	for (let voter = 0; voter < n; voter++) {
		console.log(`\n--- Round ${voter + 1}: Voter ${voter} ---`);
		console.log(`Remaining alts at start of round:`, remainingAlts);
		console.log(`Remaining counts:`, remainingCounts);
		const voterPrefs = profile[voter];
		console.log(`Voter ${voter} preferences (indices):`, voterPrefs);

		// Find this voter's preference order among remaining alternatives
		const remainingPrefs: number[] = [];
		for (const alt of voterPrefs) {
			const count = remainingCounts.get(alt) || 0;
			for (let i = 0; i < count; i++) {
				remainingPrefs.push(alt);
			}
		}
		console.log(`Voter ${voter} remaining preferences (with duplicates):`, remainingPrefs);

		// Take the p_i least preferred (from the end of their preference order)
		const toEliminate = remainingPrefs.slice(-p_i);
		console.log(`Alternatives to eliminate (${p_i} least preferred):`, toEliminate);

		// Remove these alternatives from remainingAlts and update counts
		toEliminate.forEach(altToRemove => {
			assert(remainingAlts.length > 0, 'Should have multiple alternatives remaining at start of round');
			const index = remainingAlts.indexOf(altToRemove);
			console.log(`Removing alt ${altToRemove} at index ${index} from remainingAlts`);
			assert(index > -1);
			remainingAlts.splice(index, 1);
			// Update count
			const currentCount = remainingCounts.get(altToRemove) || 0;
			if (currentCount > 1) {
				remainingCounts.set(altToRemove, currentCount - 1);
				console.log(`Updated count for alt ${altToRemove}: ${currentCount - 1}`);
			} else {
				remainingCounts.delete(altToRemove);
				console.log(`Completely removed alt ${altToRemove} from counts`);
			}
		});
		console.log(`Remaining alts after elimination:`, remainingAlts);
		console.log(`Remaining counts after elimination:`, remainingCounts);
	}

	// Collapse clones
	console.log('\n=== Final processing ===');
	console.log('Final remainingAlts:', remainingAlts);
	// assert(remainingAlts.length > 0, `PVC should be empty. remainingAlts is ${remainingAlts}`);
	// Convert back to alternative names
	const remainingAltsSet = new Set(remainingAlts);
	console.log('Unique remaining alternatives (indices):', Array.from(remainingAltsSet));
	const result = Array.from(remainingAltsSet).map(idx => alternatives[idx]);
	console.log('PVC result (alternative names):', result);
	console.log('=== computePVC completed ===\n');

	return result;
}

/**
 * Check if a coalition of voters can veto an alternative
 * @param alternative - The alternative to check
 * @param coalition - Indices of voters in the coalition
 * @param preferences - Preference matrix
 * @param alternatives - List of all alternatives
 * @returns Object with veto result and preferred alternatives
 */
function checkVetoCoalition(
	alternative: Alternative,
	coalition: number[],
	preferences: string[][],
	alternatives: Alternative[]
): { canVeto: boolean; preferredAlternatives: Alternative[] } {
	console.log(`trying to veto ${alternative} with coalition, `, coalition);
	if (coalition.length === 0) {
		return { canVeto: false, preferredAlternatives: [] };
	}

	// Convert preference matrix to profile format for coalition voters
	const coalitionProfiles: number[][] = [];
	const altToIndex = new Map<Alternative, number>();
	alternatives.forEach((alt, idx) => altToIndex.set(alt, idx));

	const m = alternatives.length;
	for (const voterIndex of coalition) {
		const voterPrefs: number[] = [];
		for (let rank = 0; rank < m; rank++) {
			const alt = preferences[rank][voterIndex];
			const index = altToIndex.get(alt) ?? -1;
			assert(index != -1);
			voterPrefs.push(index);
		}
		coalitionProfiles.push(voterPrefs);
	}

	const targetAltIndex = altToIndex.get(alternative);
	if (targetAltIndex === undefined) {
		return { canVeto: false, preferredAlternatives: [] };
	}

	// Find alternatives preferred by all coalition members over the target alternative
	const preferredByAll: Set<number> = new Set();

	// Start with alternatives preferred by first coalition member
	const firstVoterPrefs = coalitionProfiles[0];
	const targetRankInFirst = firstVoterPrefs.indexOf(targetAltIndex);
	if (targetRankInFirst === -1) {
		return { canVeto: false, preferredAlternatives: [] };
	}

	for (let rank = 0; rank < targetRankInFirst; rank++) {
		preferredByAll.add(firstVoterPrefs[rank]);
	}

	// Intersect with preferences of other coalition members
	for (let i = 1; i < coalitionProfiles.length; i++) {
		const voterPrefs = coalitionProfiles[i];
		const targetRankInVoter = voterPrefs.indexOf(targetAltIndex);
		if (targetRankInVoter === -1) {
			return { canVeto: false, preferredAlternatives: [] };
		}

		const voterPreferred = new Set<number>();
		for (let rank = 0; rank < targetRankInVoter; rank++) {
			voterPreferred.add(voterPrefs[rank]);
		}

		// Keep only alternatives preferred by both current voter and previous intersection
		const newPreferredByAll = new Set<number>();
		for (const alt of preferredByAll) {
			if (voterPreferred.has(alt)) {
				newPreferredByAll.add(alt);
			}
		}
		preferredByAll.clear();
		newPreferredByAll.forEach(alt => preferredByAll.add(alt));
	}

	// A coalition can veto if they satisfy the PVC veto condition:
	// |T|*(m-1)/n >= 1 - |B|/m, where T is coalition size, B is preferred alternatives
	const n = preferences[0]?.length || 0;
	const T_size = coalition.length;
	const B_size = preferredByAll.size;

	const veto_power = T_size * (m-1) / n;
	const veto_size = m - B_size;
	const canVeto = (veto_power > veto_size) || areNumbersApproximatelyEqual(veto_power, veto_size);
	const preferredAlternatives = Array.from(preferredByAll).map(idx => alternatives[idx]);
	console.log(`T_size / n: ${T_size / n}`);
	console.log(`1-B_size / m: ${1 - B_size / m}`);
	console.log(`canVeto: ${canVeto}`);
	console.log(`preferredAlternatives:`, preferredAlternatives);

	return { canVeto, preferredAlternatives };
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
	const m = alternatives.length;
	const n = preferences[0]?.length || 0; // number of voters

	// Iterate over all 2^n possible coalitions (excluding empty set)
	let bestCoalition: number[] = [];
	let bestPreferred: Alternative[] = [];

	for (let coalitionMask = 1; coalitionMask < (1 << n); coalitionMask++) {
		// Convert bit mask to coalition indices
		const coalition: number[] = [];
		for (let voter = 0; voter < n; voter++) {
			if (coalitionMask & (1 << voter)) {
				coalition.push(voter);
			}
		}

		const result = checkVetoCoalition(alternative, coalition, preferences, alternatives);

		if (result.canVeto && result.preferredAlternatives.length > 0) {
			bestCoalition = coalition;
			bestPreferred = result.preferredAlternatives;
		}
	}

	// Dashboard values
	const dashboardValues = {
		T: bestCoalition.length,
		T_size: bestCoalition.length,
		v_T: (bestCoalition.length / n) * (m - 1),
		B: bestPreferred,
		lambda_B_over_P: bestPreferred.length / m
	};

	return {
		coalition: bestCoalition,
		selectedAlternative: alternative,
		preferredAlternatives: bestPreferred,
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