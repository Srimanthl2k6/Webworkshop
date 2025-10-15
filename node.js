const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { EventEmitter } = require('events');
const querystring = require('querystring');

// --- In-memory data store and CSV file path ---
const csvFilePath = path.join(__dirname, 'students.csv');
const dataEmitter = new EventEmitter();

// --- Event Listener ---
// Log to the console whenever data is modified.
dataEmitter.on('dataChanged', (action) => {
    console.log(`${new Date().toISOString()}: Data was ${action}.`);
});

/**
 * Reads and parses the student data from the CSV file.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of student objects.
 */
const getStudents = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(csvFilePath, 'utf8', (err, data) => {
            if (err) {
                // If the file doesn't exist, return an empty array.
                if (err.code === 'ENOENT') {
                    return resolve([]);
                }
                return reject(err);
            }
            if (!data) {
                return resolve([]);
            }
            // Parse CSV data
            const rows = data.trim().split('\n');
            const headers = rows.shift().split(',');
            const students = rows.map(row => {
                const values = row.split(',');
                let student = {};
                headers.forEach((header, index) => {
                    student[header.trim()] = values[index].trim();
                });
                return student;
            });
            resolve(students);
        });
    });
};

/**
 * Writes an array of student objects to the CSV file.
 * @param {Array<Object>} students - The array of student objects to write.
 * @returns {Promise<void>} A promise that resolves when the file is written.
 */
const saveStudents = (students) => {
    return new Promise((resolve, reject) => {
        if (students.length === 0) {
             fs.writeFile(csvFilePath, 'name,roll,marks', (err) => {
                if (err) return reject(err);
                resolve();
            });
            return;
        }
        const headers = Object.keys(students[0]).join(',');
        const rows = students.map(student => Object.values(student).join(','));
        const csvContent = `${headers}\n${rows.join('\n')}`;
        fs.writeFile(csvFilePath, csvContent, 'utf8', (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

// --- HTTP Server Logic ---
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    // --- CORS Headers ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // --- Routing ---
    if (pathname === '/' && method === 'GET') {
        // Serve the frontend HTML file
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (pathname === '/students' && method === 'GET') {
        // Get all students
        try {
            const students = await getStudents();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(students));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error fetching students', error: error.message }));
        }
    } else if (pathname === '/add' && method === 'POST') {
        // Add a new student
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const newStudent = querystring.parse(body);
                const students = await getStudents();
                students.push(newStudent);
                await saveStudents(students);
                dataEmitter.emit('dataChanged', 'added');
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Student added successfully', student: newStudent }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error adding student', error: error.message }));
            }
        });
    } else if (pathname === '/search' && method === 'GET') {
        // Search for a student
        const { name } = parsedUrl.query;
        if (!name) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Name query parameter is required' }));
        }
        try {
            const students = await getStudents();
            const results = students.filter(s => s.name.toLowerCase().includes(name.toLowerCase()));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error searching students', error: error.message }));
        }
    } else if (pathname === '/export' && method === 'GET') {
        // Export data to CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
        // Use a stream for efficient file handling
        fs.createReadStream(csvFilePath).pipe(res);
    } else if (pathname === '/upload' && method === 'POST') {
        // Import data from CSV
        const writeStream = fs.createWriteStream(csvFilePath);
        req.pipe(writeStream);

        req.on('end', () => {
            dataEmitter.emit('dataChanged', 'imported');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'File uploaded successfully' }));
        });

        writeStream.on('error', (error) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error uploading file', error: error.message }));
        });
    } else {
        // Handle 404 Not Found
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Route not found' }));
    }
});

// --- Start Server ---
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
