---
read_when:
    - Assistentuitvoerweergave wijzigen in de Control UI
    - Debuggen van `[embed ...]`, `MEDIA:`, antwoord- of audiopresentatie-instructies
summary: Shortcodeprotocol voor rijke uitvoer voor insluitingen, media, audio-aanwijzingen en antwoorden
title: Protocol voor rijke uitvoer
x-i18n:
    generated_at: "2026-04-29T23:15:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Assistentuitvoer kan een kleine set bezorg-/renderinstructies bevatten:

- `MEDIA:` voor bezorging van bijlagen
- `[[audio_as_voice]]` voor hints voor audiopresentatie
- `[[reply_to_current]]` / `[[reply_to:<id>]]` voor antwoordmetadata
- `[embed ...]` voor rijke rendering in de Control UI

Externe `MEDIA:`-bijlagen moeten openbare `https:`-URL's zijn. Platte `http:`,
loopback, link-local, privé- en interne hostnamen worden genegeerd als bijlage-
instructies; server-side mediafetchers blijven hun eigen netwerkbeveiligingen afdwingen.

Platte Markdown-afbeeldingssyntaxis blijft standaard tekst. Kanalen die Markdown-afbeeldingsantwoorden bewust
koppelen aan mediabijlagen, kiezen hiervoor in hun outbound
adapter; Telegram doet dit zodat `![alt](url)` nog steeds een media-antwoord kan worden.

Deze instructies staan los van elkaar. `MEDIA:`- en antwoord-/voicetags blijven bezorgmetadata; `[embed ...]` is het web-only pad voor rijke rendering.
Vertrouwde media uit toolresultaten gebruikt dezelfde `MEDIA:` / `[[audio_as_voice]]`-parser vóór bezorging, zodat tekstuitvoer van tools nog steeds een audiobijlage als spraaknotitie kan markeren.

Wanneer block streaming is ingeschakeld, blijft `MEDIA:` single-delivery metadata voor een
beurt. Als dezelfde media-URL in een gestreamd blok wordt verzonden en in de uiteindelijke
assistentpayload wordt herhaald, levert OpenClaw de bijlage één keer en verwijdert het duplicaat
uit de uiteindelijke payload.

## `[embed ...]`

`[embed ...]` is de enige agent-facing syntaxis voor rijke rendering voor de Control UI.

Zelfsluitend voorbeeld:

```text
[embed ref="cv_123" title="Status" /]
```

Regels:

- `[view ...]` is niet langer geldig voor nieuwe uitvoer.
- Embed-shortcodes renderen alleen in het assistentberichtoppervlak.
- Alleen URL-backed embeds worden gerenderd. Gebruik `ref="..."` of `url="..."`.
- Block-form inline HTML embed-shortcodes worden niet gerenderd.
- De web-UI verwijdert de shortcode uit zichtbare tekst en rendert de embed inline.
- `MEDIA:` is geen embed-alias en mag niet worden gebruikt voor rijke embed-rendering.

## Opgeslagen renderstructuur

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

Opgeslagen/gerenderde rijke blokken gebruiken deze `canvas`-structuur rechtstreeks. `present_view` wordt niet herkend.

## Gerelateerd

- [RPC-adapters](/nl/reference/rpc)
- [Typebox](/nl/concepts/typebox)
