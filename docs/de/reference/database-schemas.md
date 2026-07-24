---
read_when:
    - Diagnose eines Fehlers aufgrund eines neueren Datenbankschemas
    - Prüfen der Datenbankkompatibilität vor einem Update oder Downgrade
    - Wiederherstellen einer Datenbank für eine ältere OpenClaw-Version
summary: Speicherorte der OpenClaw-SQLite-Datenbanken, Schemaversionen, Integritätsprüfungen und Wiederherstellung nach einem Downgrade
title: Datenbankschemas
x-i18n:
    generated_at: "2026-07-24T04:06:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 73993e2c593ba460784108aedef70bbfb499e525c709d6d6bdd956ccf93e0ddc
    source_path: reference/database-schemas.md
    workflow: 16
---

OpenClaw speichert den Zustand der Steuerungsebene in einer globalen SQLite-Datenbank und Agentendaten in jeweils einer SQLite-Datenbank pro Agent. Schemamigrationen werden beim Öffnen einer Datenbank vorwärts ausgeführt. Ältere OpenClaw-Builds lehnen Datenbanken ab, die mit einem neueren Schema geschrieben wurden.

## Datenbankstruktur

| Geltungsbereich       | Standardpfad                                               | Inhalt                                                                                              |
| -------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Globale Steuerungsebene | `~/.openclaw/state/openclaw.sqlite`                        | Gemeinsamer Konfigurationszustand, Registrierungen, Genehmigungen, Plugin-Zustand und gemeinsamer Laufzeitzustand             |
| Datenebene pro Agent | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` | Sitzungen, Transkripte, Speicherindizes, Authentifizierungszustand, Konversationszustand und agentenspezifischer Laufzeitzustand |

Einige Funktionen mit hohem Datenvolumen oder einem spezifischen Lebenszyklus verwenden dedizierte SQLite-Speicher, darunter die Aufgabenregistrierung und Trajektoriendaten.

## Versionierungsvertrag

Jede Datenbank zeichnet ihr Schema an zwei Stellen auf:

- `PRAGMA user_version` ist die SQLite-Schemaversion.
- Die primäre `schema_meta`-Zeile zeichnet `role`, `agent_id`, `schema_version` und `app_version` auf. `app_version` ist der OpenClaw-Build, der die Schemametadaten zuletzt geschrieben hat.

OpenClaw wendet beim Öffnen einer älteren unterstützten Datenbank ausschließlich Vorwärtsmigrationen an. Es lehnt eine Datenbank ab, deren `user_version` neuer als der ausgeführte Build ist, und meldet einen `newer schema version`-Fehler. Der Gateway prüft vor dem Start alle registrierten Datenbanken. `openclaw update` lehnt außerdem ein Paket- oder Quellziel ab, dessen deklarierte Schemaunterstützung älter als eine auf dem Datenträger vorhandene Datenbank ist. Für Zielpakete, die vor Einführung der Schemametadaten veröffentlicht wurden, kann keine Vorabprüfung durchgeführt werden.

Bei der manuellen Installation von OpenClaw über npm wird die Schutzprüfung des Updaters umgangen. Die Prüfungen beim Öffnen der Datenbank lehnen einen inkompatiblen Build dennoch ab.

## Verlauf des Agentenschemas

| Version | Änderung                                                                                                                                                                                                                                                         | Erste Veröffentlichung                                   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1       | Anfänglicher Speicher pro Agent ([#88349](https://github.com/openclaw/openclaw/pull/88349))                                                                                                                                                                            | `v2026.5.30-beta.1`, stabil bis einschließlich `v2026.7.1` |
| 2       | Identität des Speicherindexes ([#104449](https://github.com/openclaw/openclaw/pull/104449))                                                                                                                                                                            | `v2026.7.2-beta.1`                              |
| 4       | Sitzungen und Transkripte nach SQLite verschoben ([#98236](https://github.com/openclaw/openclaw/pull/98236))                                                                                                                                                         | `v2026.7.2-beta.1`                              |
| 5-6     | Aktualität des Terminalzustands und Zustandslebenszyklus ([#104859](https://github.com/openclaw/openclaw/pull/104859))                                                                                                                                                           | `v2026.7.2-beta.1`                              |
| 7       | Lebenszyklusstatusprojektion pro Eintrag ([#106151](https://github.com/openclaw/openclaw/pull/106151))                                                                                                                                                            | `v2026.7.2-beta.1`                              |
| 8       | Sitzungsherkunft pro Transkript ([#106766](https://github.com/openclaw/openclaw/pull/106766))                                                                                                                                                                | `v2026.7.2-beta.2`                              |
| 9       | `STRICT`-Tabellen ([#108663](https://github.com/openclaw/openclaw/pull/108663))                                                                                                                                                                                  | `v2026.7.2-beta.2`                              |
| 10      | Materialisierte Pfade aktiver Transkripte ([#108851](https://github.com/openclaw/openclaw/pull/108851))                                                                                                                                                             | Unveröffentlicht                                      |
| 11      | Leases, dauerhafte Zustellung, Konversationsadressen und Heartbeat-Ergebnisse ([#109636](https://github.com/openclaw/openclaw/pull/109636), [#95838](https://github.com/openclaw/openclaw/pull/95838), [#109999](https://github.com/openclaw/openclaw/pull/109999)) | Unveröffentlicht                                      |

Version 3 war ein nicht ausgelieferter Entwicklungsschritt, der in Version 4 integriert wurde.

## Verlauf des Zustandsschemas

| Version | Änderung                                                                                                   | Erste Veröffentlichung       |
| ------- | -------------------------------------------------------------------------------------------------------- | ------------------- |
| 1       | Anfängliche gemeinsame Zustandsdatenbank                                                                            | `v2026.5.30-beta.1` |
| 2       | Ausschließlich Metadaten enthaltende Nachrichtenprüfereignisse ([#103903](https://github.com/openclaw/openclaw/pull/103903))         | `v2026.7.2-beta.1`  |
| 3       | `STRICT`-Tabellen und Absicherung gegen Schemaabweichungen ([#108663](https://github.com/openclaw/openclaw/pull/108663)) | `v2026.7.2-beta.2`  |
| 4       | Herkunft der Sitzungsüberwachung ersetzt codierte Sentinel-Zeilen                                                  | Unveröffentlicht          |

## Integritätsprüfungen

| Zeitpunkt                                        | Prüfung                                                           |
| ------------------------------------------- | --------------------------------------------------------------- |
| Bei jedem Öffnen                                  | Die `schema_meta`-Tabelle und die primäre Metadatenzeile validieren       |
| Vor einer ausstehenden Migration                  | Eine vollständige Prüfung von Integrität, Fremdschlüsseln, Rollen, Schema und Indizes ausführen |
| Hintergrundprüfer des Gateways                 | Die vollständige Prüfung etwa einmal täglich ausführen und die Ergebnisse protokollieren              |
| Doctor, Sicherungsprüfung und Compaction | Die vollständige Prüfung ausführen, bevor die Datenbank akzeptiert oder neu geschrieben wird    |

Die Vorabprüfung des Gateways liest ausschließlich Schemaheader. Der Hintergrundprüfer ist für die langsamere vollständige Prüfung von Datenbanken zuständig, die keine Migration benötigen.
Quarantäneentscheidungen befinden sich ausschließlich in einem dedizierten `openclaw-quarantine.sqlite`-Speicher, sodass sie Beschädigungen der unter Quarantäne gestellten Datenbanken überstehen. Prüfungsergebnisse werden protokolliert.

## Fehlerbehebung

### Warum Sie nach der Aktualisierung auf 2026.7.2 nicht zurückkehren können

Jede Veröffentlichung bis einschließlich `v2026.7.1` verwendete Agentenschema 1 und Zustandsschema 1. Die Veröffentlichungsreihe 2026.7.2 (beginnend mit `v2026.7.2-beta.1`) migriert Ihre Datenbanken beim ersten Start vorwärts. Diese Migration erfolgt nur in eine Richtung: Die Daten werden in das neuere Schema umgeschrieben, und eine anschließende Installation einer älteren OpenClaw-Version macht dies nicht rückgängig. Der ältere Build verweigert den Start mit einem `newer schema version`-Fehler, der den für die Datenbank zuständigen Build nennt.

Ein Downgrade der Binärdatei führt niemals zu einem Downgrade der Daten. Wenn Sie nach der Aktualisierung eine Veröffentlichung vor 2026.7.2 ausführen müssen, haben Sie drei Möglichkeiten:

1. Stellen Sie eine vor der Aktualisierung erstellte Sicherung wieder her. [Erstellen und überprüfen Sie Sicherungen](/de/cli/backup) vor größeren Aktualisierungen.
2. Führen Sie den älteren Build mit einem separaten Zustandsverzeichnis (`OPENCLAW_STATE_DIR`) aus. Er startet mit einem neuen Zustand; Ihre migrierten Daten bleiben unangetastet, bis Sie zum neueren Build zurückkehren.
3. Befolgen Sie das nachstehende manuelle Downgrade-Verfahren. Es wird nicht unterstützt und birgt ohne überprüfte Sicherung das Risiko eines Datenverlusts.

Seit 2026.7.2 verweigert `openclaw update` die Installation einer Veröffentlichung, die Ihre aktuellen Datenbanken nicht öffnen kann. Der Updater versetzt Sie daher nicht in diese Situation. Die manuelle Installation einer älteren Version über npm umgeht diese Schutzprüfung; die Datenbanken lehnen die alte Binärdatei weiterhin ab, jedoch erst nach deren Installation.

### Der Gateway verweigert den Start mit einem Fehler wegen einer neueren Schemaversion

Ein neuerer OpenClaw-Build hat Ihre Datenbanken geschrieben, und der ausgeführte Build ist älter. Der Fehler und das Startprotokoll des Gateways nennen den für die Datenbank zuständigen Build (`app_version`). Installieren Sie diese oder eine neuere Version oder verwenden Sie eine der oben genannten Möglichkeiten. Bearbeiten Sie die Datenbank nicht, um den Fehler zu unterdrücken.

### Eine Datenbank wird unter Quarantäne gestellt, nachdem die Integritätsprüfung fehlgeschlagen ist

Der Hintergrundprüfer hat nachgewiesen, dass die Datei beschädigt ist, und jeder Öffnungsversuch schlägt nun sofort fehl, anstatt die Datei erneut zu prüfen. Stellen Sie die Datenbank aus einer Sicherung wieder her oder reparieren Sie sie und führen Sie anschließend `openclaw doctor --fix` aus, um den Quarantäneeintrag zu löschen. Doctor meldet einen expliziten Fehler, wenn der Quarantäneeintrag selbst nicht gelöscht werden kann; führen Sie den Befehl erneut aus, bis ein einwandfreier Zustand gemeldet wird.

## Downgrades werden nicht unterstützt

Manuelle Schema-Downgrades sind für Agenten und Betreiber vorgesehen, die das Risiko akzeptieren. [Erstellen und überprüfen Sie eine Sicherung](/de/cli/backup), bevor Sie eine Datenbank bearbeiten. Beenden Sie den Gateway und jeden Prozess, der die Datenbank öffnen kann.

Das allgemeine Verfahren lautet:

1. Lesen Sie das Schema und die Migrationen der Zielveröffentlichung.
2. Entfernen Sie in einer Transaktion alle Tabellen, Indizes, Trigger und Spalten, die nach der Zielversion eingeführt wurden.
3. Setzen Sie `PRAGMA user_version` und `schema_meta.schema_version` auf die Zielversion.
4. Führen Sie die vollständige Datenbankprüfung der Zielveröffentlichung aus, bevor Sie den Gateway starten.

### Beispiel: Agentenschema 11 auf 9

Schema 10 fügte die Projektion aktiver Transkripte hinzu. Schema 11 fügte Leases, dauerhafte Zustellung, den Zustand von Konversationsadressen und Heartbeat-Ergebnisse hinzu. Die QMD-Koordination verwendet Zeilen in `state_leases`; es gibt keine separate QMD-Tabelle, die beibehalten werden muss.

Führen Sie nach Prüfung des exakten Schemas, mit dem die jeweilige Datenbank geschrieben wurde, gleichwertiges SQL für jede betroffene Datenbank pro Agent aus:

```sql
BEGIN IMMEDIATE;

DROP TABLE IF EXISTS heartbeat_outcomes;
DROP TABLE IF EXISTS conversation_deliveries;
DROP TABLE IF EXISTS state_leases;
DROP TABLE IF EXISTS session_transcript_active_events;

ALTER TABLE session_transcript_index_state DROP COLUMN active_event_count;
ALTER TABLE session_transcript_index_state DROP COLUMN active_message_count;
ALTER TABLE conversations DROP COLUMN delivery_target;

PRAGMA user_version = 9;
UPDATE schema_meta
SET schema_version = 9,
    updated_at = unixepoch('now') * 1000
WHERE meta_key = 'primary';

COMMIT;
```

Dadurch wird der Zustand der Versionen 10–11 verworfen, einschließlich laufender Zustellungsvorgänge, Leases, Heartbeat-Ergebnisse und der abgeleiteten Projektion aktiver Transkripte. Bei einem fehlerhaften Downgrade müssen Sie die überprüfte Sicherung wiederherstellen.
