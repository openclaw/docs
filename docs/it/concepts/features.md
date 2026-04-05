---
read_when:
    - Vuoi un elenco completo di ciò che OpenClaw supporta
summary: Funzionalità di OpenClaw tra canali, instradamento, media ed esperienza utente.
title: Funzionalità
x-i18n:
    generated_at: "2026-04-05T13:49:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43eae89d9af44ea786dd0221d8d602ebcea15da9d5064396ac9920c0345e2ad3
    source_path: concepts/features.md
    workflow: 15
---

# Funzionalità

## In evidenza

<Columns>
  <Card title="Canali" icon="message-square">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e altro ancora con un unico Gateway.
  </Card>
  <Card title="Plugin" icon="plug">
    I plugin inclusi aggiungono Matrix, Nextcloud Talk, Nostr, Twitch, Zalo e altro ancora senza installazioni separate nelle normali release correnti.
  </Card>
  <Card title="Instradamento" icon="route">
    Instradamento multi-agente con sessioni isolate.
  </Card>
  <Card title="Media" icon="image">
    Immagini, audio, video, documenti e generazione di immagini/video.
  </Card>
  <Card title="App e UI" icon="monitor">
    Control UI web e app complementare per macOS.
  </Card>
  <Card title="Nodi mobili" icon="smartphone">
    Nodi iOS e Android con pairing, voce/chat e comandi avanzati del dispositivo.
  </Card>
</Columns>

## Elenco completo

**Canali:**

- I canali integrati includono Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat e WhatsApp
- I canali dei plugin inclusi comprendono BlueBubbles per iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo e Zalo Personal
- I plugin di canale opzionali installati separatamente includono Voice Call e pacchetti di terze parti come WeChat
- I plugin di canale di terze parti possono estendere ulteriormente il Gateway, ad esempio WeChat
- Supporto per chat di gruppo con attivazione basata sulle menzioni
- Sicurezza dei messaggi diretti con allowlist e pairing

**Agente:**

- Runtime dell'agente integrato con streaming degli strumenti
- Instradamento multi-agente con sessioni isolate per workspace o mittente
- Sessioni: le chat dirette confluiscono nel `main` condiviso; i gruppi sono isolati
- Streaming e suddivisione in blocchi per risposte lunghe

**Autenticazione e provider:**

- Oltre 35 provider di modelli (Anthropic, OpenAI, Google e altri)
- Autenticazione tramite abbonamento via OAuth (ad esempio OpenAI Codex)
- Supporto per provider personalizzati e self-hosted (vLLM, SGLang, Ollama e qualsiasi endpoint compatibile con OpenAI o Anthropic)

**Media:**

- Immagini, audio, video e documenti in ingresso e in uscita
- Superfici di capacità condivise per generazione di immagini e generazione di video
- Trascrizione dei messaggi vocali
- Text-to-speech con più provider

**App e interfacce:**

- WebChat e Control UI nel browser
- App complementare per la barra dei menu di macOS
- Nodo iOS con pairing, Canvas, fotocamera, registrazione dello schermo, posizione e voce
- Nodo Android con pairing, chat, voce, Canvas, fotocamera e comandi del dispositivo

**Strumenti e automazione:**

- Automazione del browser, exec, sandboxing
- Ricerca web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Processi cron e pianificazione heartbeat
- Skills, plugin e pipeline di workflow (Lobster)
