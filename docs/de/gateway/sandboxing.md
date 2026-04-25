---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Wie OpenClaw-Sandboxing funktioniert: Modi, Geltungsbereiche, Workspace-Zugriff und Images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-25T13:48:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f22778690a4d41033c7abf9e97d54e53163418f8d45f1a816ce2be9d124fedf
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw kann **Tools innerhalb von Sandbox-Backends** ausführen, um den Blast Radius zu verringern.
Dies ist **optional** und wird über die Konfiguration gesteuert (`agents.defaults.sandbox` oder
`agents.list[].sandbox`). Wenn Sandboxing deaktiviert ist, laufen Tools auf dem Host.
Das Gateway bleibt auf dem Host; die Tool-Ausführung läuft in einer isolierten Sandbox,
wenn dies aktiviert ist.

Dies ist keine perfekte Sicherheitsgrenze, begrenzt aber den Zugriff auf Dateisystem
und Prozesse erheblich, wenn das Modell etwas Dummes tut.

## Was in die Sandbox kommt

- Tool-Ausführung (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` usw.).
- Optionale sandboxed Browser (`agents.defaults.sandbox.browser`).
  - Standardmäßig startet der Sandbox-Browser automatisch (stellt sicher, dass CDP erreichbar ist), wenn das Browser-Tool ihn benötigt.
    Konfiguration über `agents.defaults.sandbox.browser.autoStart` und `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Standardmäßig verwenden Container des Sandbox-Browsers ein dediziertes Docker-Netzwerk (`openclaw-sandbox-browser`) statt des globalen `bridge`-Netzwerks.
    Konfiguration mit `agents.defaults.sandbox.browser.network`.
  - Optional beschränkt `agents.defaults.sandbox.browser.cdpSourceRange` den CDP-Ingress an der Containergrenze mit einer CIDR-Allowlist (zum Beispiel `172.21.0.1/32`).
  - Der noVNC-Beobachterzugriff ist standardmäßig passwortgeschützt; OpenClaw gibt eine kurzlebige Token-URL aus, die eine lokale Bootstrap-Seite bereitstellt und noVNC mit Passwort im URL-Fragment öffnet (nicht in Query-/Header-Logs).
  - `agents.defaults.sandbox.browser.allowHostControl` erlaubt es sandboxed Sitzungen, ausdrücklich den Host-Browser anzusprechen.
  - Optionale Allowlists begrenzen `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Nicht sandboxed:

- Der Gateway-Prozess selbst.
- Jedes Tool, das ausdrücklich außerhalb der Sandbox ausgeführt werden darf (z. B. `tools.elevated`).
  - **Elevated exec umgeht Sandboxing und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).**
  - Wenn Sandboxing deaktiviert ist, ändert `tools.elevated` die Ausführung nicht (läuft bereits auf dem Host). Siehe [Elevated Mode](/de/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` steuert, **wann** Sandboxing verwendet wird:

- `"off"`: kein Sandboxing.
- `"non-main"`: nur **Nicht-Hauptsitzungen** werden sandboxed (Standard, wenn normale Chats auf dem Host laufen sollen).
- `"all"`: jede Sitzung läuft in einer Sandbox.
  Hinweis: `"non-main"` basiert auf `session.mainKey` (Standard `"main"`), nicht auf der Agenten-ID.
  Gruppen-/Kanalsitzungen verwenden eigene Schlüssel, zählen also als nicht-main und werden sandboxed.

## Geltungsbereich

`agents.defaults.sandbox.scope` steuert, **wie viele Container** erstellt werden:

- `"agent"` (Standard): ein Container pro Agent.
- `"session"`: ein Container pro Sitzung.
- `"shared"`: ein Container, der von allen sandboxed Sitzungen gemeinsam genutzt wird.

## Backend

`agents.defaults.sandbox.backend` steuert, **welche Laufzeit** die Sandbox bereitstellt:

- `"docker"` (Standard, wenn Sandboxing aktiviert ist): lokale Docker-gestützte Sandbox-Laufzeit.
- `"ssh"`: generische SSH-gestützte entfernte Sandbox-Laufzeit.
- `"openshell"`: OpenShell-gestützte Sandbox-Laufzeit.

SSH-spezifische Konfiguration befindet sich unter `agents.defaults.sandbox.ssh`.
OpenShell-spezifische Konfiguration befindet sich unter `plugins.entries.openshell.config`.

### Ein Backend auswählen

|                     | Docker                           | SSH                            | OpenShell                                              |
| ------------------- | -------------------------------- | ------------------------------ | ------------------------------------------------------ |
| **Wo es läuft**     | Lokaler Container                | Jeder per SSH erreichbare Host | Von OpenShell verwaltete Sandbox                       |
| **Einrichtung**     | `scripts/sandbox-setup.sh`       | SSH-Schlüssel + Zielhost       | OpenShell-Plugin aktiviert                             |
| **Workspace-Modell**| Bind-Mount oder Kopie            | Remote-kanonisch (einmal seed) | `mirror` oder `remote`                                 |
| **Netzwerksteuerung** | `docker.network` (Standard: none) | Hängt vom Remote-Host ab     | Hängt von OpenShell ab                                 |
| **Browser-Sandbox** | Unterstützt                      | Nicht unterstützt              | Noch nicht unterstützt                                 |
| **Bind-Mounts**     | `docker.binds`                   | N/A                            | N/A                                                    |
| **Am besten für**   | Lokale Entwicklung, volle Isolation | Auslagerung auf entfernte Maschine | Verwaltete Remote-Sandboxes mit optionaler Zwei-Wege-Synchronisierung |

### Docker-Backend

Sandboxing ist standardmäßig deaktiviert. Wenn Sie Sandboxing aktivieren und kein
Backend auswählen, verwendet OpenClaw das Docker-Backend. Es führt Tools und Sandbox-Browser
lokal über den Docker-Daemon-Socket (`/var/run/docker.sock`) aus. Die Isolation des Sandbox-Containers
wird durch Docker-Namespaces bestimmt.

**Docker-out-of-Docker-(DooD)-Beschränkungen**:
Wenn Sie das OpenClaw-Gateway selbst als Docker-Container bereitstellen, orchestriert es Geschwister-Sandbox-Container über den Docker-Socket des Hosts (DooD). Das führt zu einer spezifischen Einschränkung bei der Pfadzuordnung:

- **Konfiguration erfordert Host-Pfade**: Die `workspace`-Konfiguration in `openclaw.json` MUSS den **absoluten Pfad des Hosts** enthalten (z. B. `/home/user/.openclaw/workspaces`), nicht den internen Pfad des Gateway-Containers. Wenn OpenClaw den Docker-Daemon anweist, eine Sandbox zu starten, wertet der Daemon Pfade relativ zum Namespace des Host-Betriebssystems aus, nicht zum Gateway-Namespace.
- **FS-Bridge-Parität (identische Volume-Zuordnung)**: Der native OpenClaw-Gateway-Prozess schreibt außerdem Heartbeat- und Bridge-Dateien in das `workspace`-Verzeichnis. Da das Gateway dieselbe Zeichenfolge (den Host-Pfad) innerhalb seiner eigenen containerisierten Umgebung auswertet, MUSS die Gateway-Bereitstellung eine identische Volume-Zuordnung enthalten, die den Host-Namespace nativ verknüpft (`-v /home/user/.openclaw:/home/user/.openclaw`).

Wenn Sie Pfade intern zuordnen, ohne absolute Host-Parität, wirft OpenClaw nativ einen `EACCES`-Berechtigungsfehler, wenn es versucht, seinen Heartbeat innerhalb der Container-Umgebung zu schreiben, weil die vollständig qualifizierte Pfadzeichenfolge dort nativ nicht existiert.

### SSH-Backend

Verwenden Sie `backend: "ssh"`, wenn OpenClaw `exec`, Datei-Tools und Medienlesevorgänge auf
einer beliebigen per SSH erreichbaren Maschine sandboxen soll.

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

So funktioniert es:

- OpenClaw erstellt unter `sandbox.ssh.workspaceRoot` ein entferntes Root pro Geltungsbereich.
- Bei der ersten Verwendung nach Erstellung oder Neuerstellung seedet OpenClaw diesen entfernten Workspace einmal aus dem lokalen Workspace.
- Danach laufen `exec`, `read`, `write`, `edit`, `apply_patch`, Prompt-Medienlesevorgänge und eingehendes Medien-Staging direkt gegen den entfernten Workspace über SSH.
- OpenClaw synchronisiert entfernte Änderungen nicht automatisch zurück in den lokalen Workspace.

Authentifizierungsmaterial:

- `identityFile`, `certificateFile`, `knownHostsFile`: vorhandene lokale Dateien verwenden und über die OpenSSH-Konfiguration durchreichen.
- `identityData`, `certificateData`, `knownHostsData`: Inline-Strings oder SecretRefs verwenden. OpenClaw löst sie über den normalen Secrets-Laufzeit-Snapshot auf, schreibt sie mit `0600` in temporäre Dateien und löscht sie, wenn die SSH-Sitzung endet.
- Wenn für dasselbe Element sowohl `*File` als auch `*Data` gesetzt sind, hat `*Data` für diese SSH-Sitzung Vorrang.

Dies ist ein **remote-kanonisches** Modell. Der entfernte SSH-Workspace wird nach dem initialen Seed zum echten Sandbox-Zustand.

Wichtige Folgen:

- Host-lokale Änderungen, die außerhalb von OpenClaw nach dem Seed-Schritt vorgenommen werden, sind remote nicht sichtbar, bis Sie die Sandbox neu erstellen.
- `openclaw sandbox recreate` löscht das entfernte Root pro Geltungsbereich und seedet beim nächsten Gebrauch erneut aus dem Lokalen.
- Browser-Sandboxing wird im SSH-Backend nicht unterstützt.
- Einstellungen unter `sandbox.docker.*` gelten nicht für das SSH-Backend.

### OpenShell-Backend

Verwenden Sie `backend: "openshell"`, wenn OpenClaw Tools in einer
von OpenShell verwalteten Remote-Umgebung sandboxen soll. Den vollständigen Einrichtungsleitfaden, die Konfigurations-
referenz und den Vergleich der Workspace-Modi finden Sie auf der dedizierten
[OpenShell-Seite](/de/gateway/openshell).

OpenShell verwendet denselben SSH-Kerntransport und dieselbe entfernte Dateisystem-Bridge wie das
generische SSH-Backend wieder und ergänzt OpenShell-spezifische Lebenszyklusoperationen
(`sandbox create/get/delete`, `sandbox ssh-config`) sowie optional den Workspace-Modus `mirror`.

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

- `mirror` (Standard): der lokale Workspace bleibt kanonisch. OpenClaw synchronisiert lokale Dateien vor `exec` in OpenShell und synchronisiert den entfernten Workspace nach `exec` zurück.
- `remote`: Der OpenShell-Workspace ist kanonisch, nachdem die Sandbox erstellt wurde. OpenClaw seedet den entfernten Workspace einmal aus dem lokalen Workspace, dann laufen Datei-Tools und `exec` direkt gegen die entfernte Sandbox, ohne Änderungen zurückzusynchronisieren.

Details zum Remote-Transport:

- OpenClaw fragt OpenShell über `openshell sandbox ssh-config <name>` nach einer sandboxspezifischen SSH-Konfiguration.
- Der Core schreibt diese SSH-Konfiguration in eine temporäre Datei, öffnet die SSH-Sitzung und verwendet dieselbe entfernte Dateisystem-Bridge wieder, die auch von `backend: "ssh"` verwendet wird.
- Nur im Modus `mirror` unterscheidet sich der Lebenszyklus: lokale Dateien vor `exec` nach remote synchronisieren, danach zurücksynchronisieren.

Aktuelle Einschränkungen von OpenShell:

- Sandbox-Browser wird noch nicht unterstützt
- `sandbox.docker.binds` wird im OpenShell-Backend nicht unterstützt
- Docker-spezifische Laufzeitoptionen unter `sandbox.docker.*` gelten weiterhin nur für das Docker-Backend

#### Workspace-Modi

OpenShell hat zwei Workspace-Modelle. Dieser Teil ist in der Praxis am wichtigsten.

##### `mirror`

Verwenden Sie `plugins.entries.openshell.config.mode: "mirror"`, wenn der **lokale Workspace kanonisch bleiben** soll.

Verhalten:

- Vor `exec` synchronisiert OpenClaw den lokalen Workspace in die OpenShell-Sandbox.
- Nach `exec` synchronisiert OpenClaw den entfernten Workspace zurück in den lokalen Workspace.
- Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace bleibt zwischen den Turns die Quelle der Wahrheit.

Verwenden Sie dies, wenn:

- Sie Dateien lokal außerhalb von OpenClaw bearbeiten und möchten, dass diese Änderungen automatisch in der Sandbox erscheinen
- die OpenShell-Sandbox sich möglichst ähnlich wie das Docker-Backend verhalten soll
- der Host-Workspace Sandbox-Schreibvorgänge nach jedem Exec-Turn widerspiegeln soll

Abwägung:

- zusätzlicher Synchronisierungsaufwand vor und nach `exec`

##### `remote`

Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn der **OpenShell-Workspace kanonisch werden** soll.

Verhalten:

- Wenn die Sandbox erstmals erstellt wird, seedet OpenClaw den entfernten Workspace einmal aus dem lokalen Workspace.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch` direkt gegen den entfernten OpenShell-Workspace.
- OpenClaw synchronisiert entfernte Änderungen nach `exec` **nicht** zurück in den lokalen Workspace.
- Medienlesevorgänge zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Medien-Tools über die Sandbox-Bridge lesen, statt einen lokalen Host-Pfad vorauszusetzen.
- Der Transport erfolgt per SSH in die OpenShell-Sandbox, die von `openshell sandbox ssh-config` zurückgegeben wird.

Wichtige Folgen:

- Wenn Sie Dateien nach dem Seed-Schritt außerhalb von OpenClaw auf dem Host bearbeiten, sieht die entfernte Sandbox diese Änderungen **nicht** automatisch.
- Wenn die Sandbox neu erstellt wird, wird der entfernte Workspace erneut aus dem lokalen Workspace geseedet.
- Bei `scope: "agent"` oder `scope: "shared"` wird dieser entfernte Workspace auf derselben Ebene gemeinsam genutzt.

Verwenden Sie dies, wenn:

- die Sandbox hauptsächlich auf der entfernten OpenShell-Seite leben soll
- Sie geringeren Synchronisierungsaufwand pro Turn möchten
- host-lokale Änderungen den entfernten Sandbox-Zustand nicht stillschweigend überschreiben sollen

Wählen Sie `mirror`, wenn Sie die Sandbox als temporäre Ausführungsumgebung betrachten.
Wählen Sie `remote`, wenn Sie die Sandbox als den echten Workspace betrachten.

#### OpenShell-Lebenszyklus

OpenShell-Sandboxes werden weiterhin über den normalen Sandbox-Lebenszyklus verwaltet:

- `openclaw sandbox list` zeigt OpenShell-Laufzeiten ebenso wie Docker-Laufzeiten
- `openclaw sandbox recreate` löscht die aktuelle Laufzeit und lässt OpenClaw sie bei der nächsten Verwendung neu erstellen
- Die Prune-Logik ist ebenfalls backendbewusst

Für den Modus `remote` ist `recreate` besonders wichtig:

- `recreate` löscht den kanonischen entfernten Workspace für diesen Geltungsbereich
- die nächste Verwendung seedet einen frischen entfernten Workspace aus dem lokalen Workspace

Für den Modus `mirror` setzt `recreate` hauptsächlich die entfernte Ausführungsumgebung zurück,
weil der lokale Workspace ohnehin kanonisch bleibt.

## Workspace-Zugriff

`agents.defaults.sandbox.workspaceAccess` steuert, **was die Sandbox sehen kann**:

- `"none"` (Standard): Tools sehen einen Sandbox-Workspace unter `~/.openclaw/sandboxes`.
- `"ro"`: mountet den Agenten-Workspace schreibgeschützt unter `/agent` (deaktiviert `write`/`edit`/`apply_patch`).
- `"rw"`: mountet den Agenten-Workspace mit Lese-/Schreibzugriff unter `/workspace`.

Mit dem OpenShell-Backend:

- Im Modus `mirror` bleibt der lokale Workspace zwischen `exec`-Turns die kanonische Quelle
- Im Modus `remote` wird der entfernte OpenShell-Workspace nach dem initialen Seed zur kanonischen Quelle
- `workspaceAccess: "ro"` und `"none"` beschränken das Schreibverhalten weiterhin auf dieselbe Weise

Eingehende Medien werden in den aktiven Sandbox-Workspace kopiert (`media/inbound/*`).
Hinweis zu Skills: Das Tool `read` ist auf den Sandbox-Root beschränkt. Bei `workspaceAccess: "none"`
spiegelt OpenClaw geeignete Skills in den Sandbox-Workspace (`.../skills`), damit
sie gelesen werden können. Bei `"rw"` sind Workspace-Skills unter
`/workspace/skills` lesbar.

## Benutzerdefinierte Bind-Mounts

`agents.defaults.sandbox.docker.binds` mountet zusätzliche Host-Verzeichnisse in den Container.
Format: `host:container:mode` (z. B. `"/home/user/source:/source:rw"`).

Globale und agentenspezifische Mounts werden **zusammengeführt** (nicht ersetzt). Unter `scope: "shared"` werden agentenspezifische Mounts ignoriert.

`agents.defaults.sandbox.browser.binds` mountet zusätzliche Host-Verzeichnisse nur in den **Sandbox-Browser**-Container.

- Wenn gesetzt (einschließlich `[]`), ersetzt es `agents.defaults.sandbox.docker.binds` für den Browser-Container.
- Wenn weggelassen, greift der Browser-Container auf `agents.defaults.sandbox.docker.binds` zurück (abwärtskompatibel).

Beispiel (schreibgeschützter Quellcode + ein zusätzliches Datenverzeichnis):

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

Sicherheitshinweise:

- Bind-Mounts umgehen das Sandbox-Dateisystem: Sie legen Host-Pfade mit genau dem Modus offen, den Sie setzen (`:ro` oder `:rw`).
- OpenClaw blockiert gefährliche Bind-Quellen (zum Beispiel: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` und übergeordnete Mounts, die diese offenlegen würden).
- OpenClaw blockiert außerdem häufige Wurzeln für Zugangsdaten im Home-Verzeichnis wie `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` und `~/.ssh`.
- Die Validierung von Bind-Mounts ist nicht nur String-Matching. OpenClaw normalisiert den Quellpfad und löst ihn dann erneut über den tiefsten existierenden Vorfahren auf, bevor blockierte Pfade und erlaubte Wurzeln erneut geprüft werden.
- Das bedeutet, dass Escapes über Symlink-Eltern weiterhin fail-closed behandelt werden, selbst wenn das endgültige Blatt noch nicht existiert. Beispiel: `/workspace/run-link/new-file` wird weiterhin als `/var/run/...` aufgelöst, wenn `run-link` dorthin zeigt.
- Erlaubte Quellwurzeln werden auf dieselbe Weise kanonisiert, sodass ein Pfad, der vor der Symlink-Auflösung nur so aussieht, als läge er innerhalb der Allowlist, dennoch als `outside allowed roots` abgelehnt wird.
- Sensible Mounts (Geheimnisse, SSH-Schlüssel, Service-Zugangsdaten) sollten `:ro` sein, sofern nicht absolut erforderlich.
- Kombinieren Sie dies mit `workspaceAccess: "ro"`, wenn Sie nur Lesezugriff auf den Workspace benötigen; Bind-Modi bleiben unabhängig.
- Siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated), um zu verstehen, wie Bind-Mounts mit Tool-Richtlinien und elevated exec zusammenspielen.

## Images + Einrichtung

Standard-Docker-Image: `openclaw-sandbox:bookworm-slim`

Einmal bauen:

```bash
scripts/sandbox-setup.sh
```

Hinweis: Das Standard-Image enthält **kein** Node. Wenn ein Skill Node (oder
andere Laufzeiten) benötigt, backen Sie entweder ein benutzerdefiniertes Image oder installieren Sie es über
`sandbox.docker.setupCommand` (erfordert ausgehendes Netzwerk + beschreibbaren Root +
Root-Benutzer).

Wenn Sie ein funktionsreicheres Sandbox-Image mit gängigen Tools möchten (zum Beispiel
`curl`, `jq`, `nodejs`, `python3`, `git`), bauen Sie:

```bash
scripts/sandbox-common-setup.sh
```

Setzen Sie dann `agents.defaults.sandbox.docker.image` auf
`openclaw-sandbox-common:bookworm-slim`.

Sandboxed Browser-Image:

```bash
scripts/sandbox-browser-setup.sh
```

Standardmäßig laufen Docker-Sandbox-Container **ohne Netzwerk**.
Überschreiben Sie dies mit `agents.defaults.sandbox.docker.network`.

Das gebündelte Sandbox-Browser-Image verwendet außerdem konservative Chromium-Startstandardwerte
für containerisierte Workloads. Aktuelle Container-Standards umfassen:

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
- Die drei Grafik-Härtungs-Flags (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) sind optional und nützlich,
  wenn Container keine GPU-Unterstützung haben. Setzen Sie `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  wenn Ihr Workload WebGL oder andere 3D-/Browser-Funktionen benötigt.
- `--disable-extensions` ist standardmäßig aktiviert und kann mit
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` für abhängige Erweiterungs-Workflows deaktiviert werden.
- `--renderer-process-limit=2` wird gesteuert durch
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, wobei `0` den Standard von Chromium beibehält.

Wenn Sie ein anderes Laufzeitprofil benötigen, verwenden Sie ein benutzerdefiniertes Browser-Image und stellen
Sie Ihren eigenen Entrypoint bereit. Für lokale Chromium-Profile (nicht containerisiert) verwenden Sie
`browser.extraArgs`, um zusätzliche Start-Flags anzuhängen.

Sicherheitsstandards:

- `network: "host"` ist blockiert.
- `network: "container:<id>"` ist standardmäßig blockiert (Namespace-Join-Bypass-Risiko).
- Break-Glass-Override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Docker-Installationen und das containerisierte Gateway finden Sie hier:
[Docker](/de/install/docker)

Für Docker-Gateway-Bereitstellungen kann `scripts/docker/setup.sh` die Sandbox-Konfiguration bootstrappen.
Setzen Sie `OPENCLAW_SANDBOX=1` (oder `true`/`yes`/`on`), um diesen Pfad zu aktivieren. Sie können
den Socket-Pfad mit `OPENCLAW_DOCKER_SOCKET` überschreiben. Vollständige Einrichtung und Env-
Referenz: [Docker](/de/install/docker#agent-sandbox).

## setupCommand (einmalige Container-Einrichtung)

`setupCommand` läuft **einmal** nach dem Erstellen des Sandbox-Containers (nicht bei jedem Lauf).
Es wird innerhalb des Containers über `sh -lc` ausgeführt.

Pfade:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Pro Agent: `agents.list[].sandbox.docker.setupCommand`

Häufige Stolperfallen:

- Standardmäßig ist `docker.network` `"none"` (kein Egress), daher schlagen Paketinstallationen fehl.
- `docker.network: "container:<id>"` erfordert `dangerouslyAllowContainerNamespaceJoin: true` und ist nur als Break-Glass gedacht.
- `readOnlyRoot: true` verhindert Schreibvorgänge; setzen Sie `readOnlyRoot: false` oder backen Sie ein benutzerdefiniertes Image.
- `user` muss für Paketinstallationen root sein (lassen Sie `user` weg oder setzen Sie `user: "0:0"`).
- Sandbox-`exec` übernimmt **nicht** `process.env` vom Host. Verwenden Sie
  `agents.defaults.sandbox.docker.env` (oder ein benutzerdefiniertes Image) für API-Schlüssel von Skills.

## Tool-Richtlinie + Escape Hatches

Tool-Allow-/Deny-Richtlinien gelten weiterhin vor den Sandbox-Regeln. Wenn ein Tool global
oder pro Agent abgelehnt wird, bringt Sandboxing es nicht zurück.

`tools.elevated` ist ein expliziter Escape Hatch, der `exec` außerhalb der Sandbox ausführt (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).
`/exec`-Direktiven gelten nur für autorisierte Absender und bleiben pro Sitzung erhalten; um
`exec` hart zu deaktivieren, verwenden Sie die Tool-Richtlinie deny (siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Verwenden Sie `openclaw sandbox explain`, um den effektiven Sandbox-Modus, die Tool-Richtlinie und Konfigurationsschlüssel zur Behebung zu prüfen.
- Siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) für das mentale Modell „Warum ist das blockiert?“.
  Halten Sie es restriktiv.

## Multi-Agent-Überschreibungen

Jeder Agent kann Sandbox + Tools überschreiben:
`agents.list[].sandbox` und `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` für die Sandbox-Tool-Richtlinie).
Siehe [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für den Vorrang.

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

## Verwandte Dokumentation

- [OpenShell](/de/gateway/openshell) -- Einrichtung des verwalteten Sandbox-Backends, Workspace-Modi und Konfigurationsreferenz
- [Sandbox Configuration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Debugging von „Warum ist das blockiert?“
- [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) -- pro-Agent-Überschreibungen und Vorrang
- [Security](/de/gateway/security)
