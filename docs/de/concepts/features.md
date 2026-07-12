---
read_when:
    - Sie möchten eine vollständige Liste der von OpenClaw unterstützten Funktionen.
summary: OpenClaw-Funktionen für Kanäle, Routing, Medien und UX.
title: Funktionen
x-i18n:
    generated_at: "2026-07-12T15:11:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## Highlights

<Columns>
  <Card title="Kanäle" icon="message-square" href="/de/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat und weitere über einen einzigen Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/de/tools/plugin">
    Offizielle Plugins fügen Matrix, Nextcloud Talk, Nostr, Twitch, Zalo und Dutzende weitere mit einem einzigen Installationsbefehl hinzu.
  </Card>
  <Card title="Routing" icon="route" href="/de/concepts/multi-agent">
    Multi-Agent-Routing mit isolierten Sitzungen.
  </Card>
  <Card title="Medien" icon="image" href="/de/nodes/images">
    Bilder, Audio, Video, Dokumente sowie Bild- und Videogenerierung.
  </Card>
  <Card title="Apps und Benutzeroberfläche" icon="monitor" href="/de/platforms">
    Windows Hub, browserbasierte Control UI, macOS-Menüleisten-App und mobile Nodes.
  </Card>
  <Card title="Mobile Nodes" icon="smartphone" href="/de/nodes">
    iOS- und Android-Nodes mit Kopplung, Sprach-/Chatfunktionen und umfangreichen Gerätebefehlen.
  </Card>
</Columns>

## Vollständige Liste

**Kanäle:**

- iMessage, Telegram und WebChat sind in der Kerninstallation enthalten; jeder andere Kanal ist ein
  offizielles Plugin, das mit `openclaw plugins install @openclaw/<id>` installiert wird (oder bei Bedarf
  während `openclaw onboard` / `openclaw channels add`)
- Offizielle Plugin-Kanäle: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo und Zalo Personal
- Außerhalb des OpenClaw-Repos gepflegte externe Plugin-Kanäle: WeChat, Yuanbao und Zalo ClawBot
- Unterstützung für Gruppenchats mit erwähnungsbasierter Aktivierung
- Sicherheit für Direktnachrichten durch Zulassungslisten und Kopplung

**Agent:**

- Eingebettete Agent-Laufzeit mit Tool-Streaming
- Multi-Agent-Routing mit isolierten Sitzungen pro Arbeitsbereich oder Absender
- Sitzungen: Direkte Chats werden in der gemeinsamen Sitzung `main` zusammengeführt; Gruppen sind isoliert
- Streaming und Aufteilung langer Antworten

**Authentifizierung und Provider:**

- Über 35 Modell-Provider (Anthropic, OpenAI, Google und weitere)
- Abonnementauthentifizierung über OAuth (z. B. OpenAI Codex)
- Unterstützung für benutzerdefinierte und selbst gehostete Provider (vLLM, SGLang, Ollama, llama.cpp, LM Studio und
  alle OpenAI- oder Anthropic-kompatiblen Endpunkte)

**Medien:**

- Ein- und Ausgabe von Bildern, Audio, Video und Dokumenten
- Gemeinsame Funktionsoberflächen für Bild- und Videogenerierung
- Transkription von Sprachnachrichten
- Text-to-Speech mit mehreren Providern

**Apps und Benutzeroberflächen:**

- WebChat und browserbasierte Control UI
- macOS-Begleit-App für die Menüleiste
- iOS-Node mit Kopplung, Canvas, Kamera, Bildschirmaufnahme, Standort und Sprache
- Android-Node mit Kopplung, Chat, Sprache, Canvas, Kamera und Gerätebefehlen

**Tools und Automatisierung:**

- Browserautomatisierung, Ausführung und Sandboxing
- Websuche (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-Aufgaben und Heartbeat-Zeitplanung
- Skills, Plugins und Workflow-Pipelines (Lobster)

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Experimentelle Funktionen" href="/de/concepts/experimental-features" icon="flask">
    Optional aktivierbare Funktionen, die noch nicht in der Standardoberfläche verfügbar sind.
  </Card>
  <Card title="Agent-Laufzeit" href="/de/concepts/agent" icon="robot">
    Laufzeitmodell des Agents und die Zuweisung von Ausführungen.
  </Card>
  <Card title="Kanäle" href="/de/channels" icon="message-square">
    Verbinden Sie Telegram, WhatsApp, Discord, Slack und weitere über einen einzigen Gateway.
  </Card>
  <Card title="Plugins" href="/de/tools/plugin" icon="plug">
    Offizielle und externe Plugins, die OpenClaw erweitern.
  </Card>
</CardGroup>
