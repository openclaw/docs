---
read_when:
    - Vuoi usare Deepgram speech-to-text per allegati audio
    - Hai bisogno di un rapido esempio di configurazione Deepgram
summary: Trascrizione Deepgram per messaggi vocali in ingresso
title: Deepgram
x-i18n:
    generated_at: "2026-04-05T14:01:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: dabd1f6942c339fbd744fbf38040b6a663b06ddf4d9c9ee31e3ac034de9e79d9
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Trascrizione audio)

Deepgram è un'API speech-to-text. In OpenClaw viene usata per la **trascrizione di audio/messaggi vocali in ingresso**
tramite `tools.media.audio`.

Quando è abilitato, OpenClaw carica il file audio su Deepgram e inietta la trascrizione
nella pipeline di risposta (`{{Transcript}}` + blocco `[Audio]`). Questo **non è streaming**;
usa l'endpoint di trascrizione preregistrata.

Sito web: [https://deepgram.com](https://deepgram.com)  
Documentazione: [https://developers.deepgram.com](https://developers.deepgram.com)

## Avvio rapido

1. Imposta la tua chiave API:

```
DEEPGRAM_API_KEY=dg_...
```

2. Abilita il provider:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Opzioni

- `model`: ID del modello Deepgram (predefinito: `nova-3`)
- `language`: suggerimento di lingua (facoltativo)
- `tools.media.audio.providerOptions.deepgram.detect_language`: abilita il rilevamento della lingua (facoltativo)
- `tools.media.audio.providerOptions.deepgram.punctuate`: abilita la punteggiatura (facoltativo)
- `tools.media.audio.providerOptions.deepgram.smart_format`: abilita la formattazione intelligente (facoltativo)

Esempio con lingua:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
      },
    },
  },
}
```

Esempio con opzioni Deepgram:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          deepgram: {
            detect_language: true,
            punctuate: true,
            smart_format: true,
          },
        },
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Note

- L'autenticazione segue il normale ordine auth del provider; `DEEPGRAM_API_KEY` è il percorso più semplice.
- Sovrascrivi endpoint o header con `tools.media.audio.baseUrl` e `tools.media.audio.headers` quando usi un proxy.
- L'output segue le stesse regole audio degli altri provider (limiti di dimensione, timeout, iniezione della trascrizione).
