# Note

This project is no longer active.

# See also: 

* "[What would be your ideal reference Bitshares wallet implementation?](https://hive.blog/bitshares/@nftea.gallery/what-would-be-your-ideal-reference-bitshares-wallet-implementation)"
* "[Roadmap for the SolidJS implementation of the Bitshares reference UI wallet](https://hive.blog/bitshares/@nftea.gallery/roadmap-for-the-solidjs-implementation-of-the-bitshares-reference-ui-wallet-plans-estimates-coordination)"
* https://www.youtube.com/watch?v=DVWu2b7mvFg

# SolidStart

Everything you need to build a Solid project, powered by [`solid-start`](https://start.solidjs.com);

## Creating a project

```bash
# create a new project in the current directory
npm init solid

# create a new project in my-app
npm init solid my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

Solid apps are built with _adapters_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different adapter, add it to the `devDependencies` in `package.json` and specify in your `vite.config.js`.
