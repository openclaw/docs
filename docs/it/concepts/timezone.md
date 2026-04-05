---
read_when:
    - Devi capire come i timestamp vengono normalizzati per il modello
    - Configurazione del fuso orario utente per i prompt di sistema
summary: Gestione del fuso orario per agenti, envelope e prompt
title: Fusi orari
x-i18n:
    generated_at: "2026-04-05T13:50:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31a195fa43e3fc17b788d8e70d74ef55da998fc7997c4f0538d4331b1260baac
    source_path: concepts/timezone.md
    workflow: 15
---

# Fusi orari

OpenClaw standardizza i timestamp in modo che il modello veda un **unico orario di riferimento**.

## Envelope dei messaggi (locali per impostazione predefinita)

I messaggi in ingresso vengono racchiusi in un envelope come questo:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Il timestamp nell'envelope è **host-local per impostazione predefinita**, con precisione al minuto.

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
- `envelopeTimestamp: "off"` rimuove i timestamp assoluti dalle intestazioni dell'envelope.
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

## Payload degli strumenti (dati provider grezzi + campi normalizzati)

Le chiamate agli strumenti (`channels.discord.readMessages`, `channels.slack.readMessages`, ecc.) restituiscono **timestamp grezzi del provider**.
Alleghiamo anche campi normalizzati per coerenza:

- `timestampMs` (millisecondi epoch UTC)
- `timestampUtc` (stringa UTC ISO 8601)

I campi grezzi del provider vengono preservati.

## Fuso orario utente per il prompt di sistema

Imposta `agents.defaults.userTimezone` per indicare al modello il fuso orario locale dell'utente. Se non è
impostato, OpenClaw risolve il **fuso orario dell'host a runtime** (nessuna scrittura nella configurazione).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Il prompt di sistema include:

- sezione `Current Date & Time` con ora locale e fuso orario
- `Time format: 12-hour` oppure `24-hour`

Puoi controllare il formato nel prompt con `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Vedi [Data e ora](/date-time) per il comportamento completo e gli esempi.

## Correlati

- [Heartbeat](/gateway/heartbeat) — le ore attive usano il fuso orario per la pianificazione
- [Processi Cron](/it/automation/cron-jobs) — le espressioni cron usano il fuso orario per la pianificazione
- [Data e ora](/date-time) — comportamento completo di data/ora ed esempi
