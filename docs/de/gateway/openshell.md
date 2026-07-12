---
read_when:
    - Sie möchten cloudverwaltete Sandboxes anstelle von lokalem Docker.
    - Sie richten das OpenShell-Plugin ein
    - Sie müssen zwischen dem Spiegelmodus und dem Remote-Arbeitsbereichsmodus wählen
summary: Verwenden Sie OpenShell als verwaltetes Sandbox-Backend für OpenClaw-Agenten
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T01:41:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell ist ein verwaltetes Sandbox-Backend: Statt Docker-Container lokal
auszuführen, delegiert OpenClaw den Lebenszyklus der Sandbox an die CLI
`openshell`, die Remote-Umgebungen bereitstellt und Befehle über SSH ausführt.

Das Plugin verwendet denselben SSH-Transport und dieselbe Brücke zum
Remote-Dateisystem wie das generische [SSH-Backend](/de/gateway/sandboxing#ssh-backend)
und ergänzt den OpenShell-Lebenszyklus (`sandbox create/get/delete/ssh-config`)
sowie einen optionalen `mirror`-Modus zur Synchronisierung des Arbeitsbereichs.

## Voraussetzungen

- Installiertes OpenShell-Plugin (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` im `PATH` (oder ein benutzerdefinierter Pfad über
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

Starten Sie den Gateway neu. Beim nächsten Agent-Durchlauf erstellt OpenClaw
eine OpenShell-Sandbox und leitet die Werkzeugausführung durch sie. Überprüfen
Sie dies mit:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Arbeitsbereichsmodi

Dies ist die wichtigste Entscheidung bei OpenShell.

### mirror (Standard)

`plugins.entries.openshell.config.mode: "mirror"` legt den **lokalen
Arbeitsbereich als maßgeblich** fest:

- Vor `exec` synchronisiert OpenClaw den lokalen Arbeitsbereich in die Sandbox.
- Nach `exec` synchronisiert OpenClaw den Remote-Arbeitsbereich zurück zum lokalen Arbeitsbereich.
- Dateiwerkzeuge verwenden die Sandbox-Brücke, aber zwischen den Durchläufen
  bleibt der lokale Arbeitsbereich die maßgebliche Datenquelle.

Am besten für Entwicklungsabläufe geeignet: Lokale Änderungen außerhalb von
OpenClaw werden beim nächsten `exec` sichtbar, und die Sandbox verhält sich
ähnlich wie das Docker-Backend.

Nachteil: Kosten für Hoch- und Herunterladen bei jedem `exec`-Durchlauf.

### remote

`mode: "remote"` legt den **OpenShell-Arbeitsbereich als maßgeblich** fest:

- Bei der erstmaligen Erstellung der Sandbox initialisiert OpenClaw den
  Remote-Arbeitsbereich einmalig aus dem lokalen Arbeitsbereich.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch` direkt
  im Remote-Arbeitsbereich. OpenClaw synchronisiert Remote-Änderungen
  **nicht** zurück zum lokalen Arbeitsbereich.
- Das Lesen von Medien für Prompts funktioniert weiterhin (Datei- und
  Medienwerkzeuge lesen über die Sandbox-Brücke).

Am besten für lang laufende Agenten und CI geeignet: geringerer Aufwand pro
Durchlauf, und lokale Änderungen auf dem Host können den Remote-Zustand nicht
unbemerkt überschreiben.

<Warning>
Änderungen an Dateien auf dem Host außerhalb von OpenClaw nach der anfänglichen Initialisierung sind für die Remote-Sandbox nicht sichtbar. Führen Sie `openclaw sandbox recreate` aus, um sie neu zu initialisieren.
</Warning>

### Auswahl eines Modus

|                              | `mirror`                                 | `remote`                            |
| ---------------------------- | ---------------------------------------- | ----------------------------------- |
| **Maßgeblicher Arbeitsbereich** | Lokaler Host                          | Remote-OpenShell                    |
| **Synchronisierungsrichtung**   | Bidirektional (bei jedem `exec`)      | Einmalige Initialisierung           |
| **Aufwand pro Durchlauf**        | Höher (Hoch- und Herunterladen)       | Niedriger (direkte Remote-Vorgänge) |
| **Lokale Änderungen sichtbar?** | Ja, beim nächsten `exec`              | Nein, bis zur Neuerstellung         |
| **Am besten geeignet für**       | Entwicklungsabläufe                   | Lang laufende Agenten, CI           |

## Konfigurationsreferenz

Die gesamte OpenShell-Konfiguration befindet sich unter
`plugins.entries.openshell.config`:

| Schlüssel                  | Typ                      | Standardwert  | Beschreibung                                                                                       |
| -------------------------- | ------------------------ | ------------- | -------------------------------------------------------------------------------------------------- |
| `mode`                     | `"mirror"` oder `"remote"` | `"mirror"`  | Synchronisierungsmodus des Arbeitsbereichs                                                         |
| `command`                  | `string`                 | `"openshell"` | Pfad oder Name der CLI `openshell`                                                                 |
| `from`                     | `string`                 | `"openclaw"`  | Sandbox-Quelle für die erstmalige Erstellung                                                       |
| `gateway`                  | `string`                 | nicht gesetzt | Name des OpenShell-Gateways (`--gateway` auf oberster Ebene)                                       |
| `gatewayEndpoint`          | `string`                 | nicht gesetzt | Endpunkt des OpenShell-Gateways (`--gateway-endpoint` auf oberster Ebene)                           |
| `policy`                   | `string`                 | nicht gesetzt | OpenShell-Richtlinien-ID für die Sandbox-Erstellung                                                |
| `providers`                | `string[]`               | `[]`          | Bei der Sandbox-Erstellung verknüpfte Provider-Namen (duplikatbereinigt, ein `--provider`-Flag pro Eintrag) |
| `gpu`                      | `boolean`                | `false`       | GPU-Ressourcen anfordern (`--gpu`)                                                                 |
| `autoProviders`            | `boolean`                | `true`        | Bei der Erstellung `--auto-providers` übergeben (oder bei `false` `--no-auto-providers`)            |
| `remoteWorkspaceDir`       | `string`                 | `"/sandbox"`  | Primärer beschreibbarer Arbeitsbereich innerhalb der Sandbox                                       |
| `remoteAgentWorkspaceDir`  | `string`                 | `"/agent"`    | Einhängepfad des Agent-Arbeitsbereichs (schreibgeschützt, wenn der Arbeitsbereichszugriff nicht `rw` ist) |
| `timeoutSeconds`           | `number`                 | `120`         | Zeitüberschreitung für Vorgänge der CLI `openshell`                                                 |

`remoteWorkspaceDir` und `remoteAgentWorkspaceDir` müssen absolute Pfade sein
und innerhalb der verwalteten Stammverzeichnisse `/sandbox` oder `/agent`
liegen; andere absolute Pfade werden abgelehnt.

Einstellungen auf Sandbox-Ebene (`mode`, `scope`, `workspaceAccess`) befinden
sich wie bei jedem Backend unter `agents.defaults.sandbox`. Die vollständige
Übersicht finden Sie unter [Sandboxing](/de/gateway/sandboxing).

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

### mirror-Modus mit GPU

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

## Verwaltung des Lebenszyklus

```bash
# Alle Sandbox-Laufzeitumgebungen auflisten (Docker + OpenShell)
openclaw sandbox list

# Effektive Richtlinie prüfen
openclaw sandbox explain

# Neu erstellen (löscht den Remote-Arbeitsbereich, initialisiert ihn bei der nächsten Verwendung neu)
openclaw sandbox recreate --all
```

Im Modus `remote` ist die Neuerstellung besonders wichtig: Sie löscht den
maßgeblichen Remote-Arbeitsbereich für den jeweiligen Geltungsbereich, und bei
der nächsten Verwendung wird ein neuer Arbeitsbereich aus dem lokalen
Arbeitsbereich initialisiert. Im Modus `mirror` setzt die Neuerstellung
hauptsächlich die Remote-Ausführungsumgebung zurück, da der lokale
Arbeitsbereich maßgeblich bleibt.

Erstellen Sie die Sandbox neu, nachdem Sie eine der folgenden Einstellungen geändert haben:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Sicherheitshärtung

Die Dateisystembrücke des `mirror`-Modus fixiert das lokale Stammverzeichnis
des Arbeitsbereichs und überprüft vor jedem Lese-, Schreib-, Verzeichnis-
erstellungs-, Lösch- und Umbenennungsvorgang erneut die kanonischen Pfade
(über `realpath`), wobei symbolische Verknüpfungen innerhalb des Pfads
abgelehnt werden. Das Austauschen einer symbolischen Verknüpfung oder ein neu
eingehängter Arbeitsbereich kann den Dateizugriff nicht aus dem gespiegelten
Verzeichnisbaum heraus umleiten.

## Aktuelle Einschränkungen

- Der Sandbox-Browser wird vom OpenShell-Backend nicht unterstützt.
- `sandbox.docker.binds` gilt nicht für OpenShell; die Sandbox-Erstellung
  schlägt fehl, wenn Einbindungen konfiguriert sind.
- Docker-spezifische Laufzeitoptionen unter `sandbox.docker.*` (mit Ausnahme
  von `env`) gelten nur für das Docker-Backend.

## Funktionsweise

1. OpenClaw führt für den Sandbox-Namen `sandbox get` aus (mit konfiguriertem
   `--gateway`/`--gateway-endpoint`). Wenn dies fehlschlägt, wird mit
   `sandbox create` eine Sandbox erstellt. Dabei werden `--name`, `--from`,
   gegebenenfalls `--policy`, bei aktivierter Option `--gpu`,
   `--auto-providers`/`--no-auto-providers` und ein `--provider`-Flag pro
   konfiguriertem Provider übergeben.
2. OpenClaw führt für den Sandbox-Namen `sandbox ssh-config` aus, um die
   SSH-Verbindungsdaten abzurufen.
3. Der Core schreibt die SSH-Konfiguration in eine temporäre Datei und öffnet
   über dieselbe Remote-Dateisystembrücke wie das generische SSH-Backend eine
   SSH-Sitzung.
4. Im Modus `mirror`: vor der Ausführung lokal nach Remote synchronisieren,
   ausführen und danach zurücksynchronisieren.
5. Im Modus `remote`: bei der Erstellung einmalig initialisieren und
   anschließend direkt im Remote-Arbeitsbereich arbeiten.

## Verwandte Themen

- [Sandboxing](/de/gateway/sandboxing) – Modi, Geltungsbereiche und Backend-Vergleich
- [Sandbox, Werkzeugrichtlinie und erhöhte Berechtigungen im Vergleich](/de/gateway/sandbox-vs-tool-policy-vs-elevated) – Fehlersuche bei blockierten Werkzeugen
- [Multi-Agent-Sandbox und Werkzeuge](/de/tools/multi-agent-sandbox-tools) – Agent-spezifische Überschreibungen
- [Sandbox-CLI](/de/cli/sandbox) – `openclaw sandbox`-Befehle
