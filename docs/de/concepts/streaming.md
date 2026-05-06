---
read_when:
    - Erklären, wie Streaming oder Chunking in Kanälen funktioniert
    - Block-Streaming- oder Channel-Chunking-Verhalten ändern
    - Fehlersuche bei doppelten/frühen Blockantworten oder beim Kanalvorschau-Streaming
summary: Streaming- und Chunking-Verhalten (Blockantworten, Streaming der Kanalvorschau, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-05-06T17:55:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e43dc87211e764f9721c4e6c0aa69088441344e1f7c34084fd711a780a852a17
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw hat zwei getrennte Streaming-Ebenen:

- **Block-Streaming (Kanäle):** gibt abgeschlossene **Blöcke** aus, während der Assistent schreibt. Das sind normale Kanalnachrichten (keine Token-Deltas).
- **Preview-Streaming (Telegram/Discord/Slack):** aktualisiert während der Generierung eine temporäre **Preview-Nachricht**.

Derzeit gibt es **kein echtes Token-Delta-Streaming** zu Kanalnachrichten. Preview-Streaming ist nachrichtenbasiert (Senden + Bearbeitungen/Anhänge).

## Block-Streaming (Kanalnachrichten)

Block-Streaming sendet Assistentenausgaben in groben Chunks, sobald sie verfügbar werden.

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
- `chunker`: `EmbeddedBlockChunker`, der Min-/Max-Grenzen + Break-Präferenz anwendet.
- `channel send`: tatsächliche ausgehende Nachrichten (Block-Antworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standardmäßig aus).
- Kanal-Overrides: `*.blockStreaming` (und Varianten pro Konto), um pro Kanal `"on"`/`"off"` zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen).
- Harte Kanalobergrenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Kanal-Chunk-Modus: `*.chunkMode` (standardmäßig `length`, `newline` teilt vor dem Chunking nach Länge an Leerzeilen (Absatzgrenzen)).
- Weiche Discord-Obergrenze: `channels.discord.maxLinesPerMessage` (Standard 17) teilt hohe Antworten, um UI-Abschneiden zu vermeiden.

**Grenzsemantik:**

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` flushen.
- `message_end`: warten, bis die Assistentennachricht fertig ist, dann die gepufferte Ausgabe flushen.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

### Medienzustellung mit Block-Streaming

`MEDIA:`-Direktiven sind normale Zustellungsmetadaten. Wenn Block-Streaming einen Medienblock früh sendet, merkt sich OpenClaw diese Zustellung für den Turn. Wenn die finale Assistenten-Payload dieselbe Medien-URL wiederholt, entfernt die finale Zustellung das doppelte Medium, statt den Anhang erneut zu senden.

Exakt doppelte finale Payloads werden unterdrückt. Wenn die finale Payload eigenen Text um Medien hinzufügt, die bereits gestreamt wurden, sendet OpenClaw den neuen Text dennoch und hält das Medium bei einmaliger Zustellung. Das verhindert doppelte Sprachnachrichten oder Dateien in Kanälen wie Telegram, wenn ein Agent während des Streamings `MEDIA:` ausgibt und der Provider es auch in der abgeschlossenen Antwort enthält.

## Chunking-Algorithmus (untere/obere Grenzen)

Block-Chunking wird durch `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** nicht ausgeben, bis der Puffer >= `minChars` ist (außer bei erzwungener Ausgabe).
- **Obere Grenze:** Splits vor `maxChars` bevorzugen; bei erzwungener Ausgabe bei `maxChars` splitten.
- **Break-Präferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harter Break.
- **Code-Fences:** niemals innerhalb von Fences splitten; bei erzwungener Ausgabe bei `maxChars` den Fence schließen + wieder öffnen, damit Markdown gültig bleibt.

`maxChars` wird auf das `textChunkLimit` des Kanals begrenzt, sodass Sie kanalbezogene Obergrenzen nicht überschreiten können.

## Coalescing (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**, bevor sie gesendet werden. Das reduziert „Einzeilen-Spam“ und liefert trotzdem fortlaufende Ausgabe.

- Coalescing wartet auf **Idle-Lücken** (`idleMs`), bevor geflusht wird.
- Puffer werden durch `maxChars` begrenzt und geflusht, wenn sie diese Grenze überschreiten.
- `minChars` verhindert, dass winzige Fragmente gesendet werden, bis genug Text angesammelt wurde (der finale Flush sendet immer den verbleibenden Text).
- Der Joiner wird aus `blockStreamingChunk.breakPreference` abgeleitet (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Kanal-Overrides sind über `*.blockStreamingCoalesce` verfügbar (einschließlich Konfigurationen pro Konto).
- Der Standardwert für Coalesce-`minChars` wird für Signal/Slack/Discord auf 1500 angehoben, sofern er nicht überschrieben wird.

## Menschlich wirkende Pausen zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie zwischen Block-Antworten (nach dem ersten Block) eine **randomisierte Pause** hinzufügen. Dadurch wirken Antworten mit mehreren Sprechblasen natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (pro Agent über `agents.list[].humanDelay` überschreibbar).
- Modi: `off` (Standard), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Block-Antworten**, nicht für finale Antworten oder Tool-Zusammenfassungen.

## „Chunks streamen oder alles“

Das entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (während der Erstellung ausgeben). Nicht-Telegram-Kanäle benötigen außerdem `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal flushen, bei sehr langen Inhalten möglicherweise mehrere Chunks).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur finale Antwort).

**Kanalhinweis:** Block-Streaming ist **aus, sofern**
`*.blockStreaming` nicht explizit auf `true` gesetzt ist. Kanäle können eine Live-Preview streamen (`channels.<channel>.streaming`), ohne Block-Antworten zu senden.

Konfigurationshinweis: Die `blockStreaming*`-Defaults liegen unter `agents.defaults`, nicht in der Root-Konfiguration.

## Preview-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Preview-Streaming deaktivieren.
- `partial`: einzelne Preview, die durch den neuesten Text ersetzt wird.
- `block`: Preview wird in gechunkten/angehängten Schritten aktualisiert.
- `progress`: Fortschritts-/Status-Preview während der Generierung, finale Antwort nach Abschluss.

`streaming.mode: "block"` ist ein Preview-Streaming-Modus für bearbeitungsfähige Kanäle wie Discord und Telegram. Er aktiviert dort keine Block-Zustellung im Kanal. Verwenden Sie `streaming.block.enabled` oder den Legacy-Kanalschlüssel `blockStreaming`, wenn Sie normale Block-Antworten wünschen. Microsoft Teams ist die Ausnahme: Es hat keinen Draft-Preview-Block-Transport, daher wird `streaming.mode: "block"` auf Teams-Block-Zustellung statt auf natives Partial-/Progress-Streaming abgebildet.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`                 |
| ---------- | ----- | --------- | ------- | -------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bearbeitbarer Fortschritts-Draft |
| Discord    | ✅    | ✅        | ✅      | bearbeitbarer Fortschritts-Draft |
| Slack      | ✅    | ✅        | ✅      | ✅                         |
| Mattermost | ✅    | ✅        | ✅      | ✅                         |
| MS Teams   | ✅    | ✅        | ✅      | nativer Fortschritts-Stream |

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet Slack-native Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` (Standard: `true`).
- Slack-natives Streaming und Slack-Assistenten-Threadstatus benötigen ein Antwort-Thread-Ziel. Top-Level-DMs zeigen diese Preview im Thread-Stil nicht an, können aber weiterhin Slack-Draft-Preview-Beiträge und Bearbeitungen verwenden.

Migration von Legacy-Schlüsseln:

- Telegram: Legacy-`streamMode` und skalare/boolesche `streaming`-Werte werden erkannt und über Doctor-/Konfigurationskompatibilitätspfade zu `streaming.mode` migriert.
- Discord: `streamMode` + boolesches `streaming` bleiben Runtime-Aliasse für das `streaming`-Enum; führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration umzuschreiben.
- Slack: `streamMode` bleibt ein Runtime-Alias für `streaming.mode`; boolesches `streaming` bleibt ein Runtime-Alias für `streaming.mode` plus `streaming.nativeTransport`; Legacy-`nativeStreaming` bleibt ein Runtime-Alias für `streaming.nativeTransport`. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration umzuschreiben.

### Runtime-Verhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText` für Preview-Aktualisierungen in DMs und Gruppen/Themen.
- Finaler Text bearbeitet die aktive Preview direkt; lange finale Antworten verwenden diese Nachricht für den ersten Chunk wieder und senden nur die verbleibenden Chunks.
- Der Modus `progress` hält Tool-Fortschritt in einem bearbeitbaren Status-Draft, löscht diesen Draft bei Abschluss und sendet die finale Antwort über normale Zustellung.
- Wenn die finale Bearbeitung fehlschlägt, bevor der abgeschlossene Text bestätigt wurde, verwendet OpenClaw normale finale Zustellung und bereinigt die veraltete Preview.
- Preview-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Reasoning in eine transiente Preview schreiben, die nach der finalen Zustellung gelöscht wird.

Discord:

- Verwendet Senden + Bearbeiten von Preview-Nachrichten.
- Der Modus `block` verwendet Draft-Chunking (`draftChunk`).
- Preview-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Finale Medien-, Fehler- und Explicit-Reply-Payloads brechen ausstehende Previews ab, ohne einen neuen Draft zu flushen, und verwenden dann normale Zustellung.

Slack:

- `partial` kann Slack-natives Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Draft-Previews im Append-Stil.
- `progress` verwendet Status-Preview-Text und danach die finale Antwort.
- Top-Level-DMs ohne Antwort-Thread verwenden Draft-Preview-Beiträge und Bearbeitungen statt Slack-nativem Streaming.
- Native und Draft-Preview-Streaming unterdrücken Block-Antworten für diesen Turn, sodass eine Slack-Antwort nur über einen Zustellpfad gestreamt wird.
- Finale Medien-/Fehler-Payloads und Progress-Finals erstellen keine wegwerfbaren Draft-Nachrichten; nur Text-/Block-Finals, die die Preview bearbeiten können, flushen ausstehenden Draft-Text.

Mattermost:

- Streamt Thinking, Tool-Aktivität und partiellen Antworttext in einen einzelnen Draft-Preview-Beitrag, der direkt finalisiert wird, wenn die finale Antwort sicher gesendet werden kann.
- Fällt auf das Senden eines neuen finalen Beitrags zurück, wenn der Preview-Beitrag gelöscht wurde oder zum Finalisierungszeitpunkt anderweitig nicht verfügbar ist.
- Finale Medien-/Fehler-Payloads brechen ausstehende Preview-Aktualisierungen vor der normalen Zustellung ab, statt einen temporären Preview-Beitrag zu flushen.

Matrix:

- Draft-Previews werden direkt finalisiert, wenn der finale Text das Preview-Event wiederverwenden kann.
- Nur-Medien-, Fehler- und Reply-Target-Mismatch-Finals brechen ausstehende Preview-Aktualisierungen vor der normalen Zustellung ab; eine bereits sichtbare veraltete Preview wird redigiert.

### Tool-Fortschritts-Preview-Aktualisierungen

Preview-Streaming kann auch **Tool-Fortschritts**-Aktualisierungen enthalten - kurze Statuszeilen wie „Web wird durchsucht“, „Datei wird gelesen“ oder „Tool wird aufgerufen“ -, die während laufender Tools vor der finalen Antwort in derselben Preview-Nachricht erscheinen. Dadurch bleiben mehrstufige Tool-Turns visuell aktiv, statt zwischen der ersten Thinking-Preview und der finalen Antwort stumm zu bleiben.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen Tool-Fortschritt standardmäßig in die Live-Vorschau-Bearbeitung, wenn Vorschau-Streaming aktiv ist. Microsoft Teams verwendet in persönlichen Chats seinen nativen Fortschrittsstream.
- Telegram wird seit `v2026.4.22` mit aktivierten Tool-Fortschrittsaktualisierungen in der Vorschau ausgeliefert; wenn sie aktiviert bleiben, bleibt dieses veröffentlichte Verhalten erhalten.
- **Mattermost** bindet Tool-Aktivitäten bereits in seinen einzelnen Entwurfsvorschau-Beitrag ein (siehe oben).
- Tool-Fortschrittsbearbeitungen folgen dem aktiven Vorschau-Streamingmodus; sie werden übersprungen, wenn Vorschau-Streaming `off` ist oder wenn Block-Streaming die Nachricht übernommen hat. Bei Telegram ist `streaming.mode: "off"` nur final: Allgemeines Fortschrittsrauschen wird ebenfalls unterdrückt, statt als eigenständige Statusmeldungen zugestellt zu werden, während Genehmigungsaufforderungen, Medien-Payloads und Fehler weiterhin normal weitergeleitet werden.
- Um Vorschau-Streaming beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie `streaming.preview.toolProgress` für diesen Kanal auf `false`. Um Tool-Fortschrittszeilen sichtbar zu lassen und gleichzeitig Befehls-/Ausführungstext auszublenden, setzen Sie `streaming.preview.commandText` auf `"status"` oder `streaming.progress.commandText` auf `"status"`; der Standardwert ist `"raw"`, um das veröffentlichte Verhalten beizubehalten. Diese Richtlinie wird von Entwurfs-/Fortschrittskanälen gemeinsam genutzt, die OpenClaws kompakten Fortschrittsrenderer verwenden, darunter Discord, Matrix, Microsoft Teams, Mattermost, Slack-Entwurfsvorschauen und Telegram. Um Vorschau-Bearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.
- Ausgewählte Zitatantworten in Telegram sind eine Ausnahme: Wenn `replyToMode` nicht `"off"` ist und ausgewählter Zitattext vorhanden ist, überspringt OpenClaw den Antwort-Vorschaustream für diesen Durchlauf, sodass Tool-Fortschrittszeilen in der Vorschau nicht gerendert werden können. Antworten auf aktuelle Nachrichten ohne ausgewählten Zitattext behalten Vorschau-Streaming weiterhin bei. Details finden Sie in der [Telegram-Kanaldokumentation](/de/channels/telegram).

Fortschrittszeilen sichtbar lassen, aber rohen Befehls-/Ausführungstext ausblenden:

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

## Verwandt

- [Refaktorierung des Nachrichtenlebenszyklus](/de/concepts/message-lifecycle-refactor) - Zielentwurf für gemeinsame Vorschau, Bearbeitung, Stream und Finalisierung
- [Fortschrittsentwürfe](/de/concepts/progress-drafts) - sichtbare Nachrichten zu laufenden Arbeiten, die während langer Durchläufe aktualisiert werden
- [Nachrichten](/de/concepts/messages) - Nachrichtenlebenszyklus und Zustellung
- [Wiederholung](/de/concepts/retry) - Wiederholungsverhalten bei Zustellungsfehlern
- [Kanäle](/de/channels) - Streaming-Unterstützung je Kanal
