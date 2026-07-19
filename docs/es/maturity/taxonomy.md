---
summary: Referencia detallada de las áreas del producto y las comprobaciones que sustentan el cuadro de mando de madurez de OpenClaw.
title: Taxonomía de madurez
x-i18n:
    generated_at: "2026-07-19T02:29:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbed5794f43b230d8c8adb211734d93eb81f02623fe57df078e1dfd5a6d2586c
    source_path: maturity/taxonomy.md
    workflow: 16
---

# Taxonomía de madurez

<div className="maturity-hero maturity-hero-compact">
  <p className="maturity-kicker">el modelo en el que se basa el cuadro de puntuación</p>
  <p className="maturity-hero-title">Superficies &gt; categorías &gt; capacidades &gt; evidencia.</p>
  <p>50 superficies agrupadas en 4 familias, con cada categoría vinculada a la documentación canónica y a los identificadores de cobertura de control de calidad.</p>
  <p className="maturity-jump-links"><a href="#product-areas">Explorar áreas de producto</a> / <a href="#taxonomy-details">Abrir taxonomía detallada</a> / <a href="/es/maturity/scorecard">Ver puntuaciones</a></p>
</div>

## Cómo leer esta página

Una superficie es un área de producto, como el entorno de ejecución del Gateway, Discord o la aplicación para macOS. Cada superficie contiene categorías, y cada categoría contiene las comprobaciones a nivel de capacidad que cubren los escenarios de control de calidad. Utilice el cuadro de puntuación para evaluar el nivel de una versión; utilice esta página para examinar el modelo subyacente.

## Niveles de madurez

<div className="maturity-level-list">
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planificado</span></span></span><span>Se conoce la dirección, pero no existe ninguna ruta de usuario compatible.</span><span className="maturity-level-promotion">Promoción: existen una incidencia de diseño, un responsable y una superficie objetivo.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span></span><span>Implementado con salvedades, indicadores, compilaciones desde el código fuente o flujos exclusivos para responsables de mantenimiento.</span><span className="maturity-level-promotion">Promoción: un responsable de mantenimiento puede ejecutar el escenario desde la rama principal actual.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span></span><span>Los usuarios reales pueden probarlo, pero se esperan cambios incompatibles y una experiencia de usuario incompleta.</span><span className="maturity-level-promotion">Promoción: configuración documentada, pruebas básicas, salvedades conocidas y al menos una prueba en un entorno real.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span></span><span>Existe una ruta pública y el flujo de trabajo principal es utilizable con salvedades acotadas.</span><span className="maturity-level-promotion">Promoción: documentación de instalación y actualización, pruebas de regresión, guía operativa de soporte y prueba satisfactoria del escenario en todo el entorno previsto.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span></span><span>Ruta recomendada para usuarios habituales. Los fallos se tratan como regresiones.</span><span className="maturity-level-promotion">Promoción: control de publicación, ruta de diagnóstico y solución de problemas, documentación exhaustiva y pruebas repetidas en entornos reales.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-clawesome"><span className="maturity-level-code">M5</span><span>Clawesome</span></span></span><span>Pulido, agradable, bien instrumentado y competitivo con el mejor flujo de trabajo comparable.</span><span className="maturity-level-promotion">Promoción: nivel estable más aprobación del cuadro de puntuación de usuarios con usuarios representativos.</span></div>
</div>

## Áreas de producto

<a id="product-areas" />

<Tabs>
  <Tab title="Núcleo">

    <a className="maturity-surface-link" href="#cli">
      <span className="maturity-surface-title">CLI</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>7 áreas - 90% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#gateway-runtime">
      <span className="maturity-surface-title">Entorno de ejecución del Gateway</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>13 áreas - 89% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#agent-runtime">
      <span className="maturity-surface-title">Entorno de ejecución del agente</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#session-memory-and-context-engine">
      <span className="maturity-surface-title">Motor de sesión, memoria y contexto</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#channel-framework">
      <span className="maturity-surface-title">Marco de canales</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#observability">
      <span className="maturity-surface-title">Observabilidad</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#gateway-web-app">
      <span className="maturity-surface-title">Aplicación web del Gateway</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#plugins">
      <span className="maturity-surface-title">Plugins</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#security-auth-pairing-and-secrets">
      <span className="maturity-surface-title">Seguridad, autenticación, emparejamiento y secretos</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#automation-cron-hooks-tasks-polling">
      <span className="maturity-surface-title">Automatización: cron, hooks, tareas y sondeo</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#media-understanding-and-media-generation">
      <span className="maturity-surface-title">Comprensión y generación de contenido multimedia</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas - 68% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#voice-and-realtime-talk">
      <span className="maturity-surface-title">Voz y conversación en tiempo real</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas - 68% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#tui">
      <span className="maturity-surface-title">TUI</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas - 66% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#clawhub">
      <span className="maturity-surface-title">ClawHub</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas - 62% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#openclaw-app-sdk">
      <span className="maturity-surface-title">SDK de aplicaciones de OpenClaw</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas - 53% completado</span></span>
    </a>

  </Tab>
  <Tab title="Plataforma">

    <a className="maturity-surface-link" href="#linux-gateway-host">
      <span className="maturity-surface-title">Host del Gateway en Linux</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>5 áreas - 89% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#macos-gateway-host">
      <span className="maturity-surface-title">Host del Gateway en macOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>7 áreas - 88% completado</span></span>
    </a>
    <a className="maturity-surface-link" href="#android-app">
      <span className="maturity-surface-title">Aplicación para Android</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>7 áreas - 80% completado</span></span>
    </a>
    <a className="maturity-surface-link" href="#ios-app">
      <span className="maturity-surface-title">Aplicación para iOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>8 áreas - 80% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#docker-and-podman-hosting">
      <span className="maturity-surface-title">Alojamiento con Docker y Podman</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#windows-via-wsl2">
      <span className="maturity-surface-title">Windows mediante WSL2</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#raspberry-pi-and-small-linux-devices">
      <span className="maturity-surface-title">Raspberry Pi y dispositivos Linux pequeños</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#macos-companion-app">
      <span className="maturity-surface-title">Aplicación complementaria para macOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 áreas - 78% completado</span></span>
    </a>


    <a className="maturity-surface-link" href="#native-windows">
      <span className="maturity-surface-title">Windows nativo</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas - 66% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#kubernetes-hosting">
      <span className="maturity-surface-title">Alojamiento en Kubernetes</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas - 61% completado</span></span>
    </a>


    <a className="maturity-surface-link" href="#nix-install-path">
      <span className="maturity-surface-title">Ruta de instalación de Nix</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas - 44% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#watchos-companion-surfaces">
      <span className="maturity-surface-title">Superficies complementarias de watchOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas - 44% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#linux-companion-app">
      <span className="maturity-surface-title">Aplicación complementaria para Linux</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planificado</span></span><span>5 áreas - 21% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#native-windows-companion-app">
      <span className="maturity-surface-title">Aplicación complementaria nativa para Windows</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planificado</span></span><span>5 áreas - 21% completado</span></span>
    </a>

  </Tab>
  <Tab title="Canal">

    <a className="maturity-surface-link" href="#discord">
      <span className="maturity-surface-title">Discord</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>6 áreas - 87% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#telegram">
      <span className="maturity-surface-title">Telegram</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas - 78% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#slack">
      <span className="maturity-surface-title">Slack</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas - 78% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#imessage-and-bluebubbles">
      <span className="maturity-surface-title">iMessage y BlueBubbles</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas - 78% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#whatsapp">
      <span className="maturity-surface-title">WhatsApp</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas - 78% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#matrix">
      <span className="maturity-surface-title">Matrix</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas - 67% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#google-chat">
      <span className="maturity-surface-title">Google Chat</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas - 66% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#microsoft-teams">
      <span className="maturity-surface-title">Microsoft Teams</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas - 66% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#signal">
      <span className="maturity-surface-title">Signal</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas - 66% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels">
      <span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canales regionales</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas - 58% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat">
      <span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas - 54% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#voice-call-channel">
      <span className="maturity-surface-title">Canal de llamadas de voz</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas - 44% completado</span></span>
    </a>

  </Tab>
  <Tab title="Proveedor y herramienta">

    <a className="maturity-surface-link" href="#browser-automation-exec-and-sandbox-tools">
      <span className="maturity-surface-title">Herramientas de automatización del navegador, ejecución y entorno aislado</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#openai-and-codex-provider-path">
      <span className="maturity-surface-title">Ruta de proveedor de OpenAI y Codex</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#web-search-tools">
      <span className="maturity-surface-title">Herramientas de búsqueda web</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas - 79% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#anthropic-provider-path">
      <span className="maturity-surface-title">Ruta del proveedor Anthropic</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas - 78% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#google-provider-path">
      <span className="maturity-surface-title">Ruta del proveedor Google</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas - 78% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#openrouter-provider-path">
      <span className="maturity-surface-title">Ruta del proveedor OpenRouter</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas - 78% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#image-video-and-music-generation-tools">
      <span className="maturity-surface-title">Herramientas de generación de imágenes, vídeo y música</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas - 68% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#local-model-providers-ollama-vllm-sglang-lm-studio">
      <span className="maturity-surface-title">Proveedores de modelos locales: Ollama, vLLM, SGLang, LM Studio</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas - 68% completado</span></span>
    </a>

    <a className="maturity-surface-link" href="#long-tail-hosted-providers">
      <span className="maturity-surface-title">Proveedores alojados de larga cola</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 áreas - 68% completado</span></span>
    </a>

  </Tab>
</Tabs>

## Detalles

<a id="taxonomy-details" />

### Núcleo

<AccordionGroup>
  <Accordion title="CLI - M4 Estable - 7 áreas">
    <a id="cli" />

    Las rutas normales de configuración y reparación están documentadas en la documentación de instalación, la CLI y el Gateway. Las rutas específicas de Windows se registran en las filas Windows mediante WSL2 y Windows nativo.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 4%</span><span>Calidad estable - 83%</span><span>Integridad estable - 90%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración de la CLI</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>17%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "17%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/install/index), [Instalador](/es/install/installer), [Node](/es/install/node), [Actualización](/es/install/updating)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración de incorporación y autenticación</span>
          <span>5 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Incorporación](/es/cli/onboard), [Configuración](/es/cli/configure), [Descripción general de la incorporación](/es/start/onboarding-overview)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración de plugins y canales</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Incorporación](/es/cli/onboard), [Plugins](/es/cli/plugins), [Canales](/es/cli/channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gestión del servicio Gateway</span>
          <span>5 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Gateway](/es/cli/gateway), [Actualización](/es/install/updating), [Solución de problemas](/es/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Observabilidad de la CLI</span>
          <span>5 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Estado](/es/cli/status), [Salud](/es/cli/health), [Registros](/es/cli/logs), [Diagnósticos](/es/gateway/diagnostics)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Doctor</span>
          <span>10 capacidades / compatibles con LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Doctor](/es/cli/doctor), [Doctor](/es/gateway/doctor), [Secretos](/es/gateway/secrets), [Solución de problemas](/es/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Actualizaciones y mejoras de versión</span>
          <span>5 capacidades / compatibles con LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Actualización](/es/install/updating), [Actualizar](/es/cli/update), [Solución de problemas](/es/gateway/troubleshooting)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Entorno de ejecución del Gateway - M4 Estable - 13 áreas">
    <a id="gateway-runtime" />

    La arquitectura central, la autenticación, el emparejamiento, la documentación del protocolo, la documentación del daemon y las guías operativas de la CLI son amplias y están actualizadas.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 6%</span><span>Calidad Estable - 81%</span><span>Integridad Estable - 89%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 12</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Aprobaciones y ejecución remota</span>
          <span>6 capacidades / compatibles con LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Protocolo](/es/gateway/protocol), [Índice](/es/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">API HTTP</span>
          <span>4 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/gateway/index), [API HTTP de OpenAI](/es/gateway/openai-http-api), [API HTTP de OpenResponses](/es/gateway/openresponses-http-api), [API HTTP de invocación de herramientas](/es/gateway/tools-invoke-http-api), [Hooks](/es/automation/hooks), [Índice](/es/web/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Superficie web alojada</span>
          <span>4 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/gateway/index), [Arquitectura](/es/concepts/architecture), [Interfaz de control](/es/web/control-ui), [Chat web](/es/web/webchat), [Lienzo](/es/refactor/canvas)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">API RPC y eventos del Gateway</span>
          <span>20 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Protocolo](/es/gateway/protocol), [Índice](/es/gateway/index), [Arquitectura](/es/concepts/architecture)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Autenticación y emparejamiento de dispositivos</span>
          <span>10 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Protocolo](/es/gateway/protocol), [Emparejamiento](/es/gateway/pairing), [Índice](/es/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso y descubrimiento de red</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/gateway/index), [Descubrimiento](/es/gateway/discovery), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Nodos y capacidades remotas</span>
          <span>8 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Protocolo](/es/gateway/protocol), [Arquitectura](/es/concepts/architecture), [Índice](/es/nodes/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Estado, diagnóstico y reparación</span>
          <span>7 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/gateway/index), [Diagnóstico](/es/gateway/diagnostics), [Doctor](/es/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Compatibilidad del protocolo</span>
          <span>7 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Protocolo](/es/gateway/protocol), [Arquitectura](/es/concepts/architecture), [TypeBox](/es/concepts/typebox), [Protocolo de puente](/es/gateway/bridge-protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Roles y permisos</span>
          <span>5 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Protocolo](/es/gateway/protocol), [Índice](/es/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ciclo de vida del Gateway</span>
          <span>7 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/gateway/index), [Arquitectura](/es/concepts/architecture)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles de seguridad</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/gateway/security/index), [Protocolo](/es/gateway/protocol), [Detección](/es/gateway/discovery)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Conexión WebSocket</span>
          <span>8 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Protocolo](/es/gateway/protocol), [Arquitectura](/es/concepts/architecture)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Runtime de agentes - M3 Beta - 9 áreas">
    <a id="agent-runtime" />

    El bucle principal, los modelos, el enrutamiento de proveedores y la transmisión de herramientas son elementos de primera clase, pero el comportamiento de los proveedores cambia semanalmente y requiere pruebas de escenarios en cada versión.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 33%</span><span>Calidad Beta - 78%</span><span>Integridad Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ejecución de turnos del agente</span>
          <span>3 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>29%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "29%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Bucle del agente](/es/concepts/agent-loop), [Agente](/es/cli/agent), [Runtimes de agentes](/es/concepts/agent-runtimes)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Runtimes externos y subagentes</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Runtimes de agentes](/es/concepts/agent-runtimes), [Anthropic](/es/providers/anthropic), [Google](/es/providers/google), [Subagentes](/es/tools/subagents)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ejecución mediante proveedores alojados</span>
          <span>5 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>20%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "20%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/es/providers/openai), [Anthropic](/es/providers/anthropic), [Google](/es/providers/google), [Modelos](/es/concepts/models)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Proveedores locales y autoalojados</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ollama](/es/providers/ollama), [Modelos](/es/concepts/models), [Agente](/es/cli/agent)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Selección de modelos y entornos de ejecución</span>
          <span>4 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Modelos](/es/concepts/models), [Modelos](/es/cli/models), [OpenAI](/es/providers/openai), [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Autenticación de proveedores</span>
          <span>10 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>24%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "24%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Modelos](/es/concepts/models), [Agente](/es/cli/agent), [Modelos](/es/cli/models), [OpenAI](/es/providers/openai), [Anthropic](/es/providers/anthropic), [Google](/es/providers/google), [Subagentes](/es/tools/subagents)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Transmisión y progreso</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>56%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "56%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Transmisión](/es/concepts/streaming), [Bucle del agente](/es/concepts/agent-loop)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Llamadas a herramientas y gestión de respuestas</span>
          <span>3 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>65%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "65%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Bucle del agente](/es/concepts/agent-loop), [Ollama](/es/providers/ollama)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles de ejecución de herramientas</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Entorno aislado frente a política de herramientas frente a modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated), [Bucle del agente](/es/concepts/agent-loop), [Subagentes](/es/tools/subagents)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Motor de sesiones, memoria y contexto - M3 Beta - 9 áreas">
    <a id="session-memory-and-context-engine" />

    Documentación sólida e implementación activa. La madurez depende de la durabilidad de las transcripciones, la calidad de Compaction y la paridad entre clientes.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 30%</span><span>Calidad Beta - 77%</span><span>Integridad Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gestión de sesiones y transcripciones mediante la CLI</span>
          <span>2 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Sesión](/es/concepts/session), [Compaction de la gestión de sesiones](/es/reference/session-management-compaction), [Sesiones](/es/cli/sessions)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gestión de tokens</span>
          <span>3 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>20%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "20%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Compaction](/es/concepts/compaction), [Contexto](/es/concepts/context), [Compaction de la gestión de sesiones](/es/reference/session-management-compaction)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Motor de contexto</span>
          <span>2 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>57%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "57%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Contexto](/es/concepts/context), [Motor de contexto](/es/concepts/context-engine)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Historial entre clientes y paridad de sesiones</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Chat web](/es/web/webchat), [Android](/es/platforms/android), [Enrutamiento de canales](/es/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Diagnóstico, mantenimiento y recuperación</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Diagnóstico](/es/gateway/diagnostics), [Compaction de la gestión de sesiones](/es/reference/session-management-compaction), [Indicadores](/es/diagnostics/flags)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Indicaciones principales y contexto</span>
          <span>2 capacidades / compatibles con LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Contexto](/es/concepts/context), [Higiene de transcripciones](/es/reference/transcript-hygiene), [Discord](/es/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Memoria</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>46%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "46%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Configuración de memoria](/es/reference/memory-config), [Qmd de memoria](/es/concepts/memory-qmd), [Memoria](/es/concepts/memory), [Discord](/es/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento de sesiones</span>
          <span>2 capacidades / compatibles con LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Sesión](/es/concepts/session), [Enrutamiento de canales](/es/channels/channel-routing), [Discord](/es/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Persistencia de transcripciones</span>
          <span>2 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Compaction de la gestión de sesiones](/es/reference/session-management-compaction), [Higiene de transcripciones](/es/reference/transcript-hygiene)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Marco de canales - M3 Beta - 8 áreas">
    <a id="channel-framework" />

    Muchos canales comparten los contratos de entrega y enrutamiento del Gateway, pero su comportamiento varía según las restricciones de la API ascendente y de las políticas de las cuentas.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 13%</span><span>Calidad beta - 76%</span><span>Integridad beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Comandos de acciones y aprobaciones de canales</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Grupos](/es/channels/groups), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [Matrix](/es/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración de canales</span>
          <span>5 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/channels/index), [Emparejamiento](/es/channels/pairing), [Solución de problemas](/es/channels/troubleshooting), [Plugins de canal del SDK](/es/plugins/sdk-channel-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Comportamiento de hilos de grupo y salas ambientales</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>36%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "36%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Grupos](/es/channels/groups), [Mensajes de grupo](/es/channels/group-messages), [Eventos de salas ambientales](/es/channels/ambient-room-events), [Grupos de difusión](/es/channels/broadcast-groups), [Discord](/es/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles de acceso entrante e identidad</span>
          <span>5 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Grupos de acceso](/es/channels/access-groups), [Grupos](/es/channels/groups), [Discord](/es/channels/discord), [LINE](/es/channels/line)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Archivos multimedia adjuntos y datos enriquecidos del canal</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [LINE](/es/channels/line), [Signal](/es/channels/signal), [Google Chat](/es/channels/googlechat), [Matrix](/es/channels/matrix), [Discord](/es/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Pipeline de entrega saliente y respuestas</span>
          <span>4 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Grupos](/es/channels/groups), [Eventos de salas ambientales](/es/channels/ambient-room-events), [Discord](/es/channels/discord), [Matrix](/es/channels/matrix), [Configuración de canales](/es/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>10 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Enrutamiento de canales](/es/channels/channel-routing), [Grupos](/es/channels/groups), [Discord](/es/channels/discord), [Matrix](/es/channels/matrix), [Solución de problemas](/es/channels/troubleshooting), [Referencia de configuración](/es/gateway/configuration-reference)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Estado de salud y controles del operador</span>
          <span>4 capacidades / compatibles con LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Estado](/es/gateway/health), [Referencia de configuración](/es/gateway/configuration-reference), [Solución de problemas](/es/channels/troubleshooting), [Discord](/es/channels/discord)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Observabilidad - M3 Beta - 5 áreas">
    <a id="observability" />

    Existen documentos sobre OTel, Prometheus, registros y diagnósticos. Se necesita una revisión pública de madurez sobre «qué deben comprobar primero los operadores».

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 18%</span><span>Calidad beta - 75%</span><span>Completitud beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 3</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Estado y reparación</span>
          <span>12 capacidades / compatibles con LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>28%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "28%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Estado](/es/gateway/health), [Telegram](/es/channels/telegram), [Doctor](/es/cli/doctor), [Doctor](/es/gateway/doctor), [Subrutas del SDK](/es/plugins/sdk-subpaths), [Estado](/es/cli/health), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Registro</span>
          <span>5 capacidades / compatibles con LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Registro](/es/logging), [Registro](/es/gateway/logging), [Registros](/es/cli/logs)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Recopilación de diagnósticos</span>
          <span>8 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Diagnósticos](/es/gateway/diagnostics), [Estado](/es/gateway/health), [Entorno de pruebas de Codex](/es/plugins/codex-harness), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Exportación de telemetría</span>
          <span>13 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Hooks](/es/plugins/hooks), [Opentelemetry](/es/gateway/opentelemetry), [Registro](/es/logging), [Subrutas del SDK](/es/plugins/sdk-subpaths), [Otel para diagnósticos](/es/plugins/reference/diagnostics-otel), [Prometheus](/es/gateway/prometheus), [Prometheus para diagnósticos](/es/plugins/reference/diagnostics-prometheus)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Diagnósticos de sesión</span>
          <span>4 capacidades / con compatibilidad LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Opentelemetry](/es/gateway/opentelemetry), [Prometheus](/es/gateway/prometheus), [Diagnósticos](/es/gateway/diagnostics), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Aplicación web del Gateway - M3 Beta - 6 áreas">
    <a id="gateway-web-app" />

    La interfaz web está documentada con flujos de emparejamiento, chat, PWA, conversación, notificaciones push y Gateway remoto. Se promoverá después de completar las evaluaciones de compatibilidad entre navegadores y con PWA móviles.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 4%</span><span>Calidad beta - 74%</span><span>Completitud beta - 79%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Conversación en tiempo real en el navegador</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Interfaz de control](/es/web/control-ui), [Protocolo](/es/gateway/protocol), [Conversación](/es/nodes/talk)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso y confianza en el navegador</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Interfaz de control](/es/web/control-ui), [Panel de control](/es/web/dashboard), [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Interfaz de control](/es/web/control-ui), [Configuración](/es/gateway/configuration)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Interfaz de usuario del navegador</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>8%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "8%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Interfaz de control](/es/web/control-ui), [Índice](/es/web/index), [Panel de control](/es/web/dashboard), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Conversaciones de WebChat</span>
          <span>15 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>10%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "10%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Interfaz de control](/es/web/control-ui), [Webchat](/es/web/webchat), [Primeros pasos](/es/start/getting-started), [Enrutamiento de canales](/es/channels/channel-routing), [Operaciones seguras con archivos](/es/gateway/security/secure-file-operations)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Consola del operador</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>8%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "8%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Interfaz de control](/es/web/control-ui), [Estado](/es/gateway/health), [Protocolo](/es/gateway/protocol), [Panel de control](/es/web/dashboard)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Plugins - M3 Beta - 9 áreas">
    <a id="plugins" />

    Existen documentación amplia y pruebas internas sólidas del entorno de ejecución sobre manifiestos, detección, carga, arquitectura de proveedores y herramientas, y límites de aprobación. Mantenga la fila en beta hasta que sean más sólidas las pruebas sobre la API y las subrutas públicas del SDK, así como sobre la distribución externa.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 12%</span><span>Calidad beta - 72%</span><span>Completitud beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 7</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Creación y empaquetado de plugins</span>
          <span>8 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Creación de plugins](/es/plugins/building-plugins), [Descripción general del SDK](/es/plugins/sdk-overview), [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints), [Subrutas del SDK](/es/plugins/sdk-subpaths), [Manifiesto](/es/plugins/manifest), [Referencia](/es/plugins/reference)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugins incluidos</span>
          <span>5 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Inventario de plugins](/es/plugins/plugin-inventory), [Plugins](/es/cli/plugins), [Detalles internos de la arquitectura](/es/plugins/architecture-internals)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin de Canvas</span>
          <span>6 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Canvas](/es/plugins/reference/canvas), [Canvas](/es/refactor/canvas), [Referencia de configuración](/es/gateway/configuration-reference)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Instalación y ejecución de plugins</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>35%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "35%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Arquitectura](/es/plugins/architecture), [Detalles internos de la arquitectura](/es/plugins/architecture-internals), [Plugins](/es/cli/plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugins de canal</span>
          <span>5 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugins de canal del SDK](/es/plugins/sdk-channel-plugins), [Entrada de canal del SDK](/es/plugins/sdk-channel-inbound), [Salida de canal del SDK](/es/plugins/sdk-channel-outbound)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugins de proveedores y herramientas</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>43%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "43%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugins de proveedores del SDK](/es/plugins/sdk-provider-plugins), [Plugins de herramientas](/es/plugins/tool-plugins), [Adición de capacidades](/es/plugins/adding-capabilities)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Aprobaciones de plugins</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests), [Aprobaciones de ejecución](/es/tools/exec-approvals), [Plugins de canal del SDK](/es/plugins/sdk-channel-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Publicación de plugins</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugins](/es/cli/plugins), [Compatibilidad](/es/plugins/compatibility), [Publicación](/es/clawhub/publishing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Pruebas de plugins</span>
          <span>6 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>27%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "27%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Pruebas del SDK](/es/plugins/sdk-testing), [Configuración del SDK](/es/plugins/sdk-setup), [Entorno de pruebas de Codex](/es/plugins/codex-harness)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Seguridad, autenticación, emparejamiento y secretos - M3 Beta - 6 áreas">
    <a id="security-auth-pairing-and-secrets" />

    Existen buena documentación y superficies de refuerzo. Promuévase después de que las ejecuciones periódicas de escenarios de actualización y seguridad demuestren que no hay regresiones en la configuración.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 16%</span><span>Calidad Beta - 72%</span><span>Integridad Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Política de aprobación y medidas de protección de herramientas</span>
          <span>2 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Aprobaciones de ejecución](/es/tools/exec-approvals), [Aprobaciones](/es/cli/approvals), [Solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests), [Comprobaciones de auditoría](/es/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Autenticación del Gateway y acceso remoto</span>
          <span>9 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/gateway/security/index), [Guía operativa de exposición](/es/gateway/security/exposure-runbook), [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth), [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote), [Referencia de configuración](/es/gateway/configuration-reference), [Gateway](/es/cli/gateway), [Diagnóstico](/es/cli/doctor), [Interfaz de control](/es/web/control-ui), [Control del navegador](/es/tools/browser-control), [Comprobaciones de auditoría](/es/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Control de acceso a canales</span>
          <span>3 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Emparejamiento](/es/channels/pairing), [Telegram](/es/channels/telegram), [Grupos de acceso](/es/channels/access-groups), [Comprobaciones de auditoría](/es/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Emparejamiento de dispositivos y Node</span>
          <span>11 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Protocolo](/es/gateway/protocol), [Dispositivos](/es/cli/devices), [Emparejamiento](/es/channels/pairing), [Emparejamiento](/es/gateway/pairing), [Ámbitos del operador](/es/gateway/operator-scopes), [Interfaz de control](/es/web/control-ui), [Chat web](/es/web/webchat), [Aprobaciones](/es/cli/approvals)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Confianza en los plugins</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Manifiesto](/es/plugins/manifest), [Solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests), [Administración de plugins](/es/plugins/manage-plugins), [Comprobaciones de auditoría](/es/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Higiene de credenciales y secretos</span>
          <span>5 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>46%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "46%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Autenticación](/es/gateway/authentication), [Modelos](/es/cli/models), [OpenAI](/es/providers/openai), [OAuth](/es/concepts/oauth), [Secretos](/es/gateway/secrets), [Secretos](/es/cli/secrets), [Superficie de credenciales Secretref](/es/reference/secretref-credential-surface), [Comprobaciones de auditoría](/es/gateway/security/audit-checks)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Automatización: Cron, hooks, tareas y sondeo - M3 Beta - 6 áreas">
    <a id="automation-cron-hooks-tasks-polling" />

    Está documentado y se puede utilizar, pero las pruebas de escenarios deben abarcar la entrega desatendida, los reintentos y la visibilidad de los fallos.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 2%</span><span>Calidad Beta - 72%</span><span>Integridad Beta - 79%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Trabajos de Cron</span>
          <span>15 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Trabajos de Cron](/es/automation/cron-jobs), [Cron](/es/cli/cron), [Protocolo](/es/gateway/protocol), [Tareas](/es/automation/tasks), [Discord](/es/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entrada de eventos</span>
          <span>15 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/es/channels/telegram), [Zalo](/es/channels/zalo), [Solución de problemas](/es/channels/troubleshooting), [iMessage desde BlueBubbles](/es/channels/imessage-from-bluebubbles), [Integración de Gmail Pub/Sub](/es/automation/cron-jobs#gmail-pubsub-integration), [Gmail Pub/Sub](/es/automation/cron-jobs), [Webhooks](/es/cli/webhooks), [Webhooks](/es/automation/cron-jobs#webhooks), [Webhook](/es/automation/cron-jobs)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Hooks de automatización</span>
          <span>11 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Hooks](/es/automation/hooks), [Hooks](/es/cli/hooks), [Hooks](/es/plugins/hooks), [Solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests), [Subrutas del SDK](/es/plugins/sdk-subpaths)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tareas y flujos en segundo plano</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tareas](/es/automation/tasks), [Índice](/es/automation/index), [Tareas](/es/cli/tasks), [TaskFlow](/es/automation/taskflow), [Entorno de ejecución del SDK](/es/plugins/sdk-runtime)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Heartbeat</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/automation/index), [Heartbeat](/es/gateway/heartbeat), [Compromisos](/es/concepts/commitments)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles de sondeo</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Sondeo](/es/cli/message), [Mensaje](/es/cli/message), [Telegram](/es/channels/telegram), [Microsoft Teams](/es/channels/msteams), [Proceso en segundo plano](/es/gateway/background-process)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Comprensión y generación de contenido multimedia - M2 Alfa - 6 áreas">
    <a id="media-understanding-and-media-generation" />

    Existe una amplia superficie de capacidades, pero las diferencias entre proveedores, los límites de archivos y la paridad entre el Node y la aplicación impiden que sea estable por ahora.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 2%</span><span>Calidad Alfa - 64%</span><span>Integridad Alfa - 68%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Recepción y acceso a medios</span>
          <span>8 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Descripción general de medios](/es/tools/media-overview), [Comprensión de medios](/es/nodes/media-understanding), [Operaciones seguras con archivos](/es/gateway/security/secure-file-operations), [PDF](/es/tools/pdf), [Generación de imágenes](/es/tools/image-generation), [QR](/es/cli/qr), [LINE](/es/channels/line), [WhatsApp](/es/channels/whatsapp)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gestión de medios en canales</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Imágenes](/es/nodes/images), [Descripción general de medios](/es/tools/media-overview), [Discord](/es/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración de medios</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Descripción general de medios](/es/tools/media-overview), [Generación de imágenes](/es/tools/image-generation), [Manifiesto](/es/plugins/manifest), [Arnés de Codex](/es/plugins/codex-harness)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entrega de texto a voz</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Texto a voz](/es/tools/tts), [Descripción general de medios](/es/tools/media-overview), [Discord](/es/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Comprensión de medios</span>
          <span>12 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Audio](/es/nodes/audio), [Comprensión de medios](/es/nodes/media-understanding), [Descripción general de medios](/es/tools/media-overview), [WhatsApp](/es/channels/whatsapp), [Imágenes](/es/nodes/images), [Inferencia](/es/cli/infer), [PDF](/es/tools/pdf)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Generación de medios</span>
          <span>17 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>5%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "5%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Generación de imágenes](/es/tools/image-generation), [Descripción general de medios](/es/tools/media-overview), [Skills](/es/tools/skills), [Generación de música](/es/tools/music-generation), [Generación de vídeo](/es/tools/video-generation)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Voz y conversación en tiempo real - M2 Alfa - 6 áreas">
    <a id="voice-and-realtime-talk" />

    Existen múltiples implementaciones en la interfaz de control, las aplicaciones y los proveedores. Se necesitan tablas de puntuación de latencia, modos de fallo y configuración antes de la beta.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 61%</span><span>Completitud alfa - 68%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Proveedores de conversación</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/es/providers/openai), [Google](/es/providers/google), [Plugins de proveedores del SDK](/es/plugins/sdk-provider-plugins), [Conversación](/es/nodes/talk), [Interfaz de control](/es/web/control-ui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Sesiones de conversación en tiempo real</span>
          <span>11 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Conversación](/es/nodes/talk), [Interfaz de control](/es/web/control-ui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Voz y transcripción</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Conversación](/es/nodes/talk), [OpenAI](/es/providers/openai), [Google](/es/providers/google)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Conversación en la aplicación nativa</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Conversación](/es/nodes/talk), [Activación por voz](/es/platforms/mac/voicewake)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Activación por voz y enrutamiento</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Activación por voz](/es/nodes/voicewake), [Activación por voz](/es/platforms/mac/voicewake), [Superposición de voz](/es/platforms/mac/voice-overlay)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Observabilidad de la conversación</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Interfaz de control](/es/web/control-ui), [Superposición de voz](/es/platforms/mac/voice-overlay), [Conversación](/es/nodes/talk)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="TUI - M2 Alfa - 5 áreas">
    <a id="tui" />

    Presente en la documentación y el código fuente, pero menos visible como flujo de trabajo principal del usuario. Necesita una definición explícita de los escenarios.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 59%</span><span>Integridad alfa - 66%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Modos de ejecución</span>
          <span>14 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/es/cli/tui), [TUI](/es/web/tui), [Índice](/es/cli/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entrada y comandos</span>
          <span>8 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/es/web/tui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gestión de sesiones</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/es/web/tui), [Sesiones](/es/cli/sessions)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ejecución local del shell</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/es/web/tui), [TUI](/es/cli/tui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Seguridad del renderizado y la salida</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/es/web/tui), [QR](/es/cli/qr), [Registros](/es/cli/logs), [Autocompletado](/es/cli/completion)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ClawHub - M2 Alfa - 4 áreas">
    <a id="clawhub" />

    Existen documentación pública y un concepto de ecosistema. Se necesitan cuadros de mando de instalación, confianza, actualización, reversión y compatibilidad.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 58%</span><span>Integridad alfa - 62%</span><span><span className="maturity-lts maturity-lts-none">Ninguna</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Publicación</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Publicación](/es/clawhub/publishing), [Creación de Skills](/es/tools/creating-skills), [Comunidad](/es/plugins/community)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Descubrimiento del catálogo</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin](/es/tools/plugin), [Plugins](/es/cli/plugins), [Skills](/es/cli/skills), [Skills](/es/tools/skills), [Comunidad](/es/plugins/community)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Compatibilidad y confianza</span>
          <span>12 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>56%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "56%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin](/es/tools/plugin), [Plugins](/es/cli/plugins), [Compatibilidad](/es/plugins/compatibility), [Inventario de plugins](/es/plugins/plugin-inventory), [Publicación](/es/clawhub/publishing), [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ciclo de vida y estado de los plugins</span>
          <span>26 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin](/es/tools/plugin), [Plugins](/es/cli/plugins), [Skills](/es/cli/skills), [Skills](/es/tools/skills), [Protocolo](/es/gateway/protocol), [Paquetes](/es/plugins/bundles), [Resolución de dependencias](/es/plugins/dependency-resolution)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="SDK de aplicaciones de OpenClaw - M2 Alfa - 6 áreas">
    <a id="openclaw-app-sdk" />

    El SDK de aplicaciones de OpenClaw es un contrato diferenciado para aplicaciones externas, independiente del entorno de ejecución del Gateway y del SDK de plugins. La puntuación actual muestra una ruta `@openclaw/sdk` real con carencias en torno al empaquetado público, el descubrimiento automático, las aprobaciones, los auxiliares y la compatibilidad.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 3%</span><span>Calidad alfa - 54%</span><span>Integridad alfa - 53%</span><span><span className="maturity-lts maturity-lts-none">Ninguna</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">API de cliente</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>51%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "51%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK de OpenClaw](/es/gateway/external-apps), [Diseño de la API del SDK de OpenClaw](/es/gateway/external-apps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso al Gateway</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK de OpenClaw](/es/gateway/external-apps), [Diseño de la API del SDK de OpenClaw](/es/gateway/external-apps), [Protocolo](/es/gateway/protocol), [Índice](/es/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Conversaciones del agente</span>
          <span>6 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK de OpenClaw](/es/gateway/external-apps), [Diseño de la API del SDK de OpenClaw](/es/gateway/external-apps), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Eventos y aprobaciones</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK de OpenClaw](/es/gateway/external-apps), [Diseño de la API del SDK de OpenClaw](/es/gateway/external-apps), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Funciones auxiliares de recursos</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>17%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "17%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK de OpenClaw](/es/gateway/external-apps), [Diseño de la API del SDK de OpenClaw](/es/gateway/external-apps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Compatibilidad</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Diseño de la API del SDK de OpenClaw](/es/gateway/external-apps), [Typebox](/es/concepts/typebox), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### Plataforma

<AccordionGroup>
  <Accordion title="Host del Gateway en Linux - M4 estable - 5 áreas">
    <a id="linux-gateway-host" />

    Se recomienda el entorno de ejecución Node, se documenta el servicio de usuario de systemd y la orientación sobre VPS/contenedores es amplia.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad beta - 75%</span><span>Integridad estable - 89%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 4</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y actualizaciones del host</span>
          <span>4 capacidades / con compatibilidad LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/install/index), [Actualización](/es/install/updating), [Linux](/es/platforms/linux), [Índice](/es/platforms/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entorno de ejecución y control del servicio del Gateway</span>
          <span>6 capacidades / con compatibilidad LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/gateway/index), [Gateway](/es/cli/gateway), [Linux](/es/platforms/linux), [VPS](/es/vps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso remoto y seguridad</span>
          <span>6 capacidades / con compatibilidad LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Acceso remoto](/es/gateway/remote), [Tailscale](/es/gateway/tailscale), [Guía operativa de exposición](/es/gateway/security/exposure-runbook), [Autenticación](/es/gateway/authentication), [Secretos](/es/gateway/secrets)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Diagnóstico y reparación</span>
          <span>4 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Estado](/es/cli/status), [Registros](/es/cli/logs), [Doctor](/es/cli/doctor), [Diagnóstico](/es/gateway/diagnostics), [Índice](/es/gateway/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Destinos de despliegue</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Vps](/es/vps), [Docker](/es/install/docker), [Hetzner](/es/install/hetzner), [Digitalocean](/es/install/digitalocean), [Kubernetes](/es/install/kubernetes), [Podman](/es/install/podman)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Host del Gateway en macOS - M4 estable - 7 áreas">
    <a id="macos-gateway-host" />

    Se documentan la ruta del servicio LaunchAgent, los modos local/remoto del Gateway, la instalación de la CLI y la integración con la aplicación.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad beta - 74%</span><span>Integridad estable - 88%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración de la CLI</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Macos](/es/platforms/macos), [Gateway incluido](/es/platforms/mac/bundled-gateway), [Instalador](/es/install/installer), [Node](/es/install/node)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Integración con el Gateway local</span>
          <span>9 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Macos](/es/platforms/macos), [Gateway incluido](/es/platforms/mac/bundled-gateway), [Remoto](/es/platforms/mac/remote), [Índice](/es/gateway/index), [Gateway](/es/cli/gateway), [Bonjour](/es/gateway/bonjour)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Modo de Gateway remoto</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Remoto](/es/platforms/mac/remote), [Remoto](/es/gateway/remote), [Tailscale](/es/gateway/tailscale)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ciclo de vida del servicio Gateway</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Macos](/es/platforms/macos), [Gateway incluido](/es/platforms/mac/bundled-gateway), [Gateway](/es/cli/gateway), [Índice](/es/gateway/index), [Actualizar](/es/cli/update), [Actualización](/es/install/updating), [Desinstalación](/es/install/uninstall), [Solución de problemas](/es/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Diagnóstico y observabilidad</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Gateway incluido](/es/platforms/mac/bundled-gateway), [Macos](/es/platforms/macos), [Gateway](/es/cli/gateway), [Diagnóstico](/es/gateway/doctor), [Solución de problemas](/es/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Permisos y capacidades nativas</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Macos](/es/platforms/macos), [Remoto](/es/platforms/mac/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Perfiles y aislamiento</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Varios Gateways](/es/gateway/multiple-gateways), [Índice](/es/gateway/index), [Gateway](/es/cli/gateway)

    </div>
      </div>
    </div>

  </Accordion>
  <Accordion title="Aplicación para Android - M4 estable - 7 áreas">
    <a id="android-app" />

    Existe una distribución oficial en Google Play, se mantiene la documentación para compilar y ejecutar desde el código fuente, y la aplicación para Android está documentada como un Node complementario normal para los usuarios.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad estable - 80%</span><span>Integridad estable - 80%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Captura multimedia</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/es/platforms/android), [Cámara](/es/nodes/camera)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chat móvil</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/es/platforms/android)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración de la conexión</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/es/platforms/android), [Bonjour](/es/gateway/bonjour), [Emparejamiento](/es/gateway/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Distribución</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/es/platforms/android)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/es/platforms/android)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Voz</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/es/platforms/android), [Conversación](/es/nodes/talk)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entorno de ejecución del dispositivo</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/es/platforms/android), [Solución de problemas](/es/nodes/troubleshooting), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
    </div>

  </Accordion>
  <Accordion title="Aplicación para iOS - M4 estable - 8 áreas">
    <a id="ios-app" />

    Existe una distribución oficial mediante la App Store, se documentan las notificaciones push respaldadas por retransmisión y la aplicación para iOS se documenta como un nodo complementario normal para los usuarios.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad estable - 80%</span><span>Integridad estable - 80%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Contenido multimedia y uso compartido</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios), [Cámara](/es/nodes/camera)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Lienzo y pantalla</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios), [Lienzo](/es/plugins/reference/canvas)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chat y sesiones</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios), [Chat web](/es/web/webchat), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y diagnóstico del Gateway</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios), [Emparejamiento](/es/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Distribución</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Comandos del dispositivo</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Notificaciones y segundo plano</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios), [Configuración](/es/gateway/configuration)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Voz</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios), [Conversación](/es/nodes/talk)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Alojamiento con Docker y Podman - Beta M3 - 4 áreas">
    <a id="docker-and-podman-hosting" />

    Existe documentación de instalación y estas son rutas de despliegue habituales. Promover después de que las pruebas de humo periódicas de las versiones capturen el comportamiento de las actualizaciones y los volúmenes.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 7%</span><span>Calidad beta - 71%</span><span>Completitud beta - 79%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración de contenedores</span>
          <span>6 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Docker](/es/install/docker), [Podman](/es/install/podman)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Operaciones con contenedores</span>
          <span>11 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Podman](/es/install/podman), [Entorno de ejecución de máquina virtual Docker](/es/install/docker-vm-runtime), [Docker](/es/install/docker), [Hetzner](/es/install/hetzner), [Hostinger](/es/install/hostinger)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Publicación y validación de imágenes</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>29%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "29%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Docker](/es/install/docker), [Entorno de ejecución de máquina virtual Docker](/es/install/docker-vm-runtime), [Validación completa de la versión](/es/reference/full-release-validation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entorno aislado y herramientas del agente</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Docker](/es/install/docker), [Entorno de ejecución de máquina virtual Docker](/es/install/docker-vm-runtime)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Windows mediante WSL2 - M3 Beta - 6 áreas">
    <a id="windows-via-wsl2" />

    Ruta recomendada para Windows con orientación sobre systemd y servicios de usuario, y documentación de la cadena de arranque. Promover después de obtener repetidamente cuadros de puntuación de instalación y actualización.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 6%</span><span>Calidad alfa - 69%</span><span>Integridad beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración de WSL</span>
          <span>6 capacidades / con compatibilidad LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/es/platforms/windows), [Primeros pasos](/es/start/getting-started)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI</span>
          <span>8 capacidades / con compatibilidad LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/es/platforms/windows), [Primeros pasos](/es/start/getting-started), [Actualización](/es/install/updating), [Incorporación](/es/cli/onboard), [Diagnóstico](/es/cli/doctor), [Estado](/es/cli/status), [Registros](/es/cli/logs)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ciclo de vida del servicio Gateway</span>
          <span>10 capacidades / con compatibilidad LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/es/platforms/windows), [Índice](/es/gateway/index), [Diagnóstico](/es/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso y exposición del Gateway</span>
          <span>11 capacidades / con compatibilidad LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Autenticación](/es/gateway/authentication), [Secretos](/es/gateway/secrets), [Acceso remoto](/es/gateway/remote), [Guía operativa de exposición](/es/gateway/security/exposure-runbook), [Windows](/es/platforms/windows)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Diagnóstico y reparación</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/es/platforms/windows), [Estado](/es/cli/status), [Registros](/es/cli/logs), [Doctor](/es/cli/doctor), [Doctor](/es/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Navegador e interfaz de control</span>
          <span>6 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Solución de problemas de CDP remoto del navegador en WSL2 para Windows](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting), [Navegador](/es/tools/browser), [Interfaz de control](/es/web/control-ui)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Raspberry Pi y dispositivos Linux pequeños - M3 Beta - 4 áreas">
    <a id="raspberry-pi-and-small-linux-devices" />

    Existe documentación de la plataforma y la ruta del Gateway se basa en Linux. Se necesitan pruebas de humo de la versión específicas del hardware para alcanzar un nivel superior.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 0%</span><span>Calidad Alfa - 67%</span><span>Integridad Beta - 79%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y compatibilidad</span>
          <span>12 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Raspberry Pi](/es/install/raspberry-pi), [Índice](/es/install/index), [Preguntas frecuentes sobre la primera ejecución](/es/help/faq-first-run), [Preguntas frecuentes](/es/help/faq), [Linux](/es/platforms/linux), [Instalador](/es/install/installer)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso remoto y autenticación</span>
          <span>9 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Raspberry Pi](/es/install/raspberry-pi), [Autenticación](/es/gateway/authentication), [Secretos](/es/gateway/secrets), [Emparejamiento](/es/gateway/pairing), [Dispositivos](/es/cli/devices), [Acceso remoto](/es/gateway/remote), [Tailscale](/es/gateway/tailscale)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entorno de ejecución del Gateway</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/gateway/index), [Gateway](/es/cli/gateway), [Raspberry Pi](/es/install/raspberry-pi), [Linux](/es/platforms/linux), [VPS](/es/vps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Rendimiento y diagnóstico</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Raspberry Pi](/es/install/raspberry-pi), [Linux](/es/platforms/linux), [Estado del sistema](/es/gateway/health), [Diagnóstico](/es/gateway/diagnostics)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Aplicación complementaria para macOS - M3 Beta - 8 áreas">
    <a id="macos-companion-app" />

    Cuenta con una completa aplicación para la barra de menús, permisos, modo Node, Canvas, activación por voz, WebChat y modo remoto. Aún evoluciona con demasiada rapidez para considerarla estable.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 0%</span><span>Calidad Alfa - 66%</span><span>Integridad Beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Canvas</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Canvas](/es/platforms/mac/canvas), [macOS](/es/platforms/macos), [WebChat](/es/web/webchat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración local</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Gateway integrado](/es/platforms/mac/bundled-gateway), [macOS](/es/platforms/macos), [Proceso secundario](/es/platforms/mac/child-process), [Configuración de desarrollo](/es/platforms/mac/dev-setup)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Estado y configuración</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Barra de menús](/es/platforms/mac/menu-bar), [Icono](/es/platforms/mac/icon), [macOS](/es/platforms/macos), [Estado del sistema](/es/platforms/mac/health), [Registro](/es/platforms/mac/logging), [Acceso remoto](/es/platforms/mac/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Capacidades nativas</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [macOS](/es/platforms/macos), [XPC](/es/platforms/mac/xpc), [Permisos](/es/platforms/mac/permissions), [Firma](/es/platforms/mac/signing), [Peekaboo](/es/platforms/mac/peekaboo)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Conexiones remotas</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Acceso remoto](/es/platforms/mac/remote), [macOS](/es/platforms/macos), [Acceso remoto](/es/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Voz y conversación</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Activación por voz](/es/platforms/mac/voicewake), [Superposición de voz](/es/platforms/mac/voice-overlay), [Conversación](/es/nodes/talk), [macOS](/es/platforms/macos)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">WebChat</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Webchat](/es/platforms/mac/webchat), [macOS](/es/platforms/macos), [Webchat](/es/web/webchat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">WebChat remoto</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Webchat](/es/platforms/mac/webchat), [Remoto](/es/gateway/remote), [Remoto](/es/platforms/mac/remote)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Windows nativo - M2 Alfa - 4 áreas">
    <a id="native-windows" />

    Los flujos principales de CLI/Gateway funcionan, pero la documentación sigue recomendando WSL2 para disfrutar de la experiencia completa y enumera las salvedades del uso nativo.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 58%</span><span>Integridad alfa - 66%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 1</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI</span>
          <span>9 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/install/index), [Instalador](/es/install/installer), [Windows](/es/platforms/windows), [Primeros pasos](/es/start/getting-started), [Incorporación](/es/cli/onboard)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gestión del Gateway</span>
          <span>11 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/es/platforms/windows), [Índice](/es/gateway/index), [Gateway](/es/cli/gateway), [Diagnóstico](/es/cli/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Redes</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/es/platforms/windows), [Índice](/es/gateway/index), [Gateway](/es/cli/gateway)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Actualizaciones</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Actualización](/es/install/updating), [CI](/es/ci)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Alojamiento en Kubernetes - M2 Alfa - 4 áreas">
    <a id="kubernetes-hosting" />

    El alojamiento en Kubernetes es una vía de despliegue en clúster independiente basada en Kustomize. La puntuación actual muestra una vía de despliegue mínima real con carencias en torno a la CI específica de Kubernetes, el empaquetado de ingress/TLS/NetworkPolicy, la copia de seguridad y restauración, y el refuerzo de la exposición en producción.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 0%</span><span>Calidad Alfa - 55%</span><span>Completitud Alfa - 61%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración del despliegue</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/es/install/kubernetes), [Índice](/es/install/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y secretos</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/es/install/kubernetes), [Secretos](/es/gateway/secrets), [Entorno](/es/help/environment)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso y exposición</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/es/install/kubernetes), [Autenticación](/es/gateway/authentication), [Acceso remoto](/es/gateway/remote), [Guía operativa de exposición](/es/gateway/security/exposure-runbook)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ciclo de vida del clúster</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/es/install/kubernetes), [Índice](/es/gateway/index)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Vía de instalación de Nix - M1 Experimental - 5 áreas">
    <a id="nix-install-path" />

    Flujo de instalación opcional. Necesita una promesa de soporte más clara antes de ascender a alfa/beta.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 0%</span><span>Calidad Experimental - 41%</span><span>Completitud Experimental - 44%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Traspaso de la instalación</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/es/install/nix), [Índice](/es/install/index), [Directorio de documentación](/es/start/docs-directory)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ciclo de vida del Plugin</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Gestionar Plugins](/es/plugins/manage-plugins), [Plugin](/es/tools/plugin), [Nix](/es/install/nix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Activación y experiencia de usuario de la aplicación</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/es/install/nix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y estado</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/es/install/nix), [Configuración](/es/cli/setup), [Entorno](/es/help/environment)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entorno de ejecución del servicio y protecciones</span>
          <span>8 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/es/install/nix), [Configuración](/es/cli/setup), [Diagnóstico](/es/cli/doctor), [Actualización](/es/cli/update)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Superficies complementarias de watchOS - M1 Experimental - 5 áreas">
    <a id="watchos-companion-surfaces" />

    El código fuente contiene superficies de la aplicación/extensión para Watch; la documentación pública aún no las presenta como una función para el usuario.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad experimental - 41%</span><span>Completitud experimental - 44%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entrega y recuperación</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Aprobaciones de ejecución</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Aprobaciones de ejecución](/es/tools/exec-approvals), [iOS](/es/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Distribución y soporte</span>
          <span>6 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Notificaciones y respuestas</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Interfaz de la aplicación para el reloj</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/es/platforms/ios)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Aplicación complementaria para Linux - M0 Planificada - 5 áreas">
    <a id="linux-companion-app" />

    La documentación indica que las aplicaciones complementarias nativas para Linux están planificadas; actualmente, Gateway es la vía compatible para Linux.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad experimental - 19%</span><span>Integridad experimental - 21%</span><span><span className="maturity-lts maturity-lts-none">Ninguna</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Distribución de la aplicación</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/es/platforms/linux), [Índice](/es/platforms/index), [Índice](/es/install/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Conectividad con Gateway</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/es/platforms/linux), [Índice](/es/gateway/index), [Emparejamiento](/es/gateway/pairing), [Acceso remoto](/es/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chat y sesiones</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/es/platforms/linux), [Protocolo](/es/gateway/protocol), [Chat web](/es/web/webchat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Capacidades de escritorio</span>
          <span>9 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/es/platforms/linux), [Aprobaciones de ejecución](/es/tools/exec-approvals), [Secretos](/es/gateway/secrets), [Índice](/es/nodes/index), [Ejecución](/es/tools/exec), [Habla](/es/nodes/talk), [Cámara](/es/nodes/camera)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Estado y diagnóstico</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/es/platforms/linux), [OpenClaw](/es/start/openclaw), [Doctor](/es/gateway/doctor)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Aplicación complementaria nativa para Windows - M0 Planificada - 5 áreas">
    <a id="native-windows-companion-app" />

    Solo planificada.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad experimental - 19%</span><span>Integridad experimental - 21%</span><span><span className="maturity-lts maturity-lts-none">Ninguna</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Instalación y actualizaciones</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/es/platforms/windows), [Índice](/es/install/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Conexión al Gateway</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/es/platforms/windows), [Índice](/es/gateway/index), [Emparejamiento](/es/gateway/pairing), [Acceso remoto](/es/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Sesiones de chat</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/es/platforms/windows), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Estado y reparación</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/es/platforms/windows), [Diagnóstico](/es/gateway/doctor), [Índice](/es/gateway/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Herramientas y permisos de escritorio</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/es/platforms/windows), [Índice](/es/nodes/index), [Ejecución](/es/tools/exec), [Aprobaciones de ejecución](/es/tools/exec-approvals), [Índice](/es/gateway/security/index)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### Canal

<AccordionGroup>
  <Accordion title="Discord - M4 estable - 6 áreas">
    <a id="discord" />

    Documentación detallada y amplia cobertura de funciones. Las rutas de voz/delegación deben seguir puntuándose por separado como beta/alfa.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad beta - 73%</span><span>Integridad estable - 87%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 4</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones del canal</span>
          <span>10 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/es/channels/discord), [Discord](/es/plugins/reference/discord), [Fly](/es/install/fly), [Comandos de barra diagonal](/es/tools/slash-commands), [Estado](/es/gateway/health), [Canales](/es/cli/channels), [Configuración de canales](/es/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/es/channels/discord), [Vinculación](/es/channels/pairing), [Grupos de acceso](/es/channels/access-groups), [Grupos](/es/channels/groups)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>12 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/es/channels/discord), [Enrutamiento de canales](/es/channels/channel-routing), [Grupos](/es/channels/groups), [Grupos de acceso](/es/channels/access-groups), [Agentes ACP](/es/tools/acp-agents), [Subagentes](/es/tools/subagents)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Contenido multimedia y enriquecido</span>
          <span>1 capacidad / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/es/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles nativos y aprobaciones</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/es/channels/discord), [Comandos con barra diagonal](/es/tools/slash-commands)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Voz y llamadas en tiempo real</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/es/channels/discord), [OpenAI](/es/providers/openai), [Elevenlabs](/es/providers/elevenlabs), [Automatización de control de calidad E2E](/es/concepts/qa-e2e-automation), [Configuración de canales](/es/gateway/config-channels)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Telegram - M3 Beta - 5 áreas">
    <a id="telegram" />

    El canal principal tiene la madurez suficiente para un uso habitual, pero la experiencia de usuario de alta variabilidad y los casos extremos de contenido multimedia necesitan pruebas periódicas de escenarios.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 0%</span><span>Calidad Alfa - 68%</span><span>Integridad Beta - 78%</span><span><span className="maturity-lts maturity-lts-full">Completo - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones del canal</span>
          <span>10 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/es/channels/telegram), [Configurar canales](/es/gateway/config-channels), [Canales](/es/cli/channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>10 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/es/channels/telegram), [Emparejamiento](/es/channels/pairing), [Grupos de acceso](/es/channels/access-groups), [Grupos](/es/channels/groups), [Multiagente](/es/concepts/multi-agent)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>1 capacidad / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/es/channels/telegram), [Grupos](/es/channels/groups), [Multiagente](/es/concepts/multi-agent)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Contenido multimedia y enriquecido</span>
          <span>1 capacidad / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/es/channels/telegram), [Ubicación](/es/channels/location)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles nativos y aprobaciones</span>
          <span>9 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/es/channels/telegram), [Aprobaciones de ejecución](/es/tools/exec-approvals), [Reacciones](/es/tools/reactions)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Slack - M3 Beta - 5 áreas">
    <a id="slack" />

    Documentación de canal y superficie de enrutamiento de primera clase. Necesita cuadros de mando de escenarios de instalación y administración del espacio de trabajo.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 0%</span><span>Calidad Alfa - 66%</span><span>Integridad Beta - 78%</span><span><span className="maturity-lts maturity-lts-full">Completo - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones del canal</span>
          <span>10 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/es/channels/slack), [Slack](/es/plugins/reference/slack), [Secretos](/es/gateway/secrets), [Automatización de QA E2E](/es/concepts/qa-e2e-automation), [Solución de problemas](/es/channels/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>1 capacidad / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/es/channels/slack), [Emparejamiento](/es/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>5 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/es/channels/slack), [Protección contra bucles de bots](/es/channels/bot-loop-protection), [Emparejamiento](/es/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Contenido multimedia y enriquecido</span>
          <span>1 capacidad / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/es/channels/slack), [Automatización de QA E2E](/es/concepts/qa-e2e-automation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles nativos y aprobaciones</span>
          <span>8 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/es/channels/slack), [Comandos con barra diagonal](/es/tools/slash-commands), [Aprobaciones de ejecución](/es/tools/exec-approvals)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="iMessage y BlueBubbles - M3 Beta - 5 áreas">
    <a id="imessage-and-bluebubbles" />

    El funcionamiento compatible de iMessage se realiza mediante imsg en un host de Mensajes de macOS con una sesión iniciada; las configuraciones heredadas de BlueBubbles requieren migración. Mantenga visibles las advertencias sobre los permisos de macOS, el contenedor SSH, SIP/API privada y la migración.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 0%</span><span>Calidad Alfa - 66%</span><span>Integridad Beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones del canal</span>
          <span>11 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage con BlueBubbles](/es/announcements/bluebubbles-imessage), [iMessage desde BlueBubbles](/es/channels/imessage-from-bluebubbles), [Configuración de canales](/es/gateway/config-channels), [iMessage](/es/channels/imessage)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>6 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/es/channels/imessage), [iMessage desde BlueBubbles](/es/channels/imessage-from-bluebubbles), [Configuración de canales](/es/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/es/channels/imessage)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Contenido multimedia y enriquecido</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/es/channels/imessage), [iMessage desde BlueBubbles](/es/channels/imessage-from-bluebubbles), [Configuración de canales](/es/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles nativos y aprobaciones</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/es/channels/imessage)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="WhatsApp - M3 Beta - 5 áreas">
    <a id="whatsapp" />

    La ruta principal es importante y está documentada; la volatilidad de Baileys y de las sesiones en el componente upstream la mantiene por debajo de Estable.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 0%</span><span>Calidad Alfa - 66%</span><span>Integridad Beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones del canal</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/es/channels/whatsapp), [Configuración de canales](/es/gateway/config-channels), [WhatsApp](/es/plugins/reference/whatsapp), [Automatización de QA E2E](/es/concepts/qa-e2e-automation), [Doctor](/es/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/es/channels/whatsapp), [Canales de configuración](/es/gateway/config-channels), [Automatización de QA E2E](/es/concepts/qa-e2e-automation), [Emparejamiento](/es/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/es/channels/whatsapp), [Mensajes grupales](/es/channels/group-messages)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Contenido multimedia y enriquecido</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/es/channels/whatsapp)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles nativos y aprobaciones</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/es/channels/whatsapp)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Matrix - M2 Alfa - 6 áreas">
    <a id="matrix" />

    Compatible mediante el plugin incluido. Requiere tarjetas de puntuación para el puente, la autenticación y el ciclo de vida de las salas.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 60%</span><span>Completitud alfa - 67%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones de canales</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/es/channels/matrix), [Migración de Matrix](/es/channels/matrix-migration)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/es/channels/matrix), [Grupos](/es/channels/groups), [Protección contra bucles de bots](/es/channels/bot-loop-protection)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/es/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Contenido multimedia y enriquecido</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/es/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles nativos y aprobaciones</span>
          <span>6 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/es/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cifrado y verificación</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/es/channels/matrix), [Migración de Matrix](/es/channels/matrix-migration)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Google Chat - M2 Alfa - 5 áreas">
    <a id="google-chat" />

    Canal documentado, pero la configuración empresarial y administrativa aumenta el riesgo de madurez.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 59%</span><span>Integridad alfa - 66%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones del canal</span>
          <span>16 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/es/channels/googlechat), [Google Chat](/es/plugins/reference/googlechat), [Configuración de canales](/es/gateway/config-channels), [Referencia de la CLI del asistente](/es/start/wizard-cli-reference), [Secretos](/es/gateway/secrets), [Superficie de credenciales Secretref](/es/reference/secretref-credential-surface), [Estado](/es/gateway/health), [Inventario de plugins](/es/plugins/plugin-inventory), [Índice](/es/channels/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>11 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/es/channels/googlechat), [Emparejamiento](/es/channels/pairing), [Grupos de acceso](/es/channels/access-groups), [Configuración de canales](/es/gateway/config-channels), [Protección contra bucles de bots](/es/channels/bot-loop-protection), [Enrutamiento de canales](/es/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/es/channels/googlechat), [Protección contra bucles de bots](/es/channels/bot-loop-protection), [Grupos de acceso](/es/channels/access-groups), [Enrutamiento de canales](/es/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Contenido multimedia y enriquecido</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/es/channels/googlechat), [Mensaje](/es/cli/message), [Comprensión multimedia](/es/nodes/media-understanding), [Superficie de credenciales Secretref](/es/reference/secretref-credential-surface)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles nativos y aprobaciones</span>
          <span>16 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/es/channels/googlechat), [Mensaje](/es/cli/message), [Comprensión multimedia](/es/nodes/media-understanding), [Superficie de credenciales Secretref](/es/reference/secretref-credential-surface), [Reacciones](/es/tools/reactions), [Comandos de barra diagonal](/es/tools/slash-commands), [Configuración de agentes](/es/gateway/config-agents), [Refactorización del ciclo de vida de los mensajes](/es/concepts/message-lifecycle-refactor)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Microsoft Teams - M2 Alfa - 5 áreas">
    <a id="microsoft-teams" />

    Los flujos empresariales de autenticación y administración requieren pruebas explícitas de los escenarios.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 59%</span><span>Completitud alfa - 66%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones del canal</span>
          <span>9 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/es/channels/msteams), [Microsoft Teams](/es/plugins/reference/msteams), [Configuración de canales](/es/gateway/config-channels), [Estado](/es/gateway/health)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>9 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/es/channels/msteams), [Emparejamiento](/es/channels/pairing), [Grupos de acceso](/es/channels/access-groups)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/es/channels/msteams), [Grupos](/es/channels/groups), [Enrutamiento de canales](/es/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Contenido multimedia y enriquecido</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/es/channels/msteams)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles nativos y aprobaciones</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/es/channels/msteams), [Aprobaciones de ejecución avanzadas](/es/tools/exec-approvals-advanced)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Signal - M2 Alfa - 5 áreas">
    <a id="signal" />

    Existe documentación del canal compatible; se necesitan pruebas más sólidas de instalación y reconexión.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 59%</span><span>Completitud alfa - 66%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones de canales</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/es/channels/signal), [Signal](/es/plugins/reference/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>6 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/es/channels/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/es/channels/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Contenido multimedia y enriquecido</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/es/channels/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Controles nativos y aprobaciones</span>
          <span>3 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/es/channels/signal)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canales regionales - Alfa M2 - 4 áreas">
    <a id="feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels" />

    Cobertura regional importante, pero el nivel de soporte público debe calibrarse según el tipo de cuenta, la aprobación del proveedor y las pruebas de los mantenedores.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 55%</span><span>Integridad alfa - 58%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones de canales</span>
          <span>6 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/channels/index), [Vinculación](/es/channels/pairing), [Feishu](/es/plugins/reference/feishu), [Aspectos internos de la arquitectura](/es/plugins/architecture-internals)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    No hay documentación vinculada

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    No hay documentación vinculada

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Contenido multimedia y enriquecido</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    No hay documentación enlazada

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - M2 Alfa - 4 áreas">
    <a id="mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat" />

    Existen superficies compatibles, pero es probable que la madurez varíe según la cobertura del proyecto original y de los mantenedores. Evaluarlas individualmente más adelante.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 53%</span><span>Completitud alfa - 54%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones del canal</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    No hay documentación enlazada

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    No hay documentación enlazada

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    No hay documentación enlazada

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Medios y contenido enriquecido</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    No hay documentación enlazada

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Canal de llamadas de voz - M1 Experimental - 5 áreas">
    <a id="voice-call-channel" />

    Ruta opcional/de Plugin con comportamiento complejo en tiempo real. Necesita una tarjeta de puntuación de escenarios antes de la beta pública.

    <div className="maturity-surface-rollup"><span>Cobertura Experimental - 0%</span><span>Calidad Experimental - 41%</span><span>Exhaustividad Experimental - 44%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Exhaustividad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y operaciones del canal</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Llamadas de voz](/es/cli/voicecall), [Llamada de voz](/es/plugins/voice-call), [Protocolo](/es/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Acceso e identidad</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Llamada de voz](/es/plugins/voice-call), [Llamadas de voz](/es/cli/voicecall)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y entrega de conversaciones</span>
          <span>1 capacidad</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Llamada de voz](/es/plugins/voice-call)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Medios y contenido enriquecido</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Llamada de voz](/es/plugins/voice-call), [Inventario de plugins](/es/plugins/plugin-inventory)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Voz y llamadas en tiempo real</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Llamada de voz](/es/plugins/voice-call)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### Proveedor y herramienta

<AccordionGroup>
  <Accordion title="Automatización del navegador, ejecución y herramientas de entorno aislado - M3 Beta - 3 áreas">
    <a id="browser-automation-exec-and-sandbox-tools" />

    Las herramientas principales están documentadas, pero la seguridad del host y la experiencia de usuario de los permisos deben mantenerse bajo revisión activa en la tabla de evaluación.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 21%</span><span>Calidad Beta - 75%</span><span>Integridad Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 2</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Automatización del navegador</span>
          <span>8 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Control del navegador](/es/tools/browser-control), [Pruebas](/es/help/testing), [Navegador](/es/tools/browser), [Índice](/es/gateway/security/index), [Comprobaciones de auditoría](/es/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Invocación y ejecución de herramientas</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ejecución](/es/tools/exec), [Proceso en segundo plano](/es/gateway/background-process), [API HTTP de invocación de herramientas](/es/gateway/tools-invoke-http-api), [Ámbitos del operador](/es/gateway/operator-scopes), [Protocolo](/es/gateway/protocol), [Aprobaciones de ejecución](/es/tools/exec-approvals), [Aprobaciones avanzadas de ejecución](/es/tools/exec-approvals-advanced), [Elevado](/es/tools/elevated)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Política de sandbox y herramientas</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Aislamiento mediante sandbox](/es/gateway/sandboxing), [Sandbox frente a política de herramientas frente a modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated), [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools), [Referencia del entorno de Codex](/es/plugins/codex-harness-reference), [Herramientas de configuración](/es/gateway/config-tools)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Ruta del proveedor OpenAI y Codex - M3 Beta - 5 áreas">
    <a id="openai-and-codex-provider-path" />

    Documentación detallada, ruta de OAuth/suscripción, voz en tiempo real, imágenes y comportamiento de compatibilidad. Los cambios frecuentes del proveedor impiden que alcance el estado Estable sin pruebas de la tarjeta de puntuación de la versión.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 26%</span><span>Calidad beta - 74%</span><span>Integridad beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Parcial - 3</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Modelo y autenticación</span>
          <span>6 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/es/providers/openai), [Entorno de Codex](/es/plugins/codex-harness), [Modelos](/es/concepts/models), [OAuth](/es/concepts/oauth), [Referencia del entorno de Codex](/es/plugins/codex-harness-reference), [Supervisión de la autenticación](/es/gateway/authentication)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Compatibilidad de respuestas y herramientas</span>
          <span>4 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/es/providers/openai), [API HTTP de OpenResponses](/es/gateway/openresponses-http-api), [API HTTP de OpenAI](/es/gateway/openai-http-api), [Plugins nativos de Codex](/es/plugins/codex-native-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Infraestructura nativa de Codex</span>
          <span>2 capacidades / con soporte LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Infraestructura de Codex](/es/plugins/codex-harness), [Entorno de ejecución de la infraestructura de Codex](/es/plugins/codex-harness-runtime), [Referencia de la infraestructura de Codex](/es/plugins/codex-harness-reference), [Plugins nativos de Codex](/es/plugins/codex-native-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entrada de imágenes y multimodal</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/es/providers/openai), [Generación de imágenes](/es/tools/image-generation), [Imágenes](/es/nodes/images)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Voz y audio en tiempo real</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/es/providers/openai), [Discord](/es/channels/discord), [Llamada de voz](/es/plugins/voice-call)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Herramientas de búsqueda web - M3 Beta - 4 áreas">
    <a id="web-search-tools" />

    Existen varios proveedores y documentos. Se necesitan pruebas de cuotas, errores y SSRF para cada familia de proveedores.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 9%</span><span>Calidad beta - 74%</span><span>Integridad beta - 79%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Proveedores de búsqueda</span>
          <span>19 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>11%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "11%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Web](/es/tools/web), [Brave Search](/es/tools/brave-search), [Tavily](/es/tools/tavily), [Exa Search](/es/tools/exa-search), [Firecrawl](/es/tools/firecrawl), [Perplexity Search](/es/tools/perplexity-search), [Duckduckgo Search](/es/tools/duckduckgo-search), [Searxng Search](/es/tools/searxng-search), [Gemini Search](/es/tools/gemini-search), [Grok Search](/es/tools/grok-search), [Kimi Search](/es/tools/kimi-search), [Minimax Search](/es/tools/minimax-search), [Ollama Search](/es/tools/ollama-search), [Subrutas del SDK](/es/plugins/sdk-subpaths), [Descripción general del SDK](/es/plugins/sdk-overview), [Manifiesto](/es/plugins/manifest)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y diagnóstico</span>
          <span>9 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Web](/es/tools/web), [Obtención web](/es/tools/web-fetch), [Preguntas frecuentes](/es/help/faq), [Costes de uso de la API](/es/reference/api-usage-costs), [Brave Search](/es/tools/brave-search), [Perplexity Search](/es/tools/perplexity-search), [Tavily](/es/tools/tavily), [Firecrawl](/es/tools/firecrawl)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Seguridad de red</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Web](/es/tools/web), [Obtención web](/es/tools/web-fetch), [Firecrawl](/es/tools/firecrawl), [Searxng Search](/es/tools/searxng-search)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Disponibilidad y obtención de herramientas</span>
          <span>11 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Herramientas de configuración](/es/gateway/config-tools), [Obtención web](/es/tools/web-fetch), [Web](/es/tools/web), [Preguntas frecuentes](/es/help/faq)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Ruta del proveedor Anthropic - M3 Beta - 5 áreas">
    <a id="anthropic-provider-path" />

    Proveedor de modelos de primera clase. Se necesitan pruebas periódicas de escenarios de autenticación, catálogo y llamadas a herramientas.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad beta - 71%</span><span>Integridad beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Autenticación y recuperación de proveedores</span>
          <span>9 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/es/providers/anthropic), [Doctor](/es/gateway/doctor), [Ejemplos de configuración](/es/gateway/configuration-examples), [Solución de problemas](/es/gateway/troubleshooting), [Almacenamiento en caché de prompts](/es/reference/prompt-caching)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Selección de modelos y entornos de ejecución</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/es/providers/anthropic), [Configuración de agentes](/es/gateway/config-agents), [Modelos](/es/concepts/models), [Backends de CLI](/es/gateway/cli-backends)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Transporte de solicitudes y semántica de turnos</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/es/providers/anthropic), [Almacenamiento en caché de prompts](/es/reference/prompt-caching), [Solución de problemas](/es/gateway/troubleshooting), [Backends de CLI](/es/gateway/cli-backends), [Proveedores de modelos](/es/concepts/model-providers)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Caché de prompts y contexto</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/es/providers/anthropic), [Almacenamiento en caché de prompts](/es/reference/prompt-caching), [Solución de problemas](/es/gateway/troubleshooting), [Heartbeat](/es/gateway/heartbeat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entradas multimedia</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/es/providers/anthropic), [Configuración de agentes](/es/gateway/config-agents)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Ruta del proveedor de Google - M3 Beta - 5 áreas">
    <a id="google-provider-path" />

    Proveedor de primera clase con interfaces de modelos y en tiempo real. Necesita una puntuación independiente para Live/Talk.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 66%</span><span>Completitud beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y credenciales del proveedor</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/es/providers/google), [Proveedores de modelos](/es/concepts/model-providers)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento de modelos y endpoints</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/es/providers/google), [Proveedores de modelos](/es/concepts/model-providers), [Google](/es/plugins/reference/google), [Búsqueda de Gemini](/es/tools/gemini-search)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entorno de ejecución directo de Gemini</span>
          <span>9 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/es/providers/google), [Proveedores de modelos](/es/concepts/model-providers), [Preguntas frecuentes sobre modelos](/es/help/faq-models), [Pruebas en vivo](/es/help/testing-live)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Medios, búsqueda y tiempo real</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/es/plugins/reference/google), [Google](/es/providers/google)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Almacenamiento en caché de prompts</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Almacenamiento en caché de prompts](/es/reference/prompt-caching), [Google](/es/providers/google), [Proveedores de modelos](/es/concepts/model-providers), [Uso de tokens](/es/reference/token-use)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Ruta del proveedor OpenRouter - M3 Beta - 4 áreas">
    <a id="openrouter-provider-path" />

    La ruta unificada del proveedor está documentada y es útil, pero el comportamiento específico de cada modelo varía.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 66%</span><span>Completitud beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración y autenticación del proveedor</span>
          <span>14 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenRouter](/es/providers/openrouter), [Proveedores de modelos](/es/concepts/model-providers), [Configurar](/es/cli/configure), [Autenticación](/es/gateway/authentication), [Entorno](/es/help/environment), [Modelos](/es/cli/models), [Modelos](/es/concepts/models)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Entorno de ejecución y normalización del chat</span>
          <span>15 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Openrouter](/es/providers/openrouter), [Proveedores de modelos](/es/concepts/model-providers), [Almacenamiento en caché de prompts](/es/reference/prompt-caching)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Recuperación y diagnóstico de proveedores</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Conmutación por error de modelos](/es/concepts/model-failover), [Openrouter](/es/providers/openrouter), [Modelos](/es/cli/models)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Generación multimedia y voz</span>
          <span>7 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Openrouter](/es/providers/openrouter), [Generación de imágenes](/es/tools/image-generation), [Generación de música](/es/tools/music-generation), [Descripción general de multimedia](/es/tools/media-overview), [Generación de vídeo](/es/tools/video-generation), [Tts](/es/tools/tts)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Herramientas de generación de imágenes, vídeo y música - M2 Alfa - 5 áreas">
    <a id="image-video-and-music-generation-tools" />

    La capacidad está disponible en distintos proveedores, pero la calidad, la latencia y la compatibilidad de los parámetros varían demasiado como para alcanzar la fase beta sin pruebas específicas de cada proveedor.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 61%</span><span>Integridad alfa - 68%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Enrutamiento y descubrimiento de contenido multimedia</span>
          <span>4 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Configuración de agentes](/es/gateway/config-agents), [Generación de imágenes](/es/tools/image-generation), [Generación de vídeo](/es/tools/video-generation), [Generación de música](/es/tools/music-generation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ciclo de vida y entrega de tareas</span>
          <span>12 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Descripción general de medios](/es/tools/media-overview), [Generación de imágenes](/es/tools/image-generation), [Generación de vídeos](/es/tools/video-generation), [Generación de música](/es/tools/music-generation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Generación de imágenes</span>
          <span>9 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Generación de imágenes](/es/tools/image-generation), [Infer](/es/cli/infer), [Descripción general de medios](/es/tools/media-overview)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Generación de vídeos</span>
          <span>11 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Generación de vídeos](/es/tools/video-generation), [Runway](/es/providers/runway), [Pixverse](/es/providers/pixverse), [Fal](/es/providers/fal), [Openrouter](/es/providers/openrouter)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Generación de música</span>
          <span>6 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Generación de música](/es/tools/music-generation)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Proveedores de modelos locales: Ollama, vLLM, SGLang, LM Studio - M2 Alfa - 5 áreas">
    <a id="local-model-providers-ollama-vllm-sglang-lm-studio" />

    Útil y documentado, pero la variabilidad del entorno es alta.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 61%</span><span>Integridad alfa - 68%</span><span><span className="maturity-lts maturity-lts-none">Ninguno</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Configuración, ciclo de vida y diagnóstico de proveedores</span>
          <span>12 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Modelos locales](/es/gateway/local-models), [Lmstudio](/es/providers/lmstudio), [Ollama](/es/providers/ollama), [Vllm](/es/providers/vllm), [Servicios de modelos locales](/es/gateway/local-model-services), [Configuración de agentes](/es/gateway/config-agents), [Solución de problemas](/es/gateway/troubleshooting), [Doctor](/es/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugins nativos de proveedores</span>
          <span>10 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ollama](/es/providers/ollama), [Lmstudio](/es/providers/lmstudio)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Compatibilidad con entornos de ejecución compatibles con OpenAI</span>
          <span>8 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Vllm](/es/providers/vllm), [Sglang](/es/providers/sglang), [Modelos locales](/es/gateway/local-models), [Lmstudio](/es/providers/lmstudio)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Memoria e incrustaciones locales</span>
          <span>5 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Memoria](/es/concepts/memory), [Doctor](/es/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Seguridad de red y controles de prompts</span>
          <span>2 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/gateway/security/index), [Herramientas de configuración](/es/gateway/config-tools), [Modelos locales](/es/gateway/local-models)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Proveedores alojados de larga cola - M2 Alfa - 3 áreas">
    <a id="long-tail-hosted-providers" />

    Existen muchas páginas de documentación y referencia; la puntuación debe generarse a partir de los metadatos de los proveedores y la cobertura de pruebas de humo en vivo.

    <div className="maturity-surface-rollup"><span>Cobertura experimental - 0%</span><span>Calidad alfa - 61%</span><span>Completitud alfa - 68%</span><span><span className="maturity-lts maturity-lts-none">Ninguna</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Área</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Documentación</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Proveedores de LLM alojados</span>
          <span>12 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/providers/index), [Proveedores de modelos](/es/concepts/model-providers), [Pruebas en vivo](/es/help/testing-live), [Incorporación](/es/cli/onboard)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Proveedores de contenido multimedia alojados</span>
          <span>8 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Manifiesto](/es/plugins/manifest), [Pruebas en vivo](/es/help/testing-live), [Índice](/es/providers/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Operaciones de proveedores</span>
          <span>12 capacidades</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Índice](/es/providers/index), [Proveedores de modelos](/es/concepts/model-providers), [Manifiesto](/es/plugins/manifest), [Pruebas en vivo](/es/help/testing-live), [Modelos](/es/cli/models)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>
