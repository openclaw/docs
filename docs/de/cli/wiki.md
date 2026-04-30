---
read_when:
    - Sie möchten die memory-wiki-CLI verwenden
    - Sie dokumentieren oder ändern `openclaw wiki`
summary: CLI-Referenz für `openclaw wiki` (memory-wiki-Vault-Status, Suche, Kompilierung, Linting, Anwendung, Bridge und Obsidian-Hilfsfunktionen)
title: Wiki
x-i18n:
    generated_at: "2026-04-30T06:47:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Prüfen und verwalten Sie den `memory-wiki`-Vault.

Bereitgestellt durch das gebündelte `memory-wiki`-Plugin.

Verwandt:

- [Memory-Wiki-Plugin](/de/plugins/memory-wiki)
- [Speicherüberblick](/de/concepts/memory)
- [CLI: memory](/de/cli/memory)

## Wofür es gedacht ist

Verwenden Sie `openclaw wiki`, wenn Sie einen kompilierten Wissens-Vault mit Folgendem benötigen:

- wiki-nativer Suche und Seitenabrufen
- synthetisierten Inhalten mit umfassender Herkunftsinformation
- Berichten zu Widersprüchen und Aktualität
- Bridge-Importen aus dem Active-Memory-Plugin
- optionalen Obsidian-CLI-Helfern

## Häufige Befehle

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
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

Prüfen Sie den aktuellen Vault-Modus, den Zustand und die Verfügbarkeit der Obsidian-CLI.

Verwenden Sie dies zuerst, wenn Sie unsicher sind, ob der Vault initialisiert ist, der Bridge-Modus
ordnungsgemäß funktioniert oder die Obsidian-Integration verfügbar ist.

Wenn der Bridge-Modus aktiv und so konfiguriert ist, dass Speicherartefakte gelesen werden, fragt dieser Befehl
den laufenden Gateway ab, sodass er denselben Active-Memory-Plugin-Kontext sieht wie
Agent-/Runtime-Speicher.

### `wiki doctor`

Führen Sie Wiki-Zustandsprüfungen aus und zeigen Sie Konfigurations- oder Vault-Probleme an.

Wenn der Bridge-Modus aktiv und so konfiguriert ist, dass Speicherartefakte gelesen werden, fragt dieser Befehl
den laufenden Gateway ab, bevor der Bericht erstellt wird. Deaktivierte Bridge-Importe
und Bridge-Konfigurationen, die keine Speicherartefakte lesen, bleiben lokal/offline.

Typische Probleme sind:

- Bridge-Modus ohne öffentliche Speicherartefakte aktiviert
- ungültiges oder fehlendes Vault-Layout
- fehlende externe Obsidian-CLI, wenn der Obsidian-Modus erwartet wird

### `wiki init`

Erstellen Sie das Wiki-Vault-Layout und Starterseiten.

Dies initialisiert die Stammstruktur, einschließlich Top-Level-Indizes und Cache-
Verzeichnissen.

### `wiki ingest <path-or-url>`

Importieren Sie Inhalte in die Wiki-Quellschicht.

Hinweise:

- URL-Ingest wird durch `ingest.allowUrlIngest` gesteuert
- importierte Quellseiten behalten Herkunftsinformationen im Frontmatter
- Auto-Compile kann nach dem Ingest ausgeführt werden, wenn es aktiviert ist

### `wiki compile`

Erstellen Sie Indizes, verwandte Blöcke, Dashboards und kompilierte Digests neu.

Dies schreibt stabile maschinenorientierte Artefakte unter:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Wenn `render.createDashboards` aktiviert ist, aktualisiert Compile auch Berichtsseiten.

### `wiki lint`

Linten Sie den Vault und melden Sie:

- strukturelle Probleme
- Herkunftslücken
- Widersprüche
- offene Fragen
- Seiten/Claims mit geringer Zuverlässigkeit
- veraltete Seiten/Claims

Führen Sie dies nach wesentlichen Wiki-Aktualisierungen aus.

### `wiki search <query>`

Durchsuchen Sie Wiki-Inhalte.

Das Verhalten hängt von der Konfiguration ab:

- `search.backend`: `shared` oder `local`
- `search.corpus`: `wiki`, `memory` oder `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` oder
  `raw-claim`

Verwenden Sie `wiki search`, wenn Sie wiki-spezifisches Ranking oder Herkunftsdetails benötigen.
Für einen breiten gemeinsamen Recall-Durchlauf bevorzugen Sie `openclaw memory search`, wenn das
Active-Memory-Plugin gemeinsame Suche bereitstellt.

Suchmodi helfen dem Agent, die richtige Oberfläche auszuwählen:

- `find-person`: Aliasse, Handles, Socials, kanonische IDs und Personenseiten
- `route-question`: Hinweise zu „Wen fragen“/„Am besten geeignet für“ und Beziehungskontext
- `source-evidence`: Quellseiten und strukturierte Evidenzfelder
- `raw-claim`: strukturierter Claim-Text mit Claim-/Evidenzmetadaten

Beispiele:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Textausgabe enthält `Claim:`- und `Evidence:`-Zeilen, wenn ein Ergebnis zu einem
strukturierten Claim passt. JSON-Ausgabe stellt zusätzlich `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` und
`evidenceSourceIds` für agentenseitige Detailprüfung bereit.

### `wiki get <lookup>`

Lesen Sie eine Wiki-Seite nach ID oder relativem Pfad.

Beispiele:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Wenden Sie enge Änderungen ohne frei formulierte Seitenbearbeitung an.

Unterstützte Abläufe umfassen:

- eine Syntheseseite erstellen/aktualisieren
- Seitenmetadaten aktualisieren
- Quell-IDs anhängen
- Fragen hinzufügen
- Widersprüche hinzufügen
- Zuverlässigkeit/Status aktualisieren
- strukturierte Claims schreiben

Dieser Befehl existiert, damit sich das Wiki sicher weiterentwickeln kann, ohne
verwaltete Blöcke manuell zu bearbeiten.

### `wiki bridge import`

Importieren Sie öffentliche Speicherartefakte aus dem Active-Memory-Plugin in Bridge-gestützte
Quellseiten.

Verwenden Sie dies im `bridge`-Modus, wenn die neuesten exportierten Speicherartefakte
in den Wiki-Vault übernommen werden sollen.

Für aktive Bridge-Artefaktlesezugriffe leitet die CLI den Import über Gateway-RPC,
sodass der Import den Runtime-Memory-Plugin-Kontext verwendet. Wenn Bridge-Importe
deaktiviert sind oder Artefaktlesezugriffe ausgeschaltet sind, behält der Befehl das lokale/offline
Zero-Import-Verhalten bei.

### `wiki unsafe-local import`

Importieren Sie aus ausdrücklich konfigurierten lokalen Pfaden im `unsafe-local`-Modus.

Dies ist absichtlich experimentell und nur für dieselbe Maschine gedacht.

### `wiki obsidian ...`

Obsidian-Hilfsbefehle für Vaults, die in einem Obsidian-freundlichen Modus laufen.

Unterbefehle:

- `status`
- `search`
- `open`
- `command`
- `daily`

Diese erfordern die offizielle `obsidian`-CLI im `PATH`, wenn
`obsidian.useOfficialCli` aktiviert ist.

## Praktische Nutzungshinweise

- Verwenden Sie `wiki search` + `wiki get`, wenn Herkunft und Seitenidentität wichtig sind.
- Verwenden Sie `wiki apply` statt verwaltete generierte Abschnitte von Hand zu bearbeiten.
- Verwenden Sie `wiki lint`, bevor Sie widersprüchlichen Inhalten oder Inhalten mit geringer Zuverlässigkeit vertrauen.
- Verwenden Sie `wiki compile` nach Massenimporten oder Quelländerungen, wenn Sie frische
  Dashboards und kompilierte Digests sofort benötigen.
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

Siehe [Memory-Wiki-Plugin](/de/plugins/memory-wiki) für das vollständige Konfigurationsmodell.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Memory-Wiki](/de/plugins/memory-wiki)
