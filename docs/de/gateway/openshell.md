---
read_when:
    - Sie möchten cloudverwaltete Sandboxes statt lokalem Docker
    - Sie richten das OpenShell-Plugin ein
    - Sie müssen zwischen Spiegel- und Remote-Arbeitsbereichsmodi wählen
summary: OpenShell als verwaltetes Sandbox-Backend für OpenClaw-Agenten verwenden
title: OpenShell
x-i18n:
    generated_at: "2026-04-30T06:55:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell ist ein verwaltetes Sandbox-Backend für OpenClaw. Statt Docker-
Container lokal auszuführen, delegiert OpenClaw den Sandbox-Lebenszyklus an die `openshell`-CLI,
die Remote-Umgebungen mit SSH-basierter Befehlsausführung bereitstellt.

Das OpenShell-Plugin verwendet denselben zentralen SSH-Transport und dieselbe Remote-Dateisystem-
Bridge wie das generische [SSH-Backend](/de/gateway/sandboxing#ssh-backend). Es ergänzt
OpenShell-spezifische Lebenszyklusfunktionen (`sandbox create/get/delete`, `sandbox ssh-config`)
und einen optionalen `mirror`-Workspace-Modus.

## Voraussetzungen

- Die `openshell`-CLI ist installiert und in `PATH` verfügbar (oder Sie legen einen benutzerdefinierten Pfad über
  `plugins.entries.openshell.config.command` fest)
- Ein OpenShell-Konto mit Sandbox-Zugriff
- OpenClaw Gateway läuft auf dem Host

## Schnellstart

1. Aktivieren Sie das Plugin und legen Sie das Sandbox-Backend fest:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Starten Sie den Gateway neu. Beim nächsten Agent-Turn erstellt OpenClaw eine OpenShell-
   Sandbox und leitet die Tool-Ausführung darüber.

3. Prüfen Sie:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Workspace-Modi

Dies ist die wichtigste Entscheidung bei der Verwendung von OpenShell.

### `mirror`

Verwenden Sie `plugins.entries.openshell.config.mode: "mirror"`, wenn der **lokale
Workspace kanonisch bleiben** soll.

Verhalten:

- Vor `exec` synchronisiert OpenClaw den lokalen Workspace in die OpenShell-Sandbox.
- Nach `exec` synchronisiert OpenClaw den Remote-Workspace zurück in den lokalen Workspace.
- Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace
  bleibt zwischen Turns die Quelle der Wahrheit.

Am besten geeignet für:

- Sie bearbeiten Dateien lokal außerhalb von OpenClaw und möchten, dass diese Änderungen automatisch in der
  Sandbox sichtbar werden.
- Sie möchten, dass sich die OpenShell-Sandbox so weit wie möglich wie das Docker-Backend
  verhält.
- Sie möchten, dass der Host-Workspace nach jedem Exec-Turn Schreibvorgänge aus der Sandbox widerspiegelt.

Kompromiss: zusätzliche Synchronisierungskosten vor und nach jedem Exec.

### `remote`

Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn der
**OpenShell-Workspace kanonisch werden** soll.

Verhalten:

- Wenn die Sandbox erstmals erstellt wird, befüllt OpenClaw den Remote-Workspace einmalig aus
  dem lokalen Workspace.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch`
  direkt gegen den Remote-Workspace von OpenShell.
- OpenClaw synchronisiert Remote-Änderungen **nicht** zurück in den lokalen Workspace.
- Medien-Lesevorgänge zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Medien-Tools über
  die Sandbox-Bridge lesen.

Am besten geeignet für:

- Die Sandbox soll hauptsächlich auf der Remote-Seite leben.
- Sie möchten einen geringeren Synchronisierungsaufwand pro Turn.
- Sie möchten nicht, dass host-lokale Bearbeitungen den Remote-Sandbox-Zustand stillschweigend überschreiben.

<Warning>
Wenn Sie nach der initialen Befüllung Dateien auf dem Host außerhalb von OpenClaw bearbeiten, sieht die Remote-Sandbox diese Änderungen **nicht**. Verwenden Sie `openclaw sandbox recreate`, um erneut zu befüllen.
</Warning>

### Einen Modus auswählen

|                          | `mirror`                                | `remote`                              |
| ------------------------ | --------------------------------------- | ------------------------------------- |
| **Kanonischer Workspace** | Lokaler Host                            | Remote-OpenShell                      |
| **Synchronisierungsrichtung** | Bidirektional (jedes Exec)          | Einmalige Befüllung                   |
| **Aufwand pro Turn**     | Höher (Upload + Download)               | Geringer (direkte Remote-Operationen) |
| **Lokale Änderungen sichtbar?** | Ja, beim nächsten Exec           | Nein, erst nach recreate              |
| **Am besten geeignet für** | Entwicklungsworkflows                 | Lang laufende Agents, CI              |

## Konfigurationsreferenz

Die gesamte OpenShell-Konfiguration befindet sich unter `plugins.entries.openshell.config`:

| Schlüssel                 | Typ                      | Standard      | Beschreibung                                         |
| ------------------------- | ------------------------ | ------------- | ---------------------------------------------------- |
| `mode`                    | `"mirror"` oder `"remote"` | `"mirror"`  | Workspace-Synchronisierungsmodus                     |
| `command`                 | `string`                 | `"openshell"` | Pfad oder Name der `openshell`-CLI                   |
| `from`                    | `string`                 | `"openclaw"`  | Sandbox-Quelle für die erstmalige Erstellung         |
| `gateway`                 | `string`                 | —             | OpenShell-Gateway-Name (`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell-Gateway-Endpunkt-URL (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | OpenShell-Policy-ID für die Sandbox-Erstellung       |
| `providers`               | `string[]`               | `[]`          | Provider-Namen, die beim Erstellen der Sandbox angehängt werden |
| `gpu`                     | `boolean`                | `false`       | GPU-Ressourcen anfordern                             |
| `autoProviders`           | `boolean`                | `true`        | `--auto-providers` bei der Sandbox-Erstellung übergeben |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Primärer beschreibbarer Workspace innerhalb der Sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Mount-Pfad des Agent-Workspaces (für schreibgeschützten Zugriff) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout für `openshell`-CLI-Operationen              |

Sandbox-Einstellungen (`mode`, `scope`, `workspaceAccess`) werden wie bei jedem Backend unter
`agents.defaults.sandbox` konfiguriert. Die vollständige Matrix finden Sie unter
[Sandboxing](/de/gateway/sandboxing).

## Beispiele

### Minimale Remote-Einrichtung

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Mirror-Modus mit GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell pro Agent mit benutzerdefiniertem Gateway

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Lebenszyklusverwaltung

OpenShell-Sandboxes werden über die normale Sandbox-CLI verwaltet:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Für den `remote`-Modus ist **recreate besonders wichtig**: Es löscht den kanonischen
Remote-Workspace für diesen Scope. Bei der nächsten Verwendung wird ein frischer Remote-Workspace aus
dem lokalen Workspace befüllt.

Für den `mirror`-Modus setzt recreate vor allem die Remote-Ausführungsumgebung zurück, weil
der lokale Workspace kanonisch bleibt.

### Wann recreate verwendet werden sollte

Verwenden Sie recreate nach Änderungen an einem der folgenden Werte:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Sicherheitshärtung

OpenShell fixiert den Root-fd des Workspaces und prüft vor jedem Lesevorgang die Sandbox-Identität erneut,
sodass Symlink-Austausche oder ein neu eingehängter Workspace Lesevorgänge nicht aus
dem vorgesehenen Remote-Workspace heraus umleiten können.

## Aktuelle Einschränkungen

- Der Sandbox-Browser wird im OpenShell-Backend nicht unterstützt.
- `sandbox.docker.binds` gilt nicht für OpenShell.
- Docker-spezifische Runtime-Schalter unter `sandbox.docker.*` gelten nur für das Docker-
  Backend.

## Funktionsweise

1. OpenClaw ruft `openshell sandbox create` auf (mit den Flags `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` wie konfiguriert).
2. OpenClaw ruft `openshell sandbox ssh-config <name>` auf, um SSH-Verbindungsdetails
   für die Sandbox abzurufen.
3. Der Core schreibt die SSH-Konfiguration in eine temporäre Datei und öffnet eine SSH-Sitzung über dieselbe
   Remote-Dateisystem-Bridge wie das generische SSH-Backend.
4. Im `mirror`-Modus: lokal vor exec nach remote synchronisieren, ausführen, nach exec zurück synchronisieren.
5. Im `remote`-Modus: einmalig beim Erstellen befüllen, danach direkt auf dem Remote-
   Workspace arbeiten.

## Verwandte Themen

- [Sandboxing](/de/gateway/sandboxing) -- Modi, Scopes und Backend-Vergleich
- [Sandbox vs Tool-Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Debugging blockierter Tools
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent
- [Sandbox-CLI](/de/cli/sandbox) -- `openclaw sandbox`-Befehle
