// =====================================================================
// progreso.js — lo que Kiara ya hizo, guardado en su navegador
// (mangos cosechados, mensajes secretos, deseo de cumpleaños)
// Para pruebas: abrir con ?reiniciar al final de la dirección lo borra todo.
// =====================================================================
const GUARDADO = 'mundoKiara.v1';
const INICIAL = { cosechados: 0, secretos: 0, deseo: false };

if (new URLSearchParams(location.search).has('reiniciar')) {
  try { localStorage.removeItem(GUARDADO); } catch { /* sin almacenamiento */ }
}

export const progreso = (() => {
  try { return Object.assign({}, INICIAL, JSON.parse(localStorage.getItem(GUARDADO) || '{}')); }
  catch { return { ...INICIAL }; }
})();

export function guardar() {
  try { localStorage.setItem(GUARDADO, JSON.stringify(progreso)); }
  catch { /* sin almacenamiento: solo dura esta visita */ }
}
