---
read_when:
    - Sie möchten einen containerisierten Gateway mit Podman anstelle von Docker.
summary: OpenClaw in einem Rootless-Podman-Container ausführen
title: Podman
x-i18n:
    generated_at: "2026-07-24T04:28:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Führen Sie das OpenClaw Gateway in einem Rootless-Podman-Container aus, der von Ihrem aktuellen Nicht-Root-Benutzer verwaltet wird.

Das Modell:

- Podman führt den Gateway-Container aus.
- Ihre Host-`openclaw`-CLI ist die Steuerungsebene.
- Persistenter Zustand befindet sich standardmäßig auf dem Host unter `~/.openclaw`.
- Für die tägliche Verwaltung wird `openclaw --container <name> ...` anstelle von `sudo -u openclaw`, `podman exec` oder einem separaten Dienstbenutzer verwendet.

## Voraussetzungen

- **Podman** im Rootless-Modus
- **OpenClaw CLI** auf dem Host installiert
- **Optional:** `systemd --user`, wenn Sie einen von Quadlet verwalteten automatischen Start wünschen
- **Optional:** `sudo` nur, wenn Sie `loginctl enable-linger "$(whoami)"` für die Startpersistenz auf einem Headless-Host verwenden möchten

## Schnellstart

<Steps>
  <Step title="Einmalige Einrichtung">
    Führen Sie im Repository-Stammverzeichnis `./scripts/podman/setup.sh` aus.

    Dadurch wird `openclaw:local` in Ihrem Rootless-Podman-Speicher erstellt (oder `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` abgerufen, falls festgelegt), `~/.openclaw/openclaw.json` mit `gateway.mode: "local"` erstellt, falls nicht vorhanden, und `~/.openclaw/.env` mit einem generierten `OPENCLAW_GATEWAY_TOKEN` erstellt, falls nicht vorhanden.

    Optionale Umgebungsvariablen für die Build-Zeit:

    | Variable | Auswirkung |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Verwendet ein vorhandenes/abgerufenes Image, statt `openclaw:local` zu erstellen |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Installiert zusätzliche apt-Pakete während des Image-Builds (akzeptiert auch das veraltete `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Installiert zusätzliche Python-Pakete während des Image-Builds; fixieren Sie Versionen und verwenden Sie nur Paketindizes, denen Sie vertrauen |
    | `OPENCLAW_EXTENSIONS` | Kompiliert/verpackt unterstützte ausgewählte Plugins und installiert deren Laufzeitabhängigkeiten |
    | `OPENCLAW_INSTALL_BROWSER` | Installiert Chromium und Xvfb für die Browserautomatisierung vorab (auf `1` setzen) |

    Stattdessen für eine von Quadlet verwaltete Einrichtung (nur Linux und systemd-Benutzerdienste):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Oder setzen Sie `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Gateway-Container starten">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Startet den Container mit Ihrer aktuellen UID/GID und `--userns=keep-id` und bind-mountet Ihren OpenClaw-Zustand in den Container.

  </Step>

  <Step title="Onboarding im Container ausführen">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Öffnen Sie anschließend `http://127.0.0.1:18789/` und verwenden Sie das Token aus `~/.openclaw/.env`.

    Modellauthentifizierung: Verwenden Sie während der Einrichtung die von OpenClaw verwaltete Authentifizierung (Anthropic-API-Schlüssel oder OpenAI-Codex-Browser-OAuth/Gerätecode-Authentifizierung für Codex-gestütztes OpenAI). Der Podman-Launcher mountet keine Anmeldeinformationsverzeichnisse der Host-CLI wie `~/.claude` oder `~/.codex` in den Einrichtungs- oder Gateway-Container. Vorhandene Host-CLI-Anmeldungen sind lediglich Komfortpfade auf demselben Host – bei Containerinstallationen speichern Sie die Provider-Authentifizierung im gemounteten Zustand `~/.openclaw`, den die Einrichtung verwaltet.

  </Step>

  <Step title="Laufenden Container über die Host-CLI verwalten">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    Danach werden normale `openclaw`-Befehle automatisch in diesem Container ausgeführt:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # umfasst eine zusätzliche Dienstsuche
    openclaw doctor
    openclaw channels login
    ```

    Unter macOS kann die Podman-Maschine dazu führen, dass der Browser für das Gateway nicht lokal erscheint. Wenn die Control UI nach dem Start Geräteauthentifizierungsfehler meldet, verwenden Sie die Tailscale-Anleitung unter [Podman und Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

Der manuelle Launcher liest aus `~/.openclaw/.env` nur eine kleine Positivliste Podman-bezogener Schlüssel und übergibt explizite Laufzeit-Umgebungsvariablen an den Container; er übergibt nicht die vollständige Umgebungsdatei an Podman.

<a id="podman-and-tailscale"></a>

## Podman und Tailscale

Folgen Sie für HTTPS oder den Remote-Browserzugriff der Tailscale-Hauptdokumentation.

Podman-spezifische Hinweise:

- Belassen Sie den Podman-Veröffentlichungshost auf `127.0.0.1`.
- Bevorzugen Sie das vom Host verwaltete `tailscale serve` gegenüber `openclaw gateway --tailscale serve`.
- Wenn unter macOS der Geräteauthentifizierungskontext des lokalen Browsers unzuverlässig ist, verwenden Sie den Tailscale-Zugriff statt improvisierter lokaler Tunnelumgehungen.

Siehe [Tailscale](/de/gateway/tailscale) und [Control UI](/de/web/control-ui).

## Systemd (Quadlet, optional)

Wenn Sie `./scripts/podman/setup.sh --quadlet` ausgeführt haben, installiert die Einrichtung eine Quadlet-Datei unter `~/.config/containers/systemd/openclaw.container`.

| Aktion | Befehl                                    |
| ------ | ------------------------------------------ |
| Starten  | `systemctl --user start openclaw.service`  |
| Stoppen   | `systemctl --user stop openclaw.service`   |
| Status | `systemctl --user status openclaw.service` |
| Protokolle   | `journalctl --user -u openclaw.service -f` |

Nach dem Bearbeiten der Quadlet-Datei:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Aktivieren Sie für die Startpersistenz auf SSH-/Headless-Hosts das Lingering für Ihren aktuellen Benutzer:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Der generierte Quadlet-Dienst behält eine feste, gehärtete Standardkonfiguration bei: `127.0.0.1` veröffentlichte Ports (`18789` Gateway, `18790` Bridge), `--bind lan` innerhalb des Containers, `keep-id`-Benutzernamensraum, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` und `TimeoutStartSec=300`. Er liest `~/.openclaw/.env` zur Laufzeit als `EnvironmentFile` für Werte wie `OPENCLAW_GATEWAY_TOKEN`, verwendet jedoch nicht die Positivliste Podman-spezifischer Überschreibungen des manuellen Launchers. Verwenden Sie für benutzerdefinierte Veröffentlichungsports, einen benutzerdefinierten Veröffentlichungshost oder andere Container-Ausführungsflags stattdessen den manuellen Launcher, oder bearbeiten Sie `~/.config/containers/systemd/openclaw.container` direkt und laden und starten Sie anschließend den Dienst neu.

## Konfiguration, Umgebung und Speicher

- **Konfigurationsverzeichnis:** `~/.openclaw`
- **Arbeitsbereichsverzeichnis:** `~/.openclaw/workspace`
- **Token-Datei:** `~/.openclaw/.env`
- **Starthilfe:** `./scripts/run-openclaw-podman.sh`

Das Startskript und Quadlet bind-mounten den Hostzustand in den Container: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. Standardmäßig sind dies Hostverzeichnisse und kein anonymer Containerzustand, sodass `openclaw.json`, agentenspezifische `auth-profiles.json`, Kanal-/Provider-Zustand, Sitzungen und der Arbeitsbereich das Ersetzen des Containers überstehen. Die Einrichtung initialisiert außerdem `gateway.controlUi.allowedOrigins` für `127.0.0.1` und `localhost` auf dem veröffentlichten Gateway-Port, damit das lokale Dashboard mit der Nicht-Loopback-Bindung des Containers funktioniert.

Nützliche Umgebungsvariablen für den manuellen Launcher (speichern Sie diese dauerhaft in `~/.openclaw/.env`; der Launcher liest diese Datei, bevor er die Container-/Image-Standardwerte festlegt):

| Variable                                        | Standard          | Auswirkung                                 |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | Containername                         |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | Auszuführendes Image                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | Hostport, der dem Containerport `18789` zugeordnet ist  |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | Hostport, der dem Containerport `18790` zugeordnet ist  |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | Hostschnittstelle für veröffentlichte Ports     |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | Gateway-Bindungsmodus innerhalb des Containers |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto` oder `host`           |

Wenn Sie ein nicht standardmäßiges `OPENCLAW_CONFIG_DIR` oder `OPENCLAW_WORKSPACE_DIR` verwenden, setzen Sie dieselben Variablen sowohl für `./scripts/podman/setup.sh` als auch für spätere `./scripts/run-openclaw-podman.sh launch`-Befehle – der Repository-lokale Launcher speichert benutzerdefinierte Pfadüberschreibungen nicht shellübergreifend.

## Images aktualisieren

Nachdem Sie ein neues Image erstellt oder abgerufen haben, starten Sie den Container oder den Quadlet-Dienst neu.
Beim ersten Start einer neuen OpenClaw-Version führt das Gateway sichere Zustands- und
Plugin-Reparaturen aus, bevor es seine Bereitschaft meldet.

Wenn das Gateway beendet wird, statt betriebsbereit zu werden, führen Sie dasselbe Image einmal mit
`openclaw doctor --fix` für denselben gemounteten Zustand/dieselbe Konfiguration aus und starten Sie anschließend das
Gateway normal neu:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

Fügen Sie auf SELinux-Hosts beiden Bind-Mounts `,Z` hinzu, wenn Podman den Zugriff auf den
gemounteten Zustand blockiert.

## Nützliche Befehle

- **Containerprotokolle:** `podman logs -f openclaw`
- **Container stoppen:** `podman stop openclaw`
- **Container entfernen:** `podman rm -f openclaw`
- **Dashboard-URL über die Host-CLI öffnen:** `openclaw dashboard --no-open`
- **Integrität/Status über die Host-CLI:** `openclaw gateway status --deep` (RPC-Prüfung + zusätzliche Dienstsuche)

## Fehlerbehebung

- **Zugriff verweigert (EACCES) bei Konfiguration oder Arbeitsbereich:** Der Container wird standardmäßig mit `--userns=keep-id` und `--user <your uid>:<your gid>` ausgeführt. Stellen Sie sicher, dass die Konfigurations-/Arbeitsbereichspfade auf dem Host Ihrem aktuellen Benutzer gehören.
- **Gateway-Start blockiert (`gateway.mode=local` fehlt):** Stellen Sie sicher, dass `~/.openclaw/openclaw.json` vorhanden ist und `gateway.mode="local"` festlegt. `scripts/podman/setup.sh` erstellt dies, falls es fehlt.
- **Container startet nach einer Image-Aktualisierung wiederholt neu:** Führen Sie den einmaligen Befehl `openclaw doctor --fix` unter [Images aktualisieren](#upgrading-images) aus und starten Sie anschließend das Gateway erneut.
- **Container-CLI-Befehle sprechen das falsche Ziel an:** Verwenden Sie explizit `openclaw --container <name> ...`, oder exportieren Sie `OPENCLAW_CONTAINER=<name>` in Ihrer Shell.
- **`openclaw update` schlägt mit `--container` fehl:** Das ist zu erwarten. Erstellen Sie das Image neu oder rufen Sie es erneut ab und starten Sie anschließend den Container oder den Quadlet-Dienst neu.
- **Quadlet-Dienst startet nicht:** Führen Sie `systemctl --user daemon-reload` und anschließend `systemctl --user start openclaw.service` aus. Auf Headless-Systemen benötigen Sie möglicherweise zusätzlich `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blockiert Bind-Mounts:** Belassen Sie das standardmäßige Mount-Verhalten unverändert; der Launcher fügt unter Linux automatisch `:Z` hinzu, wenn SELinux im Enforcing- oder Permissive-Modus ausgeführt wird.

## Verwandte Themen

- [Docker](/de/install/docker)
- [Gateway-Hintergrundprozess](/de/gateway/background-process)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
