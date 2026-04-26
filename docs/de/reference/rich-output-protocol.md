---
read_when:
    - Das Rendering der Assistentenausgabe in der Control UI ändern
    - Debuggen von `[embed ...]`, `MEDIA:`, Antwort- oder Audio-Präsentationsdirektiven
summary: Shortcode-Protokoll für Rich Output für Embeds, Medien, Audio-Hinweise und Antworten
title: Rich-Output-Protokoll
x-i18n:
    generated_at: "2026-04-26T11:38:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c62e41073196c2ff4867230af55469786fcfb29414f5cc5b7d38f6b1ffc3718
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Die Assistentenausgabe kann einen kleinen Satz von Zustellungs-/Render-Direktiven enthalten:

- `MEDIA:` für die Zustellung von Anhängen
- `[[audio_as_voice]]` für Audio-Präsentationshinweise
- `[[reply_to_current]]` / `[[reply_to:<id>]]` für Antwort-Metadaten
- `[embed ...]` für Rich Rendering in der Control UI

Remote-Anhänge über `MEDIA:` müssen öffentliche `https:`-URLs sein. Normales `http:`,
loopback, link-local, private und interne Hostnamen werden als Anhangsdirektiven ignoriert;
serverseitige Media-Fetcher erzwingen weiterhin ihre eigenen Netzwerkschutzmechanismen.

Diese Direktiven sind getrennt. `MEDIA:` und Antwort-/Voice-Tags bleiben Zustellungsmetadaten; `[embed ...]` ist der reine Rich-Render-Pfad für das Web.
Vertrauenswürdige Medien aus Tool-Ergebnissen verwenden vor der Zustellung denselben Parser für `MEDIA:` / `[[audio_as_voice]]`, sodass Textausgaben von Tools einen Audioanhang weiterhin als Sprachnotiz markieren können.

Wenn Block-Streaming aktiviert ist, bleibt `MEDIA:` Zustellungsmetadaten mit einmaliger Zustellung für einen
Turn. Wenn dieselbe Medien-URL in einem gestreamten Block gesendet und in der endgültigen
Assistenten-Payload wiederholt wird, stellt OpenClaw den Anhang einmal zu und entfernt das Duplikat
aus der endgültigen Payload.

## `[embed ...]`

`[embed ...]` ist die einzige agentseitige Rich-Render-Syntax für die Control UI.

Selbstschließendes Beispiel:

```text
[embed ref="cv_123" title="Status" /]
```

Regeln:

- `[view ...]` ist für neue Ausgaben nicht mehr gültig.
- Embed-Shortcodes werden nur auf der Oberfläche für Assistentennachrichten gerendert.
- Nur URL-gestützte Embeds werden gerendert. Verwenden Sie `ref="..."` oder `url="..."`.
- Embed-Shortcodes im Blockformat mit Inline-HTML werden nicht gerendert.
- Die Web-UI entfernt den Shortcode aus dem sichtbaren Text und rendert das Embed inline.
- `MEDIA:` ist kein Alias für Embed und sollte nicht für Rich-Embed-Rendering verwendet werden.

## Gespeicherte Rendering-Form

Der normalisierte/gespeicherte Inhaltsblock des Assistenten ist ein strukturiertes Element `canvas`:

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

Gespeicherte/gerenderte Rich-Blöcke verwenden direkt diese Form `canvas`. `present_view` wird nicht erkannt.

## Verwandt

- [RPC-Adapter](/de/reference/rpc)
- [Typebox](/de/concepts/typebox)
