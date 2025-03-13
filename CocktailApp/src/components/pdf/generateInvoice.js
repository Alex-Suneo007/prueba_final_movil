import jsPDF from 'jspdf';
import 'jspdf-autotable';
import RNFS from 'react-native-fs';

const generateInvoice = async (cart, customerName) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(20);
  doc.text('Factura de Compra', 14, 22);

  // Información del cliente
  doc.setFontSize(12);
  doc.text(`Nombre del Cliente: ${customerName}`, 14, 40);
  doc.text('Fecha: ' + new Date().toLocaleDateString(), 14, 48);

  // Tabla de artículos
  const tableData = cart.map(item => [item.strDrink, item.quantity || 1, item.price.toFixed(2)]);
  doc.autoTable({
    head: [['Producto', 'Cantidad', 'Precio']],
    body: tableData,
    startY: 60,
  });

  // Total
  const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const iva = total * 0.12; // 12% IVA
  const finalTotal = total + iva;
  doc.text(`Subtotal: $${total.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
  doc.text(`IVA (12%): $${iva.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 16);
  doc.text(`Total: $${finalTotal.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 22);

  // Guardar el PDF como un archivo
  const pdfOutput = doc.output('blob');
  const path = `${RNFS.DocumentDirectoryPath}/factura.pdf`;

  await RNFS.writeFile(path, pdfOutput, 'base64')
    .then(() => {
      console.log('PDF guardado en:', path);
    })
    .catch(err => {
      console.error('Error al guardar el PDF:', err);
    });
};

export default generateInvoice;