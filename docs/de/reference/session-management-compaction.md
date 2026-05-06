---
read_when:
    - Sie müssen Sitzungs-IDs, Transkript-JSONL oder sessions.json-Felder debuggen
    - Sie ändern das Auto-Compaction-Verhalten oder fügen Bereinigungsaufgaben vor der Compaction hinzu
    - Sie möchten Speicher-Flushes oder stille System-Turns implementieren
summary: 'Vertiefung: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna der (Auto-)Compaction'
title: Ausführlicher Einblick in die Sitzungsverwaltung
x-i18n:
    generated_at: "2026-05-06T07:02:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw verwaltet Sitzungen end-to-end über diese Bereiche hinweg:

- **Sitzungs-Routing** (wie eingehende Nachrichten einem `sessionKey` zugeordnet werden)
- **Session Store** (`sessions.json`) und was er erfasst
- **Transcript-Persistenz** (`*.jsonl`) und ihre Struktur
- **Transcript-Hygiene** (Provider-spezifische Fixups vor Ausführungen)
- **Kontextgrenzen** (Kontextfenster im Vergleich zu erfassten Tokens)
- **Compaction** (manuelle und automatische Compaction) und wo Sie Arbeit vor der Compaction einhängen können
- **Stille Housekeeping-Aufgaben** (Speicherschreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollten)

Wenn Sie zuerst einen Überblick auf höherer Ebene möchten, beginnen Sie mit:

- [Sitzungsverwaltung](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [Speicherübersicht](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
- [Session-Bereinigung](/de/concepts/session-pruning)
- [Transcript-Hygiene](/de/reference/transcript-hygiene)

---

## Quelle der Wahrheit: der Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum konzipiert, der den Sitzungszustand besitzt.

- UIs (macOS-App, Web Control UI, TUI) sollten den Gateway nach Sitzungslisten und Token-Anzahlen abfragen.
- Im Remote-Modus befinden sich Sitzungsdateien auf dem Remote-Host; „Ihre lokalen Mac-Dateien prüfen“ spiegelt nicht wider, was der Gateway verwendet.

---

## Zwei Persistenzebenen

OpenClaw persistiert Sitzungen in zwei Ebenen:

1. **Session Store (`sessions.json`)**
   - Key-Value-Map: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Erfasst Sitzungsmetadaten (aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Append-only-Transcript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns neu aufzubauen
   - Große Debug-Prüfpunkte vor der Compaction werden übersprungen, sobald das aktive
     Transcript die Größenobergrenze für Prüfpunkte überschreitet; dadurch wird eine zweite riesige
     Kopie `.checkpoint.*.jsonl` vermieden.

Gateway-History-Reader sollten vermeiden, das gesamte Transcript zu materialisieren, sofern
die Oberfläche nicht ausdrücklich beliebigen historischen Zugriff benötigt. History der ersten Seite,
eingebettete Chat-History, Wiederherstellung nach Neustart und Token-/Nutzungsprüfungen verwenden begrenzte Tail-Reads.
Vollständige Transcript-Scans laufen über den asynchronen Transcript-Index, der nach
Dateipfad plus `mtimeMs`/`size` zwischengespeichert und von gleichzeitigen Readern gemeinsam genutzt wird.

---

## Speicherorte auf der Festplatte

Pro Agent auf dem Gateway-Host:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Topic-Sitzungen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Store-Wartung und Festplattenkontrollen

Die Sitzungspersistenz verfügt über automatische Wartungskontrollen (`session.maintenance`) für `sessions.json`, Transcript-Artefakte und Trajectory-Sidecars:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Obergrenze für Einträge in `sessions.json` (Standard `500`)
- `resetArchiveRetention`: Aufbewahrung für Transcript-Archive `*.reset.<timestamp>` (Standard: identisch mit `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Normale Gateway-Schreibvorgänge laufen über einen sitzungsspezifischen Store-Writer, der prozessinterne Mutationen serialisiert, ohne eine Laufzeit-Dateisperre zu verwenden. Hot-Path-Patch-Helfer leihen sich den validierten veränderbaren Cache, während sie diesen Writer-Slot halten, damit große `sessions.json`-Dateien nicht für jedes Metadaten-Update geklont oder erneut gelesen werden. Laufzeitcode sollte `updateSessionStore(...)` oder `updateSessionStoreEntry(...)` bevorzugen; direkte Whole-Store-Saves sind Kompatibilitäts- und Offline-Wartungswerkzeuge. Wenn ein Gateway erreichbar ist, delegieren nicht trockene Läufe von `openclaw sessions cleanup` und `openclaw agents delete` Store-Mutationen an den Gateway, damit die Bereinigung derselben Writer-Warteschlange beitritt; `--store <path>` ist der explizite Offline-Reparaturpfad für direkte Dateiwartung. Die `maxEntries`-Bereinigung wird für produktionsgroße Obergrenzen weiterhin gebündelt, daher kann ein Store die konfigurierte Obergrenze kurzzeitig überschreiten, bevor die nächste High-Water-Bereinigung ihn wieder reduziert. Session-Store-Reads bereinigen oder begrenzen Einträge beim Gateway-Start nicht; verwenden Sie Schreibvorgänge oder `openclaw sessions cleanup --enforce` zur Bereinigung. `openclaw sessions cleanup --enforce` wendet die konfigurierte Obergrenze weiterhin sofort an und bereinigt alte nicht referenzierte Transcript-, Checkpoint- und Trajectory-Artefakte, auch wenn kein Festplattenbudget konfiguriert ist.

Die Wartung behält dauerhafte externe Conversation-Pointer wie Gruppensitzungen
und Thread-spezifische Chat-Sitzungen bei, aber synthetische Laufzeiteinträge für Cron, Hooks,
Heartbeat, ACP und Sub-Agents können weiterhin entfernt werden, wenn sie das
konfigurierte Alter, die konfigurierte Anzahl oder das Festplattenbudget überschreiten.

OpenClaw erstellt bei Gateway-Schreibvorgängen keine automatischen Rotations-Backups `sessions.json.bak.*` mehr. Der Legacy-Schlüssel `session.maintenance.rotateBytes` wird ignoriert, und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Transcript-Mutationen verwenden eine Sitzungsschreibsperre auf der Transcript-Datei. Die Sperrenerfassung wartet bis zu
`session.writeLock.acquireTimeoutMs`, bevor ein Busy-Session-Fehler ausgegeben wird; der Standard ist `60000`
ms. Erhöhen Sie diesen Wert nur, wenn legitime Vorbereitungs-, Bereinigungs-, Compaction- oder Transcript-Mirror-Arbeit
auf langsamen Maschinen länger konkurriert. Stale-Lock-Erkennung und Warnungen bei maximaler Haltedauer bleiben separate Richtlinien.

Erzwingungsreihenfolge für die Bereinigung des Festplattenbudgets (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten, verwaisten Transcript- oder verwaisten Trajectory-Artefakte.
2. Wenn die Nutzung weiterhin über dem Ziel liegt, entfernen Sie die ältesten Sitzungseinträge und ihre Transcript-/Trajectory-Dateien.
3. Fahren Sie fort, bis die Nutzung bei oder unter `highWaterBytes` liegt.

Im `mode: "warn"` meldet OpenClaw mögliche Entfernungen, mutiert den Store/die Dateien aber nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Ausführungsprotokolle

Isolierte Cron-Ausführungen erstellen ebenfalls Sitzungseinträge/Transcripts und haben eigene Aufbewahrungskontrollen:

- `cron.sessionRetention` (Standard `24h`) bereinigt alte isolierte Cron-Ausführungssitzungen aus dem Session Store (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen Dateien `~/.openclaw/cron/runs/<jobId>.jsonl` (Standards: `2_000_000` Byte und `2000` Zeilen).

Wenn Cron zwangsweise eine neue isolierte Ausführungssitzung erstellt, bereinigt es den vorherigen
Sitzungseintrag `cron:<jobId>`, bevor die neue Zeile geschrieben wird. Es übernimmt sichere
Präferenzen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizite
vom Benutzer gewählte Modell-/Auth-Overrides. Es verwirft Umgebungs-Unterhaltungskontext wie
Channel-/Gruppen-Routing, Sende- oder Warteschlangenrichtlinie, Elevation, Origin und ACP-
Laufzeitbindung, damit eine frische isolierte Ausführung keine veraltete Zustellungs- oder
Laufzeitautorität aus einer älteren Ausführung übernehmen kann.

---

## Sitzungsschlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, _in welchem Conversation-Bucket_ Sie sich befinden (Routing + Isolation).

Gängige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Sitzungs-IDs (`sessionId`)

Jeder `sessionKey` verweist auf eine aktuelle `sessionId` (die Transcript-Datei, die die Unterhaltung fortsetzt).

Faustregeln:

- **Reset** (`/new`, `/reset`) erstellt eine neue `sessionId` für diesen `sessionKey`.
- **Täglicher Reset** (standardmäßig 4:00 Uhr lokale Zeit auf dem Gateway-Host) erstellt eine neue `sessionId` bei der nächsten Nachricht nach der Reset-Grenze.
- **Idle-Ablauf** (`session.reset.idleMinutes` oder Legacy `session.idleMinutes`) erstellt eine neue `sessionId`, wenn eine Nachricht nach dem Idle-Fenster eintrifft. Wenn täglich + idle beide konfiguriert sind, gewinnt der Ablauf, der zuerst eintritt.
- **Systemereignisse** (Heartbeat, Cron-Wakeups, Exec-Benachrichtigungen, Gateway-Bookkeeping) können die Sitzungszeile mutieren, verlängern aber nicht die Aktualität des täglichen/Idle-Resets. Der Reset-Rollover verwirft in die Warteschlange gestellte Systemereignis-Hinweise für die vorherige Sitzung, bevor der frische Prompt gebaut wird.
- **Parent-Fork-Richtlinie** verwendet den aktiven Branch von Pi, wenn ein Thread- oder Subagent-Fork erstellt wird. Wenn dieser Branch zu groß ist, startet OpenClaw das Kind mit isoliertem Kontext, statt fehlzuschlagen oder unbrauchbare History zu erben. Die Größenrichtlinie ist automatisch; die Legacy-Konfiguration `session.parentForkMaxTokens` wird von `openclaw doctor --fix` entfernt.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Session-Store-Schema (`sessions.json`)

Der Werttyp des Stores ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transcript-ID (der Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; die Aktualität des täglichen Resets
  verwendet diesen Wert. Legacy-Zeilen können ihn aus dem JSONL-Sitzungsheader ableiten.
- `lastInteractionAt`: Zeitstempel der letzten echten Benutzer-/Channel-Interaktion; die Aktualität des Idle-Resets
  verwendet diesen Wert, sodass Heartbeat-, Cron- und Exec-Ereignisse Sitzungen nicht
  am Leben halten. Legacy-Zeilen ohne dieses Feld fallen für die Idle-Aktualität auf die wiederhergestellte Startzeit
  der Sitzung zurück.
- `updatedAt`: Zeitstempel der letzten Store-Zeilen-Mutation, verwendet für Auflistung, Bereinigung und
  Bookkeeping. Er ist nicht die Autorität für die Aktualität des täglichen/Idle-Resets.
- `sessionFile`: optionale explizite Überschreibung des Transcript-Pfads
- `chatType`: `direct | group | room` (hilft UIs und Senderichtlinie)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Channel-Beschriftung
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (sitzungsspezifische Überschreibung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (best effort / Provider-abhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft automatische Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel für den letzten Speicher-Flush vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Zählerstand, als der letzte Flush lief

Der Store kann sicher bearbeitet werden, aber der Gateway ist die Autorität: Er kann Einträge neu schreiben oder rehydrieren, während Sitzungen laufen.

---

## Transcript-Struktur (`*.jsonl`)

Transcripts werden vom `SessionManager` von `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungsheader (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Bemerkenswerte Eintragstypen:

- `message`: Benutzer-/Assistant-/ToolResult-Nachrichten
- `custom_message`: von Erweiterungen injizierte Nachrichten, die _in den Modellkontext eingehen_ (können in der UI verborgen sein)
- `custom`: Erweiterungszustand, der _nicht in den Modellkontext eingeht_
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren eines Baum-Branches

OpenClaw „repariert“ Transcripts absichtlich **nicht**; der Gateway verwendet `SessionManager`, um sie zu lesen/schreiben.

---

## Kontextfenster im Vergleich zu erfassten Tokens

Zwei unterschiedliche Konzepte sind wichtig:

1. **Modellkontextfenster**: harte Obergrenze pro Modell (Tokens, die für das Modell sichtbar sind)
2. **Session-Store-Zähler**: fortlaufende Statistiken, die in `sessions.json` geschrieben werden (verwendet für /status und Dashboards)

Wenn Sie Grenzwerte abstimmen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann per Konfiguration überschrieben werden).
- `contextTokens` im Store ist ein Laufzeit-Schätz-/Reporting-Wert; behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen finden Sie unter [/token-use](/de/reference/token-use).

---

## Compaction: was sie ist

Compaction fasst ältere Unterhaltung in einem persistierten `compaction`-Eintrag im Transcript zusammen und lässt aktuelle Nachrichten intakt.

Nach der Compaction sehen zukünftige Turns:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Compaction ist **dauerhaft** (anders als Sitzungsbereinigung). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Compaction-Chunk-Grenzen und Tool-Kopplung

Wenn OpenClaw ein langes Transcript in Compaction-Chunks aufteilt, hält es
Assistant-Tool-Aufrufe mit ihren passenden `toolResult`-Einträgen zusammen.

- Wenn die Token-Anteil-Aufteilung zwischen einem Tool-Aufruf und dessen Ergebnis landet, verschiebt OpenClaw
  die Grenze auf die Assistant-Tool-Aufruf-Nachricht, statt das Paar zu trennen.
- Wenn ein nachfolgender Tool-Ergebnisblock den Chunk sonst über das Ziel hinaus verschieben würde,
  bewahrt OpenClaw diesen ausstehenden Tool-Block und hält den nicht zusammengefassten Rest
  intakt.
- Abgebrochene/fehlerhafte Tool-Aufrufblöcke halten keine ausstehende Aufteilung offen.

---

## Wann Auto-Compaction ausgeführt wird (Pi-Laufzeit)

Im eingebetteten Pi-Agenten wird Auto-Compaction in zwei Fällen ausgelöst:

1. **Wiederherstellung nach Überlauf**: Das Modell gibt einen Kontextüberlauffehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche Provider-geprägte Varianten) → komprimieren → erneut versuchen.
2. **Schwellenwert-Wartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist der reservierte Spielraum für Prompts + die nächste Modellausgabe

Dies sind Semantiken der Pi-Laufzeit (OpenClaw verbraucht die Ereignisse, aber Pi entscheidet, wann komprimiert wird).

OpenClaw kann auch eine lokale Preflight-Compaction auslösen, bevor der nächste
Lauf geöffnet wird, wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist und die
aktive Transcript-Datei diese Größe erreicht. Dies ist ein Dateigrößen-Schutz für lokale
Wiederöffnungskosten, keine Roharchivierung: OpenClaw führt weiterhin normale semantische Compaction aus,
und sie erfordert `truncateAfterCompaction`, damit die kompakte Zusammenfassung zu einem
neuen Nachfolge-Transcript werden kann.

Für eingebettete Pi-Läufe fügt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
einen optionalen Tool-Loop-Schutz hinzu. Nachdem ein Tool-Ergebnis angehängt wurde und vor dem
nächsten Modellaufruf schätzt OpenClaw den Prompt-Druck mit derselben Preflight-
Budgetlogik, die beim Turn-Start verwendet wird. Wenn der Kontext nicht mehr passt, führt der Schutz
keine Compaction innerhalb von Pis `transformContext`-Hook aus. Er löst ein strukturiertes
Mid-Turn-Precheck-Signal aus, stoppt die aktuelle Prompt-Übermittlung und lässt die
äußere Lauf-Schleife den vorhandenen Wiederherstellungspfad verwenden: übergroße Tool-Ergebnisse kürzen,
wenn das genügt, oder den konfigurierten Compaction-Modus auslösen und erneut versuchen. Die
Option ist standardmäßig deaktiviert und funktioniert sowohl mit dem `default`- als auch dem `safeguard`-
Compaction-Modus, einschließlich Provider-gestützter Safeguard-Compaction.
Dies ist unabhängig von `maxActiveTranscriptBytes`: Der Bytegrößen-Schutz läuft
bevor ein Turn geöffnet wird, während der Mid-Turn-Precheck später in der eingebetteten Pi-Tool-
Schleife läuft, nachdem neue Tool-Ergebnisse angehängt wurden.

---

## Compaction-Einstellungen (`reserveTokens`, `keepRecentTokens`)

Pis Compaction-Einstellungen liegen in den Pi-Einstellungen:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw erzwingt außerdem eine Sicherheitsuntergrenze für eingebettete Läufe:

- Wenn `compaction.reserveTokens < reserveTokensFloor`, hebt OpenClaw den Wert an.
- Die Standarduntergrenze beträgt `20000` Token.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.
- Manuelles `/compact` berücksichtigt ein explizites `agents.defaults.compaction.keepRecentTokens`
  und behält Pis Recent-Tail-Schnittpunkt bei. Ohne explizites Beibehaltungsbudget
  bleibt manuelle Compaction ein harter Checkpoint, und der neu aufgebaute Kontext beginnt bei
  der neuen Zusammenfassung.
- Setzen Sie `agents.defaults.compaction.midTurnPrecheck.enabled: true`, um den
  optionalen Tool-Loop-Precheck nach neuen Tool-Ergebnissen und vor dem nächsten Modell-
  aufruf auszuführen. Dies ist nur ein Auslöser; die Zusammenfassungserzeugung verwendet weiterhin den konfigurierten
  Compaction-Pfad. Sie ist unabhängig von `maxActiveTranscriptBytes`, das ein
  Turn-Start-Bytegrößen-Schutz für aktive Transcripts ist.
- Setzen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` auf einen Byte-Wert oder
  eine Zeichenfolge wie `"20mb"`, um lokale Compaction vor einem Turn auszuführen, wenn das aktive
  Transcript groß wird. Dieser Schutz ist nur aktiv, wenn
  `truncateAfterCompaction` ebenfalls aktiviert ist. Lassen Sie den Wert ungesetzt oder setzen Sie `0`, um ihn
  zu deaktivieren.
- Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist,
  rotiert OpenClaw das aktive Transcript nach der Compaction in ein kompaktes Nachfolge-JSONL.
  Das alte vollständige Transcript bleibt archiviert und wird vom
  Compaction-Checkpoint verlinkt, statt direkt überschrieben zu werden.

Warum: ausreichend Spielraum für mehrstufige „Housekeeping“-Aufgaben (wie Memory-Schreibvorgänge) lassen, bevor Compaction unvermeidlich wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen aus `src/agents/pi-embedded-runner.ts`).

---

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert die Safeguard-Plugin die Zusammenfassung an diesen Provider statt an die integrierte `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Für die standardmäßige LLM-Zusammenfassung ungesetzt lassen.
- Das Setzen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Bezeichnern wie der integrierte Pfad.
- Safeguard bewahrt weiterhin Recent-Turn- und Split-Turn-Suffix-Kontext nach der Provider-Ausgabe.
- Die integrierte Safeguard-Zusammenfassung destilliert frühere Zusammenfassungen mit neuen Nachrichten erneut,
  statt die vollständige vorherige Zusammenfassung unverändert beizubehalten.
- Der Safeguard-Modus aktiviert Qualitätsprüfungen für Zusammenfassungen standardmäßig; setzen Sie
  `qualityGuard.enabled: false`, um das Verhalten für erneute Versuche bei fehlerhafter Ausgabe zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw automatisch auf die integrierte LLM-Zusammenfassung zurück.
- Abbruch-/Timeout-Signale werden erneut ausgelöst (nicht geschluckt), um die Abbruchanforderung des Aufrufers zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Für Benutzer sichtbare Oberflächen

Sie können Compaction und Sitzungsstatus beobachten über:

- `/status` (in jeder Chat-Sitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ausführlicher Modus: `🧹 Auto-compaction complete` + Compaction-Anzahl

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen der Benutzer keine Zwischenausgabe sehen soll.

Konvention:

- Der Assistant beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um anzugeben: „keine Antwort an den Benutzer ausliefern“.
- OpenClaw entfernt/unterdrückt dies in der Auslieferungsschicht.
- Die exakte Unterdrückung stiller Tokens ist nicht groß-/kleinschreibungssensitiv, daher zählen `NO_REPLY` und
  `no_reply` beide, wenn die gesamte Nutzlast nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-/Nichtauslieferungs-Turns gedacht; es ist keine Abkürzung für
  gewöhnliche umsetzbare Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw auch **Entwurfs-/Tippen-Streaming**, wenn ein
Teil-Chunk mit `NO_REPLY` beginnt, damit stille Vorgänge keine Teil-
ausgabe mitten im Turn preisgeben.

---

## „Memory Flush“ vor der Compaction (implementiert)

Ziel: Bevor Auto-Compaction stattfindet, einen stillen agentischen Turn ausführen, der dauerhaften
Status auf Datenträger schreibt (z. B. `memory/YYYY-MM-DD.md` im Agenten-Workspace), damit Compaction keinen
kritischen Kontext löschen kann.

OpenClaw verwendet den Ansatz **Pre-Threshold Flush**:

1. Sitzungs-Kontextnutzung überwachen.
2. Wenn sie einen „weichen Schwellenwert“ überschreitet (unterhalb von Pis Compaction-Schwellenwert), eine stille
   „Memory jetzt schreiben“-Anweisung an den Agenten ausführen.
3. Das exakte stille Token `NO_REPLY` / `no_reply` verwenden, damit der Benutzer
   nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `model` (optionale exakte Provider-/Modellüberschreibung für den Flush-Turn, zum Beispiel `ollama/qwen3:8b`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis, um
  die Auslieferung zu unterdrücken.
- Wenn `model` gesetzt ist, verwendet der Flush-Turn dieses Modell, ohne die
  Fallback-Kette der aktiven Sitzung zu erben, damit lokales Housekeeping nicht stillschweigend
  auf ein kostenpflichtiges Konversationsmodell zurückfällt.
- Der Flush läuft einmal pro Compaction-Zyklus (nachverfolgt in `sessions.json`).
- Der Flush läuft nur für eingebettete Pi-Sitzungen (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungs-Workspace schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Workspace-Dateilayout und Schreibmuster.

Pi stellt außerdem einen `session_before_compact`-Hook in der Plugin-API bereit, aber OpenClaws
Flush-Logik lebt heute auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Sitzungsschlüssel falsch? Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- Abweichung zwischen Store und Transcript? Bestätigen Sie den Gateway-Host und den Store-Pfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Modell-Kontextfenster (zu klein)
  - Compaction-Einstellungen (`reserveTokens` zu hoch für das Modellfenster kann frühere Compaction verursachen)
  - aufgeblähte Tool-Ergebnisse: Sitzungsbereinigung aktivieren/anpassen
- Stille Turns werden sichtbar? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (exaktes Token, nicht groß-/kleinschreibungssensitiv) und dass Sie einen Build verwenden, der die Streaming-Unterdrückungskorrektur enthält.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
