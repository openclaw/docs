---
read_when:
    - Modificare il comportamento o i valori predefiniti delle parole di attivazione vocale
    - Aggiungere nuove piattaforme Node che hanno bisogno della sincronizzazione delle parole di attivazione vocale
summary: Parole di attivazione vocali globali (di proprietà del Gateway) e come si sincronizzano tra i Node
title: Attivazione vocale
x-i18n:
    generated_at: "2026-04-24T08:48:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw tratta le **parole di attivazione** come un'unica lista globale di proprietà del **Gateway**.

- **Non esistono parole di attivazione personalizzate per node**.
- **Qualsiasi UI node/app può modificare** la lista; le modifiche vengono persistite dal Gateway e trasmesse a tutti.
- macOS e iOS mantengono toggle locali **Voice Wake enabled/disabled** (la UX locale + i permessi differiscono).
- Android attualmente mantiene Voice Wake disattivato e usa un flusso microfono manuale nella scheda Voice.

## Archiviazione (host Gateway)

Le parole di attivazione sono memorizzate sulla macchina del gateway in:

- `~/.openclaw/settings/voicewake.json`

Forma:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocollo

### Metodi

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` con parametri `{ triggers: string[] }` → `{ triggers: string[] }`

Note:

- I trigger vengono normalizzati (spazi rimossi, stringhe vuote eliminate). Le liste vuote usano il fallback ai valori predefiniti.
- I limiti vengono applicati per sicurezza (massimi su conteggio/lunghezza).

### Eventi

- payload `voicewake.changed` `{ triggers: string[] }`

Chi lo riceve:

- Tutti i client WebSocket (app macOS, WebChat, ecc.)
- Tutti i node connessi (iOS/Android), e anche alla connessione del node come push iniziale dello “stato corrente”.

## Comportamento del client

### App macOS

- Usa la lista globale per controllare i trigger di `VoiceWakeRuntime`.
- La modifica di “Trigger words” nelle impostazioni di Voice Wake chiama `voicewake.set` e poi si affida al broadcast per mantenere sincronizzati gli altri client.

### Node iOS

- Usa la lista globale per il rilevamento dei trigger di `VoiceWakeManager`.
- La modifica delle Wake Words nelle Impostazioni chiama `voicewake.set` (tramite il Gateway WS) e mantiene anche reattivo il rilevamento locale delle parole di attivazione.

### Node Android

- Voice Wake è attualmente disabilitato nel runtime/nelle Impostazioni di Android.
- Su Android la voce usa l'acquisizione manuale dal microfono nella scheda Voice invece dei trigger delle parole di attivazione.

## Correlati

- [Modalità Talk](/it/nodes/talk)
- [Audio e note vocali](/it/nodes/audio)
- [Comprensione dei media](/it/nodes/media-understanding)
