import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export table data to PDF
 * @param {Object} options - Configuration object
 * @param {string} options.title - PDF document title
 * @param {Array} options.headers - Array of column headers
 * @param {Array} options.data - Array of data rows
 * @param {string} options.filename - Output filename (without .pdf extension)
 * @param {Object} options.footer - Optional footer data with totals
 */
export const exportTableToPDF = ({ title, headers, data, filename, footer = null }) => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, 20);

    // Add date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Generated: ${date}`, 14, 28);

    // Add table
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        theme: 'grid',
        headStyles: {
            fillColor: [59, 130, 246], // Blue color
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 9
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        },
        margin: { top: 35 }
    });

    // Add footer totals if provided
    if (footer) {
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');

        let yPosition = finalY;
        Object.entries(footer).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`, 14, yPosition);
            yPosition += 7;
        });
    }

    // Save the PDF
    doc.save(`${filename}.pdf`);
};

/**
 * Format number with locale string
 */
export const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return '0';
    return Number(num).toLocaleString();
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
};
