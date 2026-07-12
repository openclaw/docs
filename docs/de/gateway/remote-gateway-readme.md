---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Einrichtung eines SSH-Tunnels für OpenClaw.app zur Verbindung mit einem entfernten Gateway
title: Einrichtung eines Remote-Gateways
x-i18n:
    generated_at: "2026-07-12T01:41:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 842578eb74e99d115b04abff5e9673a6454fa6d2cf7905d056999469e1c6b66d
    source_path: gateway/remote-gateway-readme.md
    workflow: 16
---

<Note>
Dieser Inhalt befindet sich jetzt unter [Remotezugriff](/de/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Verwenden Sie diese Seite für die aktuelle Anleitung; diese Seite bleibt als Weiterleitungsziel bestehen.
</Note>

# OpenClaw.app mit einem entfernten Gateway ausführen

OpenClaw.app erreicht einen entfernten Gateway über einen SSH-Tunnel: Ein SSH-`LocalForward` ordnet einen lokalen Port dem Gateway-WebSocket-Port auf dem entfernten Host zu.

```mermaid
flowchart TB
    subgraph Client["Client-Computer"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(lokaler Port)"]
        T["SSH-Tunnel"]

        A --> B
        B --> T
    end
    subgraph Remote["Entfernter Computer"]
        direction TB
        C["Gateway-WebSocket"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## Einrichtung

1. Fügen Sie einen SSH-Konfigurationseintrag mit `LocalForward 18789 127.0.0.1:18789` hinzu (den vollständigen Konfigurationsblock finden Sie unter [Remotezugriff](/de/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent)).
2. Kopieren Sie Ihren SSH-Schlüssel mit `ssh-copy-id` auf den entfernten Host.
3. Legen Sie `gateway.remote.token` (oder `gateway.remote.password`) mit `openclaw config set gateway.remote.token "<your-token>"` fest.
4. Starten Sie den Tunnel: `ssh -N remote-gateway &`.
5. Beenden und öffnen Sie OpenClaw.app erneut.

Für einen Tunnel, der Neustarts übersteht und die Verbindung automatisch wiederherstellt, verwenden Sie statt eines manuellen `ssh -N` die LaunchAgent-Einrichtung auf der Seite [Remotezugriff](/de/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent).

## Funktionsweise

| Komponente                           | Funktion                                                             |
| ------------------------------------ | -------------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Leitet den lokalen Port 18789 an den entfernten Port 18789 weiter    |
| `ssh -N`                             | SSH ohne Ausführung entfernter Befehle (nur Portweiterleitung)       |
| `KeepAlive`                          | Startet den Tunnel nach einem Absturz automatisch neu (LaunchAgent)  |
| `RunAtLoad`                          | Startet den Tunnel beim Laden des LaunchAgent (LaunchAgent)          |

OpenClaw.app stellt auf dem Client eine Verbindung zu `ws://127.0.0.1:18789` her. Der Tunnel leitet diese Verbindung an Port 18789 auf dem entfernten Host weiter, auf dem der Gateway ausgeführt wird.

## Verwandte Themen

- [Remotezugriff](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)
