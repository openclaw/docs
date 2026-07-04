---
read_when:
    - macOS-Entwicklungsumgebung einrichten
summary: Einrichtungsanleitung für Entwickler, die an der OpenClaw-macOS-App arbeiten
title: macOS-Entwicklungseinrichtung
x-i18n:
    generated_at: "2026-07-04T06:29:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS-Entwicklereinrichtung

Bauen und führen Sie die OpenClaw-macOS-Anwendung aus dem Quellcode aus.

## Voraussetzungen

Bevor Sie die App bauen, stellen Sie sicher, dass Folgendes installiert ist:

1. **Xcode 26.2+**: Erforderlich für die Swift-Entwicklung.
2. **Node.js 24 & pnpm**: Empfohlen für Gateway, CLI und Paketierungsskripte. Node 22 LTS, derzeit `22.19+`, wird aus Kompatibilitätsgründen weiterhin unterstützt.

## 1. Abhängigkeiten installieren

Installieren Sie die projektweiten Abhängigkeiten:

```bash
pnpm install
```

## 2. App bauen und paketieren

Um die macOS-App zu bauen und als `dist/OpenClaw.app` zu paketieren, führen Sie Folgendes aus:

```bash
./scripts/package-mac-app.sh
```

Wenn Sie kein Apple-Developer-ID-Zertifikat haben, verwendet das Skript automatisch **Ad-hoc-Signierung** (`-`).

Informationen zu Entwicklungs-Ausführungsmodi, Signierungs-Flags und Fehlerbehebung bei der Team-ID finden Sie in der README der macOS-App:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Hinweis**: Ad-hoc-signierte Apps können Sicherheitsabfragen auslösen. Wenn die App sofort mit „Abort trap 6“ abstürzt, lesen Sie den Abschnitt [Fehlerbehebung](#troubleshooting).

## 3. CLI und Gateway installieren

Die paketierte App bettet den kanonischen Installer `scripts/install-cli.sh` ein. Wählen Sie bei einem
frischen Profil während des Onboardings **Dieser Mac** aus; die App installiert die
passende Benutzerbereich-CLI und Runtime, bevor sie den Gateway-Assistenten startet.

Für die manuelle Wiederherstellung in der Entwicklung installieren Sie die passende CLI selbst:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` und `bun add -g openclaw@<version>` funktionieren ebenfalls.
Für die Gateway-Runtime bleibt Node der empfohlene Weg.

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

### App stürzt beim Erteilen einer Berechtigung ab

Wenn die App abstürzt, wenn Sie versuchen, Zugriff auf **Spracherkennung** oder **Mikrofon** zu erlauben, kann dies an einem beschädigten TCC-Cache oder einer Signaturabweichung liegen.

**Behebung:**

1. Setzen Sie die TCC-Berechtigungen zurück:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Wenn das fehlschlägt, ändern Sie die `BUNDLE_ID` vorübergehend in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), um unter macOS einen „sauberen Neustart“ zu erzwingen.

### Gateway hängt unbegrenzt bei „Starting...“

Wenn der Gateway-Status bei „Starting...“ bleibt, prüfen Sie, ob ein Zombie-Prozess den Port belegt:

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
