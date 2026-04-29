---
read_when:
    - Gedrag of standaardinstellingen van spraakactiveringswoorden wijzigen
    - Nieuwe Node-platforms toevoegen die wekwoord-synchronisatie nodig hebben
summary: Globale spraakwekwoorden (beheerd door Gateway) en hoe ze tussen nodes worden gesynchroniseerd
title: Spraakactivering
x-i18n:
    generated_at: "2026-04-29T22:57:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw behandelt **wake words als één globale lijst** die eigendom is van de **Gateway**.

- Er zijn **geen aangepaste wake words per node**.
- **Elke node/app-UI mag** de lijst bewerken; wijzigingen worden door de Gateway opgeslagen en naar iedereen uitgezonden.
- macOS en iOS behouden lokale schakelaars voor **Spraakactivering ingeschakeld/uitgeschakeld** (lokale UX + toestemmingen verschillen).
- Android houdt Spraakactivering momenteel uitgeschakeld en gebruikt een handmatige microfoonflow op het tabblad Spraak.

## Opslag (Gateway-host)

Wake words worden op de gatewaymachine opgeslagen op:

- `~/.openclaw/settings/voicewake.json`

Vorm:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocol

### Methoden

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` met parameters `{ triggers: string[] }` → `{ triggers: string[] }`

Opmerkingen:

- Triggers worden genormaliseerd (bijgesneden, lege waarden verwijderd). Lege lijsten vallen terug op standaardwaarden.
- Limieten worden afgedwongen voor veiligheid (limieten voor aantal/lengte).

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

Routedoelen ondersteunen exact één van:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Gebeurtenissen

- `voicewake.changed` payload `{ triggers: string[] }`
- `voicewake.routing.changed` payload `{ config: VoiceWakeRoutingConfig }`

Wie ontvangt dit:

- Alle WebSocket-clients (macOS-app, WebChat, enz.)
- Alle verbonden nodes (iOS/Android), en ook bij het verbinden van een node als initiële push van de “huidige toestand”.

## Clientgedrag

### macOS-app

- Gebruikt de globale lijst om `VoiceWakeRuntime`-triggers te regelen.
- Het bewerken van “Triggerwoorden” in de instellingen voor Spraakactivering roept `voicewake.set` aan en vertrouwt vervolgens op de uitzending om andere clients gesynchroniseerd te houden.

### iOS-node

- Gebruikt de globale lijst voor triggerdetectie in `VoiceWakeManager`.
- Het bewerken van Wake Words in Instellingen roept `voicewake.set` aan (via de Gateway-WS) en houdt ook lokale wake-word-detectie responsief.

### Android-node

- Spraakactivering is momenteel uitgeschakeld in Android-runtime/Instellingen.
- Android-spraak gebruikt handmatige microfoonopname op het tabblad Spraak in plaats van wake-word-triggers.

## Gerelateerd

- [Praatmodus](/nl/nodes/talk)
- [Audio en spraaknotities](/nl/nodes/audio)
- [Mediabegrip](/nl/nodes/media-understanding)
