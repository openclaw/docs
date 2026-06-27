---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Sandbox-Laufzeiten verwalten und die effektive Sandbox-Richtlinie prüfen
title: Sandbox-CLI
x-i18n:
    generated_at: "2026-06-27T17:20:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

Sandbox-Laufzeitumgebungen für isolierte Agent-Ausführung verwalten.

## Überblick

OpenClaw kann Agents aus Sicherheitsgründen in isolierten Sandbox-Laufzeitumgebungen ausführen. Die `sandbox`-Befehle helfen Ihnen, diese Laufzeitumgebungen nach Updates oder Konfigurationsänderungen zu prüfen und neu zu erstellen.

Derzeit bedeutet das üblicherweise:

- Docker-Sandbox-Container
- SSH-Sandbox-Laufzeitumgebungen, wenn `agents.defaults.sandbox.backend = "ssh"`
- OpenShell-Sandbox-Laufzeitumgebungen, wenn `agents.defaults.sandbox.backend = "openshell"`

Für `ssh` und OpenShell `remote` ist das Neuerstellen wichtiger als bei Docker:

- Der Remote-Workspace ist nach dem initialen Seed kanonisch
- `openclaw sandbox recreate` löscht diesen kanonischen Remote-Workspace für den ausgewählten Scope
- Die nächste Verwendung seedet ihn erneut aus dem aktuellen lokalen Workspace

## Befehle

### `openclaw sandbox explain`

Prüfen Sie den **effektiven** Sandbox-Modus, Scope, Workspace-Zugriff, die Sandbox-Tool-Policy und erhöhte Gates (mit Fix-it-Konfigurationsschlüsselpfaden).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Alle Sandbox-Laufzeitumgebungen mit Status und Konfiguration auflisten.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**Ausgabe enthält:**

- Name und Status der Laufzeitumgebung
- Backend (`docker`, `openshell` usw.)
- Konfigurationslabel und ob es der aktuellen Konfiguration entspricht
- Alter (Zeit seit der Erstellung)
- Leerlaufzeit (Zeit seit der letzten Verwendung)
- Zugehörige Session/zugehöriger Agent

### `openclaw sandbox recreate`

Sandbox-Laufzeitumgebungen entfernen, um eine Neuerstellung mit aktualisierter Konfiguration zu erzwingen.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Optionen:**

- `--all`: Alle Sandbox-Container neu erstellen
- `--session <key>`: Container für eine bestimmte Session neu erstellen
- `--agent <id>`: Container für einen bestimmten Agent neu erstellen
- `--browser`: Nur Browser-Container neu erstellen
- `--force`: Bestätigungsabfrage überspringen

<Note>
Laufzeitumgebungen werden automatisch neu erstellt, wenn der Agent das nächste Mal verwendet wird.
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

### Nach dem Ändern des SSH-Ziels oder von SSH-Authentifizierungsmaterial

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Für das Core-`ssh`-Backend löscht die Neuerstellung den Remote-Workspace-Root pro Scope
auf dem SSH-Ziel. Der nächste Lauf seedet ihn erneut aus dem lokalen Workspace.

### Nach dem Ändern von OpenShell-Quelle, Policy oder Modus

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Für den OpenShell-`remote`-Modus löscht die Neuerstellung den kanonischen Remote-Workspace
für diesen Scope. Der nächste Lauf seedet ihn erneut aus dem lokalen Workspace.

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

## Warum dies erforderlich ist

Wenn Sie die Sandbox-Konfiguration aktualisieren:

- Bestehende Laufzeitumgebungen laufen mit alten Einstellungen weiter.
- Laufzeitumgebungen werden erst nach 24 Stunden Inaktivität bereinigt.
- Regelmäßig verwendete Agents halten alte Laufzeitumgebungen unbegrenzt aktiv.

Verwenden Sie `openclaw sandbox recreate`, um das Entfernen alter Laufzeitumgebungen zu erzwingen. Sie werden bei Bedarf automatisch mit den aktuellen Einstellungen neu erstellt.

<Tip>
Bevorzugen Sie `openclaw sandbox recreate` gegenüber manueller Backend-spezifischer Bereinigung. Es verwendet die Laufzeit-Registry des Gateway und vermeidet Inkonsistenzen, wenn sich Scope- oder Session-Schlüssel ändern.
</Tip>

## Registry-Migration

OpenClaw speichert Metadaten von Sandbox-Laufzeitumgebungen in der gemeinsam genutzten SQLite-State-Datenbank. Ältere Installationen können noch Legacy-Sandbox-Registry-Dateien haben:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Einige Upgrades können außerdem je Container/Browser einen JSON-Shard unter `~/.openclaw/sandbox/containers/` oder `~/.openclaw/sandbox/browsers/` haben. Reguläre Lesezugriffe auf Sandbox-Laufzeitumgebungen schreiben diese Legacy-Quellen nicht neu. Führen Sie `openclaw doctor --fix` aus, um gültige Legacy-Einträge nach SQLite zu migrieren. Ungültige Legacy-Dateien werden quarantänisiert, damit eine einzelne fehlerhafte alte Registry aktuelle Laufzeiteinträge nicht verbergen kann.

## Konfiguration

Sandbox-Einstellungen befinden sich in `~/.openclaw/openclaw.json` unter `agents.defaults.sandbox` (agent-spezifische Overrides kommen in `agents.list[].sandbox`):

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
- [Agent-Workspace](/de/concepts/agent-workspace)
- [Doctor](/de/gateway/doctor): prüft die Sandbox-Einrichtung.
