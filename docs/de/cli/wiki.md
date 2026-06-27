---
read_when:
    - Sie möchten die memory-wiki-CLI verwenden
    - Sie dokumentieren oder ändern `openclaw wiki`
summary: CLI-Referenz für `openclaw wiki` (memory-wiki-Vault-Status, Suche, Kompilierung, Linting, Anwenden, Bridge und Obsidian-Helfer)
title: Wiki
x-i18n:
    generated_at: "2026-06-27T17:21:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Prüfen und verwalten Sie den `memory-wiki`-Vault.

Bereitgestellt vom gebündelten `memory-wiki`-Plugin.

Verwandt:

- [Memory Wiki Plugin](/de/plugins/memory-wiki)
- [Speicherübersicht](/de/concepts/memory)
- [CLI: Speicher](/de/cli/memory)

## Wofür es gedacht ist

Verwenden Sie `openclaw wiki`, wenn Sie einen kompilierten Wissens-Vault mit Folgendem benötigen:

- wiki-native Suche und Seitenzugriffe
- provenienzreiche Synthesen
- Berichte zu Widersprüchen und Aktualität
- Bridge-Importe aus dem Active-Memory-Plugin
- optionale Obsidian-CLI-Helfer

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
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Befehle

### `wiki status`

Prüfen Sie den aktuellen Vault-Modus, die Integrität und die Verfügbarkeit der Obsidian-CLI.

Verwenden Sie dies zuerst, wenn Sie unsicher sind, ob der Vault initialisiert ist, der Bridge-Modus
fehlerfrei ist oder die Obsidian-Integration verfügbar ist.

Wenn der Bridge-Modus aktiv und zum Lesen von Speicherartefakten konfiguriert ist, fragt dieser Befehl
den laufenden Gateway ab, sodass er denselben Kontext des Active-Memory-Plugins sieht wie
Agent-/Runtime-Speicher.

### `wiki doctor`

Führen Sie Wiki-Integritätsprüfungen aus und zeigen Sie Konfigurations- oder Vault-Probleme an.

Wenn der Bridge-Modus aktiv und zum Lesen von Speicherartefakten konfiguriert ist, fragt dieser Befehl
den laufenden Gateway ab, bevor der Bericht erstellt wird. Deaktivierte Bridge-Importe
und Bridge-Konfigurationen, die keine Speicherartefakte lesen, bleiben lokal/offline.

Typische Probleme sind:

- Bridge-Modus ohne öffentliche Speicherartefakte aktiviert
- ungültiges oder fehlendes Vault-Layout
- fehlende externe Obsidian-CLI, wenn der Obsidian-Modus erwartet wird

### `wiki init`

Erstellen Sie das Wiki-Vault-Layout und Startseiten.

Dies initialisiert die Stammstruktur einschließlich Top-Level-Indizes und Cache-
Verzeichnissen.

### `wiki ingest <path-or-url>`

Importieren Sie Inhalte in die Wiki-Quellebene.

Hinweise:

- URL-Ingest wird durch `ingest.allowUrlIngest` gesteuert
- importierte Quellseiten behalten die Provenienz im Frontmatter
- Auto-Compile kann nach dem Ingest ausgeführt werden, wenn es aktiviert ist

### `wiki okf import <path>`

Importieren Sie ein entpacktes Open-Knowledge-Format-Bundle in Wiki-Konzeptseiten.

Der Importer liest jedes nicht reservierte `.md`-Konzeptdokument im OKF-
Verzeichnisbaum, verlangt ein nicht leeres `type`-Feld und behandelt unbekannte OKF-
`type`-Werte als generische Konzepte. Reservierte OKF-Dateien `index.md` und `log.md`
werden nicht als Konzepte importiert.

Importierte Seiten werden unter `concepts/` abgeflacht, sodass bestehende Wiki-Flows für Compile,
Suche, Get, Digest und Dashboard sie sofort sehen. Die ursprüngliche OKF-
Konzept-ID, `type`, `resource`, `tags`, Zeitstempel, Quellpfad und das vollständige
Frontmatter bleiben im Seiten-Frontmatter erhalten. Interne OKF-Markdown-Links
werden auf die generierten Wiki-Seiten umgeschrieben; fehlerhafte oder externe Links bleiben
unverändert.

Beispiele:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Erstellen Sie Indizes, verwandte Blöcke, Dashboards und kompilierte Digests neu.

Dies schreibt stabile maschinenorientierte Artefakte unter:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Wenn `render.createDashboards` aktiviert ist, aktualisiert Compile außerdem Berichtsseiten.

### `wiki lint`

Linten Sie den Vault und berichten Sie:

- strukturelle Probleme
- Provenienzlücken
- Widersprüche
- offene Fragen
- Seiten/Aussagen mit niedriger Konfidenz
- veraltete Seiten/Aussagen

Führen Sie dies nach relevanten Wiki-Aktualisierungen aus.

### `wiki search <query>`

Durchsuchen Sie Wiki-Inhalte.

Das Verhalten hängt von der Konfiguration ab:

- `search.backend`: `shared` oder `local`
- `search.corpus`: `wiki`, `memory` oder `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` oder
  `raw-claim`

Verwenden Sie `wiki search`, wenn Sie wiki-spezifisches Ranking oder Provenienzdetails benötigen.
Für einen breiten gemeinsamen Recall-Durchlauf bevorzugen Sie `openclaw memory search`, wenn das
Active-Memory-Plugin eine gemeinsame Suche bereitstellt.

Suchmodi helfen dem Agenten, die richtige Oberfläche auszuwählen:

- `find-person`: Aliasse, Handles, Socials, kanonische IDs und Personenseiten
- `route-question`: Hinweise zu „nachfragen bei“/„am besten geeignet für“ und Beziehungskontext
- `source-evidence`: Quellseiten und strukturierte Evidenzfelder
- `raw-claim`: strukturierter Aussagetext mit Aussage-/Evidenz-Metadaten

Beispiele:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Die Textausgabe enthält `Claim:`- und `Evidence:`-Zeilen, wenn ein Ergebnis einer
strukturierten Aussage entspricht. Die JSON-Ausgabe stellt zusätzlich `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` und
`evidenceSourceIds` für agentenseitige Detailanalyse bereit.

### `wiki get <lookup>`

Lesen Sie eine Wiki-Seite per ID oder relativem Pfad.

Beispiele:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Wenden Sie eng begrenzte Mutationen ohne freie Seitenbearbeitung an.

Unterstützte Flows umfassen:

- eine Syntheseseite erstellen/aktualisieren
- Seitenmetadaten aktualisieren
- Quell-IDs anhängen
- Fragen hinzufügen
- Widersprüche hinzufügen
- Konfidenz/Status aktualisieren
- strukturierte Aussagen schreiben

Dieser Befehl existiert, damit sich das Wiki sicher weiterentwickeln kann, ohne verwaltete Blöcke
manuell zu bearbeiten.

### `wiki bridge import`

Importieren Sie öffentliche Speicherartefakte aus dem Active-Memory-Plugin in Bridge-gestützte
Quellseiten.

Verwenden Sie dies im `bridge`-Modus, wenn Sie die neuesten exportierten Speicherartefakte
in den Wiki-Vault ziehen möchten.

Für aktive Bridge-Artefakt-Lesevorgänge leitet die CLI den Import über Gateway-RPC weiter,
sodass der Import den Runtime-Kontext des Memory-Plugins verwendet. Wenn Bridge-Importe
deaktiviert sind oder Artefakt-Lesevorgänge ausgeschaltet sind, behält der Befehl das lokale/offline
Null-Import-Verhalten bei.

### `wiki unsafe-local import`

Importieren Sie aus explizit konfigurierten lokalen Pfaden im `unsafe-local`-Modus.

Dies ist bewusst experimentell und nur für denselben Rechner gedacht.

### `wiki obsidian ...`

Obsidian-Hilfsbefehle für Vaults, die in einem Obsidian-freundlichen Modus laufen.

Unterbefehle:

- `status`
- `search`
- `open`
- `command`
- `daily`

Diese erfordern die offizielle `obsidian`-CLI auf `PATH`, wenn
`obsidian.useOfficialCli` aktiviert ist.

## Praktische Nutzungshinweise

- Verwenden Sie `wiki search` + `wiki get`, wenn Provenienz und Seitenidentität wichtig sind.
- Verwenden Sie `wiki apply` statt verwaltete generierte Abschnitte von Hand zu bearbeiten.
- Verwenden Sie `wiki lint`, bevor Sie widersprüchlichen Inhalten oder Inhalten mit niedriger Konfidenz vertrauen.
- Verwenden Sie `wiki compile` nach Massenimporten oder Quellenänderungen, wenn Sie sofort frische
  Dashboards und kompilierte Digests benötigen.
- Verwenden Sie `wiki okf import`, wenn ein Datenkatalog, Dokumentationsexport oder eine Agenten-
  Anreicherungspipeline bereits OKF-Markdown-Bundles ausgibt.
- Verwenden Sie `wiki bridge import`, wenn der Bridge-Modus von neu exportierten Speicher-
  artefakten abhängt.

## Konfigurationsbezüge

Das Verhalten von `openclaw wiki` wird geprägt durch:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Siehe [Memory Wiki Plugin](/de/plugins/memory-wiki) für das vollständige Konfigurationsmodell.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Memory Wiki](/de/plugins/memory-wiki)
