---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Wie das Sandboxing von OpenClaw funktioniert: Modi, Geltungsbereiche, Workspace-Zugriff und Images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-30T06:56:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw kann **Tools innerhalb von Sandbox-Backends** ausführen, um den Schadensradius zu verringern. Dies ist **optional** und wird über die Konfiguration gesteuert (`agents.defaults.sandbox` oder `agents.list[].sandbox`). Wenn Sandboxing deaktiviert ist, laufen Tools auf dem Host. Der Gateway bleibt auf dem Host; die Tool-Ausführung läuft bei aktivierter Funktion in einer isolierten Sandbox.

<Note>
Dies ist keine perfekte Sicherheitsgrenze, schränkt aber den Zugriff auf Dateisystem und Prozesse erheblich ein, wenn das Modell etwas Unbedachtes tut.
</Note>

## Was in der Sandbox ausgeführt wird

- Tool-Ausführung (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` usw.).
- Optionaler Browser in der Sandbox (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Details zum Browser in der Sandbox">
    - Standardmäßig startet der Sandbox-Browser automatisch (stellt sicher, dass CDP erreichbar ist), wenn das Browser-Tool ihn benötigt. Konfiguration über `agents.defaults.sandbox.browser.autoStart` und `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Standardmäßig verwenden Sandbox-Browser-Container ein dediziertes Docker-Netzwerk (`openclaw-sandbox-browser`) statt des globalen `bridge`-Netzwerks. Konfiguration mit `agents.defaults.sandbox.browser.network`.
    - Optionales `agents.defaults.sandbox.browser.cdpSourceRange` beschränkt eingehenden CDP-Zugriff am Container-Rand mit einer CIDR-Allowlist (zum Beispiel `172.21.0.1/32`).
    - noVNC-Beobachterzugriff ist standardmäßig passwortgeschützt; OpenClaw gibt eine kurzlebige Token-URL aus, die eine lokale Bootstrap-Seite bereitstellt und noVNC mit dem Passwort im URL-Fragment öffnet (nicht in Query-/Header-Logs).
    - `agents.defaults.sandbox.browser.allowHostControl` ermöglicht es Sandbox-Sitzungen, den Host-Browser explizit anzusteuern.
    - Optionale Allowlists steuern `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Nicht in der Sandbox ausgeführt:

- Der Gateway-Prozess selbst.
- Jedes Tool, das explizit außerhalb der Sandbox ausgeführt werden darf (z. B. `tools.elevated`).
  - **Elevated exec umgeht Sandboxing und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).**
  - Wenn Sandboxing deaktiviert ist, ändert `tools.elevated` die Ausführung nicht (bereits auf dem Host). Siehe [Elevated Mode](/de/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` steuert, **wann** Sandboxing verwendet wird:

<Tabs>
  <Tab title="off">
    Kein Sandboxing.
  </Tab>
  <Tab title="non-main">
    Nur **nicht-main**-Sitzungen in der Sandbox ausführen (Standard, wenn Sie normale Chats auf dem Host möchten).

    `"non-main"` basiert auf `session.mainKey` (Standard `"main"`), nicht auf der Agent-ID. Gruppen-/Kanalsitzungen verwenden eigene Schlüssel, zählen daher als nicht-main und werden in der Sandbox ausgeführt.

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

- `"docker"` (Standard, wenn Sandboxing aktiviert ist): lokale Docker-gestützte Sandbox-Laufzeit.
- `"ssh"`: generische SSH-gestützte Remote-Sandbox-Laufzeit.
- `"openshell"`: OpenShell-gestützte Sandbox-Laufzeit.

SSH-spezifische Konfiguration befindet sich unter `agents.defaults.sandbox.ssh`. OpenShell-spezifische Konfiguration befindet sich unter `plugins.entries.openshell.config`.

### Backend auswählen

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Ausführungsort**  | Lokaler Container                | Jeder per SSH erreichbare Host | Von OpenShell verwaltete Sandbox                    |
| **Einrichtung**     | `scripts/sandbox-setup.sh`       | SSH-Schlüssel + Ziel-Host      | OpenShell-Plugin aktiviert                          |
| **Workspace-Modell** | Bind-Mount oder Kopie            | Remote-kanonisch (einmaliges Seeding) | `mirror` oder `remote`                       |
| **Netzwerksteuerung** | `docker.network` (Standard: none) | Hängt vom Remote-Host ab      | Hängt von OpenShell ab                              |
| **Browser-Sandbox** | Unterstützt                      | Nicht unterstützt              | Noch nicht unterstützt                              |
| **Bind-Mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Am besten für**   | Lokale Entwicklung, vollständige Isolation | Auslagerung auf einen Remote-Rechner | Verwaltete Remote-Sandboxes mit optionaler Zwei-Wege-Synchronisierung |

### Docker-Backend

Sandboxing ist standardmäßig deaktiviert. Wenn Sie Sandboxing aktivieren und kein Backend auswählen, verwendet OpenClaw das Docker-Backend. Es führt Tools und Sandbox-Browser lokal über den Docker-Daemon-Socket (`/var/run/docker.sock`) aus. Die Isolation von Sandbox-Containern wird durch Docker-Namespaces bestimmt.

Um Host-GPUs für Docker-Sandboxes verfügbar zu machen, setzen Sie `agents.defaults.sandbox.docker.gpus` oder die agentenspezifische Überschreibung `agents.list[].sandbox.docker.gpus`. Der Wert wird als separates Argument an Dockers Flag `--gpus` übergeben, zum Beispiel `"all"` oder `"device=GPU-uuid"`, und erfordert eine kompatible Host-Laufzeit wie NVIDIA Container Toolkit.

<Warning>
**Docker-out-of-Docker (DooD)-Einschränkungen**

Wenn Sie den OpenClaw Gateway selbst als Docker-Container bereitstellen, orchestriert er Geschwister-Sandbox-Container über den Docker-Socket des Hosts (DooD). Dadurch entsteht eine spezifische Einschränkung bei der Pfadzuordnung:

- **Konfiguration erfordert Host-Pfade**: Die `workspace`-Konfiguration in `openclaw.json` MUSS den **absoluten Pfad des Hosts** enthalten (z. B. `/home/user/.openclaw/workspaces`), nicht den internen Pfad des Gateway-Containers. Wenn OpenClaw den Docker-Daemon auffordert, eine Sandbox zu starten, wertet der Daemon Pfade relativ zum Namespace des Host-Betriebssystems aus, nicht relativ zum Gateway-Namespace.
- **FS-Bridge-Parität (identische Volume-Zuordnung)**: Der native OpenClaw Gateway-Prozess schreibt auch Heartbeat- und Bridge-Dateien in das `workspace`-Verzeichnis. Da der Gateway dieselbe Zeichenkette (den Host-Pfad) innerhalb seiner eigenen containerisierten Umgebung auswertet, MUSS die Gateway-Bereitstellung eine identische Volume-Zuordnung enthalten, die den Host-Namespace nativ verknüpft (`-v /home/user/.openclaw:/home/user/.openclaw`).

Wenn Sie Pfade intern ohne absolute Host-Parität zuordnen, wirft OpenClaw nativ einen `EACCES`-Berechtigungsfehler beim Versuch, seinen Heartbeat innerhalb der Containerumgebung zu schreiben, weil die vollqualifizierte Pfadzeichenkette nativ nicht existiert.
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
    - OpenClaw erstellt unter `sandbox.ssh.workspaceRoot` ein Remote-Root pro Geltungsbereich.
    - Bei der ersten Verwendung nach Erstellung oder Neuerstellung befüllt OpenClaw diesen Remote-Workspace einmal aus dem lokalen Workspace.
    - Danach laufen `exec`, `read`, `write`, `edit`, `apply_patch`, Prompt-Medienlesevorgänge und eingehendes Media-Staging direkt über SSH gegen den Remote-Workspace.
    - OpenClaw synchronisiert Remote-Änderungen nicht automatisch zurück in den lokalen Workspace.

  </Accordion>
  <Accordion title="Authentifizierungsmaterial">
    - `identityFile`, `certificateFile`, `knownHostsFile`: vorhandene lokale Dateien verwenden und über die OpenSSH-Konfiguration weiterreichen.
    - `identityData`, `certificateData`, `knownHostsData`: Inline-Zeichenketten oder SecretRefs verwenden. OpenClaw löst sie über den normalen Secrets-Laufzeit-Snapshot auf, schreibt sie mit `0600` in temporäre Dateien und löscht sie, wenn die SSH-Sitzung endet.
    - Wenn sowohl `*File` als auch `*Data` für denselben Eintrag gesetzt sind, gewinnt `*Data` für diese SSH-Sitzung.

  </Accordion>
  <Accordion title="Folgen des remote-kanonischen Modells">
    Dies ist ein **remote-kanonisches** Modell. Der Remote-SSH-Workspace wird nach dem initialen Seeding zum tatsächlichen Sandbox-Zustand.

    - Host-lokale Änderungen, die nach dem Seeding-Schritt außerhalb von OpenClaw vorgenommen werden, sind remote erst sichtbar, wenn Sie die Sandbox neu erstellen.
    - `openclaw sandbox recreate` löscht das Remote-Root pro Geltungsbereich und befüllt es bei der nächsten Verwendung erneut aus dem lokalen Workspace.
    - Browser-Sandboxing wird im SSH-Backend nicht unterstützt.
    - `sandbox.docker.*`-Einstellungen gelten nicht für das SSH-Backend.

  </Accordion>
</AccordionGroup>

### OpenShell-Backend

Verwenden Sie `backend: "openshell"`, wenn OpenClaw Tools in einer von OpenShell verwalteten Remote-Umgebung in einer Sandbox ausführen soll. Den vollständigen Einrichtungsleitfaden, die Konfigurationsreferenz und den Vergleich der Workspace-Modi finden Sie auf der dedizierten [OpenShell-Seite](/de/gateway/openshell).

OpenShell verwendet denselben zentralen SSH-Transport und dieselbe Remote-Dateisystem-Bridge wie das generische SSH-Backend wieder und ergänzt OpenShell-spezifischen Lebenszyklus (`sandbox create/get/delete`, `sandbox ssh-config`) sowie den optionalen `mirror`-Workspace-Modus.

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

- `mirror` (Standard): Der lokale Workspace bleibt kanonisch. OpenClaw synchronisiert lokale Dateien vor `exec` nach OpenShell und synchronisiert den Remote-Workspace nach `exec` zurück.
- `remote`: Der OpenShell-Workspace ist kanonisch, nachdem die Sandbox erstellt wurde. OpenClaw befüllt den Remote-Workspace einmal aus dem lokalen Workspace; danach laufen Datei-Tools und `exec` direkt gegen die Remote-Sandbox, ohne Änderungen zurückzusynchronisieren.

<AccordionGroup>
  <Accordion title="Details zum Remote-Transport">
    - OpenClaw fragt OpenShell über `openshell sandbox ssh-config <name>` nach sandbox-spezifischer SSH-Konfiguration.
    - Core schreibt diese SSH-Konfiguration in eine temporäre Datei, öffnet die SSH-Sitzung und verwendet dieselbe Remote-Dateisystem-Bridge wieder, die von `backend: "ssh"` genutzt wird.
    - Im `mirror`-Modus unterscheidet sich nur der Lebenszyklus: vor `exec` lokal nach remote synchronisieren, danach nach `exec` zurücksynchronisieren.

  </Accordion>
  <Accordion title="Aktuelle OpenShell-Einschränkungen">
    - Sandbox-Browser wird noch nicht unterstützt
    - `sandbox.docker.binds` wird im OpenShell-Backend nicht unterstützt
    - Docker-spezifische Laufzeitoptionen unter `sandbox.docker.*` gelten weiterhin nur für das Docker-Backend

  </Accordion>
</AccordionGroup>

#### Workspace-Modi

OpenShell hat zwei Workspace-Modelle. Dies ist in der Praxis der wichtigste Teil.

<Tabs>
  <Tab title="mirror (lokal kanonisch)">
    Verwenden Sie `plugins.entries.openshell.config.mode: "mirror"`, wenn der **lokale Workspace kanonisch bleiben** soll.

    Verhalten:

    - Vor `exec` synchronisiert OpenClaw den lokalen Workspace in die OpenShell-Sandbox.
    - Nach `exec` synchronisiert OpenClaw den Remote-Workspace zurück in den lokalen Workspace.
    - Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace bleibt zwischen Durchläufen die Quelle der Wahrheit.

    Verwenden Sie dies, wenn:

    - Sie bearbeiten Dateien lokal außerhalb von OpenClaw und möchten, dass diese Änderungen automatisch in der Sandbox erscheinen
    - Sie möchten, dass sich die OpenShell-Sandbox so weit wie möglich wie das Docker-Backend verhält
    - Sie möchten, dass der Host-Arbeitsbereich nach jeder exec-Runde Schreibvorgänge aus der Sandbox widerspiegelt

    Nachteil: zusätzlicher Synchronisierungsaufwand vor und nach exec.

  </Tab>
  <Tab title="remote (OpenShell kanonisch)">
    Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn der **OpenShell-Arbeitsbereich kanonisch werden** soll.

    Verhalten:

    - Wenn die Sandbox erstmals erstellt wird, befüllt OpenClaw den Remote-Arbeitsbereich einmal aus dem lokalen Arbeitsbereich.
    - Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch` direkt gegen den Remote-OpenShell-Arbeitsbereich.
    - OpenClaw synchronisiert Remote-Änderungen nach exec **nicht** zurück in den lokalen Arbeitsbereich.
    - Medienlesevorgänge zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Medientools über die Sandbox-Bridge lesen, statt einen lokalen Host-Pfad vorauszusetzen.
    - Der Transport erfolgt per SSH in die OpenShell-Sandbox, die von `openshell sandbox ssh-config` zurückgegeben wird.

    Wichtige Folgen:

    - Wenn Sie nach dem Befüllungsschritt Dateien auf dem Host außerhalb von OpenClaw bearbeiten, sieht die Remote-Sandbox diese Änderungen **nicht** automatisch.
    - Wenn die Sandbox neu erstellt wird, wird der Remote-Arbeitsbereich erneut aus dem lokalen Arbeitsbereich befüllt.
    - Mit `scope: "agent"` oder `scope: "shared"` wird dieser Remote-Arbeitsbereich in demselben Scope geteilt.

    Verwenden Sie dies, wenn:

    - die Sandbox hauptsächlich auf der Remote-OpenShell-Seite leben soll
    - Sie geringeren Synchronisierungsaufwand pro Runde möchten
    - Sie nicht möchten, dass host-lokale Änderungen den Remote-Sandbox-Zustand unbemerkt überschreiben

  </Tab>
</Tabs>

Wählen Sie `mirror`, wenn Sie die Sandbox als temporäre Ausführungsumgebung betrachten. Wählen Sie `remote`, wenn Sie die Sandbox als den eigentlichen Arbeitsbereich betrachten.

#### OpenShell-Lebenszyklus

OpenShell-Sandboxes werden weiterhin über den normalen Sandbox-Lebenszyklus verwaltet:

- `openclaw sandbox list` zeigt OpenShell-Laufzeiten ebenso wie Docker-Laufzeiten an
- `openclaw sandbox recreate` löscht die aktuelle Laufzeit und lässt OpenClaw sie bei der nächsten Verwendung neu erstellen
- die Bereinigungslogik ist ebenfalls backend-bewusst

Für den `remote`-Modus ist das Neuerstellen besonders wichtig:

- Neuerstellen löscht den kanonischen Remote-Arbeitsbereich für diesen Scope
- die nächste Verwendung befüllt einen frischen Remote-Arbeitsbereich aus dem lokalen Arbeitsbereich

Für den `mirror`-Modus setzt Neuerstellen hauptsächlich die Remote-Ausführungsumgebung zurück, weil der lokale Arbeitsbereich ohnehin kanonisch bleibt.

## Arbeitsbereichszugriff

`agents.defaults.sandbox.workspaceAccess` steuert, **was die Sandbox sehen kann**:

<Tabs>
  <Tab title="none (Standard)">
    Tools sehen einen Sandbox-Arbeitsbereich unter `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Mountet den Agent-Arbeitsbereich schreibgeschützt unter `/agent` (deaktiviert `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Mountet den Agent-Arbeitsbereich mit Lese-/Schreibzugriff unter `/workspace`.
  </Tab>
</Tabs>

Mit dem OpenShell-Backend:

- der `mirror`-Modus verwendet weiterhin den lokalen Arbeitsbereich als kanonische Quelle zwischen exec-Runden
- der `remote`-Modus verwendet nach der anfänglichen Befüllung den Remote-OpenShell-Arbeitsbereich als kanonische Quelle
- `workspaceAccess: "ro"` und `"none"` schränken das Schreibverhalten weiterhin auf dieselbe Weise ein

Eingehende Medien werden in den aktiven Sandbox-Arbeitsbereich kopiert (`media/inbound/*`).

<Note>
**Skills-Hinweis:** Das `read`-Tool ist an die Sandbox-Wurzel gebunden. Mit `workspaceAccess: "none"` spiegelt OpenClaw geeignete Skills in den Sandbox-Arbeitsbereich (`.../skills`), damit sie gelesen werden können. Mit `"rw"` sind Arbeitsbereichs-Skills aus `/workspace/skills` lesbar.
</Note>

## Benutzerdefinierte Bind-Mounts

`agents.defaults.sandbox.docker.binds` mountet zusätzliche Host-Verzeichnisse in den Container. Format: `host:container:mode` (z. B. `"/home/user/source:/source:rw"`).

Globale und agentenspezifische Binds werden **zusammengeführt** (nicht ersetzt). Unter `scope: "shared"` werden agentenspezifische Binds ignoriert.

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
- OpenClaw blockiert gefährliche Bind-Quellen (zum Beispiel: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` und übergeordnete Mounts, die diese offenlegen würden).
- OpenClaw blockiert außerdem gängige Zugangsdaten-Wurzeln im Home-Verzeichnis wie `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` und `~/.ssh`.
- Bind-Validierung ist nicht nur String-Abgleich. OpenClaw normalisiert den Quellpfad und löst ihn dann erneut über den tiefsten vorhandenen Vorfahren auf, bevor blockierte Pfade und erlaubte Wurzeln erneut geprüft werden.
- Das bedeutet, dass Ausbrüche über Symlink-Eltern weiterhin geschlossen fehlschlagen, selbst wenn das finale Blatt noch nicht existiert. Beispiel: `/workspace/run-link/new-file` wird weiterhin als `/var/run/...` aufgelöst, wenn `run-link` dorthin zeigt.
- Erlaubte Quellwurzeln werden auf dieselbe Weise kanonisiert, sodass ein Pfad, der nur vor der Symlink-Auflösung innerhalb der Allowlist zu liegen scheint, weiterhin als `outside allowed roots` abgelehnt wird.
- Sensible Mounts (Geheimnisse, SSH-Schlüssel, Dienst-Zugangsdaten) sollten `:ro` sein, sofern nicht unbedingt erforderlich.
- Kombinieren Sie dies mit `workspaceAccess: "ro"`, wenn Sie nur Lesezugriff auf den Arbeitsbereich benötigen; Bind-Modi bleiben unabhängig.
- Siehe [Sandbox vs. Tool-Richtlinie vs. Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated), um zu erfahren, wie Binds mit Tool-Richtlinien und Elevated exec interagieren.

</Warning>

## Images und Einrichtung

Standard-Docker-Image: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Standard-Image bauen">
    ```bash
    scripts/sandbox-setup.sh
    ```

    Das Standard-Image enthält **kein** Node. Wenn ein Skill Node (oder andere Laufzeiten) benötigt, backen Sie entweder ein benutzerdefiniertes Image oder installieren Sie über `sandbox.docker.setupCommand` (erfordert Netzwerk-Egress + beschreibbare Root + Root-Benutzer).

    OpenClaw ersetzt `openclaw-sandbox:bookworm-slim` nicht stillschweigend durch einfaches `debian:bookworm-slim`, wenn es fehlt. Sandbox-Ausführungen, die auf das Standard-Image zielen, schlagen schnell mit einer Build-Anweisung fehl, bis Sie `scripts/sandbox-setup.sh` ausführen, weil das gebündelte Image `python3` für Sandbox-Write/Edit-Helfer enthält.

  </Step>
  <Step title="Optional: Common-Image bauen">
    Für ein funktionaleres Sandbox-Image mit gängigen Tools (zum Beispiel `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Setzen Sie dann `agents.defaults.sandbox.docker.image` auf `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: Sandbox-Browser-Image bauen">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Standardmäßig laufen Docker-Sandbox-Container mit **keinem Netzwerk**. Überschreiben Sie dies mit `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Chromium-Standards des Sandbox-Browsers">
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
    - Die drei Grafik-Härtungsflags (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sind optional und nützlich, wenn Container keine GPU-Unterstützung haben. Setzen Sie `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, wenn Ihr Workload WebGL oder andere 3D-/Browser-Funktionen benötigt.
    - `--disable-extensions` ist standardmäßig aktiviert und kann mit `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` für erweiterungsabhängige Abläufe deaktiviert werden.
    - `--renderer-process-limit=2` wird durch `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` gesteuert, wobei `0` Chromiums Standard beibehält.

    Wenn Sie ein anderes Laufzeitprofil benötigen, verwenden Sie ein benutzerdefiniertes Browser-Image und stellen Sie Ihren eigenen Entry Point bereit. Für lokale (nicht containerisierte) Chromium-Profile verwenden Sie `browser.extraArgs`, um zusätzliche Startflags anzuhängen.

  </Accordion>
  <Accordion title="Netzwerksicherheitsstandards">
    - `network: "host"` wird blockiert.
    - `network: "container:<id>"` wird standardmäßig blockiert (Risiko der Umgehung durch Namespace-Beitritt).
    - Break-glass-Override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker-Installationen und der containerisierte Gateway befinden sich hier: [Docker](/de/install/docker)

Für Docker-Gateway-Bereitstellungen kann `scripts/docker/setup.sh` die Sandbox-Konfiguration bootstrapen. Setzen Sie `OPENCLAW_SANDBOX=1` (oder `true`/`yes`/`on`), um diesen Pfad zu aktivieren. Sie können den Socket-Speicherort mit `OPENCLAW_DOCKER_SOCKET` überschreiben. Vollständige Einrichtungs- und Umgebungsreferenz: [Docker](/de/install/docker#agent-sandbox).

## setupCommand (einmalige Container-Einrichtung)

`setupCommand` läuft **einmal**, nachdem der Sandbox-Container erstellt wurde (nicht bei jeder Ausführung). Es wird im Container über `sh -lc` ausgeführt.

Pfade:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Pro Agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Häufige Stolperfallen">
    - Das Standard-`docker.network` ist `"none"` (kein Egress), daher schlagen Paketinstallationen fehl.
    - `docker.network: "container:<id>"` erfordert `dangerouslyAllowContainerNamespaceJoin: true` und ist nur für Break-glass gedacht.
    - `readOnlyRoot: true` verhindert Schreibvorgänge; setzen Sie `readOnlyRoot: false` oder backen Sie ein benutzerdefiniertes Image.
    - `user` muss für Paketinstallationen Root sein (lassen Sie `user` weg oder setzen Sie `user: "0:0"`).
    - Sandbox-exec erbt `process.env` des Hosts **nicht**. Verwenden Sie `agents.defaults.sandbox.docker.env` (oder ein benutzerdefiniertes Image) für Skill-API-Schlüssel.

  </Accordion>
</AccordionGroup>

## Tool-Richtlinie und Ausweichpfade

Tool-Allow/Deny-Richtlinien gelten weiterhin vor Sandbox-Regeln. Wenn ein Tool global oder pro Agent verweigert wird, bringt Sandboxing es nicht zurück.

`tools.elevated` ist ein expliziter Ausweichpfad, der `exec` außerhalb der Sandbox ausführt (`gateway` standardmäßig oder `node`, wenn das exec-Ziel `node` ist). `/exec`-Direktiven gelten nur für autorisierte Absender und bleiben pro Sitzung bestehen; um `exec` hart zu deaktivieren, verwenden Sie eine Tool-Richtlinienverweigerung (siehe [Sandbox vs. Tool-Richtlinie vs. Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Verwenden Sie `openclaw sandbox explain`, um den effektiven Sandbox-Modus, die Tool-Richtlinie und Fix-it-Konfigurationsschlüssel zu prüfen.
- Siehe [Sandbox vs. Tool-Richtlinie vs. Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) für das Denkmodell zu „Warum ist das blockiert?“.

Halten Sie es abgeschottet.

## Multi-Agent-Overrides

Jeder Agent kann Sandbox + Tools überschreiben: `agents.list[].sandbox` und `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` für die Sandbox-Tool-Richtlinie). Siehe [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) für die Vorrangregeln.

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

- [Multi-Agent-Sandbox und Werkzeuge](/de/tools/multi-agent-sandbox-tools) — agentenspezifische Überschreibungen und Vorrangregeln
- [OpenShell](/de/gateway/openshell) — Einrichtung des verwalteten Sandbox-Backends, Workspace-Modi und Konfigurationsreferenz
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs. Tool-Richtlinie vs. erhöhte Rechte](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — Debugging: „Warum ist das blockiert?“
- [Sicherheit](/de/gateway/security)
