---
read_when:
    - Sie ändern die Markdown-Formatierung oder die Aufteilung für ausgehende Kanäle.
    - Sie fügen einen neuen Kanalformatierer oder eine neue Stilzuordnung hinzu
    - Sie debuggen Formatierungsregressionen über mehrere Kanäle hinweg
summary: Markdown-Formatierungspipeline für ausgehende Kanäle
title: Markdown-Formatierung
x-i18n:
    generated_at: "2026-07-24T03:48:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw konvertiert ausgehendes Markdown vor dem Rendern kanalspezifischer Ausgaben in eine gemeinsame Zwischendarstellung
(IR). Die IR enthält Klartext sowie
Stil-/Link-Spannen, sodass ein einziger Parsing-Schritt alle Kanäle versorgt und die Aufteilung
Formatierungen niemals innerhalb einer Spanne trennt.

## Pipeline

1. **Markdown in IR parsen** (`markdownToIR`) - Klartext plus Stilspannen
   (fett, kursiv, durchgestrichen, Code, Codeblock, Spoiler, Blockzitat,
   Überschrift 1-6) und Link-Spannen. Offsets sind UTF-16-Codeeinheiten, damit die Signal-Stilbereiche
   direkt mit seiner API übereinstimmen. Tabellen werden nur geparst, wenn der Kanal
   einen Tabellenmodus aktiviert.
2. **IR aufteilen** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - Die Aufteilung erfolgt vor dem Rendern am IR-Text, sodass Inline-Stile und
     Links pro Teilstück aufgeteilt werden, anstatt über eine Grenze hinweg beschädigt zu werden.
3. **Pro Kanal rendern** (`renderMarkdownWithMarkers`) - eine Zuordnung von Stilmarkierungen
   wandelt Spannen in das native Markup des Kanals um.

| Kanal                                                            | Renderer                                                                             | Hinweise                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Slack                                                            | mrkdwn-Tokens (`*bold*`, `_italic_`, `` `code` ``, Code-Fences)                   | Links werden zu `<url\|label>`; Autolink ist beim Parsen deaktiviert, um doppelte Verlinkung zu vermeiden |
| Telegram                                                         | HTML-Tags (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | Unterstützt außerdem Rich-Message-Tabellen und Überschriften (`<h1>`-`<h6>`), wenn `richMessages` aktiviert ist |
| Signal                                                           | Klartext + `text-style`-Bereiche                                                  | Links werden als `label (url)` gerendert, wenn sich die Beschriftung von der URL unterscheidet |
| Discord, WhatsApp, iMessage, Microsoft Teams und andere Kanäle   | Klartext                                                                             | Keine IR-basierte Formatierung; die Markdown-Tabellenkonvertierung erfolgt weiterhin über `convertMarkdownTables` |

## IR-Beispiel

Eingabe-Markdown:

```markdown
Hallo **Welt** - siehe [Dokumentation](https://docs.openclaw.ai).
```

IR (schematisch):

```json
{
  "text": "Hallo Welt - siehe Dokumentation.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 32, "href": "https://docs.openclaw.ai" }]
}
```

## Tabellenverarbeitung

`markdown.tables` steuert pro Kanal und optional pro Konto, wie ein Kanal
Markdown-Tabellen konvertiert:

| Modus     | Verhalten                                                                            |
| --------- | ------------------------------------------------------------------------------------ |
| `code`    | Als ausgerichtete ASCII-Tabelle innerhalb eines Codeblocks rendern (Fallback-Standard) |
| `bullets` | Jede Zeile in `label: value`-Aufzählungspunkte konvertieren                          |
| `block`   | Native Tabellen beibehalten, sofern der Transport sie unterstützt; andernfalls auf `code` zurückfallen |
| `off`     | Tabellen-Parsing deaktivieren; roher Tabellentext wird unverändert weitergegeben      |

Plugin-Standardeinstellungen pro Kanal: Signal, WhatsApp und Matrix verwenden standardmäßig
`bullets`; Mattermost verwendet standardmäßig `off`; Telegram verwendet standardmäßig `block` (was
zu `code` aufgelöst wird, sofern für das Konto nicht `richMessages` aktiviert ist). Jeder
Kanal ohne explizite Plugin-Standardeinstellung fällt auf `code` zurück.

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

## Aufteilungsregeln

- Grenzwerte für Teilstücke stammen aus Kanaladaptern bzw. der Konfiguration und gelten für IR-Text, nicht für
  die gerenderte Ausgabe.
- Codeblöcke mit Fences werden mit einem abschließenden Zeilenumbruch als ein Block beibehalten, damit
  Kanäle die schließende Fence korrekt rendern.
- Listen- und Blockzitatpräfixe sind Bestandteil des IR-Texts, sodass die Aufteilung niemals
  innerhalb eines Präfixes erfolgt.
- Inline-Stile werden niemals über Teilstücke hinweg getrennt; der Renderer öffnet einen offenen
  Stil am Anfang des nächsten Teilstücks erneut.

Weitere Informationen zu Teilstückgrenzen und
kanalübergreifendem Zustellverhalten finden Sie unter [Streaming und Aufteilung](/concepts/streaming).

## Linkrichtlinie

- **Slack:** `[label](url)` -> `<url|label>`; reine URLs bleiben unverändert.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML-Parse-Modus).
- **Signal:** `[label](url)` -> `label (url)`, sofern die Beschriftung nicht bereits
  mit der URL übereinstimmt.

## Spoiler

Spoiler-Markierungen (`||spoiler||`) werden für Signal geparst (Zuordnung zu `SPOILER`-
Stilbereichen) und Telegram (Zuordnung zu `<tg-spoiler>`). Andere Kanäle behandeln
`||...||` als Klartext.

## Kanalformatierer hinzufügen oder aktualisieren

1. **Einmal parsen** mit `markdownToIR(...)` und dabei kanalgerechte
   Optionen übergeben (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Rendern** mit `renderMarkdownWithMarkers(...)` und einer Zuordnung von Stilmarkierungen (oder
   benutzerdefinierter Stilbereichslogik für Transporte wie Signal).
3. **Aufteilen** mit `chunkMarkdownIR(...)` oder
   `renderMarkdownIRChunksWithinLimit(...)`, bevor jedes Teilstück gerendert wird.
4. **Adapter anbinden**, damit der neue Aufteiler und Renderer aus dem
   ausgehenden Sendepfad aufgerufen werden.
5. **Testen** mit Formatierungstests sowie einem Test der ausgehenden Zustellung, falls der Kanal
   die Ausgabe aufteilt.

## Häufige Stolperfallen

- Slack-Tokens in spitzen Klammern (`<@U123>`, `<#C123>`, `<https://...>`) müssen
  die Maskierung überstehen; rohes HTML muss weiterhin sicher maskiert werden.
- Bei Telegram-HTML muss Text außerhalb von Tags maskiert werden, um fehlerhaftes Markup zu vermeiden.
- Signal-Stilbereiche verwenden UTF-16-Offsets, keine Codepunkt-Offsets.
- Abschließende Zeilenumbrüche bei Codeblöcken mit Fences müssen erhalten bleiben, damit die schließende Markierung
  in einer eigenen Zeile steht.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Streaming und Aufteilung" href="/de/concepts/streaming" icon="bars-staggered">
    Verhalten ausgehender Streams, Teilstückgrenzen und kanalspezifische Zustellung.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Was das Modell vor der Unterhaltung sieht, einschließlich eingefügter Workspace-Dateien.
  </Card>
</CardGroup>
