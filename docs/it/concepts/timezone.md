---
read_when:
    - Vuoi un modello mentale rapido per la gestione dei fusi orari
    - Stai decidendo dove impostare o sovrascrivere un fuso orario
summary: Dove compaiono i fusi orari in OpenClaw — buste, payload degli strumenti, prompt di sistema
title: Fusi orari
x-i18n:
    generated_at: "2026-07-12T07:00:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standardizza i timestamp affinché il modello veda un **unico orario di riferimento** anziché una combinazione di orologi locali dei provider. Tre superfici mostrano i fusi orari, ciascuna con uno scopo specifico:

## Tre superfici per i fusi orari

| Superficie           | Cosa mostra                                                                                                              | Valore predefinito                                | Configurata tramite                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------- |
| Buste dei messaggi   | Racchiudono i messaggi in entrata dai canali: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                          | Ora locale dell'host                              | `agents.defaults.envelopeTimezone`                      |
| Payload degli strumenti | Gli strumenti dei canali simili a `readMessages` restituiscono l'ora grezza del provider e i valori normalizzati `timestampMs` / `timestampUtc` | I campi UTC sono sempre presenti                  | Non configurabile; mantiene i timestamp nativi del provider |
| Prompt di sistema    | Un piccolo blocco `Data e ora correnti` con il **solo fuso orario** (senza valore dell'orologio, per la stabilità della cache) | Fuso orario dell'host se `userTimezone` non è impostato | `agents.defaults.userTimezone`                          |

Il prompt di sistema omette deliberatamente l'ora corrente per mantenere stabile la memorizzazione nella cache del prompt tra i turni. Quando l'agente deve conoscere l'ora corrente, chiama `session_status`.

## Impostazione del fuso orario dell'utente

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Se `userTimezone` non è impostato, OpenClaw determina il fuso orario dell'host in fase di esecuzione tramite `Intl.DateTimeFormat().resolvedOptions().timeZone` (senza scrivere nella configurazione). `agents.defaults.timeFormat` (`auto` | `12` | `24`) controlla la visualizzazione in formato 12/24 ore nelle buste e nelle superfici a valle, ma non nella sezione del prompt di sistema.

## Valori del fuso orario delle buste

`agents.defaults.envelopeTimezone` accetta:

- `"local"` (valore predefinito) o `"host"` - il fuso orario della macchina host.
- `"utc"` o `"gmt"` - UTC.
- `"user"` - il valore determinato di `agents.defaults.userTimezone` (se non è impostato, usa il fuso orario dell'host).
- Qualsiasi stringa esplicita di un fuso IANA, ad esempio `"Europe/Vienna"`.

## Quando sostituire il valore predefinito

- **Usa `"utc"`** per ottenere timestamp coerenti tra host situati in regioni diverse o per uniformarli all'output di diagnostica e dei log basato su UTC.
- **Usa `"user"`** per mantenere le buste allineate al fuso orario configurato per l'utente, indipendentemente dal fuso in cui viene eseguito l'host del Gateway.
- **Usa un fuso IANA fisso** quando l'host del Gateway si trova in un fuso, ma la busta deve essere sempre visualizzata in un altro, indipendentemente dalla migrazione dell'host.
- **Imposta `envelopeTimestamp: "off"`** quando il contesto temporale non è utile per la conversazione. Questa impostazione rimuove i timestamp assoluti dalle buste, dai prefissi dei prompt diretti dell'agente e dai prefissi incorporati nell'input del modello.

Per il riferimento completo sul comportamento, esempi per ciascun provider e la formattazione del tempo trascorso, consulta [Data e ora](/it/date-time).

## Contenuti correlati

- [Data e ora](/it/date-time) - comportamento completo ed esempi per buste, strumenti e prompt.
- [Heartbeat](/it/gateway/heartbeat) - le ore di attività usano il fuso orario per la pianificazione.
- [Processi Cron](/it/automation/cron-jobs) - le espressioni cron usano il fuso orario per la pianificazione.
