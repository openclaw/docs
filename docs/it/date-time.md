---
read_when:
    - Stai modificando il modo in cui le marche temporali vengono mostrate al modello o agli utenti
    - Stai eseguendo il debug della formattazione dell'ora nei messaggi o nell'output del prompt di sistema
summary: Gestione di data e ora in involucri, richieste, strumenti e connettori
title: Data e ora
x-i18n:
    generated_at: "2026-05-06T08:49:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw usa per impostazione predefinita **l'ora locale dell'host per i timestamp di trasporto** e **il fuso orario utente solo nel prompt di sistema**.
I timestamp dei provider vengono preservati affinché gli strumenti mantengano la loro semantica nativa (l'ora corrente è disponibile tramite `session_status`).

## Buste dei messaggi (locali per impostazione predefinita)

I messaggi in ingresso sono avvolti con un timestamp (precisione al minuto):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Questo timestamp della busta è **locale all'host per impostazione predefinita**, indipendentemente dal fuso orario del provider.

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
- `envelopeTimestamp: "off"` rimuove i timestamp assoluti dalle intestazioni delle buste.
- `envelopeElapsed: "off"` rimuove i suffissi di tempo trascorso (lo stile `+2m`).

### Esempi

**Locale (predefinito):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Fuso orario utente:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Tempo trascorso abilitato:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Prompt di sistema: data e ora correnti

Se il fuso orario utente è noto, il prompt di sistema include una sezione dedicata
**Data e ora correnti** con **solo il fuso orario** (nessun formato di orologio/ora)
per mantenere stabile la memorizzazione nella cache del prompt:

```
Time zone: America/Chicago
```

Quando l'agente ha bisogno dell'ora corrente, usa lo strumento `session_status`; la scheda
di stato include una riga di timestamp.

## Righe degli eventi di sistema (locali per impostazione predefinita)

Gli eventi di sistema in coda inseriti nel contesto dell'agente sono preceduti da un timestamp che usa la
stessa selezione del fuso orario delle buste dei messaggi (predefinito: locale all'host).

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

## Rilevamento del formato dell'ora (auto)

Quando `timeFormat: "auto"`, OpenClaw ispeziona la preferenza del sistema operativo (macOS/Windows)
e ripiega sulla formattazione locale. Il valore rilevato viene **memorizzato nella cache per processo**
per evitare chiamate di sistema ripetute.

## Payload degli strumenti + connettori (ora provider grezza + campi normalizzati)

Gli strumenti di canale restituiscono **timestamp nativi del provider** e aggiungono campi normalizzati per coerenza:

- `timestampMs`: millisecondi dall'epoch (UTC)
- `timestampUtc`: stringa UTC ISO 8601

I campi grezzi del provider vengono preservati, così non si perde nulla.

- Slack: stringhe simili a epoch dall'API
- Discord: timestamp ISO UTC
- Telegram/WhatsApp: timestamp numerici/ISO specifici del provider

Se ti serve l'ora locale, convertila a valle usando il fuso orario noto.

## Documentazione correlata

- [Prompt di sistema](/it/concepts/system-prompt)
- [Fusi orari](/it/concepts/timezone)
- [Messaggi](/it/concepts/messages)
