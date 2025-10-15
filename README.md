### Student Grade Management System
This project is a simple web server built with Node.js that manages student grade data stored in a CSV file. It provides a web interface for teachers to add, view, search, and manage student records.

## Features
Add Student Records: Add new students with their name, roll number, and marks.

View All Students: Display a list of all students from the database.

Search for a Student: Dynamically search for students by name.

Export Data: Download the entire student database as a CSV file.

Import Data: Upload a CSV file to overwrite the existing student database.

## Core Node.js Modules Used
This project emphasizes the use of core Node.js modules to handle server-side logic:

http: To create the HTTP server and handle requests/responses.

fs: To read from and write to the students.csv file.

path: To correctly resolve the file path for students.csv.

url: To parse URL pathnames and query strings for routing.

events: To emit and listen for custom events when data is modified (e.g., adding or importing students).

querystring: To parse URL-encoded form data from POST requests.

Streams: Used implicitly in the /export route (fs.createReadStream().pipe(res)) and /upload route (req.pipe(fs.createWriteStream())) for efficient handling of file data without loading the entire file into memory.

## Project Structure
.
├── server.js         # The main Node.js server application
├── index.html        # The frontend HTML page with jQuery
├── students.csv      # The data store for student records
└── README.md         # This setup and instruction file

## Setup and Installation
Prerequisites
Node.js installed on your machine (which includes npm).

## Steps
Clone the repository or download the files into a new directory on your local machine.

## Navigate to the project directory in your terminal:

cd path/to/your/project

Start the server:

node server.js

You should see the following message in your terminal, indicating that the server is running:

Server is running on http://localhost:3000

Access the application: Open your web browser and go to http://localhost:3000.

How to Use
View Students: The page loads with all current student data displayed in the table.

Add a Student: Fill out the form on the left and click "Add Student". The table will automatically refresh.

Search: Type a name in the search box to filter the student list in real-time.

Export CSV: Click the "Export CSV" button. Your browser will download the students.csv file.

Import CSV: Click the "Import CSV" button and select a valid CSV file from your computer. The student data will be replaced with the content of the uploaded file. The CSV file must have the headers name,roll,marks.
