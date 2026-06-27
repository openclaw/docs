---
read_when:
    - Sie möchten ein containerisiertes Gateway mit Podman statt Docker betreiben
summary: OpenClaw in einem rootless Podman-Container ausführen
title: Podman
x-i18n:
    generated_at: "2026-06-27T17:38:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

Führen Sie den OpenClaw Gateway in einem rootless Podman-Container aus, verwaltet von Ihrem aktuellen Nicht-root-Benutzer.

Das vorgesehene Modell ist:

- Podman führt den Gateway-Container aus.
- Ihre Host-`openclaw`-CLI ist die Steuerungsebene.
- Persistenter Zustand liegt standardmäßig auf dem Host unter `~/.openclaw`.
- Die tägliche Verwaltung verwendet `openclaw --container <name> ...` statt `sudo -u openclaw`, `podman exec` oder einen separaten Dienstbenutzer.

## Voraussetzungen

- **Podman** im rootless-Modus
- **OpenClaw CLI** auf dem Host installiert
- **Optional:** `systemd --user`, wenn Sie von Quadlet verwalteten Autostart möchten
- **Optional:** `sudo` nur, wenn Sie `loginctl enable-linger "$(whoami)"` für Boot-Persistenz auf einem headless Host möchten

## Schnellstart

<Steps>
  <Step title="Einmalige Einrichtung">
    Führen Sie im Repo-Root `./scripts/podman/setup.sh` aus.
  </Step>

  <Step title="Gateway-Container starten">
    Starten Sie den Container mit `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Onboarding im Container ausführen">
    Führen Sie `./scripts/run-openclaw-podman.sh launch setup` aus und öffnen Sie dann `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Laufenden Container über die Host-CLI verwalten">
    Setzen Sie `OPENCLAW_CONTAINER=openclaw` und verwenden Sie dann normale `openclaw`-Befehle vom Host aus.
  </Step>
</Steps>

Einrichtungsdetails:

- `./scripts/podman/setup.sh` baut standardmäßig `openclaw:local` in Ihrem rootless Podman-Speicher oder verwendet `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, wenn Sie eines davon setzen.
- Es erstellt `~/.openclaw/openclaw.json` mit `gateway.mode: "local"`, falls die Datei fehlt.
- Es erstellt `~/.openclaw/.env` mit `OPENCLAW_GATEWAY_TOKEN`, falls die Datei fehlt.
- Für manuelle Starts liest der Helfer nur eine kleine Allowlist Podman-bezogener Schlüssel aus `~/.openclaw/.env` und übergibt explizite Runtime-Umgebungsvariablen an den Container; er übergibt nicht die vollständige Env-Datei an Podman.

Von Quadlet verwaltete Einrichtung:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet ist eine reine Linux-Option, da sie von systemd-Benutzerdiensten abhängt.

Sie können auch `OPENCLAW_PODMAN_QUADLET=1` setzen.

Optionale Build-/Setup-Env-Variablen:

- `OPENCLAW_IMAGE` oder `OPENCLAW_PODMAN_IMAGE` -- ein vorhandenes/gezogenes Image verwenden, statt `openclaw:local` zu bauen
- `OPENCLAW_IMAGE_APT_PACKAGES` -- zusätzliche apt-Pakete während des Image-Builds installieren (akzeptiert auch das Legacy-`OPENCLAW_DOCKER_APT_PACKAGES`)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- zusätzliche Python-Pakete während des Image-Builds installieren; pinnen Sie Versionen und verwenden Sie nur Paketindizes, denen Sie vertrauen
- `OPENCLAW_EXTENSIONS` -- Plugin-Abhängigkeiten zur Build-Zeit vorinstallieren
- `OPENCLAW_INSTALL_BROWSER` -- Chromium und Xvfb für Browser-Automatisierung vorinstallieren (zum Aktivieren auf `1` setzen)

Container-Start:

```bash
./scripts/run-openclaw-podman.sh launch
```

Das Skript startet den Container mit Ihrer aktuellen uid/gid per `--userns=keep-id` und bind-mountet Ihren OpenClaw-Zustand in den Container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Öffnen Sie dann `http://127.0.0.1:18789/` und verwenden Sie das Token aus `~/.openclaw/.env`.

Modell-Authentifizierung in Podman:

- Verwenden Sie während der Einrichtung OpenClaw-verwaltete Authentifizierung: Anthropic-API-Schlüssel für Anthropic oder OpenAI Codex-Browser-OAuth/Gerätecode-Authentifizierung für Codex-gestütztes OpenAI.
- Der Podman-Launcher mountet keine Host-CLI-Credential-Verzeichnisse wie `~/.claude` oder `~/.codex` in den Setup- oder Gateway-Container.
- Vorhandene Host-CLI-Anmeldungen sind Komfortpfade auf demselben Host. Halten Sie bei Container-Installationen Provider-Authentifizierung im gemounteten `~/.openclaw`-Zustand, den das Setup verwaltet.

Host-CLI-Standard:

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
Wenn die Control UI nach dem Start Geräteauthentifizierungsfehler meldet, verwenden Sie die Tailscale-Anleitung unter
[Podman und Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman und Tailscale

Für HTTPS- oder Remote-Browser-Zugriff folgen Sie der Hauptdokumentation zu Tailscale.

Podman-spezifischer Hinweis:

- Belassen Sie den Podman-Publish-Host bei `127.0.0.1`.
- Bevorzugen Sie Host-verwaltetes `tailscale serve` gegenüber `openclaw gateway --tailscale serve`.
- Wenn unter macOS der Kontext für lokale Browser-Geräteauthentifizierung unzuverlässig ist, verwenden Sie Tailscale-Zugriff statt Ad-hoc-Workarounds mit lokalen Tunneln.

Siehe:

- [Tailscale](/de/gateway/tailscale)
- [Control UI](/de/web/control-ui)

## Systemd (Quadlet, optional)

Wenn Sie `./scripts/podman/setup.sh --quadlet` ausgeführt haben, installiert das Setup eine Quadlet-Datei unter:

```bash
~/.config/containers/systemd/openclaw.container
```

Nützliche Befehle:

- **Start:** `systemctl --user start openclaw.service`
- **Stopp:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Logs:** `journalctl --user -u openclaw.service -f`

Nach dem Bearbeiten der Quadlet-Datei:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Aktivieren Sie für Boot-Persistenz auf SSH-/headless Hosts Lingering für Ihren aktuellen Benutzer:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfiguration, Env und Speicher

- **Konfigurationsverzeichnis:** `~/.openclaw`
- **Workspace-Verzeichnis:** `~/.openclaw/workspace`
- **Token-Datei:** `~/.openclaw/.env`
- **Start-Helfer:** `./scripts/run-openclaw-podman.sh`

Das Startskript und Quadlet bind-mounten Host-Zustand in den Container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Standardmäßig sind dies Host-Verzeichnisse, kein anonymer Container-Zustand, sodass
`openclaw.json`, agentenspezifische `auth-profiles.json`, Channel-/Provider-Zustand,
Sitzungen und Workspace einen Container-Austausch überstehen.
Das Podman-Setup setzt außerdem `gateway.controlUi.allowedOrigins` für `127.0.0.1` und `localhost` auf dem veröffentlichten Gateway-Port, damit das lokale Dashboard mit dem Nicht-loopback-Bind des Containers funktioniert.

Nützliche Env-Variablen für den manuellen Launcher:

- `OPENCLAW_PODMAN_CONTAINER` -- Container-Name (standardmäßig `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- auszuführendes Image
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- Host-Port, der auf Container `18789` gemappt wird
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- Host-Port, der auf Container `18790` gemappt wird
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- Host-Schnittstelle für veröffentlichte Ports; Standard ist `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- Gateway-Bind-Modus innerhalb des Containers; Standard ist `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (Standard), `auto` oder `host`

Der manuelle Launcher liest `~/.openclaw/.env`, bevor Container-/Image-Standards finalisiert werden, sodass Sie diese dort persistent speichern können.

Wenn Sie ein nicht standardmäßiges `OPENCLAW_CONFIG_DIR` oder `OPENCLAW_WORKSPACE_DIR` verwenden, setzen Sie dieselben Variablen sowohl für `./scripts/podman/setup.sh` als auch für spätere `./scripts/run-openclaw-podman.sh launch`-Befehle. Der repo-lokale Launcher persistiert benutzerdefinierte Pfad-Overrides nicht über Shells hinweg.

Quadlet-Hinweis:

- Der generierte Quadlet-Dienst behält absichtlich eine feste, gehärtete Standardform bei: veröffentlichte Ports auf `127.0.0.1`, `--bind lan` innerhalb des Containers und `keep-id`-Benutzer-Namespace.
- Er pinnt `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` und `TimeoutStartSec=300`.
- Er veröffentlicht sowohl `127.0.0.1:18789:18789` (Gateway) als auch `127.0.0.1:18790:18790` (Bridge).
- Er liest `~/.openclaw/.env` als Runtime-`EnvironmentFile` für Werte wie `OPENCLAW_GATEWAY_TOKEN`, konsumiert jedoch nicht die Podman-spezifische Override-Allowlist des manuellen Launchers.
- Wenn Sie benutzerdefinierte Publish-Ports, einen Publish-Host oder andere Container-Run-Flags benötigen, verwenden Sie den manuellen Launcher oder bearbeiten Sie `~/.config/containers/systemd/openclaw.container` direkt und laden und starten Sie den Dienst anschließend neu.

## Nützliche Befehle

- **Container-Logs:** `podman logs -f openclaw`
- **Container stoppen:** `podman stop openclaw`
- **Container entfernen:** `podman rm -f openclaw`
- **Dashboard-URL über Host-CLI öffnen:** `openclaw dashboard --no-open`
- **Health/Status über Host-CLI:** `openclaw gateway status --deep` (RPC-Probe + zusätzlicher
  Dienstscan)

## Fehlerbehebung

- **Berechtigung verweigert (EACCES) bei Konfiguration oder Workspace:** Der Container läuft standardmäßig mit `--userns=keep-id` und `--user <your uid>:<your gid>`. Stellen Sie sicher, dass die Host-Konfigurations-/Workspace-Pfade Ihrem aktuellen Benutzer gehören.
- **Gateway-Start blockiert (fehlendes `gateway.mode=local`):** Stellen Sie sicher, dass `~/.openclaw/openclaw.json` existiert und `gateway.mode="local"` setzt. `scripts/podman/setup.sh` erstellt dies, falls es fehlt.
- **Container-CLI-Befehle treffen das falsche Ziel:** Verwenden Sie explizit `openclaw --container <name> ...` oder exportieren Sie `OPENCLAW_CONTAINER=<name>` in Ihrer Shell.
- **`openclaw update` schlägt mit `--container` fehl:** Erwartet. Bauen/ziehen Sie das Image neu und starten Sie dann den Container oder den Quadlet-Dienst neu.
- **Quadlet-Dienst startet nicht:** Führen Sie `systemctl --user daemon-reload` und dann `systemctl --user start openclaw.service` aus. Auf headless Systemen benötigen Sie möglicherweise zusätzlich `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blockiert Bind-Mounts:** Lassen Sie das Standard-Mount-Verhalten unverändert; der Launcher fügt unter Linux automatisch `:Z` hinzu, wenn SELinux enforcing oder permissive ist.

## Verwandt

- [Docker](/de/install/docker)
- [Gateway-Hintergrundprozess](/de/gateway/background-process)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
