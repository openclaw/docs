---
read_when:
    - Está implementando o revisando una fase del rediseño de la incorporación
summary: Plan de implementación para el rediseño de la incorporación de custodios (documento vivo)
title: Rediseño de la incorporación
x-i18n:
    generated_at: "2026-07-19T02:10:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc1f049d59cfa2638e7332ab4127905141625de5471144c856c91bfe50c9fa11
    source_path: start/onboarding-redesign.md
    workflow: 16
---

# Plan de implementación del rediseño de la incorporación

> **Documento activo.** Esta página realiza un seguimiento del rediseño de la incorporación del custodio a
> nivel de implementación y se actualiza a medida que se completa cada fase. Cuando se
> fusione la última fase, esta página se reescribirá como la guía de incorporación orientada al usuario y se incorporará
> a la navegación de la documentación. Intencionadamente, no se encuentra en `docs.json` hasta entonces.

## Objetivo principal

Un usuario sin conocimientos técnicos escribe `openclaw onboard` (o abre la aplicación) y se encuentra
con una única presencia conversacional: OpenClaw, el custodio del sistema («custodio» es
solo el nombre interno; el usuario siempre ve «OpenClaw»), que encuentra su IA,
lo configura todo con valores predeterminados anunciados en lugar de preguntas, hace eclosionar a su
agente como un momento visible de identidad y permanece accesible para siempre como
cuidador del sistema. Magia de forma predeterminada, un límite de consentimiento, ningún callejón sin salida.

Principios de diseño (ya decididos; no reabrir el debate a la ligera):

- **Los valores predeterminados anunciados con una opción sencilla para deshacerlos** sustituyen las preguntas bloqueantes. El único
  requisito estricto es que la inferencia funcione; todo lo demás es una oferta.
- **La pregunta cero es el límite de consentimiento**: «Acceso completo» (recomendado) significa
  que el descubrimiento es silencioso y automático; «Preguntar primero» supedita cada descubrimiento —el análisis
  de IA, el análisis de aplicaciones y el análisis de fuentes de memoria por igual— a un único
  sí explícito, con una ruta totalmente manual que nunca realiza análisis.
- **La conversación como interfaz de usuario con inteligencia progresiva**: la superficie del custodio
  existe antes de que funcione ninguna IA (diálogo con guion), pasa a estar respaldada por el modelo en el
  momento en que se verifica una ruta y lo indica de forma visible. Nunca finge inteligencia:
  la entrada de texto libre antes de verificar una ruta recibe un amable «primero déjame
  poner mi cerebro en funcionamiento».
- **La eclosión es una ceremonia**: el mismo hilo, cambio de avatar, el agente se pone
  nombre y elige su propia cara. El custodio explica la jerarquía una vez: «pregúntame
  sobre el sistema o simplemente pregunta a tu agente; este transmite el mensaje».
- **La confianza se clasifica por niveles según la fuente**: las entradas del catálogo oficial pueden estar preseleccionadas;
  las Skills de ClawHub de terceros nunca están preseleccionadas, independientemente de la
  clasificación del modelo, y sus etiquetas indican que instalan el código del editor.
- **Las instalaciones configuradas son sagradas**: volver a ejecutar la incorporación es una pasada de
  verificación. Nunca vuelve a aplicar la configuración ni reinicia el servicio Gateway.
- **El terminal es la alternativa, no una pregunta**: se prefiere el panel de control del
  navegador cuando hay un Gateway accesible; nunca se pregunta «¿terminal o navegador?».
- **Los modelos débiles reciben una superficie reducida** (`localModelLean` automático), explicada con
  palabras sencillas, nunca en términos de herramientas, modo de código o ventanas de contexto.

## Flujo distribuido actual (después de las fases 1-3)

`openclaw onboard` en una instalación nueva de macOS, ruta ideal: cuatro pulsaciones de Intro en total:

1. Nota de seguridad → una pulsación de Intro para confirmarla (se conserva; no vuelve a preguntarse).
2. **Pregunta cero**: «¿Cómo debo configurar las cosas?» — Full access (recommended)
   o Ask first. Se conserva como `wizard.accessMode`; las nuevas ejecuciones usan de forma predeterminada la
   opción guardada. Guarded + «configure manually» llega al selector de proveedor sin
   realizar ningún análisis y también omite el análisis de fuentes de memoria.
3. **Teatro del descubrimiento**: detecta las CLI de programación, las claves de entorno y los entornos de ejecución locales;
   hace comentarios ingeniosos cuando encuentra agentes de programación; prueba en vivo los candidatos en orden y
   agrupa discretamente los fallos en una única línea de resumen (los detalles aparecen tras «See other
   options»). La primera ruta que funciona se anuncia como valor predeterminado con una
   ruta de una sola tecla al selector completo; explorar y omitir conserva la
   ruta funcional.
4. Oferta de importación de memoria (Claude Code / Codex / Hermes), omitida cuando se
   rechazó el descubrimiento.
5. Solo instalaciones nuevas: el plan de configuración estándar se aplica automáticamente
   (espacio de trabajo, servicio Gateway, sesiones: el mismo plan que ejecuta el «sí»
   conversacional). Las instalaciones configuradas muestran «already set up» y nunca modifican el
   servicio.
6. **Recomendaciones de aplicaciones**: aplicaciones instaladas que el modelo verificado
   relaciona con los catálogos oficiales + ClawHub; los plugins de canales oficiales aparecen
   premarcados y las Skills de terceros requieren aceptación, con una etiqueta de advertencia. Se puede omitir;
   interruptor de desactivación `wizard.appRecommendations`.
7. **Eclosión**: cuando hay un Gateway accesible, la transferencia al navegador abre (GUI) o
   muestra (sin interfaz gráfica/SSH) la URL del panel de control y espera a que la interfaz de control se
   conecte: «Dashboard connected — continuing in your browser». De lo contrario, o
   con `--tui`, se abre la TUI del terminal, inicializada con el mensaje de eclosión de
   arranque, y el agente se presenta.

La incorporación mediante un Gateway remoto mantiene su transferencia conversacional heredada
(`handoffMode: "chat"`); la configuración debe aplicarse en el Gateway remoto.

## Fases

| #   | Fase                                                                                                                                                     | Superficie              | Estado                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Recomendaciones de plugins según las aplicaciones instaladas (análisis, candidatos, comparador de IA, paso del asistente, comando Node `device.apps`)                                              | CLI clásica + guiada | fusionada ([#109668](https://github.com/openclaw/openclaw/pull/109668))                                                              |
| 2   | Estructura central del custodio en la CLI (pregunta cero, teatro del descubrimiento, aplicación automática + eclosión)                                                                                | CLI guiada           | fusionada ([`a83ed13204f1`](https://github.com/openclaw/openclaw/commit/a83ed13204f118adf1009e5ac88d5afe1905b86c))                   |
| 3   | Transferencia prioritaria al navegador (detección de sesiones con GUI, espera de conexión del panel de control, TUI como alternativa)                                                                | CLI → web            | fusionada ([#110054](https://github.com/openclaw/openclaw/pull/110054))                                                              |
| 4   | Superficie web del custodio (tarjetas de opciones, campo `question` tipado en `openclaw.chat`, reflejo de los pasos del asistente, transferencia de primera ejecución)                                 | interfaz de control           | fusionada ([#110141](https://github.com/openclaw/openclaw/pull/110141), [#110242](https://github.com/openclaw/openclaw/pull/110242)) |
| 5   | Eclosión y arranque (almacén de recomendaciones con semántica de una sola vez, secuencia de nacimiento con autonombre, transferencia automática a la eclosión tras una configuración nueva; escalera de avatares aplazada) | arranque del agente      | fusionada ([#110173](https://github.com/openclaw/openclaw/pull/110173), [#110331](https://github.com/openclaw/openclaw/pull/110331)) |
| 6   | Presencia del custodio PR1 (entrada fijada en la barra lateral, Preguntar a OpenClaw en Configuración, saludo del cuidador con la interfaz normal; los comentarios de eventos y la invocación desde canales quedan para PR2)    | web + canales       | fusionada ([#110269](https://github.com/openclaw/openclaw/pull/110269))                                                              |
| 7   | Resiliencia (custodio accesible con una configuración dañada, recuperación parcial de superficies, corrección automática)                                                                   | Gateway              | seguimiento                                                                                                                         |

## Notas de implementación por fase

### Fase 1 — recomendaciones de aplicaciones (PR #109668)

- Analizador: `src/infra/installed-apps.ts` (enumeración de macOS sin TCC; sigue los paquetes
  `.app` enlazados simbólicamente).
- Candidatos: catálogos oficiales + búsqueda en ClawHub, presupuesto total de 20 s, degradación
  sin conexión controlada a candidatos solo del catálogo. Las entradas del catálogo son manifiestos de paquetes
  sin un `id` de nivel superior; los candidatos se indexan mediante el id del
  plugin resuelto (se realizaron pruebas de regresión con los catálogos incluidos reales; indexarlos mediante
  `entry.id` llegó a contraer todo el catálogo y descartar todas las
  recomendaciones oficiales).
- Comparador de IA: una finalización en la ruta verificada
  (`src/system-agent/setup-app-recommendations.ts`); no hay ningún mapa seleccionado de identificadores de paquetes:
  el modelo rechaza las coincidencias de nombres fortuitas. La salida está limitada por el
  presupuesto `maxTokens` propio del modelo resuelto (la capa de transmisión lo aplica cuando no
  se proporciona un límite explícito).
- **Protección de la cadena de suministro**: el texto de los listados de ClawHub está controlado por el editor y
  llega al prompt del comparador, por lo que un listado puede promocionarse como
  «recomendado». Solo las entradas del catálogo oficial pueden estar preseleccionadas; las Skills de ClawHub
  siempre requieren una selección explícita y llevan la etiqueta «Skill de ClawHub de terceros;
  instala el código de su editor».
- Comando Node `device.apps` (host de Node en TS, paridad del sobre de Android), uso compartido
  desactivado de forma predeterminada; interruptor de desactivación del Gateway `wizard.appRecommendations`.
- La entrega reside en el asistente clásico y en el flujo guiado del custodio
  (`src/wizard/setup.app-recommendations.ts`); la reorientación a la cola de
  arranque permanece en la fase 5 (el servicio ya admite una fuente de inventario
  inyectable). La semántica de una sola vez (ofrecer solo hasta la aceptación, análisis almacenado) también llega
  con el almacén de la fase 5; actualmente, una nueva ejecución vuelve a ofrecerla.
- También se corrigió: los prompts `completeSetupInference` personalizados ya no heredan el
  límite de salida de 32 tokens de la sonda de verificación (`SETUP_INFERENCE_TEST_MAX_TOKENS`
  solo se aplica a la sonda «reply OK»).

### Fase 2 — estructura central del custodio en la CLI (PR #109841)

- Reelaboración del flujo en `src/commands/onboard-guided.ts`; la incorporación mediante Gateway remoto
  mantiene su transferencia de chat heredada mediante `handoffMode: "chat"`.
- La pregunta cero conserva `wizard.accessMode` ("full" | "guarded"); las nuevas ejecuciones
  usan de forma predeterminada la opción guardada (aceptar el valor predeterminado nunca puede
  cambiar silenciosamente de guarded a full). Guarded + manual utiliza
  `listManualSetupInferenceOptions` (solo configuración/manifiestos, sin sondeo) y
  omite el análisis de fuentes de memoria.
- Descubrimiento: recopilación silenciosa de fallos (una única línea de resumen; detalles tras
  «See other options»), comentario ingenioso sobre agentes de programación, ruta predeterminada anunciada. Los recuentos
  de sesiones en el comentario se aplazan (solo cualitativos) hasta que exista un mecanismo económico
  de recuento de sesiones.
- Instalaciones nuevas: `applySystemAgentSetup` (el «sí» conversacional
  determinista) y, a continuación, la eclosión mediante `launchTuiCli`, inicializada con el mensaje de arranque.
  Instalaciones configuradas (modelo o configuración del Gateway preexistentes; las marcas de tiempo
  del asistente no demuestran nada, pues se comparten con configure/doctor):
  solo verificación; sin aplicación ni reinicio del servicio Gateway. Un fallo de aplicación
  recurre al chat conversacional.

### Fase 3 — transferencia prioritaria al navegador (PR #110054, fusionada)

- `src/commands/onboard-browser-handoff.ts` se encarga exclusivamente de la detección de sesiones
  gráficas (`SSH_CONNECTION`/`SSH_TTY`; `DISPLAY`/`WAYLAND_DISPLAY` en Linux)
  y de la espera de 60 segundos para la GUI / 300 segundos para SSH. Actualmente, la incorporación
  guiada solo habilita el traspaso en macOS; `--tui` y otras plataformas conservan la
  salida al terminal. La habilitación en Linux/Windows queda como seguimiento.
- Los enlaces del panel usan los mismos auxiliares `resolveAdvertisedControlUiLinks`,
  `resolveLocalControlUiProbeLinks` y `buildOnboardingControlUiUrl`
  que la finalización clásica. El inicio del navegador usa el auxiliar compartido `openUrl`.
- La disponibilidad consulta periódicamente el RPC `system-presence` existente como un **cliente de
  bucle invertido en modo CLI que presenta el secreto compartido configurado**: la ruta de confianza que usa
  cada comando `openclaw`. Un cliente sin procesar de la interfaz de control con autenticación compartida
  se rechaza con "se requiere la identidad del dispositivo" en gateways SecretRef. La comprobación previa de
  accesibilidad resuelve el mismo destino (y secreto) que el bucle de espera, por lo que la
  puerta y la espera nunca pueden discrepar sobre la autenticación. El traspaso solo se completa
  cuando una fila de presencia `openclaw-control-ui`/`webchat` conectada es nueva
  respecto a la referencia anterior al inicio (un panel ya abierto no puede
  completarlo).
- `gateway.controlUi.enabled: false` interrumpe el proceso antes de mostrar cualquier URL.
- Se ha comprobado de extremo a extremo con un gateway aislado que usa la misma configuración: impresión de la URL → conexión
  de un navegador real → "Panel conectado: continúa en el navegador" → sin
  salida al terminal. Un bloqueo anterior por "discrepancia de token" fue un artefacto del
  entorno de pruebas; consulte la guía de pruebas a continuación.

### Fase 4 — superficie web del custodio (integrada: #110141, #110242)

- Página `/custodian` sobre `openclaw.chat` con el componente de tarjetas de opciones
  (2-4 tarjetas, como máximo una recomendada, siempre se puede omitir); interfaz de incorporación mediante
  `?onboarding=1`; la finalización de la configuración inicial del modelo realiza el traspaso hacia ella.
- Las preguntas estructuradas son un campo aditivo tipado `question` en
  `SystemAgentChatResult` (texto `reply` por opción; la prosa siempre es independiente
  para la aplicación de macOS/TUI). Productores: ambas variantes de bienvenida de la incorporación y
  los pasos de selección/confirmación del asistente alojado con 2-4 opciones cerradas; los asistentes
  de canales reales se muestran como tarjetas. Se eliminó la solución provisional con marcadores de cadena de PR1.
- La propiedad de la sesión se limita a la URL del gateway + todas las credenciales presentadas
  (token, contraseña, token de arranque, token de dispositivo almacenado, persistente durante
  interrupciones transitorias del saludo); los turnos fallidos del usuario nunca pueden reproducirse; la entrada
  sensible se envía literalmente y se enmascara en la transcripción.

### Fase 5 — eclosión y arranque (integrada: #110173, #110331)

- El custodio crea un agente sin nombre (llamada a herramienta); el arranque del agente comienza
  al ponerse nombre a sí mismo. PR1 incluye la ceremonia limitada a tres momentos (nombre → frase del
  alma → pregunta sobre Skills) y aplaza para un seguimiento la escala de avatar autodibujado/generación de imágenes
  (candidatos generados por el modelo → marcas predefinidas → conservar el logotipo). Mismo
  hilo, cambio de avatar; la marca de la garra sigue reservada para el custodio. La
  identidad acordada se conserva dos veces: en `IDENTITY.md`/`SOUL.md` (lo que lee el agente)
  y mediante `openclaw agents set-identity` (lo que muestran los canales y la interfaz
  de usuario).
- Las recomendaciones (servicio de la fase 1, análisis almacenado con semántica de una sola vez) llegan como
  el último paso del arranque antes de eliminar el archivo de arranque: "¿conjunto mínimo
  o máxima comodidad?". El arranque lee la oferta almacenada mediante
  `openclaw onboard recommendations --json` (solo identificadores de instalación opacos) y
  confirma su recepción después de gestionar la elección para no volver a preguntar. Los botones de
  conexión de canales incluyen guías de configuración específicas por canal; el agente recopila
  las credenciales mediante conversación y transmite las escrituras de configuración al custodio
  ("preguntando a OpenClaw…" es la expresión canónica).
- El autoaprendizaje se pregunta, no se anuncia, y sirve también como consentimiento para el taller de Skills;
  describa la confianza de las versiones, el análisis, la verificación y las comprobaciones de integridad de ClawHub,
  además de la advertencia sobre el código del editor; nunca dé a entender que todas las versiones están firmadas.
- La eclosión automática ya está disponible: la aplicación de una configuración de instalación nueva anuncia la eclosión y
  realiza el traspaso (TUI de terminal / `open-agent` para clientes del gateway); la página web
  llega al chat del agente con el borrador "¡Despierta, amigo mío!" rellenado previamente. El
  traspaso solo se activa tras una verificación correcta posterior a la escritura. Ofrecer la opción cuando quedan
  cero agentes después de una eliminación (en lugar de hacerlo automáticamente) sigue pendiente como mejora.

### Fase 6 — presencia del custodio (PR1 integrada: #110269; los comentarios/la invocación están en PR2)

- Incluido en PR1: entrada "OpenClaw" fijada de forma predeterminada en la barra lateral (perfiles nuevos;
  los usuarios existentes conservan sus elementos fijados y acceden a ella mediante personalizar/More), "Preguntar a
  OpenClaw" como primera entrada de Settings y visitas `/custodian` con la interfaz
  normal que solicitan el saludo del cuidador (sin variante de bienvenida de incorporación), con
  Salir de la configuración mostrado solo en el modo de incorporación. Un panel de Settings integrado
  y acoplado necesita extraer la vista de conversación compartida (seguimiento).
- Comentarios reactivos a eventos con medidas de protección contra el efecto Clippy: solo cambios importantes o
  fallidos, como máximo una vez por visita a Settings salvo que se soliciten. La misma
  interfaz de eventos permite que el custodio dé voz posteriormente a una autenticación degradada o a canales
  averiados.
- Canales: invisible en el uso cotidiano (el agente transmite); accesible mediante
  invocación explícita y en eventos de agente inactivo dentro del mismo hilo, con su propio nombre y
  avatar de garra cuando la plataforma lo permite.
- Modelo débil detectado durante la configuración: establecer automáticamente `localModelLean`, y el custodio
  lo comunica con palabras sencillas y ofrece una actualización.
- El custodio conoce su apodo interno ("algunas personas me llaman el
  custodio; OpenClaw está bien") y siempre se refiere al agente por su nombre.

### Fase 7 — resiliencia (requiere una decisión del responsable antes de desarrollarla)

El planteamiento original — "el custodio debe ser accesible por muy dañada que esté
la configuración" — entra en conflicto con la política de seguridad del repositorio: la guía raíz
indica que el Gateway **rechaza el inicio** cuando la configuración no es válida estructuralmente,
y solo los fallos del propietario de SecretRef degradan las capacidades a
configuradas pero no disponibles. Servir cualquier superficie con una configuración no válida supone un cambio de política,
no un detalle de implementación. Hay dos alcances; elija uno:

- **Opción A (recomendada, compatible con la política): diagnóstico y reparación automáticos desde la CLI.** Cuando el
  inicio de un gateway o de la CLI falla debido a una configuración no válida con una forma conocida, la CLI ofrece
  ejecutar `openclaw doctor --fix` (o lo ejecuta con consentimiento), vuelve a intentarlo una vez e
  informa claramente. No cambia el comportamiento del gateway; el custodio sigue siendo accesible
  mediante la ruta degradada de SecretRef existente y el terminal.
- **Opción B (requiere la aprobación explícita del responsable + revisión de seguridad): modo de
  superficie mínima del gateway.** Si la configuración no es válida estructuralmente, iniciar una superficie
  restringida que solo sirva la conversación con el custodio y las acciones de diagnóstico y reparación. Esto
  modifica el contrato de inicio con cierre seguro y debe definir su propia estrategia de
  protección de entrada antes de escribir código.

Seguimientos restantes de las fases 4-6 (registrados, sin programar): escala de avatar/generación de imágenes
para la eclosión; representación en la aplicación de macOS del campo tipado `question`; un
panel de Settings integrado y acoplado para el custodio (requiere extraer la vista de conversación
compartida); comentarios reactivos a eventos e invocación desde canales/recuperación cuando el agente está inactivo
(PR2 de la fase 6); `localModelLean` automático para modelos débiles; decidir si los
elementos fijados guardados en la barra lateral de los usuarios existentes deben adoptar la entrada de OpenClaw.

## Guía de pruebas e integración (obtenida con esfuerzo; léala antes de las fases 4-6)

- **`OPENCLAW_STATE_DIR` no aísla el servicio Gateway.** La
  etiqueta de LaunchAgent (`ai.openclaw.gateway`) es global para la máquina: una prueba de incorporación
  de instalación nueva con un directorio de estado aislado REESCRIBIRÁ y REINICIARÁ el servicio real
  de la máquina (los scripts contenedores se guardan dentro del directorio aislado; el siguiente
  inicio del servicio falla cuando se limpia ese directorio). Después de cualquier prueba de instalación nueva,
  restaure con `openclaw gateway install --force && openclaw gateway
restart` desde el entorno real y verifique el plist. Seguimiento del producto:
  etiquetas de servicio limitadas al directorio de estado o detección de un servicio ajeno durante la incorporación.
- **Entorno seguro de extremo a extremo**: inicialice previamente la configuración aislada con una sección `gateway`
  (para que la incorporación use la ruta de instalación configurada y nunca toque
  el servicio) y ejecute `openclaw gateway run` como un proceso normal en primer plano en
  un puerto libre con un token simple. Ese entorno permitió comprobar el bucle de la fase 3,
  incluida la conexión de un navegador real.
- **Las rutas de autenticación difieren según la identidad del cliente, no solo según las credenciales.** Las lecturas de presencia y
  otras lecturas del operador usan un cliente de bucle invertido en modo CLI con credenciales de la
  misma configuración. Los gateways con autenticación por token requieren el secreto compartido; los gateways
  SecretRef/sin autenticación pueden recurrir a la autenticación de bucle invertido de confianza sin token. Un cliente
  de navegador identificado como interfaz de control necesita la identidad del dispositivo o la concesión de
  bucle invertido en contexto seguro. Una sonda que se autentica en un gateway que sirve una
  configuración DIFERENTE (consulte el problema de LaunchAgent) falla con "discrepancia de token"; ese
  artefacto bloqueó brevemente la fase 3.
- **Sondas de finalización**: `runSetupInferenceTest` limita la sonda de verificación a
  32 tokens de salida; las instrucciones personalizadas eluden el límite y quedan restringidas por el
  `maxTokens` propio del modelo. Los modelos de razonamiento consumen primero ese presupuesto con razonamiento
  oculto; un turno sin texto suele indicar que el presupuesto se agotó allí.
- **La integración del agente necesita CI alojada en el commit exacto de la cabecera.** Es posible que el flujo de trabajo pesado `CI`
  no entre en cola al realizar envíos bajo carga de la organización; la alternativa para el responsable es ejecutar
  una puerta de versión en la rama del PR:

  ```bash
  gh workflow run ci.yml --ref <branch> -f target_ref=<head-sha> -f release_gate=true -f pull_request_number=<pr>
  ```

  La ejecución debe realizarse en la
  referencia de la rama para que `head_sha` coincida, y el título pasa a ser
  `CI release gate <sha>`, que `scripts/verify-pr-hosted-gates.mjs`
  acepta. Después, prepare/integre `scripts/pr` como de costumbre.

- **Puertas que la CI aplica además de las pruebas específicas**: mapa de documentación
  (`pnpm docs:map:gen` después de añadir cualquier página de documentación), oxlint (`no-map-spread`,
  `max-lines`; divida los archivos, nunca suprima), `check:test-types`, código
  muerto de knip (exporte solo lo que consume producción; dirija las pruebas mediante API públicas)
  y el clasificador de particiones de pruebas en vivo
  (`test/scripts/test-live-shard.test.ts` debe enumerar cualquier `*.live.test.ts` nuevo).

## Registro de decisiones

- Análisis mágico con interruptor de desactivación, no consentimiento previo (fase 1; la divulgación aparece
  en la línea de progreso del análisis y en la nota de resultados).
- Flujo vertical completo, incluido el comando `device.apps` del Node (fase 1).
- Las Skills de ClawHub de terceros nunca se seleccionan previamente y se etiquetan como
  instalación del código del editor; las entradas oficiales pueden aparecer marcadas previamente
  (fase 1, postura de seguridad publicada).
- Dos tarjetas de acceso, no tres; consentimiento adelantado e integrado en la elección (fase 2).
- Eclosión automática con anuncio, no un botón bloqueante (fases 2/5).
- El navegador tiene prioridad: la salida al terminal es la alternativa, nunca una pregunta
  "¿terminal o navegador?" (fase 3).
- El custodio obtiene presencia en los canales (invocación + recuperación), no solo en web/CLI
  (fase 6).
- La eclosión ocurre en el mismo hilo con un cambio de avatar; tras completarse, la
  aplicación pasa a la interfaz de usuario normal (fase 5).
- La superficie de configuración conserva el nombre "Settings"; el custodio reside allí
  (y en la barra lateral) en lugar de sustituirla (fase 6).
- Las tarjetas de opciones están restringidas: 2-4 opciones, exactamente una recomendada, siempre
  se pueden omitir; el mismo componente sirve para la incorporación y la herramienta de preguntas del agente
  (fase 4).
- "Preguntando a OpenClaw…" es la expresión canónica de delegación; las almas pueden aportar matices,
  pero la narración de la herramienta permanece sencilla (fase 5).
- Los textos dirigidos al usuario nunca dicen "modo de código", "herramientas" ni "ventana de contexto" al
  explicar el recorte de modelos débiles (fase 6).

## Carencias conocidas y seguimientos

- La etiqueta LaunchAgent no está limitada al directorio de estado (dificultad de prueba mencionada anteriormente; también es una
  carencia real del producto para varias instancias).
- Semántica de una sola ejecución para las recomendaciones y análisis almacenado (fase 5); las nuevas ejecuciones
  vuelven a ofrecerlas actualmente.
- La transferencia al navegador solo está disponible en macOS; la habilitación para Linux/Windows está pendiente.
- La observación sobre el número de sesiones es cualitativa; los recuentos necesitan un mecanismo sencillo para obtener el número de sesiones.
- La transferencia al navegador lleva al panel normal; el enlace profundo al custodio
  en modo de incorporación llegará con la fase 4.
