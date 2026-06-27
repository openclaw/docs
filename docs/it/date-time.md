---
read_when:
    - Stai modificando il modo in cui i timestamp vengono mostrati al modello o agli utenti
    - Stai eseguendo il debug della formattazione dell’ora nei messaggi o nell’output del prompt di sistema
summary: Gestione di data e ora tra envelope, prompt, strumenti e connettori
title: Data e ora
x-i18n:
    generated_at: "2026-06-27T17:29:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw usa per impostazione predefinita **l'ora locale dell'host per i timestamp di trasporto** e **il fuso orario dell'utente solo nel prompt di sistema**.
I timestamp dei provider vengono preservati affinché gli strumenti mantengano la loro semantica nativa (l'ora corrente è disponibile tramite `session_status`).

## Envelope dei messaggi (locale per impostazione predefinita)

I messaggi in ingresso vengono racchiusi con un timestamp (precisione al secondo):

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

Questo timestamp dell'envelope è **locale dell'host per impostazione predefinita**, indipendentemente dal fuso orario del provider.

Puoi sovrascrivere questo comportamento:

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
- `envelopeTimezone: "local"` usa il fuso orario dell'host.
- `envelopeTimezone: "user"` usa `agents.defaults.userTimezone` (ripiega sul fuso orario dell'host).
- Usa un fuso orario IANA esplicito (ad esempio, `"America/Chicago"`) per una zona fissa.
- `envelopeTimestamp: "off"` rimuove i timestamp assoluti dalle intestazioni degli envelope, dai prefissi diretti del prompt agente e dai prefissi incorporati dell'input del modello.
- `envelopeElapsed: "off"` rimuove i suffissi del tempo trascorso (lo stile `+2m`).

### Esempi

**Locale (predefinito):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Fuso orario dell'utente:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Tempo trascorso abilitato:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Prompt di sistema: data e ora correnti

Se il fuso orario dell'utente è noto, il prompt di sistema include una sezione dedicata
**Data e ora correnti** con **solo il fuso orario** (nessun formato di orologio/ora)
per mantenere stabile la cache del prompt:

```
Time zone: America/Chicago
```

Quando l'agente ha bisogno dell'ora corrente, usa lo strumento `session_status`; la scheda
di stato include una riga con il timestamp.

## Righe degli eventi di sistema (locali per impostazione predefinita)

Gli eventi di sistema in coda inseriti nel contesto dell'agente sono preceduti da un timestamp che usa la
stessa selezione del fuso orario degli envelope dei messaggi (predefinito: locale dell'host).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Configurare fuso orario utente + formato

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` imposta il **fuso orario locale dell'utente** per il contesto del prompt.
- `timeFormat` controlla la **visualizzazione 12h/24h** nel prompt. `auto` segue le preferenze del sistema operativo.

## Rilevamento del formato orario (auto)

Quando `timeFormat: "auto"`, OpenClaw ispeziona la preferenza del sistema operativo (macOS/Windows)
e ripiega sulla formattazione locale. Il valore rilevato viene **memorizzato nella cache per processo**
per evitare chiamate di sistema ripetute.

## Payload degli strumenti + connettori (ora grezza del provider + campi normalizzati)

Gli strumenti dei canali restituiscono **timestamp nativi del provider** e aggiungono campi normalizzati per coerenza:

- `timestampMs`: millisecondi epoch (UTC)
- `timestampUtc`: stringa ISO 8601 UTC

I campi grezzi del provider vengono preservati, così non si perde nulla.

- Slack: stringhe simili a epoch dall'API
- Discord: timestamp ISO UTC
- Telegram/WhatsApp: timestamp numerici/ISO specifici del provider

Se ti serve l'ora locale, convertila a valle usando il fuso orario noto.

## Documenti correlati

- [Prompt di sistema](/it/concepts/system-prompt)
- [Fusi orari](/it/concepts/timezone)
- [Messaggi](/it/concepts/messages)
