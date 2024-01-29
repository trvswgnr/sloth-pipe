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

group("compare to libs with async functions", () => {
    baseline("Sloth Pipe", async () => {
        await SlothPipe(Promise.resolve(0))
            .to(async (x) => (await x) + 1)
            .to(async (x) => (await x) + 1)
            .exec();
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
