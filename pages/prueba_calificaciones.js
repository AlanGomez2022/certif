'use strict';

// Este archivo se utiliza únicamente desde prueba_calificaciones.html.
const formularioPrueba = document.getElementById('formulario-prueba');
const estadoPrueba = document.getElementById('estado-prueba');
const notasPrueba = [
  ['7', 'SIETE'], ['8', 'OCHO'], ['9', 'NUEVE'], ['6,5', 'SEIS CON CINCUENTA CENTÉSIMOS'],
  ['10', 'DIEZ'], ['7.25', 'SIETE CON VEINTICINCO CENTÉSIMOS'],
  ['8,5', 'OCHO CON CINCUENTA CENTÉSIMOS'], ['9.75', 'NUEVE CON SETENTA Y CINCO CENTÉSIMOS'],
];

function numeroEnLetras(numero) {
  const menores = ['CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE',
    'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE',
    'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIUNO',
    'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS',
    'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
  if (numero < 30) return menores[numero];
  const decenas = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  return decenas[Math.floor(numero / 10)] + (numero % 10 ? ` Y ${menores[numero % 10]}` : '');
}

function cargarSimulacro() {
  try {
    const doc = formularioPrueba.contentDocument;
    const ventana = formularioPrueba.contentWindow;
    function completar(id, valor) {
      const campo = doc.getElementById(id);
      if (!campo) throw new Error(`No se encontró el campo ${id}.`);
      campo.value = valor;
      campo.dispatchEvent(new ventana.Event('input', { bubbles: true }));
      campo.dispatchEvent(new ventana.Event('change', { bubbles: true }));
    }
    const anioActual = new Date().getFullYear();
    Object.entries({ alumno: 'PÉREZ, LUCÍA SOFÍA (PRUEBA)', dni: '00000000',
      'ciudad-nacimiento': 'Presidente Derqui', provincia: 'Buenos Aires',
      'anio-nacimiento': String(anioActual - 18), 'mes-nacimiento': '5', 'dia-nacimiento': '15',
      'libro-matriz': 'PRUEBA-12', folio: 'PRUEBA-45',
    }).forEach(([id, valor]) => completar(id, valor));

    let total = 0;
    const anios = ['primer-anio', 'segundo-anio', 'tercer-anio', 'cuarto-anio', 'quinto-anio', 'sexto-anio'];
    anios.forEach((anio, indiceAnio) => {
      const campos = doc.querySelectorAll(`input[id^="${anio}-nota-"]`);
      if (!campos.length) throw new Error(`No se cargaron las materias de ${anio}.`);
      campos.forEach((campo, indice) => {
        const numero = indice + 1;
        const [nota, letras] = notasPrueba[(indice + indiceAnio) % notasPrueba.length];
        completar(campo.id, nota);
        completar(`${anio}-letras-${numero}`, letras);
        completar(`${anio}-condicion-${numero}`, indice % 4 === 0 ? 'Equivalencia' : 'Regular');
        completar(`${anio}-mes-${numero}`, indice % 3 === 0 ? 'MAR' : 'DIC');
        completar(`${anio}-anio-${numero}`, String(anioActual - 5 + indiceAnio));
        completar(`${anio}-establecimiento-${numero}`, indice % 4 === 0
          ? 'Escuela de origen (PRUEBA)' : 'Instituto Antonio Toro (PRUEBA)');
        total++;
      });
      const promedio = doc.getElementById(`${anio}-promedio`).value;
      if (doc.getElementById(`${anio}-estado`).value !== 'COMPLETO' || !/^\d+\.\d{2}$/.test(promedio)) {
        throw new Error(`Revisá el estado o promedio de ${anio}.`);
      }
      const [entero, decimales] = promedio.split('.').map(Number);
      completar(`${anio}-promedio-letras`, numeroEnLetras(entero)
        + (decimales ? ` CON ${numeroEnLetras(decimales)} CENTÉSIMOS` : ''));
    });
    estadoPrueba.textContent = `Simulacro cargado: datos del alumno y ${total} materias. Los seis cursos están COMPLETOS y tienen promedio calculado.`;
  } catch (error) {
    estadoPrueba.textContent = `No se pudo completar la prueba: ${error.message} Abrí esta página desde el mismo servidor local que usás para el sitio.`;
  }
}

formularioPrueba.addEventListener('load', cargarSimulacro);
document.getElementById('recargar-prueba').addEventListener('click', cargarSimulacro);
formularioPrueba.src = 'carga_calificaciones.html';
