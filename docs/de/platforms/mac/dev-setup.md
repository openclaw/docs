---
read_when:
    - Einrichten der macOS-Entwicklungsumgebung
summary: Einrichtungsanleitung für Entwickler, die an der OpenClaw-macOS-App arbeiten
title: macOS-Entwicklungsumgebung einrichten
x-i18n:
    generated_at: "2026-05-07T13:21:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b39b449570176f44305c98ec4f00482a8b75ad20174b80c93abc45df37ffa0bc
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS-Entwickler-Setup

Erstellen und starten Sie die OpenClaw-macOS-Anwendung aus dem Quellcode.

## Voraussetzungen

Bevor Sie die App erstellen, stellen Sie sicher, dass Folgendes installiert ist:

1. **Xcode 26.2+**: Erforderlich für die Swift-Entwicklung.
2. **Node.js 24 & pnpm**: Empfohlen für Gateway, CLI und Paketierungsskripte. Node 22 LTS, derzeit `22.16+`, bleibt aus Kompatibilitätsgründen unterstützt.

## 1. Abhängigkeiten installieren

Installieren Sie die projektweiten Abhängigkeiten:

```bash
pnpm install
```

## 2. App erstellen und paketieren

Um die macOS-App zu erstellen und als `dist/OpenClaw.app` zu paketieren, führen Sie aus:

```bash
./scripts/package-mac-app.sh
```

Wenn Sie kein Apple-Developer-ID-Zertifikat haben, verwendet das Skript automatisch **Ad-hoc-Signierung** (`-`).

Informationen zu Entwicklungs-Ausführungsmodi, Signierungsflags und zur Fehlerbehebung bei der Team-ID finden Sie in der README der macOS-App:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Hinweis**: Ad-hoc-signierte Apps können Sicherheitsabfragen auslösen. Wenn die App sofort mit "Abort trap 6" abstürzt, lesen Sie den Abschnitt [Fehlerbehebung](#troubleshooting).

## 3. CLI installieren

Die macOS-App erwartet eine globale Installation der `openclaw`-CLI, um Hintergrundaufgaben zu verwalten.

**So installieren Sie sie (empfohlen):**

1. Öffnen Sie die OpenClaw-App.
2. Wechseln Sie zum Einstellungs-Tab **Allgemein**.
3. Klicken Sie auf **"CLI installieren"**.

Alternativ installieren Sie sie manuell:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` und `bun add -g openclaw@<version>` funktionieren ebenfalls.
Für die Gateway-Laufzeit bleibt Node der empfohlene Weg.

## Fehlerbehebung

### Build schlägt fehl: Toolchain- oder SDK-Abweichung

Der Build der macOS-App erwartet das neueste macOS-SDK und die Swift-6.2-Toolchain.

**Systemabhängigkeiten (erforderlich):**

- **Neueste in Softwareupdate verfügbare macOS-Version** (erforderlich für Xcode-26.2-SDKs)
- **Xcode 26.2** (Swift-6.2-Toolchain)

**Prüfungen:**

```bash
xcodebuild -version
xcrun swift --version
```

Wenn die Versionen nicht übereinstimmen, aktualisieren Sie macOS/Xcode und führen Sie den Build erneut aus.

### App stürzt beim Erteilen von Berechtigungen ab

Wenn die App abstürzt, wenn Sie versuchen, Zugriff auf **Spracherkennung** oder **Mikrofon** zu erlauben, kann dies an einem beschädigten TCC-Cache oder einer Signaturabweichung liegen.

**Behebung:**

1. Setzen Sie die TCC-Berechtigungen zurück:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Wenn das fehlschlägt, ändern Sie vorübergehend die `BUNDLE_ID` in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), um unter macOS einen "sauberen Neustart" zu erzwingen.

### Gateway bleibt dauerhaft bei "Startet..."

Wenn der Gateway-Status bei "Startet..." bleibt, prüfen Sie, ob ein Zombie-Prozess den Port belegt:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Wenn ein manueller Lauf den Port belegt, stoppen Sie diesen Prozess (Ctrl+C). Als letzten Ausweg beenden Sie die oben gefundene PID.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Installationsübersicht](/de/install)
