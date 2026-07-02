---
description: Real-world OpenClaw projects from the community
read_when:
    - Buscando ejemplos reales de uso de OpenClaw
    - Actualizando los proyectos destacados de la comunidad
summary: Proyectos e integraciones creados por la comunidad e impulsados por OpenClaw
title: Muestra
x-i18n:
    generated_at: "2026-07-02T07:57:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

Los proyectos de OpenClaw no son demostraciones de juguete. La gente está enviando bucles de revisión de PR, aplicaciones móviles, automatización del hogar, sistemas de voz, devtools y flujos de trabajo intensivos en memoria desde los canales que ya usa: compilaciones nativas de chat en Telegram, WhatsApp, Discord y terminales; automatización real para reservas, compras y soporte sin esperar una API; e integraciones con el mundo físico mediante impresoras, aspiradoras, cámaras y sistemas del hogar.

<Info>
**¿Quieres aparecer aquí?** Comparte tu proyecto en [#self-promotion en Discord](https://discord.gg/clawd) o [etiqueta a @openclaw en X](https://x.com/openclaw).
</Info>

## Lo más reciente de Discord

Destacados recientes en programación, devtools, móvil y creación de productos nativos de chat.

<CardGroup cols={2}>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termina el cambio, abre un PR, OpenClaw revisa el diff y responde en Telegram con sugerencias y un veredicto claro de merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Pidió a "Robby" (@openclaw) un Skill local de bodega. Solicita una exportación CSV de muestra y una ruta de almacenamiento, luego crea y prueba el Skill (962 botellas en el ejemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plan semanal de comidas, productos habituales, reservar franja de entrega, confirmar pedido. Sin APIs, solo control del navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Selecciona una región de pantalla con una tecla rápida, Gemini vision, Markdown instantáneo en tu portapapeles.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplicación de escritorio para gestionar Skills y comandos en Agents, Claude, Codex y OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Envuelve el TTS de papla.media y envía los resultados como notas de voz de Telegram (sin reproducción automática molesta).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Ayudante instalado con Homebrew para listar, inspeccionar y observar sesiones locales de OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controla y diagnostica impresoras BambuLab: estado, trabajos, cámara, AMS, calibración y más.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Salidas en tiempo real, interrupciones, estado de ascensores y rutas para el transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Reserva automatizada de comidas escolares en el Reino Unido mediante ParentPay. Usa coordenadas del ratón para hacer clic de forma fiable en celdas de tablas.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Sube archivos a Cloudflare R2/S3 y genera enlaces de descarga prefirmados seguros. Útil para instancias remotas de OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Creó una aplicación iOS completa con mapas y grabación de voz, preparada para distribuirse en App Store íntegramente mediante chat de Telegram.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Asistente personal de salud con IA que integra datos del anillo Oura con calendario, citas y horario de gimnasio.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Más de 14 agentes bajo un solo Gateway con un orquestador Opus 4.5 que delega en trabajadores Codex. Consulta el [artículo técnico](https://github.com/adam91holt/orchestrated-ai-articles) y [Clawdspace](https://github.com/adam91holt/clawdspace) para el aislamiento de agentes.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI para Linear que se integra con flujos de trabajo agénticos (Claude Code, OpenClaw). Gestiona incidencias, proyectos y flujos de trabajo desde la terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lee, envía y archiva mensajes mediante Beeper Desktop. Usa la API MCP local de Beeper para que los agentes puedan gestionar todos tus chats (iMessage, WhatsApp y más) en un solo lugar.
</Card>

</CardGroup>

## Automatización y flujos de trabajo

Programación, control del navegador, bucles de soporte y el lado de "haz la tarea por mí" del producto.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code descubrió y confirmó los controles del purificador, luego OpenClaw toma el relevo para gestionar la calidad del aire de la habitación.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Activado por una cámara de tejado: pide a OpenClaw que tome una foto del cielo cuando se vea bonito. Diseñó un Skill y tomó la foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Un prompt programado genera una imagen de escena cada mañana (tiempo, tareas, fecha, publicación favorita o cita) mediante una persona de OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Comprobador de disponibilidad de Playtomic más CLI de reserva. No vuelvas a perder una pista libre.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Recopila PDFs desde el correo electrónico y prepara documentos para un asesor fiscal. Contabilidad mensual en piloto automático.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Reconstruyó un sitio personal completo mediante Telegram mientras veía Netflix: de Notion a Astro, 18 publicaciones migradas, DNS a Cloudflare. Nunca abrió un portátil.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Busca ofertas de empleo, las compara con palabras clave del CV y devuelve oportunidades relevantes con enlaces. Creado en 30 minutos usando la API de JSearch.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw se conectó a Jira y luego generó un nuevo Skill sobre la marcha (antes de que existiera en ClawHub).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatizó tareas de Todoist e hizo que OpenClaw generara el Skill directamente en el chat de Telegram.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Inicia sesión en TradingView mediante automatización del navegador, captura gráficos y realiza análisis técnico bajo demanda. No hace falta API: solo control del navegador.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Vigila un canal de Slack de la empresa, responde de forma útil y reenvía notificaciones a Telegram. Corrigió de forma autónoma un bug de producción en una aplicación desplegada sin que se lo pidieran.
</Card>

</CardGroup>

## Conocimiento y memoria

Sistemas que indexan, buscan, recuerdan y razonan sobre conocimiento personal o de equipo.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Motor de aprendizaje de chino con feedback de pronunciación y flujos de estudio mediante OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Ingiere exportaciones completas de WhatsApp, transcribe más de 1.000 notas de voz, las coteja con registros de git y genera informes Markdown enlazados.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Añade búsqueda vectorial a marcadores de Karakeep usando Qdrant más embeddings de OpenAI u Ollama.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Gestor de memoria separado que convierte archivos de sesión en recuerdos, luego en creencias y después en un modelo propio en evolución.
</Card>

</CardGroup>

## Voz y teléfono

Puntos de entrada centrados en voz, puentes telefónicos y flujos de trabajo intensivos en transcripción.

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Puente de asistente de voz Vapi a HTTP de OpenClaw. Llamadas telefónicas casi en tiempo real con tu agente.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcripción de audio multilingüe mediante OpenRouter (Gemini y más). Disponible en ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Infraestructura y despliegue

Empaquetado, despliegue e integraciones que facilitan ejecutar y ampliar OpenClaw.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway de OpenClaw ejecutándose en Home Assistant OS con soporte para túnel SSH y estado persistente.
</Card>

<Card title="Skill de Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Controla y automatiza dispositivos de Home Assistant mediante lenguaje natural.

  <img src="/assets/showcase/homeassistant.png" alt="Skill de Home Assistant en ClawHub" />
</Card>

<Card title="Empaquetado con Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuración nixificada de OpenClaw con todo incluido para despliegues reproducibles.
</Card>

<Card title="Calendario CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill de calendario que usa khal y vdirsyncer. Integración de calendario autoalojada.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill de calendario CalDAV en ClawHub" />
</Card>

</CardGroup>

## Hogar y hardware

El lado físico de OpenClaw: hogares, sensores, cámaras, aspiradoras y otros dispositivos.

<CardGroup cols={2}>

<Card title="Automatización GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automatización del hogar nativa de Nix con OpenClaw como interfaz, además de paneles de Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Panel de Grafana de GoHome" />
</Card>

<Card title="Aspiradora Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Controla tu robot aspirador Roborock mediante una conversación natural.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Estado de Roborock" />
</Card>

</CardGroup>

## Proyectos de la comunidad

Cosas que crecieron más allá de un único flujo de trabajo hasta convertirse en productos o ecosistemas más amplios.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Comunidad** • `marketplace` `astronomy` `webapp`

Marketplace completo de equipo astronómico. Creado con y en torno al ecosistema de OpenClaw.
</Card>

</CardGroup>

## Envía tu proyecto

<Steps>
  <Step title="Compártelo">
    Publica en [#self-promotion en Discord](https://discord.gg/clawd) o [tuitea a @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Incluye detalles">
    Cuéntanos qué hace, enlaza el repositorio o la demo y comparte una captura de pantalla si tienes una.
  </Step>
  <Step title="Consigue aparecer">
    Añadiremos los proyectos destacados a esta página.
  </Step>
</Steps>

## Relacionado

- [Primeros pasos](/es/start/getting-started)
- [OpenClaw](/es/start/openclaw)
