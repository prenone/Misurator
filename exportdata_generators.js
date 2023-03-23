function measurementsToArray(measurements) {
    return measurements.map(el => Number(el.measure));
}

export function generateNumpyArray(measurements) {
    const measures = measurementsToArray(measurements);

    let numpy_code = "measures = np.array([\n"
    if (measures.length > 0) {
        numpy_code += measures.reduce((acc, val, i) =>
            acc + (i > 0 && i % 5 === 0 ? ",\n" : (i > 0 ? ", " : "")) + val
        );
    }
    numpy_code += "\n])"

    return numpy_code;
}

export function generateSemicolonSeparated(measurements) {
    const measures = measurementsToArray(measurements);

    return measures.join(";");
}

export function generateCSV(measurements) {
    const measures = measurementsToArray(measurements);

    return measures.join("\n");
}