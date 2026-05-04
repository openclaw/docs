---
read_when:
    - Erklärung, wie Streaming oder Chunking in Kanälen funktioniert
    - Block-Streaming- oder Kanal-Chunking-Verhalten ändern
    - Fehlerbehebung bei doppelten oder verfrühten Blockantworten oder beim Kanalvorschau-Streaming
summary: Streaming- + Chunking-Verhalten (Blockantworten, Kanalvorschau-Streaming, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-05-04T07:03:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw hat zwei separate Streaming-Ebenen:

- **Block-Streaming (Kanäle):** gibt abgeschlossene **Blöcke** aus, während der Assistent schreibt. Dies sind normale Kanalnachrichten (keine Token-Deltas).
- **Vorschau-Streaming (Telegram/Discord/Slack):** aktualisiert während der Generierung eine temporäre **Vorschaunachricht**.

Es gibt derzeit **kein echtes Token-Delta-Streaming** zu Kanalnachrichten. Vorschau-Streaming ist nachrichtenbasiert (Senden + Bearbeitungen/Anhänge).

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
- `chunker`: `EmbeddedBlockChunker`, der Mindest-/Höchstgrenzen + bevorzugte Umbrüche anwendet.
- `channel send`: tatsächliche ausgehende Nachrichten (Block-Antworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standardmäßig aus).
- Kanal-Overrides: `*.blockStreaming` (und Varianten pro Konto), um pro Kanal `"on"`/`"off"` zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (führt gestreamte Blöcke vor dem Senden zusammen).
- Harte Kanalobergrenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Kanal-Chunk-Modus: `*.chunkMode` (Standard `length`, `newline` teilt vor dem Längen-Chunking an Leerzeilen (Absatzgrenzen)).
- Discord-Soft-Cap: `channels.discord.maxLinesPerMessage` (Standard 17) teilt hohe Antworten, um UI-Clipping zu vermeiden.

**Grenzsemantik:**

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` leeren.
- `message_end`: warten, bis die Assistentennachricht abgeschlossen ist, dann die gepufferte Ausgabe leeren.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

### Medienauslieferung mit Block-Streaming

`MEDIA:`-Direktiven sind normale Auslieferungsmetadaten. Wenn Block-Streaming einen Medienblock früh sendet, merkt sich OpenClaw diese Auslieferung für den Turn. Wenn die endgültige Assistenten-Nutzlast dieselbe Medien-URL wiederholt, entfernt die endgültige Auslieferung das doppelte Medium, statt den Anhang erneut zu senden.

Exakt doppelte endgültige Nutzlasten werden unterdrückt. Wenn die endgültige Nutzlast zusätzlichen Text um Medien ergänzt, die bereits gestreamt wurden, sendet OpenClaw den neuen Text weiterhin, behält aber die einmalige Medienauslieferung bei. Dies verhindert doppelte Sprachnachrichten oder Dateien in Kanälen wie Telegram, wenn ein Agent während des Streamings `MEDIA:` ausgibt und der Provider sie auch in die abgeschlossene Antwort einfügt.

## Chunking-Algorithmus (untere/obere Grenzen)

Block-Chunking wird durch `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** nicht ausgeben, bevor Puffer >= `minChars` ist (außer erzwungen).
- **Obere Grenze:** Teilungen vor `maxChars` bevorzugen; wenn erzwungen, bei `maxChars` teilen.
- **Umbruchpräferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harter Umbruch.
- **Code-Fences:** niemals innerhalb von Fences teilen; wenn bei `maxChars` erzwungen, den Fence schließen + erneut öffnen, um gültiges Markdown zu erhalten.

`maxChars` wird auf das Kanal-`textChunkLimit` begrenzt, sodass Sie die Grenzwerte pro Kanal nicht überschreiten können.

## Coalescing (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**, bevor sie ausgegeben werden. Dies reduziert „Ein-Zeilen-Spam“ und liefert dennoch fortlaufende Ausgaben.

- Coalescing wartet vor dem Leeren auf **Leerlaufpausen** (`idleMs`).
- Puffer sind durch `maxChars` begrenzt und werden geleert, wenn sie diese Grenze überschreiten.
- `minChars` verhindert, dass winzige Fragmente gesendet werden, bis genug Text angesammelt wurde (der finale Flush sendet immer den verbleibenden Text).
- Der Joiner wird aus `blockStreamingChunk.breakPreference` abgeleitet (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Kanal-Overrides sind über `*.blockStreamingCoalesce` verfügbar (einschließlich Konfigurationen pro Konto).
- Der standardmäßige Coalesce-`minChars`-Wert wird für Signal/Slack/Discord auf 1500 erhöht, sofern er nicht überschrieben wird.

## Menschlich wirkende Pausen zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie zwischen Block-Antworten (nach dem ersten Block) eine **randomisierte Pause** hinzufügen. Dadurch wirken Antworten mit mehreren Sprechblasen natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (pro Agent über `agents.list[].humanDelay` überschreibbar).
- Modi: `off` (Standard), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Block-Antworten**, nicht für endgültige Antworten oder Tool-Zusammenfassungen.

## „Chunks oder alles streamen“

Dies entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (während der Ausgabe senden). Nicht-Telegram-Kanäle benötigen außerdem `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal leeren, bei sehr langer Ausgabe möglicherweise in mehreren Chunks).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur endgültige Antwort).

**Kanalhinweis:** Block-Streaming ist **aus, sofern**
`*.blockStreaming` nicht explizit auf `true` gesetzt ist. Kanäle können eine Live-Vorschau streamen (`channels.<channel>.streaming`), ohne Block-Antworten zu senden.

Erinnerung zum Konfigurationsort: Die `blockStreaming*`-Defaults befinden sich unter `agents.defaults`, nicht in der Root-Konfiguration.

## Vorschau-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Vorschau-Streaming deaktivieren.
- `partial`: einzelne Vorschau, die durch den neuesten Text ersetzt wird.
- `block`: Vorschau wird in gechunkten/angehängten Schritten aktualisiert.
- `progress`: Fortschritts-/Statusvorschau während der Generierung, endgültige Antwort bei Abschluss.

`streaming.mode: "block"` ist ein Vorschau-Streaming-Modus für bearbeitungsfähige Kanäle wie Discord und Telegram. Er aktiviert dort keine Kanal-Blockauslieferung. Verwenden Sie `streaming.block.enabled` oder den Legacy-Kanalschlüssel `blockStreaming`, wenn Sie normale Block-Antworten wünschen. Microsoft Teams ist die Ausnahme: Es hat keinen Entwurfs-Vorschau-Blocktransport, daher wird `streaming.mode: "block"` auf Teams-Blockauslieferung statt auf natives Partial-/Progress-Streaming abgebildet.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`                  |
| ---------- | ----- | --------- | ------- | --------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Discord    | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Slack      | ✅    | ✅        | ✅      | ✅                          |
| Mattermost | ✅    | ✅        | ✅      | ✅                          |
| MS Teams   | ✅    | ✅        | ✅      | nativer Fortschrittsstream  |

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet native Slack-Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` ist (Standard: `true`).
- Natives Slack-Streaming und Slack-Assistenten-Thread-Status benötigen ein Antwort-Thread-Ziel. Top-Level-DMs zeigen diese Thread-Vorschau nicht an, können aber weiterhin Slack-Entwurfs-Vorschauposts und Bearbeitungen verwenden.

Legacy-Schlüsselmigration:

- Telegram: Legacy-`streamMode` und skalare/boolesche `streaming`-Werte werden erkannt und über Doctor-/Konfigurationskompatibilitätspfade zu `streaming.mode` migriert.
- Discord: `streamMode` + boolesches `streaming` werden automatisch zur `streaming`-Enum migriert.
- Slack: `streamMode` wird automatisch zu `streaming.mode` migriert; boolesches `streaming` wird automatisch zu `streaming.mode` plus `streaming.nativeTransport` migriert; Legacy-`nativeStreaming` wird automatisch zu `streaming.nativeTransport` migriert.

### Laufzeitverhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText`-Vorschauaktualisierungen über DMs und Gruppen/Themen hinweg.
- Sendet eine neue endgültige Nachricht, statt an Ort und Stelle zu bearbeiten, wenn eine Vorschau etwa eine Minute sichtbar war, und bereinigt anschließend die Vorschau, damit der Telegram-Zeitstempel den Abschluss der Antwort widerspiegelt.
- Vorschau-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Reasoning in eine flüchtige Vorschau schreiben, die nach der endgültigen Auslieferung gelöscht wird.

Discord:

- Verwendet Senden + Bearbeiten von Vorschaunachrichten.
- Der Modus `block` verwendet Entwurfs-Chunking (`draftChunk`).
- Vorschau-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Endgültige Medien-, Fehler- und explizite Antwortnutzlasten brechen ausstehende Vorschauen ab, ohne einen neuen Entwurf zu leeren, und verwenden anschließend die normale Auslieferung.

Slack:

- `partial` kann natives Slack-Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Entwurfsvorschauen im Append-Stil.
- `progress` verwendet Statusvorschautext und anschließend die endgültige Antwort.
- Top-Level-DMs ohne Antwort-Thread verwenden Entwurfs-Vorschauposts und Bearbeitungen statt nativem Slack-Streaming.
- Native und Entwurfs-Vorschau-Streams unterdrücken Block-Antworten für diesen Turn, sodass eine Slack-Antwort nur über einen Auslieferungspfad gestreamt wird.
- Endgültige Medien-/Fehlernutzlasten und Progress-Finals erzeugen keine Wegwerf-Entwurfsnachrichten; nur Text-/Block-Finals, die die Vorschau bearbeiten können, leeren ausstehenden Entwurfstext.

Mattermost:

- Streamt Thinking, Tool-Aktivität und teilweisen Antworttext in einen einzelnen Entwurfs-Vorschaupost, der an Ort und Stelle finalisiert wird, wenn die endgültige Antwort sicher gesendet werden kann.
- Fällt auf das Senden eines neuen endgültigen Posts zurück, wenn der Vorschaupost gelöscht wurde oder zum Finalisierungszeitpunkt anderweitig nicht verfügbar ist.
- Endgültige Medien-/Fehlernutzlasten brechen ausstehende Vorschauaktualisierungen vor der normalen Auslieferung ab, statt einen temporären Vorschaupost zu leeren.

Matrix:

- Entwurfsvorschauen werden an Ort und Stelle finalisiert, wenn der endgültige Text das Vorschauereignis wiederverwenden kann.
- Reine Medien-, Fehler- und Antwortziel-Nichtübereinstimmungs-Finals brechen ausstehende Vorschauaktualisierungen vor der normalen Auslieferung ab; eine bereits sichtbare veraltete Vorschau wird redigiert.

### Tool-Fortschritts-Vorschauaktualisierungen

Vorschau-Streaming kann auch **Tool-Fortschritts**-Aktualisierungen enthalten — kurze Statuszeilen wie „Durchsuchen des Webs“, „Datei lesen“ oder „Tool aufrufen“ — die in derselben Vorschaunachricht erscheinen, während Tools laufen, vor der endgültigen Antwort. Dadurch bleiben mehrstufige Tool-Turns visuell aktiv, statt zwischen der ersten Thinking-Vorschau und der endgültigen Antwort still zu wirken.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen Tool-Fortschritt standardmäßig in die Live-Vorschau-Bearbeitung, wenn Vorschau-Streaming aktiv ist. Microsoft Teams verwendet in persönlichen Chats seinen nativen Fortschrittsstream.
- Telegram wird seit `v2026.4.22` mit aktivierten Tool-Fortschritts-Vorschauaktualisierungen ausgeliefert; sie aktiviert zu lassen, bewahrt dieses veröffentlichte Verhalten.
- **Mattermost** integriert Tool-Aktivität bereits in seinen einzelnen Entwurfs-Vorschaupost (siehe oben).
- Tool-Fortschritts-Bearbeitungen folgen dem aktiven Vorschau-Streaming-Modus; sie werden übersprungen, wenn Vorschau-Streaming `off` ist oder wenn Block-Streaming die Nachricht übernommen hat. Bei Telegram ist `streaming.mode: "off"` nur final: generisches Fortschrittsgeplauder wird ebenfalls unterdrückt, statt als eigenständige Statusnachrichten ausgeliefert zu werden, während Genehmigungsaufforderungen, Mediennutzlasten und Fehler weiterhin normal geroutet werden.
- Um Vorschau-Streaming beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie `streaming.preview.toolProgress` für diesen Kanal auf `false`. Um Tool-Fortschrittszeilen sichtbar zu halten und gleichzeitig Befehls-/Ausführungstext auszublenden, setzen Sie `streaming.preview.commandText` auf `"status"` oder `streaming.progress.commandText` auf `"status"`; Standard ist `"raw"`, um veröffentlichtes Verhalten beizubehalten. Diese Richtlinie wird von Entwurfs-/Progress-Kanälen geteilt, die OpenClaws kompakten Fortschrittsrenderer verwenden, einschließlich Discord, Matrix, Microsoft Teams, Mattermost, Slack-Entwurfsvorschauen und Telegram. Um Vorschau-Bearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.
- Ausgewählte Telegram-Zitatantworten sind eine Ausnahme: Wenn `replyToMode` nicht `"off"` ist und ausgewählter Zitattext vorhanden ist, überspringt OpenClaw den Antwort-Vorschaustream für diesen Turn, sodass Tool-Fortschritts-Vorschauzeilen nicht gerendert werden können. Antworten auf aktuelle Nachrichten ohne ausgewählten Zitattext behalten das Vorschau-Streaming weiterhin bei. Details finden Sie in der [Telegram-Kanaldokumentation](/de/channels/telegram).

Halten Sie Fortschrittszeilen sichtbar, blenden Sie aber rohen Befehls-/Ausführungstext aus:

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

Verwenden Sie dieselbe Struktur unter einem anderen kompakten Fortschrittskanal-Schlüssel, zum Beispiel `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` oder Slack-Entwurfsvorschauen. Für den Fortschrittsentwurfsmodus legen Sie dieselbe Richtlinie unter `streaming.progress` ab:

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

- [Fortschrittsentwürfe](/de/concepts/progress-drafts) — sichtbare Zwischenstandsnachrichten, die während langer Turns aktualisiert werden
- [Nachrichten](/de/concepts/messages) — Nachrichtenlebenszyklus und Zustellung
- [Wiederholen](/de/concepts/retry) — Wiederholungsverhalten bei Zustellfehlern
- [Kanäle](/de/channels) — Streaming-Unterstützung pro Kanal
