import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    try {
        console.log('Starting PDF export...', { title, headers, data, filename, footer });

        const doc = new jsPDF();
        console.log('jsPDF instance created:', doc);

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

        // Add table using autoTable function
        console.log('Calling autoTable...');
        autoTable(doc, {
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
        console.log('autoTable completed successfully');

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
        console.log('Saving PDF with filename:', `${filename}.pdf`);
        doc.save(`${filename}.pdf`);
        console.log('PDF saved successfully!');
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert(`Failed to generate PDF: ${error.message}`);
        throw error;
    }
};

/**
 * Print table data to PDF (Opens print dialog instead of downloading)
 * @param {Object} options - Configuration object (same as exportTableToPDF)
 */
export const printTableToPDF = ({ title, headers, data, filename, footer = null }) => {
    try {
        console.log('Starting PDF print...', { title, headers, data, filename, footer });

        const doc = new jsPDF();
        console.log('jsPDF instance created:', doc);

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

        // Add table using autoTable function
        console.log('Calling autoTable...');
        autoTable(doc, {
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
        console.log('autoTable completed successfully');

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

        // Open print dialog
        console.log('Opening print dialog...');
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
        console.log('Print dialog opened successfully!');
    } catch (error) {
        console.error('Error printing PDF:', error);
        alert(`Failed to print PDF: ${error.message}`);
        throw error;
    }
}

/**
 * Export split table data to PDF (for HO Branch Leader - Negative on Left, Positive on Right)
 * @param {Object} options - Configuration object
 * @param {string} options.title - PDF document title
 * @param {Array} options.headers - Array of column headers
 * @param {Array} options.negativeData - Array of negative branch rows
 * @param {Array} options.positiveData - Array of positive branch rows
 * @param {string} options.filename - Output filename (without .pdf extension)
 * @param {Object} options.negativeTotals - Totals for negative branches
 * @param {Object} options.positiveTotals - Totals for positive branches
 * @param {number} options.hoBalance - HO Balance
 */
export const exportSplitTableToPDF = ({ title, headers, negativeData, positiveData, filename, negativeTotals, positiveTotals, hoBalance }) => {
    try {
        console.log('Starting split PDF export...', { title, headers, negativeData, positiveData, filename });

        const doc = new jsPDF('landscape'); // Use landscape for side-by-side tables
        console.log('jsPDF instance created:', doc);

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

        // Column widths for side-by-side layout
        const pageWidth = doc.internal.pageSize.width;
        const margin = 14;
        const tableWidth = (pageWidth - margin * 3) / 2; // Split page into two equal tables with margins

        // Add total row to negative data
        const negativeDataWithTotal = [
            ...negativeData,
            ['', 'TOTAL', formatNumber(negativeTotals.balance), formatNumber(negativeTotals.commission), formatNumber(negativeTotals.total)]
        ];

        // Left table - Negative branches
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Negative Branches (${negativeData.length})`, margin, 38);

        autoTable(doc, {
            head: [headers],
            body: negativeDataWithTotal,
            startY: 42,
            theme: 'grid',
            tableWidth: tableWidth,
            margin: { left: margin, right: margin + tableWidth + margin },
            headStyles: {
                fillColor: [59, 130, 246], // Blue color
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            didParseCell: function (data) {
                // Make the last row (total row) bold
                if (data.row.index === negativeDataWithTotal.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [229, 231, 235]; // Gray background for total
                }
            }
        });

        // Add total row to positive data
        const positiveDataWithTotal = [
            ...positiveData,
            ['', 'TOTAL', formatNumber(positiveTotals.balance), formatNumber(positiveTotals.commission), formatNumber(positiveTotals.total)]
        ];

        // Right table - Positive branches
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Positive Branches (${positiveData.length})`, margin + tableWidth + margin, 38);

        autoTable(doc, {
            head: [headers],
            body: positiveDataWithTotal,
            startY: 42,
            theme: 'grid',
            tableWidth: tableWidth,
            margin: { left: margin + tableWidth + margin, right: margin },
            headStyles: {
                fillColor: [59, 130, 246], // Blue color
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            didParseCell: function (data) {
                // Make the last row (total row) bold
                if (data.row.index === positiveDataWithTotal.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [229, 231, 235]; // Gray background for total
                }
            }
        });

        console.log('Split tables completed successfully');

        // Add HO Balance at the bottom
        const finalY = Math.max(
            doc.autoTable?.previous?.finalY || 0,
            doc.lastAutoTable?.finalY || 0
        ) + 15;

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`HO Balance: ${formatNumber(hoBalance)}`, margin, finalY);

        // Save the PDF
        console.log('Saving PDF with filename:', `${filename}.pdf`);
        doc.save(`${filename}.pdf`);
        console.log('PDF saved successfully!');
    } catch (error) {
        console.error('Error generating split PDF:', error);
        alert(`Failed to generate PDF: ${error.message}`);
        throw error;
    }
}

/**
 * Print split table data to PDF (Opens print dialog instead of downloading)
 * @param {Object} options - Configuration object (same as exportSplitTableToPDF)
 */
export const printSplitTableToPDF = ({ title, headers, negativeData, positiveData, filename, negativeTotals, positiveTotals, hoBalance }) => {
    try {
        console.log('Starting split PDF print...');

        const doc = new jsPDF('landscape');

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

        // Column widths for side-by-side layout
        const pageWidth = doc.internal.pageSize.width;
        const margin = 14;
        const tableWidth = (pageWidth - margin * 3) / 2;

        // Add total row to negative data
        const negativeDataWithTotal = [
            ...negativeData,
            ['', 'TOTAL', formatNumber(negativeTotals.balance), formatNumber(negativeTotals.commission), formatNumber(negativeTotals.total)]
        ];

        // Left table - Negative branches
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Negative Branches (${negativeData.length})`, margin, 38);

        autoTable(doc, {
            head: [headers],
            body: negativeDataWithTotal,
            startY: 42,
            theme: 'grid',
            tableWidth: tableWidth,
            margin: { left: margin, right: margin + tableWidth + margin },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            didParseCell: function (data) {
                if (data.row.index === negativeDataWithTotal.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [229, 231, 235];
                }
            }
        });

        // Add total row to positive data
        const positiveDataWithTotal = [
            ...positiveData,
            ['', 'TOTAL', formatNumber(positiveTotals.balance), formatNumber(positiveTotals.commission), formatNumber(positiveTotals.total)]
        ];

        // Right table - Positive branches
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Positive Branches (${positiveData.length})`, margin + tableWidth + margin, 38);

        autoTable(doc, {
            head: [headers],
            body: positiveDataWithTotal,
            startY: 42,
            theme: 'grid',
            tableWidth: tableWidth,
            margin: { left: margin + tableWidth + margin, right: margin },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            didParseCell: function (data) {
                if (data.row.index === positiveDataWithTotal.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [229, 231, 235];
                }
            }
        });

        // Add HO Balance at the bottom
        const finalY = Math.max(
            doc.autoTable?.previous?.finalY || 0,
            doc.lastAutoTable?.finalY || 0
        ) + 15;

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`HO Balance: ${formatNumber(hoBalance)}`, margin, finalY);

        // Open print dialog
        console.log('Opening print dialog...');
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
        console.log('Print dialog opened successfully!');
    } catch (error) {
        console.error('Error printing split PDF:', error);
        alert(`Failed to print PDF: ${error.message}`);
        throw error;
    }
}

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
