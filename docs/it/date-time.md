---
read_when:
    - Stai modificando il modo in cui i timestamp vengono mostrati al modello o agli utenti
    - Stai eseguendo il debug della formattazione dell'ora nei messaggi o nell'output del prompt di sistema
summary: Gestione di data e ora tra envelope, prompt, tools e connettori
title: Data e ora
x-i18n:
    generated_at: "2026-04-05T13:51:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753af5946a006215d6af2467fa478f3abb42b1dff027cf85d5dc4c7ba4b58d39
    source_path: date-time.md
    workflow: 15
---

# Data e ora

OpenClaw usa per impostazione predefinita **l'ora locale dell'host per i timestamp di trasporto** e **il fuso orario dell'utente solo nel prompt di sistema**.
I timestamp del provider vengono preservati in modo che i tools mantengano la loro semantica nativa (l'ora corrente è disponibile tramite `session_status`).

## Envelope dei messaggi (locale per impostazione predefinita)

I messaggi in ingresso vengono racchiusi con un timestamp (precisione al minuto):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Questo timestamp dell'envelope è **locale all'host per impostazione predefinita**, indipendentemente dal fuso orario del provider.

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
- `envelopeTimezone: "user"` usa `agents.defaults.userTimezone` (con fallback al fuso orario dell'host).
- Usa un fuso orario IANA esplicito (ad esempio `"America/Chicago"`) per una zona fissa.
- `envelopeTimestamp: "off"` rimuove i timestamp assoluti dalle intestazioni dell'envelope.
- `envelopeElapsed: "off"` rimuove i suffissi del tempo trascorso (stile `+2m`).

### Esempi

**Locale (predefinito):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Fuso orario dell'utente:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Tempo trascorso abilitato:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Prompt di sistema: data e ora correnti

Se il fuso orario dell'utente è noto, il prompt di sistema include una sezione dedicata
**Current Date & Time** con **solo il fuso orario** (nessun formato di orologio/ora)
per mantenere stabile la cache del prompt:

```
Time zone: America/Chicago
```

Quando l'agente ha bisogno dell'ora corrente, usa il tool `session_status`; la scheda di stato
include una riga con il timestamp.

## Righe degli eventi di sistema (locali per impostazione predefinita)

Gli eventi di sistema in coda inseriti nel contesto dell'agente vengono prefissati con un timestamp usando la
stessa selezione del fuso orario degli envelope dei messaggi (predefinito: ora locale dell'host).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Configurare fuso orario dell'utente + formato

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
- `timeFormat` controlla la visualizzazione **12h/24h** nel prompt. `auto` segue le preferenze del sistema operativo.

## Rilevamento del formato orario (auto)

Quando `timeFormat: "auto"`, OpenClaw controlla la preferenza del sistema operativo (macOS/Windows)
e usa come fallback la formattazione locale. Il valore rilevato viene **memorizzato nella cache per processo**
per evitare chiamate di sistema ripetute.

## Payload dei tool + connettori (ora raw del provider + campi normalizzati)

I tool dei canali restituiscono **timestamp nativi del provider** e aggiungono campi normalizzati per coerenza:

- `timestampMs`: millisecondi epoch (UTC)
- `timestampUtc`: stringa UTC ISO 8601

I campi raw del provider vengono preservati in modo che nulla vada perso.

- Slack: stringhe tipo epoch dall'API
- Discord: timestamp ISO UTC
- Telegram/WhatsApp: timestamp numerici/ISO specifici del provider

Se hai bisogno dell'ora locale, convertila downstream usando il fuso orario noto.

## Documenti correlati

- [Prompt di sistema](/concepts/system-prompt)
- [Fusi orari](/concepts/timezone)
- [Messaggi](/concepts/messages)
