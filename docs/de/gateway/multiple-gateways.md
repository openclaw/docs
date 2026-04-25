---
read_when:
    - Mehr als ein Gateway auf derselben Maschine ausführen
    - Du benötigst isolierte Konfiguration/State/Ports pro Gateway.
summary: Mehrere OpenClaw-Gateways auf einem Host ausführen (Isolierung, Ports und Profile)
title: Mehrere Gateways
x-i18n:
    generated_at: "2026-04-25T13:47:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

Die meisten Setups sollten ein Gateway verwenden, weil ein einzelnes Gateway mehrere Messaging-Verbindungen und Agenten verarbeiten kann. Wenn du stärkere Isolierung oder Redundanz benötigst (z. B. einen Rescue-Bot), führe separate Gateways mit isolierten Profilen/Ports aus.

## Beste empfohlene Einrichtung

Für die meisten Benutzer ist das einfachste Rescue-Bot-Setup:

- den Haupt-Bot im Standardprofil belassen
- den Rescue-Bot mit `--profile rescue` ausführen
- für das Rescue-Konto einen vollständig separaten Telegram-Bot verwenden
- den Rescue-Bot auf einem anderen Basis-Port wie `19789` belassen

Dadurch bleibt der Rescue-Bot vom Haupt-Bot isoliert, sodass er debuggen oder
Konfigurationsänderungen anwenden kann, wenn der primäre Bot ausgefallen ist. Lass mindestens 20 Ports Abstand zwischen
den Basis-Ports, damit die abgeleiteten Browser-/Canvas-/CDP-Ports nie kollidieren.

## Schnellstart für den Rescue-Bot

Verwende dies als Standardpfad, sofern du keinen triftigen Grund hast, etwas
anderes zu tun:

```bash
# Rescue-Bot (separater Telegram-Bot, separates Profil, Port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Wenn dein Haupt-Bot bereits läuft, ist das normalerweise alles, was du brauchst.

Während `openclaw --profile rescue onboard`:

- verwende den separaten Telegram-Bot-Token
- behalte das Profil `rescue`
- verwende einen Basis-Port, der mindestens 20 höher als beim Haupt-Bot liegt
- akzeptiere den Standard-Workspace für den Rescue-Bot, sofern du nicht bereits selbst einen verwaltest

Wenn das Onboarding den Rescue-Dienst bereits für dich installiert hat, ist das abschließende
`gateway install` nicht erforderlich.

## Warum das funktioniert

Der Rescue-Bot bleibt unabhängig, weil er seine eigene:

- Profil/Konfiguration
- State-Verzeichnis
- Workspace
- Basis-Port (plus abgeleitete Ports)
- Telegram-Bot-Token

hat.

Für die meisten Setups solltest du für das Rescue-Profil einen vollständig separaten Telegram-Bot verwenden:

- leicht als nur für Operatoren nutzbar zu halten
- separater Bot-Token und eigene Identität
- unabhängig von der Kanal-/App-Installation des Haupt-Bots
- einfacher DM-basierter Wiederherstellungspfad, wenn der Haupt-Bot defekt ist

## Was `--profile rescue onboard` ändert

`openclaw --profile rescue onboard` verwendet den normalen Onboarding-Ablauf, aber es
schreibt alles in ein separates Profil.

In der Praxis bedeutet das, dass der Rescue-Bot seine eigene:

- Konfigurationsdatei
- State-Verzeichnis
- Workspace (standardmäßig `~/.openclaw/workspace-rescue`)
- Name des verwalteten Dienstes

erhält.

Die Prompts sind ansonsten dieselben wie beim normalen Onboarding.

## Allgemeines Multi-Gateway-Setup

Das oben gezeigte Rescue-Bot-Layout ist der einfachste Standard, aber dasselbe Isolationsmuster
funktioniert für jedes Paar oder jede Gruppe von Gateways auf einem Host.

Für ein allgemeineres Setup gib jedem zusätzlichen Gateway sein eigenes benanntes Profil und seinen
eigenen Basis-Port:

```bash
# main (Standardprofil)
openclaw setup
openclaw gateway --port 18789

# zusätzliches Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Wenn du möchtest, dass beide Gateways benannte Profile verwenden, funktioniert das ebenfalls:

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

Verwende den Schnellstart für den Rescue-Bot, wenn du eine Fallback-Operator-Lane möchtest. Verwende das
allgemeine Profilmuster, wenn du mehrere langlebige Gateways für
verschiedene Kanäle, Mandanten, Workspaces oder operative Rollen möchtest.

## Isolations-Checkliste

Halte diese Werte pro Gateway-Instanz eindeutig:

- `OPENCLAW_CONFIG_PATH` — Konfigurationsdatei pro Instanz
- `OPENCLAW_STATE_DIR` — Sitzungen, Zugangsdaten, Caches pro Instanz
- `agents.defaults.workspace` — Workspace-Root pro Instanz
- `gateway.port` (oder `--port`) — eindeutig pro Instanz
- abgeleitete Browser-/Canvas-/CDP-Ports

Wenn diese gemeinsam genutzt werden, bekommst du Konfigurations-Races und Portkonflikte.

## Port-Zuordnung (abgeleitet)

Basis-Port = `gateway.port` (oder `OPENCLAW_GATEWAY_PORT` / `--port`).

- Port des Browser-Control-Service = Basis + 2 (nur local loopback)
- Canvas-Host wird auf dem Gateway-HTTP-Server bereitgestellt (derselbe Port wie `gateway.port`)
- Browser-Profil-CDP-Ports werden automatisch aus `browser.controlPort + 9 .. + 108` zugewiesen

Wenn du einen dieser Werte in der Konfiguration oder per env überschreibst, musst du ihn pro Instanz eindeutig halten.

## Hinweise zu Browser/CDP (häufige Stolperfalle)

- **Pinne** `browser.cdpUrl` **nicht** auf dieselben Werte bei mehreren Instanzen.
- Jede Instanz benötigt ihren eigenen Browser-Control-Port und eigenen CDP-Bereich (abgeleitet von ihrem Gateway-Port).
- Wenn du explizite CDP-Ports benötigst, setze `browser.profiles.<name>.cdpPort` pro Instanz.
- Remote-Chrome: verwende `browser.profiles.<name>.cdpUrl` (pro Profil, pro Instanz).

## Beispiel mit manuellen env vars

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

- `gateway status --deep` hilft dabei, veraltete `launchd`-/`systemd`-/`schtasks`-Dienste aus älteren Installationen zu erkennen.
- Warntext von `gateway probe` wie `multiple reachable gateways detected` ist nur dann erwartbar, wenn du absichtlich mehr als ein isoliertes Gateway ausführst.

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Lock](/de/gateway/gateway-lock)
- [Konfiguration](/de/gateway/configuration)
