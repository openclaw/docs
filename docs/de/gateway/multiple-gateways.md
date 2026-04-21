---
read_when:
    - Mehr als ein Gateway auf demselben Rechner ausführen
    - Sie benötigen isolierte Konfigurationen/Zustände/Ports pro Gateway
summary: Mehrere OpenClaw Gateways auf einem Host ausführen (Isolation, Ports und Profile)
title: Mehrere Gateways
x-i18n:
    generated_at: "2026-04-21T19:20:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Mehrere Gateways (derselbe Host)

Die meisten Setups sollten ein Gateway verwenden, weil ein einzelnes Gateway mehrere Messaging-Verbindungen und Agents verarbeiten kann. Wenn Sie stärkere Isolation oder Redundanz benötigen (z. B. einen Rescue-Bot), führen Sie separate Gateways mit isolierten Profilen/Ports aus.

## Am besten empfohlenes Setup

Für die meisten Nutzer ist das einfachste Rescue-Bot-Setup:

- den Haupt-Bot im Standardprofil belassen
- den Rescue-Bot mit `--profile rescue` ausführen
- für das Rescue-Konto einen vollständig separaten Telegram-Bot verwenden
- den Rescue-Bot auf einem anderen Basis-Port wie `19789` belassen

Dadurch bleibt der Rescue-Bot vom Haupt-Bot isoliert, sodass er Debugging durchführen oder
Konfigurationsänderungen anwenden kann, wenn der primäre Bot ausfällt. Lassen Sie mindestens 20 Ports Abstand zwischen den
Basis-Ports, damit die abgeleiteten Browser-/Canvas-/CDP-Ports niemals kollidieren.

## Rescue-Bot-Schnellstart

Verwenden Sie dies als Standardpfad, sofern Sie keinen triftigen Grund haben, etwas
anderes zu tun:

```bash
# Rescue-Bot (separater Telegram-Bot, separates Profil, Port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Wenn Ihr Haupt-Bot bereits läuft, ist das normalerweise alles, was Sie brauchen.

Während `openclaw --profile rescue onboard`:

- verwenden Sie den separaten Telegram-Bot-Token
- behalten Sie das Profil `rescue`
- verwenden Sie einen Basis-Port, der mindestens 20 höher ist als beim Haupt-Bot
- akzeptieren Sie den Standard-Workspace für den Rescue-Bot, sofern Sie nicht bereits selbst einen verwalten

Wenn das Onboarding den Rescue-Dienst bereits für Sie installiert hat, ist das abschließende
`gateway install` nicht erforderlich.

## Warum das funktioniert

Der Rescue-Bot bleibt unabhängig, weil er seine eigenen folgenden Ressourcen hat:

- Profil/Konfiguration
- Zustandsverzeichnis
- Workspace
- Basis-Port (plus abgeleitete Ports)
- Telegram-Bot-Token

Für die meisten Setups verwenden Sie für das Rescue-Profil einen vollständig separaten Telegram-Bot:

- leicht auf nur Operatoren beschränkbar
- separater Bot-Token und eigene Identität
- unabhängig von der Kanal-/App-Installation des Haupt-Bots
- einfacher DM-basierter Wiederherstellungspfad, wenn der Haupt-Bot defekt ist

## Was `--profile rescue onboard` ändert

`openclaw --profile rescue onboard` verwendet den normalen Onboarding-Ablauf, schreibt aber
alles in ein separates Profil.

In der Praxis bedeutet das, dass der Rescue-Bot seine eigenen folgenden Ressourcen erhält:

- Konfigurationsdatei
- Zustandsverzeichnis
- Workspace (standardmäßig `~/.openclaw/workspace-rescue`)
- Name des verwalteten Dienstes

Die Eingabeaufforderungen sind ansonsten dieselben wie beim normalen Onboarding.

## Allgemeines Multi-Gateway-Setup

Das oben gezeigte Rescue-Bot-Layout ist der einfachste Standard, aber dasselbe Isolationsmuster
funktioniert für jedes Paar oder jede Gruppe von Gateways auf einem Host.

Für ein allgemeineres Setup geben Sie jedem zusätzlichen Gateway sein eigenes benanntes Profil und seinen
eigenen Basis-Port:

```bash
# main (Standardprofil)
openclaw setup
openclaw gateway --port 18789

# zusätzliches Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Wenn Sie möchten, dass beide Gateways benannte Profile verwenden, funktioniert das ebenfalls:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Dienste folgen demselben Muster:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Verwenden Sie den Rescue-Bot-Schnellstart, wenn Sie eine Fallback-Bedienebene möchten. Verwenden Sie das
allgemeine Profilmuster, wenn Sie mehrere langlebige Gateways für
verschiedene Kanäle, Mandanten, Workspaces oder betriebliche Rollen möchten.

## Isolations-Checkliste

Halten Sie diese Werte pro Gateway-Instanz eindeutig:

- `OPENCLAW_CONFIG_PATH` — instanzspezifische Konfigurationsdatei
- `OPENCLAW_STATE_DIR` — instanzspezifische Sitzungen, Zugangsdaten, Caches
- `agents.defaults.workspace` — instanzspezifisches Workspace-Stammverzeichnis
- `gateway.port` (oder `--port`) — eindeutig pro Instanz
- abgeleitete Browser-/Canvas-/CDP-Ports

Wenn diese gemeinsam genutzt werden, treten Konfigurationsrennen und Portkonflikte auf.

## Portzuordnung (abgeleitet)

Basis-Port = `gateway.port` (oder `OPENCLAW_GATEWAY_PORT` / `--port`).

- Port des Browser-Steuerungsdienstes = Basis-Port + 2 (nur loopback)
- Canvas-Host wird auf dem Gateway-HTTP-Server bereitgestellt (derselbe Port wie `gateway.port`)
- CDP-Ports des Browser-Profils werden automatisch aus `browser.controlPort + 9 .. + 108` zugewiesen

Wenn Sie einen dieser Werte in der Konfiguration oder in Umgebungsvariablen überschreiben, müssen Sie sie pro Instanz eindeutig halten.

## Browser-/CDP-Hinweise (häufige Stolperfalle)

- `browser.cdpUrl` **nicht** auf dieselben Werte bei mehreren Instanzen festlegen.
- Jede Instanz benötigt ihren eigenen Browser-Steuerungsport und ihren eigenen CDP-Bereich (abgeleitet aus ihrem Gateway-Port).
- Wenn Sie explizite CDP-Ports benötigen, setzen Sie `browser.profiles.<name>.cdpPort` pro Instanz.
- Remote-Chrome: Verwenden Sie `browser.profiles.<name>.cdpUrl` (pro Profil, pro Instanz).

## Manuelles Umgebungsvariablen-Beispiel

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Schnelle Prüfungen

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretation:

- `gateway status --deep` hilft dabei, veraltete launchd-/systemd-/schtasks-Dienste aus älteren Installationen zu erkennen.
- Warntext von `gateway probe` wie `multiple reachable gateways detected` ist nur dann zu erwarten, wenn Sie absichtlich mehr als ein isoliertes Gateway ausführen.
