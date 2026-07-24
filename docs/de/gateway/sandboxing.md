---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'So funktioniert OpenClaw-Sandboxing: Modi, Geltungsbereiche, Workspace-Zugriff und Images'
title: Sandboxing
x-i18n:
    generated_at: "2026-07-24T04:25:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a3668dc512a8ff30732290ee68e9dd29a3a2e9c106e6e39077a97bfbd90098f7
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw kann die Werkzeugausführung innerhalb eines Sandbox-Backends ausführen, um den potenziellen Schadensumfang zu reduzieren. Sandboxing ist standardmäßig deaktiviert und wird durch `agents.defaults.sandbox` (global) oder `agents.entries.*.sandbox` (pro Agent) gesteuert. Der Gateway-Prozess verbleibt immer auf dem Host; nur die Werkzeugausführung wird bei Aktivierung in die Sandbox verlagert.

<Note>
Dies ist keine perfekte Sicherheitsgrenze, schränkt jedoch den Zugriff auf Dateisystem und Prozesse erheblich ein, wenn das Modell etwas Unsinniges tut.
</Note>

## Was in der Sandbox ausgeführt wird

- Werkzeugausführung: `exec`, `read`, `write`, `edit`, `apply_patch`, `process` usw.
- Der optionale Sandbox-Browser (`agents.defaults.sandbox.browser`).

Nicht in der Sandbox ausgeführt:

- Der Gateway-Prozess selbst.
- Jedes Werkzeug, dessen Ausführung außerhalb der Sandbox ausdrücklich über `tools.elevated` zugelassen ist. Die Ausführung mit erhöhten Rechten umgeht das Sandboxing und erfolgt über den konfigurierten Ausweichpfad (standardmäßig `gateway` oder `node`, wenn das Ausführungsziel `node` ist). Wenn Sandboxing deaktiviert ist, ändert `tools.elevated` nichts, da die Ausführung bereits auf dem Host erfolgt. Siehe [Modus mit erhöhten Rechten](/de/tools/elevated).

## Modi, Geltungsbereich und Backend

Drei unabhängige Einstellungen steuern das Sandbox-Verhalten:

| Einstellung | Schlüssel                        | Werte                        | Standard |
| ----------- | --------------------------------- | ---------------------------- | -------- |
| Modus       | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| Geltungsbereich | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| Backend     | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

Der **Modus** steuert, wann Sandboxing angewendet wird:

- `off`: kein Sandboxing.
- `non-main`: Jede Sitzung außer der Hauptsitzung des Agenten wird in einer Sandbox ausgeführt. Der Schlüssel der Hauptsitzung ist immer `agent:<agentId>:main` (oder `global`, wenn `session.scope` den Wert `"global"` hat); er ist nicht konfigurierbar. Gruppen-/Kanalsitzungen verwenden eigene Schlüssel, gelten daher immer als Nicht-Hauptsitzungen und werden in einer Sandbox ausgeführt.
- `all`: Jede Sitzung wird in einer Sandbox ausgeführt.

Der **Geltungsbereich** steuert, wie viele Container/Umgebungen erstellt werden:

- `agent`: ein Container pro Agent.
- `session`: ein Container pro Sitzung.
- `shared`: ein gemeinsam von allen Sandbox-Sitzungen genutzter Container (agentenspezifische Überschreibungen für `docker`/`ssh`/`browser` werden in diesem Geltungsbereich ignoriert).

Das **Backend** steuert, welche Laufzeitumgebung die Sandbox-Werkzeuge ausführt. SSH-spezifische Konfiguration befindet sich unter `agents.defaults.sandbox.ssh`; OpenShell-spezifische Konfiguration befindet sich unter `plugins.entries.openshell.config`.

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Ausführungsort**  | Lokaler Container                | Jeder per SSH erreichbare Host | Von OpenShell verwaltete Sandbox                    |
| **Einrichtung**     | `scripts/sandbox-setup.sh`       | SSH-Schlüssel + Zielhost       | OpenShell-Plugin aktiviert                          |
| **Arbeitsbereichsmodell** | Einhängen oder Kopieren    | Remote-kanonisch (einmalige Initialisierung) | `mirror` oder `remote`                                |
| **Netzwerksteuerung** | `docker.network` (Standard: keines) | Abhängig vom Remote-Host | Abhängig von OpenShell                              |
| **Browser-Sandbox** | Unterstützt                      | Nicht unterstützt              | Noch nicht unterstützt                              |
| **Bind-Mounts**     | `docker.binds`                   | k. A.                          | k. A.                                               |
| **Optimal für**     | Lokale Entwicklung, vollständige Isolation | Auslagerung auf einen Remote-Rechner | Verwaltete Remote-Sandboxes mit optionaler bidirektionaler Synchronisierung |

## Docker-Backend

Docker ist das Standard-Backend, sobald Sandboxing aktiviert ist. Es führt Werkzeuge und Sandbox-Browser lokal über den Docker-Daemon-Socket (`/var/run/docker.sock`) aus; die Isolation erfolgt durch Docker-Namespaces.

Standardwerte: `network: "none"` (kein ausgehender Datenverkehr), `readOnlyRoot: true`, `capDrop: ["ALL"]`, Image `openclaw-sandbox:bookworm-slim`.

Um Host-GPUs bereitzustellen, setzen Sie `agents.defaults.sandbox.docker.gpus` (oder die agentenspezifische Überschreibung) auf einen Wert wie `"all"` oder `"device=GPU-uuid"`. Dieser Wert wird an Dockers Flag `--gpus` übergeben und erfordert eine kompatible Host-Laufzeitumgebung wie das NVIDIA Container Toolkit.

<Warning>
**Einschränkungen bei Docker-out-of-Docker (DooD)**

Wenn Sie das OpenClaw Gateway selbst als Docker-Container bereitstellen, orchestriert es gleichgeordnete Sandbox-Container über den Docker-Socket des Hosts (DooD). Dadurch entsteht eine Einschränkung bei der Pfadzuordnung:

- **Konfiguration erfordert Host-Pfade**: `openclaw.json` `workspace` muss den **absoluten Pfad des Hosts** enthalten (z. B. `/home/user/.openclaw/workspaces`), nicht den internen Pfad des Gateway-Containers. Der Docker-Daemon wertet Pfade relativ zum Betriebssystem-Namespace des Hosts aus, nicht relativ zum eigenen Namespace des Gateways.
- **Übereinstimmende Volume-Zuordnung erforderlich**: Der Gateway-Prozess schreibt außerdem Heartbeat- und Bridge-Dateien in diesen Pfad `workspace`. Weisen Sie dem Gateway-Container eine identische Volume-Zuordnung (`-v /home/user/.openclaw:/home/user/.openclaw`) zu, damit derselbe Host-Pfad auch innerhalb des Gateway-Containers korrekt aufgelöst wird. Nicht übereinstimmende Zuordnungen äußern sich als `EACCES`, wenn das Gateway versucht, seinen Heartbeat zu schreiben.
- **Codex-Codemodus**: Wenn eine OpenClaw-Sandbox aktiv ist, deaktiviert OpenClaw für diesen Durchlauf den nativen Codemodus des Codex-App-Servers, benutzerdefinierte MCP-Server und die Ausführung App-gestützter Plugins (diese werden vom App-Server-Prozess auf dem Gateway-Host ausgeführt, nicht vom OpenClaw-Sandbox-Backend), sofern die Sandbox-Werkzeugrichtlinie nicht die erforderlichen Werkzeuge bereitstellt und Sie den experimentellen Sandbox-Exec-Server-Pfad aktivieren. Der Shell-Zugriff wird dann über OpenClaw-Werkzeuge mit Sandbox-Backend wie `sandbox_exec` und `sandbox_process` geleitet. Hängen Sie den Docker-Socket des Hosts nicht in Agenten-Sandbox-Container oder benutzerdefinierte Codex-Sandboxes ein. Das vollständige Verhalten finden Sie unter [Codex-Harness](/de/plugins/codex-harness).

Auf Ubuntu-/AppArmor-Hosts mit aktiviertem Docker-Sandbox-Modus benötigt die Shell-Ausführung über `workspace-write` des Codex-App-Servers nicht privilegierte Benutzer-Namespaces innerhalb des Sandbox-Containers. Dies kann bereits vor dem Start der Shell fehlschlagen, wenn der Dienstbenutzer sie nicht erstellen kann. Wenn ausgehender Datenverkehr der Docker-Sandbox deaktiviert ist (`network: "none"`, die Standardeinstellung), wird außerdem ein nicht privilegierter Netzwerk-Namespace benötigt. Häufige Symptome: `bwrap: setting up uid map: Permission denied` und `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Führen Sie `openclaw doctor` aus. Wenn dabei ein Fehler beim Codex-bwrap-Namespace-Test gemeldet wird, verwenden Sie vorzugsweise ein AppArmor-Profil, das dem OpenClaw-Dienstprozess die erforderlichen Namespaces gewährt. `kernel.apparmor_restrict_unprivileged_userns=0` ist eine hostweite Ausweichlösung mit Sicherheitsabwägungen; verwenden Sie sie nur, wenn dieses Sicherheitsniveau für den Host akzeptabel ist.
</Warning>

### Sandbox-Browser

- Der Sandbox-Browser startet automatisch (und stellt sicher, dass CDP erreichbar ist), wenn das Browser-Werkzeug ihn benötigt. Konfigurieren Sie dies über `agents.defaults.sandbox.browser.autoStart` (Standard: `true`) und `autoStartTimeoutMs` (Standard: 12s).
- Sandbox-Browser-Container verwenden anstelle des globalen Netzwerks `bridge` ein dediziertes Docker-Netzwerk (`openclaw-sandbox-browser`). Konfigurieren Sie es mit `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` beschränkt eingehende CDP-Verbindungen am Container-Rand durch eine CIDR-Zulassungsliste (beispielsweise `172.21.0.1/32`).
- Der noVNC-Beobachterzugriff ist standardmäßig passwortgeschützt. OpenClaw gibt eine kurzlebige Token-URL aus, die eine lokale Bootstrap-Seite bereitstellt und noVNC mit dem Passwort im URL-Fragment öffnet (nicht in der Abfragezeichenfolge oder in Header-Protokollen).
- `agents.defaults.sandbox.browser.allowHostControl` (Standard: `false`) ermöglicht Sandbox-Sitzungen, ausdrücklich den Host-Browser anzusteuern.
- Optionale Zulassungslisten steuern `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## SSH-Backend

Verwenden Sie `backend: "ssh"`, um `exec`, Dateiwerkzeuge und Medienlesevorgänge auf einem beliebigen per SSH erreichbaren Rechner in einer Sandbox auszuführen.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Oder verwenden Sie SecretRefs bzw. Inline-Inhalte anstelle lokaler Dateien:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Standardwerte: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`.

- **Lebenszyklus**: OpenClaw erstellt unter `sandbox.ssh.workspaceRoot` ein Remote-Stammverzeichnis pro Geltungsbereich. Bei der ersten Verwendung nach der Erstellung oder Neuerstellung wird dieser Remote-Arbeitsbereich einmalig aus dem lokalen Arbeitsbereich initialisiert. Danach werden `exec`, `read`, `write`, `edit`, `apply_patch`, das Lesen von Prompt-Medien und die Bereitstellung eingehender Medien direkt über SSH im Remote-Arbeitsbereich ausgeführt. OpenClaw synchronisiert Remote-Änderungen nicht automatisch zurück in den lokalen Arbeitsbereich.
- **Authentifizierungsmaterial**: `identityFile`/`certificateFile`/`knownHostsFile` verweisen auf vorhandene lokale Dateien. `identityData`/`certificateData`/`knownHostsData` akzeptieren Inline-Zeichenfolgen oder SecretRefs, die über den normalen Laufzeit-Snapshot für Geheimnisse aufgelöst, mit dem Modus `0600` in temporäre Dateien geschrieben und beim Ende der SSH-Sitzung gelöscht werden. Wenn für dasselbe Element sowohl eine `*File`- als auch eine `*Data`-Variante festgelegt ist, hat `*Data` für diese Sitzung Vorrang.
- **Folgen des Remote-kanonischen Modells**: Nach der anfänglichen Initialisierung wird der Remote-SSH-Arbeitsbereich zum tatsächlichen Sandbox-Zustand. Nach der Initialisierung außerhalb von OpenClaw vorgenommene lokale Host-Änderungen sind remote erst sichtbar, wenn Sie die Sandbox neu erstellen. `openclaw sandbox recreate` löscht das Remote-Stammverzeichnis des jeweiligen Geltungsbereichs und initialisiert es bei der nächsten Verwendung erneut aus dem lokalen Arbeitsbereich. Browser-Sandboxing wird von diesem Backend nicht unterstützt, und die Einstellungen unter `sandbox.docker.*` gelten nicht dafür.

## OpenShell-Backend

Verwenden Sie `backend: "openshell"`, um Werkzeuge in einer von OpenShell verwalteten Remote-Umgebung in einer Sandbox auszuführen. OpenShell verwendet denselben SSH-Transport und dieselbe Remote-Dateisystem-Bridge wie das generische SSH-Backend und ergänzt den OpenShell-Lebenszyklus (`sandbox create/get/delete/ssh-config`) sowie einen optionalen Synchronisierungsmodus für den Arbeitsbereich (`mirror`).

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
          mode: "remote", // Spiegelung | Remote
        },
      },
    },
  },
}
```

`mode: "mirror"` (Standard) hält den lokalen Workspace kanonisch: OpenClaw synchronisiert den lokalen Workspace vor `exec` in die Sandbox und danach wieder zurück. `mode: "remote"` befüllt den Remote-Workspace einmalig aus dem lokalen Workspace und führt anschließend `exec`/`read`/`write`/`edit`/`apply_patch` direkt im Remote-Workspace aus, ohne zurückzusynchronisieren; lokale Änderungen nach der initialen Befüllung bleiben unsichtbar, bis Sie `openclaw sandbox recreate`. Unter `scope: "agent"` oder `scope: "shared"` wird dieser Remote-Workspace im selben Gültigkeitsbereich gemeinsam genutzt. Aktuelle Einschränkungen: Der Sandbox-Browser wird noch nicht unterstützt, und `sandbox.docker.binds` gilt nicht für dieses Backend.

`openclaw sandbox list`/`recreate`/prune behandeln OpenShell-Laufzeitumgebungen genauso wie Docker-Laufzeitumgebungen; die Bereinigungslogik berücksichtigt das Backend.

Die vollständigen Voraussetzungen, die Konfigurationsreferenz, den Vergleich der Workspace-Modi und Einzelheiten zum Lebenszyklus finden Sie unter [OpenShell](/de/gateway/openshell).

## Workspace-Zugriff

`agents.defaults.sandbox.workspaceAccess` steuert, was die Sandbox sehen kann:

| Wert            | Verhalten                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (Standard) | Tools sehen unter `~/.openclaw/sandboxes` einen isolierten Sandbox-Workspace.                    |
| `ro`             | Bindet den Agenten-Workspace schreibgeschützt unter `/agent` ein (deaktiviert `write`/`edit`/`apply_patch`). |
| `rw`             | Bindet den Agenten-Workspace mit Lese- und Schreibzugriff unter `/workspace` ein.                                    |

Mit dem OpenShell-Backend verwendet der Modus `mirror` zwischen Ausführungsdurchläufen weiterhin den lokalen Workspace als kanonische Quelle, der Modus `remote` verwendet nach der initialen Befüllung den Remote-Workspace von OpenShell als kanonische Quelle, und `workspaceAccess: "ro"`/`"none"` schränken das Schreibverhalten weiterhin auf dieselbe Weise ein.

Eingehende Medien werden in den aktiven Sandbox-Workspace kopiert (`media/inbound/*`).

<Note>
**Skills**: Das Tool `read` ist in der Sandbox verwurzelt. Mit `workspaceAccess: "none"` spiegelt OpenClaw geeignete Skills in den Sandbox-Workspace (`.../skills`), sodass sie gelesen werden können. Mit `"rw"` sind Workspace-Skills unter `/workspace/skills` lesbar, und geeignete verwaltete, gebündelte oder Plugin-Skills werden im generierten schreibgeschützten Pfad `/workspace/.openclaw/sandbox-skills/skills` bereitgestellt.
</Note>

## Mehrere Ordner für einen Agenten

Verwenden Sie Docker-Bind-Mounts, wenn ein isolierter Agent mehr als seinen primären Workspace benötigt. Jeder Eintrag ordnet einen Host-Ordner mit einem expliziten Zugriffsmodus einem Container-Pfad zu:

```text
host-directory:container-directory:ro
host-directory:container-directory:rw
```

- `ro` macht den eingebundenen Ordner innerhalb der Sandbox schreibgeschützt.
- `rw` erlaubt isolierten Tools und Prozessen, den Host-Ordner zu ändern.
- Der Container-Pfad ist der Pfad, den der Agent verwendet. Host-Pfade werden nicht automatisch offengelegt.

Dieses Beispiel gibt dem Agenten `research` einen beschreibbaren primären Workspace, schreibgeschütztes Referenzmaterial unter `/reference` und einen separaten beschreibbaren Ausgabeordner unter `/drafts`:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        scope: "agent",
      },
    },
    list: [
      {
        id: "research",
        workspace: "/srv/openclaw/research-workspace",
        sandbox: {
          workspaceAccess: "rw",
          docker: {
            binds: ["/srv/shared/reference:/reference:ro", "/srv/shared/drafts:/drafts:rw"],
            // Erforderlich, da sich diese Quellen außerhalb des Agenten-Workspace befinden.
            dangerouslyAllowExternalBindSources: true,
          },
        },
      },
    ],
  },
}
```

`workspaceAccess` und Bind-Modi sind voneinander unabhängig:

| Einstellung                          | Steuerung                                                                    |
| -------------------------------- | --------------------------------------------------------------------------- |
| `workspaceAccess: "none"`        | Verwendet einen isolierten Sandbox-Workspace; legt den Agenten-Workspace nicht offen.    |
| `workspaceAccess: "ro"`          | Bindet den Agenten-Workspace schreibgeschützt unter `/agent` ein.                           |
| `workspaceAccess: "rw"`          | Bindet den Agenten-Workspace mit Lese- und Schreibzugriff unter `/workspace` ein.                      |
| `docker.binds`-Eintrag `:ro`/`:rw` | Steuert nur diesen zusätzlichen Host-Ordner an seinem konfigurierten Container-Pfad. |

Eine Änderung von `workspaceAccess` ändert eine zusätzliche Einbindung nicht von `ro` in `rw` oder umgekehrt. Globale und agentenspezifische `docker.binds` werden zusammengeführt. Verwenden Sie für agentenspezifische Einbindungen weiterhin `scope: "agent"` oder `"session"`; `scope: "shared"` ignoriert alle agentenspezifischen Docker-Überschreibungen und verwendet nur globale Einbindungen.

Bind-Mounts sind die unterstützte Grenze für mehrere Ordner, da Docker die Dateisystemansicht des Containers mit Mount-Isolation erstellt und der Modus `ro`/`rw` für jeden Prozess in der Sandbox gilt. Diese Grenze umfasst `exec`, Dateisystem-Tools, untergeordnete Prozesse und Bibliotheken, ohne Pfadautorisierungsprüfungen in jedem OpenClaw-Codepfad zu duplizieren. Eine hostseitige Pfad-Zulassungsliste kann nicht dieselbe vollständige Grenze bereitstellen, wenn eine zugelassene Shell oder Abhängigkeit direkt auf Dateien zugreifen kann.

Die optionale Einstellung `dangerouslyAllowExternalBindSources` erlaubt ausschließlich Quellen außerhalb der Workspace-Stammverzeichnisse. Sie deaktiviert nicht die OpenClaw-Prüfungen für blockierte Systempfade, Anmeldedaten, Docker-Sockets, Symlink-Elternpfade oder reservierte Ziele. Verwenden Sie vorzugsweise den kleinstmöglichen Ordner und `ro`, sofern kein Schreibzugriff erforderlich ist, und erstellen Sie die Sandbox nach Änderungen an Einbindungen neu:

```bash
openclaw sandbox recreate --agent research
```

### Weiteres Verhalten von Bind-Mounts

`agents.defaults.sandbox.docker.binds` konfiguriert globale Einbindungen. Das Format entspricht derselben Form `host:container:mode` (zum Beispiel `"/home/user/source:/source:rw"`).

`agents.defaults.sandbox.browser.binds` bindet zusätzliche Host-Verzeichnisse ausschließlich in den Container des **Sandbox-Browsers** ein. Wenn diese Einstellung gesetzt ist (einschließlich `[]`), ersetzt sie `docker.binds` für den Browser-Container; wenn sie nicht angegeben ist, greift der Browser-Container auf `docker.binds` zurück.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**Sicherheit von Bind-Mounts**

- Bind-Mounts umgehen das Sandbox-Dateisystem: Sie legen Host-Pfade mit dem von Ihnen festgelegten Modus (`:ro` oder `:rw`) offen.
- OpenClaw blockiert gefährliche Bind-Quellen standardmäßig: Systempfade (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), Docker-Socket-Verzeichnisse (`/run`, `/var/run` und deren `docker.sock`-Varianten) sowie gängige Stammverzeichnisse für Anmeldedaten im Home-Verzeichnis (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- Die Validierung normalisiert den Quellpfad und löst ihn anschließend erneut über den tiefsten vorhandenen Vorfahren auf, bevor blockierte Pfade und zulässige Stammverzeichnisse erneut geprüft werden. Dadurch schlagen Ausbruchsversuche über Symlink-Elternpfade sicher fehl, selbst wenn das endgültige Blatt noch nicht existiert (z. B. wird `/workspace/run-link/new-file` weiterhin als `/var/run/...` aufgelöst, wenn `run-link` dorthin verweist).
- Bind-Ziele, die die reservierten Container-Einhängepunkte (`/workspace`, `/agent`) überlagern, werden ebenfalls standardmäßig blockiert; überschreiben Sie dies mit `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Bind-Quellen außerhalb der in der Zulassungsliste enthaltenen Workspace-/Agenten-Workspace-Stammverzeichnisse werden standardmäßig blockiert; überschreiben Sie dies mit `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Zulässige Stammverzeichnisse werden auf dieselbe Weise kanonisiert, sodass ein Pfad, der nur vor der Symlink-Auflösung innerhalb der Zulassungsliste zu liegen scheint, weiterhin als außerhalb der zulässigen Stammverzeichnisse abgelehnt wird.
- Sensible Einbindungen (Geheimnisse, SSH-Schlüssel, Dienstanmeldedaten) sollten `:ro` sein, sofern nicht unbedingt erforderlich.
- Kombinieren Sie dies mit `workspaceAccess: "ro"`, wenn Sie nur Lesezugriff auf den Workspace benötigen; die Bind-Modi bleiben unabhängig.
- Unter [Sandbox, Tool-Richtlinie und erhöhte Rechte im Vergleich](/de/gateway/sandbox-vs-tool-policy-vs-elevated) erfahren Sie, wie Bind-Mounts mit Tool-Richtlinien und Ausführungen mit erhöhten Rechten interagieren.

</Warning>

## Images und Einrichtung

Standardmäßiges Docker-Image: `openclaw-sandbox:bookworm-slim`

<Note>
**Quellcode-Checkout im Vergleich zur npm-Installation**

Die Hilfsskripte `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` und `scripts/sandbox-browser-setup.sh` sind nur verfügbar, wenn die Ausführung aus einem [Quellcode-Checkout](https://github.com/openclaw/openclaw) erfolgt. Sie sind nicht im npm-Paket enthalten.

Wenn Sie OpenClaw über `npm install -g openclaw` installiert haben, verwenden Sie stattdessen die nachfolgend gezeigten Inline-Befehle für `docker build`.
</Note>

<Steps>
  <Step title="Standard-Image erstellen">
    Aus einem Quellcode-Checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Aus einer npm-Installation (kein Quellcode-Checkout erforderlich):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    Das Standard-Image enthält **kein** Node. Wenn ein Skill Node (oder andere Laufzeitumgebungen) benötigt, erstellen Sie entweder ein benutzerdefiniertes Image oder installieren Sie es über `sandbox.docker.setupCommand` (erfordert ausgehenden Netzwerkzugriff, ein beschreibbares Stammverzeichnis und einen Root-Benutzer).

    OpenClaw ersetzt `debian:bookworm-slim` nicht stillschweigend, wenn `openclaw-sandbox:bookworm-slim` fehlt. Sandbox-Ausführungen, die auf das Standard-Image abzielen, schlagen mit einer Build-Anweisung sofort fehl, bis Sie es erstellen, da das gebündelte Image `python3` für die Schreib- und Bearbeitungshilfen der Sandbox enthält.

  </Step>
  <Step title="Optional: allgemeines Image erstellen">
    Für ein funktionsreicheres Sandbox-Image mit gängigen Tools (zum Beispiel `curl`, `jq`, Node 24, pnpm, `python3` und `git`):

    Aus einem Quellcode-Checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Erstellen Sie bei einer npm-Installation zuerst das Standard-Image (siehe oben) und anschließend darauf aufbauend das allgemeine Image mithilfe von [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) aus dem Repository.

    Setzen Sie anschließend `agents.defaults.sandbox.docker.image` auf `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: Sandbox-Browser-Image erstellen">
    Aus einem Quellcode-Checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Erstellen Sie es bei einer npm-Installation mithilfe von [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) aus dem Repository.

  </Step>
</Steps>

Standardmäßig werden Docker-Sandbox-Container **ohne Netzwerk** ausgeführt. Überschreiben Sie dies mit `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Chromium-Standardeinstellungen des Sandbox-Browsers">
    Das gebündelte Sandbox-Browser-Image verwendet konservative Chromium-Startflags für containerisierte Workloads:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new`, wenn `browser.headless` aktiviert ist.
    - `--no-sandbox --disable-setuid-sandbox`, wenn `browser.noSandbox` aktiviert ist.
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` standardmäßig; diese Flags zur Grafik-Härtung unterstützen Container ohne GPU-Unterstützung. Setzen Sie `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, wenn Ihr Workload WebGL oder andere 3D-Funktionen benötigt.
    - `--disable-extensions` standardmäßig; setzen Sie `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` für Abläufe, die von Erweiterungen abhängen.
    - `--renderer-process-limit=2` standardmäßig; gesteuert durch `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, wobei `0` die Standardeinstellung von Chromium beibehält.

    Wenn Sie ein anderes Laufzeitprofil benötigen, verwenden Sie ein benutzerdefiniertes Browser-Image und stellen Sie einen eigenen Einstiegspunkt bereit. Verwenden Sie für lokale Chromium-Profile (außerhalb von Containern) `browser.extraArgs`, um zusätzliche Start-Flags anzuhängen.

  </Accordion>
  <Accordion title="Standardeinstellungen für Netzwerksicherheit">
    - `network: "host"` ist blockiert.
    - `network: "container:<id>"` ist standardmäßig blockiert (Risiko einer Umgehung durch Namespace-Beitritt).
    - Notfallmäßige Außerkraftsetzung: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker-Installationen und das containerisierte Gateway finden Sie hier: [Docker](/de/install/docker)

Bei Docker-Gateway-Bereitstellungen kann `scripts/docker/setup.sh` die Sandbox-Konfiguration initialisieren. Setzen Sie `OPENCLAW_SANDBOX=1` (oder `true`/`yes`/`on`), um diesen Pfad zu aktivieren. Überschreiben Sie den Socket-Speicherort mit `OPENCLAW_DOCKER_SOCKET`. Vollständige Einrichtung und Umgebungsvariablenreferenz: [Docker](/de/install/docker#agent-sandbox).

## setupCommand (einmalige Container-Einrichtung)

`setupCommand` wird nach dem Erstellen des Sandbox-Containers **einmal** ausgeführt (nicht bei jedem Lauf). Die Ausführung erfolgt im Container über `sh -lc`.

Pfade:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Pro Agent: `agents.entries.*.sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Häufige Fallstricke">
    - Der Standardwert für `docker.network` ist `"none"` (kein ausgehender Datenverkehr), sodass Paketinstallationen fehlschlagen.
    - `docker.network: "container:<id>"` erfordert `dangerouslyAllowContainerNamespaceJoin: true` und ist ausschließlich für Notfälle vorgesehen.
    - `readOnlyRoot: true` verhindert Schreibvorgänge; setzen Sie `readOnlyRoot: false` oder erstellen Sie ein benutzerdefiniertes Image.
    - `user` muss für Paketinstallationen root sein (lassen Sie `user` weg oder setzen Sie `user: "0:0"`).
    - Die Sandbox-Ausführung übernimmt `process.env` des Hosts **nicht**. Verwenden Sie `agents.defaults.sandbox.docker.env` (oder ein benutzerdefiniertes Image) für API-Schlüssel von Skills.
    - Werte in `agents.defaults.sandbox.docker.env` werden als explizite Umgebungsvariablen des Docker-Containers übergeben. Jede Person mit Zugriff auf den Docker-Daemon kann sie mit Docker-Metadatenbefehlen wie `docker inspect` einsehen. Verwenden Sie ein benutzerdefiniertes Image, eine eingebundene Secret-Datei oder einen anderen Pfad zur Secret-Bereitstellung, wenn diese Offenlegung über Metadaten nicht akzeptabel ist.

  </Accordion>
</AccordionGroup>

## Tool-Richtlinie und Ausweichmöglichkeiten

Zulassungs- und Verweigerungsrichtlinien für Tools gelten weiterhin vor den Sandbox-Regeln. Wenn ein Tool global oder pro Agent verweigert wird, macht Sandboxing es nicht wieder verfügbar.

`tools.elevated` ist eine explizite Ausweichmöglichkeit, die `exec` außerhalb der Sandbox ausführt (standardmäßig `gateway` oder `node`, wenn das Ausführungsziel `node` ist). `/exec`-Direktiven gelten nur für autorisierte Absender und bleiben sitzungsbezogen bestehen; um `exec` vollständig zu deaktivieren, verwenden Sie die Verweigerungsrichtlinie für Tools (siehe [Sandbox im Vergleich zu Tool-Richtlinie und Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)).

Fehlersuche:

- `openclaw sandbox list` zeigt Sandbox-Container, Status, Image-Übereinstimmung, Alter, Leerlaufzeit und die zugehörige Sitzung bzw. den zugehörigen Agenten.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` untersucht den effektiven Sandbox-Modus, den Host-Arbeitsbereich, das Laufzeit-Arbeitsverzeichnis, Docker-Einbindungen, die Tool-Richtlinie und die Konfigurationsschlüssel zur Problembehebung. Das Feld `workspaceRoot` enthält weiterhin das konfigurierte Sandbox-Stammverzeichnis; `effectiveHostWorkspaceRoot` zeigt, wo sich der aktive Arbeitsbereich tatsächlich befindet.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` entfernt Container/Umgebungen, sodass sie bei der nächsten Verwendung mit der aktuellen Konfiguration neu erstellt werden.
- Das mentale Modell für die Frage „Warum ist dies blockiert?“ finden Sie unter [Sandbox im Vergleich zu Tool-Richtlinie und Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated).

## Agentenspezifische Außerkraftsetzungen

Jeder Agent kann Sandbox und Tools überschreiben: `agents.entries.*.sandbox` und `agents.entries.*.tools` (sowie `agents.entries.*.tools.sandbox.tools` für die Sandbox-Tool-Richtlinie). Informationen zur Rangfolge finden Sie unter [Sandbox und Tools für mehrere Agenten](/de/tools/multi-agent-sandbox-tools).

## Minimales Aktivierungsbeispiel

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Verwandte Themen

- [Sandbox und Tools für mehrere Agenten](/de/tools/multi-agent-sandbox-tools) -- agentenspezifische Außerkraftsetzungen und Rangfolge
- [OpenShell](/de/gateway/openshell) -- Einrichtung des verwalteten Sandbox-Backends, Arbeitsbereichsmodi und Konfigurationsreferenz
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox im Vergleich zu Tool-Richtlinie und Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Fehlersuche für „Warum ist dies blockiert?“
- [Sicherheit](/de/gateway/security)
