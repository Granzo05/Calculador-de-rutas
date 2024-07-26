async function buscarDatos() {
    const escuela = document.getElementById('escuela') as HTMLInputElement;
    const alumno = document.getElementById('alumno') as HTMLInputElement;
    const docente = document.getElementById('docente') as HTMLInputElement;
    const division = document.getElementById('divisiones') as HTMLInputElement;
    const parametro = document.getElementById('parametro') as HTMLInputElement;
    const desde = document.getElementById('desde') as HTMLInputElement;
    const hasta = document.getElementById('hasta') as HTMLInputElement;

    if (escuela.value.length === 0) {
        alert('Necesitamos una escuela para buscar la información');
        return;
    }

    const datosBusqueda = {
        escuela,
        alumno,
        docente,
        division,
        parametro,
        desde,
        hasta
    };
}

async function buscarParametrosEstudio() {
    try {
        const query = 'SELECT * FROM datos_escolares';

        if(alumno.length > 0) {
            query += ` WHERE alumno = ${alumno}`;
        }

        // Si se cargo un alumno añado el AND, caso contrario busco solo por el docente
        if(alumno.length > 0 && docente.length > 0) {
            query += ` AND docente = ${alumno}`;
        } else if (docente.lenght > 0) {
            query += ` WHERE docente = ${docente}`;
        }

        if((alumno.length > 0 || docente.length > 0) && division.lenght > 0) {
            query += ` AND divison = ${division}`;
        } else if (division.lenght > 0) {
            query += ` WHERE division = ${division}`;
        }

        if((alumno.length > 0 || docente.length > 0 || division.lenght > 0) && parametro.lenght > 0) {
            query += ` AND parametro = ${parametro}`;
        } else if (parametro.lenght > 0) {
            query += ` WHERE parametro = ${parametro}`;
        }

        if((alumno.length > 0 || docente.length > 0 || division.lenght > 0 || parametro.lenght > 0) && desde.lenght > 0 && hasta.lenght > 0) {
            query += ` AND fecha_desde and FECHA_HASTA BETWEEN (${desde}, ${hasta})`;
        } else if((alumno.length > 0 || docente.length > 0 || division.lenght > 0 || parametro.lenght > 0) && desde.lenght > 0) {
            query += ` AND fecha_desde AFTER = ${desde}`;
        } else if (desde.lenght > 0 && hasta.lenght > 0) {
            query += ` WHERE fecha_desde and FECHA_HASTA BETWEEN (${desde}, ${hasta})`;
        } else if (desde.lenght > 0) {
            query += ` WHERE fecha_desde AFTER = ${desde}`;
        } else if (hasta.lenght > 0) {
            query += ` WHERE fecha_hasta AFTER = ${desde}`;
        }

        // Enviar la consulta a la base de datos
        window.electronAPI.queryDatabase(query);

        // Manejar la respuesta de la consulta
        window.electronAPI.onQueryResult((result) => {
            if (result.error) {
                console.error('Error al buscar datos:', result.error);
            } else {
                const selectParametros = document.getElementById('parametros') as HTMLSelectElement;
                selectParametros.innerHTML = ''; 

                result.rows.forEach((parametro: string) => {
                    const option = document.createElement('option');
                    option.textContent = parametro;
                    option.value = parametro;
                    selectParametros.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error al buscar datos:', error);
    }
}