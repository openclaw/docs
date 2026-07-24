---
read_when:
    - Sie stoßen in älteren Dokumentationen oder Versionshinweisen auf `openclaw flows`
    - Sie möchten eine Kurzübersicht zur TaskFlow-Inspektion
summary: 'Weiterleitung: Flow-Befehle befinden sich unter `openclaw tasks flow`'
title: Abläufe (Weiterleitung)
x-i18n:
    generated_at: "2026-07-24T03:43:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Es gibt keinen übergeordneten Befehl `openclaw flows`. Die dauerhafte TaskFlow-Überprüfung befindet sich unter `openclaw tasks flow`.

## Unterbefehle

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Unterbefehl | Beschreibung                    | Argumente / Optionen                                                                    |
| ----------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| `list`     | Verfolgte TaskFlows auflisten.  | `--json` maschinenlesbare Ausgabe; `--status <name>` Filter (siehe Statuswerte unten). |
| `show`     | Einen TaskFlow anzeigen.        | `<lookup>` Flow-ID oder Eigentümerschlüssel; `--json` maschinenlesbare Ausgabe. |
| `cancel`   | Laufenden TaskFlow abbrechen.   | `<lookup>` Flow-ID oder Eigentümerschlüssel.                                    |

`<lookup>` akzeptiert entweder eine Flow-ID (zurückgegeben von `list` / `show`) oder den Eigentümerschlüssel des Flows (die stabile Kennung, mit der das zuständige Subsystem den Flow verfolgt).

### Werte für den Statusfilter

`--status` für `list` akzeptiert einen der folgenden Werte: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Beispiele

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Informationen zu TaskFlow-Konzepten und zur Erstellung finden Sie unter [TaskFlow](/de/automation/taskflow). Informationen zum übergeordneten Befehl `tasks` finden Sie in der [CLI-Referenz zu tasks](/de/cli/tasks).

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Automatisierung](/de/automation)
- [TaskFlow](/de/automation/taskflow)
