---
read_when:
    - Sie möchten eine vollständige Liste dessen, was OpenClaw unterstützt
summary: OpenClaw-Funktionen über Channels hinweg, Routing, Medien und UX.
title: Funktionen
x-i18n:
    generated_at: "2026-04-22T04:21:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# Funktionen

## Highlights

<Columns>
  <Card title="Channels" icon="message-square" href="/de/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat und mehr mit einem einzigen Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/de/tools/plugin">
    Gebündelte Plugins fügen Matrix, Nextcloud Talk, Nostr, Twitch, Zalo und mehr hinzu, ohne separate Installationen in normalen aktuellen Releases.
  </Card>
  <Card title="Routing" icon="route" href="/de/concepts/multi-agent">
    Multi-Agent-Routing mit isolierten Sitzungen.
  </Card>
  <Card title="Media" icon="image" href="/de/nodes/images">
    Bilder, Audio, Video, Dokumente sowie Bild-/Videogenerierung.
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/web/control-ui">
    Web-Control-UI und macOS-Begleit-App.
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/de/nodes">
    iOS- und Android-Nodes mit Pairing, Sprache/Chat und umfangreichen Gerätebefehlen.
  </Card>
</Columns>

## Vollständige Liste

**Channels:**

- Zu den integrierten Channels gehören Discord, Google Chat, iMessage (Legacy), IRC, Signal, Slack, Telegram, WebChat und WhatsApp
- Zu den gebündelten Plugin-Channels gehören BlueBubbles für iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo und Zalo Personal
- Optionale separat installierte Channel-Plugins umfassen Voice Call und Drittanbieter-Pakete wie WeChat
- Channel-Plugins von Drittanbietern können das Gateway weiter erweitern, etwa mit WeChat
- Unterstützung für Gruppenchats mit erwähnungsbasierter Aktivierung
- DM-Sicherheit mit Allowlists und Pairing

**Agent:**

- Eingebettete Agent-Runtime mit Tool-Streaming
- Multi-Agent-Routing mit isolierten Sitzungen pro Workspace oder Absender
- Sitzungen: direkte Chats werden in einem gemeinsamen `main` zusammengeführt; Gruppen sind isoliert
- Streaming und Chunking für lange Antworten

**Authentifizierung und Provider:**

- 35+ Modell-Provider (Anthropic, OpenAI, Google und mehr)
- Subscription-Authentifizierung über OAuth (z. B. OpenAI Codex)
- Unterstützung für benutzerdefinierte und selbst gehostete Provider (vLLM, SGLang, Ollama sowie jeder OpenAI-kompatible oder Anthropic-kompatible Endpunkt)

**Medien:**

- Bilder, Audio, Video und Dokumente eingehend und ausgehend
- Gemeinsame Funktionsoberflächen für Bildgenerierung und Videogenerierung
- Transkription von Sprachnotizen
- Text-to-Speech mit mehreren Providern

**Apps und Oberflächen:**

- WebChat und browserbasierte Control UI
- macOS-Menüleisten-Begleit-App
- iOS-Node mit Pairing, Canvas, Kamera, Bildschirmaufnahme, Standort und Sprache
- Android-Node mit Pairing, Chat, Sprache, Canvas, Kamera und Gerätebefehlen

**Tools und Automatisierung:**

- Browser-Automatisierung, Ausführung, Sandboxing
- Websuche (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-Jobs und Heartbeat-Planung
- Skills, Plugins und Workflow-Pipelines (Lobster)
