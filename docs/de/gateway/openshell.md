---
read_when:
    - Sie möchten cloudverwaltete Sandboxes anstelle von lokalem Docker.
    - Sie richten das OpenShell-Plugin ein
    - Sie müssen zwischen dem Spiegelmodus und dem Remote-Arbeitsbereichsmodus wählen.
summary: OpenShell als verwaltetes Sandbox-Backend für OpenClaw-Agenten verwenden
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T15:25:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell ist ein verwaltetes Sandbox-Backend: Anstatt Docker-Container lokal
auszuführen, delegiert OpenClaw den Sandbox-Lebenszyklus an die `openshell`-CLI,
die Remote-Umgebungen bereitstellt und Befehle über SSH ausführt.

Das Plugin verwendet denselben SSH-Transport und dieselbe Brücke zum
Remote-Dateisystem wie das generische [SSH-Backend](/de/gateway/sandboxing#ssh-backend)
und ergänzt den OpenShell-Lebenszyklus (`sandbox create/get/delete/ssh-config`)
sowie einen optionalen `mirror`-Modus zur Synchronisierung des Arbeitsbereichs.

## Voraussetzungen

- Installiertes OpenShell-Plugin (`openclaw plugins install @openclaw/openshell-sandbox`)
- `openshell`-CLI im `PATH` (oder ein benutzerdefinierter Pfad über
  `plugins.entries.openshell.config.command`)
- Ein OpenShell-Konto mit Sandbox-Zugriff
- Auf dem Host ausgeführter OpenClaw Gateway

## Schnellstart

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

Starten Sie den Gateway neu. Beim nächsten Agentendurchlauf erstellt OpenClaw
eine OpenShell-Sandbox und leitet die Werkzeugausführung durch sie. Überprüfen Sie dies mit:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Arbeitsbereichsmodi

Dies ist die wichtigste Entscheidung bei OpenShell.

### mirror (Standard)

`plugins.entries.openshell.config.mode: "mirror"` hält den **lokalen Arbeitsbereich
kanonisch**:

- Vor `exec` synchronisiert OpenClaw den lokalen Arbeitsbereich mit der Sandbox.
- Nach `exec` synchronisiert OpenClaw den Remote-Arbeitsbereich zurück in den lokalen Arbeitsbereich.
- Dateiwerkzeuge verwenden die Sandbox-Bridge, aber der lokale Arbeitsbereich bleibt
  zwischen Ausführungen die maßgebliche Datenquelle.

Am besten für Entwicklungsabläufe geeignet: Lokale Änderungen außerhalb von OpenClaw werden bei der
nächsten Ausführung sichtbar, und die Sandbox verhält sich ähnlich wie das Docker-Backend.

Nachteil: Bei jeder Ausführung fallen Kosten für Upload und Download an.

### remote

`mode: "remote"` macht den **OpenShell-Arbeitsbereich kanonisch**:

- Beim erstmaligen Erstellen der Sandbox initialisiert OpenClaw den Remote-Arbeitsbereich einmalig
  aus dem lokalen Arbeitsbereich.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch`
  direkt im Remote-Arbeitsbereich. OpenClaw synchronisiert Remote-Änderungen **nicht**
  zurück in den lokalen Arbeitsbereich.
- Medienzugriffe zur Prompt-Zeit funktionieren weiterhin (Datei-/Medienwerkzeuge lesen über die
  Sandbox-Bridge).

Am besten für langlebige Agenten und CI geeignet: geringerer Aufwand pro Ausführung, und lokale
Änderungen auf dem Host können den Remote-Zustand nicht unbemerkt überschreiben.

<Warning>
Änderungen an Dateien auf dem Host außerhalb von OpenClaw sind nach der anfänglichen Initialisierung für die Remote-Sandbox nicht sichtbar. Führen Sie `openclaw sandbox recreate` aus, um sie neu zu initialisieren.
</Warning>

### Modus auswählen

|                               | `mirror`                         | `remote`                         |
| ----------------------------- | -------------------------------- | -------------------------------- |
| **Kanonischer Arbeitsbereich** | Lokaler Host                     | Remote-OpenShell                 |
| **Synchronisierungsrichtung**  | Bidirektional (bei jeder Ausführung) | Einmalige Initialisierung    |
| **Aufwand pro Ausführung**     | Höher (Upload + Download)        | Geringer (direkte Remote-Vorgänge) |
| **Lokale Änderungen sichtbar?** | Ja, bei der nächsten Ausführung | Nein, bis zur Neuerstellung      |
| **Am besten geeignet für**     | Entwicklungsabläufe              | Langlebige Agenten, CI           |

## Konfigurationsreferenz

Die gesamte OpenShell-Konfiguration befindet sich unter `plugins.entries.openshell.config`:

| Schlüssel                  | Typ                      | Standardwert  | Beschreibung                                                                                          |
| -------------------------- | ------------------------ | ------------- | ----------------------------------------------------------------------------------------------------- |
| `mode`                     | `"mirror"` oder `"remote"` | `"mirror"`  | Modus der Workspace-Synchronisierung                                                                  |
| `command`                  | `string`                 | `"openshell"` | Pfad oder Name der `openshell`-CLI                                                                    |
| `from`                     | `string`                 | `"openclaw"`  | Sandbox-Quelle für die erstmalige Erstellung                                                          |
| `gateway`                  | `string`                 | nicht gesetzt | Name des OpenShell-Gateways (`--gateway` auf oberster Ebene)                                          |
| `gatewayEndpoint`          | `string`                 | nicht gesetzt | Endpunkt des OpenShell-Gateways (`--gateway-endpoint` auf oberster Ebene)                             |
| `policy`                   | `string`                 | nicht gesetzt | OpenShell-Richtlinien-ID für die Sandbox-Erstellung                                                    |
| `providers`                | `string[]`               | `[]`          | Bei der Sandbox-Erstellung angehängte Provider-Namen (dedupliziert, ein `--provider`-Flag pro Eintrag) |
| `gpu`                      | `boolean`                | `false`       | GPU-Ressourcen anfordern (`--gpu`)                                                                     |
| `autoProviders`            | `boolean`                | `true`        | Bei der Erstellung `--auto-providers` übergeben (oder `--no-auto-providers`, wenn false)               |
| `remoteWorkspaceDir`       | `string`                 | `"/sandbox"`  | Primärer beschreibbarer Workspace innerhalb der Sandbox                                               |
| `remoteAgentWorkspaceDir`  | `string`                 | `"/agent"`    | Einhängepfad des Agent-Workspace (schreibgeschützt, wenn der Workspace-Zugriff nicht `rw` ist)         |
| `timeoutSeconds`           | `number`                 | `120`         | Zeitüberschreitung für Operationen der `openshell`-CLI                                                 |

`remoteWorkspaceDir` und `remoteAgentWorkspaceDir` müssen absolute Pfade sein und
unter den verwalteten Stammverzeichnissen `/sandbox` oder `/agent` bleiben; andere absolute Pfade werden
abgelehnt.

Einstellungen auf Sandbox-Ebene (`mode`, `scope`, `workspaceAccess`) befinden sich wie bei jedem Backend unter
`agents.defaults.sandbox`. Die vollständige Matrix finden Sie unter
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

### Spiegelmodus mit GPU

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

```bash
# Alle Sandbox-Laufzeitumgebungen auflisten (Docker + OpenShell)
openclaw sandbox list

# Effektive Richtlinie prüfen
openclaw sandbox explain

# Neu erstellen (löscht den Remote-Workspace und initialisiert ihn bei der nächsten Verwendung erneut)
openclaw sandbox recreate --all
```

Im Modus `remote` ist die Neuerstellung besonders wichtig: Sie löscht den kanonischen
Remote-Workspace für diesen Geltungsbereich, und bei der nächsten Verwendung wird ein neuer aus dem
lokalen Workspace initialisiert. Im Modus `mirror` setzt die Neuerstellung hauptsächlich die Remote-Ausführungsumgebung
zurück, da der lokale Workspace kanonisch bleibt.

Führen Sie nach Änderungen an einem der folgenden Werte eine Neuerstellung durch:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Sicherheitshärtung

Die Dateisystembrücke des Spiegelmodus bindet das lokale Workspace-Stammverzeichnis fest ein und prüft
die kanonischen Pfade (über realpath) vor jedem Lese-, Schreib-, mkdir-, Lösch- und
Umbenennungsvorgang erneut, wobei symbolische Links innerhalb des Pfades abgelehnt werden. Ein Austausch eines symbolischen Links oder ein neu eingehängter Workspace
kann den Dateizugriff nicht aus dem gespiegelten Verzeichnisbaum heraus umleiten.

## Aktuelle Einschränkungen

- Der Sandbox-Browser wird im OpenShell-Backend nicht unterstützt.
- `sandbox.docker.binds` gilt nicht für OpenShell; die Sandbox-Erstellung schlägt fehl,
  wenn Bind-Mounts konfiguriert sind.
- Docker-spezifische Laufzeitoptionen unter `sandbox.docker.*` (außer `env`)
  gelten nur für das Docker-Backend.

## Funktionsweise

1. OpenClaw führt `sandbox get` für den Sandbox-Namen aus (mit allen konfigurierten
   `--gateway`/`--gateway-endpoint`-Optionen); falls dies fehlschlägt, erstellt OpenClaw mit
   `sandbox create` eine Sandbox und übergibt dabei `--name`, `--from`, `--policy`, sofern festgelegt, `--gpu`,
   sofern aktiviert, `--auto-providers`/`--no-auto-providers` sowie ein
   `--provider`-Flag pro konfiguriertem Provider.
2. OpenClaw führt `sandbox ssh-config` für den Sandbox-Namen aus, um die SSH-Verbindungsdetails
   abzurufen.
3. Der Kern schreibt die SSH-Konfiguration in eine temporäre Datei und öffnet eine SSH-Sitzung über
   dieselbe Remote-Dateisystembrücke wie das generische SSH-Backend.
4. Im Modus `mirror`: Vor der Ausführung vom lokalen zum Remote-Workspace synchronisieren, ausführen und anschließend zurücksynchronisieren.
5. Im Modus `remote`: Bei der Erstellung einmalig initialisieren und anschließend direkt im Remote-
   Workspace arbeiten.

## Verwandte Themen

- [Sandboxing](/de/gateway/sandboxing) – Modi, Geltungsbereiche und Backend-Vergleich
- [Sandbox vs. Tool-Richtlinie vs. erhöhte Rechte](/de/gateway/sandbox-vs-tool-policy-vs-elevated) – Debugging blockierter Tools
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) – Überschreibungen pro Agent
- [Sandbox-CLI](/de/cli/sandbox) – `openclaw sandbox`-Befehle
