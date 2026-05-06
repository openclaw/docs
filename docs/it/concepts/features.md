---
read_when:
    - Vuoi un elenco completo di tutto ciò che OpenClaw supporta
summary: Funzionalità di OpenClaw tra canali, instradamento, contenuti multimediali e UX.
title: Funzionalità
x-i18n:
    generated_at: "2026-05-06T08:45:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## In evidenza

<Columns>
  <Card title="Canali" icon="message-square" href="/it/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e altro ancora con un solo Gateway.
  </Card>
  <Card title="Plugin" icon="plug" href="/it/tools/plugin">
    I Plugin inclusi aggiungono Matrix, Nextcloud Talk, Nostr, Twitch, Zalo e altro ancora senza installazioni separate nelle normali release correnti.
  </Card>
  <Card title="Instradamento" icon="route" href="/it/concepts/multi-agent">
    Instradamento multi-agent con sessioni isolate.
  </Card>
  <Card title="Media" icon="image" href="/it/nodes/images">
    Immagini, audio, video, documenti e generazione di immagini/video.
  </Card>
  <Card title="App e UI" icon="monitor" href="/it/web/control-ui">
    UI di controllo web e app companion per macOS.
  </Card>
  <Card title="Nodi mobili" icon="smartphone" href="/it/nodes">
    Nodi iOS e Android con associazione, voce/chat e comandi avanzati per il dispositivo.
  </Card>
</Columns>

## Elenco completo

**Canali:**

- I canali integrati includono Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat e WhatsApp
- I canali Plugin inclusi includono BlueBubbles per iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo e Zalo Personal
- I Plugin di canale opzionali installati separatamente includono Voice Call e pacchetti di terze parti come WeChat
- I Plugin di canale di terze parti possono estendere ulteriormente il Gateway, come WeChat
- Supporto per chat di gruppo con attivazione basata su menzioni
- Sicurezza dei DM con allowlist e associazione

**Agente:**

- Runtime agente integrato con streaming degli strumenti
- Instradamento multi-agent con sessioni isolate per workspace o mittente
- Sessioni: le chat dirette confluiscono in `main` condiviso; i gruppi sono isolati
- Streaming e suddivisione in chunk per risposte lunghe

**Autenticazione e provider:**

- Oltre 35 provider di modelli (Anthropic, OpenAI, Google e altri)
- Autenticazione tramite abbonamento via OAuth (ad es. OpenAI Codex)
- Supporto per provider personalizzati e self-hosted (vLLM, SGLang, Ollama e qualsiasi endpoint compatibile con OpenAI o compatibile con Anthropic)

**Media:**

- Immagini, audio, video e documenti in ingresso e in uscita
- Superfici di capacità condivise per la generazione di immagini e video
- Trascrizione delle note vocali
- Sintesi vocale con più provider

**App e interfacce:**

- WebChat e UI di controllo nel browser
- App companion per la barra dei menu macOS
- Nodo iOS con associazione, Canvas, fotocamera, registrazione dello schermo, posizione e voce
- Nodo Android con associazione, chat, voce, Canvas, fotocamera e comandi del dispositivo

**Strumenti e automazione:**

- Automazione del browser, exec, sandboxing
- Ricerca web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Job Cron e pianificazione Heartbeat
- Skills, Plugin e pipeline di workflow (Lobster)

## Correlati

<CardGroup cols={2}>
  <Card title="Funzionalità sperimentali" href="/it/concepts/experimental-features" icon="flask">
    Funzionalità opt-in che non sono ancora state distribuite sulla superficie predefinita.
  </Card>
  <Card title="Runtime agente" href="/it/concepts/agent" icon="robot">
    Modello runtime agente e modalità di dispatch delle esecuzioni.
  </Card>
  <Card title="Canali" href="/it/channels" icon="message-square">
    Collega Telegram, WhatsApp, Discord, Slack e altro ancora da un solo Gateway.
  </Card>
  <Card title="Plugin" href="/it/tools/plugin" icon="plug">
    Plugin inclusi e di terze parti che estendono OpenClaw.
  </Card>
</CardGroup>
