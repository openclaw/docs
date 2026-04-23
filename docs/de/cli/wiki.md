---
read_when:
    - Sie möchten die memory-wiki-CLI verwenden
    - Sie dokumentieren oder ändern `openclaw wiki`
summary: CLI-Referenz für `openclaw wiki` (Status, Suche, Kompilieren, Linting, Anwenden, Bridge und Obsidian-Helfer für den memory-wiki-Tresor)
title: Wiki
x-i18n:
    generated_at: "2026-04-23T06:27:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Den `memory-wiki`-Tresor prüfen und pflegen.

Bereitgestellt durch das gebündelte Plugin `memory-wiki`.

Verwandt:

- [Memory Wiki plugin](/de/plugins/memory-wiki)
- [Memory-Überblick](/de/concepts/memory)
- [CLI: memory](/de/cli/memory)

## Wofür es gedacht ist

Verwenden Sie `openclaw wiki`, wenn Sie einen kompilierten Wissens-Tresor möchten mit:

- Wiki-nativer Suche und Seitenlesevorgängen
- Synthesen mit umfangreicher Provenienz
- Berichten zu Widersprüchen und Aktualität
- Bridge-Importen aus dem aktiven Memory-Plugin
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

Aktuellen Tresor-Modus, Zustand und Verfügbarkeit der Obsidian-CLI prüfen.

Verwenden Sie dies zuerst, wenn Sie unsicher sind, ob der Tresor initialisiert ist, der Bridge-Modus
funktionsfähig ist oder die Obsidian-Integration verfügbar ist.

### `wiki doctor`

Wiki-Zustandsprüfungen ausführen und Konfigurations- oder Tresorprobleme anzeigen.

Typische Probleme sind:

- aktivierter Bridge-Modus ohne öffentliche Memory-Artefakte
- ungültiges oder fehlendes Tresor-Layout
- fehlende externe Obsidian-CLI, wenn ein Obsidian-Modus erwartet wird

### `wiki init`

Das Layout des Wiki-Tresors und Startseiten erstellen.

Dies initialisiert die Wurzelstruktur, einschließlich Indexen auf oberster Ebene und Cache-Verzeichnissen.

### `wiki ingest <path-or-url>`

Inhalte in die Quellenebene des Wikis importieren.

Hinweise:

- URL-Import wird durch `ingest.allowUrlIngest` gesteuert
- importierte Quellseiten behalten Provenienz im Frontmatter
- Auto-Kompilierung kann nach dem Import ausgeführt werden, wenn aktiviert

### `wiki compile`

Indizes, verwandte Blöcke, Dashboards und kompilierte Digests neu erstellen.

Dies schreibt stabile, maschinenorientierte Artefakte unter:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Wenn `render.createDashboards` aktiviert ist, aktualisiert die Kompilierung auch Berichtsseiten.

### `wiki lint`

Den Tresor linten und Folgendes melden:

- strukturelle Probleme
- Provenienzlücken
- Widersprüche
- offene Fragen
- Seiten/Claims mit geringer Konfidenz
- veraltete Seiten/Claims

Führen Sie dies nach wesentlichen Wiki-Aktualisierungen aus.

### `wiki search <query>`

Wiki-Inhalte durchsuchen.

Das Verhalten hängt von der Konfiguration ab:

- `search.backend`: `shared` oder `local`
- `search.corpus`: `wiki`, `memory` oder `all`

Verwenden Sie `wiki search`, wenn Sie Wiki-spezifisches Ranking oder Provenienzdetails möchten.
Für einen einzelnen breiten gemeinsamen Recall-Durchlauf bevorzugen Sie `openclaw memory search`, wenn das
aktive Memory-Plugin gemeinsame Suche bereitstellt.

### `wiki get <lookup>`

Eine Wiki-Seite anhand von ID oder relativem Pfad lesen.

Beispiele:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Begrenzte Mutationen anwenden, ohne frei formulierbare Seitenchirurgie.

Unterstützte Abläufe umfassen:

- eine Synthese-Seite erstellen/aktualisieren
- Seitenmetadaten aktualisieren
- Quellen-IDs anhängen
- Fragen hinzufügen
- Widersprüche hinzufügen
- Konfidenz/Status aktualisieren
- strukturierte Claims schreiben

Dieser Befehl existiert, damit sich das Wiki sicher weiterentwickeln kann, ohne verwaltete Blöcke manuell zu bearbeiten.

### `wiki bridge import`

Öffentliche Memory-Artefakte aus dem aktiven Memory-Plugin in durch die Bridge unterstützte
Quellseiten importieren.

Verwenden Sie dies im Modus `bridge`, wenn Sie möchten, dass die neuesten exportierten Memory-Artefakte
in den Wiki-Tresor übernommen werden.

### `wiki unsafe-local import`

Aus explizit konfigurierten lokalen Pfaden im Modus `unsafe-local` importieren.

Dies ist bewusst experimentell und nur für denselben Rechner gedacht.

### `wiki obsidian ...`

Obsidian-Hilfsbefehle für Tresore, die im Obsidian-freundlichen Modus laufen.

Unterbefehle:

- `status`
- `search`
- `open`
- `command`
- `daily`

Diese erfordern die offizielle `obsidian`-CLI in `PATH`, wenn
`obsidian.useOfficialCli` aktiviert ist.

## Praktische Nutzungshinweise

- Verwenden Sie `wiki search` + `wiki get`, wenn Provenienz und Seitenidentität wichtig sind.
- Verwenden Sie `wiki apply` statt verwaltete generierte Abschnitte von Hand zu bearbeiten.
- Verwenden Sie `wiki lint`, bevor Sie widersprüchlichen oder wenig vertrauenswürdigen Inhalten vertrauen.
- Verwenden Sie `wiki compile` nach Massenimporten oder Quellenänderungen, wenn Sie sofort aktuelle
  Dashboards und kompilierte Digests möchten.
- Verwenden Sie `wiki bridge import`, wenn der Bridge-Modus von neu exportierten Memory-
  Artefakten abhängt.

## Verknüpfungen zur Konfiguration

Das Verhalten von `openclaw wiki` wird geprägt durch:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Siehe [Memory Wiki plugin](/de/plugins/memory-wiki) für das vollständige Konfigurationsmodell.
