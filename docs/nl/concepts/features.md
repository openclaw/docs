---
read_when:
    - Je wilt een volledige lijst van wat OpenClaw ondersteunt
summary: OpenClaw-mogelijkheden voor kanalen, routering, media en UX.
title: Functies
x-i18n:
    generated_at: "2026-05-06T09:07:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## Hoogtepunten

<Columns>
  <Card title="Kanalen" icon="message-square" href="/nl/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat en meer met één Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/nl/tools/plugin">
    Meegeleverde plugins voegen Matrix, Nextcloud Talk, Nostr, Twitch, Zalo en meer toe zonder afzonderlijke installaties in normale huidige releases.
  </Card>
  <Card title="Routering" icon="route" href="/nl/concepts/multi-agent">
    Routering voor meerdere agents met geïsoleerde sessies.
  </Card>
  <Card title="Media" icon="image" href="/nl/nodes/images">
    Afbeeldingen, audio, video, documenten en afbeelding-/videogeneratie.
  </Card>
  <Card title="Apps en UI" icon="monitor" href="/nl/web/control-ui">
    Web Control UI en macOS-begeleidende app.
  </Card>
  <Card title="Mobiele nodes" icon="smartphone" href="/nl/nodes">
    iOS- en Android-nodes met koppeling, spraak/chat en uitgebreide apparaatopdrachten.
  </Card>
</Columns>

## Volledige lijst

**Kanalen:**

- Ingebouwde kanalen omvatten Discord, Google Chat, iMessage (verouderd), IRC, Signal, Slack, Telegram, WebChat en WhatsApp
- Meegeleverde plugin-kanalen omvatten BlueBubbles voor iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo en Zalo Personal
- Optionele, afzonderlijk geïnstalleerde kanaalplugins omvatten Voice Call en pakketten van derden, zoals WeChat
- Kanaalplugins van derden kunnen de Gateway verder uitbreiden, zoals WeChat
- Ondersteuning voor groepschats met activatie op basis van vermeldingen
- DM-veiligheid met allowlists en koppeling

**Agent:**

- Ingebouwde agent-runtime met tool-streaming
- Routering voor meerdere agents met geïsoleerde sessies per werkruimte of afzender
- Sessies: directe chats worden samengevoegd in gedeelde `main`; groepen zijn geïsoleerd
- Streaming en opdelen in chunks voor lange antwoorden

**Authenticatie en providers:**

- 35+ modelproviders (Anthropic, OpenAI, Google en meer)
- Abonnementsauthenticatie via OAuth (bijv. OpenAI Codex)
- Ondersteuning voor aangepaste en zelfgehoste providers (vLLM, SGLang, Ollama en elk OpenAI-compatibel of Anthropic-compatibel endpoint)

**Media:**

- Afbeeldingen, audio, video en documenten in en uit
- Gedeelde capability-oppervlakken voor afbeeldingsgeneratie en videogeneratie
- Transcriptie van spraaknotities
- Tekst-naar-spraak met meerdere providers

**Apps en interfaces:**

- WebChat en browser-Control UI
- macOS-menubalkapp als begeleidende app
- iOS-node met koppeling, Canvas, camera, schermopname, locatie en spraak
- Android-node met koppeling, chat, spraak, Canvas, camera en apparaatopdrachten

**Tools en automatisering:**

- Browserautomatisering, exec, sandboxing
- Zoeken op het web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-taken en Heartbeat-planning
- Skills, plugins en workflowpijplijnen (Lobster)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Experimentele functies" href="/nl/concepts/experimental-features" icon="flask">
    Opt-infuncties die nog niet naar het standaardoppervlak zijn verzonden.
  </Card>
  <Card title="Agent-runtime" href="/nl/concepts/agent" icon="robot">
    Agent-runtimemodel en hoe runs worden verzonden.
  </Card>
  <Card title="Kanalen" href="/nl/channels" icon="message-square">
    Verbind Telegram, WhatsApp, Discord, Slack en meer vanuit één Gateway.
  </Card>
  <Card title="Plugins" href="/nl/tools/plugin" icon="plug">
    Meegeleverde plugins en plugins van derden die OpenClaw uitbreiden.
  </Card>
</CardGroup>
