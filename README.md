# Proportional Veto Core Playground

An interactive educational tool for exploring the **Proportional Veto Core (PVC)**, a social choice mechanism that determines which alternatives can survive coalition-based veto power.

## What is the Proportional Veto Core?

The Proportional Veto Core is a solution concept in social choice theory where alternatives survive if no coalition of voters can veto them according to the proportional veto condition:

**|T|/n ≥ 1 - |B|/m**

Where:
- **T** = Coalition of voters
- **|T|/n** = Voting power (proportion of voters in coalition)
- **B** = Alternatives preferred by all coalition members over the target
- **|B|/m** = Relative size of preferred alternatives

## Features

### 🎛️ Interactive Parameter Setting
- Adjust **m** (number of alternatives) and **n** (number of voters)
- Initialize preference matrices with identical or randomized preferences

### 📊 Preference Matrix Editor
- Edit voter preferences with real-time validation
- Visual feedback for invalid entries (duplicates, incorrect alternatives)
- Smart validation prevents computing PVC with invalid data

### 🎯 PVC Computation
- **Veto-based method**: Finds alternatives that cannot be vetoed by any coalition
- **Successive elimination method**: Traditional approach for comparison (highlighted with purple border)
- Horizontal display of all alternatives with color coding:
  - 🟢 **Green**: In PVC (cannot be vetoed)
  - 🟡 **Yellow**: Not in PVC (can be vetoed)

### 🔍 Veto Coalition Analysis
- Click any alternative to analyze its veto coalitions
- **Coalition visualization**: Arrows point to coalition members in preference matrix
- **Preferred alternatives**: Light blue highlighting shows alternatives preferred over the selected one
- **Vetoed alternative**: Yellow highlighting shows the target alternative
- **Mathematical dashboard**: Real-time calculation of voting power and veto conditions

### 📈 Educational Dashboard
- **Voting Power (|T|/n)**: Proportion of voters in the coalition
- **Veto Size (1-|B|/m)**: Cost of vetoing the alternative
- **Condition Check**: Visual verification of whether veto condition is satisfied
- **Detailed explanations**: Mathematical formulas and interpretations

## Technology Stack

- **Frontend**: SvelteKit with TypeScript
- **Styling**: Custom CSS with responsive design
- **Mathematics**: Custom implementation of PVC algorithms
- **Deployment**: Static site generation with `@sveltejs/adapter-static`

## Development

### Prerequisites
- Node.js 18+ 
- npm, pnpm, or yarn

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
npm run dev -- --open
```

### Building for Production

```bash
# Build static site
npm run build

# Preview production build
npm run preview
```

## Educational Use

This tool is designed for:
- **Students** learning social choice theory and voting mechanisms
- **Researchers** exploring PVC properties with different preference profiles  
- **Educators** demonstrating coalition-based veto concepts
- **Anyone** curious about mathematical approaches to group decision-making

## Mathematical Background

The PVC implements a proportional veto mechanism where:
1. Each voter gets veto power proportional to **1/n**
2. The "cost" of vetoing an alternative depends on how many alternatives the coalition prefers
3. An alternative survives if no coalition has enough veto power to eliminate it
4. This creates a balance between majority rule and minority protection

## Contact

For questions or feedback: jeqin_chooi@college.harvard.edu