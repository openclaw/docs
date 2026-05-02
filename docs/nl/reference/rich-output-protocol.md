---
read_when:
    - Weergave van assistentuitvoer in de Control UI wijzigen
    - Foutopsporing van `[embed ...]`, `MEDIA:`, antwoord- of audiopresentatierichtlijnen
summary: Shortcodeprotocol voor rijke uitvoer voor insluitingen, media, audio-aanwijzingen en antwoorden
title: Protocol voor rijke uitvoer
x-i18n:
    generated_at: "2026-05-02T22:22:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Assistant-uitvoer kan een kleine set leverings-/renderdirectieven bevatten:

- `MEDIA:` voor levering van bijlagen
- `[[audio_as_voice]]` voor audiopresentatiehints
- `[[reply_to_current]]` / `[[reply_to:<id>]]` voor antwoordmetadata
- `[embed ...]` voor rijke rendering in de Control UI

Externe `MEDIA:`-bijlagen moeten openbare `https:`-URL's zijn. Platte `http:`,
loopback, link-local, privé- en interne hostnamen worden genegeerd als bijlage-
directieven; server-side media-fetchers handhaven nog steeds hun eigen netwerkbeveiligingen.

Lokale `MEDIA:`-bijlagen kunnen absolute paden, workspace-relatieve paden of
home-relatieve `~/`-paden gebruiken. Ze gaan nog steeds door het beleid voor bestandslezen van de agent en
controles op mediatypen voordat ze worden geleverd.

Gewone Markdown-afbeeldingssyntaxis blijft standaard tekst. Kanalen die bewust
Markdown-afbeeldingsantwoorden naar mediabijlagen omzetten, schakelen dit in in hun uitgaande
adapter; Telegram doet dit zodat `![alt](url)` nog steeds een media-antwoord kan worden.

Deze directieven staan los van elkaar. `MEDIA:` en antwoord-/spraak-tags blijven leveringsmetadata; `[embed ...]` is het web-only pad voor rijke rendering.
Vertrouwde tool-resultaatmedia gebruiken dezelfde `MEDIA:` / `[[audio_as_voice]]`-parser vóór levering, zodat tekstuitvoer van tools nog steeds een audiobijlage als spraakbericht kan markeren.

Wanneer block streaming is ingeschakeld, blijft `MEDIA:` metadata voor eenmalige levering voor een
turn. Als dezelfde media-URL in een gestreamd blok wordt verzonden en herhaald in de uiteindelijke
assistant-payload, levert OpenClaw de bijlage één keer en verwijdert het duplicaat
uit de uiteindelijke payload.

## `[embed ...]`

`[embed ...]` is de enige agent-gerichte syntaxis voor rijke rendering voor de Control UI.

Zelfsluitend voorbeeld:

```text
[embed ref="cv_123" title="Status" /]
```

Regels:

- `[view ...]` is niet langer geldig voor nieuwe uitvoer.
- Embed-shortcodes renderen alleen in het berichtoppervlak van de assistant.
- Alleen embeds met een URL-backend worden gerenderd. Gebruik `ref="..."` of `url="..."`.
- Inline HTML-embed-shortcodes in blokvorm worden niet gerenderd.
- De web-UI verwijdert de shortcode uit zichtbare tekst en rendert de embed inline.
- `MEDIA:` is geen embed-alias en mag niet worden gebruikt voor rijke embed-rendering.

## Opgeslagen renderingsvorm

Het genormaliseerde/opgeslagen inhoudsblok van de assistant is een gestructureerd `canvas`-item:

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

Opgeslagen/gerenderde rijke blokken gebruiken deze `canvas`-vorm direct. `present_view` wordt niet herkend.

## Gerelateerd

- [RPC-adapters](/nl/reference/rpc)
- [Typebox](/nl/concepts/typebox)
