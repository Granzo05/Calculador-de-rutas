let ubicacionesFiltradas;
const modal = document.getElementById('myModal');
const title = document.getElementById('title-modal');
const mensaje = document.getElementById('mensaje-modal');

function autocompletarPegado(input) {
    const container = input.closest('.inputs-container');
    const longitudInput = container.querySelector('.longitud-input');
    const value = input.value;
    const [lat, long] = value.split(',').map(coord => coord.trim());

    if (lat && long) {
        input.value = lat;
        longitudInput.value = long;
    }
}

function añadirCamposSiguientes(inputElement, idContainer) {
    if (inputElement.value.trim().length >= 1) {
        añadirCampos(idContainer);
    }
}

function añadirCampos(idContainer) {
    const container = document.getElementById(idContainer);

    if (container) {
        const allInputs = Array.from(container.querySelectorAll('.nombre, .latitud-input, .longitud-input'));
        const nombreInput = allInputs[allInputs.length - 3];
        const latitudInput = allInputs[allInputs.length - 2];
        const longitudInput = allInputs[allInputs.length - 1];

        if (nombreInput && nombreInput.value.trim() === '' && latitudInput && latitudInput.value.trim() === '' && longitudInput && longitudInput.value.trim() === '') {
            return;
        }

        const span = document.createElement('span');
        span.className = 'inputs-container';

        const hr = document.createElement('hr');

        span.appendChild(crearCampoDeNombre(idContainer));
        span.appendChild(crearDivRecomendacionesDeNombresEstablecimientos());
        span.appendChild(crearCampoLatitud(idContainer));
        span.appendChild(crearCampoLongitud(idContainer));
        span.appendChild(crearBotonBorrar(container, span, hr));

        container.appendChild(hr);
        container.appendChild(span);
    }
}

function crearCampoDeNombre(idContainer) {
    const newNombre = document.createElement('input');
    newNombre.type = 'text';
    newNombre.className = 'nombre';
    newNombre.placeholder = 'Nombre o número...';
    newNombre.oninput = function () { getDatosGuardadosLikeInputValue(this, idContainer); añadirCamposSiguientes(this, idContainer); };

    return newNombre;
}

function crearDivRecomendacionesDeNombresEstablecimientos() {
    const divResultados = document.createElement('div');
    divResultados.className = 'results-container';

    return divResultados;
}

function crearCampoLatitud(idContainer) {
    const newInputLatitud = document.createElement('input');
    newInputLatitud.type = 'text';
    newInputLatitud.className = 'latitud-input';
    newInputLatitud.placeholder = 'Latitud...';
    newInputLatitud.oninput = function () { autocompletarPegado(this); añadirCamposSiguientes(this, idContainer); };

    return newInputLatitud;
}

function crearCampoLongitud(idContainer) {
    const newInputLongitud = document.createElement('input');
    newInputLongitud.type = 'text';
    newInputLongitud.className = 'longitud-input';
    newInputLongitud.placeholder = 'Longitud...';
    newInputLongitud.oninput = function () { añadirCamposSiguientes(this, idContainer); };

    return newInputLongitud;
}

function crearBotonBorrar(container, span, hr) {
    const borrar = document.createElement('span');
    borrar.innerHTML = `x`;
    borrar.className = 'borrar';
    borrar.onclick = () => {
        container.removeChild(hr);
        container.removeChild(span);
    };

    return borrar;
}

async function getDatosGuardadosLikeInputValue(input, idContainer) {
    const inputValue = input.value.trim();
    const query = `SELECT * FROM ubicaciones WHERE nombre LIKE :inputValue ORDER BY nombre FETCH FIRST 25 ROWS ONLY`;

    const ubicaciones = await window.electronAPI.selectDatabase(query, [inputValue + '%']);

    const divConDatos = input.nextElementSibling;

    if (ubicaciones.error) {
        console.error('Error en la consulta:', ubicaciones.error);
    } else {
        if (ubicaciones.rows && ubicaciones.rows.length > 0) {
            const nombres = await buscarNombresEscritosEnInputs(idContainer);
            await filtrarUbicaciones(ubicaciones, nombres);
            agregarNombresAlDiv(input, divConDatos, idContainer);
        } else {
            divConDatos.innerHTML = '';
            divConDatos.style.display = 'none';
        }
    }
}

async function buscarNombresEscritosEnInputs() {
    const puntosPartida = document.getElementById('inputs-container-partida');
    const puntosLlegada = document.getElementById('inputs-container-llegada');

    const nombresPartida = Array.from(puntosPartida?.getElementsByClassName('nombre') || [])
        .map(input => input.value.trim().toLowerCase());
    const nombresLlegada = Array.from(puntosLlegada?.getElementsByClassName('nombre') || [])
        .map(input => input.value.trim().toLowerCase());

    const nombresSet = new Set([...nombresLlegada, ...nombresPartida]);
    const nombres = Array.from(nombresSet);

    return nombres;
}

async function filtrarUbicaciones(ubicaciones, nombres) {
    const ubicacionesSet = new Set();

    ubicacionesFiltradas = ubicaciones.rows.filter(item => {
        const nombreLower = item.NOMBRE.toLowerCase();
        if (ubicacionesSet.has(nombreLower) || nombres.includes(nombreLower)) {
            return false;
        }
        ubicacionesSet.add(nombreLower);
        return true;
    });
}

function agregarNombresAlDiv(input, divConDatos, idContainer) {
    const latitudInput = input.parentElement.querySelector('.latitud-input');
    const longitudInput = input.parentElement.querySelector('.longitud-input');

    ubicacionesFiltradas.forEach(item => {
        const datosEstablecimiento = document.createElement('div');
        datosEstablecimiento.className = 'result-item';
        datosEstablecimiento.textContent = item.NOMBRE;

        datosEstablecimiento.addEventListener('click', () => {
            input.value = item.NOMBRE;
            latitudInput.value = item.LATITUD;
            longitudInput.value = item.LONGITUD;
            divConDatos.innerHTML = '';
            añadirCampos(idContainer);
        });

        divConDatos.appendChild(datosEstablecimiento);
    });

    divConDatos.style.display = ubicacionesFiltradas.length ? 'block' : 'none';
}

document.addEventListener('click', (event) => {
    cerrarDivResultadosAlClickearFuera(event);
});

function cerrarDivResultadosAlClickearFuera(event) {
    const divConDatos = document.querySelectorAll('.results-container');
    divConDatos.forEach((container) => {
        if (!container.contains(event.target) && !container.previousElementSibling?.contains(event.target)) {
            container.style.display = 'none';
        }
    });
}

document.getElementById('div-help').addEventListener('click', (event) => {
    mostrarDatosDeAyudaAlClickear()
});

function mostrarDatosDeAyudaAlClickear() {
    document.getElementById('div-help').style.display = 'none';
    document.getElementById('container-app').style.display = 'none';
    document.getElementById('button').style.display = 'none';

    document.getElementById('div-cerrar').style.display = 'flex';
    document.getElementById('container-help').style.display = 'flex';
}

document.getElementById('div-cerrar').addEventListener('click', (event) => {
    ocultarDatosDeAyudaAlCerrar();
});

function ocultarDatosDeAyudaAlCerrar() {
    document.getElementById('div-help').style.display = 'flex';
    document.getElementById('container-app').style.display = 'flex';
    document.getElementById('button').style.display = 'block';

    document.getElementById('div-cerrar').style.display = 'none';
    document.getElementById('container-help').style.display = 'none';
}


document.getElementById('button-partida').addEventListener('click', (event) => {
    crearFila('inputs-container-partida');
});

document.getElementById('button-llegada').addEventListener('click', (event) => {
    crearFila('inputs-container-llegada');
});

function crearFila(idContainer) {
    const container = document.getElementById(idContainer);

    const allInputs = Array.from(container.querySelectorAll('.nombre, .latitud-input, .longitud-input'));
    const nombreInput = allInputs[allInputs.length - 3];
    const latitudInput = allInputs[allInputs.length - 2];
    const longitudInput = allInputs[allInputs.length - 1];

    if (nombreInput && nombreInput.value.trim() === '' && latitudInput && latitudInput.value.trim() === '' && longitudInput && longitudInput.value.trim() === '') {
        alert('No es necesario crear un nuevo campo ya que existe uno vacío');
        return;
    } else {
        añadirCampos(idContainer);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const title = item.querySelector('.faq-title');
        title.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
});


async function calculardiferenciaMedianteHaversine() {
    const latitudesPartida = Array.from(document.querySelectorAll('#inputs-container-partida .latitud-input')).filter(input => input.value.trim() !== '');
    const longitudesPartida = Array.from(document.querySelectorAll('#inputs-container-partida .longitud-input')).filter(input => input.value.trim() !== '');
    const latitudesLlegada = Array.from(document.querySelectorAll('#inputs-container-llegada .latitud-input')).filter(input => input.value.trim() !== '');
    const longitudesLlegada = Array.from(document.querySelectorAll('#inputs-container-llegada .longitud-input')).filter(input => input.value.trim() !== '');

    const nombresPartida = Array.from(document.querySelectorAll('#inputs-container-partida .nombre')).map(input => input.value.trim()).filter(value => value !== '');
    const nombresLlegada = Array.from(document.querySelectorAll('#inputs-container-llegada .nombre')).map(input => input.value.trim()).filter(value => value !== '');

    if (latitudesPartida.length === 0 || longitudesPartida.length === 0 || latitudesLlegada.length === 0 || longitudesLlegada.length === 0 || nombresPartida.length === 0 || nombresLlegada.length === 0 || latitudesPartida.length === 0) {
        alert('Es necesario un punto de partida y otro de llegada como mínimo para calcular las rutas');
        return;
    }

    const distancias = nombresPartida.map((_, i) => {
        return nombresLlegada.map((_, j) => {
            const lat1 = parseFloat(latitudesPartida[i].value);
            const lon1 = parseFloat(longitudesPartida[i].value);
            const lat2 = parseFloat(latitudesLlegada[j].value);
            const lon2 = parseFloat(longitudesLlegada[j].value);
            const RadioTierra = 6371;
            const diferenciaLatitud = (lat2 - lat1) * Math.PI / 180;
            const diferenciaLongitud = (lon2 - lon1) * Math.PI / 180;

            const a = Math.sin(diferenciaLatitud / 2) * Math.sin(diferenciaLatitud / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(diferenciaLongitud / 2) * Math.sin(diferenciaLongitud / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distanciaEnKM = (RadioTierra * c) * 1.15;

            return Math.ceil(distanciaEnKM * 100) / 100;
        });
    });

    mostrarModalDeCarga();

    const filePathExcel = await window.excel.createExcel(nombresPartida, nombresLlegada, distancias);
    await guardarNombres();

    mostrarModalDeRutaExcel(filePathExcel);
}

function mostrarModalDeCarga() {
    modal.style.display = 'flex';
    title.innerHTML = 'Creando excel';
    mensaje.innerHTML = 'Se están calculando las rutas, puede demorar unos minutos dependiendo la cantidad de datos...';
}

function cerrarModal() {
    modal.style.display = 'none';
}

async function guardarNombres() {
    let nombresGuardados = await getNombresGuardados();

    let datosNuevos = [];

    findDatosNuevosEnPuntosPartida(nombresGuardados, datosNuevos);

    findDatosNuevosEnPuntosPartida(nombresGuardados, datosNuevos);

    if (datosNuevos.length > 0) {
        const insertQuery = `INSERT INTO ubicaciones (nombre, latitud, longitud) VALUES (:nombre, :latitud, :longitud)`;
        saveDatosNuevos(insertQuery, datosNuevos);
    }
}

async function getNombresGuardados() {
    try {
        const result = await window.electronAPI.selectDatabase(`SELECT nombre FROM ubicaciones`, []);
        return result.rows.map(item => item.NOMBRE.trim().toLowerCase());
    } catch (error) {
        console.error('Error al obtener nombres existentes:', error);
        return [];
    }
}

function findDatosNuevosEnPuntosPartida(nombresGuardados, datosNuevos) {
    const puntosPartida = document.getElementById('inputs-container-partida');
    const nombresPartida = Array.from(puntosPartida?.getElementsByClassName('nombre') || []);
    const latitudesPartida = Array.from(puntosPartida?.getElementsByClassName('latitud-input') || []);
    const longitudesPartida = Array.from(puntosPartida?.getElementsByClassName('longitud-input') || []);

    for (let i = 0; i < nombresPartida.length; i++) {
        let nombrePartida = nombresPartida[i].value.trim();
        const latitudPartida = latitudesPartida[i].value.trim();
        const longitudPartida = longitudesPartida[i].value.trim();

        if (nombrePartida.length < 4) {
            continue;
        }

        nombrePartida = nombrePartida.replace(/["'¡?!¿,]/g, '');

        if (!nombresGuardados.includes(nombrePartida.toLowerCase())) {
            datosNuevos.push({ nombre: nombrePartida, latitud: latitudPartida, longitud: longitudPartida });
        }
    }
}

function findDatosNuevosEnPuntosPartida(nombresGuardados, datosNuevos) {
    const puntosLlegada = document.getElementById('inputs-container-llegada');
    const nombresLlegada = Array.from(puntosLlegada?.getElementsByClassName('nombre') || []);
    const latitudesLlegada = Array.from(puntosLlegada?.getElementsByClassName('latitud-input') || []);
    const longitudesLlegada = Array.from(puntosLlegada?.getElementsByClassName('longitud-input') || []);

    for (let i = 0; i < nombresLlegada.length; i++) {
        let nombreLlegada = nombresLlegada[i].value.trim();
        const latitudLlegada = latitudesLlegada[i].value.trim();
        const longitudLlegada = longitudesLlegada[i].value.trim();

        if (nombreLlegada.length < 4) {
            continue;
        }

        nombreLlegada = nombreLlegada.replace(/["'¡?!¿,]/g, '');

        if (!nombresGuardados.includes(nombreLlegada.toLowerCase())) {
            datosNuevos.push({ nombre: nombreLlegada, latitud: latitudLlegada, longitud: longitudLlegada });
        }
    }
}

async function saveDatosNuevos(query, datosNuevos) {
    try {
        for (const dato of datosNuevos) {
            const result = await window.electronAPI.insertDatabase(query, [dato.nombre, dato.latitud, dato.longitud]);
            if (result.error) {
                console.error('Error en la inserción:', result.error);
            }
        }
    } catch (error) {
        console.error('Error al realizar la consulta:', error);
    }
}

function mostrarModalDeRutaExcel(filePathExcel) {
    modal.style.display = 'flex';
    title.innerHTML = 'Guardado exitoso';
    mensaje.innerHTML = 'Encontrarás el excel en ' + filePathExcel + '<br>Ya podés cerrar el mensaje';
    document.getElementById('spinner').style.display = 'none';

    document.getElementById('button-modal').style.display = 'block';
}

function limpiarInputsDePartida() {
    const inputsPartida = document.getElementById('inputs-container-partida');
    inputsPartida.innerHTML = '';

    const partidaInicial = `
    <span class="inputs-container">
        <input type="text" class="nombre"
            oninput="getDatosGuardadosLikeInputValue(this, 'inputs-container-partida'); añadirCamposSiguientes(this, 'inputs-container-partida')"
            placeholder="Nombre o número..." />
        <div class="results-container" id="results-container-partida-1"></div>
        <input type="text" class="latitud-input"
            oninput="autocompletarPegado(this); añadirCamposSiguientes(this, 'inputs-container-partida')"
            placeholder="Latitud..." />
        <input type="text" class="longitud-input"
            oninput="añadirCamposSiguientes(this, 'inputs-container-partida')" placeholder="Longitud..." />
    </span>
    `;

    inputsPartida.innerHTML = partidaInicial;
}
function limpiarInputsDeLlegada() {
    const inputsLlegada = document.getElementById('inputs-container-llegada');
    inputsLlegada.innerHTML = '';

    const llegadaInicial = `
    <span class="inputs-container">
        <input type="text" class="nombre"
            oninput="getDatosGuardadosLikeInputValue(this, 'inputs-container-llegada'); añadirCamposSiguientes(this, 'inputs-container-llegada')"
            placeholder="Nombre o número..." />
        <div class="results-container" id="results-container-llegada-1"></div>
        <input type="text" class="latitud-input"
            oninput="autocompletarPegado(this); añadirCamposSiguientes(this, 'inputs-container-llegada')"
            placeholder="Latitud..." />
        <input type="text" class="longitud-input"
            oninput="añadirCamposSiguientes(this, 'inputs-container-llegada')" placeholder="Longitud..." />
    </span>
    `;

    inputsLlegada.innerHTML = llegadaInicial;
}
