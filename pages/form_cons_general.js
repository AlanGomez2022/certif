'use strict';

// Coordenadas medidas en la plantilla original (612 × 1008 puntos).
function completarConstancia(page, font, datos) {
  const altura = page.getHeight();
  const ancho = 442;
  function escribir(texto, x, desdeArriba, maxWidth, size = 11) {
    while (size > 8 && font.widthOfTextAtSize(texto, size) > maxWidth) size -= 0.25;
    if (font.widthOfTextAtSize(texto, size) > maxWidth) {
      throw new Error('Uno de los campos es demasiado largo para la plantilla. Acortá su contenido.');
    }
    page.drawText(texto, { x, y: altura - desdeArriba, size, font });
  }

  function envolver(texto, size) {
    const lineas = [];
    for (const parrafo of texto.replace(/\r\n?/g, '\n').split('\n')) {
      let linea = '';
      for (const palabra of parrafo.trim().split(/\s+/)) {
        // También se dividen palabras o cadenas que excedan el ancho disponible.
        for (const caracter of (linea ? ' ' : '') + palabra) {
          if (font.widthOfTextAtSize(linea + caracter, size) > ancho) {
            const corte = linea.lastIndexOf(' ');
            if (corte > 0) {
              lineas.push(linea.slice(0, corte));
              linea = linea.slice(corte + 1);
            } else {
              lineas.push(linea);
              linea = '';
            }
          }
          linea += caracter;
        }
      }
      lineas.push(linea.trimEnd());
    }
    return lineas;
  }

  escribir(datos.emisor, 85, 380, ancho, 13);
  escribir([datos.dirigido, datos.nombre, datos.dni ? `DNI N° ${datos.dni}` : ''].filter(Boolean).join(' '), 85, 433, ancho, 13);

  let size = 11;
  let lineas;
  while (size >= 9) {
    lineas = envolver(datos.texto, size);
    if ((lineas.length - 1) * size * 1.4 <= 150) break;
    size -= 0.25;
  }
  if (size < 9) {
    throw new Error('El texto de la constancia supera el espacio disponible. Reducilo para que entre en una hoja.');
  }
  lineas.forEach((linea, indice) => {
    page.drawText(linea, { x: 85, y: altura - 460 - indice * size * 1.4, size, font });
  });

  escribir(datos.presentar, 85, 671, ancho);
  escribir(datos.lugar, 310, 697, 217, 10);
  escribir(datos.dia, 140, 750, 55, 13);
  escribir(datos.mes, 325, 750, 130, 13);
  escribir(datos.anio, 492, 750, 50, 13);
}

document.getElementById('form-cons-general').addEventListener('submit', async (event) => {
  event.preventDefault();
  const boton = document.getElementById('btn-generar');
  const estado = document.getElementById('estado-pdf');
  let ventana;
  let url;
  try {
    if (!window.PDFLib) throw new Error('No se pudo cargar la herramienta de PDF. Recargá la página e intentá nuevamente.');
    const datos = Object.fromEntries(new FormData(event.currentTarget));
    Object.keys(datos).forEach((campo) => { datos[campo] = datos[campo].trim(); });
    const numeroMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].indexOf(datos.mes);
    if (Number(datos.dia) > new Date(Number(datos.anio), numeroMes + 1, 0).getDate()) {
      throw new Error('El día seleccionado no existe en ese mes y año.');
    }
    // Abrir durante el clic evita que el navegador bloquee la pestaña tras el fetch.
    ventana = window.open('about:blank', '_blank');
    if (!ventana) throw new Error('Permití abrir ventanas emergentes para ver la constancia.');
    ventana.opener = null;
    ventana.document.title = 'Generando constancia';
    ventana.document.body.textContent = 'Generando constancia…';
    boton.disabled = true;
    estado.textContent = 'Generando constancia…';
    const respuesta = await fetch('../docs/form_const_general.pdf');
    if (!respuesta.ok) throw new Error('No se pudo cargar la plantilla de constancia general.');
    const { PDFDocument, StandardFonts } = window.PDFLib;
    const pdf = await PDFDocument.load(await respuesta.arrayBuffer());
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    completarConstancia(pdf.getPages()[0], font, datos);
    pdf.setTitle('Constancia General - ' + datos.nombre);
    const bytes = await pdf.save();
    url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    if (ventana.closed) throw new Error('La pestaña del PDF se cerró. Volvé a generar la constancia.');
    ventana.location.replace(url);
    estado.textContent = 'Constancia abierta en una nueva pestaña, lista para imprimir.';
    // Mantener la URL mientras el visor pueda necesitarla para imprimir o descargar.
    const comprobarCierre = window.setInterval(() => {
      if (ventana.closed) {
        URL.revokeObjectURL(url);
        window.clearInterval(comprobarCierre);
      }
    }, 1000);
  } catch (error) {
    if (ventana && !ventana.closed) ventana.close();
    if (url) URL.revokeObjectURL(url);
    estado.textContent = error.message || 'No se pudo generar la constancia.';
  } finally {
    boton.disabled = false;
  }
});
