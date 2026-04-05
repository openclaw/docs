---
read_when:
    - Vuoi usare Groq con OpenClaw
    - Hai bisogno della variabile env della chiave API o della scelta di autenticazione CLI
summary: Configurazione Groq (autenticazione + selezione del modello)
title: Groq
x-i18n:
    generated_at: "2026-04-05T14:01:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e27532cafcdaf1ac336fa310e08e4e3245d2d0eb0e94e0bcf42c532c6a9a80b
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) fornisce inferenza ultra-veloce su modelli open-source
(Llama, Gemma, Mistral e altri) usando hardware LPU personalizzato. OpenClaw si connette
a Groq tramite la sua API compatibile con OpenAI.

- Provider: `groq`
- Autenticazione: `GROQ_API_KEY`
- API: compatibile con OpenAI

## Avvio rapido

1. Ottieni una chiave API da [console.groq.com/keys](https://console.groq.com/keys).

2. Imposta la chiave API:

```bash
export GROQ_API_KEY="gsk_..."
```

3. Imposta un modello predefinito:

```json5
{
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Esempio di file di configurazione

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Trascrizione audio

Groq fornisce anche una rapida trascrizione audio basata su Whisper. Quando configurato come
provider di comprensione media, OpenClaw usa il modello Groq `whisper-large-v3-turbo`
per trascrivere i messaggi vocali tramite la superficie condivisa `tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

## Nota sull'ambiente

Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `GROQ_API_KEY` sia
disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
`env.shellEnv`).

## Note audio

- Percorso di configurazione condiviso: `tools.media.audio`
- URL base audio Groq predefinito: `https://api.groq.com/openai/v1`
- Modello audio Groq predefinito: `whisper-large-v3-turbo`
- La trascrizione audio Groq usa il percorso compatibile con OpenAI `/audio/transcriptions`

## Modelli disponibili

Il catalogo dei modelli Groq cambia frequentemente. Esegui `openclaw models list | grep groq`
per vedere i modelli attualmente disponibili, oppure consulta
[console.groq.com/docs/models](https://console.groq.com/docs/models).

Tra le scelte più popolari:

- **Llama 3.3 70B Versatile** - uso generale, contesto ampio
- **Llama 3.1 8B Instant** - veloce, leggero
- **Gemma 2 9B** - compatto, efficiente
- **Mixtral 8x7B** - architettura MoE, reasoning solido

## Link

- [Groq Console](https://console.groq.com)
- [Documentazione API](https://console.groq.com/docs)
- [Elenco dei modelli](https://console.groq.com/docs/models)
- [Prezzi](https://groq.com/pricing)
