---
read_when:
    - Ondersteuning voor locatie-node of machtigingeninterface toevoegen
    - Android-locatiemachtigingen of voorgrondgedrag ontwerpen
summary: Locatiecommando voor nodes (location.get), machtigingsmodi en Android-gedrag op de voorgrond
title: Locatiecommando
x-i18n:
    generated_at: "2026-04-29T22:57:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 16
---

## TL;DR

- `location.get` is een Node-opdracht (via `node.invoke`).
- Standaard uitgeschakeld.
- Android-appinstellingen gebruiken een selector: Uit / Tijdens gebruik.
- Afzonderlijke schakelaar: Precieze locatie.

## Waarom een selector (niet alleen een schakelaar)

OS-machtigingen hebben meerdere niveaus. We kunnen in de app een selector tonen, maar het OS bepaalt nog steeds de daadwerkelijke toekenning.

- iOS/macOS kan **Tijdens gebruik** of **Altijd** tonen in systeemprompts/Instellingen.
- De Android-app ondersteunt momenteel alleen voorgrondlocatie.
- Precieze locatie is een afzonderlijke toestemming (iOS 14+ “Precies”, Android “fine” versus “coarse”).

De selector in de UI stuurt onze gevraagde modus; de daadwerkelijke toekenning staat in de OS-instellingen.

## Instellingenmodel

Per Node-apparaat:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI-gedrag:

- Het selecteren van `whileUsing` vraagt om voorgrondmachtiging.
- Als het OS het gevraagde niveau weigert, val terug op het hoogste toegekende niveau en toon de status.

## Machtigingstoewijzing (node.permissions)

Optioneel. macOS-Node rapporteert `location` via de machtigingenmap; iOS/Android kan dit weglaten.

## Opdracht: `location.get`

Aangeroepen via `node.invoke`.

Parameters (voorgesteld):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Antwoordpayload:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Fouten (stabiele codes):

- `LOCATION_DISABLED`: selector staat uit.
- `LOCATION_PERMISSION_REQUIRED`: machtiging ontbreekt voor de gevraagde modus.
- `LOCATION_BACKGROUND_UNAVAILABLE`: app draait op de achtergrond maar alleen Tijdens gebruik is toegestaan.
- `LOCATION_TIMEOUT`: geen fix binnen de tijd.
- `LOCATION_UNAVAILABLE`: systeemfout / geen providers.

## Achtergrondgedrag

- De Android-app weigert `location.get` wanneer deze op de achtergrond draait.
- Houd OpenClaw open wanneer je locatie op Android opvraagt.
- Andere Node-platforms kunnen verschillen.

## Integratie met model/tooling

- Tooloppervlak: `nodes`-tool voegt de actie `location_get` toe (Node vereist).
- CLI: `openclaw nodes location get --node <id>`.
- Agentrichtlijnen: roep dit alleen aan wanneer de gebruiker locatie heeft ingeschakeld en de reikwijdte begrijpt.

## UX-tekst (voorgesteld)

- Uit: “Locatie delen is uitgeschakeld.”
- Tijdens gebruik: “Alleen wanneer OpenClaw open is.”
- Precies: “Gebruik precieze GPS-locatie. Schakel uit om geschatte locatie te delen.”

## Gerelateerd

- [Locatieparsing voor kanalen](/nl/channels/location)
- [Camera-opname](/nl/nodes/camera)
- [Praatmodus](/nl/nodes/talk)
