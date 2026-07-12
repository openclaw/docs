---
read_when:
    - Mehr als einen Gateway auf demselben Rechner ausführen
    - Sie benötigen separate Konfigurationen, Zustände und Ports für jedes Gateway.
summary: Mehrere OpenClaw-Gateways auf einem Host ausführen (Isolierung, Ports und Profile)
title: Mehrere Gateways
x-i18n:
    generated_at: "2026-07-12T01:40:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Die meisten Setups benötigen ein Gateway – ein einzelnes Gateway verwaltet mehrere Messaging-Verbindungen und Agenten. Führen Sie separate Gateways mit isolierten Profilen/Ports nur aus, wenn Sie eine stärkere Isolation oder Redundanz benötigen (z. B. einen Rettungs-Bot).

## Schnellstart für einen Rettungs-Bot

Das einfachste Setup für einen Rettungs-Bot:

- Behalten Sie für den Haupt-Bot das Standardprofil bei.
- Führen Sie den Rettungs-Bot mit `--profile rescue` und einem eigenen Telegram-Bot-Token aus.
- Verwenden Sie für den Rettungs-Bot einen anderen Basisport, z. B. `19789`.

So kann der Rettungs-Bot weiterhin Fehler diagnostizieren oder Konfigurationsänderungen anwenden, wenn der primäre Bot ausgefallen ist. Lassen Sie zwischen den Basisports mindestens 20 Ports Abstand, damit abgeleitete Browser-/CDP-Ports niemals kollidieren.

```bash
# Rettungs-Bot (separater Telegram-Bot, separates Profil, Port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Wenn Ihr Haupt-Bot bereits läuft, ist das normalerweise alles, was Sie benötigen. Falls das Onboarding den Rettungsdienst bereits installiert hat, überspringen Sie den abschließenden Befehl `gateway install`.

Während `openclaw --profile rescue onboard`:

- Verwenden Sie ein separates Telegram-Bot-Token, das ausschließlich für das Rettungskonto bestimmt ist (so lässt es sich problemlos auf Operatoren beschränken, bleibt unabhängig von der Kanal-/App-Installation des Haupt-Bots und bietet einen einfachen DM-basierten Wiederherstellungsweg).
- Behalten Sie den Profilnamen `rescue` bei.
- Verwenden Sie einen Basisport, der mindestens 20 höher als der des Haupt-Bots ist.
- Übernehmen Sie den standardmäßigen Rettungs-Workspace, sofern Sie nicht bereits selbst einen verwalten.

### Was `--profile rescue onboard` ändert

`--profile rescue onboard` führt den normalen Onboarding-Ablauf aus, schreibt jedoch alles in ein separates Profil. Dadurch erhält der Rettungs-Bot eigene Ressourcen:

- Profil-/Konfigurationsdatei
- Zustandsverzeichnis
- Workspace (Standard: `~/.openclaw/workspace-rescue`)
- Name des verwalteten Dienstes
- Basisport (einschließlich abgeleiteter Ports)
- Telegram-Bot-Token

Die Eingabeaufforderungen sind ansonsten mit dem normalen Onboarding identisch.

## Allgemeines Multi-Gateway-Setup

Dasselbe Isolationsmuster funktioniert für jedes Paar oder jede Gruppe von Gateways auf einem Host – weisen Sie jedem zusätzlichen Gateway ein eigenes benanntes Profil und einen eigenen Basisport zu:

```bash
# Hauptinstanz (Standardprofil)
openclaw setup
openclaw gateway --port 18789

# Zusätzliches Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Benannte Profile auf beiden Seiten funktionieren ebenfalls:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Für Dienste gilt dasselbe Muster:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Verwenden Sie den Schnellstart für einen Rettungs-Bot als Ausweichkanal für Operatoren. Verwenden Sie das allgemeine Profilmuster für mehrere langlebige Gateways über verschiedene Kanäle, Mandanten, Workspaces oder Betriebsrollen hinweg.

## Isolationscheckliste

Halten Sie diese Einstellungen für jede Gateway-Instanz eindeutig:

| Einstellung                  | Zweck                                             |
| ---------------------------- | ------------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | Konfigurationsdatei pro Instanz                   |
| `OPENCLAW_STATE_DIR`         | Sitzungen, Anmeldedaten und Caches pro Instanz    |
| `agents.defaults.workspace`  | Workspace-Stammverzeichnis pro Instanz            |
| `gateway.port` (oder `--port`) | Eindeutig pro Instanz                           |
| Abgeleitete Browser-/CDP-Ports | Siehe unten                                     |

Wenn Sie eine dieser Ressourcen gemeinsam verwenden, führt dies zu Konflikten beim Konfigurationszugriff und bei den Ports.

## Portzuordnung (abgeleitet)

Basisport = `gateway.port` (oder `OPENCLAW_GATEWAY_PORT` / `--port`).

- Port des Browsersteuerungsdienstes = Basisport + 2 (nur local loopback).
- Der Canvas-Host wird direkt über den HTTP-Server des Gateway bereitgestellt (derselbe Port wie `gateway.port`).
- Die CDP-Ports der Browserprofile werden automatisch im Bereich von `browser control port + 9` bis `+ 108` zugewiesen.

Wenn Sie einen dieser Werte in der Konfiguration oder über Umgebungsvariablen überschreiben, müssen Sie ihn für jede Instanz eindeutig halten.

## Hinweise zu Browser/CDP (häufige Fehlerquelle)

- Legen Sie `browser.cdpUrl` **nicht** für mehrere Instanzen auf denselben Wert fest.
- Jede Instanz benötigt einen eigenen Browsersteuerungsport und CDP-Bereich (abgeleitet von ihrem Gateway-Port).
- Legen Sie für explizite CDP-Ports `browser.profiles.<name>.cdpPort` pro Instanz fest.
- Verwenden Sie für eine entfernte Chrome-Instanz `browser.profiles.<name>.cdpUrl` (pro Profil und Instanz).

## Manuelles Beispiel mit Umgebungsvariablen

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Schnellprüfungen

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

- `gateway status --deep` erkennt veraltete launchd-/systemd-/schtasks-Dienste aus älteren Installationen.
- Warntexte von `gateway probe` wie `multiple reachable gateway identities detected` sind nur zu erwarten, wenn Sie absichtlich mehr als ein isoliertes Gateway ausführen oder wenn OpenClaw nicht nachweisen kann, dass die erreichbaren Prüfziele dasselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zum selben Gateway stellen ein Gateway mit mehreren Transportwegen dar, selbst wenn sich deren Ports unterscheiden.

## Verwandte Themen

- [Gateway-Betriebshandbuch](/de/gateway)
- [Gateway-Sperre](/de/gateway/gateway-lock)
- [Konfiguration](/de/gateway/configuration)
