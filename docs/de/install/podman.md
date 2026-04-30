---
read_when:
    - Sie möchten ein containerisiertes Gateway mit Podman statt Docker
summary: OpenClaw in einem rootless Podman-Container ausführen
title: Podman
x-i18n:
    generated_at: "2026-04-30T07:01:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

Führen Sie den OpenClaw Gateway in einem rootless Podman-Container aus, verwaltet durch Ihren aktuellen Nicht-root-Benutzer.

Das vorgesehene Modell ist:

- Podman führt den Gateway-Container aus.
- Ihre Host-`openclaw`-CLI ist die Control Plane.
- Persistenter Zustand liegt standardmäßig auf dem Host unter `~/.openclaw`.
- Die tägliche Verwaltung verwendet `openclaw --container <name> ...` statt `sudo -u openclaw`, `podman exec` oder einen separaten Dienstbenutzer.

## Voraussetzungen

- **Podman** im rootless-Modus
- **OpenClaw CLI** auf dem Host installiert
- **Optional:** `systemd --user`, wenn Sie einen durch Quadlet verwalteten Autostart möchten
- **Optional:** `sudo` nur, wenn Sie `loginctl enable-linger "$(whoami)"` für Boot-Persistenz auf einem Headless-Host verwenden möchten

## Schnellstart

<Steps>
  <Step title="Einmalige Einrichtung">
    Führen Sie aus dem Repo-Root `./scripts/podman/setup.sh` aus.
  </Step>

  <Step title="Gateway-Container starten">
    Starten Sie den Container mit `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Onboarding im Container ausführen">
    Führen Sie `./scripts/run-openclaw-podman.sh launch setup` aus und öffnen Sie dann `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Laufenden Container über die Host-CLI verwalten">
    Setzen Sie `OPENCLAW_CONTAINER=openclaw` und verwenden Sie dann normale `openclaw`-Befehle vom Host.
  </Step>
</Steps>

Einrichtungsdetails:

- `./scripts/podman/setup.sh` baut standardmäßig `openclaw:local` in Ihrem rootless Podman-Store oder verwendet `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, wenn Sie eines davon setzen.
- Es erstellt `~/.openclaw/openclaw.json` mit `gateway.mode: "local"`, falls diese fehlt.
- Es erstellt `~/.openclaw/.env` mit `OPENCLAW_GATEWAY_TOKEN`, falls diese fehlt.
- Für manuelle Starts liest der Helfer nur eine kleine Allowlist Podman-bezogener Schlüssel aus `~/.openclaw/.env` und übergibt explizite Runtime-Umgebungsvariablen an den Container; er übergibt Podman nicht die vollständige env-Datei.

Durch Quadlet verwaltete Einrichtung:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet ist eine reine Linux-Option, da es von systemd-Benutzerdiensten abhängt.

Sie können auch `OPENCLAW_PODMAN_QUADLET=1` setzen.

Optionale Build-/Setup-Umgebungsvariablen:

- `OPENCLAW_IMAGE` oder `OPENCLAW_PODMAN_IMAGE` -- ein vorhandenes/heruntergeladenes Image verwenden, statt `openclaw:local` zu bauen
- `OPENCLAW_DOCKER_APT_PACKAGES` -- zusätzliche apt-Pakete während des Image-Builds installieren
- `OPENCLAW_EXTENSIONS` -- Plugin-Abhängigkeiten zur Build-Zeit vorinstallieren
- `OPENCLAW_INSTALL_BROWSER` -- Chromium und Xvfb für Browser-Automatisierung vorinstallieren (zum Aktivieren auf `1` setzen)

Container starten:

```bash
./scripts/run-openclaw-podman.sh launch
```

Das Skript startet den Container mit Ihrer aktuellen uid/gid mit `--userns=keep-id` und bind-mountet Ihren OpenClaw-Zustand in den Container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Öffnen Sie dann `http://127.0.0.1:18789/` und verwenden Sie das Token aus `~/.openclaw/.env`.

Standard für die Host-CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Dann werden Befehle wie diese automatisch in diesem Container ausgeführt:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Unter macOS kann Podman machine dazu führen, dass der Browser für den Gateway nicht lokal erscheint.
Wenn die Control UI nach dem Start Geräteauthentifizierungsfehler meldet, verwenden Sie die Tailscale-Anleitung in
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Für HTTPS oder Remote-Browserzugriff folgen Sie der Hauptdokumentation zu Tailscale.

Podman-spezifischer Hinweis:

- Behalten Sie den Podman-Publish-Host bei `127.0.0.1`.
- Bevorzugen Sie hostverwaltetes `tailscale serve` gegenüber `openclaw gateway --tailscale serve`.
- Unter macOS sollten Sie Tailscale-Zugriff statt Ad-hoc-Workarounds mit lokalen Tunneln verwenden, wenn der lokale Browser-Geräteauthentifizierungskontext unzuverlässig ist.

Siehe:

- [Tailscale](/de/gateway/tailscale)
- [Control UI](/de/web/control-ui)

## Systemd (Quadlet, optional)

Wenn Sie `./scripts/podman/setup.sh --quadlet` ausgeführt haben, installiert das Setup eine Quadlet-Datei unter:

```bash
~/.config/containers/systemd/openclaw.container
```

Nützliche Befehle:

- **Starten:** `systemctl --user start openclaw.service`
- **Stoppen:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Logs:** `journalctl --user -u openclaw.service -f`

Nach dem Bearbeiten der Quadlet-Datei:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Für Boot-Persistenz auf SSH-/Headless-Hosts aktivieren Sie Lingering für Ihren aktuellen Benutzer:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfiguration, env und Speicher

- **Konfigurationsverzeichnis:** `~/.openclaw`
- **Workspace-Verzeichnis:** `~/.openclaw/workspace`
- **Token-Datei:** `~/.openclaw/.env`
- **Start-Helfer:** `./scripts/run-openclaw-podman.sh`

Das Startskript und Quadlet bind-mounten Host-Zustand in den Container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Standardmäßig sind dies Host-Verzeichnisse und kein anonymer Container-Zustand, sodass
`openclaw.json`, `auth-profiles.json` je Agent, Kanal-/Provider-Zustand,
Sitzungen und Workspace den Austausch des Containers überdauern.
Das Podman-Setup setzt außerdem `gateway.controlUi.allowedOrigins` für `127.0.0.1` und `localhost` auf dem veröffentlichten Gateway-Port vor, damit das lokale Dashboard mit dem Nicht-loopback-Bind des Containers funktioniert.

Nützliche Umgebungsvariablen für den manuellen Launcher:

- `OPENCLAW_PODMAN_CONTAINER` -- Containername (standardmäßig `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- auszuführendes Image
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- Host-Port, der auf Container `18789` abgebildet wird
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- Host-Port, der auf Container `18790` abgebildet wird
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- Host-Schnittstelle für veröffentlichte Ports; Standard ist `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- Gateway-Bind-Modus innerhalb des Containers; Standard ist `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (Standard), `auto` oder `host`

Der manuelle Launcher liest `~/.openclaw/.env`, bevor Container-/Image-Standards finalisiert werden, sodass Sie diese dort dauerhaft speichern können.

Wenn Sie ein nicht standardmäßiges `OPENCLAW_CONFIG_DIR` oder `OPENCLAW_WORKSPACE_DIR` verwenden, setzen Sie dieselben Variablen sowohl für `./scripts/podman/setup.sh` als auch für spätere `./scripts/run-openclaw-podman.sh launch`-Befehle. Der repo-lokale Launcher speichert benutzerdefinierte Pfadüberschreibungen nicht über Shells hinweg.

Quadlet-Hinweis:

- Der generierte Quadlet-Dienst behält absichtlich eine feste, gehärtete Standardform bei: auf `127.0.0.1` veröffentlichte Ports, `--bind lan` innerhalb des Containers und `keep-id`-Benutzernamespace.
- Er setzt `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` und `TimeoutStartSec=300` fest.
- Er veröffentlicht sowohl `127.0.0.1:18789:18789` (Gateway) als auch `127.0.0.1:18790:18790` (Bridge).
- Er liest `~/.openclaw/.env` als Runtime-`EnvironmentFile` für Werte wie `OPENCLAW_GATEWAY_TOKEN`, verwendet jedoch nicht die Podman-spezifische Override-Allowlist des manuellen Launchers.
- Wenn Sie benutzerdefinierte Publish-Ports, Publish-Host oder andere Container-Run-Flags benötigen, verwenden Sie den manuellen Launcher oder bearbeiten Sie `~/.config/containers/systemd/openclaw.container` direkt, laden Sie dann neu und starten Sie den Dienst neu.

## Nützliche Befehle

- **Container-Logs:** `podman logs -f openclaw`
- **Container stoppen:** `podman stop openclaw`
- **Container entfernen:** `podman rm -f openclaw`
- **Dashboard-URL über Host-CLI öffnen:** `openclaw dashboard --no-open`
- **Health/Status über Host-CLI:** `openclaw gateway status --deep` (RPC-Probe + zusätzlicher
  Dienstscan)

## Fehlerbehebung

- **Zugriff verweigert (EACCES) für Konfiguration oder Workspace:** Der Container wird standardmäßig mit `--userns=keep-id` und `--user <your uid>:<your gid>` ausgeführt. Stellen Sie sicher, dass die Host-Pfade für Konfiguration/Workspace Ihrem aktuellen Benutzer gehören.
- **Gateway-Start blockiert (fehlendes `gateway.mode=local`):** Stellen Sie sicher, dass `~/.openclaw/openclaw.json` existiert und `gateway.mode="local"` setzt. `scripts/podman/setup.sh` erstellt dies, falls es fehlt.
- **Container-CLI-Befehle treffen das falsche Ziel:** Verwenden Sie explizit `openclaw --container <name> ...` oder exportieren Sie `OPENCLAW_CONTAINER=<name>` in Ihrer Shell.
- **`openclaw update` schlägt mit `--container` fehl:** Erwartet. Bauen/laden Sie das Image neu herunter und starten Sie dann den Container oder den Quadlet-Dienst neu.
- **Quadlet-Dienst startet nicht:** Führen Sie `systemctl --user daemon-reload` und dann `systemctl --user start openclaw.service` aus. Auf Headless-Systemen benötigen Sie möglicherweise auch `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blockiert Bind-Mounts:** Lassen Sie das Standard-Mount-Verhalten unverändert; der Launcher fügt unter Linux automatisch `:Z` hinzu, wenn SELinux im enforcing- oder permissive-Modus ist.

## Verwandte Themen

- [Docker](/de/install/docker)
- [Gateway-Hintergrundprozess](/de/gateway/background-process)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
