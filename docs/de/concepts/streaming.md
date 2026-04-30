---
read_when:
    - Erklären, wie Streaming oder Chunking in Kanälen funktioniert
    - Verhalten beim Block-Streaming oder Channel-Chunking ändern
    - Fehlerbehebung bei doppelten/verfrühten Blockantworten oder beim Kanalvorschau-Streaming
summary: Streaming- und Chunking-Verhalten (Blockantworten, Vorschau-Streaming im Kanal, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-04-30T06:51:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw hat zwei getrennte Streaming-Ebenen:

- **Block-Streaming (Kanäle):** gibt abgeschlossene **Blöcke** aus, während der Assistant schreibt. Dies sind normale Kanalnachrichten (keine Token-Deltas).
- **Preview-Streaming (Telegram/Discord/Slack):** aktualisiert während der Generierung eine temporäre **Preview-Nachricht**.

Heute gibt es **kein echtes Token-Delta-Streaming** zu Kanalnachrichten. Preview-Streaming ist nachrichtenbasiert (Senden + Bearbeitungen/Anhänge).

## Block-Streaming (Kanalnachrichten)

Block-Streaming sendet Assistant-Ausgaben in groben Abschnitten, sobald sie verfügbar werden.

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
- `chunker`: `EmbeddedBlockChunker`, der Mindest-/Höchstgrenzen + Break-Präferenz anwendet.
- `channel send`: tatsächliche ausgehende Nachrichten (Block-Antworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standardmäßig aus).
- Kanalüberschreibungen: `*.blockStreaming` (und Varianten pro Konto), um pro Kanal `"on"`/`"off"` zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (führt gestreamte Blöcke vor dem Senden zusammen).
- Harte Kanalobergrenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Kanal-Chunk-Modus: `*.chunkMode` (`length` Standard, `newline` teilt vor der Längenaufteilung an Leerzeilen (Absatzgrenzen)).
- Weiche Discord-Obergrenze: `channels.discord.maxLinesPerMessage` (Standard 17) teilt hohe Antworten, um UI-Clipping zu vermeiden.

**Grenzsemantik:**

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` leeren.
- `message_end`: warten, bis die Assistant-Nachricht abgeschlossen ist, dann gepufferte Ausgabe leeren.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

### Medienzustellung mit Block-Streaming

`MEDIA:`-Direktiven sind normale Zustellungsmetadaten. Wenn Block-Streaming einen Medienblock früh sendet, merkt sich OpenClaw diese Zustellung für den Turn. Wenn die finale Assistant-Payload dieselbe Medien-URL wiederholt, entfernt die finale Zustellung die doppelten Medien, statt den Anhang erneut zu senden.

Exakte doppelte finale Payloads werden unterdrückt. Wenn die finale Payload um bereits gestreamte Medien herum unterschiedlichen Text hinzufügt, sendet OpenClaw den neuen Text weiterhin, während die Medien nur einmal zugestellt werden. Dadurch werden doppelte Sprachnachrichten oder Dateien auf Kanälen wie Telegram verhindert, wenn ein Agent während des Streamings `MEDIA:` ausgibt und der Provider dies auch in die abgeschlossene Antwort aufnimmt.

## Chunking-Algorithmus (untere/obere Grenzen)

Block-Chunking wird von `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** nicht ausgeben, bevor der Puffer >= `minChars` ist (außer bei erzwungener Ausgabe).
- **Obere Grenze:** Trennungen vor `maxChars` bevorzugen; wenn erzwungen, bei `maxChars` trennen.
- **Break-Präferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harter Umbruch.
- **Code-Fences:** nie innerhalb von Fences trennen; wenn bei `maxChars` erzwungen wird, Fence schließen + erneut öffnen, damit Markdown gültig bleibt.

`maxChars` wird auf das Kanal-`textChunkLimit` begrenzt, sodass Sie die kanalbezogenen Obergrenzen nicht überschreiten können.

## Coalescing (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**, bevor sie versendet werden. Das reduziert „Einzeilen-Spam“ und bietet dennoch progressive Ausgabe.

- Coalescing wartet vor dem Leeren auf **Leerlaufpausen** (`idleMs`).
- Puffer werden durch `maxChars` begrenzt und geleert, wenn sie diese Grenze überschreiten.
- `minChars` verhindert, dass winzige Fragmente gesendet werden, bevor genügend Text angesammelt wurde (die finale Leerung sendet immer den verbleibenden Text).
- Der Verbinder wird aus `blockStreamingChunk.breakPreference` abgeleitet (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Kanalüberschreibungen sind über `*.blockStreamingCoalesce` verfügbar (einschließlich Konfigurationen pro Konto).
- Der Standardwert für Coalesce-`minChars` wird für Signal/Slack/Discord auf 1500 erhöht, sofern er nicht überschrieben wird.

## Menschlich wirkende Pausen zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie zwischen Block-Antworten (nach dem ersten Block) eine **zufällige Pause** hinzufügen. Dadurch wirken Antworten mit mehreren Nachrichtenblasen natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (pro Agent über `agents.list[].humanDelay` überschreiben).
- Modi: `off` (Standard), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Block-Antworten**, nicht für finale Antworten oder Tool-Zusammenfassungen.

## „Chunks streamen oder alles“

Dies entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (beim Generieren ausgeben). Nicht-Telegram-Kanäle benötigen zusätzlich `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal leeren, bei sehr langen Antworten möglicherweise mehrere Chunks).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur finale Antwort).

**Kanalhinweis:** Block-Streaming ist **aus, sofern**
`*.blockStreaming` nicht explizit auf `true` gesetzt ist. Kanäle können eine Live-Preview streamen (`channels.<channel>.streaming`), ohne Block-Antworten zu senden.

Konfigurationshinweis: Die `blockStreaming*`-Standardwerte liegen unter `agents.defaults`, nicht in der Root-Konfiguration.

## Preview-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Preview-Streaming deaktivieren.
- `partial`: einzelne Preview, die durch den neuesten Text ersetzt wird.
- `block`: Preview wird in gechunkten/angehängten Schritten aktualisiert.
- `progress`: Fortschritts-/Status-Preview während der Generierung, finale Antwort bei Abschluss.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`                  |
| ---------- | ----- | --------- | ------- | --------------------------- |
| Telegram   | ✅    | ✅        | ✅      | wird `partial` zugeordnet   |
| Discord    | ✅    | ✅        | ✅      | wird `partial` zugeordnet   |
| Slack      | ✅    | ✅        | ✅      | ✅                          |
| Mattermost | ✅    | ✅        | ✅      | ✅                          |

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet native Slack-Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` ist (Standard: `true`).
- Slack Native Streaming und der Status von Slack-Assistant-Threads benötigen ein Antwort-Thread-Ziel; Top-Level-DMs zeigen diese Preview im Thread-Stil nicht an.

Migration alter Schlüssel:

- Telegram: Legacy-`streamMode` und skalare/boolesche `streaming`-Werte werden erkannt und durch Doctor-/Konfigurationskompatibilitätspfade zu `streaming.mode` migriert.
- Discord: `streamMode` + boolesches `streaming` migrieren automatisch zum `streaming`-Enum.
- Slack: `streamMode` migriert automatisch zu `streaming.mode`; boolesches `streaming` migriert automatisch zu `streaming.mode` plus `streaming.nativeTransport`; Legacy-`nativeStreaming` migriert automatisch zu `streaming.nativeTransport`.

### Laufzeitverhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText` für Preview-Aktualisierungen über DMs und Gruppen/Themen hinweg.
- Sendet eine neue finale Nachricht, statt direkt zu bearbeiten, wenn eine Preview etwa eine Minute lang sichtbar war, und räumt dann die Preview auf, damit der Telegram-Zeitstempel den Abschluss der Antwort widerspiegelt.
- Preview-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Reasoning in die Preview schreiben.

Discord:

- Verwendet Senden + Bearbeiten von Preview-Nachrichten.
- Der Modus `block` verwendet Entwurfs-Chunking (`draftChunk`).
- Preview-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Finale Medien-, Fehler- und explizite Antwort-Payloads brechen ausstehende Previews ab, ohne einen neuen Entwurf zu leeren, und verwenden dann die normale Zustellung.

Slack:

- `partial` kann Slack Native Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Entwurfs-Previews im Append-Stil.
- `progress` verwendet Status-Preview-Text und danach die finale Antwort.
- Native- und Entwurfs-Preview-Streaming unterdrücken Block-Antworten für diesen Turn, sodass eine Slack-Antwort nur über einen Zustellungspfad gestreamt wird.
- Finale Medien-/Fehler-Payloads und Fortschritts-Finals erzeugen keine Wegwerf-Entwurfsnachrichten; nur Text-/Block-Finals, die die Preview bearbeiten können, leeren ausstehenden Entwurfstext.

Mattermost:

- Streamt Denken, Tool-Aktivität und partiellen Antworttext in einen einzelnen Entwurfs-Preview-Beitrag, der direkt finalisiert wird, wenn die finale Antwort sicher gesendet werden kann.
- Fällt auf das Senden eines neuen finalen Beitrags zurück, wenn der Preview-Beitrag beim Finalisieren gelöscht wurde oder anderweitig nicht verfügbar ist.
- Finale Medien-/Fehler-Payloads brechen ausstehende Preview-Aktualisierungen vor der normalen Zustellung ab, statt einen temporären Preview-Beitrag zu leeren.

Matrix:

- Entwurfs-Previews werden direkt finalisiert, wenn der finale Text das Preview-Ereignis wiederverwenden kann.
- Finals nur mit Medien, Fehler-Finals und Finals mit abweichendem Antwortziel brechen ausstehende Preview-Aktualisierungen vor der normalen Zustellung ab; eine bereits sichtbare veraltete Preview wird redigiert.

### Tool-Fortschritts-Preview-Aktualisierungen

Preview-Streaming kann auch **Tool-Fortschritts**-Aktualisierungen enthalten — kurze Statuszeilen wie „Durchsuche das Web“, „Lese Datei“ oder „Rufe Tool auf“ —, die in derselben Preview-Nachricht erscheinen, während Tools ausgeführt werden, noch vor der finalen Antwort. Dadurch bleiben mehrstufige Tool-Turns visuell aktiv, statt zwischen der ersten Denk-Preview und der finalen Antwort still zu wirken.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen Tool-Fortschritt standardmäßig in die Live-Preview-Bearbeitung, wenn Preview-Streaming aktiv ist.
- Telegram wird seit `v2026.4.22` mit aktivierten Tool-Fortschritts-Preview-Aktualisierungen ausgeliefert; wenn sie aktiviert bleiben, wird dieses veröffentlichte Verhalten beibehalten.
- **Mattermost** integriert Tool-Aktivität bereits in seinen einzelnen Entwurfs-Preview-Beitrag (siehe oben).
- Tool-Fortschritts-Bearbeitungen folgen dem aktiven Preview-Streaming-Modus; sie werden übersprungen, wenn Preview-Streaming `off` ist oder wenn Block-Streaming die Nachricht übernommen hat. Auf Telegram bedeutet `streaming.mode: "off"` nur final: allgemeiner Fortschritts-Text wird ebenfalls unterdrückt, statt als eigenständige „Wird bearbeitet...“-Nachrichten zugestellt zu werden, während Genehmigungsaufforderungen, Medien-Payloads und Fehler weiterhin normal geroutet werden.
- Um Preview-Streaming beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie `streaming.preview.toolProgress` für diesen Kanal auf `false`. Um Preview-Bearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.

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
- [Wiederholung](/de/concepts/retry) — Wiederholungsverhalten bei Zustellungsfehlern
- [Kanäle](/de/channels) — Streaming-Unterstützung pro Kanal
