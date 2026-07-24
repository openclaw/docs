---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Sandbox-Runtimes verwalten und die wirksame Sandbox-Richtlinie prüfen
title: Sandbox-CLI
x-i18n:
    generated_at: "2026-07-24T04:51:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea8311de7702222295f3ba8753304e30f6ed21958e2843f62db5d064f06e24ae
    source_path: cli/sandbox.md
    workflow: 16
---

Verwalten Sie Sandbox-Laufzeitumgebungen für die isolierte Agent-Ausführung: Docker-Container, SSH-Ziele oder OpenShell-Backends.

## Befehle

### `openclaw sandbox list`

Listet Sandbox-Laufzeitumgebungen mit Status, Backend, Konfigurationsübereinstimmung, Alter, Leerlaufzeit und zugehöriger Sitzung bzw. zugehörigem Agent auf.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # nur Browser-Container
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Entfernt Sandbox-Laufzeitumgebungen, um ihre Neuerstellung mit der aktuellen Konfiguration zu erzwingen. Laufzeitumgebungen werden automatisch neu erstellt, wenn der Agent das nächste Mal verwendet wird.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # schließt Untersitzungen des Typs agent:mybot:* ein
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # nur Browser-Container
openclaw sandbox recreate --all --force        # Bestätigung überspringen
```

Optionen:

- `--all`: alle Sandbox-Container neu erstellen
- `--session <key>`: die Laufzeitumgebung mit genau diesem Bereichsschlüssel neu erstellen (wie von `sandbox list` angezeigt); keine Erweiterung von Kurznamen
- `--agent <id>`: Laufzeitumgebungen für einen Agent neu erstellen (entspricht `agent:<id>` und `agent:<id>:*`)
- `--browser`: nur Browser-Container betreffen
- `--force`: Bestätigungsabfrage überspringen

Übergeben Sie genau eine der Optionen `--all`, `--session` oder `--agent`.

Bei `ssh` und OpenShell `remote` ist die Neuerstellung wichtiger als bei Docker: Der entfernte Arbeitsbereich ist nach der anfänglichen Befüllung maßgeblich, `recreate` löscht diesen maßgeblichen entfernten Arbeitsbereich für den ausgewählten Bereich und der nächste Lauf befüllt ihn erneut aus dem aktuellen lokalen Arbeitsbereich.

### `openclaw sandbox explain`

Prüft den effektiven Sandbox-Modus, -Bereich und Arbeitsbereichszugriff, die Sandbox-Tool-Richtlinie sowie die Schranken für Tools mit erhöhten Berechtigungen (einschließlich Konfigurationsschlüsselpfaden zur Fehlerbehebung).

Der Bericht behält `workspaceRoot` als konfiguriertes Sandbox-Stammverzeichnis bei und zeigt separat den effektiven Host-Arbeitsbereich, das Arbeitsverzeichnis der Backend-Laufzeitumgebung und die Docker-Mount-Tabelle. Für `workspaceAccess: "rw"` ist der effektive Host-Arbeitsbereich der Agent-Arbeitsbereich und nicht ein Verzeichnis unterhalb von `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Anders als `recreate --session` akzeptiert dieser Befehl kurze Sitzungsnamen (zum Beispiel `main`) und erweitert sie anhand des aufgelösten Agent.

## Warum eine Neuerstellung erforderlich ist

Das Aktualisieren der Sandbox-Konfiguration wirkt sich nicht auf laufende Container aus: Vorhandene Laufzeitumgebungen behalten ihre alten Einstellungen und inaktive Laufzeitumgebungen werden erst nach `prune.idleHours` (standardmäßig 24h) bereinigt. Regelmäßig verwendete Agents können veraltete Laufzeitumgebungen unbegrenzt aktiv halten. `openclaw sandbox recreate` entfernt die alte Laufzeitumgebung, damit sie bei der nächsten Verwendung anhand der aktuellen Konfiguration neu erstellt wird.

<Tip>
Verwenden Sie vorzugsweise `openclaw sandbox recreate` statt einer manuellen, Backend-spezifischen Bereinigung. Der Befehl verwendet die Laufzeitregistrierung des Gateway und vermeidet Abweichungen, wenn sich Bereichs- oder Sitzungsschlüssel ändern.
</Tip>

## Häufige Auslöser

| Änderung                                                                                                                                                        | Befehl                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Aktualisierung des Docker-Images (`agents.defaults.sandbox.docker.image`)                                                                                                          | `openclaw sandbox recreate --all`                                                  |
| Sandbox-Konfiguration (`agents.defaults.sandbox.*`)                                                                                                                      | `openclaw sandbox recreate --all`                                                  |
| SSH-Ziel/-Authentifizierung (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`)                                                                                                                | `openclaw sandbox recreate --all`                                                  |
| OpenShell-Quelle/-Richtlinie/-Modus (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                                                        | `openclaw sandbox recreate --all`                                                  |
| `setupCommand`                                                                                                                                              | `openclaw sandbox recreate --all` (oder `--agent <id>` für einen Agent)        |

<Note>
Laufzeitumgebungen werden automatisch neu erstellt, wenn der Agent das nächste Mal verwendet wird.
</Note>

## Registrierungsmigration

Metadaten der Sandbox-Laufzeitumgebungen befinden sich in der gemeinsam genutzten SQLite-Zustandsdatenbank. Ältere Installationen können veraltete Registrierungsdateien enthalten, die bei regulären Lesevorgängen nicht mehr neu geschrieben werden:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- ein JSON-Shard pro Container/Browser unter `~/.openclaw/sandbox/containers/` oder `~/.openclaw/sandbox/browsers/`

Führen Sie `openclaw doctor --fix` aus, um gültige veraltete Einträge nach SQLite zu migrieren. Ungültige veraltete Dateien werden unter Quarantäne gestellt, damit eine beschädigte alte Registrierung keine aktuellen Laufzeiteinträge verbergen kann.

## Konfiguration

Sandbox-Einstellungen befinden sich in `~/.openclaw/openclaw.json` unter `agents.defaults.sandbox` (Agent-spezifische Überschreibungen werden in `agents.entries.*.sandbox` eingetragen):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // aus, nicht Hauptsitzung, alle
        "backend": "docker", // docker, ssh, openshell (vom Plugin bereitgestellt)
        "scope": "agent", // Sitzung, Agent, gemeinsam genutzt
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... weitere Docker-Optionen
        },
        "prune": {
          "idleHours": 24, // nach 24h Leerlauf automatisch bereinigen
          "maxAgeDays": 7, // nach 7 Tagen automatisch bereinigen
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
