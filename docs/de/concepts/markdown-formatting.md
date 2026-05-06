---
read_when:
    - Sie ändern die Markdown-Formatierung oder das Chunking für ausgehende Kanäle
    - Sie fügen einen neuen Kanalformatierer oder eine neue Stilzuordnung hinzu
    - Sie debuggen Formatierungsregressionen über mehrere Kanäle hinweg
summary: Markdown-Formatierungspipeline für ausgehende Kanäle
title: Markdown-Formatierung
x-i18n:
    generated_at: "2026-05-06T06:43:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw formatiert ausgehendes Markdown, indem es vor dem Rendern kanalspezifischer Ausgaben in eine gemeinsame Zwischenrepräsentation (IR) konvertiert wird. Die IR hält den Quelltext unverändert und führt gleichzeitig Stil- und Link-Spans mit, damit Segmentierung und Rendering kanalübergreifend konsistent bleiben.

## Ziele

- **Konsistenz:** ein Parsing-Schritt, mehrere Renderer.
- **Sichere Segmentierung:** Text vor dem Rendering aufteilen, damit Inline-Formatierung nie
  über Segmente hinweg bricht.
- **Kanaleignung:** dieselbe IR Slack mrkdwn, Telegram HTML und Signal
  Stilbereichen zuordnen, ohne Markdown erneut zu parsen.

## Pipeline

1. **Markdown parsen -> IR**
   - IR ist reiner Text plus Stil-Spans (bold/italic/strike/code/spoiler) und Link-Spans.
   - Offsets sind UTF-16-Codeeinheiten, damit Signal-Stilbereiche mit der API übereinstimmen.
   - Tabellen werden nur geparst, wenn ein Kanal die Tabellenkonvertierung aktiviert.
2. **IR segmentieren (Format zuerst)**
   - Die Segmentierung erfolgt auf dem IR-Text vor dem Rendering.
   - Inline-Formatierung wird nicht über Segmente hinweg geteilt; Spans werden pro Segment zugeschnitten.
3. **Pro Kanal rendern**
   - **Slack:** mrkdwn-Token (bold/italic/strike/code), Links als `<url|label>`.
   - **Telegram:** HTML-Tags (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** reiner Text + `text-style`-Bereiche; Links werden zu `label (url)`, wenn das Label abweicht.

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

## Wo sie verwendet wird

- Ausgehende Adapter für Slack, Telegram und Signal rendern aus der IR.
- Andere Kanäle (WhatsApp, iMessage, Microsoft Teams, Discord) verwenden weiterhin reinen Text oder
  eigene Formatierungsregeln, wobei die Markdown-Tabellenkonvertierung bei Aktivierung vor der
  Segmentierung angewendet wird.

## Tabellenbehandlung

Markdown-Tabellen werden nicht von allen Chat-Clients einheitlich unterstützt. Verwenden Sie
`markdown.tables`, um die Konvertierung pro Kanal (und pro Konto) zu steuern.

- `code`: Tabellen als Codeblöcke rendern (Standard für die meisten Kanäle).
- `bullets`: jede Zeile in Aufzählungspunkte konvertieren (Standard für Signal + WhatsApp).
- `off`: Tabellen-Parsing und -Konvertierung deaktivieren; roher Tabellentext wird unverändert weitergereicht.

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

## Segmentierungsregeln

- Segmentgrenzen stammen aus Kanaladaptern bzw. der Konfiguration und werden auf den IR-Text angewendet.
- Code-Fences werden als einzelner Block mit nachgestelltem Zeilenumbruch beibehalten, damit Kanäle
  sie korrekt rendern.
- Listenpräfixe und Blockquote-Präfixe sind Teil des IR-Texts, daher teilt die Segmentierung
  nicht mitten im Präfix.
- Inline-Stile (bold/italic/strike/inline-code/spoiler) werden nie über
  Segmente hinweg geteilt; der Renderer öffnet Stile innerhalb jedes Segments erneut.

Wenn Sie mehr über das Segmentierungsverhalten kanalübergreifend benötigen, siehe
[Streaming + Segmentierung](/de/concepts/streaming).

## Link-Richtlinie

- **Slack:** `[label](url)` -> `<url|label>`; reine URLs bleiben unverändert. Autolink
  ist während des Parsings deaktiviert, um doppelte Verlinkung zu vermeiden.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML-Parse-Modus).
- **Signal:** `[label](url)` -> `label (url)`, außer das Label entspricht der URL.

## Spoiler

Spoiler-Marker (`||spoiler||`) werden nur für Signal geparst, wo sie
SPOILER-Stilbereichen zugeordnet werden. Andere Kanäle behandeln sie als reinen Text.

## Kanal-Formatter hinzufügen oder aktualisieren

1. **Einmal parsen:** Verwenden Sie den gemeinsamen `markdownToIR(...)`-Helper mit kanalgeeigneten
   Optionen (Autolink, Überschriftenstil, Blockquote-Präfix).
2. **Rendern:** Implementieren Sie einen Renderer mit `renderMarkdownWithMarkers(...)` und einer
   Stilmarker-Zuordnung (oder Signal-Stilbereichen).
3. **Segmentieren:** Rufen Sie `chunkMarkdownIR(...)` vor dem Rendering auf; rendern Sie jedes Segment.
4. **Adapter verdrahten:** Aktualisieren Sie den ausgehenden Kanaladapter, damit er den neuen Segmentierer
   und Renderer verwendet.
5. **Testen:** Fügen Sie Formatierungstests und einen Test für ausgehende Zustellung hinzu oder aktualisieren Sie sie, wenn der
   Kanal Segmentierung verwendet.

## Häufige Fallstricke

- Slack-Token in spitzen Klammern (`<@U123>`, `<#C123>`, `<https://...>`) müssen
  beibehalten werden; escapen Sie rohes HTML sicher.
- Telegram HTML erfordert das Escaping von Text außerhalb von Tags, um fehlerhaftes Markup zu vermeiden.
- Signal-Stilbereiche hängen von UTF-16-Offsets ab; verwenden Sie keine Codepoint-Offsets.
- Behalten Sie nachgestellte Zeilenumbrüche für eingezäunte Codeblöcke bei, damit Abschlussmarker in
  ihrer eigenen Zeile stehen.

## Verwandt

<CardGroup cols={2}>
  <Card title="Streaming und Segmentierung" href="/de/concepts/streaming" icon="bars-staggered">
    Verhalten ausgehenden Streamings, Segmentgrenzen und kanalspezifische Zustellung.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Was das Modell vor der Unterhaltung sieht, einschließlich injizierter Workspace-Dateien.
  </Card>
</CardGroup>
