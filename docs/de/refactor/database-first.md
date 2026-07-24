---
read_when:
    - OpenClaw-Laufzeitdaten, Cache, Transkripte, Aufgabenstatus oder temporäre Dateien nach SQLite verschieben
    - Entwicklung von Doctor-Migrationen aus veralteten JSON- oder JSONL-Dateien
    - Ändern des Verhaltens von Sicherung, Wiederherstellung, VFS oder Worker-Speicher
    - Entfernen von Sitzungssperren, Bereinigung, Kürzung oder JSON-Kompatibilitätspfaden
summary: Migrationsplan, um SQLite zur primären dauerhaften Zustands- und Cache-Schicht zu machen, während die Konfiguration dateibasiert bleibt
title: Datenbankzentrierte Zustandsrefaktorierung
x-i18n:
    generated_at: "2026-07-24T04:04:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 47557804ab49074e9368d304bb8facf75e63a390c65891b8a41b4f2c79583b66
    source_path: refactor/database-first.md
    workflow: 16
---

# Datenbankzentriertes Zustands-Refactoring

## Entscheidung

Verwenden Sie eine zweistufige SQLite-Struktur:

- Globale Datenbank: `~/.openclaw/state/openclaw.sqlite`
- Agent-Datenbank: eine SQLite-Datenbank pro Agent für agenteneigene Arbeitsbereiche,
  Transkripte, VFS, Artefakte und umfangreiche agentenspezifische Laufzeitzustände
- Die Konfiguration bleibt dateibasiert: `openclaw.json` verbleibt außerhalb der
  Datenbank. Laufzeit-Authentifizierungsprofile werden nach SQLite verschoben; externe Provider- oder CLI-
  Anmeldedatendateien verbleiben eigentümerverwaltet außerhalb der OpenClaw-Datenbank.

Die globale Datenbank ist die Control-Plane-Datenbank. Sie verwaltet die Agent-Erkennung,
den gemeinsam genutzten Gateway-Zustand, Kopplungen, Geräte-/Node-Zustände, Aufgaben- und Ablaufprotokolle, Plugin-
Zustände, Scheduler-Laufzeitzustände, Sicherungsmetadaten und den Migrationszustand.

Die Agent-Datenbank ist die Data-Plane-Datenbank. Sie verwaltet die Sitzungsmetadaten
des Agenten, den Transkriptereignisstrom, den VFS-Arbeitsbereich oder Scratch-Namespace, Tool-
Artefakte, Ausführungsartefakte und durchsuchbare bzw. indexierbare agentenlokale Cache-Daten.

Dies ermöglicht eine dauerhafte globale Sicht, ohne umfangreiche Agent-Arbeitsbereiche,
Transkripte und binäre Scratch-Daten in die gemeinsam genutzte Schreibspur des Gateways zu zwingen.

## Verbindlicher Vertrag

Diese Migration hat genau eine kanonische Laufzeitstruktur:

- Sitzungszeilen speichern ausschließlich Sitzungsmetadaten. Sie dürfen weder
  `transcriptLocator` noch Transkriptdateipfade, zugehörige JSONL-Pfade, Sperrpfade,
  Bereinigungsmetadaten oder Kompatibilitätsverweise aus der Dateiära speichern.
- Die Transkriptidentität ist immer eine SQLite-Identität: `{agentId, sessionId}` sowie
  optionale Themenmetadaten, sofern das Protokoll diese benötigt.
- `sqlite-transcript://...` ist keine Laufzeit- oder Protokollidentität. Neuer Code darf
  Transkript-Locators weder ableiten noch speichern, übergeben, parsen oder migrieren. Laufzeit und
  Tests dürfen überhaupt keine Pseudo-Locators enthalten; Dokumentation darf die Zeichenfolge
  nur erwähnen, um sie zu verbieten.
- Veraltete `sessions.json`, Transkript-JSONL, `.jsonl.lock`, Bereinigung, Kürzung
  und alte Sitzungspfadlogik gehören ausschließlich in den Doctor-Migrations-/Importpfad.
- Veraltete Aliasse der Sitzungskonfiguration gehören ausschließlich in die Doctor-Migration. Die Laufzeit
  interpretiert weder `session.idleMinutes` noch `session.resetByType.dm` oder
  agentenübergreifende `agent:main:*`-Hauptsitzungsaliasse für einen anderen konfigurierten Agenten.
- Die Sitzungsroutingidentität ist typisierter relationaler Zustand. Häufig ausgeführte Laufzeit- und UI-Pfade
  sollten `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` und
  `session_conversations` lesen; sie dürfen `session_key` nicht parsen und
  `session_entries.entry_json` nicht nach der Provider-Identität durchsuchen, außer vorübergehend
  als Kompatibilitätsschatten, während alte Aufrufstellen entfernt werden.
- Direktnachrichtenmarkierungen auf Kanalebene wie `dm` gegenüber `direct` sind Routing-
  Vokabular, keine Transkript-Locators oder Kompatibilitäts-Handles für Dateispeicher.
- Veraltete Hook-Handler-Konfiguration gehört ausschließlich in Doctor-Warnungs-/Migrationsoberflächen.
  Die Laufzeit darf `hooks.internal.handlers` nicht laden; Hooks werden ausschließlich über erkannte
  Hook-Verzeichnisse und `HOOK.md`-Metadaten ausgeführt.
- Laufzeitstart, häufig ausgeführte Antwortpfade, Compaction, Zurücksetzung, Wiederherstellung, Diagnose,
  TTS, Speicher-Hooks, Subagenten, Plugin-Befehlsrouting, Protokollgrenzen und
  Hooks müssen `{agentId, sessionId}` durch die Laufzeit übergeben.
- Tests sollten SQLite-Transkriptzeilen über
  `{agentId, sessionId}` anlegen und prüfen. Tests, die lediglich die Weiterleitung von JSONL-Pfaden,
  den Erhalt aufruferbereitgestellter Locators oder die Transkriptdateikompatibilität belegen, sollten
  gelöscht werden, sofern sie nicht den Doctor-Import, die Materialisierung von Support-/Debug-
  Daten außerhalb von Sitzungen oder die Protokollstruktur abdecken.
- `runEmbeddedPiAgent(...)`, vorbereitete Worker-Ausführungen und der innere eingebettete
  Versuch dürfen keine Transkript-Locators akzeptieren. Sie öffnen den SQLite-Transkript-
  Manager anhand von `{agentId, sessionId}` und übergeben diesen Manager an die internalisierte
  PI-kompatible Agent-Sitzung, sodass veraltete Aufrufer den Runner nicht zum Schreiben
  von JSON-/JSONL-Transkripten veranlassen können.
- Runner-Diagnosen müssen Laufzeit-/Cache-/Payload-Ablaufverfolgungsdatensätze in SQLite speichern.
  Laufzeitdiagnosen dürfen keine Überschreibungsoptionen für JSONL-Dateien oder generische
  Transkript-JSONL-Exporthilfen bereitstellen; benutzerseitige Exporte können explizite
  Artefakte aus Datenbankzeilen materialisieren, ohne Dateinamen wieder in die Laufzeit einzuspeisen.
- Die Rohdatenstromprotokollierung verwendet `OPENCLAW_RAW_STREAM=1` sowie SQLite-Diagnosezeilen.
  Der alte pi-mono-Dateiprotokollierungsvertrag `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` und
  `raw-openai-completions.jsonl` ist nicht Teil der OpenClaw-
  Laufzeit oder ihrer Tests.
- Die QMD-Speicherindexierung darf SQLite-Transkripte nicht in Markdown-Dateien exportieren.
  QMD indexiert ausschließlich konfigurierte Speicherdateien; die Suche in Sitzungstranskripten bleibt
  SQLite-basiert.
- Der QMD-SDK-Unterpfad ist für neuen Code ausschließlich für QMD bestimmt. Hilfen zur Indexierung
  von SQLite-Sitzungstranskripten befinden sich unter `memory-core-host-engine-session-transcripts`; jeder
  QMD-Reexport dient ausschließlich der Kompatibilität und darf nicht von Laufzeitcode verwendet werden.
- Integrierte Speicherindizes befinden sich in der Datenbank des jeweiligen Agenten. Laufzeitkonfiguration und
  aufgelöste Laufzeitverträge dürfen `memorySearch.store.path` nicht bereitstellen; Doctor
  löscht diesen veralteten Konfigurationsschlüssel, und aktueller Code übergibt dem Agenten
  `databasePath` intern.

Bei der Implementierung sollte weiterhin Code gelöscht werden, bis diese Aussagen
ohne Ausnahmen außerhalb der Doctor-/Import-/Export-/Debug-Grenzen zutreffen.

## Zielzustand und Fortschritt

### Verbindliches Ziel

- Eine globale SQLite-Datenbank verwaltet den Control-Plane-Zustand:
  `state/openclaw.sqlite`.
- Eine SQLite-Datenbank pro Agent verwaltet den Data-Plane-Zustand:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Die Konfiguration bleibt dateibasiert. `openclaw.json` ist nicht Teil dieses Datenbank-
  Refactorings.
- Veraltete Dateien dienen ausschließlich als Eingaben für die Doctor-Migration.
- Die Laufzeit schreibt oder liest Sitzungs- oder Transkript-JSONL niemals als aktiven Zustand.

### Zielzustände

- `not-started`: Laufzeitcode aus der Dateiära schreibt weiterhin aktiven Zustand.
- `migrating`: Doctor-/Importcode kann Dateidaten nach SQLite verschieben.
- `dual-read`: Eine temporäre Brücke liest sowohl SQLite als auch veraltete Dateien. Dieser Zustand
  ist für dieses Refactoring verboten, sofern er nicht ausdrücklich als ausschließlich für Doctor
  bestimmt dokumentiert ist.
- `sqlite-runtime`: Die Laufzeit liest und schreibt ausschließlich SQLite.
- `clean`: Veraltete Laufzeit-APIs und Tests sind entfernt, und die Schutzprüfung verhindert
  Regressionen.
- `done`: Dokumentation, Tests, Sicherung, Doctor-Migration und Prüfungen der Änderungen belegen den
  bereinigten Zustand.

### Aktueller Zustand

- Sitzungen: `clean` für die Laufzeit. Sitzungszeilen befinden sich in der Datenbank pro Agent,
  Laufzeit-APIs verwenden `{agentId, sessionId}` oder `{agentId, sessionKey}`, und
  `sessions.json` ist eine veraltete Eingabe ausschließlich für Doctor.
- Transkripte: `clean` für die Laufzeit. Transkriptereignisse, Identitäten, Snapshots
  und Laufzeitereignisse von Trajektorien befinden sich in der Datenbank pro Agent. Die Laufzeit
  akzeptiert keine Transkript-Locators oder JSONL-Transkriptpfade mehr.
- Eingebetteter PI-Runner: `clean`. Eingebettete PI-Ausführungen, vorbereitete Worker, Compaction
  und Wiederholungsschleifen verwenden den SQLite-Sitzungsbereich und weisen veraltete Transkript-Handles zurück.
- Cron: `clean` für die Laufzeit. Die Laufzeit verwendet `cron_jobs` und Cron-eigene `task_runs`;
  Laufzeittests verwenden die SQLite-Namensgebung `storeKey`, und Cron-Pfade aus der Dateiära verbleiben
  ausschließlich in Tests zur veralteten Doctor-Migration.
- Aufgabenregister: `clean`. Laufzeitzeilen für Aufgaben und Task Flow befinden sich in
  `state/openclaw.sqlite`; nicht ausgelieferte SQLite-Importer für Sidecars sind gelöscht.
- Plugin-Zustand: `clean`. Zeilen für Plugin-Zustände/-Blobs befinden sich in der gemeinsam genutzten globalen
  Datenbank; Schutzprüfungen verhindern die Verwendung alter SQLite-Hilfen für Plugin-Zustands-Sidecars.
- Speicher: `sqlite-runtime` für den integrierten Speicher und die Indexierung von Sitzungstranskripten.
  Speicherindextabellen befinden sich in der Datenbank pro Agent, Plugin-Speicherzustände verwenden
  gemeinsam genutzte Plugin-Zustandszeilen, und veraltete Speicherdateien sind Eingaben für die Doctor-Migration
  oder Inhalte des Benutzerarbeitsbereichs.
- Sicherung: `sqlite-runtime`. Die Sicherung stellt kompaktierte SQLite-Snapshots bereit, lässt aktive
  WAL-/SHM-Sidecars aus, überprüft die SQLite-Integrität und zeichnet Sicherungsläufe in der
  globalen Datenbank auf.
- Arbeitsbereichseinrichtung: `sqlite-runtime`. Abschluss der Einrichtung, Arbeitsbereichsattestierungen
  und generierte Bootstrap-Hashes befinden sich in typisierten gemeinsam genutzten SQLite-Tabellen. Die Laufzeit
  liest oder schreibt weder die eingestellte Arbeitsbereichs-JSON noch `.attested`-Sidecars;
  Doctor verwaltet ihren validierten Import und ihre verifizierte Entfernung.
- Doctor-Migration: `migrating`, absichtlich. Doctor importiert veraltete JSON-,
  JSONL- und eingestellte Sidecar-Speicher nach SQLite, zeichnet Migrationsläufe/-quellen auf
  und entfernt erfolgreich importierte Quellen.
- Ausführungsgenehmigungen: `file-runtime`. TypeScript und macOS lesen und schreiben weiterhin
  `exec-approvals.json` im Verzeichnis für den aktiven Zustand; das reservierte
  Schema `exec_approvals_config` hat noch keinen Laufzeiteigentümer. Eine zukünftige Umstellung muss
  einen Doctor-Import im selben Zustand hinzufügen und beide Laufzeiten gemeinsam migrieren.
- E2E-Skripte: `clean` für die Laufzeitabdeckung. Docker-MCP-Seeding schreibt SQLite-
  Zeilen. Das Docker-Laufzeitkontextskript erstellt veraltetes JSONL ausschließlich innerhalb des
  Doctor-Migrations-Seeds und benennt den Pfad des veralteten Sitzungsindex ausdrücklich.

### Verbleibende Arbeiten

- [x] Cron-Speichervariablen in Laufzeittests umbenennen, sodass sie nicht mehr `storePath` verwenden, sofern
      sie keine veralteten Doctor-Eingaben sind.
      Dateien: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Nachweis: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Veraltete Export-Test-Mocks aus der Dateiära entfernen oder umbenennen.
      Datei: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Nachweis: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Den veralteten JSONL-Seed des Docker-Laufzeitkontexts eindeutig als ausschließlich für Doctor bestimmt kennzeichnen.
      Datei: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Nachweis: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` zeigt ausschließlich
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Nach jeder Schemaänderung die generierten Kysely-Typen synchron halten.
      Dateien: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Nachweis: keine Schemaänderung in diesem Durchlauf; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Fokussierte Tests für geänderte Speicher, Befehle und Skripte erneut ausführen.
      Nachweis: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-session.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Vor der Feststellung von `done` die Änderungsprüfung oder einen umfassenden Remote-Nachweis ausführen.
      Nachweis: `pnpm check:changed --timed -- <changed extension paths>` wurde beim
      Hetzner-Crabbox-Lauf `run_3f1cabf6b25c` nach einer temporären Node-24-/pnpm-Einrichtung und
      explizitem Pfadrouting für den synchronisierten Arbeitsbereich ohne `.git` erfolgreich abgeschlossen.

### Keine Regressionen zulassen

- Keine Transkript-Locators.
- Keine aktiven Sitzungsdateien.
- Keine fingierten JSONL-Test-Fixtures außer in Tests zur veralteten Doctor-Migration.
- Kein direkter SQLite-Zugriff, wenn Kysely erwartet wird.
- Keine neuen Datenbankmigrationen aus der Dateiära. Das globale Schema verbleibt bei Version `1`.
  Das ausgelieferte Schema der Version `1` pro Agent verfügt über genau eine begrenzte Laufzeitmigration auf
  Version `2` für stabile Speicherquellenidentitäten.

## Annahmen auf Grundlage der Codeanalyse

Keine nachgelagerten Produktentscheidungen blockieren diesen Plan. Die Implementierung sollte
unter folgenden Annahmen fortgesetzt werden:

- Verwenden Sie `node:sqlite` direkt und setzen Sie für diesen Speicherpfad eine Node-Laufzeit voraus, die ein sicheres Zurücksetzen des WAL unterstützt
  (22.22.3+, 24.15+ oder 25.9+).
- Behalten Sie genau eine normale Konfigurationsdatei bei. Verschieben Sie bei diesem Refactoring weder die Konfiguration noch Plugin-
  Manifeste oder Git-Arbeitsbereiche nach SQLite.
- Kompatibilitätsdateien für die Laufzeit sind nicht erforderlich. Ältere JSON- und JSONL-Dateien dienen
  ausschließlich als Migrationseingaben. Die branch-lokalen SQLite-Begleitdateien wurden nie ausgeliefert und werden
  gelöscht, statt importiert zu werden.
- `openclaw doctor --fix` ist für die Migration älterer Dateien in die Datenbank zuständig. Der Start der Laufzeit
  ist ausschließlich für begrenzte Upgrades zwischen ausgelieferten SQLite-Schemaversionen zuständig;
  dabei darf kein Zustand aus der Dateiära importiert werden.
- Für die Kompatibilität von Anmeldedaten gilt dieselbe Regel: Laufzeitanmeldedaten befinden sich in
  SQLite. Alte `auth-profiles.json`-, agentenspezifische `auth.json`- und gemeinsam genutzte
  `credentials/oauth.json`-Dateien dienen dem Doctor als Migrationseingaben und werden
  nach dem Import entfernt.
- Der generierte Zustand des Modellkatalogs wird in der Datenbank gespeichert. Laufzeitcode darf
  `agents/<agentId>/agent/models.json` nicht schreiben; vorhandene `models.json`-Dateien sind ältere
  Doctor-Eingaben und werden nach dem Import in `agent_model_catalogs` entfernt.
- Die Laufzeit darf Transkript-Locators weder migrieren noch normalisieren oder überbrücken. Die aktive
  Transkriptidentität ist `{agentId, sessionId}` in SQLite. Dateipfade sind
  ausschließlich ältere Doctor-Eingaben, und `sqlite-transcript://...` muss aus
  Laufzeit-, Protokoll-, Hook- und Plugin-Oberflächen entfernt werden, statt als
  Boundary-Handle behandelt zu werden.
- SQLite-Transkriptlesevorgänge der Laufzeit führen keine Migrationen alter JSONL-Eintragsstrukturen aus und
  schreiben nicht aus Kompatibilitätsgründen ganze Transkripte neu. Die Normalisierung älterer Einträge verbleibt in
  expliziten Doctor-/Import-Dienstprogrammen. Der Doctor normalisiert ältere JSONL-Transkriptdateien,
  bevor er SQLite-Zeilen einfügt; aktuelle Laufzeitzeilen werden bereits
  im aktuellen Transkriptschema geschrieben. Der Trajektorien-/Sitzungsexport
  liest diese Zeilen unverändert und darf beim Export keine älteren Migrationen durchführen.
- Parser und Migrationshelfer für ältere Transkript-JSONL-Dateien sind ausschließlich für den Doctor bestimmt. Der Laufzeitcode
  für das Transkriptformat erstellt nur den aktuellen SQLite-Transkriptkontext; der Doctor
  ist für Upgrades alter JSONL-Einträge vor dem Einfügen der Zeilen zuständig.
- Der alte, von der Laufzeit verwaltete Streaming-Helfer für JSONL-Transkripte wurde gelöscht. Der Doctor-
  Importcode ist für explizite Lesevorgänge älterer Dateien zuständig; der Laufzeit-Sitzungsverlauf liest
  SQLite-Zeilen.
- Codex-App-Server-Bindings verwenden den OpenClaw-`sessionId` als kanonischen
  Schlüssel im Codex-Namensraum für den Plugin-Zustand. `sessionKey` enthält Metadaten für
  Routing und Anzeige und darf weder die dauerhafte Sitzungs-ID ersetzen noch
  die Identität der Transkriptdatei wiederherstellen.
- Kontext-Engines erhalten den aktuellen Laufzeitvertrag direkt. Die Registry
  darf Engines nicht mit Wiederholungs-Shims umhüllen, die `sessionKey`,
  `transcriptScope` oder `prompt` löschen; Engines, die die aktuellen
  datenbankorientierten Parameter nicht akzeptieren können, sollten deutlich fehlschlagen, statt überbrückt zu werden.
- Die Sicherungsausgabe sollte weiterhin aus einer einzigen Archivdatei bestehen. Datenbankinhalte sollten
  als kompakte SQLite-Snapshots in dieses Archiv aufgenommen werden, nicht als rohe Live-WAL-Begleitdateien.
- Die Transkriptsuche ist nützlich, aber für die erste datenbankorientierte
  Umstellung nicht erforderlich. Gestalten Sie das Schema so, dass FTS später hinzugefügt werden kann.
- Die Worker-Ausführung sollte über Einstellungen experimentell bleiben, während sich die Datenbank-
  grenze stabilisiert.

## Erkenntnisse aus der Codeanalyse

Der aktuelle Branch hat die Proof-of-Concept-Phase bereits hinter sich. Die gemeinsam genutzte
Datenbank ist vorhanden, Node-`node:sqlite` ist über einen kleinen Laufzeithelfer eingebunden und
frühere Speicher schreiben nun in `state/openclaw.sqlite` oder in die zuständige
`openclaw-agent.sqlite`-Datenbank.

Bei den verbleibenden Arbeiten geht es nicht um die Entscheidung für SQLite, sondern darum, die neue Grenze sauber zu halten
und alle kompatibilitätsorientierten Schnittstellen zu löschen, die noch der alten
Dateiwelt ähneln:

- Sitzungs-`storePath` ist weder eine Laufzeitidentität noch eine Test-Fixture-Struktur oder
  ein Feld der Statusnutzlast. Laufzeit- und Bridge-Tests enthalten den
  Vertragsnamen `storePath` nicht mehr; Doctor-/Migrationscode ist für dieses ältere Vokabular zuständig.
- Sitzungsschreibvorgänge durchlaufen nicht mehr die alte prozessinterne `store-writer.ts`-
  Warteschlange. SQLite-Patch-Schreibvorgänge werden außerhalb der Transaktion vorbereitet und verwenden anschließend eine kurze,
  synchrone Validierungs-/Anwendungstransaktion mit expliziter Konflikterkennung.
- Die Ermittlung älterer Pfade hat weiterhin gültige Migrationszwecke, aber Laufzeitcode sollte
  `sessions.json` und Transkript-JSONL-Dateien nicht länger als mögliche Schreibziele
  behandeln.
- Agenteneigene Tabellen befinden sich in agentenspezifischen SQLite-Datenbanken. Die globale Datenbank enthält
  Registry-/Control-Plane-Zeilen; die Transkriptidentität ist `{agentId, sessionId}` in
  den agentenspezifischen Transkriptzeilen. Laufzeitcode darf weder Transkriptdateipfade
  speichern noch Transkript-Locators migrieren.
- Der Doctor importiert bereits mehrere ältere Dateien. Die Bereinigung besteht darin, daraus eine
  einzige explizite Migrationsimplementierung zu machen, die der Doctor aufruft und die einen dauerhaften
  Migrationsbericht erstellt.

Keine weiteren Produktfragen blockieren die Implementierung.

## Aktuelle Codestruktur

Der Branch verfügt bereits über eine echte gemeinsam genutzte SQLite-Basis:

- Die Runtime-Mindestversion erfordert jetzt einen WAL-Reset-sicheren Node-Build: 22.22.3+,
  24.15+ oder 25.9+. `package.json`, die Runtime-Prüfung der CLI, die Installer-Standardwerte,
  die macOS-Runtime-Suche, CI und die öffentliche Installationsdokumentation stimmen nun überein.
- `src/state/openclaw-state-db.ts` öffnet `openclaw.sqlite`, aktiviert WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` und wendet
  das generierte Schemamodul an, das aus
  `src/state/openclaw-state-schema.sql` abgeleitet wurde.
- Kysely-Tabellentypen und Runtime-Schemamodule werden aus temporären
  SQLite-Datenbanken generiert, die anhand der versionierten `.sql`-Dateien erstellt werden; der Runtime-Code
  enthält keine kopierten Schemazeichenfolgen mehr für globale, agentenspezifische oder
  Proxy-Erfassungsdatenbanken.
- Runtime-Speicher leiten die Typen ausgewählter und eingefügter Zeilen aus diesen generierten
  Kysely-`DB`-Schnittstellen ab, statt SQLite-Zeilenstrukturen manuell nachzubilden. Rohes SQL
  bleibt auf die Schemaanwendung, Pragmas und ausschließlich für Migrationen verwendete DDL beschränkt.
- Das globale SQLite-Schema bleibt bei `user_version = 1`. Das agentenspezifische Schema
  hat Version `2`; seine Öffnungsroutine migriert den ausgelieferten Memory-Source-Schlüssel der Version `1`
  atomar zu einer stabilen ganzzahligen Identität. Der Import aus Dateien
  in die Datenbank verbleibt im Doctor-Code.
- Relationale Eigentümerschaft wird dort durchgesetzt, wo die Eigentumsgrenze kanonisch ist:
  Zeilen zur Quellmigration werden von `migration_runs` kaskadiert, der Task-Zustellungsstatus
  von `task_runs` und Zeilen zur Transkriptidentität
  von Transkriptereignissen.
- Zu den aktuellen gemeinsam genutzten Tabellen gehören `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `workspace_path_aliases`, `workspace_attestations`,
  `workspace_generated_bootstrap_hashes`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` und `backup_runs`.
- Beliebiger Plugin-eigener Zustand erhält keine Host-eigenen typisierten Tabellen. Installierte
  Plugins verwenden `plugin_state_entries` für versionierte JSON-Nutzdaten und
  `plugin_blob_entries` für Bytes, einschließlich Namespace-/Schlüsseleigentümerschaft, TTL-Bereinigung,
  Sicherung und Plugin-Migrationsdatensätzen. Host-eigener Plugin-Orchestrierungszustand kann
  weiterhin typisierte Tabellen besitzen, wenn der Host Eigentümer des Abfragevertrags ist, etwa
  `plugin_binding_approvals`.
- Plugin-Migrationen sind Datenmigrationen über Plugin-eigene Namespaces und keine
  Host-Schemamigrationen. Ein Plugin kann seine eigenen versionierten Zustands-/Blob-Einträge
  über einen Migrations-Provider migrieren, und der Host erfasst den Quell-/Ausführungsstatus im
  regulären Migrationsprotokoll. Neue Plugin-Installationen erfordern keine Änderung von
  `openclaw-state-schema.sql`, sofern nicht der Host selbst die Eigentümerschaft für einen
  neuen Plugin-übergreifenden Vertrag übernimmt.
- `src/state/openclaw-agent-db.ts` öffnet
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registriert die Datenbank in der
  globalen DB und ist für agentenlokale Sitzungs-, Transkript-, VFS-, Artefakt-, Cache-
  und Speicherindextabellen zuständig. Die gemeinsame Runtime-Erkennung liest jetzt die generiert typisierte
  `agent_databases`-Registry, statt diese Abfrage an jeder Aufrufstelle
  erneut zu implementieren.
- Globale und agentenspezifische Datenbanken erfassen eine `schema_meta`-Zeile mit Datenbankrolle,
  Schemaversion, Zeitstempeln und Agenten-ID bei Agentendatenbanken. Die globale DB
  bleibt bei `user_version = 1`; agentenspezifische DBs verwenden nach der begrenzten
  Migration der Memory-Source-Identität Version `2`.
- Die agentenspezifische Sitzungsidentität besitzt jetzt eine kanonische `sessions`-Stammtabelle mit
  `session_id` als Schlüssel sowie `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, Zeitstempeln, Anzeigefeldern, Modellmetadaten,
  Harness-ID und Eltern-/Erzeugungsverknüpfung als abfragbaren Spalten. `session_routes`
  ist der eindeutige aktive Routenindex von `session_key` zur aktuellen
  `session_id`, sodass ein Routenschlüssel zu einer neuen dauerhaften Sitzung wechseln kann, ohne
  dass Hot Reads zwischen doppelten `sessions.session_key`-Zeilen wählen müssen. Die alte
  kompatibilitätsgeformte `session_entries.entry_json`-Nutzlast hängt per Fremdschlüssel an der
  dauerhaften `session_id`-Wurzel; sie ist nicht mehr die einzige
  Darstellung einer Sitzung auf Schemaebene.
- Die agentenspezifische externe Konversationsidentität ist ebenfalls relational:
  `conversations` speichert die normalisierte Provider-/Konto-/Konversationsidentität und
  `session_conversations` verknüpft eine OpenClaw-Sitzung mit einer oder mehreren externen
  Konversationen. Dies deckt gemeinsam genutzte Haupt-DM-Sitzungen ab, bei denen mehrere Gegenstellen
  absichtlich derselben Sitzung zugeordnet werden können, ohne falsche Angaben in `session_key` zu hinterlegen. SQLite
  erzwingt außerdem die Eindeutigkeit der natürlichen Provider-Identität, sodass dasselbe
  Kanal-/Konto-/Art-/Gegenstellen-/Thread-Tupel nicht auf mehrere Konversations-IDs aufgeteilt werden kann.
  Direkte Gegenstellen der gemeinsam genutzten Hauptsitzung werden mit der Rolle `participant` verknüpft, sodass eine
  OpenClaw-Sitzung mehrere externe DM-Gegenstellen darstellen kann, ohne
  ältere Gegenstellen zu unspezifischen zugehörigen Zeilen herabzustufen. `sessions.primary_conversation_id`
  verweist weiterhin auf das aktuelle typisierte Zustellungsziel. Geschlossene Routing-/Statusspalten
  werden mit SQLite-`CHECK`-Beschränkungen durchgesetzt, statt sich ausschließlich auf
  TypeScript-Unions zu verlassen.
  Die Runtime-Sitzungsprojektion entfernt Routing-Schattenfelder zur Kompatibilität aus
  `session_entries.entry_json`, bevor typisierte Sitzungs-/Konversationsspalten
  angewendet werden, sodass veraltete JSON-Nutzdaten keine Zustellungsziele reaktivieren können.
  Das Ankündigungs-Routing von Subagenten erfordert ebenfalls den typisierten SQLite-Zustellungskontext;
  es greift nicht mehr auf kompatibilitätsbezogene `SessionEntry`-Routenfelder zurück.
  Die explizite Zustellungsvererbung von Gateway-`chat.send` liest den typisierten SQLite-
  Zustellungskontext statt der Kompatibilitätsfelder `origin`/`last*`.
  `tools.effective` leitet den Provider-/Konto-/Thread-Kontext ebenfalls aus typisierten
  SQLite-Zustellungs-/Routingzeilen ab und nicht aus veralteten Schattenfeldern des Sitzungseintrags `last*`.
  Der Prompt-Kontext für Systemereignisse rekonstruiert Kanal-/Ziel-/Konto-/Thread-Felder aus
  typisierten Zustellungsfeldern statt aus `origin`-Schattenfeldern.
  Der gemeinsam genutzte `deliveryContextFromSession`-Helper und die Zuordnung von Sitzungen zu Konversationen
  ignorieren `SessionEntry.origin` jetzt vollständig; nur typisierte Zustellungsfelder
  und relationale Konversationszeilen können eine Identität für Hot Routing erzeugen.
  Die Normalisierung von Runtime-Sitzungseinträgen entfernt `origin`, bevor
  `entry_json` gespeichert oder projiziert wird, und eingehende Metadaten schreiben typisierte Kanal-/Chat-
  Felder sowie relationale Konversationszeilen, statt neue Ursprungsschattenfelder
  zu erzeugen.
- Transkriptereignisse, Transkript-Snapshots und Trajektorien-Runtime-Ereignisse
  referenzieren jetzt die kanonische agentenspezifische `sessions`-Wurzel und werden beim Löschen einer Sitzung
  kaskadiert. Zeilen für Transkriptidentität/-idempotenz werden weiterhin von der
  exakten Transkriptereigniszeile kaskadiert.
- Memory-Core-Indizes verwenden jetzt die expliziten Agentendatenbanktabellen
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` und
  `memory_embedding_cache`, wobei `memory_index_state` Revisionsänderungen nachverfolgt.
  Optionale FTS-/Vektor-Nebenindizes heißen `memory_index_chunks_fts` und
  `memory_index_chunks_vec` statt der generischen Tabellen `meta`, `files`, `chunks`,
  `chunks_fts` oder `chunks_vec`. Die kanonischen Namen behalten die aktuelle
  Pfad-/Quellzeilenstruktur und die Kompatibilität serialisierter Einbettungen bei. Diese Tabellen
  sind abgeleitete Such-Caches und kein kanonischer Transkriptspeicher; sie können
  gelöscht und aus Memory-Workspace-Dateien und konfigurierten Quellen neu aufgebaut werden.
  Beim Öffnen eines ausgelieferten Memory-Index mit generischen Namen werden dessen Metadaten, Quellen,
  Chunks und Einbettungs-Cache in die kanonischen Tabellen migriert; abgeleitete FTS-/Vektor-
  Tabellen werden unter ihren kanonischen Namen neu aufgebaut.
- Der Wiederherstellungszustand von Subagent-Ausführungen befindet sich jetzt in typisierten gemeinsam genutzten `subagent_runs`-Zeilen
  mit indizierten Sitzungsschlüsseln für untergeordnete Sitzung, Anforderer und Controller. Die alte
  `subagents/runs.json`-Datei dient nur als Eingabe für die Doctor-Bereinigung. Ihre Ausführungseinträge sind
  vorübergehender Wiederherstellungszustand, daher erfasst Doctor den Stilllegungsbeleg und
  verwirft die Datei, ohne sie zu importieren. Da eine Datei nach dem Bereinigen von SQLite-Zeilen
  nicht belegen kann, ob ihre Einträge aktiv oder veraltet sind, müssen Betreiber
  aktive Ausführungen aus der Dateiära abschließen lassen, bevor sie über diese Grenze hinweg aktualisieren.
- Aktuelle Konversationsbindungen befinden sich jetzt in typisierten gemeinsam genutzten
  `current_conversation_bindings`-Zeilen mit der normalisierten Konversations-ID als Schlüssel und
  Zielagenten-/Sitzungsspalten, Konversationsart, Status, Ablaufzeit und Metadaten,
  die als relationale Spalten statt als duplizierter undurchsichtiger Bindungsdatensatz gespeichert werden.
  Der dauerhafte Bindungsschlüssel enthält die normalisierte Konversationsart, sodass
  Direkt-/Gruppen-/Kanalreferenzen nicht kollidieren können, und SQLite weist ungültige Werte für Bindungsart
  und -status zurück. Die alte
  `bindings/current-conversations.json`-Datei dient nur als Eingabe für die Doctor-Migration.
- Die Wiederherstellung der Zustellungswarteschlange legt jetzt typisierte Warteschlangenspalten für Kanal, Ziel,
  Konto, Sitzung, Wiederholungsversuch, Fehler, Plattformversand und Wiederherstellungszustand über das
  Replay-JSON. `entry_json` behält die Replay-Nutzdaten, Hooks und Formatierungs-
  nutzdaten bei, aber typisierte Spalten sind für das Hot Routing und den Status der Warteschlange maßgeblich.
- Zeiger zur Wiederherstellung der letzten TUI-Sitzung befinden sich jetzt in typisierten gemeinsam genutzten
  `tui_last_sessions`-Zeilen mit dem gehashten TUI-Verbindungs-/Sitzungsbereich als Schlüssel.
  Die Runtime liest und schreibt ausschließlich SQLite, führt für jeden Bereich ein atomares Upsert durch und
  schließt Heartbeat-Sitzungen aus. `openclaw doctor --fix` validiert die
  alte TUI-JSON-Datei strikt, behält neuere SQLite-Zeilen bei, überprüft das kanonische Ergebnis
  und entfernt die unveränderte Legacy-Datei, statt ein Archiv zu hinterlassen.
- Hashes für die Bereitstellung von Discord-Befehlen befinden sich jetzt im gemeinsam genutzten SQLite-
  Speicher für Plugin-Zustand. Die Runtime liest und schreibt ausschließlich exakte anwendungsbezogene Schlüssel. Doctor
  löscht die neu erstellbare Legacy-Datei `discord/command-deploy-cache.json`,
  ohne sie zu importieren, sodass beim nächsten Start ein einmaliger kanonischer Abgleich erfolgt.
- Standardmäßige TTS-Einstellungen befinden sich jetzt in gemeinsam genutzten SQLite-Zeilen für Plugin-Zustand unter dem
  Plugin `speech-core`. Die alte Datei `settings/tts.json` dient nur als Eingabe für die Doctor-Migration;
  die Runtime liest oder schreibt keine JSON-Dateien mit TTS-Einstellungen mehr, und die
  Auflösung des Legacy-Pfads befindet sich im Doctor-Migrationsmodul.
- Metadaten zu Secret-Zielen beziehen sich jetzt auf Speicher, statt vorzugeben, dass jedes
  Anmeldedatenziel eine Konfigurationsdatei sei. `openclaw.json` bleibt der Konfigurationsspeicher;
  Authentifizierungsprofilziele verwenden typisierte SQLite-`auth_profile_stores`-Zeilen, wobei
  Provider-spezifische Anmeldedaten als JSON-Nutzdaten gespeichert werden.
- Das Secret-Audit durchsucht die stillgelegten agentenspezifischen `auth.json`-Dateien nicht mehr. Doctor ist
  für die Warnung vor dieser Legacy-Datei sowie für ihren Import und ihre Entfernung zuständig.
- Legacy-Pfad-Helper für Authentifizierungsprofile befinden sich jetzt im Doctor-Legacy-Code. Zentrale
  Pfad-Helper für Authentifizierungsprofile stellen die SQLite-Authentifizierungsspeicheridentität und Anzeigeorte bereit,
  nicht die Runtime-Pfade `auth-profiles.json` oder `auth-state.json`.
- Die Runtime-Module zur Wiederherstellung von Subagent-Ausführungen und zum Cache der OpenRouter-Modellfähigkeiten
  trennen jetzt SQLite-Snapshot-Lese-/Schreiboperationen von ausschließlich für Doctor vorgesehenen Legacy-JSON-
  Import-Helpern. OpenRouter-Fähigkeiten verwenden die typisierten generischen
  `model_capability_cache`-Zeilen unter `provider_id = "openrouter"` statt
  eines einzelnen undurchsichtigen Cache-Blobs oder einer Provider-spezifischen Host-Tabelle. Der
  `taskName`-Wert einer Subagent-Ausführung wird in der typisierten Spalte `subagent_runs.task_name` gespeichert; die
  Kopie in `payload_json` sind Replay-/Debug-Daten und nicht die Quelle für häufig verwendete Anzeige-
  oder Suchfelder.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementiert ein SQLite-VFS
  über der Agentendatenbanktabelle `vfs_entries`. Verzeichnislesevorgänge, rekursive
  Exporte, Löschungen und Umbenennungen verwenden indizierte `(namespace, path)`-Präfixbereiche,
  statt einen gesamten Namespace zu durchsuchen oder sich auf die Pfadübereinstimmung von `LIKE` zu verlassen.
- `src/agents/runtime-worker.entry.ts` erstellt für jeden Lauf SQLite-VFS-, Tool-Artefakt-, Laufartefakt- und bereichsgebundene Cache-Speicher für Worker.
- Der Abschluss des Workspace-Bootstrappings, die Aktualität der Attestierung und die generierten Bootstrap-Hashes befinden sich jetzt in typisierten gemeinsam genutzten `workspace_setup_state`-, `workspace_path_aliases`-, `workspace_attestations`- und `workspace_generated_bootstrap_hashes`-Zeilen, deren Schlüssel die kanonische Workspace-Identität ist. Persistierte lexikalische und Realpfad-Aliasse gewährleisten auch nach dem Verschwinden eines konfigurierten Symlinks einen stabilen Schutz vor verschwundenen Workspaces; neu ausgerichtete Aliasse führen zu einem geschlossenen Fehlschlag. Die Laufzeit liest oder schreibt `openclaw-workspace-state.json`, `.openclaw/workspace-state.json`, `workspace-attestations/*.attested` im Zustandsverzeichnis oder gleichgeordnete `<workspace>.attested`-Sidecars nicht mehr. `openclaw doctor --fix` validiert und beansprucht Legacy-Quellen, importiert sie mit Migrationsbelegen in SQLite, überprüft die kanonischen Zeilen und entfernt erst danach die beanspruchten Dateien.
- Das gemeinsam genutzte Schema reserviert eine `exec_approvals_config`-Singleton-Zeile, die Laufzeitumstellung steht jedoch noch aus. TypeScript und die macOS-Begleitanwendung verwenden weiterhin die zustandsbezogene JSON-Datei und müssen gemeinsam zu SQLite migriert werden.
- Die TypeScript-Geräteidentität verwendet jetzt typisierte `device_identities`-Zeilen, wobei der ausschließlich für Doctor bestimmte Import von Legacy-JSON außerhalb des Laufzeit-Owners verbleibt. Die Geräteauthentifizierung bleibt bis zu einer koordinierten Schema- und laufzeitübergreifenden Migration dateibasiert; `device_auth_tokens` bleibt für diese Folgearbeit reserviert.
- Der Cache für den GitHub-Copilot-Tokenaustausch verwendet die gemeinsam genutzte SQLite-Plugin-Zustandstabelle unter `github-copilot/token-cache/default`. Es handelt sich um Provider-eigenen Cache-Zustand, weshalb absichtlich keine Host-Schematabelle hinzugefügt wird.
- Die GitHub-Copilot-Compaction schreibt keine `openclaw-compaction-*.json`-Workspace-Sidecars mehr. Das Harness ruft den RPC zur SDK-Verlaufs-Compaction für die verfolgte SDK-Sitzung auf, und OpenClaw speichert dauerhafte Sitzungs-/Transkriptzustände in SQLite statt in Kompatibilitätsmarkierungsdateien.
- Die gemeinsam genutzte Swift-Laufzeit (`OpenClawKit`) verwendet für die Geräteidentität dieselbe `state/openclaw.sqlite#table/device_identities`-Struktur und dieselben Zeilenschlüssel. Legacy-Dateien in Apple-Containern werden vom Swift-Migrations-Owner importiert, da der TypeScript-Doctor nicht auf diese Container zugreifen kann. Die Swift-Geräteauthentifizierung bleibt bis zur koordinierten Authentifizierungs-Folgearbeit dateibasiert.
- Die Android-Geräteidentität und die zwischengespeicherte Geräteauthentifizierung bleiben anwendungslokale Speicher. Sie erfordern eine separate, Android-eigene Migration; die Host-SQLite-Ansprüche beschreiben nicht das aktuelle Android-Verhalten.
- Der Verlauf kürzlich verwendeter Pakete für Android-Benachrichtigungen verwendet typisierte `android_notification_recent_packages`-Zeilen. Die Laufzeit migriert oder liest die alten SharedPreferences-CSV-Schlüssel nicht mehr.
- Die Erstellung der Geräteidentität schlägt geschlossen fehl, wenn das Legacy-Element `identity/device.json` vorhanden ist, die SQLite-Identitätszeile ungültig ist oder der SQLite-Identitätsspeicher nicht geöffnet werden kann. Doctor importiert und entfernt diese Datei zuerst, sodass der Laufzeitstart die Kopplungsidentität vor der Migration nicht unbemerkt wechseln kann.
- Die Auswahl der Geräteidentität ist ein SQLite-Zeilenschlüssel und kein Locator für eine JSON-Datei. Tests und Gateway-Hilfsfunktionen übergeben explizite Identitätsschlüssel; nur die Doctor-Migration und die geschlossen fehlschlagende Startprüfung kennen den ausgemusterten Dateinamen `identity/device.json`.
- Die Kompatibilität beim Zurücksetzen von Sitzungen befindet sich jetzt in der Doctor-Konfigurationsmigration: `session.idleMinutes` wird nach `session.reset.idleMinutes` verschoben, `session.resetByType.dm` wird nach `session.resetByType.direct` verschoben, und die Laufzeitrichtlinie zum Zurücksetzen liest nur kanonische Zurücksetzungsschlüssel.
- Die Kompatibilität mit Legacy-Konfigurationen befindet sich jetzt unter `src/commands/doctor/`. Die normale `readConfigFileSnapshot()`-Validierung importiert keine Doctor-Detektoren für Legacy-Konfigurationen und versieht Legacy-Probleme nicht mit Anmerkungen; `runDoctorConfigPreflight()` fügt diese Probleme für die Doctor-Reparatur und -Berichterstattung hinzu. Der Doctor-Konfigurationsablauf importiert `src/commands/doctor/legacy-config.ts`, und die Reparatur alter OAuth-Profil-IDs befindet sich unter `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Befehle außerhalb von Doctor führen die Reparatur von Legacy-Konfigurationen nicht automatisch aus. Beispielsweise schlägt `openclaw update --channel` jetzt bei einer ungültigen Legacy-Konfiguration fehl und fordert die Person auf, Doctor auszuführen, statt unbemerkt Doctor-Migrationscode zu importieren.
- Web-Push, APNs, Voice Wake, Updateprüfungen und Konfigurationszustand verwenden jetzt typisierte gemeinsam genutzte SQLite-Tabellen für Abonnements, VAPID-Schlüssel, Node-Registrierungen, Triggerzeilen, Routingzeilen, den Zustand von Updatebenachrichtigungen und Einträge zum Konfigurationszustand statt vollständiger undurchsichtiger JSON-Blobs. Schreibvorgänge von Web Push und APNs führen nur für die betroffene Primärschlüsselzeile einen Upsert durch; der Konfigurationszustand wird anhand des Konfigurationspfads abgeglichen. Ihre Laufzeitmodule bleiben von den ausschließlich für Doctor bestimmten Hilfsfunktionen zum Import von Legacy-JSON getrennt.
- Die APNs-Laufzeit liest und schreibt ausschließlich `apns_registrations`. Das explizite `openclaw doctor --fix` importiert das ausgemusterte `push/apns-registrations.json` strikt, bewahrt vorhandene kanonische Zeilen, überprüft die Transaktion, zeichnet einen Beleg auf und entfernt die geheimnishaltige JSON-Datei. Beleggestützte Wiederholungsversuche führen ausschließlich die Bereinigung durch, während `apns_registration_tombstones` Invalidierungen vor der ersten Reparatur abdecken, sodass veraltete Relay-Berechtigungen oder Gerätetoken nicht wiederhergestellt werden können.
- Die Node-Host-Konfiguration verwendet jetzt eine typisierte Singleton-Zeile in der gemeinsam genutzten SQLite-Datenbank. Die Laufzeit schlägt geschlossen fehl, solange die alte Datei `node.json` oder ein unterbrochener Anspruch vorhanden ist; das explizite `openclaw doctor --fix` importiert und entfernt sie strikt vor der normalen Laufzeitverwendung.
- Geräte-/Node-Kopplung, Kanalkopplung, Kanal-Zulassungslisten und Bootstrap-Zustand verwenden jetzt typisierte SQLite-Zeilen statt vollständiger undurchsichtiger JSON-Blobs. Genehmigungen für Plugin-Bindungen und der Zustand von Cron-Aufträgen folgen derselben Aufteilung: Laufzeitmodule stellen SQLite-gestützte Operationen und neutrale Snapshot-Hilfsfunktionen bereit, und Snapshot-Schreibvorgänge für Kopplung/Bootstrap sowie Genehmigungen von Plugin-Bindungen gleichen Zeilen anhand des Primärschlüssels ab, statt Tabellen zu leeren, während Doctor die alten JSON-Dateien über `src/commands/doctor/legacy/*`-Module importiert und entfernt.
- Datensätze installierter Plugins befinden sich jetzt im SQLite-Index installierter Plugins. Das Lesen/Schreiben der Laufzeitkonfiguration migriert oder bewahrt alte, in `plugins.installs` erstellte Konfigurationsdaten nicht mehr; Doctor importiert diese Legacy-Konfigurationsstruktur vor der normalen Laufzeitverwendung in SQLite.
- Snapshots zur Wiederherstellung von QQBot-Anmeldedaten befinden sich jetzt im SQLite-Plugin-Zustand unter `qqbot/credential-backups`. Die Laufzeit schreibt `qqbot/data/credential-backup*.json` nicht mehr; der QQBot-Doctor-Vertrag importiert und archiviert diese Legacy-Sicherungsdateien aus dem aktiven Zustandsverzeichnis.
- Die Planung von Gateway-Neuladungen vergleicht Snapshots des SQLite-Index installierter Plugins unter einem internen `installedPluginIndex.installRecords.*`-Diff-Namensraum. Entscheidungen über Laufzeitneuladungen verpacken diese Zeilen nicht mehr in fingierte `plugins.installs`-Konfigurationsobjekte.
- Matrix-Kontoanmeldedaten befinden sich jetzt im SQLite-Plugin-Zustand. Die Laufzeit liest nur aus diesem kanonischen Speicher; Doctor importiert, überprüft und archiviert ausgemusterte `credentials/matrix/credentials*.json`-Dateien, wenn das zugehörige Konto aufgelöst werden kann.
- Die Kernlaufzeitmodule für Kopplung und Cron verwenden keine Legacy-JSON-Pfadgeneratoren mehr. Die veraltete SDK-Hilfsfunktion für Kopplungspfade bleibt als ausschließlich migrationsbezogene Kompatibilität erhalten; die Doctor-Zustandsmigration ist für ihre Dateilese- und Importvorgänge zuständig. Doctor-eigene Legacy-Module erstellen die Quellpfade `pending.json`, `paired.json`, `bootstrap.json` und `cron/jobs.json` ausschließlich für Importtests und Migrationen. Die Normalisierung von Legacy-Strukturen für Cron-Aufträge und der Import des JSONL-Verlaufs befinden sich unter `src/commands/doctor/cron/`; die Finalisierung des Legacy-SQLite-Verlaufs erfolgt beim Öffnen der Zustandsdatenbank.
- `src/commands/doctor/legacy/runtime-state.ts` importiert Legacy-JSON-Zustandsdateien einschließlich der Node-Host-Konfiguration über Doctor in SQLite. Neue Importer für Legacy-Dateien verbleiben unter `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importiert Legacy-Transkripte aus `sessions.json` und `*.jsonl` direkt in SQLite und entfernt erfolgreich importierte Quellen. Stammverzeichnisbezogene Legacy-Transkripte werden nicht mehr über `agents/<agentId>/sessions/*.jsonl` bereitgestellt, und vor dem Import wird kein kanonisches JSONL-Ziel mehr erstellt.
- Doctor-Prüfungen der Zustandsintegrität durchsuchen keine Legacy-Sitzungsverzeichnisse mehr und bieten keine Löschung verwaister JSONL-Dateien mehr an. Legacy-Transkriptdateien dienen ausschließlich als Migrationseingaben, und der Migrationsschritt ist sowohl für den Import als auch für das Entfernen der Quelle zuständig.
- Der Import der Legacy-Sandbox-Registry befindet sich unter `src/commands/doctor/legacy/sandbox-registry.ts`; aktive Lese- und Schreibvorgänge der Sandbox-Registry verwenden weiterhin ausschließlich SQLite.
- Die Reparatur des Zustands und Imports von Legacy-Sitzungstranskripten befindet sich unter `src/commands/doctor/legacy/session-transcript-health.ts`; Laufzeit-Befehlsmodule enthalten keinen Code mehr zum Parsen von JSONL-Transkripten oder zum Reparieren aktiver Branches.

Highlights der abgeschlossenen Konsolidierungen/Löschungen:

- Der Plugin-Zustand verwendet jetzt die gemeinsam genutzte `state/openclaw.sqlite`-Datenbank. Der alte
  branch-lokale `plugin-state/state.sqlite`-Sidecar-Importer wurde entfernt, weil
  dieses SQLite-Layout nie veröffentlicht wurde. Prüf-/Test-Hilfsfunktionen melden die gemeinsam genutzte
  `databasePath`, statt einen Plugin-Zustands-spezifischen SQLite-Pfad offenzulegen.
- Die Laufzeittabellen für Aufgaben und TaskFlow befinden sich jetzt in der gemeinsam genutzten
  `state/openclaw.sqlite`-Datenbank statt in `tasks/runs.sqlite` und
  `tasks/flows/registry.sqlite`; die alten Sidecar-Importer wurden aus demselben Grund
  des nie veröffentlichten Layouts entfernt.
- `src/config/sessions/store.ts` benötigt `storePath` nicht mehr für eingehende
  Metadaten, Routenaktualisierungen oder Lesezugriffe auf den Aktualisierungszeitpunkt. Befehlspersistenz, Bereinigung von CLI-
  Sitzungen, Subagent-Tiefe, Authentifizierungsüberschreibungen und die Sitzungsidentität
  von Transkripten verwenden APIs für Agenten-/Sitzungszeilen. Schreibvorgänge werden als SQLite-Zeilen-Patches
  mit optimistischer Konfliktwiederholung angewendet.
- Die Auflösung von Sitzungszielen stellt jetzt Datenbankziele pro Agent bereit, nicht veraltete
  `sessions.json`-Pfade. Gemeinsam genutztes Gateway, ACP-Metadaten, Doctor-Routenreparatur und
  `openclaw sessions` führen `agent_databases` sowie konfigurierte Agenten auf.
- Das Gateway-Sitzungsrouting verwendet jetzt `resolveGatewaySessionDatabaseTarget`; das
  zurückgegebene Ziel enthält `databasePath` und mögliche SQLite-Zeilenschlüssel
  statt eines veralteten Dateipfads zum Sitzungsspeicher.
- Die Laufzeittypen für Kanalsitzungen stellen jetzt `{agentId, sessionKey}` für
  Lesezugriffe auf den Aktualisierungszeitpunkt, eingehende Metadaten und Aktualisierungen der letzten Route bereit. Der alte
  `saveSessionStore(storePath, store)`-Kompatibilitätstyp wurde entfernt.
- Die Sitzungsschnittstellen der Plugin-Laufzeit, Erweiterungs-API und des Plugin-SDK stellen jetzt
  SQLite-gestützte Hilfsfunktionen für Sitzungszeilen statt Kompatibilitätshilfen
  für den gesamten aktiven Sitzungsspeicher bzw. Dateien bereit. Kompatibilitätsexporte der Root-Bibliothek bleiben
  nur außerhalb des Plugin-SDK für veraltete interne Aufrufer und Migrationsaufrufer verfügbar. Die alte
  `resolveLegacySessionStorePath`-Hilfsfunktion wurde entfernt; die veraltete Konstruktion von
  `sessions.json`-Pfaden erfolgt jetzt lokal in Migrationen und Test-Fixtures.
- `src/config/sessions/session-entries.sqlite.ts` speichert kanonische Sitzungseinträge jetzt
  in der Datenbank des jeweiligen Agenten und unterstützt Lesen, Upsert, Löschen und Patchen
  auf Zeilenebene. Upsert-, Patch- und Löschvorgänge der Laufzeit suchen nicht mehr nach Varianten
  der Groß-/Kleinschreibung und bereinigen keine veralteten Aliasschlüssel mehr; Doctor übernimmt die Kanonisierung. Die
  eigenständige Hilfsfunktion für JSON-Importe wurde entfernt, und die Migration führt neuere Zeilen per Upsert zusammen,
  statt die gesamte Sitzungstabelle zu ersetzen. Öffentliche Hilfsfunktionen zum Lesen, Auflisten und Laden
  projizieren häufig benötigte Sitzungsmetadaten aus typisierten `sessions`- und `conversations`-Zeilen;
  `entry_json` ist ein Kompatibilitäts-/Debug-Schatten und kann veraltet oder ungültig sein,
  ohne dass typisierte Sitzungsidentität oder Zustellungskontext verloren gehen.
- `src/config/sessions/delivery-info.ts` löst den Zustellungskontext jetzt aus den
  typisierten agentenspezifischen Zeilen `sessions` + `conversations` + `session_conversations` auf.
  Die Laufzeit-Zustellungsidentität wird nicht mehr aus
  `session_entries.entry_json` rekonstruiert; eine fehlende typisierte Konversationszeile ist ein
  Migrations-/Reparaturproblem für Doctor und kein Laufzeit-Fallback.
- Entscheidungen zum Zurücksetzen gespeicherter Sitzungen bevorzugen jetzt typisierte Metadaten aus `sessions.session_scope`,
  `sessions.chat_type` und `sessions.channel`. Das Parsen von `sessionKey`
  bleibt nur für explizite Thread-/Themen-Suffixe an Befehlszielen bestehen; die Klassifizierung
  des Zurücksetzens als Gruppe oder Direktnachricht wird nicht mehr aus der Schlüsselform abgeleitet.
- Die Anzeigeklassifizierung von Sitzungsliste und -status verwendet jetzt typisierte Chat-Metadaten und
  die Gateway-Sitzungsart. Teilzeichenfolgen `:group:` oder `:channel:`
  innerhalb von `session_key` gelten nicht mehr als dauerhafte Wahrheit über Gruppen- oder Direktnachrichten.
- Die Auswahl der Richtlinie für stille Antworten verwendet jetzt ausschließlich den expliziten Konversationstyp oder
  Oberflächenmetadaten. Die Richtlinie für Direktnachrichten bzw. Gruppen wird nicht mehr anhand von
  `session_key`-Teilzeichenfolgen geschätzt.
- Die Modellauflösung für die Sitzungsanzeige erhält die Agenten-ID jetzt aus dem Ziel der SQLite-
  Sitzungsdatenbank, statt sie aus `session_key` herauszutrennen.
- Die Hydrierung des Ankündigungsziels von Agent zu Agent verwendet jetzt ausschließlich typisierte
  `sessions.list` `deliveryContext`. Kanal-/Konto-/Thread-Routing wird nicht mehr
  aus dem veralteten `origin`, gespiegelten `last*`-Feldern oder der Form von `session_key`
  wiederhergestellt.
- Die Ablehnung von `sessions_send`-Thread-Zielen liest jetzt typisierte SQLite-Routing-
  Metadaten. Ziele werden nicht mehr durch Parsen von Thread-Suffixen
  aus dem Zielschlüssel abgelehnt oder akzeptiert.
- Die Validierung von gruppenspezifischen Werkzeugrichtlinien liest jetzt das typisierte SQLite-Konversations-
  routing für die aktuelle oder erzeugte Sitzung. Der Gruppen-/Kanalidentität wird nicht mehr
  durch Dekodieren von `sessionKey` vertraut; vom Aufrufer bereitgestellte Gruppen-IDs werden verworfen, wenn
  keine typisierte Sitzungszeile sie bestätigt.
- Der Abgleich von Kanalmodellüberschreibungen verwendet jetzt explizite Metadaten
  der Gruppen- und übergeordneten Konversation. Übergeordnete Konversations-IDs werden nicht mehr aus
  `parentSessionKey` dekodiert.
- Die Vererbung gespeicherter Modellüberschreibungen erfordert jetzt einen expliziten Schlüssel der übergeordneten Sitzung
  aus dem typisierten Sitzungskontext. Übergeordnete Überschreibungen werden nicht mehr aus
  `:thread:`- oder `:topic:`-Suffixen in `sessionKey` abgeleitet.
- Der alte Wrapper für Sitzungs-Thread-Informationen und der Thread-Parser für geladene Plugins wurden entfernt;
  kein Laufzeitcode importiert `config/sessions/thread-info`.
- Die Hilfsfunktion für Kanalkonversationen stellt keine Parsing-Brücken
  für vollständige Sitzungsschlüssel mehr bereit. Der Kern normalisiert weiterhin Provider-eigene rohe Konversations-IDs über
  `resolveSessionConversation(...)`, rekonstruiert jedoch keine Routenfakten
  aus `sessionKey`.
- Abschlusszustellung, Senderichtlinie und Aufgabenwartung leiten den Chat-
  typ nicht mehr aus der Form von `session_key` ab. Der alte Chattyp-Schlüsselparser wurde gelöscht;
  diese Pfade erfordern typisierte Sitzungsmetadaten, typisierten Zustellungskontext oder
  ein explizites Vokabular für Zustellungsziele.
- Sitzungsliste/-status, Diagnose, Kontobindung für Genehmigungen, TUI-Heartbeat-
  Filterung und Nutzungszusammenfassungen durchsuchen `SessionEntry.origin` nicht mehr nach
  Provider-/Konto-/Thread-/Anzeige-Routing. Die einzigen verbleibenden Laufzeit-
  Lesezugriffe auf `origin` betreffen sitzungsfremde Konzepte oder Zustellungsobjekte des aktuellen Durchlaufs.
- Die native Konversationssuche für Genehmigungsanfragen liest jetzt typisierte agentenspezifische Sitzungs-
  Routingzeilen. Die Kanal-/Gruppen-/Thread-Konversationsidentität wird nicht mehr
  aus `sessionKey` geparst; fehlende typisierte Metadaten sind ein Migrations-/Reparaturproblem.
- Nutzdaten für Gateway-Ereignisse zu Sitzungsänderungen, Chats und Sitzungen spiegeln keine
  `SessionEntry.origin`- oder `last*`-Routenschatten mehr; Clients erhalten typisierte
  `channel`, `chatType` und `deliveryContext`.
- Die Auflösung der Heartbeat-Zustellung kann jetzt die typisierte SQLite-
  `deliveryContext` direkt empfangen, und die Heartbeat-Laufzeit übergibt die agentenspezifische
  Sitzungszustellungszeile, statt sich für das aktuelle Routing auf Kompatibilitäts-
  schatten von `session_entries` zu verlassen.
- Die Auflösung des Zustellungsziels für isolierte Cron-Agenten hydriert ihre aktuelle
  Route ebenfalls aus der typisierten agentenspezifischen Sitzungszustellungszeile, bevor auf die
  kompatible Eintragsnutzlast zurückgegriffen wird.
- Die Auflösung des Ursprungs von Subagent-Ankündigungen führt jetzt den typisierten Zustellungs-
  kontext der anfordernden Sitzung durch `loadRequesterSessionEntry` und bevorzugt diese Zeile gegenüber
  den Kompatibilitätsschatten `last*`/`deliveryContext`.
- Aktualisierungen eingehender Sitzungsmetadaten werden jetzt zuerst mit der typisierten agentenspezifischen
  Zustellungszeile zusammengeführt; alte `SessionEntry`-Zustellungsfelder dienen nur als Fallback,
  wenn keine typisierte Konversationszeile vorhanden ist.
- Bei der Extraktion der Zustellung für Neustart/Aktualisierung hat die typisierte SQLite-Zustellung
  `threadId` jetzt Vorrang vor Themen-/Thread-Fragmenten, die aus `sessionKey` geparst werden; das Parsen
  dient nur als Fallback für veraltete threadförmige Schlüssel.
- Kanal-IDs des Agentenkontexts für Hooks bevorzugen jetzt die typisierte SQLite-Konversationsidentität,
  danach explizite Nachrichtenmetadaten. Provider-/Gruppen-/Kanal-
  fragmente werden nicht mehr aus `sessionKey` geparst.
- Die Vererbung externer Routen durch Gateway `chat.send` liest jetzt typisierte SQLite-Sitzungs-
  Routingmetadaten, statt Kanal-/Direkt-/Gruppenumfang aus
  Bestandteilen von `sessionKey` abzuleiten. Kanalspezifische Sitzungen erben nur, wenn der typisierte
  Sitzungskanal und der Chattyp mit dem gespeicherten Zustellungskontext übereinstimmen; gemeinsam genutzte Haupt-
  sitzungen behalten ihre strengere Regel für CLI/fehlende Client-Metadaten.
- Aufwecken durch Neustart-Sentinel und Fortsetzungsrouting lesen jetzt typisierte SQLite-
  Zustellungs-/Routingzeilen, bevor Heartbeat-Aufweckvorgänge oder geroutete Fortsetzungen
  von Agentendurchläufen in die Warteschlange gestellt werden. Der Zustellungskontext wird nicht mehr aus dem
  JSON-Schatten des Sitzungseintrags rekonstruiert.
- Die Kontextauflösung von Gateway `tools.effective` liest jetzt typisierte SQLite-
  Zustellungs-/Routingzeilen für Provider-, Konto-, Ziel-, Thread- und Antwortmodus-
  Eingaben. Diese häufig benötigten Routingfelder werden nicht mehr aus veralteten
  `session_entries.entry_json`-Ursprungsschatten wiederhergestellt.
- Das Routing für Echtzeit-Sprachkonsultationen löst die Zustellung für übergeordnete Sitzung/Anruf jetzt aus typisierten
  agentenspezifischen SQLite-Sitzungszeilen auf. Bei der Auswahl der eingebetteten Agenten-
  Nachrichtenroute wird nicht mehr auf Kompatibilitätsschatten von `SessionEntry.deliveryContext`
  zurückgegriffen.
- ACP-Spawn-Heartbeat-Weiterleitung und das Routing des übergeordneten Streams lesen die übergeordnete Zustellung jetzt
  aus typisierten SQLite-Sitzungszeilen. Der Zustellungskontext der übergeordneten Sitzung wird nicht mehr
  aus Kompatibilitätsschatten von Sitzungseinträgen rekonstruiert.
- Die Beibehaltung der Sitzungszustellungsroute folgt jetzt typisierten Chat-Metadaten und
  persistenten Zustellungsspalten. Kanalhinweise, Direkt-/Haupt-
  marker oder Thread-Form werden nicht mehr aus `sessionKey` extrahiert; interne Webchat-Routen
  erben ein externes Ziel nur, wenn SQLite bereits über eine typisierte/persistierte Zustellungs-
  identität für die Sitzung verfügt.
- Die generische Extraktion der Sitzungszustellung liest nur noch die exakt passende typisierte SQLite-
  Sitzungszustellungszeile. Thread-/Themen-Suffixe werden nicht mehr geparst, und es wird
  nicht mehr von einem threadförmigen Schlüssel auf einen Basissitzungsschlüssel zurückgegriffen.
- Antwortweiterleitung, Wiederherstellung durch Neustart-Sentinel und Routing für Echtzeit-Sprachkonsultationen
  verwenden jetzt exakt passende typisierte SQLite-Sitzungs-/Konversationszeilen für das Thread-Routing. Thread-
  IDs oder der Zustellungskontext der Basissitzung werden nicht mehr durch Parsen
  threadförmiger Sitzungsschlüssel wiederhergestellt.
- Die Begrenzung des Verlaufs für eingebettetes PI verwendet jetzt die typisierte SQLite-Sitzungsrouting-
  projektion (`sessions` + primäres `conversations`) für Provider, Chattyp
  und Peer-Identität. Provider-, DM-, Gruppen- oder Thread-Form werden nicht mehr
  aus `sessionKey` geparst.
- Die Ableitung der Cron-Werkzeugzustellung verwendet jetzt nur die explizite Zustellung oder den aktuellen typisierten
  Zustellungskontext. Kanal-, Peer-, Konto- oder Thread-
  ziele werden nicht mehr aus `agentSessionKey` dekodiert.
- Laufzeit-Sitzungszeilen enthalten den alten Routenalias `lastProvider` nicht mehr.
  Hilfsfunktionen und Tests verwenden typisierte `lastChannel`- und `deliveryContext`-Felder;
  nur die Doctor-Migration sollte ältere Routenaliase
  oder persistente `origin`-Schatten übersetzen.
- Transkriptereignisse, VFS-Zeilen und Zeilen für Werkzeugartefakte werden jetzt in die agentenspezifische
  Datenbank geschrieben. Die nie veröffentlichte globale Zuordnungstabelle für Transkriptdateien wurde entfernt; Doctor
  zeichnet stattdessen veraltete Quellpfade in dauerhaften Migrationszeilen auf.
- Die Laufzeit-Transkriptsuche durchsucht keine JSONL-Byte-Offsets mehr und prüft keine veralteten
  Transkriptdateien. Gateway-Pfade für Chat/Medien/Verlauf lesen Transkriptzeilen aus
  SQLite; Sitzungs-JSONL dient jetzt nur noch als veraltete Eingabe für Doctor, nicht als Laufzeitzustand
  oder Exportformat.
- Übergeordnete und Verzweigungsbeziehungen von Transkripten verwenden strukturierte
  `parentTranscriptScope: {agentId, sessionId}`-Metadaten in SQLite-Transkript-
  headern statt pfadähnlicher `agent-db:...transcript_events...`-Locator-Zeichenfolgen.
- Der Vertrag des Transkriptmanagers stellt keine impliziten persistenten
  `create(cwd)`- oder `continueRecent(cwd)`-Konstruktoren mehr bereit. Persistente Transkript-
  manager werden mit einem expliziten `{agentId, sessionId}`-Geltungsbereich geöffnet; nur
  In-Memory-Manager bleiben für Tests und reine Transkripttransformationen ohne Scope.
- Runtime-Transkriptspeicher-APIs lösen den SQLite-Scope auf, keine Dateisystempfade. Der
  alte `resolve...ForPath`-Helper und die nicht verwendeten `transcriptPath`-Schreiboptionen sind
  aus Runtime-Aufrufern entfernt.
- Die Runtime-Sitzungsauflösung verwendet jetzt `{agentId, sessionId}` und darf keine
  `sqlite-transcript://<agent>/<session>`-Zeichenfolgen für externe Grenzen ableiten.
  Veraltete absolute JSONL-Pfade dienen ausschließlich als Eingaben für die Doctor-Migration.
- Direkt-Bridge-Datensätze der nativen Hook-Weiterleitung befinden sich jetzt in typisierten gemeinsamen
  `native_hook_relay_bridges`-Zeilen, die nach Weiterleitungs-ID indiziert sind. Die Runtime schreibt für diese kurzlebigen Bridge-
  Datensätze keine `/tmp`-JSON-Registry oder undurchsichtigen generischen Datensätze mehr.
- `runEmbeddedPiAgent(...)` besitzt keinen Transkript-Locator-Parameter mehr.
  Vorbereitete Worker-Deskriptoren enthalten ebenfalls keine Transkript-Locators mehr. Der Runtime-Sitzungs-
  zustand und in die Warteschlange gestellte Folgeläufe führen `{agentId, sessionId}` anstelle
  abgeleiteter Transkript-Handles mit.
- Die eingebettete Compaction übernimmt den SQLite-Scope jetzt aus `agentId` und `sessionId`.
  Compaction-Hooks, Context-Engine-Aufrufe, CLI-Delegierung und Protokollantworten
  dürfen keine abgeleiteten `sqlite-transcript://...`-Handles erhalten. Export-/Debug-Code
  kann explizite Benutzerartefakte aus Zeilen materialisieren, stellt jedoch keinen
  generischen JSONL-Exportpfad für Sitzungen bereit und führt Dateinamen nicht wieder
  in die Runtime-Identität ein.
- `/export-session` liest Transkriptzeilen aus SQLite und schreibt ausschließlich die angeforderte
  eigenständige HTML-Ansicht. Der eingebettete Viewer rekonstruiert oder
  lädt Sitzungs-JSONL nicht mehr aus diesen Zeilen herunter.
- Die Context-Engine-Delegierung analysiert keinen Transkript-Locator mehr, um die
  Agentenidentität wiederherzustellen. Der vorbereitete Runtime-Kontext übergibt den aufgelösten `agentId`
  an den integrierten Compaction-Adapter.
- Das Umschreiben von Transkripten und die Live-Kürzung von Tool-Ergebnissen lesen und speichern
  den Transkriptzustand jetzt anhand von `{agentId, sessionId}` und leiten keine temporären
  Locators für Ereignis-Payloads von Transkriptaktualisierungen ab.
- Die Oberfläche der Transkriptzustands-Helper besitzt keine Locator-basierten
  Varianten `readTranscriptState`, `replaceTranscriptStateEvents` oder
  `persistTranscriptStateMutation` mehr. Runtime-Aufrufer müssen die
  `{agentId, sessionId}`-APIs verwenden. Der Doctor-Import liest veraltete Dateien über einen expliziten Datei-
  pfad und schreibt SQLite-Zeilen; Locator-Zeichenfolgen werden nicht migriert.
- Der Runtime-Sitzungsmanager-Vertrag stellt `open(locator)`,
  `forkFrom(locator)` oder `setTranscriptLocator(...)` nicht mehr bereit. Persistierte Sitzungs-
  manager werden ausschließlich über `{agentId, sessionId}` geöffnet; Listen-/Fork-Helper befinden sich
  auf zeilenorientierten Sitzungs- und Checkpoint-APIs statt auf der Fassade des Transkript-
  managers.
- Gateway-Transkriptleser-APIs sind Scope-first. Sie übernehmen
  `{agentId, sessionId}` und akzeptieren keinen positionellen Transkript-Locator, der
  versehentlich zur Runtime-Identität werden könnte. Die aktive Analyse von Transkript-Locators
  wurde entfernt; veraltete Quellpfade werden ausschließlich vom Doctor-Importcode gelesen.
- Auch Transkriptaktualisierungsereignisse sind Scope-first. `emitSessionTranscriptUpdate`
  akzeptiert keine bloße Locator-Zeichenfolge mehr, und Listener leiten anhand von
  `{agentId, sessionId}` weiter, ohne ein Handle zu analysieren.
- Der Gateway-Broadcast von Sitzungsnachrichten löst Sitzungsschlüssel aus dem Agenten-/Sitzungs-
  Scope auf, nicht aus einem Transkript-Locator. Der alte Resolver/Cache für die Zuordnung von Transkript-Locators zu Sitzungs-
  schlüsseln wurde entfernt.
- Die SSE-Filter des Gateway-Sitzungsverlaufs filtern Live-Aktualisierungen nach Agenten-/Sitzungs-Scope. Sie
  kanonisieren keine Transkript-Locator-Kandidaten, Realpaths oder dateiförmigen
  Transkriptidentitäten mehr, um zu entscheiden, ob ein Stream eine Aktualisierung erhalten soll.
- Sitzungslebenszyklus-Hooks leiten keine Transkript-Locators mehr für
  `session_end` ab und stellen sie nicht mehr bereit. Hook-Konsumenten erhalten `sessionId`, `sessionKey`, IDs der nächsten Sitzung
  und Agentenkontext; Transkriptdateien sind nicht Teil des Lebenszyklus-
  vertrags.
- Reset-Hooks leiten ebenfalls keine Transkript-Locators mehr ab und stellen sie nicht mehr bereit. Der
  `before_reset`-Payload enthält wiederhergestellte SQLite-Nachrichten sowie den Reset-
  Grund, während die Sitzungsidentität im Hook-Kontext verbleibt.
- Der Reset des Agenten-Harness akzeptiert keinen Transkript-Locator mehr. Die Reset-Weiterleitung ist
  anhand von `sessionId`/`sessionKey` sowie dem Grund begrenzt.
- Sitzungstypen von Agentenerweiterungen stellen `transcriptLocator` nicht mehr bereit; Erweiterungen
  sollten Sitzungskontext und Runtime-APIs verwenden, statt auf eine
  dateiförmige Transkriptidentität zuzugreifen.
- Plugin-Compaction-Hooks stellen keine Transkript-Locators mehr bereit. Der Hook-Kontext
  enthält bereits die Sitzungsidentität, und Transkripte müssen über SQLite-
  Scope-fähige APIs statt über dateiförmige Handles gelesen werden.
- `before_agent_finalize`-Hooks stellen `transcriptPath` nicht mehr bereit, einschließlich
  der Payloads nativer Hook-Weiterleitungen. Finalisierungs-Hooks verwenden ausschließlich den Sitzungskontext.
- Gateway-Reset-Antworten synthetisieren keinen Transkript-Locator mehr für den
  zurückgegebenen Eintrag. Der Reset erstellt SQLite-Transkriptzeilen, gibt den bereinigten
  Sitzungseintrag zurück und überlässt den Transkriptzugriff Scope-fähigen Lesern.
- Ergebnisse eingebetteter Läufe und der Compaction stellen keine Transkript-Locators mehr für
  die Sitzungsabrechnung bereit. Die automatische Compaction aktualisiert nur die aktive `sessionId`,
  Compaction-Zähler und Token-Metadaten.
- Ergebnisse eingebetteter Versuche geben `transcriptLocatorUsed` nicht mehr zurück, und
  `compact()`-Ergebnisse der Context-Engine geben keine Transkript-Locators mehr zurück.
  Runtime-Wiederholungsschleifen akzeptieren nur eine nachfolgende `sessionId`.
- Ergebnisse beim Anhängen von Transkripten für die Zustellungsspiegelung geben keine Transkript-
  Locators mehr zurück. Aufrufer erhalten die angehängte `messageId`; Signale für Transkriptaktualisierungen verwenden
  den SQLite-Scope.
- Fork-Helper für übergeordnete Sitzungen geben nur die geforkte `sessionId` zurück. Die Vorbereitung von Subagenten
  übergibt den untergeordneten Agenten-/Sitzungs-Scope an Engines.
- CLI-Runner-Parameter und das erneute Befüllen des Verlaufs akzeptieren keine Transkript-Locators mehr.
  CLI-Verlaufslesevorgänge lösen den SQLite-Transkript-Scope aus `{agentId,
sessionId}` und dem Sitzungsschlüsselkontext auf.
- Test-Fixtures für CLI und eingebettete Runner befüllen und lesen SQLite-Transkriptzeilen jetzt
  anhand der Sitzungs-ID, statt vorzugeben, aktive Sitzungen seien `*.jsonl`-Dateien, oder
  eine `sqlite-transcript://...`-Zeichenfolge durch Runtime-Parameter zu übergeben.
- Ereignisse des Schutzmechanismus für Sitzungstool-Ergebnisse werden aus dem bekannten Sitzungs-Scope ausgegeben, selbst wenn ein
  In-Memory-Manager keinen abgeleiteten Locator besitzt. Die Tests täuschen keine aktiven
  `/tmp/*.jsonl`-Transkriptdateien mehr vor.
- BTW- und Compaction-Checkpoint-Helper lesen und forken Transkriptzeilen jetzt anhand des
  SQLite-Scopes. Checkpoint-Metadaten speichern jetzt ausschließlich Sitzungs-IDs und Blatt-/Eintrags-IDs;
  abgeleitete Locators werden nicht mehr in Checkpoint-Payloads geschrieben.
- Die Gateway-Transkriptschlüsselsuche verwendet den SQLite-Transkript-Scope an Protokoll-
  grenzen und führt keine Realpath- oder Stat-Aufrufe für Transkriptdateinamen mehr aus.
- Die Transkriptrotation der automatischen Compaction schreibt nachfolgende Transkriptzeilen
  direkt über den SQLite-Transkriptspeicher. Sitzungszeilen enthalten nur die
  nachfolgende Sitzungsidentität, keinen dauerhaften JSONL-Pfad oder persistierten Locator.
- Die eingebettete Context-Engine-Compaction verwendet nach SQLite benannte Helper für die Transkriptrotation.
  Die Rotationstests erstellen keine JSONL-Pfade für Nachfolger mehr und
  modellieren aktive Sitzungen nicht mehr als Dateien.
- Die verwaltete Aufbewahrung ausgehender Bilder indiziert ihren Transkriptnachrichten-Cache anhand von
  SQLite-Transkriptstatistiken statt anhand von Dateisystem-Stat-Aufrufen.
- Runtime-Sitzungssperren und der eigenständige veraltete `.jsonl.lock`-Doctor-
  Pfad wurden entfernt.
- Das Runtime-Barrel von Microsoft Teams und das öffentliche Plugin-SDK exportieren
  den alten Dateisperren-Helper nicht mehr erneut; dauerhafte Plugin-Zustandspfade sind SQLite-gestützt.
- Das Bereinigen von Sitzungen nach Alter/Anzahl und die explizite Sitzungsbereinigung wurden entfernt.
  Doctor ist für den Legacy-Import zuständig; veraltete Sitzungen werden explizit zurückgesetzt oder gelöscht.
- Doctor-Integritätsprüfungen zählen eine veraltete JSONL-Datei nicht mehr als gültiges aktives
  Transkript für eine SQLite-Sitzungszeile. Die Integrität aktiver Transkripte basiert ausschließlich auf SQLite;
  veraltete JSONL-Dateien werden als Eingaben für Migration/Verwaistenbereinigung gemeldet.
- Doctor behandelt `agents/<agent>/sessions/` nicht mehr als erforderlichen Runtime-
  Zustand. Dieses Verzeichnis wird nur durchsucht, wenn es bereits existiert, und dient dann als Eingabe
  für Legacy-Import oder Verwaistenbereinigung.
- Gateway-`sessions.resolve`-, Sitzungspatch-/Reset-/Compact-Pfade, das Erzeugen von Subagenten,
  der schnelle Abbruch, ACP-Metadaten, Heartbeat-isolierte Sitzungen und TUI-
  Patching migrieren oder bereinigen veraltete Sitzungsschlüssel nicht mehr als Nebeneffekt
  normaler Runtime-Arbeit.
- Die Sitzungauflösung von CLI-Befehlen gibt jetzt die zugehörige `agentId` statt eines
  `storePath` zurück und kopiert während der normalen
  Auflösung von `--to` oder `--session-id` keine veralteten Hauptsitzungszeilen mehr. Die Kanonisierung veralteter Hauptzeilen obliegt
  ausschließlich Doctor.
- Die Runtime-Auflösung der Subagententiefe liest `sessions.json` oder JSON5-
  Sitzungsspeicher nicht mehr. Sie liest SQLite-`session_entries` anhand der Agenten-ID, und veraltete
  Tiefen-/Sitzungsmetadaten können nur über den Doctor-Importpfad eingebracht werden.
- Sitzungsüberschreibungen von Authentifizierungsprofilen werden durch direkte Upserts von `{agentId, sessionKey}`-
  Zeilen persistiert, statt eine dateiförmige Sitzungsspeicher-Runtime verzögert zu laden.
- Die ausführliche Steuerung automatischer Antworten und Helper für Sitzungsaktualisierungen lesen/aktualisieren SQLite-
  Sitzungszeilen jetzt anhand der Sitzungsidentität und benötigen keinen veralteten Speicherpfad mehr,
  bevor sie den persistierten Zeilenzustand bearbeiten.
- Helper für Sitzungsmetadaten von Befehlsläufen verwenden jetzt eintragsorientierte Namen und Modul-
  pfade; die alte `session-store`-Oberfläche für Befehls-Helper wurde entfernt.
- Das initiale Befüllen von Bootstrap-Headern und die Härtung manueller Compaction-Grenzen verändern
  SQLite-Transkriptzeilen jetzt direkt. Runtime-Aufrufer übergeben die Sitzungsidentität, keine
  beschreibbaren `.jsonl`-Pfade.
- Die stille Wiedergabe bei der Sitzungsrotation kopiert die letzten Benutzer-/Assistenten-Interaktionen anhand von
  `{agentId, sessionId}` aus SQLite-Transkriptzeilen. Sie akzeptiert keine
  Quell- oder Ziel-Transkript-Locators mehr.
- Neue Runtime-Sitzungszeilen speichern keine Transkript-Locators mehr. Aufrufer verwenden
  `{agentId, sessionId}` direkt; Export-/Debug-Befehle können Ausgabedatei-
  namen wählen, wenn sie Zeilen materialisieren.
- Beim Start einer neuen persistierten Transkriptsitzung werden SQLite-Zeilen jetzt immer anhand des
  Scopes geöffnet. Der Sitzungsmanager verwendet einen früheren Transkript-
  pfad oder Locator aus der Dateiära nicht mehr als Identität der neuen Sitzung.
- Persistierte Transkriptsitzungen verwenden die explizite
  `openTranscriptSessionManagerForSession({agentId, sessionId})`-API. Die alten
  statischen `SessionManager.create/openForSession/list/forkFromSession`-Fassaden wurden
  entfernt, damit Tests und Runtime-Code nicht versehentlich die Sitzungs-
  erkennung der Dateiära wiederherstellen können.
- Die Plugin-Runtime stellt `api.runtime.agent.session.resolveTranscriptLocatorPath` nicht mehr bereit;
  Plugin-Code verwendet SQLite-Zeilen-Helper und Scope-Werte.
- Die öffentliche `session-store-runtime`-SDK-Oberfläche exportiert jetzt ausschließlich Helper für Sitzungszeilen
  und Transkriptzeilen. Fokussierte SQLite-Schema-/Pfad-/Transaktions-Helper
  befinden sich in `sqlite-runtime`; rohe Öffnen-/Schließen-/Reset-Helper bleiben ausschließlich lokal für
  eigene Tests.
- Veraltete `.jsonl`-Klassifikatoren für Trajektorien-/Checkpoint-Dateinamen befinden sich jetzt im
  Doctor-Modul für veraltete Sitzungsdateien. Die zentrale Sitzungsvalidierung importiert keine
  Helper für Dateiartefakte mehr, um normale SQLite-Sitzungs-IDs zu bestimmen.
- Blockierende Subagentenläufe von Active Memory verwenden SQLite-Transkriptzeilen, statt
  temporäre oder persistierte `session.jsonl`-Dateien im Plugin-Zustand zu erstellen. Die
  alte `transcriptDir`-Option wurde entfernt.
- Einmalige Slug-Generierung und Planner-Läufe des Systemagenten verwenden SQLite-Transkriptzeilen,
  statt temporäre `session.jsonl`-Dateien zu erstellen.
- `llm-task`-Hilfsläufe und die Extraktion verborgener Festlegungen verwenden ebenfalls SQLite-
  Transkriptzeilen, sodass diese ausschließlich modellseitigen Hilfssitzungen keine
  temporären JSON/JSONL-Transkriptdateien mehr erstellen.
- `TranscriptSessionManager` ist jetzt nur noch ein geöffneter SQLite-Transkriptbereich.
  Der Runtime-Code öffnet ihn mit `openTranscriptSessionManagerForSession({agentId,
sessionId})`; Abläufe zum Erstellen, Verzweigen, Fortsetzen, Auflisten und Forken befinden sich in den
  jeweils zuständigen SQLite-Zeilenhelfern statt in statischen Manager-Fassaden.
  Doctor-/Import-/Debug-Code verarbeitet explizite Legacy-Quelldateien außerhalb des
  Runtime-Sitzungsmanagers.
- Die veralteten Fassadenmethoden `SessionManager.newSession()` und
  `SessionManager.createBranchedSession()` wurden entfernt. Neue
  Sitzungen und Transkriptnachfolger werden von ihrem jeweils zuständigen SQLite-
  Workflow erstellt, statt einen bereits geöffneten Manager in eine andere
  persistierte Sitzung umzuwandeln.
- Entscheidungen zum Forken übergeordneter Transkripte und die Fork-Erstellung akzeptieren
  `storePath` oder `sessionsDir` nicht mehr; sie verwenden den SQLite-
  Transkriptbereich `{agentId, sessionId}` statt beibehaltener Dateisystempfad-Metadaten.
- Memory-host exportiert keine wirkungslosen Hilfsfunktionen zur Klassifizierung von
  Sitzungsverzeichnis-Transkripten mehr; die Transkriptfilterung wird nun beim Erstellen von Einträgen aus
  SQLite-Zeilenmetadaten abgeleitet.
- Memory-host- und QMD-Sitzungsexporttests verwenden SQLite-Transkriptbereiche. Alte
  `agents/<agentId>/sessions/*.jsonl`-Pfade bleiben nur dort abgedeckt, wo ein Test
  absichtlich die Kompatibilität von Doctor, Import oder Export nachweist.
- Die Rohdatenprüfung von Sitzungen in QA Lab verwendet jetzt `sessions.list` über das Gateway,
  statt `agents/qa/sessions/sessions.json` zu lesen; MSteams-Feedback
  wird direkt an SQLite-Transkripte angehängt, ohne einen JSONL-Pfad vorzutäuschen.
- Gemeinsam verarbeitete eingehende Channel-Turns enthalten jetzt `{agentId, sessionKey}` statt eines
  veralteten `storePath`. Die Aufzeichnungspfade von LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch und QQBot lesen jetzt Aktualisierungszeit-Metadaten und zeichnen
  eingehende Sitzungszeilen über die SQLite-Identität auf.
- Die Persistierung von Transkript-Locators wurde aus aktiven Sitzungszeilen entfernt.
  `resolveSessionTranscriptTarget` gibt `agentId`, `sessionId` und optionale
  Themenmetadaten zurück; Doctor ist der einzige Code, der veraltete Transkriptdateinamen
  importiert.
- Runtime-Transkript-Header beginnen bei SQLite-Version `1`. Upgrades alter JSONL-V1/V2/V3-
  Strukturen befinden sich ausschließlich im Doctor-Import und normalisieren importierte Header auf
  die aktuelle SQLite-Transkriptversion, bevor Zeilen gespeichert werden.
- Der Database-first-Guard verbietet jetzt `SessionManager.listAll` und
  `SessionManager.forkFromSession`; Sitzungsauflistung sowie Fork-/Wiederherstellungsworkflows
  müssen zeilenbasierte bzw. bereichsgebundene SQLite-APIs verwenden.
- Der Guard verbietet außerhalb von Doctor-/Import-Code außerdem Namen veralteter Hilfsfunktionen zum Parsen von Transkript-JSONL und Reparieren aktiver Branches,
  sodass die Runtime keinen zweiten Legacy-
  Transkriptmigrationspfad entwickeln kann.
- Eingebettete PI-Läufe lehnen eingehende Transkript-Handles ab. Sie verwenden die SQLite-
  Identität `{agentId, sessionId}` vor dem Start des Workers und erneut, bevor der
  Versuch auf den Transkriptstatus zugreift. Eine veraltete `/tmp/*.jsonl`-Eingabe kann kein
  Runtime-Schreibziel auswählen.
- Cache-Trace-, Anthropic-Payload-, Rohdatenstrom- und Diagnose-Zeitleistendatensätze
  werden jetzt in typisierte SQLite-Zeilen des Typs `diagnostic_events` geschrieben. Gateway-Stabilitätspakete
  werden jetzt in typisierte SQLite-Zeilen des Typs `diagnostic_stability_bundles` geschrieben. Die alten
  JSONL-Überschreibungspfade `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` und
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` wurden entfernt, und
  die normale Stabilitätserfassung schreibt keine `logs/stability/*.json`-Dateien mehr.
- Die Cron-Persistierung gleicht jetzt SQLite-Zeilen des Typs `cron_jobs` ab, statt
  bei jedem Speichern die gesamte Jobtabelle zu löschen und neu einzufügen. Rückschreibungen von Plugin-Zielen
  aktualisieren passende Cron-Zeilen direkt und halten den Runtime-Cron-Status in
  derselben Zustandsdatenbanktransaktion.
- Cron-Runtime-Aufrufer verwenden jetzt einen stabilen SQLite-Cron-Speicherschlüssel. Veraltete
  `cron.store`-Pfade dienen nur als Doctor-Importeingaben; Produktions-Gateway, Aufgaben-
  wartung, Status, Laufhistorie und Telegram-Zielrückschreibungen verwenden
  `resolveCronStoreKey` und normalisieren den Schlüssel nicht mehr als Pfad. Der Cron-Status
  meldet jetzt `storeKey` statt des alten dateiförmigen Felds `storePath`.
- Das Laden und Planen der Cron-Runtime normalisiert keine veralteten persistierten Job-
  Strukturen wie `jobId`, `schedule.cron`, numerisches `atMs`, String-Boolesche Werte oder
  fehlendes `sessionTarget` mehr. Der Doctor-Legacy-Import übernimmt diese Reparaturen, bevor Zeilen
  in SQLite eingefügt werden.
- ACP-Spawn löst oder persistiert keine Transkript-JSONL-Dateipfade mehr. Spawn-
  und Thread-Bind-Einrichtung persistieren die SQLite-Sitzungszeile direkt und behalten die
  Sitzungs-ID als Transkriptidentität bei.
- ACP-Sitzungsmetadaten-APIs lesen, listen und aktualisieren jetzt SQLite-Zeilen anhand von `agentId`
  und legen `storePath` nicht mehr als Teil des Vertrags für ACP-Sitzungseinträge offen.
- Die Abrechnung der Sitzungsnutzung und die Gateway-Nutzungsaggregation lösen Transkripte jetzt
  ausschließlich anhand von `{agentId, sessionId}` auf. Der Kosten-/Nutzungs-Cache und Zusammenfassungen erkannter Sitzungen
  erzeugen oder geben keine Transkript-Locator-Strings mehr zurück.
- Gateway-Chat-Anhängen, die Persistierung teilweise abgebrochener Vorgänge, `/sessions.send` und
  Webchat-Medien-Transkriptschreibvorgänge hängen Daten direkt über den SQLite-Transkriptbereich
  an. Die Gateway-Hilfsfunktion zur Transkriptinjektion akzeptiert keinen
  `transcriptLocator`-Parameter mehr.
- Die SQLite-Transkripterkennung listet jetzt nur noch Transkriptbereiche und Statistiken auf:
  `{agentId, sessionId, updatedAt, eventCount}`. Die nicht mehr verwendete
  Kompatibilitätshilfsfunktion `listSqliteSessionTranscriptLocators` und das zeilenbezogene
  Feld `locator` wurden entfernt.
- Die Runtime für Transkriptreparaturen legt nur noch
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` offen. Die alte
  Locator-basierte Reparaturhilfsfunktion wurde gelöscht; Doctor-/Debug-Code liest explizite
  Quelldateipfade und migriert niemals Locator-Strings.
- Die ACP-Replay-Ledger-Runtime speichert sitzungsbezogene Replay-Zeilen jetzt in der gemeinsamen
  SQLite-Zustandsdatenbank statt in `acp/event-ledger.json`; Doctor importiert und
  entfernt die Legacy-Datei.
- Gateway-Hilfsfunktionen zum Lesen von Transkripten befinden sich jetzt in
  `src/gateway/session-transcript-readers.ts` statt unter dem alten
  Modulnamen `session-utils.fs`. Die Prüfung des Fallback-Wiederholungsverlaufs ist nach
  SQLite-Transkriptinhalten statt nach der alten Datei-Hilfsoberfläche benannt.
- Gateway-Hilfsfunktionen für injizierten Chat und Compaction übergeben jetzt den SQLite-Transkriptbereich
  über interne Hilfs-APIs, statt Werte als Transkriptpfade oder
  Quelldateien zu bezeichnen.
- Die Erkennung von Bootstrap-Fortsetzungen prüft SQLite-Transkriptzeilen jetzt über
  `hasCompletedBootstrapTranscriptTurn`; sie legt keinen dateiförmigen
  Hilfsfunktionsnamen mehr offen.
- Embedded-runner-Tests verwenden jetzt die SQLite-Transkriptidentität, und das Öffnen eines neuen
  Transkriptmanagers erfordert immer ein explizites `sessionId`.
- Hilfsfunktionen zur Speicherindizierung verwenden jetzt durchgängig SQLite-Transkriptterminologie:
  Der Host exportiert `listSessionTranscriptScopesForAgent` und
  `sessionTranscriptKeyForScope`, die gezielte Synchronisierung stellt `sessionTranscripts` in die Warteschlange,
  Treffer der öffentlichen Sitzungssuche legen undurchsichtige `transcript:<agent>:<session>`-Pfade offen,
  und der interne DB-Quellschlüssel lautet `session:<session>` unter
  `source_kind='sessions'` statt eines vorgetäuschten Dateipfads.
- Die generische Hilfsfunktion des Plugin-SDK für persistente Deduplizierung legt keine dateiförmigen
  Optionen mehr offen. Aufrufer stellen SQLite-Bereichsschlüssel bereit, und dauerhafte Deduplizierungszeilen befinden sich im
  gemeinsamen Plugin-Status.
- Microsoft-Teams-SSO-Token wurden aus gesperrten JSON-Dateien in den SQLite-Plugin-
  Status verschoben. Doctor importiert `msteams-sso-tokens.json`, rekonstruiert kanonische SSO-Token-
  Schlüssel aus Payloads und entfernt die Quelldatei. Delegierte OAuth-Token verbleiben
  an ihrer bestehenden Grenze für private Anmeldedatendateien.
- Der Matrix-Synchronisierungs-Cache-Status wurde von `bot-storage.json` in den SQLite-Plugin-
  Status verschoben. Doctor importiert veraltete rohe oder umschlossene Synchronisierungs-Payloads und entfernt die
  Quelldatei. Aktive Matrix- und QA-Lab-Matrix-Adapter-Clients übergeben ein SQLite-Synchronisierungsspeicher-Stammverzeichnis,
  keinen vorgetäuschten `sync-store.json`- oder `bot-storage.json`-Pfad.
- Der Status der Matrix-Legacy-Kryptomigration wurde von
  `legacy-crypto-migration.json` in den SQLite-Plugin-Status verschoben. Doctor importiert die
  alte Statusdatei; Matrix-SDK-IndexedDB-Snapshots wurden von
  `crypto-idb-snapshot.json` in SQLite-Plugin-Blobs verschoben. Matrix-Wiederherstellungsschlüssel und
  Anmeldedaten sind Zeilen des SQLite-Plugin-Status; ihre alten JSON-Dateien dienen nur als Doctor-
  Migrationseingaben.
- Memory-Wiki-Aktivitätsprotokolle verwenden jetzt den SQLite-Plugin-Status statt
  `.openclaw-wiki/log.jsonl`. Der Memory-Wiki-Migrations-Provider importiert alte
  JSONL-Protokolle; Wiki-Markdown und Inhalte des Benutzer-Vaults bleiben als
  Workspace-Inhalte dateibasiert.
- Memory Wiki erstellt weder `.openclaw-wiki/state.json` noch das ungenutzte
  Verzeichnis `.openclaw-wiki/locks` mehr. Der Migrations-Provider entfernt diese ausgemusterten
  Plugin-Metadatendateien, falls ein älterer Vault sie noch enthält.
- System-Agent-Audit-Einträge verwenden jetzt den zentralen SQLite-Plugin-Status statt
  `audit/crestodian.jsonl`. Doctor importiert das veraltete JSONL-Audit-Protokoll und
  entfernt es nach erfolgreichem Import.
- Audit-Einträge zum Schreiben und Beobachten der Konfiguration verwenden jetzt den zentralen SQLite-Plugin-Status statt
  `logs/config-audit.jsonl`. Doctor importiert das veraltete JSONL-Audit-Protokoll und
  entfernt es nach erfolgreichem Import.
- Die macOS-Begleitanwendung schreibt beim Bearbeiten von `openclaw.json` keine anwendungslokalen Sidecars
  `logs/config-audit.jsonl` oder `logs/config-health.json` mehr. Die Konfigurations-
  datei bleibt dateibasiert, Wiederherstellungs-Snapshots verbleiben neben der Konfigurationsdatei,
  und der dauerhafte Audit-/Integritätsstatus der Konfiguration gehört in den SQLite-Speicher des Gateways.
- Ausstehende Genehmigungen zur System-Agent-Rettung verwenden jetzt den zentralen SQLite-Plugin-Status statt
  `crestodian/rescue-pending/*.json` oder `openclaw/rescue-pending/*.json`.
  Diese kurzlebigen Sicherheitsberechtigungen werden niemals importiert; Doctor verwirft
  beide ausgemusterten Verzeichnisse, damit ein Upgrade keinen veralteten Schreibzugriff reaktivieren kann.
- Der temporäre Aktivierungsstatus von Phone Control verwendet jetzt den SQLite-Plugin-Status statt
  `plugins/phone-control/armed.json`. Doctor importiert die veraltete Datei mit dem Aktivierungsstatus
  in den Namespace `phone-control/arm-state` und entfernt die Datei.
- Doctor repariert JSONL-Transkripte nicht mehr direkt und erstellt keine JSONL-
  Sicherungsdateien mehr. Er importiert den aktiven Branch in SQLite und entfernt die Legacy-Quelle.
- Die Transkriptsuche des Session-Memory-Hooks verwendet auf den `{agentId, sessionId}`-Bereich beschränkte
  SQLite-Lesevorgänge. Die Hilfsfunktion akzeptiert oder ermittelt keine Transkript-Locators,
  Legacy-Dateilesevorgänge oder Optionen zum Neuschreiben von Dateien mehr.
- Konversationsbindungen des Codex-App-Servers verwenden jetzt den OpenClaw-Sitzungsschlüssel oder einen expliziten
  `{agentId, sessionId}`-Bereich als Schlüssel für den SQLite-Plugin-Status. Sie dürfen keine
  Fallback-Bindungen für Transkriptpfade beibehalten.
- Lesevorgänge des gespiegelten Verlaufs des Codex-App-Servers verwenden ausschließlich den SQLite-Transkriptbereich;
  sie dürfen die Identität nicht aus Transkriptdateipfaden wiederherstellen.
- Pfade für Rollenanordnung und Compaction-Zurücksetzung löschen keine alten Transkript-
  dateien mehr; das Zurücksetzen rotiert nur die SQLite-Sitzungszeile und die Transkriptidentität.
- Gateway-Antworten für Zurücksetzungen und Checkpoints geben bereinigte Sitzungszeilen sowie Sitzungs-
  IDs zurück. Sie erzeugen keine SQLite-Transkript-Locators mehr für Clients.
- Memory-Core-Dreaming bereinigt Sitzungszeilen nicht mehr, indem es nach fehlenden
  JSONL-Dateien sucht. Die Subagent-Bereinigung erfolgt über die Sitzungs-Runtime-API statt über
  Existenzprüfungen im Dateisystem. Die Transkript-Ingestion-Tests legen SQLite-Zeilen
  direkt an, statt `agents/<id>/sessions`-Fixtures oder Locator-
  Platzhalter zu erstellen.
- Die Memory-Transkriptindizierung kann `transcript:<agentId>:<sessionId>` als
  virtuellen Suchtrefferpfad für Hilfsfunktionen zum Zitieren und Lesen offenlegen. Die dauerhafte Indexquelle ist
  relational (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), daher ist der Wert kein Laufzeit-Transkript-Locator,
  kein Dateisystempfad und darf niemals wieder an Sitzungs-Laufzeit-APIs übergeben werden.
- Der Speicherstatus von Gateway Doctor liest Kurzzeitabruf- und Phasensignal-Zählwerte
  aus SQLite-Plugin-Statuszeilen statt aus `memory/.dreams/*.json`; die Ausgabe der CLI und
  von Doctor bezeichnet diesen Speicher nun als SQLite-Speicher, nicht als Pfad.
- Memory-Core-Laufzeit, CLI-Status, Gateway-Doctor-Methoden und Plugin-SDK-
  Fassaden prüfen oder archivieren veraltete `.dreams/session-corpus`-Dateien nicht mehr.
  Diese Dateien dienen ausschließlich als Migrationseingaben; Doctor importiert sie in SQLite und
  löscht die Quelle nach der Überprüfung. Aktive Sitzungsaufnahme-Nachweiszeilen
  verwenden nun den virtuellen SQLite-Pfad `memory/session-ingestion/<day>.txt`; die Laufzeit
  schreibt niemals Status in `.dreams/session-corpus` und leitet daraus auch keinen Status ab.
- Öffentliche Memory-Core-Artefakte stellen SQLite-Hostereignisse als virtuelles JSON-
  Artefakt `memory/events/memory-host-events.json` bereit; sie verwenden den
  veralteten Quellpfad `.dreams/events.jsonl` nicht mehr erneut.
- Sandbox-Container-/Browser-Registrierungen verwenden nun die gemeinsame
  SQLite-Tabelle `sandbox_registry_entries` mit typisierten Spalten für Sitzung, Image, Zeitstempel,
  Backend/Konfiguration und Browser-Port. Doctor importiert veraltete monolithische und
  fragmentierte JSON-Registrierungsdateien und entfernt erfolgreich importierte Quellen. Laufzeit-Lesevorgänge verwenden
  die typisierten Zeilenspalten als maßgebliche Datenquelle; `entry_json` ist nur eine Wiedergabe-/Debug-
  Kopie.
- Verpflichtungen verwenden nun eine typisierte gemeinsame Tabelle `commitments` statt eines
  JSON-Blobs für den gesamten Speicher. Die Laufzeit verwendet indizierte Abfragen für Geltungsbereich, Zustellfenster, gleitende
  Obergrenze, Status und Versuche sowie synchrone SQLite-Transaktionen;
  `record_json` ist nur eine Wiedergabe-/Debug-Kopie. Eine explizite Doctor-Reparatur validiert
  die vollständige veraltete `commitments.json`, behält neuere SQLite-Zeilen bei, überprüft das
  Ergebnis und entfernt erst dann die unveränderte Quelle. Die Laufzeit liest oder
  schreibt die ausgemusterte Datei niemals.
- Web-Push-Abonnements und die generierte VAPID-Identität verwenden nun typisierte gemeinsame
  Zeilen `web_push_subscriptions` und `web_push_vapid_keys`. Laufzeitregistrierung,
  Ablaufbereinigung und Schlüsselerzeugung bei der ersten Verwendung nutzen SQLite-
  Transaktionen auf Zeilenebene. Eine explizite Doctor-Reparatur validiert beide ausgemusterten JSON-Speicher,
  beansprucht sie vor dem SQLite-Schreibvorgang, importiert sie atomar, lehnt
  widersprüchliche VAPID-Identitäten ab, überprüft das Ergebnis und entfernt erst dann die
  Beanspruchungen. Doctor hält während des gesamten Imports die Wartungssperre des
  Statusverzeichnisses, damit ein älterer Gateway die ausgemusterten Dateien nicht neu erstellen kann. Registrierung,
  Zustellung, Löschung und Schlüsselauflösung schlagen sicher geschlossen fehl, bis Doctor
  ausstehende veraltete Quellen oder unterbrochene Beanspruchungen auflöst.
- Cron-Auftragsdefinitionen, Zeitplanstatus und Ausführungsverlauf haben keine JSON-
  Schreiber oder -Leser mehr zur Laufzeit. Die Laufzeit verwendet `cron_jobs`-Zeilen mit typisierten Spalten für Zeitplan,
  Nutzlast, Zustellung, Fehlerwarnung, Sitzung, Status und Laufzeitstatus sowie
  Cron-eigene `task_runs`-Details für Diagnose, Zustellung, Sitzung/Ausführung, Modell
  und Token-Gesamtwerte. `job_json` ist nur eine Wiedergabe-/Debug-Kopie; `state_json` bewahrt verschachtelte
  Laufzeitdiagnosen auf, für die noch keine häufig abgefragten Felder vorhanden sind, während die Laufzeit
  häufig verwendete Statusfelder aus typisierten Spalten wiederherstellt. Doctor importiert
  veraltete Dateien `jobs.json`, `jobs-state.json` und `runs/*.jsonl` und entfernt
  die importierten Quellen. Rückschreibungen von Plugin-Zielen aktualisieren übereinstimmende `cron_jobs`-
  Zeilen, statt den gesamten Cron-Speicher zu laden und zu ersetzen.
- Der Gateway-Start ignoriert veraltete `notify: true`-Markierungen in der Laufzeit-
  Projektion. Doctor liest die ausgemusterte Rohquelle `cron.webhook` nur, während
  diese Markierungen in eine explizite SQLite-Zustellung übersetzt werden, und entfernt anschließend den Konfigurationsschlüssel.
- Ausgehende und sitzungsbezogene Zustellwarteschlangen speichern nun Warteschlangenstatus, Eintragstyp,
  Sitzungsschlüssel, Kanal, Ziel, Konto-ID, Wiederholungsanzahl, letzten Versuch/Fehler,
  Wiederherstellungsstatus und Plattform-Sendemarkierungen als typisierte Spalten in der gemeinsamen
  Tabelle `delivery_queue_entries`. Die Laufzeitwiederherstellung liest diese häufig verwendeten Felder aus
  den typisierten Spalten, und Wiederholungs-/Wiederherstellungsmutationen aktualisieren diese Spalten direkt,
  ohne Wiedergabe-JSON neu zu schreiben. Die vollständige JSON-Nutzlast bleibt nur als
  Wiedergabe-/Debug-Blob für Nachrichteninhalte und andere selten verwendete Wiedergabedaten erhalten.
- Verwaltete Datensätze ausgehender Bilder verwenden nun typisierte gemeinsame
  Zeilen `managed_outgoing_image_records`. Die Laufzeit liest ausschließlich typisierte Spalten; die
  JSON-Spalte ist eine Wiedergabe-/Debug-Kopie. Die ursprünglichen Bildbytes bleiben benannte
  Anhangsartefakte im Verzeichnis für verwaltete Medien.
- Discord-Einstellungen für die Modellauswahl, Hashes für die Befehlsbereitstellung und Thread-Bindungen
  verwenden nun den gemeinsamen SQLite-Plugin-Status. Ihre veralteten JSON-Importpläne befinden sich in der
  Einrichtungs-/Doctor-Migrationsoberfläche des Discord-Plugins, nicht im Kern-Migrationscode.
- Detektoren für veraltete Plugin-Importe verwenden nach Doctor benannte Module wie
  `doctor-legacy-state.ts` oder `doctor-state-imports.ts`; normale Kanal-Laufzeitmodule
  dürfen keine Detektoren für veraltetes JSON importieren.
- BlueBubbles-Nachholcursor und Deduplizierungsmarkierungen für eingehende Nachrichten verwenden nun den gemeinsamen SQLite-
  Plugin-Status. Ihre veralteten JSON-Importpläne befinden sich in der Einrichtungs-/Doctor-Migrationsoberfläche
  des BlueBubbles-Plugins, nicht im Kern-Migrationscode.
- Telegram-Aktualisierungs-Offsets, Sticker-Cache-Zeilen, Cache-Zeilen gesendeter Nachrichten,
  Cache-Zeilen für Themennamen und Thread-Bindungen verwenden nun den gemeinsamen SQLite-Plugin-
  Status. Ihre veralteten JSON-Importpläne befinden sich in der Einrichtungs-/Doctor-Migrationsoberfläche
  des Telegram-Plugins, nicht im Kern-Migrationscode.
- iMessage-Nachholcursor, Zuordnungen kurzer Antwort-IDs und Deduplizierungszeilen für Sende-Echos
  verwenden nun den gemeinsamen SQLite-Plugin-Status. Die alten Dateien `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` und `imessage/sent-echoes.jsonl` dienen
  ausschließlich als Doctor-Eingaben.
- Feishu-Zeilen zur Nachrichtendeduplizierung nutzen nun die beanspruchbare Kerndeduplizierung
  (`feishu.dedup.*`-Namespaces im gemeinsamen SQLite-Plugin-Status) statt
  `feishu/dedup/*.json`-Dateien oder des ausgemusterten manuell implementierten Speichers `dedup.*`, ohne
  veralteten Import, da der Cache für den Wiedergabeschutz nach dem Upgrade neu aufgebaut wird.
- Microsoft Teams-Unterhaltungen, Umfragen, ausstehende Upload-Puffer und Feedback-
  Erkenntnisse verwenden nun gemeinsame SQLite-Tabellen für Plugin-Status/Blobs. Der Pfad für ausstehende Uploads
  verwendet `plugin_blob_entries`, sodass Medienpuffer als SQLite-BLOBs
  statt als Base64-JSON gespeichert werden. Die Namen der Laufzeithelfer verwenden nun SQLite-/Statusbenennungen
  statt der `*-fs`-Dateispeicherbenennung, und der alte `storePath`-Shim ist
  aus diesen Speichern entfernt. Sein veralteter JSON-Importplan befindet sich in der Einrichtungs-/Doctor-Migrationsoberfläche
  des Microsoft Teams-Plugins.
- Von Zalo gehostete ausgehende Medien verwenden nun das gemeinsame SQLite-Element `plugin_blob_entries`
  statt temporärer JSON-/bin-Begleitdateien `openclaw-zalo-outbound-media`.
- HTML und Metadaten des Diff-Viewers verwenden nun das gemeinsame SQLite-Element `plugin_blob_entries`
  statt temporärer Dateien `meta.json`/`viewer.html`. Viewer-HTML wird als
  gzip-Blob gespeichert, und nur der Hash des URL-Tokens wird persistiert. Gerenderte PNG-/PDF-Ausgaben
  bleiben temporäre Materialisierungen, da die Kanalzustellung weiterhin einen Dateipfad benötigt;
  ihre Ablaufmetadaten werden von SQLite verwaltet, ohne JSON-Begleitdateien.
- Verwaltete Canvas-Dokumente verwenden nun das gemeinsame SQLite-Element `plugin_blob_entries` statt
  eines standardmäßigen Verzeichnisses `state/canvas/documents`. Der Canvas-Host stellt diese
  Blobs direkt bereit; lokale Dateien werden nur für explizite `host.root`-
  Betreiberinhalte oder zur temporären Materialisierung erstellt, wenn ein nachgelagerter Medienleser
  einen Pfad benötigt.
- Prüfentscheidungen für Dateiübertragungen verwenden nun das gemeinsame SQLite-Element `plugin_state_entries`
  statt des unbegrenzten Laufzeitprotokolls `audit/file-transfer.jsonl`. Doctor
  importiert die veraltete JSONL-Prüfdatei in den Plugin-Status und entfernt die Quelle
  nach einem fehlerfreien Import.
- ACPX-Prozess-Leases und die Identität der Gateway-Instanz verwenden nun den gemeinsamen SQLite-Plugin-
  Status. Doctor importiert die veraltete Datei `gateway-instance-id` in den Plugin-Status
  und entfernt die Quelle.
- Von ACPX generierte Wrapper-Skripte und das isolierte Codex-Home sind temporäre
  Materialisierungen unter dem OpenClaw-Temp-Stammverzeichnis und kein dauerhafter OpenClaw-Status. Die
  dauerhaften ACPX-Laufzeitdatensätze sind die SQLite-Lease- und Gateway-Instanzzeilen;
  die alte ACPX-Konfigurationsoberfläche `stateDir` wurde entfernt, da dort kein Laufzeitstatus
  mehr geschrieben wird.
- Gateway-Medienanhänge verwenden nun die gemeinsame SQLite-Tabelle `media_blobs` als
  kanonischen Byte-Speicher. Lokale Pfade, die an Kompatibilitätsoberflächen für Kanäle und Sandboxen
  zurückgegeben werden, sind temporäre Materialisierungen der Datenbankzeile und nicht der
  dauerhafte Medienspeicher. Laufzeit-Medienfreigabelisten enthalten die veralteten
  Stammverzeichnisse `$OPENCLAW_STATE_DIR/media` oder `media` des Konfigurationsverzeichnisses nicht mehr; diese Verzeichnisse dienen
  ausschließlich als Doctor-Importquellen.
- Die Shell-Vervollständigung schreibt keine `$OPENCLAW_STATE_DIR/completions/*`-Cache-
  Dateien mehr. Installations-, Doctor-, Aktualisierungs- und Release-Smoke-Pfade verwenden generierte
  Vervollständigungsausgaben oder das Einlesen von Profilen statt dauerhafter Vervollständigungs-Cache-
  Dateien.
- Das Staging für Gateway-Skill-Uploads verwendet nun gemeinsame Zeilen `skill_uploads` und
  `skill_upload_chunks`. Chunks bleiben während des Uploads einzeln transaktional;
  beim Commit werden sie dann zu einem verifizierten Archiv-BLOB zusammengesetzt und die Chunk-
  Zeilen entfernt. Das Installationsprogramm erhält nur während einer laufenden Installation
  einen temporär materialisierten Archivpfad. Doctor verwirft den ausgemusterten einstündigen Dateisystem-
  Staging-Baum, statt flüchtige Uploads zu importieren.
- Inline-Anhänge von Subagenten werden nicht mehr unter dem Workspace-Pfad
  `.openclaw/attachments/*` materialisiert. Der Spawn-Pfad bereitet SQLite-VFS-Seed-Einträge vor,
  Inline-Ausführungen übernehmen diese Einträge in den Laufzeit-Scratch-Namespace des jeweiligen Agenten,
  und datenträgergestützte Tools überlagern diesen SQLite-Scratch für Anhangspfade. Die
  alten Registrierungsspalten für Anhangsverzeichnisse von Subagent-Ausführungen und die Bereinigungs-Hooks wurden entfernt.
- Die CLI-Bildhydratisierung verwaltet keine stabilen `openclaw-cli-images`-Cache-
  Dateien mehr. Externe CLI-Backends erhalten weiterhin Dateipfade, diese Pfade sind jedoch
  temporäre Materialisierungen pro Ausführung mit anschließender Bereinigung.
- Cache-Trace-Diagnosen, Anthropic-Nutzlastdiagnosen, Rohmodell-Stream-
  Diagnosen, Diagnose-Zeitachsenereignisse und Gateway-Stabilitätspakete schreiben nun
  SQLite-Zeilen statt Dateien `logs/*.jsonl` oder
  `logs/stability/*.json`.
  Laufzeit-Flags und Umgebungsvariablen zum Überschreiben von Pfaden wurden entfernt; Export-/Debug-
  Befehle können Dateien explizit aus Datenbankzeilen materialisieren.
- Die macOS-Begleitanwendung verfügt nicht mehr über einen rollierenden `diagnostics.jsonl`-Schreiber. App-
  Protokolle werden in die vereinheitlichte Protokollierung geschrieben, und dauerhafte Gateway-Diagnosen bleiben SQLite-gestützt.
- Die Datensatzliste des macOS-Port-Guardians verwendet nun typisierte gemeinsame SQLite-
  Zeilen `macos_port_guardian_records` statt einer JSON-Datei in Application Support
  oder eines undurchsichtigen Singleton-Blobs. Alle macOS-App-Profile verwenden dieselbe hostglobale native
  Datenbank, da sie maschinenlokale Ports koordinieren. Jeder Ledger-Vorgang
  blockiert, solange eine ältere JSON-schreibende App-Kopie ausgeführt wird. Die Migration tritt dem stabilen
  Dateisperrprotokoll des alten Ledgers nur bei, um die Quelle als Momentaufnahme zu erfassen und später erneut zu validieren.
  Sie löst jede veraltete Zeile anhand aktueller Befehls- und Prozessstartfakten auf,
  ohne diese Sperre zu halten, liest dann die maßgeblichen SQLite-Zeilen erneut, wendet den
  Plan an, überprüft jeden Beleg und entfernt die Quelle. Entfernungswiederholungen planen
  fehlende Zeilen neu, damit ausgemusterte veraltete Belege nicht wiederhergestellt werden können. Die Sperre bleibt
  kurzlebig, damit sie einen älteren Schreiber nach dem Start durch SSH nicht blockieren kann. Die Umstellung ist
  absichtlich unumkehrbar: Die Laufzeit im Normalbetrieb liest, projiziert oder schreibt niemals JSON,
  und ein Rollback auf reine JSON-Builds bewahrt neuere SQLite-Belege nicht.
- Gateway-Singleton-Sperren verwenden nun typisierte gemeinsame SQLite-Zeilen `state_leases` unter
  dem Geltungsbereich `gateway_locks` statt Sperrdateien im Temp-Verzeichnis. Dokumentationen zur Fehlerbehebung für Fly und OAuth
  verweisen nun auf die SQLite-Lease-/Authentifizierungsaktualisierungssperre statt
  auf die Bereinigung veralteter Dateisperren.
- Der Zustand des Gateway-Neustart-Sentinels verwendet jetzt typisierte gemeinsame SQLite-
  `gateway_restart_sentinel`-Zeilen anstelle von `restart-sentinel.json`; die Laufzeit
  liest Sentinel-Art, Status, Routing, Nachricht, Fortsetzung und Statistiken aus
  typisierten Spalten. Diese Spalten sind maßgeblich; `payload_json` ist nur ein
  Replay-/Debug-Schatten. Die Lese-, Schreib- und Löschpfade der Laufzeit verwenden ausschließlich SQLite.
  Ein begrenztes Zustandsmigrationsmodul wird beim Start und durch Doctor ausgeführt, um einen
  validierten älteren Post-Update-Sentinel vor der normalen Neustartwiederherstellung zu importieren, die
  typisierte Zeile zu überprüfen und die Quelldatei zu entfernen. Kein Laufzeitmodul im
  Normalbetrieb liest oder schreibt die Legacy-Datei oder bereinigt sie.
- Die Gateway-Neustartabsicht und der Übergabezustand des Supervisors verwenden jetzt typisierte gemeinsame
  SQLite-Zeilen `gateway_restart_intent` und `gateway_restart_handoff` anstelle der
  Sidecar-Dateien `gateway-restart-intent.json` und
  `gateway-supervisor-restart-handoff.json`.
- Die Gateway-Singleton-Koordination verwendet jetzt typisierte `state_leases`-Zeilen unter
  `gateway_locks`, anstatt `gateway.<hash>.lock`-Dateien zu schreiben. Die Lease-Zeile
  enthält den Sperrinhaber, den Ablaufzeitpunkt, den Heartbeat und die Debug-Nutzlast; SQLite verwaltet die
  atomare Grenze für Erwerb und Freigabe. Die eingestellte Verzeichnisoption für Dateisperren
  wurde entfernt; Tests verwenden direkt die Identität der SQLite-Zeile.
- Der alte, nicht referenzierte Cron-Helfer für Nutzungsberichte, der `cron/runs/*.jsonl`-
  Dateien durchsuchte, wurde gelöscht. Berichte zum Cron-Ausführungsverlauf lesen Cron-eigene `task_runs`-Zeilen.
- Die Neustartwiederherstellung der Hauptsitzung ermittelt mögliche Agenten jetzt über die
  SQLite-Registry `agent_databases`, anstatt `agents/*/sessions`-
  Verzeichnisse zu durchsuchen.
- Die Wiederherstellung nach beschädigten Gemini-Sitzungen löscht jetzt nur die SQLite-Sitzungszeile;
  sie benötigt kein Legacy-`storePath`-Gate mehr und versucht nicht mehr, einen abgeleiteten
  JSONL-Transkriptpfad zu entfernen.
- Die Verarbeitung von Pfadüberschreibungen behandelt literale `undefined`-/`null`-Umgebungswerte
  jetzt als nicht gesetzt und verhindert dadurch bei Tests oder Shell-Übergaben versehentlich im
  Repository-Stammverzeichnis angelegte `undefined/state/*.sqlite`-Datenbanken.
- Fingerabdrücke des Konfigurationszustands verwenden jetzt typisierte gemeinsame SQLite-
  `config_health_entries`-Zeilen anstelle von `logs/config-health.json`, sodass die normale Konfigurationsdatei
  das einzige Konfigurationsdokument ohne Anmeldedaten bleibt. Die macOS-Begleitanwendung behält nur
  prozesslokalen Zustandsstatus und erstellt die alte JSON-Sidecar-Datei nicht erneut.
- Die Laufzeit für Authentifizierungsprofile importiert oder schreibt keine JSON-Dateien mit Anmeldedaten mehr. Der
  kanonische Speicher für Anmeldedaten ist SQLite; `auth-profiles.json`, agentenspezifische
  `auth.json` und gemeinsame `credentials/oauth.json` sind Migrationseingaben für Doctor,
  die nach dem Import entfernt werden.
- Tests zum Speichern und Zustand von Authentifizierungsprofilen prüfen jetzt direkt typisierte SQLite-Authentifizierungstabellen
  und verwenden Legacy-Dateinamen für Authentifizierungsprofile nur als Migrationseingaben für Doctor.
- `openclaw secrets apply` bereinigt nur die Konfigurationsdatei, die Umgebungsdatei und den SQLite-
  Speicher für Authentifizierungsprofile. Es enthält keine Kompatibilitätslogik mehr, die die eingestellte agentenspezifische
  Datei `auth.json` bearbeitet; Doctor ist für den Import und das Löschen dieser Datei zuständig.
- Hermes-Pläne zur Migration von Secrets planen und übernehmen importierte API-Schlüsselprofile direkt
  in den SQLite-Speicher für Authentifizierungsprofile. `auth-profiles.json` wird nicht mehr als Zwischenziel
  geschrieben oder überprüft.
- Benutzerorientierte Dokumentation zur Authentifizierung beschreibt jetzt
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>`, anstatt Benutzer anzuweisen,
  `auth-profiles.json` zu prüfen oder zu kopieren; Legacy-Namen für OAuth-/Authentifizierungs-JSON
  bleiben nur als Importeingaben für Doctor dokumentiert.
- MCP-OAuth-Sitzungen verwenden jetzt versionierte `mcp_oauth_stores`-Zeilen im gemeinsamen
  `state/openclaw.sqlite`. SDK-eigene Token-, Clientregistrierungs- und Discovery-
  Objekte bleiben eine einzige validierte JSON-Nutzlast, damit Erweiterungsfelder von Abhängigkeiten
  erhalten bleiben, während jeder Lese-/Änderungs-/Schreibvorgang in einer kurzen Kysely-
  Transaktion festgeschrieben wird. Eine gemeinsame SQLite-Lease serialisiert Aktualisierung, Anmeldung und Abmeldung;
  eingebettete MCP-Transporte lassen das MCP SDK Aktualisierungen nicht mehr außerhalb dieser
  Lease durchführen. Doctor importiert und entfernt ausschließlich die eingestellten `mcp-oauth/*.json`-
  Speicher mit Quellbelegen, und die Laufzeit besitzt keinen Datei-Fallback.
- Hilfsfunktionen für Kernzustandspfade stellen die eingestellte Datei `credentials/oauth.json`
  nicht mehr bereit. Der Legacy-Dateiname ist lokal auf den Authentifizierungsimportpfad von Doctor beschränkt.
- Dokumentation zu Installation, Sicherheit, Onboarding, Modellauthentifizierung und SecretRef beschreibt jetzt
  SQLite-Zeilen für Authentifizierungsprofile und Sicherung/Migration des gesamten Zustands anstelle
  agentenspezifischer JSON-Dateien für Authentifizierungsprofile.
- Die PI-Modellerkennung übergibt jetzt kanonische Anmeldedaten an den speicherinternen
  Authentifizierungsspeicher `pi-coding-agent`. Sie erstellt, bereinigt oder schreibt während der Erkennung
  keine agentenspezifischen `auth.json` mehr.
- Auslöse- und Routing-Einstellungen für Voice Wake verwenden jetzt typisierte gemeinsame SQLite-Tabellen
  anstelle von `settings/voicewake.json`, `settings/voicewake-routing.json` oder
  undurchsichtigen generischen Zeilen; Doctor importiert die Legacy-JSON-Dateien und entfernt sie nach einer
  erfolgreichen Migration.
- Der Zustand der Update-Prüfung verwendet jetzt eine typisierte gemeinsame `update_check_state`-Zeile anstelle von
  `update-check.json` oder einem undurchsichtigen generischen Blob; Doctor importiert
  die Legacy-JSON-Datei und entfernt sie nach einer erfolgreichen Migration.
- Der Zustand der Konfigurationsintegrität verwendet jetzt typisierte gemeinsame `config_health_entries`-Zeilen anstelle
  von `logs/config-health.json` oder einem undurchsichtigen generischen Blob; Doctor
  importiert die Legacy-JSON-Datei und entfernt sie nach einer erfolgreichen Migration.
- Genehmigungen für Plugin-Konversationsbindungen verwenden jetzt typisierte
  `plugin_binding_approvals`-Zeilen anstelle eines undurchsichtigen gemeinsamen SQLite-Zustands oder
  `plugin-binding-approvals.json`; die Legacy-Datei ist eine Migrationseingabe für Doctor.
- Generische Bindungen der aktuellen Konversation speichern jetzt typisierte
  `current_conversation_bindings`-Zeilen, anstatt
  `bindings/current-conversations.json` neu zu schreiben; Doctor importiert die Legacy-JSON-Datei und
  entfernt sie nach einer erfolgreichen Migration.
- Synchronisations-Ledger für importierte Quellen von Memory Wiki speichern jetzt je Vault-/Quellschlüssel eine SQLite-Plugin-Zustandszeile,
  anstatt `.openclaw-wiki/source-sync.json` neu zu schreiben;
  der Migrations-Provider importiert und entfernt das Legacy-JSON-Ledger.
- Datensätze zu ChatGPT-Importläufen von Memory Wiki speichern jetzt je Vault-/Lauf-ID eine SQLite-Plugin-Zustandszeile,
  anstatt `.openclaw-wiki/import-runs/*.json` zu schreiben.
  Rollback-Snapshots bleiben explizite Vault-Dateien, bis die Archivierung von Snapshots der
  Importläufe in den Blob-Speicher verschoben wird.
- Kompilierte Digests von Memory Wiki speichern jetzt komprimierte SQLite-Plugin-Blob-Zeilen,
  anstatt `.openclaw-wiki/cache/agent-digest.json` und
  `.openclaw-wiki/cache/claims.jsonl` zu schreiben. Der Cache kann neu aufgebaut werden, daher löscht Doctor
  alte Cache-Dateien, ohne sie zu importieren.
- Die Nachverfolgung installierter ClawHub-Skills speichert jetzt je Workspace/Skill eine SQLite-Plugin-Zustandszeile,
  anstatt zur Laufzeit die Sidecar-Dateien `.clawhub/lock.json` und
  `.clawhub/origin.json` zu schreiben oder zu lesen. Laufzeitcode verwendet Zustandsobjekte
  für nachverfolgte Installationen anstelle dateiförmiger Lockfile-/Ursprungsabstraktionen. Doctor
  importiert die Legacy-Sidecar-Dateien aus konfigurierten Agenten-Workspaces und entfernt sie
  nach einem fehlerfreien Import.
- Der Index installierter Plugins liest und schreibt jetzt die typisierte gemeinsame SQLite-
  Singleton-Zeile `installed_plugin_index` anstelle von `plugins/installs.json`; die
  Legacy-JSON-Datei dient nur als Migrationseingabe für Doctor und wird nach dem Import entfernt.
- Die Legacy-Pfadhilfsfunktion `plugins/installs.json` befindet sich jetzt im Legacy-
  Code von Doctor. Laufzeitmodule des Plugin-Index stellen nur SQLite-gestützte Persistenzoptionen
  bereit, keinen JSON-Dateipfad.
- Gateway-Neustart-Sentinel, Neustartabsicht und Übergabezustand des Supervisors verwenden jetzt
  typisierte gemeinsame SQLite-Zeilen (`gateway_restart_sentinel`,
  `gateway_restart_intent` und `gateway_restart_handoff`) anstelle generischer
  undurchsichtiger Blobs. Der Laufzeitcode für Neustarts besitzt keinen dateiförmigen Sentinel-/Absichts-/Übergabe-
  Vertrag.
- Matrix-Synchronisationscache, Speichermetadaten, Thread-Bindungen, Deduplizierungsmarkierungen für eingehende Nachrichten,
  Cooldown-Zustand der Startüberprüfung, IndexedDB-Kryptografie-Snapshots des SDK,
  Anmeldedaten und Wiederherstellungsschlüssel verwenden jetzt gemeinsame SQLite-Tabellen für Plugin-Zustand und -Blobs.
  Laufzeit-Pfadstrukturen stellen keinen Metadatenpfad `storage-meta.json` mehr bereit;
  dieser Dateiname dient nur als Legacy-Migrationseingabe. Ihr Legacy-JSON-Importplan
  befindet sich in der Setup-/Doctor-Migrationsoberfläche des Matrix-Plugins. Deduplizierungsmarkierungen
  für eingehende Nachrichten verwenden die beanspruchbare Deduplizierung des Kerns (`matrix.inbound-dedupe.*`-
  Namespaces in der gemeinsamen Zustandsdatenbank); die Matrix-Zustandsmigration von Doctor importiert
  einmalig die eingestellten root-spezifischen `inbound-dedupe`-Zeilen und `inbound-dedupe.json`,
  anschließend liest die Laufzeit nur noch den Speicher für beanspruchbare Deduplizierung.
- Der Matrix-Start durchsucht oder meldet keinen Legacy-Matrix-Dateizustand mehr und
  vervollständigt ihn auch nicht. Matrix-Dateierkennung, Erstellung von Legacy-Kryptografie-Snapshots, Migrationszustand
  für die Wiederherstellung von Raumschlüsseln, Import und Entfernung der Quelle liegen vollständig in der Zuständigkeit von Doctor.
- Die Matrix-Barrels für Laufzeitmigrationen wurden entfernt. Hilfsfunktionen zur Erkennung und
  Änderung von Legacy-Zustand und -Kryptografie werden direkt von Matrix Doctor importiert, anstatt
  Teil der Laufzeit-API-Oberfläche zu sein.
- Markierungen zur Wiederverwendung von Matrix-Migrations-Snapshots befinden sich jetzt im SQLite-Plugin-Zustand
  anstelle von `matrix/migration-snapshot.json`; Doctor kann dasselbe
  verifizierte Archiv vor der Migration weiterhin verwenden, ohne eine Sidecar-Zustandsdatei zu schreiben.
- Nostr-Bus-Cursor und der Zustand der Profilveröffentlichung verwenden jetzt gemeinsamen SQLite-Plugin-
  Zustand. Ihr Legacy-JSON-Importplan befindet sich in der Setup-/Doctor-
  Migrationsoberfläche des Nostr-Plugins.
- Sitzungsumschalter von Active Memory verwenden jetzt gemeinsamen SQLite-Plugin-Zustand anstelle von
  `session-toggles.json`; beim erneuten Aktivieren des Speichers wird die Zeile gelöscht, anstatt
  ein JSON-Objekt neu zu schreiben.
- Vorschläge und Prüfungszähler von Skill Workshop verwenden jetzt gemeinsamen SQLite-Plugin-
  Zustand anstelle von Workspace-spezifischen `skill-workshop/<workspace>.json`-Speichern. Jeder
  Vorschlag ist eine separate Zeile unter `skill-workshop/proposals`, und der Prüfungszähler
  ist eine separate Zeile unter `skill-workshop/reviews`.
- Subagent-Ausführungen des Skill-Workshop-Prüfers verwenden jetzt den Laufzeit-Resolver für Sitzungstranskripte,
  anstatt Sidecar-Sitzungspfade `skill-workshop/<sessionId>.json` zu erstellen.
- ACPX-Prozess-Leases verwenden jetzt gemeinsamen SQLite-Plugin-Zustand unter
  `acpx/process-leases` anstelle einer vollständigen dateibasierten `process-leases.json`-Registry.
  Jede Lease wird als eigene Zeile gespeichert, wodurch das Bereinigen veralteter Prozesse beim Start
  ohne einen Laufzeitpfad zum Neuschreiben von JSON erhalten bleibt.
- ACPX-Wrapper-Skripte und das isolierte Codex-Home-Verzeichnis werden im temporären
  Stammverzeichnis von OpenClaw erzeugt. Sie werden bei Bedarf neu erstellt und sind keine Sicherungs- oder
  Migrationseingaben.
- Die Persistenz der Subagent-Ausführungs-Registry verwendet typisierte gemeinsame `subagent_runs`-Zeilen. Der
  alte Pfad `subagents/runs.json` dient jetzt nur als Bereinigungseingabe für Doctor. Doctor
  beansprucht ihn unter der Sperre für die Zustandswartung, zeichnet die Verwerfungsentscheidung in
  SQLite auf und entfernt ihn, ohne den vorübergehenden Ausführungszustand zu importieren. Es verbleiben keine
  Laufzeit-JSON-Leser, -Schreiber, -Caches oder -Fallbacks; die versionsübergreifende Wiederherstellung von ausschließlich
  dateibasierten laufenden Ausführungen wird an dieser Einstellungsgrenze absichtlich nicht unterstützt.
  Laufzeittests erstellen keine ungültigen oder leeren `runs.json`-Fixtures mehr, um das
  Registry-Verhalten nachzuweisen; sie befüllen und lesen SQLite-Zeilen direkt.
- Die Sicherung stellt das Zustandsverzeichnis vor der Archivierung bereit, kopiert Dateien, die keine Datenbanken sind,
  erstellt Snapshots von Datenbanken mit `VACUUM INTO`, lässt aktive WAL-/SHM-Sidecar-Dateien aus, zeichnet
  Snapshot-Metadaten im Archivmanifest auf und speichert
  abgeschlossene Sicherungsläufe zusammen mit dem Archivmanifest in SQLite. `openclaw backup
create` validiert das geschriebene Archiv standardmäßig; `--no-verify` ist der
  explizite Schnellpfad.
- `openclaw backup restore` validiert das Archiv vor der Extraktion, verwendet das
  normalisierte Manifest des Prüfers erneut und stellt verifizierte Manifestressourcen unter ihren
  aufgezeichneten Quellpfaden wieder her. Für Schreibvorgänge ist `--yes` erforderlich; `--dry-run`
  wird für einen Wiederherstellungsplan unterstützt.
- Der alte Filter für flüchtige Sicherungspfade wurde gelöscht. Die Sicherung benötigt keine
  Ausschlussliste für die Live-Archivierung von Legacy-JSON-/JSONL-Dateien für Sitzungen oder Cron mehr, da SQLite-
  Snapshots vor der Archiverstellung bereitgestellt werden.
- Die einfache Einrichtung und die Vorbereitung des Arbeitsbereichs beim Onboarding erstellen keine
  `agents/<agentId>/sessions/`-Verzeichnisse mehr. Sie erstellen nur die Konfiguration und den Arbeitsbereich;
  SQLite-Sitzungszeilen und Transkriptzeilen werden bei Bedarf in der
  agentspezifischen Datenbank erstellt.
- Die Reparatur von Sicherheitsberechtigungen zielt jetzt auf die globale und die agentspezifischen SQLite-
  Datenbanken sowie auf WAL/SHM-Begleitdateien statt auf `sessions.json` und Transkript-
  JSONL-Dateien.
- Die Laufzeitnamen der Sandbox-Registry beschreiben jetzt direkt die Arten der SQLite-Registry,
  statt die veraltete JSON-Registry-Terminologie im aktiven Speicher weiterzuführen.
- `openclaw reset --scope config+creds+sessions` entfernt agentspezifische
  `openclaw-agent.sqlite`-Datenbanken sowie WAL/SHM-Begleitdateien und nicht nur veraltete
  `sessions/`-Verzeichnisse.
- Die aggregierten Sitzungshilfsfunktionen des Gateway verwenden jetzt eintragsorientierte Namen:
  `loadCombinedSessionEntriesForGateway` gibt `{ databasePath, entries }` zurück.
  Die alte Benennung des kombinierten Speichers wurde aus den Laufzeitaufrufern entfernt.
- Das Seeding des Docker-MCP-Kanals schreibt jetzt die Hauptsitzungszeile und Transkript-
  ereignisse in die agentspezifische SQLite-Datenbank, statt
  `sessions.json` und ein JSONL-Transkript zu erstellen.
- Der gebündelte Session-Memory-Hook löst den Kontext der vorherigen Sitzung jetzt anhand von
  `{agentId, sessionId}` aus SQLite auf. Er durchsucht, speichert oder synthetisiert keine
  Transkriptpfade oder `workspace/sessions`-Verzeichnisse mehr.
- Der gebündelte Command-Logger-Hook schreibt Befehlsauditzeilen jetzt in die gemeinsame
  SQLite-Tabelle `command_log_entries`, statt sie an
  `logs/commands.log` anzuhängen.
- Zulassungslisten für die Kanalkopplung stellen zur Laufzeit jetzt nur noch SQLite-gestützte Lese-/Schreibhilfsfunktionen
  bereit. Der veraltete Pfadauflöser des Plugin-SDK bleibt zur
  Migrationskompatibilität erhalten; Dateileser befinden sich ausschließlich im Doctor-Code für die Zustandsmigration.
- `migration_runs` zeichnet Ausführungen der Migration veralteter Zustände mit Status,
  Zeitstempeln und JSON-Berichten auf.
- `migration_sources` zeichnet jede importierte Quelle einer veralteten Datei mit Hash, Größe,
  Datensatzanzahl, Zieltabelle, Ausführungs-ID, Status und Zustand der Quellentfernung auf.
- `backup_runs` zeichnet Pfade von Sicherungsarchiven, Status und JSON-Manifeste auf.
- Das globale Schema enthält keine ungenutzte Registry-Tabelle `agents`. Die Ermittlung von Agent-
  Datenbanken ist die kanonische `agent_databases`-Registry, bis die Laufzeit
  einen echten Besitzer für Agent-Datensätze hat.
- Die generierte Konfiguration des Modellkatalogs wird in typisierten globalen SQLite-
  Zeilen `agent_model_catalogs` gespeichert, die nach Agent-Verzeichnis verschlüsselt sind. Laufzeitaufrufer verwenden
  `ensureOpenClawModelCatalog`; im Laufzeitcode gibt es keine Kompatibilitäts-API
  `models.json`. Die Implementierung schreibt in SQLite, und die eingebettete PI-Registry wird
  aus dieser gespeicherten Nutzlast initialisiert, ohne eine `models.json`-Datei zu erstellen.
- Der optionale Export `memory.qmd.sessions` liest kanonische Transkriptzeilen aus
  der agentspezifischen Datenbank und materialisiert bereinigtes Markdown unter dem QMD-Ausgangsverzeichnis
  als explizites QMD-Eingabeartefakt. QMD-Sitzungssammlungen und Zuordnungen von
  Artefaktidentitäten bleiben daher Teil der konfigurierten Brücke zum externen Werkzeug;
  sie sind kein zweiter kanonischer Transkriptspeicher.
- QMDs eigene `index.sqlite`, YAML-Sammlungskonfiguration und Modelldownloads bleiben
  Artefakte des externen Werkzeugs unter `~/.openclaw/agents/<agentId>/qmd`; sie werden nicht
  nach `plugin_blob_entries` gespiegelt. Die OpenClaw-eigene QMD-Koordination ist
  datenbankorientiert: gemeinsame `state_leases` serialisieren Einbettungen global und agentspezifische
  `state_leases` serialisieren Schreiber für Sammlung, Aktualisierung und Einbettung. Die Laufzeit erstellt keine
  QMD-Sperrbegleitdateien.
- Das optionale Plugin `memory-lancedb` erstellt
  `~/.openclaw/memory/lancedb` nicht mehr als impliziten, von OpenClaw verwalteten Speicher. Es handelt sich um ein
  externes LanceDB-Backend, das deaktiviert bleibt, bis der Betreiber ein
  explizites `dbPath` konfiguriert.
- `check:database-first-legacy-stores` schlägt bei neuem Laufzeitquellcode fehl, der
  veraltete Speichernamen mit schreibenden Dateisystem-APIs kombiniert. Die Prüfung schlägt außerdem bei Laufzeit-
  quellcode fehl, der die außer Betrieb genommenen Transkriptbrücken-Markierungen
  `transcriptLocator` oder `sqlite-transcript://...` erneut einführt. Code für Migration, Doctor, Import
  und expliziten Export außerhalb von Sitzungen bleibt zulässig. Umfassendere veraltete Vertragsnamen
  wie `sessionFile`, `storePath` und alte Fassaden aus der `SessionManager`-Dateiära
  haben weiterhin aktuelle Besitzer und benötigen separate Schutzmaßnahmen für die Migration,
  bevor sie zu einer erforderlichen Vorabprüfung werden können. Die Schutzprüfung deckt jetzt außerdem
  Laufzeitspeicher `cache/*.json`, generische
  `thread-bindings.json`-Begleitdateien, Cron-Zustands-/Ausführungsprotokoll-JSON, Konfigurationszustands-JSON,
  Neustart- und Sperrbegleitdateien, Voice-Wake-Einstellungen, Genehmigungen von Plugin-Bindungen,
  JSON des Indexes installierter Plugins, File-Transfer-Audit-JSONL, Memory-Wiki-Aktivitäts-
  protokolle, das alte gebündelte Textprotokoll `command-logger` und JSONL-
  Diagnoseoptionen für den pi-mono-Rohdatenstrom ab. Sie verbietet außerdem alte Namen veralteter Doctor-Module auf Stammebene, damit
  Kompatibilitätscode unter `src/commands/doctor/` verbleibt. Android-Debug-Handler
  verwenden außerdem logcat/In-Memory-Ausgaben, statt `camera_debug.log`- oder
  `debug_logs.txt`-Cache-Dateien bereitzustellen.

## Form des Zielschemas

Halten Sie Schemas explizit. Vom Host verwalteter Laufzeitstatus verwendet typisierte Tabellen. Plugin-eigener
opaker Status verwendet `plugin_state_entries` / `plugin_blob_entries`; es gibt keine
generische Host-Tabelle `kv`.

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
skill_upload_chunks(upload_id, byte_offset, size_bytes, chunk_blob)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, relay_origin, topic, environment, distribution, token_debug_suffix, updated_at_ms)
apns_registration_tombstones(node_id, deleted_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, gateway_context_path, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
workspace_path_aliases(alias_key, alias_path, workspace_key, workspace_path, updated_at_ms)
workspace_attestations(workspace_key, attested_at_ms, updated_at_ms)
workspace_generated_bootstrap_hashes(workspace_key, filename, sha256)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, agent_id, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json, cleanup_pending)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
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
memory_index_sources(id, path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

`memory_index_sources.id` ist der stabile ganzzahlige Primärschlüssel; `(path, source)` bleibt eindeutig.

Eine zukünftige Suche kann FTS-Tabellen hinzufügen, ohne die kanonischen Ereignistabellen zu ändern:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Große Werte sollten `blob`-Spalten statt JSON-Zeichenfolgenkodierung verwenden. Behalten Sie
`value_json` für kleine strukturierte Daten bei, die mit einfachen
SQLite-Werkzeugen einsehbar bleiben müssen.

`agent_databases` ist die kanonische Registry für diesen Branch. Fügen Sie keine
Tabelle `agents` hinzu, bis ein echter Eigentümer für Agent-Datensätze vorhanden ist; die Agent-Konfiguration verbleibt in
`openclaw.json`.

## Form der Doctor-Migration

Doctor sollte einen expliziten Migrationsschritt aufrufen, über den berichtet werden kann und der sicher
erneut ausgeführt werden kann:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` ruft die Implementierung der Statusmigration nach
der üblichen Vorabprüfung der Konfiguration auf und erstellt vor dem Import eine verifizierte Sicherung. Der Start der
Laufzeit und `openclaw migrate` dürfen keine veralteten OpenClaw-Statusdateien importieren.

Migrationseigenschaften:

- Ein Migrationsdurchlauf ermittelt alle veralteten Dateiquellen und erstellt einen Plan,
  bevor Änderungen vorgenommen werden.
- Doctor erstellt vor dem Import
  veralteter Dateien ein verifiziertes Sicherungsarchiv des Zustands vor der Migration.
- Importe sind idempotent und werden anhand von Quellpfad, mtime, Größe, Hash und Zieltabelle
  bestimmt.
- Erfolgreich verarbeitete Quelldateien werden entfernt oder archiviert, nachdem die Zieldatenbank
  den Commit durchgeführt hat.
- Fehlgeschlagene Importe lassen die Quelle unverändert und zeichnen eine Warnung in
  `migration_runs` auf.
- Der Laufzeitcode liest nur aus SQLite, nachdem die Migration vorhanden ist.
- Es ist kein Downgrade- oder Exportpfad zu Laufzeitdateien erforderlich.

## Migrationsinventar

Verschieben Sie Folgendes in die globale Datenbank:

- Laufzeitschreibvorgänge der Task-Registry verwenden jetzt die gemeinsame Datenbank; der nicht veröffentlichte
  `tasks/runs.sqlite`-Sidecar-Importer wurde gelöscht. Snapshot-Speicherungen führen anhand der Task-
  ID ein Upsert durch und löschen nur fehlende Task-/Auslieferungszeilen.
- Laufzeitschreibvorgänge von Task Flow verwenden jetzt die gemeinsame Datenbank; der nicht veröffentlichte
  `tasks/flows/registry.sqlite`-Sidecar-Importer wurde gelöscht. Snapshot-Speicherungen
  führen anhand der Flow-ID ein Upsert durch und löschen nur fehlende Flow-Zeilen.
- Laufzeitschreibvorgänge des Plugin-Zustands verwenden jetzt die gemeinsame Datenbank; der nicht veröffentlichte
  `plugin-state/state.sqlite`-Sidecar-Importer wurde gelöscht.
- Die integrierte Speichersuche verwendet nicht mehr standardmäßig `memory/<agentId>.sqlite`; ihre
  Indextabellen befinden sich in der Datenbank des zuständigen Agenten, und die explizite
  Aktivierung des `memorySearch.store.path`-Sidecars wurde in die doctor-Konfigurationsmigration
  verlagert.
- Die integrierte Neuindizierung des Speichers setzt nur speichereigene Tabellen in der Agentendatenbank zurück.
  Sie darf nicht die gesamte SQLite-Datei ersetzen, da dieselbe Datenbank
  Sitzungen, Transkripte, VFS-Zeilen, Artefakte und Laufzeit-Caches enthält.
- Sandbox-Container-/Browser-Registrys wurden aus monolithischem und aufgeteiltem JSON migriert. Laufzeit-
  schreibvorgänge verwenden jetzt die gemeinsame Datenbank; der Import älterer JSON-Daten bleibt bestehen.
- Cron-Auftragsdefinitionen, Zeitplanzustand und Ausführungsverlauf verwenden jetzt gemeinsames SQLite;
  doctor importiert/entfernt ältere Dateien vom Typ `jobs.json`, `jobs-state.json` und
  `cron/runs/*.jsonl`
- Geräteidentität/-authentifizierung, Push, Aktualisierungsprüfung, Commitments, OpenRouter-Modell-
  Cache, Index installierter Plugins und App-Server-Bindungen
- Geräte-/Node-Kopplungs- und Bootstrap-Datensätze verwenden jetzt typisierte SQLite-Tabellen
- Abonnenten von Benachrichtigungen zur Gerätekopplung und Markierungen zugestellter Anfragen verwenden jetzt die
  gemeinsame SQLite-Tabelle für den Plugin-Zustand anstelle von `device-pair-notify.json`.
- Anrufdatensätze für Sprachanrufe verwenden jetzt die gemeinsame SQLite-Tabelle für den Plugin-Zustand im
  Namensraum `voice-call` / `calls` anstelle von `calls.jsonl`; die Plugin-CLI
  verfolgt und fasst den SQLite-gestützten Anrufverlauf zusammen.
- QQBot-Gateway-Sitzungen, Datensätze bekannter Benutzer und der Ref-Index-Zitat-Cache verwenden jetzt
  den SQLite-Plugin-Zustand in `qqbot`-Namensräumen (`gateway-sessions`,
  `known-users`, `ref-index`) anstelle von `session-*.json`, `known-users.json`
  und `ref-index.jsonl`. Diese älteren Dateien sind Caches und werden nicht migriert.
- Discord-Modellauswahl-Einstellungen, Hashes der Befehlsbereitstellung und Thread-Bindungen
  verwenden jetzt den SQLite-Plugin-Zustand in `discord`-Namensräumen
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  anstelle von `model-picker-preferences.json`, `command-deploy-cache.json` und
  `thread-bindings.json`; die Discord-doctor-/Einrichtungsmigration importiert und
  entfernt die älteren Dateien.
- BlueBubbles-Aufhol-Cursor und Markierungen zur Deduplizierung eingehender Daten verwenden jetzt den SQLite-Plugin-
  Zustand in `bluebubbles`-Namensräumen (`catchup-cursors`, `inbound-dedupe`)
  anstelle von `bluebubbles/catchup/*.json` und
  `bluebubbles/inbound-dedupe/*.json`; die BlueBubbles-doctor-/Einrichtungsmigration
  importiert und entfernt die älteren Dateien.
- Telegram-Aktualisierungs-Offsets, Sticker-Cache-Einträge, Nachrichten-Cache-
  Einträge für Antwortketten, Cache-Einträge gesendeter Nachrichten, Cache-Einträge für Themennamen und Thread-
  Bindungen verwenden jetzt den SQLite-Plugin-Zustand in `telegram`-Namensräumen
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) anstelle von `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` und
  `thread-bindings-*.json`; die Telegram-doctor-/Einrichtungsmigration importiert und
  entfernt die älteren Dateien.
- iMessage-Aufhol-Cursor, Zuordnungen kurzer Antwort-IDs und Deduplizierungszeilen für gesendete Echos
  verwenden jetzt den SQLite-Plugin-Zustand in `imessage`-Namensräumen (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) anstelle von `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` und `imessage/sent-echoes.jsonl`; die iMessage-
  doctor-/Einrichtungsmigration importiert und entfernt die älteren Dateien.
- Microsoft Teams-Unterhaltungen, Umfragen, SSO-Token und Feedback-Erkenntnisse
  verwenden jetzt SQLite-Namensräume für den Plugin-Zustand (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) anstelle von `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` und `*.learnings.json`; die
  Microsoft Teams-doctor-/Einrichtungsmigration importiert und archiviert die älteren Dateien.
  Ausstehende Uploads sind ein kurzlebiger SQLite-Cache, und ältere JSON-Cache-Dateien werden
  nicht migriert.
- Matrix-Synchronisierungs-Cache, Speichermetadaten, Thread-Bindungen, Markierungen zur Deduplizierung eingehender Daten,
  Abklingzustand der Startüberprüfung, Anmeldedaten, Wiederherstellungsschlüssel und
  IndexedDB-Krypto-Snapshots des SDK verwenden jetzt SQLite-Namensräume für Plugin-Zustand/-Blobs unter
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`,
  `matrix.inbound-dedupe.*` über die beanspruchbare Deduplizierung im Kern,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  anstelle von `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` und `crypto-idb-snapshot.json`; die Matrix-doctor-/Einrichtungs-
  migration importiert und entfernt diese älteren Dateien (sowie die ausgemusterten wurzelspezifischen
  SQLite-Zeilen `inbound-dedupe`) aus kontobezogenen Matrix-Speicherwurzeln.
- Nostr-Bus-Cursor und der Veröffentlichungszustand von Profilen verwenden jetzt den SQLite-Plugin-Zustand in
  `nostr`-Namensräumen (`bus-state`, `profile-state`) anstelle von
  `bus-state-*.json` und `profile-state-*.json`; die Nostr-doctor-/Einrichtungs-
  migration importiert und entfernt die älteren Dateien.
- Active Memory-Sitzungsumschalter verwenden jetzt den SQLite-Plugin-Zustand unter
  `active-memory/session-toggles` anstelle von `session-toggles.json`.
- Vorschlagswarteschlangen und Überprüfungszähler von Skill Workshop verwenden jetzt den SQLite-Plugin-Zustand
  unter `skill-workshop/proposals` und `skill-workshop/reviews` anstelle
  arbeitsbereichsspezifischer `skill-workshop/<workspace>.json`-Dateien.
- Warteschlangen für ausgehende Zustellungen und Sitzungszustellungen verwenden jetzt gemeinsam die globale SQLite-
  Tabelle `delivery_queue_entries` unter getrennten Warteschlangennamen
  (`outbound-delivery`, `session-delivery`) anstelle dauerhafter
  Dateien vom Typ `delivery-queue/*.json`, `delivery-queue/failed/*.json` und
  `session-delivery-queue/*.json`. Der doctor-Schritt für ältere Zustände importiert
  ausstehende und fehlgeschlagene Zeilen, entfernt veraltete Zustellungsmarkierungen und löscht nach dem Import die alten
  JSON-Dateien. Felder für aktives Routing und Wiederholungsversuche sind typisierte Spalten; die
  JSON-Nutzlast bleibt nur für Wiedergabe/Debugging erhalten.
- ACPX-Prozess-Leases verwenden jetzt den SQLite-Plugin-Zustand unter `acpx/process-leases`
  anstelle von `process-leases.json`.
- Metadaten von Sicherungs- und Migrationsläufen

Folgendes in Agentendatenbanken verschieben:

- Agentensitzungswurzeln und kompatibilitätsförmige Nutzlasten von Sitzungseinträgen. Für
  Laufzeitschreibvorgänge abgeschlossen: Aktive Sitzungsmetadaten können in `sessions` abgefragt werden, während die
  vollständige ältere Nutzlast `SessionEntry` in `session_entries` verbleibt.
- Agententranskriptereignisse. Für Laufzeitschreibvorgänge abgeschlossen.
- Compaction-Prüfpunkte und Transkript-Snapshots. Für Laufzeitschreibvorgänge abgeschlossen:
  Transkriptkopien von Prüfpunkten sind SQLite-Transkriptzeilen, und Prüfpunkt-
  metadaten werden in `transcript_snapshots` aufgezeichnet. Gateway-Prüfpunkt-Hilfsfunktionen
  bezeichnen diese Werte jetzt als Transkript-Snapshots statt als Quelldateien.
- Scratch-/Arbeitsbereichs-Namensräume des Agenten-VFS. Für VFS-Laufzeitschreibvorgänge abgeschlossen.
- Nutzlasten von Unteragenten-Anhängen. Für Laufzeitschreibvorgänge abgeschlossen: Sie sind SQLite-VFS-
  Seed-Einträge und niemals dauerhafte Arbeitsbereichsdateien.
- Werkzeugartefakte. Für Laufzeitschreibvorgänge abgeschlossen.
- Ausführungsartefakte. Für Worker-Laufzeitschreibvorgänge über die agentenspezifische
  Tabelle `run_artifacts` abgeschlossen.
- Agentenlokale Laufzeit-Caches. Für bereichsbezogene Cache-Schreibvorgänge der Worker-Laufzeit über
  die agentenspezifische Tabelle `cache_entries` abgeschlossen. Gateway-weite Modell-Caches bleiben in der
  globalen Datenbank, sofern sie nicht agentenspezifisch werden.
- ACP-Protokolle übergeordneter Streams. Für Laufzeitschreibvorgänge abgeschlossen.
- ACP-Sitzungen des Wiedergabe-Ledgers. Für Laufzeitschreibvorgänge über
  `acp_replay_sessions` und `acp_replay_events` abgeschlossen; das ältere `acp/event-ledger.json`
  bleibt nur als doctor-Eingabe bestehen.
- ACP-Sitzungsmetadaten. Für Laufzeitschreibvorgänge über `acp_sessions` abgeschlossen; ältere
  `entry.acp`-Blöcke in `sessions.json` dienen nur als Eingabe für die doctor-Migration.
- Trajektorien-Sidecars, wenn es sich nicht um explizite Exportdateien handelt. Für Laufzeit-
  schreibvorgänge abgeschlossen: Die Trajektorienerfassung schreibt `trajectory_runtime_events`-Zeilen
  in die Agentendatenbank und spiegelt ausführungsbezogene Artefakte in SQLite. Ältere Sidecars dienen nur als doctor-
  Importeingaben; der Export kann neue JSONL-Ausgaben für Support-Pakete erzeugen,
  liest oder migriert ältere Trajektorien-/Transkript-Sidecars jedoch nicht zur Laufzeit.
  Die Trajektorienerfassung zur Laufzeit stellt den SQLite-Bereich bereit; JSONL-Pfad-Hilfsfunktionen sind
  auf Export-/Debug-Unterstützung beschränkt und werden nicht erneut aus dem Laufzeitmodul exportiert.
  Trajektorienmetadaten des eingebetteten Runners zeichnen die Identität `{agentId, sessionId, sessionKey}`
  auf, statt einen Transkript-Locator dauerhaft zu speichern.

Folgendes vorerst dateibasiert belassen:

- `openclaw.json`
- Provider- oder CLI-Anmeldedatendateien
- Plugin-/Paketmanifeste
- Benutzerarbeitsbereiche und Git-Repositorys, wenn der Festplattenmodus ausgewählt ist
- Protokolle, die für die laufende Überwachung durch Bediener vorgesehen sind, sofern keine bestimmte Protokolloberfläche verschoben wird

## Migrationsplan

### Phase 0: Grenze einfrieren

Die Grenze für dauerhaften Zustand explizit festlegen, bevor weitere Zeilen verschoben werden:

- Eine Tabelle `migration_runs` zur globalen Datenbank hinzufügen.
  Für Ausführungsberichte zur Migration älterer Zustände abgeschlossen.
- Einen einzigen doctor-eigenen Zustandsmigrationsdienst für den Import von Dateien in die Datenbank hinzufügen.
  Abgeschlossen: `openclaw doctor --fix` verwendet die Implementierung für die Migration älterer Zustände.
- `plan` schreibgeschützt machen und `apply` eine Sicherung erstellen, importieren und verifizieren lassen sowie
  anschließend alte Dateien löschen oder unter Quarantäne stellen.
  Abgeschlossen: doctor erstellt eine verifizierte Sicherung vor der Migration, übergibt den Sicherungspfad
  an `migration_runs` und verwendet die Importer-/Entfernungspfade erneut.
- Statische Verbote hinzufügen, damit neuer Laufzeitcode keine älteren Zustandsdateien schreiben kann,
  während Migrationscode und Tests sie weiterhin anlegen/lesen können.
  Für die derzeit migrierten älteren Speicher abgeschlossen; die Schutzprüfung durchsucht außerdem verschachtelte
  Tests nach verbotenen Verträgen für Laufzeit-Transkript-Locators.

### Phase 1: Globale Steuerungsebene fertigstellen

Gemeinsamen Koordinationszustand in `state/openclaw.sqlite` belassen:

- Agenten und Registrierung der Agentendatenbanken
- Task- und Task Flow-Ledger
- Plugin-Zustand
- Sandbox-Container-/Browser-Registry
- Ausführungsverlauf von Cron/Zeitplaner
- Kopplung, Gerät, Push, Aktualisierungsprüfung, TUI, OpenRouter-/Modell-Caches und anderer
  kleiner Gateway-bezogener Laufzeitzustand
- Sicherungs- und Migrationsmetadaten
- Bytes von Gateway-Medienanhängen. Für Laufzeitschreibvorgänge abgeschlossen; direkte Dateipfade
  sind temporäre Materialisierungen für die Kompatibilität mit Kanal-Absendern und Sandbox-
  Staging. Laufzeit-Zulassungslisten akzeptieren SQLite-Materialisierungspfade, nicht ältere
  Zustands-/Konfigurations-Medienwurzeln. doctor importiert ältere Mediendateien in
  `media_blobs` und entfernt die Quelldateien nach erfolgreichen Zeilenschreibvorgängen.
- Debug-Proxy-Erfassungssitzungen, Ereignisse und Nutzlast-Blobs. Abgeschlossen: Erfassungen befinden sich
  in der gemeinsamen Zustandsdatenbank und werden über Bootstrap, Schema,
  WAL und Einstellungen für das Zeitlimit bei Belegung der gemeinsamen Zustandsdatenbank geöffnet. Nutzlast-Bytes werden in
  `capture_blobs.data` mit gzip komprimiert; es gibt keine Laufzeit-Sidecar-Datenbanküberschreibung für den Debug-Proxy,
  kein Blob-Verzeichnis und kein ausschließlich für Proxy-Erfassungen generiertes Schema-/Codegen-Ziel.
  Die doctor-/Startmigration importiert veröffentlichte `debug-proxy/capture.sqlite`-Zeilen
  und referenzierte Nutzlast-Blobs einschließlich aktiver älterer Umgebungsüberschreibungen für Datenbank/Blobs
  und archiviert anschließend diese Quellen, während CA-Zertifikate erhalten bleiben.

Diese Phase entfernt außerdem doppelte Sidecar-Öffnungsfunktionen, Berechtigungs-Helper, die WAL-Einrichtung, Dateisystembereinigung und Kompatibilitätsschreiber aus diesen Subsystemen.

### Phase 2: Datenbanken pro Agent einführen

Erstellen Sie eine Datenbank pro Agent und registrieren Sie sie über die globale DB:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Die globale `agent_databases`-Zeile speichert den Pfad, die Schemaversion, den Zeitstempel der letzten Sichtung sowie grundlegende Größen- und Integritätsmetadaten. Laufzeitcode fragt die Registry nach der Agent-DB, statt Dateipfade direkt abzuleiten.

Die Agent-DB verwaltet:

- `sessions` als kanonischen Sitzungsstamm, wobei `session_entries` die an diesen Stamm angehängte Payload-Tabelle in Kompatibilitätsform ist und
  `session_routes` als eindeutige aktive `session_key`-Suche dient
- `conversations` und `session_conversations` als normalisierte, Sitzungen zugeordnete
  Provider-Routing-Identität
- `transcript_events`
- Transkript-Snapshots und Compaction-Prüfpunkte. Für Laufzeitschreibvorgänge erledigt.
- `vfs_entries`
- `tool_artifacts` und Ausführungsartefakte
- Agent-lokale Laufzeit-/Cache-Zeilen. Für Worker-bezogene Caches erledigt.
- Ereignisse des übergeordneten ACP-Streams
- Trajektorien-Laufzeitereignisse, wenn sie keine expliziten Exportartefakte sind

### Phase 3: Sitzungs-Store-APIs ersetzen

Für die Laufzeit erledigt. Die dateiförmige Oberfläche des Sitzungs-Stores ist kein aktiver Laufzeitvertrag:

- Die Laufzeit ruft `loadSessionStore(storePath)` nicht mehr auf und behandelt `storePath` nicht mehr als
  Sitzungsidentität.
- Laufzeit-Zeilenoperationen sind `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` und `listSessionEntries`.
- Helper zum vollständigen Neuschreiben des Stores, Dateischreiber, Warteschlangentests, Alias-Bereinigung und
  Parameter zum Löschen veralteter Schlüssel wurden aus der Laufzeit entfernt.
- Veraltete Kompatibilitätsexporte des Root-Pakets delegieren bis zum 2026-10-12 an den ausschließlich für Doctor vorgesehenen
  `sessions.json`-Importer; Kompatibilitätslesevorgänge des Plugin SDK
  projizieren weiterhin kanonische SQLite-Zeilen.
- Das Parsen von `sessions.json` verbleibt ausschließlich im Doctor-Migrations-/Importcode und
  in Doctor-Tests.
- Fallback-Lesevorgänge des Laufzeitlebenszyklus lesen SQLite-Transkript-Header, nicht die ersten
  JSONL-Zeilen.

Entfernen Sie weiterhin alles, was Dateisperrparameter, Begriffe zur Bereinigung/Kürzung als Dateiwartung, Store-Pfade als Identität oder Tests wieder einführt, deren einzige Aussage die JSON-Persistenz betrifft.

### Phase 4: Transkripte, ACP-Streams, Trajektorien und VFS verschieben

Machen Sie jeden Agent-Datenstrom datenbanknativ:

- Schreibvorgänge zum Anhängen an Transkripte erfolgen über eine einzelne SQLite-Transaktion, die den
  Sitzungs-Header sicherstellt, die Nachrichtenidempotenz prüft, das übergeordnete Ende auswählt, in
  `transcript_events` einfügt und abfragbare Identitätsmetadaten in
  `transcript_event_identities` erfasst. Für direktes Anhängen von Transkriptnachrichten und
  normales persistiertes Anhängen von `TranscriptSessionManager` erledigt; explizite Branch-
  Operationen behalten ihre explizite Wahl des übergeordneten Elements bei und schreiben weiterhin SQLite-Zeilen,
  ohne einen Dateilokator abzuleiten.
- Protokolle übergeordneter ACP-Streams werden zu Zeilen statt zu `.acp-stream.jsonl`-Dateien. Erledigt.
- Die ACP-Spawn-Einrichtung persistiert keine Transkript-JSONL-Pfade mehr. Erledigt.
- Die Laufzeit-Trajektorienerfassung schreibt Ereigniszeilen/Artefakte direkt. Der explizite
  Support-/Exportbefehl kann weiterhin JSONL-Artefakte für Support-Pakete als
  Exportformat erzeugen, aber der Sitzungsexport erstellt kein Sitzungs-JSONL neu. Erledigt.
- Festplattenbasierte Arbeitsbereiche verbleiben auf der Festplatte, wenn der Festplattenmodus konfiguriert ist.
- VFS-Scratch und der experimentelle, ausschließlich VFS-basierte Arbeitsbereichsmodus verwenden die Agent-DB.

Die Migration importiert alte JSONL-Dateien einmalig, zeichnet Anzahlen/Hashes in
`migration_runs` auf und entfernt importierte Dateien nach Integritätsprüfungen.

### Phase 5: Sicherung, Wiederherstellung, Vacuum und Verifizierung

Sicherungen bleiben eine einzelne Archivdatei:

- Erstellen Sie einen Prüfpunkt für jede globale und jede Agent-Datenbank.
- Erstellen Sie einen Snapshot jeder DB mit SQLite-Sicherungssemantik oder `VACUUM INTO`.
- Archivieren Sie kompakte DB-Snapshots, Konfiguration, externe Anmeldedaten und angeforderte
  Arbeitsbereichsexporte.
- Lassen Sie unverarbeitete aktive `*.sqlite-wal`- und `*.sqlite-shm`-Dateien aus.
- Verifizieren Sie, indem Sie jeden DB-Snapshot öffnen und `PRAGMA integrity_check` ausführen.
  `openclaw backup create` führt diese Archivverifizierung standardmäßig durch;
  `--no-verify` überspringt nur den Archivdurchlauf nach dem Schreiben, nicht die Integritätsprüfung
  bei der Snapshot-Erstellung.
- Die Wiederherstellung kopiert Snapshots an ihre Zielpfade zurück. Wiederhergestellte globale DBs verwenden
  Version `1`; wiederhergestellte Agent-DBs verwenden Version `2`, wobei Snapshots der Version `1`
  beim Öffnen atomar aktualisiert werden.

### Phase 6: Worker-Laufzeit

Belassen Sie den Worker-Modus im experimentellen Zustand, während die Datenbankaufteilung umgesetzt wird:

- Worker erhalten Agent-ID, Ausführungs-ID, Dateisystemmodus und DB-Registry-Identität.
- Jeder Worker öffnet seine eigene SQLite-Verbindung.
- Der übergeordnete Prozess behält die Zuständigkeit für Kanalauslieferung, Genehmigungen, Konfiguration und Abbruch.
- Beginnen Sie mit einem Worker pro aktiver Ausführung; fügen Sie Pooling erst hinzu, nachdem Lebenszyklus und
  Eigentümerschaft der DB-Verbindung stabil sind.

### Phase 7: Die alte Welt entfernen

Für die Laufzeit-Sitzungsverwaltung erledigt. Die alte Welt ist nur als explizite
Doctor-Eingabe oder Support-/Exportausgabe zulässig:

- Keine Laufzeitschreibvorgänge für `sessions.json`, Transkript-JSONL, Sandbox-Registry-JSON, Task-
  Sidecar-SQLite oder Plugin-Zustands-Sidecar-SQLite.
- Keine Bereinigung von JSON-/Sitzungsdateien, Kürzung von Transkriptdateien, Sperren von Sitzungsdateien
  oder sitzungssperrenförmige Tests.
- Keine Laufzeit-Kompatibilitätsexporte, deren Zweck darin besteht, alte Sitzungsdateien
  aktuell zu halten.
- Explizite Support-Exporte bleiben vom Benutzer angeforderte Archivierungs-/Materialisierungsformate
  und dürfen Dateinamen nicht in die Laufzeitidentität zurückführen.

## Sicherung und Wiederherstellung

Sicherungen sollten eine einzelne Archivdatei sein, die Datenbankerfassung sollte jedoch
SQLite-nativ erfolgen:

1. Beenden Sie lang andauernde Schreibaktivitäten oder richten Sie eine kurze Sicherungsbarriere ein.
2. Führen Sie für jede globale und jede Agent-Datenbank einen Prüfpunkt aus.
3. Erstellen Sie mit `VACUUM INTO` Snapshots der Datenbanken in einem temporären Sicherungsverzeichnis.
   Plugin-Schemas, die vom Eigentümer definierte SQLite-Funktionen erfordern, schlagen geschlossen fehl,
   bis der Eigentümer einen sicheren Snapshot-Vertrag bereitstellt.
4. Archivieren Sie die Datenbank-Snapshots, die Konfigurationsdatei, das Anmeldedatenverzeichnis, ausgewählte
   Arbeitsbereiche und ein Manifest.
5. Verifizieren Sie die Dateiform jedes SQLite-Snapshots, öffnen Sie anschließend kanonische OpenClaw-
   Datenbanken und führen Sie `PRAGMA integrity_check` sowie eine Rollenvalidierung aus. Dedizierte
   Plugin-Schemas bleiben undurchsichtig, sofern ihr Eigentümer keinen Verifizierer bereitstellt.
   `openclaw backup create` führt dies standardmäßig durch; `--no-verify` dient nur zum
   absichtlichen Überspringen des Archivdurchlaufs nach dem Schreiben.

Verlassen Sie sich nicht auf unverarbeitete Kopien aktiver `*.sqlite`-, `*.sqlite-wal`- und `*.sqlite-shm`-Dateien als
primäres Sicherungsformat. Das Archivmanifest sollte Datenbankrolle,
Agent-ID, Schemaversion, Quellpfad, Snapshot-Pfad, Bytegröße und Integritätsstatus
aufzeichnen.

Die Wiederherstellung sollte die globale Datenbank und die Agent-Datenbankdateien aus den
Archiv-Snapshots neu aufbauen. Das globale Schema bleibt bei Version `1`; Agent-Snapshots der Version `1`
erhalten das begrenzte Laufzeit-Upgrade auf Version `2`. Doctor bleibt
der einzige Eigentümer des Datei-zu-Datenbank-Imports. Der Wiederherstellungsbefehl validiert zunächst das
Archiv und ersetzt anschließend jedes Manifest-Asset durch die verifizierte extrahierte
Payload.

## Plan zur Laufzeit-Refaktorierung

1. Fügen Sie Datenbank-Registry-APIs hinzu.
   - Lösen Sie globale DB- und Agent-DB-Pfade auf.
   - Belassen Sie das globale Schema bei `user_version = 1`. Agent-DBs verwenden Version `2`
     mit einer atomaren Migration von der ausgelieferten Memory-Source-Form der Version `1`.
   - Fügen Sie Schließ-, Prüfpunkt- und Integritäts-Helper hinzu, die von Tests, Sicherung und Doctor verwendet werden.

2. Fassen Sie Sidecar-SQLite-Stores zusammen.
   - Verschieben Sie Plugin-Zustandstabellen in die globale Datenbank. Für Laufzeit-
     schreibvorgänge erledigt; der nicht ausgelieferte veraltete Sidecar-Importer wurde entfernt.
   - Verschieben Sie Task-Registry-Tabellen in die globale Datenbank. Für Laufzeit-
     schreibvorgänge erledigt; der nicht ausgelieferte veraltete Sidecar-Importer wurde entfernt.
   - Verschieben Sie Task-Flow-Tabellen in die globale Datenbank. Für Laufzeitschreibvorgänge erledigt;
     der nicht ausgelieferte veraltete Sidecar-Importer wurde entfernt.
   - Verschieben Sie integrierte Memory-Search-Tabellen in jede Agent-Datenbank. Erledigt; explizites
     benutzerdefiniertes `memorySearch.store.path` wird nun durch die Doctor-Konfigurationsmigration entfernt.
     Die vollständige Neuindizierung wird direkt ausschließlich für Memory-Tabellen ausgeführt; der alte Pfad zum Austausch
     der gesamten Datei und der Sidecar-Indexaustausch-Helper wurden entfernt.
   - Entfernen Sie doppelte Datenbank-Öffnungsfunktionen, WAL-Einrichtung, Berechtigungs-Helper und
     Schließpfade aus diesen Subsystemen.

3. Verschieben Sie Agent-eigene Tabellen in Agent-Datenbanken.
   - Erstellen Sie die Agent-DB bei Bedarf über die Registry der globalen Datenbank. Erledigt.
   - Verschieben Sie Laufzeit-Sitzungseinträge, Transkriptereignisse, VFS-Zeilen und Tool-
     Artefakte in Agent-DBs. Erledigt.
   - Migrieren Sie keine Branch-lokalen Sitzungs-
     einträge, Transkriptereignisse, VFS-Zeilen oder Tool-Artefakte aus gemeinsam genutzten DBs; dieses Layout wurde nie ausgeliefert. Behalten Sie ausschließlich den veralteten
     Datei-zu-Datenbank-Import in Doctor bei.

4. Ersetzen Sie die Sitzungs-Store-APIs.
   - Entfernen Sie `storePath` als Laufzeitidentität. Für die Laufzeit erledigt und durch
     `check:database-first-legacy-stores` abgesichert: Sitzungsmetadaten, Routenaktualisierungen,
     Befehlspersistenz, CLI-Sitzungsbereinigung, Feishu-Vorschauen für Schlussfolgerungen,
     Persistenz des Transkriptzustands, Subagent-Tiefe, sitzungsbezogene
     Überschreibungen von Authentifizierungsprofilen, Parent-Fork-Logik und QA-Lab-Inspektion lösen nun die
     Datenbank anhand kanonischer Agent-/Sitzungsschlüssel auf.
     Gateway-/TUI-/UI-/macOS-Antworten für Sitzungslisten stellen nun `databasePath`
     statt des veralteten `path` bereit; macOS-Debug-Oberflächen zeigen die Agent-Datenbank
     als schreibgeschützten Zustand an, statt die `session.store`-Konfiguration zu schreiben.
     `/status`, chatgesteuerter Trajektorienexport und CLI-Abhängigkeits-Proxys
     geben veraltete Store-Pfade nicht mehr weiter; die Fallback-Ermittlung der Transkriptnutzung liest
     SQLite anhand der Agent-/Sitzungsidentität. Laufzeit- und Bridge-Tests stellen
     `storePath` nicht mehr bereit; Doctor-/Migrationseingaben besitzen diesen veralteten Feldnamen.
     Das kombinierte Laden von Sitzungen im Gateway hat keinen speziellen Laufzeit-Branch mehr für
     nicht vorlagenbasierte `session.store`-Werte; stattdessen werden Agent-SQLite-Zeilen aggregiert.
     Der veraltete Doctor-Pfad für Sitzungssperren und sein `.jsonl.lock`-Bereinigungs-Helper
     wurden entfernt; SQLite bildet nun die Nebenläufigkeitsgrenze für Sitzungen.
     Häufig verwendete Laufzeit-Aufrufstellen nutzen zeilenorientierte Helper-Namen wie
     `resolveSessionRowEntry`; der alte `resolveSessionStoreEntry`-Kompatibilitätsalias
     wurde aus den Laufzeit- und Plugin-SDK-Exporten entfernt.

- Verwenden Sie `{ agentId, sessionKey }`-Zeilenoperationen.
  Erledigt: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` und `listSessionEntries` sind SQLite-zentrierte APIs, die
  keinen Pfad zum Sitzungsspeicher benötigen. Statusübersicht, lokaler Agent-Status, Integritätsstatus
  und der Auflistungsbefehl `openclaw sessions` lesen jetzt agentenspezifische Zeilen direkt
  und zeigen agentenspezifische SQLite-Datenbankpfade statt `sessions.json`-Pfaden an.
- Ersetzen Sie das Löschen/Einfügen des gesamten Speichers durch `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` und SQL-Bereinigungsabfragen.
  Für die Laufzeit erledigt: Hotpaths verwenden jetzt Zeilen-APIs und bei Konflikten erneut versuchte Zeilen-Patches;
  die verbleibenden Hilfsfunktionen zum Importieren/Ersetzen des gesamten Speichers sind auf den Migrationsimportcode
  und Tests des SQLite-Backends beschränkt.
  - Löschen Sie `store-writer.ts` und die Tests der Schreibwarteschlange. Erledigt.
  - Entfernen Sie das laufzeitseitige Bereinigen von Legacy-Schlüsseln und Alias-Löschparameter aus
    Upserts/Patches für Sitzungszeilen. Erledigt.

5. Entfernen Sie das laufzeitseitige Verhalten der JSON-Registry.
   - Stellen Sie Lese- und Schreibvorgänge der Sandbox-Registry vollständig auf SQLite um. Erledigt.
   - Importieren Sie monolithisches und geshardetes JSON ausschließlich im Migrationsschritt. Erledigt.
   - Entfernen Sie Sperren der geshardeten Registry und JSON-Schreibvorgänge. Erledigt.

- Behalten Sie eine typisierte Registry-Tabelle bei, anstatt Registry-Zeilen als generisches
  undurchsichtiges JSON zu speichern, wenn die Struktur weiterhin Betriebszustand eines Hotpaths ist. Erledigt.

6. Entfernen Sie dateisperrenartige Sitzungsmutationen.
   - Für die Erstellung von Laufzeitsperren und die Laufzeit-Sperr-APIs erledigt.
   - Der eigenständige Legacy-Bereinigungspfad `.jsonl.lock` von Doctor wurde entfernt.
   - Die Zustandsintegrität verfügt nicht mehr über einen separaten Bereinigungspfad für verwaiste Transkriptdateien;
     die Doctor-Migration importiert/entfernt Legacy-JSONL-Quellen zentral.
   - Die Singleton-Koordination des Gateway verwendet typisierte SQLite-Zeilen `state_leases` unter
     `gateway_locks` und stellt keine Schnittstelle für ein Dateisperrenverzeichnis mehr bereit.
   - Die generische Deduplizierungspersistenz des Plugin-SDK verwendet keine Dateisperren oder JSON-Dateien
     mehr; sie schreibt gemeinsame SQLite-Zeilen für den Plugin-Zustand. Erledigt.
   - Die QMD-Koordination verwendet eine gemeinsame SQLite-Lease für Einbettungen und eine agentenspezifische
     SQLite-Lease für jeden Writer für Sammlungen/Aktualisierungen/Einbettungen. Die Laufzeit erstellt
     `qmd/embed.lock.lock` oder `agents/<agentId>/qmd-write.lock.lock` nicht mehr;
     Doctor entfernt ausschließlich eindeutig veraltete, außer Betrieb genommene Sidecars. Erledigt.

7. Machen Sie Worker datenbankfähig.
   - Worker öffnen ihre eigenen SQLite-Verbindungen.
   - Der übergeordnete Prozess ist für Zustellung, Channel-Callbacks und Konfiguration verantwortlich.
   - Der Worker erhält Agent-ID, Ausführungs-ID, Dateisystemmodus und die Identität der DB-Registry,
     keine aktiven Handles.
   - `vfs-only` bleibt experimentell und verwendet die Agent-Datenbank als Speicherwurzel.
   - Behalten Sie zunächst einen Worker pro aktiver Ausführung bei. Pooling kann warten, bis Lebensdauer
     und Abbruchverhalten der DB-Verbindungen unproblematisch sind.

8. Backup-Integration.
   - Erweitern Sie das Backup um Snapshots globaler, agentenspezifischer und Plugin-Datenbanken mit
     `VACUUM INTO`. Für erkannte `*.sqlite`-Dateien unter dem Zustands-Asset erledigt;
     Plugin-Schemas, die nicht verfügbare Fähigkeiten des Eigentümers erfordern, schlagen sicher geschlossen fehl.
   - Fügen Sie eine Backup-Verifizierung für die kanonische SQLite-Integrität und Schemaidentität
     sowie eine generische Prüfung der Dateistruktur für dedizierte Plugin-Snapshots hinzu. Für die
     Backup-Erstellung und die standardmäßige Archivverifizierung erledigt.
   - Zeichnen Sie Metadaten der Backup-Ausführung in SQLite auf. Über die gemeinsame Tabelle `backup_runs`
     mit Archivpfad, Status und Manifest-JSON erledigt.
   - Fügen Sie die Wiederherstellung aus verifizierten Archiv-Snapshots hinzu. Erledigt: `openclaw backup
restore` validiert vor dem Extrahieren, verwendet das normalisierte
     Manifest der Verifizierung, unterstützt `--dry-run` und erfordert `--yes`, bevor
     aufgezeichnete Quellpfade ersetzt werden.
   - Schließen Sie den VFS-/Workspace-Export nur auf Anforderung ein; exportieren Sie Sitzungsinterna
     nicht als JSON oder JSONL.

9. Entfernen Sie veraltete Tests und veralteten Code. Für die bekannten Laufzeit-Sitzungsoberflächen erledigt.

- Entfernen Sie Tests, die die laufzeitseitige Erstellung von `sessions.json` oder
  Transkript-JSONL-Dateien voraussetzen. Erledigt für den zentralen Sitzungsspeicher, Chat, Gateway-Transkriptereignisse,
  Vorschau, Lebenszyklus, Aktualisierungen von Befehlssitzungseinträgen, Zurücksetzen/Tracing automatischer Antworten und
  Dreaming-Fixtures von Memory-Core, Routing von Genehmigungszielen, Reparatur von Sitzungstranskripten,
  Reparatur von Sicherheitsberechtigungen, Trajektorienexport und Sitzungsexport.
  Active-Memory-Transkripttests prüfen jetzt SQLite-Gültigkeitsbereiche und stellen sicher, dass weder temporäre noch
  persistente JSONL-Dateien erstellt werden.
  Die alte Heartbeat-Regression zur Transkriptbereinigung wurde entfernt, da
  die Laufzeit JSONL-Transkripte nicht mehr kürzt.
  Tests des Werkzeugs für Agent-Sitzungslisten modellieren Legacy-Pfade `sessions.json` nicht mehr
  als Antwortstruktur des Gateway; App-/UI-/macOS-Tests verwenden `databasePath`.
  Transkriptnutzungstests für `/status` legen SQLite-Transkriptzeilen jetzt direkt an,
  anstatt JSONL-Dateien zu schreiben.
  Tests des Gateway-Sitzungslebenszyklus verwenden jetzt direkt Hilfsfunktionen zum Anlegen von SQLite-Transkripten;
  die alte Fixture-Struktur einer einzeiligen Sitzungsdatei wurde aus der Abdeckung für Zurücksetzen
  und Löschen entfernt.
  `sessions.delete` gibt kein dateizeitliches Feld `archived: []` mehr zurück; Löschvorgänge
  melden nur das Ergebnis der Zeilenmutation. Die alte Option `deleteTranscript` wurde
  ebenfalls entfernt: Beim Löschen einer Sitzung wird die kanonische Wurzel `sessions` entfernt und
  SQLite löscht sitzungseigene Transkript-, Snapshot- und Trajektorienzeilen kaskadierend, sodass kein
  Aufrufer verwaiste Transkripte hinterlassen oder einen Bereinigungszweig vergessen kann.
  Tests zur Trajektorienerfassung der Kontext-Engine lesen jetzt `trajectory_runtime_events`-Zeilen
  aus einer isolierten Agent-Datenbank, anstatt
  `session.trajectory.jsonl` zu lesen.
  Seed-Skripte für Docker-MCP-Channels legen SQLite-Zeilen jetzt direkt an. Direkte
  Schreibvorgänge in `sessions.json` sind auf Doctor-Fixtures beschränkt.
  Der Tool Search Gateway-E2E-Test liest Belege für Werkzeugaufrufe aus SQLite-Transkriptzeilen,
  anstatt `agents/<agentId>/sessions/*.jsonl`-Dateien zu durchsuchen.
  Host-Ereignisse und temporäre Sitzungskorpuszeilen von Memory-Core befinden sich jetzt im gemeinsamen
  SQLite-Plugin-Zustand; `events.jsonl` und `session-corpus/*.txt` dienen ausschließlich als Eingaben
  für die Legacy-Migration durch Doctor. Aktive Zeilen verwenden virtuelle Pfade `memory/session-ingestion/`
  und nicht `.dreams/session-corpus`. Das alte Reparaturmodul für Memory-Core-Dreaming
  und seine CLI-/Gateway-Tests wurden entfernt, da die Laufzeit nicht mehr für die
  Reparatur von Dateiarchiven dieses Korpus verantwortlich ist. Bridge-/Public-Artifact-Tests von Memory-Core
  stellen `.dreams/events.jsonl` nicht mehr bereit; sie
  verwenden den SQLite-gestützten virtuellen JSON-Artefaktnamen.
  Öffentliche SDK-/Codex-Testdokumentation spricht jetzt vom SQLite-Sitzungszustand statt von Sitzungsdateien,
  und das Channel-Turn-Beispiel stellt kein Argument `storePath` mehr bereit.
  Der Matrix-Synchronisierungszustand verwendet jetzt direkt den SQLite-Speicher für den Plugin-Zustand. Aktive
  Client-/Laufzeitverträge übergeben eine Kontospeicherwurzel, keinen Pfad `bot-storage.json`,
  und Doctor importiert das Legacy-Element `bot-storage.json` vor dem Löschen der Quelle in SQLite.
  Destruktive und Neustartszenarien für Matrix in QA Lab ändern jetzt direkt die SQLite-Synchronisierungszeile,
  anstatt fingierte `bot-storage.json`-Dateien zu erstellen oder zu löschen, und
  die E2EE-Grundlage übergibt eine Synchronisierungsspeicherwurzel statt eines fingierten
  Pfads `sync-store.json`.
  Bei der Auswahl der Matrix-Speicherwurzel werden Wurzeln nicht mehr anhand von Legacy-JSON-Dateien
  für Synchronisierung/Threads bewertet; sie verwendet dauerhafte Wurzelmetadaten sowie echten Kryptozustand.
  Die Testsuite des SQLite-Sitzungsbackends der Laufzeit erzeugt kein fingiertes
  `sessions.json` mehr; Legacy-Quell-Fixtures befinden sich jetzt in den Doctor-Tests,
  die sie importieren.
  Gateway-Sitzungstests stellen keine Hilfsfunktion `createSessionStoreDir` und
  keine ungenutzte Einrichtung temporärer Sitzungsspeicherpfade mehr bereit; Fixture-Verzeichnisse sind explizit,
  und die direkte Zeileneinrichtung verwendet die SQLite-Namensgebung für Sitzungszeilen.
  Die ausschließlich für Doctor bestimmte Abdeckung des JSON5-Parsers für Sitzungsspeicher wurde aus Infrastrukturtests
  in Doctor-Migrationstests verschoben, sodass Laufzeit-Testsuites nicht mehr für das Parsen
  von Legacy-Sitzungsdateien verantwortlich sind.
  Laufzeit-SSO-/Pending-Upload-Tests von Microsoft Teams enthalten keine JSON-Sidecar-Fixtures
  oder Parser mehr; das Parsen von Legacy-SSO-Token befindet sich ausschließlich im
  Plugin-Migrationsmodul. Telegram-Tests legen keine fingierten Speicherpfade `/tmp/*.json`
  mehr an; sie setzen den SQLite-gestützten Nachrichtencache direkt zurück. Die generische
  OpenClaw-Hilfsfunktion für den Testzustand stellt keinen Legacy-Writer `auth-profiles.json`
  mehr bereit; Doctor-Tests für die Authentifizierungsmigration verwalten dieses Fixture lokal.
  Laufzeittests für TUI-Zeiger auf die letzte Sitzung, Ausführungsgenehmigungen, Active-Memory-
  Umschalter, Matrix-Deduplizierung/Startverifizierung, Memory-Wiki-Quellsynchronisierung,
  Bindungen der aktuellen Konversation, Onboarding-Authentifizierung und Hermes-Secret-Importe
  erstellen keine alten Sidecar-Dateien mehr und prüfen nicht mehr, ob alte Dateinamen fehlen. Sie
  weisen das Verhalten anhand von SQLite-Zeilen und öffentlichen Speicher-APIs nach; ausschließlich Doctor-/Migrationstests
  dürfen Legacy-Quelldateinamen enthalten.
  Laufzeittests für Geräte-/Node-Kopplung, Channel-allowFrom, Neustartabsichten,
  Neustartübergabe, Einträge der Sitzungszustellungswarteschlange, Konfigurationsintegrität, iMessage-
  Caches, Cron-Aufträge, PI-Transkriptkopfzeilen, Subagent-Registries und verwaltete
  Bildanhänge erstellen ebenfalls keine außer Betrieb genommenen JSON-/JSONL-Dateien mehr, nur um nachzuweisen,
  dass sie ignoriert werden oder fehlen.
  Die PI-Überlaufwiederherstellung verfügt nicht mehr über einen SessionManager-Fallback zum Umschreiben/Kürzen:
  Das Kürzen von Werkzeugergebnissen und Umschreibungen von Transkripten durch die Kontext-Engine ändern
  SQLite-Transkriptzeilen und aktualisieren anschließend den aktiven Prompt-Zustand aus der Datenbank.
  Persistente SessionManager-Nachrichtenanhänge delegieren die Auswahl des übergeordneten Elements
  und die Idempotenz an die atomare SQLite-Hilfsfunktion zum Anhängen an Transkripte. Normale Anhänge
  von Metadaten/benutzerdefinierten Einträgen wählen das aktuelle übergeordnete Element ebenfalls innerhalb von SQLite aus,
  sodass veraltete Manager-Instanzen keine Parent-Chain-Race-Conditions aus der Zeit vor SQLite wiederbeleben.
  Die synthetische PI-Bereinigung am Ende für Zwischenprüfungen während eines Turns und `sessions_yield`
  kürzt den SQLite-Transkriptzustand jetzt direkt; die alte SessionManager-Brücke zum Entfernen
  des Endes und ihre Tests wurden gelöscht.
  Die Erfassung von Compaction-Prüfpunkten erstellt ebenfalls ausschließlich Snapshots aus SQLite; Aufrufer
  übergeben keinen aktiven SessionManager mehr als alternative Transkriptquelle.
- Behalten Sie Tests, die Legacy-Dateien anlegen, ausschließlich für die Migration bei.
- Der Nachweis anhand von JSON-Dateien wurde für aktive Laufzeitoberflächen durch
  Nachweise anhand von SQL-Zeilen ersetzt.

- Fügen Sie statische Verbote für Laufzeit-Schreibvorgänge in Legacy-JSON-Pfade für Sitzungen/Caches hinzu.
  Für den Repository-Guard erledigt.

10. Machen Sie den Migrationsbericht auditierbar.
    - Zeichnen Sie Migrationsausführungen in SQLite mit Start-/Endzeitstempeln, Quellpfaden,
      Quell-Hashes, Anzahlen, Warnungen und Backup-Pfad auf.
      Erledigt: Ausführungen der Legacy-Zustandsmigration speichern jetzt einen Bericht `migration_runs`
      mit Inventar der Quellpfade/-tabellen, SHA-256 der Quelldateien, Größen,
      Datensatzanzahlen, Warnungen und Backup-Pfad.
      Erledigt: Ausführungen der Legacy-Zustandsmigration speichern außerdem Zeilen `migration_sources`
      für Audits auf Quellebene und zukünftige Entscheidungen zum Überspringen/Nachtragen.
    - Gestalten Sie die Anwendung idempotent. Eine erneute Ausführung nach einem Teilimport sollte
      entweder eine bereits importierte Quelle überspringen oder anhand eines stabilen Schlüssels zusammenführen.
      Erledigt: Sitzungsindizes, Transkripte, Zustellungswarteschlangen, Plugin-Zustand, Task-
      Ledger und agenteigene globale SQLite-Zeilen werden anhand stabiler Schlüssel oder
      mit Upsert-/Ersetzungssemantik importiert, sodass erneute Ausführungen ohne Duplizierung dauerhafter
      Zeilen zusammengeführt werden.
    - Fehlgeschlagene Importe müssen die ursprüngliche Quelldatei unverändert belassen.
      Erledigt: Fehlgeschlagene Transkriptimporte belassen die ursprüngliche JSONL-Quelle jetzt
      an ihrem erkannten Pfad, und `migration_sources` zeichnet die Quelle als
      `warning` mit `removed_source=0` für die nächste Doctor-Ausführung auf.

## Leistungsregeln

- Eine Verbindung pro Thread/Prozess ist ausreichend; Handles dürfen nicht von mehreren
  Workern gemeinsam verwendet werden.
- Verwenden Sie WAL, `foreign_keys=ON`, ein Busy-Timeout von 5s und kurze `BEGIN IMMEDIATE`
  Schreibtransaktionen. Legen Sie keine synchronen Wiederholungsversuche für Sperren über
  den einzelnen Busy-Wartevorgang von SQLite.
- Halten Sie Hilfsfunktionen für Schreibtransaktionen synchron, solange keine asynchrone Transaktions-
  API explizite Mutex-/Backpressure-Semantik bereitstellt.
- Halten Sie Schreibvorgänge für die übergeordnete Zustellung klein und transaktional.
- Vermeiden Sie vollständige Neuschreibungen des Speichers; verwenden Sie Upsert/Löschen auf Zeilenebene.
- Fügen Sie Indizes für die Auflistung nach Agent, die Auflistung nach Sitzung, den Aktualisierungszeitpunkt, die Ausführungs-ID und
  Ablaufpfade hinzu, bevor Sie häufig ausgeführten Code verschieben.
- Speichern Sie große Artefakte, Medien und Vektoren als BLOBs oder aufgeteilte BLOB-Zeilen, nicht
  als Base64 oder JSON mit numerischen Arrays.
- Halten Sie undurchsichtige Plugin-Zustandseinträge klein und klar abgegrenzt.
- Fügen Sie eine SQL-Bereinigung für TTL/Ablauf hinzu, statt das Dateisystem zu bereinigen.
  Für datenbankeigene Laufzeitspeicher abgeschlossen: Medien, Plugin-Zustand, Plugin-BLOBs,
  persistente Deduplizierung und Agent-Cache laufen sämtlich über SQLite-Zeilen ab. Die verbleibende
  Dateisystembereinigung ist auf temporäre Materialisierungen oder explizite
  Entfernungsbefehle beschränkt.

## Statische Verbote

Fügen Sie eine Repository-Prüfung hinzu, bei der neue Laufzeitschreibvorgänge in veraltete Zustandspfade fehlschlagen:

- `sessions.json`
- `*.trajectory.jsonl` außer materialisierten Ausgaben von Support-Paketen
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` Laufzeit-Cache-Dateien
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `openclaw-workspace-state.json`
- `workspace-state.json`
- `workspace-attestations/*.attested`
- benachbarte `<workspace>.attested`
- Matrix `credentials*.json` und `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json` / `devices/paired.json` / `devices/bootstrap.json`
  (seit 2026.7 außer Betrieb: Laufzeitspeicher ist `device_pairing_*` /
  `device_bootstrap_tokens` in der gemeinsamen Zustandsdatenbank; gekoppelte Datensätze werden beim
  Gateway-Start importiert, transiente ausstehende/Bootstrap-Zeilen werden verworfen)
- `nodes/pending.json` / `nodes/paired.json` (seit 2026.7 außer Betrieb: beim Gateway-Start in gekoppelte Gerätedatensätze integriert)
- `identity/device.json`
- `identity/device-auth.json` (außer Betrieb; Import ausschließlich durch Doctor in `device_auth_tokens`)
- `push/web-push-subscriptions.json` (außer Betrieb; Import ausschließlich durch Doctor in `web_push_subscriptions`)
- `push/vapid-keys.json` (außer Betrieb; Import ausschließlich durch Doctor in `web_push_vapid_keys`)
- `push/apns-registrations.json` (außer Betrieb; Import ausschließlich durch Doctor in `apns_registrations`)
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
- `plugin-state/state.sqlite`
- Ad-hoc-Laufzeit-Sidecars für `openclaw-state.sqlite`
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock.lock`
- `agents/<agentId>/qmd-write.lock.lock`
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
- `openclaw/rescue-pending/*.json`
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
- dateibasierte Sitzungsöffner für `SessionManager.open(...)`
- Fassaden für die Transkriptauflistung von `SessionManager.listAll(...)` und `TranscriptSessionManager.listAll(...)`
- Fassaden für Transkriptverzweigungen von `SessionManager.forkFromSession(...)` und
  `TranscriptSessionManager.forkFromSession(...)`
- Fassaden für den veränderlichen Sitzungsersatz von `SessionManager.newSession(...)` und `TranscriptSessionManager.newSession(...)`
- Fassaden für Zweigsitzungen von `SessionManager.createBranchedSession(...)` und
  `TranscriptSessionManager.createBranchedSession(...)`

Das Verbot sollte Tests das Erstellen veralteter Fixtures und Migrationscode das
Lesen/Importieren/Entfernen veralteter Dateiquellen erlauben. Nicht ausgelieferte SQLite-Sidecars bleiben verboten
und erhalten keine Importausnahmen für Doctor.

## Abschlusskriterien

- Laufzeitdaten und Cache-Schreibvorgänge werden in die globale oder die Agent-SQLite-Datenbank geschrieben.
- Die Laufzeit schreibt keine Sitzungsindizes, Transkript-JSONL-Dateien, Sandbox-Registry-
  JSON-Dateien, SQLite-Aufgaben-Sidecars oder SQLite-Plugin-Zustands-Sidecars mehr. Die nicht ausgelieferten SQLite-Importer
  für Aufgaben- und Plugin-Zustands-Sidecars sind gelöscht.
- Der Import veralteter Dateien erfolgt ausschließlich durch Doctor.
- Die Sicherung erzeugt ein Archiv mit kompakten SQLite-Snapshots und Integritätsnachweis.
- Agent-Worker können mit Festplattenspeicher, VFS-Arbeitsspeicher oder experimentellem reinem VFS-
  Speicher ausgeführt werden.
- Konfigurationsdateien und explizite Anmeldedatendateien bleiben die einzigen erwarteten persistenten
  Steuerdateien außerhalb der Datenbank.
- Repository-Prüfungen verhindern die Wiedereinführung veralteter Laufzeit-Dateispeicher.
