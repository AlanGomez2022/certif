'use strict';

const materiasPorAnio = {
  'primer-anio': [
    'CIENCIAS NATURALES',
    'CIENCIAS SOCIALES',
    'EDUCACIÓN ARTÍSTICA',
    'EDUCACIÓN FÍSICA',
    'INGLÉS',
    'MATEMÁTICA',
    'PRÁCTICAS DEL LENGUAJE',
    'CONSTRUCCIÓN DE CIUDADANÍA',
  ],
  'segundo-anio': [
    'BIOLOGÍA',
    'CONSTRUCCIÓN DE CIUDADANÍA',
    'EDUCACIÓN ARTÍSTICA',
    'EDUCACIÓN FÍSICA',
    'FISICOQUÍMICA',
    'GEOGRAFÍA',
    'HISTORIA',
    'INGLÉS',
    'MATEMÁTICA',
    'PRÁCTICAS DEL LENGUAJE',
  ],
  'tercer-anio': [
    'BIOLOGÍA',
    'CONSTRUCCIÓN DE CIUDADANÍA',
    'EDUCACIÓN ARTÍSTICA',
    'EDUCACIÓN FÍSICA',
    'FISICOQUÍMICA',
    'GEOGRAFÍA',
    'HISTORIA',
    'INGLÉS',
    'MATEMÁTICA',
    'PRÁCTICAS DEL LENGUAJE',
  ],
  'cuarto-anio': [
    'LITERATURA',
    'MATEMÁTICA-CICLO SUPERIOR',
    'EDUCACIÓN FÍSICA',
    'INGLÉS',
    'NTICx',
    'SALUD Y ADOLESCENCIA',
    'INTRODUCCIÓN A LA FÍSICA',
    'BIOLOGÍA',
    'HISTORIA',
    'GEOGRAFÍA',
    'PSICOLOGÍA',
  ],
  'quinto-anio': [
    'LITERATURA',
    'MATEMÁTICA-CICLO SUPERIOR',
    'EDUCACIÓN FÍSICA',
    'INGLÉS',
    'POLITICA Y CIUDADANIA',
    'INTRODUCCIÓN A LA QUÍMICA',
    'HISTORIA',
    'GEOGRAFÍA',
    'COMUNICACIÓN CULTURA Y SOCIEDAD',
    'ECONOMIA POLÍTICA',
    'SOCIOLOGÍA',
  ],
  'sexto-anio': [
    'LITERATURA',
    'MATEMÁTICA',
    'EDUCACIÓN FISICA FISICA',
    'INGLÉS',
    'TRABAJO Y CIUDADANIA',
    'FILOSOFÍA',
    'ARTE',
    'HISTORIA',
    'GEOGRAFÍA',
    'PROYECTO DE INVEST. EN CS. SOC.',
  ],
};

const mesesCalificacion = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const opcionesLetras = document.createElement('datalist');
opcionesLetras.id = 'notas-en-letras';
['CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ'].forEach((nota) => {
  opcionesLetras.appendChild(new Option(nota, nota));
});
document.getElementById('contenido-calificaciones').appendChild(opcionesLetras);

function interpretarNota(valor) {
  const texto = valor.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(texto)) return null;
  const numero = Number(texto);
  return Number.isFinite(numero) && numero >= 0 && numero <= 10 ? numero : null;
}

Object.entries(materiasPorAnio).forEach(([anio, materias]) => {
  const bloque = document.getElementById(anio);
  const nombreAnio = bloque.querySelector('h2').textContent;
  const contenedor = document.createElement('div');
  contenedor.className = 'tabla-scroll';
  contenedor.tabIndex = 0;
  contenedor.setAttribute('role', 'region');
  contenedor.setAttribute('aria-label', `Calificaciones de ${nombreAnio}`);
  const tabla = document.createElement('table');
  tabla.className = 'tabla-materias';
  tabla.setAttribute('aria-labelledby', `titulo-${anio}`);
  const columnas = document.createElement('colgroup');
  ['materia', 'nota', 'letras', 'condicion', 'mes', 'anio', 'establecimiento'].forEach((nombre) => {
    const columna = document.createElement('col');
    columna.className = `col-${nombre}`;
    columnas.appendChild(columna);
  });
  tabla.appendChild(columnas);
  const cabecera = tabla.createTHead();
  const encabezado = cabecera.insertRow();
  ['Materia', 'Calificación', 'Condición', 'Mes', 'Año', 'Establecimiento'].forEach((titulo) => {
    const celda = document.createElement('th');
    celda.scope = titulo === 'Calificación' ? 'colgroup' : 'col';
    if (titulo === 'Calificación') celda.colSpan = 2;
    else celda.rowSpan = 2;
    celda.textContent = titulo;
    encabezado.appendChild(celda);
  });
  const subencabezado = cabecera.insertRow();
  ['Número', 'En letras'].forEach((titulo) => {
    const celda = document.createElement('th');
    celda.scope = 'col';
    celda.textContent = titulo;
    subencabezado.appendChild(celda);
  });
  const cuerpo = tabla.createTBody();
  const notas = [];
  materias.forEach((materia, indice) => {
    const fila = cuerpo.insertRow();
    const titulo = document.createElement('th');
    titulo.scope = 'row';
    titulo.textContent = materia;
    fila.appendChild(titulo);
    function agregarCampo(tipo, clave, etiqueta, opciones) {
      const celda = fila.insertCell();
      celda.setAttribute('data-label', etiqueta);
      const campo = document.createElement('div');
      campo.className = 'field';
      const input = document.createElement(tipo);
      if (tipo === 'input') input.type = 'text';
      if (opciones) opciones.forEach((valor) => input.appendChild(new Option(valor, valor)));
      input.id = `${anio}-${clave}-${indice + 1}`;
      input.name = `calificaciones[${anio}][${indice}][${clave}]`;
      input.setAttribute('form', 'form-alumno');
      input.setAttribute('aria-label', `${etiqueta} de ${materia} - ${nombreAnio}`);
      campo.appendChild(input);
      celda.appendChild(campo);
      return input;
    }
    const nota = agregarCampo('input', 'nota', 'Calificación numérica');
    nota.inputMode = 'decimal';
    nota.title = 'Nota de 0 a 10. Se admiten decimales con coma o punto.';
    notas.push(nota);
    nota.addEventListener('input', actualizarResumen);
    const letras = agregarCampo('input', 'letras', 'Calificación en letras');
    letras.setAttribute('list', opcionesLetras.id);
    agregarCampo('select', 'condicion', 'Condición', ['---', '--', 'Regular', 'Equivalencia']);
    agregarCampo('select', 'mes', 'Mes', ['---', ...mesesCalificacion]);
    const anios = ['---'];
    for (let numero = new Date().getFullYear(); numero >= 1900; numero--) anios.push(String(numero));
    agregarCampo('select', 'anio', 'Año', anios);
    agregarCampo('input', 'establecimiento', 'Establecimiento').value = '---';
  });
  contenedor.appendChild(tabla);
  bloque.appendChild(contenedor);

  const resumen = document.createElement('div');
  resumen.className = 'resumen-anio';
  function campoResumen(clave, etiqueta, soloLectura) {
    const campo = document.createElement('div');
    campo.className = 'field';
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `${anio}-${clave}`;
    input.name = `resumen[${anio}][${clave}]`;
    input.readOnly = soloLectura;
    input.setAttribute('form', 'form-alumno');
    input.setAttribute('aria-label', `${etiqueta} - ${nombreAnio}`);
    campo.appendChild(input);
    return { campo, input };
  }
  const estado = campoResumen('estado', 'Estado del curso', true);
  estado.input.setAttribute('aria-live', 'polite');
  resumen.appendChild(estado.campo);
  const labelPromedio = document.createElement('label');
  labelPromedio.htmlFor = `${anio}-promedio`;
  labelPromedio.textContent = 'PROMEDIO';
  resumen.appendChild(labelPromedio);
  const promedio = campoResumen('promedio', 'Promedio numérico', true);
  resumen.appendChild(promedio.campo);
  const promedioLetras = campoResumen('promedio-letras', 'Promedio en letras', false);
  promedioLetras.input.placeholder = 'Promedio en letras';
  promedioLetras.campo.classList.add('promedio-letras');
  resumen.appendChild(promedioLetras.campo);
  bloque.appendChild(resumen);

  function actualizarResumen() {
    const valores = notas.map((input) => {
      const valor = interpretarNota(input.value);
      const invalida = input.value.trim() !== '' && valor === null;
      input.setCustomValidity(invalida ? 'Ingresá una nota válida entre 0 y 10.' : '');
      input.setAttribute('aria-invalid', String(invalida));
      return valor;
    });
    const completo = valores.every((valor) => valor !== null);
    estado.input.value = completo ? 'COMPLETO' : 'INCOMPLETO';
    estado.input.className = completo ? 'estado-completo' : 'estado-incompleto';
    promedio.input.value = completo
      ? (valores.reduce((suma, valor) => suma + valor, 0) / valores.length).toFixed(2)
      : '';
  }
  actualizarResumen();
});
