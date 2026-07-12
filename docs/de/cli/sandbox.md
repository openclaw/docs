---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Sandbox-Laufzeitumgebungen verwalten und die geltende Sandbox-Richtlinie prüfen
title: Sandbox-CLI
x-i18n:
    generated_at: "2026-07-12T15:14:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Verwalten Sie Sandbox-Runtimes für die isolierte Agent-Ausführung: Docker-Container, SSH-Ziele oder OpenShell-Backends.

## Befehle

### `openclaw sandbox list`

Listet Sandbox-Runtimes mit Status, Backend, Konfigurationsübereinstimmung, Alter, Leerlaufzeit und zugehöriger Sitzung bzw. zugehörigem Agent auf.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # nur Browser-Container
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Entfernt Sandbox-Runtimes, um ihre Neuerstellung mit der aktuellen Konfiguration zu erzwingen. Runtimes werden automatisch neu erstellt, wenn der Agent das nächste Mal verwendet wird.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # schließt Untersitzungen vom Typ agent:mybot:* ein
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # nur Browser-Container
openclaw sandbox recreate --all --force        # Bestätigung überspringen
```

Optionen:

- `--all`: alle Sandbox-Container neu erstellen
- `--session <key>`: die Runtime mit diesem exakten Bereichsschlüssel neu erstellen (wie von `sandbox list` angezeigt); keine Erweiterung von Kurznamen
- `--agent <id>`: Runtimes für einen Agent neu erstellen (entspricht `agent:<id>` und `agent:<id>:*`)
- `--browser`: nur Browser-Container betreffen
- `--force`: die Bestätigungsabfrage überspringen

Übergeben Sie genau eine der Optionen `--all`, `--session` oder `--agent`.

Bei `ssh` und OpenShell `remote` ist die Neuerstellung wichtiger als bei Docker: Nach der anfänglichen Übertragung ist der Remote-Arbeitsbereich maßgeblich. `recreate` löscht diesen maßgeblichen Remote-Arbeitsbereich für den ausgewählten Bereich, und beim nächsten Lauf wird er erneut aus dem aktuellen lokalen Arbeitsbereich übertragen.

### `openclaw sandbox explain`

Prüft den wirksamen Sandbox-Modus und -Bereich, den Arbeitsbereichszugriff, die Richtlinie für Sandbox-Tools sowie die Zugriffsschranken für Tools mit erhöhten Berechtigungen (einschließlich Konfigurationsschlüsselpfaden zur Behebung).

Der Bericht behält `workspaceRoot` als konfigurierten Sandbox-Stamm bei und zeigt separat den wirksamen Host-Arbeitsbereich, das Arbeitsverzeichnis der Backend-Runtime und die Docker-Einhängungstabelle. Bei `workspaceAccess: "rw"` ist der wirksame Host-Arbeitsbereich der Arbeitsbereich des Agent und nicht ein Verzeichnis unterhalb von `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Im Gegensatz zu `recreate --session` akzeptiert dieser Befehl kurze Sitzungsnamen (zum Beispiel `main`) und erweitert sie anhand des aufgelösten Agent.

## Warum eine Neuerstellung erforderlich ist

Das Aktualisieren der Sandbox-Konfiguration wirkt sich nicht auf laufende Container aus: Bestehende Runtimes behalten ihre alten Einstellungen, und inaktive Runtimes werden erst nach `prune.idleHours` (Standardwert: 24h) entfernt. Regelmäßig verwendete Agents können veraltete Runtimes unbegrenzt aktiv halten. `openclaw sandbox recreate` entfernt die alte Runtime, sodass sie bei der nächsten Verwendung anhand der aktuellen Konfiguration neu erstellt wird.

<Tip>
Verwenden Sie vorzugsweise `openclaw sandbox recreate` statt einer manuellen, Backend-spezifischen Bereinigung. Der Befehl verwendet die Runtime-Registry des Gateway und verhindert Abweichungen, wenn sich Bereichs- oder Sitzungsschlüssel ändern.
</Tip>

## Häufige Auslöser

| Änderung                                                                                                                                                       | Befehl                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Aktualisierung des Docker-Images (`agents.defaults.sandbox.docker.image`)                                                                                       | `openclaw sandbox recreate --all`                                   |
| Sandbox-Konfiguration (`agents.defaults.sandbox.*`)                                                                                                            | `openclaw sandbox recreate --all`                                   |
| SSH-Ziel/-Authentifizierung (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| OpenShell-Quelle/-Richtlinie/-Modus (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                      | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (oder `--agent <id>` für einen Agent) |

<Note>
Runtimes werden automatisch neu erstellt, wenn der Agent das nächste Mal verwendet wird.
</Note>

## Registry-Migration

Metadaten der Sandbox-Runtime werden in der gemeinsamen SQLite-Zustandsdatenbank gespeichert. Ältere Installationen können veraltete Registry-Dateien enthalten, die bei regulären Lesevorgängen nicht mehr neu geschrieben werden:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- ein JSON-Shard pro Container/Browser unter `~/.openclaw/sandbox/containers/` oder `~/.openclaw/sandbox/browsers/`

Führen Sie `openclaw doctor --fix` aus, um gültige veraltete Einträge nach SQLite zu migrieren. Ungültige veraltete Dateien werden unter Quarantäne gestellt, damit eine beschädigte alte Registry aktuelle Runtime-Einträge nicht verbergen kann.

## Konfiguration

Sandbox-Einstellungen befinden sich in `~/.openclaw/openclaw.json` unter `agents.defaults.sandbox` (Agent-spezifische Überschreibungen gehören in `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (vom Plugin bereitgestellt)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... weitere Docker-Optionen
        },
        "prune": {
          "idleHours": 24, // nach 24h Leerlauf automatisch entfernen
          "maxAgeDays": 7, // nach 7 Tagen automatisch entfernen
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
