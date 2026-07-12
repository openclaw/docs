---
read_when:
    - Darstellung der Assistentenausgabe in der Control UI ändern
    - Debugging von `[embed ...]`, strukturierten Medien-, Antwort- oder Audiowiedergabeanweisungen
summary: Rich-Output-Protokoll für strukturierte Medien, Einbettungen, Audiohinweise und Antworten
title: Protokoll für umfangreiche Ausgaben
x-i18n:
    generated_at: "2026-07-12T15:58:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Die Ausgabe des Assistenten übermittelt Zustellungs-/Rendering-Anweisungen über einige dedizierte Kanäle:

- Strukturierte Felder `mediaUrl` / `mediaUrls` für die Zustellung von Anhängen.
- `[[audio_as_voice]]` für Hinweise zur Audiodarstellung.
- `[[reply_to_current]]` / `[[reply_to:<id>]]` für Antwortmetadaten.
- `[embed ...]` für Rich Rendering in der Control UI.

Strukturierte Medienfelder und `[[...]]`-Tags sind Zustellungsmetadaten. `[embed ...]` ist der separate, ausschließlich webbasierte Pfad für Rich Rendering; es handelt sich nicht um einen Medienalias.

## Medienanhänge

Remote-Anhänge müssen öffentliche `https:`-URLs sein. `http:`, Loopback-, Link-Local-, private und interne Hostnamen werden als Anhangsanweisungen abgelehnt; serverseitige Medienabrufe wenden darüber hinaus ihre eigenen Netzwerkschutzmechanismen an.

Lokale Anhänge akzeptieren absolute Pfade, Workspace-relative Pfade oder Home-relative `~/`-Pfade. Vor der Zustellung unterliegen sie weiterhin der Richtlinie für Dateizugriffe des Agenten und den Medientypprüfungen.

<Warning>
Geben Sie keine Textbefehle für Anhänge aus Tools, Plugins, Streaming-Blöcken, Browserausgaben oder Nachrichtenaktionen aus. Verwenden Sie stattdessen strukturierte Medienfelder:

```json
{ "message": "Hier ist Ihr Bild.", "mediaUrl": "/workspace/image.png" }
```

Text aus älteren finalen Antworten kann aus Kompatibilitätsgründen weiterhin normalisiert werden, dies ist jedoch kein allgemeines Plugin-/Tool-Protokoll.
</Warning>

Die einfache Markdown-Bildsyntax (`![alt](url)`) bleibt standardmäßig Text. Kanäle, die Markdown-Bilder als Medienantworten behandeln möchten, aktivieren dies in ihrem ausgehenden Adapter; Telegram tut dies, sodass `![alt](url)` zu einem Medienanhang wird.

Wenn Block-Streaming aktiviert ist, müssen Medien über strukturierte Nutzlastfelder übertragen werden. Wenn dieselbe Medien-URL in einem gestreamten Block und erneut in der finalen Nutzlast des Assistenten erscheint, stellt OpenClaw sie einmal zu und entfernt das Duplikat aus der finalen Nutzlast.

## `[embed ...]`

`[embed ...]` ist die einzige agentenseitige Rich-Rendering-Syntax für die Control UI. Beispiel mit selbstschließendem Tag:

```text
[embed ref="cv_123" title="Status" /]
```

Regeln:

- `[view ...]` ist für neue Ausgaben nicht mehr gültig.
- Embed-Shortcodes werden nur auf der Oberfläche für Assistentennachrichten gerendert.
- Nur URL-basierte Embeds werden gerendert; verwenden Sie `ref="..."` oder `url="..."`.
- Inline-HTML-Embed-Shortcodes in Blockform werden nicht gerendert.
- Die Web-UI entfernt den Shortcode aus dem sichtbaren Text und rendert das Embed inline.

## Gespeicherte Rendering-Struktur

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

`present_view` wird nicht erkannt; gespeicherte/gerenderte Rich-Blöcke verwenden immer diese `canvas`-Struktur.

## Verwandte Themen

- [RPC-Adapter](/de/reference/rpc)
- [Typebox](/de/concepts/typebox)
