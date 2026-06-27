---
read_when:
    - Modifica del comportamento o delle impostazioni predefinite delle parole di attivazione vocali
    - Aggiungere nuove piattaforme Node che richiedono la sincronizzazione della wake word
summary: Parole di attivazione vocali globali (di proprietà del Gateway) e come si sincronizzano tra i nodi
title: Attivazione vocale
x-i18n:
    generated_at: "2026-06-27T17:43:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw tratta le **parole di attivazione come un unico elenco globale** gestito dal **Gateway**.

- Non ci sono **parole di attivazione personalizzate per nodo**.
- **Qualsiasi interfaccia utente di nodo/app può modificare** l'elenco; le modifiche vengono mantenute dal Gateway e trasmesse a tutti.
- macOS e iOS mantengono toggle locali per **abilitare/disabilitare Voice Wake** (UX locale + permessi differiscono).
- Android attualmente mantiene Voice Wake disattivato e usa un flusso manuale del microfono nella scheda Voce.

## Archiviazione (host Gateway)

Le parole di attivazione e le regole di routing sono archiviate nel database di stato del gateway:

- `~/.openclaw/state/openclaw.sqlite`

Le tabelle attive sono:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

I file legacy `settings/voicewake.json` e `settings/voicewake-routing.json` sono
solo input di migrazione per doctor; il runtime legge e scrive le tabelle SQLite.

## Protocollo

### Metodi

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` con parametri `{ triggers: string[] }` → `{ triggers: string[] }`

Note:

- I trigger vengono normalizzati (spazi iniziali/finali rimossi, valori vuoti eliminati). Gli elenchi vuoti tornano ai valori predefiniti.
- I limiti vengono applicati per sicurezza (limiti di numero/lunghezza).

### Metodi di routing (trigger → destinazione)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` con parametri `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Forma di `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Le destinazioni delle route supportano esattamente una tra:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Eventi

- payload `voicewake.changed` `{ triggers: string[] }`
- payload `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Chi lo riceve:

- Tutti i client WebSocket (app macOS, WebChat, ecc.)
- Tutti i nodi connessi (iOS/Android), e anche alla connessione del nodo come push iniziale dello "stato corrente".

## Comportamento del client

### App macOS

- Usa l'elenco globale per controllare i trigger di `VoiceWakeRuntime`.
- La modifica di "Parole trigger" nelle impostazioni di Voice Wake chiama `voicewake.set` e poi si affida alla trasmissione per mantenere sincronizzati gli altri client.

### Nodo iOS

- Usa l'elenco globale per il rilevamento dei trigger di `VoiceWakeManager`.
- La modifica delle parole di attivazione nelle Impostazioni chiama `voicewake.set` (tramite Gateway WS) e mantiene anche reattivo il rilevamento locale delle parole di attivazione.

### Nodo Android

- Voice Wake è attualmente disabilitato nel runtime/nelle Impostazioni di Android.
- La voce su Android usa l'acquisizione manuale del microfono nella scheda Voce invece dei trigger con parole di attivazione.

## Correlati

- [Modalità conversazione](/it/nodes/talk)
- [Audio e note vocali](/it/nodes/audio)
- [Comprensione dei media](/it/nodes/media-understanding)
