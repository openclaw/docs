---
read_when:
    - Erläuterung der Funktionsweise von Streaming oder Chunking in Kanälen
    - Verhalten von Block-Streaming oder Kanal-Chunking ändern
    - Fehlerbehebung bei doppelten/vorzeitigen Blockantworten oder beim Vorschau-Streaming in Kanälen
summary: Streaming- und Chunking-Verhalten (blockweise Antworten, Streaming der Kanalvorschau, Moduszuordnung)
title: Streaming und Aufteilung in Blöcke
x-i18n:
    generated_at: "2026-07-24T03:50:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a498f2e490ae6f2ecdebba92f0b992f2e16d212eae6a437eb3a0ef8a59354e13
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw verfügt über zwei unabhängige Streaming-Ebenen, und derzeit gibt es **kein echtes
Token-Delta-Streaming** für Kanalnachrichten:

- **Block-Streaming (Kanäle):** Gibt abgeschlossene **Blöcke** aus, während der Assistent
  schreibt. Dabei handelt es sich um normale Kanalnachrichten, nicht um Token-Deltas.
- **Vorschau-Streaming (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  Aktualisiert während der Generierung eine temporäre **Vorschaunachricht** (Senden + Bearbeitungen/Anhängen).

## Startstatus in der Control UI

Nachdem `chat.send` einen aktiven Lauf bestätigt hat, kann das Gateway einen typisierten,
groben Startstatus senden, bevor Text des Assistenten oder Werkzeugaktivitäten sichtbar sind. Die
Control UI zeigt diesen Status neben der Arbeitsanzeige an, mit Phasen für
Arbeitsbereichsvorbereitung, Umgebungsbereitstellung, Kontextvorbereitung und
Modellstart.

Das erste Delta des Assistenten oder der erste Werkzeugstart ersetzt den Startstatus für
diesen Lauf dauerhaft. Der Genehmigungsstatus hat Vorrang, während ein Werkzeug auf eine Aktion
des Bedieners wartet. Die Erstellung des Worktrees und die anfängliche Cloud-Übermittlung erfolgen, bevor ein Chatlauf
existiert. Daher wird deren RPC-Fortschritt vor dem Lauf nicht als Laufstartstatus dargestellt;
die Umgebungsbereitstellung wird hier nur angezeigt, wenn ein aktiver Lauf einen
zurückgewonnenen Worker erneut bereitstellt.

## Block-Streaming (Kanalnachrichten)

Beim Block-Streaming wird die Ausgabe des Assistenten in groben Abschnitten gesendet, sobald sie verfügbar ist.

```text
Modellausgabe
  └─ text_delta/Ereignisse
       ├─ (blockStreamingBreak=text_end)
       │    └─ Chunker gibt Blöcke aus, während der Puffer wächst
       └─ (blockStreamingBreak=message_end)
            └─ Chunker leert den Puffer bei message_end
                   └─ Senden an den Kanal (Blockantworten)
```

- `text_delta/events`: Modellstream-Ereignisse (können bei nicht streamenden Modellen spärlich sein).
- `chunker`: `EmbeddedBlockChunker` wendet Mindest-/Höchstgrenzen und die bevorzugte Trennstelle an.
- `channel send`: tatsächlich ausgehende Nachrichten (Blockantworten).

**Steuerungen** (alle unter `agents.defaults`, sofern nicht anders angegeben):

| Schlüssel                                                    | Werte / Form                                                            | Standard   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen) | -          |
| `*.streaming.block.enabled` (Kanalüberschreibung)               | `true` / `false`, erzwingt Block-Streaming pro Kanal (und pro Konto)  | -          |
| `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`) | Zahl, feste Obergrenze                                                   | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | Zahl, weiche Zeilenobergrenze, die hohe Antworten aufteilt, um Abschneiden in der Benutzeroberfläche zu vermeiden | 17         |

`streaming.chunkMode: "newline"` trennt an Leerzeilen (Absatzgrenzen),
nicht an jedem Zeilenumbruch, bevor auf eine längenbasierte Aufteilung zurückgegriffen wird, sobald der Text
die Grenze überschreitet.

Gebündelte Kanäle schreiben diese Überschreibungen als
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`. Die flachen
Schreibweisen `*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` sind
bei jedem gebündelten Kanal veraltet: `openclaw doctor --fix` migriert sie in
die verschachtelte Form, und Kanalschemas lehnen sie ab. Konfigurationen externer SDK-Plugins,
die weiterhin die flachen Schreibweisen verwenden, funktionieren über einen veralteten
Fallback (mit einer Laufzeitwarnung) bis zum nächsten Release-Zyklus weiter.

**Grenzsemantik** für `blockStreamingBreak`:

- `text_end`: Streamt Blöcke, sobald der Chunker sie ausgibt; leert den Puffer bei jedem `text_end`.
- `message_end`: Wartet, bis die Nachricht des Assistenten abgeschlossen ist, und leert dann die gepufferte
  Ausgabe. Verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass
  am Ende mehrere Abschnitte ausgegeben werden können.

### Medienzustellung mit Block-Streaming

Streaming-Medien müssen strukturierte Nutzlastfelder wie `mediaUrl` oder
`mediaUrls` verwenden; gestreamter Text wird nicht als Anhangsbefehl interpretiert. Wenn beim Block-
Streaming Medien frühzeitig gesendet werden, merkt sich OpenClaw diese Zustellung für den Durchlauf. Wenn
die endgültige Nutzlast des Assistenten dieselbe Medien-URL wiederholt, entfernt die endgültige Zustellung
das doppelte Medium, anstatt den Anhang erneut zu senden.

Exakt doppelte endgültige Nutzlasten werden unterdrückt. Wenn die endgültige Nutzlast
zusätzlichen Text um bereits gestreamte Medien herum enthält, sendet OpenClaw den
neuen Text weiterhin, während das Medium nur einmal zugestellt wird. Dadurch werden doppelte Sprachnachrichten
oder Dateien auf Kanälen wie Telegram verhindert.

## Aufteilungsalgorithmus (untere/obere Grenzen)

Die Blockaufteilung wird durch `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** Keine Ausgabe, bevor der Puffer >= `minChars` ist (außer bei erzwungener Ausgabe).
- **Obere Grenze:** Trennstellen vor `maxChars` werden bevorzugt; bei erzwungener Trennung erfolgt sie bei `maxChars`.
- **Prioritätskette für Trennstellen:** `paragraph` -> `newline` -> `sentence` ->
  Leerraum -> harte Trennung.
- **Codeblöcke:** Niemals innerhalb von Codeblöcken trennen; bei erzwungener Trennung bei `maxChars` wird
  der Codeblock geschlossen und erneut geöffnet, damit das Markdown gültig bleibt.

`maxChars` wird auf `textChunkLimit` des Kanals begrenzt, sodass
kanalspezifische Obergrenzen nicht überschritten werden können.

## Zusammenführung (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-
Abschnitte zusammenführen**, bevor sie gesendet werden. Dadurch werden einzelne Nachrichtenzeilen reduziert, während
die Ausgabe weiterhin schrittweise erfolgt.

- Die Zusammenführung wartet vor dem Leeren des Puffers auf **Leerlaufintervalle** (`idleMs`).
- Puffer werden durch `maxChars` begrenzt und geleert, wenn sie diesen Wert überschreiten.
- `minChars` verhindert das Senden winziger Fragmente, bis sich genügend Text angesammelt hat
  (beim abschließenden Leeren wird verbleibender Text immer gesendet).
- Das Verbindungselement wird aus `blockStreamingChunk.breakPreference` abgeleitet: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> Leerzeichen.
- Kanalüberschreibungen sind über `*.streaming.block.coalesce` verfügbar (einschließlich
  kontospezifischer Konfigurationen).
- Discord, Signal und Slack verwenden standardmäßig die Zusammenführung mit `{ minChars: 1500, idleMs: 1000 }`,
  sofern dies nicht überschrieben wird.

## Menschenähnliche Pausen zwischen Blöcken

Wenn Block-Streaming aktiviert ist, wird nach dem ersten Block eine **zufällige Pause**
zwischen Blockantworten eingefügt, damit Antworten mit mehreren Nachrichten natürlicher wirken.

| `agents.defaults.humanDelay.mode` | Verhalten               |
| --------------------------------- | ----------------------- |
| `off` (Standard)                   | Keine Pause             |
| `natural`                         | zufällige Pause von 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

Überschreiben Sie dies pro Agent über `agents.entries.*.humanDelay`. Gilt nur für **Block-
antworten**, nicht für endgültige Antworten oder Werkzeugzusammenfassungen.

## „Abschnitte oder alles streamen“

- **Abschnitte streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (während der Generierung ausgeben). Kanäle außer Telegram benötigen außerdem
  `*.streaming.block.enabled: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (Puffer
  einmal leeren, bei sehr langen Ausgaben möglicherweise in mehreren Abschnitten).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur endgültige Antwort).

Block-Streaming ist **deaktiviert, sofern** `*.streaming.block.enabled` nicht ausdrücklich
auf `true` gesetzt ist (Ausnahme: QQ Bot verfügt über keine `streaming.block`-Schlüssel und streamt
Blockantworten, sofern `channels.qqbot.streaming.mode` nicht `"off"` ist). Kanäle können
eine Live-Vorschau (`channels.<channel>.streaming.mode`) ohne Block-
antworten streamen. Die Standardwerte für `blockStreaming*` befinden sich unter `agents.defaults`, nicht auf der
obersten Konfigurationsebene.

## Vorschau-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming` (verschachteltes `{ mode, ... }`; veraltete
boolesche/Zeichenfolgen-Schreibweisen auf oberster Ebene werden von `openclaw doctor --fix` umgeschrieben).

| Modus      | Verhalten                                                             |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Vorschau-Streaming deaktivieren                                       |
| `partial`  | Einzelne Vorschau wird durch den neuesten Text ersetzt                 |
| `block`    | Vorschau wird in aufgeteilten/angehängten Schritten aktualisiert       |
| `progress` | Fortschritts-/Statusvorschau während der Generierung, endgültige Antwort nach Abschluss |

`streaming.mode: "block"` ist ein Vorschau-Streaming-Modus für Kanäle mit Bearbeitungsfunktion
wie Discord und Telegram; er aktiviert dort nicht eigenständig die kanalbasierte
Blockzustellung. Verwenden Sie `streaming.block.enabled` für normale Blockantworten.
Microsoft Teams bildet die
Ausnahme: Es verfügt über keinen Blocktransport für Entwurfsvorschauen. Daher deaktiviert `streaming.mode:
"block"` das native Streaming vollständig, und die Antwort wird stattdessen als reguläre
Blockzustellung gesendet, nicht als natives Teil-/Fortschritts-Streaming. Mattermost
unterscheidet sich ebenfalls: Im Modus `block` wechselt die Vorschau zwischen abgeschlossenem Text und
Werkzeugaktivitätsblöcken, sodass frühere Blöcke als separate Beiträge sichtbar bleiben,
anstatt in einem einzelnen bearbeitbaren Entwurf überschrieben zu werden.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Ja    | Ja        | Ja      | bearbeitbarer Fortschrittsentwurf |
| Discord    | Ja    | Ja        | Ja      | bearbeitbarer Fortschrittsentwurf |
| Slack      | Ja    | Ja        | Ja      | Ja                      |
| Mattermost | Ja    | Ja        | Ja      | Ja                      |
| MS Teams   | Ja    | Ja        | Ja      | nativer Fortschrittsstream |

Die Konfiguration für Vorschauabschnitte (`streaming.preview.chunk.*`, z. B. unter
`channels.discord.streaming` oder `channels.telegram.streaming`) verwendet standardmäßig
`minChars: 200`, `maxChars: 800` (begrenzt auf `textChunkLimit` des Kanals) und
`breakPreference: "paragraph"`.

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet Aufrufe der nativen Streaming-API von Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) um, wenn
  `channels.slack.streaming.mode="partial"` (Standard: `true`).
- Das native Streaming von Slack und der Threadstatus des Slack-Assistenten erfordern ein Antwortziel
  in einem Thread. DMs auf oberster Ebene zeigen diese threadartige Vorschau nicht an, können
  jedoch weiterhin Slack-Entwurfsvorschauen und deren Bearbeitung verwenden.

### Migration veralteter Schlüssel

| Kanal   | Veraltete Schlüssel                                        | Status                                                                                                                                               |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, skalarer/Boolescher `streaming`                    | Wird durch `openclaw doctor --fix` in `streaming.mode` umgeschrieben; wird zur Laufzeit nicht gelesen                                                                        |
| Discord  | `streamMode`, Boolescher `streaming`                           | Wird durch `openclaw doctor --fix` in `streaming.mode` umgeschrieben; wird zur Laufzeit nicht gelesen                                                                        |
| Slack    | `streamMode`; Boolescher `streaming`; veralteter `nativeStreaming` | Wird durch `openclaw doctor --fix` in `streaming.mode` (und für die Booleschen/veralteten Formen in `streaming.nativeTransport`) umgeschrieben; wird zur Laufzeit nicht gelesen         |
| Matrix   | skalarer/Boolescher `streaming`                                  | Wird durch `openclaw doctor --fix` in `streaming.mode` (einschließlich des Matrix-Modus `"quiet"`) umgeschrieben; wird zur Laufzeit nicht gelesen                                    |
| Feishu   | Boolescher `streaming`                                         | Wird durch `openclaw doctor --fix` in `streaming.mode` umgeschrieben; wird zur Laufzeit nicht gelesen                                                                        |
| QQ Bot   | Boolescher `streaming`; `streaming.c2cStreamApi`               | Wird durch `openclaw doctor --fix` in `streaming.mode` (und für die Booleschen/`c2cStreamApi`-Formen in `streaming.nativeTransport`) umgeschrieben; wird zur Laufzeit nicht gelesen |

## Laufzeitverhalten

### Telegram

- Verwendet `sendMessage`- und `editMessageText`-Vorschauaktualisierungen in Direktnachrichten und
  Gruppen/Themen; der endgültige Text bearbeitet die aktive Vorschau direkt. Die
  kurzlebigen 30-Sekunden-„Tippen“-Entwürfe von Telegram (`sendMessageDraft`) werden nicht für das
  Streaming von Antworten verwendet.
- Kurze anfängliche Vorschauen werden für die Benutzerfreundlichkeit von Push-Benachrichtigungen weiterhin entprellt, erscheinen
  jedoch nach einer begrenzten Verzögerung, damit aktive Ausführungen nicht optisch still bleiben.
- Lange endgültige Antworten verwenden die Vorschaunachricht für den ersten Abschnitt erneut und senden nur die
  verbleibenden Abschnitte.
- Der Modus `block` überführt die Vorschau bei
  `streaming.preview.chunk.maxChars` in eine neue Nachricht (Standardwert 800, begrenzt durch das Bearbeitungslimit
  von Telegram von 4096); andere Modi erweitern eine Vorschau auf bis zu 4096 Zeichen.
- Der Modus `progress` hält den Werkzeugfortschritt in einem bearbeitbaren Statusentwurf fest, zeigt
  die Statusbeschriftung an, wenn das Antwort-Streaming aktiv, aber noch keine Werkzeugzeile
  verfügbar ist, löscht den Entwurf nach Abschluss und sendet die endgültige Antwort
  über die normale Zustellung.
- Wenn die abschließende Bearbeitung fehlschlägt, bevor der vollständige Text bestätigt wurde, verwendet OpenClaw
  die normale endgültige Zustellung und bereinigt die veraltete Vorschau.
- Das Vorschau-Streaming wird übersprungen, wenn das Telegram-Block-Streaming ausdrücklich
  aktiviert ist, um doppeltes Streaming zu vermeiden.
- `/reasoning stream` kann Schlussfolgerungen in eine vorübergehende Vorschau schreiben, die
  nach der endgültigen Zustellung gelöscht wird.
- Ausgewählte Zitatantworten in Telegram bilden eine Ausnahme: Wenn `replyToMode` nicht
  `"off"` ist und ausgewählter Zitattext vorhanden ist, überspringt OpenClaw für diesen Durchlauf
  den Antwort-Vorschaustream (die endgültige Antwort muss über den nativen Pfad für Zitatantworten
  erfolgen), sodass Vorschauzeilen zum Werkzeugfortschritt nicht dargestellt werden können. Antworten
  auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten das Vorschau-Streaming bei. Weitere
  Informationen finden Sie in der [Dokumentation zum Telegram-Kanal](/de/channels/telegram).

### Discord

- Verwendet das Senden und Bearbeiten von Vorschaunachrichten.
- Der Modus `block` verwendet die Entwurfssegmentierung (`draftChunk`).
- Das Vorschau-Streaming wird übersprungen, wenn das Discord-Block-Streaming ausdrücklich
  aktiviert ist.
- Der Modus `progress` hängt einen kleinen `-#`-Aktivitätsbeleg (Anzahl der Denk-/Werkzeugaufrufe
  und verstrichene Zeit) an die endgültige Antwort an und löscht den Statusentwurf,
  sobald diese Antwort zugestellt wurde, sodass in stark frequentierten Kanälen kein verwaistes Werkzeugprotokoll
  über der Antwort verbleibt. Bei abschließenden Fehlermeldungen bleibt der Entwurf als Protokoll des fehlgeschlagenen
  Durchlaufs erhalten.
- Endgültige Medien-, Fehler- und explizite Antwort-Nutzlasten brechen ausstehende Vorschauen ab,
  ohne einen neuen Entwurf zu übertragen, und verwenden anschließend die normale Zustellung.

### Slack

- `partial` kann das native Streaming von Slack (`chat.startStream`/`append`/`stop`)
  verwenden, sofern verfügbar.
- `block` verwendet Entwurfsvorschauen im Anfügungsstil.
- `progress` verwendet einen Statusvorschautext und anschließend die endgültige Antwort.
- Direktnachrichten auf oberster Ebene ohne Antwort-Thread verwenden Vorschauentwurfsbeiträge und Bearbeitungen
  anstelle des nativen Slack-Streamings.
- Natives Streaming und Entwurfsvorschau-Streaming unterdrücken Blockantworten für diesen Durchlauf, sodass eine
  Slack-Antwort nur über einen Zustellungspfad gestreamt wird.
- Endgültige Medien-/Fehler-Nutzlasten und abschließende Fortschrittsmeldungen erstellen keine kurzlebigen Entwurfsnachrichten;
  nur endgültige Text-/Blocknachrichten, die die Vorschau bearbeiten können, übertragen ausstehenden
  Entwurfstext.

### Mattermost

- Im Modus `partial` werden Gedanken und Teile des Antworttexts in einen einzelnen Entwurfsvorschaubeitrag
  gestreamt, der direkt abgeschlossen wird, sobald die endgültige Antwort sicher gesendet werden kann.
- Im Modus `progress` werden Gedanken und Werkzeugaktivitäten in eine einzelne Statusvorschau
  gestreamt, die direkt abgeschlossen wird, sobald die endgültige Antwort sicher gesendet werden kann.
- Im Modus `block` wird zwischen Beiträgen mit vollständigem Text und Werkzeugaktivitäten gewechselt;
  parallele und aufeinanderfolgende Werkzeugaktualisierungen teilen sich den aktuellen Werkzeugaktivitätsbeitrag.
- Fällt auf das Senden eines neuen endgültigen Beitrags zurück, wenn der Vorschaubeitrag gelöscht wurde oder
  zum Zeitpunkt des Abschlusses anderweitig nicht verfügbar ist.
- Endgültige Medien-/Fehler-Nutzlasten brechen ausstehende Vorschauaktualisierungen vor der normalen
  Zustellung ab, anstatt einen vorübergehenden Vorschaubeitrag zu übertragen.

### Matrix

- Entwurfsvorschauen werden direkt abgeschlossen, wenn der endgültige Text das Vorschauereignis
  wiederverwenden kann.
- Nur-Medien-, Fehler- und bei abweichendem Antwortziel endgültige Nachrichten brechen ausstehende Vorschauaktualisierungen
  vor der normalen Zustellung ab; eine bereits sichtbare veraltete Vorschau wird geschwärzt.

## Vorschauaktualisierungen zum Werkzeugfortschritt

Das Vorschau-Streaming kann auch Aktualisierungen zum **Werkzeugfortschritt** enthalten: kurze Statuszeilen
wie „Web wird durchsucht“, „Datei wird gelesen“ oder „Werkzeug wird aufgerufen“, die während der Ausführung
von Werkzeugen vor der endgültigen Antwort in derselben Vorschaunachricht erscheinen.
Im Codex-App-Server-Modus verwenden Codex-Präambel-/Kommentarnachrichten denselben
Vorschaupfad, sodass kurze Fortschrittshinweise wie „Ich prüfe ...“ in den
bearbeitbaren Entwurf gestreamt werden können, ohne Teil der endgültigen Antwort zu werden. Dadurch bleiben
mehrstufige Werkzeugdurchläufe optisch aktiv, anstatt zwischen der ersten
Gedankenvorschau und der endgültigen Antwort still zu bleiben.

Lang laufende Werkzeuge können vor ihrer Rückgabe typisierte Fortschrittsmeldungen ausgeben. Beispielsweise
startet `web_fetch` beim Beginn einen Fünf-Sekunden-Timer: Wenn der Abruf noch
aussteht, zeigt die Vorschau `Fetching page content...` an; wenn der Abruf vorher abgeschlossen oder
abgebrochen wird, wird keine Fortschrittszeile ausgegeben. Das spätere endgültige Werkzeugergebnis
wird weiterhin normal an das Modell übermittelt.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen Werkzeugfortschritts- und
  Codex-Präambelaktualisierungen standardmäßig in die laufende Vorschaubearbeitung, wenn das Vorschau-Streaming
  aktiv ist. Microsoft Teams verwendet in persönlichen Chats seinen nativen Fortschrittsstream.
- Telegram wird seit `v2026.4.22` mit aktivierten Vorschauaktualisierungen zum Werkzeugfortschritt
  ausgeliefert; ihre Aktivierung beizubehalten, wahrt dieses veröffentlichte Verhalten.
- **Mattermost** fasst Werkzeugaktivitäten in den Modi `partial` und
  `progress` in einem Vorschaubeitrag oder im Modus `block`
  in einem Werkzeugaktivitätsbeitrag zwischen Textblöcken zusammen (siehe oben).
- Bearbeitungen zum Werkzeugfortschritt folgen dem aktiven Vorschau-Streaming-Modus; sie werden
  übersprungen, wenn das Vorschau-Streaming `off` ist oder wenn das Block-Streaming die
  Nachricht übernommen hat. In Telegram gilt `streaming.mode: "off"` nur für endgültige Nachrichten: Allgemeine
  Fortschrittsmeldungen werden ebenfalls unterdrückt, anstatt als eigenständige Statusnachrichten
  zugestellt zu werden, während Genehmigungsaufforderungen, Medien-Nutzlasten und Fehler weiterhin
  normal weitergeleitet werden.
- Um das Vorschau-Streaming beizubehalten, aber Zeilen zum Werkzeugfortschritt auszublenden, setzen Sie
  `streaming.preview.toolProgress` für diesen Kanal auf `false` (Standardwert
  `true`). Um Zeilen zum Werkzeugfortschritt sichtbar zu halten und gleichzeitig Befehls-/Ausführungstext auszublenden,
  setzen Sie `streaming.preview.commandText` auf `"status"` oder
  `streaming.progress.commandText` auf `"status"`; der Standardwert ist `"raw"`, um
  das veröffentlichte Verhalten beizubehalten. Diese Richtlinie gilt gemeinsam für Entwurfs-/Fortschrittskanäle,
  die den kompakten Fortschrittsrenderer von OpenClaw verwenden, darunter Discord, Matrix,
  Microsoft Teams, Mattermost, Slack-Entwurfsvorschauen und Telegram. Um
  Vorschaubearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.

## Darstellung von Fortschrittsentwürfen

Entwürfe im Fortschrittsmodus (`streaming.progress.*`) sind begrenzt und je Kanal
konfigurierbar:

| Schlüssel                         | Standardwert  | Verhalten                                                      |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Maximale Anzahl kompakter Fortschrittszeilen unter der Entwurfsbeschriftung          |
| `streaming.progress.maxLineChars` | `120`         | Maximale Zeichenanzahl pro kompakter Zeile vor der Kürzung (wortbewusst) |
| `streaming.progress.label`        | `"auto"`      | Entwurfstitel; eine benutzerdefinierte Zeichenfolge oder `false`, um ihn auszublenden            |
| `streaming.progress.labels`       | integrierter Pool | Mögliche Beschriftungen, die verwendet werden, wenn `label: "auto"`                     |

### Fortschrittsbereich für Kommentare

Neben dem Werkzeugfortschritt kann der kompakte Fortschrittsrenderer im Entwurf
einen weiteren Bereich anzeigen:

- **`streaming.progress.commentary`** – stellt die **Kommentare** des Modells vor der Werkzeugverwendung
  (eine kurze Beschreibung wie „Ich prüfe ... und anschließend ...“) mit
  Werkzeugzeilen verschachtelt im Fortschrittsentwurf dar. Bei Discord und Telegram im Fortschrittsmodus
  liefert dieselbe Präambel die Statusüberschrift, selbst wenn dieser optionale Bereich
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

Fortschrittszeilen sichtbar halten, aber unverarbeiteten Befehls-/Ausführungstext ausblenden:

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

Verwenden Sie dieselbe Struktur unter einem anderen Schlüssel eines kompakten Fortschrittskanals, beispielsweise
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

- [Refaktorierung des Nachrichtenlebenszyklus](/de/concepts/message-lifecycle-refactor) – gemeinsames Zieldesign für Vorschau, Bearbeitung, Streaming und Abschluss
- [Fortschrittsentwürfe](/de/concepts/progress-drafts) – sichtbare Meldungen zu laufenden Arbeiten, die während langer Durchläufe aktualisiert werden
- [Nachrichten](/de/concepts/messages) – Nachrichtenlebenszyklus und Zustellung
- [Wiederholungsversuch](/de/concepts/retry) – Wiederholungsverhalten bei Zustellungsfehlern
- [Kanäle](/de/channels) – Streaming-Unterstützung je Kanal
