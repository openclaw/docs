---
read_when:
    - Erklären, wie Streaming oder Chunking in Kanälen funktioniert
    - Block-Streaming oder Channel-Chunking-Verhalten ändern
    - Fehlersuche bei doppelten/verfrühten Blockantworten oder beim Streaming der Kanalvorschau
summary: Streaming- und Chunking-Verhalten (Block-Antworten, Kanalvorschau-Streaming, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-05-04T06:42:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcb41ceb5602ab42c3fd41a59de62cc965ea61fdbc058c052fb93689a9c5299b
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw hat zwei getrennte Streaming-Ebenen:

- **Block-Streaming (Kanäle):** gibt abgeschlossene **Blöcke** aus, während der Assistent schreibt. Das sind normale Kanalnachrichten (keine Token-Deltas).
- **Vorschau-Streaming (Telegram/Discord/Slack):** aktualisiert während der Generierung eine temporäre **Vorschaunachricht**.

Aktuell gibt es **kein echtes Token-Delta-Streaming** in Kanalnachrichten. Vorschau-Streaming ist nachrichtenbasiert (Senden + Bearbeitungen/Anhänge).

## Block-Streaming (Kanalnachrichten)

Block-Streaming sendet Assistentenausgaben in groben Teilstücken, sobald sie verfügbar werden.

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
- `channel send`: tatsächliche ausgehende Nachrichten (Block-Antworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standardmäßig aus).
- Kanal-Overrides: `*.blockStreaming` (und kontoabhängige Varianten), um pro Kanal `"on"`/`"off"` zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (streamende Blöcke vor dem Senden zusammenführen).
- Harte Kanalgrenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Kanal-Chunk-Modus: `*.chunkMode` (`length` standardmäßig, `newline` trennt vor dem Längen-Chunking an Leerzeilen (Absatzgrenzen)).
- Discord-Softlimit: `channels.discord.maxLinesPerMessage` (standardmäßig 17) teilt hohe Antworten auf, um UI-Clipping zu vermeiden.

**Grenzsemantik:**

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` leeren.
- `message_end`: warten, bis die Assistentennachricht abgeschlossen ist, dann die gepufferte Ausgabe leeren.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

### Medienzustellung mit Block-Streaming

`MEDIA:`-Direktiven sind normale Zustellungsmetadaten. Wenn Block-Streaming einen
Medienblock früh sendet, merkt sich OpenClaw diese Zustellung für den Turn. Wenn die finale
Assistenten-Nutzlast dieselbe Medien-URL wiederholt, entfernt die finale Zustellung das
duplizierte Medium, statt den Anhang erneut zu senden.

Exakt duplizierte finale Nutzlasten werden unterdrückt. Wenn die finale Nutzlast
eindeutigen Text um Medien ergänzt, die bereits gestreamt wurden, sendet OpenClaw weiterhin den
neuen Text und stellt das Medium dabei nur einmal zu. Das verhindert doppelte Sprachnotizen
oder Dateien in Kanälen wie Telegram, wenn ein Agent während des Streamings `MEDIA:` ausgibt
und der Provider es auch in der abgeschlossenen Antwort enthält.

## Chunking-Algorithmus (niedrige/hohe Grenzen)

Block-Chunking wird von `EmbeddedBlockChunker` implementiert:

- **Niedrige Grenze:** erst ausgeben, wenn Puffer >= `minChars` ist (außer erzwungen).
- **Hohe Grenze:** Trennungen vor `maxChars` bevorzugen; wenn erzwungen, bei `maxChars` trennen.
- **Umbruchpräferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harter Umbruch.
- **Code-Fences:** niemals innerhalb von Fences trennen; wenn bei `maxChars` erzwungen wird, den Fence schließen + erneut öffnen, damit Markdown gültig bleibt.

`maxChars` wird auf das Kanal-`textChunkLimit` begrenzt, sodass Sie kanalbezogene Grenzen nicht überschreiten können.

## Zusammenführen (streamende Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**,
bevor sie gesendet werden. Das reduziert „Einzeilen-Spam“ und liefert trotzdem
fortlaufende Ausgaben.

- Das Zusammenführen wartet vor dem Leeren auf **Leerlaufpausen** (`idleMs`).
- Puffer werden durch `maxChars` begrenzt und werden geleert, wenn sie diese Grenze überschreiten.
- `minChars` verhindert, dass winzige Fragmente gesendet werden, bevor genug Text angesammelt ist
  (das finale Leeren sendet immer den verbleibenden Text).
- Der Joiner wird aus `blockStreamingChunk.breakPreference` abgeleitet
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Kanal-Overrides sind über `*.blockStreamingCoalesce` verfügbar (einschließlich kontoabhängiger Konfigurationen).
- Der standardmäßige Zusammenführungswert `minChars` wird für Signal/Slack/Discord auf 1500 angehoben, sofern er nicht überschrieben wird.

## Menschlich wirkende Pausen zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie zwischen
Block-Antworten (nach dem ersten Block) eine **zufällige Pause** hinzufügen. Dadurch wirken Antworten mit mehreren Sprechblasen
natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (pro Agent über `agents.list[].humanDelay` überschreiben).
- Modi: `off` (Standard), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Block-Antworten**, nicht für finale Antworten oder Tool-Zusammenfassungen.

## „Chunks streamen oder alles“

Dies entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ausgeben, während generiert wird). Nicht-Telegram-Kanäle benötigen außerdem `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal leeren, bei sehr langen Antworten ggf. in mehreren Chunks).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur finale Antwort).

**Kanalhinweis:** Block-Streaming ist **aus, sofern nicht**
`*.blockStreaming` explizit auf `true` gesetzt ist. Kanäle können eine Live-Vorschau
(`channels.<channel>.streaming`) ohne Block-Antworten streamen.

Konfigurationshinweis: Die `blockStreaming*`-Standardwerte befinden sich unter
`agents.defaults`, nicht in der Root-Konfiguration.

## Vorschau-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Vorschau-Streaming deaktivieren.
- `partial`: einzelne Vorschau, die durch den neuesten Text ersetzt wird.
- `block`: Vorschau wird in gestückelten/angehängten Schritten aktualisiert.
- `progress`: Fortschritts-/Statusvorschau während der Generierung, finale Antwort bei Abschluss.

`streaming.mode: "block"` ist ein Vorschau-Streaming-Modus für Kanäle mit Bearbeitungsfunktion
wie Discord und Telegram. Er aktiviert dort keine Block-Zustellung im Kanal.
Verwenden Sie `streaming.block.enabled` oder den alten Kanal-Schlüssel `blockStreaming`, wenn
Sie normale Block-Antworten möchten. Microsoft Teams ist die Ausnahme: Es hat keinen
Block-Transport für Entwurfsvorschauen, daher wird `streaming.mode: "block"` auf die Teams-Block-Zustellung
statt auf natives Partial-/Fortschritts-Streaming abgebildet.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`                   |
| ---------- | ----- | --------- | ------- | ---------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Discord    | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Slack      | ✅    | ✅        | ✅      | ✅                           |
| Mattermost | ✅    | ✅        | ✅      | ✅                           |
| MS Teams   | ✅    | ✅        | ✅      | nativer Fortschrittsstream   |

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet native Slack-Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` ist (Standard: `true`).
- Natives Slack-Streaming und der Slack-Assistenten-Threadstatus erfordern ein Antwort-Thread-Ziel. Top-Level-DMs zeigen diese Thread-artige Vorschau nicht an, können aber weiterhin Slack-Entwurfsvorschau-Beiträge und -Bearbeitungen verwenden.

Migration alter Schlüssel:

- Telegram: alte `streamMode`- und skalare/boolesche `streaming`-Werte werden erkannt und durch Doctor-/Konfigurationskompatibilitätspfade zu `streaming.mode` migriert.
- Discord: `streamMode` + boolesches `streaming` migrieren automatisch zum `streaming`-Enum.
- Slack: `streamMode` migriert automatisch zu `streaming.mode`; boolesches `streaming` migriert automatisch zu `streaming.mode` plus `streaming.nativeTransport`; altes `nativeStreaming` migriert automatisch zu `streaming.nativeTransport`.

### Laufzeitverhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText` für Vorschauaktualisierungen über DMs und Gruppen/Themen hinweg.
- Sendet eine neue finale Nachricht, statt sie an Ort und Stelle zu bearbeiten, wenn eine Vorschau ungefähr eine Minute sichtbar war, und räumt anschließend die Vorschau auf, damit der Telegram-Zeitstempel den Abschluss der Antwort widerspiegelt.
- Vorschau-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Reasoning in eine temporäre Vorschau schreiben, die nach der finalen Zustellung gelöscht wird.

Discord:

- Verwendet Senden + Bearbeiten von Vorschaunachrichten.
- Der `block`-Modus verwendet Entwurfs-Chunking (`draftChunk`).
- Vorschau-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Finale Medien-, Fehler- und explizite Antwort-Nutzlasten brechen ausstehende Vorschauen ab, ohne einen neuen Entwurf zu leeren, und verwenden dann die normale Zustellung.

Slack:

- `partial` kann natives Slack-Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet angehängte Entwurfsvorschauen.
- `progress` verwendet Statustext als Vorschau und danach die finale Antwort.
- Top-Level-DMs ohne Antwort-Thread verwenden Entwurfsvorschau-Beiträge und -Bearbeitungen statt nativem Slack-Streaming.
- Natives Streaming und Entwurfsvorschau-Streaming unterdrücken Block-Antworten für diesen Turn, sodass eine Slack-Antwort nur über einen Zustellungspfad gestreamt wird.
- Finale Medien-/Fehler-Nutzlasten und Fortschrittsfinale erzeugen keine Wegwerf-Entwurfsnachrichten; nur Text-/Block-Finale, die die Vorschau bearbeiten können, leeren ausstehenden Entwurfstext.

Mattermost:

- Streamt Denken, Tool-Aktivität und teilweisen Antworttext in einen einzelnen Entwurfsvorschau-Beitrag, der an Ort und Stelle finalisiert wird, wenn die finale Antwort sicher gesendet werden kann.
- Fällt auf das Senden eines neuen finalen Beitrags zurück, wenn der Vorschaubeitrag gelöscht wurde oder zum Finalisierungszeitpunkt anderweitig nicht verfügbar ist.
- Finale Medien-/Fehler-Nutzlasten brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab, statt einen temporären Vorschaubeitrag zu leeren.

Matrix:

- Entwurfsvorschauen werden an Ort und Stelle finalisiert, wenn der finale Text das Vorschauereignis wiederverwenden kann.
- Reine Medien-, Fehler- und Antwortzielkonflikt-Finale brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab; eine bereits sichtbare veraltete Vorschau wird redigiert.

### Vorschauaktualisierungen für Tool-Fortschritt

Vorschau-Streaming kann auch **Tool-Fortschritts**-Aktualisierungen enthalten — kurze Statuszeilen wie „Web wird durchsucht“, „Datei wird gelesen“ oder „Tool wird aufgerufen“ —, die in derselben Vorschaunachricht erscheinen, während Tools ausgeführt werden, noch vor der finalen Antwort. Dadurch bleiben mehrstufige Tool-Turns visuell aktiv, statt zwischen der ersten Denk-Vorschau und der finalen Antwort still zu sein.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen Tool-Fortschritt standardmäßig in die Live-Vorschau-Bearbeitung, wenn Vorschau-Streaming aktiv ist. Microsoft Teams verwendet in persönlichen Chats seinen nativen Fortschrittsstream.
- Telegram wird seit `v2026.4.22` mit aktivierten Tool-Fortschritts-Vorschauaktualisierungen ausgeliefert; sie aktiviert zu lassen, bewahrt dieses veröffentlichte Verhalten.
- **Mattermost** integriert Tool-Aktivität bereits in seinen einzelnen Entwurfsvorschau-Beitrag (siehe oben).
- Tool-Fortschritts-Bearbeitungen folgen dem aktiven Vorschau-Streaming-Modus; sie werden übersprungen, wenn Vorschau-Streaming `off` ist oder wenn Block-Streaming die Nachricht übernommen hat. Bei Telegram ist `streaming.mode: "off"` final-only: allgemeines Fortschrittsgerede wird ebenfalls unterdrückt, statt als eigenständige Statusnachrichten zugestellt zu werden, während Genehmigungsaufforderungen, Medien-Nutzlasten und Fehler weiterhin normal geroutet werden.
- Um Vorschau-Streaming beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie `streaming.preview.toolProgress` für diesen Kanal auf `false`. Um Vorschaubearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.
- Ausgewählte Telegram-Zitatantworten sind eine Ausnahme: Wenn `replyToMode` nicht `"off"` ist und ausgewählter Zitattext vorhanden ist, überspringt OpenClaw den Antwortvorschau-Stream für diesen Turn, sodass Tool-Fortschritts-Vorschauzeilen nicht gerendert werden können. Aktuelle-Nachricht-Antworten ohne ausgewählten Zitattext behalten weiterhin Vorschau-Streaming bei. Details finden Sie in der [Telegram-Kanaldokumentation](/de/channels/telegram).

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

- [Fortschrittsentwürfe](/de/concepts/progress-drafts) — sichtbare Nachrichten zum Bearbeitungsfortschritt, die während langer Durchläufe aktualisiert werden
- [Nachrichten](/de/concepts/messages) — Nachrichtenlebenszyklus und Zustellung
- [Erneuter Versuch](/de/concepts/retry) — Verhalten bei erneuten Zustellversuchen nach Zustellungsfehlern
- [Kanäle](/de/channels) — Streaming-Unterstützung pro Kanal
