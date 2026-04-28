---
description: Real-world OpenClaw projects from the community
read_when:
    - Buscas ejemplos reales de uso de OpenClaw
    - Actualizar los proyectos destacados de la comunidad
summary: Proyectos e integraciones creados por la comunidad e impulsados por OpenClaw
title: Showcase
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:51:15Z"
  model: gpt-5.4
  provider: openai
  source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
  source_path: start/showcase.md
  workflow: 15
---

Los proyectos de OpenClaw no son demos de juguete. La gente está lanzando ciclos de revisión de PR, apps móviles, automatización del hogar, sistemas de voz, herramientas de desarrollo y flujos de trabajo con mucha memoria desde los canales que ya usan: compilaciones nativas de chat sobre Telegram, WhatsApp, Discord y terminales; automatización real para reservas, compras y soporte sin esperar una API; e integraciones con el mundo físico con impresoras, aspiradoras, cámaras y sistemas del hogar.

<Info>
**¿Quieres aparecer aquí?** Comparte tu proyecto en [#self-promotion en Discord](https://discord.gg/clawd) o [etiqueta a @openclaw en X](https://x.com/openclaw).
</Info>

## Videos

Empieza aquí si quieres el camino más corto desde “¿qué es esto?” hasta “vale, ya lo entiendo”.

<CardGroup cols={3}>

<Card title="Recorrido completo de configuración" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 minutos. Instala, realiza la incorporación y consigue un primer asistente funcional de principio a fin.
</Card>

<Card title="Showcase de la comunidad" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  Un recorrido más rápido por proyectos reales, superficies y flujos de trabajo construidos alrededor de OpenClaw.
</Card>

<Card title="Proyectos en uso real" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Ejemplos de la comunidad, desde ciclos de programación nativos de chat hasta hardware y automatización personal.
</Card>

</CardGroup>

## Recién salido de Discord

Destacados recientes en programación, herramientas de desarrollo, móvil y creación de productos nativos de chat.

<CardGroup cols={2}>

<Card title="Revisión de PR con feedback en Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termina el cambio, abre un PR, OpenClaw revisa el diff y responde en Telegram con sugerencias más un veredicto claro de merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Feedback de revisión de PR de OpenClaw entregado en Telegram" />
</Card>

<Card title="Skill de bodega en minutos" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Le pidió a “Robby” (@openclaw) una Skill local para bodega. Solicita un CSV de ejemplo exportado y una ruta de almacenamiento, y luego crea y prueba la Skill (962 botellas en el ejemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw creando una Skill local de bodega a partir de CSV" />
</Card>

<Card title="Piloto automático para compras en Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plan de comidas semanal, habituales, reservar franja de entrega, confirmar pedido. Sin APIs, solo control del navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatización de compras en Tesco por chat" />
</Card>

<Card title="SNAG de captura de pantalla a Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Atajo de teclado para una región de pantalla, visión de Gemini y Markdown instantáneo en el portapapeles.

  <img src="/assets/showcase/snag.png" alt="Herramienta SNAG de captura de pantalla a Markdown" />
</Card>

<Card title="UI de Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App de escritorio para gestionar Skills y comandos en Agents, Claude, Codex y OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="App Agents UI" />
</Card>

<Card title="Notas de voz de Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Envuelve el TTS de papla.media y envía los resultados como notas de voz de Telegram (sin reproducción automática molesta).

  <img src="/assets/showcase/papla-tts.jpg" alt="Salida de nota de voz de Telegram desde TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper instalable con Homebrew para listar, inspeccionar y observar sesiones locales de OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor en ClawHub" />
</Card>

<Card title="Control de impresora 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controla y depura impresoras BambuLab: estado, trabajos, cámara, AMS, calibración y más.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI en ClawHub" />
</Card>

<Card title="Transporte de Viena (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Salidas en tiempo real, interrupciones, estado de ascensores y rutas para el transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien en ClawHub" />
</Card>

<Card title="Comidas escolares en ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Reserva automatizada de comidas escolares en Reino Unido mediante ParentPay. Usa coordenadas del ratón para hacer clic de forma fiable en celdas de tablas.
</Card>

<Card title="Subida a R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Sube a Cloudflare R2/S3 y genera enlaces de descarga seguros prefirmados. Útil para instancias remotas de OpenClaw.
</Card>

<Card title="App de iOS mediante Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Creó una app completa de iOS con mapas y grabación de voz, desplegada en TestFlight completamente mediante chat de Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="App de iOS en TestFlight" />
</Card>

<Card title="Asistente de salud con Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Asistente personal de salud con IA que integra datos de Oura Ring con calendario, citas y horario de gimnasio.

  <img src="/assets/showcase/oura-health.png" alt="Asistente de salud con Oura Ring" />
</Card>

<Card title="Kev's Dream Team (14+ agentes)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Más de 14 agentes bajo un solo gateway con un orquestador Opus 4.5 que delega en workers de Codex. Consulta el [análisis técnico](https://github.com/adam91holt/orchestrated-ai-articles) y [Clawdspace](https://github.com/adam91holt/clawdspace) para el sandboxing de agentes.
</Card>

<Card title="CLI de Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI para Linear que se integra con flujos de trabajo agénticos (Claude Code, OpenClaw). Gestiona issues, proyectos y flujos de trabajo desde la terminal.
</Card>

<Card title="CLI de Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lee, envía y archiva mensajes mediante Beeper Desktop. Usa la API MCP local de Beeper para que los agentes puedan gestionar todos tus chats (iMessage, WhatsApp y más) en un solo lugar.
</Card>

</CardGroup>

## Automatización y flujos de trabajo

Programación, control del navegador, ciclos de soporte y el lado de “haz la tarea por mí” del producto.

<CardGroup cols={2}>

<Card title="Control de purificador de aire Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code descubrió y confirmó los controles del purificador, y luego OpenClaw se hace cargo para gestionar la calidad del aire de la habitación.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Control de purificador de aire Winix mediante OpenClaw" />
</Card>

<Card title="Bonitas fotos del cielo con cámara" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Activado por una cámara en el tejado: pedir a OpenClaw que tome una foto del cielo cuando se vea bonito. Diseñó una Skill y tomó la foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Instantánea del cielo tomada por una cámara de tejado con OpenClaw" />
</Card>

<Card title="Escena visual de briefing matinal" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Un prompt programado genera cada mañana una imagen de una escena (clima, tareas, fecha, publicación o cita favorita) mediante una personalidad de OpenClaw.
</Card>

<Card title="Reserva de pista de pádel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Comprobador de disponibilidad de Playtomic más CLI de reservas. No vuelvas a perder una pista libre.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Captura de pantalla de padel-cli" />
</Card>

<Card title="Ingesta contable" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Recoge PDFs del correo, prepara documentos para un asesor fiscal. Contabilidad mensual en piloto automático.
</Card>

<Card title="Modo desarrollador desde el sofá" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Reconstruyó un sitio personal completo mediante Telegram mientras veía Netflix — de Notion a Astro, 18 publicaciones migradas, DNS a Cloudflare. Nunca abrió un portátil.
</Card>

<Card title="Agente de búsqueda de empleo" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Busca ofertas de trabajo, las compara con palabras clave del CV y devuelve oportunidades relevantes con enlaces. Creado en 30 minutos usando la API JSearch.
</Card>

<Card title="Constructor de Skill para Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw se conectó a Jira y luego generó una nueva Skill sobre la marcha (antes de que existiera en ClawHub).
</Card>

<Card title="Skill de Todoist mediante Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatizó tareas de Todoist e hizo que OpenClaw generara la Skill directamente en el chat de Telegram.
</Card>

<Card title="Análisis de TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Inicia sesión en TradingView mediante automatización del navegador, toma capturas de gráficos y realiza análisis técnico bajo demanda. No necesita API: solo control del navegador.
</Card>

<Card title="Soporte automático en Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Observa un canal de Slack de empresa, responde de forma útil y reenvía notificaciones a Telegram. Corrigió autónomamente un error de producción en una app desplegada sin que nadie se lo pidiera.
</Card>

</CardGroup>

## Conocimiento y memoria

Sistemas que indexan, buscan, recuerdan y razonan sobre conocimiento personal o de equipo.

<CardGroup cols={2}>

<Card title="xuezh para aprendizaje de chino" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Motor de aprendizaje de chino con retroalimentación de pronunciación y flujos de estudio mediante OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Retroalimentación de pronunciación de xuezh" />
</Card>

<Card title="Bóveda de memoria de WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Ingiere exportaciones completas de WhatsApp, transcribe más de 1k notas de voz, las contrasta con registros de git y genera informes Markdown enlazados.
</Card>

<Card title="Búsqueda semántica para Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Agrega búsqueda vectorial a los marcadores de Karakeep usando Qdrant más embeddings de OpenAI u Ollama.
</Card>

<Card title="Memoria al estilo Del Revés 2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Gestor de memoria independiente que convierte archivos de sesión en recuerdos, luego en creencias y finalmente en un modelo del yo en evolución.
</Card>

</CardGroup>

## Voz y teléfono

Puntos de entrada centrados en voz, puentes telefónicos y flujos de trabajo con mucha transcripción.

<CardGroup cols={2}>

<Card title="Puente telefónico Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Puente HTTP desde asistente de voz Vapi a OpenClaw. Llamadas telefónicas casi en tiempo real con tu agente.
</Card>

<Card title="Transcripción con OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcripción de audio multilingüe mediante OpenRouter (Gemini y más). Disponible en ClawHub.
</Card>

</CardGroup>

## Infraestructura y despliegue

Empaquetado, despliegue e integraciones que facilitan ejecutar y ampliar OpenClaw.

<CardGroup cols={2}>

<Card title="Complemento de Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway de OpenClaw ejecutándose en Home Assistant OS con compatibilidad con túnel SSH y estado persistente.
</Card>

<Card title="Skill de Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Controla y automatiza dispositivos de Home Assistant mediante lenguaje natural.
</Card>

<Card title="Empaquetado Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuración de OpenClaw basada en Nix y con todo incluido para despliegues reproducibles.
</Card>

<Card title="Calendario CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Skill de calendario usando khal y vdirsyncer. Integración de calendario autoalojada.
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

Controla tu robot aspirador Roborock mediante conversación natural.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Estado de Roborock" />
</Card>

</CardGroup>

## Proyectos de la comunidad

Cosas que crecieron más allá de un solo flujo de trabajo hasta convertirse en productos o ecosistemas más amplios.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Marketplace completo de equipo de astronomía. Creado con y alrededor del ecosistema de OpenClaw.
</Card>

</CardGroup>

## Envía tu proyecto

<Steps>
  <Step title="Compártelo">
    Publica en [#self-promotion en Discord](https://discord.gg/clawd) o [menciona a @openclaw en X](https://x.com/openclaw).
  </Step>
  <Step title="Incluye detalles">
    Cuéntanos qué hace, enlaza el repositorio o la demo y comparte una captura de pantalla si tienes una.
  </Step>
  <Step title="Aparece aquí">
    Agregaremos los proyectos más destacados a esta página.
  </Step>
</Steps>

## Relacionado

- [Primeros pasos](/es/start/getting-started)
- [OpenClaw](/es/start/openclaw)
