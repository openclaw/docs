---
read_when:
    - Sie möchten cloudverwaltete Sandboxes anstelle von lokalem Docker.
    - Sie richten das OpenShell-Plugin ein
    - Sie müssen zwischen dem Spiegel- und dem Remote-Arbeitsbereichsmodus wählen
summary: Verwenden Sie OpenShell als verwaltetes Sandbox-Backend für OpenClaw-Agenten
title: OpenShell
x-i18n:
    generated_at: "2026-07-24T03:52:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell ist ein verwaltetes Sandbox-Backend: Statt Docker-Container
lokal auszuführen, delegiert OpenClaw den Sandbox-Lebenszyklus an die `openshell`-CLI, die
Remote-Umgebungen bereitstellt und Befehle über SSH ausführt.

Das Plugin verwendet denselben SSH-Transport und dieselbe Remote-Dateisystem-Bridge wie das
generische [SSH-Backend](/de/gateway/sandboxing#ssh-backend) und ergänzt den OpenShell-
Lebenszyklus (`sandbox create/get/delete/ssh-config`) sowie einen optionalen `mirror`-
Arbeitsbereich-Synchronisierungsmodus.

## Voraussetzungen

- OpenShell-Plugin installiert (`openclaw plugins install @openclaw/openshell-sandbox`)
- `openshell`-CLI in `PATH` (oder ein benutzerdefinierter Pfad über
  `plugins.entries.openshell.config.command`)
- Ein OpenShell-Konto mit Sandbox-Zugriff
- Auf dem Host ausgeführtes OpenClaw Gateway

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

Starten Sie das Gateway neu. Beim nächsten Agent-Durchlauf erstellt OpenClaw eine OpenShell-
Sandbox und leitet die Werkzeugausführung durch sie. Überprüfen Sie dies mit:

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
- Nach `exec` synchronisiert OpenClaw den Remote-Arbeitsbereich zurück auf den lokalen Host.
- Dateiwerkzeuge verwenden die Sandbox-Bridge, aber der lokale Arbeitsbereich bleibt
  zwischen den Durchläufen die maßgebliche Datenquelle.

Am besten für Entwicklungsabläufe geeignet: Lokale Änderungen außerhalb von OpenClaw werden bei der
nächsten Ausführung übernommen, und die Sandbox verhält sich ähnlich wie das Docker-Backend.

Nachteil: Upload- und Download-Aufwand bei jedem Ausführungsdurchlauf.

### remote

`mode: "remote"` macht den **OpenShell-Arbeitsbereich kanonisch**:

- Bei der ersten Erstellung der Sandbox überträgt OpenClaw den lokalen Arbeitsbereich
  einmalig in den Remote-Arbeitsbereich.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch`
  direkt im Remote-Arbeitsbereich. OpenClaw synchronisiert Remote-Änderungen
  **nicht** zurück auf den lokalen Host.
- Medienzugriffe während der Prompt-Verarbeitung funktionieren weiterhin (Datei-/Medienwerkzeuge lesen über die
  Sandbox-Bridge).

Am besten für langlebige Agents und CI geeignet: geringerer Aufwand pro Durchlauf, und lokale
Änderungen auf dem Host können den Remote-Zustand nicht unbemerkt überschreiben.

<Warning>
Dateiänderungen auf dem Host außerhalb von OpenClaw sind nach der initialen Übertragung für die Remote-Sandbox nicht sichtbar. Führen Sie `openclaw sandbox recreate` aus, um die Daten erneut zu übertragen.
</Warning>

### Modus auswählen

|                            | `mirror`                         | `remote`                         |
| -------------------------- | ------------------------------------------ | ------------------------------------------ |
| **Kanonischer Arbeitsbereich** | Lokaler Host                           | Remote-OpenShell                           |
| **Synchronisierungsrichtung**  | Bidirektional (bei jeder Ausführung)   | Einmalige Übertragung                      |
| **Aufwand pro Durchlauf**      | Höher (Upload + Download)               | Niedriger (direkte Remote-Operationen)     |
| **Lokale Änderungen sichtbar?** | Ja, bei der nächsten Ausführung       | Nein, bis zur Neuerstellung                |
| **Am besten geeignet für**     | Entwicklungsabläufe                    | Langlebige Agents, CI                      |

## Konfigurationsreferenz

Die gesamte OpenShell-Konfiguration befindet sich unter `plugins.entries.openshell.config`:

| Schlüssel                  | Typ                      | Standardwert  | Beschreibung                                                                           |
| -------------------------- | ------------------------ | ------------- | -------------------------------------------------------------------------------------- |
| `mode`         | `"mirror"` oder `"remote"` | `"mirror"` | Synchronisierungsmodus des Arbeitsbereichs                                      |
| `command`         | `string`       | `"openshell"` | Pfad oder Name der `openshell`-CLI                                        |
| `from`         | `string`       | `"openclaw"` | Sandbox-Quelle für die erstmalige Erstellung                                     |
| `gateway`         | `string`       | nicht gesetzt | Name des OpenShell-Gateways (`--gateway` auf oberster Ebene)               |
| `gatewayEndpoint`         | `string`       | nicht gesetzt | Endpunkt des OpenShell-Gateways (`--gateway-endpoint` auf oberster Ebene)           |
| `policy`         | `string`       | nicht gesetzt | OpenShell-Richtlinien-ID für die Sandbox-Erstellung                               |
| `providers`         | `string[]`       | `[]` | Bei der Sandbox-Erstellung zugeordnete Provider-Namen (dedupliziert, ein `--provider`-Flag pro Eintrag) |
| `gpu`         | `boolean`       | `false` | GPU-Ressourcen anfordern (`--gpu`)                                     |
| `autoProviders`         | `boolean`       | `true` | Bei der Erstellung `--auto-providers` übergeben (oder `--no-auto-providers`, wenn falsch) |
| `remoteWorkspaceDir`         | `string`       | `"/sandbox"` | Primärer beschreibbarer Arbeitsbereich innerhalb der Sandbox                      |
| `remoteAgentWorkspaceDir`         | `string`       | `"/agent"` | Einhängepfad des Agent-Arbeitsbereichs (schreibgeschützt, wenn der Arbeitsbereichszugriff nicht `rw` ist) |
| `timeoutSeconds`         | `number`       | `120` | Zeitlimit für Operationen der `openshell`-CLI                              |

`remoteWorkspaceDir` und `remoteAgentWorkspaceDir` müssen absolute Pfade sein und
innerhalb der verwalteten Stammverzeichnisse `/sandbox` oder `/agent` liegen; andere absolute Pfade werden
abgelehnt.

Sandbox-spezifische Einstellungen (`mode`, `scope`, `workspaceAccess`) befinden sich wie bei jedem Backend unter
`agents.defaults.sandbox`. Die vollständige Übersicht finden Sie unter
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

### Agent-spezifisches OpenShell mit benutzerdefiniertem Gateway

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

# Wirksame Richtlinie prüfen
openclaw sandbox explain

# Neu erstellen (löscht den Remote-Arbeitsbereich und überträgt ihn bei der nächsten Verwendung erneut)
openclaw sandbox recreate --all
```

Im `remote`-Modus ist die Neuerstellung besonders wichtig: Sie löscht den kanonischen
Remote-Arbeitsbereich für diesen Geltungsbereich, und bei der nächsten Verwendung wird ein neuer aus dem
lokalen Arbeitsbereich übertragen. Im `mirror`-Modus setzt die Neuerstellung hauptsächlich die Remote-Ausführungsumgebung
zurück, da der lokale Arbeitsbereich kanonisch bleibt.

Führen Sie nach Änderungen an folgenden Einstellungen eine Neuerstellung durch:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Sicherheitshärtung

Die Dateisystem-Bridge des Mirror-Modus fixiert das lokale Stammverzeichnis des Arbeitsbereichs und prüft
vor jedem Lesen, Schreiben, Erstellen eines Verzeichnisses, Entfernen und
Umbenennen erneut die kanonischen Pfade (über realpath), wobei symbolische Links innerhalb des Pfads abgelehnt werden. Das Austauschen eines symbolischen Links oder ein erneut eingehängter Arbeitsbereich
kann den Dateizugriff nicht aus dem gespiegelten Verzeichnisbaum heraus umleiten.

## Aktuelle Einschränkungen

- Der Sandbox-Browser wird vom OpenShell-Backend nicht unterstützt.
- `sandbox.docker.binds` gilt nicht für OpenShell; die Sandbox-Erstellung schlägt fehl,
  wenn Bind-Mounts konfiguriert sind.
- Docker-spezifische Laufzeitoptionen unter `sandbox.docker.*` (außer `env`)
  gelten nur für das Docker-Backend.

## Funktionsweise

1. OpenClaw führt `sandbox get` für den Sandbox-Namen aus (mit allen konfigurierten
   `--gateway`/`--gateway-endpoint`); schlägt dies fehl, wird mit
   `sandbox create` eine Sandbox erstellt. Dabei werden `--name`, `--from`, `--policy`, sofern festgelegt, `--gpu`,
   sofern aktiviert, `--auto-providers`/`--no-auto-providers` sowie ein
   `--provider`-Flag pro konfiguriertem Provider übergeben.
2. OpenClaw führt `sandbox ssh-config` für den Sandbox-Namen aus, um die SSH-
   Verbindungsdetails abzurufen.
3. Der Core schreibt die SSH-Konfiguration in eine temporäre Datei und öffnet über
   dieselbe Remote-Dateisystem-Bridge wie das generische SSH-Backend eine SSH-Sitzung.
4. Im `mirror`-Modus: Vor der Ausführung vom lokalen zum Remote-Arbeitsbereich synchronisieren, ausführen und anschließend zurücksynchronisieren.
5. Im `remote`-Modus: Bei der Erstellung einmalig übertragen und anschließend direkt im Remote-
   Arbeitsbereich arbeiten.

## Verwandte Themen

- [Sandboxing](/de/gateway/sandboxing) – Modi, Geltungsbereiche und Backend-Vergleich
- [Sandbox vs. Werkzeugrichtlinie vs. Erweitert](/de/gateway/sandbox-vs-tool-policy-vs-elevated) – Fehlersuche bei blockierten Werkzeugen
- [Multi-Agent-Sandbox und Werkzeuge](/de/tools/multi-agent-sandbox-tools) – Agent-spezifische Überschreibungen
- [Sandbox-CLI](/de/cli/sandbox) – `openclaw sandbox`-Befehle
