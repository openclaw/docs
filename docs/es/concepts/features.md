---
read_when:
    - Quieres una lista completa de lo que admite OpenClaw
summary: Capacidades de OpenClaw en todos los canales, enrutamiento, contenido multimedia y experiencia de usuario.
title: Funciones
x-i18n:
    generated_at: "2026-04-24T05:25:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## Aspectos destacados

<Columns>
  <Card title="Canales" icon="message-square" href="/es/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat y más con un único Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/es/tools/plugin">
    Los Plugins incluidos agregan Matrix, Nextcloud Talk, Nostr, Twitch, Zalo y más sin instalaciones separadas en las versiones actuales normales.
  </Card>
  <Card title="Enrutamiento" icon="route" href="/es/concepts/multi-agent">
    Enrutamiento de múltiples agentes con sesiones aisladas.
  </Card>
  <Card title="Contenido multimedia" icon="image" href="/es/nodes/images">
    Imágenes, audio, video, documentos y generación de imágenes/video.
  </Card>
  <Card title="Apps y UI" icon="monitor" href="/es/web/control-ui">
    UI de Control web y app complementaria para macOS.
  </Card>
  <Card title="Nodos móviles" icon="smartphone" href="/es/nodes">
    Nodos de iOS y Android con emparejamiento, voz/chat y comandos avanzados del dispositivo.
  </Card>
</Columns>

## Lista completa

**Canales:**

- Los canales integrados incluyen Discord, Google Chat, iMessage (heredado), IRC, Signal, Slack, Telegram, WebChat y WhatsApp
- Los canales de Plugin incluidos incluyen BlueBubbles para iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo y Zalo Personal
- Los Plugins de canal opcionales instalados por separado incluyen Voice Call y paquetes de terceros como WeChat
- Los Plugins de canal de terceros pueden ampliar aún más Gateway, como WeChat
- Compatibilidad con chat grupal con activación basada en menciones
- Seguridad en DM con listas permitidas y emparejamiento

**Agente:**

- Tiempo de ejecución de agente integrado con transmisión de herramientas
- Enrutamiento de múltiples agentes con sesiones aisladas por espacio de trabajo o remitente
- Sesiones: los chats directos se agrupan en `main`; los grupos están aislados
- Transmisión y fragmentación para respuestas largas

**Autenticación y proveedores:**

- Más de 35 proveedores de modelos (Anthropic, OpenAI, Google y más)
- Autenticación de suscripción mediante OAuth (por ejemplo, OpenAI Codex)
- Compatibilidad con proveedores personalizados y autoalojados (vLLM, SGLang, Ollama y cualquier endpoint compatible con OpenAI o Anthropic)

**Contenido multimedia:**

- Imágenes, audio, video y documentos de entrada y salida
- Superficies de capacidades compartidas para generación de imágenes y generación de video
- Transcripción de notas de voz
- Texto a voz con varios proveedores

**Apps e interfaces:**

- WebChat y UI de Control en el navegador
- App complementaria de barra de menús para macOS
- Nodo de iOS con emparejamiento, Canvas, cámara, grabación de pantalla, ubicación y voz
- Nodo de Android con emparejamiento, chat, voz, Canvas, cámara y comandos del dispositivo

**Herramientas y automatización:**

- Automatización de navegador, exec, sandboxing
- Búsqueda web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Trabajos Cron y programación de Heartbeat
- Skills, Plugins y canalizaciones de flujo de trabajo (Lobster)

## Relacionado

- [Funciones experimentales](/es/concepts/experimental-features)
- [Tiempo de ejecución del agente](/es/concepts/agent)
