---
read_when:
    - Sie möchten ein containerisiertes Gateway mit Podman anstelle von Docker.
summary: OpenClaw in einem Rootless-Podman-Container ausführen
title: Podman
x-i18n:
    generated_at: "2026-07-12T15:27:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Führen Sie das OpenClaw Gateway in einem Rootless-Podman-Container aus, der von Ihrem aktuellen Benutzer ohne Root-Rechte verwaltet wird.

Das Modell:

- Podman führt den Gateway-Container aus.
- Ihre hostseitige `openclaw`-CLI dient als Steuerungsebene.
- Persistenter Zustand wird standardmäßig auf dem Host unter `~/.openclaw` gespeichert.
- Für die tägliche Verwaltung verwenden Sie `openclaw --container <name> ...` anstelle von `sudo -u openclaw`, `podman exec` oder einem separaten Dienstbenutzer.

## Voraussetzungen

- **Podman** im Rootless-Modus
- **OpenClaw-CLI** auf dem Host installiert
- **Optional:** `systemd --user`, wenn Sie einen von Quadlet verwalteten automatischen Start wünschen
- **Optional:** `sudo` nur, wenn Sie `loginctl enable-linger "$(whoami)"` für den dauerhaften Start beim Hochfahren auf einem Monitor-losen Host verwenden möchten

## Schnellstart

<Steps>
  <Step title="Einmalige Einrichtung">
    Führen Sie im Stammverzeichnis des Repositorys `./scripts/podman/setup.sh` aus.

    Dadurch wird `openclaw:local` in Ihrem Rootless-Podman-Speicher erstellt (oder `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` abgerufen, falls festgelegt), bei Bedarf `~/.openclaw/openclaw.json` mit `gateway.mode: "local"` erstellt und bei Bedarf `~/.openclaw/.env` mit einem generierten `OPENCLAW_GATEWAY_TOKEN` angelegt.

    Optionale Umgebungsvariablen für die Build-Zeit:

    | Variable | Auswirkung |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Ein vorhandenes/abgerufenes Image verwenden, anstatt `openclaw:local` zu erstellen |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Zusätzliche apt-Pakete während der Image-Erstellung installieren (akzeptiert auch das veraltete `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Zusätzliche Python-Pakete während der Image-Erstellung installieren; Versionen festschreiben und nur vertrauenswürdige Paketindizes verwenden |
    | `OPENCLAW_EXTENSIONS` | Ausgewählte unterstützte Plugins kompilieren/paketieren und deren Laufzeitabhängigkeiten installieren |
    | `OPENCLAW_INSTALL_BROWSER` | Chromium und Xvfb für die Browserautomatisierung vorinstallieren (auf `1` setzen) |

    Alternativ für eine von Quadlet verwaltete Einrichtung (nur Linux und systemd-Benutzerdienste):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Oder setzen Sie `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Gateway-Container starten">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Startet den Container mit Ihrer aktuellen UID/GID und `--userns=keep-id` und bindet Ihren OpenClaw-Zustand per Bind-Mount in den Container ein.

  </Step>

  <Step title="Onboarding im Container ausführen">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Öffnen Sie anschließend `http://127.0.0.1:18789/` und verwenden Sie das Token aus `~/.openclaw/.env`.

    Modellauthentifizierung: Verwenden Sie während der Einrichtung die von OpenClaw verwaltete Authentifizierung (Anthropic-API-Schlüssel oder OpenAI-Codex-Browser-OAuth-/Gerätecode-Authentifizierung für Codex-gestütztes OpenAI). Der Podman-Starter bindet keine Anmeldeinformationsverzeichnisse hostseitiger CLIs wie `~/.claude` oder `~/.codex` in den Einrichtungs- oder Gateway-Container ein. Vorhandene hostseitige CLI-Anmeldungen sind nur Komfortpfade auf demselben Host – speichern Sie bei Containerinstallationen die Provider-Authentifizierung im eingebundenen Zustand unter `~/.openclaw`, der von der Einrichtung verwaltet wird.

  </Step>

  <Step title="Laufenden Container über die hostseitige CLI verwalten">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    Anschließend werden normale `openclaw`-Befehle automatisch in diesem Container ausgeführt:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # umfasst eine zusätzliche Dienstsuche
    openclaw doctor
    openclaw channels login
    ```

    Unter macOS kann die Podman-Maschine dazu führen, dass der Browser für das Gateway nicht lokal erscheint. Wenn die Control UI nach dem Start Fehler bei der Geräteauthentifizierung meldet, folgen Sie den Tailscale-Hinweisen unter [Podman und Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

Der manuelle Starter liest nur eine kleine Positivliste Podman-bezogener Schlüssel aus `~/.openclaw/.env` und übergibt dem Container explizite Laufzeit-Umgebungsvariablen; er übergibt nicht die vollständige Umgebungsdatei an Podman.

<a id="podman-and-tailscale"></a>

## Podman und Tailscale

Für HTTPS oder den Remote-Browserzugriff folgen Sie der Hauptdokumentation zu Tailscale.

Podman-spezifische Hinweise:

- Belassen Sie den Podman-Veröffentlichungshost auf `127.0.0.1`.
- Bevorzugen Sie ein vom Host verwaltetes `tailscale serve` gegenüber `openclaw gateway --tailscale serve`.
- Wenn unter macOS der Geräteauthentifizierungskontext des lokalen Browsers unzuverlässig ist, verwenden Sie den Tailscale-Zugriff anstelle improvisierter lokaler Tunnel-Workarounds.

Siehe [Tailscale](/de/gateway/tailscale) und [Control UI](/de/web/control-ui).

## Systemd (Quadlet, optional)

Wenn Sie `./scripts/podman/setup.sh --quadlet` ausgeführt haben, installiert das Setup eine Quadlet-Datei unter `~/.config/containers/systemd/openclaw.container`.

| Aktion | Befehl                                     |
| ------ | ------------------------------------------ |
| Starten | `systemctl --user start openclaw.service`  |
| Stoppen | `systemctl --user stop openclaw.service`   |
| Status | `systemctl --user status openclaw.service` |
| Protokolle | `journalctl --user -u openclaw.service -f` |

Nach dem Bearbeiten der Quadlet-Datei:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Aktivieren Sie für die Startpersistenz auf SSH-/Headless-Hosts das Lingering für Ihren aktuellen Benutzer:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Der generierte Quadlet-Dienst behält eine feste, gehärtete Standardkonfiguration bei: auf `127.0.0.1` veröffentlichte Ports (`18789` für den Gateway, `18790` für die Bridge), `--bind lan` innerhalb des Containers, `keep-id`-Benutzernamensraum, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` und `TimeoutStartSec=300`. Er liest `~/.openclaw/.env` als Laufzeit-`EnvironmentFile` für Werte wie `OPENCLAW_GATEWAY_TOKEN`, verwendet jedoch nicht die Podman-spezifische Überschreibungs-Zulassungsliste des manuellen Launchers. Verwenden Sie für benutzerdefinierte Veröffentlichungsports, einen benutzerdefinierten Veröffentlichungshost oder andere Container-Ausführungsflags stattdessen den manuellen Launcher, oder bearbeiten Sie `~/.config/containers/systemd/openclaw.container` direkt und laden Sie anschließend den Dienst neu und starten Sie ihn neu.

## Konfiguration, Umgebungsvariablen und Speicher

- **Konfigurationsverzeichnis:** `~/.openclaw`
- **Arbeitsbereichsverzeichnis:** `~/.openclaw/workspace`
- **Token-Datei:** `~/.openclaw/.env`
- **Starthilfe:** `./scripts/run-openclaw-podman.sh`

Das Startskript und Quadlet binden den Hostzustand per Bind-Mount in den Container ein: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. Standardmäßig handelt es sich dabei um Hostverzeichnisse und nicht um anonymen Containerzustand, sodass `openclaw.json`, agentenspezifische `auth-profiles.json`, Kanal-/Provider-Zustand, Sitzungen und der Arbeitsbereich den Austausch des Containers überstehen. Das Setup befüllt außerdem `gateway.controlUi.allowedOrigins` für `127.0.0.1` und `localhost` am veröffentlichten Gateway-Port, damit das lokale Dashboard mit der Nicht-Loopback-Bindung des Containers funktioniert.

Nützliche Umgebungsvariablen für den manuellen Launcher (speichern Sie diese dauerhaft in `~/.openclaw/.env`; der Launcher liest diese Datei, bevor er die Container-/Image-Standardwerte festlegt):

| Variable                                   | Standardwert      | Wirkung                                        |
| ------------------------------------------ | ----------------- | ---------------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`        | Containername                                  |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local`  | Auszuführendes Image                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`           | Host-Port, der Container-Port `18789` zugeordnet ist |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`           | Host-Port, der Container-Port `18790` zugeordnet ist |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`       | Host-Schnittstelle für veröffentlichte Ports   |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`             | Gateway-Bindungsmodus innerhalb des Containers |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`         | `keep-id`, `auto` oder `host`                  |

Wenn Sie ein vom Standard abweichendes `OPENCLAW_CONFIG_DIR` oder `OPENCLAW_WORKSPACE_DIR` verwenden, setzen Sie dieselben Variablen sowohl für `./scripts/podman/setup.sh` als auch für spätere `./scripts/run-openclaw-podman.sh launch`-Befehle -- der repository-lokale Launcher speichert benutzerdefinierte Pfadüberschreibungen nicht über Shell-Sitzungen hinweg.

## Images aktualisieren

Nachdem Sie ein neues Image erstellt oder abgerufen haben, starten Sie den Container oder den Quadlet-Dienst neu.
Beim ersten Start einer neuen OpenClaw-Version führt der Gateway sichere Reparaturen
des Zustands und der Plugins durch, bevor er seine Bereitschaft meldet.

Wenn der Gateway beendet wird, anstatt betriebsbereit zu werden, führen Sie dasselbe Image einmal mit
`openclaw doctor --fix` für denselben eingebundenen Zustand und dieselbe Konfiguration aus und starten Sie anschließend den
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
eingebundenen Zustand blockiert.

## Nützliche Befehle

- **Containerprotokolle:** `podman logs -f openclaw`
- **Container stoppen:** `podman stop openclaw`
- **Container entfernen:** `podman rm -f openclaw`
- **Dashboard-URL über die Host-CLI öffnen:** `openclaw dashboard --no-open`
- **Integrität/Status über die Host-CLI:** `openclaw gateway status --deep` (RPC-Prüfung + zusätzlicher Dienstscan)

## Fehlerbehebung

- **Zugriff verweigert (EACCES) bei Konfiguration oder Arbeitsbereich:** Der Container wird standardmäßig mit `--userns=keep-id` und `--user <your uid>:<your gid>` ausgeführt. Stellen Sie sicher, dass die Konfigurations-/Arbeitsbereichspfade auf dem Host Ihrem aktuellen Benutzer gehören.
- **Gateway-Start blockiert (`gateway.mode=local` fehlt):** Stellen Sie sicher, dass `~/.openclaw/openclaw.json` vorhanden ist und `gateway.mode="local"` setzt. `scripts/podman/setup.sh` erstellt dies, falls es fehlt.
- **Container startet nach einer Image-Aktualisierung wiederholt neu:** Führen Sie den einmaligen Befehl `openclaw doctor --fix` unter [Images aktualisieren](#upgrading-images) aus und starten Sie anschließend den Gateway erneut.
- **Container-CLI-Befehle verwenden das falsche Ziel:** Verwenden Sie ausdrücklich `openclaw --container <name> ...`, oder exportieren Sie `OPENCLAW_CONTAINER=<name>` in Ihrer Shell.
- **`openclaw update` schlägt mit `--container` fehl:** Dies ist erwartetes Verhalten. Erstellen oder laden Sie das Image neu und starten Sie anschließend den Container oder den Quadlet-Dienst neu.
- **Quadlet-Dienst startet nicht:** Führen Sie `systemctl --user daemon-reload` und anschließend `systemctl --user start openclaw.service` aus. Auf Headless-Systemen müssen Sie möglicherweise außerdem `sudo loginctl enable-linger "$(whoami)"` ausführen.
- **SELinux blockiert Bind-Mounts:** Behalten Sie das standardmäßige Mount-Verhalten bei; der Launcher fügt unter Linux automatisch `:Z` hinzu, wenn SELinux im Enforcing- oder Permissive-Modus ausgeführt wird.

## Verwandte Themen

- [Docker](/de/install/docker)
- [Gateway-Hintergrundprozess](/de/gateway/background-process)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
