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
    const child = Bun.spawn(["git", "show", "main:pipe.ts"], { stdout: "pipe" });
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
