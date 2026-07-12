---
read_when:
    - Funktionsweise von Streaming oder Aufteilung in Abschnitte bei Kanälen erläutern
    - Verhalten von Block-Streaming oder Kanal-Chunking ändern
    - Fehlersuche bei doppelten/vorzeitigen Blockantworten oder beim Vorschau-Streaming in Kanälen
summary: Streaming- und Chunking-Verhalten (blockweise Antworten, Streaming der Kanalvorschau, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-07-12T15:17:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7860a83183459ea3dd05c866118e14bc8469c7adcd074a25b6f4a1174cb1664d
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
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ Chunker gibt Blöcke aus, während der Puffer wächst
       └─ (blockStreamingBreak=message_end)
            └─ Chunker leert den Puffer bei message_end
                   └─ Senden an Kanal (Blockantworten)
```

- `text_delta/events`: Modell-Stream-Ereignisse (können bei Nicht-Streaming-Modellen spärlich sein).
- `chunker`: `EmbeddedBlockChunker`, der Mindest-/Höchstgrenzen und eine bevorzugte Trennstelle anwendet.
- `channel send`: tatsächlich ausgehende Nachrichten (Blockantworten).

**Steuerungsoptionen** (alle unter `agents.defaults`, sofern nicht anders angegeben):

| Schlüssel                                                    | Werte/Form                                                            | Standardwert |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------ |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                       | `"off"`      |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                         | -            |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                             | -            |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen) | - |
| `*.blockStreaming` (kanalspezifische Überschreibung)         | `true` / `false`, erzwingt Block-Streaming pro Kanal (und pro Konto)   | -            |
| `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`) | Zahl, feste Obergrenze                                                 | 4000         |
| `*.chunkMode`                                                | `"length"` / `"newline"`                                               | `"length"`   |
| `channels.discord.maxLinesPerMessage`                        | Zahl, weiche Zeilenobergrenze, die hohe Antworten aufteilt, um Abschneiden in der Benutzeroberfläche zu vermeiden | 17 |

`chunkMode: "newline"` trennt an Leerzeilen (Absatzgrenzen), nicht an jedem
Zeilenumbruch, bevor auf eine längenbasierte Aufteilung zurückgegriffen wird, sobald der Text den
Grenzwert überschreitet.

Kanäle mit einer verschachtelten `streaming`-Konfiguration (Telegram, Discord, Slack, iMessage,
Microsoft Teams) schreiben diese Überschreibungen als
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`; die flachen
Schreibweisen `*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` gelten
für Kanäle ohne eine solche Konfiguration (beispielsweise Signal, IRC, Google Chat, WhatsApp,
Mattermost). Veraltete flache Schlüssel für Kanäle mit verschachteltem Streaming werden von
`openclaw doctor --fix` migriert und zur Laufzeit nicht gelesen.

**Grenzsemantik** für `blockStreamingBreak`:

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` den Puffer leeren.
- `message_end`: Warten, bis die Assistentennachricht abgeschlossen ist, und dann die gepufferte
  Ausgabe senden. Der Chunker wird weiterhin verwendet, wenn der gepufferte Text `maxChars` überschreitet,
  sodass am Ende mehrere Abschnitte ausgegeben werden können.

### Medienübermittlung mit Block-Streaming

Gestreamte Medien müssen strukturierte Payload-Felder wie `mediaUrl` oder
`mediaUrls` verwenden; gestreamter Text wird nicht als Anhangsbefehl ausgewertet. Wenn Block-Streaming
Medien frühzeitig sendet, merkt sich OpenClaw diese Übermittlung für den Durchlauf. Wenn
die endgültige Assistenten-Payload dieselbe Medien-URL wiederholt, entfernt die endgültige Übermittlung
das doppelte Medium, statt den Anhang erneut zu senden.

Exakt identische endgültige Payloads werden unterdrückt. Wenn die endgültige Payload
zusätzlichen Text um bereits gestreamte Medien enthält, sendet OpenClaw weiterhin den
neuen Text, während das Medium nur einmal übermittelt wird. Dadurch werden doppelte Sprachnachrichten
oder Dateien auf Kanälen wie Telegram verhindert.

## Aufteilungsalgorithmus (Unter-/Obergrenzen)

Die Blockaufteilung wird von `EmbeddedBlockChunker` implementiert:

- **Untergrenze:** Keine Ausgabe, bis Puffer >= `minChars` (außer bei erzwungener Ausgabe).
- **Obergrenze:** Trennungen vor `maxChars` bevorzugen; bei erzwungener Ausgabe bei `maxChars` trennen.
- **Kette bevorzugter Trennstellen:** `paragraph` -> `newline` -> `sentence` ->
  Leerraum -> harte Trennung.
- **Code-Fences:** Niemals innerhalb von Fences trennen; bei erzwungener Trennung an `maxChars` die
  Fence schließen und erneut öffnen, damit das Markdown gültig bleibt.

`maxChars` wird auf das `textChunkLimit` des Kanals begrenzt, sodass Sie
kanalspezifische Obergrenzen nicht überschreiten können.

## Zusammenführen (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Blockabschnitte
zusammenführen**, bevor sie gesendet werden. Dadurch wird eine Flut einzelner Zeilen reduziert, während weiterhin
eine fortlaufende Ausgabe bereitgestellt wird.

- Beim Zusammenführen wird vor dem Senden auf **Leerlaufintervalle** (`idleMs`) gewartet.
- Puffer werden durch `maxChars` begrenzt und gesendet, wenn sie diesen Wert überschreiten.
- `minChars` verhindert das Senden winziger Fragmente, bis sich genügend Text angesammelt hat
  (beim abschließenden Senden wird der verbleibende Text immer gesendet).
- Das Verbindungselement wird aus `blockStreamingChunk.breakPreference` abgeleitet: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> Leerzeichen.
- Kanalspezifische Überschreibungen sind über `*.blockStreamingCoalesce` verfügbar (einschließlich
  kontospezifischer Konfigurationen).
- Discord, Signal und Slack verwenden standardmäßig `{ minChars: 1500, idleMs: 1000 }`
  für das Zusammenführen, sofern dies nicht überschrieben wird.

## Menschlich wirkende Pausen zwischen Blöcken

Wenn Block-Streaming aktiviert ist, wird nach dem ersten Block eine **zufällige Pause** zwischen
Blockantworten eingefügt, damit Antworten mit mehreren Sprechblasen natürlicher wirken.

| `agents.defaults.humanDelay.mode` | Verhalten                    |
| --------------------------------- | ---------------------------- |
| `off` (Standardwert)              | Keine Pause                  |
| `natural`                         | 800-2500ms zufällige Pause   |
| `custom`                          | `minMs`/`maxMs`              |

Pro Agent über `agents.list[].humanDelay` überschreiben. Gilt nur für **Blockantworten**,
nicht für endgültige Antworten oder Werkzeugzusammenfassungen.

## „Abschnitte oder alles streamen“

- **Abschnitte streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (während der Generierung ausgeben). Kanäle außer Telegram benötigen außerdem `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal senden,
  bei sehr langen Inhalten möglicherweise in mehreren Abschnitten).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur endgültige Antwort).

Block-Streaming ist **deaktiviert, sofern** `*.blockStreaming` nicht ausdrücklich auf
`true` gesetzt ist. Kanäle können eine Live-Vorschau (`channels.<channel>.streaming`)
ohne Blockantworten streamen. Die Standardwerte für `blockStreaming*` befinden sich unter
`agents.defaults`, nicht auf der obersten Konfigurationsebene.

## Modi für Vorschau-Streaming

Kanonischer Schlüssel: `channels.<channel>.streaming` (verschachtelt `{ mode, ... }`; veraltete
boolesche/Zeichenketten-Schreibweisen auf oberster Ebene werden von `openclaw doctor --fix` umgeschrieben).

| Modus      | Verhalten                                                              |
| ---------- | ---------------------------------------------------------------------- |
| `off`      | Vorschau-Streaming deaktivieren                                        |
| `partial`  | Einzelne Vorschau wird durch den neuesten Text ersetzt                 |
| `block`    | Vorschau wird schrittweise in Abschnitten aktualisiert/ergänzt         |
| `progress` | Fortschritts-/Statusvorschau während der Generierung, endgültige Antwort nach Abschluss |

`streaming.mode: "block"` ist ein Vorschau-Streaming-Modus für
bearbeitungsfähige Kanäle wie Discord und Telegram; er aktiviert dort nicht
von selbst die Blockübermittlung an den Kanal. Verwenden Sie `streaming.block.enabled` für normale Blockantworten
(Kanäle ohne verschachtelte `streaming`-Konfiguration behalten stattdessen den flachen Schlüssel
`blockStreaming`). Microsoft Teams bildet die
Ausnahme: Es verfügt über keinen Blocktransport für Entwurfsvorschauen, daher deaktiviert `streaming.mode:
"block"` das native Streaming vollständig, und die Antwort wird stattdessen als reguläre
Blockübermittlung gesendet und nicht als natives Teil-/Fortschritts-Streaming. Mattermost unterscheidet sich ebenfalls:
Im Modus `block` wechselt die Vorschau zwischen abgeschlossenen Textblöcken und
Blöcken mit Werkzeugaktivitäten, sodass frühere Blöcke als separate Beiträge sichtbar bleiben,
statt in einem einzigen bearbeitbaren Entwurf überschrieben zu werden.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`                       |
| ---------- | ----- | --------- | ------- | -------------------------------- |
| Telegram   | Ja    | Ja        | Ja      | bearbeitbarer Fortschrittsentwurf |
| Discord    | Ja    | Ja        | Ja      | bearbeitbarer Fortschrittsentwurf |
| Slack      | Ja    | Ja        | Ja      | Ja                               |
| Mattermost | Ja    | Ja        | Ja      | Ja                               |
| MS Teams   | Ja    | Ja        | Ja      | nativer Fortschritts-Stream      |

Die Konfiguration der Vorschauabschnitte (`streaming.preview.chunk.*`, z. B. unter
`channels.discord.streaming` oder `channels.telegram.streaming`) verwendet standardmäßig
`minChars: 200`, `maxChars: 800` (begrenzt auf das `textChunkLimit` des Kanals) und
`breakPreference: "paragraph"`.

Nur für Slack:

- `channels.slack.streaming.nativeTransport` schaltet Aufrufe der nativen Streaming-API von Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) um, wenn
  `channels.slack.streaming.mode="partial"` gilt (Standardwert: `true`).
- Das native Streaming von Slack und der Thread-Status des Slack-Assistenten erfordern einen
  Antwort-Thread als Ziel. Direktnachrichten auf oberster Ebene zeigen diese threadartige Vorschau nicht an, können
  jedoch weiterhin Slack-Beiträge als Entwurfsvorschau und deren Bearbeitungen verwenden.

### Migration veralteter Schlüssel

| Kanal    | Veraltete Schlüssel                                         | Status                                                                                                                                                          |
| -------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, skalares/boolesches `streaming`               | Wird von `openclaw doctor --fix` in `streaming.mode` umgeschrieben; wird zur Laufzeit nicht gelesen                                                              |
| Discord  | `streamMode`, boolesches `streaming`                        | Wird von `openclaw doctor --fix` in `streaming.mode` umgeschrieben; wird zur Laufzeit nicht gelesen                                                              |
| Slack    | `streamMode`; boolesches `streaming`; veraltetes `nativeStreaming` | Wird von `openclaw doctor --fix` in `streaming.mode` (und für die booleschen/veralteten Formen in `streaming.nativeTransport`) umgeschrieben; wird zur Laufzeit nicht gelesen |

## Laufzeitverhalten

### Telegram

- Verwendet `sendMessage`- und `editMessageText`-Vorschauaktualisierungen in Direktnachrichten und
  Gruppen/Themen; der endgültige Text aktualisiert die aktive Vorschau direkt. Die
  kurzlebigen 30-sekündigen Telegram-„Tippen“-Entwürfe (`sendMessageDraft`) werden nicht für
  das Streaming von Antworten verwendet.
- Kurze anfängliche Vorschauen werden weiterhin zur Verbesserung der Push-Benachrichtigungs-UX entprellt,
  erscheinen jedoch nach einer begrenzten Verzögerung, damit aktive Ausführungen nicht visuell stumm bleiben.
- Lange endgültige Antworten verwenden die Vorschaunachricht für den ersten Abschnitt erneut und senden nur die
  verbleibenden Abschnitte.
- Der Modus `block` überführt die Vorschau bei
  `streaming.preview.chunk.maxChars` (Standardwert 800, begrenzt auf das Telegram-Limit von 4096
  für Bearbeitungen) in eine neue Nachricht; andere Modi erweitern eine einzelne Vorschau auf bis zu 4096 Zeichen.
- Der Modus `progress` hält den Werkzeugfortschritt in einem bearbeitbaren Statusentwurf, zeigt
  die Statusbezeichnung an, wenn das Antwort-Streaming aktiv ist, aber noch keine Werkzeugzeile
  verfügbar ist, löscht den Entwurf nach Abschluss und sendet die endgültige Antwort
  über die normale Zustellung.
- Wenn die abschließende Bearbeitung fehlschlägt, bevor der vollständige Text bestätigt wurde, verwendet OpenClaw
  die normale endgültige Zustellung und entfernt die veraltete Vorschau.
- Das Vorschau-Streaming wird übersprungen, wenn das Telegram-Block-Streaming ausdrücklich
  aktiviert ist, um doppeltes Streaming zu vermeiden.
- `/reasoning stream` kann Begründungen in eine vorübergehende Vorschau schreiben, die
  nach der endgültigen Zustellung gelöscht wird.
- Antworten auf ausgewählte Telegram-Zitate bilden eine Ausnahme: Wenn `replyToMode` nicht
  `"off"` ist und ausgewählter Zitattext vorhanden ist, überspringt OpenClaw für diesen Durchlauf
  den Antwort-Vorschaustream (die endgültige Antwort muss den nativen Pfad für Zitatantworten
  verwenden), sodass Vorschauzeilen zum Werkzeugfortschritt nicht dargestellt werden können. Antworten auf
  die aktuelle Nachricht ohne ausgewählten Zitattext behalten das Vorschau-Streaming bei. Einzelheiten finden Sie in der
  [Dokumentation zum Telegram-Kanal](/de/channels/telegram).

### Discord

- Verwendet das Senden und Bearbeiten von Vorschaunachrichten.
- Der Modus `block` verwendet die Entwurfssegmentierung (`draftChunk`).
- Das Vorschau-Streaming wird übersprungen, wenn das Discord-Block-Streaming ausdrücklich
  aktiviert ist.
- Der Modus `progress` fügt der endgültigen Antwort eine kleine `-#`-Aktivitätsbestätigung
  (Anzahl der Gedanken/Werkzeugaufrufe und verstrichene Zeit) hinzu und löscht den Statusentwurf,
  sobald diese Antwort zugestellt wurde, damit in stark frequentierten Kanälen kein verwaistes Werkzeugprotokoll
  über der Antwort verbleibt. Bei abschließenden Fehlermeldungen bleibt der Entwurf als Protokoll des fehlgeschlagenen
  Durchlaufs erhalten.
- Endgültige Medien-, Fehler- und explizite Antwort-Payloads verwerfen ausstehende Vorschauen,
  ohne einen neuen Entwurf zu übertragen, und verwenden anschließend die normale Zustellung.

### Slack

- `partial` kann, sofern verfügbar, das native Slack-Streaming (`chat.startStream`/`append`/`stop`)
  verwenden.
- `block` verwendet Entwurfsvorschauen im Anfügestil.
- `progress` verwendet Statusvorschautext und anschließend die endgültige Antwort.
- Direktnachrichten auf oberster Ebene ohne Antwort-Thread verwenden Beiträge und Bearbeitungen von Entwurfsvorschauen
  anstelle des nativen Slack-Streamings.
- Natives Streaming und Entwurfsvorschau-Streaming unterdrücken Blockantworten für diesen Durchlauf, sodass eine
  Slack-Antwort nur über einen Zustellungspfad gestreamt wird.
- Endgültige Medien-/Fehler-Payloads und endgültige Fortschrittsantworten erstellen keine kurzlebigen
  Entwurfsnachrichten; nur endgültige Text-/Blockantworten, die die Vorschau bearbeiten können, übertragen ausstehenden
  Entwurfstext.

### Mattermost

- Im Modus `partial` werden Gedankengang und unvollständiger Antworttext in einen einzigen Entwurfs-
  Vorschau-Beitrag gestreamt, der direkt finalisiert wird, sobald die endgültige Antwort sicher gesendet werden kann.
- Im Modus `progress` werden Gedankengang und Tool-Aktivität in eine einzige Status-
  Vorschau gestreamt, die direkt finalisiert wird, sobald die endgültige Antwort sicher gesendet werden kann.
- Im Modus `block` wird zwischen Beiträgen mit abgeschlossenem Text und Tool-Aktivität gewechselt;
  parallele und aufeinanderfolgende Tool-Aktualisierungen verwenden gemeinsam den aktuellen Tool-Aktivitätsbeitrag.
- Wenn der Vorschau-Beitrag gelöscht wurde oder zum Zeitpunkt der Finalisierung
  anderweitig nicht verfügbar ist, wird stattdessen ein neuer endgültiger Beitrag gesendet.
- Endgültige Medien-/Fehler-Payloads brechen ausstehende Vorschau-Aktualisierungen vor der normalen
  Zustellung ab, anstatt einen temporären Vorschau-Beitrag zu veröffentlichen.

### Matrix

- Entwurfsvorschauen werden direkt finalisiert, wenn der endgültige Text das Vorschau-
  Ereignis wiederverwenden kann.
- Endgültige Antworten, die nur Medien oder Fehler enthalten oder deren Antwortziel nicht übereinstimmt, brechen ausstehende Vorschau-
  Aktualisierungen vor der normalen Zustellung ab; eine bereits sichtbare veraltete Vorschau wird geschwärzt.

## Vorschauaktualisierungen zum Tool-Fortschritt

Das Vorschau-Streaming kann auch Aktualisierungen zum **Tool-Fortschritt** enthalten: kurze Statuszeilen wie „Web wird durchsucht“, „Datei wird gelesen“ oder „Tool wird aufgerufen“, die während der Ausführung von Tools in derselben Vorschaunachricht vor der endgültigen Antwort erscheinen. Im Codex-App-Server-Modus verwenden Codex-Präambel- und -Kommentarnachrichten denselben Vorschaupfad, sodass kurze Fortschrittshinweise wie „Ich prüfe …“ in den bearbeitbaren Entwurf gestreamt werden können, ohne Teil der endgültigen Antwort zu werden. Dadurch bleiben mehrstufige Tool-Vorgänge visuell aktiv, anstatt zwischen der ersten Denkvorschau und der endgültigen Antwort stillzustehen.

Lang laufende Tools können vor ihrer Rückgabe typisierte Fortschrittsmeldungen ausgeben. Beispielsweise
startet `web_fetch` beim Start einen Fünf-Sekunden-Timer: Wenn der Abruf noch
aussteht, zeigt die Vorschau `Fetching page content...` an; wenn der Abruf vorher abgeschlossen
oder abgebrochen wird, wird keine Fortschrittszeile ausgegeben. Das spätere endgültige
Tool-Ergebnis wird weiterhin wie gewohnt an das Modell übermittelt.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen standardmäßig den Werkzeugfortschritt und
  Codex-Präambelaktualisierungen in die Live-Vorschau, wenn das Vorschau-
  Streaming aktiv ist. Microsoft Teams verwendet in persönlichen Chats seinen
  nativen Fortschrittsstream.
- Bei Telegram sind Vorschauaktualisierungen zum Werkzeugfortschritt seit
  `v2026.4.22` aktiviert; wenn sie aktiviert bleiben, wird dieses veröffentlichte Verhalten beibehalten.
- **Mattermost** fasst die Werkzeugaktivität in den Modi `partial` und
  `progress` in einem Vorschaubeitrag zusammen oder zeigt sie im Modus `block`
  in einem Werkzeugaktivitätsbeitrag zwischen Textblöcken an (siehe oben).
- Änderungen zum Werkzeugfortschritt folgen dem aktiven Vorschau-Streaming-Modus; sie
  werden übersprungen, wenn das Vorschau-Streaming auf `off` gesetzt ist oder das Block-Streaming
  die Nachricht übernommen hat. Bei Telegram bedeutet `streaming.mode: "off"` ausschließlich die endgültige Ausgabe:
  Allgemeine Fortschrittsmeldungen werden ebenfalls unterdrückt, statt als eigenständige Statusmeldungen
  zugestellt zu werden, während Genehmigungsaufforderungen, Mediennutzlasten und Fehler weiterhin
  normal weitergeleitet werden.
- Um das Vorschau-Streaming beizubehalten, aber Zeilen zum Werkzeugfortschritt auszublenden, setzen Sie
  `streaming.preview.toolProgress` für diesen Kanal auf `false` (Standardwert:
  `true`). Um Zeilen zum Werkzeugfortschritt sichtbar zu lassen und gleichzeitig Befehls-/Ausführungstext auszublenden,
  setzen Sie `streaming.preview.commandText` auf `"status"` oder
  `streaming.progress.commandText` auf `"status"`; der Standardwert ist `"raw"`, um
  das veröffentlichte Verhalten beizubehalten. Diese Richtlinie gilt gemeinsam für Entwurfs-/Fortschrittskanäle,
  die den kompakten Fortschritts-Renderer von OpenClaw verwenden, einschließlich Discord, Matrix,
  Microsoft Teams, Mattermost, Slack-Entwurfsvorschauen und Telegram. Um
  Vorschauänderungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.

## Darstellung von Fortschrittsentwürfen

Entwürfe im Fortschrittsmodus (`streaming.progress.*`) sind begrenzt und pro
Kanal konfigurierbar:

| Schlüssel                         | Standardwert          | Verhalten                                                                  |
| --------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`                   | Maximale Anzahl kompakter Fortschrittszeilen unterhalb der Entwurfsbezeichnung |
| `streaming.progress.maxLineChars` | `120`                 | Maximale Zeichenzahl pro kompakter Zeile vor der Kürzung (wortbasiert)     |
| `streaming.progress.label`        | `"auto"`              | Entwurfstitel; eine benutzerdefinierte Zeichenfolge oder `false`, um ihn auszublenden |
| `streaming.progress.labels`       | integrierter Vorrat   | Mögliche Bezeichnungen bei Verwendung von `label: "auto"`                  |

### Kommentar-Fortschrittsspur

Neben dem Werkzeugfortschritt kann der kompakte Fortschritts-Renderer eine weitere Spur
im Entwurf anzeigen:

- **`streaming.progress.commentary`** - zeigt den vor der Werkzeugverwendung ausgegebenen
  **Kommentar** des Modells (eine kurze Erzählung wie „Ich prüfe ... und dann ...“) zwischen
  den Werkzeugzeilen im Fortschrittsentwurf an.

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

Verwenden Sie dieselbe Struktur unter dem Schlüssel eines anderen kompakten Fortschrittskanals, zum Beispiel
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` oder für Slack-Entwurfsvorschauen. Legen Sie für den Fortschrittsentwurfsmodus
dieselbe Richtlinie unter `streaming.progress` fest:

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

- [Refaktorierung des Nachrichtenlebenszyklus](/de/concepts/message-lifecycle-refactor) - angestrebter gemeinsamer Entwurf für Vorschau, Bearbeitung, Streaming und Abschluss
- [Fortschrittsentwürfe](/de/concepts/progress-drafts) - sichtbare Nachrichten über laufende Arbeiten, die bei langen Durchläufen aktualisiert werden
- [Nachrichten](/de/concepts/messages) - Nachrichtenlebenszyklus und Zustellung
- [Wiederholungsversuche](/de/concepts/retry) - Verhalten bei Zustellungsfehlern
- [Kanäle](/de/channels) - Streaming-Unterstützung pro Kanal
