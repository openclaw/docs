---
read_when:
    - Je wilt een volledige lijst van wat OpenClaw ondersteunt
summary: OpenClaw-mogelijkheden voor kanalen, routering, media en UX.
title: Functies
x-i18n:
    generated_at: "2026-05-07T01:51:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f95185073e52f4b5b34042ea27927984bf0b040d20eb61b135514816fddc214
    source_path: concepts/features.md
    workflow: 16
---

## Hoogtepunten

<Columns>
  <Card title="Channels" icon="message-square" href="/nl/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat en meer met één Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/nl/tools/plugin">
    Meegeleverde plugins voegen Matrix, Nextcloud Talk, Nostr, Twitch, Zalo en meer toe zonder afzonderlijke installaties in normale huidige releases.
  </Card>
  <Card title="Routing" icon="route" href="/nl/concepts/multi-agent">
    Multi-agent-routering met geïsoleerde sessies.
  </Card>
  <Card title="Media" icon="image" href="/nl/nodes/images">
    Afbeeldingen, audio, video, documenten en afbeelding-/videogeneratie.
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/nl/web/control-ui">
    Web Control UI en macOS-begeleidende app.
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/nl/nodes">
    iOS- en Android-nodes met koppeling, spraak/chat en uitgebreide apparaatopdrachten.
  </Card>
</Columns>

## Volledige lijst

**Kanalen:**

- Ingebouwde kanalen omvatten Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat en WhatsApp
- Meegeleverde Plugin-kanalen omvatten BlueBubbles als verouderde iMessage-bridge, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo en Zalo Personal
- Optionele afzonderlijk geïnstalleerde kanaalplugins omvatten Voice Call en pakketten van derden zoals WeChat
- Kanaalplugins van derden kunnen de Gateway verder uitbreiden, zoals WeChat
- Ondersteuning voor groepschats met activering op basis van vermeldingen
- DM-veiligheid met toelatingslijsten en koppeling

**Agent:**

- Ingebouwde agentruntime met toolstreaming
- Multi-agent-routering met geïsoleerde sessies per werkruimte of afzender
- Sessies: directe chats worden samengevoegd in gedeelde `main`; groepen zijn geïsoleerd
- Streaming en opdelen in chunks voor lange reacties

**Authenticatie en providers:**

- 35+ modelproviders (Anthropic, OpenAI, Google en meer)
- Abonnementsauthenticatie via OAuth (bijv. OpenAI Codex)
- Ondersteuning voor aangepaste en zelfgehoste providers (vLLM, SGLang, Ollama en elk OpenAI-compatibel of Anthropic-compatibel endpoint)

**Media:**

- Afbeeldingen, audio, video en documenten in en uit
- Gedeelde oppervlaktes voor mogelijkheden voor afbeeldingsgeneratie en videogeneratie
- Transcriptie van spraakberichten
- Tekst-naar-spraak met meerdere providers

**Apps en interfaces:**

- WebChat en browser Control UI
- macOS-menubalk-begeleidende app
- iOS-node met koppeling, Canvas, camera, schermopname, locatie en spraak
- Android-node met koppeling, chat, spraak, Canvas, camera en apparaatopdrachten

**Tools en automatisering:**

- Browserautomatisering, exec, sandboxing
- Webzoekopdracht (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-taken en Heartbeat-planning
- Skills, plugins en workflowpijplijnen (Lobster)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Experimental features" href="/nl/concepts/experimental-features" icon="flask">
    Opt-in-functies die nog niet naar het standaardoppervlak zijn uitgebracht.
  </Card>
  <Card title="Agent runtime" href="/nl/concepts/agent" icon="robot">
    Agentruntime-model en hoe runs worden verzonden.
  </Card>
  <Card title="Channels" href="/nl/channels" icon="message-square">
    Verbind Telegram, WhatsApp, Discord, Slack en meer vanuit één Gateway.
  </Card>
  <Card title="Plugins" href="/nl/tools/plugin" icon="plug">
    Meegeleverde plugins en plugins van derden die OpenClaw uitbreiden.
  </Card>
</CardGroup>
