---
read_when:
    - Vuoi una singola chiave API per molti LLM
    - Vuoi eseguire modelli tramite Kilo Gateway in OpenClaw
summary: Usa l'API unificata di Kilo Gateway per accedere a molti modelli in OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-04-05T14:01:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 857266967b4a7553d501990631df2bae0f849d061521dc9f34e29687ecb94884
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway fornisce un'**API unificata** che instrada le richieste verso molti modelli dietro un singolo
endpoint e una singola chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando il base URL.

## Ottenere una chiave API

1. Vai su [app.kilo.ai](https://app.kilo.ai)
2. Accedi o crea un account
3. Vai alla sezione API Keys e genera una nuova chiave

## Configurazione CLI

```bash
openclaw onboard --auth-choice kilocode-api-key
```

Oppure imposta la variabile environment:

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## Frammento di config

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Modello predefinito

Il modello predefinito è `kilocode/kilo/auto`, un modello di instradamento intelligente
di proprietà del provider gestito da Kilo Gateway.

OpenClaw tratta `kilocode/kilo/auto` come il ref predefinito stabile, ma non
pubblica una mappatura task→modello-upstream basata sulla sorgente per quella route.

## Modelli disponibili

OpenClaw rileva dinamicamente i modelli disponibili da Kilo Gateway all'avvio. Usa
`/models kilocode` per vedere l'elenco completo dei modelli disponibili con il tuo account.

Qualunque modello disponibile sul gateway può essere usato con il prefisso `kilocode/`:

```
kilocode/kilo/auto              (predefinito - instradamento intelligente)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.4
kilocode/google/gemini-3-pro-preview
...e molti altri
```

## Note

- I ref modello sono `kilocode/<model-id>` (ad esempio `kilocode/anthropic/claude-sonnet-4`).
- Modello predefinito: `kilocode/kilo/auto`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Il catalogo di fallback bundled include sempre `kilocode/kilo/auto` (`Kilo Auto`) con
  `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`,
  e `maxTokens: 128000`
- All'avvio, OpenClaw prova `GET https://api.kilo.ai/api/gateway/models` e
  unisce i modelli rilevati prima del catalogo di fallback statico
- L'instradamento upstream esatto dietro `kilocode/kilo/auto` è di proprietà di Kilo Gateway,
  non codificato in modo rigido in OpenClaw
- Kilo Gateway è documentato nel sorgente come compatibile con OpenRouter, quindi resta
  sul percorso compatibile con OpenAI in stile proxy invece del model shaping nativo delle richieste OpenAI
- I ref Kilo basati su Gemini restano sul percorso proxy-Gemini, quindi OpenClaw mantiene
  lì la sanitizzazione della thought-signature Gemini senza abilitare la
  validazione replay Gemini nativa o le riscritture bootstrap.
- Il wrapper stream condiviso di Kilo aggiunge l'header app del provider e normalizza
  i payload reasoning proxy per i ref di modelli concreti supportati. `kilocode/kilo/auto`
  e altri hint proxy-reasoning-unsupported saltano quell'iniezione di reasoning.
- Per ulteriori opzioni di modelli/provider, vedi [/concepts/model-providers](/concepts/model-providers).
- Kilo Gateway usa internamente un token Bearer con la tua chiave API.
