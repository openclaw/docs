---
read_when:
    - Sie möchten eine vollständige Liste dessen, was OpenClaw unterstützt
summary: OpenClaw-Funktionen über Kanäle, Routing, Medien und UX hinweg.
title: Funktionen
x-i18n:
    generated_at: "2026-06-27T17:23:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

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
    Bilder, Audio, Video, Dokumente sowie Bild- und Videogenerierung.
  </Card>
  <Card title="Apps und UI" icon="monitor" href="/de/platforms">
    Windows Hub, Web Control UI, macOS-App und mobile Nodes.
  </Card>
  <Card title="Mobile Nodes" icon="smartphone" href="/de/nodes">
    iOS- und Android-Nodes mit Pairing, Sprache/Chat und umfangreichen Gerätebefehlen.
  </Card>
</Columns>

## Vollständige Liste

**Channels:**

- Integrierte Channels umfassen Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat und WhatsApp
- Gebündelte Plugin-Channels umfassen Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo und Zalo Personal
- Optional separat installierte Channel-Plugins umfassen Voice Call und Drittanbieterpakete wie WeChat
- Drittanbieter-Channel-Plugins können den Gateway weiter erweitern, etwa WeChat
- Unterstützung für Gruppenchats mit erwähnungsbasierter Aktivierung
- DM-Sicherheit mit Allowlists und Pairing

**Agent:**

- Eingebettete Agent-Laufzeit mit Tool-Streaming
- Multi-Agent-Routing mit isolierten Sitzungen pro Arbeitsbereich oder Absender
- Sitzungen: Direkte Chats werden in gemeinsamem `main` zusammengeführt; Gruppen sind isoliert
- Streaming und Chunking für lange Antworten

**Authentifizierung und Provider:**

- Über 35 Modell-Provider (Anthropic, OpenAI, Google und mehr)
- Abonnement-Authentifizierung über OAuth (z. B. OpenAI Codex)
- Unterstützung für benutzerdefinierte und selbst gehostete Provider (vLLM, SGLang, Ollama und jeder OpenAI-kompatible oder Anthropic-kompatible Endpunkt)

**Medien:**

- Bilder, Audio, Video und Dokumente als Ein- und Ausgabe
- Gemeinsame Capability-Oberflächen für Bildgenerierung und Videogenerierung
- Transkription von Sprachnotizen
- Text-to-Speech mit mehreren Providern

**Apps und Schnittstellen:**

- WebChat und Browser-Control-UI
- macOS-Menüleisten-Begleit-App
- iOS-Node mit Pairing, Canvas, Kamera, Bildschirmaufnahme, Standort und Sprache
- Android-Node mit Pairing, Chat, Sprache, Canvas, Kamera und Gerätebefehlen

**Tools und Automatisierung:**

- Browserautomatisierung, exec, Sandboxing
- Websuche (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-Jobs und Heartbeat-Planung
- Skills, Plugins und Workflow-Pipelines (Lobster)

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Experimentelle Features" href="/de/concepts/experimental-features" icon="flask">
    Opt-in-Features, die noch nicht auf der Standardoberfläche ausgeliefert wurden.
  </Card>
  <Card title="Agent-Laufzeit" href="/de/concepts/agent" icon="robot">
    Agent-Laufzeitmodell und wie Läufe verteilt werden.
  </Card>
  <Card title="Channels" href="/de/channels" icon="message-square">
    Verbinden Sie Telegram, WhatsApp, Discord, Slack und mehr über einen Gateway.
  </Card>
  <Card title="Plugins" href="/de/tools/plugin" icon="plug">
    Gebündelte und Drittanbieter-Plugins, die OpenClaw erweitern.
  </Card>
</CardGroup>
