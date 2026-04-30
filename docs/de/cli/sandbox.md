---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Sandbox-Laufzeitumgebungen verwalten und die geltende Sandbox-Richtlinie prüfen
title: Sandbox-CLI
x-i18n:
    generated_at: "2026-04-30T06:46:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

Verwalten Sie Sandbox-Laufzeiten für isolierte Agent-Ausführung.

## Übersicht

OpenClaw kann Agents aus Sicherheitsgründen in isolierten Sandbox-Laufzeiten ausführen. Die `sandbox`-Befehle helfen Ihnen, diese Laufzeiten nach Updates oder Konfigurationsänderungen zu prüfen und neu zu erstellen.

Heute bedeutet das in der Regel:

- Docker-Sandbox-Container
- SSH-Sandbox-Laufzeiten, wenn `agents.defaults.sandbox.backend = "ssh"`
- OpenShell-Sandbox-Laufzeiten, wenn `agents.defaults.sandbox.backend = "openshell"`

Für `ssh` und OpenShell `remote` ist das Neuerstellen wichtiger als bei Docker:

- Der Remote-Arbeitsbereich ist nach dem anfänglichen Seed maßgeblich
- `openclaw sandbox recreate` löscht diesen maßgeblichen Remote-Arbeitsbereich für den ausgewählten Geltungsbereich
- Die nächste Verwendung seedet ihn erneut aus dem aktuellen lokalen Arbeitsbereich

## Befehle

### `openclaw sandbox explain`

Prüfen Sie den **effektiven** Sandbox-Modus/-Geltungsbereich/Arbeitsbereichszugriff, die Sandbox-Tool-Richtlinie und erhöhte Gates (mit Fix-it-Konfigurationsschlüsselpfaden).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Listen Sie alle Sandbox-Laufzeiten mit ihrem Status und ihrer Konfiguration auf.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**Ausgabe enthält:**

- Laufzeitname und Status
- Backend (`docker`, `openshell` usw.)
- Konfigurationslabel und ob es mit der aktuellen Konfiguration übereinstimmt
- Alter (Zeit seit Erstellung)
- Leerlaufzeit (Zeit seit letzter Verwendung)
- Zugeordnete Sitzung/zugeordneter Agent

### `openclaw sandbox recreate`

Entfernen Sie Sandbox-Laufzeiten, um eine Neuerstellung mit aktualisierter Konfiguration zu erzwingen.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Optionen:**

- `--all`: Alle Sandbox-Container neu erstellen
- `--session <key>`: Container für eine bestimmte Sitzung neu erstellen
- `--agent <id>`: Container für einen bestimmten Agent neu erstellen
- `--browser`: Nur Browser-Container neu erstellen
- `--force`: Bestätigungsabfrage überspringen

<Note>
Laufzeiten werden automatisch neu erstellt, wenn der Agent das nächste Mal verwendet wird.
</Note>

## Anwendungsfälle

### Nach dem Aktualisieren eines Docker-Images

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Nach dem Ändern der Sandbox-Konfiguration

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Nach dem Ändern des SSH-Ziels oder von SSH-Auth-Material

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Für das Kern-Backend `ssh` löscht das Neuerstellen das Remote-Arbeitsbereichs-Root pro Geltungsbereich
auf dem SSH-Ziel. Der nächste Lauf seedet es erneut aus dem lokalen Arbeitsbereich.

### Nach dem Ändern von OpenShell-Quelle, -Richtlinie oder -Modus

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Für den OpenShell-Modus `remote` löscht das Neuerstellen den maßgeblichen Remote-Arbeitsbereich
für diesen Geltungsbereich. Der nächste Lauf seedet ihn erneut aus dem lokalen Arbeitsbereich.

### Nach dem Ändern von setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Nur für einen bestimmten Agent

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Warum dies nötig ist

Wenn Sie die Sandbox-Konfiguration aktualisieren:

- Bestehende Laufzeiten laufen mit alten Einstellungen weiter.
- Laufzeiten werden erst nach 24 Stunden Inaktivität entfernt.
- Regelmäßig verwendete Agents halten alte Laufzeiten unbegrenzt am Leben.

Verwenden Sie `openclaw sandbox recreate`, um das Entfernen alter Laufzeiten zu erzwingen. Sie werden bei Bedarf automatisch mit den aktuellen Einstellungen neu erstellt.

<Tip>
Bevorzugen Sie `openclaw sandbox recreate` gegenüber manueller backend-spezifischer Bereinigung. Es nutzt die Runtime-Registry des Gateway und vermeidet Abweichungen, wenn sich Geltungsbereichs- oder Sitzungsschlüssel ändern.
</Tip>

## Konfiguration

Sandbox-Einstellungen befinden sich in `~/.openclaw/openclaw.json` unter `agents.defaults.sandbox` (Überschreibungen pro Agent stehen in `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Sandboxing](/de/gateway/sandboxing)
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- [Doctor](/de/gateway/doctor): prüft die Sandbox-Einrichtung.
