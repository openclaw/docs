---
read_when:
    - Modifica del comportamento o dei valori predefiniti degli indicatori di digitazione
summary: Quando OpenClaw mostra gli indicatori di digitazione e come configurarli
title: Indicatori di digitazione
x-i18n:
    generated_at: "2026-04-05T13:50:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28c8c395a135fc0745181aab66a93582177e6acd0b3496debcbb98159a4f11dc
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Indicatori di digitazione

Gli indicatori di digitazione vengono inviati al canale della chat mentre un'esecuzione è attiva. Usa
`agents.defaults.typingMode` per controllare **quando** inizia la digitazione e `typingIntervalSeconds`
per controllare **quanto spesso** viene aggiornata.

## Valori predefiniti

Quando `agents.defaults.typingMode` è **non impostato**, OpenClaw mantiene il comportamento legacy:

- **Chat dirette**: la digitazione inizia immediatamente non appena comincia il loop del modello.
- **Chat di gruppo con una menzione**: la digitazione inizia immediatamente.
- **Chat di gruppo senza una menzione**: la digitazione inizia solo quando il testo del messaggio comincia a essere trasmesso in streaming.
- **Esecuzioni heartbeat**: la digitazione è disabilitata.

## Modalità

Imposta `agents.defaults.typingMode` su uno dei seguenti valori:

- `never` — nessun indicatore di digitazione, mai.
- `instant` — avvia la digitazione **non appena inizia il loop del modello**, anche se l'esecuzione
  in seguito restituisce solo il token di risposta silenziosa.
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

Puoi sovrascrivere modalità o frequenza per sessione:

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
  payload corrisponde esattamente al token silenzioso (ad esempio `NO_REPLY` / `no_reply`,
  con corrispondenza case-insensitive).
- `thinking` si attiva solo se l'esecuzione trasmette in streaming il ragionamento (`reasoningLevel: "stream"`).
  Se il modello non emette delta di ragionamento, la digitazione non inizierà.
- Gli heartbeat non mostrano mai la digitazione, indipendentemente dalla modalità.
- `typingIntervalSeconds` controlla la **frequenza di aggiornamento**, non il momento di avvio.
  Il valore predefinito è 6 secondi.
