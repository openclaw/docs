---
read_when:
    - Aggiornamento del comportamento o dei valori predefiniti per i nuovi tentativi del provider
    - Debug degli errori di invio del provider o dei limiti di frequenza
summary: Criteri per i nuovi tentativi delle chiamate in uscita ai provider
title: Criteri per i nuovi tentativi
x-i18n:
    generated_at: "2026-07-12T07:02:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Obiettivi

- Riprovare per ogni richiesta HTTP, non per ogni flusso in più passaggi.
- Preservare l'ordine riprovando solo il passaggio corrente.
- Evitare di duplicare le operazioni non idempotenti.

## Valori predefiniti

| Impostazione            | Valore predefinito |
| ----------------------- | ------------------ |
| Tentativi               | 3                  |
| Limite massimo ritardo  | 30000 ms           |
| Jitter                  | 0.1 (10%)          |
| Ritardo minimo Telegram | 400 ms             |
| Ritardo minimo Discord  | 500 ms             |

## Comportamento

### Fornitori di modelli

- OpenClaw lascia che gli SDK dei fornitori gestiscano i normali tentativi brevi.
- Per gli SDK basati su Stainless, come Anthropic e OpenAI, le risposte per cui è possibile riprovare (`408`, `409`, `429` e `5xx`) possono includere `retry-after-ms` o `retry-after`. Quando l'attesa supera i 60 secondi, OpenClaw inserisce `x-should-retry: false` affinché l'SDK restituisca immediatamente l'errore e il failover del modello possa passare a un altro profilo di autenticazione o modello di riserva.
- Sovrascrivere il limite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`. Impostarlo su `0`, `false`, `off`, `none` o `disabled` per consentire agli SDK di rispettare internamente le lunghe attese indicate da `Retry-After`.

### Discord

- Riprova in caso di errori di limite di frequenza (HTTP 429), timeout delle richieste, risposte HTTP 5xx ed errori transitori di trasporto, come errori di risoluzione DNS, reimpostazioni della connessione, chiusure dei socket ed errori di recupero.
- Utilizza `retry_after` di Discord quando disponibile; altrimenti, applica un backoff esponenziale.

### Telegram

- Riprova in caso di errori transitori (429, timeout, connessione/reimpostazione/chiusura, indisponibilità temporanea).
- Utilizza `retry_after` quando disponibile; altrimenti, applica un backoff esponenziale.
- Gli errori di analisi HTML/Markdown non vengono ritentati; al primo tentativo viene utilizzato come ripiego il testo normale.

## Configurazione

Impostare i criteri per i nuovi tentativi per ciascun fornitore in `~/.openclaw/openclaw.json`:

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

- I nuovi tentativi si applicano a ogni richiesta (invio di messaggi, caricamento di contenuti multimediali, reazione, sondaggio, adesivo).
- I flussi compositi non riprovano i passaggi completati.

## Argomenti correlati

- [Failover del modello](/it/concepts/model-failover)
- [Coda dei comandi](/it/concepts/queue)
