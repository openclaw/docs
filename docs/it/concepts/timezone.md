---
read_when:
    - Vuoi un modello mentale rapido per la gestione dei fusi orari
    - Stai decidendo dove impostare o sovrascrivere un fuso orario
summary: Dove compaiono i fusi orari in OpenClaw — buste, payload degli strumenti, prompt di sistema
title: Fusi orari
x-i18n:
    generated_at: "2026-05-06T08:48:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 041b207a0fa2758a20e8f3c4eca852d3dd416560d045459cb4d86709b45449e3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standardizza i timestamp affinché il modello veda un **unico orario di riferimento** invece di un insieme di orologi locali dei provider. Ci sono tre superfici in cui compaiono i fusi orari, ciascuna con il proprio scopo:

## Tre superfici di fuso orario

| Superficie        | Cosa mostra                                                                                                      | Predefinito                                      | Configurato tramite                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| Envelope dei messaggi | Avvolge i messaggi in ingresso dei canali: `[Signal +1555 2026-01-18 00:19 PST] hello`                         | Locale dell'host                                 | `agents.defaults.envelopeTimezone`                       |
| Payload degli strumenti | Gli strumenti in stile `readMessages` del canale restituiscono l'ora grezza del provider + `timestampMs` / `timestampUtc` normalizzati | Campi UTC sempre presenti                        | Non configurabile — conserva i timestamp nativi del provider |
| Prompt di sistema | Un piccolo blocco `Current Date & Time` con **solo il fuso orario** (senza valore dell'orologio, per la stabilità della cache) | Fuso orario dell'host se `userTimezone` non è impostato | `agents.defaults.userTimezone`                           |

Il prompt di sistema omette deliberatamente l'orologio live per mantenere stabile la cache dei prompt tra i turni. Quando l'agente ha bisogno dell'ora attuale, chiama `session_status`.

## Impostare il fuso orario dell'utente

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Se `userTimezone` non è impostato, OpenClaw risolve il fuso orario dell'host in fase di esecuzione (senza scrivere configurazione). `agents.defaults.timeFormat` (`auto` | `12` | `24`) controlla la resa a 12/24 ore negli envelope e nelle superfici downstream, non nella sezione del prompt di sistema.

## Quando sovrascrivere

- **Usa envelope UTC** (`envelopeTimezone: "utc"`) quando vuoi timestamp stabili tra host in regioni diverse, oppure quando vuoi che i log allineati a UTC corrispondano all'output diagnostico.
- **Usa una zona IANA fissa** (ad esempio `"Europe/Vienna"`) quando l'host del Gateway si trova in una zona ma l'utente in un'altra e vuoi che gli envelope siano letti nella zona dell'utente indipendentemente dalla migrazione dell'host.
- **Imposta `envelopeTimestamp: "off"`** per envelope a basso numero di token quando il contesto del timestamp non è utile per la conversazione.

Per il riferimento completo del comportamento, esempi per provider e formattazione del tempo trascorso, vedi [Data e ora](/it/date-time).

## Correlati

- [Data e ora](/it/date-time) — comportamento completo di envelope/strumenti/prompt ed esempi.
- [Heartbeat](/it/gateway/heartbeat) — le ore attive usano il fuso orario per la pianificazione.
- [Processi Cron](/it/automation/cron-jobs) — le espressioni cron usano il fuso orario per la pianificazione.
