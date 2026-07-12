---
read_when:
    - Auswahl eines Onboarding-Pfads
    - Eine neue Umgebung einrichten
sidebarTitle: Onboarding Overview
summary: Überblick über die Onboarding-Optionen und -Abläufe von OpenClaw
title: Onboarding-Übersicht
x-i18n:
    generated_at: "2026-07-12T15:54:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw bietet ein Onboarding im Terminal und in der macOS-App. Beide richten zuerst die Inferenz ein:
Sie erkennen vorhandenen KI-Zugriff, erfordern eine erfolgreiche Live-Completion und starten erst dann
Crestodian, um die verbleibende Einrichtung zu konfigurieren. Ein erreichbarer, konfigurierter Gateway,
dessen Standard-Agent bereits über ein konfiguriertes Modell verfügt, überspringt das Onboarding und öffnet
die normale Agent-Benutzeroberfläche. Der Terminal-Ablauf bietet außerdem den vollständigen klassischen Assistenten für
eine detaillierte Einrichtung.

## Welchen Weg sollte ich verwenden?

|                 | CLI-Onboarding                              | Onboarding in der macOS-App            |
| --------------- | ------------------------------------------- | --------------------------------------- |
| **Plattformen** | macOS, Linux, Windows (nativ oder mit WSL2) | Nur macOS                               |
| **Oberfläche**  | Inferenzeinrichtung, dann Crestodian        | Inferenzeinrichtung, dann Crestodian    |
| **Ideal für**   | Server, Headless-Betrieb, volle Kontrolle   | Desktop-Mac, visuelle Einrichtung       |
| **Automatisierung** | `--non-interactive` für Skripte         | Nur manuell                             |
| **Befehl**      | `openclaw onboard`                          | App starten                             |

Die meisten Benutzer sollten mit dem **CLI-Onboarding** beginnen — es funktioniert überall und bietet
Ihnen die größtmögliche Kontrolle.

## Was das Onboarding konfiguriert

Die geführte Inferenzphase richtet nur Folgendes ein:

1. **Modell-Provider und Authentifizierung** — erkannter Zugriff oder ein verifizierter API-Schlüssel
2. **Verifizierte Inferenz** — eine echte Completion mit dem effektiven
   Modell des Standard-Agenten

Nachdem diese Completion erfolgreich war, kann Crestodian den Workspace, den Gateway,
den Gateway-Dienst, Kanäle, Agenten, Plugins und weitere optionale Funktionen konfigurieren.

Der klassische CLI-Assistent kann zusätzlich Folgendes konfigurieren:

1. **Kanäle** (optional) — integrierte und gebündelte Chatkanäle wie
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp und weitere
2. **Erweiterte Gateway-Steuerung** — Remote-Modus, Netzwerkeinstellungen und Daemon-Auswahl

## CLI-Onboarding

Führen Sie den folgenden Befehl in einem beliebigen Terminal aus:

```bash
openclaw onboard
```

Der geführte Ablauf erkennt vorhandenen KI-Zugriff, testet Kandidaten der Reihe nach live,
wechselt bei einem Fehler zum nächsten und bietet eine maskierte manuelle Schlüsseleingabe an. Er speichert das
Modell und die Anmeldedaten erst nach einer erfolgreichen Completion und startet anschließend Crestodian,
um den Workspace, den Gateway, Kanäle, Agenten, Plugins und weitere
optionale Funktionen zu konfigurieren. Es gibt weder Crestodian vor der Inferenz noch einen Pfad zum Überspringen der KI oder
eine Übergabe an den klassischen Assistenten innerhalb des Ablaufs. Beenden Sie den Vorgang und führen Sie `openclaw onboard --classic` aus, wenn Sie
stattdessen den klassischen Assistenten verwenden möchten.

Nach erfolgreicher Inferenz kann Crestodian die Kanaleinrichtung an einen Terminal-Assistenten
mit maskierter Eingabe übergeben. Dabei wird weder die geführte noch die klassische Provider-Einrichtung geöffnet. Beenden Sie Crestodian und
führen Sie `openclaw onboard` aus, um den Modell-Provider oder dessen Authentifizierung zu ändern.

Verwenden Sie `openclaw onboard --classic` für die detaillierte Einrichtung von Modell und Authentifizierung, Kanälen, Skills,
Remote-Gateway oder Importen. Durch Hinzufügen von `--install-daemon` wird ebenfalls der
klassische Ablauf ausgewählt und der Hintergrunddienst in einem Schritt installiert. Verwenden Sie `openclaw
crestodian` für die dialogbasierte Einrichtung und Reparatur außerhalb der Inferenz. `openclaw
onboard --modern` ist ein Kompatibilitätsalias, der dieselbe Live-Inferenz-
Prüfung verwendet.

Vollständige Referenz: [Onboarding (CLI)](/de/start/wizard)
Dokumentation zum CLI-Befehl: [`openclaw onboard`](/de/cli/onboard)

## Onboarding in der macOS-App

Öffnen Sie die OpenClaw-App. Wenn ihr konfigurierter lokaler oder entfernter Gateway erreichbar ist
und der Standard-Agent bereits über ein konfiguriertes Modell verfügt, überspringt die App das Onboarding
und Crestodian und öffnet sofort die normale Agent-Benutzeroberfläche.

Bei einem neuen oder unvollständig eingerichteten Gateway erkennt der Ablauf beim ersten Start vorhandenen KI-
Zugriff (Claude Code, Codex oder API-Schlüssel), testet die beste
Option live und speichert sie erst nach einer echten Antwort — mit automatischem Rückgriff auf Alternativen und
einem verifizierten Schritt zur manuellen Eingabe eines API-Schlüssels, wenn nichts gefunden wird. Vertrauliche
Anmeldedaten werden maskiert eingegeben. Sobald die Inferenz erfolgreich ist, startet Crestodian und
hilft bei der Konfiguration der übrigen Komponenten.

Gemini CLI bleibt nach der Einrichtung für normale Agenten verfügbar, wird für diese
Inferenzprüfung jedoch nicht angeboten, da damit die Ausführung der Prüfung ohne Tools nicht erzwungen werden kann.

Vollständige Referenz: [Onboarding (macOS-App)](/de/start/onboarding)

## Benutzerdefinierte oder nicht aufgeführte Provider

Wenn Ihr Provider nicht aufgeführt ist, führen Sie `openclaw onboard --classic` aus, wählen Sie
**Benutzerdefinierter Provider** und geben Sie Folgendes ein:

- Endpoint-Kompatibilität: OpenAI-kompatibel (`/chat/completions`), mit OpenAI Responses kompatibel (`/responses`), Anthropic-kompatibel (`/messages`) oder unbekannt (prüft alle drei und erkennt sie automatisch)
- Basis-URL und API-Schlüssel (der API-Schlüssel ist optional, wenn der Endpoint keinen erfordert)
- Modell-ID und optionaler Modellalias

Mehrere benutzerdefinierte Endpoints können gleichzeitig vorhanden sein — jeder erhält eine eigene Endpoint-ID.

## Verwandte Themen

- [Erste Schritte](/de/start/getting-started)
- [Referenz zur CLI-Einrichtung](/de/start/wizard-cli-reference)
