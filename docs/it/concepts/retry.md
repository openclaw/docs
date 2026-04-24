---
read_when:
    - Aggiornamento del comportamento o dei valori predefiniti di retry del provider
    - Debug delle chiamate provider fallite o dei limiti di frequenza
summary: Criterio di retry per le chiamate ai provider in uscita
title: Criterio di retry
x-i18n:
    generated_at: "2026-04-24T08:37:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 15
---

## Obiettivi

- Retry per richiesta HTTP, non per flusso multi-step.
- Preservare l'ordinamento ritentando solo il passaggio corrente.
- Evitare di duplicare operazioni non idempotenti.

## Valori predefiniti

- Tentativi: 3
- Limite massimo del ritardo: 30000 ms
- Jitter: 0.1 (10 percento)
- Valori predefiniti del provider:
  - Ritardo minimo Telegram: 400 ms
  - Ritardo minimo Discord: 500 ms

## Comportamento

### Provider di modelli

- OpenClaw lascia che gli SDK dei provider gestiscano i normali retry brevi.
- Per gli SDK basati su Stainless, come Anthropic e OpenAI, le risposte ritentabili
  (`408`, `409`, `429` e `5xx`) possono includere `retry-after-ms` o
  `retry-after`. Quando quell'attesa è superiore a 60 secondi, OpenClaw inserisce
  `x-should-retry: false` in modo che l'SDK esponga subito l'errore e il
  failover del modello possa ruotare verso un altro profilo auth o un modello fallback.
- Esegui l'override del limite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Impostalo su `0`, `false`, `off`, `none` o `disabled` per lasciare che gli SDK rispettino internamente
  sleep `Retry-After` lunghi.

### Discord

- Esegue retry solo sugli errori di limite di frequenza (HTTP 429).
- Usa `retry_after` di Discord quando disponibile, altrimenti exponential backoff.

### Telegram

- Esegue retry su errori transitori (429, timeout, connect/reset/closed, temporaneamente non disponibile).
- Usa `retry_after` quando disponibile, altrimenti exponential backoff.
- Gli errori di parsing Markdown non vengono ritentati; usano fallback al testo semplice.

## Configurazione

Imposta il criterio di retry per provider in `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Note

- I retry si applicano per richiesta (invio messaggio, caricamento media, reazione, sondaggio, sticker).
- I flussi compositi non ritentano i passaggi già completati.

## Correlati

- [Model failover](/it/concepts/model-failover)
- [Command queue](/it/concepts/queue)
