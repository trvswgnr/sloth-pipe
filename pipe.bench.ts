import { run, bench, group, baseline, type Report } from "mitata";
import { Pipe } from "./pipe";
import { unlink } from "fs/promises";

process.on("SIGINT", () => {
    console.log("Ctrl-C was pressed");
    process.exit();
});

const { filepath, Pipe: OldPipe } = await setup();

const options = {};
run(options).then(after);

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

async function setup() {
    const filepath = "./old-pipe.ts";
    const Pipe = await getOldPipe(filepath);
    return { filepath, Pipe };
}

async function cleanup() {
    await unlink(filepath).catch(() => {});
}

async function after(report: Report) {
    console.log();

    await cleanup();

    const groups: any = {};
    report.benchmarks.forEach((b) => {
        const key = b.group;
        if (!key) return;
        groups[key] ??= [];
        if (b.name === "Native Promise") return;
        groups[key].push({ name: b.name, avg: b.stats?.avg });
    });

    // get the fastest benchmark in each group
    const fastest = Object.entries(groups).map(([key, _avgs]) => {
        const avgs = _avgs as { name: string; avg: number }[];
        const fastest = avgs.reduce((a, b) => (a.avg < b.avg ? a : b));
        return { group: key, ...fastest };
    });

    let isSlower = false;
    for (const { group, name } of fastest) {
        if (name !== "new Pipe") {
            console.log(`new Pipe is not faster than ${name} in ${group}`);
            isSlower = true;
        }
    }

    if (isSlower) {
        process.exit(1);
    } else {
        console.log("new Pipe is faster than old Pipe in all benchmarks");
        process.exit(0);
    }
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
