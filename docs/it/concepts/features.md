---
read_when:
    - Vuoi un elenco completo di ciò che OpenClaw supporta
summary: Capacità di OpenClaw tra canali, instradamento, media ed esperienza utente.
title: Funzionalità
x-i18n:
    generated_at: "2026-04-24T08:36:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## In evidenza

<Columns>
  <Card title="Canali" icon="message-square" href="/it/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e altro con un unico Gateway.
  </Card>
  <Card title="Plugin" icon="plug" href="/it/tools/plugin">
    I plugin inclusi aggiungono Matrix, Nextcloud Talk, Nostr, Twitch, Zalo e altro senza installazioni separate nelle normali versioni correnti.
  </Card>
  <Card title="Instradamento" icon="route" href="/it/concepts/multi-agent">
    Instradamento multi-agente con sessioni isolate.
  </Card>
  <Card title="Media" icon="image" href="/it/nodes/images">
    Immagini, audio, video, documenti e generazione di immagini/video.
  </Card>
  <Card title="App e interfaccia utente" icon="monitor" href="/it/web/control-ui">
    Web Control UI e app companion macOS.
  </Card>
  <Card title="Node mobili" icon="smartphone" href="/it/nodes">
    Node iOS e Android con associazione, voce/chat e comandi avanzati del dispositivo.
  </Card>
</Columns>

## Elenco completo

**Canali:**

- I canali integrati includono Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat e WhatsApp
- I canali dei plugin inclusi comprendono BlueBubbles per iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo e Zalo personale
- I plugin di canale opzionali installati separatamente includono Voice Call e pacchetti di terze parti come WeChat
- I plugin di canale di terze parti possono estendere ulteriormente il Gateway, come WeChat
- Supporto per chat di gruppo con attivazione basata sulle menzioni
- Sicurezza dei DM con allowlist e associazione

**Agente:**

- Runtime dell'agente incorporato con streaming degli strumenti
- Instradamento multi-agente con sessioni isolate per workspace o mittente
- Sessioni: le chat dirette confluiscono nel `main` condiviso; i gruppi sono isolati
- Streaming e suddivisione in blocchi per risposte lunghe

**Autenticazione e provider:**

- Oltre 35 provider di modelli (Anthropic, OpenAI, Google e altri)
- Autenticazione in abbonamento tramite OAuth (per esempio OpenAI Codex)
- Supporto per provider personalizzati e self-hosted (vLLM, SGLang, Ollama e qualsiasi endpoint compatibile con OpenAI o Anthropic)

**Media:**

- Immagini, audio, video e documenti in ingresso e in uscita
- Superfici di capacità condivise per generazione di immagini e video
- Trascrizione di note vocali
- Text-to-speech con più provider

**App e interfacce:**

- WebChat e Control UI nel browser
- App companion macOS nella barra dei menu
- Node iOS con associazione, Canvas, fotocamera, registrazione schermo, posizione e voce
- Node Android con associazione, chat, voce, Canvas, fotocamera e comandi del dispositivo

**Strumenti e automazione:**

- Automazione del browser, exec, sandboxing
- Ricerca web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Processi Cron e pianificazione Heartbeat
- Skills, plugin e pipeline di workflow (Lobster)

## Correlati

- [Funzionalità sperimentali](/it/concepts/experimental-features)
- [Runtime dell'agente](/it/concepts/agent)
