---
read_when:
    - Ändern des Renderings der Assistentenausgabe in der Control UI
    - Fehlerbehebung bei `[embed ...]`, `MEDIA:`, Antwort- oder Audio-Präsentationsanweisungen
summary: Rich-Output-Shortcode-Protokoll für Einbettungen, Medien, Audiohinweise und Antworten
title: Rich-Output-Protokoll
x-i18n:
    generated_at: "2026-04-25T13:56:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Die Assistentenausgabe kann eine kleine Menge an Zustellungs-/Render-Anweisungen enthalten:

- `MEDIA:` für die Zustellung von Anhängen
- `[[audio_as_voice]]` für Hinweise zur Audio-Darstellung
- `[[reply_to_current]]` / `[[reply_to:<id>]]` für Antwortmetadaten
- `[embed ...]` für Rich Rendering in der Control UI

Diese Anweisungen sind getrennt. `MEDIA:` sowie Antwort-/Sprach-Tags bleiben Zustellungsmetadaten; `[embed ...]` ist der nur im Web verfügbare Pfad für Rich Rendering.

Wenn Block-Streaming aktiviert ist, bleibt `MEDIA:` Zustellungsmetadaten mit einmaliger Zustellung für einen Turn. Wenn dieselbe Medien-URL in einem gestreamten Block gesendet und in der finalen Assistenten-Payload wiederholt wird, stellt OpenClaw den Anhang einmal zu und entfernt das Duplikat aus der finalen Payload.

## `[embed ...]`

`[embed ...]` ist die einzige agentenseitige Syntax für Rich Rendering in der Control UI.

Selbstschließendes Beispiel:

```text
[embed ref="cv_123" title="Status" /]
```

Regeln:

- `[view ...]` ist für neue Ausgaben nicht mehr gültig.
- Embed-Shortcodes werden nur in der Oberfläche für Assistentennachrichten gerendert.
- Nur URL-basierte Embeds werden gerendert. Verwende `ref="..."` oder `url="..."`.
- Inline-HTML-Embed-Shortcodes in Blockform werden nicht gerendert.
- Die Web-UI entfernt den Shortcode aus dem sichtbaren Text und rendert das Embed inline.
- `MEDIA:` ist kein Embed-Alias und sollte nicht für Rich-Embed-Rendering verwendet werden.

## Gespeicherte Rendering-Form

Der normalisierte/gespeicherte Inhaltsblock der Assistentenausgabe ist ein strukturiertes `canvas`-Element:

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
