---
read_when:
    - Quieres una lista completa de lo que admite OpenClaw
summary: Capacidades de OpenClaw en canales, enrutamiento, medios y UX.
title: Funciones
x-i18n:
    generated_at: "2026-06-27T11:11:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## Aspectos destacados

<Columns>
  <Card title="Canales" icon="message-square" href="/es/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat y más con un único Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/es/tools/plugin">
    Los plugins incluidos agregan Matrix, Nextcloud Talk, Nostr, Twitch, Zalo y más sin instalaciones separadas en las versiones actuales normales.
  </Card>
  <Card title="Enrutamiento" icon="route" href="/es/concepts/multi-agent">
    Enrutamiento multiagente con sesiones aisladas.
  </Card>
  <Card title="Multimedia" icon="image" href="/es/nodes/images">
    Imágenes, audio, video, documentos y generación de imágenes/video.
  </Card>
  <Card title="Aplicaciones e interfaz de usuario" icon="monitor" href="/es/platforms">
    Windows Hub, Web Control UI, aplicación para macOS y nodos móviles.
  </Card>
  <Card title="Nodos móviles" icon="smartphone" href="/es/nodes">
    Nodos iOS y Android con emparejamiento, voz/chat y comandos enriquecidos del dispositivo.
  </Card>
</Columns>

## Lista completa

**Canales:**

- Los canales integrados incluyen Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat y WhatsApp
- Los canales de plugins incluidos incluyen Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo y Zalo Personal
- Los plugins de canal opcionales instalados por separado incluyen Voice Call y paquetes de terceros como WeChat
- Los plugins de canal de terceros pueden ampliar aún más el Gateway, como WeChat
- Compatibilidad con chat grupal con activación basada en menciones
- Seguridad de DM con listas de permitidos y emparejamiento

**Agente:**

- Runtime de agente integrado con streaming de herramientas
- Enrutamiento multiagente con sesiones aisladas por espacio de trabajo o remitente
- Sesiones: los chats directos se contraen en `main` compartido; los grupos están aislados
- Streaming y fragmentación para respuestas largas

**Autenticación y proveedores:**

- Más de 35 proveedores de modelos (Anthropic, OpenAI, Google y más)
- Autenticación de suscripción mediante OAuth (p. ej., OpenAI Codex)
- Compatibilidad con proveedores personalizados y autoalojados (vLLM, SGLang, Ollama y cualquier endpoint compatible con OpenAI o Anthropic)

**Multimedia:**

- Entrada y salida de imágenes, audio, video y documentos
- Superficies compartidas de capacidad de generación de imágenes y generación de video
- Transcripción de notas de voz
- Texto a voz con varios proveedores

**Aplicaciones e interfaces:**

- WebChat e interfaz Control UI del navegador
- Aplicación complementaria de barra de menús para macOS
- Nodo iOS con emparejamiento, Canvas, cámara, grabación de pantalla, ubicación y voz
- Nodo Android con emparejamiento, chat, voz, Canvas, cámara y comandos del dispositivo

**Herramientas y automatización:**

- Automatización del navegador, ejecución y aislamiento en sandbox
- Búsqueda web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tareas Cron y programación de Heartbeat
- Skills, plugins y pipelines de flujo de trabajo (Lobster)

## Relacionado

<CardGroup cols={2}>
  <Card title="Funciones experimentales" href="/es/concepts/experimental-features" icon="flask">
    Funciones opcionales que aún no se han publicado en la superficie predeterminada.
  </Card>
  <Card title="Runtime del agente" href="/es/concepts/agent" icon="robot">
    Modelo de runtime del agente y cómo se despachan las ejecuciones.
  </Card>
  <Card title="Canales" href="/es/channels" icon="message-square">
    Conecta Telegram, WhatsApp, Discord, Slack y más desde un solo Gateway.
  </Card>
  <Card title="Plugins" href="/es/tools/plugin" icon="plug">
    Plugins incluidos y de terceros que amplían OpenClaw.
  </Card>
</CardGroup>
