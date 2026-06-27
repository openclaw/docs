---
read_when:
    - Modifica del comportamento o dei valori predefiniti dell'indicatore di digitazione
summary: Quando OpenClaw mostra gli indicatori di digitazione e come configurarli
title: Indicatori di digitazione
x-i18n:
    generated_at: "2026-06-27T17:29:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Gli indicatori di digitazione vengono inviati al canale di chat mentre un'esecuzione è attiva. Usa
`agents.defaults.typingMode` per controllare **quando** inizia la digitazione e `typingIntervalSeconds`
per controllare **con quale frequenza** si aggiorna.

## Valori predefiniti

Quando `agents.defaults.typingMode` **non è impostato**, OpenClaw mantiene il comportamento legacy:

- **Chat dirette**: la digitazione inizia immediatamente quando parte il ciclo del modello.
- **Chat di gruppo con una menzione**: la digitazione inizia immediatamente.
- **Chat di gruppo senza una menzione**: la digitazione inizia quando l'esecuzione ammessa ha
  attività visibile all'utente, come attività di esecuzione dell'harness o testo del messaggio.
- **Esecuzioni Heartbeat**: la digitazione inizia quando parte l'esecuzione Heartbeat se la
  destinazione Heartbeat risolta è una chat che supporta la digitazione e la digitazione non è disabilitata.

## Modalità

Imposta `agents.defaults.typingMode` su uno di questi valori:

- `never` - nessun indicatore di digitazione, mai.
- `instant` - inizia a digitare **appena parte il ciclo del modello**, anche se l'esecuzione
  in seguito restituisce solo il token di risposta silenziosa.
- `thinking` - inizia a digitare al **primo delta di ragionamento** o durante l'esecuzione
  attiva dell'harness dopo che il turno è stato accettato.
- `message` - inizia a digitare alla **prima attività di risposta visibile all'utente**, come
  esecuzione attiva dell'harness o un delta di testo non silenzioso. I token di risposta silenziosa
  come `NO_REPLY` non contano come attività testuale.

Ordine di "quanto presto si attiva":
`never` → `message`/`thinking` → `instant`

## Configurazione

Imposta il valore predefinito a livello di agente:

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

Sostituisci la modalità o la cadenza per sessione:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Note

- La modalità `message` non si avvia dai token di risposta silenziosa, ma l'esecuzione attiva
  può comunque mostrare la digitazione prima che sia disponibile qualsiasi testo dell'assistente.
- `thinking` reagisce comunque al ragionamento in streaming (`reasoningLevel: "stream"`),
  e può anche avviarsi dall'esecuzione attiva prima che arrivino i delta di ragionamento.
- La digitazione Heartbeat è un segnale di operatività per la destinazione di recapito risolta. Si
  avvia all'inizio dell'esecuzione Heartbeat invece di seguire i tempi dello stream di `message` o `thinking`.
  Imposta `typingMode: "never"` per disabilitarla.
- Gli Heartbeat non mostrano la digitazione quando `target: "none"`, quando la destinazione non può
  essere risolta, quando il recapito in chat è disabilitato per l'Heartbeat o quando il
  canale non supporta la digitazione.
- `typingIntervalSeconds` controlla la **cadenza di aggiornamento**, non l'ora di avvio.
  Il valore predefinito è 6 secondi.

## Correlati

<CardGroup cols={2}>
  <Card title="Presence" href="/it/concepts/presence" icon="signal">
    Come il Gateway tiene traccia dei client connessi e li mostra nella scheda Istanze di macOS.
  </Card>
  <Card title="Streaming and chunking" href="/it/concepts/streaming" icon="bars-staggered">
    Comportamento dello streaming in uscita, limiti dei chunk e recapito specifico del canale.
  </Card>
</CardGroup>
