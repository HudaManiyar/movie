require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection (Pool)
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

// --- DATABASE SETUP ---
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to Clever Cloud MySQL Database');
        
        connection.query('DROP TABLE IF EXISTS movies', (err) => {
            if (err) console.error("Error dropping table:", err);
            else console.log("Old table dropped (if existed).");

            const createTableSQL = `CREATE TABLE movies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                genre VARCHAR(100),
                description TEXT,
                poster_url VARCHAR(255),
                rating DECIMAL(3, 1)
            )`;

            connection.query(createTableSQL, (err) => {
                if (err) console.error("Error creating table:", err);
                else {
                    console.log("✅ New 'movies' table created successfully!");

                    // INSERT 5 Sample Records
                    const checkSQL = 'SELECT COUNT(*) AS count FROM movies';
                    connection.query(checkSQL, (err, result) => {
                        if (result[0].count === 0) {
                            const insertSQL = `INSERT INTO movies (title, genre, description, poster_url, rating) VALUES ?`;
                            const values = [
                                ['Inception', 'Sci-Fi', 'A thief who steals corporate secrets through dream-sharing technology.', 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 8.8],
                                ['The Dark Knight', 'Action', 'Batman raises the stakes in his war on crime.', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 9.0],
                                ['Interstellar', 'Sci-Fi', 'A team of explorers travel through a wormhole in space.', 'https://media.themoviedb.org/t/p/w600_and_h900_face/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 8.6],
                                ['Parasite', 'Thriller', 'Greed and class discrimination threaten the newly formed symbiotic relationship.', 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 8.6],
                                ['Avengers: Endgame', 'Action', 'After the devastating events of Infinity War, the universe is in ruins.', 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg', 8.4]
                            ];
                            connection.query(insertSQL, [values], (err) => {
                                connection.release();
                                if (err) console.error("Error inserting data:", err);
                                else console.log("✅ 5 Sample movies inserted!");
                            });
                        } else {
                            connection.release();
                        }
                    });
                }
            });
        });
    }
});

// Root Route
app.get('/', (req, res) => {
    res.send('MovieMania Backend is Running!');
});

// --- API ENDPOINTS ---

// 1. GET /movies: Fetch all movies
app.get('/movies', (req, res) => {
    db.query('SELECT * FROM movies', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 2. GET /movies/:id: Fetch single movie 
app.get('/movies/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM movies WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length === 0) return res.status(404).json({ message: "Movie not found" });
        res.json(result[0]);
    });
});

// 3. POST /movies: Add new movie 
app.post('/movies', (req, res) => {
    const { title, genre, description, poster_url, rating } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const sql = 'INSERT INTO movies (title, genre, description, poster_url, rating) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [title, genre, description, poster_url, rating], (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ message: "Movie added successfully", id: result.insertId });
    });
});

// 4. PUT /movies/:id: Update movie 
app.put('/movies/:id', (req, res) => {
    const { title, genre, description, poster_url, rating } = req.body;
    const sql = 'UPDATE movies SET title=?, genre=?, description=?, poster_url=?, rating=? WHERE id=?';
    db.query(sql, [title, genre, description, poster_url, rating, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Movie updated successfully" });
    });
});

// 5. DELETE /movies/:id: Delete movie
app.delete('/movies/:id', (req, res) => {
    const sql = 'DELETE FROM movies WHERE id=?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Movie deleted successfully" });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));