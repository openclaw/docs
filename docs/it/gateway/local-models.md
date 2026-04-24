---
read_when:
    - Vuoi servire modelli dalla tua macchina GPU personale
    - Stai collegando LM Studio o un proxy compatibile con OpenAI
    - Ti serve la guida più sicura per i modelli locali
summary: Eseguire OpenClaw su LLM locali (LM Studio, vLLM, LiteLLM, endpoint OpenAI personalizzati)
title: Modelli locali
x-i18n:
    generated_at: "2026-04-24T08:40:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

Il locale è fattibile, ma OpenClaw si aspetta un contesto ampio + difese forti contro la prompt injection. Schede piccole troncano il contesto e indeboliscono la sicurezza. Punta in alto: **≥2 Mac Studio al massimo della configurazione o una macchina GPU equivalente (~$30k+)**. Una singola GPU da **24 GB** funziona solo per prompt più leggeri con latenza maggiore. Usa la **variante di modello più grande / full-size che riesci a eseguire**; checkpoint fortemente quantizzati o “small” aumentano il rischio di prompt injection (vedi [Sicurezza](/it/gateway/security)).

Se vuoi la configurazione locale con meno attrito, inizia con [LM Studio](/it/providers/lmstudio) o [Ollama](/it/providers/ollama) e `openclaw onboard`. Questa pagina è la guida orientata alle opinioni per stack locali di fascia alta e server locali personalizzati compatibili con OpenAI.

## Consigliato: LM Studio + grande modello locale (Responses API)

Il miglior stack locale attuale. Carica un modello grande in LM Studio (per esempio, una build full-size di Qwen, DeepSeek o Llama), abilita il server locale (predefinito `http://127.0.0.1:1234`) e usa Responses API per mantenere separato il reasoning dal testo finale.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Checklist di configurazione**

- Installa LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- In LM Studio, scarica la **build di modello più grande disponibile** (evita varianti “small”/fortemente quantizzate), avvia il server, conferma che `http://127.0.0.1:1234/v1/models` lo elenchi.
- Sostituisci `my-local-model` con l'ID modello effettivo mostrato in LM Studio.
- Mantieni il modello caricato; il caricamento a freddo aggiunge latenza di avvio.
- Regola `contextWindow`/`maxTokens` se la tua build di LM Studio è diversa.
- Per WhatsApp, resta su Responses API così viene inviato solo il testo finale.

Mantieni configurati anche i modelli hosted quando esegui in locale; usa `models.mode: "merge"` così i fallback restano disponibili.

### Configurazione ibrida: primario hosted, fallback locale

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Locale-prima con rete di sicurezza hosted

Inverti l'ordine di primario e fallback; mantieni lo stesso blocco providers e `models.mode: "merge"` così puoi usare il fallback a Sonnet o Opus quando la macchina locale non è disponibile.

### Hosting regionale / instradamento dei dati

- Varianti hosted di MiniMax/Kimi/GLM esistono anche su OpenRouter con endpoint vincolati alla regione (ad es. ospitati negli Stati Uniti). Scegli lì la variante regionale per mantenere il traffico nella giurisdizione desiderata continuando a usare `models.mode: "merge"` per i fallback Anthropic/OpenAI.
- Il solo locale resta il percorso di privacy più forte; l'instradamento regionale hosted è la via di mezzo quando ti servono funzionalità del provider ma vuoi controllo sul flusso dei dati.

## Altri proxy locali compatibili con OpenAI

vLLM, LiteLLM, OAI-proxy o gateway personalizzati funzionano se espongono un endpoint `/v1` in stile OpenAI. Sostituisci il blocco provider sopra con il tuo endpoint e ID modello:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Mantieni `models.mode: "merge"` così i modelli hosted restano disponibili come fallback.

Nota di comportamento per i backend locali/proxy `/v1`:

- OpenClaw li tratta come percorsi compatibili con OpenAI in stile proxy, non come endpoint
  OpenAI nativi
- qui non si applica la modellazione delle richieste solo-OpenAI nativa: niente
  `service_tier`, niente `store` di Responses, nessuna modellazione del payload di compatibilità del reasoning di OpenAI
  e nessun suggerimento di prompt-cache
- gli header nascosti di attribuzione OpenClaw (`originator`, `version`, `User-Agent`)
  non vengono iniettati su questi URL proxy personalizzati

Note di compatibilità per backend compatibili con OpenAI più rigidi:

- Alcuni server accettano solo `messages[].content` come stringa su Chat Completions, non
  array strutturati di content-part. Imposta
  `models.providers.<provider>.models[].compat.requiresStringContent: true` per
  quegli endpoint.
- Alcuni backend locali più piccoli o più rigidi sono instabili con l'intera
  forma del prompt del runtime agente di OpenClaw, specialmente quando sono inclusi gli schemi degli strumenti. Se il
  backend funziona per piccole chiamate dirette `/v1/chat/completions` ma fallisce nei normali
  turni agente di OpenClaw, prova prima
  `agents.defaults.experimental.localModelLean: true` per rimuovere strumenti predefiniti pesanti
  come `browser`, `cron` e `message`; questo è un flag sperimentale, non un'impostazione stabile in modalità predefinita. Vedi
  [Funzionalità sperimentali](/it/concepts/experimental-features). Se questo ancora non basta, prova
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Se il backend continua a fallire solo su esecuzioni OpenClaw più grandi, il problema rimanente
  di solito è capacità del modello/server upstream o un bug del backend, non il
  livello di trasporto di OpenClaw.

## Risoluzione dei problemi

- Il Gateway riesce a raggiungere il proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modello LM Studio scaricato dalla memoria? Ricaricalo; l'avvio a freddo è una causa comune di “blocco”.
- OpenClaw avvisa quando la finestra di contesto rilevata è inferiore a **32k** e blocca sotto **16k**. Se incontri quel preflight, aumenta il limite di contesto del server/modello o scegli un modello più grande.
- Errori di contesto? Riduci `contextWindow` o aumenta il limite del tuo server.
- Il server compatibile con OpenAI restituisce `messages[].content ... expected a string`?
  Aggiungi `compat.requiresStringContent: true` in quella voce modello.
- Piccole chiamate dirette `/v1/chat/completions` funzionano, ma `openclaw infer model run`
  fallisce su Gemma o su un altro modello locale? Disabilita prima gli schemi degli strumenti con
  `compat.supportsTools: false`, poi riprova. Se il server continua a crashare solo
  su prompt OpenClaw più grandi, trattalo come una limitazione del server/modello upstream.
- Sicurezza: i modelli locali saltano i filtri lato provider; mantieni gli agenti limitati e la Compaction attiva per limitare il raggio d'azione della prompt injection.

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference)
- [Failover del modello](/it/concepts/model-failover)
