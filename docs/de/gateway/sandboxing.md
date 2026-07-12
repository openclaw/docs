---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Funktionsweise der OpenClaw-Sandbox: Modi, Geltungsbereiche, Workspace-Zugriff und Images'
title: Sandboxing
x-i18n:
    generated_at: "2026-07-12T15:22:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw kann die Werkzeugausführung innerhalb eines Sandbox-Backends ausführen, um den möglichen Schadensradius zu verringern. Sandboxing ist standardmäßig deaktiviert und wird über `agents.defaults.sandbox` (global) oder `agents.list[].sandbox` (pro Agent) gesteuert. Der Gateway-Prozess verbleibt immer auf dem Host; bei aktiviertem Sandboxing wird nur die Werkzeugausführung in die Sandbox verlagert.

<Note>
Dies ist keine perfekte Sicherheitsgrenze, schränkt aber den Dateisystem- und Prozesszugriff erheblich ein, wenn das Modell etwas Unbedachtes tut.
</Note>

## Was in der Sandbox ausgeführt wird

- Werkzeugausführung: `exec`, `read`, `write`, `edit`, `apply_patch`, `process` usw.
- Der optionale Sandbox-Browser (`agents.defaults.sandbox.browser`).

Nicht in der Sandbox ausgeführt:

- Der Gateway-Prozess selbst.
- Jedes Werkzeug, dessen Ausführung außerhalb der Sandbox ausdrücklich über `tools.elevated` erlaubt ist. Die erhöhte Ausführung umgeht das Sandboxing und erfolgt über den konfigurierten Escape-Pfad (standardmäßig `gateway` oder `node`, wenn das Ausführungsziel `node` ist). Wenn Sandboxing deaktiviert ist, ändert `tools.elevated` nichts, da die Ausführung ohnehin bereits auf dem Host erfolgt. Siehe [Erhöhter Modus](/de/tools/elevated).

## Modi, Geltungsbereich und Backend

Drei unabhängige Einstellungen steuern das Sandbox-Verhalten:

| Einstellung   | Schlüssel                         | Werte                        | Standard |
| ------------- | --------------------------------- | ---------------------------- | -------- |
| Modus         | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| Geltungsbereich | `agents.defaults.sandbox.scope` | `agent`, `session`, `shared` | `agent`  |
| Backend       | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

Der **Modus** steuert, wann Sandboxing angewendet wird:

- `off`: kein Sandboxing.
- `non-main`: Alle Sitzungen außer der Hauptsitzung des Agenten werden in einer Sandbox ausgeführt. Der Schlüssel der Hauptsitzung ist immer `agent:<agentId>:main` (oder `global`, wenn `session.scope` auf `"global"` gesetzt ist); er kann nicht konfiguriert werden. Gruppen-/Kanalsitzungen verwenden eigene Schlüssel, gelten daher immer als Nicht-Hauptsitzungen und werden in einer Sandbox ausgeführt.
- `all`: Jede Sitzung wird in einer Sandbox ausgeführt.

Der **Geltungsbereich** steuert, wie viele Container/Umgebungen erstellt werden:

- `agent`: ein Container pro Agent.
- `session`: ein Container pro Sitzung.
- `shared`: ein gemeinsam von allen Sandbox-Sitzungen verwendeter Container (agentenspezifische Überschreibungen für `docker`/`ssh`/`browser` werden in diesem Geltungsbereich ignoriert).

Das **Backend** steuert, welche Laufzeit Sandbox-Werkzeuge ausführt. SSH-spezifische Konfiguration befindet sich unter `agents.defaults.sandbox.ssh`; OpenShell-spezifische Konfiguration befindet sich unter `plugins.entries.openshell.config`.

|                       | Docker                              | SSH                                  | OpenShell                                                     |
| --------------------- | ----------------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| **Ausführungsort**    | Lokaler Container                   | Jeder per SSH erreichbare Host       | Von OpenShell verwaltete Sandbox                              |
| **Einrichtung**       | `scripts/sandbox-setup.sh`          | SSH-Schlüssel + Zielhost             | OpenShell-Plugin aktiviert                                    |
| **Workspace-Modell**  | Bind-Mount oder Kopie               | Remote-kanonisch (einmalig initialisieren) | `mirror` oder `remote`                                  |
| **Netzwerksteuerung** | `docker.network` (Standard: keines) | Abhängig vom Remote-Host             | Abhängig von OpenShell                                        |
| **Browser-Sandbox**   | Unterstützt                         | Nicht unterstützt                    | Noch nicht unterstützt                                        |
| **Bind-Mounts**       | `docker.binds`                      | N. z.                                | N. z.                                                         |
| **Optimal für**       | Lokale Entwicklung, vollständige Isolation | Auslagerung auf einen Remote-Rechner | Verwaltete Remote-Sandboxes mit optionaler bidirektionaler Synchronisierung |

## Docker-Backend

Docker ist das Standard-Backend, sobald Sandboxing aktiviert ist. Es führt Werkzeuge und Sandbox-Browser lokal über den Docker-Daemon-Socket (`/var/run/docker.sock`) aus; die Isolation erfolgt durch Docker-Namespaces.

Standardwerte: `network: "none"` (kein ausgehender Zugriff), `readOnlyRoot: true`, `capDrop: ["ALL"]`, Image `openclaw-sandbox:bookworm-slim`.

Um Host-GPUs bereitzustellen, setzen Sie `agents.defaults.sandbox.docker.gpus` (oder die agentenspezifische Überschreibung) auf einen Wert wie `"all"` oder `"device=GPU-uuid"`. Dieser Wert wird an Dockers Flag `--gpus` übergeben und erfordert eine kompatible Host-Laufzeit wie das NVIDIA Container Toolkit.

<Warning>
**Einschränkungen bei Docker-out-of-Docker (DooD)**

Wenn Sie den OpenClaw Gateway selbst als Docker-Container bereitstellen, orchestriert er über den Docker-Socket des Hosts gleichgeordnete Sandbox-Container (DooD). Dadurch entsteht eine Einschränkung bei der Pfadzuordnung:

- **Konfiguration erfordert Host-Pfade**: `workspace` in `openclaw.json` muss den **absoluten Pfad des Hosts** enthalten (z. B. `/home/user/.openclaw/workspaces`), nicht den internen Pfad des Gateway-Containers. Der Docker-Daemon wertet Pfade relativ zum Namespace des Host-Betriebssystems aus, nicht relativ zum Namespace des Gateways.
- **Übereinstimmende Volume-Zuordnung erforderlich**: Der Gateway-Prozess schreibt außerdem Heartbeat- und Bridge-Dateien in diesen `workspace`-Pfad. Geben Sie dem Gateway-Container eine identische Volume-Zuordnung (`-v /home/user/.openclaw:/home/user/.openclaw`), damit derselbe Host-Pfad auch innerhalb des Gateway-Containers korrekt aufgelöst wird. Nicht übereinstimmende Zuordnungen führen zu `EACCES`, wenn der Gateway versucht, seinen Heartbeat zu schreiben.
- **Codex-Code-Modus**: Wenn eine OpenClaw-Sandbox aktiv ist, deaktiviert OpenClaw für diesen Durchlauf den nativen Code-Modus des Codex-App-Servers, benutzerdefinierte MCP-Server und die Ausführung App-gestützter Plugins (diese werden im App-Server-Prozess auf dem Gateway-Host ausgeführt, nicht im OpenClaw-Sandbox-Backend), sofern die Sandbox-Werkzeugrichtlinie nicht die erforderlichen Werkzeuge bereitstellt und Sie den experimentellen Sandbox-Exec-Server-Pfad aktivieren. Der Shell-Zugriff erfolgt dann über OpenClaw-Werkzeuge mit Sandbox-Backend wie `sandbox_exec` und `sandbox_process`. Binden Sie den Docker-Socket des Hosts nicht in Agenten-Sandbox-Container oder benutzerdefinierte Codex-Sandboxes ein. Das vollständige Verhalten wird unter [Codex-Harness](/de/plugins/codex-harness) beschrieben.

Auf Ubuntu-/AppArmor-Hosts mit aktiviertem Docker-Sandbox-Modus benötigt die Shell-Ausführung mit `workspace-write` des Codex-App-Servers unprivilegierte Benutzer-Namespaces innerhalb des Sandbox-Containers. Sie kann vor dem Start der Shell fehlschlagen, wenn der Dienstbenutzer diese nicht erstellen kann. Wenn der ausgehende Netzwerkzugriff der Docker-Sandbox deaktiviert ist (`network: "none"`, der Standard), wird zusätzlich ein unprivilegierter Netzwerk-Namespace benötigt. Häufige Symptome sind: `bwrap: setting up uid map: Permission denied` und `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Führen Sie `openclaw doctor` aus. Wenn ein Fehler bei der Prüfung des Codex-bwrap-Namespaces gemeldet wird, sollten Sie ein AppArmor-Profil bevorzugen, das dem OpenClaw-Dienstprozess die erforderlichen Namespaces gewährt. `kernel.apparmor_restrict_unprivileged_userns=0` ist eine hostweite Ausweichlösung mit Sicherheitskompromissen; verwenden Sie sie nur, wenn diese Sicherheitskonfiguration für den Host akzeptabel ist.
</Warning>

### Sandbox-Browser

- Der Sandbox-Browser startet automatisch (und stellt sicher, dass CDP erreichbar ist), wenn das Browser-Werkzeug ihn benötigt. Die Konfiguration erfolgt über `agents.defaults.sandbox.browser.autoStart` (Standardwert `true`) und `autoStartTimeoutMs` (Standardwert 12s).
- Sandbox-Browser-Container verwenden anstelle des globalen `bridge`-Netzwerks ein dediziertes Docker-Netzwerk (`openclaw-sandbox-browser`). Konfigurieren Sie es mit `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` beschränkt eingehende CDP-Verbindungen am Containerrand mithilfe einer CIDR-Zulassungsliste (zum Beispiel `172.21.0.1/32`).
- Der noVNC-Beobachterzugriff ist standardmäßig passwortgeschützt; OpenClaw gibt eine kurzlebige Token-URL aus, die eine lokale Bootstrap-Seite bereitstellt und noVNC mit dem Passwort im URL-Fragment öffnet (nicht in der Abfragezeichenfolge oder in Header-Protokollen).
- `agents.defaults.sandbox.browser.allowHostControl` (Standardwert `false`) ermöglicht Sandbox-Sitzungen, ausdrücklich den Host-Browser anzusteuern.
- Optionale Zulassungslisten beschränken `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## SSH-Backend

Verwenden Sie `backend: "ssh"`, um `exec`, Dateiwerkzeuge und das Lesen von Medien auf einem beliebigen per SSH erreichbaren Rechner in einer Sandbox auszuführen.

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
          // Oder SecretRefs/Inline-Inhalte anstelle lokaler Dateien verwenden:
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

- **Lebenszyklus**: OpenClaw erstellt unter `sandbox.ssh.workspaceRoot` ein Remote-Stammverzeichnis pro Geltungsbereich. Bei der ersten Verwendung nach dem Erstellen oder Neuerstellen wird dieser Remote-Workspace einmalig aus dem lokalen Workspace initialisiert. Danach werden `exec`, `read`, `write`, `edit`, `apply_patch`, das Lesen von Prompt-Medien und die Bereitstellung eingehender Medien direkt über SSH im Remote-Workspace ausgeführt. OpenClaw synchronisiert Remote-Änderungen nicht automatisch zurück in den lokalen Workspace.
- **Authentifizierungsmaterial**: `identityFile`/`certificateFile`/`knownHostsFile` verweisen auf vorhandene lokale Dateien. `identityData`/`certificateData`/`knownHostsData` akzeptieren Inline-Zeichenfolgen oder SecretRefs, die über den normalen Laufzeit-Snapshot der Geheimnisse aufgelöst, mit dem Modus `0600` in temporäre Dateien geschrieben und beim Ende der SSH-Sitzung gelöscht werden. Wenn für dasselbe Element sowohl eine `*File`- als auch eine `*Data`-Variante festgelegt ist, hat `*Data` für diese Sitzung Vorrang.
- **Folgen des Remote-kanonischen Modells**: Der Remote-SSH-Workspace wird nach der anfänglichen Initialisierung zum tatsächlichen Sandbox-Zustand. Nach der Initialisierung außerhalb von OpenClaw vorgenommene lokale Host-Änderungen sind remote erst sichtbar, wenn Sie die Sandbox neu erstellen. `openclaw sandbox recreate` löscht das Remote-Stammverzeichnis des jeweiligen Geltungsbereichs und initialisiert es bei der nächsten Verwendung erneut aus dem lokalen Workspace. Browser-Sandboxing wird von diesem Backend nicht unterstützt, und Einstellungen unter `sandbox.docker.*` gelten dafür nicht.

## OpenShell-Backend

Verwenden Sie `backend: "openshell"`, um Werkzeuge in einer von OpenShell verwalteten Remote-Umgebung in einer Sandbox auszuführen. OpenShell verwendet denselben SSH-Transport und dieselbe Remote-Dateisystem-Bridge wie das generische SSH-Backend und ergänzt den OpenShell-Lebenszyklus (`sandbox create/get/delete/ssh-config`) sowie einen optionalen Workspace-Synchronisierungsmodus `mirror`.

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
        },
      },
    },
  },
}
```

`mode: "mirror"` (Standard) behält den lokalen Workspace als kanonische Quelle bei: OpenClaw synchronisiert den lokalen Workspace vor `exec` in die Sandbox und anschließend wieder zurück. `mode: "remote"` initialisiert den Remote-Workspace einmalig aus dem lokalen Workspace und führt anschließend `exec`/`read`/`write`/`edit`/`apply_patch` direkt im Remote-Workspace aus, ohne Änderungen zurückzusynchronisieren; lokale Änderungen nach der Initialisierung sind nicht sichtbar, bis Sie `openclaw sandbox recreate` ausführen. Unter `scope: "agent"` oder `scope: "shared"` wird dieser Remote-Workspace im jeweiligen Geltungsbereich gemeinsam genutzt. Aktuelle Einschränkungen: Der Sandbox-Browser wird noch nicht unterstützt, und `sandbox.docker.binds` gilt nicht für dieses Backend.

`openclaw sandbox list`/`recreate`/prune behandeln OpenShell-Laufzeiten genauso wie Docker-Laufzeiten; die Bereinigungslogik berücksichtigt das Backend.

Die vollständigen Voraussetzungen, die Konfigurationsreferenz, den Vergleich der Workspace-Modi und Einzelheiten zum Lebenszyklus finden Sie unter [OpenShell](/de/gateway/openshell).

## Workspace-Zugriff

`agents.defaults.sandbox.workspaceAccess` steuert, was die Sandbox sehen kann:

| Wert             | Verhalten                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `none` (Standard) | Tools sehen einen isolierten Sandbox-Arbeitsbereich unter `~/.openclaw/sandboxes`.                 |
| `ro`             | Bindet den Agent-Arbeitsbereich schreibgeschützt unter `/agent` ein (deaktiviert `write`/`edit`/`apply_patch`). |
| `rw`             | Bindet den Agent-Arbeitsbereich mit Lese-/Schreibzugriff unter `/workspace` ein.                   |

Mit dem OpenShell-Backend verwendet der Modus `mirror` zwischen exec-Durchläufen weiterhin den lokalen Arbeitsbereich als kanonische Quelle, der Modus `remote` verwendet nach der initialen Übertragung den entfernten OpenShell-Arbeitsbereich als kanonische Quelle, und `workspaceAccess: "ro"`/`"none"` schränkt das Schreibverhalten weiterhin auf dieselbe Weise ein.

Eingehende Medien werden in den aktiven Sandbox-Arbeitsbereich (`media/inbound/*`) kopiert.

<Note>
**Skills**: Das Tool `read` ist auf das Sandbox-Stammverzeichnis beschränkt. Bei `workspaceAccess: "none"` spiegelt OpenClaw geeignete Skills in den Sandbox-Arbeitsbereich (`.../skills`), damit sie gelesen werden können. Bei `"rw"` sind Arbeitsbereich-Skills unter `/workspace/skills` lesbar, und geeignete verwaltete, gebündelte oder Plugin-Skills werden im generierten schreibgeschützten Pfad `/workspace/.openclaw/sandbox-skills/skills` bereitgestellt.
</Note>

## Benutzerdefinierte Bind-Mounts

`agents.defaults.sandbox.docker.binds` bindet zusätzliche Hostverzeichnisse in den Container ein. Format: `host:container:mode` (z. B. `"/home/user/source:/source:rw"`).

Globale und agentspezifische Bind-Mounts werden zusammengeführt (nicht ersetzt). Unter `scope: "shared"` werden agentspezifische Bind-Mounts ignoriert.

`agents.defaults.sandbox.browser.binds` bindet zusätzliche Hostverzeichnisse ausschließlich in den **Sandbox-Browser**-Container ein. Wenn die Option gesetzt ist (einschließlich `[]`), ersetzt sie `docker.binds` für den Browser-Container; wenn sie fehlt, greift der Browser-Container auf `docker.binds` zurück.

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

- Bind-Mounts umgehen das Sandbox-Dateisystem: Sie legen Hostpfade mit dem von Ihnen festgelegten Modus (`:ro` oder `:rw`) offen.
- OpenClaw blockiert gefährliche Bind-Quellen standardmäßig: Systempfade (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), Docker-Socket-Verzeichnisse (`/run`, `/var/run` und deren `docker.sock`-Varianten) sowie übliche Stammverzeichnisse für Zugangsdaten im Home-Verzeichnis (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- Die Validierung normalisiert den Quellpfad und löst ihn anschließend erneut über den tiefsten vorhandenen Vorgänger auf, bevor blockierte Pfade und zulässige Stammverzeichnisse erneut geprüft werden. Dadurch werden Ausbrüche über übergeordnete Symlinks sicher blockiert, selbst wenn das letzte Pfadelement noch nicht existiert (z. B. wird `/workspace/run-link/new-file` weiterhin als `/var/run/...` aufgelöst, wenn `run-link` dorthin verweist).
- Bind-Ziele, die die reservierten Container-Mount-Punkte (`/workspace`, `/agent`) überlagern, werden ebenfalls standardmäßig blockiert; überschreiben Sie dies mit `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Bind-Quellen außerhalb der zulässigen Stammverzeichnisse des Arbeitsbereichs/Agent-Arbeitsbereichs werden standardmäßig blockiert; überschreiben Sie dies mit `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Zulässige Stammverzeichnisse werden auf dieselbe Weise kanonisiert. Daher wird ein Pfad, der nur vor der Symlink-Auflösung innerhalb der Zulassungsliste zu liegen scheint, weiterhin als außerhalb der zulässigen Stammverzeichnisse abgelehnt.
- Vertrauliche Mounts (Secrets, SSH-Schlüssel, Dienstzugangsdaten) sollten `:ro` sein, sofern Schreibzugriff nicht unbedingt erforderlich ist.
- Kombinieren Sie dies mit `workspaceAccess: "ro"`, wenn Sie nur Lesezugriff auf den Arbeitsbereich benötigen; die Bind-Modi bleiben davon unabhängig.
- Unter [Sandbox vs. Tool-Richtlinie vs. erhöhte Rechte](/de/gateway/sandbox-vs-tool-policy-vs-elevated) erfahren Sie, wie Bind-Mounts mit Tool-Richtlinien und exec mit erhöhten Rechten interagieren.

</Warning>

## Images und Einrichtung

Standard-Docker-Image: `openclaw-sandbox:bookworm-slim`

<Note>
**Quellcode-Checkout im Vergleich zur npm-Installation**

Die Hilfsskripte `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` und `scripts/sandbox-browser-setup.sh` sind nur verfügbar, wenn Sie OpenClaw aus einem [Quellcode-Checkout](https://github.com/openclaw/openclaw) ausführen. Sie sind nicht im npm-Paket enthalten.

Wenn Sie OpenClaw über `npm install -g openclaw` installiert haben, verwenden Sie stattdessen die unten gezeigten eingebetteten `docker build`-Befehle.
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

    Das Standard-Image enthält **kein** Node. Wenn ein Skill Node (oder andere Laufzeitumgebungen) benötigt, erstellen Sie entweder ein benutzerdefiniertes Image mit diesen Komponenten oder installieren Sie sie über `sandbox.docker.setupCommand` (erfordert ausgehenden Netzwerkzugriff, ein beschreibbares Stammverzeichnis und den root-Benutzer).

    OpenClaw ersetzt das fehlende `openclaw-sandbox:bookworm-slim` nicht stillschweigend durch ein einfaches `debian:bookworm-slim`. Sandbox-Durchläufe, die das Standard-Image verwenden, brechen frühzeitig mit einer Build-Anweisung ab, bis Sie es erstellt haben, da das gebündelte Image `python3` für die Schreib-/Bearbeitungshilfen der Sandbox enthält.

  </Step>
  <Step title="Optional: gemeinsames Image erstellen">
    Für ein funktionsreicheres Sandbox-Image mit gängigen Tools (zum Beispiel `curl`, `jq`, Node 24, pnpm, `python3` und `git`):

    Aus einem Quellcode-Checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Erstellen Sie bei einer npm-Installation zuerst das Standard-Image (siehe oben) und anschließend darauf aufbauend das gemeinsame Image mithilfe von [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) aus dem Repository.

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

Docker-Sandbox-Container werden standardmäßig **ohne Netzwerk** ausgeführt. Überschreiben Sie dies mit `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Chromium-Standardeinstellungen des Sandbox-Browsers">
    Das gebündelte Sandbox-Browser-Image verwendet konservative Chromium-Startflags für containerisierte Arbeitslasten:

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
    - Standardmäßig `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer`; diese Flags zur Grafik-Härtung unterstützen Container ohne GPU-Unterstützung. Setzen Sie `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, wenn Ihre Arbeitslast WebGL oder andere 3D-Funktionen benötigt.
    - Standardmäßig `--disable-extensions`; setzen Sie `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` für Abläufe, die Erweiterungen benötigen.
    - Standardmäßig `--renderer-process-limit=2`; steuerbar über `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, wobei `0` den Chromium-Standard beibehält.

    Wenn Sie ein anderes Laufzeitprofil benötigen, verwenden Sie ein benutzerdefiniertes Browser-Image und stellen Sie Ihren eigenen Einstiegspunkt bereit. Verwenden Sie für lokale Chromium-Profile (außerhalb eines Containers) `browser.extraArgs`, um zusätzliche Startflags anzuhängen.

  </Accordion>
  <Accordion title="Standardeinstellungen für Netzwerksicherheit">
    - `network: "host"` ist blockiert.
    - `network: "container:<id>"` ist standardmäßig blockiert (Risiko der Umgehung durch Beitritt zum Namespace).
    - Notfallmäßige Außerkraftsetzung: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker-Installationen und das containerisierte Gateway finden Sie hier: [Docker](/de/install/docker)

Bei Docker-Gateway-Bereitstellungen kann `scripts/docker/setup.sh` die Sandbox-Konfiguration initialisieren. Setzen Sie `OPENCLAW_SANDBOX=1` (oder `true`/`yes`/`on`), um diesen Pfad zu aktivieren. Überschreiben Sie den Socket-Speicherort mit `OPENCLAW_DOCKER_SOCKET`. Vollständige Einrichtung und Umgebungsvariablenreferenz: [Docker](/de/install/docker#agent-sandbox).

## setupCommand (einmalige Container-Einrichtung)

`setupCommand` wird **einmal** ausgeführt, nachdem der Sandbox-Container erstellt wurde (nicht bei jedem Durchlauf). Der Befehl wird im Container über `sh -lc` ausgeführt.

Pfade:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Pro Agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Häufige Fallstricke">
    - Der Standardwert von `docker.network` ist `"none"` (kein ausgehender Zugriff), sodass Paketinstallationen fehlschlagen.
    - `docker.network: "container:<id>"` erfordert `dangerouslyAllowContainerNamespaceJoin: true` und darf nur als Notfalllösung verwendet werden.
    - `readOnlyRoot: true` verhindert Schreibvorgänge; setzen Sie `readOnlyRoot: false` oder erstellen Sie ein benutzerdefiniertes Image.
    - Für Paketinstallationen muss `user` root sein (lassen Sie `user` weg oder setzen Sie `user: "0:0"`).
    - Sandbox-exec übernimmt `process.env` des Hosts **nicht**. Verwenden Sie `agents.defaults.sandbox.docker.env` (oder ein benutzerdefiniertes Image) für Skill-API-Schlüssel.
    - Werte in `agents.defaults.sandbox.docker.env` werden als explizite Umgebungsvariablen des Docker-Containers übergeben. Jeder mit Zugriff auf den Docker-Daemon kann sie mit Docker-Metadatenbefehlen wie `docker inspect` einsehen. Verwenden Sie ein benutzerdefiniertes Image, eine eingehängte Secret-Datei oder einen anderen Bereitstellungspfad für Secrets, wenn diese Offenlegung über Metadaten nicht akzeptabel ist.

  </Accordion>
</AccordionGroup>

## Tool-Richtlinie und Ausweichmöglichkeiten

Tool-Zulassungs-/Ablehnungsrichtlinien gelten weiterhin vor den Sandbox-Regeln. Wenn ein Tool global oder pro Agent abgelehnt wird, macht die Sandbox es nicht wieder verfügbar.

`tools.elevated` ist eine explizite Ausweichmöglichkeit, die `exec` außerhalb der Sandbox ausführt (standardmäßig im `gateway` oder in `node`, wenn das exec-Ziel `node` ist). `/exec`-Direktiven gelten nur für autorisierte Absender und bleiben pro Sitzung bestehen; um `exec` vollständig zu deaktivieren, verwenden Sie eine Ablehnung in der Tool-Richtlinie (siehe [Sandbox vs. Tool-Richtlinie vs. erhöhte Rechte](/de/gateway/sandbox-vs-tool-policy-vs-elevated)).

Fehlersuche:

- `openclaw sandbox list` zeigt Sandbox-Container, Status, Image-Übereinstimmung, Alter, Leerlaufzeit und die zugehörige Sitzung/den zugehörigen Agenten.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` untersucht den effektiven Sandbox-Modus, den Host-Arbeitsbereich, das Laufzeit-Arbeitsverzeichnis, Docker-Mounts, die Tool-Richtlinie und Konfigurationsschlüssel zur Problembehebung. Das Feld `workspaceRoot` bleibt das konfigurierte Sandbox-Stammverzeichnis; `effectiveHostWorkspaceRoot` zeigt, wo sich der aktive Arbeitsbereich tatsächlich befindet.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` entfernt Container/Umgebungen, damit sie bei der nächsten Verwendung mit der aktuellen Konfiguration neu erstellt werden.
- Unter [Sandbox vs. Tool-Richtlinie vs. erhöhte Rechte](/de/gateway/sandbox-vs-tool-policy-vs-elevated) finden Sie das Denkmodell für die Frage „Warum ist das blockiert?“.

## Überschreibungen für mehrere Agenten

Jeder Agent kann Sandbox und Tools überschreiben: `agents.list[].sandbox` und `agents.list[].tools` (sowie `agents.list[].tools.sandbox.tools` für die Sandbox-Tool-Richtlinie). Informationen zur Rangfolge finden Sie unter [Sandbox und Tools für mehrere Agenten](/de/tools/multi-agent-sandbox-tools).

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

- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) -- agentenspezifische Überschreibungen und Rangfolge
- [OpenShell](/de/gateway/openshell) -- Einrichtung des verwalteten Sandbox-Backends, Workspace-Modi und Konfigurationsreferenz
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs. Tool-Richtlinie vs. erhöhte Berechtigungen](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Fehlerbehebung bei der Frage „Warum wird dies blockiert?“
- [Sicherheit](/de/gateway/security)
