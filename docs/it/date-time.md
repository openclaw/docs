---
read_when:
    - Stai modificando il modo in cui i timestamp vengono mostrati al modello o agli utenti
    - Stai eseguendo il debug della formattazione dell'ora nei messaggi o nell'output del prompt di sistema
summary: Gestione di data e ora in envelope, prompt, strumenti e connettori
title: Data e ora
x-i18n:
    generated_at: "2026-07-12T06:59:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw usa **l'ora locale dell'host per i timestamp del trasporto** e inserisce **solo il fuso orario** nel prompt di sistema.
I timestamp del provider vengono preservati affinché gli strumenti mantengano la propria semantica nativa. Quando l'agente deve conoscere la data e l'ora correnti,
esegue lo strumento `session_status`.

## Involucri dei messaggi (locali per impostazione predefinita)

I messaggi in entrata vengono racchiusi in un involucro con il giorno della settimana e un timestamp con precisione al secondo:

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] testo del messaggio
```

Il timestamp dell'involucro è **locale all'host per impostazione predefinita**, indipendentemente dal fuso orario del provider.
È possibile modificarlo in `agents.defaults`:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | fuso orario IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

| Chiave              | Valori                                               | Comportamento                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `envelopeTimezone`  | `local` (predefinito), `utc`, `user`, nome IANA esplicito | `user` usa `agents.defaults.userTimezone` (il fuso orario dell'host se non impostato). Un nome IANA esplicito (ad es. `"America/Chicago"`) fissa un determinato fuso; i nomi non riconosciuti usano UTC come ripiego. |
| `envelopeTimestamp` | `on` (predefinito), `off`                            | `off` rimuove i timestamp assoluti dalle intestazioni degli involucri, dai prefissi diretti dei prompt dell'agente e dai prefissi incorporati nell'input del modello.                                          |
| `envelopeElapsed`   | `on` (predefinito), `off`                            | `off` rimuove il suffisso del tempo trascorso (nel formato `+30s` / `+2m`) visualizzato dalla ricezione del messaggio precedente nella sessione.                                                                |

### Esempi

**Locale (predefinito):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] ciao
```

**Fuso orario dell'utente:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] ciao
```

**Tempo trascorso con `envelopeTimezone: "utc"`:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] messaggio successivo
```

## Prompt di sistema: data e ora correnti

Il prompt di sistema include una sezione **Data e ora correnti** contenente **solo il fuso orario**
(senza orologio o formato dell'ora), per mantenere stabile la cache del prompt:

```
Fuso orario: America/Chicago
```

Il fuso è `agents.defaults.userTimezone` quando è configurato; in caso contrario, viene usato il fuso orario dell'host.
Il prompt indica inoltre all'agente di eseguire lo strumento `session_status` ogni volta che deve conoscere
la data, l'ora o il giorno della settimana correnti.

## Righe degli eventi di sistema (locali per impostazione predefinita)

Gli eventi di sistema in coda inseriti nel contesto dell'agente sono preceduti da un timestamp che usa la
stessa selezione `envelopeTimezone` degli involucri dei messaggi (impostazione predefinita: ora locale dell'host).

```
Sistema: [2026-01-12 12:19:17 PST] Modello cambiato.
```

### Configurare il fuso orario dell'utente e il formato

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

- `userTimezone` imposta il **fuso orario locale dell'utente** per il contesto del prompt (e per `envelopeTimezone: "user"`).
- `timeFormat` controlla la **visualizzazione a 12/24 ore** negli orari presentati nel prompt. `auto` segue le preferenze del sistema operativo.

## Rilevamento del formato dell'ora (automatico)

Quando `timeFormat: "auto"`, OpenClaw esamina la preferenza del sistema operativo (macOS e Windows)
e, come ripiego, usa la formattazione delle impostazioni locali. Il valore rilevato viene **memorizzato nella cache per ogni processo**
per evitare chiamate di sistema ripetute.

## Payload degli strumenti e connettori (ora grezza del provider e campi normalizzati)

Gli strumenti dei canali restituiscono **timestamp nativi del provider** e aggiungono campi normalizzati per garantire coerenza:

- `timestampMs`: millisecondi dall'epoca (UTC)
- `timestampUtc`: stringa UTC ISO 8601

I campi grezzi del provider vengono preservati per evitare la perdita di informazioni.

- Discord: timestamp ISO UTC
- Slack: stringhe simili a valori epoca provenienti dall'API
- Telegram/WhatsApp: timestamp numerici o ISO specifici del provider

Se è necessaria l'ora locale, convertirla a valle usando il fuso orario noto.

## Documentazione correlata

- [Prompt di sistema](/it/concepts/system-prompt)
- [Fusi orari](/it/concepts/timezone)
- [Messaggi](/it/concepts/messages)
