const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://mongo:27017/brainquest')
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error al conectar con MongoDB:', err));

const Pregunta = mongoose.model(
    'Pregunta',
    new mongoose.Schema({}, { strict: false }),
    'preguntas'
);

const Ranking = mongoose.model(
    'Ranking',
    new mongoose.Schema({
        jugador1: String,
        puntosJ1: Number,
        jugador2: String,
        puntosJ2: Number,
        fecha: {
            type: Date,
            default: Date.now
        }
    }),
    'ranking'
);

// Middleware para entender JSON y servir archivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal: Carga el juego
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API Endpoint: Devuelve las preguntas filtradas al frontend (Reemplaza utilidades/preguntas.py)
app.get('/api/preguntas', async (req, res) => {
    try {
        const preguntas = await Pregunta.find({});
        res.json(preguntas);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'No se pudieron obtener las preguntas desde MongoDB.'
        });
    }
});


// Espacio reservado para el ranking (Próxima conexión a MongoDB)
app.post('/api/ranking', async (req, res) => {
    try {
        const datosPartida = req.body;

        const nuevaPartida = new Ranking(datosPartida);

        await nuevaPartida.save();

        console.log("✅ Partida guardada:", datosPartida);

        res.json({
            status: "success",
            message: "Partida guardada correctamente."
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            status: "error",
            message: "No se pudo guardar la partida."
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Backend de Brain Quest corriendo en http://localhost:${PORT}`);
});
