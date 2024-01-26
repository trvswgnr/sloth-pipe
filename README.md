![sloth-pipe](readme-banner.png)

# Sloth Pipe

<!-- start badges -->

[![github latest release](https://badgen.net/github/tag/trvswgnr/sloth-pipe?label=latest&cache=600)](https://github.com/trvswgnr/sloth-pipe/releases/latest)
[![npm version](https://badgen.net/npm/v/sloth-pipe?cache=600)](https://www.npmjs.com/package/sloth-pipe)
![npm weekly downloads](https://img.shields.io/npm/dw/sloth-pipe)
![dependencies](https://img.shields.io/badge/dependencies-0-orange)
[![license](https://img.shields.io/github/license/trvswgnr/sloth-pipe)](LICENSE)
[![open issues](https://badgen.net/github/open-issues/trvswgnr/sloth-pipe?label=issues)](https://github.com/trvswgnr/sloth-pipe/issues)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/sloth-pipe)](https://bundlephobia.com/result?p=sloth-pipe)
![follow on xitter](https://img.shields.io/twitter/follow/techsavvytravvy?style=social)

<!-- end badges -->

Sloth Pipe is a tiny library for TypeScript and JavaScript that lets you create lazy, chainable, and
reusable pipes for data transformation and processing. Borrowing from functional programming
paradigms, it offers a convenient and powerful way to compose functions and manage data flow in an
application, with an emphasis on lazy evaluation and efficient execution.

## Why Sloth Pipe?

Developers want pipes. They've been one of the
[most requested features](https://2020.stateofjs.com/en-US/opinions/#missing_from_js) in JavaScript
[for years](https://2022.stateofjs.com/en-US/opinions/#top_currently_missing_from_js), and there's
even a [Stage 2 proposal](https://github.com/tc39/proposal-pipeline-operator) for adding them to the
language. Sloth Pipe isn't a direct replacement for the proposed pipeline operator, but it does
offer a similar experience and many of the
[same benefits](https://github.com/tc39/proposal-pipeline-operator#why-a-pipe-operator).

## Features

-   **Lazy Evaluation**: Computations are only performed when necessary, optimizing performance and
    resource utilization.
-   **Chainable API**: Enables the creation of fluent and readable code by chaining multiple
    operations.
-   **Error Handling**: Built-in support for error handling within the pipe.
-   **Async/Await Compatibility**: Seamlessly integrate asynchronous functions into your pipes.
-   **Tap Operations**: Allows side-effects without altering the pipe's main data flow.
-   **Reusable pipes**: Easily reuse pipes, even after execution.
-   **Extensible**: Easily extendable with custom functions and operations.
-   **Type-Safe**: Written in TypeScript, with full support for type inference and type safety.
-   **Lightweight**: Small and lightweight, with no external dependencies.
-   **Well-Tested**: Thoroughly tested with 100% code coverage.

## Installation

To install Sloth Pipe, use the following command:

```bash
bun i sloth-pipe
```

or

```bash
npm install sloth-pipe
```

## Usage

Here's a simple example of how to use Sloth Pipe:

```typescript
import { Pipe } from "sloth-pipe";

const result = Pipe(5)
    .to((x) => x * 2)
    .to((x) => x + 3)
    .exec();

console.log(result); // Outputs: 13
```

### Async Operations

Sloth Pipe seamlessly integrates with asynchronous operations:

```typescript
const add = async (x: Promise<number>, y: number) => {
    const xVal = await x;
    return xVal + y;
};
const asyncResult = await Pipe(5)
    .to(async (x) => x * 2)
    .to(add, 3) // pass additional arguments to any function
    .exec();

console.log(asyncResult); // Outputs: 13
```

### Error Handling

Handle errors gracefully within the pipe:

```typescript
const safeResult = Pipe(5)
    .to((x) => {
        if (x > 0) throw new Error("Example error");
        return x;
    })
    .catch((err) => 0)
    .exec();

console.log(safeResult); // Outputs: 0
```

## API Reference

The API consists of a few key methods: `to`, `tap`, `exec`, and `catch`. For a detailed reference,
please refer to the [API documentation](api-docs.md).

## Contributing

Any and all contributions are welcome! Open an issue or submit a pull request to contribute.

This project uses [Bun](https://bun.sh) for development. To get started, clone the repository and
run `bun install` to install dependencies. Then, run `bun test` to run the test suite.

To build the project, run `bun build`. The output will be in the `dist` directory.

## License

This project is licensed under the [MIT License](LICENSE).
