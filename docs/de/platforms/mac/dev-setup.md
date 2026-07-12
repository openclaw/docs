---
read_when:
    - Einrichten der macOS-Entwicklungsumgebung
summary: Einrichtungsanleitung für Entwickler, die an der OpenClaw-App für macOS arbeiten
title: macOS-Entwicklungsumgebung einrichten
x-i18n:
    generated_at: "2026-07-12T01:51:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS-Entwicklungsumgebung

Erstellen Sie die OpenClaw-macOS-Anwendung aus dem Quellcode und führen Sie sie aus.

## Voraussetzungen

- **Xcode 26.2+** (Swift-6.2-Toolchain) auf der neuesten macOS-Version, die über
  Software Update verfügbar ist.
- **Node.js 24 und pnpm** für den Gateway, die CLI und die Paketierungsskripte. Node
  22.19+ funktioniert ebenfalls.

## 1. Abhängigkeiten installieren

```bash
pnpm install
```

## 2. Anwendung erstellen und paketieren

```bash
./scripts/package-mac-app.sh
```

Erzeugt `dist/OpenClaw.app`. Ohne Apple-Developer-ID-Zertifikat greift das
Skript auf eine Ad-hoc-Signierung zurück.

Informationen zu Ausführungsmodi für die Entwicklung, Signierungsoptionen und zur Fehlerbehebung bei der Team-ID finden Sie unter
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Schneller Entwicklungszyklus vom Repository-Stammverzeichnis aus: `scripts/restart-mac.sh` (fügen Sie `--no-sign` für
die Ad-hoc-Signierung hinzu; TCC-Berechtigungen bleiben mit `--no-sign` nicht erhalten).

<Note>
Ad-hoc-signierte Anwendungen können Sicherheitsabfragen auslösen. Falls die Anwendung
sofort mit „Abort trap 6“ abstürzt, lesen Sie den Abschnitt [Fehlerbehebung](#troubleshooting).
</Note>

## 3. CLI und Gateway installieren

Die paketierte Anwendung enthält das kanonische Installationsprogramm `scripts/install-cli.sh`. Wählen Sie bei einem
neuen Profil während der Ersteinrichtung **This Mac** aus; die Anwendung installiert die
passende CLI und Laufzeitumgebung im Benutzerbereich, bevor sie den Gateway-Assistenten startet.

Installieren Sie zur manuellen Wiederherstellung der Entwicklungsumgebung selbst die passende CLI:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` und `bun add -g openclaw@<version>` funktionieren
ebenfalls. Node bleibt die empfohlene Laufzeitumgebung für den Gateway selbst.

## Fehlerbehebung

### Build schlägt fehl: Toolchain oder SDK stimmen nicht überein

Der Build der macOS-Anwendung setzt das neueste macOS-SDK und die Swift-6.2-Toolchain
(Xcode 26.2+) voraus.

```bash
xcodebuild -version
xcrun swift --version
```

Wenn die Versionen nicht übereinstimmen, aktualisieren Sie macOS/Xcode und führen Sie den Build erneut aus.

### Anwendung stürzt beim Erteilen einer Berechtigung ab

Wenn die Anwendung abstürzt, während Sie versuchen, den Zugriff auf **Speech Recognition** oder
**Microphone** zu erlauben, kann ein beschädigter TCC-Cache oder eine nicht übereinstimmende Signatur die Ursache sein.

1. Setzen Sie die TCC-Berechtigungen für die Debug-Bundle-ID zurück:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Falls dies fehlschlägt, ändern Sie vorübergehend `BUNDLE_ID` in
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh),
   um einen vollständig neuen Ausgangszustand in macOS zu erzwingen.

### Gateway bleibt dauerhaft bei „Starting...“

Prüfen Sie, ob ein Zombie-Prozess den Port belegt:

```bash
openclaw gateway status
openclaw gateway stop

# Wenn Sie keinen LaunchAgent verwenden (Entwicklungsmodus / manuelle Ausführungen), suchen Sie den Listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Wenn eine manuelle Ausführung den Port belegt, beenden Sie sie (Ctrl+C) oder beenden Sie als
letztes Mittel die oben ermittelte PID.

## Verwandte Themen

- [macOS-Anwendung](/de/platforms/macos)
- [Installationsübersicht](/de/install)
