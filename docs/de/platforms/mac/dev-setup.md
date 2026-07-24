---
read_when:
    - Einrichten der macOS-Entwicklungsumgebung
summary: Einrichtungsanleitung für Entwickler, die an der OpenClaw-App für macOS arbeiten
title: macOS-Entwicklungsumgebung
x-i18n:
    generated_at: "2026-07-24T05:09:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS-Entwicklerkonfiguration

Erstellen Sie die OpenClaw-macOS-Anwendung aus dem Quellcode und führen Sie sie aus.

## Voraussetzungen

- **Xcode 26.2+** (Swift-6.2-Toolchain) auf der neuesten macOS-Version, die über
  Software Update verfügbar ist.
- **Node.js 24.15+ und pnpm** für den Gateway, die CLI und die Paketierungsskripte. Node
  22.22.3+ funktioniert ebenfalls.

## 1. Abhängigkeiten installieren

```bash
pnpm install
```

## 2. App erstellen und paketieren

```bash
./scripts/package-mac-app.sh
```

Erzeugt `dist/OpenClaw.app`. Ohne ein Apple-Developer-ID-Zertifikat greift das
Skript auf eine Ad-hoc-Signierung zurück.

Informationen zu Entwicklungs-Ausführungsmodi, Signierungsoptionen und der Fehlerbehebung bei Team-IDs finden Sie unter
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Schneller Entwicklungszyklus vom Repository-Stammverzeichnis aus: `scripts/restart-mac.sh` (fügen Sie `--no-sign` für die
Ad-hoc-Signierung hinzu; TCC-Berechtigungen bleiben mit `--no-sign` nicht erhalten).

<Note>
Ad-hoc-signierte Apps können Sicherheitsabfragen auslösen. Wenn die App
sofort mit „Abort trap 6“ abstürzt, lesen Sie den Abschnitt [Fehlerbehebung](#troubleshooting).
</Note>

## 3. CLI und Gateway installieren

Die paketierte App enthält das kanonische Installationsprogramm `scripts/install-cli.sh`. Wählen Sie bei einem
neuen Profil während des Onboardings **This Mac** aus; die App installiert die
passende CLI und Laufzeitumgebung im Benutzerbereich, bevor sie den Gateway-Assistenten startet.

Installieren Sie zur manuellen Wiederherstellung der Entwicklungsumgebung die passende CLI selbst:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` und `bun add -g openclaw@<version>` funktionieren ebenfalls.
Node bleibt die empfohlene Laufzeitumgebung für den Gateway selbst.

## Fehlerbehebung

### Build schlägt fehl: Toolchain- oder SDK-Konflikt

Der Build der macOS-App erfordert das neueste macOS-SDK und die Swift-6.2-Toolchain
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Wenn die Versionen nicht übereinstimmen, aktualisieren Sie macOS/Xcode und führen Sie den Build erneut aus.

### App stürzt beim Erteilen einer Berechtigung ab

Wenn die App abstürzt, während Sie versuchen, den Zugriff auf **Speech Recognition** oder
**Microphone** zu erlauben, liegt möglicherweise ein beschädigter TCC-Cache oder ein Signaturkonflikt vor.

1. Setzen Sie die TCC-Berechtigungen für die Debug-Bundle-ID zurück:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Wenn dies fehlschlägt, ändern Sie vorübergehend `BUNDLE_ID` in
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh),
   um einen vollständigen Neuanfang unter macOS zu erzwingen.

### Gateway bleibt dauerhaft bei „Starting...“

Prüfen Sie, ob ein Zombieprozess den Port belegt:

```bash
openclaw gateway status
openclaw gateway stop

# Wenn Sie keinen LaunchAgent verwenden (Entwicklungsmodus/manuelle Ausführungen), suchen Sie den Listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Wenn eine manuelle Ausführung den Port belegt, beenden Sie sie (Strg+C) oder beenden Sie als
letztes Mittel die oben ermittelte PID.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Installationsübersicht](/de/install)
