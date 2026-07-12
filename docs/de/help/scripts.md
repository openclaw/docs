---
read_when:
    - Skripte aus dem Repository ausführen
    - Skripte unter ./scripts hinzufügen oder ändern
summary: 'Repository-Skripte: Zweck, Umfang und Sicherheitshinweise'
title: Skripte
x-i18n:
    generated_at: "2026-07-12T15:25:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` enthält Hilfsskripte für lokale Workflows und Betriebsaufgaben. Verwenden Sie diese, wenn eine Aufgabe eindeutig an ein Skript gebunden ist; andernfalls bevorzugen Sie die CLI.

## Konventionen

- Skripte sind **optional**, sofern nicht in der Dokumentation oder in Release-Checklisten auf sie verwiesen wird.
- Bevorzugen Sie vorhandene CLI-Schnittstellen (Beispiel: `openclaw models status --check`).
- Gehen Sie davon aus, dass Skripte hostspezifisch sind; lesen Sie sie, bevor Sie sie auf einem neuen Rechner ausführen.

## Skripte zur Authentifizierungsüberwachung

Die allgemeine Modellauthentifizierung wird unter [Authentifizierung](/de/gateway/authentication) behandelt. Die folgenden Skripte bilden ein separates, optionales System zur Überwachung eines **Claude Code CLI-Abonnement-Tokens** auf einem entfernten/headless Host und zur erneuten Authentifizierung über ein Smartphone:

- `scripts/setup-auth-system.sh` – einmalige Einrichtung: Prüft die aktuelle Authentifizierung, unterstützt beim Erzeugen eines langlebigen `claude setup-token` und gibt Installationsschritte für systemd/Termux aus.
- `scripts/claude-auth-status.sh [full|json|simple]` – prüft den Authentifizierungsstatus von Claude Code und OpenClaw.
- `scripts/auth-monitor.sh` – fragt den Status regelmäßig ab und sendet eine Benachrichtigung (über OpenClaw Send und/oder ntfy.sh), wenn sich der Token seinem Ablauf nähert. Umgebungsvariablen: `WARN_HOURS` (Standardwert `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`. Führen Sie es mithilfe der mitgelieferten `scripts/systemd/openclaw-auth-monitor.{service,timer}` nach Zeitplan aus (alle 30 Minuten).
- `scripts/mobile-reauth.sh` – führt `claude setup-token` erneut aus und gibt URLs aus, die auf einem Smartphone geöffnet werden können; vorgesehen für die Verwendung per SSH aus Termux.
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` – Termux:Widget-Skripte, die per SSH eine Verbindung zum Host herstellen, eine Statusmeldung einblenden und bei abgelaufener Authentifizierung die Konsole/Anweisungen zur erneuten Authentifizierung öffnen.

## GitHub-Lesehilfe

Verwenden Sie `scripts/gh-read`, wenn `gh` für repositorybezogene Leseaufrufe das Installationstoken einer GitHub App verwenden soll, während das normale `gh` für Schreibaktionen mit Ihrer persönlichen Anmeldung verbunden bleibt.

Erforderliche Umgebungsvariablen:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Optionale Umgebungsvariablen:

- `OPENCLAW_GH_READ_INSTALLATION_ID`, wenn Sie die repositorybasierte Ermittlung der Installation überspringen möchten
- `OPENCLAW_GH_READ_PERMISSIONS` als kommagetrennte Überschreibung für die anzufordernde Teilmenge der Leseberechtigungen

Reihenfolge der Repository-Ermittlung:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Beispiele:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Beim Hinzufügen von Skripten

- Halten Sie Skripte fokussiert und dokumentiert.
- Fügen Sie der relevanten Dokumentation einen kurzen Eintrag hinzu (oder erstellen Sie eine, falls sie fehlt).

## Verwandte Themen

- [Tests](/de/help/testing)
- [Live-Tests](/de/help/testing-live)
