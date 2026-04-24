---
read_when:
    - Devi capire come i timestamp vengono normalizzati per il modello
    - Configurazione del fuso orario dell'utente per i prompt di sistema
summary: Gestione del fuso orario per agenti, envelope e prompt
title: Fusi orari
x-i18n:
    generated_at: "2026-04-24T08:38:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

OpenClaw standardizza i timestamp in modo che il modello veda un **unico tempo di riferimento**.

## Envelope dei messaggi (locale per impostazione predefinita)

I messaggi in ingresso vengono racchiusi in un envelope come:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Il timestamp nell'envelope è **locale all'host per impostazione predefinita**, con precisione al minuto.

Puoi sovrascriverlo con:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` usa UTC.
- `envelopeTimezone: "user"` usa `agents.defaults.userTimezone` (con fallback al fuso orario dell'host).
- Usa un fuso orario IANA esplicito (ad esempio `"Europe/Vienna"`) per un offset fisso.
- `envelopeTimestamp: "off"` rimuove i timestamp assoluti dagli header dell'envelope.
- `envelopeElapsed: "off"` rimuove i suffissi di tempo trascorso (stile `+2m`).

### Esempi

**Locale (predefinito):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Fuso orario fisso:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Tempo trascorso:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Payload degli strumenti (dati raw del provider + campi normalizzati)

Le chiamate degli strumenti (`channels.discord.readMessages`, `channels.slack.readMessages`, ecc.) restituiscono **timestamp raw del provider**.
Alleghiamo anche campi normalizzati per coerenza:

- `timestampMs` (millisecondi epoch UTC)
- `timestampUtc` (stringa UTC ISO 8601)

I campi raw del provider vengono preservati.

## Fuso orario dell'utente per il prompt di sistema

Imposta `agents.defaults.userTimezone` per dire al modello il fuso orario locale dell'utente. Se non è
impostato, OpenClaw risolve il **fuso orario dell'host a runtime** (nessuna scrittura di configurazione).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Il prompt di sistema include:

- sezione `Current Date & Time` con ora locale e fuso orario
- `Time format: 12-hour` oppure `24-hour`

Puoi controllare il formato del prompt con `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Vedi [Data e ora](/it/date-time) per il comportamento completo e gli esempi.

## Correlati

- [Heartbeat](/it/gateway/heartbeat) — le ore attive usano il fuso orario per la pianificazione
- [Cron Jobs](/it/automation/cron-jobs) — le espressioni cron usano il fuso orario per la pianificazione
- [Data e ora](/it/date-time) — comportamento completo di data/ora ed esempi
