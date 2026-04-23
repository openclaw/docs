---
read_when:
    - Aggiornare il comportamento o i valori predefiniti di retry del provider
    - Debug degli errori di invio del provider o dei limiti di frequenza
summary: Policy di retry per le chiamate in uscita al provider
title: Policy di retry
x-i18n:
    generated_at: "2026-04-23T08:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# Policy di retry

## Obiettivi

- Ritentare per richiesta HTTP, non per flusso multi-step.
- Preservare l'ordine ritentando solo lo step corrente.
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

- OpenClaw lascia che gli SDK del provider gestiscano i normali retry brevi.
- Per gli SDK basati su Stainless come Anthropic e OpenAI, le risposte ritentabili
  (`408`, `409`, `429` e `5xx`) possono includere `retry-after-ms` oppure
  `retry-after`. Quando quell'attesa è più lunga di 60 secondi, OpenClaw inietta
  `x-should-retry: false` in modo che l'SDK esponga immediatamente l'errore e il
  failover del modello possa ruotare verso un altro profilo di autenticazione o modello di fallback.
- Sovrascrivi il limite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Impostalo su `0`, `false`, `off`, `none` o `disabled` per lasciare che gli SDK rispettino internamente
  attese `Retry-After` lunghe.

### Discord

- Ritenta solo sugli errori di limite di frequenza (HTTP 429).
- Usa `retry_after` di Discord quando disponibile, altrimenti backoff esponenziale.

### Telegram

- Ritenta sugli errori transitori (429, timeout, connect/reset/closed, temporaneamente non disponibile).
- Usa `retry_after` quando disponibile, altrimenti backoff esponenziale.
- Gli errori di parsing Markdown non vengono ritentati; tornano in fallback a testo semplice.

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

- I retry si applicano per richiesta (invio messaggio, upload media, reazione, poll, sticker).
- I flussi composti non ritentano gli step già completati.
