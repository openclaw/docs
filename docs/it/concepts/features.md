---
read_when:
    - Vuoi un elenco completo di ciò che OpenClaw supporta
summary: Funzionalità di OpenClaw tra canali, routing, media e UX.
title: Funzionalità
x-i18n:
    generated_at: "2026-06-27T17:24:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## In evidenza

<Columns>
  <Card title="Canali" icon="message-square" href="/it/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e altro con un unico Gateway.
  </Card>
  <Card title="Plugin" icon="plug" href="/it/tools/plugin">
    I plugin inclusi aggiungono Matrix, Nextcloud Talk, Nostr, Twitch, Zalo e altro senza installazioni separate nelle normali versioni correnti.
  </Card>
  <Card title="Routing" icon="route" href="/it/concepts/multi-agent">
    Routing multi-agent con sessioni isolate.
  </Card>
  <Card title="Media" icon="image" href="/it/nodes/images">
    Immagini, audio, video, documenti e generazione di immagini/video.
  </Card>
  <Card title="App e UI" icon="monitor" href="/it/platforms">
    Windows Hub, Web Control UI, app macOS e nodi mobili.
  </Card>
  <Card title="Nodi mobili" icon="smartphone" href="/it/nodes">
    Nodi iOS e Android con abbinamento, voce/chat e comandi dispositivo avanzati.
  </Card>
</Columns>

## Elenco completo

**Canali:**

- I canali integrati includono Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat e WhatsApp
- I canali plugin inclusi includono Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo e Zalo Personal
- I plugin di canale facoltativi installati separatamente includono Voice Call e pacchetti di terze parti come WeChat
- I plugin di canale di terze parti possono estendere ulteriormente il Gateway, ad esempio WeChat
- Supporto per chat di gruppo con attivazione basata su menzioni
- Sicurezza dei DM con elenchi di autorizzazione e abbinamento

**Agente:**

- Runtime agente incorporato con streaming degli strumenti
- Routing multi-agent con sessioni isolate per area di lavoro o mittente
- Sessioni: le chat dirette confluiscono in `main` condiviso; i gruppi sono isolati
- Streaming e suddivisione in blocchi per risposte lunghe

**Autenticazione e provider:**

- Oltre 35 provider di modelli (Anthropic, OpenAI, Google e altri)
- Autenticazione tramite abbonamento via OAuth (ad es. OpenAI Codex)
- Supporto per provider personalizzati e self-hosted (vLLM, SGLang, Ollama e qualsiasi endpoint compatibile con OpenAI o Anthropic)

**Media:**

- Immagini, audio, video e documenti in ingresso e in uscita
- Superfici di capability condivise per generazione di immagini e generazione video
- Trascrizione delle note vocali
- Sintesi vocale con più provider

**App e interfacce:**

- WebChat e Control UI nel browser
- App companion per la barra dei menu di macOS
- Nodo iOS con abbinamento, Canvas, fotocamera, registrazione dello schermo, posizione e voce
- Nodo Android con abbinamento, chat, voce, Canvas, fotocamera e comandi dispositivo

**Strumenti e automazione:**

- Automazione del browser, exec, sandboxing
- Ricerca web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Job Cron e pianificazione Heartbeat
- Skills, plugin e pipeline di workflow (Lobster)

## Correlati

<CardGroup cols={2}>
  <Card title="Funzionalità sperimentali" href="/it/concepts/experimental-features" icon="flask">
    Funzionalità opt-in che non sono ancora state distribuite sulla superficie predefinita.
  </Card>
  <Card title="Runtime agente" href="/it/concepts/agent" icon="robot">
    Modello del runtime agente e modalità di dispatch delle esecuzioni.
  </Card>
  <Card title="Canali" href="/it/channels" icon="message-square">
    Connetti Telegram, WhatsApp, Discord, Slack e altro da un unico Gateway.
  </Card>
  <Card title="Plugin" href="/it/tools/plugin" icon="plug">
    Plugin inclusi e di terze parti che estendono OpenClaw.
  </Card>
</CardGroup>
