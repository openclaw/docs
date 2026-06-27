---
read_when:
    - Je wilt een volledige lijst van wat OpenClaw ondersteunt
summary: OpenClaw-mogelijkheden voor verschillende kanalen, routering, media en UX.
title: Functies
x-i18n:
    generated_at: "2026-06-27T17:26:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## Hoogtepunten

<Columns>
  <Card title="Kanalen" icon="message-square" href="/nl/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat en meer met één Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/nl/tools/plugin">
    Meegeleverde plugins voegen Matrix, Nextcloud Talk, Nostr, Twitch, Zalo en meer toe zonder aparte installaties in normale huidige releases.
  </Card>
  <Card title="Routering" icon="route" href="/nl/concepts/multi-agent">
    Multi-agentroutering met geïsoleerde sessies.
  </Card>
  <Card title="Media" icon="image" href="/nl/nodes/images">
    Afbeeldingen, audio, video, documenten en afbeelding-/videogeneratie.
  </Card>
  <Card title="Apps en UI" icon="monitor" href="/nl/platforms">
    Windows Hub, Web Control UI, macOS-app en mobiele nodes.
  </Card>
  <Card title="Mobiele nodes" icon="smartphone" href="/nl/nodes">
    iOS- en Android-nodes met koppeling, spraak/chat en rijke apparaatopdrachten.
  </Card>
</Columns>

## Volledige lijst

**Kanalen:**

- Ingebouwde kanalen omvatten Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat en WhatsApp
- Meegeleverde Plugin-kanalen omvatten Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo en Zalo Personal
- Optionele, afzonderlijk geïnstalleerde kanaalplugins omvatten Voice Call en pakketten van derden, zoals WeChat
- Kanaalplugins van derden kunnen de Gateway verder uitbreiden, zoals WeChat
- Ondersteuning voor groepschats met activering op basis van vermeldingen
- DM-veiligheid met allowlists en koppeling

**Agent:**

- Ingebouwde agentruntime met toolstreaming
- Multi-agentroutering met geïsoleerde sessies per werkruimte of afzender
- Sessies: directe chats worden samengevoegd in gedeelde `main`; groepen zijn geïsoleerd
- Streaming en chunking voor lange antwoorden

**Authenticatie en providers:**

- Meer dan 35 modelproviders (Anthropic, OpenAI, Google en meer)
- Abonnementsauthenticatie via OAuth (bijv. OpenAI Codex)
- Ondersteuning voor aangepaste en zelfgehoste providers (vLLM, SGLang, Ollama en elk OpenAI-compatibel of Anthropic-compatibel endpoint)

**Media:**

- Afbeeldingen, audio, video en documenten in en uit
- Gedeelde mogelijkheden voor afbeeldingsgeneratie en videogeneratie
- Transcriptie van spraaknotities
- Tekst-naar-spraak met meerdere providers

**Apps en interfaces:**

- WebChat en browser-Control UI
- Begeleidende macOS-menubalk-app
- iOS-node met koppeling, Canvas, camera, schermopname, locatie en spraak
- Android-node met koppeling, chat, spraak, Canvas, camera en apparaatopdrachten

**Tools en automatisering:**

- Browserautomatisering, exec, sandboxing
- Webzoekopdracht (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-taken en Heartbeat-planning
- Skills, plugins en workflowpijplijnen (Lobster)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Experimentele functies" href="/nl/concepts/experimental-features" icon="flask">
    Opt-infuncties die nog niet naar het standaardoppervlak zijn verzonden.
  </Card>
  <Card title="Agentruntime" href="/nl/concepts/agent" icon="robot">
    Agentruntimemodel en hoe runs worden verzonden.
  </Card>
  <Card title="Kanalen" href="/nl/channels" icon="message-square">
    Verbind Telegram, WhatsApp, Discord, Slack en meer vanuit één Gateway.
  </Card>
  <Card title="Plugins" href="/nl/tools/plugin" icon="plug">
    Meegeleverde plugins en plugins van derden die OpenClaw uitbreiden.
  </Card>
</CardGroup>
