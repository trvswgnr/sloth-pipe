import { run, bench, group, baseline, type Report } from "mitata";
import { Pipe } from "./pipe";
import { unlink } from "fs/promises";
import { Worker, isMainThread, parentPort } from "worker_threads";

const oldPipePath = "./_old-pipe.ts";
const __filename = new URL(import.meta.url).pathname;

if (isMainThread) {
    const worker = new Worker(__filename);

    worker.on("message", (exitCode: number) => {
        cleanup().then(() => {
            console.log("Goodbye!");
            process.exit(exitCode);
        });
    });

    worker.on("error", (error: Error) => {
        console.error("Worker error:", error);
        cleanup().then(() => {
            console.log("Goodbye!");
            process.exit(1);
        });
    });

    worker.on("exit", (code: number) => {
        if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
            cleanup().then(() => {
                console.log("Goodbye!");
                process.exit(code);
            });
        }
    });

    process.on("SIGINT", async () => {
        console.log("\nSIGINT received");
        await cleanup().then(() => {
            console.log("Goodbye!");
            process.exit(130);
        });
    });

    process.on("SIGTERM", async () => {
        console.log("\nSIGTERM received");
        await cleanup().then(() => {
            console.log("Goodbye!");
            process.exit(143);
        });
    });
} else {
    const result = await main();
    parentPort?.postMessage(result);
}

async function main() {
    const OldPipe = await getOldPipe(oldPipePath);

    const exampleFn1 = (x: number) => x + 1;
    const exampleFn2 = (x: number) => x + 2;

    group("compare old and new Pipe with sync functions", () => {
        baseline("new Pipe", () => {
            Pipe(0).to(exampleFn1).to(exampleFn2).exec();
        });
        bench("old Pipe", () => {
            OldPipe(0).to(exampleFn1).to(exampleFn2).exec();
        });
    });

    group("compare to native promise with async functions", () => {
        baseline("new Pipe", async () => {
            await Pipe(Promise.resolve(0))
                .to(async (x) => (await x) + 1)
                .to(async (x) => (await x) + 1)
                .exec();
        });
        bench("old Pipe", async () => {
            await OldPipe(Promise.resolve(0))
                .to(async (x) => (await x) + 1)
                .to(async (x) => (await x) + 1)
                .exec();
        });
        bench("Native Promise", async () => {
            await Promise.resolve(0)
                .then((x) => x + 1)
                .then((x) => x + 1);
        });
    });

    if (process.argv.includes("--micro")) {
        // some extra micro benchmarks:
        printMicroDiff(
            microBench("New Pipe", 10, () => Pipe(0).to(exampleFn1).to(exampleFn2)),
            microBench("Old Pipe", 10, () => OldPipe(0).to(exampleFn1).to(exampleFn2).exec()),
        );

        printMicroDiff(
            microBench("New Pipe", 1000000, () => Pipe(0).to(exampleFn1).to(exampleFn2)),
            microBench("Old Pipe", 1000000, () => OldPipe(0).to(exampleFn1).to(exampleFn2).exec()),
        );

        printTimeDiff(
            timeBench("New Pipe", 1, () => Pipe(0).to(exampleFn1).to(exampleFn2)),
            timeBench("Old Pipe", 1, () => OldPipe(0).to(exampleFn1).to(exampleFn2).exec()),
        );

        printTimeDiff(
            timeBench("New Pipe", 5, () => Pipe(0).to(exampleFn1).to(exampleFn2)),
            timeBench("Old Pipe", 5, () => OldPipe(0).to(exampleFn1).to(exampleFn2).exec()),
        );

        console.log();
    }

    const options = {};

    return await run(options)
        .then(checkIsSlower)
        .catch((error) => {
            console.error(error);
            return 1;
        });
}

function checkIsSlower(report: Report, marginOfError = 0.2) {
    console.log("\nChecking if new Pipe is slower than old Pipe...");
    const groups: any = {};
    report.benchmarks.forEach((b) => {
        const key = b.group;
        if (!key) return;
        groups[key] ??= [];
        if (b.name === "Native Promise") return;
        groups[key].push({ name: b.name, avg: b.stats?.avg });
    });

    let isSlower = false;
    Object.entries(groups).forEach(([group, _benchmarks]) => {
        const benchmarks = _benchmarks as { name: string; avg: number }[];
        const newPipeBenchmark = benchmarks.find((b) => b.name === "new Pipe");
        const oldPipeBenchmark = benchmarks.find((b) => b.name === "old Pipe");

        if (!newPipeBenchmark || !oldPipeBenchmark) {
            console.warn(`Missing benchmarks for comparison in group ${group}`);
            return;
        }

        const isSignificantlySlower =
            newPipeBenchmark.avg > oldPipeBenchmark.avg * (1 + marginOfError);
        if (isSignificantlySlower) {
            process.stderr.write(
                `❌ new Pipe is more than ${
                    marginOfError * 100
                }% slower than old Pipe in "${group}"\n`,
            );
            isSlower = true;
        }
    });

    if (!isSlower) {
        console.log("✅ new Pipe is faster or not significantly slower than old Pipe");
    }

    return Number(isSlower);
}

async function getOldPipe(filepath: string) {
    const child = Bun.spawn(["git", "show", "origin/main:src/pipe.ts"], { stdout: "pipe" });
    const code = await child.exited;
    if (code !== 0) throw new Error("could not get old pipe");
    const content: string = await Bun.readableStreamToText(child.stdout);
    await Bun.write(filepath, content);
    const { Pipe: OldPipe } = (await import(filepath)) as { Pipe: typeof Pipe };
    return OldPipe;
}

async function cleanup() {
    console.log("\nCleaning up...");
    await unlink(oldPipePath).catch(() => {});
}

// run micro benchmark
function microBench(name: string, runs: number, fn: () => void) {
    const start = Bun.nanoseconds();
    for (let i = 0; i < runs; i++) {
        fn();
    }
    const end = Bun.nanoseconds();
    const total = end - start;
    const avg = total / runs;
    return { name, avg, total, runs };
}

type MicroBench = ReturnType<typeof microBench>;

function printMicroDiff(a: MicroBench, b: MicroBench) {
    console.log();
    console.log(
        `${a.name}: ${yellow(convertNanos(a.avg))}/iter over ${yellow(locale(a.runs))} runs`,
    );
    console.log(
        `${b.name}: ${yellow(convertNanos(b.avg))}/iter over ${yellow(locale(b.runs))} runs`,
    );
    if (a.avg < b.avg) {
        const times = (b.avg / a.avg).toLocaleString("en-US", { maximumFractionDigits: 2 });
        console.log(
            `${cyan(a.name)} is ${green(times)}x faster than ${cyan(b.name)} over ${yellow(
                locale(a.runs),
            )} runs`,
        );
    } else if (a.avg > b.avg) {
        const times = (a.avg / b.avg).toLocaleString("en-US", { maximumFractionDigits: 2 });
        console.log(
            `${cyan(a.name)} is ${red(times)}x slower than ${cyan(a.name)} over ${yellow(
                locale(a.runs),
            )} runs`,
        );
    } else {
        console.log(
            `${cyan(a.name)} and ${cyan(b.name)} are the same speed over ${yellow(
                locale(a.runs),
            )} runs`,
        );
    }
}

// time-based benchmarks (how many runs can be done in n seconds)
function timeBench(name: string, seconds: number, fn: () => void) {
    const start = Bun.nanoseconds();
    let runs = 0;
    while (Bun.nanoseconds() - start < seconds * 1e9) {
        fn();
        runs++;
    }
    return { name, runs, seconds };
}
type TimeBench = ReturnType<typeof timeBench>;

function printTimeDiff(a: TimeBench, b: TimeBench) {
    console.log();
    console.log(
        `${a.name}: ${yellow(locale(a.runs))} runs in ${yellow(locale(a.seconds))} second${
            a.seconds === 1 ? "" : "s"
        }`,
    );
    console.log(
        `${b.name}: ${yellow(locale(b.runs))} runs in ${yellow(locale(b.seconds))} second${
            b.seconds === 1 ? "" : "s"
        }`,
    );
    if (a.runs > b.runs) {
        const times = locale(a.runs / b.runs);
        console.log(
            `${cyan(a.name)} is ${green(times)}x faster than ${cyan(b.name)} running for ${yellow(
                locale(a.seconds),
            )} second${a.seconds === 1 ? "" : "s"}`,
        );
    } else if (a.runs < b.runs) {
        const times = locale(b.runs / a.runs);
        console.log(
            `${cyan(a.name)} is ${red(times)}x slower than ${cyan(b.name)} running for ${yellow(
                locale(a.seconds),
            )} second${a.seconds === 1 ? "" : "s"}`,
        );
    } else {
        console.log(
            `${cyan(a.name)} and ${cyan(b.name)} are the same speed running for ${yellow(
                locale(a.seconds),
            )} second${a.seconds === 1 ? "" : "s"}`,
        );
    }
}

function locale(num: number) {
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** converts nanoseconds to the largest possible unit */
function convertNanos(nanos: number): string {
    const units = [
        { unit: "μs", factor: 1000 },
        { unit: "ms", factor: 1000000 },
        { unit: "s", factor: 1000000000 },
    ];
    let _unit = "ns";
    let _value = nanos;
    for (const { unit, factor } of units) {
        if (nanos < factor) break;
        _unit = unit;
        _value = nanos / factor;
    }
    return `${_value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${_unit}`;
}

function green(str: string) {
    return `\x1b[32m${str}\x1b[0m`;
}

function red(str: string) {
    return `\x1b[31m${str}\x1b[0m`;
}

function cyan(str: string) {
    return `\x1b[36m${str}\x1b[0m`;
}

function yellow(str: string) {
    return `\x1b[33m${str}\x1b[0m`;
}
