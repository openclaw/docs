---
read_when:
    - Erläutern, wie Streaming oder Chunking in Kanälen funktioniert
    - Ändern des Block-Streamings oder des Chunking-Verhaltens von Kanälen
    - Fehlerbehebung bei doppelten/verfrühten Block-Antworten oder beim Streaming der Kanalvorschau
summary: Streaming + Chunking-Verhalten (Block-Antworten, Kanalvorschau-Streaming, Moduszuordnung)
title: Streaming und Aufteilung in Blöcke
x-i18n:
    generated_at: "2026-05-03T06:37:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85f6cb33031a6c818bb709e0ed14d8dd0f8c30a3dd90468a40396b3a515b5e65
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw hat zwei getrennte Streaming-Ebenen:

- **Block-Streaming (Kanäle):** gibt abgeschlossene **Blöcke** aus, während der Assistent schreibt. Dies sind normale Kanalnachrichten (keine Token-Deltas).
- **Vorschau-Streaming (Telegram/Discord/Slack):** aktualisiert während der Generierung eine temporäre **Vorschau-Nachricht**.

Heute gibt es **kein echtes Token-Delta-Streaming** für Kanalnachrichten. Vorschau-Streaming ist nachrichtenbasiert (Senden + Bearbeitungen/Anhänge).

## Block-Streaming (Kanalnachrichten)

Block-Streaming sendet Assistentenausgaben in groben Abschnitten, sobald sie verfügbar werden.

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
- `chunker`: `EmbeddedBlockChunker`, der Mindest-/Höchstgrenzen + Umbruchpräferenz anwendet.
- `channel send`: tatsächlich ausgehende Nachrichten (Block-Antworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standardmäßig aus).
- Kanalüberschreibungen: `*.blockStreaming` (und kontoabhängige Varianten), um pro Kanal `"on"`/`"off"` zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen).
- Feste Kanalobergrenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Kanal-Chunk-Modus: `*.chunkMode` (`length` Standard, `newline` teilt vor dem Längen-Chunking an Leerzeilen (Absatzgrenzen)).
- Discord-Soft-Cap: `channels.discord.maxLinesPerMessage` (Standard 17) teilt hohe Antworten auf, um UI-Clipping zu vermeiden.

**Grenzsemantik:**

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` leeren.
- `message_end`: warten, bis die Assistentennachricht fertig ist, dann gepufferte Ausgabe leeren.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

### Medienzustellung mit Block-Streaming

`MEDIA:`-Direktiven sind normale Zustellungsmetadaten. Wenn Block-Streaming einen Medienblock früh sendet, merkt sich OpenClaw diese Zustellung für den Turn. Wenn die endgültige Assistenten-Nutzlast dieselbe Medien-URL wiederholt, entfernt die endgültige Zustellung das doppelte Medium, statt den Anhang erneut zu senden.

Exakt doppelte endgültige Nutzlasten werden unterdrückt. Wenn die endgültige Nutzlast zusätzlichen Text um Medien ergänzt, die bereits gestreamt wurden, sendet OpenClaw weiterhin den neuen Text, während das Medium nur einmal zugestellt wird. Dies verhindert doppelte Sprachnachrichten oder Dateien auf Kanälen wie Telegram, wenn ein Agent während des Streamings `MEDIA:` ausgibt und der Provider es auch in der abgeschlossenen Antwort enthält.

## Chunking-Algorithmus (untere/obere Grenzen)

Block-Chunking wird durch `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** nicht ausgeben, bis der Puffer >= `minChars` ist (außer erzwungen).
- **Obere Grenze:** Trennungen vor `maxChars` bevorzugen; wenn erzwungen, bei `maxChars` trennen.
- **Umbruchpräferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harter Umbruch.
- **Code-Fences:** niemals innerhalb von Fences trennen; wenn bei `maxChars` erzwungen wird, den Fence schließen + erneut öffnen, damit Markdown gültig bleibt.

`maxChars` wird auf das `textChunkLimit` des Kanals begrenzt, sodass Sie die kanalbezogenen Obergrenzen nicht überschreiten können.

## Zusammenführen (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**, bevor sie gesendet werden. Dies reduziert „Einzeilen-Spam“, bietet aber weiterhin progressive Ausgabe.

- Zusammenführen wartet vor dem Leeren auf **Leerlaufpausen** (`idleMs`).
- Puffer werden durch `maxChars` begrenzt und geleert, wenn sie diesen Wert überschreiten.
- `minChars` verhindert, dass winzige Fragmente gesendet werden, bis genügend Text gesammelt wurde (abschließendes Leeren sendet immer den verbleibenden Text).
- Der Joiner wird aus `blockStreamingChunk.breakPreference` abgeleitet (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Kanalüberschreibungen sind über `*.blockStreamingCoalesce` verfügbar (einschließlich kontoabhängiger Konfigurationen).
- Der Standardwert für Coalesce-`minChars` wird für Signal/Slack/Discord auf 1500 erhöht, sofern er nicht überschrieben wird.

## Menschenähnliches Timing zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie zwischen Block-Antworten (nach dem ersten Block) eine **zufällige Pause** hinzufügen. Dadurch wirken Antworten mit mehreren Sprechblasen natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (pro Agent über `agents.list[].humanDelay` überschreiben).
- Modi: `off` (Standard), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Block-Antworten**, nicht für endgültige Antworten oder Tool-Zusammenfassungen.

## „Chunks streamen oder alles“

Dies entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (während der Ausgabe senden). Nicht-Telegram-Kanäle benötigen außerdem `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal leeren, bei sehr langen Inhalten möglicherweise mehrere Chunks).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur endgültige Antwort).

**Kanalhinweis:** Block-Streaming ist **aus, sofern**
`*.blockStreaming` nicht explizit auf `true` gesetzt ist. Kanäle können eine Live-Vorschau streamen (`channels.<channel>.streaming`), ohne Block-Antworten zu senden.

Erinnerung zum Konfigurationsort: Die `blockStreaming*`-Standardwerte befinden sich unter `agents.defaults`, nicht in der Root-Konfiguration.

## Vorschau-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Vorschau-Streaming deaktivieren.
- `partial`: einzelne Vorschau, die durch den neuesten Text ersetzt wird.
- `block`: Vorschau wird in gechunkten/angehängten Schritten aktualisiert.
- `progress`: Fortschritts-/Statusvorschau während der Generierung, endgültige Antwort nach Abschluss.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`                    |
| ---------- | ----- | --------- | ------- | ----------------------------- |
| Telegram   | ✅    | ✅        | ✅      | wird `partial` zugeordnet     |
| Discord    | ✅    | ✅        | ✅      | wird `partial` zugeordnet     |
| Slack      | ✅    | ✅        | ✅      | ✅                            |
| Mattermost | ✅    | ✅        | ✅      | ✅                            |

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet native Slack-Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` ist (Standard: `true`).
- Natives Slack-Streaming und Slack-Assistenten-Thread-Status benötigen ein Antwort-Thread-Ziel. Top-Level-DMs zeigen diese Thread-artige Vorschau nicht, können aber weiterhin Slack-Entwurfsvorschau-Beiträge und Bearbeitungen verwenden.

Migration von Legacy-Schlüsseln:

- Telegram: Legacy-`streamMode` und skalare/boolesche `streaming`-Werte werden von Doctor-/Konfigurationskompatibilitätspfaden erkannt und zu `streaming.mode` migriert.
- Discord: `streamMode` + boolesches `streaming` werden automatisch zum `streaming`-Enum migriert.
- Slack: `streamMode` wird automatisch zu `streaming.mode` migriert; boolesches `streaming` wird automatisch zu `streaming.mode` plus `streaming.nativeTransport` migriert; Legacy-`nativeStreaming` wird automatisch zu `streaming.nativeTransport` migriert.

### Laufzeitverhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText` für Vorschauaktualisierungen in DMs und Gruppen/Themen.
- Sendet eine neue endgültige Nachricht, statt direkt zu bearbeiten, wenn eine Vorschau etwa eine Minute sichtbar war, und räumt anschließend die Vorschau auf, damit der Telegram-Zeitstempel den Abschluss der Antwort widerspiegelt.
- Vorschau-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Reasoning in die Vorschau schreiben.

Discord:

- Verwendet Senden + Bearbeiten von Vorschau-Nachrichten.
- Der Modus `block` verwendet Entwurfs-Chunking (`draftChunk`).
- Vorschau-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Endgültige Medien-, Fehler- und explizite Antwort-Nutzlasten brechen ausstehende Vorschauen ab, ohne einen neuen Entwurf zu leeren, und verwenden dann die normale Zustellung.

Slack:

- `partial` kann natives Slack-Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Entwurfsvorschauen im Anhänge-Stil.
- `progress` verwendet Statusvorschautext, dann die endgültige Antwort.
- Top-Level-DMs ohne Antwort-Thread verwenden Entwurfsvorschau-Beiträge und Bearbeitungen statt nativem Slack-Streaming.
- Natives und Entwurfsvorschau-Streaming unterdrücken Block-Antworten für diesen Turn, sodass eine Slack-Antwort nur über einen Zustellungspfad gestreamt wird.
- Endgültige Medien-/Fehler-Nutzlasten und Progress-Endzustände erzeugen keine Wegwerf-Entwurfsnachrichten; nur Text-/Block-Endzustände, die die Vorschau bearbeiten können, leeren ausstehenden Entwurfstext.

Mattermost:

- Streamt Thinking, Tool-Aktivität und partiellen Antworttext in einen einzelnen Entwurfsvorschau-Beitrag, der direkt finalisiert wird, wenn die endgültige Antwort sicher gesendet werden kann.
- Fällt auf das Senden eines neuen endgültigen Beitrags zurück, wenn der Vorschau-Beitrag zum Finalisierungszeitpunkt gelöscht wurde oder anderweitig nicht verfügbar ist.
- Endgültige Medien-/Fehler-Nutzlasten brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab, statt einen temporären Vorschau-Beitrag zu leeren.

Matrix:

- Entwurfsvorschauen werden direkt finalisiert, wenn der endgültige Text das Vorschau-Ereignis wiederverwenden kann.
- Nur-Medien-, Fehler- und Antwortziel-Mismatch-Endzustände brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab; eine bereits sichtbare veraltete Vorschau wird redigiert.

### Tool-Fortschrittsaktualisierungen in der Vorschau

Vorschau-Streaming kann auch **Tool-Fortschrittsaktualisierungen** enthalten – kurze Statuszeilen wie „durchsucht das Web“, „liest Datei“ oder „ruft Tool auf“ –, die während der Tool-Ausführung vor der endgültigen Antwort in derselben Vorschau-Nachricht erscheinen. So bleiben mehrstufige Tool-Turns visuell aktiv, statt zwischen der ersten Thinking-Vorschau und der endgültigen Antwort stumm zu bleiben.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen Tool-Fortschritt standardmäßig in die Live-Vorschau-Bearbeitung, wenn Vorschau-Streaming aktiv ist.
- Telegram wird seit `v2026.4.22` mit aktivierten Tool-Fortschrittsaktualisierungen in der Vorschau ausgeliefert; sie aktiviert zu lassen, bewahrt dieses veröffentlichte Verhalten.
- **Mattermost** integriert Tool-Aktivität bereits in seinen einzelnen Entwurfsvorschau-Beitrag (siehe oben).
- Tool-Fortschrittsbearbeitungen folgen dem aktiven Vorschau-Streaming-Modus; sie werden übersprungen, wenn Vorschau-Streaming `off` ist oder wenn Block-Streaming die Nachricht übernommen hat. Auf Telegram ist `streaming.mode: "off"` nur endgültige Ausgabe: allgemeines Fortschrittsgerede wird ebenfalls unterdrückt, statt als eigenständige „Working...“-Nachrichten zugestellt zu werden, während Genehmigungsaufforderungen, Medien-Nutzlasten und Fehler weiterhin normal geroutet werden.
- Um Vorschau-Streaming beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie `streaming.preview.toolProgress` für diesen Kanal auf `false`. Um Vorschau-Bearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.

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

- [Nachrichten](/de/concepts/messages) — Nachrichtenlebenszyklus und Zustellung
- [Wiederholen](/de/concepts/retry) — Wiederholungsverhalten bei Zustellungsfehlern
- [Kanäle](/de/channels) — Streaming-Unterstützung pro Kanal
