---
read_when:
    - Darstellung von Assistentenausgaben in der Control UI ändern
    - Fehlersuche für `[embed ...]`-, `MEDIA:`-, Antwort- oder Audio-Präsentationsanweisungen
summary: Shortcode-Protokoll für erweiterte Ausgaben mit Einbettungen, Medien, Audiohinweisen und Antworten
title: Protokoll für erweiterte Ausgabe
x-i18n:
    generated_at: "2026-05-02T22:22:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Die Assistentenausgabe kann eine kleine Menge an Liefer-/Darstellungsdirektiven enthalten:

- `MEDIA:` für die Zustellung von Anhängen
- `[[audio_as_voice]]` für Hinweise zur Audiopräsentation
- `[[reply_to_current]]` / `[[reply_to:<id>]]` für Antwortmetadaten
- `[embed ...]` für erweiterte Darstellung in der Control UI

Remote-`MEDIA:`-Anhänge müssen öffentliche `https:`-URLs sein. Reines `http:`,
Loopback, Link-Local, private und interne Hostnamen werden als Anhangsdirektiven
ignoriert; serverseitige Medienabrufe erzwingen weiterhin ihre eigenen Netzwerkschutzmaßnahmen.

Lokale `MEDIA:`-Anhänge können absolute Pfade, workspace-relative Pfade oder
home-relative `~/`-Pfade verwenden. Sie durchlaufen vor der Zustellung weiterhin
die Datei-Leserichtlinie des Agenten und Medientypprüfungen.

Normale Markdown-Bildsyntax bleibt standardmäßig Text. Kanäle, die Markdown-Bildantworten
absichtlich Anhängen zuordnen, aktivieren dies in ihrem ausgehenden
Adapter; Telegram macht das, damit `![alt](url)` weiterhin zu einer Medienantwort werden kann.

Diese Direktiven sind getrennt. `MEDIA:` und Antwort-/Sprach-Tags bleiben Zustellungsmetadaten; `[embed ...]` ist der ausschließlich webbasierte Pfad für erweiterte Darstellung.
Vertrauenswürdige Tool-Ergebnis-Medien verwenden vor der Zustellung denselben `MEDIA:`- / `[[audio_as_voice]]`-Parser, sodass Textausgaben von Tools einen Audioanhang weiterhin als Sprachnotiz markieren können.

Wenn Block-Streaming aktiviert ist, bleibt `MEDIA:` für einen Turn eine Metadatenangabe mit einmaliger Zustellung. Wenn dieselbe Medien-URL in einem gestreamten Block gesendet und in der finalen Assistenten-Nutzlast wiederholt wird, stellt OpenClaw den Anhang einmal zu und entfernt das Duplikat aus der finalen Nutzlast.

## `[embed ...]`

`[embed ...]` ist die einzige agentenseitige Syntax für erweiterte Darstellung in der Control UI.

Selbstschließendes Beispiel:

```text
[embed ref="cv_123" title="Status" /]
```

Regeln:

- `[view ...]` ist für neue Ausgaben nicht mehr gültig.
- Embed-Shortcodes werden nur in der Oberfläche der Assistentennachricht dargestellt.
- Nur URL-gestützte Embeds werden dargestellt. Verwenden Sie `ref="..."` oder `url="..."`.
- Inline-HTML-Embed-Shortcodes in Blockform werden nicht dargestellt.
- Die Web-UI entfernt den Shortcode aus dem sichtbaren Text und stellt den Embed inline dar.
- `MEDIA:` ist kein Embed-Alias und sollte nicht für Rich-Embed-Darstellung verwendet werden.

## Gespeicherte Darstellungsform

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

Gespeicherte/dargestellte Rich-Blöcke verwenden diese `canvas`-Form direkt. `present_view` wird nicht erkannt.

## Verwandt

- [RPC-Adapter](/de/reference/rpc)
- [Typebox](/de/concepts/typebox)
