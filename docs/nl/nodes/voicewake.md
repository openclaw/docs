---
read_when:
    - Gedrag of standaardinstellingen voor stemactiveringswoorden wijzigen
    - Nieuwe Node-platforms toevoegen die synchronisatie van het activatiewoord nodig hebben
summary: Globale activeringswoorden voor spraak (beheerd door de Gateway) en hoe ze tussen nodes worden gesynchroniseerd
title: Stemactivatie
x-i18n:
    generated_at: "2026-07-16T16:02:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

Wakewoorden zijn **één algemene lijst die eigendom is van de Gateway** — er zijn geen aangepaste lijsten per Node. Elke Node of appinterface kan de lijst bewerken; de Gateway slaat de wijziging permanent op en stuurt deze naar elke verbonden client.

- **macOS**: lokale schakelaar om Voice Wake in of uit te schakelen. Vereist macOS 26+; zie [Voice Wake (macOS)](/nl/platforms/mac/voicewake) voor details over runtime/PTT.
- **iOS**: lokale schakelaar om Voice Wake in of uit te schakelen in Settings.
- **Android**: lokale schakelaar om Voice Wake in of uit te schakelen en editor voor wakewoorden in Settings → Voice. Vereist spraakherkenning op het Android-apparaat.

## Opslag

Wakewoorden en routeringsregels bevinden zich in de statusdatabase van de Gateway, standaard `~/.openclaw/state/openclaw.sqlite` (overschrijf dit met `OPENCLAW_STATE_DIR`), in de tabellen `voicewake_triggers`, `voicewake_routing_config` en `voicewake_routing_routes`. Verouderde `settings/voicewake.json` en `settings/voicewake-routing.json` dienen uitsluitend als invoer voor `openclaw doctor --fix`-migratie — de runtime leest ze nooit.

## Protocol

### Triggerlijst

| Methode          | Parameters               | Resultaat                |
| ---------------- | ------------------------ | ------------------------ |
| `voicewake.get` | geen                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normaliseert de invoer: verwijdert witruimte aan het begin en einde, verwijdert lege vermeldingen, behoudt maximaal 32 triggers en kort elke trigger in tot 64 UTF-16-code-eenheden zonder surrogateparen te splitsen. Bij een leeg resultaat worden de ingebouwde standaardwaarden gebruikt (`openclaw`, `claude`, `computer`).

### Routering (trigger naar doel)

| Methode                 | Parameters                           | Resultaat                            |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | geen                                 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Elke route `target` ondersteunt precies één van:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Limieten: maximaal 32 routes en triggertekst van maximaal 64 tekens. Routetriggers worden voor overeenkomsten en detectie van duplicaten genormaliseerd door ze om te zetten naar kleine letters, leestekens aan het begin en einde van elk woord te verwijderen en witruimte samen te voegen (`"Hey, Bot!!"` en `"hey bot"` komen overeen en gelden als duplicaten) — dit is een strengere normalisatie dan het uitsluitend verwijderen van witruimte aan het begin en einde voor de algemene triggerlijst hierboven.

### Gebeurtenissen

| Gebeurtenis                 | Payload                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Beide worden verstuurd naar elke WebSocket-client met leesbereik (macOS-app, WebChat en vergelijkbare clients) en naar elke verbonden Node. Een Node ontvangt beide ook als een eerste momentopname direct nadat deze verbinding maakt.

## Clientgedrag

- **macOS**: roept `voicewake.set`/`voicewake.get` aan en luistert naar `voicewake.changed` om met andere clients gesynchroniseerd te blijven.
- **iOS**: roept `voicewake.set`/`voicewake.get` aan en luistert naar `voicewake.changed` om de lokale detectie van wakewoorden responsief te houden.
- **Android**: roept `voicewake.set`/`voicewake.get` aan, luistert naar `voicewake.changed` en maakt `voiceWake` bekend zolang de functie is ingeschakeld. Herkenning blijft op het apparaat en werkt alleen op de voorgrond; deze wordt gepauzeerd wanneer Talk, handmatig dicteren, het opnemen van een spraakbericht of berichtspraak de audio gebruikt.

## Gerelateerd

- [Talk-modus](/nl/nodes/talk)
- [Audio en spraakberichten](/nl/nodes/audio)
- [Mediabegrip](/nl/nodes/media-understanding)
