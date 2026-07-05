---
description: Real-world OpenClaw projects from the community
read_when:
    - Buscando ejemplos reales de uso de OpenClaw
    - Actualizando los proyectos destacados de la comunidad
summary: Proyectos e integraciones creados por la comunidad y potenciados por OpenClaw
title: Muestra
x-i18n:
    generated_at: "2026-07-05T11:42:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aa5655ffc9536d17f77bac3160a4c36f18340c88b882498b9e23f72a2e5aed60
    source_path: start/showcase.md
    workflow: 16
---

Proyectos de OpenClaw creados por la comunidad: bucles de revisión de PR, aplicaciones móviles, automatización del hogar, sistemas de voz, devtools y flujos de trabajo de memoria, creados de forma nativa para chat en Telegram, WhatsApp, Discord y terminales.

<Info>
**¿Quieres aparecer aquí?** Comparte tu proyecto en [#self-promotion en Discord](https://discord.gg/clawd) o [etiqueta a @openclaw en X](https://x.com/openclaw).
</Info>

## Lo más reciente de Discord

Proyectos destacados recientes de programación, devtools, móvil y creación de productos nativos para chat.

<CardGroup cols={2}>

<Card title="Revisión de PR a comentarios en Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termina el cambio, abre un PR, OpenClaw revisa el diff y responde en Telegram con sugerencias y un veredicto claro sobre la fusión.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Comentarios de revisión de PR de OpenClaw entregados en Telegram" />
</Card>

<Card title="Skill de bodega en minutos" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Pidió a "Robby" (@openclaw) un skill local para una bodega. Solicita una exportación CSV de muestra y una ruta de almacenamiento, y luego crea y prueba el skill (962 botellas en el ejemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw creando un skill local de bodega desde CSV" />
</Card>

<Card title="Autopiloto para compras en Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plan semanal de comidas, productos habituales, reservar franja de entrega, confirmar pedido. Sin API, solo control del navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatización de compras en Tesco por chat" />
</Card>

<Card title="SNAG de captura de pantalla a Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Atajo para seleccionar una región de la pantalla, visión de Gemini, Markdown instantáneo en el portapapeles.

  <img src="/assets/showcase/snag.png" alt="Herramienta SNAG de captura de pantalla a Markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplicación de escritorio para gestionar Skills y comandos en Agents, Claude, Codex y OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aplicación Agents UI" />
</Card>

<Card title="Notas de voz de Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Envuelve el TTS de papla.media y envía los resultados como notas de voz de Telegram (sin reproducción automática molesta).

  <img src="/assets/showcase/papla-tts.jpg" alt="Salida de nota de voz de Telegram desde TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Ayudante instalado con Homebrew para listar, inspeccionar y observar sesiones locales de OpenAI Codex (CLI + VS Code).

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

Reserva automatizada de comidas escolares en el Reino Unido mediante ParentPay. Usa coordenadas del ratón para hacer clic de forma fiable en celdas de tablas.
</Card>

<Card title="Carga a R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Carga en Cloudflare R2/S3 y genera enlaces de descarga seguros prefirmados. Útil para instancias remotas de OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="Skill de carga a R2 en ClawHub" />
</Card>

<Card title="Aplicación iOS vía Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Creó una aplicación iOS completa con mapas y grabación de voz, preparada para distribución en App Store íntegramente mediante chat de Telegram.
</Card>

<Card title="Asistente de salud de Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Asistente personal de salud con IA que integra datos del anillo Oura con calendario, citas y horario de gimnasio.

  <img src="/assets/showcase/oura-health.png" alt="Asistente de salud de Oura Ring" />
</Card>

<Card title="Kev's Dream Team (14+ agentes)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Más de 14 agentes bajo un Gateway con un orquestador Opus 4.5 que delega en trabajadores de Codex. Consulta el [artículo técnico](https://github.com/adam91holt/orchestrated-ai-articles) y [Clawdspace](https://github.com/adam91holt/clawdspace) para el aislamiento de agentes.
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

Programación, control del navegador, bucles de soporte y el lado del producto de "simplemente haz la tarea por mí".

<CardGroup cols={2}>

<Card title="Control del purificador de aire Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code descubrió y confirmó los controles del purificador; luego OpenClaw toma el relevo para gestionar la calidad del aire de la habitación.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Control del purificador de aire Winix mediante OpenClaw" />
</Card>

<Card title="Fotos bonitas del cielo con cámara" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Activado por una cámara en el tejado: pide a OpenClaw que tome una foto del cielo cuando se vea bonito. Diseñó un skill y tomó la foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Instantánea del cielo de una cámara de tejado capturada por OpenClaw" />
</Card>

<Card title="Escena visual de briefing matutino" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Un prompt programado genera una imagen de escena cada mañana (tiempo, tareas, fecha, publicación o cita favorita) mediante una persona de OpenClaw.
</Card>

<Card title="Reserva de pista de pádel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Verificador de disponibilidad de Playtomic más CLI de reservas. No vuelvas a perder una pista libre.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Captura de pantalla de padel-cli" />
</Card>

<Card title="Recepción contable" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Recopila PDF desde el correo electrónico y prepara documentos para un asesor fiscal. Contabilidad mensual en piloto automático.
</Card>

<Card title="Modo desarrollo desde el sofá" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Reconstruyó un sitio personal entero mediante Telegram mientras veía Netflix: de Notion a Astro, 18 publicaciones migradas, DNS a Cloudflare. Nunca abrió un portátil.
</Card>

<Card title="Agente de búsqueda de empleo" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Busca ofertas de empleo, las compara con palabras clave del CV y devuelve oportunidades relevantes con enlaces. Creado en 30 minutos usando la API JSearch.
</Card>

<Card title="Constructor de skill para Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw se conectó a Jira y luego generó un nuevo skill sobre la marcha (antes de que existiera en ClawHub).
</Card>

<Card title="Skill de Todoist vía Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatizó tareas de Todoist e hizo que OpenClaw generara el skill directamente en el chat de Telegram.
</Card>

<Card title="Análisis de TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Inicia sesión en TradingView mediante automatización del navegador, captura gráficos y realiza análisis técnico bajo demanda. No hace falta API: solo control del navegador.
</Card>

<Card title="Soporte automático en Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Observa un canal de Slack de la empresa, responde de forma útil y reenvía notificaciones a Telegram. Corrigió de forma autónoma un bug de producción en una aplicación desplegada sin que se lo pidieran.
</Card>

</CardGroup>

## Conocimiento y memoria

Sistemas que indexan, buscan, recuerdan y razonan sobre conocimiento personal o de equipo.

<CardGroup cols={2}>

<Card title="Aprendizaje de chino xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Motor de aprendizaje de chino con comentarios de pronunciación y flujos de estudio mediante OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Comentarios de pronunciación de xuezh" />
</Card>

<Card title="Bóveda de memoria de WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Ingiere exportaciones completas de WhatsApp, transcribe más de 1k notas de voz, cruza datos con registros de git y genera informes Markdown enlazados.
</Card>

<Card title="Búsqueda semántica de Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Añade búsqueda vectorial a los marcadores de Karakeep usando Qdrant más embeddings de OpenAI u Ollama.
</Card>

<Card title="Memoria de Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Gestor de memoria separado que convierte archivos de sesión en recuerdos, luego en creencias y después en un modelo de sí mismo en evolución.
</Card>

</CardGroup>

## Voz y teléfono

Puntos de entrada centrados en voz, puentes telefónicos y flujos de trabajo con mucha transcripción.

<CardGroup cols={2}>

<Card title="Puente telefónico Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Puente HTTP de asistente de voz Vapi a OpenClaw. Llamadas telefónicas casi en tiempo real con tu agente.
</Card>

<Card title="Transcripción de OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcripción de audio multilingüe mediante OpenRouter (Gemini y más). Disponible en ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill de transcripción de OpenRouter en ClawHub" />
</Card>

</CardGroup>

## Infraestructura y despliegue

Empaquetado, despliegue e integraciones que hacen que OpenClaw sea más fácil de ejecutar y ampliar.

<CardGroup cols={2}>

<Card title="Complemento de Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
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

<Card title="Mercado StarSwap" icon="star" href="https://star-swap.com/">
  **Comunidad** • `marketplace` `astronomy` `webapp`

Mercado completo de equipos de astronomía. Creado con el ecosistema OpenClaw y alrededor de él.
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
  <Step title="Destácate">
    Añadiremos proyectos destacados a esta página.
  </Step>
</Steps>

## Relacionado

- [Primeros pasos](/es/start/getting-started)
- [OpenClaw](/es/start/openclaw)
