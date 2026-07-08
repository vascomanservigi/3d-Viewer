# Petoi AR Viewer

Visualizzatore in Realtà Aumentata per il robot Petoi.

## Come usare

1. Apri il terminale nella cartella
2. Esegui: `npm start`
3. Il browser si aprirà su `http://localhost:8080`
4. Clicca "Avvia Webcam" e dai i permessi
5. Aggiungi oggetti 3D col tasto "Aggiungi Oggetto"

## Funzionalità

- **Webcam streaming** in tempo reale
- **Oggetti 3D AR**: Robot Petoi, Cubo, Sfera, Anello, Cristallo
- **Interazione**: trascina, zoom, rotazione
- **Effetti particellari** quando spawnano gli oggetti

## Per collegare il Petoi

Per usare la webcam del Petoi invece di quella del PC:
1. Connetti il Petoi alla rete WiFi
2. Modifica `main.js` riga 35:
```javascript
this.video.srcObject = stream; // webcam PC
// this.video.src = 'http://PETOI_IP:PORT/stream'; // Petoi
```
