---
read_when:
    - Erklären, wie Streaming oder Chunking in Kanälen funktioniert
    - Block-Streaming- oder Kanal-Chunking-Verhalten ändern
    - Doppelte oder verfrühte Blockantworten oder Channel-Vorschaustreaming debuggen
summary: Streaming- und Chunking-Verhalten (Blockantworten, Channel-Vorschau-Streaming, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-07-01T05:34:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2724c21414dd470780f0c7f634380bef3feeb54a08bd0da3e944173340df1c80
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw hat zwei separate Streaming-Ebenen:

- **Block-Streaming (Kanäle):** gibt abgeschlossene **Blöcke** aus, während der Assistent schreibt. Das sind normale Kanalnachrichten (keine Token-Deltas).
- **Vorschau-Streaming (Telegram/Discord/Slack):** aktualisiert während der Generierung eine temporäre **Vorschaunachricht**.

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
- `chunker`: `EmbeddedBlockChunker`, der Min-/Max-Grenzen + Umbruchpräferenz anwendet.
- `channel send`: tatsächlich ausgehende Nachrichten (Blockantworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standardmäßig aus).
- Kanalüberschreibungen: `*.blockStreaming` (und Varianten pro Konto), um pro Kanal `"on"`/`"off"` zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen).
- Harte Kanalobergrenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Kanal-Chunk-Modus: `*.chunkMode` (`length` als Standard, `newline` teilt vor dem Längen-Chunking an Leerzeilen (Absatzgrenzen)).
- Weiche Discord-Obergrenze: `channels.discord.maxLinesPerMessage` (Standard 17) teilt hohe Antworten, um Abschneiden in der UI zu vermeiden.

**Grenzsemantik:**

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` flushen.
- `message_end`: warten, bis die Assistentennachricht fertig ist, dann gepufferte Ausgabe flushen.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

### Medienzustellung mit Block-Streaming

Gestreamte Medien müssen strukturierte Payload-Felder wie `mediaUrl` oder
`mediaUrls` verwenden; gestreamter Text wird nicht als Anhangsbefehl geparst. Wenn
Block-Streaming Medien früh sendet, merkt OpenClaw sich diese Zustellung für den Turn. Wenn
der finale Assistenten-Payload dieselbe Medien-URL wiederholt, entfernt die finale Zustellung
das doppelte Medium, statt den Anhang erneut zu senden.

Exakt doppelte finale Payloads werden unterdrückt. Wenn der finale Payload
eigenständigen Text um Medien herum ergänzt, die bereits gestreamt wurden, sendet OpenClaw weiterhin den
neuen Text, während das Medium nur einmal zugestellt wird. Das verhindert doppelte Sprachnachrichten
oder Dateien auf Kanälen wie Telegram.

## Chunking-Algorithmus (untere/obere Grenzen)

Block-Chunking wird von `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** nicht ausgeben, bis der Puffer >= `minChars` ist (außer erzwungen).
- **Obere Grenze:** Splits vor `maxChars` bevorzugen; wenn erzwungen, bei `maxChars` splitten.
- **Umbruchpräferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harter Umbruch.
- **Code-Fences:** nie innerhalb von Fences splitten; wenn bei `maxChars` erzwungen, Fence schließen + wieder öffnen, damit Markdown gültig bleibt.

`maxChars` wird auf das `textChunkLimit` des Kanals begrenzt, Sie können also kanalbezogene Obergrenzen nicht überschreiten.

## Zusammenführen (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**,
bevor sie gesendet werden. Das reduziert „Einzeilen-Spam“ und bietet trotzdem
progressive Ausgabe.

- Zusammenführen wartet vor dem Flushen auf **Leerlaufpausen** (`idleMs`).
- Puffer werden durch `maxChars` begrenzt und werden geflusht, wenn sie diese Grenze überschreiten.
- `minChars` verhindert, dass winzige Fragmente gesendet werden, bis genug Text angesammelt ist
  (der finale Flush sendet immer den verbleibenden Text).
- Der Joiner wird aus `blockStreamingChunk.breakPreference` abgeleitet
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Kanalüberschreibungen sind über `*.blockStreamingCoalesce` verfügbar (einschließlich Konfigurationen pro Konto).
- Der Standardwert für `minChars` beim Zusammenführen wird für Signal/Slack/Discord auf 1500 angehoben, sofern nicht überschrieben.

## Menschlich wirkende Pausen zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie zwischen
Blockantworten (nach dem ersten Block) eine **zufällige Pause** hinzufügen. Dadurch wirken Antworten mit mehreren Sprechblasen
natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (pro Agent über `agents.list[].humanDelay` überschreiben).
- Modi: `off` (Standard), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Blockantworten**, nicht für finale Antworten oder Tool-Zusammenfassungen.

## „Chunks streamen oder alles“

Dies entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (währenddessen ausgeben). Nicht-Telegram-Kanäle benötigen außerdem `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal flushen, bei sehr langer Ausgabe möglicherweise mehrere Chunks).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur finale Antwort).

**Kanalhinweis:** Block-Streaming ist **aus, sofern**
`*.blockStreaming` nicht explizit auf `true` gesetzt ist. Kanäle können eine Live-Vorschau streamen
(`channels.<channel>.streaming`), ohne Blockantworten zu verwenden.

Konfigurationshinweis: Die `blockStreaming*`-Standardwerte befinden sich unter
`agents.defaults`, nicht in der Root-Konfiguration.

## Vorschau-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Vorschau-Streaming deaktivieren.
- `partial`: einzelne Vorschau, die durch den neuesten Text ersetzt wird.
- `block`: Vorschau wird in gechunkten/angehängten Schritten aktualisiert.
- `progress`: Fortschritts-/Statusvorschau während der Generierung, finale Antwort bei Abschluss.

`streaming.mode: "block"` ist ein Vorschau-Streaming-Modus für bearbeitungsfähige Kanäle
wie Discord und Telegram. Er aktiviert dort keine Blockzustellung im Kanal.
Verwenden Sie `streaming.block.enabled` oder den alten Kanalschlüssel `blockStreaming`, wenn
Sie normale Blockantworten wünschen. Microsoft Teams ist die Ausnahme: Es hat keinen
Blocktransport für Entwurfsvorschauen, daher wird `streaming.mode: "block"` bei Teams auf Blockzustellung
statt auf natives Partial-/Progress-Streaming abgebildet.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Discord    | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | nativer Fortschrittsstream  |

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet native Slack-Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` (Standard: `true`).
- Natives Slack-Streaming und Slack-Assistenten-Threadstatus erfordern ein Antwort-Thread-Ziel. Top-Level-DMs zeigen diese threadartige Vorschau nicht an, können aber weiterhin Slack-Entwurfsvorschau-Posts und Bearbeitungen verwenden.

Migration alter Schlüssel:

- Telegram: alte `streamMode`- und skalare/boolesche `streaming`-Werte werden von Doctor-/Konfigurationskompatibilitätspfaden erkannt und zu `streaming.mode` migriert.
- Discord: `streamMode` + boolesches `streaming` bleiben Laufzeit-Aliasse für das `streaming`-Enum; führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration umzuschreiben.
- Slack: `streamMode` bleibt ein Laufzeit-Alias für `streaming.mode`; boolesches `streaming` bleibt ein Laufzeit-Alias für `streaming.mode` plus `streaming.nativeTransport`; das alte `nativeStreaming` bleibt ein Laufzeit-Alias für `streaming.nativeTransport`. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration umzuschreiben.

### Laufzeitverhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText`-Vorschauaktualisierungen über DMs und Gruppen/Themen hinweg.
- Kurze Initialvorschauen werden für die Push-Benachrichtigungs-UX weiterhin entprellt, aber Telegram materialisiert sie jetzt nach einer begrenzten Verzögerung, damit aktive Läufe nicht visuell stumm bleiben.
- Finaler Text bearbeitet die aktive Vorschau an Ort und Stelle; lange finale Antworten verwenden diese Nachricht für den ersten Chunk wieder und senden nur die verbleibenden Chunks.
- Der Modus `block` rotiert die Vorschau bei `streaming.preview.chunk.maxChars` in eine neue Nachricht (Standard 800, begrenzt auf Telegrams Bearbeitungslimit von 4096); andere Modi lassen eine Vorschau auf bis zu 4096 Zeichen wachsen.
- Der Modus `progress` hält Tool-Fortschritt in einem bearbeitbaren Statusentwurf, materialisiert das Statuslabel, wenn Antwort-Streaming aktiv ist, aber noch keine Tool-Zeile verfügbar ist, löscht diesen Entwurf beim Abschluss und sendet die finale Antwort über die normale Zustellung.
- Wenn die finale Bearbeitung fehlschlägt, bevor der abgeschlossene Text bestätigt ist, verwendet OpenClaw die normale finale Zustellung und bereinigt die veraltete Vorschau.
- Vorschau-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Reasoning in eine transiente Vorschau schreiben, die nach der finalen Zustellung gelöscht wird.

Discord:

- Verwendet Senden + Bearbeiten von Vorschaunachrichten.
- Der Modus `block` verwendet Entwurfs-Chunking (`draftChunk`).
- Vorschau-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Finale Medien-, Fehler- und explizite Antwort-Payloads brechen ausstehende Vorschauen ab, ohne einen neuen Entwurf zu flushen, und verwenden dann die normale Zustellung.

Slack:

- `partial` kann natives Slack-Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Entwurfsvorschauen im Append-Stil.
- `progress` verwendet Statusvorschautext, dann die finale Antwort.
- Top-Level-DMs ohne Antwort-Thread verwenden Entwurfsvorschau-Posts und Bearbeitungen statt nativem Slack-Streaming.
- Natives und Entwurfsvorschau-Streaming unterdrücken Blockantworten für diesen Turn, sodass eine Slack-Antwort nur über einen Zustellungspfad gestreamt wird.
- Finale Medien-/Fehler-Payloads und Progress-Finals erstellen keine Wegwerf-Entwurfsnachrichten; nur Text-/Block-Finals, die die Vorschau bearbeiten können, flushen ausstehenden Entwurfstext.

Mattermost:

- Streamt Denken, Tool-Aktivität und partiellen Antworttext in einen einzelnen Entwurfsvorschau-Post, der an Ort und Stelle finalisiert wird, wenn die finale Antwort sicher gesendet werden kann.
- Fällt auf das Senden eines frischen finalen Posts zurück, wenn der Vorschau-Post gelöscht wurde oder zum Finalisierungszeitpunkt anderweitig nicht verfügbar ist.
- Finale Medien-/Fehler-Payloads brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab, statt einen temporären Vorschau-Post zu flushen.

Matrix:

- Entwurfsvorschauen werden an Ort und Stelle finalisiert, wenn der finale Text das Vorschauereignis wiederverwenden kann.
- Reine Medien-, Fehler- und Antwortziel-Konflikt-Finals brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab; eine bereits sichtbare veraltete Vorschau wird redigiert.

### Tool-Fortschrittsvorschau-Aktualisierungen

Vorschau-Streaming kann auch **Tool-Fortschritts**-Aktualisierungen enthalten - kurze Statuszeilen wie „Web durchsuchen“, „Datei lesen“ oder „Tool aufrufen“ -, die in derselben Vorschaunachricht erscheinen, während Tools ausgeführt werden, vor der finalen Antwort. Im Codex-App-Server-Modus verwenden Codex-Präambel-/Kommentarnachrichten denselben Vorschaupfad, sodass kurze Fortschrittsnotizen wie „Ich prüfe ...“ in den bearbeitbaren Entwurf streamen können, ohne Teil der finalen Antwort zu werden. Dadurch bleiben mehrstufige Tool-Turns visuell aktiv, statt zwischen der ersten Denk-Vorschau und der finalen Antwort stumm zu sein.

Lang laufende Tools können typisierten Fortschritt ausgeben, bevor sie zurückkehren. Zum Beispiel
aktiviert `web_fetch` beim Start einen Fünf-Sekunden-Timer: Wenn der Fetch noch
aussteht, kann die Vorschau `Fetching page content...` anzeigen; wenn der Fetch
vorher abgeschlossen oder abgebrochen wird, wird keine Fortschrittszeile ausgegeben. Das spätere finale Tool-
Ergebnis wird weiterhin normal an das Modell geliefert.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen Tool-Fortschritt und Codex-Präambel-Updates standardmäßig in die Live-Vorschau-Bearbeitung, wenn Vorschau-Streaming aktiv ist. Microsoft Teams verwendet in persönlichen Chats seinen nativen Fortschrittsstream.
- Telegram wird seit `v2026.4.22` mit aktivierten Vorschau-Updates für Tool-Fortschritt ausgeliefert; sie aktiviert zu lassen, erhält dieses veröffentlichte Verhalten.
- **Mattermost** bindet Tool-Aktivität bereits in seinen einzelnen Entwurfs-Vorschau-Beitrag ein (siehe oben).
- Bearbeitungen für Tool-Fortschritt folgen dem aktiven Vorschau-Streaming-Modus; sie werden übersprungen, wenn Vorschau-Streaming `off` ist oder wenn Block-Streaming die Nachricht übernommen hat. Auf Telegram ist `streaming.mode: "off"` nur final: generisches Fortschrittsrauschen wird ebenfalls unterdrückt, statt als eigenständige Statusnachrichten zugestellt zu werden, während Genehmigungsaufforderungen, Medien-Payloads und Fehler weiterhin normal geroutet werden.
- Um Vorschau-Streaming beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie `streaming.preview.toolProgress` für diesen Kanal auf `false`. Um Tool-Fortschrittszeilen sichtbar zu lassen, während Befehls-/Ausführungstext ausgeblendet wird, setzen Sie `streaming.preview.commandText` auf `"status"` oder `streaming.progress.commandText` auf `"status"`; der Standardwert ist `"raw"`, um veröffentlichtes Verhalten beizubehalten. Diese Richtlinie wird von Entwurfs-/Fortschrittskanälen gemeinsam genutzt, die den kompakten Fortschritts-Renderer von OpenClaw verwenden, darunter Discord, Matrix, Microsoft Teams, Mattermost, Slack-Entwurfsvorschauen und Telegram. Um Vorschau-Bearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.
- Ausgewählte Zitatantworten in Telegram sind eine Ausnahme: Wenn `replyToMode` nicht `"off"` ist und ausgewählter Zitattext vorhanden ist, überspringt OpenClaw den Antwort-Vorschaustream für diesen Turn, sodass Vorschauzeilen für Tool-Fortschritt nicht gerendert werden können. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten Vorschau-Streaming weiterhin bei. Details finden Sie in der [Telegram-Kanaldokumentation](/de/channels/telegram).

### Commentary-Fortschrittsspur

Über Tool-Fortschritt hinaus kann der kompakte Fortschritts-Renderer eine weitere Spur im Entwurf anzeigen:

- **`streaming.progress.commentary`** — rendert den **commentary** des Modells vor dem Tool (💬) — kurze „Ich prüfe … dann …“-Erzählung — verschachtelt mit Tool-Zeilen im Fortschrittsentwurf.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

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

Verwenden Sie dieselbe Struktur unter einem anderen kompakten Fortschrittskanalschlüssel, zum Beispiel `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` oder Slack-Entwurfsvorschauen. Platzieren Sie für den Fortschrittsentwurfsmodus dieselbe Richtlinie unter `streaming.progress`:

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
- [Fortschrittsentwürfe](/de/concepts/progress-drafts) - sichtbare Work-in-Progress-Nachrichten, die während langer Turns aktualisiert werden
- [Nachrichten](/de/concepts/messages) - Nachrichtenlebenszyklus und Zustellung
- [Wiederholen](/de/concepts/retry) - Wiederholungsverhalten bei Zustellungsfehlern
- [Kanäle](/de/channels) - Streaming-Unterstützung pro Kanal
