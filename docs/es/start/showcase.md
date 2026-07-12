---
description: Real-world OpenClaw projects from the community
read_when:
    - Buscando ejemplos reales de uso de OpenClaw
    - Actualización de proyectos destacados de la comunidad
summary: Proyectos e integraciones creados por la comunidad y desarrollados con OpenClaw
title: Galería de proyectos
x-i18n:
    generated_at: "2026-07-11T23:36:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Proyectos de OpenClaw creados por la comunidad: ciclos de revisión de PR, aplicaciones móviles, automatización del hogar, sistemas de voz, herramientas de desarrollo y flujos de trabajo de memoria, creados de forma nativa para el chat en Telegram, WhatsApp, Discord y terminales.

<Info>
**¿Quieres aparecer aquí?** Comparte tu proyecto en [#self-promotion en Discord](https://discord.gg/clawd) o [etiqueta a @openclaw en X](https://x.com/openclaw).
</Info>

## Novedades de Discord

Proyectos recientes destacados de programación, herramientas de desarrollo, aplicaciones móviles y creación de productos nativos para chat.

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Dile a tu agente «despliega este HTML» y recibe una URL pública en aproximadamente un segundo. Las páginas caducan automáticamente después de una hora: sin servidor, sin configuración y sin registro.
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Pega cualquier URL y recibe un veredicto. Más de 2,5 millones de dominios fraudulentos procedentes de 38 fuentes (PhishTank, OpenPhish, CERT.PL y otras), comparados localmente para que el historial de navegación nunca salga del equipo.
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Un trío para el trabajo de producto: [Diálogo socrático](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) examina minuciosamente una pregunta antes de responder, [Estratega del modelo Kano](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) clasifica las funciones según si merecen su lugar y [Resultados legibles del agente](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) reescribe los resultados del agente en lenguaje sencillo.
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Evita que los orquestadores permanezcan inactivos mientras trabajan los subagentes: un mecanismo de devolución de llamada asíncrona en el que los resultados llegan a un buzón en lugar de bloquear al agente principal.
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Mantiene OpenClaw operativo en equipos con 2-4 GB: comprueba la memoria libre y reduce las funciones pesadas antes de que el sistema empiece a usar la memoria de intercambio. [Código fuente en GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Herramienta de seguimiento del coste de los tokens creada por un ingeniero de NVIDIA, con compatibilidad de primera clase con OpenClaw: consulta exactamente a qué se destina el gasto de tu agente, por modelo y por sesión.
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Describe un diagrama en el chat y recibe un boceto de Excalidraw generado mediante programación.
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

Hizo que OpenClaw creara su propia herramienta de consultas de Google Analytics y después la empaquetó y publicó en ClawHub.
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Evalúa modelos en 59 roles de agente para responder «¿qué LLM debo usar con mi GPU?». Una opción muy popular en la comunidad para elegir modelos locales.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Generación de canciones independiente del proveedor: planifica la pista, estructura la letra y revisa los resultados incompletos en lugar de depender de una única instrucción. Incluye una [variante de MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) con control del BPM, la tonalidad, la estructura y las mezclas.
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termina el cambio, abre un PR, OpenClaw revisa las diferencias y responde en Telegram con sugerencias y un veredicto claro sobre la fusión.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Pidió a «Robby» (@openclaw) una función local para gestionar una bodega. Solicita una exportación CSV de muestra y una ruta de almacenamiento; después crea y prueba la función (962 botellas en el ejemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plan de comidas semanal, productos habituales, reserva de la franja de entrega y confirmación del pedido. Sin API, solo mediante el control del navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Selecciona una región de la pantalla con una tecla de acceso rápido, procésala con la visión de Gemini y obtén Markdown al instante en el portapapeles.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplicación de escritorio para gestionar Skills y comandos entre Agents, Claude, Codex y OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Comunidad** • `voice` `tts` `telegram`

Integra la conversión de texto a voz de papla.media y envía los resultados como notas de voz de Telegram (sin molesta reproducción automática).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Herramienta auxiliar instalada mediante Homebrew para enumerar, inspeccionar y supervisar sesiones locales de OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controla y soluciona problemas de impresoras BambuLab: estado, trabajos, cámara, AMS, calibración y mucho más.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Salidas en tiempo real, incidencias, estado de los ascensores y planificación de rutas para el transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Reserva automatizada de comidas escolares en el Reino Unido mediante ParentPay. Utiliza coordenadas del ratón para hacer clic de forma fiable en las celdas de la tabla.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Carga archivos en Cloudflare R2/S3 y genera enlaces de descarga prefirmados seguros. Resulta útil para instancias remotas de OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Creó una aplicación completa para iOS con mapas y grabación de voz, preparada para distribuirse en App Store íntegramente mediante un chat de Telegram.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Asistente personal de salud con IA que integra los datos del anillo Oura con el calendario, las citas y el horario del gimnasio.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Más de 14 agentes bajo un único Gateway, con un orquestador Opus 4.5 que delega tareas a trabajadores Codex. Consulta el [artículo técnico](https://github.com/adam91holt/orchestrated-ai-articles) y [Clawdspace](https://github.com/adam91holt/clawdspace) para conocer el aislamiento de los agentes.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI para Linear que se integra con flujos de trabajo basados en agentes (Claude Code, OpenClaw). Gestiona incidencias, proyectos y flujos de trabajo desde la terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lee, envía y archiva mensajes mediante Beeper Desktop. Utiliza la API MCP local de Beeper para que los agentes puedan gestionar todos tus chats (iMessage, WhatsApp y otros) desde un único lugar.
</Card>

</CardGroup>

## Automatización y flujos de trabajo

Programación de tareas, control del navegador, ciclos de asistencia y la faceta de «simplemente haz la tarea por mí» del producto.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code descubrió y confirmó los controles del purificador; después, OpenClaw toma el relevo para gestionar la calidad del aire de la habitación.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Activado por una cámara instalada en el tejado: pide a OpenClaw que tome una foto del cielo cada vez que se vea bonito. Diseñó una función y tomó la fotografía.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Una instrucción programada genera cada mañana la imagen de una escena (tiempo, tareas, fecha, publicación o cita favorita) mediante una personalidad de OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Comprobador de disponibilidad de Playtomic y CLI de reservas. No vuelvas a perderte una pista libre.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Comunidad** • `automation` `email` `pdf`

Recopila archivos PDF del correo electrónico y prepara los documentos para un asesor fiscal. Contabilidad mensual automatizada.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Reconstruyó un sitio personal completo mediante Telegram mientras veía Netflix: migración de Notion a Astro, 18 publicaciones transferidas y DNS trasladado a Cloudflare. No abrió el portátil en ningún momento.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Busca ofertas de empleo, las compara con las palabras clave del currículum y devuelve oportunidades pertinentes con enlaces. Creado en 30 minutos mediante la API de JSearch.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw se conectó a Jira y luego generó una nueva skill sobre la marcha (antes de que existiera en ClawHub).
</Card>

<Card title="Skill de Todoist mediante Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatizó tareas de Todoist e hizo que OpenClaw generara la skill directamente en el chat de Telegram.
</Card>

<Card title="Análisis de TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Inicia sesión en TradingView mediante automatización del navegador, captura gráficos y realiza análisis técnicos bajo demanda. No se necesita una API, solo controlar el navegador.
</Card>

<Card title="Negociación de un automóvil (ahorro de 4200 USD)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

Se dejó a OpenClaw negociar con concesionarios de automóviles: gestionó todo el intercambio y consiguió rebajar el precio en 4200 USD.
</Card>

<Card title="Piloto automático para la facturación de vuelos" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Busca el próximo vuelo en el correo electrónico, completa el proceso de facturación en línea y elige un asiento junto a la ventana, sin necesitar la aplicación de la aerolínea.
</Card>

<Card title="Presentación de reclamaciones de seguros" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Presentó una reclamación al seguro y programó de forma autónoma la cita de seguimiento.
</Card>

<Card title="Skill inmobiliaria de Idealista" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI de la API de Idealista para consultas y valoraciones de propiedades, encapsulada como una skill para que el agente pueda buscar vivienda desde el chat.
</Card>

<Card title="Administración de un negocio de jardinería" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Supervisa Gmail en busca de órdenes de trabajo, analiza fotos de propiedades enviadas por Telegram, redacta presupuestos de varias páginas en PDF con LaTeX y factura mediante Xero.
</Card>

<Card title="Asistencia automática en Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Supervisa un canal empresarial de Slack, responde de forma útil y reenvía notificaciones a Telegram. Corrigió de forma autónoma un error de producción en una aplicación desplegada sin que se lo pidieran.
</Card>

</CardGroup>

## Conocimiento y memoria

Sistemas que indexan, buscan, recuerdan y razonan sobre el conocimiento personal o de un equipo.

<CardGroup cols={2}>

<Card title="Aprendizaje de chino con xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Motor de aprendizaje de chino con comentarios sobre la pronunciación y flujos de estudio mediante OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Comentarios de xuezh sobre la pronunciación" />
</Card>

<Card title="Canalización de análisis de publicaciones de X" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Recopiló cuatro millones de publicaciones de cien cuentas destacadas de X y las convirtió en una canalización de análisis consultable.
</Card>

<Card title="Resultados de laboratorio en Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Organizó años de resultados de análisis de sangre en una base de datos estructurada de Notion.
</Card>

<Card title="Segundo cerebro en Obsidian" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Asistente de uso diario en WhatsApp con toda la memoria almacenada como Markdown en una bóveda de Obsidian con control de versiones: seguimiento de calorías y entrenamientos, listas de tareas y gestión de asuntos personales.
</Card>

<Card title="Bot de historia familiar" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Participa en un chat grupal familiar de Telegram, documenta historias de más de 50 familiares y formula preguntas de seguimiento bien fundamentadas, con respuestas en nepalí para hablantes nativos.
</Card>

<Card title="Bóveda de memoria de WhatsApp" icon="vault">
  **Comunidad** • `memory` `transcription` `indexing`

Ingiere exportaciones completas de WhatsApp, transcribe más de mil notas de voz, contrasta la información con los registros de Git y genera informes Markdown enlazados.
</Card>

<Card title="Búsqueda semántica de Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Añade búsqueda vectorial a los marcadores de Karakeep mediante Qdrant y embeddings de OpenAI u Ollama.
</Card>

<Card title="Memoria de Inside-Out-2" icon="brain">
  **Comunidad** • `memory` `beliefs` `self-model`

Gestor de memoria independiente que convierte archivos de sesión en recuerdos, luego en creencias y, finalmente, en un modelo de sí mismo en constante evolución.
</Card>

</CardGroup>

## Voz y teléfono

Puntos de entrada centrados en la voz, puentes telefónicos y flujos de trabajo con uso intensivo de transcripciones.

<CardGroup cols={2}>

<Card title="Voz con un toque mediante Pebble Ring" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Un toque en un Pebble Ring inicia una conversación de voz con OpenClaw, lo que permite acceder al agente desde un dispositivo ponible.
</Card>

<Card title="Estudio multimedia para creadores" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Un estudio multimedia completo en el chat: TTS, transcripción y automatización del navegador conectados a Codex 5.2 y MiniMax.
</Card>

<Card title="Walkie-talkie con el botón de acción" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

El botón de acción del iPhone está conectado a OpenClaw: se pulsa, se habla y el agente responde como un walkie-talkie.
</Card>

<Card title="Puente telefónico Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Puente HTTP entre el asistente de voz Vapi y OpenClaw. Llamadas telefónicas casi en tiempo real con el agente.
</Card>

<Card title="Transcripción con OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcripción de audio multilingüe mediante OpenRouter (Gemini y otros). Disponible en ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill de transcripción de OpenRouter en ClawHub" />
</Card>

</CardGroup>

## Infraestructura y despliegue

Empaquetado, despliegue e integraciones que facilitan la ejecución y ampliación de OpenClaw.

<CardGroup cols={2}>

<Card title="Complemento de Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway de OpenClaw ejecutándose en Home Assistant OS con compatibilidad con túneles SSH y estado persistente.
</Card>

<Card title="Skill de Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Controla y automatiza dispositivos de Home Assistant mediante lenguaje natural.

  <img src="/assets/showcase/homeassistant.png" alt="Skill de Home Assistant en ClawHub" />
</Card>

<Card title="Gestor de la barra de menús de macOS" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Aplicación nativa de Swift para la barra de menús que muestra el estado del agente y ofrece controles rápidos.
</Card>

<Card title="Empaquetado con Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuración de OpenClaw adaptada a Nix y con todo lo necesario para despliegues reproducibles.
</Card>

<Card title="Calendario CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill de calendario que utiliza khal y vdirsyncer. Integración con calendarios autoalojados.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill de calendario CalDAV en ClawHub" />
</Card>

</CardGroup>

## Hogar y hardware

La faceta de OpenClaw en el mundo físico: hogares, sensores, cámaras, aspiradoras y otros dispositivos.

<CardGroup cols={2}>

<Card title="Skill de HomePod creada automáticamente" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw encontró los HomePod en la red local y creó por sí mismo una skill para controlarlos.
</Card>

<Card title="Interfaz de cubo holográfico de 35 USD" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Un cubo holográfico económico que sirve como rostro físico del agente sobre el escritorio.
</Card>

<Card title="Automatización GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automatización del hogar nativa de Nix con OpenClaw como interfaz, además de paneles de Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Panel de Grafana de GoHome" />
</Card>

<Card title="Aspiradora Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Controla el robot aspirador Roborock mediante conversaciones en lenguaje natural.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Estado de Roborock" />
</Card>

</CardGroup>

## Proyectos de la comunidad

Proyectos que evolucionaron más allá de un único flujo de trabajo hasta convertirse en productos o ecosistemas más amplios.

<CardGroup cols={2}>

<Card title="Mercado StarSwap" icon="star" href="https://star-swap.com/">
  **Comunidad** • `marketplace` `astronomy` `webapp`

Un mercado completo de equipos de astronomía. Creado con el ecosistema de OpenClaw y en torno a él.
</Card>

<Card title="Protocolo de negociación de agentes Clinch" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Negociación abierta entre agentes: el agente negocia acuerdos, horarios y contratos de servicios con otros nodos, y firma criptográficamente el resultado; el usuario solo tiene que aprobarlo o rechazarlo.
</Card>

</CardGroup>

## Envía tu proyecto

<Steps>
  <Step title="Compártelo">
    Publica en [#self-promotion en Discord](https://discord.gg/clawd) o [tuitea a @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Incluye los detalles">
    Cuéntanos qué hace, incluye un enlace al repositorio o a la demostración y comparte una captura de pantalla si tienes una.
  </Step>
  <Step title="Aparece en esta página">
    Añadiremos los proyectos más destacados a esta página.
  </Step>
</Steps>

## Contenido relacionado

- [Primeros pasos](/es/start/getting-started)
- [OpenClaw](/es/start/openclaw)
- [Galería completa de X en openclaw.ai](https://openclaw.ai/showcase/)
