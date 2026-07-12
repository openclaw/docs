---
read_when:
    - Sie ändern die Markdown-Formatierung oder Aufteilung für ausgehende Kanäle
    - Sie fügen einen neuen Kanalformatierer oder eine neue Stilzuordnung hinzu
    - Sie debuggen Formatierungsregressionen über verschiedene Kanäle hinweg
summary: Markdown-Formatierungspipeline für ausgehende Kanäle
title: Markdown-Formatierung
x-i18n:
    generated_at: "2026-07-12T15:14:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw konvertiert ausgehendes Markdown vor dem Rendern kanalspezifischer Ausgaben in eine gemeinsame Zwischendarstellung
(IR). Die IR enthält Klartext sowie
Stil-/Linkbereiche, sodass ein einziger Analyseschritt alle Kanäle versorgt und die Aufteilung in Blöcke
Formatierungen niemals innerhalb eines Bereichs trennt.

## Pipeline

1. **Markdown in IR parsen** (`markdownToIR`) - Klartext sowie Stilbereiche
   (fett, kursiv, durchgestrichen, Code, Codeblock, Spoiler, Blockzitat,
   Überschrift 1-6) und Linkbereiche. Offsets sind UTF-16-Codeeinheiten, sodass die Stilbereiche von Signal
   direkt mit seiner API übereinstimmen. Tabellen werden nur geparst, wenn der Kanal
   einen Tabellenmodus aktiviert.
2. **IR in Blöcke aufteilen** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - die Aufteilung erfolgt vor dem Rendern im IR-Text, sodass Inline-Stile und
     Links für jeden Block zugeschnitten werden, statt über eine Grenze hinweg unterbrochen zu werden.
3. **Pro Kanal rendern** (`renderMarkdownWithMarkers`) - eine Zuordnung von Stilmarkierungen
   wandelt Bereiche in das native Markup des Kanals um.

| Kanal                                                            | Renderer                                                                             | Hinweise                                                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Slack                                                            | mrkdwn-Tokens (`*bold*`, `_italic_`, `` `code` ``, Codeblöcke)                       | Links werden zu `<url\|label>`; Autolink ist beim Parsen deaktiviert, um doppelte Verlinkungen zu vermeiden       |
| Telegram                                                         | HTML-Tags (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | Unterstützt bei aktiviertem `richMessages` auch Tabellen und Überschriften (`<h1>`-`<h6>`) in Rich Messages      |
| Signal                                                           | Klartext + `text-style`-Bereiche                                                     | Links werden als `label (url)` dargestellt, wenn sich die Beschriftung von der URL unterscheidet                 |
| Discord, WhatsApp, iMessage, Microsoft Teams und andere Kanäle   | Klartext                                                                             | Keine IR-basierte Formatierung; die Markdown-Tabellenkonvertierung wird weiterhin über `convertMarkdownTables` ausgeführt |

## IR-Beispiel

Eingabe-Markdown:
__OC_I18N_900000__
IR (schematisch):
__OC_I18N_900001__
## Tabellenverarbeitung

`markdown.tables` steuert pro Kanal und optional pro Konto, wie ein Kanal Markdown-Tabellen konvertiert:

| Modus     | Verhalten                                                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `code`    | Als ausgerichtete ASCII-Tabelle innerhalb eines Codeblocks darstellen (standardmäßige Ausweichoption)                         |
| `bullets` | Jede Zeile in Aufzählungspunkte im Format `label: value` konvertieren                                                         |
| `block`   | Native Tabellen beibehalten, sofern der Transport sie unterstützt; andernfalls auf `code` zurückgreifen                       |
| `off`     | Tabellenanalyse deaktivieren; der unveränderte Tabellenrohtext wird direkt weitergegeben                                      |

Kanalbezogene Plugin-Standardeinstellungen: Signal, WhatsApp und Matrix verwenden standardmäßig `bullets`; Mattermost verwendet standardmäßig `off`; Telegram verwendet standardmäßig `block` (was zu `code` aufgelöst wird, sofern für das Konto nicht `richMessages` aktiviert ist). Jeder Kanal ohne explizite Plugin-Standardeinstellung greift auf `code` zurück.
__OC_I18N_900002__
## Regeln für die Aufteilung

- Größenbeschränkungen für Abschnitte stammen aus den Kanaladaptern bzw. der Konfiguration und gelten für IR-Text, nicht für
  die gerenderte Ausgabe.
- Eingezäunte Codeblöcke werden als ein Block mit einem abschließenden Zeilenumbruch beibehalten, damit
  Kanäle den schließenden Codezaun korrekt rendern.
- Präfixe von Listen und Blockzitaten sind Teil des IR-Texts, sodass die Aufteilung
  nie innerhalb eines Präfixes erfolgt.
- Inline-Stile werden nie auf mehrere Abschnitte verteilt; der Renderer öffnet einen noch offenen
  Stil am Anfang des nächsten Abschnitts erneut.

Weitere Informationen zu Abschnittsgrenzen und zum
Zustellungsverhalten über verschiedene Kanäle hinweg finden Sie unter [Streaming und Aufteilung](/concepts/streaming).

## Richtlinie für Links

- **Slack:** `[label](url)` -> `<url|label>`; unverhüllte URLs bleiben unverhüllt.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML-Analysemodus).
- **Signal:** `[label](url)` -> `label (url)`, sofern die Beschriftung nicht bereits
  mit der URL übereinstimmt.

## Spoiler

Spoiler-Markierungen (`||spoiler||`) werden für Signal geparst (und auf
`SPOILER`-Stilbereiche abgebildet) sowie für Telegram (und auf `<tg-spoiler>` abgebildet). Andere Kanäle behandeln
`||...||` als Klartext.

## Einen Kanalformatierer hinzufügen oder aktualisieren

1. **Einmal parsen** mit `markdownToIR(...)` und dabei kanalgeeignete
   Optionen (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`) übergeben.
2. **Rendern** mit `renderMarkdownWithMarkers(...)` und einer Zuordnung von Stilmarkierungen (oder
   benutzerdefinierter Stilbereichslogik für Transporte wie Signal).
3. **Aufteilen** mit `chunkMarkdownIR(...)` oder
   `renderMarkdownIRChunksWithinLimit(...)`, bevor jeder Abschnitt gerendert wird.
4. **Den Adapter anbinden**, sodass er den neuen Aufteiler und Renderer über den
   ausgehenden Sendepfad aufruft.
5. **Testen** mit Formatierungstests sowie einem Test der ausgehenden Zustellung, falls der Kanal
   Inhalte aufteilt.

## Häufige Stolperfallen

- Slack-Tokens in spitzen Klammern (`<@U123>`, `<#C123>`, `<https://...>`) müssen
  die Maskierung unverändert überstehen; unverarbeitetes HTML muss weiterhin sicher maskiert werden.
- Telegram-HTML erfordert das Maskieren von Text außerhalb von Tags, um fehlerhaftes Markup zu vermeiden.
- Signal-Stilbereiche verwenden UTF-16-Offsets, nicht Codepunkt-Offsets.
- Behalten Sie abschließende Zeilenumbrüche bei eingezäunten Codeblöcken bei, damit die schließende Markierung
  in einer eigenen Zeile steht.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Streaming und Aufteilung" href="/de/concepts/streaming" icon="bars-staggered">
    Verhalten beim ausgehenden Streaming, Abschnittsgrenzen und kanalspezifische Zustellung.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Was das Modell vor der Unterhaltung sieht, einschließlich eingefügter Arbeitsbereichsdateien.
  </Card>
</CardGroup>
