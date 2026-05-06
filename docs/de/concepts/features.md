---
read_when:
    - Sie möchten eine vollständige Liste dessen, was OpenClaw unterstützt
summary: OpenClaw-Funktionen für Kanäle, Routing, Medien und UX.
title: Funktionen
x-i18n:
    generated_at: "2026-05-06T06:43:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## Highlights

<Columns>
  <Card title="Kanäle" icon="message-square" href="/de/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat und mehr mit einem einzigen Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/de/tools/plugin">
    Gebündelte Plugins fügen Matrix, Nextcloud Talk, Nostr, Twitch, Zalo und mehr hinzu, ohne separate Installationen in normalen aktuellen Releases.
  </Card>
  <Card title="Routing" icon="route" href="/de/concepts/multi-agent">
    Multi-Agent-Routing mit isolierten Sitzungen.
  </Card>
  <Card title="Medien" icon="image" href="/de/nodes/images">
    Bilder, Audio, Video, Dokumente sowie Bild-/Videogenerierung.
  </Card>
  <Card title="Apps und UI" icon="monitor" href="/de/web/control-ui">
    Web Control UI und macOS-Begleit-App.
  </Card>
  <Card title="Mobile Knoten" icon="smartphone" href="/de/nodes">
    iOS- und Android-Knoten mit Kopplung, Sprache/Chat und umfangreichen Gerätebefehlen.
  </Card>
</Columns>

## Vollständige Liste

**Kanäle:**

- Integrierte Kanäle umfassen Discord, Google Chat, iMessage (Legacy), IRC, Signal, Slack, Telegram, WebChat und WhatsApp
- Gebündelte Plugin-Kanäle umfassen BlueBubbles für iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo und Zalo Personal
- Optional separat installierte Kanal-Plugins umfassen Voice Call und Drittanbieterpakete wie WeChat
- Drittanbieter-Kanal-Plugins können den Gateway weiter erweitern, etwa mit WeChat
- Unterstützung für Gruppenchats mit erwähnungsbasierter Aktivierung
- DM-Sicherheit mit Allowlisten und Kopplung

**Agent:**

- Eingebettete Agent-Laufzeit mit Tool-Streaming
- Multi-Agent-Routing mit isolierten Sitzungen pro Workspace oder Absender
- Sitzungen: Direkte Chats werden in das gemeinsame `main` zusammengeführt; Gruppen sind isoliert
- Streaming und Chunking für lange Antworten

**Authentifizierung und Provider:**

- Über 35 Modell-Provider (Anthropic, OpenAI, Google und mehr)
- Abonnement-Authentifizierung über OAuth (z. B. OpenAI Codex)
- Unterstützung für benutzerdefinierte und selbst gehostete Provider (vLLM, SGLang, Ollama und jeder OpenAI-kompatible oder Anthropic-kompatible Endpunkt)

**Medien:**

- Bilder, Audio, Video und Dokumente ein- und ausgehend
- Gemeinsame Funktionsoberflächen für Bildgenerierung und Videogenerierung
- Transkription von Sprachnachrichten
- Text-to-Speech mit mehreren Providern

**Apps und Schnittstellen:**

- WebChat und browserbasierte Control UI
- macOS-Menüleisten-Begleit-App
- iOS-Knoten mit Kopplung, Canvas, Kamera, Bildschirmaufnahme, Standort und Sprache
- Android-Knoten mit Kopplung, Chat, Sprache, Canvas, Kamera und Gerätebefehlen

**Tools und Automatisierung:**

- Browserautomatisierung, Exec, Sandboxing
- Websuche (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-Jobs und Heartbeat-Planung
- Skills, Plugins und Workflow-Pipelines (Lobster)

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Experimentelle Funktionen" href="/de/concepts/experimental-features" icon="flask">
    Opt-in-Funktionen, die noch nicht für die Standardoberfläche ausgeliefert wurden.
  </Card>
  <Card title="Agent-Laufzeit" href="/de/concepts/agent" icon="robot">
    Agent-Laufzeitmodell und wie Runs verteilt werden.
  </Card>
  <Card title="Kanäle" href="/de/channels" icon="message-square">
    Verbinden Sie Telegram, WhatsApp, Discord, Slack und mehr über einen Gateway.
  </Card>
  <Card title="Plugins" href="/de/tools/plugin" icon="plug">
    Gebündelte und Drittanbieter-Plugins, die OpenClaw erweitern.
  </Card>
</CardGroup>
