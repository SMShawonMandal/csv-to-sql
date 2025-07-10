class CSVToSQLConverter {
    constructor() {
        this.csvData = null;
        this.fileName = '';
        this.allFiles = []; // Store multiple files
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');
        const copyBtn = document.getElementById('copyBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        // Drag and drop events
        dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        dropZone.addEventListener('drop', this.handleDrop.bind(this));
        dropZone.addEventListener('click', (e) => {
            // Only trigger file input if not clicking on the browse button
            if (e.target !== browseBtn && !browseBtn.contains(e.target)) {
                fileInput.click();
            }
        });

        // File input events
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Button events
        copyBtn.addEventListener('click', this.copyToClipboard.bind(this));
        downloadBtn.addEventListener('click', this.downloadSQL.bind(this));

        // Real-time SQL generation when options change
        document.getElementById('tableName').addEventListener('input', () => {
            if (this.allFiles.length > 0) {
                this.processAllFiles();
            } else if (this.csvData) {
                this.generateSQL();
            }
        });
        document.getElementById('dbType').addEventListener('change', () => {
            if (this.allFiles.length > 0) {
                this.processAllFiles();
            } else if (this.csvData) {
                this.generateSQL();
            }
        });
        document.getElementById('varcharLength').addEventListener('input', () => {
            if (this.allFiles.length > 0) {
                this.processAllFiles();
            } else if (this.csvData) {
                this.generateSQL();
            }
        });
        document.getElementById('includeDropTable').addEventListener('change', () => {
            if (this.allFiles.length > 0) {
                this.processAllFiles();
            } else if (this.csvData) {
                this.generateSQL();
            }
        });
        document.getElementById('includeInserts').addEventListener('change', () => {
            if (this.allFiles.length > 0) {
                this.processAllFiles();
            } else if (this.csvData) {
                this.generateSQL();
            }
        });
        document.getElementById('optimizeTypes').addEventListener('change', () => {
            if (this.allFiles.length > 0) {
                this.processAllFiles();
            } else if (this.csvData) {
                this.generateSQL();
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('dropZone').classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('dropZone').classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('dropZone').classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            this.processMultipleFiles(files);
        }
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.processMultipleFiles(files);
        }
    }

    processFile(file) {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showError('Please select a CSV file.');
            return;
        }

        this.fileName = file.name.replace('.csv', '');
        this.showFileInfo(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.csvData = this.parseCSV(e.target.result);
                this.updateTableName();
                this.showOptions();
                this.generateSQL();
            } catch (error) {
                this.showError('Error parsing CSV file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row.');
        }

        const headers = this.parseCSVLine(lines[0]);
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const row = this.parseCSVLine(lines[i]);
                if (row.length === headers.length) {
                    rows.push(row);
                }
            }
        }

        return { headers, rows };
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    updateTableName() {
        const tableNameInput = document.getElementById('tableName');
        if (!tableNameInput.value && this.fileName) {
            tableNameInput.value = this.fileName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        }
    }

    showFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileDetails = document.getElementById('fileDetails');
        
        fileDetails.innerHTML = `
            <div><strong>File Name:</strong> ${file.name}</div>
            <div><strong>File Size:</strong> ${this.formatFileSize(file.size)}</div>
            <div><strong>Last Modified:</strong> ${new Date(file.lastModified).toLocaleString()}</div>
        `;
        
        fileInfo.style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showOptions() {
        document.getElementById('optionsSection').style.display = 'block';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(errorDiv, container.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(successDiv, container.firstChild);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    detectColumnType(columnData, columnName) {
        if (!columnData || columnData.length === 0) {
            return 'VARCHAR(255)';
        }

        let hasNumbers = 0;
        let hasDecimals = 0;
        let hasIntegers = 0;
        let hasDates = 0;
        let hasDateTimes = 0;
        let hasBooleans = 0;
        let hasEmails = 0;
        let hasUrls = 0;
        let hasUUIDs = 0;
        let hasJSON = 0;
        let hasLongText = 0;
        let maxLength = 0;
        let maxIntegerValue = 0;
        let hasNegativeNumbers = 0;

        for (const value of columnData) {
            const trimmedValue = String(value).trim();
            
            if (trimmedValue === '' || trimmedValue.toLowerCase() === 'null') {
                continue;
            }

            maxLength = Math.max(maxLength, trimmedValue.length);

            // Check for long text (> 500 characters)
            if (trimmedValue.length > 500) {
                hasLongText++;
            }

            // Check for JSON
            if (this.isJSON(trimmedValue)) {
                hasJSON++;
            }
            // Check for UUID
            else if (this.isUUID(trimmedValue)) {
                hasUUIDs++;
            }
            // Check for Email
            else if (this.isEmail(trimmedValue)) {
                hasEmails++;
            }
            // Check for URL
            else if (this.isURL(trimmedValue)) {
                hasUrls++;
            }
            // Check for Boolean
            else if (this.isBoolean(trimmedValue)) {
                hasBooleans++;
            }
            // Check if it's a date/datetime
            else if (this.isDateValue(trimmedValue, columnName)) {
                if (this.isDateTimeValue(trimmedValue)) {
                    hasDateTimes++;
                } else {
                    hasDates++;
                }
            }
            // Check if it's a number
            else if (!isNaN(trimmedValue) && !isNaN(parseFloat(trimmedValue))) {
                hasNumbers++;
                const numValue = parseFloat(trimmedValue);
                
                if (numValue < 0) {
                    hasNegativeNumbers++;
                }
                
                if (trimmedValue.includes('.') || trimmedValue.includes('e') || trimmedValue.includes('E')) {
                    hasDecimals++;
                } else {
                    hasIntegers++;
                    maxIntegerValue = Math.max(maxIntegerValue, Math.abs(numValue));
                }
            }
        }

        const totalNonEmpty = columnData.filter(v => 
            String(v).trim() !== '' && String(v).trim().toLowerCase() !== 'null'
        ).length;

        const threshold = totalNonEmpty * 0.8; // 80% threshold for type detection

        // JSON detection (high priority)
        if (hasJSON > totalNonEmpty * 0.6) {
            return 'JSON';
        }

        // UUID detection
        if (hasUUIDs > threshold) {
            return 'UUID';
        }

        // Boolean detection
        if (hasBooleans > threshold) {
            return 'BOOLEAN';
        }

        // Email detection
        if (hasEmails > threshold) {
            return 'VARCHAR(320)'; // RFC 5321 email max length
        }

        // URL detection
        if (hasUrls > threshold) {
            return 'TEXT'; // URLs can be very long
        }

        // Date/DateTime detection
        if ((hasDates + hasDateTimes) > threshold) {
            if (hasDateTimes > hasDates) {
                return 'TIMESTAMP';
            } else {
                return 'DATE';
            }
        }

        // Numeric type detection
        if (hasNumbers > threshold) {
            if (hasDecimals > 0) {
                // Check for high precision requirements
                if (this.hasHighPrecision(columnData)) {
                    return 'DECIMAL(15,4)'; // Good for financial data
                } else {
                    return 'DOUBLE PRECISION';
                }
            } else {
                // Integer type selection - simplified and safe approach
                if (maxIntegerValue <= 2147483647) {
                    return 'INTEGER'; // Standard signed INTEGER (-2B to +2B)
                } else if (maxIntegerValue <= 4294967295 && hasNegativeNumbers === 0) {
                    return 'INTEGER UNSIGNED'; // Unsigned INTEGER (0 to 4B)
                } else {
                    return 'BIGINT'; // For very large numbers
                }
            }
        }

        // Text type selection based on length
        // If ANY row has very long text (>1000 chars), use TEXT
        if (maxLength > 1000) {
            if (maxLength > 65535) {
                return 'LONGTEXT'; // > 64KB
            } else if (maxLength > 16777215) {
                return 'MEDIUMTEXT'; // > 16MB (this is actually smaller, but keeping for completeness)
            } else {
                return 'TEXT'; // > 1000 chars
            }
        }
        
        // If 30% of rows have moderately long text (>500 chars), use TEXT
        if (hasLongText > totalNonEmpty * 0.3) {
            return 'TEXT';
        }
        
        // If ANY single row is longer than VARCHAR limit, use TEXT
        if (maxLength > 65535) {
            return 'TEXT';
        }

        // VARCHAR with optimized length
        const varcharLength = document.getElementById('varcharLength')?.value || 255;
        let suggestedLength;
        
        if (maxLength <= 50) {
            suggestedLength = 50;
        } else if (maxLength <= 100) {
            suggestedLength = 100;
        } else if (maxLength <= 255) {
            suggestedLength = 255;
        } else if (maxLength <= 500) {
            suggestedLength = 500;
        } else if (maxLength <= 1000) {
            // For medium-length content, use TEXT instead of very large VARCHAR
            return 'TEXT';
        } else {
            suggestedLength = Math.min(Math.ceil(maxLength * 1.2), varcharLength);
        }

        // If suggested length is too large, use TEXT instead
        if (suggestedLength > 65535) {
            return 'TEXT';
        }

        return `VARCHAR(${suggestedLength})`;
    }

    isJSON(value) {
        try {
            const trimmed = value.trim();
            if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                return false;
            }
            JSON.parse(trimmed);
            return true;
        } catch {
            return false;
        }
    }

    isUUID(value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }

    isEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) && value.length <= 320;
    }

    isURL(value) {
        try {
            new URL(value);
            return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('ftp://');
        } catch {
            return false;
        }
    }

    isBoolean(value) {
        const lowerValue = value.toLowerCase();
        const booleanValues = ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n', 't', 'f'];
        return booleanValues.includes(lowerValue);
    }

    hasHighPrecision(columnData) {
        let highPrecisionCount = 0;
        for (const value of columnData) {
            const trimmedValue = String(value).trim();
            if (!isNaN(trimmedValue) && trimmedValue.includes('.')) {
                const decimalPart = trimmedValue.split('.')[1];
                if (decimalPart && decimalPart.length > 2) {
                    highPrecisionCount++;
                }
            }
        }
        return highPrecisionCount > columnData.length * 0.3; // 30% have high precision
    }

    isDateValue(value, columnName) {
        // Common date patterns (date only)
        const datePatterns = [
            /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD or YYYY-M-D
            /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY or M/D/YYYY
            /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-DD-YYYY or M-D-YYYY
            /^\d{4}\/\d{1,2}\/\d{1,2}$/, // YYYY/MM/DD or YYYY/M/D
            /^\d{1,2}\.\d{1,2}\.\d{4}$/, // MM.DD.YYYY or M.D.YYYY
            /^\d{4}\.\d{1,2}\.\d{1,2}$/, // YYYY.MM.DD or YYYY.M.D
        ];

        // DateTime patterns (includes time component)
        const dateTimePatterns = [
            /^\d{4}-\d{1,2}-\d{1,2}\s\d{1,2}:\d{1,2}/, // YYYY-MM-DD HH:MM
            /^\d{1,2}\/\d{1,2}\/\d{4}\s\d{1,2}:\d{1,2}/, // MM/DD/YYYY HH:MM
            /^\d{4}-\d{1,2}-\d{1,2}T\d{1,2}:\d{1,2}/, // ISO format
        ];

        // Check if value matches any date or datetime pattern
        const matchesDatePattern = datePatterns.some(pattern => pattern.test(value));
        const matchesDateTimePattern = dateTimePatterns.some(pattern => pattern.test(value));
        
        if (matchesDatePattern || matchesDateTimePattern) {
            // Try to parse as date to validate
            const date = new Date(value);
            return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
        }

        // Check if column name suggests it's a date
        const dateKeywords = ['date', 'time', 'created', 'updated', 'modified', 'birth', 'start', 'end', 'pickup', 'return', 'due', 'expire', 'login'];
        const columnLower = columnName.toLowerCase();
        const hasDateKeyword = dateKeywords.some(keyword => columnLower.includes(keyword));
        
        if (hasDateKeyword) {
            const date = new Date(value);
            return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
        }

        return false;
    }

    isDateTimeValue(value) {
        // DateTime patterns (includes time component)
        const dateTimePatterns = [
            /^\d{4}-\d{1,2}-\d{1,2}\s\d{1,2}:\d{1,2}/, // YYYY-MM-DD HH:MM
            /^\d{1,2}\/\d{1,2}\/\d{4}\s\d{1,2}:\d{1,2}/, // MM/DD/YYYY HH:MM
            /^\d{4}-\d{1,2}-\d{1,2}T\d{1,2}:\d{1,2}/, // ISO format
        ];

        return dateTimePatterns.some(pattern => pattern.test(value));
    }

    formatDateForSQL(dateString, includeTime = false) {
        if (!dateString || dateString.trim() === '') {
            return null;
        }

        try {
            let date;
            
            // Handle different date/datetime formats
            const trimmed = dateString.trim();
            
            // Check for MM/DD/YYYY HH:MM format
            const mmddyyyyTime = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
            if (mmddyyyyTime) {
                const [, month, day, year, hour, minute, second] = mmddyyyyTime;
                date = new Date(year, month - 1, day, hour, minute, second || 0);
            }
            // Check for MM/DD/YYYY format (date only)
            else if (trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)) {
                const [, month, day, year] = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                date = new Date(year, month - 1, day);
            }
            // Check for YYYY-MM-DD HH:MM:SS format
            else if (trimmed.match(/^\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{1,2}/)) {
                date = new Date(trimmed);
            }
            // Check for ISO format (YYYY-MM-DDTHH:MM:SS)
            else if (trimmed.match(/^\d{4}-\d{1,2}-\d{1,2}T\d{1,2}:\d{1,2}/)) {
                date = new Date(trimmed);
            }
            // Try standard date parsing as fallback
            else {
                date = new Date(trimmed);
            }
            
            // Validate the date
            if (isNaN(date.getTime()) || date.getFullYear() < 1900 || date.getFullYear() > 2100) {
                return null;
            }
            
            // Format the output
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            if (includeTime) {
                const hour = String(date.getHours()).padStart(2, '0');
                const minute = String(date.getMinutes()).padStart(2, '0');
                const second = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
            } else {
                return `${year}-${month}-${day}`;
            }
        } catch (error) {
            return null;
        }
    }

    generateSQL() {
        if (!this.csvData) return;

        const tableName = document.getElementById('tableName').value || 'imported_table';
        const includeDropTable = document.getElementById('includeDropTable').checked;
        const includeInserts = document.getElementById('includeInserts').checked;

        let sql = '';

        // Drop table statement
        if (includeDropTable) {
            sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        }

        // Create table statement
        sql += `CREATE TABLE \`${tableName}\` (\n`;

        // Get column data for type detection
        const columnData = {};
        this.csvData.headers.forEach((header, index) => {
            columnData[header] = this.csvData.rows.map(row => row[index]);
        });

        // Cache column types to avoid repeated detection
        const columnTypes = {};
        this.csvData.headers.forEach(header => {
            columnTypes[header] = this.detectColumnType(columnData[header], header);
        });

        // Add column definitions
        const columnDefs = this.csvData.headers.map(header => {
            const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            const columnType = columnTypes[header];
            return `    \`${cleanHeader}\`\t${columnType}`;
        });

        sql += columnDefs.join(',\n');
        sql += '\n);\n';

        // Insert statements
        if (includeInserts && this.csvData.rows.length > 0) {
            sql += '\n';
            sql += `INSERT INTO \`${tableName}\` \nVALUES `;
            
            const valueRows = [];
            for (const row of this.csvData.rows) {
                const values = row.map((value, index) => {
                    if (value === null || value === undefined || value === '') {
                        return 'NULL';
                    }
                    
                    const stringValue = String(value).trim();
                    const header = this.csvData.headers[index];
                    const columnType = columnTypes[header]; // Use cached type
                    
                    // Handle date/datetime columns
                    if (columnType === 'DATE') {
                        const formattedDate = this.formatDateForSQL(stringValue, false);
                        return formattedDate ? `'${formattedDate}'` : 'NULL';
                    } else if (columnType === 'DATETIME' || columnType === 'TIMESTAMP') {
                        const formattedDateTime = this.formatDateForSQL(stringValue, true);
                        return formattedDateTime ? `'${formattedDateTime}'` : 'NULL';
                    }
                    
                    // Handle boolean columns
                    if (columnType === 'BOOLEAN') {
                        const lowerValue = stringValue.toLowerCase();
                        if (['true', 'yes', '1', 'y', 't'].includes(lowerValue)) {
                            return 'TRUE';
                        } else if (['false', 'no', '0', 'n', 'f'].includes(lowerValue)) {
                            return 'FALSE';
                        } else {
                            return 'NULL';
                        }
                    }
                    
                    // Handle JSON columns
                    if (columnType === 'JSON') {
                        if (stringValue.toLowerCase() === 'null') {
                            return 'NULL';
                        }
                        // Escape single quotes in JSON and wrap in quotes
                        return `'${stringValue.replace(/'/g, "''")}'`;
                    }
                    
                    // Handle numeric columns (integers and decimals)
                    if (columnType.includes('INT') || columnType.includes('DECIMAL') || columnType.includes('DOUBLE')) {
                        if (!isNaN(stringValue) && !isNaN(parseFloat(stringValue)) && stringValue !== '') {
                            return stringValue;
                        } else {
                            return 'NULL';
                        }
                    }
                    
                    // Check if it's a number (fallback for unrecognized numeric types)
                    if (!isNaN(stringValue) && !isNaN(parseFloat(stringValue)) && stringValue !== '') {
                        return stringValue;
                    }
                    
                    // Handle all other types (VARCHAR, TEXT, UUID, etc.) - escape single quotes and wrap in quotes
                    return `'${stringValue.replace(/'/g, "''")}'`;
                });
                
                valueRows.push(`(${values.join(', ')})`);
            }
            
            sql += valueRows.join(',\n');
            sql += ';\n';
        }

        this.displaySQL(sql);
    }

    displaySQL(sql) {
        const sqlOutput = document.getElementById('sqlOutput');
        const resultSection = document.getElementById('resultSection');
        
        sqlOutput.textContent = sql;
        resultSection.style.display = 'block';
        
        // Scroll to results
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    async copyToClipboard() {
        const sqlOutput = document.getElementById('sqlOutput');
        try {
            await navigator.clipboard.writeText(sqlOutput.textContent);
            this.showSuccess('SQL copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = sqlOutput.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccess('SQL copied to clipboard!');
        }
    }

    downloadSQL() {
        const sqlOutput = document.getElementById('sqlOutput');
        let fileName = 'combined_tables.sql';
        
        if (this.allFiles.length === 1) {
            fileName = `${this.sanitizeTableName(this.allFiles[0].name.replace('.csv', ''))}.sql`;
        } else if (this.allFiles.length > 1) {
            fileName = `combined_${this.allFiles.length}_tables.sql`;
        } else if (this.fileName) {
            fileName = `${this.sanitizeTableName(this.fileName)}.sql`;
        }
        
        const blob = new Blob([sqlOutput.textContent], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess(`SQL file "${fileName}" downloaded!`);
    }

    processMultipleFiles(files) {
        // Filter only CSV files
        const csvFiles = files.filter(file => file.name.toLowerCase().endsWith('.csv'));
        
        if (csvFiles.length === 0) {
            this.showError('Please select at least one CSV file.');
            return;
        }

        if (csvFiles.length !== files.length) {
            this.showError(`${files.length - csvFiles.length} non-CSV file(s) were ignored. Only CSV files are supported.`);
        }

        this.allFiles = csvFiles;
        this.showMultipleFileInfo(csvFiles);
        this.processAllFiles();
    }

    async processAllFiles() {
        try {
            this.showOptions();
            
            // Process all files concurrently
            const filePromises = this.allFiles.map(file => this.parseFileAsync(file));
            const results = await Promise.all(filePromises);
            
            // Generate combined SQL
            this.generateMultipleSQL(results);
            
        } catch (error) {
            this.showError('Error processing files: ' + error.message);
        }
    }

    parseFileAsync(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csvData = this.parseCSV(e.target.result);
                    const fileName = file.name.replace('.csv', '');
                    resolve({ fileName, csvData, file });
                } catch (error) {
                    reject(new Error(`Error parsing ${file.name}: ${error.message}`));
                }
            };
            reader.onerror = () => reject(new Error(`Error reading ${file.name}`));
            reader.readAsText(file);
        });
    }

    showMultipleFileInfo(files) {
        const fileInfo = document.getElementById('fileInfo');
        const fileDetails = document.getElementById('fileDetails');
        
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        
        fileDetails.innerHTML = `
            <div><strong>Files Selected:</strong> ${files.length}</div>
            <div><strong>Total Size:</strong> ${this.formatFileSize(totalSize)}</div>
            <div><strong>Files:</strong></div>
            <ul style="margin-left: 20px; margin-top: 5px;">
                ${files.map(file => `<li>${file.name} (${this.formatFileSize(file.size)})</li>`).join('')}
            </ul>
        `;
        
        fileInfo.style.display = 'block';
    }

    generateMultipleSQL(results) {
        const includeDropTable = document.getElementById('includeDropTable').checked;
        const includeInserts = document.getElementById('includeInserts').checked;
        
        let combinedSQL = '';
        
        results.forEach((result, index) => {
            const { fileName, csvData } = result;
            const tableName = this.sanitizeTableName(fileName);
            
            if (index > 0) {
                combinedSQL += '\n-- ========================================\n';
                combinedSQL += `-- Table: ${tableName}\n`;
                combinedSQL += '-- ========================================\n\n';
            } else {
                combinedSQL += `-- Generated SQL for ${results.length} CSV file${results.length > 1 ? 's' : ''}\n`;
                combinedSQL += `-- ========================================\n`;
                combinedSQL += `-- Table: ${tableName}\n`;
                combinedSQL += '-- ========================================\n\n';
            }
            
            const sql = this.generateSQLForFile(csvData, tableName, includeDropTable, includeInserts);
            combinedSQL += sql;
            
            if (index < results.length - 1) {
                combinedSQL += '\n';
            }
        });
        
        this.displaySQL(combinedSQL);
        this.updateDownloadButton(results);
    }

    generateSQLForFile(csvData, tableName, includeDropTable, includeInserts) {
        let sql = '';

        // Drop table statement
        if (includeDropTable) {
            sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        }

        // Create table statement
        sql += `CREATE TABLE \`${tableName}\` (\n`;

        // Get column data for type detection
        const columnData = {};
        csvData.headers.forEach((header, index) => {
            columnData[header] = csvData.rows.map(row => row[index]);
        });

        // Cache column types to avoid repeated detection
        const columnTypes = {};
        csvData.headers.forEach(header => {
            columnTypes[header] = this.detectColumnType(columnData[header], header);
        });

        // Add column definitions
        const columnDefs = csvData.headers.map(header => {
            const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            const columnType = columnTypes[header];
            return `    \`${cleanHeader}\`\t${columnType}`;
        });

        sql += columnDefs.join(',\n');
        sql += '\n);\n';

        // Insert statements
        if (includeInserts && csvData.rows.length > 0) {
            sql += '\n';
            sql += `INSERT INTO \`${tableName}\` \nVALUES `;
            
            const valueRows = [];
            for (const row of csvData.rows) {
                const values = row.map((value, index) => {
                    if (value === null || value === undefined || value === '') {
                        return 'NULL';
                    }
                    
                    const stringValue = String(value).trim();
                    const header = csvData.headers[index];
                    const columnType = columnTypes[header];
                    
                    // Handle date/datetime columns
                    if (columnType === 'DATE') {
                        const formattedDate = this.formatDateForSQL(stringValue, false);
                        return formattedDate ? `'${formattedDate}'` : 'NULL';
                    } else if (columnType === 'DATETIME' || columnType === 'TIMESTAMP') {
                        const formattedDateTime = this.formatDateForSQL(stringValue, true);
                        return formattedDateTime ? `'${formattedDateTime}'` : 'NULL';
                    }
                    
                    // Handle boolean columns
                    if (columnType === 'BOOLEAN') {
                        const lowerValue = stringValue.toLowerCase();
                        if (['true', 'yes', '1', 'y', 't'].includes(lowerValue)) {
                            return 'TRUE';
                        } else if (['false', 'no', '0', 'n', 'f'].includes(lowerValue)) {
                            return 'FALSE';
                        } else {
                            return 'NULL';
                        }
                    }
                    
                    // Handle JSON columns
                    if (columnType === 'JSON') {
                        if (stringValue.toLowerCase() === 'null') {
                            return 'NULL';
                        }
                        // Escape single quotes in JSON and wrap in quotes
                        return `'${stringValue.replace(/'/g, "''")}'`;
                    }
                    
                    // Handle numeric columns (integers and decimals)
                    if (columnType.includes('INT') || columnType.includes('DECIMAL') || columnType.includes('DOUBLE')) {
                        if (!isNaN(stringValue) && !isNaN(parseFloat(stringValue)) && stringValue !== '') {
                            return stringValue;
                        } else {
                            return 'NULL';
                        }
                    }
                    
                    // Check if it's a number (fallback for unrecognized numeric types)
                    if (!isNaN(stringValue) && !isNaN(parseFloat(stringValue)) && stringValue !== '') {
                        return stringValue;
                    }
                    
                    // Handle all other types (VARCHAR, TEXT, UUID, etc.) - escape single quotes and wrap in quotes
                    return `'${stringValue.replace(/'/g, "''")}'`;
                });
                
                valueRows.push(`(${values.join(', ')})`);
            }
            
            sql += valueRows.join(',\n');
            sql += ';\n';
        }

        return sql;
    }

    sanitizeTableName(fileName) {
        return fileName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }

    updateDownloadButton(results) {
        const downloadBtn = document.getElementById('downloadBtn');
        if (results.length === 1) {
            downloadBtn.textContent = `Download ${results[0].fileName}.sql`;
        } else {
            downloadBtn.textContent = `Download combined_tables.sql`;
        }
    }

    convertToPostgreSQL(mysqlType) {
        const typeMap = {
            'INTEGER': 'INTEGER',
            'INTEGER UNSIGNED': 'BIGINT',       // PostgreSQL INTEGER is signed only
            'BIGINT': 'BIGINT',
            'DOUBLE PRECISION': 'DOUBLE PRECISION',
            'DECIMAL(15,4)': 'DECIMAL(15,4)',
            'DATE': 'DATE',
            'TIMESTAMP': 'TIMESTAMP',
            'DATETIME': 'TIMESTAMP',
            'BOOLEAN': 'BOOLEAN',
            'JSON': 'JSON',
            'UUID': 'UUID',
            'TEXT': 'TEXT',
            'MEDIUMTEXT': 'TEXT',
            'LONGTEXT': 'TEXT'
        };

        // Handle VARCHAR with length
        if (mysqlType.startsWith('VARCHAR')) {
            return mysqlType; // PostgreSQL supports VARCHAR(n) syntax
        }

        return typeMap[mysqlType] || mysqlType;
    }

    getOptimizedDataType(baseType) {
        const optimizeTypes = document.getElementById('optimizeTypes')?.checked;
        if (!optimizeTypes) {
            // Return simplified types when optimization is disabled
            if (baseType.includes('INTEGER') || baseType.includes('BIGINT')) {
                return 'INTEGER';
            }
            if (baseType.includes('DECIMAL') || baseType.includes('DOUBLE')) {
                return 'DECIMAL(10,2)';
            }
            if (baseType === 'TIMESTAMP') {
                return 'TIMESTAMP';
            }
            if (baseType === 'BOOLEAN') {
                return 'BOOLEAN';
            }
            if (baseType === 'JSON') {
                return 'TEXT'; // Fallback for compatibility
            }
            if (baseType === 'UUID') {
                return 'VARCHAR(36)';
            }
            if (baseType.includes('TEXT')) {
                return 'TEXT';
            }
        }
        return baseType;
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CSVToSQLConverter();
});
