 // Variables globales
 let numInputs = 4; // Fijo a 4 entradas
 let activeComponent = null;
 let mode = 'move';
 let gates = [];
 let connections = [];
 let inputs = [];
 let outputs = [];
 let selectedInput = null;
 let selectedOutput = null;
 let nextId = 1;
 let dragging = false;
 let draggedElement = null;
 let dragOffsetX = 0;
 let dragOffsetY = 0;

 // Inicialización
 function init() {
     setupInitialCircuit();
     generateTruthTable();
     renderCircuit();
     evaluateCircuit(); // Esto debe ejecutarse correctamente al cargar
     setActiveComponent('AND');
     setMode('move');
 }

 // Configurar circuito inicial
 function setupInitialCircuit() {
     const container = document.getElementById('circuit-container');
     const width = container.clientWidth;
     const height = container.clientHeight;

     // Crear 4 entradas
     inputs = [];
     for (let i = 0; i < numInputs; i++) {
         const inputNode = {
             id: `input-${i}`,
             label: String.fromCharCode(65 + i), // A, B, C, D
             x: 50,
             y: 50 + i * 80,
             type: 'input',
             outputs: [{
                 id: `input-${i}-out`,
                 x: 80,
                 y: 50 + i * 80,
                 connected: false,
                 negated: false
             }]
         };
         inputs.push(inputNode);
     }

     // Crear puerta AND1 (para A y B)
     const andGate1 = {
         id: `gate-${nextId++}`,
         type: 'AND',
         x: 200,
         y: 80,
         inputs: [
             { id: `gate-${nextId - 1}-in-0`, x: 200, y: 70, connected: false, negated: false },
             { id: `gate-${nextId - 1}-in-1`, x: 200, y: 90, connected: false, negated: false }
         ],
         output: { id: `gate-${nextId - 1}-out`, x: 260, y: 80, connected: false, negated: false }
     };

     // Crear puerta AND2 (para C y D)
     const andGate2 = {
         id: `gate-${nextId++}`,
         type: 'AND',
         x: 200,
         y: 180,
         inputs: [
             { id: `gate-${nextId - 1}-in-0`, x: 200, y: 170, connected: false, negated: false },
             { id: `gate-${nextId - 1}-in-1`, x: 200, y: 190, connected: false, negated: false }
         ],
         output: { id: `gate-${nextId - 1}-out`, x: 260, y: 180, connected: false, negated: false }
     };

     // Crear puerta OR (para la salida)
     const orGate = {
         id: `gate-${nextId++}`,
         type: 'OR',
         x: 350,
         y: 130,
         inputs: [
             { id: `gate-${nextId - 1}-in-0`, x: 350, y: 120, connected: false, negated: false },
             { id: `gate-${nextId - 1}-in-1`, x: 350, y: 140, connected: false, negated: false }
         ],
         output: { id: `gate-${nextId - 1}-out`, x: 410, y: 130, connected: false, negated: false }
     };

     gates = [andGate1, andGate2, orGate];

     // Crear una salida
     outputs = [{
         id: 'output-0',
         label: 'S',
         x: 500,
         y: 130,
         type: 'output',
         inputs: [{
             id: 'output-0-in',
             x: 470,
             y: 130,
             connected: false,
             negated: false
         }]
     }];

     // Establecer conexiones
     connections = [
         // A a AND1
         { sourceId: 'input-0-out', targetId: 'gate-1-in-0' },
         // B a AND1
         { sourceId: 'input-1-out', targetId: 'gate-1-in-1' },
         // C a AND2
         { sourceId: 'input-2-out', targetId: 'gate-2-in-0' },
         // D a AND2
         { sourceId: 'input-3-out', targetId: 'gate-2-in-1' },
         // AND1 a OR
         { sourceId: 'gate-1-out', targetId: 'gate-3-in-0' },
         // AND2 a OR
         { sourceId: 'gate-2-out', targetId: 'gate-3-in-1' },
         // OR a salida
         { sourceId: 'gate-3-out', targetId: 'output-0-in' }
     ];

     renderCircuit();
 }

 // Renderizar circuito
 function renderCircuit() {
     const container = document.getElementById('circuit-container');
     container.innerHTML = '';

     // Renderizar entradas
     inputs.forEach(input => {
         const inputElement = document.createElement('div');
         inputElement.className = 'gate input-node';
         inputElement.style.left = `${input.x}px`;
         inputElement.style.top = `${input.y}px`;
         inputElement.textContent = input.label;
         inputElement.dataset.id = input.id;
         inputElement.dataset.type = 'input';

         // Añadir punto de salida
         const outputPoint = document.createElement('div');
         outputPoint.className = 'connection-point output';
         outputPoint.dataset.id = input.outputs[0].id;
         outputPoint.dataset.parentId = input.id;
         if (input.outputs[0].negated) {
             outputPoint.classList.add('negated');
         }
         outputPoint.addEventListener('click', function (e) {
             e.stopPropagation();
             handleConnectionPointClick(input.outputs[0], this);
         });

         inputElement.appendChild(outputPoint);
         inputElement.addEventListener('mousedown', function (e) {
             handleElementDrag(e, input);
         });

         container.appendChild(inputElement);
     });

     // Renderizar salidas
     outputs.forEach(output => {
         const outputElement = document.createElement('div');
         outputElement.className = 'gate output-node';
         outputElement.style.left = `${output.x}px`;
         outputElement.style.top = `${output.y}px`;
         outputElement.textContent = output.label;
         outputElement.dataset.id = output.id;
         outputElement.dataset.type = 'output';

         // Añadir punto de entrada
         const inputPoint = document.createElement('div');
         inputPoint.className = 'connection-point input';
         inputPoint.dataset.id = output.inputs[0].id;
         inputPoint.dataset.parentId = output.id;
         if (output.inputs[0].negated) {
             inputPoint.classList.add('negated');
         }
         inputPoint.addEventListener('click', function (e) {
             e.stopPropagation();
             handleConnectionPointClick(output.inputs[0], this, true);
         });

         outputElement.appendChild(inputPoint);
         outputElement.addEventListener('mousedown', function (e) {
             handleElementDrag(e, output);
         });

         container.appendChild(outputElement);
     });

     // Renderizar compuertas
     gates.forEach(gate => {
         const gateElement = document.createElement('div');
         gateElement.className = `gate ${gate.type.toLowerCase()}-gate`;
         gateElement.style.left = `${gate.x}px`;
         gateElement.style.top = `${gate.y}px`;
         gateElement.textContent = gate.type;
         gateElement.dataset.id = gate.id;
         gateElement.dataset.type = 'gate';

         // Añadir puntos de entrada
         gate.inputs.forEach((input, index) => {
             const inputPoint = document.createElement('div');
             inputPoint.className = 'connection-point input';
             inputPoint.style.top = `${5 + index * 30}px`;
             inputPoint.dataset.id = input.id;
             inputPoint.dataset.parentId = gate.id;
             if (input.negated) {
                 inputPoint.classList.add('negated');
             }
             inputPoint.addEventListener('click', function (e) {
                 e.stopPropagation();
                 handleConnectionPointClick(input, this, true);
             });
             gateElement.appendChild(inputPoint);
         });

         // Añadir punto de salida
         const outputPoint = document.createElement('div');
         outputPoint.className = 'connection-point output';
         outputPoint.style.top = `${gate.inputs.length > 1 ? 20 : 10}px`;
         outputPoint.dataset.id = gate.output.id;
         outputPoint.dataset.parentId = gate.id;
         if (gate.output.negated) {
             outputPoint.classList.add('negated');
         }
         outputPoint.addEventListener('click', function (e) {
             e.stopPropagation();
             handleConnectionPointClick(gate.output, this);
         });
         gateElement.appendChild(outputPoint);

         // Añadir manejador para eliminar/mover
         gateElement.addEventListener('click', function () {
             if (mode === 'delete') {
                 deleteGate(gate.id);
             }
         });

         gateElement.addEventListener('mousedown', function (e) {
             handleElementDrag(e, gate);
         });

         container.appendChild(gateElement);
     });

     // Renderizar conexiones
     connections.forEach(conn => {
         drawConnection(conn.sourceId, conn.targetId);
     });
 }

 // Manejar clic en punto de conexión
 function handleConnectionPointClick(point, element, isInput = false) {
     if (mode === 'connect') {
         if (isInput) {
             // Este es un punto de entrada
             if (selectedOutput && !selectedInput) {
                 selectedInput = point;
                 element.style.backgroundColor = '#00ff00';
                 connectNodes();
             }
         } else {
             // Este es un punto de salida
             if (!selectedOutput) {
                 selectedOutput = point;
                 element.style.backgroundColor = '#ff0000';
             }
         }
     } else if (mode === 'negate') {
         point.negated = !point.negated;
         renderCircuit();
         evaluateCircuit();
     }
 }

 // Manejar arrastre de elemento
 function handleElementDrag(e, obj) {
     if (mode === 'move') {
         dragging = true;
         draggedElement = obj;
         const element = e.currentTarget;
         dragOffsetX = e.clientX - parseInt(element.style.left);
         dragOffsetY = e.clientY - parseInt(element.style.top);

         e.preventDefault();
     }
 }

 // Añadir compuerta
 function addGate(type, x, y) {
     const container = document.getElementById('circuit-container');

     if (!x) x = container.clientWidth / 2;
     if (!y) y = container.clientHeight / 2;

     // Configurar el número de entradas según el tipo
     let inputCount = 2; // Valor por defecto
     if (type === 'NOT') {
         inputCount = 1;
     } else if (type === 'OR' || type === 'AND') {
         // Permitir más entradas para OR y AND
         inputCount = 2; // Puedes ajustar esto según tus necesidades
     }

     const gate = {
         id: `gate-${nextId++}`,
         type: type,
         x: x,
         y: y,
         inputs: [],
         output: { id: `gate-${nextId - 1}-out`, x: x + 60, y: y + 20, connected: false, negated: false }
     };

     // Crear entradas según el tipo
     for (let i = 0; i < inputCount; i++) {
         gate.inputs.push({
             id: `gate-${nextId - 1}-in-${i}`,
             x: x,
             y: y + (10 + i * (40 / inputCount)),
             connected: false,
             negated: false
         });
     }

     gates.push(gate);
     renderCircuit();
     evaluateCircuit();
 }

 // Eliminar compuerta
 function deleteGate(id) {
     // Eliminar conexiones relacionadas
     connections = connections.filter(conn => {
         const sourceParentId = getParentIdFromNodeId(conn.sourceId);
         const targetParentId = getParentIdFromNodeId(conn.targetId);
         return sourceParentId !== id && targetParentId !== id;
     });

     // Eliminar la compuerta
     gates = gates.filter(gate => gate.id !== id);

     renderCircuit();
     evaluateCircuit();
     updateMessageBox(`Compuerta eliminada`);
 }

 // Obtener id del padre desde el id del nodo
 function getParentIdFromNodeId(nodeId) {
     if (nodeId.includes('-in-') || nodeId.includes('-out')) {
         return nodeId.split('-in-')[0].split('-out')[0];
     }
     return nodeId;
 }

 // Dibujar conexión
 function drawConnection(sourceId, targetId) {
     const container = document.getElementById('circuit-container');
     const sourceElement = document.querySelector(`[data-id="${sourceId}"]`);
     const targetElement = document.querySelector(`[data-id="${targetId}"]`);

     if (!sourceElement || !targetElement) return;

     // Determinar posiciones exactas
     const sourceParent = sourceElement.parentElement;
     const targetParent = targetElement.parentElement;

     const sourceX = parseInt(sourceParent.style.left) + sourceElement.offsetLeft + sourceElement.offsetWidth;
     const sourceY = parseInt(sourceParent.style.top) + sourceElement.offsetTop + (sourceElement.offsetHeight / 2);
     const targetX = parseInt(targetParent.style.left) + targetElement.offsetLeft;
     const targetY = parseInt(targetParent.style.top) + targetElement.offsetTop + (targetElement.offsetHeight / 2);

     // Punto medio para curva
     const midX = (sourceX + targetX) / 2;

     // Línea horizontal desde fuente al punto medio
     const line1 = document.createElement('div');
     line1.className = 'connection';
     line1.style.left = `${sourceX}px`;
     line1.style.top = `${sourceY}px`;
     line1.style.width = `${midX - sourceX}px`;
     container.appendChild(line1);

     // Línea vertical en el punto medio
     const line2 = document.createElement('div');
     line2.className = 'connection vertical';
     line2.style.left = `${midX}px`;
     line2.style.top = `${Math.min(sourceY, targetY)}px`;
     line2.style.height = `${Math.abs(targetY - sourceY)}px`;
     container.appendChild(line2);

     // Línea horizontal desde punto medio hasta destino
     const line3 = document.createElement('div');
     line3.className = 'connection';
     line3.style.left = `${midX}px`;
     line3.style.top = `${targetY}px`;
     line3.style.width = `${targetX - midX}px`;
     container.appendChild(line3);
 }

 // Conectar nodos
 function connectNodes() {
     if (selectedOutput && selectedInput) {
         // Verificar si el destino ya está conectado
         const existingConn = connections.find(conn => conn.targetId === selectedInput.id);
         if (existingConn) {
             connections = connections.filter(conn => conn.targetId !== selectedInput.id);
         }

         // Añadir nueva conexión
         connections.push({
             sourceId: selectedOutput.id,
             targetId: selectedInput.id
         });

         // Marcar como conectados
         selectedOutput.connected = true;
         selectedInput.connected = true;

         updateMessageBox(`Conexión establecida`);

         // Limpiar selección
         const outputElement = document.querySelector(`[data-id="${selectedOutput.id}"]`);
         const inputElement = document.querySelector(`[data-id="${selectedInput.id}"]`);

         if (outputElement) outputElement.style.backgroundColor = '';
         if (inputElement) inputElement.style.backgroundColor = '';

         selectedOutput = null;
         selectedInput = null;

         renderCircuit();
         evaluateCircuit(); // Asegurarse de que esto se llama
     }
 }

 // Establecer componente activo
 function setActiveComponent(type) {
     activeComponent = type;
     document.querySelectorAll('.component').forEach(comp => {
         comp.classList.remove('selected');
     });

     // Encontrar y seleccionar el componente correcto
     const components = document.querySelectorAll('.component');
     for (let i = 0; i < components.length; i++) {
         if (components[i].textContent === type) {
             components[i].classList.add('selected');
             break;
         }
     }

     updateMessageBox(`Componente ${type} seleccionado`);
 }

 // Establecer modo
 function setMode(newMode) {
     mode = newMode;

     // Limpiar selección de conexiones
     if (selectedOutput) {
         const elem = document.querySelector(`[data-id="${selectedOutput.id}"]`);
         if (elem) elem.style.backgroundColor = '';
         selectedOutput = null;
     }

     if (selectedInput) {
         const elem = document.querySelector(`[data-id="${selectedInput.id}"]`);
         if (elem) elem.style.backgroundColor = '';
         selectedInput = null;
     }

     // Configurar eventos según el modo
     const container = document.getElementById('circuit-container');

     if (mode === 'add') {
         if (!activeComponent) {
             setActiveComponent('AND');
         }

         container.onclick = function (e) {
             if (e.target === container) {
                 const rect = container.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 const y = e.clientY - rect.top;
                 addGate(activeComponent, x, y);
                 updateMessageBox(`Compuerta ${activeComponent} añadida`);
                 evaluateCircuit();
             }
         };
     } else {
         container.onclick = null;
     }

     let modeText = '';
     switch (mode) {
         case 'add': modeText = 'Añadir compuertas'; break;
         case 'connect': modeText = 'Conectar puntos (haz clic en una salida y luego en una entrada)'; break;
         case 'negate': modeText = 'Negar conexiones (haz clic en un punto de conexión)'; break;
         case 'delete': modeText = 'Eliminar compuertas (haz clic en una compuerta)'; break;
         case 'move': modeText = 'Mover elementos (arrastra los elementos)'; break;
     }

     updateMessageBox(modeText);
 }

 // Actualizar caja de mensajes
 function updateMessageBox(message) {
     document.getElementById('message-box').textContent = message;
 }

 // Generar tabla de verdad
 function generateTruthTable() {
     const tableHead = document.getElementById('table-head');
     const tableBody = document.getElementById('table-body');
     tableHead.innerHTML = '';
     tableBody.innerHTML = '';

     // Generar encabezados de la tabla
     let headerRow = "<tr>";
     for (let i = 0; i < numInputs; i++) {
         headerRow += `<th>${String.fromCharCode(65 + i)}</th>`;
     }
     headerRow += "<th>Salida</th></tr>";
     tableHead.innerHTML = headerRow;

     // Generar filas (2^numInputs)
     const rows = Math.pow(2, numInputs);
     for (let i = 0; i < rows; i++) {
         let row = "<tr>";
         for (let j = 0; j < numInputs; j++) {
             const bit = (i >> (numInputs - j - 1)) & 1;
             row += `<td>${bit}</td>`;
         }
         row += `<td id="output-row-${i}">-</td></tr>`;
         tableBody.innerHTML += row;
     }
 }

 // Función para evaluar el circuito
 function evaluateCircuit() {
     // Crear grafo del circuito
     const nodes = {};

     // Añadir entradas
     inputs.forEach((input, i) => {
         nodes[input.outputs[0].id] = {
             type: 'input',
             label: input.label,
             negated: input.outputs[0].negated,
             value: null,
             index: i
         };
     });

     // Añadir compuertas
     gates.forEach(gate => {
         nodes[gate.output.id] = {
             type: 'gate',
             gateType: gate.type,
             inputs: gate.inputs.map(input => ({
                 id: input.id,
                 negated: input.negated,
                 sourceId: null // Se llenará después
             })),
             negated: gate.output.negated,
             value: null
         };
     });

     // Añadir salida si existe
     if (outputs.length > 0) {
         nodes['output'] = {
             type: 'output',
             sourceId: null,
             negated: outputs[0].inputs[0].negated,
             value: null
         };
     }

     // Establecer las conexiones
     connections.forEach(conn => {
         // Conectar entradas de compuertas
         gates.forEach(gate => {
             gate.inputs.forEach((input, index) => {
                 if (input.id === conn.targetId && nodes[gate.output.id]) {
                     nodes[gate.output.id].inputs[index].sourceId = conn.sourceId;
                 }
             });
         });

         // Conectar salida
         if (outputs.length > 0 && conn.targetId === outputs[0].inputs[0].id) {
             nodes['output'].sourceId = conn.sourceId;
         }
     });

     // Función para evaluar la operación lógica
     function evaluateGate(gateType, inputs) {
         switch (gateType) {
             case 'AND':
                 return inputs.every(val => val === 1) ? 1 : 0;
             case 'OR':
                 return inputs.some(val => val === 1) ? 1 : 0;
             case 'NOT':
                 return inputs[0] === 1 ? 0 : 1;
             case 'NAND':
                 return inputs.every(val => val === 1) ? 0 : 1;
             case 'NOR':
                 return inputs.some(val => val === 1) ? 0 : 1;
             case 'XOR':
                 return inputs.filter(val => val === 1).length % 2 === 1 ? 1 : 0;
             default:
                 return 0;
         }
     }

     // Evaluar para todas las combinaciones posibles de entrada
     const rows = Math.pow(2, numInputs);
     let equationString = '';
     let operationString = '';

     for (let i = 0; i < rows; i++) {
         // Establecer valores de entrada para esta combinación
         for (let j = 0; j < numInputs; j++) {
             const bitValue = (i >> (numInputs - j - 1)) & 1;
             const inputId = inputs[j].outputs[0].id;
             nodes[inputId].value = bitValue;
         }

         // Propagar los valores a través del circuito (simulación)
         let changed = true;
         while (changed) {
             changed = false;

             // Evaluar cada compuerta
             gates.forEach(gate => {
                 const gateNode = nodes[gate.output.id];
                 if (!gateNode) return; // Saltar si la compuerta no existe en el grafo

                 // Verificar si todas las entradas tienen valor
                 const inputValues = [];
                 let allInputsHaveValue = true;

                 for (let j = 0; j < gateNode.inputs.length; j++) {
                     const input = gateNode.inputs[j];
                     if (!input.sourceId || !nodes[input.sourceId]) {
                         allInputsHaveValue = false;
                         break;
                     }

                     let value = nodes[input.sourceId].value;
                     if (value === null) {
                         allInputsHaveValue = false;
                         break;
                     }

                     // Aplicar negación si es necesario
                     if (input.negated) {
                         value = value === 1 ? 0 : 1;
                     }

                     inputValues.push(value);
                 }

                 if (allInputsHaveValue) {
                     // Evaluar la compuerta
                     const result = evaluateGate(gateNode.gateType, inputValues);
                     // Aplicar negación de salida si es necesario
                     const finalResult = gateNode.negated ? (result === 1 ? 0 : 1) : result;

                     if (gateNode.value !== finalResult) {
                         gateNode.value = finalResult;
                         changed = true;
                     }
                 }
             });

             // Evaluar la salida
             if (nodes['output'] && nodes['output'].sourceId && nodes[nodes['output'].sourceId]) {
                 let outputValue = nodes[nodes['output'].sourceId].value;
                 if (outputValue !== null) {
                     // Aplicar negación si es necesario
                     if (nodes['output'].negated) {
                         outputValue = outputValue === 1 ? 0 : 1;
                     }
                     nodes['output'].value = outputValue;
                 }
             }
         }

         // Actualizar la tabla de verdad con el resultado
         const outputValue = nodes['output'] ? nodes['output'].value : null;
         const outputCell = document.getElementById(`output-row-${i}`);
         if (outputCell) {
             outputCell.textContent = outputValue !== null ? outputValue : '-';
         }

         // Construir ecuación booleana y descripción de operación
         if (i === 0) {
             equationString = deriveEquation(nodes);
             operationString = describeOperation(nodes);
         }
     }

     // Actualizar elementos de resultado
     document.querySelector('#equation span').textContent = equationString;
     document.querySelector('#operation span').textContent = operationString;

     // Mostrar el resultado actual (basado en la primera combinación)
     const currentResult = nodes['output'] ? nodes['output'].value : null;
     const resultElement = document.querySelector('#current-result span');
     if (resultElement) {
         resultElement.textContent = currentResult !== null ? currentResult : '-';
         resultElement.style.color = currentResult === 1 ? '#00ff00' : '#ff0000';
         resultElement.style.fontWeight = 'bold';
         resultElement.style.fontSize = '1.2em';
     }
 }

 // Derivar la ecuación booleana
 function deriveEquation(nodes) {
     // Si no hay nodos o no hay salida definida, retornar mensaje
     if (!nodes['output'] || !nodes['output'].sourceId) {
         return "Circuito incompleto";
     }

     function getNodeExpression(nodeId, visited = new Set()) {
         // Evitar ciclos infinitos
         if (visited.has(nodeId)) {
             return "Error: Ciclo detectado";
         }
         visited.add(nodeId);

         const node = nodes[nodeId];
         if (!node) return "?";

         if (node.type === 'input') {
             let expr = node.label;
             if (node.negated) expr = "¬" + expr;
             return expr;
         } else if (node.type === 'gate') {
             // Obtener expresiones para cada entrada
             const inputExpressions = [];
             for (const input of node.inputs) {
                 if (!input.sourceId) continue;
                 let expr = getNodeExpression(input.sourceId, new Set(visited));
                 if (input.negated) expr = "¬(" + expr + ")";
                 inputExpressions.push(expr);
             }

             if (inputExpressions.length === 0) return "?";

             // Formatear según el tipo de compuerta
             let expr = "";
             switch (node.gateType) {
                 case 'AND':
                     expr = inputExpressions.join(" ∧ ");
                     if (inputExpressions.length > 1) expr = "(" + expr + ")";
                     break;
                 case 'OR':
                     expr = inputExpressions.join(" ∨ ");
                     if (inputExpressions.length > 1) expr = "(" + expr + ")";
                     break;
                 case 'NOT':
                     expr = "¬" + inputExpressions[0];
                     break;
                 case 'NAND':
                     expr = inputExpressions.join(" ∧ ");
                     if (inputExpressions.length > 1) expr = "¬(" + expr + ")";
                     else expr = "¬" + expr;
                     break;
                 case 'NOR':
                     expr = inputExpressions.join(" ∨ ");
                     if (inputExpressions.length > 1) expr = "¬(" + expr + ")";
                     else expr = "¬" + expr;
                     break;
                 case 'XOR':
                     expr = inputExpressions.join(" ⊕ ");
                     if (inputExpressions.length > 1) expr = "(" + expr + ")";
                     break;
                 default:
                     expr = "?";
             }

             if (node.negated) expr = "¬(" + expr + ")";
             return expr;
         }

         return "?";
     }

     // Obtener expresión para la salida
     let equation = "S = ";
     if (nodes['output'].sourceId) {
         let expr = getNodeExpression(nodes['output'].sourceId);
         if (nodes['output'].negated) expr = "¬(" + expr + ")";
         equation += expr;
     } else {
         equation += "?";
     }

     return equation;
 }

 // Describir la operación en lenguaje natural
 function describeOperation(nodes) {
     // Si no hay nodos o no hay salida definida, retornar mensaje
     if (!nodes['output'] || !nodes['output'].sourceId) {
         return "Circuito incompleto";
     }

     function getNodeDescription(nodeId, visited = new Set()) {
         // Evitar ciclos infinitos
         if (visited.has(nodeId)) {
             return "Error: Ciclo detectado";
         }
         visited.add(nodeId);

         const node = nodes[nodeId];
         if (!node) return "desconocido";

         // Para entradas, simplemente devolver su nombre
         if (node.type === 'input') {
             let desc = `la entrada ${node.label}`;
             if (node.negated) desc = `la negación de ${desc}`;
             return desc;
         } else if (node.type === 'gate') {
             // Obtener descripciones para cada entrada
             const inputDescs = [];
             for (const input of node.inputs) {
                 if (!input.sourceId) continue;
                 let desc = getNodeDescription(input.sourceId, new Set(visited));
                 if (input.negated) desc = `la negación de ${desc}`;
                 inputDescs.push(desc);
             }

             if (inputDescs.length === 0) return "una operación sin entradas";

             // Formatear según el tipo de compuerta
             let desc = "";
             switch (node.gateType) {
                 case 'AND':
                     desc = `la operación AND entre ${inputDescs.join(" y ")}`;
                     break;
                 case 'OR':
                     desc = `la operación OR entre ${inputDescs.join(" y ")}`;
                     break;
                 case 'NOT':
                     desc = `la negación de ${inputDescs[0]}`;
                     break;
                 case 'NAND':
                     desc = `la operación NAND entre ${inputDescs.join(" y ")}`;
                     break;
                 case 'NOR':
                     desc = `la operación NOR entre ${inputDescs.join(" y ")}`;
                     break;
                 case 'XOR':
                     desc = `la operación XOR entre ${inputDescs.join(" y ")}`;
                     break;
                 default:
                     desc = "una operación desconocida";
             }

             if (node.negated) desc = `la negación de ${desc}`;
             return desc;
         }

         return "desconocido";
     }

     // Obtener descripción para la salida
     let operation = "La salida es ";
     if (nodes['output'].sourceId) {
         let desc = getNodeDescription(nodes['output'].sourceId);
         if (nodes['output'].negated) desc = `la negación de ${desc}`;
         operation += desc;
     } else {
         operation += "indefinida";
     }

     return operation;
 }

 // Eventos del ratón para mover elementos
 document.addEventListener('mousemove', function (e) {
     if (dragging && draggedElement && mode === 'move') {
         const container = document.getElementById('circuit-container');
         const rect = container.getBoundingClientRect();
         const x = e.clientX - rect.left - dragOffsetX;
         const y = e.clientY - rect.top - dragOffsetY;

         // Actualizar posición
         draggedElement.x = x;
         draggedElement.y = y;

         // Actualizar coordenadas de entradas/salidas
         if (draggedElement.type === 'gate') {
             draggedElement.inputs.forEach((input, i) => {
                 input.x = x;
                 input.y = y + (5 + i * 30);
             });
             draggedElement.output.x = x + 60;
             draggedElement.output.y = y + 20;
         } else if (draggedElement.type === 'input') {
             draggedElement.outputs[0].x = x + 30;
             draggedElement.outputs[0].y = y + 15;
         } else if (draggedElement.type === 'output') {
             draggedElement.inputs[0].x = x - 30;
             draggedElement.inputs[0].y = y + 15;
         }

         renderCircuit();
     }
 });

 document.addEventListener('mouseup', function () {
     if (dragging) {
         dragging = false;
         draggedElement = null;
     }
 });

 // Inicializar al cargar
 window.onload = init;