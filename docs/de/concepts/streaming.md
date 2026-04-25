---
read_when:
    - Erklären, wie Streaming oder Chunking auf Channels funktioniert.
    - Verhalten für Block-Streaming oder Channel-Chunking ändern.
    - Doppelte/vorzeitige Block-Antworten oder Vorschau-Streaming auf Channels debuggen.
summary: Streaming- und Chunking-Verhalten (Block-Antworten, Channel-Vorschau-Streaming, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-04-25T13:45:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw hat zwei getrennte Streaming-Ebenen:

- **Block-Streaming (Channels):** sendet abgeschlossene **Blöcke**, während der Assistant schreibt. Dies sind normale Channel-Nachrichten (keine Token-Deltas).
- **Vorschau-Streaming (Telegram/Discord/Slack):** aktualisiert während der Generierung eine temporäre **Vorschau-Nachricht**.

Derzeit gibt es **kein echtes Token-Delta-Streaming** in Channel-Nachrichten. Vorschau-Streaming ist nachrichtenbasiert (Senden + Bearbeiten/Anhängen).

## Block-Streaming (Channel-Nachrichten)

Block-Streaming sendet Assistant-Ausgaben in groben Chunks, sobald sie verfügbar sind.

```
Modellausgabe
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker gibt Blöcke aus, während der Puffer wächst
       └─ (blockStreamingBreak=message_end)
            └─ chunker leert bei message_end
                   └─ Channel-Send (Block-Antworten)
```

Legende:

- `text_delta/events`: Modell-Stream-Ereignisse (können bei nicht streamenden Modellen spärlich sein).
- `chunker`: `EmbeddedBlockChunker`, der Min-/Max-Grenzen + Trennpräferenz anwendet.
- `channel send`: tatsächliche ausgehende Nachrichten (Block-Antworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (Standard aus).
- Channel-Überschreibungen: `*.blockStreaming` (und Varianten pro Konto), um `"on"`/`"off"` pro Channel zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (führt gestreamte Blöcke vor dem Senden zusammen).
- Channel-Hardcap: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Channel-Chunk-Modus: `*.chunkMode` (`length` standardmäßig, `newline` trennt an Leerzeilen (Absatzgrenzen) vor dem Chunking nach Länge).
- Discord-Softcap: `channels.discord.maxLinesPerMessage` (Standard 17) teilt hohe Antworten auf, um UI-Abschneiden zu vermeiden.

**Grenzsemantik:**

- `text_end`: streamt Blöcke, sobald der Chunker sie ausgibt; leert bei jedem `text_end`.
- `message_end`: wartet, bis die Assistant-Nachricht abgeschlossen ist, und leert dann die gepufferte Ausgabe.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

### Medienzustellung mit Block-Streaming

`MEDIA:`-Direktiven sind normale Zustellungsmetadaten. Wenn Block-Streaming einen
Medienblock früh sendet, merkt sich OpenClaw diese Zustellung für den Turn. Wenn die endgültige
Assistant-Nutzlast dieselbe Medien-URL wiederholt, entfernt die endgültige Zustellung die
doppelten Medien, statt den Anhang erneut zu senden.

Exakt doppelte endgültige Nutzlasten werden unterdrückt. Wenn die endgültige Nutzlast
eigenständigen Text um Medien ergänzt, die bereits gestreamt wurden, sendet OpenClaw
den neuen Text trotzdem, während die Medien nur einmal zugestellt werden. Das verhindert
doppelte Sprachnachrichten oder Dateien auf Channels wie Telegram, wenn ein Agent während
des Streamings `MEDIA:` ausgibt und der Provider es auch in die abgeschlossene Antwort einfügt.

## Chunking-Algorithmus (untere/obere Grenzen)

Block-Chunking wird durch `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** nicht ausgeben, bis der Puffer >= `minChars` ist (außer wenn erzwungen).
- **Obere Grenze:** Trennungen vor `maxChars` bevorzugen; wenn erzwungen, bei `maxChars` trennen.
- **Trennpräferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harte Trennung.
- **Code-Fences:** niemals innerhalb von Fences trennen; wenn bei `maxChars` erzwungen, die Fence schließen + erneut öffnen, um gültiges Markdown zu erhalten.

`maxChars` wird auf das Channel-`textChunkLimit` begrenzt, sodass per-Channel-Caps nicht überschritten werden können.

## Coalescing (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**,
bevor sie gesendet werden. Das reduziert „Ein-Zeilen-Spam“, während trotzdem
fortschreitende Ausgabe bereitgestellt wird.

- Coalescing wartet auf **Leerlauf-Lücken** (`idleMs`), bevor geleert wird.
- Puffer sind durch `maxChars` begrenzt und werden geleert, wenn sie diese überschreiten.
- `minChars` verhindert das Senden winziger Fragmente, bis sich genug Text angesammelt hat
  (das endgültige Leeren sendet verbleibenden Text immer).
- Das Verknüpfungszeichen wird von `blockStreamingChunk.breakPreference`
  abgeleitet (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Channel-Überschreibungen sind über `*.blockStreamingCoalesce` verfügbar (einschließlich Konfigurationen pro Konto).
- Der Standardwert für Coalesce-`minChars` wird für Signal/Slack/Discord auf 1500 erhöht, sofern nicht überschrieben.

## Menschlich wirkendes Tempo zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie eine **randomisierte Pause** zwischen
Block-Antworten hinzufügen (nach dem ersten Block). Dadurch wirken Antworten mit
mehreren Sprechblasen natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (Überschreibung pro Agent über `agents.list[].humanDelay`).
- Modi: `off` (Standard), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Block-Antworten**, nicht für endgültige Antworten oder Tool-Zusammenfassungen.

## „Chunks streamen oder alles“

Dies entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (währenddessen ausgeben). Nicht-Telegram-Channels benötigen zusätzlich `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal leeren, eventuell mehrere Chunks, wenn sehr lang).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur endgültige Antwort).

**Channel-Hinweis:** Block-Streaming ist **aus, sofern**
`*.blockStreaming` nicht explizit auf `true` gesetzt ist. Channels können eine Live-Vorschau
streamen (`channels.<channel>.streaming`), ohne Block-Antworten zu verwenden.

Hinweis zum Konfigurationsort: Die Standardwerte `blockStreaming*` liegen unter
`agents.defaults`, nicht in der Root-Konfiguration.

## Modi für Vorschau-Streaming

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Vorschau-Streaming deaktivieren.
- `partial`: einzelne Vorschau, die durch den neuesten Text ersetzt wird.
- `block`: Vorschau-Aktualisierungen in gechunkten/angehängten Schritten.
- `progress`: Fortschritts-/Statusvorschau während der Generierung, endgültige Antwort nach Abschluss.

### Channel-Zuordnung

| Channel    | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | ✅    | ✅        | ✅      | wird auf `partial` abgebildet |
| Discord    | ✅    | ✅        | ✅      | wird auf `partial` abgebildet |
| Slack      | ✅    | ✅        | ✅      | ✅                  |
| Mattermost | ✅    | ✅        | ✅      | ✅                  |

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet native Slack-Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` (Standard: `true`).
- Native Slack-Streaming-Funktionen und Slack-Assistant-Thread-Status erfordern ein Antwort-Thread-Ziel; DMs auf oberster Ebene zeigen diese Thread-artige Vorschau nicht.

Migration veralteter Schlüssel:

- Telegram: veraltete Werte für `streamMode` und skalare/boole'sche `streaming`-Werte werden durch Doctor-/Konfigurations-Kompatibilitätspfade erkannt und nach `streaming.mode` migriert.
- Discord: `streamMode` + boolesches `streaming` werden automatisch zur Enum `streaming` migriert.
- Slack: `streamMode` wird automatisch nach `streaming.mode` migriert; boolesches `streaming` wird automatisch nach `streaming.mode` plus `streaming.nativeTransport` migriert; veraltetes `nativeStreaming` wird automatisch nach `streaming.nativeTransport` migriert.

### Laufzeitverhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText` für Vorschau-Aktualisierungen in DMs und Gruppen/Themen.
- Vorschau-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Begründungen in die Vorschau schreiben.

Discord:

- Verwendet Senden + Bearbeiten von Vorschau-Nachrichten.
- Der Modus `block` verwendet Entwurfs-Chunking (`draftChunk`).
- Vorschau-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Endgültige Nutzlasten für Medien, Fehler und explizite Antworten verwerfen ausstehende Vorschauen, ohne einen neuen Entwurf zu leeren, und verwenden dann die normale Zustellung.

Slack:

- `partial` kann natives Slack-Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Entwurfsvorschauen im Anhänge-Stil.
- `progress` verwendet Statusvorschautext, dann die endgültige Antwort.
- Natives und entwurfsbasiertes Vorschau-Streaming unterdrücken Block-Antworten für diesen Turn, sodass eine Slack-Antwort nur über einen Zustellungspfad gestreamt wird.
- Endgültige Medien-/Fehler-Nutzlasten und `progress`-Finals erzeugen keine Wegwerf-Entwurfsnachrichten; nur Text-/Block-Finals, die die Vorschau bearbeiten können, leeren ausstehenden Entwurfstext.

Mattermost:

- Streamt Thinking, Tool-Aktivität und partiellen Antworttext in einen einzelnen Entwurfs-Vorschau-Post, der an Ort und Stelle finalisiert wird, wenn die endgültige Antwort sicher gesendet werden kann.
- Fällt auf das Senden eines neuen endgültigen Posts zurück, wenn der Vorschau-Post gelöscht wurde oder beim Finalisieren anderweitig nicht verfügbar ist.
- Endgültige Medien-/Fehler-Nutzlasten verwerfen ausstehende Vorschau-Aktualisierungen vor der normalen Zustellung, statt einen temporären Vorschau-Post zu leeren.

Matrix:

- Entwurfsvorschauen werden an Ort und Stelle finalisiert, wenn der endgültige Text das Vorschau-Ereignis wiederverwenden kann.
- Finals nur mit Medien, Fehler und Finals mit nicht passendem Antwortziel verwerfen ausstehende Vorschau-Aktualisierungen vor der normalen Zustellung; eine bereits sichtbare veraltete Vorschau wird redigiert.

### Tool-Fortschritts-Aktualisierungen in Vorschauen

Vorschau-Streaming kann auch **Tool-Fortschritts**-Aktualisierungen enthalten — kurze Statuszeilen wie „suche im Web“, „lese Datei“ oder „rufe Tool auf“ —, die während der Tool-Ausführung in derselben Vorschau-Nachricht erscheinen, noch vor der endgültigen Antwort. Dadurch wirken mehrstufige Tool-Turns visuell lebendig statt still zwischen der ersten Thinking-Vorschau und der endgültigen Antwort.

Unterstützte Oberflächen:

- **Discord**, **Slack** und **Telegram** streamen Tool-Fortschritt standardmäßig in die Live-Vorschau-Bearbeitung, wenn Vorschau-Streaming aktiv ist.
- Telegram wird seit `v2026.4.22` mit aktivierten Tool-Fortschritts-Aktualisierungen in Vorschauen ausgeliefert; das Beibehalten dieser Aktivierung bewahrt dieses veröffentlichte Verhalten.
- **Mattermost** integriert Tool-Aktivität bereits in seinen einzelnen Entwurfs-Vorschau-Post (siehe oben).
- Tool-Fortschritts-Bearbeitungen folgen dem aktiven Vorschau-Streaming-Modus; sie werden übersprungen, wenn Vorschau-Streaming auf `off` steht oder wenn Block-Streaming die Nachricht übernommen hat.
- Um Vorschau-Streaming beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie `streaming.preview.toolProgress` für diesen Channel auf `false`. Um Vorschau-Bearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.

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

## Verwandt

- [Nachrichten](/de/concepts/messages) — Nachrichtenlebenszyklus und Zustellung
- [Wiederholung](/de/concepts/retry) — Verhalten bei Wiederholungen nach Zustellungsfehlern
- [Channels](/de/channels) — Streaming-Unterstützung pro Channel
