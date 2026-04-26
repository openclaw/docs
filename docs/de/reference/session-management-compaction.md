---
read_when:
    - Sie müssen Session-IDs, Transcript-JSONL oder Felder in `sessions.json` debuggen
    - Sie ändern das Verhalten der Auto-Compaction oder fügen Housekeeping vor der Compaction hinzu
    - Sie möchten Memory-Flushes oder stille System-Turns implementieren
summary: 'Detaillierter Überblick: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna von (Auto-)Compaction'
title: Detaillierter Überblick über die Sitzungsverwaltung
x-i18n:
    generated_at: "2026-04-26T11:38:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: f41f1c403f978c22cc2a929629e1811414d1399fa7f9e28c481fcb594d30196f
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Diese Seite erklärt, wie OpenClaw Sitzungen Ende-zu-Ende verwaltet:

- **Session-Routing** (wie eingehende Nachrichten einer `sessionKey` zugeordnet werden)
- **Sitzungsspeicher** (`sessions.json`) und was er nachverfolgt
- **Transkript-Persistenz** (`*.jsonl`) und ihre Struktur
- **Transkript-Hygiene** (providerspezifische Korrekturen vor Ausführungen)
- **Kontextgrenzen** (Kontextfenster vs. nachverfolgte Tokens)
- **Compaction** (manuelle + Auto-Compaction) und wo Arbeiten vor der Compaction eingehängt werden können
- **Stilles Housekeeping** (z. B. Memory-Schreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollen)

Wenn Sie zuerst einen Überblick auf höherer Ebene möchten, beginnen Sie mit:

- [Session management](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [Memory overview](/de/concepts/memory)
- [Memory search](/de/concepts/memory-search)
- [Session pruning](/de/concepts/session-pruning)
- [Transcript hygiene](/de/reference/transcript-hygiene)

---

## Source of truth: das Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum aufgebaut, der den Sitzungszustand verwaltet.

- UIs (macOS-App, Web-Control-UI, TUI) sollten das Gateway nach Sitzungslisten und Token-Zählständen abfragen.
- Im Remote-Modus liegen Sitzungsdateien auf dem Remote-Host; „die lokalen Dateien auf Ihrem Mac zu prüfen“ spiegelt nicht wider, was das Gateway verwendet.

---

## Zwei Persistenzebenen

OpenClaw persistiert Sitzungen in zwei Ebenen:

1. **Sitzungsspeicher (`sessions.json`)**
   - Key/Value-Map: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Verfolgt Sitzungsmetadaten nach (aktuelle Session-ID, letzte Aktivität, Toggles, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Append-only-Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns neu aufzubauen

---

## Speicherorte auf dem Datenträger

Pro Agent, auf dem Gateway-Host:

- Speicher: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sitzungen für Telegram-Themen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Speicherpflege und Datenträgerkontrollen

Die Sitzungs-Persistenz hat automatische Wartungskontrollen (`session.maintenance`) für `sessions.json` und Transkriptartefakte:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Obergrenze für Einträge in `sessions.json` (Standard `500`)
- `rotateBytes`: rotiert `sessions.json`, wenn es zu groß wird (Standard `10mb`)
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: wie `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Reihenfolge der Durchsetzung bei Bereinigung des Datenträgerbudgets (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten oder verwaisten Transkriptartefakte.
2. Wenn das Ziel weiterhin überschritten wird, entfernen Sie die ältesten Sitzungseinträge und ihre Transkriptdateien.
3. Fahren Sie fort, bis die Nutzung bei oder unter `highWaterBytes` liegt.

Im `mode: "warn"` meldet OpenClaw mögliche Entfernungen, verändert aber Speicher/Dateien nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Ausführungslogs

Isolierte Cron-Ausführungen erstellen ebenfalls Sitzungseinträge/Transkripte und haben eigene Aufbewahrungskontrollen:

- `cron.sessionRetention` (Standard `24h`) entfernt alte Sitzungen isolierter Cron-Ausführungen aus dem Sitzungsspeicher (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` kürzen Dateien `~/.openclaw/cron/runs/<jobId>.jsonl` (Standardwerte: `2_000_000` Byte und `2000` Zeilen).

Wenn Cron das Erstellen einer neuen isolierten Ausführungssitzung erzwingt, bereinigt es den vorherigen
Sitzungseintrag `cron:<jobId>`, bevor die neue Zeile geschrieben wird. Es übernimmt sichere
Voreinstellungen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizite
benutzerausgewählte Modell-/Auth-Überschreibungen. Es entfernt umgebenden Gesprächskontext wie
Kanal-/Gruppen-Routing, Sende- oder Warteschlangenrichtlinie, Elevation, Ursprung und ACP-
Laufzeitbindung, damit eine frische isolierte Ausführung keine veraltete Zustell- oder
Laufzeitberechtigung von einer älteren Ausführung übernehmen kann.

---

## Session-Keys (`sessionKey`)

Eine `sessionKey` identifiziert, _in welchem Gesprächs-Bucket_ Sie sich befinden (Routing + Isolation).

Häufige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Session-IDs (`sessionId`)

Jede `sessionKey` verweist auf eine aktuelle `sessionId` (die Transkriptdatei, die das Gespräch fortsetzt).

Faustregeln:

- **Reset** (`/new`, `/reset`) erstellt eine neue `sessionId` für diese `sessionKey`.
- **Täglicher Reset** (standardmäßig 4:00 Uhr Ortszeit auf dem Gateway-Host) erstellt bei der nächsten Nachricht nach der Reset-Grenze eine neue `sessionId`.
- **Ablauf bei Inaktivität** (`session.reset.idleMinutes` oder veraltet `session.idleMinutes`) erstellt eine neue `sessionId`, wenn nach dem Inaktivitätsfenster eine Nachricht eingeht. Wenn täglich + Inaktivität beide konfiguriert sind, gewinnt das zuerst ablaufende Kriterium.
- **Systemereignisse** (Heartbeat, Cron-Wakeups, Exec-Benachrichtigungen, Gateway-Bookkeeping) können die Sitzungszeile verändern, verlängern aber nicht die Aktualität für täglichen Reset/Inaktivitäts-Reset. Beim Reset-Rollover werden eingereihte Hinweise zu Systemereignissen für die vorherige Sitzung verworfen, bevor der frische Prompt aufgebaut wird.
- **Schutz vor Fork des Thread-Parents** (`session.parentForkMaxTokens`, Standard `100000`) überspringt das Forken des Eltern-Transkripts, wenn die Elternsitzung bereits zu groß ist; der neue Thread beginnt frisch. Setzen Sie `0`, um dies zu deaktivieren.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema des Sitzungsspeichers (`sessions.json`)

Der Werttyp des Speichers ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (der Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; die Aktualität des täglichen Resets verwendet diesen Wert. Veraltete Zeilen können ihn aus dem JSONL-Sitzungsheader ableiten.
- `lastInteractionAt`: Zeitstempel der letzten echten Benutzer-/Kanalinteraktion; die Aktualität des Inaktivitäts-Resets verwendet diesen Wert, damit Heartbeat-, Cron- und Exec-Ereignisse Sitzungen nicht am Leben halten. Veraltete Zeilen ohne dieses Feld greifen für die Inaktivitäts-Aktualität auf die wiederhergestellte Sitzungsstartzeit zurück.
- `updatedAt`: Zeitstempel der letzten Mutation der Speicherzeile, verwendet für Auflistung, Pruning und Bookkeeping. Er ist nicht die maßgebliche Quelle für die Aktualität von täglichem Reset/Inaktivitäts-Reset.
- `sessionFile`: optionale explizite Überschreibung des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und Sende-Richtlinien)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Kanalbeschriftung
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (Überschreibung pro Sitzung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best Effort / providerabhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft Auto-Compaction für diesen Session-Key abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel des letzten Memory-Flush vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Zähler, als der der letzte Flush ausgeführt wurde

Der Speicher kann sicher bearbeitet werden, aber das Gateway ist die maßgebliche Instanz: Es kann Einträge während der Ausführung von Sitzungen neu schreiben oder rehydrieren.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` von `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungsheader (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Bemerkenswerte Eintragstypen:

- `message`: Nachrichten von Benutzer/Assistant/Tool-Ergebnis
- `custom_message`: von Erweiterungen injizierte Nachrichten, die _in_ den Modellkontext eingehen (können in der UI verborgen sein)
- `custom`: Erweiterungszustand, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren eines Baumzweigs

OpenClaw „korrigiert“ Transkripte absichtlich **nicht**; das Gateway verwendet `SessionManager`, um sie zu lesen/schreiben.

---

## Kontextfenster vs. nachverfolgte Tokens

Zwei verschiedene Konzepte sind wichtig:

1. **Modell-Kontextfenster**: harte Obergrenze pro Modell (Tokens, die für das Modell sichtbar sind)
2. **Zähler im Sitzungsspeicher**: laufende Statistiken, die in `sessions.json` geschrieben werden (verwendet für /status und Dashboards)

Wenn Sie Grenzwerte abstimmen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann per Konfiguration überschrieben werden).
- `contextTokens` im Speicher ist ein Laufzeit-Schätzwert/Berichtswert; behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen finden Sie unter [/token-use](/de/reference/token-use).

---

## Compaction: was sie ist

Compaction fasst ältere Unterhaltung in einem persistenten `compaction`-Eintrag im Transkript zusammen und belässt aktuelle Nachrichten intakt.

Nach der Compaction sehen zukünftige Turns:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Compaction ist **persistent** (anders als Session-Pruning). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Chunk-Grenzen bei der Compaction und Tool-Paarung

Wenn OpenClaw ein langes Transkript in Compaction-Chunks aufteilt, hält es
Tool-Aufrufe des Assistant mit ihren passenden `toolResult`-Einträgen zusammen.

- Wenn die Aufteilung nach Token-Anteil zwischen einem Tool-Aufruf und seinem Ergebnis landet, verschiebt OpenClaw die Grenze zur Tool-Call-Nachricht des Assistant, anstatt das Paar zu trennen.
- Wenn ein nachfolgender Tool-Result-Block den Chunk sonst über das Ziel hinaus schieben würde, bewahrt OpenClaw diesen ausstehenden Tool-Block und belässt den nicht zusammengefassten Tail intakt.
- Abgebrochene/fehlerhafte Tool-Call-Blöcke halten eine ausstehende Aufteilung nicht offen.

---

## Wann Auto-Compaction stattfindet (Pi-Laufzeit)

Im eingebetteten Pi-Agent wird Auto-Compaction in zwei Fällen ausgelöst:

1. **Overflow-Wiederherstellung**: Das Modell gibt einen Kontext-Overflow-Fehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche providertypische Varianten) → compact → retry.
2. **Threshold-Wartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist der reservierte Puffer für Prompts + die nächste Modellausgabe

Dies sind Semantiken der Pi-Laufzeit (OpenClaw verarbeitet die Ereignisse, aber Pi entscheidet, wann kompaktisiert wird).

---

## Compaction-Einstellungen (`reserveTokens`, `keepRecentTokens`)

Die Compaction-Einstellungen von Pi befinden sich in den Pi-Einstellungen:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw erzwingt außerdem eine Sicherheitsuntergrenze für eingebettete Ausführungen:

- Wenn `compaction.reserveTokens < reserveTokensFloor`, erhöht OpenClaw diesen Wert.
- Die Standarduntergrenze ist `20000` Tokens.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.
- Manuelles `/compact` berücksichtigt ein explizites `agents.defaults.compaction.keepRecentTokens`
  und behält den jüngsten Tail-Cut-Point von Pi bei. Ohne explizites Keep-Budget
  bleibt die manuelle Compaction ein harter Checkpoint, und der neu aufgebaute Kontext beginnt
  mit der neuen Zusammenfassung.

Warum: genügend Puffer für mehrzügiges „Housekeeping“ (wie Memory-Schreibvorgänge) lassen, bevor Compaction unvermeidbar wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen aus `src/agents/pi-embedded-runner.ts`).

---

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` auf der Plugin-API einen Compaction-Provider registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert die Safeguard-Erweiterung die Zusammenfassung an diesen Provider statt an die integrierte Pipeline `summarizeInStages`.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Nicht setzen für die Standard-LLM-Zusammenfassung.
- Das Setzen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Identifikatoren wie der integrierte Pfad.
- Das Safeguard bewahrt nach der Providerausgabe weiterhin den Kontext für jüngste Turns und aufgeteilte Turn-Suffixe.
- Die integrierte Safeguard-Zusammenfassung destilliert frühere Zusammenfassungen zusammen mit neuen Nachrichten erneut, anstatt die vollständige vorherige Zusammenfassung wortwörtlich beizubehalten.
- Der Modus Safeguard aktiviert standardmäßig Audits zur Zusammenfassungsqualität; setzen Sie `qualityGuard.enabled: false`, um das Verhalten „erneut versuchen bei fehlerhafter Ausgabe“ zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw automatisch auf die integrierte LLM-Zusammenfassung zurück.
- Abort-/Timeout-Signale werden erneut ausgelöst (nicht verschluckt), um die Abbruchanforderung des Aufrufers zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Für Benutzer sichtbare Oberflächen

Sie können Compaction und Sitzungsstatus über Folgendes beobachten:

- `/status` (in jeder Chat-Sitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Verbose-Modus: `🧹 Auto-compaction complete` + Compaction-Zähler

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen Benutzer keine Zwischenausgabe sehen sollen.

Konvention:

- Der Assistant beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um „keine Antwort an den Benutzer zustellen“ anzuzeigen.
- OpenClaw entfernt/unterdrückt dies in der Zustellungsschicht.
- Die Unterdrückung des exakten stillen Tokens ist nicht case-sensitive, daher zählen `NO_REPLY` und
  `no_reply` beide, wenn die gesamte Nutzlast nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-/Nichtzustellungs-Turns gedacht; es ist keine Abkürzung für
  normale umsetzbare Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw auch **Draft-/Typing-Streaming**, wenn ein
partieller Chunk mit `NO_REPLY` beginnt, damit stille Operationen keine partielle
Ausgabe mitten im Turn preisgeben.

---

## „Memory-Flush“ vor der Compaction (implementiert)

Ziel: Bevor Auto-Compaction stattfindet, einen stillen agentischen Turn ausführen, der dauerhaften
Status auf die Festplatte schreibt (z. B. `memory/YYYY-MM-DD.md` im Agent-Workspace), damit Compaction
kritischen Kontext nicht löschen kann.

OpenClaw verwendet den Ansatz **Flush vor dem Threshold**:

1. Die Nutzung des Sitzungskontexts überwachen.
2. Wenn sie einen „Soft Threshold“ überschreitet (unterhalb des Compaction-Thresholds von Pi), eine stille
   Direktive „Memory jetzt schreiben“ an den Agenten ausführen.
3. Das exakte stille Token `NO_REPLY` / `no_reply` verwenden, damit Benutzer
   nichts sehen.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen Hinweis auf `NO_REPLY`, um die
  Zustellung zu unterdrücken.
- Der Flush läuft einmal pro Compaction-Zyklus (nachverfolgt in `sessions.json`).
- Der Flush läuft nur für eingebettete Pi-Sitzungen (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungs-Workspace schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Workspace-Dateilayout und Schreibmuster.

Pi stellt in der Erweiterungs-API auch einen Hook `session_before_compact` bereit, aber die
Flush-Logik von OpenClaw liegt heute auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Falscher Session-Key? Beginnen Sie mit [/concepts/session](/de/concepts/session) und prüfen Sie die `sessionKey` in `/status`.
- Abweichung zwischen Speicher und Transkript? Prüfen Sie den Gateway-Host und den Speicherpfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Compaction-Einstellungen (`reserveTokens` zu hoch für das Modellfenster kann frühere Compaction auslösen)
  - Aufblähung durch Tool-Ergebnisse: Session-Pruning aktivieren/abstimmen
- Undichte stille Turns? Prüfen Sie, ob die Antwort mit `NO_REPLY` beginnt (case-insensitive exaktes Token) und ob Sie einen Build verwenden, der den Fix für Streaming-Unterdrückung enthält.

## Verwandt

- [Session management](/de/concepts/session)
- [Session pruning](/de/concepts/session-pruning)
- [Context engine](/de/concepts/context-engine)
