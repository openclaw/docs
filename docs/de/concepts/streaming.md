---
read_when:
    - Erklären, wie Streaming oder Chunking in Kanälen funktioniert
    - Ändern des Block-Streamings oder des Channel-Chunking-Verhaltens
    - Debugging doppelter/verfrühter Block-Antworten oder Kanalvorschau-Streaming
summary: Streaming- und Chunking-Verhalten (Blockantworten, Kanalvorschau-Streaming, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-06-27T17:26:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw hat zwei getrennte Streaming-Ebenen:

- **Block-Streaming (Kanäle):** gibt abgeschlossene **Blöcke** aus, während der Assistant schreibt. Das sind normale Kanalnachrichten (keine Token-Deltas).
- **Vorschau-Streaming (Telegram/Discord/Slack):** aktualisiert während der Generierung eine temporäre **Vorschaunachricht**.

Heute gibt es **kein echtes Token-Delta-Streaming** für Kanalnachrichten. Vorschau-Streaming ist nachrichtenbasiert (Senden + Bearbeitungen/Anhänge).

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
- `chunker`: `EmbeddedBlockChunker`, der Mindest-/Höchstgrenzen + Umbruchpräferenz anwendet.
- `channel send`: tatsächliche ausgehende Nachrichten (Blockantworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standardmäßig aus).
- Kanal-Overrides: `*.blockStreaming` (und Varianten pro Konto), um `"on"`/`"off"` pro Kanal zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen).
- Harte Kanalgrenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Kanal-Chunk-Modus: `*.chunkMode` (`length` als Standard, `newline` teilt vor dem längenbasierten Chunking an Leerzeilen (Absatzgrenzen)).
- Discord-Soft-Limit: `channels.discord.maxLinesPerMessage` (Standard 17) teilt hohe Antworten auf, um UI-Clipping zu vermeiden.

**Grenzsemantik:**

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` leeren.
- `message_end`: warten, bis die Assistant-Nachricht abgeschlossen ist, dann gepufferte Ausgabe leeren.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

### Medienzustellung mit Block-Streaming

Gestreamte Medien müssen strukturierte Payload-Felder wie `mediaUrl` oder
`mediaUrls` verwenden; gestreamter Text wird nicht als Anhangsbefehl geparst. Wenn Block-
Streaming Medien früh sendet, merkt sich OpenClaw diese Zustellung für den Turn. Wenn
die finale Assistant-Payload dieselbe Medien-URL wiederholt, entfernt die finale Zustellung
das doppelte Medium, statt den Anhang erneut zu senden.

Exakt doppelte finale Payloads werden unterdrückt. Wenn die finale Payload
eigenständigen Text um bereits gestreamte Medien ergänzt, sendet OpenClaw weiterhin den
neuen Text, hält die Medienzustellung aber einmalig. Das verhindert doppelte Sprachnachrichten
oder Dateien in Kanälen wie Telegram.

## Chunking-Algorithmus (niedrige/hohe Grenzen)

Block-Chunking wird von `EmbeddedBlockChunker` implementiert:

- **Niedrige Grenze:** nicht ausgeben, bevor der Puffer >= `minChars` ist (außer erzwungen).
- **Hohe Grenze:** Splits vor `maxChars` bevorzugen; wenn erzwungen, bei `maxChars` teilen.
- **Umbruchpräferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harter Umbruch.
- **Code-Fences:** niemals innerhalb von Fences teilen; wenn bei `maxChars` erzwungen, den Fence schließen + erneut öffnen, damit Markdown gültig bleibt.

`maxChars` wird auf das Kanal-`textChunkLimit` begrenzt, sodass Sie kanalbezogene Grenzen nicht überschreiten können.

## Zusammenführen (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**,
bevor sie gesendet werden. Das reduziert „Einzeilen-Spam“, liefert aber weiterhin
progressive Ausgabe.

- Zusammenführen wartet vor dem Leeren auf **Leerlaufpausen** (`idleMs`).
- Puffer sind durch `maxChars` begrenzt und werden geleert, wenn sie diese Grenze überschreiten.
- `minChars` verhindert, dass winzige Fragmente gesendet werden, bevor genug Text zusammengekommen ist
  (abschließendes Leeren sendet immer den verbleibenden Text).
- Der Joiner wird aus `blockStreamingChunk.breakPreference` abgeleitet
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Kanal-Overrides sind über `*.blockStreamingCoalesce` verfügbar (einschließlich Konfigurationen pro Konto).
- Der Standardwert für Coalesce-`minChars` wird für Signal/Slack/Discord auf 1500 erhöht, sofern er nicht überschrieben wird.

## Menschlich wirkendes Timing zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie zwischen
Blockantworten (nach dem ersten Block) eine **zufällige Pause** hinzufügen. Dadurch wirken Antworten mit mehreren Sprechblasen
natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (pro Agent über `agents.list[].humanDelay` überschreiben).
- Modi: `off` (Standard), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Blockantworten**, nicht für finale Antworten oder Tool-Zusammenfassungen.

## „Chunks streamen oder alles“

Das entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (während der Ausgabe senden). Nicht-Telegram-Kanäle benötigen außerdem `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal leeren, bei sehr langer Ausgabe möglicherweise in mehreren Chunks).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur finale Antwort).

**Kanalhinweis:** Block-Streaming ist **aus, sofern**
`*.blockStreaming` nicht explizit auf `true` gesetzt ist. Kanäle können eine Live-Vorschau streamen
(`channels.<channel>.streaming`), ohne Blockantworten zu senden.

Hinweis zum Konfigurationsort: Die `blockStreaming*`-Standardwerte liegen unter
`agents.defaults`, nicht in der Root-Konfiguration.

## Vorschau-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Vorschau-Streaming deaktivieren.
- `partial`: einzelne Vorschau, die durch den neuesten Text ersetzt wird.
- `block`: Vorschau wird in gechunkten/angehängten Schritten aktualisiert.
- `progress`: Fortschritts-/Statusvorschau während der Generierung, finale Antwort bei Abschluss.

`streaming.mode: "block"` ist ein Vorschau-Streaming-Modus für Kanäle mit Bearbeitungsfunktion
wie Discord und Telegram. Er aktiviert dort keine Blockzustellung im Kanal.
Verwenden Sie `streaming.block.enabled` oder den Legacy-Kanalschlüssel `blockStreaming`, wenn
Sie normale Blockantworten wünschen. Microsoft Teams ist die Ausnahme: Es hat keinen
Blocktransport für Entwurfs-Vorschauen, daher wird `streaming.mode: "block"` auf Teams-Blockzustellung
statt auf natives Partial-/Fortschritts-Streaming abgebildet.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`                  |
| ---------- | ----- | --------- | ------- | --------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Discord    | ✅    | ✅        | ✅      | bearbeitbarer Fortschrittsentwurf |
| Slack      | ✅    | ✅        | ✅      | ✅                          |
| Mattermost | ✅    | ✅        | ✅      | ✅                          |
| MS Teams   | ✅    | ✅        | ✅      | nativer Fortschrittsstream  |

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet Slack-native Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` (Standard: `true`).
- Slack-natives Streaming und der Thread-Status des Slack-Assistant erfordern ein Antwort-Thread-Ziel. Top-Level-DMs zeigen diese Thread-artige Vorschau nicht, können aber weiterhin Slack-Entwurfs-Vorschauposts und Bearbeitungen verwenden.

Migration von Legacy-Schlüsseln:

- Telegram: Legacy-`streamMode` und skalare/boolesche `streaming`-Werte werden erkannt und durch Doctor-/Konfigurationskompatibilitätspfade zu `streaming.mode` migriert.
- Discord: `streamMode` + boolesches `streaming` bleiben Runtime-Aliasse für das `streaming`-Enum; führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration neu zu schreiben.
- Slack: `streamMode` bleibt ein Runtime-Alias für `streaming.mode`; boolesches `streaming` bleibt ein Runtime-Alias für `streaming.mode` plus `streaming.nativeTransport`; Legacy-`nativeStreaming` bleibt ein Runtime-Alias für `streaming.nativeTransport`. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration neu zu schreiben.

### Runtime-Verhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText`-Vorschauaktualisierungen über DMs und Gruppen/Themen hinweg.
- Kurze initiale Vorschauen werden für die Push-Benachrichtigungs-UX weiterhin entprellt, aber Telegram materialisiert sie jetzt nach einer begrenzten Verzögerung, damit aktive Läufe nicht visuell stumm bleiben.
- Finaler Text bearbeitet die aktive Vorschau direkt; lange finale Antworten verwenden diese Nachricht für den ersten Chunk wieder und senden nur die verbleibenden Chunks.
- Der `block`-Modus rotiert die Vorschau bei `streaming.preview.chunk.maxChars` in eine neue Nachricht (Standard 800, begrenzt durch Telegrams Bearbeitungslimit von 4096); andere Modi lassen eine Vorschau bis auf 4096 Zeichen anwachsen.
- Der `progress`-Modus hält Tool-Fortschritt in einem bearbeitbaren Statusentwurf, materialisiert das Statuslabel, wenn Antwort-Streaming aktiv ist, aber noch keine Tool-Zeile verfügbar ist, löscht diesen Entwurf bei Abschluss und sendet die finale Antwort über die normale Zustellung.
- Wenn die finale Bearbeitung fehlschlägt, bevor der abgeschlossene Text bestätigt ist, verwendet OpenClaw die normale finale Zustellung und bereinigt die veraltete Vorschau.
- Vorschau-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Reasoning in eine flüchtige Vorschau schreiben, die nach der finalen Zustellung gelöscht wird.

Discord:

- Verwendet Senden + Bearbeiten von Vorschaunachrichten.
- Der `block`-Modus verwendet Entwurfs-Chunking (`draftChunk`).
- Vorschau-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Finale Medien-, Fehler- und explizite Antwort-Payloads brechen ausstehende Vorschauen ab, ohne einen neuen Entwurf zu leeren, und verwenden dann die normale Zustellung.

Slack:

- `partial` kann Slack-natives Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Entwurfs-Vorschauen im Append-Stil.
- `progress` verwendet Statusvorschautext, dann die finale Antwort.
- Top-Level-DMs ohne Antwort-Thread verwenden Entwurfs-Vorschauposts und Bearbeitungen statt Slack-nativem Streaming.
- Natives und Entwurfs-Vorschau-Streaming unterdrücken Blockantworten für diesen Turn, sodass eine Slack-Antwort nur über einen Zustellungspfad gestreamt wird.
- Finale Medien-/Fehler-Payloads und Fortschrittsfinals erzeugen keine Wegwerf-Entwurfsnachrichten; nur Text-/Block-Finals, die die Vorschau bearbeiten können, leeren ausstehenden Entwurfstext.

Mattermost:

- Streamt Denken, Tool-Aktivität und partiellen Antworttext in einen einzelnen Entwurfs-Vorschaupost, der direkt finalisiert wird, wenn die finale Antwort sicher gesendet werden kann.
- Fällt auf das Senden eines neuen finalen Posts zurück, wenn der Vorschaupost gelöscht wurde oder zum Finalisierungszeitpunkt anderweitig nicht verfügbar ist.
- Finale Medien-/Fehler-Payloads brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab, statt einen temporären Vorschaupost zu leeren.

Matrix:

- Entwurfs-Vorschauen werden direkt finalisiert, wenn der finale Text das Vorschauereignis wiederverwenden kann.
- Nur-Medien-, Fehler- und Antwortziel-Mismatch-Finals brechen ausstehende Vorschauaktualisierungen vor der normalen Zustellung ab; eine bereits sichtbare veraltete Vorschau wird redigiert.

### Tool-Fortschritts-Vorschauaktualisierungen

Vorschau-Streaming kann auch **Tool-Fortschritts**-Aktualisierungen enthalten - kurze Statuszeilen wie „Durchsuche das Web“, „Lese Datei“ oder „Rufe Tool auf“ -, die in derselben Vorschaunachricht erscheinen, während Tools laufen, noch vor der finalen Antwort. Im Codex-App-Server-Modus verwenden Codex-Präambel-/Kommentar-Nachrichten denselben Vorschaupfad, sodass kurze Fortschrittsnotizen wie „Ich prüfe ...“ in den bearbeitbaren Entwurf gestreamt werden können, ohne Teil der finalen Antwort zu werden. Dadurch bleiben mehrstufige Tool-Turns visuell aktiv statt zwischen erster Denk-Vorschau und finaler Antwort stumm.

Lang laufende Tools können typisierten Fortschritt ausgeben, bevor sie zurückkehren. Zum Beispiel
setzt `web_fetch` beim Start einen Fünf-Sekunden-Timer: Wenn der Abruf noch
aussteht, kann die Vorschau `Fetching page content...` anzeigen; wenn der Abruf vorher abgeschlossen
oder abgebrochen wird, wird keine Fortschrittszeile ausgegeben. Das spätere finale Tool-
Ergebnis wird weiterhin normal an das Modell geliefert.

Unterstützte Oberflächen:

- **Discord**, **Slack**, **Telegram** und **Matrix** streamen Tool-Fortschritt und Codex-Präambel-Updates standardmäßig in die Live-Vorschau-Bearbeitung, wenn Vorschau-Streaming aktiv ist. Microsoft Teams verwendet in persönlichen Chats seinen nativen Fortschrittsstream.
- Telegram wird seit `v2026.4.22` mit aktivierten Vorschau-Updates für Tool-Fortschritt ausgeliefert; wenn sie aktiviert bleiben, bleibt dieses veröffentlichte Verhalten erhalten.
- **Mattermost** fasst Tool-Aktivität bereits in seinem einzelnen Entwurfs-Vorschaupost zusammen (siehe oben).
- Bearbeitungen zum Tool-Fortschritt folgen dem aktiven Vorschau-Streaming-Modus; sie werden übersprungen, wenn Vorschau-Streaming `off` ist oder wenn Block-Streaming die Nachricht übernommen hat. Bei Telegram ist `streaming.mode: "off"` nur für Endausgaben: generisches Fortschrittsrauschen wird ebenfalls unterdrückt, statt als eigenständige Statusmeldungen zugestellt zu werden, während Genehmigungsaufforderungen, Medien-Payloads und Fehler weiterhin normal weitergeleitet werden.
- Um Vorschau-Streaming beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie `streaming.preview.toolProgress` für diesen Kanal auf `false`. Um Tool-Fortschrittszeilen sichtbar zu lassen, während Befehls-/Ausführungstext ausgeblendet wird, setzen Sie `streaming.preview.commandText` auf `"status"` oder `streaming.progress.commandText` auf `"status"`; die Standardeinstellung ist `"raw"`, um veröffentlichtes Verhalten beizubehalten. Diese Richtlinie wird von Entwurfs-/Fortschrittskanälen geteilt, die den kompakten Fortschrittsrenderer von OpenClaw verwenden, einschließlich Discord, Matrix, Microsoft Teams, Mattermost, Slack-Entwurfsvorschauen und Telegram. Um Vorschau-Bearbeitungen vollständig zu deaktivieren, setzen Sie `streaming.mode` auf `off`.
- Ausgewählte Telegram-Zitatantworten sind eine Ausnahme: Wenn `replyToMode` nicht `"off"` ist und ausgewählter Zitattext vorhanden ist, überspringt OpenClaw den Antwort-Vorschaustream für diesen Turn, sodass Vorschauzeilen zum Tool-Fortschritt nicht gerendert werden können. Antworten auf aktuelle Nachrichten ohne ausgewählten Zitattext behalten Vorschau-Streaming weiterhin bei. Weitere Details finden Sie in der [Telegram-Kanaldokumentation](/de/channels/telegram).

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

Verwenden Sie dieselbe Struktur unter einem anderen kompakten Fortschrittskanalschlüssel, zum Beispiel `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` oder Slack-Entwurfsvorschauen. Für den Fortschrittsentwurfsmodus legen Sie dieselbe Richtlinie unter `streaming.progress` ab:

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
- [Fortschrittsentwürfe](/de/concepts/progress-drafts) - sichtbare Nachrichten zu laufender Arbeit, die während langer Turns aktualisiert werden
- [Nachrichten](/de/concepts/messages) - Nachrichtenlebenszyklus und Zustellung
- [Wiederholen](/de/concepts/retry) - Wiederholungsverhalten bei Zustellungsfehlern
- [Kanäle](/de/channels) - Streaming-Unterstützung pro Kanal
