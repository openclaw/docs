---
read_when:
    - Rendering der Assistentenausgabe in der Control UI ändern
    - Debugging von `[embed ...]`-, strukturierten Medien-, Antwort- oder Audio-Präsentationsdirektiven
summary: Umfangreiches Ausgabeprotokoll für strukturierte Medien, Einbettungen, Audiohinweise und Antworten
title: Umfangreiches Ausgabeprotokoll
x-i18n:
    generated_at: "2026-06-27T18:10:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Die Assistentenausgabe kann eine kleine Gruppe von Liefer-/Rendering-Direktiven enthalten:

- strukturierte Felder `mediaUrl` / `mediaUrls` für die Anhangszustellung
- `[[audio_as_voice]]` für Hinweise zur Audiodarstellung
- `[[reply_to_current]]` / `[[reply_to:<id>]]` für Antwortmetadaten
- `[embed ...]` für Rich Rendering in der Control UI

Remote-Medienanhänge müssen öffentliche `https:`-URLs sein. Reine `http:`,
Loopback-, Link-Local-, private und interne Hostnamen werden als Anhangsdirektiven
ignoriert; serverseitige Medien-Fetcher erzwingen weiterhin ihre eigenen
Netzwerkschutzmechanismen.

Lokale Medienanhänge können absolute Pfade, workspace-relative Pfade oder
home-relative `~/`-Pfade verwenden. Sie durchlaufen vor der Zustellung weiterhin
die Datei-Leserichtlinie des Agenten und Medientypprüfungen.

<Warning>
Geben Sie keine Textbefehle für Anhänge aus Tools, Plugins, Streaming-Blöcken,
Browserausgaben oder Nachrichtenaktionen aus. Verwenden Sie stattdessen
strukturierte Medienfelder.

Gültiger Nachrichten-Tool-Payload:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

Legacy-Text in der finalen Assistentenantwort kann aus Kompatibilitätsgründen
weiterhin normalisiert werden, ist aber kein allgemeines Plugin-/Tool-Protokoll.
</Warning>

Einfache Markdown-Bildsyntax bleibt standardmäßig Text. Kanäle, die Markdown-Bildantworten
absichtlich Medienanhängen zuordnen, aktivieren dies in ihrem ausgehenden
Adapter; Telegram tut dies, damit `![alt](url)` weiterhin zu einer Medienantwort werden kann.

Diese Direktiven sind getrennt. Strukturierte Medienfelder und Antwort-/Voice-Tags sind
Zustellungsmetadaten; `[embed ...]` ist der rein webbasierte Pfad für Rich Rendering.

Wenn Block-Streaming aktiviert ist, müssen Medien in strukturierten Payload-Feldern
übertragen werden. Wenn dieselbe Medien-URL in einem gestreamten Block gesendet und
im finalen Assistenten-Payload wiederholt wird, stellt OpenClaw den Anhang einmal zu
und entfernt das Duplikat aus dem finalen Payload.

## `[embed ...]`

`[embed ...]` ist die einzige agentenseitige Rich-Render-Syntax für die Control UI.

Selbstschließendes Beispiel:

```text
[embed ref="cv_123" title="Status" /]
```

Regeln:

- `[view ...]` ist für neue Ausgaben nicht mehr gültig.
- Embed-Shortcodes werden nur in der Nachrichtenoberfläche des Assistenten gerendert.
- Nur URL-basierte Embeds werden gerendert. Verwenden Sie `ref="..."` oder `url="..."`.
- Inline-HTML-Embed-Shortcodes in Blockform werden nicht gerendert.
- Die Web-UI entfernt den Shortcode aus dem sichtbaren Text und rendert den Embed inline.
- Strukturierte Medien sind kein Embed-Alias und sollten nicht für Rich-Embed-Rendering verwendet werden.

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
