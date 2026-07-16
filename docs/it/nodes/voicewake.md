---
read_when:
    - Modifica del comportamento o delle impostazioni predefinite delle parole di attivazione vocale
    - Aggiunta di nuove piattaforme Node che richiedono la sincronizzazione della parola di attivazione
summary: Parole di attivazione vocale globali (gestite dal Gateway) e relativa sincronizzazione tra i nodi
title: Attivazione vocale
x-i18n:
    generated_at: "2026-07-16T14:34:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

Le parole di attivazione sono **un unico elenco globale gestito dal Gateway** — non esistono elenchi personalizzati per singolo nodo. Qualsiasi nodo o interfaccia utente dell'app può modificare l'elenco; il Gateway salva la modifica e la trasmette a tutti i client connessi.

- **macOS**: opzione locale per abilitare o disabilitare Voice Wake. Richiede macOS 26+; consultare [Attivazione vocale (macOS)](/it/platforms/mac/voicewake) per i dettagli su runtime/PTT.
- **iOS**: opzione locale per abilitare o disabilitare Voice Wake in Settings.
- **Android**: opzione locale per abilitare o disabilitare Voice Wake ed editor delle parole di attivazione in Settings → Voice. Richiede il riconoscimento vocale sul dispositivo di Android.

## Archiviazione

Le parole di attivazione e le regole di instradamento risiedono nel database di stato del Gateway, `~/.openclaw/state/openclaw.sqlite` per impostazione predefinita (sostituibile con `OPENCLAW_STATE_DIR`), nelle tabelle `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`. I precedenti `settings/voicewake.json` e `settings/voicewake-routing.json` sono esclusivamente input di migrazione per `openclaw doctor --fix` — il runtime non li legge mai.

## Protocollo

### Elenco degli attivatori

| Metodo          | Parametri                | Risultato                |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | nessuno                  | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normalizza l'input: rimuove gli spazi iniziali e finali, elimina le voci vuote, conserva al massimo 32 attivatori e tronca ciascuno a 64 unità di codice UTF-16 senza dividere le coppie surrogate. Se il risultato è vuoto, vengono usati i valori predefiniti integrati (`openclaw`, `claude`, `computer`).

### Instradamento (dall'attivatore alla destinazione)

| Metodo                  | Parametri                            | Risultato                            |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | nessuno                              | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Ogni percorso `target` supporta esattamente una delle seguenti opzioni:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Limiti: al massimo 32 percorsi, testo dell'attivatore di massimo 64 caratteri. Gli attivatori dei percorsi vengono normalizzati per il confronto e il rilevamento dei duplicati convertendoli in minuscolo, rimuovendo la punteggiatura iniziale e finale da ogni parola e comprimendo gli spazi (`"Hey, Bot!!"` e `"hey bot"` corrispondono e vengono considerati duplicati) — si tratta di una normalizzazione più rigorosa rispetto alla semplice rimozione degli spazi usata per l'elenco globale degli attivatori precedente.

### Eventi

| Evento                      | Payload                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Entrambi vengono trasmessi a ogni client WebSocket con ambito di lettura (app macOS, WebChat e simili) e a ogni nodo connesso. Un nodo li riceve entrambi anche come snapshot iniziale subito dopo la connessione.

## Comportamento dei client

- **macOS**: chiama `voicewake.set`/`voicewake.get` e resta in ascolto di `voicewake.changed` per mantenersi sincronizzato con gli altri client.
- **iOS**: chiama `voicewake.set`/`voicewake.get` e resta in ascolto di `voicewake.changed` per mantenere reattivo il rilevamento locale delle parole di attivazione.
- **Android**: chiama `voicewake.set`/`voicewake.get`, resta in ascolto di `voicewake.changed` e pubblicizza `voiceWake` quando è abilitato. Il riconoscimento rimane sul dispositivo e funziona solo in primo piano; viene sospeso quando Talk, la dettatura manuale, l'acquisizione di note vocali o la sintesi vocale dei messaggi utilizzano l'audio.

## Contenuti correlati

- [Modalità Talk](/it/nodes/talk)
- [Audio e note vocali](/it/nodes/audio)
- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding)
