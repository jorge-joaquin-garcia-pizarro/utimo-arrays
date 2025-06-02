const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Crear carpetas si no existen
const uploadsDir = path.join(__dirname, 'uploads');
const resultadoDir = path.join(__dirname, 'resultado');
[uploadsDir, resultadoDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Configuración Multer para subir archivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, 'archivo.txt')
});
const upload = multer({ storage });

// Servir frontend (public/) y archivos resultado
app.use(express.static(path.join(__dirname, 'public')));
app.use('/resultado', express.static(resultadoDir));

// Ruta para subir y procesar archivo
app.post('/upload', upload.single('archivo'), (req, res) => {
  const archivoPath = path.join(uploadsDir, 'archivo.txt');

  fs.readFile(archivoPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error al leer el archivo.' });

    const lineas = data.split(/\r?\n/).filter(linea => linea.trim() !== '');
    const numerosUtiles = [];
    let contadorNoUtiles = 0;

    lineas.forEach(linea => {
      const numero = linea.trim();
      if (numero[0] === numero[numero.length - 1]) numerosUtiles.push(numero);
      else contadorNoUtiles++;
    });

    numerosUtiles.sort((a, b) => parseInt(a) - parseInt(b));
    const contadorUtiles = numerosUtiles.length;
    const total = contadorUtiles + contadorNoUtiles;
    const porcentajeUtiles = total > 0 ? (contadorUtiles / total) * 100 : 0;

    const resultadoTexto = `Números útiles (ordenados):\n${numerosUtiles.join(', ')}\n\nTotal útiles: ${contadorUtiles}\nTotal no útiles: ${contadorNoUtiles}\nPorcentaje útiles: ${porcentajeUtiles.toFixed(2)}%`;
    const resultadoPath = path.join(resultadoDir, 'resultado.txt');

    fs.writeFile(resultadoPath, resultadoTexto, err => {
      if (err) return res.status(500).json({ error: 'Error al escribir el archivo de resultado.' });

      res.json({
        numeros_utiles: numerosUtiles,
        contador_utiles: contadorUtiles,
        contador_no_utiles: contadorNoUtiles,
        porcentaje_utiles: porcentajeUtiles,
        archivo_resultado: '/resultado/resultado.txt'
      });
    });
  });
});

// Array para guardar los números ingresados individualmente
const numeros = [];

// Ruta para agregar un número
app.post('/agregar-numero', (req, res) => {
  const { numero } = req.body;
  if (typeof numero !== 'number' || isNaN(numero)) return res.status(400).json({ error: 'Número inválido' });
  if (numeros.length >= 20) return res.status(400).json({ error: 'Máximo 20 números alcanzado' });

  numeros.push(numero);
  res.json({ numeros });
});

// Ruta para guardar el archivo de los números ingresados manualmente
app.post('/guardar', (req, res) => {
  const resultadoTexto = numeros.join('\n');
  const resultadoPath = path.join(resultadoDir, 'numeros_guardados.txt');

  fs.writeFile(resultadoPath, resultadoTexto, err => {
    if (err) return res.status(500).json({ error: 'Error al guardar archivo' });

    numeros.length = 0; // vaciar array
    res.json({ mensaje: 'Archivo guardado exitosamente' });
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
