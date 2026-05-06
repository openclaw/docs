---
read_when:
    - Modificare il comportamento o i valori predefiniti dell'indicatore di digitazione
summary: Quando OpenClaw mostra gli indicatori di digitazione e come configurarli
title: Indicatori di digitazione
x-i18n:
    generated_at: "2026-05-06T08:48:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Gli indicatori di digitazione vengono inviati al canale di chat mentre un'esecuzione è attiva. Usa
`agents.defaults.typingMode` per controllare **quando** inizia la digitazione e `typingIntervalSeconds`
per controllare **con quale frequenza** viene aggiornata.

## Valori predefiniti

Quando `agents.defaults.typingMode` **non è impostato**, OpenClaw mantiene il comportamento legacy:

- **Chat dirette**: la digitazione inizia immediatamente appena comincia il loop del modello.
- **Chat di gruppo con una menzione**: la digitazione inizia immediatamente.
- **Chat di gruppo senza una menzione**: la digitazione inizia solo quando il testo del messaggio comincia lo streaming.
- **Esecuzioni Heartbeat**: la digitazione inizia quando l'esecuzione Heartbeat comincia se la
  destinazione Heartbeat risolta è una chat che supporta la digitazione e la digitazione non è disabilitata.

## Modalità

Imposta `agents.defaults.typingMode` su uno di questi valori:

- `never` - nessun indicatore di digitazione, mai.
- `instant` - avvia la digitazione **appena comincia il loop del modello**, anche se l'esecuzione
  in seguito restituisce solo il token di risposta silenziosa.
- `thinking` - avvia la digitazione al **primo delta di ragionamento** (richiede
  `reasoningLevel: "stream"` per l'esecuzione).
- `message` - avvia la digitazione al **primo delta di testo non silenzioso** (ignora
  il token silenzioso `NO_REPLY`).

Ordine di "quanto presto si attiva":
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

Puoi sovrascrivere la modalità o la cadenza per sessione:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Note

- La modalità `message` non mostra la digitazione per risposte solo silenziose quando l'intero
  payload è il token silenzioso esatto (ad esempio `NO_REPLY` / `no_reply`,
  confrontato senza distinzione tra maiuscole e minuscole).
- `thinking` si attiva solo se l'esecuzione trasmette in streaming il ragionamento (`reasoningLevel: "stream"`).
  Se il modello non emette delta di ragionamento, la digitazione non inizierà.
- La digitazione Heartbeat è un segnale di liveness per la destinazione di recapito risolta. Inizia
  all'avvio dell'esecuzione Heartbeat invece di seguire la tempistica dello stream di `message` o `thinking`.
  Imposta `typingMode: "never"` per disabilitarla.
- Gli Heartbeat non mostrano la digitazione quando `target: "none"`, quando la destinazione non può
  essere risolta, quando il recapito in chat è disabilitato per l'Heartbeat o quando il
  canale non supporta la digitazione.
- `typingIntervalSeconds` controlla la **cadenza di aggiornamento**, non l'ora di inizio.
  Il valore predefinito è 6 secondi.

## Correlati

<CardGroup cols={2}>
  <Card title="Presence" href="/it/concepts/presence" icon="signal">
    Come il Gateway traccia i client connessi e li mostra nella scheda Istanze di macOS.
  </Card>
  <Card title="Streaming and chunking" href="/it/concepts/streaming" icon="bars-staggered">
    Comportamento dello streaming in uscita, confini dei chunk e recapito specifico del canale.
  </Card>
</CardGroup>
