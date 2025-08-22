// Barcode Label Generator Application
class BarcodeApp {
    constructor() {
        this.data = [];
        this.currentProduct = null;
        
        // Initialize with sample data
        this.loadSampleData();
        
        // Initialize UI
        this.initializeUI();
        this.setupEventListeners();
        this.renderTable();
        this.updateSummary();
    }

    loadSampleData() {
        // Sample data from the provided JSON
        this.data = [
            {
                "FileName": "WSN_DETAILS_1615166",
                "Order ID": 1615166,
                "WSN": "19FHFJ_U",
                "WID": "XIFKJOQ",
                "FSN": "BLBF5JCWCST3FVGY",
                "SKU": "SKU000000000000000",
                "Listing ID": "LSTBLBF5JCWCST3FVGYANYR1Q",
                "Order ID.1": 1572703,
                "QC Remark": "",
                "FSP": 119,
                "MRP": 199,
                "PRODUCT TITTLE": "EVEREADY 10 W Round B22 LED Bulb",
                "Brand": "EVEREADY",
                "Vertical": "bulb",
                "Cost": 5
            },
            {
                "FileName": "WSN_DETAILS_1615166",
                "Order ID": 1615166,
                "WSN": "19GAZD_A",
                "WID": "XI4DS29",
                "FSN": "BLBDYGA8BFAHFZFU",
                "SKU": "SKUFBFRF5FR8BMT6",
                "Listing ID": "LSTBLBDYGA8BFAHFZFURXU7WB",
                "Order ID.1": 1572703,
                "QC Remark": "",
                "FSP": 426,
                "MRP": 449,
                "PRODUCT TITTLE": "EVEREADY 7 W Standard B22 LED Bulb",
                "Brand": "EVEREADY",
                "Vertical": "bulb",
                "Cost": 5
            }
        ];
    }

    initializeUI() {
        // Get DOM elements
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadStatus = document.getElementById('uploadStatus');
        this.totalRecords = document.getElementById('totalRecords');
        this.lastUpdated = document.getElementById('lastUpdated');
        this.tableBody = document.getElementById('tableBody');
        this.tableSearch = document.getElementById('tableSearch');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.productInfo = document.getElementById('productInfo');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.generateLabelBtn = document.getElementById('generateLabelBtn');
        this.labelSection = document.getElementById('labelSection');
        this.labelCanvas = document.getElementById('labelCanvas');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.printBtn = document.getElementById('printBtn');

        // Product info elements
        this.productTitle = document.getElementById('productTitle');
        this.productFSN = document.getElementById('productFSN');
        this.productBrand = document.getElementById('productBrand');
        this.productMRP = document.getElementById('productMRP');
        this.productFSP = document.getElementById('productFSP');
        this.productVertical = document.getElementById('productVertical');
    }

    setupEventListeners() {
        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        
        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFileUpload(e);
        });

        // Search functionality
        this.searchBtn.addEventListener('click', () => this.searchProduct());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchProduct();
            }
        });

        // Clear search when input is cleared
        this.searchInput.addEventListener('input', (e) => {
            if (!e.target.value.trim()) {
                this.hideProductInfo();
                this.hideError();
                this.labelSection.classList.add('hidden');
            }
        });

        // Table search
        this.tableSearch.addEventListener('input', (e) => this.filterTable(e.target.value));

        // Label generation
        this.generateLabelBtn.addEventListener('click', () => this.generateLabel());

        // Download and print
        this.downloadBtn.addEventListener('click', () => this.downloadLabel());
        this.printBtn.addEventListener('click', () => this.printLabel());
    }

    handleFileUpload(e) {
        const files = e.target?.files || e.dataTransfer?.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            if (file.name.endsWith('.csv')) {
                this.parseCSV(file);
            } else if (file.name.endsWith('.xlsx')) {
                this.showStatus('Excel files are not fully supported in this demo. Please convert to CSV format.', 'error');
            } else {
                this.showStatus('Unsupported file format. Please upload CSV or Excel files.', 'error');
            }
        });
    }

    parseCSV(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                
                const newData = [];
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index] || '';
                        });
                        newData.push(row);
                    }
                }

                // Remove duplicates based on WSN and WID
                const existingKeys = new Set(this.data.map(item => `${item.WSN}_${item.WID}`));
                const uniqueNewData = newData.filter(item => !existingKeys.has(`${item.WSN}_${item.WID}`));

                this.data = [...this.data, ...uniqueNewData];
                this.renderTable();
                this.updateSummary();
                this.showStatus(`Successfully uploaded ${uniqueNewData.length} new records from ${file.name}`, 'success');
            } catch (error) {
                this.showStatus(`Error parsing CSV file: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }

    showStatus(message, type) {
        this.uploadStatus.textContent = message;
        this.uploadStatus.className = `upload-status ${type}`;
        this.uploadStatus.classList.remove('hidden');
        
        setTimeout(() => {
            this.uploadStatus.classList.add('hidden');
        }, 5000);
    }

    renderTable() {
        this.tableBody.innerHTML = '';
        this.data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td title="${row.WSN}">${row.WSN || 'N/A'}</td>
                <td title="${row.WID}">${row.WID || 'N/A'}</td>
                <td title="${row.FSN}">${row.FSN || 'N/A'}</td>
                <td title="${row['PRODUCT TITTLE']}">${row['PRODUCT TITTLE'] || 'N/A'}</td>
                <td>₹${row.MRP || 'N/A'}</td>
                <td>₹${row.FSP || 'N/A'}</td>
                <td>${row.Vertical || 'N/A'}</td>
                <td>${row.Brand || 'N/A'}</td>
            `;
            this.tableBody.appendChild(tr);
        });
    }

    filterTable(searchTerm) {
        const rows = this.tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const shouldShow = text.includes(searchTerm.toLowerCase());
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    updateSummary() {
        this.totalRecords.textContent = this.data.length;
        this.lastUpdated.textContent = new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    searchProduct() {
        const searchTerm = this.searchInput.value.trim().toUpperCase();
        if (!searchTerm) {
            this.showError('Please enter a WSN or WID');
            this.hideProductInfo();
            return;
        }

        // Search for product (case-insensitive)
        const product = this.data.find(item => 
            (item.WSN && item.WSN.toUpperCase() === searchTerm) || 
            (item.WID && item.WID.toUpperCase() === searchTerm)
        );

        if (product) {
            this.currentProduct = product;
            this.displayProductInfo(product);
            this.hideError();
        } else {
            this.showError(`Product not found for: ${searchTerm}`);
            this.hideProductInfo();
            this.currentProduct = null;
        }
    }

    displayProductInfo(product) {
        this.productTitle.textContent = product['PRODUCT TITTLE'] || 'N/A';
        this.productFSN.textContent = product.FSN || 'N/A';
        this.productBrand.textContent = product.Brand || 'N/A';
        this.productMRP.textContent = product.MRP || 'N/A';
        this.productFSP.textContent = product.FSP || 'N/A';
        this.productVertical.textContent = product.Vertical || 'N/A';
        
        this.productInfo.classList.remove('hidden');
    }

    hideProductInfo() {
        this.productInfo.classList.add('hidden');
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    generateLabel() {
        if (!this.currentProduct) {
            this.showError('No product selected. Please search for a product first.');
            return;
        }

        const canvas = this.labelCanvas;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set font properties
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Title - wrap text to fit
        ctx.font = 'bold 16px Arial';
        const title = this.currentProduct['PRODUCT TITTLE'] || 'N/A';
        const maxWidth = 570;
        this.wrapText(ctx, title, 10, 10, maxWidth, 20, 2);

        // Create barcode for FSN
        const barcodeCanvas = document.createElement('canvas');
        try {
            const fsn = this.currentProduct.FSN || '0000000000000000';
            JsBarcode(barcodeCanvas, fsn, {
                format: 'CODE128',
                width: 2,
                height: 100,
                displayValue: true,
                fontSize: 14,
                margin: 0,
                textAlign: 'center',
                textPosition: 'bottom',
                background: 'white',
                lineColor: 'black'
            });
            
            // Center barcode horizontally
            const barcodeX = (canvas.width - barcodeCanvas.width) / 2;
            ctx.drawImage(barcodeCanvas, barcodeX, 60);
        } catch (error) {
            console.error('Error generating barcode:', error);
            // Fallback text if barcode fails
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('FSN: ' + (this.currentProduct.FSN || 'N/A'), canvas.width / 2, 100);
            ctx.textAlign = 'left';
        }

        // Product details at bottom
        const bottomY = canvas.height - 60;
        ctx.font = 'bold 14px Arial';
        
        // First row
        ctx.fillText(`MRP: ₹${this.currentProduct.MRP || 'N/A'}`, 10, bottomY);
        ctx.fillText(`FSP: ₹${this.currentProduct.FSP || 'N/A'}`, 300, bottomY);
        
        // Second row
        ctx.fillText(`Category: ${this.currentProduct.Vertical || 'N/A'}`, 10, bottomY + 25);
        ctx.fillText(`Brand: ${this.currentProduct.Brand || 'N/A'}`, 300, bottomY + 25);

        // Show label section
        this.labelSection.classList.remove('hidden');
        
        // Scroll to label section
        this.labelSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        let lineCount = 0;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line.trim(), x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
                lineCount++;
                
                if (lineCount >= maxLines) {
                    // Add ellipsis if text is truncated
                    if (n < words.length - 1) {
                        ctx.fillText('...', x + ctx.measureText(line.trim()).width, currentY - lineHeight);
                    }
                    break;
                }
            } else {
                line = testLine;
            }
        }
        
        if (lineCount < maxLines && line.trim()) {
            ctx.fillText(line.trim(), x, currentY);
        }
    }

    downloadLabel() {
        if (!this.labelCanvas || !this.currentProduct) {
            this.showError('No label to download. Please generate a label first.');
            return;
        }
        
        // Create download link
        this.labelCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `label_${this.currentProduct.FSN || 'unknown'}_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    printLabel() {
        if (!this.labelCanvas || !this.currentProduct) {
            this.showError('No label to print. Please generate a label first.');
            return;
        }
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        const canvas = this.labelCanvas;
        const dataUrl = canvas.toDataURL('image/png');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Label - ${this.currentProduct.FSN}</title>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 0; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            min-height: 100vh; 
                        }
                        img { 
                            width: 5cm; 
                            height: 3cm; 
                            image-rendering: -webkit-optimize-contrast;
                            image-rendering: crisp-edges;
                            border: 1px solid #ccc;
                        }
                        @media print {
                            @page { 
                                size: 5cm 3cm; 
                                margin: 0; 
                            }
                            body { 
                                margin: 0; 
                                display: block; 
                            }
                            img { 
                                width: 5cm; 
                                height: 3cm; 
                                display: block;
                                border: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <img src="${dataUrl}" alt="Barcode Label for ${this.currentProduct.FSN}" />
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        }
                        window.onafterprint = function() {
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        
        printWindow.document.close();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BarcodeApp();
});