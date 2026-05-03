---
read_when:
    - Erklärung, wie Streaming oder Chunking in Kanälen funktioniert
    - Ändern des Block-Streamings oder des Verhaltens beim Aufteilen von Kanalinhalten in Chunks
    - Debugging doppelter/früher Blockantworten oder des Kanalvorschau-Streamings
summary: Streaming + Chunking-Verhalten (Blockantworten, Streaming der Kanalvorschau, Moduszuordnung)
title: Streaming und Aufteilung in Datenblöcke
x-i18n:
    generated_at: "2026-05-03T21:31:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw hat zwei separate Streaming-Ebenen:

- **Block-Streaming (Kanäle):** gibt abgeschlossene **Blöcke** aus, während der Assistent schreibt. Dies sind normale Kanalnachrichten (keine Token-Deltas).
- **Vorschau-Streaming (Telegram/Discord/Slack):** aktualisiert während der Generierung eine temporäre **Vorschaunachricht**.

Heute gibt es **kein echtes Token-Delta-Streaming** zu Kanalnachrichten. Vorschau-Streaming ist nachrichtenbasiert (Senden + Bearbeitungen/Anhänge).

## Block-Streaming (Kanalnachrichten)

Block-Streaming sendet Assistentenausgabe in groben Abschnitten, sobald sie verfügbar wird.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legende:

- `text_delta/events`: Modell-Stream-Ereignisse (können bei nicht streamenden Modellen spärlich sein).
- `chunker`: `EmbeddedBlockChunker`, der Mindest-/Höchstgrenzen + bevorzugte Umbruchart anwendet.
- `channel send`: tatsächliche ausgehende Nachrichten (Blockantworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standardmäßig aus).
- Kanal-Overrides: `*.blockStreaming` (und kontospezifische Varianten), um pro Kanal `"on"`/`"off"` zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen).
- Harte Kanalgrenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Kanal-Chunk-Modus: `*.chunkMode` (`length` als Standard, `newline` teilt vor dem Längen-Chunking an Leerzeilen (Absatzgrenzen)).
- Discord-Softlimit: `channels.discord.maxLinesPerMessage` (Standard 17) teilt hohe Antworten, um Abschneiden in der UI zu vermeiden.

**Grenzsemantik:**

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` leeren.
- `message_end`: warten, bis die Assistentennachricht abgeschlossen ist, dann gepufferte Ausgabe leeren.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

### Medienzustellung mit Block-Streaming

`MEDIA:`-Direktiven sind normale Zustellungsmetadaten. Wenn Block-Streaming einen
Medienblock früh sendet, merkt sich OpenClaw diese Zustellung für den Turn. Wenn die finale
Assistentennutzlast dieselbe Medien-URL wiederholt, entfernt die finale Zustellung die
doppelten Medien, statt den Anhang erneut zu senden.

Exakte doppelte finale Nutzlasten werden unterdrückt. Wenn die finale Nutzlast
eigenständigen Text um Medien ergänzt, die bereits gestreamt wurden, sendet OpenClaw weiterhin den
neuen Text, während die Medien nur einmal zugestellt werden. Dies verhindert doppelte Sprachnachrichten
oder Dateien auf Kanälen wie Telegram, wenn ein Agent während
des Streamings `MEDIA:` ausgibt und der Provider es auch in der abgeschlossenen Antwort enthält.

## Chunking-Algorithmus (untere/obere Grenzen)

Block-Chunking wird durch `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** nicht ausgeben, bis der Puffer >= `minChars` ist (außer bei Erzwingung).
- **Obere Grenze:** Splits vor `maxChars` bevorzugen; bei Erzwingung bei `maxChars` teilen.
- **Umbruchpräferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harter Umbruch.
- **Code-Fences:** niemals innerhalb von Fences teilen; bei Erzwingung bei `maxChars` den Fence schließen + neu öffnen, damit Markdown gültig bleibt.

`maxChars` wird auf das Kanal-`textChunkLimit` begrenzt, sodass Sie kanalspezifische Grenzen nicht überschreiten können.

## Zusammenführung (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**,
bevor sie gesendet werden. Dies reduziert „Einzeilen-Spam“ und bietet dennoch
fortlaufende Ausgabe.

- Die Zusammenführung wartet vor dem Leeren auf **Leerlaufpausen** (`idleMs`).
- Puffer werden durch `maxChars` begrenzt und geleert, wenn sie diese Grenze überschreiten.
- `minChars` verhindert, dass winzige Fragmente gesendet werden, bis genügend Text angesammelt wurde
  (das finale Leeren sendet immer den verbleibenden Text).
- Der Joiner wird aus `blockStreamingChunk.breakPreference` abgeleitet
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Kanal-Overrides sind über `*.blockStreamingCoalesce` verfügbar (einschließlich kontospezifischer Konfigurationen).
- Der standardmäßige Zusammenführungswert `minChars` wird für Signal/Slack/Discord auf 1500 angehoben, sofern er nicht überschrieben wird.

## Menschlich wirkende Pausen zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie zwischen
Blockantworten (nach dem ersten Block) eine **randomisierte Pause** hinzufügen. Dadurch wirken Antworten mit mehreren Sprechblasen
natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (pro Agent über `agents.list[].humanDelay` überschreiben).
- Modi: `off` (Standard), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Blockantworten**, nicht für finale Antworten oder Tool-Zusammenfassungen.

## „Chunks oder alles streamen“

Dies entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (während der Ausgabe senden). Nicht-Telegram-Kanäle benötigen außerdem `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal leeren, bei sehr langer Ausgabe möglicherweise mehrere Chunks).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur finale Antwort).

**Kanalhinweis:** Block-Streaming ist **aus, außer**
`*.blockStreaming` ist explizit auf `true` gesetzt. Kanäle können eine Live-Vorschau streamen
(`channels.<channel>.streaming`), ohne Blockantworten zu senden.

Hinweis zum Konfigurationsort: Die `blockStreaming*`-Standards befinden sich unter
`agents.defaults`, nicht in der Root-Konfiguration.

## Vorschau-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Vorschau-Streaming deaktivieren.
- `partial`: einzelne Vorschau, die durch den neuesten Text ersetzt wird.
- `block`: Vorschau wird in chunkweisen/angehängten Schritten aktualisiert.
- `progress`: Fortschritts-/Statusvorschau während der Generierung, finale Antwort bei Abschluss.

`streaming.mode: "block"` ist ein Vorschau-Streaming-Modus für bearbeitungsfähige Kanäle
wie Discord und Telegram. Er aktiviert dort keine Kanal-Blockzustellung.
Verwenden Sie `streaming.block.enabled` oder den Legacy-Kanalschlüssel `blockStreaming`, wenn
Sie normale Blockantworten wünschen. Microsoft Teams ist die Ausnahme: Es hat keinen
Blocktransport für Entwurfsvorschauen, daher wird `streaming.mode: "block"` auf Teams-Blockzustellung
statt auf natives Partial-/Fortschrittsstreaming abgebildet.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`                 |
| ---------- | ----- | --------- | ------- | -------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Discord    | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Slack      | ✅    | ✅        | ✅      | ✅                         |
| Mattermost | ✅    | ✅        | ✅      | ✅                         |
| MS Teams   | ✅    | ✅        | ✅      | nativer Fortschrittsstream |

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet native Slack-Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` (Standard: `true`).
- Slack-natives Streaming und der Status des Slack-Assistenten-Threads benötigen ein Antwort-Thread-Ziel. DMs auf oberster Ebene zeigen diese Thread-artige Vorschau nicht an, können aber weiterhin Slack-Entwurfsvorschau-Beiträge und Bearbeitungen verwenden.

Migration von Legacy-Schlüsseln:

- Telegram: Legacy-Werte `streamMode` und skalare/boolesche `streaming`-Werte werden erkannt und durch Doctor-/Konfigurationskompatibilitätspfade zu `streaming.mode` migriert.
- Discord: `streamMode` + boolesches `streaming` werden automatisch zum `streaming`-Enum migriert.
- Slack: `streamMode` wird automatisch zu `streaming.mode` migriert; boolesches `streaming` wird automatisch zu `streaming.mode` plus `streaming.nativeTransport` migriert; Legacy-`nativeStreaming` wird automatisch zu `streaming.nativeTransport` migriert.

### Laufzeitverhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText` für Vorschauaktualisierungen über DMs und Gruppen/Themen hinweg.
- Sendet statt einer Bearbeitung an Ort und Stelle eine neue finale Nachricht, wenn eine Vorschau etwa eine Minute sichtbar war, und räumt dann die Vorschau auf, sodass der Telegram-Zeitstempel den Abschluss der Antwort widerspiegelt.
- Vorschau-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Reasoning in die Vorschau schreiben.

Discord:

- Verwendet Senden + Bearbeiten von Vorschaunachrichten.
- Der Modus `block` verwendet Entwurfs-Chunking (`draftChunk`).
- Vorschau-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Finale Medien-, Fehler- und explizite Antwortnutzlasten brechen ausstehende Vorschauen ab, ohne einen neuen Entwurf zu leeren, und verwenden dann die normale Zustellung.

Slack:

- `partial` kann natives Slack-Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Entwurfsvorschauen im Anhänge-Stil.
- `progress` verwendet Statusvorschautext, danach die finale Antwort.
- DMs auf oberster Ebene ohne Antwort-Thread verwenden Entwurfsvorschau-Beiträge und Bearbeitungen statt Slack-nativem Streaming.
- Native und Entwurfsvorschau-Streams unterdrücken Blockantworten für diesen Turn, sodass eine Slack-Antwort nur über einen Zustellungspfad gestreamt wird.
- Finale Medien-/Fehlernutzlasten und Fortschrittsfinale erstellen keine Wegwerf-Entwurfsnachrichten; nur Text-/Blockfinale, die die Vorschau bearbeiten können, leeren ausstehenden Entwurfstext.

Mattermost:

- Streamt Denken, Tool-Aktivität und partiellen Antworttext in einen einzelnen Entwurfsvorschau-Beitrag, der an Ort und Stelle finalisiert wird, wenn die finale Antwort sicher gesendet werden kann.
- Fällt auf das Senden eines neuen finalen Beitrags zurück, wenn der Vorschaubeitrag zum Finalisierungszeitpunkt gelöscht wurde oder anderweitig nicht verfügbar ist.
- Finale Medien-/Fehlernutzlasten brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab, statt einen temporären Vorschaubeitrag zu leeren.

Matrix:

- Entwurfsvorschauen werden an Ort und Stelle finalisiert, wenn der finale Text das Vorschauereignis wiederverwenden kann.
- Medien-only-, Fehler- und Antwortziel-Nichtübereinstimmungs-Finale brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab; eine bereits sichtbare veraltete Vorschau wird redigiert.

### Tool-Fortschrittsvorschau-Aktualisierungen

Vorschau-Streaming kann auch **Tool-Fortschritts**-Aktualisierungen enthalten — kurze Statuszeilen wie „das Web durchsuchen“, „Datei lesen“ oder „Tool aufrufen“ —, die in derselben Vorschaunachricht erscheinen, während Tools laufen, noch vor der finalen Antwort. Dadurch bleiben mehrstufige Tool-Turns visuell aktiv, statt zwischen der ersten Denkvorschau und der finalen Antwort stumm zu bleiben.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen Tool-Fortschritt standardmäßig in die Live-Vorschaubearbeitung, wenn Vorschau-Streaming aktiv ist. Microsoft Teams verwendet in persönlichen Chats seinen nativen Fortschrittsstream.
- Telegram wird seit `v2026.4.22` mit aktivierten Tool-Fortschrittsvorschau-Aktualisierungen ausgeliefert; deren Aktivierung beizubehalten, erhält dieses veröffentlichte Verhalten.
- **Mattermost** integriert Tool-Aktivität bereits in seinen einzelnen Entwurfsvorschau-Beitrag (siehe oben).
- Tool-Fortschrittsbearbeitungen folgen dem aktiven Vorschau-Streaming-Modus; sie werden übersprungen, wenn Vorschau-Streaming `off` ist oder wenn Block-Streaming die Nachricht übernommen hat. Bei Telegram ist `streaming.mode: "off"` final-only: allgemeines Fortschrittsrauschen wird ebenfalls unterdrückt, statt als eigenständige Statusnachrichten zugestellt zu werden, während Genehmigungsaufforderungen, Mediennutzlasten und Fehler weiterhin normal geroutet werden.
- Um Vorschau-Streaming beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie `streaming.preview.toolProgress` für diesen Kanal auf `false`. Um Vorschaubearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.
- Ausgewählte Telegram-Zitatantworten sind eine Ausnahme: Wenn `replyToMode` nicht `"off"` ist und ausgewählter Zitattext vorhanden ist, überspringt OpenClaw den Antwortvorschau-Stream für diesen Turn, sodass Tool-Fortschrittsvorschau-Zeilen nicht gerendert werden können. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten Vorschau-Streaming weiterhin bei. Details finden Sie in der [Telegram-Kanaldokumentation](/de/channels/telegram).

Beispiel:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Verwandte Themen

- [Fortschrittsentwürfe](/de/concepts/progress-drafts) — sichtbare Nachrichten zu laufenden Arbeiten, die während langer Turns aktualisiert werden
- [Nachrichten](/de/concepts/messages) — Nachrichtenlebenszyklus und Zustellung
- [Wiederholen](/de/concepts/retry) — Wiederholungsverhalten bei Zustellungsfehlern
- [Kanäle](/de/channels) — kanalspezifische Streaming-Unterstützung
