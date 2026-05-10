---
read_when:
    - Modifica del comportamento o dei valori predefiniti dell'indicatore di digitazione
summary: Quando OpenClaw mostra gli indicatori di digitazione e come regolarli
title: Indicatori di digitazione
x-i18n:
    generated_at: "2026-05-10T19:33:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Gli indicatori di digitazione vengono inviati al canale di chat mentre un'esecuzione è attiva. Usa
`agents.defaults.typingMode` per controllare **quando** inizia la digitazione e `typingIntervalSeconds`
per controllare **con quale frequenza** viene aggiornata.

## Valori predefiniti

Quando `agents.defaults.typingMode` è **non impostato**, OpenClaw mantiene il comportamento legacy:

- **Chat dirette**: la digitazione inizia immediatamente quando parte il ciclo del modello.
- **Chat di gruppo con una menzione**: la digitazione inizia immediatamente.
- **Chat di gruppo senza una menzione**: la digitazione inizia solo quando il testo del messaggio inizia lo streaming.
- **Esecuzioni Heartbeat**: la digitazione inizia quando l'esecuzione Heartbeat parte, se la
  destinazione Heartbeat risolta è una chat che supporta la digitazione e la digitazione non è disabilitata.

## Modalità

Imposta `agents.defaults.typingMode` su uno di questi valori:

- `never` - nessun indicatore di digitazione, mai.
- `instant` - inizia a digitare **non appena parte il ciclo del modello**, anche se l'esecuzione
  in seguito restituisce solo il token di risposta silenziosa.
- `thinking` - inizia a digitare al **primo delta di ragionamento** (richiede
  `reasoningLevel: "stream"` per l'esecuzione).
- `message` - inizia a digitare al **primo delta di testo non silenzioso** (ignora
  il token silenzioso `NO_REPLY`).

Ordine di "quanto presto si attiva":
`never` → `message` → `thinking` → `instant`

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

Sovrascrivi modalità o cadenza per sessione:

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
  payload è il token silenzioso esatto (per esempio `NO_REPLY` / `no_reply`,
  con corrispondenza senza distinzione tra maiuscole e minuscole).
- `thinking` si attiva solo se l'esecuzione trasmette il ragionamento in streaming (`reasoningLevel: "stream"`).
  Se il modello non emette delta di ragionamento, la digitazione non inizierà.
- La digitazione Heartbeat è un segnale di attività per la destinazione di recapito risolta. Inizia
  all'avvio dell'esecuzione Heartbeat invece di seguire la temporizzazione dello stream di `message` o `thinking`.
  Imposta `typingMode: "never"` per disabilitarla.
- Gli Heartbeat non mostrano la digitazione quando `target: "none"`, quando la destinazione non può
  essere risolta, quando il recapito in chat è disabilitato per l'Heartbeat o quando il
  canale non supporta la digitazione.
- `typingIntervalSeconds` controlla la **cadenza di aggiornamento**, non l'ora di inizio.
  Il valore predefinito è 6 secondi.

## Correlati

<CardGroup cols={2}>
  <Card title="Presenza" href="/it/concepts/presence" icon="signal">
    Come il Gateway tiene traccia dei client connessi e li mostra nella scheda Istanze di macOS.
  </Card>
  <Card title="Streaming e suddivisione in blocchi" href="/it/concepts/streaming" icon="bars-staggered">
    Comportamento dello streaming in uscita, limiti dei blocchi e recapito specifico per canale.
  </Card>
</CardGroup>
