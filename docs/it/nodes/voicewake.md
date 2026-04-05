---
read_when:
    - Modifica del comportamento o dei valori predefiniti delle parole di attivazione vocali
    - Aggiunta di nuove piattaforme nodo che necessitano della sincronizzazione delle wake word
summary: Parole di attivazione vocali globali (gestite dal Gateway) e come si sincronizzano tra i nodi
title: Voice Wake
x-i18n:
    generated_at: "2026-04-05T13:57:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80e0cf7f68a3d48ff79af0ffb3058a7a0ecebd2cdbaad20b9ff53bc2b39dc84
    source_path: nodes/voicewake.md
    workflow: 15
---

# Voice Wake (parole di attivazione globali)

OpenClaw tratta le **wake word come un unico elenco globale** gestito dal **Gateway**.

- Non esistono **wake word personalizzate per nodo**.
- **Qualsiasi UI di nodo/app può modificare** l'elenco; le modifiche vengono rese persistenti dal Gateway e trasmesse a tutti.
- macOS e iOS mantengono toggle locali **Voice Wake abilitato/disabilitato** (UX locale + permessi sono diversi).
- Android al momento mantiene Voice Wake disattivato e usa un flusso microfono manuale nella scheda Voice.

## Archiviazione (host Gateway)

Le wake word vengono memorizzate sulla macchina gateway in:

- `~/.openclaw/settings/voicewake.json`

Struttura:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocollo

### Metodi

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` con parametri `{ triggers: string[] }` → `{ triggers: string[] }`

Note:

- I trigger vengono normalizzati (spazi rimossi ai bordi, valori vuoti scartati). Gli elenchi vuoti tornano ai valori predefiniti.
- I limiti vengono applicati per sicurezza (numero massimo/lunghezza massima).

### Eventi

- payload `voicewake.changed` `{ triggers: string[] }`

Chi lo riceve:

- Tutti i client WebSocket (app macOS, WebChat, ecc.)
- Tutti i nodi connessi (iOS/Android), e anche alla connessione del nodo come push iniziale dello “stato corrente”.

## Comportamento del client

### App macOS

- Usa l'elenco globale per controllare i trigger di `VoiceWakeRuntime`.
- La modifica di “Trigger words” nelle impostazioni di Voice Wake chiama `voicewake.set` e poi si affida alla trasmissione per mantenere sincronizzati gli altri client.

### Nodo iOS

- Usa l'elenco globale per il rilevamento dei trigger di `VoiceWakeManager`.
- La modifica delle Wake Words nelle Impostazioni chiama `voicewake.set` (tramite il Gateway WS) e mantiene anche reattivo il rilevamento locale delle wake word.

### Nodo Android

- Voice Wake è attualmente disabilitato nel runtime/Settings Android.
- La voce su Android usa l'acquisizione manuale del microfono nella scheda Voice invece dei trigger basati su wake word.
