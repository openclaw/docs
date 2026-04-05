---
read_when:
    - Aggiornamento del comportamento o dei valori predefiniti di retry del provider
    - Debug degli errori di invio del provider o dei limiti di frequenza
summary: Policy di retry per le chiamate provider in uscita
title: Policy di retry
x-i18n:
    generated_at: "2026-04-05T13:50:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55bb261ff567f46ce447be9c0ee0c5b5e6d2776287d7662762656c14108dd607
    source_path: concepts/retry.md
    workflow: 15
---

# Policy di retry

## Obiettivi

- Eseguire il retry per richiesta HTTP, non per flusso multi-step.
- Preservare l'ordine ritentando solo il passaggio corrente.
- Evitare la duplicazione di operazioni non idempotenti.

## Valori predefiniti

- Tentativi: 3
- Limite massimo del ritardo: 30000 ms
- Jitter: 0.1 (10 percento)
- Valori predefiniti del provider:
  - Ritardo minimo Telegram: 400 ms
  - Ritardo minimo Discord: 500 ms

## Comportamento

### Discord

- Esegue il retry solo sugli errori di rate limit (HTTP 429).
- Usa Discord `retry_after` quando disponibile, altrimenti exponential backoff.

### Telegram

- Esegue il retry su errori transitori (429, timeout, connect/reset/closed, temporaneamente non disponibile).
- Usa `retry_after` quando disponibile, altrimenti exponential backoff.
- Gli errori di parsing Markdown non vengono ritentati; usano il fallback a testo semplice.

## Configurazione

Imposta la policy di retry per provider in `~/.openclaw/openclaw.json`:

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

- I retry si applicano per richiesta (invio messaggio, upload media, reazione, sondaggio, sticker).
- I flussi compositi non ritentano i passaggi già completati.
