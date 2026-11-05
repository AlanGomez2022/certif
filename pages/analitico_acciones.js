'use strict';

(() => {
  const claveGuardado = 'projectCert.analiticoParcial.v1';
  const form = document.getElementById('form-alumno');
  const bloque = document.getElementById('sexto-anio');
  const acciones = document.createElement('div');
  acciones.className = 'acciones-analitico';
  function boton(texto, id) {
    const elemento = document.createElement('button');
    elemento.type = 'button';
    elemento.id = id;
    elemento.className = 'btn-submit';
    elemento.textContent = texto;
    acciones.appendChild(elemento);
    return elemento;
  }
  const guardar = boton('GUARDAR', 'guardar-analitico');
  const generar = boton('GENERAR ANALÍTICO PARCIAL', 'generar-analitico');
  bloque.appendChild(acciones);
  const estado = document.createElement('p');
  estado.id = 'estado-analitico';
  estado.setAttribute('role', 'status');
  bloque.appendChild(estado);

  function datosActuales() {
    return Object.fromEntries(Array.from(form.elements)
      .filter((campo) => campo.id && !campo.readOnly && ['INPUT', 'SELECT'].includes(campo.tagName))
      .map((campo) => [campo.id, campo.value]));
  }

  guardar.addEventListener('click', () => {
    try {
      localStorage.setItem(claveGuardado, JSON.stringify({ version: 1, datos: datosActuales() }));
      estado.textContent = 'Carga guardada en este navegador. Se recuperará al volver a abrir esta página.';
    } catch {
      estado.textContent = 'No se pudo guardar la carga. Revisá que el navegador permita almacenamiento local.';
    }
  });

  function restaurar() {
    try {
      const guardado = JSON.parse(localStorage.getItem(claveGuardado) || 'null');
      if (!guardado || guardado.version !== 1 || !guardado.datos || typeof guardado.datos !== 'object') return;
      const datos = guardado.datos;
      const fecha = ['anio-nacimiento', 'mes-nacimiento', 'dia-nacimiento'];
      const campos = Array.from(form.elements).filter((campo) => campo.id && !campo.readOnly && ['INPUT', 'SELECT'].includes(campo.tagName));
      const ids = campos.map((campo) => campo.id).filter((id) => !fecha.includes(id)).concat(fecha);
      ids.forEach((id) => {
        const campo = document.getElementById(id);
        if (typeof datos[id] !== 'string') return;
        campo.value = datos[id];
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        campo.dispatchEvent(new Event('change', { bubbles: true }));
      });
      estado.textContent = 'Se recuperó la última carga guardada en este navegador.';
    } catch {
      estado.textContent = 'No se pudo recuperar la carga guardada. Podés completar el formulario y guardarlo nuevamente.';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restaurar);
  else restaurar();

  generar.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    let ventana;
    let url;
    try {
      if (!window.PDFLib) throw new Error('No se cargó la biblioteca PDF. Recargá la página e intentá nuevamente.');
      // Abrir en el clic para evitar el bloqueo de ventanas emergentes.
      ventana = window.open('about:blank', '_blank');
      if (!ventana) throw new Error('Permití abrir ventanas emergentes para visualizar el analítico.');
      ventana.opener = null;
      ventana.document.title = 'Generando analítico parcial';
      ventana.document.body.textContent = 'Generando analítico parcial…';
      generar.disabled = true;
      guardar.disabled = true;
      estado.textContent = 'Generando las dos páginas del analítico…';
      const datos = datosActuales();
      const respuesta = await fetch('../docs/modeloAF.pdf');
      if (!respuesta.ok) throw new Error('No se pudo cargar docs/modeloAF.pdf.');
      const bytes = await AnaliticoPDF.generar(window.PDFLib, await respuesta.arrayBuffer(), datos, materiasPorAnio);
      url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      if (ventana.closed) throw new Error('La pestaña se cerró. Volvé a generar el analítico.');
      ventana.location.replace(url);
      estado.textContent = 'Analítico parcial abierto en una nueva pestaña, listo para imprimir.';
      const intervalo = window.setInterval(() => {
        if (ventana.closed) {
          URL.revokeObjectURL(url);
          window.clearInterval(intervalo);
        }
      }, 1000);
    } catch (error) {
      if (ventana && !ventana.closed) ventana.close();
      if (url) URL.revokeObjectURL(url);
      estado.textContent = error.message || 'No se pudo generar el analítico parcial.';
    } finally {
      generar.disabled = false;
      guardar.disabled = false;
    }
  });
})();
