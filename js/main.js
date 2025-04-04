let numInputs = 2;
let gates = [{ type: "AND" }, { type: "AND" }, { type: "OR" }]; // Circuito base
let negateOutput = false;

function generateTruthTable() {
    numInputs = parseInt(document.getElementById("numInputs").value);
    if (numInputs < 2 || numInputs > 4) {
        alert("El número de entradas debe estar entre 2 y 4.");
        return;
    }

    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("tableBody");
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    // Generar encabezados de la tabla
    let headerRow = "<tr>";
    for (let i = 0; i < numInputs; i++) {
        headerRow += `<th>Entrada ${String.fromCharCode(65 + i)}</th>`;
    }
    headerRow += "<th>Salida</th></tr>";
    tableHead.innerHTML = headerRow;

    // Generar filas (2^numInputs)
    const rows = Math.pow(2, numInputs);
    for (let i = 0; i < rows; i++) {
        let row = "<tr>";
        const inputs = [];
        for (let j = numInputs - 1; j >= 0; j--) {
            const bit = (i >> j) & 1;
            inputs.push(bit);
            row += `<td>${bit}</td>`;
        }
        const output = evaluateCircuit(inputs);
        row += `<td>${output}</td></tr>`;
        tableBody.innerHTML += row;
    }
}

function evaluateCircuit(inputs) {
    // Evaluar circuito base: (A AND B) OR (C AND D)
    let result1 = gates[0].type === "AND" ? (inputs[0] && inputs[1]) : evaluateGate(gates[0].type, inputs[0], inputs[1]);
    let result2 = numInputs > 2 ? (gates[1].type === "AND" ? (inputs[2] && (numInputs === 4 ? inputs[3] : 1)) : evaluateGate(gates[1].type, inputs[2], numInputs === 4 ? inputs[3] : 1)) : 0;
    let finalResult = gates[2].type === "OR" ? (result1 || result2) : evaluateGate(gates[2].type, result1, result2);

    // Aplicar negación si está activada
    if (negateOutput) finalResult = !finalResult;

    // Mostrar operación y salida
    document.getElementById("operation").innerText = `Operación: (${inputs[0]} ${gates[0].type} ${inputs[1]}) ${gates[2].type} (${numInputs > 2 ? inputs[2] : 0} ${gates[1].type} ${numInputs === 4 ? inputs[3] : 1}) ${negateOutput ? "NOT" : ""}`;
    document.getElementById("output").innerText = `Salida: ${finalResult ? 1 : 0}`;
    return finalResult ? 1 : 0;
}

function evaluateGate(type, a, b) {
    switch (type) {
        case "AND": return a && b;
        case "OR": return a || b;
        case "XOR": return (a !== b) ? 1 : 0;
        case "NAND": return !(a && b);
        case "NOR": return !(a || b);
        case "XNOR": return (a === b) ? 1 : 0;
        case "NOT": return !a;
        default: return 0;
    }
}

function addGate() {
    const gateType = prompt("Tipo de compuerta (AND, OR, XOR, NAND, NOR, XNOR, NOT):").toUpperCase();
    if (["AND", "OR", "XOR", "NAND", "NOR", "XNOR", "NOT"].includes(gateType)) {
        gates.push({ type: gateType });
        const circuitDiv = document.getElementById("circuit");
        circuitDiv.innerHTML += `<div class="gate" data-type="${gateType}">${gateType}</div>`;
        generateTruthTable();
    } else {
        alert("Compuerta no válida.");
    }
}

function toggleNegation() {
    negateOutput = !negateOutput;
    generateTruthTable();
}

// Generar tabla inicial al cargar la página
generateTruthTable();