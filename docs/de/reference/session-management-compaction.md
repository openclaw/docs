---
read_when:
    - Sie müssen Sitzungs-IDs, Transcript-JSONL oder Felder in `sessions.json` debuggen.
    - Sie ändern das Verhalten der automatischen Compaction oder fügen vorgeschaltete Bereinigung vor der Compaction hinzu.
    - Sie möchten Memory-Flushes oder stille System-Turns implementieren.
summary: 'Tiefgehende Analyse: Sitzungsspeicher + Transkripte, Lebenszyklus und interne Abläufe der (automatischen) Compaction'
title: Tiefgehende Analyse des Sitzungsmanagements
x-i18n:
    generated_at: "2026-04-25T13:56:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Diese Seite erklärt, wie OpenClaw Sitzungen Ende-zu-Ende verwaltet:

- **Sitzungsrouting** (wie eingehende Nachrichten einer `sessionKey` zugeordnet werden)
- **Sitzungsspeicher** (`sessions.json`) und was er erfasst
- **Persistenz von Transkripten** (`*.jsonl`) und ihre Struktur
- **Transkript-Hygiene** (providerspezifische Korrekturen vor Ausführungen)
- **Kontextlimits** (Kontextfenster vs. erfasste Tokens)
- **Compaction** (manuelle + automatische Compaction) und wo vorgeschaltete Arbeiten vor der Compaction eingehängt werden
- **Stille Bereinigung** (z. B. Memory-Schreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollen)

Wenn Sie zunächst eine allgemeinere Übersicht möchten, beginnen Sie mit:

- [Session management](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [Memory overview](/de/concepts/memory)
- [Memory search](/de/concepts/memory-search)
- [Session pruning](/de/concepts/session-pruning)
- [Transcript hygiene](/de/reference/transcript-hygiene)

---

## Quelle der Wahrheit: das Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum aufgebaut, der den Sitzungsstatus besitzt.

- UIs (macOS-App, webbasiertes Control UI, TUI) sollten das Gateway nach Sitzungslisten und Token-Zahlen abfragen.
- Im Remote-Modus liegen die Sitzungsdateien auf dem Remote-Host; ein „Blick in Ihre lokalen Mac-Dateien“ spiegelt nicht wider, was das Gateway tatsächlich verwendet.

---

## Zwei Persistenzebenen

OpenClaw speichert Sitzungen in zwei Ebenen:

1. **Sitzungsspeicher (`sessions.json`)**
   - Key/Value-Zuordnung: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher editierbar (oder Einträge löschbar)
   - Erfasst Sitzungsmetadaten (aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Append-only-Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns wiederherzustellen

---

## Speicherorte auf dem Datenträger

Pro Agent auf dem Gateway-Host:

- Speicher: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Themen-Sitzungen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Speicherwartung und Datenträgerkontrollen

Die Sitzungspersistenz verfügt über automatische Wartungssteuerungen (`session.maintenance`) für `sessions.json` und Transkriptartefakte:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Obergrenze für Einträge in `sessions.json` (Standard `500`)
- `rotateBytes`: rotiert `sessions.json`, wenn sie zu groß ist (Standard `10mb`)
- `resetArchiveRetention`: Aufbewahrung für Transkriptarchive `*.reset.<timestamp>` (Standard: identisch mit `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Durchsetzungsreihenfolge für die Bereinigung beim Datenträgerbudget (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten oder verwaisten Transkriptartefakte.
2. Wenn das Ziel weiterhin überschritten wird, entfernen Sie die ältesten Sitzungseinträge und deren Transkriptdateien.
3. Fahren Sie fort, bis die Nutzung bei oder unter `highWaterBytes` liegt.

Im Modus `mode: "warn"` meldet OpenClaw potenzielle Entfernungen, verändert aber Speicher/Dateien nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Run-Logs

Isolierte Cron-Ausführungen erzeugen ebenfalls Sitzungseinträge/Transkripte, und dafür gibt es eigene Aufbewahrungssteuerungen:

- `cron.sessionRetention` (Standard `24h`) entfernt alte isolierte Sitzungen von Cron-Ausführungen aus dem Sitzungsspeicher (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` beschneiden Dateien unter `~/.openclaw/cron/runs/<jobId>.jsonl` (Standards: `2_000_000` Bytes und `2000` Zeilen).

Wenn Cron das Erstellen einer neuen isolierten Run-Sitzung erzwingt, bereinigt es den vorherigen
Sitzungseintrag `cron:<jobId>`, bevor die neue Zeile geschrieben wird. Sichere
Präferenzen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizite
benutzergewählte Modell-/Auth-Overrides werden übernommen. Umgebenden Gesprächskontext
wie Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Erhöhung, Herkunft und ACP-
Runtime-Bindung verwirft es, damit eine frische isolierte Ausführung keine veraltete Zustellung oder
Runtime-Berechtigung aus einer älteren Ausführung übernehmen kann.

---

## Sitzungsschlüssel (`sessionKey`)

Eine `sessionKey` identifiziert, _in welchem Gesprächs-Bucket_ Sie sich befinden (Routing + Isolation).

Häufige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Sitzungs-IDs (`sessionId`)

Jede `sessionKey` verweist auf eine aktuelle `sessionId` (die Transkriptdatei, die das Gespräch fortsetzt).

Faustregeln:

- **Reset** (`/new`, `/reset`) erzeugt eine neue `sessionId` für diese `sessionKey`.
- **Täglicher Reset** (standardmäßig 4:00 Uhr Ortszeit auf dem Gateway-Host) erzeugt bei der nächsten Nachricht nach der Reset-Grenze eine neue `sessionId`.
- **Leerlaufablauf** (`session.reset.idleMinutes` oder veraltet `session.idleMinutes`) erzeugt eine neue `sessionId`, wenn eine Nachricht nach Ablauf des Leerlauffensters eingeht. Wenn täglich + Leerlauf beide konfiguriert sind, gewinnt jeweils das zuerst ablaufende.
- **Fork-Schutz für Thread-Parent** (`session.parentForkMaxTokens`, Standard `100000`) überspringt das Forken des Parent-Transkripts, wenn die Parent-Sitzung bereits zu groß ist; der neue Thread startet frisch. Setzen Sie `0`, um dies zu deaktivieren.

Implementierungsdetail: Die Entscheidung fällt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema des Sitzungsspeichers (`sessions.json`)

Der Werttyp des Speichers ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `updatedAt`: Zeitstempel der letzten Aktivität
- `sessionFile`: optionales explizites Überschreiben des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und Senderichtlinie)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Kanalbeschriftung
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (Override pro Sitzung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best Effort / providerabhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft die automatische Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel des letzten Memory-Flushs vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Anzahl, bei der der letzte Flush ausgeführt wurde

Der Speicher kann sicher editiert werden, aber das Gateway ist die Autorität: Es kann Einträge neu schreiben oder rehydrieren, während Sitzungen laufen.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` von `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungs-Header (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Bemerkenswerte Eintragstypen:

- `message`: Nutzer-/Assistent-/`toolResult`-Nachrichten
- `custom_message`: von Erweiterungen eingefügte Nachrichten, die _in den Modellkontext eingehen_ (können in der UI verborgen sein)
- `custom`: Erweiterungsstatus, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren in einem Baumzweig

OpenClaw „korrigiert“ Transkripte absichtlich **nicht**; das Gateway verwendet `SessionManager`, um sie zu lesen/zu schreiben.

---

## Kontextfenster vs. erfasste Tokens

Zwei unterschiedliche Konzepte sind wichtig:

1. **Kontextfenster des Modells**: harte Obergrenze pro Modell (Tokens, die für das Modell sichtbar sind)
2. **Zähler im Sitzungsspeicher**: fortlaufende Statistiken, die in `sessions.json` geschrieben werden (für /status und Dashboards verwendet)

Wenn Sie Limits abstimmen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann per Konfiguration überschrieben werden).
- `contextTokens` im Speicher ist ein Laufzeit-Schätzwert/Reporting-Wert; behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen finden Sie unter [/token-use](/de/reference/token-use).

---

## Compaction: was sie ist

Compaction fasst ältere Unterhaltung zu einem persistierten `compaction`-Eintrag im Transkript zusammen und belässt aktuelle Nachrichten intakt.

Nach der Compaction sehen zukünftige Turns:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Compaction ist **persistent** (anders als Session pruning). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Chunk-Grenzen bei der Compaction und Tool-Paarung

Wenn OpenClaw ein langes Transkript in Compaction-Chunks aufteilt, hält es
Tool-Aufrufe des Assistenten mit den zugehörigen `toolResult`-Einträgen zusammen.

- Wenn die nach Token-Anteil gesetzte Trennlinie zwischen einem Tool-Aufruf und seinem Ergebnis landet, verschiebt OpenClaw
  die Grenze zur Assistenten-Nachricht mit dem Tool-Aufruf, statt
  das Paar zu trennen.
- Wenn ein nachfolgender Block mit Tool-Ergebnissen den Chunk sonst über das Ziel hinausschieben würde,
  bewahrt OpenClaw diesen ausstehenden Tool-Block und lässt den nicht zusammengefassten Tail
  intakt.
- Abgebrochene/fehlerhafte Tool-Aufruf-Blöcke halten eine ausstehende Aufteilung nicht offen.

---

## Wann automatische Compaction erfolgt (Pi-Runtime)

Im eingebetteten Pi-Agenten wird automatische Compaction in zwei Fällen ausgelöst:

1. **Overflow-Wiederherstellung**: Das Modell gibt einen Kontext-Overflow-Fehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche providerförmige Varianten) → Compaction → Wiederholung.
2. **Schwellenwert-Wartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist der reservierte Spielraum für Prompts + die nächste Modellausgabe

Dies ist Semantik der Pi-Runtime (OpenClaw verarbeitet die Ereignisse, aber Pi entscheidet, wann kompaktifiziert wird).

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

- Wenn `compaction.reserveTokens < reserveTokensFloor`, erhöht OpenClaw den Wert.
- Die Standarduntergrenze beträgt `20000` Tokens.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.
- Manuelles `/compact` berücksichtigt ein explizites `agents.defaults.compaction.keepRecentTokens`
  und übernimmt Pi's Cut-Point für den aktuellen Tail. Ohne explizites Keep-Budget
  bleibt manuelle Compaction ein harter Checkpoint und der wiederaufgebaute Kontext beginnt
  mit der neuen Zusammenfassung.

Warum: Genügend Spielraum für mehrturnige „Bereinigung“ (wie Memory-Schreibvorgänge) lassen, bevor Compaction unvermeidbar wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen aus `src/agents/pi-embedded-runner.ts`).

---

## Steckbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert die Schutz-Erweiterung die Zusammenfassung an diesen Provider statt an die integrierte Pipeline `summarizeInStages`.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Nicht setzen für die standardmäßige LLM-Zusammenfassung.
- Das Setzen von `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Identifikatoren wie der integrierte Pfad.
- Der Safeguard bewahrt nach der Provider-Ausgabe weiterhin den Kontext des aktuellen Tails mit Recent-Turn und Split-Turn-Suffix.
- Die integrierte Safeguard-Zusammenfassung destilliert frühere Zusammenfassungen zusammen mit neuen Nachrichten erneut,
  statt die vollständige vorherige Zusammenfassung unverändert beizubehalten.
- Der Safeguard-Modus aktiviert standardmäßig Qualitätsprüfungen für Zusammenfassungen; setzen Sie
  `qualityGuard.enabled: false`, um das Verhalten für Wiederholungen bei fehlerhafter Ausgabe zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, greift OpenClaw automatisch auf die integrierte LLM-Zusammenfassung zurück.
- Abort-/Timeout-Signale werden erneut ausgelöst (nicht verschluckt), um die Abbruchanforderung des Aufrufers zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Für Benutzer sichtbare Oberflächen

Sie können Compaction und Sitzungsstatus beobachten über:

- `/status` (in jeder Chat-Sitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Verbose-Modus: `🧹 Auto-compaction complete` + Compaction-Anzahl

---

## Stille Bereinigung (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen der Benutzer keine Zwischenausgabe sehen soll.

Konvention:

- Der Assistent beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um „keine Antwort an den Benutzer ausliefern“ anzuzeigen.
- OpenClaw entfernt/unterdrückt dies in der Zustellungsebene.
- Die Unterdrückung des exakten stillen Tokens ist nicht groß-/kleinschreibungssensitiv, daher zählen `NO_REPLY` und
  `no_reply` beide, wenn die gesamte Payload nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-/Nichtzustellungs-Turns gedacht; es ist keine Abkürzung für
  gewöhnliche umsetzbare Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw auch **Draft-/Typing-Streaming**, wenn ein
partieller Chunk mit `NO_REPLY` beginnt, sodass bei stillen Vorgängen keine partielle
Ausgabe mitten im Turn nach außen dringt.

---

## Vorgeschalteter „Memory-Flush“ vor der Compaction (implementiert)

Ziel: Bevor automatische Compaction erfolgt, einen stillen agentischen Turn ausführen, der dauerhaften
Status auf den Datenträger schreibt (z. B. `memory/YYYY-MM-DD.md` im Workspace des Agenten), damit Compaction keinen
kritischen Kontext löschen kann.

OpenClaw verwendet den Ansatz **Flush vor dem Schwellenwert**:

1. Nutzung des Sitzungskontexts überwachen.
2. Wenn sie einen „weichen Schwellenwert“ überschreitet (unterhalb des Compaction-Schwellenwerts von Pi), einen stillen
   Hinweis „jetzt Memory schreiben“ an den Agenten ausführen.
3. Das exakte stille Token `NO_REPLY` / `no_reply` verwenden, damit der Benutzer
   nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis, um die
  Zustellung zu unterdrücken.
- Der Flush wird einmal pro Compaction-Zyklus ausgeführt (in `sessions.json` nachverfolgt).
- Der Flush wird nur für eingebettete Pi-Sitzungen ausgeführt (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungs-Workspace schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Dateilayout und die Schreibmuster im Workspace.

Pi stellt in der Erweiterungs-API auch einen Hook `session_before_compact` bereit, aber die
Flush-Logik von OpenClaw lebt heute auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Falscher Sitzungsschlüssel? Beginnen Sie mit [/concepts/session](/de/concepts/session) und prüfen Sie die `sessionKey` in `/status`.
- Abweichung zwischen Speicher und Transkript? Bestätigen Sie den Gateway-Host und den Speicherpfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Compaction-Einstellungen (`reserveTokens` zu hoch für das Modellfenster kann zu früherer Compaction führen)
  - aufgeblähte Tool-Ergebnisse: Session pruning aktivieren/abstimmen
- Leckende stille Turns? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (exaktes Token, nicht groß-/kleinschreibungssensitiv) und dass Sie einen Build mit dem Fix für Streaming-Unterdrückung verwenden.

## Verwandt

- [Session management](/de/concepts/session)
- [Session pruning](/de/concepts/session-pruning)
- [Context engine](/de/concepts/context-engine)
