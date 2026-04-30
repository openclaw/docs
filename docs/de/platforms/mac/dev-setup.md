---
read_when:
    - Einrichten der macOS-Entwicklungsumgebung
summary: Einrichtungsleitfaden für Entwickler, die an der OpenClaw-macOS-App arbeiten
title: macOS-Entwicklungssetup
x-i18n:
    generated_at: "2026-04-30T07:03:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS-Entwickler-Setup

Erstellen Sie die OpenClaw-macOS-Anwendung aus dem Quellcode und führen Sie sie aus.

## Voraussetzungen

Stellen Sie vor dem Erstellen der App sicher, dass Folgendes installiert ist:

1. **Xcode 26.2+**: Erforderlich für die Swift-Entwicklung.
2. **Node.js 24 & pnpm**: Empfohlen für Gateway, CLI und Paketierungsskripte. Node 22 LTS, derzeit `22.14+`, wird aus Kompatibilitätsgründen weiterhin unterstützt.

## 1. Abhängigkeiten installieren

Installieren Sie die projektweiten Abhängigkeiten:

```bash
pnpm install
```

## 2. App erstellen und paketieren

Um die macOS-App zu erstellen und als `dist/OpenClaw.app` zu paketieren, führen Sie Folgendes aus:

```bash
./scripts/package-mac-app.sh
```

Wenn Sie kein Apple Developer ID-Zertifikat haben, verwendet das Skript automatisch **Ad-hoc-Signierung** (`-`).

Informationen zu Entwicklungs-Ausführungsmodi, Signierungs-Flags und Fehlerbehebung zur Team-ID finden Sie in der README der macOS-App:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Hinweis**: Ad-hoc-signierte Apps können Sicherheitshinweise auslösen. Wenn die App sofort mit "Abort trap 6" abstürzt, lesen Sie den Abschnitt [Fehlerbehebung](#troubleshooting).

## 3. CLI installieren

Die macOS-App erwartet eine globale Installation der `openclaw`-CLI, um Hintergrundaufgaben zu verwalten.

**So installieren Sie sie (empfohlen):**

1. Öffnen Sie die OpenClaw-App.
2. Wechseln Sie zum Einstellungstab **Allgemein**.
3. Klicken Sie auf **"CLI installieren"**.

Alternativ können Sie sie manuell installieren:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` und `bun add -g openclaw@<version>` funktionieren ebenfalls.
Für die Gateway-Laufzeit bleibt Node der empfohlene Weg.

## Fehlerbehebung

### Build schlägt fehl: Toolchain- oder SDK-Abweichung

Der Build der macOS-App erwartet das neueste macOS-SDK und die Swift-6.2-Toolchain.

**Systemabhängigkeiten (erforderlich):**

- **Neueste in Software Update verfügbare macOS-Version** (erforderlich durch Xcode-26.2-SDKs)
- **Xcode 26.2** (Swift-6.2-Toolchain)

**Prüfungen:**

```bash
xcodebuild -version
xcrun swift --version
```

Wenn die Versionen nicht übereinstimmen, aktualisieren Sie macOS/Xcode und führen Sie den Build erneut aus.

### App stürzt beim Erteilen von Berechtigungen ab

Wenn die App abstürzt, wenn Sie versuchen, den Zugriff auf **Spracherkennung** oder **Mikrofon** zu erlauben, kann dies an einem beschädigten TCC-Cache oder einer Signaturabweichung liegen.

**Behebung:**

1. Setzen Sie die TCC-Berechtigungen zurück:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Wenn das fehlschlägt, ändern Sie die `BUNDLE_ID` vorübergehend in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), um macOS zu einem "sauberen Ausgangszustand" zu zwingen.

### Gateway bleibt unbegrenzt bei "Wird gestartet..."

Wenn der Gateway-Status bei "Wird gestartet..." bleibt, prüfen Sie, ob ein Zombie-Prozess den Port belegt:

```bash
openclaw gateway status
openclaw gateway stop

# Wenn Sie keinen LaunchAgent verwenden (Entwicklungsmodus / manuelle Ausführungen), suchen Sie den Listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Wenn eine manuelle Ausführung den Port belegt, stoppen Sie diesen Prozess (Ctrl+C). Als letzten Ausweg beenden Sie die PID, die Sie oben gefunden haben.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Installationsübersicht](/de/install)
