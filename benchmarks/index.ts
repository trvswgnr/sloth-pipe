import { group, bench, baseline, run } from "mitata";
import { pipe as EffectPipe } from "effect";
import { Pipe as SlothPipe } from "../pipe";

const exampleFn1 = (x: number) => x + 1;
const exampleFn2 = (x: number) => x + 2;
const spipe = SlothPipe(0).to(exampleFn1).to(exampleFn2);

group("compare vs libs with sync functions", () => {
    baseline("Sloth Pipe", () => {
        spipe.exec();
    });
    bench("Effect Pipe", () => {
        EffectPipe(0, exampleFn1, exampleFn2);
    });
});

const asyncSpipe = SlothPipe(Promise.resolve(0))
    .to(async (x) => (await x) + 1)
    .to(async (x) => (await x) + 1);
group("compare to libs with async functions", () => {
    baseline("Sloth Pipe", async () => {
        await asyncSpipe.exec();
    });
    bench("Effect Pipe", async () => {
        await EffectPipe(
            Promise.resolve(0),
            async (x) => (await x) + 1,
            async (x) => (await x) + 1,
        );
    });
    bench("Native Promise", async () => {
        await Promise.resolve(0)
            .then((x) => x + 1)
            .then((x) => x + 1);
    });
});

await run();

// some extra micro benchmarks:
const spipe2 = SlothPipe(0).to(exampleFn1).to(exampleFn2);
printMicroDiff(
    microBench("Sloth Pipe", 1000000, () => spipe2.exec()),
    microBench("Effect Pipe", 1000000, () => EffectPipe(0, exampleFn1, exampleFn2)),
);

const spipe3 = SlothPipe(0).to(exampleFn1).to(exampleFn2);
printMicroDiff(
    microBench("Sloth Pipe", 1000000, () => spipe3.exec()),
    microBench("Effect Pipe", 1000000, () => EffectPipe(0, exampleFn1, exampleFn2)),
);

printTimeDiff(
    timeBench("Sloth Pipe", 1, () => spipe.exec()),
    timeBench("Effect Pipe", 1, () => EffectPipe(0, exampleFn1, exampleFn2)),
);

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
    console.log(`${a.name}: ${locale(a.avg)}ns`);
    console.log(`${b.name}: ${locale(b.avg)}ns`);
    if (a.avg < b.avg) {
        const times = (b.avg / a.avg).toLocaleString("en-US", { maximumFractionDigits: 2 });
        console.log(`${a.name} is ${times}x faster than ${b.name}`);
    } else if (a.avg > b.avg) {
        const times = (a.avg / b.avg).toLocaleString("en-US", { maximumFractionDigits: 2 });
        console.log(`${b.name} is ${times}x faster than ${a.name}`);
    } else {
        console.log(`${a.name} and ${b.name} are the same speed`);
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
    console.log(`${a.name}: ${locale(a.runs)} runs in ${a.seconds} seconds`);
    console.log(`${b.name}: ${locale(b.runs)} runs in ${b.seconds} seconds`);
    if (a.runs > b.runs) {
        const times = (a.runs / b.runs).toLocaleString("en-US", { maximumFractionDigits: 2 });
        console.log(`${a.name} is ${times}x faster than ${b.name}`);
    } else if (a.runs < b.runs) {
        const times = (b.runs / a.runs).toLocaleString("en-US", { maximumFractionDigits: 2 });
        console.log(`${b.name} is ${times}x faster than ${a.name}`);
    } else {
        console.log(`${a.name} and ${b.name} are the same speed`);
    }
}

function locale(nanoseconds: number): string {
    return nanoseconds.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
