import { run, bench, group, baseline } from "mitata";
import { Pipe } from "./pipe";

const exampleFn1 = (x: number) => x + 1;
const exampleFn2 = (x: number) => x + 2;

bench("Pipe with sync function", () => {
    Pipe(0).to(exampleFn1).to(exampleFn2).exec();
});

group("Comparison between Pipe and Native Promise", () => {
    baseline("Native Promise", async () => {
        await Promise.resolve(0)
            .then((x) => x + 1)
            .then((x) => x + 1);
    });
    bench("Pipe with async function", async () => {
        await Pipe(Promise.resolve(0))
            .to(async (x) => (await x) + 1)
            .to(async (x) => (await x) + 1)
            .exec();
    });
});

run().then(() => console.log("done"));
