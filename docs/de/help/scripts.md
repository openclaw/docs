---
read_when:
    - Skripte aus dem Repository ausführen
    - Skripte unter ./scripts hinzufügen oder ändern
summary: 'Repository-Skripte: Zweck, Umfang und Sicherheitshinweise'
title: Skripte
x-i18n:
    generated_at: "2026-05-06T06:51:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Das Verzeichnis `scripts/` enthält Hilfsskripte für lokale Workflows und Ops-Aufgaben.
Verwenden Sie diese, wenn eine Aufgabe klar mit einem Skript verbunden ist; bevorzugen Sie andernfalls die CLI.

## Konventionen

- Skripte sind **optional**, sofern sie nicht in Dokumentation oder Release-Checklisten referenziert werden.
- Bevorzugen Sie CLI-Oberflächen, wenn sie vorhanden sind (Beispiel: Die Authentifizierungsüberwachung verwendet `openclaw models status --check`).
- Gehen Sie davon aus, dass Skripte host-spezifisch sind; lesen Sie sie, bevor Sie sie auf einem neuen Rechner ausführen.

## Skripte zur Authentifizierungsüberwachung

Die Authentifizierungsüberwachung wird unter [Authentifizierung](/de/gateway/authentication) behandelt. Die Skripte unter `scripts/` sind optionale Extras für systemd/Termux-Workflows auf Telefonen.

## GitHub-Lesehelfer

Verwenden Sie `scripts/gh-read`, wenn `gh` für repo-bezogene Leseaufrufe ein Installationstoken einer GitHub App verwenden soll, während das normale `gh` für Schreibaktionen bei Ihrer persönlichen Anmeldung bleibt.

Erforderliche Umgebungsvariablen:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Optionale Umgebungsvariablen:

- `OPENCLAW_GH_READ_INSTALLATION_ID`, wenn Sie die repo-basierte Suche nach der Installation überspringen möchten
- `OPENCLAW_GH_READ_PERMISSIONS` als kommagetrennte Überschreibung für die Teilmenge der anzufordernden Leseberechtigungen

Reihenfolge der Repo-Auflösung:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Beispiele:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Beim Hinzufügen von Skripten

- Halten Sie Skripte fokussiert und dokumentiert.
- Fügen Sie einen kurzen Eintrag in der relevanten Dokumentation hinzu (oder erstellen Sie einen, falls er fehlt).

## Verwandte Themen

- [Tests](/de/help/testing)
- [Live-Tests](/de/help/testing-live)
