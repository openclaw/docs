---
read_when:
    - U wilt een volledige lijst van wat OpenClaw ondersteunt
summary: OpenClaw-mogelijkheden voor kanalen, routering, media en gebruikerservaring.
title: Functies
x-i18n:
    generated_at: "2026-07-12T08:46:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## Hoogtepunten

<Columns>
  <Card title="Kanalen" icon="message-square" href="/nl/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat en meer via één Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/nl/tools/plugin">
    Officiële plugins voegen Matrix, Nextcloud Talk, Nostr, Twitch, Zalo en tientallen andere toe met één installatieopdracht.
  </Card>
  <Card title="Routering" icon="route" href="/nl/concepts/multi-agent">
    Routering voor meerdere agents met geïsoleerde sessies.
  </Card>
  <Card title="Media" icon="image" href="/nl/nodes/images">
    Afbeeldingen, audio, video, documenten en het genereren van afbeeldingen en video's.
  </Card>
  <Card title="Apps en gebruikersinterface" icon="monitor" href="/nl/platforms">
    Windows Hub, browsergebaseerde Control UI, macOS-menubalkapp en mobiele nodes.
  </Card>
  <Card title="Mobiele nodes" icon="smartphone" href="/nl/nodes">
    iOS- en Android-nodes met koppeling, spraak/chat en uitgebreide apparaatopdrachten.
  </Card>
</Columns>

## Volledige lijst

**Kanalen:**

- iMessage, Telegram en WebChat worden meegeleverd met de kerninstallatie; elk ander kanaal is een
  officiële plugin die wordt geïnstalleerd met `openclaw plugins install @openclaw/<id>` (of op aanvraag
  tijdens `openclaw onboard` / `openclaw channels add`)
- Officiële pluginkanalen: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo en Zalo Personal
- Externe pluginkanalen die buiten de OpenClaw-repository worden onderhouden: WeChat, Yuanbao en Zalo ClawBot
- Ondersteuning voor groepschats met activering op basis van vermeldingen
- Beveiliging van privéberichten met toelatingslijsten en koppeling

**Agent:**

- Ingebouwde agentruntime met streaming van tools
- Routering voor meerdere agents met geïsoleerde sessies per werkruimte of afzender
- Sessies: rechtstreekse chats worden samengevoegd in de gedeelde `main`; groepen zijn geïsoleerd
- Streaming en opdelen in delen voor lange antwoorden

**Authenticatie en providers:**

- Meer dan 35 modelproviders (Anthropic, OpenAI, Google en meer)
- Abonnementsauthenticatie via OAuth (bijvoorbeeld OpenAI Codex)
- Ondersteuning voor aangepaste en zelfgehoste providers (vLLM, SGLang, Ollama, llama.cpp, LM Studio en
  elk OpenAI-compatibel of Anthropic-compatibel eindpunt)

**Media:**

- Invoer en uitvoer van afbeeldingen, audio, video en documenten
- Gedeelde mogelijkheden voor het genereren van afbeeldingen en video's
- Transcriptie van spraakberichten
- Tekst-naar-spraak met meerdere providers

**Apps en interfaces:**

- WebChat en browsergebaseerde Control UI
- Bijbehorende macOS-menubalkapp
- iOS-node met koppeling, Canvas, camera, schermopname, locatie en spraak
- Android-node met koppeling, chat, spraak, Canvas, camera en apparaatopdrachten

**Tools en automatisering:**

- Browserautomatisering, uitvoering en sandboxing
- Zoeken op het web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-taken en Heartbeat-planning
- Skills, plugins en workflowpijplijnen (Lobster)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Experimentele functies" href="/nl/concepts/experimental-features" icon="flask">
    Functies waarvoor u zich kunt aanmelden en die nog niet in de standaardomgeving zijn uitgebracht.
  </Card>
  <Card title="Agentruntime" href="/nl/concepts/agent" icon="robot">
    Het agentruntimemodel en hoe uitvoeringen worden toegewezen.
  </Card>
  <Card title="Kanalen" href="/nl/channels" icon="message-square">
    Verbind Telegram, WhatsApp, Discord, Slack en meer via één Gateway.
  </Card>
  <Card title="Plugins" href="/nl/tools/plugin" icon="plug">
    Officiële en externe plugins die OpenClaw uitbreiden.
  </Card>
</CardGroup>
