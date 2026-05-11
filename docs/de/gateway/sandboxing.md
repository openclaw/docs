---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'So funktioniert die Sandbox-Isolierung von OpenClaw: Modi, Bereiche, Zugriff auf den Arbeitsbereich und Bilder'
title: Sandbox-Isolierung
x-i18n:
    generated_at: "2026-05-11T20:30:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a90a68fdab1fdaef462bc6be589cb510d89c01138a0d43927e29d55bbb6e3ea
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw kann **Tools innerhalb von Sandbox-Backends** ausführen, um den Schadensradius zu verringern. Dies ist **optional** und wird über die Konfiguration gesteuert (`agents.defaults.sandbox` oder `agents.list[].sandbox`). Wenn Sandboxing ausgeschaltet ist, werden Tools auf dem Host ausgeführt. Der Gateway bleibt auf dem Host; die Tool-Ausführung läuft bei Aktivierung in einer isolierten Sandbox.

<Note>
Dies ist keine perfekte Sicherheitsgrenze, begrenzt aber den Zugriff auf Dateisystem und Prozesse erheblich, wenn das Modell etwas Unkluges tut.
</Note>

## Was in der Sandbox ausgeführt wird

- Tool-Ausführung (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` usw.).
- Optionaler sandboxed Browser (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Details zum sandboxed Browser">
    - Standardmäßig startet der sandboxed Browser automatisch (stellt sicher, dass CDP erreichbar ist), wenn das Browser-Tool ihn benötigt. Konfigurieren Sie dies über `agents.defaults.sandbox.browser.autoStart` und `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Standardmäßig verwenden Container für den sandboxed Browser ein dediziertes Docker-Netzwerk (`openclaw-sandbox-browser`) statt des globalen `bridge`-Netzwerks. Konfigurieren Sie dies mit `agents.defaults.sandbox.browser.network`.
    - Optional beschränkt `agents.defaults.sandbox.browser.cdpSourceRange` eingehenden CDP-Zugriff an der Container-Kante mit einer CIDR-Allowlist (zum Beispiel `172.21.0.1/32`).
    - noVNC-Beobachterzugriff ist standardmäßig passwortgeschützt; OpenClaw gibt eine kurzlebige Token-URL aus, die eine lokale Bootstrap-Seite bereitstellt und noVNC mit Passwort im URL-Fragment öffnet (nicht in Abfrage-/Header-Logs).
    - `agents.defaults.sandbox.browser.allowHostControl` erlaubt sandboxed Sitzungen, den Host-Browser ausdrücklich anzusteuern.
    - Optionale Allowlists beschränken `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Nicht in der Sandbox:

- Der Gateway-Prozess selbst.
- Jedes Tool, dem ausdrücklich erlaubt wurde, außerhalb der Sandbox zu laufen (z. B. `tools.elevated`).
  - **Elevated Exec umgeht Sandboxing und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).**
  - Wenn Sandboxing ausgeschaltet ist, ändert `tools.elevated` die Ausführung nicht (bereits auf dem Host). Siehe [Elevated Mode](/de/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` steuert, **wann** Sandboxing verwendet wird:

<Tabs>
  <Tab title="off">
    Kein Sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandbox nur für **non-main**-Sitzungen (Standard, wenn Sie normale Chats auf dem Host möchten).

    `"non-main"` basiert auf `session.mainKey` (Standard `"main"`), nicht auf der Agent-ID. Gruppen-/Kanalsitzungen verwenden ihre eigenen Schlüssel, zählen also als non-main und werden in der Sandbox ausgeführt.

  </Tab>
  <Tab title="all">
    Jede Sitzung läuft in einer Sandbox.
  </Tab>
</Tabs>

## Geltungsbereich

`agents.defaults.sandbox.scope` steuert, **wie viele Container** erstellt werden:

- `"agent"` (Standard): ein Container pro Agent.
- `"session"`: ein Container pro Sitzung.
- `"shared"`: ein Container, der von allen sandboxed Sitzungen gemeinsam genutzt wird.

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
| **Workspace-Modell** | Bind-Mount oder Kopie           | Remote-kanonisch (einmalig initialisieren) | `mirror` oder `remote`                       |
| **Netzwerksteuerung** | `docker.network` (Standard: none) | Abhängig vom Remote-Host     | Abhängig von OpenShell                              |
| **Browser-Sandbox** | Unterstützt                      | Nicht unterstützt              | Noch nicht unterstützt                              |
| **Bind-Mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Am besten für**   | Lokale Entwicklung, vollständige Isolation | Auslagerung auf eine Remote-Maschine | Verwaltete Remote-Sandboxes mit optionaler bidirektionaler Synchronisierung |

### Docker-Backend

Sandboxing ist standardmäßig ausgeschaltet. Wenn Sie Sandboxing aktivieren und kein Backend auswählen, verwendet OpenClaw das Docker-Backend. Es führt Tools und sandboxed Browser lokal über den Docker-Daemon-Socket (`/var/run/docker.sock`) aus. Die Isolation von Sandbox-Containern wird durch Docker-Namespaces bestimmt.

Um Host-GPUs für Docker-Sandboxes verfügbar zu machen, setzen Sie `agents.defaults.sandbox.docker.gpus` oder das agentenspezifische Override `agents.list[].sandbox.docker.gpus`. Der Wert wird als separates Argument an Dockers `--gpus`-Flag übergeben, zum Beispiel `"all"` oder `"device=GPU-uuid"`, und erfordert eine kompatible Host-Runtime wie NVIDIA Container Toolkit.

<Warning>
**Docker-out-of-Docker (DooD)-Einschränkungen**

Wenn Sie den OpenClaw Gateway selbst als Docker-Container bereitstellen, orchestriert er Geschwister-Sandbox-Container über den Docker-Socket des Hosts (DooD). Dadurch entsteht eine spezifische Einschränkung für Pfadzuordnungen:

- **Konfiguration erfordert Host-Pfade**: Die `openclaw.json`-`workspace`-Konfiguration MUSS den **absoluten Pfad des Hosts** enthalten (z. B. `/home/user/.openclaw/workspaces`), nicht den internen Pfad des Gateway-Containers. Wenn OpenClaw den Docker-Daemon auffordert, eine Sandbox zu starten, wertet der Daemon Pfade relativ zum Namespace des Host-Betriebssystems aus, nicht relativ zum Gateway-Namespace.
- **FS-Bridge-Parität (identische Volume-Zuordnung)**: Der native OpenClaw Gateway-Prozess schreibt außerdem Heartbeat- und Bridge-Dateien in das `workspace`-Verzeichnis. Da der Gateway exakt dieselbe Zeichenfolge (den Host-Pfad) aus seiner eigenen containerisierten Umgebung heraus auswertet, MUSS die Gateway-Bereitstellung eine identische Volume-Zuordnung enthalten, die den Host-Namespace nativ verknüpft (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Codex-Code-Modus**: Wenn eine OpenClaw-Sandbox aktiv ist, beschränkt OpenClaw App-Server-Turns von Codex auf Codex-`workspace-write`-Sandboxing, selbst wenn der Standard des Codex-Plugins `danger-full-access` ist. Mounten Sie den Docker-Socket des Hosts nicht in Agent-Sandbox-Container oder benutzerdefinierte Codex-Sandboxes.

Wenn Sie Pfade intern ohne absolute Host-Parität zuordnen, wirft OpenClaw nativ einen `EACCES`-Berechtigungsfehler beim Versuch, seinen Heartbeat innerhalb der Containerumgebung zu schreiben, weil die vollständig qualifizierte Pfadzeichenfolge dort nativ nicht existiert.
</Warning>

### SSH-Backend

Verwenden Sie `backend: "ssh"`, wenn OpenClaw `exec`, Datei-Tools und Medienlesevorgänge auf einer beliebigen per SSH erreichbaren Maschine in einer Sandbox ausführen soll.

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
    - OpenClaw erstellt unter `sandbox.ssh.workspaceRoot` ein Remote-Stammverzeichnis pro Geltungsbereich.
    - Bei der ersten Verwendung nach Erstellen oder Neuerstellen initialisiert OpenClaw diesen Remote-Workspace einmal aus dem lokalen Workspace.
    - Danach laufen `exec`, `read`, `write`, `edit`, `apply_patch`, Prompt-Medienlesevorgänge und eingehendes Medien-Staging direkt über SSH gegen den Remote-Workspace.
    - OpenClaw synchronisiert Remote-Änderungen nicht automatisch zurück in den lokalen Workspace.

  </Accordion>
  <Accordion title="Authentifizierungsmaterial">
    - `identityFile`, `certificateFile`, `knownHostsFile`: vorhandene lokale Dateien verwenden und über die OpenSSH-Konfiguration weitergeben.
    - `identityData`, `certificateData`, `knownHostsData`: Inline-Zeichenfolgen oder SecretRefs verwenden. OpenClaw löst sie über den normalen Secrets-Runtime-Snapshot auf, schreibt sie mit `0600` in temporäre Dateien und löscht sie, wenn die SSH-Sitzung endet.
    - Wenn sowohl `*File` als auch `*Data` für dasselbe Element gesetzt sind, gewinnt `*Data` für diese SSH-Sitzung.

  </Accordion>
  <Accordion title="Folgen des remote-kanonischen Modells">
    Dies ist ein **remote-kanonisches** Modell. Der Remote-SSH-Workspace wird nach der anfänglichen Initialisierung zum tatsächlichen Sandbox-Zustand.

    - Host-lokale Änderungen, die nach dem Initialisierungsschritt außerhalb von OpenClaw vorgenommen werden, sind remote nicht sichtbar, bis Sie die Sandbox neu erstellen.
    - `openclaw sandbox recreate` löscht das Remote-Stammverzeichnis pro Geltungsbereich und initialisiert es bei der nächsten Verwendung erneut aus dem lokalen Workspace.
    - Browser-Sandboxing wird im SSH-Backend nicht unterstützt.
    - `sandbox.docker.*`-Einstellungen gelten nicht für das SSH-Backend.

  </Accordion>
</AccordionGroup>

### OpenShell-Backend

Verwenden Sie `backend: "openshell"`, wenn OpenClaw Tools in einer von OpenShell verwalteten Remote-Umgebung in einer Sandbox ausführen soll. Die vollständige Einrichtungsanleitung, die Konfigurationsreferenz und den Vergleich der Workspace-Modi finden Sie auf der dedizierten [OpenShell-Seite](/de/gateway/openshell).

OpenShell verwendet denselben zentralen SSH-Transport und dieselbe Remote-Dateisystem-Bridge wie das generische SSH-Backend und ergänzt OpenShell-spezifischen Lebenszyklus (`sandbox create/get/delete`, `sandbox ssh-config`) sowie den optionalen `mirror`-Workspace-Modus.

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
- `remote`: Der OpenShell-Workspace ist kanonisch, nachdem die Sandbox erstellt wurde. OpenClaw initialisiert den Remote-Workspace einmal aus dem lokalen Workspace; danach laufen Datei-Tools und `exec` direkt gegen die Remote-Sandbox, ohne Änderungen zurückzusynchronisieren.

<AccordionGroup>
  <Accordion title="Details zum Remote-Transport">
    - OpenClaw fragt OpenShell über `openshell sandbox ssh-config <name>` nach sandbox-spezifischer SSH-Konfiguration.
    - Core schreibt diese SSH-Konfiguration in eine temporäre Datei, öffnet die SSH-Sitzung und verwendet dieselbe Remote-Dateisystem-Bridge wieder, die von `backend: "ssh"` genutzt wird.
    - Nur im `mirror`-Modus unterscheidet sich der Lebenszyklus: lokal nach remote vor `exec` synchronisieren, danach nach `exec` zurücksynchronisieren.

  </Accordion>
  <Accordion title="Aktuelle OpenShell-Einschränkungen">
    - sandbox browser wird noch nicht unterstützt
    - `sandbox.docker.binds` wird im OpenShell-Backend nicht unterstützt
    - Docker-spezifische Runtime-Optionen unter `sandbox.docker.*` gelten weiterhin nur für das Docker-Backend

  </Accordion>
</AccordionGroup>

#### Workspace-Modi

OpenShell hat zwei Workspace-Modelle. Dies ist der Teil, der in der Praxis am wichtigsten ist.

<Tabs>
  <Tab title="mirror (lokal kanonisch)">
    Verwenden Sie `plugins.entries.openshell.config.mode: "mirror"`, wenn der **lokale Workspace kanonisch bleiben** soll.

    Verhalten:

    - Vor `exec` synchronisiert OpenClaw den lokalen Arbeitsbereich in die OpenShell-Sandbox.
    - Nach `exec` synchronisiert OpenClaw den entfernten Arbeitsbereich zurück in den lokalen Arbeitsbereich.
    - Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Arbeitsbereich bleibt zwischen Turns die Quelle der Wahrheit.

    Verwenden Sie dies, wenn:

    - Sie Dateien lokal außerhalb von OpenClaw bearbeiten und möchten, dass diese Änderungen automatisch in der Sandbox erscheinen
    - Sie möchten, dass sich die OpenShell-Sandbox so weit wie möglich wie das Docker-Backend verhält
    - Sie möchten, dass der Host-Arbeitsbereich Sandbox-Schreibvorgänge nach jedem exec-Turn widerspiegelt

    Abwägung: zusätzlicher Synchronisierungsaufwand vor und nach exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn Sie möchten, dass der **OpenShell-Arbeitsbereich kanonisch wird**.

    Verhalten:

    - Wenn die Sandbox erstmals erstellt wird, initialisiert OpenClaw den entfernten Arbeitsbereich einmal aus dem lokalen Arbeitsbereich.
    - Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch` direkt gegen den entfernten OpenShell-Arbeitsbereich.
    - OpenClaw synchronisiert entfernte Änderungen nach exec **nicht** zurück in den lokalen Arbeitsbereich.
    - Medienlesevorgänge zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Medien-Tools über die Sandbox-Bridge lesen, statt einen lokalen Host-Pfad vorauszusetzen.
    - Der Transport erfolgt per SSH in die OpenShell-Sandbox, die von `openshell sandbox ssh-config` zurückgegeben wird.

    Wichtige Folgen:

    - Wenn Sie nach dem Initialisierungsschritt Dateien auf dem Host außerhalb von OpenClaw bearbeiten, sieht die entfernte Sandbox diese Änderungen **nicht** automatisch.
    - Wenn die Sandbox neu erstellt wird, wird der entfernte Arbeitsbereich erneut aus dem lokalen Arbeitsbereich initialisiert.
    - Mit `scope: "agent"` oder `scope: "shared"` wird dieser entfernte Arbeitsbereich im selben Scope geteilt.

    Verwenden Sie dies, wenn:

    - die Sandbox hauptsächlich auf der entfernten OpenShell-Seite leben soll
    - Sie geringeren Synchronisierungsaufwand pro Turn wünschen
    - Sie nicht möchten, dass host-lokale Bearbeitungen den entfernten Sandbox-Zustand stillschweigend überschreiben

  </Tab>
</Tabs>

Wählen Sie `mirror`, wenn Sie die Sandbox als temporäre Ausführungsumgebung betrachten. Wählen Sie `remote`, wenn Sie die Sandbox als den eigentlichen Arbeitsbereich betrachten.

#### OpenShell-Lebenszyklus

OpenShell-Sandboxes werden weiterhin über den normalen Sandbox-Lebenszyklus verwaltet:

- `openclaw sandbox list` zeigt sowohl OpenShell-Runtimes als auch Docker-Runtimes
- `openclaw sandbox recreate` löscht die aktuelle Runtime und lässt OpenClaw sie bei der nächsten Verwendung neu erstellen
- die Prune-Logik ist ebenfalls backend-bewusst

Für den Modus `remote` ist das Neuerstellen besonders wichtig:

- Neuerstellen löscht den kanonischen entfernten Arbeitsbereich für diesen Scope
- die nächste Verwendung initialisiert einen frischen entfernten Arbeitsbereich aus dem lokalen Arbeitsbereich

Für den Modus `mirror` setzt das Neuerstellen hauptsächlich die entfernte Ausführungsumgebung zurück, weil der lokale Arbeitsbereich ohnehin kanonisch bleibt.

## Arbeitsbereichszugriff

`agents.defaults.sandbox.workspaceAccess` steuert, **was die Sandbox sehen kann**:

<Tabs>
  <Tab title="none (default)">
    Tools sehen einen Sandbox-Arbeitsbereich unter `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Bindet den Agent-Arbeitsbereich schreibgeschützt unter `/agent` ein (deaktiviert `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Bindet den Agent-Arbeitsbereich mit Lese-/Schreibzugriff unter `/workspace` ein.
  </Tab>
</Tabs>

Mit dem OpenShell-Backend:

- Der Modus `mirror` verwendet weiterhin den lokalen Arbeitsbereich als kanonische Quelle zwischen exec-Turns
- Der Modus `remote` verwendet den entfernten OpenShell-Arbeitsbereich nach der anfänglichen Initialisierung als kanonische Quelle
- `workspaceAccess: "ro"` und `"none"` schränken Schreibverhalten weiterhin auf dieselbe Weise ein

Eingehende Medien werden in den aktiven Sandbox-Arbeitsbereich kopiert (`media/inbound/*`).

<Note>
**Hinweis zu Skills:** Das Tool `read` ist an die Sandbox-Root gebunden. Mit `workspaceAccess: "none"` spiegelt OpenClaw geeignete Skills in den Sandbox-Arbeitsbereich (`.../skills`), damit sie gelesen werden können. Mit `"rw"` sind Arbeitsbereichs-Skills aus `/workspace/skills` lesbar.
</Note>

## Benutzerdefinierte Bind-Mounts

`agents.defaults.sandbox.docker.binds` bindet zusätzliche Host-Verzeichnisse in den Container ein. Format: `host:container:mode` (z. B. `"/home/user/source:/source:rw"`).

Globale und agent-spezifische Binds werden **zusammengeführt** (nicht ersetzt). Unter `scope: "shared"` werden agent-spezifische Binds ignoriert.

`agents.defaults.sandbox.browser.binds` bindet zusätzliche Host-Verzeichnisse nur in den **Sandbox-Browser**-Container ein.

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
- OpenClaw blockiert gefährliche Bind-Quellen (zum Beispiel: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` und übergeordnete Mounts, die diese offenlegen würden).
- OpenClaw blockiert außerdem gängige Credential-Roots im Home-Verzeichnis wie `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` und `~/.ssh`.
- Bind-Validierung ist nicht nur String-Abgleich. OpenClaw normalisiert den Quellpfad und löst ihn anschließend erneut über den tiefsten vorhandenen Vorfahren auf, bevor blockierte Pfade und erlaubte Roots erneut geprüft werden.
- Das bedeutet, dass Escapes über Symlink-Eltern weiterhin geschlossen fehlschlagen, selbst wenn das endgültige Leaf noch nicht existiert. Beispiel: `/workspace/run-link/new-file` wird weiterhin als `/var/run/...` aufgelöst, wenn `run-link` dorthin zeigt.
- Erlaubte Quell-Roots werden auf dieselbe Weise kanonisiert, sodass ein Pfad, der nur vor der Symlink-Auflösung innerhalb der Allowlist zu liegen scheint, weiterhin als `outside allowed roots` abgelehnt wird.
- Sensible Mounts (Secrets, SSH-Schlüssel, Service-Credentials) sollten `:ro` sein, sofern nicht absolut erforderlich.
- Kombinieren Sie dies mit `workspaceAccess: "ro"`, wenn Sie nur Lesezugriff auf den Arbeitsbereich benötigen; Bind-Modi bleiben unabhängig.
- Siehe [Sandbox vs Tool-Richtlinie vs Erhöht](/de/gateway/sandbox-vs-tool-policy-vs-elevated) dazu, wie Binds mit Tool-Richtlinie und erhöhtem exec interagieren.

</Warning>

## Images und Einrichtung

Standard-Docker-Image: `openclaw-sandbox:bookworm-slim`

<Note>
**Quell-Checkout vs. npm-Installation**

Die Hilfsskripte `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` und `scripts/sandbox-browser-setup.sh` sind nur verfügbar, wenn Sie aus einem [Quell-Checkout](https://github.com/openclaw/openclaw) ausführen. Sie sind nicht im npm-Paket enthalten.

Wenn Sie OpenClaw über `npm install -g openclaw` installiert haben, verwenden Sie stattdessen die unten gezeigten Inline-Befehle `docker build`.
</Note>

<Steps>
  <Step title="Build the default image">
    Aus einem Quell-Checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Aus einer npm-Installation (kein Quell-Checkout erforderlich):

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

    Das Standard-Image enthält **kein** Node. Wenn ein Skill Node (oder andere Runtimes) benötigt, backen Sie entweder ein benutzerdefiniertes Image oder installieren Sie über `sandbox.docker.setupCommand` (erfordert Netzwerk-Egress + beschreibbare Root + Root-Benutzer).

    OpenClaw ersetzt ein fehlendes `openclaw-sandbox:bookworm-slim` nicht stillschweigend durch einfaches `debian:bookworm-slim`. Sandbox-Läufe, die auf das Standard-Image zielen, schlagen schnell mit einer Build-Anweisung fehl, bis Sie es gebaut haben, weil das gebündelte Image `python3` für Sandbox-Schreib-/Bearbeitungshilfen mitbringt.

  </Step>
  <Step title="Optional: build the common image">
    Für ein funktionaleres Sandbox-Image mit gängigen Tools (zum Beispiel `curl`, `jq`, `nodejs`, `python3`, `git`):

    Aus einem Quell-Checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Bauen Sie bei einer npm-Installation zuerst das Standard-Image (siehe oben) und bauen Sie anschließend das Common-Image darauf auf, indem Sie die [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) aus dem Repository verwenden.

    Setzen Sie dann `agents.defaults.sandbox.docker.image` auf `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    Aus einem Quell-Checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Bauen Sie bei einer npm-Installation mit der [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) aus dem Repository.

  </Step>
</Steps>

Standardmäßig laufen Docker-Sandbox-Container mit **keinem Netzwerk**. Überschreiben Sie dies mit `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    Das gebündelte Sandbox-Browser-Image wendet außerdem konservative Chromium-Startvorgaben für containerisierte Workloads an. Aktuelle Container-Standards umfassen:

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
    - Die drei Grafik-Härtungsflags (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sind optional und nützlich, wenn Container keine GPU-Unterstützung haben. Setzen Sie `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, wenn Ihre Workload WebGL oder andere 3D-/Browser-Funktionen erfordert.
    - `--disable-extensions` ist standardmäßig aktiviert und kann mit `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` für extension-abhängige Flows deaktiviert werden.
    - `--renderer-process-limit=2` wird durch `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` gesteuert, wobei `0` den Chromium-Standard beibehält.

    Wenn Sie ein anderes Runtime-Profil benötigen, verwenden Sie ein benutzerdefiniertes Browser-Image und stellen Sie Ihren eigenen Entrypoint bereit. Verwenden Sie für lokale Chromium-Profile (nicht im Container) `browser.extraArgs`, um zusätzliche Startflags anzuhängen.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` wird blockiert.
    - `network: "container:<id>"` wird standardmäßig blockiert (Risiko der Umgehung durch Namespace-Join).
    - Break-Glass-Override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker-Installationen und das containerisierte Gateway befinden sich hier: [Docker](/de/install/docker)

Für Docker-Gateway-Bereitstellungen kann `scripts/docker/setup.sh` die Sandbox-Konfiguration bootstrapen. Setzen Sie `OPENCLAW_SANDBOX=1` (oder `true`/`yes`/`on`), um diesen Pfad zu aktivieren. Sie können den Socket-Speicherort mit `OPENCLAW_DOCKER_SOCKET` überschreiben. Vollständige Einrichtung und env-Referenz: [Docker](/de/install/docker#agent-sandbox).

## setupCommand (einmalige Container-Einrichtung)

`setupCommand` läuft **einmal**, nachdem der Sandbox-Container erstellt wurde (nicht bei jedem Lauf). Es wird im Container über `sh -lc` ausgeführt.

Pfade:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Pro Agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - Standardmäßig ist `docker.network` `"none"` (kein ausgehender Netzwerkverkehr), daher schlagen Paketinstallationen fehl.
    - `docker.network: "container:<id>"` erfordert `dangerouslyAllowContainerNamespaceJoin: true` und ist nur für Notfälle gedacht.
    - `readOnlyRoot: true` verhindert Schreibvorgänge; setzen Sie `readOnlyRoot: false` oder bauen Sie ein eigenes Image.
    - `user` muss für Paketinstallationen root sein (lassen Sie `user` weg oder setzen Sie `user: "0:0"`).
    - Sandbox-Exec übernimmt **nicht** `process.env` des Hosts. Verwenden Sie `agents.defaults.sandbox.docker.env` (oder ein eigenes Image) für Skill-API-Schlüssel.

  </Accordion>
</AccordionGroup>

## Tool-Richtlinie und Notfallwege

Tool-Zulassungs-/Sperrrichtlinien gelten weiterhin vor Sandbox-Regeln. Wenn ein Tool global oder pro Agent gesperrt ist, bringt Sandboxing es nicht zurück.

`tools.elevated` ist ein expliziter Notfallweg, der `exec` außerhalb der Sandbox ausführt (standardmäßig `gateway` oder `node`, wenn das Exec-Ziel `node` ist). `/exec`-Direktiven gelten nur für autorisierte Absender und bleiben pro Sitzung bestehen; um `exec` hart zu deaktivieren, verwenden Sie eine Tool-Richtliniensperre (siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Verwenden Sie `openclaw sandbox explain`, um den effektiven Sandbox-Modus, die Tool-Richtlinie und Konfigurationsschlüssel zur Behebung zu prüfen.
- Siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) für das mentale Modell zu „Warum ist das blockiert?“.

Halten Sie es abgesichert.

## Multi-Agent-Overrides

Jeder Agent kann Sandbox + Tools überschreiben: `agents.list[].sandbox` und `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` für die Sandbox-Tool-Richtlinie). Siehe [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) zur Rangfolge.

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

- [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) — Overrides pro Agent und Rangfolge
- [OpenShell](/de/gateway/openshell) — Einrichtung des verwalteten Sandbox-Backends, Workspace-Modi und Konfigurationsreferenz
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — Debugging zu „Warum ist das blockiert?“
- [Sicherheit](/de/gateway/security)
