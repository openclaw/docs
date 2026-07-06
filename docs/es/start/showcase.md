---
description: Real-world OpenClaw projects from the community
read_when:
    - Buscando ejemplos reales de uso de OpenClaw
    - Actualizando destacados de proyectos de la comunidad
summary: Proyectos e integraciones creados por la comunidad y potenciados por OpenClaw
title: Muestra
x-i18n:
    generated_at: "2026-07-06T21:51:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Proyectos de OpenClaw creados por la comunidad: ciclos de revisión de PR, aplicaciones móviles, automatización del hogar, sistemas de voz, devtools y flujos de trabajo de memoria, creados de forma nativa para chat en Telegram, WhatsApp, Discord y terminales.

<Info>
**¿Quieres aparecer aquí?** Comparte tu proyecto en [#self-promotion en Discord](https://discord.gg/clawd) o [etiqueta a @openclaw en X](https://x.com/openclaw).
</Info>

## Recién llegado de Discord

Destacados recientes en programación, devtools, móviles y creación de productos nativos para chat.

<CardGroup cols={2}>

<Card title="Despliegue instantáneo de HTML con Dropage" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Dile a tu agente "deploy this HTML" y recibe una URL pública en aproximadamente un segundo. Las páginas caducan automáticamente después de una hora: sin servidor, sin configuración, sin registro.
</Card>

<Card title="Verificador de URL antiphishing" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Pega cualquier URL y recibe un veredicto. Más de 2,5 M de dominios fraudulentos de 38 feeds (PhishTank, OpenPhish, CERT.PL y más), comparados localmente para que el historial de navegación nunca salga de la máquina.
</Card>

<Card title="Skills de razonamiento para diseño de producto" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Un trío para trabajo de producto: [Socratic Dialogue](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) repregunta una cuestión antes de responder, [Kano Model Strategist](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) clasifica funciones según lo que justifica su lugar, y [Legible Agent Output](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) reescribe la salida del agente en lenguaje claro.
</Card>

<Card title="Bróker de buzón para subagentes" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Evita que los orquestadores queden inactivos mientras los subagentes trabajan: un mecanismo de callback asíncrono donde los resultados llegan a un buzón en lugar de bloquear al agente principal.
</Card>

<Card title="lite-mode para máquinas con poca RAM" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Mantiene OpenClaw usable en máquinas de 2 a 4 GB: comprueba la memoria libre y recorta funciones pesadas antes de que el equipo empiece a usar swap. [Código fuente en GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="Rastreador de costes tokenomics" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Rastreador de coste de tokens de un ingeniero de NVIDIA con soporte de primera clase para OpenClaw: ve exactamente a dónde va el gasto de tu agente, por modelo y por sesión.
</Card>

<Card title="Generador de diagramas Excalidraw" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Describe un diagrama en el chat y recibe un boceto de Excalidraw generado programáticamente.
</Card>

<Card title="Skill de analítica GA4" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

Hizo que OpenClaw creara su propia herramienta de consultas de Google Analytics, luego la empaquetó y la publicó en ClawHub.
</Card>

<Card title="Rankings de modelos ClawEval" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Evalúa modelos en 59 roles de agente para responder "¿qué LLM para mi GPU?". Un favorito de la comunidad para elegir modelos locales.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Generación de canciones independiente del proveedor: planifica la pista, estructura letras y revisa resultados escasos en lugar de usar un prompt de una sola vez. Incluye una [variante MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) con control de BPM, tonalidad, estructura y mashup.
</Card>

<Card title="Revisión de PR a comentarios en Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termina el cambio, abre un PR, OpenClaw revisa el diff y responde en Telegram con sugerencias y un veredicto claro de fusión.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Comentarios de revisión de PR de OpenClaw entregados en Telegram" />
</Card>

<Card title="Skill de bodega en minutos" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Pidió a "Robby" (@openclaw) una skill local de bodega. Solicita una exportación CSV de muestra y una ruta de almacenamiento, luego crea y prueba la skill (962 botellas en el ejemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw creando una skill local de bodega a partir de CSV" />
</Card>

<Card title="Piloto automático de compras en Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plan de comidas semanal, productos habituales, reservar franja de entrega, confirmar pedido. Sin API, solo control del navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatización de compras en Tesco mediante chat" />
</Card>

<Card title="SNAG de captura a Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Atajo para una región de la pantalla, visión de Gemini, Markdown instantáneo en tu portapapeles.

  <img src="/assets/showcase/snag.png" alt="Herramienta SNAG de captura a markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplicación de escritorio para gestionar skills y comandos entre Agents, Claude, Codex y OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aplicación Agents UI" />
</Card>

<Card title="Notas de voz de Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Envuelve el TTS de papla.media y envía los resultados como notas de voz de Telegram (sin reproducción automática molesta).

  <img src="/assets/showcase/papla-tts.jpg" alt="Salida de nota de voz de Telegram desde TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Ayudante instalado con Homebrew para listar, inspeccionar y vigilar sesiones locales de OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor en ClawHub" />
</Card>

<Card title="Control de impresora 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controla y diagnostica impresoras BambuLab: estado, trabajos, cámara, AMS, calibración y más.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI en ClawHub" />
</Card>

<Card title="Transporte de Viena (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Salidas en tiempo real, interrupciones, estado de ascensores y rutas para el transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien en ClawHub" />
</Card>

<Card title="Comidas escolares de ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Reserva automatizada de comidas escolares en el Reino Unido mediante ParentPay. Usa coordenadas del ratón para hacer clic de forma fiable en celdas de tabla.
</Card>

<Card title="Carga a R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Carga a Cloudflare R2/S3 y genera enlaces seguros de descarga prefirmados. Útil para instancias remotas de OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="Skill de carga a R2 en ClawHub" />
</Card>

<Card title="Aplicación iOS vía Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Creó una aplicación iOS completa con mapas y grabación de voz, preparada para distribución en App Store íntegramente mediante chat de Telegram.
</Card>

<Card title="Asistente de salud Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Asistente personal de salud con IA que integra datos de Oura ring con calendario, citas y horario de gimnasio.

  <img src="/assets/showcase/oura-health.png" alt="Asistente de salud Oura ring" />
</Card>

<Card title="Kev's Dream Team (más de 14 agentes)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Más de 14 agentes bajo un Gateway con un orquestador Opus 4.5 que delega en trabajadores de Codex. Consulta el [artículo técnico](https://github.com/adam91holt/orchestrated-ai-articles) y [Clawdspace](https://github.com/adam91holt/clawdspace) para el aislamiento de agentes.
</Card>

<Card title="CLI de Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI para Linear que se integra con flujos de trabajo agénticos (Claude Code, OpenClaw). Gestiona issues, proyectos y flujos de trabajo desde la terminal.
</Card>

<Card title="CLI de Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lee, envía y archiva mensajes mediante Beeper Desktop. Usa la API local MCP de Beeper para que los agentes puedan gestionar todos tus chats (iMessage, WhatsApp y más) en un solo lugar.
</Card>

</CardGroup>

## Automatización y flujos de trabajo

Programación, control del navegador, ciclos de soporte y el lado del producto de "simplemente haz la tarea por mí".

<CardGroup cols={2}>

<Card title="Control de purificador de aire Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code descubrió y confirmó los controles del purificador; luego OpenClaw toma el relevo para gestionar la calidad del aire de la habitación.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Control de purificador de aire Winix mediante OpenClaw" />
</Card>

<Card title="Bonitas tomas de cámara del cielo" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Activado por una cámara en el tejado: pide a OpenClaw que tome una foto del cielo cada vez que se vea bonito. Diseñó una skill y tomó la foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Instantánea del cielo de una cámara de tejado capturada por OpenClaw" />
</Card>

<Card title="Escena visual de informe matutino" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Un prompt programado genera una imagen de escena cada mañana (tiempo, tareas, fecha, publicación favorita o cita) mediante una persona de OpenClaw.
</Card>

<Card title="Reserva de pista de pádel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Comprobador de disponibilidad de Playtomic más CLI de reserva. No vuelvas a perder una pista libre.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="captura de pantalla de padel-cli" />
</Card>

<Card title="Recepción contable" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Recopila PDF del correo electrónico y prepara documentos para un asesor fiscal. Contabilidad mensual en piloto automático.
</Card>

<Card title="Modo de desarrollo desde el sofá" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Reconstruyó un sitio personal completo vía Telegram mientras veía Netflix: de Notion a Astro, 18 publicaciones migradas, DNS a Cloudflare. Nunca abrió un portátil.
</Card>

<Card title="Agente de búsqueda de empleo" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Busca ofertas de empleo, las compara con palabras clave del CV y devuelve oportunidades relevantes con enlaces. Creado en 30 minutos usando la API de JSearch.
</Card>

<Card title="Constructor de skills de Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw se conectó a Jira y luego generó una nueva Skill sobre la marcha (antes de que existiera en ClawHub).
</Card>

<Card title="Skill de Todoist mediante Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatizó tareas de Todoist e hizo que OpenClaw generara la Skill directamente en el chat de Telegram.
</Card>

<Card title="Análisis de TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Inicia sesión en TradingView mediante automatización del navegador, captura gráficos y realiza análisis técnico bajo demanda. No se necesita API: solo control del navegador.
</Card>

<Card title="Negociación de coche ($4,200 ahorrados)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

Soltó a OpenClaw con concesionarios de coches: gestionó la negociación de ida y vuelta y rebajó $4,200 del precio.
</Card>

<Card title="Piloto automático de check-in de vuelos" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Encuentra el siguiente vuelo en el correo electrónico, completa el check-in en línea y elige un asiento de ventanilla, sin necesitar la aplicación de la aerolínea.
</Card>

<Card title="Presentación de reclamación de seguro" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Presentó una reclamación de seguro y programó la cita de seguimiento de forma autónoma.
</Card>

<Card title="Skill inmobiliaria de Idealista" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI de la API de Idealista para consultas y valoraciones de propiedades, envuelta como Skill para que el agente pueda buscar vivienda en el chat.
</Card>

<Card title="Back office de negocio de jardinería" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Supervisa Gmail en busca de órdenes de trabajo, analiza fotos de propiedades enviadas por Telegram, redacta presupuestos en PDF de varias páginas con LaTeX y factura mediante Xero.
</Card>

<Card title="Soporte automático en Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Supervisa un canal de empresa de Slack, responde de forma útil y reenvía notificaciones a Telegram. Corrigió de forma autónoma un error de producción en una aplicación desplegada sin que se lo pidieran.
</Card>

</CardGroup>

## Conocimiento y memoria

Sistemas que indexan, buscan, recuerdan y razonan sobre conocimiento personal o de equipo.

<CardGroup cols={2}>

<Card title="Aprendizaje de chino con xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Motor de aprendizaje de chino con comentarios de pronunciación y flujos de estudio mediante OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="comentarios de pronunciación de xuezh" />
</Card>

<Card title="Pipeline de análisis de publicaciones de X" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Extrajo 4 millones de publicaciones de las 100 cuentas principales de X y las convirtió en un pipeline de análisis consultable.
</Card>

<Card title="Resultados de laboratorio a Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Organizó años de resultados de análisis de sangre en una base de datos estructurada de Notion.
</Card>

<Card title="Segundo cerebro en Obsidian" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Asistente de uso diario en WhatsApp con toda la memoria almacenada como markdown en una bóveda de Obsidian con control de versiones: seguimiento de calorías y entrenamientos, listas de tareas y administración personal.
</Card>

<Card title="Bot de historia familiar" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Vive en un chat grupal familiar de Telegram, documenta historias de más de 50 familiares y hace preguntas de seguimiento informadas, respondiendo en nepalí para hablantes nativos.
</Card>

<Card title="Bóveda de memoria de WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Ingiere exportaciones completas de WhatsApp, transcribe más de 1,000 notas de voz, las contrasta con registros de git y genera informes markdown enlazados.
</Card>

<Card title="Búsqueda semántica de Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Añade búsqueda vectorial a marcadores de Karakeep usando Qdrant más embeddings de OpenAI u Ollama.
</Card>

<Card title="Memoria de Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Gestor de memoria separado que convierte archivos de sesión en recuerdos, luego en creencias y después en un modelo propio en evolución.
</Card>

</CardGroup>

## Voz y teléfono

Puntos de entrada centrados en voz, puentes telefónicos y flujos de trabajo intensivos en transcripción.

<CardGroup cols={2}>

<Card title="Voz de un toque con Pebble Ring" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Un toque en un Pebble Ring inicia una conversación de voz con OpenClaw: acceso al agente desde un dispositivo wearable.
</Card>

<Card title="Estudio multimedia para creadores" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Un estudio multimedia completo en el chat: TTS, transcripción y automatización del navegador conectados a Codex 5.2 y MiniMax.
</Card>

<Card title="Walkie-talkie con Action Button" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Action Button de iPhone conectado a OpenClaw: pulsa, habla y el agente responde como un walkie-talkie.
</Card>

<Card title="Puente telefónico Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Asistente de voz Vapi a puente HTTP de OpenClaw. Llamadas telefónicas casi en tiempo real con tu agente.
</Card>

<Card title="Transcripción de OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcripción de audio multilingüe mediante OpenRouter (Gemini y más). Disponible en ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill de transcripción de OpenRouter en ClawHub" />
</Card>

</CardGroup>

## Infraestructura y despliegue

Empaquetado, despliegue e integraciones que facilitan ejecutar y ampliar OpenClaw.

<CardGroup cols={2}>

<Card title="Complemento de Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway de OpenClaw ejecutándose en Home Assistant OS con soporte de túnel SSH y estado persistente.
</Card>

<Card title="Skill de Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Controla y automatiza dispositivos de Home Assistant mediante lenguaje natural.

  <img src="/assets/showcase/homeassistant.png" alt="Skill de Home Assistant en ClawHub" />
</Card>

<Card title="Gestor de barra de menús de macOS" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Aplicación nativa de barra de menús en Swift que muestra el estado del agente con controles rápidos.
</Card>

<Card title="Empaquetado con Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuración nixificada de OpenClaw con todo incluido para despliegues reproducibles.
</Card>

<Card title="Calendario CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill de calendario que usa khal y vdirsyncer. Integración de calendario autohospedado.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill de calendario CalDAV en ClawHub" />
</Card>

</CardGroup>

## Hogar y hardware

El lado físico de OpenClaw: hogares, sensores, cámaras, aspiradoras y otros dispositivos.

<CardGroup cols={2}>

<Card title="Skill de HomePod creada por uno mismo" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw encontró los HomePod en la red local y se escribió una Skill para controlarlos.
</Card>

<Card title="Interfaz de cubo holográfico de $35" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Un cubo holográfico económico como la cara física del agente sobre el escritorio.
</Card>

<Card title="Automatización GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automatización del hogar nativa de Nix con OpenClaw como interfaz, más paneles de Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Panel de Grafana de GoHome" />
</Card>

<Card title="Aspiradora Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Controla tu robot aspirador Roborock mediante conversación natural.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Estado de Roborock" />
</Card>

</CardGroup>

## Proyectos de la comunidad

Cosas que crecieron más allá de un único flujo de trabajo hasta convertirse en productos o ecosistemas más amplios.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Marketplace completo de equipos de astronomía. Construido con y alrededor del ecosistema OpenClaw.
</Card>

<Card title="Protocolo de negociación de agentes Clinch" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Negociación abierta entre agentes: tu agente regatea ofertas, horarios y acuerdos de servicio con otros nodos y firma criptográficamente el resultado; tú solo apruebas o rechazas.
</Card>

</CardGroup>

## Envía tu proyecto

<Steps>
  <Step title="Compártelo">
    Publica en [#self-promotion en Discord](https://discord.gg/clawd) o [tuitea a @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Incluye detalles">
    Cuéntanos qué hace, enlaza al repositorio o a la demo y comparte una captura de pantalla si tienes una.
  </Step>
  <Step title="Destaca en la página">
    Añadiremos los proyectos destacados a esta página.
  </Step>
</Steps>

## Relacionado

- [Primeros pasos](/es/start/getting-started)
- [OpenClaw](/es/start/openclaw)
- [Showcase completo de X en openclaw.ai](https://openclaw.ai/showcase/)
