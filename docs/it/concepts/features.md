---
read_when:
    - Vuoi un elenco completo di ciò che OpenClaw supporta
summary: Funzionalità di OpenClaw per canali, instradamento, contenuti multimediali ed esperienza utente.
title: Funzionalità
x-i18n:
    generated_at: "2026-07-12T06:56:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## In evidenza

<Columns>
  <Card title="Canali" icon="message-square" href="/it/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e altro ancora con un unico Gateway.
  </Card>
  <Card title="Plugin" icon="plug" href="/it/tools/plugin">
    I Plugin ufficiali aggiungono Matrix, Nextcloud Talk, Nostr, Twitch, Zalo e decine di altri servizi con un solo comando di installazione.
  </Card>
  <Card title="Instradamento" icon="route" href="/it/concepts/multi-agent">
    Instradamento multi-agente con sessioni isolate.
  </Card>
  <Card title="Contenuti multimediali" icon="image" href="/it/nodes/images">
    Immagini, audio, video, documenti e generazione di immagini e video.
  </Card>
  <Card title="App e interfaccia utente" icon="monitor" href="/it/platforms">
    Hub per Windows, Control UI nel browser, app nella barra dei menu di macOS e nodi mobili.
  </Card>
  <Card title="Nodi mobili" icon="smartphone" href="/it/nodes">
    Nodi iOS e Android con associazione, voce/chat e comandi avanzati per il dispositivo.
  </Card>
</Columns>

## Elenco completo

**Canali:**

- iMessage, Telegram e WebChat sono inclusi nell'installazione principale; ogni altro canale è un
  Plugin ufficiale installabile con `openclaw plugins install @openclaw/<id>` (oppure su richiesta
  durante `openclaw onboard` / `openclaw channels add`)
- Canali Plugin ufficiali: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo e Zalo Personal
- Canali Plugin esterni gestiti al di fuori del repository di OpenClaw: WeChat, Yuanbao e Zalo ClawBot
- Supporto per chat di gruppo con attivazione basata sulle menzioni
- Sicurezza dei messaggi diretti con elenchi di elementi consentiti e associazione

**Agente:**

- Runtime agente integrato con trasmissione in streaming degli strumenti
- Instradamento multi-agente con sessioni isolate per spazio di lavoro o mittente
- Sessioni: le chat dirette confluiscono nella sessione condivisa `main`; i gruppi sono isolati
- Streaming e suddivisione in blocchi per le risposte lunghe

**Autenticazione e fornitori:**

- Oltre 35 fornitori di modelli (Anthropic, OpenAI, Google e altri)
- Autenticazione dell'abbonamento tramite OAuth (ad esempio OpenAI Codex)
- Supporto per fornitori personalizzati e ospitati autonomamente (vLLM, SGLang, Ollama, llama.cpp, LM Studio e
  qualsiasi endpoint compatibile con OpenAI o Anthropic)

**Contenuti multimediali:**

- Invio e ricezione di immagini, audio, video e documenti
- Interfacce di funzionalità condivise per la generazione di immagini e video
- Trascrizione delle note vocali
- Sintesi vocale con più fornitori

**App e interfacce:**

- WebChat e Control UI nel browser
- App complementare nella barra dei menu di macOS
- Node iOS con associazione, Canvas, fotocamera, registrazione dello schermo, posizione e voce
- Node Android con associazione, chat, voce, Canvas, fotocamera e comandi del dispositivo

**Strumenti e automazione:**

- Automazione del browser, esecuzione e isolamento
- Ricerca sul Web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Processi Cron e pianificazione Heartbeat
- Skills, Plugin e pipeline di flussi di lavoro (Lobster)

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Funzionalità sperimentali" href="/it/concepts/experimental-features" icon="flask">
    Funzionalità facoltative non ancora incluse nell'interfaccia predefinita.
  </Card>
  <Card title="Runtime agente" href="/it/concepts/agent" icon="robot">
    Modello del runtime agente e modalità di distribuzione delle esecuzioni.
  </Card>
  <Card title="Canali" href="/it/channels" icon="message-square">
    Collega Telegram, WhatsApp, Discord, Slack e altri servizi da un unico Gateway.
  </Card>
  <Card title="Plugin" href="/it/tools/plugin" icon="plug">
    Plugin ufficiali ed esterni che estendono OpenClaw.
  </Card>
</CardGroup>
