---
read_when:
    - Sie möchten cloudverwaltete Sandboxes statt lokalem Docker
    - Sie richten das OpenShell-Plugin ein
    - Sie müssen zwischen Spiegel- und Remote-Arbeitsbereichsmodus wählen
summary: Verwenden Sie OpenShell als verwaltetes Sandbox-Backend für OpenClaw-Agenten
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T17:31:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell ist ein verwaltetes Sandbox-Backend für OpenClaw. Statt Docker-
Container lokal auszuführen, delegiert OpenClaw den Sandbox-Lebenszyklus an die `openshell` CLI,
die Remote-Umgebungen mit SSH-basierter Befehlsausführung bereitstellt.

Das OpenShell-Plugin verwendet denselben zentralen SSH-Transport und dieselbe Remote-Dateisystem-
Bridge wie das generische [SSH-Backend](/de/gateway/sandboxing#ssh-backend). Es ergänzt
OpenShell-spezifischen Lebenszyklus (`sandbox create/get/delete`, `sandbox ssh-config`)
und einen optionalen Arbeitsbereichsmodus `mirror`.

## Voraussetzungen

- OpenShell-Plugin installiert (`openclaw plugins install @openclaw/openshell-sandbox`)
- Die `openshell` CLI ist installiert und auf `PATH` verfügbar (oder legen Sie einen benutzerdefinierten Pfad über
  `plugins.entries.openshell.config.command` fest)
- Ein OpenShell-Konto mit Sandbox-Zugriff
- OpenClaw Gateway läuft auf dem Host

## Schnellstart

1. Installieren und aktivieren Sie das Plugin, legen Sie dann das Sandbox-Backend fest:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

## Arbeitsbereichsmodi

Dies ist die wichtigste Entscheidung bei der Verwendung von OpenShell.

### `mirror`

Verwenden Sie `plugins.entries.openshell.config.mode: "mirror"`, wenn der **lokale
Arbeitsbereich kanonisch bleiben** soll.

Verhalten:

- Vor `exec` synchronisiert OpenClaw den lokalen Arbeitsbereich in die OpenShell-Sandbox.
- Nach `exec` synchronisiert OpenClaw den Remote-Arbeitsbereich zurück in den lokalen Arbeitsbereich.
- Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Arbeitsbereich
  bleibt zwischen Turns die Quelle der Wahrheit.

Am besten geeignet für:

- Sie bearbeiten Dateien lokal außerhalb von OpenClaw und möchten, dass diese Änderungen automatisch
  in der Sandbox sichtbar sind.
- Die OpenShell-Sandbox soll sich möglichst ähnlich wie das Docker-Backend
  verhalten.
- Der Host-Arbeitsbereich soll Sandbox-Schreibvorgänge nach jedem Exec-Turn widerspiegeln.

Kompromiss: zusätzliche Synchronisierungskosten vor und nach jedem Exec.

### `remote`

Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn der
**OpenShell-Arbeitsbereich kanonisch werden** soll.

Verhalten:

- Wenn die Sandbox erstmals erstellt wird, befüllt OpenClaw den Remote-Arbeitsbereich einmal aus
  dem lokalen Arbeitsbereich.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch`
  direkt gegen den Remote-OpenShell-Arbeitsbereich.
- OpenClaw synchronisiert Remote-Änderungen **nicht** zurück in den lokalen Arbeitsbereich.
- Medien-Lesevorgänge zur Prompt-Zeit funktionieren weiterhin, da Datei- und Medien-Tools über
  die Sandbox-Bridge lesen.

Am besten geeignet für:

- Die Sandbox soll primär auf der Remote-Seite leben.
- Sie möchten geringeren Synchronisierungsaufwand pro Turn.
- Sie möchten nicht, dass hostlokale Bearbeitungen den Remote-Sandbox-Zustand stillschweigend überschreiben.

<Warning>
Wenn Sie nach der anfänglichen Befüllung Dateien auf dem Host außerhalb von OpenClaw bearbeiten, sieht die Remote-Sandbox diese Änderungen **nicht**. Verwenden Sie `openclaw sandbox recreate`, um erneut zu befüllen.
</Warning>

### Einen Modus wählen

|                          | `mirror`                                | `remote`                                 |
| ------------------------ | --------------------------------------- | ---------------------------------------- |
| **Kanonischer Arbeitsbereich** | Lokaler Host                       | Remote-OpenShell                         |
| **Synchronisierungsrichtung**  | Bidirektional (jedes Exec)         | Einmalige Befüllung                      |
| **Aufwand pro Turn**           | Höher (Upload + Download)          | Geringer (direkte Remote-Operationen)    |
| **Lokale Änderungen sichtbar?** | Ja, beim nächsten Exec             | Nein, erst nach recreate                 |
| **Am besten geeignet für**     | Entwicklungsworkflows              | Lang laufende Agents, CI                 |

## Konfigurationsreferenz

Die gesamte OpenShell-Konfiguration liegt unter `plugins.entries.openshell.config`:

| Schlüssel                 | Typ                      | Standard      | Beschreibung                                             |
| ------------------------- | ------------------------ | ------------- | -------------------------------------------------------- |
| `mode`                    | `"mirror"` oder `"remote"` | `"mirror"`  | Synchronisierungsmodus des Arbeitsbereichs               |
| `command`                 | `string`                 | `"openshell"` | Pfad oder Name der `openshell` CLI                       |
| `from`                    | `string`                 | `"openclaw"`  | Sandbox-Quelle für die erstmalige Erstellung             |
| `gateway`                 | `string`                 | —             | OpenShell-Gateway-Name (`--gateway`)                     |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell-Gateway-Endpunkt-URL (`--gateway-endpoint`)    |
| `policy`                  | `string`                 | —             | OpenShell-Richtlinien-ID für die Sandbox-Erstellung      |
| `providers`               | `string[]`               | `[]`          | Provider-Namen, die beim Erstellen der Sandbox angehängt werden |
| `gpu`                     | `boolean`                | `false`       | GPU-Ressourcen anfordern                                 |
| `autoProviders`           | `boolean`                | `true`        | `--auto-providers` während der Sandbox-Erstellung übergeben |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Primärer beschreibbarer Arbeitsbereich innerhalb der Sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Mount-Pfad des Agent-Arbeitsbereichs (für schreibgeschützten Zugriff) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout für Operationen der `openshell` CLI              |

Sandbox-Einstellungen (`mode`, `scope`, `workspaceAccess`) werden unter
`agents.defaults.sandbox` wie bei jedem Backend konfiguriert. Siehe
[Sandboxing](/de/gateway/sandboxing) für die vollständige Matrix.

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
# Alle Sandbox-Runtimes auflisten (Docker + OpenShell)
openclaw sandbox list

# Effektive Richtlinie prüfen
openclaw sandbox explain

# Neu erstellen (löscht Remote-Arbeitsbereich, befüllt bei der nächsten Verwendung erneut)
openclaw sandbox recreate --all
```

Für den Modus `remote` ist **recreate besonders wichtig**: Es löscht den kanonischen
Remote-Arbeitsbereich für diesen Scope. Die nächste Verwendung befüllt einen frischen Remote-Arbeitsbereich aus
dem lokalen Arbeitsbereich.

Für den Modus `mirror` setzt recreate hauptsächlich die Remote-Ausführungsumgebung zurück, weil
der lokale Arbeitsbereich kanonisch bleibt.

### Wann neu erstellen

Erstellen Sie neu, nachdem Sie eines der folgenden Elemente geändert haben:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Sicherheitshärtung

OpenShell fixiert den fd des Arbeitsbereichs-Roots und prüft die Sandbox-Identität vor jedem
Lesevorgang erneut, sodass Symlink-Austausche oder ein erneut gemounteter Arbeitsbereich Lesevorgänge nicht aus
dem beabsichtigten Remote-Arbeitsbereich heraus umleiten können.

## Aktuelle Einschränkungen

- Der Sandbox-Browser wird auf dem OpenShell-Backend nicht unterstützt.
- `sandbox.docker.binds` gilt nicht für OpenShell.
- Docker-spezifische Runtime-Optionen unter `sandbox.docker.*` gelten nur für das Docker-
  Backend.

## Funktionsweise

1. OpenClaw ruft `openshell sandbox create` auf (mit `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` Flags gemäß Konfiguration).
2. OpenClaw ruft `openshell sandbox ssh-config <name>` auf, um SSH-Verbindungsdetails
   für die Sandbox zu erhalten.
3. Core schreibt die SSH-Konfiguration in eine temporäre Datei und öffnet eine SSH-Sitzung mit derselben
   Remote-Dateisystem-Bridge wie das generische SSH-Backend.
4. Im Modus `mirror`: lokal vor exec nach remote synchronisieren, ausführen, nach exec zurücksynchronisieren.
5. Im Modus `remote`: einmal beim Erstellen befüllen, dann direkt im Remote-
   Arbeitsbereich arbeiten.

## Verwandt

- [Sandboxing](/de/gateway/sandboxing) -- Modi, Scopes und Backend-Vergleich
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Debugging blockierter Tools
- [Multi-Agent Sandbox and Tools](/de/tools/multi-agent-sandbox-tools) -- Overrides pro Agent
- [Sandbox CLI](/de/cli/sandbox) -- `openclaw sandbox` Befehle
