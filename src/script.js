let filteredUbicaciones;


async function calcularDistancia() {
    // Obtener los valores de los inputs y filtrarlos para eliminar los vacíos
    const latitudesPartida = Array.from(document.querySelectorAll('#inputs-container-partida .latitud-input')).filter(input => input.value.trim() !== '');
    const longitudesPartida = Array.from(document.querySelectorAll('#inputs-container-partida .longitud-input')).filter(input => input.value.trim() !== '');
    const latitudesLlegada = Array.from(document.querySelectorAll('#inputs-container-llegada .latitud-input')).filter(input => input.value.trim() !== '');
    const longitudesLlegada = Array.from(document.querySelectorAll('#inputs-container-llegada .longitud-input')).filter(input => input.value.trim() !== '');

    const nombresPartida = Array.from(document.querySelectorAll('#inputs-container-partida .nombre')).map(input => input.value.trim()).filter(value => value !== '');
    const nombresLlegada = Array.from(document.querySelectorAll('#inputs-container-llegada .nombre')).map(input => input.value.trim()).filter(value => value !== '');

    const distancias = nombresPartida.map((_, i) => {
        return nombresLlegada.map((_, j) => {
            const lat1 = parseFloat(latitudesPartida[i].value);
            const lon1 = parseFloat(longitudesPartida[i].value);
            const lat2 = parseFloat(latitudesLlegada[j].value);
            const lon2 = parseFloat(longitudesLlegada[j].value);

            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distancia = (R * c) * 1.15;

            return Math.ceil(distancia * 100) / 100;
        });
    });

    const modal = document.getElementById('myModal');
    modal.style.display = 'flex';

    const title = document.getElementById('title-modal');
    const mensaje = document.getElementById('mensaje-modal');

    title.innerHTML = 'Creando excel';
    mensaje.innerHTML = 'Se están calculando las rutas, puede demorar unos minutos dependiendo la cantidad de datos...';

    const filePathExcel = await window.excel.createExcel(nombresPartida, nombresLlegada, distancias);

    title.innerHTML = 'Excel creado correctamente';
    mensaje.innerHTML = 'Encontrarás el excel en ' + filePathExcel + '\nEstamos verificando si hay datos nuevos que almacenar...';

    await guardarNombres();

    mensaje.innerHTML = 'Encontrarás el excel en ' + filePathExcel + '\nYa podés cerrar el mensaje';
    document.getElementById('spinner').style.display = 'none';

    document.getElementById('button-modal').style.display = 'block';
}

function cerrarModal() {
    document.getElementById('myModal').style.display = 'none';
}


async function guardarNombres() {
    const puntosPartida = document.getElementById('inputs-container-partida');
    const puntosLlegada = document.getElementById('inputs-container-llegada');

    const nombresPartida = Array.from(puntosPartida?.getElementsByClassName('nombre') || []);
    const latitudesPartida = Array.from(puntosPartida?.getElementsByClassName('latitud-input') || []);
    const longitudesPartida = Array.from(puntosPartida?.getElementsByClassName('longitud-input') || []);

    const nombresLlegada = Array.from(puntosLlegada?.getElementsByClassName('nombre') || []);
    const latitudesLlegada = Array.from(puntosLlegada?.getElementsByClassName('latitud-input') || []);
    const longitudesLlegada = Array.from(puntosLlegada?.getElementsByClassName('longitud-input') || []);

    let datosNuevos = [];

    // Consulta para obtener nombres existentes
    const queryExisting = `SELECT nombre FROM ubicaciones`;
    let existingNames = [];

    try {
        const result = await window.electronAPI.selectDatabase(queryExisting, []);

        existingNames = result.rows.map(item => item.NOMBRE.trim().toLowerCase());
    } catch (error) {
        console.error('Error al obtener nombres existentes:', error);
        return; // Si no se pueden obtener los nombres existentes, detiene la función
    }

    // Recopilar datos de partida
    for (let i = 0; i < nombresPartida.length; i++) {
        let nombrePartida = nombresPartida[i].value.trim();
        const latitudPartida = latitudesPartida[i].value.trim();
        const longitudPartida = longitudesPartida[i].value.trim();

        if (nombrePartida.length < 4) {
            continue;
        }

        nombrePartida = nombrePartida.replace(/["'¡?!¿,]/g, '');

        // Verifica si el nombre es nuevo
        if (!existingNames.includes(nombrePartida.toLowerCase())) {
            datosNuevos.push({ nombre: nombrePartida, latitud: latitudPartida, longitud: longitudPartida });
        }
    }

    // Recopilar datos de llegada
    for (let i = 0; i < nombresLlegada.length; i++) {
        let nombreLlegada = nombresLlegada[i].value.trim();
        const latitudLlegada = latitudesLlegada[i].value.trim();
        const longitudLlegada = longitudesLlegada[i].value.trim();

        if (nombreLlegada.length < 4) {
            continue;
        }

        nombreLlegada = nombreLlegada.replace(/["'¡?!¿,]/g, '');

        // Verifica si el nombre es nuevo
        if (!existingNames.includes(nombreLlegada.toLowerCase())) {
            datosNuevos.push({ nombre: nombreLlegada, latitud: latitudLlegada, longitud: longitudLlegada });
        }
    }

    if (datosNuevos.length > 0) {
        const insertQuery = `INSERT INTO ubicaciones (nombre, latitud, longitud) VALUES (:nombre, :latitud, :longitud)`;
        try {
            for (const dato of datosNuevos) {
                const result = await window.electronAPI.insertDatabase(insertQuery, [dato.nombre, dato.latitud, dato.longitud]);
                if (result.error) {
                    console.error('Error en la inserción:', result.error);
                }
            }
        } catch (error) {
            console.error('Error al realizar la consulta:', error);
        }
    }
}


function handleLatLongInput(input) {
    const container = input.closest('.inputs-container');
    const longitudInput = container.querySelector('.longitud-input');
    const value = input.value;
    const [lat, long] = value.split(',').map(coord => coord.trim());

    if (lat && long) {
        input.value = lat;
        longitudInput.value = long;
    }
}

function addNewInput(idContainer) {
    const container = document.getElementById(idContainer);

    if (container) {
        // Obtener todos los campos en el contenedor
        const allInputs = Array.from(container.querySelectorAll('.nombre, .latitud-input, .longitud-input'));
        const nombreInput = allInputs[allInputs.length - 3];
        const latitudInput = allInputs[allInputs.length - 2];
        const longitudInput = allInputs[allInputs.length - 1];

        // Verificar si estan los 3 campos vacios para no crear de más, es decir que si creo un nuevo span con inputs, hasta que alguno de estos no se llene no se crean más
        if (nombreInput && nombreInput.value.trim() === '' && latitudInput && latitudInput.value.trim() === '' && longitudInput && longitudInput.value.trim() === '') {
            return;
        }

        const hr = document.createElement('hr');

        const newNombre = document.createElement('input');
        newNombre.type = 'text';
        newNombre.className = 'nombre';
        newNombre.placeholder = 'Nombre o número...';
        newNombre.oninput = function () { buscarDatos(this, idContainer); handleInput(this, idContainer); };

        const divResultados = document.createElement('div');
        divResultados.className = 'results-container';

        const newInputLatitud = document.createElement('input');
        newInputLatitud.type = 'text';
        newInputLatitud.className = 'latitud-input';
        newInputLatitud.placeholder = 'Latitud...';
        newInputLatitud.oninput = function () { handleLatLongInput(this); handleInput(this, idContainer); };

        const newInputLongitud = document.createElement('input');
        newInputLongitud.type = 'text';
        newInputLongitud.className = 'longitud-input';
        newInputLongitud.placeholder = 'Longitud...';
        newInputLongitud.oninput = function () { handleInput(this, idContainer); };

        const borrar = document.createElement('span');
        borrar.innerHTML = `x`;
        borrar.className = 'borrar';
        borrar.onclick = () => {
            container.removeChild(hr);
            container.removeChild(span);
        };

        const span = document.createElement('span');
        span.className = 'inputs-container';

        // Añadir el nuevo campo de entrada al contenedor
        span.appendChild(newNombre);
        span.appendChild(divResultados);
        span.appendChild(newInputLatitud);
        span.appendChild(newInputLongitud);
        span.appendChild(borrar);

        container.appendChild(hr);
        container.appendChild(span);
    }
}

function handleInput(inputElement, idContainer) {
    if (inputElement.value.trim().length >= 1) {
        addNewInput(idContainer);
    }
}

// Resultados

async function buscarDatos(input, idContainer) {
    const puntosPartida = document.getElementById('inputs-container-partida');
    const puntosLlegada = document.getElementById('inputs-container-llegada');

    const nombresPartida = Array.from(puntosPartida?.getElementsByClassName('nombre') || [])
        .map(input => input.value.trim().toLowerCase());
    const nombresLlegada = Array.from(puntosLlegada?.getElementsByClassName('nombre') || [])
        .map(input => input.value.trim().toLowerCase());

    const nombresSet = new Set([...nombresLlegada, ...nombresPartida]);
    const nombres = Array.from(nombresSet);

    const inputValue = input.value.trim();
    const query = `SELECT * FROM ubicaciones WHERE nombre LIKE :inputValue ORDER BY nombre FETCH FIRST 7 ROWS ONLY`;

    try {
        const ubicaciones = await window.electronAPI.selectDatabase(query, [inputValue + '%']);

        if (ubicaciones.error) {
            console.error('Error en la consulta:', ubicaciones.error);
        } else {
            if (ubicaciones.rows && ubicaciones.rows.length > 0) {
                const resultsContainer = input.nextElementSibling;
                resultsContainer.innerHTML = '';

                const ubicacionesSet = new Set();

                filteredUbicaciones = ubicaciones.rows.filter(item => {
                    const nombreLower = item.NOMBRE.toLowerCase();
                    if (ubicacionesSet.has(nombreLower) || nombres.includes(nombreLower)) {
                        return false;
                    }
                    ubicacionesSet.add(nombreLower);
                    return true;
                });

                const latitudInput = input.parentElement.querySelector('.latitud-input');
                const longitudInput = input.parentElement.querySelector('.longitud-input');

                filteredUbicaciones.forEach(item => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'result-item';
                    resultItem.textContent = item.NOMBRE;

                    resultItem.addEventListener('click', () => {
                        input.value = item.NOMBRE;
                        latitudInput.value = item.LATITUD;
                        longitudInput.value = item.LONGITUD;
                        resultsContainer.innerHTML = '';
                        addNewInput(idContainer);
                    });

                    resultsContainer.appendChild(resultItem);
                });

                resultsContainer.style.display = filteredUbicaciones.length ? 'block' : 'none';
            } else {
                const resultsContainer = input.nextElementSibling;
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error al realizar la consulta:', error);
    }
}

// Cierra el div de resultados
document.addEventListener('click', (event) => {
    const resultsContainers = document.querySelectorAll('.results-container');
    resultsContainers.forEach((container) => {
        if (!container.contains(event.target) && !container.previousElementSibling?.contains(event.target)) {
            container.style.display = 'none';
        }
    });
});