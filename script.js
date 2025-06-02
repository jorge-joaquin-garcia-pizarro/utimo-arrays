// Bloquear clic derecho
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Variables para ingreso de números
const formNumeros = document.getElementById('form-numeros');
const inputNumero = document.getElementById('numero');
const listaNumeros = document.getElementById('lista-numeros');
const guardarBtn = document.getElementById('guardar-btn');
const mensaje = document.getElementById('mensaje');

// Lista local para validar duplicados
let numerosLocales = [];

formNumeros.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensaje.textContent = '';
  const numero = Number(inputNumero.value);

  if (isNaN(numero)) {
    mensaje.textContent = 'Ingresa un número válido.';
    return;
  }

  if (numerosLocales.includes(numero)) {
    mensaje.textContent = 'Este número ya fue ingresado.';
    return;
  }

  try {
    const res = await fetch('/agregar-numero', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero })
    });

    const data = await res.json();
    if (!res.ok) {
      mensaje.textContent = data.error || 'Error al agregar número';
      return;
    }

    numerosLocales = data.numeros;
    actualizarLista(data.numeros);

    if (data.numeros.length >= 10) guardarBtn.disabled = false;
    if (data.numeros.length >= 20) {
      mensaje.textContent = 'Máximo 20 números alcanzado.';
      inputNumero.disabled = true;
    }

    inputNumero.value = '';
    inputNumero.focus();
  } catch (err) {
    mensaje.textContent = 'Error de conexión';
    console.error(err);
  }
});

// Modificado para descarga local en vez de fetch guardar
guardarBtn.addEventListener('click', () => {
  if (numerosLocales.length === 0) {
    mensaje.textContent = 'No hay números para guardar.';
    return;
  }

  const contenido = numerosLocales.join('\n');
  const blob = new Blob([contenido], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'numeros_guardados.txt';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);

  mensaje.style.color = 'green';
  mensaje.textContent = 'Archivo descargado correctamente.';
  listaNumeros.innerHTML = '';
  guardarBtn.disabled = true;
  inputNumero.disabled = false;
  numerosLocales = [];
});

function actualizarLista(numeros) {
  listaNumeros.innerHTML = '';
  numeros.forEach(num => {
    const li = document.createElement('li');
    li.textContent = num;
    listaNumeros.appendChild(li);
  });
}

// Subida de archivo .txt
const uploadForm = document.getElementById("uploadForm");

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const archivo = document.getElementById("archivo").files[0];

  if (!archivo) {
    alert("Por favor, selecciona un archivo.");
    return;
  }

  const formData = new FormData();
  formData.append("archivo", archivo);

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert("Error: " + errorData.error);
      return;
    }

    const data = await res.json();
    const resultado = document.getElementById("resultado");
    resultado.innerHTML = `
      <h3>Números útiles (ordenados):</h3>
      <p>${data.numeros_utiles.join(", ") || "Ninguno"}</p>
      <p><strong>Total útiles:</strong> ${data.contador_utiles}</p>
      <p><strong>Total no útiles:</strong> ${data.contador_no_utiles}</p>
      <p><strong>Porcentaje útiles:</strong> ${data.porcentaje_utiles.toFixed(2)}%</p>
      <a href="${data.archivo_resultado}" download>Descargar resultado (.txt)</a>
    `;
  } catch (error) {
    alert("Ocurrió un error al procesar el archivo.");
    console.error(error);
  }
});
