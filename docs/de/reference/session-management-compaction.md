---
read_when:
    - Sie müssen Sitzungs-IDs, Transkript-JSONL oder Felder in sessions.json debuggen
    - Sie ändern das Verhalten der automatischen Compaction oder fügen „Pre-Compaction“-Housekeeping hinzu
    - Sie möchten Memory Flushes oder stille System-Turns implementieren
summary: 'Detailanalyse: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna der (Auto-)Compaction'
title: Detaillierter Einblick in die Sitzungsverwaltung
x-i18n:
    generated_at: "2026-07-04T20:29:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw verwaltet Sitzungen Ende-zu-Ende über diese Bereiche hinweg:

- **Sitzungsrouting** (wie eingehende Nachrichten einer `sessionKey` zugeordnet werden)
- **Sitzungsspeicher** (`sessions.json`) und was er nachverfolgt
- **Transcript-Persistenz** (`*.jsonl`) und ihre Struktur
- **Transcript-Hygiene** (Provider-spezifische Korrekturen vor Läufen)
- **Kontextlimits** (Kontextfenster im Vergleich zu nachverfolgten Tokens)
- **Compaction** (manuelle und automatische Compaction) und wo Vorarbeiten vor der Compaction eingehängt werden
- **Stille Wartung** (Speicherschreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollten)

Wenn Sie zuerst einen übergeordneten Überblick wünschen, beginnen Sie mit:

- [Sitzungsverwaltung](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [Speicherübersicht](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Transcript-Hygiene](/de/reference/transcript-hygiene)

---

## Quelle der Wahrheit: der Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum konzipiert, der den Sitzungszustand besitzt.

- UIs (macOS-App, Web-Control-UI, TUI) sollten den Gateway nach Sitzungslisten und Token-Zählungen abfragen.
- Im Remote-Modus liegen Sitzungsdateien auf dem Remote-Host; „Ihre lokalen Mac-Dateien zu prüfen“ spiegelt nicht wider, was der Gateway verwendet.

---

## Zwei Persistenzschichten

OpenClaw persistiert Sitzungen in zwei Schichten:

1. **Sitzungsspeicher (`sessions.json`)**
   - Schlüssel/Wert-Abbildung: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Verfolgt Sitzungsmetadaten (aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Nur anhängbares Transcript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns neu aufzubauen
   - Compaction-Prüfpunkte sind Metadaten über dem kompaktierten nachfolgenden
     Transcript. Neue Compactions schreiben keine zweite `.checkpoint.*.jsonl`-
     Kopie.

Gateway-Verlaufsleser sollten vermeiden, das gesamte Transcript zu materialisieren, außer
die Oberfläche benötigt ausdrücklich beliebigen historischen Zugriff. Erstseitenverlauf,
eingebetteter Chat-Verlauf, Wiederherstellung nach Neustart und Token-/Nutzungsprüfungen verwenden begrenzte Tail-
Lesevorgänge. Vollständige Transcript-Scans laufen über den asynchronen Transcript-Index, der
nach Dateipfad plus `mtimeMs`/`size` zwischengespeichert und von gleichzeitigen Lesern gemeinsam genutzt wird.

---

## Speicherorte auf der Festplatte

Pro Agent, auf dem Gateway-Host:

- Speicher: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Themensitzungen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Speicherwartung und Festplattenkontrollen

Die Sitzungspersistenz hat automatische Wartungskontrollen (`session.maintenance`) für `sessions.json`, Transcript-Artefakte und Trajectory-Sidecars:

- `mode`: `enforce` (Standard) oder `warn`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Obergrenze für Einträge in `sessions.json` (Standard `500`)
- Die Aufbewahrung kurzlebiger Gateway-Modelllauf-Probes ist fest auf `24h` gesetzt, aber druckgesteuert: Sie entfernt veraltete strikte Probe-Zeilen nur, wenn Wartungs-/Obergrenzendruck für Sitzungseinträge erreicht ist. Dies gilt nur für strikte explizite Probe-Schlüssel, die `agent:*:explicit:model-run-<uuid>` entsprechen, und läuft vor globaler Bereinigung/Obergrenzenanwendung veralteter Einträge, wenn sie läuft.
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transcript-Archive (Standard: wie `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Normale Gateway-Schreibvorgänge laufen über einen sitzungsspezifischen Speicher-Writer, der prozessinterne Mutationen serialisiert, ohne eine Laufzeit-Dateisperre zu nehmen. Hot-Path-Patch-Helfer leihen sich den validierten veränderbaren Cache, während sie diesen Writer-Slot halten, sodass große `sessions.json`-Dateien nicht bei jeder Metadatenaktualisierung geklont oder erneut gelesen werden. Laufzeitcode sollte `updateSessionStore(...)` oder `updateSessionStoreEntry(...)` bevorzugen; direkte Speicherungen des gesamten Speichers sind Kompatibilitäts- und Offline-Wartungstools. Wenn ein Gateway erreichbar ist, delegieren nicht trockene Läufe von `openclaw sessions cleanup` und `openclaw agents delete` Speichermutationen an den Gateway, sodass die Bereinigung derselben Writer-Warteschlange beitritt; `--store <path>` ist der explizite Offline-Reparaturpfad für direkte Dateiwartung. Die `maxEntries`-Bereinigung wird für produktionsgroße Obergrenzen weiterhin gebündelt, sodass ein Speicher die konfigurierte Obergrenze kurzzeitig überschreiten kann, bevor die nächste High-Water-Bereinigung ihn wieder herunterschreibt. Sitzungsspeicher-Lesevorgänge bereinigen oder begrenzen während des Gateway-Starts keine Einträge; verwenden Sie Schreibvorgänge oder `openclaw sessions cleanup --enforce` für die Bereinigung. `openclaw sessions cleanup --enforce` wendet die konfigurierte Obergrenze weiterhin sofort an und bereinigt alte nicht referenzierte Transcript-, Checkpoint- und Trajectory-Artefakte, auch wenn kein Festplattenbudget konfiguriert ist.

Die Wartung behält dauerhafte externe Gesprächszeiger wie Gruppensitzungen
und thread-bezogene Chat-Sitzungen bei, aber synthetische Laufzeiteinträge für Cron, Hooks,
Heartbeat, ACP und Sub-Agents können weiterhin entfernt werden, wenn sie das
konfigurierte Alter, die Anzahl oder das Festplattenbudget überschreiten. Gateway-Modelllauf-Probe-Sitzungen verwenden die
separate `24h`-Modelllauf-Aufbewahrung nur, wenn ihr Schlüssel exakt
`agent:*:explicit:model-run-<uuid>` entspricht; andere explizite Sitzungen sind nicht Teil
dieser Aufbewahrung. Die Modelllauf-Bereinigung wird nur unter Obergrenzendruck für Sitzungseinträge
angewendet. Isolierte Cron-Läufe behalten ihre eigene `cron.sessionRetention`-Kontrolle,
unabhängig von der Modelllauf-Probe-Aufbewahrung.

OpenClaw erstellt bei Gateway-Schreibvorgängen keine automatischen `sessions.json.bak.*`-Rotationsbackups mehr. Der Legacy-Schlüssel `session.maintenance.rotateBytes` wird ignoriert und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Transcript-Mutationen verwenden eine Sitzungsschreibsperre auf der Transcript-Datei. Die Sperrenakquise wartet bis zu
`session.writeLock.acquireTimeoutMs`, bevor ein Fehler für eine belegte Sitzung ausgegeben wird; der Standardwert ist `60000`
ms. Erhöhen Sie dies nur, wenn legitime Vorbereitung, Bereinigung, Compaction oder Transcript-Spiegelungsarbeit
auf langsamen Maschinen länger konkurriert. `session.writeLock.staleMs` steuert, wann eine vorhandene Sperre als
veraltet zurückgefordert werden kann; der Standardwert ist `1800000` ms. `session.writeLock.maxHoldMs` steuert den
prozessinternen Watchdog-Freigabeschwellenwert; der Standardwert ist `300000` ms. Notfall-Env-Overrides sind
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` und
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Durchsetzungsreihenfolge für Festplattenbudget-Bereinigung (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten, verwaisten Transcript- oder verwaisten Trajectory-Artefakte.
2. Wenn weiterhin über dem Ziel, verwerfen Sie die ältesten Sitzungseinträge und ihre Transcript-/Trajectory-Dateien.
3. Fahren Sie fort, bis die Nutzung bei oder unter `highWaterBytes` liegt.

In `mode: "warn"` meldet OpenClaw potenzielle Verwerfungen, mutiert den Speicher/die Dateien aber nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Laufprotokolle

Isolierte Cron-Läufe erstellen ebenfalls Sitzungseinträge/Transcripts und haben dedizierte Aufbewahrungskontrollen:

- `cron.sessionRetention` (Standard `24h`) bereinigt alte isolierte Cron-Laufsitzungen aus dem Sitzungsspeicher (`false` deaktiviert).
- `cron.runLog.keepLines` bereinigt aufbewahrte SQLite-Laufverlaufszeilen pro Cron-Job (Standard: `2000`). `cron.runLog.maxBytes` bleibt für ältere dateibasierte Laufprotokolle akzeptiert.

Wenn Cron zwangsweise eine neue isolierte Laufsitzung erstellt, bereinigt es den vorherigen
`cron:<jobId>`-Sitzungseintrag, bevor die neue Zeile geschrieben wird. Es übernimmt sichere
Voreinstellungen wie Denk-/Schnell-/Ausführlich-Einstellungen, Labels und explizite
vom Benutzer ausgewählte Modell-/Auth-Overrides. Es verwirft umgebenden Gesprächskontext wie
Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinien, Elevation, Ursprung und ACP-
Laufzeitbindung, sodass ein frischer isolierter Lauf keine veraltete Zustellungs- oder
Laufzeitautorität aus einem älteren Lauf erben kann.

---

## Sitzungsschlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, _in welchem Gesprächs-Bucket_ Sie sich befinden (Routing + Isolation).

Häufige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Sitzungs-IDs (`sessionId`)

Jeder `sessionKey` verweist auf eine aktuelle `sessionId` (die Transcript-Datei, die das Gespräch fortsetzt).

Faustregeln:

- **Zurücksetzen** (`/new`, `/reset`) erstellt eine neue `sessionId` für diesen `sessionKey`.
- **Tägliches Zurücksetzen** (standardmäßig 4:00 Uhr lokale Zeit auf dem Gateway-Host) erstellt bei der nächsten Nachricht nach der Zurücksetzungsgrenze eine neue `sessionId`.
- **Leerlaufablauf** (`session.reset.idleMinutes` oder Legacy `session.idleMinutes`) erstellt eine neue `sessionId`, wenn nach dem Leerlauffenster eine Nachricht eintrifft. Wenn täglich + Leerlauf beide konfiguriert sind, gewinnt, was zuerst abläuft.
- **Control-UI-Wiederverbindungsfortsetzung** kann die aktuell sichtbare Sitzung für einen Wiederverbindungs-Sendevorgang erhalten, wenn der Gateway die passende `sessionId` von einem Operator-UI-Client empfängt. Gewöhnliche veraltete Sendevorgänge erstellen weiterhin eine neue `sessionId`.
- **Systemereignisse** (Heartbeat, Cron-Weckereignisse, Exec-Benachrichtigungen, Gateway-Buchhaltung) können die Sitzungszeile mutieren, verlängern aber nicht die Frische für tägliches/Leerlauf-Zurücksetzen. Der Zurücksetzungswechsel verwirft in die Warteschlange gestellte Systemereignis-Hinweise für die vorherige Sitzung, bevor der frische Prompt aufgebaut wird.
- **Parent-Fork-Richtlinie** verwendet den aktiven Branch von OpenClaw beim Erstellen eines Thread- oder Subagent-Forks. Wenn dieser Branch zu groß ist, startet OpenClaw das Kind mit isoliertem Kontext, statt fehlzuschlagen oder unbrauchbaren Verlauf zu erben. Die Größenrichtlinie ist automatisch; die Legacy-Konfiguration `session.parentForkMaxTokens` wird von `openclaw doctor --fix` entfernt.

Implementierungsdetail: Die Entscheidung geschieht in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Sitzungsspeicher-Schema (`sessions.json`)

Der Werttyp des Speichers ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transcript-ID (der Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; tägliche Zurücksetzungs-
  Aktualität verwendet diesen Wert. Legacy-Zeilen können ihn aus dem JSONL-Sitzungsheader ableiten.
- `lastInteractionAt`: Zeitstempel der letzten echten Benutzer-/Kanalinteraktion; die Aktualität für
  Zurücksetzen bei Inaktivität verwendet diesen Wert, damit Heartbeat-, Cron- und Exec-Ereignisse Sitzungen nicht
  aktiv halten. Legacy-Zeilen ohne dieses Feld fallen für die Inaktivitätsaktualität auf die wiederhergestellte Sitzungsstartzeit
  zurück.
- `updatedAt`: Zeitstempel der letzten Store-Zeilenmutation, verwendet für Auflistung, Bereinigung und
  Buchhaltung. Er ist nicht maßgeblich für die Aktualität von täglichem Zurücksetzen oder Zurücksetzen bei Inaktivität.
- `archivedAt`: optionaler Archivzeitstempel. Archivierte Sitzungen bleiben mit intaktem Transcript
  im Store und werden aus normalen aktiven Auflistungen ausgeschlossen.
- `pinnedAt`: optionaler Pin-Zeitstempel. Aktive angeheftete Sitzungen werden vor
  nicht angehefteten Sitzungen sortiert; das Archivieren einer Sitzung entfernt ihren Pin.
- Codex-Thread-Interoperabilität: Beide Felder folgen der Codex-Thread-Management-Form —
  die `archived`/`pinned`-Booleans auf der Leitung werden immer aus dem
  Zeitstempel abgeleitet und serverseitig gestempelt, passend zur Codex-`threads.archived_at`-
  Semantik und camelCase-Serialisierung. OpenClaw-Zeitstempel sind Epoch-
  Millisekunden, während Codex Epoch-Sekunden verwendet; daher konvertieren Bridges an der Codex-
  Plugin-Grenze. Codex hat noch keine Pin-API (nur `thread/archive`/`thread/unarchive`);
  der angeheftete Zustand bleibt auf OpenClaw-Seite, bis es eine gibt. Dann ermöglicht die
  passende Form, dass gebundene Sitzungen den Pin-Zustand mechanisch hin- und zurückübertragen.
- `sessionFile`: optionale explizite Überschreibung des Transcript-Pfads
- `chatType`: `direct | group | room` (hilft UIs und Senderichtlinie)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Kanalbeschriftung
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (Überschreibung pro Sitzung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best-Effort / Provider-abhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft Auto-Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel des letzten Speicher-Flush vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Zählerstand, als der letzte Flush lief

Der Store kann sicher bearbeitet werden, aber der Gateway ist maßgeblich: Er kann Einträge neu schreiben oder rehydrieren, während Sitzungen laufen.

---

## Transcript-Struktur (`*.jsonl`)

Transcripts werden vom `SessionManager` von `openclaw/plugin-sdk/agent-sessions` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungsheader (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Wichtige Eintragstypen:

- `message`: Benutzer-/Assistent-/toolResult-Nachrichten
- `custom_message`: von Erweiterungen eingefügte Nachrichten, die _in_ den Modellkontext eingehen (können vor der UI verborgen sein)
- `custom`: Erweiterungszustand, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren in einem Baumzweig

OpenClaw „repariert“ Transcripts absichtlich **nicht**; der Gateway verwendet `SessionManager`, um sie zu lesen/schreiben.

---

## Kontextfenster vs. verfolgte Tokens

Zwei unterschiedliche Konzepte sind wichtig:

1. **Modellkontextfenster**: harte Obergrenze pro Modell (Tokens, die für das Modell sichtbar sind)
2. **Sitzungs-Store-Zähler**: fortlaufende Statistiken, die in `sessions.json` geschrieben werden (verwendet für /status und Dashboards)

Wenn Sie Limits abstimmen:

- Das Kontextfenster kommt aus dem Modellkatalog (und kann per Konfiguration überschrieben werden).
- `contextTokens` im Store ist ein Laufzeit-Schätz-/Berichtswert; behandeln Sie ihn nicht als strikte Garantie.

Mehr dazu finden Sie unter [/token-use](/de/reference/token-use).

---

## Compaction: was sie ist

Compaction fasst ältere Konversationen in einem persistierten `compaction`-Eintrag im Transcript zusammen und hält aktuelle Nachrichten intakt.

Nach der Compaction sehen zukünftige Turns:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Die erneute Einfügung von AGENTS.md-Abschnitten nach der Compaction ist per
`agents.defaults.compaction.postCompactionSections` optional; wenn nicht gesetzt oder `[]`,
hängt OpenClaw keine AGENTS.md-Auszüge zusätzlich an die Compaction-Zusammenfassung an.

Compaction ist **persistent** (anders als Sitzungsbereinigung). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Compaction-Chunk-Grenzen und Tool-Paarung

Wenn OpenClaw ein langes Transcript in Compaction-Chunks aufteilt, hält es
Assistent-Tool-Aufrufe mit ihren passenden `toolResult`-Einträgen zusammen.

- Wenn die Token-Anteilsaufteilung zwischen einem Tool-Aufruf und dessen Ergebnis liegt, verschiebt OpenClaw
  die Grenze auf die Assistent-Tool-Aufruf-Nachricht, statt das
  Paar zu trennen.
- Wenn ein nachgestellter Tool-Ergebnisblock den Chunk sonst über das Ziel schieben würde,
  bewahrt OpenClaw diesen ausstehenden Tool-Block und hält den nicht zusammengefassten Tail
  intakt.
- Abgebrochene/fehlerhafte Tool-Aufrufblöcke halten keine ausstehende Aufteilung offen.

---

## Wann Auto-Compaction stattfindet (OpenClaw-Laufzeit)

Im eingebetteten OpenClaw-Agent wird Auto-Compaction in zwei Fällen ausgelöst:

1. **Overflow-Wiederherstellung**: Das Modell gibt einen Kontext-Overflow-Fehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche Provider-geformte Varianten) → compact → retry.
   Wenn der Provider die versuchte Token-Anzahl meldet, leitet OpenClaw diese
   beobachtete Anzahl in die Overflow-Wiederherstellungs-Compaction weiter. Wenn der Provider
   den Overflow bestätigt, aber keine parsebare Anzahl offenlegt, übergibt OpenClaw eine minimal
   über dem Budget liegende synthetische Anzahl an Compaction-Engines und Diagnosen.
   Wenn die Overflow-Wiederherstellung weiterhin fehlschlägt, zeigt OpenClaw dem
   Benutzer explizite Hinweise an und bewahrt die aktuelle Sitzungszuordnung, statt den
   Sitzungsschlüssel stillschweigend auf eine neue Sitzungs-ID zu rotieren. Der nächste Schritt ist durch den Operator gesteuert:
   Nachricht erneut versuchen, `/compact` ausführen oder `/new` ausführen, wenn eine frische Sitzung
   bevorzugt wird.
2. **Schwellenwert-Wartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist für Prompts + die nächste Modellausgabe reservierter Spielraum

Dies sind OpenClaw-Laufzeitsemantiken.

OpenClaw kann außerdem eine lokale Preflight-Compaction vor dem Öffnen des nächsten
Runs auslösen, wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist und die
aktive Transcript-Datei diese Größe erreicht. Dies ist eine Dateigrößen-Schutzmaßnahme für lokale
Wiederöffnungskosten, keine rohe Archivierung: OpenClaw führt weiterhin normale semantische Compaction aus,
und sie erfordert `truncateAfterCompaction`, damit die komprimierte Zusammenfassung zu einem
neuen Nachfolge-Transcript werden kann.

Für eingebettete OpenClaw-Runs fügt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
eine optionale Tool-Loop-Schutzmaßnahme hinzu. Nachdem ein Tool-Ergebnis angehängt wurde und vor dem
nächsten Modellaufruf schätzt OpenClaw den Prompt-Druck mit derselben Preflight-
Budgetlogik, die beim Turn-Start verwendet wird. Wenn der Kontext nicht mehr passt, komprimiert die Schutzmaßnahme
nicht innerhalb des `transformContext`-Hooks der OpenClaw-Laufzeit. Sie löst ein strukturiertes
Mid-Turn-Precheck-Signal aus, stoppt die aktuelle Prompt-Übermittlung und lässt die
äußere Run-Schleife den vorhandenen Wiederherstellungspfad verwenden: übergroße Tool-Ergebnisse
abschneiden, wenn das ausreicht, oder den konfigurierten Compaction-Modus auslösen und erneut versuchen. Die
Option ist standardmäßig deaktiviert und funktioniert sowohl mit `default`- als auch mit `safeguard`-
Compaction-Modi, einschließlich Provider-gestützter Safeguard-Compaction.
Dies ist unabhängig von `maxActiveTranscriptBytes`: Die Byte-Größen-Schutzmaßnahme läuft,
bevor ein Turn geöffnet wird, während Mid-Turn-Precheck später in der eingebetteten OpenClaw-Tool-
Loop läuft, nachdem neue Tool-Ergebnisse angehängt wurden.

---

## Compaction-Einstellungen (`reserveTokens`, `keepRecentTokens`)

Die Compaction-Einstellungen der OpenClaw-Laufzeit befinden sich in den Agent-Einstellungen:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw erzwingt außerdem eine Sicherheitsuntergrenze für eingebettete Runs:

- Wenn `compaction.reserveTokens < reserveTokensFloor`, hebt OpenClaw den Wert an.
- Die Standarduntergrenze beträgt `20000` Tokens.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.
- Manuelles `/compact` berücksichtigt ein explizites `agents.defaults.compaction.keepRecentTokens`
  und behält den Recent-Tail-Schnittpunkt der OpenClaw-Laufzeit bei. Ohne explizites Aufbewahrungsbudget
  bleibt manuelle Compaction ein harter Checkpoint, und der neu aufgebaute Kontext startet von
  der neuen Zusammenfassung.
- Setzen Sie `agents.defaults.compaction.midTurnPrecheck.enabled: true`, um den
  optionalen Tool-Loop-Precheck nach neuen Tool-Ergebnissen und vor dem nächsten Modell-
  aufruf auszuführen. Dies ist nur ein Trigger; die Zusammenfassungserzeugung verwendet weiterhin den konfigurierten
  Compaction-Pfad. Er ist unabhängig von `maxActiveTranscriptBytes`, einer
  Turn-Start-Schutzmaßnahme für die Byte-Größe aktiver Transcripts.
- Setzen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` auf einen Byte-Wert oder
  eine Zeichenkette wie `"20mb"`, um lokale Compaction vor einem Turn auszuführen, wenn das aktive
  Transcript groß wird. Diese Schutzmaßnahme ist nur aktiv, wenn
  `truncateAfterCompaction` ebenfalls aktiviert ist. Lassen Sie sie ungesetzt oder setzen Sie `0`, um sie
  zu deaktivieren.
- Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist,
  rotiert OpenClaw das aktive Transcript nach der Compaction zu einem komprimierten Nachfolger-JSONL.
  Branch-/Restore-Checkpoint-Aktionen verwenden diesen komprimierten Nachfolger;
  Legacy-Checkpoint-Dateien vor der Compaction bleiben lesbar, solange auf sie verwiesen wird.

Warum: genügend Spielraum für mehrteilige „Housekeeping“-Vorgänge (wie Speicher-Schreibvorgänge) lassen, bevor Compaction unvermeidbar wird.

Implementierung: `applyAgentCompactionSettingsFromConfig()` in `src/agents/agent-settings.ts`
(aufgerufen aus Turn- und Compaction-Setup-Pfaden des eingebetteten Runners).

---

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` auf der Plugin-API einen Compaction-Provider registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert die Safeguard-Erweiterung die Zusammenfassung an diesen Provider statt an die eingebaute `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Für standardmäßige LLM-Zusammenfassung ungesetzt lassen.
- Das Setzen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Bezeichnerbewahrung wie der eingebaute Pfad.
- Der Safeguard bewahrt nach der Provider-Ausgabe weiterhin Kontext aus aktuellen Turns und Split-Turn-Suffixen.
- Eingebaute Safeguard-Zusammenfassung destilliert frühere Zusammenfassungen mit neuen Nachrichten erneut,
  statt die vollständige vorherige Zusammenfassung wörtlich zu bewahren.
- Safeguard-Modus aktiviert Zusammenfassungsqualitätsprüfungen standardmäßig; setzen Sie
  `qualityGuard.enabled: false`, um Retry-Verhalten bei fehlerhaft geformter Ausgabe zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw automatisch auf eingebaute LLM-Zusammenfassung zurück.
- Abbruch-/Timeout-Signale werden erneut ausgelöst (nicht geschluckt), um Caller-Abbruch zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Für Benutzer sichtbare Oberflächen

Sie können Compaction und Sitzungszustand beobachten über:

- `/status` (in jeder Chat-Sitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Gateway-Logs (`pnpm gateway:watch` oder `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Ausführlicher Modus: `🧹 Auto-compaction complete` + Compaction-Zähler

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen der Benutzer keine Zwischenausgabe sehen sollte.

Konvention:

- Der Assistent beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um anzuzeigen: „keine Antwort an den Benutzer ausliefern“.
- OpenClaw entfernt/unterdrückt dies in der Auslieferungsschicht.
- Die exakte Unterdrückung des stillen Tokens ist nicht groß-/kleinschreibungssensitiv, daher zählen `NO_REPLY` und
  `no_reply` beide, wenn die gesamte Nutzlast nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrunddurchläufe ohne Auslieferung gedacht; es ist keine Abkürzung für
  normale, handlungsrelevante Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw außerdem **Entwurfs-/Tipp-Streaming**, wenn ein
Teil-Chunk mit `NO_REPLY` beginnt, damit stille Vorgänge nicht mitten im Durchlauf teilweise
Ausgabe preisgeben.

---

## „Memory Flush“ vor der Compaction (implementiert)

Ziel: Bevor Auto-Compaction stattfindet, einen stillen agentischen Durchlauf ausführen, der dauerhaften
Zustand auf die Festplatte schreibt (z. B. `memory/YYYY-MM-DD.md` im Arbeitsbereich des Agenten), damit Compaction
kritischen Kontext nicht löschen kann.

OpenClaw verwendet den Ansatz **Flush vor dem Schwellenwert**:

1. Kontextnutzung der Sitzung überwachen.
2. Wenn sie einen „weichen Schwellenwert“ überschreitet (unterhalb des Compaction-Schwellenwerts der OpenClaw-Laufzeit), eine stille
   „Schreibe jetzt Speicher“-Anweisung an den Agenten ausführen.
3. Das exakte stille Token `NO_REPLY` / `no_reply` verwenden, damit der Benutzer
   nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `model` (optionale exakte Provider-/Modell-Überschreibung für den Flush-Durchlauf, zum Beispiel `ollama/qwen3:8b`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Durchlauf)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Durchlauf angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis, um die
  Auslieferung zu unterdrücken.
- Wenn `model` gesetzt ist, verwendet der Flush-Durchlauf dieses Modell, ohne die
  aktive Fallback-Kette der Sitzung zu übernehmen, sodass rein lokale Aufräumarbeiten nicht stillschweigend
  auf ein kostenpflichtiges Konversationsmodell zurückfallen.
- Der Flush wird einmal pro Compaction-Zyklus ausgeführt (in `sessions.json` nachverfolgt).
- Der Flush wird nur für eingebettete OpenClaw-Sitzungen ausgeführt (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungsarbeitsbereich schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Speicher](/de/concepts/memory) für das Dateilayout des Arbeitsbereichs und Schreibmuster.

OpenClaw stellt außerdem einen `session_before_compact`-Hook in der Erweiterungs-API bereit, aber die
Flush-Logik von OpenClaw liegt derzeit auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Sitzungsschlüssel falsch? Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- Abweichung zwischen Store und Transkript? Bestätigen Sie den Gateway-Host und den Store-Pfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Compaction-Einstellungen (`reserveTokens` zu hoch für das Modellfenster kann frühere Compaction verursachen)
  - Aufblähung durch Tool-Ergebnisse: Sitzungsbereinigung aktivieren/anpassen
- Stille Durchläufe geben Inhalte preis? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (nicht groß-/kleinschreibungssensitives exaktes Token) und dass Sie einen Build verwenden, der die Korrektur zur Streaming-Unterdrückung enthält.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
