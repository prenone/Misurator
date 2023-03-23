import { measurementsToArray } from "./exportdata_generators.js";

export function calculateAverage(measurements) {
    const measures = measurementsToArray(measurements);
    return measures.reduce((acc, val) => acc + val, 0) / measurements.length;
}