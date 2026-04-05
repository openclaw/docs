---
read_when:
    - Vuoi servire modelli dal tuo box GPU personale
    - Stai collegando LM Studio o un proxy compatibile con OpenAI
    - Hai bisogno della guida più sicura per i modelli locali
summary: Esegui OpenClaw su LLM locali (LM Studio, vLLM, LiteLLM, endpoint OpenAI personalizzati)
title: Modelli locali
x-i18n:
    generated_at: "2026-04-05T13:52:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b99c8fb57f65c0b765fc75bd36933221b5aeb94c4a3f3428f92640ae064f8b6
    source_path: gateway/local-models.md
    workflow: 15
---

# Modelli locali

L'uso in locale è fattibile, ma OpenClaw si aspetta un contesto ampio + difese robuste contro il prompt injection. Le schede piccole troncano il contesto e indeboliscono la sicurezza. Punta in alto: **≥2 Mac Studio al massimo delle specifiche o un rig GPU equivalente (~$30k+)**. Una singola GPU da **24 GB** funziona solo per prompt più leggeri con latenza più alta. Usa la **variante di modello più grande / full-size che riesci a eseguire**; checkpoint fortemente quantizzati o “small” aumentano il rischio di prompt injection (vedi [Sicurezza](/gateway/security)).

Se vuoi la configurazione locale con meno attrito, inizia con [Ollama](/providers/ollama) e `openclaw onboard`. Questa pagina è la guida con consigli mirati per stack locali di fascia più alta e server locali personalizzati compatibili con OpenAI.

## Consigliato: LM Studio + modello locale grande (Responses API)

Il miglior stack locale attuale. Carica un modello grande in LM Studio (ad esempio una build full-size di Qwen, DeepSeek o Llama), abilita il server locale (predefinito `http://127.0.0.1:1234`) e usa Responses API per mantenere separato il ragionamento dal testo finale.

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
- Per WhatsApp, resta su Responses API in modo che venga inviato solo il testo finale.

Mantieni configurati anche i modelli ospitati mentre esegui in locale; usa `models.mode: "merge"` così i fallback restano disponibili.

### Configurazione ibrida: primario ospitato, fallback locale

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

### Priorità al locale con rete di sicurezza ospitata

Inverti l'ordine tra primario e fallback; mantieni lo stesso blocco `providers` e `models.mode: "merge"` così puoi usare come fallback Sonnet o Opus quando la macchina locale non è disponibile.

### Hosting regionale / instradamento dei dati

- Varianti ospitate di MiniMax/Kimi/GLM esistono anche su OpenRouter con endpoint bloccati per regione (ad esempio ospitati negli Stati Uniti). Scegli lì la variante regionale per mantenere il traffico nella giurisdizione desiderata pur continuando a usare `models.mode: "merge"` per fallback Anthropic/OpenAI.
- Il solo locale resta il percorso più forte per la privacy; l'instradamento regionale ospitato è la via di mezzo quando ti servono funzionalità del provider ma vuoi controllare il flusso dei dati.

## Altri proxy locali compatibili con OpenAI

vLLM, LiteLLM, OAI-proxy o gateway personalizzati funzionano se espongono un endpoint `/v1` in stile OpenAI. Sostituisci il blocco provider sopra con il tuo endpoint e l'ID modello:

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

Mantieni `models.mode: "merge"` così i modelli ospitati restano disponibili come fallback.

Nota sul comportamento per backend locali/proxy `/v1`:

- OpenClaw li tratta come route compatibili con OpenAI in stile proxy, non come endpoint OpenAI nativi
- il model shaping delle richieste solo OpenAI native non si applica qui: niente
  `service_tier`, niente `store` di Responses, niente model shaping dei payload di compatibilità del ragionamento OpenAI
  e niente suggerimenti per la prompt cache
- gli header di attribuzione nascosti di OpenClaw (`originator`, `version`, `User-Agent`)
  non vengono iniettati su questi URL proxy personalizzati

## Risoluzione dei problemi

- Il gateway riesce a raggiungere il proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modello LM Studio non caricato? Ricaricalo; l'avvio a freddo è una causa comune di apparente “blocco”.
- Errori di contesto? Riduci `contextWindow` o aumenta il limite del server.
- Sicurezza: i modelli locali saltano i filtri lato provider; mantieni agenti con ambito ristretto e la compaction attiva per limitare il raggio d'azione del prompt injection.
