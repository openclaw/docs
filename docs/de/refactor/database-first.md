---
read_when:
    - OpenClaw-Laufzeitdaten, Cache, Transkripte, Aufgabenstatus oder Scratch-Dateien nach SQLite verschieben
    - Doctor-Migrationen aus Legacy-JSON- oder JSONL-Dateien entwerfen
    - Backup-, Wiederherstellungs-, VFS- oder Worker-Speicherverhalten ändern
    - Sitzungssperren, Bereinigung, Kürzung oder JSON-Kompatibilitätspfade entfernen
summary: Migrationsplan, um SQLite zur primären dauerhaften Zustands- und Cache-Schicht zu machen, während die config dateibasiert bleibt
title: Datenbankorientierter Zustands-Refactor
x-i18n:
    generated_at: "2026-06-27T18:08:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# Database-First-State-Refactor

## Entscheidung

Verwenden Sie ein zweistufiges SQLite-Layout:

- Globale Datenbank: `~/.openclaw/state/openclaw.sqlite`
- Agent-Datenbank: eine SQLite-Datenbank pro Agent für agenteneigenen Workspace,
  Transcript, VFS, Artefakt und großen agentenspezifischen Laufzeitstatus
- Die Konfiguration bleibt dateibasiert: `openclaw.json` bleibt außerhalb der
  Datenbank. Laufzeit-Auth-Profile wandern nach SQLite; externe Provider- oder CLI-
  Zugangsdaten-Dateien bleiben inhaberverwaltet außerhalb der OpenClaw-Datenbank.

Die globale Datenbank ist die Control-Plane-Datenbank. Sie verwaltet Agent-Erkennung,
gemeinsamen Gateway-Status, Pairing, Geräte-/Node-Status, Aufgaben- und Flow-Ledger, Plugin-
Status, Scheduler-Laufzeitstatus, Backup-Metadaten und Migrationsstatus.

Die Agent-Datenbank ist die Data-Plane-Datenbank. Sie verwaltet die Sitzungsmetadaten
des Agents, den Transcript-Ereignisstream, den VFS-Workspace oder Scratch-Namespace, Tool-
Artefakte, Laufartefakte und durchsuchbare/indizierbare agentenlokale Cache-Daten.

Damit entsteht eine dauerhafte globale Sicht, ohne große Agent-Workspaces,
Transcripts und binäre Scratch-Daten in die gemeinsame Gateway-Schreibspur zu zwingen.

## Harter Vertrag

Diese Migration hat eine kanonische Laufzeitform:

- Sitzungszeilen speichern nur Sitzungsmetadaten. Sie dürfen keine
  `transcriptLocator`, Transcript-Dateipfade, benachbarten JSONL-Pfade, Sperrpfade,
  Pruning-Metadaten oder Kompatibilitätszeiger aus der Datei-Ära speichern.
- Transcript-Identität ist immer SQLite-Identität: `{agentId, sessionId}` plus
  optionale Themenmetadaten, wenn das Protokoll sie benötigt.
- `sqlite-transcript://...` ist keine Laufzeit- oder Protokollidentität. Neuer Code darf
  Transcript-Locators nicht ableiten, speichern, weitergeben, parsen oder migrieren.
  Laufzeit und Tests sollten überhaupt keine Pseudo-Locators enthalten; Dokumentation darf
  die Zeichenfolge nur erwähnen, um sie zu verbieten.
- Legacy-`sessions.json`, Transcript-JSONL, `.jsonl.lock`, Pruning, Kürzung
  und alte Sitzungspfadlogik gehören nur in den doctor-Migrations-/Importpfad.
- Legacy-Sitzungskonfigurationsaliase gehören nur in die doctor-Migration. Die Laufzeit
  interpretiert `session.idleMinutes`, `session.resetByType.dm` oder
  agentenübergreifende `agent:main:*`-Hauptsitzungsaliase für einen anderen konfigurierten Agent nicht.
- Sitzungsrouting-Identität ist typisierter relationaler Status. Heiße Laufzeit- und UI-Pfade
  sollten `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` und
  `session_conversations` lesen; sie dürfen `session_key` nicht parsen oder
  `session_entries.entry_json` nach Provider-Identität durchsuchen, außer als
  Kompatibilitätsschatten, während alte Aufrufstellen gelöscht werden.
- Direktnachrichtenmarker auf Kanalebene wie `dm` gegenüber `direct` sind Routing-
  Vokabular, keine Transcript-Locators oder Kompatibilitäts-Handles für Dateispeicher.
- Legacy-Hook-Handler-Konfiguration gehört nur in doctor-Warnungs-/Migrationsflächen.
  Die Laufzeit darf `hooks.internal.handlers` nicht laden; Hooks laufen ausschließlich über erkannte
  Hook-Verzeichnisse und `HOOK.md`-Metadaten.
- Laufzeitstart, heiße Antwortpfade, Compaction, Reset, Wiederherstellung, Diagnose,
  TTS, Memory-Hooks, Subagenten, Plugin-Befehlsrouting, Protokollgrenzen und
  Hooks müssen `{agentId, sessionId}` durch die Laufzeit weitergeben.
- Tests sollten SQLite-Transcript-Zeilen über `{agentId, sessionId}` anlegen und prüfen.
  Tests, die nur JSONL-Pfadweitergabe, Erhalt eines vom Aufrufer gelieferten Locators
  oder Transcript-Dateikompatibilität belegen, sollten gelöscht werden, sofern sie nicht
  doctor-Import, Nicht-Sitzungs-Support-/Debug-Materialisierung oder Protokollform abdecken.
- `runEmbeddedPiAgent(...)`, vorbereitete Worker-Läufe und der innere eingebettete
  Versuch dürfen keine Transcript-Locators akzeptieren. Sie öffnen den SQLite-Transcript-
  Manager über `{agentId, sessionId}` und geben diesen Manager an die internalisierte
  PI-kompatible Agent-Sitzung weiter, damit veraltete Aufrufer den Runner nicht zum Schreiben
  von JSON/JSONL-Transcripts bringen können.
- Runner-Diagnosen müssen Laufzeit-/Cache-/Payload-Trace-Datensätze in SQLite speichern.
  Laufzeitdiagnosen dürfen keine JSONL-Datei-Override-Schalter oder generischen
  Transcript-JSONL-Exporthelfer offenlegen; nutzerseitige Exporte können explizite
  Artefakte aus Datenbankzeilen materialisieren, ohne Dateinamen zurück in die Laufzeit zu geben.
- Raw-Stream-Logging verwendet `OPENCLAW_RAW_STREAM=1` plus SQLite-Diagnosezeilen.
  Der alte pi-mono-Vertrag für den Dateilogger `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` und
  `raw-openai-completions.jsonl` ist nicht Teil der OpenClaw-Laufzeit oder -Tests.
- QMD-Memory-Indizierung darf SQLite-Transcripts nicht in Markdown-Dateien exportieren.
  QMD indiziert nur konfigurierte Memory-Dateien; die Sitzungstranscript-Suche bleibt
  SQLite-gestützt.
- Der QMD-SDK-Unterpfad ist für neuen Code ausschließlich QMD. SQLite-Helfer für die
  Sitzungstranscript-Indizierung leben auf `memory-core-host-engine-session-transcripts`;
  jeder QMD-Re-Export ist nur Kompatibilität und darf nicht von Laufzeitcode verwendet werden.
- Eingebaute Memory-Indizes leben in der jeweiligen Agent-Datenbank. Laufzeitkonfiguration und
  aufgelöste Laufzeitverträge dürfen `memorySearch.store.path` nicht offenlegen; doctor
  löscht diesen Legacy-Konfigurationsschlüssel, und aktueller Code gibt den Agent-
  `databasePath` intern weiter.

Die Implementierungsarbeit sollte weiter Code löschen, bis diese Aussagen ohne Ausnahmen
außerhalb von doctor-/Import-/Export-/Debug-Grenzen wahr sind.

## Zielzustand und Fortschritt

### Hartes Ziel

- Eine globale SQLite-Datenbank verwaltet Control-Plane-Status:
  `state/openclaw.sqlite`.
- Eine SQLite-Datenbank pro Agent verwaltet Data-Plane-Status:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Die Konfiguration bleibt dateibasiert. `openclaw.json` ist nicht Teil dieses Datenbank-
  Refactors.
- Legacy-Dateien sind nur Eingaben für die doctor-Migration.
- Die Laufzeit schreibt oder liest niemals Sitzungs- oder Transcript-JSONL als aktiven Status.

### Zielzustände

- `not-started`: Laufzeitcode aus der Datei-Ära schreibt weiterhin aktiven Status.
- `migrating`: doctor-/Importcode kann Dateidaten nach SQLite verschieben.
- `dual-read`: temporäre Brücke liest sowohl SQLite als auch Legacy-Dateien. Dieser Zustand
  ist für diesen Refactor verboten, sofern er nicht ausdrücklich als
  doctor-only dokumentiert ist.
- `sqlite-runtime`: Laufzeit liest und schreibt ausschließlich SQLite.
- `clean`: Legacy-Laufzeit-APIs und Tests sind entfernt, und der Guard verhindert
  Regressionen.
- `done`: Dokumentation, Tests, Backup, doctor-Migration und geänderte Prüfungen belegen den
  bereinigten Zustand.

### Aktueller Zustand

- Sitzungen: `clean` für Laufzeit. Sitzungszeilen leben in der Pro-Agent-Datenbank,
  Laufzeit-APIs verwenden `{agentId, sessionId}` oder `{agentId, sessionKey}`, und
  `sessions.json` ist doctor-only Legacy-Eingabe.
- Transcripts: `clean` für Laufzeit. Transcript-Ereignisse, Identitäten, Snapshots
  und Trajectory-Laufzeitereignisse leben in der Pro-Agent-Datenbank. Die Laufzeit
  akzeptiert keine Transcript-Locators oder JSONL-Transcript-Pfade mehr.
- PI eingebetteter Runner: `clean`. Eingebettete PI-Läufe, vorbereitete Worker, Compaction
  und Wiederholungsschleifen verwenden SQLite-Sitzungsbereich und lehnen veraltete Transcript-Handles ab.
- Cron: `clean` für Laufzeit. Die Laufzeit verwendet `cron_jobs` und `cron_run_logs`;
  Laufzeittests verwenden SQLite-`storeKey`-Benennung, und Cron-Pfade aus der Datei-Ära bleiben
  nur in doctor-Legacy-Migrationstests.
- Aufgabenregistrierung: `clean`. Aufgaben- und Task-Flow-Laufzeitzeilen leben in
  `state/openclaw.sqlite`; nicht ausgelieferte Sidecar-SQLite-Importer sind gelöscht.
- Plugin-Status: `clean`. Plugin-Status-/Blob-Zeilen leben in der gemeinsam genutzten globalen
  Datenbank; alte Plugin-Status-Sidecar-SQLite-Helfer werden per Guard verhindert.
- Memory: `sqlite-runtime` für eingebautes Memory und Sitzungstranscript-Indizierung.
  Memory-Indextabellen leben in der Pro-Agent-Datenbank, Plugin-Memory-Status verwendet
  gemeinsam genutzte Plugin-Status-Zeilen, und Legacy-Memory-Dateien sind doctor-Migrationseingaben
  oder Nutzer-Workspace-Inhalte.
- Backup: `sqlite-runtime`. Backup-Phasen komprimieren SQLite-Snapshots, lassen Live-
  WAL/SHM-Sidecars aus, verifizieren SQLite-Integrität und zeichnen Backup-Läufe in der
  globalen Datenbank auf.
- doctor-Migration: `migrating`, absichtlich. doctor importiert Legacy-JSON,
  JSONL und stillgelegte Sidecar-Stores nach SQLite, zeichnet Migrationsläufe/-quellen auf
  und entfernt erfolgreiche Quellen.
- E2E-Skripte: `clean` für Laufzeitabdeckung. Docker-MCP-Seeding schreibt SQLite-
  Zeilen. Das runtime-context-Docker-Skript erzeugt Legacy-JSONL nur innerhalb des
  doctor-Migrations-Seeds und benennt den Legacy-Sitzungsindexpfad ausdrücklich.

### Verbleibende Arbeit

- [x] Cron-Laufzeittest-Store-Variablen von `storePath` weg umbenennen, sofern
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
- [x] Den Docker-runtime-context-Legacy-JSONL-Seed offensichtlich doctor-only machen.
      Datei: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Nachweis: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` zeigt nur
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Kysely-generierte Typen nach jeder Schemaänderung ausgerichtet halten.
      Dateien: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Nachweis: keine Schemaänderung in diesem Durchgang; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Fokussierte Tests für berührte Stores, Befehle und Skripte erneut ausführen.
      Nachweis: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Vor der Erklärung von `done` das Changed-Gate oder einen breiten Remote-Nachweis ausführen.
      Nachweis: `pnpm check:changed --timed -- <changed extension paths>` bestand auf
      Hetzner Crabbox-Lauf `run_3f1cabf6b25c` nach temporärer Node-24-/pnpm-Einrichtung und
      explizitem Pfadrouting für den synchronisierten Workspace ohne `.git`.

### Nicht regressieren

- Keine Transcript-Locators.
- Keine aktiven Sitzungsdateien.
- Keine gefälschten JSONL-Testfixtures außer doctor-Legacy-Migrationstests.
- Kein roher SQLite-Zugriff, wo Kysely erwartet wird.
- Keine neuen Legacy-DB-Migrationen. Dieses Layout wurde nicht ausgeliefert; halten Sie die Schemaversion
  bei `1`, sofern es keinen starken Grund gibt.

## Code-Lese-Annahmen

Keine Folge-Produktentscheidungen blockieren diesen Plan. Die Implementierung sollte
mit diesen Annahmen fortfahren:

- Verwenden Sie `node:sqlite` direkt und verlangen Sie die Node-22+-Runtime für diesen Speicherpfad.
- Behalten Sie genau eine normale Konfigurationsdatei bei. Verschieben Sie Konfiguration, Plugin-Manifeste oder Git-Arbeitsbereiche in diesem Refactor nicht nach SQLite.
- Runtime-Kompatibilitätsdateien sind nicht erforderlich. Legacy-JSON- und JSONL-Dateien sind nur Migrationseingaben. Die branch-lokalen SQLite-Sidecars wurden nie ausgeliefert und werden gelöscht statt importiert.
- `openclaw doctor --fix` besitzt den Legacy-Datei-zu-Datenbank-Migrationsschritt. Runtime-Start und `openclaw migrate` sollten keine Legacy-Datenbank-Upgrade-Pfade von OpenClaw enthalten.
- Die Credential-Kompatibilität folgt derselben Regel: Runtime-Credentials liegen in SQLite. Alte Dateien wie `auth-profiles.json`, agent-spezifische `auth.json` und gemeinsam genutzte `credentials/oauth.json` sind Doctor-Migrationseingaben und werden nach dem Import entfernt.
- Der generierte Modellkatalogzustand ist datenbankgestützt. Runtime-Code darf `agents/<agentId>/agent/models.json` nicht schreiben; vorhandene `models.json`-Dateien sind Legacy-Doctor-Eingaben und werden nach dem Import in `agent_model_catalogs` entfernt.
- Die Runtime darf Transcript-Locators nicht migrieren, normalisieren oder überbrücken. Die aktive Transcript-Identität ist `{agentId, sessionId}` in SQLite. Dateipfade sind nur Legacy-Doctor-Eingaben, und `sqlite-transcript://...` muss aus Runtime-, Protokoll-, Hook- und Plugin-Oberflächen verschwinden, statt als Boundary-Handle behandelt zu werden.
- Runtime-Lesevorgänge für SQLite-Transcripts führen keine alten JSONL-Eintragsform-Migrationen aus und schreiben keine ganzen Transcripts aus Kompatibilitätsgründen neu. Die Legacy-Eintragsnormalisierung bleibt in expliziten Doctor-/Import-Hilfsprogrammen. Doctor normalisiert Legacy-JSONL-Transcript-Dateien, bevor SQLite-Zeilen eingefügt werden; aktuelle Runtime-Zeilen werden bereits im aktuellen Transcript-Schema geschrieben. Trajectory-/Session-Export liest diese Zeilen unverändert und darf keine Legacy-Migrationen zur Exportzeit durchführen.
- Legacy-Hilfsprogramme für das Parsen und Migrieren von Transcript-JSONL sind ausschließlich für Doctor bestimmt. Runtime-Transcript-Formatcode erstellt nur aktuellen SQLite-Transcript-Kontext; Doctor besitzt alte JSONL-Eintrags-Upgrades vor dem Einfügen von Zeilen.
- Der alte Runtime-eigene JSONL-Transcript-Streaming-Helfer wurde gelöscht. Doctor-Importcode besitzt explizite Legacy-Dateilesevorgänge; Runtime-Session-Verlauf liest SQLite-Zeilen.
- Codex-App-Server-Bindings verwenden die OpenClaw-`sessionId` als kanonischen Schlüssel im Codex-Plugin-State-Namespace. `sessionKey` ist Metadaten für Routing/Anzeige und darf weder die dauerhafte Session-ID ersetzen noch Transcript-Dateiidentität wiederbeleben.
- Kontext-Engines erhalten den aktuellen Runtime-Vertrag direkt. Die Registry darf Engines nicht mit Retry-Shims umhüllen, die `sessionKey`, `transcriptScope` oder `prompt` löschen; Engines, die die aktuellen datenbankzentrierten Parameter nicht akzeptieren können, sollten laut fehlschlagen statt überbrückt zu werden.
- Die Backup-Ausgabe sollte eine Archivdatei bleiben. Datenbankinhalte sollten als kompakte SQLite-Snapshots in dieses Archiv gelangen, nicht als rohe Live-WAL-Sidecars.
- Transcript-Suche ist nützlich, aber für den ersten datenbankzentrierten Schnitt nicht erforderlich. Entwerfen Sie das Schema so, dass FTS später hinzugefügt werden kann.
- Worker-Ausführung sollte experimentell hinter Einstellungen bleiben, während sich die Datenbankgrenze stabilisiert.

## Ergebnisse der Code-Lektüre

Der aktuelle Branch ist bereits über die Proof-of-Concept-Phase hinaus. Die gemeinsame Datenbank existiert, Node-`node:sqlite` ist über einen kleinen Runtime-Helfer verdrahtet, und frühere Stores schreiben jetzt in `state/openclaw.sqlite` oder in die zuständige `openclaw-agent.sqlite`-Datenbank.

Die verbleibende Arbeit besteht nicht darin, SQLite auszuwählen, sondern darin, die neue Grenze sauber zu halten und alle kompatibilitätsförmigen Schnittstellen zu löschen, die noch wie die alte Dateiwelt aussehen:

- Session-`storePath` ist keine Runtime-Identität, Test-Fixture-Form oder Status-Payload-Feld mehr. Runtime- und Bridge-Tests enthalten den Vertragsnamen `storePath` nicht mehr; Doctor-/Migrationscode besitzt dieses Legacy-Vokabular.
- Session-Schreibvorgänge laufen nicht mehr durch die alte prozessinterne `store-writer.ts`-Queue. SQLite-Patch-Schreibvorgänge verwenden stattdessen Konflikterkennung und begrenzte Wiederholungen.
- Legacy-Pfaderkennung hat weiterhin gültige Migrationszwecke, aber Runtime-Code sollte aufhören, `sessions.json` und Transcript-JSONL-Dateien als mögliche Schreibziele zu behandeln.
- Agent-eigene Tabellen liegen in agent-spezifischen SQLite-Datenbanken. Die globale DB hält Registry-/Control-Plane-Zeilen; Transcript-Identität ist `{agentId, sessionId}` in den agent-spezifischen Transcript-Zeilen. Runtime-Code darf keine Transcript-Dateipfade persistieren oder Transcript-Locators migrieren.
- Doctor importiert bereits mehrere Legacy-Dateien. Die Bereinigung besteht darin, daraus eine einzelne explizite Migrationsimplementierung zu machen, die Doctor aufruft, mit einem dauerhaften Migrationsbericht.

Keine weiteren Produktfragen blockieren die Implementierung.

## Aktuelle Code-Struktur

Der Branch hat bereits eine echte gemeinsame SQLite-Basis:

- Die Mindestanforderung für die Runtime ist jetzt Node 22+: `package.json`, die
  CLI-Runtime-Prüfung, Installer-Defaults, macOS-Runtime-Locator, CI und die
  öffentlichen Installationsdokumente stimmen alle überein. Die alte
  Kompatibilitäts-Lane für Node 22 wurde entfernt.
- `src/state/openclaw-state-db.ts` öffnet `openclaw.sqlite`, setzt WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` und wendet das
  generierte Schemamodul an, das aus
  `src/state/openclaw-state-schema.sql` abgeleitet ist.
- Kysely-Tabellentypen und Runtime-Schemamodule werden aus verwerfbaren
  SQLite-Datenbanken generiert, die aus den eingecheckten `.sql`-Dateien
  erstellt werden; Runtime-Code hält keine kopierten Schemastrings mehr für
  globale, agentenspezifische oder Proxy-Capture-Datenbanken vor.
- Runtime-Stores leiten ausgewählte und eingefügte Zeilentypen aus diesen
  generierten Kysely-`DB`-Schnittstellen ab, statt SQLite-Zeilenformen von Hand
  nachzubilden. Raw SQL bleibt auf Schemaanwendung, Pragmas und
  migrationsspezifisches DDL beschränkt.
- Die SQLite-Schemas wurden auf `user_version = 1` zusammengeführt, weil dieses
  Datenbanklayout noch nicht ausgeliefert wurde. Runtime-Opener erstellen nur
  das aktuelle Schema; der Import von Dateien in die Datenbank bleibt im
  Doctor-Code, und branch-lokale Hilfsfunktionen für Datenbank-Upgrades wurden
  gelöscht.
- Relationale Besitzverhältnisse werden dort erzwungen, wo die
  Zuständigkeitsgrenze kanonisch ist: Quellmigrationszeilen kaskadieren von
  `migration_runs`, der Task-Zustellstatus kaskadiert von `task_runs`, und
  Transkriptidentitätszeilen kaskadieren von Transkriptereignissen.
- Aktuelle gemeinsame Tabellen umfassen `agent_databases`,
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
- Beliebiger Plugin-eigener Zustand erhält keine host-eigenen typisierten
  Tabellen. Installierte Plugins verwenden `plugin_state_entries` für
  versionierte JSON-Payloads und `plugin_blob_entries` für Bytes, mit
  Namespace-/Key-Zuständigkeit, TTL-Bereinigung, Backup und
  Plugin-Migrationsdatensätzen. Host-eigener Plugin-Orchestrierungszustand kann
  weiterhin typisierte Tabellen haben, wenn der Host den Abfragevertrag besitzt,
  etwa `plugin_binding_approvals`.
- Plugin-Migrationen sind Datenmigrationen über Plugin-eigene Namespaces, keine
  Host-Schemamigrationen. Ein Plugin kann seine eigenen versionierten
  Zustands-/Blob-Einträge über einen Migrations-Provider migrieren, und der Host
  zeichnet Quell-/Ausführungsstatus im normalen Migrations-Ledger auf. Neue
  Plugin-Installationen erfordern keine Änderung an
  `openclaw-state-schema.sql`, es sei denn, der Host selbst übernimmt die
  Zuständigkeit für einen neuen Plugin-übergreifenden Vertrag.
- `src/state/openclaw-agent-db.ts` öffnet
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registriert die Datenbank in
  der globalen DB und besitzt agentenlokale Sitzungs-, Transkript-, VFS-,
  Artefakt-, Cache- und Speicherindex-Tabellen. Die gemeinsame
  Runtime-Erkennung liest jetzt die generiert typisierte
  `agent_databases`-Registry, statt diese Abfrage an jeder Aufrufstelle erneut
  zu implementieren.
- Globale und agentenspezifische Datenbanken zeichnen eine `schema_meta`-Zeile
  mit Datenbankrolle, Schemaversion, Zeitstempeln und Agenten-ID für
  Agentendatenbanken auf. Das Layout bleibt weiterhin bei `user_version = 1`,
  weil dieses SQLite-Schema noch nicht ausgeliefert wurde.
- Die agentenspezifische Sitzungsidentität hat jetzt eine kanonische
  `sessions`-Root-Tabelle mit Schlüssel `session_id`, mit `session_key`,
  `session_scope`, `account_id`, `primary_conversation_id`, Zeitstempeln,
  Anzeigefeldern, Modellmetadaten, Harness-ID und Eltern-/Spawn-Verknüpfung als
  abfragbare Spalten. `session_routes` ist der eindeutige aktive Routenindex von
  `session_key` zur aktuellen `session_id`, sodass ein Routenschlüssel zu einer
  neuen dauerhaften Sitzung wechseln kann, ohne dass schnelle Lesezugriffe
  zwischen doppelten `sessions.session_key`-Zeilen wählen müssen. Der alte,
  kompatibilitätsförmige Payload `session_entries.entry_json` hängt per
  Fremdschlüssel an der dauerhaften Root `session_id`; er ist nicht mehr die
  einzige Darstellung einer Sitzung auf Schemaebene.
- Die agentenspezifische externe Gesprächsidentität ist ebenfalls relational:
  `conversations` speichert normalisierte Provider-/Konto-/Gesprächsidentität,
  und `session_conversations` verknüpft eine OpenClaw-Sitzung mit einem oder
  mehreren externen Gesprächen. Dies deckt gemeinsame Haupt-DM-Sitzungen ab, bei
  denen mehrere Gegenüber absichtlich einer Sitzung zugeordnet werden können,
  ohne in `session_key` falsche Angaben zu machen. SQLite erzwingt außerdem
  Eindeutigkeit für die natürliche Provider-Identität, sodass dasselbe
  Channel-/Konto-/Art-/Peer-/Thread-Tupel nicht über Gesprächs-IDs hinweg
  aufspalten kann. Gemeinsame direkte Haupt-Peers werden mit einer
  `participant`-Rolle verknüpft, sodass eine OpenClaw-Sitzung mehrere externe
  DM-Peers repräsentieren kann, ohne ältere Peers zu vagen verwandten Zeilen
  herabzustufen. `sessions.primary_conversation_id` zeigt weiterhin auf das
  aktuelle typisierte Zustellziel. Geschlossene Routing-/Statusspalten werden
  mit SQLite-`CHECK`-Constraints erzwungen, statt sich nur auf
  TypeScript-Unions zu verlassen.
  Die Runtime-Sitzungsprojektion entfernt kompatible Routing-Schatten aus
  `session_entries.entry_json`, bevor typisierte Sitzungs-/Gesprächsspalten
  angewendet werden, sodass veraltete JSON-Payloads keine Zustellziele wieder
  aktivieren können.
  Das Ankündigungsrouting von Subagenten verlangt ebenfalls den typisierten
  SQLite-Zustellkontext; es fällt nicht mehr auf kompatible
  `SessionEntry`-Routenfelder zurück.
  Die explizite Zustellvererbung von Gateway `chat.send` liest den typisierten
  SQLite-Zustellkontext statt der Kompatibilitätsfelder `origin`/`last*`.
  `tools.effective` leitet Provider-/Konto-/Thread-Kontext ebenfalls aus
  typisierten SQLite-Zustell-/Routingzeilen ab, nicht aus veralteten
  `last*`-Schatten von Sitzungseinträgen.
  Der Prompt-Kontext für Systemereignisse baut Channel-/to-/Konto-/Thread-Felder
  aus typisierten Zustellfeldern statt aus `origin`-Schatten neu auf.
  Der gemeinsame Helper `deliveryContextFromSession` und der
  Sitzungs-zu-Gespräch-Mapper ignorieren `SessionEntry.origin` jetzt
  vollständig; nur typisierte Zustellfelder und relationale Gesprächszeilen
  können eine schnelle Routenidentität erzeugen.
  Die Runtime-Normalisierung von Sitzungseinträgen entfernt `origin`, bevor
  `entry_json` persistiert oder projiziert wird, und eingehende Metadaten
  schreiben typisierte Channel-/Chat-Felder plus relationale Gesprächszeilen,
  statt neue Origin-Schatten zu erstellen.
- Transkriptereignisse, Transkriptsnapshots und Trajectory-Runtime-Ereignisse
  referenzieren jetzt die kanonische agentenspezifische `sessions`-Root und
  kaskadieren beim Löschen einer Sitzung. Transkriptidentitäts-/
  Idempotenzzeilen kaskadieren weiterhin von der exakten
  Transkriptereigniszeile.
- Memory-Core-Indizes verwenden jetzt explizite Agentendatenbanktabellen
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` und
  `memory_embedding_cache`, wobei `memory_index_state` Revisionsänderungen
  nachverfolgt. Optionale FTS-/Vektor-Nebenindizes heißen
  `memory_index_chunks_fts` und `memory_index_chunks_vec` statt generischer
  Tabellen wie `meta`, `files`, `chunks`, `chunks_fts` oder `chunks_vec`. Die
  kanonischen Namen behalten die aktuelle Pfad-/Quellzeilenform und die
  Kompatibilität serialisierter Embeddings bei. Diese Tabellen sind abgeleiteter
  Suchcache, kein kanonischer Transkriptspeicher; sie können gelöscht und aus
  Speicher-Workspace-Dateien und konfigurierten Quellen neu erstellt werden.
  Beim Öffnen eines ausgelieferten Speicherindex mit generischen Namen werden
  dessen Metadaten, Quellen, Chunks und Embedding-Cache in die kanonischen
  Tabellen migriert; abgeleitete FTS-/Vektortabellen werden unter ihren
  kanonischen Namen neu aufgebaut.
- Der Wiederherstellungszustand von Subagentenläufen lebt jetzt in typisierten
  gemeinsamen `subagent_runs`-Zeilen mit indizierten Kind-, Anforderer- und
  Controller-Sitzungsschlüsseln. Die alte Datei `subagents/runs.json` ist nur
  noch Eingabe für die Doctor-Migration.
- Aktuelle Gesprächsbindungen leben jetzt in typisierten gemeinsamen
  `current_conversation_bindings`-Zeilen, die nach normalisierter Gesprächs-ID
  geschlüsselt sind, mit Zielagent-/Sitzungsspalten, Gesprächsart, Status,
  Ablauf und Metadaten als relationale Spalten statt als duplizierter opaker
  Bindungsdatensatz. Der dauerhafte Bindungsschlüssel enthält die normalisierte
  Gesprächsart, sodass Direkt-/Gruppen-/Channel-Refs nicht kollidieren können,
  und SQLite weist ungültige Werte für Bindungsart/-status ab. Die alte Datei
  `bindings/current-conversations.json` ist nur noch Eingabe für die
  Doctor-Migration.
- Die Wiederherstellung der Zustellwarteschlange legt jetzt typisierte
  Warteschlangenspalten für Channel, Ziel, Konto, Sitzung, Wiederholung, Fehler,
  Plattformversand und Wiederherstellungszustand über das Replay-JSON.
  `entry_json` behält die Replay-Payloads, Hooks und Formatierungspayloads, aber
  typisierte Spalten sind für schnelles Warteschlangenrouting und -zustand
  maßgeblich.
- TUI-Zeiger für die Wiederherstellung der letzten Sitzung leben jetzt in
  typisierten gemeinsamen `tui_last_sessions`-Zeilen, die nach dem gehashten
  TUI-Verbindungs-/Sitzungsscope geschlüsselt sind. Die alte TUI-JSON-Datei ist
  nur noch Eingabe für die Doctor-Migration.
- Standard-TTS-Einstellungen leben jetzt in gemeinsamen Plugin-State-SQLite-
  Zeilen, geschlüsselt unter dem Plugin `speech-core`. Die alte Datei
  `settings/tts.json` ist nur noch Eingabe für die Doctor-Migration; die Runtime
  liest oder schreibt keine TTS-Einstellungs-JSON-Dateien mehr, und der
  Legacy-Pfadauflöser lebt im Doctor-Migrationsmodul.
- Metadaten für Secret-Ziele sprechen jetzt von Stores, statt vorzutäuschen,
  dass jedes Credential-Ziel eine Konfigurationsdatei ist. `openclaw.json`
  bleibt der Konfigurationsstore; Auth-Profile-Ziele verwenden typisierte
  SQLite-`auth_profile_stores`-Zeilen mit Provider-förmigen Credentials, die als
  JSON-Payloads gespeichert werden.
- Das Secret-Audit scannt keine zurückgezogenen agentenspezifischen `auth.json`-
  Dateien mehr. Doctor ist für Warnungen zu dieser Legacy-Datei, deren Import
  und deren Entfernung zuständig.
- Legacy-Auth-Profil-Pfad-Helper leben jetzt im Doctor-Legacy-Code. Die
  Core-Auth-Profil-Pfad-Helper stellen SQLite-Auth-Store-Identität und
  Anzeigeorte bereit, keine Runtime-Pfade für `auth-profiles.json` oder
  `auth-state.json`.
- Die Runtime-Module für Subagentenlauf-Wiederherstellung und
  OpenRouter-Modellfähigkeitscache halten SQLite-Snapshot-Reader/-Writer jetzt
  getrennt von Doctor-spezifischen Legacy-JSON-Import-Helpern.
  OpenRouter-Fähigkeiten verwenden die typisierten generischen
  `model_capability_cache`-Zeilen unter `provider_id = "openrouter"` statt eines
  einzelnen opaken Cache-Blobs oder einer providerspezifischen Host-Tabelle.
  `taskName` eines Subagentenlaufs wird in der typisierten Spalte
  `subagent_runs.task_name` gespeichert; die Kopie `payload_json` ist
  Replay-/Debug-Daten, nicht die Quelle für schnelle Anzeige- oder Suchfelder.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementiert ein SQLite
  VFS über der Agentendatenbanktabelle `vfs_entries`. Verzeichnislesevorgänge,
  rekursive Exporte, Löschungen und Umbenennungen verwenden indizierte
  `(namespace, path)`-Präfixbereiche, statt einen ganzen Namespace zu scannen
  oder sich auf `LIKE`-Pfadabgleiche zu verlassen.
- `src/agents/runtime-worker.entry.ts` erstellt pro Lauf SQLite VFS-,
  Tool-Artefakt-, Run-Artefakt- und scoped Cache-Stores für Worker.
- Abschlussmarker für das Workspace-Bootstrap leben jetzt in typisierten
  gemeinsamen `workspace_setup_state`-Zeilen, geschlüsselt nach aufgelöstem
  Workspace-Pfad statt in `.openclaw/workspace-state.json`; die Runtime liest
  oder schreibt den Legacy-Workspace-Marker nicht mehr neu, und Helper-APIs
  reichen keinen fingierten `.openclaw/setup-state`-Pfad mehr herum, nur um
  Speicheridentität abzuleiten.
- Exec-Genehmigungen leben jetzt in der typisierten gemeinsamen SQLite-
  Singleton-Zeile `exec_approvals_config`. Doctor importiert das Legacy
  `~/.openclaw/exec-approvals.json`; Runtime-Schreibvorgänge erstellen,
  überschreiben oder melden diese Datei nicht mehr als aktiven Speicherort. Der
  macOS-Companion liest und schreibt dieselbe Tabellenzeile in
  `state/openclaw.sqlite`; er behält nur den Unix-Prompt-Socket auf der Festplatte,
  weil das IPC ist, kein dauerhafter Runtime-Zustand.
- Die Runtime-Module für Geräteidentität, Geräteauthentifizierung und Bootstrap
  halten ihre SQLite-Snapshot-Reader/-Writer jetzt getrennt von
  Doctor-spezifischen Legacy-JSON-Import-Helpern. Geräteidentität verwendet
  typisierte `device_identities`-Zeilen, und Geräteauthentifizierungstokens
  verwenden typisierte `device_auth_tokens`-Zeilen. Schreibvorgänge der
  Geräteauthentifizierung gleichen Zeilen nach Gerät/Rolle ab, statt die
  Tokentabelle zu kürzen, und die Runtime leitet Einzel-Token-Aktualisierungen
  nicht mehr durch den alten Whole-Store-Adapter. Die veraltete
  Version-1-JSON-Payloads existieren nur als doctor-Import-/Export-Formen.
- Der Token-Austausch-Cache von GitHub Copilot verwendet die gemeinsam genutzte SQLite-Plugin-State-Tabelle
  unter `github-copilot/token-cache/default`. Es ist Provider-eigener Cache-State,
  daher fügt er absichtlich keine Host-Schema-Tabelle hinzu.
- Die GitHub Copilot-Compaction schreibt keine `openclaw-compaction-*.json`-
  Workspace-Sidecars mehr. Das Harness ruft den SDK-Verlaufs-Compaction-RPC für die
  nachverfolgte SDK-Sitzung auf, und OpenClaw hält dauerhaften Sitzungs-/Transkript-State in
  SQLite statt in Kompatibilitäts-Markierungsdateien.
- Die gemeinsam genutzte Swift-Runtime (`OpenClawKit`) verwendet dieselben
  `state/openclaw.sqlite`-Zeilen für Geräteidentität und Geräteauthentifizierung. macOS-App-
  Helfer importieren die gemeinsam genutzten SQLite-Helfer, statt einen zweiten JSON- oder
  SQLite-Pfad zu besitzen. Ein verbleibendes altes `identity/device.json` blockiert die Identitätserstellung,
  bis doctor es in SQLite importiert, passend zum TypeScript- und Android-
  Startup-Gate.
- Die Android-Geräteidentität verwendet dasselbe TypeScript-kompatible Schlüsselmaterial,
  das in typisierten `state/openclaw.sqlite#table/device_identities`-Zeilen gespeichert ist. Sie
  liest oder schreibt niemals `openclaw/identity/device.json`; eine verbleibende alte Datei blockiert
  den Start, bis doctor sie in SQLite importiert.
- Zwischengespeicherte Android-Geräteauthentifizierungstoken verwenden ebenfalls typisierte
  `state/openclaw.sqlite#table/device_auth_tokens`-Zeilen und teilen dieselbe
  Version-1-Token-Semantik wie TypeScript und Swift. Die Runtime liest keine `SecurePrefs`-
  `gateway.deviceToken*`-Kompatibilitätsschlüssel mehr; diese gehören ausschließlich in Migrations-/doctor-
  Logik.
- Die Android-Benachrichtigungshistorie für aktuelle Pakete verwendet typisierte
  `android_notification_recent_packages`-Zeilen. Die Runtime migriert oder liest die alten
  SharedPreferences-CSV-Schlüssel nicht mehr.
- Die Erstellung der Geräteidentität schlägt fail-closed fehl, wenn das alte `identity/device.json`
  existiert, wenn die SQLite-Identitätszeile ungültig ist oder wenn der SQLite-Identitätsspeicher
  nicht geöffnet werden kann. Doctor importiert und entfernt diese Datei zuerst, sodass der Runtime-
  Start die Pairing-Identität vor der Migration nicht stillschweigend rotieren kann.
- Die Auswahl der Geräteidentität ist ein SQLite-Zeilenschlüssel, kein JSON-Datei-Locator. Tests
  und Gateway-Helfer übergeben explizite Identitätsschlüssel; nur die doctor-Migration und das
  fail-closed-Startup-Gate kennen den stillgelegten `identity/device.json`-Dateinamen.
- Die Session-Reset-Kompatibilität lebt jetzt in der doctor-Konfigurationsmigration:
  `session.idleMinutes` wird nach `session.reset.idleMinutes` verschoben,
  `session.resetByType.dm` wird nach `session.resetByType.direct` verschoben, und die
  Runtime-Reset-Policy liest nur kanonische Reset-Schlüssel.
- Alte Konfigurationskompatibilität lebt jetzt unter `src/commands/doctor/`. Die normale
  `readConfigFileSnapshot()`-Validierung importiert keine alten doctor-Detektoren
  und annotiert keine alten Probleme; `runDoctorConfigPreflight()` fügt diese Probleme für
  doctor-Reparatur/-Berichterstattung hinzu. Der doctor-Konfigurationsfluss importiert
  `src/commands/doctor/legacy-config.ts`, und alte Reparatur von OAuth-Profil-IDs lebt
  unter
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Nicht-doctor-Befehle führen alte Konfigurationsreparatur nicht automatisch aus. Zum Beispiel
  schlägt `openclaw update --channel` jetzt bei ungültiger alter Konfiguration fehl und fordert den
  Benutzer auf, doctor auszuführen, statt stillschweigend doctor-Migrationscode zu importieren.
- Web-Push, APNs, Voice Wake, Update-Prüfungen und Konfigurationszustand verwenden jetzt typisierte gemeinsam genutzte SQLite-
  Tabellen für Abonnements, VAPID-Schlüssel, Node-Registrierungen, Trigger-Zeilen,
  Routing-Zeilen, Update-Benachrichtigungs-State und Konfigurationszustandseinträge statt
  vollständig undurchsichtiger JSON-Blobs. Web-Push- und APNs-Snapshot-Schreibvorgänge gleichen
  Abonnements/Registrierungen jetzt nach Primärschlüssel ab, statt ihre Tabellen zu leeren;
  der Konfigurationszustand macht dasselbe nach Konfigurationspfad.
  Ihre Runtime-Module halten SQLite-Snapshot-Leser/-Schreiber getrennt von
  nur für doctor bestimmten alten JSON-Importhelfern.
- Die Node-Host-Konfiguration verwendet jetzt eine typisierte Singleton-Zeile in der gemeinsam genutzten SQLite-Datenbank;
  doctor importiert die alte `node.json`-Datei vor der normalen Runtime-Nutzung.
- Geräte-/Node-Pairing, Channel-Pairing, Channel-Allowlists und Bootstrap-State
  verwenden jetzt typisierte SQLite-Zeilen statt vollständig undurchsichtiger JSON-Blobs. Plugin-Binding-
  Genehmigungen und Cron-Job-State folgen derselben Trennung: Runtime-Module stellen
  SQLite-gestützte Operationen und neutrale Snapshot-Helfer bereit, und Pairing/Bootstrap
  sowie Snapshot-Schreibvorgänge für Plugin-Binding-Genehmigungen gleichen Zeilen nach Primärschlüssel ab,
  statt Tabellen zu leeren, während doctor die alten JSON-Dateien über
  `src/commands/doctor/legacy/*`-Module importiert/entfernt.
- Installierte Plugin-Datensätze leben jetzt im SQLite-Index für installierte Plugins.
  Runtime-Konfigurationslesen/-schreiben migriert oder bewahrt alte
  `plugins.installs`-Daten aus authored config nicht mehr; doctor importiert diese alte Konfigurationsform
  vor der normalen Runtime-Nutzung in SQLite.
- QQBot-Snapshots zur Wiederherstellung von Zugangsdaten leben jetzt im SQLite-Plugin-State unter
  `qqbot/credential-backups`. Die Runtime schreibt keine
  `qqbot/data/credential-backup*.json` mehr; doctor importiert und entfernt diese
  alten Backup-Dateien zusammen mit den anderen QQBot-State-Eingaben.
- Die Gateway-Neuladeplanung vergleicht Snapshots des SQLite-Index für installierte Plugins unter
  einem internen `installedPluginIndex.installRecords.*`-Diff-Namespace. Runtime-
  Neuladeentscheidungen verpacken diese Zeilen nicht mehr in unechte `plugins.installs`-Konfigurationsobjekte.
- Das Upgrade von Matrix-Zugangsdaten für benannte Konten erfolgt nicht mehr während Runtime-
  Lesevorgängen. Doctor besitzt die Umbenennung der alten obersten `credentials/matrix/credentials.json`,
  wenn ein einzelnes/Standard-Matrix-Konto aufgelöst werden kann.
- Core-Pairing- und Cron-Runtime-Module exportieren keine alten JSON-Pfad-
  Builder mehr. Doctor-eigene alte Module konstruieren `pending.json`, `paired.json`,
  `bootstrap.json` und `cron/jobs.json`-Quellpfade nur für Importtests und
  Migration. Alte Cron-Job-Shape-Normalisierung und Cron-Run-Log-Import
  leben unter `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importiert alte JSON-State-
  Dateien, einschließlich Node-Host-Konfiguration, aus doctor in SQLite. Neue alte Datei-
  Importer bleiben unter `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importiert alte `sessions.json`- und
  `*.jsonl`-Transkripte direkt in SQLite und entfernt erfolgreiche Quellen. Es
  staged Root-Legacy-Transkripte nicht mehr über
  `agents/<agentId>/sessions/*.jsonl` und erstellt vor dem Import kein kanonisches JSONL-Ziel mehr.
- Doctor-Prüfungen der State-Integrität scannen keine alten Sitzungsverzeichnisse mehr und
  bieten keine Löschung verwaister JSONL-Dateien mehr an. Alte Transkriptdateien sind nur
  Migrationseingaben, und der Migrationsschritt besitzt Import plus Quellentfernung.
- Der alte Sandbox-Registry-Import lebt unter
  `src/commands/doctor/legacy/sandbox-registry.ts`; aktive Sandbox-Registry-
  Lese- und Schreibvorgänge bleiben ausschließlich SQLite-basiert.
- Die alte Reparatur für Zustand/Import von Sitzungstranskripten lebt unter
  `src/commands/doctor/legacy/session-transcript-health.ts`; Runtime-Befehls-
  Module tragen keinen JSONL-Transkript-Parsing- oder Active-Branch-Reparaturcode mehr.

Abgeschlossene Highlights zur Konsolidierung/Löschung:

- Der Plugin-Zustand verwendet jetzt die gemeinsame Datenbank `state/openclaw.sqlite`. Der alte
  branch-lokale Sidecar-Importer `plugin-state/state.sqlite` wurde entfernt, weil
  dieses SQLite-Layout nie ausgeliefert wurde. Probe-/Test-Hilfsfunktionen melden den gemeinsamen
  `databasePath`, statt einen Plugin-state-spezifischen SQLite-Pfad offenzulegen.
- Task- und Task-Flow-Runtime-Tabellen liegen jetzt in der gemeinsamen
  Datenbank `state/openclaw.sqlite` statt in `tasks/runs.sqlite` und
  `tasks/flows/registry.sqlite`; die alten Sidecar-Importer wurden aus demselben
  Grund des nie ausgelieferten Layouts entfernt.
- `src/config/sessions/store.ts` benötigt `storePath` nicht mehr für eingehende
  Metadaten, Routenaktualisierungen oder updated-at-Lesevorgänge. Befehlspersistenz, CLI-
  Sitzungsbereinigung, Subagent-Tiefe, Auth-Overrides und Transkript-Sitzungsidentität
  verwenden Agent-/Sitzungszeilen-APIs. Schreibvorgänge werden als SQLite-Zeilen-Patches
  mit optimistischem Konflikt-Retry angewendet.
- Die Auflösung von Sitzungszielen stellt jetzt agentenspezifische Datenbankziele bereit, keine veralteten
  `sessions.json`-Pfade. Gemeinsames Gateway, ACP-Metadaten, Doctor-Routenreparatur und
  `openclaw sessions` enumerieren `agent_databases` plus konfigurierte Agenten.
- Gateway-Sitzungsrouting verwendet jetzt `resolveGatewaySessionDatabaseTarget`; das
  zurückgegebene Ziel enthält `databasePath` und mögliche SQLite-Zeilenschlüssel
  statt eines veralteten Sitzungs-Store-Dateipfads.
- Channel-Sitzungs-Runtime-Typen stellen jetzt `{agentId, sessionKey}` für
  updated-at-Lesevorgänge, eingehende Metadaten und Last-Route-Aktualisierungen bereit. Der alte
  Kompatibilitätstyp `saveSessionStore(storePath, store)` ist entfernt.
- Plugin-Runtime, Extension-API und `config/sessions`-Barrel-Oberflächen lenken
  Plugin-Code jetzt zu SQLite-gestützten Sitzungszeilen-Hilfsfunktionen. Kompatibilitätsexporte der Root-Bibliothek
  (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) bleiben als
  veraltete Shims für bestehende Nutzer erhalten. Der alte
  Hilfsfunktion `resolveLegacySessionStorePath` ist entfernt; die Konstruktion veralteter
  `sessions.json`-Pfade ist jetzt lokal auf Migrationen und Test-Fixtures beschränkt.
- `src/config/sessions/session-entries.sqlite.ts` speichert kanonische Sitzungseinträge
  jetzt in der agentenspezifischen Datenbank und unterstützt Lese-/Upsert-/Lösch-Patches
  auf Zeilenebene. Runtime-Upsert/Patch/Delete sucht nicht mehr nach Groß-/Kleinschreibungsvarianten und
  entfernt keine veralteten Alias-Schlüssel mehr; Doctor besitzt die Kanonisierung. Die
  eigenständige JSON-Import-Hilfsfunktion ist entfernt, und die Migration führt neuere Zeilen per Upsert zusammen,
  statt die gesamte Sitzungstabelle zu ersetzen. Öffentliche Read-/List-/Load-Hilfsfunktionen
  projizieren heiße Sitzungsmetadaten aus typisierten `sessions`- und `conversations`-Zeilen;
  `entry_json` ist ein Kompatibilitäts-/Debug-Schatten und kann veraltet oder ungültig sein,
  ohne typisierte Sitzungsidentität oder Delivery-Kontext zu verlieren.
- `src/config/sessions/delivery-info.ts` löst Delivery-Kontext jetzt aus den
  typisierten agentenspezifischen Zeilen `sessions` + `conversations` + `session_conversations` auf.
  Es rekonstruiert Runtime-Delivery-Identität nicht mehr aus
  `session_entries.entry_json`; eine fehlende typisierte Konversationszeile ist ein Doctor-
  Migrations-/Reparaturproblem, kein Runtime-Fallback.
- Entscheidungen zum Zurücksetzen gespeicherter Sitzungen bevorzugen jetzt typisierte Metadaten aus
  `sessions.session_scope`, `sessions.chat_type` und `sessions.channel`. `sessionKey`-Parsing
  bleibt nur für explizite Thread-/Topic-Suffixe auf Befehlszielen erhalten; die Klassifizierung
  von Gruppe vs. Direkt wird nicht mehr aus der Schlüsselform abgeleitet.
- Die Klassifizierung der Sitzungslisten-/Statusanzeige verwendet jetzt typisierte Chat-Metadaten und
  Gateway-Sitzungsart. Sie behandelt `:group:`- oder `:channel:`-Teilzeichenfolgen
  innerhalb von `session_key` nicht mehr als dauerhafte Gruppen-/Direkt-Wahrheit.
- Die Auswahl der Silent-Reply-Policy verwendet jetzt nur noch explizite Konversationstyp- oder Surface-
  Metadaten. Sie rät die Direkt-/Gruppen-Policy nicht mehr aus
  `session_key`-Teilzeichenfolgen.
- Die Auflösung des Sitzungsanzeigemodells erhält die Agenten-ID jetzt vom SQLite-
  Sitzungsdatenbankziel, statt sie aus `session_key` herauszutrennen.
- Die Hydration von Agent-zu-Agent-Ankündigungszielen verwendet jetzt nur noch typisierte `sessions.list`-
  `deliveryContext`. Sie stellt Channel-/Account-/Thread-Routing nicht mehr aus
  veraltetem `origin`, gespiegelten `last*`-Feldern oder der Form von `session_key` wieder her.
- Die Thread-Ziel-Ablehnung von `sessions_send` liest jetzt typisierte SQLite-Routing-
  Metadaten. Sie lehnt Ziele nicht mehr ab oder akzeptiert sie, indem Thread-Suffixe
  aus dem Zielschlüssel geparst werden.
- Die Validierung gruppenbezogener Tool-Policy liest jetzt typisiertes SQLite-Konversationsrouting
  für die aktuelle oder gestartete Sitzung. Sie vertraut Gruppen-/Channel-
  Identität nicht mehr durch Dekodieren von `sessionKey`; vom Aufrufer bereitgestellte Gruppen-IDs werden verworfen, wenn
  keine typisierte Sitzungszeile sie bestätigt.
- Das Matching von Channel-Modell-Overrides verwendet jetzt explizite Gruppen- und übergeordnete
  Konversationsmetadaten. Es dekodiert übergeordnete Konversations-IDs nicht mehr aus
  `parentSessionKey`.
- Die Vererbung gespeicherter Modell-Overrides erfordert jetzt einen expliziten übergeordneten Sitzungsschlüssel
  aus typisiertem Sitzungskontext. Sie leitet übergeordnete Overrides nicht mehr aus
  `:thread:`- oder `:topic:`-Suffixen in `sessionKey` ab.
- Der alte Session-Thread-Info-Wrapper und der Loaded-Plugin-Thread-Parser sind entfernt;
  kein Runtime-Code importiert `config/sessions/thread-info`.
- Die Channel-Konversationshilfsfunktion stellt keine Parsing-Brücken für vollständige Sitzungsschlüssel
  mehr bereit. Core normalisiert weiterhin Provider-eigene rohe Konversations-IDs über
  `resolveSessionConversation(...)`, rekonstruiert aber keine Routenfakten
  aus `sessionKey`.
- Completion-Delivery, Send-Policy und Task-Wartung leiten den Chat-Typ nicht mehr
  aus der Form von `session_key` ab. Der alte Chat-Type-Schlüsselparser wurde gelöscht;
  diese Pfade erfordern typisierte Sitzungsmetadaten, typisierten Delivery-Kontext oder
  explizites Delivery-Zielvokabular.
- Sitzungslisten/-status, Diagnosen, Approval-Account-Bindung, TUI-Heartbeat-
  Filterung und Nutzungszusammenfassungen durchsuchen `SessionEntry.origin` nicht mehr nach
  Provider-/Account-/Thread-/Anzeige-Routing. Die einzigen verbleibenden Runtime-
  `origin`-Lesevorgänge sind Nicht-Sitzungskonzepte oder Delivery-Objekte des aktuellen Turns.
- Die native Konversationssuche für Approval-Anfragen liest jetzt typisierte agentenspezifische Sitzungs-
  Routing-Zeilen. Sie parst Channel-/Gruppen-/Thread-Konversationsidentität
  nicht mehr aus `sessionKey`; fehlende typisierte Metadaten sind ein Migrations-/Reparaturproblem.
- Gateway-Payloads für session changed/chat/session events spiegeln
  `SessionEntry.origin` oder `last*`-Routenschatten nicht mehr wider; Clients erhalten typisierte
  `channel`, `chatType` und `deliveryContext`.
- Die Heartbeat-Delivery-Auflösung kann jetzt direkt den typisierten SQLite-
  `deliveryContext` erhalten, und die Heartbeat-Runtime übergibt die agentenspezifische
  Sitzungs-Delivery-Zeile, statt sich für aktuelles Routing auf Kompatibilitäts-
  Schatten in `session_entries` zu verlassen.
- Die Auflösung von Cron-Isolated-Agent-Delivery-Zielen hydratisiert ihre aktuelle
  Route ebenfalls aus der typisierten agentenspezifischen Sitzungs-Delivery-Zeile, bevor sie auf die
  Kompatibilitäts-Entry-Payload zurückfällt.
- Die Auflösung des Subagent-Announcement-Ursprungs reicht jetzt den typisierten Requester-Session-
  Delivery-Kontext durch `loadRequesterSessionEntry` und bevorzugt diese Zeile gegenüber
  Kompatibilitätsschatten in `last*`/`deliveryContext`.
- Aktualisierungen eingehender Sitzungsmetadaten werden jetzt zuerst mit der typisierten agentenspezifischen
  Delivery-Zeile zusammengeführt; alte `SessionEntry`-Delivery-Felder sind nur der Fallback,
  wenn keine typisierte Konversationszeile existiert.
- Die Restart-/Update-Delivery-Extraktion lässt jetzt den typisierten SQLite-Delivery-
  `threadId` gegenüber Topic-/Thread-Fragmenten gewinnen, die aus `sessionKey` geparst wurden; Parsing
  ist nur ein Fallback für veraltete threadförmige Schlüssel.
- Channel-IDs im Hook-Agent-Kontext bevorzugen jetzt typisierte SQLite-Konversationsidentität,
  danach explizite Nachrichtenmetadaten. Sie parsen Provider-/Gruppen-/Channel-
  Fragmente nicht mehr aus `sessionKey`.
- Die externe Routenvererbung von Gateway `chat.send` liest jetzt typisierte SQLite-Sitzungs-
  Routing-Metadaten, statt Channel-/Direkt-/Gruppen-Scope aus
  `sessionKey`-Teilen abzuleiten. Channel-bezogene Sitzungen erben nur, wenn der typisierte
  Sitzungs-Channel und Chat-Typ mit dem gespeicherten Delivery-Kontext übereinstimmen; Shared-Main-
  Sitzungen behalten ihre strengere CLI-/keine-Client-Metadaten-Regel.
- Restart-Sentinel-Wake und Continuation-Routing lesen jetzt typisierte SQLite-
  Delivery-/Routing-Zeilen, bevor Heartbeat-Wakes oder geroutete Agent-Turn-
  Continuations in die Queue gestellt werden. Sie rekonstruieren Delivery-Kontext nicht mehr aus dem
  JSON-Schatten des Sitzungseintrags.
- Die Kontextauflösung von Gateway `tools.effective` liest jetzt typisierte SQLite-
  Delivery-/Routing-Zeilen für Provider-, Account-, Ziel-, Thread- und Reply-Mode-
  Eingaben. Sie stellt diese heißen Routing-Felder nicht mehr aus veralteten
  `session_entries.entry_json`-Origin-Schatten wieder her.
- Realtime-Voice-Consult-Routing löst Parent-/Call-Delivery jetzt aus typisierten
  agentenspezifischen SQLite-Sitzungszeilen auf. Es fällt beim Auswählen der eingebetteten Agent-
  Nachrichtenroute nicht mehr auf Kompatibilitäts-Schatten in `SessionEntry.deliveryContext` zurück.
- ACP-Spawn-Heartbeat-Relay und Parent-Stream-Routing lesen Parent-Delivery jetzt
  aus typisierten SQLite-Sitzungszeilen. Sie rekonstruieren Parent-Delivery-
  Kontext nicht mehr aus Kompatibilitäts-Sitzungseintragsschatten.
- Die Erhaltung der Sitzungs-Delivery-Route folgt jetzt typisierten Chat-Metadaten und
  persistierten Delivery-Spalten. Sie extrahiert keine Channel-Hinweise, Direct-/Main-
  Marker oder Thread-Formen mehr aus `sessionKey`; interne Webchat-Routen
  erben ein externes Ziel nur, wenn SQLite bereits typisierte/persistierte Delivery-
  Identität für die Sitzung besitzt.
- Generische Sitzungs-Delivery-Extraktion liest jetzt nur noch die exakt typisierte SQLite-
  Sitzungs-Delivery-Zeile. Sie parst keine Thread-/Topic-Suffixe mehr und fällt nicht
  von einem threadförmigen Schlüssel auf einen Basis-Sitzungsschlüssel zurück.
- Reply-Dispatch, Restart-Sentinel-Recovery und Realtime-Voice-Consult-Routing
  verwenden jetzt exakt typisierte SQLite-Sitzungs-/Konversationszeilen für Thread-Routing. Sie
  stellen Thread-IDs oder Basis-Sitzungs-Delivery-Kontext nicht mehr durch Parsen
  threadförmiger Sitzungsschlüssel wieder her.
- Embedded-PI-Verlaufslimitierung verwendet jetzt die typisierte SQLite-Sitzungsrouting-
  Projektion (`sessions` + primäre `conversations`) für Provider, Chat-Typ
  und Peer-Identität. Sie parst Provider, DM, Gruppe oder Thread-Form
  nicht mehr aus `sessionKey`.
- Cron-Tool-Delivery-Inferenz verwendet jetzt nur explizite Delivery oder den aktuellen typisierten
  Delivery-Kontext. Sie dekodiert Channel-, Peer-, Account- oder Thread-
  Ziele nicht mehr aus `agentSessionKey`.
- Runtime-Sitzungszeilen enthalten den alten Routenalias `lastProvider` nicht mehr.
  Hilfsfunktionen und Tests verwenden typisierte Felder `lastChannel` und `deliveryContext`;
  Doctor-Migration ist der einzige Ort, der ältere Routenaliase oder persistierte
  `origin`-Schatten übersetzen sollte.
- Transkriptereignisse, VFS-Zeilen und Tool-Artefakt-Zeilen schreiben jetzt in die agentenspezifische
  Datenbank. Die nie ausgelieferte globale Transcript-Datei-Mapping-Tabelle ist entfernt; Doctor
  zeichnet veraltete Quellpfade stattdessen in dauerhaften Migrationszeilen auf.
- Runtime-Transcript-Lookup scannt keine JSONL-Byte-Offsets mehr und prüft keine veralteten
  Transkriptdateien. Gateway-Chat-/Media-/History-Pfade lesen Transkriptzeilen aus
  SQLite; Sitzungs-JSONL ist jetzt nur noch ein veralteter Doctor-Input, kein Runtime-Zustand
  oder Exportformat.
- Transcript-Parent- und Branch-Beziehungen verwenden strukturierte
  `parentTranscriptScope: {agentId, sessionId}`-Metadaten in SQLite-Transkript-
  Headern, keine pfadähnlichen Locator-Strings `agent-db:...transcript_events...`.
- Der Transcript-Manager-Vertrag stellt keine implizit persistierten
  `create(cwd)`- oder `continueRecent(cwd)`-Konstruktoren mehr bereit. Persistierte Transcript-
  Manager werden mit einem expliziten Scope `{agentId, sessionId}` geöffnet; nur
  In-Memory-Manager bleiben für Tests und reine Transcript-Transformationen scope-frei.
- Runtime-Transcript-Store-APIs lösen SQLite-Scope auf, keine Dateisystempfade. Die
  alte Hilfsfunktion `resolve...ForPath` und ungenutzte `transcriptPath`-Schreiboptionen sind
  aus Runtime-Aufrufern entfernt.
- Runtime-Sitzungsauflösung verwendet jetzt `{agentId, sessionId}` und darf keine
  `sqlite-transcript://<agent>/<session>`-Strings für externe Grenzen ableiten.
  Veraltete absolute JSONL-Pfade sind nur Doctor-Migrationseingaben.
- Native-Hook-Relay-Direct-Bridge-Datensätze liegen jetzt in typisierten gemeinsamen
  `native_hook_relay_bridges`-Zeilen, die nach Relay-ID verschlüsselt sind. Die Runtime schreibt keine
  `/tmp`-JSON-Registry oder undurchsichtigen generischen Datensätze für diese kurzlebigen Bridge-
  Datensätze mehr.
- `runEmbeddedPiAgent(...)` hat keinen Transcript-Locator-Parameter mehr.
  Vorbereitete Worker-Deskriptoren lassen auch Transcript-Locators weg. Runtime-Sitzungszustand
  und eingereihte Follow-up-Läufe führen `{agentId, sessionId}` statt
  abgeleiteter Transcript-Handles mit.
- Eingebettete Compaction bezieht den SQLite-Scope jetzt aus `agentId` und `sessionId`.
  Compaction-Hooks, Context-Engine-Aufrufe, CLI-Delegation und Protokollantworten
  dürfen keine abgeleiteten Handles der Form `sqlite-transcript://...` erhalten. Export-/Debug-Code
  kann explizite Benutzerartefakte aus Zeilen materialisieren, stellt aber keinen
  generischen JSONL-Exportpfad für Sitzungen bereit und speist Dateinamen nicht zurück in die Runtime-
  Identität.
- `/export-session` liest Transcript-Zeilen aus SQLite und schreibt nur die angeforderte
  eigenständige HTML-Ansicht. Der eingebettete Viewer rekonstruiert oder
  lädt kein Sitzungs-JSONL mehr aus diesen Zeilen herunter.
- Context-Engine-Delegation parst keinen Transcript-Locator mehr, um
  Agentenidentität wiederherzustellen. Der vorbereitete Runtime-Kontext führt die aufgelöste `agentId`
  in den integrierten Compaction-Adapter.
- Transcript-Rewrite und Live-Tool-Result-Truncation lesen und persistieren
  Transcript-Zustand jetzt per `{agentId, sessionId}` und leiten keine temporären
  Locators für Transcript-Update-Event-Payloads ab.
- Die Transcript-State-Hilfsoberfläche hat keine locatorbasierten Varianten von
  `readTranscriptState`, `replaceTranscriptStateEvents` oder
  `persistTranscriptStateMutation` mehr. Runtime-Aufrufer müssen die
  `{agentId, sessionId}`-APIs verwenden. Doctor-Import liest Legacy-Dateien per explizitem Dateipfad
  und schreibt SQLite-Zeilen; Locator-Strings werden nicht migriert.
- Der Runtime-Session-Manager-Vertrag stellt `open(locator)`,
  `forkFrom(locator)` oder `setTranscriptLocator(...)` nicht mehr bereit. Persistierte Session-
  Manager öffnen nur per `{agentId, sessionId}`; Listen-/Fork-Helfer liegen auf
  zeilenorientierten Sitzungs- und Checkpoint-APIs statt auf der Transcript-Manager-
  Fassade.
- Gateway-Transcript-Reader-APIs sind Scope-first. Sie nehmen
  `{agentId, sessionId}` entgegen und akzeptieren keinen positionalen Transcript-Locator, der
  versehentlich zur Runtime-Identität werden könnte. Das Parsen aktiver Transcript-Locators
  ist entfernt; Legacy-Quellpfade werden nur noch von Doctor-Import-Code gelesen.
- Transcript-Update-Events sind ebenfalls Scope-first. `emitSessionTranscriptUpdate`
  akzeptiert keinen bloßen Locator-String mehr, und Listener routen per
  `{agentId, sessionId}`, ohne ein Handle zu parsen.
- Der Gateway-Broadcast für Session-Messages löst Sitzungsschlüssel aus Agent-/Sitzungs-
  Scope auf, nicht aus einem Transcript-Locator. Der alte Transcript-Locator-zu-Session-
  Key-Resolver/-Cache ist entfernt.
- Gateway-Session-History-SSE filtert Live-Updates nach Agent-/Sitzungs-Scope. Es
  kanonisiert keine Transcript-Locator-Kandidaten, Realpaths oder dateiförmigen
  Transcript-Identitäten mehr, um zu entscheiden, ob ein Stream ein Update erhalten soll.
- Session-Lifecycle-Hooks leiten bei `session_end` keine Transcript-Locators mehr ab
  und legen sie auch nicht offen. Hook-Consumer erhalten `sessionId`, `sessionKey`, Next-Session-
  IDs und Agentenkontext; Transcript-Dateien sind nicht Teil des Lifecycle-
  Vertrags.
- Reset-Hooks leiten ebenfalls keine Transcript-Locators mehr ab und legen sie nicht offen. Der
  `before_reset`-Payload führt wiederhergestellte SQLite-Nachrichten plus den Reset-
  Grund, während die Sitzungsidentität im Hook-Kontext bleibt.
- Agent-Harness-Reset akzeptiert keinen Transcript-Locator mehr. Reset-Dispatch ist
  durch `sessionId`/`sessionKey` plus Grund gescoped.
- Agent-Erweiterungssitzungstypen legen `transcriptLocator` nicht mehr offen; Erweiterungen
  sollten Sitzungskontext und Runtime-APIs verwenden, statt nach einer
  dateiförmigen Transcript-Identität zu greifen.
- Plugin-Compaction-Hooks legen keine Transcript-Locators mehr offen. Der Hook-Kontext
  führt die Sitzungsidentität bereits, und Transcript-Lesevorgänge müssen über SQLite-
  scopefähige APIs statt über dateiförmige Handles laufen.
- `before_agent_finalize`-Hooks legen `transcriptPath` nicht mehr offen, einschließlich
  nativer Hook-Relay-Payloads. Finalization-Hooks verwenden nur Sitzungskontext.
- Gateway-Reset-Antworten synthetisieren keinen Transcript-Locator mehr auf dem
  zurückgegebenen Eintrag. Der Reset erstellt SQLite-Transcript-Zeilen, gibt den bereinigten
  Sitzungseintrag zurück und überlässt Transcript-Zugriff scopefähigen Readern.
- Eingebettete Lauf- und Compaction-Ergebnisse geben keine Transcript-Locators mehr für
  Sitzungsabrechnung aus. Automatische Compaction aktualisiert nur die aktive `sessionId`,
  Compaction-Zähler und Token-Metadaten.
- Eingebettete Versuchsergebnisse geben `transcriptLocatorUsed` nicht mehr zurück, und
  Context-Engine-`compact()`-Ergebnisse geben keine Transcript-Locators mehr zurück.
  Runtime-Retry-Schleifen akzeptieren nur eine Nachfolge-`sessionId`.
- Delivery-Mirror-Transcript-Append-Ergebnisse geben keine Transcript-Locators mehr zurück.
  Aufrufer erhalten die angehängte `messageId`; Transcript-Update-Signale verwenden
  SQLite-Scope.
- Parent-Session-Fork-Helfer geben nur die geforkte `sessionId` zurück. Subagent-
  Vorbereitung übergibt den Child-Agent-/Sitzungs-Scope an Engines.
- CLI-Runner-Parameter und History-Reseeding akzeptieren keine Transcript-Locators mehr.
  CLI-History-Lesevorgänge lösen den SQLite-Transcript-Scope aus `{agentId,
sessionId}` und Sitzungsschlüsselkontext auf.
- CLI- und Embedded-Runner-Test-Fixtures seeden und lesen SQLite-Transcript-Zeilen jetzt
  nach Sitzungs-ID, statt vorzugeben, aktive Sitzungen seien `*.jsonl`-Dateien, oder
  einen `sqlite-transcript://...`-String durch Runtime-Parameter zu reichen.
- Session-Tool-Result-Guard-Events werden aus bekanntem Sitzungs-Scope emittiert, auch wenn ein
  In-Memory-Manager keinen abgeleiteten Locator hat. Seine Tests fingieren keine aktiven
  `/tmp/*.jsonl`-Transcript-Dateien mehr.
- BTW- und Compaction-Checkpoint-Helfer lesen und forken Transcript-Zeilen jetzt nach
  SQLite-Scope. Checkpoint-Metadaten speichern jetzt nur Sitzungs-IDs und Leaf-/Entry-IDs;
  abgeleitete Locators werden nicht mehr in Checkpoint-Payloads geschrieben.
- Gateway-Transcript-Key-Lookup verwendet SQLite-Transcript-Scope an Protokoll-
  Grenzen und führt kein Realpath oder Stat von Transcript-Dateinamen mehr aus.
- Automatische Compaction-Transcript-Rotation schreibt Nachfolge-Transcript-Zeilen
  direkt über den SQLite-Transcript-Store. Sitzungszeilen behalten nur die
  Nachfolge-Sitzungsidentität, keinen dauerhaften JSONL-Pfad oder persistierten Locator.
- Eingebettete Context-Engine-Compaction verwendet SQLite-benannte Transcript-Rotation-
  Helfer. Die Rotationstests konstruieren keine JSONL-Nachfolgepfade mehr und
  modellieren aktive Sitzungen nicht mehr als Dateien.
- Managed Outgoing Image Retention schlüsselt seinen Transcript-Message-Cache aus
  SQLite-Transcript-Stats statt aus Dateisystem-Stat-Aufrufen.
- Runtime-Sitzungssperren und die eigenständige Legacy-Doctor-Spur für `.jsonl.lock`
  wurden entfernt.
- Das Microsoft Teams Runtime-Barrel und das öffentliche Plugin-SDK re-exportieren
  den alten File-Lock-Helfer nicht mehr; dauerhafte Plugin-Zustandspfade sind SQLite-basiert.
- Session-Age-/Count-Pruning und explizite Sitzungsbereinigung wurden entfernt.
  Doctor besitzt den Legacy-Import; veraltete Sitzungen werden explizit zurückgesetzt oder gelöscht.
- Doctor-Integritätsprüfungen zählen eine Legacy-JSONL-Datei nicht mehr als gültiges aktives
  Transcript für eine SQLite-Sitzungszeile. Aktive Transcript-Gesundheit ist nur noch SQLite;
  Legacy-JSONL-Dateien werden als Eingaben für Migration/Orphan-Cleanup gemeldet.
- Doctor behandelt `agents/<agent>/sessions/` nicht mehr als erforderlichen Runtime-
  Zustand. Es scannt dieses Verzeichnis nur, wenn es bereits existiert, als Legacy-Import-
  oder Orphan-Cleanup-Eingabe.
- Gateway `sessions.resolve`, Session-Patch-/Reset-/Compact-Pfade, Subagent-
  Spawning, schneller Abort, ACP-Metadaten, Heartbeat-isolierte Sitzungen und TUI-
  Patching migrieren oder prunen Legacy-Sitzungsschlüssel nicht mehr als Nebeneffekt
  normaler Runtime-Arbeit.
- CLI-Befehlssitzungsauflösung gibt jetzt die besitzende `agentId` statt eines
  `storePath` zurück, und sie kopiert keine Legacy-Main-Session-Zeilen mehr während normaler
  `--to`- oder `--session-id`-Auflösung. Legacy-Main-Row-Kanonisierung gehört
  ausschließlich zu Doctor.
- Runtime-Subagent-Tiefenauflösung liest `sessions.json` oder JSON5-
  Sitzungsspeicher nicht mehr. Sie liest SQLite-`session_entries` nach Agenten-ID, und Legacy-
  Tiefen-/Sitzungsmetadaten können nur über den Doctor-Importpfad eintreten.
- Auth-Profil-Sitzungsüberschreibungen werden über direkte `{agentId, sessionKey}`-
  Zeilen-Upserts persistiert, statt einen dateiförmigen Session-Store-Runtime lazy zu laden.
- Auto-Reply-Verbose-Gating und Sitzungsupdate-Helfer lesen/upserten jetzt SQLite-
  Sitzungszeilen nach Sitzungsidentität und benötigen keinen Legacy-Store-Pfad mehr,
  bevor sie persistierten Zeilenzustand berühren.
- Command-Run-Sitzungsmetadaten-Helfer verwenden jetzt entry-orientierte Namen und Modul-
  Pfade; die alte `session-store`-Befehlshilfsoberfläche wurde entfernt.
- Bootstrap-Header-Seeding und Härtung manueller Compaction-Grenzen mutieren
  SQLite-Transcript-Zeilen direkt. Runtime-Aufrufer übergeben Sitzungsidentität, keine
  beschreibbaren `.jsonl`-Pfade.
- Silent Session-Rotation Replay kopiert aktuelle Benutzer-/Assistant-Turns per
  `{agentId, sessionId}` aus SQLite-Transcript-Zeilen. Es akzeptiert keine
  Quell- oder Ziel-Transcript-Locators mehr.
- Frische Runtime-Sitzungszeilen speichern keine Transcript-Locators mehr. Aufrufer verwenden
  `{agentId, sessionId}` direkt; Export-/Debug-Befehle können Ausgabedateinamen wählen,
  wenn sie Zeilen materialisieren.
- Das Starten einer neuen persistierten Transcript-Sitzung öffnet SQLite-Zeilen jetzt immer nach
  Scope. Der Session-Manager verwendet keinen früheren Transcript-Pfad oder Locator aus der
  Dateiära mehr als Identität für die neue Sitzung wieder.
- Persistierte Transcript-Sitzungen verwenden die explizite
  `openTranscriptSessionManagerForSession({agentId, sessionId})`-API. Die alten
  statischen Fassaden `SessionManager.create/openForSession/list/forkFromSession` sind
  entfernt, damit Tests und Runtime-Code nicht versehentlich Session-Discovery aus der Dateiära
  nachbilden können.
- Plugin-Runtime legt `api.runtime.agent.session.resolveTranscriptLocatorPath` nicht mehr offen;
  Plugin-Code verwendet SQLite-Zeilenhelfer und Scope-Werte.
- Die öffentliche `session-store-runtime`-SDK-Oberfläche exportiert jetzt nur noch Sitzungszeilen-
  und Transcript-Zeilen-Helfer. Fokussierte SQLite-Schema-/Pfad-/Transaktionshelfer
  liegen in `sqlite-runtime`; rohe Open-/Close-/Reset-Helfer bleiben nur lokal für
  First-Party-Tests.
- Legacy-`.jsonl`-Trajectory-/Checkpoint-Dateinamenklassifikatoren liegen jetzt im
  Doctor-Legacy-Session-File-Modul. Core-Sitzungsvalidierung importiert keine
  Datei-Artefakt-Helfer mehr, um normale SQLite-Sitzungs-IDs zu entscheiden.
- Active Memory blockierende Subagent-Läufe verwenden SQLite-Transcript-Zeilen, statt
  temporäre oder persistierte `session.jsonl`-Dateien unter Plugin-Zustand zu erstellen. Die
  alte Option `transcriptDir` wurde entfernt.
- Einmalige Slug-Generierung und Crestodian-Planner-Läufe verwenden SQLite-Transcript-Zeilen,
  statt temporäre `session.jsonl`-Dateien zu erstellen.
- `llm-task`-Helferläufe und versteckte Commitment-Extraktion verwenden ebenfalls SQLite-
  Transcript-Zeilen, sodass diese reinen Modell-Hilfssitzungen keine
  temporären JSON-/JSONL-Transcript-Dateien mehr erstellen.
- `TranscriptSessionManager` ist jetzt nur noch ein geöffneter SQLite-Transcript-Scope.
  Runtime-Code öffnet ihn mit `openTranscriptSessionManagerForSession({agentId,
sessionId})`; Create-, Branch-, Continue-, List- und Fork-Flows liegen in ihren
  besitzenden SQLite-Zeilenhelfern statt in statischen Manager-Fassaden.
  Doctor-/Import-/Debug-Code behandelt explizite Legacy-Quelldateien außerhalb des
  Runtime-Session-Managers.
- Die veralteten Fassadenmethoden `SessionManager.newSession()` und
  `SessionManager.createBranchedSession()` wurden entfernt. Neue
  Sitzungen und Transcript-Nachfahren werden durch ihren besitzenden SQLite-
  Workflow erstellt, statt einen bereits geöffneten Manager in eine andere
  persistierte Sitzung zu mutieren.
- Parent-Transcript-Fork-Entscheidungen und Fork-Erstellung akzeptieren
  `storePath` oder `sessionsDir` nicht mehr; sie verwenden den SQLite-
  Transcript-Scope `{agentId, sessionId}` statt beibehaltener Dateisystempfad-Metadaten.
- Memory-Host exportiert keine No-op-Sitzungsverzeichnis-Transcript-
  Klassifikationshelfer mehr; Transcript-Filterung wird jetzt während der Entry-Erstellung aus SQLite-Zeilen-
  Metadaten abgeleitet.
- Memory-Host- und QMD-Session-Export-Tests verwenden SQLite-Transcript-Scopes. Alte
  `agents/<agentId>/sessions/*.jsonl`-Pfade bleiben nur dort abgedeckt, wo ein Test
  absichtlich Doctor-/Import-/Export-Kompatibilität nachweist.
- QA-Lab-Rohsitzungsinspektion verwendet jetzt `sessions.list` über das Gateway
  anstatt `agents/qa/sessions/sessions.json` zu lesen; MSteams-Feedback
  hängt direkt an SQLite-Transkripte an, ohne einen JSONL-Pfad zu erzeugen.
- Gemeinsame eingehende Kanal-Turns tragen jetzt `{agentId, sessionKey}` statt eines
  veralteten `storePath`. LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch und QQBot-Aufzeichnungspfade lesen jetzt updated-at-Metadaten und zeichnen
  eingehende Sitzungszeilen über die SQLite-Identität auf.
- Die Persistenz des Transkript-Locators wurde aus aktiven Sitzungszeilen entfernt.
  `resolveSessionTranscriptTarget` gibt `agentId`, `sessionId` und optionale
  Themenmetadaten zurück; doctor ist der einzige Code, der veraltete Transkriptdateinamen
  importiert.
- Laufzeit-Transkript-Header beginnen bei SQLite-Version `1`. Upgrades alter JSONL-V1/V2/V3-
  Shapes leben nur im doctor-Import und normalisieren importierte Header auf
  die aktuelle SQLite-Transkriptversion, bevor Zeilen gespeichert werden.
- Der Database-first-Guard verbietet jetzt `SessionManager.listAll` und
  `SessionManager.forkFromSession`; Sitzungslisten- und Fork-/Restore-Workflows
  müssen auf zeilen-/scopebasierten SQLite-APIs bleiben.
- Der Guard verbietet außerdem veraltete Namen von Hilfsfunktionen zum Parsen von
  Transkript-JSONL und zur Reparatur aktiver Branches außerhalb von doctor-/Import-Code,
  sodass die Laufzeit keinen zweiten veralteten Transkript-Migrationspfad entwickeln kann.
- Eingebettete PI-Läufe lehnen eingehende Transkript-Handles ab. Sie verwenden die SQLite-
  Identität `{agentId, sessionId}` vor dem Start des Workers und erneut, bevor der
  Versuch den Transkriptzustand berührt. Eine veraltete `/tmp/*.jsonl`-Eingabe kann kein
  Laufzeit-Schreibziel auswählen.
- Cache-Trace-, Anthropic-Payload-, Raw-Stream- und Diagnose-Timeline-Datensätze
  werden jetzt in typisierte SQLite-`diagnostic_events`-Zeilen geschrieben. Gateway-
  Stabilitäts-Bundles werden jetzt in typisierte SQLite-`diagnostic_stability_bundles`-
  Zeilen geschrieben. Die alten JSONL-Override-Pfade `diagnostics.cacheTrace.filePath`,
  `OPENCLAW_CACHE_TRACE_FILE`, `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` und
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` wurden entfernt, und die normale
  Stabilitätserfassung schreibt keine `logs/stability/*.json`-Dateien mehr.
- Die Cron-Persistenz gleicht jetzt SQLite-`cron_jobs`-Zeilen ab, statt bei jedem
  Speichern die gesamte Job-Tabelle zu löschen und neu einzufügen. Plugin-Ziel-
  Writebacks aktualisieren passende Cron-Zeilen direkt und halten den Cron-
  Laufzeitzustand in derselben State-Datenbank-Transaktion.
- Cron-Laufzeitaufrufer verwenden jetzt einen stabilen SQLite-Cron-Store-Schlüssel.
  Veraltete `cron.store`-Pfade sind nur doctor-Import-Eingaben; Produktions-Gateway,
  Task-Wartung, Status, Run-Log und Telegram-Ziel-Writeback-Pfade verwenden
  `resolveCronStoreKey` und normalisieren den Schlüssel nicht mehr als Pfad. Der
  Cron-Status meldet jetzt `storeKey` statt des alten dateiförmigen Felds `storePath`.
- Cron-Laufzeitladen und Scheduling normalisieren keine veralteten persistierten Job-
  Shapes mehr, etwa `jobId`, `schedule.cron`, numerisches `atMs`, String-Booleans oder
  fehlendes `sessionTarget`. Der doctor-Legacy-Import besitzt diese Reparaturen, bevor
  Zeilen in SQLite eingefügt werden.
- ACP-Spawn löst oder persistiert keine Transkript-JSONL-Dateipfade mehr. Spawn- und
  Thread-Bind-Einrichtung persistieren die SQLite-Sitzungszeile direkt und behalten die
  Sitzungs-ID als gespeicherte Transkriptidentität.
- ACP-Sitzungsmetadaten-APIs lesen/listen/upserten jetzt SQLite-Zeilen nach `agentId`
  und stellen `storePath` nicht mehr als Teil des ACP-Sitzungseintragsvertrags bereit.
- Sitzungsnutzungsabrechnung und Gateway-Nutzungsaggregation lösen Transkripte jetzt
  nur noch über `{agentId, sessionId}` auf. Der Kosten-/Nutzungscache und Zusammenfassungen
  entdeckter Sitzungen synthetisieren oder liefern keine Transkript-Locator-Strings mehr zurück.
- Gateway-Chat-Append, Abort-Partial-Persistenz, `/sessions.send` und Webchat-
  Medien-Transkriptschreibvorgänge hängen direkt über den SQLite-Transkript-Scope an.
  Die Gateway-Hilfsfunktion für Transkriptinjektion akzeptiert keinen Parameter
  `transcriptLocator` mehr.
- SQLite-Transkript-Discovery listet jetzt nur Transkript-Scopes und Statistiken:
  `{agentId, sessionId, updatedAt, eventCount}`. Die tote Kompatibilitätshilfsfunktion
  `listSqliteSessionTranscriptLocators` und das zeilenweise Feld `locator` sind entfernt.
- Die Transkriptreparatur-Laufzeit stellt nur noch
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` bereit. Die alte
  locatorbasierte Reparaturhilfsfunktion wurde gelöscht; doctor-/Debug-Code liest
  explizite Quelldateipfade und migriert niemals Locator-Strings.
- Die ACP-Replay-Ledger-Laufzeit speichert sitzungsbezogene Replay-Zeilen jetzt in der
  gemeinsamen SQLite-State-Datenbank statt in `acp/event-ledger.json`; doctor importiert
  und entfernt die veraltete Datei.
- Gateway-Transkriptleser-Hilfsfunktionen leben jetzt in
  `src/gateway/session-transcript-readers.ts` statt unter dem alten Modulnamen
  `session-utils.fs`. Die Fallback-Retry-History-Prüfung ist nach SQLite-
  Transkriptinhalt benannt statt nach der alten Datei-Hilfsoberfläche.
- Gateway-Hilfsfunktionen für injected chat und Compaction übergeben den SQLite-
  Transkript-Scope über interne Hilfs-APIs, statt Werte als Transkriptpfade oder
  Quelldateien zu bezeichnen.
- Die Bootstrap-Fortsetzungserkennung prüft jetzt SQLite-Transkriptzeilen über
  `hasCompletedBootstrapTranscriptTurn`; sie legt keinen dateiförmigen Hilfsnamen
  mehr offen.
- Embedded-Runner-Tests verwenden jetzt die SQLite-Transkriptidentität, und das Öffnen
  eines neuen Transkriptmanagers erfordert immer eine explizite `sessionId`.
- Memory-Indexierungshelfer verwenden jetzt durchgehend SQLite-Transkriptterminologie:
  Der Host exportiert `listSessionTranscriptScopesForAgent` und
  `sessionTranscriptKeyForScope`, gezielte Sync-Warteschlangen `sessionTranscripts`,
  öffentliche Sitzungssuchtreffer legen opake `transcript:<agent>:<session>`-Pfade offen,
  und der interne DB-Quellschlüssel lautet `session:<session>` unter
  `source_kind='sessions'` statt eines fingierten Dateipfads.
- Die generische Plugin-SDK-Hilfsfunktion für persistente Deduplizierung stellt keine
  dateiförmigen Optionen mehr bereit. Aufrufer geben SQLite-Scope-Schlüssel an, und
  dauerhafte Dedupe-Zeilen leben im gemeinsamen Plugin-State.
- Microsoft Teams-SSO-Tokens wurden von gesperrten JSON-Dateien in den SQLite-
  Plugin-State verschoben. Doctor importiert `msteams-sso-tokens.json`, rekonstruiert
  kanonische SSO-Token-Schlüssel aus Payloads und entfernt die Quelldatei. Delegierte
  OAuth-Tokens bleiben auf ihrer bestehenden privaten Credential-Datei-Grenze.
- Der Matrix-Sync-Cache-State wurde von `bot-storage.json` in den SQLite-Plugin-State
  verschoben. Doctor importiert veraltete rohe oder gewrappte Sync-Payloads und entfernt
  die Quelldatei. Aktive Matrix- und QA-Matrix-Clients übergeben ein SQLite-Sync-Store-
  Stammverzeichnis, keinen fingierten Pfad `sync-store.json` oder `bot-storage.json`.
- Der Matrix-Legacy-Crypto-Migrationsstatus wurde von `legacy-crypto-migration.json`
  in den SQLite-Plugin-State verschoben. Doctor importiert die alte Statusdatei;
  Matrix-SDK-IndexedDB-Snapshots wurden von `crypto-idb-snapshot.json` in SQLite-
  Plugin-Blobs verschoben. Matrix-Wiederherstellungsschlüssel und Credentials sind
  SQLite-Plugin-State-Zeilen; ihre alten JSON-Dateien sind nur doctor-Migrationseingaben.
- Memory-Wiki-Aktivitätsprotokolle verwenden jetzt SQLite-Plugin-State statt
  `.openclaw-wiki/log.jsonl`. Der Memory-Wiki-Migrationsprovider importiert alte
  JSONL-Protokolle; Wiki-Markdown und Inhalte des Nutzer-Vaults bleiben als
  Workspace-Inhalte dateibasiert.
- Memory Wiki erstellt `.openclaw-wiki/state.json` oder das ungenutzte Verzeichnis
  `.openclaw-wiki/locks` nicht mehr. Der Migrationsprovider entfernt diese ausgemusterten
  Plugin-Metadatendateien, wenn ein älterer Vault sie noch hat.
- Crestodian-Auditeinträge verwenden jetzt Core-SQLite-Plugin-State statt
  `audit/crestodian.jsonl`. Doctor importiert das veraltete JSONL-Auditprotokoll und
  entfernt es nach erfolgreichem Import.
- Config-Write-/Observe-Auditeinträge verwenden jetzt Core-SQLite-Plugin-State statt
  `logs/config-audit.jsonl`. Doctor importiert das veraltete JSONL-Auditprotokoll und
  entfernt es nach erfolgreichem Import.
- Der macOS-Begleiter schreibt beim Bearbeiten von `openclaw.json` keine app-lokalen
  Sidecars `logs/config-audit.jsonl` oder `logs/config-health.json` mehr. Die Config-
  Datei bleibt dateibasiert, Wiederherstellungs-Snapshots bleiben neben der Config-
  Datei, und dauerhafter Config-Audit-/Health-State gehört in den Gateway-SQLite-Store.
- Ausstehende Crestodian-Rettungsfreigaben verwenden jetzt Core-SQLite-Plugin-State
  statt `crestodian/rescue-pending/*.json`. Doctor importiert veraltete Dateien für
  ausstehende Freigaben und entfernt sie nach erfolgreichem Import.
- Der temporäre Arm-State von Phone Control verwendet jetzt SQLite-Plugin-State statt
  `plugins/phone-control/armed.json`. Doctor importiert die veraltete Arm-State-Datei
  in den Namespace `phone-control/arm-state` und entfernt die Datei.
- Doctor repariert JSONL-Transkripte nicht mehr direkt und erstellt keine JSONL-
  Sicherungsdateien mehr. Er importiert den aktiven Branch in SQLite und entfernt die
  veraltete Quelle.
- Der Transkript-Lookup des Session-Memory-Hooks verwendet reine SQLite-Lesevorgänge
  mit Scope `{agentId, sessionId}`. Seine Hilfsfunktion akzeptiert oder leitet keine
  Transkript-Locators, veralteten Dateilesevorgänge oder Datei-Rewrite-Optionen mehr ab.
- Codex-App-Server-Konversationsbindungen schlüsseln SQLite-Plugin-State jetzt nach
  OpenClaw-Sitzungsschlüssel oder explizitem Scope `{agentId, sessionId}`. Sie dürfen
  keine Fallback-Bindungen für Transkriptpfade beibehalten.
- Codex-App-Server-Mirrored-History-Lesevorgänge verwenden nur den SQLite-
  Transkript-Scope; sie dürfen die Identität nicht aus Transkriptdateipfaden
  wiederherstellen.
- Rollenreihenfolge- und Compaction-Reset-Pfade unlinken alte Transkriptdateien nicht
  mehr; Reset rotiert nur die SQLite-Sitzungszeile und Transkriptidentität.
- Gateway-Reset- und Checkpoint-Antworten geben saubere Sitzungszeilen plus Sitzungs-
  IDs zurück. Sie synthetisieren keine SQLite-Transkript-Locators mehr für Clients.
- Memory-Core-Dreaming bereinigt Sitzungszeilen nicht mehr, indem es auf fehlende
  JSONL-Dateien prüft. Subagent-Bereinigung läuft über die Sitzungs-Laufzeit-API statt
  über Dateisystem-Existenzprüfungen. Die Transkript-Ingestion-Tests legen SQLite-
  Zeilen direkt an, statt `agents/<id>/sessions`-Fixtures oder Locator-Platzhalter
  zu erstellen.
- Memory-Transkriptindexierung kann `transcript:<agentId>:<sessionId>` als virtuellen
  Suchtrefferpfad für Zitier-/Lesehilfen offenlegen. Die dauerhafte Indexquelle ist
  relational (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), daher ist der Wert kein Laufzeit-Transkript-Locator, kein
  Dateisystempfad und darf niemals zurück in Sitzungs-Laufzeit-APIs übergeben werden.
- Der Memory-Status von Gateway doctor liest Kurzzeit-Recall- und Phase-Signal-Zähler
  aus SQLite-Plugin-State-Zeilen statt aus `memory/.dreams/*.json`; CLI- und doctor-
  Ausgabe bezeichnen diesen Speicher jetzt als SQLite-Store, nicht als Pfad.
- Memory-Core-Laufzeit, CLI-Status, Gateway-doctor-Methoden und Plugin-SDK-Fassaden
  auditieren oder archivieren veraltete `.dreams/session-corpus`-Dateien nicht mehr.
  Diese Dateien sind nur Migrationseingaben; doctor importiert sie in SQLite und löscht
  die Quelle nach der Verifikation. Aktive Evidenzzeilen der Sitzungs-Ingestion verwenden
  jetzt den virtuellen SQLite-Pfad `memory/session-ingestion/<day>.txt`; die Laufzeit
  schreibt oder leitet niemals State aus `.dreams/session-corpus` ab.
- Öffentliche Memory-Core-Artefakte legen SQLite-Host-Events als virtuelles JSON-Artefakt
  `memory/events/memory-host-events.json` offen; sie verwenden den veralteten Quellpfad
  `.dreams/events.jsonl` nicht mehr wieder.
- Sandbox-Container-/Browser-Registries verwenden jetzt die gemeinsame SQLite-Tabelle
  `sandbox_registry_entries` mit typisierten Spalten für Sitzung, Image, Zeitstempel,
  Backend/Config und Browser-Port. Doctor importiert veraltete monolithische und
  geshardete JSON-Registry-Dateien und entfernt erfolgreiche Quellen. Laufzeit-Lesevorgänge
  verwenden die typisierten Zeilenspalten als Source of Truth; `entry_json` ist nur eine
  Replay-/Debug-Kopie.
- Commitments verwenden jetzt eine typisierte gemeinsame Tabelle `commitments` statt
  eines JSON-Blobs für den gesamten Store. Snapshot-Speicherungen führen Upserts nach
  Commitment-ID aus und löschen nur fehlende Zeilen, statt die Tabelle zu leeren und
  neu einzufügen. Die Laufzeit lädt Commitments aus typisierten Scope-, Delivery-Window-,
  Status-, Attempt- und Textspalten; `record_json` ist nur eine Replay-/Debug-Kopie.
  Doctor importiert das veraltete `commitments.json` und entfernt es nach erfolgreichem Import.
- Cron-Jobdefinitionen, Schedule-State und Ausführungshistorie haben keine Laufzeit-
  JSON-Writer oder -Reader mehr. Die Laufzeit verwendet `cron_jobs`-Zeilen mit typisiertem Schedule,
  Payload-, Delivery-, Failure-Alert-, Session-, Status- und Runtime-State-Spalten sowie typisierte
  `cron_run_logs`-Metadaten für Status, Diagnosezusammenfassung, Delivery-Status/-Fehler,
  Session/Run, Modell und Token-Summen. `job_json` ist nur eine Replay-/Debug-Kopie; `state_json` behält verschachtelte
  Runtime-Diagnosen, die noch keine Hot-Query-Felder haben, während die Runtime
  Hot-State-Felder aus typisierten Spalten rehydriert. Doctor importiert
  alte `jobs.json`-, `jobs-state.json`- und `runs/*.jsonl`-Dateien und entfernt
  die importierten Quellen. Plugin-Ziel-Rückschreibungen aktualisieren passende `cron_jobs`-
  Zeilen, statt den gesamten Cron-Speicher zu laden und zu ersetzen.
- Der Gateway-Start ignoriert alte `notify: true`-Marker in der Runtime-
  Projektion. Doctor übersetzt sie in explizite SQLite-Delivery, wenn
  `cron.webhook` gültig ist, entfernt wirkungslose Marker, wenn sie nicht gesetzt ist, und behält
  sie mit einer Warnung bei, wenn der konfigurierte Webhook ungültig ist.
- Ausgehende Delivery-Warteschlangen und Session-Delivery-Warteschlangen speichern jetzt Warteschlangenstatus, Eintragsart,
  Session-Schlüssel, Channel, Ziel, Konto-ID, Wiederholungszähler, letzten Versuch/Fehler,
  Wiederherstellungsstatus und Platform-Send-Marker als typisierte Spalten in der gemeinsamen
  Tabelle `delivery_queue_entries`. Die Runtime-Wiederherstellung liest diese Hot-Felder aus
  den typisierten Spalten, und Wiederholungs-/Wiederherstellungsmutationen aktualisieren diese Spalten direkt,
  ohne Replay-JSON neu zu schreiben. Die vollständige JSON-Payload bleibt nur als
  Replay-/Debug-Blob für Nachrichtentexte und andere kalte Replay-Daten erhalten.
- Verwaltete Datensätze für ausgehende Bilder verwenden jetzt typisierte gemeinsame
  `managed_outgoing_image_records`-Zeilen, wobei Mediabytes weiterhin in
  `media_blobs` gespeichert werden. Der JSON-Datensatz bleibt nur als Replay-/Debug-Kopie erhalten.
- Discord-Modell-Picker-Einstellungen, Command-Deploy-Hashes und Thread-Bindungen
  verwenden jetzt gemeinsamen SQLite-Plugin-Status. Ihre alten JSON-Importpläne liegen in der
  Setup-/Doctor-Migrationsoberfläche des Discord-Plugins, nicht im Core-Migrationscode.
- Alte Importdetektoren für Plugins verwenden Doctor-benannte Module wie
  `doctor-legacy-state.ts` oder `doctor-state-imports.ts`; normale Channel-Runtime-
  Module dürfen keine alten JSON-Detektoren importieren.
- BlueBubbles-Catchup-Cursor und Inbound-Dedupe-Marker verwenden jetzt gemeinsamen SQLite-
  Plugin-Status. Ihre alten JSON-Importpläne liegen in der Setup-/Doctor-Migrationsoberfläche des BlueBubbles-Plugins,
  nicht im Core-Migrationscode.
- Telegram-Update-Offsets, Sticker-Cache-Zeilen, Sent-Message-Cache-Zeilen,
  Topic-Name-Cache-Zeilen und Thread-Bindungen verwenden jetzt gemeinsamen SQLite-Plugin-
  Status. Ihre alten JSON-Importpläne liegen in der Setup-/Doctor-Migrationsoberfläche des Telegram-Plugins,
  nicht im Core-Migrationscode.
- iMessage-Catchup-Cursor, Reply-Short-ID-Zuordnungen und Sent-Echo-Dedupe-Zeilen
  verwenden jetzt gemeinsamen SQLite-Plugin-Status. Die alten Dateien `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` und `imessage/sent-echoes.jsonl` sind
  nur Doctor-Eingaben.
- Feishu-Nachrichten-Dedupe-Zeilen verwenden jetzt gemeinsamen SQLite-Plugin-Status statt
  `feishu/dedup/*.json`-Dateien. Der alte JSON-Importplan liegt in der Setup-/Doctor-
  Migrationsoberfläche des Feishu-Plugins, nicht im Core-Migrationscode.
- Microsoft Teams-Unterhaltungen, Umfragen, ausstehende Upload-Puffer und Feedback-
  Learnings verwenden jetzt gemeinsame SQLite-Plugin-Status-/Blob-Tabellen. Der ausstehende Upload-
  Pfad verwendet `plugin_blob_entries`, sodass Medienpuffer als SQLite-BLOBs
  statt als base64-JSON gespeichert werden. Die Runtime-Hilfsnamen verwenden jetzt SQLite-/State-Benennung
  statt `*-fs`-File-Store-Benennung, und der alte `storePath`-Shim ist aus
  diesen Stores entfernt. Der alte JSON-Importplan liegt in der Setup-/Doctor-Migrationsoberfläche des Microsoft Teams-Plugins.
- Von Zalo gehostete ausgehende Medien verwenden jetzt gemeinsame SQLite-`plugin_blob_entries`
  statt `openclaw-zalo-outbound-media`-JSON-/Binär-Temp-Sidecars.
- Diffs-Viewer-HTML und -Metadaten verwenden jetzt gemeinsame SQLite-`plugin_blob_entries`
  statt `meta.json`-/`viewer.html`-Temp-Dateien. Gerenderte PNG-/PDF-Ausgaben bleiben
  temporäre Materialisierungen, weil die Channel-Delivery weiterhin einen Dateipfad benötigt.
- Von Canvas verwaltete Dokumente verwenden jetzt gemeinsame SQLite-`plugin_blob_entries` statt
  eines Standardverzeichnisses `state/canvas/documents`. Der Canvas-Host liefert diese
  Blobs direkt aus; lokale Dateien werden nur für explizite `host.root`-
  Operatorinhalte oder für temporäre Materialisierung erstellt, wenn ein nachgelagerter Medienleser
  einen Pfad benötigt.
- Audit-Entscheidungen von File Transfer verwenden jetzt gemeinsame SQLite-`plugin_state_entries`
  statt des unbegrenzten Runtime-Logs `audit/file-transfer.jsonl`. Doctor
  importiert die alte JSONL-Audit-Datei in den Plugin-Status und entfernt die Quelle
  nach einem sauberen Import.
- ACPX-Prozess-Leases und Gateway-Instanzidentität verwenden jetzt gemeinsamen SQLite-Plugin-
  Status. Doctor importiert die alte Datei `gateway-instance-id` in den Plugin-Status
  und entfernt die Quelle.
- Von ACPX generierte Wrapper-Skripte und das isolierte Codex-Home sind temporäre
  Materialisierung unter dem OpenClaw-Temp-Root, kein dauerhafter OpenClaw-Status. Die
  dauerhaften ACPX-Runtime-Datensätze sind die SQLite-Lease- und Gateway-Instanz-Zeilen;
  die alte ACPX-`stateDir`-Konfigurationsoberfläche wurde entfernt, weil dort kein Runtime-Status mehr
  geschrieben wird.
- Gateway-Medienanhänge verwenden jetzt die gemeinsame SQLite-Tabelle `media_blobs` als
  kanonischen Bytespeicher. Lokale Pfade, die an Channel- und Sandbox-
  Kompatibilitätsoberflächen zurückgegeben werden, sind temporäre Materialisierungen der Datenbankzeile, nicht der
  dauerhafte Medienspeicher. Runtime-Medien-Allowlists enthalten keine alten
  `$OPENCLAW_STATE_DIR/media`- oder Konfigurationsverzeichnis-`media`-Roots mehr; diese Verzeichnisse sind
  nur Doctor-Importquellen.
- Shell-Vervollständigung schreibt keine `$OPENCLAW_STATE_DIR/completions/*`-Cache-
  Dateien mehr. Installations-, Doctor-, Update- und Release-Smoke-Pfade verwenden generierte
  Vervollständigungsausgabe oder Profil-Sourcing statt dauerhafter Vervollständigungs-Cache-
  Dateien.
- Gateway-Skill-Upload-Staging verwendet jetzt gemeinsame `skill_uploads`-Zeilen. Upload-
  Metadaten, Idempotenzschlüssel und Archivbytes liegen in SQLite; der Installer
  erhält nur einen temporär materialisierten Archivpfad, während eine Installation
  läuft.
- Inline-Anhänge von Subagents werden nicht mehr unter Workspace-
  `.openclaw/attachments/*` materialisiert. Der Spawn-Pfad bereitet SQLite-VFS-Seed-Einträge vor,
  Inline-Runs speisen diese Einträge in den per Agent geführten Runtime-Scratch-Namespace ein,
  und festplattenbasierte Tools legen diesen SQLite-Scratch für Anhangspfade darüber. Die
  alten Attachment-Dir-Registry-Spalten und Cleanup-Hooks für Subagent-Runs sind entfernt.
- CLI-Bildhydration verwaltet keine stabilen `openclaw-cli-images`-Cache-
  Dateien mehr. Externe CLI-Backends erhalten weiterhin Dateipfade, aber diese Pfade sind
  temporäre Materialisierungen pro Run mit Cleanup.
- Cache-Trace-Diagnosen, Anthropic-Payload-Diagnosen, Raw-Model-Stream-
  Diagnosen, Diagnose-Timeline-Ereignisse und Gateway-Stabilitäts-Bundles schreiben jetzt
  SQLite-Zeilen statt `logs/*.jsonl`- oder
  `logs/stability/*.json`-Dateien.
  Runtime-Pfad-Override-Flags und Umgebungsvariablen wurden entfernt; Export-/Debug-
  Befehle können Dateien explizit aus Datenbankzeilen materialisieren.
- Die macOS-Companion-App hat keinen rollierenden `diagnostics.jsonl`-Writer mehr. App-
  Logs gehen in Unified Logging, und dauerhafte Gateway-Diagnosen bleiben SQLite-gestützt.
- Die macOS-Port-Guardian-Datensatzliste verwendet jetzt typisierte gemeinsame SQLite-
  `macos_port_guardian_records`-Zeilen statt einer JSON-Datei in Application Support
  oder eines undurchsichtigen Singleton-Blobs.
- Gateway-Singleton-Locks verwenden jetzt typisierte gemeinsame SQLite-`state_leases`-Zeilen unter
  dem Scope `gateway_locks` statt Lock-Dateien im Temp-Verzeichnis. Fly- und OAuth-
  Troubleshooting-Dokumentation verweist jetzt auf die SQLite-Lease-/Auth-Refresh-Sperre statt
  auf veraltete File-Lock-Bereinigung.
- Gateway-Restart-Sentinel-Status verwendet jetzt typisierte gemeinsame SQLite-
  `gateway_restart_sentinel`-Zeilen statt `restart-sentinel.json`; die Runtime
  liest Sentinel-Art, Status, Routing, Nachricht, Fortsetzung und Statistiken aus
  typisierten Spalten. `payload_json` ist nur eine Replay-/Debug-Kopie. Runtime-Code löscht
  die SQLite-Zeile direkt und führt keine File-Cleanup-Verrohrung mehr mit.
- Gateway-Restart-Intent- und Supervisor-Handoff-Status verwenden jetzt typisierte gemeinsame
  SQLite-`gateway_restart_intent`- und `gateway_restart_handoff`-Zeilen statt
  `gateway-restart-intent.json`- und
  `gateway-supervisor-restart-handoff.json`-Sidecars.
- Gateway-Singleton-Koordination verwendet jetzt typisierte `state_leases`-Zeilen unter
  `gateway_locks`, statt `gateway.<hash>.lock`-Dateien zu schreiben. Die Lease-Zeile
  besitzt Lock-Owner, Ablauf, Heartbeat und Debug-Payload; SQLite besitzt die
  atomare Acquire-/Release-Grenze. Die entfernte File-Lock-Verzeichnisoption ist
  weg; Tests verwenden die SQLite-Zeilenidentität direkt.
- Der alte nicht referenzierte Cron-Nutzungsbericht-Helfer, der `cron/runs/*.jsonl`-
  Dateien gescannt hat, wurde gelöscht. Cron-Run-Verlaufsberichte sollten die typisierten
  SQLite-Zeilen `cron_run_logs` lesen.
- Die Restart-Wiederherstellung der Haupt-Session findet Kandidaten-Agents jetzt über die
  SQLite-Registry `agent_databases`, statt `agents/*/sessions`-
  Verzeichnisse zu scannen.
- Gemini-Session-Corruption-Wiederherstellung löscht jetzt nur die SQLite-Session-Zeile;
  sie benötigt kein altes `storePath`-Gate mehr und versucht nicht mehr, einen abgeleiteten
  Transcript-JSONL-Pfad zu entlinken.
- Die Pfad-Override-Behandlung behandelt literale Umgebungswerte `undefined`/`null`
  jetzt als nicht gesetzt und verhindert so versehentliche Repo-Root-Datenbanken
  `undefined/state/*.sqlite` während Tests oder Shell-Handoffs.
- Konfigurationsintegritäts-Fingerprints verwenden jetzt typisierte gemeinsame SQLite-`config_health_entries`-
  Zeilen statt `logs/config-health.json`, sodass die normale Konfigurationsdatei das einzige
  Nicht-Credential-Konfigurationsdokument bleibt. Die macOS-Companion-App behält nur
  prozesslokalen Integritätsstatus und erstellt das alte JSON-Sidecar nicht neu.
- Die Auth-Profile-Runtime importiert oder schreibt keine Credential-JSON-Dateien mehr. Der
  kanonische Credential-Speicher ist SQLite; `auth-profiles.json`, per Agent
  `auth.json` und gemeinsame `credentials/oauth.json` sind Doctor-Migrationseingaben,
  die nach dem Import entfernt werden.
- Auth-Profile-Save-/State-Tests prüfen jetzt direkt typisierte SQLite-Auth-Tabellen
  und verwenden alte Auth-Profile-Dateinamen nur für Doctor-Migrationseingaben.
- `openclaw secrets apply` bereinigt nur die Konfigurationsdatei, Env-Datei und den SQLite-
  Auth-Profile-Speicher. Es enthält keine Kompatibilitätslogik mehr, die
  entfernte per-Agent-`auth.json` bearbeitet; Doctor ist für Import und Löschen dieser Datei zuständig.
- Hermes-Secret-Migrationspläne und -Ausführungen importieren API-Key-Profile direkt
  in den SQLite-Auth-Profile-Speicher. Sie schreiben oder verifizieren
  `auth-profiles.json` nicht mehr als Zwischenziel.
- Benutzerorientierte Auth-Dokumentation beschreibt jetzt
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>`, statt
  Benutzern zu sagen, sie sollten `auth-profiles.json` prüfen oder kopieren; alte OAuth-/Auth-JSON-
  Namen bleiben nur als Doctor-Importeingaben dokumentiert.
- Core-State-Path-Helfer legen die entfernte Datei `credentials/oauth.json` nicht mehr offen.
  Der alte Dateiname ist lokal auf den Doctor-Auth-Importpfad beschränkt.
- Installations-, Sicherheits-, Onboarding-, Model-Auth- und SecretRef-Dokumentation beschreibt jetzt
  SQLite-Auth-Profile-Zeilen und Whole-State-Backup/-Migration statt
  per-Agent-Auth-Profile-JSON-Dateien.
- PI-Modellerkennung übergibt jetzt kanonische Credentials an den In-Memory-
  `pi-coding-agent`-Auth-Speicher. Sie erstellt, bereinigt oder schreibt während der
  Erkennung kein per-Agent-`auth.json` mehr.
- Voice Wake-Trigger- und Routing-Einstellungen verwenden jetzt typisierte gemeinsame SQLite-Tabellen
  statt `settings/voicewake.json`, `settings/voicewake-routing.json` oder
  undurchsichtige generische Zeilen; Doctor importiert die alten JSON-Dateien und entfernt sie nach einer
  erfolgreichen Migration.
- Update-Check-Status verwendet jetzt eine typisierte gemeinsame `update_check_state`-Zeile statt
  `update-check.json` oder eines undurchsichtigen generischen Blobs; Doctor importiert
  die alte JSON-Datei und entfernt sie nach einer erfolgreichen Migration.
- Config-Health-Status verwendet jetzt typisierte gemeinsame `config_health_entries`-Zeilen statt
  `logs/config-health.json` oder eines undurchsichtigen generischen Blobs; Doctor
  importiert die alte JSON-Datei und entfernt sie nach einer erfolgreichen Migration.
- Plugin-Conversation-Binding-Freigaben verwenden jetzt typisierte
  `plugin_binding_approvals`-Zeilen statt undurchsichtigem gemeinsamem SQLite-Status oder
  `plugin-binding-approvals.json`; die Legacy-Datei ist eine Eingabe für die doctor-Migration.
- Generische Bindungen für die aktuelle Unterhaltung speichern jetzt typisierte
  `current_conversation_bindings`-Zeilen, statt
  `bindings/current-conversations.json` neu zu schreiben; doctor importiert die
  Legacy-JSON-Datei und entfernt sie nach einer erfolgreichen Migration.
- Memory-Wiki-Sync-Ledger für importierte Quellen speichern jetzt eine
  SQLite-Plugin-State-Zeile pro Vault/Quellschlüssel, statt
  `.openclaw-wiki/source-sync.json` neu zu schreiben; der Migrations-Provider
  importiert und entfernt das Legacy-JSON-Ledger.

## Zielschemaform

Halten Sie Schemas explizit. Vom Host verwalteter Runtime-Zustand verwendet typisierte Tabellen. Plugin-eigener
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

Eine zukünftige Suche kann FTS-Tabellen hinzufügen, ohne die kanonischen Ereignistabellen zu ändern:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Große Werte sollten `blob`-Spalten verwenden, keine JSON-String-Codierung. Behalten Sie
`value_json` für kleine strukturierte Daten bei, die mit einfachen
SQLite-Werkzeugen inspizierbar bleiben müssen.

`agent_databases` ist die kanonische Registry für diesen Branch. Fügen Sie keine
`agents`-Tabelle hinzu, bis ein echter Besitzer von Agent-Datensätzen existiert; die Agent-Konfiguration bleibt in
`openclaw.json`.

## Form der Doctor-Migration

Doctor sollte einen expliziten Migrationsschritt aufrufen, der berichtbar ist und sicher erneut ausgeführt werden kann:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` ruft die Implementierung der Zustandsmigration nach
der normalen Konfigurations-Vorabprüfung auf und erstellt vor dem Import ein verifiziertes Backup. Runtime-Start
und `openclaw migrate` dürfen keine Legacy-Zustandsdateien von OpenClaw importieren.

Migrationseigenschaften:

- Ein Migrationsdurchlauf entdeckt alle Legacy-Dateiquellen und erstellt einen Plan,
  bevor irgendetwas verändert wird.
- Doctor erstellt vor dem Import von Legacy-Dateien ein verifiziertes Backup-Archiv vor der Migration.
- Importe sind idempotent und nach Quellpfad, mtime, Größe, Hash und Zieltabelle
  schlüsselbasiert.
- Erfolgreiche Quelldateien werden entfernt oder archiviert, nachdem die Zieldatenbank
  committed wurde.
- Fehlgeschlagene Importe lassen die Quelle unverändert und zeichnen eine Warnung in
  `migration_runs` auf.
- Runtime-Code liest erst SQLite, nachdem die Migration existiert.
- Es ist kein Downgrade- oder Exportpfad zurück zu Runtime-Dateien erforderlich.

## Migrationsinventar

Verschieben Sie diese in die globale Datenbank:

- Laufzeitschreibvorgänge der Aufgabenregistrierung verwenden jetzt die gemeinsame Datenbank; der nicht ausgelieferte
  `tasks/runs.sqlite`-Sidecar-Importer ist gelöscht. Snapshot-Speicherungen führen Upserts nach Aufgaben-
  ID aus und löschen nur fehlende Aufgaben-/Auslieferungszeilen.
- Laufzeitschreibvorgänge von Task Flow verwenden jetzt die gemeinsame Datenbank; der nicht ausgelieferte
  `tasks/flows/registry.sqlite`-Sidecar-Importer ist gelöscht. Snapshot-Speicherungen
  führen Upserts nach Flow-ID aus und löschen nur fehlende Flow-Zeilen.
- Laufzeitschreibvorgänge des Plugin-Zustands verwenden jetzt die gemeinsame Datenbank; der nicht ausgelieferte
  `plugin-state/state.sqlite`-Sidecar-Importer ist gelöscht.
- Die integrierte Speichersuche verwendet nicht mehr standardmäßig `memory/<agentId>.sqlite`; ihre
  Indextabellen liegen in der zuständigen Agent-Datenbank, und das explizite
  `memorySearch.store.path`-Sidecar-Opt-in wurde in die doctor-Konfigurationsmigration
  verschoben.
- Die integrierte Speicher-Neuindizierung setzt nur speichereigene Tabellen in der Agent-Datenbank zurück.
  Sie darf nicht die gesamte SQLite-Datei ersetzen, weil dieselbe Datenbank
  Sitzungen, Transkripte, VFS-Zeilen, Artefakte und Laufzeit-Caches besitzt.
- Sandbox-Container-/Browser-Registrierungen aus monolithischem und geshardetem JSON. Laufzeit-
  schreibvorgänge verwenden jetzt die gemeinsame Datenbank; der Import von Legacy-JSON bleibt bestehen.
- Cron-Jobdefinitionen, Zeitplanstatus und Ausführungshistorie verwenden jetzt gemeinsames SQLite;
  doctor importiert/entfernt Legacy-Dateien `jobs.json`, `jobs-state.json` und
  `cron/runs/*.jsonl`
- Geräteidentität/-authentifizierung, Push, Update-Prüfung, Commitments, OpenRouter-Modell-
  Cache, installierter Plugin-Index und App-Server-Bindungen
- Geräte-/Node-Kopplungs- und Bootstrap-Datensätze verwenden jetzt typisierte SQLite-Tabellen
- Benachrichtigungsabonnenten für Gerätepaare und Marker für zugestellte Anfragen verwenden jetzt die
  gemeinsame SQLite-Plugin-State-Tabelle statt `device-pair-notify.json`.
- Voice-Call-Anrufdatensätze verwenden jetzt die gemeinsame SQLite-Plugin-State-Tabelle unter dem
  Namespace `voice-call` / `calls` statt `calls.jsonl`; die Plugin-CLI
  verfolgt und fasst die SQLite-gestützte Anrufhistorie zusammen.
- QQBot-Gateway-Sitzungen, Known-User-Datensätze und Ref-Index-Zitatcache verwenden jetzt
  SQLite-Plugin-State unter `qqbot`-Namespaces (`sessions`, `known-users`,
  `ref-index`) statt `session-*.json`, `known-users.json` und
  `ref-index.jsonl`; die QQBot-doctor-/Setup-Migration importiert und entfernt die
  Legacy-Dateien.
- Discord-Modellwähler-Einstellungen, Command-Deploy-Hashes und Thread-Bindungen
  verwenden jetzt SQLite-Plugin-State unter `discord`-Namespaces
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  statt `model-picker-preferences.json`, `command-deploy-cache.json` und
  `thread-bindings.json`; die Discord-doctor-/Setup-Migration importiert und
  entfernt die Legacy-Dateien.
- BlueBubbles-Catchup-Cursor und eingehende Dedupe-Marker verwenden jetzt SQLite-Plugin-
  State unter `bluebubbles`-Namespaces (`catchup-cursors`, `inbound-dedupe`)
  statt `bluebubbles/catchup/*.json` und
  `bluebubbles/inbound-dedupe/*.json`; die BlueBubbles-doctor-/Setup-Migration
  importiert und entfernt die Legacy-Dateien.
- Telegram-Update-Offsets, Sticker-Cache-Einträge, Antwortketten-Nachrichtencache-
  Einträge, Gesendete-Nachrichten-Cache-Einträge, Topic-Name-Cache-Einträge und Thread-
  Bindungen verwenden jetzt SQLite-Plugin-State unter `telegram`-Namespaces
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) statt `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` und
  `thread-bindings-*.json`; die Telegram-doctor-/Setup-Migration importiert und
  entfernt die Legacy-Dateien.
- iMessage-Catchup-Cursor, Antwort-Short-ID-Zuordnungen und Sent-Echo-Dedupe-Zeilen
  verwenden jetzt SQLite-Plugin-State unter `imessage`-Namespaces (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) statt `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` und `imessage/sent-echoes.jsonl`; die iMessage-
  doctor-/Setup-Migration importiert und entfernt die Legacy-Dateien.
- Microsoft Teams-Konversationen, Umfragen, SSO-Tokens und Feedback-Learnings verwenden jetzt
  SQLite-Plugin-State-Namespaces (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) statt `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` und `*.learnings.json`; die
  Microsoft Teams-doctor-/Setup-Migration importiert und archiviert die Legacy-Dateien.
  Ausstehende Uploads sind ein kurzlebiger SQLite-Cache, und alte JSON-Cache-Dateien werden
  nicht migriert.
- Matrix-Sync-Cache, Speichermetadaten, Thread-Bindungen, eingehende Dedupe-Marker,
  Cooldown-Status der Startverifizierung, Anmeldedaten, Wiederherstellungsschlüssel und SDK-
  IndexedDB-Krypto-Snapshots verwenden jetzt SQLite-Plugin-State-/Blob-Namespaces unter
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  statt `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` und `crypto-idb-snapshot.json`; die Matrix-doctor-/Setup-
  Migration importiert und entfernt diese Legacy-Dateien aus kontospezifischen Matrix-
  Speicherwurzeln.
- Nostr-Bus-Cursor und Profilveröffentlichungsstatus verwenden jetzt SQLite-Plugin-State unter
  `nostr`-Namespaces (`bus-state`, `profile-state`) statt
  `bus-state-*.json` und `profile-state-*.json`; die Nostr-doctor-/Setup-
  Migration importiert und entfernt die Legacy-Dateien.
- Active Memory-Sitzungsumschalter verwenden jetzt SQLite-Plugin-State unter
  `active-memory/session-toggles` statt `session-toggles.json`.
- Skill-Workshop-Vorschlagswarteschlangen und Review-Zähler verwenden jetzt SQLite-Plugin-State
  unter `skill-workshop/proposals` und `skill-workshop/reviews` statt
  arbeitsbereichsspezifischer `skill-workshop/<workspace>.json`-Dateien.
- Ausgehende Auslieferungs- und Sitzungsauslieferungswarteschlangen teilen sich jetzt die globale SQLite-
  Tabelle `delivery_queue_entries` unter separaten Warteschlangennamen
  (`outbound-delivery`, `session-delivery`) statt dauerhafter
  `delivery-queue/*.json`-, `delivery-queue/failed/*.json`- und
  `session-delivery-queue/*.json`-Dateien. Der doctor-Legacy-State-Schritt importiert
  ausstehende und fehlgeschlagene Zeilen, entfernt veraltete Zustellungsmarker und löscht die alten
  JSON-Dateien nach dem Import. Hot-Routing- und Wiederholungsfelder sind typisierte Spalten; die
  JSON-Nutzlast bleibt nur für Replay/Debugging erhalten.
- ACPX-Prozess-Leases verwenden jetzt SQLite-Plugin-State unter `acpx/process-leases`
  statt `process-leases.json`.
- Backup- und Migrationslauf-Metadaten

Diese in Agent-Datenbanken verschieben:

- Agent-Sitzungswurzeln und kompatibilitätsförmige Sitzungseintrags-Nutzlasten. Für
  Laufzeitschreibvorgänge erledigt: Hot-Sitzungsmetadaten sind in `sessions` abfragbar, während die
  vollständige Legacy-förmige `SessionEntry`-Nutzlast in `session_entries` bleibt.
- Agent-Transkriptereignisse. Für Laufzeitschreibvorgänge erledigt.
- Compaction-Checkpoints und Transkript-Snapshots. Für Laufzeitschreibvorgänge erledigt:
  Checkpoint-Transkriptkopien sind SQLite-Transkriptzeilen, und Checkpoint-
  Metadaten werden in `transcript_snapshots` aufgezeichnet. Gateway-Checkpoint-Helfer
  benennen diese Werte jetzt als Transkript-Snapshots statt als Quelldateien.
- Agent-VFS-Scratch-/Workspace-Namespaces. Für Laufzeit-VFS-Schreibvorgänge erledigt.
- Subagent-Anhangsnutzlasten. Für Laufzeitschreibvorgänge erledigt: Sie sind SQLite-VFS-
  Seed-Einträge und niemals dauerhafte Workspace-Dateien.
- Tool-Artefakte. Für Laufzeitschreibvorgänge erledigt.
- Run-Artefakte. Für Worker-Laufzeitschreibvorgänge über die agentenspezifische
  Tabelle `run_artifacts` erledigt.
- Agent-lokale Laufzeit-Caches. Für Worker-Laufzeit-Schreibvorgänge in Scoped-Caches über
  die agentenspezifische Tabelle `cache_entries` erledigt. Gateway-weite Modell-Caches bleiben in der
  globalen Datenbank, sofern sie nicht agentenspezifisch werden.
- ACP-Elternstream-Logs. Für Laufzeitschreibvorgänge erledigt.
- ACP-Replay-Ledger-Sitzungen. Für Laufzeitschreibvorgänge über
  `acp_replay_sessions` und `acp_replay_events` erledigt; Legacy-`acp/event-ledger.json`
  bleibt nur als doctor-Eingabe bestehen.
- ACP-Sitzungsmetadaten. Für Laufzeitschreibvorgänge über `acp_sessions` erledigt; Legacy-
  `entry.acp`-Blöcke in `sessions.json` sind nur Eingabe für die doctor-Migration.
- Trajectory-Sidecars, wenn sie keine expliziten Exportdateien sind. Für Laufzeitschreibvorgänge
  erledigt: Trajectory-Erfassung schreibt `trajectory_runtime_events`-Zeilen in die Agent-Datenbank
  und spiegelt laufbezogene Artefakte nach SQLite. Legacy-Sidecars sind nur Eingaben für den
  doctor-Import; Export kann frische JSONL-Support-Bundle-Ausgaben materialisieren,
  liest oder migriert alte Trajectory-/Transkript-Sidecars zur Laufzeit aber nicht.
  Laufzeit-Trajectory-Erfassung stellt den SQLite-Scope bereit; JSONL-Pfadhelfer sind
  auf Export-/Debug-Support isoliert und werden nicht erneut aus dem Laufzeitmodul exportiert.
  Embedded-Runner-Trajectory-Metadaten zeichnen die Identität `{agentId, sessionId, sessionKey}`
  auf, statt einen Transkript-Locator dauerhaft zu speichern.

Diese vorerst dateigestützt behalten:

- `openclaw.json`
- Provider- oder CLI-Anmeldedatendateien
- Plugin-/Paketmanifeste
- Benutzer-Workspaces und Git-Repositorys, wenn der Festplattenmodus ausgewählt ist
- Logs, die für operatorseitiges Tailing vorgesehen sind, sofern keine bestimmte Log-Oberfläche verschoben wird

## Migrationsplan

### Phase 0: Grenze einfrieren

Machen Sie die Grenze für dauerhaften Zustand explizit, bevor weitere Zeilen verschoben werden:

- Fügen Sie der globalen Datenbank eine Tabelle `migration_runs` hinzu.
  Für Legacy-State-Migrationsausführungsberichte erledigt.
- Fügen Sie einen einzelnen doctor-eigenen State-Migrationsdienst für Datei-zu-Datenbank-Import hinzu.
  Erledigt: `openclaw doctor --fix` verwendet die Legacy-State-Migrationsimplementierung.
- Machen Sie `plan` schreibgeschützt und lassen Sie `apply` ein Backup erstellen, importieren, verifizieren und
  dann alte Dateien löschen oder quarantänisieren.
  Erledigt: doctor erstellt ein verifiziertes Backup vor der Migration, übergibt den Backup-Pfad
  an `migration_runs` und verwendet die Importer-/Entfernungspfade wieder.
- Fügen Sie statische Verbote hinzu, damit neuer Laufzeitcode keine Legacy-State-Dateien schreiben kann, während
  Migrationscode und Tests sie weiterhin seeden/lesen können.
  Für die derzeit migrierten Legacy-Stores erledigt; der Guard scannt außerdem verschachtelte
  Tests auf verbotene Laufzeit-Transkript-Locator-Verträge.

### Phase 1: Globale Control Plane abschließen

Gemeinsamen Koordinationszustand in `state/openclaw.sqlite` halten:

- Agents und Agent-Datenbankregistrierung
- Task- und Task-Flow-Ledger
- Plugin-Zustand
- Sandbox-Container-/Browserregistrierung
- Cron-/Scheduler-Ausführungshistorie
- Pairing-, Geräte-, Push-, Update-Check-, TUI-, OpenRouter-/Modell-Caches und anderer
  kleiner Gateway-bezogener Laufzeitzustand
- Backup- und Migrationsmetadaten
- Bytes von Gateway-Medienanhängen. Für Laufzeit-Schreibvorgänge erledigt; direkte Dateipfade
  sind temporäre Materialisierungen für die Kompatibilität mit Channel-Sendern und Sandbox-
  Staging. Laufzeit-Allowlists akzeptieren SQLite-Materialisierungspfade, nicht Legacy-
  State-/Config-Medien-Roots. Doctor importiert Legacy-Mediendateien in
  `media_blobs` und entfernt die Quelldateien nach erfolgreichen Zeilenschreibvorgängen.
- Debug-Proxy-Erfassungssitzungen, Ereignisse und Payload-Blobs. Erledigt: Erfassungen leben
  in der gemeinsamen Zustands-DB und werden über den gemeinsamen Zustands-DB-Bootstrap, das Schema,
  WAL und Busy-Timeout-Einstellungen geöffnet. Payload-Bytes werden gzip-komprimiert in
  `capture_blobs.data`; es gibt keinen Debug-Proxy-Laufzeit-Sidecar-DB-Override,
  kein Blob-Verzeichnis und kein nur für Proxy-Erfassungen generiertes Schema-/Codegen-Ziel.
  Doctor-/Startup-Migration importiert ausgelieferte `debug-proxy/capture.sqlite`-Zeilen
  und referenzierte Payload-Blobs, einschließlich aktiver Legacy-DB-/Blob-Umgebungs-
  Overrides, und archiviert diese Quellen anschließend, während CA-Zertifikate intakt bleiben.

Diese Phase löscht außerdem doppelte Sidecar-Opener, Berechtigungshelfer, WAL-
Einrichtung, Dateisystem-Bereinigung und Kompatibilitäts-Writer aus diesen Subsystemen.

### Phase 2: Pro-Agent-Datenbanken einführen

Erstellen Sie eine Datenbank pro Agent und registrieren Sie sie aus der globalen DB:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Die globale `agent_databases`-Zeile speichert den Pfad, die Schemaversion, den Last-Seen-
Zeitstempel und grundlegende Größen-/Integritätsmetadaten. Laufzeitcode fragt die Registrierung nach
der Agent-DB, anstatt Dateipfade direkt abzuleiten.

Die Agent-DB besitzt:

- `sessions` als kanonischer Sitzungs-Root, mit `session_entries` als die an
  diesen Root angehängte kompatibilitätsgeformte Payload-Tabelle und
  `session_routes` als eindeutiger aktiver `session_key`-Lookup
- `conversations` und `session_conversations` als die normalisierte Provider-
  Routing-Identität, die an Sitzungen angehängt ist
- `transcript_events`
- Transkript-Snapshots und Compaction-Checkpoints. Für Runtime-Schreibvorgänge
  erledigt.
- `vfs_entries`
- `tool_artifacts` und Run-Artefakte
- agent-lokale Runtime-/Cache-Zeilen. Für Worker-scoped Caches erledigt.
- ACP-Parent-Stream-Ereignisse
- Trajectory-Runtime-Ereignisse, wenn sie keine expliziten Exportartefakte sind

### Phase 3: Session-Store-APIs ersetzen

Für die Runtime erledigt. Die dateigeformte Session-Store-Oberfläche ist kein
aktiver Runtime-Vertrag:

- Die Runtime ruft `loadSessionStore(storePath)` nicht mehr auf und behandelt
  `storePath` nicht mehr als Sitzungsidentität.
- Runtime-Zeilenoperationen sind `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` und `listSessionEntries`.
- Whole-Store-Rewrite-Helfer, Dateischreiber, Queue-Tests, Alias-Pruning und
  Parameter zum Löschen von Legacy-Schlüsseln sind aus der Runtime entfernt.
- Veraltete Kompatibilitätsexporte des Root-Pakets adaptieren weiterhin
  kanonische `sessions.json`-Pfade auf die SQLite-Zeilen-APIs.
- `sessions.json`-Parsing verbleibt nur im doctor-Migrations-/Importcode und in
  doctor-Tests.
- Runtime-Lifecycle-Fallbacks lesen SQLite-Transkript-Header, nicht zuerst
  JSONL-Erstzeilen.

Löschen Sie weiterhin alles, was File-Lock-Parameter, Vokabular für
Pruning/Truncation als Dateiwartung, Store-Pfad-Identität oder Tests wieder
einführt, deren einzige Assertion JSON-Persistenz ist.

### Phase 4: Transkripte, ACP-Streams, Trajectories und VFS verschieben

Machen Sie jeden Agent-Datenstrom datenbanknativ:

- Transkript-Append-Schreibvorgänge laufen über eine SQLite-Transaktion, die den
  Sitzungs-Header sicherstellt, Nachrichten-Idempotenz prüft, den Parent-Tail
  auswählt, in `transcript_events` einfügt und abfragbare Identitätsmetadaten in
  `transcript_event_identities` erfasst. Erledigt für direkte
  Transkript-Nachrichten-Appends und normale persistierte
  `TranscriptSessionManager`-Appends; explizite Branch-Operationen behalten ihre
  explizite Parent-Auswahl und schreiben weiterhin SQLite-Zeilen, ohne einen
  Dateilocator abzuleiten.
- ACP-Parent-Stream-Logs werden Zeilen, keine `.acp-stream.jsonl`-Dateien.
  Erledigt.
- ACP-Spawn-Setup persistiert keine Transkript-JSONL-Pfade mehr. Erledigt.
- Runtime-Trajectory-Erfassung schreibt Ereigniszeilen/Artefakte direkt. Der
  explizite Support-/Exportbefehl kann weiterhin Support-Bundle-JSONL-Artefakte
  als Exportformat erzeugen, aber der Sitzungsexport erstellt keine
  Sitzungs-JSONL erneut. Erledigt.
- Disk-Workspaces bleiben auf der Festplatte, wenn sie als Disk-Modus
  konfiguriert sind.
- VFS-Scratch und experimenteller VFS-only-Workspace-Modus verwenden die
  Agent-DB.

Die Migration importiert alte JSONL-Dateien einmalig, zeichnet Anzahlen/Hashes
in `migration_runs` auf und entfernt importierte Dateien nach Integritätsprüfungen.

### Phase 5: Backup, Restore, Vacuum und Verify

Backups bleiben eine Archivdatei:

- Jede globale und Agent-Datenbank checkpointen.
- Jede DB mit SQLite-Backup-Semantik oder `VACUUM INTO` snapshotten.
- Kompakte DB-Snapshots, Konfiguration, externe Anmeldedaten und angeforderte
  Workspace-Exporte archivieren.
- Rohe Live-Dateien `*.sqlite-wal` und `*.sqlite-shm` auslassen.
- Durch Öffnen jedes DB-Snapshots und Ausführen von `PRAGMA integrity_check`
  verifizieren. `openclaw backup create` führt diese Archivverifizierung
  standardmäßig aus; `--no-verify` überspringt nur den Archivdurchlauf nach dem
  Schreiben, nicht die Integritätsprüfung bei der Snapshot-Erstellung.
- Restore kopiert Snapshots zurück an ihre Zielpfade. Dieser Branch setzt das
  nicht ausgelieferte SQLite-Layout auf `user_version = 1` zurück; künftige
  ausgelieferte Schemaänderungen können explizite Migrationen ergänzen, wenn sie
  benötigt werden.

### Phase 6: Worker-Runtime

Halten Sie den Worker-Modus experimentell, während der Datenbank-Split landet:

- Worker erhalten Agent-ID, Run-ID, Dateisystemmodus und DB-Registry-Identität.
- Jeder Worker öffnet seine eigene SQLite-Verbindung.
- Parent behält Channel-Auslieferung, Genehmigungen, Konfiguration und
  Abbruchautorität.
- Mit einem Worker pro aktivem Run beginnen; Pooling erst ergänzen, nachdem
  Lifecycle und DB-Verbindungsbesitz stabil sind.

### Phase 7: Die alte Welt löschen

Für Runtime-Sitzungsverwaltung erledigt. Die alte Welt ist nur als explizite
doctor-Eingabe oder Support-/Export-Ausgabe erlaubt:

- Keine Runtime-Schreibvorgänge in `sessions.json`, Transkript-JSONL,
  Sandbox-Registry-JSON, Task-Sidecar-SQLite oder Plugin-State-Sidecar-SQLite.
- Kein JSON-/Sitzungsdatei-Pruning, keine Datei-Transkript-Truncation, keine
  Sitzungsdatei-Locks und keine lock-geformten Sitzungstests.
- Keine Runtime-Kompatibilitätsexporte, deren Zweck darin besteht, alte
  Sitzungsdateien aktuell zu halten.
- Explizite Support-Exporte bleiben vom Benutzer angeforderte
  Archiv-/Materialisierungsformate und dürfen Dateinamen nicht zurück in die
  Runtime-Identität einspeisen.

## Backup und Restore

Backups sollten eine Archivdatei sein, aber die Datenbankerfassung sollte
SQLite-nativ sein:

1. Lang laufende Schreibaktivität stoppen oder eine kurze Backup-Barriere
   betreten.
2. Für jede globale und Agent-Datenbank einen Checkpoint ausführen.
3. Jede Datenbank mit SQLite-Backup-Semantik oder `VACUUM INTO` in ein
   temporäres Backup-Verzeichnis snapshotten.
4. Die kompaktierten Datenbank-Snapshots, Konfigurationsdatei,
   Anmeldedatenverzeichnis, ausgewählte Workspaces und ein Manifest archivieren.
5. Das Archiv verifizieren, indem jeder enthaltene SQLite-Snapshot geöffnet und
   `PRAGMA integrity_check` ausgeführt wird.
   `openclaw backup create` tut dies standardmäßig; `--no-verify` dient nur
   dazu, den Archivdurchlauf nach dem Schreiben absichtlich zu überspringen.

Verlassen Sie sich nicht auf rohe Live-Kopien von `*.sqlite`, `*.sqlite-wal` und
`*.sqlite-shm` als primäres Backup-Format. Das Archivmanifest sollte
Datenbankrolle, Agent-ID, Schemaversion, Quellpfad, Snapshot-Pfad, Byte-Größe und
Integritätsstatus erfassen.

Restore sollte die globale Datenbank und Agent-Datenbankdateien aus den
Archiv-Snapshots neu aufbauen. Da das SQLite-Layout noch nicht ausgeliefert
wurde, behält dieses Refactoring nur das Version-1-Schema plus
doctor-Datei-zu-Datenbank-Import. Der Restore-Befehl validiert zuerst das Archiv
und ersetzt dann jedes Manifest-Asset aus der verifizierten extrahierten Payload.

## Runtime-Refactoring-Plan

1. Datenbank-Registry-APIs hinzufügen.
   - Globale DB- und Pro-Agent-DB-Pfade auflösen.
   - Die nicht ausgelieferten Schemas bei `user_version = 1` halten; keinen
     Schema-Migration-Runner-Code hinzufügen, bis ein ausgeliefertes Schema ihn
     benötigt.
   - Close-/Checkpoint-/Integritätshelfer hinzufügen, die von Tests, Backup und
     doctor verwendet werden.

2. Sidecar-SQLite-Stores zusammenführen.
   - Plugin-State-Tabellen in die globale Datenbank verschieben. Für
     Runtime-Schreibvorgänge erledigt; der nicht ausgelieferte
     Legacy-Sidecar-Importer ist gelöscht.
   - Task-Registry-Tabellen in die globale Datenbank verschieben. Für
     Runtime-Schreibvorgänge erledigt; der nicht ausgelieferte
     Legacy-Sidecar-Importer ist gelöscht.
   - TaskFlow-Tabellen in die globale Datenbank verschieben. Für
     Runtime-Schreibvorgänge erledigt; der nicht ausgelieferte
     Legacy-Sidecar-Importer ist gelöscht.
   - Eingebaute Memory-Search-Tabellen in jede Agent-Datenbank verschieben.
     Erledigt; explizites benutzerdefiniertes `memorySearch.store.path` wird
     jetzt durch doctor-Konfigurationsmigration entfernt. Vollständige
     Neuindizierung läuft nur direkt gegen Memory-Tabellen; der alte Whole-File-
     Swap-Pfad und der Sidecar-Index-Swap-Helfer sind gelöscht.
   - Doppelte Datenbank-Opener, WAL-Setup, Berechtigungshelfer und Close-Pfade
     aus diesen Subsystemen löschen.

3. Agent-eigene Tabellen in Pro-Agent-Datenbanken verschieben.
   - Agent-DB bei Bedarf über die globale Datenbank-Registry erstellen.
     Erledigt.
   - Runtime-Sitzungseinträge, Transkript-Ereignisse, VFS-Zeilen und
     Tool-Artefakte in Agent-DBs verschieben. Erledigt.
   - Branch-lokale Shared-DB-Sitzungseinträge, Transkript-Ereignisse,
     VFS-Zeilen oder Tool-Artefakte nicht migrieren; dieses Layout wurde nie
     ausgeliefert. Nur Legacy-Datei-zu-Datenbank-Import in doctor behalten.

4. Session-Store-APIs ersetzen.
   - `storePath` als Runtime-Identität entfernen. Für Runtime erledigt und durch
     `check:database-first-legacy-stores` geschützt: Sitzungsmetadaten,
     Route-Updates, Befehls-Persistenz, CLI-Sitzungsbereinigung,
     Feishu-Reasoning-Vorschauen, Transkript-State-Persistenz,
     Subagent-Tiefe, Auth-Profil-Sitzungsüberschreibungen, Parent-Fork-Logik und
     QA-Lab-Inspektion lösen die Datenbank jetzt aus kanonischen
     Agent-/Sitzungsschlüsseln auf.
     Gateway-/TUI-/UI-/macOS-Sitzungslisten-Antworten stellen jetzt
     `databasePath` statt des Legacy-`path` bereit; macOS-Debug-Oberflächen
     zeigen die Pro-Agent-Datenbank als schreibgeschützten State, statt
     `session.store`-Konfiguration zu schreiben.
     `/status`, chat-gesteuerter Trajectory-Export und
     CLI-Abhängigkeits-Proxys propagieren keine Legacy-Store-Pfade mehr;
     Transkript-Nutzungsfallback liest SQLite anhand von Agent-/Sitzungsidentität.
     Runtime- und Bridge-Tests stellen `storePath` nicht mehr bereit;
     doctor-/Migrationseingaben besitzen diesen Legacy-Feldnamen.
     Kombiniertes Gateway-Sitzungsladen hat keinen speziellen Runtime-Branch
     mehr für nicht templatisierte `session.store`-Werte; es aggregiert
     Pro-Agent-SQLite-Zeilen.
     Die Legacy-Session-Lock-doctor-Lane und ihr `.jsonl.lock`-Cleanup-Helfer
     wurden entfernt; SQLite ist jetzt die Nebenläufigkeitsgrenze für Sitzungen.
     Heiße Runtime-Aufrufstellen verwenden zeilenorientierte Helfernamen wie
     `resolveSessionRowEntry`; der alte Kompatibilitätsalias
     `resolveSessionStoreEntry` wurde aus Runtime- und Plugin-SDK-Exporten
     entfernt.

- `{ agentId, sessionKey }`-Zeilenoperationen verwenden.
  Erledigt: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` und `listSessionEntries` sind SQLite-first-APIs, die keinen
  Session-Store-Pfad benötigen. Statuszusammenfassung, lokaler Agent-Status,
  Health und der Listing-Befehl `openclaw sessions` lesen jetzt Pro-Agent-Zeilen
  direkt und zeigen Pro-Agent-SQLite-Datenbankpfade statt `sessions.json`-Pfade
  an.
- Whole-Store-Delete/Insert durch `upsertSessionEntry`, `deleteSessionEntry`,
  `listSessionEntries` und SQL-Cleanup-Abfragen ersetzen.
  Für Runtime erledigt: heiße Pfade verwenden jetzt Zeilen-APIs und mit
  Konflikt-Wiederholung ausgeführte Zeilen-Patches; verbleibende Whole-Store-
  Import-/Replace-Helfer sind auf Migrationsimportcode und SQLite-Backend-Tests
  beschränkt.
  - `store-writer.ts` und Writer-Queue-Tests löschen. Erledigt.
  - Runtime-Pruning von Legacy-Schlüsseln und Alias-Delete-Parameter aus
    Sitzungszeilen-Upserts/-Patches löschen. Erledigt.

5. Runtime-JSON-Registry-Verhalten löschen.
   - Sandbox-Registry-Lese- und Schreibvorgänge SQLite-only machen. Erledigt.
   - Monolithisches und geshardetes JSON nur aus dem Migrationsschritt
     importieren. Erledigt.
   - Geshardete Registry-Locks und JSON-Schreibvorgänge entfernen. Erledigt.

- Eine typisierte Registry-Tabelle behalten, statt Registry-Zeilen als
  generisches opakes JSON zu speichern, wenn die Form heißer operativer
  Pfad-State bleibt. Erledigt.

6. Dateilock-geformte Sitzungsmutation löschen.
   - Für Runtime-Lock-Erstellung und Runtime-Lock-APIs erledigt.
   - Die eigenständige Legacy-`.jsonl.lock`-doctor-Cleanup-Lane ist entfernt.
   - `session.writeLock` ist doctor-migrierte Legacy-Konfiguration, keine
     typisierte Runtime-Einstellung.
   - State-Integrität hat keinen separaten Pruning-Pfad für verwaiste
     Transkriptdateien mehr; doctor-Migration importiert/entfernt
     Legacy-JSONL-Quellen an einer Stelle.
   - Gateway-Singleton-Koordination verwendet typisierte SQLite-`state_leases`-
     Zeilen unter `gateway_locks` und stellt keine File-Lock-Verzeichniskante
     mehr bereit.
   - Generische Plugin-SDK-Dedupe-Persistenz verwendet keine Dateilocks oder
     JSON-Dateien mehr; sie schreibt gemeinsame SQLite-Plugin-State-Zeilen.
     Erledigt.
   - QMD-Embed-Koordination verwendet eine SQLite-State-Lease statt
     `qmd/embed.lock`. Erledigt.

7. Worker datenbankbewusst machen.
   - Worker öffnen ihre eigenen SQLite-Verbindungen.
   - Parent besitzt Auslieferung, Channel-Callbacks und Konfiguration.
   - Worker erhält Agent-ID, Run-ID, Dateisystemmodus und DB-Registry-Identität,
     keine Live-Handles.
   - `vfs-only` bleibt experimentell und verwendet die Agent-Datenbank als
     Speicher-Root.
   - Zuerst einen Worker pro aktivem Run beibehalten. Pooling kann warten, bis
     DB-Verbindungslebensdauer und Abbruchverhalten unspektakulär sind.

8. Backup-Integration.
   - Bringen Sie dem Backup bei, globale und Agent-Datenbanken per SQLite-Backup oder
     `VACUUM INTO` als Snapshot zu sichern. Erledigt für erkannte `*.sqlite`-Dateien unter dem State-Asset.
   - Fügen Sie Backup-Verifizierung für SQLite-Integrität und Schemaversion hinzu. Erledigt für
     Backuperstellung und standardmäßige Integritätsprüfungen bei der Archivverifizierung.
   - Erfassen Sie Metadaten zu Backup-Läufen in SQLite. Erledigt über die gemeinsame Tabelle
     `backup_runs` mit Archivpfad, Status und Manifest-JSON.
   - Fügen Sie Wiederherstellung aus verifizierten Archiv-Snapshots hinzu. Erledigt: `openclaw backup
restore` validiert vor der Extraktion, verwendet das normalisierte Manifest
     des Verifizierers, unterstützt `--dry-run` und verlangt `--yes`, bevor
     aufgezeichnete Quellpfade ersetzt werden.
   - Schließen Sie VFS-/Workspace-Export nur auf Anforderung ein; exportieren Sie Sitzungs-
     Interna nicht als JSON oder JSONL.

9. Veraltete Tests und veralteten Code löschen. Erledigt für die bekannten Runtime-Sitzungsoberflächen.

- Entfernen Sie Tests, die die Runtime-Erstellung von `sessions.json` oder Transcript-
  JSONL-Dateien prüfen. Erledigt für Core-Sitzungsspeicher, Chat, Gateway-Transcript-Ereignisse,
  Vorschau, Lebenszyklus, Befehlsaktualisierungen für Sitzungseinträge, Auto-Reply-Reset/-Trace und
  Memory-Core-Dreaming-Fixtures, Approval-Zielrouting, Sitzungstranscript-
  Reparatur, Sicherheitsberechtigungsreparatur, Trajectory-Export und Sitzungsexport.
  Active-Memory-Transcript-Tests prüfen jetzt SQLite-Scopes und keine Erstellung temporärer oder
  persistierter JSONL-Dateien.
  Die alte Heartbeat-Regression zum Kürzen von Transcripts wurde entfernt, weil
  die Runtime JSONL-Transcripts nicht mehr kürzt.
  Agent-Session-List-Tool-Tests modellieren Legacy-Pfade für `sessions.json` nicht mehr
  als Gateway-Antwortform; App-/UI-/macOS-Tests verwenden `databasePath`.
  `/status`-Tests zur Transcript-Nutzung seeden jetzt SQLite-Transcript-Zeilen direkt,
  statt JSONL-Dateien zu schreiben.
  Gateway-Tests zum Sitzungslebenszyklus verwenden jetzt SQLite-Transcript-Seeding-Hilfen
  direkt; die alte einzeilige Sitzungsdatei-Fixture-Form ist aus der Reset-
  und Löschabdeckung verschwunden.
  `sessions.delete` gibt kein datei-zeitliches Feld `archived: []` mehr zurück; Löschung
  meldet nur das Ergebnis der Zeilenmutation. Die alte Option `deleteTranscript` ist
  ebenfalls weg: Das Löschen einer Sitzung entfernt den kanonischen `sessions`-Root und lässt
  SQLite sitzungseigene Transcript-, Snapshot- und Trajectory-Zeilen kaskadierend löschen, sodass kein
  Aufrufer Transcript-Waisen zurücklassen oder einen Cleanup-Zweig vergessen kann.
  Context-Engine-Tests zur Trajectory-Erfassung lesen jetzt Zeilen aus
  `trajectory_runtime_events` aus einer isolierten Agent-Datenbank, statt
  `session.trajectory.jsonl` zu lesen.
  Docker-MCP-Channel-Seed-Skripte seeden jetzt SQLite-Zeilen direkt. Direkte
  Schreibvorgänge auf `sessions.json` sind auf Doctor-Fixtures beschränkt.
  Tool Search Gateway E2E liest Tool-Call-Nachweise aus SQLite-Transcript-Zeilen,
  statt Dateien unter `agents/<agentId>/sessions/*.jsonl` zu scannen.
  Memory-Core-Host-Ereignisse und Scratch-Zeilen des Sitzungskorpus leben jetzt im gemeinsamen
  SQLite-Plugin-State; `events.jsonl` und `session-corpus/*.txt` sind nur noch Legacy-
  Eingaben für Doctor-Migrationen. Aktive Zeilen verwenden virtuelle Pfade unter
  `memory/session-ingestion/`, nicht `.dreams/session-corpus`. Das alte Memory-Core-Dreaming-
  Reparaturmodul und seine CLI-/Gateway-Tests wurden entfernt, weil die Runtime keine
  Dateiarchivreparatur für diesen Korpus mehr besitzt. Memory-Core-
  Bridge-/Public-Artifact-Tests zeigen `.dreams/events.jsonl` nicht mehr an; sie
  verwenden den SQLite-gestützten virtuellen JSON-Artefaktnamen.
  Öffentliche SDK-/Codex-Testdokumentation spricht jetzt von SQLite-Sitzungszustand statt von Sitzungs-
  dateien, und das Channel-Turn-Beispiel legt kein Argument `storePath` mehr offen.
  Matrix-Sync-Zustand verwendet jetzt den SQLite-Plugin-State-Speicher direkt. Aktive
  Client-/Runtime-Verträge übergeben einen Konto-Speicher-Root, keinen Pfad `bot-storage.json`,
  und Doctor importiert das Legacy-`bot-storage.json` nach SQLite, bevor die
  Quelle gelöscht wird. QA-Matrix-Neustart-/destruktive Szenarien mutieren jetzt die SQLite-Sync-
  Zeile direkt, statt gefälschte `bot-storage.json`-Dateien zu erstellen oder zu löschen, und
  das E2EE-Substrat übergibt einen Sync-Store-Root statt eines gefälschten
  `sync-store.json`-Pfads.
  Die Matrix-Speicher-Root-Auswahl bewertet Roots nicht mehr nach Legacy-Sync-/Thread-JSON-
  Dateien; sie verwendet dauerhafte Root-Metadaten plus echten Crypto-State.
  Die Runtime-SQLite-Sitzungsbackend-Testsuite fabriziert keine
  `sessions.json` mehr; Legacy-Quell-Fixtures leben jetzt in den Doctor-
  Tests, die sie importieren.
  Gateway-Sitzungstests legen keinen Helper `createSessionStoreDir` und keine
  ungenutzte Einrichtung temporärer Sitzungsspeicherpfade mehr offen; Fixture-Verzeichnisse sind explizit, und direkte
  Zeileneinrichtung verwendet SQLite-Sitzungszeilennamen.
  Doctor-only-Abdeckung für JSON5-Sitzungsspeicherparser wurde aus Infra-Tests heraus
  und in Doctor-Migrationstests verschoben, sodass Runtime-Testsuites nicht mehr für Legacy-
  Sitzungsdatei-Parsing zuständig sind.
  Microsoft Teams-Runtime-SSO-/Pending-Upload-Tests führen keine JSON-Sidecar-
  Fixtures oder Parser mehr mit; Legacy-SSO-Token-Parsing lebt nur noch im Plugin-
  Migrationsmodul. Telegram-Tests seeden keine gefälschten `/tmp/*.json`-Store-
  Pfade mehr; sie setzen den SQLite-gestützten Nachrichten-Cache direkt zurück. Der generische
  OpenClaw-Test-State-Helper legt keinen Legacy-Writer für `auth-profiles.json`
  mehr offen; Doctor-Auth-Migrationstests besitzen diese Fixture lokal.
  Runtime-Tests für TUI-Zeiger auf letzte Sitzungen, Exec-Approvals, Active-Memory-
  Umschalter, Matrix-Dedupe-/Startup-Verifizierung, Memory-Wiki-Quellsynchronisierung,
  Current-Conversation-Bindungen, Onboarding-Auth und Hermes-Secret-Importe
  stellen keine alten Sidecar-Dateien mehr her und prüfen nicht mehr, dass alte Dateinamen fehlen. Sie
  belegen Verhalten über SQLite-Zeilen und öffentliche Store-APIs; Doctor-/Migrations-
  Tests sind der einzige Ort, an den Legacy-Quelldateinamen gehören.
  Runtime-Tests für Geräte-/Node-Pairing, Channel-`allowFrom`, Restart-Intents,
  Restart-Handoff, Sitzungs-Delivery-Queue-Einträge, Konfigurationszustand, iMessage-
  Caches, Cron-Jobs, PI-Transcript-Header, Subagent-Registries und verwaltete
  Bildanhänge erstellen ebenfalls keine ausgemusterten JSON-/JSONL-Dateien mehr, nur um
  zu belegen, dass sie ignoriert werden oder fehlen.
  PI-Overflow-Recovery hat keinen SessionManager-Rewrite-/Truncation-
  Fallback mehr: Tool-Result-Truncation und Context-Engine-Transcript-Rewrites mutieren
  SQLite-Transcript-Zeilen und aktualisieren dann den aktiven Prompt-Zustand aus der Datenbank.
  Persistierte SessionManager-Nachrichten-Appends delegieren für Parent-Auswahl und Idempotenz
  an den atomaren SQLite-Transcript-Append-Helper. Normale
  Metadaten-/Custom-Entry-Appends wählen den aktuellen Parent ebenfalls in SQLite aus, sodass
  veraltete Manager-Instanzen keine Parent-Chain-Rennen aus der Zeit vor SQLite wiederbeleben.
  Synthetische PI-Tail-Bereinigung für Mid-Turn-Prechecks und `sessions_yield` kürzt jetzt
  SQLite-Transcript-Zustand direkt; die alte SessionManager-Tail-Removal-
  Bridge und ihre Tests sind gelöscht.
  Compaction-Checkpoint-Erfassung erstellt ebenfalls nur noch Snapshots aus SQLite; Aufrufer
  übergeben keinen Live-SessionManager mehr als alternative Transcript-Quelle.
- Behalten Sie Tests, die Legacy-Dateien seeden, nur für Migration bei.
- JSON-Dateinachweise wurden für aktive Runtime-Oberflächen durch SQL-Zeilennachweise ersetzt.

- Fügen Sie statische Verbote für Runtime-Schreibvorgänge auf Legacy-Sitzungs-/Cache-JSON-Pfade hinzu.
  Erledigt für den Repo-Guard.

10. Den Migrationsbericht auditierbar machen.
    - Erfassen Sie Migrationsläufe in SQLite mit Start-/Endzeitstempeln, Quell-
      pfaden, Quell-Hashes, Zählwerten, Warnungen und Backup-Pfad.
      Erledigt: Legacy-State-Migrationausführungen persistieren jetzt einen `migration_runs`-
      Bericht mit Quellpfad-/Tabelleninventar, SHA-256 der Quelldatei, Größen,
      Datensatzanzahlen, Warnungen und Backup-Pfad.
      Erledigt: Legacy-State-Migrationausführungen persistieren außerdem `migration_sources`-
      Zeilen für quellenbezogenes Audit und künftige Skip-/Backfill-Entscheidungen.
    - Machen Sie Apply idempotent. Eine erneute Ausführung nach einem Teilimport sollte entweder
      eine bereits importierte Quelle überspringen oder per stabilem Schlüssel zusammenführen.
      Erledigt: Sitzungsindizes, Transcripts, Delivery Queues, Plugin-State, Task-
      Ledgers und agenteneigene globale SQLite-Zeilen importieren über stabile Schlüssel oder
      Upsert-/Replace-Semantik, sodass erneute Läufe zusammenführen, ohne dauerhafte
      Zeilen zu duplizieren.
    - Fehlgeschlagene Importe müssen die ursprüngliche Quelldatei an Ort und Stelle belassen.
      Erledigt: Fehlgeschlagene Transcript-Importe belassen die ursprüngliche JSONL-Quelle jetzt an
      ihrem erkannten Pfad, und `migration_sources` zeichnet die Quelle als
      `warning` mit `removed_source=0` für den nächsten Doctor-Lauf auf.

## Leistungsregeln

- Eine Verbindung pro Thread/Prozess ist in Ordnung; teilen Sie Handles nicht über
  Worker hinweg.
- Verwenden Sie WAL, `foreign_keys=ON`, ein Busy-Timeout von 30s und kurze `BEGIN IMMEDIATE`-
  Schreibtransaktionen.
- Halten Sie Hilfen für Schreibtransaktionen synchron, es sei denn, bis eine async-Transaktions-
  API explizite Mutex-/Backpressure-Semantik hinzufügt.
- Halten Sie Parent-Delivery-Schreibvorgänge klein und transaktional.
- Vermeiden Sie Rewrites ganzer Stores; verwenden Sie zeilenweises Upsert/Delete.
- Fügen Sie Indizes für List-by-Agent, List-by-Session, Updated-at, Run-ID und
  Ablaufpfade hinzu, bevor Hot Code verschoben wird.
- Speichern Sie große Artefakte, Medien und Vektoren als BLOBs oder gechunkte BLOB-Zeilen, nicht
  als base64 oder Numeric-Array-JSON.
- Halten Sie opake Plugin-State-Einträge klein und gescoped.
- Fügen Sie SQL-Cleanup für TTL/Ablauf statt Dateisystem-Pruning hinzu.
  Erledigt für datenbankeigene Runtime-Stores: Medien, Plugin-State, Plugin-Blobs,
  persistente Dedupe und Agent-Cache laufen alle über SQLite-Zeilen ab. Verbleibendes
  Dateisystem-Cleanup ist auf temporäre Materialisierungen oder explizite
  Entfernbefehle beschränkt.

## Statische Verbote

Fügen Sie einen Repo-Check hinzu, der neue Runtime-Schreibvorgänge auf Legacy-State-Pfade fehlschlagen lässt:

- `sessions.json`
- `*.trajectory.jsonl` außer materialisierten Support-Bundle-Ausgaben
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` Runtime-Cachedateien
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix-`credentials*.json` und `recovery-key.json`
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
- JSON-Dateien für Sandbox-Registry-Shards
- JSON-Dateien für native Hook-Relay-`/tmp`-Bridge
- `plugin-state/state.sqlite`
- ad-hoc-`openclaw-state.sqlite`-Runtime-Sidecars
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
- Browserprofil-Dekoration `.openclaw-profile-decorated`
- `SessionManager.open(...)` dateibasierte Session-Öffner
- `SessionManager.listAll(...)` und `TranscriptSessionManager.listAll(...)`
  Fassaden für Transkriptauflistung
- `SessionManager.forkFromSession(...)` und
  `TranscriptSessionManager.forkFromSession(...)` Fassaden für Transkript-Forks
- `SessionManager.newSession(...)` und `TranscriptSessionManager.newSession(...)`
  Fassaden zum Ersetzen veränderbarer Sessions
- `SessionManager.createBranchedSession(...)` und
  `TranscriptSessionManager.createBranchedSession(...)` Fassaden für Branch-Sessions

Das Verbot sollte Tests erlauben, Legacy-Fixtures zu erstellen, und Migrationscode erlauben,
Legacy-Dateiquellen zu lesen, zu importieren und zu entfernen. Nicht ausgelieferte SQLite-Sidecars bleiben verboten
und erhalten keine doctor-Importausnahmen.

## Erledigungskriterien

- Runtime-Daten und Cache-Schreibvorgänge gehen in die globale oder agentenbezogene SQLite-Datenbank.
- Die Runtime schreibt keine Session-Indizes, Transkript-JSONL, Sandbox-Registry-
  JSON, Task-Sidecar-SQLite oder Plugin-State-Sidecar-SQLite mehr. Die nicht ausgelieferten Task-
  und Plugin-State-Sidecar-SQLite-Importer werden gelöscht.
- Legacy-Dateiimport erfolgt nur über doctor.
- Backup erzeugt ein Archiv mit kompakten SQLite-Snapshots und Integritätsnachweis.
- Agent-Worker können mit Datenträger-, VFS-Scratch- oder experimentellem reinem VFS-
  Speicher laufen.
- Konfigurations- und explizite Anmeldedatendateien bleiben die einzigen erwarteten persistenten
  Steuerdateien außerhalb von Datenbanken.
- Repo-Prüfungen verhindern die Wiedereinführung von Legacy-Runtime-Dateispeichern.
