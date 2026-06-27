---
read_when:
    - Mehr als einen Gateway auf demselben Rechner ausführen
    - Sie benötigen pro Gateway eine isolierte Konfiguration, einen isolierten Zustand und isolierte Ports
summary: Mehrere OpenClaw Gateways auf einem Host ausführen (Isolierung, Ports und Profile)
title: Mehrere Gateways
x-i18n:
    generated_at: "2026-06-27T17:31:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Die meisten Setups sollten ein Gateway verwenden, da ein einzelnes Gateway mehrere Messaging-Verbindungen und Agenten verarbeiten kann. Wenn Sie stärkere Isolation oder Redundanz benötigen (z. B. einen Rescue-Bot), führen Sie separate Gateways mit isolierten Profilen/Ports aus.

## Beste empfohlene Einrichtung

Für die meisten Benutzer ist die einfachste Rescue-Bot-Einrichtung:

- den Haupt-Bot im Standardprofil behalten
- den Rescue-Bot mit `--profile rescue` ausführen
- einen vollständig separaten Telegram-Bot für das Rescue-Konto verwenden
- den Rescue-Bot auf einem anderen Basisport wie `19789` betreiben

Dadurch bleibt der Rescue-Bot vom Haupt-Bot isoliert, sodass er Debugging durchführen oder
Konfigurationsänderungen anwenden kann, wenn der primäre Bot ausgefallen ist. Lassen Sie mindestens 20 Ports zwischen
Basisports frei, damit die abgeleiteten Browser-/Canvas-/CDP-Ports niemals kollidieren.

## Rescue-Bot-Schnellstart

Verwenden Sie dies als Standardweg, sofern Sie keinen guten Grund haben, etwas
anderes zu tun:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Wenn Ihr Haupt-Bot bereits läuft, ist das normalerweise alles, was Sie benötigen.

Während `openclaw --profile rescue onboard`:

- verwenden Sie das separate Telegram-Bot-Token
- behalten Sie das Profil `rescue` bei
- verwenden Sie einen Basisport, der mindestens 20 höher ist als der des Haupt-Bots
- akzeptieren Sie den standardmäßigen Rescue-Workspace, sofern Sie nicht bereits selbst einen verwalten

Wenn das Onboarding den Rescue-Dienst bereits für Sie installiert hat, ist das abschließende
`gateway install` nicht erforderlich.

## Warum das funktioniert

Der Rescue-Bot bleibt unabhängig, weil er über eigene Komponenten verfügt:

- Profil/Konfiguration
- Zustandsverzeichnis
- Workspace
- Basisport (plus abgeleitete Ports)
- Telegram-Bot-Token

Für die meisten Setups verwenden Sie ein vollständig separates Telegram-Bot für das Rescue-Profil:

- einfach auf Operatoren beschränkbar
- separates Bot-Token und separate Identität
- unabhängig von der Kanal-/App-Installation des Haupt-Bots
- einfacher DM-basierter Wiederherstellungsweg, wenn der Haupt-Bot defekt ist

## Was `--profile rescue onboard` ändert

`openclaw --profile rescue onboard` verwendet den normalen Onboarding-Ablauf, schreibt aber
alles in ein separates Profil.

In der Praxis bedeutet das, dass der Rescue-Bot eigene Komponenten erhält:

- Konfigurationsdatei
- Zustandsverzeichnis
- Workspace (standardmäßig `~/.openclaw/workspace-rescue`)
- Name des verwalteten Dienstes

Die Eingabeaufforderungen sind ansonsten dieselben wie beim normalen Onboarding.

## Allgemeine Multi-Gateway-Einrichtung

Das oben gezeigte Rescue-Bot-Layout ist die einfachste Standardeinstellung, aber dasselbe Isolationsmuster
funktioniert für jedes Paar oder jede Gruppe von Gateways auf einem Host.

Für eine allgemeinere Einrichtung geben Sie jedem zusätzlichen Gateway ein eigenes benanntes Profil und einen
eigenen Basisport:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
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

Verwenden Sie den Rescue-Bot-Schnellstart, wenn Sie eine Fallback-Operator-Spur benötigen. Verwenden Sie das
allgemeine Profilmuster, wenn Sie mehrere langlebige Gateways für
verschiedene Kanäle, Mandanten, Workspaces oder Betriebsrollen benötigen.

## Isolations-Checkliste

Halten Sie diese pro Gateway-Instanz eindeutig:

- `OPENCLAW_CONFIG_PATH` — Konfigurationsdatei pro Instanz
- `OPENCLAW_STATE_DIR` — Sitzungen, Zugangsdaten und Caches pro Instanz
- `agents.defaults.workspace` — Workspace-Root pro Instanz
- `gateway.port` (oder `--port`) — eindeutig pro Instanz
- abgeleitete Browser-/Canvas-/CDP-Ports

Wenn diese gemeinsam genutzt werden, kommt es zu Konfigurationsrennen und Portkonflikten.

## Portzuordnung (abgeleitet)

Basisport = `gateway.port` (oder `OPENCLAW_GATEWAY_PORT` / `--port`).

- Port des Browser-Steuerungsdienstes = Basis + 2 (nur local loopback)
- Canvas-Host wird über den HTTP-Server des Gateways bereitgestellt (derselbe Port wie `gateway.port`)
- CDP-Ports des Browserprofils werden automatisch aus `browser.controlPort + 9 .. + 108` zugewiesen

Wenn Sie eine dieser Einstellungen in der Konfiguration oder Umgebung überschreiben, müssen Sie sie pro Instanz eindeutig halten.

## Browser-/CDP-Hinweise (häufige Fehlerquelle)

- Fixieren Sie `browser.cdpUrl` **nicht** auf dieselben Werte über mehrere Instanzen hinweg.
- Jede Instanz benötigt ihren eigenen Browser-Steuerungsport und CDP-Bereich (abgeleitet von ihrem Gateway-Port).
- Wenn Sie explizite CDP-Ports benötigen, setzen Sie `browser.profiles.<name>.cdpPort` pro Instanz.
- Remote-Chrome: verwenden Sie `browser.profiles.<name>.cdpUrl` (pro Profil, pro Instanz).

## Manuelles env-Beispiel

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

Interpretation:

- `gateway status --deep` hilft dabei, veraltete launchd-/systemd-/schtasks-Dienste aus älteren Installationen zu erkennen.
- Warntext von `gateway probe` wie `multiple reachable gateway identities detected` wird nur erwartet, wenn Sie absichtlich mehr als ein isoliertes Gateway ausführen oder wenn OpenClaw nicht nachweisen kann, dass erreichbare Probe-Ziele dasselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zu demselben Gateway ist ein Gateway mit mehreren Transporten, selbst wenn sich die Transportports unterscheiden.

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Sperre](/de/gateway/gateway-lock)
- [Konfiguration](/de/gateway/configuration)
