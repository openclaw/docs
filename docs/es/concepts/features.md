---
read_when:
    - Quieres una lista completa de lo que admite OpenClaw
summary: Capacidades de OpenClaw en canales, enrutamiento, medios y UX.
title: Características
x-i18n:
    generated_at: "2026-07-05T11:14:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## Destacados

<Columns>
  <Card title="Canales" icon="message-square" href="/es/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat y más con un solo Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/es/tools/plugin">
    Los plugins oficiales agregan Matrix, Nextcloud Talk, Nostr, Twitch, Zalo y docenas más con un solo comando de instalación.
  </Card>
  <Card title="Enrutamiento" icon="route" href="/es/concepts/multi-agent">
    Enrutamiento multiagente con sesiones aisladas.
  </Card>
  <Card title="Multimedia" icon="image" href="/es/nodes/images">
    Imágenes, audio, video, documentos y generación de imágenes/video.
  </Card>
  <Card title="Aplicaciones e interfaz de usuario" icon="monitor" href="/es/platforms">
    Windows Hub, interfaz de control en el navegador, aplicación de barra de menús de macOS y nodos móviles.
  </Card>
  <Card title="Nodos móviles" icon="smartphone" href="/es/nodes">
    Nodos iOS y Android con emparejamiento, voz/chat y comandos enriquecidos del dispositivo.
  </Card>
</Columns>

## Lista completa

**Canales:**

- iMessage, Telegram y WebChat se incluyen con la instalación principal; todos los demás canales son un
  plugin oficial instalado con `openclaw plugins install @openclaw/<id>` (o bajo demanda
  durante `openclaw onboard` / `openclaw channels add`)
- Canales de plugins oficiales: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo y Zalo Personal
- Canales de plugins externos mantenidos fuera del repositorio de OpenClaw: WeChat, Yuanbao y Zalo ClawBot
- Compatibilidad con chats grupales mediante activación basada en menciones
- Seguridad de DM con listas de permitidos y emparejamiento

**Agente:**

- Runtime de agente integrado con streaming de herramientas
- Enrutamiento multiagente con sesiones aisladas por espacio de trabajo o remitente
- Sesiones: los chats directos se colapsan en `main` compartido; los grupos quedan aislados
- Streaming y fragmentación para respuestas largas

**Autenticación y proveedores:**

- Más de 35 proveedores de modelos (Anthropic, OpenAI, Google y más)
- Autenticación de suscripción mediante OAuth (p. ej., OpenAI Codex)
- Compatibilidad con proveedores personalizados y autohospedados (vLLM, SGLang, Ollama, llama.cpp, LM Studio y
  cualquier endpoint compatible con OpenAI o Anthropic)

**Multimedia:**

- Imágenes, audio, video y documentos de entrada y salida
- Superficies de capacidad compartidas para generación de imágenes y generación de video
- Transcripción de notas de voz
- Texto a voz con varios proveedores

**Aplicaciones e interfaces:**

- WebChat e interfaz de control en el navegador
- Aplicación complementaria para la barra de menús de macOS
- Nodo iOS con emparejamiento, Canvas, cámara, grabación de pantalla, ubicación y voz
- Nodo Android con emparejamiento, chat, voz, Canvas, cámara y comandos del dispositivo

**Herramientas y automatización:**

- Automatización del navegador, exec y sandboxing
- Búsqueda web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tareas Cron y programación de Heartbeat
- Skills, plugins y pipelines de flujo de trabajo (Lobster)

## Relacionado

<CardGroup cols={2}>
  <Card title="Funciones experimentales" href="/es/concepts/experimental-features" icon="flask">
    Funciones opcionales que aún no se han enviado a la superficie predeterminada.
  </Card>
  <Card title="Runtime de agente" href="/es/concepts/agent" icon="robot">
    Modelo de runtime del agente y cómo se despachan las ejecuciones.
  </Card>
  <Card title="Canales" href="/es/channels" icon="message-square">
    Conecta Telegram, WhatsApp, Discord, Slack y más desde un Gateway.
  </Card>
  <Card title="Plugins" href="/es/tools/plugin" icon="plug">
    Plugins oficiales y externos que amplían OpenClaw.
  </Card>
</CardGroup>
