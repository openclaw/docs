---
read_when:
    - Sie möchten eine vollständige Liste dessen, was OpenClaw unterstützt
summary: OpenClaw-Fähigkeiten über Kanäle, Routing, Medien und UX hinweg.
title: Funktionen
x-i18n:
    generated_at: "2026-05-10T19:30:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
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
  <Card title="Mobile Nodes" icon="smartphone" href="/de/nodes">
    iOS- und Android-Nodes mit Pairing, Sprache/Chat und umfangreichen Gerätebefehlen.
  </Card>
</Columns>

## Vollständige Liste

**Kanäle:**

- Integrierte Kanäle umfassen Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat und WhatsApp
- Gebündelte Plugin-Kanäle umfassen Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo und Zalo Personal
- Optional separat installierte Kanal-Plugins umfassen Voice Call und Drittanbieterpakete wie WeChat
- Drittanbieter-Kanal-Plugins können den Gateway weiter erweitern, zum Beispiel mit WeChat
- Gruppenchat-Unterstützung mit erwähnungsbasierter Aktivierung
- DM-Sicherheit mit Zulassungslisten und Pairing

**Agent:**

- Eingebettete Agent-Laufzeit mit Tool-Streaming
- Multi-Agent-Routing mit isolierten Sitzungen pro Arbeitsbereich oder Absender
- Sitzungen: Direktchats werden im gemeinsamen `main` zusammengeführt; Gruppen sind isoliert
- Streaming und Chunking für lange Antworten

**Authentifizierung und Provider:**

- Über 35 Modell-Provider (Anthropic, OpenAI, Google und mehr)
- Abonnement-Authentifizierung über OAuth (z. B. OpenAI Codex)
- Unterstützung für benutzerdefinierte und selbst gehostete Provider (vLLM, SGLang, Ollama und jeder OpenAI-kompatible oder Anthropic-kompatible Endpoint)

**Medien:**

- Bilder, Audio, Video und Dokumente ein- und ausgehend
- Gemeinsame Fähigkeitsoberflächen für Bildgenerierung und Videogenerierung
- Transkription von Sprachnachrichten
- Text-to-Speech mit mehreren Providern

**Apps und Schnittstellen:**

- WebChat und browserbasierte Control UI
- macOS-Menüleisten-Begleit-App
- iOS-Node mit Pairing, Canvas, Kamera, Bildschirmaufzeichnung, Standort und Sprache
- Android-Node mit Pairing, Chat, Sprache, Canvas, Kamera und Gerätebefehlen

**Tools und Automatisierung:**

- Browserautomatisierung, exec, Sandboxing
- Websuche (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-Jobs und Heartbeat-Planung
- Skills, Plugins und Workflow-Pipelines (Lobster)

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Experimentelle Features" href="/de/concepts/experimental-features" icon="flask">
    Opt-in-Features, die noch nicht in der Standardoberfläche ausgeliefert wurden.
  </Card>
  <Card title="Agent-Laufzeit" href="/de/concepts/agent" icon="robot">
    Agent-Laufzeitmodell und wie Ausführungen verteilt werden.
  </Card>
  <Card title="Kanäle" href="/de/channels" icon="message-square">
    Verbinden Sie Telegram, WhatsApp, Discord, Slack und mehr über einen Gateway.
  </Card>
  <Card title="Plugins" href="/de/tools/plugin" icon="plug">
    Gebündelte und Drittanbieter-Plugins, die OpenClaw erweitern.
  </Card>
</CardGroup>
