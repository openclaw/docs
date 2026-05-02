---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'So funktioniert OpenClaw-Sandboxing: Modi, Geltungsbereiche, Workspace-Zugriff und Images'
title: Sandbox-Isolierung
x-i18n:
    generated_at: "2026-05-02T06:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw kann **Tools innerhalb von Sandbox-Backends** ausführen, um den potenziellen Schaden zu begrenzen. Dies ist **optional** und wird über die Konfiguration gesteuert (`agents.defaults.sandbox` oder `agents.list[].sandbox`). Wenn Sandboxing deaktiviert ist, laufen Tools auf dem Host. Der Gateway bleibt auf dem Host; die Tool-Ausführung läuft bei Aktivierung in einer isolierten Sandbox.

<Note>
Dies ist keine perfekte Sicherheitsgrenze, schränkt aber den Zugriff auf Dateisystem und Prozesse erheblich ein, wenn das Modell etwas Unvernünftiges tut.
</Note>

## Was in der Sandbox ausgeführt wird

- Tool-Ausführung (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` usw.).
- Optionaler Sandbox-Browser (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Details zum Sandbox-Browser">
    - Standardmäßig startet der Sandbox-Browser automatisch (stellt sicher, dass CDP erreichbar ist), wenn das Browser-Tool ihn benötigt. Konfiguration über `agents.defaults.sandbox.browser.autoStart` und `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Standardmäßig verwenden Sandbox-Browser-Container ein dediziertes Docker-Netzwerk (`openclaw-sandbox-browser`) anstelle des globalen `bridge`-Netzwerks. Konfiguration mit `agents.defaults.sandbox.browser.network`.
    - Optionales `agents.defaults.sandbox.browser.cdpSourceRange` beschränkt eingehenden CDP-Zugriff am Container-Rand mit einer CIDR-Allowlist (zum Beispiel `172.21.0.1/32`).
    - noVNC-Beobachterzugriff ist standardmäßig passwortgeschützt; OpenClaw gibt eine kurzlebige Token-URL aus, die eine lokale Bootstrap-Seite bereitstellt und noVNC mit dem Passwort im URL-Fragment öffnet (nicht in Abfrage-/Header-Logs).
    - `agents.defaults.sandbox.browser.allowHostControl` erlaubt Sandbox-Sitzungen, explizit den Host-Browser anzusteuern.
    - Optionale Allowlists begrenzen `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Nicht in der Sandbox ausgeführt:

- Der Gateway-Prozess selbst.
- Jedes Tool, dem explizit erlaubt wurde, außerhalb der Sandbox zu laufen (z. B. `tools.elevated`).
  - **Erhöhte exec-Ausführung umgeht Sandboxing und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das exec-Ziel `node` ist).**
  - Wenn Sandboxing deaktiviert ist, ändert `tools.elevated` die Ausführung nicht (bereits auf dem Host). Siehe [Erhöhter Modus](/de/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` steuert, **wann** Sandboxing verwendet wird:

<Tabs>
  <Tab title="off">
    Kein Sandboxing.
  </Tab>
  <Tab title="non-main">
    Nur **Nicht-Main**-Sitzungen in der Sandbox ausführen (Standard, wenn normale Chats auf dem Host laufen sollen).

    `"non-main"` basiert auf `session.mainKey` (Standard `"main"`), nicht auf der Agent-ID. Gruppen-/Kanal-Sitzungen verwenden ihre eigenen Schlüssel, zählen also als Nicht-Main und werden in der Sandbox ausgeführt.

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

`agents.defaults.sandbox.backend` steuert, **welche Runtime** die Sandbox bereitstellt:

- `"docker"` (Standard, wenn Sandboxing aktiviert ist): lokale Docker-gestützte Sandbox-Runtime.
- `"ssh"`: generische SSH-gestützte Remote-Sandbox-Runtime.
- `"openshell"`: OpenShell-gestützte Sandbox-Runtime.

SSH-spezifische Konfiguration befindet sich unter `agents.defaults.sandbox.ssh`. OpenShell-spezifische Konfiguration befindet sich unter `plugins.entries.openshell.config`.

### Ein Backend auswählen

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Ausführungsort**  | Lokaler Container                | Jeder per SSH erreichbare Host | Von OpenShell verwaltete Sandbox                    |
| **Einrichtung**     | `scripts/sandbox-setup.sh`       | SSH-Schlüssel + Zielhost       | OpenShell-Plugin aktiviert                          |
| **Workspace-Modell** | Bind-Mount oder Kopie            | Remote-kanonisch (einmaliges Seeding) | `mirror` oder `remote`                              |
| **Netzwerksteuerung** | `docker.network` (Standard: keine) | Hängt vom Remote-Host ab       | Hängt von OpenShell ab                              |
| **Browser-Sandbox** | Unterstützt                      | Nicht unterstützt              | Noch nicht unterstützt                              |
| **Bind-Mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Am besten für**   | Lokale Entwicklung, vollständige Isolation | Auslagern auf eine Remote-Maschine | Verwaltete Remote-Sandboxes mit optionaler Zwei-Wege-Synchronisierung |

### Docker-Backend

Sandboxing ist standardmäßig deaktiviert. Wenn Sie Sandboxing aktivieren und kein Backend auswählen, verwendet OpenClaw das Docker-Backend. Es führt Tools und Sandbox-Browser lokal über den Docker-Daemon-Socket (`/var/run/docker.sock`) aus. Die Isolation von Sandbox-Containern wird durch Docker-Namespaces bestimmt.

Um Host-GPUs für Docker-Sandboxes verfügbar zu machen, setzen Sie `agents.defaults.sandbox.docker.gpus` oder den agentenspezifischen Override `agents.list[].sandbox.docker.gpus`. Der Wert wird als separates Argument an Dockers `--gpus`-Flag übergeben, zum Beispiel `"all"` oder `"device=GPU-uuid"`, und erfordert eine kompatible Host-Runtime wie NVIDIA Container Toolkit.

<Warning>
**Docker-out-of-Docker (DooD)-Einschränkungen**

Wenn Sie den OpenClaw Gateway selbst als Docker-Container bereitstellen, orchestriert er gleichgeordnete Sandbox-Container über den Docker-Socket des Hosts (DooD). Dies führt zu einer bestimmten Einschränkung bei der Pfadzuordnung:

- **Konfiguration erfordert Host-Pfade**: Die `openclaw.json`-`workspace`-Konfiguration MUSS den **absoluten Pfad des Hosts** enthalten (z. B. `/home/user/.openclaw/workspaces`), nicht den internen Pfad des Gateway-Containers. Wenn OpenClaw den Docker-Daemon auffordert, eine Sandbox zu starten, wertet der Daemon Pfade relativ zum Namespace des Host-Betriebssystems aus, nicht relativ zum Gateway-Namespace.
- **FS-Bridge-Parität (identische Volume-Zuordnung)**: Der native OpenClaw Gateway-Prozess schreibt außerdem Heartbeat- und Bridge-Dateien in das `workspace`-Verzeichnis. Da der Gateway dieselbe Zeichenfolge (den Host-Pfad) aus seiner eigenen containerisierten Umgebung heraus auswertet, MUSS die Gateway-Bereitstellung eine identische Volume-Zuordnung enthalten, die den Host-Namespace nativ verknüpft (`-v /home/user/.openclaw:/home/user/.openclaw`).

Wenn Sie Pfade intern ohne absolute Host-Parität zuordnen, wirft OpenClaw nativ einen `EACCES`-Berechtigungsfehler beim Versuch, seinen Heartbeat innerhalb der Container-Umgebung zu schreiben, weil die vollständig qualifizierte Pfadzeichenfolge nativ nicht existiert.
</Warning>

### SSH-Backend

Verwenden Sie `backend: "ssh"`, wenn OpenClaw `exec`, Datei-Tools und Medien-Lesevorgänge auf einer beliebigen per SSH erreichbaren Maschine in der Sandbox ausführen soll.

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
    - OpenClaw erstellt ein bereichsspezifisches Remote-Root unter `sandbox.ssh.workspaceRoot`.
    - Bei der ersten Verwendung nach dem Erstellen oder Neuerstellen seedet OpenClaw diesen Remote-Workspace einmal aus dem lokalen Workspace.
    - Danach laufen `exec`, `read`, `write`, `edit`, `apply_patch`, Prompt-Medien-Lesevorgänge und eingehendes Medien-Staging direkt über SSH gegen den Remote-Workspace.
    - OpenClaw synchronisiert Remote-Änderungen nicht automatisch zurück in den lokalen Workspace.

  </Accordion>
  <Accordion title="Authentifizierungsmaterial">
    - `identityFile`, `certificateFile`, `knownHostsFile`: verwenden vorhandene lokale Dateien und geben sie über die OpenSSH-Konfiguration weiter.
    - `identityData`, `certificateData`, `knownHostsData`: verwenden Inline-Strings oder SecretRefs. OpenClaw löst sie über den normalen Secrets-Runtime-Snapshot auf, schreibt sie mit `0600` in temporäre Dateien und löscht sie, wenn die SSH-Sitzung endet.
    - Wenn sowohl `*File` als auch `*Data` für dasselbe Element gesetzt sind, gewinnt `*Data` für diese SSH-Sitzung.

  </Accordion>
  <Accordion title="Folgen des remote-kanonischen Modells">
    Dies ist ein **remote-kanonisches** Modell. Der Remote-SSH-Workspace wird nach dem initialen Seeding zum tatsächlichen Sandbox-Zustand.

    - Host-lokale Änderungen, die nach dem Seeding-Schritt außerhalb von OpenClaw vorgenommen werden, sind remote nicht sichtbar, bis Sie die Sandbox neu erstellen.
    - `openclaw sandbox recreate` löscht das bereichsspezifische Remote-Root und seedet bei der nächsten Verwendung erneut aus dem lokalen Workspace.
    - Browser-Sandboxing wird beim SSH-Backend nicht unterstützt.
    - `sandbox.docker.*`-Einstellungen gelten nicht für das SSH-Backend.

  </Accordion>
</AccordionGroup>

### OpenShell-Backend

Verwenden Sie `backend: "openshell"`, wenn OpenClaw Tools in einer von OpenShell verwalteten Remote-Umgebung in der Sandbox ausführen soll. Die vollständige Einrichtungsanleitung, Konfigurationsreferenz und den Vergleich der Workspace-Modi finden Sie auf der dedizierten [OpenShell-Seite](/de/gateway/openshell).

OpenShell verwendet denselben zentralen SSH-Transport und dieselbe Remote-Dateisystem-Bridge wie das generische SSH-Backend wieder und fügt OpenShell-spezifischen Lebenszyklus (`sandbox create/get/delete`, `sandbox ssh-config`) sowie den optionalen `mirror`-Workspace-Modus hinzu.

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

- `mirror` (Standard): Der lokale Workspace bleibt kanonisch. OpenClaw synchronisiert lokale Dateien vor `exec` in OpenShell und synchronisiert den Remote-Workspace nach `exec` zurück.
- `remote`: Der OpenShell-Workspace ist kanonisch, nachdem die Sandbox erstellt wurde. OpenClaw seedet den Remote-Workspace einmal aus dem lokalen Workspace; danach laufen Datei-Tools und `exec` direkt gegen die Remote-Sandbox, ohne Änderungen zurückzusynchronisieren.

<AccordionGroup>
  <Accordion title="Details zum Remote-Transport">
    - OpenClaw fragt OpenShell per `openshell sandbox ssh-config <name>` nach Sandbox-spezifischer SSH-Konfiguration.
    - Core schreibt diese SSH-Konfiguration in eine temporäre Datei, öffnet die SSH-Sitzung und verwendet dieselbe Remote-Dateisystem-Bridge wieder, die von `backend: "ssh"` verwendet wird.
    - Im `mirror`-Modus unterscheidet sich nur der Lebenszyklus: vor `exec` lokal nach remote synchronisieren, danach nach `exec` zurücksynchronisieren.

  </Accordion>
  <Accordion title="Aktuelle OpenShell-Einschränkungen">
    - Sandbox-Browser wird noch nicht unterstützt
    - `sandbox.docker.binds` wird beim OpenShell-Backend nicht unterstützt
    - Docker-spezifische Runtime-Regler unter `sandbox.docker.*` gelten weiterhin nur für das Docker-Backend

  </Accordion>
</AccordionGroup>

#### Workspace-Modi

OpenShell hat zwei Workspace-Modelle. Das ist der Teil, der in der Praxis am wichtigsten ist.

<Tabs>
  <Tab title="mirror (lokal kanonisch)">
    Verwenden Sie `plugins.entries.openshell.config.mode: "mirror"`, wenn der **lokale Workspace kanonisch bleiben** soll.

    Verhalten:

    - Vor `exec` synchronisiert OpenClaw den lokalen Workspace in die OpenShell-Sandbox.
    - Nach `exec` synchronisiert OpenClaw den Remote-Workspace zurück in den lokalen Workspace.
    - Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace bleibt zwischen Durchläufen die Quelle der Wahrheit.

    Verwenden Sie dies, wenn:

    - Sie bearbeiten Dateien lokal außerhalb von OpenClaw und möchten, dass diese Änderungen automatisch in der Sandbox erscheinen
    - Sie möchten, dass sich die OpenShell-Sandbox möglichst ähnlich wie das Docker-Backend verhält
    - Sie möchten, dass der Host-Workspace nach jeder Exec-Runde Sandbox-Schreibvorgänge widerspiegelt

    Abwägung: zusätzlicher Sync-Aufwand vor und nach Exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn Sie möchten, dass der **OpenShell-Workspace kanonisch wird**.

    Verhalten:

    - Wenn die Sandbox zum ersten Mal erstellt wird, initialisiert OpenClaw den Remote-Workspace einmal aus dem lokalen Workspace.
    - Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch` direkt gegen den Remote-OpenShell-Workspace.
    - OpenClaw synchronisiert Remote-Änderungen nach Exec **nicht** zurück in den lokalen Workspace.
    - Medien-Lesevorgänge zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Medien-Tools über die Sandbox-Bridge lesen, statt von einem lokalen Host-Pfad auszugehen.
    - Der Transport erfolgt per SSH in die von `openshell sandbox ssh-config` zurückgegebene OpenShell-Sandbox.

    Wichtige Folgen:

    - Wenn Sie nach dem Initialisierungsschritt Dateien auf dem Host außerhalb von OpenClaw bearbeiten, sieht die Remote-Sandbox diese Änderungen **nicht** automatisch.
    - Wenn die Sandbox neu erstellt wird, wird der Remote-Workspace erneut aus dem lokalen Workspace initialisiert.
    - Mit `scope: "agent"` oder `scope: "shared"` wird dieser Remote-Workspace im selben Scope geteilt.

    Verwenden Sie dies, wenn:

    - die Sandbox hauptsächlich auf der Remote-OpenShell-Seite leben soll
    - Sie geringeren Sync-Overhead pro Runde möchten
    - Sie nicht möchten, dass host-lokale Änderungen den Remote-Sandbox-Zustand stillschweigend überschreiben

  </Tab>
</Tabs>

Wählen Sie `mirror`, wenn Sie die Sandbox als temporäre Ausführungsumgebung betrachten. Wählen Sie `remote`, wenn Sie die Sandbox als den echten Workspace betrachten.

#### OpenShell-Lebenszyklus

OpenShell-Sandboxes werden weiterhin über den normalen Sandbox-Lebenszyklus verwaltet:

- `openclaw sandbox list` zeigt sowohl OpenShell-Runtimes als auch Docker-Runtimes an
- `openclaw sandbox recreate` löscht die aktuelle Runtime und lässt OpenClaw sie bei der nächsten Verwendung neu erstellen
- die Prune-Logik ist ebenfalls backend-bewusst

Für den Modus `remote` ist die Neuerstellung besonders wichtig:

- Neuerstellung löscht den kanonischen Remote-Workspace für diesen Scope
- die nächste Verwendung initialisiert einen frischen Remote-Workspace aus dem lokalen Workspace

Für den Modus `mirror` setzt die Neuerstellung hauptsächlich die Remote-Ausführungsumgebung zurück, weil der lokale Workspace ohnehin kanonisch bleibt.

## Workspace-Zugriff

`agents.defaults.sandbox.workspaceAccess` steuert, **was die Sandbox sehen kann**:

<Tabs>
  <Tab title="none (default)">
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

- der Modus `mirror` verwendet weiterhin den lokalen Workspace als kanonische Quelle zwischen Exec-Runden
- der Modus `remote` verwendet nach der anfänglichen Initialisierung den Remote-OpenShell-Workspace als kanonische Quelle
- `workspaceAccess: "ro"` und `"none"` schränken das Schreibverhalten weiterhin auf dieselbe Weise ein

Eingehende Medien werden in den aktiven Sandbox-Workspace kopiert (`media/inbound/*`).

<Note>
**Skills-Hinweis:** Das Tool `read` ist auf den Sandbox-Root bezogen. Mit `workspaceAccess: "none"` spiegelt OpenClaw geeignete Skills in den Sandbox-Workspace (`.../skills`), damit sie gelesen werden können. Mit `"rw"` sind Workspace-Skills aus `/workspace/skills` lesbar.
</Note>

## Benutzerdefinierte Bind-Mounts

`agents.defaults.sandbox.docker.binds` mountet zusätzliche Host-Verzeichnisse in den Container. Format: `host:container:mode` (z. B. `"/home/user/source:/source:rw"`).

Globale und agent-spezifische Binds werden **zusammengeführt** (nicht ersetzt). Unter `scope: "shared"` werden agent-spezifische Binds ignoriert.

`agents.defaults.sandbox.browser.binds` mountet zusätzliche Host-Verzeichnisse nur in den **Sandbox-Browser**-Container.

- Wenn gesetzt (einschließlich `[]`), ersetzt es `agents.defaults.sandbox.docker.binds` für den Browser-Container.
- Wenn ausgelassen, fällt der Browser-Container auf `agents.defaults.sandbox.docker.binds` zurück (abwärtskompatibel).

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

- Binds umgehen das Sandbox-Dateisystem: Sie legen Host-Pfade mit dem Modus offen, den Sie festlegen (`:ro` oder `:rw`).
- OpenClaw blockiert gefährliche Bind-Quellen (zum Beispiel: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` und Parent-Mounts, die diese offenlegen würden).
- OpenClaw blockiert außerdem häufige Credential-Roots im Home-Verzeichnis wie `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` und `~/.ssh`.
- Die Bind-Validierung ist nicht nur String-Abgleich. OpenClaw normalisiert den Quellpfad und löst ihn dann erneut über den tiefsten vorhandenen Vorfahren auf, bevor blockierte Pfade und erlaubte Roots erneut geprüft werden.
- Das bedeutet, dass Symlink-Parent-Escapes weiterhin geschlossen fehlschlagen, selbst wenn das finale Leaf noch nicht existiert. Beispiel: `/workspace/run-link/new-file` wird weiterhin als `/var/run/...` aufgelöst, wenn `run-link` dorthin zeigt.
- Erlaubte Quell-Roots werden auf dieselbe Weise kanonisiert, sodass ein Pfad, der nur vor der Symlink-Auflösung innerhalb der Allowlist zu liegen scheint, weiterhin als `outside allowed roots` abgelehnt wird.
- Sensible Mounts (Secrets, SSH-Schlüssel, Dienst-Credentials) sollten `:ro` sein, sofern nicht absolut erforderlich.
- Kombinieren Sie dies mit `workspaceAccess: "ro"`, wenn Sie nur Lesezugriff auf den Workspace benötigen; Bind-Modi bleiben unabhängig.
- Siehe [Sandbox vs. Tool Policy vs. Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated), um zu erfahren, wie Binds mit Tool-Richtlinien und erhöhtem Exec interagieren.

</Warning>

## Images und Einrichtung

Standard-Docker-Image: `openclaw-sandbox:bookworm-slim`

<Note>
**Source-Checkout vs. npm-Installation**

Die Hilfsskripte `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` und `scripts/sandbox-browser-setup.sh` sind nur verfügbar, wenn sie aus einem [Source-Checkout](https://github.com/openclaw/openclaw) ausgeführt werden. Sie sind nicht im npm-Paket enthalten.

Wenn Sie OpenClaw über `npm install -g openclaw` installiert haben, verwenden Sie stattdessen die unten gezeigten Inline-Befehle `docker build`.
</Note>

<Steps>
  <Step title="Build the default image">
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

    Das Standard-Image enthält **kein** Node. Wenn ein Skill Node (oder andere Runtimes) benötigt, backen Sie entweder ein benutzerdefiniertes Image oder installieren Sie über `sandbox.docker.setupCommand` (erfordert Netzwerk-Egress + beschreibbaren Root + Root-Benutzer).

    OpenClaw ersetzt ein fehlendes `openclaw-sandbox:bookworm-slim` nicht stillschweigend durch einfaches `debian:bookworm-slim`. Sandbox-Läufe, die auf das Standard-Image zielen, schlagen mit einer Build-Anweisung schnell fehl, bis Sie es bauen, weil das gebündelte Image `python3` für Sandbox-Write/Edit-Helfer enthält.

  </Step>
  <Step title="Optional: build the common image">
    Für ein funktionaleres Sandbox-Image mit gängigen Tools (zum Beispiel `curl`, `jq`, `nodejs`, `python3`, `git`):

    Aus einem Source-Checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Bauen Sie bei einer npm-Installation zuerst das Standard-Image (siehe oben) und bauen Sie dann darauf das Common-Image mit der [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) aus dem Repository.

    Setzen Sie dann `agents.defaults.sandbox.docker.image` auf `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    Aus einem Source-Checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Bauen Sie bei einer npm-Installation mit der [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) aus dem Repository.

  </Step>
</Steps>

Standardmäßig laufen Docker-Sandbox-Container mit **keinem Netzwerk**. Überschreiben Sie dies mit `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    Das gebündelte Sandbox-Browser-Image wendet außerdem konservative Chromium-Start-Defaults für containerisierte Workloads an. Aktuelle Container-Defaults umfassen:

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
    - Die drei Graphics-Hardening-Flags (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sind optional und nützlich, wenn Container keine GPU-Unterstützung haben. Setzen Sie `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, wenn Ihr Workload WebGL oder andere 3D-/Browser-Funktionen benötigt.
    - `--disable-extensions` ist standardmäßig aktiviert und kann mit `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` für Flows deaktiviert werden, die auf Erweiterungen angewiesen sind.
    - `--renderer-process-limit=2` wird durch `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` gesteuert, wobei `0` Chromiums Default beibehält.

    Wenn Sie ein anderes Runtime-Profil benötigen, verwenden Sie ein benutzerdefiniertes Browser-Image und stellen Sie Ihren eigenen Entrypoint bereit. Für lokale Chromium-Profile (ohne Container) verwenden Sie `browser.extraArgs`, um zusätzliche Start-Flags anzuhängen.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` wird blockiert.
    - `network: "container:<id>"` wird standardmäßig blockiert (Risiko der Namespace-Join-Umgehung).
    - Break-Glass-Override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker-Installationen und das containerisierte Gateway befinden sich hier: [Docker](/de/install/docker)

Für Docker-Gateway-Bereitstellungen kann `scripts/docker/setup.sh` die Sandbox-Konfiguration bootstrappen. Setzen Sie `OPENCLAW_SANDBOX=1` (oder `true`/`yes`/`on`), um diesen Pfad zu aktivieren. Sie können den Socket-Speicherort mit `OPENCLAW_DOCKER_SOCKET` überschreiben. Vollständige Einrichtung und Env-Referenz: [Docker](/de/install/docker#agent-sandbox).

## setupCommand (einmalige Container-Einrichtung)

`setupCommand` läuft **einmal**, nachdem der Sandbox-Container erstellt wurde (nicht bei jedem Lauf). Er wird innerhalb des Containers über `sh -lc` ausgeführt.

Pfade:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Pro Agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - Standard-`docker.network` ist `"none"` (kein Egress), daher schlagen Paketinstallationen fehl.
    - `docker.network: "container:<id>"` erfordert `dangerouslyAllowContainerNamespaceJoin: true` und ist nur als Break-Glass-Option gedacht.
    - `readOnlyRoot: true` verhindert Schreibvorgänge; setzen Sie `readOnlyRoot: false` oder backen Sie ein benutzerdefiniertes Image.
    - `user` muss für Paketinstallationen Root sein (lassen Sie `user` weg oder setzen Sie `user: "0:0"`).
    - Sandbox-Exec erbt nicht das Host-`process.env`. Verwenden Sie `agents.defaults.sandbox.docker.env` (oder ein benutzerdefiniertes Image) für Skill-API-Schlüssel.

  </Accordion>
</AccordionGroup>

## Tool-Richtlinie und Ausweichmechanismen

Tool-Zulassungs-/Verweigerungsrichtlinien gelten weiterhin vor Sandbox-Regeln. Wenn ein Tool global oder pro Agent verweigert wird, bringt Sandboxing es nicht zurück.

`tools.elevated` ist ein expliziter Ausweichmechanismus, der `exec` außerhalb der Sandbox ausführt (`gateway` standardmäßig oder `node`, wenn das exec-Ziel `node` ist). `/exec`-Direktiven gelten nur für autorisierte Absender und bleiben pro Sitzung bestehen; um `exec` hart zu deaktivieren, verwenden Sie eine Tool-Richtlinie mit Verweigerung (siehe [Sandbox vs Tool-Richtlinie vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Verwenden Sie `openclaw sandbox explain`, um den effektiven Sandbox-Modus, die Tool-Richtlinie und Fix-it-Konfigurationsschlüssel zu prüfen.
- Siehe [Sandbox vs Tool-Richtlinie vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) für das Denkmodell „Warum wird dies blockiert?“.

Halten Sie es strikt abgeschottet.

## Multi-Agent-Overrides

Jeder Agent kann Sandbox + Tools überschreiben: `agents.list[].sandbox` und `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` für die Sandbox-Tool-Richtlinie). Siehe [Multi-Agent-Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für die Rangfolge.

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

## Verwandt

- [Multi-Agent-Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) — Overrides pro Agent und Rangfolge
- [OpenShell](/de/gateway/openshell) — Einrichtung des verwalteten Sandbox-Backends, Workspace-Modi und Konfigurationsreferenz
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool-Richtlinie vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — Debugging: „Warum wird dies blockiert?“
- [Sicherheit](/de/gateway/security)
