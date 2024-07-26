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

    const filePathExcel = await window.excel.createExcel(nombresPartida, nombresLlegada, distancias);

    await guardarNombres(filePathExcel);
}


async function guardarNombres(filePathExcel) {
    const puntosPartida = document.getElementById('inputs-container-partida');
    const puntosLlegada = document.getElementById('inputs-container-llegada');

    const nombresPartida = Array.from(puntosPartida?.getElementsByClassName('nombre') || []);
    const latitudesPartida = Array.from(puntosPartida?.getElementsByClassName('latitud-input') || []);
    const longitudesPartida = Array.from(puntosPartida?.getElementsByClassName('longitud-input') || []);

    const nombresLlegada = Array.from(puntosLlegada?.getElementsByClassName('nombre') || []);
    const latitudesLlegada = Array.from(puntosLlegada?.getElementsByClassName('latitud-input') || []);
    const longitudesLlegada = Array.from(puntosLlegada?.getElementsByClassName('longitud-input') || []);

    let datosNuevos = [];

    // Recopilar datos de partida
    for (let i = 0; i < nombresPartida.length; i++) {
        const nombrePartida = nombresPartida[i].value.trim();
        const latitudPartida = latitudesPartida[i].value.trim();
        const longitudPartida = longitudesPartida[i].value.trim();

        if (nombrePartida.length < 4) {
            continue;
        }

        // Verifica si el nombre es nuevo
        const esNuevo = !filteredUbicaciones.some(item => item.NOMBRE.toLowerCase() === nombrePartida.toLowerCase());

        if (esNuevo) {
            datosNuevos.push({ nombre: nombrePartida, latitud: latitudPartida, longitud: longitudPartida });
        }
    }

    // Recopilar datos de llegada
    for (let i = 0; i < nombresLlegada.length; i++) {
        const nombreLlegada = nombresLlegada[i].value.trim();
        const latitudLlegada = latitudesLlegada[i].value.trim();
        const longitudLlegada = longitudesLlegada[i].value.trim();

        if (nombreLlegada.length < 4) {
            continue;
        }

        // Verifica si el nombre es nuevo
        const esNuevo = !filteredUbicaciones.some(item => item.NOMBRE.toLowerCase() === nombreLlegada.toLowerCase());

        if (esNuevo) {
            datosNuevos.push({ nombre: nombreLlegada, latitud: latitudLlegada, longitud: longitudLlegada });
        }
    }

    if (datosNuevos.length > 0) {
        const insertQuery = `INSERT INTO ubicaciones (nombre, latitud, longitud) VALUES (:nombre, :latitud, :longitud)`;
        console.log(datosNuevos);
        try {
            for (const dato of datosNuevos) {
                const result = await window.electronAPI.insertDatabase(insertQuery, [dato.nombre, dato.latitud, dato.longitud]);
                if (result.error) {
                    console.error('Error en la inserción:', result.error);
                }
            }

            alert('Los datos nuevos han sido guardados exitosamente en la carpeta: ' + filePathExcel);
        } catch (error) {
            console.error('Error al realizar la consulta:', error);
        }
    } else {
        console.log('No hay datos nuevos para insertar.');
    }
}

function addNewInput(idContainer) {
    const container = document.getElementById(idContainer);

    if (container) {
        // Obtener todos los campos en el contenedor
        const allInputs = Array.from(container.querySelectorAll('.longitud-input'));
        const lastInput = allInputs[allInputs.length - 1];

        // Verificar si el último campo está vacío y no se ha creado un nuevo campo después
        if (lastInput && lastInput.value.trim() === '') {
            return;
        }

        const hr = document.createElement('hr');

        const newNombre = document.createElement('input');
        newNombre.type = 'text';
        newNombre.className = 'nombre';
        newNombre.placeholder = 'Nombre o número...';
        newNombre.oninput = function () { buscarDatos(this, idContainer) };

        const divResultados = document.createElement('div');
        divResultados.className = 'results-container';

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

        newInputLongitud.addEventListener('input', () => {
            handleInput(newInputLongitud, idContainer)
        });
    }
}

function handleInput(event, idContainer) {
    if (event.value.trim().length >= 1) {
        addNewInput(
            idContainer
        );
    }
}

// Resultados

async function buscarDatos(input, idContainer) {
    const puntosPartida = document.getElementById('inputs-container-partida');
    const puntosLlegada = document.getElementById('inputs-container-llegada');

    const nombresPartida = Array.from(puntosPartida?.getElementsByClassName('nombre') || []).map(input => input.value.trim().toLowerCase());
    const nombresLlegada = Array.from(puntosLlegada?.getElementsByClassName('nombre') || []).map(input => input.value.trim().toLowerCase());

    // Combina los nombres y elimina duplicados
    const nombresSet = new Set([...nombresLlegada, ...nombresPartida]);
    const nombres = Array.from(nombresSet);

    const query = `SELECT * FROM ubicaciones WHERE nombre LIKE '%${input.value}%'`;

    try {
        const ubicaciones = await window.electronAPI.selectDatabase(query);

        if (ubicaciones.error) {
            console.error('Error en la consulta:', ubicaciones.error);
        } else {
            if (ubicaciones.rows && ubicaciones.rows.length > 0) {
                const resultsContainer = input.nextElementSibling;
                resultsContainer.innerHTML = '';

                // Usa un Set para eliminar duplicados en ubicaciones.rows basado en NOMBRE
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