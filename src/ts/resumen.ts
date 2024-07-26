document.addEventListener('DOMContentLoaded', async () => {
  try {
    const allText = sessionStorage.getItem('exampleText');

    if (!allText) {
      console.error('No se encontró "exampleText" en el sessionStorage.');
      return;
    }

    const parsedText = JSON.parse(allText);

    const palabrasClaves = sessionStorage.getItem('palabras-claves');

    let partesResumidas: string[] = [];

    palabrasClaves.split(',').forEach((palabraClave: string) => {
      const trimmedPalabraClave = palabraClave.trim();

      const regexPatterns = [
        // Captura la oracion hasta el proximo salto de linea
        new RegExp(`${trimmedPalabraClave}:.*?(?=\n|$)`, 'g'),
        // Captura hasta el próximo salto de línea o el final del texto:
        new RegExp(`${trimmedPalabraClave}[\s\S]*?(?=\n|\r\n|$)`, 'g'),
        // Captura la oracion hasta el proximo salto de linea aunque hayan espacios debajo
        new RegExp(`${trimmedPalabraClave}[\s\S]*?(?=\n\n|\n|\r\n|$)`, 'g'),
        // Captura hasta el próximo doble salto de línea o el final del texto:
        new RegExp(`${trimmedPalabraClave}[\s\S]*?(?=\n\n|\r\n\r\n|$)`, 'g'),
        // Captura hasta el siguiente título o el final del texto:
        new RegExp(`${trimmedPalabraClave}[\\s\\S]*?(?=(?:\\n\\n|\\r\\n\\r\\n|$|\\n|\\r)[^\\w\\s])`, 'g'),
        // Captura aunque haya signos de puntuación
        new RegExp(`${trimmedPalabraClave}[\\s\\S]*?(?=[?¿!¡]*\n|\r\n|$)`, 'g'),
        // Captura aunque hayan signos de agrupacion
        new RegExp(`(?:\\*|\\-|\\s)*${trimmedPalabraClave}[\\s\\S]*?(?=[?¿!¡]*\n|\r\n|$)`, 'g'),
        // Todo un parrafo
        new RegExp(`${trimmedPalabraClave}[\\s\\S]*?(?=\\n\\n|\\r\\n\\r\\n|$)`, 'g'),
        new RegExp(`${trimmedPalabraClave}[\\s\\S]*?(?=\n\n|\r\n\r\n|\n|\r|$)`, 'g'),
        new RegExp(`${trimmedPalabraClave}[\\s\\S]*?(?=\n\s*[\*#\-\\d]|\r\n\s*[\*#\-\\d]|$)`, 'g'),

      ];

      let matchFound = false;
      regexPatterns.forEach((regex) => {
        if (!matchFound) {
          let match;
          while ((match = regex.exec(parsedText)) !== null) {
            if (match[0]) {
              partesResumidas.push(match[0].trim());
              matchFound = true;
              break;
            }
          }
        }
      });
    });

    const divCentral = document.getElementById('contenedor-resumen');
    partesResumidas.forEach(parte => {
      const p = document.createElement('p');
      p.innerHTML = parte;

      divCentral.appendChild(p);
    });

  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
  }
});
