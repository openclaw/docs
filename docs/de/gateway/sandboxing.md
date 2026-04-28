---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Wie OpenClaw-Sandboxing funktioniert: Modi, Bereiche, Workspace-Zugriff und Images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-26T11:30:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw kann **Tools in Sandbox-Backends** ausführen, um den Blast Radius zu verringern. Das ist **optional** und wird über die Konfiguration gesteuert (`agents.defaults.sandbox` oder `agents.list[].sandbox`). Wenn Sandboxing deaktiviert ist, laufen Tools auf dem Host. Das Gateway bleibt auf dem Host; die Tool-Ausführung läuft in einer isolierten Sandbox, wenn sie aktiviert ist.

<Note>
Dies ist keine perfekte Sicherheitsgrenze, aber es begrenzt Dateisystem- und Prozesszugriff erheblich, wenn das Modell etwas Dummes macht.
</Note>

## Was in die Sandbox kommt

- Tool-Ausführung (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` usw.).
- Optional ein Browser in der Sandbox (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Details zum Browser in der Sandbox">
    - Standardmäßig startet der Browser in der Sandbox automatisch (stellt sicher, dass CDP erreichbar ist), wenn das Browser-Tool ihn benötigt. Konfigurierbar über `agents.defaults.sandbox.browser.autoStart` und `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Standardmäßig verwenden Browser-Container in der Sandbox ein dediziertes Docker-Netzwerk (`openclaw-sandbox-browser`) statt des globalen Netzwerks `bridge`. Konfigurierbar mit `agents.defaults.sandbox.browser.network`.
    - Optional schränkt `agents.defaults.sandbox.browser.cdpSourceRange` eingehenden CDP-Traffic an der Container-Grenze mit einer CIDR-Allowlist ein (zum Beispiel `172.21.0.1/32`).
    - Der Zugriff für noVNC-Beobachter ist standardmäßig passwortgeschützt; OpenClaw erzeugt eine kurzlebige Token-URL, die eine lokale Bootstrap-Seite ausliefert und noVNC mit Passwort im URL-Fragment öffnet (nicht in Query-/Header-Logs).
    - `agents.defaults.sandbox.browser.allowHostControl` erlaubt es Sitzungen in der Sandbox, explizit den Host-Browser anzusprechen.
    - Optionale Allowlists steuern `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.
  </Accordion>
</AccordionGroup>

Nicht in der Sandbox:

- Der Gateway-Prozess selbst.
- Jedes Tool, dem explizit erlaubt wird, außerhalb der Sandbox zu laufen (z. B. `tools.elevated`).
  - **Erhöhtes Exec umgeht Sandboxing und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).**
  - Wenn Sandboxing deaktiviert ist, ändert `tools.elevated` die Ausführung nicht (läuft bereits auf dem Host). Siehe [Elevated Mode](/de/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` steuert, **wann** Sandboxing verwendet wird:

<Tabs>
  <Tab title="off">
    Kein Sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandbox nur für **Nicht-Hauptsitzungen** (Standard, wenn normale Chats auf dem Host laufen sollen).

    `"non-main"` basiert auf `session.mainKey` (Standard `"main"`), nicht auf der Agent-ID. Gruppen-/Kanal-Sitzungen verwenden eigene Schlüssel, zählen also als non-main und werden in die Sandbox gelegt.

  </Tab>
  <Tab title="all">
    Jede Sitzung läuft in einer Sandbox.
  </Tab>
</Tabs>

## Bereich

`agents.defaults.sandbox.scope` steuert, **wie viele Container** erstellt werden:

- `"agent"` (Standard): ein Container pro Agent.
- `"session"`: ein Container pro Sitzung.
- `"shared"`: ein Container, der von allen Sitzungen in der Sandbox gemeinsam genutzt wird.

## Backend

`agents.defaults.sandbox.backend` steuert, **welche Laufzeit** die Sandbox bereitstellt:

- `"docker"` (Standard, wenn Sandboxing aktiviert ist): lokale Docker-gestützte Sandbox-Laufzeit.
- `"ssh"`: generische SSH-gestützte Remote-Sandbox-Laufzeit.
- `"openshell"`: OpenShell-gestützte Sandbox-Laufzeit.

SSH-spezifische Konfiguration steht unter `agents.defaults.sandbox.ssh`. OpenShell-spezifische Konfiguration steht unter `plugins.entries.openshell.config`.

### Ein Backend wählen

|                     | Docker                          | SSH                            | OpenShell                                              |
| ------------------- | ------------------------------- | ------------------------------ | ------------------------------------------------------ |
| **Wo es läuft**     | Lokaler Container               | Jeder per SSH erreichbare Host | Von OpenShell verwaltete Sandbox                       |
| **Setup**           | `scripts/sandbox-setup.sh`      | SSH-Schlüssel + Zielhost       | OpenShell-Plugin aktiviert                             |
| **Workspace-Modell**| Bind-Mount oder Kopie           | Remote-kanonisch (einmal seeden) | `mirror` oder `remote`                               |
| **Netzwerksteuerung** | `docker.network` (Standard: none) | Hängt vom Remote-Host ab     | Hängt von OpenShell ab                                 |
| **Browser-Sandbox** | Unterstützt                     | Nicht unterstützt              | Noch nicht unterstützt                                 |
| **Bind-Mounts**     | `docker.binds`                  | N/A                            | N/A                                                    |
| **Am besten für**   | Lokale Entwicklung, volle Isolation | Auslagerung auf eine Remote-Maschine | Verwaltete Remote-Sandboxes mit optionaler bidirektionaler Synchronisierung |

### Docker-Backend

Sandboxing ist standardmäßig deaktiviert. Wenn Sie Sandboxing aktivieren und kein Backend auswählen, verwendet OpenClaw das Docker-Backend. Es führt Tools und Browser in der Sandbox lokal über den Docker-Daemon-Socket (`/var/run/docker.sock`) aus. Die Isolation der Sandbox-Container wird durch Docker-Namespaces bestimmt.

<Warning>
**Docker-out-of-Docker-(DooD)-Einschränkungen**

Wenn Sie das OpenClaw Gateway selbst als Docker-Container bereitstellen, orchestriert es Schwester-Container für die Sandbox über den Docker-Socket des Hosts (DooD). Das bringt eine spezielle Einschränkung für Pfadzuordnungen mit sich:

- **Die Konfiguration erfordert Host-Pfade**: Die Konfiguration `workspace` in `openclaw.json` MUSS den **absoluten Pfad des Hosts** enthalten (z. B. `/home/user/.openclaw/workspaces`), nicht den internen Pfad des Gateway-Containers. Wenn OpenClaw den Docker-Daemon anweist, eine Sandbox zu starten, wertet der Daemon Pfade relativ zum Namespace des Host-OS aus, nicht zum Namespace des Gateway.
- **FS-Bridge-Parität (identische Volume-Zuordnung)**: Der native Prozess des OpenClaw Gateway schreibt außerdem Heartbeat- und Bridge-Dateien in das Verzeichnis `workspace`. Da das Gateway exakt denselben String (den Host-Pfad) innerhalb seiner eigenen containerisierten Umgebung auswertet, MUSS die Gateway-Bereitstellung eine identische Volume-Zuordnung enthalten, die den Host-Namespace nativ verknüpft (`-v /home/user/.openclaw:/home/user/.openclaw`).

Wenn Sie Pfade intern ohne absolute Host-Parität zuordnen, wirft OpenClaw nativ einen `EACCES`-Berechtigungsfehler, wenn es versucht, seinen Heartbeat in die Container-Umgebung zu schreiben, weil der vollständig qualifizierte Pfadstring dort nativ nicht existiert.
</Warning>

### SSH-Backend

Verwenden Sie `backend: "ssh"`, wenn OpenClaw `exec`, Datei-Tools und Medien-Lesevorgänge auf einer beliebigen per SSH erreichbaren Maschine in einer Sandbox ausführen soll.

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
          // Oder SecretRefs / Inline-Inhalte statt lokaler Dateien verwenden:
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
  <Accordion title="Wie es funktioniert">
    - OpenClaw erstellt pro Bereich ein Remote-Root unter `sandbox.ssh.workspaceRoot`.
    - Bei der ersten Nutzung nach dem Erstellen oder Neuerstellen seedet OpenClaw diesen Remote-Workspace einmal aus dem lokalen Workspace.
    - Danach laufen `exec`, `read`, `write`, `edit`, `apply_patch`, Medien-Lesevorgänge im Prompt und das Staging eingehender Medien direkt gegen den Remote-Workspace über SSH.
    - OpenClaw synchronisiert Remote-Änderungen nicht automatisch zurück in den lokalen Workspace.
  </Accordion>
  <Accordion title="Authentifizierungsmaterial">
    - `identityFile`, `certificateFile`, `knownHostsFile`: vorhandene lokale Dateien verwenden und über die OpenSSH-Konfiguration weiterreichen.
    - `identityData`, `certificateData`, `knownHostsData`: Inline-Strings oder SecretRefs verwenden. OpenClaw löst sie über den normalen Snapshot der Secrets-Laufzeit auf, schreibt sie mit `0600` in temporäre Dateien und löscht sie, wenn die SSH-Sitzung endet.
    - Wenn für dasselbe Element sowohl `*File` als auch `*Data` gesetzt sind, gewinnt `*Data` für diese SSH-Sitzung.
  </Accordion>
  <Accordion title="Konsequenzen des Remote-kanonischen Modells">
    Dies ist ein **Remote-kanonisches** Modell. Der Remote-Workspace über SSH wird nach dem ersten Seeding zum tatsächlichen Zustand der Sandbox.

    - Lokale Host-Änderungen, die nach dem Seeding außerhalb von OpenClaw vorgenommen werden, sind remote nicht sichtbar, bis Sie die Sandbox neu erstellen.
    - `openclaw sandbox recreate` löscht das Remote-Root pro Bereich und seedet es bei der nächsten Nutzung erneut aus dem Lokalen.
    - Browser-Sandboxing wird im SSH-Backend nicht unterstützt.
    - Einstellungen `sandbox.docker.*` gelten nicht für das SSH-Backend.

  </Accordion>
</AccordionGroup>

### OpenShell-Backend

Verwenden Sie `backend: "openshell"`, wenn OpenClaw Tools in einer von OpenShell verwalteten Remote-Umgebung in einer Sandbox ausführen soll. Die vollständige Einrichtungsanleitung, Konfigurationsreferenz und den Vergleich der Workspace-Modi finden Sie auf der eigenen Seite zu [OpenShell](/de/gateway/openshell).

OpenShell verwendet denselben SSH-Kerntransport und dieselbe Bridge für das Remote-Dateisystem wie das generische SSH-Backend erneut und ergänzt OpenShell-spezifischen Lebenszyklus (`sandbox create/get/delete`, `sandbox ssh-config`) sowie den optionalen Workspace-Modus `mirror`.

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
- `remote`: Der OpenShell-Workspace ist kanonisch, nachdem die Sandbox erstellt wurde. OpenClaw seedet den Remote-Workspace einmal aus dem lokalen Workspace, danach laufen Datei-Tools und `exec` direkt gegen die Remote-Sandbox, ohne Änderungen zurückzusynchronisieren.

<AccordionGroup>
  <Accordion title="Details zum Remote-Transport">
    - OpenClaw fordert bei OpenShell über `openshell sandbox ssh-config <name>` eine Sandbox-spezifische SSH-Konfiguration an.
    - Der Kern schreibt diese SSH-Konfiguration in eine temporäre Datei, öffnet die SSH-Sitzung und verwendet dieselbe Remote-Dateisystem-Bridge erneut, die auch bei `backend: "ssh"` verwendet wird.
    - Nur im Modus `mirror` unterscheidet sich der Lebenszyklus: lokal vor `exec` nach remote synchronisieren, danach zurück synchronisieren.
  </Accordion>
  <Accordion title="Aktuelle Einschränkungen von OpenShell">
    - Browser in der Sandbox wird noch nicht unterstützt
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
    - Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace bleibt zwischen den Durchläufen die Quelle der Wahrheit.

    Verwenden Sie dies, wenn:

    - Sie Dateien lokal außerhalb von OpenClaw bearbeiten und möchten, dass diese Änderungen automatisch in der Sandbox erscheinen
    - die OpenShell-Sandbox sich möglichst ähnlich wie das Docker-Backend verhalten soll
    - der Host-Workspace Schreibvorgänge aus der Sandbox nach jedem Exec-Durchlauf widerspiegeln soll

    Kompromiss: zusätzliche Synchronisierungskosten vor und nach `exec`.

  </Tab>
  <Tab title="remote (OpenShell kanonisch)">
    Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn der **OpenShell-Workspace kanonisch werden** soll.

    Verhalten:

    - Wenn die Sandbox erstmals erstellt wird, seedet OpenClaw den Remote-Workspace einmal aus dem lokalen Workspace.
    - Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch` direkt gegen den Remote-Workspace von OpenShell.
    - OpenClaw synchronisiert Remote-Änderungen nach `exec` **nicht** zurück in den lokalen Workspace.
    - Medien-Lesevorgänge zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Medientools über die Sandbox-Bridge lesen, statt einen lokalen Host-Pfad vorauszusetzen.
    - Der Transport erfolgt per SSH in die OpenShell-Sandbox, die von `openshell sandbox ssh-config` zurückgegeben wird.

    Wichtige Konsequenzen:

    - Wenn Sie nach dem Seeding Dateien auf dem Host außerhalb von OpenClaw bearbeiten, sieht die Remote-Sandbox diese Änderungen **nicht** automatisch.
    - Wenn die Sandbox neu erstellt wird, wird der Remote-Workspace erneut aus dem lokalen Workspace geseedet.
    - Bei `scope: "agent"` oder `scope: "shared"` wird dieser Remote-Workspace innerhalb genau dieses Bereichs gemeinsam genutzt.

    Verwenden Sie dies, wenn:

    - die Sandbox primär auf der Remote-Seite von OpenShell leben soll
    - Sie geringeren Synchronisierungsaufwand pro Durchlauf möchten
    - Sie nicht möchten, dass lokale Host-Änderungen stillschweigend den Zustand der Remote-Sandbox überschreiben

  </Tab>
</Tabs>

Wählen Sie `mirror`, wenn Sie die Sandbox als temporäre Ausführungsumgebung betrachten. Wählen Sie `remote`, wenn Sie die Sandbox als den echten Workspace betrachten.

#### OpenShell-Lebenszyklus

OpenShell-Sandboxes werden weiterhin über den normalen Sandbox-Lebenszyklus verwaltet:

- `openclaw sandbox list` zeigt OpenShell-Laufzeiten ebenso wie Docker-Laufzeiten
- `openclaw sandbox recreate` löscht die aktuelle Laufzeit und lässt OpenClaw sie bei der nächsten Nutzung neu erstellen
- Die Bereinigungslogik ist ebenfalls backendbewusst

Für den Modus `remote` ist das Neuerstellen besonders wichtig:

- Beim Neuerstellen wird der kanonische Remote-Workspace für diesen Bereich gelöscht
- Bei der nächsten Nutzung wird ein frischer Remote-Workspace aus dem lokalen Workspace geseedet

Für den Modus `mirror` setzt das Neuerstellen hauptsächlich die Remote-Ausführungsumgebung zurück, weil der lokale Workspace ohnehin kanonisch bleibt.

## Workspace-Zugriff

`agents.defaults.sandbox.workspaceAccess` steuert, **was die Sandbox sehen kann**:

<Tabs>
  <Tab title="none (Standard)">
    Tools sehen einen Sandbox-Workspace unter `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Bindet den Agent-Workspace schreibgeschützt unter `/agent` ein (deaktiviert `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Bindet den Agent-Workspace mit Lese-/Schreibzugriff unter `/workspace` ein.
  </Tab>
</Tabs>

Mit dem OpenShell-Backend:

- Im Modus `mirror` bleibt der lokale Workspace zwischen `exec`-Durchläufen die kanonische Quelle
- Im Modus `remote` wird nach dem ersten Seeding der Remote-Workspace von OpenShell zur kanonischen Quelle
- `workspaceAccess: "ro"` und `"none"` beschränken Schreibverhalten weiterhin auf dieselbe Weise

Eingehende Medien werden in den aktiven Sandbox-Workspace kopiert (`media/inbound/*`).

<Note>
**Hinweis zu Skills:** Das Tool `read` ist auf die Sandbox-Root begrenzt. Bei `workspaceAccess: "none"` spiegelt OpenClaw geeignete Skills in den Sandbox-Workspace (`.../skills`), damit sie gelesen werden können. Bei `"rw"` sind Workspace-Skills unter `/workspace/skills` lesbar.
</Note>

## Benutzerdefinierte Bind-Mounts

`agents.defaults.sandbox.docker.binds` bindet zusätzliche Host-Verzeichnisse in den Container ein. Format: `host:container:mode` (z. B. `"/home/user/source:/source:rw"`).

Globale und agent-spezifische Binds werden **zusammengeführt** (nicht ersetzt). Unter `scope: "shared"` werden agent-spezifische Binds ignoriert.

`agents.defaults.sandbox.browser.binds` bindet zusätzliche Host-Verzeichnisse **nur** in den Browser-Container der Sandbox ein.

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
**Sicherheit bei Bind-Mounts**

- Binds umgehen das Dateisystem der Sandbox: Sie legen Host-Pfade mit dem von Ihnen gesetzten Modus offen (`:ro` oder `:rw`).
- OpenClaw blockiert gefährliche Bind-Quellen (zum Beispiel: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` und übergeordnete Mounts, die diese offenlegen würden).
- OpenClaw blockiert außerdem gängige Wurzeln für Zugangsdaten im Home-Verzeichnis wie `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` und `~/.ssh`.
- Die Validierung von Binds ist nicht nur String-Matching. OpenClaw normalisiert den Quellpfad und löst ihn dann erneut über den tiefsten vorhandenen Vorgänger auf, bevor blockierte Pfade und erlaubte Wurzeln erneut geprüft werden.
- Das bedeutet, dass Ausbrüche über Symlink-Parent-Verzeichnisse weiterhin fail-closed fehlschlagen, selbst wenn das endgültige Blatt noch nicht existiert. Beispiel: `/workspace/run-link/new-file` wird weiterhin als `/var/run/...` aufgelöst, wenn `run-link` dorthin zeigt.
- Erlaubte Quellwurzeln werden auf dieselbe Weise kanonisiert, sodass ein Pfad, der vor der Symlink-Auflösung nur scheinbar innerhalb der Allowlist liegt, weiterhin als `outside allowed roots` abgelehnt wird.
- Sensitive Mounts (Secrets, SSH-Schlüssel, Service-Zugangsdaten) sollten `:ro` sein, sofern nicht absolut notwendig.
- Kombinieren Sie dies mit `workspaceAccess: "ro"`, wenn Sie nur Lesezugriff auf den Workspace benötigen; Bind-Modi bleiben unabhängig.
- Siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated), wie Binds mit Tool-Richtlinie und erhöhtem Exec zusammenwirken.
</Warning>

## Images und Setup

Standard-Docker-Image: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Standard-Image bauen">
    ```bash
    scripts/sandbox-setup.sh
    ```

    Das Standard-Image enthält **kein** Node. Wenn ein Skill Node (oder andere Laufzeiten) benötigt, erstellen Sie entweder ein benutzerdefiniertes Image oder installieren Sie es über `sandbox.docker.setupCommand` (erfordert Netzwerkausgang + beschreibbare Root + Root-Benutzer).

  </Step>
  <Step title="Optional: das gemeinsame Image bauen">
    Für ein funktionaleres Sandbox-Image mit gängigen Tools (zum Beispiel `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Setzen Sie dann `agents.defaults.sandbox.docker.image` auf `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: das Browser-Image für die Sandbox bauen">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Standardmäßig laufen Docker-Sandbox-Container **ohne Netzwerk**. Überschreiben Sie dies mit `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Chromium-Standardeinstellungen für Browser in der Sandbox">
    Das mitgelieferte Browser-Image für die Sandbox verwendet außerdem konservative Chromium-Startstandards für containerisierte Workloads. Zu den aktuellen Container-Standards gehören:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<abgeleitet aus OPENCLAW_BROWSER_CDP_PORT>`
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
    - Die drei Flags zur Härtung der Grafik (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sind optional und nützlich, wenn Container keine GPU-Unterstützung haben. Setzen Sie `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, wenn Ihr Workload WebGL oder andere 3D-/Browser-Funktionen benötigt.
    - `--disable-extensions` ist standardmäßig aktiviert und kann mit `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` für Abläufe deaktiviert werden, die Erweiterungen benötigen.
    - `--renderer-process-limit=2` wird durch `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` gesteuert, wobei `0` den Chromium-Standard beibehält.

    Wenn Sie ein anderes Laufzeitprofil benötigen, verwenden Sie ein benutzerdefiniertes Browser-Image und stellen Sie Ihren eigenen Entry Point bereit. Für lokale (nicht containerisierte) Chromium-Profile verwenden Sie `browser.extraArgs`, um zusätzliche Start-Flags anzuhängen.

  </Accordion>
  <Accordion title="Standards für Netzwerksicherheit">
    - `network: "host"` ist blockiert.
    - `network: "container:<id>"` ist standardmäßig blockiert (Risiko durch Umgehung per Namespace-Join).
    - Break-Glass-Override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.
  </Accordion>
</AccordionGroup>

Docker-Installationen und das containerisierte Gateway finden Sie hier: [Docker](/de/install/docker)

Für Gateway-Bereitstellungen mit Docker kann `scripts/docker/setup.sh` die Sandbox-Konfiguration bootstrappen. Setzen Sie `OPENCLAW_SANDBOX=1` (oder `true`/`yes`/`on`), um diesen Pfad zu aktivieren. Sie können den Socket-Standort mit `OPENCLAW_DOCKER_SOCKET` überschreiben. Vollständiges Setup und Referenz für Umgebungsvariablen: [Docker](/de/install/docker#agent-sandbox).

## setupCommand (einmaliges Container-Setup)

`setupCommand` läuft **einmal** nach dem Erstellen des Sandbox-Containers (nicht bei jedem Lauf). Es wird innerhalb des Containers über `sh -lc` ausgeführt.

Pfade:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Pro Agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Häufige Stolperfallen">
    - Standard für `docker.network` ist `"none"` (kein Egress), daher schlagen Paketinstallationen fehl.
    - `docker.network: "container:<id>"` erfordert `dangerouslyAllowContainerNamespaceJoin: true` und ist nur für Break-Glass gedacht.
    - `readOnlyRoot: true` verhindert Schreibvorgänge; setzen Sie `readOnlyRoot: false` oder erstellen Sie ein benutzerdefiniertes Image.
    - `user` muss Root sein für Paketinstallationen (lassen Sie `user` weg oder setzen Sie `user: "0:0"`).
    - Sandbox-Exec übernimmt nicht `process.env` des Hosts. Verwenden Sie `agents.defaults.sandbox.docker.env` (oder ein benutzerdefiniertes Image) für API-Schlüssel von Skills.
  </Accordion>
</AccordionGroup>

## Tool-Richtlinie und Escape-Hatches

Richtlinien zum Erlauben/Verweigern von Tools gelten weiterhin vor Sandbox-Regeln. Wenn ein Tool global oder pro Agent verweigert ist, bringt Sandboxing es nicht zurück.

`tools.elevated` ist ein expliziter Escape-Hatch, der `exec` außerhalb der Sandbox ausführt (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist). Direktiven für `/exec` gelten nur für autorisierte Absender und bleiben pro Sitzung bestehen; um `exec` hart zu deaktivieren, verwenden Sie ein Verweigern in der Tool-Richtlinie (siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Verwenden Sie `openclaw sandbox explain`, um den effektiven Sandbox-Modus, die Tool-Richtlinie und Konfigurationsschlüssel zur Fehlerbehebung zu prüfen.
- Siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) für das Denkmodell zu „Warum ist das blockiert?“.

Halten Sie es so restriktiv wie möglich.

## Überschreibungen für mehrere Agents

Jeder Agent kann Sandbox + Tools überschreiben: `agents.list[].sandbox` und `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` für die Tool-Richtlinie in der Sandbox). Siehe [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für Prioritäten.

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

- [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) — Überschreibungen pro Agent und Prioritäten
- [OpenShell](/de/gateway/openshell) — Setup des verwalteten Sandbox-Backends, Workspace-Modi und Konfigurationsreferenz
- [Sandbox configuration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — Debugging von „Warum ist das blockiert?“
- [Security](/de/gateway/security)
