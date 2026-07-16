---
read_when:
    - Erklärung, wie Streaming oder Chunking in Kanälen funktioniert
    - Verhalten von Block-Streaming oder Kanal-Chunking ändern
    - Fehlerbehebung bei doppelten/vorzeitigen Blockantworten oder beim Vorschau-Streaming in Kanälen
summary: Streaming- und Chunking-Verhalten (Blockantworten, Kanalvorschau-Streaming, Moduszuordnung)
title: Streaming und Aufteilung in Blöcke
x-i18n:
    generated_at: "2026-07-16T12:44:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw verfügt über zwei unabhängige Streaming-Ebenen, und derzeit gibt es **kein echtes
Token-Delta-Streaming** für Kanalnachrichten:

- **Block-Streaming (Kanäle):** Gibt abgeschlossene **Blöcke** aus, während der Assistent
  schreibt. Dies sind normale Kanalnachrichten, keine Token-Deltas.
- **Vorschau-Streaming (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  Aktualisiert während der Generierung eine temporäre **Vorschaunachricht** (Senden + Bearbeitungen/Anhängen).

## Block-Streaming (Kanalnachrichten)

Block-Streaming sendet die Ausgabe des Assistenten in groben Abschnitten, sobald sie verfügbar ist.

```text
Modellausgabe
  └─ text_delta/Ereignisse
       ├─ (blockStreamingBreak=text_end)
       │    └─ Chunker gibt Blöcke aus, während der Puffer wächst
       └─ (blockStreamingBreak=message_end)
            └─ Chunker leert den Puffer bei message_end
                   └─ Senden an den Kanal (Blockantworten)
```

- `text_delta/events`: Modell-Stream-Ereignisse (können bei nicht streamenden Modellen spärlich sein).
- `chunker`: `EmbeddedBlockChunker` unter Anwendung der Mindest-/Höchstgrenzen und der bevorzugten Trennstelle.
- `channel send`: tatsächlich ausgehende Nachrichten (Blockantworten).

**Steuerung** (alle unter `agents.defaults`, sofern nicht anders angegeben):

| Schlüssel                                                    | Werte / Struktur                                                        | Standard   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen) | -          |
| `*.streaming.block.enabled` (Kanalanpassung)               | `true` / `false`, erzwingt Block-Streaming pro Kanal (und pro Konto)  | -          |
| `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`) | Zahl, feste Obergrenze                                                   | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | Zahl, weiche Zeilenobergrenze, die hohe Antworten aufteilt, um ein Abschneiden in der Benutzeroberfläche zu vermeiden | 17         |

`streaming.chunkMode: "newline"` teilt an Leerzeilen (Absatzgrenzen),
nicht an jedem Zeilenumbruch, bevor auf eine längenbasierte Aufteilung zurückgegriffen wird, sobald der Text
die Grenze überschreitet.

Gebündelte Kanäle schreiben diese Anpassungen als
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`. Die flachen
Schreibweisen `*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` sind
bei jedem gebündelten Kanal veraltet: `openclaw doctor --fix` migriert sie in
die verschachtelte Struktur, und die Kanalschemas lehnen sie ab. Konfigurationen externer SDK-Plugins,
die noch die flachen Schreibweisen verwenden, funktionieren über einen veralteten
Fallback (mit einer Laufzeitwarnung) bis zum nächsten Release-Zyklus weiter.

**Grenzsemantik** für `blockStreamingBreak`:

- `text_end`: Streamt Blöcke, sobald der Chunker sie ausgibt; leert den Puffer bei jedem `text_end`.
- `message_end`: Wartet, bis die Assistentennachricht abgeschlossen ist, und leert dann den Puffer mit der
  zwischengespeicherten Ausgabe. Verwendet weiterhin den Chunker, wenn der zwischengespeicherte Text `maxChars` überschreitet, sodass am Ende
  mehrere Abschnitte ausgegeben werden können.

### Medienübermittlung mit Block-Streaming

Streaming-Medien müssen strukturierte Nutzlastfelder wie `mediaUrl` oder
`mediaUrls` verwenden; gestreamter Text wird nicht als Anhangsbefehl geparst. Wenn Block-
Streaming Medien frühzeitig sendet, merkt sich OpenClaw diese Übermittlung für den Durchlauf. Falls
die endgültige Assistentennutzlast dieselbe Medien-URL wiederholt, entfernt die endgültige Übermittlung
das doppelte Medium, anstatt den Anhang erneut zu senden.

Exakt identische endgültige Nutzlasten werden unterdrückt. Wenn die endgültige Nutzlast
zusätzlichen Text um bereits gestreamte Medien herum enthält, sendet OpenClaw den
neuen Text weiterhin, während das Medium nur einmal übermittelt wird. Dies verhindert doppelte Sprachnachrichten
oder Dateien auf Kanälen wie Telegram.

## Aufteilungsalgorithmus (Unter-/Obergrenzen)

Die Blockaufteilung wird durch `EmbeddedBlockChunker` implementiert:

- **Untergrenze:** Keine Ausgabe, bis der Puffer >= `minChars` ist (außer bei erzwungener Ausgabe).
- **Obergrenze:** Bevorzugt Trennstellen vor `maxChars`; bei erzwungener Trennung erfolgt sie bei `maxChars`.
- **Prioritätsfolge der Trennstellen:** `paragraph` -> `newline` -> `sentence` ->
  Leerraum -> harte Trennung.
- **Codeblöcke:** Niemals innerhalb von Codeblöcken trennen; bei erzwungener Trennung bei `maxChars` den
  Codeblock schließen und erneut öffnen, damit Markdown gültig bleibt.

`maxChars` wird auf `textChunkLimit` des Kanals begrenzt, sodass
kanalspezifische Obergrenzen nicht überschritten werden können.

## Zusammenführung (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-
abschnitte zusammenführen**, bevor sie gesendet werden. Dies reduziert einzelne kurze Nachrichten und ermöglicht dennoch
eine fortlaufende Ausgabe.

- Die Zusammenführung wartet vor dem Leeren auf **Inaktivitätspausen** (`idleMs`).
- Puffer werden durch `maxChars` begrenzt und geleert, wenn sie diesen Wert überschreiten.
- `minChars` verhindert das Senden winziger Fragmente, bis genügend Text angesammelt wurde
  (beim abschließenden Leeren wird verbleibender Text immer gesendet).
- Das Verknüpfungszeichen wird aus `blockStreamingChunk.breakPreference` abgeleitet: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> Leerzeichen.
- Kanalanpassungen sind über `*.streaming.block.coalesce` verfügbar (einschließlich
  kontospezifischer Konfigurationen).
- Discord, Signal und Slack verwenden für die Zusammenführung standardmäßig `{ minChars: 1500, idleMs: 1000 }`,
  sofern dies nicht überschrieben wird.

## Menschlich wirkende Pausen zwischen Blöcken

Wenn Block-Streaming aktiviert ist, wird nach dem ersten Block eine **zufällige Pause** zwischen
Blockantworten eingefügt, damit Antworten mit mehreren Nachrichten natürlicher wirken.

| `agents.defaults.humanDelay.mode` | Verhalten               |
| --------------------------------- | ----------------------- |
| `off` (Standard)                   | Keine Pause             |
| `natural`                         | Zufällige Pause von 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

Pro Agent über `agents.list[].humanDelay` anpassbar. Gilt nur für **Block-
antworten**, nicht für endgültige Antworten oder Werkzeugzusammenfassungen.

## „Abschnitte oder alles streamen“

- **Abschnitte streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (während der Generierung ausgeben). Kanäle außer Telegram benötigen außerdem
  `*.streaming.block.enabled: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (Puffer
  einmal leeren, bei sehr langem Inhalt möglicherweise in mehreren Abschnitten).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur endgültige Antwort).

Block-Streaming ist **deaktiviert, sofern** `*.streaming.block.enabled` nicht ausdrücklich
auf `true` gesetzt ist (Ausnahme: QQ Bot verfügt über keine `streaming.block`-Schlüssel und streamt
Blockantworten, sofern `channels.qqbot.streaming.mode` nicht `"off"` ist). Kanäle können
eine Live-Vorschau (`channels.<channel>.streaming.mode`) ohne Block-
antworten streamen. Die Standardwerte von `blockStreaming*` befinden sich unter `agents.defaults`, nicht auf der
obersten Konfigurationsebene.

## Vorschau-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming` (verschachteltes `{ mode, ... }`; veraltete
boolesche/Zeichenfolgen-Schreibweisen auf oberster Ebene werden durch `openclaw doctor --fix` umgeschrieben).

| Modus      | Verhalten                                                             |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Vorschau-Streaming deaktivieren                                       |
| `partial`  | Einzelne Vorschau wird durch den neuesten Text ersetzt                 |
| `block`    | Vorschau wird in aufgeteilten/angehängten Schritten aktualisiert       |
| `progress` | Fortschritts-/Statusvorschau während der Generierung, endgültige Antwort nach Abschluss |

`streaming.mode: "block"` ist ein Vorschau-Streaming-Modus für Kanäle mit Bearbeitungsfunktion
wie Discord und Telegram; er aktiviert dort nicht eigenständig
die Blockübermittlung des Kanals. Verwenden Sie `streaming.block.enabled` für normale Blockantworten.
Microsoft Teams bildet die
Ausnahme: Es verfügt über keinen Blocktransport für Entwurfsvorschauen, daher deaktiviert `streaming.mode:
"block"` das native Streaming vollständig, und die Antwort wird als reguläre
Blockübermittlung statt als natives Teil-/Fortschritts-Streaming zugestellt. Mattermost
unterscheidet sich ebenfalls: Im Modus `block` wechselt die Vorschau zwischen abgeschlossenem Text und
Blöcken mit Werkzeugaktivitäten, sodass frühere Blöcke als separate Beiträge sichtbar bleiben,
statt in einem bearbeitbaren Entwurf überschrieben zu werden.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Ja    | Ja        | Ja      | bearbeitbarer Fortschrittsentwurf |
| Discord    | Ja    | Ja        | Ja      | bearbeitbarer Fortschrittsentwurf |
| Slack      | Ja    | Ja        | Ja      | Ja                      |
| Mattermost | Ja    | Ja        | Ja      | Ja                      |
| MS Teams   | Ja    | Ja        | Ja      | nativer Fortschrittsstream |

Die Konfiguration der Vorschauaufteilung (`streaming.preview.chunk.*`, z. B. unter
`channels.discord.streaming` oder `channels.telegram.streaming`) verwendet standardmäßig
`minChars: 200`, `maxChars: 800` (begrenzt auf `textChunkLimit` des Kanals) und
`breakPreference: "paragraph"`.

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet Aufrufe der nativen Streaming-API von Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) um, wenn
  `channels.slack.streaming.mode="partial"` (Standard: `true`).
- Das native Slack-Streaming und der Status von Slack-Assistententhreads erfordern ein Antwort-
  thread-Ziel. DMs auf oberster Ebene zeigen diese threadartige Vorschau nicht an, können aber
  weiterhin Slack-Vorschauentwürfe und deren Bearbeitung verwenden.

### Migration veralteter Schlüssel

| Kanal    | Veraltete Schlüssel                                        | Status                                                                                                                                               |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, skalares/boolesches `streaming`                    | Wird durch `openclaw doctor --fix` in `streaming.mode` umgeschrieben; wird zur Laufzeit nicht gelesen                                                                        |
| Discord  | `streamMode`, boolesches `streaming`                           | Wird durch `openclaw doctor --fix` in `streaming.mode` umgeschrieben; wird zur Laufzeit nicht gelesen                                                                        |
| Slack    | `streamMode`; boolesches `streaming`; veraltetes `nativeStreaming` | Wird durch `openclaw doctor --fix` in `streaming.mode` (und für die booleschen/veralteten Formen in `streaming.nativeTransport`) umgeschrieben; wird zur Laufzeit nicht gelesen         |
| Matrix   | skalares/boolesches `streaming`                                  | Wird durch `openclaw doctor --fix` in `streaming.mode` (einschließlich des `"quiet"`-Modus von Matrix) umgeschrieben; wird zur Laufzeit nicht gelesen                                    |
| Feishu   | boolesches `streaming`                                         | Wird durch `openclaw doctor --fix` in `streaming.mode` umgeschrieben; wird zur Laufzeit nicht gelesen                                                                        |
| QQ Bot   | boolesches `streaming`; `streaming.c2cStreamApi`               | Wird durch `openclaw doctor --fix` in `streaming.mode` (und für die booleschen/`c2cStreamApi`-Formen in `streaming.nativeTransport`) umgeschrieben; wird zur Laufzeit nicht gelesen |

## Laufzeitverhalten

### Telegram

- Verwendet `sendMessage`- und `editMessageText`-Vorschauaktualisierungen in Direktnachrichten und
  Gruppen/Themen; der endgültige Text bearbeitet die aktive Vorschau direkt. Die
  kurzlebigen 30-sekündigen „Tippen“-Entwürfe von Telegram (`sendMessageDraft`) werden nicht für
  das Antwort-Streaming verwendet.
- Kurze anfängliche Vorschauen werden für eine bessere UX bei Push-Benachrichtigungen weiterhin verzögert, erscheinen
  jedoch nach einer begrenzten Wartezeit, damit aktive Ausführungen nicht visuell stumm bleiben.
- Lange endgültige Antworten verwenden die Vorschaunachricht für den ersten Abschnitt erneut und senden nur die
  verbleibenden Abschnitte.
- Der Modus `block` überführt die Vorschau bei
  `streaming.preview.chunk.maxChars` in eine neue Nachricht (Standardwert 800, begrenzt durch das
  Bearbeitungslimit von Telegram von 4096); andere Modi erweitern eine einzelne Vorschau auf bis zu 4096 Zeichen.
- Der Modus `progress` hält den Werkzeugfortschritt in einem bearbeitbaren Statusentwurf, zeigt
  die Statusbezeichnung an, wenn das Antwort-Streaming aktiv, aber noch keine Werkzeugzeile
  verfügbar ist, löscht den Entwurf nach Abschluss und sendet die endgültige Antwort
  über die normale Zustellung.
- Wenn die abschließende Bearbeitung fehlschlägt, bevor der vollständige Text bestätigt wurde, verwendet OpenClaw
  die normale endgültige Zustellung und bereinigt die veraltete Vorschau.
- Vorschau-Streaming wird übersprungen, wenn das Block-Streaming für Telegram ausdrücklich
  aktiviert ist, um doppeltes Streaming zu vermeiden.
- `/reasoning stream` kann Schlussfolgerungen in eine temporäre Vorschau schreiben, die
  nach der endgültigen Zustellung gelöscht wird.
- Antworten auf ausgewählte Zitate in Telegram bilden eine Ausnahme: Wenn `replyToMode` nicht
  `"off"` ist und ausgewählter Zitattext vorhanden ist, überspringt OpenClaw für diesen Durchlauf
  den Vorschau-Stream der Antwort (die endgültige Antwort muss über den nativen Pfad für
  Zitatantworten gesendet werden), sodass Vorschauzeilen zum Werkzeugfortschritt nicht dargestellt werden können.
  Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten das Vorschau-Streaming bei. Weitere
  Einzelheiten finden Sie in der [Dokumentation zum Telegram-Kanal](/de/channels/telegram).

### Discord

- Verwendet das Senden und Bearbeiten von Vorschaunachrichten.
- Der Modus `block` verwendet die Aufteilung von Entwürfen (`draftChunk`).
- Vorschau-Streaming wird übersprungen, wenn das Block-Streaming für Discord ausdrücklich
  aktiviert ist.
- Der Modus `progress` hängt eine kleine `-#`-Aktivitätsübersicht (Anzahl der Denk-/Werkzeugaufrufe
  und verstrichene Zeit) an die endgültige Antwort an und löscht den Statusentwurf,
  sobald diese Antwort zugestellt wurde, sodass in stark frequentierten Kanälen kein verwaistes Werkzeugprotokoll
  über der Antwort verbleibt. Endgültige Fehlermeldungen behalten den Entwurf als Aufzeichnung des fehlgeschlagenen
  Durchlaufs bei.
- Endgültige Medien-, Fehler- und explizite Antwort-Nutzlasten verwerfen ausstehende Vorschauen,
  ohne einen neuen Entwurf zu übertragen, und verwenden anschließend die normale Zustellung.

### Slack

- `partial` kann das native Streaming von Slack (`chat.startStream`/`append`/`stop`)
  verwenden, sofern verfügbar.
- `block` verwendet Entwurfsvorschauen im Anhängestil.
- `progress` verwendet zunächst einen Statusvorschautext und anschließend die endgültige Antwort.
- Direktnachrichten auf oberster Ebene ohne Antwort-Thread verwenden Vorschaubeiträge und Bearbeitungen von Entwürfen
  anstelle des nativen Streamings von Slack.
- Natives Streaming und Entwurfsvorschau-Streaming unterdrücken Blockantworten für diesen Durchlauf, sodass eine
  Slack-Antwort nur über einen einzigen Zustellungspfad gestreamt wird.
- Endgültige Medien-/Fehler-Nutzlasten und abschließende Fortschrittsmeldungen erzeugen keine vorübergehenden
  Entwurfsnachrichten; nur endgültige Text-/Blocknachrichten, welche die Vorschau bearbeiten können, übertragen ausstehenden
  Entwurfstext.

### Mattermost

- Im Modus `partial` werden Denkprozess und unvollständiger Antworttext in einen einzigen
  Vorschaubeitrag gestreamt, der direkt abgeschlossen wird, sobald die endgültige Antwort sicher gesendet werden kann.
- Im Modus `progress` werden Denkprozess und Werkzeugaktivität in eine einzige Statusvorschau
  gestreamt, die direkt abgeschlossen wird, sobald die endgültige Antwort sicher gesendet werden kann.
- Im Modus `block` wird zwischen Beiträgen mit abgeschlossenem Text und Werkzeugaktivität gewechselt;
  parallele und aufeinanderfolgende Werkzeugaktualisierungen verwenden gemeinsam den aktuellen Werkzeugaktivitätsbeitrag.
- Wenn der Vorschaubeitrag gelöscht wurde oder zum Abschlusszeitpunkt aus einem anderen Grund
  nicht verfügbar ist, wird ersatzweise ein neuer endgültiger Beitrag gesendet.
- Endgültige Medien-/Fehler-Nutzlasten verwerfen ausstehende Vorschauaktualisierungen vor der normalen
  Zustellung, statt einen temporären Vorschaubeitrag zu übertragen.

### Matrix

- Entwurfsvorschauen werden direkt abgeschlossen, wenn der endgültige Text das Vorschauereignis
  wiederverwenden kann.
- Bei endgültigen Nachrichten, die nur Medien enthalten, Fehler darstellen oder ein abweichendes Antwortziel haben, werden ausstehende Vorschauaktualisierungen
  vor der normalen Zustellung verworfen; eine bereits sichtbare veraltete Vorschau wird geschwärzt.

## Vorschauaktualisierungen zum Werkzeugfortschritt

Vorschau-Streaming kann auch Aktualisierungen zum **Werkzeugfortschritt** enthalten: kurze Statuszeilen
wie „Websuche läuft“, „Datei wird gelesen“ oder „Werkzeug wird aufgerufen“, die während der
Werkzeugausführung in derselben Vorschaunachricht vor der endgültigen Antwort erscheinen.
Im Codex-App-Server-Modus verwenden Codex-Präambel-/Kommentarnachrichten denselben
Vorschaupfad, sodass kurze Fortschrittshinweise wie „Ich prüfe ...“ in den
bearbeitbaren Entwurf gestreamt werden können, ohne Teil der endgültigen Antwort zu werden. Dadurch bleiben
mehrstufige Werkzeugdurchläufe visuell aktiv, statt zwischen der ersten
Denkvorschau und der endgültigen Antwort stumm zu bleiben.

Lang laufende Werkzeuge können vor ihrer Rückgabe typisierte Fortschrittsmeldungen ausgeben. Beispielsweise
startet `web_fetch` beim Start einen Fünf-Sekunden-Timer: Wenn der Abruf noch
aussteht, zeigt die Vorschau `Fetching page content...`; wenn der Abruf vorher abgeschlossen oder
abgebrochen wird, wird keine Fortschrittszeile ausgegeben. Das spätere endgültige Werkzeugergebnis
wird weiterhin normal an das Modell übermittelt.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen Werkzeugfortschritt und
  Codex-Präambelaktualisierungen standardmäßig in die Live-Vorschau, wenn das Vorschau-Streaming
  aktiv ist. Microsoft Teams verwendet in persönlichen Chats seinen nativen Fortschrittsstream.
- Telegram wird seit `v2026.4.22` mit aktivierten Vorschauaktualisierungen zum Werkzeugfortschritt
  ausgeliefert; ihre Aktivierung beizubehalten bewahrt dieses veröffentlichte Verhalten.
- **Mattermost** fasst die Werkzeugaktivität in den Modi `partial` und
  `progress` in einem Vorschaubeitrag oder im Modus `block` in einem Werkzeugaktivitätsbeitrag
  zwischen Textblöcken zusammen (siehe oben).
- Bearbeitungen zum Werkzeugfortschritt folgen dem aktiven Vorschau-Streaming-Modus; sie werden
  übersprungen, wenn das Vorschau-Streaming auf `off` gesetzt ist oder das Block-Streaming die
  Nachricht übernommen hat. In Telegram ist `streaming.mode: "off"` ausschließlich für endgültige Nachrichten bestimmt:
  Allgemeine Fortschrittsmeldungen werden ebenfalls unterdrückt, statt als eigenständige Statusnachrichten
  zugestellt zu werden, während Genehmigungsaufforderungen, Medien-Nutzlasten und Fehler weiterhin
  normal weitergeleitet werden.
- Um das Vorschau-Streaming beizubehalten, aber Zeilen zum Werkzeugfortschritt auszublenden, setzen Sie
  `streaming.preview.toolProgress` für diesen Kanal auf `false` (Standardwert:
  `true`). Um Zeilen zum Werkzeugfortschritt sichtbar zu lassen und gleichzeitig Befehls-/Ausführungstext auszublenden,
  setzen Sie `streaming.preview.commandText` auf `"status"` oder
  `streaming.progress.commandText` auf `"status"`; der Standardwert ist `"raw"`, um
  das veröffentlichte Verhalten beizubehalten. Diese Richtlinie gilt gemeinsam für Entwurfs-/Fortschrittskanäle,
  die den kompakten Fortschrittsrenderer von OpenClaw verwenden, darunter Discord, Matrix,
  Microsoft Teams, Mattermost, Slack-Entwurfsvorschauen und Telegram. Um
  Vorschaubearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.

## Darstellung von Fortschrittsentwürfen

Entwürfe im Fortschrittsmodus (`streaming.progress.*`) sind begrenzt und pro
Kanal konfigurierbar:

| Schlüssel                         | Standardwert  | Verhalten                                                      |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Maximale Anzahl kompakter Fortschrittszeilen unterhalb der Entwurfsbezeichnung |
| `streaming.progress.maxLineChars` | `120`         | Maximale Zeichenzahl pro kompakter Zeile vor der Kürzung (wortsensitiv) |
| `streaming.progress.label`        | `"auto"`      | Entwurfstitel; eine benutzerdefinierte Zeichenfolge oder `false`, um ihn auszublenden |
| `streaming.progress.labels`       | integrierter Pool | Mögliche Bezeichnungen, die verwendet werden, wenn `label: "auto"`       |

### Kommentierungs-Fortschrittsspur

Zusätzlich zum Werkzeugfortschritt kann der kompakte Fortschrittsrenderer eine weitere Spur
im Entwurf anzeigen:

- **`streaming.progress.commentary`** – stellt den **Kommentar**
  des Modells vor der Werkzeugverwendung (eine kurze Erläuterung wie „Ich prüfe ... und dann ...“) zwischen
  den Werkzeugzeilen im Fortschrittsentwurf dar. Bei Discord und Telegram liefert
  dieselbe Präambel im Fortschrittsmodus die Statusüberschrift, selbst wenn diese optionale Spur
  deaktiviert ist; andere Kanäle behalten ihr bestehendes Fortschrittsverhalten bei. Siehe
  [Fortschrittsentwürfe](/de/concepts/progress-drafts#status-headline).

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Fortschrittszeilen sichtbar lassen, aber unverarbeiteten Befehls-/Ausführungstext ausblenden:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

Verwenden Sie dieselbe Struktur unter einem anderen Schlüssel für einen kompakten Fortschrittskanal, beispielsweise
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` oder Slack-Entwurfsvorschauen. Platzieren Sie für den Fortschrittsentwurfsmodus
dieselbe Richtlinie unter `streaming.progress`:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## Verwandte Themen

- [Refaktorierung des Nachrichtenlebenszyklus](/de/concepts/message-lifecycle-refactor) – angestrebtes gemeinsames Design für Vorschau, Bearbeitung, Streaming und Abschluss
- [Fortschrittsentwürfe](/de/concepts/progress-drafts) – sichtbare Nachrichten zu laufenden Arbeiten, die während langer Durchläufe aktualisiert werden
- [Nachrichten](/de/concepts/messages) – Nachrichtenlebenszyklus und Zustellung
- [Wiederholungsversuch](/de/concepts/retry) – Wiederholungsverhalten bei einem Zustellungsfehler
- [Kanäle](/de/channels) – Streaming-Unterstützung pro Kanal
