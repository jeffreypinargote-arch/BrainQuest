
let preguntasPartida = [];
let indicePregunta = 0;
let turno = 1; // 1 = J1, 2 = J2

let jugador1 = "";
let jugador2 = "";
let puntosJ1 = 0;
let puntosJ2 = 0;

let tiempoRestante = 15;
let temporizadorId = null;

// Captura de elementos DOM
const pInicio = document.getElementById('pantalla-inicio');
const pJuego = document.getElementById('pantalla-juego');
const pFinal = document.getElementById('pantalla-final');

document.getElementById('btn-comenzar').addEventListener('click', iniciarJuego);

function iniciarJuego() {
    jugador1 = document.getElementById('j1-nombre').value.trim();
    jugador2 = document.getElementById('j2-nombre').value.trim();

    if (!jugador1 || !jugador2) {
        alert("Por favor ingresa el nombre de ambos jugadores.");
        return;
    }

    // Petición asíncrona al API interna de nuestro backend (Paso clave en Proxy Inverso)
    fetch('/api/preguntas')
        .then(response => response.json())
        .then(preguntas => {
            preguntasBackend = preguntas;
            // Filtrar y tomar 10 preguntas aleatorias como hacías en Python
            preguntasPartida = preguntasBackend.sort(() => 0.5 - Math.random()).slice(0, 10);
            
            pInicio.classList.add('oculto');
            pJuego.classList.remove('oculto');
            
            mostrarPregunta();
        })
        .catch(err => alert("Error al conectar con el servidor backend: " + err));
}

function mostrarPregunta() {
    if (temporizadorId) clearInterval(temporizadorId);

    if (indicePregunta >= preguntasPartida.length) {
        finalizarPartida();
        return;
    }

    tiempoRestante = 15;
    actualizarRelojVisual();
    
    // Iniciar cuenta regresiva (Equivalente a root.after en Tkinter)
    temporizadorId = setInterval(() => {
        tiempoRestante--;
        actualizarRelojVisual();
        if (tiempoRestante <= 0) {
            clearInterval(temporizadorId);
            alert(`💥 ¡TIEMPO AGOTADO! La bomba explotó.`);
            procesarRespuesta(null); // Cuenta como fallo
        }
    }, 1000);

    const preguntaActual = preguntasPartida[indicePregunta];
    document.getElementById('jugador-actual').innerText = (turno === 1) ? jugador1.toUpperCase() : jugador2.toUpperCase();
    document.getElementById('pregunta-texto').innerText = preguntaActual.pregunta;

    // Renderizar opciones mezcladas
    const contenedorOpciones = document.getElementById('contenedor-opciones');
    contenedorOpciones.innerHTML = "";
    
    let opciones = [...preguntaActual.opciones].sort(() => 0.5 - Math.random());
    
    opciones.forEach(opcion => {
        const btn = document.createElement('button');
        btn.className = 'btn-opcion';
        btn.innerText = opcion;
        btn.onclick = () => {
            clearInterval(temporizadorId);
            if (opcion === preguntaActual.respuesta) {
                alert("🟢 ¡Correcto!");
                if (turno === 1) puntosJ1 += 10; else puntosJ2 += 10;
            } else {
                alert(`🔴 Incorrecto. La respuesta correcta era: ${preguntaActual.respuesta}`);
            }
            procesarRespuesta();
        };
        contenedorOpciones.appendChild(btn);
    });

    // Actualizar marcadores de texto
    document.getElementById('txt-j1').innerText = `${jugador1}: ${puntosJ1} pts`;
    document.getElementById('txt-j2').innerText = `${jugador2}: ${puntosJ2} pts`;
}

function actualizarRelojVisual() {
    const contenedorBomba = document.getElementById('bomba-visual');
    const txtReloj = document.getElementById('reloj-digital');
    const txtEstado = document.getElementById('bomba-estado');

    txtReloj.innerText = tiempoRestante;

    if (tiempoRestante <= 5) {
        contenedorBomba.className = "bomba-roja";
        txtEstado.innerText = "¡RÁPIDO!";
    } else {
        contenedorBomba.className = "bomba-gris";
        txtEstado.innerText = "Bomba activa";
    }
}

function procesarRespuesta() {
    indicePregunta++;
    turno = (turno === 1) ? 2 : 1; // Alternar turnos
    mostrarPregunta();
}

function finalizarPartida() {
    pJuego.classList.add('oculto');
    pFinal.classList.remove('oculto');

    let mensajeFinal = "";
    if (puntosJ1 > puntosJ2) {
        mensajeFinal = `🏆 ¡Ganador: ${jugador1}! 🏆<br><br>${jugador1}: ${puntosJ1} pts<br>${jugador2}: ${puntosJ2} pts`;
    } else if (puntosJ2 > puntosJ1) {
        mensajeFinal = `🏆 ¡Ganador: ${jugador2}! 🏆<br><br>${jugador2}: ${puntosJ2} pts<br>${jugador1}: ${puntosJ1} pts`;
    } else {
        mensajeFinal = `🤝 ¡Empate técnico! 🤝<br><br>Ambos puntajes: ${puntosJ1} pts`;
    }

    document.getElementById('resultado-ganador').innerHTML = mensajeFinal;

    // Enviar datos al backend de manera asíncrona para simular almacenamiento
    fetch('/api/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador1, puntosJ1, jugador2, puntosJ2 })
    });
}
