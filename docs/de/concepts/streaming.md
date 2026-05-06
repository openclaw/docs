---
read_when:
    - Erklären, wie Streaming oder Chunking in Kanälen funktioniert
    - Ändern des Block-Streamings oder des Kanal-Chunking-Verhaltens
    - Fehlersuche bei doppelten/verfrühten Block-Antworten oder beim Kanal-Vorschau-Streaming
summary: Streaming- und Chunking-Verhalten (Blockantworten, Streaming der Kanalvorschau, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-05-06T06:45:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw hat zwei separate Streaming-Ebenen:

- **Block-Streaming (Kanäle):** sendet abgeschlossene **Blöcke**, während der Assistent schreibt. Dies sind normale Kanalnachrichten (keine Token-Deltas).
- **Vorschau-Streaming (Telegram/Discord/Slack):** aktualisiert während der Generierung eine temporäre **Vorschaunachricht**.

Heute gibt es **kein echtes Token-Delta-Streaming** in Kanalnachrichten. Vorschau-Streaming ist nachrichtenbasiert (Senden + Bearbeitungen/Anhängen).

## Block-Streaming (Kanalnachrichten)

Block-Streaming sendet die Ausgabe des Assistenten in groben Abschnitten, sobald sie verfügbar wird.

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
- `chunker`: `EmbeddedBlockChunker`, der Mindest-/Höchstgrenzen + bevorzugten Umbruch anwendet.
- `channel send`: tatsächlich ausgehende Nachrichten (Blockantworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standardmäßig aus).
- Kanal-Overrides: `*.blockStreaming` (und Varianten pro Konto), um pro Kanal `"on"`/`"off"` zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen).
- Feste Kanalobergrenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Kanal-Chunk-Modus: `*.chunkMode` (standardmäßig `length`, `newline` teilt vor dem Längen-Chunking an Leerzeilen (Absatzgrenzen)).
- Discord-Softlimit: `channels.discord.maxLinesPerMessage` (standardmäßig 17) teilt hohe Antworten, um UI-Clipping zu vermeiden.

**Grenzsemantik:**

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` leeren.
- `message_end`: warten, bis die Assistentennachricht fertig ist, dann die gepufferte Ausgabe leeren.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

### Medienzustellung mit Block-Streaming

`MEDIA:`-Direktiven sind normale Zustellungsmetadaten. Wenn Block-Streaming einen Medienblock früh sendet, merkt sich OpenClaw diese Zustellung für den Turn. Wenn die finale Assistentennutzlast dieselbe Medien-URL wiederholt, entfernt die finale Zustellung das doppelte Medium, statt den Anhang erneut zu senden.

Exakt doppelte finale Nutzlasten werden unterdrückt. Wenn die finale Nutzlast eigenen Text um Medien ergänzt, die bereits gestreamt wurden, sendet OpenClaw weiterhin den neuen Text, während das Medium nur einmal zugestellt wird. Das verhindert doppelte Sprachnachrichten oder Dateien auf Kanälen wie Telegram, wenn ein Agent während des Streamings `MEDIA:` ausgibt und der Provider es auch in der abgeschlossenen Antwort enthält.

## Chunking-Algorithmus (untere/obere Grenzen)

Block-Chunking wird durch `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** nicht ausgeben, bis der Puffer >= `minChars` ist (außer erzwungen).
- **Obere Grenze:** Trennungen vor `maxChars` bevorzugen; falls erzwungen, bei `maxChars` trennen.
- **Umbruchpräferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harter Umbruch.
- **Code-Fences:** niemals innerhalb von Fences trennen; wenn bei `maxChars` erzwungen wird, den Fence schließen + wieder öffnen, damit Markdown gültig bleibt.

`maxChars` wird auf das `textChunkLimit` des Kanals begrenzt, sodass Sie kanalspezifische Obergrenzen nicht überschreiten können.

## Zusammenführen (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**, bevor sie gesendet werden. Das reduziert „Single-Line-Spam“ und bietet trotzdem progressive Ausgabe.

- Das Zusammenführen wartet vor dem Leeren auf **Leerlaufpausen** (`idleMs`).
- Puffer werden durch `maxChars` begrenzt und geleert, wenn sie es überschreiten.
- `minChars` verhindert, dass winzige Fragmente gesendet werden, bis genug Text gesammelt wurde
  (das finale Leeren sendet immer den verbleibenden Text).
- Der Joiner wird aus `blockStreamingChunk.breakPreference` abgeleitet
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Kanal-Overrides sind über `*.blockStreamingCoalesce` verfügbar (einschließlich Konfigurationen pro Konto).
- Der Standardwert für `minChars` beim Zusammenführen wird für Signal/Slack/Discord auf 1500 erhöht, sofern er nicht überschrieben wird.

## Menschlich wirkende Pausen zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie zwischen Blockantworten (nach dem ersten Block) eine **zufällige Pause** hinzufügen. Dadurch wirken Antworten mit mehreren Sprechblasen natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (pro Agent über `agents.list[].humanDelay` überschreiben).
- Modi: `off` (Standard), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Blockantworten**, nicht für finale Antworten oder Tool-Zusammenfassungen.

## „Chunks oder alles streamen“

Dies entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (während der Erstellung ausgeben). Nicht-Telegram-Kanäle benötigen außerdem `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal leeren, bei sehr langen Inhalten möglicherweise mehrere Chunks).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur finale Antwort).

**Kanalhinweis:** Block-Streaming ist **aus, sofern**
`*.blockStreaming` nicht explizit auf `true` gesetzt ist. Kanäle können eine Live-Vorschau streamen
(`channels.<channel>.streaming`), ohne Blockantworten zu verwenden.

Erinnerung zum Konfigurationsort: Die `blockStreaming*`-Standardwerte befinden sich unter
`agents.defaults`, nicht in der Root-Konfiguration.

## Vorschau-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Vorschau-Streaming deaktivieren.
- `partial`: einzelne Vorschau, die durch den neuesten Text ersetzt wird.
- `block`: Vorschauaktualisierungen in gechunkten/angehängten Schritten.
- `progress`: Fortschritts-/Statusvorschau während der Generierung, finale Antwort nach Abschluss.

`streaming.mode: "block"` ist ein Vorschau-Streaming-Modus für bearbeitungsfähige Kanäle
wie Discord und Telegram. Er aktiviert dort keine Kanal-Blockzustellung.
Verwenden Sie `streaming.block.enabled` oder den Legacy-Kanalschlüssel `blockStreaming`, wenn
Sie normale Blockantworten möchten. Microsoft Teams ist die Ausnahme: Es hat keinen
Draft-Preview-Block-Transport, daher wird `streaming.mode: "block"` auf Teams-Blockzustellung
statt auf natives Partial-/Progress-Streaming abgebildet.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`                  |
| ---------- | ----- | --------- | ------- | --------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Discord    | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Slack      | ✅    | ✅        | ✅      | ✅                          |
| Mattermost | ✅    | ✅        | ✅      | ✅                          |
| MS Teams   | ✅    | ✅        | ✅      | nativer Fortschrittsstream  |

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet native Slack-Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` (Standard: `true`).
- Natives Slack-Streaming und Slack-Assistenten-Thread-Status erfordern ein Antwort-Thread-Ziel. Top-Level-DMs zeigen diese Thread-artige Vorschau nicht an, können aber weiterhin Slack-Entwurfsvorschau-Beiträge und Bearbeitungen verwenden.

Migration von Legacy-Schlüsseln:

- Telegram: Legacy-Werte `streamMode` sowie skalare/boolesche `streaming`-Werte werden erkannt und durch Doctor-/Konfigurationskompatibilitätspfade zu `streaming.mode` migriert.
- Discord: `streamMode` + boolesches `streaming` werden automatisch zur `streaming`-Enumeration migriert.
- Slack: `streamMode` wird automatisch zu `streaming.mode` migriert; boolesches `streaming` wird automatisch zu `streaming.mode` plus `streaming.nativeTransport` migriert; Legacy-`nativeStreaming` wird automatisch zu `streaming.nativeTransport` migriert.

### Laufzeitverhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText` für Vorschauaktualisierungen in DMs und Gruppen/Themen.
- Finaler Text bearbeitet die aktive Vorschau direkt; lange finale Antworten verwenden diese Nachricht für den ersten Chunk wieder und senden nur die verbleibenden Chunks.
- Der Modus `progress` hält Tool-Fortschritt in einem bearbeitbaren Statusentwurf, löscht diesen Entwurf bei Abschluss und sendet die finale Antwort über die normale Zustellung.
- Wenn die finale Bearbeitung fehlschlägt, bevor der abgeschlossene Text bestätigt ist, verwendet OpenClaw die normale finale Zustellung und räumt die veraltete Vorschau auf.
- Vorschau-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Reasoning in eine vorübergehende Vorschau schreiben, die nach der finalen Zustellung gelöscht wird.

Discord:

- Verwendet Senden + Bearbeiten von Vorschaunachrichten.
- Der Modus `block` verwendet Entwurfs-Chunking (`draftChunk`).
- Vorschau-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Finale Medien-, Fehler- und explizite Antwortnutzlasten brechen ausstehende Vorschauen ab, ohne einen neuen Entwurf zu leeren, und verwenden dann die normale Zustellung.

Slack:

- `partial` kann natives Slack-Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Entwurfsvorschauen im Append-Stil.
- `progress` verwendet Statusvorschautext, dann die finale Antwort.
- Top-Level-DMs ohne Antwort-Thread verwenden Entwurfsvorschau-Beiträge und Bearbeitungen statt nativem Slack-Streaming.
- Natives und Entwurfsvorschau-Streaming unterdrücken Blockantworten für diesen Turn, sodass eine Slack-Antwort nur über einen Zustellungspfad gestreamt wird.
- Finale Medien-/Fehlernutzlasten und Fortschrittsfinals erstellen keine temporären Entwurfsnachrichten; nur Text-/Blockfinals, die die Vorschau bearbeiten können, leeren ausstehenden Entwurfstext.

Mattermost:

- Streamt Denken, Tool-Aktivität und partiellen Antworttext in einen einzelnen Entwurfsvorschau-Beitrag, der direkt finalisiert wird, wenn die finale Antwort sicher gesendet werden kann.
- Fällt auf das Senden eines neuen finalen Beitrags zurück, wenn der Vorschaubeitrag gelöscht wurde oder zum Finalisierungszeitpunkt anderweitig nicht verfügbar ist.
- Finale Medien-/Fehlernutzlasten brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab, statt einen temporären Vorschaubeitrag zu leeren.

Matrix:

- Entwurfsvorschauen werden direkt finalisiert, wenn der finale Text das Vorschauereignis wiederverwenden kann.
- Finale Antworten nur mit Medien, Fehlern und nicht übereinstimmenden Antwortzielen brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab; eine bereits sichtbare veraltete Vorschau wird redigiert.

### Tool-Fortschritt-Vorschauaktualisierungen

Vorschau-Streaming kann auch **Tool-Fortschritt**-Aktualisierungen enthalten - kurze Statuszeilen wie „Web wird durchsucht“, „Datei wird gelesen“ oder „Tool wird aufgerufen“ -, die in derselben Vorschaunachricht erscheinen, während Tools ausgeführt werden, noch vor der finalen Antwort. Dadurch bleiben mehrstufige Tool-Turns visuell aktiv, statt zwischen der ersten Denk-Vorschau und der finalen Antwort stumm zu bleiben.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen Tool-Fortschritt standardmäßig in die Live-Vorschau-Bearbeitung, wenn Vorschau-Streaming aktiv ist. Microsoft Teams verwendet in persönlichen Chats seinen nativen Fortschrittsstream.
- Telegram wird seit `v2026.4.22` mit aktivierten Tool-Fortschritts-Vorschauaktualisierungen ausgeliefert; wenn sie aktiviert bleiben, bleibt dieses veröffentlichte Verhalten erhalten.
- **Mattermost** integriert Tool-Aktivität bereits in seinen einzelnen Entwurfs-Vorschaubeitrag (siehe oben).
- Tool-Fortschritts-Bearbeitungen folgen dem aktiven Vorschau-Streaming-Modus; sie werden übersprungen, wenn Vorschau-Streaming `off` ist oder wenn Block-Streaming die Nachricht übernommen hat. Bei Telegram ist `streaming.mode: "off"` ausschließlich final: Allgemeines Fortschrittsrauschen wird ebenfalls unterdrückt, statt als eigenständige Statusmeldungen zugestellt zu werden, während Genehmigungsaufforderungen, Mediennutzlasten und Fehler weiterhin normal weitergeleitet werden.
- Um Vorschau-Streaming beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie `streaming.preview.toolProgress` für diesen Kanal auf `false`. Um Tool-Fortschrittszeilen sichtbar zu halten, aber Befehls-/Ausführungstext auszublenden, setzen Sie `streaming.preview.commandText` auf `"status"` oder `streaming.progress.commandText` auf `"status"`; der Standardwert ist `"raw"`, um veröffentlichtes Verhalten beizubehalten. Diese Richtlinie wird von Entwurfs-/Fortschrittskanälen geteilt, die OpenClaws kompakten Fortschritts-Renderer verwenden, einschließlich Discord, Matrix, Microsoft Teams, Mattermost, Slack-Entwurfsvorschauen und Telegram. Um Vorschau-Bearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.
- Ausgewählte Zitatantworten in Telegram sind eine Ausnahme: Wenn `replyToMode` nicht `"off"` ist und ausgewählter Zitattext vorhanden ist, überspringt OpenClaw den Antwort-Vorschaustream für diesen Durchlauf, sodass Tool-Fortschritts-Vorschauzeilen nicht gerendert werden können. Antworten auf aktuelle Nachrichten ohne ausgewählten Zitattext behalten Vorschau-Streaming weiterhin bei. Weitere Details finden Sie in der [Telegram-Kanaldokumentation](/de/channels/telegram).

Fortschrittszeilen sichtbar halten, aber rohen Befehls-/Ausführungstext ausblenden:

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

Verwenden Sie dieselbe Struktur unter einem anderen Schlüssel für kompakte Fortschrittskanäle, zum Beispiel `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` oder Slack-Entwurfsvorschauen. Für den Fortschrittsentwurfsmodus legen Sie dieselbe Richtlinie unter `streaming.progress` ab:

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

- [Refaktorierung des Nachrichtenlebenszyklus](/de/concepts/message-lifecycle-refactor) - Zielentwurf für gemeinsame Vorschau, Bearbeitung, Stream und Finalisierung
- [Fortschrittsentwürfe](/de/concepts/progress-drafts) - sichtbare In-Arbeit-Nachrichten, die während langer Durchläufe aktualisiert werden
- [Nachrichten](/de/concepts/messages) - Nachrichtenlebenszyklus und Zustellung
- [Wiederholen](/de/concepts/retry) - Wiederholungsverhalten bei Zustellungsfehlern
- [Kanäle](/de/channels) - Streaming-Unterstützung pro Kanal
