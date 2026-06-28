---
read_when:
    - Auswahl eines Onboarding-Pfads
    - Eine neue Umgebung einrichten
sidebarTitle: Onboarding Overview
summary: Übersicht über die Onboarding-Optionen und -Abläufe von OpenClaw
title: Übersicht zum Onboarding
x-i18n:
    generated_at: "2026-05-10T19:52:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9b375b9090250992b9deead25ae6502592cb63c9774204782b2d4f69d8f3395
    source_path: start/onboarding-overview.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw hat zwei Onboarding-Pfade. Beide konfigurieren Authentifizierung, den Gateway und
optionale Chat-Kanäle - sie unterscheiden sich nur darin, wie Sie mit der Einrichtung interagieren.

## Welchen Pfad sollte ich verwenden?

|                | CLI-Onboarding                         | macOS-App-Onboarding      |
| -------------- | -------------------------------------- | ------------------------- |
| **Plattformen**  | macOS, Linux, Windows (nativ oder WSL2) | Nur macOS                |
| **Oberfläche**  | Terminal-Assistent                        | Geführte UI in der App      |
| **Am besten für**   | Server, Headless-Umgebungen, volle Kontrolle        | Desktop-Mac, visuelle Einrichtung |
| **Automatisierung** | `--non-interactive` für Skripte        | Nur manuell               |
| **Befehl**    | `openclaw onboard`                     | App starten            |

Die meisten Benutzer sollten mit dem **CLI-Onboarding** beginnen - es funktioniert überall und gibt
Ihnen die meiste Kontrolle.

## Was das Onboarding konfiguriert

Unabhängig davon, welchen Pfad Sie wählen, richtet das Onboarding Folgendes ein:

1. **Modell-Provider und Authentifizierung** - API-Schlüssel, OAuth oder Setup-Token für Ihren gewählten Provider
2. **Workspace** - Verzeichnis für Agent-Dateien, Bootstrap-Vorlagen und Memory
3. **Gateway** - Port, Bind-Adresse, Authentifizierungsmodus
4. **Kanäle** (optional) - integrierte und gebündelte Chat-Kanäle wie
   iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp und weitere
5. **Daemon** (optional) - Hintergrunddienst, damit der Gateway automatisch startet

## CLI-Onboarding

In einem beliebigen Terminal ausführen:

```bash
openclaw onboard
```

Fügen Sie `--install-daemon` hinzu, um den Hintergrunddienst ebenfalls in einem Schritt zu installieren.

Vollständige Referenz: [Onboarding (CLI)](/de/start/wizard)
CLI-Befehlsdokumentation: [`openclaw onboard`](/de/cli/onboard)

## macOS-App-Onboarding

Öffnen Sie die OpenClaw-App. Der Assistent beim ersten Start führt Sie durch dieselben Schritte
mit einer visuellen Oberfläche.

Vollständige Referenz: [Onboarding (macOS-App)](/de/start/onboarding)

## Benutzerdefinierte oder nicht aufgeführte Provider

Wenn Ihr Provider im Onboarding nicht aufgeführt ist, wählen Sie **Benutzerdefinierter Provider** und
geben Sie Folgendes ein:

- API-Kompatibilitätsmodus (OpenAI-kompatibel, Anthropic-kompatibel oder automatische Erkennung)
- Basis-URL und API-Schlüssel
- Modell-ID und optionaler Alias

Mehrere benutzerdefinierte Endpunkte können nebeneinander bestehen - jeder erhält seine eigene Endpunkt-ID.

## Verwandte Themen

- [Erste Schritte](/de/start/getting-started)
- [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference)
