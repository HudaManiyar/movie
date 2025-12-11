require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection Configuration (Updated to Pool for Stability)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 5
});

// Test the connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to Clever Cloud MySQL Database');
        
        // Create table code...
        const sql = `CREATE TABLE IF NOT EXISTS movies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            director VARCHAR(255) NOT NULL,
            genre VARCHAR(100),
            release_year INT,
            rating DECIMAL(3, 1)
        )`;
        
        connection.query(sql, (err) => {
            connection.release(); // Important: Release connection back to pool
            if (err) console.error('⚠️ Table creation failed:', err);
            else console.log('✅ Movies table ready');
        });
    }
});

// Root Route
app.get('/', (req, res) => {
    res.send('Movie Catalog Backend is Running!');
});

// --- QUESTION 2 API ENDPOINTS ---

// a. GET /movies: Retrieve all movies
app.get('/movies', (req, res) => {
    db.query('SELECT * FROM movies', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// b. POST /movies: Add a new movie
app.post('/movies', (req, res) => {
    // Destructure fields as per Question 2
    const { title, director, genre, release_year, rating } = req.body;
    
    // Validation (Optional but good for exams)
    if (!title || !director) {
        return res.status(400).json({ message: "Title and Director are required" });
    }

    const sql = 'INSERT INTO movies (title, director, genre, release_year, rating) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [title, director, genre, release_year, rating], (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ 
            message: "Movie added successfully",
            id: result.insertId, 
            title, 
            director, 
            genre, 
            release_year, 
            rating 
        });
    });
});

// c. PUT /movies/:id: Update an existing movie
app.put('/movies/:id', (req, res) => {
    const { id } = req.params;
    const { title, director, genre, release_year, rating } = req.body;
    
    const sql = 'UPDATE movies SET title=?, director=?, genre=?, release_year=?, rating=? WHERE id=?';
    db.query(sql, [title, director, genre, release_year, rating, id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Movie not found" });
        }
        res.json({ message: 'Movie updated successfully' });
    });
});

// d. DELETE /movies/:id: Delete movie
app.delete('/movies/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM movies WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Movie not found" });
        }
        res.json({ message: 'Movie deleted successfully' });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('🚀 Server running on port ${PORT}'));