<script lang="ts">
	import { onMount } from 'svelte';
	import {
		computePVC as computePVCLogic,
		computeVetoCoalition as computeVetoCoalitionLogic,
		validateVoterPreferences,
		matrixToProfile,
		generateAlternatives,
		areNumbersApproximatelyEqual,
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

	// Section visibility flags
	let showMatrix = false;
	let showPVC = false;
	let showVetoCoalition = false;

	// Initialize preferences matrix
	function initializeMatrix() {
		preferences = Array(m)
			.fill(null)
			.map(() => Array(n).fill(''));
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
		showMatrix = true;
		showPVC = false;
		showVetoCoalition = false;
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
		showMatrix = true;
		showPVC = false;
		showVetoCoalition = false;
	}

	// Validate a column (voter's preferences)
	function isColumnValid(colIndex: number): boolean {
		const column = preferences.map((row) => row[colIndex]);
		const alternatives = getAlternatives();
		return validateVoterPreferences(column, alternatives);
	}

	// Check if all columns are valid
	function isMatrixValid(): boolean {
		for (let col = 0; col < n; col++) {
			if (!isColumnValid(col)) {
				return false;
			}
		}
		return true;
	}

	// PVC computation using veto coalition logic
	function computePVC() {
		const alternatives = getAlternatives();

		// Find alternatives that can be vetoed
		const vetoableAlternatives = [];
		const nonVetoableAlternatives = [];

		for (const alternative of alternatives) {
			const result = computeVetoCoalitionLogic(alternative, preferences, alternatives, []);
			if (result.preferredAlternatives.length > 0) {
				// This alternative can be vetoed
				vetoableAlternatives.push(alternative);
			} else {
				// This alternative cannot be vetoed
				nonVetoableAlternatives.push(alternative);
			}
		}

		// PVC consists of alternatives that cannot be vetoed
		pvc = nonVetoableAlternatives;

		// Also compute using the successive elimination method for highlighting
		const successivelyEliminatedPVC = computePVCLogic(preferences, alternatives);

		// Store which alternatives were found through successive elimination for highlighting
		successivelyEliminatedAlternatives = successivelyEliminatedPVC;

		showPVC = true;
		showVetoCoalition = false;
	}

	// Track alternatives found through successive elimination
	let successivelyEliminatedAlternatives: string[] = [];

	// Handle alternative click
	function onAlternativeClick(alternative: string) {
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

		showVetoCoalition = true;
	}

	// Clear veto coalition display
	function clearVetoCoalition() {
		selectedAlternative = '';
		vetoCoalition = [];
		preferredAlternatives = [];
		T = 0;
		T_size = 0;
		v_T = 0;
		B = [];
		lambda_B_over_P = 0;
	}

	// Handle input changes
	function onMNChange() {
		initializeMatrix();
		pvc = [];
		selectedAlternative = '';
		vetoCoalition = [];
		preferredAlternatives = [];
		showMatrix = false;
		showPVC = false;
		showVetoCoalition = false;
	}

	// Handle preference cell change
	function onPreferenceChange(row: number, col: number, event: Event) {
		const target = event.target as HTMLInputElement;
		console.log("preference changed");
		if (target) {
			preferences[row][col] = target.value.toLowerCase();
			preferences = [...preferences]; // trigger reactivity
			console.log("preferences is now: ", preferences);
		}
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

	<!-- Section 2: Voter Preferences -->
	<section class="section">
		<div class="column-header">
			<h3>Voter Preference</h3>
			<p>Click on any cell to edit the alternative.</p>
		</div>
		<div class="matrix">
			{#each preferences as row, rowIndex}
				<div class="matrix-row">
					{#each row as cell, colIndex}
						<input
							type="text"
							maxlength="1"
							bind:value={cell}
							on:input={(e) => onPreferenceChange(rowIndex, colIndex, e)}
							class="matrix-cell"
							class:invalid={!isColumnValid(colIndex)}
						/>
					{/each}
				</div>
			{/each}
		</div>
		<button on:click={computePVC} class="compute-btn" disabled={!isMatrixValid()}>Compute PVC</button>
	</section>

	<!-- Section 3: PVC -->
	{#if showPVC}
		<section class="section">
			<div class="column-header">
				<h3>PVC</h3>
				<p class="instruction">Click on any alternative below to see a veto coalition</p>
			</div>
			<div class="pvc-list-horizontal">
				{#each getAlternatives() as alternative}
					<div
						class="pvc-item"
						class:in-pvc={pvc.includes(alternative)}
						class:not-in-pvc={!pvc.includes(alternative)}
						class:highlighted={vetoCoalition.length > 0 && selectedAlternative === alternative}
						class:successive-elimination={successivelyEliminatedAlternatives.includes(alternative)}
						on:click={() => onAlternativeClick(alternative)}
						role="button"
						tabindex="0"
					>
						{alternative}
					</div>
				{/each}
			</div>

			<div class="legend">
				<span class="legend-item">
					<span class="border-box successive-border"></span> Successive Elimination Result
				</span>
				<span class="legend-item">
					<span class="color-box green"></span> In PVC
				</span>
				<span class="legend-item">
					<span class="color-box yellow"></span> Not in PVC
				</span>
			</div>
		</section>
	{/if}

	<!-- Section 4: Veto Coalition Dashboard -->
	{#if showVetoCoalition && selectedAlternative}
		<section class="section">
			<div class="veto-dashboard">
				{#if preferredAlternatives.length > 0}
					<div class="analysis-section found">
						<h4>Veto Coalition Found</h4>
						<div class="coalition-info">
							<p>
								<strong>Coalition Members (T):</strong> Voters {vetoCoalition
									.map((i) => i + 1)
									.join(', ')}
							</p>
							<p>
								<strong>Preferred Alternatives (B):</strong> [{preferredAlternatives.join(', ')}]
							</p>
						</div>
					</div>

					<div class="veto-matrix-section">
						<h4>Veto Coalition Preference Matrix</h4>

						<div class="veto-matrix-container">
							<div class="veto-matrix">
								{#each preferences as row, rowIndex}
									<div class="veto-matrix-row">
										{#each row as cell, colIndex}
											<div
												class="veto-matrix-cell"
												class:veto-column={vetoCoalition.includes(colIndex)}
												class:selected-alternative={vetoCoalition.includes(colIndex) &&
													cell === selectedAlternative}
												class:preferred-alternative={vetoCoalition.includes(colIndex) &&
													preferredAlternatives.includes(cell) &&
													cell !== selectedAlternative}
											>
												{cell}
											</div>
										{/each}
									</div>
								{/each}
							</div>
							<div class="coalition-arrows">
								{#each Array(n) as _, colIndex}
									{#if vetoCoalition.includes(colIndex)}
										<div class="coalition-arrow" style="left: {colIndex * 42 + 21}px;">
											<div class="arrow-pointer">↑</div>
											<div class="arrow-label">Voter {colIndex + 1}</div>
										</div>
									{/if}
								{/each}
							</div>
						</div>
						<div class="veto-matrix-legend">
							<span class="legend-item">
								<span class="coalition-arrow-legend">↑</span> Coalition Members
							</span>
							<span class="legend-item">
								<span class="color-box selected-alt-legend"></span> Vetoed Alternative
							</span>
							<span class="legend-item">
								<span class="color-box preferred-alt-legend"></span> Preferred Alternatives
							</span>
						</div>
					</div>

					<div class="metrics-section">
						<div class="metrics-grid">
							<div class="metric-item">
								<div class="metric-symbol">v(T)</div>
								<div class="metric-details">
									<div class="metric-label">Veto Power</div>
									<div class="metric-value">{Math.round(v_T * 1000) / 1000}</div>
								</div>
							</div>

							<div class="metric-item">
								<div class="metric-symbol">m-|B|</div>
								<div class="metric-details">
									<div class="metric-label">Veto size</div>
									<div class="metric-value">{m - B.length}</div>
								</div>
							</div>
						</div>
					</div>
					<div class="condition-result">
						<div
							class="condition-check {( (v_T >= m - B.length) || areNumbersApproximatelyEqual(v_T,m - B.length )) ? 'satisfied' : 'not-satisfied'}"
						>
							<span class="condition-text">
								{Math.round(v_T * 1000) / 1000}
								{( (v_T >= m - B.length) || areNumbersApproximatelyEqual(v_T,m - B.length )) ? '≥' : '<'}
								{Math.round((m - B.length) * 1000) / 1000}
							</span>
							<span class="condition-status">
								{( (v_T >= m - B.length) || areNumbersApproximatelyEqual(v_T,m - B.length )) ? '✓ Veto Power ≥ Veto Size' : '✗ Veto Power < Veto Size'}
							</span>
						</div>
					</div>
					<div class="explainer-section">
						<h5>Veto Power Explanation</h5>
						<ul>
							<li>
								To form a winning coalition, we need to eliminate <strong>m-1</strong> candidates (leaving 1 winner), so each of the <strong>n</strong> voters can veto up to <strong>(m-1)/n</strong> alternatives. This is the veto power of a voter.
							</li>
							<li>
								A coalition <strong>T</strong> of voters has total veto power: <strong>v(T)=|T|*(m-1)/n</strong>.
							</li>
							<li>
								An alternative is vetoed if the veto power of a coalition is at least the veto size: <strong>v(T) ≥ m - |B|</strong>.
							</li>
							<li>
								In other words, the coalition has enough veto power to afford the veto size.
							</li>
						</ul>
					</div>

					

					<button on:click={clearVetoCoalition} class="clear-btn">Clear Analysis</button>
				{:else}
					<div class="analysis-section not-found">
						<h4>No Veto Coalition Found</h4>
						<p>
							No coalition of voters can veto alternative <strong>{selectedAlternative}</strong>
						</p>
						<p class="no-veto-explanation">
							This alternative cannot be eliminated through the proportional veto mechanism with the
							current preference profile.
						</p>
					</div>
					<button on:click={clearVetoCoalition} class="clear-btn">Clear Analysis</button>
				{/if}
			</div>
		</section>
	{/if}

	<footer class="contact-footer">
		<p>Contact: jeqin_chooi@college.harvard.edu</p>
	</footer>
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

	.compute-btn:disabled {
		background: #6c757d;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.compute-btn:disabled:hover {
		background: #6c757d;
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

	.border-box {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		background: white;
	}

	.successive-border {
		border: 3px solid #6f42c1;
		box-shadow: 0 0 0 1px #6f42c1;
	}

	.pvc-list-horizontal {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 2px;
		margin-bottom: 1rem;
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

	.pvc-item {
		background: #6c757d;
		color: white;
	}

	.pvc-item:hover {
		background: #5a6268;
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

	.pvc-item.successive-elimination {
		border: 3px solid #6f42c1;
		box-shadow: 0 0 0 1px #6f42c1;
	}

	.veto-dashboard {
		padding: 1rem;
	}


	.analysis-section {
		margin-bottom: 2rem;
		padding: 1rem;
		background: #e9ecef;
		border-radius: 4px;
	}

	.analysis-section h4 {
		margin: 0 0 1rem 0;
	}

	.analysis-section.found h4 {
		color: #28a745;
	}

	.analysis-section.not-found h4 {
		color: #dc3545;
	}

	.coalition-info p {
		margin: 0.5rem 0;
	}

	.no-veto-explanation {
		color: #666;
		font-style: italic;
		margin-top: 0.75rem;
		font-size: 0.9rem;
	}

	.metrics-section {
		margin-bottom: 2rem;
	}

	.explainer-section {
		background: #e7f3ff;
		padding: 1rem;
		border: 1px solid #b3d9ff;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.explainer-section h5 {
		margin: 0 0 0.75rem 0;
		color: #0056b3;
		font-size: 1rem;
	}

	.explainer-section ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.explainer-section li {
		font-size: 0.9rem;
		line-height: 1.6;
		color: #333;
		margin-bottom: 0.75rem;
	}

	.explainer-section li:last-child {
		margin-bottom: 0;
	}

	.condition-result {
		margin-bottom: 1.5rem;
	}

	.condition-check {
		padding: 1rem;
		border-radius: 6px;
		text-align: center;
		font-weight: bold;
	}

	.condition-check.satisfied {
		background: #d4edda;
		border: 2px solid #28a745;
		color: #155724;
	}

	.condition-check.not-satisfied {
		background: #f8d7da;
		border: 2px solid #dc3545;
		color: #721c24;
	}

	.condition-text {
		display: block;
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
		font-family: monospace;
	}

	.condition-status {
		display: block;
		font-size: 0.9rem;
		font-weight: normal;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.metric-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #f8f9fa;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.metric-symbol {
		font-size: 1.5rem;
		font-weight: bold;
		color: #007bff;
		min-width: 60px;
		text-align: center;
		background: white;
		padding: 0.5rem;
		border-radius: 4px;
		border: 2px solid #007bff;
	}

	.metric-details {
		flex: 1;
	}

	.metric-label {
		font-size: 0.9rem;
		color: #666;
		margin-bottom: 0.25rem;
	}

	.metric-value {
		font-size: 1.1rem;
		font-weight: bold;
		color: #333;
	}

	.clear-btn {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.clear-btn:hover {
		background: #c82333;
	}

	.veto-matrix-section {
		margin-bottom: 3rem;
		padding: 1rem;
		padding-bottom: 2rem;
		background: #f8f9fa;
		border-radius: 8px;
		border: 1px solid #dee2e6;
	}

	.veto-matrix-section h4 {
		margin: 0 0 1rem 0;
		color: #495057;
	}

	.veto-matrix-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: white;
		border-radius: 4px;
		border: 1px solid #dee2e6;
	}

	.coalition-arrow-legend {
		color: #007bff;
		font-size: 1.2rem;
		font-weight: bold;
		margin-right: 0.25rem;
	}

	.selected-alt-legend {
		background: #ffc107;
	}

	.preferred-alt-legend {
		background: #cce7ff;
		color: #004085;
		border: 1px solid #004085;
	}

	.veto-matrix-container {
		position: relative;
		background: white;
		border-radius: 4px;
		border: 1px solid #dee2e6;
		margin-bottom: 1rem;
	}

	.veto-matrix {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 1rem;
		padding-bottom: 4rem;
	}

	.veto-matrix-row {
		display: flex;
		gap: 2px;
	}

	.veto-matrix-cell {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		border: 1px solid #ccc;
		font-size: 1.2rem;
		text-transform: lowercase;
		background: white;
	}

	.veto-matrix-cell.veto-column {
		border: 2px solid #007bff;
		background-color: white;
	}

	.veto-matrix-cell.selected-alternative {
		background-color: #ffc107;
		font-weight: bold;
	}

	.veto-matrix-cell.preferred-alternative {
		background-color: #cce7ff;
		color: #004085;
		font-weight: bold;
	}

	.coalition-arrows {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		right: 1rem;
		height: 2.5rem;
		pointer-events: none;
	}

	.coalition-arrow {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		transform: translateX(-50%);
	}

	.arrow-pointer {
		font-size: 1.5rem;
		color: #007bff;
		font-weight: bold;
		line-height: 1;
		text-shadow: 0 0 3px white;
	}

	.arrow-label {
		font-size: 0.75rem;
		color: #007bff;
		font-weight: bold;
		margin-top: 0.25rem;
		background: white;
		padding: 0 0.25rem;
		border-radius: 2px;
		white-space: nowrap;
	}

	.contact-footer {
		margin-top: 3rem;
		padding: 1rem 0;
		text-align: center;
		border-top: 1px solid #eee;
	}

	.contact-footer p {
		margin: 0;
		color: #888;
		font-size: 0.85rem;
		font-style: italic;
	}
</style>
