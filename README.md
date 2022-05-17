[![CircleCI](https://circle.ci.adobe.com/gh/DIWI/unified-experience-components/tree/main.svg?style=svg)](https://circle.ci.adobe.com/gh/DIWI/unified-experience-components/tree/main)

# Hera

A codified expression of the **Unified Experience Framework**; higher-level patterns bringing together smaller pieces into reusable sets.

The goal of this project is to help products share common UI-patterns such as headers and toolbars, providing a consistent experience for
end-users as well as a positive and productive developer experience. These components are built by the DIWI and the product teams in a
collaboration.

## System requirements

-   NodeJS >=14.0.0 or >=16.0.0
-   Typescript
-   Browsers with Custom Elements V1 and Shadow DOM support, e.g. Chrome, Firefox, Safari, Edge (79+)
    -   Or appropriate [polyfills](https://github.com/webcomponents/webcomponentsjs) in older browsers.

## Getting started

```bash
git clone https://github.com/adobe/spectrum-web-components.git
cd unified-experience-components
yarn
```

The call to `yarn` will install and setup everything you need for developing and running the packages in this library.

Typical development will involve running `yarn dev` and `yarn test`.

### Building

```bash
yarn build
```

This will build every package in the library except those prefixed with `uec-` (_note_ this does not include `@uec-labs` as it has a scoped
`@` prefix). By default, the build script will include ts assets at package root `*.ts`, `src/*.ts`, and preview assets (`*.stories.ts`);
the build will automatically process any `*.css` and `*.svg` assets called in typescript files so there is no need to postfix those imports
with `.css.ts`.

The build script supports the follow flags:

-   `watch` | `w` [default: false]: Watches assets for changes.
-   `clean` | `c` [default: false]: Removes assets before building.
-   `test` [default: false]: Build test assets.
-   `preview` [default: true]: Build storybook assets. Can be turned off using `--no-preview`.
-   `verbose` | `v` [default: false]: Outputs more verbose messaging.
-   `quiet` | `q`: Reduce messaging output.
-   `debug` [default: false]: Messaging during the build to help with debugging the build.
-   `swc` [default: true]: Process assets using the @spectrum-web-components/base rather than lit. Can be turned off using `--no-swc`.

Combined with the `yarn build` command, you can customize the build like so:

-   `yarn build -- -- --test` (build packages with tests)
-   `yarn build -- -- --no-preview` (build packages without storybook)

### Scoped builds

If you wish to build only a specific component, you can use the `yarn build` command with additional scope settings. For example:

-   Building only experiments: `yarn build -- --scope @uec-labs/*`
-   Building experiments with verbose output: `yarn build -- --scope @uec-labs/* -- -v`

Properties can be passed to the build script by adding an additional `--` at the end of the command. For example:

-   Building experiments and test files: `yarn build -- --scope @uec-labs/* -- --test`

### Adding new SWC dependencies

The repo contains a helper tool for quickly adding `@spectrum-web-components` dependencies to a package.

```bash
yarn add:dep header accordion
yarn add:dep header styles -D
yarn add:dep --help
```

### Building a new component

Creating a new component from the command line can be done by running the following:

```bash
yarn new
```

This will scaffold your component's required architecture by prompting you for a little bit of information:

? **Package name (i.e. loading-screen)** ? **Is this an experiment?? [Y/n]**

By answering yes to the second question, your component will be scaffolded inside the experiments folder. Experiments are components that
might not meet Hera standards of architecture or abstraction but are planning to in the future. Once components are ready, they can be
migrated into the packages directory.

## Storybook

Testing & reviewing changes can be done using the Storybook instance. Running `yarn dev` will spin up a local instance of Storybook,
triggering the browser to open at completion. From there you can make changes to your code and the browser will automatically refresh.

You can run [Storybook](https://storybook.js.org) through the command:

```bash
yarn dev
```

By default, the resulting site will be available at [http://localhost:8000](http://localhost:8000).

## Advanced development

There are several commands that can be useful in specific scenarios:

-   `yarn build` to make sure the available JS has been built from the current TS source.
    -   To control the scope of a build, you can add `--scope` with the name of the package you want to build, i.e.,
        `yarn build --scope @unified-experience-components/loading-screen`.
-   `yarn publish:packages` will manage the publication to the artifactory registry for all updated components.
    -   _Note:_ you must have permissions to publish to the `@unified-experience-components` or `@uec-labs` namespace.
-   `yarn lint:versions` will ensure all dependencies in the monorepo are fully aligned.

## Linting

The project will be linted on a pre-commit hook, but you can also run the lint suite with `yarn lint`. It uses ESLint to lint the JS / TS
files, and StyleLint for the CSS files.

## Testing

### Unit tests

Unit tests are run with [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) in Playwright using the Chai, Mocha and Sinon
helper libraries. These tests can be executed with:

```
yarn test
```

During development you may wish to use `yarn watch:tests` to automatically build and re-run the test suites.

To run tests only for a specific component, you can use `yarn run test:scope <component name>`, i.e., `yarn run test:scope loading-screen`.

## IDE Notes

The build process compiles `.css` files using PostCSS and wraps them in the `lit-html` `css` template tag and writes out a `.css.ts` file
for easy import into TypeScript files. This file should not be edited, and is ignored by `.gitignore`, but you may also wish to hide the
files in your IDE.

# Contributing

It is paramount to the success of this project that you participate! This is a community project for our Adobe web assets and we want to
involve you however we can - as a developer, content writer, or project manager. We welcome your feedback, ideas, and contributions. Check
out our [contribution guidelines](CONTRIBUTING.md) for more information.
