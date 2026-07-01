---
read_when:
    - OpenClaw-Laufzeitdaten, Cache, Transkripte, Aufgabenstatus oder Arbeitsdateien nach SQLite verschieben
    - Doctor-Migrationen aus veralteten JSON- oder JSONL-Dateien entwerfen
    - Backup-, Wiederherstellungs-, VFS- oder Worker-Speicherverhalten ändern
    - Entfernen von Sitzungssperren, Bereinigung, Kürzung oder JSON-Kompatibilitätspfaden
summary: Migrationsplan, um SQLite zur primären dauerhaften Zustands- und Cache-Schicht zu machen und die Konfiguration weiterhin dateibasiert zu halten
title: Database-first-Zustandsrefaktorierung
x-i18n:
    generated_at: "2026-07-01T20:19:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# Database-First-State-Refactor

## Entscheidung

Verwenden Sie ein zweistufiges SQLite-Layout:

- Globale Datenbank: `~/.openclaw/state/openclaw.sqlite`
- Agent-Datenbank: eine SQLite-Datenbank pro Agent für agent-eigene Workspaces,
  Transkripte, VFS, Artefakte und große agent-spezifische Runtime-Zustände
- Die Konfiguration bleibt dateibasiert: `openclaw.json` bleibt außerhalb der
  Datenbank. Runtime-Auth-Profile wechseln zu SQLite; externe Provider- oder
  CLI-Anmeldedateien bleiben eigentümerverwaltet außerhalb der OpenClaw-Datenbank.

Die globale Datenbank ist die Control-Plane-Datenbank. Sie verwaltet Agent-Erkennung,
gemeinsamen Gateway-Zustand, Pairing, Geräte-/Node-Zustand, Aufgaben- und Flow-Ledger,
Plugin-Zustand, Scheduler-Runtime-Zustand, Backup-Metadaten und Migrationszustand.

Die Agent-Datenbank ist die Data-Plane-Datenbank. Sie verwaltet die Sitzungsmetadaten
des Agents, den Transkript-Eventstream, den VFS-Workspace oder Scratch-Namespace,
Tool-Artefakte, Run-Artefakte und durchsuchbare/indizierbare agent-lokale Cache-Daten.

Damit entsteht eine dauerhafte globale Sicht, ohne große Agent-Workspaces,
Transkripte und binäre Scratch-Daten in die gemeinsame Gateway-Schreibspur zu zwingen.

## Harter Vertrag

Diese Migration hat eine kanonische Runtime-Form:

- Sitzungszeilen speichern nur Sitzungsmetadaten. Sie dürfen nicht
  `transcriptLocator`, Transkript-Dateipfade, benachbarte JSONL-Pfade, Lock-Pfade,
  Pruning-Metadaten oder Kompatibilitätszeiger aus der Datei-Ära speichern.
- Transkriptidentität ist immer SQLite-Identität: `{agentId, sessionId}` plus
  optionale Themenmetadaten, wo das Protokoll sie benötigt.
- `sqlite-transcript://...` ist keine Runtime- oder Protokollidentität. Neuer Code darf
  Transkript-Locators nicht ableiten, speichern, übergeben, parsen oder migrieren.
  Runtime und Tests sollten überhaupt keine Pseudo-Locators enthalten; Dokumentation
  darf die Zeichenfolge nur erwähnen, um sie zu verbieten.
- Legacy-`sessions.json`, Transkript-JSONL, `.jsonl.lock`, Pruning, Trunkierung
  und alte Sitzungspfadlogik gehören nur in den doctor-Migrations-/Importpfad.
- Legacy-Sitzungskonfigurations-Aliasse gehören nur in die doctor-Migration. Die
  Runtime interpretiert weder `session.idleMinutes`, `session.resetByType.dm` noch
  agent-übergreifende `agent:main:*`-Hauptsitzungs-Aliasse für einen anderen
  konfigurierten Agent.
- Sitzungsrouting-Identität ist typisierter relationaler Zustand. Heiße Runtime- und
  UI-Pfade sollten `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` und
  `session_conversations` lesen; sie dürfen nicht `session_key` parsen oder
  `session_entries.entry_json` nach Provider-Identität durchsuchen, außer als
  Kompatibilitätsschatten, während alte Aufrufstellen gelöscht werden.
- Direct-Message-Markierungen auf Kanalebene wie `dm` gegenüber `direct` sind
  Routing-Vokabular, keine Transkript-Locators oder Kompatibilitäts-Handles für
  Dateispeicher.
- Legacy-Hook-Handler-Konfiguration gehört nur in doctor-Warn-/Migrationsflächen.
  Die Runtime darf `hooks.internal.handlers` nicht laden; Hooks laufen nur über
  erkannte Hook-Verzeichnisse und `HOOK.md`-Metadaten.
- Runtime-Start, heiße Antwortpfade, Compaction, Reset, Wiederherstellung,
  Diagnosen, TTS, Memory-Hooks, Subagents, Plugin-Befehlsrouting,
  Protokollgrenzen und Hooks müssen `{agentId, sessionId}` durch die Runtime
  übergeben.
- Tests sollten SQLite-Transkriptzeilen über `{agentId, sessionId}` vorbereiten und
  prüfen. Tests, die nur JSONL-Pfadweiterleitung, Erhalt von vom Aufrufer gelieferten
  Locators oder Transkriptdatei-Kompatibilität belegen, sollten gelöscht werden, sofern
  sie nicht doctor-Import, Nicht-Sitzungs-Support-/Debug-Materialisierung oder
  Protokollform abdecken.
- `runEmbeddedPiAgent(...)`, vorbereitete Worker-Runs und der innere eingebettete
  Versuch dürfen keine Transkript-Locators akzeptieren. Sie öffnen den
  SQLite-Transkriptmanager über `{agentId, sessionId}` und übergeben diesen Manager
  an die internalisierte PI-kompatible Agent-Sitzung, damit veraltete Aufrufer den
  Runner nicht dazu bringen können, JSON/JSONL-Transkripte zu schreiben.
- Runner-Diagnosen müssen Runtime-/Cache-/Payload-Trace-Datensätze in SQLite
  speichern. Runtime-Diagnosen dürfen keine Override-Regler für JSONL-Dateien oder
  generischen Exporthelfer für Transkript-JSONL offenlegen; benutzerseitige Exporte
  können explizite Artefakte aus Datenbankzeilen materialisieren, ohne Dateinamen
  zurück in die Runtime zu speisen.
- Raw-Stream-Logging verwendet `OPENCLAW_RAW_STREAM=1` plus SQLite-Diagnosezeilen.
  Der alte pi-mono-Dateilogger-Vertrag `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` und
  `raw-openai-completions.jsonl` ist nicht Teil der OpenClaw-Runtime oder -Tests.
- QMD-Memory-Indizierung darf SQLite-Transkripte nicht in Markdown-Dateien exportieren.
  QMD indiziert nur konfigurierte Memory-Dateien; Sitzungstranskriptsuche bleibt
  SQLite-gestützt.
- Der QMD-SDK-Unterpfad ist für neuen Code ausschließlich QMD. SQLite-Helfer zur
  Indizierung von Sitzungstranskripten leben auf
  `memory-core-host-engine-session-transcripts`; jeder QMD-Re-Export ist nur
  Kompatibilität und darf nicht von Runtime-Code verwendet werden.
- Eingebaute Memory-Indizes leben in der besitzenden Agent-Datenbank.
  Runtime-Konfiguration und aufgelöste Runtime-Verträge dürfen
  `memorySearch.store.path` nicht offenlegen; doctor löscht diesen Legacy-Konfigurationsschlüssel,
  und aktueller Code übergibt den Agent-`databasePath` intern.

Implementierungsarbeit sollte weiter Code löschen, bis diese Aussagen ohne Ausnahmen
außerhalb von doctor-/Import-/Export-/Debug-Grenzen wahr sind.

## Zielzustand und Fortschritt

### Hartes Ziel

- Eine globale SQLite-Datenbank verwaltet Control-Plane-Zustand:
  `state/openclaw.sqlite`.
- Eine SQLite-Datenbank pro Agent verwaltet Data-Plane-Zustand:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Die Konfiguration bleibt dateibasiert. `openclaw.json` ist nicht Teil dieses
  Datenbank-Refactors.
- Legacy-Dateien sind nur Eingaben für doctor-Migrationen.
- Die Runtime schreibt oder liest Sitzungs- oder Transkript-JSONL nie als aktiven Zustand.

### Zielzustände

- `not-started`: Runtime-Code aus der Datei-Ära schreibt noch aktiven Zustand.
- `migrating`: doctor-/Importcode kann Dateidaten nach SQLite verschieben.
- `dual-read`: temporäre Brücke liest sowohl SQLite als auch Legacy-Dateien. Dieser
  Zustand ist für diesen Refactor verboten, sofern er nicht ausdrücklich als
  ausschließlich doctor-bezogen dokumentiert ist.
- `sqlite-runtime`: Runtime liest und schreibt nur SQLite.
- `clean`: Legacy-Runtime-APIs und Tests sind entfernt, und die Guard verhindert
  Regressionen.
- `done`: Dokumentation, Tests, Backup, doctor-Migration und geänderte Prüfungen
  belegen den sauberen Zustand.

### Aktueller Zustand

- Sitzungen: `clean` für Runtime. Sitzungszeilen leben in der pro-Agent-Datenbank,
  Runtime-APIs verwenden `{agentId, sessionId}` oder `{agentId, sessionKey}`, und
  `sessions.json` ist nur doctor-Legacy-Eingabe.
- Transkripte: `clean` für Runtime. Transkript-Events, Identitäten, Snapshots und
  Trajectory-Runtime-Events leben in der pro-Agent-Datenbank. Die Runtime akzeptiert
  keine Transkript-Locators oder JSONL-Transkriptpfade mehr.
- Eingebetteter PI-Runner: `clean`. Eingebettete PI-Runs, vorbereitete Worker,
  Compaction und Retry-Schleifen verwenden SQLite-Sitzungsscope und lehnen veraltete
  Transkript-Handles ab.
- Cron: `clean` für Runtime. Die Runtime verwendet `cron_jobs` und `cron_run_logs`;
  Runtime-Tests verwenden SQLite-`storeKey`-Benennung, und Cron-Pfade aus der
  Datei-Ära bleiben nur in doctor-Legacy-Migrationstests.
- Aufgabenregistrierung: `clean`. Aufgaben- und Task-Flow-Runtime-Zeilen leben in
  `state/openclaw.sqlite`; nicht ausgelieferte Sidecar-SQLite-Importer sind gelöscht.
- Plugin-Zustand: `clean`. Plugin-Zustands-/Blob-Zeilen leben in der gemeinsamen
  globalen Datenbank; alte Plugin-Zustands-Sidecar-SQLite-Helfer sind geschützt.
- Memory: `sqlite-runtime` für eingebautes Memory und Sitzungstranskript-Indizierung.
  Memory-Indextabellen leben in der pro-Agent-Datenbank, Plugin-Memory-Zustand
  verwendet gemeinsame Plugin-Zustandszeilen, und Legacy-Memory-Dateien sind
  doctor-Migrationseingaben oder Benutzer-Workspace-Inhalt.
- Backup: `sqlite-runtime`. Backup-Stufen komprimieren SQLite-Snapshots, lassen live
  WAL-/SHM-Sidecars aus, prüfen SQLite-Integrität und erfassen Backup-Runs in der
  globalen Datenbank.
- doctor-Migration: `migrating`, absichtlich. doctor importiert Legacy-JSON, JSONL
  und zurückgezogene Sidecar-Stores in SQLite, erfasst Migrationsläufe/-quellen und
  entfernt erfolgreiche Quellen.
- E2E-Skripte: `clean` für Runtime-Abdeckung. Docker-MCP-Seeding schreibt SQLite-Zeilen.
  Das Runtime-Kontext-Docker-Skript erstellt Legacy-JSONL nur innerhalb des
  doctor-Migrations-Seeds und benennt den Legacy-Sitzungsindexpfad ausdrücklich.

### Verbleibende Arbeit

- [x] Cron-Runtime-Test-Store-Variablen weg von `storePath` umbenennen, sofern
      sie keine doctor-Legacy-Eingaben sind.
      Dateien: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Nachweis: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Veraltete Export-Test-Mocks aus der Datei-Ära entfernen oder umbenennen.
      Datei: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Nachweis: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Den Legacy-JSONL-Seed des Docker-Runtime-Kontexts eindeutig doctor-only machen.
      Datei: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Nachweis: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` zeigt nur
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Kysely-generierte Typen nach jeder Schemaänderung synchron halten.
      Dateien: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Nachweis: keine Schemaänderung in diesem Durchlauf; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Fokussierte Tests für berührte Stores, Befehle und Skripte erneut ausführen.
      Nachweis: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Vor der Erklärung von `done` das Changed-Gate oder breiten Remote-Nachweis ausführen.
      Nachweis: `pnpm check:changed --timed -- <changed extension paths>` bestand auf
      Hetzner-Crabbox-Run `run_3f1cabf6b25c` nach temporärem Node-24-/pnpm-Setup und
      explizitem Pfad-Routing für den synchronisierten Workspace ohne `.git`.

### Nicht regressieren

- Keine Transkript-Locators.
- Keine aktiven Sitzungsdateien.
- Keine unechten JSONL-Test-Fixtures außer doctor-Legacy-Migrationstests.
- Kein direkter SQLite-Zugriff, wo Kysely erwartet wird.
- Keine neuen Legacy-DB-Migrationen. Dieses Layout wurde nicht ausgeliefert; die
  Schemaversion bleibt bei `1`, sofern es keinen starken Grund gibt.

## Code-Read-Annahmen

Keine Folgeentscheidungen zum Produkt blockieren diesen Plan. Die Implementierung sollte
mit diesen Annahmen fortfahren:

- Verwenden Sie `node:sqlite` direkt und setzen Sie die Node-22+-Runtime für diesen
  Speicherpfad voraus.
- Behalten Sie genau eine normale Konfigurationsdatei bei. Verschieben Sie
  Konfiguration, Plugin-Manifeste oder Git-Workspaces in diesem Refactor nicht
  nach SQLite.
- Runtime-Kompatibilitätsdateien sind nicht erforderlich. Alte JSON- und
  JSONL-Dateien sind nur Migrationseingaben. Die branch-lokalen SQLite-Sidecars
  wurden nie ausgeliefert und werden gelöscht statt importiert.
- `openclaw doctor --fix` besitzt den alten Migrationsschritt von Dateien zur
  Datenbank. Runtime-Start und `openclaw migrate` sollten keine alten
  OpenClaw-Datenbank-Upgrade-Pfade tragen.
- Die Kompatibilität für Anmeldedaten folgt derselben Regel:
  Runtime-Anmeldedaten liegen in SQLite. Alte Dateien `auth-profiles.json`,
  agent-spezifische `auth.json` und gemeinsame
  `credentials/oauth.json`-Dateien sind Migrationseingaben für doctor und werden
  nach dem Import entfernt.
- Der generierte Modellkatalogzustand ist datenbankgestützt. Runtime-Code darf
  `agents/<agentId>/agent/models.json` nicht schreiben; vorhandene
  `models.json`-Dateien sind alte doctor-Eingaben und werden nach dem Import in
  `agent_model_catalogs` entfernt.
- Die Runtime darf Transcript-Locators nicht migrieren, normalisieren oder
  überbrücken. Die aktive Transcript-Identität ist `{agentId, sessionId}` in
  SQLite. Dateipfade sind nur alte doctor-Eingaben, und
  `sqlite-transcript://...` muss aus Runtime-, Protokoll-, Hook- und
  Plugin-Oberflächen verschwinden, statt als Boundary-Handle behandelt zu werden.
- Runtime-SQLite-Transcript-Lesevorgänge führen keine alten Migrationen für die
  JSONL-Eintragsform aus und schreiben keine ganzen Transcripts aus
  Kompatibilitätsgründen neu. Die Normalisierung alter Einträge bleibt in
  expliziten doctor-/Import-Hilfsprogrammen. Doctor normalisiert alte
  JSONL-Transcript-Dateien, bevor SQLite-Zeilen eingefügt werden; aktuelle
  Runtime-Zeilen werden bereits im aktuellen Transcript-Schema geschrieben.
  Trajectory-/Session-Export liest diese Zeilen unverändert und darf keine
  Alt-Migrationen zum Exportzeitpunkt ausführen.
- Alte JSONL-Parse-/Migrationshelfer für Transcripts sind nur für doctor
  vorgesehen. Runtime-Transcript-Formatcode erstellt nur aktuellen
  SQLite-Transcript-Kontext; doctor besitzt alte JSONL-Eintrags-Upgrades, bevor
  Zeilen eingefügt werden.
- Der alte Runtime-eigene JSONL-Streaming-Helfer für Transcripts wurde gelöscht.
  Doctor-Importcode besitzt explizite alte Dateilesevorgänge; die
  Runtime-Session-Historie liest SQLite-Zeilen.
- Codex-App-Server-Bindings verwenden die OpenClaw-`sessionId` als
  kanonischen Schlüssel im Codex-Plugin-State-Namespace. `sessionKey` ist
  Metadaten für Routing/Anzeige und darf weder die dauerhafte Session-ID
  ersetzen noch die Transcript-Dateiidentität wiederbeleben.
- Context-Engines erhalten den aktuellen Runtime-Vertrag direkt. Die Registry
  darf Engines nicht mit Retry-Shims umhüllen, die `sessionKey`,
  `transcriptScope` oder `prompt` löschen; Engines, die die aktuellen
  datenbankorientierten Parameter nicht akzeptieren können, sollten deutlich
  fehlschlagen, statt überbrückt zu werden.
- Die Backup-Ausgabe sollte weiterhin eine Archivdatei bleiben.
  Datenbankinhalte sollten als kompakte SQLite-Snapshots in dieses Archiv
  gelangen, nicht als rohe Live-WAL-Sidecars.
- Transcript-Suche ist nützlich, aber für den ersten datenbankorientierten
  Schnitt nicht erforderlich. Entwerfen Sie das Schema so, dass FTS später
  hinzugefügt werden kann.
- Worker-Ausführung sollte experimentell hinter Einstellungen bleiben, während
  sich die Datenbankgrenze stabilisiert.

## Ergebnisse der Code-Lektüre

Der aktuelle Branch ist bereits über die Proof-of-Concept-Phase hinaus. Die
gemeinsame Datenbank existiert, Node-`node:sqlite` ist über einen kleinen
Runtime-Helfer verdrahtet, und frühere Stores schreiben jetzt in
`state/openclaw.sqlite` oder in die zuständige `openclaw-agent.sqlite`-Datenbank.

Die verbleibende Arbeit besteht nicht darin, SQLite auszuwählen, sondern darin,
die neue Grenze sauber zu halten und alle kompatibilitätsförmigen Schnittstellen
zu löschen, die noch wie die alte Dateiwelt aussehen:

- Session-`storePath` ist keine Runtime-Identität, Test-Fixture-Form oder
  Status-Payload-Feld mehr. Runtime- und Bridge-Tests enthalten den
  Vertragsnamen `storePath` nicht mehr; doctor-/Migrationscode besitzt dieses
  alte Vokabular.
- Session-Schreibvorgänge laufen nicht mehr über die alte In-Process-Queue
  `store-writer.ts`. SQLite-Patch-Schreibvorgänge verwenden stattdessen
  Konflikterkennung und begrenzte Wiederholungen.
- Alte Pfaderkennung hat weiterhin gültige Migrationszwecke, aber Runtime-Code
  sollte aufhören, `sessions.json` und Transcript-JSONL-Dateien als mögliche
  Schreibziele zu behandeln.
- Agent-eigene Tabellen liegen in agent-spezifischen SQLite-Datenbanken. Die
  globale Datenbank hält Registry-/Control-Plane-Zeilen; die
  Transcript-Identität ist `{agentId, sessionId}` in den agent-spezifischen
  Transcript-Zeilen. Runtime-Code darf keine Transcript-Dateipfade persistieren
  oder Transcript-Locators migrieren.
- Doctor importiert bereits mehrere alte Dateien. Die Bereinigung besteht darin,
  daraus eine einzelne explizite Migrationsimplementierung zu machen, die doctor
  aufruft, mit einem dauerhaften Migrationsbericht.

Keine zusätzlichen Produktfragen blockieren die Implementierung.

## Aktuelle Code-Form

Der Branch hat bereits eine echte gemeinsame SQLite-Basis:

- Die Runtime-Untergrenze ist jetzt Node 22+: `package.json`, die CLI-Runtime-Prüfung,
  Installer-Defaults, macOS-Runtime-Locator, CI und öffentliche Installationsdokumentation
  stimmen alle überein. Die alte Node-22-Kompatibilitäts-Lane wurde entfernt.
- `src/state/openclaw-state-db.ts` öffnet `openclaw.sqlite`, setzt WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` und wendet
  das generierte Schemamodul an, das aus
  `src/state/openclaw-state-schema.sql` abgeleitet wird.
- Kysely-Tabellentypen und Runtime-Schemamodule werden aus wegwerfbaren
  SQLite-Datenbanken generiert, die aus den committeten `.sql`-Dateien erstellt
  werden; Runtime-Code hält keine kopierten Schemastrings mehr für globale,
  agentenspezifische oder Proxy-Capture-Datenbanken vor.
- Runtime-Stores leiten ausgewählte und eingefügte Zeilentypen aus diesen
  generierten Kysely-`DB`-Interfaces ab, statt SQLite-Zeilenformen manuell zu
  spiegeln. Raw SQL bleibt auf Schemaanwendung, Pragmas und migrationsreines DDL
  beschränkt.
- Die SQLite-Schemas sind auf `user_version = 1` zusammengeführt, weil dieses
  Datenbanklayout noch nicht ausgeliefert wurde. Runtime-Öffner erstellen nur
  das aktuelle Schema; Datei-zu-Datenbank-Import bleibt im Doctor-Code, und
  branch-lokale Datenbank-Upgrade-Helfer wurden gelöscht.
- Relationale Zuständigkeit wird dort durchgesetzt, wo die Zuständigkeitsgrenze
  kanonisch ist: Quellmigrationszeilen kaskadieren von `migration_runs`,
  Task-Zustellstatus kaskadiert von `task_runs`, und
  Transkript-Identitätszeilen kaskadieren von Transkriptereignissen.
- Aktuelle Shared-Tabellen umfassen `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` und `backup_runs`.
- Beliebiger Plugin-eigener State erhält keine host-eigenen typisierten Tabellen.
  Installierte Plugins verwenden `plugin_state_entries` für versionierte
  JSON-Payloads und `plugin_blob_entries` für Bytes, mit
  Namespace-/Key-Zuständigkeit, TTL-Bereinigung, Backup und
  Plugin-Migrationsdatensätzen. Host-eigener Plugin-Orchestrierungs-State kann
  weiterhin typisierte Tabellen haben, wenn der Host den Abfragevertrag besitzt,
  etwa `plugin_binding_approvals`.
- Plugin-Migrationen sind Datenmigrationen über Plugin-eigene Namespaces, keine
  Host-Schemamigrationen. Ein Plugin kann seine eigenen versionierten
  State-/Blob-Einträge über einen Migrations-Provider migrieren, und der Host
  erfasst Quell-/Ausführungsstatus im normalen Migrationsledger. Neue
  Plugin-Installationen erfordern keine Änderung an
  `openclaw-state-schema.sql`, sofern nicht der Host selbst die Zuständigkeit
  für einen neuen Plugin-übergreifenden Vertrag übernimmt.
- `src/state/openclaw-agent-db.ts` öffnet
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registriert die Datenbank in
  der globalen DB und besitzt agentenlokale Sitzungs-, Transkript-, VFS-,
  Artefakt-, Cache- und Memory-Index-Tabellen. Shared-Runtime-Discovery liest
  jetzt die generiert typisierte `agent_databases`-Registry, statt diese Abfrage
  an jedem Callsite erneut zu implementieren.
- Globale und agentenspezifische Datenbanken erfassen eine `schema_meta`-Zeile
  mit Datenbankrolle, Schemaversion, Zeitstempeln und Agent-ID für
  Agent-Datenbanken. Das Layout bleibt weiterhin bei `user_version = 1`, weil
  dieses SQLite-Schema noch nicht ausgeliefert wurde.
- Agentenspezifische Sitzungsidentität hat jetzt eine kanonische
  `sessions`-Root-Tabelle mit Schlüssel `session_id`, mit `session_key`,
  `session_scope`, `account_id`, `primary_conversation_id`, Zeitstempeln,
  Anzeigefeldern, Modellmetadaten, Harness-ID und Parent-/Spawn-Verknüpfung als
  abfragbaren Spalten. `session_routes` ist der eindeutige aktive Routenindex von
  `session_key` zur aktuellen `session_id`, sodass ein Routenschlüssel in eine
  frische dauerhafte Sitzung wechseln kann, ohne dass Hot Reads zwischen
  duplizierten `sessions.session_key`-Zeilen wählen müssen. Der alte
  kompatibilitätsförmige Payload `session_entries.entry_json` hängt per
  Fremdschlüssel an der dauerhaften `session_id`-Root; er ist nicht mehr die
  einzige Darstellung einer Sitzung auf Schemaebene.
- Agentenspezifische externe Konversationsidentität ist ebenfalls relational:
  `conversations` speichert normalisierte Provider-/Account-/Konversationsidentität,
  und `session_conversations` verknüpft eine OpenClaw-Sitzung mit einer oder
  mehreren externen Konversationen. Dies deckt Shared-Main-DM-Sitzungen ab, bei
  denen mehrere Peers absichtlich auf eine Sitzung abgebildet werden können,
  ohne in `session_key` zu lügen. SQLite erzwingt außerdem Eindeutigkeit für die
  natürliche Provider-Identität, sodass dasselbe
  Channel-/Account-/Kind-/Peer-/Thread-Tupel nicht über Konversations-IDs hinweg
  aufgespalten werden kann. Shared-Main-Direkt-Peers werden mit einer
  `participant`-Rolle verknüpft, sodass eine OpenClaw-Sitzung mehrere externe
  DM-Peers darstellen kann, ohne ältere Peers in vage verwandte Zeilen
  herabzustufen. `sessions.primary_conversation_id` zeigt weiterhin auf das
  aktuelle typisierte Zustellziel. Geschlossene Routing-/Statusspalten werden
  mit SQLite-`CHECK`-Constraints erzwungen, statt sich nur auf TypeScript-Unions
  zu verlassen.
  Die Runtime-Sitzungsprojektion bereinigt Kompatibilitäts-Routing-Schatten aus
  `session_entries.entry_json`, bevor typisierte Sitzungs-/Konversationsspalten
  angewendet werden, sodass veraltete JSON-Payloads keine Zustellziele wieder
  hervorholen können.
  Subagent-Ankündigungsrouting erfordert ebenfalls den typisierten
  SQLite-Zustellkontext; es fällt nicht mehr auf
  Kompatibilitäts-`SessionEntry`-Routenfelder zurück.
  Gateway-`chat.send`-explizite Zustellvererbung liest den typisierten
  SQLite-Zustellkontext statt `origin`-/`last*`-Kompatibilitätsfeldern.
  `tools.effective` leitet Provider-/Account-/Thread-Kontext ebenfalls aus
  typisierten SQLite-Zustell-/Routingzeilen ab, nicht aus veralteten
  `last*`-Schatten in Sitzungseinträgen.
  Systemereignis-Prompt-Kontext baut Channel-/To-/Account-/Thread-Felder aus
  typisierten Zustellfeldern statt aus `origin`-Schatten neu auf.
  Der gemeinsame Helfer `deliveryContextFromSession` und der
  Sitzung-zu-Konversation-Mapper ignorieren `SessionEntry.origin` jetzt
  vollständig; nur typisierte Zustellfelder und relationale Konversationszeilen
  können Hot-Route-Identität erzeugen.
  Die Runtime-Normalisierung von Sitzungseinträgen entfernt `origin`, bevor
  `entry_json` persistiert oder projiziert wird, und eingehende Metadaten
  schreiben typisierte Channel-/Chat-Felder plus relationale Konversationszeilen,
  statt neue Origin-Schatten zu erstellen.
- Transkriptereignisse, Transkriptsnapshots und Trajectory-Runtime-Ereignisse
  referenzieren jetzt die kanonische agentenspezifische `sessions`-Root und
  kaskadieren bei Sitzungs deletion. Transkript-Identitäts-/Idempotenzzeilen
  kaskadieren weiterhin von der exakten Transkriptereigniszeile.
- Memory-Core-Indizes verwenden jetzt explizite Agent-Datenbanktabellen
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` und
  `memory_embedding_cache`, wobei `memory_index_state` Revisionsänderungen
  verfolgt. Optionale FTS-/Vektor-Side-Indizes heißen
  `memory_index_chunks_fts` und `memory_index_chunks_vec` statt generischer
  Tabellen `meta`, `files`, `chunks`, `chunks_fts` oder `chunks_vec`. Die
  kanonischen Namen behalten die aktuelle Pfad-/Quellzeilenform und
  serialisierte Embedding-Kompatibilität bei. Diese Tabellen sind abgeleiteter
  Such-Cache, kein kanonischer Transkriptspeicher; sie können gelöscht und aus
  Memory-Workspace-Dateien und konfigurierten Quellen neu aufgebaut werden.
  Beim Öffnen eines ausgelieferten Memory-Index mit generischem Namen werden
  dessen Metadaten, Quellen, Chunks und Embedding-Cache in die kanonischen
  Tabellen migriert; abgeleitete FTS-/Vektortabellen werden unter ihren
  kanonischen Namen neu aufgebaut.
- Subagent-Ausführungswiederherstellungs-State lebt jetzt in typisierten Shared-
  `subagent_runs`-Zeilen mit indizierten Child-, Requester- und
  Controller-Sitzungsschlüsseln. Die alte Datei `subagents/runs.json` ist nur
  noch Doctor-Migrationseingabe.
- Aktuelle Konversationsbindungen leben jetzt in typisierten Shared-
  `current_conversation_bindings`-Zeilen mit Schlüssel nach normalisierter
  Konversations-ID, mit Ziel-Agent-/Sitzungsspalten, Konversationsart, Status,
  Ablauf und Metadaten als relationale Spalten statt als dupliziertem opakem
  Bindungsdatensatz. Der dauerhafte Bindungsschlüssel enthält die normalisierte
  Konversationsart, sodass Direct-/Group-/Channel-Refs nicht kollidieren können,
  und SQLite weist ungültige Binding-Kind-/Statuswerte zurück. Die alte Datei
  `bindings/current-conversations.json` ist nur noch Doctor-Migrationseingabe.
- Die Zustellwarteschlangen-Wiederherstellung legt jetzt typisierte
  Warteschlangenspalten für Channel, Ziel, Account, Sitzung, Retry, Fehler,
  Plattformversand und Wiederherstellungsstatus über das Replay-JSON.
  `entry_json` behält die Replay-Payloads, Hooks und Formatierungs-Payloads,
  aber typisierte Spalten sind maßgeblich für Hot-Queue-Routing/-State.
- TUI-Zeiger für die Wiederherstellung der letzten Sitzung leben jetzt in
  typisierten Shared-`tui_last_sessions`-Zeilen mit Schlüssel nach dem gehashten
  TUI-Verbindungs-/Sitzungs-Scope. Die alte TUI-JSON-Datei ist nur noch
  Doctor-Migrationseingabe.
- Standard-TTS-Einstellungen leben jetzt in Shared-Plugin-State-SQLite-Zeilen
  mit Schlüssel unter dem `speech-core`-Plugin. Die alte Datei
  `settings/tts.json` ist nur noch Doctor-Migrationseingabe; die Runtime liest
  oder schreibt keine TTS-Einstellungs-JSON-Dateien mehr, und der Legacy-
  Pfadauflöser lebt im Doctor-Migrationsmodul.
- Secret-Zielmetadaten sprechen jetzt von Stores, statt vorzugeben, jedes
  Credential-Ziel sei eine Konfigurationsdatei. `openclaw.json` bleibt der
  Konfigurations-Store; Auth-Profile-Ziele verwenden typisierte
  SQLite-`auth_profile_stores`-Zeilen mit providerförmigen Credentials als
  JSON-Payloads.
- Secret-Audit scannt keine ausgemusterten agentenspezifischen `auth.json`-
  Dateien mehr. Doctor ist für Warnung vor, Import von und Entfernung dieser
  Legacy-Datei zuständig.
- Legacy-Helfer für Auth-Profilpfade leben jetzt im Doctor-Legacy-Code. Core-
  Helfer für Auth-Profilpfade stellen SQLite-Auth-Store-Identität und
  Anzeigeorte bereit, nicht Runtime-Pfade `auth-profiles.json` oder
  `auth-state.json`.
- Runtime-Module für Subagent-Ausführungswiederherstellung und OpenRouter-
  Modellfähigkeits-Cache halten SQLite-Snapshot-Reader/-Writer jetzt getrennt
  von doctorreinen Legacy-JSON-Importhelfern. OpenRouter-Fähigkeiten verwenden
  die typisierten generischen `model_capability_cache`-Zeilen unter
  `provider_id = "openrouter"` statt eines opaken Cache-Blobs oder einer
  provider-spezifischen Host-Tabelle. Subagent-Ausführungs-`taskName` wird in
  der typisierten Spalte `subagent_runs.task_name` gespeichert; die
  `payload_json`-Kopie ist Replay-/Debug-Daten, nicht die Quelle für
  Hot-Anzeige- oder Lookup-Felder.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementiert ein SQLite-
  VFS über der Agent-Datenbanktabelle `vfs_entries`. Verzeichnislesevorgänge,
  rekursive Exporte, Löschungen und Umbenennungen verwenden indizierte
  `(namespace, path)`-Präfixbereiche, statt einen ganzen Namespace zu scannen
  oder sich auf `LIKE`-Pfadabgleiche zu verlassen.
- `src/agents/runtime-worker.entry.ts` erstellt pro Ausführung SQLite-VFS-,
  Tool-Artefakt-, Ausführungsartefakt- und scoped Cache-Stores für Worker.
- Abschlussmarker für Workspace-Bootstrap leben jetzt in typisierten Shared-
  `workspace_setup_state`-Zeilen mit Schlüssel nach aufgelöstem Workspace-Pfad
  statt in `.openclaw/workspace-state.json`; die Runtime liest oder überschreibt
  den Legacy-Workspace-Marker nicht mehr, und Helfer-APIs reichen keinen
  falschen `.openclaw/setup-state`-Pfad mehr herum, nur um Speicheridentität
  abzuleiten.
- Exec-Genehmigungen leben jetzt in der typisierten Shared-SQLite-
  `exec_approvals_config`-Singleton-Zeile. Doctor importiert das Legacy-
  `~/.openclaw/exec-approvals.json`; Runtime-Schreibvorgänge erstellen,
  überschreiben oder melden diese Datei nicht mehr als aktiven Store-Speicherort.
  Der macOS-Companion liest und schreibt dieselbe
  `state/openclaw.sqlite`-Tabellenzeile; er behält nur den Unix-Prompt-Socket
  auf der Festplatte, weil das IPC ist, kein dauerhafter Runtime-State.
- Device-Identity-, Device-Auth- und Bootstrap-Runtime-Module halten ihre
  SQLite-Snapshot-Reader/-Writer jetzt getrennt von doctorreinen
  Legacy-JSON-Importhelfern. Device-Identity verwendet typisierte
  `device_identities`-Zeilen, und Device-Auth-Token verwenden typisierte
  `device_auth_tokens`-Zeilen. Device-Auth-Schreibvorgänge gleichen Zeilen nach
  Gerät/Rolle ab, statt die Token-Tabelle zu leeren, und die Runtime leitet
  Einzel-Token-Updates nicht mehr durch den alten Whole-Store-Adapter. Das Legacy
  Version-1-JSON-Payloads existieren nur als Doctor-Import-/Export-Formate.
- Der GitHub Copilot-Cache für den Token-Austausch verwendet die gemeinsame SQLite-Plugin-State-Tabelle
  unter `github-copilot/token-cache/default`. Es handelt sich um Provider-eigenen Cache-State,
  daher wird absichtlich keine Host-Schematabelle hinzugefügt.
- GitHub Copilot-Compaction schreibt keine `openclaw-compaction-*.json`-
  Workspace-Sidecars mehr. Das Harness ruft die SDK-History-Compaction-RPC für die
  verfolgte SDK-Sitzung auf, und OpenClaw speichert dauerhaften Sitzungs-/Transkript-State in
  SQLite statt in Kompatibilitäts-Markierungsdateien.
- Die gemeinsame Swift-Runtime (`OpenClawKit`) verwendet dieselben
  `state/openclaw.sqlite`-Zeilen für Geräteidentität und Geräteauthentifizierung. macOS-App-
  Helfer importieren die gemeinsamen SQLite-Helfer, statt einen zweiten JSON- oder
  SQLite-Pfad zu besitzen. Eine übrig gebliebene veraltete `identity/device.json` blockiert die Identitätserstellung,
  bis Doctor sie in SQLite importiert, entsprechend dem TypeScript- und Android-
  Startup-Gate.
- Die Android-Geräteidentität verwendet dasselbe TypeScript-kompatible Schlüsselmaterial,
  das in typisierten `state/openclaw.sqlite#table/device_identities`-Zeilen gespeichert ist. Sie liest oder schreibt niemals
  `openclaw/identity/device.json`; eine übrig gebliebene veraltete Datei blockiert
  den Start, bis Doctor sie in SQLite importiert.
- Auch zwischengespeicherte Android-Geräteauthentifizierungstoken verwenden typisierte
  `state/openclaw.sqlite#table/device_auth_tokens`-Zeilen und teilen dieselbe
  Version-1-Token-Semantik wie TypeScript und Swift. Die Runtime liest keine `SecurePrefs`-
  `gateway.deviceToken*`-Kompatibilitätsschlüssel mehr; diese gehören nur in die Migrations-/Doctor-
  Logik.
- Der Android-Benachrichtigungsverlauf für zuletzt verwendete Pakete verwendet typisierte
  `android_notification_recent_packages`-Zeilen. Die Runtime migriert oder liest die alten SharedPreferences-CSV-Schlüssel nicht mehr.
- Die Erstellung der Geräteidentität schlägt fail-closed fehl, wenn eine veraltete `identity/device.json`
  existiert, wenn die SQLite-Identitätszeile ungültig ist oder wenn der SQLite-Identitäts-
  Store nicht geöffnet werden kann. Doctor importiert und entfernt diese Datei zuerst, sodass der Runtime-
  Start die Pairing-Identität vor der Migration nicht stillschweigend rotieren kann.
- Die Auswahl der Geräteidentität ist ein SQLite-Zeilenschlüssel, kein JSON-Datei-Locator. Tests
  und Gateway-Helfer übergeben explizite Identitätsschlüssel; nur die Doctor-Migration und das
  fail-closed-Startup-Gate kennen den stillgelegten Dateinamen `identity/device.json`.
- Die Kompatibilität für Sitzungszurücksetzungen liegt jetzt in der Doctor-Konfigurationsmigration:
  `session.idleMinutes` wird nach `session.reset.idleMinutes` verschoben,
  `session.resetByType.dm` wird nach `session.resetByType.direct` verschoben, und die
  Runtime-Zurücksetzungsrichtlinie liest nur kanonische Zurücksetzungsschlüssel.
- Die Kompatibilität für veraltete Konfigurationen liegt jetzt unter `src/commands/doctor/`. Die normale
  `readConfigFileSnapshot()`-Validierung importiert keine veralteten Doctor-Detektoren
  und annotiert keine veralteten Probleme; `runDoctorConfigPreflight()` fügt diese Probleme für
  Doctor-Reparatur/-Berichterstattung hinzu. Der Doctor-Konfigurationsablauf importiert
  `src/commands/doctor/legacy-config.ts`, und die alte Reparatur von OAuth-Profil-IDs liegt
  unter
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Nicht-Doctor-Befehle führen keine veraltete Konfigurationsreparatur automatisch aus. Zum Beispiel
  schlägt `openclaw update --channel` jetzt bei ungültiger veralteter Konfiguration fehl und fordert
  Benutzer auf, Doctor auszuführen, statt stillschweigend Doctor-Migrationscode zu importieren.
- Web Push, APNs, Voice Wake, Update-Prüfungen und Konfigurationszustand verwenden jetzt typisierte gemeinsame SQLite-
  Tabellen für Abonnements, VAPID-Schlüssel, Node-Registrierungen, Trigger-Zeilen,
  Routing-Zeilen, Update-Benachrichtigungs-State und Konfigurationszustandseinträge statt
  vollständig undurchsichtiger JSON-Blobs. Snapshot-Schreibvorgänge für Web Push und APNs gleichen
  Abonnements/Registrierungen jetzt nach Primärschlüssel ab, statt ihre Tabellen zu leeren;
  der Konfigurationszustand macht dasselbe nach Konfigurationspfad.
  Ihre Runtime-Module halten SQLite-Snapshot-Leser/-Schreiber getrennt von
  nur für Doctor bestimmten Importhelfern für veraltetes JSON.
- Die Node-Host-Konfiguration verwendet jetzt eine typisierte Singleton-Zeile in der gemeinsamen SQLite-Datenbank;
  Doctor importiert die alte `node.json`-Datei vor der normalen Runtime-Nutzung.
- Geräte-/Node-Pairing, Channel-Pairing, Channel-Allowlists und Bootstrap-State
  verwenden jetzt typisierte SQLite-Zeilen statt vollständig undurchsichtiger JSON-Blobs. Plugin-Binding-
  Genehmigungen und Cron-Job-State folgen derselben Aufteilung: Runtime-Module stellen
  SQLite-gestützte Operationen und neutrale Snapshot-Helfer bereit, und Pairing/Bootstrap
  sowie Snapshot-Schreibvorgänge für Plugin-Binding-Genehmigungen gleichen Zeilen nach Primärschlüssel
  ab, statt Tabellen zu leeren, während Doctor die alten JSON-Dateien über
  `src/commands/doctor/legacy/*`-Module importiert/entfernt.
- Installierte Plugin-Datensätze liegen jetzt im SQLite-Index für installierte Plugins.
  Runtime-Konfigurationslesen/-schreiben migriert oder bewahrt alte
  `plugins.installs`-Authoring-Konfigurationsdaten nicht mehr; Doctor importiert diese veraltete Konfigurations-
  Form vor der normalen Runtime-Nutzung in SQLite.
- QQBot-Snapshots zur Wiederherstellung von Anmeldedaten liegen jetzt im SQLite-Plugin-State unter
  `qqbot/credential-backups`. Die Runtime schreibt keine
  `qqbot/data/credential-backup*.json` mehr; der QQBot-Doctor-Vertrag importiert und
  archiviert diese veralteten Backup-Dateien aus dem aktiven State-Verzeichnis.
- Die Gateway-Neuladeplanung vergleicht Snapshots des SQLite-Index für installierte Plugins unter
  einem internen Diff-Namespace `installedPluginIndex.installRecords.*`. Runtime-
  Neuladeentscheidungen verpacken diese Zeilen nicht mehr in künstliche `plugins.installs`-Konfigurations-
  Objekte.
- Das Upgrade von Anmeldedaten für benannte Matrix-Konten erfolgt nicht mehr während Runtime-
  Lesevorgängen. Doctor besitzt die alte Umbenennung von `credentials/matrix/credentials.json`
  auf oberster Ebene, wenn ein einzelnes/standardmäßiges Matrix-Konto aufgelöst werden kann.
- Core-Pairing- und Cron-Runtime-Module exportieren keine Builder für veraltete JSON-Pfade
  mehr. Doctor-eigene Legacy-Module erstellen `pending.json`-, `paired.json`-,
  `bootstrap.json`- und `cron/jobs.json`-Quellpfade nur für Importtests und
  Migration. Die Normalisierung veralteter Cron-Job-Formen und der Import von Cron-Ausführungslogs
  liegen unter `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importiert veraltete JSON-State-
  Dateien, einschließlich Node-Host-Konfiguration, aus Doctor in SQLite. Neue Importer für veraltete Dateien
  bleiben unter `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importiert veraltete `sessions.json`- und
  `*.jsonl`-Transkripte direkt in SQLite und entfernt erfolgreiche Quellen. Es
  stellt Root-Legacy-Transkripte nicht mehr über
  `agents/<agentId>/sessions/*.jsonl` bereit und erstellt vor dem Import kein kanonisches JSONL-Ziel mehr.
- Doctor-Prüfungen der State-Integrität scannen keine veralteten Sitzungsverzeichnisse mehr und
  bieten keine Löschung verwaister JSONL-Dateien an. Veraltete Transkriptdateien sind nur
  Migrationseingaben, und der Migrationsschritt besitzt Import plus Quellenentfernung.
- Der Import der veralteten Sandbox-Registry liegt unter
  `src/commands/doctor/legacy/sandbox-registry.ts`; aktive Sandbox-Registry-
  Lese- und Schreibvorgänge bleiben ausschließlich SQLite-basiert.
- Die Reparatur für veraltete Sitzungstranskript-Zustandsprüfung/-Import liegt unter
  `src/commands/doctor/legacy/session-transcript-health.ts`; Runtime-Befehls-
  Module enthalten keine JSONL-Transkriptanalyse oder Reparaturcode für aktive Branches mehr.

Abgeschlossene Highlights zu Konsolidierung/Löschung:

- Der Plugin-Zustand verwendet jetzt die gemeinsame Datenbank `state/openclaw.sqlite`. Der alte
  branch-lokale Sidecar-Importer `plugin-state/state.sqlite` wurde entfernt, weil
  dieses SQLite-Layout nie ausgeliefert wurde. Probe-/Test-Helper melden den gemeinsamen
  `databasePath`, statt einen Plugin-Zustand-spezifischen SQLite-Pfad offenzulegen.
- Task- und TaskFlow-Runtime-Tabellen liegen jetzt in der gemeinsamen
  Datenbank `state/openclaw.sqlite` statt in `tasks/runs.sqlite` und
  `tasks/flows/registry.sqlite`; die alten Sidecar-Importer wurden aus demselben
  Grund des nicht ausgelieferten Layouts entfernt.
- `src/config/sessions/store.ts` benötigt `storePath` nicht mehr für eingehende
  Metadaten, Routenaktualisierungen oder updated-at-Lesezugriffe. Befehls-Persistenz, CLI-
  Sitzungsbereinigung, Subagent-Tiefe, Auth-Überschreibungen und Transkript-Sitzungsidentität
  verwenden Agent-/Sitzungszeilen-APIs. Schreibvorgänge werden als SQLite-Zeilen-Patches
  mit optimistischer Konflikt-Wiederholung angewendet.
- Die Sitzungszielauflösung stellt jetzt Datenbankziele pro Agent bereit, keine Legacy-
  `sessions.json`-Pfade. Gemeinsamer Gateway, ACP-Metadaten, Doctor-Routenreparatur und
  `openclaw sessions` listen `agent_databases` plus konfigurierte Agenten auf.
- Gateway-Sitzungsrouting verwendet jetzt `resolveGatewaySessionDatabaseTarget`; das
  zurückgegebene Ziel enthält `databasePath` und mögliche SQLite-Zeilenschlüssel statt
  eines Legacy-Dateipfads zum Sitzungsspeicher.
- Channel-Sitzungs-Runtime-Typen legen jetzt `{agentId, sessionKey}` für
  updated-at-Lesezugriffe, eingehende Metadaten und letzte Routenaktualisierungen offen.
  Der alte Kompatibilitätstyp `saveSessionStore(storePath, store)` ist entfernt.
- Plugin-Runtime, Erweiterungs-API und `config/sessions`-Barrel-Oberflächen lenken
  Plugin-Code jetzt zu SQLite-gestützten Helpern für Sitzungszeilen. Kompatibilitäts-
  Exporte der Root-Bibliothek (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`)
  bleiben als veraltete Shims für bestehende Consumer erhalten. Der alte
  Helper `resolveLegacySessionStorePath` ist entfernt; die Legacy-
  `sessions.json`-Pfadkonstruktion ist jetzt lokal auf Migrationen und Test-Fixtures begrenzt.
- `src/config/sessions/session-entries.sqlite.ts` speichert kanonische Sitzungseinträge
  jetzt in der Datenbank pro Agent und unterstützt zeilenbezogene read/upsert/delete-Patches.
  Runtime-Upsert/-Patch/-Delete sucht nicht mehr nach Groß-/Kleinschreibungsvarianten und
  entfernt keine Legacy-Alias-Schlüssel; Doctor ist für die Kanonisierung zuständig. Der
  eigenständige JSON-Import-Helper ist entfernt, und Migrationen führen neuere Zeilen per Upsert
  zusammen, statt die gesamte Sitzungstabelle zu ersetzen. Öffentliche read/list/load-Helper
  projizieren aktuelle Sitzungsmetadaten aus typisierten `sessions`- und `conversations`-Zeilen;
  `entry_json` ist ein Kompatibilitäts-/Debug-Schatten und kann veraltet oder ungültig sein,
  ohne dass typisierte Sitzungsidentität oder Zustellungskontext verloren gehen.
- `src/config/sessions/delivery-info.ts` löst den Zustellungskontext jetzt aus den
  typisierten Zeilen `sessions` + `conversations` + `session_conversations` pro Agent auf.
  Es rekonstruiert die Runtime-Zustellungsidentität nicht mehr aus
  `session_entries.entry_json`; eine fehlende typisierte Konversationszeile ist ein Doctor-
  Migrations-/Reparaturproblem, kein Runtime-Fallback.
- Entscheidungen zum Zurücksetzen gespeicherter Sitzungen bevorzugen jetzt typisierte Metadaten
  aus `sessions.session_scope`, `sessions.chat_type` und `sessions.channel`. `sessionKey`-
  Parsing bleibt nur für explizite Thread-/Topic-Suffixe bei Befehlszielen erhalten; die
  Klassifizierung Gruppe vs. direkt stammt nicht mehr aus der Schlüsselstruktur.
- Die Klassifizierung der Sitzungslisten-/Statusanzeige verwendet jetzt typisierte Chat-
  Metadaten und die Gateway-Sitzungsart. Sie behandelt `:group:`- oder `:channel:`-
  Teilstrings in `session_key` nicht mehr als dauerhafte Wahrheit für Gruppe/direkt.
- Die Auswahl der Silent-Reply-Richtlinie verwendet jetzt nur explizite Konversationstypen
  oder Oberflächenmetadaten. Sie errät die Direkt-/Gruppenrichtlinie nicht mehr aus
  `session_key`-Teilstrings.
- Die Modellauflösung für die Sitzungsanzeige erhält jetzt die Agent-ID aus dem SQLite-
  Sitzungsdatenbankziel, statt sie aus `session_key` herauszutrennen.
- Die Hydratisierung von Agent-zu-Agent-Ankündigungszielen verwendet jetzt nur typisierte
  `deliveryContext` aus `sessions.list`. Sie stellt Channel-/Konto-/Thread-Routing nicht
  mehr aus Legacy-`origin`, gespiegelten `last*`-Feldern oder der `session_key`-Struktur wieder her.
- Die Thread-Zielablehnung von `sessions_send` liest jetzt typisierte SQLite-Routing-
  Metadaten. Sie lehnt Ziele nicht mehr ab und akzeptiert sie nicht mehr, indem Thread-Suffixe
  aus dem Zielschlüssel geparst werden.
- Die Validierung gruppenbezogener Tool-Richtlinien liest jetzt typisiertes SQLite-
  Konversationsrouting für die aktuelle oder erzeugte Sitzung. Sie vertraut der Gruppen-/
  Channel-Identität nicht mehr durch Dekodieren von `sessionKey`; vom Aufrufer bereitgestellte
  Gruppen-IDs werden verworfen, wenn keine typisierte Sitzungszeile für sie bürgt.
- Der Abgleich von Channel-Modellüberschreibungen verwendet jetzt explizite Gruppen- und
  Eltern-Konversationsmetadaten. Er dekodiert Eltern-Konversations-IDs nicht mehr aus
  `parentSessionKey`.
- Die Vererbung gespeicherter Modellüberschreibungen erfordert jetzt einen expliziten
  Eltern-Sitzungsschlüssel aus typisiertem Sitzungskontext. Sie leitet Eltern-Überschreibungen
  nicht mehr aus `:thread:`- oder `:topic:`-Suffixen in `sessionKey` ab.
- Der alte Sitzungs-Thread-Info-Wrapper und der Thread-Parser für geladene Plugins sind entfernt;
  kein Runtime-Code importiert mehr `config/sessions/thread-info`.
- Der Channel-Konversations-Helper legt keine Brücken mehr für das Parsen vollständiger
  Sitzungsschlüssel offen. Core normalisiert weiterhin Provider-eigene rohe Konversations-IDs
  über `resolveSessionConversation(...)`, rekonstruiert aber keine Routenfakten aus `sessionKey`.
- Abschlusszustellung, Senderegel und Task-Wartung leiten den Chat-Typ nicht mehr aus der
  Form von `session_key` ab. Der alte Chat-Typ-Schlüsselparser wurde gelöscht; diese Pfade
  benötigen typisierte Sitzungsmetadaten, typisierten Zustellungskontext oder explizites
  Zustellungsziel-Vokabular.
- Sitzungslisten/-status, Diagnosen, Genehmigungs-Kontobindung, TUI-Heartbeat-Filterung
  und Nutzungszusammenfassungen werten `SessionEntry.origin` nicht mehr nach
  Provider-/Konto-/Thread-/Anzeige-Routing aus. Die einzigen verbleibenden Runtime-
  `origin`-Lesezugriffe betreffen Nicht-Sitzungskonzepte oder Zustellungsobjekte des aktuellen Turns.
- Die native Konversationssuche für Genehmigungsanfragen liest jetzt typisierte
  Sitzungsrouting-Zeilen pro Agent. Sie parst Channel-/Gruppen-/Thread-Konversationsidentität
  nicht mehr aus `sessionKey`; fehlende typisierte Metadaten sind ein Migrations-/Reparaturproblem.
- Gateway-Nutzlasten für Sitzungsänderungs-/Chat-/Sitzungsereignisse spiegeln
  `SessionEntry.origin` oder `last*`-Routenschatten nicht mehr zurück; Clients erhalten typisierte
  `channel`, `chatType` und `deliveryContext`.
- Die Heartbeat-Zustellungsauflösung kann jetzt den typisierten SQLite-
  `deliveryContext` direkt erhalten, und die Heartbeat-Runtime übergibt die Zustellungszeile
  pro Agent, statt sich für aktuelles Routing auf Kompatibilitäts-Schatten in `session_entries`
  zu verlassen.
- Die Zielauflösung für isolierte Cron-Agent-Zustellung hydratisiert ihre aktuelle
  Route ebenfalls aus der typisierten Zustellungszeile der Sitzung pro Agent, bevor sie auf die
  Kompatibilitäts-Eintragsnutzlast zurückfällt.
- Die Ursprungsauflösung für Subagent-Ankündigungen schleust jetzt den typisierten
  Zustellungskontext der Anforderer-Sitzung durch `loadRequesterSessionEntry` und bevorzugt diese
  Zeile gegenüber Kompatibilitäts-Schatten `last*`/`deliveryContext`.
- Aktualisierungen eingehender Sitzungsmetadaten werden jetzt zuerst mit der typisierten
  Zustellungszeile pro Agent zusammengeführt; alte Zustellungsfelder von `SessionEntry` sind nur
  der Fallback, wenn keine typisierte Konversationszeile existiert.
- Die Zustellungsextraktion bei Neustart/Aktualisierung lässt jetzt die typisierte SQLite-
  Zustellungs-`threadId` gegenüber Topic-/Thread-Fragmenten gewinnen, die aus `sessionKey`
  geparst werden; Parsing ist nur ein Fallback für Legacy-Schlüssel mit Thread-Form.
- Channel-IDs im Hook-Agent-Kontext bevorzugen jetzt typisierte SQLite-Konversationsidentität,
  danach explizite Nachrichtenmetadaten. Sie parsen keine Provider-/Gruppen-/Channel-
  Fragmente mehr aus `sessionKey`.
- Gateway-`chat.send`-Vererbung externer Routen liest jetzt typisierte SQLite-
  Sitzungsrouting-Metadaten, statt Channel-/Direkt-/Gruppenumfang aus
  `sessionKey`-Teilen abzuleiten. Channel-bezogene Sitzungen erben nur, wenn der typisierte
  Sitzungs-Channel und Chat-Typ zum gespeicherten Zustellungskontext passen; gemeinsame Haupt-
  Sitzungen behalten ihre strengere CLI-/Keine-Client-Metadaten-Regel.
- Neustart-Sentinel-Wake und Fortsetzungsrouting lesen jetzt typisierte SQLite-
  Zustellungs-/Routing-Zeilen, bevor Heartbeat-Wakes oder geroutete Agent-Turn-
  Fortsetzungen eingereiht werden. Es rekonstruiert den Zustellungskontext nicht mehr aus dem
  JSON-Schatten des Sitzungseintrags.
- Gateway-`tools.effective`-Kontextauflösung liest jetzt typisierte SQLite-
  Zustellungs-/Routing-Zeilen für Provider-, Konto-, Ziel-, Thread- und Reply-Mode-
  Eingaben. Sie stellt diese aktuellen Routing-Felder nicht mehr aus veralteten
  `session_entries.entry_json`-Ursprungsschatten wieder her.
- Realtime-Voice-Consult-Routing löst Eltern-/Anrufzustellung jetzt aus typisierten
  SQLite-Sitzungszeilen pro Agent auf. Es fällt bei der Auswahl der eingebetteten Agent-
  Nachrichtenroute nicht mehr auf Kompatibilitäts-Schatten `SessionEntry.deliveryContext` zurück.
- ACP-Spawn-Heartbeat-Relay und Eltern-Stream-Routing lesen Elternzustellung jetzt aus
  typisierten SQLite-Sitzungszeilen. Sie rekonstruieren den Eltern-Zustellungskontext nicht mehr
  aus Kompatibilitäts-Schatten von Sitzungseinträgen.
- Die Erhaltung von Sitzungszustellungsrouten folgt jetzt typisierten Chat-Metadaten und
  persistierten Zustellungsspalten. Sie extrahiert keine Channel-Hinweise, Direkt-/Main-
  Marker oder Thread-Formen mehr aus `sessionKey`; interne Webchat-Routen erben ein externes Ziel
  nur, wenn SQLite bereits eine typisierte/persistierte Zustellungsidentität für die Sitzung hat.
- Die generische Sitzungszustellungsextraktion liest nur noch die exakte typisierte SQLite-
  Zustellungszeile der Sitzung. Sie parst keine Thread-/Topic-Suffixe mehr und fällt nicht von
  einem Schlüssel mit Thread-Form auf einen Basis-Sitzungsschlüssel zurück.
- Antwort-Dispatch, Neustart-Sentinel-Wiederherstellung und Realtime-Voice-Consult-Routing
  verwenden jetzt exakte typisierte SQLite-Sitzungs-/Konversationszeilen für Thread-Routing. Sie
  stellen Thread-IDs oder Zustellungskontext der Basissitzung nicht mehr durch Parsen
  von Sitzungsschlüsseln mit Thread-Form wieder her.
- Die Begrenzung des Embedded-PI-Verlaufs verwendet jetzt die typisierte SQLite-
  Sitzungsrouting-Projektion (`sessions` + primäre `conversations`) für Provider, Chat-Typ
  und Peer-Identität. Sie parst Provider, DM, Gruppe oder Thread-Form nicht mehr aus
  `sessionKey`.
- Die Cron-Tool-Zustellungsinferenz verwendet jetzt nur explizite Zustellung oder den aktuellen
  typisierten Zustellungskontext. Sie dekodiert keine Channel-, Peer-, Konto- oder Thread-
  Ziele mehr aus `agentSessionKey`.
- Runtime-Sitzungszeilen enthalten nicht mehr den alten Routenalias `lastProvider`.
  Helper und Tests verwenden typisierte Felder `lastChannel` und `deliveryContext`;
  Doctor-Migration ist der einzige Ort, der ältere Routenaliase oder persistierte
  `origin`-Schatten übersetzen sollte.
- Transkriptereignisse, VFS-Zeilen und Tool-Artefaktzeilen schreiben jetzt in die Datenbank
  pro Agent. Die nicht ausgelieferte globale Zuordnungstabelle für Transkriptdateien ist entfernt;
  Doctor zeichnet Legacy-Quellpfade stattdessen in dauerhaften Migrationszeilen auf.
- Runtime-Transkriptsuche scannt keine JSONL-Byte-Offsets mehr und sondiert keine Legacy-
  Transkriptdateien. Gateway-Chat-/Medien-/Verlaufspfade lesen Transkriptzeilen aus
  SQLite; Sitzungs-JSONL ist jetzt nur noch eine Legacy-Eingabe für Doctor, kein Runtime-Zustand
  und kein Exportformat.
- Eltern- und Branch-Beziehungen von Transkripten verwenden strukturierte
  `parentTranscriptScope: {agentId, sessionId}`-Metadaten in SQLite-Transkript-Headern,
  keine pfadähnlichen Locator-Strings `agent-db:...transcript_events...`.
- Der Vertrag des Transkript-Managers legt keine implizit persistierten Konstruktoren
  `create(cwd)` oder `continueRecent(cwd)` mehr offen. Persistierte Transkript-Manager
  werden mit einem expliziten Scope `{agentId, sessionId}` geöffnet; nur In-Memory-Manager
  bleiben für Tests und reine Transkript-Transformationen scope-frei.
- Runtime-Transkript-Store-APIs lösen den SQLite-Scope auf, keine Dateisystempfade. Der
  alte Helper `resolve...ForPath` und ungenutzte Schreiboptionen `transcriptPath` sind aus
  Runtime-Aufrufern entfernt.
- Runtime-Sitzungsauflösung verwendet jetzt `{agentId, sessionId}` und darf keine
  `sqlite-transcript://<agent>/<session>`-Strings für externe Grenzen ableiten.
  Legacy-absolute JSONL-Pfade sind nur Eingaben für die Doctor-Migration.
- Direkte Bridge-Datensätze des nativen Hook-Relays liegen jetzt in typisierten gemeinsamen
  `native_hook_relay_bridges`-Zeilen, indiziert nach Relay-ID. Runtime schreibt keine
  `/tmp`-JSON-Registry und keine opaken generischen Datensätze mehr für diese kurzlebigen
  Bridge-Datensätze.
- `runEmbeddedPiAgent(...)` hat keinen Transkript-Locator-Parameter mehr.
  Vorbereitete Worker-Deskriptoren lassen außerdem Transkript-Locators aus. Laufzeit-Sitzungsstatus
  und eingereihte Nachlauf-Ausführungen tragen `{agentId, sessionId}` statt
  abgeleiteter Transkript-Handles.
- Eingebettete Compaction übernimmt den SQLite-Bereich jetzt aus `agentId` und `sessionId`.
  Compaction-Hooks, Context-Engine-Aufrufe, CLI-Delegation und Protokollantworten
  dürfen keine abgeleiteten `sqlite-transcript://...`-Handles erhalten. Export-/Debug-Code
  kann explizite Benutzerartefakte aus Zeilen materialisieren, stellt aber keinen
  generischen JSONL-Exportpfad für Sitzungen bereit und speist Dateinamen nicht zurück in die Laufzeitidentität.
- `/export-session` liest Transkriptzeilen aus SQLite und schreibt nur die angeforderte
  eigenständige HTML-Ansicht. Der eingebettete Viewer rekonstruiert oder lädt Sitzungs-JSONL
  nicht mehr aus diesen Zeilen herunter.
- Context-Engine-Delegation parst keinen Transkript-Locator mehr, um
  Agent-Identität wiederherzustellen. Der vorbereitete Laufzeitkontext trägt die aufgelöste `agentId`
  in den eingebauten Compaction-Adapter.
- Transkript-Neuschreibung und Live-Kürzung von Tool-Ergebnissen lesen und persistieren
  Transkriptstatus jetzt über `{agentId, sessionId}` und leiten keine temporären
  Locators für Ereignis-Payloads von Transkriptaktualisierungen ab.
- Die Hilfsoberfläche für Transkriptstatus hat keine Locator-basierten Varianten
  `readTranscriptState`, `replaceTranscriptStateEvents` oder
  `persistTranscriptStateMutation` mehr. Laufzeitaufrufer müssen die
  `{agentId, sessionId}`-APIs verwenden. Doctor-Import liest Legacy-Dateien über explizite Dateipfade
  und schreibt SQLite-Zeilen; Locator-Strings werden nicht migriert.
- Der Vertrag des Laufzeit-Sitzungsmanagers stellt `open(locator)`,
  `forkFrom(locator)` oder `setTranscriptLocator(...)` nicht mehr bereit. Persistierte Sitzungsmanager
  öffnen nur über `{agentId, sessionId}`; Listen-/Fork-Helfer leben auf
  zeilenorientierten Sitzungs- und Checkpoint-APIs statt auf der Transkriptmanager-Fassade.
- Gateway-Transkriptleser-APIs sind bereichszuerst. Sie nehmen
  `{agentId, sessionId}` entgegen und akzeptieren keinen positionalen Transkript-Locator,
  der versehentlich zur Laufzeitidentität werden könnte. Das Parsen aktiver Transkript-Locators
  entfällt; Legacy-Quellpfade werden nur von Doctor-Importcode gelesen.
- Transkriptaktualisierungsereignisse sind ebenfalls bereichszuerst. `emitSessionTranscriptUpdate`
  akzeptiert keinen bloßen Locator-String mehr, und Listener routen über
  `{agentId, sessionId}`, ohne ein Handle zu parsen.
- Gateway-Broadcasts für Sitzungsnachrichten lösen Sitzungsschlüssel aus Agent-/Sitzungsbereich
  auf, nicht aus einem Transkript-Locator. Der alte Resolver/Cache von Transkript-Locator zu Sitzungsschlüssel
  ist entfernt.
- Gateway-Sitzungsverlaufs-SSE filtert Live-Aktualisierungen nach Agent-/Sitzungsbereich. Es
  kanonisiert keine Transkript-Locator-Kandidaten, Realpaths oder dateiförmigen
  Transkriptidentitäten mehr, um zu entscheiden, ob ein Stream eine Aktualisierung erhalten soll.
- Sitzungslebenszyklus-Hooks leiten auf `session_end` keine Transkript-Locators mehr ab
  und stellen sie nicht mehr bereit. Hook-Konsumenten erhalten `sessionId`, `sessionKey`,
  nächste Sitzungs-IDs und Agent-Kontext; Transkriptdateien sind nicht Teil des Lebenszyklusvertrags.
- Reset-Hooks leiten ebenfalls keine Transkript-Locators mehr ab und stellen sie nicht bereit. Die
  `before_reset`-Payload enthält wiederhergestellte SQLite-Nachrichten plus den Reset-Grund,
  während die Sitzungsidentität im Hook-Kontext bleibt.
- Agent-Harness-Reset akzeptiert keinen Transkript-Locator mehr. Reset-Dispatch ist
  nach `sessionId`/`sessionKey` plus Grund begrenzt.
- Sitzungstypen für Agent-Erweiterungen stellen `transcriptLocator` nicht mehr bereit; Erweiterungen
  sollten Sitzungskontext und Laufzeit-APIs verwenden, statt nach einer
  dateiförmigen Transkriptidentität zu greifen.
- Plugin-Compaction-Hooks stellen keine Transkript-Locators mehr bereit. Der Hook-Kontext
  trägt bereits die Sitzungsidentität, und Transkriptlesevorgänge müssen über SQLite-
  bereichsbewusste APIs statt über dateiförmige Handles laufen.
- `before_agent_finalize`-Hooks stellen `transcriptPath` nicht mehr bereit, einschließlich
  nativer Hook-Relay-Payloads. Finalisierungs-Hooks verwenden nur Sitzungskontext.
- Gateway-Reset-Antworten synthetisieren keinen Transkript-Locator mehr für den
  zurückgegebenen Eintrag. Der Reset erstellt SQLite-Transkriptzeilen, gibt den sauberen
  Sitzungseintrag zurück und überlässt Transkriptzugriff bereichsbewussten Lesern.
- Ergebnisse eingebetteter Ausführungen und Compaction-Ergebnisse legen keine Transkript-Locators mehr für
  Sitzungsabrechnung offen. Automatische Compaction aktualisiert nur die aktive `sessionId`,
  Compaction-Zähler und Token-Metadaten.
- Ergebnisse eingebetteter Versuche geben `transcriptLocatorUsed` nicht mehr zurück, und
  Context-Engine-`compact()`-Ergebnisse geben keine Transkript-Locators mehr zurück.
  Laufzeit-Wiederholungsschleifen akzeptieren nur eine Nachfolger-`sessionId`.
- Transkript-Anfügeergebnisse des Delivery-Mirror geben keine Transkript-Locators mehr zurück.
  Aufrufer erhalten die angefügte `messageId`; Transkriptaktualisierungssignale verwenden
  SQLite-Bereich.
- Parent-Session-Fork-Helfer geben nur die geforkte `sessionId` zurück. Subagent-
  Vorbereitung übergibt den Child-Agent-/Sitzungsbereich an Engines.
- CLI-Runner-Parameter und das erneute Einspeisen von Verlauf akzeptieren keine Transkript-Locators mehr.
  CLI-Verlaufslesevorgänge lösen den SQLite-Transkriptbereich aus `{agentId,
sessionId}` und Sitzungsschlüsselkontext auf.
- CLI- und Embedded-Runner-Testfixtures säen und lesen SQLite-Transkriptzeilen jetzt
  nach Sitzungs-ID, statt aktive Sitzungen als `*.jsonl`-Dateien auszugeben oder
  einen `sqlite-transcript://...`-String durch Laufzeitparameter zu reichen.
- Guard-Ereignisse für Sitzungs-Tool-Ergebnisse werden aus bekanntem Sitzungsbereich emittiert, auch wenn ein
  In-Memory-Manager keinen abgeleiteten Locator hat. Seine Tests fälschen keine aktiven
  `/tmp/*.jsonl`-Transkriptdateien mehr.
- BTW- und Compaction-Checkpoint-Helfer lesen und forken Transkriptzeilen jetzt nach
  SQLite-Bereich. Checkpoint-Metadaten speichern jetzt nur Sitzungs-IDs und Leaf-/Entry-IDs;
  abgeleitete Locators werden nicht mehr in Checkpoint-Payloads geschrieben.
- Gateway-Transkript-Schlüsselsuche verwendet SQLite-Transkriptbereich an Protokollgrenzen
  und führt keine Realpaths oder Stat-Aufrufe für Transkriptdateinamen mehr aus.
- Automatische Transkriptrotation bei Compaction schreibt Nachfolger-Transkriptzeilen
  direkt über den SQLite-Transkriptspeicher. Sitzungszeilen behalten nur die
  Nachfolger-Sitzungsidentität, keinen dauerhaften JSONL-Pfad oder persistierten Locator.
- Eingebettete Context-Engine-Compaction verwendet SQLite-benannte Helfer für Transkriptrotation.
  Die Rotationstests konstruieren keine JSONL-Nachfolgerpfade mehr und modellieren
  aktive Sitzungen nicht als Dateien.
- Verwaltete ausgehende Bildaufbewahrung schlüsselt ihren Transkript-Nachrichten-Cache aus
  SQLite-Transkriptstatistiken statt aus Dateisystem-Stat-Aufrufen.
- Laufzeit-Sitzungssperren und der eigenständige Legacy-Doctor-Pfad für `.jsonl.lock`
  wurden entfernt.
- Der Microsoft Teams-Laufzeit-Barrel und das öffentliche Plugin SDK re-exportieren
  den alten Dateisperren-Helfer nicht mehr; dauerhafte Plugin-Statuspfade sind SQLite-gestützt.
- Sitzungsbereinigung nach Alter/Anzahl und explizite Sitzungsbereinigung wurden entfernt.
  Doctor besitzt Legacy-Import; veraltete Sitzungen werden explizit zurückgesetzt oder gelöscht.
- Doctor-Integritätsprüfungen zählen eine Legacy-JSONL-Datei nicht mehr als gültiges aktives
  Transkript für eine SQLite-Sitzungszeile. Aktive Transkriptgesundheit ist nur SQLite;
  Legacy-JSONL-Dateien werden als Eingaben für Migration/Orphan-Bereinigung gemeldet.
- Doctor behandelt `agents/<agent>/sessions/` nicht mehr als erforderlichen Laufzeitstatus.
  Es scannt dieses Verzeichnis nur, wenn es bereits existiert, als Legacy-Import-
  oder Orphan-Bereinigungseingabe.
- Gateway `sessions.resolve`, Sitzungspatch-/Reset-/Compact-Pfade, Subagent-
  Spawning, schneller Abbruch, ACP-Metadaten, Heartbeat-isolierte Sitzungen und TUI-
  Patching migrieren oder bereinigen Legacy-Sitzungsschlüssel nicht mehr als Nebeneffekt
  normaler Laufzeitarbeit.
- CLI-Befehlssitzungsauflösung gibt jetzt die besitzende `agentId` statt eines
  `storePath` zurück, und sie kopiert keine Legacy-Hauptsitzungszeilen mehr während normaler
  `--to`- oder `--session-id`-Auflösung. Legacy-Hauptzeilen-Kanonisierung gehört
  ausschließlich zu Doctor.
- Laufzeit-Subagent-Tiefenauflösung liest nicht mehr `sessions.json` oder JSON5-
  Sitzungsspeicher. Sie liest SQLite-`session_entries` nach Agent-ID, und Legacy-
  Tiefen-/Sitzungsmetadaten können nur über den Doctor-Importpfad eintreten.
- Sitzungsoverrides für Auth-Profile werden über direkte `{agentId, sessionKey}`-
  Zeilen-Upserts persistiert, statt eine dateiförmige Sitzungsspeicher-Laufzeit lazy zu laden.
- Auto-Reply-Verbose-Gating und Sitzungsaktualisierungshelfer lesen/upserten SQLite-
  Sitzungszeilen jetzt nach Sitzungsidentität und benötigen keinen Legacy-Speicherpfad mehr,
  bevor sie persistierten Zeilenstatus anfassen.
- Metadatenhelfer für Befehlsausführungs-Sitzungen verwenden jetzt eintragsorientierte Namen und Modulpfade;
  die alte `session-store`-Befehlshilfsoberfläche wurde entfernt.
- Bootstrap-Header-Seeding und Härtung manueller Compaction-Grenzen mutieren jetzt
  SQLite-Transkriptzeilen direkt. Laufzeitaufrufer übergeben Sitzungsidentität, keine
  schreibbaren `.jsonl`-Pfade.
- Stille Sitzungsrotations-Wiedergabe kopiert aktuelle Benutzer-/Assistenten-Turns über
  `{agentId, sessionId}` aus SQLite-Transkriptzeilen. Sie akzeptiert keine
  Quell- oder Ziel-Transkript-Locators mehr.
- Frische Laufzeit-Sitzungszeilen speichern keine Transkript-Locators mehr. Aufrufer verwenden
  `{agentId, sessionId}` direkt; Export-/Debug-Befehle können Ausgabedateinamen wählen,
  wenn sie Zeilen materialisieren.
- Das Starten einer neuen persistierten Transkriptsitzung öffnet jetzt immer SQLite-Zeilen nach
  Bereich. Der Sitzungsmanager verwendet keinen vorherigen Transkriptpfad oder Locator aus der
  Datei-Ära mehr als Identität für die neue Sitzung.
- Persistierte Transkriptsitzungen verwenden die explizite
  `openTranscriptSessionManagerForSession({agentId, sessionId})`-API. Die alten
  statischen `SessionManager.create/openForSession/list/forkFromSession`-Fassaden sind
  entfernt, damit Tests und Laufzeitcode nicht versehentlich Sitzungsermittlung aus der Datei-Ära
  wiederherstellen können.
- Plugin-Laufzeit stellt `api.runtime.agent.session.resolveTranscriptLocatorPath` nicht mehr bereit;
  Plugin-Code verwendet SQLite-Zeilenhelfer und Bereichswerte.
- Die öffentliche `session-store-runtime`-SDK-Oberfläche exportiert jetzt nur noch Sitzungszeilen-
  und Transkriptzeilenhelfer. Fokussierte SQLite-Schema-/Pfad-/Transaktionshelfer
  leben in `sqlite-runtime`; rohe Open-/Close-/Reset-Helfer bleiben lokal nur für
  First-Party-Tests.
- Legacy-Dateinamenklassifizierer für `.jsonl`-Trajektorien/Checkpoints leben jetzt im
  Doctor-Legacy-Sitzungsdateimodul. Kern-Sitzungsvalidierung importiert keine
  Dateiartefakt-Helfer mehr, um normale SQLite-Sitzungs-IDs zu entscheiden.
- Active Memory-blockierende Subagent-Ausführungen verwenden SQLite-Transkriptzeilen statt
  temporäre oder persistierte `session.jsonl`-Dateien unter Plugin-Status zu erstellen. Die
  alte Option `transcriptDir` wurde entfernt.
- Einmalige Slug-Generierung und Crestodian-Planner-Ausführungen verwenden SQLite-Transkriptzeilen,
  statt temporäre `session.jsonl`-Dateien zu erstellen.
- `llm-task`-Helferausführungen und versteckte Commitment-Extraktion verwenden ebenfalls SQLite-
  Transkriptzeilen, sodass diese rein modellbezogenen Helfersitzungen keine
  temporären JSON-/JSONL-Transkriptdateien mehr erstellen.
- `TranscriptSessionManager` ist jetzt nur noch ein geöffneter SQLite-Transkriptbereich.
  Laufzeitcode öffnet ihn mit `openTranscriptSessionManagerForSession({agentId,
sessionId})`; Erstellungs-, Branch-, Fortsetzungs-, Listen- und Fork-Flows leben in ihren
  besitzenden SQLite-Zeilenhelfern statt in statischen Manager-Fassaden.
  Doctor-/Import-/Debug-Code behandelt explizite Legacy-Quelldateien außerhalb des
  Laufzeit-Sitzungsmanagers.
- Die veralteten Fassadenmethoden `SessionManager.newSession()` und
  `SessionManager.createBranchedSession()` wurden entfernt. Neue
  Sitzungen und Transkript-Nachfahren werden von ihrem besitzenden SQLite-
  Workflow erstellt, statt einen bereits geöffneten Manager in eine andere
  persistierte Sitzung zu mutieren.
- Parent-Transkript-Fork-Entscheidungen und Fork-Erstellung akzeptieren keine
  `storePath` oder `sessionsDir` mehr; sie verwenden `{agentId, sessionId}`-
  SQLite-Transkriptbereich statt beibehaltener Dateisystempfad-Metadaten.
- Memory-Host exportiert keine No-op-Helfer zur Klassifizierung von Sitzungsverzeichnis-Transkripten
  mehr; Transkriptfilterung wird jetzt während der Eintragskonstruktion aus SQLite-Zeilenmetadaten
  abgeleitet.
- Memory-Host- und QMD-Sitzungsexporttests verwenden SQLite-Transkriptbereiche. Alte
  `agents/<agentId>/sessions/*.jsonl`-Pfade bleiben nur dort abgedeckt, wo ein Test
  absichtlich Doctor-/Import-/Export-Kompatibilität belegt.
- Rohsitzungsinspektion in QA-lab verwendet jetzt `sessions.list` über das Gateway
  anstatt `agents/qa/sessions/sessions.json` zu lesen; MSteams-Feedback
  wird direkt an SQLite-Transkripte angehängt, ohne einen JSONL-Pfad zu fingieren.
- Gemeinsame eingehende Kanal-Turns tragen jetzt `{agentId, sessionKey}` statt eines
  Legacy-`storePath`. LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch und QQBot-Aufzeichnungspfade lesen jetzt updated-at-Metadaten und
  zeichnen eingehende Sitzungszeilen über die SQLite-Identität auf.
- Die Persistenz des Transkript-Locators wird aus aktiven Sitzungszeilen entfernt.
  `resolveSessionTranscriptTarget` gibt `agentId`, `sessionId` und optionale
  Themenmetadaten zurück; Doctor ist der einzige Code, der Legacy-Transkriptdateinamen
  importiert.
- Laufzeit-Transkript-Header beginnen bei SQLite-Version `1`. Alte JSONL-V1/V2/V3-
  Shape-Upgrades existieren nur im Doctor-Import und normalisieren importierte Header
  auf die aktuelle SQLite-Transkriptversion, bevor Zeilen gespeichert werden.
- Der database-first-Guard verbietet jetzt `SessionManager.listAll` und
  `SessionManager.forkFromSession`; Workflows für Sitzungsauflistung und
  Fork/Wiederherstellung müssen auf zeilen-/scope-basierten SQLite-APIs bleiben.
- Der Guard verbietet außerdem Legacy-Hilfsnamen zum Parsen von Transkript-JSONL und
  zur Reparatur aktiver Branches außerhalb von Doctor-/Importcode, sodass die
  Laufzeit keinen zweiten Legacy-Transkript-Migrationspfad erhalten kann.
- Eingebettete PI-Läufe lehnen eingehende Transkript-Handles ab. Sie verwenden die
  SQLite-Identität `{agentId, sessionId}` vor dem Worker-Start und erneut, bevor der
  Versuch den Transkriptzustand berührt. Eine veraltete `/tmp/*.jsonl`-Eingabe kann
  kein Laufzeit-Schreibziel auswählen.
- Cache-Trace-, Anthropic-Payload-, Raw-Stream- und Diagnose-Timeline-Datensätze
  schreiben jetzt in typisierte SQLite-`diagnostic_events`-Zeilen. Gateway-
  Stabilitäts-Bundles schreiben jetzt in typisierte SQLite-
  `diagnostic_stability_bundles`-Zeilen. Die alten JSONL-Override-Pfade
  `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` und
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` wurden entfernt, und die normale
  Stabilitätserfassung schreibt keine `logs/stability/*.json`-Dateien mehr.
- Cron-Persistenz gleicht jetzt SQLite-`cron_jobs`-Zeilen ab, statt bei jedem
  Speichern die gesamte Job-Tabelle zu löschen und neu einzufügen. Plugin-Target-
  Writebacks aktualisieren passende Cron-Zeilen direkt und halten den Laufzeit-
  Cron-Zustand in derselben State-Datenbanktransaktion.
- Cron-Laufzeitaufrufer verwenden jetzt einen stabilen SQLite-Cron-Store-Schlüssel.
  Legacy-`cron.store`-Pfade sind nur Doctor-Importeingaben; Produktions-Gateway,
  Task-Wartung, Status, Run-Log und Telegram-Target-Writeback-Pfade verwenden
  `resolveCronStoreKey` und normalisieren den Schlüssel nicht mehr als Pfad. Der
  Cron-Status meldet jetzt `storeKey` statt des alten dateiförmigen Felds
  `storePath`.
- Cron-Laufzeitladen und -Planung normalisieren keine Legacy-persistierten Job-Shapes
  wie `jobId`, `schedule.cron`, numerische `atMs`, String-Booleans oder fehlende
  `sessionTarget` mehr. Der Doctor-Legacy-Import besitzt diese Reparaturen, bevor
  Zeilen in SQLite eingefügt werden.
- ACP-Spawn löst keine Transkript-JSONL-Dateipfade mehr auf und persistiert sie nicht
  mehr. Spawn- und Thread-Bind-Einrichtung persistieren die SQLite-Sitzungszeile
  direkt und behalten die Sitzungs-ID als beibehaltene Transkriptidentität.
- ACP-Sitzungsmetadaten-APIs lesen/listen/upserten jetzt SQLite-Zeilen nach
  `agentId` und legen `storePath` nicht mehr als Teil des ACP-Sitzungseintrag-
  Vertrags offen.
- Sitzungsnutzungsabrechnung und Gateway-Nutzungsaggregation lösen Transkripte jetzt
  nur noch über `{agentId, sessionId}` auf. Der Kosten-/Nutzungscache und
  Zusammenfassungen erkannter Sitzungen synthetisieren oder geben keine
  Transkript-Locator-Strings mehr zurück.
- Gateway-Chat-Append, Persistenz abgebrochener Teilergebnisse, `/sessions.send` und
  Webchat-Medien-Transkriptschreibvorgänge hängen direkt über den SQLite-
  Transkriptscope an. Der Gateway-Transkript-Injection-Helper akzeptiert keinen
  `transcriptLocator`-Parameter mehr.
- SQLite-Transkripterkennung listet jetzt nur Transkriptscopes und Statistiken auf:
  `{agentId, sessionId, updatedAt, eventCount}`. Der tote
  Kompatibilitäts-Helper `listSqliteSessionTranscriptLocators` und das
  zeilenbezogene Feld `locator` sind entfernt.
- Die Transkriptreparatur-Laufzeit stellt jetzt nur noch
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` bereit. Der alte
  locator-basierte Reparatur-Helper wurde gelöscht; Doctor-/Debug-Code liest
  explizite Quelldateipfade und migriert niemals Locator-Strings.
- Die ACP-Replay-Ledger-Laufzeit speichert sitzungsbezogene Replay-Zeilen jetzt in
  der gemeinsamen SQLite-State-Datenbank statt in `acp/event-ledger.json`; Doctor
  importiert und entfernt die Legacy-Datei.
- Gateway-Transkriptlese-Helper befinden sich jetzt in
  `src/gateway/session-transcript-readers.ts` statt unter dem alten Modulnamen
  `session-utils.fs`. Die Fallback-Retry-History-Prüfung ist nach SQLite-
  Transkriptinhalt benannt statt nach der alten Datei-Helper-Oberfläche.
- Gateway-Injected-Chat- und Compaction-Helper übergeben den SQLite-Transkriptscope
  jetzt über interne Helper-APIs, statt Werte als Transkriptpfade oder Quelldateien
  zu benennen.
- Die Bootstrap-Fortsetzungserkennung prüft jetzt SQLite-Transkriptzeilen über
  `hasCompletedBootstrapTranscriptTurn`; sie legt keinen dateiförmigen Helper-Namen
  mehr offen.
- Embedded-Runner-Tests verwenden jetzt die SQLite-Transkriptidentität, und das
  Öffnen eines neuen Transkriptmanagers erfordert immer eine explizite `sessionId`.
- Memory-Indexing-Helper verwenden jetzt durchgehend SQLite-Transkriptterminologie:
  Der Host exportiert `listSessionTranscriptScopesForAgent` und
  `sessionTranscriptKeyForScope`, zielgerichtete Sync-Warteschlangen
  `sessionTranscripts`, öffentliche Sitzungssuchtreffer legen opake
  `transcript:<agent>:<session>`-Pfade offen, und der interne DB-Quellschlüssel ist
  `session:<session>` unter `source_kind='sessions'` statt eines fingierten
  Dateipfads.
- Der generische Plugin-SDK-Helper für persistente Deduplizierung legt keine
  dateiförmigen Optionen mehr offen. Aufrufer stellen SQLite-Scope-Schlüssel bereit,
  und dauerhafte Dedupe-Zeilen leben im gemeinsamen Plugin-State.
- Microsoft Teams-SSO-Tokens wurden von gesperrten JSON-Dateien in SQLite-Plugin-
  State verschoben. Doctor importiert `msteams-sso-tokens.json`, erstellt
  kanonische SSO-Token-Schlüssel aus Payloads neu und entfernt die Quelldatei.
  Delegierte OAuth-Tokens bleiben auf ihrer bestehenden privaten
  Anmeldedaten-Dateigrenze.
- Matrix-Sync-Cache-Zustand wurde von `bot-storage.json` in SQLite-Plugin-State
  verschoben. Doctor importiert alte rohe oder gewrappte Sync-Payloads und entfernt
  die Quelldatei. Aktive Matrix- und QA-Matrix-Clients übergeben ein SQLite-
  Sync-Store-Stammverzeichnis, keinen fingierten Pfad `sync-store.json` oder
  `bot-storage.json`.
- Matrix-Legacy-Krypto-Migrationsstatus wurde von
  `legacy-crypto-migration.json` in SQLite-Plugin-State verschoben. Doctor
  importiert die alte Statusdatei; Matrix-SDK-IndexedDB-Snapshots wurden von
  `crypto-idb-snapshot.json` in SQLite-Plugin-Blobs verschoben. Matrix-
  Wiederherstellungsschlüssel und Anmeldedaten sind SQLite-Plugin-State-Zeilen;
  ihre alten JSON-Dateien sind nur Doctor-Migrationseingaben.
- Memory-Wiki-Aktivitätslogs verwenden jetzt SQLite-Plugin-State statt
  `.openclaw-wiki/log.jsonl`. Der Memory-Wiki-Migrations-Provider importiert alte
  JSONL-Logs; Wiki-Markdown und Benutzer-Vault-Inhalte bleiben als Workspace-Inhalte
  dateibasiert.
- Memory Wiki erstellt `.openclaw-wiki/state.json` oder das ungenutzte Verzeichnis
  `.openclaw-wiki/locks` nicht mehr. Der Migrations-Provider entfernt diese
  ausgemusterten Plugin-Metadatendateien, wenn ein älterer Vault sie noch enthält.
- Crestodian-Audit-Einträge verwenden jetzt Core-SQLite-Plugin-State statt
  `audit/crestodian.jsonl`. Doctor importiert das Legacy-JSONL-Audit-Log und
  entfernt es nach erfolgreichem Import.
- Config-Schreib-/Beobachtungs-Audit-Einträge verwenden jetzt Core-SQLite-Plugin-
  State statt `logs/config-audit.jsonl`. Doctor importiert das Legacy-JSONL-
  Audit-Log und entfernt es nach erfolgreichem Import.
- Der macOS-Companion schreibt beim Bearbeiten von `openclaw.json` keine app-lokalen
  Sidecars `logs/config-audit.jsonl` oder `logs/config-health.json` mehr. Die
  Konfigurationsdatei bleibt dateibasiert, Wiederherstellungs-Snapshots bleiben
  neben der Konfigurationsdatei, und dauerhafter Config-Audit-/Health-State gehört
  zum Gateway-SQLite-Store.
- Ausstehende Crestodian-Rescue-Genehmigungen verwenden jetzt Core-SQLite-Plugin-
  State statt `crestodian/rescue-pending/*.json`. Doctor importiert alte Dateien
  mit ausstehenden Genehmigungen und entfernt sie nach erfolgreichem Import.
- Der temporäre Arm-Zustand von Phone Control verwendet jetzt SQLite-Plugin-State
  statt `plugins/phone-control/armed.json`. Doctor importiert die Legacy-Datei für
  den Arm-Zustand in den Namespace `phone-control/arm-state` und entfernt die Datei.
- Doctor repariert JSONL-Transkripte nicht mehr in place und erstellt keine
  Backup-JSONL-Dateien mehr. Er importiert den aktiven Branch in SQLite und entfernt
  die Legacy-Quelle.
- Die Transkriptsuche des Session-Memory-Hooks verwendet scope-only SQLite-Lesevorgänge
  mit `{agentId, sessionId}`. Sein Helper akzeptiert oder leitet keine
  Transkript-Locators, Legacy-Dateilesevorgänge oder Datei-Rewrite-Optionen mehr ab.
- Codex-App-Server-Konversationsbindungen schlüsseln SQLite-Plugin-State jetzt nach
  OpenClaw-Sitzungsschlüssel oder explizitem `{agentId, sessionId}`-Scope. Sie dürfen
  keine Fallback-Bindungen für Transkriptpfade beibehalten.
- Codex-App-Server-Lesevorgänge für gespiegelte History verwenden nur den SQLite-
  Transkriptscope; sie dürfen Identität nicht aus Transkriptdateipfaden wiederherstellen.
- Role-Ordering- und Compaction-Reset-Pfade unlinken keine alten Transkriptdateien
  mehr; Reset rotiert nur die SQLite-Sitzungszeile und Transkriptidentität.
- Gateway-Reset- und Checkpoint-Antworten geben saubere Sitzungszeilen plus
  Sitzungs-IDs zurück. Sie synthetisieren keine SQLite-Transkript-Locators mehr für
  Clients.
- Memory-Core-Dreaming entfernt Sitzungszeilen nicht mehr durch Prüfen auf fehlende
  JSONL-Dateien. Subagent-Cleanup läuft über die Sitzungs-Laufzeit-API statt über
  Dateisystem-Existenzprüfungen. Seine Transkript-Ingestion-Tests seeden SQLite-
  Zeilen direkt, statt `agents/<id>/sessions`-Fixtures oder Locator-Platzhalter zu
  erstellen.
- Memory-Transkriptindexierung kann `transcript:<agentId>:<sessionId>` als virtuellen
  Suchtrefferpfad für Zitier-/Lese-Helper offenlegen. Die dauerhafte Indexquelle ist
  relational (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), daher ist der Wert kein Laufzeit-Transkript-Locator,
  kein Dateisystempfad und darf niemals an Sitzungs-Laufzeit-APIs zurückgegeben werden.
- Gateway-Doctor-Memory-Status liest Short-Term-Recall- und Phase-Signal-Zählungen
  aus SQLite-Plugin-State-Zeilen statt aus `memory/.dreams/*.json`; CLI- und
  Doctor-Ausgabe bezeichnen diesen Speicher jetzt als SQLite-Store, nicht als Pfad.
- Memory-Core-Laufzeit, CLI-Status, Gateway-Doctor-Methoden und Plugin-SDK-Fassaden
  auditieren oder archivieren keine Legacy-`.dreams/session-corpus`-Dateien mehr.
  Diese Dateien sind nur Migrationseingaben; Doctor importiert sie in SQLite und
  löscht die Quelle nach Verifikation. Aktive Evidence-Zeilen für Session-Ingestion
  verwenden jetzt den virtuellen SQLite-Pfad `memory/session-ingestion/<day>.txt`;
  die Laufzeit schreibt oder leitet niemals Zustand aus `.dreams/session-corpus` ab.
- Öffentliche Memory-Core-Artefakte legen SQLite-Host-Events als das virtuelle JSON-
  Artefakt `memory/events/memory-host-events.json` offen; sie verwenden den Legacy-
  Quellpfad `.dreams/events.jsonl` nicht mehr wieder.
- Sandbox-Container-/Browser-Registries verwenden jetzt die gemeinsame SQLite-Tabelle
  `sandbox_registry_entries` mit typisierten Spalten für Sitzung, Image, Zeitstempel,
  Backend/Config und Browser-Port. Doctor importiert Legacy-JSON-Registry-Dateien in
  monolithischer und geshardeter Form und entfernt erfolgreiche Quellen. Laufzeit-
  Lesevorgänge verwenden die typisierten Zeilenspalten als Source of Truth;
  `entry_json` ist nur eine Replay-/Debug-Kopie.
- Commitments verwenden jetzt eine typisierte gemeinsame Tabelle `commitments` statt
  eines JSON-Blobs für den gesamten Store. Snapshot-Speicherungen upserten nach
  Commitment-ID und löschen nur fehlende Zeilen, statt die Tabelle zu leeren und neu
  einzufügen. Die Laufzeit lädt Commitments aus typisierten Scope-, Delivery-Window-,
  Status-, Attempt- und Textspalten; `record_json` ist nur eine Replay-/Debug-Kopie.
  Doctor importiert das Legacy-`commitments.json` und entfernt es nach erfolgreichem
  Import.
- Cron-Jobdefinitionen, Schedule-State und Run-History haben keine Laufzeit-JSON-
  Writer oder -Reader mehr. Die Laufzeit verwendet `cron_jobs`-Zeilen mit typisiertem
  Schedule,
  Payload-, Zustellungs-, Fehleralarm-, Sitzungs-, Status- und Laufzeitstatus-Spalten sowie typisierte
  `cron_run_logs`-Metadaten für Status, Diagnosezusammenfassung, Zustellungsstatus/-fehler,
  Sitzung/Ausführung, Modell und Token-Gesamtsummen. `job_json` ist nur eine Wiedergabe-/Debug-Kopie; `state_json` enthält verschachtelte
  Laufzeitdiagnosen, die noch keine Felder für schnelle Abfragen haben, während die Laufzeitumgebung
  heiße Statusfelder aus typisierten Spalten rehydriert. Doctor importiert
  Legacy-Dateien `jobs.json`, `jobs-state.json` und `runs/*.jsonl` und entfernt
  die importierten Quellen. Plugin-Ziel-Rückschreibungen aktualisieren passende `cron_jobs`-
  Zeilen, statt den gesamten Cron-Speicher zu laden und zu ersetzen.
- Der Gateway-Start ignoriert Legacy-`notify: true`-Marker in der Laufzeitprojektion.
  Doctor übersetzt sie in eine explizite SQLite-Zustellung, wenn
  `cron.webhook` gültig ist, entfernt inaktive Marker, wenn er nicht gesetzt ist, und behält
  sie mit einer Warnung bei, wenn der konfigurierte Webhook ungültig ist.
- Ausgehende und Sitzungs-Zustellungswarteschlangen speichern jetzt Warteschlangenstatus, Eintragsart,
  Sitzungsschlüssel, Kanal, Ziel, Konto-ID, Wiederholungsanzahl, letzten Versuch/Fehler,
  Wiederherstellungsstatus und Plattform-Sendemarkierungen als typisierte Spalten in der gemeinsamen
  Tabelle `delivery_queue_entries`. Die Laufzeitwiederherstellung liest diese heißen Felder aus
  den typisierten Spalten, und Wiederholungs-/Wiederherstellungsmutationen aktualisieren diese Spalten direkt,
  ohne Wiedergabe-JSON neu zu schreiben. Die vollständige JSON-Payload bleibt nur als
  Wiedergabe-/Debug-Blob für Nachrichtentexte und andere kalte Wiedergabedaten erhalten.
- Verwaltete ausgehende Bilddatensätze verwenden jetzt typisierte gemeinsame
  `managed_outgoing_image_records`-Zeilen, wobei Medienbytes weiterhin in
  `media_blobs` gespeichert werden. Der JSON-Datensatz bleibt nur als Wiedergabe-/Debug-Kopie erhalten.
- Discord-Modellauswahl-Einstellungen, Command-Deploy-Hashes und Thread-Bindungen
  verwenden jetzt gemeinsamen SQLite-Plugin-Status. Ihre Legacy-JSON-Importpläne liegen in der
  Setup-/Doctor-Migrationsoberfläche des Discord-Plugins, nicht im Kernmigrationscode.
- Plugin-Legacy-Importdetektoren verwenden Doctor-benannte Module wie
  `doctor-legacy-state.ts` oder `doctor-state-imports.ts`; normale Kanal-Laufzeitmodule
  dürfen keine Legacy-JSON-Detektoren importieren.
- BlueBubbles-Aufhol-Cursor und eingehende Dedupe-Marker verwenden jetzt gemeinsamen SQLite-
  Plugin-Status. Ihre Legacy-JSON-Importpläne liegen in der BlueBubbles-Plugin-
  Setup-/Doctor-Migrationsoberfläche, nicht im Kernmigrationscode.
- Telegram-Update-Offsets, Sticker-Cache-Zeilen, Cache-Zeilen für gesendete Nachrichten,
  Topic-Namens-Cache-Zeilen und Thread-Bindungen verwenden jetzt gemeinsamen SQLite-Plugin-
  Status. Ihre Legacy-JSON-Importpläne liegen in der Telegram-Plugin-
  Setup-/Doctor-Migrationsoberfläche, nicht im Kernmigrationscode.
- iMessage-Aufhol-Cursor, Reply-Short-ID-Zuordnungen und Sent-Echo-Dedupe-Zeilen
  verwenden jetzt gemeinsamen SQLite-Plugin-Status. Die alten Dateien `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` und `imessage/sent-echoes.jsonl` sind
  nur Doctor-Eingaben.
- Feishu-Nachrichten-Dedupe-Zeilen verwenden jetzt gemeinsamen SQLite-Plugin-Status statt
  `feishu/dedup/*.json`-Dateien. Der Legacy-JSON-Importplan liegt in der Feishu-
  Plugin-Setup-/Doctor-Migrationsoberfläche, nicht im Kernmigrationscode.
- Microsoft Teams-Konversationen, Umfragen, ausstehende Upload-Puffer und Feedback-
  Learnings verwenden jetzt gemeinsame SQLite-Plugin-Status-/Blob-Tabellen. Der Pfad für ausstehende Uploads
  verwendet `plugin_blob_entries`, sodass Medienpuffer als SQLite-BLOBs
  statt als base64-JSON gespeichert werden. Die Laufzeit-Helper-Namen verwenden jetzt SQLite-/Statusbenennung
  statt `*-fs`-Dateispeicherbenennung, und der alte `storePath`-Shim ist aus
  diesen Speichern entfernt. Der Legacy-JSON-Importplan liegt in der Microsoft Teams-
  Plugin-Setup-/Doctor-Migrationsoberfläche.
- Von Zalo gehostete ausgehende Medien verwenden jetzt gemeinsame SQLite-`plugin_blob_entries`
  statt `openclaw-zalo-outbound-media`-JSON/bin-Temporär-Sidecars.
- HTML und Metadaten des Diffs-Viewers verwenden jetzt gemeinsame SQLite-`plugin_blob_entries`
  statt temporärer `meta.json`-/`viewer.html`-Dateien. Gerenderte PNG/PDF-Ausgaben bleiben
  temporäre Materialisierungen, weil die Kanalzustellung weiterhin einen Dateipfad benötigt.
- Von Canvas verwaltete Dokumente verwenden jetzt gemeinsame SQLite-`plugin_blob_entries` statt
  eines standardmäßigen Verzeichnisses `state/canvas/documents`. Der Canvas-Host stellt diese
  Blobs direkt bereit; lokale Dateien werden nur für explizite Operator-Inhalte unter `host.root`
  oder temporäre Materialisierung erstellt, wenn ein nachgelagerter Medienleser
  einen Pfad benötigt.
- File-Transfer-Audit-Entscheidungen verwenden jetzt gemeinsame SQLite-`plugin_state_entries`
  statt des unbegrenzten Laufzeitprotokolls `audit/file-transfer.jsonl`. Doctor
  importiert die Legacy-JSONL-Audit-Datei in den Plugin-Status und entfernt die Quelle
  nach einem sauberen Import.
- ACPX-Prozess-Leases und Gateway-Instanzidentität verwenden jetzt gemeinsamen SQLite-Plugin-
  Status. Doctor importiert die Legacy-Datei `gateway-instance-id` in den Plugin-Status
  und entfernt die Quelle.
- Von ACPX generierte Wrapper-Skripte und das isolierte Codex-Home sind temporäre
  Materialisierung unter dem OpenClaw-Temporärstamm, kein dauerhafter OpenClaw-Status. Die
  dauerhaften ACPX-Laufzeitdatensätze sind die SQLite-Lease- und Gateway-Instanzzeilen;
  die alte ACPX-`stateDir`-Konfigurationsoberfläche wurde entfernt, weil dort kein Laufzeitstatus
  mehr geschrieben wird.
- Gateway-Medienanhänge verwenden jetzt die gemeinsame SQLite-Tabelle `media_blobs` als
  kanonischen Byte-Speicher. Lokale Pfade, die an Kanal- und Sandbox-
  Kompatibilitätsoberflächen zurückgegeben werden, sind temporäre Materialisierungen der Datenbankzeile,
  nicht der dauerhafte Medienspeicher. Laufzeit-Medien-Allowlisten enthalten keine Legacy-
  `$OPENCLAW_STATE_DIR/media`- oder Konfigurationsverzeichnis-`media`-Stämme mehr; diese Verzeichnisse sind
  nur Doctor-Importquellen.
- Shell-Vervollständigung schreibt keine `$OPENCLAW_STATE_DIR/completions/*`-Cache-
  Dateien mehr. Installations-, Doctor-, Update- und Release-Smoke-Pfade verwenden generierte
  Vervollständigungsausgabe oder Profil-Sourcing statt dauerhafter Vervollständigungs-Cache-
  Dateien.
- Gateway-Skill-Upload-Staging verwendet jetzt gemeinsame `skill_uploads`-Zeilen. Upload-
  Metadaten, Idempotenzschlüssel und Archivbytes liegen in SQLite; der Installer
  erhält nur einen temporär materialisierten Archivpfad, während eine Installation
  läuft.
- Inline-Anhänge von Subagenten werden nicht mehr unter Workspace-
  `.openclaw/attachments/*` materialisiert. Der Spawn-Pfad bereitet SQLite-VFS-Seed-Einträge vor,
  Inline-Ausführungen säen diese Einträge in den Scratch-Namespace der jeweiligen Agenten-Laufzeit ein,
  und festplattenbasierte Tools legen diesen SQLite-Scratch für Anhangspfade darüber. Die
  alten Registry-Spalten für Anhangsverzeichnisse von Subagent-Ausführungen und Cleanup-Hooks wurden entfernt.
- CLI-Bildhydration verwaltet keine stabilen `openclaw-cli-images`-Cache-
  Dateien mehr. Externe CLI-Backends erhalten weiterhin Dateipfade, aber diese Pfade sind
  temporäre Materialisierungen pro Ausführung mit Bereinigung.
- Cache-Trace-Diagnosen, Anthropic-Payload-Diagnosen, Rohmodellstream-
  Diagnosen, Diagnose-Zeitachsenereignisse und Gateway-Stabilitätsbündel schreiben jetzt
  SQLite-Zeilen statt `logs/*.jsonl`- oder
  `logs/stability/*.json`-Dateien.
  Laufzeit-Pfadüberschreibungs-Flags und Umgebungsvariablen wurden entfernt; Export-/Debug-
  Befehle können Dateien explizit aus Datenbankzeilen materialisieren.
- Der macOS Companion hat keinen fortlaufenden `diagnostics.jsonl`-Writer mehr. App-
  Protokolle gehen an Unified Logging, und dauerhafte Gateway-Diagnosen bleiben SQLite-gestützt.
- Die macOS-Port-Guardian-Datensatzliste verwendet jetzt typisierte gemeinsame SQLite-
  `macos_port_guardian_records`-Zeilen statt einer JSON-Datei in Application Support
  oder eines opaken Singleton-Blobs.
- Gateway-Singleton-Sperren verwenden jetzt typisierte gemeinsame SQLite-`state_leases`-Zeilen unter
  dem Scope `gateway_locks` statt Sperrdateien im temporären Verzeichnis. Fly- und OAuth-
  Troubleshooting-Dokumentation verweist jetzt auf die SQLite-Lease-/Auth-Refresh-Sperre statt
  auf veraltete Dateisperren-Bereinigung.
- Gateway-Neustart-Sentinel-Status verwendet jetzt typisierte gemeinsame SQLite-
  `gateway_restart_sentinel`-Zeilen statt `restart-sentinel.json`; die Laufzeit
  liest Sentinel-Art, Status, Routing, Nachricht, Fortsetzung und Statistiken aus
  typisierten Spalten. `payload_json` ist nur eine Wiedergabe-/Debug-Kopie. Laufzeitcode löscht
  die SQLite-Zeile direkt und führt keine Dateibereinigungslogik mehr mit.
- Gateway-Neustartabsicht und Supervisor-Handoff-Status verwenden jetzt typisierte gemeinsame
  SQLite-Zeilen `gateway_restart_intent` und `gateway_restart_handoff` statt
  der Sidecars `gateway-restart-intent.json` und
  `gateway-supervisor-restart-handoff.json`.
- Gateway-Singleton-Koordination verwendet jetzt typisierte `state_leases`-Zeilen unter
  `gateway_locks` statt `gateway.<hash>.lock`-Dateien zu schreiben. Die Lease-Zeile
  besitzt Sperreninhaber, Ablauf, Heartbeat und Debug-Payload; SQLite besitzt die
  atomare Acquire-/Release-Grenze. Die entfernte Option für das Dateisperrenverzeichnis ist
  verschwunden; Tests verwenden die SQLite-Zeilenidentität direkt.
- Der alte nicht referenzierte Cron-Nutzungsbericht-Helper, der `cron/runs/*.jsonl`-
  Dateien scannte, wurde gelöscht. Cron-Ausführungsverlaufsberichte sollten die typisierten
  SQLite-Zeilen `cron_run_logs` lesen.
- Die Neustartwiederherstellung der Hauptsitzung entdeckt Kandidaten-Agenten jetzt über die
  SQLite-Registry `agent_databases` statt `agents/*/sessions`-
  Verzeichnisse zu scannen.
- Die Gemini-Sitzungsbeschädigungswiederherstellung löscht jetzt nur die SQLite-Sitzungszeile;
  sie benötigt keinen Legacy-`storePath`-Gate mehr und versucht nicht mehr, einen abgeleiteten
  Transcript-JSONL-Pfad zu entfernen.
- Die Verarbeitung von Pfadüberschreibungen behandelt literale `undefined`-/`null`-Umgebungs-
  werte jetzt als nicht gesetzt und verhindert dadurch versehentliche Datenbanken unter
  `undefined/state/*.sqlite` im Repo-Stamm während Tests oder Shell-Handoffs.
- Konfigurationszustands-Fingerprints verwenden jetzt typisierte gemeinsame SQLite-`config_health_entries`-
  Zeilen statt `logs/config-health.json`, wodurch die normale Konfigurationsdatei
  das einzige Nicht-Anmeldeinformations-Konfigurationsdokument bleibt. Der macOS Companion hält nur
  prozesslokalen Zustandsstatus und erstellt den alten JSON-Sidecar nicht neu.
- Die Laufzeit für Auth-Profile importiert oder schreibt keine Credential-JSON-Dateien mehr. Der
  kanonische Credential-Speicher ist SQLite; `auth-profiles.json`, agentenspezifische
  `auth.json` und gemeinsame `credentials/oauth.json` sind Doctor-Migrationseingaben,
  die nach dem Import entfernt werden.
- Tests für Auth-Profil-Speichern/-Status prüfen jetzt direkt typisierte SQLite-Auth-Tabellen
  und verwenden Legacy-Auth-Profil-Dateinamen nur für Doctor-Migrationseingaben.
- `openclaw secrets apply` bereinigt nur die Konfigurationsdatei, Env-Datei und den SQLite-
  Auth-Profil-Speicher. Es enthält keine Kompatibilitätslogik mehr, die
  entfernte agentenspezifische `auth.json` bearbeitet; Doctor ist für Import und Löschung dieser Datei zuständig.
- Hermes-Secret-Migrationspläne und -Anwendungen importierten API-Schlüsselprofile direkt
  in den SQLite-Auth-Profil-Speicher. Sie schreiben oder verifizieren
  `auth-profiles.json` nicht mehr als Zwischenziel.
- Benutzerorientierte Auth-Dokumentation beschreibt jetzt
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` statt
  Benutzer anzuweisen, `auth-profiles.json` zu prüfen oder zu kopieren; Legacy-OAuth-/Auth-JSON-
  Namen bleiben nur als Doctor-Importeingaben dokumentiert.
- Kern-Statuspfad-Helper stellen die entfernte Datei `credentials/oauth.json` nicht mehr bereit.
  Der Legacy-Dateiname ist lokal auf den Doctor-Auth-Importpfad beschränkt.
- Installations-, Sicherheits-, Onboarding-, Modell-Auth- und SecretRef-Dokumentation beschreibt jetzt
  SQLite-Auth-Profil-Zeilen und Gesamtstatus-Backup/-Migration statt
  agentenspezifischer Auth-Profil-JSON-Dateien.
- PI-Modellerkennung übergibt jetzt kanonische Anmeldeinformationen an den In-Memory-
  `pi-coding-agent`-Auth-Speicher. Sie erstellt, bereinigt oder schreibt
  während der Erkennung keine agentenspezifische `auth.json` mehr.
- Voice-Wake-Trigger und Routing-Einstellungen verwenden jetzt typisierte gemeinsame SQLite-Tabellen
  statt `settings/voicewake.json`, `settings/voicewake-routing.json` oder
  opaker generischer Zeilen; Doctor importiert die Legacy-JSON-Dateien und entfernt sie nach einer
  erfolgreichen Migration.
- Update-Check-Status verwendet jetzt eine typisierte gemeinsame `update_check_state`-Zeile statt
  `update-check.json` oder eines opaken generischen Blobs; Doctor importiert
  die Legacy-JSON-Datei und entfernt sie nach einer erfolgreichen Migration.
- Konfigurationszustandsstatus verwendet jetzt typisierte gemeinsame `config_health_entries`-Zeilen statt
  `logs/config-health.json` oder eines opaken generischen Blobs; Doctor
  importiert die Legacy-JSON-Datei und entfernt sie nach einer erfolgreichen Migration.
- Genehmigungen für Plugin-Konversationsbindungen verwenden jetzt typisierte
  `plugin_binding_approvals`-Zeilen statt opakem gemeinsamem SQLite-Status oder
  `plugin-binding-approvals.json`; die Legacy-Datei ist eine Eingabe für die doctor-Migration.
- Generische Bindings der aktuellen Konversation speichern jetzt typisierte
  `current_conversation_bindings`-Zeilen, anstatt
  `bindings/current-conversations.json` neu zu schreiben; doctor importiert die Legacy-JSON-Datei und
  entfernt sie nach einer erfolgreichen Migration.
- Synchronisierungsjournale für importierte Quellen im Memory Wiki speichern jetzt eine SQLite-Plugin-State-Zeile
  pro Vault-/Quellschlüssel, anstatt `.openclaw-wiki/source-sync.json` neu zu schreiben;
  der Migrations-Provider importiert und entfernt das Legacy-JSON-Journal.
- Importlauf-Datensätze für Memory Wiki ChatGPT speichern jetzt eine SQLite-Plugin-State-Zeile
  pro Vault-/Lauf-ID, anstatt `.openclaw-wiki/import-runs/*.json` zu schreiben.
  Rollback-Snapshots bleiben explizite Vault-Dateien, bis die Snapshot-Archivierung
  für Importläufe in den Blob-Speicher verschoben wird.
- Kompilierte Memory Wiki-Digests speichern jetzt SQLite-Plugin-Blob-Zeilen, anstatt
  `.openclaw-wiki/cache/agent-digest.json` und
  `.openclaw-wiki/cache/claims.jsonl` zu schreiben. Der Migrations-Provider importiert alte Cache-
  Dateien und entfernt das Cache-Verzeichnis, wenn es leer wird.
- ClawHub Skill-Installationsverfolgung speichert jetzt eine SQLite-Plugin-State-Zeile pro
  Workspace/Skill, anstatt zur Laufzeit `.clawhub/lock.json` und
  `.clawhub/origin.json`-Sidecars zu schreiben oder zu lesen. Runtime-Code verwendet Tracked-Install-
  State-Objekte statt dateiförmiger Lockfile-/Origin-Abstraktionen. Doctor
  importiert die Legacy-Sidecars aus konfigurierten Agent-Workspaces und entfernt sie
  nach einem sauberen Import.
- Der installierte Plugin-Index liest und schreibt jetzt die typisierte gemeinsam genutzte SQLite-
  Singleton-Zeile `installed_plugin_index` statt `plugins/installs.json`; die
  Legacy-JSON-Datei ist nur eine Eingabe für die doctor-Migration und wird nach dem Import entfernt.
- Der Legacy-Pfadhelfer `plugins/installs.json` lebt jetzt im doctor-Legacy-
  Code. Runtime-Plugin-Index-Module stellen nur SQLite-gestützte Persistenz-
  Optionen bereit, keinen JSON-Dateipfad.
- Gateway-Neustart-Sentinel, Neustart-Intent und Supervisor-Handoff-State verwenden jetzt
  typisierte gemeinsam genutzte SQLite-Zeilen (`gateway_restart_sentinel`,
  `gateway_restart_intent` und `gateway_restart_handoff`) statt generischer
  opaker Blobs. Runtime-Neustartcode hat keinen dateiförmigen Sentinel-/Intent-/Handoff-
  Vertrag.
- Matrix-Sync-Cache, Storage-Metadaten, Thread-Bindings, eingehende Dedupe-Marker,
  Cooldown-State für Startverifizierung, SDK-IndexedDB-Krypto-Snapshots,
  Anmeldedaten und Wiederherstellungsschlüssel verwenden jetzt gemeinsam genutzte SQLite-Plugin-State-/Blob-
  Tabellen. Runtime-Pfadstrukturen stellen keinen Metadatenpfad `storage-meta.json` mehr bereit;
  dieser Dateiname ist nur eine Legacy-Migrationseingabe. Ihr Legacy-JSON-Import-
  Plan lebt in der Setup-/doctor-Migrationsoberfläche des Matrix-Plugins.
- Matrix-Start scannt, meldet oder vervollständigt Legacy-Matrix-Datei-
  State nicht mehr. Matrix-Dateierkennung, Legacy-Krypto-Snapshot-Erstellung, Migrationsstatus für Room-Key-
  Wiederherstellung, Import und Quellenentfernung gehören vollständig doctor.
- Matrix-Runtime-Migrations-Barrels wurden entfernt. Legacy-State-/Krypto-Erkennungs-
  und Mutationshelfer werden direkt von Matrix doctor importiert, statt
  Teil der Runtime-API-Oberfläche zu sein.
- Marker für Matrix-Migrations-Snapshot-Wiederverwendung leben jetzt im SQLite-Plugin-State
  statt in `matrix/migration-snapshot.json`; doctor kann weiterhin dasselbe
  verifizierte Vor-Migrationsarchiv wiederverwenden, ohne eine Sidecar-State-Datei zu schreiben.
- Nostr-Bus-Cursor und Profilveröffentlichungs-State verwenden jetzt gemeinsam genutzten SQLite-Plugin-
  State. Ihr Legacy-JSON-Importplan lebt in der Setup-/doctor-
  Migrationsoberfläche des Nostr-Plugins.
- Active Memory-Sitzungsschalter verwenden jetzt gemeinsam genutzten SQLite-Plugin-State statt
  `session-toggles.json`; erneutes Einschalten von Memory löscht die Zeile, anstatt
  ein JSON-Objekt neu zu schreiben.
- Skill Workshop-Vorschläge und Review-Zähler verwenden jetzt gemeinsam genutzten SQLite-Plugin-
  State statt workspace-spezifischer `skill-workshop/<workspace>.json`-Stores. Jeder
  Vorschlag ist eine eigene Zeile unter `skill-workshop/proposals`, und der Review-
  Zähler ist eine eigene Zeile unter `skill-workshop/reviews`.
- Skill Workshop-Reviewer-Subagent-Läufe verwenden jetzt den Runtime-Session-Transcript-
  Resolver, statt `skill-workshop/<sessionId>.json`-Sidecar-Session-
  Pfade zu erstellen.
- ACPX-Prozess-Leases verwenden jetzt gemeinsam genutzten SQLite-Plugin-State unter
  `acpx/process-leases` statt einer dateibasierten Gesamt-Registry `process-leases.json`.
  Jede Lease wird als eigene Zeile gespeichert, wodurch das Entfernen veralteter Prozesse beim Start
  ohne Runtime-JSON-Neuschreibpfad erhalten bleibt.
- ACPX-Wrapper-Skripte und das isolierte Codex-Home werden im temporären
  OpenClaw-Root erzeugt. Sie werden bei Bedarf neu erstellt und sind keine Backup- oder
  Migrationseingaben.
- Die Persistenz der Subagent-Lauf-Registry verwendet typisierte gemeinsam genutzte `subagent_runs`-Zeilen. Der
  alte Pfad `subagents/runs.json` ist jetzt nur eine doctor-Migrationseingabe, und
  Runtime-Helfernamen beschreiben die State-Schicht nicht mehr als disk-backed.
  Runtime-Tests erstellen keine ungültigen oder leeren `runs.json`-Fixtures mehr, um
  Registry-Verhalten nachzuweisen; sie setzen/lesen SQLite-Zeilen direkt.
- Backup stellt das State-Verzeichnis vor der Archivierung bereit, kopiert Nicht-Datenbankdateien,
  snapshotet `*.sqlite`-Datenbanken mit `VACUUM INTO`, lässt Live-WAL/SHM-
  Sidecars aus, erfasst Snapshot-Metadaten im Archivmanifest und erfasst
  abgeschlossene Backup-Läufe in SQLite mit dem Archivmanifest. `openclaw backup
create` validiert das geschriebene Archiv standardmäßig; `--no-verify` ist der
  explizite schnelle Pfad.
- `openclaw backup restore` validiert das Archiv vor der Extraktion, verwendet das
  normalisierte Manifest des Verifiers wieder und stellt verifizierte Manifest-Assets an ihren
  aufgezeichneten Quellpfaden wieder her. Es erfordert `--yes` für Schreibvorgänge und unterstützt `--dry-run`
  für einen Wiederherstellungsplan.
- Der alte Backup-Filter für flüchtige Pfade wurde gelöscht. Backup benötigt keine
  Live-Tar-Überspringliste für Legacy-Session- oder Cron-JSON/JSONL-Dateien mehr, weil SQLite-
  Snapshots vor der Archiverstellung bereitgestellt werden.
- Vorbereitung von Plain-Setup- und Onboarding-Workspaces erstellt keine
  `agents/<agentId>/sessions/`-Verzeichnisse mehr. Sie erstellen nur config/workspace;
  SQLite-Session-Zeilen und Transcript-Zeilen werden bei Bedarf in der
  agentenspezifischen Datenbank erstellt.
- Sicherheitsberechtigungsreparatur zielt jetzt auf die globalen und agentenspezifischen SQLite-
  Datenbanken plus WAL/SHM-Sidecars statt auf `sessions.json` und Transcript-
  JSONL-Dateien.
- Sandbox-Registry-Runtime-Namen beschreiben jetzt SQLite-Registry-Arten direkt,
  statt Legacy-JSON-Registry-Terminologie durch den aktiven Store zu tragen.
- `openclaw reset --scope config+creds+sessions` entfernt agentenspezifische
  `openclaw-agent.sqlite`-Datenbanken plus WAL/SHM-Sidecars, nicht nur Legacy-
  `sessions/`-Verzeichnisse.
- Gateway-Aggregat-Session-Helfer verwenden jetzt eintragsorientierte Namen:
  `loadCombinedSessionEntriesForGateway` gibt `{ databasePath, entries }` zurück.
  Die alte Combined-Store-Benennung wurde aus Runtime-Aufrufern entfernt.
- Docker-MCP-Channel-Seeding schreibt jetzt die Haupt-Session-Zeile und Transcript-
  Ereignisse in die agentenspezifische SQLite-Datenbank, statt
  `sessions.json` und ein JSONL-Transcript zu erstellen.
- Der gebündelte Session-Memory-Hook löst Kontext aus vorherigen Sessions jetzt aus
  SQLite per `{agentId, sessionId}` auf. Er scannt, speichert oder synthetisiert
  keine Transcript-Pfade oder `workspace/sessions`-Verzeichnisse mehr.
- Der gebündelte Command-Logger-Hook schreibt Command-Audit-Zeilen jetzt in die gemeinsam genutzte
  SQLite-Tabelle `command_log_entries`, statt an
  `logs/commands.log` anzuhängen.
- Channel-Pairing-Allowlists stellen zur Laufzeit und im Plugin SDK nur noch
  SQLite-gestützte Lese-/Schreibhelfer bereit. Der alte `*-allowFrom.json`-Pfad-Resolver und
  Dateileser leben nur noch unter doctor-Legacy-Importcode.
- `migration_runs` erfasst Legacy-State-Migrationsausführungen mit Status,
  Zeitstempeln und JSON-Berichten.
- `migration_sources` erfasst jede importierte Legacy-Dateiquelle mit Hash, Größe,
  Datensatzanzahl, Zieltabelle, Lauf-ID, Status und Quellenentfernungsstatus.
- `backup_runs` erfasst Backup-Archivpfade, Status und JSON-Manifeste.
- Das globale Schema behält keine ungenutzte `agents`-Registry-Tabelle. Agent-
  Datenbankerkennung ist die kanonische `agent_databases`-Registry, bis die Runtime
  einen echten Agent-Record-Owner hat.
- Generierte Model-Catalog-Konfiguration wird in typisierten globalen SQLite-
  `agent_model_catalogs`-Zeilen gespeichert, die nach Agent-Verzeichnis geschlüsselt sind. Runtime-Aufrufer verwenden
  `ensureOpenClawModelCatalog`; es gibt keine `models.json`-Kompatibilitäts-API im
  Runtime-Code. Die Implementierung schreibt SQLite, und die eingebettete PI-Registry wird
  aus dieser gespeicherten Payload hydriert, ohne eine `models.json`-Datei zu erstellen.
- QMD-Session-Transcript-Markdown-Export und `memory.qmd.sessions`-Konfiguration wurden
  entfernt. Es gibt keine QMD-Transcript-Sammlung, keinen `qmd/sessions*`-Runtime-
  Pfad und keine dateigestützte Session-Memory-Bridge.
- Memory-Core-Runtime importiert SQLite-Transcript-Indizierungshelfer aus
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, nicht aus dem
  QMD-SDK-Subpfad. Der QMD-Subpfad behält nur für externe Aufrufer einen Kompatibilitäts-Re-Export,
  bis eine größere SDK-Bereinigung ihn entfernen kann.
- QMDs eigenes `index.sqlite` ist jetzt eine temporäre Runtime-Materialisierung, die durch die
  Haupt-SQLite-Tabelle `plugin_blob_entries` gestützt wird. Die Runtime erstellt kein dauerhaftes
  `~/.openclaw/agents/<agentId>/qmd`-Sidecar mehr.
- Das optionale Plugin `memory-lancedb` erstellt
  `~/.openclaw/memory/lancedb` nicht mehr als impliziten von OpenClaw verwalteten Store. Es ist ein
  externes LanceDB-Backend und bleibt deaktiviert, bis der Operator einen
  expliziten `dbPath` konfiguriert.
- `check:database-first-legacy-stores` schlägt bei neuem Runtime-Quellcode fehl, der
  Legacy-Store-Namen mit schreibenden Dateisystem-APIs kombiniert. Es schlägt auch bei Runtime-
  Quellcode fehl, der die ausgemusterten Transcript-Bridge-Marker
  `transcriptLocator` oder `sqlite-transcript://...` wieder einführt. Migration, doctor, Import
  und expliziter Nicht-Session-Exportcode bleiben erlaubt. Breitere Legacy-Vertrags-
  Namen wie `sessionFile`, `storePath` und alte dateiära-spezifische `SessionManager`-
  Fassaden haben noch aktuelle Owner und benötigen separate Migration-Guard-Arbeit,
  bevor sie zu einem erforderlichen Preflight-Check werden können. Der Guard deckt jetzt auch
  Runtime-`cache/*.json`-Stores, generische
  `thread-bindings.json`-Sidecars, Cron-State-/Run-Log-JSON, Config-Health-JSON,
  Neustart- und Lock-Sidecars, Voice-Wake-Einstellungen, Plugin-Binding-Genehmigungen,
  JSON für den installierten Plugin-Index, File-Transfer-Audit-JSONL, Memory-Wiki-Aktivitäts-
  Logs, das alte Textlog des gebündelten `command-logger` und pi-mono-Raw-Stream-JSONL-
  Diagnoseoptionen ab. Er verbietet außerdem alte Root-Level-doctor-Legacy-Modulnamen, damit
  Kompatibilitätscode unter `src/commands/doctor/` bleibt. Android-Debug-Handler
  verwenden außerdem logcat-/In-Memory-Ausgabe, statt `camera_debug.log`- oder
  `debug_logs.txt`-Cache-Dateien bereitzustellen.

## Ziel-Schemastruktur

Halten Sie Schemas explizit. Host-eigener Runtime-Zustand verwendet typisierte Tabellen. Plugin-eigener
opaker Zustand verwendet `plugin_state_entries` / `plugin_blob_entries`; es gibt keine
generische Host-`kv`-Tabelle.

Globale Datenbank:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Agent-Datenbank:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

Eine künftige Suche kann FTS-Tabellen hinzufügen, ohne die kanonischen Ereignistabellen zu ändern:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Große Werte sollten `blob`-Spalten verwenden, keine JSON-String-Codierung. Behalten Sie
`value_json` für kleine strukturierte Daten bei, die mit einfachem
SQLite-Werkzeug inspizierbar bleiben müssen.

`agent_databases` ist die kanonische Registry für diesen Branch. Fügen Sie keine
`agents`-Tabelle hinzu, bis ein echter Owner für Agent-Datensätze existiert; die Agent-Konfiguration bleibt in
`openclaw.json`.

## Doctor-Migrationsstruktur

Doctor sollte einen expliziten Migrationsschritt aufrufen, der berichtbar ist und sicher
erneut ausgeführt werden kann:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` ruft die Implementierung der Zustandsmigration nach
dem normalen Konfigurations-Preflight auf und erstellt vor dem Import ein verifiziertes Backup. Der Runtime-Start
und `openclaw migrate` dürfen keine Legacy-OpenClaw-Zustandsdateien importieren.

Migrationseigenschaften:

- Ein Migrationsdurchlauf entdeckt alle Legacy-Dateiquellen und erstellt einen Plan,
  bevor etwas verändert wird.
- Doctor erstellt vor dem Import von Legacy-Dateien ein verifiziertes Backup-Archiv.
- Importe sind idempotent und nach Quellpfad, mtime, Größe, Hash und Ziel-
  tabelle geschlüsselt.
- Erfolgreiche Quelldateien werden entfernt oder archiviert, nachdem die Zieldatenbank
  committed wurde.
- Fehlgeschlagene Importe lassen die Quelle unverändert und zeichnen eine Warnung in
  `migration_runs` auf.
- Runtime-Code liest erst SQLite, nachdem die Migration existiert.
- Es ist kein Downgrade- oder Export-zurück-in-Runtime-Dateien-Pfad erforderlich.

## Migrationsinventar

Verschieben Sie diese in die globale Datenbank:

- Laufzeit-Schreibvorgänge der Aufgabenregistrierung verwenden jetzt die gemeinsame Datenbank; der nicht ausgelieferte
  `tasks/runs.sqlite`-Sidecar-Importer wurde gelöscht. Snapshot-Speicherungen führen Upserts nach Aufgaben-
  ID aus und löschen nur fehlende Aufgaben-/Zustellungszeilen.
- Laufzeit-Schreibvorgänge von TaskFlow verwenden jetzt die gemeinsame Datenbank; der nicht ausgelieferte
  `tasks/flows/registry.sqlite`-Sidecar-Importer wurde gelöscht. Snapshot-Speicherungen
  führen Upserts nach Flow-ID aus und löschen nur fehlende Flow-Zeilen.
- Laufzeit-Schreibvorgänge des Plugin-Zustands verwenden jetzt die gemeinsame Datenbank; der nicht ausgelieferte
  `plugin-state/state.sqlite`-Sidecar-Importer wurde gelöscht.
- Die integrierte Speichersuche verwendet nicht mehr standardmäßig `memory/<agentId>.sqlite`; ihre
  Indextabellen liegen in der zugehörigen Agent-Datenbank, und die explizite
  `memorySearch.store.path`-Sidecar-Opt-in-Option wurde in die Doctor-Konfigurationsmigration verschoben.
- Die integrierte Speicher-Neuindizierung setzt nur speichereigene Tabellen in der Agent-Datenbank zurück.
  Sie darf nicht die gesamte SQLite-Datei ersetzen, da dieselbe Datenbank
  Sitzungen, Transkripte, VFS-Zeilen, Artefakte und Laufzeit-Caches enthält.
- Sandbox-Container-/Browser-Registrierungen aus monolithischem und fragmentiertem JSON. Laufzeit-
  Schreibvorgänge verwenden jetzt die gemeinsame Datenbank; der Import von Legacy-JSON bleibt bestehen.
- Cron-Jobdefinitionen, Zeitplanstatus und Ausführungshistorie verwenden jetzt gemeinsames SQLite;
  Doctor importiert/entfernt Legacy-Dateien `jobs.json`, `jobs-state.json` und
  `cron/runs/*.jsonl`
- Geräteidentität/-authentifizierung, Push, Updateprüfung, Commitments, OpenRouter-Modell-
  Cache, installierter Plugin-Index und App-Server-Bindings
- Geräte-/Node-Kopplung und Bootstrap-Datensätze verwenden jetzt typisierte SQLite-Tabellen
- Device-Pair-Benachrichtigungsabonnenten und Marker für zugestellte Anfragen verwenden jetzt die
  gemeinsame SQLite-Plugin-State-Tabelle statt `device-pair-notify.json`.
- Voice-Call-Anrufdatensätze verwenden jetzt die gemeinsame SQLite-Plugin-State-Tabelle unter dem
  Namespace `voice-call` / `calls` statt `calls.jsonl`; die Plugin-CLI
  verfolgt und fasst SQLite-gestützte Anrufhistorie zusammen.
- QQBot-Gateway-Sitzungen, bekannte Benutzerdatensätze und Ref-Index-Zitatcache verwenden jetzt
  SQLite-Plugin-Zustand unter `qqbot`-Namespaces (`gateway-sessions`,
  `known-users`, `ref-index`) statt `session-*.json`, `known-users.json`
  und `ref-index.jsonl`. Diese Legacy-Dateien sind Caches und werden nicht migriert.
- Discord-Modellauswahlpräferenzen, Command-Deploy-Hashes und Thread-Bindings
  verwenden jetzt SQLite-Plugin-Zustand unter `discord`-Namespaces
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  statt `model-picker-preferences.json`, `command-deploy-cache.json` und
  `thread-bindings.json`; die Discord-Doctor-/Setup-Migration importiert und
  entfernt die Legacy-Dateien.
- BlueBubbles-Catchup-Cursor und eingehende Dedupe-Marker verwenden jetzt SQLite-Plugin-
  Zustand unter `bluebubbles`-Namespaces (`catchup-cursors`, `inbound-dedupe`)
  statt `bluebubbles/catchup/*.json` und
  `bluebubbles/inbound-dedupe/*.json`; die BlueBubbles-Doctor-/Setup-Migration
  importiert und entfernt die Legacy-Dateien.
- Telegram-Update-Offsets, Sticker-Cache-Einträge, Reply-Chain-Nachrichten-Cache-
  Einträge, Gesendete-Nachrichten-Cache-Einträge, Themenname-Cache-Einträge und Thread-
  Bindings verwenden jetzt SQLite-Plugin-Zustand unter `telegram`-Namespaces
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) statt `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` und
  `thread-bindings-*.json`; die Telegram-Doctor-/Setup-Migration importiert und
  entfernt die Legacy-Dateien.
- iMessage-Catchup-Cursor, Reply-Short-ID-Zuordnungen und Sent-Echo-Dedupe-Zeilen
  verwenden jetzt SQLite-Plugin-Zustand unter `imessage`-Namespaces (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) statt `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` und `imessage/sent-echoes.jsonl`; die iMessage-
  Doctor-/Setup-Migration importiert und entfernt die Legacy-Dateien.
- Microsoft Teams-Unterhaltungen, Umfragen, SSO-Token und Feedback-Learnings verwenden jetzt
  SQLite-Plugin-State-Namespaces (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) statt `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` und `*.learnings.json`; die
  Microsoft Teams-Doctor-/Setup-Migration importiert und archiviert die Legacy-Dateien.
  Ausstehende Uploads sind ein kurzlebiger SQLite-Cache, und alte JSON-Cache-Dateien werden
  nicht migriert.
- Matrix-Sync-Cache, Speichermetadaten, Thread-Bindings, eingehende Dedupe-Marker,
  Startup-Verifizierungs-Cooldown-Status, Zugangsdaten, Wiederherstellungsschlüssel und SDK-
  IndexedDB-Krypto-Snapshots verwenden jetzt SQLite-Plugin-State-/Blob-Namespaces unter
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  statt `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` und `crypto-idb-snapshot.json`; die Matrix-Doctor-/Setup-
  Migration importiert und entfernt diese Legacy-Dateien aus account-bezogenen Matrix-
  Speicherwurzeln.
- Nostr-Bus-Cursor und Profilveröffentlichungsstatus verwenden jetzt SQLite-Plugin-Zustand unter
  `nostr`-Namespaces (`bus-state`, `profile-state`) statt
  `bus-state-*.json` und `profile-state-*.json`; die Nostr-Doctor-/Setup-
  Migration importiert und entfernt die Legacy-Dateien.
- Active Memory-Sitzungsumschalter verwenden jetzt SQLite-Plugin-Zustand unter
  `active-memory/session-toggles` statt `session-toggles.json`.
- Skill-Workshop-Vorschlagswarteschlangen und Review-Zähler verwenden jetzt SQLite-Plugin-Zustand
  unter `skill-workshop/proposals` und `skill-workshop/reviews` statt
  arbeitsbereichsspezifischer `skill-workshop/<workspace>.json`-Dateien.
- Ausgehende Zustellungs- und Sitzungszustellungswarteschlangen teilen sich jetzt die globale SQLite-
  Tabelle `delivery_queue_entries` unter getrennten Warteschlangennamen
  (`outbound-delivery`, `session-delivery`) statt dauerhafter Dateien
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` und
  `session-delivery-queue/*.json`. Der Doctor-Schritt für Legacy-Zustand importiert
  ausstehende und fehlgeschlagene Zeilen, entfernt veraltete Zustellmarker und löscht die alten
  JSON-Dateien nach dem Import. Hot-Routing- und Wiederholungsfelder sind typisierte Spalten; die
  JSON-Payload bleibt nur für Replay/Debug erhalten.
- ACPX-Prozessleases verwenden jetzt SQLite-Plugin-Zustand unter `acpx/process-leases`
  statt `process-leases.json`.
- Backup- und Migrationsausführungsmetadaten

Verschieben Sie diese in Agent-Datenbanken:

- Agent-Sitzungswurzeln und kompatibilitätsförmige Sitzungs-Eintrags-Payloads. Für
  Laufzeit-Schreibvorgänge erledigt: Hot-Sitzungsmetadaten sind in `sessions` abfragbar, während die
  Legacy-förmige vollständige `SessionEntry`-Payload in `session_entries` bleibt.
- Agent-Transkriptereignisse. Für Laufzeit-Schreibvorgänge erledigt.
- Compaction-Checkpoints und Transkript-Snapshots. Für Laufzeit-Schreibvorgänge erledigt:
  Checkpoint-Transkriptkopien sind SQLite-Transkriptzeilen, und Checkpoint-
  Metadaten werden in `transcript_snapshots` erfasst. Gateway-Checkpoint-Helfer
  benennen diese Werte jetzt als Transkript-Snapshots statt als Quelldateien.
- Scratch-/Workspace-Namespaces des Agent-VFS. Für Laufzeit-VFS-Schreibvorgänge erledigt.
- Subagent-Anhang-Payloads. Für Laufzeit-Schreibvorgänge erledigt: Sie sind SQLite-VFS-
  Seed-Einträge und niemals dauerhafte Workspace-Dateien.
- Tool-Artefakte. Für Laufzeit-Schreibvorgänge erledigt.
- Ausführungsartefakte. Für Worker-Laufzeit-Schreibvorgänge über die agentenspezifische
  Tabelle `run_artifacts` erledigt.
- Agent-lokale Laufzeit-Caches. Für Worker-Laufzeit-Schreibvorgänge mit Geltungsbereich über
  die agentenspezifische Tabelle `cache_entries` erledigt. Gateway-weite Modell-Caches bleiben in der
  globalen Datenbank, sofern sie nicht agentenspezifisch werden.
- ACP-Parent-Stream-Protokolle. Für Laufzeit-Schreibvorgänge erledigt.
- ACP-Replay-Ledger-Sitzungen. Für Laufzeit-Schreibvorgänge über
  `acp_replay_sessions` und `acp_replay_events` erledigt; Legacy-`acp/event-ledger.json`
  bleibt nur als Doctor-Eingabe bestehen.
- ACP-Sitzungsmetadaten. Für Laufzeit-Schreibvorgänge über `acp_sessions` erledigt; Legacy-
  `entry.acp`-Blöcke in `sessions.json` sind nur Eingaben für die Doctor-Migration.
- Trajectory-Sidecars, wenn sie keine expliziten Exportdateien sind. Für Laufzeit-
  Schreibvorgänge erledigt: Trajectory-Erfassung schreibt `trajectory_runtime_events`-
  Zeilen in die Agent-Datenbank und spiegelt ausführungsspezifische Artefakte in SQLite. Legacy-Sidecars
  sind nur Doctor-Importeingaben; Export kann frische JSONL-Support-Bundle-Ausgaben
  materialisieren, liest oder migriert aber alte Trajectory-/Transkript-Sidecars nicht zur Laufzeit.
  Die Laufzeit-Trajectory-Erfassung stellt SQLite-Geltungsbereich bereit; JSONL-Pfadhelfer sind
  auf Export-/Debug-Unterstützung isoliert und werden nicht erneut aus dem Laufzeitmodul exportiert.
  Embedded-Runner-Trajectory-Metadaten erfassen `{agentId, sessionId, sessionKey}`-
  Identität, statt einen Transkript-Locator dauerhaft zu speichern.

Diese bleiben vorerst dateigestützt:

- `openclaw.json`
- Provider- oder CLI-Zugangsdaten-Dateien
- Plugin-/Paket-Manifeste
- Benutzer-Workspaces und Git-Repositorys, wenn der Datenträgermodus ausgewählt ist
- Protokolle, die für Operator-Tailing vorgesehen sind, sofern keine spezifische Protokolloberfläche verschoben wird

## Migrationsplan

### Phase 0: Grenze einfrieren

Machen Sie die Grenze für dauerhaften Zustand explizit, bevor weitere Zeilen verschoben werden:

- Fügen Sie der globalen Datenbank eine Tabelle `migration_runs` hinzu.
  Für Ausführungsberichte der Legacy-Zustandsmigration erledigt.
- Fügen Sie einen einzelnen, Doctor-eigenen Zustandsmigrationsdienst für Datei-zu-Datenbank-Import hinzu.
  Erledigt: `openclaw doctor --fix` verwendet die Implementierung der Legacy-Zustandsmigration.
- Machen Sie `plan` schreibgeschützt und lassen Sie `apply` ein Backup erstellen, importieren, verifizieren und
  dann alte Dateien löschen oder quarantänisieren.
  Erledigt: Doctor erstellt ein verifiziertes Backup vor der Migration, übergibt den Backup-Pfad
  an `migration_runs` und verwendet die Importer-/Entfernungspfade wieder.
- Fügen Sie statische Verbote hinzu, damit neuer Laufzeitcode keine Legacy-Zustandsdateien schreiben kann, während
  Migrationscode und Tests sie weiterhin anlegen/lesen können.
  Für die derzeit migrierten Legacy-Speicher erledigt; der Guard scannt auch verschachtelte
  Tests auf verbotene Laufzeit-Transkript-Locator-Verträge.

### Phase 1: Globale Steuerungsebene fertigstellen

Behalten Sie gemeinsamen Koordinationszustand in `state/openclaw.sqlite`:

- Agenten und Agent-Datenbankregistrierung
- Aufgaben- und TaskFlow-Ledger
- Plugin-Zustand
- Sandbox-Container-/Browser-Registrierung
- Cron-/Scheduler-Ausführungshistorie
- Kopplung, Gerät, Push, Updateprüfung, TUI, OpenRouter-/Modell-Caches und anderer
  kleiner Gateway-bezogener Laufzeitzustand
- Backup- und Migrationsmetadaten
- Gateway-Medienanhangsbytes. Für Laufzeit-Schreibvorgänge erledigt; direkte Dateipfade
  sind temporäre Materialisierungen für Kompatibilität mit Channel-Sendern und Sandbox-
  Staging. Laufzeit-Allowlists akzeptieren SQLite-Materialisierungspfade, keine Legacy-
  State-/Config-Medienwurzeln. Doctor importiert Legacy-Mediendateien in
  `media_blobs` und entfernt die Quelldateien nach erfolgreichen Zeilenschreibvorgängen.
- Debug-Proxy-Erfassungssitzungen, Ereignisse und Payload-Blobs. Erledigt: Erfassungen liegen
  in der gemeinsamen Zustandsdatenbank und öffnen über das gemeinsame Zustandsdatenbank-Bootstrap, Schema,
  WAL und Busy-Timeout-Einstellungen. Payload-Bytes werden in `capture_blobs.data` gzip-komprimiert;
  es gibt keine Debug-Proxy-Laufzeit-Sidecar-DB-Überschreibung,
  kein Blob-Verzeichnis und kein nur für Proxy-Erfassung generiertes Schema-/Codegen-Ziel.
  Die Doctor-/Startup-Migration importiert ausgelieferte `debug-proxy/capture.sqlite`-Zeilen
  und referenzierte Payload-Blobs, einschließlich aktiver Legacy-DB-/Blob-Umgebungs-
  Überschreibungen, und archiviert diese Quellen anschließend, während CA-Zertifikate unverändert bleiben.

Diese Phase löscht außerdem doppelte Sidecar-Opener, Berechtigungshelfer, WAL-
Setup, Dateisystembereinigung und Kompatibilitäts-Writer aus diesen Subsystemen.

### Phase 2: Agentenspezifische Datenbanken einführen

Erstellen Sie eine Datenbank pro Agent und registrieren Sie sie aus der globalen DB:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Die globale Zeile `agent_databases` speichert den Pfad, die Schemaversion, den Zeitstempel
der letzten Sichtung und grundlegende Größen-/Integritätsmetadaten. Laufzeitcode fragt die Registrierung nach
der Agent-DB ab, statt Dateipfade direkt abzuleiten.

Die Agent-DB enthält:

- `sessions` als kanonische Sitzungswurzel, mit `session_entries` als an
  diese Wurzel angehängte, kompatibilitätsgeformte Nutzlasttabelle und
  `session_routes` als eindeutiger aktiver `session_key`-Lookup
- `conversations` und `session_conversations` als normalisierte
  Provider-Routing-Identität, die an Sitzungen angehängt ist
- `transcript_events`
- Transcript-Snapshots und Compaction-Prüfpunkte. Für Runtime-Schreibvorgänge erledigt.
- `vfs_entries`
- `tool_artifacts` und Run-Artefakte
- agent-lokale Runtime-/Cache-Zeilen. Für Worker-scoped Caches erledigt.
- ACP-Eltern-Stream-Ereignisse
- Laufbahn-Runtime-Ereignisse, wenn sie keine expliziten Exportartefakte sind

### Phase 3: Session-Store-APIs ersetzen

Für die Runtime erledigt. Die dateiförmige Session-Store-Oberfläche ist kein aktiver
Runtime-Vertrag:

- Die Runtime ruft `loadSessionStore(storePath)` nicht mehr auf und behandelt `storePath` nicht als
  Sitzungsidentität.
- Runtime-Zeilenoperationen sind `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` und `listSessionEntries`.
- Hilfsfunktionen zum Umschreiben des gesamten Stores, Dateischreiber, Queue-Tests, Alias-Pruning und
  Parameter zum Löschen veralteter Schlüssel wurden aus der Runtime entfernt.
- Veraltete Kompatibilitätsexporte des Root-Pakets adaptieren weiterhin kanonische
  `sessions.json`-Pfade auf die SQLite-Zeilen-APIs.
- Das Parsen von `sessions.json` bleibt nur in Doctor-Migrations-/Importcode und
  Doctor-Tests.
- Runtime-Lifecycle-Fallbacks lesen SQLite-Transcript-Header, nicht zuerst JSONL-Erstzeilen.

Löschen Sie weiter alles, was Dateisperrparameter,
Pruning-/Trunkierung-als-Dateiwartung-Vokabular, Store-Pfad-Identität oder Tests
wiedereinführt, deren einzige Assertion JSON-Persistenz ist.

### Phase 4: Transcripts, ACP-Streams, Laufbahnen und VFS verschieben

Machen Sie jeden Agent-Datenstream datenbanknativ:

- Transcript-Append-Schreibvorgänge laufen über eine SQLite-Transaktion, die den
  Sitzungs-Header sicherstellt, Nachrichten-Idempotenz prüft, den Eltern-Tail auswählt, in
  `transcript_events` einfügt und abfragbare Identitätsmetadaten in
  `transcript_event_identities` aufzeichnet. Erledigt für direkte Transcript-Nachrichten-Appends und
  normale persistierte `TranscriptSessionManager`-Appends; explizite Branch-
  Operationen behalten ihre explizite Elternauswahl bei und schreiben weiterhin SQLite-Zeilen,
  ohne einen Dateilokator abzuleiten.
- ACP-Eltern-Stream-Logs werden zu Zeilen, nicht zu `.acp-stream.jsonl`-Dateien. Erledigt.
- ACP-Spawn-Setup persistiert keine Transcript-JSONL-Pfade mehr. Erledigt.
- Runtime-Laufbahnerfassung schreibt Ereigniszeilen/Artefakte direkt. Der explizite
  Support-/Exportbefehl kann weiterhin Support-Bundle-JSONL-Artefakte als
  Exportformat erzeugen, aber der Sitzungsexport erstellt keine Sitzungs-JSONL neu. Erledigt.
- Disk-Workspaces bleiben auf der Festplatte, wenn sie als Disk-Modus konfiguriert sind.
- VFS-Scratch und der experimentelle reine VFS-Workspace-Modus verwenden die Agent-DB.

Die Migration importiert alte JSONL-Dateien einmalig, zeichnet Zählwerte/Hashes in
`migration_runs` auf und entfernt importierte Dateien nach Integritätsprüfungen.

### Phase 5: Backup, Restore, Vacuum und Verify

Backups bleiben eine Archivdatei:

- Für jede globale und Agent-Datenbank einen Checkpoint ausführen.
- Jede DB mit SQLite-Backup-Semantik oder `VACUUM INTO` snapshotten.
- Kompakte DB-Snapshots, Konfiguration, externe Zugangsdaten und angeforderte
  Workspace-Exporte archivieren.
- Rohe Live-Dateien `*.sqlite-wal` und `*.sqlite-shm` auslassen.
- Verifizieren, indem jeder DB-Snapshot geöffnet und `PRAGMA integrity_check` ausgeführt wird.
  `openclaw backup create` führt diese Archivverifizierung standardmäßig durch;
  `--no-verify` überspringt nur den nachträglichen Archivdurchlauf, nicht die
  Integritätsprüfung bei der Snapshot-Erstellung.
- Restore kopiert Snapshots zurück an ihre Zielpfade. Dieser Branch setzt das
  noch nicht ausgelieferte SQLite-Layout auf `user_version = 1` zurück; künftige ausgelieferte Schemaänderungen
  können explizite Migrationen hinzufügen, wenn sie benötigt werden.

### Phase 6: Worker-Runtime

Halten Sie den Worker-Modus experimentell, während die Datenbankaufteilung landet:

- Worker erhalten Agent-ID, Run-ID, Dateisystemmodus und DB-Registry-Identität.
- Jeder Worker öffnet seine eigene SQLite-Verbindung.
- Der Parent behält Channel-Zustellung, Freigaben, Konfiguration und Abbruchautorität.
- Beginnen Sie mit einem Worker pro aktivem Run; fügen Sie Pooling erst hinzu, nachdem Lifecycle und DB-
  Verbindungszuständigkeit stabil sind.

### Phase 7: Die alte Welt löschen

Für Runtime-Sitzungsverwaltung erledigt. Die alte Welt ist nur als explizite
Doctor-Eingabe oder Support-/Exportausgabe erlaubt:

- Keine Runtime-Schreibvorgänge für `sessions.json`, Transcript-JSONL, Sandbox-Registry-JSON, Task-
  Sidecar-SQLite oder Plugin-State-Sidecar-SQLite.
- Kein JSON-/Sitzungsdatei-Pruning, keine Datei-Transcript-Trunkierung, keine Sitzungsdateisperren
  oder sperrenförmigen Sitzungstests.
- Keine Runtime-Kompatibilitätsexporte, deren Zweck darin besteht, alte Sitzungsdateien
  aktuell zu halten.
- Explizite Support-Exporte bleiben vom Benutzer angeforderte Archiv-/Materialisierungsformate
  und dürfen Dateinamen nicht zurück in Runtime-Identität einspeisen.

## Backup und Restore

Backups sollten eine Archivdatei sein, aber die Datenbankerfassung sollte
SQLite-nativ sein:

1. Stoppen Sie lang laufende Schreibaktivität oder treten Sie in eine kurze Backup-Barriere ein.
2. Führen Sie für jede globale und Agent-Datenbank einen Checkpoint aus.
3. Snapshotten Sie jede Datenbank mit SQLite-Backup-Semantik oder `VACUUM INTO` in ein
   temporäres Backup-Verzeichnis.
4. Archivieren Sie die kompaktierten Datenbank-Snapshots, die Konfigurationsdatei, das Zugangsdatenverzeichnis,
   ausgewählte Workspaces und ein Manifest.
5. Verifizieren Sie das Archiv, indem Sie jeden enthaltenen SQLite-Snapshot öffnen und
   `PRAGMA integrity_check` ausführen.
   `openclaw backup create` tut dies standardmäßig; `--no-verify` ist nur dafür vorgesehen,
   den nachträglichen Archivdurchlauf absichtlich zu überspringen.

Verlassen Sie sich nicht auf rohe Live-Kopien von `*.sqlite`, `*.sqlite-wal` und `*.sqlite-shm` als
primäres Backup-Format. Das Archivmanifest sollte Datenbankrolle,
Agent-ID, Schemaversion, Quellpfad, Snapshot-Pfad, Byte-Größe und Integritätsstatus
aufzeichnen.

Restore sollte die globale Datenbank und Agent-Datenbankdateien aus den
Archiv-Snapshots neu aufbauen. Da das SQLite-Layout noch nicht ausgeliefert wurde, behält dieser Refactor
nur das Version-1-Schema plus Doctor-Datei-zu-Datenbank-Import bei. Der Restore-
Befehl validiert zuerst das Archiv und ersetzt dann jedes Manifest-Asset aus der
verifizierten extrahierten Nutzlast.

## Runtime-Refactor-Plan

1. Datenbank-Registry-APIs hinzufügen.
   - Globale DB- und Pro-Agent-DB-Pfade auflösen.
   - Die noch nicht ausgelieferten Schemata bei `user_version = 1` halten; keinen Schema-
     Migrations-Runner-Code hinzufügen, bis ein ausgeliefertes Schema ihn benötigt.
   - Close-/Checkpoint-/Integritäts-Hilfsfunktionen hinzufügen, die von Tests, Backup und Doctor verwendet werden.

2. Sidecar-SQLite-Stores zusammenführen.
   - Plugin-State-Tabellen in die globale Datenbank verschieben. Für Runtime-
     Schreibvorgänge erledigt; der noch nicht ausgelieferte Legacy-Sidecar-Importer ist gelöscht.
   - Task-Registry-Tabellen in die globale Datenbank verschieben. Für Runtime-
     Schreibvorgänge erledigt; der noch nicht ausgelieferte Legacy-Sidecar-Importer ist gelöscht.
   - TaskFlow-Tabellen in die globale Datenbank verschieben. Für Runtime-Schreibvorgänge erledigt;
     der noch nicht ausgelieferte Legacy-Sidecar-Importer ist gelöscht.
   - Eingebaute Memory-Search-Tabellen in jede Agent-Datenbank verschieben. Erledigt; explizites
     benutzerdefiniertes `memorySearch.store.path` wird jetzt von der Doctor-Konfigurationsmigration entfernt.
     Vollständige Neuindizierung läuft direkt gegen Memory-Tabellen; der alte Whole-File-
     Swap-Pfad und die Sidecar-Index-Swap-Hilfsfunktion sind gelöscht.
   - Doppelte Datenbank-Opener, WAL-Setup, Berechtigungs-Hilfsfunktionen und
     Close-Pfade aus diesen Subsystemen löschen.

3. Agent-eigene Tabellen in Pro-Agent-Datenbanken verschieben.
   - Agent-DB bei Bedarf über die globale Datenbank-Registry erstellen. Erledigt.
   - Runtime-Sitzungseinträge, Transcript-Ereignisse, VFS-Zeilen und Tool-
     Artefakte in Agent-DBs verschieben. Erledigt.
   - Branch-lokale Shared-DB-Sitzungseinträge, Transcript-Ereignisse,
     VFS-Zeilen oder Tool-Artefakte nicht migrieren; dieses Layout wurde nie ausgeliefert. Nur Legacy-
     Datei-zu-Datenbank-Import in Doctor behalten.

4. Session-Store-APIs ersetzen.
   - `storePath` als Runtime-Identität entfernen. Für Runtime erledigt und durch
     `check:database-first-legacy-stores` abgesichert: Sitzungsmetadaten, Route-Updates,
     Befehlspersistenz, CLI-Sitzungsbereinigung, Feishu-Reasoning-Previews,
     Transcript-State-Persistenz, Subagent-Tiefe, Auth-Profil-Sitzungs-
     Overrides, Parent-Fork-Logik und QA-Lab-Inspektion lösen die
     Datenbank jetzt aus kanonischen Agent-/Sitzungsschlüsseln auf.
     Gateway-/TUI-/UI-/macOS-Sitzungslisten-Antworten legen jetzt `databasePath`
     statt des Legacy-`path` offen; macOS-Debug-Oberflächen zeigen die Pro-Agent-Datenbank
     als schreibgeschützten Zustand, statt `session.store`-Konfiguration zu schreiben.
     `/status`, chatgesteuerter Laufbahnexport und CLI-Abhängigkeits-Proxys propagieren keine
     Legacy-Store-Pfade mehr; Transcript-Nutzungsfallback liest
     SQLite per Agent-/Sitzungsidentität. Runtime- und Bridge-Tests legen
     `storePath` nicht mehr offen; Doctor-/Migrationseingaben besitzen diesen Legacy-Feldnamen.
     Gateway-Combined-Session-Loading hat keinen speziellen Runtime-Branch mehr für
     nicht vorlagenbasierte `session.store`-Werte; es aggregiert Pro-Agent-SQLite-Zeilen.
     Die Legacy-Session-Lock-Doctor-Lane und ihre `.jsonl.lock`-Cleanup-Hilfsfunktion
     wurden entfernt; SQLite ist jetzt die Sitzungs-Parallelitätsgrenze.
     Heiße Runtime-Aufrufstellen verwenden zeilenorientierte Hilfsnamen wie
     `resolveSessionRowEntry`; der alte Kompatibilitätsalias `resolveSessionStoreEntry`
     wurde aus Runtime- und Plugin-SDK-Exporten entfernt.

- `{ agentId, sessionKey }`-Zeilenoperationen verwenden.
  Erledigt: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` und `listSessionEntries` sind SQLite-first-APIs, die
  keinen Sitzungs-Store-Pfad erfordern. Statuszusammenfassung, lokaler Agent-Status, Health
  und der Listing-Befehl `openclaw sessions` lesen jetzt Pro-Agent-Zeilen direkt
  und zeigen Pro-Agent-SQLite-Datenbankpfade statt `sessions.json`-Pfaden an.
- Whole-Store-Löschen/-Einfügen durch `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` und SQL-Cleanup-Abfragen ersetzen.
  Für Runtime erledigt: Heiße Pfade verwenden jetzt Zeilen-APIs und konfliktwiederholte Zeilen-Patches;
  verbleibende Whole-Store-Import-/Replace-Hilfsfunktionen sind auf Migrationsimport-
  Code und SQLite-Backend-Tests beschränkt.
  - `store-writer.ts` und Writer-Queue-Tests löschen. Erledigt.
  - Runtime-Legacy-Key-Pruning und Alias-Delete-Parameter aus Session-
    Row-Upserts/-Patches löschen. Erledigt.

5. Runtime-JSON-Registry-Verhalten löschen.
   - Sandbox-Registry-Lese- und Schreibvorgänge ausschließlich SQLite-basiert machen. Erledigt.
   - Monolithisches und geshardetes JSON nur aus dem Migrationsschritt importieren. Erledigt.
   - Geshardete Registry-Sperren und JSON-Schreibvorgänge entfernen. Erledigt.

- Eine typisierte Registry-Tabelle behalten, statt Registry-Zeilen als generisches
  opakes JSON zu speichern, wenn die Form heißer operativer Pfadzustand bleibt. Erledigt.

6. Dateisperrenförmige Sitzungsmutation löschen.
   - Für Runtime-Sperrenerstellung und Runtime-Sperr-APIs erledigt.
   - Die eigenständige Legacy-`.jsonl.lock`-Doctor-Cleanup-Lane ist entfernt.
   - `session.writeLock` ist per Doctor migrierte Legacy-Konfiguration, keine typisierte Runtime-
     Einstellung.
   - State-Integrität hat keinen separaten Orphan-Transcript-Datei-Pruning-
     Pfad mehr; Doctor-Migration importiert/entfernt Legacy-JSONL-Quellen an einer Stelle.
   - Gateway-Singleton-Koordination verwendet typisierte SQLite-`state_leases`-Zeilen unter
     `gateway_locks` und legt keinen Dateisperren-Verzeichnis-Seam mehr offen.
   - Generische Plugin-SDK-Dedupe-Persistenz verwendet keine Dateisperren oder JSON-
     Dateien mehr; sie schreibt gemeinsame SQLite-Plugin-State-Zeilen. Erledigt.
   - QMD-Embed-Koordination verwendet eine SQLite-State-Lease statt
     `qmd/embed.lock`. Erledigt.

7. Worker datenbankbewusst machen.
   - Worker öffnen ihre eigenen SQLite-Verbindungen.
   - Parent besitzt Zustellung, Channel-Callbacks und Konfiguration.
   - Worker erhält Agent-ID, Run-ID, Dateisystemmodus und DB-Registry-
     Identität, keine Live-Handles.
   - `vfs-only` bleibt experimentell und verwendet die Agent-Datenbank als Speicher-
     Root.
   - Zunächst einen Worker pro aktivem Run behalten. Pooling kann warten, bis DB-Verbindungs-
     Lebensdauer und Abbruchverhalten unproblematisch sind.

8. Backup-Integration.
   - Backup beibringen, globale und Agent-Datenbanken per SQLite-Backup oder
     `VACUUM INTO` zu snapshotten. Für erkannte `*.sqlite`-Dateien unter dem State-Asset erledigt.
   - Backup-Verifizierung für SQLite-Integrität und Schemaversion hinzufügen. Für
     Backup-Erstellung und Integritätsprüfungen der Standard-Archivverifizierung erledigt.
   - Metadaten zum Backup-Lauf in SQLite erfassen. Über die gemeinsame Tabelle
     `backup_runs` mit Archivpfad, Status und Manifest-JSON erledigt.
   - Wiederherstellung aus verifizierten Archiv-Snapshots hinzufügen. Erledigt: `openclaw backup
restore` validiert vor der Extraktion, verwendet das normalisierte Manifest
     des Verifizierers, unterstützt `--dry-run` und erfordert `--yes`, bevor
     aufgezeichnete Quellpfade ersetzt werden.
   - VFS-/Workspace-Export nur bei Anforderung einschließen; Sitzungsinternes
     nicht als JSON oder JSONL exportieren.

9. Veraltete Tests und veralteten Code löschen. Für die bekannten Runtime-Sitzungsoberflächen erledigt.

- Tests entfernen, die die Runtime-Erstellung von `sessions.json` oder Transcript-
  JSONL-Dateien prüfen. Erledigt für Core-Sitzungsspeicher, Chat, Gateway-Transcript-Events,
  Vorschau, Lebenszyklus, Command-Session-Entry-Updates, Auto-Reply-Reset/-Trace und
  Memory-Core-Dreaming-Fixtures, Approval-Ziel-Routing, Sitzungs-Transcript-
  Reparatur, Sicherheitsberechtigungs-Reparatur, Trajectory-Export und Sitzungsexport.
  Active-Memory-Transcript-Tests prüfen jetzt SQLite-Scopes und keine Erstellung
  temporärer oder persistierter JSONL-Dateien.
  Die alte Heartbeat-Regression zum Beschneiden von Transcripts wurde entfernt, weil
  die Runtime JSONL-Transcripts nicht mehr kürzt.
  Agent-Session-List-Tool-Tests modellieren Legacy-`sessions.json`-Pfade nicht mehr
  als Gateway-Antwortform; App-/UI-/macOS-Tests verwenden `databasePath`.
  `/status`-Transcript-Usage-Tests seeden SQLite-Transcript-Zeilen jetzt direkt,
  statt JSONL-Dateien zu schreiben.
  Gateway-Session-Lifecycle-Tests verwenden jetzt SQLite-Transcript-Seeding-Helfer
  direkt; die alte einzeilige Session-File-Fixture-Form ist aus Reset- und
  Delete-Abdeckung verschwunden.
  `sessions.delete` gibt kein File-era-Feld `archived: []` mehr zurück; Löschung
  meldet nur das Ergebnis der Zeilenmutation. Die alte Option `deleteTranscript`
  ist ebenfalls verschwunden: Das Löschen einer Sitzung entfernt die kanonische
  `sessions`-Root und lässt SQLite sitzungseigene Transcript-, Snapshot- und
  Trajectory-Zeilen kaskadierend löschen, sodass kein Caller Transcript-Waisen
  zurücklassen oder einen Cleanup-Zweig vergessen kann.
  Context-Engine-Trajectory-Capture-Tests lesen jetzt `trajectory_runtime_events`-
  Zeilen aus einer isolierten Agent-Datenbank, statt `session.trajectory.jsonl`
  zu lesen.
  Docker-MCP-Channel-Seed-Skripte seeden SQLite-Zeilen jetzt direkt. Direkte
  `sessions.json`-Schreibvorgänge sind auf Doctor-Fixtures begrenzt.
  Tool Search Gateway E2E liest Tool-Call-Belege aus SQLite-Transcript-Zeilen,
  statt `agents/<agentId>/sessions/*.jsonl`-Dateien zu scannen.
  Memory-Core-Host-Events und Session-Corpus-Scratch-Zeilen liegen jetzt im gemeinsamen
  SQLite-Plugin-State; `events.jsonl` und `session-corpus/*.txt` sind nur noch
  Legacy-Doctor-Migrationseingaben. Aktive Zeilen verwenden virtuelle Pfade unter
  `memory/session-ingestion/`, nicht `.dreams/session-corpus`. Das alte Memory-Core-
  Dreaming-Reparaturmodul und seine CLI-/Gateway-Tests wurden entfernt, weil die
  Runtime keine File-Archive-Reparatur für diesen Corpus mehr besitzt. Memory-Core-
  Bridge-/Public-Artifact-Tests zeigen `.dreams/events.jsonl` nicht mehr an; sie
  verwenden den SQLite-gestützten virtuellen JSON-Artefaktnamen.
  Öffentliche SDK-/Codex-Testdokumentation spricht jetzt von SQLite-Sitzungsstatus
  statt Sitzungsdateien, und das Channel-Turn-Beispiel legt kein Argument
  `storePath` mehr offen.
  Matrix-Sync-Status verwendet jetzt direkt den SQLite-Plugin-State-Store. Aktive
  Client-/Runtime-Verträge übergeben eine Account-Speicher-Root, keinen
  `bot-storage.json`-Pfad, und Doctor importiert Legacy-`bot-storage.json` nach
  SQLite, bevor die Quelle gelöscht wird. QA-Matrix-Restart-/Destructive-Szenarien
  mutieren jetzt direkt die SQLite-Sync-Zeile, statt gefälschte `bot-storage.json`-
  Dateien zu erstellen oder zu löschen, und das E2EE-Substrat übergibt eine
  Sync-Store-Root statt eines gefälschten `sync-store.json`-Pfads.
  Matrix-Storage-Root-Auswahl bewertet Roots nicht mehr anhand von Legacy-Sync-/Thread-
  JSON-Dateien; sie verwendet dauerhafte Root-Metadaten plus echten Kryptostatus.
  Die Runtime-SQLite-Sitzungsbackend-Testsuite erzeugt kein `sessions.json` mehr;
  Legacy-Quell-Fixtures liegen jetzt in den Doctor-Tests, die sie importieren.
  Gateway-Sitzungstests legen keinen `createSessionStoreDir`-Helfer und keine
  ungenutzte Temp-Session-Store-Pfadeinrichtung mehr offen; Fixture-Verzeichnisse
  sind explizit, und direkte Zeileneinrichtung verwendet SQLite-Session-Row-Naming.
  Doctor-only-JSON5-Session-Store-Parser-Abdeckung wurde aus Infra-Tests in
  Doctor-Migrationstests verschoben, sodass Runtime-Testsuites keine Legacy-
  Session-File-Parsing-Abdeckung mehr besitzen.
  Microsoft Teams-Runtime-SSO-/Pending-Upload-Tests führen keine JSON-Sidecar-Fixtures
  oder Parser mehr mit; Legacy-SSO-Token-Parsing liegt nur noch im Plugin-
  Migrationsmodul. Telegram-Tests seeden keine gefälschten `/tmp/*.json`-Store-
  Pfade mehr; sie setzen den SQLite-gestützten Message Cache direkt zurück. Der
  generische OpenClaw-Test-State-Helfer legt keinen Legacy-`auth-profiles.json`-
  Writer mehr offen; Doctor-Auth-Migrationstests besitzen diese Fixture lokal.
  Runtime-Tests für TUI-Last-Session-Zeiger, Exec-Approvals, Active-Memory-
  Toggles, Matrix-Dedupe-/Startup-Verifizierung, Memory-Wiki-Quellsynchronisierung,
  Current-Conversation-Bindings, Onboarding-Auth und Hermes-Secret-Importe erzeugen
  keine alten Sidecar-Dateien mehr und prüfen nicht mehr, dass alte Dateinamen
  fehlen. Sie belegen Verhalten über SQLite-Zeilen und öffentliche Store-APIs;
  Doctor-/Migrationstests sind der einzige Ort für Legacy-Quelldateinamen.
  Runtime-Tests für Device-/Node-Pairing, Channel allowFrom, Restart-Intents,
  Restart-Handoff, Einträge in der Sitzungszustellungsqueue, Config Health, iMessage-
  Caches, Cron-Jobs, PI-Transcript-Header, Subagent-Registries und verwaltete
  Bildanhänge erstellen ebenfalls keine ausgemusterten JSON-/JSONL-Dateien mehr,
  nur um zu belegen, dass sie ignoriert werden oder fehlen.
  PI-Overflow-Recovery hat keinen SessionManager-Rewrite-/Truncation-Fallback mehr:
  Tool-Result-Truncation und Context-Engine-Transcript-Rewrites mutieren SQLite-
  Transcript-Zeilen und aktualisieren anschließend den aktiven Prompt-Zustand aus
  der Datenbank.
  Persistierte SessionManager-Message-Appends delegieren für Parent-Auswahl und
  Idempotenz an den atomaren SQLite-Transcript-Append-Helfer. Normale Metadata-/
  Custom-Entry-Appends wählen den aktuellen Parent ebenfalls innerhalb von SQLite,
  sodass veraltete Manager-Instanzen keine Parent-Chain-Races aus der Vor-SQLite-
  Zeit wiederbeleben.
  Synthetisches PI-Tail-Cleanup für Mid-Turn-Prechecks und `sessions_yield`
  beschneidet jetzt SQLite-Transcript-Status direkt; die alte SessionManager-
  Tail-Removal-Bridge und ihre Tests sind gelöscht.
  Compaction-Checkpoint-Erfassung snapshotet ebenfalls nur noch aus SQLite; Caller
  übergeben keinen Live-SessionManager mehr als alternative Transcript-Quelle.
- Tests behalten, die Legacy-Dateien nur für Migration seeden.
- JSON-Datei-Belege wurden für aktive Runtime-Oberflächen durch SQL-Zeilen-Belege ersetzt.

- Statische Verbote für Runtime-Schreibvorgänge in Legacy-Session-/Cache-JSON-Pfade hinzufügen.
  Für den Repo-Guard erledigt.

10. Den Migrationsbericht auditierbar machen.
    - Migrationsläufe in SQLite mit Start-/Endzeitstempeln, Quellpfaden,
      Quell-Hashes, Zählwerten, Warnungen und Backup-Pfad erfassen.
      Erledigt: Legacy-State-Migrationsausführungen persistieren jetzt einen
      `migration_runs`-Bericht mit Quellpfad-/Tabelleninventar, SHA-256 der
      Quelldatei, Größen, Datensatzzahlen, Warnungen und Backup-Pfad.
      Erledigt: Legacy-State-Migrationsausführungen persistieren außerdem
      `migration_sources`-Zeilen für Audits auf Quellebene und künftige
      Skip-/Backfill-Entscheidungen.
    - Apply idempotent machen. Erneutes Ausführen nach einem Teilimport sollte
      eine bereits importierte Quelle entweder überspringen oder per stabilem
      Schlüssel zusammenführen.
      Erledigt: Sitzungsindizes, Transcripts, Zustellungsqueues, Plugin-State,
      Task-Ledger und Agent-eigene globale SQLite-Zeilen werden über stabile
      Schlüssel oder Upsert-/Replace-Semantik importiert, sodass Wiederholungen
      zusammenführen, ohne dauerhafte Zeilen zu duplizieren.
    - Fehlgeschlagene Importe müssen die ursprüngliche Quelldatei an Ort und Stelle lassen.
      Erledigt: Fehlgeschlagene Transcript-Importe lassen die ursprüngliche JSONL-
      Quelle jetzt an ihrem erkannten Pfad, und `migration_sources` erfasst die
      Quelle als `warning` mit `removed_source=0` für den nächsten Doctor-Lauf.

## Performance-Regeln

- Eine Verbindung pro Thread/Prozess ist in Ordnung; Handles nicht über
  Worker hinweg teilen.
- WAL, `foreign_keys=ON`, ein 30-s-Busy-Timeout und kurze `BEGIN IMMEDIATE`-
  Schreibtransaktionen verwenden.
- Schreibtransaktions-Helfer synchron halten, sofern/bis eine asynchrone
  Transaktions-API explizite Mutex-/Backpressure-Semantik hinzufügt.
- Parent-Delivery-Schreibvorgänge klein und transaktional halten.
- Whole-Store-Rewrites vermeiden; Upsert/Delete auf Zeilenebene verwenden.
- Indizes für List-by-Agent, List-by-Session, Updated-at, Run-ID und
  Ablaufpfade hinzufügen, bevor Hot Code verschoben wird.
- Große Artefakte, Medien und Vektoren als BLOBs oder gechunkte BLOB-Zeilen
  speichern, nicht als Base64- oder Numeric-Array-JSON.
- Opaque Plugin-State-Einträge klein und scoped halten.
- SQL-Cleanup für TTL/Ablauf statt Dateisystem-Pruning hinzufügen.
  Für datenbankeigene Runtime-Stores erledigt: Medien, Plugin-State, Plugin-Blobs,
  persistente Dedupe und Agent-Cache laufen alle über SQLite-Zeilen ab. Verbleibendes
  Dateisystem-Cleanup ist auf temporäre Materialisierungen oder explizite
  Entfernungsbefehle begrenzt.

## Statische Verbote

Einen Repo-Check hinzufügen, der neue Runtime-Schreibvorgänge in Legacy-State-Pfade fehlschlagen lässt:

- `sessions.json`
- `*.trajectory.jsonl` außer materialisierten Support-Bundle-Ausgaben
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` Runtime-Cache-Dateien
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` und `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- Sandbox-Registry-Shard-JSON-Dateien
- native Hook-Relay-Bridge-JSON-Dateien unter `/tmp`
- `plugin-state/state.sqlite`
- Ad-hoc-`openclaw-state.sqlite`-Runtime-Sidecars
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- Browser-Profildekoration `.openclaw-profile-decorated`
- `SessionManager.open(...)` dateibasierte Sitzungs-Opener
- `SessionManager.listAll(...)` und `TranscriptSessionManager.listAll(...)`
  Transcript-Auflistungsfassaden
- `SessionManager.forkFromSession(...)` und
  `TranscriptSessionManager.forkFromSession(...)` Transcript-Fork-Fassaden
- `SessionManager.newSession(...)` und `TranscriptSessionManager.newSession(...)`
  Fassaden für austauschbare Sitzungsersetzung
- `SessionManager.createBranchedSession(...)` und
  `TranscriptSessionManager.createBranchedSession(...)` Branch-Session-Fassaden

Das Verbot sollte Tests das Erstellen von Legacy-Fixtures erlauben und Migrationscode das Lesen/Importieren/Entfernen von Legacy-Dateiquellen ermöglichen. Nicht ausgelieferte SQLite-Sidecars bleiben verboten und erhalten keine Doctor-Import-Freigaben.

## Erledigungskriterien

- Runtime-Daten- und Cache-Schreibvorgänge gehen in die globale oder agentenbezogene SQLite-Datenbank.
- Die Runtime schreibt keine Sitzungsindizes, Transcript-JSONL, Sandbox-Registry-JSON, Task-Sidecar-SQLite oder Plugin-State-Sidecar-SQLite mehr. Die nicht ausgelieferten Importer für Task- und Plugin-State-Sidecar-SQLite sind gelöscht.
- Legacy-Dateiimport erfolgt nur über Doctor.
- Backup erzeugt ein Archiv mit kompakten SQLite-Snapshots und Integritätsnachweis.
- Agent-Worker können mit Datenträger-, VFS-Scratch- oder experimentellem reinem VFS-Speicher ausgeführt werden.
- Konfigurations- und explizite Anmeldedatendateien bleiben die einzigen erwarteten persistenten Nicht-Datenbank-Steuerdateien.
- Repo-Prüfungen verhindern die Wiedereinführung von Legacy-Runtime-Dateispeichern.
