---
read_when:
    - Parsen van kanaallocaties toevoegen of wijzigen
    - Locatiecontextvelden gebruiken in agentprompts of tools
summary: Locatieparsing en contextvelden voor inkomende kanalen (Telegram/WhatsApp/Matrix)
title: Parseren van kanaallocaties
x-i18n:
    generated_at: "2026-04-29T22:25:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 16
---

OpenClaw normaliseert gedeelde locaties uit chatkanalen naar:

- beknopte coördinatentekst die aan de inkomende body wordt toegevoegd, en
- gestructureerde velden in de contextpayload voor automatische antwoorden. Door kanalen geleverde labels, adressen en bijschriften/opmerkingen worden in de prompt weergegeven via het gedeelde niet-vertrouwde metadata-JSON-blok, niet inline in de gebruikersbody.

Momenteel ondersteund:

- **Telegram** (locatiespelden + locaties + live locaties)
- **WhatsApp** (locationMessage + liveLocationMessage)
- **Matrix** (`m.location` met `geo_uri`)

## Tekstopmaak

Locaties worden weergegeven als vriendelijke regels zonder haakjes:

- Speld:
  - `📍 48.858844, 2.294351 ±12m`
- Benoemde plaats:
  - `📍 48.858844, 2.294351 ±12m`
- Live delen:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Als het kanaal een label, adres of bijschrift/opmerking bevat, blijft dit behouden in de contextpayload en verschijnt het in de prompt als omheinde niet-vertrouwde JSON:

````text
Location (untrusted metadata):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## Contextvelden

Wanneer een locatie aanwezig is, worden deze velden toegevoegd aan `ctx`:

- `LocationLat` (getal)
- `LocationLon` (getal)
- `LocationAccuracy` (getal, meters; optioneel)
- `LocationName` (tekenreeks; optioneel)
- `LocationAddress` (tekenreeks; optioneel)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)
- `LocationCaption` (tekenreeks; optioneel)

De prompt-renderer behandelt `LocationName`, `LocationAddress` en `LocationCaption` als niet-vertrouwde metadata en serialiseert ze via hetzelfde begrensde JSON-pad dat voor andere kanaalcontext wordt gebruikt.

## Kanaalnotities

- **Telegram**: locaties worden gekoppeld aan `LocationName/LocationAddress`; live locaties gebruiken `live_period`.
- **WhatsApp**: `locationMessage.comment` en `liveLocationMessage.caption` vullen `LocationCaption`.
- **Matrix**: `geo_uri` wordt geparseerd als een speldlocatie; hoogte wordt genegeerd en `LocationIsLive` is altijd false.

## Gerelateerd

- [Locatieopdracht (nodes)](/nl/nodes/location-command)
- [Camera-opname](/nl/nodes/camera)
- [Media-inzicht](/nl/nodes/media-understanding)
