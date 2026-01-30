document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-certificado");
  const origen = form.dataset.origen;
  let PDF_URL;
  if (!form) return;
    if (origen ==="secundaria"){
       PDF_URL = "../docs/regularSecu.pdf";
    }
    if (origen ==="primaria"){
       PDF_URL = "../docs/regularPrim.pdf";
    }
    if (origen ==="jardin"){
       PDF_URL = "../docs/regularJard.pdf";
    }

  function dateToDDMMYYYY(value) {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!window.PDFLib) {
      alert("PDF-Lib no está cargado");
      return;
    }

    // 1) Datos
    const alumno = document.getElementById("alumno").value.trim();
    const dni = document.getElementById("dni").value.trim();
    const curso = document.getElementById("curso").value.trim();
    const quien = document.getElementById("quien").value.trim();
    const fechaISO = document.getElementById("fecha").value;
    const fecha = dateToDDMMYYYY(fechaISO);

    // 2) PDF base
    const existingPdfBytes = await fetch(PDF_URL).then(r => r.arrayBuffer());

    // 3) PDF-Lib
    const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.getPages()[0];

    const fontSize = 10;
    const color = rgb(0, 0, 0);

    // 4) Escribir (x,y los ajustás vos)
    page.drawText(alumno, { x: 265, y: 120, size: fontSize, font, color });
    if (dni) page.drawText(dni, { x: 90, y: 105, size: fontSize, font, color });
    page.drawText(curso, { x: 320, y: 105, size: fontSize, font, color });
    if (quien) page.drawText(quien, { x: 13, y: 70, size: fontSize, font, color });
    page.drawText(fecha, { x: 50, y: 147, size: fontSize, font, color });



    // 5) Generar PDF
   const pdfBytes = await pdfDoc.save();

    // --- nombre de archivo ---
    const origen = form.dataset.origen || "certificado";

    const safeOrigen = origen
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "");

    const safeAlumno = (alumno || "alumno")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "");

    const fileName = `certificado_${safeAlumno}_${safeOrigen}.pdf`;

    // --- abrir / descargar ---
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);

    // abrir en el navegador
    window.open(blobUrl, "_blank");
  });
});
