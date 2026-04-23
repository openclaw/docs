---
description: Real-world OpenClaw projects from the community
read_when:
    - Busca ejemplos reales de uso de OpenClaw
    - Actualizar destacados de proyectos de la comunidad
summary: Proyectos e integraciones creados por la comunidad e impulsados por OpenClaw
title: Vitrina
x-i18n:
    generated_at: "2026-04-23T14:08:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bf4bd2548709a01ad18331537f804b32c3213139c2234915aa17f7a2638f19f
    source_path: start/showcase.md
    workflow: 15
---

# Vitrina

<div className="showcase-hero">
  <p className="showcase-kicker">Creado en chats, terminales, navegadores y salas de estar</p>
  <p className="showcase-lead">
    Los proyectos de OpenClaw no son demos de juguete. La gente está lanzando bucles de revisión de PR, apps móviles, automatización del hogar,
    sistemas de voz, herramientas de desarrollo y flujos de trabajo intensivos en memoria desde los canales que ya usan.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Ver demos</a>
    <a href="#fresh-from-discord">Explorar proyectos</a>
    <a href="https://discord.gg/clawd">Comparte el tuyo</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Desarrollos nativos de chat</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, chat web y flujos de trabajo centrados en terminal.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Automatización real</strong>
      <span>Reservas, compras, soporte, informes y control del navegador sin esperar a una API.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Mundo local + físico</strong>
      <span>Impresoras, aspiradoras, cámaras, datos de salud, sistemas del hogar y bases de conocimiento personales.</span>
    </div>
  </div>
</div>

<Info>
**¿Quiere aparecer aquí?** Comparta su proyecto en [#self-promotion en Discord](https://discord.gg/clawd) o [etiquete a @openclaw en X](https://x.com/openclaw).
</Info>

<div className="showcase-jump-links">
  <a href="#videos">Videos</a>
  <a href="#fresh-from-discord">Novedades de Discord</a>
  <a href="#automation-workflows">Automatización</a>
  <a href="#knowledge-memory">Memoria</a>
  <a href="#voice-phone">Voz y teléfono</a>
  <a href="#infrastructure-deployment">Infraestructura</a>
  <a href="#home-hardware">Hogar y hardware</a>
  <a href="#community-projects">Comunidad</a>
  <a href="#submit-your-project">Enviar un proyecto</a>
</div>

## Videos

<p className="showcase-section-intro">
  Empiece aquí si quiere la ruta más corta entre “¿qué es esto?” y “vale, ya lo entiendo”.
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Recorrido completo de configuración</h3>
    <p>VelvetShark, 28 minutos. Instale, haga el onboarding y llegue a un primer asistente funcional de punta a punta.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">Ver en YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw showcase video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Compilado de la comunidad</h3>
    <p>Un repaso más rápido por proyectos reales, superficies y flujos de trabajo construidos alrededor de OpenClaw.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">Ver en YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw community showcase"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Proyectos en uso real</h3>
    <p>Ejemplos de la comunidad, desde bucles de coding nativos de chat hasta hardware y automatización personal.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">Ver en YouTube</a>
  </div>
</div>

## Novedades de Discord

<p className="showcase-section-intro">
  Destacados recientes en coding, herramientas de desarrollo, móvil y creación de productos nativa de chat.
</p>

<CardGroup cols={2}>

<Card title="Revisión de PR → Feedback en Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termina el cambio → abre un PR → OpenClaw revisa el diff y responde en Telegram con “sugerencias menores” más un veredicto claro de merge (incluidas las correcciones críticas que deben aplicarse primero).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Feedback de revisión de PR de OpenClaw entregado en Telegram" />
</Card>

<Card title="Skill de bodega en minutos" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Le pidió a “Robby” (@openclaw) un Skill local para una bodega. Solicita un CSV de ejemplo exportado + dónde almacenarlo, y luego crea/prueba el Skill rápidamente (962 botellas en el ejemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw creando un Skill local de bodega a partir de CSV" />
</Card>

<Card title="Piloto automático de compras en Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plan semanal de comidas → habituales → reservar franja de entrega → confirmar pedido. Sin APIs, solo control del navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatización de compras en Tesco vía chat" />
</Card>

<Card title="SNAG Screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Tecla rápida sobre una región de pantalla → Gemini vision → Markdown instantáneo en el portapapeles.

  <img src="/assets/showcase/snag.png" alt="Herramienta SNAG de captura de pantalla a Markdown" />
</Card>

<Card title="UI de Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App de escritorio para gestionar Skills/comandos entre Agents, Claude, Codex y OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="App UI de Agents" />
</Card>

<Card title="Notas de voz de Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Comunidad** • `voice` `tts` `telegram`

Envuelve el TTS de papla.media y envía los resultados como notas de voz de Telegram (sin autoplay molesto).

  <img src="/assets/showcase/papla-tts.jpg" alt="Salida de nota de voz de Telegram desde TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Ayudante instalable con Homebrew para listar/inspeccionar/observar sesiones locales de OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor en ClawHub" />
</Card>

<Card title="Control de impresora 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controle y diagnostique impresoras BambuLab: estado, trabajos, cámara, AMS, calibración y más.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI en ClawHub" />
</Card>

<Card title="Transporte de Viena (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Salidas en tiempo real, interrupciones, estado de ascensores y rutas para el transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien en ClawHub" />
</Card>

<Card title="Comidas escolares de ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Automatización de reserva de comidas escolares en Reino Unido mediante ParentPay. Usa coordenadas del ratón para hacer clic con fiabilidad en celdas de tablas.
</Card>

<Card title="Carga a R2 (Envíame mis archivos)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cargue en Cloudflare R2/S3 y genere enlaces de descarga seguros con firma previa. Perfecto para instancias remotas de OpenClaw.
</Card>

<Card title="App de iOS vía Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Desarrolló una app completa de iOS con mapas y grabación de voz, desplegada en TestFlight completamente mediante chat de Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="App de iOS en TestFlight" />
</Card>

<Card title="Asistente de salud con Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Asistente personal de salud con IA que integra datos del anillo Oura con calendario, citas y horario del gimnasio.

  <img src="/assets/showcase/oura-health.png" alt="Asistente de salud con Oura ring" />
</Card>
<Card title="El Dream Team de Kev (14+ agentes)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

Más de 14 agentes bajo un solo gateway con un orquestador Opus 4.5 delegando a workers de Codex. [Descripción técnica](https://github.com/adam91holt/orchestrated-ai-articles) completa sobre la plantilla Dream Team, selección de modelos, sandboxing, Webhooks, Heartbeat y flujos de delegación. [Clawdspace](https://github.com/adam91holt/clawdspace) para sandboxing de agentes. [Entrada del blog](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI para Linear que se integra con flujos de trabajo agénticos (Claude Code, OpenClaw). Gestione incidencias, proyectos y flujos de trabajo desde la terminal. ¡Primer PR externo fusionado!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Lea, envíe y archive mensajes mediante Beeper Desktop. Usa la API MCP local de Beeper para que los agentes puedan gestionar todos sus chats (iMessage, WhatsApp, etc.) en un solo lugar.
</Card>

</CardGroup>

<a id="automation-workflows"></a>

## Automatización y flujos de trabajo

<p className="showcase-section-intro">
  Programación, control del navegador, bucles de soporte y la parte del producto de “simplemente hazme la tarea”.
</p>

<CardGroup cols={2}>

<Card title="Control del purificador de aire Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code descubrió y confirmó los controles del purificador, y luego OpenClaw toma el relevo para gestionar la calidad del aire de la habitación.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Control del purificador de aire Winix mediante OpenClaw" />
</Card>

<Card title="Bonitas fotos del cielo con cámara" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Activado por una cámara del tejado: pedirle a OpenClaw que saque una foto del cielo cuando se vea bonito; diseñó un Skill y tomó la foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Instantánea del cielo desde la cámara del tejado capturada por OpenClaw" />
</Card>

<Card title="Escena visual de resumen matutino" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Un prompt programado genera cada mañana una única imagen de “escena” (tiempo, tareas, fecha, publicación/cita favorita) mediante una persona de OpenClaw.
</Card>

<Card title="Reserva de pista de pádel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Comprobador de disponibilidad + CLI de reserva para Playtomic. No vuelva a perder una pista libre.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="Captura de pantalla de padel-cli" />
</Card>

<Card title="Recepción de contabilidad" icon="file-invoice-dollar">
  **Comunidad** • `automation` `email` `pdf`
  
  Recoge PDFs del correo electrónico y prepara documentos para el asesor fiscal. Contabilidad mensual en piloto automático.
</Card>

<Card title="Modo desarrollador desde el sofá" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Reconstruyó todo su sitio personal vía Telegram mientras veía Netflix: Notion → Astro, 18 publicaciones migradas, DNS a Cloudflare. Nunca abrió un portátil.
</Card>

<Card title="Agente de búsqueda de empleo" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Busca ofertas de empleo, las compara con palabras clave del CV y devuelve oportunidades relevantes con enlaces. Creado en 30 minutos usando la API de JSearch.
</Card>

<Card title="Generador de Skill para Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw se conectó a Jira y luego generó un nuevo Skill sobre la marcha (antes de que existiera en ClawHub).
</Card>

<Card title="Skill de Todoist vía Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Automatizó tareas de Todoist y consiguió que OpenClaw generara el Skill directamente en el chat de Telegram.
</Card>

<Card title="Análisis de TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Inicia sesión en TradingView mediante automatización del navegador, toma capturas de gráficos y realiza análisis técnico bajo demanda. No necesita API, solo control del navegador.
</Card>

<Card title="Auto-soporte en Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Supervisa el canal de Slack de la empresa, responde de forma útil y reenvía notificaciones a Telegram. Corrigió de forma autónoma un error de producción en una app desplegada sin que nadie se lo pidiera.
</Card>

</CardGroup>

<a id="knowledge-memory"></a>

## Conocimiento y memoria

<p className="showcase-section-intro">
  Sistemas que indexan, buscan, recuerdan y razonan sobre conocimiento personal o de equipo.
</p>

<CardGroup cols={2}>

<Card title="xuezh aprendizaje de chino" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Motor de aprendizaje de chino con retroalimentación de pronunciación y flujos de estudio mediante OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Retroalimentación de pronunciación de xuezh" />
</Card>

<Card title="Bóveda de memoria de WhatsApp" icon="vault">
  **Comunidad** • `memory` `transcription` `indexing`
  
  Ingiere exportaciones completas de WhatsApp, transcribe más de 1k notas de voz, las contrasta con registros git y genera informes Markdown enlazados.
</Card>

<Card title="Búsqueda semántica de Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Añade búsqueda vectorial a los marcadores de Karakeep usando embeddings de Qdrant + OpenAI/Ollama.
</Card>

<Card title="Memoria tipo Del revés 2" icon="brain">
  **Comunidad** • `memory` `beliefs` `self-model`
  
  Gestor de memoria independiente que convierte archivos de sesión en recuerdos → creencias → un modelo propio en evolución.
</Card>

</CardGroup>

<a id="voice-phone"></a>

## Voz y teléfono

<p className="showcase-section-intro">
  Puntos de entrada centrados en voz, puentes telefónicos y flujos de trabajo intensivos en transcripción.
</p>

<CardGroup cols={2}>

<Card title="Puente telefónico Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Puente HTTP de asistente de voz Vapi ↔ OpenClaw. Llamadas telefónicas casi en tiempo real con su agente.
</Card>

<Card title="Transcripción con OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcripción de audio multilingüe mediante OpenRouter (Gemini, etc.). Disponible en ClawHub.
</Card>

</CardGroup>

<a id="infrastructure-deployment"></a>

## Infraestructura y despliegue

<p className="showcase-section-intro">
  Empaquetado, despliegue e integraciones que hacen que OpenClaw sea más fácil de ejecutar y ampliar.
</p>

<CardGroup cols={2}>

<Card title="Complemento de Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway de OpenClaw ejecutándose en Home Assistant OS con compatibilidad con túnel SSH y estado persistente.
</Card>

<Card title="Skill de Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Controle y automatice dispositivos de Home Assistant mediante lenguaje natural.
</Card>

<Card title="Empaquetado con Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Configuración de OpenClaw con Nix y baterías incluidas para despliegues reproducibles.
</Card>

<Card title="Calendario CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill de calendario que usa khal/vdirsyncer. Integración de calendario autoalojada.
</Card>

</CardGroup>

<a id="home-hardware"></a>

## Hogar y hardware

<p className="showcase-section-intro">
  El lado físico de OpenClaw: hogares, sensores, cámaras, aspiradoras y otros dispositivos.
</p>

<CardGroup cols={2}>

<Card title="Automatización GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Automatización del hogar nativa de Nix con OpenClaw como interfaz, además de preciosos paneles de Grafana.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="Panel de Grafana de GoHome" />
</Card>

<Card title="Aspiradora Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Controle su aspiradora robot Roborock mediante conversación natural.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Estado de Roborock" />
</Card>

</CardGroup>

## Proyectos de la comunidad

<p className="showcase-section-intro">
  Cosas que crecieron más allá de un único flujo de trabajo hasta convertirse en productos o ecosistemas más amplios.
</p>

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Comunidad** • `marketplace` `astronomy` `webapp`
  
  Marketplace completo de equipamiento astronómico. Creado con/alrededor del ecosistema de OpenClaw.
</Card>

</CardGroup>

---

## Envíe su proyecto

<p className="showcase-section-intro">
  Si está construyendo algo interesante con OpenClaw, envíelo. Las buenas capturas de pantalla y los resultados concretos ayudan.
</p>

¿Tiene algo que compartir? ¡Nos encantaría destacarlo!

<Steps>
  <Step title="Compártalo">
    Publique en [#self-promotion en Discord](https://discord.gg/clawd) o [tuitee a @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="Incluya detalles">
    Díganos qué hace, enlace al repositorio/demo, comparta una captura de pantalla si tiene una
  </Step>
  <Step title="Aparezca destacado">
    Añadiremos los proyectos destacados a esta página
  </Step>
</Steps>
