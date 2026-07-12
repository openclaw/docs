---
read_when:
    - De weergave van assistentuitvoer in de Control UI wijzigen
    - Foutopsporing van `[embed ...]`, gestructureerde media-, antwoord- of audiopresentatierichtlijnen
summary: Rich-outputprotocol voor gestructureerde media, embeds, audio-aanwijzingen en antwoorden
title: Protocol voor rijke uitvoer
x-i18n:
    generated_at: "2026-07-12T09:17:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Assistentuitvoer geeft instructies voor aflevering/weergave door via enkele speciale kanalen:

- Gestructureerde velden `mediaUrl` / `mediaUrls` voor het afleveren van bijlagen.
- `[[audio_as_voice]]` voor aanwijzingen over audioweergave.
- `[[reply_to_current]]` / `[[reply_to:<id>]]` voor antwoordmetagegevens.
- `[embed ...]` voor uitgebreide weergave in de Control UI.

Gestructureerde mediavelden en `[[...]]`-tags zijn afleveringsmetagegevens. `[embed ...]` is het afzonderlijke, uitsluitend voor het web bestemde pad voor uitgebreide weergave; het is geen media-alias.

## Mediabijlagen

Externe bijlagen moeten openbare `https:`-URL's zijn. `http:`, local loopback, link-local, privé- en interne hostnamen worden geweigerd als bijlage-instructies; mediaservers die media ophalen, passen daarnaast hun eigen netwerkbeveiligingen toe.

Lokale bijlagen accepteren absolute paden, werkruimterelatieve paden of thuisdirectoryrelatieve `~/`-paden. Vóór aflevering worden ze nog steeds getoetst aan het bestandsleesbeleid van de agent en aan controles van het mediatype.

<Warning>
Genereer geen tekstopdrachten voor bijlagen vanuit tools, plugins, streamingblokken, browseruitvoer of berichtacties. Gebruik in plaats daarvan gestructureerde mediavelden:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

Oudere tekst in het definitieve antwoord kan voor compatibiliteit nog steeds worden genormaliseerd, maar dit is geen algemeen protocol voor plugins/tools.
</Warning>

Gewone Markdown-afbeeldingssyntaxis (`![alt](url)`) blijft standaard tekst. Kanalen die Markdown-afbeeldingen als media-antwoorden willen behandelen, schakelen dit in via hun uitgaande adapter; Telegram doet dit, zodat `![alt](url)` een mediabijlage wordt.

Wanneer blokstreaming is ingeschakeld, moeten media via gestructureerde payloadvelden worden verzonden. Als dezelfde media-URL in een gestreamd blok en opnieuw in de uiteindelijke assistentpayload voorkomt, levert OpenClaw deze eenmaal af en verwijdert het duplicaat uit de uiteindelijke payload.

## `[embed ...]`

`[embed ...]` is de enige op agents gerichte syntaxis voor uitgebreide weergave in de Control UI. Zelfsluitend voorbeeld:

```text
[embed ref="cv_123" title="Status" /]
```

Regels:

- `[view ...]` is niet langer geldig voor nieuwe uitvoer.
- Embed-shortcodes worden alleen weergegeven in het assistentberichtvlak.
- Alleen door URL's ondersteunde embeds worden weergegeven; gebruik `ref="..."` of `url="..."`.
- Inline HTML-embedshortcodes in blokvorm worden niet weergegeven.
- De webinterface verwijdert de shortcode uit de zichtbare tekst en geeft de embed inline weer.

## Opgeslagen weergavestructuur

Het genormaliseerde/opgeslagen inhoudsblok van de assistent is een gestructureerd `canvas`-item:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

`present_view` wordt niet herkend; opgeslagen/weergegeven uitgebreide blokken gebruiken altijd deze `canvas`-structuur.

## Gerelateerd

- [RPC-adapters](/nl/reference/rpc)
- [Typebox](/nl/concepts/typebox)
