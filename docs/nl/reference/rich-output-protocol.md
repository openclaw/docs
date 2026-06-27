---
read_when:
    - Weergave van assistentuitvoer wijzigen in de Control UI
    - Debuggen van `[embed ...]`, gestructureerde media, antwoord- of audiopresentatierichtlijnen
summary: Protocol voor rijke uitvoer voor gestructureerde media, embeds, audiohints en antwoorden
title: Protocol voor rijke uitvoer
x-i18n:
    generated_at: "2026-06-27T18:19:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Assistentuitvoer kan een kleine set leverings-/renderinstructies bevatten:

- gestructureerde `mediaUrl`- / `mediaUrls`-velden voor levering van bijlagen
- `[[audio_as_voice]]` voor hints voor audiopresentatie
- `[[reply_to_current]]` / `[[reply_to:<id>]]` voor antwoordmetadata
- `[embed ...]` voor rijke rendering in de Control UI

Externe mediabijlagen moeten openbare `https:`-URL's zijn. Gewone `http:`,
loopback-, link-local-, privé- en interne hostnamen worden genegeerd als bijlage-
instructies; server-side media-fetchers blijven hun eigen netwerkbeveiligingen afdwingen.

Lokale mediabijlagen kunnen absolute paden, workspace-relatieve paden of
home-relatieve `~/`-paden gebruiken. Ze blijven vóór levering door het agent-bestandsleesbeleid en
mediatypecontroles gaan.

<Warning>
Geef geen tekstcommando's voor bijlagen uit vanuit tools, plugins, streamingblokken,
browseruitvoer of berichtacties. Gebruik in plaats daarvan gestructureerde mediavelden.

Geldige message-tool-payload:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

Verouderde tekst in het uiteindelijke assistentantwoord kan nog steeds worden genormaliseerd voor compatibiliteit, maar
het is geen algemeen plugin-/toolprotocol.
</Warning>

Gewone Markdown-afbeeldingssyntaxis blijft standaard tekst. Kanalen die Markdown-afbeeldingsantwoorden bewust
naar mediabijlagen mappen, kiezen daarvoor in hun uitgaande
adapter; Telegram doet dit zodat `![alt](url)` nog steeds een mediaantwoord kan worden.

Deze instructies staan los van elkaar. Gestructureerde mediavelden en antwoord-/spraaklabels zijn
leveringsmetadata; `[embed ...]` is het rijke renderpad dat alleen voor het web geldt.

Wanneer blokstreaming is ingeschakeld, moet media worden meegedragen op gestructureerde payloadvelden. Als dezelfde media-URL in een gestreamd blok wordt verzonden en herhaald in de
uiteindelijke assistentpayload, levert OpenClaw de bijlage één keer en verwijdert het
duplicaat uit de uiteindelijke payload.

## `[embed ...]`

`[embed ...]` is de enige agent-gerichte syntaxis voor rijke rendering voor de Control UI.

Zelfsluitend voorbeeld:

```text
[embed ref="cv_123" title="Status" /]
```

Regels:

- `[view ...]` is niet langer geldig voor nieuwe uitvoer.
- Embed-shortcodes worden alleen in het assistentberichtoppervlak gerenderd.
- Alleen URL-ondersteunde embeds worden gerenderd. Gebruik `ref="..."` of `url="..."`.
- Inline HTML-embed-shortcodes in blokvorm worden niet gerenderd.
- De web-UI verwijdert de shortcode uit zichtbare tekst en rendert de embed inline.
- Gestructureerde media is geen embed-alias en moet niet worden gebruikt voor rijke embed-rendering.

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

Opgeslagen/gerenderde rijke blokken gebruiken deze `canvas`-structuur direct. `present_view` wordt niet herkend.

## Gerelateerd

- [RPC-adapters](/nl/reference/rpc)
- [Typebox](/nl/concepts/typebox)
