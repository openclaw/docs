---
read_when:
    - Darstellung der Assistentenausgabe in der Control UI ändern
    - Debugging von `[embed ...]`, `MEDIA:`, Antwort- oder Audio-Präsentationsdirektiven
summary: Shortcode-Protokoll für formatierte Ausgaben, Einbettungen, Medien, Audiohinweise und Antworten
title: Protokoll für formatierte Ausgaben
x-i18n:
    generated_at: "2026-04-30T07:13:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Die Ausgabe des Assistant kann eine kleine Gruppe von Auslieferungs-/Darstellungsdirektiven enthalten:

- `MEDIA:` für die Auslieferung von Anhängen
- `[[audio_as_voice]]` für Hinweise zur Audiopräsentation
- `[[reply_to_current]]` / `[[reply_to:<id>]]` für Antwortmetadaten
- `[embed ...]` für erweiterte Darstellung in der Control UI

Remote-`MEDIA:`-Anhänge müssen öffentliche `https:`-URLs sein. Reines `http:`,
Loopback, link-lokale, private und interne Hostnamen werden als Anhangs-
direktiven ignoriert; serverseitige Medienabrufmechanismen erzwingen weiterhin
ihre eigenen Netzwerkschutzmaßnahmen.

Normale Markdown-Bildsyntax bleibt standardmäßig Text. Kanäle, die Markdown-
Bildantworten absichtlich Medienanhängen zuordnen, aktivieren dies in ihrem
ausgehenden Adapter; Telegram tut dies, sodass `![alt](url)` weiterhin zu einer
Medienantwort werden kann.

Diese Direktiven sind voneinander getrennt. `MEDIA:` und Antwort-/Voice-Tags bleiben Auslieferungsmetadaten; `[embed ...]` ist der nur für das Web bestimmte Pfad für erweiterte Darstellung.
Vertrauenswürdige Medien aus Tool-Ergebnissen verwenden vor der Auslieferung denselben `MEDIA:`-/`[[audio_as_voice]]`-Parser, sodass Textausgaben von Tools einen Audioanhang weiterhin als Sprachnachricht kennzeichnen können.

Wenn Block-Streaming aktiviert ist, bleibt `MEDIA:` eine Metadatenangabe für
eine einzelne Auslieferung in einem Turn. Wenn dieselbe Medien-URL in einem gestreamten Block gesendet und in der finalen
Assistant-Nutzlast wiederholt wird, liefert OpenClaw den Anhang einmal aus und entfernt das Duplikat
aus der finalen Nutzlast.

## `[embed ...]`

`[embed ...]` ist die einzige agentenseitige Syntax für erweiterte Darstellung in der Control UI.

Selbstschließendes Beispiel:

```text
[embed ref="cv_123" title="Status" /]
```

Regeln:

- `[view ...]` ist für neue Ausgaben nicht mehr gültig.
- Einbettungs-Shortcodes werden nur auf der Nachrichtenoberfläche des Assistant dargestellt.
- Nur URL-basierte Einbettungen werden dargestellt. Verwenden Sie `ref="..."` oder `url="..."`.
- Einbettungs-Shortcodes im Blockformat mit Inline-HTML werden nicht dargestellt.
- Die Web-UI entfernt den Shortcode aus dem sichtbaren Text und stellt die Einbettung inline dar.
- `MEDIA:` ist kein Alias für Einbettungen und sollte nicht für erweiterte Einbettungsdarstellung verwendet werden.

## Gespeicherte Darstellungsform

Der normalisierte/gespeicherte Inhaltsblock des Assistant ist ein strukturiertes `canvas`-Element:

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

Gespeicherte/dargestellte Blöcke für erweiterte Darstellung verwenden diese `canvas`-Form direkt. `present_view` wird nicht erkannt.

## Verwandte Themen

- [RPC-Adapter](/de/reference/rpc)
- [Typebox](/de/concepts/typebox)
