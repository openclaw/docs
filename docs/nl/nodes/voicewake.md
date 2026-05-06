---
read_when:
    - Gedrag of standaardinstellingen voor spraakwekwoorden wijzigen
    - Nieuwe Node-platforms toevoegen waarvoor synchronisatie van wekwoorden nodig is
summary: Globale spraakwekwoorden (in beheer van de Gateway) en hoe ze tussen nodes synchroniseren
title: Spraakactivering
x-i18n:
    generated_at: "2026-05-06T09:22:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: a284cbe3e12784a8d7a3eab6ba8ae230123557bca7593c956111199b94b91b73
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw behandelt **wekwoorden als één globale lijst** die eigendom is van de **Gateway**.

- Er zijn **geen aangepaste wekwoorden per node**.
- **Elke node-/app-UI kan** de lijst bewerken; wijzigingen worden door de Gateway opgeslagen en naar iedereen uitgezonden.
- macOS en iOS behouden lokale schakelaars voor **spraakactivering ingeschakeld/uitgeschakeld** (lokale UX en machtigingen verschillen).
- Android houdt spraakactivering momenteel uitgeschakeld en gebruikt een handmatige microfoonflow in het tabblad Spraak.

## Opslag (Gateway-host)

Wekwoorden worden op de gatewaymachine opgeslagen op:

- `~/.openclaw/settings/voicewake.json`

Vorm:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocol

### Methoden

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` met params `{ triggers: string[] }` → `{ triggers: string[] }`

Opmerkingen:

- Triggers worden genormaliseerd (bijgesneden, lege waarden verwijderd). Lege lijsten vallen terug op standaardwaarden.
- Limieten worden afgedwongen voor veiligheid (limieten voor aantal/lengte).

### Routeringsmethoden (trigger → doel)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` met params `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Vorm van `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Routedoelen ondersteunen exact één van:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Gebeurtenissen

- `voicewake.changed` payload `{ triggers: string[] }`
- `voicewake.routing.changed` payload `{ config: VoiceWakeRoutingConfig }`

Wie dit ontvangt:

- Alle WebSocket-clients (macOS-app, WebChat, enz.)
- Alle verbonden nodes (iOS/Android), en ook bij het verbinden van een node als een initiële push met de "huidige status".

## Clientgedrag

### macOS-app

- Gebruikt de globale lijst om `VoiceWakeRuntime`-triggers te gate'en.
- Het bewerken van "Triggerwoorden" in de instellingen voor spraakactivering roept `voicewake.set` aan en vertrouwt vervolgens op de broadcast om andere clients gesynchroniseerd te houden.

### iOS-node

- Gebruikt de globale lijst voor triggerdetectie door `VoiceWakeManager`.
- Het bewerken van wekwoorden in Instellingen roept `voicewake.set` aan (via de Gateway-WS) en houdt lokale wekwoorddetectie ook responsief.

### Android-node

- Spraakactivering is momenteel uitgeschakeld in de Android-runtime/-instellingen.
- Android-spraak gebruikt handmatige microfoonopname in het tabblad Spraak in plaats van wekwoordtriggers.

## Gerelateerd

- [Praatmodus](/nl/nodes/talk)
- [Audio en spraaknotities](/nl/nodes/audio)
- [Mediabegrip](/nl/nodes/media-understanding)
