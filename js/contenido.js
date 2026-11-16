// =====================================================================
// ✏️  contenido.js — TODO LO PERSONALIZABLE ESTÁ AQUÍ
// Puedes cambiar textos sin tocar el resto del código.
// =====================================================================

export const NOMBRE = 'Kiara';

// ---------------------------------------------------------------------
// 🔐 MENSAJES AL FALLAR LA CLAVE (nunca muestran la clave)
// ---------------------------------------------------------------------
export const MENSAJES_CLAVE = {
  primero: 'Jajajaja Kiarita, ¿fallaste por los nervios? 🙈 ¿O es que no eres Kiaritaaa? 🤨👀',
  pista: 'Una pista: es la fecha de nuestro cumple juntos 🎂✨',
  otros: [
    'Respira, Kiarita… y vuelve a intentarlo 😌',
    'Ni el mango sabe esa clave… ¿o sí? 🥭🤔',
    'Mmm… casi casi. (Bueno, no sé, pero tú puedes) 🤭',
    'Acuérdate de la pista: nuestro cumple juntos 🎂',
    'El escenario sigue esperándote, no te rindas ♡',
    '¿Segura que eres Kiarita? 👀 Intenta otra vez',
  ],
};
export const TITULO = 'Un escenario hecho para ti ♡';
export const SUBTITULO = '';   // (sin subtítulo)

// ---------------------------------------------------------------------
// 🥭 MENSAJES DE LOS MANGOS
// Cada mango guarda uno al azar (no se repiten hasta que salgan todos).
// El contenido permanece OCULTO hasta cosechar el mango.
// Tipos: 'reflexion' · 'amor' · 'animo' · 'dato' → usan "texto"
//        'chiste' · 'adivinanza' → usan "pregunta" (se ve antes) y "respuesta" (se revela al cosechar)
// Puedes agregar, quitar o cambiar los que quieras.
// ---------------------------------------------------------------------
export const CATEGORIAS = {
  reflexion: '🌿 Para pensar',
  amor: '♡ Con cariño',
  animo: '☀️ Para darte ánimo',
  chiste: '😄 Un chiste',
  adivinanza: '🧩 Adivinanza',
  dato: '✨ Dato curioso',
};

export const MENSAJES_MANGO = [
  // --- Para pensar ---
  { tipo: 'reflexion', texto: 'Las cosas bonitas casi nunca llegan con prisa: florecen cuando les toca.' },
  { tipo: 'reflexion', texto: 'No necesitas tenerlo todo resuelto para merecer un día bonito.' },
  { tipo: 'reflexion', texto: 'Un árbol no compite con el de al lado; solo crece. Tú también.' },
  { tipo: 'reflexion', texto: 'A veces descansar también es avanzar.' },
  { tipo: 'reflexion', texto: 'Lo que hoy te preocupa, quizá dentro de un año sea una anécdota que cuentes riéndote.' },
  { tipo: 'reflexion', texto: 'Las raíces no se ven, pero son las que sostienen todo. Cuida las tuyas.' },
  { tipo: 'reflexion', texto: 'Hay días de sol y días de niebla; los dos son parte del paisaje.' },
  { tipo: 'reflexion', texto: 'Ser amable es una forma silenciosa de ser valiente.' },
  { tipo: 'reflexion', texto: 'No te compares con el mango de otra rama: cada uno madura a su tiempo.' },
  { tipo: 'reflexion', texto: 'Lo pequeño también cuenta: un mensaje, un abrazo, un "¿llegaste bien?".' },
  { tipo: 'reflexion', texto: 'Los mangos más dulces son los que más sol recibieron. Los días difíciles también endulzan.' },
  { tipo: 'reflexion', texto: 'No todo lo que vale la pena se nota de inmediato; algunas cosas crecen en silencio.' },
  { tipo: 'reflexion', texto: 'Está bien cambiar de opinión, de rumbo y hasta de peinado.' },
  { tipo: 'reflexion', texto: 'La felicidad a veces es simple: buena música, buena comida y buena compañía.' },

  // --- Con cariño ---
  { tipo: 'amor', texto: 'Hay personas que hacen que un día cualquiera se sienta especial. Tú eres una de ellas.' },
  { tipo: 'amor', texto: 'Si cada vez que pienso en ti creciera un mango, este árbol ya no tendría espacio.' },
  { tipo: 'amor', texto: 'Tu risa debería venir con advertencia: es contagiosa.' },
  { tipo: 'amor', texto: 'Ojalá algún día te veas con los ojos con los que te ven quienes te quieren.' },
  { tipo: 'amor', texto: 'Algunas personas son como el atardecer: nunca te cansas de mirarlas.' },
  { tipo: 'amor', texto: 'Gracias por existir justo en el mismo tiempo que yo.' },
  { tipo: 'amor', texto: 'Este escenario es pequeñito, pero lo hice pensando en ti de principio a fin.' },
  { tipo: 'amor', texto: 'Si alguna vez te preguntas si eres importante para alguien: sí. Mucho.' },
  { tipo: 'amor', texto: 'Contigo, hasta el silencio es buena compañía.' },
  { tipo: 'amor', texto: 'Lo más dulce de este árbol no son los mangos.' },
  { tipo: 'amor', texto: 'Hay sonrisas que deberían estar protegidas por ley. La tuya, por ejemplo.' },
  { tipo: 'amor', texto: 'Si fueras fruta, serías la más dulce del árbol (sí, más que este mango).' },
  { tipo: 'amor', texto: 'Ojalá este año te encuentre gente que te cuide bonito.' },
  { tipo: 'amor', texto: 'Eres de esas casualidades que uno agradece.' },

  // --- Para darte ánimo ---
  { tipo: 'animo', texto: 'Eres más capaz de lo que crees, Kiarita. Lo has demostrado más veces de las que recuerdas.' },
  { tipo: 'animo', texto: 'Si hoy fue difícil, mañana tiene permiso para ser mejor.' },
  { tipo: 'animo', texto: 'Vas bien. Aunque a veces no lo parezca, vas bien.' },
  { tipo: 'animo', texto: 'Tus sueños no tienen fecha de vencimiento.' },
  { tipo: 'animo', texto: 'Respira hondo: lo que tenga que ser tuyo encontrará el camino.' },
  { tipo: 'animo', texto: 'No eres "demasiado" ni "muy poco": eres justo tú, y eso está perfecto.' },
  { tipo: 'animo', texto: 'Cada paso cuenta, incluso los chiquititos.' },
  { tipo: 'animo', texto: 'Este año viene con cosas bonitas para ti. Ya lo verás.' },
  { tipo: 'animo', texto: 'Que no se te olvide todo lo que ya lograste para llegar hasta aquí.' },
  { tipo: 'animo', texto: 'Si alguna vez dudas de ti, vuelve a este árbol y recoge otro mango.' },
  { tipo: 'animo', texto: 'Confía en tu proceso, aunque vaya más lento de lo que quisieras.' },
  { tipo: 'animo', texto: 'Hoy es un buen día para estar orgullosa de ti.' },
  { tipo: 'animo', texto: 'Lo estás haciendo mejor de lo que piensas.' },
  { tipo: 'animo', texto: 'Si te caes, te levantas; y si no tienes ganas, descansas un ratito y luego te levantas.' },

  // --- Chistes (pregunta → respuesta) ---
  { tipo: 'chiste', pregunta: '¿Qué hace una abeja en el gimnasio?', respuesta: '¡Zum-ba! 🐝' },
  { tipo: 'chiste', pregunta: '¿Cuál es el colmo de un jardinero?', respuesta: 'Que su pareja lo deje plantado. 🌱' },
  { tipo: 'chiste', pregunta: '¿Qué le dice una iguana a su hermana gemela?', respuesta: 'Somos iguanitas. 🦎' },
  { tipo: 'chiste', pregunta: '¿Por qué está triste el libro de matemáticas?', respuesta: 'Porque tiene demasiados problemas. 📘' },
  { tipo: 'chiste', pregunta: '¿Qué le dijo el sol a la luna?', respuesta: 'Tan grande y todavía no te dejan salir de día. 🌙' },
  { tipo: 'chiste', pregunta: '¿Cómo se despiden los químicos?', respuesta: 'Ácido un placer. 🧪' },
  { tipo: 'chiste', pregunta: '¿Qué le dijo un pez a otro pez?', respuesta: 'Nada. 🐟' },
  { tipo: 'chiste', pregunta: '¿Cuál es el café más peligroso del mundo?', respuesta: 'El ex-preso. ☕' },
  { tipo: 'chiste', pregunta: '¿Qué le dice un jaguar a otro jaguar?', respuesta: 'Jaguar you? 🐆' },
  { tipo: 'chiste', pregunta: '¿Cuál es el animal más antiguo?', respuesta: 'La cebra, porque está en blanco y negro. 🦓' },
  { tipo: 'chiste', pregunta: '¿Qué le dijo una uva verde a una morada?', respuesta: '¡Respira, respira! 🍇' },
  { tipo: 'chiste', pregunta: '¿Qué le dijo un techo a otro techo?', respuesta: 'Techo de menos. 🏠' },
  { tipo: 'chiste', pregunta: '¿Qué le dice una impresora a otra?', respuesta: '¿Esa hoja es tuya o es impresión mía? 🖨️' },
  { tipo: 'chiste', pregunta: '¿Cómo se dice pañuelo en japonés?', respuesta: 'Saka-moko. 🤧' },

  // --- Adivinanzas (pregunta → respuesta) ---
  { tipo: 'adivinanza', pregunta: 'Blanco por dentro, verde por fuera; si quieres que te lo diga, espera.', respuesta: '¡La pera! 🍐' },
  { tipo: 'adivinanza', pregunta: 'Oro parece, plata no es. ¿Qué es?', respuesta: '¡El plátano! 🍌' },
  { tipo: 'adivinanza', pregunta: 'Tengo agujas y no sé coser, tengo números y no sé leer.', respuesta: '¡El reloj! ⏰' },
  { tipo: 'adivinanza', pregunta: 'Vuelo de noche, duermo de día y nunca verás plumas en el ala mía.', respuesta: '¡El murciélago! 🦇' },
  { tipo: 'adivinanza', pregunta: 'Cuanto más le quitas, más grande es. ¿Qué es?', respuesta: '¡Un hoyo! 🕳️' },
  { tipo: 'adivinanza', pregunta: 'Tiene dientes y no come, tiene cabeza y no es persona.', respuesta: '¡El ajo! 🧄' },
  { tipo: 'adivinanza', pregunta: 'Redonda como el mundo, al morir me despedazan, me reducen a pellejo y todo el jugo me sacan.', respuesta: '¡La naranja! 🍊' },
  { tipo: 'adivinanza', pregunta: 'Mientras más grande, menos se ve. ¿Qué es?', respuesta: '¡La oscuridad! 🌑' },

  // --- Datos curiosos ---
  { tipo: 'dato', texto: 'El mango es pariente del marañón y del pistacho: los tres son de la misma familia de plantas.' },
  { tipo: 'dato', texto: 'Un árbol de mango puede vivir más de cien años y seguir dando frutos.' },
  { tipo: 'dato', texto: 'El mango es la fruta nacional de la India, Pakistán y Filipinas.' },
  { tipo: 'dato', texto: 'Piura es la región del Perú que produce la mayor parte del mango que se exporta.' },
  { tipo: 'dato', texto: 'Las flores del mango son chiquititas y salen en racimos de cientos.' },
  { tipo: 'dato', texto: 'Las nutrias marinas a veces se toman de las patas mientras duermen para no separarse con la corriente.' },
  { tipo: 'dato', texto: 'Los pulpos tienen tres corazones.' },
  { tipo: 'dato', texto: 'Los pingüinos papúa le regalan piedritas a su pareja para armar el nido juntos.' },
  { tipo: 'dato', texto: 'La miel bien guardada casi no se echa a perder: se han encontrado tarros en tumbas egipcias.' },
  { tipo: 'dato', texto: 'Tu corazón late unas cien mil veces al día.' },
  { tipo: 'dato', texto: 'La luz de algunas estrellas que ves de noche salió de ellas hace miles de años.' },
  { tipo: 'dato', texto: 'La luz del sol tarda poco más de 8 minutos en llegar hasta ti.' },
  { tipo: 'dato', texto: 'Los koalas tienen huellas dactilares muy parecidas a las humanas.' },
  { tipo: 'dato', texto: 'Una nube normalita puede pesar cientos de toneladas, aunque flote.' },
  { tipo: 'dato', texto: 'Los colibríes son las únicas aves que pueden volar hacia atrás.' },
  { tipo: 'dato', texto: 'Las mariposas sienten los sabores con las patas.' },
  { tipo: 'dato', texto: 'Una taza de mango te da casi toda la vitamina C que necesitas en el día.' },
];

// Variedades reales de mango (nombre de cada fruta)
export const VARIEDADES = [
  'Kent', 'Keitt', 'Tommy Atkins', 'Ataúlfo', 'Haden', 'Edward',
  'Palmer', 'Alphonso', 'Francis', 'Irwin', 'Chato de Ica', 'Criollo',
];

// ---------------------------------------------------------------------
// 💌 MENSAJES SECRETOS — se desbloquean EN ORDEN cada X cosechas
// (cosecha 7 → mensaje 1, cosecha 14 → mensaje 2, …)
// El "titulo" es solo para que tú te ubiques: no se muestra en pantalla.
// ---------------------------------------------------------------------
export const COSECHAS_POR_SECRETO = 7;
export const MENSAJES_SECRETOS = [
  { titulo: '7 mangos', texto: `Kiaritaaaaa, espero que estés teniendo un bonito día. Este mango tenía un mensaje importante para ti: tienes unos ojos preciosos. Atentamente, el mango. Y bueno, si te lo dice el mango, no cuenta como si te lo dijera yo, ¿verdad? JAJAJA.` },
  { titulo: '14 mangos', texto: `Kiaritaaaaa, espero que hoy estés sonriendo mucho. Aunque, pensándolo bien, tienes una sonrisa hermosaaaa. De esas que uno recuerda incluso después de que termina el día. Bueno, cosas que tal vez no pueda decirte en persona JAJAJA.` },
  { titulo: '21 mangos', texto: `Holaaaa, Kiaritaaaa. Espero que estés disfrutando de todo esto. Sabes, tengo que admitir algo: voy a extrañar verte durante estas vacaciones. Es curioso cómo uno puede acostumbrarse a coincidir con ciertas personas y luego notar su ausencia cuando dejan de estar cerca. Así que disfruta mucho, descansa y cuando vuelvas capaz haya algún detalle esperándote JAJAJA.` },
  { titulo: '28 mangos', texto: `Kiaritaaaa, espero que este mensaje te encuentre bien. Quería recordarte que eres una persona que merece muchas cosas bonitas. Ojalá nunca dudes de lo mucho que puedes lograr y de todas las razones que tienes para sentirte orgullosa de ti misma. Y si hoy necesitabas una pequeña razón para sonreír, pues espero que este mango haya cumplido su objetivo. Jejeje.` },
  { titulo: '35 mangos', texto: `Kiaritaaaaa, ¿alguna vez te has preguntado por qué me tomé tanto tiempo preparando este pequeño mundo? Bueno, quería regalarte algo diferente. Algo que no se terminara al abrir una caja, sino que pudieras descubrir y disfrutar poquito a poquito. Quizás no parezca gran cosa, pero cada detalle tiene una razón y un poquito de cariño detrás.` },
  { titulo: '42 mangos', texto: `Holaaaa, Kiarita. Creo que a estas alturas ya habrás notado que algunos mensajes no son precisamente obra del árbol. JAJAJA. La verdad es que hay muchas cosas de ti que me parecen bonitas, no solamente tu sonrisa o tus ojos, sino también esos pequeños detalles que quizás tú ni notas. Y aunque a veces no encuentre la manera de decirlo, quería que al menos una parte de eso quedara escrita por aquí.` },
  { titulo: '49 mangos', texto: `Kiaritaaaaa, ¡llegaste hasta aquí! JAJAJA.

Si has recogido todos estos mangos, entonces ya conoces una pequeña parte de lo que quería transmitirte con este lugar.

La verdad es que no necesitaba una ocasión especial para hacer algo así, pero tu cumpleaños me pareció una bonita excusa para crear algo que fuera solamente para ti. Y claro, un regalo en tu cumpleaños es de lo más normal, así que no cuenta lo que me dijiste. Jejeje.

Quería que tuvieras un lugar al que pudieras entrar, encontrar sorpresas y llevarte algún recuerdo bonito. No sé cuántas veces volverás a visitarlo, pero espero que cuando lo hagas recuerdes que alguien te aprecia mucho.

Gracias por ser parte de este pequeño viaje, Kiaritaaaa. Espero que la vida te regale muchísimos motivos para sonreír y que cumplas todo aquello que te propongas.

Con cariño, Diego Sadam. ♡` },
];

// ---------------------------------------------------------------------
// 🎂 MESA DE CUMPLEAÑOS
// El deseo solo se puede pedir UNA vez (queda guardado en su navegador).
// ---------------------------------------------------------------------
export const CUMPLE = {
  velas: 5,                                   // cantidad de velitas en la torta
  titulo: `Feliz cumpleaños, ${NOMBRE}`,
  // 💌 la nota del pastel (antes era la carta 1 de la mesa de recuerdos)
  carta: {
    titulo: 'Para Kiara ♡',
    texto: `Kiaritaaaaa:

Si estás leyendo esto, significa que encontraste una de las cartitas que dejé por aquí. JAJAJA.

Primero que nada, espero que estés teniendo un bonito día. Quería dejarte algo más que un simple regalo, algo que pudieras explorar a tu ritmo y que, de alguna manera, te sacara una sonrisa cada vez que lo visites.

Este pequeño escenario fue hecho pensando en ti. Cada detalle y cada cosita que encuentres tiene un poquito de tiempo, dedicación y cariño.

Quería regalarte un espacio diferente, uno donde pudieras encontrar pequeñas sorpresas, distraerte un rato y descubrir algunas cosas que quizás nunca te habría dicho de frente, o que no me dejas decirte directamente. Y bueno, no cuenta como si las hubiera dicho yo, ¿verdad? Jejeje.

Hay muchas cosas que podría mencionar de ti, pero empezaré por algo sencillo: tienes una sonrisa muy bonita y unos ojos que llaman bastante la atención. Aunque probablemente ya lo sepas... o quizás no. JAJAJA.

Me acordé de algo gracioso: fue cuando en Cálculo 1 el profe me sacó al frente y tú estabas riéndote de eso. Después de terminar mi participación, pedí permiso para ir al baño y, casualmente, cuando regresé, ¡te había sacado a ti al frente! JAJAJAJA. Cosas de la vida, por reírte de mí, ya ve.

No sé cuántas veces volverás a este pequeño mundo, pero espero que cada visita te deje algún recuerdo bonito, te saque una sonrisa y te permita pasar un momento feliz.`,
    firma: `Con cariño,
El creador de este pequeño escenario ♡`,
  },
  invitacion: 'Cierra los ojos un ratito y piensa en tu deseo con todas tus fuerzas…',
  soplar: 'Ahora sopla las velitas 🕯️',
  despues: '¡Deseo pedido! Que se cumpla todo lo bonito que imaginaste ✨',
  cuenta: 'Tu próximo deseo estará listo en:',
  cuentaLista: '¡Ya es tu cumpleaños otra vez! Puedes pedir un nuevo deseo ✨',
  yaPedido: `¡Eeeeeh, espera! JAJAJA.

Ese deseo ya está pedido, Kiarita. El siguiente recién toca el próximo año. 😂

Aunque... si tienes otro por ahí, puedes decírmelo a mí. No prometo hacer magia, pero quizá pueda hacer algo para cumplirlo. 👀♡`,
};

// ---------------------------------------------------------------------
// 💌 MESA DE RECUERDOS
// ✏️ Cambia los textos aquí. Las fotos van en la carpeta "fotos/".
//    Si una foto todavía no existe, se muestra un marco "Tu foto aquí ♡".
// ---------------------------------------------------------------------
export const RECUERDOS = {
  // 2 sobres sobre la mesa (la carta 1 está en el pastel: CUMPLE.carta)
  cartas: [
    {
      titulo: 'Para cuando estés feliz ☀️',
      // no se muestra la carta hasta que toque "Abrir"
      preguntar: { texto: '¿Hoy estás feliz? ☀️', boton: 'Sí, abrir carta' },
      texto: `Kiaritaaaaa:

¿Así que estás feliz? Eeeeeeso, ¡así me gusta! JAJAJA.

No sé qué habrá pasado hoy, pero espero que tengas muchísimos motivos para sonreír. Y si conseguiste algo que llevabas tiempo intentando, ¡felicidades! Date un momento para disfrutarlo.

A veces estamos tan concentrados en lo que viene después que olvidamos disfrutar lo que ya conseguimos. Así que hoy no te preocupes tanto por lo siguiente. Disfruta este momento, celebra tus pequeños logros y sigue acumulando motivos para estar orgullosa de ti y ser el orgullo de tu familia y tus seres queridos.

Cumplir tus metas, culminar tu carrera de Ingeniería Industrial, convertirte en una gran profesional y, quién sabe, quizá estudiar una segunda carrera. Yo sé que puedes, confío en ti. Todo aquello que te ayude a crecer y te sume como persona está más que bien.

Y oye, ya que estás de buen humor, espero que esta carta te haya sacado aunque sea otra sonrisita. Si no, tendré que reclamarle al departamento de cartas JAJAJA.

Sigue teniendo días así, Kiarita. Te los mereces.`,
      firma: '',
    },
    {
      titulo: 'Para cuando tengas un día difícil 🌙',
      // no se muestra la carta hasta que toque "Abrir"
      preguntar: { texto: '¿Hoy fue un día difícil? 🌙', boton: 'Abrir carta' },
      // ✏️ PENDIENTE: párrafo personal después de "...cuando las cosas se complicaban."
      //    (una cualidad suya que admiras, algo que superó o una razón para estar orgullosa)
      texto: `Kiaritaaaaa:

Si llegaste hasta esta carta, quizás hoy no ha sido uno de tus mejores días. Tal vez las cosas no salieron como esperabas, estás cansada, tienes muchas cosas en la cabeza o simplemente no tienes ganas de hacer demasiado.

Primero, respira un poquito. No tienes que resolverlo todo hoy, tampoco tienes que estar bien todo el tiempo. Hay días en los que simplemente toca descansar, tomar aire y volver a intentarlo cuando tengas fuerzas.

Quiero que recuerdes que un mal día no define todo lo que eres ni todo lo que eres capaz de conseguir. Has llegado hasta aquí por tus propios méritos, por tu esfuerzo y por todas esas veces que seguiste adelante incluso cuando las cosas se complicaban.

Y si hoy no tienes ganas de sonreír, tampoco pasa nada. No hay ninguna obligación de estar feliz siempre. Date tu tiempo, cuídate y no seas tan dura contigo misma.

Espero que mañana encuentres un motivo, aunque sea pequeñito, para sonreír otra vez.

Y si vuelves a tener un día malo, pasando por un mal momento, puedes volver a leer esta carta o escribirme a mí (ojalá que sí) y ten en cuenta que no estás sola, siiiii.`,
      firma: 'Cuídate muchísimo, Kiarita. ♡',
    },
  ],
  // 3 notitas dobladas
  notas: [
    `Kiaritaaaaa, si estás leyendo esto, toma agüita. Sí, es una orden. JAJAJA.

Y ya que estás aquí, te cuento que los frutos de ese árbol de mango esconden algunas cositas curiosas. 👀 Quizás encuentres algo que no sabías o una pequeña sorpresa esperándote por ahí. Así que ve, échales un vistazo y averígualoooo.

Pero no te distraigas demasiado... todavía quedan varias cositas escondidas por este mundito. JAJAJA. ♡`,
    `Holaaaa, Kiaritaaaaa. Una pequeña advertencia: no todo lo que hay en este lugar, o incluso antes de ingresar aquí, está a simple vista. 👀

Hay detalles que quizás pases por alto si vas con demasiada prisa, así que observa bien tu alrededor, curiosea y prueba cositas.

Quién sabe, quizás encuentres algo que no esperabas. Jejeje. ♡`,
    `Kiaritaaaaa, a veces las cosas más bonitas aparecen cuando uno menos las espera, y casualmente tú apareciste en mi vida cuando menos lo esperaba. JAJAJA.

Ah, y por si acaso... no te olvides de tomar agüitaaaa. ♡`,
  ],
  // Fotos: las 3 primeras van en los marcos (grande, mediano, chico),
  // la 4 y la 5 en las polaroids sueltas. El álbum muestra TODAS (puedes poner más).
  fotos: [
    { archivo: 'fotos/foto1.jpg', pie: '' },
    { archivo: 'fotos/foto2.jpg', pie: '' },
    { archivo: 'fotos/foto3.jpg', pie: '' },
    { archivo: 'fotos/foto4.jpg', pie: '' },
    { archivo: 'fotos/foto5.jpg', pie: '' },
    { archivo: 'fotos/foto6.jpg', pie: '' },
  ],
};
