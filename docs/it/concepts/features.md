---
read_when:
    - Vuoi un elenco completo di ciò che OpenClaw supporta
summary: Capacità di OpenClaw per canali, routing, media e UX.
title: Funzionalità
x-i18n:
    generated_at: "2026-05-10T19:30:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
    source_path: concepts/features.md
    workflow: 16
---

## Punti salienti

<Columns>
  <Card title="Canali" icon="message-square" href="/it/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e altro ancora con un unico Gateway.
  </Card>
  <Card title="Plugin" icon="plug" href="/it/tools/plugin">
    I plugin inclusi aggiungono Matrix, Nextcloud Talk, Nostr, Twitch, Zalo e altro ancora senza installazioni separate nelle normali release correnti.
  </Card>
  <Card title="Routing" icon="route" href="/it/concepts/multi-agent">
    Routing multi-agente con sessioni isolate.
  </Card>
  <Card title="Media" icon="image" href="/it/nodes/images">
    Immagini, audio, video, documenti e generazione di immagini/video.
  </Card>
  <Card title="App e UI" icon="monitor" href="/it/web/control-ui">
    UI di controllo web e app companion per macOS.
  </Card>
  <Card title="Nodi mobili" icon="smartphone" href="/it/nodes">
    Nodi iOS e Android con associazione, voce/chat e comandi dispositivo avanzati.
  </Card>
</Columns>

## Elenco completo

**Canali:**

- I canali integrati includono Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat e WhatsApp
- I canali Plugin inclusi comprendono Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo e Zalo Personal
- I Plugin di canale opzionali installati separatamente includono Voice Call e pacchetti di terze parti come WeChat
- I Plugin di canale di terze parti possono estendere ulteriormente il Gateway, come WeChat
- Supporto per chat di gruppo con attivazione basata su menzioni
- Sicurezza dei DM con allowlist e associazione

**Agente:**

- Runtime agente integrato con streaming degli strumenti
- Routing multi-agente con sessioni isolate per workspace o mittente
- Sessioni: le chat dirette confluiscono in `main` condivisa; i gruppi sono isolati
- Streaming e suddivisione in blocchi per risposte lunghe

**Autenticazione e provider:**

- Oltre 35 provider di modelli (Anthropic, OpenAI, Google e altri)
- Autenticazione tramite abbonamento via OAuth (ad es. OpenAI Codex)
- Supporto per provider personalizzati e self-hosted (vLLM, SGLang, Ollama e qualsiasi endpoint compatibile con OpenAI o compatibile con Anthropic)

**Media:**

- Immagini, audio, video e documenti in ingresso e in uscita
- Superfici di capacità condivise per generazione di immagini e generazione di video
- Trascrizione delle note vocali
- Sintesi vocale con più provider

**App e interfacce:**

- WebChat e UI di controllo nel browser
- App companion per la barra dei menu di macOS
- Nodo iOS con associazione, Canvas, fotocamera, registrazione dello schermo, posizione e voce
- Nodo Android con associazione, chat, voce, Canvas, fotocamera e comandi dispositivo

**Strumenti e automazione:**

- Automazione del browser, exec, sandboxing
- Ricerca web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Job Cron e pianificazione Heartbeat
- Skills, Plugin e pipeline di workflow (Lobster)

## Correlati

<CardGroup cols={2}>
  <Card title="Funzionalità sperimentali" href="/it/concepts/experimental-features" icon="flask">
    Funzionalità opt-in che non sono ancora state distribuite alla superficie predefinita.
  </Card>
  <Card title="Runtime agente" href="/it/concepts/agent" icon="robot">
    Modello di runtime agente e modalità di distribuzione delle esecuzioni.
  </Card>
  <Card title="Canali" href="/it/channels" icon="message-square">
    Connetti Telegram, WhatsApp, Discord, Slack e altro ancora da un unico Gateway.
  </Card>
  <Card title="Plugin" href="/it/tools/plugin" icon="plug">
    Plugin inclusi e di terze parti che estendono OpenClaw.
  </Card>
</CardGroup>
