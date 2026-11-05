'use strict';

// Medidas originales de modeloAF.pdf, en puntos desde la esquina superior izquierda.
globalThis.AnaliticoPDF = (() => {
  const cursos = [
    { id: 'primer-anio', pagina: 0, filas: [292.8, 305.88, 318.96, 332.64, 346.32, 360, 373.68, 387.36, 401.04], fin: 414.72 },
    { id: 'segundo-anio', pagina: 0, filas: [483.12, 496.8, 510.48, 524.16, 537.84, 551.52, 565.2, 578.88, 592.56, 606.24, 619.92], fin: 633.6 },
    { id: 'tercer-anio', pagina: 0, filas: [702, 715.68, 729.36, 743.04, 756.72, 770.4, 784.08, 797.76, 811.44, 825.12, 838.8], fin: 852.48 },
    { id: 'cuarto-anio', pagina: 1, filas: Array.from({ length: 12 }, (_, i) => 81.72 + i * 13.08), fin: 238.68 },
    { id: 'quinto-anio', pagina: 1, filas: [278.52, 291.6, 304.68, 318.36, 332.04, 345.72, 359.4, 373.08, 386.76, 400.44, 414.12, 427.8], fin: 441.48 },
    { id: 'sexto-anio', pagina: 1, filas: Array.from({ length: 11 }, (_, i) => 482.52 + i * 12.312), fin: 619.32 },
  ];

  function numeroNota(valor) {
    const texto = String(valor || '').trim().replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(texto)) return null;
    const numero = Number(texto);
    return Number.isFinite(numero) && numero >= 0 && numero <= 10 ? numero : null;
  }

  async function generar(PDFLib, plantilla, datos, materias) {
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const pdf = await PDFDocument.load(plantilla);
    if (pdf.getPageCount() !== 2) throw new Error('La plantilla del analítico debe tener dos páginas.');
    const paginas = pdf.getPages();
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const blanco = rgb(1, 1, 1);
    const negro = rgb(0, 0, 0);
    const valor = (id) => String(datos[id] || '').trim();

    function limpiar(page, x, top, width, height) {
      page.drawRectangle({ x, y: page.getHeight() - top - height, width, height, color: blanco });
    }
    function lineas(texto, size, width, fuente) {
      const resultado = [];
      for (const parrafo of texto.split(/\r?\n/)) {
        let linea = '';
        for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
          const siguiente = linea ? `${linea} ${palabra}` : palabra;
          if (fuente.widthOfTextAtSize(siguiente, size) <= width) linea = siguiente;
          else {
            if (linea) resultado.push(linea);
            linea = '';
            for (const caracter of palabra) {
              if (fuente.widthOfTextAtSize(linea + caracter, size) > width && linea) {
                resultado.push(linea);
                linea = '';
              }
              linea += caracter;
            }
          }
        }
        if (linea) resultado.push(linea);
      }
      return resultado;
    }
    function celda(page, texto, x, top, width, height, maxSize = 7, fuente = font, centrado = true) {
      texto = String(texto || '').trim();
      if (!texto) return;
      let size = maxSize;
      let partes;
      for (; size >= 3.5; size -= 0.25) {
        partes = lineas(texto, size, width - 4, fuente);
        if (partes.length * size * 1.1 <= height - 2) break;
      }
      if (size < 3.5) throw new Error(`El texto "${texto.slice(0, 45)}" es demasiado largo para su celda. Abrevialo.`);
      const alto = partes.length * size * 1.1;
      partes.forEach((parte, i) => {
        const offset = centrado ? (width - fuente.widthOfTextAtSize(parte, size)) / 2 : 2;
        page.drawText(parte, { x: x + offset, y: page.getHeight() - top - (height - alto) / 2 - size - i * size * 1.1, size, font: fuente, color: negro });
      });
    }

    // Reorganizar las dos líneas de datos evita reducir excesivamente los nombres largos.
    const primera = paginas[0];
    limpiar(primera, 11, 200, 590, 44);
    const texto = (contenido, x, top, width, size = 9) => celda(primera, contenido, x, top, width, 13, size, font, false);
    texto('Certifica que:', 12, 200, 63, 8);
    texto(valor('alumno'), 75, 200, 350, 9);
    texto(`DNI N° ${valor('dni')}`, 425, 200, 175, 9);
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const nacimiento = `Nacido/a en ${valor('ciudad-nacimiento')}, provincia de ${valor('provincia')}, el día ${valor('dia-nacimiento')} de ${meses[Number(valor('mes-nacimiento')) - 1] || ''} de ${valor('anio-nacimiento')}.`;
    celda(primera, nacimiento, 12, 214, 588, 16, 8, font, false);
    texto('Aprobó las materias que con sus respectivas calificaciones a continuación se expresan:', 12, 232, 588, 8);
    celda(primera, valor('libro-matriz'), 515, 148, 44, 13, 8);
    celda(primera, valor('folio'), 573, 148, 27, 13, 8);

    cursos.forEach((curso) => {
      const page = paginas[curso.pagina];
      const columnas = curso.pagina === 0
        ? [11.04, 238.8, 293.88, 345.36, 409.2, 448.44, 479.64, 597.72]
        : [33.48, 216.12, 250.2, 304.68, 362.76, 402, 433.2, 579];
      const lista = materias[curso.id];
      if (!lista || lista.length !== curso.filas.length - 1) throw new Error(`Las materias no coinciden con el cuadro de ${curso.id}.`);
      if (curso.id === 'sexto-anio') {
        // El modelo trae nueve renglones vacíos: redistribuir el espacio en diez.
        limpiar(page, 33.48, 482.52, 545.52, 122.28);
        curso.filas.slice(1, -1).forEach((top) => page.drawLine({ start: { x: 33.48, y: page.getHeight() - top }, end: { x: 579, y: page.getHeight() - top }, thickness: 0.6, color: negro }));
        columnas.slice(1, -1).forEach((x) => page.drawLine({ start: { x, y: page.getHeight() - 482.52 }, end: { x, y: page.getHeight() - 604.8 }, thickness: 0.6, color: negro }));
      }
      const notas = [];
      lista.forEach((materia, i) => {
        const clave = (campo) => valor(`${curso.id}-${campo}-${i + 1}`);
        const nota = numeroNota(clave('nota'));
        if (clave('nota') && nota === null) throw new Error(`La nota de ${materia} (${curso.id}) no es válida.`);
        notas.push(nota);
        const valores = [clave('nota'), clave('letras'), clave('condicion'), clave('mes'), clave('anio'), clave('establecimiento')];
        const top = curso.filas[i];
        const height = curso.filas[i + 1] - top - 0.84;
        if (curso.id === 'sexto-anio') celda(page, materia, columnas[0], top, columnas[1] - columnas[0] - 0.84, height, 7, regular, false);
        valores.forEach((contenido, j) => {
          celda(page, contenido, columnas[j + 1], top, columnas[j + 2] - columnas[j + 1] - 0.84, height, 7);
        });
      });
      const completo = notas.every((nota) => nota !== null);
      const promedio = completo ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2) : '';
      const top = curso.filas.at(-1);
      const height = curso.fin - top - 0.84;
      // Conservar CURSO y aprovechar la celda de calificación para el promedio numérico.
      celda(page, completo ? 'COMPLETO' : 'INCOMPLETO', columnas[0] + (curso.pagina ? 108 : 138), top,
        columnas[1] - columnas[0] - (curso.pagina ? 108 : 138) - 1, height, 7);
      limpiar(page, columnas[1], top, columnas[3] - columnas[1] - 0.84, height);
      celda(page, `PROMEDIO: ${promedio || '---'}`, columnas[1], top, columnas[3] - columnas[1] - 0.84, height, 7);
      celda(page, valor(`${curso.id}-promedio-letras`), columnas[3], top, columnas[7] - columnas[3] - 0.84, height, 7);
    });

    const segunda = paginas[1];
    celda(segunda, valor('libro-matriz'), 117, 703, 30, 13, 8);
    celda(segunda, valor('folio'), 226, 703, 65, 13, 8);
    // Fecha de emisión del analítico, según la fecha local del navegador.
    const hoy = new Date();
    celda(segunda, String(hoy.getDate()), 529, 730, 35, 13, 9);
    celda(segunda, meses[hoy.getMonth()], 71, 744, 108, 13, 9);
    limpiar(segunda, 248, 744, 45, 13);
    celda(segunda, String(hoy.getFullYear()), 248, 744, 45, 13, 9);
    pdf.setTitle(`Analítico parcial - ${valor('alumno')}`);
    return pdf.save();
  }
  return { generar };
})();
