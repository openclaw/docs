---
read_when:
    - Hinzufügen oder Ändern des Kanal-Standort-Parsings
    - Verwenden von Standort-Kontextfeldern in Agent-Prompts oder Tools
summary: Parsing eingehender Kanal-Standorte (Telegram/WhatsApp/Matrix) und Kontextfelder
title: Kanal-Standort-Parsing
x-i18n:
    generated_at: "2026-04-24T06:27:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenClaw normalisiert geteilte Standorte aus Chat-Kanälen in:

- knappen Koordinatentext, der an den eingehenden Body angehängt wird, und
- strukturierte Felder in der Auto-Reply-Kontextnutzlast. Vom Kanal bereitgestellte Labels, Adressen und Bildunterschriften/Kommentare werden über den gemeinsamen JSON-Block für nicht vertrauenswürdige Metadaten in den Prompt gerendert, nicht inline im Benutzer-Body.

Derzeit unterstützt:

- **Telegram** (Standort-Pins + Orte + Live-Standorte)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` mit `geo_uri`)

## Textformatierung

Standorte werden als benutzerfreundliche Zeilen ohne Klammern gerendert:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Benannter Ort:
  - `📍 48.858844, 2.294351 ±12m`
- Live-Freigabe:
  - `🛰 Live-Standort: 48.858844, 2.294351 ±12m`

Wenn der Kanal ein Label, eine Adresse oder eine Bildunterschrift/einen Kommentar enthält, bleibt dies in der Kontextnutzlast erhalten und erscheint im Prompt als eingerahmtes nicht vertrauenswürdiges JSON:

````text
Standort (nicht vertrauenswürdige Metadaten):
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

## Kontextfelder

Wenn ein Standort vorhanden ist, werden diese Felder zu `ctx` hinzugefügt:

- `LocationLat` (Zahl)
- `LocationLon` (Zahl)
- `LocationAccuracy` (Zahl, Meter; optional)
- `LocationName` (String; optional)
- `LocationAddress` (String; optional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (Boolean)
- `LocationCaption` (String; optional)

Der Prompt-Renderer behandelt `LocationName`, `LocationAddress` und `LocationCaption` als nicht vertrauenswürdige Metadaten und serialisiert sie über denselben begrenzten JSON-Pfad, der auch für anderen Kanal-Kontext verwendet wird.

## Kanalhinweise

- **Telegram**: Orte werden `LocationName/LocationAddress` zugeordnet; Live-Standorte verwenden `live_period`.
- **WhatsApp**: `locationMessage.comment` und `liveLocationMessage.caption` füllen `LocationCaption`.
- **Matrix**: `geo_uri` wird als Pin-Standort geparst; die Höhe wird ignoriert und `LocationIsLive` ist immer false.

## Verwandt

- [Standortbefehl (Nodes)](/de/nodes/location-command)
- [Kameraaufnahme](/de/nodes/camera)
- [Medienverständnis](/de/nodes/media-understanding)
