<script lang="ts">
	import { onMount } from 'svelte';
	import {
		computePVC as computePVCLogic,
		computeVetoCoalition as computeVetoCoalitionLogic,
		validateVoterPreferences,
		matrixToProfile,
		generateAlternatives,
		type VetoCoalitionResult
	} from '$lib/pvc';

	let m = 3; // number of alternatives
	let n = 3; // number of voters
	let preferences: string[][] = [];
	let pvc: string[] = [];
	let selectedAlternative = '';
	let vetoCoalition: number[] = [];
	let preferredAlternatives: string[] = [];
	
	// Dashboard values
	let T = 0;
	let T_size = 0;
	let v_T = 0;
	let B: string[] = [];
	let lambda_B_over_P = 0;

	// Initialize preferences matrix
	function initializeMatrix() {
		preferences = Array(m).fill(null).map(() => Array(n).fill(''));
	}

	// Generate alternatives a-z based on m
	function getAlternatives(): string[] {
		return generateAlternatives(m);
	}

	// Set identical preferences (a, b, c, ... for all voters)
	function setIdenticalPreferences() {
		const alternatives = getAlternatives();
		preferences = alternatives.map(() => Array(n).fill(''));
		for (let col = 0; col < n; col++) {
			for (let row = 0; row < m; row++) {
				preferences[row][col] = alternatives[row];
			}
		}
		preferences = [...preferences]; // trigger reactivity
	}

	// Randomize preferences
	function randomizePreferences() {
		const alternatives = getAlternatives();
		preferences = alternatives.map(() => Array(n).fill(''));
		
		for (let col = 0; col < n; col++) {
			const shuffled = [...alternatives].sort(() => Math.random() - 0.5);
			for (let row = 0; row < m; row++) {
				preferences[row][col] = shuffled[row];
			}
		}
		preferences = [...preferences]; // trigger reactivity
	}

	// Validate a column (voter's preferences)
	function isColumnValid(colIndex: number): boolean {
		const column = preferences.map(row => row[colIndex]);
		const alternatives = getAlternatives();
		return validateVoterPreferences(column, alternatives);
	}

	// PVC computation
	function computePVC() {
		const alternatives = getAlternatives();
		pvc = computePVCLogic(preferences, alternatives);
	}

	// Veto coalition computation
	function computeVetoCoalition(alternative: string) {
		const alternatives = getAlternatives();
		const result = computeVetoCoalitionLogic(alternative, preferences, alternatives, pvc);
		
		selectedAlternative = result.selectedAlternative;
		vetoCoalition = result.coalition;
		preferredAlternatives = result.preferredAlternatives;
		
		// Update dashboard values
		T = result.dashboardValues.T;
		T_size = result.dashboardValues.T_size;
		v_T = result.dashboardValues.v_T;
		B = result.dashboardValues.B;
		lambda_B_over_P = result.dashboardValues.lambda_B_over_P;
	}

	// Handle alternative click
	function onAlternativeClick(alternative: string) {
		if (!pvc.includes(alternative)) {
			computeVetoCoalition(alternative);
		}
	}

	// Handle input changes
	function onMNChange() {
		initializeMatrix();
		pvc = [];
		selectedAlternative = '';
		vetoCoalition = [];
		preferredAlternatives = [];
	}

	// Handle preference cell change
	function onPreferenceChange(row: number, col: number, value: string) {
		preferences[row][col] = value.toLowerCase();
		preferences = [...preferences]; // trigger reactivity
	}

	onMount(() => {
		initializeMatrix();
	});
</script>

<main class="container">
	<h1>Proportional Veto Core Playground</h1>
	
	<!-- Section 1: Input Parameters -->
	<section class="section">
		<h2>Parameters</h2>
		<div class="inputs">
			<label>
				m (alternatives): 
				<input type="number" bind:value={m} min="1" max="26" on:change={onMNChange} />
			</label>
			<label>
				n (voters): 
				<input type="number" bind:value={n} min="1" on:change={onMNChange} />
			</label>
		</div>
		
		<div class="subsection">
			<h3>Initialize Matrix</h3>
			<button on:click={setIdenticalPreferences}>Identical Preferences</button>
			<button on:click={randomizePreferences}>Randomize</button>
		</div>
	</section>

	<!-- Section 2: Voter Preferences and PVC -->
	<section class="section">
		<div class="two-columns">
			<!-- Left: Voter Preference Matrix -->
			<div class="column">
				<div class="column-header">
					<h3>Voter Preference</h3>
				</div>
				<div class="matrix">
					{#each preferences as row, rowIndex}
						<div class="matrix-row">
							{#each row as cell, colIndex}
								<input 
									type="text" 
									maxlength="1"
									bind:value={cell}
									on:input={(e) => onPreferenceChange(rowIndex, colIndex, e.target.value)}
									class="matrix-cell"
									class:invalid={!isColumnValid(colIndex)}
									class:veto-column={vetoCoalition.includes(colIndex)}
									class:selected-alternative={vetoCoalition.includes(colIndex) && cell === selectedAlternative}
									class:preferred-alternative={vetoCoalition.includes(colIndex) && preferredAlternatives.includes(cell) && cell !== selectedAlternative}
								/>
							{/each}
						</div>
					{/each}
				</div>
				<button on:click={computePVC} class="compute-btn">Compute PVC</button>
			</div>

			<!-- Right: PVC Display -->
			<div class="column">
				<div class="column-header">
					<h3>PVC</h3>
				</div>
				<div class="pvc-list">
					{#each getAlternatives() as alternative}
						<div 
							class="pvc-item"
							class:in-pvc={pvc.includes(alternative)}
							class:not-in-pvc={!pvc.includes(alternative)}
							class:highlighted={vetoCoalition.length > 0 && selectedAlternative === alternative}
							on:click={() => onAlternativeClick(alternative)}
							role="button"
							tabindex="0"
						>
							{alternative}
						</div>
					{/each}
				</div>
				<p class="instruction">Click on any alternative that is not in the PVC to see a veto coalition</p>
				<div class="legend">
					<span class="legend-item">
						<span class="color-box green"></span> In PVC
					</span>
					<span class="legend-item">
						<span class="color-box yellow"></span> Not in PVC
					</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Section 3: Veto Coalition Dashboard -->
	<section class="section">
		
		<div class="dashboard">
			<div class="dashboard-item">
				<strong>T:</strong> {T}
			</div>
			<div class="dashboard-item">
				<strong>|T|:</strong> {T_size}
			</div>
			<div class="dashboard-item">
				<strong>v(T):</strong> {v_T}
			</div>
			<div class="dashboard-item">
				<strong>B:</strong> [{B.join(', ')}]
			</div>
			<div class="dashboard-item">
				<strong>λ(B)/λ(P):</strong> {lambda_B_over_P.toFixed(3)}
			</div>
		</div>

		{#if vetoCoalition.length > 0}
			<div class="veto-info">
				<p><strong>Veto Coalition:</strong> Voters {vetoCoalition.map(i => i + 1).join(', ')}</p>
				<p><strong>Selected Alternative:</strong> {selectedAlternative}</p>
				<p><strong>Preferred Alternatives:</strong> [{preferredAlternatives.join(', ')}]</p>
			</div>
		{/if}
	</section>
</main>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: Arial, sans-serif;
	}

	.section {
		margin-bottom: 3rem;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	.inputs {
		display: flex;
		gap: 2rem;
		margin-bottom: 1rem;
	}

	.inputs label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.inputs input {
		width: 80px;
		padding: 0.25rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.subsection {
		margin-top: 1rem;
	}

	.subsection button {
		margin-right: 1rem;
		padding: 0.5rem 1rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.subsection button:hover {
		background: #0056b3;
	}

	.two-columns {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
	}

	.column-header {
		min-height: 60px;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
	}

	.matrix {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-bottom: 1rem;
	}

	.matrix-row {
		display: flex;
		gap: 2px;
	}

	.matrix-cell {
		width: 40px;
		height: 40px;
		text-align: center;
		border: 1px solid #ccc;
		font-size: 1.2rem;
		text-transform: lowercase;
	}

	.matrix-cell.invalid {
		border-color: red;
		background-color: #ffe6e6;
	}

	.matrix-cell.veto-column {
		border: 2px solid #007bff;
		background-color: #e3f2fd;
	}

	.matrix-cell.selected-alternative {
		background-color: #ffc107;
	}

	.matrix-cell.preferred-alternative {
		border: 3px solid #007bff;
		border-radius: 50%;
		background-color: transparent;
	}

	.compute-btn {
		padding: 0.75rem 1.5rem;
		background: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
	}

	.compute-btn:hover {
		background: #1e7e34;
	}

	.legend {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.instruction {
		font-size: 0.9rem;
		color: #666;
		margin: 0.5rem 0;
	}

	.color-box {
		width: 20px;
		height: 20px;
		border-radius: 4px;
	}

	.color-box.green {
		background: #28a745;
	}

	.color-box.yellow {
		background: #ffc107;
	}

	.pvc-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-top: 2px;
	}

	.pvc-item {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		font-size: 1.2rem;
		font-weight: bold;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid #ccc;
	}

	.pvc-item.in-pvc {
		background: #28a745;
		color: white;
	}

	.pvc-item.not-in-pvc {
		background: #ffc107;
		color: black;
	}

	.pvc-item.not-in-pvc:hover {
		background: #e0a800;
	}

	.pvc-item.highlighted {
		outline: 3px solid #007bff;
	}

	.dashboard {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.dashboard-item {
		padding: 0.5rem;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		min-width: 120px;
	}

	.veto-info {
		padding: 1rem;
		background: #e9ecef;
		border-radius: 4px;
		margin-top: 1rem;
	}

	.veto-info p {
		margin: 0.5rem 0;
	}
</style>