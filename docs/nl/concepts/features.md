---
read_when:
    - Je wilt een volledige lijst van wat OpenClaw ondersteunt
summary: OpenClaw-mogelijkheden op het gebied van kanalen, routering, media en gebruikerservaring.
title: Functies
x-i18n:
    generated_at: "2026-04-29T22:37:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
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
    Multi-agent-routering met geïsoleerde sessies.
  </Card>
  <Card title="Media" icon="image" href="/nl/nodes/images">
    Afbeeldingen, audio, video, documenten en afbeelding-/videogeneratie.
  </Card>
  <Card title="Apps en UI" icon="monitor" href="/nl/web/control-ui">
    Web Control UI en macOS-begeleidende app.
  </Card>
  <Card title="Mobiele nodes" icon="smartphone" href="/nl/nodes">
    iOS- en Android-nodes met koppeling, spraak/chat en rijke apparaatopdrachten.
  </Card>
</Columns>

## Volledige lijst

**Kanalen:**

- Ingebouwde kanalen omvatten Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat en WhatsApp
- Meegeleverde pluginkanalen omvatten BlueBubbles voor iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo en Zalo Personal
- Optioneel afzonderlijk geïnstalleerde kanaalplugins omvatten Voice Call en pakketten van derden zoals WeChat
- Kanaalplugins van derden kunnen de Gateway verder uitbreiden, zoals WeChat
- Ondersteuning voor groepschats met activering op basis van vermeldingen
- DM-veiligheid met toelatingslijsten en koppeling

**Agent:**

- Ingebedde agentruntime met toolstreaming
- Multi-agent-routering met geïsoleerde sessies per werkruimte of afzender
- Sessies: directe chats worden samengevoegd in gedeeld `main`; groepen zijn geïsoleerd
- Streaming en chunking voor lange antwoorden

**Auth en providers:**

- 35+ modelproviders (Anthropic, OpenAI, Google en meer)
- Abonnementsauth via OAuth (bijv. OpenAI Codex)
- Ondersteuning voor aangepaste en self-hosted providers (vLLM, SGLang, Ollama en elk OpenAI-compatibel of Anthropic-compatibel endpoint)

**Media:**

- Afbeeldingen, audio, video en documenten in en uit
- Gedeelde capaciteitsoppervlakken voor afbeeldinggeneratie en videogeneratie
- Transcriptie van spraaknotities
- Tekst-naar-spraak met meerdere providers

**Apps en interfaces:**

- WebChat en browser-Control UI
- macOS-menubalkapp
- iOS-node met koppeling, Canvas, camera, schermopname, locatie en spraak
- Android-node met koppeling, chat, spraak, Canvas, camera en apparaatopdrachten

**Tools en automatisering:**

- Browserautomatisering, exec, sandboxing
- Webzoekfunctie (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-taken en heartbeat-planning
- Skills, plugins en workflowpijplijnen (Lobster)

## Gerelateerd

- [Experimentele functies](/nl/concepts/experimental-features)
- [Agentruntime](/nl/concepts/agent)
