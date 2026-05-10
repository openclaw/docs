---
read_when:
    - Sie stoßen in älterer Dokumentation oder in Versionshinweisen auf `openclaw flows`
    - Sie möchten eine kurze TaskFlow-Inspektionsreferenz
summary: 'Weiterleitung: Flow-Befehle befinden sich unter `openclaw tasks flow`'
title: Abläufe (Weiterleitung)
x-i18n:
    generated_at: "2026-05-10T19:28:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Es gibt keinen `openclaw flows`-Befehl auf oberster Ebene. Die dauerhafte TaskFlow-Inspektion befindet sich unter `openclaw tasks flow`.

## Unterbefehle

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Unterbefehl | Beschreibung                     | Argumente / Optionen                                                                   |
| ----------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| `list`      | Nachverfolgte TaskFlows auflisten. | `--json` maschinenlesbare Ausgabe; `--status <name>` Filter (siehe Statuswerte unten). |
| `show`      | Einen TaskFlow anzeigen.         | `<lookup>` Flow-ID oder Owner-Schlüssel; `--json` maschinenlesbare Ausgabe.            |
| `cancel`    | Einen laufenden TaskFlow abbrechen. | `<lookup>` Flow-ID oder Owner-Schlüssel.                                               |

`<lookup>` akzeptiert entweder eine Flow-ID (zurückgegeben von `list` / `show`) oder den Owner-Schlüssel des Flows (den stabilen Bezeichner, den das besitzende Subsystem verwendet, um den Flow nachzuverfolgen).

### Statusfilterwerte

`--status` bei `list` akzeptiert einen der folgenden Werte:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Beispiele

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Vollständige TaskFlow-Konzepte und Informationen zum Erstellen finden Sie unter [TaskFlow](/de/automation/taskflow). Informationen zum übergeordneten Befehl `tasks` finden Sie in der [tasks-CLI-Referenz](/de/cli/tasks).

## Verwandt

- [CLI-Referenz](/de/cli)
- [Automatisierung](/de/automation)
- [TaskFlow](/de/automation/taskflow)
