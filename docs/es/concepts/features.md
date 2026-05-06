---
read_when:
    - Quieres una lista completa de lo que admite OpenClaw
summary: Capacidades de OpenClaw en canales, enrutamiento, medios y UX.
title: Características
x-i18n:
    generated_at: "2026-05-06T05:30:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
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
  <Card title="Apps e interfaz de usuario" icon="monitor" href="/es/web/control-ui">
    Interfaz de usuario de control web y app complementaria para macOS.
  </Card>
  <Card title="Nodos móviles" icon="smartphone" href="/es/nodes">
    Nodos de iOS y Android con emparejamiento, voz/chat y comandos de dispositivo enriquecidos.
  </Card>
</Columns>

## Lista completa

**Canales:**

- Los canales integrados incluyen Discord, Google Chat, iMessage (heredado), IRC, Signal, Slack, Telegram, WebChat y WhatsApp
- Los canales de Plugin incluidos incluyen BlueBubbles para iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo y Zalo Personal
- Los plugins de canal opcionales instalados por separado incluyen Voice Call y paquetes de terceros como WeChat
- Los plugins de canal de terceros pueden ampliar aún más el Gateway, como WeChat
- Compatibilidad con chats grupales con activación basada en menciones
- Seguridad de mensajes directos con listas de permitidos y emparejamiento

**Agente:**

- Runtime de agente integrado con streaming de herramientas
- Enrutamiento multiagente con sesiones aisladas por espacio de trabajo o remitente
- Sesiones: los chats directos se agrupan en `main`; los grupos están aislados
- Streaming y fragmentación para respuestas largas

**Autenticación y proveedores:**

- Más de 35 proveedores de modelos (Anthropic, OpenAI, Google y más)
- Autenticación de suscripción mediante OAuth (p. ej., OpenAI Codex)
- Compatibilidad con proveedores personalizados y autoalojados (vLLM, SGLang, Ollama y cualquier endpoint compatible con OpenAI o Anthropic)

**Multimedia:**

- Imágenes, audio, video y documentos de entrada y salida
- Superficies compartidas de capacidad de generación de imágenes y generación de video
- Transcripción de notas de voz
- Texto a voz con múltiples proveedores

**Apps e interfaces:**

- WebChat e interfaz de usuario de control en navegador
- App complementaria de barra de menús para macOS
- Nodo de iOS con emparejamiento, Canvas, cámara, grabación de pantalla, ubicación y voz
- Nodo de Android con emparejamiento, chat, voz, Canvas, cámara y comandos de dispositivo

**Herramientas y automatización:**

- Automatización de navegador, ejecución, sandboxing
- Búsqueda web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Trabajos de Cron y programación de Heartbeat
- Skills, plugins y pipelines de flujo de trabajo (Lobster)

## Relacionado

<CardGroup cols={2}>
  <Card title="Funciones experimentales" href="/es/concepts/experimental-features" icon="flask">
    Funciones opcionales que aún no se han publicado en la superficie predeterminada.
  </Card>
  <Card title="Runtime de agente" href="/es/concepts/agent" icon="robot">
    Modelo de runtime de agente y cómo se despachan las ejecuciones.
  </Card>
  <Card title="Canales" href="/es/channels" icon="message-square">
    Conecta Telegram, WhatsApp, Discord, Slack y más desde un solo Gateway.
  </Card>
  <Card title="Plugins" href="/es/tools/plugin" icon="plug">
    Plugins incluidos y de terceros que amplían OpenClaw.
  </Card>
</CardGroup>
