function calcularDistancia() {
    const puntosPartida = document.getElementById('inputs-container-partida');
    const puntosLlegada = document.getElementById('inputs-container-llegada');

    const latitudesPartida = puntosPartida?.getElementsByClassName('latitud-input');
    const longitudesPartida = puntosPartida?.getElementsByClassName('longitud-input');

    const latitudesLlegada = puntosLlegada?.getElementsByClassName('latitud-input');
    const longitudesLlegada = puntosLlegada?.getElementsByClassName('longitud-input');

    // Radio de la Tierra en kilómetros
    const R = 6371;

    for (let i = 0; i < latitudesPartida.length; i++) {
        for (let j = 0; j < latitudesLlegada.length; j++) {
            const lat1 = parseFloat(latitudesPartida[i].value);
            const lon1 = parseFloat(longitudesPartida[i].value);
            const lat2 = parseFloat(latitudesLlegada[j].value);
            const lon2 = parseFloat(longitudesLlegada[j].value);

            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distancia = R * c;

            console.log(`Distancia de ${i + 1} a ${j + 1}: ${distancia.toFixed(2)} km`);
        }
    }
}

let indexPartida = 2;
let indexLlegada = 2;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('inputs-container-partida');

    function addNewInput() {
        // Obtener todos los campos en el contenedor
        if (container) {

            const allInputs = Array.from(container.querySelectorAll('.longitud-input'));
            const lastInput = allInputs[allInputs.length - 1];

            // Verificar si el último campo está vacío y no se ha creado un nuevo campo después de él
            if (lastInput && lastInput.value.trim() === '') {
                return;
            }

            // Crear nuevos campos de entrada
            const p = document.createElement('p');
            p.innerHTML = `Lugar ${indexPartida}`;

            const newNombre = document.createElement('input');
            newNombre.type = 'text';
            newNombre.className = 'nombre';
            newNombre.placeholder = 'Nombre o número...';
            newNombre.oninput = function () { buscarDatos(this) };

            const divResultados = document.createElement('div');
            divResultados.className = 'results-container';
            divResultados.id = `results-container-partida-${indexPartida}`;

            const newInputLatitud = document.createElement('input');
            newInputLatitud.type = 'text';
            newInputLatitud.className = 'latitud-input';
            newInputLatitud.placeholder = 'Latitud...';

            const newInputLongitud = document.createElement('input');
            newInputLongitud.type = 'text';
            newInputLongitud.className = 'longitud-input';
            newInputLongitud.placeholder = 'Longitud...';

            const borrar = document.createElement('span');
            borrar.innerHTML = `x`;
            borrar.className = 'borrar';
            borrar.onclick = () => {
                container.removeChild(span);
                indexLlegada--;
            };

            const span = document.createElement('span');
            span.className = 'inputs-container';

            // Añadir el nuevo campo de entrada al contenedor
            span.appendChild(newNombre);
            span.appendChild(divResultados);
            span.appendChild(newInputLatitud);
            span.appendChild(newInputLongitud);
            span.appendChild(borrar);

            container.appendChild(p);
            container.appendChild(span);

            // Asignar eventos para los nuevos campos
            newInputLatitud.addEventListener('input', handleInput);
            newInputLongitud.addEventListener('input', handleInput);

            indexLlegada++;
        }
    }

    function handleInput(event) {
        // Verifica si el valor del campo tiene al menos un carácter
        if (event.target.value.trim().length >= 1) {
            addNewInput();
        }
    }
    if (container) {
        const longitud = container.querySelectorAll('.latitud-input');
        longitud.forEach(input => input.addEventListener('input', handleInput));

        const latitud = container.querySelectorAll('.longitud-input');
        latitud.forEach(input => input.addEventListener('input', handleInput));
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('inputs-container-llegada');

    function addNewInput() {
        if (container) {
            // Obtener todos los campos en el contenedor
            const allInputs = Array.from(container.querySelectorAll('.longitud-input'));
            const lastInput = allInputs[allInputs.length - 1];

            // Verificar si el último campo está vacío y no se ha creado un nuevo campo después de él
            if (lastInput && lastInput.value.trim() === '') {
                return;
            }

            // Crear nuevos campos de entrada
            const p = document.createElement('p');
            p.innerHTML = `Lugar ${indexLlegada}`;

            const newNombre = document.createElement('input');
            newNombre.type = 'text';
            newNombre.className = 'nombre';
            newNombre.placeholder = 'Nombre o número...';
            newNombre.oninput = function () { buscarDatos(this) };

            const divResultados = document.createElement('div');
            divResultados.className = 'results-container';
            divResultados.id = `results-container-llegada-${indexLlegada}`;

            const newInputLatitud = document.createElement('input');
            newInputLatitud.type = 'text';
            newInputLatitud.className = 'latitud-input';
            newInputLatitud.placeholder = 'Latitud...';

            const newInputLongitud = document.createElement('input');
            newInputLongitud.type = 'text';
            newInputLongitud.className = 'longitud-input';
            newInputLongitud.placeholder = 'Longitud...';

            const borrar = document.createElement('span');
            borrar.innerHTML = `x`;
            borrar.className = 'borrar';
            borrar.onclick = () => {
                container.removeChild(span);
                indexLlegada--;
            };

            const span = document.createElement('span');
            span.className = 'inputs-container';

            // Añadir el nuevo campo de entrada al contenedor
            span.appendChild(newNombre);
            span.appendChild(divResultados);
            span.appendChild(newInputLatitud);
            span.appendChild(newInputLongitud);
            span.appendChild(borrar);

            container.appendChild(p);
            container.appendChild(span);

            // Asignar eventos para los nuevos campos
            newInputLatitud.addEventListener('input', handleInput);
            newInputLongitud.addEventListener('input', handleInput);

            indexLlegada++;
        }
    }

    function handleInput(event) {
        // Verifica si el valor del campo tiene al menos un carácter
        if (event.target.value.trim().length >= 1) {
            addNewInput();
        }
    }
    if (container) {
        const longitud = container.querySelectorAll('.latitud-input');
        longitud.forEach(input => input.addEventListener('input', handleInput));

        const latitud = container.querySelectorAll('.longitud-input');
        latitud.forEach(input => input.addEventListener('input', handleInput));
    }
});

// Resultados

const data = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Anna Brown', 'Paul Wilson'];

function buscarDatos(input) {
    const query = input.value.toLowerCase();
    const resultsContainer = input.nextElementSibling;
    resultsContainer.innerHTML = '';

    if (query) {
        const filteredData = data.filter(item => item.toLowerCase().includes(query));

        filteredData.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.textContent = item;

            // Agregar evento para seleccionar el item
            resultItem.addEventListener('click', () => {
                input.value = item; // Rellenar el input con el valor seleccionado
                resultsContainer.innerHTML = ''; // Limpiar los resultados
            });

            resultsContainer.appendChild(resultItem);
        });

        resultsContainer.style.display = filteredData.length ? 'block' : 'none';
    } else {
        resultsContainer.style.display = 'none';
    }
}

document.addEventListener('click', (event) => {
    const resultsContainers = document.querySelectorAll('.results-container');
    resultsContainers.forEach((container) => {
        if (!container.contains(event.target) && !container.previousElementSibling?.contains(event.target)) {
            container.style.display = 'none';
        }
    });
});