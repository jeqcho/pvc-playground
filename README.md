# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

---
```markdown
This website is to be used as a playground to understand the social choice theorem known as the proportional veto core.

The website has three sections.

The first section lets users input m (the number of alternatives) and n (the number of voters). Below that, there is a subsection called "Initialize matrix" with two buttons: "Identical preferences" and "Randomize"

The second section has two sections side by side. The left subsection is a m x n table, titled "Voter Preference". Note that each column correspond to the preference of a voter. The entries are a-z on each column (depending on m). Users can edit this matrix, but there's automatic validation that will outline a column in red if validation fails (e.g. if there are duplicate entries, empty entries of letters that are not the first m letters). Below the matrix there is a button called "Compute PVC". The right subsection is a single column of m rows. This is titled "PVC". The alternatives in the PVC will be in the first few rows and coloured in green, while those not in the PVC will be coloured in red in the bottom few rows. Below the title, there is a legend explaining the two colours.

The third section has an instruction "Click on any alternative that is not in the PVC to see a veto coalition". This is followed by a dashboard of quantities: T, |T|, v(T), B, lambda(B)/lambda(P). When a user clicks on a red alternative (say R) in the right subsection, the website will compute a veto coalition (basically a set of voters), highlight these corresponding columns, mark R as red in these columns, come up with B (a set of alternatives that is preferred over R) across all these voters, and circle them in blue.

For now, focus on the front end. The main logic for computing PVC should just be dummy function that returns the first 2 alternatives (a and b) for now (if there are <2 alternatives, then just output the whole list). The main logic for computing the veto coalition will just be the first and third voter for now (if there are <3 voters, then just output the first voter). We will work on the logic later.
```