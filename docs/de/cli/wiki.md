---
read_when:
    - Sie möchten die memory-wiki-CLI verwenden
    - Sie dokumentieren oder ändern `openclaw wiki`
summary: CLI-Referenz für `openclaw wiki` (Status des Memory-Wiki-Vaults, Suche, Kompilierung, Linting, Anwendung, Bridge, ChatGPT-Import und Obsidian-Hilfsfunktionen)
title: Wiki
x-i18n:
    generated_at: "2026-07-24T04:58:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1f793d52de270068cf3a06b13f52242bb66738235718639486e090a2de213e73
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Untersuchen und verwalten Sie den `memory-wiki`-Vault. Er wird vom mitgelieferten optionalen `memory-wiki`-Plugin bereitgestellt. Aktivieren Sie es vor der ersten Verwendung:

```bash
openclaw plugins enable memory-wiki
openclaw gateway restart
```

Siehe auch: [Memory-Wiki-Plugin](/de/plugins/memory-wiki), [Memory-Übersicht](/de/concepts/memory), [CLI: Memory](/de/cli/memory)

## Häufige Befehle

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "wen sollte ich zu Teams fragen?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha-Zusammenfassung" \
  --body "Kurzer Synthesetext" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Noch aktiv?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Agentenauswahl

Wenn `plugins.entries.memory-wiki.config.vault.scope` den Wert `agent` hat, wählen Sie den
Vault mit der übergeordneten Option `--agent <id>` aus:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

In einer Einrichtung mit mehreren konfigurierten Agenten ist `--agent` für CLI-
Vorgänge erforderlich, damit ein Befehl keinen beliebigen Standard-Vault lesen oder schreiben kann. Wenn
nur ein Agent konfiguriert ist, bleibt dieser Agent der Standard. Unbekannte Agenten-IDs
führen zu einem Fehler, bevor der Vault-Vorgang beginnt. Die Option ändert den ausgewählten
Pfad nicht, wenn `vault.scope` den Wert `global` hat.

Gateway-Clients folgen derselben Regel: Übergeben Sie `agentId` bei Vault-gestützten `wiki.*`-
Anfragen in einer agentenspezifischen Multi-Agenten-Einrichtung. Eine fehlende oder unbekannte ID ist ein
Fehler. Agentendurchläufe, Wiki-Tools, Ergänzungen des Memory-Korpus und kompilierte Prompt-
Digests enthalten bereits den aktiven Laufzeitkontext des Agenten.

## Befehle

### `wiki status`

Zeigt Vault-Modus und -Gültigkeitsbereich, den aufgelösten Agenten, den Zustand und die Verfügbarkeit der Obsidian-CLI an. Verwenden Sie diesen Befehl zuerst, um zu prüfen, ob der vorgesehene Vault initialisiert ist, der Bridge-Modus ordnungsgemäß funktioniert oder die Obsidian-Integration verfügbar ist.

Wenn der Bridge-Modus aktiv und für das Lesen von Memory-Artefakten konfiguriert ist, fragt dieser Befehl das laufende Gateway ab, sodass er denselben Kontext des aktiven Memory-Plugins wie das Agenten-/Laufzeit-Memory verwendet.

### `wiki doctor`

Führt Wiki-Zustandsprüfungen aus und meldet umsetzbare Korrekturen. Wird bei einem fehlerhaften Zustand mit einem Exitcode ungleich null beendet.

Wenn der Bridge-Modus aktiv und für das Lesen von Memory-Artefakten konfiguriert ist, fragt dieser Befehl vor der Erstellung des Berichts das laufende Gateway ab. Deaktivierte Bridge-Importe und Bridge-Konfigurationen, die keine Memory-Artefakte lesen, bleiben lokal/offline.

Typische Probleme:

- Bridge-Modus ohne öffentliche Memory-Artefakte aktiviert
- ungültiges oder fehlendes Vault-Layout
- fehlende externe Obsidian-CLI, wenn der Obsidian-Modus erwartet wird

### `wiki init`

Erstellt das Wiki-Vault-Layout und die Startseiten einschließlich übergeordneter Indizes und Cache-Verzeichnisse.

### `wiki ingest <path>`

Importiert eine lokale Markdown- oder Textdatei als Quellseite in den Wiki-Ordner `sources/`. `<path>` muss ein lokaler Dateipfad sein; derzeit ist kein Import per URL möglich. Binärdateien werden abgelehnt.

Importierte Quellseiten enthalten Provenienz-Frontmatter (`sourceType: local-file`, `sourcePath`, `ingestedAt`). Nach dem Import wird der Vault immer neu kompiliert.

Flags: `--title <title>` überschreibt den Quelltitel (Standard: aus dem Dateinamen abgeleitet).

### `wiki okf import <path>`

Importiert ein entpacktes Open-Knowledge-Format-Bundle in Wiki-Konzeptseiten.

Der Importer liest jedes nicht reservierte `.md`-Konzeptdokument im OKF-Verzeichnisbaum, erfordert ein nicht leeres Feld `type` und behandelt unbekannte OKF-Werte für `type` als generische Konzepte. Reservierte OKF-Dateien `index.md` und `log.md` werden nicht als Konzepte importiert.

Importierte Seiten werden unter `concepts/` abgeflacht, sodass vorhandene Wiki-Abläufe zum Kompilieren, Suchen, Abrufen, Erstellen von Digests und Anzeigen von Dashboards sie sofort erfassen. Die ursprüngliche OKF-Konzept-ID, `type`, `resource`, `tags`, der Zeitstempel, der Quellpfad und das vollständige Frontmatter bleiben im Frontmatter der Seite erhalten. Interne OKF-Markdown-Links werden auf die generierten Wiki-Seiten umgeschrieben; fehlerhafte oder externe Links bleiben unverändert. Nach dem Import wird der Vault immer neu kompiliert.

Beispiele:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Erstellt Indizes, zugehörige Blöcke, Dashboards und den kompilierten Abfrage-/Prompt-Snapshot neu. Der Snapshot wird im gemeinsamen SQLite-Plugin-Zustand von OpenClaw gespeichert und für die synchrone Prompt-Projektion im Arbeitsspeicher gehalten; er erstellt keine Cache-Dateien im Vault.

Wenn `render.createDashboards` aktiviert ist, aktualisiert die Kompilierung auch Berichtsseiten.

### `wiki lint`

Prüft den Vault und erstellt einen Bericht zu folgenden Punkten:

- strukturelle Probleme (fehlerhafte Links, fehlende/doppelte IDs, fehlender Seitentyp oder Titel, ungültiges Frontmatter)
- Provenienzlücken (fehlende Quell-IDs, fehlende Importprovenienz)
- Widersprüche (markierte Widersprüche, widersprüchliche Aussagen)
- offene Fragen
- Seiten und Aussagen mit geringer Konfidenz
- veraltete Seiten und Aussagen

Führen Sie diesen Befehl nach wesentlichen Wiki-Aktualisierungen aus.

### `wiki search <query>`

Durchsucht Wiki-Inhalte. Das Verhalten hängt von der Konfiguration ab:

- `search.backend`: `shared` oder `local`
- `search.corpus`: `wiki`, `memory` oder `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` oder `raw-claim`

Verwenden Sie `wiki search` für Wiki-spezifische Rangfolge und Provenienz. Für einen einzigen umfassenden gemeinsamen Abrufdurchlauf sollten Sie `openclaw memory search` bevorzugen, wenn das aktive Memory-Plugin die gemeinsame Suche bereitstellt.

Suchmodi:

- `find-person`: Aliasse, Handles, soziale Profile, kanonische IDs und Personenseiten
- `route-question`: Hinweise zu Ansprechpartnern/optimalen Einsatzgebieten und Beziehungskontext
- `source-evidence`: Quellseiten und strukturierte Belegfelder
- `raw-claim`: strukturierter Aussageinhalt mit Aussage-/Belegmetadaten

Beispiele:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "wer kennt sich mit der Teams-Einführung aus?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Die Textausgabe enthält Zeilen für `Claim:` und `Evidence:`, wenn ein Ergebnis einer strukturierten Aussage entspricht. Die JSON-Ausgabe stellt zusätzlich `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` und `evidenceSourceIds` für eine agentenseitige Detailanalyse bereit.

### `wiki get <lookup>`

Liest eine Wiki-Seite anhand ihrer ID oder ihres relativen Pfads.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Wendet gezielte Änderungen ohne freie Seitenbearbeitung an:

- `apply synthesis <title>`: eine Syntheseseite mit einem verwalteten Zusammenfassungstext erstellen oder aktualisieren
- `apply metadata <lookup>`: Metadaten auf einer vorhandenen Seite aktualisieren

Beide akzeptieren `--source-id`, `--contradiction`, `--question` (jeweils wiederholbar), `--confidence <n>` (0–1) und `--status <status>`. `apply metadata` akzeptiert außerdem `--clear-confidence`, um einen gespeicherten Konfidenzwert zu entfernen. Dies ist die unterstützte Methode zur Weiterentwicklung von Wiki-Seiten, damit verwaltete generierte Blöcke intakt bleiben.

### `wiki bridge import`

Importiert öffentliche Memory-Artefakte aus dem aktiven Memory-Plugin in Bridge-gestützte Quellseiten. Verwenden Sie dies im Modus `bridge`, um die zuletzt exportierten Memory-Artefakte in den Wiki-Vault zu übernehmen.

Bei aktiven Bridge-Artefaktlesevorgängen leitet die CLI den Import über Gateway-RPC, sodass der Kontext des Laufzeit-Memory-Plugins verwendet wird. Wenn Bridge-Importe deaktiviert oder Artefaktlesevorgänge ausgeschaltet sind, behält der Befehl das lokale/offline Verhalten ohne Importe bei. Die Indexaktualisierung nach dem Import wird durch `ingest.autoCompile` gesteuert.

### `wiki unsafe-local import`

Importiert im Modus `unsafe-local` aus explizit konfigurierten lokalen Pfaden (`unsafeLocal.paths`). Bewusst experimentell und nur auf demselben Rechner nutzbar. Die Indexaktualisierung nach dem Import wird durch `ingest.autoCompile` gesteuert.

### `wiki chatgpt import`

Importiert einen ChatGPT-Export in Entwurfs-Quellseiten des Wikis.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Flag              | Standard   | Beschreibung                                                  |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | (erforderlich) | ChatGPT-Exportverzeichnis oder Pfad zu `conversations.json`. |
| `--dry-run`       | `false`    | Zeigt die Anzahl erstellter/aktualisierter/übersprungener Seiten an, ohne Seiten zu schreiben. |

Ein Import ohne Probelauf, der Seiten ändert, zeichnet eine Importlauf-ID auf. Sie wird in der Zusammenfassung ausgegeben und für das Rollback benötigt.

### `wiki chatgpt rollback <run-id>`

Setzt einen zuvor angewendeten ChatGPT-Importlauf zurück, entfernt die dadurch erstellten Seiten und stellt überschriebene Seiten wieder her. Führt keine Aktion aus (und meldet `alreadyRolledBack`), wenn der Lauf bereits zurückgesetzt wurde.

### `wiki obsidian ...`

Obsidian-Hilfsbefehle für Vaults im Obsidian-kompatiblen Modus: `status`, `search`, `open`, `command`, `daily`. Diese erfordern die offizielle CLI `obsidian` in `PATH`, wenn `obsidian.useOfficialCli` aktiviert ist.

Die Konfigurationsvalidierung lehnt `obsidian.useOfficialCli: true` ab, wenn
`vault.scope` den Wert `agent` hat, da `obsidian.vaultName` eine globale Einstellung
und keine agentenspezifische Zuordnung ist. Obsidian-kompatibles Markdown-Rendering bleibt
verfügbar.

## Praktische Verwendungshinweise

- Verwenden Sie `wiki search` + `wiki get`, wenn Provenienz und Seitenidentität wichtig sind.
- Verwenden Sie `wiki apply`, anstatt verwaltete generierte Abschnitte manuell zu bearbeiten.
- Verwenden Sie `wiki lint`, bevor Sie widersprüchlichen Inhalten oder Inhalten mit geringer Konfidenz vertrauen.
- Verwenden Sie `wiki compile` nach Massenimporten oder Quellenänderungen, wenn Sie sofort aktuelle Dashboards und kompilierte Digests benötigen.
- Verwenden Sie `wiki okf import`, wenn ein Datenkatalog, ein Dokumentationsexport oder eine Pipeline zur Agentenanreicherung bereits OKF-Markdown-Bundles ausgibt.
- Verwenden Sie `wiki bridge import`, wenn der Bridge-Modus von neu exportierten Memory-Artefakten abhängt.

## Konfigurationsbezüge

Das Verhalten von `openclaw wiki` wird durch Folgendes bestimmt:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Das vollständige Konfigurationsmodell finden Sie unter [Memory-Wiki-Plugin](/de/plugins/memory-wiki).

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Memory-Wiki](/de/plugins/memory-wiki)
