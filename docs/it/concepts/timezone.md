---
read_when:
    - Vuoi un modello mentale rapido per la gestione dei fusi orari
    - Stai decidendo dove impostare o sovrascrivere un fuso orario
summary: Dove compaiono i fusi orari in OpenClaw — envelope, payload degli strumenti, prompt di sistema
title: Fusi orari
x-i18n:
    generated_at: "2026-06-27T17:28:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standardizza i timestamp in modo che il modello veda un **unico orario di riferimento** invece di un insieme di orologi locali dei provider. Ci sono tre superfici in cui compaiono i fusi orari, ciascuna con il proprio scopo:

## Tre superfici dei fusi orari

| Superficie        | Cosa mostra                                                                                            | Predefinito                           | Configurato tramite                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| Involucri messaggio | Racchiude i messaggi in ingresso dai canali: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`       | Locale dell'host                      | `agents.defaults.envelopeTimezone`                      |
| Payload degli strumenti | Gli strumenti di canale in stile `readMessages` restituiscono l'ora grezza del provider + `timestampMs` / `timestampUtc` normalizzati | Campi UTC sempre presenti             | Non configurabile — preserva i timestamp nativi del provider |
| Prompt di sistema | Un piccolo blocco `Current Date & Time` con **solo il fuso orario** (nessun valore dell'orologio, per la stabilità della cache) | Fuso orario dell'host se `userTimezone` non è impostato | `agents.defaults.userTimezone`                          |

Il prompt di sistema omette deliberatamente l'orologio in tempo reale per mantenere stabile la cache dei prompt tra i turni. Quando l'agente ha bisogno dell'ora corrente, chiama `session_status`.

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

Se `userTimezone` non è impostato, OpenClaw risolve il fuso orario dell'host in fase di esecuzione (senza scrivere configurazione). `agents.defaults.timeFormat` (`auto` | `12` | `24`) controlla il rendering a 12/24 ore negli involucri e nelle superfici a valle, non nella sezione del prompt di sistema.

## Quando eseguire l'override

- **Usa involucri UTC** (`envelopeTimezone: "utc"`) quando vuoi timestamp stabili tra host in regioni diverse, o quando vuoi log allineati a UTC che corrispondano all'output di diagnostica.
- **Usa una zona IANA fissa** (ad es. `"Europe/Vienna"`) quando l'host Gateway si trova in una zona ma l'utente in un'altra e vuoi che gli involucri siano letti nella zona dell'utente indipendentemente dalla migrazione dell'host.
- **Imposta `envelopeTimestamp: "off"`** quando il contesto del timestamp non è utile per la conversazione. Questo rimuove i timestamp assoluti dagli involucri, dai prefissi diretti dei prompt dell'agente e dai prefissi incorporati nell'input del modello.

Per il riferimento completo del comportamento, esempi per provider e formattazione del tempo trascorso, consulta [Data e ora](/it/date-time).

## Correlati

- [Data e ora](/it/date-time) — comportamento completo di involucri/strumenti/prompt ed esempi.
- [Heartbeat](/it/gateway/heartbeat) — le ore attive usano il fuso orario per la pianificazione.
- [Processi Cron](/it/automation/cron-jobs) — le espressioni Cron usano il fuso orario per la pianificazione.
