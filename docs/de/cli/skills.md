---
read_when:
    - Sie möchten sehen, welche Skills verfügbar und einsatzbereit sind
    - Sie möchten Skills aus ClawHub suchen, installieren oder aktualisieren
    - Sie möchten fehlende Binärdateien/Umgebungsvariablen/Konfiguration für Skills debuggen
summary: CLI-Referenz für `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:29:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Lokale Skills prüfen und Skills aus ClawHub installieren/aktualisieren.

Verwandt:

- Skills-System: [Skills](/de/tools/skills)
- Skills-Konfiguration: [Skills-Konfiguration](/de/tools/skills-config)
- ClawHub-Installationen: [ClawHub](/de/clawhub/cli)

## Befehle

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` verwenden ClawHub direkt und installieren in das
`skills/`-Verzeichnis des aktiven Workspace. `list`/`info`/`check` prüfen weiterhin die lokalen
Skills, die für den aktuellen Workspace und die aktuelle Konfiguration sichtbar sind. Workspace-gestützte Befehle
lösen den Ziel-Workspace über `--agent <id>` auf, dann über das aktuelle Arbeitsverzeichnis,
wenn es sich innerhalb eines konfigurierten Agent-Workspace befindet, und dann über den Standard-
Agent.

Dieser CLI-Befehl `install` lädt Skill-Ordner aus ClawHub herunter. Gateway-gestützte
Installationen von Skill-Abhängigkeiten, die aus dem Onboarding oder aus Skills-Einstellungen ausgelöst werden, verwenden stattdessen den
separaten `skills.install`-Anfragepfad.

Hinweise:

- `search [query...]` akzeptiert eine optionale Abfrage; lassen Sie sie weg, um den standardmäßigen
  ClawHub-Suchfeed zu durchsuchen.
- `search --limit <n>` begrenzt die zurückgegebenen Ergebnisse.
- `install --force` überschreibt einen vorhandenen Workspace-Skill-Ordner für denselben
  Slug.
- `--agent <id>` zielt auf einen konfigurierten Agent-Workspace und überschreibt die Ableitung aus dem aktuellen
  Arbeitsverzeichnis.
- `update --all` aktualisiert nur nachverfolgte ClawHub-Installationen im aktiven Workspace.
- `check --agent <id>` prüft den Workspace des ausgewählten Agents und meldet, welche
  bereiten Skills tatsächlich für die Prompt- oder Befehlsoberfläche dieses Agents sichtbar sind.
- `list` ist die Standardaktion, wenn kein Unterbefehl angegeben wird.
- `list`, `info` und `check` schreiben ihre gerenderte Ausgabe nach stdout. Mit
  `--json` bedeutet das, dass die maschinenlesbare Nutzlast für Pipes
  und Skripte auf stdout bleibt.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Skills](/de/tools/skills)
