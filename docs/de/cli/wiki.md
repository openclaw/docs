---
read_when:
    - Sie möchten die memory-wiki-CLI verwenden
    - Sie dokumentieren oder ändern `openclaw wiki`
summary: CLI-Referenz für `openclaw wiki` (Status des Memory-Wiki-Vaults, Suche, Kompilierung, Linting, Anwendung, Bridge, ChatGPT-Import und Obsidian-Hilfsfunktionen)
title: Wiki
x-i18n:
    generated_at: "2026-07-12T15:15:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Untersuchen und verwalten Sie den `memory-wiki`-Vault. Bereitgestellt durch das gebündelte `memory-wiki`-Plugin.

Verwandte Themen: [Memory-Wiki-Plugin](/de/plugins/memory-wiki), [Memory-Übersicht](/de/concepts/memory), [CLI: Memory](/de/cli/memory)

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

## Agent-Auswahl

Wenn `plugins.entries.memory-wiki.config.vault.scope` auf `agent` gesetzt ist, wählen Sie den
Vault mit der übergeordneten Option `--agent <id>` aus:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "Rückerstattungsrichtlinie"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

In einer Einrichtung mit mehreren konfigurierten Agents ist `--agent` für CLI-
Operationen erforderlich, damit ein Befehl nicht einen beliebigen Standard-Vault lesen oder schreiben kann. Wenn
nur ein Agent konfiguriert ist, bleibt dieser Agent der Standard. Unbekannte Agent-IDs
führen zu einem Fehler, bevor die Vault-Operation beginnt. Die Option ändert den ausgewählten
Pfad nicht, wenn `vault.scope` auf `global` gesetzt ist.

Gateway-Clients folgen derselben Regel: Übergeben Sie `agentId` bei Vault-gestützten `wiki.*`-
Anfragen in einer agentbezogenen Multi-Agent-Einrichtung. Eine fehlende oder unbekannte ID ist ein
Fehler. Agent-Durchläufe, Wiki-Tools, Ergänzungen zum Memory-Korpus und kompilierte Prompt-
Digests enthalten bereits den aktiven Laufzeitkontext des Agents.

## Befehle

### `wiki status`

Zeigt Vault-Modus und -Geltungsbereich, den aufgelösten Agent, den Zustand und die Verfügbarkeit der Obsidian-CLI an. Verwenden Sie diesen Befehl zuerst, um zu prüfen, ob der vorgesehene Vault initialisiert ist, der Bridge-Modus ordnungsgemäß funktioniert oder die Obsidian-Integration verfügbar ist.

Wenn der Bridge-Modus aktiv und zum Lesen von Memory-Artefakten konfiguriert ist, fragt dieser Befehl das laufende Gateway ab, sodass er denselben aktiven Kontext des Memory-Plugins wie der Agent bzw. die Laufzeit verwendet.

### `wiki doctor`

Führt Zustandsprüfungen für das Wiki durch und meldet umsetzbare Korrekturen. Wird bei einem fehlerhaften Zustand mit einem Exit-Code ungleich null beendet.

Wenn der Bridge-Modus aktiv und zum Lesen von Memory-Artefakten konfiguriert ist, fragt dieser Befehl vor dem Erstellen des Berichts das laufende Gateway ab. Deaktivierte Bridge-Importe und Bridge-Konfigurationen, die keine Memory-Artefakte lesen, bleiben lokal/offline.

Typische Probleme:

- Bridge-Modus ohne öffentliche Memory-Artefakte aktiviert
- ungültiges oder fehlendes Vault-Layout
- fehlende externe Obsidian-CLI, wenn der Obsidian-Modus erwartet wird

### `wiki init`

Erstellt das Layout des Wiki-Vaults und Startseiten, einschließlich übergeordneter Indizes und Cache-Verzeichnisse.

### `wiki ingest <path>`

Importiert eine lokale Markdown- oder Textdatei als Quellseite in den Ordner `sources/` des Wikis. `<path>` muss ein lokaler Dateipfad sein; derzeit ist kein URL-Import möglich. Binärdateien werden abgelehnt.

Importierte Quellseiten enthalten Frontmatter zur Herkunft (`sourceType: local-file`, `sourcePath`, `ingestedAt`). Nach dem Import wird der Vault immer neu kompiliert.

Flags: `--title <title>` überschreibt den Quelltitel (Standard: aus dem Dateinamen abgeleitet).

### `wiki okf import <path>`

Importiert ein entpacktes Open-Knowledge-Format-Bundle in Wiki-Konzeptseiten.

Der Importer liest jedes nicht reservierte `.md`-Konzeptdokument im OKF-Verzeichnisbaum, erfordert ein nicht leeres Feld `type` und behandelt unbekannte OKF-`type`-Werte als generische Konzepte. Reservierte OKF-Dateien namens `index.md` und `log.md` werden nicht als Konzepte importiert.

Importierte Seiten werden unter `concepts/` abgeflacht, sodass vorhandene Abläufe für Wiki-Kompilierung, Suche, Abruf, Digests und Dashboards sie sofort berücksichtigen. Die ursprüngliche OKF-Konzept-ID, `type`, `resource`, `tags`, der Zeitstempel, der Quellpfad und das vollständige Frontmatter bleiben im Frontmatter der Seite erhalten. Interne OKF-Markdown-Links werden auf die generierten Wiki-Seiten umgeschrieben; ungültige oder externe Links bleiben unverändert. Nach dem Import wird der Vault immer neu kompiliert.

Beispiele:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery-Tabelle" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Erstellt Indizes, zugehörige Blöcke, Dashboards und kompilierte Digests neu. Schreibt stabile, maschinenlesbare Artefakte unter:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Wenn `render.createDashboards` aktiviert ist, aktualisiert die Kompilierung auch die Berichtsseiten.

### `wiki lint`

Prüft den Vault und schreibt einen Bericht zu folgenden Punkten:

- strukturelle Probleme (ungültige Links, fehlende/doppelte IDs, fehlender Seitentyp oder Titel, ungültiges Frontmatter)
- Herkunftslücken (fehlende Quell-IDs, fehlende Importherkunft)
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

Verwenden Sie `wiki search` für Wiki-spezifische Rangfolge und Herkunft. Für einen umfassenden gemeinsamen Abrufdurchlauf sollten Sie `openclaw memory search` bevorzugen, wenn das aktive Memory-Plugin eine gemeinsame Suche bereitstellt.

Suchmodi:

- `find-person`: Aliasse, Handles, soziale Profile, kanonische IDs und Personenseiten
- `route-question`: Hinweise dazu, wen man fragen bzw. wofür jemand am besten eingesetzt werden sollte, sowie Beziehungskontext
- `source-evidence`: Quellseiten und strukturierte Belegfelder
- `raw-claim`: strukturierter Aussage-Text mit Metadaten zu Aussage und Belegen

Beispiele:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "wer kennt den Teams-Rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "starke Route Teams" --mode raw-claim --json
```

Die Textausgabe enthält Zeilen mit `Claim:` und `Evidence:`, wenn ein Ergebnis mit einer strukturierten Aussage übereinstimmt. Die JSON-Ausgabe stellt zusätzlich `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` und `evidenceSourceIds` zur detaillierten Untersuchung durch den Agent bereit.

### `wiki get <lookup>`

Liest eine Wiki-Seite anhand ihrer ID oder ihres relativen Pfads.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Wendet eng begrenzte Änderungen ohne frei formulierte Seiteneingriffe an:

- `apply synthesis <title>`: erstellt oder aktualisiert eine Syntheseseite mit einem verwalteten Zusammenfassungstext
- `apply metadata <lookup>`: aktualisiert Metadaten einer vorhandenen Seite

Beide akzeptieren `--source-id`, `--contradiction`, `--question` (jeweils wiederholbar), `--confidence <n>` (0-1) und `--status <status>`. `apply metadata` akzeptiert außerdem `--clear-confidence`, um einen gespeicherten Konfidenzwert zu entfernen. Dies ist die unterstützte Methode zur Weiterentwicklung von Wiki-Seiten, sodass verwaltete generierte Blöcke intakt bleiben.

### `wiki bridge import`

Importiert öffentliche Memory-Artefakte aus dem aktiven Memory-Plugin in Bridge-gestützte Quellseiten. Verwenden Sie diesen Befehl im Modus `bridge`, um die neuesten exportierten Memory-Artefakte in den Wiki-Vault zu übernehmen.

Bei aktiven Lesevorgängen für Bridge-Artefakte leitet die CLI den Import über Gateway-RPC, sodass der Kontext des Memory-Plugins der Laufzeit verwendet wird. Wenn Bridge-Importe deaktiviert sind oder Artefaktlesevorgänge ausgeschaltet sind, behält der Befehl das lokale/offline Verhalten ohne Importe bei. Die Indexaktualisierung nach dem Import wird durch `ingest.autoCompile` gesteuert.

### `wiki unsafe-local import`

Importiert im Modus `unsafe-local` aus explizit konfigurierten lokalen Pfaden (`unsafeLocal.paths`). Bewusst experimentell und nur für denselben Rechner vorgesehen. Die Indexaktualisierung nach dem Import wird durch `ingest.autoCompile` gesteuert.

### `wiki chatgpt import`

Importiert einen ChatGPT-Export in Entwurfs-Quellseiten des Wikis.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Flag              | Standardwert  | Beschreibung                                                        |
| ----------------- | ------------- | ------------------------------------------------------------------- |
| `--export <path>` | (erforderlich) | ChatGPT-Exportverzeichnis oder Pfad zu `conversations.json`.         |
| `--dry-run`       | `false`       | Zeigt die Anzahl erstellter/aktualisierter/übersprungener Seiten an, ohne Seiten zu schreiben. |

Ein Import ohne Probelauf, der Seiten ändert, zeichnet eine Importlauf-ID auf, die in der Zusammenfassung ausgegeben und für das Zurücksetzen benötigt wird.

### `wiki chatgpt rollback <run-id>`

Setzt einen zuvor angewendeten ChatGPT-Importlauf zurück, entfernt dabei von ihm erstellte Seiten und stellt von ihm überschriebene Seiten wieder her. Führt keine Aktion aus (und meldet `alreadyRolledBack`), wenn der Lauf bereits zurückgesetzt wurde.

### `wiki obsidian ...`

Obsidian-Hilfsbefehle für Vaults im Obsidian-kompatiblen Modus: `status`, `search`, `open`, `command`, `daily`. Diese erfordern die offizielle `obsidian`-CLI in `PATH`, wenn `obsidian.useOfficialCli` aktiviert ist.

Die Konfigurationsvalidierung lehnt `obsidian.useOfficialCli: true` ab, wenn
`vault.scope` auf `agent` gesetzt ist, da `obsidian.vaultName` eine globale Einstellung
und keine agentbezogene Zuordnung ist. Obsidian-kompatibles Markdown-Rendering bleibt
verfügbar.

## Praktische Verwendungshinweise

- Verwenden Sie `wiki search` + `wiki get`, wenn Herkunft und Seitenidentität wichtig sind.
- Verwenden Sie `wiki apply`, anstatt verwaltete generierte Abschnitte manuell zu bearbeiten.
- Verwenden Sie `wiki lint`, bevor Sie widersprüchlichen Inhalten oder Inhalten mit geringer Konfidenz vertrauen.
- Verwenden Sie `wiki compile` nach Massenimporten oder Quelländerungen, wenn Sie sofort aktuelle Dashboards und kompilierte Digests benötigen.
- Verwenden Sie `wiki okf import`, wenn ein Datenkatalog, Dokumentationsexport oder eine Pipeline zur Agent-Anreicherung bereits OKF-Markdown-Bundles ausgibt.
- Verwenden Sie `wiki bridge import`, wenn der Bridge-Modus von neu exportierten Memory-Artefakten abhängt.

## Zugehörige Konfiguration

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
