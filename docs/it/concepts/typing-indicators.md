---
read_when:
    - Modifica del comportamento o delle impostazioni predefinite dell'indicatore di digitazione
summary: Quando OpenClaw mostra gli indicatori di digitazione e come regolarli
title: Indicatori di digitazione
x-i18n:
    generated_at: "2026-07-16T14:21:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Gli indicatori di digitazione vengono inviati al canale di chat mentre un'esecuzione è attiva. Usare `agents.defaults.typingMode` per controllare **quando** inizia la digitazione e `typingIntervalSeconds` per controllare **con quale frequenza** viene aggiornata (cadenza keepalive, valore predefinito 6 secondi).

## Valori predefiniti

Quando `agents.defaults.typingMode` **non è impostato**:

- **Chat dirette**: la digitazione inizia immediatamente all'avvio del ciclo del modello.
- **Chat di gruppo con una menzione**: la digitazione inizia immediatamente.
- **Chat di gruppo senza una menzione**: la digitazione inizia quando l'esecuzione ammessa presenta attività visibile all'utente, come attività di esecuzione dell'harness o testo del messaggio.
- **Esecuzioni Heartbeat**: la digitazione inizia all'avvio dell'esecuzione Heartbeat, se la destinazione Heartbeat risolta è una chat che supporta la digitazione e la digitazione non è disabilitata.

## Modalità

Impostare `agents.defaults.typingMode` su uno dei seguenti valori:

- `never` - nessun indicatore di digitazione, mai.
- `instant` - avvia la digitazione **non appena inizia il ciclo del modello**, anche se in seguito l'esecuzione restituisce solo il token di risposta silenziosa.
- `thinking` - avvia la digitazione al **primo delta di ragionamento** oppure durante l'esecuzione attiva dell'harness dopo l'accettazione del turno.
- `message` - avvia la digitazione alla **prima attività di risposta visibile all'utente**, come l'esecuzione attiva dell'harness o un delta di testo non silenzioso. I token di risposta silenziosa come `NO_REPLY` non sono considerati attività testuale.

Ordine in base a "quanto presto si attiva": `never` -> `message`/`thinking` -> `instant`.

## Configurazione

Impostare il valore predefinito a livello di agente:

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

Sovrascrivere la modalità o la cadenza per singola sessione:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Note

- La modalità `message` non si avvia con i token di risposta silenziosa, ma l'esecuzione attiva può comunque mostrare la digitazione prima che sia disponibile qualsiasi testo dell'assistente.
- `thinking` reagisce comunque al ragionamento trasmesso in streaming (`reasoningLevel: "stream"`) e può anche avviarsi con l'esecuzione attiva prima dell'arrivo dei delta di ragionamento.
- La digitazione Heartbeat è un segnale di attività per la destinazione di consegna risolta. Inizia all'avvio dell'esecuzione Heartbeat anziché seguire la temporizzazione dello stream di `message` o `thinking`. Impostare `typingMode: "never"` per disabilitarla.
- Gli Heartbeat non mostrano la digitazione quando la destinazione Heartbeat è `"none"`, quando non è possibile risolvere la destinazione, quando la consegna via chat è disabilitata per l'Heartbeat o quando il canale non supporta la digitazione.
- `typingIntervalSeconds` controlla la **cadenza di aggiornamento**, non l'ora di inizio. Valore predefinito: 6 secondi.

## Correlati

<CardGroup cols={2}>
  <Card title="Presenza" href="/it/concepts/presence" icon="signal">
    Il modo in cui il Gateway tiene traccia dei client connessi per la pagina Dispositivi dell'interfaccia di controllo e la scheda Istanze di macOS.
  </Card>
  <Card title="Streaming e suddivisione in blocchi" href="/it/concepts/streaming" icon="bars-staggered">
    Comportamento dello streaming in uscita, limiti dei blocchi e consegna specifica per canale.
  </Card>
</CardGroup>
