import { getDocument, PDFDocumentProxy } from 'pdfjs-dist';
import * as mammoth from 'mammoth';

async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await getDocument({ data: arrayBuffer }).promise as PDFDocumentProxy;
    let extractedText = '';

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const textItems = textContent.items;
        const pageText = textItems.map((item: any) => item.str).join(' ');

        extractedText += pageText;
    }

    return extractedText;
}



document.getElementById('fileInput')?.addEventListener('input', async () => {
    const filesElement = document.getElementById('fileInput') as HTMLInputElement;

    const files = filesElement.files;

    if (files.length > 0) {
        let allText = '';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            let textContent = '';

            if (file.type === 'application/pdf') {
                textContent = await extractTextFromPDF(file);
            } else if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                textContent = result.value;
            } else {
                textContent = await file.text();
            }

            allText += ` ${textContent}`;

            if(i === 0) {
                sessionStorage.setItem('exampleText', JSON.stringify(allText));
            }
        }

        sessionStorage.setItem('uploadedFiles', JSON.stringify(allText));
        window.location.href = 'palabras_claves.html';
    }
});

document.getElementById('comparar-button').addEventListener('click', abrirModal);
document.getElementById('cerrar-button').addEventListener('click', cerrarModal);
document.getElementById('volver-button').addEventListener('click', volverModal);
document.getElementById('siguiente-button').addEventListener('click', siguientePaso);

const primerPaso = document.getElementById('paso-1');
const select = document.getElementById('tipo-comparativa') as HTMLSelectElement;
const modalBackground = document.getElementById('modalBackground');

export function volverModal() {
    const pasoSiguiente = document.getElementById(`paso-${select.value}`);
    pasoSiguiente.style.display = 'none';
    primerPaso.style.display = 'flex';

    document.getElementById('volver-button').style.display = 'none';
}

export function abrirModal() {
    modalBackground.style.display = 'flex';
}

export function cerrarModal() {
    modalBackground.style.display = 'none';
    primerPaso.style.display = 'flex';
    const pasoSiguiente = document.getElementById(`paso-${select.value}`);
    pasoSiguiente.style.display = 'none';

    document.getElementById('volver-button').style.display = 'none';
}

export function siguientePaso() {
    primerPaso.style.display = 'none';
    const pasoSiguiente = document.getElementById(`paso-${select.value}`);
    pasoSiguiente.style.display = 'flex';

    if (parseInt(select.value) > 0) document.getElementById('volver-button').style.display = 'block';
}