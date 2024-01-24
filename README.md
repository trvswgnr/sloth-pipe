# Lazy Pipe

Lazy Pipe is a library for TypeScript and JavaScript designed to facilitate the creation of lazy,
chainable, and reusable pipes for data transformation and processing. Borrowing from functional
programming paradigms, it offers a convenient and powerful way to compose functions and manage data
flow in an application, with an emphasis on lazy evaluation and efficient execution.

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

To install Lazy Pipe, use the following command:

```bash
bun i lazy-pipe
```

or

```bash
npm install lazy-pipe
```

## Usage

Here's a simple example of how to use Lazy Pipe:

```typescript
import { Pipe } from "lazy-pipe";

const result = Pipe(5)
    .to((x) => x * 2)
    .to((x) => x + 3)
    .exec();

console.log(result); // Outputs: 13
```

### Async Operations

Lazy Pipe seamlessly integrates with asynchronous operations:

```typescript
const asyncResult = await Pipe(5)
    .to(async (x) => x * 2)
    .to((x) => x + 3)
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
