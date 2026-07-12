---
read_when:
    - Sie ändern die Markdown-Formatierung oder die Aufteilung in Blöcke für ausgehende Kanäle
    - Sie fügen einen neuen Kanalformatierer oder eine neue Stilzuordnung hinzu
    - Sie debuggen Formatierungsregressionen über mehrere Kanäle hinweg
summary: Markdown-Formatierungspipeline für ausgehende Kanäle
title: Markdown-Formatierung
x-i18n:
    generated_at: "2026-07-12T01:36:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw konvertiert ausgehendes Markdown vor dem Rendern kanalspezifischer Ausgaben in eine gemeinsame Zwischendarstellung
(IR). Die IR enthält Klartext sowie
Stil- und Linkbereiche, sodass ein einziger Analyseschritt alle Kanäle versorgt und die
Aufteilung Formatierungen niemals innerhalb eines Bereichs trennt.

## Verarbeitungspipeline

1. **Markdown in IR analysieren** (`markdownToIR`) – Klartext sowie Stilbereiche
   (fett, kursiv, durchgestrichen, Code, Codeblock, Spoiler, Blockzitat,
   Überschrift 1–6) und Linkbereiche. Versatzwerte sind UTF-16-Codeeinheiten, sodass die Signal-Stilbereiche
   direkt mit dessen API übereinstimmen. Tabellen werden nur analysiert, wenn der Kanal
   einen Tabellenmodus aktiviert.
2. **IR aufteilen** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   – die Aufteilung erfolgt vor dem Rendern anhand des IR-Texts, sodass Inline-Stile und
   Links für jeden Teilabschnitt getrennt werden, statt an einer Grenze unterbrochen zu werden.
3. **Pro Kanal rendern** (`renderMarkdownWithMarkers`) – eine Zuordnung von Stilmarkierungen
   wandelt Bereiche in das native Markup des Kanals um.

| Kanal                                                            | Renderer                                                                             | Hinweise                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Slack                                                            | mrkdwn-Tokens (`*bold*`, `_italic_`, `` `code` ``, Code-Fences)                      | Links werden zu `<url\|label>`; Autolink wird beim Analysieren deaktiviert, um doppelte Links zu vermeiden |
| Telegram                                                         | HTML-Tags (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | Unterstützt bei aktiviertem `richMessages` auch Rich-Message-Tabellen und Überschriften (`<h1>`–`<h6>`) |
| Signal                                                           | Klartext + `text-style`-Bereiche                                                     | Links werden als `label (url)` gerendert, wenn sich die Beschriftung von der URL unterscheidet     |
| Discord, WhatsApp, iMessage, Microsoft Teams und andere Kanäle   | Klartext                                                                             | Keine IR-basierte Formatierung; die Konvertierung von Markdown-Tabellen erfolgt weiterhin über `convertMarkdownTables` |

## IR-Beispiel

Eingabe-Markdown:
__OC_I18N_900000__
IR (schematisch):
__OC_I18N_900001__
## Tabellenverarbeitung

`markdown.tables` steuert pro Kanal und optional pro Konto, wie ein Kanal
Markdown-Tabellen konvertiert:

| Modus     | Verhalten                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------ |
| `code`    | Als ausgerichtete ASCII-Tabelle innerhalb eines Codeblocks rendern (Standard-Rückfalloption)     |
| `bullets` | Jede Zeile in Aufzählungspunkte im Format `label: value` konvertieren                            |
| `block`   | Native Tabellen beibehalten, sofern der Transport sie unterstützt; andernfalls auf `code` zurückfallen |
| `off`     | Tabellenanalyse deaktivieren; unverarbeiteter Tabellentext wird unverändert weitergegeben        |

Plugin-Standardeinstellungen pro Kanal: Signal, WhatsApp und Matrix verwenden standardmäßig
`bullets`; Mattermost verwendet standardmäßig `off`; Telegram verwendet standardmäßig `block` (was
zu `code` aufgelöst wird, sofern für das Konto nicht `richMessages` aktiviert ist). Jeder
Kanal ohne explizite Plugin-Standardeinstellung fällt auf `code` zurück.
__OC_I18N_900002__
## Aufteilungsregeln

- Größenbeschränkungen für Teilabschnitte stammen aus Kanaladaptern bzw. der Konfiguration und gelten für IR-Text, nicht für
  die gerenderte Ausgabe.
- Eingezäunte Codeblöcke werden als einzelner Block mit abschließendem Zeilenumbruch beibehalten, damit
  Kanäle die schließende Begrenzung korrekt rendern.
- Präfixe von Listen und Blockzitaten sind Teil des IR-Texts, sodass die Aufteilung
  niemals innerhalb eines Präfixes erfolgt.
- Inline-Stile werden niemals über Teilabschnitte hinweg getrennt; der Renderer öffnet einen noch offenen
  Stil am Anfang des nächsten Teilabschnitts erneut.

Weitere Informationen zu Abschnittsgrenzen und zum
Zustellungsverhalten über verschiedene Kanäle hinweg finden Sie unter [Streaming und Aufteilung](/concepts/streaming).

## Linkrichtlinie

- **Slack:** `[label](url)` -> `<url|label>`; alleinstehende URLs bleiben unverändert.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML-Analysemodus).
- **Signal:** `[label](url)` -> `label (url)`, sofern die Beschriftung nicht bereits
  der URL entspricht.

## Spoiler

Spoiler-Markierungen (`||spoiler||`) werden für Signal (Zuordnung zu `SPOILER`-
Stilbereichen) und Telegram (Zuordnung zu `<tg-spoiler>`) analysiert. Andere Kanäle behandeln
`||...||` als Klartext.

## Einen Kanalformatierer hinzufügen oder aktualisieren

1. **Einmal analysieren** mit `markdownToIR(...)` und kanalgerechten
   Optionen (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Rendern** mit `renderMarkdownWithMarkers(...)` und einer Zuordnung von Stilmarkierungen (oder
   benutzerdefinierter Stilbereichslogik für Transporte wie Signal).
3. **Aufteilen** mit `chunkMarkdownIR(...)` oder
   `renderMarkdownIRChunksWithinLimit(...)`, bevor jeder Teilabschnitt gerendert wird.
4. **Adapter anbinden**, damit im ausgehenden Sendepfad der neue Aufteiler und Renderer
   aufgerufen werden.
5. **Testen** mit Formatierungstests sowie einem Test der ausgehenden Zustellung, falls der Kanal
   Nachrichten aufteilt.

## Häufige Stolperfallen

- Slack-Tokens in spitzen Klammern (`<@U123>`, `<#C123>`, `<https://...>`) müssen
  das Escaping überstehen; unverarbeitetes HTML muss dennoch sicher maskiert werden.
- Telegram-HTML erfordert das Maskieren von Text außerhalb von Tags, um fehlerhaftes Markup zu vermeiden.
- Signal-Stilbereiche verwenden UTF-16-Versatzwerte, keine Codepunkt-Versatzwerte.
- Abschließende Zeilenumbrüche in eingezäunten Codeblöcken müssen erhalten bleiben, damit die schließende Markierung
  in einer eigenen Zeile steht.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Streaming und Aufteilung" href="/de/concepts/streaming" icon="bars-staggered">
    Verhalten beim ausgehenden Streaming, Abschnittsgrenzen und kanalspezifische Zustellung.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Was das Modell vor der Unterhaltung sieht, einschließlich eingefügter Workspace-Dateien.
  </Card>
</CardGroup>
