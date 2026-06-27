---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'So funktioniert OpenClaw-Sandboxing: Modi, Bereiche, Workspace-Zugriff und Bilder'
title: Sandboxing
x-i18n:
    generated_at: "2026-06-27T17:32:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw kann **Tools innerhalb von Sandbox-Backends** ausführen, um den Blast Radius zu verringern. Dies ist **optional** und wird über die Konfiguration gesteuert (`agents.defaults.sandbox` oder `agents.list[].sandbox`). Wenn Sandboxing deaktiviert ist, werden Tools auf dem Host ausgeführt. Der Gateway bleibt auf dem Host; die Tool-Ausführung läuft bei Aktivierung in einer isolierten Sandbox.

<Note>
Dies ist keine perfekte Sicherheitsgrenze, schränkt aber Dateisystem- und Prozesszugriff erheblich ein, wenn das Modell etwas Unbedachtes tut.
</Note>

## Was in die Sandbox gelegt wird

- Tool-Ausführung (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` usw.).
- Optionaler Browser in der Sandbox (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Details zum Browser in der Sandbox">
    - Standardmäßig startet der Sandbox-Browser automatisch (stellt sicher, dass CDP erreichbar ist), wenn das Browser-Tool ihn benötigt. Konfigurieren Sie dies über `agents.defaults.sandbox.browser.autoStart` und `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Standardmäßig verwenden Sandbox-Browser-Container ein dediziertes Docker-Netzwerk (`openclaw-sandbox-browser`) statt des globalen `bridge`-Netzwerks. Konfigurieren Sie dies mit `agents.defaults.sandbox.browser.network`.
    - Optional beschränkt `agents.defaults.sandbox.browser.cdpSourceRange` den CDP-Eingang am Container-Rand mit einer CIDR-Allowlist (zum Beispiel `172.21.0.1/32`).
    - Der noVNC-Beobachterzugriff ist standardmäßig passwortgeschützt; OpenClaw gibt eine kurzlebige Token-URL aus, die eine lokale Bootstrap-Seite bereitstellt und noVNC mit dem Passwort im URL-Fragment öffnet (nicht in Abfrage-/Header-Logs).
    - `agents.defaults.sandbox.browser.allowHostControl` ermöglicht Sandbox-Sitzungen, explizit den Host-Browser anzusteuern.
    - Optionale Allowlists schützen `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Nicht in der Sandbox:

- Der Gateway-Prozess selbst.
- Jedes Tool, das explizit außerhalb der Sandbox ausgeführt werden darf (z. B. `tools.elevated`).
  - **Elevated Exec umgeht Sandboxing und verwendet den konfigurierten Escape-Pfad (standardmäßig `gateway`, oder `node`, wenn das Exec-Ziel `node` ist).**
  - Wenn Sandboxing deaktiviert ist, ändert `tools.elevated` die Ausführung nicht (bereits auf dem Host). Siehe [Elevated Mode](/de/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` steuert, **wann** Sandboxing verwendet wird:

<Tabs>
  <Tab title="off">
    Kein Sandboxing.
  </Tab>
  <Tab title="non-main">
    Nur **non-main**-Sitzungen in der Sandbox (Standard, wenn normale Chats auf dem Host laufen sollen).

    `"non-main"` basiert auf `session.mainKey` (Standard `"main"`), nicht auf der Agent-ID. Gruppen-/Channel-Sitzungen verwenden eigene Schlüssel, daher zählen sie als non-main und werden in die Sandbox gelegt.

  </Tab>
  <Tab title="all">
    Jede Sitzung läuft in einer Sandbox.
  </Tab>
</Tabs>

## Geltungsbereich

`agents.defaults.sandbox.scope` steuert, **wie viele Container** erstellt werden:

- `"agent"` (Standard): ein Container pro Agent.
- `"session"`: ein Container pro Sitzung.
- `"shared"`: ein Container, der von allen Sandbox-Sitzungen gemeinsam genutzt wird.

## Backend

`agents.defaults.sandbox.backend` steuert, **welche Laufzeitumgebung** die Sandbox bereitstellt:

- `"docker"` (Standard, wenn Sandboxing aktiviert ist): lokale Docker-gestützte Sandbox-Laufzeitumgebung.
- `"ssh"`: generische SSH-gestützte Remote-Sandbox-Laufzeitumgebung.
- `"openshell"`: OpenShell-gestützte Sandbox-Laufzeitumgebung.

SSH-spezifische Konfiguration befindet sich unter `agents.defaults.sandbox.ssh`. OpenShell-spezifische Konfiguration befindet sich unter `plugins.entries.openshell.config`.

### Backend auswählen

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Ausführungsort**  | Lokaler Container                | Jeder per SSH erreichbare Host | Von OpenShell verwaltete Sandbox                    |
| **Einrichtung**     | `scripts/sandbox-setup.sh`       | SSH-Schlüssel + Ziel-Host      | OpenShell-Plugin aktiviert                          |
| **Workspace-Modell** | Bind-Mount oder Kopie            | Remote-kanonisch (einmalig seed) | `mirror` oder `remote`                              |
| **Netzwerksteuerung** | `docker.network` (Standard: none) | Hängt vom Remote-Host ab       | Hängt von OpenShell ab                              |
| **Browser-Sandbox** | Unterstützt                      | Nicht unterstützt              | Noch nicht unterstützt                              |
| **Bind-Mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Am besten für**   | Lokale Entwicklung, vollständige Isolation | Auslagerung auf eine Remote-Maschine | Verwaltete Remote-Sandboxes mit optionaler bidirektionaler Synchronisierung |

### Docker-Backend

Sandboxing ist standardmäßig deaktiviert. Wenn Sie Sandboxing aktivieren und kein Backend auswählen, verwendet OpenClaw das Docker-Backend. Es führt Tools und Sandbox-Browser lokal über den Docker-Daemon-Socket (`/var/run/docker.sock`) aus. Die Isolation von Sandbox-Containern wird durch Docker-Namespaces bestimmt.

Um Host-GPUs für Docker-Sandboxes verfügbar zu machen, setzen Sie `agents.defaults.sandbox.docker.gpus` oder die agentspezifische Überschreibung `agents.list[].sandbox.docker.gpus`. Der Wert wird als separates Argument an Dockers `--gpus`-Flag übergeben, zum Beispiel `"all"` oder `"device=GPU-uuid"`, und erfordert eine kompatible Host-Laufzeitumgebung wie NVIDIA Container Toolkit.

<Warning>
**Docker-out-of-Docker(DooD)-Einschränkungen**

Wenn Sie den OpenClaw Gateway selbst als Docker-Container bereitstellen, orchestriert er Geschwister-Sandbox-Container über den Docker-Socket des Hosts (DooD). Das führt zu einer spezifischen Einschränkung bei der Pfadzuordnung:

- **Konfiguration erfordert Host-Pfade**: Die `workspace`-Konfiguration in `openclaw.json` MUSS den **absoluten Pfad des Hosts** enthalten (z. B. `/home/user/.openclaw/workspaces`), nicht den internen Pfad des Gateway-Containers. Wenn OpenClaw den Docker-Daemon auffordert, eine Sandbox zu starten, wertet der Daemon Pfade relativ zum Namespace des Host-Betriebssystems aus, nicht relativ zum Gateway-Namespace.
- **Parität der FS-Bridge (identische Volume-Zuordnung)**: Der native OpenClaw-Gateway-Prozess schreibt außerdem Heartbeat- und Bridge-Dateien in das `workspace`-Verzeichnis. Da der Gateway dieselbe Zeichenfolge (den Host-Pfad) in seiner eigenen containerisierten Umgebung auswertet, MUSS die Gateway-Bereitstellung eine identische Volume-Zuordnung enthalten, die den Host-Namespace nativ verknüpft (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Codex-Code-Modus**: Wenn eine OpenClaw-Sandbox aktiv ist, deaktiviert OpenClaw für diesen Turn den nativen Code Mode des Codex-App-Servers, Benutzer-MCP-Server und app-gestützte Plugin-Ausführung, weil diese nativen Oberflächen vom Gateway-Host-App-Server-Prozess statt vom OpenClaw-Sandbox-Backend ausgeführt werden. Shell-Zugriff wird über OpenClaw-sandboxgestützte Tools wie `sandbox_exec` und `sandbox_process` bereitgestellt, wenn die normalen Exec-/Process-Tools verfügbar sind. Mounten Sie den Docker-Socket des Hosts nicht in Agent-Sandbox-Container oder benutzerdefinierte Codex-Sandboxes.

Auf Ubuntu-/AppArmor-Hosts kann Codex `workspace-write` vor dem Shell-Start fehlschlagen,
wenn Sie natives Codex `workspace-write` absichtlich ohne aktives
OpenClaw-Sandboxing ausführen und der Dienstbenutzer keine unprivilegierten
Benutzer-Namespaces erstellen darf. Wenn Docker-Sandbox-Egress deaktiviert ist (`network: "none"`, der
Standard), benötigt Codex außerdem einen unprivilegierten Netzwerk-Namespace. Häufige Symptome sind
`bwrap: setting up uid map: Permission denied` und
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Führen Sie
`openclaw doctor` aus; wenn ein Fehler beim Codex-bwrap-Namespace-Probe gemeldet wird, bevorzugen Sie
ein AppArmor-Profil, das dem OpenClaw-Dienstprozess die erforderlichen Namespaces gewährt.
`kernel.apparmor_restrict_unprivileged_userns=0` ist ein hostweiter
Fallback mit Sicherheitskompromissen; verwenden Sie ihn nur, wenn diese Host-Haltung
akzeptabel ist.

Wenn Sie Pfade intern ohne absolute Host-Parität zuordnen, löst OpenClaw nativ einen `EACCES`-Berechtigungsfehler aus, wenn es versucht, seinen Heartbeat innerhalb der Containerumgebung zu schreiben, weil die vollqualifizierte Pfadzeichenfolge dort nativ nicht existiert.
</Warning>

### SSH-Backend

Verwenden Sie `backend: "ssh"`, wenn OpenClaw `exec`, Datei-Tools und Medienlesevorgänge auf einer beliebigen per SSH erreichbaren Maschine in eine Sandbox legen soll.

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
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Funktionsweise">
    - OpenClaw erstellt ein Remote-Root pro Geltungsbereich unter `sandbox.ssh.workspaceRoot`.
    - Bei der ersten Verwendung nach Erstellung oder Neuerstellung seedet OpenClaw diesen Remote-Workspace einmal aus dem lokalen Workspace.
    - Danach werden `exec`, `read`, `write`, `edit`, `apply_patch`, Prompt-Medienlesevorgänge und eingehendes Medien-Staging direkt über SSH gegen den Remote-Workspace ausgeführt.
    - OpenClaw synchronisiert Remote-Änderungen nicht automatisch zurück in den lokalen Workspace.

  </Accordion>
  <Accordion title="Authentifizierungsmaterial">
    - `identityFile`, `certificateFile`, `knownHostsFile`: vorhandene lokale Dateien verwenden und über die OpenSSH-Konfiguration weitergeben.
    - `identityData`, `certificateData`, `knownHostsData`: Inline-Strings oder SecretRefs verwenden. OpenClaw löst sie über den normalen Laufzeit-Snapshot für Secrets auf, schreibt sie mit `0600` in temporäre Dateien und löscht sie, wenn die SSH-Sitzung endet.
    - Wenn für dasselbe Element sowohl `*File` als auch `*Data` gesetzt sind, gewinnt `*Data` für diese SSH-Sitzung.

  </Accordion>
  <Accordion title="Remote-kanonische Konsequenzen">
    Dies ist ein **remote-kanonisches** Modell. Der Remote-SSH-Workspace wird nach dem initialen Seed zum echten Sandbox-Zustand.

    - Host-lokale Änderungen, die nach dem Seed-Schritt außerhalb von OpenClaw vorgenommen werden, sind remote nicht sichtbar, bis Sie die Sandbox neu erstellen.
    - `openclaw sandbox recreate` löscht das Remote-Root pro Geltungsbereich und seedet bei der nächsten Verwendung erneut aus dem lokalen Workspace.
    - Browser-Sandboxing wird im SSH-Backend nicht unterstützt.
    - `sandbox.docker.*`-Einstellungen gelten nicht für das SSH-Backend.

  </Accordion>
</AccordionGroup>

### OpenShell-Backend

Verwenden Sie `backend: "openshell"`, wenn OpenClaw Tools in einer von OpenShell verwalteten Remote-Umgebung in eine Sandbox legen soll. Die vollständige Einrichtungsanleitung, Konfigurationsreferenz und den Vergleich der Workspace-Modi finden Sie auf der dedizierten [OpenShell-Seite](/de/gateway/openshell).

OpenShell verwendet denselben zentralen SSH-Transport und dieselbe Remote-Dateisystem-Bridge wie das generische SSH-Backend wieder und ergänzt OpenShell-spezifischen Lifecycle (`sandbox create/get/delete`, `sandbox ssh-config`) sowie den optionalen Workspace-Modus `mirror`.

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell-Modi:

- `mirror` (Standard): Der lokale Workspace bleibt kanonisch. OpenClaw synchronisiert lokale Dateien vor Exec in OpenShell und synchronisiert den Remote-Workspace nach Exec zurück.
- `remote`: Der OpenShell-Workspace ist kanonisch, nachdem die Sandbox erstellt wurde. OpenClaw seedet den Remote-Workspace einmal aus dem lokalen Workspace, danach werden Datei-Tools und Exec direkt gegen die Remote-Sandbox ausgeführt, ohne Änderungen zurückzusynchronisieren.

<AccordionGroup>
  <Accordion title="Details zum Remote-Transport">
    - OpenClaw fragt OpenShell über `openshell sandbox ssh-config <name>` nach sandbox-spezifischer SSH-Konfiguration.
    - Core schreibt diese SSH-Konfiguration in eine temporäre Datei, öffnet die SSH-Sitzung und verwendet dieselbe Remote-Dateisystem-Bridge wieder, die auch von `backend: "ssh"` genutzt wird.
    - Im Modus `mirror` unterscheidet sich nur der Lebenszyklus: vor `exec` lokal nach remote synchronisieren, dann nach `exec` zurück synchronisieren.

  </Accordion>
  <Accordion title="Aktuelle OpenShell-Einschränkungen">
    - Sandbox-Browser wird noch nicht unterstützt
    - `sandbox.docker.binds` wird im OpenShell-Backend nicht unterstützt
    - Docker-spezifische Laufzeitoptionen unter `sandbox.docker.*` gelten weiterhin nur für das Docker-Backend

  </Accordion>
</AccordionGroup>

#### Workspace-Modi

OpenShell hat zwei Workspace-Modelle. Das ist in der Praxis der wichtigste Teil.

<Tabs>
  <Tab title="mirror (lokal kanonisch)">
    Verwenden Sie `plugins.entries.openshell.config.mode: "mirror"`, wenn der **lokale Workspace kanonisch bleiben** soll.

    Verhalten:

    - Vor `exec` synchronisiert OpenClaw den lokalen Workspace in die OpenShell-Sandbox.
    - Nach `exec` synchronisiert OpenClaw den Remote-Workspace zurück in den lokalen Workspace.
    - Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace bleibt zwischen Turns die Quelle der Wahrheit.

    Verwenden Sie dies, wenn:

    - Sie Dateien lokal außerhalb von OpenClaw bearbeiten und möchten, dass diese Änderungen automatisch in der Sandbox erscheinen
    - sich die OpenShell-Sandbox möglichst ähnlich wie das Docker-Backend verhalten soll
    - der Host-Workspace Sandbox-Schreibvorgänge nach jedem Exec-Turn widerspiegeln soll

    Tradeoff: zusätzlicher Synchronisierungsaufwand vor und nach exec.

  </Tab>
  <Tab title="remote (OpenShell-kanonisch)">
    Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn der **OpenShell-Workspace kanonisch werden** soll.

    Verhalten:

    - Wenn die Sandbox erstmals erstellt wird, befüllt OpenClaw den Remote-Workspace einmalig aus dem lokalen Workspace.
    - Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch` direkt gegen den Remote-OpenShell-Workspace.
    - OpenClaw synchronisiert Remote-Änderungen nach exec **nicht** zurück in den lokalen Workspace.
    - Medienlesevorgänge zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Medien-Tools über die Sandbox-Bridge lesen, statt einen lokalen Host-Pfad anzunehmen.
    - Der Transport erfolgt per SSH in die von `openshell sandbox ssh-config` zurückgegebene OpenShell-Sandbox.

    Wichtige Folgen:

    - Wenn Sie nach dem Seed-Schritt Dateien auf dem Host außerhalb von OpenClaw bearbeiten, sieht die Remote-Sandbox diese Änderungen **nicht** automatisch.
    - Wenn die Sandbox neu erstellt wird, wird der Remote-Workspace erneut aus dem lokalen Workspace befüllt.
    - Mit `scope: "agent"` oder `scope: "shared"` wird dieser Remote-Workspace in demselben Scope geteilt.

    Verwenden Sie dies, wenn:

    - die Sandbox primär auf der Remote-OpenShell-Seite leben soll
    - Sie geringeren Synchronisierungsaufwand pro Turn wünschen
    - Sie nicht möchten, dass host-lokale Bearbeitungen den Remote-Sandbox-Zustand stillschweigend überschreiben

  </Tab>
</Tabs>

Wählen Sie `mirror`, wenn Sie die Sandbox als temporäre Ausführungsumgebung betrachten. Wählen Sie `remote`, wenn Sie die Sandbox als den eigentlichen Workspace betrachten.

#### OpenShell-Lebenszyklus

OpenShell-Sandboxes werden weiterhin über den normalen Sandbox-Lebenszyklus verwaltet:

- `openclaw sandbox list` zeigt OpenShell-Runtimes ebenso wie Docker-Runtimes
- `openclaw sandbox recreate` löscht die aktuelle Runtime und lässt OpenClaw sie bei der nächsten Verwendung neu erstellen
- Die Bereinigungslogik ist ebenfalls backend-bewusst

Für den Modus `remote` ist recreate besonders wichtig:

- recreate löscht den kanonischen Remote-Workspace für diesen Scope
- die nächste Verwendung befüllt einen frischen Remote-Workspace aus dem lokalen Workspace

Für den Modus `mirror` setzt recreate hauptsächlich die Remote-Ausführungsumgebung zurück, weil der lokale Workspace ohnehin kanonisch bleibt.

## Workspace-Zugriff

`agents.defaults.sandbox.workspaceAccess` steuert, **was die Sandbox sehen kann**:

<Tabs>
  <Tab title="none (Standard)">
    Tools sehen einen Sandbox-Workspace unter `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Mountet den Agent-Workspace schreibgeschützt unter `/agent` (deaktiviert `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Mountet den Agent-Workspace mit Lese-/Schreibzugriff unter `/workspace`.
  </Tab>
</Tabs>

Mit dem OpenShell-Backend:

- Der Modus `mirror` verwendet zwischen Exec-Turns weiterhin den lokalen Workspace als kanonische Quelle
- Der Modus `remote` verwendet nach dem initialen Seed den Remote-OpenShell-Workspace als kanonische Quelle
- `workspaceAccess: "ro"` und `"none"` schränken das Schreibverhalten weiterhin auf dieselbe Weise ein

Eingehende Medien werden in den aktiven Sandbox-Workspace kopiert (`media/inbound/*`).

<Note>
**Hinweis zu Skills:** Das Tool `read` ist an die Sandbox-Wurzel gebunden. Mit `workspaceAccess: "none"` spiegelt OpenClaw geeignete Skills in den Sandbox-Workspace (`.../skills`), damit sie gelesen werden können. Mit `"rw"` sind Workspace-Skills aus `/workspace/skills` lesbar, und geeignete verwaltete, gebündelte oder Plugin-Skills werden im generierten schreibgeschützten Pfad `/workspace/.openclaw/sandbox-skills/skills` materialisiert.
</Note>

## Benutzerdefinierte Bind-Mounts

`agents.defaults.sandbox.docker.binds` mountet zusätzliche Host-Verzeichnisse in den Container. Format: `host:container:mode` (z. B. `"/home/user/source:/source:rw"`).

Globale und agent-spezifische Binds werden **zusammengeführt** (nicht ersetzt). Unter `scope: "shared"` werden agent-spezifische Binds ignoriert.

`agents.defaults.sandbox.browser.binds` mountet zusätzliche Host-Verzeichnisse nur in den **Sandbox-Browser**-Container.

- Wenn gesetzt (einschließlich `[]`), ersetzt es `agents.defaults.sandbox.docker.binds` für den Browser-Container.
- Wenn weggelassen, fällt der Browser-Container auf `agents.defaults.sandbox.docker.binds` zurück (abwärtskompatibel).

Beispiel (schreibgeschützte Quelle + ein zusätzliches Datenverzeichnis):

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
**Bind-Sicherheit**

- Binds umgehen das Sandbox-Dateisystem: Sie legen Host-Pfade mit dem jeweils gesetzten Modus offen (`:ro` oder `:rw`).
- OpenClaw blockiert gefährliche Bind-Quellen (zum Beispiel: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` und übergeordnete Mounts, die sie offenlegen würden).
- OpenClaw blockiert außerdem gängige Credential-Wurzeln im Home-Verzeichnis wie `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` und `~/.ssh`.
- Bind-Validierung ist nicht nur String-Abgleich. OpenClaw normalisiert den Quellpfad und löst ihn dann erneut über den tiefsten vorhandenen Vorfahren auf, bevor blockierte Pfade und erlaubte Wurzeln erneut geprüft werden.
- Das bedeutet, dass Ausbrüche über Symlink-Eltern weiterhin geschlossen fehlschlagen, selbst wenn das endgültige Blatt noch nicht existiert. Beispiel: `/workspace/run-link/new-file` wird weiterhin als `/var/run/...` aufgelöst, wenn `run-link` dorthin zeigt.
- Erlaubte Quellwurzeln werden auf dieselbe Weise kanonisiert, sodass ein Pfad, der nur vor der Symlink-Auflösung innerhalb der Allowlist zu liegen scheint, weiterhin als `outside allowed roots` abgelehnt wird.
- Sensitive Mounts (Secrets, SSH-Schlüssel, Service-Credentials) sollten `:ro` sein, sofern nicht absolut erforderlich.
- Kombinieren Sie dies mit `workspaceAccess: "ro"`, wenn Sie nur Lesezugriff auf den Workspace benötigen; Bind-Modi bleiben unabhängig.
- Siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated), um zu erfahren, wie Binds mit Tool-Policy und erhöhtem exec interagieren.

</Warning>

## Images und Einrichtung

Standard-Docker-Image: `openclaw-sandbox:bookworm-slim`

<Note>
**Source-Checkout vs. npm-Installation**

Die Hilfsskripte `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` und `scripts/sandbox-browser-setup.sh` sind nur verfügbar, wenn sie aus einem [Source-Checkout](https://github.com/openclaw/openclaw) ausgeführt werden. Sie sind nicht im npm-Paket enthalten.

Wenn Sie OpenClaw über `npm install -g openclaw` installiert haben, verwenden Sie stattdessen die unten gezeigten Inline-`docker build`-Befehle.
</Note>

<Steps>
  <Step title="Standard-Image bauen">
    Aus einem Source-Checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Aus einer npm-Installation (kein Source-Checkout erforderlich):

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

    Das Standard-Image enthält **kein** Node. Wenn ein Skill Node (oder andere Runtimes) benötigt, bauen Sie entweder ein benutzerdefiniertes Image oder installieren Sie über `sandbox.docker.setupCommand` (erfordert Netzwerk-Egress + beschreibbare Wurzel + Root-Benutzer).

    OpenClaw ersetzt ein fehlendes `openclaw-sandbox:bookworm-slim` nicht stillschweigend durch schlichtes `debian:bookworm-slim`. Sandbox-Läufe, die auf das Standard-Image zielen, schlagen schnell mit einer Build-Anweisung fehl, bis Sie es bauen, weil das gebündelte Image `python3` für Sandbox-Schreib-/Bearbeitungshilfen enthält.

  </Step>
  <Step title="Optional: Common-Image bauen">
    Für ein funktionaleres Sandbox-Image mit gängigen Tools (zum Beispiel `curl`, `jq`, Node 24, pnpm, `python3` und `git`):

    Aus einem Source-Checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Aus einer npm-Installation bauen Sie zuerst das Standard-Image (siehe oben) und bauen dann das Common-Image darauf auf, indem Sie [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) aus dem Repository verwenden.

    Setzen Sie dann `agents.defaults.sandbox.docker.image` auf `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: Sandbox-Browser-Image bauen">
    Aus einem Source-Checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Aus einer npm-Installation bauen Sie mit [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) aus dem Repository.

  </Step>
</Steps>

Standardmäßig laufen Docker-Sandbox-Container mit **keinem Netzwerk**. Überschreiben Sie dies mit `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Chromium-Standards für den Sandbox-Browser">
    Das gebündelte Sandbox-Browser-Image wendet außerdem konservative Chromium-Startstandards für containerisierte Workloads an. Aktuelle Container-Standards umfassen:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-3d-apis`
    - `--disable-gpu`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-extensions`
    - `--disable-features=TranslateUI`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--disable-software-rasterizer`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--renderer-process-limit=2`
    - `--no-sandbox`, wenn `noSandbox` aktiviert ist.
    - Die drei Grafik-Härtungsflags (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sind optional und nützlich, wenn Container keine GPU-Unterstützung haben. Setzen Sie `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, wenn Ihr Workload WebGL oder andere 3D-/Browser-Funktionen erfordert.
    - `--disable-extensions` ist standardmäßig aktiviert und kann mit `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` für flows deaktiviert werden, die auf Erweiterungen angewiesen sind.
    - `--renderer-process-limit=2` wird durch `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` gesteuert, wobei `0` den Chromium-Standard beibehält.

    Wenn Sie ein anderes Runtime-Profil benötigen, verwenden Sie ein benutzerdefiniertes Browser-Image und stellen Sie Ihren eigenen Entrypoint bereit. Für lokale (nicht containerisierte) Chromium-Profile verwenden Sie `browser.extraArgs`, um zusätzliche Startflags anzuhängen.

  </Accordion>
  <Accordion title="Netzwerk-Sicherheitsstandards">
    - `network: "host"` ist blockiert.
    - `network: "container:<id>"` ist standardmäßig blockiert (Risiko der Umgehung durch Namespace-Beitritt).
    - Notfall-Override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker-Installationen und der containerisierte Gateway befinden sich hier: [Docker](/de/install/docker)

Für Docker-Gateway-Bereitstellungen kann `scripts/docker/setup.sh` die Sandbox-Konfiguration bootstrappen. Setzen Sie `OPENCLAW_SANDBOX=1` (oder `true`/`yes`/`on`), um diesen Pfad zu aktivieren. Sie können den Socket-Speicherort mit `OPENCLAW_DOCKER_SOCKET` überschreiben. Vollständige Setup- und Umgebungsreferenz: [Docker](/de/install/docker#agent-sandbox).

## setupCommand (einmalige Container-Einrichtung)

`setupCommand` wird **einmal** ausgeführt, nachdem der Sandbox-Container erstellt wurde (nicht bei jedem Lauf). Es wird innerhalb des Containers über `sh -lc` ausgeführt.

Pfade:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Pro Agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Häufige Stolperfallen">
    - Der Standardwert für `docker.network` ist `"none"` (kein ausgehender Netzwerkzugriff), daher schlagen Paketinstallationen fehl.
    - `docker.network: "container:<id>"` erfordert `dangerouslyAllowContainerNamespaceJoin: true` und ist nur für Notfälle vorgesehen.
    - `readOnlyRoot: true` verhindert Schreibzugriffe; setzen Sie `readOnlyRoot: false` oder erstellen Sie ein eigenes Image.
    - `user` muss für Paketinstallationen root sein (lassen Sie `user` weg oder setzen Sie `user: "0:0"`).
    - Sandbox-Exec erbt **nicht** `process.env` des Hosts. Verwenden Sie `agents.defaults.sandbox.docker.env` (oder ein eigenes Image) für Skill-API-Schlüssel.
    - Werte in `agents.defaults.sandbox.docker.env` werden als explizite Docker-Container-Umgebungsvariablen übergeben. Jeder mit Zugriff auf den Docker-Daemon kann sie mit Docker-Metadatenbefehlen wie `docker inspect` einsehen. Verwenden Sie ein eigenes Image, eine eingehängte Secret-Datei oder einen anderen Secret-Bereitstellungspfad, wenn diese Metadaten-Offenlegung nicht akzeptabel ist.

  </Accordion>
</AccordionGroup>

## Tool-Richtlinie und Notfallausnahmen

Tool-Zulassen-/Verweigern-Richtlinien gelten weiterhin vor Sandbox-Regeln. Wenn ein Tool global oder pro Agent verweigert wird, bringt Sandboxing es nicht zurück.

`tools.elevated` ist eine explizite Notfallausnahme, die `exec` außerhalb der Sandbox ausführt (standardmäßig `gateway` oder `node`, wenn das Exec-Ziel `node` ist). `/exec`-Direktiven gelten nur für autorisierte Absender und bleiben pro Sitzung bestehen; um `exec` hart zu deaktivieren, verwenden Sie die Tool-Richtlinie zum Verweigern (siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Verwenden Sie `openclaw sandbox explain`, um den effektiven Sandbox-Modus, die Tool-Richtlinie und Fix-it-Konfigurationsschlüssel zu prüfen.
- Siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) für das mentale Modell zu „Warum ist das blockiert?“.

Halten Sie die Umgebung abgesichert.

## Multi-Agent-Overrides

Jeder Agent kann Sandbox und Tools überschreiben: `agents.list[].sandbox` und `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` für die Sandbox-Tool-Richtlinie). Siehe [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für die Rangfolge.

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

- [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) — Overrides pro Agent und Rangfolge
- [OpenShell](/de/gateway/openshell) — Einrichtung des verwalteten Sandbox-Backends, Workspace-Modi und Konfigurationsreferenz
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — Debugging für „Warum ist das blockiert?“
- [Sicherheit](/de/gateway/security)
