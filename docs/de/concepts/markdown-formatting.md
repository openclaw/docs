---
read_when:
    - Sie ändern die Markdown-Formatierung oder das Chunking für ausgehende Kanäle
    - Sie fügen einen neuen Kanalformatierer oder eine neue Stilzuordnung hinzu
    - Sie debuggen Formatierungsregressionen über Kanäle hinweg
summary: Markdown-Formatierungspipeline für ausgehende Kanäle
title: Markdown-Formatierung
x-i18n:
    generated_at: "2026-05-12T12:55:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92aaf1063ebcbd8630dfcb8ca0a4e9eeb1c64f5b8868bf11c836777180515
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw formatiert ausgehendes Markdown, indem es vor dem Rendern kanalspezifischer Ausgabe in eine gemeinsame Zwischenrepräsentation (IR) konvertiert wird. Die IR hält den Quelltext unverändert und führt zugleich Stil-/Link-Spans mit, damit Chunking und Rendering über Kanäle hinweg konsistent bleiben können.

## Ziele

- **Konsistenz:** ein Parsing-Schritt, mehrere Renderer.
- **Sicheres Chunking:** Text vor dem Rendern aufteilen, damit Inline-Formatierung nie
  über Chunks hinweg bricht.
- **Passend zum Kanal:** dieselbe IR ohne erneutes Markdown-Parsing auf Slack mrkdwn, Telegram HTML und Signal-Stilbereiche abbilden.

## Pipeline

1. **Markdown parsen -> IR**
   - IR besteht aus Klartext plus Stil-Spans (fett/kursiv/durchgestrichen/Code/Spoiler) und Link-Spans.
   - Offsets sind UTF-16-Codeeinheiten, damit Signal-Stilbereiche mit seiner API übereinstimmen.
   - Tabellen werden nur geparst, wenn ein Kanal Tabellenkonvertierung aktiviert.
2. **IR in Chunks aufteilen (Format zuerst)**
   - Das Chunking erfolgt auf dem IR-Text vor dem Rendern.
   - Inline-Formatierung wird nicht über Chunks hinweg aufgeteilt; Spans werden pro Chunk zugeschnitten.
3. **Pro Kanal rendern**
   - **Slack:** mrkdwn-Tokens (fett/kursiv/durchgestrichen/Code), Links als `<url|label>`.
   - **Telegram:** HTML-Tags (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** Klartext + `text-style`-Bereiche; Links werden zu `label (url)`, wenn sich das Label unterscheidet.

## IR-Beispiel

Eingabe-Markdown:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (schematisch):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Wo es verwendet wird

- Ausgehende Adapter für Slack, Telegram und Signal rendern aus der IR.
- Andere Kanäle (WhatsApp, iMessage, Microsoft Teams, Discord) verwenden weiterhin Klartext oder
  ihre eigenen Formatierungsregeln, wobei die Markdown-Tabellenkonvertierung vor dem
  Chunking angewendet wird, wenn sie aktiviert ist.

## Tabellenbehandlung

Markdown-Tabellen werden von Chat-Clients nicht einheitlich unterstützt. Verwenden Sie
`markdown.tables`, um die Konvertierung pro Kanal (und pro Konto) zu steuern.

- `code`: Tabellen als Codeblöcke rendern (Standard für die meisten Kanäle).
- `bullets`: jede Zeile in Aufzählungspunkte konvertieren (Standard für Matrix, Signal und WhatsApp).
- `off`: Tabellen-Parsing und -Konvertierung deaktivieren; der rohe Tabellentext wird unverändert weitergegeben.

Konfigurationsschlüssel:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Chunking-Regeln

- Chunk-Limits stammen aus Kanaladaptern bzw. der Konfiguration und werden auf den IR-Text angewendet.
- Code-Fences bleiben als einzelner Block mit abschließendem Zeilenumbruch erhalten, damit Kanäle
  sie korrekt rendern.
- Listenpräfixe und Blockquote-Präfixe sind Teil des IR-Texts, sodass das Chunking
  nicht mitten im Präfix aufteilt.
- Inline-Stile (fett/kursiv/durchgestrichen/Inline-Code/Spoiler) werden nie über
  Chunks hinweg aufgeteilt; der Renderer öffnet Stile innerhalb jedes Chunks erneut.

Wenn Sie mehr zum Chunking-Verhalten über Kanäle hinweg benötigen, lesen Sie
[Streaming + Chunking](/de/concepts/streaming).

## Link-Richtlinie

- **Slack:** `[label](url)` -> `<url|label>`; bloße URLs bleiben unverändert. Autolink
  ist während des Parsings deaktiviert, um doppelte Verlinkung zu vermeiden.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML-Parse-Modus).
- **Signal:** `[label](url)` -> `label (url)`, außer das Label entspricht der URL.

## Spoiler

Spoiler-Markierungen (`||spoiler||`) werden nur für Signal geparst, wo sie auf
SPOILER-Stilbereiche abgebildet werden. Andere Kanäle behandeln sie als Klartext.

## So fügen Sie einen Kanal-Formatter hinzu oder aktualisieren ihn

1. **Einmal parsen:** verwenden Sie den gemeinsamen `markdownToIR(...)`-Helper mit kanalgeeigneten
   Optionen (Autolink, Überschriftenstil, Blockquote-Präfix).
2. **Rendern:** implementieren Sie einen Renderer mit `renderMarkdownWithMarkers(...)` und einer
   Stilmarker-Zuordnung (oder Signal-Stilbereichen).
3. **Chunking:** rufen Sie `chunkMarkdownIR(...)` vor dem Rendern auf; rendern Sie jeden Chunk.
4. **Adapter verdrahten:** aktualisieren Sie den ausgehenden Kanaladapter, damit er den neuen Chunker
   und Renderer verwendet.
5. **Testen:** fügen Sie Formatierungstests hinzu oder aktualisieren Sie sie sowie einen Test für ausgehende Zustellung, wenn der
   Kanal Chunking verwendet.

## Häufige Fallstricke

- Slack-Token in spitzen Klammern (`<@U123>`, `<#C123>`, `<https://...>`) müssen
  erhalten bleiben; escapen Sie rohes HTML sicher.
- Telegram HTML erfordert das Escaping von Text außerhalb von Tags, um beschädigtes Markup zu vermeiden.
- Signal-Stilbereiche hängen von UTF-16-Offsets ab; verwenden Sie keine Codepoint-Offsets.
- Bewahren Sie abschließende Zeilenumbrüche für eingezäunte Codeblöcke, damit Abschlussmarkierungen in
  ihrer eigenen Zeile landen.

## Verwandt

<CardGroup cols={2}>
  <Card title="Streaming und Chunking" href="/de/concepts/streaming" icon="bars-staggered">
    Verhalten ausgehenden Streamings, Chunk-Grenzen und kanalspezifische Zustellung.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Was das Modell vor der Unterhaltung sieht, einschließlich injizierter Workspace-Dateien.
  </Card>
</CardGroup>
