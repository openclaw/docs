---
read_when:
    - macOS-Entwicklungsumgebung einrichten
summary: Einrichtungsanleitung für Entwickler, die an der OpenClaw-macOS-App arbeiten
title: macOS-Entwicklungsumgebung
x-i18n:
    generated_at: "2026-06-27T17:42:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS-Entwickler-Setup

Bauen und starten Sie die macOS-Anwendung von OpenClaw aus dem Quellcode.

## Voraussetzungen

Stellen Sie vor dem Bauen der App sicher, dass Folgendes installiert ist:

1. **Xcode 26.2+**: Erforderlich für die Swift-Entwicklung.
2. **Node.js 24 & pnpm**: Empfohlen für Gateway, CLI und Paketierungsskripte. Node 22 LTS, derzeit `22.19+`, bleibt aus Kompatibilitätsgründen unterstützt.

## 1. Abhängigkeiten installieren

Installieren Sie die projektweiten Abhängigkeiten:

```bash
pnpm install
```

## 2. App bauen und paketieren

Um die macOS-App zu bauen und als `dist/OpenClaw.app` zu paketieren, führen Sie aus:

```bash
./scripts/package-mac-app.sh
```

Wenn Sie kein Apple Developer ID-Zertifikat haben, verwendet das Skript automatisch **Ad-hoc-Signierung** (`-`).

Informationen zu Entwicklungs-Ausführungsmodi, Signierungs-Flags und Fehlerbehebung zur Team-ID finden Sie in der README der macOS-App:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Hinweis**: Ad-hoc-signierte Apps können Sicherheitshinweise auslösen. Wenn die App sofort mit „Abort trap 6“ abstürzt, lesen Sie den Abschnitt [Fehlerbehebung](#troubleshooting).

## 3. CLI installieren

Die macOS-App erwartet eine globale Installation der `openclaw`-CLI, um Hintergrundaufgaben zu verwalten.

**So installieren Sie sie (empfohlen):**

1. Öffnen Sie die OpenClaw-App.
2. Wechseln Sie zum Einstellungs-Tab **General**.
3. Klicken Sie auf **"Install CLI"**.

Alternativ können Sie sie manuell installieren:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` und `bun add -g openclaw@<version>` funktionieren ebenfalls.
Für die Gateway-Laufzeit bleibt Node der empfohlene Weg.

## Fehlerbehebung

### Build schlägt fehl: Toolchain- oder SDK-Nichtübereinstimmung

Der Build der macOS-App erwartet das neueste macOS SDK und die Swift-6.2-Toolchain.

**Systemabhängigkeiten (erforderlich):**

- **Neueste in Software Update verfügbare macOS-Version** (erforderlich von Xcode-26.2-SDKs)
- **Xcode 26.2** (Swift-6.2-Toolchain)

**Prüfungen:**

```bash
xcodebuild -version
xcrun swift --version
```

Wenn die Versionen nicht übereinstimmen, aktualisieren Sie macOS/Xcode und führen Sie den Build erneut aus.

### App stürzt beim Erteilen von Berechtigungen ab

Wenn die App abstürzt, wenn Sie versuchen, Zugriff auf **Speech Recognition** oder **Microphone** zu erlauben, kann dies an einem beschädigten TCC-Cache oder einer Signatur-Nichtübereinstimmung liegen.

**Behebung:**

1. Setzen Sie die TCC-Berechtigungen zurück:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Wenn das fehlschlägt, ändern Sie vorübergehend die `BUNDLE_ID` in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), um macOS zu einem „sauberen Neustart“ zu zwingen.

### Gateway bleibt dauerhaft bei „Starting...“

Wenn der Gateway-Status bei „Starting...“ bleibt, prüfen Sie, ob ein Zombie-Prozess den Port belegt:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Wenn ein manueller Lauf den Port belegt, stoppen Sie diesen Prozess (Ctrl+C). Beenden Sie als letzte Möglichkeit die oben gefundene PID.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Installationsübersicht](/de/install)
