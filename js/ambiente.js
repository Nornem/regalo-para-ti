// =====================================================================
// ambiente.js — estado compartido del ciclo de día y noche
// ciclo.js lo escribe; los faroles, el farol de la mesa y las
// luciérnagas lo leen. (0 = de día, 1 = de noche)
// =====================================================================
export const ambiente = {
  faroles: 0,      // qué tan encendidos están los faroles (0 apagados … 1 encendidos)
  noche: 0,        // qué tan de noche es (0 … 1)
  estado: 'Día',
};
