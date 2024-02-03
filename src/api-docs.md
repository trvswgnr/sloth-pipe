# Sloth Pipe API Documentation

Sloth Pipe is a TS/JS library for building lazy, chainable, and efficient data processing pipes. This
document provides detailed information about the API, including method signatures, return types, and
usage examples.

## Table of Contents

-   [Pipe Function](#pipe-function)
-   [Methods](#methods)
    -   [to](#to)
    -   [tap](#tap)
    -   [exec](#exec)
    -   [catch](#catch)
-   [Type Definitions](#type-definitions)
-   [Error Handling](#error-handling)
-   [Async/Await Support](#asyncawait-support)

## Pipe Function

### Pipe\<T>(initialValue: T): Pipeable\<T>

Creates a new pipe with an initial value.

**Parameters**:

-   `initialValue`: The starting value for the pipe.

**Returns**: A `Pipeable` object representing the pipe.

**Example**:

```typescript
const pipe = Pipe(10);
```

## Methods

### to

#### pipe.to(fn: Function, ...args: any[]): Pipeable

Adds a transformation function to the pipe.

**Parameters**:

-   `fn`: Function to be applied to the current value.
-   `args`: Additional arguments to pass to the function.

**Returns**: The modified `Pipeable` object for chaining.

**Example**:

```typescript
pipe.to((x) => x * 2);
```

### tap

#### pipe.tap(fn: Function, ...args: any[]): Pipeable

Adds a side-effect function to the pipe without altering the value.

**Parameters**:

-   `fn`: Side-effect function to be applied.
-   `args`: Additional arguments to pass to the function.

**Returns**: The modified `Pipeable` object for chaining.

**Example**:

```typescript
pipe.tap((x) => console.log(x));
```

### exec

#### pipe.exec(): any

Executes the pipe and returns the final value.

**Returns**: The final value after applying all functions in the pipe.

**Example**:

```typescript
const result = pipe.exec();
```

### catch

#### pipe.catch(fn: Function): Pipeable

Adds an error handling function to the pipe.

**Parameters**:

-   `fn`: Error handling function.

**Returns**: The modified `Pipeable` object for chaining.

**Example**:

```typescript
pipe.catch((error) => console.error(error));
```

## Type Definitions

### Pipeable\<T>

The `Pipeable<T>` type is the core of Sloth Pipe's chainable interface. It allows the chaining of
`to`, `tap`, `catch`, and `exec` methods.

### Function Signatures

#### to

-   **Signature**: `<U>(fn: (x: T) => U): Pipe<T, U, "to">`
-   **Description**: Transforms the current value in the pipe using the provided function.
-   **Returns**: The same `Pipeable` object for further chaining.

#### tap

-   **Signature**: `<U>(fn: (x: T, ...args: any[]) => void): Pipe<T, T, "tap">`
-   **Description**: Executes a side-effect function using the current value in the pipe without
    modifying it.
-   **Returns**: The same `Pipeable` object for further chaining.

#### catch

-   **Signature**: `<V>(fn: (err: unknown) => V) => Pipe<T, V | T, "catch">`
-   **Description**: Adds error handling to the pipeline. The function is called if an error occurs
    in any preceding `to` or `tap` function.
-   **Returns**: The same `Pipeable` object for further chaining.

#### exec

-   **Signature**: `(): T`
-   **Description**: Executes the pipeline and returns the final value.
-   **Returns**: The final value after applying all functions in the pipeline and handling any
    errors.

## Error Handling

Sloth Pipe allows handling errors that may occur during function execution in the pipeline. When an
error is thrown in a `to` or `tap` method, the `catch` method is invoked if it is defined. This does
not stop the pipeline from executing, but it does allow for graceful error handling.

**Example**:

```typescript
const result = Pipe(5)
    .to((x) => {
        throw new Error("Example Error");
    })
    .catch((err) => "Error occurred")
    .exec();

console.log(result); // Outputs: "Error occurred"
```

## Async/Await Support

Sloth Pipe supports asynchronous operations within the pipeline. Functions passed to `to` or `tap`
can be asynchronous, and `exec` will return a Promise if any function in the pipeline is
asynchronous.

**Async Example**:

```typescript
const asyncResult = await Pipe(5)
    .to(async (x) => x * 2)
    .to(async (x) => x + 3)
    .exec();

console.log(asyncResult); // Outputs: 13
```

**Note**: When using asynchronous functions, the `catch` method will be invoked just like with
synchronous functions. However, the `catch` method must also be asynchronous in order to handle
errors properly.
