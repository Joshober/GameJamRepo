# Shooter 4 jugadores Co-op (3D)

Minijuego de disparos 3D para **4 jugadores en equipo** contra oleadas de enemigos. Los jugadores pueden usar teclado en el PC o **conectarse desde el móvil por URL** para controlar su personaje.

## Cómo jugar

1. **En el ordenador:** ejecuta el servidor para poder usar control desde móvil:
   ```bash
   cd minigames/mg-shooter-4p-3d
   npm install
   npm start
   ```
2. Abre en el navegador: **http://localhost:3847** (o la IP que muestre la consola).
3. **En el móvil (misma WiFi):** abre la URL que aparece en la pantalla de inicio, por ejemplo:
   - Jugador 1: `http://TU_IP:3847/controller?player=1`
   - Jugador 2: `http://TU_IP:3847/controller?player=2`
   - etc.
     Sustituye `TU_IP` por la IP de tu ordenador (ej. 192.168.1.10).

## Controles

- **Teclado:** P1 WASD+Espacio · P2 Flechas+Enter · P3 IJKL+U · P4 TFGH+R
- **Móvil:** D-pad + botón DISPARAR en la página del controlador.

## Reglas

- Los 4 jugadores van **en equipo**. Hay que eliminar a los enemigos que aparecen por **oleadas**.
- Los enemigos entran por los bordes del mapa y se acercan a los jugadores; si te tocan, pierdes vida.
- Gana el equipo si superáis **5 oleadas** o si tenéis más kills cuando acaben los **2 minutos**.
- Si un jugador muere, reaparece a los pocos segundos en su esquina.

## Solo local (sin móvil)

Puedes abrir `index.html` directamente en el navegador; entonces solo funcionarán los controles de teclado (y no la URL de móvil).
