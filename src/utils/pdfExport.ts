import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportRecordToPDF = (record: any, title: string = 'Registro') => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  
  const body = Object.entries(record).map(([key, value]) => {
    return [
      key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      String(value !== null && value !== undefined ? value : '')
    ];
  });
  
  autoTable(doc, {
    startY: 30,
    head: [['Campo', 'Valor']],
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });
  
  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().getTime()}.pdf`);
};

export const exportTableToPDF = (tableId: string, title: string = 'Reporte') => {
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  autoTable(doc, {
    startY: 30,
    html: `#${tableId}`,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });
  
  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().getTime()}.pdf`);
};
