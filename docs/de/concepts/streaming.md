---
read_when:
    - Erläutern, wie Streaming oder Chunking in Kanälen funktioniert
    - Ändern des Verhaltens von Block-Streaming oder Kanal-Chunking
    - Debuggen von doppelten/frühen Blockantworten oder Preview-Streaming im Kanal
summary: Streaming- und Chunking-Verhalten (Blockantworten, Preview-Streaming im Kanal, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-04-22T04:22:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6b246025ea1b1be57705bde60c0cdb485ffda727392cf00ea5a165571e37fce
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + Chunking

OpenClaw hat zwei separate Streaming-Ebenen:

- **Block-Streaming (Kanäle):** abgeschlossene **Blöcke** ausgeben, während der Assistent schreibt. Das sind normale Kanalnachrichten (keine Token-Deltas).
- **Preview-Streaming (Telegram/Discord/Slack):** eine temporäre **Preview-Nachricht** während der Generierung aktualisieren.

Es gibt heute **kein echtes Token-Delta-Streaming** in Kanalnachrichten. Preview-Streaming ist nachrichtenbasiert (Senden + Bearbeitungen/Anhängen).

## Block-Streaming (Kanalnachrichten)

Block-Streaming sendet Assistentenausgaben in groben Chunks, sobald sie verfügbar werden.

```
Modellausgabe
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ Chunker gibt Blöcke aus, während der Puffer wächst
       └─ (blockStreamingBreak=message_end)
            └─ Chunker leert bei message_end
                   └─ Kanalsendung (Blockantworten)
```

Legende:

- `text_delta/events`: Stream-Ereignisse des Modells (können bei nicht-streamenden Modellen spärlich sein).
- `chunker`: `EmbeddedBlockChunker`, der Min-/Max-Grenzen + Trennungspräferenz anwendet.
- `channel send`: tatsächliche ausgehende Nachrichten (Blockantworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (Standard: aus).
- Kanalüberschreibungen: `*.blockStreaming` (und Varianten pro Account), um `"on"`/`"off"` pro Kanal zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen).
- Harte Kanalobergrenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Kanal-Chunk-Modus: `*.chunkMode` (`length` standardmäßig, `newline` trennt an Leerzeilen (Absatzgrenzen) vor dem Chunking nach Länge).
- Discord-Soft-Limit: `channels.discord.maxLinesPerMessage` (Standard 17) teilt hohe Antworten auf, um UI-Abschneiden zu vermeiden.

**Semantik der Grenzen:**

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` leeren.
- `message_end`: warten, bis die Assistentennachricht fertig ist, dann die gepufferte Ausgabe leeren.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, und kann daher am Ende mehrere Chunks ausgeben.

## Chunking-Algorithmus (untere/obere Grenzen)

Block-Chunking wird von `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** Nichts ausgeben, bis der Puffer >= `minChars` ist (außer wenn erzwungen).
- **Obere Grenze:** Trennungen vor `maxChars` bevorzugen; wenn erzwungen, bei `maxChars` trennen.
- **Trennungspräferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harte Trennung.
- **Code-Fences:** Niemals innerhalb von Fences trennen; wenn bei `maxChars` erzwungen wird, die Fence schließen + erneut öffnen, damit Markdown gültig bleibt.

`maxChars` wird auf das `textChunkLimit` des Kanals begrenzt, sodass kanalbezogene Obergrenzen nicht überschritten werden können.

## Zusammenführen (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**,
bevor sie gesendet werden. Das reduziert „Einzeilen-Spam“, liefert aber trotzdem
fortschreitende Ausgabe.

- Das Zusammenführen wartet auf **Leerlaufintervalle** (`idleMs`), bevor geleert wird.
- Puffer werden durch `maxChars` begrenzt und werden geleert, wenn sie diese Grenze überschreiten.
- `minChars` verhindert, dass winzige Fragmente gesendet werden, bis genug Text angesammelt ist
  (der letzte Leerungsvorgang sendet immer verbleibenden Text).
- Der Verbinder wird aus `blockStreamingChunk.breakPreference`
  abgeleitet (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Kanalüberschreibungen sind über `*.blockStreamingCoalesce` verfügbar (einschließlich Konfigurationen pro Account).
- Das Standard-`minChars` für Zusammenführung wird für Signal/Slack/Discord auf 1500 erhöht, sofern nicht überschrieben.

## Menschenähnliches Tempo zwischen Blöcken

Wenn Block-Streaming aktiviert ist, kannst du eine **zufällige Pause** zwischen
Blockantworten hinzufügen (nach dem ersten Block). Dadurch wirken Antworten mit
mehreren Nachrichtenblasen natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (Überschreibung pro Agent über `agents.list[].humanDelay`).
- Modi: `off` (Standard), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Blockantworten**, nicht für endgültige Antworten oder Tool-Zusammenfassungen.

## „Chunks streamen oder alles“

Das entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (während der Ausgabe senden). Nicht-Telegram-Kanäle benötigen zusätzlich `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal leeren, möglicherweise mehrere Chunks bei sehr langem Text).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur endgültige Antwort).

**Kanalhinweis:** Block-Streaming ist **deaktiviert, solange nicht**
`*.blockStreaming` explizit auf `true` gesetzt ist. Kanäle können eine Live-Preview
(`channels.<channel>.streaming`) streamen, ohne Blockantworten zu senden.

Hinweis zum Konfigurationsort: Die Standardwerte `blockStreaming*` liegen unter
`agents.defaults`, nicht in der Root-Konfiguration.

## Preview-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Preview-Streaming deaktivieren.
- `partial`: eine einzelne Preview, die durch den neuesten Text ersetzt wird.
- `block`: Preview wird in gechunkten/angehängten Schritten aktualisiert.
- `progress`: Fortschritts-/Status-Preview während der Generierung, endgültige Antwort bei Abschluss.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | ✅    | ✅        | ✅      | wird auf `partial` abgebildet |
| Discord    | ✅    | ✅        | ✅      | wird auf `partial` abgebildet |
| Slack      | ✅    | ✅        | ✅      | ✅                  |
| Mattermost | ✅    | ✅        | ✅      | ✅                  |

Nur für Slack:

- `channels.slack.streaming.nativeTransport` schaltet native Slack-Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` gesetzt ist (Standard: `true`).
- Natives Slack-Streaming und der Status von Slack-Assistenten-Threads benötigen ein Antwort-Thread-Ziel; Top-Level-DMs zeigen diese Thread-ähnliche Preview nicht an.

Migration alter Schlüssel:

- Telegram: `streamMode` + boolesches `streaming` werden automatisch zur Enum `streaming` migriert.
- Discord: `streamMode` + boolesches `streaming` werden automatisch zur Enum `streaming` migriert.
- Slack: `streamMode` wird automatisch zu `streaming.mode` migriert; boolesches `streaming` wird automatisch zu `streaming.mode` plus `streaming.nativeTransport` migriert; das alte `nativeStreaming` wird automatisch zu `streaming.nativeTransport` migriert.

### Laufzeitverhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText` für Preview-Aktualisierungen in DMs und Gruppen/Themen.
- Preview-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Reasoning in die Preview schreiben.

Discord:

- Verwendet Senden + Bearbeiten von Preview-Nachrichten.
- Der Modus `block` verwendet Draft-Chunking (`draftChunk`).
- Preview-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Finale Medien-, Fehler- und explizite Antwort-Payloads brechen ausstehende Previews ab, ohne einen neuen Draft zu leeren, und verwenden dann die normale Zustellung.

Slack:

- `partial` kann natives Slack-Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Preview-Entwürfe im Append-Stil.
- `progress` verwendet Preview-Statustext, dann die endgültige Antwort.
- Finale Medien-/Fehler-Payloads und `progress`-Finals erstellen keine Wegwerf-Draft-Nachrichten; nur finale Text-/Block-Antworten, die die Preview bearbeiten können, leeren ausstehenden Draft-Text.

Mattermost:

- Streamt Thinking, Tool-Aktivität und Teilantworttext in einen einzelnen Draft-Preview-Post, der beim Finalisieren an Ort und Stelle abgeschlossen wird, wenn die endgültige Antwort sicher gesendet werden kann.
- Fällt auf das Senden eines neuen finalen Posts zurück, wenn der Preview-Post gelöscht wurde oder beim Finalisieren anderweitig nicht verfügbar ist.
- Finale Medien-/Fehler-Payloads brechen ausstehende Preview-Aktualisierungen vor der normalen Zustellung ab, statt einen temporären Preview-Post zu leeren.

Matrix:

- Draft-Previews werden an Ort und Stelle finalisiert, wenn der endgültige Text das Preview-Ereignis wiederverwenden kann.
- Medien-only-, Fehler- und Reply-Target-Mismatch-Finals brechen ausstehende Preview-Aktualisierungen vor der normalen Zustellung ab; eine bereits sichtbare veraltete Preview wird redigiert.

### Tool-Fortschritts-Preview-Aktualisierungen

Preview-Streaming kann auch **Tool-Fortschritts**-Aktualisierungen enthalten — kurze Statuszeilen wie „searching the web“, „reading file“ oder „calling tool“ — die in derselben Preview-Nachricht erscheinen, während Tools ausgeführt werden, vor der endgültigen Antwort. Dadurch bleiben mehrstufige Tool-Turns visuell lebendig, statt zwischen der ersten Thinking-Preview und der endgültigen Antwort stumm zu bleiben.

Unterstützte Oberflächen:

- **Discord**, **Slack** und **Telegram** streamen Tool-Fortschritt in die Bearbeitung der Live-Preview.
- **Mattermost** integriert Tool-Aktivität bereits in seinen einzelnen Draft-Preview-Post (siehe oben).
- Tool-Fortschritts-Bearbeitungen folgen dem aktiven Preview-Streaming-Modus; sie werden übersprungen, wenn Preview-Streaming `off` ist oder wenn Block-Streaming die Nachricht übernommen hat.

## Verwandt

- [Nachrichten](/de/concepts/messages) — Nachrichtenlebenszyklus und Zustellung
- [Wiederholung](/de/concepts/retry) — Wiederholungsverhalten bei Zustellfehlern
- [Kanäle](/de/channels) — Streaming-Unterstützung pro Kanal
