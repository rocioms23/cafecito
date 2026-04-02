const SPREADSHEET_ID = 'TU_ID_DE_LA_HOJA_DE_CALCULO'; // Está en la URL de tu Google Sheet

function doPost(e) {
  const sheetInv = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Inventario");
  const sheetHist = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Historial_Movimientos");
  
  const data = JSON.parse(e.postData.contents);
  const fechaActual = Utilities.formatDate(new Date(), "GMT-3", "yyyy-MM-dd HH:mm:ss");

  if (data.action === 'add') {
    const newId = sheetInv.getLastRow(); // ID autoincremental simple
    sheetInv.appendRow([newId, fechaActual, data.categoria, data.producto, data.total, 0, 0, data.total]);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (data.action === 'update') {
    // Aquí buscas el ID en la hoja "Inventario", actualizas la celda de Pendiente/Reutilizado,
    // y luego añades una fila a "Historial_Movimientos" para el registro administrativo.
    sheetHist.appendRow([fechaActual, data.id, data.tipo, data.cantidad, data.motivo]);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  }
}