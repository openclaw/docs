---
read_when:
    - Modifica del comportamento o dei valori predefiniti degli indicatori di digitazione
summary: Quando OpenClaw mostra indicatori di digitazione e come regolarli
title: Indicatori di digitazione
x-i18n:
    generated_at: "2026-04-24T08:38:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 15
---

Gli indicatori di digitazione vengono inviati al canale della chat mentre un'esecuzione è attiva. Usa
`agents.defaults.typingMode` per controllare **quando** inizia la digitazione e `typingIntervalSeconds`
per controllare **con quale frequenza** viene aggiornata.

## Valori predefiniti

Quando `agents.defaults.typingMode` è **non impostato**, OpenClaw mantiene il comportamento legacy:

- **Chat dirette**: la digitazione inizia immediatamente appena parte il loop del modello.
- **Chat di gruppo con una menzione**: la digitazione inizia immediatamente.
- **Chat di gruppo senza menzione**: la digitazione inizia solo quando il testo del messaggio comincia lo streaming.
- **Esecuzioni Heartbeat**: la digitazione inizia quando parte l'esecuzione Heartbeat se la
  destinazione Heartbeat risolta è una chat che supporta la digitazione e la digitazione non è disattivata.

## Modalità

Imposta `agents.defaults.typingMode` su uno dei seguenti valori:

- `never` — nessun indicatore di digitazione, mai.
- `instant` — avvia la digitazione **non appena inizia il loop del modello**, anche se l'esecuzione
  poi restituisce solo il token di risposta silenziosa.
- `thinking` — avvia la digitazione al **primo delta di ragionamento** (richiede
  `reasoningLevel: "stream"` per l'esecuzione).
- `message` — avvia la digitazione al **primo delta di testo non silenzioso** (ignora
  il token silenzioso `NO_REPLY`).

Ordine di “quanto presto si attiva”:
`never` → `message` → `thinking` → `instant`

## Configurazione

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Puoi eseguire l'override della modalità o della cadenza per sessione:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Note

- La modalità `message` non mostrerà la digitazione per risposte solo silenziose quando l'intero
  payload è il token silenzioso esatto (ad esempio `NO_REPLY` / `no_reply`,
  con corrispondenza case-insensitive).
- `thinking` si attiva solo se l'esecuzione trasmette il ragionamento (`reasoningLevel: "stream"`).
  Se il modello non emette delta di ragionamento, la digitazione non inizierà.
- La digitazione Heartbeat è un segnale di liveness per la destinazione di consegna risolta. Essa
  inizia all'avvio dell'esecuzione Heartbeat invece di seguire la tempistica dello stream `message` o `thinking`.
  Imposta `typingMode: "never"` per disattivarla.
- Gli Heartbeat non mostrano la digitazione quando `target: "none"`, quando la destinazione non può
  essere risolta, quando la consegna in chat è disabilitata per l'Heartbeat o quando il
  canale non supporta la digitazione.
- `typingIntervalSeconds` controlla la **cadenza di aggiornamento**, non il momento di avvio.
  Il valore predefinito è 6 secondi.

## Correlati

- [Presence](/it/concepts/presence)
- [Streaming e chunking](/it/concepts/streaming)
