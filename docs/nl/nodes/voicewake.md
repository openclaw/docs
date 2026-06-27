---
read_when:
    - Gedrag of standaardinstellingen van spraakactiveringswoorden wijzigen
    - Nieuwe node-platforms toevoegen die wake-word-synchronisatie nodig hebben
summary: Globale spraakwekwoorden (eigendom van Gateway) en hoe ze tussen nodes synchroniseren
title: Spraakactivering
x-i18n:
    generated_at: "2026-06-27T17:45:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw behandelt **wekwoorden als één globale lijst** die eigendom is van de **Gateway**.

- Er zijn **geen aangepaste wekwoorden per node**.
- **Elke node-/app-UI mag** de lijst bewerken; wijzigingen worden door de Gateway opgeslagen en naar iedereen uitgezonden.
- macOS en iOS behouden lokale schakelaars voor **Voice Wake ingeschakeld/uitgeschakeld** (lokale UX + machtigingen verschillen).
- Android houdt Voice Wake momenteel uitgeschakeld en gebruikt een handmatige microfoonflow in het tabblad Voice.

## Opslag (Gateway-host)

Wekwoorden en routeringsregels worden opgeslagen in de gateway-statusdatabase:

- `~/.openclaw/state/openclaw.sqlite`

De actieve tabellen zijn:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

Verouderde bestanden `settings/voicewake.json` en `settings/voicewake-routing.json` zijn
alleen invoer voor doctor-migratie; de runtime leest en schrijft de SQLite-tabellen.

## Protocol

### Methoden

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` met parameters `{ triggers: string[] }` → `{ triggers: string[] }`

Opmerkingen:

- Triggers worden genormaliseerd (bijgesneden, lege waarden verwijderd). Lege lijsten vallen terug op standaardwaarden.
- Limieten worden om veiligheidsredenen afgedwongen (maxima voor aantal/lengte).

### Routeringsmethoden (trigger → doel)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` met parameters `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Vorm van `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Routedoelen ondersteunen precies één van:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Gebeurtenissen

- `voicewake.changed` payload `{ triggers: string[] }`
- `voicewake.routing.changed` payload `{ config: VoiceWakeRoutingConfig }`

Wie ontvangt dit:

- Alle WebSocket-clients (macOS-app, WebChat, enz.)
- Alle verbonden nodes (iOS/Android), en ook bij node-verbinding als een initiële push van de "huidige status".

## Clientgedrag

### macOS-app

- Gebruikt de globale lijst om `VoiceWakeRuntime`-triggers te bewaken.
- Het bewerken van "Trigger words" in Voice Wake-instellingen roept `voicewake.set` aan en vertrouwt daarna op de uitzending om andere clients synchroon te houden.

### iOS-node

- Gebruikt de globale lijst voor triggerdetectie met `VoiceWakeManager`.
- Het bewerken van Wake Words in Settings roept `voicewake.set` aan (via de Gateway WS) en houdt lokale wekwoorddetectie ook responsief.

### Android-node

- Voice Wake is momenteel uitgeschakeld in de Android-runtime/-instellingen.
- Android-spraak gebruikt handmatige microfoonopname in het tabblad Voice in plaats van wekwoordtriggers.

## Gerelateerd

- [Praatmodus](/nl/nodes/talk)
- [Audio en spraaknotities](/nl/nodes/audio)
- [Mediabegrip](/nl/nodes/media-understanding)
