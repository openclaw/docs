---
read_when:
    - Ändern des Renderings der Assistentenausgabe in der Control UI
    - Fehlerbehebung bei `[embed ...]`, `MEDIA:`, `reply` oder Darstellungsdirektiven für Audio
summary: Rich-Output-Shortcode-Protokoll für Embeds, Medien, Audio-Hinweise und Antworten
title: Rich-Output-Protokoll
x-i18n:
    generated_at: "2026-04-25T18:21:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e01037a8cb80c9de36effd4642701dcc86131a2b8fb236d61c687845e64189
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Die Assistentenausgabe kann eine kleine Menge an Zustellungs-/Rendering-Direktiven enthalten:

- `MEDIA:` für die Zustellung von Anhängen
- `[[audio_as_voice]]` für Hinweise zur Audio-Darstellung
- `[[reply_to_current]]` / `[[reply_to:<id>]]` für Antwort-Metadaten
- `[embed ...]` für Rich Rendering in der Control UI

Diese Direktiven sind getrennt. `MEDIA:` und Reply-/Voice-Tags bleiben Zustellungs-Metadaten; `[embed ...]` ist der reine Web-Pfad für Rich Rendering.
Vertrauenswürdige Medien aus Tool-Ergebnissen verwenden vor der Zustellung denselben Parser für `MEDIA:` / `[[audio_as_voice]]`, sodass Textausgaben von Tools einen Audio-Anhang weiterhin als Voice Note markieren können.

Wenn Block-Streaming aktiviert ist, bleibt `MEDIA:` Zustellungs-Metadaten für eine
einzelne Zustellung pro Turn. Wenn dieselbe Medien-URL in einem gestreamten Block gesendet und in der finalen
Assistenten-Payload wiederholt wird, stellt OpenClaw den Anhang einmal zu und entfernt das Duplikat
aus der finalen Payload.

## `[embed ...]`

`[embed ...]` ist die einzige agentenseitige Syntax für Rich Rendering in der Control UI.

Beispiel mit Self-Closing-Tag:

```text
[embed ref="cv_123" title="Status" /]
```

Regeln:

- `[view ...]` ist für neue Ausgabe nicht mehr gültig.
- Embed-Shortcodes werden nur in der Nachrichtenoberfläche des Assistenten gerendert.
- Nur URL-gestützte Embeds werden gerendert. Verwenden Sie `ref="..."` oder `url="..."`.
- Inline-HTML-Embed-Shortcodes in Blockform werden nicht gerendert.
- Die Web-UI entfernt den Shortcode aus dem sichtbaren Text und rendert das Embed inline.
- `MEDIA:` ist kein Embed-Alias und sollte nicht für Rich-Embed-Rendering verwendet werden.

## Gespeicherte Rendering-Form

Der normalisierte/gespeicherte Inhaltsblock des Assistenten ist ein strukturiertes `canvas`-Element:

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

Gespeicherte/gerenderte Rich-Blöcke verwenden diese `canvas`-Form direkt. `present_view` wird nicht erkannt.

## Verwandt

- [RPC-Adapter](/de/reference/rpc)
- [Typebox](/de/concepts/typebox)
