---
read_when:
    - Sie müssen Session-IDs, Transcript-JSONL oder sessions.json-Felder debuggen
    - Sie ändern das Verhalten der automatischen Compaction oder fügen „Pre-Compaction“-Housekeeping hinzu
    - Sie möchten Memory-Flushes oder stille System-Turns implementieren
summary: 'Ausführliche Betrachtung: Sitzungsspeicher und Transkripte, Lebenszyklus und Interna der (Auto-)Compaction'
title: Detaillierte Betrachtung der Sitzungsverwaltung
x-i18n:
    generated_at: "2026-06-27T18:11:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw verwaltet Sitzungen Ende-zu-Ende über diese Bereiche hinweg:

- **Sitzungs-Routing** (wie eingehende Nachrichten einem `sessionKey` zugeordnet werden)
- **Sitzungsspeicher** (`sessions.json`) und was er nachverfolgt
- **Transkript-Persistenz** (`*.jsonl`) und ihre Struktur
- **Transkript-Hygiene** (Provider-spezifische Korrekturen vor Ausführungen)
- **Kontextlimits** (Kontextfenster vs. nachverfolgte Tokens)
- **Compaction** (manuelle und automatische Compaction) und wo Vorarbeiten vor der Compaction eingehängt werden
- **Stille Wartung** (Speicherschreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollten)

Wenn Sie zuerst einen Überblick auf höherer Ebene möchten, beginnen Sie mit:

- [Sitzungsverwaltung](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [Speicherübersicht](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Transkript-Hygiene](/de/reference/transcript-hygiene)

---

## Quelle der Wahrheit: der Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum konzipiert, der den Sitzungszustand besitzt.

- UIs (macOS-App, Web-Control-UI, TUI) sollten den Gateway nach Sitzungslisten und Token-Zählungen abfragen.
- Im Remote-Modus liegen Sitzungsdateien auf dem Remote-Host; „Ihre lokalen Mac-Dateien zu prüfen“ spiegelt nicht wider, was der Gateway verwendet.

---

## Zwei Persistenzschichten

OpenClaw persistiert Sitzungen in zwei Schichten:

1. **Sitzungsspeicher (`sessions.json`)**
   - Schlüssel/Wert-Zuordnung: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Verfolgt Sitzungsmetadaten nach (aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Nur anhängbares Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns neu aufzubauen
   - Compaction-Checkpoints sind Metadaten über dem kompaktierten Nachfolge-
     Transkript. Neue Compactions schreiben keine zweite `.checkpoint.*.jsonl`-
     Kopie.

Gateway-Historienleser sollten vermeiden, das gesamte Transkript zu materialisieren, sofern
die Oberfläche nicht ausdrücklich beliebigen Zugriff auf historische Daten benötigt. Erstseiten-Historie,
eingebettete Chat-Historie, Wiederherstellung nach Neustart und Token-/Nutzungsprüfungen verwenden begrenzte Tail-
Lesevorgänge. Vollständige Transkript-Scans laufen über den asynchronen Transkriptindex, der
nach Dateipfad plus `mtimeMs`/`size` gecacht und von gleichzeitigen Lesern gemeinsam genutzt wird.

---

## Speicherorte auf dem Datenträger

Pro Agent, auf dem Gateway-Host:

- Speicher: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Themensitzungen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Speicherwartung und Datenträgersteuerung

Die Sitzungspersistenz verfügt über automatische Wartungssteuerungen (`session.maintenance`) für `sessions.json`, Transkriptartefakte und Trajectory-Sidecars:

- `mode`: `enforce` (Standard) oder `warn`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: maximale Anzahl von Einträgen in `sessions.json` (Standard `500`)
- Die Aufbewahrung kurzlebiger Gateway-Modelllauf-Probes ist fest auf `24h` gesetzt, aber druckgesteuert: Sie entfernt veraltete strikte Probe-Zeilen nur, wenn Wartungs-/Limitdruck für Sitzungseinträge erreicht ist. Dies gilt nur für strikte explizite Probe-Schlüssel, die `agent:*:explicit:model-run-<uuid>` entsprechen, und läuft vor der globalen Bereinigung/Begrenzung veralteter Einträge, wenn sie ausgeführt wird.
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: gleich wie `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Normale Gateway-Schreibvorgänge laufen durch einen sitzungsspeicherspezifischen Writer, der prozessinterne Mutationen serialisiert, ohne eine Laufzeit-Dateisperre zu nehmen. Hot-Path-Patch-Helfer leihen sich den validierten veränderbaren Cache, während sie diesen Writer-Slot halten, sodass große `sessions.json`-Dateien nicht für jede Metadatenaktualisierung geklont oder erneut gelesen werden. Laufzeitcode sollte `updateSessionStore(...)` oder `updateSessionStoreEntry(...)` bevorzugen; direkte Speicherungen des gesamten Stores sind Kompatibilitäts- und Offline-Wartungswerkzeuge. Wenn ein Gateway erreichbar ist, delegieren nicht als Trockenlauf ausgeführte `openclaw sessions cleanup` und `openclaw agents delete` Store-Mutationen an den Gateway, sodass die Bereinigung derselben Writer-Warteschlange beitritt; `--store <path>` ist der explizite Offline-Reparaturpfad für direkte Dateiwartung. Die `maxEntries`-Bereinigung wird für produktionsgroße Limits weiterhin in Batches ausgeführt, sodass ein Store das konfigurierte Limit kurzzeitig überschreiten kann, bevor die nächste High-Water-Bereinigung ihn wieder reduziert. Lesevorgänge im Sitzungsspeicher beschneiden oder begrenzen während des Gateway-Starts keine Einträge; verwenden Sie Schreibvorgänge oder `openclaw sessions cleanup --enforce` für die Bereinigung. `openclaw sessions cleanup --enforce` wendet das konfigurierte Limit weiterhin sofort an und entfernt alte nicht referenzierte Transkript-, Checkpoint- und Trajectory-Artefakte auch dann, wenn kein Datenträgerbudget konfiguriert ist.

Die Wartung bewahrt dauerhafte externe Unterhaltungspointer wie Gruppensitzungen
und thread-bezogene Chat-Sitzungen, aber synthetische Laufzeiteinträge für Cron, Hooks,
Heartbeat, ACP und Sub-Agents können weiterhin entfernt werden, wenn sie das
konfigurierte Alter, die Anzahl oder das Datenträgerbudget überschreiten. Gateway-Modelllauf-Probe-Sitzungen verwenden die
separate `24h`-Modelllauf-Aufbewahrung nur, wenn ihr Schlüssel exakt
`agent:*:explicit:model-run-<uuid>` entspricht; andere explizite Sitzungen sind nicht Teil
dieser Aufbewahrung. Die Modelllauf-Bereinigung wird nur unter Limitdruck für Sitzungseinträge
angewendet. Isolierte Cron-Ausführungen behalten ihre eigene `cron.sessionRetention`-Steuerung,
unabhängig von der Modelllauf-Probe-Aufbewahrung.

OpenClaw erstellt bei Gateway-Schreibvorgängen keine automatischen Rotationssicherungen `sessions.json.bak.*` mehr. Der ältere Schlüssel `session.maintenance.rotateBytes` wird ignoriert, und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Transkriptmutationen verwenden eine Sitzungsschreibsperre auf der Transkriptdatei. Der Sperrerwerb wartet bis zu
`session.writeLock.acquireTimeoutMs`, bevor ein Fehler wegen einer beschäftigten Sitzung angezeigt wird; der Standard ist `60000`
ms. Erhöhen Sie dies nur, wenn legitime Vorbereitung, Bereinigung, Compaction oder Transkriptspiegelung auf
langsamen Maschinen länger konkurrieren. `session.writeLock.staleMs` steuert, wann eine bestehende Sperre als
veraltet zurückgefordert werden kann; der Standard ist `1800000` ms. `session.writeLock.maxHoldMs` steuert den
prozessinternen Watchdog-Freigabeschwellenwert; der Standard ist `300000` ms. Notfall-Env-Overrides sind
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` und
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Durchsetzungsreihenfolge für die Bereinigung des Datenträgerbudgets (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten, verwaisten Transkript- oder verwaisten Trajectory-Artefakte.
2. Falls weiterhin über dem Ziel, entfernen Sie die ältesten Sitzungseinträge und ihre Transkript-/Trajectory-Dateien.
3. Fahren Sie fort, bis die Nutzung bei oder unter `highWaterBytes` liegt.

In `mode: "warn"` meldet OpenClaw potenzielle Entfernungen, verändert den Store/die Dateien jedoch nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Ausführungsprotokolle

Isolierte Cron-Ausführungen erstellen ebenfalls Sitzungseinträge/Transkripte, und sie haben eigene Aufbewahrungssteuerungen:

- `cron.sessionRetention` (Standard `24h`) entfernt alte isolierte Cron-Ausführungssitzungen aus dem Sitzungsspeicher (`false` deaktiviert).
- `cron.runLog.keepLines` entfernt beibehaltene SQLite-Ausführungsverlaufszeilen pro Cron-Job (Standard: `2000`). `cron.runLog.maxBytes` bleibt für ältere dateibasierte Ausführungsprotokolle akzeptiert.

Wenn Cron eine neue isolierte Ausführungssitzung erzwingt, bereinigt es den vorherigen
`cron:<jobId>`-Sitzungseintrag, bevor die neue Zeile geschrieben wird. Es übernimmt sichere
Präferenzen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizite
vom Benutzer ausgewählte Modell-/Auth-Overrides. Es verwirft umgebenden Unterhaltungskontext wie
Channel-/Gruppen-Routing, Sende- oder Warteschlangenrichtlinie, Erhöhung, Ursprung und ACP-
Laufzeitbindung, sodass eine frische isolierte Ausführung keine veraltete Zustellungs- oder
Laufzeitautorität aus einer älteren Ausführung erben kann.

---

## Sitzungsschlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, _in welchem Unterhaltungseimer_ Sie sich befinden (Routing + Isolation).

Gängige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Sitzungs-IDs (`sessionId`)

Jeder `sessionKey` verweist auf eine aktuelle `sessionId` (die Transkriptdatei, die die Unterhaltung fortsetzt).

Faustregeln:

- **Zurücksetzen** (`/new`, `/reset`) erstellt eine neue `sessionId` für diesen `sessionKey`.
- **Tägliches Zurücksetzen** (standardmäßig 4:00 Uhr lokaler Zeit auf dem Gateway-Host) erstellt bei der nächsten Nachricht nach der Reset-Grenze eine neue `sessionId`.
- **Inaktivitätsablauf** (`session.reset.idleMinutes` oder Legacy `session.idleMinutes`) erstellt eine neue `sessionId`, wenn nach dem Inaktivitätsfenster eine Nachricht eintrifft. Wenn tägliches Zurücksetzen und Inaktivitätsablauf beide konfiguriert sind, gewinnt das, was zuerst abläuft.
- **Wiederaufnahme bei Control-UI-Neuverbindung** kann die aktuell sichtbare Sitzung für einen erneuten Verbindungsversand erhalten, wenn der Gateway die passende `sessionId` von einem Operator-UI-Client erhält. Gewöhnliche veraltete Sendungen erstellen weiterhin eine neue `sessionId`.
- **Systemereignisse** (Heartbeat, Cron-Weckereignisse, Exec-Benachrichtigungen, Gateway-Buchhaltung) können die Sitzungszeile verändern, verlängern aber nicht die Frische für tägliches Zurücksetzen/Inaktivitätsablauf. Der Reset-Rollover verwirft in die Warteschlange gestellte Systemereignis-Hinweise für die vorherige Sitzung, bevor der frische Prompt aufgebaut wird.
- **Parent-Fork-Richtlinie** verwendet den aktiven Branch von OpenClaw beim Erstellen eines Threads oder Subagent-Forks. Wenn dieser Branch zu groß ist, startet OpenClaw das Kind mit isoliertem Kontext, anstatt fehlzuschlagen oder unbrauchbare Historie zu erben. Die Größenrichtlinie ist automatisch; die Legacy-Konfiguration `session.parentForkMaxTokens` wird durch `openclaw doctor --fix` entfernt.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Sitzungsspeicherschema (`sessions.json`)

Der Werttyp des Stores ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; tägliches Zurücksetzen
  verwendet dies für die Frische. Legacy-Zeilen können ihn aus dem JSONL-Sitzungsheader ableiten.
- `lastInteractionAt`: Zeitstempel der letzten echten Benutzer-/Channel-Interaktion; Inaktivitätsablauf
  verwendet dies für die Frische, sodass Heartbeat-, Cron- und Exec-Ereignisse Sitzungen nicht
  am Leben halten. Legacy-Zeilen ohne dieses Feld fallen für die Inaktivitätsfrische auf die wiederhergestellte Sitzungsstart-
  zeit zurück.
- `updatedAt`: Zeitstempel der letzten Store-Zeilen-Mutation, verwendet für Auflistung, Bereinigung und
  Buchhaltung. Er ist nicht maßgeblich für die Frische bei täglichem Zurücksetzen/Inaktivitätsablauf.
- `sessionFile`: optionaler expliziter Transkriptpfad-Override
- `chatType`: `direct | group | room` (hilft UIs und Senderichtlinie)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Channel-Beschriftung
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (sitzungsspezifischer Override)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best-Effort / Provider-abhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft die automatische Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel für den letzten Speicher-Flush vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Zählung, als der letzte Flush lief

Der Store kann sicher bearbeitet werden, aber der Gateway ist maßgeblich: Er kann Einträge neu schreiben oder rehydrieren, während Sitzungen laufen.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` von `openclaw/plugin-sdk/agent-sessions` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungsheader (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Wichtige Eintragstypen:

- `message`: user/assistant/toolResult-Nachrichten
- `custom_message`: von Erweiterungen eingefügte Nachrichten, die _in_ den Modellkontext eingehen (können in der UI ausgeblendet werden)
- `custom`: Erweiterungsstatus, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren in einem Baumzweig

OpenClaw „korrigiert“ Transkripte absichtlich **nicht**; der Gateway verwendet `SessionManager`, um sie zu lesen und zu schreiben.

---

## Kontextfenster im Vergleich zu nachverfolgten Token

Zwei verschiedene Konzepte sind wichtig:

1. **Modell-Kontextfenster**: harte Obergrenze pro Modell (für das Modell sichtbare Token)
2. **Sitzungsspeicher-Zähler**: laufende Statistiken, die in `sessions.json` geschrieben werden (verwendet für /status und Dashboards)

Wenn Sie Limits abstimmen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann per Konfiguration überschrieben werden).
- `contextTokens` im Speicher ist ein Laufzeit-Schätz-/Berichtswert; behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen finden Sie unter [/token-use](/de/reference/token-use).

---

## Compaction: Was es ist

Compaction fasst ältere Unterhaltung in einem persistierten `compaction`-Eintrag im Transkript zusammen und lässt neuere Nachrichten unverändert.

Nach der Compaction sehen zukünftige Turns:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Die erneute Einfügung von AGENTS.md-Abschnitten nach der Compaction ist opt-in über
`agents.defaults.compaction.postCompactionSections`; wenn dies nicht gesetzt ist oder `[]` ist,
hängt OpenClaw keine AGENTS.md-Auszüge zusätzlich zur Compaction-Zusammenfassung an.

Compaction ist **persistent** (anders als Sitzungsbereinigung). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Compaction-Chunk-Grenzen und Tool-Paarung

Wenn OpenClaw ein langes Transkript in Compaction-Chunks aufteilt, hält es
Assistant-Tool-Aufrufe mit ihren zugehörigen `toolResult`-Einträgen zusammen.

- Wenn die Token-Anteilsaufteilung zwischen einem Tool-Aufruf und seinem Ergebnis landet, verschiebt OpenClaw
  die Grenze zur Assistant-Tool-Aufrufnachricht, statt das
  Paar zu trennen.
- Wenn ein nachfolgender Tool-Ergebnisblock den Chunk andernfalls über das Ziel
  hinausschieben würde, bewahrt OpenClaw diesen ausstehenden Tool-Block und hält den nicht zusammengefassten Nachlauf
  intakt.
- Abgebrochene/fehlerhafte Tool-Aufrufblöcke halten keine ausstehende Aufteilung offen.

---

## Wann automatische Compaction stattfindet (OpenClaw-Laufzeit)

Im eingebetteten OpenClaw-Agenten wird automatische Compaction in zwei Fällen ausgelöst:

1. **Überlauf-Wiederherstellung**: Das Modell gibt einen Kontextüberlauffehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche Provider-geformte Varianten) → compact → erneut versuchen.
   Wenn der Provider die versuchte Token-Anzahl meldet, leitet OpenClaw diese
   beobachtete Anzahl in die Compaction der Überlauf-Wiederherstellung weiter. Wenn der Provider
   den Überlauf bestätigt, aber keine parsebare Anzahl bereitstellt, übergibt OpenClaw eine minimal
   über dem Budget liegende synthetische Anzahl an Compaction-Engines und Diagnosen.
   Wenn die Überlauf-Wiederherstellung weiterhin fehlschlägt, zeigt OpenClaw dem
   Benutzer explizite Anleitung an und bewahrt die aktuelle Sitzungszuordnung, statt
   den Sitzungsschlüssel stillschweigend auf eine frische Sitzungs-ID zu rotieren. Der nächste Schritt wird vom Operator gesteuert:
   Nachricht erneut versuchen, `/compact` ausführen oder `/new` ausführen, wenn eine frische Sitzung
   bevorzugt wird.
2. **Schwellenwert-Wartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Wobei:

- `contextWindow` das Kontextfenster des Modells ist
- `reserveTokens` der für Prompts + die nächste Modellausgabe reservierte Spielraum ist

Dies sind OpenClaw-Laufzeitsemantiken.

OpenClaw kann auch eine lokale Preflight-Compaction auslösen, bevor der nächste
Run geöffnet wird, wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist und die
aktive Transkriptdatei diese Größe erreicht. Dies ist eine Dateigrößen-Schutzmaßnahme für lokale
Wiederöffnungskosten, keine rohe Archivierung: OpenClaw führt weiterhin normale semantische Compaction aus,
und sie erfordert `truncateAfterCompaction`, damit die kompaktierte Zusammenfassung zu einem
neuen Nachfolge-Transkript werden kann.

Für eingebettete OpenClaw-Runs fügt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
einen optionalen Tool-Loop-Schutz hinzu. Nachdem ein Tool-Ergebnis angehängt wurde und vor dem
nächsten Modellaufruf schätzt OpenClaw den Prompt-Druck mit derselben Preflight-
Budgetlogik, die beim Turn-Start verwendet wird. Wenn der Kontext nicht mehr passt, kompaktiert der Schutz
nicht innerhalb des `transformContext`-Hooks der OpenClaw-Laufzeit. Er löst ein strukturiertes
Mid-Turn-Precheck-Signal aus, stoppt die aktuelle Prompt-Übermittlung und lässt die
äußere Run-Schleife den bestehenden Wiederherstellungspfad verwenden: übergroße Tool-Ergebnisse
abschneiden, wenn das ausreicht, oder den konfigurierten Compaction-Modus auslösen und erneut versuchen. Die
Option ist standardmäßig deaktiviert und funktioniert sowohl mit `default`- als auch mit `safeguard`-
Compaction-Modi, einschließlich Provider-gestützter Safeguard-Compaction.
Dies ist unabhängig von `maxActiveTranscriptBytes`: Der Byte-Größen-Schutz läuft,
bevor ein Turn geöffnet wird, während Mid-Turn-Precheck später in der eingebetteten OpenClaw-Tool-
Schleife läuft, nachdem neue Tool-Ergebnisse angehängt wurden.

---

## Compaction-Einstellungen (`reserveTokens`, `keepRecentTokens`)

Die Compaction-Einstellungen der OpenClaw-Laufzeit befinden sich in den Agenteneinstellungen:

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

- Wenn `compaction.reserveTokens < reserveTokensFloor`, hebt OpenClaw sie an.
- Die Standarduntergrenze beträgt `20000` Token.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn sie bereits höher ist, lässt OpenClaw sie unverändert.
- Manuelles `/compact` respektiert ein explizites `agents.defaults.compaction.keepRecentTokens`
  und behält den Recent-Tail-Schnittpunkt der OpenClaw-Laufzeit bei. Ohne ein explizites Aufbewahrungsbudget
  bleibt manuelle Compaction ein harter Checkpoint, und der neu aufgebaute Kontext beginnt bei
  der neuen Zusammenfassung.
- Setzen Sie `agents.defaults.compaction.midTurnPrecheck.enabled: true`, um den
  optionalen Tool-Loop-Precheck nach neuen Tool-Ergebnissen und vor dem nächsten Modell-
  aufruf auszuführen. Dies ist nur ein Auslöser; die Zusammenfassungserzeugung verwendet weiterhin den konfigurierten
  Compaction-Pfad. Sie ist unabhängig von `maxActiveTranscriptBytes`, das ein
  Byte-Größen-Schutz für aktive Transkripte beim Turn-Start ist.
- Setzen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` auf einen Byte-Wert oder
  eine Zeichenfolge wie `"20mb"`, um lokale Compaction vor einem Turn auszuführen, wenn das aktive
  Transkript groß wird. Dieser Schutz ist nur aktiv, wenn
  `truncateAfterCompaction` ebenfalls aktiviert ist. Lassen Sie ihn ungesetzt oder setzen Sie `0`, um
  ihn zu deaktivieren.
- Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist,
  rotiert OpenClaw das aktive Transkript nach der Compaction zu einer kompaktierten Nachfolge-JSONL.
  Branch-/Restore-Checkpoint-Aktionen verwenden diese kompaktierte Nachfolge;
  ältere Pre-Compaction-Checkpoint-Dateien bleiben lesbar, solange auf sie verwiesen wird.

Warum: ausreichend Spielraum für mehrturnige „Housekeeping“-Aufgaben (wie Memory-Schreibvorgänge) lassen, bevor Compaction unvermeidbar wird.

Implementierung: `applyAgentCompactionSettingsFromConfig()` in `src/agents/agent-settings.ts`
(aufgerufen aus eingebetteten Runner-Turn- und Compaction-Setup-Pfaden).

---

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert die Safeguard-Erweiterung die Zusammenfassung an diesen Provider statt an die eingebaute `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Für Standard-LLM-Zusammenfassung ungesetzt lassen.
- Das Setzen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Bezeichnerbewahrung wie der eingebaute Pfad.
- Der Safeguard bewahrt weiterhin Recent-Turn- und Split-Turn-Suffix-Kontext nach der Provider-Ausgabe.
- Die eingebaute Safeguard-Zusammenfassung destilliert frühere Zusammenfassungen mit neuen Nachrichten erneut,
  statt die vollständige vorherige Zusammenfassung wortgetreu zu bewahren.
- Safeguard-Modus aktiviert standardmäßig Qualitätsaudits für Zusammenfassungen; setzen Sie
  `qualityGuard.enabled: false`, um das Verhalten „bei fehlerhaft geformter Ausgabe erneut versuchen“ zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw automatisch auf die eingebaute LLM-Zusammenfassung zurück.
- Abbruch-/Timeout-Signale werden erneut geworfen (nicht geschluckt), um die Abbruchanforderung des Aufrufers zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Benutzerseitig sichtbare Oberflächen

Sie können Compaction und Sitzungsstatus beobachten über:

- `/status` (in jeder Chat-Sitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Gateway-Protokolle (`pnpm gateway:watch` oder `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Ausführlicher Modus: `🧹 Automatische Compaction abgeschlossen` + Compaction-Anzahl

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen der Benutzer keine Zwischenausgabe sehen soll.

Konvention:

- Der Assistant beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um „keine Antwort an den Benutzer ausliefern“ anzugeben.
- OpenClaw entfernt/unterdrückt dies in der Auslieferungsschicht.
- Exakte Unterdrückung stiller Token ist groß-/kleinschreibungsunabhängig, daher zählen `NO_REPLY` und
  `no_reply` beide, wenn die gesamte Nutzlast nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-/Keine-Auslieferung-Turns gedacht; es ist keine Abkürzung für
  gewöhnliche, umsetzbare Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw auch **Entwurfs-/Typing-Streaming**, wenn ein
Teil-Chunk mit `NO_REPLY` beginnt, damit stille Operationen keine Teilausgabe
mitten im Turn durchsickern lassen.

---

## Pre-Compaction-„Memory Flush“ (implementiert)

Ziel: Bevor automatische Compaction stattfindet, einen stillen agentenbasierten Turn ausführen, der dauerhaften
Status auf die Festplatte schreibt (z. B. `memory/YYYY-MM-DD.md` im Agenten-Workspace), damit Compaction keinen
kritischen Kontext löschen kann.

OpenClaw verwendet den Ansatz **Pre-Threshold Flush**:

1. Sitzungs-Kontextnutzung überwachen.
2. Wenn sie einen „weichen Schwellenwert“ überschreitet (unterhalb des Compaction-Schwellenwerts der OpenClaw-Laufzeit), eine stille
   „Memory jetzt schreiben“-Direktive an den Agenten ausführen.
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
  Auslieferung zu unterdrücken.
- Wenn `model` gesetzt ist, verwendet der Flush-Turn dieses Modell, ohne die
  Fallback-Kette der aktiven Sitzung zu erben, damit lokales Housekeeping nicht stillschweigend
  auf ein kostenpflichtiges Konversationsmodell zurückfällt.
- Der Flush läuft einmal pro Compaction-Zyklus (nachverfolgt in `sessions.json`).
- Der Flush läuft nur für eingebettete OpenClaw-Sitzungen (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungs-Workspace schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Workspace-Dateilayout und Schreibmuster.

OpenClaw stellt außerdem einen `session_before_compact`-Hook in der Erweiterungs-API bereit, aber die
Flush-Logik von OpenClaw lebt heute auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Sitzungsschlüssel falsch? Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- Speicher und Transkript stimmen nicht überein? Bestätigen Sie den Gateway-Host und den Speicherpfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Modell-Kontextfenster (zu klein)
  - Compaction-Einstellungen (`reserveTokens` zu hoch für das Modellfenster kann frühere Compaction verursachen)
  - aufgeblähte Tool-Ergebnisse: Sitzungsbereinigung aktivieren/abstimmen
- Stille Turns laufen aus? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (groß-/kleinschreibungsunabhängiges exaktes Token) und Sie auf einem Build sind, der die Streaming-Unterdrückungskorrektur enthält.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
